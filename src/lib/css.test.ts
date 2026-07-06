import { describe, expect, it } from 'vitest';
import { parseThemeCss, serializeThemeCss, toHex, toOklch } from './css';
import type { ThemeState } from './tokens';

describe('parseThemeCss / serializeThemeCss', () => {
  it('round-trips values verbatim', () => {
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
    const css = serializeThemeCss(theme);
    expect(parseThemeCss(css)).toEqual(theme);
  });

  it('is tolerant of a missing .dark block', () => {
    const css = ':root {\n  --background: oklch(1 0 0);\n}';
    expect(parseThemeCss(css)).toEqual({ light: { '--background': 'oklch(1 0 0)' }, dark: {} });
  });

  it('parses legacy shadcn v3 "H S% L%" triplets', () => {
    const css = ':root {\n  --primary: 222.2 47.4% 11.2%;\n}';
    expect(parseThemeCss(css)).toEqual({ light: { '--primary': '222.2 47.4% 11.2%' }, dark: {} });
  });

  it('ignores unmanaged custom properties', () => {
    const css = ':root {\n  --primary: oklch(0.205 0 0);\n  --unmanaged-thing: red;\n}';
    expect(parseThemeCss(css)).toEqual({ light: { '--primary': 'oklch(0.205 0 0)' }, dark: {} });
  });
});

describe('toOklch / toHex', () => {
  it('normalizes hex to oklch', () => {
    expect(toOklch('#ff0000')).toMatch(/^oklch\(/);
  });

  it('normalizes legacy "H S% L%" triplets to oklch', () => {
    expect(toOklch('222.2 47.4% 11.2%')).toMatch(/^oklch\(/);
  });

  it('normalizes oklch to hex', () => {
    expect(toHex('oklch(0.985 0 0)')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('round-trips hex -> oklch -> hex', () => {
    expect(toHex(toOklch('#336699'))).toBe('#336699');
  });
});
