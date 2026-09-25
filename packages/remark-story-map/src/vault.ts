import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
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

export interface VaultResolveOptions {
  vaultRoot: string;
  assetBase?: string;
}

interface IndexedNote {
  absolutePath: string;
  relativePath: string;
  frontmatter: Record<string, unknown>;
}

export class VaultIndex {
  private readonly byBasename = new Map<string, string[]>();
  private readonly byRelativePath = new Map<string, string>();
  private readonly notes: IndexedNote[] = [];

  constructor(private readonly options: VaultResolveOptions) {
    this.scan(options.vaultRoot);
  }

  resolveSource(source: StoryMapSourceConfig): StoryMapConfig {
    const explicitSlides = source.slides ?? [];
    const slides = explicitSlides.length > 0
      ? this.resolveExplicitSlides(explicitSlides)
      : source.noteFolder
        ? this.resolveFolder(source.noteFolder, source.dateField, source.order)
        : [];

    return toStoryMapConfig(source, slides);
  }

  resolveStory(story: StoryMapConfig): StoryMapConfig {
    return { ...story, slides: this.resolveExplicitSlides(story.slides) };
  }

  private resolveExplicitSlides(slides: StorySlide[]): StorySlide[] {
    return slides.map((slide) => this.resolveSlide(slide));
  }

  private resolveFolder(
    noteFolder: string,
    dateField: string,
    order: StoryMapSourceConfig['order'],
  ): StorySlide[] {
    const entries = this.notes
      .filter((note) => isPathInFolder(note.relativePath, noteFolder))
      .map((note) => ({
        path: note.relativePath,
        date: toTimestamp(note.frontmatter[dateField]),
        note,
      }))
      .filter((entry) => entry.note.frontmatter['story-map-note'] === true);

    return sortNoteDates(entries, order).map((entry) => this.slideForNote(entry.note));
  }

  private slideForNote(note: IndexedNote): StorySlide {
    const slide: StorySlide = {
      ...slideFromNoteFrontmatter(note.frontmatter, path.basename(note.relativePath)),
    };
    const media = slide.media ? this.resolveMedia(slide.media, note.absolutePath) : undefined;
    return media ? { ...slide, media } : slide;
  }

  private resolveSlide(slide: StorySlide): StorySlide {
    let resolved: Partial<StorySlide> = {};
    let note: IndexedNote | undefined;

    if (slide.note) {
      note = this.findIndexed(parseWikiLinkRef(slide.note));
      if (note) {
        resolved = slideFromNoteFrontmatter(note.frontmatter, path.basename(note.relativePath));
      }
    }

    const merged = mergeResolvedSlide(slide, resolved);
    const media = merged.media
      ? this.resolveMedia(merged.media, slide.media ? undefined : note?.absolutePath)
      : undefined;
    return { ...merged, ...(media ? { media } : {}) };
  }

  private resolveMedia(media: StoryMedia, notePath?: string): StoryMedia {
    if (/^(https?:|data:|blob:)/i.test(media.src) || !this.options.assetBase) return media;

    let source = parseWikiLinkRef(media.src);
    if (source.startsWith('./') && notePath) {
      source = path.relative(this.options.vaultRoot, path.resolve(path.dirname(notePath), source));
    }

    const url = `${this.options.assetBase.replace(/\/$/, '')}/${source.replace(/^\/+/, '').replaceAll('\\', '/')}`;
    return { ...media, src: url };
  }

  private findIndexed(ref: string): IndexedNote | undefined {
    const normalized = ref.replace(/\\/g, '/').replace(/\.md$/i, '');
    const exact = this.byRelativePath.get(normalized.toLowerCase());
    if (exact) return this.notes.find((note) => note.absolutePath === exact);

    const basename = path.posix.basename(normalized).toLowerCase();
    const matches = this.byBasename.get(basename) ?? [];
    if (matches.length > 1) {
      throw new Error(`Ambiguous WikiLink '${ref}'. Use a Vault-relative path.`);
    }
    const match = matches[0];
    return match ? this.notes.find((note) => note.absolutePath === match) : undefined;
  }

  private scan(directory: string): void {
    if (!existsSync(directory)) return;

    for (const entry of readdirSync(directory)) {
      if (entry.startsWith('.')) continue;
      const full = path.join(directory, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        this.scan(full);
        continue;
      }
      if (!entry.toLowerCase().endsWith('.md')) continue;

      const relative = path
        .relative(this.options.vaultRoot, full)
        .replace(/\\/g, '/')
        .replace(/\.md$/i, '');
      const basename = path.basename(relative).toLowerCase();
      const current = this.byBasename.get(basename) ?? [];
      current.push(full);
      this.byBasename.set(basename, current);
      this.byRelativePath.set(relative.toLowerCase(), full);

      const frontmatter = (matter(readFileSync(full, 'utf8')).data ?? {}) as Record<string, unknown>;
      this.notes.push({ absolutePath: full, relativePath: relative, frontmatter });
    }
  }
}
