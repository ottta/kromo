import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    // Toolbar icon with no popup, so openPanelOnActionClick
    // (set in background.ts) can open the side panel on click.
    action: { default_title: 'Open Praxis panel' },
  },
});
