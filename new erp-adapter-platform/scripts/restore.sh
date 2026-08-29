#!/bin/bash
set -e

# ============================================================
#   ERP ADAPTER PLATFORM - RESTORE
#   Phase 5 - Backup & Recovery
# ============================================================

BACKUP_DIR="${BACKUP_DIR:-/backups/erp-adapter}"
DOCKER_BIN="${DOCKER_BIN:-docker}"

echo "=========================================="
echo "  ERP ADAPTER PLATFORM - RESTORE"
echo "=========================================="

# Lister les backups disponibles
echo ""
echo "Backups disponibles:"
ls -lh "$BACKUP_DIR"/*.sql.gz

# Demander le fichier a restaurer
echo ""
read -r -p "Entrez le nom du fichier a restaurer: " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "❌ Fichier non trouvé: $BACKUP_DIR/$BACKUP_FILE"
    exit 1
fi

# Confirmation
read -r -p "⚠️  Cette action ECRASE la base actuelle. Continuer ? (oui/non): " CONFIRM
if [ "$CONFIRM" != "oui" ]; then
    echo "Restauration annulée."
    exit 0
fi

# Restaurer
echo ""
echo "Restauration en cours..."
gunzip -c "$BACKUP_DIR/$BACKUP_FILE" | \
  "$DOCKER_BIN" compose -f docker-compose.prod.yml exec -T postgres-prod \
  psql -U erp_user erp_adapter_db

echo ""
echo "✅ Restauration terminée"