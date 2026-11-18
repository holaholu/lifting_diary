---
name: workouts-chart
description: Query the Lifting Diary database for the past year of workouts and export a bar chart image (x = month, y = number of workouts). Use when the user asks for a workouts-per-month chart, a yearly workout summary, or a graph/plot/image of their workout history.
---

# workouts-chart

Counts workouts per month for the last 12 calendar months (including the
current month; months with no workouts show as 0) and saves a bar chart PNG.

## Run

```bash
.claude/skills/workouts-chart/run.sh [--out PATH] [--user-id CLERK_USER_ID]
```

Run it from the project root. Defaults:

- `--out`: `workouts-per-month.png` in the project root.
- `--user-id`: omitted = all workouts in the database. Pass a Clerk user ID
  (e.g. `user_2abc...`) to chart a single user.

The first run creates `.claude/skills/workouts-chart/.venv` and installs
`matplotlib` and `psycopg[binary]` (needs `python3` and network access).

## How it works

- `scripts/chart.py` reads `DATABASE_URL` from `.env`, falling back to
  `.env.local` (this project keeps it in `.env.local`), or from the
  `DATABASE_URL` environment variable if already set.
- It opens a **read-only** connection and runs a single `SELECT` on
  `workouts.started_at`. Months are bucketed in UTC, matching how the app's
  dashboard groups days.
- Never print, log or echo the connection string. The script only reports the
  row count, the per-month counts and the output path.

## After running

Tell the user the output path and the per-month counts it printed. If the
script fails with a missing `DATABASE_URL` or a connection error, report that
message as-is and don't guess at credentials.
