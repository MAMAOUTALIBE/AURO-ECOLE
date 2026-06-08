# 🔍 Audit global LODEN — Auto-école · VTC · CACES · CRM

> Audit lecture seule réalisé par une task force de 10 experts seniors (Architecte, QA, UX, UI, Conversion, Accessibilité, Performance, SEO local, Sécurité, CRM) + notation par page + synthèse directionnelle.
> **Aucune correction appliquée** — ce document est le diagnostic préalable à valider avant toute remédiation.

| | |
|---|---|
| **Date** | 8 juin 2026 |
| **Périmètre** | Site Next.js 15 (:3000) + API Express 5 (:4000), CRM `/admin`, espaces utilisateurs |
| **Méthode** | 16 agents, vérification réelle (lecture code `fichier:ligne` + tests curl live sur :3000/:4000) |
| **Findings** | **116** — 🔴 4 P0 · 🟠 40 P1 · 🟡 48 P2 · 🔵 24 P3 |
| **Score global** | **5.8/10** |

---

## Sommaire
1. [Synthèse exécutive & verdict](#1--synthèse-exécutive--verdict)
2. [Problèmes critiques transverses](#2--problèmes-critiques-transverses)
3. [Manques majeurs vs périmètre métier](#3--manques-majeurs-vs-périmètre-métier)
4. [Grille de notation page par page](#4--grille-de-notation-page-par-page)
5. [Plan de correction priorisé](#5--plan-de-correction-priorisé)
6. [Roadmap par sprints](#6--roadmap-par-sprints)
7. [Quick wins](#7--quick-wins)
8. [Recommandations de modernisation](#8--recommandations-de-modernisation)
9. [Rapports détaillés par dimension](#9--rapports-détaillés-par-dimension)

---

## 1 · Synthèse exécutive & verdict

LODEN repose sur des fondations techniques saines et au-dessus de la moyenne pour un projet de cette taille : monorepo bien structuré (Next 15 / Express 5), couche repository proprement abstraite, RBAC fin réellement appliqué (401/403 vérifiés), JWT signé côté API, mots de passe jamais exposés, CORS en allowlist, rate-limit actif, et un CRM réellement branché sur de vraies API (pas une maquette). Plusieurs items de sécurité différés sont déjà résolus (token sorti du localStorage, audit log implémenté). Mais le produit livré accuse un écart majeur avec la promesse commerciale et trois failles structurantes. PROBLÈME N°1 (P0, transverse, confirmé en code) : le paiement est entièrement simulé (aucun SDK Stripe, pi_mock_*) ET le montant amountCents est fourni par le client sans recalcul serveur — un élève crée une intention à 1 centime pour une formation à 1190 EUR ; le webhook est un stub sans vérification de signature. Aujourd'hui sans perte financière (mock), demain une fraude critique dès le branchement réel. PROBLÈME N°2 (P0/P1) : les deux tiers du périmètre annoncé — centre VTC et centre CACES — sont totalement absents du code (0 occurrence sur tout le repo : pages, slugs, formations, ExamType, formulaires devis). Le site se présente comme centre multi-métiers mais ne vend que du permis B. PROBLÈME N°3 (P1) : la confiance est sapée par des incohérences visibles — la marque oscille entre LODEN (officiel) et LODENE (affiché dans le H1 du hero et le logo), des preuves chiffrées contradictoires (+2000 vs +800 élèves, +500 vs 128 avis, 98% vs 86% de réussite), un aggregateRating JSON-LD à 128 avis pour 3 avis réels dupliqués, et des labels Qualiopi/agrément préfectoral en simple texte ou marqués à compléter. S'ajoutent : flux mot de passe oublié / vérification email à l'état de stub (utilisateur bloqué sans recours), CSP en Report-Only avec unsafe-inline/eval (XSS non bloqué), middleware admin qui décode le JWT sans vérifier la signature, et plusieurs ruptures de conversion (mur de connexion avant tout récapitulatif de pack, slugs de packs en 404, simulateur plus cher que les packs publiés). Côté accessibilité, le socle est correct mais bute sur des manquements AA réels (contraste de la couleur de marque #08AEB8 à 2.71:1, absence de skip link, erreurs de formulaire non reliées en ARIA). Le CRM pilote déjà (suivre, qualifier, encaisser manuellement, planifier) mais n'automatise pas (relances, notifications en stub) et ne couvre pas tout le métier (pas de création d'élève côté admin, pas de gestion documentaire, pas d'espace formateur, paiement mock). Verdict : un socle solide et prometteur, mais pas encore prêt pour la production sur les parcours monétaires, ni à la hauteur de sa promesse multi-métiers et premium.

**Verdict :** Le site rassure partiellement et pilote correctement le quotidien d'une auto-école permis B, mais il NE convertit pas de bout en bout (paiement fictif, mur de connexion prématuré, slugs en 404) et NE tient pas sa promesse de centre multi-métiers (VTC/CACES inexistants). En l'état, le parcours d'achat est inexploitable en production (montant fraudable, Stripe non branché) et la crédibilité est entamée par des incohérences de marque et de preuves chiffrées. C'est un excellent socle technique à fiabiliser et compléter, pas un produit fini : à NE PAS mettre en production sur les flux monétaires avant le sprint de stabilisation/sécurité.

**Score global : 5.8/10**

---

## 2 · Problèmes critiques transverses

- P0 — Intégrité paiement : amountCents fourni par le client et accepté tel quel par le backend (POST /api/payments/payment-intents), sans recalcul depuis le PricingPlan. Fraude tarifaire critique dès le branchement Stripe (payer 1 centime un permis à 1190 EUR). Confirmé en code et par curl (ARCH-02, PAY-01, SEC-01, CRM-04).
- P0 — Paiement entièrement simulé : aucun package Stripe, stripePaymentIntentId codé en pi_mock_*, webhook /stripe/webhook stub renvoyant 202 sans vérification de signature et protégé par auth (Stripe ne pourrait jamais l'appeler). La promesse 'paiement en ligne' affichée partout n'encaisse rien.
- P0/P1 — Périmètre métier amputé : VTC et CACES totalement absents (0 occurrence dans tout le repo : pages, slugs, formations, ExamType limité à CODE/CONDUITE, aucun formulaire devis pro). Deux tiers du business model annoncé sont non vendables, non planifiables, non référençables (ARCH-01, CONV-01, SEO-01, UX-03).
- P1 — Incohérence de marque LODEN vs LODENE sur l'élément le plus visible (H1 du hero, logo header, assistant IA, aria-label), alors que footer/metadata/domaine disent LODEN. Faute de marque qui décrédibilise immédiatement (UI-01, CONV-03, UX-04).
- P1 — Preuves chiffrées contradictoires et invérifiables : +2000 vs +800 élèves, +500 vs 128 avis, 98% vs 86% de réussite selon les zones ; aggregateRating JSON-LD à reviewCount 128 pour 3 avis réels (dupliqués via testimonials.concat) — risque de pénalité Google et de méfiance visiteur (CONV-02, CONV-06).
- P1 — Sécurité défense en profondeur : CSP frontend en Report-Only avec unsafe-inline/unsafe-eval (XSS non bloqué) ; middleware /admin décode le JWT sans vérifier la signature (shell CRM rendu à un cookie au rôle forgé, l'API restant le vrai garde-fou) (SEC-02, SEC-08).
- P1 — Flux mot de passe oublié / reset / vérification email à l'état de stub (202 'prêt pour intégration', aucun token généré/vérifié) : un élève qui oublie son mot de passe est définitivement bloqué, et l'API laisse croire que le flux fonctionne (ARCH-04, SEC-03).
- P1 — Ruptures de tunnel : page /paiement et CTA 'Choisir ce pack' affichent un mur 'Compte requis' AVANT tout récapitulatif (prix/features), et les slugs de packs (permis-b, boite-automatique, pack-cpf) mènent à des 404 sur la page détail (UX-02, UX-01, NAV-01).

---

## 3 · Manques majeurs vs périmètre métier

- Pôles VTC et CACES inexistants de bout en bout : pas de pages, slugs, formations, certifications (ExamType ne connaît que CODE/CONDUITE), pas de formulaire devis pro (OPCO/entreprise), pas d'identité visuelle ni d'entrée de menu, pas de landing SEO. C'est le plus gros manque à gagner vs le positionnement 'centre de formation' multi-métiers.
- Paiement en ligne réel absent : pas de Stripe, pas de checkout, pas de facture/reçu PDF, pas d'export comptable, malgré un champ invoiceUrl en base et la mise en avant marketing du paiement.
- Espace formateur inexistant côté front alors que le rôle MONITEUR est entièrement câblé en RBAC backend (un moniteur connecté atterrit dans l'espace élève) — planning perso, élèves affectés, saisie des compétences (StudentSkill existe) non exposés.
- Gestion documentaire des élèves absente : modèle StudentDocument présent en base mais zéro API/UI/upload — indispensable pour les dossiers CPF (pièces justificatives, ASSR, CNI). La 'complétude dossier' n'est qu'un statut texte.
- Inscription non centralisée dans le CRM : students en GET/PATCH uniquement, aucune création possible par le secrétariat (POST absent) — la seule voie est l'auto-inscription publique, irréaliste pour une auto-école.
- Relances et notifications non opérationnelles : nextFollowUpAt stocké mais jamais affiché ni déclenché, mailer/SMS en fallback console.log sans provider configuré, aucun job planifié (rappels RDV, relances impayés/CPF).
- Conformité RGPD incomplète : aucune case de consentement ni lien politique de confidentialité sur les formulaires de collecte, aucune gestion des mineurs (conduite accompagnée dès 15 ans, pas de date de naissance ni consentement parental), bandeau cookies absent, mentions légales et politique de confidentialité en placeholder (SIRET, agrément préfectoral, base légale, durées manquants).
- Contenu éditorial / SEO de fond absent : blog = 3 cartes pointant vers des pages produit (pas de /blog/[slug] ni articles réels), couverture géographique limitée à 1 landing quartier malgré 5 zones declarées en areaServed, aucune balise canonical sur tout le site, maillage interne des landings locales quasi nul.
- Validations métier référentielles manquantes côté backend : réservations dans le passé acceptées, instructorId/formationId/pricingPlanId inexistants acceptés (201), montant non vérifié — qualité des données opérationnelles et CRM dégradée.

---

## 4 · Grille de notation page par page

Axes notés sur 10. Toute note **< 8** est en gras (déclenche un plan d'amélioration). `Existe` = la page/fonction est réellement implémentée.

### Pages publiques cles

| Page | Route | Existe | UX | UI | Perf | A11y | SEO | Séc | Conv | Form |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Accueil | `/` | ✅ | **6** | **6** | **6** | **5** | **6** | **7** | **6** | **6** |
| A propos | `/a-propos` | ✅ | **7** | **7** | 8 | **6** | **5** | 8 | **5** | **5** |
| Formations liste | `/formations` | ✅ | **6** | **7** | **6** | **6** | **5** | **7** | **6** | **5** |
| Formation detail | `/formations/[slug]` | ✅ | **6** | **7** | **7** | **6** | **6** | **7** | **6** | **5** |

**Plans d'amélioration :**

- **Accueil** _(axes faibles : ux, ui, performance, accessibilite, seoLocal, conversion, experienceFormation)_ — UX (6/10) : Le CTA primaire 'Je m'inscris' mène directement à l'inscription sans valeur percue préalable — tester un CTA 'Trouver ma formation' en primaire, 'Je m'inscris' en secondaire. Deux boutons flottants superposés (WhatsApp + IA) doivent être fusionnés en un seul speed-dial. Aucun breadcrumb. Aucun loading.tsx global. La réservation BookingCalendar expose un formulaire sans prévenir l'utilisateur non connecté qu'une session est requise, et utilise un formationId par défaut hasardeux.

UI (6/10) : Trois polices Google Fonts décoratives chargées pour le seul H1 hero (Great Vibes + Allura + Permanent Marker) — rupture avec une charte premium, impact CLS/LCP. La marque est affichée 'LODENE' dans le hero H1 (aria-label + span) et dans le logo HeaderMain (ligne 97) alors que le nom officiel est LODEN. La couleur de marque #08AEB8 (loden-500) est utilisée en bordure de bouton secondaire (border-loden-500) et en icônes sans garantie de contraste WCAG. Pas de composant Button/Card mutualisé. Aucune photo réelle d'équipe ou de véhicule.

Performance (6/10) : 3 polices Google chargées en plus pour le seul hero (impact LCP potentiel > 2.5s sur mobile). L'image hero /loden-hero.jpg est un JPEG de ~200KB sans AVIF/WebP activé dans next.config (options images.formats absentes), sans blurDataURL. Le scroll-behavior: smooth est déclaré globalement dans globals.css sans être conditionné à @media (prefers-reduced-motion: reduce). Aucun loading.tsx. Proxy backend en cache:no-store systématique.

Accessibilité (5/10) : Absence totale de lien 'Aller au contenu' (skip link) en premier enfant du body dans layout.tsx. Le H1 du hero a aria-label='Passe ton permis avec LODENE' (marque erronée). role='marquee' dans HeaderTop est invalide en ARIA. scroll-behavior: smooth global non conditionné à prefers-reduced-motion (globals.css:16 n'est pas dans un bloc @media). Les badges de stats du hero (4.9/5, +500 avis) contredisent data/site.ts heroStats qui affiche '+800 élèves' et '98%' — incohérence inter-sections sur la même page. Formulaires sans aria-invalid/aria-describedby. Pas de focus trap sur la modale GlobalSearch.

SEO Local (6/10) : Aucune balise canonical dans les metadata de la page accueil (ni alternates.canonical). AggregateRating absente du JSON-LD LocalBusiness (schema.org attend ratingValue/reviewCount). openingHours est une chaîne brute non structurée (openingHoursSpecification manquante). geo (latitude/longitude) absent du JSON-LD. Mentions légales placeholder (SIRET manquant). Pages locales /permis-b-paris-11 et /auto-ecole-cpf-paris non liées depuis l'accueil. Sitemap inclut /connexion, /espace-eleve (pages privées non indexables). robots.ts autorise tout sans noindex sur les pages privées. VTC et CACES totalement absents — périmètre métier annoncé non référençable.

Conversion (6/10) : Tunnel: CTA 'Je m'inscris' sans formation choisie. Avis en dur (3 testimonials non dupliqués mais sans date ni lien Google — `testimonials.concat(testimonials)` absent ici mais les 3 seuls avis réels sont insuffisants). Stats hero (4.9/5 +500 avis) incohérentes avec heroStats (98% / +800 élèves). Qualiopi mentionné en texte dans Footer sans logo officiel ni numéro de certification. Paiement 4x affiché comme feature alors que Stripe est entièrement simulé. Aucune offre VTC/CACES malgré le périmètre annoncé.

Expérience Formation (6/10) : Les 4 formations affichées viennent de data/site.ts (mocks). Les slugs des pricingPlans (permis-b, boite-automatique, pack-cpf) ne correspondent pas aux slugs de formations (permis-b-manuel, permis-b-automatique) — les liens PricingCard mènent donc à des 404. SimulatorCard utilise des constantes mock (hourly: 58, base: 260) non synchronisées avec l'API /api/tarifs. BookingCalendar utilise des créneaux statiques de data/site.ts, non reliés à /api/bookings/slots.
- **A propos** _(axes faibles : ux, ui, accessibilite, seoLocal, conversion, experienceFormation)_ — UX (7/10) : Page structurée (Mission + Équipe) mais aucun fil d'ariane (Accueil > À propos). Le CTA de PageHero renvoie vers /contact sans contexte de la page. Aucun loading.tsx. Les instructeurs (InstructorsGrid) ne sont que 3 initiales+dégradés sans photos réelles — crédibilité dégradée. Pas de section sur l'histoire, la fondation, les certifications officielles.

UI (7/10) : La charte est cohérente (loden-pearl + blanc + turquoise fonctionnel), mais aucune image réelle ni photographie d'équipe. Les cartes de valeurs (rounded-3xl) sont cohérentes avec le reste du site. Cependant le composant InstructorCard affiche des avatars en initiales/dégradés ce qui dégrade le premium annoncé. Absence de photos réelles = note réduite.

Accessibilité (6/10) : Skip link absent (hérité de layout.tsx). Pas de breadcrumb. Les h3 dans les cartes de valeurs ('Bienveillance', 'Excellence', 'Mobilité') sont des h3 directement sous le h2 de SectionHeader — hiérarchie correcte ici. Les icônes des cartes de valeur n'ont pas aria-hidden alors qu'elles sont décoratives. InstructorsGrid non vérifié mais les initiales d'avatars sans alt texte approprié peuvent poser problème. Pas de region live.

SEO Local (5/10) : Aucune balise canonical (alternates.canonical absent des metadata). Metadata title = 'À propos' sans mention de la marque ni de la localisation Paris — très générique. Description 'Découvrez l'histoire, la mission, les valeurs et l'équipe de LODEN Auto-École' sans mots-clés locaux (Paris, permis B, auto-école Paris 11). Aucun JSON-LD LocalBusiness spécifique à la page (hérité du layout mais sans enrichissement équipe). Aucun lien vers les landing pages locales. Mentions légales liées depuis le footer mais SIRET/agrément préfectoral toujours manquants.

Conversion (5/10) : La page ne convertit pas : aucun CTA contextualisé vers une formation ou une inscription. Le seul CTA de PageHero est 'Démarrer mon inscription' (défaut) vers /contact, sans pré-remplissage du formulaire. Aucune preuve chiffrée mise en avant (taux de réussite, nombre d'élèves, années d'existence). Qualiopi mentionné en titre 'Qualiopi & CPF' dans TrustProofSection mais sans logo officiel ni numéro de certification sur cette page dédiée à la confiance.

Expérience Formation (5/10) : La page ne parle pas de formations. Aucun lien vers le catalogue formations, aucune section pédagogie, aucun détail sur les méthodes d'enseignement, les outils digitaux (app, suivi), les points de RDV. InstructorsGrid affiche des moniteurs sans spécialité de formation détaillée. VTC et CACES totalement absents alors que le périmètre métier les inclut.

Plan d'amélioration concret : (1) Ajouter alternates.canonical dans metadata. (2) Enrichir metadata.title avec mots-clés locaux ('À propos | LODEN Auto-École Paris'). (3) Ajouter un breadcrumb (Accueil > À propos) avec BreadcrumbList JSON-LD. (4) Ajouter photos réelles d'équipe via next/image. (5) Ajouter une section certifications avec logo Qualiopi officiel, numéro d'agrément préfectoral réel, SIRET. (6) Relier les moniteurs à leurs formations spécialisées. (7) Ajouter un CTA contextuel 'Découvrir nos formations' ou 'Vérifier mon CPF'.
- **Formations liste** _(axes faibles : ux, ui, performance, accessibilite, seoLocal, conversion, experienceFormation)_ — UX (6/10) : La page délègue tout à FormationExplorer (composant client). Aucun fil d'ariane. Le composant de filtre est bien fait (recherche + filtres par tag) mais les filtres actifs ne sont pas visuellement distingués assez nettement pour les utilisateurs malvoyants. Aucun état vide explicite si la recherche ne trouve rien. Le CTA de PageHero ('Être rappelé') mène vers /contact sans le slug de formation — contexte perdu. Aucun loading.tsx : le composant client monte sans skeleton, ce qui génère du CLS lors du remplacement des mocks par l'API.

UI (7/10) : FormationCard est visuellement bien exécutée (dégradés par formation, icônes distinctes, prix + durée). Cependant la grille passe directement de h1 (PageHero) à h3 (cartes) sans h2 de section visible — hiérarchie sautée. Pas de composant Button mutualisé. Les boutons de filtre ont 8+ tailles de padding différentes vs le reste du site.

Performance (6/10) : FormationExplorer est un composant 'use client' — toute la liste est rendue côté client, sans SSR ni RSC. Le fetch vers /api/formations se fait en useEffect avec cache:no-store (via proxyBackendJson), perdant tout bénéfice SSG/ISR. La page n'a pas de loading.tsx, donc aucun skeleton pendant le chargement client. Sur mobile la liste complète de 8 cartes avec images dégradées génère du reflow.

Accessibilité (6/10) : Skip link absent (layout.tsx). Hiérarchie de titres rompue : h1 (PageHero) puis directement h3 dans les FormationCard sans h2 de section. L'input de recherche a un aria-label correct ('Recherche avancée des formations') mais les boutons de filtre n'ont pas d'état aria-pressed pour indiquer le filtre actif. Le composant de filtre actif est distingué uniquement par la couleur (border-loden-700 bg-loden-700 text-white) — non-conforme WCAG si on retire la couleur.

SEO Local (5/10) : Aucune balise canonical. Metadata.description générique sans mots-clés locaux parisiens. Aucun JSON-LD ItemList ou Course list sur la page liste. Formation FormationExplorer est entièrement client-side rendered — les robots Google voient une page vide sans formations indexables. Le contenu des cartes est invisible aux robots sans JavaScript. VTC et CACES absents = 30-40% du périmètre métier annoncé non indexable.

Conversion (6/10) : Le tunnel de conversion est brisé : les pricingPlans ont des slugs divergents (permis-b, boite-automatique, pack-cpf) qui mènent à des 404 depuis PricingCard. Le CTA 'Être rappelé' du PageHero ne pré-remplit pas le formulaire. Pas de preuve sociale sur cette page (note globale, nombre d'élèves formés). Aucune urgence ni réassurance (places disponibles, prochaine session).

Expérience Formation (5/10) : Périmètre de formations limité à 8 entrées Permis B uniquement (aucun VTC, CACES, formations pro). Le filtre 'CPF' est présent mais aucun encart d'explication CPF contextualisé. Aucune comparaison de parcours (ex: Manuel vs Automatique côte à côte). La recherche libre renvoie tous les résultats vers la page detail /formations/[slug] — correct — mais les pricingPlans dans la recherche globale renvoient vers /tarifs sans ancre précise.

Plan d'amélioration : (1) Convertir FormationExplorer en RSC avec fetch ISR (next.revalidate: 300) + composant client uniquement pour les filtres (hydration partielle). (2) Ajouter un h2 sr-only 'Toutes nos formations' avant la grille. (3) Ajouter alternates.canonical. (4) Ajouter aria-pressed sur les boutons de filtre. (5) Ajouter un skeleton loading.tsx. (6) Propager le slug en query vers le CTA de contact. (7) Ajouter les formations VTC et CACES au catalogue.
- **Formation detail** _(axes faibles : ux, ui, accessibilite, seoLocal, conversion, experienceFormation)_ — UX (6/10) : Aucun fil d'ariane (Accueil > Formations > Permis B manuel) — désorientation sur une page de niveau 3. Le CTA 'Demander un devis' renvoie vers /contact#demande sans pré-remplissage du slug de formation dans le formulaire — contexte perdu. Le CTA 'Pré-inscription' mène vers /inscription sans pré-sélection de la formation. Le programme en 4 étapes est générique et identique pour toutes les formations (hardcodé, pas de données par slug). Aucun lien 'Voir aussi' vers d'autres formations. Aucun avis lié à la formation spécifique.

UI (7/10) : La mise en page hero + aside résumé est bien structurée et aérée. Les cartes de programme (étapes numérotées) et garanties (CheckCircle2) sont lisibles. Cependant les 4 étapes de programme sont strictement identiques pour toutes les formations — contenu placeholder non différencié. L'encart loden-800 en bas ('Besoin d'un planning précis?') n'a pas de CTA cliquable. La page utilise text-white/80 sur fond loden-800 (ratio ~4.24:1, limite AA).

Accessibilité (6/10) : Skip link absent (layout.tsx). Pas de breadcrumb avec BreadcrumbList JSON-LD. Les h2 'Un parcours cadré de bout en bout' et 'Des conditions lisibles avant de commencer' sont des h2 corrects (h1 > h2 > h3 — hiérarchie respectée sur cette page). L'encart final h3 'Besoin d'un planning précis?' sous un h2 est correct. Cependant text-white/80 sur loden-800 dans l'encart CTA est en limite de contraste. Le tag de mode formation (ex: 'Manuel') dans le hero est en texte loden-700 sur fond loden-pearl — à vérifier mais probablement conforme. Pas de region live.

SEO Local (6/10) : JSON-LD Course présent avec provider DrivingSchool, Offer, url de la formation — bon point. Mais aucune balise canonical (alternates.canonical absent de generateMetadata). Metadata title inclut '${formation.title} à Paris' — bon ciblage local. Description inclut durée et tarif — pertinent. Mais openGraph sans image spécifique par formation (héritage de l'OG générique du layout). Aucun BreadcrumbList JSON-LD. Aucun lien depuis la page vers les landing pages locales (ex: '/permis-b-paris-11'). Le schema.org 'offers.price' utilise formation.price directement qui est un entier euros (pas de centimes), mais le provider sameAs pointe vers le domaine correct.

Conversion (6/10) : Les deux CTA (devis + pré-inscription) ne propagent pas le contexte de la formation choisie. Le programme en 4 étapes est générique (identique pour tous les slugs) — perte de crédibilité pédagogique. Les garanties sont partiellement dynamiques (CPF conditionnel). Pas de témoignage lié à cette formation spécifique. Pas d'indication sur la disponibilité (prochaine session, places). Pas d'urgence ni de réassurance temps réel. Prix affiché 'Dès X€' mais sans explication de la fourchette haute.

Expérience Formation (5/10) : Le programme est hardcodé en 4 étapes génériques — même texte pour Permis B manuel, Code en ligne, Perfectionnement et Conduite accompagnée. Les 'Garanties LODEN' sont semi-dynamiques (CPF/financement selon le flag) mais les 3 autres sont identiques pour tous. Aucune section 'Prérequis', 'Ce qui est inclus / exclu', 'Questions fréquentes' spécifique à la formation. Aucune photo ou vidéo de la formation. Aucune comparaison avec une formation voisine. Le slug 'pack-cpf' et 'boite-automatique' venant des pricingPlans créent des 404 si on y accède depuis PricingCard — generateStaticParams ne les inclut pas.

Plan d'amélioration : (1) Ajouter alternates.canonical dans generateMetadata : `alternates: { canonical: '/formations/${slug}' }`. (2) Ajouter BreadcrumbList JSON-LD. (3) Ajouter un composant Breadcrumb UI (Accueil > Formations > {formation.title}). (4) Propager le slug en query vers /contact et /inscription : href='/contact?formation=${slug}'. (5) Enrichir la Formation avec des champs program[] et faq[] dans data/site.ts pour différencier le contenu par slug. (6) Ajouter openGraph.image spécifique par formation dans generateMetadata. (7) Corriger les slugs de pricingPlans divergents (permis-b -> permis-b-manuel, boite-automatique -> permis-b-automatique) ou ajouter ces slugs à generateStaticParams avec une redirection.

### Tunnels de conversion

| Page | Route | Existe | UX | UI | Perf | A11y | SEO | Séc | Conv | Form |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Tarifs | `/tarifs` | ✅ | **6** | **7** | **6** | **5** | **4** | **7** | **6** | **5** |
| CPF | `/cpf` | ✅ | **6** | **7** | **6** | **5** | **5** | **5** | **7** | **6** |
| Inscription | `/inscription` | ✅ | **5** | **6** | **7** | **4** | **4** | **6** | **5** | **5** |
| Paiement | `/paiement` | ✅ | **4** | **6** | **7** | **5** | **3** | **3** | **3** | **3** |
| Contact | `/contact` | ✅ | **6** | **7** | **7** | **5** | **6** | **6** | **6** | **6** |
| Réservation/RDV (BookingCalendar) | `/espace-eleve (composant BookingCalendar)` | ✅ | **5** | **7** | **7** | **4** | **2** | **5** | **4** | **5** |

**Plans d'amélioration :**

- **Tarifs** _(axes faibles : ux, performance, accessibilite, seoLocal, conversion, experienceFormation)_ — UX (6/10): Le SimulatorCard utilise des constantes mock (base+hourly) déconnectées des prix réels de PricingPlansGrid — pour 20h de Permis B manuel : base 260 + 20×58 = 1420 € vs le pack affiché à 1190 €. Le simulateur induit le visiteur en erreur avant le devis. Corriger en branchant SimulatorCard sur les données /api/tarifs. Aucun fil d'Ariane (Accueil > Tarifs). Aucun état de chargement (pas de loading.tsx) : le grid de prix apparait vide le temps du fetch côté client. Ajouter un skeleton. Les PricingCards ont des CTA qui mènent vers /paiement?plan=... mais cette page expose immédiatement un mur d'authentification sans récapitulatif du pack choisi, cassant le tunnel. PERFORMANCE (6/10): PricingPlansGrid fait un fetch côté client au montage (CSR pur) au lieu d'être rendu côté serveur ou en ISR — première impression sans prix si le backend répond lentement. Ajouter export const revalidate = 300 au niveau page ou rendre PricingPlansGrid en Server Component avec fetch ISR. Inter déclaré dans Tailwind/CSS mais jamais chargé via next/font : le site rend en system-ui. Pas de formats AVIF/WebP configurés dans next.config. ACCESSIBILITE (5/10): Aucun skip-to-content dans app/layout.tsx. Hiérarchie de titres rompue : h1 (PageHero) → h3 (PricingCard, SimulatorCard) sans h2 intermédiaire. SectionHeader pose un h2 dans la section simulateur mais les cartes de prix n'en ont pas de niveau intermédiaire visible. Le simulateur range input manque de aria-label et aria-valuetext pour vocaliser les heures. Les boutons radio de financement (SimulatorCard) utilisent de vrais inputs radio avec fieldset/legend — correct. Mais aucun aria-live pour annoncer le prix estimé mis à jour. Loden-500 (#08AEB8) utilisé dans l'icône CheckCircle2 sur fond blanc : contraste 2.71:1, échec WCAG AA. SEO LOCAL (4/10): Aucune balise canonical (absente sur toutes les pages du site). La page est incluse dans le sitemap sans différenciation de priorité par rapport à /connexion. Aucune donnée structurée spécifique à /tarifs (pas de Offer, pas de Service JSON-LD). Les packs ne sont pas liés aux pages formations correspondantes. Aucun maillage vers les landings locales (/permis-b-paris-11, /auto-ecole-cpf-paris). CONVERSION (6/10): Le CTA du Pack CPF mène vers /cpf mais celui des packs payants mène vers /paiement avec mur d'auth immédiat sans voir le récapitulatif. Aucune réassurance temps réel (places disponibles, délai de rappel, prochaine session). Le simulateur affiche des prix plus élevés que les packs, créant de la friction. Aucune preuve Qualiopi vérifiable, numéro d'agrément placeholder dans mentions légales. EXPERIENCE FORMATION (5/10): Aucune mention VTC/CACES malgré le périmètre annoncé. Le Pack CPF indique 'Sur devis' sans aucune estimation ni indication du solde CPF moyen utilisable. Aucune page détail par formation accessible depuis la grille de tarifs (les slugs de pricingPlans — permis-b, permis-accelere — ne correspondent pas aux slugs de formations — permis-b-manuel, permis-b-automatique).
- **CPF** _(axes faibles : ux, performance, accessibilite, seoLocal, securite, conversion)_ — UX (6/10): Le CpfRequestForm envoie le champ 'note' comme internalNotes directement dans le body public — un utilisateur non initié remplit un champ libellé 'Précisions' qui sera stocké en base comme note interne du staff, sans que cela lui soit expliqué. Renommer le champ en 'Message' côté front et isoler internalNotes dans un schéma admin côté backend (SEC-P3 confirmé). Aucun indicateur de temps estimé pour remplir le formulaire. Le CTA du hero (ancre #demande-cpf) est correct mais le scroll smooth n'est pas conditionné à prefers-reduced-motion. Les formations proposées dans le select CPF (4 options hardcodées) ne sont pas synchronisées avec le catalogue API. PERFORMANCE (6/10): getFaqEntries() utilise cache:'no-store' systématique, forçant le rendu dynamique de la page entière et empêchant SSG/ISR. Remplacer par { next: { revalidate: 300 } } — le backend CMS peut déclencher une revalidation à la demande. Inter non chargé (même problème global). ACCESSIBILITE (5/10): Les champs du CpfRequestForm n'ont aucun aria-invalid, aria-describedby ni aria-live. Les erreurs de validation sont rendues dans un span sans role='alert' ni id relié au champ via aria-describedby. La confirmation de succès ('Demande CPF envoyée...') n'a pas de role='status'. La FaqSection utilise correctement FAQPage JSON-LD et un id='faq'. Mais aucun skip-to-content dans le layout. SEO LOCAL (5/10): Aucune canonical. La page est correctement dans le sitemap. La FAQ dispose d'un FAQPage JSON-LD (bon point). Aucune liaison de maillage vers /auto-ecole-cpf-paris depuis la page CPF. Les formations VTC et CACES — éligibles CPF — sont totalement absentes. SECURITE (5/10): Le champ note est transmis comme internalNotes dans la requête publique POST /api/cpf/requests — un visiteur peut rédiger du contenu interne non filtré. Le backend accepte internalNotes dans le cpfRequestSchema public (ligne 16, cpf.routes.ts). Aucune protection anti-spam/CAPTCHA sur ce formulaire public consommant l'API. Rate-limit global à 120 req/min insuffisant pour les formulaires publics. Aucune case de consentement RGPD avant soumission. CONVERSION (7/10): Le parcours CPF est le plus structuré du site : étapes visuelles, formulaire dédié, section financement. Mais l'estimation du 'reste à charge' est absente (aucun simulateur CPF avec solde moyen). Le select de formation inclut seulement 4 options hardcodées vs 8+ dans le catalogue — manque l'accéléré CPF. Aucun CTA de rappel express en mode court. EXPERIENCE FORMATION (6/10): Le contenu sur les étapes CPF est pertinent mais générique — aucun chiffre réel (taux d'acceptation, délai moyen d'instruction, montant moyen financé). Aucune mention des formations VTC/CACES CPF éligibles, pourtant centrales pour un centre de formation professionnel.
- **Inscription** _(axes faibles : ux, ui, accessibilite, seoLocal, securite, conversion, experienceFormation)_ — UX (5/10): Après inscription réussie, l'utilisateur reste sur la page avec un message texte 'Compte créé pour X. Formation choisie : Y.' sans aucune redirection vers /espace-eleve ni CTA visible 'Accéder à mon espace'. Le tunnel s'arrête net. Ajouter router.push('/espace-eleve') ou au minimum un bouton CTA. Le mot de passe requiert 10 caractères minimum sans jauge de robustesse, sans bouton 'afficher le mot de passe', et la confirmation est demandée dès la première étape — friction élevée. Le copie latérale expose des détails techniques ('JWT prêt pour l'espace élève', 'Connexion CRM administrateur') qui n'ont aucun sens pour un élève — remplacer par des bénéfices utilisateurs. UI (6/10): Inter non chargé. Les checklist items de la colonne gauche utilisent border-slate-200/bg-loden-pearl cohérents mais contrastent avec la carte de formulaire bg-white/shadow-premium — présentation hétérogène. Aucune photo/illustration pour humaniser la page. ACCESSIBILITE (4/10): Aucun skip-to-content. Aucun aria-invalid, aria-describedby, ni role='alert' sur les messages d'erreur du formulaire. La confirmation de succès n'a pas role='status'. Les deux champs de mot de passe type='password' n'ont aucun bouton d'affichage et aucun message d'explication du critère de 10 caractères (information critique pour l'accessibilité cognitive). La validation croisée confirmPassword ne relie pas l'erreur au champ via aria. SEO LOCAL (4/10): La page est dans le sitemap public alors qu'une page transactionnelle de création de compte devrait avoir robots noindex. Aucun canonical. Aucune donnée structurée. SECURITE (6/10): Aucune case de consentement RGPD avant soumission. Le token JWT n'est plus exposé dans le body (la session est dans le cookie httpOnly posé par /api/auth/register — bon point, commentaire le confirme ligne 91). Aucune indication de gestion des mineurs (conduite accompagnée dès 15 ans, pas de champ date de naissance). CONVERSION (5/10): Le CTA principal du héro mène vers /contact ('Parler à un conseiller') au lieu d'inciter à s'inscrire — incohérent avec le sujet de la page. Aucun pré-remplissage de la formation depuis un paramètre URL (?formation=...) malgré des liens depuis les fiches formation. Après succès, aucune orientation vers le paiement. EXPERIENCE FORMATION (5/10): Les formations hardcodées dans le select (8 options) divergent de celles dans data/site.ts (conduite-supervisee absente, perfectionnement présent). Aucune description contextuelle de la formation sélectionnée pour aider au choix.
- **Paiement** _(axes faibles : ux, accessibilite, seoLocal, securite, conversion, experienceFormation)_ — UX (4/10): La page affiche ouvertement 'Base Stripe prête' et 'sans saisie de carte ni débit réel' — un élève arrivé ici depuis /tarifs comprend qu'il ne peut pas payer réellement. Le tunnel de paiement est un cul-de-sac. Le mur d'authentification ('Compte élève requis') s'affiche avant tout récapitulatif du pack choisi : l'élève ne voit jamais le prix, les features du pack, avant d'être forcé à se connecter. Proposer d'abord le récapitulatif du pack (issu du query param ?plan=), puis le gate d'auth. La sélection du pack par bouton radio n'est pas différenciée visuellement du plan actif par un indicateur non chromatique (uniquement border-loden-500, contraste couleur seul). ACCESSIBILITE (5/10): Les boutons radio custom du sélecteur de pack utilisent role='radio' et aria-checked (correct, cf. PaymentIntentForm:195) — c'est un des rares points positifs. Mais le radiogroup n'a pas de legend/label visible associé au groupe. Le message de succès ('Intention créée') n'a pas de role='status'. Le message d'erreur (state.status === 'error') n'a pas de role='alert'. Aucun aria-live. Skip-to-content absent. SEO LOCAL (3/10): La page /paiement est dans le sitemap et indexable, ce qui est une erreur — une page transactionnelle sans contenu de conversion doit être noindex. Aucune canonical. Aucune donnée structurée. Inclure robots: { index: false, follow: true } dans les metadata. SECURITE (3/10): CRITIQUE — le montant amountCents est fourni par le client JavaScript (PaymentIntentForm:130) et le backend l'accepte tel quel sans vérification contre le PricingPlan (payments.routes.ts:116 : amountCents: body.amountCents). Un utilisateur peut manipuler la requête pour créer une intention à 1 centime. Corriger en dérivant amountCents depuis le PricingPlan chargé côté serveur (lookup repository). Le webhook Stripe est un stub qui répond 202 sans vérifier la signature (payments.routes.ts:134). CSP en Report-Only avec unsafe-inline/unsafe-eval — non bloquant. frame-ancestors 'none' dans CSP mais X-Frame-Options: SAMEORIGIN — incohérent. CONVERSION (3/10): Cette page ne convertit pas : elle simule un paiement fictif sans débit réel, l'élève repart sans avoir payé. Tant que Stripe n'est pas intégré, requalifier la page en 'Réservation de pack / Demande de pré-inscription' avec une étape suivante claire ('Un conseiller vous envoie le lien de paiement sécurisé'). Les références techniques (stripePaymentIntentId, 'pi_mock_...') sont affichées à l'utilisateur. EXPERIENCE FORMATION (3/10): Aucun checkout réel, aucune facture, aucun reçu. La promesse de 'paiement en ligne' affichée sur tout le site n'est pas tenue. Aucune information sur les formations finançables CPF dans le tunnel de paiement.
- **Contact** _(axes faibles : ux, accessibilite, seoLocal, securite, conversion)_ — UX (6/10): Le formulaire ContactForm a 8 champs obligatoires (nom, email, téléphone, besoin, financement, délai, disponibilités, contact préféré + message min 10 chars) — friction excessive. Le champ message requiert min 10 caractères mais aucune indication n'est donnée à l'utilisateur ('Ajoute quelques précisions' sans mention du minimum). Le select 'Besoin' ne contient aucune option VTC/CACES alors que le périmètre métier les annonce. Aucun pré-remplissage depuis un query param (?besoin=permis-b-manuel depuis /formations/[slug]) alors que ce comportement est attendu. Deux boutons flottants superposés en bas à droite (WhatsApp + AiChatWidget) couvrent le formulaire sur mobile. L'iframe Google Maps charge en même temps que le formulaire sans lazy loading. ACCESSIBILITE (5/10): Aucun skip-to-content dans le layout. Les erreurs de validation n'ont aucun aria-invalid, aria-describedby ni role='alert'. Le composant Field utilise un label wrappant l'input — correct pour l'association label/input — mais l'id de l'erreur n'est pas relié via aria-describedby. La confirmation ('Diagnostic envoyé') et l'erreur globale n'ont pas role='status'/role='alert'. L'iframe Google Maps n'a pas de titre accessible (title attribute). SEO LOCAL (6/10): La page contact est un signal NAP local important mais elle manque : aucune canonical, aucune donnée structurée ContactPage JSON-LD propre à cette page (le LocalBusiness est dans le layout mais sans lien spécifique), les coordonnées géographiques sont absentes du JSON-LD global. L'adresse est correctement affichée en texte. SECURITE (6/10): Aucune case de consentement RGPD avant soumission du formulaire de contact — collecte de nom, email, téléphone sans mention de finalité ni lien vers /confidentialite. Le rate-limit global (120 req/min) est insuffisant pour une route de collecte publique sans protection CAPTCHA ni honeypot. CONVERSION (6/10): La page est bien structurée (informations de contact + formulaire + carte). Mais : aucune réassurance sur le délai de réponse ('réponse sous 24h ouvrées'), pas de CTA WhatsApp proéminent en haut, pas d'option 'Rappel express' (nom + téléphone seulement). Les données de contact (téléphone, email) sont des données mock.
- **Réservation/RDV (BookingCalendar)** _(axes faibles : ux, accessibilite, seoLocal, securite, conversion, experienceFormation)_ — UX (5/10): Un utilisateur anonyme voit le calendrier avec les créneaux et peut interagir — mais au clic sur 'Réserver', le message d'erreur 'Connecte-toi à ton espace élève pour réserver ce créneau' n'apparaît qu'après la tentative de POST (double fetch : /api/students/me puis /api/bookings). L'information que la connexion est requise doit être visible dès l'affichage du composant. Si l'élève n'a pas de formation rattachée (formationId null), le code fait un fallback hardcodé vers 'formation-permis-b-manuel' (ligne 159) — un élève inscrit en boîte automatique réserve sans le savoir avec la mauvaise formation. Ce bug silencieux est grave. L'état de soumission ('Réservation...') est visible mais le résultat (succès) ne propose aucune action suivante (voir le planning, ajouter au calendrier). ACCESSIBILITE (4/10): Les sélecteurs de jour sont des boutons sans role='radio' et sans groupe accessible (pas de role='radiogroup', pas de legend) — navigabilité aux flèches impossible. Les boutons de créneaux horaires sont dans un conteneur sans structure de groupe. Le sélecteur de point de rendez-vous utilise role='radiogroup' et role='radio' avec aria-checked (correct) mais les boutons ne supportent pas la navigation aux touches fléchées (roving tabindex manquant). Le message de résultat (bookingMessage) est un <p> sans aria-live, role='alert' (erreur) ni role='status' (succès). Skip-to-content absent. Les sélecteurs de jour n'ont pas de aria-label précisant la date complète (seulement le jour abrégé + date numérique). SEO LOCAL (2/10): Ce composant est une UI interactive sans contenu indexable. Il n'expose aucune donnée structurée Event/Schedule. Les disponibilités réelles ne sont pas visibles aux moteurs. Ce score reflète l'absence de toute valeur SEO du composant lui-même. SECURITE (5/10): Le backend bookings.routes.ts ne valide pas que startsAt > maintenant (aucune garde de date future identifiée dans le code). Un élève peut réserver dans le passé. Le code vérifie uniquement endsAt > startsAt (ligne 63). L'instructorId n'est pas validé comme appartenant à une Availability active — seul hasInstructorConflict est vérifié (conflit temporel). CONVERSION (4/10): Le composant est présenté comme argument de vente ('réservation en ligne 7j/7') mais crée de la friction : anonymes bloqués au dernier moment, fallback formation hardcodé, aucun CTA post-réservation, aucune indication du délai de confirmation. Brancher le BookingCalendar public sur de vraies disponibilités API synchronisées et ne l'afficher qu'aux élèves connectés ou avec un CTA de connexion visible dès le chargement. EXPERIENCE FORMATION (5/10): Les créneaux mockés dans data/site.ts (jours fixes Lun 08, Mar 09...) sont des dates passées en pratique. En production, le fallback affiche des dates périmées. Les vrais créneaux API (/api/bookings/slots) ne sont disponibles que si le backend tourne. Aucune information sur le moniteur associé au créneau, le type de véhicule, ou le point de rendez-vous pré-sélectionné selon la formation.

### Pages secondaires & legales & SEO

| Page | Route | Existe | UX | UI | Perf | A11y | SEO | Séc | Conv | Form |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Avis | `/avis` | ✅ | **6** | **7** | **6** | **5** | **5** | **7** | **6** | **5** |
| Blog | `/blog` | ✅ | **4** | **6** | 8 | **6** | **2** | 9 | **5** | **3** |
| Connexion | `/connexion` | ✅ | **5** | **7** | 8 | **5** | **4** | **6** | **6** | **6** |
| Mentions legales | `/mentions-legales` | ✅ | **7** | **7** | 9 | **7** | **4** | **5** | **4** | **6** |
| Confidentialite | `/confidentialite` | ✅ | **7** | **7** | 9 | **7** | **4** | **4** | **4** | **6** |
| Cookies | `/cookies` | ✅ | **5** | **7** | 9 | **7** | **4** | **5** | **4** | **6** |
| Landing auto-ecole-cpf-paris | `/auto-ecole-cpf-paris` | ✅ | **6** | **7** | **7** | **5** | **5** | **5** | **7** | **6** |
| Landing permis-b-paris-11 | `/permis-b-paris-11` | ✅ | **6** | **7** | 8 | **6** | **5** | **7** | **6** | **6** |

**Plans d'amélioration :**

- **Avis** _(axes faibles : ux, ui, performance, accessibilite, seoLocal, conversion, experienceFormation)_ — UX (6/10): ReviewsGrid charge les avis de l'API en client-side avec un fallback `testimonials.concat(testimonials)` — la duplication de 6 avis identiques est visible immediatement. Supprimer la concatenation en doublon, afficher au minimum les 6 avis uniques, ajouter un CTA 'Voir tous nos avis Google' avec lien vers la fiche GBP. Ajouter les stats (4.9/5, 98%) dans le JSON-LD aggregateRating plutot qu'en dur dans le DOM seul. Ajouter des dates sur les temoignages et un lien formation par avis pour credibiliser.

UI (7/10): Les etoiles utilisent `fill-loden-500` et `text-loden-500` (#08AEB8) sur fond blanc — contraste decoratif acceptable mais les cartes stats n'ont aucune distinction hierarchique. Les photos de temoignages sont des initiales+degrades sans photos reelles.

Performance (6/10): ReviewsGrid est un composant client qui fetch au mount sans skeleton/suspense, causant un layout shift (CLS) et une periode sans contenu. Aucun loading.tsx sur /avis. Remplacer par un fetch serveur (ou ISR) avec fallback statique pour eliminer le CLS et ameliorer le LCP.

Accessibilite (5/10): Aucun lien 'aller au contenu' global. Les erreurs de formulaire (present sur les CTA de la page) ne sont pas reliees via aria-describedby. Les etoiles decoratives devraient avoir aria-hidden='true' (non verifie). Le schema h1 > h2 > h3 semble correct mais les cartes qualitySignals utilisent h3 sans h2 visible intermediaire. Les stats (4.9/5, 98%) ne sont pas vocalises avec des unites claires.

SEO Local (5/10): aggregateRating code en dur (4.9 / reviewCount:128) alors que l'API renvoie 3 avis reels — incoerence E-E-A-T majeure pour Google. Aucune balise canonical sur la page. La page est dans le sitemap mais sans alternates. Aucun lien depuis les pages formations/landing locales vers /avis. Aucune mention de Paris 11 ou zone geographique. Corriger: (1) synchroniser aggregateRating avec l'API reviews, (2) ajouter canonical, (3) ajouter maillage entrant depuis /formations, /cpf, landing locales.

Conversion (6/10): La page se ferme sur deux CTA generiques (Parler a l'equipe, Voir les formations). Pas de CTA 'Laisser un avis' ni de lien vers la fiche Google. Les 6 temoignages dupliques nuisent a la credibilite. Ajouter: un CTA Google Reviews, un bouton 'Rejoindre les X eleves' avec lien /inscription, contextualiser chaque avis avec la formation suivie.

Experience Formation (5/10): Aucun avis ne mentionne de formation specifique (permis B, CPF, accelere). Aucun filtre par formation ni par note. La section 'qualite suivie' decrit un processus interne sans benefice eleve concret. Les taux cites (98% reussite, 92% recommandation) ne sont pas sources ni lies aux examens CRM. Brancher ces KPIs sur /api/admin/stats (passRate deja expose) et les rendre visibles aux visiteurs.
- **Blog** _(axes faibles : ux, ui, accessibilite, seoLocal, conversion, experienceFormation)_ — UX (4/10): Le /blog est un leurre editorial — 3 cartes avec le label 'Lire le guide' qui renvoient vers /formations, /cpf et /formations/code-en-ligne. Aucun article reel, aucune route /blog/[slug], aucune date, aucun auteur, aucun temps de lecture. L'utilisateur qui cherche un article est redirige vers une page produit sans avertissement. Soit (a) creer de vrais articles (MDX ou via le backend content module deja present) avec route /blog/[slug] + pagination + categories, soit (b) renommer explicitement la section 'Guides pratiques' et supprimer le libelle 'Blog' du titre/menu pour ne pas creer de fausse attente.

UI (6/10): La mise en page 3 colonnes est propre mais monotone — icones identiques en taille/couleur, aucune image, aucune date. Ajouter des visuels distincts par categorie, une meta-info (date fictive ou 'Mis a jour en 2026'), et differencier visuellement les 3 cartes (une en avant-plan).

Accessibilite (6/10): Les titres h2 dans les cards sont corrects. Pas de main id='contenu' ni de skip link global. Le CTA 'Lire le guide' est identique pour les 3 cartes — pas de texte accessible distinctif (probleme pour les lecteurs d'ecran). Corriger: soit aria-label='Lire le guide: [titre article]' sur chaque lien, soit integrer le titre dans le texte du lien.

SEO Local (2/10): La page /blog n'a aucun contenu editorial reel. Aucune balise canonical. Aucun schema Article/BlogPosting. Aucun lien vers les landing locales. Aucun mot-cle local (Paris, Paris 11). Le blog est indexe dans le sitemap mais n'apporte aucune valeur SEO — il risque d'etre penalise pour 'thin content'. C'est la page la plus faible du groupe en SEO. Corriger: creer au minimum 3 vrais articles (guide permis CPF Paris, code de la route 2026, conduite accompagnee) avec JSON-LD BlogPosting, inter-liens vers landing locales et formations.

Conversion (5/10): Les 3 cartes redirigent vers des pages produit, ce qui peut convertir indirectement, mais sans parcours clair. Pas de CTA 'S'inscrire' ni 'Etre rappele' en sortie de blog. Ajouter un bloc de conversion en bas de page ('Prêt a passer ton permis ?') avec lien /inscription ou /contact.

Experience Formation (3/10): Aucun contenu sur les formations specifiques (conduite accompagnee, accelere, VTC, CACES absents). Aucun guide pratique sur le deroulement d'un examen, les etapes de formation, la preparation au code. La page n'apporte aucune valeur pedagogique. C'est un placeholder complet depuis le deploiement initial.
- **Connexion** _(axes faibles : ux, ui, accessibilite, seoLocal, securite, conversion, experienceFormation)_ — UX (5/10): Aucun lien 'Mot de passe oublie ?' — pourtant identifie comme stub critique (SEC-03/ARCH-04). Un utilisateur bloque n'a aucun recours. Le formulaire ne mentionne pas les donnees techniques ('Cette base utilise le JWT du backend LODEN') qui fuient dans le SectionHeader cote utilisateur (texte de dev expose). Supprimer ou masquer ce texte technique. Aucun affichage/masquage du mot de passe. Aucun etat de chargement visible (seulement le texte du bouton change). Pas de redirection automatique si deja connecte.

UI (7/10): La mise en page 2 colonnes avec SectionHeader + LoginForm est propre. Le bouton bg-loden-700 est correct pour le contraste. Mais le champ mot de passe n'a pas d'icone toggle. Le SectionHeader inclut une description technique ('JWT du backend LODEN') inappropriee pour un utilisateur final.

Accessibilite (5/10): Le composant Field utilise une balise `<label>` wrappante, ce qui est correct, mais les erreurs ne sont pas reliees via aria-describedby/aria-invalid sur les inputs. Les messages d'erreur n'ont pas role='alert'. L'erreur globale (submitError) n'a pas aria-live. Aucun skip link global. Le lien 'Creer mon compte eleve' a un contraste correct (loden-700) mais le texte autour ('Pas encore de compte ?') est text-loden-muted.

SEO Local (4/10): La page est indexee dans le sitemap alors qu'elle devrait etre en noindex (page transactionnelle privee). Aucune balise canonical. Aucune meta robots:noindex. La description metadata ('Connexion a l'espace eleve LODEN Auto-Ecole') est generique. Corriger: ajouter `robots: { index: false, follow: true }` dans les metadata, retirer du sitemap.

Securite (6/10): Pas de protection CAPTCHA ni rate-limit dedie cote front (le rate-limit global backend 120 req/min s'applique mais n'est pas specifique a /auth/login). Le token JWT est renvoy dans le body de reponse et lu cote client pour decoder le role — le security finding SEC-08 identifie ce pattern comme a corriger (renvoyer uniquement {user} sans le token). Pas de lien mot de passe oublie (stub non implemente). Pas de message different entre 'email inconnu' et 'mot de passe incorrect' (bien — pas de user enumeration), mais a documenter.

Conversion (6/10): Le CTA 'Creer un compte' dans le PageHero et le lien 'Creer mon compte eleve' en bas du formulaire sont presents. Mais aucun contexte motivant (pas de rappel des benefices de l'espace eleve: suivi formation, reservations, paiements). Ajouter 2-3 bullets de benefices cote gauche sous le SectionHeader.

Experience Formation (6/10): La page prepare bien l'acces a l'espace eleve mais n'informe pas sur ce qu'on trouve apres connexion (planning, suivi code, historique RDV). Ajouter un encart 'Votre espace eleve comprend: suivi de formation, documents, reservations de lecons' pour contextu aliser la connexion.
- **Mentions legales** _(axes faibles : seoLocal, securite, conversion)_ — SEO Local (4/10): La page est indexee dans le sitemap sans raison SEO. Aucune balise canonical. Les mentions legales sont squeletiques et incompletes: SIRET, forme juridique, capital social, numero d'agrement prefectoral, directeur de publication, hebergeur — tous marques 'a completer'. Un site public avec des mentions incompletes constitue une infraction a l'article 6 de la LCEN. Corriger avant mise en prod: (1) remplir toutes les informations legales reelles, (2) ajouter noindex/nofollow dans les metadata, (3) retirer du sitemap.

Securite (5/10): L'absence de SIRET, d'agrement prefectoral et d'identite juridique complete expose l'editeur a un risque legal (LCEN art. 6). L'absence de mention de la base legale RGPD pour chaque traitement est un manquement CNIL. Aucune mention du DPO ni de procedure de plainte aupres de la CNIL. Corriger imperativement avant tout lancement public: SIRET reel, numero d'agrement E-XXXXX, hebergeur avec adresse complete, DPO ou contact RGPD designe.

Conversion (4/10): Normal pour une page legale, mais aucun CTA de retour vers les formations ou l'accueil. Ajouter un simple lien 'Retour a l'accueil' ou 'Voir nos formations' en bas de page pour eviter les sorties definitives sur cette page.
- **Confidentialite** _(axes faibles : seoLocal, securite, conversion)_ — SEO Local (4/10): Indexee dans le sitemap sans valeur SEO. Aucune canonical. Ajouter noindex dans les metadata et retirer du sitemap.

Securite (4/10): La politique de confidentialite presente des lacunes RGPD majeures: (1) aucune base legale identifiee par traitement (consentement, interet legitime, execution de contrat), (2) aucune duree de conservation precise par categorie de donnee (vague: 'duree necessaire'), (3) aucune mention des sous-traitants reels avec leurs pays de traitement, (4) aucune mention du droit a la portabilite (art. 20 RGPD) ni du droit d'opposition (art. 21 RGPD), (5) aucune mention du DPO ni d'autorite de controle (CNIL), (6) aucun mecanisme de retrait du consentement decrit. La section Securite contient une phrase embarrassante en production: 'Les secrets de production, acces administrateurs... doivent etre configures de facon securisee avant mise en ligne' — texte de chantier a supprimer absolument. Corriger avant lancement: base legale par traitement, durees precises, droits RGPD complets, contact DPO, mention CNIL.

Conversion (4/10): Meme remarque que mentions-legales: pas de CTA de retour. Ajouter un lien vers /contact pour l'exercice des droits et un lien vers /cookies pour la coherence de navigation.
- **Cookies** _(axes faibles : ux, seoLocal, securite, conversion)_ — UX (5/10): La page cookies decrit des possibilites hypothetiques ('peut utiliser', 'peut etre ajoute') sans indiquer ce qui est reellement en place. L'utilisateur ne sait pas quels cookies sont actuellement actifs. Aucun bandeau de consentement sur le site (absent du layout.tsx). Aucun mecanisme de gestion des choix (toggle par categorie). La phrase 'configure ton navigateur pour bloquer' renvoie sur l'utilisateur une responsabilite que la loi met sur l'editeur (consentement prealable). Corriger: (1) lister les cookies reellement deposes avec leur nom, duree, finalite, (2) implementer un bandeau de consentement conforme ePrivacy (minimum pour les cookies non essentiels), (3) ajouter un systeme de preference par categorie.

SEO Local (4/10): Indexee dans le sitemap. Ajouter noindex, retirer du sitemap.

Securite (5/10): La page parle de 'cookies techniques' pour la session sans preciser que le cookie loden_session est httpOnly/Secure/SameSite=Lax — information utile pour la transparence RGPD. L'absence de banniere de consentement est un manquement ePrivacy (directive cookies) si des cookies analytics ou de tracking sont ulterieurement ajoutes. Le cookie de session admin (loden_session) n'est pas mentionne explicitement.

Conversion (4/10): Aucun CTA de retour. Ajouter lien vers /confidentialite et /mentions-legales pour cohesion de navigation legale.
- **Landing auto-ecole-cpf-paris** _(axes faibles : ux, ui, performance, accessibilite, seoLocal, securite, experienceFormation)_ — UX (6/10): Le CTA hero 'Verifier mon CPF' pointe vers l'ancre #demande-cpf — comportement attendu correct. Cependant le formulaire CpfRequestForm ne beneficie pas de pre-remplissage depuis la query string. Les steps (Diagnostic, Reste a charge, Planning) sont presentees comme des composants `<article>` avec h2 repetitifs et sans numerotation visible. La FAQ n'a pas de schema accordeon (tout est toujours visible). Ajouter: propagation du contexte CPF en query vers le formulaire, numerotation des etapes, accordeon FAQ interactif.

UI (7/10): Structure propre mais les composants Step et InfoCard partagent le meme visuel sans differenciation claire. Aucune photo, aucun badge Qualiopi/agrément visible. La section FAQ utilise des cartes statiques sans interactivite.

Performance (7/10): Page statique SSR, pas de fetch client au mount. Le formulaire CpfRequestForm inclut une logique client (useState, useForm) qui alourdit le bundle. Aucun loading.tsx. La page n'active pas d'ISR explicite (bonne pour le build statique Next mais verifier le comportement en prod).

Accessibilite (5/10): Le composant CpfRequestForm n'a pas d'aria-invalid ni d'aria-describedby sur les champs. Les erreurs de validation ne sont pas reliees aux inputs. Les messages de succes/erreur n'ont pas de role='alert' ni aria-live. La FAQ utilise des h2 dans des articles mais le niveau de titre est incoherent (le h1 de PageHero est suivi directement de h2 dans les Steps et dans la FAQ sans structure intermediaire). Aucun skip link. Le champ 'internalNotes' est soumis publiquement (voir securite).

SEO Local (5/10): Aucune balise canonical. Aucun JSON-LD FAQPage malgre une section FAQ presente (3 questions/reponses). Aucun JSON-LD LocalBusiness specifique (seul l'organisation globale du layout existe). Maillage interne minimal: un seul lien sortant vers /tarifs — aucun lien vers /formations, /cpf (page parent), ni vers /permis-b-paris-11 (page soeur). Les pages formations ne lient pas vers cette landing (cocon SEO absent). La page est dans le sitemap mais sans priorite differenciee. Corriger: (1) ajouter canonical, (2) injecter FAQPage JSON-LD, (3) ajouter liens internes reciproques vers /cpf et /permis-b-paris-11.

Securite (5/10): Le formulaire CpfRequestForm envoie le champ `internalNotes` (aliase 'note' cote front) directement dans le body public POST /api/cpf/requests — confirm par le code CpfRequestForm.tsx:66 et cpf.routes.ts:16. Ce champ est reserve aux notes internes staff et ne devrait pas etre accessible a un anonyme. Supprimer internalNotes du schema public cote frontend et backend (separation des schemas publics/internes). Aucun CAPTCHA ni protection anti-bot sur ce formulaire public.

Experience Formation (6/10): La page presente le processus CPF mais n'indique pas quelles formations sont eligibles CPF avec leurs montants precis. Les 4 formations dans le select CPF (Permis B manuel, automatique, accelere, annulation permis) sont codees en dur et divergent du catalogue API. Brancher sur /api/formations pour afficher les formations marquees cpf:true avec leurs montants.
- **Landing permis-b-paris-11** _(axes faibles : ux, ui, accessibilite, seoLocal, conversion, experienceFormation)_ — UX (6/10): La landing est la page la plus legere du groupe — 4 bullets highlights, 3 infocards (adresse/horaires/financement), une bande CTA. Pas de formulaire de contact ou de demande devis en ligne: le CTA 'Obtenir mon diagnostic' et 'Demander un diagnostic' renvoient vers /contact sans contexte CPF/permis-b-paris-11. La page ne capture pas le lead en place. Ajouter un formulaire court integre (nom, telephone, besoin) ou referencer le formulaire /contact avec query ?besoin=permis-b-paris-11 en pre-remplissage.

UI (7/10): Structure propre, section hero coherente avec la charte. Les 4 highlights en cartes sont visuellement repetitifs (icone identique BadgeCheck). Le bandeau CTA loden-700 est correct. Aucune carte Google Maps integree malgre la mention de l'adresse exacte (24 av. de la Republique). Ajouter une carte ou un lien Google Maps enrichi.

Accessibilite (6/10): h2 repetes dans les InfoCard sans lien semantique avec le h1. Les cartes highlights utilisent `<p>` a l'interieur d'un `<article>` mais sans titre (juste une BadgeCheck + texte) — structure incomplete. Aucun skip link global. Le lien /contact dans le bandeau CTA n'indique pas que c'est pour un 'permis B Paris 11' (texte generique).

SEO Local (5/10): Aucune balise canonical. Aucun JSON-LD LocalBusiness specifique a cette page ni au point de RDV Republique (seul le layout injecte le JSON-LD global sans GeoCoordinates ni hasMap). Aucun schema FAQPage ni BreadcrumbList. Maillage interne extremement faible: un seul CTA vers /contact, aucun lien vers /formations/permis-b-manuel, /formations/permis-b-automatique, /tarifs, /cpf ni /auto-ecole-cpf-paris. Les pages formations ne lient pas en retour vers cette landing. Corriger: (1) ajouter canonical, (2) JSON-LD LocalBusiness avec geo+adresse Republique, (3) 3-4 liens internes contextuels vers formations specifiques, (4) BreadcrumbList JSON-LD.

Conversion (6/10): Le CTA est present mais renvoie vers /contact sans pre-contexte. La page n'a pas de social proof (aucun avis, aucun nombre d'eleves Paris 11), aucune preuve d'agrément, aucun badge CPF. Ajouter: 1-2 temoignages d'eleves Paris 11, badge 'CPF accepte', lien vers /avis, formulaire lead integre.

Experience Formation (6/10): La page mentionne 'formation manuelle ou automatique' et 'CPF/fractionnement' mais sans tarifs indicatifs ni detail de parcours. Aucun lien vers les fiches formation correspondantes. Un eleve potentiel ne sait pas combien d'heures ni quel prix il peut attendre. Ajouter des liens vers /formations/permis-b-manuel, /formations/permis-b-automatique et /tarifs avec les prix indicatifs.

### Espaces utilisateurs

| Page | Route | Existe | UX | UI | Perf | A11y | SEO | Séc | Conv | Form |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Espace élève | `/espace-eleve` | ✅ | **5** | **6** | **5** | **5** | **3** | **5** | **5** | **4** |
| Espace formateur | `/espace-formateur` | ❌ | **0** | **0** | **0** | **0** | **0** | **0** | **0** | **0** |
| Header global | `components/HeaderMain.tsx + components/HeaderTop.tsx` | ✅ | **6** | **6** | **7** | **5** | **5** | **6** | **7** | **6** |
| Footer global | `components/Footer.tsx` | ✅ | **7** | **7** | 8 | **5** | **5** | **7** | **6** | **5** |

**Plans d'amélioration :**

- **Espace élève** _(axes faibles : ux, ui, performance, accessibilite, seoLocal, securite, conversion, experienceFormation)_ — UX (5/10) : La page est accessible sans authentification, ce qui est bien, mais le dashboard connecté expose le raw formationId (ex. 'permis-b-manuel') au lieu du titre via les mappers (lib/catalog-mappers.ts). Les statuts de dossier/réservation/paiement sont affichés en snake_case anglais brut (ex. 'en_attente' au lieu de 'En attente de confirmation'). La liste de documents à préparer est codée en dur, non liée au vrai dossier StudentDocument (inexistant en surface). Le booking ne propose aucun CTA direct (le lien '#reservation' pointe vers l'accueil, pas vers un formulaire fonctionnel). Après logout le rechargement est géré mais aucun feedback visuel immédiat. Plan : (1) mapper formationId -> titre via getCatalog, (2) créer un dictionnaire de traduction des statuts réutilisable, (3) remplacer la checklist statique par les vrais documents StudentDocument depuis /api/students/:id/documents quand implémenté, (4) remplacer href='/#reservation' par /tarifs avec ancre claire.

UI (6/10) : Le layout cards est fonctionnel et cohérent avec la charte. Points négatifs : le bouton 'Créer un compte' du PageHero est inutile quand l'utilisateur est déjà connecté (pas de rendu conditionnel). Aucun skeleton/état de chargement visuel (le texte 'Synchronisation du profil...' remplace un vrai squelette). Les métriques (Metric cards) n'ont pas de taille fixe, pouvant provoquer un CLS. L'icône GraduationCap est réutilisée deux fois pour 'Formation' et 'Progression', sans différenciation. Plan : (1) masquer le CTA hero si session active, (2) ajouter un squelette Tailwind (animate-pulse) sur les cards métriques pendant le chargement, (3) différencier les icônes.

Performance (5/10) : Le composant est 'use client' et lance 4 fetch parallèles au mount (/api/auth/me, /api/students/me, /api/bookings, /api/payments) sans aucun cache - tous avec cache:'no-store' par défaut via le proxy. Aucun loading.tsx dans app/espace-eleve/, donc pas de streaming SSR. Les 4 fetch sont faits même si l'utilisateur est anonyme (le 401 est détecté en cascade seulement après les 4 réponses). Plan : (1) vérifier la session en premier (fetch /api/auth/me) avant de lancer les 3 autres fetch, (2) ajouter app/espace-eleve/loading.tsx avec squelettes, (3) envisager de passer les données non sensibles en RSC avec cookies pour éviter les waterfalls client.

Accessibilité (5/10) : Plusieurs problèmes P1 héritées du layout global s'appliquent ici : (a) aucun lien 'skip to content' dans app/layout.tsx - sur cette page avec beaucoup de cartes, l'utilisateur clavier doit traverser tout le header, (b) les cards Metric et StatusPill n'ont ni role ni aria approprié (article est correct sur Metric), (c) le bouton 'Se déconnecter' déclenche un appel async mais n'a pas d'état chargement accessible (aria-busy, aria-disabled), (d) la barre de progression (div avec width%) n'a ni role='progressbar' ni aria-valuenow/aria-valuemin/aria-valuemax ni aria-label. Plan : (1) ajouter role='progressbar' aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label='Progression pédagogique' sur la div de progression, (2) ajouter aria-busy au bouton logout pendant le fetch, (3) corriger le skip-link au niveau layout.

SEO local (3/10) : La page est indexée dans le sitemap (app/sitemap.ts ligne 16) mais ne devrait pas l'être - c'est une page privée, vide pour les non-connectés (aucune valeur SEO). Pas de canonical. Les metadata sont minimales : title 'Espace élève' sans marque, description générique. Pas de robots:noindex. Plan : (1) ajouter robots: { index: false, follow: true } dans le metadata de la page, (2) retirer /espace-eleve du sitemap.ts, (3) si on souhaite une landing publique pour la conversion, créer une page dédiée /espace-eleve/presentation avec du contenu éditorial.

Sécurité (5/10) : L'authentification repose sur le cookie httpOnly loden_session, ce qui est correct. Mais le middleware.ts ne protège que /admin/*, /espace-eleve est entièrement exposé sans protection middleware (seule la page affiche un état 'anonyme' côté client). Cela signifie que le shell HTML de la page est accessible sans authentification, et que les 4 fetch API au mount fuient des informations sur l'état de la session (les 401 confirment que la route existe). La page ne contient pas de token CSRF explicite. Plan : (1) soit ajouter /espace-eleve/* au matcher du middleware pour rediriger immédiatement vers /connexion, soit accepter l'approche SPA avec affichage conditionnel (mais documenter ce choix), (2) les endpoints API eux-mêmes sont protégés côté backend ce qui est le vrai garde-fou.

Conversion (5/10) : Le CTA du PageHero ('Créer un compte' -> /inscription) est affiché même quand l'utilisateur est connecté - incohérence majeure. Pour un utilisateur non connecté, le call-to-action de connexion dans le state 'anonymous' est bien placé. Pour l'utilisateur connecté, les actions proposées (Réserver, Préparer un paiement, Contacter) sont utiles mais manquent de contexte : 'Préparer un paiement' ne pré-remplit pas la formation déjà connue. La section 'Documents à préparer' est statique et ne reflète pas le vrai statut du dossier. Plan : (1) masquer/remplacer le CTA hero selon l'état d'auth, (2) propager formationId en query sur les liens vers /paiement et /#reservation.

Expérience formation (4/10) : C'est l'axe le plus faible. La notion de 'progression' se résume à un pourcentage brut sans décomposition pédagogique (pas de modules, pas d'objectifs RESR, pas de compétences validées bien que setStudentSkill existe dans le repo). Le formationId brut est affiché. Aucune date d'examen prévisionnelle. Aucun lien vers le code de la route ou les exercices en ligne. Les réservations n'affichent que le prochain créneau sans historique. Les paiements n'affichent que la dernière intention sans tableau récapitulatif ni facture. Plan : (1) mapper formationId vers titre+description, (2) exposer les compétences StudentSkill via GET /api/students/:id/skills et les afficher sous forme de checklist par catégorie, (3) ajouter un accès à la liste complète des réservations passées/futures, (4) afficher l'examen prévu issu de /api/exams (filtré par studentId).
- **Espace formateur** _(axes faibles : ux, ui, performance, accessibilite, seoLocal, securite, conversion, experienceFormation)_ — La page /espace-formateur n'existe pas du tout. Aucun fichier app/espace-formateur/page.tsx, aucun composant dédié, aucune route protégée pour le rôle MONITEUR dans middleware.ts. Pourtant le backend dispose de tout ce qu'il faut : rôle MONITEUR câblé dans permissions.ts, endpoints /api/bookings, /api/students/:id/skills (setStudentSkill), /api/instructors. Le planning CRM (components/crm/Planning.tsx) filtre par instructorId mais n'est accessible que par les admins. Scores à 0 : la page est absente, il n'existe pas même un accès limité.

Plan de création complet :
1. Créer app/espace-formateur/page.tsx protégé par middleware.ts (étendre le matcher à /espace-formateur/* en autorisant le rôle MONITEUR - 1 ligne).
2. Créer components/InstructorDashboard.tsx qui consomme : GET /api/bookings (filtre par instructorId issu du profil) pour le planning du jour/semaine, GET /api/students (avec filtre par les élèves affectés au moniteur), GET /api/students/:id/skills pour la saisie des compétences RESR.
3. Exposer une vue de saisie de compétences : formulaire simple par compétence (checkbox + niveau 1-3), appel PATCH /api/students/:id/skills.
4. Adapter LoginForm pour rediriger vers /espace-formateur quand role === 'MONITEUR' (actuellement la redirection post-login est vers /espace-eleve ou /admin seulement).
5. Ajouter le lien dans le Header (visible uniquement si role MONITEUR, détecté via /api/auth/me) ou en option dans le menu mobile.
6. Effort estimé : 3-5 jours (1 page + 1 composant + middleware update + test).
- **Header global** _(axes faibles : ux, ui, accessibilite, seoLocal, securite, conversion, experienceFormation)_ — UX (6/10) : Le menu mobile (hamburger) n'a pas de gestion de la touche Escape pour fermer, ni de piège de focus (le focus s'échappe hors du menu ouvert). Le dropdown desktop gère bien onFocus/onBlur mais pas les flèches clavier (pattern ARIA Disclosure Menu vs Navigation Menu). Les liens du sous-menu Formations pointent vers /formations/permis-b-manuel etc. - certains slugs mènent à des 404 (ex. conduite-accompagnee qui redirige vers perfectionnement selon les findings QA). Le CTA 'Inscription' est correctement mis en avant (variant solid) mais 'Espace Élève' est affiché même si l'utilisateur est déjà connecté, sans personnalisation (idéalement montrer 'Mon espace' avec prénom). Plan : (1) ajouter onKeyDown Escape sur le bouton hamburger et le panneau mobile, (2) re-focuser le bouton hamburger à la fermeture du menu, (3) corriger les slugs cassés dans dropdowns[], (4) détecter la session côté client via /api/auth/me en lazy pour personnaliser le libellé.

UI (6/10) : Le logo affiche 'LODENE' (HeaderMain.tsx ligne 97) au lieu de 'LODEN' - faute de marque critique. Le ticker HeaderTop utilise role='marquee' qui n'est pas une valeur ARIA valide. Les icônes décoratifs des footer social (loden-500 sur fond blanc) sont décoratives donc le contraste est acceptable, mais le FAB de l'assistant (bg-loden-500 texte blanc) échoue WCAG AA (2.71:1). La charte visuelle du header est cohérente et premium (dégradé, backdrop-blur, pill design) mais la présence simultanée du bouton WhatsApp (bottom-5) et de l'assistant IA (bottom-24) crée une collision visuelle en bas à droite sur mobile. Plan : (1) corriger 'LODENE' -> 'LODEN' ligne 97 de HeaderMain.tsx, (2) remplacer bg-loden-500 par bg-loden-700 sur le FAB AiChatWidget, (3) décaler le bouton WhatsApp à bottom-5 left-5 OU fusionner en speed-dial.

Accessibilité (5/10) : Problèmes P1 identifiés dans le code réel : (a) aucun lien 'skip to content' avant HeaderTop/HeaderMain dans app/layout.tsx (les utilisateurs clavier traversent tout le header sur chaque page), (b) le menu mobile n'implémente pas la fermeture par Escape ni la gestion du focus à la fermeture - seul aria-expanded est présent, (c) role='marquee' dans HeaderTop est invalide en ARIA, (d) .focus-ring utilise outline-loden-500 dont le contraste (2.71:1 sur fond blanc) est insuffisant selon WCAG 2.1 AA pour un anneau de focus. Les dropdowns desktop gèrent bien focus/blur (lignes 155-162) - c'est un point positif. Plan : (1) ajouter dans app/layout.tsx : <a href='#contenu' className='sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-loden-800 focus:px-4 focus:py-2 focus:text-white'>Aller au contenu</a> et id='contenu' sur le main, (2) ajouter onKeyDown Escape sur le bouton hamburger + document.activeElement restoration, (3) remplacer role='marquee' par aria-hidden='true' sur le ticker (contenu redondant), (4) passer outline-loden-700 dans .focus-ring.

SEO local (5/10) : Le header n'expose pas de structured data propre, mais influence le SEO via la navigation. Les dropdowns créent des liens crawlables vers /formations, /cpf, /tarifs - c'est positif. Mais /cpf#faq pointe vers une ancre fragile (à tester). Les pôles VTC et CACES sont totalement absents du menu alors qu'ils font partie du périmètre métier annoncé. Aucun lien vers les pages locales (permis-b-paris-11, auto-ecole-cpf-paris) dans le menu principal - ces pages sont orphelines. Plan : (1) ajouter un lien 'Nos zones' dans le dropdown 'Découvrir' pointant vers les landings locales, (2) vérifier que /cpf#faq scroll vers un id='faq' existant.

Sécurité (6/10) : Le middleware.ts ne vérifie pas la signature JWT (il utilise decodeJwtRole qui décode sans vérification de signature - risque de token forgé pour bypass du shell admin côté front). Pour le header lui-même, aucune vulnérabilité directe. Les liens externes (réseaux sociaux) ont rel='noreferrer'. Plan : vérifier/signer le JWT dans middleware.ts via jose/jwtVerify (finding SEC-07).

Conversion (7/10) : Bon positionnement du CTA 'Inscription' en variant solid bien visible. Le CTA 'Espace Élève' offre un retour rapide aux utilisateurs existants. Manque : (1) aucun numéro de téléphone visible dans le header (le HeaderTop ne l'affiche pas, uniquement le ticker), (2) pas de CTA contextuel selon la page (ex. sur /formations afficher 'Demander un devis' au lieu de 'Inscription'), (3) le ticker affiche '98% de réussite' et '+2000 élèves' hardcodés - pas synchronisés avec les stats réelles.

Expérience formation (6/10) : La navigation Formations est organisée par type de permis - logique métier correcte. Mais les pôles CACES et VTC sont absents. Le menu 'Financement' regroupe correctement CPF + Tarifs + Paiement en plusieurs fois + Aides - bon regroupement sémantique. La personnalisation selon le rôle de l'utilisateur (élève vs moniteur vs admin) est absente : tous voient le même menu.
- **Footer global** _(axes faibles : ux, ui, accessibilite, seoLocal, conversion, experienceFormation)_ — UX (7/10) : Le footer est structurellement propre (4 colonnes : identité, navigation, guides locaux, contact). Manques : (1) aucun lien vers /espace-eleve ni /connexion dans la navigation footer - l'accès au compte est absent en bas de page, (2) la colonne 'Guides locaux' n'inclut que 2 pages - faible maillage interne, (3) les informations d'horaires (Lun-Sam 8h-20h) et l'adresse sont présentes mais pas cliquables vers Google Maps (la variable directionsHref est construite mais n'est pas utilisée pour le texte de l'adresse - seul le MapPin icon clique). Attendre : l'icône MapPin sur l'adresse crée un lien vers Google Maps, c'est bien.

UI (7/10) : Le design est propre et cohérent avec la charte (blanc sur fond blanc, typographie sobre, icônes loden-500 pour le contact). Problème : les icônes Phone, Mail, MapPin utilisent text-loden-500 (#08AEB8) sur fond blanc - contraste de 2.71:1 insuffisant pour WCAG AA. Ces icônes sont décoratives (le texte adjacent porte l'info) donc techniquement acceptable, mais la règle de palette devrait les passer en loden-400 ou les déclarer explicitement aria-hidden='true'. Le badge Qualiopi est un span stylé avec une icône BadgeCheck - pas de lien vers le certificat officiel ni logo officiel. Plan : (1) ajouter aria-hidden='true' sur les icônes Phone, Mail, MapPin du footer, (2) remplacer le badge Qualiopi par un lien vers le certificat officiel + afficher le numéro de certificat.

Accessibilité (5/10) : Problèmes identifiés dans le code réel : (a) les colonnes 'Navigation' et 'Guides locaux' présentent des listes de liens via div+map au lieu de nav+ul/li - aucun landmark nav, aucune liste sémantique, les liens ne sont pas groupés dans une liste ordonnée/non ordonnée (WCAG 4.1.2 - les listes de navigation doivent utiliser ul/li), (b) les icônes Phone, Mail, MapPin dans la colonne Contact n'ont pas aria-hidden='true' malgré le texte adjacent qui porte l'info, (c) pas de role='contentinfo' explicite sur le footer (le tag HTML5 <footer> suffit normalement, c'est correct), (d) les liens de réseaux sociaux ont bien aria-label - c'est positif. Plan : (1) wrapper les navItems dans <nav aria-label='Navigation secondaire'><ul>...li par item...</ul></nav>, (2) wrapper les localSeoPages dans <nav aria-label='Guides locaux'><ul>...<li> par page...</ul></nav>, (3) ajouter aria-hidden='true' sur toutes les icônes décoratives inline.

SEO local (5/10) : Le footer contient le nom, l'adresse, le téléphone, l'email - bon signal NAP (Name/Address/Phone). Mais : (1) les liens dans 'Guides locaux' ne représentent que 2 pages de landing locale sur les 4-5 attendues selon le périmètre, (2) aucun lien vers les pages locales VTC/CACES (inexistantes), (3) le copyright '© 2026' est correct. La présence du JSON-LD LocalBusiness dans app/layout.tsx (adresse, téléphone, zones servies) compense partiellement le manque de données structurées dans le footer lui-même. Manque : SIRET, numéro d'agrément préfectoral, lien GBP.

Conversion (6/10) : Le footer manque d'un CTA clair (aucun bouton 'S'inscrire' ou 'Prendre RDV' en pied de page). Les informations de contact (téléphone, email, adresse) sont bien présentes et cliquables. Mais pour un utilisateur qui scroll jusqu'en bas sans avoir converti, aucune dernière chance de capture. Plan : ajouter une mini-section de réassurance + CTA au-dessus du footer (bandeau 'Prêt à passer votre permis ? Nous rappelons sous 24h' avec bouton 'Être rappelé').

Expérience formation (5/10) : Le footer ne fait aucune mention de l'espace élève, du suivi de formation, du calendrier ou des examens. Pour un élève déjà inscrit cherchant un accès rapide en bas de page, rien. Pas de mention CACES/VTC. La colonne 'Guides locaux' ne pointe que vers 2 landing SEO sans contexte pédagogique. Plan : (1) ajouter un lien 'Espace élève' dans la colonne Navigation, (2) ajouter 'Planning & réservation' comme lien rapide.

### CRM / Admin

| Page | Route | Existe | UX | UI | Perf | A11y | SEO | Séc | Conv | Form |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Cockpit CRM | `/admin` | ✅ | **6** | **7** | **5** | **5** | 8 | **5** | **7** | **6** |
| Pipeline commercial | `/admin/pipeline` | ✅ | **6** | **7** | **7** | **6** | 8 | **7** | **6** | **5** |
| Planning des leçons | `/admin/planning` | ✅ | **4** | **6** | **6** | **5** | 8 | **7** | **5** | **4** |
| Examens et réussite | `/admin/examens` | ✅ | **7** | **7** | **7** | **6** | 8 | **7** | **6** | **6** |
| Finance | `/admin/finance` | ✅ | **6** | **7** | **6** | **5** | 8 | **4** | **5** | **5** |
| Dossiers élèves | `/admin/eleves` | ✅ | **7** | **7** | **7** | **6** | 8 | **7** | **6** | **5** |
| Fiche élève | `/admin/eleves/[id]` | ✅ | **7** | **7** | **7** | **5** | 8 | **6** | **6** | **6** |
| Reporting | `/admin/reporting` | ✅ | **6** | **7** | **5** | **6** | 8 | **7** | **5** | **5** |
| Assistant IA | `/admin/assistant` | ✅ | **6** | **7** | **7** | **5** | 8 | **6** | **6** | **6** |
| Gestion FAQ | `/admin/site/faq` | ✅ | **7** | **7** | 8 | **6** | 8 | **6** | **7** | **7** |

**Plans d'amélioration :**

- **Cockpit CRM** _(axes faibles : ux, performance, accessibilite, securite, experienceFormation)_ — UX (6/10): Double affichage CockpitStats + AdminDashboard (ce dernier charge 10 requetes en parallèle dont certaines redondantes avec CockpitStats: bookings, payments, students, leads déjà dans stats). Fusionner ou supprimer les Metric 'Examens programmés' (codée en dur à 0) et 'Taux de réussite' (codée en dur à 86%) de AdminDashboard.OverviewView:397-398 — remplacer par les valeurs issues de CockpitStats. Aucun lien direct de navigation vers les sous-pages CRM depuis la sidebar de AdminDashboard. PERFORMANCE (5/10): 11 fetch() lancés au mount de AdminDashboard.loadDashboard():793-804 (me, contacts, cpf, bookings, payments, reviews, users, students, instructors, leads), chargés en totalité sans pagination ni lazy-load. Ajouter pagination et chargement à la demande par onglet actif. Aucun loading.tsx dans app/admin/: zéro skeleton, feedback texte basique 'Chargement du CRM'. ACCESSIBILITE (5/10): Aucune région aria-live sur les messages de succès/erreur des sous-composants; les erreurs sont montées/démontées (pas de conteneur statique role='alert'); AdminDashboard: la sidebar nav a aria-label='Modules CRM' mais les boutons d'onglets n'ont pas aria-selected ni role='tab'; hiérarchie h2→h3 dans les sous-sections sans h1 visible (le PageHero a un h1, les sections CRM utilisent h2/h3 ce qui est correct); les Metric dans OverviewView n'ont pas de texte accessible sur les valeurs chiffrées. SECURITE (5/10): middleware.ts décodeJwtRole() sans vérification de signature (atob pur — vulnérabilité connue au contournement UX CRM avec un JWT forgé, la vraie sécurité repose sur l'API mais le CRM peut être rendu à un attaquant qui forge le claim role dans le payload sans signature valide); frame-ancestors:'none' dans la CSP mais X-Frame-Options: SAMEORIGIN incohérent (ligne 21 next.config.mjs); CSP en Report-Only (non bloquante, unsafe-inline + unsafe-eval maintenus). EXPERIENCE FORMATION (6/10): AdminDashboard ne permet pas de créer un élève depuis le CRM (absence totale du formulaire 'Nouvel élève'); aucune surface de gestion des moniteurs ni de leurs disponibilités; les parcours CACES/VTC absents du catalogue empêchent tout rattachement de formation.
- **Pipeline commercial** _(axes faibles : ux, accessibilite, conversion, experienceFormation)_ — UX (6/10): Pipeline uniquement en liste par colonne, sans drag-and-drop kanban ni possibilité de créer un nouveau lead depuis l'interface. Le changement d'étape via un select dans chaque carte est fonctionnel mais peu intuitif (absence de glisser-déposer). nextFollowUpAt est dans le modèle Lead mais aucunement affiché ni filtrable depuis cette vue. Aucun filtrage par date, température ou moniteur. ACCESSIBILITE (6/10): Les colonnes kanban n'ont pas de rôle ARIA approprié (role='list'/'listitem' manquants sur les cartes); les select de changement d'étape ont bien aria-label mais les cartes n'annoncent pas le résultat de la mutation (pas d'aria-live); l'état 'busyId' désactive le select mais ne le vocalise pas (aria-busy manquant). CONVERSION (6/10): Aucune action rapide (email, SMS, appel) directement depuis la carte prospect; pas de prévisualisation du message ou de l'intérêt détaillé; pas d'indication de délai de relance sur les prospects RELANCE; pas de bouton 'Créer un devis' ou 'Convertir en élève' depuis la carte. EXPERIENCE FORMATION (5/10): Aucun lien entre les stages du pipeline et les formations disponibles (le champ 'interest' est une chaîne libre, non lié au catalogue); pas de valeur estimée automatique depuis le catalogue; impossible de rattacher un prospect à une agence depuis ce vue; aucune gestion spécifique pour les leads VTC/CACES inexistants.
- **Planning des leçons** _(axes faibles : ux, ui, accessibilite, conversion, experienceFormation)_ — UX (4/10): Vue liste chronologique uniquement — aucune vue calendrier jour/semaine/mois. Navigation entre jours impossible (pas de bouton 'jour suivant'/'jour précédent'). 3 fetch() parallèles au mount sans cache (bookings + instructors + students). Aucune possibilité de créer une nouvelle leçon depuis cette page. Aucun filtre par moniteur, statut ou agence. Le moniteur est affiché par son nom mais sans lien vers sa fiche. UI (6/10): Affichage en liste de jours correct mais sans vue calendrier: c'est une grille de données, pas un agenda. Aucun indicateur de charge par moniteur. ACCESSIBILITE (5/10): Les select de changement de statut ont aria-label='Changer le statut' mais le libellé n'identifie pas quelle réservation est concernée; manque aria-live sur les messages d'erreur/succès (le paragraphe d'erreur est monté/démonté sans conteneur statique role='alert'); les en-têtes de jours utilisent h3 sans structure h2 parente visible dans la section. CONVERSION (5/10): Aucun CTA 'Créer une leçon', impossible de réserver un créneau directement. Aucun indicateur de disponibilité des moniteurs. EXPERIENCE FORMATION (4/10): Pas de saisie des heures consommées depuis le planning (doit se faire via la fiche élève). Aucune liaison entre la leçon et la compétence travaillée (REMC). Espace formateur absent: les MONITEUR ont accès au CRM mais n'ont pas de vue filtrée sur leurs propres leçons. Gestion multi-véhicule absente. Solution: implémenter un vrai composant agenda (bibliothèque type react-big-calendar ou equivalent) avec vue jour/semaine, drag-and-drop, filtres par moniteur et formulaire de création de leçon inline.
- **Examens et réussite** _(axes faibles : accessibilite, conversion, experienceFormation)_ — ACCESSIBILITE (6/10): Le formulaire de programmation d'examen utilise des select avec aria-label standalone mais sans fieldset/legend regroupant les champs liés; les messages d'erreur (ligne 143) sont montés conditionnellement sans role='alert' ni conteneur aria-live statique; le tableau des examens n'a pas de caption ni de summary. Les select 'Changer le résultat' ont aria-label mais n'identifient pas quel élève est concerné (aria-label devrait inclure le nom). CONVERSION (6/10): Aucune exportation des résultats (CSV/PDF); aucune vue synthétique du taux de réussite par type (CODE vs CONDUITE); les examens ne sont pas rattachés à une agence (absence du filtre AgencySwitcher). EXPERIENCE FORMATION (6/10): Types d'examen limités à CODE/CONDUITE — pas de CACES R489/R486, pas de VTC. Aucune notification automatique élève lors de la saisie du résultat. Aucun lien vers la fiche élève depuis le tableau d'examens. Solution: ajouter role='alert' aux erreurs, caption au tableau, notification email automatique sur updateResult, lien href vers /admin/eleves/[studentId] depuis le nom d'élève dans le tableau.
- **Finance** _(axes faibles : ux, performance, accessibilite, securite, conversion, experienceFormation)_ — SECURITE (4/10): Critique — Finance.tsx:143 envoie amountCents au serveur via POST /api/payments; le backend payments.routes.ts:75 accepte amountCents du corps client via recordSchema sans le recalculer à partir du pricingPlanId (vulnérabilité de fraude montant confirmée par QA/Sécurité). De plus, le setStatus() appelé depuis Finance.tsx permet à un admin de marquer manuellement un paiement 'PAYE' sans webhook Stripe signé (stripe webhook stub ligne 131-135 des routes). Solution immédiate: côté backend, dériver amountCents depuis le PricingPlan si pricingPlanId est fourni, sinon rejeter si > prix pack. Implémenter stripe.webhooks.constructEvent. ACCESSIBILITE (5/10): Aucun conteneur aria-live pour les messages d'erreur/succès; les 3 cartes de totaux (Encaissé/En attente/Remboursé) ne sont que des div, sans rôle ni résumé accessible; les tableaux manquent de caption; les select 'Changer le statut' n'identifient pas quel paiement est visé. UX (6/10): Aucun filtre par date, type ou statut sur la liste des paiements. Absence totale de génération de facture PDF. Pas d'export CSV/comptable. Les totaux sont calculés sur tous les paiements chargés (sans pagination), donc faux si la liste est tronquée. PERFORMANCE (6/10): 3 fetch() parallèles au mount (payments + students + installments) sans cache ni pagination; la liste complète est chargée sans limite. EXPERIENCE FORMATION (5/10): Aucun lien entre le paiement et la formation souscrite (pricingPlanId non résolu en titre); pas de génération d'échéancier automatique à l'inscription; CACES/VTC non traités. CONVERSION (5/10): Aucune relance automatique pour les paiements EN_ATTENTE; promesse 'paiement en ligne' non tenue (mode mock).
- **Dossiers élèves** _(axes faibles : accessibilite, conversion, experienceFormation)_ — ACCESSIBILITE (6/10): Le tableau n'a pas de caption; la barre de progression (div+div inline-style) n'est pas accessible (manque role='progressbar' aria-valuenow aria-valuemin aria-valuemax aria-label); le lien 'Ouvrir' répété pour chaque ligne n'est pas différencié (aria-label='Ouvrir le dossier de [NomPrénom]' manquant); erreurs non annoncées via aria-live. CONVERSION (6/10): Aucun bouton 'Créer un élève' — l'admin ne peut pas créer de dossier depuis le CRM (CRM-P1 confirmé dans le code). Aucun filtre par statut, formation ou progression. Aucun export CSV de la liste. EXPERIENCE FORMATION (5/10): La colonne 'Progression' est un pourcentage générique non relié aux compétences REMC; le statut utilise des codes métier (NOUVEAU, INCOMPLET, PRET_EXAMEN…) certes traduits (FILE_STATUS_LABELS), mais sans code couleur différencié par urgence; pas de tri par colonne; pas d'indication du nombre d'heures restantes dans la liste (disponible en fiche mais pas ici). Solution: ajouter role='progressbar' sur les barres, aria-label distinctifs sur les liens, bouton 'Nouvel élève' avec formulaire modal, filtres de statut par select, export CSV.
- **Fiche élève** _(axes faibles : accessibilite, securite, conversion, experienceFormation)_ — ACCESSIBILITE (5/10): Le radiogroup de compétences REMC (StudentFile.tsx:206) a bien role='radiogroup' et aria-label mais chaque bouton utilise role='radio' + aria-checked sur un button natif sans implémentation du roving tabindex (navigation flèches non câblée); les champs du formulaire 'Modifier le dossier' utilisent le composant Field() avec label wrappant le select/input, ce qui est correct, MAIS les selects/inputs n'ont pas d'id distinct (le label wrappant fonctionne en HTML natif mais pas pour les lecteurs d'écran modernes qui préfèrent for/id explicites); le message de succès/erreur (ligne 188) est monté conditionnellement sans rôle accessible; 4 fetch() au mount sans feedback de chargement autre qu'un texte 'Chargement du dossier'. SECURITE (6/10): La fiche affiche et permet de modifier internalNotes depuis le CRM, ce qui est correct (accès admin), mais la validation côté client sur StudentFile.tsx est absente (progressPercent peut recevoir >100, consumedHours > purchasedHours — non gardé côté serveur). L'endpoint PATCH /api/students/[id] ne vérifie pas que consumedHours <= purchasedHours. EXPERIENCE FORMATION (6/10): Aucune gestion documentaire (StudentDocument en base mais zéro surface UI — checklist de pièces absente); aucun historique de paiements dans la fiche (nécessiterait un lien /admin/finance?studentId=X); pas d'accès aux résultats d'examen depuis la fiche. CONVERSION (6/10): Pas de bouton 'Envoyer un email' ni 'SMS' depuis la fiche; pas d'accès au dossier CPF de l'élève. Solution: implémenter le roving tabindex sur le radiogroup, ajouter id/for explicites sur les champs, role='alert' sur erreurs, checklist DocumentStudent, validation consumedHours<=purchasedHours côté serveur.
- **Reporting** _(axes faibles : ux, performance, accessibilite, conversion, experienceFormation)_ — PERFORMANCE (5/10): Reporting.tsx charge (N+1) requêtes au mount: 1 fetch /api/agencies puis 1 fetch /api/admin/stats par agence + 1 global. Avec 3 agences = 4 appels parallèles. Sans cache ISR ni pagination. À remplacer par un endpoint agrégé /api/admin/reporting ou par un cache SWR/React Query avec revalidation 5 minutes. UX (6/10): Tableau comparatif par agence en lecture seule — aucun graphique, aucune évolution temporelle, aucun filtrage par période (mois/trimestre/année). Impossible d'exporter en CSV/PDF. Aucun indicateur de tendance (hausse/baisse vs période précédente). ACCESSIBILITE (6/10): Le tableau n'a pas de caption ni de summary; les en-têtes de colonnes n'ont pas scope='col'; la ligne 'Toutes les agences' (index 0) est mise en valeur visuellement mais pas sémantiquement (pas de th scope='row'). CONVERSION (5/10): Zéro action possible depuis le reporting (pas de lien vers les élèves en retard, les paiements en attente, les CPF bloqués). Tableau purement informatif sans drill-down. EXPERIENCE FORMATION (5/10): Taux de réussite affiché (exams.passRate) mais aucun détail par type d'examen (CODE vs CONDUITE), aucun comparatif par moniteur, aucun indicateur de satisfaction. VTC/CACES absents du périmètre. Solution: ajouter un endpoint agrégé backend, implémenter des graphiques en barres ou courbes, ajouter scope sur les th/td, permettre l'export CSV.
- **Assistant IA** _(axes faibles : ux, accessibilite, securite, conversion, experienceFormation)_ — ACCESSIBILITE (5/10): AiAgentChat.tsx:64 — le conteneur scrollRef des messages n'a ni role='log' ni aria-live='polite' ni aria-relevant='additions'; les nouveaux messages de l'agent ne sont donc jamais annoncés par les lecteurs d'écran. L'indicateur 'L'agent réfléchit…' (ligne 72) n'a pas role='status'. Le composant AiAssistant utilise des boutons de sélection d'outil (tabs) sans role='tab'/role='tablist'/aria-selected. SECURITE (6/10): L'agent CRM peut créer des leads et réserver des leçons réelles (tools.ts:141, :309) sans étape de confirmation UI — l'utilisateur tape une instruction et l'action est exécutée directement. La seule protection est au niveau du prompt backend. Aucune confirmation explicite côté UI avant mutation. Le rate-limit IA est à 20 req/min (ai.routes.ts:63) ce qui est raisonnable mais la consommation n'est pas loguée ni alertée. UX (6/10): Le mode 'agent' et les 3 autres outils (résumé, contenu, qualification) sont dans la même page sans fil d'Ariane ni contexte sur leurs différences; aucun historique des sessions; aucune sauvegarde des contenus générés; l'agent ne peut pas répondre aux KPIs (leads count, stats) comme attendu par un admin. CONVERSION (6/10): L'outil 'Qualifier un prospect' score un lead mais n'offre pas de bouton 'Créer ce prospect dans le pipeline'. EXPERIENCE FORMATION (6/10): L'outil 'Générer du contenu' produit du texte brut (pre) sans bouton 'Copier' ni intégration directe dans la FAQ ou les formations. Solution: ajouter role='log' aria-live='polite' au conteneur de messages, role='tablist'/tab/aria-selected sur les onglets d'outils, une étape de confirmation modale pour les actions mutatives de l'agent, un bouton 'Copier' sur les sorties de contenu.
- **Gestion FAQ** _(axes faibles : accessibilite, securite)_ — ACCESSIBILITE (6/10): FaqManager.tsx — les champs Question, Réponse, Catégorie ont des aria-label standalone mais ne sont pas wrappés dans un form (le 'submit' déclenche la soumission via onClick sur un button type='button', non via un form onSubmit); la validation (5 caractères min) affiche une erreur via setError mais sans role='alert' ni aria-describedby reliant le champ à l'erreur; le bouton 'Modifier' de chaque entrée FAQ n'indique pas quelle question est visée (aria-label='Modifier [question]' manquant); lors de l'édition, le scroll vers le haut (window.scrollTo) déplace le focus sans le repositionner sur le champ Question (perte de focus). SECURITE (6/10): La suppression de FAQ n'est pas possible depuis l'UI (uniquement masquer/afficher via toggleActive), car la route proxy /api/faq/[id] n'expose que PATCH (pas DELETE — architecture proxy volontairement limitée à GET/POST/PATCH). C'est cohérent avec la soft-delete, mais l'admin ne peut pas supprimer définitivement sans accès API direct. Le endpoint /api/faq/manage n'a pas de vérification d'appartenance à l'agence (toutes les FAQs de toutes les agences sont accessibles). Solution: encapsuler les champs dans un form avec onSubmit, ajouter role='alert' sur les erreurs, aria-label distinctifs sur les boutons, repositionner le focus sur le premier champ après startEdit.

### Moyennes par axe (32 pages)

| UX | UI | Perf | A11y | SEO | Séc | Conv | Form |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 5.7 | 6.6 | 6.8 | 5.3 | 5.4 | 5.9 | 5.4 | 5.2 |

---

## 5 · Plan de correction priorisé

### 🔴 P0 — 3 chantier(s)

**P0.1 Sécuriser et fiabiliser le parcours de paiement avant toute mise en production monétaire : dériver amountCents du PricingPlan côté serveur (ignorer le montant client), vérifier l'existence du pricingPlanId, intégrer le SDK Stripe officiel (PaymentIntent serveur), exposer le webhook AVANT le middleware d'auth avec express.raw + vérification de signature, ne passer PAYE que sur événement signé. Ajouter STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET au garde-fou prod.** · effort `L` · _Architecte Logiciel, QA, Sécurité, CRM_
> Regroupe ARCH-02, PAY-01, PAY-02, SEC-01, CRM-04. Faille de fraude tarifaire critique + promesse 'paiement en ligne' non tenue. Bloquant absolu pour la production du checkout.

**P0.2 Renforcer la sécurité de base : passer la CSP de Report-Only à enforce (sans unsafe-inline/unsafe-eval via nonces), vérifier la signature du JWT dans middleware.ts (jose/jwtVerify edge), aligner frame-ancestors/X-Frame-Options, et ne plus renvoyer le token JWT dans le body de login/register (garder uniquement le cookie httpOnly).** · effort `M` · _Sécurité, Architecte Logiciel_
> Regroupe SEC-02, SEC-08, SEC-09, SEC-10. La couleur de marque omniprésente + formulaires + IA sans CSP enforce = XSS exploitable ; bypass du shell admin sur cookie forgé.

**P0.3 Corriger la cohérence de marque et les preuves chiffrées (confiance) : remplacer LODENE par LODEN partout (logo, H1 hero, aria-label, assistant IA, commentaires), centraliser le nom dans data/site.ts ; créer une source unique proofStats réelle (élèves, avis, réussite) consommée par hero/stats/page avis/JSON-LD ; brancher reviewCount sur le nombre réel d'avis et supprimer testimonials.concat(testimonials) ; brancher le taux de réussite sur stats.exams.passRate.** · effort `M` · _UI Designer, Conversion, SEO Local, UX Designer_
> Regroupe UI-01, CONV-02, CONV-03, CONV-06. Faute de marque + chiffres mensongers + reviewCount trompeur = perte de crédibilité immédiate et risque de pénalité Google. Effort faible, impact fort.

### 🟠 P1 — 9 chantier(s)

**P1.1 Réparer les ruptures de tunnel et de navigation : afficher le récapitulatif du pack (titre/prix/features) AVANT le gate d'auth sur /paiement, aligner les slugs des pricingPlans sur les slugs de formations (ou créer alias/redirections) pour supprimer les 404, propager le contexte formation en query vers contact/inscription, rediriger vers /espace-eleve après inscription réussie, contextualiser le BookingCalendar (connexion requise affichée d'emblée, plus de formationId par défaut codé en dur).** · effort `M` · _UX Designer, Conversion, QA_
> Regroupe UX-01, UX-02, UX-06, UX-10, UX-01(QA), NAV-01, NAV-02. Ce sont les abandons les plus coûteux, au moment le plus chaud du parcours.

**P1.2 Implémenter réellement les flux de compte : forgot-password/reset-password/verify-email avec token aléatoire haute entropie hashé (champs déjà en schema), expiration courte, usage unique, envoi via Resend, invalidation des sessions ; ajouter le lien 'Mot de passe oublié ?' sur /connexion.** · effort `M` · _Architecte Logiciel, Sécurité, UX Designer_
> Regroupe ARCH-04, SEC-03. Trou fonctionnel bloquant (élève bloqué, support obligé) et fausse promesse de sécurité.

**P1.3 Durcir les validations métier référentielles côté backend : refuser une réservation dans le passé, vérifier l'existence de instructorId (et l'inclusion dans une Availability), de formationId (CPF) et de pricingPlanId, relayer correctement le 429 register via le proxy (aujourd'hui ressort en 500), retirer internalNotes des schémas publics (CPF/contact).** · effort `M` · _QA, Architecte Logiciel, Sécurité_
> Regroupe BOOK-01, BOOK-02, DATA-01, PAY-02, AUTH-01, SEC-12. Qualité des données opérationnelles/CRM et surface d'erreur du futur checkout.

**P1.4 Mettre en conformité RGPD et compléter le légal : case de consentement non pré-cochée + lien /confidentialite sur chaque formulaire, gestion des mineurs (date de naissance + consentement représentant légal pour la conduite accompagnée), bandeau de consentement cookies, et remplir mentions légales / politique de confidentialité réelles (SIRET, agrément préfectoral E-XXXX, hébergeur, base légale, durées, DPO/CNIL).** · effort `M` · _Sécurité, SEO Local, Conversion_
> Regroupe SEC-05, SEC-06, SEO-06, et findings pages légales. Obligation légale (LCEN/CNIL) et E-E-A-T ; bloquant avant lancement public.

**P1.5 Livrer les pôles VTC et CACES de bout en bout : modéliser un axe productLine (auto-école | VTC | CACES) sur Formation, étendre ExamType / créer un modèle Certification (CACES R489/R486...), créer slugs/pages/landings SEO + formulaire devis pro (entreprise/OPCO), identité visuelle dédiée et entrées de menu, alimenter seed/initial-data, ouvrir le CRUD catalogue côté CRM (proxy + UI).** · effort `XL` · _Architecte Logiciel, Conversion, SEO Local, UI Designer, CRM_
> Regroupe ARCH-01, CONV-01, SEO-01, UX-03, UI-09, CRM-07. Deux tiers du business model annoncé. Nécessite d'abord la source unique de catalogue et le CRUD catalogue.

**P1.6 Compléter le CRM opérationnel : création d'élève depuis le CRM (POST students + UI), gestion documentaire (StudentDocument : upload/stockage + checklist de complétude reliée à CpfRequest.missingDocuments), gestion des moniteurs (CRUD instructors + saisie disponibilités) et corriger les KPI codés en dur (86% réussite, examens 0) en les branchant sur /api/admin/stats.** · effort `XL` · _CRM, Architecte Logiciel_
> Regroupe CRM-01, CRM-02, CRM-03, CRM-06. Cœur d'un CRM auto-école manquant ; KPI mensongers qui décrédibilisent le cockpit.

**P1.7 Créer l'espace formateur (/espace-formateur) consommant le RBAC MONITEUR déjà câblé : planning filtré par instructorId, élèves affectés, saisie des compétences (StudentSkill), redirection LoginForm selon rôle MONITEUR, extension du matcher middleware.** · effort `L` · _Architecte Logiciel, CRM, UX Designer_
> ARCH-03, CRM-01, page /espace-formateur notée 0 (inexistante). Promesse 'espace formateur' non tenue ; travail backend partiellement perdu.

**P1.8 Activer relances et notifications : afficher/saisir nextFollowUpAt + vue 'relances du jour' dans le Pipeline, configurer un provider email/SMS réel (Resend/Brevo) en prod, et ajouter un job planifié (rappels RDV J-1, relances prospects tièdes, relances échéances en retard).** · effort `L` · _CRM, Architecte Logiciel_
> CRM-05. Levier de conversion/recouvrement central d'une auto-école ; la tuyauterie mailer/sms est prête, il manque config + déclencheur.

**P1.9 Accessibilité AA — correctifs structurants : réserver #08AEB8 (loden-500) au décoratif et passer tout texte/icône/fond de bouton porteur d'info sur loden-700/800, ajouter un skip link + id/tabindex sur main, relier les erreurs de formulaire (aria-invalid/aria-describedby/role=alert) et annoncer succès/échec via aria-live, rendre la modale de recherche réellement modale (focus trap + restitution + inert).** · effort `M` · _Accessibilité, UI Designer_
> Regroupe A11Y-01, A11Y-02, A11Y-03, A11Y-05, UI-04. Conformité RGAA/WCAG pour un service public-facing (CPF/formation pro) ; la couleur de marque échoue le contraste partout.

### 🟡 P2 — 6 chantier(s)

**P2.1 Établir une source unique de vérité catalogue (fin de la duplication data/site.ts / initial-data / seed) et aligner toutes les listes de formations (selects inscription/CPF, menu, simulateur) ; brancher le simulateur de prix sur les vrais tarifs (aligner base/horaire sur les packs publiés).** · effort `M` · _Architecte Logiciel, UX Designer, Conversion_
> Regroupe ARCH-05, UX-12, CONV-05. Risque de dérive et friction 'prix incohérent' (1420 vs 1190 EUR). Prérequis propre pour VTC/CACES.

**P2.2 Charger réellement la typographie Inter via next/font et refondre la typographie du hero (remplacer les 3 polices manuscrites Great Vibes/Allura/Permanent Marker par une typo premium maîtrisée, couleur charte), optimiser l'image hero (AVIF/WebP + recompression + blurDataURL) et créer un système de composants UI (Button/Card/Input) + tokens de rayons.** · effort `L` · _UI Designer, Performance_
> Regroupe UI-02, UI-03, UI-08, UI-05, UI-06, PERF-01, PERF-02, PERF-04. Cohérence premium, LCP/CLS du hero, et fin des 8+ variantes de bouton.

**P2.3 SEO technique et local : ajouter alternates.canonical sur toutes les pages (helper buildMetadata), noindex sur les pages privées/transactionnelles (connexion, espace-eleve, paiement) et les retirer du sitemap, déployer des pages villes/quartiers alignées sur areaServed (Nation/12, Montreuil, Vincennes) avec maillage en cocon, enrichir le LocalBusiness (geo, OpeningHoursSpecification, lien Google Business Profile), ajouter BreadcrumbList et FAQPage manquant sur la landing CPF.** · effort `L` · _SEO Local, UX Designer_
> Regroupe SEO-02, SEO-03, SEO-04, SEO-07, SEO-08, SEO-09, SEO-10, SEO-13, UX-05. Cœur de la stratégie 'référence locale' aujourd'hui sous-exploitée.

**P2.4 Performance data-fetching : passer /cpf de no-store à ISR (revalidate), rendre FormationExplorer/PricingPlansGrid en RSC+ISR (filtres en client uniquement), unifier le cockpit /admin sur /api/admin/stats au lieu de 10 fetch redondants au mount, ajouter des loading.tsx (skeletons) sur /formations, /tarifs, /admin*, /espace-eleve, et fiabiliser le build (nettoyer .next avant build, ne pas cohabiter dev/start).** · effort `M` · _Performance, Architecte Logiciel_
> Regroupe PERF-03, PERF-05, PERF-06, PERF-07, et findings CSR des pages liste. TTFB, charge backend interne, et déploiements déterministes.

**P2.5 Garde-fous IA et anti-abus : exiger une confirmation explicite avant toute action mutative de l'agent CRM (create_lead/book_appointment), ajouter des outils de lecture KPI réservés admin, protéger /api/ai/chat public (CAPTCHA/Turnstile + plafond leads/IP), et ajouter un rate-limit dédié + honeypot sur les formulaires publics contact/CPF.** · effort `M` · _QA, Sécurité, CRM_
> Regroupe AI-01, AI-02, SEC-07, SEC-13. Mutation de données par langage naturel sans garde-fou + DoS économique sur la clé Groq payante + spam du pipeline.

**P2.6 Exposer l'audit log en lecture (GET /api/admin/audit gardé par audit.read, déjà défini) + écran CRM, et étendre l'audit aux actions critiques (login/échec login, paiement/remboursement, modification dossier élève, changement de rôle) avec userId/IP/user-agent.** · effort `M` · _Sécurité, CRM_
> Regroupe SEC-04, CRM-09. Traçabilité RGPD/accountability ; aujourd'hui write-only et limité à l'IA.

### 🔵 P3 — 3 chantier(s)

**P3.1 Polish UX/UI restants : fusionner les deux FAB superposés (WhatsApp + IA) en un speed-dial, raccourcir le formulaire de diagnostic (mode rappel express), traduire les libellés techniques bruts de l'espace élève (formationId/statuts), ajouter affichage mot de passe + jauge, conditionner scroll-behavior smooth à prefers-reduced-motion, supprimer role=marquee invalide.** · effort `M` · _UX Designer, UI Designer, Accessibilité_
> Regroupe UX-07, UX-08, UX-11, UX-13, UI-10, A11Y-04, A11Y-12. Friction et finitions perçues, faible effort unitaire.

**P3.2 Contenu de fond : créer un vrai blog éditorial (/blog/[slug]) ciblant les requêtes informationnelles permis/CPF/VTC/CACES avec BlogPosting JSON-LD et maillage vers formations/landings, et ajouter des leviers de réassurance datés (délai de rappel sous 24h, prochaines sessions, garanties).** · effort `L` · _Conversion, SEO Local_
> Regroupe BLOG-01, CONV-08, CONV-09, SEO-05, CONV-07. Autorité thématique, fraîcheur SEO et leviers de conversion top-funnel.

**P3.3 Dette technique et finitions infra : brancher ou retirer les modèles Prisma orphelins (Vehicle pour le planning multi-catégories), étendre le proxy Next à DELETE/PUT (route DELETE /api/faq/:id inatteignable), aligner le seuil JWT_SECRET (min 16 Zod vs 32 prod) et faire tourner la clé Groq par précaution, améliorer l'AgencySwitcher (refetch ciblé au lieu de reload + filtrage agence des CPF/avis).** · effort `M` · _Architecte Logiciel, Sécurité, CRM_
> Regroupe ARCH-06, ARCH-07, ARCH-08, SEC-11, CRM-10. Cohérence et hygiène, faible urgence.

---

## 6 · Roadmap par sprints

### Sprint 1 — Stabilisation & sécurité (production-ready monétaire)
_Rendre le parcours d'achat sûr et l'app défendable. Aucune mise en prod des flux monétaires avant la fin de ce sprint._

- Paiement : amountCents dérivé serveur + Stripe réel (PaymentIntent + webhook signé hors auth)
- CSP enforce (sans unsafe-inline/eval), signature JWT vérifiée dans middleware, token retiré du body login/register
- Flux mot de passe oublié / reset / verify-email réellement implémentés + lien sur /connexion
- Validations métier backend : pas de réservation passée, existence instructorId/formationId/pricingPlanId, 429 register relayé proprement
- Conformité RGPD/légal : consentement + lien confidentialité sur formulaires, gestion des mineurs, mentions légales et politique réelles, bandeau cookies

### Sprint 2 — Confiance & conversion
_Réparer la crédibilité et le tunnel pour convertir réellement le trafic permis B existant._

- Marque : LODENE -> LODEN partout + nom centralisé
- Preuves chiffrées : source unique proofStats réelle (hero/stats/avis/JSON-LD), reviewCount réel, suppression de la duplication d'avis, passRate branché
- Tunnel : récapitulatif pack avant gate d'auth, slugs packs alignés (fin des 404), contexte formation propagé, redirection post-inscription
- Accessibilité AA structurante : palette de contraste (loden-700/800), skip link, erreurs de formulaire en ARIA + aria-live, focus trap modale recherche
- Labels de confiance : logo Qualiopi + n° certificat, agrément préfectoral réel, SIRET

### Sprint 3 — Offres VTC & CACES (périmètre métier)
_Tenir la promesse de centre multi-métiers et ouvrir deux verticales à forte valeur (CPF/OPCO)._

- Source unique de catalogue (fin duplication site.ts/initial-data/seed) + CRUD catalogue côté CRM
- Modélisation productLine + ExamType/Certification (CACES R489/R486, examen VTC)
- Pages/landings VTC et CACES + formulaire devis pro (entreprise/OPCO) + identité visuelle + entrées de menu
- SEO local : canonicals, pages villes alignées sur areaServed + maillage cocon, LocalBusiness enrichi (geo/horaires/GBP)
- Simulateur de prix aligné sur les vrais tarifs

### Sprint 4 — CRM, pilotage & espace formateur
_Faire du CRM un cockpit complet qui automatise, et donner aux moniteurs leur espace._

- Création d'élève depuis le CRM + gestion documentaire (StudentDocument + checklist complétude)
- Gestion des moniteurs (CRUD + disponibilités) + espace formateur /espace-formateur (planning, élèves, compétences)
- Relances & notifications : nextFollowUpAt visible + vue 'relances du jour', provider email/SMS prod, job planifié (RDV J-1, impayés, CPF)
- Correction des KPI codés en dur (86%, examens 0) branchés sur /api/admin/stats
- Audit log en lecture + extension aux actions critiques ; garde-fous IA (confirmation des mutations, KPI admin, anti-abus chat public)

### Sprint 5 — Polish premium, performance & contenu
_Élever la perception premium, la performance et l'autorité SEO de fond._

- Typographie Inter chargée + refonte hero + système de composants UI (Button/Card/Input) + tokens
- Image hero AVIF/WebP, ISR sur /cpf et pages liste (RSC), unification cockpit sur /api/admin/stats, loading.tsx + build déterministe
- FAB fusionné en speed-dial, formulaire diagnostic raccourci, libellés espace élève traduits, finitions A11y (reduced-motion, role=marquee)
- Blog éditorial réel (/blog/[slug]) + maillage, leviers de réassurance datés (rappel sous 24h, prochaines sessions, garanties)
- Dette : modèles Prisma orphelins, proxy DELETE/PUT, alignement JWT_SECRET, rotation clé Groq, AgencySwitcher refetch ciblé

---

## 7 · Quick wins

_Gains rapides (effort S), fort impact — à shipper en premier._

- Remplacer LODENE par LODEN partout (logo, H1 hero, aria-label, assistant IA) et centraliser le nom dans data/site.ts — faute de marque visible par tous, effort minime.
- Charger Inter via next/font/google dans layout.tsx — la police de marque déclarée n'est jamais servie ; gain visuel immédiat sur tout le site.
- Passer le bouton FAB de l'assistant IA et les icônes/textes porteurs d'info de loden-500 (#08AEB8, 2.71:1) à loden-700/800 — conformité contraste AA.
- Ajouter un skip link 'Aller au contenu' en premier enfant du body + id/tabindex sur main — absent sur 100% des pages, fort impact clavier/lecteur d'écran.
- Supprimer testimonials.concat(testimonials) et caler reviewCount du JSON-LD sur le nombre réel d'avis (3) — stoppe la duplication visible et le risque de pénalité Google.
- Aligner les slugs des pricingPlans sur ceux des formations (ou ajouter des redirections) — supprime les 404 sur permis-b, boite-automatique, pack-cpf.
- Rediriger vers /espace-eleve après inscription réussie (router.push) — le tunnel s'arrête net aujourd'hui alors que la session est posée.
- Retirer internalNotes des schémas publics CPF/contact — empêche un anonyme d'écrire dans une note interne staff.
- Corriger les Metric codés en dur du dashboard (86% réussite, examens 0) en les branchant sur /api/admin/stats — KPI mensonger sur le cockpit.
- noindex + retrait du sitemap des pages privées/transactionnelles (connexion, espace-eleve, paiement) — hygiène SEO immédiate.

---

## 8 · Recommandations de modernisation

- Refondre le hero above-the-fold : une typographie premium maîtrisée (Inter + au plus un accent), couleur charte conforme au contraste, et un CTA primaire orienté découverte ('Trouver ma formation' / 'Être rappelé') plutôt que 'Je m'inscris' à froid.
- Injecter de la preuve sociale réelle et vérifiable : vrais avis Google datés avec formation suivie (8-12 distincts ou widget GBP/Trustpilot), logos officiels Qualiopi/agrément préfectoral, et des stats uniques cohérentes branchées sur les vraies données (réussite, élèves, avis).
- Réduire la friction du tunnel : checkout invité avec récapitulatif du pack avant tout compte, fil de progression Pack -> Compte -> Paiement, formulaire de diagnostic en mode court (nom + téléphone + besoin) avec champs avancés repliés.
- Ajouter des photographies réelles (équipe, locaux, véhicules, élèves) optimisées via next/image — remplacer les avatars en initiales/dégradés qui font 'template' ; humaniser fortement une auto-école.
- Construire des pôles visuels et éditoriaux distincts Auto-école / VTC / CACES dès l'accueil, avec formulaires de devis adaptés (B2B/OPCO pour le pro) et badges de financement (CPF, OPCO) — pour passer de 'auto-école' à 'centre de formation référence locale'.
- Système de composants UI cohérent (Button/Card/Input + tokens de rayons et de couleurs sémantiques) pour un rendu premium homogène et un dark mode futur sur le CRM.
- Réassurance dynamique et datée : 'réponse sous 24h', prochaines sessions code/accéléré, garanties (heures offertes si échec), places limitées sur l'accéléré, et un agenda de réservation branché sur les vraies disponibilités.
- Blog/guides éditoriaux réels avec maillage interne (cocon SEO) et pages villes/quartiers pour ancrer la référence locale et capter le trafic top-funnel permis/CPF/VTC/CACES.
- Espace élève et espace formateur modernisés : libellés métier en français (plus d'IDs ni d'enums bruts), progression par compétences (StudentSkill), documents du dossier, planning et prochain examen visibles — pour une expérience de suivi rassurante et professionnelle.

---

## 9 · Rapports détaillés par dimension

### Architecte Logiciel

_9 findings — 🔴 1 · 🟠 3 · 🟡 3 · 🔵 2_

Le monorepo est correctement structuré: séparation nette front (Next 15 / App Router, :3000) et back (Express 5, :4000), couche repository proprement abstraite (LodenRepository -> Memory | Prisma) sélectionnée par factory selon API_USE_MEMORY/DATABASE_URL, proxys Next /api thin et cohérents via proxyBackendJson, enveloppes d'erreur homogènes ({error:{code,message,details}}) côté Express et côté proxy (503 BACKEND_UNAVAILABLE). Les deux serveurs sont vivants et fonctionnels (health 200, login SUPER_ADMIN 200, formations 200, web 200). Les fondations sécurité/config sont saines (garde-fou prod sur JWT_SECRET/DATABASE_URL/API_USE_MEMORY). MAIS le périmètre métier annoncé est très en retard sur le code: VTC et CACES sont totalement absents (0 occurrence dans tout le repo), le paiement Stripe est entièrement simulé (aucun SDK, pi_mock_*, webhook stub), l'espace formateur n'existe pas côté front (rôle MONITEUR pourtant câblé en RBAC backend), et les flux reset-password/verify-email sont des stubs (202 "prêt pour intégration"). On note aussi de la dette: duplication des mocks (data/site.ts vs backend initial-data.ts) sans source unique, modèles Prisma orphelins (StudentDocument, Vehicle) jamais branchés au repository, et un proxy Next limité à GET/POST/PATCH qui rend la route DELETE /api/faq/:id du backend inatteignable (heureusement non utilisée). L'ensemble est un socle solide mais à compléter pour atteindre la promesse "auto-école + VTC + CACES".

**Priorités de la dimension :**
- ARCH-02 (P0): brancher un vrai Stripe (SDK + PaymentIntent serveur + webhook avec signature hors auth) avant toute mise en production du parcours d'achat — aujourd'hui tout paiement est fictif (pi_mock_*).
- ARCH-01 (P1): modeliser et livrer les lignes VTC et CACES (categorie produit sur Formation, certifications/examens dedies, slugs/pages/formulaires devis) — 2/3 du business model annonce est absent du code.
- ARCH-03 (P1): creer l'espace formateur cote front en consommant le RBAC MONITEUR deja en place (planning par instructeur, eleves, saisie competences StudentSkill).
- ARCH-04 (P1): implementer reellement reset-password/forgot-password/verify-email (les champs token existent deja en schema) — actuellement des stubs 202.
- ARCH-05 + ARCH-06 (P2): etablir une source unique de catalogue (fin de la duplication site.ts/initial-data/seed) et brancher les modeles orphelins StudentDocument/Vehicle indispensables aux dossiers et au planning multi-metiers.

<details><summary>Voir les 9 findings détaillés</summary>

#### 🟠 `ARCH-01` VTC et CACES totalement absents du domaine (front + back + schema)
**Sévérité :** P1 · **Effort :** XL

- **Problème :** Le perimetre annonce inclut un centre VTC et un centre CACES, mais une recherche exhaustive (grep -rin 'vtc|caces' sur *.ts/*.tsx/*.prisma/*.md hors node_modules) ne retourne AUCUNE occurrence. Aucun slug de formation VTC/CACES (live API /api/formations = 8 formations: permis-b-manuel, permis-b-automatique, conduite-accompagnee, permis-accelere, code-en-ligne, stage-code, annulation-permis, perfectionnement; data/site.ts = memes 8). L'enum FormationMode (prisma/schema.prisma:40-45) ne contient que MANUEL/AUTOMATIQUE/MIXTE/CODE, aucune notion de categorie de permis (poids lourds, transport) ni de centre d'examen CACES. Aucun formulaire devis/VTC/CACES, aucune page dediee, aucun ExamType au-dela de CODE/CONDUITE (schema:108-111).
- **Impact :** Deux tiers du business model annonce ne sont pas representes dans le produit. Impossible de vendre, planifier ou facturer une formation VTC ou CACES. Ecart majeur entre la promesse commerciale et le logiciel livre.
- **Recommandation :** Modeliser un axe 'categorie de produit' (auto-ecole | VTC | CACES) plutot que de tout deduire de FormationMode. Ajouter un champ category/productLine sur Formation, etendre ExamType (ou creer un modele Certification pour CACES R489/R486...), creer les slugs/pages/formulaires devis correspondants, et alimenter initial-data + seed. Reutiliser la couche repository existante (pas de refonte structurelle necessaire).
- **Fichiers :** `prisma/schema.prisma:40-45`, `prisma/schema.prisma:108-111`, `backend/src/data/initial-data.ts`, `data/site.ts:159-241`, `app/formations/[slug]/page.tsx`
- **Vérifié :** test grep: 'grep -rin vtc|caces' sur tout le repo hors node_modules => 0 resultat. test curl: GET http://127.0.0.1:4000/api/formations => 200, 8 formations, aucune VTC/CACES. lecture schema.prisma:40-45,108-111.

#### 🔴 `ARCH-02` Paiement Stripe entierement simule (aucun SDK, webhook non verifie)
**Sévérité :** P0 · **Effort :** L

- **Problème :** Aucun package 'stripe' n'est present (absent de package.json et de node_modules/stripe). Le modele Payment porte stripePaymentIntentId/stripeCustomerId (schema.prisma:378-379) mais la route POST /api/payments/payment-intents (backend/src/modules/payments/payments.routes.ts:95-128) ne contacte jamais Stripe: elle genere stripePaymentIntentId: `pi_mock_${Date.now()}` et renvoie stripe:{mode:'mock', clientSecret:`..._secret_mock`}. La route POST /api/payments/stripe/webhook (ligne 130-136) renvoie 202 sans aucune verification de signature, et est de plus protegee par requirePermission('payments.manage') -> Stripe ne pourrait de toute facon jamais l'appeler.
- **Impact :** Le 'paiement en ligne' annonce n'encaisse rien. Tout paiement est fictif: risque de croire qu'une vente est encaissee alors qu'aucun flux monetaire n'existe. Le webhook ne peut pas confirmer de paiement reel (auth + pas de signature). Bloquant pour la mise en production du parcours d'achat.
- **Recommandation :** Integrer le SDK stripe officiel (npm i stripe), creer un vrai PaymentIntent cote serveur avec la cle secrete, exposer le webhook AVANT le middleware d'auth avec express.raw + verification de signature (stripe.webhooks.constructEvent), et mapper les events vers updatePayment. Ajouter STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET dans config/env.ts avec garde-fou prod, sur le modele de GROQ_API_KEY (degradation propre si absente).
- **Fichiers :** `backend/src/modules/payments/payments.routes.ts:95-136`, `prisma/schema.prisma:378-379`, `package.json:26-42`, `backend/src/config/env.ts`
- **Vérifié :** lecture payments.routes.ts:118 (pi_mock), :122-125 (mode mock), :130-136 (webhook stub avec requirePermission). test bash: 'ls node_modules/stripe' => NOT FOUND; grep stripe package.json => vide.

#### 🟠 `ARCH-03` Espace formateur absent cote front alors que le RBAC MONITEUR est cable au backend
**Sévérité :** P1 · **Effort :** L

- **Problème :** Le perimetre annonce un espace formateur. Le role MONITEUR a des permissions definies (backend/src/domain/permissions.ts:109: dashboard.read, bookings.read, bookings.manage, students.read, exams.read, reviews.read) et figure dans l'enum UserRole (schema.prisma:18). Mais aucune page front ne le consomme: find app -name page.tsx ne montre que /espace-eleve et /admin/* ; grep 'espace-formateur|formateur' sur app/ ne retourne que des libelles marketing ('moniteurs'), aucune route. Un MONITEUR qui se connecte n'a ni espace eleve adapte ni acces /admin (middleware.ts protege /admin par role admin).
- **Impact :** Les moniteurs ne peuvent pas consulter leur planning, leurs eleves ni saisir les acquis/competences via une interface dediee. Le travail RBAC backend est partiellement perdu et la promesse 'espace formateur' n'est pas tenue.
- **Recommandation :** Creer un espace /espace-formateur (ou section dediee de /admin/planning filtree par instructorId) consommant bookings/students/exams avec les permissions MONITEUR deja en place. Etendre middleware.ts pour autoriser MONITEUR sur ce perimetre. Reutiliser StudentSkill (setStudentSkill existe deja dans le repo) pour la saisie des competences par le moniteur.
- **Fichiers :** `backend/src/domain/permissions.ts:109`, `prisma/schema.prisma:18`, `middleware.ts`, `app/espace-eleve/page.tsx`
- **Vérifié :** lecture permissions.ts:109 (MONITEUR permissions). test bash: find app -name page.tsx => aucune route formateur/moniteur; grep 'formateur|moniteur' app/ => uniquement libelles marketing dans page.tsx/a-propos.

#### 🟠 `ARCH-04` Flux reset-password / forgot-password / verify-email sont des stubs
**Sévérité :** P1 · **Effort :** M

- **Problème :** Le schema porte resetTokenHash/resetTokenExpiresAt (schema.prisma:139-140) mais les routes ne les utilisent pas: POST /api/auth/forgot-password (auth.routes.ts:105-113) valide le body et renvoie un message generique sans generer ni stocker de token ; POST /api/auth/reset-password (:115-122) renvoie 202 'Flux reset pret pour integration email securisee.' sans verifier/consommer de token ni changer le mot de passe ; POST /api/auth/verify-email (:124-129) idem (202 stub).
- **Impact :** Aucun utilisateur ne peut reellement reinitialiser son mot de passe ni verifier son email. Conforme a l'item differe connu de la roadmap securite, mais reste un trou fonctionnel: un eleve qui oublie son mot de passe est bloque, support oblige.
- **Recommandation :** Implementer le cycle complet: forgot-password genere un token aleatoire, stocke son hash + expiration (champs deja presents), envoie l'email (Resend deja prevu en config) ; reset-password verifie le hash/expiration, applique bcrypt sur le nouveau mot de passe, invalide le token. verify-email idem via emailVerifiedAt. Couvrir par tests vitest.
- **Fichiers :** `backend/src/modules/auth/auth.routes.ts:105-129`, `prisma/schema.prisma:139-140`, `backend/src/domain/types.ts:97-98`
- **Vérifié :** lecture auth.routes.ts:105-129 (3 routes renvoyant 202/200 avec messages 'pret pour integration', aucune logique de token).

#### 🟡 `ARCH-05` Duplication des donnees de catalogue: data/site.ts vs backend initial-data.ts (pas de source unique)
**Sévérité :** P2 · **Effort :** M

- **Problème :** Les 8 formations sont definies deux fois et a la main: une fois dans data/site.ts (bloc formations lignes 159-241) comme fallback front, une fois dans backend/src/data/initial-data.ts comme seed memoire. Les deux doivent rester synchronisees manuellement (memes slugs, memes prix exprimes differemment: euros front vs cents back). Les mappers lib/catalog-mappers.ts:43 (priceCents/100) gerent la frontiere cents->euros correctement, mais rien ne garantit que le fallback site.ts reflete le catalogue reel. prisma/seed.ts est encore une 3e source potentielle a aligner.
- **Impact :** Risque de derive: si un prix/une formation change en base, le fallback affiche pendant une panne API montrerait des donnees obsoletes (mauvais prix au client). Maintenance dupliquee et source d'incoherences silencieuses.
- **Recommandation :** Definir une source unique de verite pour le catalogue (ex: un module partage en cents consomme par seed + initial-data + fallback front, les euros etant uniquement derives via les mappers existants). A minima, ajouter un test de coherence (snapshot) verifiant que les slugs/prix de site.ts == initial-data == seed.
- **Fichiers :** `data/site.ts:159-241`, `backend/src/data/initial-data.ts`, `prisma/seed.ts`, `lib/catalog-mappers.ts:37-60`
- **Vérifié :** test bash: slugs formations site.ts (sed 159,241) = 8, identiques aux 8 du live /api/formations et a initial-data. Le decompte 'slug:' brut diverge (13 vs 14) car pollue par slugs d'agences (nation/republique) et pricingPlans -> confirme duplication manuelle multi-fichiers.

#### 🟡 `ARCH-06` Modeles Prisma orphelins: StudentDocument et Vehicle non exposes par le repository
**Sévérité :** P2 · **Effort :** M

- **Problème :** Le schema definit StudentDocument (schema.prisma:225-234) et Vehicle (:259-270) avec relations completes, mais l'interface LodenRepository (loden-repository.ts) ne contient AUCUNE methode pour ces entites, et la PrismaLodenRepository ne les requete jamais (grep 'studentDocument|prisma.vehicle' => 0). Ces tables existeraient en base sans aucun code applicatif pour les lire/ecrire.
- **Impact :** Dette: gestion documentaire eleve (pieces justificatives, indispensable pour dossiers CPF/inscription) et parc vehicules (necessaire pour planning VTC/CACES et affectation boite manuelle/auto) sont modelises mais inutilisables. Schema qui ment sur les capacites reelles du produit.
- **Recommandation :** Soit implementer les methodes repository + routes (recommande, surtout StudentDocument pour les dossiers et Vehicle pour le planning multi-categories VTC/CACES), soit retirer ces modeles du schema pour qu'il reflete la realite. Privilegier l'implementation vu le perimetre vise.
- **Fichiers :** `prisma/schema.prisma:225-234`, `prisma/schema.prisma:259-270`, `backend/src/repositories/loden-repository.ts`, `backend/src/repositories/prisma-loden-repository.ts`
- **Vérifié :** test bash: grep StudentDocument/Vehicle dans loden-repository.ts => 'NOT in repo interface'; grep 'studentDocument|prisma.vehicle' dans prisma-loden-repository.ts => vide.

#### 🔵 `ARCH-07` Proxy Next limite a GET/POST/PATCH: route DELETE backend /api/faq/:id inatteignable
**Sévérité :** P3 · **Effort :** S

- **Problème :** proxyBackendJson n'accepte que method?: 'GET'|'POST'|'PATCH' (lib/backend-proxy.ts:8). Le backend expose pourtant router.delete sur /api/faq/:id (content.routes.ts:64) et a une methode deleteFaqEntry dans le repository. La route proxy app/api/faq/[id]/route.ts n'exporte que PATCH. Aucune route Next ne peut donc relayer un DELETE (ni un PUT). En pratique le front fait un soft-delete via PATCH active:false (FaqManager.tsx:72), donc le DELETE backend est du code mort non couvert.
- **Impact :** Faible aujourd'hui (DELETE non utilise cote UI), mais incoherence d'API: une capacite backend exposee est structurellement inaccessible. Piege pour un futur dev qui voudrait cabler un vrai delete (ou une route REST PUT).
- **Recommandation :** Soit etendre le type ProxyOptions.method a DELETE/PUT et ajouter l'export DELETE dans app/api/faq/[id]/route.ts, soit supprimer la route router.delete du backend pour aligner front/back sur le pattern soft-delete (active:false) effectivement utilise.
- **Fichiers :** `lib/backend-proxy.ts:8`, `backend/src/modules/content/content.routes.ts:64`, `app/api/faq/[id]/route.ts`, `components/crm/FaqManager.tsx:72`
- **Vérifié :** lecture backend-proxy.ts:7-12 (method limite a 3 verbes); content.routes.ts:64 (router.delete); test bash: aucun fetch DELETE dans components/app (grep method:DELETE => vide), FaqManager.tsx:72 utilise PATCH.

#### 🟡 `ARCH-08` Incoherence du minimum JWT_SECRET entre schema Zod (16) et garde-fou prod (32)
**Sévérité :** P2 · **Effort :** S

- **Problème :** Dans backend/src/config/env.ts, le schema Zod impose JWT_SECRET.min(16) (ligne 7) avec un default dev 'dev-secret-change-me'. Le garde-fou prod (lignes 40-47) exige >= 32 caracteres. Un secret de 16-31 caracteres passe donc la validation de base mais sera rejete seulement en NODE_ENV=production. La cle Groq (GROQ_API_KEY) est en clair en config (item differe connu: a tourner).
- **Impact :** Risque de fausse confiance: un secret de 20 caracteres est accepte en dev/staging puis fait crasher le demarrage en prod. La barre min(16) est sous le seuil reel de securite (32). Coherent avec la reforme securite mais le double seuil prete a confusion.
- **Recommandation :** Aligner: passer le min Zod a 32 (ou commenter explicitement le double seuil dev/prod). Documenter dans .env.example. Externaliser la cle Groq dans le secret manager / variable d'env non versionnee et la rotation (deja note dans la roadmap differee).
- **Fichiers :** `backend/src/config/env.ts:7`, `backend/src/config/env.ts:40-52`, `backend/src/config/env.ts:22`
- **Vérifié :** lecture env.ts:7 (min(16) + default dev) vs :44-46 (length<32 rejete en prod). Garde-fou prod (API_USE_MEMORY/DATABASE_URL) confirme lignes 49-51.

#### 🔵 `ARCH-09` Modele Lead etendu par migration sans champs metier devis VTC/CACES
**Sévérité :** P3 · **Effort :** M

- **Problème :** 7 migrations Prisma coherentes avec le schema (initial, extend_user_role, add_agencies, add_exams, add_student_skills, add_installments, lead_temperature). La derniere (20260608000500_lead_temperature) ajoute temperature/score sur Lead (aligne avec schema.prisma:442-443) pour le scoring IA. Mais Lead.interest est un simple String? libre (schema:437): aucune typologie de produit (auto-ecole/VTC/CACES) ni montant de devis structure cote pipeline, alors que LeadStatus inclut DEVIS_ENVOYE (:103).
- **Impact :** Le pipeline CRM ne peut pas segmenter/reporter par ligne de produit (combien de leads VTC vs CACES vs auto-ecole), ce qui est central pour piloter une activite multi-metiers. Le statut DEVIS_ENVOYE existe sans objet devis associe.
- **Recommandation :** Quand ARCH-01 sera traite, typer Lead.interest via un enum de ligne de produit et envisager un modele Quote (devis) relie au Lead, pour cohabiter avec le scoring temperature/score deja en place. Migration additive simple (le pattern est deja maitrise: cf lead_temperature).
- **Fichiers :** `prisma/schema.prisma:430-451`, `prisma/migrations/20260608000500_lead_temperature/migration.sql`
- **Vérifié :** test bash: 7 migrations listees, contenu lead_temperature lu (ALTER TABLE Lead ADD temperature/score) coherent avec schema.prisma:442-443. interest=String? libre (:437), LeadStatus.DEVIS_ENVOYE (:103) sans modele devis.

</details>

---

### QA / Testeur

_13 findings — 🔴 1 · 🟠 5 · 🟡 6 · 🔵 1_

Site fonctionnel dans l'ensemble: les 18 pages publiques repondaient 200 en debut de session, les 9 sous-pages /admin rendent 200 avec cookie admin, la 404 et not-found s'affichent correctement, et les 5 formulaires (Contact, CPF, Login, Inscription, Paiement) sont cables a l'API avec validation client zod ET serveur zod, messages d'erreur clairs et feedback de succes. Les parcours bout-en-bout marchent reellement: inscription -> profil eleve -> reservation -> intention de paiement (mock), tous testes en curl avec tokens reels. Le RBAC est solide (401 sans token, 401/403 selon role) et les gardes anti-chevauchement de reservation fonctionnent (409). Cependant, plusieurs trous de validation metier cote backend (montant de paiement non verifie contre le prix du plan, formationId/pricingPlanId/instructorId inexistants acceptes, reservations dans le passe acceptees), une incoherence proxy register (429 -> 500), des slugs de tarifs qui 404 en page detail, une recherche globale qui renvoie tout vers /formations, un blog 100% placeholder, et l'agent IA CRM qui cree des leads sans confirmation. NOTE IMPORTANTE: en cours de session le serveur dev Next (:3000) a ete corrompu par un processus `next start` concurrent (autre agent) qui a ecrase le dossier .next a 19:57 — les 500 apparus en fin de session sur /, /formations, /tarifs etc. sont environnementaux (necessite redemarrage du dev server), pas un defaut de code; le backend :4000 est reste 100% sain et toutes les conclusions API sont reproductibles en direct.

**Priorités de la dimension :**
- Backend paiement: valider amountCents contre le prix reel du PricingPlan et verifier l'existence du pricingPlanId (anti-fraude avant branchement Stripe reel) — PAY-01/PAY-02
- Proxy auth/register: une reponse 429 (rate-limit) du backend ressort en 500 'Internal Server Error' cote /api/auth/register via Next — l'utilisateur ne comprend pas qu'il doit attendre (AUTH-01)
- Validation referentielle backend: CPF accepte un formationId inexistant et les bookings acceptent un instructorId inexistant + un creneau dans le passe (DATA-01/BOOK-01/BOOK-02)
- UX inscription: aucune redirection apres creation de compte (l'eleve reste sur le formulaire) alors que la session cookie est posee — incoherent avec le login qui redirige (UX-01)
- Slugs tarifs (permis-b, boite-automatique, pack-cpf) -> page detail formation 404, et la recherche globale renvoie toutes les formations vers /formations (impasse de navigation) — NAV-01/NAV-02

<details><summary>Voir les 13 findings détaillés</summary>

#### 🔴 `PAY-01` Le montant du paiement est fourni par le client et n'est jamais verifie contre le prix du pack
**Sévérité :** P0 · **Effort :** M · **Catégorie :** Securite / Validation metier

- **Problème :** POST /api/payments/payment-intents accepte amountCents tel quel depuis le client. Un eleve authentifie peut creer une intention pour le pack plan-permis-b (1190 EUR) avec amountCents:1 — le backend stocke 1 centime sans verification contre le prix reel du PricingPlan. PaymentIntentForm.tsx (l.131) envoie amountCents=selectedPlan.priceCents mais rien n'empeche un appel direct avec un montant arbitraire.
- **Impact :** Aujourd'hui le paiement est mocke (pas de stripe installe), donc pas de perte financiere immediate. Mais des le branchement Stripe reel, c'est une faille de fraude tarifaire critique: payer 0,01 EUR un permis a 1190 EUR. A corriger AVANT toute mise en prod du checkout.
- **Recommandation :** Cote backend (module payments), deriver amountCents depuis le PricingPlan referencee cote serveur (lookup repository) au lieu de faire confiance au body. Rejeter ou ignorer amountCents client. Ajouter un test.
- **Fichiers :** `backend/src/modules/payments/payments.routes.ts`, `components/PaymentIntentForm.tsx:125`
- **Vérifié :** test curl direct :4000 avec token eleve: POST /api/payments/payment-intents -d '{"pricingPlanId":"plan-permis-b","amountCents":1,"kind":"FORMATION","currency":"EUR"}' -> HTTP 201, 'amountCents stored: 1'. Lecture components/PaymentIntentForm.tsx:125-134.

#### 🟠 `PAY-02` pricingPlanId inexistant accepte sans verification d'integrite referentielle
**Sévérité :** P1 · **Effort :** S · **Catégorie :** Validation metier

- **Problème :** POST /api/payments/payment-intents avec pricingPlanId:'plan-GHOST-999' renvoie 201 et stocke ce plan fantome avec status EN_ATTENTE. Aucune verification que le plan existe.
- **Impact :** Donnees de paiement incoherentes (paiements rattaches a des packs inexistants), impossibles a reconcilier en compta/CRM. Surface d'erreur pour le futur checkout Stripe.
- **Recommandation :** Verifier l'existence du PricingPlan cote backend avant de creer l'intention; renvoyer 404/400 si introuvable.
- **Fichiers :** `backend/src/modules/payments/payments.routes.ts`
- **Vérifié :** test curl direct :4000: POST payment-intents -d '{"pricingPlanId":"plan-GHOST-999","amountCents":119000,...}' -> HTTP 201, 'planId stored: plan-GHOST-999'.

#### 🟠 `AUTH-01` Rate-limit backend (429) ressort en 500 'Internal Server Error' via le proxy /api/auth/register
**Sévérité :** P1 · **Effort :** S · **Catégorie :** Proxy / Gestion d'erreur

- **Problème :** Le backend protege /api/auth/register par un rate-limit (10/60s) qui renvoie un 429 JSON propre {error:{code:RATE_LIMITED}}. Mais via le proxy Next (/api/auth/register sur :3000), la reponse rate-limitee ressort en 500 'Internal Server Error' (corps texte brut). A noter: /api/auth/login proxifie correctement le 429 (verifie: 429 JSON), donc l'incoherence est specifique a register.
- **Impact :** Un eleve qui re-tente une inscription (ou plusieurs personnes derriere une meme IP/box) voit un '500 Internal Server Error' generique au lieu d'un message 'trop de tentatives, reessayez dans une minute'. Perte de conversion + impression de site casse sur le formulaire d'inscription. StudentRegistrationForm affichera alors le message generique de fallback.
- **Recommandation :** Verifier le handler app/api/auth/register/route.ts: l'appel result.clone().json() ou la pose de cookie peut lever sur une reponse non-2xx. S'assurer que le 429 (et tout statut backend) est relaye tel quel comme le fait login. Aligner register sur le comportement de login.
- **Fichiers :** `app/api/auth/register/route.ts:5`, `lib/backend-proxy.ts:41`
- **Vérifié :** curl direct :4000 register rate-limite -> HTTP 429 JSON propre. Meme requete via proxy :3000 -> 'Internal Server Error' HTTP 500. Login via proxy rate-limite -> 429 JSON correct (comparaison). Lecture app/api/auth/register/route.ts:5-23 et lib/backend-proxy.ts.

#### 🟠 `BOOK-01` Reservations dans le passe acceptees (aucune garde de date future)
**Sévérité :** P1 · **Effort :** S · **Catégorie :** Validation metier

- **Problème :** POST /api/bookings avec startsAt='2020-01-01T09:00:00Z' / endsAt='2020-01-01T10:00:00Z' renvoie 201. Le backend verifie bien fin>debut (409 si inverse) et le chevauchement moniteur (409), mais pas que le creneau est dans le futur.
- **Impact :** Donnees de planning incoherentes (lecons dans le passe), KPIs/planning CRM fausses, eleve pouvant 'reserver' une date revolue. Qualite des donnees operationnelles degradee.
- **Recommandation :** Ajouter une garde startsAt > now() (avec petite marge) dans la validation/logique du module bookings.
- **Fichiers :** `backend/src/modules/bookings/bookings.routes.ts`
- **Vérifié :** curl direct :4000 avec token eleve: POST /api/bookings startsAt 2020 (ordre valide) -> HTTP 201. Test ordre inverse -> 409 'fin doit etre apres le debut'. Test chevauchement -> 409 'moniteur deja reserve'.

#### 🟠 `BOOK-02` Reservation acceptee avec un instructorId inexistant et hors creneau de disponibilite
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Validation metier

- **Problème :** POST /api/bookings avec instructorId:'instructor-DOES-NOT-EXIST' et un creneau (25/12 03h00) hors de toute Availability renvoie 201. Aucune verification que le moniteur existe ni que le creneau tombe dans une fenetre de disponibilite declaree.
- **Impact :** On peut reserver un moniteur fantome ou en dehors de ses horaires; le planning CRM affiche des reservations impossibles, et l'eleve croit avoir un creneau qui n'existe pas. Risque de no-show et de litige.
- **Recommandation :** Verifier l'existence de l'instructorId et l'inclusion du creneau dans une Availability disponible avant de creer la reservation.
- **Fichiers :** `backend/src/modules/bookings/bookings.routes.ts`, `components/BookingCalendar.tsx:51`
- **Vérifié :** curl direct :4000 token eleve: POST /api/bookings instructorId inexistant + creneau hors fenetre -> HTTP 201. La fenetre de dispo seedee est 08:30-19:30 (verifie via GET /api/bookings/slots).

#### 🟡 `DATA-01` Demande CPF acceptee avec un formationId inexistant
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Validation metier

- **Problème :** POST /api/cpf/requests avec formationId:'formation-inexistante' (ou 'GHOST-FORMATION-999') renvoie 201 et stocke la demande. Aucune verification d'integrite. Le formulaire CpfRequestForm propose les bons IDs (formation-permis-b-manuel etc., verifies conformes a l'API), donc pas d'impact via l'UI, mais l'API est permissive.
- **Impact :** Demandes CPF rattachees a des formations inexistantes -> traitement conseiller errone, donnees CRM polluees. Faible en UI normale, moyen si appels API directs / futurs canaux.
- **Recommandation :** Verifier l'existence du formationId cote backend (module cpf) avant creation; sinon 400.
- **Fichiers :** `backend/src/modules/cpf/cpf.routes.ts`, `components/CpfRequestForm.tsx:10`
- **Vérifié :** curl :4000 POST /api/cpf/requests formationId='GHOST-FORMATION-999' -> 201 'accepted bogus formationId'. Verif IDs formulaire vs API: les 4 options de CpfRequestForm.tsx:10-15 correspondent aux IDs reels.

#### 🟠 `UX-01` Aucune redirection apres inscription reussie (eleve laisse sur le formulaire)
**Sévérité :** P1 · **Effort :** S · **Catégorie :** UX / Conversion

- **Problème :** StudentRegistrationForm.onSubmit pose la session cookie httpOnly via /api/auth/register puis affiche seulement un message de succes statique et reset le formulaire (l.92-93). Il n'y a PAS de router.push('/espace-eleve'). LoginForm, lui, redirige (router.push selon le role, l.50-52). Incoherence: apres inscription l'eleve connecte reste sur la page d'inscription.
- **Impact :** Friction de conversion: l'utilisateur vient de creer son compte mais ne sait pas ou aller; il doit naviguer manuellement vers son espace. Parcours qui ne va pas au bout.
- **Recommandation :** Apres succes, rediriger vers /espace-eleve (router.push + router.refresh) comme le fait LoginForm, ou afficher un CTA explicite 'Acceder a mon espace'.
- **Fichiers :** `components/StudentRegistrationForm.tsx:92`, `components/LoginForm.tsx:50`
- **Vérifié :** Lecture components/StudentRegistrationForm.tsx:65-94 (pas de useRouter, pas de redirect) vs components/LoginForm.tsx:50-52 (router.push(isAdminRole(role)?'/admin':'/espace-eleve')). Flux register teste en curl: 201 + token + profil eleve cree.

#### 🟡 `NAV-01` Slugs de packs tarifaires renvoient 404 sur la page detail formation
**Sévérité :** P2 · **Effort :** M · **Catégorie :** Navigation / Coherence donnees

- **Problème :** data/site.ts contient deux tableaux: formations (8 slugs) et pricingPlans (slugs permis-b, permis-accelere, boite-automatique, pack-cpf). generateStaticParams de /formations/[slug] n'utilise que 'formations'. Donc /formations/permis-b, /formations/boite-automatique, /formations/pack-cpf renvoient 404. Idem /formations/vtc et /formations/caces (perimetre annonce mais absent).
- **Impact :** Aujourd'hui ces slugs ne sont PAS lies depuis les PricingCard (qui pointent vers /paiement?plan=id ou /cpf — verifie), donc pas de lien mort visible. Mais c'est un piege latent: tout lien futur ou partage direct vers ces URLs casse. Et l'absence de VTC/CACES confirme l'ecart avec le perimetre metier annonce.
- **Recommandation :** Soit ajouter des redirections/alias (permis-b -> permis-b-manuel), soit creer les pages detail manquantes, soit unifier la source des slugs. Clarifier le perimetre VTC/CACES (pages dediees attendues).
- **Fichiers :** `app/formations/[slug]/page.tsx:13`, `data/site.ts:240`, `components/PricingCard.tsx:18`
- **Vérifié :** curl :3000 (debut de session, dev sain): /formations/permis-b=404, /formations/boite-automatique=404, /formations/pack-cpf=404, /formations/vtc=404, /formations/caces=404; les 8 slugs de 'formations'=200. Lecture app/formations/[slug]/page.tsx:13-14 (generateStaticParams sur formations seulement), data/site.ts:240-275 (pricingPlans), components/PricingCard.tsx:18 (ctaHref vers /paiement ou /cpf, pas vers le slug).

#### 🟡 `NAV-02` La recherche globale renvoie toutes les formations vers /formations (impasse, pas de detail)
**Sévérité :** P2 · **Effort :** M · **Catégorie :** Navigation / UX

- **Problème :** GET /api/search?q=permis renvoie des resultats de categorie 'formation' avec href hardcode '/formations' (liste) pour TOUS, idem 'tarif'->/tarifs, 'moniteur'->/a-propos, 'faq'->/contact. GlobalSearch.tsx affiche le titre precis (ex 'Permis B automatique') mais le clic mene a la liste generique, pas a /formations/permis-b-automatique.
- **Impact :** L'utilisateur cherche 'Permis B automatique', voit le bon resultat, clique et atterrit sur la liste complete — il doit re-chercher. Friction et impression de recherche 'decorative'. Sous-optimal pour un site qui vise la reference locale.
- **Recommandation :** Cote backend search, generer un href pointant vers la ressource precise (/formations/<slug>, ancre tarif, fiche moniteur) plutot qu'une page d'index.
- **Fichiers :** `backend/src/modules/search/search.routes.ts`, `components/GlobalSearch.tsx:144`
- **Vérifié :** curl :3000 GET /api/search?q=permis -> tous les href 'formation' = '/formations'. Lecture components/GlobalSearch.tsx:24-31,142-156 (href relaye tel quel depuis l'API).

#### 🟡 `BLOG-01` Le /blog est un placeholder: 3 cartes 'article' qui renvoient vers des pages produit, aucun contenu editorial
**Sévérité :** P2 · **Effort :** L · **Catégorie :** Contenu / SEO

- **Problème :** app/blog/page.tsx contient un tableau statique de 3 'articles' (Choisir manuel/auto, Comprendre le financement, Preparer le code) dont le CTA 'Lire le guide' pointe vers /formations, /cpf, /formations/code-en-ligne. Il n'existe pas de route /blog/[slug] ni de vrai contenu d'article.
- **Impact :** Promesse non tenue: l'utilisateur clique 'Lire le guide' en s'attendant a un article et tombe sur une page produit/CPF. Faible valeur SEO (3 liens internes deguises en blog), incoherent avec l'ambition 'reference locale' (contenu = levier SEO majeur pour une auto-ecole).
- **Recommandation :** Soit creer un vrai blog (route /blog/[slug] + contenu), soit reetiqueter ces cartes en 'Guides' avec un CTA honnete ('Voir les formations'/'Verifier mon CPF'). Prioriser pour le SEO local.
- **Fichiers :** `app/blog/page.tsx:12`
- **Vérifié :** curl :3000 /blog=200 (debut de session). Lecture app/blog/page.tsx:12-29 (3 entrees statiques), href -> /formations, /cpf, /formations/code-en-ligne; CTA 'Lire le guide' (l.66). Aucun fichier app/blog/[slug].

#### 🟡 `AI-01` L'agent IA CRM cree des leads sans etape de confirmation
**Sévérité :** P2 · **Effort :** M · **Catégorie :** IA / Securite donnees

- **Problème :** POST /api/ai/agent (protege par auth, 401 sans token — verifie) avec 'Cree un lead pour Jean Dupont, tel 0612345678, interesse par le permis B' execute l'outil create_lead et repond 'Le prospect a ete cree avec succes' — en un seul tour, sans confirmation. Les outils exposes incluent aussi book_appointment et find_student.
- **Impact :** Mutation de donnees CRM (creation de leads, potentiellement rendez-vous) declenchee par langage naturel sans garde-fou ni confirmation. Risque d'actions accidentelles ou induites par injection de prompt (un message colle dans le chat pourrait creer des entites). A surveiller surtout cote outils mutatifs.
- **Recommandation :** Pour les outils mutatifs (create_lead, book_appointment), exiger une confirmation explicite a l'utilisateur (recapitulatif + 'confirmer') avant execution, et tracer dans l'audit log (deja note comme differe).
- **Fichiers :** `backend/src/modules/ai/ai.routes.ts`, `components/crm/AiAgentChat.tsx:33`
- **Vérifié :** curl :4000 POST /api/ai/agent token admin: message creation lead -> 'reply: Le prospect a ete cree avec succes', tools incluent create_lead/book_appointment/find_student. Sans token -> 401 (verifie via proxy et direct).

#### 🔵 `AI-02` L'agent IA CRM ne sait pas repondre aux KPIs (leads, stats) qu'un admin attend
**Sévérité :** P3 · **Effort :** M · **Catégorie :** IA / CRM

- **Problème :** Demande a l'agent (token admin) 'Combien de leads avons-nous ?' -> 'Je n'ai pas acces a ce chiffre... contactez un conseiller au 01 84 80 12 45'. L'agent n'expose pas d'outil de comptage/KPI (pas de get_leads/get_stats dans la liste d'outils), il deflecte comme pour un visiteur public alors qu'il est dans le cockpit CRM.
- **Impact :** L'assistant CRM (page /admin/assistant) ne remplit pas sa promesse de pilotage: il ne lit pas les indicateurs internes. Deflection vers un numero de telephone incongrue pour un utilisateur admin connecte.
- **Recommandation :** Ajouter des outils de lecture KPI (count leads, pipeline, stats) reserves aux roles admin, ou clarifier le perimetre de l'assistant. Adapter le ton selon le contexte (CRM vs public).
- **Fichiers :** `backend/src/modules/ai/ai.routes.ts`
- **Vérifié :** curl :4000 POST /api/ai/agent token admin 'Combien de leads ?' -> reply de deflection + telephone; tools listes sans outil de comptage/KPI.

#### 🟡 `ENV-01` Le serveur dev Next (:3000) corrompu en cours de session par un processus 'next start' concurrent (a redemarrer)
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Environnement / Infra de test

- **Problème :** En debut de session les 18 pages publiques renvoyaient 200 (verifie). En cours de session, un processus concurrent 'PORT=3100 npx next start' (autre agent, PID 45989, lance a 19:56) a ecrit une build de PRODUCTION dans le dossier .next partage a 19:57, ce qui a casse le serveur 'next dev' en cours d'execution (PID 39899): / /formations /tarifs /a-propos /avis /permis-b-paris-11 et les routes /api/* via proxy renvoient desormais 500, alors que /contact /cpf /blog /inscription /espace-eleve restent 200. Le backend :4000 est reste 100% sain.
- **Impact :** Etat de test instable: les 500 observes en fin de session ne sont PAS un defaut de code applicatif mais une contamination d'environnement (un seul dossier .next partage entre 'next dev' et 'next start'). Necessite un redemarrage du dev server pour revenir a l'etat 200 initial.
- **Recommandation :** Ne pas lancer 'next start' (prod) dans le meme repertoire qu'un 'next dev' actif (partage de .next). Pour les tests paralleles, utiliser des distDir/working-dirs separes. Redemarrer 'npm run dev' pour restaurer le site. Aucune correction de code requise pour ce point.
- **Fichiers :** `.next/`, `ecosystem.config.cjs`
- **Vérifié :** Constat initial: 18/18 pages publiques = 200. Apres 19:57: ls .next -> ne contenait plus que 'cache' puis a ete repeuple d'artefacts de PROD (BUILD_ID, prerender-manifest.json, export-marker.json) incompatibles avec next dev; ps aux a montre 'PORT=3100 npx next start' (PID 45989) et next-server PID 39899 a 94% CPU puis 0%. Backend direct :4000 = 200 sur tous les endpoints tout du long.

</details>

---

### UX Designer (parcours & conversion)

_16 findings — 🔴 0 · 🟠 4 · 🟡 9 · 🔵 3_

Le site LODEN est visuellement abouti (charte turquoise coherente, hero soigne, cartes premium) et les parcours techniques fonctionnent (API publiques en 200, gardes auth en 401 verifiees par curl). Mais l'experience souffre de ruptures de conversion serieuses: le tunnel de paiement exige un compte AVANT toute valeur percue (clic Choisir ce pack mene a un mur de connexion), les CTA Demander un devis pointent vers un formulaire generique sans contexte de la formation, et plusieurs liens de menu/packs menent a des 404 (slugs permis-b, boite-automatique, pack-cpf). L'orientation est faible: aucun fil d'ariane sur tout le site, pas de loading.tsx, et le perimetre metier annonce (VTC, CACES) est totalement absent du contenu (0 mention). Incoherence de marque recurrente LODEN vs LODENE (logo, hero, assistant IA). Les formulaires sont propres (react-hook-form + Zod, feedback inline) mais le diagnostic est long (8 champs obligatoires) et l'inscription demande un mot de passe de 10 caracteres des la premiere etape. Les deux boutons flottants (WhatsApp + IA) se superposent en bas a droite et creent de la confusion.

**Priorités de la dimension :**
- Reparer les liens morts du menu Formations et des packs (404 sur permis-b, boite-automatique, pack-cpf) qui cassent la confiance et le SEO interne
- Reduire la friction du tunnel de paiement: montrer le recap du pack et ouvrir un checkout invite AVANT d'exiger un compte
- Aligner la marque LODEN/LODENE partout et combler l'ecart de perimetre VTC/CACES annonce mais inexistant
- Ajouter un fil d'ariane et des etats de chargement (loading.tsx), et contextualiser les CTA Demander un devis avec la formation d'origine
- Desencombrer la pile de boutons flottants (WhatsApp + IA superposes) et raccourcir le formulaire de diagnostic

<details><summary>Voir les 16 findings détaillés</summary>

#### 🟠 `UX-01` Liens du menu Formations et des packs menent a des 404
**Sévérité :** P1 · **Effort :** M

- **Problème :** Plusieurs slugs references dans la navigation et les cartes de prix n'existent pas. Le menu deroulant Header pointe vers /formations/perfectionnement avec le libelle Conduite supervisee (HeaderMain.tsx:47), et plus grave, les packs de prix (data/site.ts:245,263,272) utilisent les slugs permis-b, boite-automatique, pack-cpf qui ne correspondent a aucune formation. Test curl: /formations/permis-b -> 404, /formations/boite-automatique -> 404, /formations/pack-cpf -> 404, alors que /formations/permis-b-manuel -> 200.
- **Impact :** Un visiteur qui clique sur un pack ou un libelle de menu peut tomber sur une page 404, ce qui detruit la confiance sur un site premium, casse le maillage SEO interne et fait fuir un prospect en phase de decision.
- **Recommandation :** Aligner les slugs des pricingPlans sur ceux des formations (ou creer les pages detail correspondantes), et corriger le libelle Conduite supervisee qui pointe vers perfectionnement. Ajouter un test qui verifie que chaque href interne du Header/Footer/cards resout en 200.
- **Fichiers :** `data/site.ts:245`, `data/site.ts:263`, `data/site.ts:272`, `components/HeaderMain.tsx:44`, `components/PricingCard.tsx:18`
- **Vérifié :** test curl: /formations/permis-b -> 404, /formations/boite-automatique -> 404, /formations/pack-cpf -> 404, /formations/permis-b-manuel -> 200 ; lecture data/site.ts:159-278 et HeaderMain.tsx:44-49

#### 🟠 `UX-02` Tunnel de paiement: mur de connexion avant toute valeur percue
**Sévérité :** P1 · **Effort :** L

- **Problème :** Depuis l'accueil ou /tarifs, Choisir ce pack renvoie vers /paiement?plan=... (PricingCard.tsx:18). Or PaymentIntentForm sonde /api/auth/me au montage (PaymentIntentForm.tsx:65) et, en l'absence de session, affiche immediatement l'ecran Compte eleve requis (PaymentIntentForm.tsx:160-172) sans jamais montrer le pack choisi, son prix, ni un recapitulatif. Test curl confirme: POST /api/payments/payment-intents sans auth -> 401.
- **Impact :** Le prospect clique sur un pack avec une intention d'achat forte et se heurte a un mur d'inscription/connexion sans rien voir de ce qu'il allait payer. C'est la rupture de conversion la plus couteuse du parcours: abandon probable a l'etape la plus chaude.
- **Recommandation :** Afficher le recapitulatif du pack (titre, prix, features) AVANT le gate d'auth, puis proposer Continuer qui ouvre connexion/inscription en conservant le plan en query. Idealement autoriser une reservation/devis invite (email seul) et creer le compte au moment du paiement reel. Mettre un fil de progression (Pack -> Compte -> Paiement).
- **Fichiers :** `components/PaymentIntentForm.tsx:59`, `components/PaymentIntentForm.tsx:160`, `components/PricingCard.tsx:18`
- **Vérifié :** lecture PaymentIntentForm.tsx:59-173 (probe /api/auth/me -> status anonymous avant tout recap) ; test curl POST /api/payments/payment-intents sans cookie -> 401

#### 🟠 `UX-03` Perimetre metier VTC et CACES totalement absent du site
**Sévérité :** P1 · **Effort :** XL

- **Problème :** Le perimetre annonce inclut auto-ecole + centre CACES + centre VTC + formations pro, mais une recherche grep insensible a la casse sur app/, data/, components/ ne retourne AUCUNE occurrence de vtc ni caces. Les slugs de formations (data/site.ts:159-240) ne couvrent que le permis B / code / perfectionnement.
- **Impact :** Un prospect VTC ou une entreprise cherchant un CACES ne trouve rien: aucune page, aucun formulaire dedie, aucun item de menu. Le site ne peut pas devenir la reference locale multi-activites promise et perd l'integralite de ces segments a forte valeur.
- **Recommandation :** Creer des poles dedies (pages /vtc, /caces et formations associees), avec leur propre hero, FAQ, et un formulaire de devis pro distinct du diagnostic permis (besoins B2B: financement OPCO, sessions groupees, dates). Ajouter ces poles a la navigation principale.
- **Fichiers :** `data/site.ts:159`, `components/HeaderMain.tsx:38`
- **Vérifié :** grep -riE vtc/caces sur app/ data/ components/ -> AUCUNE occurrence ; lecture data/site.ts:159-240 (catalogue uniquement permis/code)

#### 🟠 `UX-04` Incoherence de marque LODEN vs LODENE
**Sévérité :** P1 · **Effort :** S

- **Problème :** Le nom officiel est LODEN Auto-Ecole (layout.tsx:14, Footer.tsx:17) mais le logo Header affiche LODENE (HeaderMain.tsx:98), le hero d'accueil affiche LODENE en gros (HeroSection.tsx:68), l'assistant IA se presente comme l'assistant LODENE (AiChatWidget.tsx:10,62) et les commentaires de code parlent de charte LODENE (FormationCard.tsx:23). Deux orthographes coexistent sur la meme page.
- **Impact :** Sur un site qui vise le positionnement premium et la reference locale, voir deux noms differents (dont un dans le H1 d'accueil et l'autre dans le footer/title) sape la credibilite et brouille la memorisation de la marque et le SEO de marque.
- **Recommandation :** Trancher sur l'orthographe officielle (probablement LODEN d'apres le domaine loden-autoecole.fr et le titre) et l'appliquer partout: logo, hero, assistant IA, commentaires. Si LODENE est un choix typographique du logo, le documenter et ne pas le melanger avec le texte courant.
- **Fichiers :** `components/HeaderMain.tsx:98`, `components/HeroSection.tsx:68`, `components/AiChatWidget.tsx:10`, `app/layout.tsx:14`
- **Vérifié :** lecture HeaderMain.tsx:98 (LODENE), HeroSection.tsx:57-69 (aria-label LODENE + texte LODENE), AiChatWidget.tsx:10,62 (assistant LODENE), layout.tsx:14 + Footer.tsx:17 (LODEN Auto-Ecole)

#### 🟡 `UX-05` Aucun fil d'ariane sur l'ensemble du site
**Sévérité :** P2 · **Effort :** M

- **Problème :** Recherche grep Breadcrumb/fil d'ariane/BreadcrumbList sur components/ et app/ -> aucun resultat. Les pages profondes comme /formations/[slug] (app/formations/[slug]/page.tsx) n'offrent aucun chemin de retour visuel vers /formations ni vers l'accueil, hormis le Header.
- **Impact :** L'utilisateur perd le repere ou suis-je dans l'arborescence, surtout sur les pages de detail formation et les landings SEO. Manque aussi le balisage BreadcrumbList (schema.org) qui aide le SEO en rich results.
- **Recommandation :** Ajouter un composant Breadcrumb reutilisable (Accueil > Formations > Permis B) sur toutes les pages de niveau 2+, avec JSON-LD BreadcrumbList. Le rendre coherent avec la charte.
- **Fichiers :** `app/formations/[slug]/page.tsx:72`
- **Vérifié :** grep -rln Breadcrumb/BreadcrumbList components/ app/ -> AUCUN resultat ; lecture app/formations/[slug]/page.tsx (aucun retour vers la liste)

#### 🟡 `UX-06` CTA Demander un devis sans contexte de la formation choisie
**Sévérité :** P2 · **Effort :** M

- **Problème :** Sur la page detail formation, les deux CTA pointent vers /contact#demande et /inscription en dur (app/formations/[slug]/page.tsx:98,105). ContactForm et StudentRegistrationForm ne lisent aucun parametre de query: StudentRegistrationForm n'utilise pas useSearchParams (verifie), donc la formation que l'utilisateur consultait n'est jamais pre-selectionnee.
- **Impact :** L'utilisateur re-selectionne manuellement la formation qu'il vient de quitter, ce qui ajoute de la friction et un risque d'incoherence. Perte du contexte = perte de conversion sur la transition page produit -> formulaire.
- **Recommandation :** Propager le slug en query (/contact?besoin=permis-b-manuel, /inscription?formation=...) et lire le parametre dans ContactForm/StudentRegistrationForm/CpfRequestForm pour pre-remplir le select. Afficher un rappel visuel Demande pour: Permis B manuel en tete de formulaire.
- **Fichiers :** `app/formations/[slug]/page.tsx:96`, `components/StudentRegistrationForm.tsx:43`, `components/ContactForm.tsx:24`
- **Vérifié :** lecture app/formations/[slug]/page.tsx:96-110 (href en dur) ; grep useSearchParams dans StudentRegistrationForm.tsx -> aucun (NO preselect support)

#### 🟡 `UX-07` Formulaire de diagnostic trop long: 8 champs obligatoires
**Sévérité :** P2 · **Effort :** M

- **Problème :** ContactForm impose 8 champs tous requis: nom, email, telephone, besoin, financement, disponibilites, delai, contact prefere, ET un message de 10 caracteres minimum (ContactForm.tsx:10-20). Le PageHero de la page contact promet pourtant demarrer simplement.
- **Impact :** Pour un simple rappelez-moi, remplir 8 champs + un message libre est dissuasif sur mobile. La longueur percue augmente l'abandon, surtout en haut de tunnel ou l'engagement est faible.
- **Recommandation :** Proposer un mode court par defaut (nom, telephone, besoin) avec les autres champs optionnels/replies, ou un toggle Rappel express vs Diagnostic complet. Rendre le message optionnel ou abaisser le minimum. Indiquer le temps estime (30 secondes).
- **Fichiers :** `components/ContactForm.tsx:10`
- **Vérifié :** lecture ContactForm.tsx:10-20 (9 champs requis dont message min 10) et 95-154 (tous rendus)

#### 🟡 `UX-08` Deux boutons flottants superposes en bas a droite (WhatsApp + IA)
**Sévérité :** P2 · **Effort :** M

- **Problème :** Le layout monte FloatingWhatsappButton (fixed bottom-5 right-5, z-30, FloatingWhatsappButton.tsx:8) ET le bouton de l'AiChatWidget (fixed bottom-24 right-5, z-30, AiChatWidget.tsx:116) avec des icones MessageCircle/Sparkles dans la couleur de marque. Les deux sont empiles verticalement au meme endroit.
- **Impact :** Confusion: deux pastilles turquoise au meme coin, l'utilisateur ne sait pas laquelle est le chat humain (WhatsApp) et laquelle est l'IA. Sur petit mobile, elles encombrent la zone de pouce et peuvent masquer le contenu/CTA en bas de page.
- **Recommandation :** Fusionner en un seul speed-dial (un bouton principal qui deploie WhatsApp + Assistant IA), avec icones et libelles distincts. Decaler le WhatsApp a gauche si on garde deux boutons, et differencier nettement les couleurs/icones (vert WhatsApp officiel vs turquoise IA).
- **Fichiers :** `components/FloatingWhatsappButton.tsx:6`, `components/AiChatWidget.tsx:113`, `app/layout.tsx:88`
- **Vérifié :** lecture FloatingWhatsappButton.tsx (bottom-5 right-5 z-30) + AiChatWidget.tsx:116 (bottom-24 right-5 z-30) + layout.tsx:88-89 (les deux montes)

#### 🟡 `UX-09` Aucun etat de chargement de route (loading.tsx absent)
**Sévérité :** P2 · **Effort :** M

- **Problème :** find app -name loading.tsx -> aucun fichier. Les pages serveur comme /cpf (await getFaqEntries, cpf/page.tsx:14-15) ou /formations n'ont pas de squelette de chargement; seul /paiement a un Suspense local (paiement/page.tsx:23). En navigation, l'utilisateur n'a aucun feedback pendant le chargement de page.
- **Impact :** Sur connexion lente ou quand le backend est sollicite, la transition entre pages parait figee (rien ne change pendant le fetch), ce qui degrade la perception de rapidite d'un site qui se veut premium.
- **Recommandation :** Ajouter des loading.tsx avec squelettes (PageHero + grille de cartes en skeleton) pour /formations, /cpf, /tarifs, /espace-eleve, /admin. Reutiliser un composant Skeleton coherent avec la charte.
- **Fichiers :** `app/cpf/page.tsx:14`, `app/formations/page.tsx:10`
- **Vérifié :** find app -name loading.tsx -> aucun resultat ; lecture cpf/page.tsx:14 (await getFaqEntries sans loading.tsx) ; seul paiement/page.tsx:23 a un Suspense

#### 🟡 `UX-10` BookingCalendar: reservation impossible pour un anonyme, message tardif et formation par defaut hasardeuse
**Sévérité :** P2 · **Effort :** M

- **Problème :** Le calendrier d'accueil laisse choisir jour/creneau/point RDV puis, au clic Reserver, appelle /api/students/me; si 401 il affiche seulement alors Connecte-toi a ton espace eleve (BookingCalendar.tsx:146-150). De plus, en fallback il force formationId formation-permis-b-manuel en dur (BookingCalendar.tsx:159) meme si l'eleve suit une autre formation. Test curl: /api/students/me sans auth -> 401, /api/bookings/slots -> 200.
- **Impact :** L'utilisateur investit du temps a composer sa reservation avant d'apprendre qu'il doit se connecter (effort gache = frustration). Le fallback de formation peut creer une reservation rattachee a la mauvaise formation.
- **Recommandation :** Indiquer des l'affichage du calendrier que la reservation necessite un compte (badge Connexion requise pour confirmer) et proposer un CTA connexion/inscription contextualise conservant le creneau choisi. Ne pas reserver avec un formationId par defaut si le profil n'en a pas: bloquer et orienter vers le choix de formation.
- **Fichiers :** `components/BookingCalendar.tsx:146`, `components/BookingCalendar.tsx:159`
- **Vérifié :** lecture BookingCalendar.tsx:134-188 (gate 401 seulement au submit, formationId fallback en dur) ; test curl /api/students/me -> 401, /api/bookings/slots -> 200

#### 🟡 `UX-11` Inscription: mot de passe 10 caracteres + confirmation des la 1ere etape
**Sévérité :** P2 · **Effort :** M

- **Problème :** StudentRegistrationForm exige password min 10 caracteres et confirmation (StudentRegistrationForm.tsx:28-34) en plus de prenom/nom/email/telephone/formation, le tout sur un seul ecran. Aucun indicateur de force de mot de passe ni de toggle afficher.
- **Impact :** Demander un mot de passe robuste + confirmation des le premier contact alourdit l'inscription d'un prospect qui n'a pas encore decide. Sans jauge ni affichage du mot de passe, le taux d'erreur de saisie augmente, donc l'abandon.
- **Recommandation :** Ajouter un bouton afficher le mot de passe et une jauge de robustesse, expliquer la regle des 10 caracteres sous le champ. Envisager un parcours en 2 temps: creer le compte avec email + mot de passe seulement, completer le profil ensuite.
- **Fichiers :** `components/StudentRegistrationForm.tsx:28`, `components/StudentRegistrationForm.tsx:135`
- **Vérifié :** lecture StudentRegistrationForm.tsx:21-34 (min 10 + confirm) et 135-142 (deux champs password sans toggle ni jauge)

#### 🟡 `UX-12` Desynchronisation des listes de formations entre menu, formulaires et catalogue
**Sévérité :** P2 · **Effort :** M

- **Problème :** Sources divergentes pour les formations: catalogue data/site.ts (8 formations dont stage-code, conduite-accompagnee, code-en-ligne), select d'inscription (StudentRegistrationForm.tsx:10-19, 8 options dont Annulation permis mais sans conduite-accompagnee), menu Header (6 items dont Conduite supervisee pointant vers perfectionnement), CpfRequestForm (4 formations seulement, CpfRequestForm.tsx:10-15). Les ensembles ne coincident pas.
- **Impact :** L'utilisateur voit des offres differentes selon l'endroit (menu vs formulaire vs page liste), ce qui brouille la comprehension de l'offre reelle et cree des incoherences (une formation visible dans le menu mais absente du formulaire d'inscription).
- **Recommandation :** Centraliser une source unique de verite (le catalogue, idealement via l'API /api/formations deja consommee par FormationExplorer) et deriver les options des selects et du menu depuis cette source. Eviter les listes codees en dur divergentes.
- **Fichiers :** `components/StudentRegistrationForm.tsx:10`, `components/CpfRequestForm.tsx:10`, `components/HeaderMain.tsx:44`, `data/site.ts:159`
- **Vérifié :** lecture comparee: data/site.ts:159-240 (8), StudentRegistrationForm.tsx:10-19 (8), CpfRequestForm.tsx:10-15 (4), HeaderMain.tsx:44-49 (6) -> ensembles non alignes

#### 🟡 `UX-13` Espace eleve: libelles techniques bruts exposes a l'utilisateur
**Sévérité :** P2 · **Effort :** M

- **Problème :** StudentDashboard affiche formationId tel quel (formation-permis-b-manuel) en valeur de metrique (StudentDashboard.tsx:156) au lieu d'un libelle lisible, et formate les statuts par un simple toLowerCase().replaceAll (StudentDashboard.tsx:253-259) -> rend des enums bruts non traduits. La PaymentIntentForm fait pareil (formatPaymentStatus, PaymentIntentForm.tsx:268).
- **Impact :** L'eleve voit des identifiants techniques (slug avec prefixe formation-) et des statuts anglicises au lieu de libelles metier francais clairs, ce qui degrade la perception de qualite de l'espace personnel et peut inquieter.
- **Recommandation :** Mapper formationId vers le titre via les mappers existants (lib/catalog-mappers) et creer un dictionnaire de traduction des statuts (NOUVEAU -> Nouveau dossier, PENDING -> En attente de confirmation, etc.) reutilise partout. Ne jamais afficher un id brut.
- **Fichiers :** `components/StudentDashboard.tsx:156`, `components/StudentDashboard.tsx:253`, `components/PaymentIntentForm.tsx:268`
- **Vérifié :** lecture StudentDashboard.tsx:156 (value=student.formationId) et 253-259 (formatage generique des enums) ; PaymentIntentForm.tsx:268-270

#### 🔵 `UX-14` Hero d'accueil Je m'inscris sans formation choisie en amont
**Sévérité :** P3 · **Effort :** S

- **Problème :** Le CTA principal du hero envoie directement vers /inscription (HeroSection.tsx:78) ou il faut choisir une formation dans un select, alors qu'aucune decouverte de l'offre n'a eu lieu. Le deuxieme CTA Nos formations est en secondaire (variant outline).
- **Impact :** Pousser Je m'inscris en CTA primaire des le hero demande un engagement fort (creer un compte + mot de passe) a un visiteur qui n'a encore rien vu de l'offre, ce qui peut reduire le taux de clic utile au profit d'un parcours de decouverte.
- **Recommandation :** Tester une hierarchie ou le CTA primaire mene a la decouverte/diagnostic (Trouver ma formation / Etre rappele) et le secondaire a l'inscription, ou ajouter un micro-CTA Estimer mon tarif vers le simulateur.
- **Fichiers :** `components/HeroSection.tsx:76`
- **Vérifié :** lecture HeroSection.tsx:76-91 (CTA primaire /inscription, secondaire /formations) et app/page.tsx:48 (section reservation plus bas)

#### 🔵 `UX-15` Statut de paiement mock affiche sans pedagogie claire cote utilisateur
**Sévérité :** P3 · **Effort :** M

- **Problème :** La page paiement annonce intention Stripe mockee, sans saisie de carte ni debit reel (PaymentIntentForm.tsx:179, 227-237) et apres creation affiche Intention creee, Reference: ... (PaymentIntentForm.tsx:239-248). Il n'existe aucun package stripe (contexte projet), donc aucun vrai paiement n'est possible.
- **Impact :** Pour un visiteur reel, un paiement qui ne debite rien et affiche une reference technique est deroutant: il ne sait pas si sa place est reservee, s'il doit payer ailleurs, ni quelle est la prochaine etape concrete.
- **Recommandation :** Tant que Stripe n'est pas branche, requalifier l'ecran en Demande de reservation de pack / pre-paiement avec une etape suivante explicite (un conseiller vous envoie le lien de paiement securise). Quand Stripe sera integre, remplacer par un vrai checkout avec confirmation et recu. Masquer la reference technique.
- **Fichiers :** `components/PaymentIntentForm.tsx:175`, `components/PaymentIntentForm.tsx:239`
- **Vérifié :** lecture PaymentIntentForm.tsx:175-249 (mode mock, reference technique affichee) ; contexte projet: aucun package stripe

#### 🔵 `UX-16` FAQ referencee dans le menu via une ancre fragile (/cpf#faq)
**Sévérité :** P3 · **Effort :** S

- **Problème :** Le menu Decouvrir pointe la FAQ vers /cpf#faq (HeaderMain.tsx:70), mais la page CPF ne declare pas de section id=faq visible: la FaqSection est rendue (cpf/page.tsx:49) sans qu'on ait verifie qu'elle porte l'ancre faq. Le footer pointe egalement la FAQ via la meme logique d'ancre.
- **Impact :** Si l'ancre #faq n'existe pas dans FaqSection, le clic depuis le menu n'amene pas l'utilisateur a la FAQ (scroll inoperant), creant une attente non satisfaite. La FAQ meriterait par ailleurs une page dediee pour le SEO et l'acces direct.
- **Recommandation :** Verifier/garantir que FaqSection rend bien un id=faq avec scroll-mt, ou creer une page /faq autonome listee dans le menu et le footer. Tester chaque ancre du menu.
- **Fichiers :** `components/HeaderMain.tsx:70`, `app/cpf/page.tsx:49`
- **Vérifié :** lecture HeaderMain.tsx:70 (href /cpf#faq) et cpf/page.tsx:49 (FaqSection sans wrapper id visible) -- ancre a confirmer dans FaqSection

</details>

---

### UI Designer

_12 findings — 🔴 0 · 🟠 4 · 🟡 5 · 🔵 3_

Le socle visuel est honnête et cohérent dans sa structure : palette turquoise dérivée correctement en échelle (loden-50→900), composants cartes/sections soignés (ombres premium, rayons généreux, hover-lift élégant), grilles responsive propres et PageHero réutilisé sur toutes les pages secondaires. Mais plusieurs défauts graves cassent la promesse premium et professionnelle. (1) Identité de marque incohérente : le logo, le hero et l'assistant affichent "LODENE" alors que le Cahier des charges, le footer et les métadonnées disent "LODEN" — faute de marque visible en H1. (2) La typographie de marque (Inter) déclarée dans tailwind/globals.css n'est JAMAIS chargée : 0 @font-face, aucun next/font Inter — tout le corps du site rend en police système, ce qui fait perdre la cohérence typographique premium. (3) Le hero empile trois polices décoratives manuscrites (Great Vibes + Allura + Permanent Marker) qui jurent avec une charte "premium, claire, professionnelle" et donnent un rendu artisanal peu rassurant pour un centre de formation. (4) La couleur de marque #08AEB8 a un contraste de 2.71:1 sur blanc (échec WCAG AA), réutilisée telle quelle sur le bouton de l'assistant IA (texte blanc sur #08AEB8 = 2.71). (5) Aucun composant Button mutualisé : 8+ variantes de padding pour le bouton primaire, 4 rayons de carte différents. Aucune photographie réelle (moniteurs/avis en initiales+dégradés), un seul asset image non optimisé, aucune identité visuelle VTC/CACES alors que le périmètre métier les annonce. Le rendu reste moderne mais pas encore "référence locale".

**Priorités de la dimension :**
- UI-01 (P1) — Corriger immédiatement la faute de marque "LODENE"->"LODEN" sur le logo, le H1 d'accueil et l'assistant (effort S, visible par tous, charte-compliance).
- UI-02 (P1) — Charger réellement Inter via next/font : la police de marque déclarée n'est jamais servie, tout le site rend en police système (effort S, gain immédiat).
- UI-03 (P1) — Refondre la typographie du hero : remplacer les 3 polices manuscrites/feutre par une typo premium maîtrisée alignée sur la charte turquoise/blanc.
- UI-04 (P1) — Régler le contraste : #08AEB8 échoue WCAG (2.71:1) ; repasser le bouton de l'assistant IA et les icônes fonctionnelles sur loden-700, réserver #08AEB8 au décoratif.
- UI-05 (P2) — Créer un système de composants (Button/Card/Input) pour supprimer les 8+ variantes de bouton et harmoniser les rayons (UI-06) vers un rendu cohérent et premium.

<details><summary>Voir les 12 findings détaillés</summary>

#### 🟠 `UI-01` Nom de marque incohérent : "LODENE" affiché au lieu de "LODEN" (logo + hero + assistant)
**Sévérité :** P1 · **Effort :** S · **Catégorie :** Identité de marque / cohérence

- **Problème :** Le H1 d'accueil rend "Passe ton permis / avec / LODENE" en gros (HeroSection.tsx:68, aria-label:58, alt:113), le logo du header affiche "LODENE" (HeaderMain.tsx:97-98) et l'assistant IA se présente comme "Assistant LODENE" (AiChatWidget.tsx:10,62). Or la marque officielle est "LODEN" : Cahier_Des_Charges_LODEN_Frontend.md ligne 13 ("Nom : LODEN Auto-École") et ligne 68 ("Passe ton permis avec LODEN"), confirmé par le Footer.tsx:17 ("LODEN Auto-École") et app/layout.tsx:13-31 (métadonnées title/openGraph = "LODEN"). Le site affiche donc deux orthographes de marque selon l'endroit.
- **Impact :** Faute de marque sur l'élément le plus visible (H1 + logo). Décrédibilise immédiatement, nuit à la confiance/au caractère rassurant attendu d'une auto-école, et brouille le SEO de marque (le titre de page dit LODEN, le contenu visible dit LODENE).
- **Recommandation :** Remplacer toutes les occurrences "LODENE" par "LODEN" dans HeaderMain.tsx:97, HeroSection.tsx:58/68/113, AiChatWidget.tsx:10/62 (et corriger les commentaires PricingCard/InstructorCard/FormationCard). Centraliser le nom de marque dans data/site.ts pour éviter toute divergence future.
- **Fichiers :** `components/HeaderMain.tsx:97-98`, `components/HeroSection.tsx:58`, `components/HeroSection.tsx:68`, `components/HeroSection.tsx:113`, `components/AiChatWidget.tsx:10`, `components/AiChatWidget.tsx:62`, `Cahier_Des_Charges_LODEN_Frontend.md:13`
- **Vérifié :** Lecture code: grep "LODENE" -> 9 occurrences dans 6 composants (HeaderMain.tsx:97, HeroSection.tsx:58/68/113, AiChatWidget.tsx:10/62) ; confronté à Cahier_Des_Charges ligne 13/68, Footer.tsx:17 et layout.tsx:13 qui disent "LODEN".

#### 🟠 `UI-02` La police de marque Inter est déclarée mais jamais chargée — tout le site rend en police système
**Sévérité :** P1 · **Effort :** S · **Catégorie :** Typographie

- **Problème :** tailwind.config.ts:37-39 et globals.css:23 déclarent font-family "Inter" comme police par défaut, mais Inter n'est importé nulle part : aucun next/font/google Inter dans app/layout.tsx, et 0 @font-face servi (vérifié sur le CSS bundle live). Seuls les 3 woff2 servis correspondent aux polices décoratives du hero. Le navigateur applique donc le premier fallback (ui-sans-serif / police système) sur 100% du corps du site.
- **Impact :** Le rendu typographique varie selon l'OS de l'utilisateur (San Francisco sur Mac, Segoe sur Windows, Roboto sur Android) : perte totale de cohérence typographique, kerning/graisse non maîtrisés, rendu "générique" loin de la promesse premium. Aucun contrôle sur le look & feel principal du texte.
- **Recommandation :** Charger Inter via next/font/google dans app/layout.tsx (import { Inter }, subsets latin, display swap, variable --font-inter) et exposer la variable sur <html className>, puis pointer tailwind sur var(--font-inter). Cela garantit l'auto-hébergement, le swap et la cohérence cross-OS. Effort minime, gain visuel immédiat sur tout le site.
- **Fichiers :** `tailwind.config.ts:37-39`, `app/globals.css:23`, `app/layout.tsx:1-9`
- **Vérifié :** Test live: curl du CSS bundle /_next/static/css/app/layout.css -> 0 @font-face, font-family:Inter présent mais sans définition ; grep "next/font/google" -> seul HeroSection.tsx importe (Allura/Great_Vibes/Permanent_Marker), pas Inter ; les 3 woff2 servis sont les polices décoratives.

#### 🟠 `UI-03` Hero : trois polices manuscrites décoratives empilées, en rupture avec la charte premium
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Typographie / direction artistique

- **Problème :** Le H1 d'accueil compose le slogan avec 3 polices Google différentes : Great Vibes (script calligraphique) pour "Passe ton permis", Allura (script) pour "avec", Permanent Marker (feutre type graffiti) pour "LODENE" (HeroSection.tsx:7-23, 61-69), avec un bleu non-charte #087f92 (ligne 61). Le Cahier des charges demande un design "premium, clair, blanc, turquoise et très professionnel" (ligne 5).
- **Impact :** Mélange manuscrit/feutre qui évoque l'amateur/scrapbook plutôt qu'un centre de formation sérieux et rassurant. Trois familles décoratives = chargement de 3 woff2 supplémentaires (impact perf/LCP du H1) et hiérarchie typographique illisible. C'est l'élément above-the-fold le plus impactant pour la première impression.
- **Recommandation :** Repenser le hero avec une typographie premium maîtrisée : un titre fort en Inter/serif display unique (max 1 police d'accent), graisse contrastée, et la couleur turquoise charte (loden-700 #0e7490 pour contraste). Garder éventuellement UN seul accent script discret, jamais trois. Aligner sur le slogan officiel "Passe ton permis avec LODEN".
- **Fichiers :** `components/HeroSection.tsx:3-23`, `components/HeroSection.tsx:57-70`, `Cahier_Des_Charges_LODEN_Frontend.md:5`
- **Vérifié :** Lecture code HeroSection.tsx:3 (import 3 polices), :61-69 (3 className distinctes + couleur #087f92 hors palette) ; confronté à Cahier_Des_Charges ligne 5 (charte premium/pro).

#### 🟠 `UI-04` La couleur de marque #08AEB8 échoue le contraste WCAG ; le bouton de l'assistant IA est sous le seuil
**Sévérité :** P1 · **Effort :** S · **Catégorie :** Accessibilité / couleur

- **Problème :** Le turquoise de marque loden-500 #08AEB8 a un ratio de contraste de 2.71:1 sur blanc — échec WCAG AA pour le texte (4.5) ET pour les composants UI/grands textes (3.0). Il est utilisé en aplat sur le bouton flottant de l'assistant IA avec une icône blanche (AiChatWidget.tsx:116, bg-loden-500 text-white = 2.71:1) et pour de nombreuses icônes d'accent (FormationCard, SimulatorCard, Footer…). Le reste du site contourne le problème en utilisant loden-700 #0e7490 (5.36:1) pour les vrais boutons/textes.
- **Impact :** L'icône du widget IA (élément interactif majeur) est sous le seuil de perception pour les malvoyants ; les icônes d'accent turquoise clair sur blanc sont peu lisibles. Risque de non-conformité RGAA/accessibilité, pénalisant pour un service public-facing (CPF, formation pro).
- **Recommandation :** Réserver #08AEB8 aux usages décoratifs/dégradés (jamais comme couleur de texte ni d'icône sur blanc seul). Pour les boutons et icônes fonctionnels, utiliser loden-600/700. Repasser le bouton AiChatWidget sur bg-loden-700 (cohérent avec WhatsApp et tous les CTA primaires). Définir une règle de palette : turquoise marque = accent visuel, turquoise foncé = interactif.
- **Fichiers :** `components/AiChatWidget.tsx:116`, `tailwind.config.ts:18`, `components/FormationCard.tsx:93`
- **Vérifié :** Calcul WCAG (formule luminance relative): #08AEB8 sur #ffffff = 2.71:1 ; white sur #08AEB8 = 2.71:1 ; loden-700 #0e7490 sur blanc = 5.36:1. Usage confirmé AiChatWidget.tsx:116 (bg-loden-500 text-white).

#### 🟡 `UI-05` Aucun composant Button/primitive UI mutualisé — 8+ variantes de taille pour le même bouton primaire
**Sévérité :** P2 · **Effort :** L · **Catégorie :** Système de composants / cohérence

- **Problème :** Il n'existe aucun dossier components/ui ni composant Button partagé (vérifié : grep export Button = aucun). Le bouton primaire turquoise est recopié à la main partout avec des paddings divergents : px-7 py-3.5 (HeroSection), px-6 py-4 (ContactForm/LoginForm), px-6 py-3, px-5 py-3, px-7 py-4, px-5 py-4, px-4 py-3 — soit 8+ combinaisons pour un même rôle.
- **Impact :** Tailles de boutons incohérentes d'une page à l'autre (un même CTA n'a pas la même hauteur), maintenance lourde (changer l'état hover/disabled = éditer ~20 fichiers), et risque d'oubli des états focus/disabled. Frein direct à une UI "premium cohérente".
- **Recommandation :** Créer components/ui/Button.tsx (variantes primary/secondary/ghost, tailles sm/md/lg, états hover/focus-visible/disabled centralisés via cn()) et l'adopter dans HeroSection, ContactForm, LoginForm, PageHero, PricingCard, CTA d'accueil. Idem pour Card, Badge, Input. Réduit la dette et garantit la cohérence.
- **Fichiers :** `components/HeroSection.tsx:79`, `components/ContactForm.tsx:158`, `components/LoginForm.tsx:74`, `components/PageHero.tsx:26`, `components/PricingCard.tsx:63`
- **Vérifié :** Lecture: ls components/ui -> inexistant ; grep "export function Button" -> aucun ; grep des classes -> 8 combinaisons distinctes de padding pour rounded-full bg-loden-700.

#### 🟡 `UI-06` Échelle de rayons de carte incohérente : 4 valeurs différentes (1.25 / 1.5 / 1.75 / 2 rem)
**Sévérité :** P2 · **Effort :** M · **Catégorie :** Design tokens / cohérence

- **Problème :** tailwind.config.ts:35 override rounded-2xl à 1.25rem, mais les cartes mélangent des rayons arbitraires : FormationCard et PricingCard en rounded-[1.75rem], TestimonialCard/FeatureBar/FaqSection/LoginForm en rounded-3xl (1.5rem), dropdown header et AppSection en rounded-[2rem], champs en rounded-2xl (1.25rem). Quatre rayons de conteneur coexistent sans système.
- **Impact :** Manque d'harmonie visuelle entre cartes côte à côte (page d'accueil affiche FormationCard 1.75rem puis PricingCard 1.75rem puis TestimonialCard 1.5rem) : l'œil perçoit une légère incohérence qui érode la sensation de soin/premium.
- **Recommandation :** Définir une échelle de rayons tokenisée (ex: card=1.5rem, card-lg=1.75rem, pill=full, input=1rem) dans tailwind.config.ts et l'appliquer uniformément. Supprimer les valeurs arbitraires rounded-[...] au profit de tokens nommés.
- **Fichiers :** `tailwind.config.ts:34-36`, `components/FormationCard.tsx:52`, `components/PricingCard.tsx:24`, `components/TestimonialCard.tsx:14`
- **Vérifié :** Lecture tailwind.config.ts:34-36 (2xl=1.25rem) ; grep des rayons: rounded-3xl x62, rounded-2xl x83, rounded-[1.75rem] x9, rounded-[2rem] x3 ; comparaison FormationCard.tsx:52 vs TestimonialCard.tsx:14.

#### 🟡 `UI-07` Aucune photographie réelle : moniteurs et avis en initiales+dégradés, un seul asset image
**Sévérité :** P2 · **Effort :** L · **Catégorie :** Imagerie / crédibilité

- **Problème :** Le site n'a qu'UN seul fichier image (public/loden-hero.jpg). Les moniteurs sont rendus par initiales sur dégradé (InstructorCard.tsx:39-44, data/site.ts initials "SB/ML/ND"), les avis n'ont pas de visage, les formations utilisent des dégradés+icônes Lucide (FormationCard.tsx:54-74). Aucune photo de locaux, de véhicules, d'équipe.
- **Impact :** Pour une auto-école/centre de formation, l'absence totale de visages humains et de photos réelles réduit fortement la confiance et le caractère rassurant (le client veut voir l'équipe, les locaux, les voitures). Le rendu "avatars génériques" fait template/démo, pas "référence locale".
- **Recommandation :** Intégrer des photos réelles optimisées (équipe, agences, véhicules) via next/image avec sizes/quality, et de vraies photos d'élèves/avis (ou portraits stylisés cohérents). Prévoir un champ photoUrl sur instructors/testimonials. Conserver les dégradés comme fallback uniquement.
- **Fichiers :** `public/loden-hero.jpg`, `components/InstructorCard.tsx:39-44`, `data/site.ts:306-345`
- **Vérifié :** Lecture: ls public -> seul loden-hero.jpg + favicon.svg ; InstructorCard.tsx:39-44 (initiales) ; data/site.ts:310-324 (initials, pas de src/photo) ; grep next/image -> seul HeroSection l'utilise.

#### 🟡 `UI-08` Image hero non optimisée (JPEG 200KB, pas de webp/avif, pas de placeholder), seule image du site
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Performance image / format

- **Problème :** public/loden-hero.jpg = JPEG baseline 1400x747, 200KB. Servie via next/image (HeroSection.tsx:39-46 et 111-118) sans quality= ni placeholder="blur"/blurDataURL. Aucune version webp/avif source (next/image transcode à la volée mais la source reste un JPEG lourd). Le hero est rendu DEUX fois (desktop + mobile) avec deux <Image priority>.
- **Impact :** LCP plus élevé que nécessaire sur l'image above-the-fold ; pas de blur-up donc flash de zone vide au chargement. Le double rendu desktop/mobile charge potentiellement l'image deux fois si le CSS ne masque pas assez tôt.
- **Recommandation :** Fournir l'asset en AVIF/WebP optimisé, ajouter placeholder="blur" + blurDataURL, calibrer quality (75-80) et vérifier que les deux Image ne se chargent pas simultanément (un seul priority). Activer formats AVIF dans next.config (images.formats).
- **Fichiers :** `public/loden-hero.jpg`, `components/HeroSection.tsx:39-46`, `components/HeroSection.tsx:111-118`, `next.config.mjs:28-33`
- **Vérifié :** file public/loden-hero.jpg -> JPEG 1400x747 ; ls -lh -> 200KB ; grep quality=/placeholder= -> aucun sur les <Image> ; HeroSection.tsx:39 et :111 (deux Image priority).

#### 🟡 `UI-09` Aucune identité visuelle VTC ni CACES alors que le périmètre métier les annonce
**Sévérité :** P2 · **Effort :** L · **Catégorie :** Cohérence métier / système visuel

- **Problème :** Le périmètre annoncé couvre auto-école + centre CACES + centre VTC + formations pro, mais le système visuel (FormationCard BY_SLUG, PricingCard VISUALS, navigation HeaderMain) ne contient AUCUNE icône, dégradé ou entrée de menu VTC/CACES. La nav Formations liste uniquement permis B/auto/conduite accompagnée/accéléré/code (HeaderMain.tsx:43-50).
- **Impact :** Décalage visible entre la promesse ("centre de formation pluri-métiers") et l'UI (uniquement auto-école permis B). Un visiteur cherchant VTC/CACES ne trouve aucun repère visuel ni d'entrée, ce qui plafonne la conversion sur ces segments et la crédibilité "référence locale multi-métiers".
- **Recommandation :** Étendre le système visuel : icônes/dégradés dédiés VTC et CACES dans FormationCard.BY_SLUG et PricingCard.VISUALS, entrées de menu et pages de formation correspondantes, et différenciation visuelle claire des 3 pôles (auto-école / VTC / CACES) sur l'accueil. À cadrer avec l'équipe contenu (les slugs n'existent pas encore côté data).
- **Fichiers :** `components/HeaderMain.tsx:43-50`, `components/FormationCard.tsx:24-33`, `components/PricingCard.tsx:9-14`
- **Vérifié :** Lecture HeaderMain.tsx:43-50 (dropdown formations, aucun VTC/CACES) ; FormationCard.tsx:24-33 (BY_SLUG sans VTC/CACES) ; cohérent avec l'écart slugs annoncé dans le contexte projet.

#### 🔵 `UI-10` Deux boutons flottants turquoise empilés à droite (WhatsApp + Assistant IA) — densité et redondance
**Sévérité :** P3 · **Effort :** M · **Catégorie :** Layout mobile / densité

- **Problème :** FloatingWhatsappButton (fixed bottom-5 right-5, bg-loden-700, h-14, z-30) et le toggle AiChatWidget (fixed bottom-24 right-5, bg-loden-500, h-14, z-30) sont deux cercles turquoise empilés verticalement dans le même coin, avec ~1.25rem d'écart seulement. Deux teintes turquoise différentes (700 vs 500) côte à côte.
- **Impact :** Sur mobile, deux gros boutons flottants masquent le contenu bas de page et le coin tactile, créent une redondance de canaux de contact, et l'incohérence de teinte (700 vs 500) nuit à la cohérence. Risque de chevauchement avec le footer/contenu sur petits écrans.
- **Recommandation :** Regrouper les deux actions dans un seul FAB qui déplie (WhatsApp + Assistant), ou n'afficher qu'un bouton à la fois selon le contexte. Uniformiser la teinte (loden-700) et vérifier la zone safe-area mobile. Ajouter un décalage pour ne pas recouvrir les CTA de bas de page.
- **Fichiers :** `components/FloatingWhatsappButton.tsx:8`, `components/AiChatWidget.tsx:116`, `app/layout.tsx:88-89`
- **Vérifié :** Lecture FloatingWhatsappButton.tsx:8 (bottom-5 right-5 bg-loden-700 z-30) + AiChatWidget.tsx:116 (bottom-24 right-5 bg-loden-500 z-30) ; calcul: WA occupe 1.25→4.75rem, chat démarre à 6rem -> même colonne, écart 1.25rem, teintes différentes.

#### 🔵 `UI-11` Pas de dark mode ni de variables de thème — color-scheme verrouillé en light
**Sévérité :** P3 · **Effort :** XL · **Catégorie :** Theming

- **Problème :** globals.css:6 force color-scheme: light, 0 occurrence de variant dark: dans tout le code, et seules deux variables CSS (--background/--foreground) existent ; tout le reste est codé en classes Tailwind littérales. Aucune base de design tokens pour un thème sombre, notamment côté CRM/admin où le confort visuel prolongé compte.
- **Impact :** Pas de dark mode pour le CRM utilisé en continu par les équipes (fatigue visuelle), et impossibilité de proposer une préférence système. Non bloquant pour le site vitrine mais attendu d'un produit "moderne" et d'un cockpit pro.
- **Recommandation :** Optionnel/nice-to-have : poser une base de tokens CSS (couleurs sémantiques surface/text/border en variables) pour permettre un dark mode futur, prioritairement sur l'espace /admin. À traiter après la consolidation des composants UI (UI-05).
- **Fichiers :** `app/globals.css:5-9`, `tailwind.config.ts:9-41`
- **Vérifié :** Lecture globals.css:6 (color-scheme: light) ; grep "dark:" sur components/+app/ -> 0 occurrence ; seules --background/--foreground définies.

#### 🔵 `UI-12` État focus dépendant d'une classe utilitaire non systématique (.focus-ring) — risque d'éléments sans anneau de focus
**Sévérité :** P3 · **Effort :** S · **Catégorie :** Accessibilité / états interactifs

- **Problème :** Les états focus reposent entièrement sur l'ajout manuel de la classe .focus-ring (globals.css:42-44) sur chaque élément interactif. Plusieurs contrôles ne l'ont pas, ex : le <select> du SimulatorCard utilise .focus-ring mais les <select> natifs du ContactForm passent par .field-input (qui inclut focus-ring, OK) — la cohérence dépend de l'auteur. Aucun fallback global :focus-visible sur a/button.
- **Impact :** Un développeur qui oublie .focus-ring crée un élément sans indication de focus clavier (échec WCAG 2.4.7). La navigation clavier n'est garantie que par discipline manuelle, pas par défaut système.
- **Recommandation :** Ajouter une règle globale a:focus-visible, button:focus-visible, [role=button]:focus-visible dans globals.css comme filet de sécurité, en plus de .focus-ring pour les cas spécifiques. Garantit un anneau de focus partout par défaut.
- **Fichiers :** `app/globals.css:42-44`, `components/SimulatorCard.tsx:34`
- **Vérifié :** Lecture globals.css:42-44 (.focus-ring utilitaire) ; aucune règle :focus-visible globale dans globals.css ; usage manuel constaté dans chaque composant (HeroSection.tsx:79, etc.).

</details>

---

### Conversion / Expérience Formation (CRO centre de formation)

_9 findings — 🔴 1 · 🟠 4 · 🟡 2 · 🔵 2_

Le site LODEN inspire une confiance correcte sur le périmètre "auto-école permis B" : offres permis lisibles, simulateur de prix, parcours CPF avec formulaire de diagnostic, FAQ, témoignages et structured data (Course, DrivingSchool). Le design est premium et chaque page a au moins un CTA. MAIS deux écarts majeurs plombent la conversion sur le périmètre métier annoncé. (1) Périmètre commercial amputé : aucune offre VTC ni CACES n'existe (ni en frontend data/site.ts, ni en backend initial-data.ts, ni dans l'API /api/formations testée live — 0 occurrence). Le site se présente comme "auto-école nouvelle génération" alors que le périmètre annoncé est auto-école + centre CACES + centre VTC. Aucun formulaire devis VTC/CACES non plus. (2) La preuve de confiance est incohérente et invérifiable : le hero affiche "+2000 élèves formés / +500 avis", les stats de page affichent "+800 élèves / 98% / 92%", la page avis affiche aggregateRating reviewCount 128, et seuls 3 témoignages réels existent (dupliqués pour remplir la grille). La marque oscille entre "LODEN" et "LODENE". Aucun label/agrément réel n'est affiché (Qualiopi en simple texte, numéro d'agrément préfectoral "à compléter"). Le simulateur de prix annonce des montants supérieurs aux packs publiés (1420€ vs 1190€), ce qui crée de la friction au moment du devis.

**Priorités de la dimension :**
- CONV-01 (P0) : Créer ou clarifier les pôles VTC et CACES — c'est le trou de chiffre d'affaires n°1 vs le périmètre 'centre de formation' annoncé ; a minima 2 landing pages + formulaire devis pro.
- CONV-02 (P1) : Unifier toutes les preuves chiffrées (hero +2000 vs +800, avis +500 vs 128, réussite 98% vs 86%) sur une source unique réelle, et corriger le reviewCount du JSON-LD.
- CONV-04 (P1) : Afficher les vraies preuves de label/agrément (logo Qualiopi + n° certificat, agrément préfectoral réel, SIRET) — indispensable pour convertir le CPF et le financement pro.
- CONV-03 (P1) : Fixer le nom de marque (LODEN vs LODENE) partout, à commencer par le h1 et l'aria-label du hero.
- CONV-05 (P1) : Aligner le simulateur sur les prix des packs publiés pour supprimer la friction 'prix incohérent' sur la page Tarifs.

<details><summary>Voir les 9 findings détaillés</summary>

#### 🔴 `CONV-01` Aucune offre VTC ni CACES — manque commercial majeur vs périmètre annoncé
**Sévérité :** P0 · **Effort :** XL · **Catégorie :** Offre / Périmètre commercial

- **Problème :** Le périmètre métier annoncé est auto-école + centre CACES + centre VTC + formations pro. Or aucune formation VTC ou CACES n'existe nulle part : les 8 formations (data/site.ts:159-240) et 11 slugs ne couvrent que le permis B / code / perfectionnement. Le backend (backend/src/data/initial-data.ts:49-158) ne contient aucune entrée VTC/CACES. Test live confirmé : `curl http://127.0.0.1:4000/api/formations | grep -i 'vtc|caces'` renvoie 0 résultat. Aucun formulaire devis VTC ni inscription CACES (ContactForm ne propose que Permis B / Auto / Accéléré / CPF / Remise à niveau, components/ContactForm.tsx:107-112). Aucune page /formations/vtc ni /formations/caces.
- **Impact :** Toute la demande VTC (mandataire / examen VTC) et CACES (R489, R486, R485 — chariots, nacelles, gerbeurs) est perdue : ces formations sont à forte valeur (1500–3000€) et fortement financées CPF/OPCO. Un visiteur cherchant 'formation CACES Paris' ou 'permis VTC' ne trouve rien, conclut que LODEN ne le fait pas et part chez un concurrent. C'est le plus gros trou de chiffre d'affaires du site au regard du positionnement affiché de 'centre de formation' multi-métiers.
- **Recommandation :** Décider la position commerciale : soit (a) créer réellement les pôles VTC et CACES — formations dédiées dans data/site.ts + backend, pages /formations/[slug] (mobilité VTC, R489 cat.1/3/5, R486 nacelles…), pricing CPF/OPCO, formulaire devis pro avec champ 'entreprise/OPCO', preuves Qualiopi par catégorie ; soit (b) retirer ces mots du discours commercial et assumer 'auto-école permis B'. Vu l'ambition 'référence locale', option (a) recommandée : a minima 2 landing pages VTC + CACES avec formulaire devis et badges financement, même si le catalogue détaillé arrive après.
- **Fichiers :** `data/site.ts:159`, `backend/src/data/initial-data.ts:49`, `components/ContactForm.tsx:107`, `app/formations/[slug]/page.tsx:13`
- **Vérifié :** Lecture code data/site.ts:159-240, backend/src/data/initial-data.ts:49-158, components/ContactForm.tsx:107-112 + test curl live: curl -s http://127.0.0.1:4000/api/formations | grep -io 'vtc|caces' => 0 ligne. grep récursif sur app/ components/ data/ backend/src/data => seule occurrence 'CACES/VTC' inexistante.

#### 🟠 `CONV-02` Preuves chiffrées contradictoires entre le hero, les pages et le schema.org
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Preuve sociale / Crédibilité

- **Problème :** Les indicateurs de confiance se contredisent d'une zone à l'autre. Hero (components/HeroSection.tsx:26-27) : '4.9/5 — +500 avis' et '+2000 élèves formés'. heroStats (data/site.ts:69-74) : '98% de réussite', '+800 élèves accompagnés'. quickFacts (data/site.ts:492) : '4,9/5 avis élèves'. Page avis (app/avis/page.tsx:25,76-78) : aggregateRating reviewCount '128', plus '4,9/5 Note Google', '98% réussite', '92% recommandent'. AdminDashboard (components/AdminDashboard.tsx:398) : 'Taux de réussite 86%'. Donc 3 volumes d'élèves différents (+800 / +2000), 2 volumes d'avis (+500 / 128), 2 taux de réussite (98% / 86%).
- **Impact :** L'incohérence des chiffres détruit la crédibilité — un visiteur attentif (ou un parent qui compare) voit '+2000' puis '+800' et conclut que les chiffres sont inventés. Le reviewCount 128 dans le JSON-LD (schema.org AggregateRating) avec seulement 3 avis réels est aussi un risque de pénalité Google (rich snippet trompeur). C'est l'argument de réassurance n°1 d'une auto-école (réussite + volume) qui devient un signal de méfiance.
- **Recommandation :** Centraliser une source unique de vérité (un objet `proofStats` dans data/site.ts, idéalement alimenté par l'API stats/reviews) et n'afficher que des chiffres réels et cohérents partout. Aligner hero, heroStats, quickFacts, page avis et le JSON-LD sur les mêmes valeurs. Ne mettre dans aggregateRating.reviewCount que le nombre d'avis réellement publiés (l'API /api/reviews renvoie 3). Brancher le 'taux de réussite' sur les vrais examens (le CRM expose déjà stats.exams.passRate, components/crm/CockpitStats.tsx:50).
- **Fichiers :** `components/HeroSection.tsx:26`, `data/site.ts:69`, `app/avis/page.tsx:25`, `components/AdminDashboard.tsx:398`, `data/site.ts:492`
- **Vérifié :** Lecture code: components/HeroSection.tsx:26-27, data/site.ts:69-74 & 492, app/avis/page.tsx:25 & 76-78, components/AdminDashboard.tsx:398. Test live /api/reviews => 3 avis (backend/src/data/initial-data.ts:222-250).

#### 🟠 `CONV-03` Nom de marque incohérent : 'LODEN' vs 'LODENE'
**Sévérité :** P1 · **Effort :** S · **Catégorie :** Marque / Confiance

- **Problème :** Le hero affiche le nom de marque comme 'LODENE' (components/HeroSection.tsx:58 aria-label 'Passe ton permis avec LODENE', ligne 68 le mot affiché 'LODENE'), et 6 fichiers utilisent 'LODENE' (HeroSection, PricingCard, InstructorCard, FormationCard, AiChatWidget, HeaderMain — souvent en commentaire mais aria-label exposé à l'utilisateur). Partout ailleurs c'est 'LODEN Auto-École' (footer, metadata, schema.org name, contactInfo email contact@loden-autoecole.fr, domaine loden-autoecole.fr).
- **Impact :** La première chose que lit/entend un visiteur (titre h1 du hero + lecteurs d'écran via aria-label) est 'LODENE', alors que le reste du site, l'email et le domaine disent 'LODEN'. Confusion immédiate sur l'identité, doute sur le sérieux, et incohérence pour le SEO de marque. Sur la page la plus vue (accueil), le nom même de l'école n'est pas fiable.
- **Recommandation :** Choisir le nom officiel définitif et l'appliquer partout (h1 hero, aria-label, commentaires, copy). Si la marque est 'LODEN', corriger HeroSection.tsx:58 et 68. Vérifier aussi le logo (le 'L' du footer) et le titre global. Un nom = un seul orthographe sur tout le site.
- **Fichiers :** `components/HeroSection.tsx:58`, `components/HeroSection.tsx:68`, `components/Footer.tsx:17`
- **Vérifié :** Lecture code components/HeroSection.tsx:58 & 68 (LODENE affiché + aria-label) ; grep -rln 'LODENE' app/ components/ data/ => 6 fichiers. Contraste avec components/Footer.tsx:17 'LODEN Auto-École' et data/site.ts:61 email loden-autoecole.fr.

#### 🟠 `CONV-04` Aucune preuve réelle de label/agrément : Qualiopi en texte, agrément préfectoral 'à compléter'
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Preuve de confiance / Conformité

- **Problème :** Les éléments les plus rassurants pour une école de conduite/formation pro sont affichés comme du décor, pas comme des preuves : 'Qualiopi & CPF' est un simple bloc texte (data/site.ts:107, trustProofs) et un mot dans le footer (components/Footer.tsx:57) sans logo certifié ni numéro de certificat ni organisme certificateur. Le numéro d'agrément préfectoral (obligatoire pour une auto-école, E-XXXX) est marqué 'à compléter avec les informations officielles' (app/mentions-legales/page.tsx:17). Aucun logo officiel (Qualiopi, France Compétences, préfecture), aucun n° d'enregistrement déclaration d'activité (NDA), aucune mention SIRET réelle.
- **Impact :** Pour le CPF et le financement pro (OPCO), la certification Qualiopi est légalement obligatoire et c'est LE critère de choix — l'afficher sans preuve sonne faux. Un visiteur averti, un employeur ou un parent ne peut pas vérifier que l'école est réellement agréée, ce qui bloque la conversion sur les parcours financés (les plus rentables). C'est aussi un risque de conformité (mentions légales auto-école incomplètes).
- **Recommandation :** Afficher les preuves réelles et vérifiables : logo Qualiopi officiel + numéro de certificat + nom du certificateur, numéro d'agrément préfectoral réel (E-XX-XXX-XXXX), SIRET, NDA pour le financement pro. Créer un petit bandeau 'certifications' (composant) avec les logos officiels, idéalement sur l'accueil + page CPF + pages VTC/CACES. Compléter les mentions légales (obligation légale).
- **Fichiers :** `data/site.ts:107`, `components/Footer.tsx:57`, `app/mentions-legales/page.tsx:17`
- **Vérifié :** Lecture code data/site.ts:107 (trustProof texte), components/Footer.tsx:57 (texte Qualiopi), app/mentions-legales/page.tsx:17 ('à compléter'). Aucun fichier logo Qualiopi/agrément trouvé dans le projet.

#### 🟠 `CONV-05` Le simulateur de prix annonce plus cher que les packs publiés (friction au devis)
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Tarifs / Lisibilité

- **Problème :** Le simulateur (components/SimulatorCard.tsx + simulatorOptions data/site.ts:283-294) calcule pour 'Permis B manuel' = base 260 + 58€/h × 20h = 1420€, alors que le pack 'Permis B' affiché partout est à 1190€ (data/site.ts:247, PricingCard, FAQ data/site.ts:400). Pour la boîte auto : simulateur = 190 + 62×13 = 996€ vs pack à 890€. Les deux chiffres coexistent sur la même page /tarifs (PricingPlansGrid + SimulatorCard) sans explication de l'écart. De plus le simulateur n'inclut pas le code (le pack 'code inclus'), donc compare des périmètres différents sans le dire.
- **Impact :** Le visiteur voit le pack à 1190€ puis le simulateur lui sort 1420€ : il ne sait plus quel est le vrai prix, soupçonne des frais cachés et abandonne, ou demande un devis avec une attente faussée. Sur une page Tarifs dont tout l'objet est de rassurer ('Des prix lisibles, sans surprise', app/page.tsx:63), c'est contre-productif.
- **Recommandation :** Aligner les bases/tarifs horaires du simulateur sur les packs réels (le tarif horaire et la base doivent reconstituer le prix pack pour le nombre d'heures du pack), ou afficher clairement que le simulateur estime un parcours à la carte hors pack (et préciser ce qui est inclus : code, présentation examen). Idéalement, faire pointer le simulateur sur les vraies données API /api/tarifs déjà disponibles plutôt que sur des constantes mock divergentes.
- **Fichiers :** `components/SimulatorCard.tsx:13`, `data/site.ts:283`, `data/site.ts:247`
- **Vérifié :** Lecture code data/site.ts:283-294 (base/hourly) + calcul: 260+58*20=1420, 190+62*13=996 (vérifié en bash). Packs: data/site.ts:247 (1190) & 265 (890), confirmé live /api/tarifs (priceCents 119000 / 89000).

#### 🟡 `CONV-06` Témoignages trop peu nombreux et dupliqués pour 'remplir' la grille
**Sévérité :** P2 · **Effort :** M · **Catégorie :** Preuve sociale

- **Problème :** Seuls 3 témoignages existent (data/site.ts:330-349 et backend/src/data/initial-data.ts:222-250). Le composant ReviewsGrid les duplique explicitement pour remplir la page avis : `const fallbackTestimonials = testimonials.concat(testimonials)` (components/ReviewsGrid.tsx:8), affichant donc 6 cartes dont 3 paires identiques. Les avis n'ont ni date, ni lien Google, ni formation suivie, ni photo/avatar. La page avis se présente comme 'Avis Google' et 'prêts pour synchronisation Google Reviews' (app/avis/page.tsx:95) mais aucune intégration Google réelle n'existe.
- **Impact :** Une grille d'avis manifestement dupliquée (mêmes prénoms/textes deux fois) est immédiatement repérée et décrédibilise toute la section preuve sociale, qui est centrale pour une auto-école. La promesse 'avis Google' non tenue ajoute un décalage attente/réalité.
- **Recommandation :** Collecter et afficher de vrais avis (a minima 8–12 distincts, avec date + formation + idéalement lien Google), ou brancher réellement la synchronisation Google Reviews / un widget tiers (Trustpilot, Google Places API). Supprimer la duplication `testimonials.concat(testimonials)`. Afficher la note agrégée réelle issue de l'API reviews.
- **Fichiers :** `components/ReviewsGrid.tsx:8`, `data/site.ts:330`, `app/avis/page.tsx:95`
- **Vérifié :** Lecture code components/ReviewsGrid.tsx:8 (concat duplication), data/site.ts:330-349 (3 témoignages), app/avis/page.tsx:95 (promesse sync Google). Test live /api/reviews => 3 avis.

#### 🟡 `CONV-07` Parcours conduite accompagnée (AAC) et supervisée sous-exploités, pas de page famille/jeune
**Sévérité :** P2 · **Effort :** L · **Catégorie :** Offre / Segmentation

- **Problème :** La conduite accompagnée existe comme 1 formation (slug conduite-accompagnee, data/site.ts:181-189, 'Dès 15 ans') mais il n'y a aucune page ni section dédiée 'parents/familles' expliquant le déroulé AAC (rendez-vous pédagogiques, validation, examen anticipé, avantages assurance/taux de réussite). La conduite supervisée n'est pas mentionnée du tout. Le permis accéléré existe mais sans page expliquant les conditions (planning, code requis, dates d'examen garanties ?). La réassurance 'familles' demandée n'a pas de point d'entrée dédié.
- **Impact :** La conduite accompagnée est un segment à fort volume et forte décision parentale (le parent paie et choisit). Sans contenu rassurant dédié (sécurité, taux de réussite supérieur en AAC, étapes claires), LODEN convertit moins bien ce public que des concurrents qui détaillent le parcours. Idem accéléré : sans engagement clair (date d'examen), le visiteur pressé hésite.
- **Recommandation :** Créer une section/landing 'Conduite accompagnée & supervisée (jeunes & familles)' : étapes AAC, âges, durée, avantages chiffrés (réussite, assurance), témoignages parents, CTA 'diagnostic AAC'. Pour l'accéléré, préciser les engagements (délai d'examen, prérequis code) sur la page détail. Ajouter ces besoins comme options dans ContactForm.
- **Fichiers :** `data/site.ts:181`, `app/formations/[slug]/page.tsx:58`
- **Vérifié :** Lecture code data/site.ts:181-198 (formations conduite-accompagnee & accelere), app/formations/[slug]/page.tsx (page générique sans contenu AAC spécifique), grep 'supervisée' => 0 occurrence.

#### 🔵 `CONV-08` Le blog n'a pas d'articles réels — 3 cartes renvoyant vers d'autres pages
**Sévérité :** P3 · **Effort :** L · **Catégorie :** Contenu / SEO de confiance

- **Problème :** La page /blog (app/blog/page.tsx:11-31) affiche 3 'articles' qui ne sont que des cartes pointant vers /formations, /cpf et /formations/code-en-ligne. Il n'existe aucun article réel (pas de route /blog/[slug], pas de contenu rédactionnel). Le menu et le maillage suggèrent pourtant un blog éditorial.
- **Impact :** Faible impact conversion direct mais manque de contenu de réassurance/SEO (un blog réel capte les recherches 'comment financer le permis', 'CACES c'est quoi', 'devenir VTC' et nourrit la confiance). En l'état, le blog donne une impression de coquille vide si un visiteur clique en attendant un article.
- **Recommandation :** Soit publier de vrais articles (guides permis/CPF/VTC/CACES, route /blog/[slug]), soit renommer la section 'Guides' et assumer des cartes de redirection. Aligner sur la stratégie SEO globale (les landing pages /auto-ecole-cpf-paris et /permis-b-paris-11 montrent que la logique SEO locale existe — le blog devrait la prolonger).
- **Fichiers :** `app/blog/page.tsx:11`
- **Vérifié :** Lecture code app/blog/page.tsx:11-31 (articles = liens internes vers /formations,/cpf), absence de répertoire app/blog/[slug].

#### 🔵 `CONV-09` Pas d'urgence/réassurance temps réel (places, prochaines sessions, garantie réussite)
**Sévérité :** P3 · **Effort :** L · **Catégorie :** Levier de conversion

- **Problème :** Aucun mécanisme d'urgence ou de réassurance dynamique sur les pages de conversion : pas de 'prochaine session le X', pas de 'X places restantes', pas de garantie (ex: 'heures supplémentaires offertes si échec', 'satisfait ou accompagné'), pas de délai de rappel annoncé ('réponse sous 24h'). Les CTA disent 'Demander un devis' / 'Pré-inscription' mais sans promesse de délai ni de prochaine étape datée. BookingCalendar affiche des créneaux mock (data/site.ts:296-302) non reliés à une vraie disponibilité côté public.
- **Impact :** Manque de leviers qui poussent à l'action immédiate. Pour des familles/jeunes qui comparent, l'absence de garantie et de prochaine session concrète laisse le choix 'à plus tard'. Effet modéré mais cumulatif sur le taux de conversion des CTA.
- **Recommandation :** Ajouter des éléments de réassurance datés : délai de rappel ('réponse sous 24h ouvrées'), prochaines sessions code/accéléré (datées, reliées au backend availabilities), une garantie claire si applicable, et un compteur léger 'places limitées' sur l'accéléré. Connecter BookingCalendar public aux vraies disponibilités API /api/bookings/slots.
- **Fichiers :** `data/site.ts:296`, `app/inscription/page.tsx:12`, `components/BookingCalendar.tsx`
- **Vérifié :** Lecture code app/page.tsx (CTA), components/HeroSection.tsx:76-91, data/site.ts:296-302 (slots mock), app/inscription/page.tsx (pas de promesse délai). grep 'garantie' => uniquement 'Garanties LODEN' textuelles sur page formation détail.

</details>

---

### Accessibilité (RGAA 4 / WCAG 2.1 AA)

_13 findings — 🔴 0 · 🟠 4 · 🟡 6 · 🔵 3_

Le socle est correct: tous les composants interactifs portent un `.focus-ring` (focus visible 2px sur loden-500), les boutons icône ont des `aria-label`, les SVG décoratifs sont en `aria-hidden`, les formulaires associent label↔champ via wrapper `<label>` (pas besoin de htmlFor), portent `autoComplete`, `noValidate` + validation Zod, et `prefers-reduced-motion` neutralise les animations MotionReveal et marquee. Chaque page testée (/, /inscription, /connexion, /contact, /tarifs, /formations) a exactement un `<h1>` et un `<main>`. Mais plusieurs manquements AA bloquants persistent: contrastes insuffisants sur le turquoise de marque (loden-500 #08AEB8 = 2.71:1 et loden-600 = 3.77:1 utilisés en texte et en fond de bouton/FAB), absence totale de lien d'évitement (skip link), `role="marquee"` invalide (n'existe pas en ARIA), erreurs de formulaire non reliées aux champs (aucun aria-invalid/aria-describedby/aria-live → un lecteur d'écran n'annonce pas l'erreur), modale de recherche et menu mobile sans piège de focus ni gestion du focus retour, radiogroups custom (BookingCalendar, PaymentIntentForm) non navigables aux flèches, et le slider du simulateur sans nom accessible. Aucun aria-live nulle part: réservations, paiements et réponses du chat ne sont pas annoncés. Périmètre testé en HTML rendu réel (curl :3000) + lecture du code source.

**Priorités de la dimension :**
- A11Y-01 (P1): la couleur de marque loden-500 #08AEB8 (2.71:1) et loden-600 (3.77:1) échouent au contraste AA partout où elles portent du texte/icônes ou servent de fond de bouton (FAB chat, icônes prix des cartes) — réserver #08AEB8 au décoratif, utiliser loden-700/800 pour tout porteur d'info.
- A11Y-02 (P1): ajouter un lien d'évitement 'Aller au contenu' (absent sur 100% des pages) + id/tabindex sur <main> — correctif court à fort impact clavier/lecteur d'écran.
- A11Y-03 (P1): relier les erreurs de formulaire aux champs (aria-invalid + aria-describedby + role=alert) et annoncer succès/échec d'envoi via aria-live — actuellement zéro liaison ARIA dans les 4 formulaires.
- A11Y-05 (P1): rendre la modale de recherche réellement modale (piège de focus, restitution du focus, inert sur le fond) — aujourd'hui aria-modal=true mais le focus fuit derrière.
- A11Y-08 (P2) + A11Y-04 (P2): introduire des régions live (chat IA, confirmation de réservation, paiement) et supprimer le role="marquee" invalide du bandeau d'actualité.

<details><summary>Voir les 13 findings détaillés</summary>

#### 🟠 `A11Y-01` Turquoise de marque #08AEB8 (loden-500) utilisé en texte et en fond de bouton: contraste 2.71:1 (échec AA)
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Contrastes

- **Problème :** loden-500 (#08AEB8) sur blanc = 2.71:1, loin du 4.5:1 (texte) et du 3:1 (composants/UI). Or il sert: (1) de fond au bouton flottant du chat IA — components/AiChatWidget.tsx:116 `bg-loden-500` avec icône blanche dessus (texte/icône blanc sur loden-500 = 2.71:1); (2) de couleur d'icônes informatives — FormationCard.tsx:93,97 `text-loden-500` (Clock3/BadgeCheck devant prix et durée), HeroSection.tsx:88 PlayCircle, FormationExplorer.tsx:59 loupe; (3) de bordure d'état sélectionné — PaymentIntentForm.tsx:192 `border-loden-500`. loden-600 (#0891a0) = 3.77:1, également <4.5:1, échoue en texte.
- **Impact :** La couleur identitaire du site échoue au critère WCAG 1.4.3 (texte) et 1.4.11 (composants). Les utilisateurs malvoyants ne distinguent pas le bouton chat (élément majeur), ni les icônes de prix/durée des cartes formation. C'est le défaut de contraste le plus structurant car il touche la couleur de marque omniprésente.
- **Recommandation :** Réserver loden-500 (#08AEB8) aux grands aplats décoratifs uniquement. Pour tout texte/icône porteur d'info et tout fond de bouton, utiliser loden-700 (#0e7490 = 5.36:1) ou loden-800 (#155e75 = 7.27:1). Concrètement: AiChatWidget FAB `bg-loden-500` → `bg-loden-700`; icônes `text-loden-500` des cartes → `text-loden-600` seulement si décoratives, sinon `text-loden-700`. Ne pas dépendre de la couleur seule pour l'état sélectionné (PaymentIntentForm/SimulatorCard) — ajouter un indicateur non chromatique (coche, gras, bordure 2px).
- **Fichiers :** `components/AiChatWidget.tsx:116`, `components/FormationCard.tsx:93`, `components/FormationCard.tsx:97`, `components/HeroSection.tsx:88`, `components/FormationExplorer.tsx:59`, `components/PaymentIntentForm.tsx:192`, `tailwind.config.ts:18`
- **Vérifié :** Lecture code: AiChatWidget.tsx:116, FormationCard.tsx:93/97, HeroSection.tsx:88, FormationExplorer.tsx:59, PaymentIntentForm.tsx:192. Ratios calculés via script Python (formule WCAG relative luminance): #08AEB8/blanc=2.71, #0891a0/blanc=3.77, #0e7490/blanc=5.36, #155e75/blanc=7.27.

#### 🟠 `A11Y-02` Aucun lien d'évitement (skip to content) — clavier piégé dans l'en-tête sur chaque page
**Sévérité :** P1 · **Effort :** S · **Catégorie :** Navigation clavier

- **Problème :** Aucun lien d'évitement n'existe. Le HTML rendu de / (curl :3000) ne contient aucun lien type 'Aller au contenu' avant le header. app/layout.tsx:84-89 enchaîne HeaderTop → HeaderMain → {children} sans cible. Les 5 occurrences de `sr-only` détectées sont des `<h2 class=sr-only>` de section et des inputs radio masqués, pas un skip link. Conséquence: chaque navigation au clavier doit retraverser logo + ~9 liens de nav + dropdowns avant d'atteindre le contenu.
- **Impact :** Échec RGAA 12.7 / WCAG 2.4.1 (Contournement de blocs). Pénalise lourdement utilisateurs clavier et lecteurs d'écran sur toutes les pages — d'autant que la nav principale est dense (3 menus déroulants + 6 liens).
- **Recommandation :** Ajouter en tout premier enfant de <body> dans app/layout.tsx un lien `<a href="#contenu" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-loden-800 focus:px-4 focus:py-2 focus:text-white">Aller au contenu</a>` et donner `id="contenu"` + `tabIndex={-1}` au `<main>` de chaque page (ou wrapper le {children}). Définir la classe utilitaire `.sr-only`/`.not-sr-only` (Tailwind les fournit nativement).
- **Fichiers :** `app/layout.tsx:78`, `app/layout.tsx:84`
- **Vérifié :** Test curl http://localhost:3000/ : grep des 1200 premiers caractères du body = aucun lien d'évitement, premier élément interactif = ticker du HeaderTop. grep 'sr-only' = uniquement h2 de section + radios SimulatorCard.

#### 🟠 `A11Y-03` Erreurs de formulaire non reliées aux champs: pas d'aria-invalid, aria-describedby, ni aria-live
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Formulaires

- **Problème :** Le composant Field (dupliqué dans ContactForm, CpfRequestForm, LoginForm, StudentRegistrationForm) rend le message d'erreur dans un `<span class=text-red-600>` adjacent au champ, sans aucune liaison ARIA. grep aria-invalid|aria-describedby|aria-errormessage sur tout components/ = 0 occurrence. L'input n'a pas `aria-invalid={!!error}`, le span d'erreur n'a pas d'id référencé par `aria-describedby`, et il n'y a pas de `role=alert`/`aria-live`. Les bandeaux de succès/échec global (ContactForm.tsx:164-172, LoginForm.tsx:80-84, etc.) sont aussi de simples `<p>` sans aria-live.
- **Impact :** Échec RGAA 11.10/8.9 / WCAG 3.3.1, 3.3.3, 4.1.3. Un lecteur d'écran ne signale pas qu'un champ est en erreur ni le texte de l'erreur quand le focus est sur le champ; il n'annonce pas non plus le succès/échec d'envoi (Contact, CPF, Inscription, Connexion). L'utilisateur aveugle ne sait pas pourquoi le formulaire ne passe pas.
- **Recommandation :** Dans chaque composant Field: générer un id stable (ex via React.useId) pour l'input et l'erreur; passer à l'input `aria-invalid={error ? true : undefined}` et `aria-describedby={error ? errorId : undefined}`; donner au span d'erreur `id={errorId} role="alert"`. Pour les bandeaux globaux succès/erreur, ajouter `role="status"` (succès) ou `role="alert"` (erreur) ou un conteneur `aria-live="polite"`. react-hook-form expose déjà register() — il faut juste relier les ids.
- **Fichiers :** `components/ContactForm.tsx:189`, `components/CpfRequestForm.tsx:161`, `components/LoginForm.tsx:108`, `components/StudentRegistrationForm.tsx:182`
- **Vérifié :** Lecture code: composant Field identique dans ContactForm.tsx:177-195, CpfRequestForm.tsx:149-167, LoginForm.tsx:96-114, StudentRegistrationForm.tsx:170-188 (aucun attribut ARIA sur input/span). grep récursif aria-invalid|aria-describedby|aria-errormessage sur components/ = 0.

#### 🟡 `A11Y-04` role="marquee" invalide (n'existe pas en ARIA) + bandeau d'actualité défilant non contrôlable
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Composants interactifs / ARIA

- **Problème :** HeaderTop.tsx:33 applique `role="marquee"` au bandeau d'informations. Ce rôle n'existe pas dans la spec ARIA (le seul équivalent valide est `role="marquee"` retiré; il faut utiliser une live region). Vérifié dans le HTML rendu (curl :3000): `<div class="marquee ..." role="marquee" aria-label="Informations LODEN">`. Le contenu défile en continu (animation marquee 32s, globals.css:94-114), il n'y a pas de bouton pause/play (la pause n'est qu'au survol souris, inaccessible au clavier/tactile).
- **Impact :** Échec WCAG 4.1.2 (rôle non valide ignoré ou mal interprété). Le défilement automatique sans contrôle de mise en pause viole aussi WCAG 2.2.2 (mouvement >5s). prefers-reduced-motion couvre l'animation (globals.css:116-120) mais pas le besoin d'un contrôle pause explicite.
- **Recommandation :** Remplacer `role="marquee"` par un conteneur neutre. Comme l'info clé (créneau dispo, CPF…) est purement décorative/redondante avec le reste du site, le plus simple: supprimer le role et garder `aria-hidden="true"` sur le bandeau (les TickerGroup en double ont déjà `aria-hidden` sur la copie). Si l'info doit être annoncée, exposer une seule copie en texte statique. Idéalement ajouter un bouton pause accessible au clavier.
- **Fichiers :** `components/HeaderTop.tsx:33`, `app/globals.css:94`
- **Vérifié :** Lecture code HeaderTop.tsx:33 + animation globals.css:94-120. HTML rendu confirmé via curl :3000 (role="marquee" présent). role marquee absent de la spec WAI-ARIA 1.2.

#### 🟠 `A11Y-05` Modale de recherche (GlobalSearch) sans piège de focus ni restitution du focus
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Composants interactifs / lecteurs d'écran

- **Problème :** GlobalSearch.tsx:116 est un `role="dialog" aria-modal="true"` correctement étiqueté, et Escape ferme (lignes 53-59), le focus va bien au champ à l'ouverture (ligne 41). Mais: (1) aucun piège de focus — Tab sort de la modale et atteint le contenu derrière (qui reste dans l'ordre de tabulation alors que `aria-modal=true` promet l'inverse); (2) le focus n'est pas restitué à l'élément déclencheur à la fermeture; (3) le fond inerte n'a pas `inert`/aria-hidden, donc le lecteur d'écran lit aussi la page sous la modale.
- **Impact :** Échec WCAG 2.1.2 (pas de piège mais l'inverse: fuite de focus) et bonnes pratiques de dialogue modal (WAI-ARIA APG). Pour un utilisateur clavier/lecteur d'écran, la modale n'est pas réellement modale: on tabule dans une UI fantôme.
- **Recommandation :** Implémenter un focus trap (cycler Tab/Shift+Tab entre les éléments focusables de la modale), mémoriser document.activeElement à l'ouverture et le re-focuser à la fermeture, et marquer le reste de la page `inert` (ou aria-hidden) pendant l'ouverture. Une lib légère (focus-trap-react) ou un hook maison sur le conteneur dialog suffit.
- **Fichiers :** `components/GlobalSearch.tsx:116`, `components/GlobalSearch.tsx:39`
- **Vérifié :** Lecture code GlobalSearch.tsx:33-59 (Escape + focus initial gérés), absence de toute logique de focus trap / focus return / inert sur le reste du code (lignes 113-167).

#### 🟡 `A11Y-06` Menu de navigation mobile: pas de fermeture clavier (Escape), pas de gestion de focus
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Navigation clavier

- **Problème :** HeaderMain.tsx:256-305 — le bouton hamburger ouvre/ferme un panneau (`aria-expanded`, `aria-label` corrects, c'est bien un <button>). Mais le panneau ouvert (ligne 268) n'a pas de gestion de touche Escape, le focus n'est pas déplacé dans le panneau à l'ouverture ni restitué au bouton à la fermeture, et il n'y a pas de relation `aria-controls` entre le bouton et le panneau.
- **Impact :** Échec partiel WCAG 4.1.2 / bonnes pratiques disclosure. Sur mobile au clavier (clavier Bluetooth, switch control), l'ouverture du menu désoriente: on ne peut pas le refermer au clavier sans retrouver le bouton, et rien n'annonce l'ouverture du panneau au-delà de aria-expanded.
- **Recommandation :** Ajouter `aria-controls="menu-mobile"` au bouton et `id="menu-mobile"` au panneau; gérer Escape pour fermer + re-focuser le bouton hamburger; optionnellement déplacer le focus sur le premier lien à l'ouverture. Les menus déroulants desktop (DropdownPill) gèrent déjà focus/blur (lignes 155-162) — appliquer la même rigueur au mobile.
- **Fichiers :** `components/HeaderMain.tsx:256`, `components/HeaderMain.tsx:268`
- **Vérifié :** Lecture code HeaderMain.tsx:256-305: bouton avec aria-expanded/aria-label OK, mais aucun onKeyDown Escape, aucun aria-controls, aucune gestion de focus sur le bloc conditionnel ligne 268.

#### 🟡 `A11Y-07` Radiogroups custom (BookingCalendar, PaymentIntentForm) non navigables aux flèches
**Sévérité :** P2 · **Effort :** M · **Catégorie :** Composants interactifs / clavier

- **Problème :** BookingCalendar.tsx:238-258 et PaymentIntentForm.tsx:181-206 utilisent `role="radiogroup"` + boutons `role="radio" aria-checked`. Le pattern ARIA radiogroup exige une navigation aux flèches (Up/Down/Left/Right) avec roving tabindex (un seul radio dans le tab order). Ici ce sont des `<button>` natifs: chacun est tabulable individuellement et il n'y a aucun gestionnaire de flèches, ni `tabIndex` roving. Idem pour la sélection de jour/créneau de BookingCalendar (boutons sans rôle, lignes 202-231) qui se comportent comme une grille de choix.
- **Impact :** Échec WCAG 4.1.2 — un radiogroup annoncé comme tel mais piloté à l'opposé (chaque option un arrêt de tab, pas de flèches) trompe l'utilisateur de lecteur d'écran sur le mode d'interaction attendu. Le calendrier de réservation est un parcours de conversion clé.
- **Recommandation :** Soit (recommandé, plus simple) abandonner role=radio et présenter un vrai groupe de `<input type=radio>` visuellement stylés (comme déjà fait dans SimulatorCard.tsx:57-77 avec fieldset/legend), soit implémenter le pattern complet: roving tabindex + onKeyDown flèches sur le radiogroup. Ajouter aussi un `<legend>`/label de groupe pour le sélecteur de jour et de créneau du BookingCalendar.
- **Fichiers :** `components/BookingCalendar.tsx:238`, `components/BookingCalendar.tsx:202`, `components/PaymentIntentForm.tsx:181`
- **Vérifié :** Lecture code BookingCalendar.tsx:238-258 et :202-231, PaymentIntentForm.tsx:181-206. role=radiogroup/radio présents (confirmé aussi dans HTML rendu home: 1 radiogroup, 2 radio), aucun onKeyDown ni tabIndex roving dans le code.

#### 🟡 `A11Y-08` Aucune région live: réservation, paiement et réponses du chat IA non annoncés
**Sévérité :** P2 · **Effort :** M · **Catégorie :** Lecteurs d'écran

- **Problème :** grep aria-live sur tout components/ = 0 occurrence. Conséquences: (1) AiChatWidget.tsx:71-84 — les réponses de l'assistant et l'état 'L'assistant écrit…' (ligne 83) apparaissent sans aria-live, donc non lus automatiquement; (2) BookingCalendar.tsx:269-273 — le message succès/erreur de réservation est un `<p>` sans live region; (3) PaymentIntentForm.tsx:219,239 — messages d'erreur et d'intention créée sans live region. La zone de scroll du chat (ligne 71) n'a pas non plus `role="log"`.
- **Impact :** Échec WCAG 4.1.3 (Messages d'état). Sur le chat, le résultat de réservation et la confirmation de paiement — tous des retours dynamiques critiques — un utilisateur de lecteur d'écran ne perçoit pas la réponse sans re-naviguer manuellement le DOM.
- **Recommandation :** Chat: donner `role="log" aria-live="polite" aria-relevant="additions"` au conteneur des messages (scrollRef, AiChatWidget.tsx:71) et `aria-live="polite"` à l'indicateur de saisie. BookingCalendar: wrapper le message dans un conteneur `aria-live="polite"` toujours présent (ne pas le monter/démonter). PaymentIntentForm: idem `role="status"` sur succès et `role="alert"` sur erreur.
- **Fichiers :** `components/AiChatWidget.tsx:71`, `components/BookingCalendar.tsx:269`, `components/PaymentIntentForm.tsx:219`
- **Vérifié :** grep récursif aria-live sur components/ = 0. Lecture code AiChatWidget.tsx:71-84, BookingCalendar.tsx:269-273, PaymentIntentForm.tsx:219/239.

#### 🟡 `A11Y-09` Hiérarchie de titres rompue sur /tarifs et /formations: passage de h1 à h3 (h2 sauté)
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Sémantique / structure

- **Problème :** Sur /formations (FormationExplorer + FormationCard) et /tarifs, l'ordre des titres rendu (curl :3000) est h1 → h3 → h3… sans h2 intermédiaire. Cause: FormationCard.tsx:79 titre la carte en `<h3>` alors que la section qui les contient (FormationExplorer) n'a pas de `<h2>` de section, et PageHero fournit le h1. Sur /tarifs même schéma (h1 puis directement h3 des cartes de prix). À l'inverse, la home est correcte (h1 → h2 de section → h3 de cartes) car les sections utilisent SectionHeader (h2).
- **Impact :** Échec RGAA 9.1 / WCAG 1.3.1 (structure de l'information). Les utilisateurs de lecteur d'écran qui naviguent par titres rencontrent un saut de niveau, perdant la logique de regroupement (les cartes apparaissent comme sous-sections d'un h2 inexistant).
- **Recommandation :** Insérer un `<h2>` de section visible (ou sr-only) avant la grille de cartes dans FormationExplorer (ex 'Toutes nos formations') et sur /tarifs ('Nos packs'). Alternativement, si les cartes doivent rester directement sous le h1, descendre leur titre en h2. Garder la cohérence avec la home qui utilise déjà SectionHeader=h2.
- **Fichiers :** `components/FormationCard.tsx:79`, `components/FormationExplorer.tsx:81`, `components/PricingCard.tsx`
- **Vérifié :** Test curl: /formations → headings ' h1 h3 h3 h3 h3 h3 h3 h3 h3 ' ; /tarifs → ' h1 h3 h3 h3 h3 h2 h3 ...' (le premier bloc de cartes saute h2). Home OK (h1 h2 h3...). Lecture code FormationCard.tsx:79 (h3), FormationExplorer.tsx (pas de h2).

#### 🟡 `A11Y-10` Slider du simulateur (type=range) sans nom accessible ni valeur vocalisée
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Formulaires

- **Problème :** SimulatorCard.tsx:48-55 — `<input type="range" min=10 max=40>` n'a ni `id`+label associé, ni `aria-label`, ni `aria-valuetext`. Le `<span>Nombre d'heures</span>` (ligne 45) est dans un `<label>` parent mais le label enveloppe aussi le badge de valeur, et surtout aucune liaison explicite ne garantit que le range hérite du nom (un span n'est pas un libellé de contrôle fiable pour un range custom). La valeur lue sera 'curseur, 20' sans unité ('heures').
- **Impact :** Échec WCAG 1.3.1 / 4.1.2. Un utilisateur de lecteur d'écran entend une valeur numérique nue sans savoir qu'il règle un nombre d'heures, et sans le contexte tarifaire qui se met à jour (estimate, ligne 84) — d'autant que cette mise à jour n'a pas d'aria-live (cf A11Y-08).
- **Recommandation :** Ajouter au range `aria-label="Nombre d'heures de conduite"` et `aria-valuetext={`${hours} heures`}` pour vocaliser l'unité. Idéalement relier le résultat 'Prix estimé' à une région `aria-live="polite"`. La couleur d'accent `accent-loden-500` (ligne 54) est par ailleurs en limite de contraste — la garder pour le rail décoratif est acceptable.
- **Fichiers :** `components/SimulatorCard.tsx:48`
- **Vérifié :** Lecture code SimulatorCard.tsx:43-55 et :79-86. grep type=range = 1 occurrence, aucun aria-label/aria-valuetext sur le range.

#### 🔵 `A11Y-11` Texte secondaire white/80 sur fond loden-700 sous le seuil AA (eyebrow clair, ticker)
**Sévérité :** P3 · **Effort :** S · **Catégorie :** Contrastes

- **Problème :** SectionHeader.tsx:31,49 utilise `text-white/80` pour l'eyebrow et le texte en variante tone=light (utilisée sur les sections fond foncé loden-700). HeaderTop.tsx:16 le ticker est en `text-white/90`. white/80 (~#cfd8da) sur loden-700 (#0e7490) = 3.70:1 (échec 4.5:1 pour du texte normal). white/90 ≈ 4.24:1, encore <4.5:1. Le sous-texte du chat 'Réponses indicatives' (AiChatWidget.tsx:63 `text-white/80`) et 'Prix estimé' (SimulatorCard.tsx:80 `text-white/75` sur loden-ink) sont dans le même cas — sur loden-ink (#142126), white/75 reste lisible (~9:1) donc OK, mais sur loden-700 c'est en échec.
- **Impact :** Échec WCAG 1.4.3 sur les textes secondaires des bandeaux et en-têtes clairs. Impact modéré car ce sont des textes d'appoint (eyebrow, sous-titre), mais ils participent à la compréhension.
- **Recommandation :** Sur fond loden-700, remonter l'opacité du texte secondaire à white/100 ou white/90 minimum n'est pas suffisant (4.24:1) — préférer du blanc plein (#fff sur loden-700 = 5.36:1) pour tout texte porteur de sens, et réserver white/80 aux fonds plus foncés (loden-800/loden-900/loden-ink où le ratio repasse au-dessus de 4.5:1). Concrètement SectionHeader tone=light: passer text-white/80 → text-white sur les eyebrows; ticker HeaderTop: text-white/90 → text-white.
- **Fichiers :** `components/SectionHeader.tsx:31`, `components/SectionHeader.tsx:49`, `components/HeaderTop.tsx:16`
- **Vérifié :** Ratios calculés: #cfd8da(white80)/#0e7490=3.70, white90/#0e7490=4.24, white/#0e7490=5.36. Lecture code SectionHeader.tsx:31/49, HeaderTop.tsx:16, AiChatWidget.tsx:63, SimulatorCard.tsx:80.

#### 🔵 `A11Y-12` scroll-behavior: smooth global non conditionné à prefers-reduced-motion + scroll auto du chat
**Sévérité :** P3 · **Effort :** S · **Catégorie :** prefers-reduced-motion

- **Problème :** globals.css:15-17 applique `scroll-behavior: smooth` sur html sans exception pour prefers-reduced-motion. AiChatWidget.tsx:21 force `scrollTo({ behavior: 'smooth' })` à chaque message, également non conditionné. Le bloc @media prefers-reduced-motion (globals.css:75-79 et 116-120) ne couvre que .motion-reveal et .marquee-track, pas le défilement.
- **Impact :** Échec partiel WCAG 2.3.3 (Animation déclenchée par interaction). Les utilisateurs sensibles au mouvement (vestibulaire) qui ont activé 'réduire les animations' subissent quand même le défilement animé sur ancres et chat. Impact faible mais c'est le seul angle mort d'un support reduced-motion par ailleurs présent.
- **Recommandation :** Ajouter dans le bloc @media (prefers-reduced-motion: reduce): `html { scroll-behavior: auto; }`. Dans AiChatWidget, lire la préférence (window.matchMedia('(prefers-reduced-motion: reduce)')) et passer behavior:'auto' le cas échéant. Le reste du support reduced-motion (MotionReveal, marquee) est correct et à conserver.
- **Fichiers :** `app/globals.css:15`, `app/globals.css:75`, `components/AiChatWidget.tsx:21`
- **Vérifié :** Lecture code globals.css:15-17 (smooth global), :75-79/:116-120 (media query ne couvre que reveal/marquee), AiChatWidget.tsx:20-22 (scroll smooth inconditionnel).

#### 🔵 `A11Y-13` h1 décoratif du hero: aria-label 'LODENE' diverge de la marque 'LODEN' et masque le découpage typographique
**Sévérité :** P3 · **Effort :** S · **Catégorie :** Sémantique

- **Problème :** HeroSection.tsx:57-70 — le h1 porte `aria-label="Passe ton permis avec LODENE"` et son contenu visible est éclaté en 3 spans avec polices décoratives (Great_Vibes, Allura, Permanent_Marker). L'aria-label remplace correctement le texte fragmenté pour les lecteurs d'écran (bonne intention), mais (1) il dit 'LODENE' alors que le nom de marque dans tout le reste du site et les metadata est 'LODEN' (layout.tsx:14 'LODEN Auto-École'); cette incohérence se retrouve aussi visuellement (Logo HeaderMain.tsx:97 affiche 'LODENE', titre de page = 'LODEN'). (2) Aucun problème de contraste sur le hero: #087f92 sur pearl = 4.61:1 (OK AA texte large).
- **Impact :** Faible (P3): pas un blocage A11Y mais une incohérence de nom de marque qui sera vocalisée différemment du titre du document et du reste du site — déroutant pour un utilisateur de lecteur d'écran, et symptôme d'un flottement 'LODEN' vs 'LODENE' à trancher au niveau produit.
- **Recommandation :** Trancher le nom officiel (LODEN d'après metadata/CLAUDE.md) et l'appliquer uniformément: aria-label du h1, logo HeaderMain.tsx:97, greeting AiChatWidget. Garder le découpage en spans décoratifs + aria-label est la bonne approche; seul le libellé doit être harmonisé.
- **Fichiers :** `components/HeroSection.tsx:58`, `components/HeaderMain.tsx:97`, `app/layout.tsx:14`
- **Vérifié :** Lecture code HeroSection.tsx:57-70 (aria-label 'LODENE'), HeaderMain.tsx:97 (logo 'LODENE'), layout.tsx:14 (title 'LODEN Auto-École'), AiChatWidget.tsx:10 ('assistant LODENE'). Contraste #087f92/#fbfdfc=4.61 calculé.

</details>

---

### Performance

_8 findings — 🔴 0 · 🟠 1 · 🟡 5 · 🔵 2_

La performance de base est saine pour un site Next.js 15 : First Load JS partage de 102 kB, page d'accueil a 121 kB, gros du contenu public en Static/SSG, composants de presentation tous en Server Components (le "use client" est bien circonscrit aux 4 composants interactifs : HeaderMain, BookingCalendar, GlobalSearch, AiChatWidget). lucide-react est importe en named exports (tree-shaking OK), gzip actif, une seule image (loden-hero.jpg 204 kB) servie via next/image avec priority. Les vrais sujets ne sont pas le poids JS mais : (1) trois polices Google decoratives chargees uniquement pour le H1 du hero (LCP), avec un Inter declare dans le CSS/Tailwind mais jamais charge (incoherence design) ; (2) la page /cpf forcee en rendu dynamique par cache:"no-store" alors qu'un ISR suffirait ; (3) le hero LCP est un JPEG non decline en AVIF/WebP et une config next/image absente ; (4) le cockpit /admin tire ~11 requetes API au mount (CockpitStats + 10 fetch d'AdminDashboard) avec donnees redondantes. Mesures faites en dev (les serveurs tournaient) + build de production isole pour les tailles de bundle. Aucune regression bloquante de perf cote public ; surtout des optimisations LCP/CLS et data-fetching a faire. Note: un build avec .next corrompu (artefact obsolete) a casse la collecte de pages au premier essai, signal d'hygiene CI a surveiller.

**Priorités de la dimension :**
- PERF-01 (P1): rationaliser les 3 polices Google decoratives du hero (LCP/CLS) - reserver l'espace du H1 et ne preloader que l'essentiel, ou rendre le titre sans police custom.
- PERF-04 (P2): optimiser l'image hero LCP - activer AVIF dans next.config + recompresser loden-hero.jpg (204 kB) pour alleger le chemin critique mobile.
- PERF-03 (P2): passer /cpf de cache:no-store (dynamique) a un ISR (revalidate) pour la rendre statique tout en gardant la fraicheur FAQ du CRM.
- PERF-05 (P2): unifier le cockpit /admin sur l'endpoint agrege /api/admin/stats et arreter les 10 fetch redondants au mount d'AdminDashboard (charge a la demande par onglet).
- PERF-07 (P2): fiabiliser le build (nettoyage .next avant next build, ne pas faire cohabiter dev et build/start sur le meme .next) pour des deploiements deterministes.

<details><summary>Voir les 8 findings détaillés</summary>

#### 🟠 `PERF-01` Trois polices Google decoratives chargees pour le seul H1 du hero (impact LCP/CLS)
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Fonts / LCP

- **Problème :** components/HeroSection.tsx:3 importe Allura, Great_Vibes et Permanent_Marker via next/font/google, uniquement pour styler les trois lignes du titre H1 ('Passe ton permis' / 'avec' / 'LODENE'). Le build genere 10 fichiers .woff2 (216 kB total dans .next/static/media), dont 3 variantes latin preloadees (~85 kB cumules pour ces fonts decoratives, ex. 46 kB + 28 kB + 29 kB). Ce H1 est l'element LCP de la page d'accueil ; avec display:swap le texte s'affiche d'abord en fallback puis bascule, provoquant un reflow (CLS) sur le plus grand element de la page.
- **Impact :** LCP retarde et instable (le texte LCP attend ou re-layout au swap des 3 polices), CLS sur le hero. Sur mobile 4G, ~85 kB de polices supplementaires en chemin critique pour un effet purement decoratif. Risque de score CWV degrade (LCP/CLS) sur la page la plus vue.
- **Recommandation :** Reduire a UNE police d'accent maximum, ou pre-rendre le titre en SVG/texte stylise sans police custom. Si on garde des fonts : (1) reserver l'espace via size-adjust/line-height fixe pour eviter le CLS, (2) ne preloader que la (les) police(s) reellement above-the-fold, (3) verifier que chaque font ne charge que le subset latin necessaire. Mesurer LCP avant/apres : objectif LCP < 2.5 s, CLS < 0.1.
- **Fichiers :** `components/HeroSection.tsx:3`, `components/HeroSection.tsx:57-70`
- **Vérifié :** Lecture code components/HeroSection.tsx:1-23 (import + config des 3 fonts, display:swap) ; build prod: 10 fichiers .woff2 dans .next/static/media (ls -la), tailles 1-46 kB, du total 216K ; H1 = LCP confirme par lecture HeroSection.tsx:57-70.

#### 🟡 `PERF-02` Inter declare en font-family (CSS + Tailwind) mais jamais charge -> rendu en system-ui
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Fonts

- **Problème :** app/globals.css:23 et tailwind.config (fontFamily.sans) declarent 'Inter' comme police principale du corps, et app/global-error.tsx:21 idem, mais aucun import next/font (ni @font-face, ni <link> Google) ne charge reellement Inter. Le site rend donc tout le corps de texte en fallback system-ui/-apple-system, pas en Inter.
- **Impact :** Cote perf c'est neutre/positif (aucun telechargement Inter, pas de FOUT sur le corps). Mais c'est une incoherence : le rendu reel ne correspond pas a l'intention design 'Inter premium', et varie selon l'OS (San Francisco sur Mac/iOS, Segoe sur Windows). A trancher : charger Inter proprement (next/font) ou assumer system-ui et nettoyer les declarations.
- **Recommandation :** Decision design. Si Inter voulu : l'ajouter une seule fois dans app/layout.tsx via next/font (variable, subset latin, display:swap) et l'appliquer sur <body>, en gardant la stack system en fallback. Sinon, retirer 'Inter' des declarations pour clarifier l'intention. Eviter d'ajouter un poids de police inutile si le system-ui convient.
- **Fichiers :** `app/globals.css:23`, `tailwind.config.ts:38`, `app/global-error.tsx:21`
- **Vérifié :** grep 'Inter|next/font' app components => Inter cite seulement dans globals.css:23, tailwind.config:38, global-error.tsx:21 ; aucun import next/font d'Inter ; HeroSection.tsx:3 ne charge que Allura/Great_Vibes/Permanent_Marker.

#### 🟡 `PERF-03` Page /cpf forcee en rendu dynamique par cache:no-store (perte du SSG/ISR)
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Rendu / Data fetching

- **Problème :** lib/faq.ts:12 fait fetch('/api/faq', { cache: 'no-store' }) cote serveur. app/cpf/page.tsx:15 appelle getFaqEntries() au rendu. Resultat (confirme par le build): /cpf est marquee 'Dynamic server-rendered on demand', seule page publique non statique. Chaque visite declenche un appel serveur->proxy->Express->repo pour une FAQ qui change rarement (geree depuis le CRM).
- **Impact :** TTFB plus eleve et charge serveur a chaque hit sur /cpf (landing CPF a forte intention commerciale), alors que toutes les autres pages publiques sont servies en statique instantane. Pas de cache CDN possible sur cette page tant qu'elle est dynamique.
- **Recommandation :** Remplacer cache:'no-store' par une revalidation ISR : fetch(url, { next: { revalidate: 300 } }) (ou export const revalidate = 300 sur la page), ce qui rend /cpf statique avec rafraichissement periodique. Garder le fallback mock data/site.ts pour le build. Si besoin d'instantaneite, ajouter une revalidation a la demande (revalidatePath/revalidateTag) cote CRM plutot que no-store global.
- **Fichiers :** `lib/faq.ts:10-26`, `app/cpf/page.tsx:7`, `app/cpf/page.tsx:14-15`
- **Vérifié :** Lecture lib/faq.ts:10-26 (no-store) + app/cpf/page.tsx:7,14-15 (await getFaqEntries) ; build prod montre 'ƒ /cpf 2.33 kB 131 kB' = Dynamic, toutes les autres pages publiques en Static/SSG.

#### 🟡 `PERF-04` Image hero en JPEG 204 kB sans config next/image (formats AVIF/WebP, qualite, tailles)
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Images / LCP

- **Problème :** public/loden-hero.jpg pese 204 kB et est l'unique vraie image du site, servie via next/image avec priority dans HeroSection.tsx:39-46 (desktop) et :111-118 (mobile). next.config.mjs ne contient aucune cle 'images' (pas de formats, deviceSizes, qualite). Par defaut next/image optimise en WebP a la volee, mais sans AVIF active ni reglage de qualite, et la source reste un JPEG non optimise en amont.
- **Impact :** Le hero etant l'element visuel principal (et concurrent du H1 pour le LCP), une source plus legere + AVIF reduirait le poids du chemin critique. Sur mobile l'image fait min-h-[360px] avec sizes=100vw : un AVIF bien dimensionne peut diviser le poids par 2-3 vs le JPEG actuel.
- **Recommandation :** 1) Activer AVIF: images: { formats: ['image/avif','image/webp'] } dans next.config. 2) Re-encoder/compresser loden-hero.jpg source (objectif <120 kB). 3) Verifier que les attributs sizes desktop ('(min-width:1536px) 70vw, 80vw') et mobile (100vw) generent bien des variantes responsives. 4) Conserver priority (deja present). Gain estime: -100 a -150 kB sur le chemin critique mobile.
- **Fichiers :** `public/loden-hero.jpg`, `components/HeroSection.tsx:39-46`, `components/HeroSection.tsx:111-118`, `next.config.mjs`
- **Vérifié :** ls -la public/loden-hero.jpg => 204432 octets ; lecture HeroSection.tsx:39-46 et 111-118 (next/image, priority, sizes) ; grep 'images' next.config.mjs => aucune config.

#### 🟡 `PERF-05` Cockpit /admin: ~11 requetes API au mount avec donnees redondantes (CockpitStats + 10 fetch AdminDashboard)
**Sévérité :** P2 · **Effort :** M · **Catégorie :** Data fetching / Requetes

- **Problème :** app/admin/page.tsx rend a la fois <CockpitStats/> (1 fetch /api/admin/stats aggrege) ET <AdminDashboard/> qui, au mount, fait Promise.all de 10 fetch (AdminDashboard.tsx:793-803: /api/auth/me, /api/contact-requests, /api/cpf/requests, /api/bookings, /api/payments, /api/reviews, /api/users, /api/students, /api/instructors, /api/leads). Soit ~11 allers-retours via le proxy Next->Express, dont une partie recoupe deja les KPI calcules par /api/admin/stats.
- **Impact :** Temps d'affichage du cockpit allonge (11 round-trips proxy a chaque ouverture), charge backend et duplication de calcul. Page protegee (noindex, derriere auth) donc pas d'impact CWV/SEO public, mais UX interne lente et pattern a unifier.
- **Recommandation :** Faire converger vers le pattern moderne CockpitStats (/api/admin/stats deja aggrege). Pour AdminDashboard, charger les listes a la demande par onglet (lazy/au clic) plutot que tout au mount, ou creer un endpoint agrege dedie. Au minimum, ne pas re-fetch ce que CockpitStats expose deja. Ajouter un skeleton/loading.tsx.
- **Fichiers :** `app/admin/page.tsx`, `components/AdminDashboard.tsx:793-803`, `components/crm/CockpitStats.tsx`
- **Vérifié :** Lecture app/admin/page.tsx (rend CockpitStats + AdminDashboard) ; AdminDashboard.tsx:793-803 (Promise.all de 10 fetch) ; CockpitStats fait 1 fetch (grep -c fetch components/crm/CockpitStats.tsx => 1).

#### 🔵 `PERF-06` Aucun route-level streaming / loading.tsx (hors /paiement) -> pas de feedback pendant le mount des composants client data-driven
**Sévérité :** P3 · **Effort :** M · **Catégorie :** Rendu / UX percue

- **Problème :** find app -name loading.tsx => aucun fichier. Seul app/paiement utilise <Suspense>. Les composants client qui fetchent au mount (BookingCalendar sur la home via /api/bookings/slots, espace-eleve, admin) n'ont pas de squelette de chargement route-level ; le contenu apparait via fallback puis remplacement en useEffect.
- **Impact :** Sur la home, BookingCalendar affiche d'abord des creneaux fallback puis bascule sur les creneaux API (leger changement visuel, possible micro-CLS dans la grille de jours). Sur les pages CRM/espace-eleve, absence de skeleton => ressenti de latence et flash de contenu vide. Impact CWV reel limite (la home reste statique), surtout perception.
- **Recommandation :** Ajouter des loading.tsx (skeletons) sur les routes data-lourdes (/admin*, /espace-eleve) et reserver la hauteur des zones qui se remplissent en client (BookingCalendar) pour eviter tout CLS. Optionnel: etat 'chargement' explicite dans BookingCalendar plutot qu'un fallback qui change.
- **Fichiers :** `app/`, `components/BookingCalendar.tsx:103-128`
- **Vérifié :** find app -name 'loading.tsx' => vide ; grep Suspense app => seulement app/paiement/page.tsx ; BookingCalendar.tsx:103-128 fetch /api/bookings/slots en useEffect avec fallbackDays puis setRemoteDays.

#### 🟡 `PERF-07` Build production fragile sur .next obsolete: 'PageNotFoundError / Cannot find module' a la collecte de pages
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Build / CI

- **Problème :** Au premier 'next build' sur un .next preexistant (laisse par un dev server), la phase 'Collecting page data' a echoue avec [PageNotFoundError: Cannot find module for page: /api/ai/chat] puis 'Failed to collect page data'. Apres 'rm -rf .next', le build passe proprement (toutes les pages generees, First Load JS 102 kB partage). Le code des routes (app/api/ai/chat/route.ts etc.) est correct (simple proxyBackendJson).
- **Impact :** Risque de builds CI/CD non deterministes ou de faux echecs si le pipeline ne part pas d'un .next propre, ou si dev+build cohabitent sur le meme repertoire. Peut bloquer un deploiement (deploy:build) sans cause reelle de code.
- **Recommandation :** S'assurer que la pipeline (deploy:build / deploy:check) part toujours d'un .next vierge (nettoyage de .next avant 'next build', ou cache CI versionne par hash de lockfile). Ne jamais lancer 'next build'/'next start' sur le meme repertoire .next qu'un 'next dev' actif (ils se corrompent mutuellement, observe pendant l'audit).
- **Fichiers :** `app/api/ai/chat/route.ts`, `package.json`
- **Vérifié :** Test reel: 1er 'NODE_ENV=production npx next build' => PageNotFoundError /api/ai/chat,/api/ai/content-generator,/api/ai/lead-score + 'Failed to collect page data' ; apres 'rm -rf .next' => build OK avec tableau des routes ; lecture app/api/ai/chat/route.ts (code valide).

#### 🔵 `PERF-08` Proxy backend en cache:no-store systematique: aucune mutualisation/cache des donnees publiques
**Sévérité :** P3 · **Effort :** L · **Catégorie :** Data fetching / Cache

- **Problème :** lib/backend-proxy.ts:38 force cache:'no-store' sur TOUS les appels relayes vers Express. Correct pour les routes authentifiees/mutations, mais empeche toute mise en cache des donnees publiques peu volatiles (formations, tarifs, avis publies). Aujourd'hui les pages publiques contournent via les mocks data/site.ts (donc statiques), mais brancher l'API publique en SSG/ISR sera bloque par ce no-store global.
- **Impact :** Aucun impact immediat (pages publiques rendues depuis les mocks). Dette: si on branche /formations, /tarifs, /avis sur l'API reelle pour la fraicheur CRM, elles deviendront dynamiques (comme /cpf) au lieu d'ISR, augmentant TTFB et charge. La frontiere mock-vs-API est aussi un risque de divergence (le contenu public ne reflete pas le CRM).
- **Recommandation :** Differencier le cache par type d'appel: garder no-store pour auth/mutations, mais permettre un mode revalidation (next.revalidate) pour les GET publics, OU exposer des helpers serveur dedies (comme lib/faq.ts mais en ISR). A coupler avec la decision produit: brancher /formations, /tarifs, /avis sur l'API en ISR pour que le CRM pilote le contenu public.
- **Fichiers :** `lib/backend-proxy.ts:33-39`, `app/formations/page.tsx`, `app/tarifs/page.tsx`, `app/avis/page.tsx`
- **Vérifié :** Lecture lib/backend-proxy.ts:33-39 (cache:'no-store' en dur) ; pages publiques /formations,/tarifs,/avis rendent depuis data/site.ts (aucune fetch serveur: grep fetch app/*/page.tsx => seul cpf).

</details>

---

### SEO Local

_13 findings — 🔴 0 · 🟠 5 · 🟡 4 · 🔵 4_

Les fondations SEO techniques sont saines pour un site de cette taille : chaque page publique expose un title/description unique en francais (via export const metadata ou generateMetadata pour /formations/[slug]), un seul H1 par page (PageHero/HeroSection), un sitemap.ts + robots.ts fonctionnels (verifies en HTTP 200), un manifest, et du JSON-LD pertinent (LocalBusiness+DrivingSchool global, Course+Offer par formation, AggregateRating+Review sur /avis, FAQPage sur /cpf). Next genere automatiquement les Twitter Cards a partir de l'Open Graph (verifie dans le HTML rendu). Les pages admin sont correctement en noindex. Le probleme strategique majeur est l'ECART METIER : le perimetre annonce inclut un centre VTC et un centre CACES, mais AUCUNE page, slug, formation, ni donnee structuree ne couvre VTC/CACES — ces activites sont totalement non-referencables aujourd'hui. Cote SEO local, l'ancrage geographique est faible : 2 landing locales seulement (Paris 11, CPF Paris), liees uniquement depuis le footer (aucun maillage contextuel), pas de canonical sur aucune page, pas de coordonnees geo ni de lien Google Business Profile, et des mentions legales en placeholder (SIRET/agrement prefectoral manquants) qui plombent l'E-E-A-T. Le blog n'a pas d'articles reels (cartes pointant vers /formations), donc zero profondeur de contenu/fraicheur. Note : le serveur dev local renvoyait des 500 (cache .next corrompu par collision dev/build), mais le build de production reussit et le premier rendu propre confirmait le HTML SEO correct — ce n'est pas un bug de code SEO.

**Priorités de la dimension :**
- SEO-01 (P1) : Construire l'arborescence VTC et CACES (pages formations + slugs + JSON-LD + nav) — sans elle, deux verticales metier majeures sont invisibles dans Google.
- SEO-04 + SEO-03 (P1) : Deployer une vraie arborescence de pages villes/quartiers (Paris 11, Nation/12, Montreuil, Vincennes) ALIGNEE sur areaServed et les 2 points de RDV, et les mailler contextuellement (cocon) au lieu d'un simple lien footer.
- SEO-02 (P1) : Ajouter des canonicals sur toutes les pages (via un helper buildMetadata) pour eviter le contenu duplique et la dilution de PageRank.
- SEO-05 (P1) : Lancer un vrai blog editorial (/blog/[slug]) ciblant les requetes informationnelles permis/code/CPF/VTC/CACES pour batir l'autorite thematique et la fraicheur.
- SEO-07 + SEO-06 (P2) : Enrichir le LocalBusiness (geo, OpeningHoursSpecification, lien Google Business Profile dans sameAs) et completer les mentions legales reelles (SIRET, agrement prefectoral) pour la coherence NAP/GBP et l'E-E-A-T.

<details><summary>Voir les 13 findings détaillés</summary>

#### 🟠 `SEO-01` VTC et CACES totalement absents du site malgre le perimetre metier (non-referencables)
**Sévérité :** P1 · **Effort :** L · **Catégorie :** Arborescence / couverture mots-cles

- **Problème :** Le perimetre annonce comprend 'centre CACES + centre VTC + formations pro', mais aucune page, slug de formation, donnee, ni schema ne mentionne VTC ou CACES. data/site.ts ne contient que des slugs permis/code (permis-b, permis-b-manuel, permis-b-automatique, boite-automatique, conduite-accompagnee, permis-accelere, code-en-ligne, stage-code, annulation-permis, perfectionnement, pack-cpf). Le sitemap (25 URLs) n'expose aucune URL VTC/CACES. Aucun formulaire devis VTC/CACES.
- **Impact :** Deux verticales metier (formation VTC, formation CACES/cariste/nacelle) sont 100% invisibles dans Google. Tout le trafic de recherche 'formation VTC Paris', 'CACES R489 Paris', 'centre de formation CACES', 'formation taxi VTC CPF' est perdu. Ce sont des requetes a forte intention commerciale et souvent finançables CPF — un manque a gagner direct sur le coeur de la strategie 'reference locale'.
- **Recommandation :** Creer une arborescence dediee : /formations/vtc (et sous-pages: formation-vtc, examen-vtc, renouvellement-carte-vtc) et /formations/caces (R489 chariots, R486 nacelles, R482 engins de chantier). Ajouter les formations correspondantes dans data/site.ts (slug, mode, prix, cpf:true) + backend catalog, generer le JSON-LD Course/Service par formation, et des pages villes 'formation-vtc-paris', 'centre-caces-paris'. Ajouter ces verticales a navItems et au footer.
- **Fichiers :** `data/site.ts:150-280`, `app/sitemap.ts:4-26`, `app/formations/[slug]/page.tsx:13-31`
- **Vérifié :** Lecture code : grep -in 'vtc|caces|taxi|cariste|nacelle' data/site.ts => aucun resultat ; grep 'slug:' data/site.ts => 11 slugs permis/code uniquement ; sitemap.xml en HTTP 200 => 25 URLs, 0 VTC/CACES. app/sitemap.ts:26 mappe uniquement formations de data/site.ts.

#### 🟠 `SEO-02` Aucune balise canonical sur aucune page du site
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Technique / indexation

- **Problème :** Aucune page n'emet de <link rel="canonical">. grep 'canonical|alternates' sur tout app/**/*.tsx => 0 resultat, et verifie sur le HTML rendu de /formations/permis-b-manuel (pas de rel=canonical dans le head). metadataBase est bien defini (app/layout.tsx:12) mais aucune page ne declare metadata.alternates.canonical.
- **Impact :** Risque de contenu duplique / dilution de signal sur les variantes d'URL (parametres de tracking utm, trailing slash, http/https, www/non-www, query de filtres sur /formations). Google choisit lui-meme l'URL canonique, ce qui peut faire indexer une mauvaise variante et fragmenter le PageRank — particulierement penalisant en SEO local concurrentiel.
- **Recommandation :** Ajouter alternates: { canonical: '<url absolue de la page>' } dans chaque export const metadata et dans generateMetadata de /formations/[slug] (canonical = `/formations/${slug}`). metadataBase etant deja pose, un chemin relatif suffit. Centraliser via un helper buildMetadata(path).
- **Fichiers :** `app/layout.tsx:11-49`, `app/formations/[slug]/page.tsx:17-31`, `app/a-propos/page.tsx:1-5`
- **Vérifié :** Lecture code : grep -rn 'canonical|alternates' app => vide. Test rendu : curl du HTML rendu (premier next start propre) puis parsing head => 'rel=canonical' absent.

#### 🟠 `SEO-03` Landing pages locales orphelines : maillage interne quasi inexistant
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Maillage interne / SEO local

- **Problème :** Les deux landing locales (/permis-b-paris-11, /auto-ecole-cpf-paris) ne sont liees QUE depuis le footer (section 'Guides locaux', components/Footer.tsx). grep des deux slugs dans app/ et components/ => seules occurrences = leurs propres fichiers + footer. Aucun lien contextuel depuis la home, /formations, /cpf, /tarifs ou les fiches formation. La landing /permis-b-paris-11 ne renvoie meme pas vers /formations/permis-b-manuel.
- **Impact :** Les pages locales — coeur de la strategie de reference locale — reçoivent un PageRank interne minimal (un seul lien sitewide footer, considere comme boilerplate par Google). Elles remonteront mal sur 'auto-ecole Paris 11', 'permis B republique'. Pas de cocon semantique entre pages thematiques (CPF, formations) et pages geographiques.
- **Recommandation :** Construire un maillage en cocon : depuis /cpf lier vers /auto-ecole-cpf-paris ; depuis /formations/permis-b-manuel et /formations/permis-b-automatique lier vers /permis-b-paris-11 ; depuis la home ajouter un bloc 'LODEN pres de chez vous' listant les pages villes. Et reciproquement : chaque landing locale doit lier vers 2-3 fiches formation et la page tarifs/CPF avec ancres descriptives.
- **Fichiers :** `app/permis-b-paris-11/page.tsx:55-66`, `app/auto-ecole-cpf-paris/page.tsx:60-65`, `components/Footer.tsx:45-58`, `data/site.ts:40-52`
- **Vérifié :** Lecture code : grep -rln 'permis-b-paris-11|auto-ecole-cpf-paris' app components => uniquement les 2 fichiers de page + components/Footer.tsx (via localSeoPages data/site.ts:40-52). app/permis-b-paris-11/page.tsx ne contient aucun Link vers /formations/*.

#### 🟠 `SEO-04` Couverture geographique minimale : une seule ville/quartier, pas de pages villes structurees
**Sévérité :** P1 · **Effort :** L · **Catégorie :** SEO local / arborescence

- **Problème :** Le LocalBusiness declare areaServed: ['Paris 11','Paris','Est parisien','Montreuil','Vincennes'] (app/layout.tsx:67) mais une seule landing de quartier existe (/permis-b-paris-11). Aucune page dediee Montreuil, Vincennes, Nation, ni autres arrondissements Est parisien, alors qu'un 2e point de rendez-vous Nation existe (data/site.ts:484).
- **Impact :** Le pack local Google (Map Pack) et les requetes 'auto-ecole Montreuil', 'auto-ecole Nation', 'permis B Vincennes' ne sont pas adressables. Concurrents locaux capteront ces requetes a fort taux de conversion. L'areaServed declare une zone que le site ne couvre pas editorialement => incoherence signal.
- **Recommandation :** Creer une arborescence villes/quartiers coherente avec areaServed et les 2 meeting points : /auto-ecole-paris-11, /auto-ecole-nation-paris-12, /auto-ecole-montreuil, /auto-ecole-vincennes. Chaque page : contenu unique (specificites locales de conduite, point de RDV, plan), JSON-LD LocalBusiness avec adresse du point, et maillage vers formations + CPF. Modeliser via un tableau localSeoPages enrichi pour eviter le boilerplate.
- **Fichiers :** `app/layout.tsx:67`, `data/site.ts:483-484`, `app/permis-b-paris-11/page.tsx:1-69`
- **Vérifié :** Lecture code : app/layout.tsx:67 areaServed liste 5 zones ; data/site.ts:483-484 declare 2 meeting points (Republique, Nation) ; find app -name page.tsx => une seule page quartier (permis-b-paris-11).

#### 🟠 `SEO-05` Blog sans articles reels : zero profondeur de contenu et zero fraicheur
**Sévérité :** P1 · **Effort :** L · **Catégorie :** Contenu / autorite

- **Problème :** /blog est une page unique avec 3 cartes statiques pointant vers /formations, /cpf et /formations/code-en-ligne (app/blog/page.tsx:17,23,29). Il n'existe aucune route /blog/[slug] ni article reel. Le sitemap n'expose donc aucun contenu editorial.
- **Impact :** Pas de pages de contenu informationnel pour capter le trafic top-of-funnel (ex: 'combien d'heures de conduite pour le permis', 'permis manuel ou automatique', 'comment financer le permis avec le CPF', 'reussir l'examen du code'). Ce contenu est essentiel pour l'autorite thematique (topical authority) et le maillage vers les pages transactionnelles. Pas de signal de fraicheur pour Google.
- **Recommandation :** Implementer un vrai blog (route /blog/[slug] + collection d'articles en MDX ou via le backend content module deja present). Cibler un calendrier editorial sur les mots-cles informationnels permis/code/CPF/VTC/CACES, avec Article/BlogPosting JSON-LD, fil d'Ariane et liens contextuels vers formations et landings locales.
- **Fichiers :** `app/blog/page.tsx:9-31`
- **Vérifié :** Lecture code : app/blog/page.tsx — articles est un tableau local (ligne ~9), tous les href pointent vers /formations|/cpf|/formations/code-en-ligne (lignes 17,23,29) ; find app -path '*blog*' name page.tsx => seul /blog/page.tsx, aucun [slug].

#### 🟡 `SEO-06` Mentions legales en placeholder : SIRET / agrement prefectoral manquants (E-E-A-T + conformite)
**Sévérité :** P2 · **Effort :** S · **Catégorie :** E-E-A-T / confiance

- **Problème :** app/mentions-legales/page.tsx affiche un texte placeholder : 'SIRET, forme juridique, capital social et numero d'agrement prefectoral : a completer avec les informations officielles de l'etablissement.' (ligne 17). Pour une auto-ecole, le numero d'agrement prefectoral est une obligation legale et un signal de confiance fort.
- **Impact :** Deficit d'E-E-A-T (trustworthiness) que Google valorise pour les secteurs YMYL/services reglementes. Absence d'informations entreprise verifiables = signal negatif pour le SEO local et pour la coherence avec Google Business Profile (qui exige ces donnees). Risque de conformite legale.
- **Recommandation :** Remplir les mentions legales reelles (raison sociale, SIRET, capital, agrement prefectoral, directeur de publication, hebergeur) et refleter ces donnees dans le JSON-LD (ajouter 'identifier'/'vatID' ou 'taxID' au LocalBusiness, ainsi que 'foundingDate' si pertinent).
- **Fichiers :** `app/mentions-legales/page.tsx:17`
- **Vérifié :** Lecture code : app/mentions-legales/page.tsx:17 contient le texte placeholder 'a completer avec les informations officielles'.

#### 🟡 `SEO-07` JSON-LD LocalBusiness sans coordonnees geo, sans openingHoursSpecification structuree, sans GBP
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Donnees structurees / SEO local

- **Problème :** Le LocalBusiness/DrivingSchool (app/layout.tsx:52-74) n'a pas de geo (GeoCoordinates lat/lng), pas de hasMap, openingHours en string libre 'Mo-Sa 08:00-20:00' (et non OpeningHoursSpecification), et sameAs ne liste qu'Instagram/Facebook — aucun lien vers la fiche Google Business Profile. Aucune coordonnee geo nulle part dans le code.
- **Impact :** Google s'appuie sur geo + GBP pour le local pack et la coherence NAP. Sans GeoCoordinates ni lien GBP dans sameAs, l'entite est moins facilement reconciliee avec la fiche Google => moins de chances d'apparaitre dans la Map et le Knowledge Panel. openingHours en string est moins fiablement parse qu'OpeningHoursSpecification.
- **Recommandation :** Ajouter geo: { '@type':'GeoCoordinates', latitude, longitude } (du 24 av. de la Republique), hasMap (URL Google Maps de la fiche), et l'URL de la fiche Google Business Profile dans sameAs. Convertir openingHours en openingHoursSpecification structure. Idem pour le 2e point Nation sur sa page ville dediee.
- **Fichiers :** `app/layout.tsx:52-74`
- **Vérifié :** Lecture code : app/layout.tsx:52-74 (objet organizationSchema) — pas de cle geo/hasMap ; openingHours:68 = string ; sameAs:70-73 = Instagram+Facebook uniquement. grep 'geo|GeoCoordinates|latitude' app => 0.

#### 🟡 `SEO-08` Pages transactionnelles/privees incluses dans le sitemap et indexables (connexion, paiement, inscription, espace-eleve)
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Technique / budget de crawl

- **Problème :** Le sitemap (app/sitemap.ts:4-22) inclut /connexion, /paiement, /inscription, /espace-eleve avec priorite 0.8. Or /connexion et /espace-eleve sont des pages privees/utilitaires sans valeur de recherche, et ne portent PAS de robots noindex (seules les pages /admin/* sont noindex — verifie). /paiement decrit un checkout 'sans paiement reel a ce stade'.
- **Impact :** Dilution du budget de crawl et risque d'indexer des pages a faible valeur/contenu mince, ce qui peut affaiblir la qualite percue du domaine. Une page de connexion indexee est un signal de mauvaise hygiene SEO.
- **Recommandation :** Retirer /connexion, /espace-eleve (et eventuellement /paiement, /inscription) du sitemap, et ajouter robots:{ index:false, follow:true } sur /connexion et /espace-eleve via leur metadata. Garder /inscription indexable seulement si elle porte un vrai contenu de conversion (sinon noindex).
- **Fichiers :** `app/sitemap.ts:4-22`, `app/connexion/page.tsx:1-5`, `app/espace-eleve/page.tsx:1-5`
- **Vérifié :** Lecture code : app/sitemap.ts:4-22 liste ces 4 routes. grep 'robots|noindex' app => robots present uniquement sur /admin/* et /not-found ; /connexion/page.tsx et /espace-eleve/page.tsx n'ont pas de robots. sitemap.xml HTTP 200 confirme les <loc> de /connexion, /paiement, /inscription, /espace-eleve.

#### 🟡 `SEO-09` FAQPage schema manquant sur la landing /auto-ecole-cpf-paris (FAQ presente mais sans donnees structurees)
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Donnees structurees / rich results

- **Problème :** La landing /auto-ecole-cpf-paris contient une vraie FAQ (cpfFaq, 3 Q/R, app/auto-ecole-cpf-paris/page.tsx:14-27) rendue en HTML inline, mais N'EMET PAS de JSON-LD FAQPage. Le composant FaqSection (qui genere le FAQPage schema) n'est utilise que sur /cpf (grep => seul app/cpf/page.tsx l'importe).
- **Impact :** Perte d'eligibilite aux rich results FAQ dans la SERP pour une page locale strategique (CPF Paris), alors que le contenu existe deja. Moins de surface SERP et de CTR.
- **Recommandation :** Reutiliser le composant FaqSection (ou injecter un safeJsonLd(FAQPage)) sur /auto-ecole-cpf-paris et sur les futures landings/fiches formation porteuses de FAQ. Mutualiser un composant FAQ unique qui rend a la fois l'UI et le schema.
- **Fichiers :** `app/auto-ecole-cpf-paris/page.tsx:14-27`, `app/auto-ecole-cpf-paris/page.tsx:69-86`, `components/FaqSection.tsx:19-37`
- **Vérifié :** Lecture code : app/auto-ecole-cpf-paris/page.tsx:14-27 (cpfFaq) + rendu lignes 76-84 sans script ld+json ; components/FaqSection.tsx:19-30 genere FAQPage ; grep 'FaqSection' app => seul app/cpf/page.tsx l'importe.

#### 🔵 `SEO-10` Pas de BreadcrumbList JSON-LD (fil d'Ariane absent du balisage et de l'UI)
**Sévérité :** P3 · **Effort :** S · **Catégorie :** Donnees structurees / navigation

- **Problème :** Aucun BreadcrumbList dans le code (grep 'BreadcrumbList' app components lib => 0). Les fiches formation /formations/[slug] et les landings n'ont ni fil d'Ariane visuel ni schema Breadcrumb.
- **Impact :** Perte des breadcrumbs enrichis dans la SERP (affichage du chemin au lieu de l'URL brute) => CTR moindre. Moins de signaux de structure de site pour Google sur des pages profondes (fiches formation).
- **Recommandation :** Ajouter un fil d'Ariane (Accueil > Formations > <Formation>) sur /formations/[slug] et les landings, avec le JSON-LD BreadcrumbList correspondant (positions + URLs absolues).
- **Fichiers :** `app/formations/[slug]/page.tsx:39-56`
- **Vérifié :** Lecture code : grep -rn 'BreadcrumbList' app components lib => aucun resultat ; app/formations/[slug]/page.tsx ne contient que Course schema (ligne 39-56), pas de breadcrumb.

#### 🔵 `SEO-11` Fiches formation : metadata sans Open Graph/image specifique ni canonical (heritage OG generique)
**Sévérité :** P3 · **Effort :** M · **Catégorie :** Open Graph / partage social

- **Problème :** generateMetadata de /formations/[slug] (app/formations/[slug]/page.tsx:27-30) ne definit que title+description ; aucun openGraph par formation. Les fiches heritent donc de l'OG global (image /loden-hero.jpg unique, titre OG generique 'LODEN Auto-École'). Next genere bien des Twitter Cards a partir de l'OG (verifie sur le HTML rendu), mais le titre/image OG ne reflete pas la formation.
- **Impact :** Partages sociaux et previews moins pertinents (toutes les formations affichent le meme visuel/titre OG). Impact mineur en SEO pur mais reel sur le CTR social et la coherence de marque.
- **Recommandation :** Dans generateMetadata, ajouter openGraph.title (titre de la formation), openGraph.description et idealement une image dediee par categorie de formation (ou une image OG dynamique via opengraph-image.tsx). Ajouter aussi le canonical (cf. SEO-02).
- **Fichiers :** `app/formations/[slug]/page.tsx:17-31`, `app/layout.tsx:27-42`, `public/loden-hero.jpg`
- **Vérifié :** Lecture code : app/formations/[slug]/page.tsx:27-30 retourne {title, description} seulement. Test rendu (premier next start propre) : og:title=LODEN Auto-École (generique), og:image herite de loden-hero.jpg ; public/loden-hero.jpg existe (204 Ko).

#### 🔵 `SEO-12` Icones limitees : favicon SVG seul, manifest avec une seule icone 64x64 (pas de PNG/maskable)
**Sévérité :** P3 · **Effort :** S · **Catégorie :** Technique / PWA / branding SERP

- **Problème :** app/layout.tsx:43-47 declare uniquement /favicon.svg pour icon/shortcut/apple. app/manifest.ts:12-19 ne liste qu'une icone SVG 64x64 'any'. public/ ne contient aucun PNG (ls public/*.png => aucun). Pas d'apple-touch-icon PNG, pas d'icone maskable, pas de 192/512 pour la PWA.
- **Impact :** Certains crawlers/agregateurs et iOS gerent mal les favicons SVG ; risque d'icone manquante dans les resultats Google (favicon dans la SERP mobile) et de PWA installable degradee. Impact branding mineur mais visible.
- **Recommandation :** Ajouter favicon.ico + apple-touch-icon.png (180x180) + icones PNG 192x192 et 512x512 (dont une maskable) dans public/, et les referencer dans metadata.icons et manifest.ts.
- **Fichiers :** `app/layout.tsx:43-47`, `app/manifest.ts:12-19`, `public/favicon.svg`
- **Vérifié :** Lecture code : app/layout.tsx:43-47 (svg uniquement) ; app/manifest.ts:12-19 (1 icone svg 64x64) ; ls public => seuls favicon.svg et loden-hero.jpg, aucun .png.

#### 🔵 `SEO-13` AggregateRating et reviewCount codes en dur (4.9 / 128) non synchronises avec les avis reels
**Sévérité :** P3 · **Effort :** M · **Catégorie :** Donnees structurees / conformite rich results

- **Problème :** app/avis/page.tsx:21-26 declare aggregateRating ratingValue '4.9' / reviewCount '128' en dur, mais la liste review provient des testimonials mock (data/site.ts) et n'a manifestement pas 128 elements. Le ratingValue/reviewCount ne reflete donc pas des avis verifiables.
- **Impact :** Google exige que l'AggregateRating corresponde a des avis reellement affiches sur la page ; un decalage (128 declares vs poignee de temoignages affiches) peut entrainer une perte d'eligibilite aux etoiles rich results, voire une action manuelle pour 'donnees structurees trompeuses'.
- **Recommandation :** Calculer ratingValue et reviewCount a partir des avis reellement rendus (idealement issus du backend reviews / Google Reviews), et n'afficher l'AggregateRating que si les avis sources sont presents sur la page. Eviter les valeurs en dur.
- **Fichiers :** `app/avis/page.tsx:16-40`, `data/site.ts:7`
- **Vérifié :** Lecture code : app/avis/page.tsx:21-26 valeurs '4.9'/'128' en dur ; review:27-39 mappe testimonials (data/site.ts) dont le nombre ne correspond pas a 128.

</details>

---

### Securite

_13 findings — 🔴 1 · 🟠 5 · 🟡 5 · 🔵 2_

La posture securite de LODEN est globalement saine et au-dessus de la moyenne pour un projet de cette taille : JWT signe verifie cote API, RBAC fin par permission applique sur toutes les routes sensibles (teste : ELEVE recoit 403 sur students/users/admin, token forge rejete 401), passwordHash systematiquement retire des reponses via publicUser(), CORS en allowlist reellement appliquee (origine forgee rejetee), rate-limit global + limiteurs dedies login (10/min) et IA (20/min) actifs, Helmet complet cote API. Plusieurs items differes connus sont DEJA resolus : le token n'est plus en localStorage (cookie httpOnly loden_session pose par le proxy Next, aucun localStorage de token trouve), l'audit log EST implemente (createAuditLog memoire+Prisma). Restent des points reels a corriger : montant de paiement entierement controle par le client (un ELEVE cree un payment-intent FORMATION a 1 centime), CSP encore en Report-Only cote web donc non bloquante, flux reset-password/verify-email a l'etat de stub non fonctionnel (risque de fausse promesse de securite), audit log write-only sans route de lecture ni couverture des actions critiques (login, paiement, modif eleve), bypass du middleware admin avec un cookie au role forge (shell CRM rendu en 200, mais API protegee donc pas de fuite de donnees), absence de consentement RGPD explicite aux formulaires et absence totale de gestion des mineurs (conduite accompagnee des 15 ans). La cle Groq presente dans .env local est reelle et a faire tourner par precaution (jamais commitee dans l'historique git, verifie). Aucun upload de fichier n'existe (donc pas de faille upload, mais fonctionnalite manquante pour la digitalisation).

**Priorités de la dimension :**
- Calculer/valider les montants de paiement cote serveur a partir du pricingPlanId (aujourd'hui amountCents vient du client : ELEVE a paye 1 centime une formation a 1190 EUR) et durcir le flux Stripe avant toute mise en production du paiement
- Passer la CSP du frontend de Report-Only a enforce (sans unsafe-inline/unsafe-eval) pour reellement bloquer le XSS, et corriger frame-ancestors incoherent (none cote web vs self cote API)
- Soit retirer/cacher les routes reset-password & verify-email tant qu'elles sont des stubs non fonctionnels, soit implementer un vrai flux a token a usage unique expirant (risque utilisateur bloque + fausse securite)
- Exposer une route de lecture d'audit (audit.read existe deja sans endpoint) et tracer les actions critiques : login, echec login, paiement, remboursement, modification dossier eleve, changement de role
- Mettre en conformite RGPD : case de consentement + lien politique de confidentialite a chaque formulaire de collecte, gestion explicite des mineurs (date de naissance + consentement representant legal pour la conduite accompagnee des 15 ans)

<details><summary>Voir les 13 findings détaillés</summary>

#### 🔴 `SEC-01` Montant de paiement controle par le client (integrite paiement)
**Sévérité :** P0 · **Effort :** M · **Catégorie :** Paiement / Integrite

- **Problème :** L'endpoint POST /api/payments/payment-intents accepte amountCents directement depuis le body sans le derive du pricingPlanId. Le serveur ne recalcule jamais le prix a partir du plan tarifaire. Un eleve peut donc creer un paiement de formation pour un montant arbitraire.
- **Impact :** Fraude au paiement : un eleve regle une formation a 1190 EUR pour 1 centime. Meme si Stripe est aujourd'hui en mode mock (aucun package stripe installe, stripePaymentIntentId='pi_mock_...'), cette logique deviendra exploitable en reel des l'integration Stripe et le webhook stripe/webhook est lui aussi un stub sans verification de signature.
- **Recommandation :** Cote serveur, deriver amountCents du pricingPlanId/formationId charge depuis le repository, ignorer tout montant fourni par le client. Implementer la verification de signature du webhook Stripe (stripe.webhooks.constructEvent) avant de marquer un paiement PAYE. Ne marquer PAYE que sur evenement webhook signe, jamais sur appel client.
- **Fichiers :** `backend/src/modules/payments/payments.routes.ts:95-128`, `backend/src/modules/payments/payments.routes.ts:130-136`, `backend/src/modules/payments/payments.routes.ts:13-19`
- **Vérifié :** Test curl: ELEVE authentifie -> POST /api/payments/payment-intents {"pricingPlanId":"plan-permis-b","amountCents":1} -> 201 avec amountCents:1. Lecture code backend/src/modules/payments/payments.routes.ts:95-128 (le handler reutilise body.amountCents tel quel) et :130-136 (webhook stub sans verif signature).

#### 🟠 `SEC-02` CSP frontend en Report-Only (non bloquante) avec unsafe-inline/unsafe-eval
**Sévérité :** P1 · **Effort :** L · **Catégorie :** Entetes / XSS

- **Problème :** Le frontend Next n'envoie qu'un en-tete Content-Security-Policy-Report-Only ; aucune CSP applicable (enforce). De plus la policy autorise script-src 'unsafe-inline' 'unsafe-eval', ce qui annulerait quasiment toute protection meme une fois passee en enforce.
- **Impact :** Aucune protection navigateur contre l'injection de script (XSS) sur les pages publiques et le CRM, alors meme que l'app sert du contenu issu de formulaires et de l'IA. Item explicitement marque differe dans la roadmap securite et toujours non resolu.
- **Recommandation :** Passer a Content-Security-Policy (enforce) apres une phase de collecte des rapports. Supprimer 'unsafe-eval' et remplacer 'unsafe-inline' par des nonces/hashes (Next 15 supporte les nonces via middleware). Harmoniser frame-ancestors (voir SEC-09).
- **Fichiers :** `next.config.mjs:3`, `next.config.mjs:25`
- **Vérifié :** Test curl: curl -sI http://localhost:3000/ -> seul 'Content-Security-Policy-Report-Only' present, pas de 'Content-Security-Policy'. Lecture next.config.mjs:3 (commentaire 'CSP de depart en Report-Only') et :25 (key 'Content-Security-Policy-Report-Only').

#### 🟠 `SEC-03` Flux reset-password / verify-email a l'etat de stub non fonctionnel
**Sévérité :** P1 · **Effort :** L · **Catégorie :** Authentification

- **Problème :** POST /api/auth/forgot-password, /reset-password et /verify-email valident le body puis renvoient un message de succes (200/202) sans envoyer d'email, sans generer ni verifier de token a usage unique, sans modifier le mot de passe.
- **Impact :** Un utilisateur qui perd son mot de passe est definitivement bloque (aucune recuperation reelle), et l'API laisse croire que le flux fonctionne (fausse promesse de securite). reset-password accepte n'importe quel token >=16 caracteres sans le valider contre un stockage.
- **Recommandation :** Soit retirer ces routes/UI tant qu'elles ne sont pas implementees, soit implementer un vrai flux : token aleatoire haute entropie hashe en base, expiration courte (15-30 min), usage unique, envoi via le mailer Resend deja present, invalidation des sessions a la reinitialisation.
- **Fichiers :** `backend/src/modules/auth/auth.routes.ts:105-129`
- **Vérifié :** Lecture code backend/src/modules/auth/auth.routes.ts:105-129 : forgot-password renvoie {ok:true} sans effet ; reset-password renvoie 202 'Flux reset pret pour integration' sans verifier le token ni changer le hash ; verify-email idem.

#### 🟠 `SEC-04` Audit log write-only : aucune route de lecture, couverture limitee aux actions IA
**Sévérité :** P1 · **Effort :** M · **Catégorie :** Tracabilite / RGPD

- **Problème :** La couche audit (createAuditLog/listAuditLogs) est bien implementee (memoire + Prisma) et la permission audit.read existe, mais AUCUN endpoint ne sert listAuditLogs et seules les actions de l'agent IA (create_lead, request_appointment, book_appointment) sont journalisees. Les actions sensibles classiques ne le sont pas.
- **Impact :** Impossible pour un admin de consulter la piste d'audit. Aucune tracabilite des connexions/echecs de connexion, des paiements et remboursements, des modifications de dossier eleve, des changements de statut, ce qui est attendu en RGPD (responsabilite/accountability) et pour la securite operationnelle d'un CRM.
- **Recommandation :** Exposer GET /api/admin/audit (ou /api/audit) garde par requirePermission('audit.read') s'appuyant sur listAuditLogs. Ajouter des appels createAuditLog sur login/echec login, creation/maj/remboursement de paiement, maj dossier eleve, changement de role, suppressions. Inclure userId, IP, user-agent.
- **Fichiers :** `backend/src/repositories/loden-repository.ts:156-157`, `backend/src/ai/tools.ts:141`, `backend/src/domain/permissions.ts:57`
- **Vérifié :** grep: 'NO route calls listAuditLogs' (aucun module n'appelle listAuditLogs). Lecture backend/src/repositories/loden-repository.ts:156-157 (interface) et memory-loden-repository.ts:584-590 (impl). createAuditLog appele uniquement dans backend/src/ai/tools.ts (3 occurrences).

#### 🟠 `SEC-05` Absence de consentement RGPD et de mention de finalite aux points de collecte
**Sévérité :** P1 · **Effort :** M · **Catégorie :** RGPD

- **Problème :** Aucun des formulaires de collecte de donnees personnelles (StudentRegistrationForm, ContactForm, CpfRequestForm) ne comporte de case de consentement, de lien vers la politique de confidentialite, ni d'indication de finalite/base legale. Aucune banniere de consentement cookies / CMP n'a ete trouvee dans le code.
- **Impact :** Non-conformite RGPD a la collecte (information de la personne, base legale, consentement marketing). Les contacts deviennent automatiquement des Leads en CRM (profilage/prospection) sans consentement explicite. Risque de sanction CNIL et d'atteinte a l'image pour une 'reference locale'.
- **Recommandation :** Ajouter a chaque formulaire une case de consentement non pre-cochee avec lien vers /confidentialite et mention de finalite. Implementer une banniere de consentement cookies si des cookies non essentiels (analytics/marketing) sont ajoutes. Documenter la base legale par traitement et la duree de conservation.
- **Fichiers :** `components/StudentRegistrationForm.tsx`, `components/ContactForm.tsx`, `components/CpfRequestForm.tsx`, `backend/src/modules/contacts/contacts.routes.ts:28-46`
- **Vérifié :** grep sur components/StudentRegistrationForm.tsx / ContactForm.tsx / CpfRequestForm.tsx : aucune occurrence de consent/checkbox/politique/j'accepte. grep consent|cookie-banner|CMP sur components/ et app/ : aucun composant de consentement. Pages /confidentialite, /cookies, /mentions-legales existent (presence verifiee).

#### 🟠 `SEC-06` Aucune gestion des mineurs (conduite accompagnee des 15 ans)
**Sévérité :** P1 · **Effort :** M · **Catégorie :** RGPD / Conformite

- **Problème :** L'inscription ne collecte ni date de naissance ni statut mineur/majeur et ne prevoit aucun consentement du representant legal, alors que la conduite accompagnee (AAC) demarre des 15 ans (donnees de mineurs).
- **Impact :** Traitement de donnees de mineurs sans le consentement/l'autorisation du titulaire de l'autorite parentale (art. 8 RGPD, seuil 15 ans en France). Risque de non-conformite et impossibilite metier de gerer correctement les dossiers AAC.
- **Recommandation :** Ajouter la date de naissance au modele eleve, declencher un parcours specifique pour les mineurs (champ representant legal + consentement parental, mention dediee). Adapter les CGV/mentions.
- **Fichiers :** `components/StudentRegistrationForm.tsx`, `backend/src/modules/auth/auth.routes.ts:15-22`
- **Vérifié :** grep mineur|parental|naissance|birth|15 ans sur components/StudentRegistrationForm.tsx et app/inscription/ : aucune occurrence. data/site.ts mentionne la conduite accompagnee des 15 ans (slug conduite-accompagnee) sans collecte d'age cote inscription.

#### 🟡 `SEC-07` Chat IA public non authentifie consommant une cle API payante
**Sévérité :** P2 · **Effort :** M · **Catégorie :** Abus / Cout

- **Problème :** POST /api/ai/chat est ouvert sans authentification ni CAPTCHA et declenche un agent a outils (jusqu'a 4 steps + appel final) sur le provider Groq facture. Seule protection : un rate-limit IP de 20 req/min.
- **Impact :** Exposition au scraping de cout et au DoS economique : un attaquant via plusieurs IP peut epuiser le quota Groq / generer des couts. L'agent peut aussi creer des leads (create_lead, request_appointment) => pollution du pipeline CRM par des prospects fictifs.
- **Recommandation :** Ajouter une protection anti-abus (CAPTCHA invisible/Turnstile ou jeton de session court emis par la page), reduire la fenetre/seuil de rate-limit IA, et plafonner le nombre de leads creables par IP/heure. Surveiller la consommation Groq.
- **Fichiers :** `backend/src/modules/ai/ai.routes.ts:84-114`, `backend/src/modules/ai/ai.routes.ts:59-67`, `backend/src/ai/tools.ts:107-194`
- **Vérifié :** Test curl: POST /api/ai/chat sans Authorization -> 200 avec reponse generee (l'IA repond, la cle Groq est bien chargee dans le process). Lecture backend/src/modules/ai/ai.routes.ts:84-114 (route /chat sans authenticate) et :59-67 (rate-limit IA 20/min). Outils publics create_lead/request_appointment dans backend/src/ai/tools.ts:107-194.

#### 🟡 `SEC-08` Bypass du middleware admin avec un cookie au role forge (shell CRM rendu)
**Sévérité :** P2 · **Effort :** M · **Catégorie :** Authentification / Defense en profondeur

- **Problème :** middleware.ts decode le claim 'role' du JWT SANS verifier la signature (decodeJwtRole). Un cookie loden_session forge avec role=SUPER_ADMIN et une signature bidon passe le garde et fait rendre les pages /admin (HTTP 200).
- **Impact :** Le shell du CRM (structure, libelles, intitules de KPI) est rendu a un visiteur non authentifie qui forge un cookie. Aucune donnee reelle ne fuit (toutes les requetes API sont rejetees 401 car la signature est verifiee cote Express), mais c'est une faiblesse de defense en profondeur, trompeuse, et a risque si une page admin venait a faire du fetch SSR sans Authorization valide.
- **Recommandation :** Verifier la signature du JWT dans le middleware (jose/jwtVerify avec le secret partage, compatible edge) ou appeler /api/auth/me pour valider la session avant de rendre /admin. A minima, s'assurer qu'aucune page /admin ne charge de donnees sensibles cote serveur sur la seule foi du cookie non verifie.
- **Fichiers :** `middleware.ts:7-17`, `lib/auth-session.ts:27-38`
- **Vérifié :** Test curl: cookie loden_session avec payload {role:SUPER_ADMIN} et signature 'fakesignature' -> GET http://localhost:3000/admin = 200 ; sans cookie = 307 (redirect /connexion) ; meme token forge sur GET http://localhost:4000/api/admin/stats = 401. Lecture middleware.ts:7-17 et lib/auth-session.ts:27-38 (decode sans verif).

#### 🟡 `SEC-09` Absence de protection CSRF dediee (dependance unique a SameSite=Lax) et frame-ancestors incoherent
**Sévérité :** P2 · **Effort :** M · **Catégorie :** CSRF / Entetes

- **Problème :** L'authentification CRM/eleve repose sur le cookie httpOnly loden_session que le proxy Next rattache automatiquement en Bearer pour toute requete sans en-tete Authorization (backend-proxy.ts). Aucun token CSRF / double-submit n'est present ; la seule protection des routes POST/PATCH est SameSite=Lax. Par ailleurs frame-ancestors vaut 'none' cote web (Report-Only) mais 'self' cote API et X-Frame-Options=SAMEORIGIN.
- **Impact :** SameSite=Lax bloque l'envoi du cookie sur les POST cross-site dans les navigateurs modernes, donc le risque CSRF est faible mais entierement porte par ce seul mecanisme (pas de defense en profondeur). L'incoherence frame-ancestors/X-Frame-Options peut laisser une marge de clickjacking selon le contexte une fois la CSP appliquee.
- **Recommandation :** Ajouter un token CSRF (double-submit cookie ou en-tete custom verifie par origin/referer cote Express) pour les mutations basees cookie. Uniformiser frame-ancestors a 'none' et conserver X-Frame-Options=DENY. Verifier l'en-tete Origin sur les routes mutantes du backend.
- **Fichiers :** `lib/backend-proxy.ts:27-31`, `app/api/auth/login/route.ts:12-18`, `next.config.mjs:25`
- **Vérifié :** Lecture lib/backend-proxy.ts:27-31 (repli automatique sur le cookie en Bearer) ; cookies poses sameSite:'lax' dans app/api/auth/login/route.ts:15, register, logout. Aucun csrf/csurf/double-submit trouve (grep). Entetes: curl -sI :3000 -> frame-ancestors 'none' (Report-Only) vs curl -sI :4000 -> frame-ancestors 'self'.

#### 🟡 `SEC-10` Token JWT renvoye dans le corps de reponse login/register en plus du cookie
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Authentification / Exposition token

- **Problème :** Le backend renvoie le JWT dans le JSON de /api/auth/login et /register, et le proxy Next relaie ce corps au client (LoginForm/StudentRegistrationForm lisent payload.token). Le token n'est utilise cote client que pour decoder le role et choisir la redirection, mais il transite et reste accessible en memoire JS.
- **Impact :** Affaiblit le benefice du cookie httpOnly : le token brut est expose au JavaScript de la page (donc a un eventuel XSS, d'autant que la CSP n'est pas enforce). Surface inutile une fois la session geree par cookie.
- **Recommandation :** Ne plus renvoyer le token dans le corps cote frontend : renvoyer uniquement {user} (et le role) au client, garder le token strictement dans le cookie httpOnly pose par la route proxy. Adapter LoginForm pour lire le role depuis user.role plutot que decodeJwtRole(payload.token).
- **Fichiers :** `backend/src/modules/auth/auth.routes.ts:78`, `backend/src/modules/auth/auth.routes.ts:93-94`, `components/LoginForm.tsx:43-51`, `app/api/auth/login/route.ts:10-19`
- **Vérifié :** Test curl: POST /api/auth/login -> corps JSON contient 'token':'eyJ...'. Lecture backend/src/modules/auth/auth.routes.ts:78 et :93-94 (token dans la reponse). Cote client components/LoginForm.tsx:43-51 et components/StudentRegistrationForm.tsx:84 lisent payload.token. La route proxy app/api/auth/login/route.ts:10-19 pose le cookie ET renvoie data complet (avec token).

#### 🟡 `SEC-11` Cle Groq reelle presente en .env local — a faire tourner par precaution
**Sévérité :** P2 · **Effort :** S · **Catégorie :** Secrets

- **Problème :** Une cle Groq active (prefixe gsk_, 56 caracteres) est presente dans le fichier .env local. Elle est correctement gitignoree et n'a jamais ete commitee dans l'historique git (verifie), mais l'item 'rotate Groq key' de la roadmap securite indique une exposition anterieure non confirmee comme traitee.
- **Impact :** Une cle Groq compromise permet l'usage du quota facture du compte. Aucune fuite git constatee, mais le principe de rotation apres tout soupcon d'exposition n'a pas ete trace comme fait.
- **Recommandation :** Faire tourner (revoquer + regenerer) la cle Groq cote console Groq, mettre a jour le secret sur le serveur via variable d'environnement (jamais en code), et documenter la rotation. Confirmer que la cle de prod n'est posee que via .env.production sur le VPS.
- **Fichiers :** `/Users/bahmamadou/Desktop/auto-ecole/.env`, `backend/src/ai/provider-factory.ts:13`, `backend/src/config/env.ts:22`
- **Vérifié :** grep gsk_/sk-/AKIA/AIza sur tout le code (hors node_modules) : aucune cle en dur dans le source. .env contient GROQ_API_KEY (longueur 56, prefixe gsk_). git check-ignore .env .env.production -> ignores. git log --all -S 'gsk_' -> aucun resultat (jamais commitee).

#### 🔵 `SEC-12` internalNotes ecrivable par un anonyme sur l'endpoint CPF public
**Sévérité :** P3 · **Effort :** S · **Catégorie :** Validation entrante

- **Problème :** POST /api/cpf/requests est public (pas d'auth) et son schema Zod accepte le champ internalNotes (note interne) fourni par le client anonyme. De meme la creation de contact/lead public derive automatiquement un Lead avec notes issues du message.
- **Impact :** Faible : un anonyme peut ecrire dans un champ destine a l'usage interne, ce qui peut polluer/usurper le contexte vu par le staff dans le CRM (ingenierie sociale legere). Pas de fuite ni d'elevation de privilege.
- **Recommandation :** Retirer internalNotes du schema public cpfRequestSchema (le reserver aux routes staff) et, plus generalement, separer les schemas d'entree publics des schemas internes pour ne jamais exposer de champs internes a la creation anonyme.
- **Fichiers :** `backend/src/modules/cpf/cpf.routes.ts:9-17`, `backend/src/modules/cpf/cpf.routes.ts:28-35`
- **Vérifié :** Lecture backend/src/modules/cpf/cpf.routes.ts:9-17 (cpfRequestSchema inclut internalNotes) et :28-35 (route POST /requests sans authenticate). Test curl: POST /api/cpf/requests sans token -> 201.

#### 🔵 `SEC-13` Formulaires publics (contact/CPF) sans rate-limit dedie ni anti-spam
**Sévérité :** P3 · **Effort :** S · **Catégorie :** Abus / Rate limiting

- **Problème :** Les endpoints publics POST /api/contact-requests et /api/cpf/requests ne disposent que du rate-limit global IP (120 req/min) ; contrairement a /api/auth/* (10/min) et /api/ai/* (20/min), aucun limiteur strict ni CAPTCHA n'est applique. Chaque contact cree aussi un Lead.
- **Impact :** Spam/flooding du pipeline CRM (jusqu'a ~7200 demandes/h/IP) et bruit d'emails de notification (notifyNewLead). Degrade la qualite operationnelle du CRM et peut servir de vecteur de harcelement.
- **Recommandation :** Ajouter un limiteur dedie plus strict sur ces routes publiques et une protection anti-bot (Turnstile/honeypot). Optionnel : deduplication des leads par email/fenetre temporelle.
- **Fichiers :** `backend/src/modules/contacts/contacts.routes.ts:28-46`, `backend/src/modules/cpf/cpf.routes.ts:28-35`, `backend/src/app.ts:50-57`
- **Vérifié :** Lecture backend/src/app.ts:50-57 (rate-limit global 120/min) ; backend/src/modules/contacts/contacts.routes.ts:28-46 et cpf.routes.ts:28-35 n'instancient aucun rateLimit dedie (contrairement a auth.routes.ts:49-55 et ai.routes.ts:59-67). Test curl: POST contact -> 201, POST cpf -> 201 sans throttle dedie.

</details>

---

### CRM / Backoffice

_10 findings — 🔴 0 · 🟠 5 · 🟡 3 · 🔵 2_

Le back-office /admin est nettement plus reel qu'une maquette: tous les modules CRM operationnels (CockpitStats, Pipeline, Planning, Exams, Finance, StudentsList, StudentFile, Reporting, FaqManager, AiAssistant/AiAgentChat) consomment de vraies API Express branchees sur le LodenRepository, avec ecriture reelle (PATCH/POST verifies en lecture de code + curl HTTP 200 sur /api/admin/stats, /api/leads, /api/students, /api/exams, /api/payments, /api/installments, /api/bookings). Les KPI du CockpitStats et du Reporting sont calcules cote serveur (stats.routes.ts) a partir des donnees reelles, et l'assistant IA (Groq) repond reellement avec actions outillees RBAC (reservation reelle, creation de prospect, recherche eleve) — verifie par curl. En revanche, plusieurs piliers metier annonces sont absents ou inertes: aucune gestion des moniteurs (instructors en lecture seule, pas de POST/PATCH, pas d'espace formateur), aucune inscription centralisee cote CRM (students en GET/PATCH uniquement, creation seulement via /register public), aucune gestion documentaire (modele StudentDocument present en base mais zero API/UI/upload), paiement integralement simule (aucun package stripe, pi_mock_*, pas de facture/PDF malgre invoiceUrl), relances/echeances sans automatisation (nextFollowUpAt stocke mais jamais affiche ni declenche, emails/SMS en stub log sans provider configure), et pas de drag&drop ni vue calendrier (selects partout). Le CRM permet donc deja de PILOTER (suivre, qualifier, encaisser manuellement, planifier, examiner) mais pas encore d'AUTOMATISER ni de couvrir tout le perimetre annonce (VTC/CACES totalement absents). Le composant AdminDashboard contient aussi 2 metriques codees en dur ("Taux de reussite 86%", "Examens 0") qui contredisent les vraies stats affichees ailleurs.

**Priorités de la dimension :**
- CRM-03 / CRM-02: rendre le dossier eleve reellement complet et centralise — permettre a l'admin/secretariat de CREER un eleve depuis le CRM et d'attacher/consulter les documents (StudentDocument existe en base mais aucune surface). C'est le coeur d'un CRM auto-ecole et c'est manquant.
- CRM-04: cesser de presenter un paiement simule comme reel — integrer Stripe (PaymentIntents + webhook signe) et generer des factures PDF/export comptable; sinon retirer la promesse 'paiement en ligne'.
- CRM-05: activer les relances et notifications (afficher/saisir nextFollowUpAt + vue 'relances du jour', configurer Resend/Brevo en prod, job planifie rappels RDV / relances impayes/CPF). La tuyauterie est prete, il manque config + declencheur.
- CRM-01: livrer la gestion des moniteurs et un veritable espace formateur (CRUD instructors, saisie des disponibilites, redirection MONITEUR vers /formateur) — actuellement totalement absent malgre le perimetre annonce.
- CRM-06 + CRM-07: corriger les KPI codes en dur (86% de reussite) qui mentent sur le dashboard, et ouvrir le CRUD catalogue (formations/tarifs via proxy+UI) — pre-requis pour introduire les offres VTC/CACES aujourd'hui inexistantes.

<details><summary>Voir les 10 findings détaillés</summary>

#### 🟠 `CRM-01` Aucune gestion des moniteurs ni espace formateur (perimetre annonce non couvert)
**Sévérité :** P1 · **Effort :** XL

- **Problème :** instructors.routes.ts n'expose aucune route d'ecriture (grep router.(post|patch|put|delete) = 0 resultat): les moniteurs proviennent uniquement du seed/initial-data et sont read-only. Le proxy Next /api/instructors est en GET seul. Aucun ecran d'ajout/edition de moniteur dans le CRM (AdminDashboard InstructorsView ligne 518 = affichage pur, mention 'planning a enrichir'). Aucune page espace formateur: ls app/ ne contient ni /formateur ni /moniteur, et LoginForm.tsx:51 redirige TOUT non-admin (donc role MONITEUR) vers /espace-eleve. Les disponibilites moniteur (Availability) ont bien une route POST cote bookings mais aucune UI CRM pour les saisir.
- **Impact :** Le perimetre metier promet un 'espace formateur' et la gestion des moniteurs: c'est inexistant. Impossible d'ajouter un nouveau moniteur, de gerer ses zones/specialites/disponibilites, ou de lui donner un espace dedie. Un moniteur connecte atterrit dans l'espace eleve, ce qui est cassant fonctionnellement.
- **Recommandation :** Ajouter CRUD moniteurs (POST/PATCH instructors + proxy Next + ecran CRM), une UI de saisie des disponibilites (Availability existe deja en base et en route POST bookings), et creer un espace formateur (/formateur) avec redirection LoginForm selon role MONITEUR (planning perso, eleves affectes, validation des heures).
- **Fichiers :** `backend/src/modules/instructors/instructors.routes.ts`, `components/AdminDashboard.tsx:518`, `components/LoginForm.tsx:51`, `app/`
- **Vérifié :** lecture code: backend/src/modules/instructors/instructors.routes.ts (aucune route ecriture, grep), components/AdminDashboard.tsx:518-544 (InstructorsView affichage seul), components/LoginForm.tsx:49-51 (redirection /espace-eleve), ls app/ (pas de dossier formateur/moniteur)

#### 🟠 `CRM-02` Pas d'inscription centralisee cote CRM (admin ne peut pas creer un eleve)
**Sévérité :** P1 · **Effort :** L

- **Problème :** students.routes.ts n'a que des GET et des PATCH (lignes 46,56,73,85,96,112) — aucun POST. Le proxy Next app/api/students n'expose que GET (route.ts) et GET/PATCH ([id]/route.ts). La SEULE creation d'eleve passe par auth.routes.ts:58-75 (/register public, self-service). Le CRM (StudentsList, StudentFile) ne propose aucun bouton 'Nouvel eleve / inscrire'.
- **Impact :** Un secretariat ne peut pas inscrire un eleve qui se presente au comptoir ou par telephone: il faut que l'eleve s'auto-inscrive en ligne. C'est un manque operationnel majeur pour une auto-ecole (la majorite des inscriptions sont assistees). L'inscription n'est donc PAS centralisee dans le CRM.
- **Recommandation :** Ajouter POST /students (creation user ELEVE + Student + rattachement formation/agence) garde par requirePermission('students.manage'), proxy Next, et un formulaire 'Nouvel eleve' dans StudentsList (avec generation de mot de passe / invitation par email).
- **Fichiers :** `backend/src/modules/students/students.routes.ts:46`, `app/api/students/route.ts:3`, `backend/src/modules/auth/auth.routes.ts:75`, `components/crm/StudentsList.tsx`
- **Vérifié :** lecture code: backend/src/modules/students/students.routes.ts (grep methods: GET/PATCH only), app/api/students/route.ts (GET only) + [id]/route.ts (GET+PATCH), backend/src/modules/auth/auth.routes.ts:75 (createStudent uniquement via register)

#### 🟠 `CRM-03` Gestion documentaire inexistante (StudentDocument en base, zero surface)
**Sévérité :** P1 · **Effort :** XL

- **Problème :** Le modele StudentDocument existe dans prisma/schema.prisma (ligne 225, relation Student.documents ligne 217) mais n'a AUCUNE route API, AUCUNE methode repository (grep listDocuments/createDocument = 0), aucun composant d'upload (grep document|upload|justificatif dans components/crm + app/admin = 0). La fiche eleve StudentFile.tsx ne montre aucune section documents. La 'completude dossier' se limite a un enum fileStatus (NOUVEAU/INCOMPLET/...) saisi manuellement, sans pieces jointes reelles.
- **Impact :** Impossible de stocker/consulter les pieces du dossier (CNI, ASSR, justificatif domicile, attestation CPF, photos). Pour une auto-ecole et surtout pour les dossiers CPF, c'est central. Le 'dossier complet' annonce est purement declaratif (un statut texte), pas un vrai coffre documentaire.
- **Recommandation :** Implementer l'upload/stockage de documents (route POST/GET /students/:id/documents + stockage objet S3/Cloudinary ou disque + repository), afficher une checklist de completude par type de document dans StudentFile, et brancher CpfRequest.missingDocuments (deja en base ligne 401) sur cette checklist.
- **Fichiers :** `prisma/schema.prisma:225`, `components/crm/StudentFile.tsx`, `backend/src/repositories/loden-repository.ts`
- **Vérifié :** lecture code: prisma/schema.prisma:217,225,401 (StudentDocument existe), grep StudentDocument/listDocuments/createDocument dans backend/src = 0 hors schema, grep document|upload dans components/crm + app/admin = 0, components/crm/StudentFile.tsx (pas de section documents)

#### 🟠 `CRM-04` Paiement entierement simule: pas de Stripe, pas de facture/PDF
**Sévérité :** P1 · **Effort :** XL

- **Problème :** Aucun package stripe (grep package.json = absent, grep new Stripe dans backend = 0). /api/payments/payment-intents renvoie un stripePaymentIntentId code en dur 'pi_mock_${Date.now()}' et clientSecret '..._secret_mock' (payments.routes.ts:118,124) — verifie en reel: GET /api/payments renvoie 'stripePaymentIntentId':'pi_mock_1780941070845'. Le webhook /stripe/webhook repond 202 sans verifier de signature (ligne 134). Le champ invoiceUrl existe (domain/types.ts:208, schema) mais n'est jamais genere: aucune generation de facture/PDF (grep invoice|facture|pdf = uniquement le champ stocke, pas de generateur).
- **Impact :** Aucun encaissement en ligne reel n'est possible (le paiement /paiement public est une coquille). En CRM, le module Finance ne fait qu'enregistrer manuellement des montants et generer des echeanciers en base — utile pour un suivi, mais ni paiement reel ni facture exportable/comptable. Risque commercial si presente comme 'paiement en ligne' au client.
- **Recommandation :** Integrer reellement Stripe (PaymentIntents + webhook signe pour passer EN_ATTENTE->PAYE), generer des factures PDF (numerotation + remplissage invoiceUrl), et ajouter un export comptable CSV. A defaut, retirer la promesse 'paiement en ligne' tant que c'est un mock.
- **Fichiers :** `backend/src/modules/payments/payments.routes.ts:96`, `package.json`, `backend/src/domain/types.ts:208`
- **Vérifié :** lecture code: backend/src/modules/payments/payments.routes.ts:118,124,131-134, grep stripe package.json (absent), curl GET /api/payments (pi_mock_1780941070845, status EN_ATTENTE), grep invoice|facture|pdf (champ seulement, pas de generateur)

#### 🟠 `CRM-05` Relances et notifications: stockees/declenchees mais sans automatisation ni provider actif
**Sévérité :** P1 · **Effort :** L

- **Problème :** Le pipeline a un statut RELANCE et un champ nextFollowUpAt (leads.routes.ts:28,34) mais: (a) la colonne Pipeline.tsx n'affiche jamais la date de relance ni de date d'echeance, ne permet pas de la saisir, et il n'y a AUCUN job/cron qui remonte les relances dues (grep cron/scheduler = neant). (b) Les emails (shared/mailer.ts) et SMS (shared/sms.ts) sont des adaptateurs qui, sans RESEND_API_KEY/SMS_API_KEY, se rabattent sur un simple console.log ('provider absent, non envoye') — en local rien n'est reellement envoye. (c) Le module 'communication' du CRM est marque status:'planned' (data/crm.ts:148) et rendu via PlannedModuleView (placeholder). Aucune relance impaye/CPF automatique.
- **Impact :** Le commercial ne voit pas quelles relances faire aujourd'hui, et aucun rappel RDV/relance paiement/CPF n'est envoye automatiquement. C'est l'un des principaux leviers de conversion d'une auto-ecole (ne pas perdre les prospects tiedes, recouvrer les impayes). Fonctionnellement, 'les relances prevues' n'existent pas operationnellement.
- **Recommandation :** Afficher/saisir nextFollowUpAt dans Pipeline + une vue 'relances dues aujourd'hui'; configurer un provider email/SMS reel (Resend/Brevo) en prod; ajouter un job planifie (rappels RDV J-1, relance prospect, relance echeance EN_RETARD). La tuyauterie mailer/sms est deja prete, il manque la config + le declencheur temporel.
- **Fichiers :** `backend/src/shared/mailer.ts:11`, `backend/src/shared/sms.ts:8`, `components/crm/Pipeline.tsx`, `data/crm.ts:142`
- **Vérifié :** lecture code: backend/src/modules/leads/leads.routes.ts:28,34 (nextFollowUpAt), components/crm/Pipeline.tsx (n'affiche/ne set pas la relance), backend/src/shared/mailer.ts:11-14 + sms.ts:8-10 (fallback log), data/crm.ts:142-152 (communication status planned), grep cron/scheduler = absent

#### 🟡 `CRM-06` Metriques codees en dur dans AdminDashboard (incoherence avec les vraies stats)
**Sévérité :** P2 · **Effort :** S

- **Problème :** Dans components/AdminDashboard.tsx OverviewView, deux cartes Metric sont en dur: ligne 397 'Examens programmes' value="0" detail='Module planifie phase 2', et ligne 398 'Taux de reussite' value="86%" detail='Indicateur cible a brancher examens'. Or l'API /api/admin/stats expose deja exams.total/upcoming/passRate (verifie: passRate=null car 0 examen), et le CockpitStats.tsx (affiche sur la meme page /admin, ligne 50) montre le vrai taux. La meme page affiche donc '86%' (faux, code en dur) ET le vrai indicateur cote CockpitStats.
- **Impact :** Indicateur de pilotage mensonger (86% de reussite affiche alors qu'il n'y a aucun examen en base). Perte de credibilite du cockpit et risque de decision sur des chiffres faux.
- **Recommandation :** Remplacer ces deux Metric par les valeurs de /api/admin/stats (exams.upcoming et exams.passRate) deja chargees ailleurs, ou supprimer ces cartes du dashboard pour ne garder que CockpitStats qui est correct.
- **Fichiers :** `components/AdminDashboard.tsx:397`, `components/crm/CockpitStats.tsx:50`
- **Vérifié :** lecture code: components/AdminDashboard.tsx:397-398 (valeurs en dur), components/crm/CockpitStats.tsx:50 (vrai passRate), curl GET /api/admin/stats -> exams.passRate=null

#### 🟡 `CRM-07` Pas de CRUD catalogue/formations dans le CRM (backend pret, proxy+UI manquants)
**Sévérité :** P2 · **Effort :** L

- **Problème :** Le backend expose bien POST /formations et PATCH /formations/:id gardes par catalog.manage (catalog.routes.ts:44-62), mais le proxy Next app/api/formations/route.ts n'expose que GET (pas de POST/PATCH relaye), et aucun ecran CRM ne gere les formations (le module 'content' AdminDashboard est PlannedModuleView, FaqManager ne couvre que la FAQ). Les pricing-plans n'ont meme pas de route d'ecriture cote backend (catalog.routes.ts = GET seul pour pricing-plans/tarifs).
- **Impact :** L'admin ne peut pas creer/modifier une formation ou un tarif depuis l'interface; tout changement de catalogue passe par le code (data/site.ts) ou la base directement. Frein a l'autonomie metier et au lancement de nouvelles offres (ex: VTC, CACES).
- **Recommandation :** Ajouter le proxy Next POST/PATCH /api/formations, un ecran CRM de gestion catalogue (formations + pricing-plans), et completer le backend avec POST/PATCH pricing-plans. Pre-requis indispensable pour introduire les offres VTC/CACES manquantes.
- **Fichiers :** `backend/src/modules/catalog/catalog.routes.ts:44`, `app/api/formations/route.ts:3`, `components/AdminDashboard.tsx:373`
- **Vérifié :** lecture code: backend/src/modules/catalog/catalog.routes.ts:44-62 (POST/PATCH formations existent), app/api/formations/route.ts (GET only), catalog.routes.ts:64-78 (pricing-plans/tarifs GET only), components/AdminDashboard.tsx:373 (content=PlannedModuleView)

#### 🟡 `CRM-08` Planning sans vue calendrier ni drag&drop; pipeline kanban sans glisser-deposer
**Sévérité :** P2 · **Effort :** XL

- **Problème :** Planning.tsx affiche une liste groupee par jour avec un simple <select> de statut (lignes 134-144) — pas de vue semaine/mois, pas de drag&drop, pas de creation de leçon depuis le planning. Pipeline.tsx et AdminDashboard SalesView changent l'etape via <select> (Pipeline.tsx:108-118), pas par glisser-deposer (grep draggable/onDrag/dnd = 0). data/crm.ts:80 promet 'Calendrier jour/semaine/mois' et le module bookings est etiquete 'foundation'. La detection de conflit moniteur existe cote serveur (bookings.routes.ts:74, ai/tools.ts:290) — point positif — mais n'est pas visualisee dans le planning.
- **Impact :** L'experience de planification reste rudimentaire face a un vrai logiciel d'auto-ecole (agenda visuel, deplacement de leçon, charge moniteur). Pas bloquant fonctionnellement (les actions marchent via selects) mais loin du 'pilotage CRM moderne' vise, et les conflits ne sont pas visibles avant tentative.
- **Recommandation :** Remplacer la liste par un agenda jour/semaine (composant calendrier) avec drag&drop des leçons, affichage des conflits/charges moniteur, et creation directe de leçon. Idem pipeline en kanban drag&drop. Le backend (slots, conflit, createBooking) est deja la pour alimenter cette UI.
- **Fichiers :** `components/crm/Planning.tsx:134`, `components/crm/Pipeline.tsx:108`, `backend/src/modules/bookings/bookings.routes.ts:74`
- **Vérifié :** lecture code: components/crm/Planning.tsx:134-144 (select, pas de DnD), components/crm/Pipeline.tsx:108-118 (select), grep draggable/onDrag/dnd dans components/crm+app/admin = 0, backend/src/modules/bookings/bookings.routes.ts:74 (conflit serveur OK)

#### 🔵 `CRM-09` Audit log ecrit mais sans aucune surface de consultation
**Sévérité :** P3 · **Effort :** M

- **Problème :** createAuditLog est bien appele lors des actions IA (ai/tools.ts:141,191,314) et la table AuditLog existe, mais aucune route d'API ne liste les logs (grep listAuditLog/'/audit' dans backend/src/modules = 0) et aucun ecran admin ne les affiche (grep audit dans app/+components = 0). Le module 'settings' (roles/permissions) reste un placeholder SettingsView (AdminDashboard.tsx:657).
- **Impact :** Tracabilite partielle: on ecrit des evenements mais l'admin ne peut pas les consulter (qui a reserve/cree quoi). Limite pour la conformite, le support et la securite operationnelle. La memoire projet liste deja 'audit log a faire' comme item differe.
- **Recommandation :** Exposer GET /audit-logs (filtrable par entite/utilisateur/date, permission dediee) + un ecran de consultation dans le CRM (onglet Securite/Parametres), et etendre l'audit aux mutations sensibles hors IA (changement de statut paiement, suppression, login admin).
- **Fichiers :** `backend/src/ai/tools.ts:141`, `components/AdminDashboard.tsx:657`
- **Vérifié :** lecture code: backend/src/ai/tools.ts:141,191,314 (createAuditLog appele), grep listAuditLog|/audit dans backend/src/modules = 0, grep audit dans app/+components/*.tsx = 0, components/AdminDashboard.tsx:657 (SettingsView placeholder)

#### 🔵 `CRM-10` AgencySwitcher: rechargement complet de page et filtrage partiel des indicateurs
**Sévérité :** P3 · **Effort :** M

- **Problème :** AgencySwitcher.tsx fait un window.location.reload() a chaque changement d'agence (ligne 34) et stocke la selection en localStorage (ligne 32). De plus le filtrage par agence est inegal: stats.routes.ts filtre students/leads/bookings/payments/exams par agencyId mais PAS les cpf (repository.listCpfRequests() sans scope, ligne 34) ni reviews (ligne 35) — donc CPF/avis restent globaux meme en vue agence. Le module Reporting compare par agence en faisant N appels /api/admin/stats (un par agence), ce qui herite de la meme limite.
- **Impact :** UX: un reload complet casse l'etat et clignote (pas premium). Coherence: en vue 'LODEN Republique', le compteur CPF/avis reste celui de tout le reseau, ce qui fausse la lecture par agence. Impact modere car le reste des KPI est bien filtre.
- **Recommandation :** Remplacer le reload par un contexte React/refetch cible; ajouter le filtrage agencyId sur cpfRequests et reviews dans stats.routes.ts (et au repository) pour une vue agence coherente.
- **Fichiers :** `components/AgencySwitcher.tsx:34`, `backend/src/modules/stats/stats.routes.ts:34`, `components/crm/Reporting.tsx:31`
- **Vérifié :** lecture code: components/AgencySwitcher.tsx:32-34 (reload + localStorage), backend/src/modules/stats/stats.routes.ts:34-35 (listCpfRequests()/listReviews(true) sans scope alors que les autres recoivent scope), components/crm/Reporting.tsx:31-37 (N appels stats)

</details>

---

_Rapport généré automatiquement à partir de l'audit multi-agents (run wgh02xrwd). Lecture seule — aucune modification de code n'a été effectuée._