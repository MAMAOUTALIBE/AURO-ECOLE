import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  return proxyBackendJson("/api/agencies", {
    headers: authorization ? { Authorization: authorization } : undefined
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson("/api/agencies", {
    method: "POST",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
