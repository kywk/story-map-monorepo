# Conversation Summary

## Objective

Recreate the useful core of Knight Lab StoryMap with modern TypeScript/React while making it easy to use in three contexts:

- standalone React applications;
- Obsidian Vault notes;
- Docusaurus sites built from the same Obsidian-oriented Markdown content.

## Decisions reached

### Leaflet is the MVP map engine

The initial discussion considered MapLibre because of its camera, vector-tile, pitch, bearing, and 3D capabilities. After considering the existing workflow, Leaflet became the better default for v1 because:

- the Obsidian Vault already uses the community Obsidian Leaflet plugin;
- an existing `remark-obsidian-leaflet` plugin already publishes compatible map content to Docusaurus;
- the intended StoryMap features mainly need pan/zoom/flyTo, markers, paths, raster tiles, and mobile-friendly rendering;
- keeping one map ecosystem reduces bundle, CSS, content-model, and maintenance duplication.

MapLibre remains a possible later renderer if vector/3D requirements become real.

### Reuse conventions, not the Obsidian Leaflet runtime

StoryMap should not depend on the community Obsidian Leaflet plugin at runtime. Instead it should reuse familiar content conventions where useful, such as:

- `location` frontmatter;
- `lat` / `long`;
- `defaultZoom`;
- `tileServer`;
- WikiLinks;
- local attachments;
- note-driven markers/content.

This keeps StoryMap independent while fitting the existing Vault.

### `react-story-map` is the reusable renderer

`react-story-map` encapsulates:

- Leaflet map lifecycle;
- paged StoryMap presentation;
- previous/next navigation;
- camera synchronization;
- markers and route line;
- media and Markdown text rendering.

It can be imported by a normal React application without Obsidian or Docusaurus.

### Platform plugins are resolvers/adapters

Obsidian and Docusaurus/Remark collect platform-specific information first, then call the common renderer with normalized data.

```text
Vault-specific information
        |
        v
Obsidian/Remark resolver
        |
        v
StoryMapConfig
        |
        v
react-story-map
```

`react-story-map` must not receive `app.vault`, Obsidian `TFile`, remark AST nodes, or Docusaurus APIs.

### A small pure core is still useful

A separate `story-map-core` package holds schema, parser, TypeScript types, and small normalization helpers. It is not intended to become a complex domain framework.

## Existing publishing context

The existing Docusaurus remark plugin already demonstrates the desired publishing pattern:

```text
Obsidian fenced block
  -> remark build-time transform
  -> serialized browser configuration
  -> client-side interactive map
```

The StoryMap package follows the same shape, but standardizes the final configuration around `StoryMapConfig` and delegates interactive rendering to `react-story-map`.

## MVP scope

Include:

- paged slides;
- Leaflet `flyTo`;
- markers and path line;
- text, image, video, iframe;
- YAML fenced block;
- note/frontmatter inheritance;
- Obsidian WikiLink and attachment resolution;
- Remark build-time note resolution;
- client-side Docusaurus hydration.

Defer:

- scroll mode;
- visual editor;
- MapLibre;
- advanced GIS layers;
- gigapixel/image maps;
- comprehensive compatibility with every Obsidian Leaflet option.
