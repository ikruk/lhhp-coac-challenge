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
        className="px-4 py-2 bg-accent text-canvas text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name ?? "user"}
          className="h-8 w-8 rounded-full border border-edge"
        />
      )}
      <div className="hidden sm:flex flex-col text-right leading-tight">
        <span className="text-sm text-ink">{session.user.name}</span>
        <span className="text-xs text-ink-faint">{session.user.email}</span>
      </div>
      <Link
        href="/settings/tokens"
        className="px-3 py-1.5 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors"
      >
        Tokens
      </Link>
      <button
        onClick={() => signOut()}
        className="px-3 py-1.5 border border-edge bg-panel-raised/50 text-ink-muted hover:text-ink hover:bg-panel-raised text-sm rounded-lg transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
