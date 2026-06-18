import { proxyBackendJson } from "@/lib/backend-proxy";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id, documentId } = await params;
  const body = await request.json().catch(() => null);
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(
    `/api/students/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`,
    {
      method: "PATCH",
      body,
      headers: authorization ? { Authorization: authorization } : undefined
    }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id, documentId } = await params;
  const authorization = request.headers.get("authorization");
  return proxyBackendJson(
    `/api/students/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`,
    {
      method: "DELETE",
      headers: authorization ? { Authorization: authorization } : undefined
    }
  );
}
