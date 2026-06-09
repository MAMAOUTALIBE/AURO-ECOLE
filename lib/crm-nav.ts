import {
  BookOpenCheck,
  Bot,
  Building2,
  Car,
  CalendarClock,
  CalendarDays,
  CreditCard,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  GraduationCap,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  MapPin,
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
      { label: "Leads", href: "/admin/pipeline", icon: FolderKanban, status: "live" },
      { label: "Prospects", href: "/admin/pipeline", icon: Target, status: "live" },
      { label: "Devis", href: "/admin/bientot?m=Devis", icon: FileSpreadsheet, status: "soon" },
      { label: "Contrats", href: "/admin/bientot?m=Contrats", icon: FileSignature, status: "soon" }
    ]
  },
  {
    title: "Pédagogie",
    icon: GraduationCap,
    items: [
      { label: "Élèves", href: "/admin/eleves", icon: Users, status: "live" },
      { label: "Moniteurs", href: "/admin/moniteurs", icon: UserCog, status: "live" },
      { label: "Leçons", href: "/admin/planning", icon: CalendarClock, status: "live" },
      { label: "Planning", href: "/admin/planning", icon: CalendarDays, status: "live" },
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
      { label: "Factures", href: "/admin/bientot?m=Factures", icon: Receipt, status: "soon" },
      { label: "CPF", href: "/admin/cpf", icon: PiggyBank, status: "live" },
      { label: "Relances", href: "/admin/bientot?m=Relances", icon: Mail, status: "soon" }
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
    title: "Contenu",
    icon: FileText,
    items: [
      { label: "FAQ", href: "/admin/site/faq", icon: HelpCircle, status: "live" },
      { label: "Avis", href: "/admin/avis", icon: Star, status: "live" },
      { label: "Pages", href: "/admin/bientot?m=Pages", icon: FileText, status: "soon" },
      { label: "Blog", href: "/admin/bientot?m=Blog", icon: Newspaper, status: "soon" },
      { label: "Médias", href: "/admin/bientot?m=Médias", icon: ImageIcon, status: "soon" }
    ]
  },
  {
    title: "Reporting",
    icon: FileSpreadsheet,
    items: [
      { label: "Statistiques", href: "/admin/reporting", icon: FileSpreadsheet, status: "live" },
      { label: "Rapports", href: "/admin/bientot?m=Rapports", icon: ScrollText, status: "soon" }
    ]
  },
  {
    title: "Automatisation & IA",
    icon: Sparkles,
    items: [
      { label: "Assistant IA", href: "/admin/assistant", icon: Bot, status: "live" },
      { label: "Workflows", href: "/admin/bientot?m=Workflows", icon: Workflow, status: "soon" },
      { label: "Automatisations", href: "/admin/bientot?m=Automatisations", icon: Wrench, status: "soon" }
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
