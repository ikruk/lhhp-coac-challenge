import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { and, desc, eq, ilike, or, sql, SQL } from "drizzle-orm";
import { saveFile, getArtifactType } from "@/lib/storage";
import { generateTags, generateDescription } from "@/lib/ai";
import { auth } from "@/auth";

function hasValidApiKey(req: NextRequest): boolean {
  const key = req.headers.get("x-api-key");
  return !!key && key === process.env.ARTIFACT_HUB_API_KEY;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ownerEmail = session.user.email;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(artifacts.authorEmail, ownerEmail)];
  if (search) {
    const s = or(
      ilike(artifacts.title, `%${search}%`),
      ilike(artifacts.description, `%${search}%`)
    );
    if (s) conditions.push(s);
  }
  if (tag) {
    conditions.push(sql`${tag} = ANY(${artifacts.tags})`);
  }

  const results = await db
    .select()
    .from(artifacts)
    .where(and(...conditions))
    .orderBy(desc(artifacts.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ artifacts: results, page, limit });
}

export async function POST(req: NextRequest) {
  const apiKeyAuthed = hasValidApiKey(req);
  const session = apiKeyAuthed ? null : await auth();

  if (!apiKeyAuthed && !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const tagsRaw = formData.get("tags") as string | null;

  const authorEmail = apiKeyAuthed
    ? (formData.get("authorEmail") as string | null)
    : session!.user!.email!;

  if (!file || !title || !authorEmail) {
    return NextResponse.json(
      { error: "file, title, and authorEmail are required" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const artifactType = getArtifactType(mimeType);

  const { filePath, fileName } = await saveFile(buffer, file.name, mimeType);

  let tags: string[] = [];
  if (tagsRaw) {
    tags = tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  } else {
    try {
      const content = artifactType === "html" || artifactType === "other"
        ? buffer.toString("utf-8")
        : title;
      tags = await generateTags(content, title);
    } catch {
      tags = [];
    }
  }

  let desc = description;
  if (!desc) {
    try {
      const content = artifactType === "html" || artifactType === "other"
        ? buffer.toString("utf-8")
        : title;
      desc = await generateDescription(content, title);
    } catch {
      desc = null;
    }
  }

  const [artifact] = await db
    .insert(artifacts)
    .values({
      title,
      description: desc,
      type: artifactType,
      filePath,
      fileName,
      fileSize: buffer.length,
      mimeType,
      tags,
      authorEmail,
    })
    .returning();

  return NextResponse.json({ artifact }, { status: 201 });
}
