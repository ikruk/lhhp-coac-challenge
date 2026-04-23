"use client";

import Link from "next/link";
import { UploadForm } from "@/components/UploadForm";

export default function NewArtifactPage() {
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
            Publish Artifact
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Upload an HTML mockup, image, PDF, or other AI-generated content
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <UploadForm />
      </div>
    </div>
  );
}
