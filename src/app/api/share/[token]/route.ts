import { NextRequest, NextResponse } from "next/server";
import { validateShareToken } from "@/lib/share";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/share/:token — validate token and return artifact info
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await validateShareToken(token);

  if (!result.valid || !result.artifactId) {
    return NextResponse.json(
      { error: "Invalid or expired share link" },
      { status: 404 }
    );
  }

  const [artifact] = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.id, result.artifactId))
    .limit(1);

  if (!artifact) {
    return NextResponse.json(
      { error: "Artifact not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ artifact });
}
