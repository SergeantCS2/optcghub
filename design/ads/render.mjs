// Shoots every composition images.py wrote, and refuses one that breaks Google's App-campaign guidance or
// the frame's own rules:
// - the exact size of its ratio, and a file of at most 5 MB (a PNG over it is written as a JPEG instead)
// - the overlay (every element of class "ov": caption, line, chips, lockup, note) under 20 % of the image
// - everything of class "safe" 24 px or more off every edge; the three fonts loaded
// Then a thumbnail sheet at the width an ad is often drawn (300 px), to read by eye.
//   node design/ads/render.mjs            -> $ADS_OUT/images/out/*.png|jpg, report.json, thumbs.png
//   node design/ads/render.mjs --selftest -> the guard, watched to refuse a planted frame of each kind first
import fs from 'node:fs'; import path from 'node:path';
import { browser } from '../play-listing/lib.mjs';
import { ADS_DIR } from './paths.mjs';
const DIR = path.join(ADS_DIR, 'images'), OUT = path.join(DIR, 'out');
const SIZES = { landscape: [1200, 628], square: [1200, 1200], portrait: [1200, 1500] };
const MAX_BYTES = 5 * 1024 * 1024, OVERLAY = 20, EDGE = 24;

/* the measurement, run in the page: the overlay's area (its rects, clipped to the frame) and anything
   of class "safe" too near an edge */
