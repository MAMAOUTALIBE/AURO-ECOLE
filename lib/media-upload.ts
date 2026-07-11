export type UploadedMedia = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
};

export async function uploadAdminMedia(file: File, options: { altText?: string; category?: string } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (options.altText) formData.append("altText", options.altText);
  if (options.category) formData.append("category", options.category);

  const response = await fetch("/api/media/upload", { method: "POST", body: formData });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message ?? "Téléversement impossible.");
  return payload.data as UploadedMedia;
}
