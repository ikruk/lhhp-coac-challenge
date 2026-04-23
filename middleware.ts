import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/share/",
  "/api/feedback",
  "/share/",
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

  const apiKey = req.headers.get("x-api-key");
  if (apiKey && apiKey === process.env.ARTIFACT_HUB_API_KEY) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
