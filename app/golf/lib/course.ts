/**
 * The Trophy Club — Lebanon, Indiana.
 *
 * ⚠️  THE PER-HOLE NUMBERS BELOW ARE PROVISIONAL.
 *
 * What is verified from public sources: par 72, 7,208 yards from the tips,
 * designed by Timothy Liddy and opened in 1998, links style, four tee sets,
 * bent-grass fairways, with Prairie Creek running through the property. Three
 * individual holes are documented — see `verified` on each hole below.
 *
 * Everything else is a plausible par-72 routing standing in until the real
 * scorecard is entered. Nothing here is presented to players as official: the UI
 * flags provisional holes, and `/golf/admin/course/` overwrites any of it from
 * Firestore without a redeploy.
 *
 * To replace it properly: `node scripts/fetch-course-data.mjs` from an unblocked
 * network, or type the card in at /golf/admin/course/.
 */

export type LatLng = { lat: number; lng: number };

export type Hole = {
  number: number;
  par: number;
  /** Yardage from the tees the outing plays. */
  yards: number;
  /** Stroke index, 1 = hardest. */
  handicap: number;
  note?: string;
  /** True when this hole's figures come from a documented source, not the stand-in routing. */
  verified?: boolean;
  /** Set once the course has been traced or imported; absent until then. */
  tee?: LatLng;
  green?: LatLng;
  greenFront?: LatLng;
  greenBack?: LatLng;
};

export type Course = {
  id: string;
  name: string;
  city: string;
  designer: string;
  opened: number;
  par: number;
  yards: number;
  center: LatLng;
  /** [west, south, east, north] — the map's initial bounds. */
  bbox: [number, number, number, number];
  holes: Hole[];
  /** False until the real scorecard replaces the stand-in routing. */
  scorecardConfirmed: boolean;
};

const HOLES: Hole[] = [
  { number: 1, par: 4, yards: 402, handicap: 7 },
  {
    number: 2,
    par: 5,
    yards: 545,
    handicap: 11,
    note: "Crosses Prairie Creek.",
    verified: true,
  },
  { number: 3, par: 4, yards: 418, handicap: 5 },
  { number: 4, par: 3, yards: 186, handicap: 17 },
  {
    number: 5,
    par: 4,
    yards: 352,
    handicap: 15,
    note: "Short dogleg left.",
    verified: true,
  },
  {
    number: 6,
    par: 4,
    yards: 469,
    handicap: 1,
    note: "Long, with large bunkers down most of the right side.",
    verified: true,
  },
  { number: 7, par: 3, yards: 205, handicap: 13 },
  { number: 8, par: 5, yards: 566, handicap: 9 },
  { number: 9, par: 4, yards: 431, handicap: 3 },
  { number: 10, par: 4, yards: 424, handicap: 6 },
  { number: 11, par: 3, yards: 172, handicap: 18 },
  { number: 12, par: 5, yards: 558, handicap: 12 },
  { number: 13, par: 4, yards: 445, handicap: 2 },
  { number: 14, par: 4, yards: 388, handicap: 14 },
  { number: 15, par: 3, yards: 218, handicap: 16 },
  { number: 16, par: 4, yards: 436, handicap: 4 },
  { number: 17, par: 5, yards: 542, handicap: 10 },
  { number: 18, par: 4, yards: 451, handicap: 8 },
];

export const COURSE: Course = {
  id: "trophy-club",
  name: "The Trophy Club",
  city: "Lebanon, Indiana",
  designer: "Timothy Liddy",
  opened: 1998,
  par: 72,
  yards: 7208,
  center: { lat: 40.0979318, lng: -86.5304796 },
  // ~1.6 km around the clubhouse — comfortably covers 247 acres of golf course.
  bbox: [-86.5405, 40.0899, -86.5205, 40.106],
  holes: HOLES,
  scorecardConfirmed: false,
};

export const FRONT_NINE = HOLES.slice(0, 9);
export const BACK_NINE = HOLES.slice(9);

export function holeByNumber(holes: Hole[], n: number): Hole | undefined {
  return holes.find((h) => h.number === n);
}

export function outPar(holes: Hole[]): number {
  return holes.slice(0, 9).reduce((sum, h) => sum + h.par, 0);
}

export function inPar(holes: Hole[]): number {
  return holes.slice(9).reduce((sum, h) => sum + h.par, 0);
}

export function totalPar(holes: Hole[]): number {
  return holes.reduce((sum, h) => sum + h.par, 0);
}

/** True once a hole has the coordinates needed to show a GPS distance. */
export function hasGeometry(hole: Hole): boolean {
  return Boolean(hole.green);
}

/** "+2", "E", "-4" — the way a leaderboard reads. */
export function formatToPar(toPar: number): string {
  if (toPar === 0) return "E";
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
}
