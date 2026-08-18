/*
 * Build the course aerial from Indiana's statewide orthoimagery.
 *
 *   node scripts/fetch-course-aerial.mjs                  # 6-inch, 3x3 tiles
 *   node scripts/fetch-course-aerial.mjs --res=0.0762     # 3-inch, where flown
 *   node scripts/fetch-course-aerial.mjs --tiles=4        # if a tile 400s on size
 *
 * Why tiles. The obvious approach — ask for one enormous image — fails twice.
 * ArcGIS image services cap a single export (commonly near 4096 px), and a
 * *cached basemap* like USGSImageryOnly will happily answer a large request by
 * upscaling its own pre-rendered tiles, so you get a big file that is exactly as
 * blurry as a small one. That is the trap: the request succeeds and the result
 * looks like more detail until you zoom in. This talks to an ImageServer, which
 * holds the real raster, and asks for pieces small enough to be served natively.
 *
 * Why this source. Indiana's orthoimagery programme flies the state on a
 * three-year cycle at 6 inches, some areas at 3, and publishes it CC0 — public
 * domain, no attribution required and none of the redistribution problems that
 * rule out Google, Apple, Bing and Mapbox satellite for a self-hosted offline
 * map. At 6 inches this extent is about 10,500 px across against today's 2,880.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

/* Must match AERIAL_BOUNDS in app/golf/lib/course.ts, or every hole moves. */
const BOUNDS = { west: -86.5262, east: -86.5074, south: 40.091466666666662, north: 40.10713333333333 };

const SERVICE =
  "https://di-ingov.img.arcgis.com/arcgis/rest/services/DynamicWebMercator/Indiana_Current_Imagery/ImageServer";

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const res = Number(arg("res", "0.1524"));        // metres per pixel; 0.1524 = 6 inches
const tiles = Number(arg("tiles", "3"));         // grid is tiles x tiles
const outDir = arg("outdir", "aerial-tiles");

const latMid = (BOUNDS.south + BOUNDS.north) / 2;
const widthM = (BOUNDS.east - BOUNDS.west) * 111320 * Math.cos((latMid * Math.PI) / 180);
const heightM = (BOUNDS.north - BOUNDS.south) * 110574;
const fullW = Math.round(widthM / res);
const fullH = Math.round(heightM / res);

/* Tile pixel sizes must sum exactly to the whole, or the stitch is a pixel out
   per seam and the seams show as hairlines across the fairway. */
const colW = Array.from({ length: tiles }, (_, i) =>
  Math.round(((i + 1) * fullW) / tiles) - Math.round((i * fullW) / tiles)
);
const rowH = Array.from({ length: tiles }, (_, i) =>
  Math.round(((i + 1) * fullH) / tiles) - Math.round((i * fullH) / tiles)
);

console.log(`source   Indiana Current Imagery (CC0)`);
console.log(`res      ${res} m/px  (${(res / 0.3048 * 12).toFixed(1)} inch)`);
console.log(`full     ${fullW} x ${fullH} px`);
console.log(`grid     ${tiles} x ${tiles}  -> tiles up to ${Math.max(...colW)} x ${Math.max(...rowH)} px`);
if (Math.max(...colW, ...rowH) > 4096) {
  console.log(`\n!! a tile exceeds 4096 px and will probably be refused — raise --tiles`);
}
console.log();

if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

const lonStep = (BOUNDS.east - BOUNDS.west) / tiles;
const latStep = (BOUNDS.north - BOUNDS.south) / tiles;
const written = [];

for (let row = 0; row < tiles; row++) {
  for (let col = 0; col < tiles; col++) {
    // Row 0 is the top of the image, which is the *north* end of the extent.
    const north = BOUNDS.north - row * latStep;
    const south = north - latStep;
    const west = BOUNDS.west + col * lonStep;
    const east = west + lonStep;

    const params = new URLSearchParams({
      bbox: `${west},${south},${east},${north}`,
      bboxSR: "4326",
      imageSR: "4326",
      size: `${colW[col]},${rowH[row]}`,
      format: "png",
      f: "image",
    });

    const name = `tile_r${row}_c${col}.png`;
    process.stdout.write(`  ${name}  ${colW[col]}x${rowH[row]} ... `);
    const response = await fetch(`${SERVICE}/exportImage?${params}`);
    if (!response.ok) {
      console.log(`FAILED ${response.status} ${response.statusText}`);
      process.exit(1);
    }
    const buf = Buffer.from(await response.arrayBuffer());
    // A service that refuses returns JSON with a 200, which is easy to miss.
    if (buf.subarray(0, 1).toString("utf8") === "{") {
      console.log("FAILED — service returned JSON:");
      console.log(buf.toString("utf8").slice(0, 300));
      process.exit(1);
    }
    await writeFile(join(outDir, name), buf);
    written.push(name);
    console.log(`${(buf.length / 1e6).toFixed(1)} MB`);
  }
}

console.log(`\n${written.length} tiles in ${outDir}/\n`);
console.log(`Stitch them — whichever of these you have:

  ImageMagick:
    magick montage ${outDir}/tile_r*_c*.png -tile ${tiles}x${tiles} -geometry +0+0 course-full.png

  Python (Pillow):
    python3 - <<'PY'
    from PIL import Image; import glob, re
    Image.MAX_IMAGE_PIXELS = None
    t = {}
    for f in glob.glob("${outDir}/tile_r*_c*.png"):
        r, c = map(int, re.search(r"r(\\d+)_c(\\d+)", f).groups()); t[(r, c)] = Image.open(f)
    n = max(r for r, _ in t) + 1
    W = sum(t[(0, c)].width for c in range(n)); H = sum(t[(r, 0)].height for r in range(n))
    out = Image.new("RGB", (W, H)); y = 0
    for r in range(n):
        x = 0
        for c in range(n):
            out.paste(t[(r, c)], (x, y)); x += t[(r, c)].width
        y += t[(r, 0)].height
    out.save("course-full.png"); print(out.size)
    PY

Then encode and wire it in:

  1. cwebp -q 82 -m 6 course-full.png -o public/golf/trophy-club-course-aerial.webp

     Watch the file size. The service worker precaches this image, so every
     player downloads it before the round — aim under about 6 MB, and drop the
     quality rather than the resolution if it runs over. Detail you can zoom
     into beats detail you can't wait for.

  2. Set AERIAL_SOURCE_WIDTH / AERIAL_SOURCE_HEIGHT in app/golf/lib/course.ts
     to ${fullW} / ${fullH}. The fallback zoom ceiling is derived from them.

  3. Check a hole. The routing is positioned against AERIAL_BOUNDS, so if the
     service returned a different extent than requested the tee will sit off
     the tee box — which is the only bug here that matters.`);
