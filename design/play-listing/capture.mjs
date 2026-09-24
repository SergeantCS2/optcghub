// The Play listing's in-app screens, from the live release (Pages), at the Fold's cover viewport.
// A fake collection and deck (showcase/, generated for exactly this at take 37) go in through the
// app's own importers, the deck first so its printings are the ordinary ones. The card art is on
// (lib.mjs; NO_ART=1 for a set without it), and each shot waits for the art on screen to finish loading.
//   node design/play-listing/capture.mjs      -> $LISTING_OUT/shots/NN-name.png + report.json
import { launch, wait, REPO, BUILD } from './lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
const OUT = path.join(BUILD, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const report = { steps: [] };
const { browser, page, net, open } = await launch();
/* Google bars "Free", calls to action and rankings in listing images -- in the app's own words too. Every
   visible match is recorded with where it sits (CSS px from the top), and frames.py refuses a frame that
   shows one above its sea. Covered text (under a sheet) is recorded but marked. */
const BANNED = String.raw`\b(free|download|install|best|top rated|try now|play now)\b|#1\b`;
const banned = () => page.evaluate((src) => { const R = new RegExp(src, 'gi'), out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) { for (const m of n.textContent.matchAll(R)) {
    const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
    const r = rg.getClientRects()[0]; if (!r || !r.width || r.bottom < 0 || r.top > innerHeight) continue;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2), el = n.parentElement;
    out.push({ word: m[0], top: Math.round(r.top), covered: !(hit && (hit === el || el.contains(hit) || hit.contains(el))),
      text: n.textContent.trim().slice(0, 70) }); } }
  return out; }, BANNED);
const shot = async (name) => { const f = path.join(OUT, name + '.png'); await page.screenshot({ path: f }); return f; };
/* every image on screen loaded (or failed) before the shot; a slow CDN gives up after 15 s */
const artLoaded = () => page.waitForFunction(() => [...document.images].filter(i => { const r = i.getBoundingClientRect();
  return r.width && r.bottom > 0 && r.top < innerHeight; }).every(i => i.complete), null, { timeout: 15000, polling: 250 }).then(() => true, () => false);
const settle = async (ms = 700) => { await wait(ms); await page.evaluate(() => document.fonts && document.fonts.ready); };

await open();
report.take = await page.evaluate(() => window.VAULT.TAKE);
if (report.take < 110) throw new Error('the live build is take ' + report.take + ', not 110+');

/* ---- the fake deck, through a deck's own Import (the deck first: see the header) ---- */
const deckId = await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('play', true);
  V.OWN.items = []; V.DECKS.list.length = 0; const d = V.DECKS.blank(); d.name = 'Red Zoro'; d.created = Date.now();
  V.DECKS.list.push(d); V.DECKS.save(); V.openDeck(d.id); return d.id; });
await settle(500);
await page.click('#dkImport'); await page.waitForSelector('#askSheet.on #askIn');
await page.fill('#askIn', fs.readFileSync(path.join(REPO, 'showcase', 'deck.txt'), 'utf8'));
await page.click('#askOk'); await settle(900);
report.deck = await page.evaluate((id) => { const V = window.VAULT; const d = V.DECKS.list.find(x => x.id === id); const L = V.legality(d);
  return { cards: d.cards.reduce((a, c) => a + c.n, 0), leader: (V.CAT.byId.get(d.leader) || {}).name, legal: L.problems.length === 0, problems: L.problems }; }, deckId);

/* ---- the fake collection, through Collection's own Import and the file picker ---- */
await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('collection'); });
await settle(600);
const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.locator('[data-act="import"]:visible').first().click()]);
await fc.setFiles(path.join(REPO, 'showcase', 'collection.csv'));
await settle(2500);
/* The import made its last new collection (the trade pile) the active one (PF.add sets active): back to
   the main binder, named as a collector would rather than after the franchise. */
report.collection = await page.evaluate(() => { const V = window.VAULT; const toast = (document.querySelector('.toast') || {}).textContent || '';
  const PFs = JSON.parse(localStorage.getItem('vault.pfs') || '[]');
  return { toast, lines: V.OWN.items.length, cards: V.OWN.items.reduce((a, i) => a + i.qty, 0), all: +V.OWN.total(true).toFixed(2), pfs: PFs.map(p => p.name), activeAfterImport: localStorage.getItem('vault.pf') }; });
await page.evaluate(() => { const pfs = JSON.parse(localStorage.getItem('vault.pfs') || '[]'); const m = pfs.find(p => p.id === 'main'); if (m) m.name = 'Main binder';
  localStorage.setItem('vault.pfs', JSON.stringify(pfs)); localStorage.setItem('vault.pf', 'main'); });
