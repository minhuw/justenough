# JustEnough

JustEnough indexes coding benchmark tasks and their published model outcomes,
then retrieves comparable cases to find an execution configuration with enough
evidence for a described task.

The route at `POST /api/route` runs without credentials using structured
heuristics, lexical retrieval, and case facets. It uses a conservative 90%
one-sided Wilson lower bound and abstains when similarity, coverage, repeated
trials, or the requested reliability target are insufficient.

## LLM and semantic retrieval

For production task profiling, semantic retrieval, and LLM reranking:

1. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`.
2. Run `npm run data:build-retrieval-index` to embed the versioned corpus.
3. Set `JUSTENOUGH_ENABLE_LLM=true` when serving or deploying.

The LLM extracts the target profile and judges case similarity; it never emits
the routing recommendation. Current outcomes do not normalize cost or latency,
so reasoning effort is explicitly a temporary routing proxy rather than an
economic comparison.

## Development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Run the checks with:

```bash
npm run lint
npm test
```

## Corpus and deployment

```bash
npm run data:validate-corpus
npm run data:build-index
npm run data:upload-r2 -- justenough-corpus
npm run deploy:cloudflare
npm run validate:deployment -- https://justenough.minhuw.workers.dev
```

## Documentation

- [Plan](PLAN.md)
- [Product design](design.md)
- [Domain language](CONTEXT.md)
- [Benchmark case abstraction](docs/benchmark-case-abstraction.md)
- [Normalization spike](docs/normalization-spike.md)
- [Frontend architecture decision](docs/adr/0001-cloudflare-frontend-stack.md)
