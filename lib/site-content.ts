// Contenu dynamique du site public piloté depuis le CMS (clés SiteSetting).
// Les valeurs par défaut ci-dessous = état actuel du site (fallback si l'API est
// indisponible ou si une clé n'est pas encore renseignée).
// IMPORTANT : garder en phase avec backend/src/data/initial-data.ts (initialSiteSettings).

const DEFAULT_BACKEND_URL = "http://127.0.0.1:4000";

// ---- Types --------------------------------------------------------------------

export type NavChild = {
  id: string;
  label: string;
  href: string;
  active: boolean;
  icon?: string;
};

export type NavItem = NavChild & {
  children?: NavChild[];
};

export type NavPrimary = { items: NavItem[] };

export type NavCta = NavChild & { variant?: "outline" | "solid" };
export type NavCtas = { items: NavCta[] };

export type HeroCta = { label: string; href: string };
export type HeroBadge = { icon: string; title: string; detail: string };
export type HeroHome = {
  enabled: boolean;
  scriptLine: string;
  connector: string;
  brand: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
  badges: HeroBadge[];
};

// ---- Valeurs par défaut (= header/hero actuels) -------------------------------

export const defaultNavPrimary: NavPrimary = {
  items: [
    {
      id: "formations",
      label: "Formations",
      href: "/formations",
      active: true,
      icon: "GraduationCap",
      children: [
        { id: "permis", label: "Permis B & conduite", href: "/formations", active: true, icon: "Car" },
        { id: "vtc", label: "VTC & transport", href: "/vtc", active: true, icon: "CarTaxiFront" },
        { id: "securite", label: "Sécurité & secourisme (SST)", href: "/sst", active: true, icon: "ShieldCheck" },
        { id: "caces", label: "CACES & logistique", href: "/logistique-securite", active: true, icon: "HardHat" },
        { id: "digital", label: "Digital, IA & CRM", href: "/formations", active: true, icon: "Sparkles" },
        { id: "toutes", label: "Toutes les formations", href: "/formations", active: true, icon: "GraduationCap" }
      ]
    },
    {
      id: "financement",
      label: "Financement",
      href: "/financement",
      active: true,
      icon: "WalletCards",
      children: [
        { id: "financement", label: "Financement", href: "/financement", active: true, icon: "WalletCards" },
        { id: "cpf", label: "CPF", href: "/cpf", active: true, icon: "WalletCards" },
        { id: "tarifs", label: "Tarifs", href: "/tarifs", active: true, icon: "CreditCard" },
        { id: "paiement", label: "Paiement en plusieurs fois", href: "/tarifs#simulateur", active: true, icon: "CreditCard" }
      ]
    },
    { id: "agences", label: "Nos agences", href: "/contact#agences", active: true, icon: "Building2" },
    {
      id: "decouvrir",
      label: "Découvrir",
      href: "/a-propos",
      active: true,
      icon: "Sparkles",
      children: [
        { id: "a-propos", label: "À propos", href: "/a-propos", active: true, icon: "Info" },
        { id: "faq", label: "FAQ", href: "/faq", active: true, icon: "CircleHelp" },
        { id: "blog", label: "Blog", href: "/blog", active: true, icon: "Newspaper" }
      ]
    },
    { id: "avis", label: "Avis", href: "/avis", active: true, icon: "Star" },
    { id: "contact", label: "Contact", href: "/contact", active: true, icon: "MessageCircle" }
  ]
};

export const defaultNavCtas: NavCtas = {
  items: [
    { id: "inscription", label: "Inscription", href: "/inscription", active: true, icon: "Sparkles", variant: "solid" }
  ]
};

export const defaultHeroHome: HeroHome = {
  enabled: true,
  scriptLine: "Passe ton permis",
  connector: "avec",
  brand: "LODENE",
  subtitle: "Une formation claire, rapide et flexible, adaptée à ton rythme.",
  image: "/loden-hero.jpg",
  imageAlt: "Voiture école moderne LODENE avec élève et moniteur",
  primaryCta: { label: "Je m'inscris", href: "/inscription" },
  secondaryCta: { label: "Nos formations", href: "/formations" },
  badges: [
    { icon: "ShieldCheck", title: "Agréée", detail: "Agrément E2507800260" },
    { icon: "MapPin", title: "Conflans", detail: "Sainte-Honorine (78)" },
    { icon: "WalletCards", title: "CPF", detail: "formations éligibles" }
  ]
};

// ---- Lecture côté serveur (composants serveur uniquement) ---------------------

/**
 * Récupère une clé de réglage depuis le backend (server-side, no-store).
 * Retourne `fallback` si l'API est indisponible ou la clé absente.
 */
export async function getSiteSetting<T>(key: string, fallback: T): Promise<T> {
  const baseUrl = process.env.LODEN_API_URL ?? DEFAULT_BACKEND_URL;
  try {
    const response = await fetch(new URL(`/api/site/${key}`, baseUrl), { cache: "no-store" });
    if (!response.ok) return fallback;
    const json = (await response.json()) as { data?: { value?: unknown } | null };
    const value = json?.data?.value;
    return value == null ? fallback : (value as T);
  } catch {
    return fallback;
  }
}
