# Artifact Hub

A small hub for publishing AI-generated artifacts (HTML mockups, images, PDFs, notes), auto-tagging and describing them with Claude, collecting structured feedback, and sharing them outside the team via time-boxed links — with first-class **MCP support** for Claude Desktop.

**Produce → publish → review → share.**

## Links

- **Web app:** https://artifact-hub.onrender.com
- **MCP endpoint:** https://artifact-hub-mcp.onrender.com/mcp
- **Source:** https://github.com/ikruk/lhhp-coac-challenge
- **Presentation deck:** [/presentation.html](https://artifact-hub.onrender.com/presentation.html) (11 slides, arrow / scroll / swipe)
- **FAQ:** [/faq](https://artifact-hub.onrender.com/faq)
- **Release notes:** [/releases](https://artifact-hub.onrender.com/releases)

## What's in the box

- **Next.js 16 App Router** + Tailwind v4 with a semantic token palette (orange accent + near-black canvas).
- **Google sign-in** (Auth.js v5, JWT cookie sessions). Artifacts are scoped to the signed-in user's email end-to-end.
- **Personal access tokens** for MCP clients — generate at `/settings/tokens`, paste once into Claude Desktop.
- **Drizzle + Postgres.** Four tables, all prefixed `hub_`; `drizzle-kit` migrations auto-applied on every deploy via a `prestart` npm hook.
- **Anthropic SDK.** Claude Sonnet generates artifact tags, descriptions, and on-demand feedback summaries.
- **Standalone MCP server.** Express + `@modelcontextprotocol/sdk` StreamableHTTP at `POST /mcp` with seven tools.
- **Upload validation.** 10 MB cap, MIME allowlist, magic-byte match, executable-header block, optional VirusTotal scan.
- **pdf.js inline rendering**, live HTML thumbnails in the gallery, sandboxed HTML rendering on the detail page.
- **Mobile-first responsive** across gallery, detail, share, upload, settings, landing, FAQ, releases, and the deck.

## Quick start (local dev)

### 1. Clone and install

```bash
git clone https://github.com/ikruk/lhhp-coac-challenge.git
cd lhhp-coac-challenge
npm install
```

### 2. Set up environment

Create `.env` at the repo root:

```env
# Required
DATABASE_URL=postgres://user:password@localhost:5432/your_db
ANTHROPIC_API_KEY=sk-ant-…
AUTH_SECRET=            # openssl rand -base64 32
AUTH_GOOGLE_ID=         # Google Cloud Console → OAuth 2.0 Web Client ID
AUTH_GOOGLE_SECRET=     # the matching client secret

# Optional
NEXT_PUBLIC_BASE_URL=http://localhost:3000
UPLOAD_DIR=./uploads
MCP_PORT=3001
VIRUSTOTAL_API_KEY=     # enables the third upload-scan layer
```

Authorized redirect URIs for your Google OAuth client must include:

- `http://localhost:3000/api/auth/callback/google`
- `https://your-prod-domain/api/auth/callback/google`

### 3. Run migrations

```bash
npm run db:migrate
```

Applies any pending files in `drizzle/` and records them in `drizzle.__drizzle_migrations`. See [CLAUDE.md § Database workflow](CLAUDE.md#database-workflow) for the full story on why we use generate+migrate (not `db:push`).

### 4. Start the web app

```bash
npm run dev
```

Open http://localhost:3000. You'll be redirected to `/signin` — sign in with Google.

### 5. Start the MCP server (optional, in another terminal)

```bash
npm run mcp:dev
```

Listens on `MCP_PORT` (default `3001`). Configure Claude Desktop to point at `http://localhost:3001/mcp` with a personal access token (see below).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server on :3000 (Turbopack). Loads `.env`. |
| `npm run build` / `npm start` | Production build + serve. `prestart` auto-runs migrations. |
| `npm run lint` | ESLint (flat config in `eslint.config.mjs`). |
| `npm run db:generate` | Writes a new SQL migration under `drizzle/` from `src/db/schema.ts`. |
| `npm run db:migrate` | Applies pending migrations (auto-loads `.env`). |
| `npm run mcp:dev` | Runs the standalone MCP server on :3001 via `tsx`. |
| `npm run mcp:start` | Same as `mcp:dev`, used as the Render start command. |

**Don't use `npm run db:push`** — see [CLAUDE.md § Database workflow](CLAUDE.md#database-workflow).

## MCP setup (Claude Desktop)

1. Sign into the web app with Google.
2. Open **Settings → Access tokens** (link in the header after sign-in).
3. Generate a token, give it a label, copy the raw value (shown once).
4. Edit Claude Desktop's config:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "artifact-hub": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://artifact-hub-mcp.onrender.com/mcp",
        "--header",
        "x-api-key:ak_…"
      ]
    }
  }
}
```

Restart Claude Desktop. Seven tools become available: `publish_artifact`, `search_artifacts`, `get_artifact`, `list_my_artifacts`, `add_feedback`, `summarize_feedback`, `create_share_link`. No `authorEmail` argument anywhere — the token *is* the identity.

## Architecture (30-second tour)

```
┌─────────────────────────┐          ┌─────────────────────────┐
│ artifact-hub            │          │ artifact-hub-mcp        │
│ Next.js 16 App Router   │◀─────────│ Standalone MCP server   │
│ UI + REST API           │  fetch   │ (Express + SDK)         │
│ Google sign-in          │  on      │ Resolves x-api-key to   │
│                         │  write   │ an owner email          │
└──────────┬──────────────┘          └──────────┬──────────────┘
           │                                    │
           ▼                                    ▼
   ┌───────────────┐                  ┌─────────────────────┐
   │ Render disk   │                  │ Postgres            │
   │ /var/data     │                  │ hub_* tables        │
   │ (uploads)     │                  │ (both services read)│
   └───────────────┘                  └─────────────────────┘
