# LODEN CRM — Blueprint produit & architecture

> Document de référence (CTO / Architecte / PM). Conçu à partir de l'existant réel du dépôt.
> Remplace à terme `docs/crm-command-center.md` (conservé comme historique).

---

## 1. Audit de l'existant

### 1.1 Ce qui existe déjà (et qui est bon)

**Backend (Express + TypeScript, en couches)**
- Pattern propre : `routes` (par module) → `LodenRepository` (interface) → 2 implémentations `MemoryLodenRepository` / `PrismaLodenRepository`, sélectionnées par `repository-factory`.
- Validation **Zod** systématique (DTO), auth **JWT Bearer**, middleware `requireRoles`, Helmet + CORS + rate-limit.
- Garde-fous production dans `config/env.ts` (refus de démarrer si secret faible / pas de DB / mémoire activée).
- Tests Vitest + Supertest (9/9 verts).

**Modèle de données (Prisma / PostgreSQL — 17 modèles)**
`User, Student, StudentDocument, Instructor, Vehicle, Formation, PricingPlan, MeetingPoint, Availability, Booking, Payment, CpfRequest, ContactRequest, Lead, Review, FaqEntry, AuditLog` — avec enums de statut métier par entité (déjà très bien pensés).

**APIs existantes (Express + proxies Next same-origin)**
auth, users, students, instructors, bookings (+slots), payments (+payment-intents), cpf/requests, contact-requests, leads (+status), reviews, search, tarifs/formations/pricing-plans.

**Front CRM déjà amorcé**
- `/admin` rend `AdminDashboard` piloté par un **registre de 14 modules** (`data/crm.ts`) avec statut `live | foundation | planned`, rôles, workflows, surfaces API.
- Pipeline commercial branché sur les leads ; `POST /api/contact-requests` crée automatiquement un `Lead PROSPECT` (acquisition visible sans saisie).
- Design system cohérent (turquoise `#08AEB8`, `loden-pearl`, focus-ring, composants partagés).

### 1.2 Limites actuelles (à lever pour en faire un vrai centre de pilotage)

| # | Limite | Impact |
|---|--------|--------|
| L1 | **Pas de notion d'agence / multi-site** dans le schéma | Bloque le besoin n°1 « multi-centres + stats par centre ». À corriger dès la fondation. |
| L2 | **`/admin` non protégé par une session serveur** (page publique, données vides si pas de token) | Risque sécurité : un vrai CRM doit être derrière un mur d'auth (middleware). |
| L3 | **CRUD partiels** : beaucoup d'endpoints en lecture, peu d'écriture/édition réelle (élèves, planning, examens, factures…) | Modules « foundation/planned » pas encore opérationnels. |
| L4 | **Pédagogie plate** : `progressPercent` est un simple entier, pas de compétences/leçons évaluées | Pas de vrai suivi pédagogique ni de taux de réussite fiable. |
| L5 | **Finance incomplète** : `Payment` existe, mais pas `Invoice`, `Installment` (échéances), `Refund`, ni webhooks Stripe | Pas de facturation/relances. |
| L6 | **Communication non implémentée** : aucun envoi email/SMS, pas de templates/campagnes | Les demandes ne notifient personne. |
| L7 | **Contenu du site en dur** (`data/site.ts`) | Le module « Site web/CMS » ne peut pas encore piloter le site public. |
| L8 | **RBAC binaire** (5 rôles, `requireRoles`) sans permissions fines ni scope par agence | Insuffisant pour secrétaire/comptable/responsable d'agence. |
| L9 | **Pas de couche d'automatisation/jobs** (relances, rappels RDV, suivis CPF) | Tout serait manuel. |
| L10 | **Pas d'IA** | Opportunité (génération de contenu, scoring, assistance admin). |

---

## 2. Vision globale

> **LODEN CRM = le système d'exploitation de l'auto-école.** Un cockpit unique, multi-agences, où chaque flux (acquisition → pédagogie → opérations → finance → réputation) est piloté, mesuré et partiellement automatisé.

