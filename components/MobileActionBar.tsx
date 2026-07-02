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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-16px_45px_rgba(20,33,38,0.12)] backdrop-blur-xl sm:hidden">
      <div className="grid grid-cols-3 gap-2">
        {phoneHref ? (
          <a
            href={phoneHref}
            className="focus-ring inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl bg-loden-fog px-1.5 text-[0.68rem] font-bold text-loden-ink"
          >
            <Phone className="h-4 w-4 text-loden-700" aria-hidden="true" />
            Appeler
          </a>
        ) : (
          <Link
            href="/contact"
            className="focus-ring inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl bg-loden-fog px-1.5 text-[0.68rem] font-bold text-loden-ink"
          >
            <Phone className="h-4 w-4 text-loden-700" aria-hidden="true" />
            Contact
          </Link>
        )}

        {whatsappHref ? (
          <a
            href={whatsappHref}
            className="focus-ring inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl bg-[#25D366] px-1.5 text-[0.68rem] font-bold text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        ) : (
          <Link
            href="/contact"
            className="focus-ring inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl bg-loden-fog px-1.5 text-[0.68rem] font-bold text-loden-ink"
          >
            <MessageCircle className="h-4 w-4 text-loden-700" aria-hidden="true" />
            Message
          </Link>
        )}

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("lodene:open-assistant"))}
          className="focus-ring inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl bg-loden-900 px-1.5 text-[0.68rem] font-bold text-white"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          IA
        </button>

      </div>
    </div>
  );
}
