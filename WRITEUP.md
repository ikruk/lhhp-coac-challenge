# Artifact Hub — WRITEUP

## Links

- **Public URL:** https://artifact-hub.onrender.com
- **Source (GitHub):** https://github.com/ikruk/lhhp-coac-challenge
- **MCP endpoint:** `http://localhost:3001/mcp` when running `npm run mcp:dev` locally (not currently exposed publicly — see "Deployment Approach" for why).

### Claude Desktop MCP config

Run the MCP server locally against the same DB as the web app, then add this to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "artifact-hub": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

Start it with:

```bash
export DATABASE_URL="postgres://..."
export ANTHROPIC_API_KEY="sk-ant-..."
npm run mcp:dev
```

Restart Claude Desktop; the `publish_artifact`, `search_artifacts`, `get_artifact`, `add_feedback`, `summarize_feedback`, `create_share_link`, and `list_my_artifacts` tools become available.

## What I Built and Why

A small "hub" where people on a team publish AI-generated artifacts (HTML mockups, images, PDFs, notes), have them tagged and described for free, receive structured feedback, and share them outside the team via time-boxed links. It's the smallest thing that still demonstrates the full loop a coaching/AI-content team would care about: **produce → publish → review → share**.

Product decisions:

- **Upload anything, but treat HTML/image/PDF as first-class** — mockups and diagrams are the artifacts we actually want to eyeball inline. Other types degrade to download.
- **AI-generated metadata by default** — typing a title is the only required work. Description and tags are inferred from the content at upload time. Users can override, but defaults are sensible enough that nobody does.
- **Feedback lives inline with the artifact, not in a side channel** — reviews are in the DB, not in Slack/Teams threads that vanish. A "summarize feedback" button condenses long discussions into a paragraph on demand.
- **Sharing via signed tokens with TTL + view cap** — no account system required for external reviewers. Links expire; optional hard cap on views.
- **MCP as a peer to the REST API, not a layer on top** — so Claude Desktop and the web UI are genuinely equivalent clients, not one wrapping the other. See "How the MCP Integration Works."

## What I Chose Not to Build and Why

- **Auth / accounts.** Submissions are keyed by email string. A real deployment needs SSO/OIDC, but shipping that would have consumed most of the time budget for no signal on the architectural questions the challenge actually asks.
- **Real object storage.** Uploads go to a local `UPLOAD_DIR` on the filesystem, not S3/Azure Blob. Fine for the MVP; first thing to swap for a real deployment (Render's filesystem is ephemeral — see deployment section).
- **Threading/reply structure for feedback.** The schema has a nullable `parent_id` column so replies are possible, but the UI and API only render a flat list.
- **Richer artifact diffing/versioning.** Each publish is a new row. No "v2 of this mockup" concept.
- **MCP auth.** The MCP server accepts any client that can reach the port. Acceptable for local Claude Desktop; not acceptable for public deploy.
- **Notifications.** No emails / webhooks when feedback lands on your artifact.
- **Server-side HTML sanitization.** HTML artifacts render in a sandboxed iframe (`sandbox="allow-scripts allow-same-origin"`) but are not sanitized on ingest. Fine for trusted internal users; a public deploy would want DOMPurify server-side.

## Architecture Overview

Two cooperating services over one data layer:

```
┌─────────────────┐        ┌───────────────────────┐
│  Next.js 16     │        │  Standalone MCP       │
│  App Router     │        │  server (Express +    │
│  UI + REST API  │        │  @modelcontextprotocol│
│  :3000          │        │  streamableHttp)      │
│                 │        │  :3001                │
└────────┬────────┘        └─────────┬─────────────┘
         │                           │
         └──────────┬────────────────┘
                    ▼
         ┌──────────────────────────┐
         │ Shared modules           │
         │   src/db (Drizzle)       │
         │   src/lib/ai (Anthropic) │
         │   src/lib/storage (FS)   │
         │   src/lib/share (nanoid) │
         └──────────────────────────┘
                    │
           ┌────────┴────────┐
           ▼                 ▼
      Postgres          UPLOAD_DIR
      (hub_* tables)    (local FS)
```

Key pieces:

- **Next.js App Router** — pages under `src/app/*/page.tsx`, REST endpoints under `src/app/api/*/route.ts` (artifacts CRUD, feedback, share-token resolution, feedback summarize). Tailwind v4 with a small semantic token palette (`canvas`/`panel`/`edge`/`ink`/`accent`) in `@theme`.
- **MCP server** (`src/mcp-server/index.ts`) — a separate Node process running Express + `@modelcontextprotocol/sdk`'s StreamableHTTP transport. Imports the *same* `db`, `lib/storage`, `lib/ai`, `lib/share` modules as the Next app. No REST-wrapping; tools hit Drizzle directly.
- **Drizzle + postgres-js** — three tables, all prefixed `hub_` (`hub_artifacts`, `hub_feedback`, `hub_share_links`). `db/index.ts` returns a lazy Proxy singleton so the connection only opens on first use.
- **Anthropic SDK** — Claude Sonnet for tag generation, description generation, and feedback summarization. AI calls wrapped in try/catch so an API hiccup never blocks a publish.
- **Filesystem storage** — files written under `UPLOAD_DIR` by uuid filename. The DB stores both the uuid (lookup key) and original filename (for `Content-Disposition: filename=...` on download).

Shared Postgres DB constraint: the local DB (`eh_local_3.0`) is shared with another project. `drizzle-kit push` doesn't handle that well (tries to drop sequences it doesn't own), so the workflow is `db:generate` → review SQL → `db:migrate`, with the initial migration baselined in `drizzle.__drizzle_migrations`. See `CLAUDE.md` for details.

