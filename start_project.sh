#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
APP_PORT="${APP_PORT:-3001}"

if [[ ! -f "$FRONTEND_DIR/.env" ]]; then
  cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
  echo "Created frontend/.env from .env.example"
fi

if grep -q "<SUPABASE_PROJECT_REF>" "$FRONTEND_DIR/.env" || grep -q "<SUPABASE_ANON_KEY>" "$FRONTEND_DIR/.env" || grep -q "<SUPABASE_SERVICE_ROLE_KEY>" "$FRONTEND_DIR/.env"; then
  echo "Please update frontend/.env with real Supabase credentials before running."
  exit 1
fi

required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_URL"
)

for var_name in "${required_vars[@]}"; do
  if ! grep -Eq "^${var_name}=.+" "$FRONTEND_DIR/.env"; then
    echo "Missing required env var in frontend/.env: ${var_name}"
    exit 1
  fi
done

NODE_MAJOR="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if [[ "${NODE_MAJOR}" -lt 20 ]]; then
  echo "Detected Node $(node -v). Upgrade to Node 20+ to avoid runtime issues with Supabase SDK."
  echo "Continuing, but this version is unsupported by several dependencies."
fi

pushd "$FRONTEND_DIR" >/dev/null
export NODE_OPTIONS="${NODE_OPTIONS:-} --dns-result-order=ipv4first"
export NEXT_PUBLIC_API_URL="/api"
npm install
npm run db:init
npm run db:seed

cleanup() {
  if [[ -n "${FRONTEND_PID:-}" ]]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

npm run dev -- --port "$APP_PORT" &
FRONTEND_PID=$!
popd >/dev/null

echo "DentalOS started"
echo "Frontend + API: http://localhost:${APP_PORT}"

wait "$FRONTEND_PID"
