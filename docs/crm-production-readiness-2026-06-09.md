# Audit de préparation production — CRM LODENE

*Lead Architect + Product Manager · 2026-06-09 · branche `feature/ai-crm-ui-security`*
*Méthode : 15 agents spécialisés (9 clusters de modules + carte API + workflows + sécurité + performance), synthèse, puis revue adversariale.*

---

## 1. Synthèse exécutive

**Note globale de complétude : ~38 %** brute (32 modules) ; **~33 % corrigée** après revue adversariale (retrait des doublons de nav Prospects/Leçons et réajustement des scores optimistes) ; **~30 %** si l'on pénalise la *readiness* pour les blocages sécurité P0.

Sur les 32 entrées de navigation : **~10 écrans live distincts** câblés au backend Express via les proxies Next, **2 doublons de nav** (Prospects→pipeline, Leçons→planning), le reste en **stubs `/admin/bientot` honnêtes ou absents**.

**Constats clés :**

1. **Fondation live saine et honnête** — les écrans live appellent de vrais endpoints, RBAC `requirePermission` réel, vraie persistance. **Aucune métrique métier simulée/codée en dur.** Les zéros sont du *vide-par-conception* (repo seedé sans données), pas des défauts.
2. **IDOR multi-agences (P0)** — `stats/students/payments/exams/installments/leads` acceptent un `agencyId` client **sans vérifier `AgencyMembership`** ; le repo mémoire renvoie en plus les lignes `agencyId==null` pour tout filtre. Fuite inter-agences exploitable.
3. **Capacités backend rendues inaccessibles** (gains rapides frontend) — CPF, modération avis, moniteurs, création de leçon, édition formations : routes + RBAC existent mais proxy/écran manquants.
4. **Domaines métier absents** — Devis, Contrats, Factures, Emails/SMS/Campagnes/Relances, CMS Pages/Blog/Médias, journaux d'audit lisibles, gestion utilisateurs/permissions à l'exécution, Véhicules.
5. **Dashboard cassé pour 7 rôles sur 9** — un 403 sur un appel auxiliaire (`/api/reviews?includeUnpublished=true`, gardé par littéraux `SUPER_ADMIN/ADMIN`) verrouille tout l'écran. **Seuls SUPER_ADMIN et ADMIN voient le dashboard** (même DIRECTEUR est bloqué). **Premier correctif.**

---

## 2. Tableau par module

Légende : **Live** = câblé/fonctionnel · **Partiel** = écran réutilisé / incomplet · **Stub** = placeholder honnête · **Absent** = aucune surface.

### A — Pilotage, Reporting & Logs
| Module | Statut | % | API | Permissions | Problèmes clés |
|---|---|---|---|---|---|
| Dashboard | Live | 75 % | Connectée (7) | Partielle | Verrou total sur 403 auxiliaire (`CrmDashboard.tsx:110-113`) → 7 rôles bloqués ; pas d'état 503 ; liens Avis/CPF en cul-de-sac |
| Reporting | Live | 55 % | Connectée | Appliquée | **Vecteur IDOR actif** (fan-out `/api/admin/stats` par agence) ; N+1 non isolé ; pas de période/export/tri/charts |
| Logs | Absent | 10 % | Absente | Morte | `listAuditLogs` non exposé ; `audit.read` morte ; écritures IA-only |

### B — Commercial
| Module | Statut | % | API | Permissions | Problèmes clés |
|---|---|---|---|---|---|
| Leads | Live | 65 % | Connectée | Appliquée | Pas de création en UI ; `score`/`nextFollowUpAt` ignorés ; pas de refetch agence |
| Prospects | Doublon nav | — | — | — | Pointe sur `/admin/pipeline` (= Leads) |
| Devis | Stub | 5 % | Absente | Aucune | Aucun modèle Quote |
| Contrats | Stub | 3 % | Absente | Aucune | Obligation légale non couverte |
| Relances | Stub | 15 % | Absente | Aucune | `nextFollowUpAt`/`RELANCE` modélisés mais aucun scheduler/worklist |

