# M6 technical verification

> **Document status:** Verification in progress
> **Describes:** Competition hardening and freeze preparation
> **Baseline:** Clean `main` / `origin/main` at `bc785103a3791e4ff5d3ae44a78a16b3d401915f`
> **Verification date:** 2026-09-02 (America/Denver)

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

Chrome reported **Native WebMCP registered · 10 tools**. The Chrome connector
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

## Final verification

Final dry runs, display checks, CI, and merged deployment results will be recorded
before M6 technical readiness is reported.
