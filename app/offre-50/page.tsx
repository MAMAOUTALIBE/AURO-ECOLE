import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeEuro, CheckCircle2, MessageCircle, QrCode, ShieldCheck } from "lucide-react";
import { Offer50LeadForm } from "@/components/Offer50LeadForm";
import { contactInfo } from "@/data/site";

const OFFER_CODE = "LODENE50";
const OFFER_URL = `/offre-50?code=${OFFER_CODE}`;

export const metadata: Metadata = {
  title: "Offre Permis B LODENE -50 €",
  description: "Offre spéciale LODENE Permis B : remplissez le formulaire et recevez votre bon de réduction de 50 €.",
  alternates: { canonical: "/offre-50" }
};

export default async function Offer50Page({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: rawCode } = await searchParams;
  const code = rawCode?.trim() ?? "";
  const validCode = code === OFFER_CODE;
  const displayCode = code || OFFER_CODE;
  const whatsappMessage = encodeURIComponent(
    "Bonjour LODENE, je viens de scanner le QR code de l'offre -50 € et je souhaite avoir des informations."
  );

  return (
    <main className="bg-loden-pearl">
      <section className="relative isolate overflow-hidden bg-white">
        <div className="absolute inset-y-0 right-0 -z-10 w-full bg-[radial-gradient(circle_at_78%_22%,rgba(0,157,143,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(229,246,246,0.78))]" />
        <div className="container-pad grid gap-8 py-8 md:grid-cols-[minmax(0,1fr)_minmax(20rem,31rem)] md:items-start md:py-12 lg:gap-12">
          <div className="max-w-3xl">
            <Image
              src="/lodene-logo-wordmark.png"
              alt="LODENE Formation"
              width={1320}
              height={660}
              priority
              className="h-20 w-auto"
            />
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-loden-100 bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-loden-700 shadow-soft">
              <BadgeEuro className="h-4 w-4" aria-hidden="true" />
              Offre Permis B LODENE
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-loden-ink md:text-6xl">
              50 € de réduction sur le Permis B
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-loden-muted">
              Remplissez le formulaire et recevez votre bon de réduction Permis B par email ou WhatsApp.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-loden-900 px-5 py-3 text-lg font-black text-white">Code : {displayCode}</span>
              <a
                href="#recuperer-bon"
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-5 py-3 font-black text-white shadow-soft transition hover:bg-loden-800"
              >
                Je récupère mon bon
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              {contactInfo.whatsapp ? (
                <a
                  href={`https://wa.me/${contactInfo.whatsapp}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-black text-white shadow-soft"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  WhatsApp
                </a>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Permis B uniquement", "Une demande par personne", "Suivi CRM LODENE"].map((item) => (
                <p key={item} className="flex items-center gap-2 rounded-2xl bg-white/85 px-4 py-3 text-sm font-black text-loden-800 shadow-soft">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-loden-700" aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-white bg-white p-3 shadow-premium">
              <Image
                src="/offre-50/bon50.jpeg"
                alt="Affiche LODENE offre spéciale 50 euros de réduction"
                width={1087}
                height={1447}
                priority
                className="h-auto w-full rounded-[1.1rem]"
              />
            </div>
            <Link
              href={OFFER_URL}
              className="focus-ring flex items-center gap-4 rounded-[1.25rem] border border-loden-100 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-premium"
              aria-label="QR code LODENE offre 50 euros"
            >
              <Image
                src="/offre-50/qr_offre_50_LDNE50.png"
                alt="QR code vers l'offre LODENE 50 euros"
                width={240}
                height={240}
                className="h-24 w-24 rounded-2xl border border-slate-200 bg-white p-2"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-loden-700">
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  QR code
                </span>
                <span className="mt-1 block text-base font-black text-loden-ink">Scannez ou cliquez pour ouvrir la même offre.</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container-pad grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8">
          <aside className="grid gap-4">
            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-soft">
              <Image
                src="/offre-50/bon50.jpeg"
                alt="Bon de réduction LODENE de 50 euros"
                width={1087}
                height={1447}
                className="h-auto w-full rounded-xl"
              />
            </div>
            <div className="rounded-[1.25rem] border border-loden-100 bg-white p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-loden-ink">Offre suivie dans le CRM</h2>
                  <p className="mt-2 leading-7 text-loden-muted">
                    La demande est enregistrée avec la source QR code, le code promo {OFFER_CODE} et le statut du bon.
                  </p>
                </div>
              </div>
            </div>
          </aside>
          <Offer50LeadForm code={displayCode} validCode={validCode} />
        </div>
      </section>
    </main>
  );
}
