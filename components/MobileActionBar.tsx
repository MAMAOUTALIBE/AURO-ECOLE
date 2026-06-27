"use client";

import Link from "next/link";
import { MessageCircle, Phone, Sparkles } from "lucide-react";
import { contactInfo } from "@/data/site";

function normalizePhone(source: string) {
  return source.replace(/\s/g, "");
}

export function MobileActionBar() {
  const phoneHref = contactInfo.phone ? `tel:${normalizePhone(contactInfo.phone)}` : null;
  const whatsappHref = contactInfo.whatsapp ? `https://wa.me/${contactInfo.whatsapp}` : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_45px_rgba(20,33,38,0.12)] backdrop-blur-xl sm:hidden">
      <div className="grid grid-cols-3 gap-2">
        {phoneHref ? (
          <a
            href={phoneHref}
            className="focus-ring inline-flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl bg-loden-fog px-2 text-xs font-bold text-loden-ink"
          >
            <Phone className="h-4 w-4 text-loden-700" aria-hidden="true" />
            Appeler
          </a>
        ) : (
          <Link
            href="/contact"
            className="focus-ring inline-flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl bg-loden-fog px-2 text-xs font-bold text-loden-ink"
          >
            <Phone className="h-4 w-4 text-loden-700" aria-hidden="true" />
            Contact
          </Link>
        )}

        {whatsappHref ? (
          <a
            href={whatsappHref}
            className="focus-ring inline-flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl bg-[#25D366] px-2 text-xs font-bold text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        ) : (
          <Link
            href="/contact"
            className="focus-ring inline-flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl bg-loden-fog px-2 text-xs font-bold text-loden-ink"
          >
            <MessageCircle className="h-4 w-4 text-loden-700" aria-hidden="true" />
            Message
          </Link>
        )}

        <Link
          href="/inscription"
          className="focus-ring inline-flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl bg-loden-700 px-2 text-xs font-bold text-white"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          S&apos;inscrire
        </Link>
      </div>
    </div>
  );
}
