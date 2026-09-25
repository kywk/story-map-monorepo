import type { App, TFile } from 'obsidian';
import {
  isPathInFolder,
  mergeResolvedSlide,
  parseWikiLinkRef,
  slideFromNoteFrontmatter,
  sortNoteDates,
  toStoryMapConfig,
  toTimestamp,
  type StoryMapConfig,
  type StoryMapSourceConfig,
  type StoryMedia,
  type StorySlide,
} from '@story-map/story-map-core';

export async function resolveObsidianStory(
  app: App,
  source: StoryMapSourceConfig,
  sourcePath: string,
): Promise<StoryMapConfig> {
  const explicitSlides = source.slides ?? [];
  const slides = explicitSlides.length > 0
    ? await resolveExplicitSlides(app, explicitSlides, sourcePath)
    : source.noteFolder
      ? await resolveFolderSlides(app, source.noteFolder, source.dateField, source.order)
      : [];

  return toStoryMapConfig(source, slides);
}

async function resolveExplicitSlides(
  app: App,
  slides: StorySlide[],
  sourcePath: string,
): Promise<StorySlide[]> {
  return Promise.all(slides.map((slide) => resolveSlide(app, slide, sourcePath)));
}

async function resolveFolderSlides(
  app: App,
  noteFolder: string,
  dateField: string,
  order: StoryMapSourceConfig['order'],
): Promise<StorySlide[]> {
  const entries = app.vault
    .getMarkdownFiles()
    .filter((file) => isPathInFolder(file.path, noteFolder))
    .map((file) => {
      const frontmatter = readFrontmatter(app, file);
      return {
        path: file.path,
        date: toTimestamp(frontmatter[dateField]),
        file,
        frontmatter,
      };
    })
    .filter((entry) => entry.frontmatter['story-map-note'] === true);

  return Promise.all(
    sortNoteDates(entries, order).map((entry) => resolveDiscoveredNote(app, entry.file, entry.frontmatter)),
  );
}

async function resolveDiscoveredNote(
  app: App,
  file: TFile,
  frontmatter: Record<string, unknown>,
): Promise<StorySlide> {
  const slide: StorySlide = { ...slideFromNoteFrontmatter(frontmatter, file.basename) };
  const media = slide.media ? await resolveMedia(app, slide.media, file.path) : undefined;
  return media ? { ...slide, media } : slide;
}

async function resolveSlide(app: App, slide: StorySlide, sourcePath: string): Promise<StorySlide> {
  let resolved: Partial<StorySlide> = {};
  let noteFile: TFile | null = null;

  if (slide.note) {
    noteFile = resolveWikiFile(app, slide.note, sourcePath);
    if (noteFile) {
      resolved = slideFromNoteFrontmatter(readFrontmatter(app, noteFile), noteFile.basename);
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

function readFrontmatter(app: App, file: TFile): Record<string, unknown> {
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  return (frontmatter ?? {}) as Record<string, unknown>;
}
