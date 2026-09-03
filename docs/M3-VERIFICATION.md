# M3 verification record

> **Document status:** Implementation evidence; deployed invocation checkpoint pending
> **Baseline:** M3 Vendor Collaboration, 2026-09-02
> **Authority:** [Acceptance](ACCEPTANCE.md), [Implementation](IMPLEMENTATION.md), and the user's M3 authorization
> **Update when:** CI, deployment, or native ChatGPT Work invocation is verified

## Implemented scope

The workspace supports budget, candidates, criterion definition and human policy
correction, fixed vendor dossiers, evidence attachment and human replacement,
1–5 scores and corrections, uncertainty, and an initial recommendation. Required
criteria retain the semantic core's score threshold of 3. An existing
recommendation that becomes ineligible after a human correction is visibly marked
for review; it is not silently replaced.

The Memory Rail places the actor-tagged trace above an empty Routine panel.
The trace follows new events while the user is at its end and allows history
inspection. Approval policy is stored for future routines. No approval execution,
Teach, compilation, or replay was added. No dependency or architecture changes.

## Automated verification

- `pnpm exec vitest run tests/collaboration.test.ts`: 47 M3 tests passed.
- `pnpm test`: 143 tests passed across five files.
- `pnpm lint`: passed with zero warnings.
- `pnpm typecheck`: passed.
- `pnpm check`: passed lint, typecheck, and the production `pnpm build`.
- Initial build attempts hit a local sandbox port-binding failure in Turbopack.
  A direct Next.js build succeeded, followed by the complete package-script check
  with execution permission. No build configuration changes were needed.

Tests cover the full tool-driven demo sequence followed by human corrections,
exact approved schemas/descriptions, granular actor metadata, atomic rollback,
invalid inputs, unknown dossiers, deterministic priority normalization,
required-score recommendation rejection, inactive replay, persistence, and reset.
Every tool tolerates omitted execution options and options without a signal.
Cancellation and actor/channel spoofing cause no workspace mutation.

The registration tests use an isolated contract double. They do not constitute
native agent invocation evidence.

## Local browser verification

Ran the production build using `pnpm start --port 3001` in local WebMCP-enabled
Chrome through the installed browser connector.

- The page reported 10 native tools registered, including after reload.
- Through real human forms, set $24,000, added Aegis Cloud and BeaconStack, and
  added Security, Integration, and Cost in priority order.
- Opened both fixed dossiers, attached all six evidence cells, and scored all
  six pairs. Added uncertainty and recommended Aegis Cloud.
- Made Security required, moved it to priority 2 and back to 1, and enabled
  approval-before-recommendation policy. The initial recommendation remained.
- Replaced BeaconStack's Security evidence and changed its score to 2. The cell
  displayed the correction and unmet requirement. Each action produced HUMAN
  semantic activity.
- Attempted to recommend BeaconStack. A visible rejection explained the minimum
  required score; the existing Aegis Cloud recommendation remained unchanged.
- Duplicate candidate and criterion names produced visible errors with no partial
  additions. Whitespace-only candidate input was rejected.
- Reload restored the complete evaluation, human corrections, policy, trace, and
  recommendation. No duplicate events appeared.
- Inspected 1440×900, 1100×900, and 390×844 layouts. No page-level horizontal
  overflow. On mobile the matrix scrolls within its region and Memory Rail
  stacks below the workspace. Temporary viewport overrides were reset.
- Warning/error console logs were empty on the exercised production page.
- Cancelled reset and verified the evaluation remained. Confirmed reset and
  verified all fields and trace returned to the empty deterministic seed. A fresh
  tab retained the empty state and registered all 10 tools.

The browser connector stalled on native confirmation-dialog handling. Chrome's
native accessibility controls completed the reset cancellation and confirmation.
This was a connector limitation, not an application failure.

## CI and deployed preview

[PR #7 — M3: Complete Vendor Collaboration](https://github.com/Astraethos/once-webmcp/pull/7)
is open on `feat/m3-collaboration-domain`. Implementation revision
`db6c8ce737c6ff7b9f6247f494445ea784bc712d` passed
[GitHub CI](https://github.com/Astraethos/once-webmcp/actions/runs/33698218104)
and Vercel deployment checks.

The [M3 preview](https://once-webmcp-git-feat-m3-collaboratio-8c53b0-rizzle-technologies.vercel.app/)
loaded over HTTPS in Chrome, reported all 10 native registrations, and had no
warning/error console entries. Its workspace was left empty for the native
ChatGPT Work checkpoint. No production deployment was promoted manually.

## Deployed integration checkpoint

Pending. The exact first prompt from [Demo](DEMO.md) has not been successfully
executed through native ChatGPT Work for M3. The user authorized M3 implementation
because M2 invocation is blocked by external admin-policy verification. Codex's
Chrome connector still has no native WebMCP invocation interface.

Local HUMAN browser actions and unit-test AGENT calls are reported separately.
No simulated agent browser events or fallback global functions were introduced.
M3 must not be described as fully accepted until the required deployed run passes
or the user explicitly changes that release gate.
