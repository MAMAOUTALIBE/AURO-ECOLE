import type { Metadata } from "next";
import { AiChatWidget } from "@/components/AiChatWidget";
import { Footer } from "@/components/Footer";
import { HeaderMain } from "@/components/HeaderMain";
import { HeaderTop } from "@/components/HeaderTop";
import { SiteChrome } from "@/components/SiteChrome";
import { companyInfo, contactInfo, socialLinks } from "@/data/site";
import { safeJsonLd } from "@/lib/json-ld";
import {
  defaultNavCtas,
  defaultNavPrimary,
  getSiteSetting,
  type NavCtas,
  type NavPrimary
} from "@/lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://loden-autoecole.fr"),
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
    url: "https://loden-autoecole.fr",
    siteName: "LODENE Auto-École",
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
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  },
  manifest: "/manifest.webmanifest"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Navigation pilotée depuis le CMS (fallback : valeurs par défaut si API indisponible).
  const [nav, ctas] = await Promise.all([
    getSiteSetting<NavPrimary>("nav.primary", defaultNavPrimary),
    getSiteSetting<NavCtas>("nav.ctas", defaultNavCtas)
  ]);

  // JSON-LD bâti uniquement sur des données vérifiées : on n'émet que les champs renseignés
  // (pas de téléphone/email/horaires/réseaux non confirmés, pas de note ni de fourchette de prix).
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "DrivingSchool"],
    name: "LODENE Auto-École",
    url: "https://loden-autoecole.fr",
    image: "https://loden-autoecole.fr/loden-hero.jpg",
    ...(contactInfo.phone ? { telephone: contactInfo.phone } : {}),
    ...(contactInfo.email ? { email: contactInfo.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: companyInfo.address,
      postalCode: companyInfo.postalCode,
      addressLocality: companyInfo.city,
      addressCountry: "FR"
    },
    areaServed: ["Conflans-Sainte-Honorine", "Yvelines"],
    ...(contactInfo.hours ? { openingHours: contactInfo.hours } : {}),
    ...(socialLinks.length > 0 ? { sameAs: socialLinks.map((social) => social.href) } : {})
  };

  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}
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
            </>
          }
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
