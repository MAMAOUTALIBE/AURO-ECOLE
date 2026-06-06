"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, UserRound, X } from "lucide-react";
import { useState } from "react";
import { navItems } from "@/data/site";
import { cn } from "@/lib/utils";

const GlobalSearchOverlay = dynamic(
  () => import("@/components/GlobalSearch").then((mod) => mod.GlobalSearch),
  {
    ssr: false,
    loading: () => null
  }
);

export function HeaderMain() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="container-pad flex h-20 items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-3 focus-ring">
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-700 text-lg font-bold text-white shadow-soft">
              L
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-semibold tracking-wide text-loden-ink">LODEN</span>
              <span className="block text-xs font-medium uppercase tracking-[0.18em] text-loden-muted">
                Auto-École
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Navigation principale">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-loden-muted transition hover:bg-loden-50 hover:text-loden-800 focus-ring",
                  pathname === item.href && "bg-loden-50 text-loden-800"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="focus-ring flex min-w-72 items-center gap-3 rounded-full border border-slate-200 bg-loden-fog px-4 py-3 text-left text-sm text-loden-muted transition hover:border-loden-200 hover:bg-white"
            >
              <Search className="h-4 w-4 text-loden-500" aria-hidden="true" />
              <span className="truncate">Rechercher une formation, un tarif...</span>
            </button>
            <Link
              href="/espace-eleve"
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-loden-ink transition hover:border-loden-300 hover:bg-loden-50"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Espace Élève
            </Link>
            <Link
              href="/inscription"
              className="focus-ring rounded-full bg-loden-700 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800"
            >
              Inscription
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="focus-ring rounded-full border border-slate-200 p-3 text-loden-700"
              aria-label="Ouvrir la recherche"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="focus-ring rounded-full border border-slate-200 p-3 text-loden-700"
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-slate-200 bg-white xl:hidden">
            <div className="container-pad grid gap-2 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-base font-medium text-loden-muted hover:bg-loden-50 hover:text-loden-800",
                    pathname === item.href && "bg-loden-50 text-loden-800"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-center font-semibold" href="/espace-eleve">
                  Espace Élève
                </Link>
                <Link className="rounded-2xl bg-loden-700 px-4 py-3 text-center font-semibold text-white" href="/inscription">
                  Inscription
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>
      {searchOpen ? <GlobalSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} /> : null}
    </>
  );
}
