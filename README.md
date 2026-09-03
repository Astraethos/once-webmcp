# ONCE

**Teach an agent by working with it once.**

ONCE turns a shared Vendor Evaluation into a reusable routine. Work with an
agent, correct its evaluation, teach what mattered, then replay with new vendors
and a new budget. The routine preserves your policies and pauses for human
approval before the final recommendation.

[Live demo](https://once-webmcp.vercel.app/) ·
[Demo walkthrough and exact prompts](docs/DEMO.md) ·
[M6 verification](docs/M6-VERIFICATION.md)

Built for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/).
The final demo video and Devpost submission are pending; technical verification
is recorded separately from submission completion.

## Why ONCE

People repeatedly tell agents which inputs change, which requirements stay fixed,
and when to ask for approval. ONCE gives that collaboration a shared semantic
history that can become a procedure. WebMCP provides named application actions
such as attaching evidence and setting scores. The routine is compiled from
those domain actions, not click or DOM recordings.

## Try the complete loop

Use a WebMCP-capable browser and agent. The app should report
**Native WebMCP registered · 10 tools**. Registration confirms browser capability;
a successful tool call confirms agent invocation.

1. Open the [live demo](https://once-webmcp.vercel.app/) and select **Reset demo**.
2. Ask the agent: “In ONCE, evaluate Aegis Cloud and BeaconStack for a $24,000
   annual budget. Use Security, Integration, and Cost as criteria in that priority
   order. Read the ONCE vendor dossiers, attach evidence, and score each candidate
   for every criterion using 1=does not meet, 2=materially below, 3=meets, 4=strong,
   5=excellent. Flag any meaningful uncertainty and set an initial recommendation.”
3. Make Security **Required**, keep priority 1, save the approval policy, and
   correct BeaconStack's security evidence to emphasize its Enterprise SSO add-on.
4. Select **Teach this routine**. Review variable inputs, fixed policies, repeated
   procedures, generated outputs, and **Example only — not generalized** corrections.
5. Open **Replay with new inputs**. Start with Northwind AI, Orchid Systems, and
   an $18,000 budget. Learned criteria and approval policy are already present;
   evidence, scores, uncertainty, and recommendation start empty.
6. Ask the agent: “Run the active ONCE routine with the new inputs. Use the replay
   plan and ONCE vendor dossiers. Complete the required evidence and scores, then
   follow the routine through its approval boundary.”
7. Review the paused evaluation and select **Approve**. The agent can then
   recommend an eligible candidate, completing the replay. **Reject** ends the run
   without a recommendation.

HUMAN, AGENT, and ONCE labels identify who acted. Refresh restores the workspace,
trace, routine, and replay. Reset asks for confirmation and removes the saved
snapshot for this browser origin.

## How it works

```text
Human UI --------\
                  → Semantic Command Bus → State → Semantic Trace → Routine
WebMCP Agent ----/                                                   ↓
                                                   New inputs → Replay
                                                                  ↓
                                                      Human approval → Complete
```

[Native registration](src/webmcp/register-tools.ts) calls
`document.modelContext.registerTool(...)` directly, with `AbortController`
cleanup. There is no WebMCP wrapper. The
[tool handlers](src/webmcp/tool-definitions.ts) and
[human UI adapter](src/core/store/ui-commands.ts) use the same
[synchronous command bus](src/core/store/once-store.ts).

The bus validates each command, applies state changes, and records actor, channel,
phase, outcome, and a readable summary. Bulk tools are atomic and retain one
semantic event per item. Business-policy rejections return structured errors
without changing workspace data.

The [deterministic compiler](src/core/teaching/compiler.ts) turns budget and
candidates into variables, preserves criterion and approval policies, and compiles
observed procedures. Literal evidence, scores, recommendations, and one-off
corrections do not become durable rules. The
[replay engine](src/core/replay/replay-engine.ts) enforces that routine with fresh
inputs and outputs.

Only human UI can teach, start replay, approve, reject, or reset. Agent identity
is assigned internally. Required criteria need a score of at least 3; failing
candidates return `REQUIRED_CRITERION_FAILED`. Eligible recommendations before
approval return `APPROVAL_REQUIRED`.

## Scope and browser requirements

This competition MVP is a **deterministic Vendor Evaluation** domain. It does not
claim arbitrary workflow learning. The four vendor dossiers contain fictional,
first-party facts, not live vendor research. ONCE has no authentication, database,
backend service, or embedded LLM. State persists locally in `once:v1:state`.

The challenge supports ChatGPT's in-app browser, or Chrome 149+ with
`chrome://flags/#enable-webmcp-testing` enabled and the browser restarted.
An agent client must also support native tool invocation. Unsupported browsers
retain the human workspace and show capability guidance.

**Known ChatGPT Work limitation:** historical Work invocation failed with
“The admin-enforced policy could not be verified.” M6 verified real native calls
on production in the Codex in-app browser. A separate Work retry could not be
performed because this session's computer-use tool denies access to the ChatGPT
app surface. Work invocation remains unverified. See the
[M6 evidence and limitations](docs/M6-VERIFICATION.md).

## Run locally

Use Node.js **24.20.0** (`.nvmrc`) and pnpm **11.24.0** (`packageManager`).

```sh
git clone https://github.com/Astraethos/once-webmcp.git
cd once-webmcp
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). No environment variables, API keys,
or paid services are required. Installation creates local dependency files;
`pnpm dev` serves the app on your machine.

```sh
pnpm test
pnpm check
```

The deterministic Vitest suite covers the semantic core, native tool contracts,
compiler, replay, rendering, and persistence. `pnpm check` runs lint with zero
warnings, TypeScript checks, and the production build. GitHub Actions runs both
commands for pull requests and pushes to `main`.

To inspect the production build locally, run `pnpm build`, then `pnpm start`.
Invalid or incompatible saved snapshots fall back to the empty demo seed.

## Documentation

- [Product scope](docs/PRODUCT.md), [Architecture](docs/ARCHITECTURE.md), and
  [all ten WebMCP contracts](docs/WEBMCP.md): approved implementation references.
- [Acceptance](docs/ACCEPTANCE.md) and [Implementation](docs/IMPLEMENTATION.md):
  verification gates and milestone sequence.
- [Demo](docs/DEMO.md) and [Submission](docs/SUBMISSION.md): recording journey,
  factual submission material, and remaining human tasks.
- [M6 verification](docs/M6-VERIFICATION.md): current technical evidence; earlier
  milestone records remain historical evidence for their tested revisions.
- [AGENTS.md](AGENTS.md) and [documentation standard](docs/standards/clear-technical-documentation-standard.md): contribution boundaries.

## License

[MIT](LICENSE).
