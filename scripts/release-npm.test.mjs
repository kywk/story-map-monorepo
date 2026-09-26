import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = mkdtempSync(join(tmpdir(), 'story-map-release-test-'));
const names = ['story-map-core', 'react-story-map', 'remark-story-map'];
const version = JSON.parse(readFileSync(join(root, 'packages/story-map-core/package.json'))).version;
const integrity = {};
for (const name of names) {
  const manifest = JSON.parse(readFileSync(join(root, 'packages', name, 'package.json')));
  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    if (dependency.startsWith('@story-map/')) manifest.dependencies[dependency] = manifest.version;
  }
  const directory = join(fixture, name, 'package');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest));
  for (const file of ['README.md', 'LICENSE']) writeFileSync(join(directory, file), 'fixture');
  const targets = value => typeof value === 'string' ? [value] : Object.values(value).flatMap(targets);
  for (const target of targets(manifest.exports)) {
    const file = join(directory, target);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, '');
  }
  const tarball = join(fixture, `story-map-${name}-${manifest.version}.tgz`);
  execFileSync('tar', ['-czf', tarball, '-C', dirname(directory), 'package']);
  integrity[`${manifest.name}@${manifest.version}`] = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`;
}
const bin = join(fixture, 'bin');
mkdirSync(bin);
writeFileSync(join(bin, 'npm'), `#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
const args = process.argv.slice(2);
if (args[0] === 'publish') {
  appendFileSync(process.env.PUBLISH_LOG, args[1] + '\\n');
} else if (process.env.REGISTRY_MODE === 'missing' || (process.env.REGISTRY_MODE === 'partial' && !args[1].includes('story-map-core'))) {
  console.log(JSON.stringify({ error: { code: 'E404' } })); process.exit(1);
} else if (process.env.REGISTRY_MODE === 'network') {
  console.log(JSON.stringify({ error: { code: 'EAI_AGAIN' } })); process.exit(1);
} else {
  const hashes = JSON.parse(process.env.REGISTRY_HASHES);
  console.log(JSON.stringify({ integrity: process.env.REGISTRY_MODE === 'conflict' ? 'different' : hashes[args[1]] }));
}
`, { mode: 0o755 });
writeFileSync(join(bin, 'package.json'), '{"type":"module"}');

function attempt(mode, tag = `npm-v${version}`) {
  const log = join(fixture, `${mode}-${tag}.log`);
  writeFileSync(log, '');
  const result = spawnSync('node', [join(root, 'scripts/release-npm.mjs'), '--publish'], {
    encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`,
      RELEASE_TAG: tag, RELEASE_PACK_DIR: fixture, REGISTRY_MODE: mode,
      REGISTRY_HASHES: JSON.stringify(integrity), PUBLISH_LOG: log },
  });
  return { ...result, published: readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) };
}

test('publishes missing packages in dependency order', () => {
  const result = attempt('missing');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.published.map(path => path.split('/').at(-1)),
    names.map(name => `story-map-${name}-${version}.tgz`));
});
test('retry skips immutable versions only when integrity matches', () => {
  const result = attempt('matching');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.published, []);
});
test('partial release retry publishes only remaining packages', () => {
  const result = attempt('partial');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.published.map(path => path.split('/').at(-1)),
    names.slice(1).map(name => `story-map-${name}-${version}.tgz`));
});
for (const mode of ['conflict', 'network']) {
  test(`${mode} stops publication`, () => {
    const result = attempt(mode);
    assert.notEqual(result.status, 0);
    assert.deepEqual(result.published, []);
  });
}
test('mismatched release tag stops publication', () => {
  const result = attempt('missing', 'npm-v99.0.0');
  assert.notEqual(result.status, 0);
  assert.deepEqual(result.published, []);
});
