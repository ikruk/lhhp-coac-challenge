import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { eq } from "drizzle-orm";
import { summarizeFeedback } from "@/lib/ai";

// POST /api/feedback/summarize — AI-summarize feedback for an artifact
export async function POST(req: NextRequest) {
  const { artifactId } = await req.json();

  if (!artifactId) {
    return NextResponse.json(
      { error: "artifactId is required" },
      { status: 400 }
    );
  }

  const items = await db
    .select()
    .from(feedback)
    .where(eq(feedback.artifactId, artifactId));

  if (items.length === 0) {
    return NextResponse.json({ summary: "No feedback yet." });
  }

  const summary = await summarizeFeedback(
    items.map((f) => ({
      authorName: f.authorName,
      content: f.content,
      rating: f.rating,
    }))
  );

  return NextResponse.json({ summary, feedbackCount: items.length });
}
