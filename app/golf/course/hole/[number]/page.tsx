import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GolfHeader from "../../../components/GolfHeader";
import JNSBar from "../../../components/JNSBar";
import { FlagIcon, MapIcon, TargetIcon } from "../../../components/icons";
import { COURSE } from "../../../lib/course";

type Params = { number: string };

/** All 18 holes are known at build time, so every page prerenders. */
export function generateStaticParams(): Params[] {
  return COURSE.holes.map((hole) => ({ number: String(hole.number) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { number } = await params;
  const hole = COURSE.holes.find((h) => h.number === Number(number));
  if (!hole) return { title: "Hole" };
  return {
    title: `Hole ${hole.number}`,
    description: `Par ${hole.par}, ${hole.yards} yards, stroke index ${hole.handicap} at ${COURSE.name}.`,
  };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 rounded-xl border border-cream-golf/12 bg-fairway-800 px-3 py-3 text-center">
      <p className="text-[0.58rem] uppercase tracking-[0.16em] text-cream-golf/45">{label}</p>
      <p className="golf-nums mt-1 text-2xl font-medium text-cream-golf">{value}</p>
    </div>
  );
}

export default async function HolePage({ params }: { params: Promise<Params> }) {
  const { number } = await params;
  const n = Number(number);
  const hole = COURSE.holes.find((h) => h.number === n);
  if (!hole) notFound();

  const prev = n === 1 ? 18 : n - 1;
  const next = n === 18 ? 1 : n + 1;
  const shape = hole.par === 3 ? "One shot in" : hole.par === 5 ? "Reachable in three" : "Two to get there";

  return (
    <>
      <GolfHeader title={`Hole ${hole.number}`} backHref="/golf/course/" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-12 pt-6">
        {/* ── Headline ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <span className="golf-nums flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-brass bg-fairway-800 text-2xl font-semibold text-brass">
            {hole.number}
          </span>
          <div>
            <p className="font-display text-2xl text-cream-golf">
              Par {hole.par}
              <span className="text-cream-golf/40"> · </span>
              <span className="golf-nums">{hole.yards}</span>
              <span className="text-lg text-cream-golf/60"> yds</span>
            </p>
            <p className="mt-0.5 text-[0.8rem] text-cream-golf/55">{shape}</p>
          </div>
        </div>

        {/* ── Numbers ──────────────────────────────────────────────────────── */}
        <div className="mt-5 flex gap-2.5">
          <Stat label="Par" value={hole.par} />
          <Stat label="Yards" value={hole.yards} />
          <Stat label="Handicap" value={hole.handicap} />
        </div>

        {hole.note && (
          <div className="mt-4 rounded-xl border border-brass/30 bg-brass/8 px-4 py-3">
            <p className="text-[0.86rem] leading-relaxed text-cream-golf/85">{hole.note}</p>
          </div>
        )}

        {!hole.verified && (
          <p className="mt-3 text-[0.72rem] leading-relaxed text-cream-golf/40">
            These figures are provisional — the official scorecard hasn&rsquo;t been entered yet.
          </p>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="mt-6 space-y-2.5">
          <Link
            href="/golf/course/"
            className="flex items-center justify-center gap-2.5 rounded-xl bg-cream-golf px-4 py-3.5 text-sm font-medium text-fairway-900 transition-opacity hover:opacity-90"
          >
            <MapIcon size={18} />
            {hole.green ? "See it on the map" : "Open the course map"}
          </Link>
          <Link
            href="/golf/score/"
            className="flex items-center justify-center gap-2.5 rounded-xl border border-cream-golf/25 px-4 py-3.5 text-sm font-medium text-cream-golf transition-colors hover:bg-cream-golf/10"
          >
            <FlagIcon size={18} />
            Enter your team&rsquo;s score
          </Link>
        </div>

        {!hole.green && (
          <p className="mt-4 flex items-start gap-2 text-[0.76rem] leading-relaxed text-cream-golf/45">
            <span className="mt-0.5 shrink-0">
              <TargetIcon size={15} />
            </span>
            No GPS coordinates for this hole yet, so the map can&rsquo;t show distances to the
            green.
          </p>
        )}

        {/* ── Neighbours ───────────────────────────────────────────────────── */}
        <nav className="mt-8 flex items-center justify-between border-t border-cream-golf/10 pt-4 text-sm">
          <Link
            href={`/golf/course/hole/${prev}/`}
            className="text-cream-golf/60 transition-colors hover:text-cream-golf"
          >
            ‹ Hole {prev}
          </Link>
          <Link
            href="/golf/course/scorecard/"
            className="text-[0.78rem] text-cream-golf/40 underline underline-offset-4 hover:text-cream-golf/70"
          >
            Full scorecard
          </Link>
          <Link
            href={`/golf/course/hole/${next}/`}
            className="text-cream-golf/60 transition-colors hover:text-cream-golf"
          >
            Hole {next} ›
          </Link>
        </nav>
      </main>

      <JNSBar />
    </>
  );
}
