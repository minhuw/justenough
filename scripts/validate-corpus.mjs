import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const sourceRoot =
  process.env.JUSTENOUGH_SOURCE_ROOT ??
  "/private/tmp/justenough-extraction-20260713";

const releases = [
  {
    key: "deepswe-v1.1",
    benchmark: "deepswe",
    release: "v1.1",
    file: new URL("corpus/deepswe-v1.1.jsonl", root),
    repository: "https://github.com/datacurve-ai/deep-swe",
    revision: "6db64a40f3318d8659238ff34a8cc4b491c49205",
    checkout: `${sourceRoot}/deep-swe`,
    records: 113,
    configurations: 41,
    models: 13,
    trials: 18_522,
  },
  {
    key: "terminal-bench-2.1",
    benchmark: "terminal-bench",
    release: "2.1",
    file: new URL("corpus/terminal-bench-2.1.jsonl", root),
    repository: "https://github.com/harbor-framework/terminal-bench-2-1",
    revision: "d49e28f1e4ddd13d289e85a5f312a66750951932",
    checkout: `${sourceRoot}/terminal-bench-2-1`,
    records: 89,
    configurations: 20,
    models: 13,
    trials: 8_902,
  },
];

const topLevelKeys = [
  "schema_version",
  "identity",
  "revision",
  "profile",
  "outcomes",
  "extraction",
];
const identityKeys = ["benchmark", "release", "native_id"];
const revisionKeys = [
  "source_revision",
  "case_tree",
  "source_url",
  "task_page",
  "repository",
  "base_commit",
  "dataset_ref",
];
const profileKeys = [
  "title",
  "summary",
  "interaction",
  "intents",
  "technologies",
  "languages",
  "work_surfaces",
  "expected_artifacts",
  "requirements",
  "observed_labels",
];
const outcomesKeys = [
  "source_url",
  "published_configurations",
  "published_trials",
  "panel",
];
const outcomeKeys = [
  "provider",
  "model",
  "harness",
  "harness_version",
  "configuration",
  "submission_date",
  "effort",
  "attempts",
  "passed",
  "failed",
  "errored",
  "excluded",
  "disqualified",
  "source_job_url",
  "source_submission_url",
];
const extractionKeys = [
  "method",
  "version",
  "date",
  "observed_fields",
  "derived_fields",
  "omitted",
];
const countKeys = [
  "attempts",
  "passed",
  "failed",
  "errored",
  "excluded",
  "disqualified",
];

