# Clear Technical Documentation Standard

## Purpose

This standard defines how durable repository documentation should be written for both humans and AI agents.

It applies controlled technical-writing principles inspired by Simplified Technical English and the Clear Technical Output approach. It does **not** claim formal ASD-STE100 compliance.

The goal is not to make every document sound the same. The goal is to make each document accurate, low in ambiguity, explicit about current state, easy to act on, easy to verify, useful to future humans and AI agents, and resistant to stale or unsupported claims.

Use the structure that fits the reader's task.

---

## Core principles

### 1. Preserve meaning before shortening

Do not remove important technical detail only to reduce length.

A shorter document is not better if it loses constraints, dependencies, failure conditions, verification details, important caveats, ownership, implementation status, or unresolved questions.

### 2. Separate facts from other states

Do not blur these categories:

- **Verified fact** — supported by current code, tests, repository state, or other evidence.
- **Implemented behavior** — exists in the current product or repository.
- **Approved direction** — accepted design or product direction that is not fully implemented.
- **Planned work** — intended future work.
- **Research finding** — evidence gathered for evaluation, not necessarily a product decision.
- **Assumption** — believed or proposed but not verified.
- **Unknown** — information that cannot currently be established.
- **Historical evidence** — accurate for a previous revision, environment, or date.

Never convert an assumption, plan, or unknown into a factual statement.

### 3. Use stable terminology

Use the same term for the same concept.

Do not switch between synonyms when the distinction is not meaningful.

If similar terms have different meanings, define them.

### 4. Prefer explicit actors and actions

State who or what performs an action when ambiguity could matter.

Prefer:

> The installer copies the worker profiles to the active Codex agents directory.

instead of:

> The profiles are installed.

Prefer:

> Run `python scripts/verify.py`.

instead of:

> Verification can be performed.

### 5. Put conditions before dependent actions

Prefer:

> If the worker profile is missing, use the solo route.

instead of:

> Use the solo route when the worker profile is missing.

For procedures, make the decision point visible before the action.

### 6. Make outcomes observable

A procedure should tell the reader what success looks like.

Do not stop at:

> Run the installer.

Add the expected result and a verification step.

### 7. Report actual verification

Do not write:

> All tests pass.

unless all relevant tests actually ran and passed.

Prefer:

> `python -m unittest discover -s tests -v` — 71 tests passed.

If a check failed, timed out, was skipped, or could not run, state that explicitly when it matters.

### 8. Preserve important limitations

Do not hide limitations to make a project sound more complete.

Prefer:

> Child-specific usage attribution is unavailable on the tested runtime.

instead of:

> Usage tracking is supported.

### 9. Avoid vague technical claims

Avoid phrases such as:

- robust;
- seamless;
- powerful;
- flexible;
- optimized;
- enterprise-ready;
- secure;
- production-ready;
- fully private;
- highly scalable;
- supports everything.

Use them only when the document defines what they mean and evidence supports the claim.

### 10. Write for reconstruction

A durable document should let a capable future human or AI agent reconstruct the relevant state without relying on chat history.

When relevant, the reader should be able to determine:

- What is this?
- Why does it exist?
- What is true now?
- What is planned?
- What action is required?
- Who owns the action?
- What constraints apply?
- What must not happen?
- What evidence supports the claim?
- How is success verified?
- What can fail?
- What remains unresolved?
- Where is the authoritative source?

---

## Communication modes

Apply the standard with different strength depending on the document.

### Technical / operational

Examples include architecture, API documentation, setup, installation, runbooks, procedures, troubleshooting, agent instructions, implementation guides, and specifications.

Apply the standard strongly.

Optimize for precision, explicit actions, low ambiguity, verification, stable terminology, and current-state accuracy.

### Technical explanation / educational

Examples include concept guides, design explanations, white papers, and technical overviews.

Apply the standard moderately.

