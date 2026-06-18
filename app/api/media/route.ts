import { proxyBackendJson } from "@/lib/backend-proxy";

// Admin : liste des médias (filtrable ?category=).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return proxyBackendJson("/api/media", { searchParams });
}
