# ONCE Architecture

> **Document status:** Approved direction
> **Describes:** Competition MVP architecture and semantic model
> **Implementation baseline:** Pre-implementation, 2026-09-02
> **Update when:** State, commands, compiler, replay, persistence, or module boundaries change

## Architecture verdict

ONCE should be a **client-side, event-recorded, deterministic domain application** with native WebMCP as a second input channel into the same semantic command bus used by the human UI.

No backend is required for the competition MVP.

## Decision summary

| Question | Decision |
|---|---|
| Application state | Client-side TypeScript store |
| State mutation | Only through semantic command bus |
| Human actor | Assigned internally by UI adapter |
| Agent actor | Assigned internally by WebMCP adapter |
| Event trace | Immutable semantic events, not developer telemetry |
| Persistence | Versioned `localStorage` snapshot |
| Routine compiler | Deterministic, Vendor Evaluation-specific |
| General workflow learning | Explicitly out of scope |
| Replay | Agent-driven WebMCP execution validated by ONCE |
| Human approval | Human UI only; never exposed as a tool |
| Demo research | Deterministic first-party vendor dossiers |
| External LLM in ONCE | None |
| WebMCP library | None |
| State library | None |
| Production backend | None |

## System model

```text
Human UI --------------------\
                              \
                               > Semantic Command Bus
                              /       |
Native WebMCP Tool Adapter --/        | validate
                                      | apply
                                      v
                                 Domain State
                                      |
                       +--------------+-------------+
                       |                            |
                       v                            v
                 Semantic Trace              Persistence
                       |
                       v
                Routine Compiler
                       |
                       v
                  Routine Model
                       |
                       v
                 Replay Engine
                       |
                +------+------+
                |             |
             running    awaiting approval
                              |
                         Human UI only
```

The UI and WebMCP adapter are input adapters. They do not own domain behavior.

## Client architecture

The application is a client-side Next.js App Router experience.

Server components may render static shell content, but the ONCE state system, persistence, WebMCP registration, and interactive workspace live in a client boundary.

There are no application API routes in the MVP.

## Proposed module boundaries

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css

  components/
    workspace/
      evaluation-workspace.tsx
      candidate-matrix.tsx
      criterion-row.tsx
      evidence-cell.tsx
    trace/
      collaboration-trace.tsx
      trace-event.tsx
    routine/
      routine-panel.tsx
      routine-step.tsx
    replay/
      replay-launcher.tsx
      replay-status.tsx
      approval-banner.tsx
    shell/
      once-app.tsx
      phase-header.tsx

  core/
    domain/
      types.ts
      commands.ts
      validate-command.ts
      apply-command.ts
      initial-state.ts
    events/
      types.ts
      summarize-event.ts
    store/
      once-store.ts
      once-provider.tsx
    persistence/
      local-storage.ts
    teaching/
      teaching-policy.ts
      compiler.ts
      routine-types.ts
    replay/
      replay-engine.ts
      replay-types.ts
    demo/
      vendor-dossiers.ts
      seed.ts

  webmcp/
    register-tools.ts
    tool-definitions.ts
    tool-results.ts

  types/
    webmcp.d.ts

tests/
  command-bus.test.ts
  compiler.test.ts
  replay.test.ts
  persistence.test.ts
```

Exact filenames can shift slightly if Next.js structure requires it, but these responsibilities must remain separate.

## Store design

Use a small custom synchronous external store and `useSyncExternalStore`.

Reason:

- WebMCP tool callbacks and UI controls require one shared imperative command entry point.
- A synchronous store avoids stale React closure problems when an agent calls multiple tools quickly.
- React becomes a subscriber to domain state rather than the owner of business logic.
- No state-management dependency is needed.

Conceptual interface:

```text
getState()
subscribe(listener)
execute(commandRequest)
executeBatch(commandRequests)
resetDemo()
```

`executeBatch(...)` evaluates a list against a temporary working state and commits the resulting state/events only if the whole batch is valid. WebMCP bulk tools use it so a malformed batch cannot partially mutate the workspace.

`resetDemo()` is an operational control, not a semantic command. It intentionally clears the session and trace.

## Actor and channel model

```text
ActorKind = human | agent | system
Channel   = ui | webmcp | system
```

Canonical actors:

```text
human:
  kind: human
  id: local-human
  label: Human

