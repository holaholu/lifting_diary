"""Bar chart of workouts per month for the past 12 months, exported as a PNG."""

import argparse
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


def load_database_url() -> str:
    """DATABASE_URL from the environment, else .env, else .env.local (cwd)."""
    if os.environ.get("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    for name in (".env", ".env.local"):
        path = Path(name)
        if not path.is_file():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            if key.strip().removeprefix("export ").strip() == "DATABASE_URL":
                return value.strip().strip("'\"")
    sys.exit("DATABASE_URL not found in the environment, .env or .env.local")


def month_starts(now: datetime, count: int = 12) -> list[tuple[int, int]]:
    """(year, month) for the last `count` calendar months, oldest first."""
    months = []
    y, m = now.year, now.month
    for _ in range(count):
        months.append((y, m))
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return months[::-1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="workouts-per-month.png")
    parser.add_argument("--user-id", default=None, help="limit to one Clerk user ID")
    args = parser.parse_args()

    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import psycopg

    now = datetime.now(timezone.utc)
    months = month_starts(now)
    first_y, first_m = months[0]
    window_start = datetime(first_y, first_m, 1, tzinfo=timezone.utc)

    query = "SELECT started_at FROM workouts WHERE started_at >= %s"
    params: list = [window_start]
    if args.user_id:
        query += " AND user_id = %s"
        params.append(args.user_id)

    with psycopg.connect(load_database_url()) as conn:
        conn.read_only = True
        rows = conn.execute(query, params).fetchall()

    counts = Counter(
        (r[0].astimezone(timezone.utc).year, r[0].astimezone(timezone.utc).month)
        for r in rows
    )
    values = [counts.get(ym, 0) for ym in months]
    labels = [datetime(y, m, 1).strftime("%b %Y") for y, m in months]

    fig, ax = plt.subplots(figsize=(11, 5.5))
    bars = ax.bar(labels, values, color="#8b5cf6")
    ax.bar_label(bars, padding=3)
    ax.set_xlabel("Month")
    ax.set_ylabel("Number of workouts")
    ax.set_title("Workouts per month (past 12 months)")
    ax.yaxis.get_major_locator().set_params(integer=True)
    ax.set_ylim(0, max(values + [1]) * 1.15)
    ax.spines[["top", "right"]].set_visible(False)
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right")
    fig.tight_layout()

    out = Path(args.out).resolve()
    fig.savefig(out, dpi=150)

    print(f"{len(rows)} workouts in the past year")
    for label, value in zip(labels, values):
        print(f"  {label}: {value}")
    print(f"Saved chart to {out}")


if __name__ == "__main__":
    main()
