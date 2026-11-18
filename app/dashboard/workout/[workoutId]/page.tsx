import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getWorkoutById } from "@/data/workouts";
import EditWorkoutForm from "./edit-workout-form";

export default async function EditWorkoutPage({
  params,
}: PageProps<"/dashboard/workout/[workoutId]">) {
  await connection();
  const { userId } = await auth();
  if (!userId) notFound();

  const { workoutId } = await params;
  const id = Number(workoutId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const workout = await getWorkoutById(userId, id);
  if (!workout) notFound();

  return (
    <EditWorkoutForm
      workout={{
        id: workout.id,
        name: workout.name ?? "",
        startedAt: workout.startedAt.toISOString(),
        exercises: workout.exercises.map((e) => ({
          name: e.name,
          sets: e.sets.map((st) => ({
            reps: String(st.reps),
            weightKg: st.weightKg == null ? "" : String(Number(st.weightKg)),
          })),
        })),
      }}
    />
  );
}
