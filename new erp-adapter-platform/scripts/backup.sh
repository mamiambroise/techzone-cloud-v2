#!/bin/bash
set -e

# ============================================================
#   ERP ADAPTER PLATFORM - BACKUP AUTOMATIQUE
#   Phase 5 - Backup & Recovery
# ============================================================

BACKUP_DIR="${BACKUP_DIR:-/backups/erp-adapter}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
DOCKER_BIN="${DOCKER_BIN:-docker}"
COMPOSE_FILE="-f docker-compose.prod.yml"

mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "  ERP ADAPTER PLATFORM - BACKUP"
echo "  Date: $DATE"
echo "=========================================="

# 1. Backup PostgreSQL
echo ""
echo "1. Backup PostgreSQL..."
"$DOCKER_BIN" compose $COMPOSE_FILE exec -T postgres-prod \
  pg_dump -U erp_user erp_adapter_db > "$BACKUP_DIR/erp_db_$DATE.sql"

# 2. Compress
echo ""
echo "2. Compression..."
gzip "$BACKUP_DIR/erp_db_$DATE.sql"

# 3. Supprimer les anciens backups
echo ""
echo "3. Suppression des backups anciens (> $RETENTION_DAYS jours)..."
find "$BACKUP_DIR" -name "erp_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo ""
echo "✅ Backup terminé: $BACKUP_DIR/erp_db_$DATE.sql.gz"