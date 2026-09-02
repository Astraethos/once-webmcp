# ONCE Acceptance Criteria

> **Document status:** Approved verification plan
> **Describes:** Milestone acceptance and required tests
> **Implementation baseline:** Pre-implementation, 2026-09-02
> **Update when:** Milestones or required behavior change

## Global definition of done

A milestone is not complete until:

1. required automated tests pass;
2. `pnpm check` passes;
3. required browser behavior is manually verified;
4. no known architecture invariant is violated;
5. documentation affected by the milestone is updated;
6. the PR diff is limited to the milestone objective.

## Test command

Add:

```sh
pnpm test
```

Use Vitest for pure TypeScript domain tests.

Keep browser verification manual for the competition MVP. Do not add Playwright unless a later verified blocker justifies it.

## M1 — Semantic core

### Functional acceptance

- Initial state can be created deterministically.
- `SET_BUDGET` updates budget.
- `ADD_CANDIDATE` adds a candidate.
- `ADD_CRITERION` adds a criterion.
- evidence and score commands reference real entities.
- invalid entity references are rejected without partial state mutation.
- event sequence increases monotonically.
- event summaries are readable domain statements.

### Actor acceptance

Run the same valid domain command once as human/UI and once as agent/WebMCP adapter input.

Verify:

- both use the same command bus;
- both reach the same reducer/application logic;
- resulting domain mutation semantics are identical;
- only actor/channel metadata differs.

### Rejection acceptance

A rejected command:

- does not mutate workspace;
- produces a structured rejection;
- can produce a rejected semantic event;
- does not increment data entities unexpectedly.

### Persistence acceptance

- valid snapshot round-trips through serialization;
- incompatible schema version falls back to seed;
- reset clears persisted state.

### Automated tests

At minimum:

```text
command-bus.test.ts
persistence.test.ts
```

## M2 — Shared human/WebMCP vertical slice

### Human UI acceptance

- user can add a candidate through UI;
- trace immediately shows a HUMAN event;
- refresh restores state.

### Native WebMCP acceptance

- source contains direct `document.modelContext.registerTool(...)`;
- no WebMCP wrapper dependency exists;
- tool registration uses `AbortController` cleanup;
- tool inputs cannot set actor/channel;
- `get_workspace` is read-only;
- `add_candidates` reaches the semantic command bus.

### Shared-path proof

From a fresh demo state:

1. add one candidate through UI;
2. add one different candidate through WebMCP;
3. confirm both appear in workspace;
4. confirm both appear in the same trace format with different actor labels.

This is the core vertical-slice gate. Do not proceed if it fails.

### Vercel acceptance

After M2 merges:

- connect the repository to Vercel;
- deploy `main`;
- obtain public HTTPS URL;
- verify the deployed page loads without secrets or environment variables;
- verify WebMCP tools are discoverable in ChatGPT's in-app browser;
- verify at least one mutation tool works end to end.

## M3 — Complete collaboration domain

### Workspace acceptance

From reset, the user/agent can establish:

- budget;
- 2 candidates;
- 3 criteria;
- criterion priority;
- required criterion;
- evidence matrix;
- score matrix;
- uncertainty;
- recommendation.

### Human correction acceptance

Human UI can:

- change criterion required status;
- change criterion priority;
- replace evidence;
- change a score;
- enable approval-before-recommendation.

Every action appears as HUMAN in the semantic trace.

### Bulk tool acceptance

For agent batch tools:

- validate the entire batch first;
- malformed batch produces zero partial domain mutations;
- successful batch creates one granular semantic event per item.

### Dossier acceptance

- only defined fixture vendor names return facts;
- unknown names return explicit not-found results;
- no tool invents external research.

### Browser acceptance

Run the exact first collaboration prompt from `DEMO.md` on the deployed app.

Verify the live workspace changes through WebMCP.

## M4 — Teaching compiler

### Compiler acceptance

Given the demo collaboration:

Routine inputs contain:

```text
budget
candidates
```

Routine policy contains final:

```text
Security / Integration / Cost
priority
required status
approval policy
```

