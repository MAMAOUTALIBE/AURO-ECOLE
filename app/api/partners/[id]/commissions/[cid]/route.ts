import { proxyBackendJson } from "@/lib/backend-proxy";

type Params = { params: Promise<{ id: string; cid: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, cid } = await params;
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(
    `/api/partners/${encodeURIComponent(id)}/commissions/${encodeURIComponent(cid)}`,
    {
      method: "PATCH",
      body,
      headers: authorization ? { Authorization: authorization } : undefined
    }
  );
}
