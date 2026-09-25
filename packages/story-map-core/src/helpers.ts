import type { StoryLocation, StoryMedia, StorySlide } from './types.js';

export function parseWikiLinkRef(value: string): string {
  let ref = value.trim();
  if (ref.startsWith('[[') && ref.endsWith(']]')) {
    ref = ref.slice(2, -2);
  }
  ref = ref.split('|', 1)[0] ?? ref;
  ref = ref.split('#', 1)[0] ?? ref;
  return ref.trim();
}

export function coerceLocation(value: unknown, zoom?: unknown): StoryLocation | undefined {
  const parsedZoom = typeof zoom === 'number' && Number.isFinite(zoom) ? zoom : undefined;

  if (Array.isArray(value) && value.length >= 2) {
    const lat = Number(value[0]);
    const lng = Number(value[1]);
    if (validCoordinates(lat, lng)) {
      return { lat, lng, ...(parsedZoom === undefined ? {} : { zoom: parsedZoom }) };
    }
  }

  if (typeof value === 'string') {
    const parts = value.split(',').map((part) => Number(part.trim()));
    if (parts.length >= 2 && validCoordinates(parts[0]!, parts[1]!)) {
      return {
        lat: parts[0]!,
        lng: parts[1]!,
        ...(parsedZoom === undefined ? {} : { zoom: parsedZoom }),
      };
    }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const lat = Number(record.lat ?? record.latitude);
    const lng = Number(record.lng ?? record.long ?? record.longitude);
    const objectZoom = Number(record.zoom);
    if (validCoordinates(lat, lng)) {
      const finalZoom = Number.isFinite(objectZoom) ? objectZoom : parsedZoom;
      return { lat, lng, ...(finalZoom === undefined ? {} : { zoom: finalZoom }) };
    }
  }

  return undefined;
}

export function coerceMedia(value: unknown): StoryMedia | undefined {
  if (typeof value === 'string' && value.trim()) {
    return { type: 'image', src: value.trim() };
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.src !== 'string' || !record.src.trim()) return undefined;
    const type = record.type === 'video' || record.type === 'iframe' ? record.type : 'image';
    return {
      type,
      src: record.src,
      ...(typeof record.alt === 'string' ? { alt: record.alt } : {}),
      ...(typeof record.caption === 'string' ? { caption: record.caption } : {}),
    };
  }

  return undefined;
}

export function mergeResolvedSlide(base: StorySlide, resolved: Partial<StorySlide>): StorySlide {
  const merged: StorySlide = { ...resolved, ...base };
  const location = base.location ?? resolved.location;
  const media = base.media ?? resolved.media;

  if (location) merged.location = location;
  else delete merged.location;

  if (media) merged.media = media;
  else delete merged.media;

  return merged;
}

function validCoordinates(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