Preserve teaching value, examples, and narrative. Do not turn explanatory material into terse operating instructions.

### Business / product strategy

Examples include product briefs, roadmaps, positioning, and design decisions.

Apply the standard selectively.

Make facts, assumptions, recommendations, decisions, risks, and open questions easy to distinguish.

### Marketing / public-facing product copy

Do not force technical prose onto marketing content.

Preserve brand voice, persuasion, memorable language, customer orientation, and differentiation.

Still enforce factual accuracy, claim boundaries, stable terminology, no unsupported guarantees, and no planned capability presented as shipped.

### Research / historical evidence

Preserve the original evidence.

Do not rewrite old findings to match the current product.

Instead, classify them clearly by date, environment, revision, status, what the evidence established, and what it did not establish.

---

## Document authority and status

Important maintained documents should state their role when readers could confuse current, planned, research, and historical information.

Use a compact status block when useful:

```markdown
> **Document status:** Maintained
> **Describes:** Current implementation and approved direction
> **Implementation baseline:** `<commit, version, or date>`
> **Update when:** Architecture, capability status, or product scope changes
```

For research:

```markdown
> **Document status:** Research
> **Research date:** YYYY-MM-DD
> **Not authorization:** Findings require current verification and product approval before use.
```

For historical evidence:

```markdown
> **Document status:** Historical
> **Baseline:** `<commit, version, environment, or date>`
> This document records evidence from that baseline. Do not use it as a current-state claim without verification.
```

Do not add metadata mechanically to every file. Use it where document authority or freshness matters.

---

## Repository description

The GitHub repository description should answer:

1. What is the project?
2. What is its main differentiator or purpose?

Keep it concise.

Avoid descriptions that require prior project knowledge.

Do not put roadmap claims, unsupported performance claims, or slogans in the repository description.

---

## README standard

The root `README.md` is the primary human entry point.

A reader should understand the project before they encounter implementation history or research detail.

Recommended structure:

```markdown
# Project name

<One- or two-sentence description>

## What it is

## Why it exists

## Current status

## How it works

## Requirements

## Install

## Verify installation

## Use it

## Expected behavior

## Examples

## Limits and boundaries

## Troubleshooting

## Update

## Uninstall

## Repository structure

## Documentation

## License
```

Not every repository needs every section. Remove sections that do not serve a real reader need.

### README rules

- Explain the current product before historical research.
- State whether the project is experimental, release candidate, beta, or released when that status matters.
- Distinguish tested versions from supported versions.
- Give the shortest complete successful installation path.
- Give an observable verification step.
- Explain what installation changes on the user's machine.
- Explain how to remove or reverse those changes where applicable.
- Do not make the user infer critical limitations from later sections.

---

## Documentation index

For repositories with several documents, create `docs/README.md` or an equivalent index.

Use the index to classify documentation by authority and purpose.

Recommended structure:

```markdown
# Documentation

## Current product

## Current technical reference

## Operations and procedures

## Current research and evaluation

## Historical evidence

## Standards and governance
```

The index should help a human or agent answer:

> Which document should I trust for this question?

Do not maintain multiple documents that independently claim to be the current source of truth for the same thing.

---

## Installation documentation

Use this sequence:

```text
PREREQUISITE
→ ACTION
→ EXPECTED RESULT
→ VERIFICATION
→ FAILURE / RECOVERY
```

Example:

```markdown
### Install worker profiles

Prerequisite: Python 3 and a configured Codex installation.

Run:

`python scripts/install_agents.py`

Expected result:

The installer copies the worker profiles to the active Codex agents directory.

Verify:

`python scripts/install_agents.py --check`

The command must exit with status `0`.

If an existing profile has different content, the installer refuses to overwrite it. Resolve the conflict manually before retrying.
```

### Installation rules

Always state, when relevant:

- required software;
- required permissions;
- files or directories written;
- configuration changed;
- network access used;
- credentials required;
- whether the operation is reversible;
- verification command;
- failure behavior.

