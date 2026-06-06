# CRM LODEN - Centre de commande

## Analyse metier

Une auto-ecole moderne doit piloter quatre flux en continu :

- Acquisition : prospects, demandes de rappel, CPF, devis, inscription.
- Pedagogie : progression eleve, heures consommees, moniteurs, examens, taux de reussite.
- Operations : planning, disponibilites, annulations, conflits, vehicules, lieux de rendez-vous.
- Finance et relation client : paiements, factures, impayes, avis, support, notifications.

Le CRM LODEN doit donc fonctionner comme un cockpit quotidien, pas comme une collection de pages CRUD.

## Roles

- `SUPER_ADMIN` : plateforme, agences, roles, permissions, statistiques, parametres globaux.
- `ADMIN` : eleves, moniteurs, reservations, paiements, CPF, formations, contenus.
- `RESPONSABLE_PEDAGOGIQUE` : eleves, moniteurs, examens, performances et qualite.
- `MONITEUR` : planning personnel, eleves affectes, validation des heures, commentaires.

## Arborescence modules

- Dashboard principal : indicateurs, alertes, activite recente, recherche globale.
- CRM commercial : pipeline prospect, contacte, relance, devis envoye, inscrit, perdu.
- Eleves : fiche detaillee, progression, paiements, reservations, examens, documents, notes internes.
- Moniteurs : profil, disponibilites, agenda, vehicules, notation, historique.
- Reservations : vues jour, semaine, mois, reports, annulations, affectations.
- Examens : places, examens code/conduite, resultats, taux de reussite.
- Paiements : paiements, acomptes, echeances, remboursements, factures, exports.
- CPF : demandes, pieces justificatives, statuts, validation.
- Contenus : blog, actualites, promotions, FAQ, SEO.
- Medias : images, videos, PDF, tags, dossiers, recherche.
- Communication : emails, SMS, notifications, campagnes, relances.
- Avis clients : moderation, avis Google, statistiques satisfaction.
- Support : tickets, historique, reponses, priorites.
- Parametres : agences, horaires, reseaux sociaux, modeles, roles, permissions.

## Workflows prioritaires

1. Prospect vers eleve : contact entrant -> qualification -> relance -> devis/CPF -> inscription.
2. Eleve vers examen : inscription -> formation -> heures -> evaluation -> examen -> resultat.
3. Reservation : choix creneau -> verification conflit -> confirmation -> notification -> validation heure.
4. CPF : demande -> pieces -> dossier incomplet/complet -> validation -> paiement.
5. Paiement : intention -> paiement -> facture -> relance impaye -> export comptable.
6. Avis : depot avis -> moderation -> publication -> analyse satisfaction.

## Wireframes textuels

Dashboard :

```text
[Header session + recherche globale]
[Sidebar modules] [Hero module actif]
                  [KPI grid: eleves, inscriptions, reservations, CA, CPF, examens, reussite, avis]
                  [Graph operationnel] [Notifications]
                  [Activite recente] [Avis] [Roadmap]
```

Pipeline commercial :

```text
[Prospect] [Contacte] [Relance] [Devis envoye] [Inscrit] [Perdu]
  cartes     cartes     cartes     cartes         cartes    cartes
```

Fiche eleve cible :

```text
[Identite + statut dossier]
[Progression] [Heures] [Paiements] [Prochaines reservations]
[Timeline: documents, notes, examens, avis, actions CRM]
```

## Design system CRM

- Fond general : `loden-pearl`.
- Surfaces : blanc, bordure `slate-200`, ombres sobres.
- Accent : `#08AEB8` avec variantes `loden-500/700`.
- Navigation : barre laterale compacte, icones Lucide, etats actifs nets.
- Donnees : tableaux denses, listes scannables, KPI courts.
- Responsive : sidebar empilee sur mobile, grilles 1 colonne, actions tactiles larges.

## Base de donnees cible

Le schema Prisma actuel couvre deja les fondations : `User`, `Student`, `Instructor`, `Formation`, `PricingPlan`, `Booking`, `Payment`, `CpfRequest`, `ContactRequest`, `Review`.

Tables a ajouter par phase :

- `Agency`, `Vehicle`, `Exam`, `Document`, `MediaAsset`.
- `Lead`, `Deal`, `PipelineStage`, `InternalNote`.
- `Invoice`, `PaymentSchedule`, `Refund`.
- `SupportTicket`, `MessageTemplate`, `Notification`, `Campaign`.
- `Article`, `News`, `FaqEntry` enrichi SEO.
- `RolePermission`, `AuditLog`.

## APIs necessaires

Socle actuel :

- `GET/POST/PATCH /api/leads`
- `GET /api/users`
- `GET /api/students`
- `GET /api/instructors`
- `GET /api/bookings`
- `GET /api/payments`
- `GET /api/contact-requests`
- `GET /api/cpf/requests`
- `GET /api/reviews?includeUnpublished=true`

APIs prochaines :

- `GET/POST/PATCH /api/leads`
- `GET/POST/PATCH /api/exams`
- `GET/POST/PATCH /api/vehicles`
- `GET/POST/PATCH /api/documents`
- `GET/POST/PATCH /api/invoices`
- `GET/POST/PATCH /api/support/tickets`
- `GET/POST/PATCH /api/content/articles`
- `GET/POST/PATCH /api/media`
- `GET/POST/PATCH /api/settings/roles`
- `GET /api/admin/search?q=...`
- `GET /api/admin/audit-logs`

## Priorisation

Phase 1 - Centre de commande :

- Dashboard modulaire.
- Recherche globale.
- Pipeline commercial visuel.
- Proxies admin et securisation des donnees sensibles.

Phase 2 - Operations :

- Fiches eleves detaillees.
- Planning jour/semaine/mois.
- Gestion examens.
- Interface moniteur.

Phase 3 - Finance et automatisation :

- Stripe webhooks.
- Factures.
- Paiements fractionnes.
- Relances automatiques email/SMS.

Phase 4 - Scale :

- Multi-agences.
- Permissions fines.
- Medias/documents.
- Contenus SEO administrables.
- Audit logs.

## Etat implementation

La page `/admin` consomme maintenant une architecture de modules depuis `data/crm.ts` et affiche :

- dashboard principal ;
- recherche globale locale ;
- pipeline commercial branché sur les leads CRM ;
- vues eleves, moniteurs, reservations, paiements, CPF et avis ;
- modules planifies pour examens, contenus, medias, communication, support et parametres.

Les demandes `POST /api/contact-requests` creent automatiquement un lead `PROSPECT`, afin que l'acquisition commerciale soit visible dans le pipeline sans saisie manuelle.
