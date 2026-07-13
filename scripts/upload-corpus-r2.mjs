import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = new URL("../", import.meta.url);
const bucket = process.argv[2] ?? "justenough-corpus";
const benchmarkFlag = process.argv.indexOf("--benchmark");
const benchmarkFilter = benchmarkFlag === -1
  ? null
  : process.argv[benchmarkFlag + 1];
const concurrency = Number.parseInt(process.env.R2_UPLOAD_CONCURRENCY ?? "6", 10);
const wrangler = new URL("../node_modules/.bin/wrangler", import.meta.url).pathname;

if (!/^[a-z0-9][a-z0-9-]*$/.test(bucket)) {
  throw new Error(`Invalid R2 bucket name: ${bucket}`);
}
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) {
  throw new Error("R2_UPLOAD_CONCURRENCY must be an integer between 1 and 16");
}
if (benchmarkFlag !== -1 && !benchmarkFilter) {
  throw new Error("--benchmark requires a manifest benchmark name");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function runWrangler(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(wrangler, args, {
      cwd: new URL("../", import.meta.url),
      env: {
        ...process.env,
        WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`wrangler ${args.join(" ")} failed\n${output.trim()}`));
    });
  });
}

const manifestRaw = await readFile(new URL("corpus/manifest.json", root));
const manifest = JSON.parse(manifestRaw);
const corpusByBenchmark = new Map();

if (
  benchmarkFilter &&
  !manifest.benchmarks.some((benchmark) => benchmark.name === benchmarkFilter)
) {
  throw new Error(`Unknown manifest benchmark: ${benchmarkFilter}`);
}

for (const benchmark of manifest.benchmarks) {
  const raw = await readFile(new URL(`corpus/${benchmark.name}.jsonl`, root), "utf8");
  corpusByBenchmark.set(
    benchmark.name,
    new Map(
      raw
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const record = JSON.parse(line);
          return [record.identity.native_id, Buffer.from(`${JSON.stringify(record)}\n`)];
        }),
    ),
  );
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), "justenough-r2-"));

try {
  const uploads = [];
  const selectedObjects = benchmarkFilter
    ? manifest.objects.filter((object) => object.benchmark === benchmarkFilter)
    : manifest.objects;
  for (const object of selectedObjects) {
    const body = corpusByBenchmark.get(object.benchmark)?.get(object.native_id);
    if (!body) throw new Error(`Missing corpus record: ${object.object_path}`);
    if (body.byteLength !== object.byte_size || sha256(body) !== object.sha256) {
      throw new Error(`Manifest mismatch: ${object.object_path}`);
    }

    const file = join(
      temporaryDirectory,
      `${object.benchmark}-${object.native_id}.json`,
    );
    await writeFile(file, body);
    uploads.push({ file, key: object.object_path });
  }

  let cursor = 0;
  let completed = 0;
  async function worker() {
    while (cursor < uploads.length) {
      const upload = uploads[cursor];
      cursor += 1;
      await runWrangler([
        "r2",
        "object",
        "put",
        `${bucket}/${upload.key}`,
        "--file",
        upload.file,
        "--content-type",
        "application/json",
        "--cache-control",
        "public, max-age=31536000, immutable",
        "--remote",
        "--force",
      ]);
      completed += 1;
      if (completed % 20 === 0 || completed === uploads.length) {
        process.stdout.write(`Uploaded ${completed}/${uploads.length} case objects\n`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const manifestFile = join(temporaryDirectory, "manifest.json");
  await writeFile(manifestFile, manifestRaw);
  await runWrangler([
    "r2",
    "object",
    "put",
    `${bucket}/datasets/v1/manifest.json`,
    "--file",
    manifestFile,
    "--content-type",
    "application/json",
    "--cache-control",
    "public, max-age=60",
    "--remote",
    "--force",
  ]);

  process.stdout.write(
    `${JSON.stringify({ bucket, benchmark: benchmarkFilter, case_objects: uploads.length, objects: uploads.length + 1 })}\n`,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
