# MVP Implementation Plan

The repository is intentionally structured so most MVP work can happen in parallel without agents editing the same files.

## Phase 0 — bootstrap and contracts

Status in this starter: scaffolded.

Deliverables:

- pnpm workspace;
- shared TypeScript config;
- package boundaries;
- v1 schema/types;
- build scripts;
- architecture docs.

Exit criteria:

- package manifests are internally consistent;
- no platform API leaks into core/renderer.

## Phase 1 — parallel package completion

### Track A — `story-map-core`

Complete and test:

- YAML parsing;
- Zod validation;
- convenience normalization (`location`, media string, Leaflet-like root keys);
- WikiLink reference parsing;
- frontmatter location coercion.

Acceptance:

- invalid coordinates fail clearly;
- a normal v1 example parses;
- a Leaflet-style compatibility example normalizes to canonical config.

### Track B — `react-story-map`

Complete:

- dynamic Leaflet import;
- map mount/destroy lifecycle;
- tile layer;
- slide markers;
- optional path;
- active slide `flyTo`;
- previous/next and keyboard navigation;
- text/media panel;
- responsive styling.

Acceptance:

- no top-level runtime import of Leaflet;
- React component works from a plain `StoryMapConfig`;
- changing slide updates camera without recreating the map;
- changing the whole story safely recreates Leaflet state.

### Track C — `obsidian-story-map`

Complete:

- file-backed `TextFileView` registered as a dedicated full-leaf view;
- `story-map: true` document detection and `story-map` fenced-block extraction;
- `Open as Story Map` / `Open as Markdown` commands and file-menu action;
- `note` WikiLink resolver;
- recursive `noteFolder` discovery filtered by `story-map-note: true`;
- `dateField` + `order` chronological sorting for folder-generated slides;
- frontmatter inheritance and local media URL conversion;
- React root cleanup on view unload/switch;
- Obsidian CSS bundle and full-height host.

Acceptance:

- explicit slide properties override note frontmatter;
- note frontmatter can provide title/location/description/cover;
- explicit slides are never reordered or appended to by `noteFolder`;
- switching between StoryMap and Markdown does not leak React roots or Leaflet maps.

### Track D — `remark-story-map`

Complete:

- Remark fenced block transform;
- optional Vault index;
- note/frontmatter inheritance;
- serialized host element;
- browser client that mounts React StoryMaps;
- documented Docusaurus configuration.

Acceptance:

- build-time code never initializes Leaflet;
- no Vault path is exposed unnecessarily in generated HTML;
- client can mount multiple StoryMaps on one page.

## Phase 2 — integration

One integrator should perform this phase after Tracks A-D are stable.

Tasks:

1. install workspace dependencies;
2. run `pnpm typecheck`, `pnpm test`, `pnpm build`;
3. fix cross-package type/export issues only;
4. create a two-slide standalone smoke example if needed;
5. test one Obsidian note reference end to end;
6. test one Docusaurus transform/hydration end to end;
7. update README only for commands that were actually verified.

Do not use integration as an excuse to redesign package boundaries.

## Phase 3 — MVP polish

Only after Phase 2 passes:

- refine mobile layout;
- improve error rendering for invalid YAML;
- add loading/fallback UI;
- improve dark-theme CSS tokens;
- document asset mapping for the existing Obsidian-to-Docusaurus publishing workflow.

## Suggested backlog after v1

Priority order if v1 is successful:

1. `CRS.Simple` / image-map mode;
2. touch swipe navigation;
3. GeoJSON/GPX read-only overlays;
4. optional scroll/scrollytelling mode;
5. advanced marker compatibility;
6. MapLibre renderer only if concrete vector/3D requirements appear.
