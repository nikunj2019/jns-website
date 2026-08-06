"use client";

import { useEffect, useState } from "react";
import { fsGetDoc } from "../../lib/firestoreRest";
import { EVENT, type GolfEvent } from "./event";

export const EVENT_COLLECTION = "golf-config";
export const EVENT_DOC = "event";

/**
 * The live event config, overlaid on the build-time defaults in `event.ts`.
 *
 * Reads are public (no token) and go over the REST helper, so this works on a
 * fully static page. Anything the organizer hasn't overridden in Firestore
 * simply falls through to the committed defaults — including when Firestore is
 * unreachable, which is why the outing details still render offline.
 */
export function useEvent(): { event: GolfEvent; loaded: boolean } {
  const [event, setEvent] = useState<GolfEvent>(EVENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fsGetDoc(EVENT_COLLECTION, EVENT_DOC)
      .then((doc) => {
        if (cancelled || !doc) return;
        setEvent((prev) => mergeEvent(prev, doc));
      })
      .catch(() => {
        /* Offline or unconfigured — the committed defaults stand. */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { event, loaded };
}

/** Shallow-merge stored fields over defaults, ignoring null/undefined. */
function mergeEvent(base: GolfEvent, doc: Record<string, unknown>): GolfEvent {
  const next: GolfEvent = { ...base };
  for (const [key, value] of Object.entries(doc)) {
    if (key === "id" || value === null || value === undefined) continue;
    if (!(key in base)) continue;
    const current = (base as unknown as Record<string, unknown>)[key];
    if (
      typeof current === "object" &&
      current !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      (next as unknown as Record<string, unknown>)[key] = {
        ...(current as object),
        ...(value as object),
      };
    } else {
      (next as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}
