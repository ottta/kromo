import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ColorPicker from './ColorPicker.svelte';

describe('ColorPicker', () => {
  it('re-syncs the hue thumb/backdrop when an achromatic value replaces a chromatic one (Reset)', () => {
    // Mirrors what happens on Reset: the token's `value` prop reverts from a
    // saturated colour to a near-grey shadcn baseline (chroma ~0), without
    // the user dragging anything themselves.
    const { getByRole, rerender } = render(ColorPicker, {
      value: 'oklch(0.6 0.15 30)',
      onInput: () => {},
    });

    const hueThumb = getByRole('slider', { name: 'Hue' });
    const initialLeft = hueThumb.style.left;

    // Sanity check: the saturated colour did drive the hue thumb somewhere
    // away from 0% - otherwise this test can't distinguish stale vs. reset.
    expect(parseFloat(initialLeft)).toBeGreaterThan(0);

    rerender({ value: 'oklch(0.205 0 0)', onInput: () => {} });

    // Bug: `stableHue` was only ever updated by chromatic drags/field edits
    // and a guarded effect that skips near-grey colours, so it stayed stuck
    // on the previously edited hue instead of reverting to the incoming
    // achromatic value's hue (0).
    expect(hueThumb.style.left).not.toBe(initialLeft);
    expect(parseFloat(hueThumb.style.left)).toBeCloseTo(0, 5);
  });
});
