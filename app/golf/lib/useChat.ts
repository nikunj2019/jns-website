"use client";

import { useCallback, useEffect, useState } from "react";
import { fsListDocs } from "../../lib/firestoreRest";
import { mapMessage, messagesPath, readThread, type ChatMessage, type ChatThread } from "./chat";

/**
 * Chat messages for one team.
 *
 * Polled over authenticated REST rather than reused through
 * `useGolfCollection`, for a reason worth writing down: that hook reads
 * anonymously (the leaderboard is public) and its streaming path uses the
 * separate `golf-live` Firebase app, which has no auth attached. Chat is
 * private, so both of those would be refused.
 *
 * Polling only runs while the chat screen is mounted, and pauses when the phone
 * is asleep or the app is backgrounded — this runs for four hours on a battery
 * that also has to last the round.
 */

const OPEN_INTERVAL_MS = 8_000;
const BADGE_INTERVAL_MS = 45_000;
const THREADS_INTERVAL_MS = 30_000;

export type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
};

export function useChatMessages(teamId: string | null, tokenFor: () => Promise<string>): ChatState {
  const [state, setState] = useState<ChatState>({ messages: [], loading: true, error: null });

  useEffect(() => {
    if (!teamId) {
       
      setState({ messages: [], loading: false, error: null });
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const docs = await fsListDocs(messagesPath(teamId), await tokenFor());
        if (cancelled) return;
        const messages = docs
          .map(mapMessage)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setState({ messages, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          // Keep whatever is on screen; an empty thread and a failed read
          // should not look the same.
          error: prev.messages.length ? null : (err as Error).message,
        }));
      }
    };

    void load();
    timer = setInterval(() => void load(), OPEN_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [teamId, tokenFor]);

  return state;
}

/**
 * Just enough of the thread to drive an unread badge.
 *
 * One document read on a slow timer, rather than the whole message list — the
 * badge has to work while the player is on the score screen, and pulling every
 * message every minute for four hours to decide whether to show a dot would be
 * a poor trade.
 */
export function useThreadSummary(
  teamId: string | null,
  tokenFor: () => Promise<string>
): ChatThread | null {
  const [thread, setThread] = useState<ChatThread | null>(null);

  useEffect(() => {
    if (!teamId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing state when the subject goes away
      setThread(null);
      return;
    }
    let cancelled = false;

    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = await readThread(teamId, await tokenFor());
        if (!cancelled) setThread(next);
      } catch {
        /* Badge only — a failure here is not worth surfacing. */
      }
    };

    void load();
    const timer = setInterval(() => void load(), BADGE_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [teamId, tokenFor]);

  return thread;
}

/**
 * Every team thread, for the organizer side.
 *
 * Lifted out of the Messages screen so the sidebar can show a dot when a team
 * is waiting on a reply. An organizer sitting on the Scoring tab has no other
 * way to learn that a question arrived, and a support inbox nobody notices is
 * the same as not having one.
 */
export function useThreads(tokenFor: () => Promise<string>): {
  threads: ChatThread[];
  waiting: number;
  reload: () => Promise<void>;
} {
  const [threads, setThreads] = useState<ChatThread[]>([]);

  const reload = useCallback(async () => {
    try {
      const { listThreads } = await import("./chat");
      setThreads(await listThreads(await tokenFor()));
    } catch {
      /* Previews are a convenience; the threads themselves still open. */
    }
  }, [tokenFor]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches first; the update lands in a later tick
    void reload();
    const timer = setInterval(() => void reload(), THREADS_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  const waiting = threads.filter(
    (t) => t.lastFrom === "team" && t.lastAt > t.adminSeenAt
  ).length;

  return { threads, waiting, reload };
}

/** Stable token getter for anonymous players. */
export function useAnonymousToken(): () => Promise<string> {
  return useCallback(async () => {
    const { ensureAnonymousUser } = await import("./data");
    const user = await ensureAnonymousUser();
    return user.getIdToken();
  }, []);
}
