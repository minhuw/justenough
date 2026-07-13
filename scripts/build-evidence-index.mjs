import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const corpusFiles = [
  new URL("corpus/deepswe-v1.1.jsonl", root),
  new URL("corpus/terminal-bench-2.1.jsonl", root),
];

function parseJsonl(raw) {
  return raw.trim().split("\n").filter(Boolean).map(JSON.parse);
}

const records = (
  await Promise.all(corpusFiles.map((file) => readFile(file, "utf8")))
).flatMap(parseJsonl);

const identities = new Set();
const index = records.map((record) => {
  const identity = `${record.identity.benchmark}:${record.identity.release}:${record.identity.native_id}`;
  if (identities.has(identity)) throw new Error(`Duplicate identity: ${identity}`);
  identities.add(identity);

  return {
    identity: record.identity,
    profile: record.profile,
    outcome_summary: {
      trials: record.outcomes.panel.reduce(
        (sum, outcome) => sum + outcome.attempts,
        0,
      ),
      passed: record.outcomes.panel.reduce(
        (sum, outcome) => sum + outcome.passed,
        0,
      ),
    },
  };
});

await writeFile(
  new URL("fixtures/evidence-index.json", root),
  `${JSON.stringify(index, null, 2)}\n`,
);

process.stdout.write(
  `${JSON.stringify({ cases: index.length, output: "fixtures/evidence-index.json" })}\n`,
);
