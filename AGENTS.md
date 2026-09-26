# AGENTS.md

## Mission

Deliver the StoryMap v1 MVP described in `SPEC.md` with the least architectural surface necessary.

The Obsidian file-backed MVP is the current behavioral baseline. The active milestone is the Remark/Docusaurus publishing path: make `remark-story-map` resolve the same StoryMap source with equivalent note discovery, ordering, inheritance, and `noteDisplay` semantics, then mount the shared renderer cleanly in Docusaurus.

## Source of truth

1. `SPEC.md` — product and architecture contract.
2. `docs/implementation-plan.md` — current milestone work order and acceptance checks.
3. `docs/handoff.md` — current Docusaurus/Remark implementation handoff.
4. Existing package APIs and tests in this repository.

If a task conflicts with `SPEC.md`, change the implementation to match the spec rather than inventing a new architecture.

## Current source conventions

- StoryMap document frontmatter: `story-map: true`.
- StoryMap note discovery frontmatter: `story-map-note: true`.
- StoryMap fenced language: `story-map`.
- StoryMap configuration keys use camelCase.
- `noteFolder` supports one Vault-relative folder in v1 and includes subfolders recursively.
- Folder-generated slide order is controlled only by:
  - `order: asc | desc`, default `asc`;
  - `dateField`, default `date-created`.
- Explicit `slides` preserve exact author order and are never implicitly appended to or reordered by folder discovery.
- Reuse Leaflet-compatible note metadata such as `location`, `mapmarker`, and `mapzoom`.
- Note presentation is controlled by `noteDisplay: basic | link | full`, default `link`:
  - `basic` uses frontmatter metadata only;
  - `link` adds an adapter-resolved `notePath`;
  - `full` uses the frontmatter-stripped note body as slide text.
- `link` is platform-specific only at navigation time:
  - Obsidian uses callbacks for preview/open behavior;
  - Docusaurus resolves the final published route and uses a normal browser link.
- Explicit slide properties override note-derived values.
- `story-map-core` remains the shared parser/normalization layer; do not duplicate these rules in adapters.

## Current Docusaurus milestone decisions

- `remark-story-map` is the build-time platform adapter.
- `react-story-map` remains the only StoryMap renderer.
- Remark must not initialize Leaflet during build.
- Docusaurus route/slug rules are host-owned. Add a small route resolver hook; do not add StoryMap-specific slug normalization.
- In the target `kywk.github.io` site, `scripts/content-links.js` / `remark-slug-normalizer` remains the route authority.
- `vaultRoot` scanning must skip obvious tooling/output directories such as dot-directories, `node_modules`, `build`, `dist`, and `coverage`.
- Relative media must use source context:
  - note-derived media resolves relative to the note;
  - explicit slide media resolves relative to the StoryMap source document.
- The browser client must handle Docusaurus SPA insertion/removal without duplicate mounts or leaked React roots.
- Docusaurus theme adaptation belongs in a host CSS bridge using StoryMap semantic variables.
- Lazy-loading client renderer code is desirable when a page actually contains StoryMap hosts, but do not redesign package boundaries to achieve it.

## Obsidian default settings

Defaultable `story-map` keys in the Obsidian plugin remain:

- `order`
- `dateField`
- `noteDisplay`
- `map.zoom`
- `map.minZoom`
- `map.maxZoom`
- `map.tileUrl`
- `map.attribution`
- `map.showPath`

Resolution order is:

1. document block;
2. Obsidian plugin setting;
3. built-in default.

Per-document keys (`schema`, `id`, `title`, `noteFolder`, `map.center`, `slides`, `height`) must not become global plugin defaults.

The Remark adapter does not need to mirror Obsidian Settings UI; it uses source values plus built-in defaults.

## Non-goals

Do not introduce unless explicitly requested:

- Nx, Turborepo, Bazel, changesets, semantic-release;
- Redux/Zustand;
- React Leaflet;
- MapLibre;
- visual editors;
- scroll-driven storytelling;
- a generic plugin framework;
- premature abstraction for multiple map engines;
- multiple `noteFolder` sources;
- generic `sortBy`, grouping, filtering, or query syntax;
- a generic route/slug framework;
- automated copying of all Vault assets;
- marker popup parity with the old Docusaurus Leaflet plugin;
- advanced marker icons or `mapzoom` visibility semantics;
- WikiLink/embed expansion inside full note Markdown.

## Package boundaries

### `packages/story-map-core`

- framework agnostic;
- no DOM, React, Leaflet, Obsidian, Docusaurus, or Node filesystem dependencies;
- owns schema, parsing behavior, source defaults, WikiLink parsing, date sorting, frontmatter stripping, and small normalization helpers;
- does not scan folders or read files.

### `packages/react-story-map`

- owns UI and Leaflet rendering;
- must remain SSR-import-safe;
- dynamically imports Leaflet inside client effects;
- owns generic resize handling such as `invalidateSize()`;
- may render a normal `href` when `slide.notePath` exists and no platform callback is supplied;
- must not import Obsidian, Docusaurus, or Node filesystem APIs;
- must not know about `noteFolder`, Vault scanning, or slug rules.

### `packages/obsidian-story-map`

- is the existing platform reference implementation;
- may import Obsidian APIs;
- resolves Vault-specific content and `noteFolder`;
- passes a resolved `StoryMapConfig` to the renderer;
- preserves Markdown <-> StoryMap view switching and existing behavior;
- is not the active feature-development target unless a cross-package regression requires a fix.

### `packages/remark-story-map`

- build-time entry may use Node filesystem APIs;
- browser client entry must not use Node APIs;
- resolves explicit notes, `noteFolder`, ordering, note display, routes, and media into a standard `StoryMapConfig`;
- transforms content but never initializes Leaflet during build;
- browser runtime mounts/unmounts shared React StoryMaps;
- does not own Docusaurus slug policy.

## Collaboration rules

When multiple agents work in parallel:

- each agent owns one package directory;
- the main work owner is `packages/remark-story-map/**`;
- renderer changes required for normal `notePath` links belong to `packages/react-story-map/**`;
- shared helpers belong to `packages/story-map-core/**` only when they are truly platform-neutral;
- avoid editing Obsidian package files unless fixing a regression;
- avoid editing root config unless assigned as integrator;
- do not rename shared public types without coordinating consumers;
- prefer small commits grouped by package responsibility;
- add focused tests before expanding implementation;
- do not expand sorting beyond `order` + `dateField`.

## Definition of done

Before claiming completion:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Then smoke-test:

1. existing standalone React rendering still works;
2. existing Obsidian tests/build remain green;
3. Remark explicit note resolution;
4. recursive `noteFolder` discovery;
5. asc/desc date ordering;
6. `noteDisplay` basic/link/full;
7. source-relative and note-relative media;
8. multiple StoryMaps on one page;
9. browser host removal unmounts the corresponding React root;
10. Docusaurus SSR/build never initializes Leaflet;
11. Docusaurus theme bridge renders readable light/dark UI;
12. target-site route resolver uses the existing published-content index.

Do not mark deferred features as implemented unless they are tested end to end.
