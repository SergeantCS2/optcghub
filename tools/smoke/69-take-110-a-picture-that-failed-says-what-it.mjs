/* smoke section 69: take 110 — a picture that failed says what it is, readably (UI-AUDIT §1\'s last box)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 110 — a picture that failed says what it is, readably (UI-AUDIT §1\'s last box)');
{ const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  const hexes = [...new Set([...css.matchAll(/--c-[a-z]+:(#[0-9A-Fa-f]{6})/g)].map(m => m[1].toLowerCase()))];
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const [r, g, b] = c.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const over = (c, a, ink) => c.map((v, i) => Math.round(v * (1 - a) + ink[i] * a));   // ink at alpha a over the ground
  const pill = hexes.map(h => ratio([255, 255, 255], over(rgb(h), 0.55, [0, 0, 0])));
  ok('the label on a failed picture is white on a dark pill, above 4.5:1 over every game colour', /\.ph \.phl\{color:#fff;background:rgba\(0,0,0,\.55\)/.test(css) && /<span class="phl">\$\{label\}<\/span>/.test(js) && hexes.length >= 6 && Math.min(...pill) >= 4.5, pill.map(r => r.toFixed(2)).join(' '));
  const old = hexes.map(h => ratio(over(rgb(h), 0.65, [0, 0, 0]), rgb(h)));
  ok('...control: take 109\'s black at 65 % on the colour is caught below 4.5:1', Math.min(...old) < 4.5, old.map(r => r.toFixed(2)).join(' '));
}
}
