import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function fetchWorker(pathname = "/", init = {}, bindings = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      ...init,
      headers: { accept: "text/html", ...init.headers },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      ...bindings,
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function render(pathname = "/", bindings = {}) {
  return fetchWorker(pathname, {}, bindings);
}

test("server-renders the task router", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>JustEnough — evidence-backed model routing<\/title>/i);
  assert.match(html, /No smarter than necessary/);
  assert.match(html, /What should the agent accomplish/);
  assert.match(html, /Reliability target/);
  assert.match(html, /Find just enough/);
});

test("server-renders the full evidence explorer", async () => {
  const response = await render("/evidence");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Cases, minus the archaeology/);
  assert.match(html, /id="case-results">933<!-- --> <!-- -->cases/);
  assert.match(html, /Add bail-on-test-failure handling to Testem/);
  assert.match(html, /Boot Alpine in QEMU with SSH access/);
  assert.match(html, /TypeError combining VarsWithSources and dict in combinevars/);
  assert.match(html, /Published trials/);
  assert.match(html, /33566/);
  assert.match(html, /Any benchmark/);
  assert.match(html, /SWE-Bench Pro/);
  assert.doesNotMatch(html, /aria-pressed/);
  assert.doesNotMatch(
    html,
    /Rates summarize every published configuration|10-case normalization sample|sample v2026\.07/,
  );
  assert.doesNotMatch(html, /illustrative data|Candidate frontier|react-loading-skeleton/i);
});

test("server-renders the methodology and worked example", async () => {
  const response = await render("/how-it-works");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>How JustEnough works — JustEnough<\/title>/i);
  assert.match(html, /From a task description to an evidence-backed route/);
  assert.match(html, /One task in\. One honest decision out/);
  assert.match(html, /Understand the task/);
  assert.match(html, /Find analogues/);
  assert.match(html, /Read outcomes/);
  assert.match(html, /Apply the gate/);
  assert.match(html, /90% Wilson lower bound/);
  assert.match(html, /Recommend/);
  assert.match(html, /Abstain/);
  assert.match(html, /29 \/ 32/);
  assert.match(html, /Rewrite trials or vote for itself/);
  assert.match(
    html,
    /<a(?=[^>]*href="\/how-it-works")(?=[^>]*aria-current="page")[^>]*>/,
  );
});

test("retrieves specific evidence and abstains when transfer coverage is sparse", async () => {
  const response = await fetchWorker("/api/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      task: "In a terminal environment, fix CRLF injection in Bottle HTTP response headers and validate the security behavior.",
      reliabilityTarget: 0.7,
    }),
  });

  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.profile.interaction, "terminal");
  assert.equal(result.reliabilityTarget, 0.7);
  assert.equal(result.objective, "reasoning_effort_proxy");
  assert.deepEqual(result.analysis.retrieval, ["lexical", "facets"]);
  assert.ok(result.matches.length >= 3);
  assert.ok(
    result.matches.some(
      (match) => match.identity.native_id === "fix-code-vulnerability",
    ),
  );
  assert.ok(result.matches.every((match) => match.href.startsWith("/evidence/")));
  assert.equal(result.status, "abstained");
  assert.ok(result.abstentionReasons.some((reason) => reason.includes("task similarity")));
  assert.ok(result.warnings.some((warning) => warning.includes("LLM profiling is disabled")));
});

test("recommends an exact configuration only when the evidence gate clears", async () => {
  const response = await fetchWorker("/api/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      task: "In a repository, add stepped slice parsing, slicing, and assignment for arrays and strings with rune-correct indexing. Support forward and reverse steps, preserve exact error behavior, and reject zero steps.",
      reliabilityTarget: 0.7,
    }),
  });

  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.profile.interaction, "repository");
  assert.equal(result.status, "recommended");
  assert.ok(result.recommendation.lowerBound >= result.reliabilityTarget);
  assert.ok(result.recommendation.supportingCases >= 3);
  assert.ok(result.matches.filter((match) => match.score >= 0.25).length >= 3);
});

