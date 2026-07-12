# Checklist SEO externe — LODENE (comptes propriétaire)

> Actions qui **exigent vos identifiants** (Google, Bing, Apple…) : elles ne peuvent pas
> être faites depuis le dépôt. Tout est pré-rempli avec les **données réelles** de
> l'établissement. Cochez au fur et à mesure. Priorité locale : Conflans-Sainte-Honorine
> + communes dans ~50 km.
>
> ⚠️ **Règles absolues** : jamais de faux avis, faux chiffres, keyword stuffing, ni pages
> satellites. Aucune méthode ne garantit la 1ʳᵉ position — on maximise seulement les
> chances par des moyens légitimes.

## 0. Données officielles de référence (à réutiliser partout, à l'identique = « NAP »)

| Champ | Valeur exacte |
|---|---|
| Nom (marque) | **LODENE Auto-École** |
| Adresse | **30 rue Pierre Le Guen, 78700 Conflans-Sainte-Honorine** |
| Téléphone | **06 60 32 50 87** |
| Email | **ae@lodene.fr** |
| Site | **https://lodene.fr** |
| SIRET | 84282888100040 |
| Agrément préfectoral | E2507800260 |
| Horaires bureau | mar & mer 10h-12h / 14h-18h · jeu & ven 10h-12h / 14h-20h · sam 9h-12h / 13h-17h · fermé lun & dim |
| Cours pratiques | 7j/7, 8h-20h sur réservation |
| Zone desservie | Conflans-Sainte-Honorine, Herblay-sur-Seine, Andrésy, Achères, Poissy, Maurecourt, Cergy, Pontoise, Saint-Germain-en-Laye, Sartrouville, Maisons-Laffitte, Argenteuil |

> ⚠️ Le **NAP** (Nom-Adresse-Téléphone) doit être **strictement identique** sur tous les
> supports (site, GBP, Bing, PagesJaunes, annuaires). Toute variation nuit au SEO local.

### Données encore manquantes (à réunir avant publication définitive)
- [ ] Forme juridique + capital social (mentions légales)
- [ ] Nom du directeur de la publication
- [ ] Coordonnées GPS de l'agence → débloquera le `geo`/`GeoCoordinates` du JSON-LD
- [ ] Comptes réseaux sociaux officiels → débloquera le `sameAs` du JSON-LD
- [ ] Vérifier l'adresse légale de l'hébergeur Hostinger indiquée dans les mentions légales

---

