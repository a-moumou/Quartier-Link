#!/bin/bash
set -uo pipefail

REPORT_DIR=/report
APP_DIR=/app
mkdir -p "$REPORT_DIR/frontend" "$APP_DIR"
RUN_AT="$(date '+%d/%m/%Y %H:%M:%S')"

echo "================================================"
echo " QuartierLink - Test Runner"
echo " $RUN_AT"
echo "================================================"

# Le code source est monté depuis macOS en lecture seule dans /workspace-src.
# On le copie vers /app (volume Docker natif) pour éviter les soucis de
# flock() de composer/npm sur le partage de fichiers virtiofs de Docker Desktop.
echo ""
echo "== Synchronisation du code source =="
rsync -a --delete --exclude vendor --exclude var/cache --exclude .git \
  /workspace-src/backend/ "$APP_DIR/backend/"
rsync -a --delete --exclude node_modules --exclude .git \
  /workspace-src/frontend/ "$APP_DIR/frontend/"
rsync -a --delete /workspace-src/postman/ "$APP_DIR/postman/"

# ── 1. Backend : PHPUnit ──────────────────────────────────────
echo ""
echo "== Backend (PHPUnit) : composer install =="
cd "$APP_DIR/backend"
BACKEND_STATUS="OK"
BACKEND_SUMMARY="composer install a echoue"
if composer install --no-interaction --prefer-dist --quiet; then
  echo "== Backend (PHPUnit) : run =="
  vendor/bin/phpunit \
    --testdox-html "$REPORT_DIR/backend-phpunit.html" \
    --testdox-text "$REPORT_DIR/backend-phpunit.txt" \
    2>&1 | tee "$REPORT_DIR/backend-phpunit.log"
  BACKEND_EXIT=${PIPESTATUS[0]}
  [ "$BACKEND_EXIT" -ne 0 ] && BACKEND_STATUS="FAIL"
  BACKEND_SUMMARY=$(grep -E "OK \(|Tests: [0-9]" "$REPORT_DIR/backend-phpunit.log" | tail -1)
else
  BACKEND_STATUS="FAIL"
  echo "composer install a echoue" | tee "$REPORT_DIR/backend-phpunit.log"
fi

# ── 2. Frontend : Vitest ──────────────────────────────────────
echo ""
echo "== Frontend (Vitest) : npm ci =="
cd "$APP_DIR/frontend"
FRONTEND_STATUS="OK"
FRONTEND_SUMMARY="npm ci a echoue"
if npm ci; then
  echo "== Frontend (Vitest) : run =="
  npx vitest run --reporter=default \
    2>&1 | tee "$REPORT_DIR/frontend-vitest.log"
  FRONTEND_EXIT=${PIPESTATUS[0]}
  [ "$FRONTEND_EXIT" -ne 0 ] && FRONTEND_STATUS="FAIL"
  FRONTEND_SUMMARY=$(grep -E "Tests\s+[0-9]" "$REPORT_DIR/frontend-vitest.log" | tail -1)
  {
    echo "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\">"
    echo "<title>QuartierLink - Vitest</title>"
    echo "<style>body{background:#0f172a;color:#e2e8f0;font-family:ui-monospace,monospace;padding:24px}pre{white-space:pre-wrap}</style>"
    echo "</head><body><pre>"
    sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' "$REPORT_DIR/frontend-vitest.log"
    echo "</pre></body></html>"
  } > "$REPORT_DIR/frontend/index.html"
else
  FRONTEND_STATUS="FAIL"
  echo "npm ci a echoue" | tee "$REPORT_DIR/frontend-vitest.log"
fi

# ── 3. API : Newman / Postman (best-effort, necessite la stack up) ──
echo ""
echo "== API (Newman) : tentative contre http://nginx =="
NEWMAN_STATUS="SKIPPED"
NEWMAN_SUMMARY="Stack applicative non disponible (lancez 'docker compose up -d' au prealable pour l'inclure)"
NEWMAN_LINK=""
if curl -fsS -o /dev/null --max-time 3 http://nginx/api/quartiers 2>/dev/null; then
  newman run "$APP_DIR/postman/collections/QuartierLink_API.json" \
    --env-var base_url=http://nginx \
    -r cli,htmlextra --reporter-htmlextra-export "$REPORT_DIR/newman.html" \
    2>&1 | tee "$REPORT_DIR/newman.log"
  NEWMAN_EXIT=${PIPESTATUS[0]}
  NEWMAN_STATUS=$([ "$NEWMAN_EXIT" -eq 0 ] && echo "OK" || echo "FAIL")
  NEWMAN_SUMMARY=$(grep -E "failures|requests" "$REPORT_DIR/newman.log" | tr '\n' ' ')
  NEWMAN_LINK="newman.html"
else
  echo "Backend injoignable sur le reseau ql_network, etape API ignoree."
fi

# ── 4. Dashboard ───────────────────────────────────────────────
badge() {
  case "$1" in
    OK) echo '<span class="badge ok">OK</span>' ;;
    FAIL) echo '<span class="badge fail">ECHEC</span>' ;;
    *) echo '<span class="badge skip">IGNORE</span>' ;;
  esac
}
link_or_text() {
  if [ -n "$2" ]; then echo "<a href=\"$2\">$1</a>"; else echo "$1"; fi
}

cat > "$REPORT_DIR/index.html" <<HTML
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>QuartierLink - Rapport de tests</title>
<style>
  body { font-family: -apple-system, Segoe UI, sans-serif; background:#0f172a; color:#e2e8f0; margin:0; padding:40px; }
  h1 { color:#22c55e; }
  .meta { color:#94a3b8; margin-bottom:32px; }
  .card { background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px 24px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; }
  .card a { color:#22c55e; text-decoration:none; font-weight:600; }
  .card a:hover { text-decoration:underline; }
  .summary { color:#94a3b8; font-size:14px; margin-top:4px; }
  .badge { padding:4px 12px; border-radius:999px; font-weight:700; font-size:13px; }
  .badge.ok { background:#166534; color:#bbf7d0; }
  .badge.fail { background:#7f1d1d; color:#fecaca; }
  .badge.skip { background:#334155; color:#cbd5e1; }
</style>
</head>
<body>
<h1>QuartierLink — Rapport de tests</h1>
<div class="meta">Généré le $RUN_AT par le conteneur test-runner</div>

<div class="card">
  <div>
    <a href="backend-phpunit.html">Backend — PHPUnit</a>
    <div class="summary">$BACKEND_SUMMARY</div>
  </div>
  $(badge "$BACKEND_STATUS")
</div>

<div class="card">
  <div>
    <a href="frontend/index.html">Frontend — Vitest</a>
    <div class="summary">$FRONTEND_SUMMARY</div>
  </div>
  $(badge "$FRONTEND_STATUS")
</div>

<div class="card">
  <div>
    $(link_or_text "API — Newman / Postman" "$NEWMAN_LINK")
    <div class="summary">$NEWMAN_SUMMARY</div>
  </div>
  $(badge "$NEWMAN_STATUS")
</div>

</body>
</html>
HTML

echo ""
echo "================================================"
echo " Rapport pret : http://localhost:8090"
echo "================================================"

serve "$REPORT_DIR" -l 8090
