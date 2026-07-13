# JustEnough

JustEnough indexes coding benchmark tasks and their published model outcomes,
then retrieves comparable cases to find an execution configuration with enough
evidence for a described task.

The route at `POST /api/route` runs without credentials using structured
heuristics, lexical retrieval, and case facets. It uses a conservative 90%
one-sided Wilson lower bound and abstains when similarity, coverage, repeated
trials, or the requested reliability target are insufficient.

## LLM judge and semantic retrieval

For production task profiling, semantic retrieval, LLM reranking, and final
selection:

1. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`.
2. Run `npm run data:build-retrieval-index` to embed the versioned corpus.
3. Set `JUSTENOUGH_ENABLE_LLM=true` when serving or deploying.

For Cloudflare or Sites, configure `OPENAI_API_KEY` as a production secret and
`JUSTENOUGH_ENABLE_LLM` as a runtime variable in the host; never commit the key.
Keep an LLM-enabled route private or add rate limits before exposing it publicly,
because one routing request can make up to three model calls.

The final judge sees opaque IDs for configurations in the lowest-effort tier
that already passes the fixed evidence gates. It may propose one route or
abstain, and must cite the complete supporting case set. A deterministic
verifier checks its candidate, citations, trial counts, bounds, and effort-tier
eligibility before accepting the proposal. If the judge is unavailable or
invalid, the credential-free deterministic selector is used instead.

Current outcomes do not normalize cost or latency, so reasoning effort is
explicitly a temporary routing proxy rather than an economic comparison.

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
