import { proxyBackendJson } from "@/lib/backend-proxy";

// Action admin "Créer le compte élève" depuis le pipeline : relaie le Bearer (ou le
// cookie loden_session via le proxy) vers le backend qui crée le compte et renvoie
// l'identifiant + le mot de passe temporaire.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization");
  const { id } = await params;

  return proxyBackendJson(`/api/leads/${encodeURIComponent(id)}/convert-to-student`, {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
