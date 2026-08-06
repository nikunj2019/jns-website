"use client";

import { useState } from "react";
import { authErrorMessage, sendMagicLink } from "../lib/useAuth";
import { MailIcon } from "./icons";

/**
 * Passwordless sign-in for players.
 *
 * We nudge people to do this before they leave the house: the link arrives by
 * email, which is the one step here that needs a working data connection, and
 * course cell service is unreliable. Once signed in the session persists.
 */
export default function SignIn({ reason }: { reason?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-brass/30 bg-brass/8 p-5 text-center">
        <h2 className="font-display text-xl text-cream-golf">Check your email</h2>
        <p className="mx-auto mt-2 max-w-xs text-[0.88rem] leading-relaxed text-cream-golf/75">
          We sent a sign-in link to <span className="text-cream-golf">{email}</span>. Tap it on
          this phone and you&rsquo;ll be signed in.
        </p>
        <p className="mt-3 text-[0.75rem] leading-relaxed text-cream-golf/45">
          It can land in spam, and it may take a minute. Worth doing before you leave for the
          course — signal there is patchy.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-[0.78rem] text-cream-golf/60 underline underline-offset-4 hover:text-cream-golf"
        >
          Use a different address
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cream-golf/12 bg-fairway-800 p-5">
      <h2 className="font-display text-xl text-cream-golf">Sign in to score</h2>
      <p className="mt-2 text-[0.88rem] leading-relaxed text-cream-golf/70">
        {reason ??
          "Use the email address Curtis has for you. No password — we'll send a link."}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="golf-email" className="sr-only">
            Email address
          </label>
          <input
            id="golf-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-cream-golf/20 bg-fairway-900 px-4 py-3.5 text-base text-cream-golf placeholder-cream-golf/35 transition-colors focus:border-brass focus:outline-none"
          />
        </div>

        {error && <p className="text-[0.82rem] text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={sending}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-cream-golf px-4 py-3.5 text-sm font-medium text-fairway-900 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <MailIcon size={17} />
          {sending ? "Sending…" : "Send me a sign-in link"}
        </button>
      </form>

      <p className="mt-3 text-[0.72rem] leading-relaxed text-cream-golf/40">
        Not on a team yet? Ask Curtis to add you — scoring is limited to your own foursome.
      </p>
    </div>
  );
}
