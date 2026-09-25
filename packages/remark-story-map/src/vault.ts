import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  coerceLocation,
  coerceMedia,
  mergeResolvedSlide,
  parseWikiLinkRef,
  type StoryMapConfig,
  type StoryMedia,
  type StorySlide,
} from '@story-map/story-map-core';

export interface VaultResolveOptions {
  vaultRoot: string;
  assetBase?: string;
}

export class VaultIndex {
  private readonly byBasename = new Map<string, string[]>();
  private readonly byRelativePath = new Map<string, string>();

  constructor(private readonly options: VaultResolveOptions) {
    this.scan(options.vaultRoot);
  }

  resolveStory(story: StoryMapConfig): StoryMapConfig {
    return {
      ...story,
      slides: story.slides.map((slide) => this.resolveSlide(slide)),
    };
  }

  private resolveSlide(slide: StorySlide): StorySlide {
    let resolved: Partial<StorySlide> = {};
    let notePath: string | undefined;

    if (slide.note) {
      notePath = this.findNote(parseWikiLinkRef(slide.note));
      if (notePath) {
        const parsed = matter(readFileSync(notePath, 'utf8'));
        const fm = parsed.data as Record<string, unknown>;
        const location = coerceLocation(fm.location, fm.zoom ?? fm.defaultZoom);
        const media = coerceMedia(fm.cover ?? fm.image ?? fm.media);

        resolved = {
          title: typeof fm.title === 'string' ? fm.title : path.basename(notePath, '.md'),
          ...(typeof fm.description === 'string'
            ? { text: fm.description }
            : typeof fm.summary === 'string'
              ? { text: fm.summary }
              : {}),
          ...(location ? { location } : {}),
          ...(media ? { media } : {}),
          ...(typeof fm.mapmarker === 'string' ? { mapmarker: fm.mapmarker } : {}),
        };
      }
    }

    const merged = mergeResolvedSlide(slide, resolved);
    const media = merged.media
      ? this.resolveMedia(merged.media, slide.media ? undefined : notePath)
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

  private findNote(ref: string): string | undefined {
    const normalized = ref.replace(/\\/g, '/').replace(/\.md$/i, '');
    const exact = this.byRelativePath.get(normalized.toLowerCase());
    if (exact) return exact;

    const basename = path.posix.basename(normalized).toLowerCase();
    const matches = this.byBasename.get(basename) ?? [];
    if (matches.length > 1) {
      throw new Error(`Ambiguous WikiLink '${ref}'. Use a Vault-relative path.`);
    }
    return matches[0];
  }

  private scan(directory: string) {
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

      const relative = path.relative(this.options.vaultRoot, full).replace(/\\/g, '/').replace(/\.md$/i, '');
      const basename = path.basename(relative).toLowerCase();
      const current = this.byBasename.get(basename) ?? [];
      current.push(full);
      this.byBasename.set(basename, current);
      this.byRelativePath.set(relative.toLowerCase(), full);
    }
  }
}
