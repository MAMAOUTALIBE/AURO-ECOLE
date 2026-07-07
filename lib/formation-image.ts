import type { ProductLine } from "@/data/site";

type FormationImage = {
  src: string;
  alt: string;
  objectPosition?: string;
};

export type FormationHeroIllustrationIcon = "Sparkles" | "Database" | "Users" | "Workflow" | "Zap";

export type FormationHeroSlide =
  | (FormationImage & {
      kind: "image";
      keyword?: string;
    })
  | {
      kind: "illustration";
      keyword: string;
      icon: FormationHeroIllustrationIcon;
      gradient?: string;
    };

type FormationHeroImageOverride = {
  src?: string | null;
  alt: string;
  objectPosition?: string;
};

// Photos réalistes par formation, avec repli par pôle pour les contenus CMS inconnus.
const BY_SLUG: Record<string, FormationImage> = {
  "permis-b-auto-declic": {
    src: "/formations/photos/permis-b-auto-declic.webp",
    alt: "Élève en conduite accompagnée par un moniteur dans une voiture automatique LODENE.",
    objectPosition: "50% 45%"
  },
  "permis-b-auto-maitrise": {
    src: "/formations/photos/permis-b-auto-maitrise.webp",
    alt: "Moniteur et élève révisant une leçon près d'une voiture automatique auto-école.",
    objectPosition: "50% 48%"
  },
  "permis-b-manuel-essentiel": {
    src: "/formations/photos/permis-b-manuel-essentiel.webp",
    alt: "Élève au volant d'une voiture manuelle avec moniteur et levier de vitesse visible.",
    objectPosition: "50% 48%"
  },
  "permis-b-manuel-confort": {
    src: "/formations/photos/permis-b-manuel-confort.webp",
    alt: "Élève et moniteur faisant le point à côté d'une voiture manuelle LODENE.",
    objectPosition: "50% 48%"
  },
  "stage-accelere": {
    src: "/formations/photos/stage-accelere.webp",
    alt: "Élève préparant un stage accéléré code et conduite avec planning intensif.",
    objectPosition: "50% 45%"
  },
  "passerelle-bva-manuelle": {
    src: "/formations/photos/passerelle-bva-manuelle.webp",
    alt: "Élève adulte apprenant la boîte manuelle avec un moniteur et le levier de vitesse.",
    objectPosition: "50% 50%"
  },
  "conduite-accompagnee": {
    src: "/formations/photos/conduite-accompagnee.webp",
    alt: "Jeune conducteur, accompagnateur et moniteur devant une voiture auto-école.",
    objectPosition: "50% 45%"
  },
  "vtc-distanciel-eco": {
    src: "/formations/photos/vtc-distanciel-eco.webp",
    alt: "Futur chauffeur VTC préparant sa formation distancielle sur ordinateur.",
    objectPosition: "50% 45%"
  },
  "vtc-intermediaire-light": {
    src: "/formations/photos/vtc-intermediaire-light.webp",
    alt: "Futur chauffeur VTC travaillant avec un formateur près d'un véhicule professionnel.",
    objectPosition: "50% 45%"
  },
  "vtc-confort-pro": {
    src: "/formations/photos/vtc-confort-pro.webp",
    alt: "Chauffeur VTC en préparation professionnelle près d'une berline haut de gamme.",
    objectPosition: "50% 48%"
  },
  "vtc-excellence": {
    src: "/formations/photos/vtc-excellence.webp",
    alt: "Formateur remettant les clés d'un véhicule d'examen à un futur chauffeur VTC.",
    objectPosition: "50% 48%"
  },
  "sst-initial": {
    src: "/formations/photos/sst-initial.webp",
    alt: "Formation SST initiale avec formateur et apprenants autour d'un mannequin de secourisme.",
    objectPosition: "50% 45%"
  },
  "mac-sst": {
    src: "/formations/photos/mac-sst.webp",
    alt: "Recyclage MAC SST avec groupe d'apprenants, mannequin et matériel de premiers secours.",
    objectPosition: "50% 45%"
  },
  "chariots-elevateurs-r489": {
    src: "/formations/photos/chariots-elevateurs-r489.webp",
    alt: "Apprenant en formation R489 sur chariot élévateur dans un entrepôt sécurisé.",
    objectPosition: "50% 48%"
  },
  "gerbeur-r485": {
    src: "/formations/photos/gerbeur-r485.webp",
    alt: "Opérateur utilisant un gerbeur accompagnant R485 sous supervision en entrepôt.",
    objectPosition: "50% 48%"
  },
  "nacelles-pemp-r486": {
    src: "/formations/photos/nacelles-pemp-r486.webp",
    alt: "Formation R486 sur nacelle PEMP avec harnais et instructeur en zone sécurisée.",
    objectPosition: "50% 50%"
  },
  "pont-roulant-r484": {
    src: "/formations/photos/pont-roulant-r484.webp",
    alt: "Apprenant manipulant un pont roulant R484 avec télécommande en atelier industriel.",
    objectPosition: "50% 48%"
  },
  "echafaudage-roulant-r457": {
    src: "/formations/photos/echafaudage-roulant-r457.webp",
    alt: "Groupe en formation R457 autour d'un échafaudage roulant dans un atelier lumineux.",
    objectPosition: "50% 48%"
  },
  "terberg-tracteur-parc": {
    src: "/formations/photos/terberg-tracteur-parc.webp",
    alt: "Conducteur en formation sur tracteur de parc dans une zone logistique sécurisée.",
    objectPosition: "50% 48%"
  }
};

