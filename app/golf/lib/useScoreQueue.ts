"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { holeKey, saveHoleScore } from "./data";

export type SaveStatus = "idle" | "saving" | "saved" | "queued";

/**
 * Outgoing hole scores, held until Firestore confirms them.
 *
 * The original app debounced a single `useEffect` that read the current hole
 * out of component state when the timer fired. Tapping a score and swiping to
 * the next hole inside the debounce window therefore sent the *new* hole's
 * value — usually an unplayed 0, which the server rejected — and silently
 * dropped the score just entered. Here each edit is captured as a
 * `{hole, strokes}` pair the moment it happens, so what gets written is what
 * was tapped.
 *
 * The queue is mirrored into localStorage, which is what makes the "queued"
 * badge honest: a player who loses signal on the twelfth, locks their phone
 * and reopens the app in the clubhouse still has those strokes waiting to go,
 * and they flush as soon as the network returns.
 */

const FLUSH_DELAY_MS = 650;
const RETRY_DELAY_MS = 15_000;
const storageKey = (teamId: string) => `stonegate:pending-scores:${teamId}`;

function readStored(teamId: string): Map<number, number> {
  try {
    const raw = window.localStorage.getItem(storageKey(teamId));
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, number>;
    return new Map(
      Object.entries(parsed)
        .map(([hole, strokes]) => [Number(hole), Number(strokes)] as const)
        .filter(([hole, strokes]) => Number.isInteger(hole) && Number.isInteger(strokes))
    );
  } catch {
    return new Map();
  }
}

function writeStored(teamId: string, pending: Map<number, number>): void {
  try {
    if (pending.size === 0) {
      window.localStorage.removeItem(storageKey(teamId));
      return;
    }
    window.localStorage.setItem(
      storageKey(teamId),
      JSON.stringify(Object.fromEntries(pending))
    );
  } catch {
    /* Private browsing — the queue stays in memory for this session only. */
  }
}

export type ScoreQueue = {
  /** Record a hole. Applies immediately on screen, then syncs. */
  save: (hole: number, strokes: number) => void;
  /** Unsynced strokes, keyed `h1`…`h18`, to overlay on the server's copy. */
  pending: Record<string, number>;
  status: SaveStatus;
};

export function useScoreQueue(teamId: string | null): ScoreQueue {
  const queue = useRef<Map<number, number>>(new Map());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlight = useRef(false);
  const [pending, setPending] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<SaveStatus>("idle");

  const publish = useCallback(() => {
    const next: Record<string, number> = {};
    for (const [hole, strokes] of queue.current) next[holeKey(hole)] = strokes;
    setPending(next);
    if (teamId) writeStored(teamId, queue.current);
  }, [teamId]);

  const flush = useCallback(async () => {
    if (!teamId || inFlight.current) return;
    if (queue.current.size === 0) return;

    inFlight.current = true;
    setStatus("saving");

    // Snapshot the queue: anything the player taps mid-flush stays behind for
    // the next pass rather than being marked sent.
    const batch = [...queue.current.entries()];
    let failed = false;

    for (const [hole, strokes] of batch) {
      try {
        await saveHoleScore(teamId, hole, strokes);
        // Only drop it if the value hasn't changed again since we started.
        if (queue.current.get(hole) === strokes) queue.current.delete(hole);
      } catch {
        failed = true;
        break;
      }
    }

    inFlight.current = false;
    publish();
    setStatus(queue.current.size === 0 && !failed ? "saved" : "queued");
  }, [teamId, publish]);

  const save = useCallback(
    (hole: number, strokes: number) => {
      queue.current.set(hole, strokes);
      publish();
      setStatus("saving");
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => void flush(), FLUSH_DELAY_MS);
    },
    [flush, publish]
  );

  // Adopt anything left over from a previous session on this device.
  useEffect(() => {
    if (!teamId) {
      queue.current = new Map();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage, an external store, on team change
      setPending({});
      setStatus("idle");
      return;
    }
    queue.current = readStored(teamId);
    const restored: Record<string, number> = {};
    for (const [hole, strokes] of queue.current) restored[holeKey(hole)] = strokes;
    setPending(restored);
    setStatus(queue.current.size > 0 ? "queued" : "idle");
    if (queue.current.size > 0) void flush();
  }, [teamId, flush]);

  /**
   * Retry whenever there's a plausible reason to think it'll work now: the
   * network came back, the player reopened the app, or enough time has passed
   * that a flaky connection may have settled. Far better than the single fixed
   * timer this used to have, since a phone in a pocket on the back nine gets
   * no timers but does get a `visibilitychange` when it comes back out.
   */
  useEffect(() => {
    const retry = () => {
      if (queue.current.size > 0) void flush();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") retry();
    };
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", onVisible);
    retryTimer.current = setInterval(retry, RETRY_DELAY_MS);
    return () => {
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", onVisible);
      if (retryTimer.current) clearInterval(retryTimer.current);
    };
  }, [flush]);

  useEffect(
    () => () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    },
    []
  );

  return { save, pending, status };
}
