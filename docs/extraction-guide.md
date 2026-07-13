# Benchmark corpus extraction guide

This document is the contract for extracting JustEnough case records from
DeepSWE v1.1 and Terminal-Bench 2.1. Follow it exactly. Do not infer a new
schema or silently repair source data during an extraction run.

## Deliverables

Produce these files, ordered by `identity.native_id`:

- `corpus/deepswe-v1.1.jsonl` — 113 records
- `corpus/terminal-bench-2.1.jsonl` — 89 records
- `corpus/manifest.json` — source pins, counts, sizes, and SHA-256 digests

Each JSONL line is one complete case record. Files must end with a newline.
Never mix releases in one file.

## Source pins

Use only these official sources and revisions:

| Benchmark | Release | Repository | Revision |
| --- | --- | --- | --- |
| DeepSWE | v1.1 | `https://github.com/datacurve-ai/deep-swe` | `6db64a40f3318d8659238ff34a8cc4b491c49205` |
| Terminal-Bench | 2.1 | `https://github.com/harbor-framework/terminal-bench-2-1` | `d49e28f1e4ddd13d289e85a5f312a66750951932` |

DeepSWE also publishes these versioned artifacts:

- `https://deepswe.datacurve.ai/artifacts/v1.1/tasks.json`
- `https://deepswe.datacurve.ai/artifacts/v1.1/trials.json`
- `https://deepswe.datacurve.ai/artifacts/v1.1/release.json`

Terminal-Bench outcome evidence comes from the 20 JSON files under
`leaderboard/submissions/` at the pinned revision and the Harbor jobs named by
their `source_jobs` fields.

Record the exact pins above in every case. If an upstream count or schema no
longer matches this guide, stop and report schema drift. Do not switch to
`main`, `latest`, a similarly named dataset, or a newer task page.

## Reference implementation

The checked-in scripts implement this contract. Prepare a source directory
containing checkouts at the pinned revisions and the three DeepSWE artifacts:

```text
<source-root>/deep-swe
<source-root>/terminal-bench-2-1
<source-root>/harbor-cache                 # created on demand
<source-root>/deepswe-v1.1-tasks.json
<source-root>/deepswe-v1.1-trials.json
```

Run the extractors from the repository root:

```sh
node scripts/extract-deepswe.mjs \
  <source-root>/deep-swe \
  <source-root>/deepswe-v1.1-tasks.json \
  <source-root>/deepswe-v1.1-trials.json \
  corpus/deepswe-v1.1.jsonl

TERMINAL_BENCH_SOURCE=<source-root>/terminal-bench-2-1 \
HARBOR_CACHE=<source-root>/harbor-cache \
  npm run data:extract:terminal-bench

JUSTENOUGH_SOURCE_ROOT=<source-root> npm run data:validate-corpus
JUSTENOUGH_SOURCE_ROOT=<source-root> npm run data:build-corpus
```

The Terminal-Bench extractor reads Harbor outcome pages over HTTPS when they
are absent from `HARBOR_CACHE`; later runs reuse the saved pages. The validator
also checks the source revisions and all referenced Harbor trial IDs. A valid
run must not rely only on the extractors' own assertions.

## What may be read

Semantic extraction may read:

- `task.toml`;
- the agent-visible `instruction.md`;
- DeepSWE `tasks.json` rows;
- published submission metadata and trial records;
- pinned Git metadata needed for revision identity.

Do not read solution, verifier, tests, trajectories, patches, recordings, or
agent logs to derive a profile. Those sources leak reference behavior or add
search noise. They may be covered by a Git tree digest without being opened.
Do not retain author names or email addresses.

## Record schema

Use `schema_version: "0.2"`. Omit unavailable optional keys rather than writing
`null`, an empty placeholder, or an invented value.

```json
{
  "schema_version": "0.2",
  "identity": {
    "benchmark": "deepswe | terminal-bench",
    "release": "v1.1 | 2.1",
    "native_id": "upstream task id"
  },
  "revision": {
    "source_revision": "40-character Git SHA",
    "case_tree": "Git tree SHA for tasks/<native_id>",
    "source_url": "pinned task.toml URL",
    "task_page": "optional official task page",
    "repository": "optional target repository URL",
    "base_commit": "optional target repository base commit",
    "dataset_ref": "optional published dataset digest"
  },
  "profile": {
    "title": "short task title",
    "summary": "one factual sentence",
    "interaction": "repository | terminal",
    "intents": ["one to four normalized intents"],
    "technologies": ["explicitly relevant technologies"],
    "languages": ["explicit languages or data formats"],
    "work_surfaces": ["one to five affected surfaces"],
    "expected_artifacts": ["observable deliverables"],
    "requirements": ["two to six distinguishing requirements"],
    "observed_labels": {"upstream_label": "upstream_value"}
  },
  "outcomes": {
    "source_url": "official outcome source",
    "published_configurations": 0,
    "published_trials": 0,
    "panel": []
  },
  "extraction": {
    "method": "frontier LLM semantic extraction with pinned-source review",
    "version": "full-1",
    "date": "YYYY-MM-DD",
    "observed_fields": [],
    "derived_fields": [],
    "omitted": []
  }
}
```

