"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export function SignInButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-9 w-24 rounded-lg bg-panel-raised/50 animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("google")}
        className="px-3 sm:px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors"
      >
        <span className="hidden sm:inline">Sign in with Google</span>
        <span className="sm:hidden">Sign in</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name ?? "user"}
          className="h-8 w-8 rounded-full border border-edge"
        />
      )}
      <div className="hidden md:flex flex-col text-right leading-tight">
        <span className="text-sm text-ink">{session.user.name}</span>
        <span className="text-xs text-ink-faint">{session.user.email}</span>
      </div>
      <Link
        href="/settings/tokens"
        aria-label="Access tokens"
        title="Access tokens"
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path d="M8 2a5 5 0 0 1 4.905 6.008l4.792 4.79a1 1 0 0 1 .293.708V15a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1h-1a1 1 0 0 1-1-1v-1h-1a1 1 0 0 1-.708-.293l-.383-.383A5 5 0 1 1 8 2zm-1.5 3.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
        </svg>
        <span className="hidden sm:inline">Tokens</span>
      </Link>
      <button
        onClick={() => signOut()}
        aria-label="Sign out"
        title="Sign out"
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3 4a2 2 0 0 1 2-2h5a1 1 0 0 1 0 2H5v12h5a1 1 0 1 1 0 2H5a2 2 0 0 1-2-2V4zm11.293 2.293a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414L15.586 11H8a1 1 0 1 1 0-2h7.586l-1.293-1.293a1 1 0 0 1 0-1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
