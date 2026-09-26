# StoryMap MVP Specification

This is the product and architecture contract. `docs/architecture.md` describes how the
current code implements it.

## 1. Goal and scope

Build a small, reusable StoryMap stack centered on one standard `StoryMapConfig` model.
The MVP supports:

1. standalone React usage;
2. an Obsidian file-backed full-leaf StoryMap view;
3. Docusaurus/Remark publishing of the same Obsidian-oriented Markdown source;
4. Leaflet map navigation synchronized with paged story slides;
5. note discovery from one configured Vault folder and all of its subfolders.

Stay intentionally small. Do not add a visual editor, scroll-driven storytelling, MapLibre,
3D maps, GPX, GeoJSON editing, query languages, arbitrary filtering/grouping, or a plugin
framework in v1.

## 2. Source document model

### 2.1 StoryMap document

A normal Markdown file with `story-map: true` frontmatter and one `story-map` fenced code
block holding the configuration:

````markdown
---
story-map: true
---

```story-map
schema: storymap/v1
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

The Obsidian full-leaf view reads configuration only from this fence. Multiple
configuration blocks per document are out of scope for v1.

### 2.2 StoryMap note

A folder-discovered note is a normal Markdown file with `story-map-note: true` and reusable
metadata:

```yaml
---
story-map-note: true
title: Santiago
location: [-33.4489, -70.6693]
mapmarker: city
date-created: 2026-01-15
description: The starting point of the Chile journey.
cover: ./assets/santiago.jpg
---
```

StoryMap reuses Leaflet-compatible geographic frontmatter instead of introducing a second
coordinate schema. `story-map-note: true` is required only for automatic `noteFolder`
discovery; an explicitly referenced `slide.note` does not need it.

## 3. Naming conventions

StoryMap configuration keys are camelCase (`noteFolder`, `dateField`, `showPath`,
`tileUrl`), matching familiar Obsidian Leaflet-style config. Markdown frontmatter role flags
stay kebab-case (`story-map: true`, `story-map-note: true`). A configured date field name is
a value, not a StoryMap key; its default is `date-created`.

## 4. Architecture

```text
Vault / Markdown / API
        |
        v
platform adapter / resolver
        |
        v
@story-map/story-map-core          (schema, parser, helpers)
        |
        v
standard StoryMapConfig
        |
        v
@story-map/react-story-map         (React + Leaflet UI)
```

Platform adapters:

```text
Obsidian Vault ----> obsidian-story-map --\
                                          ---> StoryMapConfig ---> react-story-map
Docusaurus build --> remark-story-map ----/
Standalone app ---------------------------/
```

The Obsidian adapter renders `react-story-map` as a dedicated file-backed workspace view.
Docusaurus/Remark renders the same source as an embedded browser component.

## 5. Package responsibilities

### `story-map-core`

Owns types (`StoryMapConfig`, `StorySlide`, `StoryLocation`, `StoryMedia`), YAML
parsing/validation, source normalization and defaults (`noteFolder`, `order`, `dateField`,
`noteDisplay`), Leaflet-compatible key normalization, WikiLink reference parsing, and
location coercion helpers. Must not import React, Leaflet, Obsidian, Docusaurus, or Node
`fs`. Folder scanning, file metadata, and date extraction belong to adapters.

### `react-story-map`

Owns the `<StoryMap />` component, Leaflet instance lifecycle, paged navigation, `flyTo`
synchronization, markers and optional path, image/video/iframe media, Markdown text
rendering, resize handling (`invalidateSize()`), and minimal responsive CSS. Must remain
SSR-import-safe: Leaflet is dynamically imported inside client effects. Must not know about
Vaults, WikiLinks, frontmatter files, note folders, or Docusaurus routes.

### `obsidian-story-map`

Owns the file-backed `TextFileView`, `story-map: true` detection, `story-map` fence
extraction, Markdown <-> StoryMap view switching, default-open of detected documents,
recursive `noteFolder` discovery filtered by `story-map-note: true`, `dateField` + `order`
sorting, explicit `slide.note` resolution, `noteDisplay` handling, metadata and local media
resolution, a settings tab of defaults, and React mount/unmount lifecycle. It must not
depend on the community Obsidian Leaflet plugin at runtime.

### `remark-story-map`

Owns the build-time fenced-block transform, optional `vaultRoot` Vault indexing, recursive
`noteFolder` resolution with the same `dateField`/`order` semantics as Obsidian, config
serialization into a browser-safe host element, and a client entry that hydrates
placeholders with `<StoryMap />`. Build-time code never initializes Leaflet; the browser
entry never uses Node APIs.

## 6. Story source configuration v1

```ts
interface StoryMapSourceConfig {
  schema: 'storymap/v1';
  id?: string;
  title?: string;
  height: string;                // default: '520px'

