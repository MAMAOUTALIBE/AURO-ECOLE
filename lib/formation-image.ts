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
  if (slug === "ia-crm-automatisation") {
    return [
      {
        kind: "illustration",
        icon: "Sparkles",
        keyword: "IA au quotidien",
        gradient: "from-loden-700 via-[#08AEB8] to-loden-900"
      },
      {
        kind: "illustration",
        icon: "Database",
        keyword: "Mini-CRM & suivi clients",
        gradient: "from-loden-800 via-loden-700 to-loden-900"
      },
      {
        kind: "illustration",
        icon: "Workflow",
        keyword: "Relances automatisées",
        gradient: "from-[#08AEB8] via-loden-700 to-loden-900"
      }
    ];
  }

  return [
    { kind: "illustration", icon: "Sparkles", keyword: "Digital & IA", gradient: "from-loden-700 via-[#08AEB8] to-loden-900" },
    { kind: "illustration", icon: "Users", keyword: "Suivi client", gradient: "from-loden-800 via-loden-700 to-loden-900" },
    { kind: "illustration", icon: "Zap", keyword: "Automatisation", gradient: "from-[#08AEB8] via-loden-700 to-loden-900" }
  ];
}

function permisAutoMaitriseSlides(): FormationHeroSlide[] {
  return [
    toImageSlide(
      {
        ...BY_SLUG["permis-b-auto-maitrise"],
        alt: "Élève et moniteur préparant une leçon en boîte automatique avec LODENE."
      },
      "Boîte automatique"
    ),
    toImageSlide(
      {
        ...BY_SLUG["permis-b-auto-declic"],
        alt: "Élève en conduite renforcée avec un moniteur LODENE dans une voiture automatique."
      },
      "Conduite renforcée"
    ),
    toImageSlide(
      {
        ...BY_SLUG["conduite-accompagnee"],
        alt: "Jeune conducteur accompagné préparant son passage à l'examen avec LODENE."
      },
      "Prêt pour l'examen"
    )
  ];
}

function permisManuelEssentielSlides(): FormationHeroSlide[] {
  return [
    toImageSlide(
      {
        ...BY_SLUG["permis-b-manuel-essentiel"],
        alt: "Élève apprenant à conduire en boîte manuelle avec un moniteur LODENE."
      },
      "Boîte manuelle"
    ),
    toImageSlide(
      {
        ...BY_SLUG["permis-b-manuel-confort"],
        alt: "Élève travaillant la maîtrise du levier de vitesse avec un moniteur LODENE."
      },
      "Maîtrise du levier"
    ),
    toImageSlide(
      {
        ...BY_SLUG["conduite-accompagnee"],
        alt: "Jeune conducteur préparant son passage à l'examen avec LODENE."
      },
      "Prêt pour l'examen"
    )
  ];
}

function permisManuelConfortSlides(): FormationHeroSlide[] {
  return [
    toImageSlide(
      {
        ...BY_SLUG["permis-b-manuel-confort"],
        alt: "Élève travaillant la boîte manuelle avec un moniteur LODENE près d'une voiture auto-école."
      },
      "Boîte manuelle"
    ),
    toImageSlide(
      {
        ...BY_SLUG["permis-b-manuel-essentiel"],
        alt: "Élève en conduite renforcée avec un moniteur LODENE en boîte manuelle."
      },
      "Conduite renforcée"
    ),
    toImageSlide(
      {
        ...BY_SLUG["conduite-accompagnee"],
        alt: "Jeune conducteur accompagné préparant son passage à l'examen avec LODENE."
      },
      "Prêt pour l'examen"
    )
  ];
}

export function formationHeroSlides(slug: string, productLine?: ProductLine): FormationHeroSlide[] {
  const dedicated = dedicatedPhotoSlides(slug);
  if (dedicated.length > 0) return dedicated;

  if (slug === "permis-b-auto-maitrise") return permisAutoMaitriseSlides();
  if (slug === "permis-b-manuel-essentiel") return permisManuelEssentielSlides();
  if (slug === "permis-b-manuel-confort") return permisManuelConfortSlides();

  const ownImage = BY_SLUG[slug];
  if (ownImage) {
    const fallbackImages = BY_PRODUCT_LINE_SLIDES[productLine ?? "AUTO_ECOLE"] ?? BY_PRODUCT_LINE_SLIDES.AUTO_ECOLE;
    return dedupeImages([ownImage, ...fallbackImages]).slice(0, 3).map((image) => toImageSlide(image));
  }

  if (productLine === "DIGITAL") return digitalIllustrationSlides(slug);

  const fallbackImages = BY_PRODUCT_LINE_SLIDES[productLine ?? "AUTO_ECOLE"] ?? BY_PRODUCT_LINE_SLIDES.AUTO_ECOLE;
  return fallbackImages.slice(0, 3).map((image) => toImageSlide(image));
}
