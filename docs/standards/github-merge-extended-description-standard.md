# GitHub Merge Extended Description Standard

## Purpose

Use this standard to create the durable extended description for a squash merge.

The merge description should help:

1. a human quickly understand the final change and why it matters; and
2. a future AI agent reconstruct the important technical context without reopening the full pull request.

The merge description is not a copy of the PR body.

The PR body is working and review context. The merge description records the final merged state.

---

## Source of truth

Generate the merge description from the final pull request state.

Use this evidence order:

1. final merged diff;
2. tests and checks that actually ran;
3. resolved review comments and review-driven corrections;
4. issue or task context;
5. pull request body.

If these sources conflict, prefer the final implementation and actual verification.

Do not preserve stale intent from the original PR description when the final implementation changed during review.

---

## Required format

Use:

```markdown
## What changed
- <specific completed change>

## Why
- <reason for the change>

## Verification
- <actual tests, checks, or validation performed>

## Important context
- <constraints, compatibility notes, migrations, limitations, dependencies, or other durable context>
```

Omit `## Important context` when there is no meaningful additional context.

Do not include empty sections.

---

## What changed

Describe the final completed state.

Prefer specific statements such as:

> Added fail-closed validation for worker-profile model and reasoning pins before delegation.

Avoid vague statements such as:

> Improved routing.

Use completed-state language.

Good verbs include:

- Added
- Updated
- Removed
- Replaced
- Restricted
- Preserved
- Corrected
- Split
- Migrated
- Hardened
- Documented

Do not write a chronological development log.

Do not list every changed file unless the file itself is important to understanding the result.

---

## Why

Explain the technical or product reason for the change.

The reader should understand why the final state exists.

Prefer:

> Prevents a mismatched worker profile from silently executing on a different model than the route requires.

Avoid:

> Needed for the task.

Do not repeat the `What changed` section using different words.

---

## Verification

Report only verification that actually occurred.

Good examples:

> `python -m unittest discover -s tests -v` — 71 tests passed.

> `git diff --check` — passed.

> GitHub Actions `Backend Validation` — passed.

> Simulator review confirmed the corrected landscape flow on iPhone 17 Pro and iPhone 17e.

If verification was incomplete, preserve that fact.

Examples:

> Playwright: 12 of 13 tests passed; one test timed out after 10 seconds. The test was not rerun solely to obtain a green result.

> 348 tests passed; 35 database-dependent tests were skipped in the isolated environment.

Do not write:

> All tests passed.

unless all relevant tests actually ran and passed.

Do not claim CI ran when it did not.

Do not convert a local check into a production or deployment claim.

---

## Important context

Use this section only for information that materially affects future understanding.

Examples:

- a compatibility constraint;
- a migration requirement;
- an authorization boundary;
- a known limitation;
- a deliberately deferred capability;
- a dependency that remains external;
- a behavior preserved for backward compatibility;
- a failed or skipped validation result that matters;
- a repository or runtime assumption;
- a security or safety boundary.

Prefer:

> Automatic external-model routing remains disabled. The worker requires explicit model selection and parent verification.

Avoid:

> More work may be added later.

Do not use this section as a backlog.

---

## Writing rules

### Describe the final state

Write about what will exist after the squash merge.

Do not preserve intermediate implementation states unless they materially explain the final result.

### Be specific

Name the relevant component, behavior, interface, configuration, or constraint.

Prefer:

> The resolver rejects a family/runtime mapping that cannot explicitly disable minimum-p.

over:

> Added validation.

### Explain intent

When the reason affects maintenance or behavior, state it.

### Separate facts from uncertainty

Do not convert assumptions or incomplete evidence into certainty.

Use explicit wording such as:

- remains unverified;
- was not tested;
- is intentionally deferred;
- is unavailable in the current runtime;
- remains configuration-blocked.

### Preserve constraints and invariants

If the change introduces or protects a rule that future work must not violate, record it.

### Use precise verification

Include commands, test counts, environments, or named checks when useful.

### One primary idea per bullet

Do not pack unrelated changes into one long bullet.

### Use stable terminology

Use the same term for the same concept.

Do not alternate between synonyms when the distinction is not meaningful.

### Avoid filler

Do not use generic phrases such as:

- various improvements;
- enhanced functionality;
- robust solution;
- better support;
- miscellaneous cleanup;
- quality improvements.

Replace them with the actual change.

---

## Length

Most merge extended descriptions should be approximately 75–200 words.

Use less for a very small change.

Use more only when the merged change has important constraints, migrations, verification nuance, or safety context that would otherwise be lost.

Do not optimize for a fixed word count.

---

## Future-agent reconstruction test

Before finalizing the merge description, ask whether a future agent could determine:

- What changed?
- Why was it changed?
- What behavior now exists?
- What important constraints apply?
- What verification actually occurred?
- Was anything important skipped, failed, deferred, or unresolved?

If the answer is no, add the missing durable context.

Do not add information merely because it appeared in the PR discussion.

---

## Do not include

Do not use the merge description for:

- chronological work logs;
- file-by-file diff summaries;
- full review transcripts;
- complete PR descriptions;
- speculative future features;
- private chain-of-thought;
- raw debugging notes;
- unverified claims;
- repeated screenshots or evidence already preserved elsewhere;
- implementation details that have no durable maintenance value.

---

## Pull request body versus merge description

Treat the two artifacts differently.

### Pull request body

The PR body may contain:

- implementation plan;
- screenshots;
- intermediate decisions;
- review context;
- detailed testing notes;
- scope exclusions;
- unresolved questions;
- reviewer discussion.

It is working and review context.

### Merge extended description

The merge description contains:

- the final change;
- the reason;
- actual verification;
- durable constraints or context.

It is the permanent summary attached to the squash commit.

Do not simply copy the PR body into the squash description.

---

## Compact format for small pull requests

For a small, low-risk change, use the same headings with minimal content:

```markdown
## What changed
- Corrected the configuration path used by the local verifier.

## Why
- The previous path prevented the verifier from finding the repository configuration.

## Verification
- `python scripts/verify.py` — passed.
- `git diff --check` — passed.
```

Do not add `Important context` when none is needed.

---

## Instructions for coding agents

Immediately before squash merge:

1. Inspect the final PR state.
2. Inspect the final diff.
3. Include material review-driven changes.
4. Identify the verification that actually ran.
5. Preserve meaningful failures, skips, limitations, and constraints.
6. Generate the squash commit title separately from the extended description.
7. Use this standard for the extended description.
8. Do not copy the original PR body.
9. Do not invent tests, results, capabilities, approvals, or deployment state.
10. If required evidence is unavailable, state that explicitly.

When asked only for the GitHub merge extended description, return only the formatted description required by this standard.

---

## Recommended repository integration

Store this file at:

```text
docs/standards/github-merge-extended-description-standard.md
```

Add a concise pointer in the root `AGENTS.md`:

```markdown
## GitHub PR Merges

Before merging a pull request, generate the GitHub merge extended description according to:

`docs/standards/github-merge-extended-description-standard.md`

Base the description on the final PR state, including review changes and verification that actually occurred.

When asked only for the GitHub merge extended description, return only the formatted description required by that standard.
```

The repository-local copy is the durable source of truth for coding agents working in that repository.
