"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  startedAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type CreateWorkoutInput = z.input<typeof createWorkoutSchema>;

export type CreateWorkoutResult =
  | { success: true; workoutId: number; startedAt: Date }
  | { success: false; error: string };

export async function createWorkoutAction(
  input: CreateWorkoutInput,
): Promise<CreateWorkoutResult> {
  const parsed = createWorkoutSchema.safeParse(input);
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

  const workout = await createWorkout(userId, parsed.data);
  return { success: true, workoutId: workout.id, startedAt: workout.startedAt };
}
