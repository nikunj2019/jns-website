/*
 * Pull the course aerial from public-domain orthoimagery.
 *
 *   node scripts/fetch-course-aerial.mjs --source=indiana --res=0.1524
 *
 * Why not Google. Google Maps and Earth imagery cannot be used here: their
 * terms forbid downloading, caching or storing the tiles, and forbid using the
 * content outside a Google map. This app self-hosts a single image and
 * precaches it in a service worker so the map works in a dead spot on the
 * ninth — that is precisely what is not allowed, licence key or not. The same
 * goes for Apple, Bing and Mapbox satellite layers, which are licensed rather
 * than public.
 *
 * What is allowed, and is genuinely sharper: US federal and Indiana state
 * orthoimagery is public domain. For this course the ranking is
 *
 *   indiana-3in   ~0.076 m/px   ~21,000 px across the extent   best, very large
 *   indiana-6in   ~0.152 m/px   ~10,500 px                     the sweet spot
 *   naip-1ft      ~0.305 m/px    ~5,250 px                     safe fallback
 *   naip-60cm     ~0.600 m/px    ~2,880 px                     what ships today
 *
 * A phone at 3x device-pixel-ratio wants roughly three device pixels per CSS
 * pixel, so the 6-inch layer is the first one that is actually sharp rather
 * than merely larger.
 */

import { writeFile } from "node:fs/promises";

const BOUNDS = { west: -86.5262, east: -86.5074, south: 40.091466666666662, north: 40.10713333333333 };

/* ArcGIS ImageServer/MapServer export endpoints. All public domain. */
const SOURCES = {
  "indiana-6in": {
    url: "https://gisdata.in.gov/server/rest/services/Hosted/Imagery_Statewide/ImageServer/exportImage",
    note: "Indiana statewide orthoimagery. Check gisdata.in.gov for the current service name.",
  },
  "naip": {
    url: "https://gis.apfo.usda.gov/arcgis/rest/services/NAIP/USDA_CONUS_PRIME/ImageServer/exportImage",
    note: "USDA NAIP, CONUS. ~0.6 m, sometimes 0.3 m in recent flights.",
  },
  "usgs": {
    url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/export",
    note: "USGS Imagery Only. Resolution varies by area.",
  },
};

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const source = arg("source", "naip");
const res = Number(arg("res", "0.1524"));               // metres per pixel
const out = arg("out", "public/golf/trophy-club-course-aerial.png");

if (!SOURCES[source]) {
  console.error(`Unknown source "${source}". Options: ${Object.keys(SOURCES).join(", ")}`);
  process.exit(1);
}

const latMid = (BOUNDS.south + BOUNDS.north) / 2;
const widthM = (BOUNDS.east - BOUNDS.west) * 111320 * Math.cos((latMid * Math.PI) / 180);
const heightM = (BOUNDS.north - BOUNDS.south) * 110574;
const width = Math.round(widthM / res);
const height = Math.round(heightM / res);

console.log(`${source}  ${res} m/px  ->  ${width} x ${height} px`);
console.log(SOURCES[source].note);

/*
 * The extent matters more than the resolution. `AERIAL_BOUNDS` in
 * app/golf/lib/course.ts is the extent the *previous* export actually returned,
 * not the one requested — ArcGIS widens the range to preserve the raster's
 * aspect ratio. Every pin is placed against those bounds, so a new image has to
 * cover the same ground or every hole moves. Request the same bbox, and if the
 * service reports back a different extent, put that in course.ts rather than
 * assuming it obeyed.
 */
const params = new URLSearchParams({
  bbox: `${BOUNDS.west},${BOUNDS.south},${BOUNDS.east},${BOUNDS.north}`,
  bboxSR: "4326",
  imageSR: "4326",
  size: `${width},${height}`,
  format: "png",
  f: "image",
});

const url = `${SOURCES[source].url}?${params}`;
console.log(`GET ${url}\n`);

const res2 = await fetch(url);
if (!res2.ok) {
  console.error(`Request failed: ${res2.status} ${res2.statusText}`);
  process.exit(1);
}
const buf = Buffer.from(await res2.arrayBuffer());
if (buf.subarray(0, 4).toString("utf8").includes("{")) {
  console.error("Service returned JSON, not an image:\n" + buf.toString("utf8").slice(0, 400));
  process.exit(1);
}
await writeFile(out, buf);
console.log(`Wrote ${out} — ${(buf.length / 1e6).toFixed(1)} MB`);
console.log(`
Next:
  1. Encode it. The file that ships today is 0.46 bits/px, which is why it looks
     mushy even before any zoom. Aim near 2 bits/px:
       cwebp -q 88 -m 6 ${out} -o public/golf/trophy-club-course-aerial.webp
  2. Put the real pixel dimensions in AERIAL_SOURCE_WIDTH/HEIGHT in
     app/golf/lib/course.ts. The map's zoom ceiling is derived from them, so it
     widens on its own once the image can carry it.
  3. Check the size against the service worker precache — this image is in
     SHELL_URLS, and every player downloads it before the round.`);
