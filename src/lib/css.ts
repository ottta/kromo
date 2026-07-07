import { parse as culoriParse, oklch, formatCss, formatHex, clampChroma } from 'culori';
import { TOKENS, type ThemeState, type TokenValues } from './tokens';

/** A colour expressed as OKLCH lightness/chroma/hue plus alpha (0-1). */
export interface OklchColor {
  l: number;
  c: number;
  h: number;
  alpha: number;
}

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

/**
 * Parse any CSS color string into its OKLCH components. Falls back to opaque
 * black for unparseable input. A missing/NaN hue (achromatic colors) is
 * reported as `0` — callers that need to preserve a prior hue across
 * achromatic values (e.g. a live color picker) should track it themselves.
 */
export function parseColor(input: string): OklchColor {
  const fallback: OklchColor = { l: 0, c: 0, h: 0, alpha: 1 };
  const parsed = culoriParse(normalizeLegacyHsl(input));
  if (!parsed) return fallback;
  const color = oklch(parsed);
  if (!color) return fallback;
  return {
    l: color.l ?? 0,
    c: color.c ?? 0,
    h: typeof color.h === 'number' && Number.isFinite(color.h) ? color.h : 0,
    alpha: color.alpha ?? 1,
  };
}

/**
 * Serialize an OKLCH color to a gamut-clamped `oklch()` string, matching the
 * space-separated token style used elsewhere in the codebase (alpha only
 * appended, as a whole-number percent, when < 1), e.g. `oklch(1 0 0 / 10%)`.
 */
export function formatOklch({ l, c, h, alpha }: OklchColor): string {
  const clamped = clampChroma({ mode: 'oklch', l, c, h, alpha }, 'oklch');
  const roundedL = roundTo(clamped.l ?? l, 4);
  const roundedC = roundTo(clamped.c ?? c, 4);
  const clampedH = Number.isFinite(clamped.h) ? clamped.h : h;
  const roundedH = roundTo(Number.isFinite(clampedH) ? clampedH : 0, 2);
  const suffix = alpha < 1 ? ` / ${Math.round(alpha * 100)}%` : '';
  return `oklch(${roundedL} ${roundedC} ${roundedH}${suffix})`;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
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
