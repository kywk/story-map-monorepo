# Architecture

Concrete map of the implemented StoryMap stack. For product intent and the durable contract
see `../SPEC.md`; this document tracks the code as it exists today.

## 1. Repository layout

```text
story-map-monorepo/
  package.json                 pnpm workspace root scripts
  pnpm-workspace.yaml          packages/* and examples/*
  tsconfig.base.json           shared strict TS options
  SPEC.md AGENTS.md README.md  contract, working agreement, overview
  docs/                        this architecture doc + history/
  packages/
    story-map-core/            schema, parser, pure helpers (published)
    react-story-map/           React + Leaflet renderer (published)
    remark-story-map/          Remark transform + browser client (published)
    obsidian-story-map/        Obsidian plugin (private)
  examples/
    basic.md                   sample story-map document
    react/                     standalone Vite app
    docusaurus/                config snippets for a Docusaurus site
```

## 2. Dependency graph

```text
story-map-core  <--  react-story-map  <--  obsidian-story-map (private, bundled with esbuild)
       ^                     ^
       |                     |
       +---- remark-story-map (index.ts build-time, client.tsx browser)
```

Rules enforced by convention and review:

- `story-map-core` imports nothing from the other packages and no platform APIs.
- `react-story-map` imports `story-map-core` and Leaflet (dynamically), never Obsidian/Node.
- `obsidian-story-map` bundles its workspace dependencies through `esbuild.config.mjs`.
- `remark-story-map` may use Node `fs` in `index.ts`/`vault.ts`; `client.tsx` must not.

## 3. Data flow

```text
Markdown document (story-map: true)
  |  extractFencedBlock(markdown, 'story-map')
  v
parseStoryMapSourceYaml(block, defaults)   -> StoryMapSourceConfig
  |  adapter resolves noteFolder / explicit slide.note / media
  v
toStoryMapConfig(source, resolvedSlides)   -> StoryMapConfig
  |  <StoryMap story={config} />
  v
react-story-map (Leaflet) renders slides on a map
```

Adapters differ only in *how* they resolve the source:

- **Obsidian** (`view.tsx` -> `resolver.ts`): reads Vault metadata for notes, recursive
  `noteFolder` scan, local attachment URLs, note title link + page preview callbacks.
- **Remark** (`index.ts` -> `vault.ts`): at build time scans a filesystem Vault when
  `vaultRoot` is set, then serializes the normalized config into an HTML placeholder.
  `client.tsx` hydrates every placeholder in the browser.
- **Standalone React**: builds `StoryMapConfig` directly and renders `<StoryMap />`.

## 4. Package APIs

### `@story-map/story-map-core`

Exported from `src/index.ts`.

- `types.ts` — `StoryMapConfig`, `StoryMapSourceConfig`, `StorySlide`, `StoryLocation`,
  `StoryMedia`, `StoryMapOptions`, `StoryMapSourceDefaults`, `StoryOrder`,
  `StoryNoteDisplay`, and `DEFAULT_STORY_ORDER` / `DEFAULT_DATE_FIELD` /
  `DEFAULT_NOTE_DISPLAY`.
- `schema.ts` — Zod `storyMapSchema`, `storyMapSourceSchema`, `storySlideSchema` (ranges,
  enums, built-in defaults).
- `parser.ts` — `parseStoryMapYaml`, `parseStoryMapObject`, `parseStoryMapSourceYaml`,
  `parseStoryMapSourceObject`, `applySourceDefaults`, `normalizeStoryMapInput`,
  `toStoryMapConfig`, `extractFencedBlock`, `StoryMapParseError`.
- `helpers.ts` — `parseWikiLinkRef`, `stripFrontmatter`, `coerceLocation`, `coerceMedia`,
  `mergeResolvedSlide`, `validCoordinates`, `slideFromNoteFrontmatter`, `toTimestamp`,
  `compareNoteDates`, `sortNoteDates`, `normalizeVaultFolder`, `isPathInFolder`.

Key invariants:

- `normalizeStoryMapInput` folds Leaflet-style root keys (`lat`/`long`/`lng`,
  `defaultZoom`, `tileServer`), `location: [lat, lng]` and comma-string locations, and
  string media into the canonical shape before validation.
- `applySourceDefaults` only fills keys the document omitted; document values always win.
- `mergeResolvedSlide` makes explicit slide values win over note frontmatter, except that
  `location` and `media` fall back to the resolved note value when the slide omits them.
- `sortNoteDates` keeps notes with missing/unparseable dates last, then breaks ties by
  Vault-relative path ascending in both directions.

### `@story-map/react-story-map`

`src/index.ts` exports `StoryMap` and `StoryMapProps` plus the core public types (re-export).

```tsx
<StoryMap
  story={config}
  initialSlide={0}
  onSlideChange={(index, slide) => {}}
  onNoteClick={(notePath, event) => {}}
  onNoteHover={(notePath, targetEl, event) => {}}
  noteLinkClassName="internal-link"
/>
```

- Leaflet is loaded with `await import('leaflet')` inside the mount effect, so the package
  is SSR-import-safe.
- The map is rebuilt only when `story` changes; changing slides calls `flyTo` and restyles
  markers without recreating the map.
- `ResizeObserver` calls `invalidateSize()` on the map container.
- `onNoteClick`/`onNoteHover` are optional host hooks; when present and `slide.notePath`
  is set, the slide title renders as an interactive link.

### `@story-map/obsidian-story-map`

- `main.tsx` — `StoryMapPlugin`: registers the view and hover-link source, adds
  `Open as Story Map` / `Open as Markdown` commands and file/pane menu entries, patches
  `WorkspaceLeaf.setViewState` (scoped: only detected `story-map: true` files with no
  per-file Markdown opt-out), owns settings and view refresh.
