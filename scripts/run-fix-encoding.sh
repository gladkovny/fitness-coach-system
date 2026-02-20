#!/bin/sh
# Wrapper для git filter-branch: запускает fix-git-commit-encoding.js из корня репозитория.
# Вызывать по абсолютному пути, чтобы $0 давал корень (git меняет CWD на .git-rewrite/t).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
exec node "$ROOT/scripts/fix-git-commit-encoding.js"
