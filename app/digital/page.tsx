import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Globe2,
  GraduationCap,
  Lightbulb,
  Megaphone,
  MonitorPlay,
  Rocket,
  Settings,
  ShieldCheck,
  Target,
  Users,
  Workflow
} from "lucide-react";
import { getFormations } from "@/lib/catalog";
import { formatCurrency } from "@/lib/utils";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";
import { PageHeroSlideshow, type PageHeroSlideshowSlide } from "@/components/PageHeroSlideshow";

export const metadata: Metadata = {
  title: "Pôle Tech, IA & Automatisation | Sites web, CRM & agents IA",
  description:
    "Sites web, CRM, agents IA, automatisations, prospection digitale et formation pour aider les TPE, PME, indépendants et dirigeants à attirer, suivre et convertir plus de clients.",
  alternates: { canonical: "/digital" },
  openGraph: {
    title: "Pôle Tech, IA & Automatisation — LODENE",
    description: "Création de sites web, CRM, agents IA, automatisations et prospection digitale pour développer votre activité.",
    url: "/digital",
    type: "website"
  }
};

const highlights = [
  { icon: Globe2, title: "Sites web", text: "vitrine, landing page, tunnel de contact" },
  { icon: Users, title: "CRM & pipeline", text: "prospects, devis, relances, suivi client" },
  { icon: Bot, title: "Agents IA", text: "assistant client, qualification, réponses" },
  { icon: Workflow, title: "Automatisations", text: "WhatsApp, email, RDV, notifications" }
];

const digitalHeroSlides: PageHeroSlideshowSlide[] = [
  {
    src: "/formations/photos/vtc-distanciel-eco.webp",
    alt: "Accompagnement digital LODENE sur ordinateur avec outils web, CRM et IA.",
    label: "Tech & IA",
    objectPosition: "50% 45%"
  },
  {
    src: "/loden-hero.jpg",
    alt: "Accompagnement professionnel autour d'une stratégie digitale.",
    label: "Stratégie",
    objectPosition: "62% 50%"
  },
  {
    src: "/formations/photos/stage-accelere.webp",
    alt: "Organisation d'un parcours client avec outils numériques.",
    label: "Automatisation",
    objectPosition: "50% 45%"
  },
  {
    src: "/formations/photos/vtc-intermediaire-light.webp",
    alt: "Échange entre formateur et professionnel autour d'un CRM et d'un agent IA.",
    label: "CRM",
    objectPosition: "50% 45%"
  }
];

const services = [
  {
    icon: Globe2,
    title: "Création de sites web",
    items: ["site vitrine", "landing page", "formulaire intelligent", "SEO local"]
  },
  {
    icon: Users,
    title: "CRM & suivi commercial",
    items: ["pipeline prospects", "devis", "relances", "historique client"]
  },
  {
    icon: Bot,
    title: "Agent IA & assistant client",
    items: ["qualification", "réponses", "prise de contact", "aide à la vente"]
  },
  {
    icon: Workflow,
    title: "Automatisations métier",
    items: ["emails", "WhatsApp", "rappels RDV", "notifications équipe"]
  },
  {
    icon: Megaphone,
    title: "Prospection digitale",
    items: ["scripts", "campagnes", "scoring", "suivi des leads"]
  },
  {
    icon: BarChart3,
    title: "Pilotage & performance",
    items: ["tableaux de bord", "trafic", "conversions", "plan d'action"]
  }
];

const modules = [
  {
    hours: "2H",
    title: "Module 1 — Audit tech & stratégie",
    items: ["identifier les pertes de prospects", "cartographier le parcours client", "prioriser site, CRM, IA ou automatisation", "définir les gains rapides"],
    icon: Target
  },
  {
    hours: "4H",
    title: "Module 2 — Site web & acquisition",
    items: ["structurer une offre claire", "préparer une landing page", "brancher formulaires et tracking", "optimiser la visibilité locale"],
    icon: Globe2
  },
  {
    hours: "4H",
    title: "Module 3 — CRM, pipeline & prospection",
    items: ["organiser prospects et clients", "suivre devis et relances", "mettre en place des scripts commerciaux", "piloter les conversions"],
    icon: Users
  },
  {
    hours: "4H",
    title: "Module 4 — Agent IA & automatisations",
    items: ["créer des scénarios d'agent IA", "automatiser les réponses récurrentes", "déclencher emails, WhatsApp et rappels", "construire une feuille de route"],
    icon: Bot
  }
];

