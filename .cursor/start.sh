#!/usr/bin/env bash
# Run the development server from the single dev terminal.
# Never initialize, migrate or seed a database during environment startup.
set -euo pipefail

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

exec corepack pnpm dev
