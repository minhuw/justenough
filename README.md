# JustEnough

JustEnough is an evidence-backed router for choosing the least expensive or
fastest model-and-effort configuration that can reliably complete a coding
task.

This repository currently contains the Cloudflare-ready frontend foundation
and a small illustrative shell. Benchmark ingestion, similarity search, and
real recommendations are intentionally separate milestones; the example
candidate shown by the shell is not a recommendation.

Project references:

- [`PLAN.md`](PLAN.md) — execution plan and next vertical slices
- [`design.md`](design.md) — normative product design system
- [`CONTEXT.md`](CONTEXT.md) — evidence-routing domain language
- [`docs/benchmark-case-abstraction.md`](docs/benchmark-case-abstraction.md) —
  sourced benchmark survey and common evidence model

## Local development

Prerequisite: Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run build
npm run lint
npm test
```

## Frontend architecture

- **React 19 + TypeScript** for the application and component model.
- **Vinext + Vite** for Next-compatible routing and React Server Components
  compiled directly for a Cloudflare Worker runtime.
- **Cloudflare Vite plugin + Sites** for local Worker parity, packaging, and
  hosting. The deployment artifact is `dist/server/index.js`.
- **Tailwind CSS v4** for utility styling over semantic design tokens in
  `app/globals.css`.
- **TanStack Query** for remote evidence state, caching, and later ingestion
  API calls. `app/providers.tsx` owns the browser query client.
- **Radix primitives with shadcn-style composition** for accessible behavior
  without committing to a generated component catalog. The starter proves the
  seam with Radix Tabs.
- **Lucide** for interface icons and native SVG for data visualization.

Shiki is deliberately deferred. Add it with a dynamic import only when a task
or trajectory view actually needs syntax highlighting; putting its language
grammars in the initial route would make the primary query experience heavier.
Analytics is also deferred until the product has a measurement plan and a
consent/privacy decision.

## Routing decision

Do not add TanStack Start or TanStack Router on top of Vinext. Vinext already
owns file routing, layouts, metadata, server rendering, React Server Components,
and Worker output. A second application framework/router would duplicate those
responsibilities and create two competing data-loading and navigation models.

TanStack Query remains a good fit because it is a focused cache and async-state
module rather than an application framework. See
[`docs/adr/0001-cloudflare-frontend-stack.md`](docs/adr/0001-cloudflare-frontend-stack.md).

## Cloudflare and Sites

`.openai/hosting.json` is the source of truth for Sites-owned Cloudflare
bindings. D1 and R2 are currently `null`; the frontend milestone does not need
persistence. Keep Cloudflare resources and hosted runtime values managed by
Sites rather than adding Vercel configuration or a parallel manual deployment
path.

The starter retains optional D1/Drizzle examples under `examples/d1/`, but they
are not part of the runtime until a real schema is introduced.
