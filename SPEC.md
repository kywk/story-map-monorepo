# StoryMap MVP Specification

## 1. Goal

Build a small, reusable StoryMap stack centered on one standard `StoryMapConfig` model.

The first MVP must support:

1. standalone React usage;
2. an Obsidian file-backed full-leaf StoryMap view;
3. Docusaurus/Remark publishing of the same Obsidian-oriented Markdown source;
4. Leaflet map navigation synchronized with paged story slides;
5. note discovery from one configured Vault folder and all of its subfolders.

The implementation should stay intentionally small. Do not add a visual editor, scroll-driven storytelling, MapLibre, 3D maps, GPX, GeoJSON editing, query languages, arbitrary filtering/grouping, or a plugin framework in v1.

## 2. Source document model

### 2.1 StoryMap document

A StoryMap document is a normal Markdown file with:

```yaml
---
story-map: true
---
```

and one `story-map` fenced code block containing the StoryMap configuration:

````markdown
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

For the Obsidian full-leaf view, the document-level StoryMap configuration is read from this fenced block. Multiple StoryMap configuration blocks in one StoryMap document are out of scope for v1.

### 2.2 StoryMap note

A folder-discovered StoryMap note is a normal Markdown file with:

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

The same note may also be consumed by Obsidian Leaflet. StoryMap intentionally reuses Leaflet-compatible geographic frontmatter instead of introducing a second coordinate schema.

`story-map-note: true` is required for automatic `noteFolder` discovery. An explicitly referenced `slide.note` remains an explicit authoring decision and does not require this flag.

## 3. Naming conventions

StoryMap fenced configuration uses camelCase keys consistently, matching familiar Obsidian Leaflet-style configuration such as `markerFolder` and `defaultZoom`.

Examples:

- `noteFolder`
- `dateField`
- `showPath`
- `tileUrl`
- `defaultZoom`

Markdown frontmatter role flags remain kebab-case:

- `story-map: true`
- `story-map-note: true`

The configured date field name is a value, not a StoryMap configuration key. Its default value is `date-created`.

## 4. Architecture

```text
Vault / Markdown / API
        |
        v
platform adapter / resolver
        |
        v
@story-map/story-map-core
        |
        v
standard StoryMapConfig
        |
        v
@story-map/react-story-map
        |
        v
React + Leaflet UI
```

Platform adapters:

```text
Obsidian Vault ----> obsidian-story-map ----\
                                             ---> StoryMapConfig ---> react-story-map
Docusaurus build --> remark-story-map -----/
Standalone app ----------------------------/
```

The Obsidian adapter renders `react-story-map` as a dedicated file-backed workspace view. Docusaurus/Remark renders the same StoryMap source as an embedded browser component.

## 5. Package responsibilities

### `story-map-core`

Owns:

- `StoryMapConfig`, `StorySlide`, `StoryLocation`, `StoryMedia` types;
- YAML parsing and validation;
- source configuration normalization;
- `noteFolder`, `order`, `dateField`, and `noteDisplay` configuration types/defaults;
- normalization of a small set of Obsidian Leaflet-compatible keys;
- WikiLink reference parsing helpers;
- location coercion helpers used by adapters.

Must not import:

- React;
- Leaflet;
- Obsidian;
- Docusaurus;
- Node `fs` APIs.

Folder scanning, file metadata access, and date extraction from real files belong to platform adapters.

### `react-story-map`

Owns:

- React `<StoryMap />` component;
- Leaflet instance lifecycle;
- paged slide navigation;
- map `flyTo` synchronization;
- markers and optional path polyline;
- image/video/iframe media;
- Markdown text rendering;
- resize handling, including Leaflet `invalidateSize()`;
- minimal responsive CSS.

Must not know what a Vault, WikiLink, frontmatter file, note folder, or Docusaurus route is.

### `obsidian-story-map`

Owns:

- registering a dedicated StoryMap `TextFileView`;
- detecting `story-map: true` StoryMap documents;
- extracting and parsing the document's `story-map` fenced configuration;
- switching between StoryMap view and Markdown view;
- opening detected StoryMap documents in the StoryMap view by default;
- recursively scanning configured `noteFolder`;
- including only folder-discovered Markdown files with `story-map-note: true`;
- reading the configured `dateField` from note frontmatter;
- applying the configured `noteDisplay` mode (basics, title link, or full note body);
- providing a settings tab whose defaults fill keys a document omits;
- refreshing open StoryMap views when default settings change;
- applying `order: asc | desc` to automatically discovered notes;
- resolving explicit `slide.note` WikiLinks;
- reading note frontmatter through Obsidian metadata APIs;
- converting Vault attachment paths to resource URLs;
- React mount/unmount lifecycle;
- filling the complete Workspace leaf content area.

