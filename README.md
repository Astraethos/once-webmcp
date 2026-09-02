# ONCE

Teach an agent by working with it once.

ONCE is an open-source Vendor Evaluation experiment for the OpenAI WebMCP Challenge.
The **M1 semantic core** is implemented: a synchronous command bus, actor-tagged
events, atomic batches, deterministic fictional vendor dossiers, and versioned
local persistence. The page remains an empty scaffold until M2.
Human/WebMCP UI integration, teaching, replay, and approval execution are not implemented.
ONCE does not claim arbitrary workflow learning.

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
pnpm test
```

This runs linting with zero warnings, generates route types, checks TypeScript,
and builds for production. `pnpm test` runs the deterministic Vitest suite.
GitHub Actions runs both commands for pull requests and pushes to `main`.
Run `pnpm start` after building to serve the production build locally.

## Conventions

- The app shell lives in `src/app`; semantic modules live in `src/core`.
  `@/*` maps to `src/*`.
- Keep changes small and use feature branches and pull requests.
- Never commit credentials or `.env` files; they are ignored.
- Follow milestone order in [Implementation](docs/IMPLEMENTATION.md).

## Semantic core

All domain edits enter [the command bus](src/core/store/once-store.ts).
The bus validates actor/channel, payload, references, and phase before applying
an immutable state transition. Atomic batches commit once and produce an event
per applied command. A failed batch changes no workspace data; a meaningful
rejection adds one excluded trace event. Malformed envelopes/payloads and
unauthorized requests return structured errors without adding activity.

`stateVersion` increases once per committed snapshot, including a rejected event;
event sequences increase once per trace item. State and trace snapshots are
frozen to prevent edits outside the command bus.

Persistence uses `once:v1:state`. Invalid or incompatible snapshots fall back to
the deterministic empty seed. Reset removes only that key. Storage failures do
not lose the in-memory workspace and are available as an operational warning.
The store is not yet mounted to the page in M1.

The exact lifecycle command payloads are declared but return `NOT_IMPLEMENTED`
until M4/M5. Teaching and replay state remain inactive; semantic teaching labels
are annotations, not a compiler. Approval policy can be stored but no approval
workflow executes. Required-criterion recommendation eligibility is validated
in the core using the approved score threshold of 3.

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
