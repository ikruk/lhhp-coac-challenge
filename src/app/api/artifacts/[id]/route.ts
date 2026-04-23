import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteFile } from "@/lib/storage";

// GET /api/artifacts/:id — get single artifact
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

  return NextResponse.json({ artifact });
}

// DELETE /api/artifacts/:id
export async function DELETE(
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

  await deleteFile(artifact.filePath);
  await db.delete(artifacts).where(eq(artifacts.id, id));

  return NextResponse.json({ success: true });
}
