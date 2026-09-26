import { describe, expect, it } from 'vitest';
import { toSourceDefaults, type StoryMapPluginSettings } from './settings-data.js';

describe('toSourceDefaults', () => {
  it('returns an empty defaults object for empty settings', () => {
    expect(toSourceDefaults({})).toEqual({});
  });

  it('maps populated settings into source defaults', () => {
    const settings: StoryMapPluginSettings = {
      order: 'desc',
      dateField: ' visited ',
      noteDisplay: 'full',
      mapZoom: 5,
      mapMinZoom: 2,
      mapMaxZoom: 18,
      mapTileUrl: ' https://tiles.test/{z}/{x}/{y}.png ',
      mapAttribution: ' © Test ',
      mapShowPath: false,
    };

    expect(toSourceDefaults(settings)).toEqual({
      order: 'desc',
      dateField: 'visited',
      noteDisplay: 'full',
      map: {
        zoom: 5,
        minZoom: 2,
        maxZoom: 18,
        tileUrl: 'https://tiles.test/{z}/{x}/{y}.png',
        attribution: '© Test',
        showPath: false,
      },
    });
  });

  it('ignores blank text and non-finite numbers', () => {
    const settings: StoryMapPluginSettings = {
      dateField: '   ',
      mapZoom: Number.NaN,
      mapTileUrl: '  ',
    };

    expect(toSourceDefaults(settings)).toEqual({});
  });
});
