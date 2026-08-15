"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT, SPONSORS } from "../lib/config";

/** Show a card once for every this-many holes completed. */
export const HOLES_PER_AD = 3;

/**
 * The card holds for five seconds before it can be closed, then clears itself.
 *
 * The delay is the sponsor's whole placement — a card that can be dismissed on
 * arrival is worth nothing to them. Five seconds is roughly how long the copy
 * takes to read, and the bar across the top counts it down so the wait reads as
 * deliberate rather than as a missing button.
 *
 * The auto-dismiss then has to sit well clear of it: at the old seven seconds
 * the close button would have appeared for two, which is the worst of both.
 */
const CLOSE_AFTER_MS = 5000;
const DISMISS_AFTER_MS = 12000;
const storageKey = (teamId: string) => `stonegate:last-ad-milestone:${teamId}`;

type Slot = {
  key: string;
  kicker: string;
  logo: string;
  alt: string;
  /** Trading name, spelled out — several of these logos are stylised. */
  name: string;
  city?: string;
  blurb?: string;
  href?: string;
  hrefLabel?: string;
};

/**
 * Who gets a slot, in order.
 *
 * JNS leads because it is the technology partner and this is its app; the
 * sponsors follow in the order the event lists them. The starting point is
 * offset per team (below), so leading the array is not the same as always
 * being seen first.
 */
const SLOTS: Slot[] = [
  {
    key: "jns",
    kicker: "OFFICIAL TECHNOLOGY PARTNER",
    logo: "/golf/jns-logo.png",
    alt: "JNS — Smart Solutions, Built for You",
    name: "JNS",
    blurb: "Custom applications, AI and automation for growing businesses.",
    href: "https://jnssolutions.ai",
    hrefLabel: "jnssolutions.ai",
  },
  ...SPONSORS.map((s) => ({
    key: s.name,
    kicker: "PROUD SPONSOR",
    logo: s.logo,
    alt: s.name,
    name: s.name,
    city: s.city,
    blurb: s.blurb,
    href: s.site ? `https://${s.site}` : undefined,
    hrefLabel: s.site,
  })),
];

/**
 * Deterministic offset per team.
 *
 * Rotating from a fixed start would show every foursome the same sponsor on
 * their third hole and, with six milestones over eighteen holes against a
 * longer roster, would mean the ones at the end of the list were never seen at
 * all. Seeding from the team id spreads the field across the roster while
 * staying stable for a given team — the same group never gets a reshuffle
 * halfway round, and there is no randomness to desynchronise team-mates.
 */
function offsetFor(teamId: string): number {
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < teamId.length; i++) {
    h ^= teamId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Avalanche before the modulo. Without it only the low bits matter, and ids
  // that share a prefix — which Firestore's do — collide onto the same offset:
  // a plain `h * 31 + c` put four of six test teams on the same sponsor.
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) % SLOTS.length;
}

function readMilestone(teamId: string): number {
  try {
    return Number(window.localStorage.getItem(storageKey(teamId))) || 0;
  } catch {
    return 0;
  }
}

function writeMilestone(teamId: string, value: number): void {
  try {
    window.localStorage.setItem(storageKey(teamId), String(value));
  } catch {
    /* Private browsing — the card may reappear after a reload. */
  }
}

/**
 * The sponsor card, shown full screen after every third hole a team completes.
 *
 * Four things it deliberately does. It never covers the score control
 * mid-entry — it appears only when a hole is *completed*. It holds for five
 * seconds before it can be closed, which is the sponsor's actual placement,
 * then clears itself so a group walking to the next tee isn't left holding it.
 * It fires once per milestone, remembered per team in localStorage, so
 * correcting a score on the ninth doesn't re-trigger a card someone already
 * saw. And it advances one slot each time, so a round shows a different
 * sponsor at each break rather than the same logo six times.
 *
 * `thru` counts holes with a score, not the hole number: a shotgun start means
 * a team starting on 12 hits their third completed hole on 14.
 */
export default function Interstitial({ teamId, thru }: { teamId: string | null; thru: number }) {
  const [milestone, setMilestone] = useState<number | null>(null);
  const [closable, setClosable] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seen = useRef<number>(0);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    if (!teamId) return;
    seen.current = readMilestone(teamId);
  }, [teamId]);

  useEffect(() => {
    if (!teamId || thru < HOLES_PER_AD) return;

    const reached = Math.floor(thru / HOLES_PER_AD) * HOLES_PER_AD;
    if (reached <= seen.current) return;

    seen.current = reached;
    writeMilestone(teamId, reached);
    setMilestone(reached);
    setClosable(false);

    clearTimers();
    timers.current.push(
      setTimeout(() => setClosable(true), CLOSE_AFTER_MS),
      setTimeout(() => setMilestone(null), DISMISS_AFTER_MS)
    );
  }, [teamId, thru]);

  useEffect(() => clearTimers, []);

  const dismiss = () => {
    clearTimers();
    setMilestone(null);
  };

  if (milestone === null || !teamId) return null;

  // Which break this is — the 3rd hole is break 0, the 6th break 1, and so on.
  const step = milestone / HOLES_PER_AD - 1;
  const slot = SLOTS[(offsetFor(teamId) + step) % SLOTS.length];

  return (
    <div className="ad-full" role="status">
      {/* Drains over the five seconds. Without it the missing close button
          reads as a bug rather than as a pause with an end in sight. */}
      {!closable && (
        <div
          className="ad-hold"
          aria-hidden="true"
          // Driven from the same constant as the timer above rather than a
          // duration repeated in the stylesheet, so the bar can't finish
          // draining a second before or after the button actually appears.
          style={{ animationDuration: `${CLOSE_AFTER_MS}ms` }}
        />
      )}

      {closable && (
        <button className="ad-close" aria-label="Dismiss" onClick={dismiss}>
          ×
        </button>
      )}

      <div className="ad-body" key={slot.key}>
        <span className="ad-progress">{milestone} HOLES DOWN</span>
        <span className="ad-kicker">{slot.kicker}</span>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized */}
        <img src={slot.logo} alt={slot.alt} />
        <span className="ad-name">{slot.name}</span>
        {slot.city && <span className="ad-where">{slot.city}</span>}
        {slot.blurb && <p>{slot.blurb}</p>}
        {slot.href && (
          <a className="ad-link" href={slot.href} target="_blank" rel="noreferrer">
            {slot.hrefLabel}
          </a>
        )}
      </div>

      {/* Already reads "Supporting Stonegate Elementary School". */}
      <small className="ad-foot">{EVENT.beneficiary}</small>
    </div>
  );
}
