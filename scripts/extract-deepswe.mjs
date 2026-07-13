import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SOURCE_REVISION = "6db64a40f3318d8659238ff34a8cc4b491c49205";
const SOURCE_REPOSITORY = "https://github.com/datacurve-ai/deep-swe";
const TRIALS_ARTIFACT_URL =
  "https://deepswe.datacurve.ai/artifacts/v1.1/trials.json";

const [
  repoDir = "/private/tmp/justenough-extraction-20260713/deep-swe",
  tasksPath = "/private/tmp/deepswe-v1.1-tasks.json",
  trialsPath = "/private/tmp/deepswe-v1.1-trials.json",
  outputPath = "corpus/deepswe-v1.1.jsonl",
] = process.argv.slice(2);

const projectNames = {
  abs: "ABS",
  actionlint: "actionlint",
  adaptix: "Adaptix",
  aiomonitor: "aiomonitor",
  anko: "Anko",
  arcane: "Arcane",
  arktype: "ArkType",
  awilix: "Awilix",
  bandit: "Bandit",
  boa: "Boa",
  cattrs: "cattrs",
  clack: "Clack",
  "claude-code-by-agents": "Claude Code by Agents",
  cliffy: "Cliffy",
  csstree: "CSSTree",
  dasel: "Dasel",
  dateutil: "python-dateutil",
  "drizzle-orm": "Drizzle ORM",
  "dynamodb-toolbox": "DynamoDB Toolbox",
  effect: "Effect",
  eicrud: "EICRUD",
  etree: "etree",
  expr: "Expr",
  fastapi: "FastAPI",
  fd: "fd",
  geo: "Geo",
  "go-critic": "go-critic",
  "go-genai": "Go GenAI",
  "go-git": "go-git",
  goreleaser: "GoReleaser",
  gql: "gql",
  "happy-dom": "Happy DOM",
  helm: "Helm",
  httpx: "HTTPX",
  igel: "igel",
  ink: "Ink",
  ipython: "IPython",
  katex: "KaTeX",
  "kcp-go": "kcp-go",
  kea: "Kea",
  kgateway: "kgateway",
  kombu: "Kombu",
  koota: "Koota",
  kysely: "Kysely",
  langchain: "LangChain",
  mashumaro: "Mashumaro",
  meriyah: "Meriyah",
  mnamer: "mnamer",
  mobly: "Mobly",
  narwhals: "Narwhals",
  numba: "Numba",
  "obsidian-linter": "Obsidian Linter",
  ofetch: "ofetch",
  onedump: "onedump",
  opa: "Open Policy Agent",
  optique: "Optique",
  oxvg: "oxvg",
  participle: "Participle",
  pebble: "Pebble",
  pest: "Pest",
  prometheus: "Prometheus",
  "psd-tools": "psd-tools",
  pwntools: "pwntools",
  "python-statemachine": "python-statemachine",
  query: "TanStack Query",
  quill: "Quill",
  returns: "Returns",
  scc: "scc",
  scriggo: "Scriggo",
  skrub: "skrub",
  "sql-formatter": "SQL Formatter",
  sqlfmt: "sqlfmt",
  "sqlite-utils": "sqlite-utils",
  superjson: "SuperJSON",
  task: "Task",
  tengo: "Tengo",
  termenv: "termenv",
  testem: "Testem",
  textual: "Textual",
  tomlkit: "TOMLKit",
  "true-myth": "True Myth",
  "ts-pattern": "ts-pattern",
  updo: "Updo",
  valibot: "Valibot",
  vitest: "Vitest",
  vulture: "Vulture",
  wasmi: "wasmi",
  wazero: "wazero",
  yaegi: "Yaegi",
  yjs: "Yjs",
  ytt: "ytt",
};

const languageNames = {
  go: "Go",
  javascript: "JavaScript",
  python: "Python",
  rust: "Rust",
  typescript: "TypeScript",
};

