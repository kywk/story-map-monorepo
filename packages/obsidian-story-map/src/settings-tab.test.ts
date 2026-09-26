import { describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => {
  class PluginSettingTab {
    containerEl = { empty: vi.fn(() => { this.containerEl.rows = []; }), rows: [] as Setting[] };
  }
  class Control {
    inputEl = { type: '' };
    value: unknown;
    change?: (value: never) => void;
    click?: () => void;
    setValue(value: unknown) { this.value = value; return this; }
    setPlaceholder() { return this; }
    addOptions() { return this; }
    setButtonText() { return this; }
    onChange(callback: (value: never) => void) { this.change = callback; return this; }
    onClick(callback: () => void) { this.click = callback; return this; }
  }
  class Setting {
    name = '';
    control?: Control;
    constructor(container: { rows: Setting[] }) { container.rows.push(this); }
    setName(name: string) { this.name = name; return this; }
    setDesc() { return this; }
    setHeading() { return this; }
    addDropdown = this.addControl;
    addText = this.addControl;
    addToggle = this.addControl;
    addButton = this.addControl;
    addControl(callback: (control: Control) => void) {
      this.control = new Control(); callback(this.control); return this;
    }
  }
  return { PluginSettingTab, Setting };
});

import type { App } from 'obsidian';
import type StoryMapPlugin from './main.js';
import { StoryMapSettingTab } from './settings-tab.js';

type Row = { name: string; control?: { value: unknown; change?: (value: string) => void; click?: () => void } };
function setup() {
  const plugin = { settings: { dateField: 'created' }, saveSettings: vi.fn(async () => {}) };
  const tab = new StoryMapSettingTab({} as App, plugin as unknown as StoryMapPlugin);
  const container = tab.containerEl as unknown as { empty: ReturnType<typeof vi.fn>; rows: Row[] };
  return { tab, plugin, container };
}

describe('settings definitions and legacy rendering', () => {
  it('exposes all defaultable settings to modern settings search without DOM work', () => {
    const { tab, container } = setup();
    const definitions = tab.getSettingDefinitions();
    expect(definitions.map((definition) => 'name' in definition ? definition.name : '')).toEqual([
      'Defaults', 'Default order', 'Default date field', 'Default note display', 'Map',
      'Default zoom', 'Default minimum zoom', 'Default maximum zoom', 'Default tile URL',
      'Default attribution', 'Default show path', 'Restore defaults',
    ]);
    expect(container.empty).not.toHaveBeenCalled();
  });

  it('renders and persists settings on hosts without the modern update API', () => {
    const { tab, plugin, container } = setup();
    tab.display();
    const field = container.rows.find((row) => row.name === 'Default date field');
    expect(field?.control?.value).toBe('created');
    field?.control?.change?.(' modified ');
    expect(plugin.settings.dateField).toBe('modified');
    expect(plugin.saveSettings).toHaveBeenCalledOnce();
    container.rows.find((row) => row.name === 'Restore defaults')?.control?.click?.();
    expect(container.empty).toHaveBeenCalledTimes(2);
    expect(container.rows.find((row) => row.name === 'Default date field')?.control?.value).toBe('');
  });

  it('redraws reset values without invoking newer host APIs', () => {
    const { tab, container } = setup();
    const update = vi.fn();
    Object.assign(tab, { update });
    const definitions = tab.getSettingDefinitions().map((row) => 'name' in row ? row.name : '');
    tab.display();
    container.rows.find((row) => row.name === 'Restore defaults')?.control?.click?.();
    expect(update).not.toHaveBeenCalled();
    expect(container.empty).toHaveBeenCalledTimes(2);
    expect(tab.getSettingDefinitions().map((row) => 'name' in row ? row.name : '')).toEqual(definitions);
    expect(container.rows.find((row) => row.name === 'Default date field')?.control?.value).toBe('');
  });
});
