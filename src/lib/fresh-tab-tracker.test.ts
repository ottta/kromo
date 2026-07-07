import { describe, expect, it } from 'vitest';
import { createFreshTabTracker } from './fresh-tab-tracker';

describe('createFreshTabTracker', () => {
  it('ignores an untracked tab (not created via new-tab)', () => {
    const tracker = createFreshTabTracker();
    expect(tracker.shouldIgnore(1, null)).toBe(false);
    expect(tracker.shouldIgnore(1, 'https://example.com')).toBe(false);
  });

  it('ignores a fresh tab while it is still blank (no resolvable origin)', () => {
    const tracker = createFreshTabTracker();
    tracker.markCreated(1);

    expect(tracker.shouldIgnore(1, null)).toBe(true);
    // Repeated activations/updates while still blank stay ignored.
    expect(tracker.shouldIgnore(1, null)).toBe(true);
  });

  it('stops ignoring a fresh tab once it navigates to a real page', () => {
    const tracker = createFreshTabTracker();
    tracker.markCreated(1);

    expect(tracker.shouldIgnore(1, 'https://example.com')).toBe(false);
    // Having graduated, it behaves like any other tab from then on.
    expect(tracker.shouldIgnore(1, null)).toBe(false);
  });

  it('treats a tab created already pointing at a real URL as non-blank immediately', () => {
    const tracker = createFreshTabTracker();
    tracker.markCreated(1);

    expect(tracker.shouldIgnore(1, 'https://example.com')).toBe(false);
  });

  it('stops tracking a fresh tab once it is closed', () => {
    const tracker = createFreshTabTracker();
    tracker.markCreated(1);
    tracker.markRemoved(1);

    expect(tracker.shouldIgnore(1, null)).toBe(false);
  });

  it('tracks multiple fresh tabs independently', () => {
    const tracker = createFreshTabTracker();
    tracker.markCreated(1);
    tracker.markCreated(2);

    expect(tracker.shouldIgnore(1, 'https://example.com')).toBe(false);
    expect(tracker.shouldIgnore(2, null)).toBe(true);
  });
});
