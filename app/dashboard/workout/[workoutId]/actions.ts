"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { updateWorkout } from "@/data/workouts";

const updateWorkoutSchema = z.object({
  workoutId: z.number().int().positive(),
  name: z.string().trim().min(1, "Name is required").max(255),
  startedAt: z.coerce.date(),
  exercises: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Every exercise needs a name").max(255),
        sets: z
          .array(
            z.object({
              reps: z
                .number("Reps must be a number")
                .int("Reps must be a whole number")
                .min(1, "Reps must be at least 1")
                .max(1000),
              weightKg: z
                .number("Weight must be a number")
                .min(0, "Weight can't be negative")
                .max(10000)
                .nullable(),
            }),
          )
          .max(50),
      }),
    )
    .max(50),
});

export type UpdateWorkoutInput = z.input<typeof updateWorkoutSchema>;

export type UpdateWorkoutResult =
  | { success: true; startedAt: Date }
  | { success: false; error: string };

export async function updateWorkoutAction(
  input: UpdateWorkoutInput,
): Promise<UpdateWorkoutResult> {
  const parsed = updateWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const { workoutId, ...data } = parsed.data;
  const workout = await updateWorkout(userId, workoutId, data);
  if (!workout) {
    return { success: false, error: "Workout not found" };
  }
  return { success: true, startedAt: workout.startedAt };
}
