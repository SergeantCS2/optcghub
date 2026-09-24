#!/usr/bin/env node
/* tools/look.mjs — the look (take 99, A40).

   The session's own review of a take: the built www/ opened in a REAL
   Chromium at the Fold's two sizes, a step list walked with real clicks and
   the app's own window.VAULT surface, and after every step a PNG plus one
   measured line. The PNGs are read by the session and sent to the owner
   before a PR is marked ready. This is not CI (render.mjs is pass/fail on
   the runner and stays so); it is the picture the owner reviews.

     node tools/look.mjs 98                 the take-98 steps, both viewports
     node tools/look.mjs 98 --viewport cover
     node tools/look.mjs --selftest         the harness watched to fail first

   Output: look/<take>/<viewport>/NN-<name>.png and look/<take>/report.json.
   look/ is gitignored — the pictures go to the owner, never into the tree.

   Playwright is not a project dependency: it is installed globally on the
   session VM (the runner does not run this). ESM ignores NODE_PATH, so the
   global copy is imported by its absolute path when the bare import fails.
   Limits, honestly: no camera, no notifications, no share sheet, no native
   Back (history Back runs the same handler chain — landmine 137's test), and
   no CDN pictures where the VM's egress is closed (a picture is its label).
   Behind the session VM's proxy (take 109, landmine 152) the browser refuses
   the proxy's certificate while Node checks it against the environment's
   bundle: the two picture hosts are fetched in Node and handed to the page.
   Without a proxy variable nothing of that runs. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { STEPS, VIEWPORTS, CONTROLS } from './look/steps.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(ROOT, 'www');
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const selftest = args.includes('--selftest');
const take = args.find(a => /^\d+$/.test(a));
const which = flag('--viewport') || 'both';
const OUT = path.join(ROOT, 'look', selftest ? 'selftest' : String(take || 'x'));
const MIN_PNG = 20000;                                   // below this a page is blank (render.mjs's same bar)

/* ---- playwright: bare import, then the VM's global copy ------------------ */
async function loadPlaywright() {
  try { return (await import('playwright')).default || await import('playwright'); } catch { /* not local */ }
  for (const p of ['/opt/node22/lib/node_modules/playwright/index.js', '/usr/lib/node_modules/playwright/index.js']) {
    if (fs.existsSync(p)) { const m = await import(p); return m.default || m; }
  }
  return null;
}

/* ---- a static server for www/ (fetch() needs http, not file://) ---------- */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.gz': 'application/gzip' };
function serve(dir) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent((req.url || '/').split('?')[0]);
      let f = path.join(dir, u === '/' ? 'index.html' : u);
      if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}/index.html` }));
  });
}

/* ---- one step: run, measure, screenshot, record --------------------------- */
async function runStep(page, ctx, step, n) {
  const t0 = Date.now();
  let measured = {}, ok = false, err = null;
  await page.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.classList.remove('on'); }).catch(() => {});   /* the last step's toast is not this step's picture */
  try { measured = (await step.run(page, ctx)) || {}; ok = measured.ok !== false; }
  catch (e) { err = String(e && e.message || e); ok = false; }
  const png = path.join(ctx.dir, `${String(n).padStart(2, '0')}-${step.name}.png`);
  let bytes = 0;
  try { await page.screenshot({ path: png, fullPage: false }); bytes = fs.statSync(png).size; } catch (e) { err = err || String(e); }
  const overflow = await page.evaluate(() => ({ sw: document.body ? document.body.scrollWidth : 0, vw: document.documentElement.clientWidth })).catch(() => ({ sw: 0, vw: 0 }));
  if (bytes < MIN_PNG) { ok = false; err = err || `screenshot ${bytes} bytes — a blank page`; }
  if (overflow.sw > overflow.vw + 1) { ok = false; err = err || `sideways scroll: ${overflow.sw} > ${overflow.vw}`; }
  const rec = { viewport: ctx.viewport, step: step.name, ok, measured, err, png: path.relative(ROOT, png), bytes, overflow, ms: Date.now() - t0 };
  ctx.report.push(rec);
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${ctx.viewport}/${step.name}  ${err ? err + '  ' : ''}${JSON.stringify(measured).slice(0, 160)}`);
  return rec;
}

const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy || '';
const PICTURES = /^https:\/\/(tcgplayer-cdn|product-images)\.tcgplayer\.com\//;

