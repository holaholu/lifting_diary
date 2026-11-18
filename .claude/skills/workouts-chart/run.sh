#!/usr/bin/env bash
# Runs scripts/chart.py inside a private virtualenv, creating it on first use.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
venv="$here/.venv"

if [ ! -x "$venv/bin/python" ]; then
  echo "Setting up virtualenv (first run)..." >&2
  python3 -m venv "$venv"
  "$venv/bin/python" -m pip install --quiet --upgrade pip
  "$venv/bin/python" -m pip install --quiet matplotlib "psycopg[binary]"
fi

exec "$venv/bin/python" "$here/scripts/chart.py" "$@"
