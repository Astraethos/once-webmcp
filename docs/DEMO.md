# ONCE Competition Demo

> **Document status:** Approved demo plan
> **Describes:** Exact under-three-minute competition scenario
> **Implementation baseline:** Final M6 production implementation, 2026-09-03
> **Update when:** Demo data, timing, prompts, or visual sequence changes

## Demo objective

In less than three minutes, demonstrate one complete loop:

```text
COLLABORATE
→ SEMANTIC TRACE
→ TEACH
→ REPLAY WITH NEW INPUTS
→ HUMAN APPROVAL
→ COMPLETE
```

The memorable moment is not vendor comparison itself.

The memorable moment is:

> The human and agent created one semantic history, ONCE turned it into a routine, and the routine stopped for the human at exactly the learned boundary.

## Deterministic demo data

All vendor facts are fictional first-party challenge fixtures.

Do not present them as real companies or current internet research.

### Taught-session vendors

#### Aegis Cloud

```text
aegis-security
Category: Security
Statement: SOC 2 Type II. SAML SSO is included in the standard plan.

aegis-integration
Category: Integration
Statement: REST API, webhooks, and SCIM provisioning are included.

aegis-cost
Category: Cost
Statement: Annual software price for the demo configuration is $22,000.

aegis-implementation
Category: Implementation
Statement: Standard implementation estimate is four weeks.
```

#### BeaconStack

```text
beacon-security
Category: Security
Statement: SOC 2 Type II. SAML SSO requires the Enterprise add-on.

beacon-integration
Category: Integration
Statement: REST API and webhooks are supported. SCIM is not included.

beacon-cost
Category: Cost
Statement: Base annual price is $18,000. Enterprise SSO add-on is $4,000.

beacon-implementation
Category: Implementation
Statement: Standard implementation estimate is three weeks.
```

### Replay vendors

#### Northwind AI

```text
northwind-security
Category: Security
Statement: SOC 2 Type II. SAML SSO and SCIM are included.

northwind-integration
Category: Integration
Statement: REST API and webhooks are included. One legacy connector requires a custom adapter.

northwind-cost
Category: Cost
Statement: Annual software price for the demo configuration is $16,000.

northwind-implementation
Category: Implementation
Statement: Standard implementation estimate is five weeks.
```

#### Orchid Systems

```text
orchid-security
Category: Security
Statement: ISO 27001 certification is documented. SOC 2 Type II is not listed in the demo dossier.

orchid-integration
Category: Integration
Statement: REST API and webhooks are included. SCIM provisioning is supported.

orchid-cost
Category: Cost
Statement: Annual software price for the demo configuration is $14,000.

orchid-implementation
Category: Implementation
Statement: Standard implementation estimate is three weeks.
```

## Initial workspace

After **Reset demo**:

- phase: collaboration;
- no budget;
- no candidates;
- no criteria;
- no evidence;
- no scores;
- no recommendation;
- approval policy disabled;
- trace contains only a compact ONCE ready state if needed.

## Exact first prompt to a WebMCP-capable agent

Production native invocation was verified in Codex's in-app browser; separate ChatGPT Work invocation remains unverified.

Use a short command-oriented prompt:

> In ONCE, evaluate Aegis Cloud and BeaconStack for a $24,000 annual budget. Use Security, Integration, and Cost as criteria in that priority order. Read the ONCE vendor dossiers, attach evidence, and score each candidate for every criterion using 1=does not meet, 2=materially below, 3=meets, 4=strong, 5=excellent. Flag any meaningful uncertainty and set an initial recommendation.

Expected agent behavior:

1. `set_budget`
2. `add_candidates`
3. `add_criteria`
4. `get_vendor_dossier`
5. `attach_evidence`
6. `set_scores`
7. optional `flag_uncertainty`
8. `set_recommendation`

Bulk tools keep the interaction short while the trace still records granular semantic events.

## Human teaching actions

After the agent finishes:

1. Ensure **Security** is required and remains priority 1.
2. Keep Security at priority 1.
3. Enable **Require human approval before final recommendation**.
4. Correct BeaconStack security evidence so the visible summary explicitly says SAML SSO requires the Enterprise add-on.
5. Optionally adjust one score if the agent's initial interpretation warrants it.

Expected trace:

```text
HUMAN  Made Security required
HUMAN  Required approval before final recommendation
HUMAN  Corrected evidence: BeaconStack → Security
```

The correction is deliberately important:

- it proves the human uses the same semantic event stream;
- the compiler later labels the correction **Example only — not generalized**.

## Teach moment

Click **Teach this routine**.

Suggested routine name:

```text
Vendor Security Review
```

Expected routine panel:

### Inputs

```text
Budget
Candidates
```

### Fixed policy

```text
1. Security — REQUIRED
2. Integration
3. Cost
```

### Agent procedure

```text
For each candidate × criterion:
  collect evidence
  score 1–5

Check uncertainty
```

### Human gate

```text
Before final recommendation
```

### Not generalized

```text
Manual evidence correction
Any literal score correction
```

The panel should visually distinguish:

- variable;
- fixed;
- agent work;
- human gate;
- example only.

Do not show raw compiler JSON in the primary view.

## Replay setup

Click **Replay with new inputs**.

Bindings:

```text
Budget: $18,000
Candidates:
- Northwind AI
- Orchid Systems
```

The replay workspace is fresh.

Expected invariant state immediately after start:

