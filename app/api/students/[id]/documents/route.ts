import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/students/${encodeURIComponent(id)}/documents`, {
    headers: authorization ? { Authorization: authorization } : undefined
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(`/api/students/${encodeURIComponent(id)}/documents`, {
    method: "POST",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
