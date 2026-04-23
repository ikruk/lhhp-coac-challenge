# Artifact Hub — WRITEUP

## Links

- **Public URL:** https://artifact-hub.onrender.com
- **MCP endpoint:** https://artifact-hub-mcp.onrender.com/mcp
- **Source (GitHub):** https://github.com/ikruk/lhhp-coac-challenge

### Claude Desktop MCP config

Add this to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) — the equivalent `%APPDATA%\Claude\` path on Windows, `~/.config/Claude/` on Linux:

```json
{
  "mcpServers": {
    "artifact-hub": {
      "url": "https://artifact-hub-mcp.onrender.com/mcp"
    }
  }
}
```

If your Claude Desktop version is too old to accept `url`, use the `mcp-remote` bridge:

```json
{
  "mcpServers": {
    "artifact-hub": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://artifact-hub-mcp.onrender.com/mcp"]
    }
  }
}
```

Restart Claude Desktop. Seven tools become available: `publish_artifact`, `search_artifacts`, `get_artifact`, `add_feedback`, `summarize_feedback`, `create_share_link`, `list_my_artifacts`. To see the artifact in the web gallery afterwards, pass your Google account email as `authorEmail` — that's the key the web UI filters on.

## What I Built and Why

A small "hub" where people on a team publish AI-generated artifacts (HTML mockups, images, PDFs, notes), have them tagged and described for free, receive structured feedback, and share them outside the team via time-boxed links. The smallest thing that still demonstrates the full loop a coaching/AI-content team would care about: **produce → publish → review → share**.

Product decisions:

- **Upload anything, but treat HTML/image/PDF as first-class** — mockups and diagrams are the artifacts we actually want to eyeball inline. Other types degrade to download.
- **AI-generated metadata by default** — typing a title is the only required work. Description and tags are inferred from the content at upload time. Users can override, but defaults are sensible enough that nobody does.
- **Feedback lives inline with the artifact, not in a side channel** — reviews are in the DB, not in Slack/Teams threads that vanish. A "summarize feedback" button condenses long discussions into a paragraph on demand.
- **Sharing via signed tokens with TTL + view cap** — no account system required for external reviewers. Links expire; optional hard cap on views.
- **Google sign-in with strict per-user scoping** — the gallery, detail pages, and API responses are filtered to the signed-in user's email. Nothing of anyone else's is reachable without a share link.
- **Every upload runs a three-layer check** — 10 MB cap, MIME/magic-byte/executable sniffing, and optional VirusTotal scan. Designed so the free tier is useful *and* a VT key can be added without code changes. See "Uploads & Security".
- **MCP as a thin adapter, not a second implementation** — the publish path goes through the web service's REST API so there's one disk writer; the read tools hit shared Postgres directly so Claude Desktop and the web UI observe the same data.

## What I Chose Not to Build and Why

- **Real object storage.** Uploads sit on a Render persistent disk (5 GB mounted at `/var/data`) rather than S3/Azure Blob. Durable across deploys but single-region and coupled to one Render service. First thing to swap for a production deployment.
- **Threading/reply structure for feedback.** The schema has a nullable `parent_id` column so replies are possible, but the UI and API only render a flat list.
- **Versioning / "v2 of this mockup".** Each publish is a new row. No relationship between iterations.
- **Server-side HTML sanitization with DOMPurify.** Executables and MIME-mismatched content are already rejected at ingest, and HTML artifacts render inside a sandboxed iframe (`sandbox="allow-scripts allow-same-origin"`). A fully untrusted deploy would still want DOMPurify on ingest so we can drop `allow-scripts`.
- **Notifications.** No emails / webhooks when feedback lands on your artifact.
- **Per-user MCP API keys.** Today the MCP service uses one shared `ARTIFACT_HUB_API_KEY` and trusts whatever `authorEmail` the caller sends. Demo-grade; see "Next Week".

## Architecture Overview

Two Render services over one data layer:

```
┌─────────────────────────┐          ┌─────────────────────────┐
│ artifact-hub            │          │ artifact-hub-mcp        │
│ Next.js 16 App Router   │          │ Standalone MCP server   │
│ UI + REST API           │◀─────────│ (Express + SDK)         │
│ Google sign-in + API-key│  fetch   │ on write                │
│ :10000  (Render PORT)   │──────────▶                         │
└──────────┬──────────────┘          └──────────┬──────────────┘
           │                                    │
           ▼                                    ▼
   ┌───────────────┐                  ┌─────────────────────┐
   │ Render disk   │                  │ Shared Postgres     │
   │ /var/data     │                  │ hub_* tables        │
   │ (uploads)     │                  │ (direct reads from  │
   │               │                  │  both services)     │
   └───────────────┘                  └─────────────────────┘
