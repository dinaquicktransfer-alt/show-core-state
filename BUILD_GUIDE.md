# Build Guide — Enneagram Event Platform

This document explains how to build, run, and extend the platform.

## Requirements
- Node.js 20+
- Bun (recommended) or npm/pnpm
- Any modern browser (Chromium-based recommended for host + presentation multi-window)

## Install & Run
```sh
bun install
bun run dev       # http://localhost:5173 (Vite)
```

Routes:
- `/` — landing page
- `/host` — host control panel
- `/presentation` — audience screen (open in a second window/tab)

The two routes stay in sync via `localStorage` + `BroadcastChannel`; no server required.

## Build
```sh
bun run build     # TanStack Start production build
bun run preview   # preview the production build
```

## Project Layout
See `PROJECT_ARCHITECTURE.md` for the module map. In short:
- `src/routes/` — file-based routes (TanStack Router)
- `src/lib/enneagram.ts` — type catalog + validation
- `src/lib/event-store.ts` — Zustand store, chemistry engine, exports
- `src/lib/source-bundle.ts` — Ownership Center source packaging

## Extending
- **New Enneagram content**: edit `src/lib/enneagram.ts` (`ENNEAGRAM` map).
- **New scoring rule**: edit `showWinner` in `src/lib/event-store.ts`.
- **New chemistry metric**: extend `computeChemistry` in `src/lib/event-store.ts`.
- **New export format**: add a `bundleTo<Format>` in `src/lib/event-store.ts` and a tab in `ExportPanel` in `src/routes/host.tsx`.
- **New presentation screen**: add a `Screen` value in the store and a component in `src/routes/presentation.tsx`.

## Portability
The app has no Lovable-specific runtime dependency. To take it out:
1. Push to GitHub (see `INSTALLATION.md`).
2. `bun install && bun run dev` locally, in VS Code, or in StackBlitz.
3. Deploy anywhere that supports Vite/TanStack Start (Cloudflare, Vercel, Netlify, Node).