test("rejects malformed routing requests", async () => {
  const response = await fetchWorker("/api/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ task: "too short", reliabilityTarget: 0.8 }),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /between 12 and 5,000/);
});

test("server-renders a shareable evidence case with outcomes and provenance", async () => {
  const response = await render(
    "/evidence/terminal-bench/2.1/fix-code-vulnerability",
  );
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Fix CRLF injection in Bottle headers/);
  assert.match(html, /Reject carriage-return and line-feed input/);
  assert.match(html, /gpt-5\.6-luna/);
  assert.match(html, /grok-4\.5/);
  assert.match(html, /Configurations[\s\S]*?20/);
  assert.match(html, /2<!-- -->\/<!-- -->5/);
  assert.match(html, /3 disqualified/);
  assert.doesNotMatch(
    html,
    /Extraction|Derived metadata|frontier LLM|spike-1|Deliberately omitted|full instruction|trajectory/,
  );
  assert.doesNotMatch(html, /Original prompt/);
});

test("server-renders the full DeepSWE model set", async () => {
  const response = await render(
    "/evidence/deepswe/v1.1/testem-bail-on-test-failure",
  );
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Configurations[\s\S]*?41/);
  assert.match(html, /claude-fable-5/);
  assert.match(html, /gemini-3-5-flash/);
  assert.match(html, /glm-5-2/);
  assert.match(html, /kimi-k2-7-code/);
});

test("server-renders disclosed SWE-Bench Pro outcomes", async () => {
  const response = await render(
    "/evidence/swe-bench-pro/public-2026-02-23/instance_ansible__ansible-0ea40e09d1b35bcb69ff4d9cecf3d0defa4b36e8-v30a923fb5c164d6cd18280c02422f75e611e8fb2",
  );
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /TypeError combining VarsWithSources and dict in combinevars/);
  assert.match(html, /SWE-Bench Pro<!-- --> <!-- -->public-2026-02-23/);
  assert.match(html, /gpt-5-2025-08-07/);
  assert.match(html, /claude-opus-4-1/);
  assert.match(html, /SWE-Agent/);
});

test("bundles a compact index and configures the R2 corpus binding", async () => {
  const [
    packageJson,
    dataModule,
    caseDataModule,
    browser,
    outcomeBrowser,
    detailPage,
    worker,
    hostingConfig,
    wranglerConfig,
  ] =
    await Promise.all([
      readFile(new URL("package.json", projectRoot), "utf8"),
      readFile(new URL("app/evidence-data.ts", projectRoot), "utf8"),
      readFile(new URL("app/evidence-case-data.ts", projectRoot), "utf8"),
      readFile(new URL("app/evidence-browser.tsx", projectRoot), "utf8"),
      readFile(new URL("app/outcome-browser.tsx", projectRoot), "utf8"),
      readFile(
        new URL(
          "app/evidence/[benchmark]/[release]/[caseId]/page.tsx",
          projectRoot,
        ),
        "utf8",
      ),
      readFile(new URL("worker/index.ts", projectRoot), "utf8"),
      readFile(new URL(".openai/hosting.json", projectRoot), "utf8"),
      readFile(new URL("wrangler.jsonc", projectRoot), "utf8"),
    ]);

  assert.doesNotMatch(packageJson, /@tanstack\/react-query|@radix-ui\/react-tabs/);
  assert.match(dataModule, /evidence-index\.json/);
  assert.doesNotMatch(dataModule, /\.jsonl\?raw/);
  assert.match(caseDataModule, /corpus\/deepswe-v1\.1\.jsonl\?raw/);
  assert.match(
    caseDataModule,
    /corpus\/swe-bench-pro-public-2026-02-23\.jsonl\?raw/,
  );
  assert.match(browser, /Search evidence cases/);
  assert.match(browser, /outcomeState/);
  assert.match(outcomeBrowser, /Search outcome configurations/);
  assert.match(outcomeBrowser, /submission_date/);
  assert.match(detailPage, /Model × harness outcomes/);
  assert.match(worker, /datasets\/v1\/manifest\.json/);
  assert.match(worker, /env\.CORPUS\.get/);
  const hosting = JSON.parse(hostingConfig);
  assert.match(hosting.project_id, /^appgprj_/);
  assert.equal(hosting.d1, null);
  assert.equal(hosting.r2, "CORPUS");
  assert.match(wranglerConfig, /"bucket_name": "justenough-corpus"/);
});

