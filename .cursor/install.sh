#!/usr/bin/env bash
# Install the runtime and dependencies for the Traceli Cloud Agent environment.
# Database setup is an explicit, separate task; existing env files are preserved.
set -euo pipefail

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

# --- Application dependencies ----------------------------------------------
corepack pnpm install --frozen-lockfile

echo "Traceli dependencies installed. Database setup is not part of cloud startup."
