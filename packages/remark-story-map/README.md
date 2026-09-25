# Remark Story Map

Transforms fenced `storymap` blocks to browser placeholders and provides a client entry that mounts `@story-map/react-story-map`.

## Docusaurus setup

Add the Remark transformer to the docs/blog options:

```js
import remarkStoryMap from '@story-map/remark-story-map';

// inside docs/blog options
remarkPlugins: [
  [remarkStoryMap, {
    vaultRoot: '/absolute/path/to/vault',
    assetBase: '/vault-assets',
  }],
]
```

Docusaurus client modules are registered by a Docusaurus plugin. A minimal local plugin can be:

```js
// plugins/story-map-client/index.js
module.exports = function storyMapClientPlugin() {
  return {
    name: 'story-map-client',
    getClientModules() {
      return [require.resolve('@story-map/remark-story-map/client')];
    },
  };
};
```

Then add `./plugins/story-map-client` to the site's `plugins` list. The client entry only initializes maps in the browser.

`assetBase` only rewrites asset URLs. Copying Vault attachments into the Docusaurus static directory remains part of the site's existing publishing pipeline for MVP.
