"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import AdminDashboard from "./AdminDashboard";
import {
  authErrorMessage,
  sendVerificationEmail,
  signInOrganizer,
  signInWithGoogle,
  useAdminAuth,
  useSignOut,
} from "../lib/useAuth";

/**
 * The organizer entrance.
 *
 * This is a static export, so this gate is presentation only — it decides what
 * to render, not what anyone is allowed to do. The real check is in
 * `firestore.rules`, which runs on Google's servers and refuses the write
 * regardless of what this page chose to show.
 *
 * (The version this replaced trusted an `oai-authenticated-user-email` request
 * header. That worked because OpenAI's dispatch layer injected it and stripped
 * client copies; on Firebase Hosting nothing strips it, so it would have been a
 * header away from a full admin bypass.)
 */
export default function AdminPage() {
  const { user, email, role, ready } = useAdminAuth();

  if (!ready) {
    return (
      <main className="admin-denied">
        <div className="admin-login-card">
          <span className="admin-shield">S</span>
          <p>Checking your access…</p>
        </div>
      </main>
    );
  }

  if (!user || !email) return <OrganizerSignIn />;
  // Checked before the allowlist, because the rules check it too: an
  // unverified organizer is refused by Firestore whatever this page decides,
  // and "Access not assigned" would be a misleading way to say so.
  if (!user.emailVerified) return <VerifyEmail user={user} email={email} />;
  if (!role) return <NotAssigned email={email} />;

  return <AdminDashboard user={user} email={email} role={role} />;
}

function OrganizerSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function google() {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInOrganizer(email, password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-denied">
      <div className="admin-login-card">
        <span className="admin-shield">S</span>
        <small>STONEGATE GOLF ADMIN</small>
        <h1>Organizer sign-in</h1>
        <p>Use the Google account your outing address is on. No password to remember.</p>

        <button className="google-signin" onClick={google} disabled={busy}>
          <svg viewBox="0 0 18 18" aria-hidden="true" width="17" height="17">
            <path
              fill="#4285F4"
              d="M17.6 9.2c0-.6-.05-1.2-.16-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"
            />
            <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z" />
            <path
              fill="#EA4335"
              d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"
            />
          </svg>
          {busy ? "Signing in…" : "Continue with Google"}
        </button>

        {error && <em role="alert">{error}</em>}

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword((v) => !v)}
        >
          {showPassword ? "Hide password sign-in" : "Use a password instead"}
        </button>
        <a className="back-link" href="/golf/">
          Return to golf app
        </a>
      </div>

      {showPassword && (
        <form className="admin-login-card password-card" onSubmit={submit}>
          <p>For organizers without a Google account.</p>

          <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

          <button disabled={busy || !email || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
    </main>
  );
}

/**
 * Signed in, but the address isn't verified — so `firestore.rules` will refuse
 * every write regardless of the allowlist.
 *
 * This screen exists because the console can create an organizer account but
 * cannot mark it verified, which used to leave the account permanently stuck
 * with nothing on screen explaining why.
 */
function VerifyEmail({ user, email }: { user: User; email: string }) {
  const signOut = useSignOut();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    setError("");
    try {
      await sendVerificationEmail(user);
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-denied">
      <div className="admin-login-card">
        <span className="admin-shield">S</span>
        <small>STONEGATE GOLF ADMIN</small>
        <h1>Verify your email</h1>
        <p>
          You&rsquo;re signed in as <b>{email}</b>, but that address hasn&rsquo;t been verified.
          Scoring and team management stay locked until it is.
        </p>

        {sent ? (
          <p className="admin-hint">
            Link sent. Open it from this device, then reload this page. Check spam if it
            doesn&rsquo;t arrive within a minute.
          </p>
        ) : (
          <button onClick={send} disabled={busy}>
            {busy ? "Sending…" : "Send me the verification link"}
          </button>
        )}

        {error && <em role="alert">{error}</em>}

        <button onClick={() => window.location.reload()}>I&rsquo;ve verified — reload</button>
        <p className="admin-hint">
          Signing in with Google avoids this entirely — Google accounts arrive verified.
        </p>
        <button onClick={() => void signOut()}>Use another account</button>
        <a className="back-link" href="/golf/">
          Return to golf app
        </a>
      </div>
    </main>
  );
}

function NotAssigned({ email }: { email: string }) {
  const signOut = useSignOut();
  return (
    <main className="admin-denied">
      <div className="admin-login-card">
        <span className="admin-shield">S</span>
        <small>STONEGATE GOLF ADMIN</small>
        <h1>Access not assigned</h1>
        <p>
          You signed in as <b>{email}</b>, but that address is not on the administrator list.
        </p>
        <p className="admin-hint">
          If you were just added, your email also has to be verified before access takes effect.
        </p>
        <button onClick={() => void signOut()}>Use another email</button>
        <a className="back-link" href="/golf/">
          Return to golf app
        </a>
      </div>
    </main>
  );
}
