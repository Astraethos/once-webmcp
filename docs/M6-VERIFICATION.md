# M6 technical verification

> **Document status:** Technical verification record; final submission remains pending
> **Describes:** Competition hardening and freeze preparation
> **Baseline:** Clean `main` / `origin/main` at `bc785103a3791e4ff5d3ae44a78a16b3d401915f`
> **Verification dates:** 2026-09-02–03 (America/Denver)

M6 preserves the deterministic Vendor Evaluation domain and all ten native tools.
The final video, Devpost submission, tag, and freeze need separate completion and
explicit freeze authorization. No submission tag is created by this milestone.

## Verified baseline and supplemental checks

Vercel production `dpl_5vp2RNksA1LWRLTNGEfQXjncHhf2` was READY on the baseline
`main` SHA and served https://once-webmcp.vercel.app/ anonymously over HTTPS.
GitHub reports a public repository, default branch `main`, and a detected MIT license.

Native production tools in the Codex in-app browser performed collaboration,
human policy/correction, Teach, fresh replay, six evidence/score pairs, automatic
approval pause, both policy rejection codes, human rejection, and terminal
`INVALID_REPLAY_STATE`. Reload preserved the taught routine and rejected replay.
Captured warnings/errors were empty. This supplemental rejection check is not
counted as one of the two completion dry runs.

Chrome 152.0.7977.76 reported **Native WebMCP registered · 10 tools**. The Chrome connector
exposes no native invocation capability. Codex's in-app browser discovered and
invoked the real production tools; no simulated agent events or injected handlers
were used.

## ChatGPT Work retry limitation

Historical Work invocation failed with “The admin-enforced policy could not be
verified.” Historical Site Tools discovery evidence remains in
[M2 verification](M2-VERIFICATION.md); [M3](M3-VERIFICATION.md) and
[M5](M5-VERIFICATION.md) retain their release exceptions.

The M6 retry inspected available browser/app surfaces. Attempting to access the
ChatGPT app returned: `Computer Use is not allowed to use the app
'com.openai.codex' for safety reasons.` No Work invocation could be attempted
through that unavailable surface. This is the current tooling result, not a new
observation of the historical Work policy error. Work remains unverified; native
Codex browser invocation does not establish Work invocation success.

## Narrow polish

- Fixed the trace viewport at 220px to prevent growth shifting the routine and
  to bring Teach closer to the workspace. History remains scrollable.
- Added an explicit visible focus outline for the keyboard-scrollable trace.
- Placed the existing Teach form above explanatory copy without changing its
  command, consent, preconditions, or classification behavior.
- Added supported-browser guidance to the unavailable-WebMCP notice.
- Replaced stale README milestone claims with the implemented loop and judge steps.

## Two consecutive final dry runs

Both runs used the deployed M6 preview at
https://once-webmcp-5wkwik4qc-rizzle-technologies.vercel.app/ on
`a208a760aca83953e3e8f811a58dda960e720b02`. This revision contains all M6 product
changes. Subsequent verification-record edits do not change application behavior.
These were actual page-discovered WebMCP calls from Codex's in-app browser and
human controls, not ChatGPT Work prompt execution or a scripted state injection.

| Check | Run 1 | Run 2 |
| --- | --- | --- |
| Confirmed Reset / empty seed | Passed | Passed; storage key absent and snapshot 0 |
| $24,000 / Aegis Cloud / BeaconStack | Passed | Passed |
| Three criteria, six dossier evidence cells and six scores | Passed | Passed |
| Uncertainty and initial recommendation | Passed | Passed |
| HUMAN required policy, approval policy and evidence correction | Passed | Passed |
| Teach classification | Passed; evidence and score corrections example-only | Passed; evidence correction example-only |
| New $18,000 / Northwind AI / Orchid Systems inputs | Passed | Passed |
| Learned Security required at priority 1 and approval preserved | Passed | Passed |
| Empty replay outputs, then six fresh evidence/score cells | Passed | Passed |
| Automatic ONCE approval pause | Passed | Passed |
| Eligible pre-approval recommendation rejected | `APPROVAL_REQUIRED` | `APPROVAL_REQUIRED` |
| Human UI approval then native recommendation | Passed | Passed |
| Automatic completion | `complete` / `completed`, no next actions | `complete` / `completed`, no next actions |
| No contamination / workspace repair | Passed | Passed |
| Captured console warnings/errors | Empty | Empty |

