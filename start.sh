#!/usr/bin/env bash
# One-click start: installs dependencies on first run, builds the web app,
# starts the server, and opens the browser.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -d node_modules ]; then
  echo "WealthAdvisor — installation des dépendances (première exécution)…"
  npm install
fi

npm start