Outcome rows use this shape:

```json
{
  "provider": "source provider",
  "model": "source model identifier",
  "harness": "source harness identifier",
  "harness_version": "optional exact version",
  "configuration": "exact unique configuration or submission id",
  "submission_date": "optional YYYY-MM-DD",
  "effort": "source effort or default",
  "attempts": 0,
  "passed": 0,
  "failed": 0,
  "errored": 0,
  "excluded": 0,
  "disqualified": 0,
  "source_job_url": "optional Harbor job URL",
  "source_submission_url": "optional pinned submission URL"
}
```

Do not add `sample`; these files cover complete releases.

## Profile extraction rules

### Title

- DeepSWE: copy `metadata.display_title` from `task.toml`; confirm it matches
  the corresponding `tasks.json.problem_title`.
- Terminal-Bench: write a direct verb phrase describing the requested result.
  Use the instruction as the authority and `task.description` only as support.
- Keep titles under 90 characters where possible.
- Do not start with “Can you,” “The task asks,” “Implement a solution,” or
  other framing text.

### Summary

- Write one sentence, normally 15–35 words.
- State the operation, target, and the most important success constraint.
- DeepSWE: prefer the observed `display_description` when it is accurate and
  self-contained. Copying that observed field is better than paraphrasing it.
- Terminal-Bench: derive the sentence from the agent-visible instruction.
- Do not mention the benchmark, evaluator, agent, LLM, extraction process, or
  expected difficulty.

### Intents

Use one to four lower-case noun phrases such as:

- `feature implementation`
- `bug repair`
- `security remediation`
- `performance optimization`
- `configuration tuning`
- `data transformation`
- `systems setup`
- `test and validation`

Choose what the work does, not the upstream category label. Do not invent a
new near-synonym when an existing phrase fits.

### Technologies and languages

- Include named libraries, frameworks, protocols, tools, file formats, and
  runtime systems that materially constrain the work.
- Include a language only when it is observed in metadata, named by the
  instruction, or unambiguous from a required artifact.
- Preserve conventional spelling: `Node.js`, `PostgreSQL`, `C++`, `JSON`,
  `MuJoCo`.
- Do not include generic terms such as `coding`, `terminal`, `repository`,
  `software`, or `file`.
- Deduplicate case-insensitively while preserving the best spelling.

### Work surfaces

Name the part of the system changed or operated, for example:

- `CLI`
- `HTTP server`
- `module loader`
- `database schema`
- `build system`
- `simulation model`
- `filesystem`
- `network service`

Use one to five items. Do not restate technologies as surfaces.

### Expected artifacts

- DeepSWE normally uses `["repository patch"]`.
- Terminal-Bench records explicit required paths and durable outputs, such as
  `/app/model.xml`, a configured service, a certificate, or a generated data
  file.
- Do not list intermediate commands, logs, tests, or verifier files.
- When the result is system state rather than a file, use a short noun phrase
  such as `running SSH service`.

### Requirements

- Extract two to six requirements that distinguish this case from a generic
  task with the same title.
- Preserve numeric thresholds, versions, paths, ordering, compatibility,
  regression behavior, and explicit “must not change” constraints.
- Write compact imperative or result clauses without terminal punctuation.
- Combine tightly coupled clauses; do not copy the whole instruction.
- Do not use solution, verifier, or test knowledge.

### Observed labels

Copy only published non-empty labels:

- DeepSWE: `category` and `language` from `task.toml` metadata.
- Terminal-Bench: `category`, `difficulty`, and `tags` from `task.toml`
  metadata. Serialize a tag list as a comma-separated string if the record
  remains `Record<string, string>`.

Do not place derived facets in `observed_labels`.

## Revision and provenance rules

For each task, calculate:

```sh
git rev-parse <source_revision>:tasks/<native_id>
```

Store that value as `revision.case_tree`. A tree SHA covers the complete task
revision without exposing solution or verifier content to semantic extraction.

Use pinned GitHub blob URLs:

```text
https://github.com/<owner>/<repo>/blob/<source_revision>/tasks/<native_id>/task.toml
```

DeepSWE additionally stores:

- `task_page`: `https://deepswe.datacurve.ai/data/v1.1/tasks/<native_id>`
- `repository`: target repository URL from observed metadata
- `base_commit`: target repository base commit from observed metadata

Terminal-Bench stores a `dataset_ref` only if a published digest is observed
for the pinned release. Do not calculate a replacement and call it the
published digest.

## DeepSWE v1.1 outcomes

Use `artifacts/v1.1/trials.json`; do not scrape 113 HTML pages when the official
structured artifact is available.

The pinned artifact has:

- 113 task rows in `tasks.json`;
- 18,522 fairness-filtered trial rows;
- 41 configurations for every task;
- 13 model families.

