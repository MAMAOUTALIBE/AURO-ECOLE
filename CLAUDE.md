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
npm run typecheck      # tsc -p tsconfig.typecheck.json (extends root tsconfig but excludes .next — avoids stale-types false negatives)

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
npm run db:seed-availability # tsx prisma/seed-availability.ts — booking slots
npm run db:seed-demo        # tsx prisma/seed-demo.ts — demo dataset (ids "demo-")
npm run db:import-students  # tsx prisma/import-students.ts — bulk student import
npm run db:clean-demo       # tsx prisma/clean-demo.ts — purge demo rows (ids "demo-")

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

- `backend/src/app.ts` wires Helmet + CORS + rate-limit and mounts one router per domain module under `backend/src/modules/<domain>/<domain>.routes.ts` (~35 modules: catalog, instructors, vehicles, leads, inscriptions, bookings, appointments, payments, installments, invoices, quotes, contracts, cpf, exams, contacts, reviews, offers, partners, media, notifications, automations, search, chat, ai, analytics, plus auth/users/students/agencies/permissions/audit/stats/site/content/cms). A few mounts don't match the module name 1:1:
  - **catalog** mounts at the `/api` root → owns `/api/formations`, `/api/pricing-plans`, `/api/tarifs`.
  - **content** router (`content.routes.ts`) is mounted at *both* `/api/faq` and `/api/content` (the latter serves `/api/content/company` = the `CompanyInfo` singleton).
  - **cms** router (`cms.routes.ts`) mounts at `/api/content-entries` (generic key/section `ContentEntry` records).
  - **partners** (`/api/partners`) = the prescriber/apporteur-d'affaires ("Partenaires") layer. Admin CRUD under `/api/partners` + `/api/partners/:id/*` (create provisions a `PARTENAIRE` login with a one-time temp password, `reset-password`, commission management) is RBAC-guarded; the self-service **partner space** lives under `/api/partners/me/*` (`/me`, `/me/leads`, `/me/commissions`, `/me/students`) for the logged-in prescriber. Referred leads carry `partnerId` (attribution logic in `partners/attribution.ts`); conversion to an inscription generates a commission. Frontend surfaces: public showcase `/partenaires` + `components/PartnersSection.tsx`, self-service `/espace-partenaire` + `components/PartnerDashboard.tsx`, CRM `/admin/partenaires` (`components/crm/PartnersList.tsx`/`PartnerDetail.tsx`).
  - **stats**, **chat-admin**, and **analytics** all mount under `/api/admin` (`analytics` → `GET /api/admin/analytics`, backing the `/admin/trafic` dashboard: lead-attribution/conversion KPIs computed from `Lead` records, plus optional Matomo traffic when `MATOMO_*` env is set — `traffic.configured=false` otherwise).
  - **appointments** mounts twice: `/api/admin/appointments` (admin) and `/api/appointments` (public). This is the **unified RDV center** — the `ChatAppointment` table is the single source of truth for all appointments; the `/admin/rendez-vous` page consumes it and the older booking pages redirect there. The **public inscription flow** (`/api/inscriptions`, `inscriptions.routes.ts`) creates a `Lead` (`source="inscription"`) **and** a `ChatAppointment` (`type="registration"`, `status="new"`, no instructor → lands in the RDV "Nouveau" column, not the per-moniteur planning until assigned). Provisioning the account is `POST /api/admin/appointments/:id/transform-to-student` → creates `User(ELEVE)` + `Student`, generates a one-time temporary password (via `shared/password.ts`), marks the lead `INSCRIT`.
- All data access goes through the `LodenRepository` interface ([backend/src/repositories/loden-repository.ts](backend/src/repositories/loden-repository.ts)). Two implementations:
  - `MemoryLodenRepository` — in-memory, seeded from `backend/src/data/initial-data.ts` (demo data mirroring the frontend mocks).
  - `PrismaLodenRepository` — PostgreSQL via Prisma.
