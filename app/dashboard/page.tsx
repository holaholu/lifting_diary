import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button render={<Link href="/dashboard/workout/new" />} nativeButton={false}>
          New workout
        </Button>
      </div>

      <div className="grid items-start gap-8 md:grid-cols-[auto_1fr]">
        <Card className="w-fit">
          <CardContent>
            <Calendar
              mode="single"
              selected={calendarDate}
              defaultMonth={calendarDate}
              onSelect={selectDate}
            />
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">{heading}</h2>

          {workouts === null ? (
            <p className="text-muted-foreground">Sign in to see your workouts.</p>
          ) : workouts.length === 0 ? (
            <p className="text-muted-foreground">
              No workouts logged for this date.
            </p>
          ) : (
            workouts.map((w) => (
              <Card key={w.id}>
                <CardHeader>
                  <CardTitle>{w.name ?? "Workout"}</CardTitle>
                  <CardDescription>
                    {format(w.startedAt, "h:mm a")}
                    {w.completedAt && ` – ${format(w.completedAt, "h:mm a")}`}
                    {w.notes && ` · ${w.notes}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {w.exercises.map((ex) => (
                    <div key={ex.id}>
                      <h3 className="text-sm font-medium">{ex.name}</h3>
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
      </div>
    </main>
  );
}
