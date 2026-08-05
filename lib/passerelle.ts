/**
 * Passerelle « boîte automatique → boîte manuelle » (levée de la mention 78 du permis B).
 *
 * Valeurs VALIDÉES le 2026-08-05 par l'utilisateur, sur la base de la documentation
 * du réseau CER : **depuis le 1er mars 2024, le délai d'attente de 3 mois est supprimé**.
 * La formation de 7 heures peut être suivie immédiatement après l'obtention du permis
 * boîte automatique. Une version antérieure de cette page annonçait « dès 3 mois » —
 * ne pas réintroduire cette mention.
 *
 * Ces constantes alimentent la landing `/passerelle-boite-automatique-manuelle` ET la
 * fiche catalogue `/formations/passerelle-bva-manuelle` : corriger ici corrige les deux.
 */

/** Durée réglementaire de la formation passerelle. */
export const PASSERELLE_DUREE = "7 heures";

/** Date d'entrée en vigueur de la suppression du délai d'attente. */
export const PASSERELLE_REFORME = "1er mars 2024";

/** URL de la landing dédiée, référencée depuis la fiche formation et le sitemap. */
export const PASSERELLE_PATH = "/passerelle-boite-automatique-manuelle";

/** Slug de la formation correspondante au catalogue. */
export const PASSERELLE_FORMATION_SLUG = "passerelle-bva-manuelle";
