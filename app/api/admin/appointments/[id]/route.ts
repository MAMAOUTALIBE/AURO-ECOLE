import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization");
  const { id } = await params;
  return proxyBackendJson(`/api/admin/appointments/${encodeURIComponent(id)}`, {
    headers: authorization ? { Authorization: authorization } : undefined
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  const { id } = await params;
  return proxyBackendJson(`/api/admin/appointments/${encodeURIComponent(id)}`, {
    method: "PUT",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization");
  const { id } = await params;
  return proxyBackendJson(`/api/admin/appointments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
