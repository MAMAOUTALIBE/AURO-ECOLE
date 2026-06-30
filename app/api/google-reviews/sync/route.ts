import { proxyBackendJson } from "@/lib/backend-proxy";

// Admin : déclenche une synchronisation immédiate depuis Google.
// Le proxy relaie l'en-tête Authorization, sinon retombe sur le cookie de session.
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  return proxyBackendJson("/api/google-reviews/sync", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