### C — Pédagogie & Catalogue
| Module | Statut | % | API | Permissions | Problèmes clés |
|---|---|---|---|---|---|
| Élèves | Live | 80 % | Connectée | Appliquée | Pas de pagination/recherche ; mot de passe temporaire en cul-de-sac ; formations sans mapper |
| Dossiers (fiche) | Live | 80 % | Connectée | Appliquée | Plus riche ; **href document non assaini (`javascript:` → XSS stocké, HIGH)** ; suppression sans confirmation ; erreurs silencieuses |
| Moniteurs | Stub | 15 % | **Backend complet, écran absent** | Appliquée | POST/PATCH + proxies prêts inutilisés → **gain rapide #1** |
| Formations | Absent | 10 % | Partielle | Partielle | Pas de nav ; proxy GET seul → écriture `catalog.manage` inaccessible |

### D — Planning & Examens
| Module | Statut | % | API | Permissions | Problèmes clés |
|---|---|---|---|---|---|
| Planning | Live | 70 % | Connectée | Partielle | **Pas de création de leçon en UI** ; ignore l'agence ; `GET /api/bookings` sans guard |
| Leçons | Doublon nav | — | — | — | Alias de Planning |
| Examens | Live | 70 % | Connectée | Appliquée | `score` jamais capturé/affiché (promesse taux de réussite creuse) ; ignore l'agence ; pas de delete/edit |

### E — Finance & Engagement
| Module | Statut | % | API | Permissions | Problèmes clés |
|---|---|---|---|---|---|
| Paiements | Live | 70 % | Connectée | Appliquée | Création manuelle omet `agencyId` → fuite inter-agences ; pas de pagination/filtre |
| Factures | Absent | 5 % | Absente | Aucune | Aucun modèle Invoice ; `invoiceUrl` mort ; pas de PDF/numérotation |
| CPF | Rompu (écran) | 25 % | Partielle | Partielle | Backend complet mais **pas de proxy PATCH-status** ni écran → workflow bloqué |
| Avis | Absent (écran) | 30 % | Partielle | Partielle | Modération backend existe, **aucun écran** ; proxy GET-seul ; régression vs legacy |

### F — Communication
| Module | Statut | % | API | Permissions | Problèmes clés |
|---|---|---|---|---|---|
| Emails | Stub | 8 % | Absente | Aucune | `mailer.ts` (Resend) en side-effect seulement ; pas de modèle/route/compose |
| SMS | Stub | 8 % | Absente | Aucune | `sms.ts` (Brevo) side-effect IA ; pas de log persistant |
| Campagnes | Stub | 5 % | Absente | Aucune | Zéro infra |