// Semantic overrides for instructions whose formatting produces incomplete
// clauses when treated as independent Markdown bullets or sentences.
const requirementOverrides = {
  "actionlint-action-pinning-lint": [
    "Check action and reusable-workflow `uses:` references with the `action-pinning` lint rule",
    "Support `major-minor`, `semver`, and `commit-sha` levels, defaulting to `semver`",
    "Require full 40-character lowercase hexadecimal values at the `commit-sha` level",
    "Skip local and Docker references, but report dynamic version expressions that cannot be verified",
    "Merge allow and deny lists across matching configurations with denials taking precedence",
    "Let per-path configuration and `-action-pinning-level` enable or override only the pinning level",
  ],
  "arcane-drift-detection-baselines": [
    "Add drift baseline, drift record, and compliance snapshot models with SQLite and PostgreSQL migration 041 files",
    "Compare live container configurations against the active baseline and create one drift record per changed field",
    "Compare Env, Ports, and Volumes without regard to order and auto-resolve only detected conditions that clear",
    "Keep drift detection enabled by default and make service and scheduler paths safe when dependencies are nil",
    "Expose baseline, detection, drift, and history operations through native Gin routes with lowerCamelCase JSON",
    "Register the service, routes, scheduler job, and default drift settings in application bootstrap code",
  ],
  "bandit-interprocedural-taint-checks": [
    "Track input taint from Flask request data, `sys.argv`, `input()`, and `os.environ` into security-sensitive sinks",
    "Propagate taint through string construction, calls, multi-hop assignments, nested functions, and import aliases",
    "Treat parameterized query values, numeric conversion, path basenames, shell quoting, and HTML escaping as safe",
    "Add B620 through B624 checks for SQL injection, shell injection, path traversal, SSRF, and XSS sinks",
    "Report every new plugin finding with HIGH severity and MEDIUM confidence",
  ],
  "claude-code-by-agents-recursive-delegation": [
    "Trigger delegation through `delegate_task` with an `agent_id` and delegated instructions",
    "Run the selected sub-agent and feed one JSON `tool_result` containing its accumulated text back to the delegating agent",
    "Match the streamed tool-use ID to `tool_result.tool_use_id`",
    "Report unknown agents with both a stream error and an error tool result that names the requested agent",
    "Report sub-agent failures only through an error tool result",
    "Report circular delegation with a stream-level error whose message mentions `circular`",
  ],
  "drizzle-orm-window-function-builders": [
    "Add typed ranking, offset, value, and aggregate window helpers whose builders expose `.over()`",
    "Support inline and named window specifications with partitioning, ordering, and row or range frames",
    "Emit numeric positional arguments as SQL literals rather than bound parameters",
    "Validate positional arguments, window names, frame ordering, and frame-boundary offsets",
    "Compile named windows before `ORDER BY` and named references as quoted `OVER` names without parentheses",
    "Export all helpers and preserve nullable value-access typing, removing null when lag or lead has a default",
  ],
  "eicrud-keyset-pagination-cursor": [
    "Add keyset pagination through a `cursor` option on `$find`",
    "Return `nextCursor` for ordered limited queries only when more results remain",
    "Encode sort values, the configured entity ID, and normalized sort directions in a Base64 JSON cursor",
    "Support single- and multi-column ordering in ascending or descending directions",
    "Return HTTP 400 for incompatible offset use, missing ordering, malformed cursors, mismatched sorting, or a missing entity ID",
  ],
  "etree-xml-diff-patch": [
    "Add nil-safe recursive element equality and document diff operations for elements, text, and attributes",
    "Generate and apply XML patch documents using positional XPath selectors and the XML patch namespace",
    "Reverse patches in reverse operation order while handling element, attribute, text, and replacement operations",
    "Merge three document versions with configurable identity, conflict classification, and optional automatic resolution",
    "Expose diff summaries, document convenience methods, and merge provenance in document metadata",
    "Preserve documented operation value types, string forms, default diff options, and default merge options",
  ],
  "go-git-worktree-merge-conflicts": [
    "Add `Worktree.Merge` with fast-forward behavior or a three-way merge and merge commit",
    "Merge non-overlapping changes automatically and reject dirty worktrees with `ErrUncommittedChanges`",
    "Write conflict markers, index stages 1/2/3 when present, and `.git/MERGE_HEAD` before returning `ErrMergeConflicts`",
    "Detect overlapping content, delete-modify, file-directory, and differing add-add conflicts",
    "Make `Commit` append the MERGE_HEAD commit as a second parent and then remove the file",
    "Make `Add` replace conflict stages for a restaged file with a single stage-0 entry",
  ],
  "httpx-multipart-response-parsing": [
    "Add synchronous and asynchronous multipart iterators that yield `MultipartPart` values from `multipart/*` responses",
    "Parse and validate the final boundary parameter case-insensitively, rejecting malformed media types and boundary values",
    "Handle preambles, epilogues, exact delimiters, and LF, CRLF, or CR line endings across chunks",
    "Preserve duplicate and continued headers while rejecting malformed part headers",
    "Exclude delimiter line endings from part bodies and allow a closing boundary to yield zero parts",
    "Consume and close streaming responses once while keeping in-memory multipart iteration repeatable",
  ],
  "httpx-streaming-json-iteration": [
    "Add synchronous and asynchronous JSON iterators for JSON, NDJSON, and JSON text sequence media types",
    "Validate optional charsets and otherwise detect UTF-8, UTF-16, or UTF-32 encodings including a UTF-8 BOM",
    "Parse exactly one JSON value for standard JSON, yielding array elements individually and rejecting trailing data",
    "Parse each non-blank NDJSON line as exactly one JSON text",
    "Require record separators for JSON text sequences and enforce the specified empty-record and final-record behavior",
    "Consume and close streaming responses once while keeping in-memory JSON iteration repeatable",
  ],
  "ipython-session-bundle-replay": [
    "Expose `%session_bundle` controls and matching `InteractiveShell` methods for starting, stopping, and inspecting recording",
    "Store bundles as ZIP archives containing `metadata.json` and `events.jsonl`",
    "Record contiguous cell events with code, execution state, streams, display results, and structured errors",
    "Advance execution history only when replay uses `store_history=True`",
    "Validate bundle schemas in strict or non-strict mode and expose validation paths and errors",
    "Apply ordered literal redactions throughout `events.jsonl` and enforce overwrite behavior for existing bundles",
  ],
  "kcp-go-multiplexed-kcp-streams": [
    "Multiplex independent ordered streams over one connection with client odd IDs and server even IDs",
    "Apply per-stream byte windows so blocked writers resume on window updates without stalling other streams",
    "Prioritize higher-priority stream data and send control frames before queued data frames",
    "Expose stream lifecycle, deadlines, half-close behavior, and the six required SNMP counters",
    "Unblock readers and writers with `io.ErrClosedPipe` when streams or sessions close",
    "Make session close return promptly even when the underlying connection write is blocked",
  ],
  "kombu-virtual-queue-dead-lettering": [
    "Persist queue properties in shared broker state and convert queue keyword arguments to and from `x-*` arguments",
    "Resolve dead-letter exchanges, routing keys, and effective message TTL from queue attributes or arguments",
    "Apply per-message or per-queue expiration and evict oldest messages when maximum queue length is exceeded",
    "Skip and dead-letter expired messages during retrieval and expose remaining-TTL and drain operations",
    "Route rejected, expired, and max-length messages through the configured DLX with cycle and hop limits",
    "Maintain `x-death` and first-death headers while clearing expiration metadata on dead-lettered messages",
  ],
  "kysely-window-grouping-helpers": [
    "Add cube, rollup, and grouping-set query-builder methods that compose with existing grouping",
    "Compile grouping sets with per-set parentheses while keeping cube and rollup contents flat",
    "Strip only SQL-standard implicit RANGE extents in `SimplifyFramePlugin`",
    "Add ROWS, RANGE, and GROUPS extent builders with two-sided bounds and exclusion modifiers",
    "Accept numeric or expression offsets while parameterizing numeric extent values",
    "Add typed ranking and value accessors plus null-respect and null-ignore modifiers",
  ],
  "langchain-request-coalescing": [
    "Add `Runnable.with_coalesce()` so concurrent calls with the same input share one execution",
    "Apply coalescing across synchronous and asynchronous invoke, stream, batch, and batch-as-completed methods",
    "Build keys from input values alone, independent of configuration, keyword arguments, or dictionary key ordering",
    "Replay complete streams to joiners, preserve batch ordering, and fire callbacks for joined callers",
    "Provide synchronous and asynchronous backend registration, joining, completion, activity, and statistics operations",
    "Keep the in-memory backend thread-safe and let clear cancel waiters and reset statistics",
  ],
  "meriyah-explicit-resource-declarations": [
    "Parse `using` and `await using` declarations when `next: true` and emit the corresponding declaration kinds",
    "Treat `using` followed by a line break as an identifier rather than a declaration",
    "Allow `using` in all scopes but restrict `await using` to async or module-level contexts",
    "Support both declaration forms in for-of and for-await-of heads while rejecting for-in and destructuring forms",
    "Report the specified messages for global scope, async context, missing initializer, for-in, and destructuring errors",
    "Prioritize the async-context error for `await using` at script top level",
  ],
  "mnamer-daemon-watch-lifecycle": [
    "Add daemon lifecycle, run-once, validation, state, watch, batch, logging, and notification CLI options",
    "Scan only top-level files, avoid network and prompts, and move stable files without overwriting destinations",
    "Combine CLI and JSON-configured watch paths while validating required path, movie directory, and exclusion fields",
    "Create non-empty state before daemon processing and append per-cycle logs at the state-derived log path",
    "Apply stability checks and a global batch-size cap while skipping only `.part` suffixes",
    "Use exit code 2 for invalid lifecycle or configuration requests and keep dry-run free of state, log, and file changes",
  ],
  "mobly-grouped-test-barriers": [
    "Run global setup and teardown around no-entry, implicit-group, or explicit-group execution modes",
    "Run explicit group participants concurrently between one group setup and one group teardown",
    "Resolve participant group and ID from configuration entries and expose device context only in group phases and tests",
    "Synchronize explicit participants by instance, group, hook or test, and step name with reusable barriers",
    "Reject invalid synchronization contexts and timeouts with the documented exception types and messages",
    "Continue other groups after group setup failures and always run the applicable teardown hooks",
  ],
  "ofetch-per-origin-circuit-breaker": [
    "Add an opt-in per-origin circuit breaker with documented defaults for threshold, cooldown, probes, and failure statuses",
    "Transition deterministically between closed, open, and half-open states using `Date.now()`",
    "Resolve state keys from the effective request origin and share state across clients derived from one parent",
    "Limit concurrent half-open probes and keep each probe slot for the full logical request including retries",
    "Count each failed logical request once across network, body, parsing, hook, and configured status failures",
    "Reject open or over-quota requests before fetch with an error containing `Circuit breaker is open`",
  ],
  "participle-grammar-conflict-analysis": [
    "Add build-tagged grammar conflict types and analysis APIs while leaving new symbols unavailable without the analyze tag",
    "Populate every conflict with type, severity, location, message, grammar snippet, example, and actionable suggestion",
    "Provide immutable report filtering, counting, formatting, merging, and deduplication operations",
    "Let parsers analyze with optional conflict suppression and let `StrictMode` reject every reported conflict during build",
    "Detect first-first, first-follow, and unreachable alternatives with the specified severity and token-overlap rules",
    "Suppress analysis inside lookahead groups and treat negation nodes as conflict-free",
  ],
  "sqlite-utils-safe-import-checkpoints": [
    "Create safe-import checkpoints that restore data and schema changes exactly on failure",
    "Support nested checkpoint creation, commit, rollback, cleanup, and distinct inactive or unknown checkpoint errors",
    "Persist table invariants and evaluate SELECT, aggregate, or row-level expressions with structured failure details",
    "Add safe bulk insert, upsert, CSV import, and JSON import operations with strict and non-strict behavior",
    "Expose safe-import and invariant management commands plus safe-mode options for insert, upsert, and bulk",
    "Exit successfully only when safe-mode writes commit while invariant validation commands always exit zero",
  ],
  "sqlfmt-create-table-ddl-formatting": [
    "Format CREATE TABLE bodies with the opening parenthesis after the table name and the closing parenthesis at depth zero",
    "Put each column or table constraint on its own indented line with commas between items and no trailing comma",
    "Keep nested types, inline constraints, table constraints, and post-body clauses on their required single lines",
    "Lowercase DDL keywords and type names and place the terminating semicolon on its own depth-zero line",
    "Leave CREATE TABLE AS SELECT and CREATE TABLE LIKE statements unchanged",
    "Add value-comparable DDL model classes and a parser that reconstructs types and collects every table-level constraint",
  ],
  "task-task-graph-export": [
    "Add a `--graph` view with JSON, DOT, and indented text formats",
    "Include roots, node metadata, dependency and command edges, depth groups, and longest path in JSON output",
    "Mark up-to-date DOT nodes as dashed and suppress status fields or styling under `no-status`",
    "Support reverse dependency traversal across the complete Taskfile",
    "Resolve aliases, wildcards, includes, defaults, and for-loop expansions consistently",
    "Report missing tasks and dependency cycles with errors that name the affected tasks",
  ],
  "testem-bail-on-test-failure": [
    "Add `bail_on_test_failure` with false, true, or positive-integer thresholds and validate invalid values",
    "Stop on the configured non-skipped failure count and expose resettable reason, launcher, count, and failed-test state",
    "Emit bailout summaries through TAP, Dot, TeamCity, and XUnit reporters",
    "Make runner, server, and application abort operations idempotent and suppress later results or errors",
    "Guard Mocha, Jasmine2, and QUnit browser emissions after abort, including deferred callbacks",
    "Return a distinct bail exit error using only the reported bail reason and pre-bail test count",
  ],
  "textual-richlog-follow-state": [
    "Expose `is_following_end`, `follow_end()`, and a `FollowChanged` message on Log and RichLog",
    "Post follow changes only when the following state boolean changes",
    "Follow appended content only while already at the end and restore following after scrolling back to the end",
    "Keep the viewport stable during appends and `max_lines` pruning when not following",
    "Preserve expanded and justified RichLog rendering across deferred writes and resizes",
    "Add an interactive example for toggling follow state, appending entries, and recording follow events",
  ],
  "vitest-duration-sharding": [
    "Add and validate the 12 duration-aware sequence fields and serialize them to worker configuration",
    "Read, migrate, expire, smooth, and cap duration history observations using project-relative normalized paths",
    "Implement time, round-robin, affinity, and fallback sharding with deterministic tie-breaking",
    "Apply slow-file isolation, affinity load accounting, and rebalance warnings with fixed ratio formatting",
    "Sort by recorded duration when requested and record rounded final durations while preserving unrelated history entries",
    "Resolve `balanceShardsByTime` to the time strategy only when compatible and otherwise force it off",
  ],
  "wazero-multi-module-snapshots": [
    "Capture, incrementally capture, and restore consistent memory snapshots across multiple WebAssembly modules",
    "Expose reconstructed data, compressed data, versions, tags, and byte-level comparisons through the Snapshot interface",
    "Validate module, baseline, module-count, and restore-size errors with the documented messages and error code",
    "Assign gap-free coordinator versions and make coordinators and the named registry safe for concurrent use",
    "Provide context helpers, summaries, snapshot chains, and portable marshal and unmarshal operations",
    "Expose `NewSnapshotCoordinator()` from the experimental package",
  ],
  "ytt-jsonpath-query-api": [
    "Add `Query` and `QueryOne` to orderedmap for JSONPath evaluation",
    "Support dot and bracket keys, indices, unions, recursive descent, logical filters, and negative indexing",
    "Support `length()`, end-relative array scripts, and the documented truthiness rules",
    "Return empty results for no matches or incompatible selectors rather than errors",
    "Return positional `SyntaxError` values for malformed paths",
    "Expose Starlark `query` and `query_one` through `JSONPathAPI` with Starlark and Go value conversion",
  ],
};

