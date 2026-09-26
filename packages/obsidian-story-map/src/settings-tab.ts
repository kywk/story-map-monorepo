import {
  PluginSettingTab, Setting, type App, type TextComponent,
  type SettingDefinitionItem, type SettingDefinitionRender,
} from 'obsidian';
import type { StoryNoteDisplay, StoryOrder } from '@story-map/story-map-core';
import type StoryMapPlugin from './main.js';
import {
  DEFAULT_STORY_MAP_SETTINGS,
  type StoryMapPluginSettings,
} from './settings-data.js';

const ORDER_OPTIONS: Array<[value: string, label: string]> = [
  ['asc', 'Ascending (default)'],
  ['desc', 'Descending'],
];

const NOTE_DISPLAY_OPTIONS: Array<[value: string, label: string]> = [
  ['basic', 'Basic information only'],
  ['link', 'Title link with page preview (default)'],
  ['full', 'Full note body'],
];

export class StoryMapSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: StoryMapPlugin) {
    super(app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return this.settingRows();
  }

  // Obsidian 1.8–1.12 render imperatively; 1.13+ indexes and renders definitions.
  display(): void {
    this.renderFallback();
  }

  private renderFallback(): void {
    this.containerEl.empty();
    for (const row of this.settingRows()) {
      row.render(new Setting(this.containerEl).setName(row.name));
    }
  }

  private refreshSettings(): void {
    // The definitions and their search labels are static. Only control values change;
    // redraw the same rows using APIs available on every supported host.
    this.renderFallback();
  }

  private settingRows(): Array<Omit<SettingDefinitionRender, 'render'> & { render: (setting: Setting) => void }> {
    return [
      { name: 'Defaults', render: (setting) => {
        setting
          .setDesc(
            "Defaults applied when a document's story-map block omits a key. Document values always win, then these settings, then built-in defaults. Per-story values (title, noteFolder, map center) are set in each document instead.",
          )
          .setHeading();
      } },
      { name: 'Default order', render: (setting) => {
        setting
          .setDesc('Folder ordering direction. Built-in default: ascending.')
          .addDropdown((dropdown) =>
            dropdown
              .addOptions(Object.fromEntries(ORDER_OPTIONS))
              .setValue(this.plugin.settings.order ?? 'asc')
              .onChange((value) => this.patch({ order: toOrder(value) })),
          );
      } },
      { name: 'Default date field', render: (setting) => {
        setting
          .setDesc('Frontmatter field used for folder ordering. Built-in default: date-created.')
          .addText((text) =>
            text
              .setPlaceholder('date-created')
              .setValue(this.plugin.settings.dateField ?? '')
              .onChange((value) => this.patch({ dateField: trimOrUndefined(value) })),
          );
      } },
      { name: 'Default note display', render: (setting) => {
        setting
          .setDesc('How resolved notes are presented. Built-in default: link.')
          .addDropdown((dropdown) =>
            dropdown
              .addOptions(Object.fromEntries(NOTE_DISPLAY_OPTIONS))
              .setValue(this.plugin.settings.noteDisplay ?? 'link')
              .onChange((value) => this.patch({ noteDisplay: toNoteDisplay(value) })),
          );
      } },
      { name: 'Map', render: (setting) => {
        setting.setHeading();
      } },
      { name: 'Default zoom', render: (setting) => {
        setting
          .addText((text) => this.number(text, this.plugin.settings.mapZoom, (value) => this.patch({ mapZoom: value })));
      } },
      { name: 'Default minimum zoom', render: (setting) => {
        setting
          .addText((text) => this.number(text, this.plugin.settings.mapMinZoom, (value) => this.patch({ mapMinZoom: value })));
      } },
      { name: 'Default maximum zoom', render: (setting) => {
        setting
          .addText((text) => this.number(text, this.plugin.settings.mapMaxZoom, (value) => this.patch({ mapMaxZoom: value })));
      } },
      { name: 'Default tile URL', render: (setting) => {
        setting
          .setDesc('Built-in default: OpenStreetMap standard tiles.')
          .addText((text) =>
            text
              .setPlaceholder('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
              .setValue(this.plugin.settings.mapTileUrl ?? '')
              .onChange((value) => this.patch({ mapTileUrl: trimOrUndefined(value) })),
          );
      } },
      { name: 'Default attribution', render: (setting) => {
        setting
          .addText((text) =>
            text
              .setPlaceholder('© OpenStreetMap contributors')
              .setValue(this.plugin.settings.mapAttribution ?? '')
              .onChange((value) => this.patch({ mapAttribution: trimOrUndefined(value) })),
          );
      } },
      { name: 'Default show path', render: (setting) => {
        setting
          .setDesc('Connect located slides with a polyline when a block does not set showPath.')
          .addToggle((toggle) =>
            toggle
              .setValue(this.plugin.settings.mapShowPath ?? true)
              .onChange((value) => this.patch({ mapShowPath: value })),
          );
      } },
      { name: 'Restore defaults', render: (setting) => {
        setting.addButton((button) =>
          button
            .setButtonText('Restore defaults')
            .onClick(() => {
              this.plugin.settings = { ...DEFAULT_STORY_MAP_SETTINGS };
              void this.plugin.saveSettings();
              this.refreshSettings();
            }),
        );
      } },
    ];
  }

  private number(
    text: TextComponent,
    value: number | undefined,
    update: (value: number | undefined) => void,
  ): void {
    text.inputEl.type = 'number';
    text.setValue(value === undefined ? '' : String(value));
    text.onChange((raw) => update(parseNumber(raw)));
  }

  private patch(patch: Partial<StoryMapPluginSettings>): void {
    this.plugin.settings = { ...this.plugin.settings, ...patch };
    void this.plugin.saveSettings();
  }
}

function trimOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOrder(value: string): StoryOrder | undefined {
  return value === 'asc' || value === 'desc' ? value : undefined;
}

function toNoteDisplay(value: string): StoryNoteDisplay | undefined {
  return value === 'basic' || value === 'link' || value === 'full' ? value : undefined;
}
