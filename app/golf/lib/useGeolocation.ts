"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LatLng } from "./course";

export type GeoState = {
  position: LatLng | null;
  /** Reported accuracy of the current fix, in metres. */
  accuracy: number | null;
  /** Direction of travel in degrees, when the device reports it. */
  heading: number | null;
  active: boolean;
  error: string | null;
  /** True when the browser has permission but no fix has arrived yet. */
  acquiring: boolean;
};

const INITIAL: GeoState = {
  position: null,
  accuracy: null,
  heading: null,
  active: false,
  error: null,
  acquiring: false,
};

/**
 * Live position, opt-in.
 *
 * Deliberately does *not* start on mount. `watchPosition` with high accuracy
 * keeps the GPS radio busy and would meaningfully drain a phone over a
 * four-hour round, and iOS only grants permission in response to a user
 * gesture anyway. The player taps to start it.
 *
 * Watching is suspended while the page is hidden and resumed when it returns,
 * so pocketing the phone between shots stops costing battery.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>(INITIAL);
  const watchId = useRef<number | null>(null);
  const wanted = useRef(false);

  const clearWatch = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const beginWatch = useCallback(() => {
    if (watchId.current !== null) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState((prev) => ({
          ...prev,
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          heading: Number.isFinite(pos.coords.heading) ? pos.coords.heading : prev.heading,
          active: true,
          acquiring: false,
          error: null,
        }));
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location is blocked. Enable it for this site in your browser settings."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Can't get a fix right now — try again in the open."
              : "Location timed out.";
        setState((prev) => ({ ...prev, error: message, active: false, acquiring: false }));
        wanted.current = false;
        clearWatch();
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 3_000 }
    );
  }, [clearWatch]);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((prev) => ({ ...prev, error: "This browser doesn't support location." }));
      return;
    }
    wanted.current = true;
    setState((prev) => ({ ...prev, acquiring: true, error: null, active: true }));
    beginWatch();
  }, [beginWatch]);

  const stop = useCallback(() => {
    wanted.current = false;
    clearWatch();
    setState((prev) => ({ ...prev, active: false, acquiring: false }));
  }, [clearWatch]);

  const toggle = useCallback(() => {
    if (wanted.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => {
    const onVisibility = () => {
      if (!wanted.current) return;
      if (document.hidden) clearWatch();
      else beginWatch();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearWatch();
    };
  }, [beginWatch, clearWatch]);

  return { ...state, start, stop, toggle };
}
