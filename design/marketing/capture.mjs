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
const HERE = path.dirname(new globalThis.URL(import.meta.url).pathname);
import fs from 'node:fs';
import path from 'node:path';

const SHOTS = path.join(ADS, 'shots'), ART = path.join(ADS, 'art');
fs.mkdirSync(SHOTS, { recursive: true }); fs.mkdirSync(ART, { recursive: true });
/* The Fold's open screen, MEASURED at take 115 (tools/look/steps.mjs VIEWPORTS): the landscape ads' layout */
const OPEN = { width: 749, height: 832 };
/* The hero printings: one number, three of its printings. A printing is the unit (AGENTS §3), so these are
   product ids, and the number is only the caption's. HERO=NUM:id,id,id overrides.
   - Round 1 and the first round-2 drafts: OP01-120 Shanks 454664, 454665, 454666 -- the one number of the
     widest 30 whose three scans carry no "SAMPLE" mark (picked by eye, 27 Sept).
   - Since round 2's second pass (the owner: "change Shanks to Zoro, whatever the most expensive Zoro card is
     with three cards"): OP09-076, the dearest Zoro with three or more printings -- the Championship 25-26
     Regionals prize ($5,000 market on 26 Sept; one listing, at $8,000), its alternate art, and the
     Emperors in the New World base ($0.20). Two of the three scans carry "SAMPLE", as TCGplayer serves them.
   - Since Pull v3 (the owner: "change the card to be EB04-007 and its other two cards"): EB04-007's three
     printings, all SR and none a promo -- the base and the alternate art from Adventure on Kami's Island and
     the SP from The World's Strongest Warriors. */
const HERO = (() => { const e = process.env.HERO; if (!e) return { num: 'EB04-007', ids: [685303, 685304, 705991] };
  const [num, ids] = e.split(':'); return { num, ids: ids.split(',').map(Number) }; })();
const PICKER_NUM = HERO.num;

const report = { steps: [], hero: null };
const { browser, page, net, open } = await launch();
const settle = async (ms = 700) => { await wait(ms); await page.evaluate(() => document.fonts && document.fonts.ready); };
const artLoaded = () => page.waitForFunction(() => [...document.images].filter(i => { const r = i.getBoundingClientRect();
  return r.width && r.bottom > 0 && r.top < innerHeight; }).every(i => i.complete), null, { timeout: 15000, polling: 250 }).then(() => true, () => false);
const home = () => page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} });
/* Play bars "Free", calls to action, rankings and "new/sale" wording in listing images -- the app's own words
   too (Play Console Help, read 27 Sept). Every visible match is recorded with where it sits (CSS px), ported
   from design/play-listing/capture.mjs; the listing composer refuses a frame that shows one. */
