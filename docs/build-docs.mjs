// Renders the printable guides in docs/ to PDF.
//
//   node docs/build-docs.mjs
//
// Chromium is used rather than a PDF library because both documents are laid
// out in CSS — fixed 8.5in x 11in pages, gradients, and an SVG QR code that has
// to stay crisp at print resolution.
//
// The container's Chromium is a different build from the one the pinned
// Playwright expects, so it is launched by path instead of by download.

import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Page count, if pdf-lib happens to be installed.
 *
 * Optional on purpose: it is a check, not a dependency of the render, and
 * carrying it in package.json for the sake of two documents is not worth it.
 * Install it with `npm i --no-save pdf-lib` to have the check run.
 */
async function countPages(path) {
  try {
    const { PDFDocument } = await import("pdf-lib");
    return (await PDFDocument.load(await readFile(path))).getPageCount();
  } catch {
    return null;
  }
}

const DOCS = [
  { html: "player-flyer.html", pdf: "Stonegate-Golf-Player-Guide.pdf", pages: 2 },
  { html: "admin-guide.html", pdf: "Stonegate-Golf-Organizer-Guide.pdf", pages: 3 },
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
let failed = false;

for (const doc of DOCS) {
  await page.goto(pathToFileURL(join(here, doc.html)).href, { waitUntil: "networkidle" });
  const out = join(here, doc.pdf);
  await page.pdf({
    path: out,
    format: "Letter",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  // A page that overflows silently becomes a mostly-blank extra sheet, which is
  // the one defect you would not notice until it was printed.
  const count = await countPages(out);
  if (count !== null && count !== doc.pages) {
    failed = true;
    console.error(`✗ ${doc.pdf}: ${count} pages, expected ${doc.pages}`);
  } else {
    console.log(`✓ ${doc.pdf}${count === null ? "" : ` (${count} pages)`}`);
  }
}

await browser.close();
process.exit(failed ? 1 : 0);
