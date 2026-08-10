"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "stonegate:splash-seen";
const FADE_AT_MS = 1250;
const REMOVE_AT_MS = 1700;

/**
 * The JNS credit, shown while the app boots.
 *
 * Once per session, not once per navigation — a scorekeeper moving between the
 * map and the scorecard forty times a round should see this exactly once. It
 * also stands aside entirely for anyone who has asked for reduced motion, and
 * is `aria-hidden` because it says nothing a screen reader needs mid-round.
 */
export default function JNSSplash() {
  const [phase, setPhase] = useState<"hidden" | "visible" | "leaving">("hidden");

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* Private browsing — treat as unseen. */
    }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* Nothing to remember. */
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- gated on sessionStorage and a media query, both readable only on the client
    setPhase("visible");
    const fade = window.setTimeout(() => setPhase("leaving"), FADE_AT_MS);
    const done = window.setTimeout(() => setPhase("hidden"), REMOVE_AT_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div className={`jns-splash${phase === "leaving" ? " is-leaving" : ""}`} aria-hidden>
      <div className="jns-splash-card">
        <span className="jns-created">CREATED BY</span>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized */}
        <img src="/golf/jns-logo.png" alt="" width={520} height={260} />
        <p>
          Custom applications, AI and automation
          <br />
          for growing businesses.
        </p>
        <div className="jns-loader">
          <i />
        </div>
        <span className="jns-splash-url">jnssolutions.ai</span>
      </div>
    </div>
  );
}
