#!/usr/bin/env bash
# Hook: refuse to treat work as done if SPEC or tests were skipped.
# Wire this as a Cursor/Claude stop hook or local pre-commit helper.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

fail() {
  echo "[hook] $1" >&2
  exit 1
}

[[ -f SPEC.md ]] || fail "SPEC.md missing — write the spec first."
[[ -f CLAUDE.md ]] || fail "CLAUDE.md missing — agent contract required."

if ! grep -q "Acceptance criteria" SPEC.md; then
  fail "SPEC.md must contain Acceptance criteria."
fi

if ! grep -q "Test plan" SPEC.md; then
  fail "SPEC.md must contain a Test plan section."
fi

npm run ci || fail "CI harness failed — fix tests before shipping agent output."

echo "[hook] Spec + harness OK."
