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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await requireOwner(id);
  if (!check.ok) return check.response;

  const body = (await req.json().catch(() => null)) as
    | { title?: unknown; description?: unknown; tags?: unknown }
    | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Partial<typeof artifacts.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json({ error: "title must be a non-empty string" }, { status: 400 });
    }
    update.title = body.title.trim().slice(0, 500);
  }

  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      return NextResponse.json({ error: "description must be a string or null" }, { status: 400 });
    }
    const trimmed = typeof body.description === "string" ? body.description.trim() : null;
    update.description = trimmed && trimmed.length > 0 ? trimmed.slice(0, 2000) : null;
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
      return NextResponse.json({ error: "tags must be a string array" }, { status: 400 });
    }
    update.tags = (body.tags as string[])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20);
  }

  const [updated] = await db
    .update(artifacts)
    .set(update)
    .where(eq(artifacts.id, id))
    .returning();

  return NextResponse.json({ artifact: updated });
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
