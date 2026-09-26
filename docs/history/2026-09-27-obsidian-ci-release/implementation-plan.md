# Geo Story Map 0.1.3 CI release

The community page still reports the previous release recommendations although the
0.1.2 GitHub assets and attestations have been independently verified. The cause of
this mismatch is not confirmed; stale scan data is one possibility.

Following the maintainer's instruction to continue, publish a new plugin version through
the existing tag-triggered CI. Bump only adapter metadata to 0.1.3, preserve minimum
Obsidian 1.8.0 and desktop-only support. No functional source or npm versions change.
CI runs install/typecheck/test/build and release checks, attests assets before publication,
and uploads only main.js, manifest.json and styles.css. Full notices stay in main.js.
Verify the workflow, public assets and provenance, then ask for a new community scan.
A new release is not proof of scanner acceptance or community approval.
