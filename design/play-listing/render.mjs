// Shoots every frame frames.py wrote. These are local files, so no network is used. It measures each
// caption block against Google's 20 % rule, and checks that each headline holds two lines. It writes
// $LISTING_OUT/frames/out/<name>.png and report.json.
//   node design/play-listing/render.mjs
import fs from 'node:fs'; import path from 'node:path';
import { browser, BUILD } from './lib.mjs';
const DIR = path.join(BUILD, 'frames'), OUT = path.join(DIR, 'out'); fs.mkdirSync(OUT, { recursive: true });
const b = await browser();
const report = [];
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.html')).sort()) {
  const feature = f === 'feature.html';
  const page = await b.newPage({ viewport: feature ? { width: 1024, height: 500 } : { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(DIR, f)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  const m = await page.evaluate((feature) => {
    const h = document.querySelector(feature ? '#name h1' : '#cap h1'), lh = parseFloat(getComputedStyle(h).lineHeight);
    const out = { lines: Math.round(h.getBoundingClientRect().height / lh), fonts: document.fonts.check('40px D') && document.fonts.check('20px B') };
    if (!feature) out.captionBottom = Math.round(Math.max(...[...document.querySelector('#cap').children].map(e => e.getBoundingClientRect().bottom)));
    else { const r = [...document.querySelectorAll('#icon, #name h1, #name p')].map(e => e.getBoundingClientRect());
      out.focal = { left: Math.round(Math.min(...r.map(x => x.left))), right: Math.round(Math.max(...r.map(x => x.right))), bottom: Math.round(Math.max(...r.map(x => x.bottom))) }; }
    return out; }, feature);
  const out = path.join(OUT, f.replace('.html', '.png'));
  await page.screenshot({ path: out }); await page.close();
  const row = { frame: f, ...m };
  if (m.captionBottom) row.captionShare = +(m.captionBottom / 1920 * 100).toFixed(1);
  row.ok = m.fonts && m.lines === 2 && (feature || row.captionShare <= 20);
  report.push(row);
}
await b.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
for (const r of report) console.log(JSON.stringify(r));
const bad = report.filter(r => !r.ok);
if (bad.length) { console.log('render: refused', bad.map(r => r.frame).join(', ')); process.exit(1); }
console.log(`render: ${report.length} images, every caption at most 20 %, every headline two lines`);
