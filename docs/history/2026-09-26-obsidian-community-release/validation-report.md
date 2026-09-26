# Geo Story Map 0.1.0 release validation

2026-09-26. The owner selected `Geo Story Map` / `geo-story-map` after the original
candidate was confirmed to belong to another plugin. A current official plugin-list
snapshot had no exact candidate ID or name match; the community directory remains the
final uniqueness authority.

## Verified

- Frozen pnpm install, typecheck and full build passed.
- All 97 automated tests passed: 91 package tests and 6 npm release guards.
- Five new Obsidian tests cover ordinary view forwarding, story routing, explicit
  Markdown override, owned-wrapper restoration and preservation of later wrappers.
- Root/build manifests match, plugin/package versions both equal `0.1.0`, minimum
  version is `1.8.0`, desktop-only flag is true, and description meets length/period rules.
- The build includes complete notices for 79 actually bundled dependency packages,
  both as a separate text artifact and comments in `main.js` for automatic installs.
- Bundled CommonJS import succeeded with Obsidian as the only runtime external.
  Unlike the Node/SSR library entry, the browser bundle's Markdown decoder eagerly
  creates an inert `i` element. Validation therefore supplies that minimal host DOM and
  rejects other import-time DOM initialization; it does not claim browser-free plugin
  import or simulate a real Obsidian renderer.
- The maintainer reports successful Obsidian 1.8.0 desktop checks for opening stories,
  Markdown switching, split-pane resize and disable cleanup. These are user-reported,
  not GUI checks performed by the agent on the renamed final artifact.
- Inspected public APIs are compatible with the declared minimum according to current
  type declaration history; `revealLeaf` is the newest required API, introduced in 1.7.2.

## Distribution and remaining review

Publish plain GitHub tag `0.1.0` with `main.js`, `manifest.json`, `styles.css` and
`THIRD_PARTY_NOTICES.txt`; verify uploaded/downloaded bytes against the build.
The owner confirms community login and GitHub linkage. Submit repository
`https://github.com/kywk/story-map`, then inspect scanner findings. Community approval,
in-app listing, screenshots, mobile and unperformed host checks are not claimed here.

Source note schema and all npm library artifacts are unchanged by this plugin release.
