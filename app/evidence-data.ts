import deepSweRaw from "@/fixtures/normalization/deepswe-v1.1.jsonl?raw";
import terminalBenchRaw from "@/fixtures/normalization/terminal-bench-2.1.jsonl?raw";

export type Outcome = {
  provider: string;
  model: string;
  harness: string;
  harness_version?: string;
  configuration?: string;
  submission_date?: string;
  effort: string;
  attempts: number;
  passed: number;
  failed: number;
  errored: number;
  excluded: number;
  disqualified?: number;
  partial?: number;
  source_job_url?: string;
  source_submission_url?: string;
};

export type EvidenceCase = {
  schema_version: string;
  identity: {
    benchmark: string;
    release: string;
    native_id: string;
  };
  revision: {
    source_revision: string;
    case_tree: string;
    source_url: string;
    task_page?: string;
    repository?: string;
    base_commit?: string;
    dataset_ref?: string;
  };
  profile: {
    title: string;
    summary: string;
    description: string;
    interaction: string;
    intents: string[];
    technologies: string[];
    languages: string[];
    work_surfaces: string[];
    expected_artifacts: string[];
    difficulty_factors: string[];
    observed_labels: Record<string, string>;
  };
  outcomes: {
    source_url?: string;
    published_configurations?: number;
    published_trials?: number;
    panel: Outcome[];
  };
  extraction: {
    method: string;
    version: string;
    date: string;
    observed_fields: string[];
    derived_fields: string[];
    omitted: string[];
  };
};

function parseJsonl(raw: string): EvidenceCase[] {
  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as EvidenceCase);
}

export const evidenceCases = [
  ...parseJsonl(deepSweRaw),
  ...parseJsonl(terminalBenchRaw),
];

export function caseHref(item: EvidenceCase) {
  const { benchmark, release, native_id: nativeId } = item.identity;
  return `/evidence/${encodeURIComponent(benchmark)}/${encodeURIComponent(release)}/${encodeURIComponent(nativeId)}`;
}

export function findEvidenceCase(
  benchmark: string,
  release: string,
  nativeId: string,
) {
  return evidenceCases.find(
    (item) =>
      item.identity.benchmark === benchmark &&
      item.identity.release === release &&
      item.identity.native_id === nativeId,
  );
}

export function benchmarkLabel(benchmark: string) {
  return benchmark === "deepswe" ? "DeepSWE" : "Terminal-Bench";
}

export function totalTrials(item: EvidenceCase) {
  return item.outcomes.panel.reduce((sum, outcome) => sum + outcome.attempts, 0);
}

export function totalPasses(item: EvidenceCase) {
  return item.outcomes.panel.reduce((sum, outcome) => sum + outcome.passed, 0);
}
