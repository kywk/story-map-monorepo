import { MarkdownRenderChild, Plugin } from 'obsidian';
import { createRoot, type Root } from 'react-dom/client';
import { parseStoryMapYaml } from '@story-map/story-map-core';
import { StoryMap } from '@story-map/react-story-map';
import { resolveObsidianStory } from './resolver.js';

class StoryMapRenderChild extends MarkdownRenderChild {
  constructor(containerEl: HTMLElement, private readonly root: Root) {
    super(containerEl);
  }

  onunload() {
    this.root.unmount();
  }
}

export default class StoryMapPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor('storymap', async (source, el, ctx) => {
      try {
        const parsed = parseStoryMapYaml(source);
        const story = await resolveObsidianStory(this.app, parsed, ctx.sourcePath);
        const root = createRoot(el);
        root.render(<StoryMap story={story} />);
        ctx.addChild(new StoryMapRenderChild(el, root));
      } catch (error) {
        el.addClass('story-map-host--error');
        el.setText(formatError(error));
      }
    });
  }
}

function formatError(error: unknown) {
  return error instanceof Error ? `StoryMap error: ${error.message}` : 'StoryMap error: unknown error';
}
