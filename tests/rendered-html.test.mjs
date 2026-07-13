import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the evidence explorer and sample cases", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>JustEnough — evidence browser<\/title>/i);
  assert.match(html, /Cases, minus the archaeology/);
  assert.match(html, /10 cases/);
  assert.match(html, /Add bail-on-test-failure handling to Testem/);
  assert.match(html, /Boot Alpine in QEMU and expose SSH/);
  assert.match(html, /Panel trials/);
  assert.doesNotMatch(html, /illustrative data|Candidate frontier|react-loading-skeleton/i);
});

test("server-renders a shareable evidence case with outcomes and provenance", async () => {
  const response = await render(
    "/evidence/terminal-bench/2.1/fix-code-vulnerability",
  );
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Find and fix a CRLF header injection vulnerability/);
  assert.match(html, /reject carriage return, line feed, and null header input/);
  assert.match(html, /gpt-5\.6-luna/);
  assert.match(html, /2<!-- -->\/<!-- -->5/);
  assert.match(html, /3 disqualified/);
  assert.match(html, /Derived metadata/);
  assert.match(html, /Deliberately omitted/);
  assert.doesNotMatch(html, /Original prompt/);
});

test("bundles the JSONL normalization sample without enabling persistence", async () => {
  const [packageJson, dataModule, browser, detailPage, hostingConfig] =
    await Promise.all([
      readFile(new URL("package.json", projectRoot), "utf8"),
      readFile(new URL("app/evidence-data.ts", projectRoot), "utf8"),
      readFile(new URL("app/evidence-browser.tsx", projectRoot), "utf8"),
      readFile(
        new URL(
          "app/evidence/[benchmark]/[release]/[caseId]/page.tsx",
          projectRoot,
        ),
        "utf8",
      ),
      readFile(new URL(".openai/hosting.json", projectRoot), "utf8"),
    ]);

  assert.doesNotMatch(packageJson, /@tanstack\/react-query|@radix-ui\/react-tabs/);
  assert.match(dataModule, /\.jsonl\?raw/);
  assert.match(browser, /Search evidence cases/);
  assert.match(browser, /outcomeState/);
  assert.match(detailPage, /Model × harness outcomes/);
  const hosting = JSON.parse(hostingConfig);
  assert.match(hosting.project_id, /^appgprj_/);
  assert.equal(hosting.d1, null);
  assert.equal(hosting.r2, null);
});

test("normalization fixtures contain ten unique cases and forty outcome rows", async () => {
  const fixtureUrls = [
    new URL("fixtures/normalization/deepswe-v1.1.jsonl", projectRoot),
    new URL("fixtures/normalization/terminal-bench-2.1.jsonl", projectRoot),
  ];
  const records = (
    await Promise.all(fixtureUrls.map((url) => readFile(url, "utf8")))
  ).flatMap((raw) => raw.trim().split("\n").map(JSON.parse));
  const identities = records.map(
    (record) =>
      `${record.identity.benchmark}:${record.identity.release}:${record.identity.native_id}`,
  );

  assert.equal(records.length, 10);
  assert.equal(new Set(identities).size, 10);
  assert.equal(
    records.reduce((count, record) => count + record.outcomes.panel.length, 0),
    40,
  );
});
