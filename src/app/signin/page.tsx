"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <>
      {error && (
        <div className="mb-5 p-3 bg-bad/10 border border-bad/40 rounded-lg text-sm text-bad">
          Sign-in failed — {error}. Please try again.
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-accent text-canvas font-medium rounded-xl hover:bg-accent-strong transition-colors shadow-[0_0_0_1px_var(--color-accent-ring)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            fill="#fff"
            d="M21.35 11.1h-9.17v2.98h5.51c-.23 1.27-.94 2.36-2.01 3.08v2.56h3.25c1.9-1.75 3-4.34 3-7.43 0-.72-.07-1.42-.18-2.09z"
          />
          <path
            fill="#0b0d10"
            d="M12.18 21c2.7 0 4.97-.9 6.62-2.42l-3.25-2.52c-.9.6-2.05.96-3.37.96-2.6 0-4.79-1.75-5.58-4.1H3.24v2.58A9.82 9.82 0 0 0 12.18 21z"
          />
          <path
            fill="#0b0d10"
            d="M6.6 12.92a5.9 5.9 0 0 1 0-3.82V6.52H3.24a9.8 9.8 0 0 0 0 8.97l3.36-2.57z"
          />
          <path
            fill="#0b0d10"
            d="M12.18 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C17.14 3.1 14.88 2.2 12.18 2.2A9.82 9.82 0 0 0 3.24 6.52L6.6 9.1c.79-2.36 2.97-4.1 5.58-4.1z"
          />
        </svg>
        {pending ? "Redirecting to Google…" : "Sign in with Google"}
      </button>
    </>
  );
}

const chips = [
  "Next.js 16 App Router",
  "MCP · StreamableHTTP",
  "Drizzle + Postgres",
  "Auth.js v5 · Google",
  "Anthropic SDK",
];

const productCards = [
  {
    title: "Upload anything",
    body: "HTML, images, and PDF are first-class (render inline). Everything else degrades to a download button.",
  },
  {
    title: "AI metadata by default",
    body: "Only a title is required. Tags and description are inferred at upload time. Users can override — most don't.",
  },
  {
    title: "Feedback lives with the artifact",
    body: "Inline in the DB, not scattered across Slack threads. A single Summarize button condenses long discussions.",
  },
  {
    title: "Time-boxed share links",
    body: "Signed tokens with TTL + optional view cap. No account required for external reviewers.",
  },
];

export default function SignInPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="eyebrow">Artifact Hub</span>
            <span className="text-sm text-ink-faint hidden sm:inline">
              AI-generated content · organized, reviewed, shared.
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/presentation.html"
              className="text-ink-muted hover:text-ink transition-colors"
            >
              Deck
            </Link>
            <Link
              href="/faq"
              className="text-ink-muted hover:text-ink transition-colors"
            >
              FAQ
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Hero */}
        <section className="grid gap-14 md:grid-cols-[1.3fr_1fr] items-start">
          <div>
            <p className="eyebrow mb-5">AI-Generated Content Hub</p>
            <h1 className="title-gradient text-[clamp(2.4rem,5.2vw,4.4rem)] leading-[1.02] tracking-[-0.02em] font-medium">
              Artifact Hub.
            </h1>
            <p className="mt-5 text-ink-muted text-lg md:text-xl max-w-[52ch] leading-relaxed">
              A small hub where teams publish AI-generated artifacts, get them
              auto-tagged and described, collect structured feedback, and share
              them via time-boxed links — with first-class MCP support for
              Claude Desktop.
            </p>
            <div className="flex flex-wrap gap-2 mt-7">
              {chips.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 border border-edge bg-panel rounded-full text-xs text-ink-faint"
                >
                  {c}
                </span>
              ))}
            </div>

            <p className="mt-10 text-xs text-ink-faint leading-relaxed">
              Want the full story first?{" "}
              <Link
                href="/presentation.html"
                className="text-accent-alt hover:text-accent transition-colors border-b border-dotted border-accent-alt hover:border-accent"
              >
                Open the 11-slide deck
              </Link>
              , or skim the{" "}
              <Link
                href="/faq"
                className="text-accent-alt hover:text-accent transition-colors border-b border-dotted border-accent-alt hover:border-accent"
              >
                FAQ
              </Link>
              .
            </p>
          </div>

          <div className="bg-panel border border-edge rounded-2xl p-6 md:p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
            <p className="eyebrow mb-3">Get in</p>
            <h2 className="text-xl font-display font-medium text-ink mb-1">
              Sign in to continue
            </h2>
            <p className="text-sm text-ink-faint mb-6">
              Google identifies you. Artifacts authored under your email appear
              in your gallery.
            </p>
            <Suspense
              fallback={
                <div className="h-12 rounded-xl bg-panel-raised animate-pulse" />
              }
            >
              <SignInForm />
            </Suspense>
            <p className="mt-5 text-xs text-ink-faint leading-relaxed">
              By continuing you agree that your name, email, and avatar from
              your Google profile are stored in a signed session cookie. No
              other data is collected.
            </p>
          </div>
        </section>

        {/* Product decisions */}
        <section className="mt-24">
          <p className="eyebrow mb-4">Product Decisions</p>
          <h2 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-ink mb-8">
            What makes it feel right
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {productCards.map((card) => (
              <article
                key={card.title}
                className="bg-panel border border-edge rounded-2xl p-5"
              >
                <h3 className="text-base font-display font-medium text-accent-alt mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-ink-faint leading-relaxed">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA row */}
        <section className="mt-24 grid gap-4 sm:grid-cols-3">
          <Link
            href="/presentation.html"
            className="bg-panel border border-edge rounded-2xl p-5 hover:border-accent/60 transition-colors group"
          >
            <p className="eyebrow mb-2">Deep dive</p>
            <h3 className="text-base font-display font-medium text-ink mb-1 group-hover:text-accent transition-colors">
              Open the presentation →
            </h3>
            <p className="text-xs text-ink-faint">
              Eleven-slide overview: architecture, data model, MCP tools,
              upload security.
            </p>
          </Link>
          <Link
            href="/faq"
            className="bg-panel border border-edge rounded-2xl p-5 hover:border-accent/60 transition-colors group"
          >
            <p className="eyebrow mb-2">Q&amp;A</p>
            <h3 className="text-base font-display font-medium text-ink mb-1 group-hover:text-accent transition-colors">
              Read the FAQ →
            </h3>
            <p className="text-xs text-ink-faint">
              Privacy, sharing, upload checks, and Claude Desktop tokens — all
              in one page.
            </p>
          </Link>
          <a
            href="https://github.com/ikruk/lhhp-coac-challenge"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-panel border border-edge rounded-2xl p-5 hover:border-accent/60 transition-colors group"
          >
            <p className="eyebrow mb-2">Source</p>
            <h3 className="text-base font-display font-medium text-ink mb-1 group-hover:text-accent transition-colors">
              GitHub →
            </h3>
            <p className="text-xs text-ink-faint font-mono">
              ikruk/lhhp-coac-challenge
            </p>
          </a>
        </section>
      </main>
    </div>
  );
}
