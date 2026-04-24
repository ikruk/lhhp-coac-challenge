import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata: Metadata = {
  title: "Release notes — Artifact Hub",
};

async function loadReleaseNotes(): Promise<string> {
  const file = path.join(process.cwd(), "RELEASE_NOTES.md");
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return "# Release notes\n\nNo release notes found.";
  }
}

export default async function ReleasesPage() {
  const markdown = await loadReleaseNotes();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/70 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="text-sm text-ink-faint hover:text-ink-muted mb-2 inline-block"
          >
            &larr; Back to gallery
          </Link>
          <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-ink">
            Release notes
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            What&apos;s new in Artifact Hub. Sourced from{" "}
            <code className="font-mono text-accent-alt">RELEASE_NOTES.md</code>{" "}
            in the repo.
          </p>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 release-notes">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </article>
    </div>
  );
}