Run 1 additionally moved Security priority to 2 and back to 1, corrected a human
score, and verified `REQUIRED_CRITERION_FAILED` for Orchid. A recommendation before
any scores also returned that eligibility error, correctly taking precedence over
approval. Reload at the gate retained pending approval and focused
`approval-heading`. Reload after completion retained the complete run. Cancelling
Reset preserved the run before the confirmed Reset that began Run 2. Run 2 also
reloaded the learned routine before starting replay.

The native browser confirmation helper stalled on the first Reset. Subsequent
checks used browser pointer input and `Page.handleJavaScriptDialog` to accept or
cancel the actual dialog. No confirmation override, state mutation, or application
repair was used. Native tool handles fetched before registration finished were
refreshed after the visible registration indicator; there were no duplicate-tool
errors. These are connector handling details, not recorded demo timing evidence.

## Display and accessibility

- Inspected 1440×900 recording, 1100×900 compact desktop, default 1280×720, and
  390×844 mobile layouts. Page width matched viewport width; no overlapping rail
  content or clipped controls were observed. The mobile matrix scrolls inside its
  region (571px content in a 320px region).
- At 1440×900, the Teach button is fully visible at page y=838–877 even with a
  populated trace. Trace height remains 220px as activity grows.
- At 1100×900 the automatic gate focused its heading and displayed the full
  approval banner and both actions. Mobile controls remained keyboard reachable.
- Human required/priority changes, correction, Teach, Start replay, Approve, and
  Reject were exercised through semantic controls; key actions used Enter.
- Labels, table headers, landmarks, actor text labels, native confirmation,
  heading focus, and visible focus styles were reviewed. This was a focused
  accessibility pass, not an exhaustive assistive-technology certification.
- Routine sections visibly separate variables, policies, procedures, the human
  gate, generated values, and example-only notes. The detailed routine and matrix
  use normal scrolling; no browser zoom is required. No decorative timing or
  animation is required for the flow. No starter assets remain in tracked files.

## Automated verification and release checks

- `pnpm test`: **215 tests across seven files**, all passed. This includes all
  prior milestone tests and exact descriptions/schemas compared with WEBMCP.md.
- `pnpm lint`: passed with zero warnings.
- `pnpm typecheck`: passed.
- `pnpm build`: passed.
- `pnpm check`: passed, including the production build.
- `git diff --check`: passed.
- Initial package builds hit the known Turbopack CSS-worker port sandbox
  restriction. A permitted direct Next.js build succeeded; subsequent explicit
  package build and check commands passed. No build configuration changed.
- [PR #10](https://github.com/Astraethos/once-webmcp/pull/10) uses the scoped branch
  `codex/m6-demo-submission`. Its first
  [CI run](https://github.com/Astraethos/once-webmcp/actions/runs/33718693141) and
  Vercel preview passed. Final revision and post-merge CI/deployment checks are
  reported on that PR and in the M6 handoff after they complete.
- Vercel project settings show **No Environment Variables Added** across
  Production, Preview, and Development. Application source requires no variables.
- Runtime dependencies, semantic core, compiler, replay engine, fixtures, and
  native tool contracts are unchanged by M6.

## Submission status

README describes the shipped loop, native architecture, browser requirements,
local setup, MIT license, and Work limitation. Submission notes contain factual
technical input and explicit placeholders for the video and Devpost owner.
Official challenge/rules pages were rechecked during M6; the September 3 deadline
and publicly visible, under-three-minute YouTube requirement remain as documented.

Technical verification is distinct from final submission completion. Remaining
human work is the final video, Devpost materials/submission, a separate Work
retry if useful and available, and explicit authorization for the final tag/freeze.
No tag or repository freeze has been created or declared.
