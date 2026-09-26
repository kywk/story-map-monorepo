# Handoff — Docusaurus / Remark Plugin MVP

> Current milestone handoff. Read `SPEC.md`, `AGENTS.md`, and `docs/implementation-plan.md` before changing code.

## 0. Task in one sentence

Finish `packages/remark-story-map` so the same StoryMap Markdown used by the completed Obsidian MVP publishes in Docusaurus with equivalent note discovery, ordering, inheritance, `noteDisplay` behavior, correct published links/media, clean SPA lifecycle, and the shared `react-story-map` renderer.

## 1. Repository baseline

Repository:

```text
https://github.com/kywk/story-map-monorepo
```

Baseline analyzed:

```text
main
8bfd4238d4cf599403bda724fb4b81640df29c1e
Merge branch 'feat/obsidian-plugin'
```

Packages:

```text
packages/story-map-core
packages/react-story-map
packages/obsidian-story-map
packages/remark-story-map
```

The Obsidian MVP is complete enough to act as the platform semantics reference.

Current Remark implementation already has real functionality; do not replace it with a new architecture.

## 2. Current implementation

### `story-map-core`

Already provides:

- `StoryMapSourceConfig` / `StoryMapConfig`;
- YAML + Zod parsing;
- source defaults;
- `noteFolder`, `order`, `dateField`, `noteDisplay`;
- WikiLink parsing;
- location/media coercion;
- frontmatter-to-slide helpers;
- date sorting;
- frontmatter stripping;
- explicit-slide-over-note merge behavior.

Do not move filesystem or Docusaurus behavior into core.

### `react-story-map`

Already provides:

- Leaflet dynamic import;
- map lifecycle;
- tile layer;
- circle markers;
- optional route polyline;
- active slide `flyTo`;
- previous/next;
- keyboard navigation;
- slide count;
- Markdown/GFM text;
- image/video/iframe;
- resize observer / `invalidateSize`;
- note click/hover callbacks;
- responsive CSS.

Required cross-package change for this milestone:

> when `slide.notePath` exists and no platform callback is supplied, render a normal browser anchor.

Do not import Docusaurus Router or other host APIs.

### `obsidian-story-map`

Existing reference behavior:

- `story-map: true` document detection;
- `story-map` fenced config;
- file-backed full-leaf view;
- default-open StoryMap view;
- Open as Markdown / Open as Story Map;
- recursive `noteFolder`;
- `story-map-note: true` filter;
- `dateField` + asc/desc;
- explicit slides preserve author order;
- note frontmatter inheritance;
- note-relative media;
- `noteDisplay: basic | link | full`;
- Page Preview/open-tab behavior for `link`;
- settings precedence;
- React/Leaflet lifecycle cleanup.

Do not modify this package unless a shared change exposes a real regression.

### `remark-story-map`

Current files:

```text
src/index.ts
src/vault.ts
src/client.tsx
src/index.test.ts
README.md
```

Current behavior includes:

- finds `story-map` code fences;
- parses via `story-map-core`;
- optional `vaultRoot`;
- indexes Markdown files;
- resolves exact Vault-relative path and basename WikiLinks;
- rejects ambiguous basename WikiLinks;
- resolves explicit note frontmatter;
- recursive `noteFolder`;
- filters `story-map-note: true`;
- asc/desc date sorting;
- explicit slides suppress automatic folder append;
- `assetBase` rewriting;
- note-relative frontmatter media;
- serializes `StoryMapConfig` via encoded data attribute;
- browser mounts multiple hosts;
- duplicate-mount protection with `WeakMap`;
- MutationObserver rescans after DOM changes;
- Leaflet is not initialized during build.

## 3. Known gaps to implement

### P0 — `noteDisplay` parity

`StoryMapSourceConfig.noteDisplay` is parsed but current `VaultIndex` does not apply it.

Implement:

```text
basic -> frontmatter basics only
link  -> basics + published notePath
full  -> basics + stripped Markdown body
```

Use the Obsidian resolver as the semantic reference.

### P0 — published Docusaurus route

`remark-story-map` must not calculate Docusaurus slugs itself.

Add a small host callback option that can turn a Vault-relative note path into its published URL.

Example conceptual API:

```ts
resolveNoteHref?: (vaultRelativePath: string) => string | undefined
```

Exact naming/signature can change if a better minimal shape is required.

The serialized `StoryMapConfig` should contain the final browser-facing link, not an absolute local filesystem path.

### P0 — source-relative explicit media

Current note-relative media works because the note path is known.

Explicit slide media such as:

```yaml
slides:
  - title: Example
    media: ./images/example.jpg
```

must resolve relative to the StoryMap Markdown source file.

Use the Remark `VFile` / source path to provide that context.

### P0 — filesystem scan exclusions

If `vaultRoot` points at the whole Docusaurus repository, current recursion can enter `node_modules` and build output.

Skip at least:

```text
.*
node_modules
build
dist
coverage
```

No generic ignore/glob subsystem.

### P1 — normal browser link fallback

Current renderer only makes a note title interactive when click/hover callbacks are supplied.

Change behavior:

```text
notePath + callback -> current callback behavior
notePath only       -> normal <a href>
no notePath         -> plain title
```

### P1 — SPA removal cleanup

Current browser client detects/mounts new hosts but does not unmount roots for removed hosts.

On Docusaurus SPA navigation:

```text
host removed -> root.unmount() -> forget host
```

Keep duplicate-mount protection.

### P1 — Docusaurus theme bridge

