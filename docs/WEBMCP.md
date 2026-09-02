# ONCE Native WebMCP Surface

> **Document status:** Approved direction
> **Describes:** Native WebMCP tools for the competition MVP
> **Implementation baseline:** Pre-implementation, 2026-09-02
> **Update when:** Tool names, schemas, state dependencies, or safety behavior changes

## Principle

ONCE uses native WebMCP directly:

```text
document.modelContext.registerTool(...)
```

Do not add a WebMCP wrapper library.

The WebMCP adapter is thin. Its job is to:

1. register tools;
2. validate browser capability;
3. assign the internal agent actor/channel;
4. translate tool inputs into semantic commands;
5. return structured command results.

Domain behavior stays in the semantic command bus.

## Registration lifecycle

Register tools in a client-side module after the ONCE store exists.

Use one `AbortController` for the registration lifecycle and pass its signal through the native registration options.

On cleanup, abort the controller so registrations are removed.

Do not depend on removed historical APIs such as `unregisterTool()`.

Do not dynamically register a different tool set for every replay state. Keep the tool surface stable and enforce phase rules in the command bus. This improves agent discovery reliability.

## Capability fallback

If `document.modelContext` is unavailable:

- the human UI remains usable;
- show a compact notice that WebMCP is unavailable in this browser;
- do not simulate agent calls;
- do not register fallback global functions.

The competition demo must be recorded/tested in a supported WebMCP browser.

## Tool actor

Every mutation tool internally executes commands as:

```text
actor.kind = agent
actor.id = webmcp-agent
actor.label = Agent
channel = webmcp
```

No input schema exposes actor identity.

## Common mutation result

Mutating tools return a serializable object.

Success:

```json
{
  "ok": true,
  "eventIds": ["..."],
  "summary": "Added 2 candidates.",
  "stateVersion": 14,
  "replay": {
    "status": "running",
    "next": "collect_evidence"
  }
}
```

Expected business rejection:

```json
{
  "ok": false,
  "error": {
    "code": "APPROVAL_REQUIRED",
    "message": "Human approval is required before setting the final recommendation."
  },
  "stateVersion": 14,
  "replay": {
    "status": "awaiting_approval"
  }
}
```

Expected business rejections should resolve to structured results so the agent can read the reason.

Unexpected programming failures may reject the tool execution.

## Exact tool surface

### 1. `get_workspace`

**Title:** Get workspace  
**Annotations:** `readOnlyHint: true`

**Description**

> Get the current ONCE vendor-evaluation workspace, including budget, candidates, criteria, evidence, scores, uncertainty, recommendation, phase, and replay status. Call this when you need the current shared state before deciding what to change.

**Input schema**

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

**Output**

```text
phase
budget
candidates
criteria ordered by priority
evidence
scores
uncertainties
approvalPolicy
recommendation
replay summary
stateVersion
```

The output is a current snapshot, not the semantic trace.

### 2. `get_vendor_dossier`

**Title:** Get vendor dossier  
**Annotations:** `readOnlyHint: true`, `untrustedContentHint: false`

**Description**

> Read ONCE's deterministic demo dossier facts for one or more named vendors. Use these first-party facts as evidence inputs for the competition demo. Do not claim the dossier is live web research.

**Input schema**

```json
{
  "type": "object",
  "properties": {
    "vendorNames": {
      "type": "array",
      "minItems": 1,
      "maxItems": 4,
      "items": {
        "type": "string",
        "minLength": 1
      }
    }
  },
  "required": ["vendorNames"],
  "additionalProperties": false
}
```

**Output**

For each matched vendor:

```text
name
facts[]:
  sourceRef
  category
  statement
```

Unknown names return a structured not-found entry rather than invented facts.

### 3. `get_replay_plan`

**Title:** Get replay plan  
**Annotations:** `readOnlyHint: true`

**Description**

> Get the active learned routine, its new input bindings, completed and pending steps, approval status, and the next allowed semantic work. Call this when the workspace is in replay mode.

