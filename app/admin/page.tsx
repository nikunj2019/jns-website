"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAuthInstance } from "../lib/firebase";

const INPUT_CLASS =
  "w-full border border-slate-line bg-white px-4 py-3 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(getAuthInstance(), email, password);
      router.push("/admin/results");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/invalid-api-key" || code === "auth/app-not-authorized") {
        setError("Firebase not configured. Check GitHub secrets and redeploy.");
      } else if (code === "auth/operation-not-allowed") {
        setError("Email/Password sign-in is not enabled in Firebase Console.");
      } else if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Incorrect email or password.");
      } else {
        setError(code || "Sign-in failed. Check console for details.");
        console.error("Admin login error:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-ivory rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" aria-label="JNS Consulting, Home">
            <span className="relative inline-block" style={{ width: 56, height: 56 }}>
              <Image
                src="/jns-logo.png"
                alt="JNS Consulting"
                fill
                sizes="56px"
                className="scale-[1.45] object-contain"
                priority
              />
            </span>
          </Link>
        </div>

        <p className="brand-eyebrow text-center text-slate mb-2">Admin</p>
        <h1 className="font-display text-2xl text-navy text-center mb-8">
          Sign in to access results
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={INPUT_CLASS}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-ivory px-4 py-3 text-sm font-medium rounded-full transition-all hover:bg-navy-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
