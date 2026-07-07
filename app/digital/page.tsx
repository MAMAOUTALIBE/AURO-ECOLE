import type { Metadata } from "next";
import Image from "next/image";
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
  title: "Pôle Tech, Web & IA | Sites web, CRM, automatisations & agents IA",
  description:
    "Sites web, CRM, agents IA, automatisations, prospection digitale et formation pour aider les TPE, PME, indépendants et dirigeants à attirer, suivre et convertir plus de clients.",
  alternates: { canonical: "/digital" },
  openGraph: {
    title: "Pôle Tech, Web & IA — LODENE",
    description: "Création de sites web, CRM, agents IA, automatisations et prospection digitale pour développer votre activité.",
    url: "/digital",
    type: "website"
  }
};

const digitalHeroSlides: PageHeroSlideshowSlide[] = [
  {
    src: "/formations/photos/digital-ai-agent-training.webp",
    alt: "Formation professionnelle autour d'un agent IA, d'un CRM et d'un workflow d'automatisation.",
    label: "Agent IA",
    objectPosition: "50% 50%"
  },
  {
    src: "/formations/photos/digital-transformation-training.webp",
    alt: "Session de formation à la digitalisation avec un formateur, des ordinateurs et un tableau de parcours client.",
    label: "Formation digitale",
    objectPosition: "50% 50%"
  },
  {
    src: "/formations/photos/digital-internet-crm-automation.webp",
    alt: "Poste de travail montrant un CRM, des tableaux de bord et des connexions internet automatisées.",
    label: "Internet & CRM",
    objectPosition: "50% 50%"
  },
  {
    src: "/formations/photos/digital-code-web-development.webp",
    alt: "Accompagnement autour du code, du développement web et d'un workflow d'automatisation.",
    label: "Code & web",
    objectPosition: "50% 50%"
  }
];

const digitalVisuals = {
  web: "/formations/photos/digital-code-web-development.webp",
  crm: "/formations/photos/digital-internet-crm-automation.webp",
  ai: "/formations/photos/digital-ai-agent-training.webp",
  automation: "/formations/photos/digital-transformation-training.webp"
};

const digitalCatalogueFallbacks = [digitalVisuals.web, digitalVisuals.ai, digitalVisuals.automation, digitalVisuals.crm];

const services = [
  {
    icon: Globe2,
    image: digitalVisuals.web,
    eyebrow: "Sites & acquisition",
    title: "Création de sites web",
    href: "/formations/site-web-landing-page",
    cta: "Construire ma présence web",
    items: ["site vitrine", "landing page", "formulaire intelligent", "SEO local"]
  },
  {
    icon: Users,
    image: digitalVisuals.crm,
    eyebrow: "CRM commercial",
    title: "CRM & suivi commercial",
    href: "/formations/mini-crm",
    cta: "Organiser mes prospects",
    items: ["pipeline prospects", "devis", "relances", "historique client"]
  },
  {
    icon: Bot,
    image: digitalVisuals.ai,
    eyebrow: "Assistant IA",
    title: "Agent IA & assistant client",
    href: "/formations/ia-professionnels",
    cta: "Mettre l'IA au travail",
    items: ["qualification", "réponses", "prise de contact", "aide à la vente"]
  },
  {
    icon: Workflow,
    image: digitalVisuals.automation,
    eyebrow: "No-code",
    title: "Automatisations métier",
    href: "/formations/automatisation-no-code",
    cta: "Automatiser les tâches",
    items: ["emails", "WhatsApp", "rappels RDV", "notifications équipe"]
  },
  {
    icon: Megaphone,
    image: digitalVisuals.web,
    eyebrow: "Prospection",
    title: "Prospection digitale",
    href: "/formations/prospection-presence-en-ligne",
    cta: "Générer plus de demandes",
    items: ["scripts", "campagnes", "scoring", "suivi des leads"]
  },
  {
    icon: BarChart3,
    image: digitalVisuals.crm,
    eyebrow: "Pilotage",
    title: "Pilotage & performance",
    href: "/formations/ia-crm-automatisation",
    cta: "Piloter les conversions",
    items: ["tableaux de bord", "trafic", "conversions", "plan d'action"]
  }
];

const tracks = [
  {
    icon: Globe2,
    image: digitalVisuals.web,
    badge: "Attirer",
    title: "Web & acquisition",
    text: "Site vitrine, landing page, SEO local, formulaire et suivi des conversions.",
    href: "/formations/site-web-landing-page",
    cta: "Voir le parcours web"
  },
  {
    icon: Bot,
    image: digitalVisuals.ai,
    badge: "Répondre",
    title: "IA utile au quotidien",
    text: "Prompts métier, réponses client, qualification des demandes et gain de temps.",
    href: "/formations/ia-professionnels",
    cta: "Voir le parcours IA"
  },
  {
    icon: Workflow,
    image: digitalVisuals.automation,
    badge: "Automatiser",
    title: "CRM & automatisation",
    text: "Pipeline prospects, relances, notifications, agent IA et tableau de bord.",
    href: "/formations/ia-crm-automatisation",
    cta: "Voir le parcours complet"
  }
];

