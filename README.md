# ONCE

Teach an agent by working with it once.

ONCE is an open-source Vendor Evaluation experiment for the OpenAI WebMCP Challenge.
The **M4 collaboration and Teach experience** is implemented: human controls and native
WebMCP handlers share one synchronous command bus, comparison matrix, and
actor-tagged trace. Budget, criteria, evidence, scores, uncertainty, policy, and
an initial recommendation persist in this browser. Vendor dossiers are fixed,
fictional first-party facts.
Human-only **Teach this routine** compiles Vendor Evaluation semantics into a
persisted routine. Replay and approval execution are not implemented.
M3 is accepted under an explicit external-client release exception. Deployed
ChatGPT Work invocation remains externally blocked and unverified; it must be
retried during M6 before final submission. See the
[M3 verification record](docs/M3-VERIFICATION.md) for the exception and evidence.
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

Open http://localhost:3000. Set a budget, add candidates and criteria, then use
the comparison cells to attach evidence and score each vendor. Look for HUMAN
trace events. Refresh to restore the workspace. **Reset demo** asks for confirmation,
then clears the workspace, trace, learned routine, and saved snapshot for this origin.
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
React subscribes through `useSyncExternalStore`; browser restoration and storage
warnings use server snapshots to keep initial hydration consistent.

## Native WebMCP collaboration

[Native registration](src/webmcp/register-tools.ts) calls
`document.modelContext.registerTool(tool, { signal })` directly. One
`AbortController` owns registration cleanup; failed partial registration aborts
the complete set. There is no wrapper, legacy API fallback, or simulated agent.

[Tool definitions](src/webmcp/tool-definitions.ts) expose the exact
[approved contracts](docs/WEBMCP.md):

- Reads: `get_workspace`, `get_vendor_dossier`, and inactive `get_replay_plan`.
- Mutations: `set_budget`, `add_candidates`, `add_criteria`, `attach_evidence`,
  `set_scores`, `flag_uncertainty`, and `set_recommendation`.

Bulk tools submit atomic command batches and retain one event per item.
Unknown dossier names return explicit `VENDOR_NOT_FOUND` entries.
The [human UI adapter](src/core/store/ui-commands.ts) uses the same bus. Human
controls also change criterion priority/required status, replace evidence, and
save approval policy. Tool inputs cannot override actor, channel, or generated
IDs. Reset, policy correction, evidence replacement, and lifecycle actions are
not exposed as tools.

If WebMCP is unavailable or registration fails, the page shows a notice and the
human UI remains usable. Registration success alone does not prove agent discovery
or invocation. The Memory Rail shows semantic classifications in the trace above
the Routine panel. On narrow screens, it sits below the workspace; the comparison
matrix scrolls horizontally.

Replay and approval lifecycle commands remain `NOT_IMPLEMENTED` until M5.
Approval policy is preserved by Teach, but no approval workflow executes. Required-criterion recommendation eligibility is validated
in the core using the approved score threshold of 3.

## Teach a Vendor Evaluation routine

After collaborating, name the routine and click **Teach this routine** in the
Memory Rail. Teach requires a valid budget, 2–4 candidates, at least one criterion,
and at least one observed evidence, scoring, uncertainty, or recommendation action.
It does not require every procedure or a completed matrix. Incomplete collaboration
returns `TEACHING_INCOMPLETE`; malformed inputs retain `INVALID_PAYLOAD`.

The panel separates variable inputs, fixed criterion/approval policies, observed
procedures, the human checkpoint, generated outputs, and **Example only — not
generalized** corrections. Candidate × criterion actions become loops. Evidence,
scores, rationales, and recommendation values are excluded from the routine.
One-off human evidence and score corrections produce notes, never new policies.

Teach records human consent through the command bus, saves the approved `Routine`
model in `once:v1:state`, and enters read-only routine review. Refresh restores the
routine; Reset clears it. No WebMCP tool can teach. The compiler is deterministic
for a fixed source and supplied identity/time metadata. See
[Architecture](docs/ARCHITECTURE.md#deterministic-routine-compiler) for the rules and
[M4 verification](docs/M4-VERIFICATION.md) for actual test and browser evidence.

## Documentation standards

The README is the entry point for current implementation status and local setup.
For maintained repository documentation, follow the
[Clear Technical Documentation Standard](docs/standards/clear-technical-documentation-standard.md).
For final squash-merge records, follow the
[GitHub Merge Extended Description Standard](docs/standards/github-merge-extended-description-standard.md).
The merge standard controls merge formatting, not PR review context.
Agent guidance is in [AGENTS.md](AGENTS.md).

## License

ONCE is licensed under the [MIT License](LICENSE).

## Follow-ups

- Retry native ChatGPT Work invocation during M6 before final submission.
  The M3 release exception does not constitute a successful native invocation.
- M5 will implement replay with new inputs and human approval.
- ESLint is pinned to 9.39.5 because the template's React/import/accessibility
  plugins do not yet support ESLint 10. ESLint 9 is deprecated upstream; upgrade
  the plugin set and ESLint together when compatible releases are available.
