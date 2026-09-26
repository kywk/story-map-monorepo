# Verified release recommendations

Workflow commit: 68f7ba2.
Successful CI: https://github.com/kywk/story-map/actions/runs/36258064449

The workflow checked out tag 0.1.2, ran install/typecheck/test/build/release checks,
compared main.js/styles.css/manifest.json against the public release, then generated
GitHub build attestations. Existing release code was not replaced.

Independent local commands against the previously downloaded public assets both
returned success:

    gh attestation verify /tmp/geo-story-map-release-0.1.2/main.js --repo kywk/story-map
    gh attestation verify /tmp/geo-story-map-release-0.1.2/styles.css --repo kywk/story-map

Confirmed the complete generated license text is embedded in main.js as line comments
before deleting the extra THIRD_PARTY_NOTICES.txt release attachment. The generated
local notices file and build behavior remain intact.

The release API now lists exactly main.js, manifest.json and styles.css. Version remains
0.1.2; npm publications are unchanged. Community scanner recheck/approval remains pending.
