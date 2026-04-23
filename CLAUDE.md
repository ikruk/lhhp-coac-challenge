# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — Next.js dev server (Turbopack) on :3000. Loads `.env`.
- `npm run build` / `npm start` — production build + serve. Use this on Render (see "Deployment").
- `npm run db:generate` — writes a new SQL migration under `drizzle/` from `src/db/schema.ts`.
- `npm run db:migrate` — applies pending migrations. Auto-loads `.env` via `tsx --env-file`.
- `npm run mcp:dev` — runs the standalone MCP HTTP server on :3001 (via `tsx`). **Does not auto-load `.env`** — export env vars in the shell first.
- **Do NOT run `npm run db:push`.** See "Database workflow".

## Architecture

The app is two cooperating services against one data layer:

- **Next.js App Router UI + REST** (`src/app/`) — pages under `src/app/*/page.tsx`; route handlers under `src/app/api/*/route.ts` (artifacts CRUD, feedback, share-link creation, share-token resolution, feedback summarize).
- **Standalone MCP server** (`src/mcp-server/index.ts`) — Express + `@modelcontextprotocol/sdk` StreamableHTTP at `POST /mcp`. Exposes the same capabilities as the REST API as MCP tools (`publish_artifact`, `search_artifacts`, `add_feedback`, `summarize_feedback`, `create_share_link`, …). It imports `db`, `lib/storage`, `lib/ai`, `lib/share` directly — changes in those modules affect both entrypoints.

Shared modules:
- `src/db/index.ts` — lazy Drizzle singleton over `postgres-js`. The exported `db` is a Proxy; the connection is created on first property access. `postgres` is configured with `{ prepare: false }`.
- `src/lib/ai.ts` — Anthropic SDK (`new Anthropic()` reads `ANTHROPIC_API_KEY`). Generates artifact tags, descriptions, and feedback summaries. Failures are swallowed at call sites so AI outages don't block publish/upload.
- `src/lib/storage.ts` — local filesystem storage at `UPLOAD_DIR` (default `./uploads`). Only a generated uuid filename is persisted in the DB; original filename is kept separately.
- `src/lib/file-validation.ts` — runs on every upload before the file hits disk. Enforces the 10 MB size cap, MIME allowlist, magic-byte match against declared MIME (rejects renamed executables), PE/ELF/Mach-O header block, and the EICAR test-string block.
- `src/lib/virus-scan.ts` — optional VirusTotal integration. When `VIRUSTOTAL_API_KEY` is set, each upload is posted to VirusTotal's `/files` endpoint and the verdict polled for up to 15 s; any `malicious`/`suspicious` count rejects. No-key / timeout falls through silently — file-validation remains authoritative.
- `src/lib/share.ts` — nanoid(21) share tokens; `validateShareToken` both checks TTL + `max_views` cap and increments `view_count` on each valid hit.
- `src/lib/tokens.ts` — personal access tokens for MCP clients. `generateRawToken()` mints `ak_<32-byte-base64url>`, `hashToken()` is sha256, `resolveTokenToUser()` does the `hub_api_keys` lookup and bumps `last_used_at`.
- `src/lib/auth-helpers.ts` — `getAuthedUser(req)` tries `x-api-key` → `resolveTokenToUser`, falls back to the Google session. Every API route that needs "who is calling" goes through this.

## Data model

All tables are prefixed `hub_` (this is load-bearing — see "Database workflow"):

- `hub_artifacts` — id uuid, title, type enum, file_path, tags text[], author_email, created/updated
- `hub_feedback` — id, artifact_id FK (cascade), author_name, content, rating, parent_id
- `hub_share_links` — id, artifact_id FK (cascade), token unique, expires_at, max_views, view_count
- `hub_api_keys` — id, user_email, key_hash (unique), key_preview, label, created_at, last_used_at

Enum: `hub_artifact_type = 'html' | 'image' | 'pdf' | 'other'`.

## Database workflow

The local Postgres `eh_local_3.0` is **shared with another project** (unrelated `blc_*` tables and their sequences live in the same `public` schema). This constrains the tooling:

1. **Never use `drizzle-kit push`.** In drizzle-kit 0.31.10, `tablesFilter` scopes table-level diffs but *not* sequence cleanup — push will emit `DROP SEQUENCE` for objects owned by the other project. Postgres refuses (FK dependency), so no data is lost, but the workflow is dead-ended. Use generate+migrate instead.
2. **New tables must be `hub_`-prefixed.** `drizzle.config.ts` has `tablesFilter: ["hub_*"]` so introspection stays scoped to our tables.

Flow:
```
edit src/db/schema.ts
npm run db:generate        # writes drizzle/NNNN_*.sql + updates drizzle/meta/
# review the SQL
npm run db:migrate         # applies via drizzle.__drizzle_migrations
```

The initial migration `drizzle/0000_tense_randall_flagg.sql` is **baselined** — a row is already inserted in `drizzle.__drizzle_migrations` matching its SHA-256, because the tables were created by a prior `db:push` before the migrator workflow was adopted. A fresh clone against an already-populated DB will see `db:migrate` as a no-op; a fresh DB will need that baseline row deleted (or the tables dropped and the migration allowed to apply normally).

## Environment

See `.env` (gitignored). Required: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. Optional: `NEXT_PUBLIC_BASE_URL`, `AUTH_URL`, `UPLOAD_DIR`, `MCP_PORT`, `VIRUSTOTAL_API_KEY` (enables VT scan of uploads). `ARTIFACT_HUB_API_KEY` is no longer used — per-user tokens stored in `hub_api_keys` replaced the static shared secret.

## Deployment (Render)

Service: `artifact-hub` at `artifact-hub.onrender.com` (whitelisted in `next.config.ts` → `allowedDevOrigins`).

The current tier caps memory at **512 MB**. `next dev` + Turbopack spikes past that on first-compile → OOM → restart loop. The service must run in production mode:

- Build command: `npm install && npm run build`
- Start command: `npm start`

`next start` sits around 120–180 MB steady, which fits.
