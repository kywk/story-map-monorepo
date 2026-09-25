# Story Map Monorepo

A minimal monorepo for a Leaflet-based StoryMap renderer that can be reused by:

- standalone React applications
- an Obsidian plugin
- a Docusaurus/Remark publishing pipeline

## Packages

- `@story-map/story-map-core` — framework-agnostic schema, parser, and shared helpers
- `@story-map/react-story-map` — React + Leaflet StoryMap renderer
- `@story-map/obsidian-story-map` — Obsidian `storymap` code-block processor and Vault resolver
- `@story-map/remark-story-map` — Remark transformer plus browser hydrator for Docusaurus

## Quick start

```bash
corepack enable
pnpm install
pnpm build
pnpm test
```

## Story syntax

````markdown
```storymap
schema: storymap/v1
title: Chile Trip
height: 560px
map:
  center: [-33.4489, -70.6693]
  zoom: 6
  showPath: true
slides:
  - title: Santiago
    location: [-33.4489, -70.6693]
    zoom: 12
    text: |
      First stop in **Santiago**.
    media: ./assets/santiago.jpg

  - note: "[[San Pedro de Atacama]]"
```
````

Obsidian and Remark adapters may resolve `note`, Vault frontmatter, WikiLinks, and local assets before passing the final `StoryMapConfig` to `react-story-map`.

## Design rule

`react-story-map` must never import Obsidian or Docusaurus APIs. Platform-specific information is resolved before render time.

See `SPEC.md` and `docs/implementation-plan.md`.
