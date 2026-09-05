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

### Installation
```bash
npm install
```

### Initialisation de la base Prisma
```bash
npx prisma generate
```

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

### Linter le projet
```bash
npm run lint
```

### Compiler pour la production
```bash
npm run build
```
