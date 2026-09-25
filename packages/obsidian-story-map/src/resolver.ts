import type { App, TFile } from 'obsidian';
import {
  coerceLocation,
  coerceMedia,
  mergeResolvedSlide,
  parseWikiLinkRef,
  type StoryMapConfig,
  type StoryMedia,
  type StorySlide,
} from '@story-map/story-map-core';

export async function resolveObsidianStory(
  app: App,
  story: StoryMapConfig,
  sourcePath: string,
): Promise<StoryMapConfig> {
  const slides = await Promise.all(
    story.slides.map(async (slide) => resolveSlide(app, slide, sourcePath)),
  );
  return { ...story, slides };
}

async function resolveSlide(app: App, slide: StorySlide, sourcePath: string): Promise<StorySlide> {
  let resolved: Partial<StorySlide> = {};
  let noteFile: TFile | null = null;

  if (slide.note) {
    noteFile = resolveWikiFile(app, slide.note, sourcePath);
    if (noteFile) {
      const frontmatter = app.metadataCache.getFileCache(noteFile)?.frontmatter ?? {};
      const location = coerceLocation(frontmatter.location, frontmatter.zoom ?? frontmatter.defaultZoom);
      const media = coerceMedia(frontmatter.cover ?? frontmatter.image ?? frontmatter.media);

      resolved = {
        title: typeof frontmatter.title === 'string' ? frontmatter.title : noteFile.basename,
        ...(typeof frontmatter.description === 'string'
          ? { text: frontmatter.description }
          : typeof frontmatter.summary === 'string'
            ? { text: frontmatter.summary }
            : {}),
        ...(location ? { location } : {}),
        ...(media ? { media } : {}),
        ...(typeof frontmatter.mapmarker === 'string' ? { mapmarker: frontmatter.mapmarker } : {}),
      };
    }
  }

  const merged = mergeResolvedSlide(slide, resolved);
  const mediaSource = slide.media ? sourcePath : (noteFile?.path ?? sourcePath);
  const media = merged.media ? await resolveMedia(app, merged.media, mediaSource) : undefined;
  return { ...merged, ...(media ? { media } : {}) };
}

async function resolveMedia(app: App, media: StoryMedia, sourcePath: string): Promise<StoryMedia> {
  if (/^(https?:|data:|app:|blob:)/i.test(media.src)) return media;

  const clean = parseWikiLinkRef(media.src);
  const file = app.metadataCache.getFirstLinkpathDest(clean, sourcePath);
  if (!file) return media;

  return { ...media, src: app.vault.getResourcePath(file) };
}

function resolveWikiFile(app: App, link: string, sourcePath: string): TFile | null {
  return app.metadataCache.getFirstLinkpathDest(parseWikiLinkRef(link), sourcePath);
}
