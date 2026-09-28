import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME } from "@/auth/config";
import { verifySessionToken } from "@/auth/token";

export async function proxy(request: NextRequest) {
  const secret = process.env.APP_PASSWORD;
  const token = request.cookies.get(COOKIE_NAME)?.value ?? "";
  const isAuthenticated = secret
    ? await verifySessionToken(token, secret)
    : false;

  if (isAuthenticated) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth/login|api/health).*)",
  ],
};
