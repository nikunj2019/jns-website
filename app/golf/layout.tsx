import type { Metadata, Viewport } from "next";
import "./golf.css";
import JNSSplash from "./components/JNSSplash";
import ServiceWorker from "./components/ServiceWorker";
import { EVENT } from "./lib/config";

/**
 * `golf.css` is imported here rather than in the root layout on purpose: Next
 * chunks CSS per route, so the app's ~70 KB of unscoped styles ship only to
 * /golf/** and can't collide with the marketing site's Tailwind utilities.
 */

export const metadata: Metadata = {
  title: {
    default: EVENT.name,
    template: `%s · Stonegate Golf`,
  },
  description: `${EVENT.format} at ${EVENT.venue.name}. Live scramble scoring, GPS course map, and event details.`,
  // Without these the golf pages would inherit the JNS marketing card from the
  // root layout, so a link texted round the neighborhood would preview as a
  // consulting pitch.
  openGraph: {
    title: EVENT.name,
    description: `${EVENT.format} at ${EVENT.venue.name}.`,
    siteName: "Stonegate Golf",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: EVENT.name,
    description: `${EVENT.format} at ${EVENT.venue.name}.`,
  },
  manifest: "/golf/manifest.webmanifest",
  applicationName: "Stonegate Golf",
  appleWebApp: {
    capable: true,
    title: "Stonegate Golf",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/golf/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/golf/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/golf/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  // A private event app for one afternoon — deliberately kept out of search.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#073d2b",
  // The score-entry and map screens are laid out to fit without zooming, but
  // pinch-zoom stays enabled — `maximumScale: 1` would fail WCAG 1.4.4, and
  // someone reading a yardage in bright sun is exactly who needs to zoom.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function GolfLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="golf-root">
      <ServiceWorker />
      <JNSSplash />
      {children}
    </div>
  );
}
