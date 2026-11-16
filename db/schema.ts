import {
  index,
  integer,
  numeric,
  snakeCase,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/**
 * Users are managed by Clerk. The primary key is the Clerk user ID
 * (e.g. "user_2abc..."), so rows here are created/synced from Clerk.
 */
export const users = snakeCase.table("users", {
  id: text().primaryKey(), // Clerk user ID
  email: varchar({ length: 255 }),
  ...timestamps,
});

/**
 * Exercise catalog: one row per exercise type ("Bench Press"), shared across
 * all workouts. userId is null for built-in exercises and set to the Clerk
 * user ID for custom ones.
 */
export const exercises = snakeCase.table(
  "exercises",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text().references(() => users.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    muscleGroup: varchar({ length: 100 }),
    ...timestamps,
  },
  (t) => [unique("exercises_user_name_unique").on(t.userId, t.name).nullsNotDistinct()],
);

/** A single training session. userId is the Clerk user ID. */
export const workouts = snakeCase.table(
  "workouts",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp({ withTimezone: true }),
    notes: text(),
    ...timestamps,
  },
  (t) => [index("workouts_user_started_idx").on(t.userId, t.startedAt)],
);

/** An exercise performed within a workout (join between workouts and exercises). */
export const workoutExercises = snakeCase.table(
  "workout_exercises",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    workoutId: integer()
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: integer()
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    position: integer().notNull(), // order within the workout
    notes: text(),
  },
  (t) => [
    unique("workout_exercises_workout_position_unique").on(t.workoutId, t.position),
    index("workout_exercises_exercise_idx").on(t.exerciseId),
  ],
);

/** An individual set of a workout exercise. Weight is always stored in kg. */
export const sets = snakeCase.table(
  "sets",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    workoutExerciseId: integer()
      .notNull()
      .references(() => workoutExercises.id, { onDelete: "cascade" }),
    setNumber: integer().notNull(),
    reps: integer().notNull(),
    weightKg: numeric({ precision: 7, scale: 2 }),
    rpe: numeric({ precision: 3, scale: 1 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("sets_workout_exercise_number_unique").on(t.workoutExerciseId, t.setNumber)],
);

export type User = typeof users.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type WorkoutSet = typeof sets.$inferSelect;
