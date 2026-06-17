import type { ProductLine } from "@/data/site";

type FormationImage = {
  src: string;
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
