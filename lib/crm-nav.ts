import {
  BarChart3,
  BellRing,
  BookOpenCheck,
  Bot,
  Building2,
  Car,
  CalendarClock,
  CreditCard,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  GraduationCap,
  Handshake,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  MapPin,
  Menu,
  Megaphone,
  MessageSquare,
  Newspaper,
  PiggyBank,
  Receipt,
  ScrollText,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserCog,
  Users,
  Workflow,
  Wrench,
  type LucideIcon
} from "lucide-react";

export type NavStatus = "live" | "soon";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  status: NavStatus;
};

export type NavSection = {
  /** Catégorie affichée en libellé (masquée en mode compact). */
  title: string;
  icon: LucideIcon;
  items: NavItem[];
};

/**
 * Arborescence du CRM LODENE.
 * `live` = écran fonctionnel branché sur l'API ; `soon` = module cartographié, écran « en préparation »
 * (jamais de faux contenu). Les routes `live` réutilisent les pages existantes — aucun lien cassé.
 */
export const crmNav: NavSection[] = [
  {
    title: "Pilotage",
    icon: LayoutDashboard,
    items: [{ label: "Tableau de bord", href: "/admin", icon: LayoutDashboard, status: "live" }]
  },
  {
    title: "Commercial",
    icon: Target,
    items: [
      { label: "Rendez-vous & planning", href: "/admin/rendez-vous", icon: CalendarClock, status: "live" },
      { label: "Leads", href: "/admin/pipeline", icon: FolderKanban, status: "live" },
      { label: "Prospects", href: "/admin/pipeline", icon: Target, status: "live" },
      { label: "Offre QR -50 €", href: "/admin/offre-qr-50", icon: Megaphone, status: "live" },
      { label: "Partenaires", href: "/admin/partenaires", icon: Handshake, status: "live" },
      { label: "Devis", href: "/admin/devis", icon: FileSpreadsheet, status: "live" },
      { label: "Contrats", href: "/admin/contrats", icon: FileSignature, status: "live" }
    ]
  },
  {
    title: "Pédagogie",
    icon: GraduationCap,
    items: [
      { label: "Élèves", href: "/admin/eleves", icon: Users, status: "live" },
      { label: "Moniteurs", href: "/admin/moniteurs", icon: UserCog, status: "live" },
      { label: "Examens", href: "/admin/examens", icon: GraduationCap, status: "live" },
      { label: "Formations", href: "/admin/formations", icon: BookOpenCheck, status: "live" },
      { label: "Véhicules", href: "/admin/vehicules", icon: Car, status: "live" }
    ]
  },
  {
    title: "Finance",
    icon: CreditCard,
    items: [
      { label: "Paiements", href: "/admin/finance", icon: CreditCard, status: "live" },
      { label: "Factures", href: "/admin/factures", icon: Receipt, status: "live" },
      { label: "CPF", href: "/admin/cpf", icon: PiggyBank, status: "live" },
      { label: "Relances", href: "/admin/relances", icon: BellRing, status: "live" }
    ]
  },
  {
    title: "Communication",
    icon: MessageSquare,
    items: [
      { label: "Emails", href: "/admin/bientot?m=Emails", icon: Mail, status: "soon" },
      { label: "SMS", href: "/admin/bientot?m=SMS", icon: MessageSquare, status: "soon" },
      { label: "Campagnes", href: "/admin/bientot?m=Campagnes", icon: Megaphone, status: "soon" }
    ]
  },
  {
    title: "Site public",
    icon: LayoutTemplate,
    items: [
      { label: "Hero accueil", href: "/admin/site/hero", icon: LayoutTemplate, status: "live" },
      { label: "Menu & navigation", href: "/admin/site/navigation", icon: Menu, status: "live" },
      { label: "Avis Google", href: "/admin/site/avis-google", icon: Star, status: "live" },
      { label: "Médiathèque", href: "/admin/medias", icon: ImageIcon, status: "live" }
    ]
  },
  {
    title: "Contenu",
    icon: FileText,
    items: [
      { label: "FAQ", href: "/admin/site/faq", icon: HelpCircle, status: "live" },
      { label: "Avis", href: "/admin/avis", icon: Star, status: "live" },
      { label: "Pages", href: "/admin/pages", icon: FileText, status: "live" },
      { label: "Blog", href: "/admin/blog", icon: Newspaper, status: "live" }
    ]
  },
  {
    title: "Reporting",
    icon: FileSpreadsheet,
    items: [
      { label: "Statistiques & Trafic", href: "/admin/trafic", icon: BarChart3, status: "live" },
      { label: "Statistiques", href: "/admin/reporting", icon: FileSpreadsheet, status: "live" },
      { label: "Rapports", href: "/admin/rapports", icon: ScrollText, status: "live" }
    ]
  },
  {
    title: "Automatisation & IA",
    icon: Sparkles,
    items: [
      { label: "Assistant IA", href: "/admin/assistant", icon: Bot, status: "live" },
      { label: "Workflows", href: "/admin/workflows", icon: Workflow, status: "live" },
      { label: "Automatisations", href: "/admin/automatisations", icon: Wrench, status: "live" }
    ]
  },
  {
    title: "Administration",
    icon: ShieldCheck,
    items: [
      { label: "Société", href: "/admin/site/societe", icon: Building2, status: "live" },
      { label: "Agences", href: "/admin/agences", icon: MapPin, status: "live" },
      { label: "Utilisateurs", href: "/admin/utilisateurs", icon: Users, status: "live" },
      { label: "Permissions", href: "/admin/permissions", icon: ShieldCheck, status: "live" },
      { label: "Paramètres", href: "/admin/parametres", icon: Settings2, status: "live" },
      { label: "Journaux", href: "/admin/journaux", icon: ScrollText, status: "live" }
    ]
  }
];

/** Aplati pour la recherche / le matching de route active. */
export const crmNavFlat: NavItem[] = crmNav.flatMap((section) => section.items);
