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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Share Artifact</h2>

        {shareUrl ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium mb-1">Link created!</p>
              <p className="text-xs text-gray-600 break-all">{shareUrl}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Expires in</label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value={1}>1 hour</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={168}>1 week</option>
                  <option value={720}>30 days</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max views</label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={maxViews}
                  onChange={(e) =>
                    setMaxViews(e.target.value ? parseInt(e.target.value) : "")
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  min={1}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !createdBy.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Link"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
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
