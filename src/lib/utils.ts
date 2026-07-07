import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Inline CSS for a small checkerboard pattern, tinted with the theme's
 * border color. Layer this *behind* a translucent color layer (it must be
 * listed after any `background-image` color layer, since earlier entries
 * paint on top) so alpha reads correctly instead of being masked by an
 * opaque `background-color`.
 */
export const CHECKERBOARD_BACKGROUND_IMAGE = [
  'linear-gradient(45deg, var(--color-border) 25%, transparent 25%)',
  'linear-gradient(-45deg, var(--color-border) 25%, transparent 25%)',
  'linear-gradient(45deg, transparent 75%, var(--color-border) 75%)',
  'linear-gradient(-45deg, transparent 75%, var(--color-border) 75%)',
].join(', ');
// One size per layer in CHECKERBOARD_BACKGROUND_IMAGE, so callers stacking
// an extra background-image layer in front only need to prepend one value.
export const CHECKERBOARD_BACKGROUND_SIZE = '8px 8px, 8px 8px, 8px 8px, 8px 8px';
export const CHECKERBOARD_BACKGROUND_POSITION = '0 0, 0 4px, 4px -4px, -4px 0px';
