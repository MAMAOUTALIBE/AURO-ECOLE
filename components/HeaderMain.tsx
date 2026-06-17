"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  defaultNavCtas,
  defaultNavPrimary,
  type NavCta,
  type NavCtas,
  type NavItem,
  type NavPrimary
} from "@/lib/site-content";
import { resolveSiteIcon } from "@/lib/site-icons";

function hrefPath(href: string) {
  return href.split("#")[0] || "/";
}

function matchPath(pathname: string, href: string) {
  const path = hrefPath(href);
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function isItemActive(pathname: string, item: NavItem) {
  if (matchPath(pathname, item.href)) return true;
  return (item.children ?? []).some((child) => child.active && matchPath(pathname, child.href));
}

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
}: {
  href: string;
  label: string;
  icon: LucideIcon;
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
  item,
  active,
  open,
  onOpen,
  onClose
}: {
  item: NavItem;
  active: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const Icon = resolveSiteIcon(item.icon);
  const children = (item.children ?? []).filter((child) => child.active);

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
        href={item.href}
        className={cn(
          "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/45 bg-white/18 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(20,33,38,0.08)] backdrop-blur transition hover:border-white/80 hover:bg-white/30",
          active && "border-white/90 bg-white/32"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
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
          {children.map((child) => {
            const ItemIcon = resolveSiteIcon(child.icon);

            return (
              <Link
                key={child.id}
                href={child.href}
                className="focus-ring flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white transition hover:bg-white/14 hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-loden-800 shadow-soft">
                  <ItemIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                {child.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HeaderMain({ nav, ctas }: { nav?: NavPrimary; ctas?: NavCtas }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const items = (nav ?? defaultNavPrimary).items.filter((item) => item.active);
  const ctaItems: NavCta[] = (ctas ?? defaultNavCtas).items.filter((item) => item.active);
  const dropdowns = items.filter((item) => (item.children ?? []).some((child) => child.active));

  return (
    <header className="sticky top-0 z-40 bg-loden-pearl/85 py-3 backdrop-blur-xl">
      <div className="container-pad">
        <div className="flex min-h-16 items-center justify-between gap-3 rounded-full border border-white/35 bg-loden-700 px-3 py-2 shadow-premium ring-1 ring-loden-500/40">
          <Logo />

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Navigation principale">
            {items.map((item) => {
              const hasChildren = (item.children ?? []).some((child) => child.active);
              if (hasChildren) {
                return (
                  <DropdownPill
                    key={item.id}
                    item={item}
                    active={isItemActive(pathname, item)}
                    open={openDropdown === item.id}
                    onOpen={() => setOpenDropdown(item.id)}
                    onClose={() => setOpenDropdown(null)}
                  />
                );
              }
              return (
                <PillLink
                  key={item.id}
                  href={item.href}
                  label={item.label}
                  icon={resolveSiteIcon(item.icon)}
                  active={isItemActive(pathname, item)}
                />
              );
            })}
            {ctaItems.map((cta) => (
              <PillLink
                key={cta.id}
                href={cta.href}
                label={cta.label}
                icon={resolveSiteIcon(cta.icon)}
                active={matchPath(pathname, cta.href)}
                variant={cta.variant === "solid" ? "solid" : "outline"}
              />
            ))}
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
                const Icon = resolveSiteIcon(dropdown.icon);
                const children = (dropdown.children ?? []).filter((child) => child.active);

                return (
                  <div key={dropdown.id} className="rounded-3xl bg-loden-fog p-2">
                    <Link
                      href={dropdown.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-2 py-2 text-sm font-bold uppercase tracking-[0.12em] text-loden-700"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {dropdown.label}
                    </Link>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {children.map((child) => (
                        <PillLink
                          key={child.id}
                          href={child.href}
                          label={child.label}
                          icon={resolveSiteIcon(child.icon)}
                          variant="outline"
                          onClick={() => setMenuOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="grid gap-2 pt-1 sm:grid-cols-2">
                {items
                  .filter((item) => !(item.children ?? []).some((child) => child.active))
                  .map((item) => (
                    <PillLink
                      key={item.id}
                      href={item.href}
                      label={item.label}
                      icon={resolveSiteIcon(item.icon)}
                      variant="outline"
                      onClick={() => setMenuOpen(false)}
                    />
                  ))}
              </div>

              <div className="grid gap-2 pt-1 sm:grid-cols-2">
                {ctaItems.map((cta) => (
                  <PillLink
                    key={cta.id}
                    href={cta.href}
                    label={cta.label}
                    icon={resolveSiteIcon(cta.icon)}
                    variant={cta.variant === "solid" ? "solid" : "outline"}
                    onClick={() => setMenuOpen(false)}
                  />
                ))}
              </div>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
