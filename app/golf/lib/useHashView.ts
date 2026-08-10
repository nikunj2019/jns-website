"use client";

import { useSyncExternalStore } from "react";

/**
 * The current screen, kept in the URL hash.
 *
 * The app is one component with a view switcher rather than a route per
 * screen, which is how the finished design works — but a plain `useState` for
 * that meant the Android back button closed the PWA outright instead of
 * stepping back a screen, and no view could be linked to. Parking the view in
 * the hash gets the back button, deep links and PWA shortcuts back without
 * splitting the app into routes.
 *
 * `useSyncExternalStore` rather than an effect: the hash is an external store,
 * and this way there's no setState-in-effect and no flash of the wrong screen
 * on hydration — React re-renders with the real hash the moment it hydrates.
 */

const REPLACE_EVENT = "stonegate:hashreplace";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  // history.replaceState fires nothing, so navigate() announces it itself.
  window.addEventListener(REPLACE_EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(REPLACE_EVENT, onChange);
  };
}

const getSnapshot = (): string => window.location.hash.replace(/^#/, "") || "home";

// Prerendered HTML has no hash; the client corrects it during hydration.
const getServerSnapshot = (): string => "home";

export function useHashView(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Move to a screen.
 *
 * `replace` is for redirects the player didn't ask for — landing on the join
 * screen and being moved to their scorecard shouldn't leave the join screen
 * sitting behind the back button.
 */
export function navigateHash(view: string, replace = false): void {
  const url = `#${view}`;
  if (window.location.hash === url) return;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(REPLACE_EVENT));
}
