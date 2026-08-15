"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  announcementsSeenKey,
  markSeen,
  newestAt,
  sendTeamMessage,
  teamSeenKey,
  type Announcement,
} from "../lib/chat";
import { useAnonymousToken, useChatMessages } from "../lib/useChat";
import { EVENT } from "../lib/config";

/**
 * The player's side of support: announcements above, the thread with the
 * organizers below.
 *
 * The "text the organizer" link is not a fallback for a broken feature — it's
 * there because nobody can promise an organizer is watching a dashboard from a
 * cart. Anything urgent should take the fast path, and the screen says so
 * rather than implying someone is on the other end.
 */
export default function TeamMessages({
  teamId,
  teamName,
  announcements,
}: {
  teamId: string | null;
  teamName: string;
  announcements: Announcement[];
}) {
  const tokenFor = useAnonymousToken();
  const { messages, loading, error } = useChatMessages(teamId, tokenFor);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(
    () => [...announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [announcements]
  );

  // Opening the screen is what marks things read.
  useEffect(() => {
    if (!teamId || loading) return;
    const at = newestAt(messages);
    if (at) markSeen(teamSeenKey(teamId), at);
  }, [teamId, messages, loading]);

  useEffect(() => {
    const at = newestAt(sorted);
    if (at) markSeen(announcementsSeenKey, at);
  }, [sorted]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!teamId) return;
    setSending(true);
    setSendError("");
    try {
      await sendTeamMessage(teamId, teamName, draft);
      setDraft("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Couldn't send that.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="v3-screen chat-screen">
      <div className="v3-titlebar">
        <small>SUPPORT</small>
        <h2>Messages</h2>
        <p>Announcements and a direct line to the organizers</p>
      </div>

      <div className="chat-scroll">
        {sorted.length > 0 && (
          <div className="announce-list">
            <small className="chat-label">ANNOUNCEMENTS</small>
            {sorted.map((item) => (
              <article className="announce-card" key={item.id}>
                {item.title && <b>{item.title}</b>}
                <p>{item.body}</p>
                <time dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
              </article>
            ))}
          </div>
        )}

        <small className="chat-label">YOUR THREAD</small>

        {loading && <p className="chat-empty">Loading messages…</p>}
        {!loading && error && (
          <p className="chat-empty chat-error" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && messages.length === 0 && (
          <p className="chat-empty">
            No messages yet. Ask the organizers anything — scoring, timings, where the drinks
            cart is.
          </p>
        )}

        {messages.map((m) => (
          <div className={`chat-bubble ${m.from === "admin" ? "from-admin" : "from-team"}`} key={m.id}>
            <span className="chat-from">{m.from === "admin" ? m.author || "Organizer" : "You"}</span>
            <p>{m.body}</p>
            <time dateTime={m.createdAt}>{formatWhen(m.createdAt)}</time>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="chat-compose" onSubmit={send}>
        <label htmlFor="chat-body" className="sr-only">
          Message the organizers
        </label>
        <textarea
          id="chat-body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the organizers…"
          rows={1}
          maxLength={1000}
          disabled={!teamId}
        />
        <button disabled={sending || !draft.trim() || !teamId}>{sending ? "…" : "Send"}</button>
      </form>

      {sendError && (
        <p className="chat-send-error" role="alert">
          {sendError}
        </p>
      )}

      <p className="chat-urgent">
        Urgent? Nobody is guaranteed to be watching this mid-round —{" "}
        <a href={`tel:${EVENT.venue.phone.replace(/[^\d+]/g, "")}`}>call the clubhouse</a>.
      </p>
    </section>
  );
}

/** Times only — this app is used across a single afternoon. */
function formatWhen(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const sameDay = new Date().toDateString() === then.toDateString();
  return then.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    ...(sameDay ? {} : { month: "short", day: "numeric" }),
  });
}