```

Key pieces:

- **Next.js App Router** — pages under `src/app/*/page.tsx`, REST endpoints under `src/app/api/*/route.ts`. Tailwind v4 with a semantic token palette (`canvas`/`panel`/`edge`/`ink`/`accent`) in `@theme`.
- **Auth.js v5 (next-auth@beta)** — Google provider, JWT cookie sessions (no session DB tables). `middleware.ts` redirects unauthenticated browser traffic to a custom `/signin` welcome screen and returns `401` for unauthenticated API calls. Whitelisted public paths: `/api/auth`, `/api/share/:token`, `/api/feedback`, `/api/artifacts/:id/file`, `/share/:token`, `/faq`, `/signin`.
- **MCP server** (`src/mcp-server/index.ts`) — a separate Node process running Express + `@modelcontextprotocol/sdk`'s stateless StreamableHTTP transport. Each POST to `/mcp` builds a fresh `McpServer` + transport pair (SDK requirement). For read-only tools it imports `db`, `lib/ai`, `lib/share` directly; the one write tool (`publish_artifact`) POSTs to `https://artifact-hub.onrender.com/api/artifacts` with an `x-api-key` header so the web service stays the sole owner of the uploads disk.
- **Drizzle + postgres-js** — three tables, all prefixed `hub_` (`hub_artifacts`, `hub_feedback`, `hub_share_links`). `db/index.ts` returns a lazy Proxy singleton so the connection only opens on first use.
- **Anthropic SDK** — Claude Sonnet for tag generation, description generation, and feedback summarization. AI calls wrapped in try/catch so an API hiccup never blocks a publish.
- **Filesystem storage** — files written under `UPLOAD_DIR` (`/var/data` on Render) by uuid filename. The DB stores both the uuid (lookup key) and original filename (for `Content-Disposition: filename=...` on download).

Shared Postgres DB constraint: the local dev DB (`eh_local_3.0`) is shared with another project. `drizzle-kit push` doesn't handle that cleanly (tries to drop sequences it doesn't own), so the workflow is `db:generate` → review SQL → `db:migrate`, with the initial migration baselined in `drizzle.__drizzle_migrations`. Migrations are auto-applied on production via the `prestart` npm hook. See `CLAUDE.md` for details.

## How the MCP Integration Works

The MCP server is its own executable and its own Render service — `src/mcp-server/index.ts`, started with `npx tsx src/mcp-server/index.ts`. On every POST to `/mcp` it builds a fresh `McpServer` + `StreamableHTTPServerTransport` pair, registers seven tools on it, and tears both down when the response closes.

| Tool | Path | What it does |
|---|---|---|
| `publish_artifact` | POSTs to web `/api/artifacts` with `x-api-key` | Claude Sonnet generates tags + description if caller left them empty, the web service validates & scans the file, writes it to the shared Render disk, and returns the artifact. |
| `get_artifact` | Postgres direct | Metadata + size + URL for one artifact ID. |
| `search_artifacts` | Postgres direct | `ilike` over title/description plus optional tag filter. |
| `add_feedback` | Postgres direct | Insert one feedback row with optional 1–5 rating. |
| `summarize_feedback` | Postgres direct + Anthropic | Pulls all feedback for an artifact, asks Claude for a 2–4 sentence summary. |
| `create_share_link` | Postgres direct | nanoid(21) token with TTL + optional view cap. |
| `list_my_artifacts` | Postgres direct | Filter by `author_email`. |

Each tool is defined with a Zod schema for input validation and returns MCP `content` blocks — plain text with embedded URLs that point back at the web UI, so "publish this for me" ends with a clickable link the user opens in a browser.

