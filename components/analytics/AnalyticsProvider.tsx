"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, trackEvent, trackPageView } from "@/lib/analytics";
import { captureAttribution } from "@/lib/attribution";

// Fournisseur analytics global monté dans le layout racine :
//  1) initialise Matomo/GA4 (no-op si non configurés) ;
//  2) capture l'attribution marketing dès l'arrivée ;
//  3) enregistre une page vue à chaque changement de route (App Router) ;
//  4) capte les clics importants par DÉLÉGATION (aucun composant à modifier) :
//     tel:/mailto:/WhatsApp, éléments [data-track], et routes clés (/inscription, /cpf,
//     /financement, /reservation). Passif : ne fait que lire + envoyer un événement.

/** Résout un href (relatif ou absolu) en chemin d'URL. */
function toPathname(href: string): string {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return href;
  }
}

function handleDelegatedClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const el = target?.closest<HTMLElement>("[data-track], a[href]");
  if (!el) return;

  // 1) Événement explicite déclaré via data-track (+ data-track-category optionnel).
  const explicit = el.getAttribute("data-track");
  if (explicit) {
    trackEvent(el.getAttribute("data-track-category") || "CTA", explicit, window.location.pathname);
    return;
  }

  // 2) Liens de contact / routes clés déduits automatiquement.
  const anchor = el.closest("a[href]") as HTMLAnchorElement | null;
  const href = anchor?.getAttribute("href");
  if (!href) return;

  if (href.startsWith("tel:")) {
    trackEvent("Contact", "click_phone", href.replace("tel:", ""));
    return;
  }
  if (href.startsWith("mailto:")) {
    trackEvent("Contact", "click_email", href.replace("mailto:", ""));
    return;
  }
  if (/wa\.me|whatsapp/i.test(href)) {
    trackEvent("Contact", "click_whatsapp", window.location.pathname);
    return;
  }

  const path = toPathname(href);
  if (path.startsWith("/inscription")) trackEvent("CTA", "click_inscription", path);
  else if (path.startsWith("/cpf")) trackEvent("CTA", "click_cpf", path);
  else if (path.startsWith("/financement")) trackEvent("CTA", "click_financement", path);
  else if (path.startsWith("/reservation") || path.startsWith("/reserver")) trackEvent("CTA", "click_reservation", path);
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    trackPageView(url, typeof document !== "undefined" ? document.title : undefined);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
    // L'attribution est capturée même sans Matomo (elle sert au CRM, pas au traceur).
    captureAttribution();
    document.addEventListener("click", handleDelegatedClick, { capture: true });
    return () => document.removeEventListener("click", handleDelegatedClick, { capture: true });
  }, []);

  // useSearchParams impose une frontière Suspense en App Router.
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
