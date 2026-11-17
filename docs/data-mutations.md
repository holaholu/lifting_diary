# Data Mutations Standards

These rules apply to every data mutation (insert, update, delete) in this app. No exceptions.

## 1. Mutations live in `/data` helper functions

- **ALL data mutations MUST be done through helper functions in the `/data` directory** (e.g. `data/workouts.ts`), which wrap database calls made with Drizzle ORM.
- Server actions and everything else outside `/data` **never** call `db` directly.
- One file per domain (`workouts.ts`, `exercises.ts`, ...); each helper does one job and returns plain typed data.
- **Drizzle ORM only: NO raw SQL.** No `sql\`...\`` fragments, no `db.execute(...)`. Use `db.insert()`, `db.update()`, `db.delete()` with Drizzle operators (`eq`, `and`, ...).
- Every helper that mutates user-owned data **must take `userId` as a parameter and scope the write to it** (see section 5).

```ts
// data/workouts.ts
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workouts } from "@/db/schema";

export async function createWorkout(userId: string, input: { name: string; startedAt: Date }) {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, name: input.name, startedAt: input.startedAt })
    .returning();
  return workout;
}

export async function deleteWorkout(userId: string, workoutId: number) {
  await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

## 2. Mutations are done via server actions

- **ALL data mutations MUST be done via server actions.** Not route handlers, not client-side calls, not server components.
- Server actions live in **colocated files named `actions.ts`**, next to the route that uses them (e.g. `app/dashboard/actions.ts`, `app/dashboard/workout/new/actions.ts`).
- Every `actions.ts` file starts with `"use server"`.
- Server actions only mutate. Reading data is done in server components (see `docs/data-fetching.md`).

## 3. Server actions must be typed, and must NOT use `FormData`

- Every server action has explicit TypeScript types for its parameters and return value.
- **Do NOT use the `FormData` type** for action parameters. Pass a typed object (or typed arguments) instead.
- Client components call the action with plain typed data, e.g. `await createWorkoutAction({ name, startedAt })`.

## 4. Every server action MUST validate its arguments with Zod

- **ALL server actions MUST validate the arguments passed to them with [zod](https://zod.dev).** Types alone are not enough: server actions are public endpoints and the client can send anything.
- Define a schema per action, derive the parameter type from it with `z.infer`, and parse **before** doing anything else with the data.
- Use `safeParse` and return a typed error result on failure, rather than throwing raw validation errors to the client.
- Dates passed from the client should be validated with `z.coerce.date()` (or an ISO string schema) and converted before use.

## 5. Auth and ownership inside every action

Order of operations in every server action:

1. **Validate** the arguments with zod.
2. **Authenticate** with Clerk: `const { userId } = await auth()`. If there is no `userId`, return an unauthorized error and stop.
3. **Mutate** by calling a `/data` helper, passing the `userId` from `auth()`.

- **Never** accept a user ID as an action argument. Only the `userId` from `auth()` may be used (see `docs/auth.md`).
- Update and delete helpers must include the `userId` condition in the query itself, so a guessed ID belonging to another user affects nothing.

## 6. Example

```ts
// app/dashboard/workout/new/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  startedAt: z.coerce.date(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

type CreateWorkoutResult =
  | { success: true; workoutId: number }
  | { success: false; error: string };

export async function createWorkoutAction(
  input: CreateWorkoutInput,
): Promise<CreateWorkoutResult> {
  const parsed = createWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const workout = await createWorkout(userId, parsed.data);
  return { success: true, workoutId: workout.id };
}
```
