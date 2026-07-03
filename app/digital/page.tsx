import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  GraduationCap,
  Lightbulb,
  MonitorPlay,
  Rocket,
  Settings,
  ShieldCheck,
  Target,
  Users,
  Wallet
} from "lucide-react";
import { getFormations } from "@/lib/catalog";
import { formatCurrency } from "@/lib/utils";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";
import { PageHeroSlideshow, type PageHeroSlideshowSlide } from "@/components/PageHeroSlideshow";

export const metadata: Metadata = {
  title: "Formation IA, CRM & Automatisation — 14H | LODENE Centre de formation",
  description:
    "Formation courte (14H) pour digitaliser, organiser et automatiser son activité : mini-CRM, IA au quotidien et automatisations. Présentiel ou distanciel, financement OPCO/FAF/entreprise. Pour dirigeants, TPE, PME et indépendants.",
  alternates: { canonical: "/digital" },
  openGraph: {
    title: "Formation IA, CRM & Automatisation — LODENE",
    description: "Digitalisez, organisez et automatisez votre activité en 14H. Présentiel ou distanciel, financement possible.",
    url: "/digital",
    type: "website"
  }
};

const highlights = [
  { icon: Clock3, title: "14H", text: "format court et concret" },
  { icon: Wallet, title: "Financement possible", text: "OPCO · FAF · entreprise" },
  { icon: MonitorPlay, title: "Présentiel ou distanciel", text: "adapté à votre organisation" },
  { icon: Users, title: "Dirigeants, TPE, PME, indépendants", text: "public concerné" }
];

const digitalHeroSlides: PageHeroSlideshowSlide[] = [
  {
    src: "/formations/photos/vtc-distanciel-eco.webp",
    alt: "Formation digitale LODENE sur ordinateur avec accompagnement pédagogique.",
    label: "Digital",
    objectPosition: "50% 45%"
  },
  {
    src: "/loden-hero.jpg",
    alt: "Formateur LODENE accompagnant une apprenante avec une tablette.",
    label: "Accompagnement",
    objectPosition: "62% 50%"
  },
  {
    src: "/formations/photos/stage-accelere.webp",
    alt: "Organisation d'un parcours de formation avec outils numériques.",
    label: "Organisation",
    objectPosition: "50% 45%"
  },
  {
    src: "/formations/photos/vtc-intermediaire-light.webp",
    alt: "Échange entre formateur et professionnel autour d'un parcours digital.",
    label: "CRM",
    objectPosition: "50% 45%"
  }
];

const objectives = [
  { icon: Target, title: "Vision claire de l'activité", items: ["prospects", "demandes", "devis", "relances"] },
  { icon: Users, title: "CRM & suivi client", items: ["pipeline simple", "fiches contacts", "statuts", "historique"] },
  { icon: Brain, title: "IA utile au quotidien", items: ["réponses", "messages", "qualification", "productivité"] },
  { icon: Settings, title: "Automatisations simples", items: ["notifications", "rappels", "relances", "rendez-vous"] }
];

const modules = [
  { hours: "2H", title: "Module 1 — Diagnostic digital", items: ["identifier les points de blocage", "repérer les pertes de temps", "cartographier le parcours client", "définir les priorités"], icon: Target },
  { hours: "4H", title: "Module 2 — Structurer son mini-CRM", items: ["créer une base prospects / clients", "définir les statuts et le pipeline", "suivre demandes, devis et relances", "mettre en place un tableau de bord"], icon: Users },
  { hours: "4H", title: "Module 3 — Utiliser l'IA dans la relation client", items: ["rédiger des réponses et messages", "qualifier les demandes", "gagner du temps sur les tâches récurrentes", "améliorer la réactivité commerciale"], icon: Brain },
  { hours: "4H", title: "Module 4 — Automatisations essentielles", items: ["notifications et rappels", "relances automatiques simples", "prise de rendez-vous", "plan d'action opérationnel"], icon: Settings }
];

const deliverables = [
  "Une trame de mini-CRM",
  "Des modèles de messages et relances",
  "Un scénario simple d'agent IA",
  "Une checklist d'automatisations",
  "Un support de formation",
  "Un plan d'action sur 30 jours"
];

const financing = [
  { label: "OPCO", text: "prise en charge possible selon l'entreprise, la branche et le dossier" },
  { label: "FAF", text: "pour certains indépendants selon l'activité et l'organisme compétent" },
  { label: "Entreprise", text: "financement direct par l'employeur ou la structure" },
  { label: "CPF", text: "possible uniquement dans le cadre d'une offre certifiante éligible" }
];

