"use client";

import { useEffect, useRef } from "react";
import type { Platform } from "../lib/platform";

/**
 * How to get the app onto a phone's home screen.
 *
 * This replaces a one-line note appended to the bottom of whichever screen was
 * open. On an iPhone that note landed below the fold, so tapping "Install app"
 * looked like it did nothing at all — the button appeared broken when the
 * instructions were simply out of sight.
 *
 * It has to be a sheet rather than a note because iOS gives the web no way to
 * install anything. Chrome fires `beforeinstallprompt` and one tap does it;
 * Safari has no equivalent and never will, so the only honest thing the button
 * can do there is show the player exactly which buttons to press.
 *
 * The awkward case is worth stating plainly: on iOS, "Add to Home Screen"
 * exists *only* in Safari. A captain texts the link, a player taps it from
 * Messages, and it opens in a web view where the option isn't in the menu at
 * all. That is the most likely reason this ever gets opened, so it gets its own
 * set of steps rather than a footnote.
 */
export default function InstallSheet({
  platform,
  onClose,
}: {
  platform: Platform;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const guide = GUIDES[platform];

  return (
    <div
      className="takeover"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="takeover-card install-card">
        <span className="takeover-kicker">{guide.kicker}</span>
        <h2 id="install-title">{guide.title}</h2>
        {guide.intro && <p className="install-intro">{guide.intro}</p>}

        <ol className="install-steps">
          {guide.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        {guide.footnote && <p className="install-foot">{guide.footnote}</p>}

        <button ref={closeRef} className="takeover-dismiss" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

/** The iOS Share glyph, drawn so step one is unmistakable on a small screen. */
function ShareGlyph() {
  return (
    <svg className="ios-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15V3m0 0L8.5 6.5M12 3l3.5 3.5M6 11H4.5v9.5h15V11H18"
      />
    </svg>
  );
}

/** Chrome's overflow menu, for the same reason. */
function DotsGlyph() {
  return (
    <svg className="ios-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="19" r="1.7" fill="currentColor" />
    </svg>
  );
}

type Guide = {
  kicker: string;
  title: string;
  intro?: string;
  steps: React.ReactNode[];
  footnote?: string;
};

const GUIDES: Record<Platform, Guide> = {
  "ios-safari": {
    kicker: "IPHONE & IPAD",
    title: "Add it to your Home Screen",
    intro: "Three taps. Apple doesn't let websites do this for you, so you drive.",
    steps: [
      <>
        Tap the{" "}
        <b className="nb">
          Share <ShareGlyph />
        </b>{" "}
        button — the box with an arrow coming out of the top. On an iPhone it&rsquo;s at the bottom
        of the screen; on an iPad, the top right.
      </>,
      <>
        Scroll the list down and tap <b>Add to Home Screen</b>. It sits below the row of apps, past
        Copy and Add to Favourites.
      </>,
      <>
        Tap <b>Add</b>, top right. Stonegate Golf is now on your Home Screen and opens full screen,
        like any other app.
      </>,
    ],
    footnote: "Don't see the Share button? Scroll up — Safari hides its bars as you read.",
  },

  "ios-browser": {
    kicker: "ONE STEP FIRST",
    title: "Open this page in Safari",
    intro:
      "You're in Chrome, Firefox or Edge. On an iPhone, only Safari can add a page to the Home Screen — Apple doesn't allow the others to.",
    steps: [
      <>
        Tap the{" "}
        <b className="nb">
          menu <DotsGlyph />
        </b>{" "}
        or the{" "}
        <b className="nb">
          Share <ShareGlyph />
        </b>{" "}
        button in your browser&rsquo;s toolbar.
      </>,
      <>
        Choose <b>Open in Safari</b>.
      </>,
      <>
        Once it reopens, tap <b>Add to Home Screen</b> here again and follow the three steps.
      </>,
    ],
    footnote: "Your team code comes with you — you won't have to enter it again.",
  },

  "ios-webview": {
    kicker: "ONE STEP FIRST",
    title: "Open this page in Safari",
    intro:
      "You've opened the link from inside another app — Messages, Mail or similar. That's a mini browser, and it can't add anything to your Home Screen.",
    steps: [
      <>
        Look for the <b>Safari</b> compass icon, or the{" "}
        <b className="nb">
          Share <ShareGlyph />
        </b>{" "}
        button — usually in the bottom right corner.
      </>,
      <>
        Tap it and choose <b>Open in Safari</b>.
      </>,
      <>
        Once it reopens, tap <b>Add to Home Screen</b> here again and follow the three steps.
      </>,
    ],
    footnote: "Your team code comes with you — you won't have to enter it again.",
  },

  android: {
    kicker: "ANDROID",
    title: "Add it to your home screen",
    intro: "Your browser didn't offer to do it automatically, so here's the manual route.",
    steps: [
      <>
        Tap the{" "}
        <b className="nb">
          <DotsGlyph /> menu
        </b>{" "}
        at the top right of the browser.
      </>,
      <>
        Tap <b>Install app</b>, or <b>Add to Home screen</b> if that&rsquo;s what yours calls it.
      </>,
      <>
        Confirm. It then opens full screen, without the browser bars.
      </>,
    ],
  },

  desktop: {
    kicker: "ON A COMPUTER",
    title: "Install from the address bar",
    intro:
      "Handy for the scoring table. In Chrome or Edge, look for the install icon at the right-hand end of the address bar.",
    steps: [
      <>Click the install icon in the address bar — a monitor with a downward arrow.</>,
      <>
        Click <b>Install</b>. It opens in its own window from then on.
      </>,
      <>No icon there? Your browser doesn&rsquo;t support it. The page works exactly the same in a tab.</>,
    ],
  },
};
