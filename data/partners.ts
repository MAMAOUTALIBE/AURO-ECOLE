export type FeaturedPartner = {
  id: string;
  name: string;
  activity: string;
  description: string;
  logoUrl: string;
  address: string;
  phone?: string;
  email?: string;
  instagram?: string;
  registration?: string;
  websiteUrl?: string;
  sourceLabel: string;
  sourceUrl: string;
};

export const featuredPartners: FeaturedPartner[] = [
  {
    id: "kts",
    name: "KTS",
    activity: "Commerce d’alimentation générale",
    description: "Épicerie et commerce alimentaire de proximité implanté à Conflans-Sainte-Honorine.",
    logoUrl: "/partners/kts.png",
    address: "186–198 avenue du Maréchal Foch, 78700 Conflans-Sainte-Honorine",
    registration: "SIREN 794 214 593 · RCS Versailles",
    sourceLabel: "Fiche entreprise KTS",
    sourceUrl: "https://www.pappers.fr/entreprise/kts-794214593"
  },
  {
    id: "efem-distribution",
    name: "EFEM Distribution",
    activity: "Distribution de produits carnés",
    description: "Grossiste et distributeur spécialisé dans les produits carnés pour la restauration collective.",
    logoUrl: "/partners/efem-distribution.png",
    address: "24 rue du Fer à Cheval, 95200 Sarcelles",
    phone: "01 34 04 22 96",
    email: "efem.distribution@gmail.com",
    registration: "SIRET 824 250 799 00023",
    sourceLabel: "Répertoire officiel des établissements",
    sourceUrl: "https://acceslibre.beta.gouv.fr/app/95-sarcelles/a/boucherie/erp/efem-distribution/"
  },
  {
    id: "barber-shop-56",
    name: "Barber Shop 56",
    activity: "Barbier et salon de coiffure",
    description: "Barbier de proximité proposant coupes et soins pour hommes à Conflans-Sainte-Honorine.",
    logoUrl: "/partners/barber-shop-56.png",
    address: "56 rue Désiré Clément, 78700 Conflans-Sainte-Honorine",
    phone: "06 05 50 45 99",
    instagram: "bk_barbershop_56",
    websiteUrl: "https://www.planity.com/barber-shop-56-78700-conflans-sainte-honorine",
    registration: "SIREN 882 580 566",
    sourceLabel: "Fiche Barber Shop 56",
    sourceUrl: "https://www.planity.com/barber-shop-56-78700-conflans-sainte-honorine"
  }
];
