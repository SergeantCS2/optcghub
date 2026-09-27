// The ads' in-app screens and card art, from the live release (Pages). It seeds the app the way the
// listing does (design/play-listing/capture.mjs): the showcase deck and collection go in through the app's
// own importers, then the month's history is rebuilt from the app's nightly prices. Then it shoots the
// states each ad needs. Every number an ad may print is written to report.json, and the compositions
// read them from there, never typed in (a price in an ad is out of date within a week).
//   node design/marketing/capture.mjs            -> $ADS_OUT/shots/*.png, $ADS_OUT/art/*.png, report.json
//   node design/marketing/capture.mjs picker home -> only those steps (the seeding always runs)
// The card art is on (the owner, 27 Sept: as the listing, and as the hero in places). NO_ART=1 refuses the
// image CDN, as in the listing. The art is fetched by Node at render time and exists only in the renders
// outside the tree; it is never committed (landmines 26, 28).
import { launch, wait, REPO, COVER } from '../play-listing/lib.mjs';
import { ADS_DIR as ADS } from './paths.mjs';
import fs from 'node:fs';
import path from 'node:path';

const SHOTS = path.join(ADS, 'shots'), ART = path.join(ADS, 'art');
fs.mkdirSync(SHOTS, { recursive: true }); fs.mkdirSync(ART, { recursive: true });
/* The Fold's open screen, MEASURED at take 115 (tools/look/steps.mjs VIEWPORTS): the landscape ads' layout */
const OPEN = { width: 749, height: 832 };
/* The hero printings: one number, three printings, and TCGplayer scans without the "SAMPLE" mark, picked
   by eye from the catalogue on 27 Sept (most large scans carry it). A printing is the unit (AGENTS §3), so
   these are product ids, and the number is only the caption's. */
const HERO = { num: 'OP01-120', ids: [454664, 454665, 454666] };
const PICKER_NUM = 'OP01-120';

const report = { steps: [], hero: null };
const { browser, page, net, open } = await launch();
const settle = async (ms = 700) => { await wait(ms); await page.evaluate(() => document.fonts && document.fonts.ready); };
const artLoaded = () => page.waitForFunction(() => [...document.images].filter(i => { const r = i.getBoundingClientRect();
  return r.width && r.bottom > 0 && r.top < innerHeight; }).every(i => i.complete), null, { timeout: 15000, polling: 250 }).then(() => true, () => false);
const home = () => page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} });
/* where the pieces a composition crops to sit on screen, in CSS px (the shot is at COVER.dpr) */
const rects = (sels) => page.evaluate((sels) => Object.fromEntries(Object.entries(sels).map(([k, s]) => { const e = document.querySelector(s);
  if (!e) return [k, null]; const r = e.getBoundingClientRect(); return [k, { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }]; })), sels);

/* ---- the seeding, lifted from the listing's capture: the deck, the collection, the month ---- */
await open();
report.take = await page.evaluate(() => window.VAULT.TAKE);
const deckId = await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('play', true);
  V.OWN.items = []; V.DECKS.list.length = 0; const d = V.DECKS.blank(); d.name = 'Red Zoro'; d.created = Date.now();
  V.DECKS.list.push(d); V.DECKS.save(); V.openDeck(d.id); return d.id; });
await settle(500);
await page.click('#dkImport'); await page.waitForSelector('#askSheet.on #askIn');
await page.fill('#askIn', fs.readFileSync(path.join(REPO, 'showcase', 'deck.txt'), 'utf8'));
await page.click('#askOk'); await settle(900);
await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('collection'); });
await settle(600);
const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.locator('[data-act="import"]:visible').first().click()]);
await fc.setFiles(path.join(REPO, 'showcase', 'collection.csv'));
await settle(2500);
await page.evaluate(() => { const pfs = JSON.parse(localStorage.getItem('vault.pfs') || '[]'); const m = pfs.find(p => p.id === 'main'); if (m) m.name = 'Main binder';
  localStorage.setItem('vault.pfs', JSON.stringify(pfs)); localStorage.setItem('vault.pf', 'main'); });
report.history = await page.evaluate(() => { const V = window.VAULT; const C = V.CAT, days = C.days || [];
  const items = V.OWN.items.filter(i => (i.pf || 'main') === 'main'); const n = items.reduce((a, i) => a + i.qty, 0);
  const snaps = []; const from = Math.max(0, days.length - 31);
  for (let di = from; di < days.length; di++) { let t = 0, known = 0;
    for (const it of items) { const h = C.hist[it.id]; const m = h && h[di]; if (m != null) { t += m * it.qty; known++; } }
    if (known >= items.length * 0.9) snaps.push([days[di], +t.toFixed(2), n]); }
  localStorage.setItem('vault.snaps', JSON.stringify(snaps));
  return { points: snaps.length, first: snaps.length ? snaps[0][0] : null, last: snaps.length ? snaps[snaps.length - 1][0] : null }; });
