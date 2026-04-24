# Release Notes

## v1.0.0 — Artifact Hub (2026-04-24)

First public release. Ships the full **produce → publish → review → share** loop for AI-generated artifacts, with both a web UI and an MCP server as equal-citizen clients.

### Highlights

- **Publish** HTML mockups, images, PDFs, text, or Markdown — up to 10 MB.
- **Claude auto-generates** a description and 3–6 tags at upload time.
- **Review** with inline feedback and on-demand AI summarization.
- **Share** via time-boxed links with optional view caps; no recipient account needed.
- **Publish from Claude Desktop** over MCP with a personal access token — your Google identity flows through automatically.

---

### Identity & access

- **Google sign-in** via Auth.js v5 (JWT cookie sessions, no extra DB tables). Your Google email is the single source of truth for artifact ownership.
- **Personal access tokens** for MCP clients. Generate at **Settings → Access tokens**, paste once into Claude Desktop's config under `x-api-key` — every subsequent tool call is automatically attributed to your account. Tokens are SHA-256 hashed server-side (raw value shown once), labelled, and individually revocable.
- Per-user scoping: gallery, detail pages, and all write APIs filter by the caller's email. An artifact is only visible outside your account when you explicitly create a share link.

### MCP integration

- **StreamableHTTP transport** at `https://artifact-hub-mcp.onrender.com/mcp`.
- **Seven tools:** `publish_artifact`, `search_artifacts`, `get_artifact`, `list_my_artifacts`, `add_feedback`, `summarize_feedback`, `create_share_link`.
- Write path (`publish_artifact`) POSTs to the web service's REST API so the web app stays the sole owner of the uploads disk; read tools query Postgres directly for low latency.
- Fresh `McpServer` + transport per request (stateless mode), so multiple Claude Desktop sessions don't collide.

### Upload validation (three layers)

1. **Size cap of 10 MB** — enforced browser-side before streaming, re-enforced server-side with HTTP 413.
2. **Content validation** (`src/lib/file-validation.ts`) — MIME allowlist · magic-byte match against declared MIME (rejects renamed executables) · PE/ELF/Mach-O header block · EICAR antivirus test string block.
3. **VirusTotal scan** (optional; activates when `VIRUSTOTAL_API_KEY` is set) — synchronous upload to `/api/v3/files`, result polled for up to 15 s, rejected on any malicious or suspicious verdict. Falls through silently on missing key, timeout, or upstream error.

### AI features (single-turn Anthropic Claude Sonnet calls)

- **Tag generation** at upload — title + first 2000 chars → 3–6 lowercase tags.
- **Description generation** at upload — 1–2 sentence summary.
- **Feedback summarization** on demand — consensus / disagreement / actionable suggestions from all feedback on an artifact.

AI never blocks the write path: any API failure falls back to empty tags / null description and the upload proceeds.

### Artifact lifecycle

- **Edit** inline — title, description, tags (file is immutable). Confirm-on-save.
- **Delete** with a confirm dialog. Feedback and share links cascade automatically.
- **Share** — nanoid(21) token, TTL 1 h – 30 days, optional view cap. Public viewers can read and leave feedback, never see other artifacts.

### Previews

- **HTML** — sandboxed iframe on the detail page; scaled-down live thumbnail in gallery cards, strict-sandboxed (no scripts, no same-origin).
- **Images** — native rendering on detail page, `object-cover` thumbnail in gallery.
- **PDF** — pdf.js-based viewer renders every page inline (canvas), works on iOS / Android where native iframe rendering fails.
- **Other** — download button.

### UI

- Dark palette adapted from the project's 11-slide presentation deck (`#0b0d10` canvas, `#ff7a45` accent, sky-blue secondary for card headings). Inter + Space Grotesk + JetBrains Mono via `next/font`.
- **Landing page** at `/signin` with hero, sign-in card, product-decision cards, and links to the FAQ, the deck, and GitHub.
- **FAQ** page at `/faq` (publicly readable) covering privacy, sharing, upload checks, AI usage, edit/delete, and MCP tokens.
- **Presentation deck** at `/presentation.html` — 11 slides, keyboard / trackpad / touch-swipe navigation, mobile-responsive.
- **Fully mobile-responsive** across gallery, detail page, share page, upload form, settings, deck, and landing. Action rows stack, meta rows wrap with ellipsised email, PDF viewer caps at 75 vh on phones, SignInButton collapses labels to icons under `sm`.

### Infrastructure

- **Two Render services** auto-deployed from `main`:
  - `artifact-hub` — Next.js 16 in production mode (`next start`). Build: `npm install && npm run build`. Start: `npm start`. 512 MB tier; steady ~120–180 MB.
  - `artifact-hub-mcp` — `npx tsx src/mcp-server/index.ts`.
- **Persistent disk** mounted at `/var/data` on the web service for upload storage. Durable across deploys.
- **Auto-migrations** — `prestart` npm hook runs `npm run db:migrate` before `next start`. Drizzle's migrator applies only new SQL files tracked in `drizzle.__drizzle_migrations`; additive DDL only, never destructive.

### Data model

Four tables, all prefixed `hub_` (shared-schema safe):

- `hub_artifacts` — id, title, type enum, file_path, tags[], author_email, timestamps.
- `hub_feedback` — artifact_id FK cascade, author_name, content, rating (1–5), parent_id (reserved for threads).
- `hub_share_links` — token unique, expires_at, max_views, view_count.
- `hub_api_keys` — user_email, key_hash (SHA-256), key_preview, label, created/last-used.

### Developer experience

- **Auto-migrate on deploy** via the `prestart` hook (liquibase-style).
- **`db:generate` + `db:migrate` workflow** only — `db:push` is banned because it drops sequences owned by other projects in the shared dev Postgres. `tablesFilter: ["hub_*"]` scopes drizzle-kit introspection.
- **`.env` auto-loader** in `src/db/migrate.ts` so migrations work locally without `tsx --env-file` and on platforms where env vars are injected.
- **`CLAUDE.md`** documents the architecture, auth model, and DB gotchas for future Claude sessions.

---

## Known gaps (see WRITEUP § Next Week)

- Uploads live on a Render persistent disk — not S3 / Azure Blob yet.
- HTML artifacts render in a sandboxed iframe (`allow-scripts allow-same-origin`) but are not sanitized with DOMPurify on ingest.
- No versioning (`parent_artifact_id`) or feedback replies — schema supports replies via `parent_id`, UI does not.
- VirusTotal scan is synchronous (15 s hot path) — could be async.
- No email / Slack notifications on feedback.
- MCP-native OAuth (would remove the token-paste step) — pending Claude Desktop's uneven client support.

## Credits

Built by [Ihor Kruk](https://www.linkedin.com/in/ikruk). Engineering pair: Claude Code (Opus 4.7, 1M context).