---

## Update documentation

If a project can be updated, document:

- how to update;
- which files may change;
- whether user configuration is preserved;
- whether migrations occur;
- how to verify the updated installation;
- rollback or recovery behavior when relevant.

Do not assume the update mechanism is obvious.

---

## Uninstall documentation

If installation changes user or system state, document how to remove it.

State:

- what is removed;
- what is preserved;
- what must be removed manually;
- what is intentionally not removed;
- how to verify removal.

Never imply that uninstalling one component automatically removes another unless that behavior is verified.

---

## Procedure and runbook standard

For operational procedures, use:

```markdown
## Goal

## Preconditions

## Procedure

1. <Action>
2. <Action>

## Expected result

## Verification

## Failure handling

## Escalation
```

Use numbered steps when order matters. Use bullets when order does not matter. One step should contain one primary action.

---

## Architecture documentation

Architecture documentation should distinguish:

```markdown
## Current implemented architecture

## Approved or target architecture

## Deferred components

## Constraints

## Interfaces

## Verification / evidence

## Open questions
```

Do not draw planned components as if they currently execute.

If diagrams include future components, label them.

---

## API documentation

For each API or interface, document when relevant:

- purpose;
- caller;
- owner;
- endpoint or interface;
- authentication;
- request schema;
- response schema;
- error behavior;
- side effects;
- retry behavior;
- idempotency;
- limits;
- permissions;
- approval requirements;
- verification;
- known gaps.

Do not infer provider behavior that has not been confirmed.

---

## Technical reference standard

A reference document should answer specific questions without unnecessary narrative.

Use exact names, exact states, exact constraints, tables when they improve comparison, and definitions for terms whose differences matter.

Avoid duplicating introductory material from the README.

---

## Research documentation

Use:

```markdown
# Research title

> **Document status:** Research
> **Research date:** YYYY-MM-DD
> **Baseline:** <version, commit, environment>

## Question

## Method

## Evidence

## Observed result

## What this establishes

## What this does not establish

## Open questions

## Decision status
```

Do not convert research findings into product authorization.

If a research result later becomes implemented, preserve the research document and link to the current implementation authority.

---

## Historical evidence

Historical reports, audits, benchmark results, and previous architecture assessments should remain historically accurate.

Add a clear status statement instead of rewriting the findings.

Example:

```markdown
> **Historical evidence**
>
> This report describes commit `abc123` tested on 2026-08-24.
> Later changes may have resolved or invalidated individual findings.
> Verify current state before using this report as an implementation or security claim.
```

---

## Troubleshooting standard

Use:

```markdown
## Symptom

<observable problem>

## Likely cause

<known or likely cause>

## Check

<command or observation>

## Corrective action

<action>

## Expected result

<observable recovery state>

## Escalate when

<condition>
```

Do not tell users to repeatedly retry without evidence that retrying is appropriate.

---

## Error-message standard

User-visible errors should answer as many of these as useful:

1. What failed?
2. What is the impact?
3. What can the user do?
4. What evidence or identifier is available?

Prefer:

> The Luna route was not used because the required worker profile was unavailable. The task will remain on the solo route. Run the profile verification command before retrying Luna.

Avoid:

> Luna unavailable.

Do not expose secrets, private paths, tokens, raw provider responses, or unnecessary internal details.

---

## CLI and help-text standard

CLI help should make the action and result clear.

For commands, document:

- what the command does;
- required arguments;
- optional arguments;
- files written;
- network behavior;
- exit status;
- important safety behavior;
- example.

Prefer action verbs. Avoid marketing language in CLI help.

---

## Examples

Examples must be valid for the current documented interface.

Do not preserve examples that use removed commands, renamed fields, deprecated options, stale model names, old paths, or old product terminology.

Label hypothetical examples when they are not executable.

---

## Compatibility statements

Distinguish these concepts:

