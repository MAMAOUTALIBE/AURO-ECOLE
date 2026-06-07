import { NextResponse } from "next/server";
import { proxyBackendJson } from "@/lib/backend-proxy";
import { SESSION_COOKIE } from "@/lib/auth-session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await proxyBackendJson("/api/auth/register", { method: "POST", body });
  const data = await result.clone().json().catch(() => null);

  // Comme le login : on dépose le JWT dans un cookie httpOnly (jamais lisible par JS).
  if (result.ok && data?.token) {
    const response = NextResponse.json(data, { status: result.status });
    response.cookies.set(SESSION_COOKIE, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    return response;
  }

  return result;
}
