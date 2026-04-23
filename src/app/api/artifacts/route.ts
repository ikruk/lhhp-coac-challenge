import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { and, desc, eq, ilike, or, sql, SQL } from "drizzle-orm";
import { saveFile, getArtifactType } from "@/lib/storage";
import { generateTags, generateDescription } from "@/lib/ai";
import { getAuthedUser } from "@/lib/auth-helpers";
import {
  MAX_FILE_SIZE_BYTES,
  validateUploadedFile,
} from "@/lib/file-validation";
import { scanBufferWithVirusTotal } from "@/lib/virus-scan";

export async function GET(req: NextRequest) {
  const authed = await getAuthedUser(req);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(artifacts.authorEmail, authed.email)];
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
  const authed = await getAuthedUser(req);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const tagsRaw = formData.get("tags") as string | null;

  if (!file || !title) {
    return NextResponse.json(
      { error: "file and title are required" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `File exceeds the 10 MB limit (${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB).`,
      },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";

  const validation = validateUploadedFile(buffer, mimeType);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const scan = await scanBufferWithVirusTotal(buffer, file.name);
  if (scan.scanned && !scan.clean) {
    return NextResponse.json(
      {
        error: `File blocked by virus scan: ${scan.malicious} malicious / ${scan.suspicious} suspicious detections.`,
      },
      { status: 400 }
    );
  }

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
      authorEmail: authed.email,
    })
    .returning();

  return NextResponse.json({ artifact }, { status: 201 });
}
