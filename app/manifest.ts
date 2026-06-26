import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LODENE Auto-École",
    short_name: "LODENE",
    description: "Auto-école premium nouvelle génération avec CPF, réservation et suivi personnalisé.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfdfc",
    theme_color: "#08AEB8",
    icons: [
      {
        src: "/lodene-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/favicon.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
