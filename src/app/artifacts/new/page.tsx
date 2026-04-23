"use client";

import Link from "next/link";
import { UploadForm } from "@/components/UploadForm";

export default function NewArtifactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; Back to gallery
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Publish Artifact
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload an HTML mockup, image, PDF, or other AI-generated content
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <UploadForm />
      </div>
    </div>
  );
}
