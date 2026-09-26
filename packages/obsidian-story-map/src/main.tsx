import { Plugin, TFile, WorkspaceLeaf, type Menu, type MenuItem, type ViewState } from 'obsidian';
import type { StoryMapSourceDefaults } from '@story-map/story-map-core';
import { HOVER_LINK_DISPLAY, HOVER_LINK_SOURCE, VIEW_TYPE_STORY_MAP } from './constants.js';
import { isStoryMapFile } from './detect.js';
import {
  DEFAULT_STORY_MAP_SETTINGS,
  toSourceDefaults,
  type StoryMapPluginSettings,
} from './settings-data.js';
import { StoryMapSettingTab } from './settings-tab.js';
import { StoryMapView, type StoryMapViewHost } from './view.js';

const TOP_SECTION = 'story-map-toggle';
const STORY_MAP_VIEW_SOURCES = ['pane-more-options', 'tab-header'];

interface MenuInternals {
  sections?: string[];
  sort?: () => void;
}

function addMenuItemAtTop(menu: Menu, configure: (item: MenuItem) => void): void {
  const internals = menu as unknown as MenuInternals;
  const canReorder = Array.isArray(internals.sections);

  menu.addItem((item) => {
    configure(item);
    if (canReorder) item.setSection(TOP_SECTION);
  });

  if (!canReorder) return;
  const sections = internals.sections!;
  const index = sections.indexOf(TOP_SECTION);
  if (index > 0) sections.splice(index, 1);
  if (sections[0] !== TOP_SECTION) sections.unshift(TOP_SECTION);
  internals.sort?.();
}

export default class StoryMapPlugin extends Plugin implements StoryMapViewHost {
  private readonly markdownMode = new Set<string>();
  private loaded = false;
  private persistTimer: number | null = null;
  settings: StoryMapPluginSettings = { ...DEFAULT_STORY_MAP_SETTINGS };

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_STORY_MAP, (leaf) => new StoryMapView(leaf, this));
    this.registerHoverLinkSource(HOVER_LINK_SOURCE, {
      display: HOVER_LINK_DISPLAY,
      defaultMod: false,
    });
    this.addSettingTab(new StoryMapSettingTab(this.app, this));
    this.patchLeafViewState();
    this.loaded = true;

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
        if (!checking) this.openAsMarkdown(view.file, view.leaf);
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file, source, leaf) => {
        if (source === 'link-context-menu') return;
        if (!(file instanceof TFile) || !isStoryMapFile(this.app, file)) return;

        const activeStoryMap = this.app.workspace.getActiveViewOfType(StoryMapView);
        const showingAsStoryMap =
          leaf?.view.getViewType() === VIEW_TYPE_STORY_MAP ||
          activeStoryMap?.file?.path === file.path;

        if (showingAsStoryMap) {
          if (!STORY_MAP_VIEW_SOURCES.includes(source)) return;
          addMenuItemAtTop(menu, (item) =>
            item
              .setTitle('Open as Markdown')
              .setIcon('file-text')
              .onClick(() => {
                if (leaf) this.openAsMarkdown(file, leaf);
              }),
          );
          return;
        }

        addMenuItemAtTop(menu, (item) =>
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
    this.loaded = false;
    if (this.persistTimer !== null) {
      window.clearTimeout(this.persistTimer);
      this.persistTimer = null;
      void this.saveData(this.settings);
    }
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_STORY_MAP);
  }

  openAsMarkdown(file: TFile, leaf: WorkspaceLeaf): void {
    this.markdownMode.add(file.path);
    void leaf.setViewState({
      type: 'markdown',
      state: { file: file.path },
      active: true,
    });
  }

  getSourceDefaults(): StoryMapSourceDefaults {
    return toSourceDefaults(this.settings);
  }

  async loadSettings(): Promise<void> {
    const stored = (await this.loadData()) as StoryMapPluginSettings | null;
    this.settings = { ...DEFAULT_STORY_MAP_SETTINGS, ...(stored ?? {}) };
  }

  async saveSettings(): Promise<void> {
    if (this.persistTimer !== null) window.clearTimeout(this.persistTimer);
    this.persistTimer = window.setTimeout(() => {
      this.persistTimer = null;
      void this.persistSettings();
    }, 300);
  }

  private async persistSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshStoryMapViews();
  }

  private refreshStoryMapViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_STORY_MAP)) {
      const view = leaf.view;
      if (view instanceof StoryMapView) view.refresh();
    }
  }

  private async openAsStoryMap(file: TFile, leaf?: WorkspaceLeaf): Promise<void> {
    this.markdownMode.delete(file.path);
    const target = leaf ?? this.app.workspace.getLeaf(false);
    await target.setViewState({
      type: VIEW_TYPE_STORY_MAP,
      state: { file: file.path },
      active: true,
    });
    await this.app.workspace.revealLeaf(target);
  }

  private patchLeafViewState(): void {
    const original = WorkspaceLeaf.prototype.setViewState;
    const plugin = this;

    WorkspaceLeaf.prototype.setViewState = function (
      state: ViewState,
      eState?: unknown,
    ): Promise<void> {
      if (plugin.loaded && state.type === 'markdown' && state.state?.file) {
        const path = state.state.file as string;
        if (!plugin.markdownMode.has(path)) {
          const file = plugin.app.vault.getAbstractFileByPath(path);
          if (file instanceof TFile && isStoryMapFile(plugin.app, file)) {
            return original.apply(this, [{ ...state, type: VIEW_TYPE_STORY_MAP }, eState]);
          }
        }
      }
      return original.apply(this, [state, eState]);
    };

    this.register(() => {
      WorkspaceLeaf.prototype.setViewState = original;
    });
  }
}
