/**
 * Extract the origin Kromo can edit from a tab's URL.
 *
 * Returns `null` for anything that isn't a normal http(s) page (missing URL,
 * `chrome://`, `about:`, extension pages, malformed URLs, ...) so callers can
 * treat those uniformly as "unavailable".
 */
export function originFromUrl(url: string | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  return parsed.origin;
}
