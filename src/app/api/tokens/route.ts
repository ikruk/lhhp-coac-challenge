import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateRawToken, hashToken, tokenPreview } from "@/lib/tokens";

async function requireSessionEmail(): Promise<
  { email: string } | { response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.email) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { email: session.user.email };
}

export async function GET() {
  const check = await requireSessionEmail();
  if ("response" in check) return check.response;

  const tokens = await db
    .select({
      id: apiKeys.id,
      label: apiKeys.label,
      keyPreview: apiKeys.keyPreview,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userEmail, check.email))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json({ tokens });
}

export async function POST(req: NextRequest) {
  const check = await requireSessionEmail();
  if ("response" in check) return check.response;

  const body = (await req.json().catch(() => null)) as { label?: unknown } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const rawLabel = typeof body.label === "string" ? body.label.trim() : "";
  if (rawLabel.length === 0) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }
  const label = rawLabel.slice(0, 80);

  const raw = generateRawToken();
  const [inserted] = await db
    .insert(apiKeys)
    .values({
      userEmail: check.email,
      keyHash: hashToken(raw),
      keyPreview: tokenPreview(raw),
      label,
    })
    .returning({
      id: apiKeys.id,
      label: apiKeys.label,
      keyPreview: apiKeys.keyPreview,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    });

  return NextResponse.json(
    {
      token: inserted,
      raw,
    },
    { status: 201 }
  );
}
