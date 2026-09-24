// Shoots each face cards.py wrote at 300 dpi (1 in = 96 CSS px, so the scale is 3.125) with the VM's
// Chromium (local files: no network), and measures the print rules from the page itself:
// - the smallest type, in points (refused under 6.5)
// - anything that matters (text, the QR, the icon, the word) inside 0.125 in of a cut edge
// - type running into other type, or the word or the QR covering type
// - Google's Play badge, where a face carries one: at least 0.3 in tall, a quarter of its height clear
// Writes $CARD_OUT/png/<face>.png and report.json; with a directory (leader) it renders $CARD_OUT/leader/*.html
// that carry a face size (the sheets go to PDF instead) into $CARD_OUT/leader/png.
//   node design/business-card/render.mjs [dir]
import fs from 'node:fs'; import path from 'node:path';
import { browser, REPO } from '../play-listing/lib.mjs';
const BUILD = process.env.CARD_OUT || path.join(path.dirname(REPO), 'business-card-build');
const SUB = process.argv[2];
const DIR = path.join(BUILD, SUB || 'html'), OUT = SUB ? path.join(DIR, 'png') : path.join(BUILD, 'png'); fs.mkdirSync(OUT, { recursive: true });
const b = await browser();
const report = [];
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.html')).sort()) {
  /* the face's size is on its body (data-w, data-h, in inches); a page without one is a sheet */
  const size = fs.readFileSync(path.join(DIR, f), 'utf8').match(/data-w="([\d.]+)in" data-h="([\d.]+)in"/);
  if (!size) continue;
  const vp = { width: Math.round(+size[1] * 96), height: Math.round(+size[2] * 96) };
  const page = await b.newPage({ viewport: vp, deviceScaleFactor: 300 / 96 });
  await page.goto('file://' + path.join(DIR, f)); await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {})))); await page.waitForTimeout(250);
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
    /* Google's badge rules: at least 0.3 in tall in print, and a quarter of its height clear of any text
       and of the panel's edge */
    const gp = document.querySelector('.gp');
    if (gp) {
      const g = gp.getBoundingClientRect(), p = gp.closest('.panel').getBoundingClientRect(), bw = 1.2;
      const apart = (a, b) => Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom);
      let clear = Math.min(g.left - p.left - bw, p.right - bw - g.right, g.top - p.top - bw, p.bottom - bw - g.bottom);
      for (const L of lines) clear = Math.min(clear, apart(g, L.r));
      out.badge = { heightIn: +(g.height / 96).toFixed(3), clearIn: +(clear / 96).toFixed(3), loaded: gp.complete && gp.naturalWidth > 0 };
      out.badge.ok = out.badge.loaded && g.height >= 0.3 * 96 && clear >= g.height / 4;
    }
    out.fonts = document.fonts.check('12px D') && document.fonts.check('10px B');
    return out; });
  const png = path.join(OUT, f.replace('.html', '.png'));
  await page.screenshot({ path: png }); await page.close();
  report.push({ face: f.replace('.html', ''), ...m, ok: m.fonts && m.minPt >= 6.5 && !m.unsafe.length && !m.overlaps.length && (!m.badge || m.badge.ok) });
}
await b.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
for (const r of report) console.log(JSON.stringify(r));
const bad = report.filter(r => !r.ok);
if (bad.length) { console.log('render: refused', bad.map(r => r.face).join(', ')); process.exit(1); }
console.log(`render: ${report.length} faces at 300 dpi, no type under 6.5 pt, nothing outside the safe zone, nothing overlapping`
  + (report.some(r => r.badge) ? ', the Play badge at size with its clear space' : ''));
