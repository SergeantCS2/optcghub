// Each saved scan's own accent colour, as a deep and a bright variant. An effect drawn around a card (the
// aura, the headline's accent word, the callout's rim) takes its colour from the card, so a new hero brings
// its own colour and nothing is picked by eye.
//
// How the colour is read, among the card's saturated, bright pixels (weighted by saturation x value):
// - hues fall in 24 bins of 15 degrees, and a colour is scored with its two neighbours (a 45-degree window).
//   One colour often straddles a bin edge: Yamato's blue (EB02-006) fell 0.24 + 0.17 into two bins and lost
//   to a 0.30 red, so her aura came out red on a blue card (27 Sept).
// - the band the aura leaves from -- the outer 12 % of the top and both sides -- counts twice, beside the
//   whole card: the flame starts at the card's edge, so its colour should be the edge's (at Yamato's edge,
//   blue is 0.70 of the colour).
// - the colour is the weighted mean of the pixels in the winning window.
//   node design/marketing/accent.mjs            -> $ADS_OUT/art/accents.json  { "<id>": { deep, bright, hue, share } }
//   node design/marketing/accent.mjs --selftest -> a synthetic card with a split blue and a larger single red:
//                                                  blue must win, and must lose with the window off
// The scans are read as data URLs, so the canvas is not tainted; nothing is fetched.
import fs from 'node:fs'; import path from 'node:path';
import { browser } from '../play-listing/lib.mjs';
import { ADS_DIR } from './paths.mjs';
const ART = path.join(ADS_DIR, 'art');

/* runs in the page: returns { hue, share, deep, bright, bin } for RGBA data of w x h */
const MEASURE = `(d, w, h, opt) => {
  const EDGE = opt.edge ?? 2, WIN = opt.window ?? 1;
  const mk = () => Array.from({ length: 24 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  const A = mk(), E = mk(); let TA = 0, TE = 0;
  const band = Math.round(w * .12);
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255, g = d[i + 1] / 255, bb = d[i + 2] / 255, mx = Math.max(r, g, bb), mn = Math.min(r, g, bb), s = mx ? (mx - mn) / mx : 0;
    if (s < 0.35 || mx < 0.25) continue;
    let hh = mx === mn ? 0 : mx === r ? ((g - bb) / (mx - mn)) % 6 : mx === g ? (bb - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
    hh = (hh * 60 + 360) % 360;
    const k = Math.floor(hh / 15) % 24, wt = s * mx, p = i / 4, x = p % w, y = Math.floor(p / w);
    const add = (B, t) => { B.w += t; B.r += d[i] * t; B.g += d[i + 1] * t; B.b += d[i + 2] * t; };
    add(A[k], wt); TA += wt;
    if (y < band || x < band || x >= w - band) { add(E[k], wt); TE += wt; }
  }
  const C = A.map((a, k) => { const e = E[k], fa = TA ? 1 / TA : 0, fe = TE ? EDGE / TE : 0;
    return { w: a.w * fa + e.w * fe, r: a.r * fa + e.r * fe, g: a.g * fa + e.g * fe, b: a.b * fa + e.b * fe }; });
  const total = C.reduce((s, c) => s + c.w, 0) || 1;
  let best = 0, score = -1;
  for (let i = 0; i < 24; i++) { let s = 0; for (let j = -WIN; j <= WIN; j++) s += C[(i + j + 24) % 24].w; if (s > score) { score = s; best = i; } }
  const sum = { w: 0, r: 0, g: 0, b: 0 };
  for (let j = -WIN; j <= WIN; j++) { const c = C[(best + j + 24) % 24]; sum.w += c.w; sum.r += c.r; sum.g += c.g; sum.b += c.b; }
  const rgb = sum.w ? [sum.r / sum.w, sum.g / sum.w, sum.b / sum.w] : [255, 110, 131];
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const top = Math.max(...rgb) || 1;
  return { hue: best * 15 + 7.5, share: +(score / total).toFixed(2), bin: best,
           deep: hex(rgb.map(v => v * 0.45)), bright: hex(rgb.map(v => v / top * 255 * 0.95 + 20)) };
}`;

const b = await browser(); const page = await b.newPage();

if (process.argv.includes('--selftest')) {
  /* 30 % red (hue 350, one bin), 25 % hue 190 and 25 % hue 200 (either side of the 195 boundary), 20 % grey,
     spread so the edge band holds the same mix: the red is the largest single bin, the blue the largest colour */
  const r = await page.evaluate(({ src }) => { const measure = eval(src), w = 120, h = 168, d = new Uint8ClampedArray(w * h * 4);
    const C = [[255, 0, 43], [0, 212, 255], [0, 170, 255], [128, 128, 128]];
    for (let p = 0; p < w * h; p++) { const x = p % w, y = Math.floor(p / w), m = (x + y * 7) % 20;
      const c = C[m < 6 ? 0 : m < 11 ? 1 : m < 16 ? 2 : 3]; d.set([...c, 255], p * 4); }
    return { win: measure(d, w, h, {}), off: measure(d, w, h, { window: 0 }) }; }, { src: MEASURE });
  const blue = x => x.bin >= 12 && x.bin <= 13, red = x => x.bin === 23;
  console.log('selftest: window on ->', r.win.hue, r.win.bright, '| window off ->', r.off.hue, r.off.bright);
  await b.close();
  if (!blue(r.win)) { console.log('selftest: FAILED -- the split blue lost with the window on'); process.exit(1); }
  if (!red(r.off)) { console.log('selftest: FAILED -- the control did not reproduce the red (the test cannot see the bug)'); process.exit(1); }
  console.log('selftest: the split blue wins with the window, and loses without it (the bug, reproduced)');
  process.exit(0);
}

const files = fs.readdirSync(ART).filter(f => /^\d+\.png$/.test(f));
const out = {};
for (const f of files) {
  const url = 'data:image/png;base64,' + fs.readFileSync(path.join(ART, f)).toString('base64');
  out[f.replace('.png', '')] = await page.evaluate(async ({ url, src }) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'), w = c.width = 120, h = c.height = Math.round(120 * img.naturalHeight / img.naturalWidth);
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
    const r = eval(src)(x.getImageData(0, 0, w, h).data, w, h, {}); delete r.bin; return r;
  }, { url, src: MEASURE });
}
await b.close();
fs.writeFileSync(path.join(ART, 'accents.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