**5 principes directeurs**
1. **Multi-agences natif** : toute donnée opérationnelle est rattachée à une agence ; les rôles et les stats sont *scoping-aware*.
2. **Cockpit, pas CRUD** : on part des *workflows* et des *alertes du jour*, pas de tables. Chaque module = « quoi faire maintenant ».
3. **Construire sur l'existant** : on étend le repository pattern, le registre de modules, le design system. Migration progressive (mock → API) déjà supportée par le front.
4. **Sécurité & traçabilité d'abord** : auth serveur, permissions fines, `AuditLog` sur chaque action sensible.
5. **Automatisation & IA en surcouche** : événements métier → jobs (relances, rappels) → assistance IA *human-in-the-loop*.

---

## 3. Architecture fonctionnelle

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONT CRM  (Next.js /admin, modules registry étendu data/crm.ts)      │
│  Sidebar agences + modules · Cockpit · Vues métier · Assistant IA      │
└───────────────▲───────────────────────────────────────────▲──────────┘
                │ proxies Next same-origin (relai JWT)        │
┌───────────────┴───────────────────────────────────────────┴──────────┐
│  API EXPRESS (couches conservées)                                     │
│  routes/module → service → LodenRepository → Prisma/Memory           │
│  Middlewares : auth JWT · RBAC (permissions+scope agence) · audit     │
│  Couche Événements (domain events) ─────────────┐                    │
└───────────────▲───────────────────────────┬─────┼────────────────────┘
                │                            │     │
        ┌───────┴────────┐        ┌──────────┴──┐  └──► Worker / Jobs
        │ PostgreSQL      │        │ Intégrations │      (relances, rappels
        │ (Prisma)        │        │ Stripe·Email │       RDV, suivis CPF,
        └─────────────────┘        │ SMS·Google·IA│       exports, recalcul KPI)
                                   └──────────────┘
