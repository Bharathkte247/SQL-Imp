#!/usr/bin/env bash
# Serve the AutoQRA wireframe locally.
set -euo pipefail
cd "$(dirname "$0")"

PORT="${1:-8765}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required."
  exit 1
fi

echo "AutoQRA wireframe"
echo "  Serving: $(pwd)"
echo "  Open:    http://127.0.0.1:${PORT}/"
echo "  Stop:    Ctrl+C"
echo ""
exec python3 -m http.server "$PORT"
