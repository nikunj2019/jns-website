/**
 * The Trophy Club, Lebanon, Indiana — par 72, 7,208 yards.
 *
 * Hole routing is the licensed ProVisualizer KML for this course: for each
 * hole, the tee, then any playing targets around a dogleg, then the centre of
 * the green. Coordinates are [longitude, latitude], matching the KML's own
 * order — not the [lat, lng] most map libraries want, so convert deliberately
 * rather than by eye.
 *
 * These numbers are verified course data, not an approximation. Don't
 * regenerate them from a screenshot.
 */

/** Par, yardage and stroke index for holes 1–18. */
export type Hole = { par: number; yards: number; handicap: number };

export const HOLES: readonly Hole[] = [
  { par: 4, yards: 483, handicap: 3 },
  { par: 5, yards: 576, handicap: 13 },
  { par: 4, yards: 445, handicap: 7 },
  { par: 3, yards: 194, handicap: 9 },
  { par: 4, yards: 369, handicap: 17 },
  { par: 4, yards: 464, handicap: 1 },
  { par: 4, yards: 421, handicap: 5 },
  { par: 3, yards: 215, handicap: 15 },
  { par: 5, yards: 576, handicap: 11 },
  { par: 4, yards: 356, handicap: 18 },
  { par: 5, yards: 553, handicap: 10 },
  { par: 4, yards: 337, handicap: 12 },
  { par: 4, yards: 481, handicap: 2 },
  { par: 3, yards: 202, handicap: 14 },
  { par: 4, yards: 422, handicap: 8 },
  { par: 5, yards: 519, handicap: 16 },
  { par: 3, yards: 220, handicap: 4 },
  { par: 4, yards: 467, handicap: 6 },
];

export const HOLE_COUNT = HOLES.length;
export const COURSE_PAR = HOLES.reduce((total, hole) => total + hole.par, 0);

/** Playing line per hole as [lon, lat] pairs: tee → targets → green centre. */
export const COURSE_ROUTES: readonly (readonly (readonly [number, number])[])[] = [
  [[-86.524520052452, 40.096375609638], [-86.521692252169, 40.095370309537], [-86.519748251975, 40.095192109519]],
  [[-86.518355951836, 40.095068809507], [-86.520778752078, 40.096569109657], [-86.521711152171, 40.098005509801], [-86.521666152167, 40.098626509863]],
  [[-86.520517752052, 40.099144009914], [-86.517752951775, 40.098233209823], [-86.516347151635, 40.098921709892]],
  [[-86.515665851567, 40.098881209888], [-86.516528951653, 40.09729540973]],
  [[-86.517545951755, 40.097021809702], [-86.514648851465, 40.09639720964], [-86.514093551409, 40.096958809696]],
  [[-86.513967551397, 40.095934609593], [-86.511078551108, 40.096831009683], [-86.509271350927, 40.097007409701]],
  [[-86.508836650884, 40.096615909662], [-86.508708850871, 40.094315509432], [-86.510172251017, 40.094143609414]],
  [[-86.510773451077, 40.094348809435], [-86.509641250964, 40.095842809584]],
  [[-86.509730350973, 40.09650070965], [-86.511780551178, 40.094815909482], [-86.514087251409, 40.094414509441], [-86.514520151452, 40.094824909483]],
  [[-86.514525551453, 40.094020309402], [-86.515982651598, 40.095940909594], [-86.516867351687, 40.0959958096]],
  [[-86.516789051679, 40.095030109503], [-86.518386551839, 40.097029909703], [-86.519657351966, 40.098253009825], [-86.520410652041, 40.098493309849]],
  [[-86.520544752054, 40.099554409955], [-86.523383352338, 40.099371709937], [-86.52379825238, 40.099681309968]],
  [[-86.524227552423, 40.10010161001], [-86.521645452165, 40.101363410136], [-86.520818352082, 40.102785410279]],
  [[-86.521829052183, 40.102376810238], [-86.521073052107, 40.103877110388]],
  [[-86.520992952099, 40.104586310459], [-86.522725452273, 40.102908710291], [-86.523127752313, 40.10169551017]],
  [[-86.523489552349, 40.102567610257], [-86.524839552484, 40.100464310046], [-86.52460285246, 40.099243909924], [-86.523978252398, 40.098759709876]],
  [[-86.524034052403, 40.098371809837], [-86.522454552245, 40.097055109706]],
  [[-86.521407852141, 40.096041709604], [-86.524283352428, 40.096962409696], [-86.524825152483, 40.098312409831]],
];

