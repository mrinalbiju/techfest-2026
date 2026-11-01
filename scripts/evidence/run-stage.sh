#!/usr/bin/env bash
# Starts a copy of the portal at a given commit and runs the security demo against it.
#   run-stage.sh <stage> <git-ref>
set -euo pipefail
STAGE=$1
REF=$2
ROOT=$(git rev-parse --show-toplevel)
DIR="${RUNNER_TEMP:-/tmp}/portal-$STAGE"

git worktree add --force "$DIR" "$REF"
(cd "$DIR/server" && npm ci --no-audit --no-fund --silent)
(cd "$DIR/client" && npm ci --no-audit --no-fund --silent)

export MONGO_URI="mongodb://localhost:27017/techfest_demo_$STAGE"
export JWT_SECRET="demo-only-secret" PORT=5000 CLIENT_URL="http://localhost:5173"
export ADMIN_EMAIL="admin@techfest.local" ADMIN_PASSWORD="Admin@123" NODE_ENV=development

(cd "$DIR/server" && node seed.js)
(cd "$DIR/server" && nohup node server.js > "$DIR/server.log" 2>&1 &)
(cd "$DIR/client" && nohup npx vite --port 5173 --strictPort > "$DIR/vite.log" 2>&1 &)

for i in $(seq 1 60); do
  curl -sf http://localhost:5000/api/health > /dev/null && curl -sf http://localhost:5173 > /dev/null && break
  sleep 1
done

node "$ROOT/scripts/evidence/security-demo.mjs" "$STAGE"

pkill -f "node server.js" || true
pkill -f "vite --port 5173" || true
sleep 2
