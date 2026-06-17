import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-session";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:4000";

// Admin : upload d'un fichier (multipart) relayé au backend avec l'auth de session.
export async function POST(request: Request) {
  const backend = process.env.LODEN_API_URL ?? DEFAULT_BACKEND_URL;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const auth = request.headers.get("authorization") ?? (token ? `Bearer ${token}` : undefined);

  try {
    const formData = await request.formData();
    const response = await fetch(new URL("/api/media/upload", backend), {
      method: "POST",
      headers: auth ? { Authorization: auth } : undefined,
      body: formData,
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({
      error: { code: "INVALID_BACKEND_RESPONSE", message: "Réponse backend invalide" }
    }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: { code: "BACKEND_UNAVAILABLE", message: "Le service LODENE est momentanément indisponible." } },
      { status: 503 }
    );
  }
}
