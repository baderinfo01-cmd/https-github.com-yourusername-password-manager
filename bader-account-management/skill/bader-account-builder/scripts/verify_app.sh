#!/usr/bin/env bash
# One-shot QA of an app made from the template.
#   bash verify_app.sh <app-dir> [--e2e] [--shots <dir>]
# Runs in <app-dir> (node_modules/ out/ .next/ dist/ are git-ignored there: never commit them).
# Steps: node version -> npm ci|install (skip with SKIP_INSTALL=1) -> static check -> typecheck -> node tests
#        -> next build (static export) -> licence doctor -> [--e2e] browser flow + Electron flow (xvfb).
# NOT covered (needs Windows): the NSIS installer, the packaged .exe, real activation against the dashboard, printers.
set -euo pipefail
APP="${1:?usage: verify_app.sh <app-dir> [--e2e] [--shots dir]}"; shift || true
E2E=0; SHOTS=""
while [ $# -gt 0 ]; do case "$1" in --e2e) E2E=1;; --shots) SHOTS="$2"; shift;; esac; shift; done
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP"
APP="$(pwd)"
SHOTS="${SHOTS:-$(cd .. && pwd)/e2e-shots}"
step() { printf '\n=== %s ===\n' "$*"; }

node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a<22||(a===22&&b<6)){console.error("Node >= 22.6 required (strip-types tests), 22.13+ recommended, found "+process.version);process.exit(1)}'
if [ "${SKIP_INSTALL:-0}" != "1" ]; then
  step "npm install"
  if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
fi
step "static check (placeholders, product id, .gitignore, message parity)"; python3 "$HERE/new_app.py" --check "$APP"
step "typecheck"; npm run typecheck
step "node tests (vault crypto, audit/AI privacy, i18n parity, licence)"; npm test
step "next build (static export -> out/)"; npm run build
step "licence doctor (needs internet; problems here are warnings)"; npm run license:doctor || echo "(doctor reported problems - fix before release: dashboard product / public key / server_url)"
if [ "$E2E" = "1" ]; then
  step "browser e2e (Playwright vs out/)"; node "$HERE/e2e_browser.cjs" --app "$APP" --shots "$SHOTS/browser" ${EXTRA:+--extra "$EXTRA"}
  step "electron e2e (xvfb)"
  if command -v xvfb-run >/dev/null 2>&1; then xvfb-run -a node "$HERE/e2e_electron.cjs" --app "$APP" --shots "$SHOTS/electron"
  elif [ -n "${DISPLAY:-}" ]; then node "$HERE/e2e_electron.cjs" --app "$APP" --shots "$SHOTS/electron"
  else echo "no xvfb-run and no DISPLAY: skipped (apt-get install -y xvfb)"; fi
fi
step "DONE - all requested checks passed (Windows installer + real activation still need a manual test)"