test("compact index covers all corpus cases without outcome panels", async () => {
  const index = JSON.parse(
    await readFile(new URL("fixtures/evidence-index.json", projectRoot), "utf8"),
  );
  const identities = index.map(
    (record) =>
      `${record.identity.benchmark}:${record.identity.release}:${record.identity.native_id}`,
  );

  assert.equal(index.length, 933);
  assert.equal(new Set(identities).size, 933);
  assert.equal(
    index.reduce((count, record) => count + record.outcome_summary.trials, 0),
    33566,
  );
  assert.ok(index.every((record) => !("outcomes" in record)));
});

test("serves canonical corpus objects through the R2 API", async () => {
  const requestedKeys = [];
  const response = await render(
    "/api/corpus/deepswe-v1.1/testem-bail-on-test-failure",
    {
      CORPUS: {
        async get(key) {
          requestedKeys.push(key);
          return {
            body: new Blob([JSON.stringify({ identity: { native_id: "testem-bail-on-test-failure" } })]).stream(),
            httpEtag: '"fixture-etag"',
            writeHttpMetadata() {},
          };
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("etag"), '"fixture-etag"');
  assert.deepEqual(requestedKeys, [
    "datasets/v1/deepswe-v1.1/testem-bail-on-test-failure.json",
  ]);
  assert.equal(
    (await response.json()).identity.native_id,
    "testem-bail-on-test-failure",
  );
});

test("normalization fixtures contain every published configuration for ten cases", async () => {
  const [deepSweRaw, terminalBenchRaw] = await Promise.all([
    readFile(new URL("fixtures/normalization/deepswe-v1.1.jsonl", projectRoot), "utf8"),
    readFile(
      new URL("fixtures/normalization/terminal-bench-2.1.jsonl", projectRoot),
      "utf8",
    ),
  ]);
  const deepSweRecords = deepSweRaw.trim().split("\n").map(JSON.parse);
  const terminalBenchRecords = terminalBenchRaw.trim().split("\n").map(JSON.parse);
  const records = [...deepSweRecords, ...terminalBenchRecords];
  const identities = records.map(
    (record) =>
      `${record.identity.benchmark}:${record.identity.release}:${record.identity.native_id}`,
  );

  assert.equal(records.length, 10);
  assert.equal(new Set(identities).size, 10);
  assert.ok(records.every((record) => record.schema_version === "1"));
  assert.ok(
    records.every(
      (record) =>
        record.profile.description.startsWith(record.profile.summary) &&
        record.profile.difficulty_factors.length > 0 &&
        !("requirements" in record.profile),
    ),
  );
  assert.ok(deepSweRecords.every((record) => record.outcomes.panel.length === 41));
  assert.ok(
    terminalBenchRecords.every((record) => record.outcomes.panel.length === 20),
  );
  assert.equal(
    records.reduce((count, record) => count + record.outcomes.panel.length, 0),
    305,
  );
  assert.equal(
    records.reduce((count, record) => count + record.outcomes.published_trials, 0),
    1320,
  );
  assert.equal(new Set(deepSweRecords[0].outcomes.panel.map((row) => row.model)).size, 13);
  assert.equal(
    new Set(terminalBenchRecords[0].outcomes.panel.map((row) => row.model)).size,
    13,
  );
  assert.ok(
    records.every((record) => {
      const configurations = record.outcomes.panel.map((row) => row.configuration);
      return configurations.every(Boolean) && new Set(configurations).size === configurations.length;
    }),
  );
  assert.ok(
    records.every((record) =>
      record.outcomes.panel.every(
        (row) => row.model && row.provider && row.provider !== "unknown",
      ),
    ),
  );
});
