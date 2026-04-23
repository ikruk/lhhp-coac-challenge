import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { desc, ilike, or, sql } from "drizzle-orm";
import { saveFile, getArtifactType } from "@/lib/storage";
import { generateTags, generateDescription } from "@/lib/ai";

// GET /api/artifacts — list/search artifacts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let query = db.select().from(artifacts);

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(artifacts.title, `%${search}%`),
        ilike(artifacts.description, `%${search}%`)
      )
    );
  }
  if (tag) {
    conditions.push(sql`${tag} = ANY(${artifacts.tags})`);
  }

  const results = await query
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(desc(artifacts.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ artifacts: results, page, limit });
}

// POST /api/artifacts — upload a new artifact
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const authorEmail = formData.get("authorEmail") as string;
  const tagsRaw = formData.get("tags") as string | null;

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

  // Parse or auto-generate tags
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

  // Auto-generate description if not provided
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