function git(checkout, args) {
  return execFileSync("git", args, {
    cwd: checkout,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function expectedTaskTrees(spec) {
  const head = git(spec.checkout, ["rev-parse", "HEAD"]);
  if (head !== spec.revision) {
    throw new Error(
      `${spec.checkout} is at ${head}; expected ${spec.revision}`,
    );
  }

  const entries = git(spec.checkout, [
    "ls-tree",
    `${spec.revision}:tasks`,
  ]).split("\n");
  const trees = new Map();
  for (const entry of entries) {
    const match = entry.match(/^040000 tree ([0-9a-f]{40})\t(.+)$/);
    if (match) trees.set(match[2], match[1]);
  }
  return trees;
}

async function readJsonl(file) {
  const text = await readFile(file, "utf8");
  if (!text.endsWith("\n")) {
    throw new Error(`${fileURLToPath(file)} must end with a newline`);
  }

  const records = [];
  for (const [index, line] of text.split("\n").entries()) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch (error) {
      throw new Error(
        `${fileURLToPath(file)}:${index + 1}: ${error.message}`,
      );
    }
  }
  return records;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function compareText(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function checkKeys(value, allowed, path, errors) {
  if (!isObject(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length) errors.push(`${path} has unknown keys: ${unknown.join(", ")}`);
  return true;
}

function checkString(value, path, errors) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${path} must be a non-empty string`);
    return false;
  }
  return true;
}

function checkStringArray(value, path, errors, { min = 0, max } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return false;
  }
  if (value.length < min || (max !== undefined && value.length > max)) {
    errors.push(
      `${path} must contain ${min}${max === undefined ? "+" : `-${max}`} items`,
    );
  }
  value.forEach((item, index) => checkString(item, `${path}[${index}]`, errors));
  const normalized = value.map((item) =>
    typeof item === "string" ? item.trim().toLocaleLowerCase("en-US") : item,
  );
  if (new Set(normalized).size !== normalized.length) {
    errors.push(`${path} contains duplicate values`);
  }
  return true;
}

function checkProfile(profile, spec, path, errors) {
  if (!checkKeys(profile, profileKeys, path, errors)) return;
  checkString(profile.title, `${path}.title`, errors);
  checkString(profile.summary, `${path}.summary`, errors);
  if (!['repository', 'terminal'].includes(profile.interaction)) {
    errors.push(`${path}.interaction must be repository or terminal`);
  } else if (
    (spec.benchmark === "deepswe" && profile.interaction !== "repository") ||
    (spec.benchmark === "terminal-bench" && profile.interaction !== "terminal")
  ) {
    errors.push(`${path}.interaction does not match ${spec.benchmark}`);
  }
  checkStringArray(profile.intents, `${path}.intents`, errors, { min: 1, max: 4 });
  checkStringArray(profile.technologies, `${path}.technologies`, errors, { min: 1 });
  checkStringArray(profile.languages, `${path}.languages`, errors, { min: 1 });
  checkStringArray(profile.work_surfaces, `${path}.work_surfaces`, errors, {
    min: 1,
    max: 5,
  });
  checkStringArray(
    profile.expected_artifacts,
    `${path}.expected_artifacts`,
    errors,
    { min: 1 },
  );
  checkStringArray(profile.requirements, `${path}.requirements`, errors, {
    min: 2,
    max: 6,
  });

  if (!isObject(profile.observed_labels)) {
    errors.push(`${path}.observed_labels must be an object`);
  } else {
    const allowed =
      spec.benchmark === "deepswe"
        ? ["category", "language"]
        : ["category", "difficulty", "tags"];
    checkKeys(profile.observed_labels, allowed, `${path}.observed_labels`, errors);
    for (const [key, value] of Object.entries(profile.observed_labels)) {
      checkString(value, `${path}.observed_labels.${key}`, errors);
    }
  }
}

function checkExtraction(extraction, path, errors) {
  if (!checkKeys(extraction, extractionKeys, path, errors)) return;
  if (
    extraction.method !==
    "frontier LLM semantic extraction with pinned-source review"
  ) {
    errors.push(`${path}.method does not match the extraction contract`);
  }
  if (extraction.version !== "full-1") {
    errors.push(`${path}.version must be full-1`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(extraction.date ?? "")) {
    errors.push(`${path}.date must be YYYY-MM-DD`);
  } else if (extraction.date > new Date().toISOString().slice(0, 10)) {
    errors.push(`${path}.date cannot be in the future`);
  }
  checkStringArray(
    extraction.observed_fields,
    `${path}.observed_fields`,
    errors,
    { min: 1 },
  );
  checkStringArray(
    extraction.derived_fields,
    `${path}.derived_fields`,
    errors,
    { min: 1 },
  );
  if (
    checkStringArray(extraction.omitted, `${path}.omitted`, errors, { min: 8 })
  ) {
    const omissions = extraction.omitted.join(" ").toLocaleLowerCase("en-US");
    for (const term of [
      "instruction",
      "environment",
      "author",
      "solution",
      "verifier",
      "test",
      "trajector",
      "patch",
      "log",
    ]) {
      if (!omissions.includes(term)) {
        errors.push(`${path}.omitted must declare omission of ${term} content`);
      }
    }
  }
}

function checkOutcome(outcome, spec, path, errors) {
  if (!checkKeys(outcome, outcomeKeys, path, errors)) return;
  for (const key of [
    "provider",
    "model",
    "harness",
    "configuration",
    "effort",
  ]) {
    checkString(outcome[key], `${path}.${key}`, errors);
  }
  for (const key of countKeys) {
    if (!Number.isInteger(outcome[key]) || outcome[key] < 0) {
      errors.push(`${path}.${key} must be a non-negative integer`);
    }
  }
  if (
    countKeys.every((key) => Number.isInteger(outcome[key])) &&
    outcome.attempts !==
      outcome.passed + outcome.failed + outcome.errored + outcome.excluded
  ) {
    errors.push(`${path} violates the attempt count equation`);
  }

  if (spec.benchmark === "terminal-bench") {
    checkString(outcome.harness_version, `${path}.harness_version`, errors);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(outcome.submission_date ?? "")) {
      errors.push(`${path}.submission_date must be YYYY-MM-DD`);
    }
    checkString(outcome.source_job_url, `${path}.source_job_url`, errors);
    checkString(
      outcome.source_submission_url,
      `${path}.source_submission_url`,
      errors,
    );
  }
}

function checkRecord(record, spec, trees, index, errors) {
  const prefix = `${spec.key}[${index}]`;
  if (!checkKeys(record, topLevelKeys, prefix, errors)) return;
  if (record.schema_version !== "0.2") {
    errors.push(`${prefix}.schema_version must be 0.2`);
  }

  if (checkKeys(record.identity, identityKeys, `${prefix}.identity`, errors)) {
    if (record.identity.benchmark !== spec.benchmark) {
      errors.push(`${prefix}.identity.benchmark must be ${spec.benchmark}`);
    }
    if (record.identity.release !== spec.release) {
      errors.push(`${prefix}.identity.release must be ${spec.release}`);
    }
    checkString(record.identity.native_id, `${prefix}.identity.native_id`, errors);
  }

  if (checkKeys(record.revision, revisionKeys, `${prefix}.revision`, errors)) {
    if (record.revision.source_revision !== spec.revision) {
      errors.push(`${prefix}.revision.source_revision does not match the pin`);
    }
    const expectedTree = trees.get(record.identity?.native_id);
    if (record.revision.case_tree !== expectedTree) {
      errors.push(
        `${prefix}.revision.case_tree is ${record.revision.case_tree}; expected ${expectedTree ?? "no matching task"}`,
      );
    }
    checkString(record.revision.source_url, `${prefix}.revision.source_url`, errors);
    const expectedSourceUrl = `${spec.repository}/blob/${spec.revision}/tasks/${record.identity?.native_id}/task.toml`;
    if (record.revision.source_url !== expectedSourceUrl) {
      errors.push(`${prefix}.revision.source_url must be the pinned task.toml URL`);
    }
    if (
      spec.benchmark === "deepswe" &&
      record.revision.task_page !==
        `https://deepswe.datacurve.ai/data/v1.1/tasks/${record.identity?.native_id}`
    ) {
      errors.push(`${prefix}.revision.task_page must be the official v1.1 task page`);
    }
  }

  checkProfile(record.profile, spec, `${prefix}.profile`, errors);
  checkExtraction(record.extraction, `${prefix}.extraction`, errors);

  if (checkKeys(record.outcomes, outcomesKeys, `${prefix}.outcomes`, errors)) {
    checkString(record.outcomes.source_url, `${prefix}.outcomes.source_url`, errors);
    if (!Array.isArray(record.outcomes.panel)) {
      errors.push(`${prefix}.outcomes.panel must be an array`);
      return;
    }
    if (record.outcomes.panel.length !== spec.configurations) {
      errors.push(
        `${prefix}.outcomes.panel has ${record.outcomes.panel.length} rows; expected ${spec.configurations}`,
      );
    }
    record.outcomes.panel.forEach((outcome, outcomeIndex) =>
      checkOutcome(
        outcome,
        spec,
        `${prefix}.outcomes.panel[${outcomeIndex}]`,
        errors,
      ),
    );
    const configurations = record.outcomes.panel.map(
      (outcome) => outcome?.configuration,
    );
    if (new Set(configurations).size !== configurations.length) {
      errors.push(`${prefix}.outcomes.panel has duplicate configurations`);
    }
    if (
      configurations.some(
        (configuration, configurationIndex) =>
          configurationIndex > 0 &&
          compareText(configurations[configurationIndex - 1], configuration) > 0,
      )
    ) {
      errors.push(`${prefix}.outcomes.panel must be sorted by configuration`);
    }
    const attempts = record.outcomes.panel.reduce(
      (total, outcome) =>
        total + (Number.isInteger(outcome?.attempts) ? outcome.attempts : 0),
      0,
    );
    if (record.outcomes.published_configurations !== spec.configurations) {
      errors.push(
        `${prefix}.outcomes.published_configurations must be ${spec.configurations}`,
      );
    }
    if (record.outcomes.published_trials !== attempts) {
      errors.push(
        `${prefix}.outcomes.published_trials does not equal its panel attempt sum`,
      );
    }
  }
}

async function loadTerminalSubmissions(spec, errors) {
  const directory = `${spec.checkout}/leaderboard/submissions`;
  const names = (await readdir(directory))
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));
  if (names.length !== spec.configurations) {
    errors.push(
      `terminal-bench source has ${names.length} submissions; expected ${spec.configurations}`,
    );
  }

  return Promise.all(
    names.map(async (name) => ({
      configuration: name.slice(0, -5),
      name,
      value: JSON.parse(await readFile(`${directory}/${name}`, "utf8")),
    })),
  );
}