- **Tested on** — verified on a specific version or environment.
- **Minimum supported** — explicitly supported lower bound.
- **Known compatible** — verified compatible environment.
- **Expected compatible** — reasoned expectation, not verified.
- **Unsupported** — intentionally not supported.
- **Unknown** — not established.

Never convert:

> Tested on version 1.4

into:

> Requires version 1.4 or later

unless the minimum requirement is verified.

---

## Security and trust-boundary documentation

When a project reads credentials, modifies user configuration, sends data over the network, calls external APIs, executes subprocesses, writes files, delegates to agents, or processes untrusted content, document the boundary explicitly.

State:

- what data crosses the boundary;
- what does not;
- which component has authority;
- where credentials come from;
- whether retries occur;
- whether redirects occur;
- whether writes occur;
- who performs final verification;
- fail-open or fail-closed behavior.

Avoid unsupported claims such as "secure" or "safe." Describe the actual control.

---

## Agent-facing documentation

Agent-readable documentation should minimize reconstruction errors.

When relevant, make these explicit:

```text
GOAL
CURRENT STATE
VERIFIED FACTS
ASSUMPTIONS
CONSTRAINTS
OWNERSHIP
REQUIRED ACTION
MUST NOT DO
SUCCESS CRITERIA
VERIFICATION
DEPENDENCIES
UNCERTAINTY
OPEN QUESTIONS
```

Do not require these as headings in every document. Use them as a completeness test.

Agent instructions must not request private chain-of-thought storage.

Record decisions, evidence, public rationale, and verification.

---

## Marketing and public product copy

Marketing copy may use a more natural and persuasive style.

However, every factual product claim must still respect the current truth model.

Do not present:

- planned features as shipped;
- research candidates as approved;
- tested behavior as universal support;
- privacy direction as guaranteed privacy;
- security controls as security certification;
- requested model identity as verified execution identity;
- estimated economics as measured savings.

A useful internal claim classification is:

```text
SAFE NOW
SAFE WITH QUALIFIER
PLANNED / FUTURE
UNSUPPORTED
```

Do not expose these labels publicly unless useful.

---

## Release notes

Release notes should adapt the logic of the merge-description standard.

Recommended structure:

```markdown
# Version X.Y.Z

## What changed

## Why it matters

## Upgrade or compatibility impact

## Verification

## Important context

## Known limitations
```

Do not copy the complete PR history into release notes. Describe the released state.

---

## Changelog

If a changelog is maintained, keep entries concise.

A changelog is an index of changes, not a replacement for release notes, merge records, architecture documentation, or migration guides.

---

## GitHub issues

Issue descriptions should make the problem reconstructable.

For bugs:

```markdown
## Problem

## Reproduction

## Expected behavior

## Actual behavior

## Environment

## Evidence

## Impact
```

For implementation work:

```markdown
## Goal

## Current state

## Scope

## Constraints

## Acceptance criteria

## Verification
```

Do not add empty template sections that do not apply.

---

## Pull request bodies

The PR body is working and review context.

It may contain implementation detail, review notes, screenshots, intermediate decisions, migration detail, open questions, test evidence, and scope exclusions.

The PR body does not need to become the durable merge record. It may evolve during review.

---

## Squash merge title and extended description

Use the repository's separate `github-merge-extended-description-standard.md` for the final squash merge record.

The durable merge record must be based on the final PR state.

The merge record should preserve:

- what changed;
- why;
- actual verification;
- important constraints or context.

Do not simply copy the PR body.

The merge-description standard remains the authority for merge formatting.

---

## Commit messages

For repositories that use squash merge as the durable history:

- intermediate branch commits may be practical and task-oriented;
- the squash title should concisely describe the final change;
- the squash extended description should carry durable context.

Do not force every intermediate commit to contain the full documentation structure unless repository policy requires it.

---

## Repository file map

A mature repository should make important information discoverable.