const offers = [
  {
    name: "Essentiel",
    pitch: "Je structure mes bases",
    target: "indépendant / dirigeant",
    price: "990 €",
    features: ["14H de formation", "programme standard", "support pédagogique", "plan d'action"],
    featured: false
  },
  {
    name: "Pro",
    pitch: "Je professionnalise mon organisation",
    target: "TPE / PME",
    price: "1 490 € à 1 990 €",
    features: ["14H de formation", "cas concrets métier", "travail sur CRM & IA", "livrables personnalisés"],
    featured: true
  },
  {
    name: "Intra / sur-mesure",
    pitch: "J'adapte la formation à mon équipe",
    target: "entreprise",
    price: "Sur devis",
    features: ["contenu personnalisé", "exemples liés à l'activité", "format équipe", "accompagnement renforcé"],
    featured: false
  }
];

const steps = [
  { n: 1, icon: Target, title: "Audit des besoins", text: "échange initial pour comprendre le contexte et les objectifs" },
  { n: 2, icon: Settings, title: "Personnalisation", text: "adaptation des exemples, cas pratiques et priorités" },
  { n: 3, icon: MonitorPlay, title: "Formation", text: "animation de la session avec démonstrations et ateliers" },
  { n: 4, icon: CalendarCheck, title: "Suivi", text: "recommandations et accompagnement pour la mise en œuvre" }
];

