# Auth Standards

These rules apply to everything to do with authentication and authorization in this app. No exceptions.

## 1. Clerk is the only auth provider

**This app uses [Clerk](https://clerk.com) for authentication.** Do not add, mix in, or hand-roll any other auth mechanism (no custom sessions, JWTs, cookies, NextAuth, passwords, etc.).

- Use the `@clerk/nextjs` package for everything: `clerkMiddleware`, `auth()`, `<SignIn />`, `<SignUp />`, `<UserButton />`, `<SignedIn>` / `<SignedOut>`.
- Clerk's middleware lives in `proxy.ts` at the project root (this Next.js version uses `proxy.ts`, not `middleware.ts`).
- Sign-in and sign-up pages live in `app/sign-in` and `app/sign-up`.
- Check the Next.js docs in `node_modules/next/dist/docs/` and the Clerk docs/skills before writing auth code; this project uses `cacheComponents`, which affects how `auth()` (a dynamic API) must be used.

## 2. Getting the current user

**The only source of the current user's identity is Clerk's `auth()` on the server.**

```ts
import { auth } from "@clerk/nextjs/server";

const { userId } = await auth();
if (!userId) {
  // not signed in: render nothing / redirect, and do no work
}
```

- Always use `auth()` from `@clerk/nextjs/server` in server components and server actions.
- **Never** trust a user ID from the URL, search params, form input, request bodies, or any other client-controlled value. Only the `userId` from `auth()` may identify the user.
- Do not pass `userId` into a server action as an argument from the client. The action must call `auth()` itself.

## 3. Protecting pages and actions

- Every page that shows user data (e.g. `/dashboard` and everything under it) must be protected. Redirect or return nothing when `userId` is `null`.
- Every server action must call `auth()` first and **stop immediately** if there is no `userId`, before touching any data.
- Route protection in `proxy.ts` is a convenience layer, not the security boundary. **Always** re-check `auth()` where data is read or written.

## 4. Scoping data to the user

- Every `/data` helper that reads or writes user-owned data **must take `userId` as a parameter and filter by it in the query itself** (e.g. `eq(workouts.userId, userId)`).
- When updating or deleting by record ID, include the `userId` condition too, so a guessed ID belonging to another user affects nothing.
- See `docs/data-fetching.md` and `docs/data-mutations.md` for the full rules.

## 5. User records and webhooks

- Local `users` rows are kept in sync with Clerk through the Clerk webhook at `app/api/webhooks`.
- Always verify webhooks with Clerk's `verifyWebhook` before trusting the payload.
- The Clerk user ID (`userId`) is the key that ties all app data to a user.

## 6. UI

- Use Clerk's prebuilt components for auth UI (`<SignIn />`, `<SignUp />`, `<UserButton />`, `<SignedIn>`, `<SignedOut>`). Do not build custom sign-in forms unless explicitly requested.
- All other UI rules still apply (see `docs/ui.md`).
