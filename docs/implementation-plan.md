# MVP Implementation Plan — Docusaurus / Remark Milestone

## 0. Milestone status

The base architecture, core parser, shared React renderer, and Obsidian file-backed MVP already exist.

Current priority:

> Bring `remark-story-map` to practical semantic parity with the Obsidian adapter and integrate it cleanly with Docusaurus without duplicating route or rendering logic.

Do not redesign the architecture. `SPEC.md` is authoritative.

## Phase 1 — Remark resolver parity

Primary ownership: `packages/remark-story-map/**`

### 1.1 `noteDisplay` parity

Implement and test:

- `basic` — frontmatter-derived content only;
- `link` — frontmatter-derived content plus resolved published `notePath`;
- `full` — frontmatter-derived content plus frontmatter-stripped Markdown body.

Use the existing Obsidian resolver semantics as the reference.

Acceptance:

- discovered notes and explicit `slide.note` references behave consistently;
- explicit slide properties still override note-derived values;
- `full` does not leak frontmatter into slide text.

### 1.2 Published-route resolver hook

Add a small host-provided route resolver option.

Required architectural behavior:

```text
Vault-relative note
    -> host resolver
    -> final published href
    -> StorySlide.notePath
```

The package must not implement Docusaurus slug rules.

Acceptance:

- one resolved note becomes a normal browser href;
- unresolved/ambiguous host resolution produces a clear build-time error or clearly documented unresolved behavior;
- no absolute local filesystem path is serialized into HTML.

### 1.3 Source-aware media resolution

Update transform/resolver flow so the current StoryMap Markdown source path is available.

Resolve:

- note-derived relative media from the note path;
- explicit slide relative media from the StoryMap document path;
- absolute HTTP/data/blob URLs unchanged.

Acceptance:

- both relative cases have focused tests;
- existing `assetBase` behavior remains compatible.

### 1.4 Vault scan exclusions

Prevent recursive scanning of obvious tooling/output directories:

- dot-directories;
- `node_modules`;
- `build`;
- `dist`;
- `coverage`.

Do not add a generic ignore DSL.

Acceptance:

- tests prove excluded directories are not indexed;
- nested content directories still work.

## Phase 2 — Shared renderer link fallback

Primary ownership: `packages/react-story-map/**`

Update slide-title behavior:

- if `notePath` + callbacks exist: preserve current platform callback behavior;
- if `notePath` exists without callbacks: render a normal anchor;
- otherwise render a non-link title.

Acceptance:

- Obsidian callback behavior remains unchanged;
- Docusaurus can publish clickable note titles without importing router APIs into the renderer;
- no Docusaurus dependency is added.

## Phase 3 — Browser client lifecycle

Primary ownership: `packages/remark-story-map/**`

### 3.1 Mounting

Keep:

- multiple host support;
- duplicate-mount protection;
- UTF-8-safe config decoding;
- client-only React mounting.

### 3.2 Unmounting

Add cleanup for removed StoryMap hosts during SPA navigation.

Acceptance:

- removing a host calls `root.unmount()`;
- a later host with new DOM identity mounts normally;
- repeated SPA navigation does not accumulate active roots.

### 3.3 Lazy client loading

Prefer loading StoryMap renderer/client-heavy dependencies only when a page contains a StoryMap host.

This is a performance optimization, not a reason to redesign package exports. If bundler constraints make it disproportionately complex, keep current loading and record it as a non-blocking follow-up.

## Phase 4 — Docusaurus theme bridge and example

Primary ownership:

- `packages/remark-story-map/**`
- `examples/docusaurus/**`
- `packages/react-story-map/**` only for generic semantic CSS variable cleanup

Deliver:

- a small Docusaurus CSS bridge from Infima variables to StoryMap semantic variables;
- updated Docusaurus setup example;
- client module registration example;
- route resolver option example;
- clear note that asset copying remains site-owned.

Acceptance:

- light and dark Docusaurus themes keep panel, text, border, buttons, and links readable;
- no Infima/Docusaurus API import is introduced into `story-map-core`;
- generic renderer remains usable outside Docusaurus.

Dynamic dark/light tile provider switching is not required.

## Phase 5 — Target-site integration check

Reference site: `kywk/kywk.github.io`

Do not copy old Leaflet/Kanban technical debt into StoryMap.

Reuse:

- existing multi-instance Docusaurus pattern;
- existing `scripts/content-links.js`;
- existing `remark-slug-normalizer` / `deriveSlug()` as URL authority;
- existing site asset publishing pipeline.

Do not add a second StoryMap-specific slug normalization implementation.

Suggested integration behavior:

```text
story-map fenced block
  -> remark-story-map
  -> VaultIndex
  -> host resolveNoteHref(...)
  -> existing contentLinkIndex / published route
  -> serialized StoryMapConfig
  -> browser StoryMap client
```

First integrate docs instances. Blog support may use the same adapter when a real blog StoryMap use case exists; do not expand scope solely for symmetry.

## Phase 6 — Tests and integration

Required automated coverage:

- fence transform;
- explicit note inheritance;
- explicit override;
- ambiguous WikiLink;
- recursive folder discovery;
- asc/desc sorting;
- missing dates last;
- `noteDisplay` basic;
- `noteDisplay` link;
- `noteDisplay` full;
- note-relative media;
- source-document-relative media;
- excluded scan directories;
- browser normal-link fallback where practical;
- browser mount/unmount lifecycle where practical.

Run:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Manual smoke checks:

1. same StoryMap content renders in Obsidian and Docusaurus;
2. previous/next and keyboard navigation work;
3. map `flyTo` works without map recreation;
4. note link navigates to published Docusaurus page;
5. full note body renders as Markdown;
6. dark/light Docusaurus theme is readable;
7. SPA navigation away/back does not duplicate maps;
8. multiple StoryMaps on one page remain independent.

## Definition of done

The milestone is complete when:

- the full repo checks pass;
- Obsidian behavior has no regression;
- Remark note resolution semantics match the agreed v1 contract;
- Docusaurus uses the common React renderer;
- route resolution is delegated to the host;
- Docusaurus SPA lifecycle is clean;
- theme bridging is documented and working;
- deferred features remain deferred.

## Deferred backlog

Keep outside this milestone:

1. custom marker icons;
2. marker popups;
3. marker-click-to-slide behavior;
4. touch swipe navigation;
5. `CRS.Simple` / image maps;
6. GeoJSON/GPX;
7. scroll/scrollytelling;
8. full-body WikiLink/embed conversion;
9. automatic Vault asset copying;
10. dynamic light/dark tile source switching;
11. MapLibre.
