"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeFirestore, type Firestore } from "firebase/firestore";

/**
 * A Firestore instance configured for streaming, used only by the golf app's
 * live leaderboard.
 *
 * The rest of the site talks to Firestore over plain REST (see
 * app/lib/firestoreRest.ts, which notes that gRPC-Web/WebChannel was a problem).
 * `experimentalAutoDetectLongPolling` is the documented remedy: the SDK probes
 * the connection and drops to long polling when a streaming transport won't hold
 * — which describes a lot of course wifi. If it still can't connect,
 * useGolfCollection falls back to REST polling, so this is best-effort by design.
 *
 * Kept separate from app/lib/firebase.ts so the marketing site's `getFirestore`
 * call and this one never race to initialise the same instance with different
 * settings, which Firestore treats as an error.
 */

const APP_NAME = "golf-live";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

let db: Firestore | undefined;

export function getGolfDb(): Firestore {
  if (db) return db;

  const existing = getApps().find((a) => a.name === APP_NAME);
  const app: FirebaseApp = existing ?? initializeApp(firebaseConfig, APP_NAME);

  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
  return db;
}
