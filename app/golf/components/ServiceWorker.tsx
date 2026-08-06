"use client";

import { useEffect } from "react";

/**
 * Registers the golf app's service worker.
 *
 * Scope is pinned to /golf/ so the worker can never intercept requests for the
 * JNS marketing site — a stale cache there would be a real problem, and this is
 * a throwaway event app.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/golf/sw.js", { scope: "/golf/" })
        .catch((err) => console.warn("Golf service worker registration failed:", err));
    };

    // Registering after load keeps the worker from competing with the first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
