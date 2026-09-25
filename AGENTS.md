# AGENTS.md

## Mission

Deliver the first usable StoryMap MVP described in `SPEC.md` with the least architectural surface necessary.

## Source of truth

1. `SPEC.md` — product and architecture contract.
2. `docs/implementation-plan.md` — work order and acceptance checks.
3. Existing package APIs in this repository.

If a task conflicts with `SPEC.md`, update the implementation to match the spec rather than inventing a new architecture.

## Non-goals

Do not introduce unless explicitly requested:

- Nx, Turborepo, Bazel, changesets, semantic-release;
- Redux/Zustand;
- React Leaflet;
- MapLibre;
- visual editors;
- scroll-driven storytelling;
- a generic plugin framework;
- premature abstraction for multiple map engines.

A future map adapter can be added later. The MVP renderer directly owns Leaflet lifecycle inside `react-story-map`.

## Package boundaries

### `packages/story-map-core`

- framework agnostic;
- no DOM, React, Leaflet, Obsidian, Docusaurus, or Node filesystem dependencies;
- owns schema and parsing behavior.

### `packages/react-story-map`

- owns UI and Leaflet rendering;
- must remain SSR-import-safe: do not import Leaflet as a runtime top-level dependency; dynamically import it inside client effects;
- must not import Obsidian or Node filesystem APIs.

### `packages/obsidian-story-map`

- may import Obsidian APIs;
- resolves Vault-specific content;
- must pass a standard `StoryMapConfig` to the renderer.

### `packages/remark-story-map`

- build-time entry may use Node filesystem APIs;
- browser client entry must not use Node APIs;
- Remark transforms content but never initializes Leaflet during build.

## Collaboration rules

When multiple agents work in parallel:

- each agent owns one package directory;
- avoid editing root config unless assigned as integrator;
- do not rename shared public types without coordinating consumers;
- prefer small commits grouped by package responsibility;
- add tests for parser/normalization logic before adding more features;
- integration fixes belong to the integrator after package work is complete.

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
2. Obsidian Reading View lifecycle;
3. Remark transform output;
4. Docusaurus client hydration/SSR boundary.

Do not mark deferred features as implemented unless they are tested end to end.