const technologyRules = [
  [/\bJSON Schema\b/i, "JSON Schema"],
  [/\bDynamoDB\b/i, "DynamoDB"],
  [/\bGraphQL\b/i, "GraphQL"],
  [/\bServer-Sent Events\b|\bSSE\b/, "Server-Sent Events"],
  [/\bRFC 5545\b/i, "RFC 5545"],
  [/\biCalendar\b|\bVCALENDAR\b/i, "iCalendar"],
  [/\bPostgreSQL\b|\bpostgres\b/i, "PostgreSQL"],
  [/\bSQLite\b/i, "SQLite"],
  [/\bSQL\b/, "SQL"],
  [/\bHTML\b/, "HTML"],
  [/\bCSS\b/, "CSS"],
  [/\bXML\b/, "XML"],
  [/\bJSON\b/, "JSON"],
  [/\bTOML\b/, "TOML"],
  [/\bYAML\b/, "YAML"],
  [/\bHTTP\b/, "HTTP"],
  [/\bWebSocket\b/i, "WebSocket"],
  [/\bDocker\b/i, "Docker"],
  [/\bTeamCity\b/i, "TeamCity"],
  [/\bXUnit\b/i, "xUnit"],
  [/\bTAP\b/, "TAP"],
  [/\bMuJoCo\b/i, "MuJoCo"],
  [/\bBigQuery\b/i, "BigQuery"],
  [/\bZod\b/, "Zod"],
  [/\bPrometheus\b/, "Prometheus"],
  [/\bKubernetes\b/i, "Kubernetes"],
  [/\bHelm\b/, "Helm"],
  [/\bGitHub Actions\b/i, "GitHub Actions"],
  [/\bGit\b/, "Git"],
  [/\bNode\.js\b/i, "Node.js"],
  [/\basyncio\b/i, "asyncio"],
  [/\bNumPy\b/i, "NumPy"],
  [/\bPandas\b/i, "pandas"],
  [/\bWebAssembly\b|\bWasm\b/, "WebAssembly"],
  [/\bANSI\b/, "ANSI"],
  [/\bRFC\s*6902\b/i, "JSON Patch"],
];

