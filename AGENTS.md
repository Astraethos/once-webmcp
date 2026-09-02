<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Documentation

For durable human-facing and agent-facing repository documentation, follow
[Clear Technical Documentation Standard](docs/standards/clear-technical-documentation-standard.md).
Apply it according to the document's purpose; do not force one template onto every
document. Preserve technical meaning, distinguish current behavior from planned,
research, or historical information, report only verified facts, and make the
relevant state reconstructable by humans and AI agents.

For squash-merge titles and extended descriptions, follow
[GitHub Merge Extended Description Standard](docs/standards/github-merge-extended-description-standard.md).
That standard controls merge formatting; the Clear Technical Documentation
Standard controls the broader documentation approach.

Use feature branches and pull requests. Prefer squash merges when repository
policy allows. Immediately before squash merge, inspect the final PR state and
diff, material review-driven changes, actual verification, and important constraints.
Generate the final title and extended description separately; do not simply copy
the PR body. Follow repository protections and approval requirements. Do not change
repository settings without explicit authorization.
