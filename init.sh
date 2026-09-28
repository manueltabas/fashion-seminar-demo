#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
echo "Repository: $(pwd)"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi
# A separate database is required before any migration can run.
demo_database="${DATABASE_URL:-}"
demo_database="${demo_database%%\?*}"
demo_database="${demo_database##*/}"
if [ "$demo_database" != "fashion_seminar_demo" ]; then
  echo "Set DATABASE_URL to a dedicated PostgreSQL database named fashion_seminar_demo."
  echo "Startup stopped before dependency installation or database writes."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Applying demo database migrations..."
npm run db:migrate
npm run db:seed

echo "Running baseline verification..."
npm run lint
npm run typecheck
npm test

echo "Startup command: npm run dev -- --port ${DEMO_PORT:-3001}"
if [ "${RUN_START_COMMAND:-0}" = "1" ]; then
  exec npm run dev -- --port "${DEMO_PORT:-3001}"
fi
