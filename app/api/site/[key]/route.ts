import { proxyBackendJson } from "@/lib/backend-proxy";

// Public : lecture d'une clé de réglage.
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return proxyBackendJson(`/api/site/${encodeURIComponent(key)}`);
}

// Admin : enregistrer la valeur d'une clé (auth relayée).
export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/site/${encodeURIComponent(key)}`, {
    method: "PUT",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}

// Admin : réinitialiser une clé (retour à la valeur par défaut).
export async function DELETE(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/site/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
