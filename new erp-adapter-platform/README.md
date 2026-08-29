# ERP Adapter Platform

Plateforme universelle de connexion, configuration, mapping, synchronisation et orchestration des ERP.

## Contexte

Le **Pack Boutique** (Techzone) doit se connecter à n'importe quel ERP (Dolibarr, Odoo, ERPNext, ...). Cette plateforme fournit une **interface ERP universelle** (`IErpAdapter`) qui rend le Pack Boutique **indépendant de l'ERP** utilisé : seul le paramètre `?erp=<CODE>` change.

```
PACK BOUTIQUE
     │
     ▼
INTERFACE ERP UNIVERSELLE
     │
     ▼
ERP ADAPTER PLATFORM
     │
 ┌────┼────┬────┬────┐
 ▼    ▼    ▼    ▼   ▼
MOCK DOLI ODOO ERPX FUTUR
```

## Fonctionnalités

- ✅ Connexion à plusieurs ERP (Dolibarr 23.0.3, Mock)
- ✅ CRUD générique (clients, produits, commandes, stock)
- ✅ Mock ERP (fonctionne sans ERP réel)
- ✅ Mapping configurable (Techzone ↔ Dolibarr)
- ✅ Traduction d'erreurs
- ✅ Retry avec backoff exponentiel
- ✅ Gestion des erreurs HTTP (401, 404, 409, 429, 500, timeout)
- ✅ API REST documentée (Swagger)
- ✅ Interface d'administration React
- ✅ Base de données PostgreSQL
- ✅ Tests unitaires et E2E

## Technologies

| Composant | Technologie |
|-----------|-------------|
| Backend | NestJS (TypeScript, strict) |
| Frontend | React 18 + Tailwind CSS |
| Base de données | PostgreSQL 15 |
| ORM | Prisma 5 |
| Client HTTP | Axios |
| Conteneurisation | Docker + Docker Compose |

## Démarrage rapide

```bash
# 1. Cloner
git clone <url-du-depot>
cd erp-adapter-platform

# 2. Configurer l'environnement
cp .env.docker.example .env.docker

# 3. Lancer les services
docker-compose up -d --build

# 4. Appliquer les migrations
docker-compose exec backend npx prisma migrate deploy

# 5. Vérifier
curl http://localhost:3000/api/erp/health
```

## URLs d'accès

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000/api |
| Swagger UI | http://localhost:3000/api/docs |
| PostgreSQL | localhost:5432 |

## Démonstration

```bash
./scripts/demo.sh
```

## Tests

```bash
# Tests unitaires
docker-compose exec backend npm test

# Tests E2E
docker-compose exec backend npm run test:e2e
```

## Endpoints principaux

### ERP Registry (PostgreSQL)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/erp-registry` | Lister les ERP |
| GET | `/api/erp-registry/:id` | Détails d'un ERP |
| GET | `/api/erp-registry/code/:code` | Détails par code |
| POST | `/api/erp-registry` | Créer un ERP |
| PUT | `/api/erp-registry/:id` | Modifier un ERP |
| DELETE | `/api/erp-registry/:id` | Supprimer un ERP |

### ERP Adapter (MOCK / DOLIBARR)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/erp/clients?erp=MOCK` | Lister les clients |
| POST | `/api/erp/clients?erp=MOCK` | Créer un client |
| PUT | `/api/erp/clients/:id?erp=MOCK` | Modifier un client |
| DELETE | `/api/erp/clients/:id?erp=MOCK` | Supprimer un client |
| GET | `/api/erp/products?erp=MOCK` | Lister les produits |
| POST | `/api/erp/products?erp=MOCK` | Créer un produit |
| GET | `/api/erp/orders?erp=MOCK` | Lister les commandes |
| POST | `/api/erp/orders?erp=MOCK` | Créer une commande |
| GET | `/api/erp/stock/:id?erp=MOCK` | Consulter le stock |
| PUT | `/api/erp/stock/:id?erp=MOCK` | Mettre à jour le stock |
| GET | `/api/erp/health?erp=MOCK` | Vérifier la santé |
| GET | `/api/erp/adapters` | Liste des adaptateurs |

## Documentation

- [Guide d'installation](docs/INSTALLATION.md)
- [Guide utilisateur](docs/USER_GUIDE.md)
- [Guide technique](docs/TECHNICAL_GUIDE.md)
- [Swagger UI](http://localhost:3000/api/docs)

## Structure du projet

```
erp-adapter-platform/
├── docker-compose.yml         # Orchestration Docker
├── .env.docker                # Variables d'environnement
├── backend/                   # API NestJS
│   ├── prisma/                # Schéma et migrations
│   ├── src/
│   │   ├── erp-registry/      # Registre des ERP (PostgreSQL)
│   │   ├── erp-adapter/       # Adaptateurs ERP
│   │   │   ├── mock/          # Mock ERP (mémoire)
│   │   │   ├── dolibarr/      # Dolibarr 23.0.3
│   │   │   └── interfaces/    # IErpAdapter (contrat)
│   │   ├── prisma/            # Service Prisma
│   │   ├── filters/           # Gestion d'erreurs
│   │   ├── app.module.ts      # Module principal
│   │   └── main.ts            # Point d'entrée
│   └── test/                  # Tests E2E
├── frontend/                  # React + Tailwind
│   └── src/
│       ├── components/        # Layout, Sidebar, Header
│       ├── pages/             # Dashboard, ERP CRUD
│       └── services/          # Service API
├── docs/                      # Documentation
├── scripts/                   # Scripts de démonstration
└── README.md
```

## Phases du projet

| Phase | Contenu | Statut |
|-------|---------|--------|
| **Phase 1** | Backend : CRUD ERP Registry (PostgreSQL) + Mock Adapter | ✅ Terminée |
| **Phase 2** | Frontend : administration React (Dashboard, ERP CRUD) | ✅ Terminée |
| **Phase 3** | Dolibarr Adapter (implémentation IErpAdapter) | ✅ Terminée |
| **Phase 4** | Tests E2E + Démonstration + Documentation | ✅ Terminée |

## Équipe

- **Chef de Projet** : [Nom]
- **Développeur Backend** : [Nom]
- **Développeur Frontend** : [Nom]

## Licence

Propriétaire — Techzone Cloud