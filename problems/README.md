# Audit global LODENE — Dossier des problèmes

> Audit en **lecture seule** (aucune correction appliquée). Réalisé par une équipe d'audit
> (architecte, sécurité, QA, UX mobile, backend/API, SEO/perf, DevOps/RGPD) + contrôles
> runtime live sur `https://lodene.fr`. Date : 2026-07-07.

Chaque fichier de ce dossier détaille les problèmes d'une catégorie : **description précise,
fichiers concernés, impact, preuve, et solution détaillée** (avec extraits de code). Aucun
correctif n'a été appliqué au code — voir [`PLAN-CORRECTION.md`](./PLAN-CORRECTION.md) pour
l'ordre d'exécution recommandé, à valider avant toute modification.

## Résumé exécutif

**État général : bon.** Le site est **fonctionnel, déployé et globalement bien construit**.
La posture de sécurité est **solide** (aucune faille critique), les performances sont bonnes
(Lighthouse Perf 94, A11y/BP/SEO 100, CLS 0), et l'architecture est propre. Les problèmes
identifiés sont surtout des **durcissements** et **finitions** avant une exploitation grand public.

- **Niveau de risque global :** Moyen-faible.
- **Aucune faille Critique de sécurité.** 1 point de sécurité **Élevé** (IDOR multi-agences).
- **3 bloquants "go-live" réels** : dépendance `nodemailer` vulnérable (Élevé), mentions
  légales incomplètes (obligation LCEN), et 1 image logo de 744 Ko chargée sur toutes les pages.
- **Runtime live vérifié sain** : headers de sécurité complets, routes privées protégées (307),
  API protégées (401), aucune fuite de secret dans le HTML, CORS restrictif, 404 correct.

## Fichiers du dossier

| Fichier | Catégorie | Problèmes | Gravité max |
|---|---|---|---|
| [01-securite.md](./01-securite.md) | Sécurité & auth backend | 7 | Élevé |
| [02-formulaires-integrations.md](./02-formulaires-integrations.md) | Formulaires & intégrations | 8 | Moyen |
| [03-config-deps-rgpd.md](./03-config-deps-rgpd.md) | Config, dépendances & RGPD | 11 | Élevé |
| [04-ux-mobile.md](./04-ux-mobile.md) | UX / mobile / accessibilité | 7 | Élevé |
| [05-performance.md](./05-performance.md) | Performance & images | 9 | Critique |
| [06-runtime-live.md](./06-runtime-live.md) | Contrôles runtime live (prod) | 4 | Faible |
| 07-routes-seo.md | Routes, navigation & SEO | _(en cours de finalisation)_ | — |
| [PLAN-CORRECTION.md](./PLAN-CORRECTION.md) | Plan priorisé 4 phases + tests | — | — |

## Barème de gravité

- **Critique** : à corriger immédiatement (blocage, faille exploitable, perte de données).
- **Élevé** : à corriger avant mise en avant commerciale / montée en charge.
- **Moyen** : à corriger rapidement, impact réel mais contenu.
- **Faible** : amélioration / durcissement, sans urgence.
- **Info** : point de vigilance, pas un défaut actuel.

## Top priorités (extrait — détail dans PLAN-CORRECTION.md)

1. **[Élevé]** IDOR multi-agences : ajouter `assertAgencyAccess` sur les routes `/:id` de
   invoices/quotes/contracts/cpf/exams/installments/leads/bookings/payments/vehicles → [01](./01-securite.md#sec-01).
2. **[Élevé]** Mettre à jour `nodemailer` (8 advisories high) → [03](./03-config-deps-rgpd.md#conf-01).
3. **[Critique/perf]** Logo PNG 744 Ko → SVG existant ; supprimer 820 Ko d'assets morts → [05](./05-performance.md#perf-01).
4. **[Élevé]** Compléter les mentions légales (hébergeur, directeur de publication, forme juridique) → [03](./03-config-deps-rgpd.md#conf-07).
5. **[Élevé/UX]** Titres de hero tronqués sur mobile (`whitespace-nowrap`) → [04](./04-ux-mobile.md#ux-01).
6. **[Élevé/perf]** Pages publiques en `no-store` → ISR (coût backend en prod) → [05](./05-performance.md#perf-03).
