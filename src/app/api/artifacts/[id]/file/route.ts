import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "@/lib/storage";

// GET /api/artifacts/:id/file — serve the actual file
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [artifact] = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.id, id))
    .limit(1);

  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const buffer = await readFile(artifact.filePath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": artifact.mimeType,
      "Content-Disposition": `inline; filename="${artifact.fileName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