- `view.tsx` — `StoryMapView extends TextFileView`: extracts the fence, parses with
  `getSourceDefaults()`, resolves slides, mounts `StoryMap` with `height: '100%'`, and
  renders an in-view error on invalid config. Uses a `renderToken` to ignore stale async
  renders.
- `resolver.ts` — `resolveObsidianStory(app, source, sourcePath)`: explicit slides vs.
  recursive `noteFolder` discovery, frontmatter inheritance, local media → resource URL,
  `noteDisplay` handling.
- `detect.ts` — `isStoryMapFile` reads `story-map: true` frontmatter.
- `settings-data.ts` / `settings-tab.ts` — plugin defaults and their UI.
- `constants.ts` — view type, fence language, hover-link identifiers.
- `esbuild.config.mjs` — bundles `src/main.tsx` to `dist/main.js` (CJS, `obsidian`
  external) and copies CSS/manifest/versions.

### `@story-map/remark-story-map`

- `index.ts` — default export `remarkStoryMap(options)`: replaces each `story-map` code
  node with `<div class="story-map-host" data-story-map-config="...">`. With `vaultRoot`,
  uses `VaultIndex`; otherwise only explicit slides are kept.
- `vault.ts` — `VaultIndex`: scans a directory, indexes notes by relative path and
  basename, resolves explicit WikiLinks (ambiguous basenames throw) and folder discovery,
  and rewrites local media against `assetBase`.
- `client.tsx` — `mountStoryMaps` / `startStoryMapClient`: parses the encoded config and
  mounts `<StoryMap />`; safe to import in SSR because it guards on `typeof document`.

## 5. Source document conventions

- Document frontmatter: `story-map: true`.
- Discoverable note frontmatter: `story-map-note: true`.
- Fence language: `story-map`.
- Config keys are camelCase; frontmatter role flags stay kebab-case.
- `noteFolder` is one Vault-relative folder, recursive.
- `order: asc | desc` and `dateField` are the only folder-ordering controls.
- Explicit `slides` keep their exact order; `noteFolder` is ignored when they exist.

## 6. Default resolution

For the Obsidian adapter (and Remark defaults when passed), each defaultable key resolves:
document block -> plugin setting -> built-in code default.

| Key | Built-in default | Defaultable in plugin settings |
| --- | --- | --- |
| `schema` | `storymap/v1` | no (document only) |
| `id`, `title` | — | no (document only) |
| `height` | `520px` | no (`100%` forced in Obsidian) |
| `noteFolder` | — | no (document only) |
| `order` | `asc` | yes |
| `dateField` | `date-created` | yes |
| `noteDisplay` | `link` | yes |
| `map.center` | — | no (document only) |
| `map.zoom` | `6` | yes |
| `map.minZoom`, `map.maxZoom` | — | yes |
| `map.tileUrl` | OpenStreetMap standard | yes |
| `map.attribution` | `© OpenStreetMap contributors` | yes |
| `map.showPath` | `true` | yes |
| `slides` | — | no (document only) |

When adding a defaultable key: add it to `story-map-core` schema + `applySourceDefaults`,
to `settings-data.ts` and `settings-tab.ts`, and cover precedence in `parser.test.ts`. Do
not re-implement defaulting in the view.

## 7. Note display modes

`noteDisplay` controls how a resolved note appears in the slide panel:

- `basic` — frontmatter basics only.
- `link` — basics, slide title links to the note (Obsidian page preview on hover, open in
  new tab on click); the renderer receives an opaque `slide.notePath` plus host callbacks.
- `full` — basics plus the frontmatter-stripped note body as slide text.

## 8. Commands

```bash
corepack enable
pnpm install
pnpm typecheck        # tsc -b through project references
pnpm test             # vitest run in core, obsidian, remark
pnpm build            # tsc -b for libraries, esbuild for the plugin
pnpm dev:obsidian     # build core + react, then obsidian dev (single build, not watch)
pnpm --filter @story-map/example-react dev
pnpm --filter @story-map/obsidian-story-map build
```

Plugin artifacts land in `packages/obsidian-story-map/dist/` as `main.js`, `manifest.json`,
`styles.css`, and `versions.json`; copy them to `<Vault>/.obsidian/plugins/story-map/`.
Release steps are in `../RELEASING.md`.

## 9. Tests

| Location | Covers |
| --- | --- |
| `packages/story-map-core/src/parser.test.ts` | parsing, normalization, defaults, ordering, fence extraction, helpers |
| `packages/obsidian-story-map/src/resolver.test.ts` | explicit slides, folder discovery, note display, media resolution |
| `packages/obsidian-story-map/src/settings-data.test.ts` | settings → source defaults mapping |
| `packages/remark-story-map/src/index.test.ts` | Remark transform, `VaultIndex`, folder discovery |

`react-story-map` and the examples have no automated tests; verify them manually.

## 10. Where to change what

| Change | Touch |
| --- | --- |
| Schema/defaults/normalization | `story-map-core` (`schema.ts`, `parser.ts`, `types.ts`) + `parser.test.ts` |
| Rendering, navigation, markers, media | `react-story-map/src/StoryMap.tsx`, `styles.css` |
| Obsidian view, commands, settings, detection | `obsidian-story-map/src/*` |
| Obsidian note/media resolution | `obsidian-story-map/src/resolver.ts` |
| Remark/Docusaurus pipeline | `remark-story-map/src/index.ts`, `vault.ts`, `client.tsx` |
| A new defaultable setting | core schema + defaults, `settings-data.ts`, `settings-tab.ts`, parser tests |

## 11. History

Completed planning material from the initial milestone lives in
`history/2026-09-25-init/`. It is archival; the current contract is `SPEC.md` plus this
document.
