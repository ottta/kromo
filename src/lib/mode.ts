import type { ThemeMode } from './tokens';

/**
 * Detects the site's currently active theme mode from the shadcn/ui `.dark`
 * class convention: dark if either `<html>` or `<body>` carries the `dark`
 * class, light otherwise. Null-safe so callers can invoke this before
 * `document.body` exists (content scripts run at `document_start`).
 */
export function detectMode(root: Element | null, body: Element | null): ThemeMode {
  if (root?.classList.contains('dark') || body?.classList.contains('dark')) {
    return 'dark';
  }
  return 'light';
}
