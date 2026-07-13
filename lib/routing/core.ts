import type { EvidenceCase, Outcome } from "@/app/evidence-data";
import { caseHref } from "@/app/evidence-data";
import type {
  ConfigurationEvidence,
  EmbeddingIndex,
  EvidenceMatch,
  RerankJudgment,
  RoutingResult,
  TargetTaskProfile,
} from "./types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
]);

const EFFORT_ORDER: Record<string, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  xhigh: 4,
  max: 5,
  default: 50,
};

const DEFAULT_POLICY = {
  minEvidenceCases: 3,
  minMatchSimilarity: 0.15,
  qualifiedMatchSimilarity: 0.25,
  minQualifiedMatches: 3,
  minMeanSimilarity: 0.2,
  minMeanFacetCoverage: 0.25,
  maximumMatches: 8,
};

type CorpusVocabulary = {
  intents: string[];
  technologies: string[];
  languages: string[];
  workSurfaces: string[];
  expectedArtifacts: string[];
  difficultyFactors: string[];
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

function tokenize(value: string) {
  return unique(
    (normalized(value).match(/[\p{L}\p{N}][\p{L}\p{N}+#._-]*/gu) ?? []).filter(
      (token) => !STOP_WORDS.has(token),
    ),
  );
}

export function caseId(item: Pick<EvidenceCase, "identity">) {
  const { benchmark, release, native_id: nativeId } = item.identity;
  return `${benchmark}:${release}:${nativeId}`;
}

export function evidenceSearchDocument(item: Pick<EvidenceCase, "profile">) {
  const { profile } = item;
  return [
    profile.title,
    profile.summary,
    profile.description,
    profile.interaction,
    ...profile.intents,
    ...profile.technologies,
    ...profile.languages,
    ...profile.work_surfaces,
    ...profile.expected_artifacts,
    ...profile.difficulty_factors,
  ].join("\n");
}

export function targetSearchDocument(taskText: string, profile: TargetTaskProfile) {
  return [
    taskText,
    profile.summary,
    profile.interaction,
    ...profile.intents,
    ...profile.technologies,
    ...profile.languages,
    ...profile.workSurfaces,
    ...profile.expectedArtifacts,
    ...profile.difficultyFactors,
    ...profile.constraints,
  ].join("\n");
}

export function buildCorpusVocabulary(cases: EvidenceCase[]): CorpusVocabulary {
  function collect(
    select: (item: EvidenceCase["profile"]) => string[],
  ) {
    return unique(cases.flatMap((item) => select(item.profile))).sort((a, b) =>
      a.localeCompare(b),
    );
  }

  return {
    intents: collect((profile) => profile.intents),
    technologies: collect((profile) => profile.technologies),
    languages: collect((profile) => profile.languages),
    workSurfaces: collect((profile) => profile.work_surfaces),
    expectedArtifacts: collect((profile) => profile.expected_artifacts),
    difficultyFactors: collect((profile) => profile.difficulty_factors),
  };
}

function mentionedValues(taskText: string, values: string[]) {
  const haystack = normalized(taskText);
  return values.filter((value) => {
    const needle = normalized(value);
    if (needle.length < 2) return false;
    return haystack.includes(needle);
  });
}

export function profileTaskLocally(
  taskText: string,
  vocabulary: CorpusVocabulary,
): TargetTaskProfile {
  const text = normalized(taskText);
  const interaction = /\b(repository|repo|pull request|codebase|patch|commit)\b/.test(text)
    ? "repository"
    : /\b(terminal|shell|command|container|vm|server|service|install|configure|\/app\/)\b/.test(
          text,
        )
      ? "terminal"
      : "unknown";

  const intents = vocabulary.intents.filter((intent) => {
    if (intent === "bug repair") return /\b(fix|bug|broken|regression|repair)\b/.test(text);
    if (intent === "security remediation") {
      return /\b(security|vulnerability|injection|xss|csrf|cve|sanitize)\b/.test(text);
    }
    if (intent === "performance optimization") {
      return /\b(performance|optimi[sz]e|faster|latency|throughput|cache)\b/.test(text);
    }
    if (intent === "test and validation") return /\b(test|validate|verify)\b/.test(text);
    if (intent === "systems setup") return interaction === "terminal";
    if (intent === "feature implementation") {
      return /\b(add|build|create|implement|feature|support)\b/.test(text);
    }
    return text.includes(intent);
  });

  return {
    summary: taskText.trim().replace(/\s+/g, " ").slice(0, 500),
    interaction,
    intents: intents.length > 0 ? intents.slice(0, 4) : ["feature implementation"],
    technologies: mentionedValues(taskText, vocabulary.technologies),
    languages: mentionedValues(taskText, vocabulary.languages),
    workSurfaces: mentionedValues(taskText, vocabulary.workSurfaces).slice(0, 5),
    expectedArtifacts: mentionedValues(taskText, vocabulary.expectedArtifacts),
    difficultyFactors: mentionedValues(taskText, vocabulary.difficultyFactors).slice(0, 5),
    constraints: [],
    unknowns: interaction === "unknown" ? ["interaction mode"] : [],
  };
}

function jaccard(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return 0;
  const a = new Set(left.map(normalized));
  const b = new Set(right.map(normalized));
  const intersection = [...a].filter((value) => b.has(value)).length;
  return intersection / new Set([...a, ...b]).size;
}

function facetComparison(profile: TargetTaskProfile, item: EvidenceCase) {
  const groups = [
    ["intent", profile.intents, item.profile.intents],
    ["technology", profile.technologies, item.profile.technologies],
    ["language", profile.languages, item.profile.languages],
    ["work surface", profile.workSurfaces, item.profile.work_surfaces],
    ["artifact", profile.expectedArtifacts, item.profile.expected_artifacts],
    ["difficulty", profile.difficultyFactors, item.profile.difficulty_factors],
  ] as const;
  const applicable = groups.filter(([, target]) => target.length > 0);
  const matched: string[] = [];
  const mismatched: string[] = [];
  let total = 0;

  for (const [label, target, candidate] of applicable) {
    const score = jaccard(target, candidate);
    total += score;
    if (score > 0) matched.push(label);
    else mismatched.push(label);
  }

  if (
    profile.interaction !== "unknown" &&
    profile.interaction === item.profile.interaction
  ) {
    matched.unshift("interaction mode");
  }

  return {
    score: applicable.length > 0 ? total / applicable.length : 0,
    matched,
    mismatched,
    unknown: profile.unknowns,
  };
}

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length === 0 || left.length !== right.length) return undefined;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }
  if (leftNorm === 0 || rightNorm === 0) return undefined;
  return Math.max(0, Math.min(1, dot / Math.sqrt(leftNorm * rightNorm)));
}

