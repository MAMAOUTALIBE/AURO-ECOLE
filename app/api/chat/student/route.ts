import { proxyBackendJson } from "@/lib/backend-proxy";

// Assistant espace élève : relaie vers le backend qui authentifie l'élève (Bearer ou
// cookie loden_session via le proxy) et ne répond que sur SON dossier.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");

  return proxyBackendJson("/api/chat/student", {
    method: "POST",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
