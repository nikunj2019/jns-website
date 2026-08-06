import type { Metadata } from "next";
import Link from "next/link";
import GolfHeader from "../../components/GolfHeader";
import JNSBar from "../../components/JNSBar";
import { COURSE, inPar, outPar } from "../../lib/course";

export const metadata: Metadata = {
  title: "Scorecard",
  description: "Hole-by-hole scorecard for The Trophy Club.",
};

function Nine({ holes, label }: { holes: typeof COURSE.holes; label: string }) {
  const par = holes.reduce((s, h) => s + h.par, 0);
  const yards = holes.reduce((s, h) => s + h.yards, 0);

  return (
    <div className="overflow-x-auto">
      <table className="golf-nums w-full min-w-[30rem] text-sm">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="border-b border-brass/25 text-[0.62rem] uppercase tracking-[0.14em] text-cream-golf/45">
            <th scope="col" className="py-2 pr-2 text-left font-medium">
              Hole
            </th>
            {holes.map((h) => (
              <th key={h.number} scope="col" className="px-1.5 py-2 text-center font-medium">
                {h.number}
              </th>
            ))}
            <th scope="col" className="px-2 py-2 text-center font-medium text-brass">
              {label}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-golf/8">
          <tr>
            <th scope="row" className="py-2.5 pr-2 text-left text-[0.72rem] font-normal text-cream-golf/60">
              Par
            </th>
            {holes.map((h) => (
              <td key={h.number} className="px-1.5 py-2.5 text-center text-cream-golf">
                {h.par}
              </td>
            ))}
            <td className="px-2 py-2.5 text-center font-medium text-brass-soft">{par}</td>
          </tr>
          <tr>
            <th scope="row" className="py-2.5 pr-2 text-left text-[0.72rem] font-normal text-cream-golf/60">
              Yards
            </th>
            {holes.map((h) => (
              <td key={h.number} className="px-1.5 py-2.5 text-center text-cream-golf/75">
                {h.yards}
              </td>
            ))}
            <td className="px-2 py-2.5 text-center font-medium text-brass-soft">{yards}</td>
          </tr>
          <tr>
            <th scope="row" className="py-2.5 pr-2 text-left text-[0.72rem] font-normal text-cream-golf/60">
              HCP
            </th>
            {holes.map((h) => (
              <td key={h.number} className="px-1.5 py-2.5 text-center text-cream-golf/50">
                {h.handicap}
              </td>
            ))}
            <td className="px-2 py-2.5" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ScorecardPage() {
  const front = COURSE.holes.slice(0, 9);
  const back = COURSE.holes.slice(9);

  return (
    <>
      <GolfHeader title="Scorecard" backHref="/golf/course/" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 pt-5">
        <div className="rounded-2xl border border-cream-golf/12 bg-fairway-800 p-4">
          <h2 className="font-display text-xl text-cream-golf">{COURSE.name}</h2>
          <p className="mt-1 text-[0.8rem] text-cream-golf/55">
            {COURSE.city} · {COURSE.designer}, {COURSE.opened}
          </p>
          <p className="golf-nums mt-3 text-sm text-cream-golf/80">
            Par {COURSE.par} · {COURSE.yards.toLocaleString()} yards from the tips
          </p>
        </div>

        {!COURSE.scorecardConfirmed && (
          <div className="mt-4 rounded-xl border border-brass/35 bg-brass/8 px-4 py-3">
            <p className="text-[0.8rem] font-medium text-brass-soft">Unofficial — pending scorecard</p>
            <p className="mt-1 text-[0.76rem] leading-relaxed text-cream-golf/65">
              The course total is verified, but most per-hole figures below are a stand-in
              routing. Holes 2, 5, and 6 are the exceptions. Ask the pro shop for the card, or
              enter it in the admin, and this notice disappears.
            </p>
          </div>
        )}

        <section className="mt-6">
          <h2 className="golf-eyebrow mb-2">Front Nine</h2>
          <Nine holes={front} label="Out" />
        </section>

        <section className="mt-8">
          <h2 className="golf-eyebrow mb-2">Back Nine</h2>
          <Nine holes={back} label="In" />
        </section>

        <p className="golf-nums mt-6 text-center text-sm text-cream-golf/70">
          Out {outPar(COURSE.holes)} · In {inPar(COURSE.holes)} ·{" "}
          <span className="text-brass-soft">Total {COURSE.par}</span>
        </p>

        <p className="mt-6 text-center text-[0.78rem]">
          <Link
            href="/golf/course/"
            className="text-cream-golf/50 underline underline-offset-4 hover:text-cream-golf/80"
          >
            Back to the map
          </Link>
        </p>
      </main>

      <JNSBar />
    </>
  );
}
