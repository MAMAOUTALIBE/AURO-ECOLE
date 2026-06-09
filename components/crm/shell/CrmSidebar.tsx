"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { crmNav, type NavItem } from "@/lib/crm-nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const base = href.split("?")[0];
  if (base === "/admin") return pathname === "/admin";
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Lien d'item de navigation (mode étendu). */
function ItemLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  const soon = item.status === "soon";
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-loden-50 text-loden-800"
          : "text-loden-muted hover:bg-slate-50 hover:text-loden-ink",
        soon && !active && "text-slate-400"
      )}
    >
      <Icon
        className={cn("h-[18px] w-[18px] shrink-0", active ? "text-loden-700" : "text-slate-400 group-hover:text-loden-600")}
        aria-hidden="true"
      />
      <span className="truncate">{item.label}</span>
      {soon ? (
        <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Bientôt
        </span>
      ) : null}
    </Link>
  );
}

/** Item en mode compact (icône seule + tooltip natif). */
function ItemIcon({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex h-10 w-10 items-center justify-center rounded-xl transition",
        active ? "bg-loden-50 text-loden-700" : "text-slate-400 hover:bg-slate-50 hover:text-loden-600",
        item.status === "soon" && !active && "opacity-60"
      )}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </Link>
  );
}

/**
 * Contenu de navigation du CRM. Utilisé tel quel dans la sidebar desktop (rétractable)
 * et dans le drawer mobile (toujours étendu).
 */
export function SidebarNav({
  collapsed = false,
  onNavigate
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  // Une section est ouverte par défaut ; on n'autorise la fermeture qu'en mode étendu.
  const activeSectionTitle = useMemo(
    () => crmNav.find((s) => s.items.some((it) => isActive(pathname, it.href)))?.title,
    [pathname]
  );
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  if (collapsed) {
    return (
      <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-2 py-4" aria-label="Navigation CRM">
        {crmNav.map((section, index) => (
          <div key={section.title} className="flex w-full flex-col items-center gap-1">
            {index > 0 ? <div className="my-1 h-px w-8 bg-slate-100" aria-hidden="true" /> : null}
            {section.items.map((item) => (
              <ItemIcon key={item.label + item.href} item={item} active={isActive(pathname, item.href)} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Navigation CRM">
      {crmNav.map((section) => {
        // Section mono-item (Dashboard) : pas d'en-tête de catégorie.
        if (section.items.length === 1) {
          const item = section.items[0];
          return (
            <div key={section.title} className="mb-1">
              <ItemLink item={item} active={isActive(pathname, item.href)} onNavigate={onNavigate} />
            </div>
          );
        }

        const isOpen = section.title === activeSectionTitle ? true : !closed[section.title];
        return (
          <div key={section.title} className="mt-2">
            <button
              type="button"
              onClick={() => setClosed((prev) => ({ ...prev, [section.title]: !prev[section.title] }))}
              className="focus-ring flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 transition hover:text-loden-600"
            >
              {section.title}
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", isOpen ? "rotate-0" : "-rotate-90")}
                aria-hidden="true"
              />
            </button>
            {isOpen ? (
              <div className="mt-0.5 flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <ItemLink
                    key={item.label + item.href}
                    item={item}
                    active={isActive(pathname, item.href)}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
