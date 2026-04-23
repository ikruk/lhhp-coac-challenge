import { NextRequest, NextResponse } from "next/server";
import { createShareLink } from "@/lib/share";

// POST /api/share — create a share link
export async function POST(req: NextRequest) {
  const { artifactId, createdBy, expiresInHours, maxViews } = await req.json();

  if (!artifactId || !createdBy) {
    return NextResponse.json(
      { error: "artifactId and createdBy are required" },
      { status: 400 }
    );
  }

  const { token, expiresAt } = await createShareLink({
    artifactId,
    createdBy,
    expiresInHours,
    maxViews,
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
  const shareUrl = `${baseUrl}/share/${token}`;

  return NextResponse.json({ shareUrl, token, expiresAt }, { status: 201 });
}
