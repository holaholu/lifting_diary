# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, uses `eslint-config-next`)
- No test runner is configured.

## Stack and Next.js version warning

Next.js 16.4.6, React 19.3, Tailwind CSS 4, TypeScript (strict), App Router only (`app/`). Per `AGENTS.md`, this Next.js has breaking changes versus common training data: read the relevant guide in `node_modules/next/dist/docs/` (`01-app/` for App Router) before writing Next.js code, and heed deprecation notices.

## UI standards

Read `docs/ui.md` before writing any UI code. In short: only shadcn/ui components (added via `npx shadcn@latest add <component>`), **no custom components**, and all displayed dates formatted with date-fns (`do MMM yyyy`, e.g. 1st Sep 2025).

## Data fetching standards

Read `docs/data-fetching.md` before writing any data access code. In short: fetch data **only in server components** (never route handlers, client components, or server actions), run all database queries through helper functions in `/data` using the Drizzle query builder (**no raw SQL**), and always scope queries to the `userId` from Clerk's `auth()` so users can only access their own data.

## Auth standards

Read `docs/auth.md` before writing any auth-related code. In short: Clerk is the only auth provider; identify the user only via `auth()` on the server, never from client input.

## Data mutation standards

Read `docs/data-mutations.md` before writing any code that creates, updates, or deletes data. In short: mutations go through helper functions in `/data` (Drizzle, no raw SQL), are triggered only by server actions in colocated `actions.ts` files, are typed with no `FormData`, and validate all arguments with zod.

## Architecture notes

Started from `create-next-app`. Features so far: Clerk auth (`proxy.ts`, sign-in/sign-up routes, user webhook at `app/api/webhooks`), Drizzle + Neon (`db/`, schema in `db/schema.ts`), query helpers in `data/`, and `/dashboard` (`app/dashboard/`: a client page with a date picker that loads that day's workouts through the server action in `actions.ts`). Non-obvious config:

- `next.config.ts` enables `cacheComponents` and `partialPrefetching` plus `experimental.agentFeedback`. `cacheComponents` changes caching/rendering semantics, so check the docs for it before writing data fetching or dynamic APIs.
- Tailwind v4 is wired through Turbopack: `next.config.ts` has a `turbopack.rules` entry that runs `*.css` through `@tailwindcss/turbopack`. Styling uses `@import "tailwindcss"` and an `@theme inline` block in `app/globals.css` (there is no `tailwind.config`). Light/dark colors are CSS variables switched via `prefers-color-scheme`.
- `app/layout.tsx` types its props with the globally available `LayoutProps<"/">` helper (generated route types, no import). Fonts are Geist via `next/font/google`.
- Path alias: `@/*` maps to the project root (not `src/`).
