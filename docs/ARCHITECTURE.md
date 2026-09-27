# Techzone Cloud — Architecture

## Vue d'ensemble

```
techcloud/
├── backend/               ← NestJS 12 (API unique, port 3003)
├── frontend/              ← React 19 / Vite 6 (console, port 3000)
├── techzone/              ← Dolibarr PHP legacy (port 8080, externe)
├── docs/                  ← Documentation projet
├── scripts/               ← Scripts d'orchestration et diagnostic
├── package.json
├── package-lock.json
├── README.md
├── AGENTS.md
└── .gitignore
```

## Backend (NestJS)

- **Framework** : NestJS 12 avec `@nestjs/platform-express` (Express 5 en tant que platform interne)
- **ORM** : Prisma 7 avec `@prisma/adapter-pg`
- **Base de données** : PostgreSQL 16, schéma `business_manager`
- **Port** : 3003
- **Authentification** : JWT + cookies HttpOnly via `@nestjs/jwt`
- **Validation** : `class-validator` + `ValidationPipe`
- **Sécurité** : Helmet, cookie-parser, express-rate-limit, CORS configuré via `CORS_ORIGIN`

### Structure des modules

```
backend/src/
├── iam/                  ← Authentification, JWT, MFA, utilisateurs, tenants, billing
├── modules/
│   ├── platform/         ← Applications, versions, environnements, contrats, snapshots, configuration
│   ├── integration/      ← Connecteurs, APIs, webhooks, credentials, synchronisation, diagnostics
│   └── deployment/       ← Releases, déploiements, gates, promotion, rollback, cockpit, RCA
├── erp-adapter/          ← Adaptateur Dolibarr + mock, DTOs, mappers
├── erp-registry/         ← Registre des ERP
├── data-runtime/         ← Query engine, binding, exécution, validation, historique
├── automation/           ← Rules, conditions, triggers, actions, workflow, history
├── common/               ← Filtres, middlewares, logger, mail, errors
├── config/               ← Configuration globale
├── prisma/               ← Schema, migrations, seed
└── main.ts               ← Bootstrap NestJS
```

### Schémas PostgreSQL

| Schéma | Utilisation |
|---|---|
| `auth_aim` | IAM data retention (historical) |
| `erp_adapter` | ERP registry & adapter data |
| `business_manager` | Platform, Integration, Deployment |

## Frontend (React/Vite)

- **Framework** : React 19
- **Build tool** : Vite 6.2
- **Routing** : React Router DOM 6
- **State** : Redux Toolkit
- **HTTP** : Axios avec intercepteurs (traceId, gestion d'erreurs normalisée)
- **UI** : Tailwind CSS + lucide-react + heroicons
- **Port** : 3000 (strict)
- **Proxy API** : `/api/*` → `http://localhost:3003`

### Authentification

- Cookies HttpOnly (SameSite=Strict, Secure en production)
- Aucun JWT dans le localStorage/sessionStorage
- Refresh token au démarrage après 401 sur `/me`

## ERP / Dolibarr (externe)

- **techzone/** contient le Dolibarr PHP legacy
- DO NOT MODIFY sauf mission ERP spécifique
- Nécessite MySQL/MariaDB (indisponible en local)

## Communication inter-services

| Composant | Adresse |
|---|---|
| Frontend → Backend IAM | `/api/iam/*` (proxé sur :3003) |
| Frontend → Backend API | `/api/*` (proxé sur :3003) |
| ERP Adapter → IAM context | `IAM_API_URL` (interne, résolu par le backend) |
| Platform → IAM | contrats `/sessions/validate`, `/context/resolve` |
