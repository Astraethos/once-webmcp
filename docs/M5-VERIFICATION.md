# M5 Replay and approval verification

> **Document status:** Implementation verification record; release gate pending
> **Describes:** M5 deterministic Vendor Evaluation replay and human approval
> **Verification date:** 2026-09-02 (America/Denver)
> **Authority:** `ARCHITECTURE.md`, `ACCEPTANCE.md`, `IMPLEMENTATION.md`

## Scope and baseline

Started from clean `main` matching freshly fetched `origin/main` at
`ca263a8a4622f0d0213158d5ded2b7db1434bf08`. The feature branch is
`codex/m5-replay-approval`. No M6 submission work or dependencies were added.

## Approved readiness clarification

The user approved two `START_REPLAY` checks, documented in Architecture and
Acceptance. Scoring without evidence collection, or recommendation with required
criteria but without scoring, returns `REPLAY_ROUTINE_INCOMPLETE` with a specific
missing-prerequisite explanation. Workspace, routine, and replay remain unchanged;
the rejected semantic event is excluded from teaching. M4 Teach remains
permissive, and missing procedures are never injected.

## Implemented behavior

- The human launcher binds 2–4 candidate identities and a new USD budget to a
  fresh workspace with the learned criteria, priorities, required flags, and
  approval policy. Prior generated outputs are not copied.
- The read-only replay plan exposes steps, completion requirements, missing
  matrix pairs, current progress, approval state, constraints, and next actions.
- Each score requires evidence for its pair. Required criteria require score
  3 or higher; eligibility errors take precedence over approval errors.
- Matrix completion automatically emits system `REQUEST_APPROVAL`. The visible
  checkpoint explains the review, eligibility, approval, and terminal rejection.
- Human `RECORD_APPROVAL` resumes or rejects. Reviewed outputs remain locked;
  an eligible post-approval recommendation automatically emits `COMPLETE_REPLAY`.
- Complete snapshots survive reload. Validation reconstructs typed source and
  replay transitions; inconsistent policy, progress, or approval is discarded.
- Native registration and all ten tool contracts remain unchanged. No approval,
  policy-editing, Teach, Start Replay, or Reset tool was introduced.

## Automated verification

- `pnpm test tests/replay.test.ts`: 42 tests passed.
- `pnpm test`: 215 tests passed across seven files.
- `pnpm lint`: passed with zero warnings.
- `pnpm typecheck`: passed.
- `pnpm build`: passed.
- `pnpm check`: passed, including the production build.
- `git diff --check`: passed.

Tests cover the two readiness rules, unchanged permissive teaching, absence of
injected work, fresh bindings, fixed policy, matrix completeness, pair evidence,
read-only detached plans, early recommendation, error precedence, atomic batch
rollback including automatic events, actor restrictions, stale decisions,
approval/resume, terminal rejection, completion without approval, partial
routines, persisted running/paused/approved/rejected/completed states, corrupted
snapshots, deterministic reset, and two complete semantic loops.

Initial package-script builds hit the local Turbopack CSS-worker port restriction
previously observed in M4. A permitted direct Next.js build succeeded, followed
by successful explicit `pnpm build` and complete `pnpm check` runs. No build
configuration was changed.

## Browser evidence

Served the production build at `http://127.0.0.1:3001`. The preferred
agent-browser CLI was unavailable, so connected browser controls were used
without adding a browser-test dependency.

### Full loop, twice

In the Codex in-app browser, performed two complete local collaborations using
real page-discovered native WebMCP tools: $24,000, Aegis Cloud/BeaconStack,
Security/Integration/Cost, dossier reads, six evidence items, six scores,
uncertainty, and initial recommendation. Through human UI controls, made
Security required, enabled approval, corrected BeaconStack evidence, and taught
the routine. The routine disclosed the example-only correction.

Started replay through the human UI with Northwind AI, Orchid Systems, and
$18,000. Verified a fresh workspace with learned policies and no old outputs.
Read the native replay plan and dossiers, attached six new evidence items,
flagged uncertainty, and supplied six new scores. Both runs automatically paused
at human approval, resumed after the UI Approve action, and completed after a
native recommendation call.

Explicit native negative checks returned:

- `EVIDENCE_REQUIRED` for a score before evidence;
- `REPLAY_ACTION_NOT_ALLOWED` for a budget change after start;
- `APPROVAL_REQUIRED` for an early eligible recommendation and again at the gate;
- `REQUIRED_CRITERION_FAILED` for Orchid's required Security score of 2.

The trace showed AGENT work/rejections, HUMAN policy/correction/Teach/Start/
approval actions, and ONCE pause/completion. Reload at the approval gate retained
pending approval; reload after completion retained the final recommendation.

### Readiness and rejection

A separate scoring-only collaboration was taught successfully in-browser.
Start Replay displayed “Replay can’t start because scoring was learned without
evidence collection.” The source budget/candidates/score remained visible,
phase remained `teaching`, and replay remained null.

In a separate recommendation-only routine with no required criteria and a
learned approval policy, Start reached the approval gate without inventing
evidence or scores. UI Reject ended the run. Budget and recommendation tools
returned `INVALID_REPLAY_STATE`; recommendation stayed empty. Reload preserved
the rejection. Full-matrix rejection is also covered in automated tests.

### Reset, responsive layout, and console

The browser's high-level native-dialog helper initially stalled, as in M4.
Browser developer events subsequently verified the actual Reset confirmation
and its accepted result. Using the supported dialog command in the same action
turn allowed subsequent Reset checks to complete. The product confirmation was
not overridden or replaced. Reset cleared workspace, trace, routine, replay,
and the `once:v1:state` key; reload retained the exact empty seed.

Inspected 1280×900, 900×900, and 390×844 layouts. The approval controls remained
visible and enabled; at 390px the Memory Rail stacked below the workspace and
the matrix scrolled inside its region. Page width matched viewport width at
900px and 390px. Browser review found and fixed routine-heading focus stealing
focus from the approval banner after reload; the rebuilt page focused
`approval-heading` at the restored gate. Captured warning/error logs were empty
through the completed flows, rejection, and reloads. No framework error overlay
was observed.

## External-client release gate

These were local native WebMCP invocations in the Codex in-app browser, not
deployed ChatGPT Work verification. Deployed ChatGPT Work invocation remains
unverified. The historical M3 exception explicitly authorized M3 only; M5 release
requires either its deployed verification or explicit approval to carry this
remaining check to M6. No external-client success is claimed.
