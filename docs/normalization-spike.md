# Normalization spike

Date: 2026-07-13

## Result

The compact abstraction works for both DeepSWE v1.1 and Terminal-Bench 2.1.
The useful search document is a **case profile**, not a copy of a benchmark
task:

- title and short summary;
- interaction mode;
- intent, technologies, languages, and work surfaces;
- expected artifacts;
- a small list of requirements that materially distinguish the task.

Identity, revision, and provenance sit beside the profile. Outcomes sit beside
both and remain attached to an exact model, provider, harness version, and
effort setting.

The fixtures are:

- `fixtures/normalization/deepswe-v1.1.jsonl`
- `fixtures/normalization/terminal-bench-2.1.jsonl`

## Sample

Five cases were selected from each benchmark by sorting task IDs by the SHA-256
of `20260713:<benchmark>:<task-id>` and taking the first five. This gives a
repeatable sample without choosing cases for a desired result.

| Benchmark | Cases in release | Sampled cases |
| --- | ---: | --- |
| DeepSWE v1.1 | 113 | Testem bailout, mnamer daemon lifecycle, Obsidian TOC, Kombu consumer priority, Task graph export |
| Terminal-Bench 2.1 | 89 | MuJoCo tuning, C/Python polyglot, Bottle vulnerability, DNA primers, QEMU SSH |

The outcome panel uses four published configurations that have close model and
effort counterparts across the two benchmarks. The harnesses are deliberately
not treated as equivalent:

| Model family | DeepSWE harness | Terminal-Bench harness |
| --- | --- | --- |
| GPT-5.6 Luna, max | mini-swe-agent | Codex 0.144.1 |
| Claude Sonnet 5, high | mini-swe-agent | Claude Code 2.1.205 |
| Gemini 3.1 Pro Preview, high | mini-swe-agent | Gemini CLI 0.40.0 |
| GPT-5.5, xhigh | mini-swe-agent | Terminus 2.0.0 |

This is a comparison panel, not exhaustive leaderboard coverage. DeepSWE has
four trials per selected configuration; Terminal-Bench has five.

### Published passes in the panel

| DeepSWE case | Luna | Sonnet | Gemini | GPT-5.5 |
| --- | ---: | ---: | ---: | ---: |
| Testem bailout | 2/4 | 1/4 | 0/4 | 1/4 |
| mnamer daemon lifecycle | 4/4 | 3/4 | 0/4 | 4/4 |
| Obsidian TOC | 0/4 | 0/4 | 0/4 | 0/4 |
| Kombu consumer priority | 2/4 | 0/4 | 0/4 | 4/4 |
| Task graph export | 4/4 | 2/4 | 1/4 | 4/4 |

| Terminal-Bench case | Luna | Sonnet | Gemini | GPT-5.5 |
| --- | ---: | ---: | ---: | ---: |
| MuJoCo tuning | 5/5 | 4/5 | 5/5 | 5/5 |
| C/Python polyglot | 5/5 | 5/5 | 5/5 | 5/5 |
| Bottle vulnerability | 2/5 | 5/5 | 5/5 | 5/5 |
| DNA primers | 0/5 | 0/5 | 0/5 | 1/5 |
| QEMU SSH | 0/5 | 4/5 | 0/5 | 3/5 |

Errors and disqualifications are retained in the fixtures. In particular,
three Luna trials on the Bottle case were disqualified by the official
Terminal-Bench submission policy and therefore count as failures here.

## What the spike changed

The summary alone is not enough. MuJoCo's speed and tolerance targets, the
polyglot compiler versions, and the primer length and melting-temperature
rules are important matching signals. A short `requirements` list captures
these without storing the full prompt.

Raw environment records are not useful search documents. A fact such as
“Alpine in QEMU” belongs in technologies and requirements because it defines
the work. Docker image names, CPU limits, build timeouts, and similar harness
details can stay in the source snapshot unless a query needs a compatibility
filter.

Task code, solutions, verifier material, and trajectories are not needed for
the first corpus. We do need an immutable source revision and per-case tree
hash so the profile can be audited and regenerated.

“Model X solves this task” is too lossy. The smallest honest outcome record is:

```text
case revision
+ provider and model
+ harness and version
+ effort
+ attempts, passes, failures, errors, exclusions, disqualifications
```

The sample demonstrates why repeated counts matter: several configurations are
neither 0% nor 100%, and QEMU results differ sharply across harnesses.

## Extraction method

LLM extraction is the right default for summaries and semantic facets. These
cases contain implicit task shape, cross-file scope, security meaning, systems
work, and molecular-biology constraints that would be brittle to encode as
benchmark-specific parsing rules.

Code should still handle the parts where interpretation is harmful:

- pinning releases and case revisions;
- deterministic sampling;
- parsing observed metadata;
- joining trials to exact execution configurations;
- validating the output shape and counts.

Every derived field in the fixtures is marked as such and carries an extraction
method and version. That is enough to re-extract later without pretending the
facets were published by the benchmark.

## Recommendation

Use this `0.1` shape for the next retrieval experiment. Before building full
adapters, review these ten profiles for vocabulary consistency and test whether
they retrieve sensible matches for a small set of real target tasks. If that
works, expand to a stratified sample of roughly 25 cases per benchmark and only
then freeze a schema.

