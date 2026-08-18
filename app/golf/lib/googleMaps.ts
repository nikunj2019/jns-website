/**
 * Load the Google Maps JavaScript API once, or give up quickly.
 *
 * Everything about this is written to fail toward the offline aerial. A missing
 * key, billing switched off, a domain restriction that doesn't match, a captive
 * wifi portal at the clubhouse — all of them look the same from here, and all of
 * them must end with a map that still shows the course rather than a grey void.
 *
 * The timeout matters more than it looks: a phone on one bar can leave a script
 * tag pending for a minute without ever firing onerror.
 */
const LOAD_TIMEOUT_MS = 6000;

let pending: Promise<boolean> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<boolean> {
  if (!apiKey) return Promise.resolve(false);
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as unknown as { google?: { maps?: unknown } }).google?.maps) {
    return Promise.resolve(true);
  }
  if (pending) return pending;

  pending = new Promise<boolean>((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    const timer = window.setTimeout(() => done(false), LOAD_TIMEOUT_MS);

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&loading=async`;
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timer);
      // Present but unusable is the billing-disabled case: the script loads and
      // then complains in the console rather than throwing anything catchable.
      done(!!(window as unknown as { google?: { maps?: unknown } }).google?.maps);
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      done(false);
    };
    document.head.append(script);
  });

  return pending;
}
