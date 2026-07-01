import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeEuro, MessageCircle, ShieldCheck } from "lucide-react";
import { Offer50LeadForm } from "@/components/Offer50LeadForm";
import { contactInfo } from "@/data/site";

export const metadata: Metadata = {
  title: "Offre spéciale -50 €",
  description: "Offre spéciale LODENE Formation : 50 € de réduction avec le code LODENE50 via QR code.",
  alternates: { canonical: "/offre-50" }
};

export default async function Offer50Page({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: rawCode } = await searchParams;
  const code = rawCode?.trim() || "LODENE50";
  const whatsappMessage = encodeURIComponent(`Bonjour LODENE, je souhaite profiter de l'offre -50 € avec le code ${code}.`);

  return (
    <main className="bg-loden-pearl">
      <section className="relative isolate overflow-hidden bg-white">
        <div className="container-pad grid gap-8 py-8 md:grid-cols-[minmax(0,1fr)_minmax(20rem,31rem)] md:items-center md:py-12 lg:gap-12">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-loden-100 bg-loden-50 px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-loden-700">
              <BadgeEuro className="h-4 w-4" aria-hidden="true" />
              Offre QR code
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-loden-ink md:text-6xl">
              50 € de réduction avec LODENE Formation
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-loden-muted">
              Scannez le QR code ou remplissez le formulaire pour être rappelé et profiter du bon de réduction sur votre inscription.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-loden-900 px-5 py-3 text-lg font-black text-white">Code : {code}</span>
              <Link href="https://lodene.fr/" className="focus-ring inline-flex items-center gap-2 rounded-full border border-loden-200 bg-white px-5 py-3 font-black text-loden-900 shadow-soft">
                lodene.fr
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
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
          </div>

          <Link href="/offre-50?code=LODENE50" className="focus-ring block rounded-[1.25rem] bg-white p-3 shadow-premium" aria-label="Offre LODENE 50 euros de réduction">
            <Image
              src="/offre-50/affiche_offre_50_propre.png"
              alt="Affiche LODENE 50 euros de réduction"
              width={1200}
              height={1697}
              priority
              className="h-auto w-full rounded-2xl"
            />
          </Link>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container-pad grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <Image
                src="/offre-50/bon_reduction_50_propre.png"
                alt="Bon de réduction LODENE 50 euros"
                width={1200}
                height={800}
                className="h-auto w-full rounded-xl"
              />
            </div>
            <div className="rounded-2xl border border-loden-100 bg-white p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-loden-ink">Suivi LODENE</h2>
                  <p className="mt-2 leading-7 text-loden-muted">
                    Votre demande est enregistrée avec la source QR code pour permettre à l&apos;équipe de vous rappeler rapidement.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Offer50LeadForm code={code} />
        </div>
      </section>
    </main>
  );
}
