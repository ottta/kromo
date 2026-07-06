import { getContext, setContext } from 'svelte';
import type { ThemeMode, ThemeState } from './tokens';
import { parseThemeCss, serializeThemeCss } from './css';

function emptyTheme(): ThemeState {
  return { light: {}, dark: {} };
}

function cloneTheme(theme: ThemeState): ThemeState {
  return { light: { ...theme.light }, dark: { ...theme.dark } };
}

export interface ThemeStore {
  readonly origin: string;
  readonly working: ThemeState;
  readonly baseline: ThemeState;
  readonly mode: ThemeMode;
  readonly dirty: boolean;
  setMode(mode: ThemeMode): void;
  setToken(mode: ThemeMode, cssVar: string, value: string): void;
  /**
   * Seed the store for a given origin. Callers fetch `theme` themselves
   * (e.g. via `sendMessage('readTokens')` merged with `loadOverrides`) so
   * this store stays free of messaging/storage side effects and DI-friendly.
   */
  loadTheme(origin: string, theme: ThemeState): void;
  /** Discards in-progress edits, reverting `working` back to `baseline`. */
  reset(): void;
  exportCss(): string;
  importCss(css: string): void;
}

/**
 * Factory for a Svelte 5 runes-based theme store. No module-level mutable
 * state - every consumer gets its own instance, injected via Svelte context
 * (see `setThemeStore` / `getThemeStore`) rather than imported as a singleton.
 */
export function createThemeStore(): ThemeStore {
  let origin = $state('');
  let working = $state<ThemeState>(emptyTheme());
  let baseline = $state<ThemeState>(emptyTheme());
  let mode = $state<ThemeMode>('light');
  const dirty = $derived(JSON.stringify(working) !== JSON.stringify(baseline));

  function setMode(nextMode: ThemeMode): void {
    mode = nextMode;
  }

  function setToken(targetMode: ThemeMode, cssVar: string, value: string): void {
    working = {
      ...working,
      [targetMode]: { ...working[targetMode], [cssVar]: value },
    };
  }

  function loadTheme(nextOrigin: string, theme: ThemeState): void {
    origin = nextOrigin;
    baseline = cloneTheme(theme);
    working = cloneTheme(theme);
  }

  function reset(): void {
    working = cloneTheme(baseline);
  }

  function exportCss(): string {
    return serializeThemeCss(working);
  }

  function importCss(css: string): void {
    working = parseThemeCss(css);
  }

  return {
    get origin() {
      return origin;
    },
    get working() {
      return working;
    },
    get baseline() {
      return baseline;
    },
    get mode() {
      return mode;
    },
    get dirty() {
      return dirty;
    },
    setMode,
    setToken,
    loadTheme,
    reset,
    exportCss,
    importCss,
  };
}

/** Svelte context key for the theme store (dependency injection, not a global). */
export const THEME_STORE_KEY = Symbol('kromo-theme-store');

export function setThemeStore(store: ThemeStore): ThemeStore {
  return setContext(THEME_STORE_KEY, store);
}

export function getThemeStore(): ThemeStore {
  const store = getContext<ThemeStore | undefined>(THEME_STORE_KEY);
  if (!store) {
    throw new Error(
      'ThemeStore not found in context. Call setThemeStore() in a parent component first.',
    );
  }
  return store;
}
