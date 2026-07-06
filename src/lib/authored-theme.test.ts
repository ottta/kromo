import { afterEach, describe, expect, it } from 'vitest';
import { readAuthoredTheme } from './authored-theme';

function addStyle(css: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  return style;
}

function styleSheets(): CSSStyleSheet[] {
  return Array.from(document.styleSheets);
}

afterEach(() => {
  document.querySelectorAll('style').forEach((el) => el.remove());
  document.documentElement.classList.remove('dark');
});

describe('readAuthoredTheme', () => {
  it('separates :root (light) from .dark declarations', () => {
    addStyle(`
      :root { --background: oklch(1 0 0); --primary: oklch(0.205 0 0); }
      .dark { --background: oklch(0.145 0 0); --primary: oklch(0.9 0 0); }
    `);

    const theme = readAuthoredTheme(styleSheets());

    expect(theme.light).toEqual({
      '--background': 'oklch(1 0 0)',
      '--primary': 'oklch(0.205 0 0)',
    });
    expect(theme.dark).toEqual({
      '--background': 'oklch(0.145 0 0)',
      '--primary': 'oklch(0.9 0 0)',
    });
  });

  it('stays correct even when the document is currently in dark mode', () => {
    // Regression for the bug this module fixes: reading via getComputedStyle
    // would have returned the dark values for the "light" bucket here.
    document.documentElement.classList.add('dark');
    addStyle(`
      :root { --background: oklch(1 0 0); }
      .dark { --background: oklch(0.145 0 0); }
    `);

    const theme = readAuthoredTheme(styleSheets());

    expect(theme.light).toEqual({ '--background': 'oklch(1 0 0)' });
    expect(theme.dark).toEqual({ '--background': 'oklch(0.145 0 0)' });
  });

  it('recurses into grouping rules like @media', () => {
    addStyle(`
      @media (min-width: 1px) {
        :root { --background: oklch(1 0 0); }
        .dark { --background: oklch(0.145 0 0); }
      }
    `);

    const theme = readAuthoredTheme(styleSheets());

    expect(theme.light).toEqual({ '--background': 'oklch(1 0 0)' });
    expect(theme.dark).toEqual({ '--background': 'oklch(0.145 0 0)' });
  });

  it('recurses into @layer blocks', () => {
    // jsdom (v29 here) parses @layer as CSSLayerBlockRule with a nested
    // .cssRules list, so this is exercised for real rather than skipped.
    addStyle(`
      @layer base {
        :root { --background: oklch(1 0 0); }
        .dark { --background: oklch(0.145 0 0); }
      }
    `);

    const theme = readAuthoredTheme(styleSheets());

    expect(theme.light).toEqual({ '--background': 'oklch(1 0 0)' });
    expect(theme.dark).toEqual({ '--background': 'oklch(0.145 0 0)' });
  });

  it('skips a stylesheet whose cssRules getter throws (cross-origin)', () => {
    addStyle(`:root { --background: oklch(1 0 0); }`);

    const throwingSheet = {
      get cssRules(): never {
        throw new DOMException('blocked', 'SecurityError');
      },
    } as unknown as CSSStyleSheet;

    const theme = readAuthoredTheme([throwingSheet, ...styleSheets()]);

    expect(theme.light).toEqual({ '--background': 'oklch(1 0 0)' });
  });

  it('only pulls the requested tokens', () => {
    addStyle(`:root { --background: oklch(1 0 0); --unmanaged: red; }`);

    const theme = readAuthoredTheme(styleSheets(), [
      {
        name: 'background',
        cssVar: '--background',
        label: 'Background',
        type: 'color',
        group: 'base',
      },
    ]);

    expect(theme.light).toEqual({ '--background': 'oklch(1 0 0)' });
  });

  it('returns empty buckets when there is nothing authored', () => {
    const theme = readAuthoredTheme([]);
    expect(theme).toEqual({ light: {}, dark: {} });
  });
});
