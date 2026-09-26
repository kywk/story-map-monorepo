# Obsidian community release

2026-09-26. Scope: prepare the desktop plugin's first GitHub release and assist the
owner with community submission; npm releases remain independent.

## Approved decisions and evidence

- Initial plugin version remains `0.1.0`; minimum Obsidian is `1.8.0`, desktop-only.
- The owner reports successful 1.8.0 tests for opening stories, Markdown switching,
  split-pane resize and plugin disable cleanup, and an Obsidian account linked to GitHub.
- `story-map` / `Story Map` already belongs to `prohui` in the official directory.
  The owner selected `geo-story-map` / `Geo Story Map`. The downloaded official list
  contains no exact match for that candidate on this date; final directory validation
  remains authoritative.
- Existing GitHub release list was empty before preparation.

## Implementation

1. Update plugin manifest, host identifiers and visible plugin commands/settings while
   retaining `story-map` Markdown syntax and all npm package names.
2. Fix scoped view-wrapper cleanup so disabling this plugin does not discard a later
   wrapper owned by another plugin. Add routing/cleanup regression tests.
3. Ship full dependency notices from actual esbuild inputs. Add root installation,
   usage and network disclosures, and a community submission guide.
4. Validate frozen install, typecheck, tests, build, release metadata and bundled
   CommonJS import with only Obsidian external and no browser globals.
5. Commit and push, create GitHub Release `0.1.0`, attach the plugin assets and notices,
   then verify downloadable files against the built artifacts.
6. Owner submits repository `https://github.com/kywk/story-map` through the community
   directory; review scanner findings and address concrete feedback. Account login and
   final community approval are not inferred from a successful GitHub release.

Primary agent owns root integration/docs/release. The package audit agent owns the
scoped wrapper source/test fix in `packages/obsidian-story-map`.

## References

- https://docs.obsidian.md/plugins/releasing/submit-plugin
- https://docs.obsidian.md/community-directory/submission-requirements-for-plugins
- https://docs.obsidian.md/community-directory/developer-policies
- https://community.obsidian.md/plugins/story-map
