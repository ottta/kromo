/**
 * Shared shadcn/ui CSS theme token contract.
 *
 * This module is the single source of truth for which CSS custom properties
 * Kromo reads, edits, and exports. Every other module (css.ts, messaging.ts,
 * storage.ts, theme-store.svelte.ts) is derived from `TOKENS`.
 */

export type TokenType = 'color' | 'dimension';

export type TokenGroup =
  | 'base'
  | 'card'
  | 'popover'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'state'
  | 'border'
  | 'chart'
  | 'sidebar';

export interface TokenDef {
  /** Stable identifier, matches the CSS var name without the `--` prefix. */
  name: string;
  /** e.g. '--primary' */
  cssVar: string;
  label: string;
  type: TokenType;
  group: TokenGroup;
}

export const TOKENS: TokenDef[] = [
  // base
  { name: 'background', cssVar: '--background', label: 'Background', type: 'color', group: 'base' },
  { name: 'foreground', cssVar: '--foreground', label: 'Foreground', type: 'color', group: 'base' },

  // card / popover surfaces
  { name: 'card', cssVar: '--card', label: 'Background', type: 'color', group: 'card' },
  {
    name: 'card-foreground',
    cssVar: '--card-foreground',
    label: 'Foreground',
    type: 'color',
    group: 'card',
  },
  { name: 'popover', cssVar: '--popover', label: 'Background', type: 'color', group: 'popover' },
  {
    name: 'popover-foreground',
    cssVar: '--popover-foreground',
    label: 'Foreground',
    type: 'color',
    group: 'popover',
  },

  // primary / secondary / muted / accent
  { name: 'primary', cssVar: '--primary', label: 'Background', type: 'color', group: 'primary' },
  {
    name: 'primary-foreground',
    cssVar: '--primary-foreground',
    label: 'Foreground',
    type: 'color',
    group: 'primary',
  },
  {
    name: 'secondary',
    cssVar: '--secondary',
    label: 'Background',
    type: 'color',
    group: 'secondary',
  },
  {
    name: 'secondary-foreground',
    cssVar: '--secondary-foreground',
    label: 'Foreground',
    type: 'color',
    group: 'secondary',
  },
  { name: 'muted', cssVar: '--muted', label: 'Background', type: 'color', group: 'muted' },
  {
    name: 'muted-foreground',
    cssVar: '--muted-foreground',
    label: 'Foreground',
    type: 'color',
    group: 'muted',
  },
  { name: 'accent', cssVar: '--accent', label: 'Background', type: 'color', group: 'accent' },
  {
    name: 'accent-foreground',
    cssVar: '--accent-foreground',
    label: 'Foreground',
    type: 'color',
    group: 'accent',
  },

  // state
  {
    name: 'destructive',
    cssVar: '--destructive',
    label: 'Background',
    type: 'color',
    group: 'state',
  },
  {
    name: 'destructive-foreground',
    cssVar: '--destructive-foreground',
    label: 'Foreground',
    type: 'color',
    group: 'state',
  },

  // border / input / ring / radius
  { name: 'border', cssVar: '--border', label: 'Border', type: 'color', group: 'border' },
  { name: 'input', cssVar: '--input', label: 'Input', type: 'color', group: 'border' },
  { name: 'ring', cssVar: '--ring', label: 'Ring', type: 'color', group: 'border' },
  { name: 'radius', cssVar: '--radius', label: 'Radius', type: 'dimension', group: 'border' },

  // chart
  { name: 'chart-1', cssVar: '--chart-1', label: 'Chart 1', type: 'color', group: 'chart' },
  { name: 'chart-2', cssVar: '--chart-2', label: 'Chart 2', type: 'color', group: 'chart' },
  { name: 'chart-3', cssVar: '--chart-3', label: 'Chart 3', type: 'color', group: 'chart' },
  { name: 'chart-4', cssVar: '--chart-4', label: 'Chart 4', type: 'color', group: 'chart' },
  { name: 'chart-5', cssVar: '--chart-5', label: 'Chart 5', type: 'color', group: 'chart' },

  // sidebar
  { name: 'sidebar', cssVar: '--sidebar', label: 'Sidebar', type: 'color', group: 'sidebar' },
  {
    name: 'sidebar-foreground',
    cssVar: '--sidebar-foreground',
    label: 'Foreground',
    type: 'color',
    group: 'sidebar',
  },
  {
    name: 'sidebar-primary',
    cssVar: '--sidebar-primary',
    label: 'Sidebar Primary',
    type: 'color',
    group: 'sidebar',
  },
  {
    name: 'sidebar-primary-foreground',
    cssVar: '--sidebar-primary-foreground',
    label: 'Sidebar Primary Foreground',
    type: 'color',
    group: 'sidebar',
  },
  {
    name: 'sidebar-accent',
    cssVar: '--sidebar-accent',
    label: 'Sidebar Accent',
    type: 'color',
    group: 'sidebar',
  },
  {
    name: 'sidebar-accent-foreground',
    cssVar: '--sidebar-accent-foreground',
    label: 'Sidebar Accent Foreground',
    type: 'color',
    group: 'sidebar',
  },
  {
    name: 'sidebar-border',
    cssVar: '--sidebar-border',
    label: 'Sidebar Border',
    type: 'color',
    group: 'sidebar',
  },
  {
    name: 'sidebar-ring',
    cssVar: '--sidebar-ring',
    label: 'Sidebar Ring',
    type: 'color',
    group: 'sidebar',
  },
];

export type TokenName = string; // derived from TOKENS

export type ThemeMode = 'light' | 'dark';

/** Maps a cssVar (e.g. '--primary') to its raw CSS value string. */
export type TokenValues = Record<string, string>;

export interface ThemeState {
  light: TokenValues;
  dark: TokenValues;
}
