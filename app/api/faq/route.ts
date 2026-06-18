import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET() {
  return proxyBackendJson("/api/faq");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson("/api/faq", {
    method: "POST",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
