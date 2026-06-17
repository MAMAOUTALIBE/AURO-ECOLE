import { proxyBackendJson } from "@/lib/backend-proxy";

// Lecture admin (protégée) : la session httpOnly est transmise automatiquement par le proxy.
export async function GET() {
  return proxyBackendJson("/api/formations/admin");
}
