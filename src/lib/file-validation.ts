export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 10;

const ALLOWED_MIME_TYPES = new Set([
  "text/html",
  "text/plain",
  "text/markdown",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

// EICAR AV test string — if anyone uploads the standard antivirus test file,
// block it. Catches "did you wire up the scanner" smoke tests.
const EICAR_STRING =
  "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

function isPlausibleText(buf: Buffer): boolean {
  const sample = buf.subarray(0, Math.min(4096, buf.length));
  for (const byte of sample) {
    if (byte === 0x09 || byte === 0x0a || byte === 0x0d) continue;
    if (byte < 0x20 || byte === 0x7f) return false;
  }
  return true;
}

const MAGIC_BYTE_CHECKS: Record<string, (buf: Buffer) => boolean> = {
  "application/pdf": (b) => b.subarray(0, 4).toString("ascii") === "%PDF",
  "image/png": (b) =>
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a,
  "image/jpeg": (b) =>
    b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/gif": (b) => {
    if (b.length < 6) return false;
    const sig = b.subarray(0, 6).toString("ascii");
    return sig === "GIF87a" || sig === "GIF89a";
  },
  "image/webp": (b) =>
    b.length >= 12 &&
    b.subarray(0, 4).toString("ascii") === "RIFF" &&
    b.subarray(8, 12).toString("ascii") === "WEBP",
  "image/svg+xml": (b) => {
    const s = b.subarray(0, 1024).toString("utf-8").trimStart();
    return s.startsWith("<?xml") || s.startsWith("<svg");
  },
  "text/html": isPlausibleText,
  "text/plain": isPlausibleText,
  "text/markdown": isPlausibleText,
};

function isPEExecutable(buf: Buffer): boolean {
  if (buf.length < 64) return false;
  if (buf[0] !== 0x4d || buf[1] !== 0x5a) return false; // "MZ"
  const peOffset = buf.readUInt32LE(0x3c);
  if (peOffset + 4 > buf.length) return false;
  return buf[peOffset] === 0x50 && buf[peOffset + 1] === 0x45; // "PE"
}

function isELFExecutable(buf: Buffer): boolean {
  return (
    buf.length >= 4 &&
    buf[0] === 0x7f &&
    buf[1] === 0x45 &&
    buf[2] === 0x4c &&
    buf[3] === 0x46
  );
}

function isMachOExecutable(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  const sig = buf.readUInt32BE(0);
  return (
    sig === 0xfeedface ||
    sig === 0xfeedfacf ||
    sig === 0xcefaedfe ||
    sig === 0xcffaedfe ||
    sig === 0xcafebabe
  );
}

export type FileValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateUploadedFile(
  buffer: Buffer,
  mimeType: string
): FileValidationResult {
  if (buffer.length === 0) {
    return { ok: false, error: "File is empty." };
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `File exceeds the ${MAX_FILE_SIZE_MB} MB limit (${(
        buffer.length /
        (1024 * 1024)
      ).toFixed(2)} MB).`,
    };
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return {
      ok: false,
      error: `File type "${mimeType}" is not allowed. Accepted: HTML, text, Markdown, PDF, PNG, JPEG, GIF, WebP, SVG.`,
    };
  }

  const magicCheck = MAGIC_BYTE_CHECKS[mimeType];
  if (magicCheck && !magicCheck(buffer)) {
    return {
      ok: false,
      error: `File content does not match the declared type (${mimeType}).`,
    };
  }

  if (isPEExecutable(buffer) || isELFExecutable(buffer) || isMachOExecutable(buffer)) {
    return { ok: false, error: "Executable binaries are not allowed." };
  }

  if (buffer.includes(EICAR_STRING)) {
    return {
      ok: false,
      error: "File blocked by virus scan (EICAR antivirus test pattern detected).",
    };
  }

  return { ok: true };
}
