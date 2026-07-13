import type { EvidenceCase } from "@/app/evidence-data";
import { caseId } from "./core";
import type {
  RerankJudgment,
  TargetTaskProfile,
} from "./types";

const PROFILE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "interaction",
    "intents",
    "technologies",
    "languages",
    "workSurfaces",
    "expectedArtifacts",
    "difficultyFactors",
    "constraints",
    "unknowns",
  ],
  properties: {
    summary: { type: "string" },
    interaction: { type: "string", enum: ["repository", "terminal", "unknown"] },
    intents: { type: "array", items: { type: "string" } },
    technologies: { type: "array", items: { type: "string" } },
    languages: { type: "array", items: { type: "string" } },
    workSurfaces: { type: "array", items: { type: "string" } },
    expectedArtifacts: { type: "array", items: { type: "string" } },
    difficultyFactors: { type: "array", items: { type: "string" } },
    constraints: { type: "array", items: { type: "string" } },
    unknowns: { type: "array", items: { type: "string" } },
  },
} as const;

const RERANK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["judgments"],
  properties: {
    judgments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "caseId",
          "similarity",
          "matchedFacets",
          "mismatchedFacets",
          "unknownFacets",
        ],
        properties: {
          caseId: { type: "string" },
          similarity: { type: "number", minimum: 0, maximum: 1 },
          matchedFacets: { type: "array", items: { type: "string" } },
          mismatchedFacets: { type: "array", items: { type: "string" } },
          unknownFacets: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

type OpenAIResponse = {
  error?: { message?: string };
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
};

type EmbeddingResponse = {
  error?: { message?: string };
  data?: Array<{ index: number; embedding: number[] }>;
};

function responseText(payload: OpenAIResponse) {
  for (const output of payload.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "refusal") {
        throw new Error(content.refusal || "The profiling request was refused.");
      }
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("The model response did not contain structured output text.");
}

function clampStrings(values: unknown, maximum: number) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is string => typeof value === "string"))]
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, maximum);
}

function validateProfile(value: unknown): TargetTaskProfile {
  if (!value || typeof value !== "object") throw new Error("Invalid task profile.");
  const profile = value as Record<string, unknown>;
  const interaction = profile.interaction;
  if (
    interaction !== "repository" &&
    interaction !== "terminal" &&
    interaction !== "unknown"
  ) {
    throw new Error("Invalid task interaction mode.");
  }

  return {
    summary: typeof profile.summary === "string" ? profile.summary.trim().slice(0, 500) : "",
    interaction,
    intents: clampStrings(profile.intents, 4),
    technologies: clampStrings(profile.technologies, 12),
    languages: clampStrings(profile.languages, 8),
    workSurfaces: clampStrings(profile.workSurfaces, 5),
    expectedArtifacts: clampStrings(profile.expectedArtifacts, 8),
    difficultyFactors: clampStrings(profile.difficultyFactors, 5),
    constraints: clampStrings(profile.constraints, 8),
    unknowns: clampStrings(profile.unknowns, 8),
  };
}

export class OpenAIRoutingModels {
  constructor(
    private readonly options: {
      apiKey: string;
      profileModel: string;
      embeddingModel: string;
      embeddingDimensions?: number;
      baseUrl?: string;
    },
  ) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.options.baseUrl ?? "https://api.openai.com/v1"}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.options.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as T & { error?: { message?: string } };
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `OpenAI request failed with ${response.status}.`);
    }
    return payload;
  }

  async profileTask(taskText: string): Promise<TargetTaskProfile> {
    const payload = await this.post<OpenAIResponse>("/responses", {
      model: this.options.profileModel,
      store: false,
      input: [
        {
          role: "system",
          content:
            "Extract a source-grounded software task profile for benchmark retrieval. Do not estimate model capability or difficulty. Use unknown when the interaction mode is not stated. Keep facets short and factual.",
        },
        { role: "user", content: taskText },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "target_task_profile",
          strict: true,
          schema: PROFILE_SCHEMA,
        },
      },
    });
    return validateProfile(JSON.parse(responseText(payload)));
  }

  async embed(inputs: string[]) {
    const payload = await this.post<EmbeddingResponse>("/embeddings", {
      model: this.options.embeddingModel,
      input: inputs,
      encoding_format: "float",
      ...(this.options.embeddingDimensions
        ? { dimensions: this.options.embeddingDimensions }
        : {}),
    });
    const rows = [...(payload.data ?? [])].sort((left, right) => left.index - right.index);
    if (rows.length !== inputs.length || rows.some((row) => !Array.isArray(row.embedding))) {
      throw new Error("The embedding response did not match the requested inputs.");
    }
    return rows.map((row) => row.embedding);
  }

  async rerank(profile: TargetTaskProfile, candidates: EvidenceCase[]) {
    const allowedIds = new Set(candidates.map(caseId));
    const payload = await this.post<OpenAIResponse>("/responses", {
      model: this.options.profileModel,
      store: false,
      input: [
        {
          role: "system",
          content:
            "Judge task similarity only. Compare intent, ecosystem, work surface, artifact, verification burden, scope, and environment. Do not inspect outcomes and do not recommend a model. Return one judgment for every supplied case ID.",
        },
        {
          role: "user",
          content: JSON.stringify({
            target: profile,
            candidates: candidates.map((item) => ({
              caseId: caseId(item),
              title: item.profile.title,
              description: item.profile.description,
              interaction: item.profile.interaction,
              intents: item.profile.intents,
              technologies: item.profile.technologies,
              languages: item.profile.languages,
              workSurfaces: item.profile.work_surfaces,
              expectedArtifacts: item.profile.expected_artifacts,
              difficultyFactors: item.profile.difficulty_factors,
            })),
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "similarity_judgments",
          strict: true,
          schema: RERANK_SCHEMA,
        },
      },
    });
    const parsed = JSON.parse(responseText(payload)) as { judgments?: unknown[] };
    const seen = new Set<string>();
    const judgments: RerankJudgment[] = [];
    for (const raw of parsed.judgments ?? []) {
      if (!raw || typeof raw !== "object") continue;
      const value = raw as Record<string, unknown>;
      if (
        typeof value.caseId !== "string" ||
        !allowedIds.has(value.caseId) ||
        seen.has(value.caseId) ||
        typeof value.similarity !== "number"
      ) {
        continue;
      }
      seen.add(value.caseId);
      judgments.push({
        caseId: value.caseId,
        similarity: Math.max(0, Math.min(1, value.similarity)),
        matchedFacets: clampStrings(value.matchedFacets, 8),
        mismatchedFacets: clampStrings(value.mismatchedFacets, 8),
        unknownFacets: clampStrings(value.unknownFacets, 8),
      });
    }
    return judgments;
  }
}

