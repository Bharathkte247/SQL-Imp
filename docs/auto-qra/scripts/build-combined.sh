#!/usr/bin/env bash
# Concatenate Auto QRA design package into a single markdown file for Word/PDF export.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/Auto-QRA-Design-Package-Combined.md}"

{
  cat <<'HDR'
# Auto Quality Review Automation (Auto QRA)
## Complete Product and Technical Design Package

**Version:** 1.0  
**Classification:** Internal — Confidential  
**Date:** July 2026  
**Audience:** Executive Leadership, Product, Engineering, AI/ML, DevOps, Security, Infrastructure

---

HDR
  echo ""
  cat "$ROOT/00-document-control.md"
  echo -e "\n\n---\n"
  cat "$ROOT/README.md"
  echo -e "\n\n---\n"
  for f in \
    "$ROOT/01-executive-and-business.md" \
    "$ROOT/02-requirements-personas-flows.md" \
    "$ROOT/03-solution-architecture-ai.md" \
    "$ROOT/04-ops-security-capacity.md" \
    "$ROOT/05-devops-apis-governance.md"
  do
    echo -e "\n\n---\n"
    cat "$f"
  done
} > "$OUT"

WORDS=$(wc -w < "$OUT" | tr -d ' ')
PAGES_350=$(python3 -c "print(round($WORDS/350))")
PAGES_400=$(python3 -c "print(round($WORDS/400))")
echo "Wrote: $OUT"
echo "Words: $WORDS"
echo "Estimated Word pages (@350 wpp): ~$PAGES_350"
echo "Estimated Word pages (@400 wpp): ~$PAGES_400"
