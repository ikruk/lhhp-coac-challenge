"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArtifactCard } from "@/components/ArtifactCard";

interface Artifact {
  id: string;
  title: string;
  description: string | null;
  type: string;
  tags: string[];
  authorEmail: string;
  createdAt: string;
  mimeType: string;
}

export default function HomePage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtifacts();
  }, [search, selectedTag]);

  async function fetchArtifacts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedTag) params.set("tag", selectedTag);

    const res = await fetch(`/api/artifacts?${params}`);
    const data = await res.json();
    setArtifacts(data.artifacts || []);
    setLoading(false);
  }

  const allTags = Array.from(new Set(artifacts.flatMap((a) => a.tags))).sort();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium tracking-tight text-ink">
              Artifact Hub
            </h1>
            <p className="text-sm text-ink-faint">
              Browse and share AI-generated content
            </p>
          </div>
          <Link
            href="/artifacts/new"
            className="px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors shadow-[0_0_0_1px_var(--color-accent-ring)]"
          >
            Publish
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search artifacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-panel-raised border border-edge-strong rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring transition"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedTag(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                !selectedTag
                  ? "bg-accent text-canvas border-transparent"
                  : "bg-panel text-ink-muted border-edge hover:bg-panel-raised hover:text-ink"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  selectedTag === tag
                    ? "bg-accent text-canvas border-transparent"
                    : "bg-panel text-ink-muted border-edge hover:bg-panel-raised hover:text-ink"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-ink-faint">Loading...</div>
        ) : artifacts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink-muted mb-2">No artifacts yet</p>
            <Link
              href="/artifacts/new"
              className="text-accent text-sm hover:text-accent-strong hover:underline"
            >
              Publish your first artifact
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                id={artifact.id}
                title={artifact.title}
                description={artifact.description}
                type={artifact.type}
                tags={artifact.tags}
                authorEmail={artifact.authorEmail}
                createdAt={artifact.createdAt}
                mimeType={artifact.mimeType}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