function lexicalScores(taskText: string, cases: EvidenceCase[]) {
  const queryTokens = tokenize(taskText);
  const documents = cases.map((item) => new Set(tokenize(evidenceSearchDocument(item))));
  const documentFrequency = new Map<string, number>();
  for (const token of queryTokens) {
    documentFrequency.set(
      token,
      documents.filter((document) => document.has(token)).length,
    );
  }
  const weights = new Map(
    queryTokens.map((token) => [
      token,
      Math.log((cases.length + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1,
    ]),
  );
  const totalWeight = [...weights.values()].reduce((sum, value) => sum + value, 0);

  return new Map(
    cases.map((item, index) => {
      const matchedWeight = queryTokens.reduce(
        (sum, token) => sum + (documents[index].has(token) ? (weights.get(token) ?? 0) : 0),
        0,
      );
      return [caseId(item), totalWeight > 0 ? matchedWeight / totalWeight : 0];
    }),
  );
}

export function retrieveEvidence({
  taskText,
  profile,
  cases,
  embeddingIndex,
  targetEmbedding,
  rerankJudgments = [],
  limit = 20,
}: {
  taskText: string;
  profile: TargetTaskProfile;
  cases: EvidenceCase[];
  embeddingIndex?: EmbeddingIndex;
  targetEmbedding?: number[];
  rerankJudgments?: RerankJudgment[];
  limit?: number;
}) {
  const compatibleCases = cases.filter(
    (item) =>
      profile.interaction === "unknown" ||
      item.profile.interaction === profile.interaction,
  );
  const lexical = lexicalScores(taskText, compatibleCases);
  const embeddings = new Map(
    (embeddingIndex?.records ?? []).map((record) => [record.case_id, record.embedding]),
  );
  const reranked = new Map(rerankJudgments.map((item) => [item.caseId, item]));

  return compatibleCases
    .map((item): EvidenceMatch & { item: EvidenceCase } => {
      const id = caseId(item);
      const facet = facetComparison(profile, item);
      const embedding = embeddings.get(id);
      const semantic =
        targetEmbedding && embedding
          ? cosineSimilarity(targetEmbedding, embedding)
          : undefined;
      const judgment = reranked.get(id);
      const judgmentFacetCount = judgment
        ? judgment.matchedFacets.length + judgment.mismatchedFacets.length
        : 0;
      const facetCoverage = judgmentFacetCount > 0
        ? judgment!.matchedFacets.length / judgmentFacetCount
        : facet.score;
      const algorithmic = semantic === undefined
        ? 0.7 * (lexical.get(id) ?? 0) + 0.3 * facetCoverage
        : 0.4 * (lexical.get(id) ?? 0) + 0.25 * facetCoverage + 0.35 * semantic;
      const score = judgment
        ? 0.65 * algorithmic + 0.35 * Math.max(0, Math.min(1, judgment.similarity))
        : algorithmic;

      return {
        item,
        identity: item.identity,
        href: caseHref(item),
        title: item.profile.title,
        summary: item.profile.summary,
        score,
        lexicalScore: lexical.get(id) ?? 0,
        semanticScore: semantic,
        facetCoverage,
        matchedFacets: judgment?.matchedFacets ?? facet.matched,
        mismatchedFacets: judgment?.mismatchedFacets ?? facet.mismatched,
        unknownFacets: judgment?.unknownFacets ?? facet.unknown,
      };
    })
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, limit);
}

function configurationKey(outcome: Outcome) {
  return [
    outcome.provider,
    outcome.model,
    outcome.harness,
    outcome.harness_version ?? "unknown-version",
    outcome.effort,
    outcome.configuration ?? "unknown-configuration",
  ].join(":");
}

export function wilsonLowerBound(passed: number, attempts: number, z = 1.645) {
  if (attempts <= 0) return 0;
  const proportion = passed / attempts;
  const zSquared = z ** 2;
  const denominator = 1 + zSquared / attempts;
  const center = proportion + zSquared / (2 * attempts);
  const margin =
    z *
    Math.sqrt(
      (proportion * (1 - proportion)) / attempts +
        zSquared / (4 * attempts ** 2),
    );
  return Math.max(0, (center - margin) / denominator);
}

function aggregateConfigurations(matches: Array<EvidenceMatch & { item?: EvidenceCase }>) {
  const aggregates = new Map<
    string,
    ConfigurationEvidence & { caseIds: Set<string> }
  >();

  for (const match of matches) {
    if (!match.item) continue;
    for (const outcome of match.item.outcomes.panel) {
      if (outcome.attempts <= 0) continue;
      const key = configurationKey(outcome);
      const aggregate = aggregates.get(key) ?? {
        key,
        provider: outcome.provider,
        model: outcome.model,
        harness: outcome.harness,
        harnessVersion: outcome.harness_version,
        configuration: outcome.configuration,
        effort: outcome.effort,
        supportingCases: 0,
        attempts: 0,
        passed: 0,
        observedRate: 0,
        lowerBound: 0,
        caseIds: new Set<string>(),
      };
      aggregate.caseIds.add(caseId(match.item));
      aggregate.attempts += outcome.attempts;
      aggregate.passed += outcome.passed;
      aggregates.set(key, aggregate);
    }
  }

  return [...aggregates.values()].map(({ caseIds, ...aggregate }) => ({
    ...aggregate,
    supportingCases: caseIds.size,
    observedRate: aggregate.attempts > 0 ? aggregate.passed / aggregate.attempts : 0,
    lowerBound: wilsonLowerBound(aggregate.passed, aggregate.attempts),
  }));
}

function effortRank(effort: string) {
  return EFFORT_ORDER[normalized(effort)] ?? 51;
}

export function makeRoutingDecision({
  profile,
  matches,
  reliabilityTarget,
  profiler,
  retrieval,
  warnings = [],
  casesById,
}: {
  profile: TargetTaskProfile;
  matches: EvidenceMatch[];
  reliabilityTarget: number;
  profiler: "llm" | "local";
  retrieval: RoutingResult["analysis"]["retrieval"];
  warnings?: string[];
  casesById: Map<string, EvidenceCase>;
}): RoutingResult {
  const selectedMatches = matches
    .filter((match) => match.score >= DEFAULT_POLICY.minMatchSimilarity)
    .slice(0, DEFAULT_POLICY.maximumMatches)
    .map((match) => ({ ...match, item: casesById.get(caseId(match)) }));
  const meanSimilarity = selectedMatches.length
    ? selectedMatches.reduce((sum, match) => sum + match.score, 0) /
      selectedMatches.length
    : 0;
  const meanFacetCoverage = selectedMatches.length
    ? selectedMatches.reduce((sum, match) => sum + match.facetCoverage, 0) /
      selectedMatches.length
    : 0;
  const candidates = aggregateConfigurations(selectedMatches);
  const qualifiedMatches = selectedMatches.filter(
    (match) => match.score >= DEFAULT_POLICY.qualifiedMatchSimilarity,
  ).length;
  const evidenceReady =
    selectedMatches.length >= DEFAULT_POLICY.minEvidenceCases &&
    qualifiedMatches >= DEFAULT_POLICY.minQualifiedMatches &&
    meanSimilarity >= DEFAULT_POLICY.minMeanSimilarity &&
    meanFacetCoverage >= DEFAULT_POLICY.minMeanFacetCoverage;
  const eligible = candidates
    .filter(
      (candidate) =>
        candidate.supportingCases >= DEFAULT_POLICY.minEvidenceCases &&
        candidate.lowerBound >= reliabilityTarget,
    )
    .sort(
      (left, right) =>
        effortRank(left.effort) - effortRank(right.effort) ||
        right.lowerBound - left.lowerBound ||
        right.observedRate - left.observedRate ||
        left.key.localeCompare(right.key),
    );
  const recommendation = evidenceReady ? eligible[0] : undefined;
  const abstentionReasons: string[] = [];

  if (selectedMatches.length < DEFAULT_POLICY.minEvidenceCases) {
    abstentionReasons.push("Fewer than three compatible benchmark cases were retrieved.");
  }
  if (qualifiedMatches < DEFAULT_POLICY.minQualifiedMatches) {
    abstentionReasons.push("Fewer than three retrieved cases have strong enough task similarity.");
  }
  if (meanSimilarity < DEFAULT_POLICY.minMeanSimilarity) {
    abstentionReasons.push("The retrieved cases are not similar enough to transfer outcome evidence.");
  }
  if (meanFacetCoverage < DEFAULT_POLICY.minMeanFacetCoverage) {
    abstentionReasons.push("The evidence does not cover enough of the target task's known facets.");
  }
  if (evidenceReady && eligible.length === 0) {
    abstentionReasons.push(
      `No exact execution configuration clears the ${(reliabilityTarget * 100).toFixed(0)}% reliability target at the conservative evidence bound.`,
    );
  }

  const lowerEffortAlternative = recommendation
    ? candidates
        .filter(
          (candidate) =>
            effortRank(candidate.effort) < effortRank(recommendation.effort) &&
            candidate.supportingCases >= DEFAULT_POLICY.minEvidenceCases,
        )
        .sort(
          (left, right) =>
            effortRank(right.effort) - effortRank(left.effort) ||
            right.lowerBound - left.lowerBound,
        )[0]
    : undefined;
  const higherEffortAlternative = recommendation
    ? eligible
        .filter(
          (candidate) => effortRank(candidate.effort) > effortRank(recommendation.effort),
        )
        .sort(
          (left, right) =>
            effortRank(left.effort) - effortRank(right.effort) ||
            right.lowerBound - left.lowerBound,
        )[0]
    : undefined;

  return {
    status: recommendation ? "recommended" : "abstained",
    profile,
    reliabilityTarget,
    objective: "reasoning_effort_proxy",
    recommendation,
    lowerEffortAlternative,
    higherEffortAlternative,
    matches: selectedMatches.map((match) => ({
      identity: match.identity,
      href: match.href,
      title: match.title,
      summary: match.summary,
      score: match.score,
      lexicalScore: match.lexicalScore,
      semanticScore: match.semanticScore,
      facetCoverage: match.facetCoverage,
      matchedFacets: match.matchedFacets,
      mismatchedFacets: match.mismatchedFacets,
      unknownFacets: match.unknownFacets,
    })),
    candidatesEvaluated: candidates.length,
    evidence: {
      meanSimilarity,
      meanFacetCoverage,
      supportingCases: selectedMatches.length,
    },
    abstentionReasons,
    warnings: unique([
      ...warnings,
      "Effort labels are a routing proxy, not a cross-provider cost or latency measurement.",
    ]),
    analysis: { profiler, retrieval },
  };
}
