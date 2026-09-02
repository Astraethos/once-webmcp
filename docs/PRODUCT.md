# ONCE Product Specification

> **Document status:** Approved direction
> **Describes:** Competition MVP product scope
> **Implementation baseline:** Pre-implementation, 2026-09-02
> **Update when:** Product scope, terminology, or demo thesis changes

## Product thesis

**ONCE turns a human-agent collaboration into reusable procedural memory.**

A human and an agent perform a task together inside the same WebMCP-enabled application. Both sides act through semantic operations. ONCE records the collaboration as a readable semantic trace, extracts the parts that are safe to generalize, and compiles a constrained reusable routine.

The memorable product sentence is:

> Do a task with your agent once. Review what mattered. Teach the routine. Run it again with new inputs.

## Problem

Agents can complete individual tasks, but humans often repeat the same guidance:

- what inputs change each time;
- which rules remain fixed;
- which evidence matters;
- which corrections were one-off;
- where human judgment is mandatory.

UI macros capture clicks. Chat history captures prose. Neither is a reliable representation of a reusable procedure.

WebMCP creates a stronger substrate because agent actions can be expressed as semantic website operations. ONCE tests whether human actions expressed through the same semantic model can become a useful procedural trace.

## Competition MVP

The MVP supports one domain only:

**Vendor Evaluation**

A user and agent can:

- set an evaluation budget;
- add candidate vendors;
- define evaluation criteria;
- prioritize criteria;
- mark criteria required;
- treat a required criterion as a hard eligibility requirement in the 1–5 scoring model;
- attach evidence;
- score candidate/criterion pairs;
- flag uncertainty;
- correct evidence or scores;
- require human approval before a final recommendation;
- create a final recommendation.

The user can then select **Teach this routine**.

ONCE deterministically compiles the collaboration into:

- **Inputs** — values that should change on the next run;
- **Policies** — evaluation rules that should remain fixed;
- **Agent procedure** — semantic work patterns that should repeat;
- **Example-only corrections** — observed edits that ONCE refuses to generalize;
- **Approval gate** — a point at which replay must stop for a human.

The routine can be replayed with new candidate names and a new budget.

## Claim boundary

ONCE does **not** claim to learn arbitrary workflows from arbitrary behavior.

The competition MVP is a domain-specific semantic routine compiler. It knows the semantic roles of Vendor Evaluation commands and can safely generalize those roles.

Examples:

- Candidate names are known input entities, so they become variables.
- Budget is a known input value, so it becomes a variable.
- Criteria and required/priority settings are evaluation policy, so they become invariants.
- Evidence text and score values are execution outputs, so their literal values are not preserved.
- A one-off manual score correction is evidence of human judgment, not enough evidence for a new general rule.

This limitation is part of the product's credibility.

## Primary workflow

### 1. Collaborate

The agent discovers ONCE WebMCP tools and acts on the live workspace.

The user can edit the same workspace through normal controls.

### 2. Record

Every meaningful mutation enters the same semantic command system and produces a readable event with an actor:

- Human
- Agent
- ONCE

### 3. Teach

The user explicitly selects **Teach this routine**.

ONCE compiles the trace using deterministic domain rules and displays exactly what it learned and what it refused to learn.

### 4. Replay

The user starts a new run with new candidate names and budget.

The learned evaluation policy is instantiated automatically.

The agent reads the active replay plan through WebMCP and performs the required semantic work.

### 5. Approve

Replay stops before the final recommendation when the compiled approval gate is reached.

Only a human UI action can approve or reject.

### 6. Complete

After approval, the agent can set the final recommendation and the run completes.

## Primary audience

The demonstrated audience is a person who repeatedly evaluates structured choices with an agent and wants prior collaboration to become reusable guidance without surrendering human control.

The competition demo uses vendor selection because the input/policy/evidence/decision distinction is easy to understand quickly.

## Explicit non-goals

The MVP does not include:

- arbitrary workflow recording;
- browser click recording;
- DOM replay;
- RPA or macro automation;
- external workflow integrations;
- authentication or accounts;
- multi-user collaboration;
- cloud persistence;
- a database;
- server-side orchestration;
- an embedded chatbot;
- an embedded LLM;
- external OpenAI API calls;
- live web research performed by ONCE;
- a generic MCP client;
- a WebMCP wrapper library;
- routine editing as a full workflow-builder UI;
- scheduling;
- branching workflow logic beyond the approval gate;
- automatic learning from every human correction;
- autonomous human-approval bypass.

## Terminology

**Workspace**  
The current vendor evaluation state shown in the UI.

**Semantic command**  
A typed intent that requests one meaningful domain mutation.

**Semantic event**  
The immutable record of an applied or rejected command.

**Actor**  
`human`, `agent`, or `system`.

**Channel**  
How a command entered ONCE: `ui`, `webmcp`, or `system`.

**Trace**  
The human-readable ordered list of semantic events.

**Routine**  
A compiled, domain-specific reusable procedure derived from a collaboration trace.

**Variable**  
An input whose literal value is expected to change between runs.

**Invariant / policy**  
A rule intentionally carried into future runs.

**Generated output**  
A value that must be produced again during replay rather than copied literally.

**Example-only correction**  
A human correction ONCE records but does not generalize into a durable rule.

**Approval gate**  
A replay boundary that requires an explicit human decision.

**Replay**  
Execution of a compiled routine with new variable bindings.

## UX principles

1. **Show the shared work.** The workspace is the primary product, not a chat transcript.
2. **Make actors obvious.** Human, Agent, and ONCE events are visually distinct and text-labeled.
3. **Show semantics, not telemetry.** The trace says what happened in domain language.
4. **Expose learning boundaries.** The routine panel shows both learned and excluded information.
5. **Human control is visible.** Approval is a first-class state, not a hidden confirmation.
6. **Prefer deterministic clarity over breadth.** The demo must work repeatedly.
7. **Do not decorate uncertainty away.** If ONCE did not learn a rule, say so.

## UX structure

Use a two-region desktop layout rather than three equal columns.

### Main workspace — approximately 62%

Contains:

- evaluation header and budget;
- candidate comparison matrix;
- evidence and score controls;
- criterion policy controls;
- phase status;
- replay approval banner when required.

### Memory rail — approximately 38%

Stack vertically:

1. **Collaboration Trace** — actor-tagged semantic events.
2. **Routine** — before teaching, a clear empty state; after teaching, inputs, policies, procedure, excluded corrections, and approval gate.

This layout remains legible inside ChatGPT's in-app browser, where a three-column application can become too compressed.

On narrow screens, stack the workspace above the memory rail.

## Competition success test

A judge should understand these points without reading source code:

1. The agent acts through native WebMCP.
2. The human and agent produce the same kind of semantic events.
3. ONCE distinguishes variable inputs from durable policy.
4. ONCE refuses to overgeneralize one-off corrections.
5. A learned routine is visibly reused with different inputs.
6. Replay stops at a real human approval boundary.
7. The final result continues only after approval.

If the demo communicates those seven points, the MVP proves the thesis.
