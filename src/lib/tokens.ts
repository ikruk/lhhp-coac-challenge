import { randomBytes, createHash } from "node:crypto";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";

const TOKEN_PREFIX = "ak_";
const TOKEN_BYTES = 32;

export function generateRawToken(): string {
  return TOKEN_PREFIX + randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function tokenPreview(raw: string): string {
  const visible = raw.slice(0, 11);
  return `${visible}…`;
}

export interface ResolvedToken {
  userEmail: string;
  tokenId: string;
}

export async function resolveTokenToUser(
  raw: string | null | undefined
): Promise<ResolvedToken | null> {
  if (!raw || !raw.startsWith(TOKEN_PREFIX)) return null;
  const hash = hashToken(raw);
  const [row] = await db
    .select({
      id: apiKeys.id,
      userEmail: apiKeys.userEmail,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash))
    .limit(1);
  if (!row) return null;

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id));

  return { userEmail: row.userEmail, tokenId: row.id };
}
