import { describe, expect, it } from 'vitest';
import { CORE_TOKENS, isThemeSupported, TOKENS, type TokenValues } from './tokens';

function fullValues(): TokenValues {
  const values: TokenValues = {};
  for (const token of TOKENS) {
    values[token.cssVar] = 'oklch(0.5 0.1 200)';
  }
  return values;
}

describe('isThemeSupported', () => {
  it('returns true when every core token is present', () => {
    expect(isThemeSupported(fullValues())).toBe(true);
  });

  it('returns false for a site with no shadcn/ui tokens at all', () => {
    expect(isThemeSupported({})).toBe(false);
  });

  it('returns true even when chart and sidebar tokens are missing', () => {
    const values = fullValues();
    for (const token of TOKENS) {
      if (token.group === 'chart' || token.group === 'sidebar') {
        delete values[token.cssVar];
      }
    }
    expect(isThemeSupported(values)).toBe(true);
  });

  it('returns false when a single core token is missing', () => {
    const values = fullValues();
    delete values['--primary'];
    expect(isThemeSupported(values)).toBe(false);
  });

  it('treats an empty string value as missing', () => {
    const values = fullValues();
    values['--border'] = '';
    expect(isThemeSupported(values)).toBe(false);
  });

  it('excludes chart and sidebar groups from CORE_TOKENS', () => {
    expect(CORE_TOKENS.some((token) => token.group === 'chart')).toBe(false);
    expect(CORE_TOKENS.some((token) => token.group === 'sidebar')).toBe(false);
  });
});
