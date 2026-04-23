"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArtifactViewer } from "@/components/ArtifactViewer";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { ShareDialog } from "@/components/ShareDialog";

interface Artifact {
  id: string;
  title: string;
  description: string | null;
  type: string;
  tags: string[];
  authorEmail: string;
  createdAt: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export default function ArtifactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/artifacts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setArtifact(data.artifact || null);
        setLoading(false);
      });
  }, [id]);

  function startEdit() {
    if (!artifact) return;
    setEditTitle(artifact.title);
    setEditDescription(artifact.description ?? "");
    setEditTags(artifact.tags.join(", "));
    setActionError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setActionError(null);
  }

  async function saveEdit() {
    if (!editTitle.trim()) {
      setActionError("Title cannot be empty.");
      return;
    }
    setSaving(true);
    setActionError(null);

    const tagsArray = editTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const res = await fetch(`/api/artifacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        tags: tagsArray,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Save failed");
      setSaving(false);
      return;
    }

    const data = await res.json();
    setArtifact((prev) => (prev ? { ...prev, ...data.artifact } : prev));
    setEditing(false);
    setSaving(false);
  }

  async function confirmDelete() {
    setDeleting(true);
    setActionError(null);

    const res = await fetch(`/api/artifacts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Delete failed");
      setDeleting(false);
      return;
    }

    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-faint">
        Loading...
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-muted mb-2">Artifact not found</p>
          <Link href="/" className="text-accent text-sm hover:text-accent-strong hover:underline">
            Back to gallery
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 bg-panel-raised border border-edge-strong rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring transition";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="text-sm text-ink-faint hover:text-ink-muted mb-2 inline-block"
          >
            &larr; Back to gallery
          </Link>

          {editing ? (
            <div className="space-y-3">
              {actionError && (
                <div className="p-3 bg-bad/10 border border-bad/40 rounded-lg text-sm text-bad">
                  {actionError}
                </div>
              )}
              <div>
                <label className="block text-xs text-ink-faint mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-faint mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className={`${inputClass} min-h-[72px]`}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-faint mb-1">
                  Tags{" "}
                  <span className="text-ink-faint/80 font-normal">
                    (comma-separated, max 20)
                  </span>
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-2 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {actionError && !editing && !confirmingDelete && (
                <div className="mb-3 p-3 bg-bad/10 border border-bad/40 rounded-lg text-sm text-bad">
                  {actionError}
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 w-full sm:flex-1">
                  <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-ink break-words">
                    {artifact.title}
                  </h1>
                  {artifact.description && (
                    <p className="text-ink-muted mt-1 text-sm sm:text-base">
                      {artifact.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs sm:text-sm text-ink-faint">
                    <span className="truncate max-w-full">
                      {artifact.authorEmail}
                    </span>
                    <span className="text-ink-faint/60">•</span>
                    <span>{new Date(artifact.createdAt).toLocaleDateString()}</span>
                    <span className="text-ink-faint/60">•</span>
                    <span>{(artifact.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 sm:justify-end w-full sm:w-auto">
                  <button
                    onClick={startEdit}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setActionError(null);
                      setConfirmingDelete(true);
                    }}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-bad/40 bg-bad/5 text-bad hover:bg-bad/15 text-sm rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowShare(true)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors"
                  >
                    Share
                  </button>
                  <a
                    href={`/api/artifacts/${artifact.id}/file`}
                    download={artifact.fileName}
                    className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>

              {artifact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {artifact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-accent-soft text-accent border border-accent/25 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <ArtifactViewer
          artifactId={artifact.id}
          type={artifact.type}
          mimeType={artifact.mimeType}
          title={artifact.title}
        />

        <FeedbackPanel artifactId={artifact.id} />
      </div>

      {showShare && (
        <ShareDialog
          artifactId={artifact.id}
          onClose={() => setShowShare(false)}
        />
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-panel border border-edge rounded-2xl p-6 w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
            <h2 className="text-lg font-display font-medium text-ink mb-2">
              Delete this artifact?
            </h2>
            <p className="text-sm text-ink-muted mb-4">
              The file will be removed from storage and all feedback and share
              links for it will be deleted. This cannot be undone.
            </p>
            {actionError && (
              <div className="mb-3 p-3 bg-bad/10 border border-bad/40 rounded-lg text-sm text-bad">
                {actionError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="px-4 py-2 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-bad text-canvas text-sm font-medium rounded-lg hover:bg-bad/85 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete artifact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
