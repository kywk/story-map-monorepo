# Story Map Monorepo

A minimal monorepo for a Leaflet-based StoryMap renderer that can be reused by:

- standalone React applications
- an Obsidian plugin
- a Docusaurus/Remark publishing pipeline

## Packages

- `@story-map/story-map-core` — framework-agnostic schema, parser, and shared helpers
- `@story-map/react-story-map` — React + Leaflet StoryMap renderer
- `@story-map/obsidian-story-map` — Obsidian file-backed full-leaf StoryMap view and Vault resolver
- `@story-map/remark-story-map` — Remark transformer plus browser hydrator for Docusaurus

## Quick start

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

`pnpm typecheck` uses TypeScript project references (`tsc -b`), so it builds `story-map-core` for dependents instead of relying on a stale `dist`.

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
height: 560px
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

`noteFolder` recursively discovers Markdown notes with `story-map-note: true`, ordered
by `dateField` using `order: asc | desc`. When explicit `slides` are present, they keep
their exact order and `noteFolder` is ignored.

`noteDisplay: basic | link | full` controls how resolved notes are shown (default `link`):
frontmatter basics, basics with a hover-preview/title link to the note, or the note's full body.

Obsidian and Remark adapters may resolve `note`, Vault frontmatter, WikiLinks, and local assets before passing the final `StoryMapConfig` to `react-story-map`.

## Design rule

`react-story-map` must never import Obsidian or Docusaurus APIs. Platform-specific information is resolved before render time.

See `SPEC.md` and `docs/implementation-plan.md`. Release steps live in `RELEASING.md`.
