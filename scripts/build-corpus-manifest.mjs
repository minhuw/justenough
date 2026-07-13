import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

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

  const corpora = [];
  const gzipWrites = [];
  for (const spec of releases) {
    const data = await readFile(spec.file);
    const gzip = gzipSync(data, { level: 9, mtime: 0 });
    const name = fileURLToPath(spec.file).split("/").at(-1);
    const gzipFile = new URL(`corpus/${name}.gz`, root);
    gzipWrites.push(writeAtomically(gzipFile, gzip));
    const summary = validation.corpora[spec.key];
    corpora.push({
      benchmark: spec.benchmark,
      release: spec.release,
      object_path: `corpus/v1/${name}`,
      media_type: "application/x-ndjson",
      byte_size: data.byteLength,
      sha256: sha256(data),
      record_count: summary.records,
      configuration_count: summary.configurations,
      model_count: summary.models,
      trial_count: summary.trials,
      gzip: {
        object_path: `corpus/v1/${name}.gz`,
        media_type: "application/gzip",
        byte_size: gzip.byteLength,
        sha256: sha256(gzip),
      },
    });
  }
  await Promise.all(gzipWrites);

  const manifest = {
    manifest_version: "1",
    generated_at: new Date().toISOString(),
    schema_version: "0.2",
    extraction_version: "full-1",
    sources: Object.fromEntries(
      releases.map((spec) => [
        spec.key,
        { repository: spec.repository, revision: spec.revision },
      ]),
    ),
    corpora,
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
    `${JSON.stringify({ ok: true, manifest: "corpus/manifest.json", corpora }, null, 2)}\n`,
  );
}

main().catch((error) => {
  process.stdout.write(
    `${JSON.stringify({ ok: false, errors: [error.message] }, null, 2)}\n`,
  );
  process.exitCode = 1;
});
