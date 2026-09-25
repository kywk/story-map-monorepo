export type LatLngTuple = [lat: number, lng: number];

export interface StoryLocation {
  lat: number;
  lng: number;
  zoom?: number;
}

export type StoryMediaType = 'image' | 'video' | 'iframe';

export interface StoryMedia {
  type: StoryMediaType;
  src: string;
  alt?: string;
  caption?: string;
}

export interface StorySlide {
  id?: string;
  note?: string;
  title?: string;
  text?: string;
  location?: StoryLocation;
  media?: StoryMedia;
  mapmarker?: string;
}

export interface StoryMapOptions {
  center?: LatLngTuple;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  tileUrl: string;
  attribution: string;
  showPath: boolean;
}

export interface StoryMapConfig {
  schema: 'storymap/v1';
  id?: string;
  title?: string;
  height: string;
  map: StoryMapOptions;
  slides: StorySlide[];
}
