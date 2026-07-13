import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

import {
  buildDescription,
  deriveDifficultyFactors,
} from "./profile-template.mjs";
import {
  loadSweBenchProResults,
  loadSweBenchProTasks,
  pinnedDatasetUrl,
  pinnedResultUrl,
  sweBenchPro,
  sweBenchProRuns,
  taskDigest,
} from "./swe-bench-pro-source.mjs";

const parquet = process.argv[2];
const resultsCheckout = process.argv[3];
const output = process.argv[4] ?? "corpus/swe-bench-pro-public-2026-02-23.jsonl";

if (!parquet || !resultsCheckout) {
  throw new Error(
    "Usage: node scripts/extract-swe-bench-pro.mjs <dataset.parquet> <results-checkout> [output.jsonl]",
  );
}

const repositoryNames = {
  "NodeBB/NodeBB": "NodeBB",
  "ansible/ansible": "Ansible",
  "element-hq/element-web": "Element Web",
  "flipt-io/flipt": "Flipt",
  "future-architect/vuls": "Vuls",
  "gravitational/teleport": "Teleport",
  "internetarchive/openlibrary": "Open Library",
  "navidrome/navidrome": "Navidrome",
  "protonmail/webclients": "Proton Mail",
  "qutebrowser/qutebrowser": "qutebrowser",
  "tutao/tutanota": "Tutanota",
};

const languageNames = {
  go: "Go",
  js: "JavaScript",
  python: "Python",
  ts: "TypeScript",
};

const technologyRules = [
  ["PostgreSQL", /\bpostgres(?:ql)?\b/i],
  ["MongoDB", /\bmongodb\b|\bmongo\b/i],
  ["Redis", /\bredis\b/i],
  ["SQLite", /\bsqlite\b/i],
  ["MySQL", /\bmysql\b/i],
  ["React", /\breact(?:js)?\b/i],
  ["Redux", /\bredux\b/i],
  ["Qt", /\bqt\b|\bpyqt\b/i],
  ["Kubernetes", /\bkubernetes\b|\bk8s\b|\bkubectl\b/i],
  ["Docker", /\bdocker\b|\bcontainer image\b/i],
  ["GraphQL", /\bgraphql\b/i],
  ["gRPC", /\bgrpc\b/i],
  ["OpenAPI", /\bopenapi\b|\bswagger\b/i],
  ["OAuth", /\boauth\b/i],
  ["LDAP", /\bldap\b/i],
  ["SAML", /\bsaml\b/i],
  ["WebAuthn", /\bwebauthn\b/i],
  ["Prometheus", /\bprometheus\b/i],
  ["GitHub Actions", /\bgithub actions?\b/i],
  ["Webpack", /\bwebpack\b/i],
  ["Babel", /\bbabel\b/i],
  ["systemd", /\bsystemd\b/i],
  ["SSH", /\bssh\b/i],
  ["HTTP", /\bhttps?\b|\bhttp headers?\b|\bweb server\b/i],
  ["JSON", /\bjson\b/i],
  ["YAML", /\byaml\b/i],
];

const surfaceByCategory = {
  accessibility_knowledge: "accessibility",
  api_knowledge: "API",
  authentication_authorization_knowledge: "authentication",
  back_end_knowledge: "backend service",
  database_knowledge: "database layer",
  desktop_knowledge: "desktop application",
  devops_knowledge: "build and deployment",
  front_end_knowledge: "web UI",
  infrastructure_knowledge: "infrastructure",
  mobile_knowledge: "mobile application",
  performance_knowledge: "performance-critical path",
  security_knowledge: "security boundary",
  ui_ux_knowledge: "user interface",
  web_knowledge: "web application",
};

function cleanMarkdown(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#]/g, "")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateWords(value, maximum) {
  const words = cleanMarkdown(value).split(/\s+/).filter(Boolean);
  return words.length <= maximum
    ? words.join(" ")
    : `${words.slice(0, maximum).join(" ")}…`;
}

function extractTitle(problemStatement) {
  const lines = String(problemStatement)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = 0; index < Math.min(lines.length, 12); index += 1) {
    const line = lines[index];
    const labeled = cleanMarkdown(line).match(/^(?:issue\s+)?title\s*:?\s*(.*)$/i);
    if (labeled) {
      const value = labeled[1] || cleanMarkdown(lines[index + 1] ?? "");
      if (value) return truncateWords(value, 14);
    }
  }

  const firstHeading = lines.find(
    (line) =>
      /^#{1,4}\s*/.test(line) &&
      !/^(?:description|issue|overview|summary|context|background)\b/i.test(
        cleanMarkdown(line),
      ),
  );
  return truncateWords(firstHeading ?? lines[0] ?? "Repository change", 14);
}