function measure() {
  const W = innerWidth, H = innerHeight, clip = r => Math.max(0, Math.min(r.right, W) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0));
  /* a text block counts its lines (a range's rects), not its box; a badge counts its box */
  const lines = e => { const r = document.createRange(); r.selectNodeContents(e); return [...r.getClientRects()]; };
  const ov = [...document.querySelectorAll('.ov')].reduce((a, e) => a + (e.classList.contains('txt') ? lines(e).reduce((b, r) => b + clip(r), 0) : clip(e.getBoundingClientRect())), 0);
  const near = [...document.querySelectorAll('.safe')].map(e => ({ e, r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.left < 24 || r.top < 24 || r.right > W - 24 || r.bottom > H - 24)
    .map(({ e, r }) => `${e.className.split(' ')[0]} ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`);
  return { overlay: +(ov / (W * H) * 100).toFixed(1), near, fonts: document.fonts.check('40px D') && document.fonts.check('20px B') && document.fonts.check('900 20px H'),
    broken: [...document.images].filter(i => !i.naturalWidth).length };
}
export function verdict(ratio, m, bytes, size) {
  const why = [];
  const [w, h] = SIZES[ratio];
  if (size.w !== w || size.h !== h) why.push(`size ${size.w}x${size.h}, not ${w}x${h}`);
  if (bytes > MAX_BYTES) why.push(`${(bytes / 1048576).toFixed(1)} MB, over 5`);
  if (m.overlay >= OVERLAY) why.push(`overlay ${m.overlay} %, not under ${OVERLAY}`);
  if (m.near.length) why.push(`within ${EDGE} px of an edge: ${m.near.join('; ')}`);
  if (!m.fonts) why.push('a font did not load');
  if (m.broken) why.push(`${m.broken} image(s) broken`);
  return why;
}

async function shoot(b, file) {
  const ratio = path.basename(file, '.html').split('-').pop(); const [w, h] = SIZES[ratio];
  const page = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto('file://' + file); await page.evaluate(() => Promise.all([...document.fonts].map(f => f.load()))); await page.waitForTimeout(300);
  const m = await page.evaluate(measure);
  let out = file.replace(/\.html$/, '.png').replace(DIR, OUT);
  await page.screenshot({ path: out });
  let bytes = fs.statSync(out).size;
  if (bytes > MAX_BYTES) { fs.unlinkSync(out); out = out.replace(/\.png$/, '.jpg'); await page.screenshot({ path: out, type: 'jpeg', quality: 92 }); bytes = fs.statSync(out).size; }
  await page.close();
  return { ratio, m, bytes, out, size: { w, h } };
}

async function selftest(b) {
  /* each planted frame must be refused for the reason named, before the real ones are trusted */
  const tmp = fs.mkdtempSync(path.join(ADS_DIR, 'selftest-'));
  const face = '@font-face{font-family:D;src:local(Impact)}';
  const planted = [
    ['overlay-square', 'overlay', `<h1 class="ov" style="position:absolute;left:100px;top:100px;width:1000px;height:400px">A caption far too big</h1>`],
    ['edge-square', 'edge', `<div class="safe" style="position:absolute;left:4px;top:300px;width:200px;height:200px;background:#1f3d72"></div>`],
    ['broken-square', 'broken', `<img src="file:///nonexistent.png" style="width:100px">`],
  ];
  const missed = [];
  for (const [name, want, body] of planted) {
    const f = path.join(tmp, name + '.html');
    fs.writeFileSync(f, `<!doctype html><html><head><style>${face} body{margin:0;width:1200px;height:1200px}</style></head><body>${body}</body></html>`);
    const page = await b.newPage({ viewport: { width: 1200, height: 1200 } }); await page.goto('file://' + f); await page.waitForTimeout(200);
    const m = await page.evaluate(measure); await page.close();
    m.fonts = true;   // the planted pages carry no fonts on purpose; each is refused for its own reason
    const why = verdict('square', m, 1000, { w: 1200, h: 1200 }).join(' | ');
    if (!why.includes(want)) missed.push([name, want, why]);
  }
  if (!verdict('square', { overlay: 5, near: [], fonts: true, broken: 0 }, 6 * 1048576, { w: 1200, h: 1200 }).some(x => x.includes('MB'))) missed.push(['bytes', 'MB', 'not refused']);
  if (!verdict('square', { overlay: 5, near: [], fonts: true, broken: 0 }, 1000, { w: 1200, h: 628 }).some(x => x.includes('size'))) missed.push(['size', 'size', 'not refused']);
  fs.rmSync(tmp, { recursive: true });
  if (missed.length) { console.log('selftest: the guard let a planted frame through', JSON.stringify(missed)); process.exit(1); }
  console.log('selftest: overlay, edge, broken image, bytes and size each refused');
}

const b = await browser();
if (process.argv.includes('--selftest')) { await selftest(b); await b.close(); process.exit(0); }
fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort().map(f => path.join(DIR, f));
const report = [];
for (const f of files) {
  const r = await shoot(b, f); const why = verdict(r.ratio, r.m, r.bytes, r.size);
  report.push({ image: path.basename(r.out), ratio: r.ratio, overlay: r.m.overlay, kb: Math.round(r.bytes / 1024), ok: !why.length, why });
}
/* the thumbnail sheet: each image 300 px wide, the size many placements draw it */
const sheet = await b.newPage({ viewport: { width: 1280, height: 400 } });
const outs = report.map(r => path.join(OUT, r.image));
await sheet.setContent(`<body style="margin:0;padding:12px;background:#ddd;display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;font:12px sans-serif">` +
  outs.map(o => `<figure style="margin:0;width:300px"><img src="data:image/${o.endsWith('.jpg') ? 'jpeg' : 'png'};base64,${fs.readFileSync(o).toString('base64')}" style="width:300px;display:block"><figcaption>${path.basename(o)}</figcaption></figure>`).join('') + '</body>');
await sheet.waitForTimeout(500);
await sheet.screenshot({ path: path.join(ADS_DIR, 'thumbs.png'), fullPage: true });
await b.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
for (const r of report) console.log(JSON.stringify(r));
const bad = report.filter(r => !r.ok);
if (bad.length) { console.log('render: refused', bad.map(r => r.image).join(', ')); process.exit(1); }
console.log(`render: ${report.length} images, each its exact size, at most 5 MB, overlay under ${OVERLAY} %, nothing within ${EDGE} px of an edge`);
