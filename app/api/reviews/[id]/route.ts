import { proxyBackendJson } from "@/lib/backend-proxy";

// Suppression définitive d'un avis (admin). Relaie l'Authorization, sinon cookie de session.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization");
  const { id } = await params;
  return proxyBackendJson(`/api/reviews/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
