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
map:
  center: [-33.4489, -70.6693]
  zoom: 5
  showPath: true
```
````

## Behavior

- `Open as Story Map` command and file-menu action open a detected document in the full-leaf view.
- `Open as Markdown` switches the same file back to the normal Markdown view without changing its source.
- `noteFolder` recursively discovers Markdown notes with `story-map-note: true`; explicit
  `slides` keep their exact configured order and are never appended to.
- Notes may reuse Leaflet-compatible `location`, `mapmarker`, `mapzoom`, `title`,
  `description`/`summary`, and `cover`/`image`/`media` frontmatter.
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