async function main() {
  /* Node's fetch goes through the proxy only when it starts with NODE_USE_ENV_PROXY=1 */
  if (PROXY && process.env.NODE_USE_ENV_PROXY !== '1') {
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } });
    process.exit(r.status == null ? 1 : r.status);
  }
  const pictures = { fetched: 0, refused: 0 };
  const pw = await loadPlaywright();
  if (!pw) { console.log('look: playwright is not installed here (the look is the session VM\'s tool; the runner has puppeteer and render.mjs)'); process.exit(2); }
  if (!selftest && !STEPS[take]) { console.log(`look: no step list for take ${take} in tools/look/steps.mjs (have: ${Object.keys(STEPS).join(', ')})`); process.exit(2); }
  if (!fs.existsSync(path.join(WWW, 'app.js'))) { console.log('look: www/app.js is missing — python3 tools/pipeline.py app first'); process.exit(2); }
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const { srv, url } = await serve(WWW);
  const browser = await pw.chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = [];
  const names = which === 'both' ? Object.keys(VIEWPORTS) : [which];
  const steps = selftest ? CONTROLS : STEPS[take];
  try {
    for (const vp of names) {
      const v = VIEWPORTS[vp]; if (!v) { console.log(`look: no viewport '${vp}' (have: ${Object.keys(VIEWPORTS).join(', ')})`); process.exit(2); }
      const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dpr });
      if (PROXY) await page.route(PICTURES, async route => {
        try {
          const r = await fetch(route.request().url(), { headers: { 'User-Agent': 'Mozilla/5.0 optcghub-look' } });
          const body = Buffer.from(await r.arrayBuffer());
          if (r.ok) pictures.fetched += 1; else pictures.refused += 1;
          await route.fulfill({ status: r.status, contentType: r.headers.get('content-type') || 'image/jpeg', body });
        } catch { pictures.refused += 1; await route.abort().catch(() => {}); }
      });
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      const dir = path.join(OUT, vp); fs.mkdirSync(dir, { recursive: true });
      const ctx = { viewport: vp, dir, url, report, errors, shots: 0,
        /* an extra picture mid-step, for a moment the after-step shot would miss (a splash, a toast) */
        shot: async (label) => { ctx.shots += 1; const p = path.join(dir, `${label}.png`); await page.screenshot({ path: p }); return path.relative(ROOT, p); },
        /* a page load that waits for the catalogue */
        open: async () => { await page.goto(url, { waitUntil: 'networkidle' }); await page.waitForFunction(() => window.VAULT && window.VAULT.CAT && window.VAULT.CAT.ready, null, { timeout: 30000 }); await page.waitForFunction(() => !document.querySelector('#splash'), null, { timeout: 15000 }).catch(() => {}); /* the splash lingers a moment (take 86); a step's picture is what is under it */ await page.evaluate(() => { const s = [...document.querySelectorAll('#tour button')].find(b => /skip/i.test(b.textContent)); if (s) s.click(); }); } };
      console.log(`\n── look ${selftest ? 'selftest' : 'take ' + take} · ${vp} ${v.width}×${v.height} @${v.dpr}${v.note ? '  (' + v.note + ')' : ''}`);
      let n = 0;
      for (const step of steps) await runStep(page, ctx, step, ++n);
      if (errors.length) console.log(`  page errors: ${errors.slice(0, 3).join(' | ')}`);
      await page.close();
    }
  } finally { await browser.close(); srv.close(); }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  const bad = report.filter(r => !r.ok);
  if (selftest) {
    /* the harness watched to fail: every control must be reported NOT ok */
    const fired = CONTROLS.every(c => report.filter(r => r.step === c.name).every(r => !r.ok));
    console.log(`\nlook selftest: ${fired ? 'every control fired (the harness reports a wrong expectation and a blank page as failures)' : 'A CONTROL DID NOT FIRE'}`);
    process.exit(fired ? 0 : 1);
  }
  if (PROXY) console.log(`\npictures through Node behind the proxy: ${pictures.fetched} fetched, ${pictures.refused} refused by the host`);
  console.log(`\nlook take ${take}: ${report.length} steps, ${report.length - bad.length} ok, ${bad.length} not ok — ${path.relative(ROOT, OUT)}/`);
  process.exit(bad.length ? 1 : 0);
}
main().catch(e => { console.log('look: ' + (e && e.stack || e)); process.exit(1); });
