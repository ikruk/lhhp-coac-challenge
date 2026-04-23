"use client";

import { useState, useEffect, use } from "react";
import { ArtifactViewer } from "@/components/ArtifactViewer";
import { FeedbackPanel } from "@/components/FeedbackPanel";

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

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Invalid share link");
        }
        return res.json();
      })
      .then((data) => {
        setArtifact(data.artifact);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-faint">
        Loading...
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium tracking-tight text-ink mb-2">
            Link Expired or Invalid
          </h1>
          <p className="text-ink-muted">
            {error || "This share link is no longer valid."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-accent/80 mb-1">
            Shared via Artifact Hub
          </p>
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
    </div>
  );
}
