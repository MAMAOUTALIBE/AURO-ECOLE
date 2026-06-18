import { proxyBackendJson } from "@/lib/backend-proxy";

// Public : map { clé: valeur } de tous les réglages du site.
export async function GET() {
  return proxyBackendJson("/api/site");
}
