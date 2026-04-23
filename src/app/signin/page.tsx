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
            fill="#0f172a"
            d="M12.18 21c2.7 0 4.97-.9 6.62-2.42l-3.25-2.52c-.9.6-2.05.96-3.37.96-2.6 0-4.79-1.75-5.58-4.1H3.24v2.58A9.82 9.82 0 0 0 12.18 21z"
          />
          <path
            fill="#0f172a"
            d="M6.6 12.92a5.9 5.9 0 0 1 0-3.82V6.52H3.24a9.8 9.8 0 0 0 0 8.97l3.36-2.57z"
          />
          <path
            fill="#0f172a"
            d="M12.18 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C17.14 3.1 14.88 2.2 12.18 2.2A9.82 9.82 0 0 0 3.24 6.52L6.6 9.1c.79-2.36 2.97-4.1 5.58-4.1z"
          />
        </svg>
        {pending ? "Redirecting to Google…" : "Sign in with Google"}
      </button>
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium tracking-tight text-ink">
              Artifact Hub
            </h1>
            <p className="text-sm text-ink-faint">
              Publish, review, and share AI-generated artifacts
            </p>
          </div>
          <Link
            href="/faq"
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            FAQ
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] items-center">
          <section>
            <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">
              Welcome
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tight text-ink leading-[1.1]">
              Your hub for AI-generated artifacts.
            </h2>
            <p className="mt-5 text-ink-muted text-lg leading-relaxed">
              Publish HTML mockups, images, PDFs, or notes. Let Claude describe
              and tag them for you. Collect feedback, and share each one
              outside the team with a time-limited link — no account needed on
              the recipient's side.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-ink-muted">
              <Feature>
                Sign in with Google — you only see artifacts authored under
                your email.
              </Feature>
              <Feature>
                Tag + describe + summarize feedback, all by Claude.
              </Feature>
              <Feature>
                Share links with TTL and optional view caps for external
                reviewers.
              </Feature>
              <Feature>
                Publish directly from Claude Desktop over MCP.
              </Feature>
            </ul>

            <p className="mt-8 text-xs text-ink-faint">
              New here?{" "}
              <Link
                href="/faq"
                className="text-accent hover:text-accent-strong underline-offset-4 hover:underline"
              >
                Read the FAQ first
              </Link>{" "}
              — it covers privacy, sharing, and the MCP integration in one page.
            </p>
          </section>

          <section className="bg-panel border border-edge rounded-2xl p-6 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
            <h3 className="font-display font-medium text-ink text-lg mb-1">
              Sign in to continue
            </h3>
            <p className="text-sm text-ink-muted mb-6">
              We use Google sign-in only to identify you — nothing is posted to
              your account.
            </p>
            <Suspense
              fallback={
                <div className="h-12 rounded-xl bg-panel-raised/60 animate-pulse" />
              }
            >
              <SignInForm />
            </Suspense>
            <p className="mt-5 text-xs text-ink-faint leading-relaxed">
              By continuing you agree that your name, email, and avatar from
              your Google profile will be stored in a signed session cookie.
              No other data is collected.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3 w-3"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}
