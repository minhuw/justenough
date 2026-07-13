# JustEnough

JustEnough uses benchmark evidence to find the least expensive or fastest
model configuration that can reliably complete a coding task.

The project is at an early stage. The repository contains the frontend shell;
benchmark ingestion, similarity search, and routing are not implemented yet.

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

## Documentation

- [Plan](PLAN.md)
- [Product design](design.md)
- [Domain language](CONTEXT.md)
- [Benchmark case abstraction](docs/benchmark-case-abstraction.md)
- [Normalization spike](docs/normalization-spike.md)
- [Frontend architecture decision](docs/adr/0001-cloudflare-frontend-stack.md)
