# Benchmark case abstraction

Status: design proposal  
Survey date: 2026-07-13

## Conclusion

Yes, JustEnough can build a common abstraction over agentic benchmark cases,
but the abstraction must not flatten them into a single row of optional fields.
The useful common core is:

```text
Benchmark
  → Benchmark Release
  → Case Identity
  → immutable Case Revision
  → Execution Configuration
  → Trial
  → Outcome
```

The **Case Revision**, not the benchmark task name, is the unit of evidence.
Repository repair, terminal work, and desktop manipulation then use typed mode
extensions behind that common core.

This is sufficient for similarity retrieval and evidence exploration. It is not
by itself sufficient for automatic model routing: routing also needs comparable
execution configurations, repeated trials, uncertainty, cost/latency scope, and
an explicit abstention policy.

## Survey method

This survey inspected official repositories, published datasets, task formats,
leaderboard artifacts, and submission records. Fields are classified as:

- **Observed:** copied or parsed from an official source record.
- **Derived:** reproducibly inferred from observed records.
- **Unknown:** applicable, but absent from the inspected source.
- **Not applicable:** not meaningful for that case or interaction mode.
- **Unsupported:** present upstream, but not faithfully represented by the
  current adapter.
- **Redacted:** intentionally withheld.
- **Conflict:** official sources disagree and both claims must be preserved.

Reference solutions, gold patches, and verifier-only material were inspected to
understand benchmark structure. They must not enter normal similarity indexes.

## Source-by-source findings

| Benchmark | Observed case material | Observed execution material | Important gaps or cautions |
|---|---|---|---|
| DeepSWE v1.1 | Task ID, title/description, language, repository and URL, base commit, instruction, prompt length, Harbor metadata, Docker environment, resources, timeouts, network/MCP policy, solution, separate verifier environment and test configuration | Model/provider, effort, harness/config, pass/fail/error/partial/excluded state, reward and F2P/P2P counts, cost, tokens, duration, agent steps, artifacts, exceptions and critiques | Requirements, work type and difficulty are not consistently normalized. Prompt/patch-derived facets must be marked derived. Verifier/reference content is not agent-visible retrieval text. |
| Terminal-Bench 2.0 | 89 Harbor tasks with instruction, name/description, keywords/authors, category/tags/difficulty, expert/junior estimates, Docker environment, resources, timeouts, internet/MCP/env policy, solution, verifier and arbitrary assets | Harbor jobs can carry configuration, reward, recording/trajectory and verifier outputs; the public leaderboard consistently exposes aggregate agent/model accuracy | Public results do not uniformly expose cost, latency, token counts or a common definition of steps. |
| Terminal-Bench 2.1 | The same broad Harbor structure and native task IDs as 2.0, with revised instructions, tests, environments, resources and robustness measures for affected cases | Rich official submissions may include accuracy/stderr, repeated trials, pass@k, tokens, total cost, mean duration, reward-hacking rate, excluded trials, trial IDs and source jobs | An outcome from 2.0 cannot be attached to a 2.1 case merely because the native ID matches. Exact case revision is mandatory. |
| SWE-bench / Verified | Repository, instance ID, base and environment commits, problem statement, hints, package version/date, gold patch, test patch, FAIL_TO_PASS, PASS_TO_PASS; Verified adds a human difficulty label | Prediction patch, resolved status, per-case evaluation reports/logs and, for some experiment submissions, trajectories | Cost, latency, model effort, provider and step semantics are not standardized across submissions. Gold/test material is reference/verifier-only for retrieval. |
| SWE-bench Pro | Public split with repository, instance ID, base commit, gold/test patches, problem statement, explicit requirements, interface, language, F2P/P2P, issue specificity/categories, setup command, selected tests and Docker tag | Patch evaluation, pass/fail and logs; published analyses may add failure categories | Cost, latency, effort and steps are not standardized. Public, held-out and commercial partitions have different visibility. |
| SWE-bench Multilingual | SWE-bench-style repository case fields across 300 tasks, 42 repositories and 9 languages | The same broad prediction/result shape as SWE-bench | Language is derived from the official repository-language mapping rather than stored uniformly per row. |
| OSWorld | GUI case ID, VM snapshot, instruction/source, setup actions, downloads/open operations, related apps, evaluator function/expected/result/options/rules and environment flags | Observation/action-space/model settings, max steps, trajectory JSONL, screenshots, recordings, runtime logs, score/status/error | Cost and tokens are not standardized; live services, credentials and mutable external state increase volatility. This is a useful scope test, not an initial coding-data priority. |

