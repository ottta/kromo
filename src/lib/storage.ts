import { browser } from 'wxt/browser';
import type { ThemeState } from './tokens';

function storageKey(origin: string): string {
  return `kromo:overrides:${origin}`;
}

export async function loadOverrides(origin: string): Promise<ThemeState | null> {
  const key = storageKey(origin);
  const result = await browser.storage.local.get(key);
  const value = result[key];
  return (value as ThemeState | undefined) ?? null;
}

export async function saveOverrides(origin: string, theme: ThemeState): Promise<void> {
  const key = storageKey(origin);
  await browser.storage.local.set({ [key]: theme });
}

export async function clearOverrides(origin: string): Promise<void> {
  const key = storageKey(origin);
  await browser.storage.local.remove(key);
}