const deliverables = [
  "Une feuille de route tech priorisée",
  "Une structure de site ou landing page",
  "Une trame CRM prospects / clients",
  "Des scripts de prospection et relance",
  "Un scénario d'agent IA",
  "Une checklist d'automatisations",
  "Un tableau de suivi des performances",
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
    name: "Pack Présence Web",
    pitch: "Je rends mon offre claire et visible",
    target: "site vitrine / landing page",
    price: "Sur devis",
    features: ["structure de page", "formulaire de contact", "SEO local", "appel à l'action clair"],
    featured: false
  },
  {
    name: "Pack CRM & Prospection",
    pitch: "Je ne perds plus mes prospects",
    target: "TPE / PME / indépendant",
    price: "À partir de 990 €",
    features: ["pipeline commercial", "fiches prospects", "modèles de relance", "tableau de bord"],
    featured: true
  },
  {
    name: "Pack Agent IA",
    pitch: "Je réponds plus vite et je qualifie mieux",
    target: "service client / vente",
    price: "Sur devis",
    features: ["scénario d'agent IA", "réponses types", "qualification des demandes", "guide d'utilisation"],
    featured: false
  },
  {
    name: "Pack Croissance Digitale",
    pitch: "Je connecte site, CRM, IA et relances",
    target: "entreprise en développement",
    price: "Sur devis",
    features: ["audit complet", "système sur-mesure", "automatisations", "formation de l'équipe"],
    featured: false
  }
];

const steps = [
  { n: 1, icon: Target, title: "Audit des besoins", text: "on identifie les points de blocage, les objectifs et les priorités commerciales" },
  { n: 2, icon: Settings, title: "Architecture de solution", text: "on choisit les bons outils : site, CRM, agent IA, formulaires, automatisations" },
  { n: 3, icon: MonitorPlay, title: "Mise en place ou formation", text: "on construit, démontre et forme vos équipes sur des cas concrets" },
  { n: 4, icon: CalendarCheck, title: "Suivi & optimisation", text: "on suit l'adoption, les relances, les conversions et les améliorations" }
];

const useCases = [
  "Recevoir plus de demandes depuis Google et le site",
  "Ne plus oublier les prospects à rappeler",
  "Répondre automatiquement aux questions simples",
  "Qualifier les demandes avant un appel commercial",
  "Relancer par email ou WhatsApp au bon moment",
  "Piloter les leads, devis et conversions dans un tableau clair"
];

