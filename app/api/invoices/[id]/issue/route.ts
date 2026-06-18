import { proxyBackendJson } from "@/lib/backend-proxy";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/invoices/${encodeURIComponent(id)}/issue`, {
    method: "POST",
    body: {},
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
