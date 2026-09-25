import { Plugin, TFile, type WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_STORY_MAP } from './constants.js';
import { isStoryMapFile } from './detect.js';
import { StoryMapView } from './view.js';

export default class StoryMapPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_STORY_MAP, (leaf) => new StoryMapView(leaf));

    this.addCommand({
      id: 'open-as-story-map',
      name: 'Open as Story Map',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!isStoryMapFile(this.app, file)) return false;
        if (!checking) void this.openAsStoryMap(file);
        return true;
      },
    });

    this.addCommand({
      id: 'open-as-markdown',
      name: 'Open as Markdown',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(StoryMapView);
        if (!view?.file) return false;
        if (!checking) void this.openAsMarkdown(view.file, view.leaf);
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file, _source, leaf) => {
        if (!(file instanceof TFile) || !isStoryMapFile(this.app, file)) return;
        menu.addItem((item) =>
          item
            .setTitle('Open as Story Map')
            .setIcon('map')
            .onClick(() => {
              void this.openAsStoryMap(file, leaf);
            }),
        );
      }),
    );
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_STORY_MAP);
  }

  private async openAsStoryMap(file: TFile, leaf?: WorkspaceLeaf): Promise<void> {
    const target = leaf ?? this.app.workspace.getLeaf(false);
    await target.setViewState({
      type: VIEW_TYPE_STORY_MAP,
      state: { file: file.path },
      active: true,
    });
    await this.app.workspace.revealLeaf(target);
  }

  private async openAsMarkdown(file: TFile, leaf: WorkspaceLeaf): Promise<void> {
    await leaf.setViewState({
      type: 'markdown',
      state: { file: file.path },
      active: true,
    });
  }
}