const surfaceRules = [
  [/\bcommand[- ]line\b|\bCLI\b|--[a-z]/i, "CLI"],
  [/\bHTTP API\b|\bendpoint\b|\bweb API\b/i, "HTTP API"],
  [/\bHTTP server\b|\bserver\b/i, "HTTP server"],
  [/\bparser\b|\bsyntax\b|\bAST\b|\bgrammar\b/i, "parser"],
  [/\bcompiler\b|\bcompile\b|\bcode generation\b/i, "compiler"],
  [/\bmodule (?:loading|loader|resolution)\b|\brequire\(\)/i, "module loader"],
  [/\bcach(?:e|ing|ed)\b/i, "cache"],
  [/\bdatabase schema\b|\bmigration\b|\btable\b/i, "database schema"],
  [/\bquery builder\b|\bquery\b|\bpagination\b/i, "query layer"],
  [/\bserializ|\bdeserializ|\bformat(?:ter|ting)?\b/i, "serialization"],
  [/\bconfig(?:uration)?\b|\boption\b/i, "configuration"],
  [/\bfilesystem\b|\bfile system\b|\bfile watcher\b/i, "filesystem"],
  [/\bnetwork\b|\bsocket\b|\bTCP\b|\bstream\b/i, "network service"],
  [/\bscheduler\b|\btask graph\b|\bconcurren/i, "task scheduler"],
  [/\brender(?:er|ing)?\b|\blayout\b|\bUI\b/i, "renderer"],
  [/\btest runner\b|\breporter\b|\blauncher\b/i, "test runner"],
  [/\bschema\b|\bvalidation\b|\bvalidator\b/i, "validation layer"],
  [/\bruntime\b|\bVM\b|\binterpreter\b/i, "runtime"],
  [/\bAPI\b|\bmethod\b|\bfunction\b/i, "library API"],
  [/\bbuild\b|\brelease\b|\bpublish\b/i, "build system"],
];

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function dedupe(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value.toLocaleLowerCase("en-US");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseTomlString(section, key) {
  const match = section.match(new RegExp(`^${key}\\s*=\\s*("(?:\\\\.|[^"\\\\])*")\\s*$`, "m"));
  return match ? JSON.parse(match[1]) : undefined;
}

function tomlSection(source, name) {
  const match = source.match(
    new RegExp(`^\\[${name.replaceAll(".", "\\.")}\\]\\s*$([\\s\\S]*?)(?=^\\[|\\Z)`, "m"),
  );
  if (!match) fail(`Missing [${name}] section`);
  return match[1];
}

function projectName(repository) {
  const slug = repository.split("/").at(-1).toLocaleLowerCase("en-US");
  return projectNames[slug] ?? repository.split("/").at(-1);
}

function deriveIntents(text, category) {
  const intents = [];
  if (category === "bugfix") intents.push("bug repair");
  if (/security|vulnerab|taint|pinning|encrypt/i.test(text)) {
    intents.push("security remediation");
  }
  if (/performance|optimi[sz]|bounded memory|cache|coalesc|spill/i.test(text)) {
    intents.push("performance optimization");
  }
  if (/configur|policy|setting|option/i.test(text)) {
    intents.push("configuration tuning");
  }
  if (/convert|transform|serializ|format|diff|patch|encoding/i.test(text)) {
    intents.push("data transformation");
  }
  if (/\bfix\b|\brepair\b|\bharden\b|\bcorrect\b|\bpreserv/i.test(text)) {
    intents.push("bug repair");
  }
  if (/test|validation|lint|checker|analysis/i.test(text)) {
    intents.push("test and validation");
  }
  if (
    category === "feature_request" ||
    category === "enhancement" ||
    /\badd\b|implement|support|expose/i.test(text)
  ) {
    intents.unshift("feature implementation");
  }
  return dedupe(intents).slice(0, 4);
}

function deriveTechnologies(repository, text) {
  const values = [projectName(repository)];
  for (const [pattern, name] of technologyRules) {
    if (pattern.test(text)) values.push(name);
  }
  return dedupe(values).slice(0, 8);
}

function deriveSurfaces(text) {
  const values = [];
  for (const [pattern, name] of surfaceRules) {
    if (pattern.test(text)) values.push(name);
  }
  return dedupe(values).slice(0, 5).length > 0
    ? dedupe(values).slice(0, 5)
    : ["library API"];
}

function cleanRequirement(value) {
  return value
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/^\*\*([^*]+)\*\*\s*:?[—-]?\s*/, "$1: ")
    .replace(/\s+/g, " ")
    .replace(/[.;:]$/, "")
    .trim();
}

