# 02 — Formulaires & intégrations

Verdict : **solide.** Chaque endpoint public a une **validation Zod serveur ≥ à celle du client** ;
le montant de paiement est dérivé serveur (anti-fraude) ; toutes les intégrations (email, SMS,
WhatsApp, Stripe, IA) **dégradent proprement** sans clé. Les axes restants : **anti-spam** et
cohérence de flux.

Tableau des formulaires publics (tous validés Zod serveur) : inscription, contact/devis, CPF,
offre-50, avis, compte élève, login, mot de passe oublié/reset, chatbot IA.

---

## FORM-01 — Aucun honeypot / captcha sur les formulaires publics — **MOYEN** 🟠

**Fichiers :** tous les formulaires publics (`components/*Form.tsx`) — aucune occurrence
honeypot/captcha dans `app/`, `components/`, `backend/src/`.

**Problème :** le **rate-limiting est l'unique protection anti-bot**. Or chaque soumission
inscription/contact/offre déclenche des effets de bord coûteux :
`createLead` + `createChatAppointment` + `notifyNewLead` (email) + `qualifyLead` (appel LLM Groq)
— cf. `inscriptions.routes.ts:43-88`, `contacts.routes.ts:34-45`.

**Impact :** dans la limite de 20/min/IP, un bot génère de **vrais Lead + RDV** dans le CRM,
consomme le quota email/IA et pollue le pipeline. Amplification réelle : **1 POST = 1 email +
1 appel LLM**.

**Solution détaillée :** ajouter un **honeypot** (champ caché, ex. `website`/`company`, rejeté
côté serveur s'il est rempli) — coût quasi nul, très efficace contre les bots basiques :

```tsx
// Front : champ invisible (aria-hidden, tabIndex -1, hors flux)
<input type="text" name="website" tabIndex={-1} autoComplete="off"
  className="absolute left-[-9999px]" aria-hidden="true" />
```
```ts
// Serveur (dans le schéma Zod ou en amont du handler) :
if (typeof body.website === "string" && body.website.trim() !== "") {
  return res.status(204).end(); // on ignore silencieusement le bot
}
```

Pour les endpoints à effet de bord IA/email (inscription, offre, chat), envisager en plus un
**captcha invisible** (hCaptcha/Turnstile).

**Phase :** 2.

---

## FORM-02 — POST /api/reviews sans limiteur dédié — **MOYEN** 🟠

**Fichiers :** `backend/src/modules/reviews/reviews.routes.ts:63-91`, `app/avis/page.tsx:80`.

**Problème :** seul endpoint d'écriture public **sans `publicFormLimiter`** (uniquement le global
120/min). Voir aussi [SEC-04](./01-securite.md#sec-04).

**Impact :** dépôt d'avis en masse (~120/min/IP) saturant la file de modération.

**Solution détaillée :** ajouter `publicFormLimiter(config)` sur la route `POST /reviews`.

**Phase :** 2.

---

## FORM-03 — Le formulaire CPF ne crée qu'un CpfRequest (hors pipeline) — **MOYEN** 🟠

**Fichier :** `backend/src/modules/cpf/cpf.routes.ts:30-38`.

**Problème :** le formulaire CPF public crée **uniquement** un `CpfRequest` — aucun `Lead`, aucun
`ChatAppointment`, aucun `notifyNewLead`, aucun audit. Contrairement à inscription/contact/offre
qui alimentent pipeline + Centre RDV + alertent l'équipe.

**Impact :** une demande CPF **n'apparaît ni dans le pipeline, ni dans le Centre RDV unifié**, et
ne déclenche **aucune notification équipe** → risque de leads CPF non traités si personne ne
consulte `/admin/cpf`. Incohérence de flux.

**Solution détaillée :** aligner sur les autres formulaires : créer aussi un `Lead`
(`source="cpf"`) et/ou un `ChatAppointment`, et appeler `notifyNewLead(config, lead)`. À défaut,
documenter explicitement que `/admin/cpf` est le seul point de suivi CPF et notifier l'équipe.

**Phase :** 2.

---

## FORM-04 — Création de compte élève publique sans captcha ni vérif email préalable — **FAIBLE** 🟡

**Fichier :** `backend/src/modules/auth/auth.routes.ts:88-125`.

**Problème :** inscription libre-service (User `ELEVE` + `Student` créés immédiatement), sans
captcha, et le compte est **utilisable de suite** (le mail de vérif est best-effort).
Rate-limit 10/min/IP.

**Impact :** des bots peuvent créer des comptes élève (≤10/min/IP) polluant `User`/`Student`.

**Solution détaillée :** honeypot/captcha, ou exiger la vérification d'email pour débloquer les
actions sensibles (statut `PENDING_EMAIL` → `ACTIVE` seulement après clic).

**Phase :** 2-3.

---

## FORM-05 — Champs texte libres sans `.max()` — **FAIBLE** 🟡

**Fichiers :** `contacts.routes.ts:19`, `cpf.routes.ts:18`, `inscriptions.routes.ts:16-24`.

**Problème :** plusieurs champs n'ont pas de borne max : `contact.message` (min10, sans max),
`contact.source`, `cpf.internalNotes`, `fullName/firstName/lastName` (min2, sans max). Seul le
cap global `express.json 1mb` (`app.ts:77`) borne l'entrée.

**Impact :** stockage jusqu'à ~1 Mo par champ (bloat DB / logs). Pas de faille directe.

**Solution détaillée :** ajouter des `.max()` cohérents (ex. `message.max(2000)`, `source.max(120)`,
noms `.max(80)`), comme le fait déjà `offerLeadSchema` / `leadCreateSchema`.

**Phase :** 3.

---

## FORM-06 — `amountCents` envoyé par le client puis ignoré (code mort) — **FAIBLE** 🟡

**Fichiers :** `components/PaymentIntentForm.tsx:128-133` vs `payments.routes.ts:17-22,132-139`.

**Problème :** le formulaire envoie `amountCents` (calculé côté client) au `POST
/api/payments/payment-intents`. Le serveur l'**ignore** (le montant est relu depuis
`PricingPlan.priceCents` — anti-fraude correct). Le `clientSecret` retourné est aussi capturé
mais jamais exploité (pas de Stripe.js).