await open();
report.source = await page.evaluate(() => (window.VAULT.CAT.man || {}).source_updated_at || null);
report.collection = await page.evaluate(() => { const V = window.VAULT; const items = V.OWN.items.filter(i => (i.pf || 'main') === 'main');
  return { total: +V.OWN.total().toFixed(2), shown: V.money(V.OWN.total()), cards: items.reduce((a, i) => a + i.qty, 0), lines: items.length }; });

/* ---- the states ---- */
const steps = [
  ['picker', async () => {
    /* the browser build's shutter runs simulateScan(): a real draw through the REAL gate, its one random
       draw pinned to the hero number's base printing, so the gate itself decides to ask */
    const seed = await page.evaluate((num) => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.BATCH.rows.length = 0; V.BATCH.save(); V.go('scan');
      const rows = V.CAT.rows.filter(p => p.num); const i = rows.findIndex(p => p.num === num && p.treat === 'base');
      const r0 = Math.random; let used = false; Math.random = () => { if (!used) { used = true; Math.random = r0; return (i + 0.5) / rows.length; } return r0(); };
      return i >= 0 ? rows[i].num + ' ' + rows[i].name : null; }, PICKER_NUM);
    if (!seed) throw new Error('no base printing of ' + PICKER_NUM);
    await settle(500); await page.click('#btnShutter');
    await page.waitForSelector('#picker.on', { timeout: 8000 }); await settle(700);
    return page.evaluate(() => ({ title: document.querySelector('#pkTitle').textContent, why: document.querySelector('#pkWhy').textContent.trim(),
      options: [...document.querySelectorAll('#pkOpts .opt')].map(o => ({ label: o.querySelector('.oi b').textContent, price: o.querySelector('.op').firstChild.textContent.trim(),
        top: Math.round(o.getBoundingClientRect().top), bottom: Math.round(o.getBoundingClientRect().bottom) })),
      sheetTop: Math.round(document.querySelector('#picker .sheet, #picker').getBoundingClientRect().top) }))
      .then(async m => ({ ...m, rects: await rects({ title: '#pkTitle', why: '#pkWhy', opts: '#pkOpts' }) }));
  }],
  ['batch', async () => {
    /* a Constructed deck is 51 cards and the app it replaces stops at 25: the showcase deck's printings as
       one scan batch, the state the scan screen shows after scanning them (illustrative, like the listing's) */
    return page.evaluate((id) => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true);
      const d = V.DECKS.list.find(x => x.id === id); const ids = [d.leader, ...d.cards.flatMap(c => Array(c.n).fill(c.id))];
      V.BATCH.rows.length = 0; for (const x of ids) V.BATCH.rows.push({ id: x, photo: null }); V.BATCH.save();
      V.go('scan'); window.scrollTo(0, 0);
      return { cards: V.BATCH.rows.length, count: document.querySelector('#scCount').textContent, total: document.querySelector('#scTotal').textContent,
        credits: document.querySelector('#scanCredits').textContent.trim().slice(0, 120) }; }, deckId);
  }],
  ['home', async () => {
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.BATCH.rows.length = 0; V.BATCH.save(); V.MODE.set('collect', true); V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0); });
    await settle(600);
    await page.evaluate(() => { const b = [...document.querySelectorAll('#home button')].find(x => /got it/i.test(x.textContent)); if (b) b.click(); window.scrollTo(0, 0); });
    await settle(900);
    return page.evaluate(() => { const q = s => ((document.querySelector(s) || {}).textContent || '').trim();
      const R = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; };
      return { total: q('#pfTotal'), delta: q('#pfDelta').slice(0, 60), totalBox: R('#pfTotal') }; })
      .then(async m => ({ ...m, rects: await rects({ hero: '#hero', spark: '#spark', ranges: '#ranges', top: '#topList', topPanel: '.panel:has(#topList)' }) }));
  }],
  ['collection', async () => {
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('collection'); window.scrollTo(0, 0); });
    await settle(900);
    const m = await page.evaluate(() => ({ imgs: [...document.querySelectorAll('#collection img')].filter(i => i.getBoundingClientRect().top < innerHeight).length }));
    return { ...m, rects: await rects({ search: '#collection .search, #collection input', grid: '#colGrid' }) };
  }],
  ['detail', async () => {
    const card = await page.evaluate((id) => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.openDetail(id); window.scrollTo(0, 0);
      const p = V.CAT.byId.get(id); return { card: p.name, num: p.num, treat: p.treat, market: V.money(p.market) }; }, HERO.ids[2]);
    await settle(900);
    return { ...card, rects: await rects({ title: '#detail h1, #dName', sub: '#dSub' }) };
  }],
  ['deck', async () => {
    await page.evaluate((id) => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('play', true); V.openDeck(id); window.scrollTo(0, 0); }, deckId);
    await settle(1000);
    return page.evaluate(() => ({ head: ((document.querySelector('#deck') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140) }));
  }],
  ['offline', async () => {
    /* the network cut, then Home repainted and the collection opened: what a collector sees in airplane mode */
    await page.context().setOffline(true);
    const r = await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0);
      return { online: navigator.onLine, total: (document.querySelector('#pfTotal') || {}).textContent }; });
    await settle(900);
    /* The phone's catalogue ships in the APK, so a session in airplane mode makes no request and Home's pill
       reads "Offline OK". The web build fetched its catalogue at load; the session's count is zeroed and the
       pill painted exactly as paintNet() paints a zero count. Recorded in the report as staged. */
    await page.evaluate(() => { const V = window.VAULT; V.NET.count = 0; const d = document.querySelector('#netdot'), l = document.querySelector('#netlbl');
      if (d && l) { d.className = 'dot'; l.textContent = 'Offline OK'; } });
    await settle(300);
    return { ...r, pill: 'staged: paintNet() at a zero count', rects: await rects({ pill: '#netlbl', hero: '#hero', spark: '#spark', ranges: '#ranges' }) };
  }],
  ['open-home', async () => {
    await page.context().setOffline(false);
    await page.setViewportSize(OPEN);
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0); });
    await settle(1000);
    return { viewport: OPEN, rects: await rects({ hero: '#hero', spark: '#spark', top: '#topList' }) };
  }],
  ['open-collection', async () => {
    await page.setViewportSize(OPEN);
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('collection'); window.scrollTo(0, 0); });
    await settle(1000);
    return { viewport: OPEN };
  }],
];

