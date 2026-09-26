# AGENTS.md

## Mission

Deliver the usable StoryMap MVP described in `SPEC.md` with the least architectural surface
necessary. The current priority is the Obsidian file-backed StoryMap view plus deterministic
folder-based note discovery.

## Source of truth

1. `SPEC.md` — product and architecture contract.
2. `docs/architecture.md` — how the current code is structured; read this to work without
   re-reading every source file.
3. Existing package APIs and tests in this repository.

If a task conflicts with `SPEC.md`, update the implementation to match the spec rather than
inventing a new architecture. Update the docs when behavior changes (see "Documentation
hygiene").

## Current source conventions

- StoryMap document frontmatter: `story-map: true`.
- StoryMap note discovery frontmatter: `story-map-note: true`.
- StoryMap fenced language: `story-map`.
- StoryMap configuration keys use camelCase.
- `noteFolder` supports one Vault-relative folder in v1 and includes subfolders recursively.
- Folder-generated slide order is controlled only by `order: asc | desc` (default `asc`)
  and `dateField` (default `date-created`).
- Explicit `slides` preserve exact author order and are never implicitly appended to or
  reordered by folder discovery. When `slides` is non-empty, `noteFolder` is ignored.
- Reuse Leaflet-compatible note metadata such as `location`, `mapmarker`, and `mapzoom`.
- Note presentation is controlled by `noteDisplay: basic | link | full`, default `link`:
  `basic` uses frontmatter metadata only; `link` links the slide title to the source note
  (Obsidian Page preview on hover, open in new tab on click); `full` uses the
  frontmatter-stripped note body as slide text.
- Defaultable `story-map` keys (Obsidian plugin settings): `order`, `dateField`,
  `noteDisplay`, and `map.zoom`, `map.minZoom`, `map.maxZoom`, `map.tileUrl`,
  `map.attribution`, `map.showPath`. Keys that vary per document — `schema`, `id`, `title`,
  `noteFolder`, `map.center`, `slides`, `height` — must stay document-only and must not be
  added to plugin settings or defaults. Resolution order for defaultable keys is always:
  1. the key present in the document's `story-map` block;
  2. otherwise the plugin setting;
  3. otherwise the built-in code default.
  (`height` is forced to `100%` in the Obsidian full-leaf host.)
- When adding or changing a defaultable key, add it to the `story-map-core` schema and
  `applySourceDefaults`, to `packages/obsidian-story-map/src/settings-data.ts`, expose it in
  `settings-tab.ts`, and cover the precedence in `story-map-core` parser tests. Do not
  re-implement defaulting in the view; use `parseStoryMapSourceYaml(source, defaults)`.

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
- automatic full Markdown-open interception through `WorkspaceLeaf` monkey patches (a
  scoped `setViewState` wrapper may still open detected `story-map: true` documents in the
  StoryMap view by default).

A future map adapter can be added later. The MVP renderer directly owns the Leaflet
lifecycle inside `react-story-map`.

## Package boundaries

- `packages/story-map-core` — framework agnostic; no DOM, React, Leaflet, Obsidian,
  Docusaurus, or Node filesystem dependencies; schema, parsing, defaults, pure helpers; no
  folder scanning or file reads.
- `packages/react-story-map` — owns UI and Leaflet rendering; SSR-import-safe (Leaflet is
  dynamically imported inside client effects only); generic resize handling; no Obsidian or
  Node APIs; no knowledge of `noteFolder`, Vault scanning, or frontmatter.
- `packages/obsidian-story-map` — Obsidian APIs allowed; file-backed `TextFileView`; parses
  the fence; resolves Vault content and `noteFolder`; passes a standard `StoryMapConfig` to
  the renderer; supports Markdown <-> StoryMap switching; opens detected documents in the
  StoryMap view by default via a scoped `setViewState` wrapper; must not intercept unrelated
  Markdown opens.
- `packages/remark-story-map` — build-time entry may use Node `fs`; browser client entry
  must not; never initializes Leaflet during build; folder discovery and sorting must match
  Obsidian semantics.

See `docs/architecture.md` for the file-level map and public APIs.

## Collaboration rules

- each agent owns one package directory;
- avoid editing root config unless assigned as integrator;
- do not rename shared public types without coordinating consumers;
- prefer small commits grouped by package responsibility;
- add tests for parser/normalization/order logic before adding more features;
- integration fixes belong to the integrator after package work is complete;
- do not expand sorting beyond `order` + `dateField` in this milestone.

## Documentation hygiene

- Keep `README.md`, `SPEC.md`, and `AGENTS.md` short and current; implementation detail goes
  in `docs/architecture.md`.
- Archive completed plans under `docs/history/<YYYY-MM-DD>-<slug>/`; delete
  development-process notes once their work is merged.
- When behavior changes, update the matching doc in the same change.
- The repeatable workflow lives in the `docs-maintenance` skill at
  `.agents/skills/docs-maintenance/SKILL.md`.

## Definition of done

Before claiming completion:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Then manually smoke-test:

1. standalone React rendering;
2. Obsidian full-leaf StoryMap view lifecycle;
3. Markdown <-> StoryMap view switching;
4. recursive `noteFolder` discovery;
5. `dateField` ordering in both directions;
6. explicit slide ordering unaffected by folder settings;
7. split-pane resize/Leaflet invalidation;
8. Remark transform output;
9. Docusaurus client hydration/SSR boundary.

Do not mark deferred features as implemented unless they are tested end to end.
