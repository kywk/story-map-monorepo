# StoryMap MVP Specification

## 1. Goal

Build a small, reusable StoryMap stack centered on one standard `StoryMapConfig` model.

The MVP supports:

1. standalone React usage;
2. an Obsidian file-backed full-leaf StoryMap view;
3. Docusaurus/Remark publishing of the same Obsidian-oriented Markdown source;
4. Leaflet map navigation synchronized with paged story slides;
5. note discovery from one configured Vault folder and all of its subfolders.

The Obsidian MVP is now the reference implementation for platform semantics. The current milestone is to bring the Remark/Docusaurus path to practical feature parity where platform behavior can reasonably match.

The implementation must stay intentionally small. Do not add a visual editor, scroll-driven storytelling, MapLibre, 3D maps, GPX, GeoJSON editing, query languages, arbitrary filtering/grouping, or a generic plugin framework in v1.

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
noteDisplay: link

map:
  center: [-33.4489, -70.6693]
  zoom: 5
  showPath: true
```
````

For the Obsidian full-leaf view, the document-level StoryMap configuration is read from this fenced block.

For Docusaurus, the Remark plugin transforms the same fenced block at build time into a browser-safe serialized `StoryMapConfig` placeholder. The browser runtime mounts the shared React renderer after static rendering.

Multiple StoryMap configuration blocks in one Obsidian StoryMap document are out of scope for v1. The Remark transformer may still mount multiple independent StoryMap hosts when multiple blocks occur on an ordinary Docusaurus page.

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
- `noteDisplay`
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

The Obsidian adapter renders `react-story-map` as a dedicated file-backed workspace view.

Docusaurus/Remark resolves the same StoryMap source at build time, serializes only platform-neutral render data, and mounts the same renderer in the browser. Route resolution, filesystem access, Docusaurus URL policy, and platform-specific theme bridging remain outside `react-story-map`.

## 5. Package responsibilities

### `story-map-core`

Owns:

- `StoryMapConfig`, `StorySlide`, `StoryLocation`, `StoryMedia` types;
- YAML parsing and validation;
- source configuration normalization;
- `noteFolder`, `order`, `dateField`, and `noteDisplay` configuration types/defaults;
- normalization of a small set of Obsidian Leaflet-compatible keys;
- WikiLink reference parsing helpers;
- frontmatter stripping;
- location/media coercion helpers;
- deterministic note date sorting.

Must not import:

- React;
- Leaflet;
- Obsidian;
- Docusaurus;
- Node `fs` APIs.

Folder scanning, file metadata access, published-route resolution, and real asset resolution belong to platform adapters.

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
- minimal responsive CSS;
- generic note-title link rendering from an already-resolved `notePath`.

Must not know what a Vault, WikiLink, frontmatter file, note folder, Obsidian workspace, or Docusaurus route is.

If `slide.notePath` exists and host callbacks are provided, callbacks may override navigation behavior. If `slide.notePath` exists and no host callback is provided, the renderer must render a normal browser link. This allows Obsidian to keep Page Preview/open-in-new-tab behavior while Docusaurus uses a normal published URL.

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
- applying `noteDisplay: basic | link | full`;
- providing a settings tab whose defaults fill keys a document omits;
- refreshing open StoryMap views when default settings change;
- applying `order: asc | desc` to automatically discovered notes;
- resolving explicit `slide.note` WikiLinks;
- reading note frontmatter through Obsidian metadata APIs;
- converting Vault attachment paths to resource URLs;
- React mount/unmount lifecycle;
- filling the complete Workspace leaf content area.

The Obsidian implementation is the behavioral reference for note discovery, precedence, and `noteDisplay` semantics, except where browser/Docusaurus navigation necessarily differs.

### `remark-story-map`

Owns:

- finding `story-map` fenced code blocks at build time;
- optional Vault directory indexing through configured `vaultRoot`;
- recursively resolving `noteFolder` when a filesystem-backed Vault is available;
- filtering folder-discovered notes by `story-map-note: true`;
- applying the same `dateField` and `order` rules as the Obsidian adapter;
- applying equivalent `noteDisplay: basic | link | full` semantics;
- resolving explicit `slide.note` WikiLinks;
- resolving relative media using the referenced note or current StoryMap document as source context;
- accepting a host-provided published-route resolver for `noteDisplay: link`;
- serializing only normalized `StoryMapConfig` into a browser-safe HTML placeholder;
- a browser client entry that mounts placeholders with `<StoryMap />`;
- cleanly unmounting React roots when hosts are removed during SPA navigation;
- keeping build-time and browser-time code separated.

Remark does not render or initialize Leaflet at build time.

The package must not own Docusaurus slug policy. The host site supplies published note URLs. In the target `kywk.github.io` integration, `scripts/content-links.js` / `remark-slug-normalizer` remains the URL authority.

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
- explicit `slide.note` references are resolved normally;
- explicit slide properties override note-derived properties.

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
- `link` — the same basics plus a resolved `slide.notePath`;
- `full` — the same basics, with the note's Markdown body (frontmatter stripped) used as slide text.

Platform behavior for `link`:

- Obsidian resolves `notePath` to an opaque Vault reference and supplies callbacks for Page Preview and open-in-new-tab;
- Docusaurus resolves `notePath` to the final published route and uses a normal browser link.

For `full`, both adapters use the frontmatter-stripped Markdown body. Rendering remains platform-neutral; Obsidian/Docusaurus-specific WikiLink or embed expansion inside the body is not required in v1.

### 6.4 Default precedence

In the Obsidian adapter, source configuration values resolve in this order:

1. keys present in the document's `story-map` block win;
2. otherwise the plugin's default settings are used;
3. otherwise built-in code defaults apply.

The plugin settings screen exposes defaults for `order`, `dateField`, `noteDisplay`, and the map keys `zoom`, `minZoom`, `maxZoom`, `tileUrl`, `attribution`, and `showPath`.

Values that vary per story — `schema`, `id`, `title`, `noteFolder`, `map.center`, `slides`, and `height` — are document-only. `height` is forced to `100%` in the Obsidian full-leaf host and remains meaningful in standalone/Docusaurus embedded hosts.

Remark currently uses document values plus built-in defaults; it does not duplicate Obsidian plugin settings.

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
  note?: string;     // adapter input; renderer ignores unresolved references
  notePath?: string; // adapter-resolved opaque/published reference
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
  mapmarker?: string;
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
- with `noteDisplay: full`, the Markdown note body becomes slide text after frontmatter removal;
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
- tab title follows the Markdown filename;
- split panes and pop-out windows remain supported by normal Obsidian workspace behavior;
- StoryMap height is forced to `100%`;
- React and Leaflet instances are destroyed cleanly when the view unloads;
- pane/container resize causes Leaflet size invalidation;
- `noteDisplay: link` uses Page Preview on hover and opens the note in a new tab;
- invalid frontmatter or StoryMap YAML produces an in-view error rather than breaking the workspace.

Default-open behavior is limited to detected `story-map: true` documents and uses a scoped `WorkspaceLeaf.setViewState` wrapper. Blanket interception of unrelated Markdown files remains out of scope.

## 11. Docusaurus / Remark behavior

The Docusaurus path is build-time adapter plus browser runtime.

### 11.1 Build-time transform

For every `story-map` fenced block:

1. parse with `story-map-core`;
2. if `vaultRoot` exists, resolve explicit notes or `noteFolder`;
3. apply the same inheritance/order rules as Obsidian;
4. apply `noteDisplay`;
5. resolve local media into browser-facing URLs when possible;
6. serialize only normalized `StoryMapConfig`;
7. emit a `.story-map-host[data-story-map-config]` placeholder.

No Leaflet map is created during Node/SSR build.

### 11.2 Published note routes

`remark-story-map` may accept a route resolver callback such as:

```ts
interface RemarkStoryMapOptions {
  vaultRoot?: string;
  assetBase?: string;
  resolveNoteHref?: (vaultRelativePath: string) => string | undefined;
}
```

The exact callback shape may be adjusted if implementation constraints require it, but the architectural rule is fixed:

- StoryMap may ask the host to resolve a Vault-relative note;
- StoryMap must not duplicate Docusaurus slug/permalink logic.

For `kywk.github.io`, the existing content-link index / `deriveSlug()` pipeline is the source of truth.

### 11.3 Source-relative media

The transformer must have access to the current Markdown document path.

Relative media is resolved against:

- the referenced note when media came from note frontmatter;
- the current StoryMap source document when media was explicitly authored on the slide.

`assetBase` rewrites the resolved Vault-relative asset path to a browser URL. Automatic copying of Vault assets remains outside the package.

### 11.4 Filesystem scanning

`vaultRoot` may point at a repository that also contains Docusaurus tooling. Recursive indexing must avoid obvious non-content directories such as:

- dot-directories;
- `node_modules`;
- `build`;
- `dist`;
- `coverage`.

Do not introduce a generic glob/ignore subsystem in this milestone.

### 11.5 Browser runtime and SPA lifecycle

The browser entry:

- mounts every StoryMap host found on the page;
- does not double-mount an existing host;
- works after Docusaurus SPA navigation;
- unmounts React roots when their host nodes are removed;
- keeps Node APIs out of the browser entry;
- may lazy-load the renderer/client dependencies when a StoryMap host is actually present.

Leaflet remains dynamically imported by `react-story-map`.

### 11.6 Docusaurus theme bridge

The generic renderer owns semantic StoryMap CSS variables.

A Docusaurus host stylesheet maps Infima variables into StoryMap variables, for example:

```css
.story-map-host {
  --story-map-bg: var(--ifm-background-surface-color);
  --story-map-fg: var(--ifm-font-color-base);
  --story-map-muted: var(--ifm-color-emphasis-700);
  --story-map-border: var(--ifm-color-emphasis-300);
  --story-map-accent: var(--ifm-color-primary);
}
```

Do not hard-code Docusaurus/Infima variables inside the generic React package unless they are only optional fallbacks.

Dynamic light/dark tile provider switching is not required in this milestone. The required result is readable, theme-compatible StoryMap chrome/panel content.

## 12. React API

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
- normal `href` fallback for a resolved `slide.notePath` when platform callbacks are absent;
- no scroll mode in MVP.

## 13. MVP acceptance criteria

The Docusaurus/Remark milestone is complete when all are true:

- `pnpm typecheck`, `pnpm test`, and `pnpm build` succeed;
- existing Obsidian behavior and core parser behavior remain green;
- Remark transforms the same `story-map` fence used by Obsidian;
- explicit slides retain author order and override note frontmatter;
- `noteFolder` recursively finds eligible `story-map-note: true` notes;
- folder-generated notes sort by `dateField` using `order: asc | desc`;
- default folder sorting uses `date-created` ascending;
- `noteDisplay: basic` produces frontmatter-derived slide content only;
- `noteDisplay: link` resolves a published note route through a host callback and renders a normal browser link;
- `noteDisplay: full` uses the frontmatter-stripped Markdown note body;
- note-relative and source-document-relative media resolve from the correct source context;
- ambiguous WikiLink basename resolution fails clearly rather than choosing silently;
- filesystem indexing does not recursively scan `node_modules`, build output, or equivalent obvious tool directories;
- generated HTML does not expose unnecessary absolute Vault paths;
- Docusaurus browser runtime mounts multiple StoryMaps on one page;
- SPA navigation can add and remove StoryMap hosts without duplicate mounts or leaked React roots;
- Leaflet is never initialized during Node/SSR build;
- Docusaurus light/dark themes keep StoryMap UI readable through a host CSS bridge;
- the target `kywk.github.io` integration reuses its existing route/slug resolver rather than implementing StoryMap-specific slug rules;
- local-platform concerns stay outside `story-map-core` and `react-story-map`.

## 14. Deferred work

Explicitly defer:

- visual authoring/editor UI;
- multiple `noteFolder` sources;
- custom `sortBy`, secondary user-defined sort, grouping, filtering, or query syntax;
- scrollama/scrollytelling mode;
- MapLibre adapter;
- `CRS.Simple`/gigapixel mode;
- GeoJSON/GPX;
- advanced marker icon compatibility;
- Leaflet `mapzoom` visibility semantics;
- marker popup parity with the older Docusaurus Leaflet plugin;
- marker-click-to-slide navigation;
- WikiLink/embed rendering inside `noteDisplay: full` Markdown body;
- automated copying of every Vault asset into Docusaurus static output;
- dynamic Docusaurus light/dark tile provider switching;
- a generic Docusaurus plugin framework or generic route abstraction;
- Markdown files outside the configured filesystem `vaultRoot`.
