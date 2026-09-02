# ONCE

Teach an agent by working with it once.

ONCE is a planned open-source WebMCP application for the OpenAI WebMCP Challenge.
This repository contains **setup and an empty application scaffold only**.
Semantic recording, routines, replay, approvals, and WebMCP integration are not implemented.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, ESLint, and pnpm.
Use Node.js 24.20.0 (see `.nvmrc`) and pnpm 11.24.0 (see `packageManager`).
The committed lockfile provides reproducible dependency installs.

## Local setup

```sh
git clone https://github.com/Astraethos/once-webmcp.git
cd once-webmcp
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. The page is deliberately the empty starter's Hello world page.
No environment variables, API keys, database, or paid services are needed.

## Verification

```sh
pnpm check
```

This runs linting with zero warnings, generates route types, checks TypeScript,
and builds for production. GitHub Actions runs the same checks for pull requests
and pushes to `main`. Product tests will be added with product implementation.
Run `pnpm start` after building to serve the production build locally.

## Conventions

- Application code lives in `src/app`; `@/*` maps to `src/*`.
- Keep changes small and use feature branches and pull requests.
- Never commit credentials or `.env` files; they are ignored.
- Do not add product features during the setup phase.

## Documentation standards

The README is the entry point for the current scaffold and local setup.
For maintained repository documentation, follow the
[Clear Technical Documentation Standard](docs/standards/clear-technical-documentation-standard.md).
For final squash-merge records, follow the
[GitHub Merge Extended Description Standard](docs/standards/github-merge-extended-description-standard.md).
The merge standard controls merge formatting, not PR review context.
Agent guidance is in [AGENTS.md](AGENTS.md).

## License

ONCE is licensed under the [MIT License](LICENSE).

## Follow-ups

- Vercel deployment is intentionally deferred until the first meaningful ONCE
  implementation milestone. Deployment and public HTTPS verification are required
  before WebMCP end-to-end testing and submission.
- ESLint is pinned to 9.39.5 because the template's React/import/accessibility
  plugins do not yet support ESLint 10. ESLint 9 is deprecated upstream; upgrade
  the plugin set and ESLint together when compatible releases are available.
