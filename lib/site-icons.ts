import {
  Award,
  BadgeCheck,
  Building2,
  CalendarCheck,
  Car,
  CarTaxiFront,
  CircleHelp,
  Clock,
  CreditCard,
  GraduationCap,
  HardHat,
  HeartHandshake,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Newspaper,
  Phone,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Timer,
  UserRound,
  WalletCards,
  type LucideIcon
} from "lucide-react";

/**
 * Registre d'icônes pilotables depuis le CMS (menu, hero, badges…).
 * L'admin choisit une icône par son nom ; le rendu la résout via ce registre.
 */
export const SITE_ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  MapPin,
  WalletCards,
  CreditCard,
  GraduationCap,
  Car,
  CarTaxiFront,
  HardHat,
  Sparkles,
  Star,
  Info,
  CircleHelp,
  Newspaper,
  Building2,
  MessageCircle,
  UserRound,
  Award,
  BadgeCheck,
  CalendarCheck,
  Clock,
  Phone,
  Mail,
  Route,
  Timer,
  Target,
  HeartHandshake,
  Smartphone
};

export const SITE_ICON_NAMES = Object.keys(SITE_ICONS);

export function resolveSiteIcon(name?: string | null, fallback: LucideIcon = Sparkles): LucideIcon {
  if (name && SITE_ICONS[name]) return SITE_ICONS[name];
  return fallback;
}
