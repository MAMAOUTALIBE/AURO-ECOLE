import { proxyBackendJson } from "@/lib/backend-proxy";

// Formulaire d'inscription public : aucune authentification, on relaie simplement
// la demande vers le backend qui crée un Lead (source="inscription").
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  return proxyBackendJson("/api/inscriptions", {
    method: "POST",
    body
  });
}
