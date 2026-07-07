# 01 — Sécurité & authentification (backend)

Verdict : **posture solide, aucune faille Critique.** Auth (bcrypt 12, JWT signé+expiré,
révocation par `tokenVersion`, anti-énumération reset), RBAC par permission, montant de
paiement dérivé serveur, webhook Stripe signé, Prisma paramétré (0 SQL brut), Zod partout.
Le principal axe de durcissement est le **cloisonnement multi-agences sur les accès par-id**.

---

## SEC-01 — IDOR multi-agences sur les routes `/:id` — **ÉLEVÉ** 🔴

**Fichiers :** `backend/src/modules/{invoices,quotes,contracts,cpf,exams,installments,leads,bookings,payments,vehicles}/*.routes.ts` — routes `GET/PATCH/DELETE "/:id"`.

**Problème :** Les endpoints de **liste** sont correctement restreints par agence via
`resolveScopedAgencyId`, mais les opérations **par-id** ne rappellent pas `assertAgencyAccess`.
Seuls `students`, `partners` et `appointments` l'appliquent aujourd'hui. Exemple
`invoices.routes.ts` : `GET /:id` (≈L59-67) et `PATCH /:id` (≈L82-103) relisent/modifient une
facture sans vérifier son `agencyId`.

**Impact :** Un membre du personnel de l'agence A (COMPTABLE, SECRETAIRE, MONITEUR…) disposant
de la permission `.read`/`.manage` peut **lire, modifier, émettre ou supprimer** une
facture/devis/contrat/paiement/lead/leçon/dossier CPF de l'agence B en connaissant ou en
énumérant son id. Fuite de confidentialité + atteinte à l'intégrité **entre agences** — critique
pour un produit vendu en multi-agences / SaaS.

**Preuve :** `grep -rn "assertAgencyAccess" backend/src/modules` ne remonte que students /
partners / appointments. Les autres modules chargent l'enregistrement puis répondent sans
contrôle de périmètre.

**Solution détaillée :** après chaque `findXById`, avant de répondre/écrire, ajouter le contrôle
déjà utilisé ailleurs. Modèle (à décliner sur chaque route `/:id` des 10 modules) :

```ts
const invoice = await repository.findInvoiceById(String(req.params.id));
if (!invoice) throw notFound("Facture introuvable");
await assertAgencyAccess(repository, req as AuthenticatedRequest, invoice.agencyId); // ← à ajouter
// ... suite (lecture / update / delete)
```

`assertAgencyAccess` (dans `backend/src/middleware/auth.ts`) laisse passer SUPER_ADMIN/DIRECTEUR
et vérifie l'appartenance d'agence sinon. **Ajouter un test** par module (accès id d'une autre
agence → 403). C'est la correction n°1 de la Phase 1.

**Phase :** 1 (urgence sécurité).

---

## SEC-02 — CSP conserve `script-src 'unsafe-inline'` en production — **MOYEN** 🟠

**Fichier :** `next.config.mjs:11`.

**Problème :** La CSP (par ailleurs excellente) garde `script-src 'self' 'unsafe-inline'` même
en prod (confirmé en live : header CSP renvoyé par nginx).

**Impact :** Réduit la défense en profondeur : en cas de point d'injection, un `<script>` inline
pourrait s'exécuter. Risque réel **faible** (React échappe par défaut, JSON-LD passe par
`safeJsonLd`), mais la CSP ne protège pas l'inline.

**Solution détaillée :** migrer vers des **nonces par requête** (Next.js les supporte via
middleware : générer un nonce, l'injecter dans le header CSP `script-src 'self' 'nonce-...'` et
sur les balises `<script>`). Le commentaire du fichier reconnaît déjà cette dette. Alternative
plus légère : accepter `'unsafe-inline'` (posture actuelle) en documentant le risque comme résiduel.

**Phase :** 3-4 (durcissement).

---

## SEC-03 — Token expiré renvoie 500 au lieu de 401 — **FAIBLE** 🟡

**Fichier :** `backend/src/middleware/auth.ts:33-34`.

**Problème :** le `catch` ne convertit en 401 que `error.name === "JsonWebTokenError"`. Un
`TokenExpiredError` (nom distinct) tombe dans le `else` et est relayé brut → `errorHandler`
renvoie **500**.

