"use client";

import { useState, useEffect } from "react";

interface FeedbackItem {
  id: string;
  authorName: string;
  content: string;
  rating: number | null;
  createdAt: string;
}

interface FeedbackPanelProps {
  artifactId: string;
}

export function FeedbackPanel({ artifactId }: FeedbackPanelProps) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [artifactId]);

  async function fetchFeedback() {
    setLoading(true);
    const res = await fetch(`/api/feedback?artifactId=${artifactId}`);
    const data = await res.json();
    setItems(data.feedback || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;

    setSubmitting(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artifactId,
        authorName: authorName.trim(),
        content: content.trim(),
        rating: rating || null,
      }),
    });
    setContent("");
    setRating("");
    setSummary(null);
    await fetchFeedback();
    setSubmitting(false);
  }

  async function handleSummarize() {
    setSummarizing(true);
    const res = await fetch("/api/feedback/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artifactId }),
    });
    const data = await res.json();
    setSummary(data.summary);
    setSummarizing(false);
  }

  const inputClass =
    "w-full px-3 py-2 bg-panel-raised border border-edge-strong rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring transition";

  return (
    <div className="space-y-6 bg-panel border border-edge rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-medium text-ink">
          Feedback ({items.length})
        </h2>
        {items.length >= 2 && (
          <button
            onClick={handleSummarize}
            disabled={summarizing}
            className="text-sm px-3 py-1.5 bg-accent-soft text-accent border border-accent/30 rounded-lg hover:bg-accent/25 transition-colors disabled:opacity-50"
          >
            {summarizing ? "Summarizing..." : "✨ AI Summary"}
          </button>
        )}
      </div>

      {summary && (
        <div className="p-4 bg-accent-soft border border-accent/30 rounded-lg">
          <p className="text-sm font-medium text-accent mb-1">AI Summary</p>
          <p className="text-sm text-ink-muted">{summary}</p>
        </div>
      )}

      {loading ? (
        <p className="text-ink-faint text-sm">Loading feedback...</p>
      ) : items.length === 0 ? (
        <p className="text-ink-faint text-sm">No feedback yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-panel-raised/60 border border-edge rounded-lg"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-ink">
                  {item.authorName}
                </span>
                <div className="flex items-center gap-2 text-xs text-ink-faint">
                  {item.rating && (
                    <span className="text-warn">
                      {"★".repeat(item.rating)}
                      <span className="text-ink-faint/60">
                        {"★".repeat(5 - item.rating)}
                      </span>
                    </span>
                  )}
                  <span>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-ink-muted">{item.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-edge pt-5">
        <h3 className="text-sm font-medium text-ink-muted">Leave feedback</h3>
        <input
          type="text"
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className={inputClass}
          required
        />
        <textarea
          placeholder="Your feedback..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`${inputClass} min-h-[80px]`}
          required
        />
        <div className="flex items-center gap-4">
          <select
            value={rating}
            onChange={(e) =>
              setRating(e.target.value ? parseInt(e.target.value) : "")
            }
            className={inputClass + " max-w-[220px]"}
          >
            <option value="">Rating (optional)</option>
            <option value="1">1 - Poor</option>
            <option value="2">2 - Fair</option>
            <option value="3">3 - Good</option>
            <option value="4">4 - Very Good</option>
            <option value="5">5 - Excellent</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
