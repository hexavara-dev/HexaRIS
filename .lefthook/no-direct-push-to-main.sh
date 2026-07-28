#!/bin/sh
# Blocks `git push` while on main. Lives in its own file (rather than an inline
# `run:` string in lefthook.yml) because lefthook on Windows has trouble parsing
# `$(...)` command substitution embedded directly in a YAML `run:` value.
git rev-parse --abbrev-ref HEAD | grep -qx main
if [ $? -eq 0 ]; then
    echo "ERROR: Direct pushes to main are blocked. Use a feature branch + PR (squash-merge)."
    exit 1
fi
exit 0
