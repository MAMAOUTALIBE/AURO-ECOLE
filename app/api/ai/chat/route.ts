import { proxyBackendJson } from "@/lib/backend-proxy";

// Public : le chatbot du site. La clé Groq reste côté backend uniquement.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return proxyBackendJson("/api/ai/chat", { method: "POST", body });
}
