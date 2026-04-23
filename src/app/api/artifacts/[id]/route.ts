import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteFile } from "@/lib/storage";
import { auth } from "@/auth";

async function requireOwner(id: string): Promise<
  | { ok: true; artifact: typeof artifacts.$inferSelect }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const [artifact] = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.id, id))
    .limit(1);

  if (!artifact) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Artifact not found" }, { status: 404 }),
    };
  }

  if (artifact.authorEmail !== session.user.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { ok: true, artifact };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await requireOwner(id);
  if (!check.ok) return check.response;
  return NextResponse.json({ artifact: check.artifact });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await requireOwner(id);
  if (!check.ok) return check.response;

  await deleteFile(check.artifact.filePath);
  await db.delete(artifacts).where(eq(artifacts.id, id));

  return NextResponse.json({ success: true });
}