Group trial rows by `task_name`, then `config`. Preserve `provider`, `model`,
`harness`, `config`, and `reasoning_effort` exactly as published. Set
`configuration = config` and use `default` only when the source effort is
absent.

Classify each trial in this order:

1. `included_in_score === false` or `outcome === "excluded_error"` →
   `excluded`
2. `errored === true` → `errored`
3. `passed === true` or `outcome === "pass"` → `passed`
4. otherwise → `failed`

`attempts` is the number of published rows in that task/configuration group.
Do not force four attempts. Seven tasks have fewer than 164 fairness-filtered
rows, but all still have 41 configurations. For each outcome row assert:

```text
attempts = passed + failed + errored + excluded
```

Sort the panel by `configuration`. Set `published_trials` to the sum of actual
attempts for the case and `published_configurations` to 41.

## Terminal-Bench 2.1 outcomes

Read all 20 pinned `leaderboard/submissions/*.json` files. A submission file is
one exact execution configuration even when another submission has the same
model, effort, and harness.

For each submission:

1. fetch every Harbor page for every `source_jobs` ID;
2. parse the server-rendered `initialTrials` payload;
3. retain only IDs listed in the submission’s `trials` array;
4. verify every listed trial ID was found;
5. group retained trials by the final segment of `task_name`;
6. attach disqualification state from `disqualified_trials`.

Classify each retained trial in this order:

1. listed in `disqualified_trials` → increment both `disqualified` and
   `failed`
2. `error_type`, `hosted_error`, or non-`completed` status → `errored`
3. numeric reward greater than zero → `passed`
4. otherwise → `failed`

Use the submission filename without `.json` as `configuration`. Keep
`submission_date`, `source_filter.agent`, `source_filter.agent_version`,
`source_filter.reasoning_effort`, the pinned submission URL, and the matching
Harbor job URL.

Prefer provider/model values observed on the trial. If Harbor publishes the
literal provider `unknown`, use a documented deterministic fallback only for:

- `gpt-*` → `openai`
- `glm-*` → `zai`

Do not force five attempts. The 20 submissions contain 8,902 curated trial
references in total; one submission contains 447 rather than 445. Every task
must still have 20 panel rows. Sort by `configuration`.

## Extraction metadata

Populate `extraction` consistently:

- `method`: `frontier LLM semantic extraction with pinned-source review`
- `version`: `full-1`
- `date`: actual UTC extraction date
- `observed_fields`: identity, revision fields, copied profile fields,
  observed labels, and outcomes
- `derived_fields`: every profile field written through semantic judgment
- `omitted`: instruction text, environment implementation, author contact,
  solution, verifier, tests, trajectories, patches, and logs

This metadata is provenance for the corpus. It is not website copy.

## Validation gates

An extraction run is complete only when all checks pass:

### Shared

- valid JSON on every non-empty line
- exact record counts: 113 DeepSWE and 89 Terminal-Bench
- unique `(benchmark, release, native_id)` identities
- native IDs match the pinned repository task directories
- records sorted by native ID
- non-empty title, summary, interaction, intents, technologies, work surfaces,
  expected artifacts, and requirements
- no author email, solution text, verifier text, test text, trajectory, or patch
  content
- every `case_tree` matches `git rev-parse`
- every count is a non-negative integer
- every panel row satisfies the count equation
- every configuration is unique within one case

### DeepSWE

- 113 records
- 41 panel rows per record
- 18,522 total attempts across the corpus
- 41 unique configurations and 13 unique models across the release

### Terminal-Bench

- 89 records
- 20 panel rows per record
- 8,902 total attempts across the corpus
- 20 unique submission configurations and 13 unique models across the release
- every submission trial ID resolves to a Harbor job trial

Any failed gate blocks publication. Write a validation report; do not delete or
coerce the offending record.

## Manifest and R2 layout

Create `corpus/manifest.json` after both JSONL files pass validation. Include:

- manifest version;
- generation timestamp;
- schema and extraction versions;
- source repository URLs and revisions;
- object path, media type, byte size, SHA-256, record count, configuration
  count, model count, and trial count for each corpus;
- validation result.

Create deterministic gzip copies with `gzip -n`. The R2 object layout is:

```text
corpus/v1/manifest.json
corpus/v1/deepswe-v1.1.jsonl
corpus/v1/deepswe-v1.1.jsonl.gz
corpus/v1/terminal-bench-2.1.jsonl
corpus/v1/terminal-bench-2.1.jsonl.gz
```

Upload only after local validation and digest generation. Create a new private
R2 bucket for the corpus. Never run an interactive Wrangler login from an
agent. If Wrangler is missing, install it with Homebrew and notify the user. If
Wrangler is unauthenticated, notify the user and stop before bucket creation.

## Agent handoff checklist

Before reporting completion, an extraction agent must state:

- benchmark and source revision used;
- output file written;
- record, configuration, model, and trial counts;
- whether every validation gate passed;
- any schema drift, source omissions, or unresolved records.

Do not report “complete” based on file creation alone.
