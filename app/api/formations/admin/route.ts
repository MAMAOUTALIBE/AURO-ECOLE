import { proxyBackendJson } from "@/lib/backend-proxy";

// Lecture admin (protégée) : la session httpOnly est transmise automatiquement par le proxy.
export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  return proxyBackendJson("/api/formations/admin", {
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