## 1. Google Search Console (GSC) — indexation
- [ ] Créer/valider la propriété **https://lodene.fr** (idéalement propriété « Domaine » via DNS).
- [ ] Méthode balise HTML : récupérer le code, définir l'env **`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`** en prod, redéployer (la balise `<meta>` est injectée automatiquement par `app/layout.tsx`).
- [ ] Soumettre le sitemap : **https://lodene.fr/sitemap.xml**.
- [ ] Vérifier la redirection **lodene.org → lodene.fr** (301) et déclarer lodene.fr comme version canonique.
- [ ] Utiliser « Inspection d'URL » sur l'accueil + 3-4 pages clés → « Demander l'indexation ».
- [ ] Suivre : Couverture/Pages, Core Web Vitals, Ergonomie mobile, Résultats enrichis (Fil d'Ariane, FAQ, Avis).

## 2. Google Business Profile (GBP) — **levier local n°1**
- [ ] Créer/revendiquer la fiche **LODENE Auto-École** à l'adresse ci-dessus ; recevoir le code de validation (courrier/téléphone).
- [ ] Catégorie principale : **Auto-école**. Catégories secondaires pertinentes : *Centre de formation professionnelle*, et selon l'offre réelle *École de conduite VTC*, *Organisme de formation*.
- [ ] Renseigner NAP + site + horaires bureau **exacts** (voir §0).
- [ ] Zone desservie : ajouter les communes du §0 (fiche avec adresse visible, PAS une fiche « sans adresse »).
- [ ] Ajouter des **photos réelles** (devanture, salle de code, véhicules, équipe) — pas d'images génériques.
- [ ] Décrire les services réels : permis B (manuel/auto), accéléré, conduite accompagnée, CPF, VTC, SST, logistique & sécurité.
- [ ] Activer la messagerie + le lien de prise de rendez-vous (vers `/inscription` ou `/contact`).
- [ ] Publier des **posts** réguliers (offres réelles, sessions, actualités).
- [ ] Mettre le n° d'agrément et infos utiles dans la description.

## 3. Avis clients (authentiques uniquement)
- [ ] Mettre en place une routine de **demande d'avis Google** aux élèves satisfaits (QR/lien direct GBP). **Jamais de faux avis.**
- [ ] Répondre à **tous** les avis (positifs et négatifs), de façon professionnelle.
- [ ] Optionnel technique : provisionner **`GOOGLE_PLACES_API_KEY`** + le **Place ID** dans le SiteSetting `google.reviews` (via `/admin/site/avis-google`) pour afficher les vrais avis Google sur le site (le bloc `Review`/`AggregateRating` du JSON-LD ne s'émet qu'avec des avis vérifiables).

## 4. Bing Webmaster Tools
- [ ] Créer la propriété **https://lodene.fr** (import possible depuis GSC).
- [ ] Soumettre **https://lodene.fr/sitemap.xml**.
- [ ] (Optionnel) **IndexNow** : Bing le prend en charge pour signaler les URL modifiées — à activer si l'on veut accélérer la (re)découverte.

## 5. Bing Places for Business
- [ ] Créer/revendiquer la fiche locale (souvent importable depuis GBP), NAP + horaires + catégorie **exacts** (§0).

## 6. Apple Business Connect (Plans / Siri)
- [ ] Revendiquer le lieu **LODENE Auto-École** dans Apple Business Connect, NAP + horaires + photos.

## 7. Annuaires & citations locales (cohérence NAP)
- [ ] **PagesJaunes** : fiche à jour (NAP strictement identique).
- [ ] Annuaires fiables : annuaires d'auto-écoles sérieux, CCI/annuaires locaux Yvelines/Val-d'Oise. **Éviter** les fermes de liens.
- [ ] Vérifier qu'aucune ancienne fiche ne contient un **NAP incohérent** (ancien téléphone/adresse) → corriger/fusionner.

## 8. Analytics & mesure (respect du consentement)
- [ ] Provisionner **Matomo** (`MATOMO_URL`, `MATOMO_SITE_ID`, `MATOMO_API_TOKEN`) → alimente le tableau de bord `/admin/trafic` (sinon repli sur les KPI CRM).
- [ ] Définir les conversions à suivre : **appels, formulaires (contact/CPF/inscription), itinéraires, clics WhatsApp**.

## 9. Variables d'environnement à poser en prod (rappel)
- [ ] `NEXT_PUBLIC_SITE_URL=https://lodene.fr` (déjà la valeur par défaut ; à confirmer côté VPS).
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<code GSC>`
- [ ] `GOOGLE_PLACES_API_KEY=<clé>` (+ Place ID dans `google.reviews`)
- [ ] `MATOMO_URL` / `MATOMO_SITE_ID` / `MATOMO_API_TOKEN`
- [ ] Ne jamais exposer de secret côté navigateur ; conserver un `JWT_SECRET` identique API/web.

---

## Indicateurs à suivre (mensuel)
- **GSC** : impressions/clics/position sur « auto-école Conflans », « permis CPF Conflans », « permis boîte automatique Conflans » ; couverture d'index ; Core Web Vitals ; résultats enrichis.
- **GBP** : appels, demandes d'itinéraire, clics site, vues recherche/Maps, nombre & note des avis.
- **Bing WMT** : pages indexées, clics.
- **Analytics** : taux de conversion par canal (appel / formulaire / WhatsApp / itinéraire).

## Rappel — plan 30 / 60 / 90 jours
- **30 j** : push + deploy · GSC/Bing + sitemap · **créer/optimiser le GBP** · lancer la collecte d'avis réels · compléter les données légales manquantes.
- **60 j** : contenu local à valeur ajoutée (accès, transports, points de RDV) pour 2-3 communes prioritaires · fils d'Ariane déjà visibles ✓ · mesurer Lighthouse et corriger · citations/annuaires.
- **90 j** : blog local (guides permis/CPF Yvelines) · consolidation des citations · suivi des positions locales.