Generic renderer already uses semantic `--story-map-*` variables.

Provide a small Docusaurus/Infima bridge rather than embedding Docusaurus variables throughout the renderer.

Target site has custom light/dark theme, so verify both.

### P2 — lazy browser loading

Prefer not loading renderer-heavy code until StoryMap hosts exist.

This is not blocking if bundler constraints make it disproportionately complex.

## 4. Target Docusaurus reference

Reference repository:

```text
https://github.com/kywk/kywk.github.io
```

Relevant existing plugins:

```text
plugins/remark-obsidian-leaflet
plugins/remark-obsidian-kanban
```

Useful patterns to keep:

- build-time Markdown transform;
- browser-only interactive initialization;
- multi-doc-instance integration;
- SPA navigation awareness;
- theme integration.

Technical debt not to copy:

- custom duplicate slug rules;
- renderer HTML assembled inside Remark;
- large inline style blocks;
- global Leaflet runtime;
- route derivation by lowercasing filenames.

## 5. Target-site route authority

`kywk.github.io` already has:

```text
scripts/content-links.js
plugins/remark-slug-normalizer
deriveSlug()
createContentLinkIndex()
```

This existing system is the published route authority.

StoryMap integration should look like:

```text
Vault-relative note path
       |
       v
remark-story-map host callback
       |
       v
contentLinkIndex
       |
       v
published Docusaurus route
       |
       v
StorySlide.notePath
```

Do not implement a separate StoryMap slug normalizer.

## 6. Theme integration

Target site uses Docusaurus/Infima variables and a custom warm theme.

Expected bridge is conceptually:

```css
.story-map-host {
  --story-map-bg: var(--ifm-background-surface-color);
  --story-map-fg: var(--ifm-font-color-base);
  --story-map-muted: var(--ifm-color-emphasis-700);
  --story-map-border: var(--ifm-color-emphasis-300);
  --story-map-accent: var(--ifm-color-primary);
}
```

Dynamic light/dark tile URL switching is deferred. Only StoryMap UI readability must match the active Docusaurus theme.

## 7. Test-first work list

Add/extend tests for:

1. `noteDisplay: basic`;
2. `noteDisplay: link`;
3. `noteDisplay: full`;
4. host route resolver;
5. full body strips frontmatter;
6. note-relative media;
7. explicit source-relative media;
8. recursive folder discovery;
9. asc/desc sorting;
10. undated notes last;
11. explicit slides not appended/reordered;
12. excluded `node_modules/build/dist/coverage`;
13. ambiguous basename error;
14. normal browser `notePath` fallback where practical;
15. SPA host unmount where practical.

Existing tests must remain green.

## 8. Recommended implementation order

### Step 1

Update `VaultIndex` data model so indexed notes can provide:

- relative path;
- absolute path;
- frontmatter;
- body when required.

Avoid eagerly parsing more data than needed unless the simpler implementation is clearly preferable.

### Step 2

Implement one shared Remark-side note-display helper equivalent to Obsidian `applyNoteDisplay()`.

### Step 3

Add host route resolver support and populate final browser `notePath`.

### Step 4

Pass StoryMap source path from Remark transform into resolver for explicit media.

### Step 5

Add scan exclusions.

### Step 6

Update renderer normal-link fallback.

### Step 7

Update browser client removal cleanup.

### Step 8

Update README/example Docusaurus configuration and theme bridge.

### Step 9

Run full repo tests/build.

### Step 10

Smoke-test against `kywk.github.io` without adding alternate route logic.

## 9. Required commands

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Focused commands during development:

```bash
pnpm --filter @story-map/remark-story-map test
pnpm --filter @story-map/remark-story-map typecheck
pnpm --filter @story-map/remark-story-map build

pnpm --filter @story-map/react-story-map typecheck
pnpm --filter @story-map/react-story-map build
```

## 10. Acceptance checklist

- [ ] Same `story-map` fence parses in Obsidian and Remark.
- [ ] Explicit notes inherit frontmatter.
- [ ] Explicit slide fields override note frontmatter.
- [ ] `noteFolder` recursively finds `story-map-note: true`.
- [ ] asc/desc `dateField` sort matches Obsidian.
- [ ] `basic` matches agreed semantics.
- [ ] `link` emits final published URL.
- [ ] `full` renders stripped note body.
- [ ] Note-relative media works.
- [ ] Explicit source-relative media works.
- [ ] Tool/output directories are skipped.
- [ ] No unnecessary absolute Vault path is serialized.
- [ ] Multiple StoryMaps mount independently.
- [ ] Removed hosts unmount React roots.
- [ ] Docusaurus SSR/build does not initialize Leaflet.
- [ ] Normal published note title link works without Docusaurus imports in renderer.
- [ ] Docusaurus light/dark StoryMap UI is readable.
- [ ] `kywk.github.io` integration reuses existing route index/slug authority.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm build` pass.

## 11. Deferred items

Do not implement in this milestone:

- custom marker icon compatibility;
- marker popups;
- marker-click-to-slide;
- `mapzoom` visibility behavior;
- automatic Vault asset copy;
- WikiLink/embed rendering inside full Markdown body;
- multiple `noteFolder`;
- query/filter/group syntax;
- scroll mode;
- MapLibre;
- CRS.Simple;
- GeoJSON/GPX;
- dynamic light/dark map tile provider switching.

## 12. Final report format

Report:

- files changed;
- tests added/changed;
- commands executed and exit results;
- Docusaurus smoke-test evidence;
- any remaining blocker;
- deferred items left intentionally untouched.
