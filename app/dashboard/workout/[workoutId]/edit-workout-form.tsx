"use client";

import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { updateWorkoutAction } from "./actions";

type SetState = { reps: string; weightKg: string };
type ExerciseState = { name: string; sets: SetState[] };

export default function EditWorkoutForm({
  workout,
}: {
  workout: {
    id: number;
    name: string;
    startedAt: string;
    exercises: ExerciseState[];
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initial = new Date(workout.startedAt);
  const [name, setName] = useState(workout.name);
  const [date, setDate] = useState<Date>(initial);
  const [time, setTime] = useState(format(initial, "HH:mm"));
  const [exercises, setExercises] = useState<ExerciseState[]>(workout.exercises);
  const [error, setError] = useState<string | null>(null);

  function updateExercise(i: number, patch: Partial<ExerciseState>) {
    setExercises((prev) => prev.map((ex, k) => (k === i ? { ...ex, ...patch } : ex)));
  }

  function updateSet(i: number, j: number, patch: Partial<SetState>) {
    setExercises((prev) =>
      prev.map((ex, k) =>
        k === i
          ? { ...ex, sets: ex.sets.map((st, l) => (l === j ? { ...st, ...patch } : st)) }
          : ex,
      ),
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Combine the picked day and time (browser local time).
    const startedAt = new Date(date);
    const [h, m] = time.split(":").map(Number);
    startedAt.setHours(h || 0, m || 0, 0, 0);

    startTransition(async () => {
      const result = await updateWorkoutAction({
        workoutId: workout.id,
        name,
        startedAt,
        exercises: exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets.map((st) => ({
            reps: Number(st.reps),
            weightKg: st.weightKg.trim() === "" ? null : Number(st.weightKg),
          })),
        })),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      // The dashboard groups workouts by UTC day.
      router.push(`/dashboard?date=${result.startedAt.toISOString().slice(0, 10)}`);
    });
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <Card className="border-t-4 border-t-violet-500">
        <CardHeader>
          <CardTitle className="text-primary">Edit workout</CardTitle>
          <CardDescription>Update the details of this workout.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={255}
                  required
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Date</FieldLabel>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button variant="outline" className="justify-start font-normal" />
                      }
                    >
                      <CalendarIcon />
                      {format(date, "do MMM yyyy")}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        defaultMonth={date}
                        onSelect={(d) => d && setDate(d)}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field>
                  <FieldLabel htmlFor="time">Start time</FieldLabel>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Exercises</FieldLabel>
                <div className="space-y-4">
                  {exercises.map((ex, i) => (
                    <div
                      key={i}
                      className="space-y-2 rounded-lg border border-primary/20 bg-muted/50 p-3"
                    >
                      <div className="flex gap-2">
                        <Input
                          aria-label={`Exercise ${i + 1} name`}
                          value={ex.name}
                          onChange={(e) => updateExercise(i, { name: e.target.value })}
                          placeholder="Exercise (e.g. Squats)"
                          maxLength={255}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove exercise ${i + 1}`}
                          onClick={() =>
                            setExercises((prev) => prev.filter((_, k) => k !== i))
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>

                      {ex.sets.map((st, j) => (
                        <div key={j} className="flex items-center gap-2 pl-4">
                          <span className="w-12 shrink-0 text-sm text-muted-foreground">
                            Set {j + 1}
                          </span>
                          <Input
                            aria-label={`Exercise ${i + 1} set ${j + 1} reps`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step={1}
                            placeholder="Reps"
                            value={st.reps}
                            onChange={(e) => updateSet(i, j, { reps: e.target.value })}
                            required
                          />
                          <Input
                            aria-label={`Exercise ${i + 1} set ${j + 1} weight in kg`}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            placeholder="kg"
                            value={st.weightKg}
                            onChange={(e) =>
                              updateSet(i, j, { weightKg: e.target.value })
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove set ${j + 1} of exercise ${i + 1}`}
                            onClick={() =>
                              updateExercise(i, {
                                sets: ex.sets.filter((_, l) => l !== j),
                              })
                            }
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="ml-4"
                        onClick={() =>
                          updateExercise(i, {
                            // New sets start from the previous set's values.
                            sets: [
                              ...ex.sets,
                              ex.sets.at(-1) ?? { reps: "", weightKg: "" },
                            ],
                          })
                        }
                      >
                        <Plus /> Add set
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setExercises((prev) => [
                        ...prev,
                        { name: "", sets: [{ reps: "", weightKg: "" }] },
                      ])
                    }
                  >
                    <Plus /> Add exercise
                  </Button>
                </div>
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
