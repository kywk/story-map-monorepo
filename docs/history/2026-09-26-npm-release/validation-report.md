# Release preparation validation

Date: 2026-09-26. No registry publication, release tag push, GitHub account setting
change or Obsidian submission was performed.

## Delivered

- `release-npm.yml`: `npm-v*` push trigger, stable version guard, checks, isolated
  tarball consumer verification and npm OIDC publication in dependency order.
- `scripts/release-npm.mjs`: explicit library allowlist, export/license/README and
  workspace dependency checks; reuse verified tarballs for publication; integrity-aware
  retry after partial release.
- Core/React consumer READMEs and clarified Remark React 19 peers.
- Root canonical Obsidian manifest/versions; desktop-only metadata and network disclosure.
- Updated release instructions, docs index, architecture and product support contract.

## Executed checks

- `pnpm install --frozen-lockfile`: passed; lockfile unchanged.
- `pnpm typecheck`: passed.
- `pnpm test`: 86 package tests and 6 release guard tests passed. Publication tests use
  a fake npm executable; they never call the real registry publish endpoint.
- `pnpm build`: passed; existing bundle size warnings remain (plugin approximately
  1 MB, React example approximately 764 KB before gzip).
- `pnpm release:check`: all three tarballs included license/README and valid exports;
  packed internal dependencies resolved to `0.1.0`.
- Isolated consumer installed real tarballs and registry dependencies, then passed core
  and Remark imports, React SSR without `window`, Remark fenced-block transformation,
  CSS/client export resolution and strict NodeNext TypeScript declaration checks.
- Correct release tag accepted; mismatched tag rejected before packing/publication.
- Workflow YAML parsed, npm tag trigger and OIDC write permission checked;
  `git diff --check` passed.

Local validation used Node 26.8.2 and pnpm 12.6.0. Node 24 is selected by the workflow;
its actual GitHub execution and OIDC authentication have not been exercised locally.

## Remaining external gates

1. Commit/push reviewed repository changes and configure Trusted Publishers for all
   three package names: owner `kywk`, repo `story-map`, workflow `release-npm.yml`,
   no environment, direct `npm publish` allowed.
2. Confirm each npm package exists and has a settings page before relying on OIDC.
   If not, resolve the supported initial-publication process with the account owner.
   Scope ownership does not itself configure a package publisher.
3. Push `npm-v0.1.0` only once account configuration is ready, then check all three
   versions, `latest` tags and provenance. Multi-package publishing is not atomic.
4. Browser/manual smoke checks in `AGENTS.md` remain unexecuted: standalone map,
   Obsidian 1.8.0 lifecycle/switching/resize, real Docusaurus SSR/build, SPA mounts,
   relative media and light/dark themes. Automated data/SSR checks do not prove these.
5. Before deferred Obsidian submission, verify unique name/ID, dependencies' license
   obligations and compatibility of the scoped view-state wrapper with other plugins.

Account setup details and repeatable commands live in `RELEASING.md`.