### G — Contenu / CMS
| Module | Statut | % | API | Permissions | Problèmes clés |
|---|---|---|---|---|---|
| FAQ | Live | 80 % | Connectée | Appliquée | **DELETE inaccessible** (proxy `[id]` n'exporte que PATCH) ; pas de filtre catégorie |
| Pages | Absent | 0 % | Absente | Aucune | Contenu en dur dans `data/site.ts` |
| Blog | Absent | 0 % | Absente | Aucune | Aucun domaine article |
| Médias | Absent | 0 % | Absente | Aucune | **Serveur sans multipart** (`express.json` 1 Mo) → stockage + upload requis |

### H — Administration
| Module | Statut | % | API | Permissions | Problèmes clés |
|---|---|---|---|---|---|
| Agences | Partiel | 45 % | Connectée (GET) | Partielle | Pas d'écran ni write API ; `agency.manage` jamais appliquée |
| Véhicules | Absent | 5 % | Absente | Aucune | Modèle Prisma orphelin |
| Utilisateurs | Stub | 20 % | Partielle | Partielle | GET-seul, aucun create/update/role/deactivate ; enum périmé (5/9 rôles) |
| Permissions | Stub | 15 % | Absente | Aucune | RBAC hardcodé ; modifiable seulement par code+redéploiement |
| Paramètres | Partiel | 55 % | Connectée (Société) | Appliquée | Société live ; pas de hub unifié |

### I — IA, Automatisations, Support
| Module | Statut | % | API | Permissions | Problèmes clés |
|---|---|---|---|---|---|
| Assistant IA | Live | 88 % | Connectée (4) | Appliquée | Onglet "Générer" → 403 silencieux sans `content.manage` ; pas d'aria-live ; dégradation 503 propre |
| Automatisations | Stub | 5 % | Absente | Aucune | Aucun moteur/règle |
| Support | Absent | 0 % | Absente | Aucune | Aucune trace ; proche = domaine Contacts non surfacé |

---

## 3. Carte d'intégration API

**Connectées (RBAC réel) :** `/api/admin/stats` · `/api/leads`(+`:id/status`) · `/api/students`(+`:id`,skills,documents) · `/api/bookings`(+`:id/status`) · `/api/instructors`(GET) · `/api/exams`(+`:id`) · `/api/payments`(+`:id`) · `/api/installments`(+plan,`:id`) · FAQ CRUD · `/api/content/company` · `/api/formations`(GET) · `/api/agencies`(GET) · `/api/auth/me`+logout · `/api/ai/{agent,summarize,content-generator,lead-score}` · `/api/reviews`(GET).

**Simulées / codées en dur :** AUCUNE métrique métier. Seuls éléments non-réels, tous légitimes : stub `/admin/bientot` ; séries dérivées de vrais `createdAt` ; `CONTACT_PHONE=""` volontaire ; stubs auth `/forgot-password`,`/reset-password`,`/verify-email` (différés) ; mode mock Stripe sans clé ; **code mort** `CockpitStats.tsx` + `AdminDashboard.tsx`.

**Incomplètes :** `GET /api/users` (lecture seule, enum périmé) · modération avis (proxy GET-seul) · triage contacts (proxy sans PATCH-status) · CPF status (proxy sans `[id]/status`) · moniteurs POST/PATCH (aucun écran) · formations POST/PATCH (aucun proxy) · Stripe payment-intents (jamais déclenché côté admin).

**Absentes (à créer) :** Devis · Contrats · Factures(PDF) · Emails/SMS/Campagnes/Relances · CMS Pages/Blog/Médias(+multipart) · Export CSV/PDF · Workflows · Permissions runtime · Hub Paramètres · Lecture journaux d'audit · CRUD Agences · CRUD Véhicules · Support.

---

## 4. Intégrité des workflows

| Workflow | Statut | Rupture |
|---|---|---|
| 1. Création prospect | **Complet** | ContactRequest+Lead+notif+qualif IA |
| 2. Inscription élève | **Complet** | Atomique, anti-doublon |
| 3. Réservation leçon | **Partiel** | Confirm OK ; **création impossible depuis le CRM** |
| 4. Paiement | **Complet** | Manuel+Stripe+webhook signé |
| 5. CPF | **Rompu** | Intake OK ; transition de statut **inatteignable** |
| 6. Examen | **Complet (score manquant)** | Résultat OK mais `score` jamais saisi |
| 7. Relance | **Partiel** | Modélisé mais aucun reminder/worklist |
| 8. Email | **Partiel** | Side-effect seulement, pas de compose |
| 9. SMS | **Partiel** | Side-effect IA seulement |
| 10. Assistant IA | **Complet** | Actions réelles RBAC-gated + AuditLog |

*Note : les écrans CRM n'envoient pas de Bearer ; `lib/backend-proxy.ts` relaie le cookie httpOnly `loden_session`. L'auth atteint bien Express.*

---

## 5. Sécurité & permissions

**P0 — HIGH**
1. **IDOR multi-agences** — `agencyId` client non vérifié vs `AgencyMembership` (`stats/students/payments/exams/installments/leads.routes.ts`) ; repo renvoie les lignes `null` sur filtre. → middleware `requireAgencyScope` + durcir repo.
2. **`POST /api/bookings` sans `requirePermission`** — tout token authentifié peut réserver pour un `studentId` arbitraire. → ELEVE pour soi, sinon `bookings.manage`.
3. **Verrou dashboard** (`CrmDashboard.tsx:110-113`) + **gate avis hardcodé** (`reviews.routes.ts:43`, littéraux au lieu de la permission) → dashboard inaccessible à 7 rôles sur 9 (DIRECTEUR inclus).

**P1 — MED**
4. IDOR fiche élève unitaire (`students.routes.ts:129`, skills/documents) — pas de contrôle agence sur `:id`.
5. **href document `javascript:` = XSS stocké** (`StudentFile.tsx:328-335`) déclenché par un admin → **HIGH** (escalade).
6. Fuite KPI revenus (`stats.routes.ts:57`) à MONITEUR/RESP_PÉDA via `dashboard.read` (ne vérifie pas `payments.read`) — aggravée par le fan-out Reporting.
7. Split-brain JWT prod (`middleware.ts:8` fallback dev) — hard-fail si secret absent.

**P2 — LOW**
8. Enum rôles périmé `userQuerySchema` (`users.routes.ts:10`). 9. Logout sans révocation serveur (JWT 7j). 10. AuditLog non écrit sur mutations cœur → **risque conformité/RGPD** (à remonter).

**Sain :** signature+expiration vérifiées, JWT jamais exposé au JS, cookies httpOnly+secure, montants dérivés serveur, quasi toutes routes admin sous `requirePermission`.

---

## 6. Performance

**P0** — listes non bornées (pas de pagination, tous écrans + dashboard) ; double fetch `me`+`stats` (topbar+dashboard) ; N+1 (`payments.routes.ts:65`, `students.routes.ts:84`).
**P1** — stats = 7 scans JS (→ `groupBy` Prisma) ; trends non mémoïsés ; recharts non code-splitté (119 kB sur `/admin` → `next/dynamic`) ; fan-out Reporting N+1.
**P2** — pas de `next/image` sur `/admin`.

---

## 7. Backlog priorisé

### Sprint 1 — Gains rapides, finir le live, fiabiliser le dashboard (frontend + petits backend)
Fix verrou dashboard (S, très élevé) · `requireAgencyScope` P0 (M, très élevé) · guard POST bookings (S, élevé) · gate avis par permission (S, élevé) · écran Moniteurs CRUD (M) · proxy+écran modération Avis (M) · proxy+écran CPF (M) · création leçon Planning (M) · capture score examen (S) · création lead UI (S) · DELETE FAQ proxy+bouton (S) · pagination/recherche Élèves/Paiements/Pipeline (M) · perf fetch unique + dynamic recharts (M) · état 503 global (S) · supprimer code mort + fusionner doublons nav (S) · assainir href doc + confirmations (S, sécurité).

### Sprint 2 — Administration, reporting, workflows partiels
Gestion Utilisateurs (L) · gestion Formations (L) · CRUD Agences (M) · triage Contacts (M) · lecture journaux d'audit + câbler écritures (L, conformité) · Reporting enrichi (M) · workflow Relance (M) · perf backend groupBy/N+1 (M) · sécurité P1 (M).

### Sprint 3 — Nouveaux domaines backend (net-new, arbitrage produit/légal)
Factures PDF (L) · Devis (L) · Contrats (L) · Communication sortante Emails/SMS (L) · Campagnes (L) · CMS Pages/Blog (L) · Médias+multipart (L) · Permissions runtime (L) · Véhicules (M) · Workflows/Automatisations (L) · Hub Paramètres (M) · Support (L).

---

## 8. Risques & prochaines étapes

**Risques production :** (1) cloisonnement multi-agences inexistant → **ne pas activer le multi-agences en prod** avant `requireAgencyScope` ; (2) POST bookings ouvert ; (3) split-brain JWT (disponibilité) ; (4) workflows CPF/Relance/Email/SMS/création-leçon incomplets — ne pas présenter comme fonctionnels ; (5) factures/contrats/devis = gaps **légaux** auto-école ; (6) perf à volume (zéro pagination) — invisible aujourd'hui (DB vide), c'est le risque ; (7) audit non lisible → conformité.

**Ordre recommandé :** (1) cette semaine : 2 P0 sécurité + verrou dashboard ; (2) Sprint 1 complet ; (3) cadrage produit/légal Sprint 3 en parallèle.

**Référence honnête :** socle technique solide, sans dette de fausses données. Distance à la prod = (a) 2 correctifs sécurité critiques, (b) ~10 gains rapides frontend exploitant des backends déjà construits, (c) 5-6 domaines métier à bâtir.
