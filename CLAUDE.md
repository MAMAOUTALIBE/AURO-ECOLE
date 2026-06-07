# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LODEN Auto-École — a French driving-school site. This is a **single repo containing two apps**:

1. **Next.js 15 frontend** (App Router, React 19) — `app/`, `components/`, `data/`, `lib/`. Runs on port **3000**.
2. **Express 5 backend API** — `backend/src/`. Runs on port **4000**. Persists via Prisma/PostgreSQL.

They are deployed together (PM2, see Deployment) but built and tested separately. Node `>=22 <25` (`.nvmrc` = 22).

## Commands

```bash
# Frontend (Next.js, :3000)
npm run dev            # dev server
npm run build          # production build
npm run lint           # eslint . (covers whole repo)
npm run typecheck      # tsc --noEmit against root tsconfig (frontend)

# Backend API (Express, :4000)
npm run api:dev        # tsx watch backend/src/main.ts
npm run api:typecheck  # tsc -p backend/tsconfig.json --noEmit
npm run api:build      # compile backend to dist/backend/
npm run api:test       # vitest run --config backend/vitest.config.ts

# A single backend test:
npx vitest run --config backend/vitest.config.ts -t "test name substring"

# Prisma / DB
npm run prisma:generate
npm run db:migrate:deploy   # prisma migrate deploy
npm run db:seed             # tsx prisma/seed.ts

# Aggregate gates
npm run deploy:check        # lint + typecheck + api:typecheck + api:test + api:build + prisma:generate + build
npm run deploy:build        # prisma:generate + api:build + build
```

`npm run deploy:check` is the full pre-merge gate — run it (or the relevant subset) after changes that touch both apps.

## Architecture

### The frontend talks to the backend through Next.js proxy routes

The routes under `app/api/**/route.ts` are **thin proxies, not real handlers**. Each one calls `proxyBackendJson()` in [lib/backend-proxy.ts](lib/backend-proxy.ts), which forwards the request to the Express backend at `process.env.LODEN_API_URL` (default `http://127.0.0.1:4000`) with `cache: "no-store"`. For protected routes the proxy relays the incoming `Authorization: Bearer` header through to Express (e.g. [app/api/students/me/route.ts](app/api/students/me/route.ts)). When the backend is unreachable the proxy returns a `503` with a `BACKEND_UNAVAILABLE` error envelope.

**Implication:** business logic, validation, and auth live in `backend/src/`, *not* in `app/api/`. To change an endpoint's behavior, edit the Express module; the Next route only needs touching to add/relay a new path or header.

### Backend is layered: routes → repository abstraction → (memory | Prisma)

- `backend/src/app.ts` wires Helmet + CORS + rate-limit and mounts one router per domain module under `backend/src/modules/<domain>/<domain>.routes.ts`. Note the **catalog router mounts at `/api` root**, so it owns `/api/formations`, `/api/pricing-plans`, and `/api/tarifs`.
- All data access goes through the `LodenRepository` interface ([backend/src/repositories/loden-repository.ts](backend/src/repositories/loden-repository.ts)). Two implementations:
  - `MemoryLodenRepository` — in-memory, seeded from `backend/src/data/initial-data.ts` (demo data mirroring the frontend mocks).
  - `PrismaLodenRepository` — PostgreSQL via Prisma.
- `createRepository()` ([repository-factory.ts](backend/src/repositories/repository-factory.ts)) picks the memory repo when `API_USE_MEMORY=true` **or** `DATABASE_URL` is unset; otherwise Prisma. So the API runs with zero DB setup by default.
- Validation uses **Zod** DTOs (`backend/src/shared/validation.ts` + per-module schemas).
- **Auth & RBAC**: JWT (Bearer header **or** `loden_session` httpOnly cookie — the proxy falls back to the cookie, see [lib/backend-proxy.ts](lib/backend-proxy.ts)). Admin routes use **fine-grained permissions** via `requirePermission("module.action")` ([backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)) backed by role presets in [backend/src/domain/permissions.ts](backend/src/domain/permissions.ts). 9 roles: `SUPER_ADMIN, DIRECTEUR, RESPONSABLE_AGENCE, RESPONSABLE_PEDAGOGIQUE, ADMIN, SECRETAIRE, COMPTABLE, MONITEUR, ELEVE, VISITEUR`. `requireRoles` still exists but new guards should use `requirePermission`.
- **Multi-agences**: operational entities carry `agencyId`; users belong to agencies via `AgencyMembership`. List endpoints accept an `agencyId` filter (inclusive of unassigned rows during transition).