agent:
  kind: agent
  id: webmcp-agent
  label: Agent

system:
  kind: system
  id: once
  label: ONCE
```

Do not claim WebMCP provides a verified caller identity. The WebMCP adapter assigns `agent` because the call entered through the WebMCP tool surface.

Tool inputs must never accept `actor`, `actorId`, or `channel`.

## Phases

```text
collaboration
teaching
replay_setup
replay
complete
```

Events store the phase in which they occurred.

## Semantic command request

Every semantic mutation is requested as:

```ts
{
  id: string,
  type: CommandType,
  payload: CommandPayload,
  actor: Actor,
  channel: Channel,
  phase: Phase,
  causationId?: string,
  replayRunId?: string
}
```

The adapters assign actor, channel, phase, and IDs. Domain payloads contain only domain data.

## Exact semantic command types

### Domain commands

#### `SET_BUDGET`

Payload:

```text
amount: number >= 0
currency: "USD"
```

Teaching role: `amount` is a variable input.

#### `ADD_CANDIDATE`

Payload:

```text
candidateId: string
name: non-empty string
```

Teaching role: candidate identity is part of the variable `candidates[]` input.

#### `ADD_CRITERION`

Payload:

```text
criterionId: string
name: non-empty string
description?: string
priority: integer >= 1
required: boolean
```

Teaching role: criterion definition is invariant evaluation policy.

#### `SET_CRITERION_PRIORITY`

Payload:

```text
criterionId: string
priority: integer >= 1
```

Teaching role: invariant evaluation policy.

#### `SET_CRITERION_REQUIRED`

Payload:

```text
criterionId: string
required: boolean
```

Teaching role: invariant evaluation policy.

#### `ATTACH_EVIDENCE`

Payload:

```text
evidenceId: string
candidateId: string
criterionId: string
summary: non-empty string
sourceRef: non-empty string
confidence: "high" | "medium" | "low"
```

Teaching role: the action pattern is teachable; literal evidence values are generated outputs and are not copied into a routine.

#### `REPLACE_EVIDENCE`

Payload:

```text
evidenceId: string
summary: non-empty string
sourceRef: non-empty string
confidence: "high" | "medium" | "low"
reason?: string
```

Teaching role: example-only correction. The corrected workspace state is real, but the compiler does not infer a durable rule from the replacement text.

#### `SET_SCORE`

Payload:

```text
candidateId: string
criterionId: string
score: integer 1..5
rationale: non-empty string
```

Teaching role: scoring is a teachable action pattern; literal score and rationale are generated outputs.

A human score correction is recorded but does not turn the corrected number into an invariant.

#### `FLAG_UNCERTAINTY`

Payload:

```text
uncertaintyId: string
candidateId?: string
criterionId?: string
note: non-empty string
```

Teaching role: if observed, uncertainty checking becomes an optional agent procedure step. Literal note text is generated output.

#### `SET_APPROVAL_POLICY`

Payload:

```text
requiredBeforeRecommendation: boolean
```

Teaching role: durable approval policy.

This command is available from human UI only in the MVP.

#### `SET_RECOMMENDATION`

Payload:

```text
candidateId: string
rationale: non-empty string
```

Teaching role: final agent procedure step; literal candidate and rationale are generated outputs.

### Lifecycle commands

#### `TEACH_ROUTINE`

Actor: human only.

Payload:

```text
routineName: non-empty string
```

Effect: invokes deterministic compilation of the current collaboration trace and stores the routine. M4 enters `teaching` for routine review and retains the source workspace as read-only. The consent event records the source `collaboration` phase; no synthetic system event is needed. Reset returns to collaboration. Human-only replay with new inputs is implemented in M5.

M4 deterministic Vendor Evaluation precondition (approved clarification): teaching requires a valid budget, 2–4 candidates, at least one criterion, and at least one applied collaboration event for an approved procedure (`ATTACH_EVIDENCE`, `SET_SCORE`, `FLAG_UNCERTAINTY`, or `SET_RECOMMENDATION`). No complete evidence/score matrix or recommendation is required.

If a requirement is missing, return `TEACHING_INCOMPLETE` with:

> To teach, set a budget, add 2–4 candidates and at least one criterion, then collect evidence, score, flag uncertainty, or recommend.

Malformed input, including a blank routine name or structurally invalid payload, returns the existing `INVALID_PAYLOAD`. Standard actor/channel and phase validation still applies. An incomplete Teach adds an excluded rejection event and changes neither the workspace nor teaching state.

Never teachable. Never WebMCP-exposed.

#### `START_REPLAY`

Actor: human only.

Payload:

```text
routineId: string
budget: number >= 0
currency: "USD"
candidates: array of 2..4 { candidateId, name }
```

Effect:

- creates a fresh replay workspace;
- binds variable inputs;
- instantiates invariant criteria and approval policy from the routine;
- enters replay status `running`.

Never teachable. Never WebMCP-exposed.

#### `REQUEST_APPROVAL`

Actor: system only.

Payload:

```text
runId: string
gateId: string
message: string
```

Effect: sets replay status `awaiting_approval`.

Generated automatically by replay engine.

#### `RECORD_APPROVAL`

Actor: human only.

Payload:

```text
runId: string
gateId: string
decision: "approved" | "rejected"
```

Effect:

- `approved` -> replay returns to `running`;
- `rejected` -> replay enters `rejected`.

Never WebMCP-exposed.

#### `COMPLETE_REPLAY`

Actor: system only.

Payload:

```text
runId: string
```

Effect: replay status becomes `completed`.

Generated automatically when all post-approval requirements are satisfied.

## Command bus pipeline

For every command:

1. Read current state synchronously.
2. Validate actor/channel authorization.
3. Validate payload and referenced entity existence.
4. Validate phase and replay constraints.
5. If rejected:
   - do not mutate workspace;
   - append a rejected semantic event;
   - return a structured rejection result.
6. If applied:
   - create the next state;
   - append an applied semantic event;
   - run replay progression rules;
   - append any resulting system events;
   - persist the new snapshot;
   - notify subscribers;
   - return a structured success result.

No UI component or WebMCP callback may bypass this pipeline.

## Semantic event schema

```ts
type SemanticEvent = {
  schemaVersion: 1;
  eventId: string;
  sequence: number;
  timestamp: string;
  sessionId: string;
  replayRunId?: string;

  actor: {
    kind: "human" | "agent" | "system";
    id: string;
    label: string;
  };

  channel: "ui" | "webmcp" | "system";
  phase:
    | "collaboration"
    | "teaching"
    | "replay_setup"
    | "replay"
    | "complete";

  command: {
    id: string;
    type: CommandType;
    payload: unknown;
  };

  outcome: "applied" | "rejected";

  summary: string;

  teaching: {
    disposition:
      | "variable"
      | "policy"
      | "procedure"
      | "example_only"
      | "lifecycle"
      | "excluded";
    reason: string;
  };

  error?: {
    code: string;
    message: string;
  };
};
```

### Event invariants

- `sequence` is monotonic within a session.
- `timestamp` is display metadata only and never controls routine behavior.
- State is never rebuilt from natural-language `summary`.
- `summary` is generated from command type and resolved entity labels.
- Rejected events appear in the trace when they are meaningful to a user, especially approval blocks.
- Developer telemetry is not stored in the semantic trace.

## State shape

```ts
type AppState = {
  schemaVersion: 1;
  stateVersion: number;
  sessionId: string;
  phase: Phase;

  workspace: EvaluationWorkspace;
  trace: SemanticEvent[];

  teaching: {
    status: "idle" | "compiled";
    routine: Routine | null;
    compilerNotes: CompilerNote[];
  };

  replay: ReplayState | null;
};
```

### Evaluation workspace

```ts
type EvaluationWorkspace = {
  title: string;
  budget: {
    amount: number | null;
    currency: "USD";
  };

  candidates: Candidate[];
  criteria: Criterion[];
  evidence: Evidence[];
  scores: Score[];
  uncertainties: Uncertainty[];

  approvalPolicy: {
    requiredBeforeRecommendation: boolean;
  };

  recommendation: Recommendation | null;
};
```

### Candidate

```text
id
name
```

### Criterion

```text
id
name
description?
priority
required
```

Priority values must be unique after normalization. The lowest number is highest priority.

### Evidence

```text
id
candidateId
criterionId
summary
sourceRef
confidence
```

### Score

One current score per candidate/criterion pair:

```text
candidateId
criterionId
score: 1..5
rationale
```

Domain scoring semantics are fixed for the MVP:

```text
1 = does not meet
2 = materially below
3 = meets
4 = strong
5 = excellent
```

A criterion with `required: true` is a hard requirement. A candidate is recommendation-eligible only when its score is at least 3 on every required criterion. `SET_RECOMMENDATION` must reject an ineligible candidate with `REQUIRED_CRITERION_FAILED`.

### Uncertainty

```text
id
candidateId?
criterionId?
note
```

### Recommendation

```text
candidateId
rationale
```

## Persistence decision

Persist the complete semantic application snapshot in `localStorage`.

Key:

```text
once:v1:state
```

Persist:

- workspace;
- trace;
- compiled routine;
- replay state;
- schema/state versions.

Do not persist:

- React UI expansion state;
- selected tabs;
- active WebMCP registration controllers;
- transient error toasts.

On boot:

1. Read `once:v1:state`.
2. Parse and validate `schemaVersion`.
3. If invalid or incompatible, discard it and load deterministic demo seed state.
4. Re-register WebMCP tools against the new store instance.

Provide a visible **Reset demo** control. Reset clears the key and replaces state with the deterministic seed.

The reset action is intentionally operational rather than a semantic event because it destroys the prior session.

## What constitutes a teachable action

A command is teachable only if its command definition has an explicit teaching policy.

The compiler never guesses from natural language.

Teaching policies are declared centrally in `teaching-policy.ts`.

### Field roles

```text
variable
invariant
generated
structural
excluded
```

Examples:

| Command | Field | Role |
|---|---|---|
| SET_BUDGET | amount | variable |
| ADD_CANDIDATE | name/id | variable |
| ADD_CRITERION | definition | invariant |
| SET_CRITERION_PRIORITY | priority | invariant |
| SET_CRITERION_REQUIRED | required | invariant |
| ATTACH_EVIDENCE | candidate/criterion relation | structural |
| ATTACH_EVIDENCE | summary/source/confidence | generated |
| SET_SCORE | candidate/criterion relation | structural |
| SET_SCORE | score/rationale | generated |
| REPLACE_EVIDENCE | replacement content | excluded |
| FLAG_UNCERTAINTY | action presence | structural |
| FLAG_UNCERTAINTY | note | generated |
| SET_APPROVAL_POLICY | required flag | invariant |
| SET_RECOMMENDATION | action presence | structural |
| SET_RECOMMENDATION | candidate/rationale | generated |

## What must not become part of a routine

The compiler must exclude:

- event IDs;
- timestamps;
- actor IDs;
- UI ordering noise;
- source channel;
- literal candidate names from the taught session;
- literal budget from the taught session;
- evidence text;
- evidence source references;
- score values;
- score rationales;
- uncertainty notes;
- recommendation candidate;
- recommendation rationale;
- rejected commands;
- lifecycle commands;
- one-off evidence replacement text;
- one-off human score numbers.

The routine panel should disclose important exclusions instead of silently hiding them.

## Deterministic routine compiler

The compiler is a domain compiler, not a recorder.

It consumes:

- final collaboration workspace;
- applied collaboration events;
- teaching policy registry.

It produces a canonical Vendor Evaluation routine.

### Compilation rules

1. `budget` becomes required input `$budget`.
2. all collaboration candidates collapse into required input collection `$candidates`.
3. the final criterion list becomes fixed routine policy.
4. final criterion priority/required flags become fixed routine policy.
5. if evidence attachment occurred, compile an evidence-collection loop over every replay candidate × criterion.
6. if scoring occurred, compile a scoring loop over every replay candidate × criterion.
7. if uncertainty was flagged at least once, compile an optional uncertainty-check step.
8. if approval policy requires it and a recommendation procedure was observed, insert a human approval gate before final recommendation. Otherwise preserve the approval policy without inventing a recommendation or a dangling gate.
9. if a recommendation occurred, compile a final recommendation step.
10. human evidence replacements and manual score corrections produce compiler notes marked `example_only`; their literal values are not generalized.

### Why this is more than event sourcing

Event sourcing records what happened.

ONCE additionally:

- classifies semantic roles;
- parameterizes input entities;
- removes execution-specific generated values;
- converts repeated entity operations into quantified loops;
- carries forward policy;
- inserts an enforceable human gate;
- validates future agent actions against the resulting procedure.

The compiler is still intentionally narrow.

Compilation is pure and deterministic for the same source snapshot, routine name, and supplied identity/time metadata. The command bus supplies `id` and `createdAt`; these are metadata, not procedure inputs. Criterion and step identifiers are canonical and do not copy source entity/event IDs. Notes are deduplicated by correction type in a fixed order. Persistence validates a compiled snapshot by recompiling its retained source with the saved metadata and comparing the complete routine, so malformed routine fields or extra generated values are discarded with the snapshot.

During replay, the current workspace has replaced the source workspace. Snapshot
validation recovers the source from typed applied collaboration commands and
validates the saved replay transitions with the same pure command rules. It
compares the rebuilt workspace, routine, phase, and replay state with the saved
snapshot. This validation performs no live commands, writes, or tool calls and
never interprets natural-language summaries. A mismatched policy, progress,
approval decision, or lifecycle sequence falls back to the seed.

## Routine representation

```ts
type Routine = {
  schemaVersion: 1;
  id: string;
  name: string;
  domain: "vendor_evaluation";
  sourceSessionId: string;
  createdAt: string;

  inputs: [
    {
      key: "budget";
      type: "money";
      required: true;
    },
    {
      key: "candidates";
      type: "candidate_list";
      minItems: 2;
      maxItems: 4;
      required: true;
    }
  ];

  policies: {
    criteria: Array<{
      routineCriterionId: string;
      name: string;
      description?: string;
      priority: number;
      required: boolean;
    }>;
    approval: {
      requiredBeforeRecommendation: boolean;
    };
  };

  steps: RoutineStep[];

  compilerNotes: Array<{
    kind: "example_only" | "info";
    message: string;
  }>;
};
```

### Routine steps

Only these step kinds exist in the MVP:

```text
collect_evidence
score
check_uncertainty
approval
recommend
```

Step forms:

```ts
{
  id: string;
  kind: "collect_evidence";
  forEach: ["candidate", "criterion"];
  completion: "evidence_exists_for_every_candidate_criterion_pair";
}
```

```ts
{
  id: string;
  kind: "score";
  forEach: ["candidate", "criterion"];
  completion: "score_exists_for_every_candidate_criterion_pair";
}
```

```ts
{
  id: string;
  kind: "check_uncertainty";
  optional: true;
}
```

```ts
{
  id: string;
  kind: "approval";
  requiredActor: "human";
  before: "recommend";
}
```

```ts
{
  id: string;
  kind: "recommend";
  completion: "recommendation_exists";
}
```

The routine does not contain literal tool-call transcripts.

## Replay model

### M5 replay readiness (approved clarification)

Teach remains permissive: a compiled routine may be displayed even when it is
not independently replayable. Before `START_REPLAY` changes workspace or replay
state, reject with `REPLAY_ROUTINE_INCOMPLETE` when:

1. Scoring was learned without evidence collection. Message:
   “Replay can’t start because scoring was learned without evidence collection.”
2. Recommendation was learned, at least one criterion is required, and scoring
   was not learned. Message:
   “Replay can’t start because recommendation requires scoring to evaluate required criteria.”

Evaluate these checks in that order. The rejected semantic event is excluded
from teaching. Do not change Teach preconditions, inject missing procedures,
or execute unlearned prerequisite work. These are two Vendor Evaluation checks,
not a generic dependency solver.

### Agent-driven execution

A WebMCP website cannot directly order an external browser agent to call its tools.

Therefore ONCE replay works as a protocol:

1. Human starts replay and supplies new variable bindings.
2. ONCE instantiates policy and sets replay `running`.
3. Agent calls `get_replay_plan`.
4. ONCE returns routine steps, progress, constraints, and allowed next actions.
5. Agent calls normal ONCE WebMCP mutation tools.
6. Every call enters the semantic command bus.
7. Replay engine checks whether state now satisfies the active step.
8. ONCE advances step status deterministically.
9. When pre-approval requirements are satisfied, ONCE emits `REQUEST_APPROVAL`.
10. Agent sees replay status `awaiting_approval`.
11. Human approves through UI.
12. Agent may then set the recommendation.
13. ONCE emits `COMPLETE_REPLAY`.

This is the correct direction of control for WebMCP.

## Replay state

```ts
type ReplayState = {
  runId: string;
  routineId: string;
  status:
    | "running"
    | "awaiting_approval"
    | "rejected"
    | "completed"
    | "failed";

  bindings: {
    budget: {
      amount: number;
      currency: "USD";
    };
    candidates: Candidate[];
  };

  stepStatus: Array<{
    stepId: string;
    status: "pending" | "active" | "complete" | "skipped";
  }>;

  approval: {
    gateId: string | null;
    decision: "pending" | "approved" | "rejected" | null;
  };

  error?: {
    code: string;
    message: string;
  };
};
```

## Replay enforcement

During replay:

- budget/candidates are fixed after start;
- invariant criteria are fixed;
- a score requires evidence for the same candidate/criterion pair;
- a recommended candidate must satisfy every required criterion at score 3 or higher;
- agent may add evidence, scores, uncertainty, and final recommendation only as allowed by routine state;
- human workspace editing is locked except approval/rejection;
- `SET_RECOMMENDATION` is rejected before required approval;
- after rejection, agent mutation commands are rejected;
- completion occurs only when required steps are satisfied.

M5 starts replay from the `teaching` review phase and enters `replay` directly.
The input form is transient UI, not a second replay state machine. Reset is the
recovery path after a terminal run; no retry/remediation workflow is added.
Evidence and scores can be filled pair-by-pair before the gate, subject to the
evidence-before-score invariant. Optional uncertainty must be flagged before the
last required pre-approval output; otherwise its step is skipped. At the gate,
agent output edits are locked as well, preserving the exact workspace reviewed
by the human. After approval, only the learned recommendation can mutate it.
Routines without recommendation complete after their learned required work;
they do not invent a recommendation or an approval gate.

`RECORD_APPROVAL` both records the human decision and resumes or rejects the
run. Its HUMAN trace summary includes that result. There is no separate resume
command or synthetic ONCE resume event. `COMPLETE_REPLAY` enters application
phase `complete`; its event records the originating `replay` phase.

## Approval state machine

```text
running
   |
   | pre-approval steps complete
   v
