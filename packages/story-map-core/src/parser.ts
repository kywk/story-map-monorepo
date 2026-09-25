import { load } from 'js-yaml';
import { storyMapSchema } from './schema.js';
import { coerceLocation, coerceMedia } from './helpers.js';
import type { StoryMapConfig } from './types.js';

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeSlide(value: unknown): Record<string, unknown> {
  const slide = { ...asRecord(value) };
  const location = coerceLocation(slide.location, slide.zoom);
  const media = coerceMedia(slide.media);

  if (location) slide.location = location;
  if (media) slide.media = media;
  delete slide.zoom;

  return slide;
}

export function normalizeStoryMapInput(value: unknown): unknown {
  const input = { ...asRecord(value) };
  const map = { ...asRecord(input.map) };

  if (!map.center && input.lat !== undefined && (input.long !== undefined || input.lng !== undefined)) {
    const lat = Number(input.lat);
    const lng = Number(input.long ?? input.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) map.center = [lat, lng];
  }

  if (map.zoom === undefined && input.defaultZoom !== undefined) map.zoom = Number(input.defaultZoom);
  if (map.tileUrl === undefined && input.tileServer !== undefined) map.tileUrl = input.tileServer;

  input.map = map;
  if (Array.isArray(input.slides)) input.slides = input.slides.map(normalizeSlide);

  delete input.lat;
  delete input.long;
  delete input.lng;
  delete input.defaultZoom;
  delete input.tileServer;

  return input;
}

export function parseStoryMapObject(value: unknown): StoryMapConfig {
  return storyMapSchema.parse(normalizeStoryMapInput(value)) as StoryMapConfig;
}

export function parseStoryMapYaml(source: string): StoryMapConfig {
  return parseStoryMapObject(load(source));
}
