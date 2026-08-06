"use client";

import { useCallback, useEffect, useState } from "react";
import {
  browserLocalPersistence,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailLink,
  signOut,
  type User,
} from "firebase/auth";
import { getAuthInstance } from "../../lib/firebase";

/** Where the magic link lands. Must be on the Firebase project's authorized domains. */
export const AUTH_LANDING_PATH = "/golf/auth/";

/** Firebase's flow requires the address to be re-supplied on the landing page. */
const EMAIL_KEY = "golf:signInEmail";

export type AuthState = {
  user: User | null;
  email: string | null;
  loading: boolean;
};

/**
 * The signed-in player or organizer.
 *
 * Persistence is `browserLocal`, so signing in once at home carries through the
 * whole round — which matters, because the magic-link email is the one part of
 * this flow that needs a working data connection.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(getAuthInstance(), (next) => {
        setUser(next);
        setLoading(false);
      });
    } catch {
      // Firebase isn't configured in this environment.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time bail-out when the SDK can't initialise at all
      setLoading(false);
    }
    return () => unsubscribe();
  }, []);

  return { user, email: user?.email ?? null, loading };
}

/** Sends the sign-in link. Stores the address so the landing page can complete it. */
export async function sendMagicLink(email: string): Promise<void> {
  const auth = getAuthInstance();
  await setPersistence(auth, browserLocalPersistence);
  await sendSignInLinkToEmail(auth, email, {
    url: `${window.location.origin}${AUTH_LANDING_PATH}`,
    handleCodeInApp: true,
  });
  window.localStorage.setItem(EMAIL_KEY, email);
}

export function storedEmail(): string | null {
  try {
    return window.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function clearStoredEmail(): void {
  try {
    window.localStorage.removeItem(EMAIL_KEY);
  } catch {
    /* Private browsing — nothing to clear. */
  }
}

export function isMagicLink(url: string): boolean {
  try {
    return isSignInWithEmailLink(getAuthInstance(), url);
  } catch {
    return false;
  }
}

/**
 * Completes the sign-in.
 *
 * `email` has to be supplied because the link may be opened on a different
 * device from the one that requested it — in which case localStorage is empty
 * and the landing page asks for the address again. That confirmation step is
 * also what stops a leaked link from being usable by whoever intercepted it.
 */
export async function completeMagicLink(email: string, url: string): Promise<User> {
  const auth = getAuthInstance();
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithEmailLink(auth, email, url);
  clearStoredEmail();
  return credential.user;
}

export function useSignOut() {
  return useCallback(async () => {
    try {
      await signOut(getAuthInstance());
    } catch {
      /* Already signed out. */
    }
  }, []);
}

/** Fresh ID token for authenticated Firestore REST calls. */
export async function idToken(user: User | null): Promise<string | undefined> {
  if (!user) return undefined;
  try {
    return await user.getIdToken();
  } catch {
    return undefined;
  }
}

/** Turns a Firebase auth error code into something worth reading. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string }).code ?? "";
  switch (code) {
    case "auth/invalid-api-key":
    case "auth/app-not-authorized":
      return "Sign-in isn't configured yet. Check the Firebase setup.";
    case "auth/operation-not-allowed":
      return "Email link sign-in isn't enabled in the Firebase console.";
    case "auth/unauthorized-continue-uri":
      return "This domain isn't on the Firebase authorized domains list.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/invalid-action-code":
    case "auth/expired-action-code":
      return "That link has expired or was already used. Request a new one.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/network-request-failed":
      return "No connection. Try again when you have signal.";
    default:
      return code || "Something went wrong. Try again.";
  }
}
