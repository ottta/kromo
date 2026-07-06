import { parse as culoriParse, oklch, formatCss, formatHex } from 'culori';
import { TOKENS, type ThemeState, type TokenValues } from './tokens';

/**
 * Parse the `:root { ... }` and `.dark { ... }` blocks of a shadcn theme CSS
 * string into a { light, dark } map of raw (verbatim) CSS values.
 *
 * Tolerant of a missing `.dark` block (returns an empty object for `dark`).
 * Values are stored exactly as written so that
 * `parseThemeCss(serializeThemeCss(theme))` round-trips without loss.
 */
export function parseThemeCss(css: string): ThemeState {
  const rootBlock = extractBlock(css, ':root');
  const darkBlock = extractBlock(css, '.dark');
  return {
    light: rootBlock ? extractDeclarations(rootBlock) : {},
    dark: darkBlock ? extractDeclarations(darkBlock) : {},
  };
}

/**
 * Emit `:root { ... }` / `.dark { ... }` blocks for the tokens we manage
 * (see tokens.ts), in the stable order defined by `TOKENS`. Values are
 * written verbatim (no color normalization).
 */
export function serializeThemeCss(theme: ThemeState): string {
  const blocks = [serializeBlock(':root', theme.light), serializeBlock('.dark', theme.dark)].filter(
    (block): block is string => block !== null,
  );
  return blocks.length ? `${blocks.join('\n\n')}\n` : '';
}

/** Normalize any hex / hsl / legacy "H S% L%" / oklch color to an `oklch()` string. */
export function toOklch(color: string): string {
  const parsed = culoriParse(normalizeLegacyHsl(color));
  if (!parsed) return color;
  return formatCss(oklch(parsed));
}

/** Normalize any hex / hsl / legacy "H S% L%" / oklch color to a `#rrggbb` hex string. */
export function toHex(color: string): string {
  const parsed = culoriParse(normalizeLegacyHsl(color));
  if (!parsed) return color;
  return formatHex(parsed);
}

const KNOWN_VARS = new Set(TOKENS.map((token) => token.cssVar));

function extractBlock(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*{([^}]*)}`, 'm'));
  return match ? match[1] : null;
}

function extractDeclarations(block: string): TokenValues {
  const values: TokenValues = {};
  const declRe = /(--[\w-]+)\s*:\s*([^;]+);?/g;
  let match: RegExpExecArray | null;
  while ((match = declRe.exec(block))) {
    const cssVar = match[1].trim();
    if (!KNOWN_VARS.has(cssVar)) continue;
    values[cssVar] = match[2].trim();
  }
  return values;
}

function serializeBlock(selector: string, values: TokenValues): string | null {
  const lines: string[] = [];
  for (const token of TOKENS) {
    const value = values[token.cssVar];
    if (value === undefined) continue;
    lines.push(`  ${token.cssVar}: ${value};`);
  }
  return lines.length ? `${selector} {\n${lines.join('\n')}\n}` : null;
}

// shadcn v3 exposed raw "H S% L%" triplets meant to be interpolated inside
// `hsl(var(--x))`. culori can't parse the bare triplet, so wrap it.
const LEGACY_HSL_TRIPLET_RE = /^-?[\d.]+\s+[\d.]+%\s+[\d.]+%$/;

function normalizeLegacyHsl(color: string): string {
  const trimmed = color.trim();
  return LEGACY_HSL_TRIPLET_RE.test(trimmed) ? `hsl(${trimmed})` : trimmed;
}