**Auth.** The MCP service shares a single `ARTIFACT_HUB_API_KEY` with the web service. `middleware.ts` on the web side treats a matching `x-api-key` header as an auth bypass, so MCP-sourced uploads don't need a Google session. In exchange, any API-key holder can publish as any `authorEmail` — acceptable for this challenge, upgraded to per-user keys in "Next Week".

**Linking MCP uploads to the web gallery.** The gallery filters by `session.user.email`. To have MCP uploads show up after you sign in, pass your Google email as the `authorEmail` argument on `publish_artifact`.

## Where and Why I Used LLM Capabilities

All three uses are **tool-loop-free single-turn completions** against Claude Sonnet. For metadata tasks a single tight completion is cheaper, faster, and more predictable than an agentic loop.

1. **Tag generation (`generateTags`)** — at upload time, given title + first 2000 chars, Claude returns a JSON array of 3-6 lowercase tags. Parsed with a regex (`/\[[\s\S]*\]/`) to avoid hallucinated prose around the JSON.
2. **Description generation (`generateDescription`)** — 1-2 sentence summary of what the artifact is. Populated when the user left the field blank.
3. **Feedback summarization (`summarizeFeedback`)** — on demand, when there are ≥2 feedback entries. Formats the rows into numbered lines with ratings, asks for consensus/disagreement/actionable suggestions. User triggers this from the UI; it's not automatic.

LLM outputs never block the write path. If the Anthropic API is down, publish still succeeds with empty tags and null description (cheap to backfill later).

## Uploads & Security

Every upload (UI or MCP) passes three layers before anything touches disk:

1. **Size cap of 10 MB.** Enforced in the browser so the UI rejects over-large files before streaming, and re-enforced at the route handler with a `413` response if the browser check is bypassed.
2. **Content validation** (`src/lib/file-validation.ts`). MIME allowlist (HTML, text/markdown, PDF, PNG/JPEG/GIF/WebP/SVG). Magic-byte match against the declared MIME — so a `.exe` renamed `.png` is rejected. PE, ELF, and Mach-O executable headers are always blocked regardless of declared MIME. The EICAR antivirus test string is rejected so you can smoke-test the pipeline with a harmless known-bad file.
3. **VirusTotal scan** (`src/lib/virus-scan.ts`) — optional, active when `VIRUSTOTAL_API_KEY` is set. Every upload is posted to VirusTotal's `/api/v3/files`, analysis is polled at `/api/v3/analyses/{id}` for up to 15 seconds, and anything with even one malicious or suspicious verdict is rejected. Timeout / missing key / upstream error falls through silently — VT is defense-in-depth on top of layers 1-2, not the primary gate.

HTML artifacts render in a sandboxed iframe (`sandbox="allow-scripts allow-same-origin"`), so embedded scripts can only touch the artifact's own origin. Server-side HTML sanitization with DOMPurify is the next step to drop `allow-scripts` entirely — see "Next Week".

## Deployment Approach

- **Web app → Render.com** as a web service connected to the GitHub repo.
  - Build: `npm install && npm run build`
  - Start: `npm start` — the `prestart` npm hook runs `npm run db:migrate` first, so Drizzle's additive migrations auto-apply on every deploy before Next.js begins serving.
  - 512 MB tier is enough for production (`next-server` idles at 120–180 MB). `next dev` + Turbopack spikes past the cap and OOMs — an earlier deploy was caught in that loop before switching to production mode.
- **MCP server → Render.com** as a second web service pointing at the same repo.
  - Build: `npm install`
  - Start: `npx tsx src/mcp-server/index.ts`
  - Reachable at https://artifact-hub-mcp.onrender.com/mcp.
- **Database** — Postgres. The challenge prompt assumes encrypted-at-rest Azure-managed Postgres; for this submission `DATABASE_URL` on Render points at whatever Postgres the Render service has access to (Render Postgres or external).
- **File storage** — local filesystem on a Render persistent disk (5 GB mounted at `/var/data`). Uploads survive redeploys but are pinned to one region and one service. First migration target in "Next Week".
- **Auth** — Auth.js v5 / Google OAuth. Callback redirect URI `https://artifact-hub.onrender.com/api/auth/callback/google` added in Google Cloud Console. `AUTH_SECRET` signs the JWT cookie. No users table — session is the JWT.
- **CI/CD** — GitHub → Render's built-in auto-deploy on push to `main`. Both services deploy independently from the same branch.

