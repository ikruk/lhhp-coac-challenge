import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/feedback?artifactId=... — list feedback for an artifact
export async function GET(req: NextRequest) {
  const artifactId = req.nextUrl.searchParams.get("artifactId");

  if (!artifactId) {
    return NextResponse.json(
      { error: "artifactId is required" },
      { status: 400 }
    );
  }

  const items = await db
    .select()
    .from(feedback)
    .where(eq(feedback.artifactId, artifactId))
    .orderBy(asc(feedback.createdAt));

  return NextResponse.json({ feedback: items });
}

// POST /api/feedback — add feedback
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { artifactId, authorName, content, rating, parentId } = body;

  if (!artifactId || !authorName || !content) {
    return NextResponse.json(
      { error: "artifactId, authorName, and content are required" },
      { status: 400 }
    );
  }

  const [item] = await db
    .insert(feedback)
    .values({
      artifactId,
      authorName,
      content,
      rating: rating ?? null,
      parentId: parentId ?? null,
    })
    .returning();

  return NextResponse.json({ feedback: item }, { status: 201 });
}