const BY_PRODUCT_LINE: Record<string, FormationImage> = {
  AUTO_ECOLE: BY_SLUG["permis-b-manuel-essentiel"],
  VTC: BY_SLUG["vtc-confort-pro"],
  CACES: BY_SLUG["chariots-elevateurs-r489"],
  SST: BY_SLUG["sst-initial"],
  LOGISTIQUE_SECURITE: BY_SLUG["chariots-elevateurs-r489"]
};

const BY_PRODUCT_LINE_SLIDES: Record<string, FormationImage[]> = {
  AUTO_ECOLE: [
    BY_SLUG["permis-b-auto-declic"],
    BY_SLUG["permis-b-manuel-essentiel"],
    BY_SLUG["stage-accelere"]
  ],
  VTC: [
    BY_SLUG["vtc-confort-pro"],
    BY_SLUG["vtc-excellence"],
    BY_SLUG["vtc-intermediaire-light"]
  ],
  CACES: [
    BY_SLUG["chariots-elevateurs-r489"],
    BY_SLUG["gerbeur-r485"],
    BY_SLUG["nacelles-pemp-r486"]
  ],
  SST: [
    BY_SLUG["sst-initial"],
    BY_SLUG["mac-sst"],
    BY_SLUG["sst-initial"]
  ],
  LOGISTIQUE_SECURITE: [
    BY_SLUG["chariots-elevateurs-r489"],
    BY_SLUG["terberg-tracteur-parc"],
    BY_SLUG["nacelles-pemp-r486"]
  ]
};

export function formationImageMeta(slug: string, productLine?: ProductLine): FormationImage {
  return BY_SLUG[slug] ?? BY_PRODUCT_LINE[productLine ?? "AUTO_ECOLE"] ?? BY_PRODUCT_LINE.AUTO_ECOLE;
}

export function formationImage(slug: string, productLine?: ProductLine): string {
  return formationImageMeta(slug, productLine).src;
}

export function formationImageAlt(slug: string, productLine?: ProductLine): string {
  return formationImageMeta(slug, productLine).alt;
}

export function formationImageObjectPosition(slug: string, productLine?: ProductLine): string {
  return formationImageMeta(slug, productLine).objectPosition ?? "50% 50%";
}

function toImageSlide(image: FormationImage, keyword?: string): FormationHeroSlide {
  return { kind: "image", keyword, ...image };
}

function dedupeImages(images: FormationImage[]) {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
}

