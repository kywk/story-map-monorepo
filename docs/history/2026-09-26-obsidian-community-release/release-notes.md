Geo Story Map turns Markdown notes into geographic stories with an interactive Leaflet
map and slide navigation.

- Recursive discovery from one note folder, ordered by the configured date field.
- Explicit slides preserve author order.
- Metadata-only, linked-title and full-note display modes.
- Markdown ↔ Geo Story Map switching, page previews and note navigation.
- Configurable map defaults and full-leaf resize handling.

Desktop Obsidian 1.8.0 or newer is required. Mobile is not supported in this release.
The plugin ID is `geo-story-map`; document frontmatter and fenced language remain
`story-map`. The separate Obsidian Leaflet plugin is not required.

For manual installation, copy `main.js`, `manifest.json`, `styles.css` and
`THIRD_PARTY_NOTICES.txt` into `<Vault>/.obsidian/plugins/geo-story-map/`, then enable
Geo Story Map in Community plugins. The full license notices are also embedded in
`main.js` for automatic installs.

Maps use OpenStreetMap network tiles by default. Configured tile services and remote
media connect to their specified hosts. No plugin account, payment or telemetry is used.

Community-directory approval is pending. See the repository README for document examples
and `docs/obsidian-submission.md` for submission instructions.