- `createRepository()` ([repository-factory.ts](backend/src/repositories/repository-factory.ts)) picks the memory repo when `API_USE_MEMORY=true` **or** `DATABASE_URL` is unset; otherwise Prisma. So the API runs with zero DB setup by default.
- Validation uses **Zod** DTOs (`backend/src/shared/validation.ts` + per-module schemas).
- **Auth & RBAC**: JWT (Bearer header **or** `loden_session` httpOnly cookie — the proxy falls back to the cookie, see [lib/backend-proxy.ts](lib/backend-proxy.ts)). Admin routes use **fine-grained permissions** via `requirePermission("module.action")` ([backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)) backed by role presets in [backend/src/domain/permissions.ts](backend/src/domain/permissions.ts). 12 roles (`ALL_ROLES`): `SUPER_ADMIN, DIRECTEUR, RESPONSABLE_AGENCE, RESPONSABLE_PEDAGOGIQUE, ADMIN, SECRETAIRE, COMPTABLE, MONITEUR, EDITEUR, ELEVE, PARTENAIRE, VISITEUR` (`EDITEUR` = CMS/content-only access; `PARTENAIRE` = prescriber restricted to the `/api/partners/me/*` self-service space). `requireRoles` still exists but new guards should use `requirePermission`.
- **Multi-agences**: operational entities carry `agencyId`; users belong to agencies via `AgencyMembership`. List endpoints accept an `agencyId` filter (inclusive of unassigned rows during transition).

Local memory admin login: `admin@loden-autoecole.fr` / `admin-password`.

### CRM admin (`/admin`)

The CRM is the operational cockpit. [middleware.ts](middleware.ts) protects `/admin/*` (redirects to `/connexion` without a valid `loden_session` cookie + admin-capable role; the API enforces the real RBAC); it also gates the self-service portals `/espace-eleve`, `/espace-formateur`, and `/espace-partenaire`. Pages span operations (`/admin` cockpit KPIs, `/admin/pipeline`, `/admin/planning`, `/admin/rendez-vous` (unified RDV center), `/admin/examens`, `/admin/eleves` + `/admin/eleves/[id]`, `/admin/moniteurs`, `/admin/vehicules`, `/admin/agences`), finance (`/admin/finance`, `/admin/factures`, `/admin/devis`, `/admin/contrats`, `/admin/relances`, `/admin/cpf`), growth (`/admin/avis`, `/admin/partenaires`, `/admin/reporting`, `/admin/rapports`, `/admin/trafic`), automation/AI (`/admin/workflows`, `/admin/automatisations`, `/admin/assistant`, `/admin/demandes-chatbot`), CMS (`/admin/site/*`, `/admin/pages`, `/admin/blog`, `/admin/medias`, `/admin/formations`), and admin (`/admin/utilisateurs`, `/admin/permissions`, `/admin/journaux`, `/admin/parametres`). CRM-specific UI lives in `components/crm/` (nav defined in [lib/crm-nav.ts](lib/crm-nav.ts)); the agency selector ([components/AgencySwitcher.tsx](components/AgencySwitcher.tsx)) persists the active agency in localStorage and reloads on change. Design vision & status: [docs/crm-blueprint.md](docs/crm-blueprint.md); deploy steps: [docs/crm-deployment.md](docs/crm-deployment.md).

### AI layer is provider-agnostic and lives behind `backend/src/ai/`