**Impact :** un token **expiré** produit une 500 (au lieu d'un 401). Fail-closed (aucun accès
accordé), mais sémantique erronée + bruit dans les logs + UX dégradée (le front ne sait pas
qu'il doit relancer une connexion).

**Solution détaillée :**

```ts
} catch (error) {
  if (error instanceof jwt.JsonWebTokenError) { // couvre JsonWebTokenError, TokenExpiredError, NotBeforeError
    throw unauthorized("Session invalide ou expirée");
  }
  throw error;
}
```

**Phase :** 2.

---

## SEC-04 — POST /api/reviews sans limiteur dédié — **FAIBLE** 🟡

**Fichier :** `backend/src/modules/reviews/reviews.routes.ts:63-91`.

**Problème :** dépôt d'avis **public** (via `optionalAuthenticate`) — seul endpoint d'écriture
public **sans `publicFormLimiter`**. Couvert uniquement par le rate-limit global (120/min),
contre 20/min pour inscriptions/contacts/cpf/offers. (Doublon avec [FORM-01](./02-formulaires-integrations.md#form-01).)

**Impact :** un bot peut inonder la file de modération (`EN_ATTENTE`) à ~120 req/min. La
modération avant publication + l'échappement React évitent le XSS stocké, mais la file peut
être polluée.

**Solution détaillée :** ajouter `publicFormLimiter(config)` sur la route `POST /reviews`, comme
les autres formulaires publics.

**Phase :** 2.

---

## SEC-05 — /qr-50 fait un scan complet `listLeads()` — **FAIBLE** 🟡

**Fichier :** `backend/src/modules/offers/offers.routes.ts:181-189`.

**Problème :** la route publique `/qr-50` exécute `repository.listLeads()` (scan complet de la
table Lead) à chaque requête pour dédupliquer par téléphone.

**Impact :** à fort volume de leads, chaque soumission publique parcourt tout le référentiel →
amplification de charge (DoS applicatif) exploitable.

**Solution détaillée :** remplacer par une requête indexée. Ajouter un `findLeadByPhone(phone)`
au repository (avec `@@index([phone])` côté Prisma si absent) et l'utiliser à la place du
`listLeads()` complet.

**Phase :** 2-3.

---

## SEC-06 — Un DIRECTEUR peut neutraliser un SUPER_ADMIN — **FAIBLE** 🟡

**Fichier :** `backend/src/modules/users/users.routes.ts:95-106`.

**Problème :** `PATCH /:id` (`users.manage` = SUPER_ADMIN/DIRECTEUR) n'empêche pas un DIRECTEUR
de rétrograder/suspendre un SUPER_ADMIN, ni l'auto-verrouillage (self-lockout). Le rôle cible
est bien limité à `STAFF_ROLES` (pas de création de SUPER_ADMIN — bon), mais un SUPER_ADMIN
existant reste modifiable.

**Impact :** un DIRECTEUR pourrait archiver/rétrograder un SUPER_ADMIN. Impact limité (DIRECTEUR
est déjà quasi tout-puissant).

**Solution détaillée :** interdire la modification d'un compte de rôle **≥** au sien, et bloquer
le self-lockout (un admin ne peut pas se retirer son propre accès / se suspendre).

**Phase :** 3.

---

## SEC-07 — GET /api/site expose toutes les SiteSetting — **INFO** ⚪

**Fichier :** `backend/src/modules/site/site.routes.ts:112-138`.

**Problème :** `GET "/"` (public) renvoie l'intégralité des `SiteSetting` en map, et `GET "/:key"`
n'importe quelle clé. Aujourd'hui **non sensible** (nav, hero, cache avis Google publics).

**Impact :** si un secret venait un jour à être stocké dans une `SiteSetting`, il fuiterait
publiquement.

**Solution détaillée :** maintenir une **allowlist** de lecture publique (miroir d'`ALLOWED_KEYS`)
et ne **jamais** stocker de secret côté `SiteSetting`. Point de vigilance, pas un défaut actuel.

**Phase :** 4 (documentation / garde-fou).

---

### Points forts sécurité (à préserver)
Auth robuste (bcrypt 12, tokenVersion, reset SHA-256 usage unique, anti-énumération) · RBAC réel
`requirePermission` · middleware Next fail-closed (verifyJwt edge, secret absent en prod = refus)
· cookie `httpOnly`+`secure`+`sameSite=lax`, JWT jamais exposé au navigateur · tous les
`dangerouslySetInnerHTML` passent par `safeJsonLd` · 0 SQL brut (Prisma paramétré) · paiement
montant serveur + webhook Stripe signé · garde-fous prod `env.ts` intacts · rate-limiting étagé ·
`x-powered-by` désactivé côté API, erreurs masquées en prod, aucun secret commité.