export default async function DigitalPage() {
  const formations = (await getFormations()).filter((formation) => formation.productLine === "DIGITAL");

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Formation IA, CRM & Automatisation",
    description: "Formation courte (14H) pour digitaliser, organiser et automatiser son activité : mini-CRM, IA au quotidien et automatisations.",
    provider: {
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      sameAs: SITE_URL
    },
    offers: { "@type": "Offer", price: 990, priceCurrency: "EUR", url: absoluteUrl("/digital") }
  };

  return (
    <main>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: safeJsonLd(courseSchema) }} />

      <PageHeroSlideshow
        eyebrow="Pôle Digital — Centre de formation"
        title="Formation IA, CRM & Automatisation"
        text="Une formation courte pour digitaliser, organiser et automatiser votre activité. Mieux suivre vos prospects, mettre en place un mini-CRM clair et utiliser l'IA au quotidien."
        slides={digitalHeroSlides}
        primaryCta={{ href: "/contact?formation=ia-crm-automatisation#demande", label: "Demander un devis" }}
        secondaryCta={{ href: "/contact#demande", label: "Être rappelé" }}
        badges={highlights.map((highlight) => highlight.title)}
      />

      {/* POURQUOI / OBJECTIFS */}
      <section className="bg-white py-9 md:py-12">
        <div className="container-pad">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Pourquoi cette formation ?</p>
            <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight text-loden-ink sm:text-3xl">
              Votre activité ne doit pas seulement être digitale. Elle doit être structurée, simple et rentable.
            </h2>
            <p className="mt-3 text-sm leading-6 text-loden-muted md:text-base">
              Trop d&apos;entreprises perdent des prospects, oublient des relances et utilisent trop d&apos;outils dispersés.
              LODENE vous aide à structurer une organisation digitale simple.
            </p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
            {objectives.map((o) => {
              const Icon = o.icon;
              return (
                <article key={o.title} className="rounded-2xl border border-slate-200 bg-loden-pearl/40 p-5 shadow-soft">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-loden-700 shadow-soft">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-semibold text-loden-ink">{o.title}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-loden-muted">
                    {o.items.map((i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-loden-500" aria-hidden="true" /> {i}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROGRAMME */}
      <section className="bg-loden-pearl py-9 md:py-12">
        <div className="container-pad">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Le programme détaillé</p>
              <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight text-loden-ink sm:text-3xl">Une formation courte, structurée et applicable</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-loden-900 px-4 py-2 text-sm font-bold text-white">
              <GraduationCap className="h-4 w-4" aria-hidden="true" /> Total : 14 heures
            </span>
          </div>
          <div className="mt-6 grid gap-3 md:gap-4 lg:grid-cols-2">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <article key={m.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex shrink-0 flex-col items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-loden-50 text-loden-700">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-loden-700">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> {m.hours}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-loden-ink">{m.title}</h3>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-loden-muted">
                      {m.items.map((i) => (
                        <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-loden-600" aria-hidden="true" /> {i}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* MÉTHODE & LIVRABLES */}
      <section className="bg-white py-9 md:py-12">
        <div className="container-pad grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Méthode pédagogique</p>
            <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-2xl">Comprendre vite, pratiquer, repartir avec du concret</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Lightbulb, t: "Explication claire", d: "concepts essentiels structurés" },
                { icon: MonitorPlay, t: "Démonstration", d: "exemples concrets d'outils, CRM et IA" },
                { icon: Users, t: "Atelier pratique", d: "mise en application sur cas réels" },
                { icon: BadgeCheck, t: "Plan d'action", d: "feuille de route personnalisée" }
              ].map((x) => {
                const Icon = x.icon;
                return (
                  <div key={x.t} className="rounded-2xl border border-slate-200 bg-loden-pearl/40 p-4">
                    <Icon className="h-6 w-6 text-loden-700" aria-hidden="true" />
                    <p className="mt-2 font-semibold text-loden-ink">{x.t}</p>
                    <p className="text-sm text-loden-muted">{x.d}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-loden-900 p-6 text-white shadow-premium">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-loden-100">Chaque participant repart avec</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm leading-6 text-white/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-loden-300" aria-hidden="true" /> {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FINANCEMENT */}
      <section className="bg-loden-pearl py-9 md:py-12">
        <div className="container-pad">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Financement & modalités</p>
            <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight text-loden-ink sm:text-3xl">Des solutions de prise en charge selon votre situation</h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4">
            {financing.map((f) => (
              <div key={f.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-loden-50 font-extrabold text-loden-700">
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-loden-muted"><strong className="text-loden-ink">{f.label}</strong> — {f.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            L&apos;éligibilité au financement dépend du dossier, du statut du bénéficiaire et du cadre administratif applicable.
          </p>
        </div>
      </section>

      {/* OFFRES */}
      <section className="bg-white py-9 md:py-12">
        <div className="container-pad">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Offres & formats</p>
            <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight text-loden-ink sm:text-3xl">Des tarifs à personnaliser selon le besoin</h2>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {offers.map((o) => (
              <article
                key={o.name}
                className={`relative flex flex-col rounded-2xl border p-6 shadow-soft ${o.featured ? "border-loden-500 bg-loden-pearl/40 ring-2 ring-loden-200" : "border-slate-200 bg-white"}`}
              >
                {o.featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-loden-700 px-3 py-1 text-xs font-bold text-white">Le plus populaire</span>
                ) : null}
                <h3 className="text-xl font-bold text-loden-ink">{o.name}</h3>
                <p className="mt-1 text-sm text-loden-muted">{o.pitch}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-loden-700">Cible : {o.target}</p>
                <ul className="mt-4 grid gap-2">
                  {o.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-loden-ink">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-loden-600" aria-hidden="true" /> {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-2xl font-extrabold text-loden-ink">{o.price}</p>
                <Link
                  href="/contact?formation=ia-crm-automatisation#demande"
                  className={`focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-soft transition ${o.featured ? "bg-loden-700 text-white hover:bg-loden-800" : "border border-slate-200 bg-white text-loden-ink hover:border-loden-200 hover:text-loden-700"}`}
                >
                  Demander un devis <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-loden-pearl/40 p-4 sm:grid-cols-2">
            <p className="flex items-center gap-2 text-sm text-loden-muted"><FileText className="h-4 w-4 text-loden-700" aria-hidden="true" /> Audit express — analyse des besoins : <strong className="text-loden-ink">290 €</strong></p>
            <p className="flex items-center gap-2 text-sm text-loden-muted"><CalendarCheck className="h-4 w-4 text-loden-700" aria-hidden="true" /> Support post-formation — session de suivi : <strong className="text-loden-ink">190 €</strong></p>
          </div>
        </div>
      </section>

      {/* DÉROULEMENT */}
      <section className="bg-loden-pearl py-9 md:py-12">
        <div className="container-pad">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Déroulement & accompagnement</p>
            <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight text-loden-ink sm:text-3xl">Du besoin initial jusqu&apos;au passage à l&apos;action</h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <article key={s.n} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-loden-900 text-sm font-bold text-white">{s.n}</span>
                    <Icon className="h-5 w-5 text-loden-700" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 font-semibold text-loden-ink">{s.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-loden-muted">{s.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CATALOGUE DIGITAL (depuis le CRM) */}
      {formations.length > 0 ? (
        <section className="bg-white py-9 md:py-12">
          <div className="container-pad">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Toutes les formations du pôle</p>
              <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-2xl">Digital, IA &amp; CRM</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {formations.map((f) => (
                <Link
                  key={f.slug}
                  href={`/formations/${f.slug}`}
                  className="focus-ring group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:border-loden-200 hover:shadow-premium"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-loden-50 text-loden-700">
                    <Bot className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-semibold text-loden-ink group-hover:text-loden-700">{f.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-loden-muted">{f.description}</p>
                  <p className="mt-auto pt-3 text-sm font-semibold text-loden-700">
                    {f.quoteOnly || f.price <= 0 ? "Sur devis" : `dès ${formatCurrency(f.price)}`}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA FINAL */}
      <section className="bg-loden-900 py-10 text-white md:py-12">
        <div className="container-pad flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10"><Rocket className="h-6 w-6 text-loden-200" aria-hidden="true" /></span>
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Prêt à lancer votre formation ?</h2>
              <p className="mt-1 text-sm text-white/80">Digitalisez, organisez et accélérez votre activité avec une formation pensée pour le terrain.</p>
            </div>
          </div>
          <Link
            href="/contact?formation=ia-crm-automatisation#demande"
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-loden-ink shadow-soft transition hover:bg-loden-50 md:w-auto"
          >
            Contacter LODENE Formation <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
