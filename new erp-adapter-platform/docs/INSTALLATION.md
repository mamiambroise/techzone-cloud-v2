# Guide d'installation — ERP Adapter Platform

## Prérequis

- Docker 20+
- Docker Compose 2+
- Git
- 4 Go de RAM minimum

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/techzone/erp-adapter-platform.git
cd erp-adapter-platform
```

### 2. Configurer les variables d'environnement

```bash
cp .env.docker.example .env.docker
```

Éditer `.env.docker` si nécessaire :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `POSTGRES_USER` | Utilisateur PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | `password` |
| `POSTGRES_DB` | Nom de la base | `erp_adapter_db` |
| `JWT_SECRET` | Secret pour les tokens | généré |

### 3. Configuration Dolibarr (optionnel)

Ajouter dans `backend/.env` ou dans l'environnement Docker :

```bash
DOLIBARR_URL=http://localhost/dolibarr
DOLIBARR_API_KEY=<votre_cle_api_dolibarr>
```

Pour générer une clé API dans Dolibarr :
1. Connectez-vous à Dolibarr en admin
2. Allez dans **Accueil → Configuration → Modules/Applications**
3. Activez le module **Web Services REST API**
4. Allez dans **Accueil → Configuration → Web Services**
5. Créez un utilisateur avec un token (ou utilisez l'onglet **API key**)
6. Copiez la clé générée

### 4. Démarrer les services

```bash
docker-compose up -d --build
```

### 5. Appliquer les migrations

```bash
docker-compose exec backend npx prisma migrate deploy
```

### 6. Vérifier que tout fonctionne

```bash
curl http://localhost:3000/api/erp/health
```

Réponse attendue :

```json
{"status":"HEALTHY","mode":"MOCK","timestamp":"..."}
```

## Accès

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3000/api |
| Swagger UI | http://localhost:3000/api/docs |
| Frontend | http://localhost:3001 |
| Prisma Studio | http://localhost:5555 |

## Commandes utiles

```bash
# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Relancer un service
docker-compose restart backend

# Reconstruire un service
docker-compose up -d --build backend

# Arrêter tout
docker-compose down

# Arrêter tout en supprimant les volumes
docker-compose down -v

# Lancer les tests unitaires
docker-compose exec backend npm test

# Lancer les tests E2E
docker-compose exec backend npm run test:e2e
```

## Dépannage

### Le backend ne démarre pas

Vérifier les logs :
```bash
docker-compose logs backend
```

### Erreur Prisma "engine not found"

Reconstruire l'image :
```bash
docker-compose up -d --build backend
```

### Le frontend ne se connecte pas au backend

Vérifier que `REACT_APP_API_URL` pointe vers `http://localhost:3000/api`.

### Dolibarr non accessible

Vérifier :
```bash
docker-compose exec backend env | grep DOLIBARR
curl http://localhost:3000/api/erp/health?erp=DOLIBARR
```

## Structure du projet

```
erp-adapter-platform/
├── docker-compose.yml        # Orchestration Docker
├── .env.docker               # Variables d'environnement
├── backend/                  # API NestJS
│   ├── prisma/               # Schéma et migrations
│   └── src/
│       ├── erp-registry/     # Registre des ERP (PostgreSQL)
│       ├── erp-adapter/      # Adaptateurs ERP
│       │   ├── mock/         # Mock ERP (mémoire)
│       │   └── dolibarr/     # Dolibarr 23.0.3
│       └── prisma/           # Service Prisma
├── frontend/                 # React + Tailwind
│   └── src/
│       ├── components/       # Layout, Sidebar, Header
│       ├── pages/            # Dashboard, ERP CRUD
│       └── services/         # Service API
├── docs/                     # Documentation
└── scripts/                  # Scripts de démonstration
```