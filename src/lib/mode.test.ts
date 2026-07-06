import { describe, expect, it } from 'vitest';
import { detectMode } from './mode';

function elWithClass(className: string): Element {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

describe('detectMode', () => {
  it('returns dark when root has the dark class', () => {
    expect(detectMode(elWithClass('dark'), elWithClass(''))).toBe('dark');
  });

  it('returns dark when body has the dark class', () => {
    expect(detectMode(elWithClass(''), elWithClass('dark'))).toBe('dark');
  });

  it('returns light when neither has the dark class', () => {
    expect(detectMode(elWithClass(''), elWithClass(''))).toBe('light');
  });

  it('is null-safe for both arguments', () => {
    expect(detectMode(null, null)).toBe('light');
  });

  it('is null-safe when only root is provided', () => {
    expect(detectMode(elWithClass('dark'), null)).toBe('dark');
  });

  it('is null-safe when only body is provided', () => {
    expect(detectMode(null, elWithClass('dark'))).toBe('dark');
  });
});
