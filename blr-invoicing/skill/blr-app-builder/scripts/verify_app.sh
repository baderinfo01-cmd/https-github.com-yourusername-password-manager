#!/usr/bin/env bash
# One-shot QA of an app made from the template.
#   bash verify_app.sh <app-dir> [--e2e] [--shots <dir>]
# Copies nothing: it runs in <app-dir>. node_modules/ out/ .next/ are git-ignored there (never commit them).
# Steps: npm install (skip with SKIP_INSTALL=1) -> typecheck -> node tests -> next build -> [--e2e] browser flow + Electron flow (xvfb).
set -euo pipefail
APP="${1:?usage: verify_app.sh <app-dir> [--e2e] [--shots dir]}"; shift || true
E2E=0; SHOTS=""
while [ $# -gt 0 ]; do case "$1" in --e2e) E2E=1;; --shots) SHOTS="$2"; shift;; esac; shift; done
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP"
SHOTS="${SHOTS:-$(cd .. && pwd)/e2e-shots}"
step() { printf '\n=== %s ===\n' "$*"; }

node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a<22||(a===22&&b<13)){console.error("Node >= 22.13 required for node:sqlite, found "+process.version);process.exit(1)}'
if [ "${SKIP_INSTALL:-0}" != "1" ]; then step "npm install"; npm install --no-audit --no-fund; fi
step "typecheck"; npm run typecheck
step "node tests (db, calc, license, dictionary)"; npm test
step "next build (static export -> out/)"; npm run build
step "license doctor (config sanity; network failures are only warnings here)"; npm run license:doctor || echo "(doctor reported problems - fix before release)"
if [ "$E2E" = "1" ]; then
  step "browser e2e (Playwright vs out/)"; node "$HERE/e2e_browser.cjs" --app "$APP" --shots "$SHOTS/browser"
  step "electron e2e (xvfb)"
  if command -v xvfb-run >/dev/null 2>&1; then xvfb-run -a node "$HERE/e2e_electron.cjs" --app "$APP" --shots "$SHOTS/electron"
  elif [ -n "${DISPLAY:-}" ]; then node "$HERE/e2e_electron.cjs" --app "$APP" --shots "$SHOTS/electron"
  else echo "no xvfb-run and no DISPLAY: skipped (install xvfb: apt-get install -y xvfb)"; fi
fi
step "DONE - all requested checks passed"
