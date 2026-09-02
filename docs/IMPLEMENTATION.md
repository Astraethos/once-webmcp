# ONCE Implementation Plan

> **Document status:** Approved implementation sequence
> **Describes:** Milestones Codex should execute after architecture approval
> **Implementation baseline:** Pre-implementation, 2026-09-02
> **Update when:** Milestone ordering, dependencies, or stopping conditions change

## Rules

Do not implement multiple architecture layers speculatively in one pass.

Each milestone must produce a usable, reviewable increment.

Use one feature branch and one pull request per milestone unless the user explicitly changes the strategy.

Preferred branch names:

```text
feat/m1-semantic-core
feat/m2-webmcp-vertical-slice
feat/m3-collaboration-domain
feat/m4-teach-routine
feat/m5-replay-approval
chore/m6-demo-submission
```

Use squash merges.

## Dependency budget

### Existing runtime dependencies

Keep:

- Next.js
- React
- React DOM

### M1 approved development dependency

Add:

- Vitest

Add `pnpm test`.

### Not approved

Do not add without an explicit new architecture decision:

- Redux/Zustand/Jotai;
- Zod;
- UUID packages;
- Framer Motion;
- shadcn/component frameworks;
- WebMCP wrapper packages;
- OpenAI SDK;
- AI SDK;
- Supabase;
- Prisma;
- database clients;
- Playwright;
- Docker tooling.

## M1 — Semantic core

### Objective

Build the deterministic domain engine before building the full UI.

### Likely files

```text
src/core/domain/types.ts
src/core/domain/commands.ts
src/core/domain/validate-command.ts
src/core/domain/apply-command.ts
src/core/domain/initial-state.ts
src/core/events/types.ts
src/core/events/summarize-event.ts
src/core/store/once-store.ts
src/core/persistence/local-storage.ts
src/core/demo/vendor-dossiers.ts
src/core/demo/seed.ts
tests/command-bus.test.ts
tests/persistence.test.ts
package.json
pnpm-lock.yaml
```

### Required behavior

- exact commands from `ARCHITECTURE.md`;
- actor/channel authorization;
- synchronous command execution;
- applied/rejected semantic events;
- readable summaries;
- localStorage serializer/loader;
- deterministic reset seed;
- demo dossier lookup as pure data function.

### Verification

```sh
pnpm test
pnpm check
```

### Stopping point

Stop when semantic core tests pass and no UI/WebMCP code is required to prove state transitions.

Do not begin compiler or replay logic.

## M2 — Human/WebMCP vertical slice

### Objective

Prove the foundational architecture early:

> one human action and one WebMCP action reach the same command bus and appear in the same trace.

### Likely files

```text
src/app/page.tsx
src/app/globals.css
src/components/shell/once-app.tsx
src/components/workspace/*
src/components/trace/*
src/core/store/once-provider.tsx
src/webmcp/register-tools.ts
src/webmcp/tool-definitions.ts
src/webmcp/tool-results.ts
src/types/webmcp.d.ts
```

Initially implement only enough UI/tool surface to prove:

- read workspace;
- add candidate through UI;
- add candidate through WebMCP.

The source must contain native `document.modelContext.registerTool(...)`.

### Required behavior

- actor labels HUMAN / AGENT / ONCE;
- state reacts synchronously;
- refresh restores state;
- registrations clean up through AbortController;
- unsupported browser notice;
- no duplicate business logic.

### Verification

Local:

```sh
pnpm test
pnpm check
```

Browser:

- add candidate through UI;
- add candidate through WebMCP-capable browser;
- compare trace.

### Vercel milestone

**Configure Vercel immediately after M2 is merged to `main`.**

This is the first meaningful implementation milestone and the earliest point where a public deployment contains the concept's core vertical slice.

Steps:

1. connect public GitHub repository to Vercel;
2. use repository defaults unless a verified Next.js setting requires change;
3. deploy `main`;
4. verify public HTTPS URL;
5. open deployed app in ChatGPT's in-app browser;
6. confirm tool discovery;
7. execute one read tool and one mutation tool.

Do not defer public WebMCP testing beyond this point.

### Stopping point

Do not continue until real deployed WebMCP invocation has succeeded.

If it fails, treat that as the highest-priority architecture/integration blocker.

## M3 — Complete Vendor Evaluation collaboration

### Objective

Implement the complete first-session collaboration experience.

### Likely files

```text
src/components/workspace/*
src/components/replay/approval-banner.tsx
src/core/domain/*
src/webmcp/tool-definitions.ts
src/core/demo/vendor-dossiers.ts
tests/command-bus.test.ts
```

### Required behavior

Human UI:

- set/change criterion policy;
- replace evidence;
- change score;
- enable approval policy.

WebMCP tools:

- `get_workspace`
- `get_vendor_dossier`
- `set_budget`
- `add_candidates`
- `add_criteria`
- `attach_evidence`
- `set_scores`
- `flag_uncertainty`
- `set_recommendation`

