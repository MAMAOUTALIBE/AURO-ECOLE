import { proxyBackendJson } from "@/lib/backend-proxy";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  const { id } = await params;
  return proxyBackendJson(`/api/admin/appointments/${encodeURIComponent(id)}/transform-to-student`, {
    method: "POST",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
