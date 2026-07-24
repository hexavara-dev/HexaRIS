#!/usr/bin/env bash
# Claude Code PreToolUse(Bash) guard: block git commit/push to `main`.
# Reads the hook JSON on stdin; exit 2 blocks the tool call and returns the
# message (stderr) to Claude. Mirrors the Lefthook pre-push guard for Claude
# sessions. See CONTRIBUTING.md.
set -uo pipefail

input=$(cat)

if command -v jq >/dev/null 2>&1; then
  cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
else
  cmd=$input
fi

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

deny() {
  echo "$1" >&2
  exit 2
}

# On main: block commits and pushes.
if [ "$branch" = "main" ] && printf '%s' "$cmd" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+(commit|push)([[:space:]]|$)'; then
  deny "Blocked: you are on 'main'. Create a feature branch and open a PR (squash-merge). See CONTRIBUTING.md."
fi

# Any explicit push that targets main.
if printf '%s' "$cmd" | grep -qE 'git[[:space:]]+push[[:space:]].*\bmain\b'; then
  deny "Blocked: direct push to main. Open a PR and squash-merge instead. See CONTRIBUTING.md."
fi

exit 0