function decodeNextFlight(html) {
  return [
    ...html.matchAll(
      /<script>self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)<\/script>/g,
    ),
  ]
    .map((match) => JSON.parse(match[1]))
    .join("");
}

function extractJsonObject(text, marker) {
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) throw new Error(`missing ${marker}`);
  const start = text.indexOf("{", markerIndex + marker.length);
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      return JSON.parse(text.slice(start, index + 1));
    }
  }
  throw new Error(`unterminated ${marker} payload`);
}

function parseHarborPage(html) {
  const flight = decodeNextFlight(html);
  return extractJsonObject(flight, '"initialTrials":');
}

async function loadHarborPage(jobId, page) {
  const cacheFile = `${sourceRoot}/harbor-cache/${jobId}-${page}.html`;
  try {
    return parseHarborPage(await readFile(cacheFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const baseUrl = `https://hub.harborframework.com/jobs/${jobId}`;
  const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
  const response = await fetch(url, {
    headers: {
      accept: "text/html",
      "user-agent": "justenough-corpus-validator/1",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return parseHarborPage(await response.text());
}

async function mapLimit(values, limit, callback) {
  const result = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      result[index] = await callback(values[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return result;
}

async function loadHarborTrialIds(jobId) {
  const first = await loadHarborPage(jobId, 1);
  const remaining = await mapLimit(
    Array.from({ length: first.total_pages - 1 }, (_, index) => index + 2),
    4,
    (page) => loadHarborPage(jobId, page),
  );
  const items = [first, ...remaining].flatMap((page) => page.items);
  if (items.length !== first.total) {
    throw new Error(`found ${items.length} of ${first.total} trials`);
  }
  return new Set(items.map((trial) => trial.id));
}

async function checkTerminalEvidence(submissions, errors) {
  const jobs = [
    ...new Set(
      submissions.flatMap(({ value }) =>
        Array.isArray(value.source_jobs) ? value.source_jobs : [],
      ),
    ),
  ];
  const jobResults = await mapLimit(jobs, 4, async (jobId) => {
    try {
      return [jobId, await loadHarborTrialIds(jobId)];
    } catch (error) {
      errors.push(`Harbor job ${jobId} could not be validated: ${error.message}`);
      return [jobId, new Set()];
    }
  });
  const trialsByJob = new Map(jobResults);
  let resolved = 0;

  for (const { configuration, value } of submissions) {
    if (!Array.isArray(value.trials) || !Array.isArray(value.source_jobs)) {
      errors.push(`${configuration} has invalid trials or source_jobs`);
      continue;
    }
    const available = new Set(
      value.source_jobs.flatMap((jobId) => [...(trialsByJob.get(jobId) ?? [])]),
    );
    const unresolved = value.trials.filter((trialId) => !available.has(trialId));
    resolved += value.trials.length - unresolved.length;
    if (unresolved.length) {
      errors.push(
        `${configuration} has ${unresolved.length} trial IDs unresolved by its Harbor jobs`,
      );
    }
  }
  return { jobs: jobs.length, resolved_trial_references: resolved };
}

function summarizeRelease(records) {
  const panel = records.flatMap((record) => record.outcomes?.panel ?? []);
  return {
    records: records.length,
    configurations: new Set(panel.map((outcome) => outcome?.configuration)).size,
    models: new Set(panel.map((outcome) => outcome?.model)).size,
    trials: panel.reduce(
      (total, outcome) =>
        total + (Number.isInteger(outcome?.attempts) ? outcome.attempts : 0),
      0,
    ),
  };
}

export async function validateCorpus() {
  const errors = [];
  const recordsByRelease = new Map();
  const treesByRelease = new Map();
  let terminalSubmissions = [];

  for (const spec of releases) {
    try {
      const trees = expectedTaskTrees(spec);
      treesByRelease.set(spec.key, trees);
      if (trees.size !== spec.records) {
        errors.push(
          `${spec.key} pinned repository has ${trees.size} task trees; expected ${spec.records}`,
        );
      }
    } catch (error) {
      errors.push(`${spec.key} source checkout: ${error.message}`);
    }

    try {
      recordsByRelease.set(spec.key, await readJsonl(spec.file));
    } catch (error) {
      errors.push(error.message);
      recordsByRelease.set(spec.key, []);
    }
  }

  try {
    terminalSubmissions = await loadTerminalSubmissions(releases[1], errors);
  } catch (error) {
    errors.push(`terminal-bench submissions: ${error.message}`);
  }

  const allIdentities = new Set();
  const summaries = {};
  for (const spec of releases) {
    const records = recordsByRelease.get(spec.key) ?? [];
    const trees = treesByRelease.get(spec.key) ?? new Map();
    if (records.length !== spec.records) {
      errors.push(`${spec.key} has ${records.length} records; expected ${spec.records}`);
    }

    const nativeIds = records.map((record) => record.identity?.native_id);
    if (
      nativeIds.some(
        (nativeId, index) =>
          index > 0 && compareText(nativeIds[index - 1], nativeId) > 0,
      )
    ) {
      errors.push(`${spec.key} records must be sorted by native ID`);
    }
    const actualIds = new Set(nativeIds);
    const missing = [...trees.keys()].filter((nativeId) => !actualIds.has(nativeId));
    const extra = [...actualIds].filter((nativeId) => !trees.has(nativeId));
    if (missing.length || extra.length) {
      errors.push(
        `${spec.key} identity set differs from the pinned repository (missing ${missing.length}, extra ${extra.length})`,
      );
    }

    records.forEach((record, index) => {
      const identity = `${record.identity?.benchmark}/${record.identity?.release}/${record.identity?.native_id}`;
      if (allIdentities.has(identity)) errors.push(`duplicate identity ${identity}`);
      allIdentities.add(identity);
      checkRecord(record, spec, trees, index, errors);
    });

    const summary = summarizeRelease(records);
    summaries[spec.key] = summary;
    for (const key of ["records", "configurations", "models", "trials"]) {
      if (summary[key] !== spec[key]) {
        errors.push(
          `${spec.key} has ${summary[key]} ${key}; expected ${spec[key]}`,
        );
      }
    }
  }

  const terminalRecords = recordsByRelease.get("terminal-bench-2.1") ?? [];
  if (terminalSubmissions.length) {
    const expectedConfigurations = terminalSubmissions.map(
      ({ configuration }) => configuration,
    );
    const expectedSet = new Set(expectedConfigurations);
    const totals = new Map(expectedConfigurations.map((value) => [value, 0]));
    for (const [recordIndex, record] of terminalRecords.entries()) {
      const panel = record.outcomes?.panel ?? [];
      const actualSet = new Set(panel.map((outcome) => outcome?.configuration));
      const missing = expectedConfigurations.filter((value) => !actualSet.has(value));
      const extra = [...actualSet].filter((value) => !expectedSet.has(value));
      if (missing.length || extra.length) {
        errors.push(
          `terminal-bench-2.1[${recordIndex}] configurations differ from pinned submissions (missing ${missing.length}, extra ${extra.length})`,
        );
      }
      for (const outcome of panel) {
        if (!isObject(outcome)) continue;
        if (totals.has(outcome.configuration) && Number.isInteger(outcome.attempts)) {
          totals.set(
            outcome.configuration,
            totals.get(outcome.configuration) + outcome.attempts,
          );
        }
        const submission = terminalSubmissions.find(
          ({ configuration }) => configuration === outcome.configuration,
        );
        if (!submission) continue;
        const expectedSubmissionUrl = `${releases[1].repository}/blob/${releases[1].revision}/leaderboard/submissions/${submission.name}`;
        if (outcome.source_submission_url !== expectedSubmissionUrl) {
          errors.push(
            `terminal-bench-2.1[${recordIndex}] ${outcome.configuration} has an unpinned submission URL`,
          );
        }
        const validJobUrls = (submission.value.source_jobs ?? []).map(
          (jobId) => `https://hub.harborframework.com/jobs/${jobId}`,
        );
        if (!validJobUrls.includes(outcome.source_job_url)) {
          errors.push(
            `terminal-bench-2.1[${recordIndex}] ${outcome.configuration} has an unknown source job URL`,
          );
        }
      }
    }
    for (const { configuration, value } of terminalSubmissions) {
      if (totals.get(configuration) !== value.trials?.length) {
        errors.push(
          `${configuration} aggregates ${totals.get(configuration)} attempts; source submission has ${value.trials?.length} trial references`,
        );
      }
    }
  }

  let terminalEvidence = { jobs: 0, resolved_trial_references: 0 };
  if (
    terminalSubmissions.length === releases[1].configurations &&
    terminalRecords.length === releases[1].records &&
    errors.length === 0
  ) {
    terminalEvidence = await checkTerminalEvidence(terminalSubmissions, errors);
  }

  return {
    ok: errors.length === 0,
    validation_version: "1",
    checked_at: new Date().toISOString(),
    sources: Object.fromEntries(
      releases.map((spec) => [
        spec.key,
        {
          repository: spec.repository,
          revision: spec.revision,
          task_trees: treesByRelease.get(spec.key)?.size ?? 0,
        },
      ]),
    ),
    corpora: summaries,
    terminal_evidence: terminalEvidence,
    errors,
  };
}

async function main() {
  const report = await validateCorpus();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    process.stdout.write(
      `${JSON.stringify({ ok: false, errors: [error.message] }, null, 2)}\n`,
    );
    process.exitCode = 1;
  });
}

export { releases };
