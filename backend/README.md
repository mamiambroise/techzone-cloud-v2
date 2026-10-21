# ☁️ Techzone Cloud — Platform Foundation, Integration & Deployment Backend

Bienvenue sur le backend de la plateforme **Techzone Cloud**, développé avec **NestJS**, **TypeScript** et **Prisma**.

Ce projet orchestre le cycle de vie complet des logiciels, de la modélisation de la plateforme jusqu'au déploiement continu et à la gestion des incidents.

---

## 📚 Documentation Complète de l'API

👉 **[Consulter le Guide Complet de l'API (API_DOCUMENTATION.md)](./API_DOCUMENTATION.md)**

Ce guide détaille l'intégralité des endpoints avec leurs méthodes (`GET`, `POST`, `PATCH`, etc.), les structures de données (DTOs JSON en entrée et en sortie), les règles de validation, les codes d'erreur et les flows d'orchestration.

---

## 🏛️ Architecture des Modules

Le système est structuré en trois grands packs :

1. **Partie 1 : Platform Foundation** (`src/modules/platform`)
   - **Applications & Versions** : Gestion du catalogue applicatif et versionnage sémantique.
   - **Environnements** : Typologie des cibles (`DEVELOPMENT`, `TEST`, `STAGING`, `PRODUCTION`).
   - **Contrats d'interface** : Schémas stricts, validation et règles de rétrocompatibilité.
   - **Configurations hiérarchiques** : Résolution en cascade (Global $\rightarrow$ Environment $\rightarrow$ Application $\rightarrow$ Version).
   - **Snapshots** : Captures d'état immuables pour garantir la reproductibilité.

2. **Partie 2 : Pack Intégration** (`src/modules/integration`)
   - **Connecteurs** : Connexions normalisées (REST, GraphQL, Message Brokers).
   - **Définitions d'APIs & Webhooks** : Gestion des contrats d'échange et livraisons tracées.
   - **Identifiants & Secrets** : Stockage sécurisé et masquage d'audit.
   - **Jobs de synchronisation & Résilience** : Idempotence et circuit breakers.

3. **Partie 3 : Publication, Release & Déploiement** (`src/modules/deployment`)
   - **Deployment Cockpit** : Dashboard unifié et indicateurs de supervision temps réel (`/api/deployment/dashboard`).
   - **Gestionnaire de Releases** : Cycle de vie immuable `DRAFT` $\rightarrow$ `ASSEMBLING` $\rightarrow$ `VALIDATING` $\rightarrow$ `READY` $\rightarrow$ `APPROVED` $\rightarrow$ `RELEASED`.
   - **Moteur de Déploiement** : Stratégies de déploiement (`STANDARD`, `ROLLING`, `BLUE_GREEN`, `CANARY`), contrôle des conflits de concurrence et idempotence.
   - **Pipeline de Promotion** : Règle stricte d'acheminement (`TEST` $\rightarrow$ `STAGING` $\rightarrow$ `PRODUCTION`) et verrous d'environnements (`LOCKED`).
   - **Validation Gates** : Portes automatiques de conformité et approbations manuelles/bypass tracés.
   - **Gestionnaire de Rollback** : Restauration atomique vers la version saine précédente en cas d'incident.
   - **Historique & Diagnostics** : Journal d'audit caviardé, timeline chronologique et analyse de cause racine (RCA).

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js (v20+)
- npm ou bun

### Configuration des variables d'environnement
Le fichier .env contient les variables de configuration locales et ne doit pas être versionné dans Git.

Un fichier .env.example est fourni comme modèle.

Créer le fichier .env

Après avoir cloné le projet, copiez le fichier .env.example :

```bash
cp .env.example .env
```

Vous pouvez ensuite modifier les valeurs dans .env selon votre environnement local.

### Installation
```bash
npm install
```

### Initialisation de la base Prisma
```bash
npx prisma generate
```

### Seeder
``` bash
npx prisma db seed
```

Pour préparer un environnement de recette complet et réutilisable, utilisez le
seed démo sur la copie disposable `techzonecloud_phase7_recipe` uniquement :

```bash
npm run seed:demo:cloud -- techzonecloud_phase7_recipe
```

Prérequis : la base dédiée doit exister et avoir toutes les migrations courantes
appliquées sans erreur. Le PostgreSQL doit être local (`localhost` ou
`127.0.0.1`, port `5432` ou `55432`) et configuré dans `backend/.env`.
Définissez `SEED_AUTH_PASSWORD` dans `backend/.env.local`.
Le script vérifie le nom de base, l’historique des migrations et les contraintes
tenant avant toute écriture ; il refuse les autres bases, dont
`techzonecloud_dev`. Il est relançable et ne supprime aucune donnée.

Il compose le seed plateforme/IAM existant et les fixtures Phase 7 pour deux
applications, données métier, UI et packs publiés. Il ajoute le catalogue
Billing et un registre ERP inactif pointant vers un domaine `.invalid` sans
identifiants réels. Le seed ne crée pas de paiements/factures de test ; le
modèle Billing tenant-scopé doit d’abord être aligné avec les migrations. Le
module Automation utilise actuellement un mock mémoire, sans tables Prisma à
peupler. Le backend compilé (`dist/`) doit déjà contenir les services utilisés
par les scripts Phase 7 ; le seed ne déclenche pas de build implicite.

### Lancer le serveur de développement
```bash
npm run start:dev
```
L'API démarre par défaut sur le port configuré (port `3000`).

---

## 🧪 Tests & Qualité

### Exécuter la suite complète de tests unitaires
```bash
npm test
```

### IAM PostgreSQL E2E

IAM E2E never falls back to `DATABASE_URL`. Configure `TEST_DATABASE_URL` with
an isolated PostgreSQL database whose name contains `test` or `e2e`, apply the
migrations to that database, then run:

```bash
TEST_DATABASE_URL="postgresql://.../techzone_test?schema=business_manager" npx prisma migrate deploy
TEST_DATABASE_URL="postgresql://.../techzone_test?schema=business_manager" npm run test:e2e
```

The runner stops with an explicit error when the variable is missing, equal to
`DATABASE_URL` outside CI, malformed, or not clearly a test database. Fixtures
must be cleaned up by suite identifier; a global reset is not permitted outside
ephemeral CI.

### Linter le projet
```bash
npm run lint
```

### Compiler pour la production
```bash
npm run build
```
