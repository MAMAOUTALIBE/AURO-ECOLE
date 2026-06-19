import type { KnowledgeArticle } from "./types";

// Articles PUBLICS de la base de connaissance LODENE.
//
// Source de vérité : backend/src/data/initial-data.ts (formations, FAQ, CompanyInfo).
// RÈGLE : ne jamais inventer de tarif/durée/disponibilité. Les prix des formules
// proviennent des données live (get_formations / get_prices) et ne sont PAS dupliqués
// ici (évite la dérive). Seuls quelques faits canoniques stables, déjà publiés dans la
// FAQ officielle, sont rappelés (heure de conduite 60 € TTC, pack admin + Code 59 € TTC,
// durées SST, frais CMA inclus en formule Excellence).

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: "public_formations_permis_b",
    title: "Permis B — formules, boîte automatique et manuelle",
    scope: "public",
    keywords: [
      "permis", "permis b", "conduire", "conduite", "boite", "boîte", "automatique", "manuel", "manuelle",
      "bva", "passerelle", "stage accelere", "accelere", "intensif", "conduite accompagnee", "aac",
      "declic auto", "maitrise auto", "essentiel manuelle", "confort manuelle", "lecon", "lecons",
      "heure de conduite", "code", "auto ecole", "evaluation de depart", "examen pratique"
    ],
    body: [
      "LODENE prépare au permis B en boîte **automatique** et en boîte **manuelle**.",
      "- Boîte automatique : *Déclic Auto* (13 leçons) et *Maîtrise Auto* (20 leçons).",
      "- Boîte manuelle : *Essentiel Manuelle* (20 leçons) et *Confort Manuelle* (30 leçons).",
      "- Autres parcours : **conduite accompagnée (AAC) dès 15 ans**, **stage accéléré** (parcours intensif, sur devis selon le planning), **passerelle BVA → boîte manuelle**.",
      "- Compléments : **heure de conduite supplémentaire à 60 € TTC**, **pack administratif + Code en ligne à 59 € TTC**, accompagnement à l'examen, évaluation de départ.",
      "Pour les prix exacts des formules, s'appuyer sur les tarifs publics à jour (outil get_formations / get_prices). CPF possible selon l'éligibilité du dossier sur les formules permis.",
      "Pour orienter : demander le niveau actuel, le budget et le délai souhaité, puis proposer un diagnostic / une demande de rendez-vous."
    ].join("\n")
  },
  {
    id: "public_formations_vtc",
    title: "Formation VTC — préparation à l'examen CMA",
    scope: "public",
    keywords: [
      "vtc", "chauffeur", "cma", "chambre des metiers", "carte professionnelle", "carte pro",
      "distanciel eco", "intermediaire light", "confort pro", "excellence", "uber", "bolt",
      "transport de personnes", "vsl", "taxi"
    ],
    body: [
      "LODENE prépare aux épreuves **théoriques et pratiques de l'examen VTC**, géré par la **Chambre de Métiers et de l'Artisanat (CMA)**, en vue de la carte professionnelle.",
      "Quatre formules, du plus léger au clé en main :",
      "- *VTC Distanciel Éco* : accès plateforme 24h/24, en autonomie.",
      "- *VTC Intermédiaire Light* : distanciel + 2 visios collectives.",
      "- *VTC Confort Pro* : préparation complète (sans conduite).",
      "- *VTC Excellence Haute Exigence* : pack clé en main **avec conduite** ; c'est la **seule formule incluant les frais d'inscription CMA**.",
      "Les formules vont de 399 € à 2 499 € (voir tarifs publics à jour). Aide au dossier CMA selon la formule. CPF possible selon le dispositif — à confirmer avec un conseiller.",
      "Proposer un diagnostic pour choisir entre distanciel, coaching ou formule complète."
    ].join("\n")
  },
  {
    id: "public_formations_sst",
    title: "SST — Sauveteur Secouriste du Travail",
    scope: "public",
    keywords: [
      "sst", "sauveteur", "secouriste", "secours", "premiers secours", "mac sst", "recyclage",
      "sante au travail", "securite travail", "inter entreprise", "intra entreprise", "salaries",
      "salarie", "entreprise", "certificat"
    ],
    body: [
      "Deux formations SST :",
      "- **SST Initial** : 14 heures (2 jours).",
      "- **MAC SST / Recyclage** : 7 heures (1 jour), maintien et actualisation des compétences.",
      "Organisation possible en **sessions inter-entreprises** (à LODENE) ou **intra-entreprise** (chez le client).",
      "Certificat officiel délivré selon la validation des compétences.",
      "Pour une demande entreprise : demander le nombre de salariés, le lieu et les dates souhaitées, puis créer une demande / un devis."
    ].join("\n")
  },
  {
    id: "public_formations_logistique",
    title: "Logistique & sécurité — CACES R489/R485/R486/R484/R457",
    scope: "public",
    keywords: [
      "caces", "logistique", "securite", "chariot", "chariots", "elevateur", "gerbeur", "nacelle",
      "nacelles", "pemp", "pont roulant", "echafaudage", "terberg", "tracteur de parc",
      "r489", "r485", "r486", "r484", "r457", "manutention", "entrepot", "btp", "engin"
    ],
    body: [
      "Formations **logistique & sécurité**, le plus souvent en **intra-entreprise sur site client** :",
      "- **Chariots élévateurs — R489**",
      "- **Gerbeur accompagnant — R485**",
      "- **Nacelles / PEMP — R486** (travaux en hauteur)",
      "- **Pont roulant — R484**",
      "- **Échafaudage roulant — R457**",
      "- **Terberg / tracteur de parc**",
      "Ces formations sont **sur devis** : le tarif dépend du matériel, du nombre de participants, du lieu, de la durée et des objectifs.",
      "Inviter à demander un devis (formation entreprise) en précisant l'engin, le nombre de personnes et le lieu."
    ].join("\n")
  },
  {
    id: "public_tarifs",
    title: "Tarifs publics LODENE",
    scope: "public",
    keywords: [
      "prix", "tarif", "tarifs", "combien", "cout", "coute", "payer", "montant", "devis",
      "heure de conduite", "pack", "code en ligne", "forfait"
    ],
    body: [
      "LODENE communique des **tarifs publics** ; pour les montants exacts des formules, utiliser les données à jour (get_formations / get_prices) ou la page Tarifs du site.",
      "Repères stables :",
      "- Heure de conduite (boîte auto ou manuelle) : **60 € TTC**.",
      "- Pack administratif + Code en ligne : **59 € TTC**.",
      "- Permis B : formules en boîte auto (Déclic / Maîtrise) et manuelle (Essentiel / Confort).",
      "- VTC : de 399 € à 2 499 € selon la formule.",
      "- SST : tarifs publics ; sessions intra-entreprise **sur devis**.",
      "- Logistique & sécurité : **sur devis**.",
      "Ne jamais inventer un montant : si un prix n'est pas connu, proposer un devis ou renvoyer vers un conseiller. Paiement en plusieurs fois (3× / 4×) possible sur les formules permis."
    ].join("\n")
  },
  {
    id: "public_cpf_financement",
    title: "CPF & financements",
    scope: "public",
    keywords: [
      "cpf", "financement", "financer", "compte formation", "compte personnel de formation",
      "opco", "aide", "labaz", "pole emploi", "france travail", "plusieurs fois", "paiement",
      "echelonne", "3x", "4x", "reste a charge", "eligible", "eligibilite", "subvention"
    ],
    body: [
      "**Le CPF peut être possible selon votre situation et l'éligibilité de votre dossier**, notamment sur certaines formations permis et VTC.",
      "⚠️ **Ne jamais promettre une validation CPF ni un financement « 100 % financé »** : l'éligibilité dépend du profil et doit être vérifiée.",
      "Autres financements possibles selon la situation :",
      "- **Aide LABAZ** (jeunes 15-25 ans), si applicable.",
      "- **OPCO / entreprise** pour les salariés.",
      "- **Paiement en plusieurs fois (3× / 4×)** sur les formules permis.",
      "Bonne pratique : proposer qu'un conseiller vérifie l'éligibilité, le financement et le reste à charge avant l'inscription, et créer une tâche / un lead « vérification CPF » avec l'accord de la personne.",
      "Si l'information manque : « Un conseiller LODENE pourra vous le confirmer. »"
    ].join("\n")
  },
  {
    id: "public_horaires_contact",
    title: "Horaires, adresse & contact LODENE",
    scope: "public",
    keywords: [
      "horaire", "horaires", "ouvert", "ouverture", "ferme", "adresse", "ou se trouve", "ou etes",
      "localisation", "telephone", "tel", "numero", "email", "mail", "contact", "joindre",
      "agrement", "siret", "conflans", "rendez vous", "rdv"
    ],
    body: [
      "**LODENE** — auto-école et centre de formation à Conflans-Sainte-Honorine.",
      "- Adresse : 30 rue Pierre Le Guen, 78700 Conflans-Sainte-Honorine.",
      "- Téléphone : 06 60 32 50 87 · Email : ae@lodene.fr.",
      "- Agrément préfectoral : E2507800260.",
      "Horaires :",
      "- Bureau : mardi & mercredi 10h-12h / 14h-18h · jeudi & vendredi 10h-12h / 14h-20h · samedi 9h-12h / 13h-17h (fermé lundi & dimanche).",
      "- Cours pratiques : 7j/7, 8h-20h sur réservation.",
      "Privilégier les coordonnées fournies par les données live (CompanyInfo) si elles diffèrent. Pour une disponibilité précise, proposer une demande de rendez-vous (un conseiller confirme le créneau)."
    ].join("\n")
  },
  {
    id: "public_documents_a_fournir",
    title: "Documents à fournir pour l'inscription",
    scope: "public",
    keywords: [
      "documents", "document", "pieces", "piece", "justificatif", "justificatifs", "dossier",
      "inscription", "fournir", "carte identite", "identite", "photo", "ants", "neph", "domicile",
      "papiers", "s inscrire"
    ],
    body: [
      "Les pièces exactes dépendent de votre situation et de la formation ; **un conseiller LODENE vous remet la liste précise** à l'inscription.",
      "Pièces généralement demandées pour un dossier permis :",
      "- Pièce d'identité en cours de validité.",
      "- Justificatif de domicile récent.",
      "- Photo d'identité conforme (e-photo / cabine agréée).",
      "- Selon le profil : justificatifs liés au financement (CPF, entreprise…).",
      "Ne pas affirmer une exigence administrative incertaine : en cas de doute, « Un conseiller LODENE pourra vous le confirmer. »"
    ].join("\n")
  },
  {
    id: "public_faq",
    title: "Questions fréquentes (FAQ)",
    scope: "public",
    keywords: ["faq", "questions frequentes", "foire aux questions", "reservation en ligne", "reserver une lecon"],
    body: [
      "**Q : Le permis B est-il finançable avec le CPF ?**",
      "R : Le financement CPF peut être possible selon votre situation et l'éligibilité de votre dossier. Un conseiller LODENE peut vous accompagner dans la vérification.",
      "**Q : Proposez-vous le permis en boîte automatique ?**",
      "R : Oui — formules Déclic Auto (13 leçons) et Maîtrise Auto (20 leçons).",
      "**Q : Puis-je faire un stage accéléré ?**",
      "R : Oui, selon les disponibilités du planning et votre niveau ; tarif sur devis.",
      "**Q : Les frais d'inscription CMA sont-ils inclus pour le VTC ?**",
      "R : Uniquement dans la formule Excellence Haute Exigence. Les autres formules préparent à l'examen, hors frais CMA.",
      "**Q : Puis-je réserver une leçon en ligne ?**",
      "R : Oui, l'espace élève permet de réserver, modifier ou annuler un créneau de conduite."
    ].join("\n")
  }
];
