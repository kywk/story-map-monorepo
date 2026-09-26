import { PluginSettingTab, Setting, type App, type TextComponent } from 'obsidian';
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

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Geo Story Map defaults')
      .setDesc(
        "Defaults applied when a document's story-map block omits a key. Document values always win, then these settings, then built-in defaults. Per-story values (title, noteFolder, map center) are set in each document instead.",
      )
      .setHeading();

    new Setting(containerEl)
      .setName('Default order')
      .setDesc('Folder ordering direction. Built-in default: ascending.')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(Object.fromEntries(ORDER_OPTIONS))
          .setValue(this.plugin.settings.order ?? 'asc')
          .onChange((value) => this.patch({ order: toOrder(value) })),
      );

    new Setting(containerEl)
      .setName('Default date field')
      .setDesc('Frontmatter field used for folder ordering. Built-in default: date-created.')
      .addText((text) =>
        text
          .setPlaceholder('date-created')
          .setValue(this.plugin.settings.dateField ?? '')
          .onChange((value) => this.patch({ dateField: trimOrUndefined(value) })),
      );

    new Setting(containerEl)
      .setName('Default note display')
      .setDesc('How resolved notes are presented. Built-in default: link.')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(Object.fromEntries(NOTE_DISPLAY_OPTIONS))
          .setValue(this.plugin.settings.noteDisplay ?? 'link')
          .onChange((value) => this.patch({ noteDisplay: toNoteDisplay(value) })),
      );

    new Setting(containerEl).setName('Map').setHeading();

    new Setting(containerEl)
      .setName('Default zoom')
      .addText((text) => this.number(text, this.plugin.settings.mapZoom, (value) => this.patch({ mapZoom: value })));

    new Setting(containerEl)
      .setName('Default minimum zoom')
      .addText((text) => this.number(text, this.plugin.settings.mapMinZoom, (value) => this.patch({ mapMinZoom: value })));

    new Setting(containerEl)
      .setName('Default maximum zoom')
      .addText((text) => this.number(text, this.plugin.settings.mapMaxZoom, (value) => this.patch({ mapMaxZoom: value })));

    new Setting(containerEl)
      .setName('Default tile URL')
      .setDesc('Built-in default: OpenStreetMap standard tiles.')
      .addText((text) =>
        text
          .setPlaceholder('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
          .setValue(this.plugin.settings.mapTileUrl ?? '')
          .onChange((value) => this.patch({ mapTileUrl: trimOrUndefined(value) })),
      );

    new Setting(containerEl)
      .setName('Default attribution')
      .addText((text) =>
        text
          .setPlaceholder('© OpenStreetMap contributors')
          .setValue(this.plugin.settings.mapAttribution ?? '')
          .onChange((value) => this.patch({ mapAttribution: trimOrUndefined(value) })),
      );

    new Setting(containerEl)
      .setName('Default show path')
      .setDesc('Connect located slides with a polyline when a block does not set showPath.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.mapShowPath ?? true)
          .onChange((value) => this.patch({ mapShowPath: value })),
      );

    new Setting(containerEl).addButton((button) =>
      button
        .setButtonText('Restore defaults')
        .setWarning()
        .onClick(() => {
          this.plugin.settings = { ...DEFAULT_STORY_MAP_SETTINGS };
          void this.plugin.saveSettings();
          this.display();
        }),
    );
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
