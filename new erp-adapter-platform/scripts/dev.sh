#!/usr/bin/env bash
# ============================================================
#   ERP ADAPTER PLATFORM - LANCEMENT COMBINE (AUTH AIM + ERP)
#   Lance ensemble :
#     1. Backend  (Auth AIM + IAM + ERP adapter) sur :3002
#     2. Frontend (ERP console)                     sur :3003
#     3. Verifie Dolibarr                           sur :8080
#   Arret propre avec Ctrl+C (ou ./scripts/stop.sh)
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
PID_DIR="$ROOT/.run"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[dev.sh]${NC} $*"; }
ok()    { echo -e "${GREEN}[dev.sh]${NC} $*"; }
warn()  { echo -e "${YELLOW}[dev.sh]${NC} $*"; }
err()   { echo -e "${RED}[dev.sh]${NC} $*"; }

NODE_BIN="${NODE_BIN:-node}"
NPM_BIN="${NPM_BIN:-npm}"

if ! command -v "$NODE_BIN" >/dev/null 2>&1; then
  err "node introuvable dans PATH. Ajoutez le binaire (ex : export PATH=\$HOME/.nvm/versions/node/v24.14.0/bin:\$PATH)"
  exit 1
fi
if ! command -v "$NPM_BIN" >/dev/null 2>&1; then
  err "npm introuvable dans PATH."
  exit 1
fi

mkdir -p "$PID_DIR"
BACKEND_PID="$PID_DIR/backend.pid"
FRONTEND_PID="$PID_DIR/frontend.pid"

# --------------------------------------------
# Verifications prealables
# --------------------------------------------
[ -f "$BACKEND_DIR/.env" ] || { err "backend/.env manquant. Copiez .env.example -> .env puis renseignez les valeurs."; exit 1; }
[ -f "$FRONTEND_DIR/.env" ] || { err "frontend/.env manquant. Ouvrez-le et verifiez REACT_APP_API_URL."; exit 1; }

if [ -f "$BACKEND_PID" ] && kill -0 "$(cat "$BACKEND_PID")" 2>/dev/null; then
  err "Backend deja lance (PID $(cat "$BACKEND_PID")). Arretez-le d'abord via ./scripts/stop.sh"
  exit 1
fi
if [ -f "$FRONTEND_PID" ] && kill -0 "$(cat "$FRONTEND_PID")" 2>/dev/null; then
  err "Frontend deja lance (PID $(cat "$FRONTEND_PID")). Arretez-le d'abord via ./scripts/stop.sh"
  exit 1
fi

# node_modules presents ?
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  info "Installation des dependances backend..."
  (cd "$BACKEND_DIR" && "$NPM_BIN" install)
fi
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  info "Installation des dependances frontend..."
  (cd "$FRONTEND_DIR" && "$NPM_BIN" install)
fi

# Build backend si absent (requis pour node dist/src/main.js)
if [ ! -f "$BACKEND_DIR/dist/src/main.js" ]; then
  info "Build du backend (nest build)..."
  (cd "$BACKEND_DIR" && "$NPM_BIN" run build)
fi

# --------------------------------------------
# Lancement
# --------------------------------------------
info "Demarrage du backend (Auth AIM + ERP adapter) sur :3002..."
(cd "$BACKEND_DIR" && "$NODE_BIN" --env-file=.env dist/src/main.js \
  >> "$ROOT/.run/backend.log" 2>&1) &
echo $! > "$BACKEND_PID"
ok "Backend demarre (PID $(cat "$BACKEND_PID")), logs: .run/backend.log"

info "Demarrage du frontend (ERP console) sur :3003..."
(cd "$FRONTEND_DIR" && PORT=3003 "$NPM_BIN" start \
  >> "$ROOT/.run/frontend.log" 2>&1) &
echo $! > "$FRONTEND_PID"
ok "Frontend demarre (PID $(cat "$FRONTEND_PID")), logs: .run/frontend.log"

# --------------------------------------------
# Sante - attendre que les services repondent
# --------------------------------------------
echo
info "Attente de la disponibilite des services..."
BACKEND_OK=0; FRONTEND_OK=0
for i in $(seq 1 60); do
  if [ "$BACKEND_OK" -eq 0 ]; then
    if curl -sf "http://localhost:3002/api/erp/health?erp=MOCK" >/dev/null 2>&1; then
      BACKEND_OK=1; ok "Backend pret sur http://localhost:3002"
    fi
  fi
  if [ "$FRONTEND_OK" -eq 0 ]; then
    if curl -sf "http://localhost:3003/" >/dev/null 2>&1; then
      FRONTEND_OK=1; ok "Frontend pret sur http://localhost:3003"
    fi
  fi
  [ "$BACKEND_OK" -eq 1 ] && [ "$FRONTEND_OK" -eq 1 ] && break
  sleep 1
done

if [ "$BACKEND_OK" -ne 1 ] || [ "$FRONTEND_OK" -ne 1 ]; then
  err "Un service n'a pas demarre a temps. Consultez les logs dans .run/."
  "$ROOT/scripts/stop.sh" || true
  exit 1
fi

# --------------------------------------------
# Verifier l'adapter actif
# --------------------------------------------
MODE=$(curl -s "http://localhost:3002/api/erp/health?erp=MOCK" 2>/dev/null | grep -o '"mode":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
DOLI=$(curl -s "http://localhost:3002/api/erp/health?erp=DOLIBARR" 2>/dev/null | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
if [ "$DOLI" = "HEALTHY" ]; then
  ok "Dolibarr (adapter DOLIBARR) : HEALTHY"
else
  warn "Dolibarr (adapter DOLIBARR) : $DOLI ou injoignable - l'UI affichera les donnees du mode ${MODE:-MOCK}"
  warn "-> Verifiez que Dolibarr repond sur http://127.0.0.1:8080"
fi

echo
cat <<EOF
${GREEN}============================================================${NC}
${GREEN}  ERP PLATEFORME PRETE${NC}
${GREEN}============================================================${NC}
  Connexion : http://localhost:3003
    - admin / AdminTechCloud2026!
    - superadmin / bc4de49f20cdfefa
  Backend API + Swagger : http://localhost:3002/api (docs: /api/docs)
  Dolibarr : http://127.0.0.1:8080
${YELLOW}  Appuyez sur Ctrl+C pour arreter les deux services ensemble.${NC}
${GREEN}============================================================${NC}
EOF

# --------------------------------------------
# Arret propre sur Ctrl+C
# --------------------------------------------
cleanup() {
  echo
  warn "Arret des services..."
  "$ROOT/scripts/stop.sh" || true
  exit 0
}
trap cleanup INT TERM

# Attend les deux services en arriere-plan. Interrompu par Ctrl+C
# (SIGINT sur tout le groupe => les enfants meurent, wait revient,
# le trap cleanup stoppe proprement et libere les ports).
set +e
wait