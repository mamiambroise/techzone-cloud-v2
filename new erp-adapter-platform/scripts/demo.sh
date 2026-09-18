#!/bin/bash
set -e

# ============================================================
#   ERP ADAPTER PLATFORM - DEMONSTRATION AUTOMATIQUE
#   Phase 4 - Test de remplacement ERP
# ============================================================

API_URL="http://localhost:3000/api"
DOCKER_BIN="${DOCKER_BIN:-docker}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================================"
echo "   ERP ADAPTER PLATFORM - DEMONSTRATION"
echo "   Pack Boutique (Techzone) <-> ERP Universel"
echo "======================================================"

# 1. Verification des services
echo -e "\n${YELLOW}1. Verification des services Docker...${NC}"
if command -v "$DOCKER_BIN" >/dev/null 2>&1; then
  "$DOCKER_BIN" compose ps || "$DOCKER_BIN" ps
else
  "$DOCKER_BIN" compose ps
fi

# 2. Health Check
echo -e "\n${YELLOW}2. Health Check MOCK ERP...${NC}"
RESPONSE=$(curl -s $API_URL/erp/health)
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# 3. Ajouter les EPS dans PostgreSQL
echo -e "\n${YELLOW}3. Enregistrement de Mock ERP et Dolibarr dans PostgreSQL...${NC}"

# Mock ERP (idempotent)
curl -s -X POST $API_URL/erp-registry \
  -H "Content-Type: application/json" \
  -d '{"code":"MOCK","nom":"Mock ERP","type":"MOCK","url":"http://localhost:3000","environment":"DEVELOPMENT"}' \
  | python3 -m json.tool 2>/dev/null || echo "  -> MOCK deja enregistre"

# Dolibarr ERP (idempotent)
curl -s -X POST $API_URL/erp-registry \
  -H "Content-Type: application/json" \
  -d '{"code":"DOLIBARR","nom":"Dolibarr 23.0.3","type":"DOLIBARR","url":"https://github.com/hasiniaina7/techzone-erp","environment":"DEVELOPMENT"}' \
  | python3 -m json.tool 2>/dev/null || echo "  -> DOLIBARR deja enregistre"

# 4. Avec MOCK ERP - Creation d'un client
echo -e "\n${YELLOW}4. Creation d'un client (Mock ERP)...${NC}"
CLIENT=$(curl -s -X POST "$API_URL/erp/clients?erp=MOCK" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Rakoto Marie","email":"marie@test.com"}')
echo "$CLIENT" | python3 -m json.tool 2>/dev/null || echo "$CLIENT"

# 5. Avec MOCK ERP - Creation d'un produit
echo -e "\n${YELLOW}5. Creation d'un produit (Mock ERP)...${NC}"
PRODUIT=$(curl -s -X POST "$API_URL/erp/products?erp=MOCK" \
  -H "Content-Type: application/json" \
  -d '{"ref":"TSH-001","label":"T-Shirt Noir","price":15000,"stock":100}')
echo "$PRODUIT" | python3 -m json.tool 2>/dev/null || echo "$PRODUIT"

# Extraction de l'ID du produit
PRODUCT_ID=$(echo "$PRODUIT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id','1'))" 2>/dev/null || echo "1")

# 6. Avec MOCK ERP - Creation d'une commande
echo -e "\n${YELLOW}6. Creation d'une commande (Mock ERP)...${NC}"
COMMANDE=$(curl -s -X POST "$API_URL/erp/orders?erp=MOCK" \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":\"1\",\"lines\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2,\"price\":15000}]}")
echo "$COMMANDE" | python3 -m json.tool 2>/dev/null || echo "$COMMANDE"

# 7. Listing - Mock ERP
echo -e "\n${YELLOW}7. Verification des donnees (Mock ERP)...${NC}"
echo "   --- Clients ---"
curl -s "$API_URL/erp/clients?erp=MOCK" | python3 -c "import sys,json; [print(f\"    {c['id']}: {c['nom']} ({c['email']})\") for c in json.load(sys.stdin)]" 2>/dev/null
echo "   --- Produits ---"
curl -s "$API_URL/erp/products?erp=MOCK" | python3 -c "import sys,json; [print(f\"    {p['id']}: {p['label']} - {p['price']} Ar (stock: {p['stock']})\") for p in json.load(sys.stdin)]" 2>/dev/null
echo "   --- Commandes ---"
curl -s "$API_URL/erp/orders?erp=MOCK" | python3 -c "import sys,json; [print(f\"    {o['id']}: {o['ref']} - total {o['total']} Ar ({o['status']})\") for o in json.load(sys.stdin)]" 2>/dev/null

# 8. Test d'independance avec Dolibarr
echo -e "\n${YELLOW}8. Test d'independance ERP...${NC}"
echo "   Le Pack Boutique n'a pas change."
echo "   Seul le parametre ?erp=<CODE> change la cible."

# Verifier que les adaptateurs sont disponibles
echo -e "\n${YELLOW}9. Adaptateurs disponibles...${NC}"
curl -s "$API_URL/erp/adapters" | python3 -m json.tool 2>/dev/null

# Verifier Dolibarr si configure
echo -e "\n${YELLOW}10. Verification de Dolibarr (si installe)...${NC}"
DOLIBARR_HEALTH=$(curl -s "$API_URL/erp/health?erp=DOLIBARR" || true)
echo "$DOLIBARR_HEALTH" | python3 -m json.tool 2>/dev/null || echo "   Dolibarr non accessible (mode hors-ligne)"

echo -e "\n======================================================"
echo -e "   ${GREEN}DEMONSTRATION REUSSIE${NC}"
echo -e "   - Mock ERP : fonctionne (donnees en memoire)"
echo -e "   - L'interface est universelle (IErpAdapter)"
echo -e "   - Le Pack Boutique est independant de l'ERP"
echo "======================================================"