# npm 0.1.0 release preparation

Date: 2026-09-26. This records the approved scope before implementation.

## Decisions

- Publish `@story-map/story-map-core`, `@story-map/react-story-map`, and
  `@story-map/remark-story-map` together at `0.1.0`, using `latest`.
- The owner confirms publishing rights for `@story-map`.
- Use GitHub Actions and npm Trusted Publishing, triggered by `npm-v*` tags
  (`npm-v0.1.0` for the first version).
- Defer Obsidian submission. Keep `Story Map` / `story-map`, subject to uniqueness.
  First release is desktop-only; retain minimum Obsidian `1.8.0`, conditional on
  API review and actual testing on that version.
- Prepare and validate locally. Account settings, pushing release tags, publishing,
  and community submission are separate release operations.

## Implementation

1. Add package consumer READMEs for core and React; clarify Remark peer requirements.
2. Add a release validation script checking the tag, lockstep versions, explicit package
   allowlist, packed metadata/exports/license/README and workspace dependency rewriting.
3. Install the three tarballs in a temporary project outside the workspace; exercise
   Node imports, React SSR, Remark transformation, CSS resolution and TypeScript types.
4. Add tag-triggered workflow: frozen install, typecheck, tests, build, pack, isolated
   consumer verification, then publish tarballs in dependency order with npm CLI OIDC.
   Support retry after partial publication without republishing immutable versions.
5. Rewrite release instructions with exact Trusted Publisher settings and first-publish
   prerequisites. Update README, documentation index and architecture.
6. Prepare deferred Obsidian metadata: root manifest/versions as canonical sources,
   desktop-only flag, network disclosure, and current community submission instructions.

## Ownership

- Core package README: core agent.
- React package README: React agent.
- Root scripts/workflow/docs and adapter integration: primary agent.
- Agents edit disjoint package directories; worktrees are unnecessary for these isolated
  additions. No shared public API changes or new release framework.

## Verification and release gates

- Run `pnpm install`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Validate a matching tag and reject mismatched/prerelease tags before network publication.
- Verify fresh packed consumers; do not treat workspace tests as consumer validation.
- npm account owner must configure each package's publisher for `kywk/story-map`,
  `release-npm.yml`, allowing direct `npm publish`; confirm how new packages are
  initialized if their settings page does not yet exist.
- Actual OIDC authentication requires a GitHub-hosted run and is not a local test.
- Obsidian 1.8.0, full-leaf switching, resize, and Docusaurus SPA/theme/browser smoke
  checks remain explicit gates; never report them as completed without execution.

## References

- https://docs.npmjs.com/trusted-publishers/
- https://docs.obsidian.md/plugins/releasing/submit-plugin
- https://docs.obsidian.md/community-directory/developer-policies
- https://docs.obsidian.md/Reference/Versions
