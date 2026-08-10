"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getAuthInstance } from "../../lib/firebase";
import { fsGetDoc } from "../../lib/firestoreRest";
import { ADMINS_COLLECTION, isOwnerEmail } from "./config";

export type AdminRole = "owner" | "admin" | "scorekeeper" | null;

export type AdminAuthState = {
  user: User | null;
  email: string | null;
  role: AdminRole;
  /** True once we know both who is signed in and whether they may organize. */
  ready: boolean;
};

/**
 * The signed-in organizer.
 *
 * Players never come through here — they redeem a team code and are signed in
 * anonymously, which is why `user.isAnonymous` counts as "not an organizer"
 * below rather than as signed out.
 *
 * Whatever this returns is a hint for the UI only. Every write is re-checked by
 * `firestore.rules`, which is the copy that can't be edited from a console.
 */
export function useAdminAuth(): AdminAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [roleResolved, setRoleResolved] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(getAuthInstance(), (next) => {
        setUser(next);
        setAuthResolved(true);
      });
    } catch {
      // Firebase isn't configured in this environment at all.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time bail-out when the SDK can't initialise
      setAuthResolved(true);
    }
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const email = user && !user.isAnonymous ? user.email?.toLowerCase() : null;
    if (!email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirroring Firebase Auth, an external store, into render state
      setRole(null);
      setRoleResolved(authResolved);
      return;
    }

    if (isOwnerEmail(email)) {
      setRole("owner");
      setRoleResolved(true);
      return;
    }

    let cancelled = false;
    setRoleResolved(false);
    void (async () => {
      const doc = await fsGetDoc(ADMINS_COLLECTION, email);
      if (cancelled) return;
      setRole(doc ? (doc.role === "scorekeeper" ? "scorekeeper" : "admin") : null);
      setRoleResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authResolved]);

  return useMemo(
    () => ({
      user,
      email: user && !user.isAnonymous ? (user.email ?? null) : null,
      role,
      ready: authResolved && roleResolved,
    }),
    [user, role, authResolved, roleResolved]
  );
}

/**
 * Sign an organizer in.
 *
 * Persistence is local so a scorekeeper who locks their phone between groups
 * isn't asked again — the alternative is retyping a password on a tee box.
 */
export async function signInOrganizer(email: string, password: string): Promise<User> {
  const auth = getAuthInstance();
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
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
export async function idToken(user: User | null): Promise<string> {
  if (!user) throw new Error("You've been signed out. Sign in again to continue.");
  return user.getIdToken();
}

/** Turns a Firebase auth error code into something worth reading. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string }).code ?? "";
  switch (code) {
    case "auth/invalid-api-key":
    case "auth/app-not-authorized":
      return "Sign-in isn't configured yet. Check the Firebase setup.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in isn't enabled in the Firebase console.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
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
