import { proxyBackendJson } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return proxyBackendJson("/api/offre-50/events", { method: "POST", body });
}
