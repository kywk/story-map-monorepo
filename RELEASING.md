# Releasing

The three npm libraries release together; the bundled Obsidian plugin releases independently.
The next npm release is `0.1.1` on `latest`. All three `0.1.0` versions already exist
on npm; they cannot be overwritten. Obsidian submission is deferred.

## npm account setup

The owner has confirmed `@story-map` publishing rights. Configure a GitHub Actions
Trusted Publisher separately for each package:

| Field | Value |
| --- | --- |
| Organization or user | `kywk` |
| Repository | `story-map` |
| Workflow filename | `release-npm.yml` |
| Environment | Leave empty (the workflow has no environment) |
| Allowed action | Enable direct `npm publish` |

Packages: `@story-map/story-map-core`, `@story-map/react-story-map`,
`@story-map/remark-story-map`. Commit the workflow to GitHub before configuring it.
The workflow uses GitHub-hosted Ubuntu runners, Node 24, npm 11.5.1 or newer and
`id-token: write`. No `NPM_TOKEN` is needed once publishers are configured.
See [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).

**Current account state (2026-09-26):** all three packages were published at `0.1.0`
on 2026-09-25 by `kywk`, still reference `story-map-monorepo`, and differ from current
artifacts. The next release corrects the repository metadata and includes the new docs.
Do not push `npm-v0.1.0`: immutable versions cannot be replaced.

The local npm account resolves to `kywk`, but trust-list queries returned HTTP 403 with
an authentication-policy notice. That does not prove publishers are absent. Use the npm
website or sign in again with interactive web authentication in your own terminal:

```bash
npm login --auth-type=web
npm trust github @story-map/story-map-core --file release-npm.yml --repository kywk/story-map --allow-publish
npm trust github @story-map/react-story-map --file release-npm.yml --repository kywk/story-map --allow-publish
npm trust github @story-map/remark-story-map --file release-npm.yml --repository kywk/story-map --allow-publish
```

Follow npm's confirmation/2FA prompts locally. If a matching publisher already exists,
verify it instead of creating a duplicate. CLI trust management requires npm 11.15.0 or
newer and account 2FA; see [npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/).
Alternatively open each package's Settings → Trusted Publisher on npmjs.com and use
the table above. Leave the environment blank, and allow direct publish. An old publisher
for `story-map-monorepo` does not match the current repository.

For future brand-new packages, configure a publisher only after their package settings
are available; resolve initial publication through an authenticated supported npm flow.
Do not create placeholder packages or add a token fallback to this workflow.

## Prepare and verify

All three library versions must match; private root, example and Obsidian packages are
excluded from the explicit release allowlist. Update the three package versions together
for later releases, then refresh the lockfile. The three library manifests are now set to `0.1.1`; the private root and Obsidian
versions remain independent.

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm release:check
```

`release:check` packs the libraries with pnpm, verifies exports, README, license and
workspace version rewriting, and installs the tarballs in an isolated temporary project.
It checks React SSR without browser globals, core/Remark imports, a Remark transform,
CSS/client resolution and TypeScript consumer declarations. It needs registry access to
install dependencies. It does not replace browser/Obsidian/Docusaurus smoke testing.

Commit reviewed changes and version updates before tagging:

```bash
git add .
git commit -m "chore: prepare npm 0.1.1 release"
git tag npm-v0.1.1
git push origin main
git push origin npm-v0.1.1
```

Pushing `npm-v*` runs `.github/workflows/release-npm.yml`: tag/version validation,
frozen install, typecheck, tests, build, packed-consumer verification, then npm publication
in core → React → Remark order. It publishes the same verified tarballs using npm CLI
for OIDC; pnpm supplies the workspace dependency rewriting during packing.
Stable `x.y.z` versions only are accepted, and the tag must match all library versions.
A failed partial publish can be rerun: existing versions are skipped only when their
registry integrity matches the newly verified artifact. Conflicting contents or registry
errors stop the release. npm publication is not atomic across packages.

After a successful run, verify all three versions and their `latest` tags in npm, then
install them in the real consuming app/site. OIDC/provenance and GitHub execution are
not proven by local checks. The workflow does not create an Obsidian release.

## Deferred Obsidian release

`manifest.json` and `versions.json` at repository root are canonical. The package build
copies them into `packages/obsidian-story-map/dist/` with `main.js` and `styles.css`.
The first release is desktop-only, retains `Story Map` / `story-map` subject to directory
uniqueness, and declares Obsidian `1.8.0` pending API review and testing on that version.

Before submission:

- Complete the manual host smoke checks in `AGENTS.md`, including Obsidian 1.8.0.
- Review the scoped `WorkspaceLeaf.setViewState` wrapper and cleanup with other plugins.
- Confirm name/ID uniqueness and the root README's install/use instructions.
- Review dependency licenses and network disclosures (default OpenStreetMap tiles,
  configured tile providers, remote media). Keep map attribution visible.
- Update root manifest and plugin package version together. Update root `versions.json`
  when `minAppVersion` changes; it need not list every release.

```bash
pnpm --filter @story-map/obsidian-story-map build
```

Create a GitHub release with a tag exactly equal to the manifest version (for example
`0.1.0`, without `npm-v` or `v`) and attach `dist/main.js`, `dist/manifest.json` and
`dist/styles.css`. Root `versions.json` controls fallback installs; attaching it is not
a substitute for committing it. Manual installation copies the three plugin files into
`<Vault>/.obsidian/plugins/story-map/`.

Sign in to [Obsidian Community](https://community.obsidian.md), connect GitHub and submit
through the directory. Address scanner/review findings before claiming approval.
The previous `obsidian-releases` PR instructions are obsolete; use the
[official submission guide](https://docs.obsidian.md/plugins/releasing/submit-plugin).
