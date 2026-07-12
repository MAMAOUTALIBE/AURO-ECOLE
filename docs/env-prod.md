# Variables d'environnement — production (VPS)

> Récapitulatif pratique. Source de vérité côté API : [backend/src/config/env.ts](../backend/src/config/env.ts)
> (validation Zod + garde-fous prod). Deux process PM2 : `loden-web` (Next :3000) et
> `loden-api` (Express :4000), cf. [ecosystem.config.cjs](../ecosystem.config.cjs).
>
> 🔒 **Ne jamais** committer de secret ni le préfixer `NEXT_PUBLIC_` (exposé au navigateur).
> Seules des valeurs **non secrètes** peuvent être `NEXT_PUBLIC_`.

## 1. Process WEB (`loden-web`, Next, :3000)
| Variable | Valeur / rôle | Obligatoire |
|---|---|---|
| `NODE_ENV` | `production` | ✅ |
| `PORT` | `3000` | ✅ |
| `LODEN_API_URL` | `http://127.0.0.1:4000` (proxy interne vers l'API) | ✅ |
| `JWT_SECRET` | **identique à celui de l'API** (le middleware `/admin` vérifie le cookie signé par l'API) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://lodene.fr` (domaine canonique — sitemap/robots/OG/JSON-LD en dérivent) | ✅ |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | code fourni par Google Search Console (injecte la balise meta) | SEO |

## 2. Process API (`loden-api`, Express, :4000)
### Obligatoires en production (sinon l'API refuse de démarrer)
| Variable | Contrainte |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | PostgreSQL — **requis** (`API_USE_MEMORY` interdit en prod) |
| `JWT_SECRET` | ≥ 32 caractères, aléatoire, **≠** valeurs de dev — **identique au WEB** |
| `JWT_EXPIRES_IN` | défaut `7d` (optionnel) |
| `CORS_ORIGIN` | allowlist séparée par virgules, ex. `https://lodene.fr,https://www.lodene.fr` |
| `APP_BASE_URL` | `https://lodene.fr` (liens des emails ; à défaut = 1ʳᵉ origine CORS) |

### Garde-fous prod (dans `config/env.ts`) — l'API **ne démarre pas** si :
- `JWT_SECRET` est une valeur de dev connue, contient `CHANGE_ME`, ou fait < 32 caractères ;
- `DATABASE_URL` est absent **ou** `API_USE_MEMORY=true` ;
- `API_DEMO_SEED=true` ;
- `STRIPE_SECRET_KEY` est défini **sans** `STRIPE_WEBHOOK_SECRET`.
> ➡️ En prod, laisser `API_USE_MEMORY` et `API_DEMO_SEED` **non définis** (ou `false`).

## 3. SEO & mesure d'audience (optionnel mais recommandé)
| Variable | Process | Rôle |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | web | Validation Google Search Console |
| `GOOGLE_PLACES_API_KEY` | api | Synchronisation des **vrais** avis Google (+ Place ID dans le SiteSetting `google.reviews`). Sans clé → mode manuel. |
| `MATOMO_URL` | api | Instance Matomo |
| `MATOMO_SITE_ID` | api | ID du site Matomo |
| `MATOMO_API_TOKEN` | api | Token Reporting (secret) → dashboard `/admin/trafic`. Sans ces 3 → repli sur KPI CRM. |

## 4. Intégrations optionnelles (dégradent en no-op si absentes — rien ne casse)
| Domaine | Variables | Sans configuration |
|---|---|---|
| IA (chatbot + assistant CRM) | `GROQ_API_KEY` (+ `AI_PROVIDER` déf. `groq`, `AI_MODEL` déf. `llama-3.3-70b-versatile`) | message « IA désactivée » |
| Email (Resend) | `RESEND_API_KEY` + `MAIL_FROM` | envoi en log seulement |
| Email (SMTP alternatif) | `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `SMTP_FROM` | envoi en log seulement |
| Destinataires de notif | `LODEN_NOTIFY_TO`, `OWNER_ALERT_EMAIL` | pas d'alerte email |
| SMS | `SMS_API_KEY` (+ `SMS_SENDER`) | SMS en log |
| WhatsApp | `WHATSAPP_PROVIDER` `WHATSAPP_PHONE_NUMBER_ID` `WHATSAPP_ACCESS_TOKEN` (+ `WHATSAPP_BUSINESS_NUMBER`, template) | liens `wa.me` seulement (pas d'envoi API) |
| Paiement Stripe | `STRIPE_SECRET_KEY` **+** `STRIPE_WEBHOOK_SECRET` (obligatoire ensemble en prod) | mode mock (aucun débit) |

## 5. Rappel déploiement
```bash
# sur le VPS, après git pull de la branche mergée :
npm ci
npm run deploy:build          # prisma generate + api:build + build Next
npm run db:migrate:deploy     # si nouvelles migrations Prisma
pm2 reload ecosystem.config.cjs
pm2 status                    # loden-api + loden-web = online
# vérifs post-deploy :
#   https://lodene.fr/robots.txt   https://lodene.fr/sitemap.xml
#   redirection /permis-b-paris-11 -> /permis-b-conflans-sainte-honorine (301/308)
pm2 logs --lines 50           # contrôle des erreurs au démarrage
```
> Rollback : `git revert` du merge → `npm run deploy:build` → `pm2 reload`.
