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
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response;
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

const home = await (await fetchOk(new URL("/", baseUrl))).text();
if (!home.includes("202<!-- --> <!-- -->cases") || !home.includes("27424")) {
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

process.stdout.write(
  `${JSON.stringify({
    base_url: baseUrl.origin,
    manifest_objects: remoteManifest.objects.length + 1,
    case_objects_validated: validated,
    elapsed_ms: Math.round(performance.now() - startedAt),
  })}\n`,
);
