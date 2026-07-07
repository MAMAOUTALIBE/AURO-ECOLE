# 03 — Configuration, dépendances & RGPD

Verdict : **base saine** (garde-fous prod intacts, 0 secret en dur, TS strict, stack à jour sans
CVE connue). Points bloquants go-live : **nodemailer vulnérable**, **mentions légales
incomplètes** (obligation LCEN), et le **bug devDeps du runbook de déploiement**.

---

## CONF-01 — `nodemailer` 6.10.1 : 8 advisories HIGH (dépendance runtime) — **ÉLEVÉ** 🔴

**Fichier :** `package.json` (`nodemailer ^6.10.1`).

**Problème :** `npm audit` remonte **3 vulnérabilités (1 low, 2 high)** ; `--omit=dev` en garde
**1 high en production**. `nodemailer@6.10.1` cumule 8 advisories high : injection de commande
SMTP (`envelope.size`, CRLF EHLO/HELO), injection d'en-tête CRLF, SSRF + lecture de fichier
arbitraire (`raw`/`jsonTransport` contournent `disableFileAccess`/`disableUrlAccess`), bypass TLS
OAuth2, DoS addressparser. C'est une **dépendance runtime** (emails de notif + réinitialisation
de mot de passe).

**Impact :** injection / SSRF / exfiltration via l'envoi d'emails serveur.

**Solution détaillée :**
```bash
npm i nodemailer@^9        # breaking major — ou: npm audit fix --force
npm run api:test           # re-tester le module email (shared/mailer.ts)
```
Vérifier la compat API v9 dans `backend/src/shared/mailer.ts` (createTransport, sendMail restent
compatibles ; contrôler les options utilisées). **À prioriser (Phase 1).**

**Phase :** 1.

---

## CONF-02 — Runbook Hostinger : `npm ci` supprime les devDeps → build cassé — **ÉLEVÉ** 🔴

**Fichier :** `docs/hostinger-deployment.md:159-164` (« Commandes de mise à jour »).

**Problème :** la séquence `set -a; . ./.env.production; set +a` (fixe `NODE_ENV=production`)
**avant** `npm ci` → `npm ci` élague les devDependencies, puis `npm run deploy:build`
(next build + `tsc` backend + tailwind, tous en devDeps) **échoue**
(`Could not find declaration file for 'express'`). *(Bug réellement rencontré lors du dernier
déploiement.)*

**Impact :** toute mise à jour prod suivant le runbook casse le build.

**Solution détaillée :** dans le runbook, remplacer `npm ci` par **`npm ci --include=dev`** (ou
charger `.env.production` **après** le `npm ci`). L'install initiale (ligne 70) est correcte car
`npm ci` y précède le chargement de l'env.

**Phase :** 1 (doc — évite de recasser au prochain déploiement).

---

## CONF-03 — `render.yaml` : même piège devDeps — **MOYEN** 🟠

**Fichier :** `render.yaml:34` (loden-api) et `:53` (loden-web).

**Problème :** `npm ci && npm run build` (et `… api:build`) s'exécutent avec `NODE_ENV=production`
défini en env de service → devDeps (typescript, tailwind, autoprefixer, eslint-config-next)
élaguées, build cassé. Le blueprint Render est non fonctionnel en l'état.

**Solution détaillée :** `npm ci --include=dev` dans les deux `buildCommand`.

**Phase :** 3 (si Render est une cible active).

---

## CONF-04 — nginx : pas de TLS/redirection ni headers dans la conf versionnée — **MOYEN** 🟠

**Fichier :** `deploy/hostinger-nginx.conf`.

