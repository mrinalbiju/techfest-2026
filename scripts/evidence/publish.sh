#!/usr/bin/env bash
# Commits ./evidence to the record-evidence branch (kept separate from the app code)
set -euo pipefail
MSG=$1
PUB="${RUNNER_TEMP:-/tmp}/publish"
git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"

if git ls-remote --exit-code origin record-evidence > /dev/null 2>&1; then
  git fetch origin record-evidence
  git worktree add "$PUB" origin/record-evidence
  (cd "$PUB" && git checkout -B record-evidence)
else
  git worktree add --detach "$PUB"
  (cd "$PUB" && git checkout --orphan record-evidence && git rm -rqf .)
fi

cp -r evidence/. "$PUB/"
cd "$PUB"
git add -A
git commit -m "Evidence: $MSG" || echo "nothing new"
git push origin record-evidence
