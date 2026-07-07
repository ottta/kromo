import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  // WxtVitest() wires up the fake `browser` API (see storage.test.ts) but
  // does not apply vite plugins registered by wxt modules, so the Svelte
  // plugin (needed to compile the runes in theme-store.svelte.ts) must be
  // added explicitly.
  plugins: [svelte({ configFile: false }), WxtVitest()],
  resolve: {
    // Svelte ships separate client/server builds; without forcing the
    // "browser" condition, vitest resolves the server build and
    // @testing-library/svelte's `mount()` throws (lifecycle_function_unavailable).
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: true,
    include: ['src/**/*.test.ts'],
  },
});