function startsWithAction(title) {
  return /^(?:add|allow|avoid|build|change|clean|configure|convert|correct|create|deprecate|disable|display|enable|ensure|extend|fix|handle|implement|improve|introduce|make|migrate|move|optimize|prevent|refactor|remove|rename|replace|restore|support|update|use|validate)\b/i.test(title);
}

function ensureSentence(value) {
  const normalized = value.trim().replace(/[.!?]+$/, "");
  const first = normalized[0];
  const capitalized = first && /[a-z]/.test(first)
    ? `${first.toLocaleUpperCase("en-US")}${normalized.slice(1)}`
    : normalized;
  return `${capitalized}.`;
}

function buildSummary(title, repo, issueSpecificity) {
  const words = cleanMarkdown(title).split(/\s+/).filter(Boolean);
  if (words.length >= 6 && words.length <= 30) return ensureSentence(title);

  const labels = issueSpecificity.join(" ");
  const verb = /_bug\b/.test(labels)
    ? "Fix"
    : /_feat\b/.test(labels)
      ? "Implement"
      : "Update";
  const target = startsWithAction(title)
    ? `${title} in the ${repo} codebase`
    : `${verb} ${title[0]?.toLocaleLowerCase("en-US") ?? ""}${title.slice(1)} in the ${repo} codebase`;
  return ensureSentence(truncateWords(target, 30));
}

function requirementClauses(requirements) {
  const raw = String(requirements ?? "");
  const candidates = raw
    .split(/\n+/)
    .flatMap((line) =>
      line.trim().match(/^[-*•]|^\d+[.)]\s/)
        ? [line]
        : line.split(/(?<=[.!?])\s+/),
    )
    .map((line) =>
      line
        .replace(/^[-*•]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim(),
    )
    .map(cleanMarkdown)
    .filter((line) => line.split(/\s+/).length >= 6)
    .filter((line) => !/^(?:requirements?|interface|description)\s*:?$/i.test(line));

  const selected = [];
  for (const candidate of candidates) {
    const clause = truncateWords(candidate, 36);
    const normalized = clause.toLocaleLowerCase("en-US");
    if (selected.some((item) => item.toLocaleLowerCase("en-US") === normalized)) continue;
    selected.push(clause);
    if (selected.length === 3) break;
  }
  return selected;
}

function deriveIntents(issueSpecificity) {
  const labels = issueSpecificity.join(" ");
  const intents = [];
  if (/_bug\b/.test(labels)) intents.push("bug repair");
  if (/_feat\b/.test(labels)) intents.push("feature implementation");
  if (/security_(?:bug|feat|enh)/.test(labels)) intents.push("security remediation");
  if (/performance_(?:bug|feat|enh)|scalability_enh/.test(labels)) {
    intents.push("performance optimization");
  }
  if (/dev_ops_enh|customization_feat/.test(labels)) intents.push("configuration tuning");
  if (/refactoring_enh|code_quality_enh|technical_debt_enh/.test(labels)) {
    intents.push("code refactoring");
  }
  return [...new Set(intents)].slice(0, 4).length
    ? [...new Set(intents)].slice(0, 4)
    : ["feature implementation"];
}

function deriveTechnologies(task, text) {
  const values = [repositoryNames[task.repo] ?? task.repo.split("/").at(-1)];
  for (const [name, pattern] of technologyRules) {
    if (pattern.test(text)) values.push(name);
  }
  return [...new Set(values)].slice(0, 6);
}

function deriveWorkSurfaces(categories, text) {
  const surfaces = categories.map((category) => surfaceByCategory[category]).filter(Boolean);
  const rules = [
    ["CLI", /command[- ]line|\bcli\b|subcommand|command parser/i],
    ["configuration", /configuration|config file|settings/i],
    ["data model", /data model|schema|serialization|migration/i],
    ["parser", /\bparser\b|parsing|tokenizer/i],
    ["test suite", /\btests?\b|test suite|regression/i],
  ];
  for (const [surface, pattern] of rules) {
    if (pattern.test(text)) surfaces.push(surface);
  }
  return [...new Set(surfaces)].slice(0, 5).length
    ? [...new Set(surfaces)].slice(0, 5)
    : ["application logic"];
}

function deriveDifficulty(task, summary, clauses, technologies, languages, workSurfaces) {
  const labels = [...task.issue_specificity, ...task.issue_categories].join(" ");
  const sourceText = [summary, ...clauses].join(" ");
  const factors = deriveDifficultyFactors({
    summary,
    demandClauses: clauses,
    technologies,
    languages,
    workSurfaces,
  }).filter(
    (factor) =>
      factor !== "quantitative performance, accuracy, or resource constraints" ||
      /performance|scalability/.test(labels) ||
      /\d+(?:\.\d+)?\s*(?:%|percent|seconds?|minutes?|bytes?|kb|mb|gb|requests?|records?|items?)/i.test(sourceText),
  );
  const labeled = [
    [/security/, "security-sensitive or adversarial behavior"],
    [/compatibility|regression/, "strict behavioral compatibility or exact-output validation"],
    [/performance|scalability/, "quantitative performance, accuracy, or resource constraints"],
    [/database|data_bug/, "stateful behavior and data-integrity constraints"],
    [/integration|api_knowledge/, "changes span multiple components or interfaces"],
  ];
  for (const [pattern, factor] of labeled) {
    if (pattern.test(labels)) factors.push(factor);
  }
  if (factors.length === 0) {
    factors.push("changes span multiple components or interfaces");
  }
  return [...new Set(factors)].slice(0, 5);
}

