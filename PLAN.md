# JustEnough project plan

Status: active  
Started: 2026-07-13

## Outcome

Build an evidence-backed router that accepts a software task and recommends the
least expensive or fastest model-and-effort configuration that clears a stated
reliability target. Recommendations must remain traceable to versioned benchmark
cases and trials, and the system must abstain when the evidence is too weak or
incompatible.

## Track 1 — Fix the design language

1. Inspect DeepSWE's live interface and distinguish direct observations from
   interpretation.
2. Record JustEnough's normative tokens, typography, layout, controls, evidence
   visualizations, responsive behavior, accessibility, motion, and voice in
   `design.md`.
3. Keep the quiet computational-editorial language while establishing a
   distinct brand: warm paper and ink, porridge-yellow selection, and the
   `too weak / just enough / overkill` recommendation grammar.

Verification: the document is implementation-specific, includes light and dark
themes, and supplies review rules that future pages can be checked against.

## Track 2 — Establish the Cloudflare-ready application

1. Start from the Sites Vinext scaffold so React Server Components, Vite, and
   Cloudflare Worker output have one supported deployment path.
2. Retain the useful DeepSWE frontend choices: React 19, TypeScript, Tailwind
   CSS v4, TanStack Query, Radix primitives, Lucide, and native SVG charts.
3. Do not add TanStack Start or TanStack Router beside Vinext; this would create
   two competing routing, loading, and rendering systems.
4. Add Shiki only when a code-bearing route exists and load it dynamically.
   Defer analytics until events, consent, and privacy requirements are defined.
5. Prove the stack with a small branded shell, then validate lint, production
   build, rendered HTML, and Cloudflare Worker output.

Verification: `npm run lint`, `npm run build`, and the rendered HTML tests pass;
`dist/server/index.js` is emitted.

## Track 3 — Normalize benchmark evidence

1. Survey official case formats and published results for DeepSWE,
   Terminal-Bench 2.1, Terminal-Bench 2.0, SWE-bench and SWE-bench Verified,
   SWE-bench Pro, and other relevant agentic benchmarks.
2. Record which fields are directly available, derived, unavailable, or unsafe
   to compare across suites.
3. Define stable case identity separately from immutable case revisions.
   Bind every execution specification and trial outcome to the exact revision,
   harness, environment, model, effort, and source snapshot used.
4. Put suite-specific parsing behind benchmark adapters and expose one small
   evidence-query interface. Preserve source payloads and field-level
   provenance; represent unknown and unsupported values explicitly.
5. Define similarity facets for task intent, required capabilities, artifact
   type, repository/language, environment, tools, resources, verifier shape,
   and expected work—not benchmark names alone.

Verification: `CONTEXT.md` contains only the agreed domain language, while
`docs/benchmark-case-abstraction.md` contains a sourced field matrix, proposed
schema, adapter responsibilities, query interface, limitations, and staged
implementation plan.

## Integration order

1. Land and review the three independent tracks.
2. Reconcile the illustrative shell with the normative design tokens.
3. Run all local checks from a clean project state.
4. Save the first source snapshot and publish privately through Sites when the
   Cloudflare project can be created.

## Next product slices

1. **Corpus slice:** ingest DeepSWE and Terminal-Bench 2.1 into versioned local
   artifacts and expose case pages.
2. **Retrieval slice:** accept a task, retrieve similar case revisions, explain
   matched and missing facets, and abstain below a coverage threshold.
3. **Evidence slice:** join normalized cases to per-trial model, effort, cost,
   latency, tokens, and outcome data.
4. **Routing slice:** select the cheapest or fastest eligible execution
   configuration for a user-supplied reliability target.
5. **Calibration slice:** evaluate recommendation confidence on held-out tasks
   and add new benchmark adapters only when they improve coverage.

## Guardrails

- A global benchmark score is not evidence for a particular task by itself.
- A task name is not a stable revision identifier.
- Missing cost, latency, effort, or environment data never becomes zero or a
  guessed default.
- Results from materially different case revisions or execution environments
  are not silently pooled.
- The router abstains when no comparable evidence clears the coverage policy.