**Impact :** **aucun risque tarifaire** (serveur autoritatif), mais envoyer un montant client est
trompeur pour un futur mainteneur.

**Solution détaillée :** retirer `amountCents` du payload client (code mort côté serveur).

**Phase :** 4.

---

## FORM-07 — Upload media : confiance au `Content-Type` client — **FAIBLE** 🟡

**Fichier :** `backend/src/modules/media/media.routes.ts:47-62`.

**Problème :** `fileFilter` et le `mimeType` stocké se basent sur `file.mimetype` (en-tête fourni
par le client), pas sur une inspection de contenu (magic bytes).

**Impact :** un client peut déclarer `image/png` pour un contenu arbitraire. **Risque faible** :
upload réservé aux admins (`media.manage`), nom = `randomUUID` + extension dérivée d'une whitelist
MIME, servi en statique (jamais exécuté), SVG exclu.

**Solution détaillée :** optionnel — valider les **magic bytes** (lib `file-type`) pour durcir.
En l'état, exploitabilité quasi nulle.

**Phase :** 4.

---

## FORM-08 — Numéro WhatsApp codé en dur — **FAIBLE** 🟡

**Fichier :** `backend/src/modules/offers/offers.routes.ts:306-310`.

**Problème :** le numéro `"33660325087"` est codé en dur dans la réponse `whatsappUrl`, au lieu
de dériver de `config.WHATSAPP_BUSINESS_NUMBER` / `CompanyInfo` comme ailleurs (`whatsapp.ts:24-27`).

**Impact :** risque de divergence si le numéro change (édition code au lieu du CMS). Aucun impact
sécurité.

**Solution détaillée :** utiliser `buildWhatsAppUrl(config, companyInfo.phone, ...)`.

**Phase :** 3-4.

---

### Points forts formulaires (à préserver)
Validation Zod serveur systématique (client jamais source de vérité) · anti-fraude paiement
exemplaire (montant serveur, webhook signé HMAC + anti-rejeu) · flux mot de passe robuste
(anti-énumération, token SHA-256 usage unique, tokenVersion) · uploads cadrés (admin-only,
whitelist MIME, SVG exclu, 8 Mo, noms randomUUID) · **toutes les intégrations dégradent sans clé**
(email/WhatsApp/SMS/Stripe/IA en no-op/log, envois `void` fire-and-forget) · endpoints d'envoi
non exposés au public · numéros centralisés dans `data/site.ts`.