- Security / Integration / Cost criteria already exist;
- Security remains required and priority 1;
- approval policy is active;
- no old candidate names, evidence, scores, or recommendation are copied.

## Exact replay prompt to a WebMCP-capable agent

> Run the active ONCE routine with the new inputs. Use the replay plan and ONCE vendor dossiers. Complete the required evidence and scores, then follow the routine through its approval boundary.

Expected agent behavior:

1. `get_replay_plan`
2. `get_workspace`
3. `get_vendor_dossier`
4. `attach_evidence`
5. optional `flag_uncertainty` before the final required output
6. `set_scores`
7. `get_replay_plan`

After evidence and scores are complete, ONCE automatically emits:

```text
ONCE  Replay paused: human approval required
```

The workspace displays a prominent approval banner.

## Approval moment

The agent should not be able to complete the recommendation before approval.

If it tries `set_recommendation`, expected result:

```text
APPROVAL_REQUIRED
```

and the trace shows a rejected semantic event.

Human clicks **Approve**.

Expected trace:

```text
HUMAN  Approved final recommendation · replay resumed
```

Approval and resume are one `RECORD_APPROVAL` transition. The exact semantic
command surface has no separate system resume command.

Work then calls `set_recommendation`.

Expected final trace:

```text
AGENT  Recommended Northwind AI
ONCE   Replay complete
```

The specific recommendation may vary with the agent's reasoning. The demo does not depend on a specific winner; it depends on the approval boundary and new-input execution.

## Video timing

Target finished video length: **2:40–2:55**.

### 0:00–0:15 — Thesis

Narration:

> ONCE asks whether working with an agent once can become reusable procedural memory. Human and agent actions enter the same semantic system through WebMCP.

Show empty ONCE workspace.

### 0:15–0:50 — Agent collaboration

Give the first prompt.

Show:

- WebMCP-driven workspace changes;
- agent-tagged trace events;
- comparison matrix filling.

Do not narrate every tool call.

### 0:50–1:10 — Human collaboration

Make Security required, enable approval, and correct evidence.

Narration:

> My changes enter the same semantic trace, but ONCE does not assume every correction is a general rule.

### 1:10–1:30 — Teach

Click **Teach this routine**.

Pause long enough to show:

- variables;
- policy;
- procedure;
- approval gate;
- example-only correction.

Narration:

> ONCE is not recording clicks. It compiles domain semantics: these inputs change, these policies persist, these actions repeat, and this correction is only an example.

### 1:30–2:20 — Replay

Start replay with Northwind AI, Orchid Systems, and $18,000.

Give the replay prompt.

Show policy already present and new agent events filling the workspace.

### 2:20–2:40 — Approval

Show **Human review required**.

If practical, show the agent's blocked/paused state.

Click Approve.

### 2:40–2:52 — Complete

Agent sets final recommendation.

Show **Replay complete**.

### 2:52–2:58 — Technical reveal

Cut briefly to source:

```text
src/webmcp/register-tools.ts
```

Show native:

```text
document.modelContext.registerTool(...)
```

Then show command routing or semantic event type for one second.

Narration:

> The WebMCP tools and human UI both route into the same command bus.

End.

## Expected visual hierarchy

Top phase header:

```text
Collaborate → Teach → Replay → Approve → Complete
```

Active phase highlighted.

Main workspace:

- candidates as columns;
- criteria as ordered rows;
- compact evidence summary;
- score badge;
- required marker.

Memory rail:

- trace on top;
- routine on bottom.

Actor labels must use text, not color alone:

```text
HUMAN
AGENT
ONCE
```

Approval state uses a full-width banner inside the workspace.

## Demo reliability strategy

### Deterministic facts

Use only the built-in dossiers.

Do not depend on web search, current vendor pages, rate limits, or third-party APIs.

### Deterministic reset

The **Reset demo** button restores the exact initial state and clears the localStorage snapshot.

### Stable tools

Keep the same WebMCP tools registered throughout the session. Enforce phase rules internally.

### Batch agent operations

Bulk candidate, criterion, evidence, and score inputs reduce tool-call latency while retaining granular semantic events.

### No animation dependency

Use short CSS transitions only. The demo must not wait for decorative animation.

### Keep initial criteria to three

Security, Integration, and Cost are enough to demonstrate policy and scoring without producing a slow trace.

## Failure fallback strategy

### Agent does not discover tools

1. Confirm the app is opened inside ChatGPT's in-app browser or supported Chrome.
2. Reload the deployed page.
3. Confirm the WebMCP-available indicator.
4. Re-run the exact short prompt.

Do not use simulated agent events.

### Agent becomes verbose instead of acting

Use:

> Use the ONCE WebMCP tools now. Do not explain each step in chat; perform the evaluation in the workspace.

### Agent attempts recommendation before replay approval

Do not treat this as a demo failure.

The structured `APPROVAL_REQUIRED` rejection demonstrates the approval boundary.

### Agent scores differently between recordings

Accept it.

The learned routine does not depend on literal score values or a specific winner.

### Page refresh

State should restore from localStorage and WebMCP tools should re-register without duplicate-name errors.

### Corrupt/stale demo state

Use **Reset demo** and begin again.

## What must not be faked

The recorded demo must not:

- preload agent events and represent them as live calls;
- claim internet research when using fixture dossiers;
- show approval as enforced if the agent can actually bypass it;
- claim arbitrary workflow learning;
- splice a successful UI state over a failed tool invocation.

A smaller authentic demonstration is stronger than a broader simulated one.