function buildPanel(nativeId, results) {
  return sweBenchProRuns.flatMap((run) => {
    const value = results.get(run.configuration)?.[nativeId];
    if (typeof value !== "boolean") return [];
    return [{
      provider: run.provider,
      model: run.model,
      harness: "SWE-Agent",
      configuration: run.configuration,
      ...(run.submission_date ? { submission_date: run.submission_date } : {}),
      effort: run.effort,
      attempts: 1,
      passed: value ? 1 : 0,
      failed: value ? 0 : 1,
      errored: 0,
      excluded: 0,
      disqualified: 0,
      source_submission_url: pinnedResultUrl(run.configuration),
    }];
  });
}

const tasks = loadSweBenchProTasks(parquet).sort((left, right) =>
  left.instance_id.localeCompare(right.instance_id),
);
const results = await loadSweBenchProResults(resultsCheckout);
const records = tasks.map((task) => {
  const repoName = repositoryNames[task.repo] ?? task.repo.split("/").at(-1);
  const title = extractTitle(task.problem_statement);
  const summary = buildSummary(title, repoName, task.issue_specificity);
  const clauses = requirementClauses(task.requirements);
  const text = [task.problem_statement, task.requirements, task.interface].join("\n");
  const languages = [languageNames[task.repo_language] ?? task.repo_language];
  const technologies = deriveTechnologies(task, text);
  const workSurfaces = deriveWorkSurfaces(task.issue_categories, text);
  const difficultyFactors = deriveDifficulty(
    task,
    summary,
    clauses,
    technologies,
    languages,
    workSurfaces,
  );
  const panel = buildPanel(task.instance_id, results);

  return {
    schema_version: "1",
    identity: {
      benchmark: sweBenchPro.benchmark,
      release: sweBenchPro.release,
      native_id: task.instance_id,
    },
    revision: {
      source_revision: sweBenchPro.datasetRevision,
      case_tree: taskDigest(task),
      source_url: pinnedDatasetUrl(),
      repository: `https://github.com/${task.repo}`,
      base_commit: task.base_commit,
      dataset_ref: `ScaleAI/SWE-bench_Pro@${sweBenchPro.datasetRevision}:test`,
    },
    profile: {
      title,
      summary,
      description: buildDescription(summary, clauses),
      interaction: "repository",
      intents: deriveIntents(task.issue_specificity),
      technologies,
      languages,
      work_surfaces: workSurfaces,
      expected_artifacts: ["repository patch"],
      difficulty_factors: difficultyFactors,
      observed_labels: {
        repository: task.repo,
        language: task.repo_language,
        issue_specificity: task.issue_specificity.join(", "),
        issue_categories: task.issue_categories.join(", "),
      },
    },
    outcomes: {
      source_url: `${sweBenchPro.resultsRepository}/tree/${sweBenchPro.resultsRevision}/traj`,
      published_configurations: panel.length,
      published_trials: panel.length,
      panel,
    },
    extraction: {
      method: "structured semantic extraction with pinned-source review",
      version: "full-2",
      date: new Date().toISOString().slice(0, 10),
      observed_fields: [
        "repo",
        "instance_id",
        "base_commit",
        "problem_statement",
        "requirements",
        "interface",
        "repo_language",
        "issue_specificity",
        "issue_categories",
        "published per-task outcomes",
      ],
      derived_fields: [
        "title",
        "summary",
        "description",
        "intents",
        "technologies",
        "work_surfaces",
        "difficulty_factors",
      ],
      omitted: [
        "full instruction text",
        "environment implementation and image",
        "author names and contact details",
        "gold solution",
        "verifier implementation",
        "test patches and test lists",
        "agent trajectories",
        "gold code patch",
        "agent logs",
      ],
    },
  };
});

const lines = `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
await writeFile(output, lines);
process.stdout.write(
  `${JSON.stringify({
    output,
    records: records.length,
    configurations: new Set(records.flatMap((record) => record.outcomes.panel.map((row) => row.configuration))).size,
    models: new Set(records.flatMap((record) => record.outcomes.panel.map((row) => row.model))).size,
    trials: records.reduce((sum, record) => sum + record.outcomes.published_trials, 0),
    sha256: createHash("sha256").update(lines).digest("hex"),
  })}\n`,
);
