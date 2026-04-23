import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { resolveTokenToUser } from "@/lib/tokens";

export type AuthSource = "session" | "token";

export interface AuthResult {
  email: string;
  source: AuthSource;
}

/**
 * Resolve the authenticated user for an API request. Tokens (sent as x-api-key
 * header) are tried first — they're cheaper than the session cookie roundtrip
 * and are the path MCP and other programmatic callers use. Falls back to the
 * Google sign-in session for browser traffic.
 */
export async function getAuthedUser(
  req: NextRequest
): Promise<AuthResult | null> {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const resolved = await resolveTokenToUser(apiKey);
    if (resolved) return { email: resolved.userEmail, source: "token" };
  }
  const session = await auth();
  if (session?.user?.email) return { email: session.user.email, source: "session" };
  return null;
}
