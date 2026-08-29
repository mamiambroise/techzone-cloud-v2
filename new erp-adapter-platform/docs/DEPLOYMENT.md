# Guide de déploiement - Production

## Prérequis

- Serveur Linux (Ubuntu 22.04)
- Docker 20+ et Docker Compose 2+
- Node.js 20+ (pour la CI et le build du frontend sur le serveur)
- Domaines configurés:
  - `api-erp.techzone.com` → Backend
  - `erp-admin.techzone.com` → Frontend
- Certificats SSL (Let's Encrypt) dans `nginx/ssl/`
- Redis (inclus dans `docker-compose.prod.yml`)

## 1. Installation

### 1.1 Cloner le projet

```bash
git clone https://github.com/techzone/erp-adapter-platform.git
cd erp-adapter-platform
```

### 1.2 Configurer les variables d'environnement

```bash
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production
# Éditer les fichiers avec les vraies valeurs
```

Variables requises (`.env` racine ou variables d'environnement du serveur):

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `DATABASE_URL` | URL complète de connexion PostgreSQL |
| `JWT_SECRET` | Secret JWT (voir génération ci-dessous) |
| `REDIS_PASSWORD` | Mot de passe Redis |
| `SENTRY_DSN` | DSN Sentry (optionnel) |
| `GRAFANA_PASSWORD` | Mot de passe admin Grafana |
| `DOLIBARR_URL` | URL du Dolibarr connecté |
| `DOLIBARR_API_KEY` | Clé API Dolibarr |

### 1.3 Configurer les secrets

```bash
# Générer JWT_SECRET
openssl rand -base64 32

# Générer les mots de passe
openssl rand -base64 24
```

### 1.4 Certificats SSL

Copier `cert.pem` et `key.pem` (Let's Encrypt) dans `nginx/ssl/`.

## 2. Déploiement

### 2.1 Lancer la production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 2.2 Vérifier les services

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### 2.3 Vérifier la santé

```bash
curl https://api-erp.techzone.com/api/erp/health
```

## 3. Monitoring

| Service | URL |
|---------|-----|
| Prometheus | `http://prometheus.techzone.com:9090` |
| Grafana | `http://grafana.techzone.com:3001` (login admin / `${GRAFANA_PASSWORD}`) |

Grafana est provisionné automatiquement (datasource Prometheus + dashboard "ERP Adapter Platform").

## 4. Backup

### Backup automatique (cron)

```bash
# Ajouter au crontab
0 2 * * * /opt/erp-adapter-platform/scripts/backup.sh
```

### Restauration

```bash
./scripts/restore.sh
```

## 5. Mises à jour

Déploiement manuel:
```bash
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

Déploiement automatique: pousser sur `main` déclenche GitHub Actions (tests → build → déploy via SSH).

## 6. Sécurité

- HTTPS obligatoire (TLS 1.2/1.3)
- Rate Limiting (100 req/min au niveau Nginx ET application)
- Headers de sécurité (CSP, HSTS, X-Frame-Options...)
- Secrets dans les variables d'environnement (jamais dans le code)
- Base de données non exposée publiquement (`127.0.0.1:5432`)
- Conteneur backend non-root

## 7. URLs

| Service | URL |
|---------|-----|
| Backend API | `https://api-erp.techzone.com` |
| Swagger UI | `https://api-erp.techzone.com/api/docs` |
| Frontend Admin | `https://erp-admin.techzone.com` |
| Prometheus | `http://prometheus.techzone.com:9090` |
| Grafana | `http://grafana.techzone.com:3001` |

## 8. Pile de déploiement (GitHub Actions)

Workflow: `.github/workflows/deploy.yml`

Jobs:
1. **test** — `npm ci` backend + frontend, génération Prisma, tests unitaires
2. **build** — compilation TypeScript + build React, artefacts uploadés
3. **deploy** — SSH vers le serveur, `git pull`, build du frontend, `docker-compose up -d --build`, health check final

Secrets GitHub requis: `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`.