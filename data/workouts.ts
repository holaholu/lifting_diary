import { and, asc, eq, gte, lt } from "drizzle-orm";
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

/**
 * All of a user's workouts that started in [start, end), with exercises and
 * sets. Always scoped to `userId`.
 */
export async function getWorkoutsForDate(
  userId: string,
  start: Date,
  end: Date,
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
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, start),
        lt(workouts.startedAt, end),
      ),
    )
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
