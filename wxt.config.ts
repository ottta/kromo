import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    // Toolbar icon with no popup, so openPanelOnActionClick
    // (set in background.ts) can open the side panel on click.
    action: { default_title: 'Open Kromo panel' },
    // 'storage' is required by src/lib/storage.ts (browser.storage.local).
    // 'activeTab' + 'scripting' are required by the content script to run on
    // and inspect the active tab.
    permissions: ['storage', 'activeTab', 'scripting'],
    // The content script matches ['*://*/*'], so it needs host access on
    // every origin.
    host_permissions: ['<all_urls>'],
  },
});
