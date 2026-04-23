"use client";

import { useState } from "react";

interface ShareDialogProps {
  artifactId: string;
  onClose: () => void;
}

export function ShareDialog({ artifactId, onClose }: ShareDialogProps) {
  const [expiresInHours, setExpiresInHours] = useState(48);
  const [maxViews, setMaxViews] = useState<number | "">("");
  const [createdBy, setCreatedBy] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!createdBy.trim()) return;
    setCreating(true);

    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artifactId,
        createdBy: createdBy.trim(),
        expiresInHours,
        maxViews: maxViews || undefined,
      }),
    });

    const data = await res.json();
    setShareUrl(data.shareUrl);
    setCreating(false);
  }

  async function handleCopy() {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const inputClass =
    "w-full px-3 py-2 bg-panel-raised border border-edge-strong rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring transition";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-panel border border-edge rounded-2xl p-6 w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
        <h2 className="text-lg font-display font-medium text-ink mb-4">
          Share Artifact
        </h2>

        {shareUrl ? (
          <div className="space-y-4">
            <div className="p-3 bg-good/10 border border-good/40 rounded-lg">
              <p className="text-sm text-good font-medium mb-1">
                Link created!
              </p>
              <p className="text-xs text-ink-muted break-all font-mono">
                {shareUrl}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your email"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              className={inputClass}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink-faint mb-1 block">
                  Expires in
                </label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(parseInt(e.target.value))}
                  className={inputClass}
                >
                  <option value={1}>1 hour</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={168}>1 week</option>
                  <option value={720}>30 days</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-faint mb-1 block">
                  Max views
                </label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={maxViews}
                  onChange={(e) =>
                    setMaxViews(e.target.value ? parseInt(e.target.value) : "")
                  }
                  className={inputClass}
                  min={1}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !createdBy.trim()}
                className="flex-1 px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Link"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
