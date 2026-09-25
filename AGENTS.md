# AGENTS.md

## Mission

Deliver the first usable StoryMap MVP described in `SPEC.md` with the least architectural surface necessary.

The current priority is the Obsidian file-backed StoryMap view plus deterministic folder-based note discovery.

## Source of truth

1. `SPEC.md` — product and architecture contract.
2. `docs/implementation-plan.md` — work order and acceptance checks.
3. `docs/handoff.md` — historical Vault verification notes (the current contract is `SPEC.md`).
4. Existing package APIs in this repository.

If a task conflicts with `SPEC.md`, update the implementation to match the spec rather than inventing a new architecture.

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
- automatic full Markdown-open interception through `WorkspaceLeaf` monkey patches (a scoped `setViewState` wrapper may still open detected `story-map: true` documents in the StoryMap view by default).

A future map adapter can be added later. The MVP renderer directly owns Leaflet lifecycle inside `react-story-map`.

## Package boundaries

### `packages/story-map-core`

- framework agnostic;
- no DOM, React, Leaflet, Obsidian, Docusaurus, or Node filesystem dependencies;
- owns schema, parsing behavior, source configuration defaults, and small shared normalization helpers;
- does not scan folders or read note files.

### `packages/react-story-map`

- owns UI and Leaflet rendering;
- must remain SSR-import-safe: do not import Leaflet as a runtime top-level dependency; dynamically import it inside client effects;
- owns generic resize handling such as Leaflet `invalidateSize()`;
- must not import Obsidian or Node filesystem APIs;
- must not know about `noteFolder`, Vault scanning, or frontmatter access.

### `packages/obsidian-story-map`

- may import Obsidian APIs;
- implements a file-backed `TextFileView`;
- parses the StoryMap document's `story-map` fenced block;
- resolves Vault-specific content and `noteFolder`;
- must pass a standard resolved `StoryMapConfig` to the renderer;
- must support Markdown <-> StoryMap view switching;
- opens detected StoryMap documents in the StoryMap view by default via a scoped `setViewState` wrapper;
- must not intercept unrelated Markdown opens.

### `packages/remark-story-map`

- build-time entry may use Node filesystem APIs;
- browser client entry must not use Node APIs;
- Remark transforms content but never initializes Leaflet during build;
- folder discovery and sorting must match Obsidian semantics.

## Collaboration rules

When multiple agents work in parallel:

- each agent owns one package directory;
- avoid editing root config unless assigned as integrator;
- do not rename shared public types without coordinating consumers;
- prefer small commits grouped by package responsibility;
- add tests for parser/normalization/order logic before adding more features;
- integration fixes belong to the integrator after package work is complete;
- do not expand sorting beyond `order` + `dateField` in this milestone.

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