function deriveRequirements(instruction, taskId) {
  if (requirementOverrides[taskId]) return requirementOverrides[taskId];

  const clean = instruction.replace(
    /\s*IMPORTANT:\s*Please work on this[\s\S]*$/i,
    "",
  );
  const candidates = [];
  let index = 0;

  for (const rawLine of clean.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /^#{1,6}\s*(background|expected (?:behavior|outcomes)|constraints?|acceptance criteria|assumptions?)\s*$/i.test(line)) {
      continue;
    }
    const pieces = /^[-*+]\s+|^\d+[.)]\s+/.test(line)
      ? [line]
      : line
          .split(/\s+--\s+|;\s+/)
          .flatMap((part) => part.split(/(?<=[.!?])\s+(?=[A-Z`])/));
    for (const piece of pieces) {
      const value = cleanRequirement(piece);
      if (value.length < 18 || value.length > 280) continue;
      if (/^(background|expected behavior|expected outcomes|constraints|acceptance criteria)$/i.test(value)) {
        continue;
      }
      if (
        /(?:must contain|with these sub-fields|following|for example|\. Returns|additional rolling window methods)$/i.test(
          value,
        ) ||
        /^(?:the literal|the variable name|the source type|the declared target type)\b/i.test(
          value,
        )
      ) {
        continue;
      }
      let score = 0;
      if (/\bmust\b|\bshould\b|\brequires?\b|\breject/i.test(value)) score += 5;
      if (/\badd\b|\bimplement\b|\bsupport\b|\bexpose\b|\bpreserve\b|\breturn\b/i.test(value)) score += 3;
      if (/\bdefault\b|\berror\b|\bwhen\b|\bwithout\b|\bonly\b/i.test(value)) score += 2;
      if (/\d|`[^`]+`|\/[a-z]/i.test(value)) score += 2;
      candidates.push({ index: index++, score, value });
    }
  }

  const selected = [];
  const seen = new Set();
  for (const candidate of [...candidates].sort((a, b) => b.score - a.score || a.index - b.index)) {
    const key = candidate.value.toLocaleLowerCase("en-US");
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(candidate);
    if (selected.length === 6) break;
  }
  selected.sort((a, b) => a.index - b.index);

  if (selected.length < 2) {
    fail(`${taskId}: could not derive at least two distinguishing requirements`);
  }
  return selected.map(({ value }) => value);
}

function classifyTrial(row, counts) {
  if (row.included_in_score === false || row.outcome === "excluded_error") {
    counts.excluded += 1;
  } else if (row.errored === true) {
    counts.errored += 1;
  } else if (row.passed === true || row.outcome === "pass") {
    counts.passed += 1;
  } else {
    counts.failed += 1;
  }
}

function buildPanels(trials) {
  const tasks = new Map();
  for (const row of trials) {
    if (!row.task_name || !row.config) fail("Trial is missing task_name or config");
    let configs = tasks.get(row.task_name);
    if (!configs) {
      configs = new Map();
      tasks.set(row.task_name, configs);
    }
    let outcome = configs.get(row.config);
    if (!outcome) {
      outcome = {
        provider: row.provider,
        model: row.model,
        harness: row.harness,
        configuration: row.config,
        effort: row.reasoning_effort || "default",
        attempts: 0,
        passed: 0,
        failed: 0,
        errored: 0,
        excluded: 0,
        disqualified: 0,
      };
      configs.set(row.config, outcome);
    }
    for (const field of ["provider", "model", "harness"]) {
      if (outcome[field] !== row[field]) {
        fail(`${row.task_name}/${row.config} has inconsistent ${field}`);
      }
    }
    const effort = row.reasoning_effort || "default";
    if (outcome.effort !== effort) {
      fail(`${row.task_name}/${row.config} has inconsistent reasoning effort`);
    }
    outcome.attempts += 1;
    classifyTrial(row, outcome);
  }

  return new Map(
    [...tasks].map(([task, configs]) => [
      task,
      [...configs.values()].sort((a, b) =>
        a.configuration.localeCompare(b.configuration),
      ),
    ]),
  );
}

function validate(records, taskIds) {
  if (records.length !== 113) fail(`Expected 113 records, found ${records.length}`);
  if (records.map((record) => record.identity.native_id).join("\n") !== taskIds.join("\n")) {
    fail("Records are not sorted by the pinned task directory IDs");
  }

  const identities = new Set();
  const configurations = new Set();
  const models = new Set();
  let attempts = 0;

  for (const record of records) {
    const id = record.identity.native_id;
    const identity = `${record.identity.benchmark}/${record.identity.release}/${id}`;
    if (identities.has(identity)) fail(`Duplicate identity ${identity}`);
    identities.add(identity);

    const expectedTree = execFileSync(
      "git",
      ["-C", repoDir, "rev-parse", `${SOURCE_REVISION}:tasks/${id}`],
      { encoding: "utf8" },
    ).trim();
    if (record.revision.case_tree !== expectedTree) fail(`${id} has the wrong case tree`);

    const { profile, outcomes } = record;
    for (const field of [
      "title",
      "summary",
      "interaction",
      "intents",
      "technologies",
      "languages",
      "work_surfaces",
      "expected_artifacts",
      "requirements",
    ]) {
      const value = profile[field];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        fail(`${id} has an empty profile.${field}`);
      }
    }

    if (outcomes.panel.length !== 41) {
      fail(`${id} has ${outcomes.panel.length} configurations instead of 41`);
    }
    const caseConfigs = new Set();
    let caseAttempts = 0;
    for (const outcome of outcomes.panel) {
      if (caseConfigs.has(outcome.configuration)) {
        fail(`${id} repeats configuration ${outcome.configuration}`);
      }
      caseConfigs.add(outcome.configuration);
      configurations.add(outcome.configuration);
      models.add(outcome.model);
      for (const field of [
        "attempts",
        "passed",
        "failed",
        "errored",
        "excluded",
        "disqualified",
      ]) {
        if (!Number.isInteger(outcome[field]) || outcome[field] < 0) {
          fail(`${id}/${outcome.configuration} has invalid ${field}`);
        }
      }
      if (
        outcome.attempts !==
        outcome.passed + outcome.failed + outcome.errored + outcome.excluded
      ) {
        fail(`${id}/${outcome.configuration} fails the count equation`);
      }
      caseAttempts += outcome.attempts;
    }
    if (outcomes.published_configurations !== 41) {
      fail(`${id} has the wrong published configuration count`);
    }
    if (outcomes.published_trials !== caseAttempts) {
      fail(`${id} has the wrong published trial count`);
    }
    attempts += caseAttempts;
  }

  if (attempts !== 18_522) fail(`Expected 18,522 attempts, found ${attempts}`);
  if (configurations.size !== 41) {
    fail(`Expected 41 unique configurations, found ${configurations.size}`);
  }
  if (models.size !== 13) fail(`Expected 13 unique models, found ${models.size}`);
  return { attempts, configurations: configurations.size, models: models.size };
}

