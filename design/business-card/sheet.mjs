// Prints what leader.py wrote to PDF with the VM's Chromium, with vector text and the fonts carried:
//   optcghub-cards-test.pdf     the plain-paper alignment test, Letter at 100 %, front and back
//   front.pdf, back.pdf         one face each, at trim + bleed; impose.py places them ten to a sheet
// (Turning the cards inside an HTML sheet failed twice: the bottom row's upright boxes ran past the page and
//  were split by print pagination; a turned board overflowed the page's width and Chromium shrank the page.)
//   node design/business-card/sheet.mjs      (after leader.py; then impose.py and checksheet.py)
import fs from 'node:fs'; import path from 'node:path';
import { browser, REPO } from '../play-listing/lib.mjs';
const DIR = path.join(process.env.CARD_OUT || path.join(path.dirname(REPO), 'business-card-build'), 'leader');
/* each face on its own page at trim + bleed; impose.py turns and places them ten to a sheet */
const JOBS = [['test.html', 'optcghub-cards-test.pdf', '8.5in', '11in'], ['front-print.html', 'front.pdf', '2.125in', '3.625in'],
  ['back-print.html', 'back.pdf', '2.125in', '3.625in']];
const b = await browser();
for (const [src, out, width, height] of JOBS) {
  const page = await b.newPage();
  await page.goto('file://' + path.join(DIR, src));
  /* a face the page never uses is never fetched, so both are loaded by name before the check */
  await page.evaluate(() => Promise.all([document.fonts.load('12px D'), document.fonts.load('10px B')]).then(() => document.fonts.ready));
  await page.waitForTimeout(300);
  const fonts = await page.evaluate(() => document.fonts.check('12px D') && document.fonts.check('10px B'));
  if (!fonts) { console.log(`sheet: the fonts did not load for ${src}`); process.exit(1); }
  await page.pdf({ path: path.join(DIR, out), width, height, printBackground: true, preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await page.close();
  console.log(`sheet: ${out} (${(fs.statSync(path.join(DIR, out)).size / 1024).toFixed(0)} KB)`);
}
await b.close();