Routine procedure contains observed action classes:

```text
collect_evidence
score
optional check_uncertainty
recommend
```

Approval step is inserted before recommend when required.

### Generalization acceptance

The compiled routine must not contain:

- Aegis Cloud;
- BeaconStack;
- `$24,000` as a fixed policy value;
- literal evidence text;
- literal score values/rationales;
- literal recommendation;
- human evidence-replacement text.

Candidate names and budget may appear only in source-trace/context metadata, never as replay instructions.

### Example-only acceptance

If a human replaces evidence or changes a score:

- routine panel shows an example-only/compiler note;
- literal correction is not converted to policy;
- compiler output remains deterministic.

### Teach consent acceptance

Only human UI can issue `TEACH_ROUTINE`.

No WebMCP tool can teach a routine.

### Automated tests

At minimum:

```text
compiler.test.ts
```

Use fixed trace fixtures and exact structural assertions.

## M5 — Replay and approval

### Replay setup acceptance

Starting replay:

- accepts new budget and candidate names;
- creates fresh workspace outputs;
- instantiates taught criteria/policy;
- contains no old evidence, scores, uncertainty, or recommendation;
- sets replay status running.

### Replay plan acceptance

`get_replay_plan` reports:

- active routine;
- variable bindings;
- fixed policy;
- current step;
- completion criteria;
- approval state;
- allowed next actions.

### Progress acceptance

For a 2-candidate × 3-criterion routine:

- evidence step completes only after 6 candidate/criterion evidence records exist;
- score step completes only after 6 scores exist;
- missing cells keep the relevant step incomplete;
- a score cannot be applied before evidence exists for that pair.

### Approval acceptance

When pre-approval requirements are complete:

- ONCE emits `REQUEST_APPROVAL`;
- replay enters `awaiting_approval`;
- UI shows human review banner.

Before approval:

- recommendation of a candidate that fails a required criterion returns `REQUIRED_CRITERION_FAILED`;
- otherwise, `set_recommendation` returns `APPROVAL_REQUIRED`;
- recommendation remains null;
- rejected event appears in trace.

Only UI can issue `RECORD_APPROVAL`.

After approval:

- replay returns to running;
- `set_recommendation` succeeds;
- ONCE emits `COMPLETE_REPLAY`;
- status becomes completed.

After rejection:

- status becomes rejected;
- further agent mutations are blocked.

### Automated tests

At minimum:

```text
replay.test.ts
```

Include tests for:

- matrix completeness;
- approval block;
- approval resume;
- rejection terminal state;
- new inputs replacing old inputs.

## M6 — Demo hardening and submission

### Demo acceptance

Record at least two full dry runs from Reset.

Both must successfully show:

1. live WebMCP collaboration;
2. human trace actions;
3. teaching output;
4. replay with new inputs;
5. approval pause;
6. approval;
7. completion.

### Timing acceptance

Final edited video:

- is less than 3:00;
- target 2:40–2:55;
- includes audible explanation of WebMCP use;
- shows the working product.

### Browser verification matrix

#### ChatGPT in-app browser

Required:

- live Vercel URL loads;
- tools discovered;
- read tool works;
- mutation tool works;
- first prompt works;
- replay prompt works;
- approval works;
- refresh does not create duplicate tool registration failure.

#### Chrome 149+ with WebMCP testing enabled

Required if available:

- page loads;
- WebMCP capability indicator is active;
- at least one read and one mutation tool execute.

### Display verification

Verify at minimum:

- desktop 1440×900;
- compact desktop/in-app width around 1100px;
- no horizontal overflow;
- trace and routine remain readable;
- approval banner is visible without needing to inspect developer tools.

### Console verification

On final live build:

- no uncaught exceptions during a full demo;
- no duplicate WebMCP registration error after refresh/navigation;
- no hydration warning that affects visible UI.

### Repository verification

Run:

```sh
pnpm test
pnpm check
```

Record actual results in the final PR/submission notes.

### Submission verification

Use `docs/SUBMISSION.md`.

Do not call the project complete until the live URL, public repository, README, video, and Devpost fields are all verified.