A common structure is:

```text
repo/
├── README.md
├── AGENTS.md
├── CONTRIBUTING.md          # only when useful
├── SECURITY.md              # when a real security/reporting need exists
├── CHANGELOG.md             # only when maintained
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── operations/
│   ├── references/
│   ├── research/
│   ├── historical/
│   └── standards/
└── ...
```

Do not create conventional files only to make the repository look complete.

Every durable file should have a clear owner and purpose.

---

## Documentation maintenance rules

### Update documentation with behavior

If a change affects installation, user-visible behavior, interface, architecture, configuration, supported versions, security boundary, command syntax, or failure behavior, update the relevant maintained documentation in the same change when practical.

### Do not duplicate current-state truth

Prefer one authoritative technical source and link to it.

Do not independently maintain the same capability matrix in several documents.

### Preserve history

Do not rewrite historical evidence to match current state.

### Remove stale authority

If a document is no longer maintained, mark it historical, mark it superseded, redirect to the current authority, or archive it when appropriate.

Do not leave two documents claiming to describe the same current state.

---

## Documentation review checklist

Before merging meaningful documentation changes, ask:

### Accuracy

- Does every factual claim match current repository or verified external evidence?
- Are assumptions labeled?
- Are planned capabilities clearly planned?
- Are historical findings clearly historical?

### Clarity

- Is the actor clear?
- Is the action clear?
- Are important terms stable?
- Are conditions visible before dependent actions?
- Are important pronouns unambiguous?

### Actionability

- Are prerequisites stated?
- Are commands exact?
- Is the expected result stated?
- Can success be verified?
- Is failure handling documented where needed?

### Boundaries

- Are important constraints preserved?
- Are unsupported claims excluded?
- Are trust and authorization boundaries explicit?

### Human usability

- Can a new reader find the first successful path quickly?
- Is important information presented before research/history?
- Is the prose natural rather than mechanically simplified?

### Agent usability

- Can another capable agent reconstruct current state?
- Can it distinguish current, planned, research, and historical information?
- Can it identify the authoritative source?
- Can it determine verification and success conditions?

### Maintenance

- Is this the correct file for the information?
- Is the same current-state fact duplicated elsewhere?
- Does another document need a corresponding update?

---

## Writing style

Prefer:

- direct sentences;
- concrete nouns;
- active voice where useful;
- one primary idea per sentence or bullet;
- descriptive headings;
- short paragraphs;
- tables for comparison;
- numbered steps for ordered procedures.

Avoid:

- unnecessary introductory filler;
- repeated summaries;
- rhetorical padding;
- unexplained acronyms;
- vague references such as "this", "that", or "it" when several referents are possible;
- claims of certainty without evidence;
- excessive passive voice;
- artificial simplification that removes technical precision.

---

## What this standard does not require

This standard does not require:

- formal ASD-STE100 compliance;
- identical structure across documents;
- short sentences at all costs;
- removal of all technical terminology;
- removal of nuance;
- rewriting good documentation only for stylistic consistency;
- replacing marketing voice with technical prose;
- adding every conventional repository document;
- adding metadata blocks to every Markdown file.

Use judgment.

The best document is the one that communicates the required truth clearly for its actual reader and task.

---

## Instruction for coding agents

When asked to create or update durable repository documentation:

1. Inspect the current repository state.
2. Identify the document's audience and purpose.
3. Determine whether the content describes current behavior, planned behavior, research, or historical evidence.
4. Preserve the repository's authoritative terminology.
5. Apply the relevant structure from this standard.
6. Verify technical claims against current code, tests, configuration, or other authoritative evidence.
7. Do not invent capabilities, verification, compatibility, or status.
8. Update related maintained documentation only when the same change makes it stale.
9. Preserve historical evidence rather than rewriting it.
10. Report which documents changed and why.

For squash merges, follow the separate GitHub merge extended-description standard.
