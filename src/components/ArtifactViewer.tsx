"use client";

interface ArtifactViewerProps {
  artifactId: string;
  type: string;
  mimeType: string;
  title: string;
}

export function ArtifactViewer({
  artifactId,
  type,
  mimeType,
  title,
}: ArtifactViewerProps) {
  const fileUrl = `/api/artifacts/${artifactId}/file`;

  if (type === "html") {
    return (
      <div className="w-full border border-edge rounded-xl overflow-hidden bg-panel">
        <iframe
          src={fileUrl}
          title={title}
          className="w-full h-[600px] border-0 bg-white"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="flex justify-center bg-panel border border-edge rounded-xl p-4">
        <img
          src={fileUrl}
          alt={title}
          className="max-w-full max-h-[600px] object-contain rounded-lg"
        />
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className="w-full border border-edge rounded-xl overflow-hidden">
        <iframe
          src={fileUrl}
          title={title}
          className="w-full h-[700px] border-0 bg-white"
        />
      </div>
    );
  }

  return (
    <div className="text-center py-12 bg-panel border border-edge rounded-xl">
      <p className="text-ink-muted mb-4">
        Preview not available for this file type
      </p>
      <a
        href={fileUrl}
        download
        className="px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors inline-block"
      >
        Download {title}
      </a>
    </div>
  );
}
