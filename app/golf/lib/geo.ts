import type { Hole, LatLng } from "./course";

const EARTH_RADIUS_M = 6_371_008.8;
const M_PER_YARD = 0.9144;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance in metres. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Great-circle distance in yards — the unit every golfer here thinks in. */
export function distanceYards(a: LatLng, b: LatLng): number {
  return distanceMeters(a, b) / M_PER_YARD;
}

/** Initial bearing from `a` to `b`, in degrees clockwise from north. */
export function bearing(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Midpoint along the great circle — used to centre a hole in view. */
export function midpoint(a: LatLng, b: LatLng): LatLng {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const bx = Math.cos(lat2) * Math.cos(dLng);
  const by = Math.cos(lat2) * Math.sin(dLng);
  const lat = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2)
  );
  const lng = toRad(a.lng) + Math.atan2(by, Math.cos(lat1) + bx);
  return { lat: toDeg(lat), lng: ((toDeg(lng) + 540) % 360) - 180 };
}

/**
 * The hole whose green is closest to `position`, within `maxYards`.
 *
 * Used to work out which hole a player is standing on. A shotgun start means
 * nobody begins on 1, so guessing by hole order would be wrong for everyone.
 * Returns null when out of range — better no answer than a confident wrong one.
 */
export function nearestHole(
  position: LatLng,
  holes: Hole[],
  maxYards = 400
): { hole: Hole; yards: number } | null {
  let best: { hole: Hole; yards: number } | null = null;

  for (const hole of holes) {
    const target = hole.green ?? hole.tee;
    if (!target) continue;
    const yards = distanceYards(position, target);
    if (yards <= maxYards && (!best || yards < best.yards)) best = { hole, yards };
  }

  return best;
}

/**
 * Distances from a position to the front, centre, and back of a green.
 * Falls back to just the centre when the edges haven't been traced.
 */
export function greenDistances(
  position: LatLng,
  hole: Hole
): { front?: number; center?: number; back?: number } {
  return {
    front: hole.greenFront ? Math.round(distanceYards(position, hole.greenFront)) : undefined,
    center: hole.green ? Math.round(distanceYards(position, hole.green)) : undefined,
    back: hole.greenBack ? Math.round(distanceYards(position, hole.greenBack)) : undefined,
  };
}

/**
 * Whether a GPS fix is good enough to quote a yardage from.
 *
 * Phone GPS reports its own accuracy; anything worse than ~25 m makes a
 * "142 yards" readout misleading, so we say we don't know instead.
 */
export const MAX_USABLE_ACCURACY_M = 25;

export function isUsableFix(accuracyMeters: number | null | undefined): boolean {
  return typeof accuracyMeters === "number" && accuracyMeters <= MAX_USABLE_ACCURACY_M;
}

/** Metres → yards, rounded, for accuracy halos and measured distances. */
export function metersToYards(m: number): number {
  return Math.round(m / M_PER_YARD);
}