  noteFolder?: string;
  order: 'asc' | 'desc';         // default: 'asc'
  dateField: string;             // default: 'date-created'
  noteDisplay: 'basic' | 'link' | 'full';  // default: 'link'

  map: {
    center?: [number, number];
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    tileUrl: string;
    attribution: string;
    showPath: boolean;
  };

  slides?: StorySlide[];
}
```

`noteFolder` is a Vault-relative folder and includes all nested subfolders. Only one
`noteFolder` is supported in v1.

### 6.1 Explicit slides

When `slides` is present and non-empty:

- the slide sequence is exactly the configured sequence;
- `noteFolder` does not append discovered slides;
- `order` and `dateField` do not reorder explicit slides;
- explicit `slide.note` references resolve normally.

### 6.2 Folder-generated slides

When `slides` is absent or empty and `noteFolder` is set:

1. recursively scan the folder and subfolders;
2. consider Markdown files only;
3. include only files with `story-map-note: true`;
4. read the frontmatter field named by `dateField`;
5. sort valid dates by `order`;
6. produce one slide per included note.

For determinism, notes with a missing or unparseable date are retained after valid dates.
Ties break by Vault-relative path ascending regardless of `order`. These are stability
rules, not configurable sort features.

### 6.3 Note display

- `basic` — frontmatter-derived basics only (`title`, `location`, `description`/`summary`,
  `cover`);
- `link` — the same basics, with the slide title linking to the source note; Obsidian shows
  the page preview on hover and opens the note in a new tab on click (default);
- `full` — the same basics, with the frontmatter-stripped note body as slide text.

The renderer stays platform-agnostic: the Obsidian adapter resolves `link` into an opaque
`slide.notePath` plus host callbacks and `full` into `slide.text`.

### 6.4 Default precedence

Obsidian resolves source values in order: document block -> plugin settings -> built-in
defaults. Plugin settings expose defaults for `order`, `dateField`, `noteDisplay`, and the
`map` keys `zoom`, `minZoom`, `maxZoom`, `tileUrl`, `attribution`, `showPath`. Per-story
values — `schema`, `id`, `title`, `noteFolder`, `map.center`, `slides`, `height` — are
document-only (`height` is forced to `100%` in the Obsidian full-leaf host). See
`docs/architecture.md` for the full defaults table.

## 7. Canonical render model

```ts
interface StoryMapConfig {
  schema: 'storymap/v1';
  id?: string;
  title?: string;
  height: string;
  map: {
    center?: [number, number];
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    tileUrl: string;
    attribution: string;
    showPath: boolean;
  };
  slides: StorySlide[];
}

