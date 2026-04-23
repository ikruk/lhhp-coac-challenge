"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (tags) formData.append("tags", tags);

    try {
      const res = await fetch("/api/artifacts", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      router.push(`/artifacts/${data.artifact.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 bg-panel-raised border border-edge-strong rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring transition";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 max-w-xl bg-panel border border-edge rounded-2xl p-6"
    >
      {error && (
        <div className="p-3 bg-bad/10 border border-bad/40 rounded-lg text-sm text-bad">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1">
          File *
        </label>
        <div
          className="border-2 border-dashed border-edge-strong rounded-lg p-8 text-center cursor-pointer hover:border-accent hover:bg-accent-soft/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <div>
              <p className="text-sm text-ink font-medium">{file.name}</p>
              <p className="text-xs text-ink-faint mt-1">
                {(file.size / 1024).toFixed(1)} KB — {file.type}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-ink-muted">
                Click to select a file (HTML, image, PDF)
              </p>
              <p className="text-xs text-ink-faint mt-1">Max 10MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.txt,.md"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q3 Onboarding Flow Mockup"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1">
          Description{" "}
          <span className="text-ink-faint font-normal">
            (AI will generate if empty)
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this artifact about?"
          className={`${inputClass} min-h-[80px]`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1">
          Tags{" "}
          <span className="text-ink-faint font-normal">
            (comma-separated, AI generates if empty)
          </span>
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. mockup, onboarding, landing-page"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={uploading || !file || !title}
        className="w-full px-4 py-2.5 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading
          ? "Publishing... (AI is generating tags & description)"
          : "Publish Artifact"}
      </button>
    </form>
  );
}