```

**Décisions d'architecture clés**
- **Tenant scoping léger** : ajout d'une entité `Agency` + `AgencyMembership` (User ↔ Agency, rôle par agence). Chaque entité opérationnelle reçoit `agencyId`. Le middleware injecte l'agence active et filtre toutes les requêtes.
- **Service layer** : on insère une fine couche `service` entre routes et repository pour la logique métier (conflits de planning, calcul KPI, dunning) — testable, indépendante de Prisma.
- **Domain events + AuditLog** : `lead.created`, `booking.confirmed`, `payment.failed`, `cpf.validated`… alimentent l'audit, les notifications et l'IA.
- **Worker de jobs** : process séparé (ou cron PM2) pour les tâches asynchrones et planifiées.
- **Couche intégrations isolée** (adapters) : Stripe, fournisseur email (Resend/Postmark), SMS (Brevo/Twilio), Google Reviews, Claude API. Branchables par agence via `IntegrationConfig`.
- **CMS bridge** : on migre `data/site.ts` vers des entités (`Article`, `FaqEntry`, `Testimonial`, `Page/SeoMeta`) ; le front public garde son *fallback mock* pendant la transition.

---

## 4. Modules recommandés

On rationalise les 14 modules existants en **17 modules** regroupés en 5 pôles. (Statut = par rapport au code actuel.)

| Pôle | Module | Couvre le besoin | Statut actuel |
|------|--------|------------------|---------------|
| **Pilotage** | 1. Cockpit (Dashboard) | indicateurs, alertes, recherche globale | live |
| **Acquisition** | 2. Pipeline commercial | leads, qualification, relances, devis, conversion | foundation |
| **Pédagogie** | 3. Élèves | création, dossiers, documents, progression, paiements, historique | foundation |
| | 4. Planning & Réservations | calendrier, leçons, conflits, affectations | foundation |
| | 5. Moniteurs | profils, dispo, affectations, validation heures, perf | foundation |
| | 6. Examens | code/conduite, résultats, taux de réussite | planned |
| | 7. Catalogue & Offres | formations, code, CPF, stages, packs, tarifs | foundation (lecture) |
| **Finance** | 8. Finance | paiements, factures, échéances, remboursements, relances, CPF finance, exports | foundation (paiements) |
| **Relation & Comms** | 9. Communication | email, SMS, notifications, campagnes, templates | planned |
| | 10. Avis & Réputation | modération, Google, satisfaction | foundation |
| | 11. Support | tickets, priorités, historique | planned |
| **Contenu & Data** | 12. Site web / CMS | pages, blog, FAQ, témoignages, SEO | planned |
| | 13. Médiathèque | photos, vidéos, docs, tags | planned |
| | 14. Reporting & Analytics | CA, réussite, occupation moniteurs, activité commerciale | planned |
| **Plateforme** | 15. Agences (multi-site) | centres, stats par centre, paramètres locaux | **nouveau** |
| | 16. Administration | rôles, permissions, sécurité, logs, audit, intégrations | planned |
| | 17. Assistant IA | automatisation, génération contenu, assistance, analyse | **nouveau** |

**Le module IA n'est pas un silo** : c'est une surcouche présente *dans* les autres modules (bouton « Assistant » contextuel) + un hub central.

### Où l'IA apporte une vraie valeur (pertinence > gadget)
- **Pipeline** : lead scoring + *next best action* + résumé auto du prospect.
- **Élèves** : synthèse de dossier en un clic, génération de recommandations pédagogiques.
- **Communication** : rédaction d'emails/SMS de relance, réponses aux avis, variantes de campagne.
- **Site/CMS** : génération d'articles de blog, méta SEO, FAQ, descriptions de formations.
- **Planning** : suggestions d'optimisation (remplir les trous, réduire les trajets moniteurs).
- **Finance/Reporting** : détection d'anomalies (impayés, risque de no-show), commentaire automatique des KPI.
- **Garde-fous** : toujours *human-in-the-loop* (brouillon validé), journalisé dans `AuditLog`, jamais d'action irréversible automatique.

---

## 5. Arborescence complète (/admin)

```
/admin
├─ /                         Cockpit (KPIs, alertes, activité, recherche globale)
├─ /pipeline                 Vue Kanban leads (Prospect→Inscrit/Perdu)
│   └─ /pipeline/:leadId     Fiche prospect (timeline, activités, devis, conversion)
├─ /eleves
│   ├─ /                     Liste + filtres (statut dossier, formation, agence)
│   ├─ /nouveau              Création élève (+ compte)
│   └─ /:studentId           Fiche élève (onglets ci-dessous)
│        ├─ resume           Identité, statut dossier, KPIs perso
│        ├─ pedagogie        Progression par compétence, leçons, examens
│        ├─ planning         Réservations à venir / passées
│        ├─ documents        Pièces (ANTS, ID, domicile…) + vérification
│        ├─ finance          Paiements, factures, échéances
│        └─ notes            Notes internes, timeline CRM
├─ /planning                 Calendrier jour/semaine/mois (filtre moniteur/agence)
│   ├─ /planning/conflits    Conflits & créneaux à réaffecter
│   └─ /planning/:bookingId  Détail leçon + compte-rendu/évaluation
├─ /moniteurs
│   ├─ /                     Liste + perf (note, heures, occupation)
│   └─ /:instructorId        Profil, dispo, agenda, véhicules, élèves, historique
├─ /examens                  Sessions code/conduite, résultats, taux de réussite
├─ /catalogue                Formations, packs/tarifs, éligibilité CPF, stages
├─ /finance
│   ├─ /paiements            Paiements, statuts, remboursements
│   ├─ /factures             Factures + génération PDF + exports comptables
│   ├─ /echeances            Paiements fractionnés (3x/4x) + relances impayés
│   └─ /cpf                  Dossiers CPF (pièces, statuts, validation, montants)
├─ /communication
│   ├─ /messages             Historique email/SMS/notifs
│   ├─ /modeles              Templates (variables) email/SMS
│   └─ /campagnes            Campagnes ciblées + stats
├─ /avis                     Modération, avis Google, satisfaction
├─ /support                  Tickets, priorités, assignations
├─ /site
│   ├─ /pages                Pages & SEO
│   ├─ /blog                 Articles
│   ├─ /faq                  FAQ
│   └─ /temoignages          Témoignages publiés
├─ /medias                   Bibliothèque (photos/vidéos/PDF, tags, dossiers)
├─ /reporting                Tableaux de bord (CA, réussite, occupation, conversion)
├─ /agences                  Multi-sites : liste, stats par centre, paramètres locaux
│   └─ /agences/:agencyId    Détail agence (horaires, points RDV, équipe, véhicules)
├─ /administration
│   ├─ /utilisateurs         Comptes & affectations agence
│   ├─ /roles                Rôles & permissions (matrice)
│   ├─ /audit                Journal d'audit
│   └─ /integrations         Stripe, email, SMS, Google, IA
└─ /assistant                Hub IA (actions, génération, analyses)
```

**Sélecteur d'agence global** en haut de la sidebar (« Toutes les agences » pour les rôles multi-sites).

---

## 6. Modèle de données cible (entités & relations)

### 6.1 Nouvelles entités plateforme
- **Agency**(`id, name, slug, address, lat, lng, phone, email, openingHours(json), brand(json), active`)
- **AgencyMembership**(`id, userId, agencyId, role, isPrimary`) → User *—* Agency.
- **Permission**(`key`) · **RolePreset**(`role, permissions[]`) · **UserPermissionOverride**(`userId, key, allow`).
- **IntegrationConfig**(`agencyId?, provider, settings(json, chiffré), active`).

### 6.2 Pédagogie (enrichissement)
- **Skill / Competence**(`id, code, label, category`) — référentiel (REMC).
- **StudentSkill**(`studentId, skillId, level 0–4, updatedBy, updatedAt`) → remplace le `progressPercent` plat.
- **LessonReport**(`bookingId, status DONE/ABSENT, summary, skillsEvaluated[], instructorId`).
- **Exam**(`id, agencyId, studentId, type CODE/CONDUITE, scheduledAt, center, status, result PASS/FAIL, score, attempt`).

### 6.3 Finance
- **Invoice**(`id, agencyId, studentId/userId, number, lines(json), totalCents, status, dueDate, pdfUrl`).
- **Installment**(`id, planId, studentId, dueDate, amountCents, status`) — échéances 3x/4x.
- **Refund**(`id, paymentId, amountCents, reason, status`).
- (`Payment` existant relié à `Invoice`/`Installment` ; webhooks Stripe → maj statut.)

### 6.4 Relation & contenu
- **MessageTemplate**(`key, channel EMAIL/SMS, subject, body, variables[]`).
- **Communication**(`id, channel, to, templateKey, status, relatedType, relatedId, sentAt`).
- **Campaign**(`id, agencyId, audience(json), templateKey, scheduleAt, stats(json)`).
- **Notification**(`id, userId, type, payload, readAt`).
- **SupportTicket**(`id, agencyId, requesterId, subject, priority, status, assigneeId`) + **TicketMessage**.
- **Article**(blog) · **Page/SeoMeta** · **Testimonial** (ou réutilise `Review` curé) · `FaqEntry` (déjà là, +SEO).
- **MediaAsset**(`id, agencyId, type, url, folder, tags[], alt, sizeBytes`).
- **Document** (généralise `StudentDocument` : `ownerType, ownerId, category, url, verifiedAt, expiresAt`).

### 6.5 Acquisition (enrichissement de `Lead`)
- `Lead` += `agencyId, assignedToId, stage` · **LeadActivity**(`leadId, type, note, author, at`) → timeline + relances.

### 6.6 Champ transversal
- Ajouter `agencyId` à : `Student, Instructor, Vehicle, MeetingPoint, Availability, Booking, Payment, CpfRequest, Lead, Review, ContactRequest, Exam, Invoice`.

```
Agency 1─* {Student, Instructor, Vehicle, MeetingPoint, Booking, Payment, Lead, Exam, Invoice, ...}
User 1─1 Student | 1─1 Instructor ; User *─* Agency (AgencyMembership, rôle par agence)
Student 1─* {Booking, Payment, Document, Exam, CpfRequest, Invoice, StudentSkill, LeadActivity}
Instructor 1─* {Availability, Booking, Vehicle, LessonReport}
Booking 1─1 LessonReport ; Invoice 1─* {Payment, Installment} ; Payment 1─* Refund
```

---

## 7. Rôles & permissions

### 7.1 Rôles cibles (extension des 5 existants)

| Rôle | Périmètre | Scope agence |
|------|-----------|--------------|
| **SUPER_ADMIN** | Plateforme : toutes agences, intégrations, rôles, paramètres globaux | toutes |
| **DIRECTEUR** | Toutes les agences de l'entreprise (data, finance, paramètres) | toutes |
| **RESPONSABLE_AGENCE** | Pilotage complet de son/ses agence(s) | agence(s) |
| **RESPONSABLE_PEDAGOGIQUE** | Élèves, moniteurs, planning, examens, qualité (finance en lecture) | agence(s) |
| **SECRETAIRE / ASSISTANT** | Acquisition, élèves, planning, documents, CPF (saisie), comms | agence |
| **COMPTABLE** | Finance complète (factures, remboursements, exports) ; élèves en lecture | agence(s) |
| **MONITEUR** | Son planning, élèves affectés, validation heures, comptes-rendus | propre |
| **ELEVE** | Espace élève (existant) | propre |
| **VISITEUR** | Site public | — |

### 7.2 Matrice de permissions (extrait — `module.action` × scope)

| Action | SUPER_ADMIN | DIRECTEUR | RESP. AGENCE | RESP. PÉDA | SECRÉTAIRE | COMPTABLE | MONITEUR |
|---|---|---|---|---|---|---|---|
| students.read | all | all | agency | agency | agency | agency(ro) | own |
| students.create / update | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| bookings.manage | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | own |
| lessons.validate | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | own |
| exams.manage | ✅ | ✅ | ✅ | ✅ | partiel | ❌ | ❌ |
| payments.record | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| payments.refund / invoices.manage | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| cpf.validate | ✅ | ✅ | ✅ | ❌ | saisie | ✅ | ❌ |
| communication.send | ✅ | ✅ | ✅ | ✅ | ✅ | relances | rappels |
| content.publish (site) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| agency.manage | ✅ | ✅ | sa propre | ❌ | ❌ | ❌ | ❌ |
| roles.manage / integrations | ✅ | partiel | ❌ | ❌ | ❌ | ❌ | ❌ |
| audit.read | ✅ | ✅ | agency | ❌ | ❌ | ❌ | ❌ |

**Mise en œuvre** : presets par rôle + overrides par utilisateur ; middleware `requirePermission('payments.refund', scope)` qui vérifie *permission* **et** *agence active*. Toute action sensible → `AuditLog`.

---

## 8. Parcours utilisateur

1. **Secrétaire — prospect → élève** : alerte « nouveau lead » au cockpit → ouvre la fiche prospect → qualifie/relance (timeline) → envoie devis (template) → convertit en élève (création compte + dossier) → demande les pièces → 1ère réservation.
2. **Moniteur — sa journée** : se connecte → son planning du jour → démarre une leçon → saisit le compte-rendu + évalue les compétences → valide les heures → commentaire élève.
3. **Responsable pédagogique — préparer un examen** : filtre élèves « prêts examen » → programme session → après coup saisit résultats → le taux de réussite agence se met à jour.
4. **Comptable — fin de mois** : module Finance → impayés → relances automatiques → génère factures → export comptable → tableau CA par agence.
5. **Directeur — multi-agences** : sélecteur « Toutes les agences » → Reporting comparatif (CA, réussite, occupation moniteurs, conversion) → drill-down par centre.
6. **Super-admin — gouvernance** : crée une agence, affecte une équipe, configure intégrations (Stripe/email/SMS), ajuste rôles & permissions, consulte l'audit.

---

## 9. Maquettes fonctionnelles (textuelles)

**Cockpit**
```
[Barre: agence active ▾ | recherche globale | notifications | profil]
[Sidebar modules]  [Alertes du jour: 3 impayés · 2 dossiers CPF incomplets · 1 conflit planning]
                   [KPI: élèves actifs · inscriptions(mois) · réservations(semaine) · CA(mois) · réussite · CPF en cours]
                   [Graphe activité]              [File: leads à relancer]
                   [Activité récente]             [Avis à modérer]
