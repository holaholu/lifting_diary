"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { updateWorkout } from "@/data/workouts";

const updateWorkoutSchema = z.object({
  workoutId: z.number().int().positive(),
  name: z.string().trim().min(1, "Name is required").max(255),
  startedAt: z.coerce.date(),
  notes: z.string().trim().max(2000).optional(),
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

  const { workoutId, name, startedAt, notes } = parsed.data;
  const workout = await updateWorkout(userId, workoutId, {
    name,
    startedAt,
    notes: notes || null,
  });
  if (!workout) {
    return { success: false, error: "Workout not found" };
  }
  return { success: true, startedAt: workout.startedAt };
}
