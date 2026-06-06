import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LODEN Auto-École",
    short_name: "LODEN",
    description: "Auto-école premium nouvelle génération avec CPF, réservation et suivi personnalisé.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfdfc",
    theme_color: "#08AEB8",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "64x64",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
