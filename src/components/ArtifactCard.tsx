"use client";

import Link from "next/link";

interface ArtifactCardProps {
  id: string;
  title: string;
  description: string | null;
  type: string;
  tags: string[];
  authorEmail: string;
  createdAt: string;
  mimeType: string;
}

const typeIcons: Record<string, string> = {
  html: "🌐",
  image: "🖼️",
  pdf: "📄",
  other: "📎",
};

export function ArtifactCard({
  id,
  title,
  description,
  type,
  tags,
  authorEmail,
  createdAt,
  mimeType,
}: ArtifactCardProps) {
  const icon = typeIcons[type] || "📎";
  const date = new Date(createdAt).toLocaleDateString();

  return (
    <Link href={`/artifacts/${id}`}>
      <div className="group border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all bg-white cursor-pointer h-full flex flex-col">
        {/* Preview area */}
        <div className="h-32 bg-gray-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {type === "image" ? (
            <img
              src={`/api/artifacts/${id}/file`}
              alt={title}
              className="object-cover w-full h-full rounded-lg"
            />
          ) : (
            <span className="text-4xl">{icon}</span>
          )}
        </div>

        {/* Content */}
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-xs text-gray-400">+{tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-400">
          <span>{authorEmail.split("@")[0]}</span>
          <span>{date}</span>
        </div>
      </div>
    </Link>
  );
}
