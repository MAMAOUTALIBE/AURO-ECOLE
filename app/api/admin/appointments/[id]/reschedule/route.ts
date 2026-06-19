import { proxyBackendJson } from "@/lib/backend-proxy";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  const { id } = await params;
  return proxyBackendJson(`/api/admin/appointments/${encodeURIComponent(id)}/reschedule`, {
    method: "PATCH",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