Local memory admin login: `admin@loden-autoecole.fr` / `admin-password`.

### CRM admin (`/admin`)

The CRM is the operational cockpit. [middleware.ts](middleware.ts) protects `/admin/*` (redirects to `/connexion` without a valid `loden_session` cookie + admin-capable role; the API enforces the real RBAC). Pages: `/admin` (cockpit KPIs), `/admin/pipeline`, `/admin/planning`, `/admin/examens`, `/admin/finance`, `/admin/eleves` + `/admin/eleves/[id]`. CRM-specific UI lives in `components/crm/`; the agency selector ([components/AgencySwitcher.tsx](components/AgencySwitcher.tsx)) persists the active agency in localStorage and reloads on change. Design vision & status: [docs/crm-blueprint.md](docs/crm-blueprint.md); deploy steps: [docs/crm-deployment.md](docs/crm-deployment.md).

### Frontend data: mocks with API fallback, and a cents→euros mapping boundary

- [data/site.ts](data/site.ts) is the canonical mock content (nav, formations, pricing, instructors, reviews, copy). Pages render from it as the **fallback** when the backend public endpoints are unavailable.
- API responses use integer **cents** and backend enum values (`MANUEL`, `AUTOMATIQUE`…). The mappers in [lib/catalog-mappers.ts](lib/catalog-mappers.ts) and [lib/social-mappers.ts](lib/social-mappers.ts) convert API DTOs into the frontend display shapes (euros, French labels). Always map API data through these before rendering — don't render raw API payloads.
- `data/crm.ts` backs the admin/CRM dashboard views.

### Config & environment

- Backend config is validated by Zod in [backend/src/config/env.ts](backend/src/config/env.ts). **In `NODE_ENV=production` the API refuses to start** if `JWT_SECRET` is a known dev value or `< 32` chars, if `DATABASE_URL` is missing, or if `API_USE_MEMORY=true`. Keep this guard intact.
- `CORS_ORIGIN` is a comma-separated allowlist (split into `corsOrigins`).
- Two separate TS configs: root [tsconfig.json](tsconfig.json) (Next, `noEmit`, `@/*` → repo root) and [backend/tsconfig.json](backend/tsconfig.json) (`NodeNext`, emits to `dist/backend/`). The `@/*` path alias is frontend-only; backend uses relative imports.

### Prisma

Single source of truth: [prisma/schema.prisma](prisma/schema.prisma) (PostgreSQL). Rich domain model — `User`/`Student`/`Instructor`, `Formation`/`PricingPlan`, `Booking`/`Availability`/`MeetingPoint`, `Payment` (Stripe fields), `CpfRequest`, `ContactRequest`, `Lead`, `Review`, `AuditLog`, with status enums per entity. Migrations live in `prisma/migrations/`; seed data in [prisma/seed.ts](prisma/seed.ts).

## Deployment

Target is Hostinger VPS via **PM2** ([ecosystem.config.cjs](ecosystem.config.cjs)): two processes — `loden-api` (`dist/backend/main.js`, :4000) and `loden-web` (`next start`, :3000, with `LODEN_API_URL=http://127.0.0.1:4000`). nginx reverse-proxy config in `deploy/hostinger-nginx.conf`. Full runbook: [docs/hostinger-deployment.md](docs/hostinger-deployment.md). Backend architecture & endpoint reference: [docs/backend-architecture.md](docs/backend-architecture.md).

## Conventions

- UI copy, enum-derived labels, and domain terms are in **French** — match existing wording.
- Brand palette (turquoise `#08AEB8` on white) and component contract are specified in `Cahier_Des_Charges_LODEN_Frontend.md`.
