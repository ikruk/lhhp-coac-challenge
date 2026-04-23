import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

function resolveUploadDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  return path.join(/* turbopackIgnore: true */ process.cwd(), "uploads");
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(resolveUploadDir(), { recursive: true });
}

export function getArtifactType(mimeType: string): "html" | "image" | "pdf" | "other" {
  if (mimeType === "text/html") return "html";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ filePath: string; fileName: string }> {
  await ensureUploadDir();

  const ext = path.extname(originalName) || guessExtension(mimeType);
  const fileName = `${uuidv4()}${ext}`;
  const filePath = path.join(resolveUploadDir(), fileName);

  await fs.writeFile(filePath, buffer);

  return { filePath: fileName, fileName: originalName };
}

export async function saveContent(
  content: string,
  title: string,
  mimeType: string
): Promise<{ filePath: string; fileName: string; fileSize: number }> {
  await ensureUploadDir();

  const ext = guessExtension(mimeType);
  const safeName = title.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50);
  const fileName = `${uuidv4()}${ext}`;
  const filePath = path.join(resolveUploadDir(), fileName);

  const buffer = Buffer.from(content, "utf-8");
  await fs.writeFile(filePath, buffer);

  return { filePath: fileName, fileName: `${safeName}${ext}`, fileSize: buffer.length };
}

export async function readFile(storedName: string): Promise<Buffer> {
  const filePath = path.join(resolveUploadDir(), storedName);
  return fs.readFile(filePath);
}

export async function deleteFile(storedName: string): Promise<void> {
  const filePath = path.join(resolveUploadDir(), storedName);
  await fs.unlink(filePath).catch(() => {});
}

function guessExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "text/html": ".html",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "text/markdown": ".md",
  };
  return map[mimeType] || ".bin";
}
