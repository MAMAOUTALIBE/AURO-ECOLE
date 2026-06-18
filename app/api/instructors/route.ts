import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackendJson("/api/instructors", { searchParams: url.searchParams });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson("/api/instructors", {
    method: "POST",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
