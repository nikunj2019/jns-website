import Image from "next/image";
import Link from "next/link";

/**
 * The "POWERED BY JNS" bar that closes every screen in the golf app.
 */
export default function JNSBar({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={`golf-stripes border-t border-brass/20 bg-fairway-800 ${
        compact ? "py-4" : "py-6"
      }`}
    >
      <Link
        href="/"
        className="flex items-center justify-center gap-3 px-6 transition-opacity hover:opacity-80"
      >
        <span className="text-[0.58rem] uppercase tracking-[0.2em] text-cream-golf/50">
          Powered by
        </span>
        <span className="relative h-8 w-14 shrink-0">
          <Image
            src="/jns-logo.png"
            alt="JNS Consulting"
            fill
            sizes="56px"
            className="scale-[1.45] object-contain brightness-0 invert"
          />
        </span>
        <span className="border-l border-cream-golf/20 pl-3 text-[0.65rem] leading-tight text-cream-golf/60">
          Smart Solutions,
          <br />
          Built for You.
        </span>
      </Link>
      {!compact && (
        <p className="mt-3 text-center text-[0.6rem] uppercase tracking-[0.18em] text-cream-golf/35">
          Official Technology Partner
        </p>
      )}
    </footer>
  );
}
