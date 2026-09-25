#!/usr/bin/env bash
# One-time repository bootstrap for the Traceli Cloud Agent environment.
# Idempotent: safe to run repeatedly and against cached/snapshotted state.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

# --- Node.js 24 -------------------------------------------------------------
# scripts/agent/register.mjs relies on module.registerHooks (Node >= 22.15 / 24)
# and CI pins Node 24. The Cursor exec-daemon prepends its own older Node to
# PATH; /usr/local/cargo/bin precedes it, so a Node 24 shim placed there wins in
# every agent shell (install, start, terminals, and interactive).
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm install 24 >/dev/null
nvm alias default 24 >/dev/null
NODE24_DIR="$(dirname "$(nvm which 24)")"

SHIM_DIR=/usr/local/cargo/bin
if [ -d "$SHIM_DIR" ] && [ -w "$SHIM_DIR" ]; then
  for bin in node npm npx corepack; do
    ln -sf "$NODE24_DIR/$bin" "$SHIM_DIR/$bin"
  done
else
  # Fall back to a user-writable location on PATH.
  mkdir -p "$HOME/.local/bin"
  for bin in node npm npx corepack; do
    ln -sf "$NODE24_DIR/$bin" "$HOME/.local/bin/$bin"
  done
fi
hash -r || true
corepack enable >/dev/null 2>&1 || true
echo "Node: $(node -v)"

# --- PostgreSQL 16 ----------------------------------------------------------
PGBIN=/usr/lib/postgresql/16/bin
if [ ! -x "$PGBIN/initdb" ]; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq --no-install-recommends postgresql-16 postgresql-client-16
fi

PGDATA="$HOME/traceli-pgdata"
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  "$PGBIN/initdb" -D "$PGDATA" -U postgres --auth=trust >/dev/null
fi

# --- Application dependencies ----------------------------------------------
corepack pnpm install --frozen-lockfile

# --- Local development env file (fictional, non-production loopback DB) ------
# Real WorkOS/database secrets belong only in .env.local or the deployment
# environment; this file only wires up the local demo Postgres cluster.
if [ ! -f .env.local ]; then
  cat > .env.local <<'ENVEOF'
# Local Cloud Agent development environment (non-production, fictional data only).
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/traceli_agent_demo"
DATABASE_URL_UNPOOLED="postgres://postgres:postgres@127.0.0.1:5432/traceli_agent_demo"
TRACELI_SEED_ORGANIZATION_ID="org_traceli_relief"
ENVEOF
  echo "Created .env.local with local demo database configuration."
fi

echo "Traceli install complete."
