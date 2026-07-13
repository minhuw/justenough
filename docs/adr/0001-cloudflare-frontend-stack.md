# ADR 0001: Cloudflare-native frontend stack

- Status: Accepted
- Date: 2026-07-13

## Context

JustEnough needs a research-instrument interface for task search, evidence
inspection, score/cost/latency frontiers, and eventually model-and-effort
routing. DeepSWE demonstrates useful frontend ingredients: React, Vite,
Tailwind, TanStack Query, accessible headless primitives, restrained icons,
code highlighting, and custom charts. Its inferred application framework and
Vercel hosting choices are not requirements for this project.

JustEnough will be hosted by Cloudflare through Sites. The initialized project
already uses Vinext to compile a Next-compatible App Router application and
React Server Components into a Cloudflare Worker-compatible ESM artifact.

## Decision

Use the following baseline:

- React 19 and TypeScript.
- Vinext and Vite, with `@cloudflare/vite-plugin` and the existing Sites Vite
  plugin, for routing, server rendering, development, and Worker output.
- Tailwind CSS v4 with semantic CSS variables for the design-token seam.
- TanStack Query for client-side remote evidence state and caching.
- Radix primitives composed locally in a shadcn-like style; add only primitives
  required by real interfaces.
- Lucide for interface icons.
- Native SVG for charts where HTML/CSS would not communicate quantitative
  relationships clearly.
- Shiki only when a code-bearing route exists, and then behind a dynamic import.
- Sites-managed Cloudflare hosting and resource bindings through
  `.openai/hosting.json`.

Do not install TanStack Start or TanStack Router. Vinext already owns the
application shell, route tree, layouts, metadata, server rendering, React
Server Components, and deployment output. Layering a second framework/router
would duplicate responsibilities, complicate hydration and data loading, and
weaken the Cloudflare/Sites integration. TanStack Query is retained because it
is a focused async-state/cache dependency rather than a competing framework.

Do not configure analytics yet. Instrumentation should follow a product
measurement plan, privacy requirements, and identified events.

## Consequences

- The build has one routing and server-rendering model and targets Cloudflare
  directly rather than carrying Vercel-specific configuration.
- The UI can reuse DeepSWE-like interaction patterns without copying its entire
  application architecture.
- Dependencies grow only when a product surface needs them; Shiki, additional
  Radix primitives, D1, and R2 remain deferred.
- If Vinext compatibility becomes a blocker, replacing the app framework is a
  deliberate migration rather than an incremental second-router addition.
