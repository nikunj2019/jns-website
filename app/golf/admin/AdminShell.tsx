"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAuthInstance } from "../../lib/firebase";
import { authErrorMessage, useAuth, useSignOut } from "../lib/useAuth";
import Crest from "../components/Crest";

const NAV = [
  { href: "/golf/admin/", label: "Event" },
  { href: "/golf/admin/teams/", label: "Teams" },
  { href: "/golf/admin/scores/", label: "Scores" },
  { href: "/golf/admin/course/", label: "Course" },
];

/**
 * Wraps every organizer screen with a password gate.
 *
 * This gate is convenience, not security: a static site can't keep anyone off a
 * page. What actually protects the data is the admin email allowlist in
 * firestore.rules — a non-admin who reached these screens would simply have
 * every write rejected.
 */
export default function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const signOut = useSignOut();
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="py-20 text-center text-sm text-cream-golf/50">Loading…</p>;
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 items-center px-5 py-10">
        <div className="w-full">
          <div className="flex justify-center">
            <Crest size={64} />
          </div>
          <h1 className="font-display mt-5 text-center text-2xl text-cream-golf">
            Organizer sign-in
          </h1>
          <p className="mt-1.5 text-center text-[0.8rem] text-cream-golf/50">
            Stonegate Golf Scramble
          </p>

          <form onSubmit={handleSignIn} className="mt-7 space-y-3">
            <div>
              <label htmlFor="admin-email" className="sr-only">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-cream-golf/20 bg-fairway-800 px-4 py-3.5 text-base text-cream-golf placeholder-cream-golf/35 focus:border-brass focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="sr-only">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-cream-golf/20 bg-fairway-800 px-4 py-3.5 text-base text-cream-golf placeholder-cream-golf/35 focus:border-brass focus:outline-none"
              />
            </div>

            {error && <p className="text-center text-[0.82rem] text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-cream-golf px-4 py-3.5 text-sm font-medium text-fairway-900 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-[0.75rem]">
            <Link href="/golf/" className="text-cream-golf/40 underline underline-offset-4">
              Back to the app
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-brass/20 bg-fairway-900/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href="/golf/" aria-label="Back to app" className="shrink-0">
            <Crest size={26} />
          </Link>
          <h1 className="font-display flex-1 truncate text-lg text-cream-golf">{title}</h1>
          <button
            type="button"
            onClick={signOut}
            className="shrink-0 text-[0.72rem] text-cream-golf/50 underline underline-offset-2 hover:text-cream-golf"
          >
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 pb-2" aria-label="Admin">
          {NAV.map((item) => {
            const active =
              item.href === "/golf/admin/"
                ? pathname === "/golf/admin" || pathname === "/golf/admin/"
                : pathname.startsWith(item.href.replace(/\/$/, ""));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[0.78rem] transition-colors ${
                  active
                    ? "bg-brass text-fairway-900"
                    : "text-cream-golf/60 hover:bg-cream-golf/10 hover:text-cream-golf"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 pt-5">
        <p className="mb-4 text-[0.7rem] text-cream-golf/35">Signed in as {user.email}</p>
        {children}
      </main>
    </>
  );
}
