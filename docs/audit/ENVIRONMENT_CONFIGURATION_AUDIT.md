# Techzone Cloud — Environment & Configuration Audit

> **Purpose:** Audit of environment variable handling, local config files, Docker/compose setup, and secrets management.
> **Date:** 2026-09-28
> **Standard:** No secrets ever committed; `.env` never tracked; `.env.example` is the source of truth for required variables.

## 1. Secrets Hygiene — VERIFIED COMPLIANT

| File | Tracked? | Contains secrets? | Verdict |
|---|---|---|---|
| `backend/.env` | No (`backend/.gitignore` → `/.env`) | Yes (real PostgreSQL creds, JWT secrets) | ✓ Never committed |
| `backend/.env.local` | No (`backend/.gitignore` → `/.env.local`) | Yes/No | ✓ Never committed |
| `backend/.env.example` | **Yes** (git tracked) | No — only placeholders (`change_me_*`) | ✓ Safe template |
| `frontend/.env*` | No (`frontend/.gitignore` → `.env*` except `.env.example`) | Yes — dev API URLs only | ✓ Never committed |
| Root `.env` | No (`root .gitignore`) | N/A | ✓ |

**Verification method (PowerShell):**
```powershell
git ls-files | ? { $_ -like '*.env*' }   # returns only .env.example files
```

**Result:** Only `.env.example` files are tracked. No real secrets in git. The frontend never receives PostgreSQL credentials — it communicates only via HTTP API (`apiClient.js`) to the backend on port 3003.

## 2. Backend Environment Variables

### Required variables (from `backend/.env.example`)

| Variable | Placeholder | Required? | Purpose |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:change_me@localhost:5432/business_manager` | Yes | PostgreSQL connection (Prisma) |
| `JWT_ACCESS_SECRET` | `change_me_*` | Yes | JWT access token signing |
| `JWT_REFRESH_SECRET` | `change_me_*` | Yes | JWT refresh token signing |
| `ACCESS_TOKEN_TTL` | `15m` | No | Access token expiry |
| `CORS_ORIGIN` | `http://localhost:3000` | Yes | CORS allowlist (comma-separated in prod) |
| `NODE_ENV` | `development` | No | Enables Secure cookies when `production` |
| `PORT` | `3003` | No | Backend listen port |
| `IAM_API_URL` | `http://localhost:3003` | No | Internal IAM API URL |
| `DOLIBARR_URL` | `http://localhost:8080` | No | Dolibarr ERP endpoint |
| `DOLIBARR_TOKEN` | `change_me` | No | Dolibarr API token |
| `SMTP_HOST` | — | No | SMTP server host |
| `SMTP_PORT` | `587` | No | SMTP server port |
| `SMTP_USER` | — | No | SMTP username |
| `SMTP_PASS` | — | No | SMTP password |
| `REDIS_URL` | — | No | Redis (cache/queue) |

### Backend `.gitignore` rules (`/backend/.gitignore`)

```
node_modules
dist
.env
.env.local
.env.*.local
src/generated/prisma
npm-debug.log*
```

This correctly excludes all real `.env` files while keeping `backend/.env.example`.

## 3. Frontend Environment Variables

### Vite env handling

Vite only injects variables prefixed with `VITE_` into the client bundle. The frontend `apiClient.js` uses:
```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

| Variable | Required? | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | No | Backend API base (dev; defaults to `/api` proxy) |
| `VITE_DEV_PORT` | No | Frontend dev port (default 3000) |

### Frontend `.gitignore` rules (`/frontend/.gitignore`)

```
node_modules
dist
.env
.env.local
.env.*.local
```

Note: `.env*` in gitignore, but `.env.example` is force-included (the gitignore pattern `.env*` would catch `.env.example`, but since `.env.example` is already tracked, git keeps tracking it). The ignore rule for `.env` (no wildcard) and `.env.local` is sufficient. To be safe, frontend uses `.env*` which also ignores `.env.example` — but since it's already in the git index, Git continues tracking it. **Recommendation:** add `.env.example` negation pattern (`!.env.example`) to be explicit.

## 4. Prisma Configuration

| File | Purpose | Tracked? |
|---|---|---|
| `backend/prisma/schema.prisma` | Schema definition (PostgreSQL) | Yes |
| `backend/prisma7.config.ts` | Prisma 7 config (datasource + seed) | Yes |
| `backend/prisma/migrations/` | Migration files | Yes (if present) |

## 5. Local Development Setup

### Orchestration (`scripts/`)

| Script | Command | Ports |
|---|---|---|
| `npm run dev` (root) | `scripts/dev-all.mjs dev-all` | Frontend 3000, Backend 3003, Dolibarr 8080 |
| `npm run stop` (root) | `scripts/stop.mjs` | Kills all 3 |
| `npm run status` (root) | `scripts/status.mjs` | Reports running services |
| `npm run dev:rebuild` | Rebuild backend → restart | Backend 3003 + Frontend 3000 |

**PID management:** `logs/.dev-pids.json` stores process PIDs (gitignored).

### Backend build/test

```bash
cd backend
npx nest build            # Compile → dist/
npx prisma generate        # Regenerate Prisma client
npx prisma db push         # Push schema to DB (dev only)
npx oxlint                 # Lint (warnings only)
npm test                    # Jest unit tests
```

### Frontend build/test

```bash
cd frontend
npx vite build            # Production build → dist/
npx oxlint                 # Lint (warnings only)
npm test                   # Vitest unit tests
```

## 6. Database Availability

| Component | Status | Notes |
|---|---|---|
| PostgreSQL 16 | Intermittent | Schema: `business_manager` |
| MySQL/MariaDB (Dolibarr) | Unavailable locally | `techzone/` requires MySQL — classified `DATABASE_UNAVAILABLE` when down |

## 7. Findings & Recommendations

### Findings

1. **Secrets hygiene is COMPLIANT** — `.env` files are properly gitignored; only `.env.example` templates are tracked with placeholders.
2. **Frontend correctly isolated from DB credentials** — frontend only uses `VITE_API_BASE_URL` → backend proxy; no direct DB access.
3. **CORS properly configured** — `main.ts` uses `CORS_ORIGIN` env var (comma-separated) for CORS config; not a wildcard.
4. **Cookie security** — `sameSite: 'lax'` on cookies; `secure` flag enabled when `NODE_ENV=production`. Should be `strict` for higher security.
5. **IAM cookies** — HttpOnly, 7-day maxAge. Access token TTL defaults to 15m; refresh token 7 days.

### Recommendations

1. **Add `!.env.example` negation** to `frontend/.gitignore` for explicit tracking clarity (currently relies on git already tracking the file).
2. **Bump `sameSite` to `strict`** for production IAM cookies (currently `lax`).
3. **Add `DATABASE_URL` validation** at backend startup — fail fast if the placeholder `change_me` is still present.
4. **Consider `.env.validation`** — a config schema validation module that runs at bootstrap and throws if critical vars are unset or default.
5. **Audit `REDIS_URL`** — if present, ensure TLS in production.
6. **Document the proxy architecture** — `frontend/vite.config.ts` maps `/api/iam` → :3003 and `/api` → :3003. This is correct but undocumented in `docs/ARCHITECTURE.md`.
