# Kromo — Development Guide

Project-level guide for the Kromo extension. It **narrows** the global conventions in `~/.claude/CLAUDE.md` (git workflow, branch naming, Conventional Commits, PR structure, SemVer) — those still apply and are not repeated here.

Kromo is a Chrome/Firefox extension that live-edits shadcn/ui CSS theme tokens on the **real** active tab (not an iframe, unlike tweakcn) and exports the result as a CSS block a user pastes into a CMS admin or stylesheet.

## Stack (locked)

Bun · WXT · Svelte 5 (runes) · Tailwind v4 (CSS-first) · TypeScript. **No SvelteKit** — it does not fit an extension bundle.

## Architecture

Three extension contexts:

1. **Background** (`src/entrypoints/background.ts`) — service worker. Opens the side panel on toolbar-icon click (`openPanelOnActionClick`). No DOM access.
2. **Side panel** (`src/entrypoints/sidepanel/`) — the Svelte 5 editor UI. Resolves the active tab/origin, drives live edits, persistence, export/import/reset.
3. **Content script** (`src/entrypoints/content.ts`) — injected on `*://*/*` at `document_start`. Reads the page's computed token values and writes/removes live overrides.

### Data flow

```
panel edits token
  → store.setToken(mode, cssVar, value)          (runes store, in-panel)
  → debounced sendMessage('applyOverrides', { [mode]: working[mode] }, tabId)
  → content script rebuilds <style id="kromo-overrides"> ( :root / .dark, !important )
  → page updates live
  → saveOverrides(origin, working)               (browser.storage.local)
```

On panel mount: `sendMessage('readTokens', …, tabId)` (page baseline) merged with `loadOverrides(origin)` (persisted) via `store.loadTheme`; if persisted overrides exist they are re-applied to the page immediately. The content script **also** applies persisted overrides on its own init, so per-domain tweaks reappear before the panel is opened. Reset: `store.reset()` + `sendMessage('resetOverrides', …, tabId)` + `clearOverrides(origin)`.

## Source of truth — core lib (`src/lib/`)

Do not duplicate these types elsewhere; import them.

- **`tokens.ts`** — `export const TOKENS: TokenDef[]` (34 shadcn tokens). `TokenDef { name; cssVar; label; type: 'color'|'dimension'; group: 'base'|'card'|'primary'|'state'|'border'|'chart'|'sidebar' }`. `ThemeState { light: Record<string,string>; dark: Record<string,string> }` keyed by `cssVar` (e.g. `--primary`). `ThemeMode = 'light'|'dark'`.
- **`messaging.ts`** — typed panel↔content contract via `@webext-core/messaging`. **This is the messaging source of truth.** `ProtocolMap`: `readTokens() → { origin; theme: ThemeState }`, `applyOverrides(theme: Partial<ThemeState>) → void`, `resetOverrides() → void`. Exports `{ sendMessage, onMessage }`. `sendMessage(type, data, tabId)` — pass the active tab id to reach its content script.
- **`css.ts`** — `parseThemeCss(css): ThemeState` (`:root` → light, `.dark` → dark; tolerant), `serializeThemeCss(theme): string`, `toOklch(color)`, `toHex(color)`. Uses `culori`. Handles `oklch(...)`, legacy space-separated HSL channels, and hex.
- **`storage.ts`** — per-origin persistence over `browser.storage.local`, key `kromo:overrides:<origin>`: `loadOverrides`, `saveOverrides`, `clearOverrides`.
- **`theme-store.svelte.ts`** — the panel state store (see below).

## State management

**Rule: panel state is a Svelte 5 runes store created per-panel and injected via context — never a module-level global (DI).**

`createThemeStore(): ThemeStore` builds `$state`-backed state exposed as readonly getters (`origin`, `working`, `baseline`, `mode`, `dirty`) with methods `setMode`, `setToken(mode, cssVar, value)`, `loadTheme(origin, theme)` (sync, side-effect-free), `reset()`, `exportCss()`, `importCss(css)`. Inject/read it with the provided helpers (which wrap `setContext`/`getContext` on `THEME_STORE_KEY`):

```ts
// App.svelte (owner)
const store = setThemeStore(createThemeStore());
// any child component
const store = getThemeStore();
```

Messaging/storage orchestration lives in `App.svelte`, **not** in the store — the store stays pure and testable.

## Sidepanel components (`src/entrypoints/sidepanel/lib/`)

`App.svelte` owns store creation, tab/origin resolution, the mount load sequence, debounced live-apply, and reset/import orchestration. Children (`PanelHeader`, `TokenRow` → `ColorField`, `ExportDialog`, `ImportDialog`) read the store via `getThemeStore()`. Use runes idioms (`$state`/`$derived`/`$props`, `onclick={}`); no `svelte/store`. Never use `window.alert/confirm` (blocks the extension) — reset uses a two-step button.

## Styling — Tailwind v4 (CSS-first)

No `tailwind.config.js`. Tailwind is wired through `@tailwindcss/vite` in `wxt.config.ts` (`vite: () => ({ plugins: [tailwindcss()] })`). Theme tokens live in `src/entrypoints/sidepanel/app.css` via `@import "tailwindcss"`, `@custom-variant dark`, `@theme inline`, and the shadcn `:root` / `.dark` OKLCH token blocks. Style components with utilities (`bg-background`, `text-foreground`, `border-border`, …) so the panel itself looks shadcn-ish; design for ~360px width.

## Color handling

Values are **OKLCH** by default (shadcn/Tailwind-v4 convention). Import accepts hex/HSL/oklch. A color swatch (`<input type="color">`) normalizes through `toOklch()`; the adjacent text field stores whatever the user types verbatim — so an exported sheet may mix formats by design.

## WXT entrypoint conventions

- Files live under `src/entrypoints/`; wrap exports in `defineBackground()` / `defineContentScript()`. The side panel is an HTML entrypoint (`sidepanel/index.html` + `main.ts` mounting `App.svelte`).
- Manifest is configured in `wxt.config.ts`. Current permissions: `storage`, `activeTab`, `scripting`, `sidePanel` (auto-added), `host_permissions: ['<all_urls>']`.
- Firefox is MV2; the `sidePanel` API is Chrome MV3. The Firefox build succeeds but does not surface the side panel — a known gap (add `sidebar_action` later if Firefox parity is needed).

## Testing

Vitest + jsdom. `vitest.config.ts` loads **two** plugins that are both required: `@sveltejs/vite-plugin-svelte` (so `$state` in `*.svelte.ts` compiles) and `WxtVitest()` (so `wxt/browser` resolves to the fake browser). Use `fakeBrowser` from `wxt/testing` with `fakeBrowser.reset()` in `beforeEach` for storage tests. Keep pure lib logic (css round-trip, store transitions) covered; always add a regression test when fixing a bug.

## Commands

```bash
bun run dev            # Chrome dev (load-unpacked .output/chrome-mv3)
bun run dev:firefox    # Firefox dev
bun run build          # Chrome build      · build:firefox for Firefox
bun run zip            # package           · zip:firefox for Firefox
bun run check          # svelte-check (types + Svelte)
bun run test           # vitest run        · test:watch to watch
bun run lint           # eslint            · lint:fix to autofix
bun run format         # prettier --write  · format:check to verify
```

## Guardrails

- Keep the messaging `ProtocolMap`, the `TOKENS` schema, and `ThemeState` as the single sources of truth — when they change, update `content.ts` handlers and the panel together.
- No module-level mutable app state; inject via context.
- No backwards-compat hacks, no `_unused` params, delete dead code (per global guide). Lefthook runs prettier + eslint + `check` pre-commit and commitlint on the message.
