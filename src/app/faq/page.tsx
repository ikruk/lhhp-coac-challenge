import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Artifact Hub",
};

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is Artifact Hub?",
    a: (
      <>
        A small workspace for publishing AI-generated content — HTML mockups,
        images, PDFs, notes — getting Claude to tag and describe them
        automatically, collecting feedback, and sharing them outside the team
        via time-limited links.
      </>
    ),
  },
  {
    q: "How do I sign in?",
    a: (
      <>
        Click <strong className="text-ink">Sign in with Google</strong> in the
        header. The Google email on your account becomes the owner of any
        artifact you publish and the filter on what you see in the gallery.
      </>
    ),
  },
  {
    q: "Who can see my artifacts?",
    a: (
      <>
        Only you, while signed in. The gallery and detail pages are filtered to
        your Google email. An artifact only leaves that boundary when you
        create a <strong className="text-ink">share link</strong>.
      </>
    ),
  },
  {
    q: "Can I edit or delete an artifact?",
    a: (
      <>
        Yes — open one of your artifacts and use the{" "}
        <strong className="text-ink">Edit</strong> button to rewrite the
        title, description, or tags, or the{" "}
        <strong className="text-ink">Delete</strong> button to remove it
        entirely. Delete is confirmed in a dialog and is irreversible: the
        file is removed from storage and associated feedback and share links
        are dropped with it (the database foreign keys cascade). You can only
        edit or delete artifacts you own.
      </>
    ),
  },
  {
    q: "How do share links work?",
    a: (
      <>
        On an artifact's page, click <strong className="text-ink">Share</strong>.
        Pick an expiry (1 hour to 30 days) and an optional max-views cap. Anyone
        with the link can view the artifact and leave feedback until it expires
        or the view cap is hit — no Google account required on their side.
      </>
    ),
  },
  {
    q: "What file types can I upload?",
    a: (
      <>
        HTML, PNG/JPG/GIF/WebP/SVG images, PDF, plain text, and Markdown. HTML
        renders inline in a sandboxed iframe, images and PDFs render natively,
        everything else falls back to a download button. Upload cap is 10 MB.
      </>
    ),
  },
  {
    q: "What checks run on my uploads?",
    a: (
      <>
        Every upload passes through three layers before it's stored:
        <ol className="mt-3 space-y-2 list-decimal pl-5">
          <li>
            <strong className="text-ink">Size cap of 10 MB.</strong> Enforced
            in the browser (so you don't wait for a doomed upload) and again
            on the server (so nobody bypasses the browser check).
          </li>
          <li>
            <strong className="text-ink">Type + signature check.</strong> Only
            the MIME types listed above are accepted. The file's magic bytes
            are compared against the declared MIME, so a{" "}
            <code className="font-mono">.exe</code> renamed to{" "}
            <code className="font-mono">.png</code> is rejected. Windows
            (PE), Linux (ELF), and macOS (Mach-O) executable headers are
            always blocked. The{" "}
            <a
              href="https://en.wikipedia.org/wiki/EICAR_test_file"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              EICAR
            </a>{" "}
            antivirus test string is rejected so you can smoke-test the
            pipeline.
          </li>
          <li>
            <strong className="text-ink">VirusTotal scan</strong> (when the{" "}
            <code className="font-mono">VIRUSTOTAL_API_KEY</code> env var is
            set). The file is uploaded to VirusTotal, analyzed by 60+
            antivirus engines, and the result is awaited for up to 15
            seconds. Anything with even one malicious or suspicious verdict
            is rejected. If the scan times out or the key isn't configured,
            the upload still proceeds on the layers above — VT is an added
            defense, not the only one.
          </li>
        </ol>
      </>
    ),
  },
  {
    q: "Where do the tags and description come from?",
    a: (
      <>
        Claude Sonnet. At upload time, if you leave the description or tags
        empty, the title and first 2000 characters of the content are sent to
        Claude and it returns a 1-2 sentence description and 3-6 lowercase
        tags. Fill the fields in manually to override. If the AI call fails,
        the upload still succeeds — the fields just stay empty.
      </>
    ),
  },
  {
    q: "What does the AI Summary button do?",
    a: (
      <>
        Once an artifact has two or more pieces of feedback, the{" "}
        <strong className="text-ink">AI Summary</strong> button collapses them
        into a 2-4 sentence summary highlighting consensus, disagreements, and
        actionable suggestions. It's on-demand, not automatic.
      </>
    ),
  },
  {
    q: "Can I publish from Claude Desktop?",
    a: (
      <>
        Yes — the MCP server at{" "}
        <code className="font-mono text-accent">artifact-hub-mcp.onrender.com/mcp</code>{" "}
        exposes <code className="font-mono">publish_artifact</code>,{" "}
        <code className="font-mono">search_artifacts</code>,{" "}
        <code className="font-mono">get_artifact</code>,{" "}
        <code className="font-mono">add_feedback</code>,{" "}
        <code className="font-mono">summarize_feedback</code>,{" "}
        <code className="font-mono">create_share_link</code>, and{" "}
        <code className="font-mono">list_my_artifacts</code> as MCP tools.
        Generate a personal access token at{" "}
        <a
          href="/settings/tokens"
          className="text-accent hover:underline"
        >
          Settings → Access tokens
        </a>
        , paste it once into Claude Desktop&apos;s config under{" "}
        <code className="font-mono">headers.x-api-key</code>, and every tool
        call is automatically attributed to your Google account — no
        per-call email argument needed.
      </>
    ),
  },
  {
    q: "How do access tokens work?",
    a: (
      <>
        Visit{" "}
        <a
          href="/settings/tokens"
          className="text-accent hover:underline"
        >
          Settings → Access tokens
        </a>{" "}
        while signed in, click{" "}
        <strong className="text-ink">Generate token</strong>, and copy the
        raw value (it&apos;s shown once). Paste it into Claude Desktop&apos;s
        config:
        <pre className="mt-3 p-3 bg-panel-raised border border-edge rounded-lg text-xs font-mono overflow-x-auto">
{`{
  "mcpServers": {
    "artifact-hub": {
      "url": "https://artifact-hub-mcp.onrender.com/mcp",
      "headers": { "x-api-key": "ak_…" }
    }
  }
}`}
        </pre>
        The token&apos;s SHA-256 hash is stored server-side; the raw value
        can&apos;t be recovered if you lose it. You can have multiple tokens
        (one per device/client) and revoke any of them independently. The
        Settings page shows the preview (first 8 chars), label, creation
        date, and last-used timestamp for each.
      </>
    ),
  },
  {
    q: "Are my uploads durable?",
    a: (
      <>
        Yes on the production deployment — files are stored on a persistent
        disk mounted on the web service. In a one-person local dev setup,
        files live at <code className="font-mono">./uploads</code> by default.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/70 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="text-sm text-ink-faint hover:text-ink-muted mb-2 inline-block"
          >
            &larr; Back to gallery
          </Link>
          <h1 className="text-2xl font-medium tracking-tight text-ink">FAQ</h1>
          <p className="text-ink-muted text-sm mt-1">
            Everything you might want to know about Artifact Hub.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <ul className="space-y-4">
          {faqs.map(({ q, a }) => (
            <li
              key={q}
              className="bg-panel border border-edge rounded-2xl overflow-hidden"
            >
              <details className="group">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 hover:bg-panel-raised/40 transition-colors">
                  <span className="font-display font-medium text-ink">
                    {q}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-ink-faint transition-transform group-open:rotate-180 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-5 pt-0 text-sm text-ink-muted leading-relaxed border-t border-edge/60">
                  <div className="pt-4">{a}</div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
