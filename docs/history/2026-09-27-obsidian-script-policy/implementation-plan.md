# Obsidian script-creation scanner correction

The owner submitted Geo Story Map and reported an error under Code obfuscation:
`createElement('script')`, described as runtime script injection.

Inspection identified three literal calls in bundled React DOM 19.3.0: script preinit,
module-script preinit and asynchronous script resources. React's ordinary script branch
also creates an inert script through HTML parsing. Geo Story Map uses none of these APIs.

Implement an explicit Obsidian-only build policy that replaces the three creation calls
and inert rendering branch with a throwing unsupported-operation function. Do not hide
strings, disguise calls, externalize runtime dependencies, modify installed packages or
change the published React/Remark libraries. Validate the expected upstream shapes and
stop the build when the dependency changes or script creation remains in the artifact.

Add actual React DOM tests for normal rendering/events/state/unmount, blocked preinit
and blocked inline/asynchronous script rendering. jsdom is a plugin dev dependency only.
Keep upstream licenses and disclose the host-local modification in bundled notices.

Bump only the Obsidian plugin to `0.1.1`, run full checks, commit/push, and publish a new
plain-version GitHub release. Keep `0.1.0` intact. Have the owner recheck the authenticated
community entry; scanner approval is not inferred from local pattern checks.
