"use client";

import { useEffect, useState } from "react";

/**
 * The JNS credit, shown while the app boots.
 *
 * Held for a full three seconds on every load, by request — JNS is the
 * technology partner and this is the credit. It previously showed once per
 * session for 1.25s; both of those were changed deliberately, so if this ever
 * feels long on a tee box, this constant is the dial and nothing else needs
 * touching.
 *
 * A note on `prefers-reduced-motion`: that preference is about motion, not
 * about branding, so the card still shows for those users — only the loader
 * animation and the fade are dropped (handled in golf.css). Skipping the credit
 * entirely would be reading the preference as something it isn't.
 */

/** How long the card stays fully visible before it starts to leave. */
const HOLD_MS = 3000;
/** Matches the opacity transition in golf.css, so the node is removed after it. */
const FADE_MS = 420;

export default function JNSSplash() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "gone">("visible");

  useEffect(() => {
    const fade = window.setTimeout(() => setPhase("leaving"), HOLD_MS);
    const done = window.setTimeout(() => setPhase("gone"), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  if (phase === "gone") return null;

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
