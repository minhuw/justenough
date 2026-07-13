# JustEnough Evidence Routing

JustEnough uses benchmark evidence to decide which model, effort setting, harness, and tools are sufficient for a target task. This glossary keeps published benchmark material, derived similarity signals, and observed executions distinct.

## Work to route

**Target Task**:
The work a user currently wants an agent to accomplish.
_Avoid_: Query, prompt, benchmark task

**Task Profile**:
A structured description of a Target Task's intent, technical context, expected result, constraints, and uncertainty.
_Avoid_: Embedding, feature vector

**Execution Configuration**:
The complete model, effort setting, harness, tools, and runtime conditions under which an agent attempts work.
_Avoid_: Model, model choice, agent

**Effort Setting**:
An explicitly named inference-time reasoning or compute setting within an Execution Configuration.
_Avoid_: Intelligence, difficulty

## Benchmark evidence

**Benchmark**:
A named evaluation collection governed by a common construction and scoring policy.
_Avoid_: Dataset, leaderboard

**Benchmark Release**:
An immutable published snapshot of a Benchmark, including its case revisions and scoring policy.
_Avoid_: Latest, dataset version

**Benchmark Case**:
A stable conceptual evaluation item that can persist while its instructions, verifier, or environment are revised.
_Avoid_: Sample, instance, problem, task

**Case Identity**:
The stable identity of a Benchmark Case across revisions.
_Avoid_: Task name, row ID

**Case Revision**:
An immutable form of a Benchmark Case with exact instructions, initial state, verifier, environment, and resource policy.
_Avoid_: Case, current version

**Case Lineage**:
The declared relationship among revisions of the same Benchmark Case.
_Avoid_: Changelog

**Source Record**:
An immutable piece of upstream benchmark material from which evidence is observed.
_Avoid_: Raw data, blob

**Provenance**:
The source, revision, location, and access time that support an evidence claim.
_Avoid_: Citation alone

## Case meaning

**Requirement**:
A behavior or property that a successful result must satisfy.
_Avoid_: Test, implementation step

**Facet**:
A normalized characteristic used to compare a Target Task with Benchmark Cases, such as intent, technology, work surface, or expected result.
_Avoid_: Tag, keyword

**Constraint**:
A limit or precondition on how work may be attempted, such as network access, available tools, resources, or time.
_Avoid_: Requirement

**Verification Contract**:
The observable conditions and scoring policy used to decide the outcome of a Case Revision.
_Avoid_: Tests, reward

**Visibility Class**:
Whether material is available to the evaluated agent, reserved for verification, held as a reference, or merely public metadata.
_Avoid_: Hidden flag

**Interaction Mode**:
The primary work surface through which an agent changes the world, such as a repository, terminal environment, or desktop GUI.
_Avoid_: Benchmark type

## Execution evidence

**Trial**:
One attempt by one Execution Configuration on one exact Case Revision.
_Avoid_: Run, result

**Outcome**:
The recorded completion status, scores, resource use, and artifacts of a Trial.
_Avoid_: Pass rate, result

**Scored Attempt**:
A Trial included by a Benchmark Release's scoring policy.
_Avoid_: Valid run

**Evidence Set**:
The group of Case Revisions and Trials supporting a similarity claim or routing decision.
_Avoid_: Search results

**Evidence Coverage**:
How completely an Evidence Set represents the facets and Execution Configurations relevant to a Target Task.
_Avoid_: Confidence

## Evidence quality

**Observed Fact**:
A claim copied or parsed directly from a Source Record.
_Avoid_: Ground truth

**Derived Fact**:
A reproducible interpretation computed from one or more Observed Facts.
_Avoid_: Observed metadata

**Quality Assertion**:
A sourced claim about the validity, reliability, contamination, or fairness of a Benchmark Release or Case Revision.
_Avoid_: Quality score

**Unknown**:
A concept that applies but whose value is not available from the inspected sources.
_Avoid_: Null, zero, false

**Not Applicable**:
A concept that does not meaningfully apply to the evidence item.
_Avoid_: Unknown

**Unsupported**:
A concept the current source adapter cannot faithfully represent or extract.
_Avoid_: Unknown, error

**Redacted**:
A value intentionally withheld by its source.
_Avoid_: Unknown

**Conflict**:
Two or more sourced claims that cannot simultaneously be treated as the same fact.
_Avoid_: Error, latest wins

## Matching and routing

**Similarity Match**:
A Case Revision judged relevant to a Target Task, with explicit matched facets, mismatches, and unknowns.
_Avoid_: Nearest neighbor

**Execution Support**:
The Trials that show how an Execution Configuration performed on a Similarity Match.
_Avoid_: Model score

**Routing Recommendation**:
An evidence-backed choice of Execution Configuration for a Target Task, including uncertainty and abstention conditions.
_Avoid_: Best model

