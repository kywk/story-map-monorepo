Fix the community scanner's script-creation finding by disabling React DOM's unused
script-element creation paths in the Obsidian bundle.

- Script preinitialization, module-script preinitialization, and inline/asynchronous
  script rendering now reject the operation before creating a script element.
- The build validates the expected React source paths and checks the final bundle.
- DOM regression tests cover ordinary rendering, click/state updates and unmount.

Geo Story Map remains desktop-only, with minimum Obsidian 1.8.0. ID: `geo-story-map`.
Markdown syntax and npm libraries are unchanged. Dependency licenses are retained,
and the host-local React modification is disclosed in the bundled notices.

Update using `main.js`, `manifest.json`, `styles.css` and `THIRD_PARTY_NOTICES.txt`.
Community scanner recheck and approval are pending.

Source review corrections:
- Preserve workspace leaves when disabling the plugin.
- Use CSS for static host styles, and simplify command/settings labels.
- Add searchable setting definitions on 1.13+ while retaining 1.8 legacy rendering.
- Remove deprecated reset button styling and redundant type assertion.
- Preserve scoped wrapper behavior without a detached method reference or this alias.
