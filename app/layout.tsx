import type { Metadata } from "next";
import { AiChatWidget } from "@/components/AiChatWidget";
import { Footer } from "@/components/Footer";
import { HeaderMain } from "@/components/HeaderMain";
import { HeaderTop } from "@/components/HeaderTop";
import { FloatingWhatsappButton } from "@/components/FloatingWhatsappButton";
import { contactInfo } from "@/data/site";
import { safeJsonLd } from "@/lib/json-ld";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://loden-autoecole.fr"),
  title: {
    default: "LODEN Auto-École | Permis nouvelle génération",
    template: "%s | LODEN Auto-École"
  },
  description:
    "LODEN Auto-École propose des formations au permis modernes, flexibles et premium avec CPF, réservation en ligne et suivi personnalisé.",
  keywords: [
    "auto-école",
    "permis B",
    "CPF permis",
    "permis accéléré",
    "code en ligne",
    "LODEN"
  ],
  openGraph: {
    title: "LODEN Auto-École",
    description: "Passe ton permis avec une auto-école premium, flexible et rassurante.",
    url: "https://loden-autoecole.fr",
    siteName: "LODEN Auto-École",
    images: [
      {
        url: "/loden-hero.jpg",
        width: 1200,
        height: 800,
        alt: "Voiture école moderne LODEN dans une rue lumineuse"
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "DrivingSchool"],
    name: "LODEN Auto-École",
    url: "https://loden-autoecole.fr",
    image: "https://loden-autoecole.fr/loden-hero.jpg",
    telephone: contactInfo.phone,
    email: contactInfo.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "24 avenue de la République",
      postalCode: "75011",
      addressLocality: "Paris",
      addressCountry: "FR"
    },
    areaServed: ["Paris 11", "Paris", "Est parisien", "Montreuil", "Vincennes"],
    openingHours: "Mo-Sa 08:00-20:00",
    priceRange: "€€",
    sameAs: [
      "https://www.instagram.com/loden.autoecole",
      "https://www.facebook.com/loden.autoecole"
    ]
  };

  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}
        />
        <HeaderTop />
        <HeaderMain />
        {children}
        <Footer />
        <FloatingWhatsappButton />
        <AiChatWidget />
      </body>
    </html>
  );
}
