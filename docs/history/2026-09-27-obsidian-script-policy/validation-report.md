# Validation of Geo Story Map 0.1.1

- `pnpm install --frozen-lockfile`: passed.
- `pnpm typecheck`: passed across all workspaces.
- `pnpm test`: passed, 106 tests (6 release, 46 core, 3 renderer, 28 Obsidian, 23 Remark).
- `pnpm build`: passed, including the standalone production example.
- `node scripts/check-obsidian-release.mjs`: passed metadata, license notices, script
  creation checks and bundled CommonJS import with only Obsidian external.
- `git diff --check`: passed.

Actual DOM tests exercise the transformed React runtime: rendering, click/state updates,
unmount, rejected script/module preinit and rejected inline/async script rendering.
Compatibility tests exercise declarative settings indexing, legacy changes/reset and
modern refresh. Unload regression confirms leaves are not detached.

The source scanner errors are addressed in code. Workspace import/type warnings did
not reproduce in local TypeScript checks; the external scanner must be rerun.
The imperative settings fallback remains necessary for minimum Obsidian 1.8.0 and may
still be reported as deprecated by a scanner targeting 1.13.

No new GUI smoke test is claimed. The maintainer's prior Obsidian 1.8.0 results cover
the 0.1.0 baseline; 0.1.1 unload/settings should be checked in the actual desktop host.
Community scan/review approval remains pending.
