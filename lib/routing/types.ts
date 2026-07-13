export type InteractionMode = "repository" | "terminal" | "unknown";

export type TargetTaskProfile = {
  summary: string;
  interaction: InteractionMode;
  intents: string[];
  technologies: string[];
  languages: string[];
  workSurfaces: string[];
  expectedArtifacts: string[];
  difficultyFactors: string[];
  constraints: string[];
  unknowns: string[];
};

export type CaseIdentity = {
  benchmark: string;
  release: string;
  native_id: string;
};

export type RerankJudgment = {
  caseId: string;
  similarity: number;
  matchedFacets: string[];
  mismatchedFacets: string[];
  unknownFacets: string[];
};

export type EvidenceMatch = {
  identity: CaseIdentity;
  href: string;
  title: string;
  summary: string;
  score: number;
  lexicalScore: number;
  semanticScore?: number;
  facetCoverage: number;
  matchedFacets: string[];
  mismatchedFacets: string[];
  unknownFacets: string[];
};

export type ConfigurationEvidence = {
  key: string;
  provider: string;
  model: string;
  harness: string;
  harnessVersion?: string;
  configuration?: string;
  effort: string;
  supportingCases: number;
  attempts: number;
  passed: number;
  observedRate: number;
  lowerBound: number;
};

export type RoutingResult = {
  status: "recommended" | "abstained";
  profile: TargetTaskProfile;
  reliabilityTarget: number;
  objective: "reasoning_effort_proxy";
  recommendation?: ConfigurationEvidence;
  lowerEffortAlternative?: ConfigurationEvidence;
  higherEffortAlternative?: ConfigurationEvidence;
  matches: EvidenceMatch[];
  candidatesEvaluated: number;
  evidence: {
    meanSimilarity: number;
    meanFacetCoverage: number;
    supportingCases: number;
  };
  abstentionReasons: string[];
  warnings: string[];
  analysis: {
    profiler: "llm" | "local";
    retrieval: Array<"lexical" | "facets" | "embedding" | "llm_rerank">;
  };
};

export type EmbeddingIndex = {
  schema_version: "1";
  model: string | null;
  dimensions: number | null;
  records: Array<{ case_id: string; embedding: number[] }>;
};