/* Home's chart: the app keeps one snapshot a day (OWN.snaps), and a fresh import has one. The past
   month is reconstructed from the app's own nightly price history (CAT.days, CAT.hist[productId]):
   what this collection was actually worth at each night's market -- real prices, not an invented line. */
report.history = await page.evaluate(() => { const V = window.VAULT; const C = V.CAT, days = C.days || [];
  const items = V.OWN.items.filter(i => (i.pf || 'main') === 'main'); const n = items.reduce((a, i) => a + i.qty, 0);
  const snaps = []; const from = Math.max(0, days.length - 31);
  for (let di = from; di < days.length; di++) { let t = 0, known = 0;
    for (const it of items) { const h = C.hist[it.id]; const m = h && h[di]; if (m != null) { t += m * it.qty; known++; } }
    if (known >= items.length * 0.9) snaps.push([days[di], +t.toFixed(2), n]); }
  localStorage.setItem('vault.snaps', JSON.stringify(snaps));
  return { days: days.length, first: snaps.length ? snaps[0][0] : null, last: snaps.length ? snaps[snaps.length - 1][0] : null, points: snaps.length,
    lowHigh: snaps.length ? [Math.min(...snaps.map(x => x[1])), Math.max(...snaps.map(x => x[1]))] : null }; });
await open();   /* reload so every screen reads the renamed, re-scoped collection and its history from storage */
report.collection.main = await page.evaluate(() => +window.VAULT.OWN.total().toFixed(2));

