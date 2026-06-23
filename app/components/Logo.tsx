import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  size?: number;
  inverted?: boolean;
  showWordmark?: boolean;
};

/**
 * The JNS monogram. Uses the full brand mark from the brand kit.
 * Per brand guide: clear space = height of the N. We enforce padding accordingly.
 */
export default function Logo({
  href = "/",
  size = 72,
  inverted = false,
  showWordmark = false,
}: Props) {
  const content = (
    <span className="inline-flex items-center gap-4">
      <span
        className="relative shrink-0"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <Image
          src="/jns-logo.png"
          alt=""
          fill
          sizes={`${size}px`}
          className="scale-[1.45] object-contain"
          priority
        />
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={`font-display text-[1.65rem] tracking-tight ${
              inverted ? "text-ivory" : "text-navy"
            }`}
          >
            JNS<span className={inverted ? "text-slate-soft" : "text-slate"}>.</span>
          </span>
          <span
            className={`mt-1.5 text-[0.68rem] uppercase tracking-[0.24em] ${
              inverted ? "text-slate-soft" : "text-slate"
            }`}
          >
            Consulting
          </span>
        </span>
      )}
    </span>
  );

  return href ? (
    <Link href={href} aria-label="JNS Consulting, Home" className="inline-block">
      {content}
    </Link>
  ) : (
    content
  );
}
