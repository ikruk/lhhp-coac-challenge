import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/share/",
  "/api/feedback",
  "/share/",
  "/faq",
  "/releases",
  "/signin",
  "/presentation.html",
  "/_next",
  "/favicon.ico",
];

function isPublicFileRequest(pathname: string): boolean {
  return /^\/api\/artifacts\/[^/]+\/file$/.test(pathname);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (isPublicFileRequest(pathname)) {
    return NextResponse.next();
  }

  if (req.auth) {
    return NextResponse.next();
  }

  // Let requests carrying an x-api-key through — the route handler resolves
  // the token against the DB (can't do DB lookups from Edge middleware).
  if (req.headers.get("x-api-key")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/signin", req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
