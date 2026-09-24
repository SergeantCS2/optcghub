// Shoots each face cards.py wrote at 300 dpi (1 in = 96 CSS px, so the scale is 3.125) with the VM's
// Chromium (local files: no network), and measures the print rules from the page itself:
// - the smallest type, in points (refused under 6.5)
// - anything that matters (text, the QR, the icon, the word) inside 0.125 in of a cut edge
// - type running into other type, or the word or the QR covering type
// Writes $CARD_OUT/png/<face>.png and report.json.
//   node design/business-card/render.mjs
import fs from 'node:fs'; import path from 'node:path';
import { browser, REPO } from '../play-listing/lib.mjs';
const BUILD = process.env.CARD_OUT || path.join(path.dirname(REPO), 'business-card-build');
const DIR = path.join(BUILD, 'html'), OUT = path.join(BUILD, 'png'); fs.mkdirSync(OUT, { recursive: true });
const b = await browser();
const report = [];
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.html')).sort()) {
  const portrait = f.startsWith('A-');
  const vp = portrait ? { width: 192, height: 336 } : { width: 336, height: 192 };
  const page = await b.newPage({ viewport: vp, deviceScaleFactor: 300 / 96 });
  await page.goto('file://' + path.join(DIR, f)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);
  const m = await page.evaluate(() => {
    const SAFE = 12, W = innerWidth, H = innerHeight, out = { minPt: 99, minText: '', unsafe: [] };
    const content = new Set([...document.querySelectorAll('.qr, .qrwrap, .art, .word, img')]);
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode());) if (n.textContent.trim()) {
      const el = n.parentElement, pt = parseFloat(getComputedStyle(el).fontSize) * 0.75;
      if (pt < out.minPt) { out.minPt = +pt.toFixed(2); out.minText = n.textContent.trim().slice(0, 30); }
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) if (r.left < SAFE || r.top < SAFE || r.right > W - SAFE || r.bottom > H - SAFE)
        out.unsafe.push(n.textContent.trim().slice(0, 24) + ` @${Math.round(r.left)},${Math.round(r.top)}-${Math.round(r.right)},${Math.round(r.bottom)}`);
    }
    /* text that runs into other text: every line box against every line box of another element that
       is neither its ancestor nor its descendant (A's first back ran its list into the disclaimer) */
    const lines = [];
    const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w2.nextNode());) if (n.textContent.trim()) { const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) lines.push({ el: n.parentElement, r, t: n.textContent.trim().slice(0, 20) }); }
    const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    out.overlaps = [];
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) { const A = lines[i], B = lines[j];
      if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      if (hit(A.r, B.r)) out.overlaps.push(A.t + ' / ' + B.t); }
    /* the art that must not cover type: the word and the QR against every line */
    for (const el of document.querySelectorAll('.word, .qr, .qrwrap')) { const r = el.getBoundingClientRect();
      for (const L of lines) if (!el.contains(L.el) && hit(r, L.r)) out.overlaps.push(el.className + ' / ' + L.t); }
    for (const el of content) { const r = el.getBoundingClientRect();
      if (r.width && (r.left < SAFE || r.top < SAFE || r.right > W - SAFE || r.bottom > H - SAFE)) out.unsafe.push(el.className || el.tagName); }
    out.fonts = document.fonts.check('12px D') && document.fonts.check('10px B');
    return out; });
  const png = path.join(OUT, f.replace('.html', '.png'));
  await page.screenshot({ path: png }); await page.close();
  report.push({ face: f.replace('.html', ''), ...m, ok: m.fonts && m.minPt >= 6.5 && !m.unsafe.length && !m.overlaps.length });
}
await b.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
for (const r of report) console.log(JSON.stringify(r));
const bad = report.filter(r => !r.ok);
if (bad.length) { console.log('render: refused', bad.map(r => r.face).join(', ')); process.exit(1); }
console.log(`render: ${report.length} faces at 300 dpi, no type under 6.5 pt, nothing outside the safe zone, nothing overlapping`);
