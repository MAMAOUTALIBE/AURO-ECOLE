import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET() {
  return proxyBackendJson("/api/content/company");
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson("/api/content/company", {
    method: "PATCH",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
