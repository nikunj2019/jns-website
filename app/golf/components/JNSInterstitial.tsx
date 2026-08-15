"use client";

import { useEffect, useRef, useState } from "react";

/** Show the card once for every this-many holes completed. */
export const HOLES_PER_AD = 3;

const DISMISS_AFTER_MS = 7000;
const storageKey = (teamId: string) => `stonegate:last-ad-milestone:${teamId}`;

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
 * The JNS card, shown after every third hole a team completes.
 *
 * Two things it deliberately does not do. It never covers the score control
 * mid-entry — it appears only when a hole is *completed*, and it dismisses
 * itself after a few seconds so a group walking to the next tee doesn't have
 * to deal with it. And it fires once per milestone, remembered per team in
 * localStorage, so correcting a score on the ninth doesn't re-trigger the
 * card someone already saw.
 *
 * `thru` counts holes with a score, not the hole number: a shotgun start means
 * a team starting on 12 hits their third completed hole on 14.
 */
export default function JNSInterstitial({ teamId, thru }: { teamId: string | null; thru: number }) {
  const [milestone, setMilestone] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seen = useRef<number>(0);

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

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMilestone(null), DISMISS_AFTER_MS);
  }, [teamId, thru]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  if (milestone === null) return null;

  return (
    <div className="jns-ad" role="status">
      <div className="jns-ad-card">
        <button
          className="jns-ad-close"
          aria-label="Dismiss"
          onClick={() => setMilestone(null)}
        >
          ×
        </button>
        <span className="jns-ad-progress">{milestone} HOLES DOWN</span>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized */}
        <img src="/golf/jns-logo.png" alt="JNS — Smart Solutions, Built for You" width={520} height={260} />
        <p>Custom applications, AI and automation for growing businesses.</p>
        <a href="https://jnssolutions.ai" target="_blank" rel="noreferrer">
          Visit jnssolutions.ai
        </a>
        <small>Official technology partner of the Stonegate Golf Outing</small>
      </div>
    </div>
  );
}
