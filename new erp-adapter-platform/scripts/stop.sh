#!/usr/bin/env bash
# ============================================================
#   ERP ADAPTER PLATFORM - ARRET COMBINE
#   Stoppe backend + frontend lances par ./scripts/dev.sh
# ============================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT/.run"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
warn()  { echo -e "${YELLOW}[stop.sh]${NC} $*"; }
ok()    { echo -e "${GREEN}[stop.sh]${NC} $*"; }

stop_pid() {
  local file="$1" name="$2"
  if [ -f "$file" ]; then
    local pid
    pid="$(cat "$file")"
    if kill -0 "$pid" 2>/dev/null; then
      warn "Arret de $name (PID $pid)..."
      kill "$pid" 2>/dev/null
      # grace de 5s puis SIGKILL
      for _ in $(seq 1 5); do
        kill -0 "$pid" 2>/dev/null || break
        sleep 1
      done
      if kill -0 "$pid" 2>/dev/null; then
        warn "$name ne repond pas, force (SIGKILL)..."
        kill -9 "$pid" 2>/dev/null
      else
        ok "$name arrete."
      fi
    else
      warn "$name : processus deja termine (PID $pid)."
    fi
    rm -f "$file"
  else
    warn "$name : aucun PID enregistre (.run/${name}.pid absent)."
  fi
}

stop_pid "$PID_DIR/backend.pid"  "backend"
stop_pid "$PID_DIR/frontend.pid" "frontend"

# Liberer les ports occupes par les services (memes si demarres hors dev.sh)
free_port() {
  local port="$1" name="$2"
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    pid=$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN)
    warn "$name encore actif sur le port $port (PID $pid) - arret..."
    kill "$pid" 2>/dev/null || true
  fi
}

free_port 3002 "backend"
free_port 3003 "frontend"

ok "Arret termine."