"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  title: string;
}

export function PdfViewer({ url, title }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      // Subtract horizontal padding so page canvas doesn't overflow.
      setWidth(Math.max(280, el.offsetWidth - 16));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="w-full border border-edge rounded-xl overflow-hidden bg-panel">
      <div
        ref={containerRef}
        className="max-h-[75vh] sm:max-h-[720px] overflow-y-auto px-2 py-3 flex flex-col items-center gap-3 bg-[#1b1d22]"
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setError(null);
          }}
          onLoadError={(e) =>
            setError(e instanceof Error ? e.message : "Could not load PDF")
          }
          loading={
            <div className="py-16 text-sm text-ink-faint">Loading PDF…</div>
          }
          error={
            <div className="py-10 px-4 text-center">
              <p className="text-sm text-bad mb-3">
                {error || "Could not load PDF"}
              </p>
              <a
                href={url}
                download
                className="px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors inline-block"
              >
                Download {title}
              </a>
            </div>
          }
        >
          {width > 0 &&
            Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i}
                pageNumber={i + 1}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-[0_6px_24px_-10px_rgba(0,0,0,0.55)] rounded-md overflow-hidden"
              />
            ))}
        </Document>
      </div>
      {numPages > 0 && (
        <div className="px-4 py-2 text-xs text-ink-faint border-t border-edge flex items-center justify-between">
          <span>
            {numPages} page{numPages === 1 ? "" : "s"}
          </span>
          <a
            href={url}
            download
            className="text-accent-alt hover:text-accent transition-colors"
          >
            Download original
          </a>
        </div>
      )}
    </div>
  );
}
