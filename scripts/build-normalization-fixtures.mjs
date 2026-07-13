import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const samples = [
  {
    source: "corpus/deepswe-v1.1.jsonl",
    target: "fixtures/normalization/deepswe-v1.1.jsonl",
    ids: [
      "testem-bail-on-test-failure",
      "mnamer-daemon-watch-lifecycle",
      "obsidian-linter-auto-table-of-contents",
      "kombu-single-active-consumer-priority",
      "task-task-graph-export",
    ],
  },
  {
    source: "corpus/terminal-bench-2.1.jsonl",
    target: "fixtures/normalization/terminal-bench-2.1.jsonl",
    ids: [
      "tune-mjcf",
      "polyglot-c-py",
      "fix-code-vulnerability",
      "dna-insert",
      "qemu-alpine-ssh",
    ],
  },
];

for (const sample of samples) {
  const records = (await readFile(new URL(sample.source, root), "utf8"))
    .trim()
    .split("\n")
    .map(JSON.parse);
  const byId = new Map(
    records.map((record) => [record.identity.native_id, record]),
  );
  const selected = sample.ids.map((id) => {
    const record = byId.get(id);
    if (!record) throw new Error(`${sample.source} does not contain ${id}`);
    return record;
  });
  await writeFile(
    new URL(sample.target, root),
    `${selected.map(JSON.stringify).join("\n")}\n`,
  );
}
