import deepSweRaw from "@/corpus/deepswe-v1.1.jsonl?raw";
import terminalBenchRaw from "@/corpus/terminal-bench-2.1.jsonl?raw";
import type { EvidenceCase } from "./evidence-data";

function parseJsonl(raw: string): EvidenceCase[] {
  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as EvidenceCase);
}

const evidenceCases = [
  ...parseJsonl(deepSweRaw),
  ...parseJsonl(terminalBenchRaw),
];

export function findEvidenceCase(
  benchmark: string,
  release: string,
  nativeId: string,
) {
  return evidenceCases.find(
    (item) =>
      item.identity.benchmark === benchmark &&
      item.identity.release === release &&
      item.identity.native_id === nativeId,
  );
}
