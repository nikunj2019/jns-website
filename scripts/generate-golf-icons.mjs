/**
 * Rasterizes the Stonegate crest into the PWA icon set.
 *
 *   node scripts/generate-golf-icons.mjs
 *
 * Uses the Playwright Chromium already installed for testing, so there's no
 * image-processing dependency and no network access involved. Re-run this after
 * editing the crest in app/golf/components/Crest.tsx.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChromium } from "./chromium.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "golf", "icons");

const FAIRWAY_900 = "#0b2016";
const FAIRWAY_800 = "#123024";
const BRASS = "#c9a227";
const BRASS_SOFT = "#e0c469";
const CREAM = "#f5f1e6";

/**
 * @param {{ padding: number, background: string | null }} opts
 * `padding` is the fraction of the canvas kept clear around the crest. Maskable
 * icons need ~20% so the safe zone survives Android's circular/squircle masks.
 */
function crestSvg({ padding, background }) {
  const inner = 100 - padding * 2;
  // Fit the 100×120 crest into the padded square and centre it horizontally.
  const scale = inner / 120;
  const offsetX = (100 - 100 * scale) / 2;
  return `
<svg id="root" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  ${background ? `<rect width="100" height="100" fill="${background}"/>` : ""}
  <g transform="translate(${offsetX} ${padding}) scale(${scale})">
    <path d="M50 3 L94 17 V60 C94 87 74 106 50 117 C26 106 6 87 6 60 V17 Z"
          fill="${FAIRWAY_800}" stroke="${BRASS}" stroke-width="2.5"/>
    <path d="M50 10 L87 21 V60 C87 83 70 100 50 110 C30 100 13 83 13 60 V21 Z"
          fill="none" stroke="${BRASS}" stroke-width="0.8" opacity="0.5"/>
    <g stroke="${BRASS_SOFT}" stroke-width="2.6" stroke-linecap="round">
      <line x1="30" y1="34" x2="66" y2="86"/>
      <line x1="70" y1="34" x2="34" y2="86"/>
    </g>
    <path d="M66 86 q6 2 7 8 q-7 1 -10 -3 z" fill="${BRASS_SOFT}"/>
    <path d="M34 86 q-6 2 -7 8 q7 1 10 -3 z" fill="${BRASS_SOFT}"/>
    <text x="50" y="66" text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="${CREAM}">S</text>
    <g stroke="${BRASS}" stroke-width="1.4" fill="none" opacity="0.85">
      <path d="M24 74 q6 10 8 22"/><path d="M76 74 q-6 10 -8 22"/>
      <path d="M25 79 q-5 1 -7 5"/><path d="M27 87 q-5 1 -7 5"/>
      <path d="M75 79 q5 1 7 5"/><path d="M73 87 q5 1 7 5"/>
    </g>
  </g>
</svg>`.trim();
}

const ICONS = [
  { file: "icon-192.png", size: 192, padding: 4, background: FAIRWAY_900 },
  { file: "icon-512.png", size: 512, padding: 4, background: FAIRWAY_900 },
  // Maskable variants keep the crest inside Android's 80% safe zone.
  { file: "icon-192-maskable.png", size: 192, padding: 14, background: FAIRWAY_900 },
  { file: "icon-512-maskable.png", size: 512, padding: 14, background: FAIRWAY_900 },
  // iOS composites over white if the icon has alpha, so keep it opaque.
  { file: "apple-touch-icon.png", size: 180, padding: 8, background: FAIRWAY_900 },
  { file: "favicon-32.png", size: 32, padding: 2, background: FAIRWAY_900 },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await launchChromium();
  try {
    for (const { file, size, padding, background } of ICONS) {
      const page = await browser.newPage({
        viewport: { width: size, height: size },
        deviceScaleFactor: 1,
      });
      const svg = crestSvg({ padding, background });
      await page.setContent(
        `<!doctype html><style>html,body{margin:0;padding:0;overflow:hidden}
         svg#root{display:block;width:${size}px;height:${size}px}</style>${svg}`,
        { waitUntil: "load" }
      );
      const buffer = await page.screenshot({ omitBackground: false, type: "png" });
      await writeFile(join(OUT_DIR, file), buffer);
      await page.close();
      console.log(`  ✓ ${file} (${size}×${size})`);
    }
  } finally {
    await browser.close();
  }

  console.log(`\nWrote ${ICONS.length} icons to public/golf/icons/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
