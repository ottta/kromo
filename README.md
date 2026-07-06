# Kromo

**Live shadcn/ui theme editor — on any real page, not a sandbox.**

Kromo is a Chrome/Firefox browser extension that lets you edit shadcn/ui CSS theme tokens directly on the **real active tab** and watch the page restyle live. Tweak colours and dimensions across all 34 shadcn tokens — in both light and dark mode — then export the result as a clean CSS block you paste into your CMS admin, stylesheet, or `globals.css`.

Because it operates on the live page instead of an iframe preview, you theme your _actual_ site — with its real content, components, and layout — and your per-domain tweaks persist and reappear automatically on your next visit.

## How it works

The side-panel editor drives a content script that injects a `<style>` override layer (`:root` / `.dark`, `!important`) onto the page, so every edit is reflected instantly. Values are OKLCH by default (the Tailwind v4 / shadcn convention), and import accepts hex, HSL, or OKLCH.

## Built with

Bun · WXT · Svelte 5 (runes) · Tailwind v4 (CSS-first) · TypeScript.

## Credits

Heavily inspired by [tweakcn](https://tweakcn.com). Kromo borrows tweakcn's shadcn theme-editing workflow — the key difference is that Kromo edits the **real** active tab rather than an isolated iframe preview, so you can theme any live site in place and export the tokens.
