import { TOKENS } from '@/lib/tokens';
import type { ThemeState, TokenValues } from '@/lib/tokens';
import { onMessage } from '@/lib/messaging';
import { loadOverrides } from '@/lib/storage';

const OVERRIDE_STYLE_ID = 'kromo-overrides';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_start',
  main() {
    // Per-tab content-script singleton (not app-level shared state): the
    // sidepanel and background have no reason to see this, it just tracks
    // what's currently injected into *this* page.
    let overrides: ThemeState = { light: {}, dark: {} };

    function buildOverrideCss(theme: ThemeState): string {
      const blocks: string[] = [];
      const lightDecls = Object.entries(theme.light)
        .map(([cssVar, value]) => `${cssVar}: ${value} !important;`)
        .join(' ');
      if (lightDecls) blocks.push(`:root{ ${lightDecls} }`);

      const darkDecls = Object.entries(theme.dark)
        .map(([cssVar, value]) => `${cssVar}: ${value} !important;`)
        .join(' ');
      if (darkDecls) blocks.push(`.dark{ ${darkDecls} }`);

      return blocks.join('\n');
    }

    function getOrCreateOverrideStyleEl(): HTMLStyleElement {
      const existing = document.getElementById(OVERRIDE_STYLE_ID);
      if (existing instanceof HTMLStyleElement) return existing;

      const style = document.createElement('style');
      style.id = OVERRIDE_STYLE_ID;
      document.documentElement.append(style);
      return style;
    }

    function renderOverrides(): void {
      getOrCreateOverrideStyleEl().textContent = buildOverrideCss(overrides);
    }

    function mergeOverrides(partial: Partial<ThemeState>): void {
      overrides = {
        light: { ...overrides.light, ...partial.light },
        dark: { ...overrides.dark, ...partial.dark },
      };
    }

    function clearOverrides(): void {
      overrides = { light: {}, dark: {} };
      document.getElementById(OVERRIDE_STYLE_ID)?.remove();
    }

    function readComputedTokenValues(el: Element): TokenValues {
      const computed = getComputedStyle(el);
      const values: TokenValues = {};
      for (const token of TOKENS) {
        const value = computed.getPropertyValue(token.cssVar).trim();
        if (value) values[token.cssVar] = value;
      }
      return values;
    }

    function readCurrentTheme(): ThemeState {
      const light = readComputedTokenValues(document.documentElement);

      // shadcn's `.dark { --x: ... }` rule only sets custom properties on
      // elements matching `.dark`, so an offscreen probe carrying that class
      // picks up dark-mode values without ever toggling the visible page.
      if (!document.body) {
        return { light, dark: { ...light } };
      }

      const probe = document.createElement('div');
      probe.className = 'dark';
      probe.style.position = 'fixed';
      probe.style.left = '-9999px';
      probe.style.visibility = 'hidden';
      document.body.append(probe);
      const dark = readComputedTokenValues(probe);
      probe.remove();

      return { light, dark };
    }

    onMessage('readTokens', () => {
      return { origin: location.origin, theme: readCurrentTheme() };
    });

    onMessage('applyOverrides', ({ data }) => {
      mergeOverrides(data);
      renderOverrides();
    });

    onMessage('resetOverrides', () => {
      clearOverrides();
    });

    // Re-apply any previously saved per-origin overrides on load, before the
    // sidepanel ever opens.
    loadOverrides(location.origin)
      .then((stored) => {
        if (!stored) return;
        mergeOverrides(stored);
        renderOverrides();
      })
      .catch((error) => {
        console.error('[kromo] failed to load stored overrides', error);
      });
  },
});