The v1 implementation must not monkey-patch `WorkspaceLeaf` to force StoryMap view automatically when a Markdown file is opened.

### `remark-story-map`

Owns:

- finding `story-map` fenced code blocks at build time;
- optional Vault directory indexing through configured `vaultRoot`;
- recursively resolving `noteFolder` when a filesystem-backed Vault is available;
- filtering folder-discovered notes by `story-map-note: true`;
- applying the same `dateField` and `order` rules as the Obsidian adapter;
- resolving note frontmatter to a normal `StoryMapConfig`;
- serializing the config into a browser-safe HTML placeholder;
- a client entry that hydrates placeholders with `<StoryMap />`.

Remark does not render Leaflet at build time.

## 6. Story source configuration v1

Source YAML is author-facing and uses camelCase.

```ts
interface StoryMapSourceConfig {
  schema: 'storymap/v1';
  id?: string;
  title?: string;
  height?: string;

  noteFolder?: string;
  order?: 'asc' | 'desc';       // default: 'asc'
  dateField?: string;           // default: 'date-created'
  noteDisplay?: 'basic' | 'link' | 'full';  // default: 'link'

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

`noteFolder` is a Vault-relative folder path and includes all nested subfolders recursively.

Only one `noteFolder` is supported in v1.

### 6.1 Explicit slides

When `slides` is present and non-empty:

- slide sequence is exactly the configured `slides` sequence;
- `noteFolder` does not append automatically discovered slides;
- `order` and `dateField` do not reorder explicit slides;
- explicit `slide.note` references are resolved normally.

### 6.2 Folder-generated slides

When `slides` is absent or empty and `noteFolder` is configured:

1. recursively scan the folder and its subfolders;
2. consider Markdown files only;
3. include only files with `story-map-note: true`;
4. read the configured frontmatter field named by `dateField`;
5. sort valid dates by `order`;
6. produce one slide per included note.

Defaults:

```yaml
order: asc
dateField: date-created
```

No other configurable sorting, grouping, filtering, or query behavior is part of v1.

For deterministic behavior, notes with a missing or unparseable date are retained after notes with valid dates. Ties are resolved by Vault-relative path ascending. These are internal stability rules, not configurable sort features.

### 6.3 Note display

`noteDisplay` selects how a resolved note is presented in the slide panel:

- `basic` — frontmatter-derived basics only (`title`, `location`, `description`/`summary`, `cover`);
- `link` — the same basics, but the slide title links to the source note; hovering shows the
  Obsidian page preview and clicking opens the note in a new tab (default);
- `full` — the same basics, with the note's Markdown body (frontmatter stripped) used as slide text.

The renderer stays platform-agnostic: the Obsidian adapter resolves `link` into an opaque
`slide.notePath` plus host callbacks, and resolves `full` into `slide.text`.

### 6.4 Default precedence

In the Obsidian adapter, source configuration values resolve in this order:

1. keys present in the document's `story-map` block win;
2. otherwise the plugin's default settings are used;
3. otherwise built-in code defaults apply.

The plugin settings screen exposes defaults for `order`, `dateField`, `noteDisplay`, and the
`map` keys `zoom`, `minZoom`, `maxZoom`, `tileUrl`, `attribution`, and `showPath`. Values that
vary per story — `schema`, `id`, `title`, `noteFolder`, `map.center`, `slides`, and `height` —
are document-only (`height` is forced to `100%` in the Obsidian full-leaf host).

## 7. Canonical render model

Platform adapters resolve source-specific behavior before rendering.

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
  note?: string; // adapter input; renderer ignores unresolved references
  notePath?: string; // adapter-resolved opaque source reference for link display
  title?: string;
  text?: string;
  location?: {
    lat: number;
    lng: number;
    zoom?: number;
  };
  media?: {
    type: 'image' | 'video' | 'iframe';
    src: string;
    alt?: string;
    caption?: string;
  };
}
```

Accepted convenience forms include:

- `location: [lat, lng]`;
- `media: ./image.jpg` -> image media;
- root-level Leaflet-like `lat`, `long`, `defaultZoom`, and `tileServer`, normalized into canonical map fields.

## 8. Note metadata and Leaflet compatibility

Adapters recognize these note frontmatter fields for MVP:

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

Compatibility rules:

- `location` is the primary coordinate source and is shared with Obsidian Leaflet;
- `mapmarker` is collected for compatibility but custom marker icon rendering is not required in MVP;
- `mapzoom` may be collected for compatibility but advanced marker visibility behavior is not required in MVP;
- `description` or `summary` may provide slide text;
- `cover`, `image`, or `media` may provide slide media;
- with `noteDisplay: full`, the Markdown note body (frontmatter stripped) becomes slide text;
- otherwise the complete Markdown note body is not used as slide text.

