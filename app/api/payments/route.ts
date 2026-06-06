import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  return proxyBackendJson("/api/payments", {
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
