import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { CircleMarker, LayerGroup, Map as LeafletMap, Polyline } from 'leaflet';
import type { StoryMapConfig, StorySlide } from '@story-map/story-map-core';

export interface StoryMapProps {
  story: StoryMapConfig;
  initialSlide?: number;
  className?: string;
  onSlideChange?: (index: number, slide: StorySlide) => void;
  onNoteClick?: (notePath: string, event: MouseEvent) => void;
  onNoteHover?: (notePath: string, targetEl: HTMLElement, event: MouseEvent) => void;
  noteLinkClassName?: string;
}

export function StoryMap({
  story,
  initialSlide = 0,
  className,
  onSlideChange,
  onNoteClick,
  onNoteHover,
  noteLinkClassName,
}: StoryMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<CircleMarker[]>([]);
  const pathRef = useRef<Polyline | null>(null);
  const activeIndexRef = useRef(0);
  const [rawActiveIndex, setActiveIndex] = useState(() => clamp(initialSlide, 0, story.slides.length - 1));
  const activeIndex = clamp(rawActiveIndex, 0, story.slides.length - 1);
  const activeSlide = story.slides[activeIndex];
  activeIndexRef.current = activeIndex;

  const locatedSlides = useMemo(
    () => story.slides.filter((slide) => slide.location),
    [story],
  );

  useEffect(() => {
    let cancelled = false;

    async function mountMap() {
      if (!mapElementRef.current) return;
      const L = await import('leaflet');
      if (cancelled || !mapElementRef.current) return;

      const initial = story.slides[activeIndexRef.current]?.location;
      const center = initial
        ? [initial.lat, initial.lng] as [number, number]
        : story.map.center ?? [0, 0];
      const zoom = initial?.zoom ?? story.map.zoom;

      const zoomOptions = {
        ...(story.map.minZoom === undefined ? {} : { minZoom: story.map.minZoom }),
        ...(story.map.maxZoom === undefined ? {} : { maxZoom: story.map.maxZoom }),
      };

      const map = L.map(mapElementRef.current, zoomOptions).setView(center, zoom);

      L.tileLayer(story.map.tileUrl, {
        attribution: story.map.attribution,
        ...zoomOptions,
      }).addTo(map);

      const markerLayer = L.layerGroup().addTo(map);
      const markers = locatedSlides.map((slide) => {
        const location = slide.location!;
        return L.circleMarker([location.lat, location.lng], {
          radius: 6,
          weight: 2,
          fillOpacity: 0.85,
        }).addTo(markerLayer);
      });

      const path = story.map.showPath && locatedSlides.length >= 2
        ? L.polyline(
            locatedSlides.map((slide) => [slide.location!.lat, slide.location!.lng] as [number, number]),
            { weight: 3, opacity: 0.65 },
          ).addTo(map)
        : null;

      mapRef.current = map;
      markerLayerRef.current = markerLayer;
      markersRef.current = markers;
      pathRef.current = path;
      updateMarkerStyles(story, activeIndexRef.current, markers);
    }

    void mountMap();

    return () => {
      cancelled = true;
      pathRef.current = null;
      markersRef.current = [];
      markerLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [story, locatedSlides]);

  useEffect(() => {
    const location = activeSlide?.location;
    if (location && mapRef.current) {
      mapRef.current.flyTo(
        [location.lat, location.lng],
        location.zoom ?? story.map.zoom,
        { duration: 1.1 },
      );
    }
    updateMarkerStyles(story, activeIndex, markersRef.current);
    if (activeSlide) onSlideChange?.(activeIndex, activeSlide);
  }, [activeIndex, activeSlide, onSlideChange, story]);

  useEffect(() => {
    setActiveIndex((current) => clamp(current, 0, story.slides.length - 1));
  }, [story.slides.length]);

  useEffect(() => {
    const element = mapElementRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function goTo(next: number) {
    setActiveIndex(clamp(next, 0, story.slides.length - 1));
  }

  if (!activeSlide) {
    return (
      <section
        className={['story-map', className].filter(Boolean).join(' ')}
        style={{ height: story.height }}
        aria-label={story.title ?? 'Story map'}
      >
        <div className="story-map__empty">This StoryMap has no slides.</div>
      </section>
    );
  }

  return (
    <section
      className={['story-map', className].filter(Boolean).join(' ')}
      style={{ height: story.height }}
      tabIndex={0}
      aria-label={story.title ?? 'Story map'}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
        if (event.key === 'ArrowRight') goTo(activeIndex + 1);
      }}
    >
      <div className="story-map__map" ref={mapElementRef} />
      <article className="story-map__panel">
        {story.title && <div className="story-map__story-title">{story.title}</div>}
        <SlideTitle
          slide={activeSlide}
          onNoteClick={onNoteClick}
          onNoteHover={onNoteHover}
          noteLinkClassName={noteLinkClassName}
        />
        <StoryMediaView slide={activeSlide} />
        {activeSlide.text && (
          <div className="story-map__text">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSlide.text}</ReactMarkdown>
          </div>
        )}
        <nav className="story-map__nav" aria-label="Story navigation">
          <button type="button" disabled={activeIndex === 0} onClick={() => goTo(activeIndex - 1)}>
            Previous
          </button>
          <span>{activeIndex + 1} / {story.slides.length}</span>
          <button
            type="button"
            disabled={activeIndex === story.slides.length - 1}
            onClick={() => goTo(activeIndex + 1)}
          >
            Next
          </button>
        </nav>
      </article>
    </section>
  );
}

function SlideTitle({
  slide,
  onNoteClick,
  onNoteHover,
  noteLinkClassName,
}: {
  slide: StorySlide;
  onNoteClick?: StoryMapProps['onNoteClick'] | undefined;
  onNoteHover?: StoryMapProps['onNoteHover'] | undefined;
  noteLinkClassName?: string | undefined;
}) {
  if (!slide.title) return null;

  const notePath = slide.notePath;
  const interactive =
    notePath !== undefined && (onNoteClick !== undefined || onNoteHover !== undefined);
  if (!interactive) return <h2>{slide.title}</h2>;

  return (
    <h2>
      <a
        className={['story-map__note-link', noteLinkClassName].filter(Boolean).join(' ')}
        href={notePath}
        data-href={notePath}
        onClick={(event) => {
          event.preventDefault();
          onNoteClick?.(notePath, event.nativeEvent);
        }}
        onMouseOver={(event) => {
          onNoteHover?.(notePath, event.currentTarget, event.nativeEvent);
        }}
      >
        {slide.title}
      </a>
    </h2>
  );
}

function StoryMediaView({ slide }: { slide: StorySlide }) {
  const media = slide.media;
  if (!media) return null;

  if (media.type === 'video') {
    return <video className="story-map__media" src={media.src} controls />;
  }

  if (media.type === 'iframe') {
    return (
      <iframe
        className="story-map__media story-map__iframe"
        src={media.src}
        title={media.alt ?? slide.title ?? 'Story media'}
        loading="lazy"
      />
    );
  }

  return (
    <figure className="story-map__figure">
      <img className="story-map__media" src={media.src} alt={media.alt ?? ''} loading="lazy" />
      {media.caption && <figcaption>{media.caption}</figcaption>}
    </figure>
  );
}

function updateMarkerStyles(story: StoryMapConfig, activeIndex: number, markers: CircleMarker[]) {
  let markerIndex = 0;
  story.slides.forEach((slide, slideIndex) => {
    if (!slide.location) return;
    const marker = markers[markerIndex++];
    if (!marker) return;
    marker.setRadius(slideIndex === activeIndex ? 8 : 5);
    marker.setStyle({
      weight: slideIndex === activeIndex ? 3 : 2,
      fillOpacity: slideIndex === activeIndex ? 1 : 0.7,
    });
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
