#!/usr/bin/env bash
set -e

# Wait for Postgres (if DATABASE_URL points to postgres)
function wait_for_db() {
  echo "Waiting for database..."
  # try a simple python connect loop
  python - <<PY
import os
import time
from urllib.parse import urlparse
url = os.getenv('DATABASE_URL', '')
if not url:
    print('No DATABASE_URL, skipping wait')
    raise SystemExit
parsed = urlparse(url)
if parsed.scheme.startswith('postgres'):
    import socket
    host = parsed.hostname or 'db'
    port = parsed.port or 5432
    for _ in range(60):
        try:
            s=socket.create_connection((host, port), timeout=1)
            s.close(); print('Database reachable'); raise SystemExit
        except Exception:
            time.sleep(1)
    print('Timed out waiting for database')
    raise SystemExit(1)
else:
    print('Not a postgres database, skipping wait')
    raise SystemExit
PY
}

wait_for_db || true

# Run alembic migrations (only if DATABASE_URL points to Postgres)
if [ -f "/app/alembic.ini" ] && [ -n "$DATABASE_URL" ]; then
    case "$DATABASE_URL" in
        postgres*|postgresql*)
            echo "Running alembic upgrade head"
            alembic upgrade head
            ;;
        *)
            echo "DATABASE_URL is not Postgres; skipping alembic"
            ;;
    esac
fi

echo "Starting uvicorn"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
