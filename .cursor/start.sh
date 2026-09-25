#!/usr/bin/env bash
# Per-boot runtime reconciliation for the Traceli Cloud Agent environment.
# Brings the local Postgres cluster up and keeps schema + fictional seed in sync
# with the checked-out revision. Idempotent and safe across restarts.
set -euo pipefail

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

PGBIN=/usr/lib/postgresql/16/bin
PGDATA="$HOME/traceli-pgdata"

# Start PostgreSQL only if it is not already running.
if ! "$PGBIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
  # Clear a stale lock left by a previous (now-dead) postmaster.
  rm -f "$PGDATA/postmaster.pid"
  "$PGBIN/pg_ctl" -D "$PGDATA" -l /tmp/traceli-pg.log \
    -o "-p 5432 -k /tmp -c listen_addresses=127.0.0.1" -w start
fi

# Wait until the server accepts connections.
for _ in $(seq 1 30); do
  if "$PGBIN/pg_isready" -h 127.0.0.1 -p 5432 -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Ensure the login password and application database exist.
export PGHOST=/tmp
"$PGBIN/psql" -p 5432 -U postgres -tc "ALTER USER postgres WITH PASSWORD 'postgres';" >/dev/null
if ! "$PGBIN/psql" -p 5432 -U postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname='traceli_agent_demo'" | grep -q 1; then
  "$PGBIN/psql" -p 5432 -U postgres -c "CREATE DATABASE traceli_agent_demo;" >/dev/null
fi
unset PGHOST

# Apply migrations and refresh the fictional demo seed (both idempotent).
corepack pnpm db:migrate
corepack pnpm db:seed >/dev/null

echo "Traceli environment ready: Postgres up, schema migrated, fictional tenants seeded."
