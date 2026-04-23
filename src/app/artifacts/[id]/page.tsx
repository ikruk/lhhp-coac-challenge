"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
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
  const { id } = use(params);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    fetch(`/api/artifacts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setArtifact(data.artifact || null);
        setLoading(false);
      });
  }, [id]);

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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="text-sm text-ink-faint hover:text-ink-muted mb-2 inline-block"
          >
            &larr; Back to gallery
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-ink">
                {artifact.title}
              </h1>
              {artifact.description && (
                <p className="text-ink-muted mt-1">{artifact.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-ink-faint">
                <span>{artifact.authorEmail}</span>
                <span className="text-ink-faint/60">•</span>
                <span>{new Date(artifact.createdAt).toLocaleDateString()}</span>
                <span className="text-ink-faint/60">•</span>
                <span>{(artifact.fileSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowShare(true)}
                className="px-4 py-2 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors"
              >
                Share
              </button>
              <a
                href={`/api/artifacts/${artifact.id}/file`}
                download={artifact.fileName}
                className="px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors"
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
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
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
    </div>
  );
}
