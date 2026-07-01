import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Download, Gift, MapPin, MessageCircle, ShieldCheck, TicketCheck } from "lucide-react";
import { Offer50LeadForm } from "@/components/Offer50LeadForm";
import { Offer50PageTracker, Offer50TrackedLink } from "@/components/Offer50Tracking";
import { contactInfo } from "@/data/site";

const OFFER_CODE = "LODENE50";
const offerUrl = "https://lodene.fr/offre-50?code=LODENE50";
const siteUrl = "https://lodene.fr/";
const voucherUrl = "/offre-50/bon_reduction_50_propre.png";
const whatsappText = encodeURIComponent("Bonjour LODENE, je viens de scanner le QR code de l'offre -50€ avec le code LODENE50. Pouvez-vous me rappeler ?");
const whatsappHref = `https://wa.me/${contactInfo.whatsapp}?text=${whatsappText}`;

export const metadata: Metadata = {
  title: "Offre -50€ LODENE Formation",
  description: "Page spéciale QR code LODENE Formation : bon de réduction de 50€, formulaire prospect et contact WhatsApp.",
  alternates: { canonical: "/offre-50" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Offre -50€ LODENE Formation",
    description: "Scannez le QR code LODENE et récupérez votre bon de réduction de 50€.",
    url: "/offre-50",
    type: "website"
  }
};

export default async function Offer50Page({
  searchParams
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const codeIsValid = code === OFFER_CODE;

  return (
    <main className="bg-[#F7FBFC]">
      <Offer50PageTracker />

      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 soft-grid opacity-50" aria-hidden="true" />
        <div className="container-pad relative grid items-center gap-8 py-8 pb-[calc(7rem+env(safe-area-inset-bottom))] md:grid-cols-[minmax(0,1fr)_minmax(20rem,0.78fr)] md:py-12 xl:gap-12 xl:py-14">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-3 rounded-full border border-loden-100 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-loden-700 shadow-soft">
              <Gift className="h-4 w-4" aria-hidden="true" />
              Campagne QR code LODENE
            </div>

            <div className="mt-5 flex items-center gap-4">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
                <Image src="/offre-50/logo_lodene_personnalise.png" alt="LODENE Formation" width={160} height={160} className="h-full w-full object-contain" priority />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">Auto-école · VTC · SST · Logistique</p>
                <p className="mt-1 text-sm text-loden-muted">30 rue Pierre Le Guen, 78700 Conflans-Sainte-Honorine</p>
              </div>
            </div>

            <h1 className="mt-6 max-w-3xl text-[2.6rem] font-black leading-none tracking-normal text-loden-ink sm:text-6xl xl:text-7xl">
              50€ de réduction sur votre inscription
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-loden-muted sm:text-lg sm:leading-8">
              Votre scan QR code active le code promo <strong className="font-black text-loden-900">{OFFER_CODE}</strong>. Laissez vos coordonnées, téléchargez le bon et un conseiller LODENE vous rappelle.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: TicketCheck, label: "Bon -50€", text: "À présenter en agence" },
                { icon: BadgeCheck, label: "Code vérifié", text: codeIsValid ? OFFER_CODE : "LODENE50" },
                { icon: ShieldCheck, label: "Demande suivie", text: "Rappel par l'équipe" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
                    <Icon className="h-5 w-5 text-loden-700" aria-hidden="true" />
                    <p className="mt-2 font-black text-loden-ink">{item.label}</p>
                    <p className="mt-1 text-sm text-loden-muted">{item.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Offer50TrackedLink
                event="qr_offer_site_click"
                href={siteUrl}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-black text-white shadow-soft transition hover:bg-loden-800"
              >
                Découvrir lodene.fr
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Offer50TrackedLink>
              <Offer50TrackedLink
                event="qr_offer_voucher_download"
                href={voucherUrl}
                download
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-loden-500 bg-white px-6 py-3.5 font-black text-loden-900 shadow-soft transition hover:bg-loden-50"
              >
                <Download className="h-5 w-5" aria-hidden="true" />
                Télécharger le bon
              </Offer50TrackedLink>
              <Offer50TrackedLink
                event="qr_offer_whatsapp_click"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 font-black text-white shadow-soft transition hover:brightness-95"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                WhatsApp
              </Offer50TrackedLink>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-loden-muted shadow-soft">
              <p className="font-semibold text-loden-ink">Lien de la campagne</p>
              <p className="mt-1 break-all">{offerUrl}</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[31rem]">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-premium">
              <Image
                src="/offre-50/bon_reduction_50_propre.png"
                alt="Bon de réduction LODENE -50€"
                width={1800}
                height={1050}
                className="w-full rounded-2xl object-cover"
                priority
              />
              <div className="mt-3 grid grid-cols-[5.5rem_1fr] gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-soft">
                  <Image src="/offre-50/qr_offre_50_LDNE50.png" alt="QR code officiel de l'offre LODENE -50€" width={810} height={810} className="aspect-square w-full object-contain" />
                </div>
                <div className="rounded-xl bg-loden-900 p-4 text-white">
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-loden-100">Code promo</p>
                  <p className="mt-1 text-2xl font-black">{OFFER_CODE}</p>
                  <p className="mt-2 text-xs leading-5 text-white/80">Conservez ce code pour présenter l&apos;offre en agence.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-loden-pearl py-8 md:py-12">
        <div className="container-pad grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft md:p-6">
              <h2 className="text-2xl font-black leading-tight text-loden-ink md:text-3xl">Votre bon de réduction est prêt</h2>
              <p className="mt-3 text-sm leading-7 text-loden-muted md:text-base">
                Offre valable une seule fois par personne, non cumulable avec une autre promotion, sur présentation du bon en agence. Conditions modifiables par LODENE.
              </p>
              <div className="mt-4 grid gap-3 text-sm font-semibold text-loden-ink">
                <p className="flex items-center gap-2"><TicketCheck className="h-5 w-5 text-loden-700" aria-hidden="true" /> Bon réservé aux nouvelles inscriptions.</p>
                <p className="flex items-center gap-2"><MapPin className="h-5 w-5 text-loden-700" aria-hidden="true" /> Présentation du bon avant validation du dossier.</p>
                <p className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-loden-700" aria-hidden="true" /> Demande transmise à l&apos;équipe LODENE pour rappel.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
              <Image src="/offre-50/affiche_offre_50_propre.png" alt="Affiche officielle de l'offre LODENE -50€" width={2480} height={3508} className="max-h-[34rem] w-full object-cover object-top" />
            </div>
          </div>

          <Offer50LeadForm />
        </div>
      </section>
    </main>
  );
}
