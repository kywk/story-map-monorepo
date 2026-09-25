import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import type { Code, Html, Root } from 'mdast';
import { afterAll, describe, expect, it } from 'vitest';
import { parseStoryMapSourceObject } from '@story-map/story-map-core';
import remarkStoryMap, { VaultIndex } from './index.js';

function storyMapTree(value: string): Root {
  return {
    type: 'root',
    children: [{ type: 'code', lang: 'story-map', value }],
  };
}

function readConfig(html: Html): Record<string, unknown> {
  const match = /data-story-map-config="(.+?)"/.exec(html.value);
  if (!match?.[1]) throw new Error('StoryMap host attribute missing');
  return JSON.parse(decodeURIComponent(match[1])) as Record<string, unknown>;
}

describe('remarkStoryMap', () => {
  it('replaces a story-map fence with a serialized host element', () => {
    const tree = storyMapTree('title: Demo\nslides:\n  - title: One\n');

    remarkStoryMap()(tree);

    const node = tree.children[0] as Html;
    expect(node.type).toBe('html');
    expect(node.value).toContain('class="story-map-host"');

    const config = readConfig(node);
    expect(config.schema).toBe('storymap/v1');
    expect((config.slides as Array<{ title: string }>)[0]?.title).toBe('One');
  });

  it('ignores the legacy storymap fence', () => {
    const tree: Root = {
      type: 'root',
      children: [{ type: 'code', lang: 'storymap', value: 'title: Demo' }],
    };

    remarkStoryMap()(tree);

    expect((tree.children[0] as Code).lang).toBe('storymap');
  });

  it('leaves other fenced code blocks untouched', () => {
    const tree: Root = {
      type: 'root',
      children: [{ type: 'code', lang: 'yaml', value: 'title: Demo' }],
    };

    remarkStoryMap()(tree);

    expect(tree.children[0]).toEqual({ type: 'code', lang: 'yaml', value: 'title: Demo' } satisfies Code);
  });

  it('resolves note frontmatter when vaultRoot is configured', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'storymap-remark-'));
    try {
      writeFileSync(
        path.join(root, 'Santiago.md'),
        matter.stringify('Body', {
          title: 'Santiago',
          location: [-33.4489, -70.6693],
          description: 'Intro',
          cover: './santiago.jpg',
        }),
      );

      const tree = storyMapTree('slides:\n  - note: "[[Santiago]]"\n');
      remarkStoryMap({ vaultRoot: root, assetBase: '/assets' })(tree);

      const config = readConfig(tree.children[0] as Html);
      const slide = (config.slides as Array<Record<string, unknown>>)[0];
      expect(slide?.title).toBe('Santiago');
      expect(slide?.text).toBe('Intro');
      expect(slide?.location).toEqual({ lat: -33.4489, lng: -70.6693 });
      expect(slide?.media).toEqual({ type: 'image', src: '/assets/santiago.jpg' });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('VaultIndex', () => {
  const vaultRoot = mkdtempSync(path.join(tmpdir(), 'storymap-vault-'));
  mkdirSync(path.join(vaultRoot, 'Trips'));
  writeFileSync(
    path.join(vaultRoot, 'Trips', 'Santiago.md'),
    matter.stringify('Body text', {
      title: 'Santiago',
      location: [-33.4489, -70.6693],
      description: 'A short introduction.',
      cover: './santiago.jpg',
      mapmarker: 'city',
    }),
  );

  afterAll(() => rmSync(vaultRoot, { recursive: true, force: true }));

  const baseStory = {
    schema: 'storymap/v1' as const,
    height: '520px',
    map: {
      zoom: 6,
      tileUrl: 'https://example.test/{z}/{x}/{y}.png',
      attribution: 'test',
      showPath: true,
    },
    slides: [],
  };

  it('inherits frontmatter from a WikiLink note and resolves local media', () => {
    const vault = new VaultIndex({ vaultRoot, assetBase: '/vault-assets' });

    const story = vault.resolveStory({
      ...baseStory,
      slides: [{ note: '[[Santiago]]' }],
    });

    expect(story.slides[0]?.title).toBe('Santiago');
    expect(story.slides[0]?.text).toBe('A short introduction.');
    expect(story.slides[0]?.location).toEqual({ lat: -33.4489, lng: -70.6693 });
    expect(story.slides[0]?.media).toEqual({
      type: 'image',
      src: '/vault-assets/Trips/santiago.jpg',
    });
    expect(story.slides[0]?.mapmarker).toBe('city');
  });

  it('lets explicit slide values override note frontmatter', () => {
    const vault = new VaultIndex({ vaultRoot });

    const story = vault.resolveStory({
      ...baseStory,
      slides: [{ note: '[[Santiago]]', title: 'Explicit', location: { lat: 1, lng: 2 } }],
    });

    expect(story.slides[0]?.title).toBe('Explicit');
    expect(story.slides[0]?.location).toEqual({ lat: 1, lng: 2 });
  });

  it('throws when a basename WikiLink is ambiguous', () => {
    const otherRoot = mkdtempSync(path.join(tmpdir(), 'storymap-ambiguous-'));
    mkdirSync(path.join(otherRoot, 'a'));
    mkdirSync(path.join(otherRoot, 'b'));
    writeFileSync(path.join(otherRoot, 'a', 'Note.md'), '---\ntitle: A\n---\n');
    writeFileSync(path.join(otherRoot, 'b', 'Note.md'), '---\ntitle: B\n---\n');

    try {
      const vault = new VaultIndex({ vaultRoot: otherRoot });
      expect(() => vault.resolveStory({ ...baseStory, slides: [{ note: '[[Note]]' }] })).toThrow(
        /Ambiguous/,
      );
    } finally {
      rmSync(otherRoot, { recursive: true, force: true });
    }
  });
});

describe('VaultIndex folder discovery', () => {
  const vaultRoot = mkdtempSync(path.join(tmpdir(), 'storymap-folder-'));
  mkdirSync(path.join(vaultRoot, 'Places', 'Nested'), { recursive: true });
  writeFileSync(
    path.join(vaultRoot, 'Places', '2026-01 Santiago.md'),
    matter.stringify('Body', {
      'story-map-note': true,
      title: 'Santiago',
      'date-created': '2026-01-15',
      location: [-33.4489, -70.6693],
      cover: './santiago.jpg',
    }),
  );
  writeFileSync(
    path.join(vaultRoot, 'Places', 'Nested', '2026-02 Atacama.md'),
    matter.stringify('Body', { 'story-map-note': true, title: 'Atacama', 'date-created': '2026-02-20' }),
  );
  writeFileSync(path.join(vaultRoot, 'Places', 'No Flag.md'), matter.stringify('Body', { title: 'Ignored' }));
  writeFileSync(
    path.join(vaultRoot, 'Places', 'Undated.md'),
    matter.stringify('Body', { 'story-map-note': true, title: 'Undated' }),
  );
  writeFileSync(path.join(vaultRoot, 'Places', 'santiago.jpg'), 'fake');

  afterAll(() => rmSync(vaultRoot, { recursive: true, force: true }));

  it('recursively resolves flagged notes with date ordering and note-relative media', () => {
    const vault = new VaultIndex({ vaultRoot, assetBase: '/vault-assets' });
    const story = vault.resolveSource(
      parseStoryMapSourceObject({ noteFolder: 'Places' }),
    );

    expect(story.slides.map((slide) => slide.title)).toEqual(['Santiago', 'Atacama', 'Undated']);
    expect(story.slides[0]?.media).toEqual({
      type: 'image',
      src: '/vault-assets/Places/santiago.jpg',
    });
  });

  it('sorts descending while keeping undated notes last', () => {
    const vault = new VaultIndex({ vaultRoot });
    const story = vault.resolveSource(
      parseStoryMapSourceObject({ noteFolder: 'Places', order: 'desc' }),
    );

    expect(story.slides.map((slide) => slide.title)).toEqual(['Atacama', 'Santiago', 'Undated']);
  });

  it('does not append folder notes when explicit slides exist', () => {
    const vault = new VaultIndex({ vaultRoot });
    const story = vault.resolveSource(
      parseStoryMapSourceObject({ noteFolder: 'Places', slides: [{ title: 'Explicit' }] }),
    );

    expect(story.slides).toHaveLength(1);
    expect(story.slides[0]?.title).toBe('Explicit');
  });
});
