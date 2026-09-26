import type { Code, Html, Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { parseStoryMapSourceYaml, toStoryMapConfig } from '@story-map/story-map-core';
import { VaultIndex } from './vault.js';

export const STORY_MAP_FENCE = 'story-map';

export interface RemarkStoryMapOptions {
  vaultRoot?: string;
  assetBase?: string;
  resolveNoteHref?: (vaultRelativePath: string) => string | undefined;
}

export default function remarkStoryMap(options: RemarkStoryMapOptions = {}) {
  const vault = options.vaultRoot
    ? new VaultIndex({
        vaultRoot: options.vaultRoot,
        ...(options.assetBase ? { assetBase: options.assetBase } : {}),
        ...(options.resolveNoteHref ? { resolveNoteHref: options.resolveNoteHref } : {}),
      })
    : undefined;

  return (tree: Root, file?: RemarkVFile) => {
    const sourcePath = typeof file?.path === 'string' ? file.path : undefined;
    const isDocument = file?.data?.frontMatter?.['story-map'] === true;
    const documentAttribute = isDocument ? ' data-story-map-document="true"' : '';

    visit(tree, 'code', (node: Code, index, parent) => {
      if (node.lang !== STORY_MAP_FENCE || index === undefined || !parent) return;

      const parsed = parseStoryMapSourceYaml(node.value);
      const story = vault
        ? vault.resolveSource(parsed, sourcePath)
        : toStoryMapConfig(parsed, parsed.slides ?? []);
      const encoded = encodeURIComponent(JSON.stringify(story));
      const html: Html = {
        type: 'html',
        value: `<div class="story-map-host"${documentAttribute} data-story-map-config="${escapeAttribute(encoded)}"></div>`,
      };

      parent.children[index] = html;
    });
  };
}

interface RemarkVFile {
  path?: string;
  data?: {
    frontMatter?: Record<string, unknown>;
  };
}

function escapeAttribute(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

export { VaultIndex } from './vault.js';