/**
 * Geographic extent of `/golf/trophy-club-course-aerial.webp`.
 *
 * This is the extent the USGS ArcGIS export actually returned, which is not
 * the one that was requested — ArcGIS widened the latitude range to preserve
 * the raster's 6:5 aspect ratio. Using the requested bounds instead would put
 * every pin about forty yards off, which is exactly the kind of error nobody
 * notices until someone is standing in a bunker.
 */
export const AERIAL_BOUNDS = {
  west: -86.5262,
  east: -86.5074,
  south: 40.091466666666662,
  north: 40.10713333333333,
} as const;

/** Pixel size the aerial is projected into for the map's flat coordinate system. */
export const AERIAL_WIDTH = 1440;
export const AERIAL_HEIGHT = 1200;

/**
 * The real pixel size of the file on disk.
 *
 * Kept separate from the grid above because the grid is a coordinate space and
 * this is a fact about the image. Over the extent that works out at 0.56 m per
 * pixel — NAIP-class — so the file simply does not hold the detail a phone asks
 * for once you are zoomed into a green.
 *
 * Update this when the image is replaced and the zoom ceiling follows on its
 * own; see scripts/fetch-course-aerial.mjs.
 */
export const AERIAL_SOURCE_WIDTH = 2880;
export const AERIAL_SOURCE_HEIGHT = 2400;

/**
 * How far the map may zoom before it is inventing detail.
 *
 * At CRS.Simple zoom z the grid is drawn at `AERIAL_WIDTH * 2^z` CSS pixels, so
 * the image is pixel-for-pixel at `log2(source / grid)` — zoom 1 for the file
 * that ships today. The map allowed zoom 4, which is eight times past that: not
 * a sharper picture, just a bigger blur with the compression artefacts blown up
 * with it.
 *
 * One stop of headroom is deliberate rather than a hard stop at native. Two
 * times is still legible, players do want to lean in on a green, and a ceiling
 * that snaps exactly at 1:1 feels broken on a phone whose device pixels are
 * three deep anyway.
 */
const ZOOM_HEADROOM_STOPS = 1;
export const AERIAL_MAX_ZOOM =
  Math.log2(AERIAL_SOURCE_WIDTH / AERIAL_WIDTH) + ZOOM_HEADROOM_STOPS;

/**
 * [lon, lat] → Leaflet CRS.Simple [y, x].
 *
 * The map uses a flat pixel grid rather than a real projection: at the scale of
 * one golf course the distortion is far below GPS noise, and it means the
 * aerial can be a plain image overlay that works offline.
 */
export function toImagePoint([lon, lat]: readonly [number, number]): [number, number] {
  return [
    ((lat - AERIAL_BOUNDS.south) / (AERIAL_BOUNDS.north - AERIAL_BOUNDS.south)) * AERIAL_HEIGHT,
    ((lon - AERIAL_BOUNDS.west) / (AERIAL_BOUNDS.east - AERIAL_BOUNDS.west)) * AERIAL_WIDTH,
  ];
}

/** Green centre of each hole, for the "yards to the pin" readout. */
export const PINS: readonly { lat: number; lon: number }[] = COURSE_ROUTES.map((route) => {
  const [lon, lat] = route[route.length - 1];
  return { lat, lon };
});

/** Great-circle distance in yards. Haversine — flat-earth maths is fine at this scale. */
export function distanceYards(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): number {
  const R = 6_371_000;
  const p1 = (fromLat * Math.PI) / 180;
  const p2 = (toLat * Math.PI) / 180;
  const dPhi = ((toLat - fromLat) * Math.PI) / 180;
  const dLambda = ((toLon - fromLon) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLambda / 2) ** 2;
  const metres = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(metres * 1.09361);
}

export const metresToYards = (metres: number): number => Math.round(metres * 1.09361);

/** Par relative to a hole, as golfers say it out loud. */
export function scoreLabel(strokes: number, par: number): string {
  const delta = strokes - par;
  if (strokes === 1) return "Hole in one";
  if (delta <= -3) return "Albatross";
  if (delta === -2) return "Eagle";
  if (delta === -1) return "Birdie";
  if (delta === 0) return "Par";
  if (delta === 1) return "Bogey";
  if (delta === 2) return "Double bogey";
  return `+${delta}`;
}

/** "E", "+3", "−2" — the leaderboard convention. */
export function formatToPar(value: number): string {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
}
