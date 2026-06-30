import { proxyBackendJson } from "@/lib/backend-proxy";

// Public : avis Google prêts à afficher (note, nombre, jusqu'à 5 avis) + config visible.
export async function GET() {
  return proxyBackendJson("/api/google-reviews");
}