### Why revision identity is non-negotiable

The Terminal-Bench 2.1 release article says 28 of the 89 Terminal-Bench 2.0
tasks were fixed because of external-dependency drift, resource mismatches, or
instruction/verifier misspecification. The 2.1 repository README says 26 tasks
were modified. JustEnough should retain this as a sourced **Conflict**, not pick
one number or silently prefer the newest page.

The substantive lesson is the same: a stable native task name does not imply a
stable evidence item. Any material change to the instruction, initial state,
verifier, reference behavior, image, resources, timeout, network policy, tools,
or scoring rule creates a new Case Revision. Historical outcomes remain attached
to their original revision.

External audits of SWE-bench-style benchmarks should be stored as sourced
**Quality Assertions**. They do not become benchmark-owner schema fields or
unsourced labels on every case.

## Normalized model

### Identity and provenance

```ts
type CaseIdentity = {
  benchmark: string;
  nativeId: string;
};

type CaseRevisionRef = {
  identity: CaseIdentity;
  release: string;
  digest: string;
};

type ProvenanceRef = {
  sourceId: string;
  locator: string;
  sourceRevision: string;
  observedAt: string;
};

type Claim<T> =
  | {
      state: "known";
      value: T;
      origin: "observed" | "derived";
      provenance: ProvenanceRef[];
      derivation?: { method: string; version: string };
    }
  | { state: "unknown"; reason: "not_exposed" | "not_collected" }
  | { state: "not_applicable" }
  | { state: "unsupported"; reason: string }
  | { state: "redacted"; policy?: string }
  | { state: "conflict"; claims: Array<{ value: T; provenance: ProvenanceRef[] }> };
```

Every known value has provenance. Every derived value additionally names a
versioned derivation method, model, or prompt. `null`, `0`, and `false` are never
substitutes for unavailable evidence.

### Case Revision

A normalized Case Revision contains:

- identity, release, digest, lineage and aliases;
- title and agent-visible instruction;
- interaction mode and typed mode extension;
- repository, app, VM snapshot, base commit or other initial-state reference;
- functional, non-functional, compatibility, regression and interface
  requirements;
- task facets: intent, domain, technologies, language, work surface, expected
  artifact, scope/horizon and modalities;
- environment constraints: OS/substrate/image, setup, resources, timeout,
  network, tools, MCP servers, apps and credentials policy;
- verification contract: evaluator kind, score dimensions, pass rule,
  isolation, and visibility;
- quality assertions and field-availability coverage;
- links to immutable source records.

Typed mode extensions initially cover:

```ts
type CaseMode =
  | { kind: "repository_repair"; repo: string; baseCommit: string }
  | { kind: "terminal_environment"; image: string; expectedArtifacts: string[] }
  | { kind: "desktop_gui"; snapshot: string; apps: string[] };
```

This is preferable to one giant nullable record. The common core remains deep,
while interaction-specific facts remain honest and type-checkable.

### Visibility

Each material claim or source segment uses one visibility class:

- `agent_visible`
- `public_metadata`
- `verifier_only`
- `reference_only`

Default similarity indexing includes only agent-visible content and safe public
metadata. Verifier-only and reference-only text is excluded. A safe derived
summary may be searchable only after an explicit leakage review and must retain
its derivation and visibility provenance.

### Execution and outcome

An Execution Configuration is more than a model name. It contains:

- exact provider/model/version;
- harness/agent and version;
- effort setting and tool policy;
- runtime image/provider/resources and network policy;
- seed and attempt number;
- price schedule or observation timestamp where cost is calculated.

A Trial binds one Execution Configuration to one exact Case Revision. Its
Outcome contains:

