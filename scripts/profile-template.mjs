const difficultyRules = [
  {
    factor: "reverse engineering from incomplete or indirect evidence",
    pattern:
      /reverse[- ]engineer|recover|reconstruct|infer|undocumented|corrupt|damaged|ambiguous|from (?:an? )?(?:image|binary|capture|observations)/i,
  },
  {
    factor: "legacy compatibility with modern tooling or runtimes",
    pattern:
      /\blegacy\b|modern (?:system|toolchain|environment)|old (?:source|version)|deprecated api|backward compatib/i,
  },
  {
    factor: "cross-platform or cross-architecture execution",
    pattern:
      /cross[- ]compil|\bmips\b|\bqemu\b|virtual machine|\bwasm\b|webassembly|multiple runtimes|browser and node/i,
  },
  {
    factor: "concurrency, cancellation, or distributed-state coordination",
    pattern:
      /concurr|asynchron|\basync\b|thread|parallel|race condition|atomic|distributed|\bmpi\b|microbatch|pipeline parallel|cancell|scheduler/i,
  },
  {
    factor: "recursive delegation and cross-agent error propagation",
    pattern:
      /recursive agent delegation|circular delegation|delegated sub-agents?|delegating agent|sub-agent failures?/i,
  },
  {
    factor: "security-sensitive or adversarial behavior",
    pattern:
      /vulnerab|security|exploit|attack|\bxss\b|injection|taint|saniti[sz]|password|certificate|cryptograph|encrypt|malicious|bypass|\bnosec\b|suppress findings/i,
  },
  {
    factor: "strict behavioral compatibility or exact-output validation",
    pattern:
      /byte-identical|byte-for-byte|\bexact(?:ly)?\b|deterministic|reference (?:output|scene|implementation|behavior|result)|\bunchanged\b|\bpreserv(?:e|es|ing)\b|compatib|regression|no incorrect|same (?:output|behavior|state)|\bequivalent\b/i,
  },
  {
    factor: "layered configuration precedence and inheritance semantics",
    pattern:
      /precedence|inheritance|inherits?\b|outermost default|nearest non-omitted|configuration layer|per-path override|merge .* configuration/i,
  },
  {
    factor: "quantitative performance, accuracy, or resource constraints",
    pattern:
      /\b(?:at least|at most|no more than|fewer than|within|under)\b|\d+(?:\.\d+)?\s*(?:%|percent|seconds?|minutes?|bytes?|kb|mb|gb|lines?|iterations?|samples?|rounds?|steps?)\b|accuracy|tolerance|latency|throughput|performance|memory limit|size limit|timeout|win[- ]rate/i,
  },
  {
    factor: "native compilation and dependency integration",
    pattern:
      /\bcompile\b|\blink(?:er|ing)?\b|native extension|\bcython\b|\bcmake\b|\bmakefile\b|toolchain|system binary|\belf\b|build and install|patch and install/i,
  },
  {
    factor: "low-level memory safety and lifecycle debugging",
    pattern:
      /heap crash|memory initialization|custom allocator|memory leak|\bvalgrind\b|use-after-free|double free|segmentation fault|buffer overflow/i,
  },
  {
    factor: "stateful behavior and data-integrity constraints",
    pattern:
      /migration|transaction|database schema|write-ahead log|\bwal\b|persistence|rollback|cache (?:entry|state|invalidation)|drift baseline|data integrity|shared broker state|queue state|message ttl|dead-letter|cycle and hop/i,
  },
  {
    factor: "changes span multiple components or interfaces",
    pattern:
      /constructors?.*decorators?|routes?, routers|multiple (?:modules|packages|components|interfaces)|across .* (?:layers|components|packages)|middleware .* api|end-to-end/i,
  },
  {
    factor: "consistent behavior across lifecycle stages or execution modes",
    pattern:
      /fit.*evaluat.*predict.*serv.*export|single-target.*multi-target.*clustering|multiple execution modes|across .* lifecycle|across .* commands|template.*dry-run.*get manifest|install and upgrade dry-runs|training and inference|setup and teardown/i,
  },
  {
    factor: "composite state and lifecycle-transition semantics",
    pattern:
      /composite trait|constituent traits?|lifecycle events?|transitions? from incomplete|pair-level change|relationship lifecycle/i,
  },
  {
    factor: "deferred mutation ordering and visibility semantics",
    pattern:
      /deferred command|pending commands?|after flush|batches? .* mutations?|flush(?:es|ing)? .* boundar|cascade respecting nullification/i,
  },
  {
    factor: "incremental dependency tracking and transition semantics",
    pattern:
      /dependency tracking|dependency traits?|previous result|re-evaluates? .* predicate|change transitions?|incremental invalidation/i,
  },
  {
    factor: "nested schema transformation and naming-collision handling",
    pattern:
      /flatten(?:ing|ed)? nested|nested .* merge into|field collision|rename keys?|alias types?|naming collision/i,
  },
  {
    factor: "multidimensional indexing and boundary-condition semantics",
    pattern:
      /out-of-bounds|per-dimension|array dimensions|reflected index|boundary handling|negative index(?:ing)?/i,
  },
  {
    factor: "instrumentation must cover success and failure paths without changing behavior",
    pattern:
      /evaluation profiling|profiling stats|rules? that fail|trace all .* paths|instrument(?:ation|ed).* behavior/i,
  },
  {
    factor: "data-dependent inference with null and type edge cases",
    pattern:
      /inspects? the data to detect|all values are null|non-trivial information|rejects? non-[a-z]+ columns|type inference .* edge cases/i,
  },
  {
    factor: "environment provisioning and end-to-end integration",
    pattern:
      /configure and run|running service|system service|\bdaemon\b|\bssh\b|\bnginx\b|\bsystemd\b|global (?:python|system) environment|package index|network service|listen on port|install the binary/i,
  },
  {
    factor: "specialized algorithmic or domain reasoning",
    pattern:
      /algorithm|sampl|bayesian|causal|statistical|numerical|eigenvalue|eigenpair|matrix decomposition|\bchess\b|\bcircuit\b|fibonacci|graph traversal|compiler|parser|parsing and formatting|tokeni[sz]e|\bsql\b|optimizer pass|optimizedexpr|expression tree|character class|protocol|render|machine learning|neural|embedding|cosine similarity|geometry|abstract syntax|compression format|molecular|thermodynamic|\bg-code\b|\bocr\b|movement paths?/i,
  },
  {
    factor: "ranking or retrieval over incomplete external evidence",
    pattern:
      /leaderboard|complete[- ]coverage model|highest .* score|ranked (?:first|second|third|fourth|fifth|\d+)|nearest document|external (?:source|evidence)/i,
  },
];

export const difficultyFactorVocabulary = [
  ...difficultyRules.map(({ factor }) => factor),
  "cross-language or cross-format integration",
];

function asSentence(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withoutEnd = trimmed.replace(/[.!?]+$/, "");
  const first = withoutEnd[0];
  const normalized = /[a-z]/.test(first)
    ? `${first.toLocaleUpperCase("en-US")}${withoutEnd.slice(1)}`
    : withoutEnd;
  return `${normalized}.`;
}

export function buildDescription(summary, demandClauses) {
  return [summary, ...demandClauses]
    .map(asSentence)
    .filter(Boolean)
    .join(" ");
}

export function deriveDifficultyFactors({
  summary,
  demandClauses,
  technologies,
  languages,
  workSurfaces,
}) {
  const text = [summary, ...demandClauses, ...technologies].join("\n");
  const factors = difficultyRules
    .filter(({ pattern }) => pattern.test(text))
    .map(({ factor }) => factor);

  if (languages.length > 1) {
    factors.push("cross-language or cross-format integration");
  }
  if (workSurfaces.length >= 3) {
    factors.push("changes span multiple components or interfaces");
  }
  return [...new Set(factors)].slice(0, 5);
}
