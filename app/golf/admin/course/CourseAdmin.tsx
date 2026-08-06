"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fsPatchDoc } from "../../../lib/firestoreRest";
import { COURSE, type Hole } from "../../lib/course";
import { idToken, useAuth } from "../../lib/useAuth";
import { COURSE_COLLECTION, useCourse } from "../../lib/useCourse";
import { Button, Card, SaveNote, saveErrorMessage } from "../ui";

type Row = { number: number; par: string; yards: string; handicap: string };

const cell =
  "w-full rounded border border-cream-golf/20 bg-fairway-900 px-1.5 py-2 text-center text-[0.85rem] text-cream-golf focus:border-brass focus:outline-none";

export default function CourseAdmin() {
  const { user } = useAuth();
  const { course, loaded } = useCourse();

  const [rows, setRows] = useState<Row[]>(() => toRows(COURSE.holes));
  const [confirmed, setConfirmed] = useState(COURSE.scorecardConfirmed);
  const [save, setSave] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loaded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding the editable card from the course doc fetched after mount
    setRows(toRows(course.holes));
    setConfirmed(course.scorecardConfirmed);
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  function setCell(index: number, key: keyof Omit<Row, "number">, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  async function saveCard() {
    setSave("saving");
    setError("");

    // Merge over whatever coordinates already exist — this screen edits the
    // numbers only, and must never wipe traced geometry.
    const holes = rows.map((row) => {
      const existing = course.holes.find((h) => h.number === row.number);
      return {
        ...(existing ?? {}),
        number: row.number,
        par: Number(row.par) || existing?.par || 4,
        yards: Number(row.yards) || existing?.yards || 0,
        handicap: Number(row.handicap) || existing?.handicap || row.number,
        verified: true,
      };
    });

    const par = holes.reduce((sum, h) => sum + h.par, 0);
    const yards = holes.reduce((sum, h) => sum + h.yards, 0);

    try {
      const token = await idToken(user);
      await fsPatchDoc(
        COURSE_COLLECTION,
        COURSE.id,
        { holes, par, yards, scorecardConfirmed: confirmed },
        token
      );
      setSave("saved");
      setTimeout(() => setSave("idle"), 2000);
    } catch (err) {
      setError(saveErrorMessage(err));
      setSave("error");
    }
  }

  const totalPar = rows.reduce((s, r) => s + (Number(r.par) || 0), 0);
  const totalYards = rows.reduce((s, r) => s + (Number(r.yards) || 0), 0);
  const mapped = course.holes.filter((h) => h.green).length;

  return (
    <div className="space-y-4">
      <Card
        title="Scorecard"
        description="Type the real card in from the pro shop, Hole19, or the course website. Saving here overrides the committed defaults everywhere in the app — no redeploy."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr className="text-[0.6rem] uppercase tracking-[0.14em] text-cream-golf/45">
                <th scope="col" className="pb-1 text-left font-medium">
                  Hole
                </th>
                <th scope="col" className="pb-1 font-medium">
                  Par
                </th>
                <th scope="col" className="pb-1 font-medium">
                  Yards
                </th>
                <th scope="col" className="pb-1 font-medium">
                  HCP
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.number}>
                  <th
                    scope="row"
                    className="golf-nums w-10 text-left text-[0.85rem] font-normal text-cream-golf/60"
                  >
                    {row.number}
                  </th>
                  <td className="w-[26%] px-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={row.par}
                      onChange={(e) => setCell(i, "par", e.target.value)}
                      className={cell}
                      aria-label={`Hole ${row.number} par`}
                    />
                  </td>
                  <td className="w-[34%] px-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={row.yards}
                      onChange={(e) => setCell(i, "yards", e.target.value)}
                      className={cell}
                      aria-label={`Hole ${row.number} yards`}
                    />
                  </td>
                  <td className="w-[26%] px-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={row.handicap}
                      onChange={(e) => setCell(i, "handicap", e.target.value)}
                      className={cell}
                      aria-label={`Hole ${row.number} handicap`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="golf-nums text-[0.8rem] text-brass-soft">
                <th scope="row" className="pt-2 text-left font-medium">
                  Total
                </th>
                <td className="pt-2 text-center">{totalPar}</td>
                <td className="pt-2 text-center">{totalYards.toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-lg border border-cream-golf/15 px-3.5 py-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[color:var(--color-brass)]"
          />
          <span>
            <span className="block text-[0.88rem] text-cream-golf">
              These numbers are the official card
            </span>
            <span className="block text-[0.72rem] text-cream-golf/45">
              Removes the &ldquo;unofficial — pending scorecard&rdquo; notice from the app.
            </span>
          </span>
        </label>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={saveCard}>Save scorecard</Button>
          <SaveNote state={save} error={error} />
        </div>
      </Card>

      <Card
        title="Course geometry"
        description="Tee and green positions drive every GPS distance in the app."
      >
        <p className="text-[0.85rem] text-cream-golf/70">
          <span className="golf-nums text-cream-golf">{mapped}</span> of 18 holes have
          coordinates.
        </p>
        {mapped === 0 && (
          <p className="mt-2 text-[0.78rem] leading-relaxed text-cream-golf/50">
            Nothing is mapped yet, so the course map shows no yardages. Either run{" "}
            <code className="rounded bg-fairway-900 px-1.5 py-0.5 text-[0.72rem]">
              node scripts/fetch-course-data.mjs
            </code>{" "}
            to try importing it from OpenStreetMap, or trace it by hand.
          </p>
        )}
        <Link
          href="/golf/admin/course/trace/"
          className="mt-4 inline-block rounded-lg bg-cream-golf px-4 py-2.5 text-[0.82rem] font-medium text-fairway-900 transition-opacity hover:opacity-90"
        >
          Open the tracing tool
        </Link>
      </Card>
    </div>
  );
}

function toRows(holes: Hole[]): Row[] {
  return holes.map((h) => ({
    number: h.number,
    par: String(h.par),
    yards: String(h.yards),
    handicap: String(h.handicap),
  }));
}
