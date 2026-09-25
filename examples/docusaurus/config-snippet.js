import remarkStoryMap from '@story-map/remark-story-map';

// Merge these pieces into your existing docusaurus.config.js/mjs.
export const storyMapDocsOptions = {
  remarkPlugins: [
    [remarkStoryMap, { vaultRoot: '/path/to/vault', assetBase: '/vault-assets' }],
  ],
};

export const storyMapPlugins = [
  './plugins/story-map-client',
];
