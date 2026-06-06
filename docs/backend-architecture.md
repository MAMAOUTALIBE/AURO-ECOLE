# Backend LODEN

## Stack

- Node.js + Express structuré
- TypeScript
- Prisma ORM + PostgreSQL
- Zod pour les DTO
- JWT Bearer pour l'authentification
- Helmet, CORS et rate limit
- Vitest + Supertest pour les tests API

## Démarrage

```bash
cp .env.example .env
npm run prisma:generate
npm run api:dev
```

Par défaut, si `DATABASE_URL` est absent ou si `API_USE_MEMORY=true`, l'API utilise un repository mémoire avec les données de démonstration du frontend.

Compte administrateur mémoire local :

- email : `admin@loden-autoecole.fr`
- mot de passe : `admin-password`

## Scripts

```bash
npm run api:typecheck
npm run api:build
npm run api:test
npm run prisma:generate
```

## Endpoints principaux

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users` admin
- `GET /api/students/me`
- `GET /api/students` admin
- `GET /api/leads` admin
- `POST /api/leads` admin
- `PATCH /api/leads/:id/status` admin
- `GET /api/formations`
- `POST /api/formations` admin
- `GET /api/pricing-plans`
- `GET /api/tarifs` alias public des packs tarifaires
- `GET /api/instructors`
- `GET /api/bookings/slots`
- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/payments`
- `POST /api/payments/payment-intents`
- `POST /api/cpf/requests`
- `GET /api/cpf/requests` admin
- `PATCH /api/cpf/requests/:id/status` admin
- `POST /api/contact-requests`
- `GET /api/contact-requests` admin
- `PATCH /api/contact-requests/:id/status` admin
- `GET /api/reviews`
- `GET /api/reviews?includeUnpublished=true` admin
- `POST /api/reviews`
- `PATCH /api/reviews/:id/status` admin
- `GET /api/search?q=permis accéléré`

## Rôles

- `SUPER_ADMIN`
- `ADMIN`
- `MONITEUR`
- `ELEVE`
- `VISITEUR`

Les routes d'administration utilisent `Authorization: Bearer <token>` et `requireRoles`.

## Connexion frontend/backend

Le frontend peut remplacer progressivement les mocks dans `data/site.ts` par des fetchers ciblant :

- `GET /api/formations` pour la page formations et les cartes d'accueil.
- `GET /api/pricing-plans` ou `GET /api/tarifs` pour les tarifs et le simulateur.
- `GET /api/instructors` pour les moniteurs.
- `GET /api/bookings/slots` pour le calendrier.
- `GET /api/search?q=...` pour l'overlay de recherche globale.
- `POST /api/contact-requests` pour le formulaire contact.
- `POST /api/cpf/requests` pour les demandes CPF.

Le frontend expose aussi des proxies same-origin Next.js configurables avec `LODEN_API_URL` :

- `GET /api/search`
- `POST /api/auth/register`
- `GET /api/formations`
- `GET /api/tarifs`
- `GET /api/instructors`
- `GET /api/reviews`
- `GET /api/users`
- `GET /api/students`
- `GET /api/leads`
- `POST /api/leads`
- `GET /api/bookings/slots`
- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/payments`
- `POST /api/payments/payment-intents`
- `GET /api/contact-requests`
- `GET /api/cpf/requests`
- `POST /api/contact-requests`
- `POST /api/cpf/requests`

Les pages `/formations`, `/tarifs`, `/paiement`, `/espace-eleve` et `/admin` consomment ces proxies côté client avec fallback sur `data/site.ts` lorsque le backend public est indisponible. Les endpoints élève et admin protégés relaient le JWT stocké côté navigateur vers l'API.

Conserver les DTO Zod côté frontend pour mapper les réponses API avant affichage.
