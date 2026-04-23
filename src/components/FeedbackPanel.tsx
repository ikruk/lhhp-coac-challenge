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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Feedback ({items.length})
        </h2>
        {items.length >= 2 && (
          <button
            onClick={handleSummarize}
            disabled={summarizing}
            className="text-sm px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 disabled:opacity-50"
          >
            {summarizing ? "Summarizing..." : "AI Summary"}
          </button>
        )}
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm font-medium text-purple-700 mb-1">AI Summary</p>
          <p className="text-sm text-gray-700">{summary}</p>
        </div>
      )}

      {/* Feedback list */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading feedback...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400 text-sm">No feedback yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {item.authorName}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {item.rating && <span>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</span>}
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700">{item.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add feedback form */}
      <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700">Leave feedback</h3>
        <input
          type="text"
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          required
        />
        <textarea
          placeholder="Your feedback..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 min-h-[80px]"
          required
        />
        <div className="flex items-center gap-4">
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value ? parseInt(e.target.value) : "")}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
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
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
