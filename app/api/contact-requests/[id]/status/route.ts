import { proxyBackendJson } from "@/lib/backend-proxy";

// Rend atteignable le tri des demandes de contact côté CRM :
// PATCH /api/contact-requests/:id/status -> backend (garde `contacts.manage`).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  const { id } = await params;

  return proxyBackendJson(`/api/contact-requests/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body,
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
