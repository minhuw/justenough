import evidenceIndexJson from "@/fixtures/evidence-index.json";

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

export type EvidenceSummary = Pick<EvidenceCase, "identity" | "profile"> & {
  outcome_summary: {
    trials: number;
    passed: number;
  };
};

export const evidenceIndex = evidenceIndexJson as EvidenceSummary[];

export function caseHref(item: Pick<EvidenceCase, "identity">) {
  const { benchmark, release, native_id: nativeId } = item.identity;
  return `/evidence/${encodeURIComponent(benchmark)}/${encodeURIComponent(release)}/${encodeURIComponent(nativeId)}`;
}

export function benchmarkLabel(benchmark: string) {
  if (benchmark === "deepswe") return "DeepSWE";
  if (benchmark === "terminal-bench") return "Terminal-Bench";
  if (benchmark === "swe-bench-pro") return "SWE-Bench Pro";
  return benchmark;
}

export function totalTrials(item: EvidenceCase | EvidenceSummary) {
  if ("outcome_summary" in item) return item.outcome_summary.trials;
  return item.outcomes.panel.reduce((sum, outcome) => sum + outcome.attempts, 0);
}

export function totalPasses(item: EvidenceCase | EvidenceSummary) {
  if ("outcome_summary" in item) return item.outcome_summary.passed;
  return item.outcomes.panel.reduce((sum, outcome) => sum + outcome.passed, 0);
}
