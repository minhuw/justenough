import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.JUSTENOUGH_EMBEDDING_MODEL ?? "text-embedding-3-small";
const dimensions = Number.parseInt(
  process.env.JUSTENOUGH_EMBEDDING_DIMENSIONS ?? "256",
  10,
);
const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

if (!apiKey) throw new Error("OPENAI_API_KEY is required to build the retrieval index.");
if (!Number.isInteger(dimensions) || dimensions < 1) {
  throw new Error("JUSTENOUGH_EMBEDDING_DIMENSIONS must be a positive integer.");
}

const cases = JSON.parse(
  await readFile(new URL("fixtures/evidence-index.json", root), "utf8"),
);

function caseId(item) {
  const { benchmark, release, native_id: nativeId } = item.identity;
  return `${benchmark}:${release}:${nativeId}`;
}

function searchDocument(item) {
  const { profile } = item;
  return [
    profile.title,
    profile.summary,
    profile.description,
    profile.interaction,
    ...profile.intents,
    ...profile.technologies,
    ...profile.languages,
    ...profile.work_surfaces,
    ...profile.expected_artifacts,
    ...profile.difficulty_factors,
  ].join("\n");
}

async function embed(inputs) {
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      dimensions,
      input: inputs,
      encoding_format: "float",
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Embedding request failed with ${response.status}.`);
  }
  const rows = [...(payload.data ?? [])].sort((left, right) => left.index - right.index);
  if (rows.length !== inputs.length) throw new Error("Embedding response length mismatch.");
  return rows.map((row) => row.embedding);
}

const records = [];
for (let offset = 0; offset < cases.length; offset += 64) {
  const batch = cases.slice(offset, offset + 64);
  const embeddings = await embed(batch.map(searchDocument));
  batch.forEach((item, index) => {
    records.push({ case_id: caseId(item), embedding: embeddings[index] });
  });
}

await writeFile(
  new URL("fixtures/retrieval-index.json", root),
  `${JSON.stringify({ schema_version: "1", model, dimensions, records })}\n`,
);

process.stdout.write(
  `${JSON.stringify({ cases: records.length, model, dimensions, output: "fixtures/retrieval-index.json" })}\n`,
);