function dedupeSlides(slides: FormationHeroSlide[]) {
  const seen = new Set<string>();
  return slides.filter((slide) => {
    const key = slide.kind === "image" ? `image:${slide.src}` : `illustration:${slide.icon}:${slide.keyword}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function overridePhotoSlide(image?: FormationHeroImageOverride): FormationHeroSlide[] {
  if (!image) return [];
  const src = image?.src?.trim();
  if (!src) return [];
  return [
    toImageSlide({
      src,
      alt: image.alt,
      objectPosition: image.objectPosition ?? "50% 50%"
    })
  ];
}

function loadNodeModule<T>(moduleName: string): T | null {
  if (typeof window !== "undefined") return null;
  try {
    const dynamicRequire = Function("moduleName", "return require(moduleName)") as (name: string) => T;
    return dynamicRequire(moduleName);
  } catch {
    return null;
  }
}

function publicFileExists(src: string) {
  const fs = loadNodeModule<{ existsSync(path: string): boolean }>("node:fs");
  const path = loadNodeModule<{ join(...parts: string[]): string }>("node:path");
  if (!fs || !path) return false;
  return fs.existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
}

function dedicatedPhotoSlides(slug: string): FormationHeroSlide[] {
  return [1, 2, 3]
    .map((index) => {
      const src = `/formations/photos/${slug}-${index}.webp`;
      if (!publicFileExists(src)) return null;
      return toImageSlide({
        src,
        alt: `Visuel formation ${slug.replace(/-/g, " ")} LODENE ${index}`,
        objectPosition: "50% 50%"
      });
    })
    .filter(Boolean) as FormationHeroSlide[];
}

function digitalIllustrationSlides(slug: string): FormationHeroSlide[] {
  const curatedDigitalSlides: Record<string, FormationHeroSlide[]> = {
    "ia-crm-automatisation": [
      {
        kind: "image",
        src: "/loden-hero.jpg",
        alt: "Formateur LODENE accompagnant une élève devant une voiture-école.",
        objectPosition: "62% 50%"
      }
    ],
    "ia-professionnels": [
      {
        kind: "image",
        src: "/loden-hero.jpg",
        alt: "Formateur LODENE échangeant avec une élève devant une voiture-école.",
        objectPosition: "62% 50%"
      }
    ],
    "mini-crm": [
      {
        kind: "image",
        src: "/loden-hero.jpg",
        alt: "Formateur LODENE accompagnant une élève avec une tablette devant une voiture-école.",
        objectPosition: "62% 50%"
      }
    ],
    "automatisation-no-code": [
      { kind: "illustration", icon: "Workflow", keyword: "No-code", gradient: "from-[#08AEB8] via-loden-700 to-loden-900" },
      { kind: "illustration", icon: "Zap", keyword: "Automatisations", gradient: "from-loden-700 via-[#08AEB8] to-loden-900" },
      { kind: "illustration", icon: "Database", keyword: "Workflows", gradient: "from-loden-800 via-loden-700 to-loden-900" }
    ],
    "prospection-presence-en-ligne": [
      { kind: "illustration", icon: "Sparkles", keyword: "Visibilité", gradient: "from-loden-700 via-[#08AEB8] to-loden-900" },
      { kind: "illustration", icon: "Users", keyword: "Prospection", gradient: "from-loden-800 via-loden-700 to-loden-900" },
      { kind: "illustration", icon: "Zap", keyword: "Demandes clients", gradient: "from-[#08AEB8] via-loden-700 to-loden-900" }
    ]
  };

  const curated = curatedDigitalSlides[slug];
  if (curated) return curated;

  return [
    { kind: "illustration", icon: "Sparkles", keyword: "Tech, Web & IA", gradient: "from-loden-700 via-[#08AEB8] to-loden-900" },
    { kind: "illustration", icon: "Users", keyword: "Suivi client", gradient: "from-loden-800 via-loden-700 to-loden-900" },
    { kind: "illustration", icon: "Zap", keyword: "Automatisation", gradient: "from-[#08AEB8] via-loden-700 to-loden-900" }
  ];
}

type CuratedSlide = {
  imageSlug: string;
  keyword: string;
  alt: string;
};

const CURATED_SLIDE_SETS: Record<string, CuratedSlide[]> = {
  "permis-b-auto-declic": [
    {
      imageSlug: "permis-b-auto-declic",
      keyword: "Boîte automatique",
      alt: "Élève en leçon de conduite en boîte automatique avec un moniteur LODENE."
    },
    {
      imageSlug: "permis-b-auto-maitrise",
      keyword: "Conduite renforcée",
      alt: "Moniteur LODENE accompagnant une élève pour progresser en boîte automatique."
    },
    {
      imageSlug: "conduite-accompagnee",
      keyword: "Prêt pour l'examen",
      alt: "Jeune conducteur préparant son passage à l'examen avec LODENE."
    }
  ],
  "permis-b-auto-maitrise": [
    {
      imageSlug: "permis-b-auto-maitrise",
      keyword: "Boîte automatique",
      alt: "Élève et moniteur préparant une leçon en boîte automatique avec LODENE."
    },
    {
      imageSlug: "permis-b-auto-declic",
      keyword: "Conduite renforcée",
      alt: "Élève en conduite renforcée avec un moniteur LODENE dans une voiture automatique."
    },
    {
      imageSlug: "conduite-accompagnee",
      keyword: "Prêt pour l'examen",
      alt: "Jeune conducteur accompagné préparant son passage à l'examen avec LODENE."
    }
  ],
  "permis-b-manuel-essentiel": [
    {
      imageSlug: "permis-b-manuel-essentiel",
      keyword: "Boîte manuelle",
      alt: "Élève apprenant à conduire en boîte manuelle avec un moniteur LODENE."
    },
    {
      imageSlug: "permis-b-manuel-confort",
      keyword: "Maîtrise du levier",
      alt: "Élève travaillant la maîtrise du levier de vitesse avec un moniteur LODENE."
    },
    {
      imageSlug: "conduite-accompagnee",
      keyword: "Prêt pour l'examen",
      alt: "Jeune conducteur préparant son passage à l'examen avec LODENE."
    }
  ],
  "permis-b-manuel-confort": [
    {
      imageSlug: "permis-b-manuel-confort",
      keyword: "Boîte manuelle",
      alt: "Élève travaillant la boîte manuelle avec un moniteur LODENE près d'une voiture auto-école."
    },
    {
      imageSlug: "permis-b-manuel-essentiel",
      keyword: "Conduite renforcée",
      alt: "Élève en conduite renforcée avec un moniteur LODENE en boîte manuelle."
    },
    {
      imageSlug: "conduite-accompagnee",
      keyword: "Prêt pour l'examen",
      alt: "Jeune conducteur accompagné préparant son passage à l'examen avec LODENE."
    }
  ],
  "stage-accelere": [
    {
      imageSlug: "stage-accelere",
      keyword: "Stage intensif",
      alt: "Élève préparant un stage accéléré code et conduite avec LODENE."
    },
    {
      imageSlug: "permis-b-auto-declic",
      keyword: "Planning resserré",
      alt: "Moniteur LODENE encadrant une leçon de conduite sur parcours intensif."
    },
    {
      imageSlug: "permis-b-manuel-essentiel",
      keyword: "Conduite ciblée",
      alt: "Élève au volant avec un moniteur LODENE pour une progression rapide."
    }
  ],
  "passerelle-bva-manuelle": [
    {
      imageSlug: "passerelle-bva-manuelle",
      keyword: "Passerelle BVA",
      alt: "Élève adulte travaillant la boîte manuelle avec un moniteur LODENE."
    },
    {
      imageSlug: "permis-b-manuel-essentiel",
      keyword: "Boîte manuelle",
      alt: "Élève en apprentissage de la boîte manuelle avec LODENE."
    },
    {
      imageSlug: "permis-b-manuel-confort",
      keyword: "Maîtrise du levier",
      alt: "Moniteur LODENE accompagnant une élève sur la maîtrise du levier de vitesse."
    }
  ],
  "conduite-accompagnee": [
    {
      imageSlug: "conduite-accompagnee",
      keyword: "AAC dès 15 ans",
      alt: "Jeune conducteur, accompagnateur et moniteur devant une voiture LODENE."
    },
    {
      imageSlug: "permis-b-manuel-essentiel",
      keyword: "Expérience conduite",
      alt: "Élève en conduite accompagnée par un moniteur LODENE."
    },
    {
      imageSlug: "permis-b-auto-maitrise",
      keyword: "Prêt pour l'examen",
      alt: "Moniteur LODENE préparant une élève aux objectifs d'examen."
    }
  ],
  "permis-remorque-be-b96": [
    {
      imageSlug: "stage-accelere",
      keyword: "Remorque B96 / BE",
      alt: "Formation conduite LODENE avec un parcours adapté à l'objectif remorque."
    },
    {
      imageSlug: "permis-b-manuel-confort",
      keyword: "Manœuvres",
      alt: "Moniteur LODENE accompagnant une élève sur les manœuvres de conduite."
    },
    {
      imageSlug: "conduite-accompagnee",
      keyword: "Sécurité attelage",
      alt: "Élève et moniteur LODENE préparant les bons réflexes de sécurité routière."
    }
  ],
  "stage-recuperation-points": [
    {
      imageSlug: "conduite-accompagnee",
      keyword: "Sécurité routière",
      alt: "Conducteur accompagné par LODENE pour renforcer les réflexes de sécurité routière."
    },
    {
      imageSlug: "stage-accelere",
      keyword: "Stage 2 jours",
      alt: "Parcours de stage encadré par LODENE pour avancer efficacement."
    },
    {
      imageSlug: "permis-b-auto-maitrise",
      keyword: "Points permis",
      alt: "Moniteur LODENE échangeant avec une élève sur les objectifs de conduite."
    }
  ],
  "vtc-distanciel-eco": [
    {
      imageSlug: "vtc-distanciel-eco",
      keyword: "Distanciel",
      alt: "Futur chauffeur VTC préparant sa formation à distance avec LODENE."
    },
    {
      imageSlug: "vtc-intermediaire-light",
      keyword: "Coaching VTC",
      alt: "Formateur accompagnant un futur chauffeur VTC avec LODENE."
    },
    {
      imageSlug: "vtc-confort-pro",
      keyword: "Carte pro",
      alt: "Chauffeur VTC en préparation professionnelle près d'un véhicule."
    }
  ],
  "vtc-intermediaire-light": [
    {
      imageSlug: "vtc-intermediaire-light",
      keyword: "Coaching visio",
      alt: "Futur chauffeur VTC accompagné par un formateur LODENE."
    },
    {
      imageSlug: "vtc-distanciel-eco",
      keyword: "Plateforme VTC",
      alt: "Apprenant VTC travaillant sur une plateforme de formation en ligne."
    },
    {
      imageSlug: "vtc-confort-pro",
      keyword: "Prépa examen",
      alt: "Préparation VTC avec support formateur et véhicule professionnel."
    }
  ],
  "vtc-confort-pro": [
    {
      imageSlug: "vtc-confort-pro",
      keyword: "Confort Pro",
      alt: "Chauffeur VTC en préparation professionnelle avec LODENE."
    },
    {
      imageSlug: "vtc-excellence",
      keyword: "Carte pro",
      alt: "Formateur LODENE préparant un candidat VTC à la carte professionnelle."
    },
    {
      imageSlug: "vtc-intermediaire-light",
      keyword: "Simulations",
      alt: "Futur chauffeur VTC travaillant les simulations d'examen avec un formateur."
    }
  ],
  "vtc-excellence": [
    {
      imageSlug: "vtc-excellence",
      keyword: "Pack clé en main",
      alt: "Formateur LODENE remettant les clés d'un véhicule à un futur chauffeur VTC."
    },
    {
      imageSlug: "vtc-confort-pro",
      keyword: "Véhicule examen",
      alt: "Chauffeur VTC en préparation avec véhicule professionnel."
    },
    {
      imageSlug: "vtc-intermediaire-light",
      keyword: "Coaching VTC",
      alt: "Accompagnement formateur pour réussir la formation VTC."
    }
  ],
  "formation-taxi": [
    {
      imageSlug: "vtc-excellence",
      keyword: "Taxi",
      alt: "Formateur LODENE accompagnant un candidat au métier de chauffeur professionnel."
    },
    {
      imageSlug: "vtc-confort-pro",
      keyword: "Carte pro",
      alt: "Chauffeur professionnel en préparation près d'un véhicule."
    },
    {
      imageSlug: "vtc-intermediaire-light",
      keyword: "Transport pro",
      alt: "Futur chauffeur accompagné par un formateur LODENE."
    }
  ],
  "fimo-fco": [
    {
      imageSlug: "terberg-tracteur-parc",
      keyword: "Transport routier",
      alt: "Formation professionnelle en environnement logistique avec LODENE."
    },
    {
      imageSlug: "chariots-elevateurs-r489",
      keyword: "Sécurité chargement",
      alt: "Formation sécurité en zone logistique et transport."
    },
    {
      imageSlug: "vtc-confort-pro",
      keyword: "Parcours pro",
      alt: "Chauffeur professionnel préparant son parcours avec LODENE."
    }
  ],
  "sst-initial": [
    {
      imageSlug: "sst-initial",
      keyword: "Gestes secours",
      alt: "Formation SST initiale avec formateur et apprenants LODENE."
    },
    {
      imageSlug: "mac-sst",
      keyword: "Prévention",
      alt: "Groupe en recyclage SST travaillant les gestes de secours."
    },
    {
      imageSlug: "sst-initial",
      keyword: "Mise en pratique",
      alt: "Apprenants SST en mise en pratique autour d'un mannequin de secourisme."
    }
  ],
  "mac-sst": [
    {
      imageSlug: "mac-sst",
      keyword: "Recyclage SST",
      alt: "Formation MAC SST avec groupe d'apprenants et matériel de secours."
    },
    {
      imageSlug: "sst-initial",
      keyword: "Gestes secours",
      alt: "Formation SST avec formateur et exercices pratiques."
    },
    {
      imageSlug: "mac-sst",
      keyword: "Mise à jour",
      alt: "Apprenants en maintien et actualisation des compétences SST."
    }
  ],
  "gestes-postures-prap": [
    {
      imageSlug: "sst-initial",
      keyword: "Prévention TMS",
      alt: "Formation prévention avec formateur et apprenants LODENE."
    },
    {
      imageSlug: "gerbeur-r485",
      keyword: "Manutention",
      alt: "Opérateur en situation de manutention en environnement professionnel."
    },
    {
      imageSlug: "chariots-elevateurs-r489",
      keyword: "Ergonomie",
      alt: "Formation logistique et prévention des risques en entrepôt."
    }
  ],
  "incendie-evacuation": [
    {
      imageSlug: "sst-initial",
      keyword: "Réagir vite",
      alt: "Formation sécurité avec formateur et apprenants LODENE."
    },
    {
      imageSlug: "mac-sst",
      keyword: "Prévention",
      alt: "Groupe en formation prévention et sécurité au travail."
    },
    {
      imageSlug: "echafaudage-roulant-r457",
      keyword: "Évacuation",
      alt: "Formation sécurité en environnement professionnel encadré."
    }
  ],
  "habilitation-electrique": [
    {
      imageSlug: "pont-roulant-r484",
      keyword: "Habilitation",
      alt: "Formation sécurité en atelier industriel avec LODENE."
    },
    {
      imageSlug: "nacelles-pemp-r486",
      keyword: "Prévention",
      alt: "Formation prévention des risques avec équipements de sécurité."
    },
    {
      imageSlug: "echafaudage-roulant-r457",
      keyword: "NF C 18-510",
      alt: "Groupe en formation sécurité dans un environnement professionnel."
    }
  ],
  "chariots-elevateurs-r489": [
    {
      imageSlug: "chariots-elevateurs-r489",
      keyword: "Chariots R489",
      alt: "Apprenant en formation R489 sur chariot élévateur avec LODENE."
    },
    {
      imageSlug: "gerbeur-r485",
      keyword: "Manutention",
      alt: "Opérateur utilisant un gerbeur accompagnant en entrepôt sécurisé."
    },
    {
      imageSlug: "terberg-tracteur-parc",
      keyword: "Zone logistique",
      alt: "Conducteur en formation dans une zone logistique sécurisée."
    }
  ],
  "gerbeur-r485": [
    {
      imageSlug: "gerbeur-r485",
      keyword: "Gerbeur R485",
      alt: "Opérateur utilisant un gerbeur accompagnant sous supervision LODENE."
    },
    {
      imageSlug: "chariots-elevateurs-r489",
      keyword: "Sécurité entrepôt",
      alt: "Formation sécurité en entrepôt avec chariot élévateur."
    },
    {
      imageSlug: "terberg-tracteur-parc",
      keyword: "Manœuvres",
      alt: "Formation aux manœuvres en environnement logistique."
    }
  ],
  "nacelles-pemp-r486": [
    {
      imageSlug: "nacelles-pemp-r486",
      keyword: "Nacelles R486",
      alt: "Formation nacelle PEMP R486 avec harnais et formateur LODENE."
    },
    {
      imageSlug: "echafaudage-roulant-r457",
      keyword: "Travaux en hauteur",
      alt: "Groupe en formation autour d'un échafaudage roulant sécurisé."
    },
    {
      imageSlug: "pont-roulant-r484",
      keyword: "Sécurité chantier",
      alt: "Apprenant manipulant un pont roulant en atelier sécurisé."
    }
  ],
  "pont-roulant-r484": [
    {
      imageSlug: "pont-roulant-r484",
      keyword: "Pont roulant",
      alt: "Apprenant manipulant un pont roulant avec télécommande en atelier."
    },
    {
      imageSlug: "gerbeur-r485",
      keyword: "Commande au sol",
      alt: "Opérateur formé à la conduite d'engins en sécurité."
    },
    {
      imageSlug: "chariots-elevateurs-r489",
      keyword: "Évaluation pratique",
      alt: "Formation pratique en environnement industriel sécurisé."
    }
  ],
  "echafaudage-roulant-r457": [
    {
      imageSlug: "echafaudage-roulant-r457",
      keyword: "Échafaudage R457",
      alt: "Groupe en formation R457 autour d'un échafaudage roulant."
    },
    {
      imageSlug: "nacelles-pemp-r486",
      keyword: "Travaux en hauteur",
      alt: "Formation travaux en hauteur avec nacelle et équipements de sécurité."
    },
    {
      imageSlug: "pont-roulant-r484",
      keyword: "Sécurité chantier",
      alt: "Atelier de formation sécurité en environnement professionnel."
    }
  ],
  "terberg-tracteur-parc": [
    {
      imageSlug: "terberg-tracteur-parc",
      keyword: "Tracteur de parc",
      alt: "Conducteur en formation sur tracteur de parc avec LODENE."
    },
    {
      imageSlug: "chariots-elevateurs-r489",
      keyword: "Zone logistique",
      alt: "Apprenant en conduite d'engin dans une zone logistique."
    },
    {
      imageSlug: "gerbeur-r485",
      keyword: "Manœuvres précises",
      alt: "Opérateur travaillant les manœuvres en entrepôt sécurisé."
    }
  ]
};

function curatedPhotoSlides(slug: string): FormationHeroSlide[] {
  return (CURATED_SLIDE_SETS[slug] ?? [])
    .map((slide) => {
      const image = BY_SLUG[slide.imageSlug];
      if (!image) return null;
      return toImageSlide({ ...image, alt: slide.alt }, slide.keyword);
    })
    .filter(Boolean) as FormationHeroSlide[];
}

export function formationHeroSlides(slug: string, productLine?: ProductLine, imageOverride?: FormationHeroImageOverride): FormationHeroSlide[] {
  const withImageOverride = (slides: FormationHeroSlide[]) => dedupeSlides([...overridePhotoSlide(imageOverride), ...slides]).slice(0, 3);

  const dedicated = dedicatedPhotoSlides(slug);
  if (dedicated.length > 0) return withImageOverride(dedicated);

  const curated = curatedPhotoSlides(slug);
  if (curated.length > 0) return withImageOverride(curated);

  const ownImage = BY_SLUG[slug];
  if (ownImage) {
    const fallbackImages = BY_PRODUCT_LINE_SLIDES[productLine ?? "AUTO_ECOLE"] ?? BY_PRODUCT_LINE_SLIDES.AUTO_ECOLE;
    return withImageOverride(dedupeImages([ownImage, ...fallbackImages]).slice(0, 3).map((image) => toImageSlide(image)));
  }

  if (productLine === "DIGITAL") return withImageOverride(digitalIllustrationSlides(slug));

  const fallbackImages = BY_PRODUCT_LINE_SLIDES[productLine ?? "AUTO_ECOLE"] ?? BY_PRODUCT_LINE_SLIDES.AUTO_ECOLE;
  return withImageOverride(fallbackImages.slice(0, 3).map((image) => toImageSlide(image)));
}