- `passed`, `failed`, `errored`, `excluded`, or `not_run`;
- the benchmark inclusion policy and dynamic score dimensions;
- cost, tokens and durations with an explicit measurement scope;
- steps with an explicit kind such as `llm_turn`, `tool_call`, or `gui_action`;
- artifacts, verifier output, failure analysis and quality flags.

Outcomes are not pooled across materially different revisions, harnesses,
effort settings, tools, or environments by default.

## Deep module and adapter seam

Consumers should learn one small interface:

```ts
interface BenchmarkEvidence {
  sync(sources: SourceLocator[]): Promise<SyncReport>;
  query(request: EvidenceQuery): Promise<EvidenceResult>;
  read(ref: CaseRevisionRef): Promise<CaseEvidence>;
  outcomes(
    ref: CaseRevisionRef,
    filter?: ExecutionFilter,
  ): Promise<OutcomePage>;
}
```

The future Codex skill primarily calls `query`. Evidence-case pages use `read`
and `outcomes`. Ingestion operations call `sync`.

Source variability sits at a narrower internal seam:

```ts
interface BenchmarkAdapter {
  pin(source: SourceLocator): Promise<PinnedSnapshot>;
  records(snapshot: PinnedSnapshot): AsyncIterable<AdapterRecord>;
}
```

Adapters emit observed source records. They do not decide similarity, invent
defaults, or flatten benchmark-specific scores. Normalization, revision
creation, conflict handling, derivation, visibility enforcement and field-level
provenance stay inside the Benchmark Evidence module.

Initial adapters:

1. DeepSWE repository plus versioned website artifacts
2. Terminal-Bench 2.0 repository plus Harbor results
3. Terminal-Bench 2.1 repository plus Harbor results
4. SWE-bench dataset plus experiments results
5. SWE-bench Pro dataset plus evaluation results

SWE-bench Multilingual can reuse most of the SWE-bench adapter with a versioned
repository-language derivation. OSWorld should wait until GUI-target routing is
in product scope.

## Similarity query

The query flow should be explainable:

1. Parse the user's Target Task into a versioned Task Profile.
2. Apply hard compatibility filters for interaction mode, required ecosystem,
   environment, tools and visibility.
3. Retrieve over safe task text and structured facets.
4. Rerank by intent, ecosystem, work surface, expected artifact, verification
   burden, scope and environmental constraints.
5. Return exact Case Revisions and comparable Execution Configurations.
6. Explain matched, mismatched and unknown facets.
7. Surface revision age, quality assertions, trial coverage and telemetry gaps.
8. Abstain when coverage or comparability falls below policy.

Keep three judgments separate:

- **Similarity confidence:** resemblance between the Target Task and a Case
  Revision.
- **Empirical-success confidence:** what observed Trials support for a specific
  Execution Configuration.
- **Evidence quality:** freshness, repeated-trial count, telemetry completeness,
  conflicts and Quality Assertions.

A single opaque confidence number would hide the decision's failure modes.

For “add authentication to a TypeScript website,” candidates may include
SWE-bench Pro cases with explicit auth/security requirements and interfaces,
DeepSWE TypeScript feature cases, and Terminal-Bench web-server/security cases.
The result should disclose that these are related evidence, not identical work.

## Irreducible differences

- Repository patching, terminal state construction and desktop manipulation are
  different interaction modes.
- Binary resolution, partial reward and multi-metric evaluators cannot be
  flattened without retaining their score semantics.
- Public reference material differs from what the evaluated agent may see.
- “Difficulty” can mean a human label, time estimate, patch proxy, or
  outcome-derived property; these are different claims.
- Cost, latency and step counts often have different scopes or are absent.
- Live dependencies, credentials, websites and VM snapshots make environments
  volatile.
- Public, held-out and commercial partitions have different access rules.
- Model, harness, effort, tools and environment often change together, so trial
  correlation is not causal attribution.
- Sparse trials make pass-rate estimates unstable; retain counts and
  uncertainty.

## Staged implementation

1. Build a source registry and immutable snapshot pinning using commits,
   dataset revisions and artifact digests.
