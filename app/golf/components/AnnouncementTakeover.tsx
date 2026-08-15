"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { announcementsSeenKey, lastSeen, markSeen, type Announcement } from "../lib/chat";

/**
 * A new announcement, full screen until it's acknowledged.
 *
 * Announcements are the one thing here that can't afford to be missed — "play
 * is suspended", "shotgun moved to 9:30". A badge is the right weight for a
 * chat reply and the wrong weight for that, so this takes the screen and stays
 * until the player dismisses it. Nothing else in the app behaves this way.
 *
 * Three things keep it from becoming an obstacle:
 *
 *   - It only fires for announcements posted *after* this device first opened
 *     the app. Installing mid-round doesn't replay a morning's notices.
 *   - One at a time, oldest first, so a burst of three is read in order rather
 *     than collapsing into whichever arrived last.
 *   - It never auto-dismisses and can't be tapped through, because the whole
 *     point is that someone saw it. Dismissing is a deliberate act.
 *
 * Nothing is lost by dismissing: everything stays on the Messages screen.
 */
export default function AnnouncementTakeover({
  announcements,
  onOpenMessages,
  onVisibilityChange,
}: {
  announcements: Announcement[];
  onOpenMessages: () => void;
  onVisibilityChange?: (showing: boolean) => void;
}) {
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const dismissRef = useRef<HTMLButtonElement | null>(null);

  // Establish the baseline once. A device opening the app for the first time
  // adopts whatever is already posted as "seen" — those are history, not news.
  useEffect(() => {
    const stored = lastSeen(announcementsSeenKey);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding from localStorage, which isn't readable during render
      setSeenAt(stored);
      return;
    }
    const newest = announcements.reduce((max, a) => (a.createdAt > max ? a.createdAt : max), "");
    if (newest) markSeen(announcementsSeenKey, newest);
    setSeenAt(newest || new Date().toISOString());
  }, [announcements]);

  const pending = useMemo(() => {
    if (seenAt === null) return [];
    return announcements
      .filter((a) => a.createdAt > seenAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [announcements, seenAt]);

  const current = pending[0] ?? null;

  useEffect(() => {
    onVisibilityChange?.(!!current);
  }, [current, onVisibilityChange]);

  // Move focus to the dismiss button so a screen reader lands on the way out,
  // and a keyboard user isn't stranded behind the overlay.
  useEffect(() => {
    if (current) dismissRef.current?.focus();
  }, [current]);

  if (!current) return null;

  const dismiss = () => {
    markSeen(announcementsSeenKey, current.createdAt);
    setSeenAt(current.createdAt);
  };

  const remaining = pending.length - 1;

  return (
    <div
      className="takeover"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="takeover-title"
      aria-describedby="takeover-body"
    >
      <div className="takeover-card">
        <span className="takeover-kicker">ANNOUNCEMENT</span>
        <h2 id="takeover-title">{current.title || "From the organizers"}</h2>
        <p id="takeover-body">{current.body}</p>
        <time dateTime={current.createdAt}>{formatWhen(current.createdAt)}</time>

        <button ref={dismissRef} className="takeover-dismiss" onClick={dismiss}>
          {remaining > 0 ? `Got it — ${remaining} more` : "Got it"}
        </button>

        <button
          className="takeover-secondary"
          onClick={() => {
            dismiss();
            onOpenMessages();
          }}
        >
          Read all messages
        </button>
      </div>
    </div>
  );
}

function formatWhen(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  return then.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
