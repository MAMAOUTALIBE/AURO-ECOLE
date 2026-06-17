import { proxyBackendJson } from "@/lib/backend-proxy";

// Admin : mise à jour des métadonnées d'un média (alt text, catégorie).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/media/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}

// Admin : suppression d'un média.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