## What I'd Do Next with Another Week

1. **Replace filesystem storage with Azure Blob / S3** (1 day). Abstract `saveFile`/`readFile`/`readFile` to an interface, implement an object-storage adapter, leave FS adapter for local dev. Removes the Render-disk single-region coupling and lets the MCP service (or any future worker) write directly without needing to proxy through the web API.
2. **Versioning / "v2 of this mockup"** (1-2 days). Add `parent_artifact_id` on `hub_artifacts`, render a version chooser on the detail page. This is the feature that makes the hub useful for iteration, not just archival.
3. **Server-side HTML sanitization with DOMPurify** (0.5 day). On ingest for `type=html` artifacts. Lets us drop `allow-scripts` from the iframe sandbox for user-submitted content.
4. **Embeddings-based search** (1-2 days). Swap the `ILIKE` title/description search for a `pgvector` similarity search over artifact content, keep tag filter as a boolean clause. Much better discovery when the hub has hundreds of artifacts.
5. **Per-user MCP API keys** (0.5 day). Today the MCP service shares one static `ARTIFACT_HUB_API_KEY` with the web service and trusts whatever `authorEmail` the caller sends — demo-grade, and anyone with the shared key can publish as anyone. Next step: a `hub_api_keys` table (`user_email`, hashed key, label, created/last-used timestamps), a settings page where each signed-in user generates and revokes their own key, and a web-side middleware change so the key (not an `authorEmail` form field) determines the artifact's owner. Unblocks safe multi-tenant MCP use without waiting for full MCP-OAuth support in Claude Desktop.
6. **Notifications** (1 day). Email / Slack webhook when feedback lands on an artifact you own. `hub_artifacts.author_email` is already a verified Google identity, so this is a straightforward SendGrid / Resend integration.
7. **Async VirusTotal** (0.5 day). Today VT is in the hot path with a 15 s timeout. Move it to a background scan with a `scan_status` enum on `hub_artifacts` and hide not-yet-clean uploads from the gallery. Gets the 15 s out of the publish latency.

## Walkthrough

1. **Open the web app** — https://artifact-hub.onrender.com. You'll be redirected to the welcome screen at `/signin`.
2. **Sign in with Google.** Click the button, consent, land back on the gallery (empty on first sign-in for a new email).
3. **Publish an artifact**
   - Click **Publish** in the header.
   - Pick a file (e.g. an HTML mockup). Fill in title only. Leave description + tags empty.
   - Click **Publish Artifact** — the upload runs size + MIME + magic-byte + (optional) VirusTotal checks, then triggers two Anthropic calls in parallel (tags + description), then redirects to the artifact detail page.
   - Observe that the description and 3-6 tags were filled in automatically.
4. **View an artifact** — the detail page renders HTML inline via sandboxed iframe; images render natively; PDFs render via iframe; other types show a download button.
5. **Leave feedback** — scroll to the feedback section. Submit 2-3 pieces of feedback (name, text, optional 1-5 rating).
6. **Summarize feedback** — once ≥2 pieces exist, the **AI Summary** button appears. Click → Anthropic produces a 2-4 sentence summary highlighting consensus/disagreement/actionable points.
7. **Share** — click **Share**, pick a TTL (default 48h), optionally a max-views cap. Open the returned link in an incognito tab to confirm the shared view works without a Google account.
8. **Publish from Claude Desktop via MCP** — register the MCP endpoint in Claude Desktop's config (see "Links" → Claude Desktop MCP config), restart. In a Claude Desktop chat: *"Using the artifact-hub MCP server, publish a short HTML greeting from me at <your-google-email>."* — Claude calls `publish_artifact`, which forwards the file to the web service (still enforcing all three upload-check layers), returns the web URL, and the artifact appears in your web gallery.
9. **Smoke-test the upload-validation pipeline** — upload a file containing the literal string `X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*`. The request is rejected with "EICAR antivirus test pattern detected" even without a VT key. Also try renaming `cmd.exe` to `image.png` — the PE header check rejects it.

## Claude Code Session Logs

See `claude-sessions/` at the repo root for saved transcripts of the Claude Code sessions that produced this codebase.
