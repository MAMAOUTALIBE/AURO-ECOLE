"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useEffect } from "react";

const OFFER_CODE = "LODENE50";

type Offer50Event =
  | "qr_offer_page_view"
  | "qr_offer_site_click"
  | "qr_offer_voucher_download"
  | "qr_offer_lead_submit"
  | "qr_offer_whatsapp_click";

export function trackOffer50Event(event: Offer50Event, target?: string) {
  const payload = JSON.stringify({ event, code: OFFER_CODE, target });

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/offre-50/events", blob);
    return;
  }

  void fetch("/api/offre-50/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  });
}

export function Offer50PageTracker() {
  useEffect(() => {
    trackOffer50Event("qr_offer_page_view", window.location.pathname + window.location.search);
  }, []);

  return null;
}

type Offer50TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: Offer50Event;
  children: ReactNode;
};

export function Offer50TrackedLink({ event, children, href, onClick, ...props }: Offer50TrackedLinkProps) {
  return (
    <a
      href={href}
      onClick={(eventObject) => {
        trackOffer50Event(event, typeof href === "string" ? href : undefined);
        onClick?.(eventObject);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
