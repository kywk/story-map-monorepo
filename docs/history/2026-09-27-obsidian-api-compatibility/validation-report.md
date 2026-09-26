# Geo Story Map 0.1.2 validation

`pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm build` and
`node scripts/check-obsidian-release.mjs` all passed. The test suite has 106 cases:
6 release checks, 46 core, 3 renderer, 28 Obsidian and 23 Remark.

Reset tests now verify the newly rendered date-field control is empty after restoring
defaults, settings labels remain identical, and a modern host's update API is never called.
No unsupported host method is required for reset; minimum remains Obsidian 1.8.0.

Root no-emit TypeScript analysis passes. `--traceResolution` confirms core and renderer
imports resolve directly to packages/*/src/index.ts, rather than dist declarations.
The example and Remark source remain unchanged. No lint warnings were suppressed.
Whether the community scanner uses this root configuration still needs external recheck.

The production plugin entry passes script-creation, notices, manifest and CommonJS import
checks. Desktop GUI smoke testing was not performed in this change. The maintainer should
verify reset in Obsidian 1.8 and modern settings search. Community approval is pending.
