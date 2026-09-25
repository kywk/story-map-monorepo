import { describe, expect, it } from 'vitest';
import { parseStoryMapYaml, parseWikiLinkRef } from './index.js';

describe('parseStoryMapYaml', () => {
  it('parses canonical v1 syntax', () => {
    const story = parseStoryMapYaml(`
      title: Demo
      slides:
        - title: Taipei
          location: [25.033, 121.5654]
          zoom: 13
          media: ./taipei.jpg
    `);

    expect(story.schema).toBe('storymap/v1');
    expect(story.slides[0]?.location).toEqual({ lat: 25.033, lng: 121.5654, zoom: 13 });
    expect(story.slides[0]?.media).toEqual({ type: 'image', src: './taipei.jpg' });
  });

  it('normalizes Leaflet-style root keys', () => {
    const story = parseStoryMapYaml(`
      lat: 25.033
      long: 121.5654
      defaultZoom: 10
      tileServer: https://example.test/{z}/{x}/{y}.png
      slides:
        - title: Taipei
    `);

    expect(story.map.center).toEqual([25.033, 121.5654]);
    expect(story.map.zoom).toBe(10);
    expect(story.map.tileUrl).toContain('example.test');
  });
});

describe('parseWikiLinkRef', () => {
  it('removes alias and heading', () => {
    expect(parseWikiLinkRef('[[Trips/Santiago#Food|Santiago]]')).toBe('Trips/Santiago');
  });
});
