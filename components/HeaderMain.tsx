"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  Building2,
  Car,
  ChevronDown,
  CircleHelp,
  CreditCard,
  GraduationCap,
  Info,
  Menu,
  MessageCircle,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  WalletCards,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type HeaderLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type HeaderDropdown = HeaderLink & {
  items: HeaderLink[];
};

const dropdowns: HeaderDropdown[] = [
  {
    href: "/formations",
    label: "Formations",
    icon: GraduationCap,
    items: [
      { href: "/formations/permis-b-manuel", label: "Permis B", icon: Car },
      { href: "/formations/permis-b-automatique", label: "Permis automatique", icon: Car },
      { href: "/formations/conduite-accompagnee", label: "Conduite accompagnée", icon: ShieldCheck },
      { href: "/formations/perfectionnement", label: "Conduite supervisée", icon: UserRound },
      { href: "/formations/permis-accelere", label: "Stage accéléré", icon: Sparkles },
      { href: "/formations/code-en-ligne", label: "Code de la route", icon: BookOpenCheck }
    ]
  },
  {
    href: "/cpf",
    label: "Financement",
    icon: WalletCards,
    items: [
      { href: "/cpf", label: "CPF", icon: WalletCards },
      { href: "/tarifs", label: "Tarifs", icon: CreditCard },
      { href: "/tarifs#simulateur", label: "Paiement en plusieurs fois", icon: CreditCard },
      { href: "/cpf#aides", label: "Aides et financements", icon: ShieldCheck }
    ]
  },
  {
    href: "/a-propos",
    label: "Découvrir",
    icon: Sparkles,
    items: [
      { href: "/a-propos", label: "À propos", icon: Info },
      { href: "/avis", label: "Avis clients", icon: Star },
      { href: "/cpf#faq", label: "FAQ", icon: CircleHelp },
      { href: "/blog", label: "Blog", icon: Newspaper }
    ]
  }
];

const primaryLinks: HeaderLink[] = [
  { href: "/contact#agences", label: "Nos agences", icon: Building2 },
  { href: "/contact", label: "Contact", icon: MessageCircle }
];

const actionLinks: HeaderLink[] = [
  { href: "/espace-eleve", label: "Espace Élève", icon: UserRound },
  { href: "/inscription", label: "Inscription", icon: Sparkles }
];

function Logo() {
  return (
    <Link href="/" className="focus-ring flex shrink-0 items-center gap-3 rounded-full pr-2">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-loden-800 shadow-soft"
      >
        L
      </span>
      <span className="shrink-0">
        <span className="block whitespace-nowrap text-lg font-extrabold tracking-[0.08em] text-white drop-shadow-sm sm:text-xl">
          LODENE
        </span>
      </span>
    </Link>
  );
}

