"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Affiche le chrome marketing (header/footer/widgets) sur le site public,
 * mais s'efface sur le CRM (`/admin/*`) qui possède son propre shell applicatif.
 * Les slots sont rendus côté serveur dans le layout racine puis passés ici en props.
 */
export function SiteChrome({
  header,
  footer,
  children
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isCrm = pathname?.startsWith("/admin") ?? false;

  if (isCrm) return <>{children}</>;

  return (
    <>
      <a
        href="#contenu-principal"
        className="sr-only z-[100] rounded-full bg-loden-700 px-5 py-3 font-semibold text-white shadow-premium focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>
      {header}
      <div id="contenu-principal" tabIndex={-1}>
        {children}
      </div>
      {footer}
    </>
  );
}
