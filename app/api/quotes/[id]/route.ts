import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/quotes/${encodeURIComponent(id)}`, {
    headers: authorization ? { Authorization: authorization } : undefined
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/quotes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/quotes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
