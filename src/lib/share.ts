import { nanoid } from "nanoid";
import { db } from "@/db";
import { shareLinks } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export function generateToken(): string {
  return nanoid(21);
}

export async function createShareLink(params: {
  artifactId: string;
  createdBy: string;
  expiresInHours?: number;
  maxViews?: number;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (params.expiresInHours ?? 48));

  await db.insert(shareLinks).values({
    artifactId: params.artifactId,
    token,
    expiresAt,
    maxViews: params.maxViews ?? null,
    createdBy: params.createdBy,
  });

  return { token, expiresAt };
}

export async function validateShareToken(
  token: string
): Promise<{ valid: boolean; artifactId?: string }> {
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(
      and(
        eq(shareLinks.token, token),
        gt(shareLinks.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!link) return { valid: false };

  if (link.maxViews && link.viewCount >= link.maxViews) {
    return { valid: false };
  }

  // Increment view count
  await db
    .update(shareLinks)
    .set({ viewCount: link.viewCount + 1 })
    .where(eq(shareLinks.id, link.id));

  return { valid: true, artifactId: link.artifactId };
}
