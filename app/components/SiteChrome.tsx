"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import SmoothScroll from "./SmoothScroll";
import ScrollProgress from "./ScrollProgress";

/**
 * The marketing site's chrome — header, footer, and scroll behaviours.
 *
 * The golf outing app at /golf is a self-contained dark-themed PWA with its own
 * navigation, so it opts out of all of it. Under `output: "export"` this runs at
 * build time, so out/golf/**.html is prerendered without the header rather than
 * shedding it on hydration.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGolf = pathname === "/golf" || pathname.startsWith("/golf/");

  if (isGolf) return <>{children}</>;

  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
