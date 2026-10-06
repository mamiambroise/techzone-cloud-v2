# Techzone Cloud — Guide de Développement

## Prérequis

- Node.js v20+
- npm
- PostgreSQL 16 (locale ou distante)

## Démarrage rapide

### Depuis la racine

```bash
npm run dev            # Démarre frontend + backend + Dolibarr (si PHP disponible)
npm run status         # Affiche les services actifs
npm run stop           # Arrête le projet et vérifie que ses ports sont libres
npm run restart        # Attend la fin de l’arrêt, puis relance le projet
npm run dev:rebuild    # Recompile le backend puis démarre
```

Sous Windows, `stop` retrouve aussi les processus du projet lancés par le runtime Windows,
même si les anciens fichiers PID manquent. Il arrête le lanceur et ses descendants,
vérifie les ports 3000, 3003 et 8080 (IPv4/IPv6), puis nettoie les fichiers PID.
Un processus inconnu occupant ces ports est signalé avec son PID et laissé intact :
l’arrêt échoue et le redémarrage est annulé. PostgreSQL reste en service.
`Ctrl+C` arrête les services sans programmer de nouvelle tentative de lancement.
`npm run restart -- --rebuild` arrête le projet, recompile le backend, puis relance.
Les raccourcis Windows sont `Lancer-Techzone.cmd`, `Arreter-Techzone.cmd` et
`Redemarrer-Techzone.cmd` (profil Windows local par défaut).
Après avoir arrêté le projet, `npm run test:launcher` teste l’arrêt Windows avec
des processus isolés : descendants, fichiers PID absents/périmés, port étranger
et annulation du redémarrage si l’arrêt échoue.

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