const modules = [
  {
    hours: "2H",
    title: "Module 1 — Audit tech & stratégie",
    items: ["identifier les pertes de prospects", "cartographier le parcours client", "prioriser site, CRM, IA ou automatisation", "définir les gains rapides"],
    icon: Target,
    image: digitalVisuals.automation
  },
  {
    hours: "4H",
    title: "Module 2 — Site web & acquisition",
    items: ["structurer une offre claire", "préparer une landing page", "brancher formulaires et tracking", "optimiser la visibilité locale"],
    icon: Globe2,
    image: digitalVisuals.web
  },
  {
    hours: "4H",
    title: "Module 3 — CRM, pipeline & prospection",
    items: ["organiser prospects et clients", "suivre devis et relances", "mettre en place des scripts commerciaux", "piloter les conversions"],
    icon: Users,
    image: digitalVisuals.crm
  },
  {
    hours: "4H",
    title: "Module 4 — Agent IA & automatisations",
    items: ["créer des scénarios d'agent IA", "automatiser les réponses récurrentes", "déclencher emails, WhatsApp et rappels", "construire une feuille de route"],
    icon: Bot,
    image: digitalVisuals.ai
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
    image: digitalVisuals.web,
    pitch: "Je rends mon offre claire et visible",
    target: "site vitrine / landing page",
    price: "Sur devis",
    features: ["structure de page", "formulaire de contact", "SEO local", "appel à l'action clair"],
    featured: false
  },
  {
    name: "Pack CRM & Prospection",
    image: digitalVisuals.crm,
    pitch: "Je ne perds plus mes prospects",
    target: "TPE / PME / indépendant",
    price: "À partir de 990 €",
    features: ["pipeline commercial", "fiches prospects", "modèles de relance", "tableau de bord"],
    featured: true
  },
  {
    name: "Pack Agent IA",
    image: digitalVisuals.ai,
    pitch: "Je réponds plus vite et je qualifie mieux",
    target: "service client / vente",
    price: "Sur devis",
    features: ["scénario d'agent IA", "réponses types", "qualification des demandes", "guide d'utilisation"],
    featured: false
  },
  {
    name: "Pack Croissance Digitale",
    image: digitalVisuals.automation,
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
    name: "Pôle Tech, Web & IA",
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
        eyebrow="Pôle Tech"
        title="Tech, Web & IA"
        text="Sites web · CRM · agents IA · automatisations"
        slides={digitalHeroSlides}
        primaryCta={{ href: "/contact?formation=pole-tech-ia-automatisation#demande", label: "Audit digital" }}
        secondaryCta={{ href: "/contact#demande", label: "Être rappelé" }}
      />

      {/* PARCOURS */}
      <section className="bg-white py-8 md:py-10">
        <div className="container-pad">
          <div className="grid gap-3 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Choisir le bon axe</p>
              <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-2xl">
                Un pôle pour vendre mieux, répondre plus vite et piloter plus simplement.
              </h2>
            </div>
            <p className="text-sm leading-6 text-loden-muted md:text-base">
              On part du besoin réel : être visible, convertir les demandes, organiser les prospects ou automatiser les tâches répétitives.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {tracks.map((track) => {
              const Icon = track.icon;
              return (
                <Link
                  key={track.title}
                  href={track.href}
                  className="focus-ring group relative isolate min-h-[22rem] overflow-hidden rounded-2xl border border-white/60 bg-loden-900 shadow-premium"
                >
                  <Image
                    src={track.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-loden-900/60 to-black/10" aria-hidden="true" />
                  <span className="absolute inset-0 bg-loden-500/10 mix-blend-screen" aria-hidden="true" />
                  <div className="relative flex min-h-[22rem] flex-col p-5 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 text-loden-800 shadow-soft">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/25">
                        {track.badge}
                      </span>
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-2xl font-extrabold leading-tight">{track.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/80">{track.text}</p>
                      <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-loden-ink shadow-soft transition group-hover:bg-loden-50">
                        {track.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

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
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((o) => {
              const Icon = o.icon;
              return (
                <Link
                  key={o.title}
                  href={o.href}
                  className="focus-ring group relative isolate min-h-[20rem] overflow-hidden rounded-2xl border border-slate-200 bg-loden-900 shadow-soft transition hover:-translate-y-0.5 hover:shadow-premium"
                >
                  <Image
                    src={o.image}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-loden-900/60 to-black/10" aria-hidden="true" />
                  <div className="relative flex min-h-[20rem] flex-col p-5 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-loden-700 shadow-soft">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="rounded-full bg-white/20 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-loden-100 ring-1 ring-white/20">
                        {o.eyebrow}
                      </span>
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-xl font-extrabold leading-tight">{o.title}</h3>
                      <ul className="mt-3 grid gap-2 text-sm text-white/90 sm:grid-cols-2">
                        {o.items.map((i) => (
                          <li key={i} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-loden-200" aria-hidden="true" /> {i}
                          </li>
                        ))}
                      </ul>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-loden-100">
                        {o.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CAS D'USAGE */}
      <section className="relative isolate overflow-hidden bg-loden-900 py-10 text-white md:py-14">
        <Image
          src={digitalVisuals.crm}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <span className="absolute inset-0 bg-gradient-to-r from-loden-900 via-loden-900/90 to-loden-900/60" aria-hidden="true" />
        <div className="container-pad relative grid gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-200 sm:text-sm">Cas d&apos;usage clients</p>
            <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight sm:text-3xl">
              On ne vend pas seulement de la tech. On règle des problèmes commerciaux.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/80 md:text-base">
              Le but est simple : moins de temps perdu, plus de suivi, plus de réponses et une meilleure conversion des demandes.
            </p>
            <Link
              href="/contact?formation=pole-tech-ia-automatisation#demande"
              className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-loden-ink shadow-soft transition hover:bg-loden-50"
            >
              Diagnostiquer mon besoin <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {useCases.map((useCase) => (
              <div key={useCase} className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-soft backdrop-blur">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-loden-200" aria-hidden="true" />
                <p className="text-sm font-semibold leading-6 text-white">{useCase}</p>
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
                <article key={m.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                  <div className="relative h-36">
                    <Image
                      src={m.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-r from-black/80 via-loden-900/40 to-black/10" aria-hidden="true" />
                    <div className="relative flex h-full items-start justify-between p-5 text-white">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/90 text-loden-700 shadow-soft">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold text-white ring-1 ring-white/20">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> {m.hours}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
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
          <div className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-loden-900 p-6 text-white shadow-premium">
            <Image
              src={digitalVisuals.automation}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover opacity-30"
            />
            <span className="absolute inset-0 bg-gradient-to-br from-loden-900 via-loden-900/90 to-loden-900/60" aria-hidden="true" />
            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-loden-100">Livrables possibles</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm leading-6 text-white/90 ring-1 ring-white/10">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-loden-300" aria-hidden="true" /> {d}
                  </li>
                ))}
              </ul>
            </div>
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
                className={`relative flex flex-col overflow-hidden rounded-2xl border shadow-soft ${o.featured ? "border-loden-500 bg-loden-pearl/40 ring-2 ring-loden-200" : "border-slate-200 bg-white"}`}
              >
                <div className="relative h-44">
                  <Image
                    src={o.image}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-loden-900/40 to-black/10" aria-hidden="true" />
                  <div className="relative flex h-full flex-col justify-between p-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-white/20 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white ring-1 ring-white/20">
                        Pack
                      </span>
                      {o.featured ? (
                        <span className="rounded-full bg-loden-300 px-3 py-1 text-xs font-extrabold text-loden-ink">Populaire</span>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold leading-tight">{o.name}</h3>
                      <p className="mt-1 text-sm leading-5 text-white/80">{o.pitch}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-loden-700">Cible : {o.target}</p>
                  <ul className="mt-4 grid gap-2">
                    {o.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-loden-ink">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-loden-600" aria-hidden="true" /> {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-5 text-2xl font-extrabold text-loden-ink">{o.price}</p>
                  <Link
                    href="/contact?formation=pole-tech-ia-automatisation#demande"
                    className={`focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-soft transition ${o.featured ? "bg-loden-700 text-white hover:bg-loden-800" : "border border-slate-200 bg-white text-loden-ink hover:border-loden-200 hover:text-loden-700"}`}
                  >
                    Demander un devis <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
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
              <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-2xl">Tech, Web &amp; IA</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {formations.map((f, index) => {
                const image = f.imageUrl || digitalCatalogueFallbacks[index % digitalCatalogueFallbacks.length];
                return (
                  <Link
                    key={f.slug}
                    href={`/formations/${f.slug}`}
                    className="focus-ring group flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-loden-200 hover:shadow-premium"
                  >
                    <div className="relative h-40 bg-loden-900">
                      <Image
                        src={image}
                        alt=""
                        fill
                        loading="lazy"
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                        unoptimized
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-loden-900/20 to-black/5" aria-hidden="true" />
                      <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-loden-700 shadow-soft">
                          {f.duration}
                        </span>
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/90 text-loden-700 shadow-soft">
                          <Bot className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-semibold leading-tight text-loden-ink group-hover:text-loden-700">{f.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-loden-muted">{f.description}</p>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <p className="text-sm font-semibold text-loden-700">
                          {f.quoteOnly || f.price <= 0 ? "Sur devis" : `dès ${formatCurrency(f.price)}`}
                        </p>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-loden-700 text-white shadow-soft transition group-hover:translate-x-0.5 group-hover:bg-loden-800">
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
