import { load } from 'js-yaml';
import { storyMapSchema } from './schema.js';
import { coerceLocation, coerceMedia, validCoordinates } from './helpers.js';
import type { StoryMapConfig } from './types.js';

export class StoryMapParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoryMapParseError';
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeSlide(value: unknown, index: number): Record<string, unknown> {
  const slide = { ...asRecord(value) };
  const hasLocation = slide.location !== undefined;
  const location = coerceLocation(slide.location, slide.zoom);
  const media = coerceMedia(slide.media);

  if (hasLocation && !location) {
    throw new StoryMapParseError(
      `slides[${index}].location is not a valid [lat, lng] coordinate pair.`,
    );
  }

  if (location) slide.location = location;
  if (media) slide.media = media;
  delete slide.zoom;

  return slide;
}

export function normalizeStoryMapInput(value: unknown): unknown {
  const input = { ...asRecord(value) };
  const map = { ...asRecord(input.map) };

  const hasLat = input.lat !== undefined;
  const hasLng = input.long !== undefined || input.lng !== undefined;

  if (hasLat || hasLng) {
    const lat = Number(input.lat);
    const lng = Number(input.long ?? input.lng);
    if (!hasLat || !hasLng || !validCoordinates(lat, lng)) {
      throw new StoryMapParseError(
        'Root coordinates are invalid. Provide both lat and long (or lng) within valid ranges.',
      );
    }
    if (!map.center) map.center = [lat, lng];
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
