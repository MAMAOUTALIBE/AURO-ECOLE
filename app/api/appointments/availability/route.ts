import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackendJson("/api/appointments/availability", { searchParams: url.searchParams });
}
