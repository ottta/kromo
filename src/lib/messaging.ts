import { defineExtensionMessaging } from '@webext-core/messaging';
import type { ThemeState } from './tokens';

/**
 * Messaging protocol between the sidepanel and the active tab's content
 * script. Uses the function-syntax form so data/return types are inferred.
 */
export interface ProtocolMap {
  /** Content script reads getComputedStyle of :root and .dark on the active tab. */
  readTokens(): { origin: string; theme: ThemeState };
  /** Content script injects/updates an override <style> tag with these values. */
  applyOverrides(theme: Partial<ThemeState>): void;
  /** Content script removes the override layer and any Kromo inline props. */
  resetOverrides(): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
