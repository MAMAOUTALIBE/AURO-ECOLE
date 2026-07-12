import type { Metadata } from "next";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { AiChatWidget } from "@/components/AiChatWidget";
import { Footer } from "@/components/Footer";
import { HeaderMain } from "@/components/HeaderMain";
import { HeaderTop } from "@/components/HeaderTop";
import { MobileActionBar } from "@/components/MobileActionBar";
import { SiteChrome } from "@/components/SiteChrome";
import { companyInfo, contactInfo, socialLinks, openingHoursSpec, servedAreas } from "@/data/site";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_URL, SITE_NAME, OG_IMAGE, absoluteUrl } from "@/lib/seo";
import {
  defaultNavCtas,
  defaultNavPrimary,
  getSiteSetting,
  type NavCtas,
  type NavPrimary
} from "@/lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LODENE Auto-École | Permis nouvelle génération",
    template: "%s | LODENE Auto-École"
  },
  description:
    "LODENE Auto-École propose des formations au permis modernes, flexibles et premium avec CPF, réservation en ligne et suivi personnalisé.",
  keywords: [
    "auto-école",
    "permis B",
    "CPF permis",
    "permis accéléré",
    "code en ligne",
    "LODENE"
  ],
  openGraph: {
    title: "LODENE Auto-École",
    description: "Passe ton permis avec une auto-école premium, flexible et rassurante.",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: "/loden-hero.jpg",
        width: 1200,
        height: 800,
        alt: "Voiture école moderne LODENE dans une rue lumineuse"
      }
    ],
    locale: "fr_FR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "LODENE Auto-École",
    description: "Passe ton permis avec une auto-école premium, flexible et rassurante.",
    images: ["/loden-hero.jpg"]
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" }
    ],
    shortcut: "/favicon.png",
    apple: "/lodene-logo.png"
  },
  // Vérification Google Search Console : renseigner NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  // (le code fourni par GSC) puis redéployer — la balise meta est alors injectée.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
  manifest: "/manifest.webmanifest"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Navigation pilotée depuis le CMS (fallback : valeurs par défaut si API indisponible).
  const [nav, ctas] = await Promise.all([
    getSiteSetting<NavPrimary>("nav.primary", defaultNavPrimary),
    getSiteSetting<NavCtas>("nav.ctas", defaultNavCtas)
  ]);

  // JSON-LD bâti uniquement sur des données vérifiées : on n'émet que les champs renseignés
  // (pas de note ni de fourchette de prix non confirmées ; pas de géolocalisation GPS car
  // les coordonnées ne sont pas confirmées dans la fiche établissement).
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "DrivingSchool"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    image: OG_IMAGE,
    logo: absoluteUrl("/lodene-logo.png"),
    ...(contactInfo.phone ? { telephone: contactInfo.phone } : {}),
    ...(contactInfo.email ? { email: contactInfo.email } : {}),
    ...(companyInfo.siret
      ? { identifier: { "@type": "PropertyValue", propertyID: "SIRET", value: companyInfo.siret } }
      : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: companyInfo.address,
      postalCode: companyInfo.postalCode,
      addressLocality: companyInfo.city,
      addressRegion: "Yvelines",
      addressCountry: "FR"
    },
    // Zone desservie réelle (Conflans + communes limitrophes ~50 km).
    areaServed: servedAreas.map((name) => ({ "@type": "City", name })),
    ...(contactInfo.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            telephone: contactInfo.phone,
            contactType: "customer service",
            areaServed: "FR",
            availableLanguage: ["French"]
          }
        }
      : {}),
    // Horaires d'ouverture du bureau au format structuré (schema.org).
    openingHoursSpecification: openingHoursSpec.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: slot.days.map((day) => `https://schema.org/${day}`),
      opens: slot.opens,
      closes: slot.closes
    })),
    ...(socialLinks.length > 0 ? { sameAs: socialLinks.map((social) => social.href) } : {})
  };

  // Entité WebSite (aide Google à consolider l'entité de marque). Pas de SearchAction :
  // aucune page publique de résultats de recherche n'est exposée.
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "fr-FR",
    publisher: { "@id": `${SITE_URL}/#organization` }
  };

  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <AnalyticsProvider />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema) }}
        />
        <SiteChrome
          header={
            <>
              <HeaderTop />
              <HeaderMain nav={nav} ctas={ctas} />
            </>
          }
          footer={
            <>
              <Footer />
              <AiChatWidget />
              <MobileActionBar />
            </>
          }
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
