import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_TTL_MS } from "@/auth/config";
import { createSessionToken } from "@/auth/token";

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const aBytes = Buffer.from(a);
  const bBytes = Buffer.from(b);
  if (aBytes.length !== bBytes.length) {
    return false;
  }
  return timingSafeEqual(aBytes, bBytes);
}

export async function POST(request: Request) {
  const secret = process.env.APP_PASSWORD;
  if (!secret) {
    return NextResponse.json(
      { error: "auth is not configured" },
      { status: 500 },
    );
  }

  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  if (!safeEqual(password, secret)) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }

  const token = await createSessionToken(secret, SESSION_TTL_MS);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return response;
}