/* the open-* steps run last and leave the viewport at the open screen's size; nothing after them shoots the app */
const only = process.argv.slice(2);
for (const [name, run] of steps.filter(([n]) => !only.length || only.some(o => n.startsWith(o)))) {
  try {
    const m = await run(); const loaded = await artLoaded(); await wait(400);
    const file = path.join(SHOTS, name + '.png'); await page.screenshot({ path: file });
    report.steps.push({ name, ok: true, artLoaded: loaded, file, ...m });
  } catch (e) { report.steps.push({ name, ok: false, error: String(e).slice(0, 240) }); }
}

/* ---- the hero art: each printing's largest scan, as the app draws it (artUrl 'large'), at its own size ---- */
if (!only.length || only.includes('art')) {
  const hero = await page.evaluate((ids) => ids.map(id => { const V = window.VAULT, p = V.CAT.byId.get(id);
    return { id, num: p.num, name: p.name, treat: p.treat, sub: p.sub || '', market: p.market, shown: V.money(p.market), url: V.artUrl(p, 'large') }; }), HERO.ids);
  if (!process.env.NO_ART) {
    const art = await page.context().newPage();
    await art.route('**/*', async r => { try { return r.fulfill({ response: await r.fetch() }); } catch { return r.abort(); } });
    for (const h of hero) {
      await art.setViewportSize({ width: 800, height: 1200 });
      await art.setContent(`<body style="margin:0;background:#000"><img id=a src="${h.url}" style="display:block"></body>`);
      await art.waitForFunction(() => document.querySelector('#a').complete, null, { timeout: 20000 }).catch(() => {});
      const size = await art.evaluate(() => { const i = document.querySelector('#a'); return { w: i.naturalWidth, h: i.naturalHeight }; });
      h.size = size;
      if (size.w) { h.file = path.join(ART, h.id + '.png'); await (await art.$('#a')).screenshot({ path: h.file, scale: 'css' }); }
    }
    await art.close();
  }
  report.hero = { num: HERO.num, printings: hero };
}
report.net = net;
report.captured = new Date().toISOString();
fs.writeFileSync(path.join(ADS, only.length ? 'report-partial.json' : 'report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
await browser.close();