const steps = [
  ['01-collection-grid', async () => {
    /* the binder itself, most valuable first: the collection's own cards, with their art */
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('collection'); window.scrollTo(0, 0); });
    await settle(900);
    return page.evaluate(() => ({ imgs: [...document.querySelectorAll('#collection img')].filter(i => i.getBoundingClientRect().top < innerHeight).length }));
  }],
  ['02-scan-printing-picker', async () => {
    /* the browser build's shutter runs simulateScan(): a real card through the REAL gate. Its one random
       draw is pinned to an EB03-024 printing, so the gate itself decides to ask which printing it is. */
    const seed = await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('scan');
      const rows = V.CAT.rows.filter(p => p.num); const i = rows.findIndex(p => p.num === 'EB03-024' && p.treat === 'base');
      const r0 = Math.random; let used = false; Math.random = () => { if (!used) { used = true; Math.random = r0; return (i + 0.5) / rows.length; } return r0(); };
      return i >= 0 ? rows[i].num + ' ' + rows[i].name : 'none'; });
    await settle(500);
    await page.click('#btnShutter');
    await page.waitForSelector('#picker.on', { timeout: 8000 });
    await settle(700);
    return { seed, title: await page.textContent('#pkTitle'), options: await page.$$eval('#pkOpts .opt', o => o.length) };
  }],
  ['03-home-value', async () => {
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0); });
    await settle(600);
    /* the "New in this update" card is for testers, not a store visitor: dismissed with its own button */
    await page.evaluate(() => { const b = [...document.querySelectorAll('#home button')].find(x => /got it/i.test(x.textContent)); if (b) b.click(); window.scrollTo(0, 0); });
    await settle(900);
    return page.evaluate(() => ({ cap: (document.querySelector('#pfSwitch') || {}).textContent, total: (document.querySelector('#pfTotal') || {}).textContent, delta: ((document.querySelector('#pfDelta') || {}).textContent || '').trim().slice(0, 60) }));
  }],
  ['04-card-detail', async () => {
    /* the priciest EB03-024 printing, from the top: its name, its art, its set line and its price */
    const card = await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} const sp = V.candidates('EB03-024', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0))[0];
      V.openDetail(sp.id); window.scrollTo(0, 0); return sp.num + ' ' + sp.name + ' ' + sp.treat + ' $' + sp.market; });
    await settle(900);
    return { card, sub: await page.evaluate(() => ((document.querySelector('#dSub') || {}).textContent || '').trim().slice(0, 90)) };
  }],
  ['05-deck-builder', async () => {
    await page.evaluate((id) => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('play', true); V.openDeck(id); window.scrollTo(0, 0); }, deckId);
    await settle(1000);
    return page.evaluate(() => ({ head: ((document.querySelector('#deck') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) }));
  }],
  ['06-hunt-sealed', async () => {
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.NAV.zipAsked = true; V.MODE.set('hunt', true); V.go('sealed'); while (V.closeAnyOverlay()) {} window.scrollTo(0, 0); });
    await settle(1200);
    /* The first release set whose products all carry a picture (at least three). Sets not out yet have
       none in the catalogue, and starter decks sit apart. Art above the strip loads as the page moves and
       pushes it down, so the scroll is repeated until the strip stays put. */
    const set = await page.evaluate(() => { const st = [...document.querySelectorAll('#sealedList .setstrip')];
      for (const x of st) { if (/starter/i.test(x.textContent)) continue; const rows = [];
        for (let n = x.nextElementSibling; n && !n.classList.contains('setstrip'); n = n.nextElementSibling) if (n.classList.contains('row')) rows.push(n);
        if (rows.length >= 3 && rows.every(r => r.querySelector('img'))) { x.id = 'listingSet'; return x.textContent.trim().slice(0, 60); } }
      return null; });
    let top = null;
    for (let k = 0; k < 6; k++) {
      await page.evaluate(() => { const x = document.querySelector('#listingSet'); if (x) window.scrollTo(0, x.getBoundingClientRect().top + window.scrollY - 60); });
      await artLoaded(); await settle(500);
      const t = await page.evaluate(() => Math.round((document.querySelector('#listingSet') || { getBoundingClientRect: () => ({ top: -1 }) }).getBoundingClientRect().top));
      if (t === top) break; top = t;
    }
    return { set, stripTop: top };
  }],
  ['07-game-day', async () => {
    const who = await page.evaluate((id) => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('play', true);
      const d = V.DECKS.list.find(x => x.id === id); const other = V.CAT.stock && V.CAT.stock.find(s => s.leader !== d.leader);
      V.PLAY.hotseat = false; V.PLAY.p[0].leader = d.leader; V.PLAY.p[1].leader = other ? other.leader : d.leader;
      /* mid-game, as a table would see it: turn 6, both sides' Life and DON!! in play */
      Object.assign(V.PLAY.p[0], { life: 3, don: 4, given: 2 }); Object.assign(V.PLAY.p[1], { life: 4, don: 3, given: 2 }); V.PLAY.turn = 6; V.PLAY.first = 0;
      V.go('play'); V.paintPlay(); window.scrollTo(0, 0);
      return [d.leader, other && other.leader].map(x => (V.CAT.byId.get(x) || {}).name).join(' vs '); }, deckId);
    await settle(900);
    return { who };
  }],
  ['08-offline', async () => {
    /* Settings' Sync and Catalogue panels: what needs the network (the nightly prices) and what the phone
       already holds. The panels either side stay out of the frame: How it works carries a rating link, and
       the web build's Save credits copy says "free" (Google bars "Free" in listing images). */
    const r = await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('settings'); window.scrollTo(0, 0);
      const h = [...document.querySelectorAll('#setBody h3')]; const at = t => h.find(x => x.textContent.trim() === t);
      const sync = at('Sync').closest('.panel'), cat = at('Catalogue').closest('.panel'), cred = at('Save credits').closest('.panel');
      window.scrollTo(0, sync.getBoundingClientRect().top + window.scrollY - 28);   /* the credits' copy then sits well under the sea */
      const b = e => Math.round(e.getBoundingClientRect().top), e_ = e => Math.round(e.getBoundingClientRect().bottom);
      return { syncTop: b(sync), catBottom: e_(cat), creditsTop: b(cred), creditsNoteTop: b(cred.querySelector('.note')),
        sync: sync.textContent.replace(/\s+/g, ' ').trim().slice(0, 200), cat: cat.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) }; });
    await settle(700);
    return r;
  }],
  ['x-settings-first-draft', async () => {
    /* NOT a listing frame: the negative control for the banned-word guard -- Settings scrolled to Data
       sources as the first draft framed it, where the web build's copy says "free". Run it by name. */
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('settings');
      const h = [...document.querySelectorAll('#setBody h3')].find(x => /source/i.test(x.textContent)); h.scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy(0, -70); });
    await settle(700); return {};
  }],
];
/* node capture.mjs 03 08 -> only those steps (the seeding always runs); PROBE=1 adds a full-page shot of each */
const only = process.argv.slice(2);
for (const [name, run] of steps.filter(([n]) => only.length ? only.some(o => n.startsWith(o)) : !n.startsWith('x-'))) {
  try { const m = await run(); const loaded = await artLoaded(); await wait(400);
    report.steps.push({ name, ok: true, artLoaded: loaded, file: await shot(name), ...m, banned: await banned() });
    if (process.env.PROBE) await page.screenshot({ path: path.join(OUT, name + '-full.png'), fullPage: true }); }
  catch (e) { report.steps.push({ name, ok: false, error: String(e).slice(0, 200), file: await shot(name + '-FAILED') }); }
}
report.net = net;
fs.writeFileSync(path.join(OUT, only.length ? 'report-partial.json' : 'report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
await browser.close();
