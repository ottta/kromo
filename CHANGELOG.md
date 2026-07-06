# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Extension scaffold with WXT + Svelte 5 + Tailwind CSS v4
- Side panel UI for live-editing shadcn/ui CSS theme tokens
- Content script to inject live CSS variable overrides onto pages
- Background service worker to open side panel on toolbar icon click
- Typed messaging contract for panel ↔ content script communication
- shadcn token schema (colors, spacing, radius, chart tokens, sidebar tokens)
- Per-domain persistence of theme tweaks in `chrome.storage.local`
- Live preview of token changes on the active tab
- Export CSS as `:root{...}` and `.dark{...}` blocks
- Import CSS from existing theme files
- Reset functionality to revert all Kromo changes
- OKLCH ↔ HSL/hex color conversion utilities
- TypeScript strict mode + Svelte type checking
- Support for Chrome and Firefox

[Unreleased]: https://github.com/unforma-club/kromo/compare/v0.0.0...HEAD
