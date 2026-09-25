# Obsidian Story Map

Obsidian adapter that opens a StoryMap document as a dedicated, file-backed full-leaf
view similar to Obsidian Kanban.

A StoryMap document is a normal Markdown file with:

```yaml
---
story-map: true
---
```

and one fenced `story-map` configuration block:

````markdown
```story-map
title: Chile Trip
noteFolder: Travel/Chile/Places
order: asc
dateField: date-created
noteDisplay: link
map:
  center: [-33.4489, -70.6693]
  zoom: 5
  showPath: true
```
````

## Note display

`noteDisplay` controls how a resolved note appears in the slide panel:

- `basic` — frontmatter basics only (`title`, `location`, `description`/`summary`, `cover`);
- `link` — basics plus a title link: hovering shows the Obsidian page preview and clicking opens
  the note in a new tab (default);
- `full` — basics plus the note's Markdown body (frontmatter stripped) as slide text.

## Behavior

- A detected document opens in the full-leaf StoryMap view by default.
- `Open as Markdown` (command, file menu, and the StoryMap view's pane menu) switches the same
  file back to the normal Markdown view without changing its source; `Open as Story Map`
  returns it to the StoryMap view.
- `noteFolder` recursively discovers Markdown notes with `story-map-note: true`; explicit
  `slides` keep their exact configured order and are never appended to.
- Notes may reuse Leaflet-compatible `location`, `mapmarker`, `mapzoom`, `title`,
  `description`/`summary`, and `cover`/`image`/`media` frontmatter.
- In `noteDisplay: link`, the slide title opens the note in a new tab and shows the Obsidian page
  preview on hover (via a registered `hover-link` source).
- Invalid YAML or a missing block renders an in-view error instead of breaking the workspace.

The adapter reads the StoryMap configuration from the document's `story-map` fenced block;
multiple configuration blocks per document are out of scope for v1.

## Build

```bash
pnpm --filter @story-map/obsidian-story-map build
```

Copy `dist/main.js`, `dist/manifest.json`, `dist/styles.css`, and `dist/versions.json` into:

```text
<Vault>/.obsidian/plugins/story-map/
```
