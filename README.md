# Story Map Monorepo

A small, reusable Leaflet-based StoryMap stack. One Markdown source and one standard
`StoryMapConfig` render in three hosts:

- standalone React applications;
- an Obsidian plugin (file-backed full-leaf view);
- a Docusaurus site via a Remark build-time transform and browser client.

## Packages

| Package | Role | Published |
| --- | --- | --- |
| `@story-map/story-map-core` | Framework-agnostic schema, parser, and helpers | npm |
| `@story-map/react-story-map` | React + Leaflet renderer | npm |
| `@story-map/remark-story-map` | Remark build-time transform + browser client | npm |
| `@story-map/obsidian-story-map` | Obsidian file-backed view and Vault resolver | private |

## Quick start

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

`pnpm typecheck` uses TypeScript project references (`tsc -b`), so it builds
`story-map-core` for dependents instead of relying on a stale `dist`.

Run the standalone example:

```bash
pnpm --filter @story-map/example-react dev   # http://127.0.0.1:5173
```

## Story syntax

A StoryMap document is a normal Markdown file with `story-map: true` frontmatter and one
fenced `story-map` configuration block:

````markdown
---
story-map: true
---

```story-map
schema: storymap/v1
title: Chile Trip
map:
  center: [-33.4489, -70.6693]
  zoom: 6
  showPath: true
noteFolder: Travel/Chile/Places
order: asc
dateField: date-created
noteDisplay: link
```
````

`noteFolder` recursively discovers Markdown notes with `story-map-note: true`, ordered by
`dateField` using `order: asc | desc`. Explicit `slides` keep their exact order and are
never reordered or appended to by folder discovery.

`noteDisplay: basic | link | full` controls how resolved notes are shown (default `link`):
frontmatter basics, basics with a title link to the note, or the full frontmatter-stripped
note body. Obsidian opens the note through host callbacks; Docusaurus renders the
published route as a normal browser link.

## Docusaurus

`remark-story-map` transforms each fence at build time into a host element and a browser
client mounts the shared renderer. Configure it with `vaultRoot`, `assetBase`, and a host
`resolveNoteHref` route callback. See `packages/remark-story-map/README.md` and
`examples/docusaurus/`.

## Design rule

`react-story-map` must never import Obsidian or Docusaurus APIs. Platform adapters resolve
notes, WikiLinks, Vault frontmatter, local assets, and routes into a `StoryMapConfig`
before render time.

## Documentation

- `SPEC.md` — product and architecture contract.
- `docs/architecture.md` — implementation map for contributors and agents.
- `AGENTS.md` — working agreement and definition of done.
- `RELEASING.md` — npm and Obsidian plugin release steps.
- `docs/history/` — archived plans.
