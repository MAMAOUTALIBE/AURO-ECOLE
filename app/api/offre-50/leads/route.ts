import { proxyBackendJson } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return proxyBackendJson("/api/offre-50/leads", { method: "POST", body });
}
