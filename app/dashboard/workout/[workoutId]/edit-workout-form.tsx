"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { updateWorkoutAction } from "./actions";

export default function EditWorkoutForm({
  workout,
}: {
  workout: { id: number; name: string; startedAt: string; notes: string };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initial = new Date(workout.startedAt);
  const [name, setName] = useState(workout.name);
  const [date, setDate] = useState<Date>(initial);
  const [time, setTime] = useState(format(initial, "HH:mm"));
  const [notes, setNotes] = useState(workout.notes);
  const [error, setError] = useState<string | null>(null);

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
        notes,
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
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={2000}
                />
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
