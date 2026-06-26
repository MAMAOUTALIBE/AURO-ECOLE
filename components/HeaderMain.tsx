"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, Menu, Sparkles, X } from "lucide-react";
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
  const path = href.split("#")[0].split("?")[0] || "/";
  return path === "/" ? path : path.replace(/\/+$/, "");
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

function isStudentAccountHref(href: string) {
  return hrefPath(href) === "/espace-eleve";
}

function publicNavItems(nav: NavPrimary): NavItem[] {
  return nav.items
    .filter((item) => item.active && !isStudentAccountHref(item.href))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => child.active && !isStudentAccountHref(child.href))
    }));
}

function Logo() {
  return (
    <Link
      href="/"
      className="focus-ring flex shrink-0 items-center rounded-[1.45rem] px-2 py-1"
      aria-label="LODENE - Accueil"
    >
      <Image
        src="/lodene-logo-wordmark.png"
        alt="LODENE"
        width={1320}
        height={660}
        priority
        className="h-16 w-auto sm:h-20"
      />
    </Link>
  );
}

function MobileLogo() {
  return (
    <Link href="/" className="focus-ring flex min-w-0 shrink-0 rounded-full" aria-label="LODENE - Accueil">
      <Image
        src="/lodene-logo-wordmark.png"
        alt="LODENE"
        width={1320}
        height={660}
        priority
        className="h-[4.5rem] w-auto max-w-[9.5rem] min-[375px]:h-20 min-[375px]:max-w-[10.5rem]"
      />
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
          "border-transparent bg-transparent text-loden-ink hover:border-loden-100 hover:bg-loden-fog hover:text-loden-800",
        variant === "outline" &&
          "border-loden-200 bg-white text-loden-800 shadow-[0_8px_24px_rgba(20,33,38,0.08)] hover:border-loden-300 hover:bg-loden-50",
        variant === "solid" &&
          "border-loden-700 bg-loden-700 text-white shadow-soft hover:border-loden-800 hover:bg-loden-800",
        active && variant === "default" && "border-loden-200 bg-loden-petrol text-loden-800"
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
          "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-transparent bg-transparent px-3.5 py-2 text-sm font-semibold text-loden-ink transition hover:border-loden-100 hover:bg-loden-fog hover:text-loden-800",
          active && "border-loden-200 bg-loden-petrol text-loden-800"
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
        <div className="rounded-[1.75rem] border border-loden-100 bg-white p-2 shadow-[0_28px_90px_rgba(20,33,38,0.16)] ring-1 ring-white">
          {children.map((child) => {
            const ItemIcon = resolveSiteIcon(child.icon);

            return (
              <Link
                key={child.id}
                href={child.href}
                className="focus-ring flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-loden-ink transition hover:bg-loden-50 hover:text-loden-800"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-loden-100 text-loden-700 shadow-soft">
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

  const items = publicNavItems(nav ?? defaultNavPrimary);
  const ctaItems: NavCta[] = (ctas ?? defaultNavCtas).items.filter((item) => item.active && !isStudentAccountHref(item.href));
  const dropdowns = items.filter((item) => (item.children ?? []).some((child) => child.active));

  return (
    <header className="sticky top-0 z-40 border-b border-[#f97316]/20 bg-white/95 backdrop-blur-xl md:border-0 md:bg-transparent md:py-4">
      <div className="container-pad">
        <div className="flex min-h-[5.25rem] items-center justify-between gap-3 md:hidden">
          <MobileLogo />

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="focus-ring inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#f97316]/25 bg-white text-loden-ink shadow-[0_10px_28px_rgba(20,33,38,0.08)] transition hover:border-[#f97316]/40 hover:bg-loden-50"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="hidden min-h-14 items-center justify-between gap-2 rounded-[1.65rem] border border-[#f97316]/30 bg-white px-2.5 py-2 shadow-[0_18px_55px_rgba(20,33,38,0.12),0_0_0_1px_rgba(249,115,22,0.08)] ring-1 ring-white md:flex sm:min-h-16 sm:gap-3 sm:rounded-[2rem] sm:px-3">
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
              href="/inscription"
              className="focus-ring inline-flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-loden-200 bg-loden-50 text-sm font-semibold text-loden-800 shadow-[0_8px_24px_rgba(20,33,38,0.08)] hover:bg-loden-100 sm:h-12 sm:w-auto sm:px-4 sm:py-2"
              aria-label="Inscription"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="hidden whitespace-nowrap sm:inline">Inscription</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-loden-200 bg-white text-loden-800 shadow-[0_8px_24px_rgba(20,33,38,0.08)] transition hover:bg-loden-50 sm:h-12 sm:w-12"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="mt-1 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-[1.5rem] border border-slate-200/80 bg-white p-2.5 shadow-premium xl:hidden md:mt-3 sm:rounded-[2rem] sm:p-3">
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
