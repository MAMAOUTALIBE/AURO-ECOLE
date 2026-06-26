"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { PanelLeftClose, PanelLeft, X } from "lucide-react";
import { SidebarNav } from "./CrmSidebar";
import { CrmTopbar } from "./CrmTopbar";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "loden_crm_sidebar_collapsed";

/** Logo LODENE pour le shell CRM. */
function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/admin" className="focus-ring flex items-center rounded-xl" aria-label="LODENE CRM — Tableau de bord">
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-white shadow-soft",
          collapsed ? "h-10 w-10 rounded-xl p-1" : "h-16 w-48 overflow-hidden rounded-2xl px-2"
        )}
      >
        <Image
          src={collapsed ? "/lodene-logo.png" : "/lodene-logo-wordmark.png"}
          alt=""
          width={collapsed ? 512 : 1320}
          height={collapsed ? 512 : 660}
          className={collapsed ? "h-8 w-8" : "h-14 w-auto"}
        />
      </span>
    </Link>
  );
}

export function CrmShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restaure l'état réduit (persisté) après hydratation pour éviter tout mismatch.
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7f8] text-loden-ink">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-red-900 bg-red-800 transition-[width] duration-300 lg:flex",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-red-600/40", collapsed ? "justify-center px-2" : "px-4")}>
          <Brand collapsed={collapsed} />
        </div>
        <SidebarNav collapsed={collapsed} />
        <div className="border-t border-red-600/40 p-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-100 transition hover:bg-red-600 hover:text-white",
              collapsed && "justify-center px-0"
            )}
            aria-label={collapsed ? "Étendre le menu" : "Réduire le menu"}
          >
            {collapsed ? <PanelLeft className="h-[18px] w-[18px]" aria-hidden="true" /> : <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden="true" />}
            {!collapsed ? <span>Réduire le menu</span> : null}
          </button>
        </div>
      </aside>

      {/* Drawer mobile */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-loden-ink/40 backdrop-blur-sm"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-red-900 bg-red-800 shadow-premium">
            <div className="flex h-16 items-center justify-between border-b border-red-600/40 px-4">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-red-100 hover:bg-red-600 hover:text-white"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* Colonne principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        <CrmTopbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