**Input schema**

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

**Output**

```text
active: boolean
routine name
bindings
fixed criteria policy
step statuses
approval status
nextActions[]
completion requirements
```

If no replay is active, return `active: false` with an actionable message.

### 4. `set_budget`

**Title:** Set budget

**Description**

> Set the evaluation budget in the current collaboration workspace. In taught routines, budget becomes a variable input rather than a fixed policy. This action is not allowed after an active replay has started.

**Input schema**

```json
{
  "type": "object",
  "properties": {
    "amount": {
      "type": "number",
      "minimum": 0
    },
    "currency": {
      "type": "string",
      "enum": ["USD"]
    }
  },
  "required": ["amount", "currency"],
  "additionalProperties": false
}
```

**Semantic commands**

One `SET_BUDGET`.

### 5. `add_candidates`

**Title:** Add candidates

**Description**

> Add one or more vendor candidates to the current collaboration workspace. Candidate identities become variable inputs when a routine is taught. Do not use this tool to change candidates after replay has started.

**Input schema**

```json
{
  "type": "object",
  "properties": {
    "candidates": {
      "type": "array",
      "minItems": 1,
      "maxItems": 4,
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": ["name"],
        "additionalProperties": false
      }
    }
  },
  "required": ["candidates"],
  "additionalProperties": false
}
```

**Semantic commands**

Dispatch one `ADD_CANDIDATE` per item with an internally generated candidate ID.

The tool is atomic at the adapter level: validate all names before dispatching any command. Do not partially add a malformed batch.

### 6. `add_criteria`

**Title:** Add criteria

**Description**

> Add one or more evaluation criteria with priority and required status. Criteria are treated as reusable evaluation policy when a routine is taught.

**Input schema**

```json
{
  "type": "object",
  "properties": {
    "criteria": {
      "type": "array",
      "minItems": 1,
      "maxItems": 6,
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "description": {
            "type": "string"
          },
          "priority": {
            "type": "integer",
            "minimum": 1
          },
          "required": {
            "type": "boolean"
          }
        },
        "required": ["name", "priority", "required"],
        "additionalProperties": false
      }
    }
  },
  "required": ["criteria"],
  "additionalProperties": false
}
```

**Semantic commands**

One `ADD_CRITERION` per item with an internally generated criterion ID.

Normalize conflicting priorities deterministically after validation.

### 7. `attach_evidence`

**Title:** Attach evidence

**Description**

> Attach evidence summaries to candidate/criterion pairs using source references from the ONCE demo dossiers. During replay, evidence is required for every candidate/criterion pair before scoring can complete. Evidence text is execution output and is not copied literally into a learned routine.

**Input schema**

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "minItems": 1,
      "maxItems": 12,
      "items": {
        "type": "object",
        "properties": {
          "candidateId": {
            "type": "string",
            "minLength": 1
          },
          "criterionId": {
            "type": "string",
            "minLength": 1
          },
          "summary": {
            "type": "string",
            "minLength": 1
          },
          "sourceRef": {
            "type": "string",
            "minLength": 1
          },
          "confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"]
          }
        },
        "required": [
          "candidateId",
          "criterionId",
          "summary",
          "sourceRef",
          "confidence"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": ["items"],
  "additionalProperties": false
}
```

**Semantic commands**

One `ATTACH_EVIDENCE` per item with an internal evidence ID.

Validate all entity references before dispatching any item.

### 8. `set_scores`

**Title:** Set scores

**Description**

> Score one or more candidate/criterion pairs from 1 to 5 with a rationale. Use 1=does not meet, 2=materially below, 3=meets, 4=strong, 5=excellent. During replay, use current evidence and routine policy. A replay score requires evidence for the same pair. Score values are generated per run and are not copied from the taught session.

**Input schema**

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "minItems": 1,
      "maxItems": 12,
      "items": {
        "type": "object",
        "properties": {
          "candidateId": {
            "type": "string",
            "minLength": 1
          },
          "criterionId": {
            "type": "string",
            "minLength": 1
          },
          "score": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5
          },
          "rationale": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "candidateId",
          "criterionId",
          "score",
          "rationale"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": ["items"],
  "additionalProperties": false
}
```

