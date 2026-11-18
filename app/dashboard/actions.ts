"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteWorkout, deleteWorkoutExercise } from "@/data/workouts";

const deleteExerciseSchema = z.object({
  workoutExerciseId: z.number().int().positive(),
});

export type DeleteExerciseInput = z.input<typeof deleteExerciseSchema>;

export type DeleteExerciseResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteExerciseAction(
  input: DeleteExerciseInput,
): Promise<DeleteExerciseResult> {
  const parsed = deleteExerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const deleted = await deleteWorkoutExercise(userId, parsed.data.workoutExerciseId);
  if (!deleted) {
    return { success: false, error: "Exercise not found" };
  }
  revalidatePath("/dashboard");
  return { success: true };
}

const deleteWorkoutSchema = z.object({
  workoutId: z.number().int().positive(),
});

export type DeleteWorkoutInput = z.input<typeof deleteWorkoutSchema>;

export type DeleteWorkoutResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteWorkoutAction(
  input: DeleteWorkoutInput,
): Promise<DeleteWorkoutResult> {
  const parsed = deleteWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const deleted = await deleteWorkout(userId, parsed.data.workoutId);
  if (!deleted) {
    return { success: false, error: "Workout not found" };
  }
  revalidatePath("/dashboard");
  return { success: true };
}