**Problème :** écoute uniquement en `:80`, **sans bloc TLS ni redirection HTTP→HTTPS** dans la
conf versionnée (dépend d'un `certbot --nginx` manuel qui réécrit le fichier), et nginx **ne pose
aucun header de sécurité** lui-même. *(En pratique, les headers HSTS/X-Frame/CSP sont posés par
Next et traversent le proxy — vérifié en live, ils atteignent bien le client.)*

**Impact :** fenêtre de service en clair tant que certbot n'a pas tourné ; couche edge non durcie.

**Solution détaillée :** ajouter dans la conf versionnée une redirection `301` `:80` → HTTPS, et
idéalement HSTS au niveau nginx (défense en profondeur, en plus de Next).

**Phase :** 3.

---

## CONF-05 — `.gitignore` ne couvre pas les backups `.env*.bak` — **MOYEN** 🟠

**Fichier :** `.gitignore`.

**Problème :** ignore `.env`, `.env.local`, `.env.production` **à l'exact**, mais pas de motif
générique : `.env.production.local`, `.env.staging`, et surtout les backups **`.env*.bak`** ne
sont **pas** ignorés. *(Rappel : des `.env.production.bak-*` existent sur le serveur.)*

**Impact :** risque de commit accidentel d'un `.env.production.bak` contenant
JWT_SECRET/DATABASE_URL/clés.

**Solution détaillée :**
```gitignore
.env*
!.env.example
!.env.production.example
```

**Phase :** 1 (rapide, évite une fuite).

---

## CONF-06 — `JWT_SECRET` plancher 16 + défaut dev hors prod — **FAIBLE** 🟡

**Fichier :** `backend/src/config/env.ts:7`.

**Problème :** `JWT_SECRET` `.min(16)` avec défaut `"dev-secret-change-me"` ; le plancher 16 et le
défaut ne s'appliquent qu'hors prod (la prod exige 32 + hors blocklist). Footgun si un
environnement de **staging** tourne avec `NODE_ENV≠production`.

**Solution détaillée :** optionnel — porter le plancher à 32 partout.

**Phase :** 4.

---

## CONF-07 — Mentions légales incomplètes (obligation LCEN) — **MOYEN** 🟠

**Fichiers :** `app/mentions-legales/page.tsx`, `data/site.ts:71-84`.

**Problème :** `legalName`, `legalForm`, `capital`, `publicationDirector`, `hostingProvider` sont
**vides** (`""`) ; la page affiche des placeholders (« à compléter »). Or la **LCEN art. 6-III**
impose forme juridique, capital, directeur de la publication, et hébergeur (nom+adresse+téléphone).

**Impact :** **non-conformité légale** à la mise en ligne publique.

**Solution détaillée :** renseigner ces champs dans `data/site.ts` (SIRET `84282888100040` et
agrément `E2507800260` sont déjà réels). Hébergeur = Hostinger (adresse + tél à indiquer).

**Phase :** 1-2 (bloquant go-live légal, mais purement du contenu).

---

## CONF-08 — Politique de confidentialité lacunaire (RGPD art. 13) — **MOYEN** 🟠

**Fichier :** `app/confidentialite/page.tsx`.

**Problème :** pas de **base légale** des traitements, pas de mention du **droit de réclamation
CNIL**, droits d'opposition/portabilité non explicités, pas de **DPO/référent** identifié, durées
de conservation vagues (non chiffrées).

**Solution détaillée :** compléter : base légale par traitement, durées chiffrées, droits complets
(accès/rectification/effacement/opposition/portabilité), contact référent, mention CNIL.

**Phase :** 2.

---

## CONF-09 — Formulaires publics : PII collectée sans mention au point de collecte — **FAIBLE** 🟡

**Fichiers :** `app/inscription/page.tsx`, `app/contact/page.tsx`, `app/cpf`, `inscriptions.routes.ts:83`.

**Problème :** les formulaires publics collectent des données perso (nom, email, tél, objectif,
financement, dispo, message) **sans case de consentement ni note d'information ni lien vers
`/confidentialite`** au point de collecte (seul le Footer y renvoie). L'inscription force
`consentContact:true` en dur. *(À l'inverse, chatbot et offre-50 ont bien des cases `z.literal(true)`.)*

**Solution détaillée :** ajouter sous chaque formulaire public une mention + lien « données
traitées conformément à notre politique de confidentialité ».

**Phase :** 2.

---

## CONF-10 — `form-data` (dev) CRLF injection — **FAIBLE** 🟡

**Fichier :** `node_modules/form-data@4.0.5` (via `supertest`/`@types/supertest`).

**Problème :** advisory CRLF injection — **dev-only** (chaîne de test), non livré en prod.

**Solution détaillée :** `npm audit fix` (non-breaking) au prochain cycle.

**Phase :** 4.

---

## CONF-11 — Cookie session `sameSite=lax` + 7 j pour l'admin — **FAIBLE** 🟡

**Fichier :** `app/api/auth/login/route.ts`.

**Problème :** `sameSite:"lax"` (pas `strict`) et `maxAge` 7 j pour une session admin. Acceptable,
mais `strict` + durée plus courte durciraient la session CRM.

**Solution détaillée :** optionnel — `sameSite:"strict"` et/ou durée plus courte pour les rôles admin.

**Phase :** 4.

---

### Points forts config/RGPD (à préserver)
Garde-fous prod `env.ts` solides · 0 secret en dur, aucun `.env` réel commité, aucun log sensible ·
cookie session exemplaire (httpOnly+secure+JWT non exposé) · **headers de sécurité complets côté
Next** (CSP enforced, HSTS preload 2 ans, X-Frame DENY, nosniff, Referrer/Permissions-Policy) ·
backend durci (helmet + CORS allowlist + rate-limit + trust proxy + body 1 Mo) · **analytics
RGPD-by-design** (Matomo sans cookie/DNT, GA4 Consent Mode denied → exemption CNIL, pas de bannière
nécessaire) · TS strict, pas d'`ignoreBuildErrors`, `deploy:check` complet · stack sans CVE connue
(Next 15.5.19 corrige CVE-2025-29927, React 19, Express 5, Prisma 6).
