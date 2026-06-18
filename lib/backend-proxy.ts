import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-session";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:4000";

type ProxyOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  searchParams?: URLSearchParams;
  headers?: HeadersInit;
};

export async function proxyBackendJson(path: string, options: ProxyOptions = {}) {
  const baseUrl = process.env.LODEN_API_URL ?? DEFAULT_BACKEND_URL;
  const url = new URL(path, baseUrl);

  options.searchParams?.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) {
    headers.set("Content-Type", "application/json");
  }

  // Repli sur la session cookie httpOnly si aucun header Authorization fourni.
  if (!headers.has("authorization")) {
    const sessionToken = (await cookies()).get(SESSION_COOKIE)?.value;
    if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
  }

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store"
    });

    // Réponses sans corps (204 No Content, 205, 304) : un body JSON y est illégal
    // (NextResponse.json lèverait). On relaie le statut tel quel. Typique des DELETE.
    if (response.status === 204 || response.status === 205 || response.status === 304) {
      return new NextResponse(null, { status: response.status });
    }

    const payload = await response.json().catch(() => ({
      error: {
        code: "INVALID_BACKEND_RESPONSE",
        message: "Réponse backend invalide"
      }
    }));

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "Le service LODENE est momentanément indisponible."
        }
      },
      { status: 503 }
    );
  }
}
