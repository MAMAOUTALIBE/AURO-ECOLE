import { proxyBackendJson } from "@/lib/backend-proxy";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/students/${encodeURIComponent(id)}/reset-password`, {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
