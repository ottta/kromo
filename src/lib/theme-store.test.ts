import { describe, expect, it } from 'vitest';
import { createThemeStore } from './theme-store.svelte';
import type { ThemeState } from './tokens';

const theme: ThemeState = {
  light: {
    '--background': 'oklch(1 0 0)',
    '--primary': 'oklch(0.205 0 0)',
    '--radius': '0.625rem',
  },
  dark: {
    '--background': 'oklch(0.145 0 0)',
  },
};

describe('createThemeStore', () => {
  it('starts clean (not dirty) with empty theme state', () => {
    const store = createThemeStore();
    expect(store.dirty).toBe(false);
    expect(store.working).toEqual({ light: {}, dark: {} });
    expect(store.baseline).toEqual({ light: {}, dark: {} });
  });

  it('loadTheme sets working and baseline, and stays clean', () => {
    const store = createThemeStore();
    store.loadTheme('https://example.com', theme);

    expect(store.origin).toBe('https://example.com');
    expect(store.working).toEqual(theme);
    expect(store.baseline).toEqual(theme);
    expect(store.dirty).toBe(false);
  });

  it('setToken updates working[mode][cssVar] and flips dirty', () => {
    const store = createThemeStore();
    store.loadTheme('https://example.com', theme);

    store.setToken('light', '--primary', 'oklch(0.5 0 0)');

    expect(store.working.light['--primary']).toBe('oklch(0.5 0 0)');
    expect(store.dirty).toBe(true);
    // baseline is untouched
    expect(store.baseline.light['--primary']).toBe('oklch(0.205 0 0)');
  });

  it('setMode switches the active mode', () => {
    const store = createThemeStore();
    expect(store.mode).toBe('light');

    store.setMode('dark');

    expect(store.mode).toBe('dark');
  });

  it('reset() restores working to baseline and clears dirty', () => {
    const store = createThemeStore();
    store.loadTheme('https://example.com', theme);
    store.setToken('dark', '--background', 'oklch(0 0 0)');
    expect(store.dirty).toBe(true);

    store.reset();

    expect(store.working).toEqual(theme);
    expect(store.dirty).toBe(false);
  });

  it('exportCss() output round-trips through importCss()', () => {
    const store = createThemeStore();
    store.loadTheme('https://example.com', theme);

    const css = store.exportCss();
    store.setToken('light', '--primary', 'oklch(0.1 0 0)'); // mutate before reimporting
    store.importCss(css);

    expect(store.working).toEqual(theme);
  });

  it('importCss loads parsed values into working', () => {
    const store = createThemeStore();
    const css =
      ':root {\n  --background: oklch(1 0 0);\n}\n\n.dark {\n  --background: oklch(0.145 0 0);\n}\n';

    store.importCss(css);

    expect(store.working).toEqual({
      light: { '--background': 'oklch(1 0 0)' },
      dark: { '--background': 'oklch(0.145 0 0)' },
    });
  });
});
