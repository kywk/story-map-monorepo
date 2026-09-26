# Obsidian 0.1.2 API compatibility correction

The owner supplied the 0.1.1 scanner result: two unsupported API errors at settings-tab
line 45 and workspace import warnings in the React example and Remark browser client.
The line calls SettingsTab.update(), introduced in 1.13.0. A typeof guard is runtime
safe but still reports as a use of an unsupported API for minimum version 1.8.0.

Remove the update dependency entirely. Definitions and search labels are fixed, so
resetting defaults only needs to redraw the same rows with supported Setting APIs.
Retain getSettingDefinitions as an optional host-invoked override and display as the
legacy fallback. Test actual reset control values and unchanged search labels, including
on a mock modern host whose update method must not be called.

Add a root no-emit tsconfig for source-only whole-workspace analysis, with package paths
to source entry points. Include it in pnpm typecheck; package emit/export configurations
remain unchanged. Verify resolution with --traceResolution. This helps analysis without
built dist declarations; whether the external scanner honors it requires a recheck.
No unsafe imports are silenced or hidden, and no public runtime API is changed.

Bump only the Obsidian adapter/manifest to 0.1.2 and record compatibility in versions.json.
Run install/typecheck/test/build/release checks, commit and publish fresh assets. Keep
published versions immutable. Ask the owner for the new community scanner results.

Primary API declaration:
https://raw.githubusercontent.com/obsidianmd/obsidian-api/master/obsidian.d.ts
Related scanner report (not proof of this scanner's configuration):
https://github.com/obsidianmd/eslint-plugin/issues/178
