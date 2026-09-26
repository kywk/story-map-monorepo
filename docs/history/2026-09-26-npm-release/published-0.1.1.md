# npm 0.1.1 published

2026-09-26: the owner confirmed all three Trusted Publishers were saved and authorized
publication. All three public packages are now `0.1.1`, with `latest: 0.1.1`, repository
`kywk/story-map`, and SLSA v1 provenance attestations:

- https://www.npmjs.com/package/@story-map/story-map-core
- https://www.npmjs.com/package/@story-map/react-story-map
- https://www.npmjs.com/package/@story-map/remark-story-map

Successful run: https://github.com/kywk/story-map/actions/runs/36235091030
Release tag: `npm-v0.1.1`, pointing at `1efe60c8b796bbea62b942c5f3902bfa57df6c7a`.

The first workflow was rejected before any job ran because job-level environment values
cannot use the runner context. Commit `1efe60c` moved `RELEASE_PACK_DIR` to step-level
environment values. After registry checks confirmed `0.1.1` did not exist, the tag was
updated with an explicit force-with-lease and publication retriggered. No existing npm
version was overwritten.

GitHub Node 24 checks passed: frozen installation, typecheck, 92 tests, full build,
isolated tarball consumer and npm OIDC publication. After publication, registry metadata
confirmed all three latest tags and attestations. A fresh project in
`/tmp/story-map-registry-0.1.1/` installed the actual registry versions and passed core
and Remark imports, React SSR without browser globals, fence transformation and CSS/client
export resolution.

Obsidian submission and manual host smoke tests remain deferred. This release confirms
the npm distribution workflow, not unexecuted GUI/mobile/site integration tests.
