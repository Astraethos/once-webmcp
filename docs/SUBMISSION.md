# ONCE WebMCP Challenge Submission Plan

> **Document status:** Maintained submission checklist
> **Research verification date:** 2026-09-02
> **Describes:** Current challenge requirements plus ONCE submission strategy
> **Update when:** Official requirements or verified submission status changes
> **Authoritative sources:** OpenAI challenge page and Devpost official rules

## Technical handoff for final creative materials

M1–M5 behavior is implemented. M6 prepares technical verification and repository
materials; it does not authorize the final submission tag or declare a freeze.
See [M6 verification](M6-VERIFICATION.md) for tested revisions and limitations.

| Field | Factual value / owner |
| --- | --- |
| Project | ONCE — Teach an agent by working with it once. |
| Live URL | https://once-webmcp.vercel.app/ |
| Public repository | https://github.com/Astraethos/once-webmcp |
| License | MIT; GitHub detection verified during M6 |
| Implemented loop | Collaborate → Teach → Replay with new inputs → Human approval → Complete |
| Domain | Deterministic Vendor Evaluation; four fictional first-party dossiers |
| Agent integration | Ten native WebMCP tools, shared semantic command bus |
| Runtime | Next.js 16.3.4, React 19.2.8, TypeScript; browser-local persistence |
| Application services | No login, database, external research, API keys, or embedded LLM |
| Technical evidence | Native production invocation in Codex's in-app browser; separate Work invocation remains unverified |
| Video URL | https://youtu.be/jTEuvUEGfok |
| Final description | Pending — supplied by the Demo Strategy and Storyboard owner |
| Devpost project URL / submission | Pending — supplied by the submission owner |
| Final tag / freeze | Await explicit user authorization after video, Devpost, and deployed site are final |

Human UI and WebMCP actions enter the same semantic command bus. The trace
records actor, channel, phase, outcome, and readable actions. Teach converts budget
and candidates into variables, preserves criterion and approval policies, and
compiles observed procedures. Evidence, scores, recommendation text, and one-off
corrections are excluded from durable rules. Replay restores policies with new
inputs, creates fresh outputs, and blocks recommendation until human approval.
Only the human UI can teach, start replay, approve, reject, and reset.

This paragraph is factual technical input for the separate creative workflow;
it is not final video narration or a completed Devpost submission.

**Work limitation:** the historical result was “The admin-enforced policy could
not be verified.” During M6, the available computer-use tool denied access to the
ChatGPT app surface, so no new Work invocation result could be obtained. Native
production calls in the Codex in-app browser are separate evidence. Do not label
Site Tools discovery or registration alone as successful Work invocation.

## Current challenge facts

Verified on 2026-09-02.

### Deadline

Submission deadline:

**September 4, 2026 at 1:00 AM Pacific Time**

Authoritative rule page:

```text
https://webmcp.devpost.com/rules
```

Challenge overview:

```text
https://openai.com/webmcp-challenge/
```

### Required project

Build a WebMCP-powered web app where humans and agents can interact, collaborate, or create together.

### Required live access

Provide a working live URL judges can access using:

- ChatGPT's in-app browser; or
- Google Chrome 149+ with WebMCP enabled.

### Required public repository

Provide a public Git repository containing:

- source code;
- assets/instructions necessary to run;
- visible open-source license;
- direct WebMCP implementation.

ONCE already uses a public MIT-licensed repository. Final verification must confirm GitHub still detects the license visibly.

### Required description

Submission text must explain:

- why the use case is a strong fit for WebMCP;
- how it creates a better user experience;
- what humans and agents can do together that was difficult or impossible before;
- how WebMCP was implemented.

### Required video

Provide a public YouTube demo video that:

- is less than 3 minutes;
- clearly demonstrates the working project;
- includes audio explaining what was built and how WebMCP is used;
- avoids unlicensed copyrighted music/material.

Judges are not required to watch beyond three minutes.

## Official judging criteria

Devpost official rules list four equally weighted Stage Two criteria:

1. **WebMCP Leverage**
2. **Execution**
3. **Potential Impact**
4. **Creativity & Ambition**

The OpenAI challenge page also emphasizes the quality of the human-agent experience as part of the challenge intent.

For ONCE, treat human-agent experience as a design priority that strengthens WebMCP leverage and execution, but do not misstate it as a fifth equally weighted Devpost criterion unless the official rules change.

## ONCE rubric mapping

### WebMCP Leverage

Must visibly prove:

- native `document.modelContext.registerTool(...)`;
- multiple non-trivial semantic tools;
- agent reads and mutates live application state;
- WebMCP and human UI share the same command bus;
- learned replay depends on the WebMCP execution path.

README should link to:

```text
src/webmcp/register-tools.ts
src/webmcp/tool-definitions.ts
src/core/domain/
```

### Execution

Must show a complete coherent loop:

```text
Collaborate
→ Teach
→ Replay
→ Approval
→ Complete
```

Required reliability:

- deterministic reset;
- deterministic fixture dossiers;
- refresh recovery;
- clear errors;
- no required login;
- no paid API dependency.

### Potential Impact

Submission positioning:

People already teach agents by repeatedly correcting and directing them. ONCE explores a path from transient collaboration to reusable procedural memory while preserving human approval.

Do not claim broad enterprise automation from this MVP.

Use vendor evaluation as the concrete demonstration of a wider interaction pattern.

### Creativity & Ambition

Novelty claim:

The application does not record UI gestures. It compiles a shared human-agent semantic trace into a parameterized routine and enforces a learned human approval boundary during replay.

The ambition is conceptual, while implementation remains deliberately constrained.

## Final README requirements

