# Multi-Agent Task Prompt — Docusaurus / Remark Milestone

Use this prompt with Codex or another coding orchestrator.

---

You are implementing the Docusaurus/Remark milestone of StoryMap.

Read, in order:

1. `SPEC.md`
2. `AGENTS.md`
3. `docs/implementation-plan.md`
4. `docs/handoff.md`

The architecture is already decided. Do not redesign it.

The Obsidian MVP is the reference behavior. The goal is to make `remark-story-map` publish the same StoryMap content in Docusaurus with equivalent note resolution where platform differences permit.

## Global constraints

- use the existing pnpm workspace;
- use TypeScript;
- Leaflet remains the only map engine;
- do not add React Leaflet, MapLibre, Redux, Zustand, Nx, Turborepo, scrollama, or a plugin framework;
- keep `story-map-core` framework/platform agnostic;
- keep `react-story-map` unaware of Obsidian/Docusaurus route systems;
- filesystem and route resolution belong to the Remark adapter/host;
- Docusaurus slug policy is host-owned;
- build-time code must never initialize Leaflet;
- prefer focused tests and minimal changes over future abstractions.

## Workstream A — Remark resolver

Ownership:

```text
packages/remark-story-map/**
```

Tasks:

1. implement `noteDisplay: basic | link | full`;
2. read stripped Markdown body for `full`;
3. add a host route resolver hook for published note URLs;
4. keep absolute filesystem paths out of serialized config;
5. pass current source-document context into media resolution;
6. resolve explicit relative media from the StoryMap source document;
7. keep note-derived relative media note-relative;
8. skip dot-directories, `node_modules`, `build`, `dist`, `coverage`;
9. add focused tests for all above.

Do not implement Docusaurus slug rules in this package.

## Workstream B — React renderer

Ownership:

```text
packages/react-story-map/**
```

Task:

Change note-title behavior:

```text
notePath + callbacks -> callbacks
notePath only        -> normal browser anchor
no notePath          -> plain heading
```

Preserve Obsidian behavior.

Do not import Docusaurus Router or other platform packages.

## Workstream C — Browser client lifecycle

Ownership:

```text
packages/remark-story-map/src/client.tsx
```

Tasks:

- preserve multiple-host mounting;
- preserve duplicate-mount protection;
- unmount roots when host nodes leave the DOM during SPA navigation;
- ensure a later/replaced host can mount normally;
- keep Node APIs out of browser code;
- if simple with the current bundler, lazy-load renderer-heavy code only when a host exists.

Treat lazy loading as non-blocking if it materially complicates the package.

## Workstream D — Docusaurus example/theme bridge

Ownership:

```text
packages/remark-story-map/README.md
examples/docusaurus/**
```

Tasks:

- document `vaultRoot`;
- document `assetBase`;
- document the host route resolver option;
- register browser client as a Docusaurus client module;
- provide a minimal Infima-to-StoryMap CSS variable bridge;
- document that asset copying remains site-owned;
- do not add dynamic light/dark tile switching.

## Integration

After workstreams are complete:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Then smoke-test the target integration pattern against `kywk/kywk.github.io`.

Important target-site rules:

- use the existing `scripts/content-links.js`;
- use the existing `remark-slug-normalizer` / `deriveSlug()` route authority;
- do not create StoryMap-specific slug normalization;
- first integrate docs instances;
- do not expand blog support only for symmetry.

## Required test matrix

Cover:

- explicit note inheritance;
- explicit slide override;
- ambiguous WikiLink;
- recursive `noteFolder`;
- `story-map-note: true`;
- asc/desc sorting;
- undated notes last;
- `noteDisplay: basic`;
- `noteDisplay: link`;
- `noteDisplay: full`;
- route resolver;
- frontmatter-stripped body;
- note-relative media;
- source-document-relative media;
- scan exclusions;
- browser normal-link fallback;
- SPA host removal cleanup where practical.

## Do not implement

- custom marker icons;
- marker popups;
- marker-click-to-slide;
- multiple `noteFolder`;
- query/filter/group language;
- GeoJSON/GPX;
- CRS.Simple;
- visual editor;
- scroll mode;
- MapLibre;
- automatic Vault asset copying;
- WikiLink/embed conversion in full note body;
- dynamic dark/light tile providers.

## Final report

Return:

- changed files by package;
- tests added;
- commands run and exit status;
- target Docusaurus smoke-test result;
- remaining blockers;
- deliberately deferred work.

---
