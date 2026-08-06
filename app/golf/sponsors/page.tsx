import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import GolfHeader from "../components/GolfHeader";
import JNSBar from "../components/JNSBar";
import { MailIcon } from "../components/icons";
import { EVENT } from "../lib/event";

export const metadata: Metadata = {
  title: "Sponsors",
  description: "Thank you to the sponsors of the Annual Stonegate Men's Golf Scramble.",
};

export default function SponsorsPage() {
  return (
    <>
      <GolfHeader title="Our Sponsors" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-12 pt-6">
        {/* ── Title sponsor ────────────────────────────────────────────────── */}
        <section>
          <h2 className="golf-eyebrow text-center">Title Sponsor</h2>
          <Link
            href="/"
            className="mt-3 flex flex-col items-center rounded-2xl border border-brass/30 bg-cream-golf px-6 py-10 transition-opacity hover:opacity-95"
          >
            <span className="relative h-20 w-40">
              <Image
                src="/jns-logo.png"
                alt="JNS Consulting"
                fill
                sizes="160px"
                className="scale-[1.35] object-contain"
                priority
              />
            </span>
            <span className="mt-4 text-center text-[0.8rem] leading-relaxed text-fairway-900/70">
              Smart Solutions, Built for You.
            </span>
          </Link>
          <p className="mt-3 text-center text-[0.72rem] uppercase tracking-[0.18em] text-cream-golf/40">
            Official Technology Partner
          </p>
        </section>

        {/* ── Open slots ───────────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="golf-eyebrow text-center">Sponsorships Available</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {["Gold", "Gold", "Silver", "Silver"].map((tier, i) => (
              <div
                key={`${tier}-${i}`}
                className="flex aspect-[3/2] flex-col items-center justify-center rounded-xl border border-dashed border-cream-golf/20 bg-fairway-800/50 text-center"
              >
                <span className="text-[0.62rem] uppercase tracking-[0.18em] text-brass/70">
                  {tier}
                </span>
                <span className="mt-1 text-[0.75rem] text-cream-golf/40">Your name here</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Become a sponsor ─────────────────────────────────────────────── */}
        <section className="mt-8 rounded-2xl border border-brass/30 bg-brass/8 p-5 text-center">
          <h2 className="font-display text-xl text-cream-golf">Want to sponsor a hole?</h2>
          <p className="mx-auto mt-2 max-w-sm text-[0.88rem] leading-relaxed text-cream-golf/75">
            Sponsorships help cover the outing and put your name in front of the whole
            neighborhood. Reach out to {EVENT.rsvp.contact} to get on the board.
          </p>
          <a
            href={`mailto:${EVENT.rsvp.email}?subject=${encodeURIComponent(
              "Stonegate Golf Scramble — sponsorship"
            )}`}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-cream-golf px-5 py-3 text-sm font-medium text-fairway-900 transition-opacity hover:opacity-90"
          >
            <MailIcon size={17} />
            Get in touch
          </a>
        </section>

        <p className="mt-8 text-center text-[0.8rem] leading-relaxed text-cream-golf/45">
          Thank you for supporting the Stonegate outing.
        </p>
      </main>

      <JNSBar />
    </>
  );
}
