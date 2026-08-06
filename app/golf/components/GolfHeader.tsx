import Link from "next/link";

/**
 * Sub-page header: back chevron, centred title, optional right-hand slot.
 * Sticky so it stays reachable one-handed on long scrolling pages.
 */
export default function GolfHeader({
  title,
  backHref = "/golf/",
  right,
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-brass/20 bg-fairway-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
        <Link
          href={backHref}
          aria-label="Back"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-cream-golf/80 transition-colors hover:bg-cream-golf/10 hover:text-cream-golf"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="font-display flex-1 truncate text-center text-lg text-cream-golf">
          {title}
        </h1>
        <div className="flex h-10 w-10 items-center justify-center">{right}</div>
      </div>
    </header>
  );
}
