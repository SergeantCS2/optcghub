// Shared by capture.mjs and render.mjs. It provides:
// - Playwright, loaded the way tools/look.mjs loads it
// - the live Pages build at the Fold's cover viewport
// - every request fetched by Node: Chromium does not trust the session VM's egress proxy CA, and
//   verification is never disabled
// - the card art, which is on: the owner's call (24 Sept), who wants the collection's own cards in the
//   pictures. NO_ART=1 refuses the image CDN for a set with no character art, since Google restricts
//   third-party characters in listing images.
// - look.mjs's open()
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new globalThis.URL(import.meta.url).pathname);
export const REPO = path.resolve(HERE, '..', '..');
/* Where the renders go: outside the tree. They are generated, and the listing images carry the owner's
   icon pick. LISTING_OUT overrides it; frames.py reads the same variable. */
export const BUILD = process.env.LISTING_OUT || path.join(path.dirname(REPO), 'play-listing-build');
export const APP = 'https://sergeantcs2.github.io/optcghub/';
export const COVER = { width: 411, height: 960, dpr: 2.625 };
export const wait = (ms) => new Promise(r => setTimeout(r, ms));

export async function loadPlaywright() {
  try { const m = await import('playwright'); return m.default || m; } catch { /* not local */ }
  for (const p of ['/opt/node22/lib/node_modules/playwright/index.js', '/usr/lib/node_modules/playwright/index.js']) {
    if (fs.existsSync(p)) { const m = await import(p); return m.default || m; }
  }
  throw new Error('playwright is not installed here (the listing is the session VM\'s tool, like the look)');
}

/* CHROME names a browser when Playwright's own revision is not the one installed */
export async function browser() {
  const pw = await loadPlaywright();
  return pw.chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
}

export async function launch(vp = COVER) {
  const b = await browser();
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr });
  const page = await ctx.newPage();
  const net = { art: 0, cdnBlocked: 0, fetched: 0, failed: 0, failures: [] };
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (/tcgplayer-cdn\.tcgplayer\.com|tcgplayer\.com\/.*\.(jpg|png|webp)/.test(u)) {
      if (process.env.NO_ART) { net.cdnBlocked++; return r.abort(); }
      net.art++;
    }
    if (!/^https?:/.test(u)) return r.continue();
    try { const resp = await r.fetch(); net.fetched++; return r.fulfill({ response: resp }); }
    catch (e) { net.failed++; net.failures.push(u.slice(0, 100)); return r.abort(); }
  });
  const open = async () => {
    await page.goto(APP, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForFunction(() => window.VAULT && window.VAULT.CAT && window.VAULT.CAT.ready, null, { timeout: 60000 });
    await page.waitForFunction(() => !document.querySelector('#splash'), null, { timeout: 15000 }).catch(() => {});
    /* the first-run guide is skipped: its text says "free and unlimited", and Google bars "Free" in listing images */
    await page.evaluate(() => { const s = [...document.querySelectorAll('#tour button')].find(b => /skip/i.test(b.textContent)); if (s) s.click(); });
  };
  return { browser: b, ctx, page, net, open };
}