awaiting_approval
   |                  |
approve              reject
   |                  |
   v                  v
running            rejected
   |
   | recommendation set
   v
completed
```

Expected business-policy blocks resolve with structured tool results rather than throwing:

```json
{
  "ok": false,
  "error": {
    "code": "APPROVAL_REQUIRED",
    "message": "Human approval is required before setting the final recommendation."
  },
  "replay": {
    "status": "awaiting_approval"
  }
}
```

The workspace is not mutated.

## Demo data strategy

ONCE supplies deterministic first-party vendor dossiers.

The agent supplies interpretation:

- it reads dossiers;
- chooses relevant facts;
- writes evidence summaries;
- scores;
- explains rationale;
- flags uncertainty;
- recommends.

ONCE does not pretend it performed internet research.

This separation gives repeatability while preserving genuine agent reasoning.

## Failure presentation

User-visible failures should appear in two places:

1. a concise inline banner/toast near the action;
2. a semantic trace event when the rejection is meaningful to the collaboration.

Examples:

- approval required;
- invalid replay phase;
- duplicate candidate;
- missing referenced criterion.

Do not expose stack traces in the UI.

Unexpected exceptions may be logged to console during development, but final UI shows a stable error message.

## Trace readability

Default trace item structure:

```text
[AGENT] Added candidate: Aegis Cloud
[AGENT] Attached evidence: Aegis Cloud → Security
[HUMAN] Made Security required
[HUMAN] Corrected evidence: BeaconStack → Security
[HUMAN] Taught routine: Vendor Security Review
[ONCE] Replay paused: human approval required
```

Payload JSON is available only behind an optional developer disclosure if implemented. It is not required for the competition MVP.

## Architectural invariants

1. All domain mutations go through the command bus.
2. UI and WebMCP never implement duplicate domain logic.
3. Actor identity comes from the trusted adapter, not payload.
4. Applied events correspond to actual state transitions.
5. Rejected commands cannot partially mutate state.
6. Teaching uses semantic policy, not natural-language inference.
7. Routine output never copies execution-specific generated values.
8. Replay policy is enforced in the command bus/replay engine, not only displayed.
9. Human approval cannot be invoked through WebMCP.
10. Demo data is deterministic.
11. The app remains usable without any external service except hosting.
12. Removing WebMCP removes the agent execution path and therefore breaks the product's collaboration/replay thesis.
