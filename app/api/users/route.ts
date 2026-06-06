import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authorization = request.headers.get("authorization");

  return proxyBackendJson("/api/users", {
    searchParams: url.searchParams,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
