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
      {header}
      {children}
      {footer}
    </>
  );
}
