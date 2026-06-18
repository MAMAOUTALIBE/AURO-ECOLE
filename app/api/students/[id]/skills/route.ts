import { proxyBackendJson } from "@/lib/backend-proxy";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/students/${id}/skills`, {
    headers: authorization ? { Authorization: authorization } : undefined
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/students/${id}/skills`, {
    method: "PATCH",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
