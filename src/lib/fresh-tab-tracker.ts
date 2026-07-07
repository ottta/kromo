/**
 * Tracks tabs created via new-tab (Cmd+T, "+") so the panel can ignore
 * their activation while they're still blank (no resolvable origin) rather
 * than re-crawling and blowing away whatever the user was editing on the
 * previously active tab. A tracked tab graduates out once it navigates to
 * a real page (or is closed), after which it's treated like any other tab.
 */
export interface FreshTabTracker {
  markCreated(tabId: number): void;
  markRemoved(tabId: number): void;
  /** True when this activation/update should be ignored (still fresh + blank). */
  shouldIgnore(tabId: number, origin: string | null): boolean;
}

export function createFreshTabTracker(): FreshTabTracker {
  const freshTabIds = new Set<number>();

  return {
    markCreated(tabId) {
      freshTabIds.add(tabId);
    },
    markRemoved(tabId) {
      freshTabIds.delete(tabId);
    },
    shouldIgnore(tabId, origin) {
      if (!freshTabIds.has(tabId)) return false;
      if (origin) {
        freshTabIds.delete(tabId);
        return false;
      }
      return true;
    },
  };
}
