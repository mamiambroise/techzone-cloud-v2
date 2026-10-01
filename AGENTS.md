# AGENTS.md

## Working Branch
- Use `mami` for all future tasks in this workspace.
- Do not work or commit directly on `main`.
- Before editing, verify the current branch and switch to `mami` if needed. Preserve any uncommitted work.

## Build Commands

### Root
```bash
npm run dev            # Start frontend + backend via scripts/dev-all.mjs
npm run status          # Show running services
npm run stop           # Stop all services
npm run dev:rebuild     # Rebuild backend, then start
```

### Backend (NestJS 12, Prisma 7, TypeScript 6)
```bash
cd backend
npx nest build              # Compile TypeScript → dist/
npx prisma generate         # Regenerate Prisma client
npx prisma db push          # Push schema to DB (dev)
npx oxlint                  # Lint (warnings only)
npm test                    # Run unit tests (Jest)
```

### Frontend (React 19, Vite 6.2)
```bash
cd frontend
npx vite build              # Production build → dist/
npx oxlint                  # Lint (warnings only)
npm test                    # Run unit tests
```

## Structure
- `frontend/` — Canonical React frontend
- `backend/` — Canonical NestJS backend (port 3003, schema: business_manager)
- `backend/prisma/` — Prisma schema and migrations
- `backend/prisma7.config.ts` — Prisma 7 config (datasource + seed entrypoint)
- `backend/.env.example` — Environment variables template
- `techzone/` — Legacy PHP/Dolibarr ERP (DO NOT MODIFY)
- `docs/` — Project documentation
- `scripts/` — Orchestration and diagnostic scripts

## Ports / API
- Frontend dev: 3000
- Backend API: 3003 (`/api/*`) — serves Platform, Integration, Deployment, ERP Adapter, Data Runtime, Automation, IAM auth (local)

## Proxy Architecture
- `backend/src/iam/iam-jwt.guard.ts` validates local tokens (issuer: `techzone-cloud`)
  against Prisma `iamUser`/`iamSession` tables
- `backend/src/main.ts` uses `CORS_ORIGIN` env var (comma-separated) for CORS config
- Frontend `vite.config.ts` maps `/api/iam` → :3003, `/api` → :3003

## Notes
- Never commit secrets; use `.env.local`
- PostgreSQL may be intermittently unavailable → classify as DATABASE_UNAVAILABLE
- Do not rebuild BM-CDC-09, Form Builder, Dashboard Builder, or AI Layer
