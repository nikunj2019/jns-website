"use client";

import { useEffect, useRef, useState } from "react";
import { fsListDocs } from "../../lib/firestoreRest";

const POLL_INTERVAL_MS = 20_000;
/** How long to give the realtime listener before falling back to polling. */
const SNAPSHOT_GRACE_MS = 6_000;

export type CollectionState<T> = {
  docs: T[];
  loading: boolean;
  error: string | null;
  /** True while a realtime listener is delivering updates. */
  live: boolean;
};

/**
 * A live view of a public Firestore collection.
 *
 * Tries the SDK's `onSnapshot` first — a leaderboard that updates the instant a
 * score is entered is the whole point. But this repo already reaches Firestore
 * over plain REST with a note that gRPC-Web/WebChannel was a problem here, and
 * course wifi is exactly the kind of network that breaks streaming transports.
 * So the listener is given a grace period, and anything that fails or stalls
 * falls back to polling the REST helper. Either way the same data arrives; the
 * only difference is latency, surfaced as the `live` flag.
 */
export function useGolfCollection<T>(
  collection: string,
  map: (doc: Record<string, unknown>) => T,
  { enabled = true }: { enabled?: boolean } = {}
): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    docs: [],
    loading: true,
    error: null,
    live: false,
  });

  // Keep the mapper out of the effect's dependencies: callers usually pass an
  // inline function, which would otherwise restart the listener every render.
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!enabled) {
      setState({ docs: [], loading: false, error: null, live: false });
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let graceTimer: ReturnType<typeof setTimeout> | null = null;
    let gotSnapshot = false;

    const apply = (docs: Record<string, unknown>[], live: boolean) => {
      if (cancelled) return;
      setState({ docs: docs.map((d) => mapRef.current(d)), loading: false, error: null, live });
    };

    const poll = async () => {
      try {
        const docs = await fsListDocs(collection, "");
        apply(docs, false);
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          // Keep whatever we last had rather than blanking the screen — stale
          // scores beat an empty leaderboard when someone loses signal.
          error: prev.docs.length ? null : (err as Error).message,
        }));
      }
    };

    const startPolling = () => {
      if (pollTimer) return;
      void poll();
      pollTimer = setInterval(poll, POLL_INTERVAL_MS);
    };

    (async () => {
      // An immediate REST read gets content on screen fast, regardless of
      // whether the streaming listener ends up connecting.
      void poll();

      try {
        const [{ collection: coll, onSnapshot }, { getGolfDb }] = await Promise.all([
          import("firebase/firestore"),
          import("./firestoreLive"),
        ]);
        if (cancelled) return;

        unsubscribe = onSnapshot(
          coll(getGolfDb(), collection),
          (snap) => {
            if (cancelled) return;

            // With no connection the SDK still fires immediately, serving an
            // empty result from its local cache. Taking that at face value
            // would blank a leaderboard that REST had just populated — so a
            // cached-and-empty snapshot is treated as "no answer yet", not as
            // "there are no teams".
            if (snap.metadata.fromCache && snap.empty) {
              startPolling();
              return;
            }

            gotSnapshot = true;
            const fresh = !snap.metadata.fromCache;
            // Only stand down the poller once the server has actually answered.
            if (fresh && pollTimer) {
              clearInterval(pollTimer);
              pollTimer = null;
            }
            apply(
              snap.docs.map((d) => ({ id: d.id, ...d.data() })),
              fresh
            );
          },
          () => {
            // Listener rejected or dropped — polling covers it.
            if (cancelled) return;
            setState((prev) => ({ ...prev, live: false }));
            startPolling();
          }
        );

        graceTimer = setTimeout(() => {
          if (!gotSnapshot && !cancelled) startPolling();
        }, SNAPSHOT_GRACE_MS);
      } catch {
        if (!cancelled) startPolling();
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (pollTimer) clearInterval(pollTimer);
      if (graceTimer) clearTimeout(graceTimer);
    };
  }, [collection, enabled]);

  return state;
}
