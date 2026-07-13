import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const baseUrl = new URL(
  process.argv[2] ?? "https://justenough.minhuw.workers.dev",
);
const concurrency = 12;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function fetchOk(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) return response;
    if (attempt === 2 || (response.status !== 404 && response.status < 500)) {
      throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }
  throw new Error(`Unable to fetch ${url}`);
}

const localManifest = JSON.parse(
  await readFile(new URL("corpus/manifest.json", root), "utf8"),
);
const remoteManifestResponse = await fetchOk(
  new URL("/api/corpus/manifest", baseUrl),
);
const remoteManifest = await remoteManifestResponse.json();

if (remoteManifest.objects.length !== localManifest.objects.length) {
  throw new Error(
    `Manifest object count mismatch: ${remoteManifest.objects.length} !== ${localManifest.objects.length}`,
  );
}

let cursor = 0;
let validated = 0;
const startedAt = performance.now();

async function validateCase() {
  while (cursor < localManifest.objects.length) {
    const object = localManifest.objects[cursor];
    cursor += 1;
    const response = await fetchOk(
      new URL(
        `/api/corpus/${object.benchmark}/${encodeURIComponent(object.native_id)}`,
        baseUrl,
      ),
    );
    const body = Buffer.from(await response.arrayBuffer());
    if (body.byteLength !== object.byte_size) {
      throw new Error(`Byte size mismatch: ${object.object_path}`);
    }
    if (sha256(body) !== object.sha256) {
      throw new Error(`SHA-256 mismatch: ${object.object_path}`);
    }
    const record = JSON.parse(body);
    if (record.identity.native_id !== object.native_id) {
      throw new Error(`Identity mismatch: ${object.object_path}`);
    }
    validated += 1;
  }
}

await Promise.all(Array.from({ length: concurrency }, () => validateCase()));

const evidencePage = await (await fetchOk(new URL("/evidence", baseUrl))).text();
if (
  !evidencePage.includes("933<!-- --> <!-- -->cases") ||
  !evidencePage.includes("33566")
) {
  throw new Error("The deployed evidence index does not show the full corpus totals");
}

const detail = await (
  await fetchOk(
    new URL(
      "/evidence/terminal-bench/2.1/fix-code-vulnerability",
      baseUrl,
    ),
  )
).text();
if (!detail.includes("Fix CRLF injection in Bottle headers") || !detail.includes("grok-4.5")) {
  throw new Error("The deployed detail page is missing expected case evidence");
}

const sweBenchProDetail = await (
  await fetchOk(
    new URL(
      "/evidence/swe-bench-pro/public-2026-02-23/instance_ansible__ansible-0ea40e09d1b35bcb69ff4d9cecf3d0defa4b36e8-v30a923fb5c164d6cd18280c02422f75e611e8fb2",
      baseUrl,
    ),
  )
).text();
if (
  !sweBenchProDetail.includes("TypeError combining VarsWithSources") ||
  !sweBenchProDetail.includes("gpt-5-2025-08-07")
) {
  throw new Error("The deployed SWE-Bench Pro detail page is incomplete");
}

process.stdout.write(
  `${JSON.stringify({
    base_url: baseUrl.origin,
    manifest_objects: remoteManifest.objects.length + 1,
    case_objects_validated: validated,
    elapsed_ms: Math.round(performance.now() - startedAt),
  })}\n`,
);
