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
      <div className="group border border-edge rounded-xl p-5 bg-panel hover:border-accent/60 hover:shadow-[0_10px_40px_-10px_rgba(56,189,248,0.25)] transition-all cursor-pointer h-full flex flex-col">
        <div className="relative h-32 bg-panel-raised/70 border border-edge/60 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {type === "image" ? (
            <img
              src={`/api/artifacts/${id}/file`}
              alt={title}
              className="object-cover w-full h-full rounded-lg"
            />
          ) : type === "html" ? (
            <>
              <iframe
                src={`/api/artifacts/${id}/file`}
                title={title}
                loading="lazy"
                sandbox=""
                scrolling="no"
                aria-hidden="true"
                className="absolute top-0 left-0 origin-top-left pointer-events-none border-0 bg-white"
                style={{
                  width: "400%",
                  height: "400%",
                  transform: "scale(0.25)",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-panel-raised/30 pointer-events-none" />
              <span className="absolute top-1.5 right-1.5 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-canvas/70 border border-edge text-ink-faint backdrop-blur-sm">
                HTML
              </span>
            </>
          ) : (
            <span className="text-4xl opacity-80">{icon}</span>
          )}
        </div>

        <h3 className="font-display font-medium text-ink group-hover:text-accent transition-colors line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-ink-muted mt-1 line-clamp-2">
            {description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-accent-soft text-accent border border-accent/25 rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-xs text-ink-faint">
                +{tags.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-ink-faint">
          <span>{authorEmail.split("@")[0]}</span>
          <span>{date}</span>
        </div>
      </div>
    </Link>
  );
}