interface StorySlide {
  id?: string;
  note?: string;       // adapter input; the renderer ignores unresolved references
  notePath?: string;   // adapter-resolved opaque source reference for link display
  title?: string;
  text?: string;
  location?: { lat: number; lng: number; zoom?: number };
  media?: { type: 'image' | 'video' | 'iframe'; src: string; alt?: string; caption?: string };
}
```

Accepted convenience forms: `location: [lat, lng]`; `media: ./image.jpg` as image media;
root-level Leaflet-like `lat`, `long`, `defaultZoom`, and `tileServer` normalized into map
fields.

## 8. Note metadata and Leaflet compatibility

Recognized note frontmatter:

```yaml
---
story-map-note: true
title: Santiago
location: [-33.4489, -70.6693]
description: A short introduction.
cover: ./santiago.jpg
mapmarker: city
mapzoom: [5, 18]
date-created: 2026-01-15
---
```

- `location` is the primary coordinate source and is shared with Obsidian Leaflet;
- `mapmarker` and `mapzoom` are collected for compatibility; custom marker icons and
  advanced marker visibility are not required in MVP;
- `description` or `summary` may provide slide text;
- `cover`, `image`, or `media` may provide slide media;
- with `noteDisplay: full`, the frontmatter-stripped note body becomes slide text;
  otherwise the body is not used.

## 9. Note resolution precedence

When an adapter resolves an explicit or discovered note: explicit slide properties win,
then note frontmatter fills missing values, then story-level map defaults apply last. The
story definition controls presentation; note frontmatter provides reusable place/content
metadata.

## 10. Obsidian view behavior

The plugin uses a file-backed `TextFileView`. Required behavior:

- StoryMap fills the full Workspace leaf content area (height forced to `100%`);
- the same file switches between StoryMap and Markdown views without changing source;
- commands/menu include `Open as Story Map` and `Open as Markdown`, including the StoryMap
  pane menu;
- opening a detected `story-map: true` document shows the StoryMap view by default;
  `Open as Markdown` opts that file out until `Open as Story Map` is invoked again;
- tab title follows the Markdown filename; split panes and pop-out windows keep working;
- `noteDisplay: link` registers a Page preview hover source and opens the note in a new tab;
- plugin settings provide defaults; changing them refreshes open views;
- invalid frontmatter or YAML produces an in-view error rather than breaking the workspace;
- React and Leaflet instances are destroyed cleanly on unload, and pane/container resize
  invalidates the Leaflet size.

Default-open is limited to detected `story-map: true` documents and uses a scoped
`WorkspaceLeaf.setViewState` wrapper. Blanket interception of unrelated Markdown files is
out of scope.

## 11. React API

```tsx
<StoryMap
  story={story}
  initialSlide={0}
  onSlideChange={(index, slide) => {}}
/>
```

MVP behavior: Previous/Next buttons, Left/Right keyboard navigation, slide counter, active
slide `flyTo`, a small circle marker per located slide, an optional path polyline, responsive
resize handling, and no scroll mode.

## 12. MVP acceptance criteria

The MVP is complete when all are true:

- `pnpm typecheck`, `pnpm test`, and `pnpm build` succeed;
- core parser tests cover `noteFolder`, `order`, `dateField`, and camelCase source config;
- a React app renders a two-slide StoryMap without platform-specific APIs;
- a `story-map: true` Markdown file opens as a dedicated full-leaf StoryMap view and can
  switch back to Markdown without changing source content;
- `noteFolder` recursively finds eligible `story-map-note: true` notes;
- folder-generated notes sort by `dateField` using `order: asc | desc`, defaulting to
  `date-created` ascending;
- explicit `slides` are never reordered or appended to by `noteFolder`;
- a note may reuse Leaflet-compatible `location`, `mapmarker`, and `mapzoom`;
- an explicit Obsidian slide can use `note: "[[Some Note]]"` and inherit
  `location/title/description/cover`;
- resizing an Obsidian pane keeps the map correctly sized;
- closing/reopening or switching views does not leak React roots or Leaflet maps;
- Remark transforms the same block and applies equivalent note-folder resolution when
  `vaultRoot` is configured;
- Docusaurus mounts `react-story-map` after a static build without importing Leaflet during
  Node SSR;
- local-platform concerns stay outside `react-story-map`.

## 13. Deferred work

- visual authoring/editor UI;
- blanket `WorkspaceLeaf` interception of unrelated Markdown opens;
- multiple `noteFolder` sources;
- custom `sortBy`, secondary sorting, grouping, filtering, or query syntax;
- scrollama/scrollytelling mode;
- MapLibre adapter;
- `CRS.Simple`/gigapixel mode;
- GeoJSON/GPX;
- advanced marker icon compatibility and Leaflet `mapzoom` visibility semantics;
- WikiLink rendering inside story Markdown body;
- automated copying of every Vault asset into Docusaurus static output;
- Markdown files outside the active Vault/filesystem `vaultRoot`.