## How the MCP Integration Works

The MCP server is its own executable — `src/mcp-server/index.ts`, run via `npm run mcp:dev`. It instantiates `McpServer` from `@modelcontextprotocol/sdk`, registers seven tools, and mounts them on `POST /mcp` via the StreamableHTTP transport:

| Tool | What it does |
|---|---|
| `publish_artifact` | Write content + mime type → saves file, runs AI tag+description generation if not provided, inserts row, returns artifact id + web URL |
| `get_artifact` | Fetch artifact metadata + content by id |
| `search_artifacts` | Full-text ilike over title/description, optional tag filter |
| `add_feedback` | Insert feedback row; optional rating |
| `summarize_feedback` | Pull all feedback rows for an artifact, have Claude produce a 2-4 sentence summary |
| `create_share_link` | Generate a nanoid token with TTL + optional view cap |
| `list_my_artifacts` | Filter by `author_email` |

Each tool is defined with a Zod schema for input validation and returns MCP `content` blocks (plain text with embedded URLs pointing back at the web UI — so "publish this for me" ends with a clickable link the user opens in a browser).

Why a separate process instead of a Next.js route:

- Keeps the MCP transport concerns (StreamableHTTP, session handling) out of the Next runtime.
- Lets the same process be swapped to a **stdio transport** trivially (change 2 lines) when Claude Desktop lands somewhere that needs stdio instead of HTTP.
- Decouples scaling — MCP traffic patterns differ from human web traffic.

## Where and Why I Used LLM Capabilities

All three uses are **tool-loop-free single-turn completions** against Claude Sonnet. Rationale: the coaching-platform context suggests tool loops where needed, but for these metadata tasks a single tight completion is cheaper, faster, and more predictable.

1. **Tag generation (`generateTags`)** — at upload time, given title + first 2000 chars, Claude returns a JSON array of 3-6 lowercase tags. Parsed with a regex (`/\[[\s\S]*\]/`) to avoid hallucinated prose around the JSON.
2. **Description generation (`generateDescription`)** — 1-2 sentence summary of what the artifact is. Populated when the user left the field blank.
3. **Feedback summarization (`summarizeFeedback`)** — on demand, when there are ≥2 feedback entries. Formats the rows into numbered lines with ratings, asks for consensus/disagreement/actionable suggestions. User triggers this from the UI; it's not automatic.

LLM outputs never block the write path. If the Anthropic API is down, publish still succeeds with empty tags and null description (cheap to backfill later).

