import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-edge bg-canvas/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-muted">
        <p>
          Created by{" "}
          <strong className="text-ink font-semibold">Ihor Kruk</strong>
        </p>
        <div className="flex items-center gap-5">
          <Link
            href="/faq"
            className="text-ink-muted hover:text-ink transition-colors font-medium"
          >
            FAQ
          </Link>
          <Link
            href="/releases"
            className="text-ink-muted hover:text-ink transition-colors font-medium"
          >
            Releases
          </Link>
          <a
            href="https://www.linkedin.com/in/ikruk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-ink-muted hover:text-[#0a66c2] transition-colors font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span>LinkedIn</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