2. Implement DeepSWE and Terminal-Bench 2.1 adapters first, with captured
   fixtures and schema-drift tests.
3. Store source records beside normalized claims, provenance and explicit
   unknown states.
4. Establish a compact facet taxonomy. Begin with deterministic extraction;
   add model-derived facets only as versioned derivations.
5. Build case exploration, retrieval explanations and evidence-coverage
   reporting before ranking models.
6. Ingest exact execution configurations, repeated trials, outcomes and
   uncertainty.
7. Add SWE-bench/SWE-bench Pro adapters to broaden repository-repair coverage.
8. Expose the same module through the website and reusable query skill.
9. Add model/effort routing last, initially with recommendation plus abstention,
   not automatic dispatch.

Acceptance checks:

- No Outcome exists without an exact Case Revision and Execution Configuration.
- No known normalized value exists without provenance.
- Material upstream changes create a new revision.
- Missing values never become default zero, false, or null.
- Incompatible Execution Configurations are not silently pooled.
- Reference/verifier material is excluded from normal similarity retrieval.
- Every query explains matches, mismatches, unknowns and quality warnings.
- Adapter schema drift fails visibly or quarantines records.

## Official sources

All sources were accessed on 2026-07-13.

### DeepSWE

- [Official repository](https://github.com/datacurve-ai/deep-swe)
- [v1.1 task index](https://deepswe.datacurve.ai/artifacts/v1.1/tasks.json)
- [v1.1 trials](https://deepswe.datacurve.ai/artifacts/v1.1/trials.json)
- [v1.1 release metadata](https://deepswe.datacurve.ai/artifacts/v1.1/release.json)
- [v1.1 live leaderboard artifact](https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json)

### Terminal-Bench and Harbor

- [Terminal-Bench 2.0 repository](https://github.com/harbor-framework/terminal-bench-2)
- [Terminal-Bench 2.1 repository](https://github.com/harbor-framework/terminal-bench-2-1)
- [Terminal-Bench 2.1 release article](https://www.tbench.ai/news/terminal-bench-2-1)
- [Terminal-Bench 2.0 leaderboard](https://www.tbench.ai/leaderboard/terminal-bench/2.0)
- [Terminal-Bench 2.1 leaderboard](https://www.tbench.ai/leaderboard/terminal-bench/2.1)
- [Harbor task specification](https://www.harborframework.com/docs/tasks)
- [Harbor evaluation jobs](https://www.harborframework.com/docs/run-jobs/run-evals)
- [Rich Terminal-Bench 2.1 submission example](https://github.com/harbor-framework/terminal-bench-2-1/blob/main/leaderboard/submissions/2026-07-10-gpt-5-6-sol-max-codex.json)

### SWE-bench

- [Official repository](https://github.com/SWE-bench/SWE-bench)
- [Dataset guide](https://www.swebench.com/SWE-bench/guides/datasets/)
- [SWE-bench Verified dataset](https://huggingface.co/datasets/SWE-bench/SWE-bench_Verified)
- [Official experiments/results repository](https://github.com/SWE-bench/experiments)
- [Original Verified curation report](https://openai.com/index/introducing-swe-bench-verified/)
- [2026 SWE-bench Verified audit](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)
- [Multilingual overview](https://www.swebench.com/multilingual.html)
- [Multilingual dataset](https://huggingface.co/datasets/SWE-bench/SWE-bench_Multilingual)

### SWE-bench Pro

- [Official public dataset](https://huggingface.co/datasets/ScaleAI/SWE-bench_Pro)
- [Official open-source evaluation repository](https://github.com/scaleapi/SWE-bench_Pro-os)
- [Benchmark announcement](https://scale.com/blog/swe-bench-pro)
- [2026 external audit](https://openai.com/index/separating-signal-from-noise-coding-evaluations/)

### OSWorld

- [Official repository](https://github.com/xlang-ai/OSWorld)
- [Example task configuration](https://github.com/xlang-ai/OSWorld/blob/main/evaluation_examples/examples/libreoffice_calc/1954cced-e748-45c4-9c26-9855b97fbc5e.json)