export default async function DigitalPage() {
  const formations = (await getFormations()).filter((formation) => formation.productLine === "DIGITAL");

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Pôle Tech, IA & Automatisation",
    serviceType: "Sites web, CRM, agents IA, automatisations et prospection digitale",
    description: "Accompagnement tech pour créer des sites web, structurer un CRM, mettre en place des agents IA, automatiser les relances et développer la prospection digitale.",
    provider: {
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      sameAs: SITE_URL
    },
    areaServed: "France",
    offers: { "@type": "Offer", priceSpecification: { "@type": "PriceSpecification", priceCurrency: "EUR" }, url: absoluteUrl("/digital") }
  };

  return (
    <main>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: safeJsonLd(serviceSchema) }} />

      <PageHeroSlideshow
        eyebrow="Pôle Tech — Digital, IA & Croissance"
        title="Pôle Tech, IA & Automatisation"
        text="Création de sites web, CRM, agents IA, automatisations et prospection digitale pour attirer plus de demandes, mieux suivre vos clients et convertir plus vite."
        slides={digitalHeroSlides}
        primaryCta={{ href: "/contact?formation=pole-tech-ia-automatisation#demande", label: "Demander un audit digital" }}
        secondaryCta={{ href: "/contact#demande", label: "Être rappelé" }}
        badges={highlights.map((highlight) => highlight.title)}
      />

      {/* SERVICES */}
      <section className="bg-white py-9 md:py-12">
        <div className="container-pad">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Ce qu&apos;on peut mettre en place</p>
            <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight text-loden-ink sm:text-3xl">
              Un système digital complet pour attirer, suivre et convertir vos clients.
            </h2>
            <p className="mt-3 text-sm leading-6 text-loden-muted md:text-base">
              Beaucoup d&apos;entreprises ont un site, des messages, des prospects et des relances dispersés. LODENE vous aide à relier les bons outils pour créer un parcours plus clair et plus rentable.
            </p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {services.map((o) => {
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

      {/* CAS D'USAGE */}
      <section className="bg-loden-pearl py-9 md:py-12">
        <div className="container-pad grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Cas d&apos;usage clients</p>
            <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight text-loden-ink sm:text-3xl">
              On ne vend pas seulement de la tech. On règle des problèmes commerciaux.
            </h2>
            <p className="mt-3 text-sm leading-6 text-loden-muted md:text-base">
              Le but est simple : moins de temps perdu, plus de suivi, plus de réponses et une meilleure conversion des demandes.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {useCases.map((useCase) => (
              <div key={useCase} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-loden-600" aria-hidden="true" />
                <p className="text-sm font-semibold leading-6 text-loden-ink">{useCase}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMME */}
      <section className="bg-white py-9 md:py-12">
        <div className="container-pad">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Parcours formation & accompagnement</p>
              <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight text-loden-ink sm:text-3xl">Un format concret pour passer de l&apos;idée au système opérationnel</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-loden-900 px-4 py-2 text-sm font-bold text-white">
              <GraduationCap className="h-4 w-4" aria-hidden="true" /> Format formation : 14 heures
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Méthode de travail</p>
            <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-2xl">Clarifier, construire, former et mesurer</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Lightbulb, t: "Diagnostic clair", d: "besoins, priorités et irritants métier" },
                { icon: MonitorPlay, t: "Démonstration", d: "site, CRM, IA et automatisations sur cas réels" },
                { icon: Users, t: "Atelier pratique", d: "mise en application avec vos données et vos offres" },
                { icon: BadgeCheck, t: "Plan d'action", d: "feuille de route personnalisée et mesurable" }
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
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-loden-100">Livrables possibles</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Formation & modalités</p>
            <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight text-loden-ink sm:text-3xl">Des formats adaptables : accompagnement, formation ou prestation sur-mesure</h2>
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Packs commerciaux</p>
            <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight text-loden-ink sm:text-3xl">Choisissez le bon levier : visibilité, suivi client, IA ou croissance complète</h2>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
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
                  href="/contact?formation=pole-tech-ia-automatisation#demande"
                  className={`focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-soft transition ${o.featured ? "bg-loden-700 text-white hover:bg-loden-800" : "border border-slate-200 bg-white text-loden-ink hover:border-loden-200 hover:text-loden-700"}`}
                >
                  Demander un devis <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-loden-pearl/40 p-4 sm:grid-cols-2">
            <p className="flex items-center gap-2 text-sm text-loden-muted"><FileText className="h-4 w-4 text-loden-700" aria-hidden="true" /> Audit express — analyse des besoins : <strong className="text-loden-ink">290 €</strong></p>
            <p className="flex items-center gap-2 text-sm text-loden-muted"><CalendarCheck className="h-4 w-4 text-loden-700" aria-hidden="true" /> Session de suivi — optimisation et réglages : <strong className="text-loden-ink">190 €</strong></p>
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
              <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-2xl">Tech, IA &amp; automatisation</h2>
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
              <h2 className="text-xl font-bold sm:text-2xl">Prêt à moderniser votre activité ?</h2>
              <p className="mt-1 text-sm text-white/80">Site web, CRM, agent IA, automatisations ou prospection : on part de votre besoin et on construit le bon système.</p>
            </div>
          </div>
          <Link
            href="/contact?formation=pole-tech-ia-automatisation#demande"
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-loden-ink shadow-soft transition hover:bg-loden-50 md:w-auto"
          >
            Demander un audit digital <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
