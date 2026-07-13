# JustEnough

JustEnough indexes coding benchmark tasks and their published model outcomes.

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
