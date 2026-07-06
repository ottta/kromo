import { TOKENS, type TokenDef, type ThemeState, type TokenValues } from './tokens';

/** Any CSS grouping rule that exposes a nested `.cssRules` list. */
interface GroupingRule {
  cssRules: CSSRuleList;
}

function isGroupingRule(rule: CSSRule): rule is CSSRule & GroupingRule {
  return 'cssRules' in rule;
}

function isStyleRule(rule: CSSRule): rule is CSSStyleRule {
  return rule instanceof CSSStyleRule;
}

/** A `:root`-ish selector part, as opposed to one scoped under `.dark`. */
function isRootSelector(part: string): boolean {
  return part === ':root' || part === 'html' || part === ':where(:root)' || part.includes(':root');
}

function isDarkSelector(part: string): boolean {
  return part.includes('.dark');
}

function classifySelector(selectorText: string): 'light' | 'dark' | null {
  const parts = selectorText.split(',').map((part) => part.trim());
  let matched: 'light' | 'dark' | null = null;
  for (const part of parts) {
    if (isDarkSelector(part)) {
      matched = 'dark';
    } else if (isRootSelector(part)) {
      matched = matched ?? 'light';
    }
  }
  return matched;
}

function collectFromRule(
  rule: CSSRule,
  tokens: TokenDef[],
  light: TokenValues,
  dark: TokenValues,
): void {
  if (isStyleRule(rule)) {
    const bucket = classifySelector(rule.selectorText);
    if (bucket) {
      const target = bucket === 'dark' ? dark : light;
      for (const token of tokens) {
        const value = rule.style.getPropertyValue(token.cssVar).trim();
        if (value) target[token.cssVar] = value;
      }
    }
  }

  if (isGroupingRule(rule)) {
    for (const nested of Array.from(rule.cssRules)) {
      collectFromRule(nested, tokens, light, dark);
    }
  }
}

/**
 * Read shadcn theme tokens as AUTHORED in the page's stylesheets, independent
 * of whatever mode (`light`/`dark`) is currently active on the document.
 *
 * Unlike `getComputedStyle`, this walks the CSSOM directly so a `:root { }`
 * rule is always attributed to `light` and a `.dark { }` rule is always
 * attributed to `dark`, regardless of which class is on `<html>` right now.
 *
 * Either bucket may come back partial or empty (e.g. a page with no `.dark`
 * block at all) — callers should fall back to computed-style reads for
 * whichever bucket is empty.
 */
export function readAuthoredTheme(
  sheets: Iterable<CSSStyleSheet>,
  tokens: TokenDef[] = TOKENS,
): ThemeState {
  const light: TokenValues = {};
  const dark: TokenValues = {};

  for (const sheet of sheets) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheets throw a SecurityError on `.cssRules` access.
      continue;
    }

    for (const rule of Array.from(rules)) {
      collectFromRule(rule, tokens, light, dark);
    }
  }

  return { light, dark };
}
