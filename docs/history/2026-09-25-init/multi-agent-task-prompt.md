# Multi-Agent MVP Task Prompt

Use the following prompt with a coding orchestrator/Codex-style multi-agent workflow.

---

You are implementing the first MVP of this repository.

Read these files before changing code:

1. `SPEC.md`
2. `AGENTS.md`
3. `docs/implementation-plan.md`

The architecture is already decided. Do not redesign it. The goal is to finish a working MVP with minimal code and minimal dependencies.

## Global constraints

- use pnpm workspace tooling already present;
- use TypeScript;
- Leaflet is the only MVP map engine;
- do not add React Leaflet, MapLibre, Redux, Zustand, Nx, Turborepo, visual editors, or scrollama;
- keep `story-map-core` framework/platform agnostic;
- keep `react-story-map` unaware of Obsidian/Docusaurus;
- adapters resolve platform data into `StoryMapConfig` before rendering;
- maintain SSR-import safety: Leaflet must not be imported as a top-level runtime dependency from `react-story-map`;
- prefer finishing tested MVP behavior over creating abstractions for future features.

## Parallel agents

### Agent A — Core owner

Ownership: `packages/story-map-core/**`

Tasks:

- review and complete schema/types/parser;
- ensure `location: [lat,lng]`, string media, and Leaflet-compatible root keys normalize correctly;
- implement/test WikiLink parsing and location coercion;
- add focused Vitest tests;
- do not edit other package directories.

Return:

- changed files;
- test cases added;
- any public API issue blocking another package.

### Agent B — React renderer owner

Ownership: `packages/react-story-map/**`

Tasks:

- finish `<StoryMap />` paged renderer;
- dynamically import Leaflet inside browser effects;
- initialize tile layer, markers, optional path;
- implement `flyTo` on slide change without rebuilding the map;
- implement previous/next, slide count, Left/Right keyboard navigation;
- render Markdown and MVP media types;
- verify cleanup and responsive CSS;
- do not introduce platform-specific APIs.

Assume the public core API defined in `SPEC.md`; coordinate only if an actual mismatch is found.

### Agent C — Obsidian adapter owner

Ownership: `packages/obsidian-story-map/**`

Tasks:

- finish the file-backed full-leaf `TextFileView` for `story-map: true` documents;
- extract and parse the `story-map` fenced configuration;
- expose `Open as Story Map` / `Open as Markdown`;
- recursively scan `noteFolder` for `story-map-note: true` notes and sort by `dateField`/`order`;
- resolve `slide.note` WikiLinks through Obsidian metadata APIs;
- inherit frontmatter title/location/description/cover when slide values are absent;
- convert local Vault media to resource URLs;
- mount `react-story-map` and cleanly unmount when the view unloads;
- make the package bundle to Obsidian `dist/main.js`, `dist/manifest.json`, `dist/styles.css`;
- do not depend on the community Obsidian Leaflet plugin runtime.

### Agent D — Remark/Docusaurus owner

Ownership: `packages/remark-story-map/**`

Tasks:

- finish the fenced `story-map` Remark transform;
- when `vaultRoot` is configured, resolve note frontmatter similarly to the Obsidian adapter;
- serialize only normalized `StoryMapConfig` to the page;
- finish the browser client entry that mounts every host using `react-story-map`;
- keep build-time code free of Leaflet initialization;
- add a concise Docusaurus configuration example in this package README or root README if assigned by integrator.

## Integration agent

Start only after A-D finish.

Ownership:

- root config;
- cross-package integration fixes;
- README/docs corrections;
- no feature expansion.

Tasks:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Then smoke-test:

1. parse the sample StoryMap;
2. render it in standalone React;
3. resolve one Obsidian WikiLink-backed slide;
4. transform one fenced block with Remark;
5. confirm browser hydration works after a Docusaurus-style static build.

Fix only actual integration defects. Keep changes local and preserve package boundaries.

## Final report format

Provide:

- MVP features confirmed working;
- commands run and results;
- remaining defects/blockers;
- deferred items explicitly left for post-MVP;
- no speculative future architecture unless needed to explain a blocker.

---
