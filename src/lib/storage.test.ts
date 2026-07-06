import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { clearOverrides, loadOverrides, saveOverrides } from './storage';
import type { ThemeState } from './tokens';

const theme: ThemeState = {
  light: { '--background': 'oklch(1 0 0)' },
  dark: { '--background': 'oklch(0.145 0 0)' },
};

describe('storage', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('round-trips a saved theme for a given origin', async () => {
    await saveOverrides('https://example.com', theme);
    expect(await loadOverrides('https://example.com')).toEqual(theme);
  });

  it('returns null for an unknown origin', async () => {
    expect(await loadOverrides('https://unknown.example')).toBeNull();
  });

  it('isolates overrides between two origins', async () => {
    const otherTheme: ThemeState = {
      light: { '--background': 'oklch(0.9 0 0)' },
      dark: {},
    };
    await saveOverrides('https://a.example', theme);
    await saveOverrides('https://b.example', otherTheme);

    expect(await loadOverrides('https://a.example')).toEqual(theme);
    expect(await loadOverrides('https://b.example')).toEqual(otherTheme);
  });

  it('clearOverrides removes only the given origin', async () => {
    await saveOverrides('https://a.example', theme);
    await saveOverrides('https://b.example', theme);

    await clearOverrides('https://a.example');

    expect(await loadOverrides('https://a.example')).toBeNull();
    expect(await loadOverrides('https://b.example')).toEqual(theme);
  });
});
