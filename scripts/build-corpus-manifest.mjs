import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";

import { releases, validateCorpus } from "./validate-corpus.mjs";

const root = new URL("../", import.meta.url);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeAtomically(file, value) {
  const temporary = new URL(`${file.pathname}.tmp`, file);
  await writeFile(temporary, value);
  await rename(temporary, file);
}

async function main() {
  const validation = await validateCorpus();
  if (!validation.ok) {
    process.stdout.write(
      `${JSON.stringify({ ok: false, validation }, null, 2)}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const benchmarks = [];
  const objects = [];
  for (const spec of releases) {
    const records = (await readFile(spec.file, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(JSON.parse);
    const summary = validation.corpora[spec.key];
    benchmarks.push({
      name: spec.key,
      benchmark_family: spec.benchmark,
      release: spec.release,
      repository: spec.repository,
      source_revision: spec.revision,
      record_count: summary.records,
      configuration_count: summary.configurations,
      model_count: summary.models,
      trial_count: summary.trials,
    });
    for (const record of records) {
      const nativeId = record.identity.native_id;
      if (!/^[a-z0-9][a-z0-9._-]*$/.test(nativeId)) {
        throw new Error(`${spec.key}/${nativeId} is not safe for an R2 object key`);
      }
      const body = Buffer.from(`${JSON.stringify(record)}\n`);
      objects.push({
        benchmark: spec.key,
        native_id: nativeId,
        object_path: `datasets/v1/${spec.key}/${nativeId}.json`,
        media_type: "application/json",
        byte_size: body.byteLength,
        sha256: sha256(body),
      });
    }
  }

  const manifest = {
    manifest_version: "1",
    dataset_version: "v1",
    generated_at: new Date().toISOString(),
    schema_version: "1",
    extraction_version: "full-2",
    benchmarks,
    objects,
    validation: {
      passed: true,
      validation_version: validation.validation_version,
      checked_at: validation.checked_at,
      terminal_evidence: validation.terminal_evidence,
    },
  };
  await writeAtomically(
    new URL("corpus/manifest.json", root),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  process.stdout.write(
    `${JSON.stringify({ ok: true, manifest: "corpus/manifest.json", benchmarks, objects: objects.length }, null, 2)}\n`,
  );
}

main().catch((error) => {
  process.stdout.write(
    `${JSON.stringify({ ok: false, errors: [error.message] }, null, 2)}\n`,
  );
  process.exitCode = 1;
});
