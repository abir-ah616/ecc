import { describe, it, expect } from 'vitest';
import { GRAPHIC_THEMES, resolveThemePreset } from '../theme';

describe('Graphic Theme Presets', () => {
  it('contains all 10 active themes including Inferno Blaze, Obsidian Noir, and Royal Amethyst', () => {
    const ids = GRAPHIC_THEMES.map((t) => t.id);
    expect(ids).toEqual([
      'v2',
      'scarlet',
      'volt',
      'whiteout',
      'blue',
      'gold',
      'eclipse',
      'inferno',
      'obsidian',
      'amethyst',
    ]);
    expect(ids).not.toContain('crimson');
    expect(ids).not.toContain('emerald');
    expect(ids).not.toContain('violet');
    expect(ids).not.toContain('cobalt');
  });

  it('migrates removed legacy preset ids cleanly to new presets', () => {
    expect(resolveThemePreset('crimson')).toBe('scarlet');
    expect(resolveThemePreset('emerald')).toBe('volt');
    expect(resolveThemePreset('cobalt')).toBe('volt');
    expect(resolveThemePreset('violet')).toBe('whiteout');
    expect(resolveThemePreset(undefined)).toBe('v2');
    expect(resolveThemePreset('unknown-theme')).toBe('v2');
    expect(resolveThemePreset('whiteout')).toBe('whiteout');
  });
});