**Semantic commands**

One `SET_SCORE` per item.

Validate the complete batch before dispatch.

### 9. `flag_uncertainty`

**Title:** Flag uncertainty

**Description**

> Record an uncertainty that should remain visible to the human. Use this when the available evidence does not justify a confident conclusion. The literal uncertainty note is not copied into a routine.

**Input schema**

```json
{
  "type": "object",
  "properties": {
    "candidateId": {
      "type": "string",
      "minLength": 1
    },
    "criterionId": {
      "type": "string",
      "minLength": 1
    },
    "note": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": ["note"],
  "additionalProperties": false
}
```

**Semantic commands**

One `FLAG_UNCERTAINTY` with internally generated ID.

At least one of candidate or criterion may be omitted for evaluation-level uncertainty.

### 10. `set_recommendation`

**Title:** Set recommendation

**Description**

> Set the current final recommended candidate and rationale. In replay mode, this tool is blocked until every required pre-recommendation step is complete and any required human approval has been explicitly granted.

**Input schema**

```json
{
  "type": "object",
  "properties": {
    "candidateId": {
      "type": "string",
      "minLength": 1
    },
    "rationale": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": ["candidateId", "rationale"],
  "additionalProperties": false
}
```

**Semantic commands**

One `SET_RECOMMENDATION`.

**Replay safety**

Before recommendation, validate required criteria and approval:

- if the candidate has any required-criterion score below 3, append a rejected event, leave recommendation unchanged, and return `REQUIRED_CRITERION_FAILED`;
- if approval is required and not approved, append a rejected event, leave recommendation unchanged, and return `APPROVAL_REQUIRED`;
- if replay status is rejected or completed, return a state error without mutation.

## Functionality intentionally not exposed through WebMCP

### `TEACH_ROUTINE`

Reason: teaching is an explicit human consent moment. An agent must not decide that a collaboration should become durable procedural memory.

### `START_REPLAY`

Reason: the human chooses the routine and new variable bindings.

### `SET_CRITERION_PRIORITY` / `SET_CRITERION_REQUIRED`

Reason: agent-created criteria may establish the initial policy, but the competition teaching story makes policy correction a human action. Keeping post-creation policy editing human-only also reduces the WebMCP surface.

### `SET_APPROVAL_POLICY`

Reason: the human defines whether a final recommendation requires approval.

### `RECORD_APPROVAL`

Reason: approval is the human-control boundary. Exposing it to the agent would invalidate the thesis.

### `RESET_DEMO`

Reason: reset is an operational destructive action for deterministic demo recovery.

### `REPLACE_EVIDENCE`

Reason: the competition story uses evidence correction as a human teaching signal. Keeping correction human-only makes the actor distinction legible and avoids the agent rewriting its own evidence history during the demo.

## Shared command routing

Human UI:

```text
UI control
  -> command adapter assigns human/ui
  -> commandBus.execute(...)
  -> state + semantic event
```

WebMCP:

```text
registerTool execute callback
  -> WebMCP adapter assigns agent/webmcp
  -> commandBus.execute(...)
  -> state + semantic event
```

There is no separate WebMCP business implementation.

## Tool-output safety

Tool descriptions and outputs must be factual and narrow.

The first-party demo dossiers contain only fixed challenge data. Do not embed instructions to the agent inside dossier facts.

If the product later ingests external or user-generated material, re-evaluate `untrustedContentHint` and prompt-injection boundaries before exposing it.

## Source-code discoverability

Keep the native registration easy for judges to find.

Recommended source path:

```text
src/webmcp/register-tools.ts
```

The README should link directly to this file in the final submission documentation.

Do not hide the native API call behind generated code.
