# StoryMap MVP Specification

## 1. Goal

Build a small, reusable StoryMap stack centered on one standard `StoryMapConfig` model.

The first MVP must support:

1. standalone React usage;
2. Obsidian fenced code blocks (`storymap`);
3. Docusaurus/Remark publishing of the same source content;
4. Leaflet map navigation synchronized with paged story slides.

The implementation should stay intentionally small. Do not add a visual editor, scroll-driven storytelling, MapLibre, 3D maps, GPX, GeoJSON editing, or a plugin framework in v1.

## 2. Architecture

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
Obsidian Vault ----> obsidian-story-map ----                                         ---> StoryMapConfig ---> react-story-map
Docusaurus build --> remark-story-map -----/
Standalone app ----------------------------/
```

## 3. Package responsibilities

### `story-map-core`

Owns:

- `StoryMapConfig`, `StorySlide`, `StoryLocation`, `StoryMedia` types;
- YAML parsing and validation;
- normalization of a small set of Obsidian Leaflet-compatible keys;
- WikiLink reference parsing helpers;
- location coercion helpers used by adapters.

Must not import:

- React;
- Leaflet;
- Obsidian;
- Docusaurus;
- Node `fs` APIs.

### `react-story-map`

Owns:

- React `<StoryMap />` component;
- Leaflet instance lifecycle;
- paged slide navigation;
- map `flyTo` synchronization;
- markers and optional path polyline;
- image/video/iframe media;
- Markdown text rendering;
- minimal responsive CSS.

Must not know what a Vault, WikiLink, frontmatter file, or Docusaurus route is.

### `obsidian-story-map`

Owns:

- `registerMarkdownCodeBlockProcessor('storymap', ...)`;
- resolving `[[WikiLinks]]` to Vault files;
- reading note frontmatter through Obsidian metadata APIs;
- converting Vault attachment paths to resource URLs;
- React mount/unmount lifecycle.

The adapter resolves source-specific information and passes a normal `StoryMapConfig` to `<StoryMap />`.

### `remark-story-map`

Owns:

- finding `storymap` fenced code blocks at build time;
- optional Vault directory indexing;
- resolving note frontmatter to a normal `StoryMapConfig`;
- serializing the config into a browser-safe HTML placeholder;
- a client entry that hydrates placeholders with `<StoryMap />`.

Remark does not render Leaflet at build time.

## 4. Story schema v1

Canonical shape:

```ts
interface StoryMapConfig {
  schema: 'storymap/v1';
  id?: string;
  title?: string;
  height: string;
  map: {
    center?: [number, number]; // [lat, lng]
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
  note?: string; // adapter input; renderer ignores it
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

Accepted convenience forms:

- `location: [lat, lng]`
- `media: ./image.jpg` -> image media
- root-level `lat`, `long`, `defaultZoom`, `tileServer` are normalized into `map` for easier migration from Obsidian Leaflet conventions.

## 5. Note resolution precedence

When an adapter resolves `slide.note`:

1. explicit slide properties win;
2. note frontmatter fills missing values;
3. story-level map defaults are used last.

Minimum frontmatter fields recognized by adapters:

```yaml
---
title: Santiago
location: [-33.4489, -70.6693]
description: A short introduction.
cover: ./santiago.jpg
mapmarker: city
---
```

`mapmarker` is collected for future compatibility but does not require a custom icon implementation in MVP.

## 6. React API

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
- no scroll mode in MVP.

## 7. MVP acceptance criteria

The MVP is complete when all are true:

- `pnpm build` succeeds for all packages;
- core parser tests pass;
- a React app can render a two-slide StoryMap without platform-specific APIs;
- Obsidian Reading View renders a `storymap` block and cleans up React on unload;
- an Obsidian slide can use `note: "[[Some Note]]"` and inherit `location/title/description/cover`;
- Remark can transform the same block and optionally resolve note frontmatter from a configured `vaultRoot`;
- Docusaurus browser runtime mounts `react-story-map` after static build without importing Leaflet during Node SSR;
- local-platform concerns stay outside `react-story-map`.

## 8. Deferred work

Explicitly defer:

- visual authoring/editor UI;
- scrollama/scrollytelling mode;
- MapLibre adapter;
- `CRS.Simple`/gigapixel mode;
- GeoJSON/GPX;
- advanced marker icon compatibility;
- WikiLink rendering inside story Markdown body;
- automated copying of every Vault asset into Docusaurus static output.
