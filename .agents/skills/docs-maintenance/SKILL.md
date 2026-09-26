---
name: docs-maintenance
description: Use when reorganizing or updating this project's documentation, including README, SPEC, AGENTS, docs/architecture, onboarding docs, handoffs, and implementation plans. Covers trimming top-level docs, archiving plans under docs/history/<YYYY-MM-DD>-<slug>/, deleting merged development-process notes, and keeping docs in sync with the code.
---

# Docs maintenance

Workflow for keeping this repository's documentation small, current, and easy for a new
agent to onboard from without reading the source first.

## Document roles

| File | Role | Rule |
| --- | --- | --- |
| `README.md` | Entry point: what the project is, packages, quick start, syntax | Short. No implementation detail. |
| `SPEC.md` | Product + architecture contract | Durable intent only. Link to architecture for file detail. |
| `AGENTS.md` | Working agreement, boundaries, definition of done | Short. No duplicated architecture prose. |
| `docs/architecture.md` | Concrete implementation map: packages, data flow, files, APIs, commands | The single place for implementation detail. Update on every behavior change. |
| `docs/README.md` | Docs index and documentation rules | Keep the table current. |
| `docs/history/<YYYY-MM-DD>-<slug>/` | Archived plans and background | Append-only. Never edit archived files. |
| Package `README.md` | Package-specific usage only | Keep scoped to that package. |

## Rules

1. **Describe the current code, not a plan.** `SPEC.md` and `docs/architecture.md` must
   match the repository as it exists. If they disagree, inspect the code and fix the doc.
2. **Trim, don't duplicate.** Each fact has one home. Architecture and file-level detail
   belong in `docs/architecture.md`; the top-level docs link to it.
3. **Archive completed plans.** Move finished or superseded planning/design docs into
   `docs/history/<YYYY-MM-DD>-<slug>/` using `git mv` so history is preserved.
4. **Delete development-process notes.** Handoffs, scratch status files, and conversation
   summaries are deleted once their work is merged, not archived.
5. **No stale links.** After moving or deleting a doc, search for references and update them.
6. **Same-change updates.** When behavior changes, update the matching doc in the same
   change. A new defaultable config key, for example, touches `SPEC.md` and
   `docs/architecture.md`.
7. **Prefer a short table or list** over prose paragraphs of enumeration.

## Workflow

1. Survey the current docs and the code they claim to describe:

   ```bash
   ls docs
   git status --short
   rg -n "implementation-plan|handoff|conversation-summary|<old-filename>" --glob '!node_modules' .
   ```

2. Archive superseded plans and remove merged process notes:

   ```bash
   mkdir -p docs/history/<YYYY-MM-DD>-<slug>
   git mv docs/<plan>.md docs/history/<YYYY-MM-DD>-<slug>/
   git rm docs/<handoff>.md
   ```

3. Rewrite the affected docs so each one keeps only its role from the table above. Verify
   claims against `docs/architecture.md`, package `src/`, and `package.json` scripts.
4. Re-check for broken references and leftover process files.
5. Update `docs/README.md` if the doc set changed.
6. Run the repository checks if any code-adjacent claim changed:

   ```bash
   pnpm typecheck
   pnpm test
   pnpm build
   ```

## Reuse in another project

The same shape works for any project: a short `README`, a durable spec/contract, an
agent working agreement, one architecture/onboarding doc, a docs index, and an append-only
`docs/history/` archive. Adapt the file names to the project, keep the single-home rule,
and capture the rules here so future sessions do not re-derive them.
