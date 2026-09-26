import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packages = ['story-map-core', 'react-story-map', 'remark-story-map'];
const manifests = packages.map(name => JSON.parse(readFileSync(join(root, 'packages', name, 'package.json'))));
const version = manifests[0].version;
assert.match(version, /^\d+\.\d+\.\d+$/, 'Only stable x.y.z versions can be published to latest.');
for (const [index, manifest] of manifests.entries()) {
  assert.equal(manifest.name, `@story-map/${packages[index]}`);
  assert.equal(manifest.version, version, 'Library versions must match.');
  assert.equal(manifest.private, undefined, 'Release allowlist must contain public packages.');
  assert.equal(manifest.publishConfig.access, 'public');
}
const tag = process.env.RELEASE_TAG ?? process.env.GITHUB_REF_NAME;
if (tag) assert.equal(tag, `npm-v${version}`, 'Tag must match all three package versions.');
if (process.argv.includes('--check')) {
  console.log(`Release metadata OK: npm-v${version}`);
  process.exit(0);
}

const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: 'inherit' });
const packed = process.env.RELEASE_PACK_DIR
  ? resolve(process.env.RELEASE_PACK_DIR)
  : mkdtempSync(join(tmpdir(), 'story-map-packed-'));
mkdirSync(packed, { recursive: true });
if (!process.argv.includes('--publish')) {
  run('pnpm', [...packages.flatMap(name => ['--filter', `@story-map/${name}`]),
    'pack', '--pack-destination', packed]);
} else {
  assert(process.env.RELEASE_PACK_DIR, 'Publish the previously verified RELEASE_PACK_DIR artifacts.');
}
const tarballs = packages.map(name => join(packed, `story-map-${name}-${version}.tgz`));
for (const [index, tarball] of tarballs.entries()) {
  const contents = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n');
  for (const file of ['package.json', 'README.md', 'LICENSE']) assert(contents.includes(`package/${file}`), `${tarball} lacks ${file}`);
  const manifest = JSON.parse(execFileSync('tar', ['-xOf', tarball, 'package/package.json'], { encoding: 'utf8' }));
  assert.equal(manifest.name, manifests[index].name);
  assert.equal(manifest.version, version);
  for (const [name, range] of Object.entries(manifest.dependencies ?? {})) {
    assert(!range.startsWith('workspace:'), 'Packed dependencies must not use workspace protocols.');
    if (name.startsWith('@story-map/')) assert.equal(range, version);
  }
  const targets = value => typeof value === 'string' ? [value] : Object.values(value).flatMap(targets);
  for (const target of targets(manifest.exports)) assert(contents.includes(`package/${target.replace(/^\.\//, '')}`), `Missing export ${target}`);
}

if (process.argv.includes('--publish')) {
  assert(tag, 'Publishing requires RELEASE_TAG or GITHUB_REF_NAME.');
  // Pack first with pnpm (workspace rewriting), publish with npm (OIDC support).
  for (const [index, tarball] of tarballs.entries()) {
    const spec = `${manifests[index].name}@${version}`;
    const result = spawnSync('npm', ['view', spec, 'dist', '--json'], { encoding: 'utf8' });
    if (result.status !== 0) {
      const error = JSON.parse(result.stdout || '{}');
      assert.equal(error.error?.code, 'E404', `Registry lookup failed: ${result.stderr}`);
      run('npm', ['publish', tarball, '--access', 'public', '--tag', 'latest']);
      continue;
    }
    const published = JSON.parse(result.stdout || '{}');
    const integrity = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`;
    assert.equal(published.integrity, integrity, `${spec} already exists with different contents.`);
    console.log(`Already published with matching integrity: ${spec}`);
  }
  process.exit(0);
}

const consumer = mkdtempSync(join(tmpdir(), 'story-map-consumer-'));
writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'release-consumer', private: true, type: 'module' }));
const dev = JSON.parse(readFileSync(join(root, 'package.json'))).devDependencies;
run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs,
  'react@19', 'react-dom@19', `@types/react@${dev['@types/react']}`,
  `@types/react-dom@${dev['@types/react-dom']}`, `typescript@${dev.typescript}`], consumer);
writeFileSync(join(consumer, 'smoke.mjs'), `
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { parseStoryMapYaml } from '@story-map/story-map-core';
import { StoryMap } from '@story-map/react-story-map';
import remarkStoryMap from '@story-map/remark-story-map';
const yaml = 'title: Packed consumer\\nslides:\\n  - title: Santiago\\n    location: [-33.4489, -70.6693]';
const story = parseStoryMapYaml(yaml);
assert(renderToString(createElement(StoryMap, { story })).includes('Santiago'));
assert.equal(typeof window, 'undefined');
const tree = { type: 'root', children: [{ type: 'code', lang: 'story-map', value: yaml }] };
remarkStoryMap()(tree);
assert.equal(tree.children[0].type, 'html');
assert(tree.children[0].value.includes('data-story-map-config'));
const require = createRequire(import.meta.url);
require.resolve('@story-map/react-story-map/styles.css');
require.resolve('@story-map/remark-story-map/client');
require.resolve('leaflet/dist/leaflet.css');
console.log('Packed consumer imports, SSR, Remark transform and CSS exports OK');
`);
writeFileSync(join(consumer, 'types.ts'), `
import { parseStoryMapYaml, type StoryMapConfig } from '@story-map/story-map-core';
import { StoryMap, type StoryMapProps } from '@story-map/react-story-map';
import remarkStoryMap, { type RemarkStoryMapOptions } from '@story-map/remark-story-map';
import { mountStoryMaps } from '@story-map/remark-story-map/client';
const story: StoryMapConfig = parseStoryMapYaml('slides: []');
const props: StoryMapProps = { story };
const options: RemarkStoryMapOptions = { resolveNoteHref: path => '/' + path };
void [StoryMap, props, remarkStoryMap(options), mountStoryMaps];
`);
run('node', ['smoke.mjs'], consumer);
run('node', ['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--skipLibCheck',
  '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022',
  '--jsx', 'react-jsx', 'types.ts'], consumer);
console.log(`Release artifacts verified: ${packed}\nConsumer project: ${consumer}`);
