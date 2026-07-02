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
      "heure de conduite", "code", "auto ecole", "evaluation de depart", "examen pratique",
      "post permis", "post-permis", "perfectionnement", "remorque", "permis remorque", "b96", "be",
      "tracter", "recuperation de points", "recuperation points", "points", "stage points"
    ],
    body: [
      "LODENE prépare au permis B en boîte **automatique** et en boîte **manuelle**.",
      "- Boîte automatique : *Déclic Auto* (13 leçons) et *Maîtrise Auto* (20 leçons).",
      "- Boîte manuelle : *Essentiel Manuelle* (20 leçons) et *Confort Manuelle* (30 leçons).",
      "- Autres parcours : **conduite accompagnée (AAC) dès 15 ans**, **stage accéléré** (parcours intensif, sur devis selon le planning), **passerelle BVA → boîte manuelle**.",
      "- Autres prestations conduite : **Post-permis** (7h, perfectionnement après l'examen), **permis remorque B96 / BE** (tracter caravane/remorque en sécurité, sur devis), **stage de récupération de points** (2 jours, sensibilisation à la sécurité routière).",
      "- Compléments : **heure de conduite supplémentaire à 60 € TTC**, **pack administratif + Code en ligne à 59 € TTC**, accompagnement à l'examen, évaluation de départ.",
      "Pour les prix exacts des formules, s'appuyer sur les tarifs publics à jour (outil get_formations / get_prices). CPF possible selon l'éligibilité du dossier sur les formules permis.",
      "Pour orienter : demander le niveau actuel, le budget et le délai souhaité, puis proposer un diagnostic / une demande de rendez-vous."
    ].join("\n")
  },
  {
    id: "public_formations_vtc",
    title: "VTC, Taxi & transport professionnel (FIMO/FCO)",
    scope: "public",
    keywords: [
      "vtc", "chauffeur", "cma", "chambre des metiers", "carte professionnelle", "carte pro",
      "distanciel eco", "intermediaire light", "confort pro", "excellence", "uber", "bolt",
      "transport de personnes", "vsl", "taxi", "chauffeur taxi", "carte taxi",
      "fimo", "fco", "transport routier", "marchandises", "voyageurs", "poids lourd", "conducteur"
    ],
    body: [
      "LODENE prépare aux épreuves **théoriques et pratiques de l'examen VTC**, géré par la **Chambre de Métiers et de l'Artisanat (CMA)**, en vue de la carte professionnelle.",
      "Quatre formules, du plus léger au clé en main :",
      "- *VTC Distanciel Éco* : accès plateforme 24h/24, en autonomie.",
      "- *VTC Intermédiaire Light* : distanciel + 2 visios collectives.",
      "- *VTC Confort Pro* : préparation complète (sans conduite).",
      "- *VTC Excellence Haute Exigence* : pack clé en main **avec conduite** ; c'est la **seule formule incluant les frais d'inscription CMA**.",
      "Les formules VTC vont de 399 € à 2 499 € (voir tarifs publics à jour). Aide au dossier CMA selon la formule. CPF possible selon le dispositif — à confirmer avec un conseiller.",
      "Autres formations transport (sur devis) : **Formation Taxi** (préparation à l'examen et à la carte professionnelle de chauffeur de taxi) et **FIMO / FCO** (formation obligatoire des conducteurs du transport routier de **marchandises ou de voyageurs**).",
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
      "salarie", "entreprise", "certificat", "gestes et postures", "gestes postures", "prap",
      "tms", "ergonomie", "manutention manuelle", "risques physiques", "prevention"
    ],
    body: [
      "Formations **sécurité & secourisme (SST)** :",
      "- **SST Initial** : 14 heures (2 jours).",
      "- **MAC SST / Recyclage** : 7 heures (1 jour), maintien et actualisation des compétences.",
      "- **Gestes & postures / PRAP** : prévention des risques liés à l'activité physique (TMS, manutention manuelle), 1 jour, sur devis.",
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
      "r489", "r485", "r486", "r484", "r457", "manutention", "entrepot", "btp", "engin",
      "habilitation electrique", "electrique", "b0", "h0", "bs", "be", "nf c 18-510",
      "incendie", "extincteur", "evacuation", "epi", "manipulation extincteur"
    ],
    body: [
      "Formations **logistique & sécurité**, le plus souvent en **intra-entreprise sur site client** :",
      "- **Chariots élévateurs — R489**",
      "- **Gerbeur accompagnant — R485**",
      "- **Nacelles / PEMP — R486** (travaux en hauteur)",
      "- **Pont roulant — R484**",
      "- **Échafaudage roulant — R457**",
      "- **Terberg / tracteur de parc**",
      "- **Habilitation électrique (B0/H0 – BS/BE)** : pour personnel non-électricien ou d'intervention (norme NF C 18-510).",
      "- **Manipulation extincteur & évacuation** : prévention incendie (EPI, alerte, évacuation, équipiers de première intervention).",
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
  },
  {
    id: "public_formations_digital",
    title: "Pôle Digital, IA & CRM — pour professionnels & entreprises",
    scope: "public",
    keywords: [
      "digital", "ia", "intelligence artificielle", "crm", "automatisation", "no code", "no-code",
      "prospection", "presence en ligne", "site web", "google", "reseaux sociaux", "chatgpt",
      "outils numeriques", "tpe", "pme", "independant", "dirigeant", "productivite", "workflow",
      "relance", "mini crm", "gagner du temps"
    ],
    body: [
      "LODENE propose un pôle **Digital, IA & CRM** pour les professionnels, TPE/PME et indépendants (présentiel ou distanciel) :",
      "- **Pack IA, CRM & Automatisation** (formation signature, 14h) — digitaliser, organiser et automatiser son activité.",
      "- **L'IA pour les professionnels** (7h) — prendre en main les assistants IA au quotidien (rédaction, réponses, productivité).",
      "- **Créer & piloter son mini-CRM** (7h) — suivi des prospects, devis et relances.",
      "- **Automatisation no-code** (7h) — relances, notifications et workflows sans coder.",
      "- **Prospection & présence en ligne** (7h) — site vitrine, fiche Google, réseaux sociaux.",
      "Tarifs indicatifs de 590 € à 990 € selon le module (utiliser get_formations pour le prix exact). Financement **OPCO / entreprise** possible ; ce pôle n'est **pas éligible CPF**.",
      "Pour orienter : demander l'objectif (gagner du temps, mieux suivre ses clients, se rendre visible) puis proposer un devis ou un rendez-vous."
    ].join("\n")
  },
  {
    id: "public_catalogue_complet",
    title: "Catalogue complet — toutes les formations & prestations LODENE",
    scope: "public",
    keywords: [
      "formations", "prestations", "catalogue", "liste", "que proposez vous", "quelles formations",
      "vos formations", "vos prestations", "toutes les formations", "offre", "services",
      "que faites vous", "domaines", "poles", "categories", "centre de formation"
    ],
    body: [
      "LODENE est un **centre de formation multi-pôles** à Conflans-Sainte-Honorine. 5 catégories :",
      "**1) Permis B & conduite** : permis B automatique (Déclic 13 leçons, Maîtrise 20 leçons), permis B manuel (Essentiel 20 leçons, Confort 30 leçons), stage accéléré code + conduite, conduite accompagnée (AAC), passerelle BVA → manuelle, permis remorque B96/BE, post-permis, stage de récupération de points.",
      "**2) VTC & transport** : VTC (Distanciel Éco, Intermédiaire Light, Confort Pro, Excellence), formation Taxi, FIMO/FCO.",
      "**3) Sécurité & secourisme (SST)** : SST Initial (14h), MAC SST / recyclage (7h), gestes & postures / PRAP.",
      "**4) CACES & logistique** (le plus souvent en intra-entreprise, sur devis) : chariot R489, gerbeur R485, nacelle/PEMP R486, pont roulant R484, échafaudage roulant R457, tracteur de parc (Terberg), habilitation électrique, manipulation extincteur & évacuation.",
      "**5) Digital, IA & CRM** : pack IA/CRM/automatisation (14h), L'IA pour les pros, mini-CRM, automatisation no-code, prospection & présence en ligne.",
      "Pour un prix ou une durée exacts, utiliser get_formations / get_prices. Toujours proposer ensuite un diagnostic, un devis ou un rendez-vous selon le besoin."
    ].join("\n")
  }
];