`get_replay_plan` may return inactive until M5.

### UX target

Implement the final two-region shell:

- workspace ~62%;
- memory rail ~38%;
- trace above routine empty state.

Do not build routine content yet.

### Verification

Run exact first collaboration prompt from `DEMO.md` on deployed Vercel app.

### Stopping point

Stop when one complete collaboration can be performed by ChatGPT Work and human UI from Reset.

Do not start teaching until this flow is stable.

## M4 — Teach routine

### Objective

Implement deterministic compilation and the first memorable product reveal.

### Likely files

```text
src/core/teaching/teaching-policy.ts
src/core/teaching/compiler.ts
src/core/teaching/routine-types.ts
src/components/routine/routine-panel.tsx
src/components/routine/routine-step.tsx
tests/compiler.test.ts
```

### Required behavior

- human-only Teach button;
- `TEACH_ROUTINE`;
- deterministic classification;
- candidate and budget variableization;
- criterion/approval policy preservation;
- procedural loop compilation;
- example-only corrections;
- routine persisted with app state;
- routine panel clearly shows what was learned and not learned.

### Verification

Use exact demo trace fixture plus one live browser collaboration.

Confirm no old candidate/evidence/score literal appears as a replay rule.

### Stopping point

Stop when the taught routine is structurally correct and visually understandable without replay.

## M5 — Replay and approval

### Objective

Prove that the learned routine is executable with new inputs and human control.

### Likely files

```text
src/core/replay/replay-types.ts
src/core/replay/replay-engine.ts
src/components/replay/replay-launcher.tsx
src/components/replay/replay-status.tsx
src/components/replay/approval-banner.tsx
src/webmcp/tool-definitions.ts
tests/replay.test.ts
```

### Required behavior

- human-only replay launcher;
- `START_REPLAY`;
- invariant policy instantiation;
- `get_replay_plan`;
- evidence/score matrix progress tracking;
- automatic `REQUEST_APPROVAL`;
- locked replay editing except human approval;
- blocked pre-approval recommendation;
- human approve/reject;
- post-approval recommendation;
- automatic `COMPLETE_REPLAY`.

### Verification

Run the exact replay scenario from `DEMO.md` through deployed ChatGPT in-app browser.

Explicitly test an early recommendation call and verify `APPROVAL_REQUIRED`.

### Stopping point

Stop when the full Collaborate → Teach → Replay → Approve → Complete loop succeeds twice from Reset.

## M6 — Demo and submission hardening

### Objective

Freeze a coherent competition submission.

### Likely files

```text
README.md
docs/PRODUCT.md
docs/ARCHITECTURE.md
docs/WEBMCP.md
docs/DEMO.md
docs/ACCEPTANCE.md
docs/IMPLEMENTATION.md
docs/SUBMISSION.md
AGENTS.md
```

Plus minimal UI fixes discovered during dry runs.

### Required work

- final README;
- public deployment verification;
- browser capability/failure messaging;
- demo reset polish;
- responsive pass;
- semantic trace wording pass;
- no AI-slop/unsupported marketing claims;
- record demo;
- prepare Devpost description;
- final repository verification;
- tag submission revision.

### Stopping point

Stop implementation once:

- acceptance checklist passes;
- live URL is stable;
- final video is uploaded;
- Devpost fields are ready;
- repository matches the demonstrated behavior.

After submission deadline, follow the freeze guidance in `SUBMISSION.md`.

## Integration checkpoints

### Checkpoint A — after M2

Question:

> Can a real browser agent call ONCE through native WebMCP and produce the same semantic event path as a human?

If no, stop.

### Checkpoint B — after M4

Question:

> Does Teach produce a routine that visibly generalizes new inputs without pretending to infer unsupported rules?

If no, stop.

### Checkpoint C — after M5

Question:

> Does replay actually stop before recommendation and require a human UI approval?

If no, stop.

### Checkpoint D — before submission

Question:

> Can a judge understand the thesis from the live product/video without reading architecture docs?

If no, simplify presentation before adding features.

## PR strategy

For each PR:

1. state milestone objective;
2. list architecture files affected;
3. list user-visible behavior;
4. record actual tests run;
5. record browser verification performed;
6. note any known limitation;
7. verify no unapproved dependency or scope was added.

Do not combine opportunistic refactors with milestone work.

## Competition stopping rules

Cut features rather than destabilize the core loop.

If time becomes constrained, preserve in this order:

1. native WebMCP shared command path;
2. semantic trace;
3. Teach compiler;
4. replay with new inputs;
5. enforced human approval;
6. clear demo/reset;
7. visual polish.

Cut first:

- advanced animations;
- routine editing;
- extra criteria UI;
- extra demo vendors;
- additional tool variants;
- developer inspection panels.
