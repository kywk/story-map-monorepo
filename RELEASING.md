# Releasing

Two independent artifacts are released from this monorepo:

1. the npm libraries (`story-map-core`, `react-story-map`, `remark-story-map`);
2. the Obsidian plugin (`obsidian-story-map`).

They are **not coupled**. The Obsidian plugin bundles the libraries from source, so it can
be released without publishing to npm.

## Prerequisites

- An npm account that owns (or can create) the `@story-map` scope. Scoped packages require
  `publishConfig.access = "public"`, which is already set for the three libraries.
- `npm login` (or an `NPM_TOKEN` with publish rights) on the release machine.
- A clean git working tree. pnpm refuses to publish from a dirty tree unless
  `--no-git-checks` is passed.

## Libraries (lockstep)

All three libraries share one version for MVP simplicity.

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build

# bump all three libraries together (choose patch/minor/major)
pnpm --filter @story-map/story-map-core \
     --filter @story-map/react-story-map \
     --filter @story-map/remark-story-map \
     exec npm version patch --no-git-tag-version

pnpm build
pnpm -r publish --access public
```

Notes:

- `pnpm publish` rewrites `workspace:*` to the concrete published version.
- Private packages (the Obsidian plugin and the example app) are skipped automatically.
- Commit the version bump and tag the release:

```bash
git commit -am "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

`gh release create vX.Y.Z --generate-notes` can be used to publish release notes.

## Obsidian plugin

Distribution follows the Obsidian convention: attach build artifacts to a GitHub Release.

```bash
pnpm --filter @story-map/obsidian-story-map build
# outputs: packages/obsidian-story-map/dist/{main.js,manifest.json,styles.css,versions.json}
```

1. Bump `version` in `packages/obsidian-story-map/manifest.json` and `package.json`.
2. Add an entry to `packages/obsidian-story-map/versions.json` **only when `minAppVersion`
   changes** (`{ "<plugin version>": "<minAppVersion>" }`).
3. Rebuild, then create a GitHub Release whose tag matches the manifest version and attach
   `main.js`, `manifest.json`, and `styles.css` (add `versions.json` when present).

```bash
gh release create <version> \
  packages/obsidian-story-map/dist/main.js \
  packages/obsidian-story-map/dist/manifest.json \
  packages/obsidian-story-map/dist/styles.css \
  packages/obsidian-story-map/dist/versions.json \
  --title "Story Map <version>" --generate-notes
```

Manual install remains: copy the three files into
`<Vault>/.obsidian/plugins/story-map/`.

BRAT can install from the GitHub Release directly. Submitting to the official community
plugin list later requires a public repo plus a PR to `obsidian-releases`, so a license and
README are already in place.

## Docusaurus (external consumer)

Until the libraries are published to npm, the external site can consume a local checkout:

```bash
pnpm link /path/to/story-map/packages/remark-story-map
pnpm link /path/to/story-map/packages/react-story-map
```

After publishing, switch to normal semver ranges, e.g. `"@story-map/remark-story-map": "^0.1.0"`.

## Deferred

- Changesets for automated versioning/changelogs (see `AGENTS.md` non-goals).
- GitHub Actions release workflow (tag push → build/test → publish + release).