function PillLink({
  href,
  label,
  icon: Icon,
  active,
  variant = "default",
  onClick
}: HeaderLink & {
  active?: boolean;
  variant?: "default" | "outline" | "solid";
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition",
        variant === "default" &&
          "border-white/45 bg-white/18 text-white shadow-[0_8px_24px_rgba(20,33,38,0.08)] backdrop-blur hover:border-white/80 hover:bg-white/30",
        variant === "outline" &&
          "border-white bg-white text-loden-800 shadow-[0_8px_24px_rgba(20,33,38,0.10)] hover:bg-loden-50",
        variant === "solid" &&
          "border-loden-900 bg-loden-900 text-white shadow-soft hover:border-loden-800 hover:bg-loden-800",
        active && variant === "default" && "border-white/90 bg-white/32 text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}

function DropdownPill({
  dropdown,
  active,
  open,
  onOpen,
  onClose
}: {
  dropdown: HeaderDropdown;
  active: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const Icon = dropdown.icon;

  return (
    <div
      className="group relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onClose();
        }
      }}
    >
      <Link
        href={dropdown.href}
        className={cn(
          "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/45 bg-white/18 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(20,33,38,0.08)] backdrop-blur transition hover:border-white/80 hover:bg-white/30",
          active && "border-white/90 bg-white/32"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{dropdown.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition group-hover:rotate-180 group-focus-within:rotate-180",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </Link>
      <div
        className="absolute left-1/2 top-full z-[70] w-72 -translate-x-1/2 pt-3"
        style={{ display: open ? "block" : "none" }}
      >
        <div className="rounded-[2rem] border border-white/25 bg-loden-700 p-2 shadow-[0_28px_90px_rgba(20,33,38,0.24)] ring-1 ring-loden-500/40">
          {dropdown.items.map((item) => {
            const ItemIcon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white transition hover:bg-white/14 hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-loden-800 shadow-soft">
                  <ItemIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HeaderMain() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-40 bg-loden-pearl/85 py-3 backdrop-blur-xl">
      <div className="container-pad">
        <div className="flex min-h-16 items-center justify-between gap-3 rounded-full border border-white/35 bg-loden-700 px-3 py-2 shadow-premium ring-1 ring-loden-500/40">
          <Logo />

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Navigation principale">
            <DropdownPill
              dropdown={dropdowns[0]}
              active={pathname.startsWith("/formations")}
              open={openDropdown === dropdowns[0].label}
              onOpen={() => setOpenDropdown(dropdowns[0].label)}
              onClose={() => setOpenDropdown(null)}
            />
            <DropdownPill
              dropdown={dropdowns[1]}
              active={pathname === "/cpf" || pathname === "/tarifs"}
              open={openDropdown === dropdowns[1].label}
              onOpen={() => setOpenDropdown(dropdowns[1].label)}
              onClose={() => setOpenDropdown(null)}
            />
            <PillLink {...primaryLinks[0]} active={pathname === "/contact"} />
            <DropdownPill
              dropdown={dropdowns[2]}
              active={pathname === "/a-propos" || pathname === "/avis"}
              open={openDropdown === dropdowns[2].label}
              onOpen={() => setOpenDropdown(dropdowns[2].label)}
              onClose={() => setOpenDropdown(null)}
            />
            <PillLink {...primaryLinks[1]} active={pathname === "/contact"} />
            <PillLink {...actionLinks[0]} active={pathname === "/espace-eleve"} variant="outline" />
            <PillLink {...actionLinks[1]} active={pathname === "/inscription"} variant="solid" />
          </nav>

          <div className="flex shrink-0 items-center gap-2 xl:hidden">
            <Link
              href="/espace-eleve"
              className="focus-ring hidden h-12 w-12 items-center justify-center gap-2 rounded-full border border-white bg-white text-sm font-semibold text-loden-800 shadow-[0_8px_24px_rgba(20,33,38,0.10)] min-[375px]:inline-flex sm:w-auto sm:px-4 sm:py-2"
              aria-label="Espace Élève"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="hidden whitespace-nowrap sm:inline">Espace Élève</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="focus-ring inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/18 text-white shadow-[0_8px_24px_rgba(20,33,38,0.08)] transition hover:bg-white/30"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="mt-3 rounded-[2rem] border border-slate-200/80 bg-white p-3 shadow-premium xl:hidden">
            <nav className="grid gap-2" aria-label="Navigation mobile">
              {dropdowns.map((dropdown) => {
                const Icon = dropdown.icon;

                return (
                  <div key={dropdown.label} className="rounded-3xl bg-loden-fog p-2">
                    <Link
                      href={dropdown.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-2 py-2 text-sm font-bold uppercase tracking-[0.12em] text-loden-700"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {dropdown.label}
                    </Link>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {dropdown.items.map((item) => (
                        <PillLink key={item.href} {...item} variant="outline" onClick={() => setMenuOpen(false)} />
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="grid gap-2 pt-1 sm:grid-cols-2">
                {primaryLinks.map((item) => (
                  <PillLink key={item.href} {...item} variant="outline" onClick={() => setMenuOpen(false)} />
                ))}
              </div>

              <div className="grid gap-2 pt-1 sm:grid-cols-2">
                <PillLink {...actionLinks[0]} variant="outline" onClick={() => setMenuOpen(false)} />
                <PillLink {...actionLinks[1]} variant="solid" onClick={() => setMenuOpen(false)} />
              </div>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
