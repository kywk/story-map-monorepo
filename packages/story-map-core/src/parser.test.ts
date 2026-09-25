import { describe, expect, it } from 'vitest';
import {
  StoryMapParseError,
  coerceLocation,
  coerceMedia,
  mergeResolvedSlide,
  parseStoryMapObject,
  parseStoryMapYaml,
  parseWikiLinkRef,
  validCoordinates,
} from './index.js';

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
    expect(story.height).toBe('520px');
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
    expect(story.map.attribution).toBe('© OpenStreetMap contributors');
    expect(story.map.showPath).toBe(true);
  });

  it('accepts lng as an alias for long', () => {
    const story = parseStoryMapYaml(`
      lat: 25.033
      lng: 121.5654
      slides:
        - title: Taipei
    `);

    expect(story.map.center).toEqual([25.033, 121.5654]);
  });

  it('coerces comma-separated string locations', () => {
    const story = parseStoryMapYaml(`
      slides:
        - title: Taipei
          location: "25.033, 121.5654"
          zoom: 11
    `);

    expect(story.slides[0]?.location).toEqual({ lat: 25.033, lng: 121.5654, zoom: 11 });
  });

  it('coerces object media with explicit type', () => {
    const story = parseStoryMapYaml(`
      slides:
        - media:
            type: video
            src: ./clip.mp4
            caption: On the road
    `);

    expect(story.slides[0]?.media).toEqual({
      type: 'video',
      src: './clip.mp4',
      caption: 'On the road',
    });
  });

  it('fails clearly on an invalid slide location', () => {
    expect(() => parseStoryMapYaml('slides:\n  - location: [999, 999]\n')).toThrow(
      StoryMapParseError,
    );
  });

  it('fails clearly on non-numeric slide coordinates', () => {
    expect(() => parseStoryMapYaml('slides:\n  - location: somewhere\n')).toThrow(
      /not a valid/,
    );
  });

  it('fails clearly on partial root coordinates', () => {
    expect(() => parseStoryMapYaml('lat: 25.033\nslides:\n  - title: Taipei\n')).toThrow(
      /Root coordinates/,
    );
  });
});

describe('parseStoryMapObject', () => {
  it('rejects out-of-range canonical coordinates', () => {
    expect(() =>
      parseStoryMapObject({
        slides: [{ location: { lat: 120, lng: 10 } }],
      }),
    ).toThrow(StoryMapParseError);
  });

  it('applies schema defaults', () => {
    const story = parseStoryMapObject({ slides: [{ title: 'One' }] });

    expect(story.schema).toBe('storymap/v1');
    expect(story.map.zoom).toBe(6);
    expect(story.map.tileUrl).toContain('openstreetmap.org');
  });
});

describe('coerceLocation', () => {
  it('reads frontmatter latitude/longitude aliases', () => {
    expect(coerceLocation({ latitude: 25.033, longitude: 121.5654, zoom: 9 })).toEqual({
      lat: 25.033,
      lng: 121.5654,
      zoom: 9,
    });
  });

  it('returns undefined for unsupported input instead of throwing', () => {
    expect(coerceLocation('not a place')).toBeUndefined();
    expect(coerceLocation(undefined)).toBeUndefined();
  });
});

describe('coerceMedia', () => {
  it('treats a bare string as an image', () => {
    expect(coerceMedia(' ./a.jpg ')).toEqual({ type: 'image', src: './a.jpg' });
  });

  it('ignores empty or invalid values', () => {
    expect(coerceMedia('')).toBeUndefined();
    expect(coerceMedia({ type: 'video' })).toBeUndefined();
  });
});

describe('mergeResolvedSlide', () => {
  it('lets explicit slide values win over resolved frontmatter', () => {
    const merged = mergeResolvedSlide(
      { title: 'Explicit', location: { lat: 1, lng: 2 } },
      { title: 'From note', text: 'Inherited', location: { lat: 9, lng: 9 } },
    );

    expect(merged.title).toBe('Explicit');
    expect(merged.text).toBe('Inherited');
    expect(merged.location).toEqual({ lat: 1, lng: 2 });
  });
});

describe('parseWikiLinkRef', () => {
  it('removes alias and heading', () => {
    expect(parseWikiLinkRef('[[Trips/Santiago#Food|Santiago]]')).toBe('Trips/Santiago');
  });

  it('removes embed and alias syntax', () => {
    expect(parseWikiLinkRef('![[assets/map.png|Map]]')).toBe('assets/map.png');
  });

  it('handles plain references and trims whitespace', () => {
    expect(parseWikiLinkRef('  Note Name  ')).toBe('Note Name');
  });
});

describe('validCoordinates', () => {
  it('checks finite ranges', () => {
    expect(validCoordinates(25.033, 121.5654)).toBe(true);
    expect(validCoordinates(91, 0)).toBe(false);
    expect(validCoordinates(0, 181)).toBe(false);
    expect(validCoordinates(Number.NaN, 0)).toBe(false);
  });
});
