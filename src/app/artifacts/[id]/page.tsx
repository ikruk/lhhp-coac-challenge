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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Artifact not found</p>
          <Link href="/" className="text-blue-600 text-sm hover:underline">
            Back to gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; Back to gallery
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {artifact.title}
              </h1>
              {artifact.description && (
                <p className="text-gray-500 mt-1">{artifact.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                <span>{artifact.authorEmail}</span>
                <span>
                  {new Date(artifact.createdAt).toLocaleDateString()}
                </span>
                <span>{(artifact.fileSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowShare(true)}
                className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
              >
                Share
              </button>
              <a
                href={`/api/artifacts/${artifact.id}/file`}
                download={artifact.fileName}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Download
              </a>
            </div>
          </div>

          {/* Tags */}
          {artifact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {artifact.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <ArtifactViewer
          artifactId={artifact.id}
          type={artifact.type}
          mimeType={artifact.mimeType}
          title={artifact.title}
        />

        <FeedbackPanel artifactId={artifact.id} />
      </div>

      {/* Share dialog */}
      {showShare && (
        <ShareDialog
          artifactId={artifact.id}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
