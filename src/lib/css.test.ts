import { describe, expect, it } from 'vitest';
import { formatOklch, parseColor, parseThemeCss, serializeThemeCss, toHex, toOklch } from './css';
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

describe('parseColor / formatOklch', () => {
  it('round-trips an opaque in-gamut color', () => {
    expect(formatOklch(parseColor('oklch(0.6 0.1 150)'))).toBe('oklch(0.6 0.1 150)');
  });

  it('round-trips a color with alpha, formatting it as a whole-number percent', () => {
    expect(formatOklch(parseColor('oklch(0.5 0.05 200 / 50%)'))).toBe('oklch(0.5 0.05 200 / 50%)');
  });

  it('omits the alpha suffix for fully opaque colors', () => {
    expect(formatOklch(parseColor('oklch(0.5 0.05 200)'))).not.toContain('/');
  });

  it('reports a missing/NaN hue as 0 for achromatic colors', () => {
    expect(parseColor('#808080')).toMatchObject({ c: 0, h: 0 });
  });

  it('clamps out-of-gamut chroma down to the sRGB boundary', () => {
    const { c } = parseColor(formatOklch({ l: 0.7, c: 0.5, h: 30, alpha: 1 }));
    expect(c).toBeLessThan(0.5);
  });

  it('defaults alpha to 1 when unparseable input falls back', () => {
    expect(parseColor('not-a-color')).toEqual({ l: 0, c: 0, h: 0, alpha: 1 });
  });

  // A live color picker seeds its state from `value`, but only when that
  // value didn't just come from its own emit (see ColorPicker.svelte's
  // `lastEmitted` guard). That guard only holds if formatting our own output
  // a second time is a no-op - otherwise every emit would re-seed the
  // picker's internal state mid-interaction.
  it('is a fixed point: re-formatting its own output is a no-op', () => {
    const inputs = [
      'oklch(0.7 0.15 30)',
      'oklch(0.5 0.05 200 / 50%)',
      '#808080',
      'oklch(0.7 0.5 30)', // out-of-gamut chroma, forces clamping
      'oklch(0.5 0.1 200 / 40%)', // out-of-gamut + alpha
      'oklch(0.9 0.4 10)',
    ];
    for (const input of inputs) {
      const once = formatOklch(parseColor(input));
      const twice = formatOklch(parseColor(once));
      expect(twice).toBe(once);
    }
  });
});
