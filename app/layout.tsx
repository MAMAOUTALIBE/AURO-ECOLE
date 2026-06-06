import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { HeaderMain } from "@/components/HeaderMain";
import { HeaderTop } from "@/components/HeaderTop";
import { FloatingWhatsappButton } from "@/components/FloatingWhatsappButton";
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
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <HeaderTop />
        <HeaderMain />
        {children}
        <Footer />
        <FloatingWhatsappButton />
      </body>
    </html>
  );
}
