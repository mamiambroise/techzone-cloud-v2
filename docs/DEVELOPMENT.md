# Techzone Cloud — Guide de Développement

## Prérequis

- Node.js v20+
- npm
- PostgreSQL 16 (locale ou distante)

## Démarrage rapide

### Depuis la racine

```bash
npm run dev            # Démarre frontend + backend
npm run status         # Affiche les services actifs
npm run stop           # Arrête tous les services
npm run dev:rebuild    # Recompile le backend puis démarre
```

### Frontend seul

```bash
cd frontend
npm install            # Une fois
npm run dev            # http://localhost:3000
```

### Backend seul

```bash
cd backend
npm install            # Une fois
npx prisma generate    # Génère le client Prisma
npx prisma db push     # Pousse le schéma (dev)
npm run start:dev      # http://localhost:3003
```

## Variables d'environnement

Le backend charge `.env` depuis `backend/.env` (non versionné).

```bash
cd backend
cp .env.example .env
# Éditer .env avec vos valeurs
```

Référez-vous à `backend/.env.example` pour la liste complète des variables.

## Build

### Backend
```bash
cd backend
npm run build          # Compile → dist/
```

### Frontend
```bash
cd frontend
npm run build          # Compile → dist/
```

## Tests

### Backend
```bash
cd backend
npm test               # Unités (Jest)
npm run test:e2e       # E2E
```

### Frontend
```bash
cd frontend
npm test
npx tsc --noEmit       # Type-check
```

## Lint

### Backend
```bash
cd backend
npx oxlint
```

### Frontend
```bash
cd frontend
npx oxlint
npx tsc --noEmit       # Type-check
```

## Conventions

- **NE JAMAIS** commiter de `.env` ou de secrets
- Le frontend ne doit jamais stocker de JWT
- Utiliser cookies HttpOnly pour l'authentification
- Respecter les traceIds (`X-Trace-Id`) dans toutes les réponsions
- Conserver les contrats IAM (`auth_aim` schema) pour la rétention historique
