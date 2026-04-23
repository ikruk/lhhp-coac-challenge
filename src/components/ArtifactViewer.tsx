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
      <div className="w-full border rounded-lg overflow-hidden bg-white">
        <iframe
          src={fileUrl}
          title={title}
          className="w-full h-[600px] border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="flex justify-center bg-gray-50 rounded-lg p-4">
        <img
          src={fileUrl}
          alt={title}
          className="max-w-full max-h-[600px] object-contain rounded"
        />
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className="w-full border rounded-lg overflow-hidden">
        <iframe
          src={fileUrl}
          title={title}
          className="w-full h-[700px] border-0"
        />
      </div>
    );
  }

  // Fallback: download link
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <p className="text-gray-500 mb-4">Preview not available for this file type</p>
      <a
        href={fileUrl}
        download
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Download {title}
      </a>
    </div>
  );
}
