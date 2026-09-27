// Each saved scan's own accent colour: the most weighted hue among its saturated, bright pixels, as a deep
// and a bright variant. An effect drawn around a card (Pull v3's aura) takes its colour from the card, so a
// new hero brings its own colour and nothing is picked by eye.
//   node design/marketing/accent.mjs   -> $ADS_OUT/art/accents.json  { "<id>": { deep, bright, hue, share } }
// The scans are read as data URLs, so the canvas is not tainted; nothing is fetched.
import fs from 'node:fs'; import path from 'node:path';
import { browser } from '../play-listing/lib.mjs';
import { ADS_DIR } from './paths.mjs';
const ART = path.join(ADS_DIR, 'art');
const files = fs.readdirSync(ART).filter(f => /^\d+\.png$/.test(f));
const b = await browser(); const page = await b.newPage();
const out = {};
for (const f of files) {
  const url = 'data:image/png;base64,' + fs.readFileSync(path.join(ART, f)).toString('base64');
  out[f.replace('.png', '')] = await page.evaluate(async (url) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'), w = c.width = 120, h = c.height = Math.round(120 * img.naturalHeight / img.naturalWidth);
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, bins = Array.from({ length: 24 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
    let total = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255, g = d[i + 1] / 255, bb = d[i + 2] / 255, mx = Math.max(r, g, bb), mn = Math.min(r, g, bb), s = mx ? (mx - mn) / mx : 0;
      if (s < 0.35 || mx < 0.25) continue;
      let hh = mx === mn ? 0 : mx === r ? ((g - bb) / (mx - mn)) % 6 : mx === g ? (bb - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
      hh = (hh * 60 + 360) % 360;
      const k = Math.floor(hh / 15), wt = s * mx; const B = bins[k];
      B.w += wt; B.r += d[i] * wt; B.g += d[i + 1] * wt; B.b += d[i + 2] * wt; total += wt;
    }
    const top = bins.map((B, i) => ({ ...B, i })).sort((a, z) => z.w - a.w)[0];
    const rgb = [top.r / top.w, top.g / top.w, top.b / top.w];
    const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    const mx = Math.max(...rgb) || 1;
    return { hue: top.i * 15 + 7.5, share: +(top.w / total).toFixed(2), deep: hex(rgb.map(v => v * 0.45)), bright: hex(rgb.map(v => v / mx * 255 * 0.95 + 20)) };
  }, url);
}
await b.close();
fs.writeFileSync(path.join(ART, 'accents.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
