import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const deepSweFixture = new URL(
  "fixtures/normalization/deepswe-v1.1.jsonl",
  root,
);
const terminalBenchFixture = new URL(
  "fixtures/normalization/terminal-bench-2.1.jsonl",
  root,
);

const terminalBenchRepository = "harbor-framework/terminal-bench-2-1";
const terminalBenchRevision =
  "d49e28f1e4ddd13d289e85a5f312a66750951932";

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/json",
      "user-agent": "justenough-outcome-sync/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  return response.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

async function readJsonl(url) {
  return (await readFile(url, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(JSON.parse);
}

async function writeJsonl(url, records) {
  await writeFile(url, `${records.map(JSON.stringify).join("\n")}\n`);
}

function deepSweProvider(model) {
  if (model.startsWith("claude-")) return "anthropic";
  if (model.startsWith("gemini-")) return "google";
  if (model.startsWith("glm-")) return "zai";
  if (model.startsWith("gpt-")) return "openai";
  if (model.startsWith("kimi-")) return "moonshot";
  throw new Error(`Unknown DeepSWE model provider: ${model}`);
}

function deepSweConfiguration(model, effort) {
  const sourceModel =
    model === "gemini-3.1-pro" ? "gemini-3-1-pro-preview" : model;
  const slug = sourceModel.replaceAll(/[.-]/g, "_");
  return `mini_swe_agent_${slug}_${effort}`;
}

function parseDeepSweOutcomes(html, sourceUrl) {
  const rows = [
    ...html.matchAll(/<li class="py-2\.5 grid[\s\S]*?<\/li>/g),
  ].map((match) => match[0]);

  const outcomes = rows.map((row) => {
    const label = row.match(
      /<span class="text-sm font-medium truncate">([^<]+)<\/span>/,
    )?.[1];
    if (!label) throw new Error(`Missing model label on ${sourceUrl}`);

    const parsedLabel = label.match(/^(.*?) \[([^\]]+)]$/);
    const model = parsedLabel?.[1] ?? label;
    const effort = parsedLabel?.[2] ?? "default";
    const states = [...row.matchAll(/>(pass|fail|error|excluded|partial)<\/span>/g)].map(
      (match) => match[1],
    );

    if (states.length !== 4) {
      throw new Error(
        `Expected four DeepSWE trials for ${label}; found ${states.length} on ${sourceUrl}`,
      );
    }

    const passed = states.filter((state) => state === "pass").length;
    const errored = states.filter((state) => state === "error").length;
    const excluded = states.filter((state) => state === "excluded").length;
    const partial = states.filter((state) => state === "partial").length;

    return {
      provider: deepSweProvider(model),
      model,
      harness: "mini-swe-agent",
      configuration: deepSweConfiguration(model, effort),
      effort,
      attempts: states.length,
      passed,
      failed: states.length - passed - errored - excluded,
      errored,
      excluded,
      ...(partial > 0 ? { partial } : {}),
    };
  });

  if (outcomes.length !== 41) {
    throw new Error(
      `Expected 41 DeepSWE configurations; found ${outcomes.length} on ${sourceUrl}`,
    );
  }

  return outcomes;
}

function decodeNextFlight(html) {
  const chunks = [
    ...html.matchAll(
      /<script>self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)<\/script>/g,
    ),
  ].map((match) => JSON.parse(match[1]));
  return chunks.join("");
}

function extractJsonObject(text, marker) {
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Missing ${marker}`);

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

  throw new Error(`Unterminated JSON object after ${marker}`);
}

function parseHarborTrials(html) {
  const flight = decodeNextFlight(html);
  return extractJsonObject(flight, '"initialTrials":');
}

async function mapLimit(values, limit, callback) {
  const output = new Array(values.length);
  let cursor = 0;

  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await callback(values[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return output;
}

async function loadHarborJob(jobId) {
  const jobUrl = `https://hub.harborframework.com/jobs/${jobId}`;
  const firstPage = parseHarborTrials(await fetchText(jobUrl));
  const remainingPages = Array.from(
    { length: firstPage.total_pages - 1 },
    (_, index) => index + 2,
  );
  const pages = await mapLimit(remainingPages, 4, async (page) =>
    parseHarborTrials(await fetchText(`${jobUrl}?page=${page}`)),
  );
  const items = [firstPage, ...pages].flatMap((page) => page.items);

  if (items.length !== firstPage.total) {
    throw new Error(
      `Expected ${firstPage.total} Harbor trials for ${jobId}; found ${items.length}`,
    );
  }

  return items;
}

function classifyTerminalTrial(trial, disqualified) {
  if (disqualified.has(trial.id)) return "disqualified";
  if (trial.error_type || trial.hosted_error || trial.status !== "completed") {
    return "errored";
  }
  return Number(trial.reward) > 0 ? "passed" : "failed";
}

function inferredTerminalProvider(model) {
  if (model.startsWith("gpt-")) return "openai";
  if (model.startsWith("glm-")) return "zai";
  return "unknown";
}

function terminalOutcome(submission, submissionPath, trials, nativeId) {
  const selected = trials.filter(
    (trial) => trial.task_name?.split("/").at(-1) === nativeId,
  );
  const disqualified = new Set(
    submission.disqualified_trials?.map((trial) => trial.trial_id) ?? [],
  );
  const counts = {
    passed: 0,
    failed: 0,
    errored: 0,
    excluded: 0,
    disqualified: 0,
  };

  for (const trial of selected) {
    const state = classifyTerminalTrial(trial, disqualified);
    if (state === "disqualified") {
      counts.disqualified += 1;
      counts.failed += 1;
    } else {
      counts[state] += 1;
    }
  }

  const firstTrial = selected[0];
  const sourceModelParts = submission.source_filter.model_name.split("/");
  const sourceProvider =
    sourceModelParts.length > 1 ? sourceModelParts[0] : undefined;
  const sourceModel =
    sourceModelParts.length > 1
      ? sourceModelParts.slice(1).join("/")
      : sourceModelParts[0];
  const observedProvider = firstTrial?.model_provider;
  const configuration = submissionPath.split("/").at(-1).replace(/\.json$/, "");
  const sourceJob = submission.source_jobs.find((jobId) =>
    selected.some((trial) => trial.__jobId === jobId),
  );

  return {
    provider:
      observedProvider && observedProvider !== "unknown"
        ? observedProvider
        : (sourceProvider ??
          inferredTerminalProvider(firstTrial?.model_name ?? sourceModel)),
    model: firstTrial?.model_name ?? sourceModel,
    harness: submission.source_filter.agent,
    harness_version: submission.source_filter.agent_version,
    configuration,
    submission_date: submission.metadata.date,
    effort:
      submission.source_filter.reasoning_effort ??
      submission.metadata.reasoning_effort ??
      "default",
    source_job_url: `https://hub.harborframework.com/jobs/${sourceJob ?? submission.source_jobs[0]}`,
    source_submission_url: `https://github.com/${terminalBenchRepository}/blob/${terminalBenchRevision}/${submissionPath}`,
    attempts: selected.length,
    ...counts,
  };
}

async function syncDeepSwe(records) {
  return mapLimit(records, 3, async (record) => {
    const sourceUrl = record.revision.task_page ?? record.outcomes.source_url;
    if (!sourceUrl) throw new Error("DeepSWE record is missing a task page");
    const panel = parseDeepSweOutcomes(await fetchText(sourceUrl), sourceUrl);
    return {
      ...record,
      outcomes: {
        ...record.outcomes,
        source_url: sourceUrl,
        published_configurations: panel.length,
        published_trials: panel.reduce(
          (total, outcome) => total + outcome.attempts,
          0,
        ),
        panel,
      },
    };
  });
}

async function terminalSubmissions() {
  const tree = await fetchJson(
    `https://api.github.com/repos/${terminalBenchRepository}/git/trees/${terminalBenchRevision}?recursive=1`,
  );
  const paths = tree.tree
    .map((entry) => entry.path)
    .filter((path) => /^leaderboard\/submissions\/[^/]+\.json$/.test(path))
    .sort();

  if (paths.length !== 20) {
    throw new Error(`Expected 20 Terminal-Bench submissions; found ${paths.length}`);
  }

  return mapLimit(paths, 4, async (path) => ({
    path,
    value: await fetchJson(
      `https://raw.githubusercontent.com/${terminalBenchRepository}/${terminalBenchRevision}/${path}`,
    ),
  }));
}

async function syncTerminalBench(records) {
  const submissions = await terminalSubmissions();
  const jobIds = [
    ...new Set(submissions.flatMap(({ value }) => value.source_jobs)),
  ];
  const jobTrials = new Map();

  await mapLimit(jobIds, 2, async (jobId) => {
    const trials = await loadHarborJob(jobId);
    jobTrials.set(
      jobId,
      trials.map((trial) => ({ ...trial, __jobId: jobId })),
    );
  });

  const expanded = submissions.map(({ path, value }) => {
    const wanted = new Set(value.trials);
    const trials = value.source_jobs
      .flatMap((jobId) => jobTrials.get(jobId) ?? [])
      .filter((trial) => wanted.has(trial.id));
    const found = new Set(trials.map((trial) => trial.id));
    const missing = value.trials.filter((trialId) => !found.has(trialId));

    if (missing.length > 0) {
      throw new Error(
        `${path} references ${missing.length} trials absent from its Harbor jobs`,
      );
    }
    return { path, value, trials };
  });

  return records.map((record) => {
    const panel = expanded.map(({ path, value, trials }) =>
      terminalOutcome(value, path, trials, record.identity.native_id),
    );
    if (panel.some((outcome) => outcome.attempts === 0)) {
      throw new Error(
        `A Terminal-Bench submission has no trials for ${record.identity.native_id}`,
      );
    }

    return {
      ...record,
      outcomes: {
        ...record.outcomes,
        source_url: `https://github.com/${terminalBenchRepository}/tree/${terminalBenchRevision}/leaderboard/submissions`,
        published_configurations: panel.length,
        published_trials: panel.reduce(
          (total, outcome) => total + outcome.attempts,
          0,
        ),
        panel,
      },
    };
  });
}

const [deepSweRecords, terminalBenchRecords] = await Promise.all([
  readJsonl(deepSweFixture),
  readJsonl(terminalBenchFixture),
]);
const [syncedDeepSwe, syncedTerminalBench] = await Promise.all([
  syncDeepSwe(deepSweRecords),
  syncTerminalBench(terminalBenchRecords),
]);

await Promise.all([
  writeJsonl(deepSweFixture, syncedDeepSwe),
  writeJsonl(terminalBenchFixture, syncedTerminalBench),
]);

const summary = {
  deepSwe: {
    cases: syncedDeepSwe.length,
    configurations: syncedDeepSwe[0].outcomes.panel.length,
    models: new Set(
      syncedDeepSwe[0].outcomes.panel.map((outcome) => outcome.model),
    ).size,
  },
  terminalBench: {
    cases: syncedTerminalBench.length,
    configurations: syncedTerminalBench[0].outcomes.panel.length,
    models: new Set(
      syncedTerminalBench[0].outcomes.panel.map((outcome) => outcome.model),
    ).size,
  },
};

console.log(JSON.stringify(summary, null, 2));
