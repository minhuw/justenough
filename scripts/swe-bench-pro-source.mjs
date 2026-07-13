import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const sweBenchPro = {
  key: "swe-bench-pro-public-2026-02-23",
  benchmark: "swe-bench-pro",
  release: "public-2026-02-23",
  datasetRepository: "https://huggingface.co/datasets/ScaleAI/SWE-bench_Pro",
  datasetRevision: "7ab5114912baf22bb098818e604c02fe7ad2c11f",
  resultsRepository: "https://github.com/scaleapi/SWE-bench_Pro-os",
  resultsRevision: "ca10a60a5fcae51e6948ffe1485d4153d421e6c5",
};

export const sweBenchProRuns = [
  {
    configuration: "claude-45sonnet-10132025",
    provider: "anthropic",
    model: "claude-4-5-sonnet",
    effort: "default",
    submission_date: "2025-10-13",
  },
  {
    configuration: "claude-4sonnet-10132025",
    provider: "anthropic",
    model: "claude-4-sonnet",
    effort: "default",
    submission_date: "2025-10-13",
  },
  {
    configuration: "claude-opus-4-1-paper",
    provider: "anthropic",
    model: "claude-opus-4-1",
    effort: "default",
  },
  {
    configuration: "claude-sonnet-4-paper",
    provider: "anthropic",
    model: "claude-4-sonnet",
    effort: "default",
  },
  {
    configuration: "gemini-2-5-pro-preview-paper",
    provider: "google",
    model: "gemini-2.5-pro-preview",
    effort: "default",
  },
  {
    configuration: "gpt-4o-paper",
    provider: "openai",
    model: "gpt-4o",
    effort: "default",
  },
  {
    configuration: "gpt-5-250-turns-10132025",
    provider: "openai",
    model: "gpt-5-2025-08-07",
    effort: "high",
    submission_date: "2025-10-13",
  },
  {
    configuration: "gptoss-paper",
    provider: "openai",
    model: "gpt-oss-120b",
    effort: "default",
  },
  {
    configuration: "kimi-k2-instruct-10132025",
    provider: "moonshot",
    model: "kimi-k2-instruct",
    effort: "default",
    submission_date: "2025-10-13",
  },
].sort((left, right) =>
  left.configuration.localeCompare(right.configuration),
);

const taskFields = [
  "repo",
  "instance_id",
  "base_commit",
  "problem_statement",
  "requirements",
  "interface",
  "repo_language",
  "issue_specificity",
  "issue_categories",
  "dockerhub_tag",
];

function decodePublishedField(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function canonicalTask(task) {
  return Object.fromEntries(taskFields.map((field) => [field, task[field]]));
}

export function taskDigest(task) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalTask(task)))
    .digest("hex")}`;
}

export function pinnedDatasetUrl() {
  return `${sweBenchPro.datasetRepository}/resolve/${sweBenchPro.datasetRevision}/data/test-00000-of-00001.parquet`;
}

export function pinnedResultUrl(configuration) {
  return `${sweBenchPro.resultsRepository}/blob/${sweBenchPro.resultsRevision}/traj/${configuration}/eval_results.json`;
}

export function loadSweBenchProTasks(parquetPath) {
  const escapedPath = resolve(parquetPath).replaceAll("'", "''");
  const query = `SELECT ${taskFields.join(", ")} FROM read_parquet('${escapedPath}') ORDER BY instance_id`;
  const output = execFileSync("duckdb", ["-json", "-c", query], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(output).map((row) => ({
    ...row,
    problem_statement: decodePublishedField(row.problem_statement),
    requirements: decodePublishedField(row.requirements),
    interface: decodePublishedField(row.interface),
    issue_specificity: decodePublishedField(row.issue_specificity),
    issue_categories: decodePublishedField(row.issue_categories),
  }));
}

export async function loadSweBenchProResults(checkout) {
  const result = new Map();
  for (const run of sweBenchProRuns) {
    const file = `${checkout}/traj/${run.configuration}/eval_results.json`;
    const outcomes = JSON.parse(await readFile(file, "utf8"));
    if (
      Object.values(outcomes).some((value) => typeof value !== "boolean")
    ) {
      throw new Error(`${file} contains a non-boolean outcome`);
    }
    result.set(run.configuration, outcomes);
  }
  return result;
}
