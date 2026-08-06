"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SignIn from "../components/SignIn";
import { CheckIcon } from "../components/icons";
import {
  authErrorMessage,
  completeMagicLink,
  isMagicLink,
  storedEmail,
  useAuth,
} from "../lib/useAuth";

type Phase = "checking" | "need-email" | "completing" | "done" | "error" | "not-a-link";

/**
 * Where the emailed sign-in link lands.
 *
 * If the link is opened on the same device that requested it, the address is
 * already in localStorage and this completes silently. Opened elsewhere — a
 * link forwarded to a laptop, say — it asks for the address, which is also what
 * keeps an intercepted link from being usable on its own.
 */
export default function AuthLanding() {
  const router = useRouter();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const url = window.location.href;

    if (!isMagicLink(url)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the sign-in link can only be inspected once window.location exists
      setPhase("not-a-link");
      return;
    }

    const known = storedEmail();
    if (!known) {
      setPhase("need-email");
      return;
    }

    setPhase("completing");
    completeMagicLink(known, url)
      .then(() => setPhase("done"))
      .catch((err) => {
        setError(authErrorMessage(err));
        setPhase("error");
      });
  }, []);

  // Once signed in, hand the player straight to score entry.
  useEffect(() => {
    if (phase !== "done") return;
    const timer = setTimeout(() => router.replace("/golf/score/"), 1200);
    return () => clearTimeout(timer);
  }, [phase, router]);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPhase("completing");
    try {
      await completeMagicLink(email.trim(), window.location.href);
      setPhase("done");
    } catch (err) {
      setError(authErrorMessage(err));
      setPhase("need-email");
    }
  }

  if (phase === "checking" || phase === "completing") {
    return <p className="py-8 text-center text-sm text-cream-golf/55">Signing you in…</p>;
  }

  if (phase === "done") {
    return (
      <div className="rounded-2xl border border-brass/30 bg-brass/8 p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brass text-fairway-900">
          <CheckIcon size={24} />
        </span>
        <h2 className="font-display mt-4 text-xl text-cream-golf">You&rsquo;re in</h2>
        <p className="mt-1 text-[0.85rem] text-cream-golf/65">
          {user?.email ? `Signed in as ${user.email}.` : "Signed in."} Taking you to scoring…
        </p>
      </div>
    );
  }

  if (phase === "need-email") {
    return (
      <div className="rounded-2xl border border-cream-golf/12 bg-fairway-800 p-5">
        <h2 className="font-display text-xl text-cream-golf">Confirm your email</h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-cream-golf/70">
          It looks like you opened this link on a different device. Enter the address you
          requested it with.
        </p>
        <form onSubmit={submitEmail} className="mt-4 space-y-3">
          <label htmlFor="confirm-email" className="sr-only">
            Email address
          </label>
          <input
            id="confirm-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-cream-golf/20 bg-fairway-900 px-4 py-3.5 text-base text-cream-golf placeholder-cream-golf/35 focus:border-brass focus:outline-none"
          />
          {error && <p className="text-[0.82rem] text-red-300">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-cream-golf px-4 py-3.5 text-sm font-medium text-fairway-900 transition-opacity hover:opacity-90"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center">
          <h2 className="font-display text-lg text-cream-golf">Couldn&rsquo;t sign you in</h2>
          <p className="mt-1.5 text-[0.85rem] text-red-200">{error}</p>
        </div>
        <div className="mt-4">
          <SignIn reason="Request a fresh link and open it on this device." />
        </div>
      </div>
    );
  }

  // Landed here without a link — e.g. bookmarked, or already signed in.
  return (
    <div>
      {user ? (
        <div className="rounded-2xl border border-cream-golf/12 bg-fairway-800 p-5 text-center">
          <h2 className="font-display text-xl text-cream-golf">Already signed in</h2>
          <p className="mt-1.5 text-[0.85rem] text-cream-golf/65">{user.email}</p>
          <Link
            href="/golf/score/"
            className="mt-4 inline-block rounded-xl bg-cream-golf px-5 py-3 text-sm font-medium text-fairway-900"
          >
            Go to scoring
          </Link>
        </div>
      ) : (
        <SignIn />
      )}
    </div>
  );
}