The chatbot (public) and CRM assistant route through `AiProvider` ([backend/src/ai/types.ts](backend/src/ai/types.ts)) — `chat()` (tool-calling) + `complete()`. `provider-factory.ts` returns the Groq impl when `GROQ_API_KEY` is set, otherwise a `DisabledAiProvider` that **degrades gracefully** (returns a clear "AI unavailable" message — no key, no crash). To add OpenAI/Mistral/Claude/Ollama, implement the interface and register it in the factory; the rest of the app only depends on the interface. `agent.ts` runs a bounded tool-calling loop (`maxSteps`); tools in `tools.ts` split into `publicTools` (anonymous-safe) and `crmTools` (RBAC-checked via `hasPermission` before execution). Endpoints (`/api/ai/*`, `/api/chat/*`) have a dedicated rate limit, Zod validation, and never expose the key to the browser (Next proxies relay same-origin only). Config: `AI_PROVIDER` (default `groq`), `AI_MODEL` (default `llama-3.1-8b-instant`), `GROQ_API_KEY`. Full design: [docs/ai-agent.md](docs/ai-agent.md).

### CMS: the public site is steerable from the CRM via `SiteSetting`

Site content (hero, nav, FAQ, company info, page sections) is editable from `/admin/site/*` and stored as JSON. Three distinct stores, do not conflate them:
- **`SiteSetting`** (`key` → `value` JSON singleton) — structural site config (hero, primary nav, CTAs). Backend: `site.routes.ts` (`/api/site`), with a Zod schema **per key**. Frontend reads via [lib/site-content.ts](lib/site-content.ts), whose `default*` exports are the live fallback used when the API is down or a key is unset.
- **`CompanyInfo`** — brand/address/phone/email/hours singleton, served at `/api/content/company`; also feeds the AI agent's "coordonnées" context.
- **`ContentEntry`** — generic keyed content records (`/api/content-entries`, `cms.routes.ts`).

When editing CMS content, **keep `lib/site-content.ts` defaults in sync with `backend/src/data/initial-data.ts` (`initialSiteSettings`)** — the file header calls this out. `EDITEUR` is the CMS-scoped role for this surface.

### Frontend data: mocks with API fallback, and a cents→euros mapping boundary

- [data/site.ts](data/site.ts) is the canonical mock content (nav, formations, pricing, instructors, reviews, copy). Pages render from it as the **fallback** when the backend public endpoints are unavailable.
- Public formation pages read **live DB data** through [lib/catalog.ts](lib/catalog.ts) (`getFormations()`/`getFormationBySlug()`, `no-store`), falling back to `data/site.ts` only when the API is down. They render server-side so CRM catalog edits appear immediately — don't hardcode formation content back into `data/site.ts`.
- The formation detail hero is a **slideshow**: [components/FormationHero.tsx](components/FormationHero.tsx) renders `formationHeroSlides(slug, productLine)` from [lib/formation-image.ts](lib/formation-image.ts) — real photos (`/formations/photos/<slug>.webp`, or per-slide `<slug>-1/-2/-3.webp` when present) with a per-pole fallback, or **illustrated** gradient+icon slides for poles without photos (e.g. DIGITAL). Adding dedicated photos requires no code change (drop the `<slug>-N.webp` files).
- API responses use integer **cents** and backend enum values (`MANUEL`, `AUTOMATIQUE`…). The `lib/*-mappers.ts` files (`catalog-`, `social-`, `invoice-`, `quote-`, `contract-`) convert API DTOs into the frontend display shapes (euros, French labels). Always map API data through these before rendering — don't render raw API payloads.
- `data/crm.ts` backs the admin/CRM dashboard views.

### SEO: one canonical URL drives everything

[lib/seo.ts](lib/seo.ts) exports `SITE_URL` — the single source of the canonical domain (`NEXT_PUBLIC_SITE_URL`, default `https://lodene.org`). `absoluteUrl()` and `OG_IMAGE` derive from it; the dynamic [app/sitemap.ts](app/sitemap.ts) and [app/robots.ts](app/robots.ts) (which blocks private/tunnel routes), plus canonicals and Open Graph in page metadata, all flow from `SITE_URL`. To switch the canonical domain, set `NEXT_PUBLIC_SITE_URL` — no other code change. Structured data is emitted via `safeJsonLd()` in [lib/json-ld.ts](lib/json-ld.ts), which escapes `<`/`>`/`&` so API-sourced content (reviews, FAQ) can't break out of the `<script type="application/ld+json">` tag (XSS guard) — always serialize JSON-LD through it, never raw `JSON.stringify`.

