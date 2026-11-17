# Data Fetching Standards

These rules apply to every piece of data fetching in this app. No exceptions.

## 1. Server components only

**ALL data fetching must happen in server components.**

- Do **NOT** fetch data in route handlers (`app/**/route.ts`).
- Do **NOT** fetch data in client components (`"use client"`), whether with `useEffect`, `fetch`, SWR, React Query, or anything else.
- Do **NOT** fetch data in server actions, or any other way. Server components are the only allowed path.

If a page needs interactivity (for example, a date picker that changes what is shown), the server component reads the state (e.g. from `searchParams`), fetches the data, and passes plain results down to the UI. It does not move the fetching into the client.

```tsx
// app/dashboard/page.tsx (server component)
import { auth } from "@clerk/nextjs/server";
import { getWorkoutsForDate } from "@/data/workouts";

export default async function Page({ searchParams }: PageProps<"/dashboard">) {
  const { userId } = await auth();
  if (!userId) return null;

  const { date } = await searchParams;
  const workouts = await getWorkoutsForDate(userId, /* parsed date */);
  // render workouts with shadcn components (see docs/ui.md)
}
```

Check the Next.js docs in `node_modules/next/dist/docs/` first: this project uses `cacheComponents`, which affects how dynamic data (`auth()`, `searchParams`) must be wrapped in `<Suspense>`.

## 2. Database queries live in `/data` helper functions

- **Every database query must be done through a helper function in the `/data` directory** (e.g. `data/workouts.ts`).
- Server components call these helpers. They never query `db` directly, and neither does any other code outside `/data`.
- One file per domain (`workouts.ts`, `exercises.ts`, ...); each helper does one job and returns plain typed data.

## 3. Drizzle ORM only: NO raw SQL

- Helpers **must** use the Drizzle ORM query builder (`db.select()`, `db.query`, etc.) with Drizzle operators (`eq`, `and`, `gte`, `lt`, `inArray`, ...).
- **DO NOT USE RAW SQL.** No `sql\`...\`` template fragments, no `db.execute(...)`, no hand-written query strings.
- If something seems to need raw SQL (e.g. filtering by day), express it with Drizzle operators instead. For a day filter, compute the start and end of the day as `Date` values and use `gte(workouts.startedAt, start)` and `lt(workouts.startedAt, end)`.

## 4. Users can only access their own data

**A logged-in user must only ever be able to read their own data, and never anyone else's.** This is the most important rule in this document.

- Get the user from Clerk's `auth()` on the server (`const { userId } = await auth()`). If there is no `userId`, return nothing and fetch nothing.
- **Never** take a user ID from the URL, search params, form input, or any other client-controlled value. Only the `userId` from `auth()` may be used.
- Every `/data` helper that reads user-owned data **must take `userId` as a parameter and filter by it** (e.g. `eq(workouts.userId, userId)`) in the query itself. Filtering after the fact in JS does not count.
- Child records (workout exercises, sets) must be reached through a join or filter that is scoped to the user's own parent rows. Never look up child rows by ID alone.
- When fetching a single record by ID, include the `userId` condition as well, so a guessed ID belonging to another user returns nothing.

```ts
// data/workouts.ts
export async function getWorkoutsForDate(userId: string, start: Date, end: Date) {
  return db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId), // always scope to the user
        gte(workouts.startedAt, start),
        lt(workouts.startedAt, end),
      ),
    );
}
```
