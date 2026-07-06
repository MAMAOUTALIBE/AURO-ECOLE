"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search, Sparkles } from "lucide-react";
import { AgencySwitcher, ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";
import { crmNavFlat } from "@/lib/crm-nav";

type MeUser = { firstName: string; lastName: string; email: string; role: string };
type NotifItem = { label: string; count: number; href: string };

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  DIRECTEUR: "Directeur",
  RESPONSABLE_AGENCE: "Responsable agence",
  RESPONSABLE_PEDAGOGIQUE: "Responsable pédagogique",
  ADMIN: "Administrateur",
  SECRETAIRE: "Secrétaire",
  COMPTABLE: "Comptable",
  MONITEUR: "Moniteur",
  EDITEUR: "Éditeur de contenu",
  ELEVE: "Élève",
  VISITEUR: "Visiteur"
};

/** Recherche-commande : filtre la navigation du CRM (fonctionnel, sans backend). */
function CommandSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? crmNavFlat.filter((it) => it.label.toLowerCase().includes(q)).slice(0, 7)
    : crmNavFlat.filter((it) => it.status === "live").slice(0, 6);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div className="relative min-w-0 flex-1 max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) go(results[0].href);
          }}
          placeholder="Rechercher un module, un écran…"
          aria-label="Recherche CRM"
          className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-14 text-sm text-loden-ink outline-none transition placeholder:text-slate-400 focus:border-loden-200 focus:bg-white"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:flex">
          ⌘K
        </kbd>
      </div>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-30 cursor-default" aria-hidden="true" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-premium">
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {q ? "Résultats" : "Accès rapides"}
            </p>
            {results.length === 0 ? (
              <p className="px-3 py-3 text-sm text-loden-muted">Aucun écran ne correspond.</p>
            ) : (
              results.map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.label + it.href}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(it.href)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-loden-ink transition hover:bg-slate-50"
                  >
                    <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <span>{it.label}</span>
                    {it.status === "soon" ? (
                      <span className="ml-auto text-[10px] font-semibold uppercase text-slate-400">Bientôt</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function CrmTopbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const query = agency && agency !== "all" ? `?agencyId=${encodeURIComponent(agency)}` : "";

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!cancelled && p?.user) setUser(p.user as MeUser);
      })
      .catch(() => {});

    fetch(`/api/admin/stats${query}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (cancelled || !p?.data) return;
        const d = p.data;
        const items: NotifItem[] = [
          { label: "Paiements en attente", count: d.payments?.pending ?? 0, href: "/admin/finance" },
          { label: "Dossiers CPF à traiter", count: d.cpf?.pending ?? 0, href: "/admin/cpf" },
          { label: "Avis à modérer", count: d.reviews?.pending ?? 0, href: "/admin/avis" }
        ].filter((it) => it.count > 0);
        setNotifs(items);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* noop */
    }
    router.push("/connexion");
    router.refresh();
  };

  const totalNotif = notifs.reduce((sum, n) => sum + n.count, 0);
  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?" : "?";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/85 px-3 backdrop-blur-md sm:gap-3 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-loden-muted hover:bg-slate-100 lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <CommandSearch />

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
        <Link
          href="/admin/assistant"
          className="focus-ring hidden items-center gap-1.5 rounded-lg border border-loden-200 bg-loden-50 px-3 py-1.5 text-sm font-semibold text-loden-700 transition hover:bg-loden-100 lg:inline-flex"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Assistant IA
        </Link>

        <AgencySwitcher />

        {/* Notifications (compteurs réels) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBellOpen((v) => !v)}
            className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-lg text-loden-muted hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {totalNotif > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {totalNotif > 99 ? "99+" : totalNotif}
              </span>
            ) : null}
          </button>
          {bellOpen ? (
            <>
              <button type="button" className="fixed inset-0 z-30 cursor-default" aria-hidden="true" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-premium">
                <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-loden-ink">Notifications</p>
                {notifs.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-loden-muted">Tout est à jour ✨</p>
                ) : (
                  notifs.map((n) => (
                    <Link
                      key={n.label}
                      href={n.href}
                      onClick={() => setBellOpen(false)}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition hover:bg-slate-50"
                    >
                      <span className="text-loden-ink">{n.label}</span>
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">{n.count}</span>
                    </Link>
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Menu utilisateur */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="focus-ring flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition hover:bg-slate-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-loden-700 text-xs font-bold text-white">
              {initials}
            </span>
            <span className="hidden text-left lg:block">
              <span className="block text-sm font-semibold leading-tight text-loden-ink">
                {user ? `${user.firstName} ${user.lastName}` : "—"}
              </span>
              <span className="block text-xs leading-tight text-loden-muted">
                {user ? ROLE_LABELS[user.role] ?? user.role : ""}
              </span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" aria-hidden="true" />
          </button>
          {menuOpen ? (
            <>
              <button type="button" className="fixed inset-0 z-30 cursor-default" aria-hidden="true" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-premium">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-loden-ink">{user ? `${user.firstName} ${user.lastName}` : "—"}</p>
                  <p className="truncate text-xs text-loden-muted">{user?.email}</p>
                </div>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-loden-ink transition hover:bg-slate-50"
                >
                  Voir le site public
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Déconnexion
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
