"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TokenRow {
  id: string;
  label: string;
  keyPreview: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [revealedLabel, setRevealedLabel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tokens");
    if (res.ok) {
      const data = await res.json();
      setTokens(data.tokens ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create token");
      setCreating(false);
      return;
    }
    const data = await res.json();
    setRevealedToken(data.raw);
    setRevealedLabel(data.token.label);
    setLabel("");
    setCreating(false);
    await load();
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this token? Any client using it will stop working.")) {
      return;
    }
    await fetch(`/api/tokens/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleCopy() {
    if (!revealedToken) return;
    await navigator.clipboard.writeText(revealedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass =
    "w-full px-3 py-2 bg-panel-raised border border-edge-strong rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring transition";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/70 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="text-sm text-ink-faint hover:text-ink-muted mb-2 inline-block"
          >
            &larr; Back to gallery
          </Link>
          <h1 className="text-2xl font-medium tracking-tight text-ink">
            Access tokens
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Personal tokens that identify you to the MCP server. Paste one into
            Claude Desktop&apos;s config; after that you don&apos;t have to pass
            your email on every call.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {revealedToken && (
          <div className="bg-panel border border-accent/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-medium text-ink">
                Token created
                {revealedLabel ? ` — ${revealedLabel}` : ""}
              </h2>
              <button
                onClick={() => setRevealedToken(null)}
                className="text-xs text-ink-faint hover:text-ink"
              >
                Dismiss
              </button>
            </div>
            <p className="text-sm text-ink-muted">
              This is the only time the full token is shown. Copy it now —
              after you dismiss this panel, only the preview remains.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-panel-raised border border-edge rounded-lg text-xs font-mono text-ink break-all">
                {revealedToken}
              </code>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <details className="text-sm text-ink-muted">
              <summary className="cursor-pointer hover:text-ink">
                Claude Desktop config snippet
              </summary>
              <pre className="mt-2 p-3 bg-panel-raised border border-edge rounded-lg text-xs font-mono overflow-x-auto text-ink-muted">
{`{
  "mcpServers": {
    "artifact-hub": {
      "url": "https://artifact-hub-mcp.onrender.com/mcp",
      "headers": { "x-api-key": "${revealedToken}" }
    }
  }
}`}
              </pre>
            </details>
          </div>
        )}

        <form
          onSubmit={handleCreate}
          className="bg-panel border border-edge rounded-2xl p-5 space-y-3"
        >
          <h2 className="font-display font-medium text-ink">Create a token</h2>
          {error && (
            <div className="p-3 bg-bad/10 border border-bad/40 rounded-lg text-sm text-bad">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs text-ink-faint mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. MacBook Claude Desktop"
              className={inputClass}
              maxLength={80}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !label.trim()}
              className="px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors disabled:opacity-50"
            >
              {creating ? "Generating…" : "Generate token"}
            </button>
          </div>
        </form>

        <section className="bg-panel border border-edge rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-edge">
            <h2 className="font-display font-medium text-ink">Your tokens</h2>
          </div>
          {loading ? (
            <div className="p-5 text-sm text-ink-faint">Loading…</div>
          ) : tokens.length === 0 ? (
            <div className="p-5 text-sm text-ink-faint">
              No tokens yet. Generate one above to get started.
            </div>
          ) : (
            <ul className="divide-y divide-edge">
              {tokens.map((t) => (
                <li
                  key={t.id}
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-ink font-medium truncate">
                      {t.label}
                    </div>
                    <div className="text-xs text-ink-faint mt-1 flex flex-wrap gap-2">
                      <code className="font-mono">{t.keyPreview}</code>
                      <span>•</span>
                      <span>
                        created{" "}
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>
                        {t.lastUsedAt
                          ? `last used ${new Date(
                              t.lastUsedAt
                            ).toLocaleDateString()}`
                          : "never used"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(t.id)}
                    className="px-3 py-1.5 border border-bad/40 bg-bad/5 text-bad hover:bg-bad/15 text-sm rounded-lg transition-colors shrink-0"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
