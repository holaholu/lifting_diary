# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, uses `eslint-config-next`)
- No test runner is configured.

## Stack and Next.js version warning

Next.js 16.4.6, React 19.3, Tailwind CSS 4, TypeScript (strict), App Router only (`app/`). Per `AGENTS.md`, this Next.js has breaking changes versus common training data: read the relevant guide in `node_modules/next/dist/docs/` (`01-app/` for App Router) before writing Next.js code, and heed deprecation notices.

## Architecture notes

The project is a fresh `create-next-app` scaffold (`app/layout.tsx`, `app/page.tsx`, `app/globals.css`); no app features exist yet. Non-obvious config:

- `next.config.ts` enables `cacheComponents` and `partialPrefetching` plus `experimental.agentFeedback`. `cacheComponents` changes caching/rendering semantics, so check the docs for it before writing data fetching or dynamic APIs.
- Tailwind v4 is wired through Turbopack: `next.config.ts` has a `turbopack.rules` entry that runs `*.css` through `@tailwindcss/turbopack`. Styling uses `@import "tailwindcss"` and an `@theme inline` block in `app/globals.css` (there is no `tailwind.config`). Light/dark colors are CSS variables switched via `prefers-color-scheme`.
- `app/layout.tsx` types its props with the globally available `LayoutProps<"/">` helper (generated route types, no import). Fonts are Geist via `next/font/google`.
- Path alias: `@/*` maps to the project root (not `src/`).
