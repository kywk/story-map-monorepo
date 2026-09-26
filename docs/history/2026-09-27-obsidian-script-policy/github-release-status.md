# GitHub release verification

Published https://github.com/kywk/story-map/releases/tag/0.1.1 from commit `c00ac25`.
The plain `0.1.1` tag is separate from the existing npm release tag `npm-v0.1.1`.
Main and the release manifest declare Geo Story Map `0.1.1`, minimum Obsidian 1.8.0,
desktop only. npm package versions and publications were not changed.

Downloaded all four public assets to `/tmp/geo-story-map-release-0.1.1` and compared
`main.js`, `manifest.json`, `styles.css` and `THIRD_PARTY_NOTICES.txt` byte-for-byte
against the locally validated build; all comparisons passed.

The owner must recheck https://community.obsidian.md/account/plugins/geo-story-map
for the new release and share the updated scanner result. No community approval is
claimed. Recheck desktop disable/re-enable leaf position and settings in the real host.
