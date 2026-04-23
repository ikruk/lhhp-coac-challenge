const VT_API_BASE = "https://www.virustotal.com/api/v3";
const DEFAULT_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 2_000;

export type ScanOutcome =
  | { scanned: true; clean: true; malicious: 0; suspicious: 0; analysisId: string }
  | {
      scanned: true;
      clean: false;
      malicious: number;
      suspicious: number;
      analysisId: string;
    }
  | { scanned: false; reason: "no-api-key" | "timeout" | "error"; detail?: string };

export async function scanBufferWithVirusTotal(
  buffer: Buffer,
  filename: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ScanOutcome> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return { scanned: false, reason: "no-api-key" };
  }

  try {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buffer)]), filename);

    const uploadRes = await fetch(`${VT_API_BASE}/files`, {
      method: "POST",
      headers: { "x-apikey": apiKey },
      body: form,
    });
    if (!uploadRes.ok) {
      return {
        scanned: false,
        reason: "error",
        detail: `upload returned ${uploadRes.status}`,
      };
    }
    const uploadJson = (await uploadRes.json()) as { data: { id: string } };
    const analysisId = uploadJson.data.id;

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const statusRes = await fetch(`${VT_API_BASE}/analyses/${analysisId}`, {
        headers: { "x-apikey": apiKey },
      });
      if (!statusRes.ok) {
        return {
          scanned: false,
          reason: "error",
          detail: `analysis returned ${statusRes.status}`,
        };
      }
      const statusJson = (await statusRes.json()) as {
        data: {
          attributes: {
            status: string;
            stats?: { malicious?: number; suspicious?: number };
          };
        };
      };
      const status = statusJson.data.attributes.status;
      if (status === "completed") {
        const stats = statusJson.data.attributes.stats ?? {};
        const malicious = stats.malicious ?? 0;
        const suspicious = stats.suspicious ?? 0;
        if (malicious === 0 && suspicious === 0) {
          return {
            scanned: true,
            clean: true,
            malicious: 0,
            suspicious: 0,
            analysisId,
          };
        }
        return {
          scanned: true,
          clean: false,
          malicious,
          suspicious,
          analysisId,
        };
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    return { scanned: false, reason: "timeout" };
  } catch (err) {
    return {
      scanned: false,
      reason: "error",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