```

**Fiche élève**
```
[Identité · statut dossier · agence · moniteur référent]              [Actions: réserver · encaisser · message · IA résumé]
[Onglets: Résumé | Pédagogie | Planning | Documents | Finance | Notes]
 Pédagogie → [progression par compétence ▮▮▮▯] [leçons + évaluations] [examens]
 Finance   → [reste à payer] [échéances] [factures]      Documents → [pièces + statut vérifié/expiré]
[Timeline: documents, paiements, examens, messages, actions CRM]
```

**Planning**
```
[Jour | Semaine | Mois]  [filtre: moniteur ▾ · agence ▾ · véhicule ▾]
[Grille horaire × moniteurs] créneaux: libre / réservé / réalisé / absent / conflit(rouge)
[Glisser-déposer pour réaffecter]  [panneau: créneaux à remplir + suggestion IA]
```

**Pipeline**
```
[Prospect] [Contacté] [Relance] [Devis] [Inscrit] [Perdu]
 cartes(score IA, agence, source, prochaine action)  → glisser entre colonnes
```

**Finance**
```
[KPI: CA · encaissé · impayés · à facturer]
[Onglets: Paiements | Factures | Échéances | CPF]
[Table dense + filtres + actions (relancer, rembourser, exporter)]
```

**Reporting**
```
[Période ▾ · agence(s) ▾]
[CA] [Taux de réussite code/conduite] [Occupation moniteurs %] [Conversion pipeline]
[Comparatif par agence] [Export CSV/PDF] [Commentaire auto IA]
```

**Assistant IA (panneau contextuel)**
```
[Contexte: fiche élève X]  « Résumer le dossier » · « Rédiger un email de relance » · « Proposer un plan de leçons »
[Brouillon généré] → [Éditer] [Valider & envoyer]   (journalisé)
```

---

## 10. Priorisation MVP / V2 / V3

### MVP (V1) — « CRM réel & sûr » (centre de commande opérationnel)
- 🔒 **Sécuriser `/admin`** : middleware session + RBAC serveur sur tous les proxies admin.
- **Agency + AgencyMembership** + `agencyId` sur les entités clés + sélecteur d'agence.
- **CRUD réels** : élèves (fiche + notes + documents), leads (pipeline + activités), réservations (lecture/édition), paiements (saisie), CPF (statuts), avis (modération), moniteurs.
- **Cockpit branché sur données réelles** (KPIs + alertes).
- **RBAC v1** (rôles étendus appliqués côté serveur) + `AuditLog` sur actions sensibles.
- **Notifications email basiques** (nouveau lead / contact) via 1 adapter email.

### V2 — « Opérations & Finance »
- **Planning** calendrier jour/semaine/mois + détection de conflits + réaffectation.
- **Pédagogie** : compétences (`StudentSkill`), `LessonReport`, validation heures moniteur.
- **Examens** + taux de réussite.
- **Finance** : `Invoice` (PDF), `Installment` (3x/4x), `Refund`, **webhooks Stripe**, **relances impayés** (jobs).
- **Communication** : templates + envoi email/SMS + rappels RDV automatiques + campagnes simples.
- **Support** : tickets.

### V3 — « Scale & Intelligence »
- **Multi-agences avancé** : reporting comparatif, paramètres locaux, permissions fines (UI matrice).
- **CMS** : pages/blog/FAQ/témoignages/SEO → site public **DB-driven** (fin du `data/site.ts` en dur).
- **Médiathèque** complète (upload, tags, recherche).
- **Reporting/Analytics** avancé + exports comptables.
- **Assistant IA** : génération de contenu, lead scoring + next-best-action, brouillons de réponses/relances, détection d'anomalies, commentaire de KPI.

---

## 11. Plan d'implémentation détaillé

> Méthode : on étend le **repository pattern** (interface d'abord → impl mémoire pour itérer sans DB → impl Prisma), un module à la fois (migration Prisma → service → routes Express + Zod → proxy Next → vue front depuis le registre `data/crm.ts`). Chaque lot finit par `npm run deploy:check`.

**Sprint 0 — Socle sécurité & multi-agences (fondation)**
1. Middleware Next pour protéger `/admin` (redirige `/connexion` si pas de session admin).
2. Migration Prisma : `Agency`, `AgencyMembership`, `agencyId` sur entités clés ; seed 1 agence (République) + rattachement existant.
3. RBAC : `Permission/RolePreset`, middleware `requirePermission(scope)`, rôles étendus ; brancher sur les routes existantes.
4. Sélecteur d'agence (contexte front) + filtrage repository par agence active.

**Sprint 1 — Élèves & Pipeline réels (cœur MVP)**
5. Endpoints écriture : `POST/PATCH /api/students`, `/api/leads` (+ `LeadActivity`), `Document`.
6. Fiche élève (onglets Résumé/Documents/Notes/Finance lecture) + pipeline Kanban éditable.
7. Cockpit sur données réelles (service KPI) + recherche globale serveur (`/api/admin/search`).
8. Adapter email + notification « nouveau lead ».

**Sprint 2 — Planning & Pédagogie (V2)**
9. Calendrier + détection conflits ; `LessonReport`, `StudentSkill`, validation heures.
10. Interface moniteur (planning perso + comptes-rendus).
11. `Exam` + taux de réussite + reporting pédagogique.

**Sprint 3 — Finance (V2)**
12. `Invoice` (+PDF), `Installment`, `Refund`, webhooks Stripe.
13. Worker de jobs : relances impayés + rappels RDV (email/SMS) + suivis CPF.

**Sprint 4 — Comms, Support, Avis (V2→V3)**
14. Templates + campagnes ; tickets support ; modération avis + intégration Google.

**Sprint 5 — Contenu, Médias, Reporting, IA (V3)**
15. CMS (Article/FAQ/Testimonial/Page/SEO) → bascule site public en DB-driven (fallback mock conservé).
16. Médiathèque (upload + stockage objet).
17. Reporting multi-agences + exports.
18. Assistant IA (Claude API) : génération contenu, scoring, brouillons, anomalies — *human-in-the-loop* + audit.

**Définition de « done » par lot** : migration + tests Vitest (service & routes) + `deploy:check` vert + vue front branchée + permissions vérifiées + audit log.

---

## 12. État d'implémentation (à jour)

> Runbook de déploiement : [crm-deployment.md](crm-deployment.md). 14 tests verts, `deploy:check` vert.

**Livré**
- **Sprint 0** — Sécurité : session **cookie httpOnly** + `middleware.ts` protégeant `/admin` ; **RBAC fin** (`backend/src/domain/permissions.ts`, `requirePermission`) ; **multi-agences** (`Agency`, `AgencyMembership`, `agencyId` sur les entités, `GET /api/agencies`, sélecteur d'agence front).
- **Sprint 1** — **Cockpit** données réelles (`GET /api/admin/stats`) ; **Pipeline** Kanban (`/admin/pipeline`) ; **Fiche élève** éditable (`/admin/eleves`, `/admin/eleves/[id]`) ; **notification email** nouveau lead (`backend/src/shared/mailer.ts`, Resend ou log).
- **Sprint 2** — **Planning** (`/admin/planning`) ; **Examens** + taux de réussite (`/admin/examens`, modèle `Exam`) ; **Compétences REMC** (`StudentSkill`, section fiche élève).
- **Sprint 3 (partiel)** — **Finance** (`/admin/finance`) : paiements (liste/enregistrement/remboursement, RBAC corrigé) + **échéances 3×/4×** (`Installment`, `POST /api/installments/plan`).
- **Reporting** (`/admin/reporting`) — comparatif KPI par agence ; `GET /api/admin/stats` **entièrement scopé par agence** (élèves, prospects, leçons, paiements, examens).
- **CMS — FAQ** (`/admin/site/faq`) : CRUD admin (`content.manage`) + endpoint public `GET /api/faq` ; la **FAQ du site public (`/cpf`) lit la base** (`lib/faq.ts`) avec repli mock. Pattern réutilisable pour blog/témoignages.

**Modèles ajoutés** : `Agency`, `AgencyMembership`, `Exam`, `StudentSkill`, `Installment` (+ `agencyId` sur 11 entités, enum `UserRole` étendu). 6 migrations PG-safe.

**Reste (non démarré)** : factures PDF · webhooks Stripe réels · relances impayés (worker) · comptes-rendus de leçon (`LessonReport`) · CMS site (blog/FAQ/pages DB-driven) · médiathèque · reporting avancé · assistant IA.

**Conventions confirmées** : repository pattern (mémoire + Prisma) pour chaque entité ; routes Express + Zod ; proxies Next cookie-aware ; vues front clientes lisant via cookie ; filtrage `agencyId` inclusif (transitoire : inclut les enregistrements non rattachés) en attendant l'affectation systématique à la création.