const BANNED = String.raw`\b(free|download|install|best|top|top rated|try now|play now|new|discount|sale)\b|#1\b`;
const banned = () => page.evaluate((src) => { const Rx = new RegExp(src, 'gi'), out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) { for (const m of n.textContent.matchAll(Rx)) {
    const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
    const r = rg.getClientRects()[0]; if (!r || !r.width || r.bottom < 0 || r.top > innerHeight) continue;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2), el = n.parentElement;
    out.push({ word: m[0], top: Math.round(r.top), left: Math.round(r.left), covered: !(hit && (hit === el || el.contains(hit) || hit.contains(el))),
      text: n.textContent.trim().slice(0, 70) }); } }
  return out; }, BANNED);
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
      const p = V.CAT.byId.get(id); return { card: p.name, num: p.num, treat: p.treat, market: V.money(p.market) }; },
      (JSON.parse(fs.readFileSync(path.join(HERE, 'heroes.json'), 'utf8')).detail || { ids: [HERO.ids[2]] }).ids[0]);
    await settle(900);
    return { ...card, rects: await rects({ title: '#detail h1, #dName', sub: '#dSub' }) };
  }],
  ['deck', async () => {
    await page.evaluate((id) => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('play', true); V.openDeck(id); window.scrollTo(0, 0); }, deckId);
    await settle(1000);
    const m = await page.evaluate(() => ({ head: ((document.querySelector('#deck') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140) }));
    return { ...m, rects: await rects({ lead: '#dkLeadLine', legal: '#dkLegal', curve: '.panel:has(#dkCurve)' }) };
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
  ['trade', async () => {
    /* heroes.json's trade: you give the showcase collection's printing, you get theirs -- through the app's own
       TRADE lists, then Trade repainted by go() */
    const H = JSON.parse(fs.readFileSync(path.join(HERE, 'heroes.json'), 'utf8')).trade.ids;
    const r = await page.evaluate(([get, give]) => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true);
      V.TRADE.give.length = 0; V.TRADE.get.length = 0; V.TRADE.add('give', give); V.TRADE.add('get', get); V.go('trade'); window.scrollTo(0, 0);
      return { give: V.money(V.CAT.byId.get(give).market), get: V.money(V.CAT.byId.get(get).market),
        verdict: ((document.querySelector('#trVerdict') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160) }; }, H);
    await settle(900);
    return { ...r, rects: await rects({ give: '.panel:has(#trGive)', get: '.panel:has(#trGet)', verdict: '#trVerdict' }) };
  }],
  ['sealed', async () => {
    /* Hunt's Sealed list at the first release set whose products all carry a picture (ported from the listing's
       capture); art above the strip loads as the page moves, so the scroll repeats until the strip stays put */
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.NAV.zipAsked = true; V.MODE.set('hunt', true); V.go('sealed'); while (V.closeAnyOverlay()) {} window.scrollTo(0, 0); });
    await settle(1200);
    const set = await page.evaluate(() => { const st = [...document.querySelectorAll('#sealedList .setstrip')];
      for (const x of st) { if (/starter/i.test(x.textContent)) continue; const rows = [];
        for (let n = x.nextElementSibling; n && !n.classList.contains('setstrip'); n = n.nextElementSibling) if (n.classList.contains('row')) rows.push(n);
        if (rows.length >= 3 && rows.every(r => r.querySelector('img'))) { x.id = 'adSet'; return x.textContent.trim().slice(0, 60); } }
      return null; });
    let top = null;
    for (let k = 0; k < 6; k++) {
      await page.evaluate(() => { const x = document.querySelector('#adSet'); if (x) window.scrollTo(0, x.getBoundingClientRect().top + window.scrollY - 60); });
      await artLoaded(); await settle(500);
      const t = await page.evaluate(() => Math.round((document.querySelector('#adSet') || { getBoundingClientRect: () => ({ top: -1 }) }).getBoundingClientRect().top));
      if (t === top) break; top = t;
    }
    return { set, stripTop: top };
  }],
  ['open-home', async () => {
    await page.context().setOffline(false);
    await page.setViewportSize(OPEN);
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0); });
    await settle(1000);
    return { viewport: OPEN, rects: await rects({ hero: '#hero', spark: '#spark', top: '#topList' }) };
  }],
  ['open-home-tall', async () => {
    /* the open Fold's Home as a long screenshot: the total, the month, and the panels below it side by side.
       The owner (27 Sept): the number and the graph alone are boring -- show the panels, without naming them. */
    await page.setViewportSize({ width: OPEN.width, height: 1500 });
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0); });
    await settle(1000);
    return { viewport: { width: OPEN.width, height: 1500 }, rects: await rects({ hero: '#hero', spark: '#spark', ranges: '#ranges', top: '.panel:has(#topList)', sets: '#setComp' }) };
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
/* ---- the HTML5 ad's states (only when named: `node capture.mjs h5-`), in order: Home before, the scan's
   picker with the dear printing tapped (it joins the batch), Review (the batch committed to the collection),
   Home after, its total up by the card's price. They change the sample collection, so they never run in a
   full capture, and their report is report-html5.json (REPORT=html5), never report.json. */
const pickDear = () => page.evaluate((ids) => { const V = window.VAULT;
  const ps = ids.map(id => V.CAT.byId.get(id)).filter(Boolean).sort((a, b) => (b.market || 0) - (a.market || 0)); return ps[0].id; }, HERO.ids);
const homeTotal = async () => { await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0); });
  await settle(700); await page.evaluate(() => { const b = [...document.querySelectorAll('#home button')].find(x => /got it/i.test(x.textContent)); if (b) b.click(); window.scrollTo(0, 0); });
  await settle(700);
  return page.evaluate(() => ({ total: (document.querySelector('#pfTotal') || {}).textContent, value: +window.VAULT.OWN.total().toFixed(2) }))
    .then(async m => ({ ...m, rects: await rects({ hero: '#hero', spark: '#spark', top: '#topList' }) })); };
steps.push(
  ['h5-home-before', homeTotal],
  ['h5-scanned', async () => {
    const seed = await page.evaluate((num) => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.BATCH.rows.length = 0; V.BATCH.save(); V.go('scan');
      const rows = V.CAT.rows.filter(p => p.num); const i = rows.findIndex(p => p.num === num && p.treat === 'base');
      const r0 = Math.random; let used = false; Math.random = () => { if (!used) { used = true; Math.random = r0; return (i + 0.5) / rows.length; } return r0(); };
      return i >= 0; }, PICKER_NUM);
    if (!seed) throw new Error('no base printing of ' + PICKER_NUM);
    await settle(500); await page.click('#btnShutter');
    await page.waitForSelector('#picker.on', { timeout: 8000 }); await settle(700);
    await page.screenshot({ path: path.join(SHOTS, 'h5-picker.png') });
    const pk = await page.evaluate(() => ({ title: document.querySelector('#pkTitle').textContent, why: document.querySelector('#pkWhy').textContent.trim() }));
    const dear = await pickDear();
    await page.click(`[data-pick="${dear}"]`); await settle(900);
    return page.evaluate(() => ({ count: document.querySelector('#scCount').textContent, total: document.querySelector('#scTotal').textContent }))
      .then(async m => ({ ...m, picker: pk, dear, rects: await rects({ count: '#scCount', total: '#scTotal', done: '#btnDone' }) }));
  }],
  ['h5-committed', async () => {
    await page.click('#btnDone'); await settle(500);
    const toast = await page.evaluate(() => { const t = [...document.querySelectorAll('.toast, #toast')].map(x => x.textContent.trim()).filter(Boolean); return t.join(' | '); });
    await settle(600);
    return { toast, screen: await page.evaluate(() => (document.querySelector('.screen.on, .screen.active') || {}).id || null) };
  }],
  ['h5-home-after', homeTotal],
);
for (const [name, run] of steps.filter(([n]) => only.length ? only.some(o => n.startsWith(o)) : !n.startsWith('h5-'))) {
  try {
    const m = await run(); const loaded = await artLoaded(); await wait(400);
    const file = path.join(SHOTS, name + '.png'); await page.screenshot({ path: file });
    report.steps.push({ name, ok: true, artLoaded: loaded, file, ...m, banned: await banned() });
  } catch (e) { report.steps.push({ name, ok: false, error: String(e).slice(0, 240) }); }
}

