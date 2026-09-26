import type { App, TFile } from 'obsidian';

export function isStoryMapFile(app: App, file: TFile | null | undefined): file is TFile {
  if (!file) return false;
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  return frontmatter?.['story-map'] === true;
}
