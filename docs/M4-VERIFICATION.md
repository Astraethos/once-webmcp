# M4 Teach verification

> **Document status:** Implementation verification record
> **Describes:** M4 deterministic Vendor Evaluation compilation and browser checks
> **Verification date:** 2026-09-02
> **Authority:** `ARCHITECTURE.md`, `ACCEPTANCE.md`, `IMPLEMENTATION.md`

## Scope and starting state

Started from clean `main` matching `origin/main` at
`d736a567d0c2cb37a22ba8eaddf5f0d07248d0d6`. Work is limited to M4.
The approved M3 external-client release exception remains in force; deployed
ChatGPT Work invocation was not retried. Its retry remains deferred to M6.

## Approved clarification

The Build Pack did not specify Teach readiness errors. The user approved the
narrow M4 rule now recorded in Architecture and Acceptance: a valid budget,
2–4 candidates, at least one criterion, and at least one observed approved
procedure. Missing requirements return `TEACHING_INCOMPLETE`; malformed payloads
retain `INVALID_PAYLOAD`. No complete matrix or recommendation is required.

Teach preserves conditional procedure compilation. Approval policy survives even
without an observed recommendation, but a gate is inserted only before an
observed recommendation step. The learned routine uses the single approved
`Routine` representation and enters the `teaching` review phase. Source workspace
edits are disabled; Reset returns to collaboration. Replay is inactive.

## Automated verification

- `pnpm test tests/compiler.test.ts`: 30 tests passed.
- `pnpm test`: 173 tests passed across six files.
- `pnpm check`: lint with zero warnings, typecheck, and production build passed.
- `git diff --check`: passed.
- No dependency, WebMCP contract, fixture dossier, or replay implementation changed.

The fixed demo fixture covers Aegis Cloud, BeaconStack, the $24,000 budget,
Security/Integration/Cost, the full evidence/score matrix, uncertainty, initial
recommendation, and the human policy/evidence/score corrections in `DEMO.md`.
Exact structural assertions cover variables, final policy, quantified loops,
optional uncertainty, approval placement, generated-value exclusions, and
example-only notes. Other cases cover conditional compilation, deterministic
output, malformed names, incomplete states, human authorization, immutable
persistence, corrupted snapshots, reset, and batch rollback.

Initial sandboxed builds hit the local Turbopack CSS-worker port-binding failure
also recorded for M3. A permitted direct Next.js build succeeded, followed by
successful complete `pnpm check` runs. No build configuration was changed.

## Browser verification

Served the production build at `http://localhost:3001` with `pnpm start --port 3001`.
Used connected browser controls because the agent-browser CLI was unavailable.
No browser-test dependency was installed.

### Full demo collaboration and Teach

In the Codex in-app browser, called the existing local native WebMCP tools for
budget, candidates, criteria, dossier reads, all six evidence/score pairs,
uncertainty, and initial recommendation. These were real local tool calls,
not manufactured AGENT trace events or a deployed ChatGPT Work verification.

Through human UI controls:

1. Made Security required and saved priority 1.
2. Enabled approval before final recommendation.
3. Replaced BeaconStack security evidence with “SAML SSO requires the Enterprise add-on.”
4. Changed its Security score from 4 to 3 with a new rationale.
5. Clicked Teach this routine with the name Vendor Security Review.

Verified HUMAN correction/Teach events in the shared trace and AGENT events for
the local tool calls. The routine revealed variable Budget/Candidates, ordered
fixed policy, evidence/scoring loops, optional uncertainty, a human gate before
recommendation, generated-each-run outputs, and both explicit example-only notes.
The routine contained no original vendor, budget, evidence, score-rationale, or
recommendation literals. The source workspace remained readable with disabled
editing controls. Reload restored the learned routine.

### Human-only partial collaboration

In Chrome, entered budget, two candidates, and one Security criterion through
human controls. Attached one BeaconStack evidence item, corrected the add-on
wording, and taught Human browser review. The routine contained only the
observed evidence-collection procedure and an example-only correction note.
Reload restored it. This verifies that no full matrix, scoring, uncertainty, or
recommendation requirement was added to Teach.

An initial incomplete Teach displayed an inline error and excluded trace event.
After another valid command, the obsolete inline error disappeared while the
edited routine name was retained. This browser finding prompted the form
feedback fix included in M4.

### Reset, responsive layout, and console

- Chrome's native Reset confirmation named the workspace, trace, and learned
  routine. Accepting it restored zero candidates/criteria, unset budget,
  disabled approval policy, empty trace, and no learned routine. Reload retained
  that exact empty state.
- Browser automation's dialog API stalled on native confirmations in both
  browser backends. Reset was verified using Chrome's actual native UI on a tab
  without the debugger dialog handler. No confirmation override or product
  workaround was introduced. Reset through the in-app browser remains unverified.
- Inspected desktop 1280×720, compact desktop 900×900, and mobile 390×844 layouts.
  The mobile rail stacked below the workspace; the comparison matrix scrolled
  inside its region. Page width equaled viewport width at 390 and 900 pixels.
  Routine policy/procedure numbers and all classification sections were readable.
- Captured browser warning/error logs were empty through collaboration, Teach,
  and reload. No hydration error or framework error overlay was observed.

## Boundaries retained

The ten M3 tool contracts are unchanged. Teach has no WebMCP tool, and agent or
system Teach commands are rejected. `get_replay_plan` remains inactive. No replay
workspace, execution, approval decision, pause/resume, or M5 enforcement was
implemented or claimed. ONCE does not learn arbitrary workflows.