const head = execFileSync("git", ["-C", repoDir, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
if (head !== SOURCE_REVISION) fail(`DeepSWE HEAD is ${head}, expected ${SOURCE_REVISION}`);

const taskArtifact = readJson(tasksPath);
const trialArtifact = readJson(trialsPath);
if (taskArtifact.n_tasks !== 113 || taskArtifact.rows.length !== 113) {
  fail("DeepSWE tasks artifact count drifted from 113");
}
if (trialArtifact.n_trials !== 18_522 || trialArtifact.rows.length !== 18_522) {
  fail("DeepSWE trials artifact count drifted from 18,522");
}

const tasksDir = path.join(repoDir, "tasks");
const taskIds = fs
  .readdirSync(tasksDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (taskIds.length !== 113) fail(`Pinned repository has ${taskIds.length} task directories`);

const taskRows = new Map(taskArtifact.rows.map((row) => [row.id, row]));
if ([...taskRows.keys()].sort().join("\n") !== taskIds.join("\n")) {
  fail("tasks.json IDs do not match the pinned repository task directories");
}

const panels = buildPanels(trialArtifact.rows);
const extractionDate = new Date().toISOString().slice(0, 10);
const records = taskIds.map((id) => {
  const taskRow = taskRows.get(id);
  const toml = fs.readFileSync(path.join(tasksDir, id, "task.toml"), "utf8");
  const metadata = tomlSection(toml, "metadata");
  const instruction = fs.readFileSync(path.join(tasksDir, id, "instruction.md"), "utf8");
  const displayTitle = parseTomlString(metadata, "display_title");
  const displayDescription = parseTomlString(metadata, "display_description");
  const category = parseTomlString(metadata, "category");
  const language = parseTomlString(metadata, "language");
  const repositoryUrl = parseTomlString(metadata, "repository_url");
  const baseCommit = parseTomlString(metadata, "base_commit_hash");

  if (displayTitle !== taskRow.problem_title) {
    fail(`${id} title differs between task.toml and tasks.json`);
  }
  if (displayDescription !== taskRow.display_description) {
    fail(`${id} description differs between task.toml and tasks.json`);
  }
  if (language !== taskRow.language) fail(`${id} language differs between sources`);
  if (repositoryUrl !== taskRow.repository_url) {
    fail(`${id} repository URL differs between sources`);
  }
  if (baseCommit !== taskRow.base_commit_hash) {
    fail(`${id} base commit differs between sources`);
  }

  const panel = panels.get(id);
  if (!panel) fail(`${id} has no trial outcomes`);
  const semanticText = `${displayTitle}\n${displayDescription}\n${instruction}`;
  const caseTree = execFileSync(
    "git",
    ["-C", repoDir, "rev-parse", `${SOURCE_REVISION}:tasks/${id}`],
    { encoding: "utf8" },
  ).trim();

  return {
    schema_version: "0.2",
    identity: {
      benchmark: "deepswe",
      release: "v1.1",
      native_id: id,
    },
    revision: {
      source_revision: SOURCE_REVISION,
      case_tree: caseTree,
      source_url: `${SOURCE_REPOSITORY}/blob/${SOURCE_REVISION}/tasks/${id}/task.toml`,
      task_page: `https://deepswe.datacurve.ai/data/v1.1/tasks/${id}`,
      repository: repositoryUrl,
      base_commit: baseCommit,
    },
    profile: {
      title: displayTitle,
      summary: displayDescription,
      interaction: "repository",
      intents: deriveIntents(semanticText, category),
      technologies: deriveTechnologies(taskRow.repository, semanticText),
      languages: [languageNames[language] ?? language],
      work_surfaces: deriveSurfaces(semanticText),
      expected_artifacts: ["repository patch"],
      requirements: deriveRequirements(instruction, id),
      observed_labels: {
        category,
        language,
      },
    },
    outcomes: {
      source_url: TRIALS_ARTIFACT_URL,
      published_configurations: 41,
      published_trials: panel.reduce((sum, outcome) => sum + outcome.attempts, 0),
      panel,
    },
    extraction: {
      method: "frontier LLM semantic extraction with pinned-source review",
      version: "full-1",
      date: extractionDate,
      observed_fields: [
        "identity",
        "revision.source_revision",
        "revision.case_tree",
        "revision.source_url",
        "revision.task_page",
        "revision.repository",
        "revision.base_commit",
        "profile.title",
        "profile.summary",
        "profile.languages",
        "profile.observed_labels",
        "outcomes",
      ],
      derived_fields: [
        "profile.interaction",
        "profile.intents",
        "profile.technologies",
        "profile.work_surfaces",
        "profile.expected_artifacts",
        "profile.requirements",
      ],
      omitted: [
        "instruction text",
        "environment implementation",
        "author contact",
        "solution",
        "verifier",
        "tests",
        "trajectories",
        "patches",
        "logs",
      ],
    },
  };
});

const result = validate(records, taskIds);
const jsonl = `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(jsonl)) {
  fail("Generated corpus contains an email address");
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, jsonl);
console.log(
  JSON.stringify({
    output: outputPath,
    records: records.length,
    configurations: result.configurations,
    models: result.models,
    trials: result.attempts,
  }),
);