### Config & environment

- Backend config is validated by Zod in [backend/src/config/env.ts](backend/src/config/env.ts). **In `NODE_ENV=production` the API refuses to start** if `JWT_SECRET` is a known dev value or `< 32` chars, if `DATABASE_URL` is missing, if `API_USE_MEMORY=true`, if `API_DEMO_SEED=true`, or if `STRIPE_SECRET_KEY` is set without `STRIPE_WEBHOOK_SECRET`. Keep these guards intact.
- Most integrations are **optional and degrade to no-op/log when unconfigured**: AI (`GROQ_API_KEY`), email (`RESEND_API_KEY`/SMTP), SMS (`SMS_API_KEY`), WhatsApp (`WHATSAPP_*`), payments (`STRIPE_SECRET_KEY` → mock mode without it), audience measurement (`MATOMO_URL` + `MATOMO_SITE_ID` + `MATOMO_API_TOKEN` → the `/admin/trafic` traffic panel).
- **`API_DEMO_SEED=true`** seeds a clearly-marked demo dataset (ids prefixed `demo-`) into the memory repo; it is a toggle for sales demos and is forbidden in production. `API_USE_MEMORY=true` forces the in-memory repo regardless of `DATABASE_URL`.
- `CORS_ORIGIN` is a comma-separated allowlist (split into `corsOrigins`); `APP_BASE_URL` is the public front URL used to build email links (falls back to the first CORS origin).
- Two separate TS configs: root [tsconfig.json](tsconfig.json) (Next, `noEmit`, `@/*` → repo root) and [backend/tsconfig.json](backend/tsconfig.json) (`NodeNext`, emits to `dist/backend/`). The `@/*` path alias is frontend-only; backend uses relative imports.

### Prisma

Single source of truth: [prisma/schema.prisma](prisma/schema.prisma) (PostgreSQL). Rich domain model — `User`/`Student`/`Instructor`, `Agency`/`AgencyMembership`, `Formation`/`PricingPlan`, `Booking`/`Availability`/`MeetingPoint`, `Payment` (Stripe fields)/`Installment`, `Invoice`/`Quote`/`Contract`, `CpfRequest`, `ContactRequest`, `Lead`, `Review`, `Automation`, CMS singletons (`SiteSetting`, `CompanyInfo`, `ContentEntry`), and `AuditLog`, with status enums per entity. Migrations live in `prisma/migrations/`; seed data in [prisma/seed.ts](prisma/seed.ts).

## Deployment

Primary target is Hostinger VPS via **PM2** ([ecosystem.config.cjs](ecosystem.config.cjs)): two processes — `loden-api` (`dist/backend/main.js`, :4000) and `loden-web` (`next start`, :3000, with `LODEN_API_URL=http://127.0.0.1:4000`). nginx reverse-proxy config in `deploy/hostinger-nginx.conf`. Full runbook: [docs/hostinger-deployment.md](docs/hostinger-deployment.md). Backend architecture & endpoint reference: [docs/backend-architecture.md](docs/backend-architecture.md).

Two alternative one-config deploy targets exist (both run the same `npm run deploy:build`, then start both processes — `JWT_SECRET` must be identical across API and web since the `/admin` middleware verifies what the API signs): **Railway** ([railway.toml](railway.toml) + [railway-start.sh](railway-start.sh), single service, Next on public `$PORT` proxying to internal API :4000) and **Render** ([render.yaml](render.yaml) blueprint: `loden-api` + `loden-web` + a Postgres DB, with a shared `loden-secrets` env group).

## Conventions

- UI copy, enum-derived labels, and domain terms are in **French** — match existing wording.
- Brand palette (turquoise `#08AEB8` on white) and component contract are specified in `Cahier_Des_Charges_LODEN_Frontend.md`.
