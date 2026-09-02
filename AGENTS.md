<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ONCE Agent Instructions

> **Document status:** Approved implementation instructions
> **Describes:** How Codex should implement the competition MVP
> **Architecture authority:** `docs/ARCHITECTURE.md`, `docs/WEBMCP.md`, `docs/IMPLEMENTATION.md`
> **Update when:** An approved architecture decision changes

## Product boundary

ONCE is a constrained WebMCP competition MVP that demonstrates one thesis:

> Teach an agent by working with it once.

The implemented domain is **Vendor Evaluation**. Do not generalize the product into an arbitrary workflow engine.

Do not add authentication, a database, Supabase, an OpenAI SDK, an AI SDK, a backend service, Docker, an MCP/WebMCP abstraction framework, or a component framework unless an approved document explicitly changes that decision.

## Architectural invariants

1. Human UI actions and WebMCP actions must mutate product state through the same semantic command bus.
2. No component and no WebMCP tool may directly mutate domain state.
3. Every semantic event records `actor`, `channel`, `phase`, command type, outcome, and a human-readable summary.
4. WebMCP tools use native `document.modelContext.registerTool(...)`.
5. WebMCP actor identity is assigned internally as `agent`; it is never accepted from tool input.
6. Human approval is human-only. Do not expose approval recording, teaching, replay start, or demo reset as WebMCP tools.
7. The routine compiler is deterministic and domain-specific. Do not introduce an LLM into ONCE.
8. Literal evidence, scores, recommendation text, and one-off human corrections must not be promoted to durable routine rules.
9. Replay must enforce the compiled routine and must block final recommendation before required human approval.
10. A blocked business action returns a structured tool result and does not mutate workspace state.
11. Demo fixtures must remain deterministic and first-party. Do not replace them with live external vendor research.
12. Preserve the repository documentation standards in `docs/standards/`.

## Implementation discipline

Follow `docs/IMPLEMENTATION.md` milestone order. Stop at each milestone boundary and verify its acceptance criteria before beginning the next milestone.

Use feature branches and pull requests. Keep each milestone reviewable. Prefer one squash merge per milestone.

Before writing Next.js code, read the relevant local Next.js 16 documentation under `node_modules/next/dist/docs/`.

## Dependency policy

The approved runtime dependency surface remains Next.js, React, and React DOM.

One additional development dependency is approved at M1:

- `vitest` for deterministic unit tests of the semantic core, compiler, and replay engine.

Do not add a state-management library, schema library, UUID library, animation library, WebMCP wrapper, or browser-test framework unless a concrete blocker is documented first.

Use platform capabilities where practical:

- `crypto.randomUUID()`
- `localStorage`
- `AbortController`
- `useSyncExternalStore`
- CSS transitions

## Verification

At minimum, before a milestone PR is ready:

```sh
pnpm test
pnpm check
```

Also perform the browser checks required by `docs/ACCEPTANCE.md`.

Do not claim a browser or ChatGPT Work verification passed unless it was actually run.

## Documentation

Follow [Clear Technical Documentation Standard](docs/standards/clear-technical-documentation-standard.md).

For squash-merge titles and extended descriptions, follow [GitHub Merge Extended Description Standard](docs/standards/github-merge-extended-description-standard.md).

If implementation diverges from an approved architecture document, stop and update the architecture decision before coding around it.
