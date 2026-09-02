# M2 verification record

> **Document status:** Local verification evidence and pending integration gate
> **Baseline:** M2 shared human/WebMCP vertical slice, 2026-09-02
> **Update when:** The deployed ChatGPT Work checkpoint is performed
> **Authority:** [Acceptance](ACCEPTANCE.md) and [Implementation](IMPLEMENTATION.md)

## Status

M2 is implemented and verified locally. The mandatory deployed ChatGPT Work
checkpoint is **not yet verified**. Do not begin M3 until that checkpoint passes.
No deployment, Vercel connection, or account configuration was performed during
the local implementation.

## Automated verification

- `pnpm test`: 90 tests passed, including 63 semantic-core tests, 25 WebMCP
  adapter/registration tests, and 2 server-rendering regression tests.
- `pnpm lint`: passed with zero warnings.
- `pnpm typecheck`: passed.
- `pnpm check`: passed lint, route type generation, TypeScript, and production build.
- No M2 dependency additions.

The WebMCP tests use an isolated registration contract double. They prove shared
command-bus routing, internal agent identity, atomic candidate batches, structured
errors, current read snapshots, cancellation, cleanup, and partial-registration
failure handling. They do not prove native browser registration or agent discovery.
The rendering tests verify stable server markup with restored browser data and
unavailable storage; they are not a full browser hydration test harness.

## Local browser verification

Tested the production build with `pnpm start --port 3001` in local Chrome.

- Added Aegis Cloud through the actual form. The candidate and HUMAN trace event
  appeared immediately in the shared workspace.
- Reloaded the page. The candidate and trace persisted without duplicate events.
- Repeated the candidate name. The workspace retained one candidate, and the trace
  showed a rejected HUMAN action with an error in the form.
- Cancelled Reset demo. The candidate and trace remained.
- Confirmed Reset demo. The workspace, trace, and snapshot version returned to
  their empty seed values. Reload and a fresh tab retained the empty state.
- Inspected desktop, narrow desktop, and mobile layouts at 1440×900, 1100×900,
  and 390×844. No horizontal overflow was observed.
- Inspected the final production page and browser warning/error logs. No entries
  were reported.

The browser reported WebMCP unavailable. The page remained usable, but actual
native registration was not verified. The agent addition was exercised through
the unit-test handler, not a real browser agent invocation.

Browser automation retained a stale dialog record after native dismissal. Reset
cancellation, confirmation, and reload were therefore checked through Chrome's
native accessibility controls. A fresh browser tab confirmed the resulting state
and allowed the final console check.

## Required human checkpoint

Prerequisites: the M2 PR is merged to `main`, the user has Vercel/GitHub access,
and ChatGPT Work provides native WebMCP in its browser.

1. Connect this repository to Vercel and deploy the merged M2 revision. Use the
   Next.js project defaults. This app requires no environment variables or secrets.
2. Open the public HTTPS deployment in ChatGPT Work's browser. Confirm the page
   reports two native tools registered. This message alone is not discovery proof.
3. Confirm Reset demo to start a disposable test session. Add Aegis Cloud using
   the human form. Verify one candidate and one HUMAN trace event.
4. Have ChatGPT Work discover and invoke `get_workspace` with `{}`. Verify it sees
   Aegis Cloud and that the read creates no trace event or workspace change.
5. Have ChatGPT Work invoke `add_candidates` with
   `{"candidates":[{"name":"BeaconStack"}]}`. Verify both candidates are visible,
   with HUMAN and AGENT additions in the same trace.
6. Reload the deployed page. Verify both candidates and both events persist,
   without duplicated registration or activity.
7. Record the deployment URL, commit SHA, browser environment, tool discovery and
   invocation evidence, and result in this document before beginning M3.

If native registration, discovery, or invocation fails, preserve the error and
stop at M2. Do not substitute a browser console call, mock, wrapper, or simulated
agent button for the required native integration proof.

## Scope boundaries

Only `get_workspace` and `add_candidates` are exposed. Human reset is not a tool.
Full evaluation, teaching, replay, and human approval remain deferred. No approved
architecture decision changed during M2.
