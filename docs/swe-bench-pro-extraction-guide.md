# SWE-Bench Pro public extraction guide

This is the extraction contract for the public SWE-Bench Pro snapshot used by
JustEnough. It covers task profiles and published per-task outcomes. It does
not mirror prompts, patches, tests, environments, or trajectories.

## Pinned sources

| Purpose | Source | Revision |
| --- | --- | --- |
| 731 public tasks | `https://huggingface.co/datasets/ScaleAI/SWE-bench_Pro` | `7ab5114912baf22bb098818e604c02fe7ad2c11f` |
| Per-task outcomes and run notes | `https://github.com/scaleapi/SWE-bench_Pro-os` | `ca10a60a5fcae51e6948ffe1485d4153d421e6c5` |

Treat this snapshot as the release
`swe-bench-pro-public-2026-02-23`. Do not replace either revision with `main`
or a newer leaderboard state during extraction.

The Hugging Face dataset is public and ungated, but its card does not declare a
dataset license. The evaluation repository is MIT-licensed. Store only the
derived evidence records described here; do not copy the raw parquet, problem
statements, gold patches, test patches, test lists, Docker resources, or run
artifacts into R2.

The pinned evaluation repository also warns that the maintainers identified
leaderboard issues on May 18, 2026. Keep the exact revisions and counts visible
in provenance. Do not present these outcomes as a current cross-benchmark
ranking.

## Inputs and command

Prepare:

```text
<source-root>/swe-bench-pro.parquet
<source-root>/swe-bench-pro/              # evaluation repository checkout
```

Then run:

```sh
node scripts/extract-swe-bench-pro.mjs \
  <source-root>/swe-bench-pro.parquet \
  <source-root>/swe-bench-pro \
  corpus/swe-bench-pro-public-2026-02-23.jsonl
```

The extractor requires the `duckdb` CLI to read the parquet without loading
the gold or test columns.

## Fields that may be read

Read only these task columns:

- `repo`
- `instance_id`
- `base_commit`
- `problem_statement`
- `requirements`
- `interface`
- `repo_language`
- `issue_specificity`
- `issue_categories`
- `dockerhub_tag` for source identity only

Read the nine `traj/<configuration>/eval_results.json` files at the pinned
evaluation revision. Each is a map from native task ID to a boolean resolved
outcome.

Do not read `patch`, `test_patch`, `fail_to_pass`, `pass_to_pass`, selected test
files, Dockerfiles, run scripts, trajectories, model patches, or logs to derive
profiles. Requirements and interface descriptions may inform the normalized
demand, but they are not stored as separate profile fields.

## Identity and provenance

Each record uses:

```json
{
  "benchmark": "swe-bench-pro",
  "release": "public-2026-02-23",
  "native_id": "the exact published instance_id"
}
```

Preserve native ID case. The R2 object name is the exact native ID plus
`.json`.

Set `revision.source_revision` to the pinned Hugging Face revision and
`revision.source_url` to the revision-pinned parquet URL. Set `repository` and
`base_commit` from the task row. Set `dataset_ref` to
`ScaleAI/SWE-bench_Pro@<revision>:test`.

SWE-Bench Pro does not publish one Git tree per dataset row. Therefore
`revision.case_tree` is `sha256:<digest>` over the canonical JSON encoding of
the ten allowed task columns above after decoding their published JSON-string
wrappers. It is a row-content identity, not a target-repository tree SHA.

## Profile rules

Use schema version `1` and the shared JustEnough profile shape.

### Title, summary, and description

- Extract the title from a labeled Markdown title or the first meaningful
  heading in `problem_statement`.
- Keep the title direct; remove Markdown framing.
- Write a 6–30 word summary. Reuse a self-contained title when possible;
  otherwise add an operation and repository target.
- Start the description with the summary, followed by at most three distinct
  demand clauses from `requirements`.
- Preserve named interfaces, behavioral relationships, compatibility rules,
  and material numeric constraints.
- Do not include benchmark framing, implementation advice, gold behavior from
  tests, or a difficulty judgment.

### Facets

- `interaction` is `repository`.
- Derive `intents` from the published issue-specificity labels.
- `technologies` begins with the target product or repository and adds only
  named systems observed in the problem, requirements, or interface.
- Map `repo_language` to the conventional language name.
- Derive one to five `work_surfaces` from published issue categories and named
  interfaces.
- Use `repository patch` as the expected artifact.
- Derive one to five difficulty factors from coupled interfaces, state,
  compatibility, security, integration, and quantitative constraints. Every
  factor must belong to the shared vocabulary and be supported by visible task
  metadata.
- Copy `repository`, `language`, `issue_specificity`, and `issue_categories`
  into `observed_labels`.

## Outcome normalization

The pinned repository discloses nine per-task result maps representing eight
model identifiers. Normalize them exactly as the mappings in
`scripts/swe-bench-pro-source.mjs`.

- Use `SWE-Agent` as the harness. The paper identifies SWE-Agent as the common
  scaffold.
- Preserve the result directory as `configuration`.
- Dated `10132025` runs use submission date `2025-10-13`; the repository notes
  that these are 250-turn, uncapped-cost runs.
- Set GPT-5 effort to `high`, as published by the pinned leaderboard page. Use
  `default` where no reasoning-effort label is published.
- A disclosed `true` value is one passed attempt. A disclosed `false` value is
  one failed attempt.
- If a result map has no entry for a current snapshot task, omit that panel row.
  Do not convert missing data into failure, exclusion, or error.
- Ignore result-map IDs that are absent from the pinned 731-task snapshot.
- Set `published_configurations` and `published_trials` to the actual panel
  length for each case.

The pinned intersection contains 6,142 task-level outcomes. Coverage varies by
case because the public result maps were produced against different dataset
states. One current task has no disclosed outcome; that case remains in the
corpus with an empty panel.

Aggregate-only claims must not be attached to case records. In particular,
published aggregate scores for GPT-5.6 Sol, Terra, and Luna do not identify
which tasks passed and therefore are not case-level evidence.

## Validation gates

Publication requires all of the following:

- exactly 731 sorted, unique native IDs matching the pinned parquet;
- exact source revision, target repository, base commit, dataset reference,
  and row digest for every case;
- summary length 6–30 words and description length 25–280 words;
- non-empty intents, technologies, languages, work surfaces, artifacts, and
  difficulty factors;
- only the four allowed observed labels;
- every outcome equals the corresponding pinned boolean result;
- every outcome URL points to the pinned evaluation revision;
- nine unique configurations, eight unique models, and 6,142 total attempts;
- no task code, gold patch, test patch, test list, environment, trajectory, or
  log content in the output.

Any failed gate blocks manifest generation and R2 upload.

## Output and R2 path

Write one JSONL source file:

```text
corpus/swe-bench-pro-public-2026-02-23.jsonl
```

The manifest expands it into one private R2 object per task:

```text
datasets/v1/swe-bench-pro-public-2026-02-23/<native-id>.json
```

Upload the 731 immutable case objects first and `datasets/v1/manifest.json`
last. The bucket remains private; the Worker is the read boundary.
