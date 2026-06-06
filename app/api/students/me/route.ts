import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  return proxyBackendJson("/api/students/me", {
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