/* ---- the hero art: each printing's largest scan, as the app draws it (artUrl 'large'), at its own size ---- */
if (!only.length || only.includes('art')) {
  const hero = await page.evaluate((ids) => ids.map(id => { const V = window.VAULT, p = V.CAT.byId.get(id);
    return { id, num: p.num, name: p.name, treat: p.treat, sub: p.sub || '', rarity: p.rarity || '', prov: p.prov || '', set: (V.CAT.sets.get(p.set) || {}).name || '',
      market: p.market, shown: V.money(p.market), url: V.artUrl(p, 'large') }; }), HERO.ids);
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
  /* every printing of the number, dearest first, each with its own scan: a multi-pull shows them all */
  const all = await page.evaluate((num) => { const V = window.VAULT; return V.candidates(num, null).filter(p => p.img).sort((a, b) => (b.market || 0) - (a.market || 0))
    .map(p => ({ id: p.id, treat: p.treat, rarity: p.rarity || '', prov: p.prov || '', market: p.market, shown: V.money(p.market), url: V.artUrl(p, 'large') })); }, HERO.num);
  if (!process.env.NO_ART) {
    const art = await page.context().newPage();
    await art.route('**/*', async r => { try { return r.fulfill({ response: await r.fetch() }); } catch { return r.abort(); } });
    await art.setViewportSize({ width: 800, height: 1200 });
    for (const a of all) {
      const done = hero.find(h => h.id === a.id); if (done && done.file) { a.file = done.file; a.size = done.size; continue; }
      await art.setContent(`<body style="margin:0;background:#000"><img id=a src="${a.url}" style="display:block"></body>`);
      await art.waitForFunction(() => document.querySelector('#a').complete, null, { timeout: 20000 }).catch(() => {});
      a.size = await art.evaluate(() => { const i = document.querySelector('#a'); return { w: i.naturalWidth, h: i.naturalHeight }; });
      if (a.size.w) { a.file = path.join(ART, a.id + '.png'); await (await art.$('#a')).screenshot({ path: a.file, scale: 'css' }); }
    }
    await art.close();
  }
  report.hero.all = all;
  /* every concept's hero (heroes.json), each with its own scan and its catalogue facts */
  const H = JSON.parse(fs.readFileSync(path.join(HERE, 'heroes.json'), 'utf8'));
  const ids = [...new Set(Object.entries(H).filter(([k]) => !k.startsWith('_')).flatMap(([, v]) => v.ids))];
  const heroes = await page.evaluate((ids) => ids.map(id => { const V = window.VAULT, p = V.CAT.byId.get(id);
    return p ? { id, num: p.num, name: p.name, treat: p.treat, rarity: p.rarity || '', prov: p.prov || '', set: (V.CAT.sets.get(p.set) || {}).name || '',
      market: p.market, shown: V.money(p.market), url: V.artUrl(p, 'large') } : { id, missing: true }; }), ids);
  if (!process.env.NO_ART) {
    const art = await page.context().newPage();
    await art.route('**/*', async r => { try { return r.fulfill({ response: await r.fetch() }); } catch { return r.abort(); } });
    await art.setViewportSize({ width: 800, height: 1200 });
    for (const a of heroes.filter(a => !a.missing)) {
      const f = path.join(ART, a.id + '.png'); if (fs.existsSync(f)) { a.file = f; continue; }
      await art.setContent(`<body style="margin:0;background:#000"><img id=a src="${a.url}" style="display:block"></body>`);
      await art.waitForFunction(() => document.querySelector('#a').complete, null, { timeout: 20000 }).catch(() => {});
      const size = await art.evaluate(() => { const i = document.querySelector('#a'); return { w: i.naturalWidth, h: i.naturalHeight }; });
      if (size.w) { a.file = f; await (await art.$('#a')).screenshot({ path: f, scale: 'css' }); }
    }
    await art.close();
  }
  report.heroes = Object.fromEntries(heroes.map(h => [h.id, h]));
}
report.net = net;
report.captured = new Date().toISOString();
fs.writeFileSync(path.join(ADS, process.env.REPORT ? `report-${process.env.REPORT}.json` : only.length ? 'report-partial.json' : 'report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
await browser.close();
