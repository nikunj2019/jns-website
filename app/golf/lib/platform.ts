"use client";

import { useEffect, useState } from "react";

/**
 * Just enough platform detection to give honest install instructions.
 *
 * Sniffing the user agent is normally the wrong instinct, but "add to home
 * screen" has no feature to detect: iOS exposes no API for it, and the steps
 * differ per browser. There is nothing here to test for, only somewhere to
 * point the player.
 */
export type Platform =
  /** Safari on iPhone or iPad — the only iOS browser that can add to the home screen. */
  | "ios-safari"
  /** Chrome, Firefox or Edge on iOS. Real browsers, but Apple denies them the feature. */
  | "ios-browser"
  /** A web view inside another app — Messages, Mail, Gmail, Instagram. Very common here, */
  /** because captains text the link and players tap it straight from the thread. */
  | "ios-webview"
  | "android"
  | "desktop";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;

  // iPadOS reports itself as a Mac; the touch points give it away.
  const ios =
    /iphone|ipad|ipod/i.test(ua) ||
    (/Macintosh/.test(ua) && typeof document !== "undefined" && navigator.maxTouchPoints > 1);

  if (ios) {
    if (/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(ua)) return "ios-browser";
    // Every iOS browser embeds "Safari" in its UA; web views drop it. That
    // absence is the most reliable in-app signal available to us.
    return /Safari/.test(ua) ? "ios-safari" : "ios-webview";
  }

  if (/android/i.test(ua)) return "android";
  return "desktop";
}

/** True once the app is running from the home screen rather than a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // `display-mode` only landed in iOS 16.4; `navigator.standalone` covers the
  // iPhones still on 15 and 16 that will turn up at an outing like this one.
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Both of the above, resolved after mount.
 *
 * The site is a static export, so the first render is prerendered HTML with no
 * user agent behind it. Deciding anything platform-shaped during render would
 * mismatch on hydration; this settles on the second pass instead.
 */
export function useDevice(): { platform: Platform | null; standalone: boolean } {
  const [device, setDevice] = useState<{ platform: Platform | null; standalone: boolean }>({
    platform: null,
    standalone: false,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads navigator, which isn't available during render
    setDevice({ platform: detectPlatform(), standalone: isStandalone() });
  }, []);

  return device;
}
