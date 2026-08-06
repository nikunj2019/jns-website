"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { daysUntil } from "../lib/event";
import { useEvent } from "../lib/useEvent";

/** Today's date is a client-only fact; the server has no meaningful answer. */
const noopSubscribe = () => () => {};

/**
 * The card at the top of the home screen: a countdown before the outing, a live
 * banner during it, and a link to final results afterwards.
 *
 * Rendered client-side because the countdown depends on today's date — a
 * statically exported "42 days to go" would be wrong the moment it shipped.
 */
export default function EventStatusCard() {
  const { event } = useEvent();
  const days = useSyncExternalStore(
    noopSubscribe,
    () => daysUntil(event.date),
    () => null
  );

  if (event.status === "live") {
    return (
      <Link
        href="/golf/leaderboard/"
        className="flex items-center gap-3 rounded-2xl border border-brass/40 bg-gradient-to-r from-fairway-700 to-fairway-800 p-4 transition-colors hover:border-brass/70"
      >
        <span className="glow-pulse h-2.5 w-2.5 shrink-0 rounded-full bg-green-400" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-[0.62rem] uppercase tracking-[0.18em] text-brass">
            Live Now
          </span>
          <span className="font-display mt-0.5 block text-lg text-cream-golf">
            Scores are updating
          </span>
        </span>
        <span className="text-sm text-cream-golf/60">View →</span>
      </Link>
    );
  }

  if (event.status === "final") {
    return (
      <Link
        href="/golf/leaderboard/"
        className="flex items-center gap-3 rounded-2xl border border-cream-golf/15 bg-fairway-800 p-4 transition-colors hover:border-brass/50"
      >
        <span className="flex-1">
          <span className="block text-[0.62rem] uppercase tracking-[0.18em] text-brass">
            Final Results
          </span>
          <span className="font-display mt-0.5 block text-lg text-cream-golf">
            See how it finished
          </span>
        </span>
        <span className="text-sm text-cream-golf/60">View →</span>
      </Link>
    );
  }

  // Upcoming. Render a neutral shell until the client has resolved "today", so
  // the prerendered HTML never shows a stale day count.
  return (
    <div className="rounded-2xl border border-cream-golf/12 bg-fairway-800 p-4 text-center">
      {days === null ? (
        <p className="font-display text-lg text-cream-golf/70">Save the date</p>
      ) : days > 1 ? (
        <p className="font-display text-lg text-cream-golf">
          <span className="golf-nums text-brass-soft">{days}</span> days until tee off
        </p>
      ) : days === 1 ? (
        <p className="font-display text-lg text-cream-golf">Tomorrow — see you on the first tee</p>
      ) : days === 0 ? (
        <p className="font-display text-lg text-cream-golf">Today&rsquo;s the day. Play well.</p>
      ) : (
        <p className="font-display text-lg text-cream-golf/70">Until next year</p>
      )}
    </div>
  );
}
