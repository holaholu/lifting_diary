import Link from "next/link";
import { CalendarDays, Dumbbell, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-12 px-6 py-16 text-center">
      <div className="space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Lift. Log.{" "}
          <span className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
            Level up.
          </span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Your training diary, made fun. Record every workout, revisit any day,
          and watch your strength grow.
        </p>
        <Button size="lg" render={<Link href="/dashboard" />} nativeButton={false}>
          Open my dashboard
        </Button>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-3">
        <Card className="border-t-4 border-t-fuchsia-500 bg-fuchsia-50 dark:bg-card">
          <CardHeader className="items-center text-center">
            <Dumbbell className="size-8 text-fuchsia-500" />
            <CardTitle>Log workouts</CardTitle>
            <CardDescription>Name them, time them, add notes.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-t-4 border-t-cyan-500 bg-cyan-50 dark:bg-card">
          <CardHeader className="items-center text-center">
            <CalendarDays className="size-8 text-cyan-500" />
            <CardTitle>Browse by day</CardTitle>
            <CardDescription>Pick any date to see what you did.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-t-4 border-t-amber-400 bg-amber-50 dark:bg-card">
          <CardHeader className="items-center text-center">
            <TrendingUp className="size-8 text-amber-500" />
            <CardTitle>Track progress</CardTitle>
            <CardDescription>Sets, reps and weights in one place.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