```

- Web service is the single writer of the uploads disk.
- MCP `publish_artifact` POSTs to the web service's `/api/artifacts` with the caller's `x-api-key` so identity propagates.
- Read tools (`search`, `get`, `list`, etc.) hit Postgres directly.

More detail: [WRITEUP.md § Architecture](WRITEUP.md) and [CLAUDE.md § Architecture](CLAUDE.md#architecture).

## Data model

Four tables, all prefixed `hub_`:

| Table | Purpose |
|---|---|
| `hub_artifacts` | id, title, type enum, file_path, tags[], author_email, timestamps |
| `hub_feedback` | artifact_id FK cascade, author_name, content, rating, parent_id |
| `hub_share_links` | token (nanoid 21), expires_at, max_views, view_count |
| `hub_api_keys` | user_email, key_hash (SHA-256), key_preview, label, created/last-used |

## Upload pipeline

Every upload (web UI or MCP) passes three layers before anything touches disk:

1. **Size cap of 10 MB** — enforced in the browser before streaming and again server-side (HTTP 413).
2. **Content validation** (`src/lib/file-validation.ts`) — MIME allowlist, magic-byte match against declared MIME (rejects renamed executables), PE/ELF/Mach-O header block, EICAR test-string block.
3. **VirusTotal scan** (optional; `VIRUSTOTAL_API_KEY` required) — synchronous upload + polling with a 15 s timeout. Rejects on any malicious/suspicious verdict. Falls through silently on missing key or timeout.

## Deployment

Two Render services auto-deploy from `main`:

| Service | Build | Start |
|---|---|---|
| `artifact-hub` (web) | `npm install && npm run build` | `npm start` |
| `artifact-hub-mcp` | `npm install` | `npx tsx src/mcp-server/index.ts` |

Uploads live on a 5 GB Render persistent disk at `/var/data`. Migrations auto-apply via the `prestart` hook.

Full details: [WRITEUP.md § Deployment](WRITEUP.md).

## Project structure

```
src/
  app/                     # Next.js App Router
    api/
      artifacts/           # CRUD + file serve
      auth/[...nextauth]/  # Auth.js handler
      feedback/            # add feedback + summarize
      share/               # create share link + resolve by token
      tokens/              # create / list / revoke personal access tokens
    artifacts/[id]         # artifact detail (edit/delete/share/download)
    artifacts/new          # upload form
    faq                    # public FAQ
    releases               # public release notes (renders RELEASE_NOTES.md)
    settings/tokens        # token management
    share/[token]          # public share view
    signin                 # landing + Google sign-in
    page.tsx               # gallery
    layout.tsx             # session provider + footer
  components/              # UI components
  db/                      # Drizzle schema + migrator
  lib/
    ai.ts                  # Anthropic calls (tags / description / summary)
    auth-helpers.ts        # unified session-or-token auth for route handlers
    file-validation.ts     # size + MIME + magic-byte + EICAR + exec block
    virus-scan.ts          # optional VirusTotal scan
    share.ts               # nanoid tokens with TTL + view cap
    storage.ts             # filesystem adapter under UPLOAD_DIR
    tokens.ts              # personal access token mint / hash / resolve
  mcp-server/
    index.ts               # standalone MCP HTTP server
  auth.ts                  # Auth.js v5 config
middleware.ts              # session / token / public-route gate
drizzle/                   # generated SQL migrations + meta/_journal.json
public/
  presentation.html        # standalone 11-slide overview
```

## Docs map

| Doc | Covers |
|---|---|
| [README.md](README.md) | You are here — setup, scripts, MCP config, quick tour |
| [CLAUDE.md](CLAUDE.md) | Architecture + DB workflow for future AI sessions |
| [WRITEUP.md](WRITEUP.md) | Challenge-deliverable writeup: product decisions, architecture, LLM usage, deployment, next steps, walkthrough |
| [RELEASE_NOTES.md](RELEASE_NOTES.md) | v1.0.0 changelog, also served at `/releases` |
| [FAQ (`/faq`)](https://artifact-hub.onrender.com/faq) | User-facing FAQ (privacy, sharing, uploads, MCP tokens, edit/delete) |
| [AGENTS.md](AGENTS.md) | Warning about Next.js 16 being off the training distribution |

## License

Private — LHHP-COAC challenge submission. Not licensed for external reuse.

## Credits

Built by [Ihor Kruk](https://www.linkedin.com/in/ikruk). Engineering pair: Claude Code (Opus 4.7, 1M context).
