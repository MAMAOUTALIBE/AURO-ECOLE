# LODEN — Runbook de déploiement (CRM inclus)

État au moment de la rédaction : Sprints 0 → 3 (partiel) livrés. 14 tests verts, `deploy:check` vert.
8 modules CRM opérationnels : Cockpit · Pipeline · Planning · Examens · Élèves (dossier + compétences) · Finance (paiements + échéances) · Avis · CPF.

---

## 1. Prérequis serveur
- Node `>=22 <25`, npm `>=10`, PM2.
- PostgreSQL (≥ 13 recommandé — les migrations utilisent `ALTER TYPE ... ADD VALUE`).
- Nginx + certificat HTTPS (voir [deploy/hostinger-nginx.conf](../deploy/hostinger-nginx.conf)).

## 2. Variables d'environnement
Copier [.env.production.example](../.env.production.example) → `.env` sur le serveur et compléter :
- `DATABASE_URL` (Postgres réel) · `JWT_SECRET` (≥32 car. aléatoire) · `CORS_ORIGIN` (domaine) · `API_USE_MEMORY=false`
- `LODEN_ADMIN_EMAIL` / `LODEN_ADMIN_PASSWORD` (admin initial du seed)
- Optionnel notifications : `RESEND_API_KEY`, `MAIL_FROM`, `LODEN_NOTIFY_TO` (sinon les notifications passent en log)

⚠️ En production l'API refuse de démarrer si `JWT_SECRET` est faible, si `DATABASE_URL` manque, ou si `API_USE_MEMORY=true` (garde-fou dans `backend/src/config/env.ts`).

## 3. Build
```bash
npm ci
npm run deploy:build   # prisma generate + compile backend (dist/backend) + build Next
```

## 4. Base de données
```bash
npm run db:migrate:deploy   # applique les 6 migrations dans l'ordre
npm run db:seed             # agences (République, Nation) + admin + catalogue + moniteurs
```
Migrations appliquées (ordre lexicographique) :
1. `20260607120000_initial_loden`
2. `20260607210000_extend_user_role` — rôles CRM (enum)
3. `20260607210100_add_agencies` — Agency / AgencyMembership + `agencyId`
4. `20260607230000_add_exams` — Exam (+ taux de réussite)
5. `20260607234500_add_student_skills` — compétences REMC
6. `20260607235500_add_installments` — échéances 3×/4×

> ✅ Vérification recommandée AVANT prod : sur une base de dev, lancer `npx prisma migrate dev`
> (ou `npx prisma migrate status`) pour confirmer l'absence de drift entre migrations et schéma.

## 5. Démarrage (PM2)
```bash
pm2 start ecosystem.config.cjs --env production   # loden-api (4000) + loden-web (3000)
pm2 save
```

## 6. Smoke test post-déploiement
1. `GET /api/health` → `200`.
2. Aller sur `/connexion`, se connecter avec l'admin → redirection vers `/admin`.
3. `/admin` sans session → redirige vers `/connexion` (middleware).
4. Cockpit affiche des chiffres ; tester un parcours : créer/éditer un élève, déplacer un prospect, programmer un examen, enregistrer un paiement, générer un échéancier.
5. Soumettre le formulaire de contact public → un prospect apparaît dans le pipeline (+ email si `RESEND_API_KEY` configuré).

## 7. Rôles & accès CRM
Connexion via `/connexion`. Rôles autorisés sur `/admin` (tout sauf `ELEVE`/`VISITEUR`) :
`SUPER_ADMIN, DIRECTEUR, RESPONSABLE_AGENCE, RESPONSABLE_PEDAGOGIQUE, ADMIN, SECRETAIRE, COMPTABLE, MONITEUR`.
Permissions fines par module dans `backend/src/domain/permissions.ts`.

## 8. Reste à brancher (hors périmètre actuel)
- Webhooks Stripe réels (route stub présente : `POST /api/payments/stripe/webhook`).
- Factures PDF.
- Relances automatiques impayés (worker/cron) — l'adaptateur email est prêt.
- Vrais handles réseaux sociaux dans `components/SocialIcons.tsx`.
