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
 * It needs no team and no code: announcements are world-readable and this
 * renders above the whole app, so a phone that has never joined a foursome —
 * a spectator, an organizer's spouse, someone who only ever opened the link —
 * gets "play is suspended" the same as everyone else.
 *
 * Three things keep it from becoming an obstacle:
 *
 *   - A device opening the app for the first time treats what's already posted
 *     as history, so installing mid-round doesn't replay the morning. The one
 *     exception is a notice from the last couple of hours, which is far more
 *     likely to be live than archival — that still takes the screen, and only
 *     that one, so a late arrival learns about the rain delay without sitting
 *     through the welcome message.
 *   - One at a time, oldest first, so a burst of three is read in order rather
 *     than collapsing into whichever arrived last.
 *   - It never auto-dismisses and can't be tapped through, because the whole
 *     point is that someone saw it. Dismissing is a deliberate act.
 *
 * Nothing is lost by dismissing: everything stays on the Messages screen.
 */

/** How recent a notice has to be for a first-time device to still be shown it. */
const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;
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

  // Establish the baseline once, from what is already posted.
  useEffect(() => {
    const stored = lastSeen(announcementsSeenKey);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding from localStorage, which isn't readable during render
      setSeenAt(stored);
      return;
    }

    const sorted = [...announcements].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const newest = sorted[sorted.length - 1];
    const cutoff = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();

    // A recent notice is far more likely to be in force than archival, so the
    // baseline stops just short of it and the newcomer sees that one. Anything
    // older than the window — and everything behind the newest either way — is
    // adopted as read.
    const baseline =
      newest && newest.createdAt > cutoff
        ? sorted[sorted.length - 2]?.createdAt ?? ""
        : newest?.createdAt ?? "";

    if (baseline) markSeen(announcementsSeenKey, baseline);
    setSeenAt(baseline);
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
      className="takeover takeover-full"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="takeover-title"
      aria-describedby="takeover-body"
    >
      <div className="takeover-card announce-full">
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
