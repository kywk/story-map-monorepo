# Release recommendation follow-up

The owner reports two recommendations for 0.1.2: missing artifact attestations for
main.js/styles.css, and an unsupported THIRD_PARTY_NOTICES.txt release attachment.

Remove the extra attachment after verifying its full content is already embedded in
main.js. Keep license generation and notices within main.js unchanged. Publish only
the three automatically downloaded files in future releases.

Add a GitHub Actions plugin release workflow for plain version tags, with manual dispatch
for existing versions. Build from the selected immutable source tag, validate manifest,
run all checks, and compare existing public assets byte-for-byte before attesting them.
Never replace published code to achieve a match. Attest main.js, styles.css and manifest;
new tags publish those three assets after successful attestation.

Run the workflow for existing 0.1.2 and independently verify downloaded main.js/styles.css
with gh attestation verify. This creates provenance for a CI build verified identical to
the existing artifacts; it does not claim the original local upload was performed by CI.
No plugin or npm version bump is needed.

Official attestation workflow guidance:
https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations
