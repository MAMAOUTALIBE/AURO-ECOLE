import { proxyBackendJson } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson("/api/ai/lead-score", {
    method: "POST",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
