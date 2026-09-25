import type { Code, Html, Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { parseStoryMapYaml } from '@story-map/story-map-core';
import { VaultIndex } from './vault.js';

export interface RemarkStoryMapOptions {
  vaultRoot?: string;
  assetBase?: string;
}

export default function remarkStoryMap(options: RemarkStoryMapOptions = {}) {
  const vault = options.vaultRoot
    ? new VaultIndex({
        vaultRoot: options.vaultRoot,
        ...(options.assetBase ? { assetBase: options.assetBase } : {}),
      })
    : undefined;

  return (tree: Root) => {
    visit(tree, 'code', (node: Code, index, parent) => {
      if (node.lang !== 'storymap' || index === undefined || !parent) return;

      const parsed = parseStoryMapYaml(node.value);
      const story = vault ? vault.resolveStory(parsed) : parsed;
      const encoded = encodeURIComponent(JSON.stringify(story));
      const html: Html = {
        type: 'html',
        value: `<div class="story-map-host" data-story-map-config="${escapeAttribute(encoded)}"></div>`,
      };

      parent.children[index] = html;
    });
  };
}

function escapeAttribute(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

export { VaultIndex } from './vault.js';
