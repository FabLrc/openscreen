# AGENTS.md

## Project overview

OpenScreen — Electron + React + Vite desktop app for screen recording and video editing. PixiJS for rendering, dnd-timeline for the editor timeline.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Lint | `npm run lint` (biome check) |
| Lint + fix | `npm run lint:fix` |
| Format | `npm run format` |
| Typecheck | `npx tsc --noEmit` |
| Unit tests (jsdom) | `npm run test` |
| Unit tests (watch) | `npm run test:watch` |
| Browser tests | `npm run test:browser` |
| Browser test setup | `npm run test:browser:install` |
| E2E tests | `npm run test:e2e` |
| Build (Vite only) | `npm run build-vite` |
| Build (full Electron) | `npm run build` or `npm run build:win`/`build:mac`/`build:linux` |
| i18n key sync check | `npm run i18n:check` |

**CI order**: lint → typecheck → browser tests → vite build. Run all of these before considering work done.

## Architecture

- **`src/`** — React renderer (entry: `src/main.tsx`). Path alias `@/` → `src/`.
  - `components/video-editor/` — main editor UI
  - `components/launch/` — home/launcher screen
  - `components/ui/` — reusable Radix-based UI primitives
  - `hooks/` — React hooks (recorder, camera, mic, undo/redo)
  - `contexts/` — I18nContext, ShortcutsContext
  - `lib/exporter/` — video/GIF export pipeline (frame rendering, muxing, encoding)
  - `lib/` — shared logic (blur, wallpaper, composite layout, shortcuts, etc.)
  - `i18n/locales/` — translation JSONs keyed by locale (`en` is baseline)
- **`electron/`** — Electron main process (entry: `electron/main.ts`). IPC handlers in `electron/ipc/`.
- **`tests/e2e/`** — Playwright E2E specs
- **`public/wallpapers/`** — bundled as `extraResources` → `wallpapers/` under `resourcesPath` (path contract must align with `electron/preload.ts`)

## Key conventions

- **Formatter/linter**: Biome only (no ESLint, no Prettier). Tabs for indent, double quotes, line width 100.
- **CSS is excluded** from Biome lint/format (`!**/*.css`).
- **Node**: v22 (see `.nvmrc`). **npm** only (not pnpm/yarn).
- **Pre-commit hook**: `lint-staged` runs `biome check --no-errors-on-unmatched` on staged `*.{ts,tsx,js,jsx,mts,cts,json}`.
- **Browser test files** must end in `.browser.test.ts` (not just `.test.ts`); they run in Chromium with software WebGL (`--use-gl=swiftshader`).
- **i18n**: all locale files must have identical key structure to `en/`. Run `npm run i18n:check` after editing translations.
- **Build step order matters**: `tsc && vite build && electron-builder`. `tsc` runs first and must pass.
- **Vite renderer plugin** is disabled when `NODE_ENV=test` (see `vite.config.ts` line 20).