The competition README now describes the implemented loop. Before final submission, add the real video link and verify these requirements:

### Top section

- ONCE name;
- one-line thesis;
- live demo link;
- <3 minute video link;
- challenge statement.

### What it demonstrates

Short explanation of:

- shared human/agent workspace;
- semantic trace;
- Teach;
- replay;
- approval.

### Try it

Exact judge steps:

1. open live URL in ChatGPT in-app browser;
2. Reset demo;
3. use prompt from `docs/DEMO.md`;
4. make human changes;
5. Teach;
6. Replay;
7. use replay prompt;
8. Approve.

### WebMCP implementation

State clearly:

- native imperative API;
- no wrapper;
- shared command bus;
- human-only approval.

Link exact source files.

### Architecture

Small diagram or short flow:

```text
Human UI ----\
              > Command Bus → State + Trace → Routine → Replay
WebMCP ------/
```

### Scope boundary

State:

> Competition MVP: deterministic Vendor Evaluation domain. ONCE does not claim arbitrary workflow learning.

### Local development

Preserve current verified Node/pnpm setup and `pnpm check`.

Add `pnpm test`.

### License

MIT.

## Deployment requirements

### Vercel

Vercel is connected to the public repository and deploys `main` automatically.

Before final submission verify:

- production deployment uses final `main`;
- HTTPS works;
- no auth;
- no required env vars;
- judge can reach URL anonymously;
- ChatGPT in-app browser can discover tools.

### Deployment freeze

Create a final stable production deployment and avoid experimental post-submission changes.

The Devpost resource FAQ warns entrants not to modify the submitted project/repo/live site after the deadline during judging.

Conservative action:

1. merge final submission PR;
2. wait for CI and Vercel success;
3. perform final live verification;
4. after the user confirms the final video, Devpost materials, and deployed site, obtain explicit authorization to create Git tag `submission-2026-09-04`;
5. submit exact live URL and repo;
6. after deadline, do not modify submitted repo/live deployment until judging ends unless official organizers authorize a correction.

If continued development is desired, use a separate fork/branch that does not alter the submitted live revision.

## Video production checklist

Before recording:

- clean browser window;
- notifications disabled;
- Reset demo;
- ChatGPT in-app browser already on deployed URL;
- exact prompts copied somewhere safe;
- memory rail visible;
- normal 100% browser zoom; verify the recording viewport and readable trace;
- no personal account details visible.

Record:

- one continuous authentic product flow where practical;
- narration;
- WebMCP interaction;
- Teach panel;
- approval pause;
- final completion;
- very brief source reveal.

Edit only for pacing/clarity. Do not edit around a failed policy enforcement.

Final export:

- < 3:00;
- target 2:40–2:55;
- clear audio;
- readable 1080p or better;
- publicly visible on YouTube, as required by the official rules;
- no copyrighted background music.

## Suggested submission description structure

### One-line pitch

> ONCE turns one human-agent collaboration into a reusable semantic routine that can run on new inputs while preserving learned human approval boundaries.

### Short description

ONCE explores reusable procedural memory for agents. Human and agent actions share one semantic history through WebMCP; ONCE deterministically separates changing inputs, fixed policies, repeatable procedures, regenerated outputs, and one-off corrections, then replays the learned routine on new inputs. The competition MVP deliberately limits this idea to Vendor Evaluation and does not claim arbitrary workflow learning.

### Problem

Agents often require repeated human direction. Macros record clicks and chat captures prose, but neither produces a reliable shared procedural model.

### Why WebMCP

WebMCP gives the agent semantic application actions. ONCE routes human actions through the same semantic command model, making the collaboration itself structured enough to compile.

### What the demo proves

- agent and human actions share one trace;
- candidate/budget values become variables;
- criteria and approval become policy;
- one-off corrections are explicitly not generalized;
- replay operates on new candidates;
- final recommendation is blocked until human approval.

### Implementation

Native `document.modelContext.registerTool(...)` tools call the same TypeScript command bus as React UI actions. State, trace, routine, and replay are client-side and persisted locally. No external LLM or backend is used by ONCE.

### Claim boundary

The competition MVP uses a deterministic Vendor Evaluation compiler. It demonstrates the interaction model without pretending to solve arbitrary workflow induction.

## Final freeze checklist

### Repository

- [ ] `main` clean
- [ ] CI green
- [ ] `pnpm test` passes
- [ ] `pnpm check` passes
- [ ] MIT license visible
- [ ] README is competition-ready
- [ ] no secrets
- [ ] native WebMCP source easy to find
- [ ] docs match implemented behavior
- [ ] submission tag created

### Live app

- [ ] production URL anonymous
- [ ] Reset demo works
- [ ] ChatGPT in-app browser discovers tools
- [ ] Chrome 149+ check completed if available
- [ ] full collaboration works
- [ ] Teach works
- [ ] replay uses new inputs
- [ ] approval blocks early recommendation
- [ ] human approval resumes replay
- [ ] final recommendation completes
- [ ] refresh recovers state
- [ ] no visible console/runtime failure

### Video

- [ ] public YouTube link
- [ ] < 3 minutes
- [ ] audio present
- [ ] WebMCP use explained
- [ ] working product shown
- [ ] no unsupported claims
- [ ] no unlicensed copyrighted music

### Devpost

- [ ] live URL
- [ ] public repo URL
- [ ] YouTube URL
- [ ] text description
- [ ] WebMCP fit explained
- [ ] better human-agent UX explained
- [ ] implementation explained
- [ ] final submission saved before deadline

## Submission stopping condition

Once every required item above is verified, stop building.

Do not risk the stable core loop for additional features during the final submission window.