## 9. Note resolution precedence

When an adapter resolves an explicit or discovered note:

1. explicit slide properties win;
2. note frontmatter fills missing values;
3. story-level map defaults are used last.

Story definition controls presentation; note frontmatter provides reusable place/content metadata.

## 10. Obsidian view behavior

The Obsidian plugin uses a file-backed `TextFileView`.

Required behavior:

- StoryMap uses the full Workspace leaf content area;
- the same Markdown file can switch between StoryMap and Markdown views;
- commands/menu actions include `Open as Story Map` and `Open as Markdown`;
- opening a detected `story-map: true` document shows it in the StoryMap view by default;
- `Open as Markdown` opts that file out until `Open as Story Map` is invoked again;
- `Open as Story Map` also appears in the StoryMap view's pane menu (`onPaneMenu`);
- tab title follows the Markdown filename;
- split panes and pop-out windows remain supported by normal Obsidian workspace behavior;
- StoryMap height is forced to `100%` in the Obsidian full-leaf host;
- source `height` remains meaningful to standalone/Docusaurus embedded hosts;
- React and Leaflet instances are destroyed cleanly when the view unloads;
- pane/container resize causes Leaflet size invalidation;
- note `link` display registers a Page preview hover source, shows the page preview on title
  hover, and opens the note in a new tab on title click;
- plugin settings provide story-map defaults; document values win over settings, which win over
  built-in defaults, and changing settings refreshes open views;
- invalid frontmatter or StoryMap YAML produces an in-view error rather than breaking the workspace.

Default-open behavior is limited to detected `story-map: true` documents and uses a scoped `WorkspaceLeaf.setViewState` wrapper (the same approach as the Kanban plugin) so a file is rewritten to the StoryMap view only when its frontmatter marks it as a StoryMap. Blanket interception of unrelated Markdown files remains out of scope.

## 11. React API

```tsx
<StoryMap
  story={story}
  initialSlide={0}
  onSlideChange={(index, slide) => {}}
/>
```

MVP behavior:

- Previous/Next buttons;
- keyboard Left/Right navigation;
- slide counter;
- active slide triggers `map.flyTo`;
- all located slides display a small circle marker;
- optional polyline connects located slides;
- responsive resize handling;
- no scroll mode in MVP.

## 12. MVP acceptance criteria

The MVP is complete when all are true:

- `pnpm typecheck`, `pnpm test`, and `pnpm build` succeed;
- core parser tests cover `noteFolder`, `order`, `dateField`, and camelCase source configuration;
- a React app can render a two-slide StoryMap without platform-specific APIs;
- an Obsidian Markdown file with `story-map: true` and a `story-map` fenced block opens as a dedicated full-leaf StoryMap view;
- the same file can switch back to Markdown view without changing source content;
- `noteFolder` recursively finds eligible `story-map-note: true` notes;
- folder-generated notes sort by `dateField` using `order: asc | desc`;
- default folder sorting uses `date-created` and ascending order;
- explicit `slides` are never reordered or implicitly appended to by `noteFolder`;
- a note may reuse Leaflet-compatible `location`, `mapmarker`, and `mapzoom` frontmatter;
- an explicit Obsidian slide can use `note: "[[Some Note]]"` and inherit `location/title/description/cover`;
- resizing an Obsidian pane keeps the Leaflet map correctly sized;
- closing/reopening or switching views does not leak React roots or Leaflet maps;
- Remark can transform the same `story-map` block and apply equivalent note-folder resolution when `vaultRoot` is configured;
- Docusaurus browser runtime mounts `react-story-map` after static build without importing Leaflet during Node SSR;
- local-platform concerns stay outside `react-story-map`.

## 13. Deferred work

Explicitly defer:

- visual authoring/editor UI;
- blanket `WorkspaceLeaf` interception of unrelated Markdown opens (a scoped `setViewState` wrapper is used only for detected `story-map: true` documents);
- multiple `noteFolder` sources;
- custom `sortBy`, secondary user-defined sort, grouping, filtering, or query syntax;
- scrollama/scrollytelling mode;
- MapLibre adapter;
- `CRS.Simple`/gigapixel mode;
- GeoJSON/GPX;
- advanced marker icon compatibility;
- Leaflet `mapzoom` visibility semantics;
- WikiLink rendering inside story Markdown body;
- automated copying of every Vault asset into Docusaurus static output;
- Markdown files outside the active Vault/filesystem `vaultRoot`.
