import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { featuredPartners } from "@/data/partners";

export const metadata: Metadata = {
  title: "Nos partenaires",
  description: "Découvrez les entreprises et commerces locaux partenaires de LODENE Auto-École."
};

function phoneHref(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export default function PartnersPage() {
  return (
    <main className="bg-slate-50">
      <section className="bg-gradient-to-br from-loden-950 via-loden-800 to-loden-700 py-16 text-white md:py-24">
        <div className="container-pad max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-loden-200">Le réseau LODENE</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Nos partenaires locaux</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-loden-50/90">
            Des entreprises de proximité qui partagent notre engagement pour l’accompagnement et la vie locale.
          </p>
        </div>
      </section>

      <section className="container-pad py-12 md:py-16" aria-labelledby="partners-list-title">
        <h2 id="partners-list-title" className="sr-only">Liste de nos partenaires</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {featuredPartners.map((partner) => (
            <article key={partner.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
              <div className="grid h-48 place-items-center bg-gradient-to-br from-white to-loden-50 p-7">
                <Image src={partner.logoUrl} alt={`Logo ${partner.name}`} width={520} height={260} className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-loden-700">{partner.activity}</p>
                <h3 className="mt-2 text-2xl font-black text-loden-ink">{partner.name}</h3>
                <p className="mt-3 text-sm leading-6 text-loden-muted">{partner.description}</p>

                <address className="mt-6 grid gap-3 not-italic text-sm text-slate-700">
                  <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-loden-700" aria-hidden="true" />{partner.address}</p>
                  {partner.phone ? <a className="flex items-center gap-3 font-semibold hover:text-loden-700" href={phoneHref(partner.phone)}><Phone className="h-4 w-4 text-loden-700" aria-hidden="true" />{partner.phone}</a> : null}
                  {partner.email ? <a className="flex items-center gap-3 break-all font-semibold hover:text-loden-700" href={`mailto:${partner.email}`}><Mail className="h-4 w-4 shrink-0 text-loden-700" aria-hidden="true" />{partner.email}</a> : null}
                  {partner.instagram ? <a className="flex items-center gap-3 font-semibold hover:text-loden-700" href={`https://www.instagram.com/${partner.instagram}/`} target="_blank" rel="noopener noreferrer nofollow"><Instagram className="h-4 w-4 text-loden-700" aria-hidden="true" />@{partner.instagram}</a> : null}
                </address>

                {partner.registration ? <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">{partner.registration}</p> : null}
                <div className="mt-auto flex flex-wrap gap-3 pt-6">
                  {partner.websiteUrl ? <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-loden-800">Voir le site <ExternalLink className="h-4 w-4" aria-hidden="true" /></a> : null}
                  <a href={partner.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-loden-800 hover:bg-loden-50">Informations vérifiées <ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12 rounded-3xl bg-loden-900 p-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 md:p-9">
          <div><h2 className="text-2xl font-black">Vous souhaitez devenir partenaire ?</h2><p className="mt-2 text-loden-100">Échangeons sur les actions que nous pouvons mener ensemble.</p></div>
          <Link href="/contact?objet=partenariat" className="focus-ring mt-5 inline-flex shrink-0 items-center rounded-full bg-white px-6 py-3 font-bold text-loden-900 hover:bg-loden-50 sm:mt-0">Nous contacter</Link>
        </div>
      </section>
    </main>
  );
}
