import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteExerciseAction, deleteWorkoutAction } from "./actions";
import { getWorkoutsForDate } from "@/data/workouts";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  await connection(); // render per request so the current date is never prerendered
  const { userId } = await auth();
  const { date: dateParam } = await searchParams;

  // The selected day is `?date=YYYY-MM-DD`, defaulting to today. Days are UTC days.
  const dateKey =
    typeof dateParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toISOString().slice(0, 10);
  const start = new Date(`${dateKey}T00:00:00Z`);
  // Noon UTC falls on the same calendar day for (almost) every browser timezone.
  const calendarDate = new Date(`${dateKey}T12:00:00Z`);
  const end = new Date(start.getTime() + DAY_MS);
  const [y, m, d] = dateKey.split("-").map(Number);
  const heading = format(new Date(y, m - 1, d), "do MMM yyyy");

  const workouts = userId ? await getWorkoutsForDate(userId, start, end) : null;

  async function selectDate(selected?: Date) {
    "use server";
    if (selected) {
      // `selected` is the browser's local midnight of the clicked day. Adding 12h
      // lands inside that same day in UTC for every timezone from UTC-11 to UTC+12.
      const day = new Date(selected.getTime() + 12 * 60 * 60 * 1000);
      redirect(`/dashboard?date=${day.toISOString().slice(0, 10)}`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="bg-gradient-to-r from-fuchsia-500 to-violet-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
          Dashboard
        </h1>
        <Button
          render={<Link href="/dashboard/workout/new" />}
          nativeButton={false}
        >
          New workout
        </Button>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-primary">{heading}</h2>
          {/* Keyed by the selected day: picking a date redirects, the key changes,
              and the popover remounts closed. */}
          <Popover key={dateKey}>
            <PopoverTrigger
              render={<Button variant="outline" className="font-normal" />}
            >
              <CalendarIcon />
              Change date
            </PopoverTrigger>
            <PopoverContent className="w-auto border-t-4 border-t-cyan-500 p-0">
              <Calendar
                mode="single"
                selected={calendarDate}
                defaultMonth={calendarDate}
                onSelect={selectDate}
              />
            </PopoverContent>
          </Popover>
        </div>

        {workouts === null ? (
          <p className="text-muted-foreground">Sign in to see your workouts.</p>
        ) : workouts.length === 0 ? (
          <p className="text-muted-foreground">
            No workouts logged for this date.
          </p>
        ) : (
          workouts.map((w) => (
            <Card
              key={w.id}
              className="border-l-4 border-l-fuchsia-500 bg-gradient-to-br from-card to-fuchsia-50 dark:to-card"
            >
              <CardHeader>
                <CardTitle>{w.name ?? "Workout"}</CardTitle>
                <CardDescription>
                  {format(w.startedAt, "h:mm a")}
                  {w.completedAt && ` – ${format(w.completedAt, "h:mm a")}`}
                  {w.notes && ` · ${w.notes}`}
                </CardDescription>
                <CardAction className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/dashboard/workout/${w.id}`} />}
                    nativeButton={false}
                  >
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button variant="destructive" size="sm" />}
                    >
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete {w.name ?? "this workout"}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently deletes the workout along with all its
                          exercises and sets. This can&apos;t be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <form
                          action={async () => {
                            "use server";
                            await deleteWorkoutAction({ workoutId: w.id });
                          }}
                        >
                          <AlertDialogAction type="submit" variant="destructive">
                            Delete workout
                          </AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3">
                {w.exercises.map((ex) => (
                  <div key={ex.id}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-violet-600 dark:text-violet-300">
                        {ex.name}
                      </h3>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${ex.name}`}
                            />
                          }
                        >
                          <Trash2 />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {ex.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes {ex.name} and all its sets from this
                              workout. This can&apos;t be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <form
                              action={async () => {
                                "use server";
                                await deleteExerciseAction({
                                  workoutExerciseId: ex.id,
                                });
                              }}
                            >
                              <AlertDialogAction type="submit" variant="destructive">
                                Delete
                              </AlertDialogAction>
                            </form>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {ex.sets.map((s) => (
                      <p key={s.id} className="text-sm text-muted-foreground">
                        Set {s.setNumber}: {s.reps} reps
                        {s.weightKg != null && ` × ${Number(s.weightKg)} kg`}
                      </p>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </main>
  );
}
