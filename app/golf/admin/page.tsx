"use client";

import { useState } from "react";
import AdminDashboard from "./AdminDashboard";
import { authErrorMessage, signInOrganizer, useAdminAuth, useSignOut } from "../lib/useAuth";

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
  if (!role) return <NotAssigned email={email} />;

  return <AdminDashboard user={user} email={email} role={role} />;
}

function OrganizerSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      <form className="admin-login-card" onSubmit={submit}>
        <span className="admin-shield">S</span>
        <small>STONEGATE GOLF ADMIN</small>
        <h1>Organizer sign-in</h1>
        <p>Use the email and password set up for you in the Firebase console.</p>

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

        {error && <em role="alert">{error}</em>}

        <button disabled={busy || !email || !password}>{busy ? "Signing in…" : "Sign in"}</button>
        <a className="back-link" href="/golf/">
          Return to golf app
        </a>
      </form>
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
