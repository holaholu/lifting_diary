import { and, asc, eq, gte, inArray, isNull, lt, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { exercises, sets, workoutExercises, workouts } from "@/db/schema";

export type WorkoutWithExercises = {
  id: number;
  name: string | null;
  startedAt: Date;
  completedAt: Date | null;
  notes: string | null;
  exercises: {
    id: number;
    name: string;
    notes: string | null;
    sets: { id: number; setNumber: number; reps: number; weightKg: string | null }[];
  }[];
};

async function selectWorkoutsWithExercises(
  where: SQL | undefined,
): Promise<WorkoutWithExercises[]> {
  const rows = await db
    .select({
      workout: workouts,
      workoutExerciseId: workoutExercises.id,
      exerciseName: exercises.name,
      exerciseNotes: workoutExercises.notes,
      set: sets,
    })
    .from(workouts)
    .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .leftJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(where)
    .orderBy(
      asc(workouts.startedAt),
      asc(workoutExercises.position),
      asc(sets.setNumber),
    );

  const result = new Map<number, WorkoutWithExercises>();
  for (const r of rows) {
    let w = result.get(r.workout.id);
    if (!w) {
      w = {
        id: r.workout.id,
        name: r.workout.name,
        startedAt: r.workout.startedAt,
        completedAt: r.workout.completedAt,
        notes: r.workout.notes,
        exercises: [],
      };
      result.set(w.id, w);
    }
    if (r.workoutExerciseId == null) continue;
    let ex = w.exercises.find((e) => e.id === r.workoutExerciseId);
    if (!ex) {
      ex = {
        id: r.workoutExerciseId,
        name: r.exerciseName!,
        notes: r.exerciseNotes,
        sets: [],
      };
      w.exercises.push(ex);
    }
    if (r.set) {
      ex.sets.push({
        id: r.set.id,
        setNumber: r.set.setNumber,
        reps: r.set.reps,
        weightKg: r.set.weightKg,
      });
    }
  }
  return [...result.values()];
}

/**
 * All of a user's workouts that started in [start, end), with exercises and
 * sets. Always scoped to `userId`.
 */
export async function getWorkoutsForDate(
  userId: string,
  start: Date,
  end: Date,
): Promise<WorkoutWithExercises[]> {
  return selectWorkoutsWithExercises(
    and(
      eq(workouts.userId, userId),
      gte(workouts.startedAt, start),
      lt(workouts.startedAt, end),
    ),
  );
}

/** Creates a workout owned by `userId`. */
export async function createWorkout(
  userId: string,
  input: { name: string; startedAt?: Date; notes?: string },
) {
  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name: input.name,
      notes: input.notes,
      ...(input.startedAt && { startedAt: input.startedAt }),
    })
    .returning();
  return workout;
}

/** A single workout (with exercises and sets) owned by `userId`, or null. */
export async function getWorkoutById(
  userId: string,
  workoutId: number,
): Promise<WorkoutWithExercises | null> {
  const [workout] = await selectWorkoutsWithExercises(
    and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  );
  return workout ?? null;
}

export type WorkoutExerciseInput = {
  name: string;
  sets: { reps: number; weightKg: number | null }[];
};

/**
 * Updates a workout owned by `userId` and replaces its exercises and sets with
 * `exercises`. Returns null if the workout doesn't exist or isn't theirs.
 */
export async function updateWorkout(
  userId: string,
  workoutId: number,
  input: { name: string; startedAt: Date; exercises: WorkoutExerciseInput[] },
) {
  // 1. Update the workout itself, scoped to the user. Nothing else is touched
  //    unless this matches a row.
  const [workout] = await db
    .update(workouts)
    .set({ name: input.name, startedAt: input.startedAt })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();
  if (!workout) return null;

  // 2. Resolve exercise names to catalog rows (built-in or the user's own),
  //    creating the user's own for names that don't exist yet.
  const names = [...new Set(input.exercises.map((e) => e.name))];
  const exerciseIds = new Map<string, number>();
  if (names.length > 0) {
    const existing = await db
      .select({ id: exercises.id, name: exercises.name })
      .from(exercises)
      .where(
        and(
          inArray(exercises.name, names),
          or(eq(exercises.userId, userId), isNull(exercises.userId)),
        ),
      );
    for (const e of existing) exerciseIds.set(e.name, e.id);

    const missing = names.filter((n) => !exerciseIds.has(n));
    if (missing.length > 0) {
      const created = await db
        .insert(exercises)
        .values(missing.map((name) => ({ userId, name })))
        .returning({ id: exercises.id, name: exercises.name });
      for (const e of created) exerciseIds.set(e.name, e.id);
    }
  }

  // 3. Replace the workout's exercises (sets cascade) in one atomic batch.
  const rows = input.exercises.map((e, i) => ({
    workoutId,
    exerciseId: exerciseIds.get(e.name)!,
    position: i + 1,
  }));
  const clear = db
    .delete(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));
  if (rows.length === 0) {
    await clear;
    return workout;
  }
  const [, inserted] = await db.batch([
    clear,
    db.insert(workoutExercises).values(rows).returning(),
  ]);

  // 4. Insert the sets for the new workout exercises.
  const setRows = inserted.flatMap((we) =>
    input.exercises[we.position - 1].sets.map((s, j) => ({
      workoutExerciseId: we.id,
      setNumber: j + 1,
      reps: s.reps,
      weightKg: s.weightKg == null ? null : String(s.weightKg),
    })),
  );
  if (setRows.length > 0) await db.insert(sets).values(setRows);

  return workout;
}

/**
 * Deletes one exercise (and, by cascade, its sets) from a workout. Only
 * matches if the workout belongs to `userId`. Returns whether a row was deleted.
 */
export async function deleteWorkoutExercise(userId: string, workoutExerciseId: number) {
  const deleted = await db
    .delete(workoutExercises)
    .where(
      and(
        eq(workoutExercises.id, workoutExerciseId),
        inArray(
          workoutExercises.workoutId,
          db.select({ id: workouts.id }).from(workouts).where(eq(workouts.userId, userId)),
        ),
      ),
    )
    .returning({ id: workoutExercises.id });
  return deleted.length > 0;
}

/**
 * Deletes a workout owned by `userId` (its exercises and sets cascade).
 * Returns whether a row was deleted.
 */
export async function deleteWorkout(userId: string, workoutId: number) {
  const deleted = await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning({ id: workouts.id });
  return deleted.length > 0;
}
