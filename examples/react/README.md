# React StoryMap Example

Standalone React example that renders a `StoryMap` from the shared parser, using the
2025 Abbott World Marathon Majors in chronological order.

## Run

From the repository root:

```bash
pnpm install
pnpm --filter @story-map/example-react dev
```

Then open http://127.0.0.1:5173.

## Notes

- The story source lives in `src/story.ts` as a `storymap/v1` YAML document and is parsed
  with `parseStoryMapYaml` from `@story-map/story-map-core`.
- Leaflet CSS and the renderer CSS are imported explicitly here; the library itself does
  not import Leaflet at module scope so it stays SSR-safe.
- Slide photos are from Wikimedia Commons with attribution in each caption
  (CC BY / CC BY-SA, via Wikimedia Commons).
