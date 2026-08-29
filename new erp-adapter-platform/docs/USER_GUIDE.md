# Guide utilisateur — ERP Adapter Platform

## 1. Ajouter un ERP

### Via l'API

```bash
curl -X POST http://localhost:3000/api/erp-registry \
  -H "Content-Type: application/json" \
  -d '{
    "code": "DOLIBARR",
    "nom": "Dolibarr 23.0.3",
    "type": "DOLIBARR",
    "url": "http://localhost/dolibarr",
    "environment": "DEVELOPMENT"
  }'
```

### Via le Frontend

1. Aller sur http://localhost:3001
2. Cliquer sur **"ERP Registry"** dans le menu de gauche
3. Cliquer sur **"Ajouter un ERP"**
4. Remplir le formulaire :
   - **Code** : identifiant unique (ex : `DOLIBARR`)
   - **Nom** : nom affiché (ex : `Dolibarr 23.0.3`)
   - **Type** : `CLOUD`, `ON_PREMISE`, `MOCK`, `HYBRID`
   - **URL** : adresse de l'ERP (optionnel)
   - **Environnement** : `DEVELOPMENT`, `TEST`, `STAGING`, `PRODUCTION`
5. Cliquer sur **"Enregistrer"**

## 2. Utiliser un ERP

Le même endpoint fonctionne pour tous les ERP. Seul le paramètre `erp` change.

### Avec Mock ERP (aucune installation nécessaire)

```text
GET /api/erp/clients?erp=MOCK
GET /api/erp/products?erp=MOCK
GET /api/erp/orders?erp=MOCK
```

### Avec Dolibarr

```text
GET /api/erp/clients?erp=DOLIBARR
GET /api/erp/products?erp=DOLIBARR
GET /api/erp/orders?erp=DOLIBARR
```

## 3. Créer des données

### Client

```bash
curl -X POST http://localhost:3000/api/erp/clients?erp=MOCK \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Rakoto Marie",
    "email": "marie@test.com"
  }'
```

### Produit

```bash
curl -X POST http://localhost:3000/api/erp/products?erp=MOCK \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "TSH-001",
    "label": "T-Shirt Noir",
    "price": 15000
  }'
```

### Commande

```bash
curl -X POST http://localhost:3000/api/erp/orders?erp=MOCK \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "1",
    "lines": [
      { "productId": "1", "quantity": 2, "price": 15000 }
    ]
  }'
```

### Stock

```bash
# Consulter le stock
GET http://localhost:3000/api/erp/stock/1?erp=MOCK

# Mettre à jour le stock
curl -X PUT http://localhost:3000/api/erp/stock/1?erp=MOCK \
  -H "Content-Type: application/json" \
  -d '{"quantity": 50}'
```

## 4. Vérifier la santé

```bash
curl http://localhost:3000/api/erp/health?erp=MOCK
```

Réponse :
```json
{"status":"HEALTHY","mode":"MOCK","timestamp":"2026-08-26T12:52:09.181Z"}
```

## 5. Consulter la documentation API

1. Ouvrir http://localhost:3000/api/docs dans un navigateur
2. Swagger UI liste tous les endpoints
3. Vous pouvez tester chaque endpoint directement depuis l'interface

## 6. Visualiser les données PostgreSQL

```bash
docker-compose exec postgres psql -U postgres -d erp_adapter_db
```

Ou avec Prisma Studio :
```bash
docker-compose exec backend npx prisma studio
# http://localhost:5555
```

Tables principales :
- **ERPRegistry** — registre des ERP connectés
- **AdapterRegistry** — configuration des adaptateurs
- **EntityMapping** — mapping des entités entre le Pack Boutique et les ERP
- **Secret** — clés API et secrets (non exposés)

## 7. Exécuter la démonstration

```bash
./scripts/demo.sh
```

Le script effectue automatiquement :
1. Vérification des services Docker
2. Health check
3. Enregistrement des ERP (Mock + Dolibarr)
4. Création d'un client (Mock)
5. Création d'un produit (Mock)
6. Création d'une commande (Mock)
7. Listing des données
8. Test d'indépendance ERP