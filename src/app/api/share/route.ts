import { NextRequest, NextResponse } from "next/server";
import { createShareLink } from "@/lib/share";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { artifactId, expiresInHours, maxViews } = await req.json();

  if (!artifactId) {
    return NextResponse.json(
      { error: "artifactId is required" },
      { status: 400 }
    );
  }

  const [artifact] = await db
    .select({ authorEmail: artifacts.authorEmail })
    .from(artifacts)
    .where(eq(artifacts.id, artifactId))
    .limit(1);

  if (!artifact || artifact.authorEmail !== session.user.email) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const { token, expiresAt } = await createShareLink({
    artifactId,
    createdBy: session.user.email,
    expiresInHours,
    maxViews,
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
  const shareUrl = `${baseUrl}/share/${token}`;

  return NextResponse.json({ shareUrl, token, expiresAt }, { status: 201 });
}
