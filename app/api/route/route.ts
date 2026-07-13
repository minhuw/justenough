import retrievalIndexJson from "@/fixtures/retrieval-index.json";
import { listEvidenceCases } from "@/app/evidence-case-data";
import {
  buildCorpusVocabulary,
  caseId,
  makeRoutingDecision,
  profileTaskLocally,
  retrieveEvidence,
  targetSearchDocument,
} from "@/lib/routing/core";
import { OpenAIRoutingModels } from "@/lib/routing/openai";
import type {
  EmbeddingIndex,
  RerankJudgment,
  RoutingResult,
} from "@/lib/routing/types";

const cases = listEvidenceCases();
const casesById = new Map(cases.map((item) => [caseId(item), item]));
const vocabulary = buildCorpusVocabulary(cases);
const embeddingIndex = retrievalIndexJson as EmbeddingIndex;

function error(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Request body must be valid JSON.", 400);
  }

  if (!body || typeof body !== "object") return error("Request body is required.", 400);
  const input = body as { task?: unknown; reliabilityTarget?: unknown };
  const taskText = typeof input.task === "string" ? input.task.trim() : "";
  const reliabilityTarget =
    typeof input.reliabilityTarget === "number" ? input.reliabilityTarget : 0.8;

  if (taskText.length < 12 || taskText.length > 5_000) {
    return error("Task must contain between 12 and 5,000 characters.", 400);
  }
  if (reliabilityTarget < 0.5 || reliabilityTarget > 0.99) {
    return error("Reliability target must be between 0.5 and 0.99.", 400);
  }

  const warnings: string[] = [];
  const retrieval: RoutingResult["analysis"]["retrieval"] = ["lexical", "facets"];
  const apiKey = process.env.OPENAI_API_KEY;
  const llmEnabled = process.env.JUSTENOUGH_ENABLE_LLM === "true" && Boolean(apiKey);
  const models = llmEnabled && apiKey
    ? new OpenAIRoutingModels({
        apiKey,
        profileModel: process.env.JUSTENOUGH_PROFILE_MODEL ?? "gpt-5.6-luna",
        embeddingModel:
          embeddingIndex.model ??
          process.env.JUSTENOUGH_EMBEDDING_MODEL ??
          "text-embedding-3-small",
        embeddingDimensions: embeddingIndex.dimensions ?? undefined,
        baseUrl: process.env.OPENAI_BASE_URL,
      })
    : undefined;

  let profiler: RoutingResult["analysis"]["profiler"] = "local";
  let profile = profileTaskLocally(taskText, vocabulary);
  if (models) {
    try {
      profile = await models.profileTask(taskText);
      profiler = "llm";
    } catch {
      warnings.push("LLM profiling was unavailable; deterministic task parsing was used.");
    }
  } else {
    warnings.push("LLM profiling is disabled; deterministic task parsing was used.");
  }

  let targetEmbedding: number[] | undefined;
  const indexReady =
    embeddingIndex.model !== null &&
    embeddingIndex.dimensions !== null &&
    embeddingIndex.records.length === cases.length &&
    new Set(embeddingIndex.records.map((record) => record.case_id)).size === cases.length &&
    embeddingIndex.records.every(
      (record) =>
        casesById.has(record.case_id) &&
        record.embedding.length === embeddingIndex.dimensions,
    );
  if (models && indexReady) {
    try {
      [targetEmbedding] = await models.embed([targetSearchDocument(taskText, profile)]);
      retrieval.push("embedding");
    } catch {
      warnings.push("Semantic embeddings were unavailable; lexical and facet retrieval were used.");
    }
  } else if (!indexReady) {
    warnings.push("The corpus embedding index has not been generated; semantic retrieval was skipped.");
  }

  const preliminary = retrieveEvidence({
    taskText,
    profile,
    cases,
    embeddingIndex: indexReady ? embeddingIndex : undefined,
    targetEmbedding,
    limit: 16,
  });
  let judgments: RerankJudgment[] = [];
  if (models && profiler === "llm") {
    try {
      const candidates = preliminary
        .map((match) => casesById.get(caseId(match)))
        .filter((item) => item !== undefined);
      judgments = await models.rerank(profile, candidates);
      if (judgments.length > 0) retrieval.push("llm_rerank");
    } catch {
      warnings.push("LLM reranking was unavailable; deterministic ranking was used.");
    }
  }

  const matches = retrieveEvidence({
    taskText,
    profile,
    cases,
    embeddingIndex: indexReady ? embeddingIndex : undefined,
    targetEmbedding,
    rerankJudgments: judgments,
    limit: 8,
  });
  const result = makeRoutingDecision({
    profile,
    matches,
    reliabilityTarget,
    profiler,
    retrieval,
    warnings,
    casesById,
  });

  return Response.json(result, {
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
