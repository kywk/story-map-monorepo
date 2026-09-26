# @story-map/story-map-core

Framework-independent StoryMap v1 types, YAML parsing, validation, defaults, and pure
note-metadata helpers. This package does not render maps, read files, or discover notes.

```sh
npm install @story-map/story-map-core
```

The package exports ES modules and TypeScript declarations. Use `import` from an ESM
application; no CommonJS build is provided.

## Parse a renderable StoryMap

Save this as `example.mjs` and run `node example.mjs` after installing the package:

```js
import { parseStoryMapYaml } from '@story-map/story-map-core';

const config = parseStoryMapYaml(`
title: Taipei walk
map:
  center: [25.033, 121.5654]
  zoom: 13
slides:
  - title: Taipei 101
    text: Start here.
    location: [25.033, 121.5654]
`);

console.log(config.schema); // storymap/v1
console.log(config.slides[0].location); // { lat: 25.033, lng: 121.5654 }
```

`parseStoryMapYaml(yaml)` and `parseStoryMapObject(value)` return `StoryMapConfig` and
require at least one slide. Invalid input throws; catch errors at your host's input
boundary. YAML, schema-validation, and coordinate-normalization errors can have different
error types.

## Parse source documents

`parseStoryMapSourceYaml(yaml, defaults?)` and
`parseStoryMapSourceObject(value, defaults?)` return `StoryMapSourceConfig`, which can
contain `noteFolder` and omit `slides`. Hosts resolve notes, routes, media, and folder
contents, then call `toStoryMapConfig(source, resolvedSlides)` to prepare renderer input.
That conversion copies fields; it does not validate or resolve the supplied slides.

Defaults have the following precedence: source value, supplied `StoryMapSourceDefaults`,
then built-in default. Supplied defaults support `order`, `dateField`, `noteDisplay`, and
map options other than `center`.

| Field | Built-in default |
| --- | --- |
| `schema` | `storymap/v1` |
| `height` | `520px` |
| `order` | `asc` |
| `dateField` | `date-created` |
| `noteDisplay` | `link` |
| `map.zoom` | `6` |
| `map.tileUrl` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| `map.attribution` | `© OpenStreetMap contributors` |
| `map.showPath` | `true` |

`map.center`, `map.minZoom`, and `map.maxZoom` are optional. All source keys use camelCase.

## Other exports

- Types: `StoryMapConfig`, `StoryMapSourceConfig`, `StoryMapSourceDefaults`, `StorySlide`,
  `StoryLocation`, `StoryMedia`, and related map/display/order types.
- Zod schemas: `storyMapSchema`, `storyMapSourceSchema`, and `storySlideSchema`.
- Source utilities: `extractFencedBlock(markdown, 'story-map')`, `applySourceDefaults`,
  and `normalizeStoryMapInput`.
- Pure helpers for frontmatter stripping, WikiLink references, location/media coercion,
  slide merging, note date ordering, and Vault-relative folder paths.

Rendering is provided by `@story-map/react-story-map`; build-time Markdown integration
is provided by `@story-map/remark-story-map`.

Licensed under MIT.
