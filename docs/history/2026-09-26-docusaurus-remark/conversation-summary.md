# Conversation Summary

## Objective

Build a reusable StoryMap stack that renders the same Obsidian-oriented Markdown in:

- standalone React applications;
- Obsidian;
- Docusaurus.

The Obsidian MVP is now implemented. The next milestone is the Docusaurus/Remark adapter.

## Architecture decisions

### Leaflet remains the MVP map engine

Leaflet was selected because:

- the existing Obsidian workflow already uses Leaflet-compatible metadata;
- the required StoryMap interaction is pan/zoom/flyTo + markers/path;
- there is no current vector/3D requirement;
- one map ecosystem keeps the implementation small.

MapLibre remains deferred.

### Reuse content conventions, not platform runtimes

StoryMap reuses useful Obsidian/Leaflet conventions such as:

- `location`;
- `mapmarker`;
- `mapzoom`;
- WikiLinks;
- local media;
- `defaultZoom` / `tileServer` compatibility.

It does not depend on the community Obsidian Leaflet plugin runtime.

### Common renderer

`react-story-map` owns the actual StoryMap UI and Leaflet lifecycle.

Platform adapters normalize their data into `StoryMapConfig` before rendering.

```text
Obsidian / Remark / standalone
            |
            v
      StoryMapConfig
            |
            v
      react-story-map
```

### Common pure core

`story-map-core` owns schema, parsing, defaults, normalization, WikiLink helpers, note sorting, and other platform-neutral rules.

It must not access filesystem, Obsidian, Docusaurus, React, or Leaflet APIs.

## Source format decisions

StoryMap document:

```yaml
---
story-map: true
---
```

with:

````markdown
```story-map
noteFolder: Travel/Chile/Places
order: asc
dateField: date-created
noteDisplay: link
```
````

StoryMap discovered note:

```yaml
---
story-map-note: true
location: [-33.4489, -70.6693]
date-created: 2026-01-15
---
```

Configuration names use camelCase. Role flags remain kebab-case.

## Ordering decisions

Folder-generated slides use only:

```text
order: asc | desc
dateField: <frontmatter field>
```

Defaults:

```text
order = asc
dateField = date-created
```

No secondary configurable sorting/group/filter/query syntax is part of v1.

Explicit slides preserve exact author order and suppress automatic `noteFolder` append.

## Note display decisions

```text
basic -> frontmatter basics only
link  -> basics + platform-resolved notePath
full  -> basics + frontmatter-stripped note body
```

Obsidian `link` behavior:

- Page Preview on hover;
- open note in new tab.

Docusaurus `link` behavior:

- host resolves final published URL;
- renderer uses normal browser anchor.

## Current implementation status

### Completed baseline

- `story-map-core` parser/schema/helpers;
- `react-story-map` Leaflet renderer;
- Obsidian file-backed full-leaf StoryMap view;
- recursive `noteFolder`;
- date sorting;
- explicit note inheritance;
- Obsidian `noteDisplay` basic/link/full;
- Obsidian settings defaults;
- initial Remark fence transform;
- Remark Vault index;
- Remark explicit-note and folder discovery;
- Remark browser host mounting.

### Docusaurus/Remark gaps

Current milestone fills:

- Remark `noteDisplay` parity;
- host-owned published-route resolver;
- source-relative explicit media;
- scan exclusions for `node_modules`/build output;
- normal browser `notePath` fallback;
- React-root cleanup when SPA hosts are removed;
- Docusaurus/Infima theme bridge;
- optional lazy client loading.

## Docusaurus integration decision

The target `kywk.github.io` site already has established route handling:

```text
scripts/content-links.js
remark-slug-normalizer
deriveSlug()
createContentLinkIndex()
```

StoryMap must reuse that route authority rather than create its own slug rules.

The intended flow is:

```text
story-map fence
    |
    v
remark-story-map
    |
    v
Vault note resolution
    |
    v
host resolveNoteHref(...)
    |
    v
existing published-content index
    |
    v
StoryMapConfig
    |
    v
react-story-map
```

## Existing Docusaurus plugins used as references

Reference implementations:

- `remark-obsidian-leaflet`;
- `remark-obsidian-kanban`.

Useful patterns:

- build-time Markdown transformation;
- browser-only interactivity;
- SPA navigation awareness;
- multi-instance Docusaurus configuration;
- theme integration.

Do not copy their route-normalization duplication or renderer-in-Remark technical debt.

## Deferred

- visual editor;
- scroll mode;
- MapLibre;
- custom marker icons;
- marker popups;
- advanced `mapzoom` semantics;
- GeoJSON/GPX;
- CRS.Simple/gigapixel mode;
- automatic Vault asset copying;
- WikiLink/embed conversion inside full Markdown body;
- dynamic light/dark tile source switching.