## Deployment Approach

- **Web app → Render.com** as a web service connected to the GitHub repo. Build command `npm install && npm run build`, start command `npm start`. The 512 MB tier is enough for production mode (`next-server` idles around 120-180 MB) but not for `next dev` + Turbopack (spikes past 400 MB on first compile → OOM restart loop). One of the earlier deploys ran `next dev` and was caught in exactly that loop before being switched to production mode.
- **Database** — Postgres. The challenge prompt assumes encrypted-at-rest Azure-managed Postgres; for this submission a local shared DB is used during development, and `DATABASE_URL` points at whatever Postgres the Render service has access to.
- **File storage** — currently local filesystem. **Not durable on Render** (ephemeral disk between deploys), so the hosted instance will lose uploads on every deploy. Replacing `src/lib/storage.ts` with an Azure Blob / S3 adapter is the first thing a real deployment needs.
- **MCP server** — not publicly deployed. Run it locally and point Claude Desktop at `http://localhost:3001/mcp`. A real deployment would put the MCP server on its own Render service (or a sidecar) with authenticated access; it's the same process, different entrypoint.
- **CI/CD** — GitHub → Render's built-in auto-deploy on push to `main`.

## What I'd Do Next with Another Week

1. **Replace filesystem storage with Azure Blob** (1 day). Abstract `saveFile`/`readFile` to an interface, implement a Blob adapter, leave FS adapter for local dev. Unblocks Render deploys surviving a redeploy.
2. **Deploy the MCP server publicly with auth** (1 day). Second Render service, API-key-per-reviewer, middleware-level rate limit. Lets external reviewers actually use the MCP tools from Claude Desktop without a local dev setup.
3. **Versioning / "v2 of this mockup"** (1-2 days). Add `parent_artifact_id` on `hub_artifacts`, render a version chooser on the detail page. This is the feature that makes the hub useful for iteration, not just archival.
4. **Server-side HTML sanitization** (0.5 day). DOMPurify on ingest for `type=html` artifacts. Lets us drop `allow-scripts` from the iframe sandbox for user-submitted content.
5. **Embeddings-based search** (1-2 days). Swap the `ILIKE` title/description search for a `pgvector` similarity search over artifact content, keep tag filter as a boolean clause. Much better discovery when the hub has hundreds of artifacts.
6. **Real auth** (1-2 days). EntraID / Teams SSO, tie `author_email` to a verified identity claim, gate edit/delete to the original author.

## Walkthrough

1. **Open the web app** — https://artifact-hub.onrender.com. Gallery is empty on first load; use the **Publish** button top-right.
2. **Publish an artifact**
   - Click **Publish**.
   - Pick a file (e.g. an HTML mockup). Fill in title only. Leave description + tags empty.
   - Click **Publish Artifact** — the upload triggers two Anthropic calls in parallel (tags + description) and redirects to the artifact detail page.
   - Observe that the description and 3-6 tags were filled in automatically.
3. **View an artifact** — the detail page renders HTML inline via sandboxed iframe; images render natively; PDFs render via iframe; other types show a download button.
4. **Leave feedback** — scroll to the feedback section. Submit 2-3 pieces of feedback (name, text, optional 1-5 rating).
5. **Summarize feedback** — once ≥2 pieces exist, the **AI Summary** button appears. Click → Anthropic produces a 2-4 sentence summary highlighting consensus/disagreement/actionable points.
6. **Share** — click **Share**, pick a TTL (default 48h), optionally a max-views cap, enter your email, get a copyable URL. Open it in an incognito tab to confirm the shared view works without auth.
7. **Publish the same artifact via MCP** — start the local MCP server (`npm run mcp:dev`), register the config in Claude Desktop, restart. In a Claude Desktop chat: *"Using the artifact-hub MCP server, publish a short HTML greeting from me at test@example.com."* — Claude calls `publish_artifact`, returns the web URL, and the artifact appears in the gallery.

## Claude Code Session Logs

See `claude-sessions/` at the repo root for saved transcripts of the Claude Code sessions that produced this codebase.
