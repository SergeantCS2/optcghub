/* Did it DRAW?
 *
 * APEX landmine 69, and the gate has been noting its absence since take 2.
 * smoke.mjs proves a code path executed. That is not the same claim as "a
 * collector opening this sees a portfolio". A function can run, return, set
 * innerHTML on a detached node and paint nothing.
 *
 * This renders the SHIPPED www/ in a real engine and asserts on the resulting
 * markup and pixels: that the total appears, that the grid has tiles, that the
 * sparkline canvas received strokes, that the picker sheet actually opens.
 *
 * It runs with Puppeteer when Chrome is available (CI), and falls back to a
 * DOM-level render check when it is not, reporting honestly which mode it used.
 * A skipped check is a lie (APEX landmine 53), so the fallback asserts what it
 * genuinely can and NAMES what it cannot.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execSync } from 'node:child_process';

const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const W = p => path.join(ROOT, 'www', p);
let pass = 0, fail = 0, mode = 'dom';
const ok = (n, c, x = '') => { c ? pass++ : (fail++, console.log(`  FAIL  ${n}  ${x}`)); };
const sec = s => console.log(`\n\u2500\u2500 ${s}`);

/* ---------------- try a real browser first ------------------------------ */
let puppeteer = null;
try { puppeteer = (await import('puppeteer')).default; } catch { /* not installed */ }

if (puppeteer) {
  mode = 'chrome';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  const errors = [];
  /* Landmine 82. Simulate what Capacitor's SystemBars injects on Android so a
     regression in inset handling fails here, not on a phone. */
  page.on('load', () => page.evaluate(() => {
    document.documentElement.style.setProperty('--safe-area-inset-top', '36px');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '24px');
  }).catch(() => {}));
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  /* Take 112, landmine 166: the runner reaches Pages. Entering Sealed with no fresh feed syncs the SERVED feed, which
     lands seconds later, replaces a check's fixture and repaints mid-tap -- take 112's first check on the runner died
     on it ("No element found" at a line it had just marked); the VM never reaches Pages, so it never showed there.
     Every Hunt check here brings its own fixture, so the page's own Hunt syncs are off -- on every document, set as
     the app defines VAULT: this run reloads the page twice, and a stub set once after load was gone by take 112's
     checks (the second runner failure: the served feed, without Southern Hobby, repainted Sealed under the tap). */
  await page.evaluateOnNewDocument(() => { let v; Object.defineProperty(window, 'VAULT', { configurable: true, get: () => v,
    set: x => { v = x; if (x && x.HUNT) { x.HUNT.sync = async () => false; x.HUNT.syncHistory = async () => false; } } }); });
  await page.goto('file://' + W('index.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));

  sec('real engine (Chrome)');
  ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  /* Take 33 -- typography. A @font-face that 404s falls back silently and
     every layout check still passes on the system font, so ask the engine:
     did the four role faces LOAD, and is the display face what h2 resolved to?
     Then the control: a face pointed at a file that does not exist must
     report 'error', or this probe cannot see a missing font (landmine 55). */
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    /* take 107: Home's first screen no longer sets anything in the comic face
       (its tabs were the last), and a face nothing has used yet stays
       'unloaded'. Load each one: a file that is missing still reports 'error'. */
    await Promise.all([...document.fonts].map(f => f.load().catch(() => 0)));
    const st = {}; for (const f of document.fonts) st[f.family] = f.status;
    const h2 = document.querySelector('.screen.on .ab-title') || document.querySelector('h2');   // take 107: the screen's own title
    const fam = h2 ? getComputedStyle(h2).fontFamily : '';
    const nope = new FontFace('OPH Nope', 'url(fonts/does-not-exist.woff2)');
    await nope.load().catch(() => 0);
    return { st, fam, control: nope.status };
  });
  ok('the four role faces are LOADED in Chrome',
     ['OPH Display', 'OPH Comic', 'OPH Body', 'OPH Heavy'].every(f => fonts.st[f] === 'loaded'),
     JSON.stringify(fonts.st));
  ok('the screen title resolves to the display face', /OPH Display/.test(fonts.fam), fonts.fam);
  ok('negative control: a missing font file reports error', fonts.control === 'error', fonts.control);
  ok('catalogue reached the page',
     await page.evaluate(() => !!window.VAULT && window.VAULT.CAT.ready));

  /* Seed a collection through the app's own API, then demand it be visible. */
  await page.evaluate(() => {
    const V = window.VAULT;
    const vivi = V.candidates('EB03-024', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0));   // SP first (take 16: candidates() is likelihood-ordered)
    V.OWN.add(vivi[0].id, { condition: 'NM' });
    V.OWN.add(vivi[0].id, { condition: 'NM' });
    V.OWN.snapshot();
  });
  await page.evaluate(() => document.querySelector('nav button[data-go="home"]').click());
  await new Promise(r => setTimeout(r, 250));

  const totalText = await page.$eval('#pfTotal', e => e.textContent);
  ok('the portfolio total is DRAWN and non-zero',
     /\$\d/.test(totalText) && totalText !== '$0.00', totalText);

  /* take 91 -- A37, landmine 128: the one link a person taps to reach More
     had bounced to Home since take 83 (the section was built on first
     paint; the take-83 guard refused the id first). Tap it as a person does. */
  await page.evaluate(() => document.querySelector('#home [data-go="settings"]').click());
  await new Promise(r => setTimeout(r, 250));
  const more = await page.evaluate(() => ({
    on: (document.querySelector('.screen.on') || {}).id,
    heading: ((document.querySelector('#settings .ab-title') || {}).textContent || '').trim(),
    about: (document.querySelector('#aboutTake') || {}).textContent || '',
    rows: ['#stRun', '#syncBtn', '[data-act="export"]'].filter(sel => document.querySelector('#settings ' + sel)).length,
    take: window.VAULT.TAKE }));
  ok("More: tapping Home's link opens the More screen, not Home", more.on === 'settings', String(more.on));
  ok('More: the heading and the About line are drawn with the take',
     more.heading === 'More' && more.about.includes('Take ' + more.take), `${more.heading} / ${more.about}`);
  ok('More: Self-test, Sync and Export are on it', more.rows === 3, String(more.rows));
  for (let i = 0; i < 5; i++) await page.evaluate(() => document.querySelector('#aboutTake').click());
  await new Promise(r => setTimeout(r, 200));
  ok('More: five taps on About reach Diagnostics',
     await page.evaluate(() => (document.querySelector('.screen.on') || {}).id === 'diag'));
  ok('negative control: an id with no screen still lands on Home with a record (the take-83 guard)',
     await page.evaluate(() => { const V = window.VAULT; const n = V.ERRS.list.length; V.MODE.set('collect', false); V.go('no-such-screen');
       return (document.querySelector('.screen.on') || {}).id === 'home' && V.ERRS.list.length === n + 1 && /no-such-screen/.test(V.ERRS.list[0].msg); }));
  await page.evaluate(() => document.querySelector('nav button[data-go="home"]').click());
  await new Promise(r => setTimeout(r, 200));
  /* Landmine 62: never assert a live market price. Compute the expected total
     from the catalogue the app itself loaded. */
  const want = await page.evaluate(() => {
    const V = window.VAULT;
    return V.OWN.items.reduce((a, i) =>
      a + (V.CAT.byId.get(i.id).market || 0) * i.qty, 0);
  });
  ok('the total matches the catalogue, to the cent',
     totalText.replace(/[$,]/g, '') === want.toFixed(2),
     `${totalText} vs ${want.toFixed(2)}`);

  const topHtml = await page.$eval('#topList', e => e.innerHTML);
  ok('Most Valuable lists the card', /Nefeltari Vivi/.test(topHtml));
  ok('the printing badge is drawn, not just stored', /badge/.test(topHtml));

  /* The canvas. A sparkline that renders nothing is the exact failure this
     harness exists for: every function ran, nothing appeared. */
  const inkPct = await page.evaluate(() => {
    const c = document.querySelector('#spark');
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let ink = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) ink++;
    return 100 * ink / (d.length / 4);
  });
  ok('the sparkline canvas has ink on it', inkPct > 0.5, inkPct.toFixed(2) + '%');

  await page.evaluate(() => document.querySelector('nav button[data-go="collection"]').click());
  await new Promise(r => setTimeout(r, 200));
  const tiles = await page.$$eval('.tile', e => e.length);
  ok('the collection grid drew a tile', tiles >= 1, String(tiles));
  const box = await page.$eval('.tile', e => {
    const r = e.getBoundingClientRect();
    return { w: r.width, h: r.height, vis: getComputedStyle(e).display };
  });
  ok('the tile has real size on a 412px viewport', box.w > 120 && box.h > 180,
     JSON.stringify(box));

  /* The picker is the primary surface (landmine 41). If it does not open and
     paint, the scanner has no honest path for 91% of cards. */
  await page.evaluate(() => {
    const V = window.VAULT;
    const r = V.resolve('OP01-016', {});
    window.__r = r.verdict;
    document.querySelector('#pkTitle').textContent = 'x';
  });
  ok('a 4292x spread still refuses to auto-accept in the browser',
     await page.evaluate(() => window.__r) === 'ask');

  /* Take 46 -- the hot-seat board DRAWS: a legal deck built in the page from
     the showcase list, dealt, both keep, and the board must show the opponent
     panel, the player panel with a hand, and the end-turn button. */
  const sim = await page.evaluate(() => {
    const V = window.VAULT; const lines = ['1 OP01-001', '4 ST01-006', '4 OP01-016', '4 ST01-004', '4 OP01-013', '4 OP01-004', '4 OP01-025', '4 OP01-015', '4 OP01-017', '4 OP02-008', '4 EB01-003', '4 OP03-013', '4 OP05-007', '2 OP04-016'];
    const d = V.DECKS.blank(); d.name = 'render';
    for (const l of lines) { const [n, num] = l.split(' '); const p = V.candidates(num, null).slice().sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +n }); }
    const skip = [...document.querySelectorAll('#tour button')].find(b => /skip/i.test(b.textContent)); if (skip) skip.click();
    V.MODE.set('play', false); document.querySelector('nav button[data-go="sim"]').click();
    V.SIM.new(d, d, 0); V.SIM.g.bot = 1; V.SIM.g.players[1].name = 'The app'; V.SIM.mulligan(0, false); V.SIM.mulligan(1, false); V.paintSim();
    const b = document.querySelector('#simBoard');
    return { panels: b.querySelectorAll('.panel').length, hand: b.querySelectorAll('[data-sim^="play:"]').length, end: !!b.querySelector('[data-sim="end"]'), h: b.getBoundingClientRect().height, legal: V.legality(d).problems.length, vsApp: /The app/.test(b.textContent) };
  });
  ok('the hot-seat board draws: opponent, player, log panels', sim.panels >= 3, JSON.stringify(sim));
  ok('the hand is drawn as rows with Play buttons, and the turn can be ended', sim.hand === 5 && sim.end && sim.legal === 0);
  ok('the board has real height on the phone viewport', sim.h > 600, String(sim.h));
  ok('against the app, the board names the opponent as the app (take 55)', sim.vsApp === true);
  const simShot = await page.screenshot({ encoding: 'base64', fullPage: false });
  fs.writeFileSync(path.join(ROOT, 'www', 'render-sim.png'), Buffer.from(simShot, 'base64'));
  await page.evaluate(() => { window.VAULT.SIM.g = null; window.VAULT.MODE.set('collect', false); document.querySelector('nav button[data-go="collection"]').click(); });
  const shot = await page.screenshot({ encoding: 'base64' });
  const bytes = Buffer.from(shot, 'base64').length;
  ok('a screenshot of a non-blank page', bytes > 20000, bytes + ' bytes');
  fs.writeFileSync(path.join(ROOT, 'www', 'render.png'), Buffer.from(shot, 'base64'));

  /* Geometry. Landmine 54: the collection grid resolved to two 277px columns
     inside a 380px grid, so the second column sat off-screen and the page
     scrolled sideways. smoke.mjs was right about every one of its 45 markup
     assertions while this was true. Layout needs a layout engine. */
  await page.evaluate(() => {
    const V = window.VAULT, c = V.candidates('EB03-024', null);
    c.forEach(p => V.OWN.add(p.id, { condition: 'NM' }));
    document.querySelector('nav button[data-go="collection"]').click();
  });
  await new Promise(r => setTimeout(r, 250));

  const geo = await page.evaluate(() => {
    const g = document.querySelector('#colGrid');
    const t = [...document.querySelectorAll('.tile')].map(e => {
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width) };
    });
    return { cols: getComputedStyle(g).gridTemplateColumns,
             gridW: Math.round(g.getBoundingClientRect().width),
             tiles: t, bodyScrollW: document.body.scrollWidth,
             vw: document.documentElement.clientWidth };
  });
  ok('the page does not scroll sideways',
     geo.bodyScrollW <= geo.vw + 1, `${geo.bodyScrollW} > ${geo.vw}`);
  ok('the grid resolves to two columns that FIT',
     geo.cols.split(' ').length === 2 &&
     geo.cols.split(' ').reduce((a, c) => a + parseFloat(c), 0) <= geo.gridW + 1,
     `${geo.cols} inside ${geo.gridW}px`);
  ok('every tile is fully on screen',
     geo.tiles.every(t => t.x >= 0 && t.right <= geo.vw + 1),
     JSON.stringify(geo.tiles));
  /* Take 8: the price/delta column wrapped to three rows on a 184px tile and
     no assertion noticed, because every assertion was about width. Height is
     layout too. A tile's price block is one price line plus one delta line. */
  const pxRows = await page.evaluate(() => [...document.querySelectorAll('.tile .px')]
    .map(e => Math.round(e.getBoundingClientRect().height)));
  ok('the price block is two lines, not three (nothing wrapped)',
     pxRows.every(h => h <= 40), JSON.stringify(pxRows));
  const qtyRows = await page.evaluate(() => [...document.querySelectorAll('.tile .qty')]
    .map(e => Math.round(e.getBoundingClientRect().height)));
  ok('"Qty: n" stays on one line', qtyRows.every(h => h <= 22), JSON.stringify(qtyRows));
  /* Take 17: the same wrap on the DETAIL price -- a triangle span went block. */
  await page.evaluate(() => document.querySelector('.tile').click());
  await new Promise(r => setTimeout(r, 300));
  const dp = await page.evaluate(() => Math.round(document.querySelector('#dPrice').getBoundingClientRect().height));
  ok('the detail price is two lines, not three (no triangle wrap)', dp <= 48, String(dp));
  ok('the nav uses glyphs, not emoji', await page.evaluate(() =>
     [...document.querySelectorAll('nav button')].every(b => b.querySelector('svg.g use'))));
  ok('the scanner idle decal exists and hides when live', await page.evaluate(() =>
     !!document.querySelector('#camIdle use') && getComputedStyle(document.querySelector('#camIdle')).display !== 'none'));
  await page.evaluate(() => document.querySelector('nav button[data-go="collection"]').click());
  await new Promise(r => setTimeout(r, 200));
  ok('tiles are wide enough to read',
     geo.tiles.every(t => t.w >= 140), JSON.stringify(geo.tiles.map(t => t.w)));

  /* Four device widths, because "tuned to one screen size" is APEX landmine 95
     and the Fold is two of them. */
  for (const [w, name] of [[360, 'small phone'], [412, 'Fold outer'],
                           [673, 'Fold inner'], [820, 'tablet']]) {
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 120));
    const m = await page.evaluate(() => ({
      scroll: document.body.scrollWidth, vw: document.documentElement.clientWidth,
      off: [...document.querySelectorAll('.tile')]
        .filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length
    }));
    ok(`${name} (${w}px): nothing off-screen`,
       m.scroll <= m.vw + 1 && m.off === 0, JSON.stringify(m));
  }
  /* take 93 -- A33 item 6: a picture beside every row that had none. Measured
     drawn: the box is card-shaped and the row stays one line tall, every image
     sits inside its box (landmine 132: four thumbnails had drawn at natural
     size), and no screen that gained pictures scrolls sideways at any width. */
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  await page.evaluate(() => { const V = window.VAULT; V.MODE.set('collect', false); V.go('search'); document.querySelector('#allq').value = 'nami'; V.paintSearch(); });
  await new Promise(r => setTimeout(r, 600));
  const srch = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#allRes [data-open]')], pics = [...document.querySelectorAll('#allRes .pic')];
    const imgs = pics.map(b => [b, b.querySelector('img.ref')]).filter(([, i]) => i);
    const fits = imgs.every(([b, i]) => { const B = b.getBoundingClientRect(), I = i.getBoundingClientRect(); return I.width <= B.width + 1 && I.height <= B.height + 1 && I.left >= B.left - 1 && I.top >= B.top - 1; });
    const b0 = pics[0] && pics[0].getBoundingClientRect(), r0 = rows[0] && rows[0].getBoundingClientRect();
    const nm = rows[0] && rows[0].querySelector('.nm'); const nmH = nm ? nm.getBoundingClientRect().height : 0;
    const cs = rows[0] && getComputedStyle(rows[0]); const pad = cs ? parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) : 0;
    return { rows: rows.length, pics: pics.length, imgs: imgs.length, fits, boxW: b0 && Math.round(b0.width), boxH: b0 && Math.round(b0.height), rowH: r0 && Math.round(r0.height), nmH: Math.round(nmH), pad: Math.round(pad) };
  });
  ok('search hits: a picture box per row, and images are drawn inside their boxes', srch.rows > 0 && srch.pics === srch.rows && srch.imgs > 0 && srch.fits, JSON.stringify(srch));
  /* The row is no taller than its tallest child plus its own padding: the
     picture sits beside the text, never under it (the first run measured 117
     px -- baseline alignment -- and the second 83 px, which was three lines
     of subtitle, not the picture: a fixed bound was landmine 62's shape). */
  ok('search hits: the box is card-shaped at the list-row size (44x61 since take 110) and the picture does not stretch the row',
     srch.boxW === 44 && srch.boxH === 61 && srch.rowH <= Math.max(srch.boxH, srch.nmH) + srch.pad + 1, JSON.stringify(srch));
  for (const [w, name] of [[360, 'small phone'], [412, 'Fold outer'], [673, 'Fold inner'], [820, 'tablet']]) {
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 2 }); await new Promise(r => setTimeout(r, 120));
    const m = await page.evaluate(() => ({ scroll: document.body.scrollWidth, vw: document.documentElement.clientWidth }));
    ok(`search with pictures, ${name} (${w}px): no sideways scroll`, m.scroll <= m.vw + 1, JSON.stringify(m));
  }
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  const dkId = await page.evaluate(() => {
    const V = window.VAULT; const L = V.CAT.rows.find(p => p.num === 'OP01-001' && p.img) || V.CAT.rows.find(p => p.type === 'Leader' && p.img);
    const c = V.CAT.rows.find(p => p.type === 'Character' && p.img && V.colourLegal(p, L));
    const d = V.DECKS.blank(); d.name = 'take 93 probe'; d.leader = L.id; d.cards.push({ id: c.id, n: 4 }); V.DECKS.list.push(d); V.DECKS.save();
    V.MODE.set('play', false); V.paintDecks(); V.go('decks'); return d.id;
  });
  await new Promise(r => setTimeout(r, 700));
  const lead = await page.evaluate(() => { const box = document.querySelector('#dkList .lead.pic'); const img = box && box.querySelector('img.ref');
    const b = box && box.getBoundingClientRect(), i = img && img.getBoundingClientRect();
    return { box: !!box, img: !!img, fits: !!i && Math.abs(i.width - b.width) <= 1 && Math.abs(i.height - b.height) <= 1, boxW: b && Math.round(b.width), imgW: i && Math.round(i.width) }; });
  ok('Decks list: the Leader thumbnail fills its box exactly (landmine 132)', lead.box && lead.img && lead.fits, JSON.stringify(lead));
  await page.evaluate(id => window.VAULT.openDeck(id), dkId);
  await new Promise(r => setTimeout(r, 400));
  const dkRows = await page.evaluate(() => ({ rows: document.querySelectorAll('#deck .dkrow').length, pics: document.querySelectorAll('#deck .dkrow .pic').length,
    scroll: document.body.scrollWidth, vw: document.documentElement.clientWidth }));
  ok("a deck's card rows carry a picture each and the screen does not scroll sideways", dkRows.rows > 0 && dkRows.pics === dkRows.rows && dkRows.scroll <= dkRows.vw + 1, JSON.stringify(dkRows));
  ok('negative control: a printing with no image draws the labelled tile and no img',
     await page.evaluate(() => { const V = window.VAULT; const p = V.CAT.rows.find(x => x.img && x.num && !x.sealed); const d = document.createElement('div'); d.innerHTML = V.cardPic({ ...p, img: null }); document.body.appendChild(d);
       const ph = d.querySelector('.ph'); const r = { text: ph && ph.textContent.trim(), img: !!d.querySelector('img'), shown: !!ph && getComputedStyle(ph).display !== 'none' }; d.remove();
       return r.text === p.num.split('-').pop() && !r.img && r.shown; }));
  await page.evaluate(() => { const V = window.VAULT; V.DECKS.list = V.DECKS.list.filter(d => d.name !== 'take 93 probe'); V.DECKS.save(); V.MODE.set('collect', false); document.querySelector('nav button[data-go="collection"]').click(); });
  await new Promise(r => setTimeout(r, 200));
  /* take 94 -- the distributor: the panel and a row's line draw inside the
     phone column, the Releases panel draws its rows, and without the source
     neither panel exists. The feed is built from the saved real page. */
  const gtsFx = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-gts-')), 'feed-fixture.json');
  execSync(`python3 tools/hunt.py --from-fixtures --out ${gtsFx}`, { cwd: ROOT, stdio: 'pipe' });
  const F94 = JSON.parse(fs.readFileSync(gtsFx, 'utf8'));
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  /* take 112, the owner's word ("I don't want them flooding the screen"): the panels sit under a closed Distributor
     info, and a row carries each distributor as one short line -- both drawn and tapped here in Chrome */
  const g94 = await page.evaluate(F => {
    const V = window.VAULT; V.HUNT.feed = F; V.HUNT.setZip(''); V.NAV.zipAsked = true; V.MODE.set('hunt', true); V.DISTF.open.clear();
    while (V.closeAnyOverlay()) {}   /* the zip question, asked once on entering Hunt, would take the taps below */
    for (const id of Object.keys(V.HUNT.distByCatalogId())) { const p = V.CAT.byId.get(+id); if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } }
    V.paintSealed();
    const fold = document.querySelector('#sealedList [data-distfold="sealed"]'); const fb = fold && fold.getBoundingClientRect();
    const line = [...document.querySelectorAll('#sealedList .dline')].find(s => /^GTS Distribution · /.test(s.textContent));
    const row = line && line.closest('.row'); const r = row && row.getBoundingClientRect(); const l = line && line.getBoundingClientRect();
    return { fold: !!fold && fb.height >= 44 && fold.getAttribute('aria-expanded') === 'false', line: !!line, text: line && line.textContent.trim().slice(0, 60), inRow: !!r && l.left >= r.left - 1 && l.right <= r.right + 1 && l.height >= 44,
             scroll: document.body.scrollWidth, vw: document.documentElement.clientWidth };
  }, F94);
  ok('Hunt: the Distributor info draws closed, and a matched row\'s distributor line draws inside its row as a 44 px target with no sideways scroll', g94.fold && g94.line && g94.inRow && g94.scroll <= g94.vw + 1, JSON.stringify(g94));
  /* a click target that is missing fails its check below; it never stops the run */
  /* centred, left to settle (the runner's pictures load; the VM's are refused), and only when the target itself is
     what the point hits -- else moved clear once, else the check fails with what covered it (landmine 169) */
  const tapNotes = [];
  const tap = async sel => {
    const hit = () => page.evaluate(q => { const e = document.querySelector(q); if (!e) return 'missing'; const b = e.getBoundingClientRect(), at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return at && (at === e || e.contains(at)) ? 'ok' : 'covered by ' + (at ? at.tagName.toLowerCase() + '.' + String(at.className).split(' ')[0] + (at.closest('[id]') ? ' in #' + at.closest('[id]').id : '') : 'nothing'); }, sel);
    if (!(await page.evaluate(q => { const e = document.querySelector(q); if (e) e.scrollIntoView({ block: 'center' }); return !!e; }, sel))) { tapNotes.push(sel + ': missing'); return false; }
    await new Promise(r => setTimeout(r, 300));
    let h = await hit();
    if (h !== 'ok' && h !== 'missing') { await page.evaluate(q => { const b = document.querySelector(q).getBoundingClientRect(); window.scrollBy(0, Math.round(b.top - innerHeight * 0.35)); }, sel); await new Promise(r => setTimeout(r, 300)); h = await hit(); }
    if (h !== 'ok') { tapNotes.push(sel + ': ' + h); return false; }
    await page.click(sel); await new Promise(r => setTimeout(r, 150)); return true; };
  await tap('#sealedList [data-distfold="sealed"]');
  const o94 = await page.evaluate(() => { const f = document.querySelector('#sealedList [data-distfold="sealed"]'); const box = f && f.closest('.panel'); const secs = box ? [...box.querySelectorAll('.dsec')] : []; const b = box && box.getBoundingClientRect();
    return { open: !!f && f.getAttribute('aria-expanded') === 'true', secs: secs.map(x => (x.querySelector('b') || {}).textContent).join(), inside: secs.length > 0 && secs.every(x => { const r = x.getBoundingClientRect(); return r.height > 0 && r.left >= b.left - 0.5 && r.right <= b.right + 0.5; }),
             scroll: document.body.scrollWidth, vw: document.documentElement.clientWidth }; });
  ok('...a tap opens it: GTS Distribution\'s and Southern Hobby\'s sections draw inside the panel', o94.open && o94.secs === 'GTS Distribution,Southern Hobby' && o94.inside && o94.scroll <= o94.vw + 1, JSON.stringify({ ...o94, taps: tapNotes }));
  await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.DISTF.open.clear(); V.go('releases'); V.paintReleases(); });
  const r94 = await page.evaluate(() => { const f = document.querySelector('#relList [data-distfold="releases"]'); return { fold: !!f && f.getAttribute('aria-expanded') === 'false' && !document.querySelector('#relList .dbody') }; });
  await tap('#relList [data-distfold="releases"]');
  const r94b = await page.evaluate(() => { const f = document.querySelector('#relList [data-distfold="releases"]'); const box = f && f.closest('.panel');
    const rows = box ? [...box.querySelectorAll('.dbody .row')] : []; const rr = rows.map(x => x.getBoundingClientRect());
    return { open: !!f && f.getAttribute('aria-expanded') === 'true', rows: rows.length, drawn: rr.every(b => b.height > 0), scroll: document.body.scrollWidth, vw: document.documentElement.clientWidth }; });
  ok('Releases: the not-in-the-catalogue list sits under a closed Distributor info; a tap opens it and its rows draw without sideways scroll (GTS\'s and Southern Hobby\'s)', r94.fold && r94b.open && r94b.rows > 3 && r94b.drawn && r94b.scroll <= r94b.vw + 1, JSON.stringify({ r94, r94b, taps: tapNotes }));
  const c94 = await page.evaluate(F => { const V = window.VAULT; const f = JSON.parse(JSON.stringify(F)); delete f.sources.gts; delete f.sources.southern; V.HUNT.feed = f; V.paintSealed(); V.paintReleases();   /* take 112: both sources out */
    const a = !!document.querySelector('#sealedList [data-distfold]') || !!document.querySelector('#sealedList .dline'); const b = !!document.querySelector('#relList [data-distfold]') || /At the distributor/.test(document.querySelector('#relList').innerHTML);
    V.HUNT.feed = null; V.DISTF.open.clear(); V.MODE.set('collect', true); return { a, b }; }, F94);
  ok('negative control: without the sources in the feed, no Distributor info and no distributor line draws', !c94.a && !c94.b, JSON.stringify(c94));
  await new Promise(r => setTimeout(r, 200));
  /* take 95 -- landmine 135: a tapped release SHOWS Sealed with that set's
     products drawn; the sealed sheet draws no condition segment and draws the
     stock alert, the card sheet the reverse. */
  const r95 = await page.evaluate(() => { const V = window.VAULT; V.MODE.set('hunt', true); V.go('releases'); V.paintReleases();
    const row = document.querySelector('#relList [data-browse-set]'); const setId = +row.dataset.browseSet; row.click();
    const rows = [...document.querySelectorAll('#sealedList [data-open]')].map(b => V.CAT.byId.get(+b.dataset.open)).filter(Boolean);
    return { on: document.querySelector('#sealed').classList.contains('on'), vis: document.querySelector('#sealed').getBoundingClientRect().height > 0, q: V.SEALED.q, rows: rows.length, allSet: rows.every(p => p.set === setId) }; });
  await new Promise(r => setTimeout(r, 300));
  ok('Hunt: tapping a release shows Sealed with that set\'s products drawn (landmine 135)', r95.on && r95.vis && r95.rows > 0 && r95.allSet, JSON.stringify(r95));
  const d95 = await page.evaluate(() => { const V = window.VAULT; const box = V.CAT.rows.find(p => V.SEALED.isProduct(p)); V.openDetail(box.id); V.go('detail');
    const seg = document.querySelector('#dCondSeg').getBoundingClientRect(), st = document.querySelector('#dStock').getBoundingClientRect();
    const card = V.CAT.rows.find(p => !p.sealed && p.market > 0); V.openDetail(card.id);
    const seg2 = document.querySelector('#dCondSeg').getBoundingClientRect(), st2 = document.querySelector('#dStock').getBoundingClientRect();
    V.SEALED.q = ''; document.querySelector('#sealedQ').value = ''; V.MODE.set('collect', true);
    return { segH: Math.round(seg.height), stH: Math.round(st.height), segH2: Math.round(seg2.height), stH2: Math.round(st2.height) }; });
  ok('the sealed sheet draws no condition segment and draws the stock alert; the card sheet the reverse', d95.segH === 0 && d95.stH > 0 && d95.segH2 > 0 && d95.stH2 === 0, JSON.stringify(d95));
  await new Promise(r => setTimeout(r, 200));
  /* take 96 -- where to buy: the chip strip draws under the row, inside its
     width, at both Fold widths; the sheet's panel draws for a sealed product
     and not for a card. The same fixture feed as take 94. */
  for (const [w, name] of [[412, 'Fold outer'], [673, 'Fold inner']]) {
    await page.setViewport({ width: w, height: 915, deviceScaleFactor: 2 }); await new Promise(r => setTimeout(r, 120));
    const m = await page.evaluate(F => { const V = window.VAULT; V.HUNT.feed = F; V.HUNT.setZip(''); V.MODE.set('hunt', true); V.SEALED.q = ''; V.SEALED.kind = 'all';
      for (const id of Object.keys(V.HUNT.distByCatalogId())) { const p = V.CAT.byId.get(+id); if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } } V.paintSealed();
      const strip = document.querySelector('#sealedList .chips.buy'); const row = strip && strip.parentElement; const r = row && row.getBoundingClientRect(); const s = strip && strip.getBoundingClientRect();
      const btn = row && row.querySelector('[data-open]'); const b = btn && btn.getBoundingClientRect();
      return { strip: !!strip, inRow: !!s && s.left >= r.left - 1 && s.right <= r.right + 1 && s.height > 0, below: !!b && s.top >= b.bottom - 1, chips: strip ? strip.querySelectorAll('a.chip').length : 0, scroll: document.body.scrollWidth, vw: document.documentElement.clientWidth }; }, F94);
    ok(`Hunt: the buy chips draw under the row inside its width, ${name} (${w}px), no sideways scroll`, m.strip && m.inRow && m.below && m.chips >= 1 && m.scroll <= m.vw + 1, JSON.stringify(m));
  }
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  const s96 = await page.evaluate(() => { const V = window.VAULT; const g = Object.keys(V.HUNT.distByCatalogId())[0]; const p = V.CAT.byId.get(+g); V.openDetail(p.id); V.go('detail');
    const panel = document.querySelector('#dBuy').getBoundingClientRect(); const rows = document.querySelectorAll('#dBuyList .row').length; const box = () => { const d = document.querySelector('#dDist'); return d ? d.getBoundingClientRect() : { height: 0 }; }; const dist = box();
    const card = V.CAT.rows.find(x => !x.sealed && x.market > 0); V.openDetail(card.id); const panel2 = document.querySelector('#dBuy').getBoundingClientRect(); const dist2 = box();
    V.HUNT.feed = null; V.MODE.set('collect', true); return { h: Math.round(panel.height), rows, d: Math.round(dist.height), h2: Math.round(panel2.height), d2: Math.round(dist2.height) }; });
  /* take 112: the distributors left Where to buy for the page's own Distributor info (the owner's word) */
  ok('the sealed sheet draws the Where to buy panel with its rows and, for a product a distributor lists, Distributor info; the card sheet draws neither', s96.h > 0 && s96.rows >= 1 && s96.d >= 44 && s96.h2 === 0 && s96.d2 === 0, JSON.stringify(s96));
  await new Promise(r => setTimeout(r, 200));
  /* take 97 -- Releases: the folded starter-deck row draws and opens on a real
     click; an upcoming countdown draws in a colour that is not the past one;
     Remind me draws and toggles. */
  const r97 = await page.evaluate(() => { const V = window.VAULT; V.MODE.set('hunt', true); V.RELF.open = new Set(); V.RELALERTS.list = []; V.go('releases'); V.paintReleases();
    const fold = document.querySelector('#relList [data-relfold]'); const before = document.querySelectorAll('#relList [data-browse-set]').length;
    if (fold) fold.click();
    const after = document.querySelectorAll('#relList [data-browse-set]').length;
    const up = document.querySelector('#relList .note.cd1, #relList .note.cd2, #relList .note.cd3'); const past = document.querySelector('#relList .note.cd4');
    const cu = up && getComputedStyle(up).color, cp = past && getComputedStyle(past).color;
    const rem = document.querySelector('#relList [data-relalert]'); const r0 = rem && rem.textContent; if (rem) rem.click();
    const rem2 = document.querySelector('#relList [data-relalert]'); const r1 = rem2 && rem2.textContent; const pressed = rem2 && rem2.getAttribute('aria-pressed');
    const n = V.RELALERTS.list.length; if (rem2) rem2.click(); const n2 = V.RELALERTS.list.length;
    V.RELF.open = new Set(); V.RELALERTS.list = []; V.MODE.set('collect', true);
    return { fold: !!fold, before, after, cu, cp, r0, r1, pressed, n, n2, scroll: document.body.scrollWidth, vw: document.documentElement.clientWidth }; });
  ok('Releases: the folded starter-deck row opens on a click and the decks appear as rows', r97.fold && r97.after > r97.before, JSON.stringify(r97));
  ok('Releases: an upcoming countdown draws in a colour that is not the past countdown\'s', !!r97.cu && !!r97.cp && r97.cu !== r97.cp, JSON.stringify({ cu: r97.cu, cp: r97.cp }));
  ok('Releases: Remind me draws, a click sets it (the button says so, pressed) and a second click removes it, no sideways scroll', /Remind me/.test(r97.r0 || '') && /Reminder set/.test(r97.r1 || '') && r97.pressed === 'true' && r97.n === 1 && r97.n2 === 0 && r97.scroll <= r97.vw + 1, JSON.stringify(r97));
  await new Promise(r => setTimeout(r, 200));

  /* take 98 (landmine 137) -- Back from a card's sheet, on the real path: the
     browser's history Back runs the same handler as the phone's button
     (closeAnyOverlay, then the stack, then the watchdog). It must land on the
     screen the sheet came from and write no blank record. */
  const r98a = await page.evaluate(async () => { const V = window.VAULT; const ov = () => ['#askSheet', '#picker', '#tour', '#simCurtain'].filter(id => { const el = document.querySelector(id); return el && el.classList.contains('on'); });
    const screens = () => [...document.querySelectorAll('.screen.on')].map(e => e.id).join(',');
    V.NAV.zipAsked = true; V.MODE.set('hunt', true); V.go('sealed'); while (V.closeAnyOverlay()) {}   /* the claim is about the sheet alone: no prompt left by an earlier block, no zip prompt from this one (check run 24: the zip prompt was open, Back closed it first, rightly, and the test read that as the sheet staying) */
    const row = document.querySelector('#sealedList [data-open]'); if (row) row.click(); await new Promise(r => setTimeout(r, 120));
    const onSheet = screens(); const ovBefore = ov(); const before = V.ERRS.list.length;
    window.dispatchEvent(new PopStateEvent('popstate', { state: null })); await new Promise(r => setTimeout(r, 200));
    const after = screens(); const recs = V.ERRS.list.slice(0, V.ERRS.list.length - before).map(e => e.kind + ':' + e.msg);
    /* control: a prompt sheet open over the card sheet -- Back closes the prompt first and the sheet stays (take 81) */
    const row2 = document.querySelector('#sealedList [data-open]'); if (row2) row2.click(); await new Promise(r => setTimeout(r, 120));
    V.askZip(); await new Promise(r => setTimeout(r, 60)); const ovCtl = ov(); const beforeCtl = V.ERRS.list.length;
    window.dispatchEvent(new PopStateEvent('popstate', { state: null })); await new Promise(r => setTimeout(r, 200));
    const afterCtl = screens(); const ovCtl2 = ov(); const recsCtl = V.ERRS.list.slice(0, V.ERRS.list.length - beforeCtl).map(e => e.kind + ':' + e.msg);
    V.MODE.set('collect', true); V.go('home'); return { row: !!row, onSheet, ovBefore, after, recs, ovCtl, afterCtl, ovCtl2, recsCtl }; });
  ok('Back from a card\'s sheet lands on the list it came from and the watchdog writes no blank record', r98a.row && r98a.onSheet === 'detail' && r98a.ovBefore.length === 0 && r98a.after === 'sealed' && r98a.recs.length === 0, JSON.stringify(r98a));
  ok('...control: with a prompt sheet open over it, Back closes the prompt first and the card sheet stays (take 81)', r98a.ovCtl.includes('#askSheet') && r98a.afterCtl === 'detail' && r98a.ovCtl2.length === 0 && r98a.recsCtl.length === 0, JSON.stringify(r98a));
  /* Home's most-valuable rows open the card on a real click */
  const r98b = await page.evaluate(async () => { const V = window.VAULT; V.go('home'); V.paintHome(); const b = document.querySelector('#topList button[data-open]'); if (b) b.click(); await new Promise(r => setTimeout(r, 120));
    const on = [...document.querySelectorAll('.screen.on')].map(e => e.id).join(','); const name = (document.querySelector('#dName') || {}).textContent || ''; V.go('home'); return { b: !!b, on, name }; });
  ok('Home: a most-valuable row opens the card\'s sheet on a click', r98b.b && r98b.on === 'detail' && r98b.name.length > 0, JSON.stringify(r98b));
  /* the toast wraps inside the screen; the splash rule is one literal colour */
  const r98c = await page.evaluate(async () => { const V = window.VAULT; const vw = document.documentElement.clientWidth;
    V.toast('Reminder set for the day before Premium Booster: The Best — One Piece Card Game Vol. 2 releases (2026-11-20), and once more on the day.'); await new Promise(r => setTimeout(r, 50));
    const t = document.querySelector('#toast').getBoundingClientRect(); const long = { left: Math.round(t.left), right: Math.round(t.right), h: Math.round(t.height) };
    V.toast('Saved'); await new Promise(r => setTimeout(r, 50)); const s = document.querySelector('#toast').getBoundingClientRect(); const short = { h: Math.round(s.height) };
    document.querySelector('#toast').classList.remove('on');
    let splash = ''; for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.selectorText === '#splash') splash = r.style.backgroundColor; } catch (e) {} }
    return { vw, long, short, splash }; });
  ok('a long toast stays inside the screen on both sides and wraps to more than one line; a short one is one line', r98c.long.left >= 0 && r98c.long.right <= r98c.vw && r98c.long.h > r98c.short.h * 1.6, JSON.stringify(r98c));
  ok('the splash rule is one literal colour, Collect\'s blue', r98c.splash === 'rgb(11, 22, 34)', JSON.stringify(r98c.splash));

  /* Take 60: Pages serves this same file to a desktop browser, where the app
     used to run edge to edge. It stays a phone-width column there. */
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 150));
  const wide = await page.evaluate(() => {
    const b = document.body.getBoundingClientRect(); const n = [...document.querySelectorAll('nav')].find(x => x.offsetParent !== null || x.getBoundingClientRect().width > 0);
    const h2 = document.querySelector('.screen.on .ab-title');   // take 107: the header's title
    return { bodyW: Math.round(b.width), vw: document.documentElement.clientWidth,
             navW: n ? Math.round(n.getBoundingClientRect().width) : 0,
             headColour: h2 ? getComputedStyle(h2).color : '' };
  });
  ok('desktop (1440px): the app is a centred phone-width column, not a sprawl',
     wide.bodyW <= 560 && wide.vw >= 1400, JSON.stringify(wide));
  ok('...and the bottom chrome is held to the same width', wide.navW > 0 && wide.navW <= 560, String(wide.navW));
  /* Take 64: the reported bug, in a real browser -- click Performance and
     Overview must go out. */
  const tabs = await page.evaluate(() => {
    const o = document.querySelector('#tabOver'), p = document.querySelector('#tabPerf');
    const before = [o.classList.contains('on'), p.classList.contains('on')];
    p.click();
    const after = [o.classList.contains('on'), p.classList.contains('on'), getComputedStyle(document.querySelector('#perfPanel')).display];
    o.click();
    const back = [o.classList.contains('on'), p.classList.contains('on'), getComputedStyle(document.querySelector('#hero')).display];
    return { before, after, back };
  });
  ok('Home tabs: Overview on at rest, Performance takes it, Overview takes it back',
     tabs.before[0] && !tabs.before[1] && !tabs.after[0] && tabs.after[1] && tabs.after[2] === 'block'
     && tabs.back[0] && !tabs.back[1] && tabs.back[2] !== 'none', JSON.stringify(tabs));
  /* Take 70: the third mode draws -- the knob lands on Hunt, the Sealed
     screen has rows, the palette applies. */
  const hunt = await page.evaluate(() => {
    /* landmine 143: measure the knob AT REST -- after its slide ends, not a
       fixed 350 ms after the switch, which a busy machine spends repainting
       Sealed before the 220 ms slide has even begun */
    const V = window.VAULT; const k = document.querySelector('#modeSlider .knob');
    const measure = () => {
      const knob = k.getBoundingClientRect();
      const btn = document.querySelector('#modeSlider [data-mode="hunt"]').getBoundingClientRect();
      return { knobUnderHunt: Math.abs((knob.left + knob.width / 2) - (btn.left + btn.width / 2)) < 12,
               offset: Math.round((knob.left + knob.width / 2) - (btn.left + btn.width / 2)),
               rows: document.querySelectorAll('#sealedList [data-open]').length, headers: document.querySelectorAll('#sealedList [data-setfold]').length,
               bg: getComputedStyle(document.body).backgroundColor,
               navShown: !document.querySelector('#navHunt').hidden,
               screenOn: document.querySelector('#sealed').classList.contains('on') }; };
    return new Promise(res => { let done = false; const fin = () => { if (!done) { done = true; setTimeout(() => res(measure()), 30); } };
      k.addEventListener('transitionend', fin, { once: true }); setTimeout(fin, 2000); V.MODE.set('hunt', true); });
  });
  ok('Hunt: the slider knob sits under Hunt and the mode\'s nav and screen are on', hunt.knobUnderHunt && hunt.navShown && hunt.screenOn, JSON.stringify(hunt));
  ok('Hunt: the Sealed screen draws set headers and the newest sets\' rows (folded since take 81)', hunt.rows >= 3 && hunt.headers >= 10, `${hunt.rows} rows, ${hunt.headers} set headers`);
  ok('Hunt: the third palette is applied (not the Collect background)', hunt.bg !== 'rgb(11, 22, 34)', hunt.bg);
  await page.evaluate(() => { window.VAULT.MODE.set('collect', true); });
  /* Take 85: the opening screen was painted first and is gone once the app has drawn */
  await page.reload({ waitUntil: 'domcontentloaded' });   /* the splash is measured from a fresh load, not from wherever the run left the page */
  const sp = await page.evaluate(() => new Promise(res => setTimeout(() => { const el = document.querySelector('#splash'); res({ present: !!el, off: !el || el.classList.contains('off') }); }, 200)));
  ok('the opening screen is up 200 ms after a fresh load', sp.present && !sp.off, JSON.stringify(sp));
  const sp2 = await page.evaluate(() => new Promise(res => setTimeout(() => { const el = document.querySelector('#splash'); res({ present: !!el, off: !el || el.classList.contains('off') }); }, 2000)));
  ok('...and gone by 2.2 s (it lingers 1.6 s, take 86)', sp2.off, JSON.stringify(sp2));
  await new Promise(r => setTimeout(r, 800));
  /* Take 82: native controls take the theme; the play palette is charcoal; five taps open Diagnostics */
  const t82 = await page.evaluate(async () => {
    const V = window.VAULT; V.MODE.set('hunt', true); V.go && V.go('local');
    const sel = document.querySelector('#localRadius'); const cs = sel ? getComputedStyle(sel) : null;
    V.MODE.set('play', true); await new Promise(r => setTimeout(r, 320));   /* take 110: the palette turns over --dur-ui (220 ms); read it once it has */
    const playBg = getComputedStyle(document.body).backgroundColor;
    V.MODE.set('collect', true); window.scrollTo(0, 0);
    return { selectBg: cs && cs.backgroundColor, selectBorder: cs && cs.borderTopColor, playBg }; });
  ok('the distance dropdown is themed, not the platform white', t82.selectBg && t82.selectBg !== 'rgb(255, 255, 255)' && t82.selectBg !== 'rgba(0, 0, 0, 0)', JSON.stringify(t82));
  ok('Prep & Play draws on charcoal, not green', t82.playBg === 'rgb(21, 23, 28)', t82.playBg);
  /* Take 66: what a screen reader would actually reach, in a real DOM --
     every visible control has an accessible name (text or aria-label). */
  const a11y = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const ctrls = [...document.querySelectorAll('button, [role="tab"], a[href]')].filter(vis);
    const bad = ctrls.filter(e => !((e.getAttribute('aria-label') || '').trim() || (e.textContent || '').trim()));
    return { total: ctrls.length, bad: bad.length, sample: bad.slice(0, 3).map(e => e.outerHTML.slice(0, 60)),
             headings: document.querySelectorAll('h1, [role="heading"]').length,
             tabs: [...document.querySelectorAll('[role="tab"]')].map(e => e.getAttribute('aria-selected')) };
  });
  ok('every visible control has an accessible name', a11y.bad === 0 && a11y.total > 10, JSON.stringify(a11y));
  ok('screen titles are headings and exactly one real tab is selected',
     a11y.headings >= 1 && a11y.tabs.filter(x => x === 'true').length === 1, JSON.stringify(a11y.tabs));
  /* Take 80: keyboard focus is visible; a mouse click's focus is not */
  const ring = await page.evaluate(async () => {
    const b = document.querySelector('nav button[data-go="search"]'); b.focus();
    const kb = getComputedStyle(b); const viaKeyboard = kb.outlineStyle !== 'none' && parseFloat(kb.outlineWidth) >= 1;
    return { viaKeyboard, colour: kb.outlineColor };
  });
  ok('a keyboard-focused control shows a visible ring in the accent colour', ring.viaKeyboard, JSON.stringify(ring));
  ok('headings render in the palette accent, not the body colour (landmine 117)',
     /rgb\(201, 162, 74\)/.test(wide.headColour), wide.headColour);
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });

  /* ---- take 10: the scanner's pixel stages, in a real canvas ------------
     Everything but the camera. A synthetic frame with a card-shaped bright
     quad, an INJECTED recogniser returning exactly what take 7 measured ML Kit
     and Tesseract return, and the committed star template. */
  const scan = await page.evaluate(async () => {
    const V = window.VAULT, SC = V.scan, out = {};
    const injected = [];
    const realOcr = SC.PLATFORM.ocr;
    SC.PLATFORM.ocr = async c => { injected.push(c.width + 'x' + c.height); return 'SP EB03-024 SR 4'; };
    const mk = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h;
                                 const g = c.getContext('2d'); draw(g); return c; };
    const card = mk(640, 480, g => { g.fillStyle = '#000'; g.fillRect(0, 0, 640, 480);
                                     g.fillStyle = '#eee'; g.fillRect(180, 40, 280, 391); });
    const r1 = await SC.identifyFrame(card, 640, 480, {});
    out.card = { stage: r1.stage, number: r1.number, face: r1.face, crop: injected[0] };
    out.gate = V.resolve(r1.number || 'x', { face: r1.face });
    out.gate = { verdict: out.gate.verdict, treat: out.gate.pick && out.gate.pick.treat };
    const dark = mk(640, 480, g => { g.fillStyle = '#111'; g.fillRect(0, 0, 640, 480); });
    out.dark = (await SC.identifyFrame(dark, 640, 480, {})).stage;
    const tl = mk(640, 480, g => { g.fillStyle = '#000'; g.fillRect(0, 0, 640, 480);
                                   g.fillStyle = '#eee'; g.fillRect(100, 40, 440, 400); });
    out.toploader = (await SC.identifyFrame(tl, 640, 480, {})).stage;
    SC.PLATFORM.ocr = realOcr;
    const T = V.CAT.star;
    const self = mk(T.w, T.h, g => { const im = g.createImageData(T.w, T.h);
      for (let i = 0; i < T.w * T.h; i++) { const v = 128 + 60 * T.template[i];
        im.data[i*4] = im.data[i*4+1] = im.data[i*4+2] = v; im.data[i*4+3] = 255; }
      g.putImageData(im, 0, 0); });
    out.selfScore = SC.starScore(self);
    const flat = mk(T.w, T.h, g => { g.fillStyle = '#888'; g.fillRect(0, 0, T.w, T.h); });
    out.flatScore = SC.starScore(flat);
    out.threshold = T.threshold;
    out.hasOcr = SC.PLATFORM.hasOcr();
    return out;
  });
  ok('scanner: a card-shaped bright quad is detected', scan.card.stage === 'read', scan.card.stage);
  ok('scanner: the crop handed to OCR is the upscaled code strip',
     /^\d{3}x1\d\d$/.test(scan.card.crop || ''), scan.card.crop);
  ok('scanner: the injected read resolves to EB03-024', scan.card.number === 'EB03-024');
  ok('scanner: the SP badge in the text sets face=sp', scan.card.face === 'sp');
  ok('scanner: the gate auto-accepts the SP', scan.gate.verdict === 'auto' && scan.gate.treat === 'sp',
     JSON.stringify(scan.gate));
  ok('scanner: an empty frame is no-card, not a guess', scan.dark === 'no-card', scan.dark);
  ok('scanner: a toploader-shaped quad is rejected (landmine 14)',
     scan.toploader === 'no-card', scan.toploader);
  ok('star: the template recognises itself', scan.selfScore > 0.95, String(scan.selfScore));
  ok('star: a flat patch scores below threshold', scan.flatScore < scan.threshold,
     `${scan.flatScore} vs ${scan.threshold}`);
  ok('scanner: no recogniser in a browser, and it knows', scan.hasOcr === false);

  /* take 11: the filter sheet's apply button must be reachable without a
     scroll, or a collector with sixty sets never finds it. */
  await page.evaluate(() => document.querySelector('#sortBtn').click());
  await new Promise(r => setTimeout(r, 250));
  const sheet = await page.evaluate(() => {
    const a = document.querySelector('#fApply').getBoundingClientRect();
    const chips = [...document.querySelectorAll('#filters .chip')];
    return { visible: a.top >= 0 && a.bottom <= innerHeight, chips: chips.length,
             minH: Math.min(...chips.map(c => c.getBoundingClientRect().height)),
             counts: chips.filter(c => c.querySelector('small')).length,
             showText: document.querySelector('#fN').textContent };
  });
  ok('filter sheet: the Show button is on screen without scrolling', sheet.visible);
  ok('filter sheet: chips are tall enough to tap (>=32px)', sheet.minH >= 32, String(sheet.minH));
  ok('filter sheet: facet chips carry live counts', sheet.counts >= 4, String(sheet.counts));  // fixture has 3 cards
  ok('filter sheet: the button says how many rows will show', /^\d+ line/.test(sheet.showText), sheet.showText);

  /* take 90 -- A36, landmine 126. A set chip tapped in a real DOM must show
     that set's cards (it showed none from take 11 to take 89: the chip
     stored the dataset string, the filter compared an int) and must still
     be lit when the sheet reopens. The control below is the old shape. */
  const chipTap = async () => { await page.evaluate(() => document.querySelector('#fSet .chip').click());
                                await new Promise(r => setTimeout(r, 250)); };
  await chipTap();
  const c1 = await page.evaluate(() => {
    const chip = document.querySelector('#fSet .chip');
    return { n: +((chip.querySelector('small') || {}).textContent || 0), lit: chip.classList.contains('on'),
             fN: document.querySelector('#fN').textContent, stored: window.VAULT.FILT.own.set.slice() };
  });
  ok("set chip: a tap shows that set's cards, not zero", c1.n > 0 && new RegExp('^' + c1.n + ' line').test(c1.fN),
     `${c1.fN} for a chip counting ${c1.n}`);
  ok('set chip: the stored id is a number, as the catalogue keys it',
     c1.stored.length === 1 && typeof c1.stored[0] === 'number', JSON.stringify(c1.stored));
  ok('set chip: lit after the tap', c1.lit);
  await page.evaluate(() => document.querySelector('#fApply').click());
  await new Promise(r => setTimeout(r, 300));
  const tiles1 = await page.$$eval('#colGrid .tile', e => e.length);
  ok('set chip: Show draws exactly that many tiles', tiles1 === c1.n, `${tiles1} vs ${c1.n}`);
  await page.evaluate(() => document.querySelector('#sortBtn').click());
  await new Promise(r => setTimeout(r, 250));
  ok('set chip: still lit when the sheet reopens',
     await page.evaluate(() => document.querySelector('#fSet .chip').classList.contains('on')));
  await chipTap();
  const c2 = await page.evaluate(() => ({ fN: document.querySelector('#fN').textContent,
                                          stored: window.VAULT.FILT.own.set.length,
                                          pool: window.VAULT.OWN.items.length }));
  ok('set chip: a second tap un-selects it and every card is back',
     c2.stored === 0 && new RegExp('^' + c2.pool + ' line').test(c2.fN), c2.fN);   /* take 111: the collection counts lines, as More does */
  ok('negative control: the DOM string stored as it came matches nothing (the take-89 shape)',
     await page.evaluate(() => {
       const V = window.VAULT, id = V.CAT.byId.get(V.OWN.items[0].id).set;
       const pool = V.OWN.items.map(i => ({ i, p: V.CAT.byId.get(i.id) }));
       return V.applyFilter(pool, Object.assign(V.blankFilter('own'), { set: [String(id)] })).length === 0;
     }));
  await page.evaluate(() => document.querySelector('#fClear').click());   // leaves a blank filter for what follows
  await new Promise(r => setTimeout(r, 250));
  await page.evaluate(() => document.querySelector('#filters').classList.remove('on'));

  /* Landmine 82: nothing interactive under the simulated status bar or gesture bar. */
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--safe-area-inset-top', '36px');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '24px');
    document.querySelector('nav button[data-go="home"]').click();
  });
  await new Promise(r => setTimeout(r, 200));
  const ins = await page.evaluate(() => {
    const tt = document.querySelector('.screen.on .ab-title'); const top = tt ? tt.getBoundingClientRect().top : -1;   // take 107: the header's title
    const nav = document.querySelector('nav').getBoundingClientRect().bottom;
    return { firstContentTop: Math.round(top), navBottom: Math.round(nav), vh: innerHeight };
  });
  ok('content starts below a 36px status bar (landmine 82)', ins.firstContentTop >= 36, String(ins.firstContentTop));
  ok('the nav sits above a 24px gesture bar', ins.navBottom <= ins.vh - 24, `${ins.navBottom} vs ${ins.vh - 24}`);

  /* Take 19: the first-run tour paints full-screen on a fresh install and
     dismisses. Landmine 90 -- it once reported shown at 0x0. */
  /* The guide key is versioned (APEX A147); read it off the page, never pin it. */
  await page.evaluate(() => { Object.keys(localStorage).filter(k => k.startsWith('optcghub.guide.')).forEach(k => localStorage.removeItem(k)); });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 900));
  const tour = await page.evaluate(() => {
    const t = document.querySelector('#tour'); const r = t.getBoundingClientRect();
    return { hidden: t.hidden, w: Math.round(r.width), h: Math.round(r.height),
             cards: document.querySelectorAll('#tour .gcard').length };
  });
  ok('the tour shows on first open and paints full-screen (landmine 90)',
     !tour.hidden && tour.w >= 400 && tour.h >= 800 && tour.cards >= 5, JSON.stringify(tour));
  await page.evaluate(() => document.querySelector('#tourSkip').click());
  ok('the tour dismisses and remembers', await page.evaluate(() =>
     document.querySelector('#tour').hidden && Object.keys(localStorage).some(k => k.startsWith('optcghub.guide.') && localStorage.getItem(k) === '1')));

  /* Take 24: switching mode changes the palette and the nav, in Chrome. */
  await page.evaluate(() => { localStorage.setItem('optcghub.guide.v1', '1'); document.querySelector('#tour').hidden = true;
                              document.querySelector('#modeSlider [data-mode="play"]').click(); });
  await new Promise(r => setTimeout(r, 400));
  const md = await page.evaluate(() => ({
    bg: getComputedStyle(document.body).backgroundColor,
    navs: [...document.querySelectorAll('nav')].filter(n => getComputedStyle(n).display !== 'none').map(n => n.id),
    screen: document.querySelector('.screen.on').id,
    sliderTop: Math.round(document.querySelector('.modebar').getBoundingClientRect().top) }));
  ok('Prep & Play: the body is charcoal (red accent; green until take 82)', md.bg === 'rgb(21, 23, 28)', md.bg);
  ok('Prep & Play: only the play nav is visible', md.navs.length === 1 && md.navs[0] === 'navPlay', JSON.stringify(md.navs));
  ok('Prep & Play: lands on Decks', md.screen === 'decks', md.screen);
  ok('the mode slider sits below the status bar', md.sliderTop >= 36, String(md.sliderTop));
  await page.evaluate(() => document.querySelector('#modeSlider [data-mode="collect"]').click());
  await new Promise(r => setTimeout(r, 400));
  ok('Collect: back to the night sea', (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === 'rgb(11, 22, 34)');

  const contrast = await page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    const fg = getComputedStyle(document.querySelector('#pfTotal')).color;
    return { bg, fg };
  });
  ok('foreground and background are not the same colour',
     contrast.bg !== contrast.fg, JSON.stringify(contrast));

  /* Take 107 (A42): one header on every screen. Each of the twenty screens is
     reached the way a person reaches it and its title measured here: one
     height, one size, one face; the page's edge on a screen in a nav, beside
     the arrow one level down; the gear in one spot on every screen in a nav;
     nothing in a header clipped, overlapping or off the screen. The take-106
     build, measured the same way, had five screens with no title at all and
     the rest at three heights. */
  const t107 = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    const plan = [['collect', 'home'], ['collect', 'search'], ['collect', 'scan'], ['collect', 'collection'], ['collect', 'wants'], ['collect', 'binder'],
      ['collect', 'trade'], ['collect', 'checklist'], ['collect', 'detail'], ['collect', 'settings'], ['collect', 'diag'],
      ['play', 'decks'], ['play', 'deck'], ['play', 'cards'], ['play', 'play'], ['play', 'sim'],
      ['hunt', 'sealed'], ['hunt', 'releases'], ['hunt', 'local'], ['hunt', 'events']];
    const rows = [];
    for (const [mode, id] of plan) {
      if (V.MODE.cur !== mode) { V.MODE.set(mode, true); await wait(300); }
      while (V.closeAnyOverlay()) {}
      if (id === 'checklist') V.openChecklist([...V.CAT.sets.values()][0].id);
      else if (id === 'detail') V.openDetail(V.CAT.rows[0].id);
      else if (id === 'deck') { V.go('decks'); await wait(100); document.querySelector('#dkNew').click(); }
      else V.go(id);
      await wait(220); while (V.closeAnyOverlay()) {} window.scrollTo(0, 0);
      const sec = document.getElementById(id), s = sec.getBoundingClientRect(), h = sec.querySelector('header.appbar'), t = h && h.querySelector('.ab-title');
      /* take 109: a screen with an art hero puts its header right under it (A's slot) -- measured from there */
      const hero = sec.querySelector(':scope > .arthero:not([hidden])'), off = hero ? hero.getBoundingClientRect().bottom - s.top : 0;
      if (!t) { rows.push({ id, missing: true }); continue; }
      const r = t.getBoundingClientRect(), cs = getComputedStyle(t), txt = h.querySelector('.ab-text').getBoundingClientRect(), act = h.querySelector('.ab-act');
      const a = act && act.getBoundingClientRect(), g = h.querySelector('[data-go="settings"]'), gr = g && g.getBoundingClientRect();
      rows.push({ id, on: sec.classList.contains('on'), top: Math.round((r.top - s.top - off) * 10) / 10, left: Math.round(r.left - s.left), size: cs.fontSize, face: cs.fontFamily,
        hero: !!hero, headerUnderHero: !hero || Math.abs(h.getBoundingClientRect().top - hero.getBoundingClientRect().bottom) < 0.6,
        back: !!h.querySelector('[data-back]'), gear: gr ? `${Math.round(gr.left - s.left)},${Math.round(gr.top - s.top - off)}` : '',
        clipped: t.scrollWidth > t.clientWidth + 1, overlap: !!a && txt.right > a.left + 0.5,
        outside: [...h.querySelectorAll('*')].some(e => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.left < -0.5 || b.right > innerWidth + 0.5); }) });
    }
    V.MODE.set('collect', true); V.go('home'); return rows;
  });
  const push107 = ['deck', 'detail', 'checklist', 'binder', 'wants', 'trade', 'diag', 'settings'];
  const got107 = t107.filter(r => !r.missing), nav107 = got107.filter(r => !push107.includes(r.id)), down107 = got107.filter(r => push107.includes(r.id));
  const one = (rows, k) => new Set(rows.map(r => r[k])).size === 1;
  ok('take 107: all twenty screens draw a header title, each on its own screen', t107.length === 20 && got107.length === 20 && got107.every(r => r.on), JSON.stringify(t107.filter(r => r.missing || !r.on).map(r => r.id)));
  ok('take 107: every title at one height, one size (26px) and one face (the display face)', got107.length === 20 && one(got107, 'top') && one(got107, 'size') && got107[0].size === '26px' && one(got107, 'face') && /OPH Display/.test(got107[0].face),
     JSON.stringify({ tops: [...new Set(got107.map(r => r.top))], sizes: [...new Set(got107.map(r => r.size))] }));
  ok('take 107: a title starts at the page\'s edge on the twelve screens in a nav, beside the arrow on the eight one level down',
     nav107.length === 12 && down107.length === 8 && one(nav107, 'left') && one(down107, 'left') && down107[0].left > nav107[0].left && nav107.every(r => !r.back) && down107.every(r => r.back),
     JSON.stringify({ nav: [...new Set(nav107.map(r => r.left))], down: [...new Set(down107.map(r => r.left))] }));
  ok('take 107: the gear to More sits in one spot on all twelve screens in a nav, in all three modes (A37)', nav107.length === 12 && nav107.every(r => r.gear) && one(nav107, 'gear') && down107.every(r => !r.gear),
     JSON.stringify([...new Set(nav107.map(r => r.gear))]));
  ok('take 109: the art hero is on Decks (and, from take 110, Sealed) alone, with its header directly under it (A\'s slot); Home has none', got107.filter(r => r.hero).map(r => r.id).sort().join() === 'decks,sealed' && got107.every(r => r.headerUnderHero),
     JSON.stringify(got107.filter(r => r.hero || !r.headerUnderHero).map(r => r.id)));
  ok('take 107: nothing in a header is clipped, overlaps the title or leaves the screen', got107.length === 20 && got107.every(r => !r.clipped && !r.overlap && !r.outside),
     JSON.stringify(got107.filter(r => r.clipped || r.overlap || r.outside).map(r => r.id)));
  /* the arrow, Back over the sheets, the ask sheet's cross -- real clicks and the browser's own Back */
  const t107b = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), on = () => (document.querySelector('.screen.on') || {}).id, open = id => document.querySelector(id).classList.contains('on');
    V.MODE.set('play', true); await wait(300); V.go('decks'); await wait(100);
    document.querySelector('#dkNew').click(); await wait(200);
    const atDeck = on(); const arrow = document.querySelector('#deck .ab-back'); if (arrow) arrow.click(); await wait(300);
    const afterArrow = on();
    document.querySelector('#dkNew').click(); await wait(200); document.querySelector('#dkLead').click(); await wait(150);
    const lpOpen = open('#leaderPick'); history.back(); await wait(300);
    const lpAfter = { open: open('#leaderPick'), screen: on() }; document.querySelector('#leaderPick').classList.remove('on');
    V.MODE.set('collect', true); await wait(300); V.go('search'); await wait(150);
    document.querySelector('#sortBtnAll').click(); await wait(200);
    const fOpen = open('#filters'); history.back(); await wait(300);
    const fAfter = { open: open('#filters'), screen: on() }; document.querySelector('#filters').classList.remove('on');
    let settled = 'pending'; V.askZip().then(v => { settled = String(v); }); await wait(150);
    const askOpen = open('#askSheet'); const x = document.querySelector('#askSheet [data-close]'); if (x) x.click(); await wait(150);
    const askAfter = { open: open('#askSheet'), settled }; if (askAfter.open) document.querySelector('#askCancel').click();
    V.go('home'); return { atDeck, afterArrow, lpOpen, lpAfter, fOpen, fAfter, askOpen, askAfter };
  });
  ok('take 107: the arrow on a deck returns to Decks (a real click)', t107b.atDeck === 'deck' && t107b.afterArrow === 'decks', JSON.stringify(t107b));
  ok('take 107: Back over the Leader sheet closes it and the deck stays (before this take the sheet stayed open over Decks)', t107b.lpOpen && !t107b.lpAfter.open && t107b.lpAfter.screen === 'deck', JSON.stringify(t107b.lpAfter));
  ok('take 107: Back over the filter sheet closes it and Search stays (before this take the sheet stayed open over Home)', t107b.fOpen && !t107b.fAfter.open && t107b.fAfter.screen === 'search', JSON.stringify(t107b.fAfter));
  ok('take 107: the ask sheet\'s cross closes it and answers no', t107b.askOpen && !t107b.askAfter.open && t107b.askAfter.settled === 'false', JSON.stringify(t107b.askAfter));

  /* Take 108 (A42): a 44 px target for every control. Every button, link, field,
     select and tab on the twenty screens and three sheets is brought on screen and
     the four points 21 px from its centre are read with elementFromPoint: each must
     land on the control or inside it (a box inside its <label>: the label). The take-107
     build failed 525 of 1,673 this way. The control: a stepper shrunk to 34 px. */
  const t108 = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    const measure = root => { const out = [];
      const els = new Set([...root.querySelectorAll('button, a[href], select, input:not([type=hidden]), [role="tab"]')].map(e => { const l = e.closest('label'); return l && root.contains(l) ? l : e; }));
      for (const e of els) { const r0 = e.getBoundingClientRect(); if (r0.width < 1 || r0.height < 1 || getComputedStyle(e).visibility === 'hidden') continue;
        const navEl = [...document.querySelectorAll('nav')].find(n => !n.hidden), navTop = navEl ? navEl.getBoundingClientRect().top : innerHeight, barBottom = document.querySelector('.modebar').getBoundingClientRect().bottom;
        if (r0.top < barBottom + 30 || r0.bottom > navTop - 30 || r0.left < 0 || r0.right > innerWidth) e.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });   // on screen, clear of the fixed bars
        const q = e.getBoundingClientRect(), cx = q.left + q.width / 2, cy = q.top + q.height / 2;
        const hits = [[cx - 21, cy], [cx + 21, cy], [cx, cy - 21], [cx, cy + 21]].map(([x, y]) => document.elementFromPoint(x, y));
        const own = hits.every(t => !!t && (t === e || e.contains(t)));
        const by = own ? '' : ' hits ' + hits.map(t => !t ? 'nothing' : (t === e || e.contains(t)) ? 'itself' : t.tagName.toLowerCase() + '.' + String(t.className).split(' ')[0] + '[' + (t.getAttribute('aria-label') || t.textContent || '').trim().slice(0, 12) + ']').join(',');
        out.push({ own, what: ((e.id ? '#' + e.id + ' ' : '') + (e.getAttribute('aria-label') || e.textContent || '')).replace(/\s+/g, ' ').trim().slice(0, 30) + by, w: Math.round(q.width), h: Math.round(q.height) }); }
      return out; };
    if (!V.OWN.items.length) { const c = V.candidates('OP01-016', null)[0]; if (c) V.OWN.add(c.id, { condition: 'NM' }); }
    const plan = [['collect', 'home'], ['collect', 'search'], ['collect', 'scan'], ['collect', 'collection'], ['collect', 'wants'], ['collect', 'binder'], ['collect', 'trade'],
      ['collect', 'checklist'], ['collect', 'detail'], ['collect', 'settings'], ['collect', 'diag'], ['play', 'decks'], ['play', 'deck'], ['play', 'cards'], ['play', 'play'], ['play', 'sim'],
      ['hunt', 'sealed'], ['hunt', 'releases'], ['hunt', 'local'], ['hunt', 'events'], ['collect', '#filters'], ['collect', '#picker'], ['play', '#leaderPick']];
    let all = []; let control = null;
    for (const [mode, id] of plan) {
      if (V.MODE.cur !== mode) { V.MODE.set(mode, true); await wait(300); }
      while (V.closeAnyOverlay()) {}
      let root;
      if (id[0] === '#') {
        if (id === '#filters') { V.go('collection'); await wait(150); document.querySelector('#sortBtn').click(); }
        if (id === '#picker') { V.go('home'); await wait(150); document.querySelector('#pfSwitch').click(); }
        if (id === '#leaderPick') { V.go('decks'); await wait(100); document.querySelector('#dkNew').click(); await wait(150); document.querySelector('#dkLead').click(); }
        await wait(250); root = document.querySelector(id + ' .sheetbody');
      } else {
        if (id === 'checklist') V.openChecklist([...V.CAT.sets.values()][0].id);
        else if (id === 'detail') V.openDetail(V.OWN.items[0] ? V.OWN.items[0].id : V.CAT.rows[0].id);
        else if (id === 'deck') { V.go('decks'); await wait(100); document.querySelector('#dkNew').click(); }
        else V.go(id);
        await wait(280); window.scrollTo(0, 0); root = document.getElementById(id);
      }
      all = all.concat(measure(root).map(r => ({ ...r, where: id })));
      if (id === 'detail') { const b = document.querySelector('#dPlus'); b.style.width = b.style.height = '34px';   // the control: a 34 px stepper
        control = measure(root).filter(r => !r.own).map(r => r.what); b.style.width = b.style.height = ''; }
      if (id[0] === '#') document.querySelector(id).classList.remove('on');
    }
    /* the scanner's bottom row sits above the nav (it sat 52 px under it until this take) */
    V.MODE.set('collect', true); await wait(300); V.go('scan'); await wait(250);
    const sb = document.querySelector('.shutterbar').getBoundingClientRect(), nav = document.querySelector('#navCollect').getBoundingClientRect();
    const scanner = { shutterbarBottom: Math.round(sb.bottom), navTop: Math.round(nav.top) };
    V.go('home'); await wait(200); window.scrollTo(0, 0);
    return { total: all.length, bad: all.filter(r => !r.own).map(r => `${r.where} ${r.what} ${r.w}x${r.h}`), control, scanner };
  });
  ok('take 108: every control on the twenty screens and three sheets has a 44 px square of its own', t108.total > 1000 && t108.bad.length === 0, `${t108.bad.length} of ${t108.total}: ${t108.bad.slice(0, 4).join(' | ')}`);
  ok('take 108: ...control: a stepper shrunk to 34 px is caught', Array.isArray(t108.control) && t108.control.some(w => /#dPlus/.test(w)), JSON.stringify(t108.control));
  ok('take 108: the scanner\'s bottom row sits above the nav (52 px under it before this take)', t108.scanner.shutterbarBottom <= t108.scanner.navTop, JSON.stringify(t108.scanner));
  /* ...and the dense case the runner met first (take 108's first check run): where-to-buy strips with
     two sellers that wrap. The fixture feed -- the saved distributor page, as smoke builds it -- gives
     every run the same strips; each is narrowed until it wraps, then every chip's square is read. The
     control removes the chips' 34 px floor, which put wrapped rows 41 px apart. */
  const fxFeed = path.join(os.tmpdir(), 'optcghub-render-feed.json');
  execSync(`python3 tools/hunt.py --from-fixtures --out ${fxFeed}`, { cwd: ROOT, stdio: 'pipe' });
  const wrap108 = await page.evaluate(async feed => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), prev = V.HUNT.feed;
    const sweep = () => { const strips = [...document.querySelectorAll('#sealedList .chips.buy')].filter(s => s.querySelectorAll('a.chip').length > 1); let bad = 0, n = 0;
      for (const s of strips) { s.style.flexBasis = '150px'; s.style.maxWidth = '150px'; }
      for (const s of strips) for (const e of s.querySelectorAll('a.chip')) { e.scrollIntoView({ block: 'center', behavior: 'instant' });
        const q = e.getBoundingClientRect(), cx = q.left + q.width / 2, cy = q.top + q.height / 2; n++;
        if (![[cx - 21, cy], [cx + 21, cy], [cx, cy - 21], [cx, cy + 21]].every(([x, y]) => { const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); })) bad++; }
      for (const s of strips) { s.style.flexBasis = ''; s.style.maxWidth = ''; }
      return { strips: strips.length, chips: n, bad }; };
    V.HUNT.feed = feed; V.MODE.set('hunt', true); await wait(300); V.go('sealed'); V.paintSealed(); await wait(300); while (V.closeAnyOverlay()) {}
    const clean = sweep();
    const st = document.createElement('style'); st.textContent = '.chip{min-height:0!important}'; document.head.appendChild(st); await wait(50);
    const control = sweep(); st.remove();
    V.HUNT.feed = prev; V.paintSealed(); V.MODE.set('collect', true); await wait(300); V.go('home');
    return { clean, control };
  }, JSON.parse(fs.readFileSync(fxFeed, 'utf8')));
  ok('take 108: where-to-buy chips wrapped onto two lines keep a 44 px square each', wrap108.clean.strips > 0 && wrap108.clean.chips >= 2 * wrap108.clean.strips && wrap108.clean.bad === 0, JSON.stringify(wrap108));
  ok('take 108: ...control: without the chips\' 34 px floor the wrapped rows collide', wrap108.control.bad > 0, JSON.stringify(wrap108.control));
  /* pressed and disabled, as a person sees them */
  const range = await page.evaluate(() => { const b = document.querySelector('#ranges .range.on') || document.querySelector('#ranges .range'); if (!b) return null; b.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  let pressed = null;
  if (range) { await page.mouse.move(range.x, range.y); await page.mouse.down(); await new Promise(r => setTimeout(r, 220));
    pressed = await page.evaluate(() => { const b = document.querySelector('#ranges .range.on') || document.querySelector('#ranges .range'); const cs = getComputedStyle(b); return { filter: cs.filter, transform: cs.transform }; });
    await page.mouse.up(); }
  ok('take 108: a pressed control lightens and gives a little', !!pressed && /brightness\(1\.25\)/.test(pressed.filter) && /matrix\(0\.96/.test(pressed.transform), JSON.stringify(pressed));
  const disabled = await page.evaluate(async () => { window.VAULT.go('diag'); await new Promise(r => setTimeout(r, 200)); const b = document.querySelector('#diagCopy'); const o = { disabled: b.disabled, opacity: getComputedStyle(b).opacity }; window.VAULT.go('home'); return o; });
  ok('take 108: a disabled button looks switched off', disabled.disabled && disabled.opacity === '0.45', JSON.stringify(disabled));

  /* ---- take 109 (A42): the art layer, part 1 -- the grounds, the crop, the places ----
     What a person sees when a picture is slow or refused is the box's own ground: it must be the
     card's colours (the owner: "the color blur should match the color of whatever card you're
     looking at"). Every picture shown as art is cut above the SAMPLE stamp (landmine 151). */
  const t109 = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    /* an older build lacks these: its checks then fail on their own instead of the run stopping */
    for (const [k, v] of [['heroLeader', () => null], ['artColours', () => []], ['paintDeckHero', () => {}], ['paintBack', () => {}]]) if (typeof V[k] !== 'function') V[k] = v;
    const rgb = v => { const e = document.createElement('i'); e.style.color = v; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; };
    const read = () => {
      const sec = document.getElementById('decks'), hero = sec.querySelector('.arthero'), bg = hero && hero.querySelector('.artbg');
      return { shown: !!hero && !hero.hidden, bg: bg ? getComputedStyle(bg).backgroundImage : '', rises: !!hero && !!hero.querySelector('.peek, img.ref'),   // take 110: no card rises from behind the title
        barTop: Math.round(sec.querySelector('header.appbar').getBoundingClientRect().top * 10) / 10,
        bgTop: bg ? Math.round(bg.getBoundingClientRect().top) : 999, pillTop: Math.round(document.querySelector('.modebar .mode').getBoundingClientRect().top),
        slider: getComputedStyle(document.querySelector('.modebar')).backgroundImage, atTop: document.documentElement.classList.contains('at-top'),
        views: [hero && hero.querySelector('.artbg')].filter(Boolean).map(box => { const i = document.createElement('img'); i.className = 'above'; box.appendChild(i); const v = getComputedStyle(i).objectViewBox; i.remove(); return v; }),
        marked: hero ? (V.paintDeckHero(), (hero.innerHTML.match(/<img class="(ref )?above( ok)?"/g) || []).length) : 0 };   /* ( ok): a picture that loaded before is drawn at once (take 110's review) */   // read at once: a refused picture removes itself later
    };
    V.MODE.set('play', true); await wait(300); V.go('decks'); await wait(250); window.scrollTo(0, 0); await wait(120);
    const f = V.heroLeader(), want = f ? V.artColours(f.L).map(rgb) : [];
    const clean = read();
    /* the controls: no ground under the art, no cut on the pictures, and the page scrolled */
    const st = document.createElement('style'); st.textContent = '.artbg{background:none!important}img.above{object-view-box:none!important}'; document.head.appendChild(st); await wait(60);
    const control = read(); st.remove();
    window.scrollTo(0, 240); await wait(160); const scrolled = read(); window.scrollTo(0, 0); await wait(120);
    /* a card's own page: a two-colour card's ground, and the card centred */
    const two = V.CAT.rows.find(p => !p.sealed && /_200w\.jpg$/.test(p.img || '') && /^[A-Z][a-z]+;[A-Z][a-z]+$/.test(p.color || ''));
    V.MODE.set('collect', true); await wait(250); V.openDetail(two.id); await wait(250); window.scrollTo(0, 0); await wait(80);
    const db = document.getElementById('dBack') || document.body.appendChild(document.createElement('div')), art = document.getElementById('dArt').getBoundingClientRect();   // an older build has no backdrop: its checks fail, the run goes on
    const probe = document.createElement('img'); probe.className = 'above'; db.appendChild(probe); const view = getComputedStyle(probe).objectViewBox; probe.remove();
    V.paintBack(db, two); const marked = /<img class="above( ok)?"/.test(db.innerHTML);   // read at once, as above
    const detail = { bg: getComputedStyle(db).backgroundImage, want: V.artColours(two).map(rgb), view, marked,
      artW: Math.round(art.width), artMid: Math.round(art.left + art.width / 2), mid: Math.round(innerWidth / 2), backTop: Math.round(db.getBoundingClientRect().top), sideways: document.documentElement.scrollWidth > innerWidth + 0.5 };
    V.go('home'); return { want, clean, control, scrolled, detail };
  });
  const has = (bg, cols) => cols.length > 0 && cols.every(c => bg.includes(c));
  ok('take 109: Decks opens under its Leader: the hero is shown, the art\'s ground is that card\'s own colours', t109.clean.shown && has(t109.clean.bg, t109.want.slice(0, 1)), JSON.stringify({ want: t109.want, bg: t109.clean.bg.slice(0, 90) }));
  ok('take 109: ...control: with the ground taken away the check sees no colour', !has(t109.control.bg, t109.want.slice(0, 1)));
  ok('take 109: every picture shown as art is cut above the stamp (object-view-box, landmine 151) -- the backdrop is marked', t109.clean.views.length === 1 && t109.clean.views.every(v => /58%/.test(v)) && t109.clean.marked === 1, JSON.stringify({ views: t109.clean.views, marked: t109.clean.marked }));
  ok('take 109: ...control: without the cut the check sees it', t109.control.views.length >= 1 && t109.control.views.every(v => !/58%/.test(v)), JSON.stringify(t109.control.views));
  ok('take 110: no card rises from behind the Decks title (the owner: "I don\'t like the little peak we have")', t109.clean.shown && t109.clean.rises === false);
  ok('take 109: at the top the art reaches behind the slider and the slider\'s fade steps aside', t109.clean.atTop && t109.clean.bgTop <= t109.clean.pillTop && t109.clean.slider === 'none', JSON.stringify({ bgTop: t109.clean.bgTop, pillTop: t109.clean.pillTop, slider: t109.clean.slider.slice(0, 40) }));
  ok('take 109: ...control: scrolled, the fade is back over whatever passes under the slider', !t109.scrolled.atTop && /gradient/.test(t109.scrolled.slider), t109.scrolled.slider.slice(0, 60));
  ok('take 109: a card\'s own page: its two colours under its blurred art, cut above the stamp, the card centred at 196 px', has(t109.detail.bg, t109.detail.want) && /58%/.test(t109.detail.view) && t109.detail.marked && t109.detail.artW === 196 && Math.abs(t109.detail.artMid - t109.detail.mid) <= 1 && !t109.detail.sideways,
     JSON.stringify(t109.detail));
  /* no sideways scroll on the two screens that changed, at a narrow phone, this phone and the unfolded Fold */
  const wide109 = [];
  for (const w of [360, 412, 820]) {
    await page.setViewport({ width: w, height: 915, deviceScaleFactor: 2 });
    wide109.push(await page.evaluate(async w => { const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), out = { w };
      V.MODE.set('play', true); await wait(250); V.go('decks'); await wait(200); out.decks = document.documentElement.scrollWidth <= innerWidth + 0.5;
      V.MODE.set('collect', true); await wait(250); V.openDetail(V.CAT.rows.find(p => !p.sealed && p.img).id); await wait(200); out.detail = document.documentElement.scrollWidth <= innerWidth + 0.5;
      V.go('home'); return out; }, w));
  }
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  ok('take 109: Decks and a card\'s own page never scroll sideways at 360, 412 or 820 px', wide109.every(r => r.decks && r.detail), JSON.stringify(wide109));

  /* ---- take 110 (A42): the art layer, part 2 -- Sealed's banner, the strips, the Play counter ----
     Sealed opens under the newest set's top card, crisp (A, the owner's pick for Hunt); each set's
     heading carries that set's own art; each player's Leader sits faint behind their side. Every
     picture shown as art is cut above the stamp (landmine 151), crisp or blurred. */
  const t110 = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    /* an older build lacks these: its checks then fail on their own instead of the run stopping */
    for (const [k, v] of [['newestTop', () => null], ['artColours', () => []], ['paintSealedHero', () => {}]]) if (typeof V[k] !== 'function') V[k] = v;
    const rgb = v => { const e = document.createElement('i'); e.style.color = v; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; };
    const probe = box => { if (!box) return {}; const i = document.createElement('img'); i.className = 'above'; box.appendChild(i); const cs = getComputedStyle(i), o = { view: cs.objectViewBox, filter: cs.filter }; i.remove(); return o; };
    const R = e => { const b = e.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), h: Math.round(b.height) }; };
    const read = () => {
      const sec = document.getElementById('sealed'), hero = sec.querySelector(':scope > .arthero'), bg = hero && hero.querySelector('.artbg');
      const strips = [...sec.querySelectorAll('.setstrip')], withArt = strips.filter(x => x.querySelector(':scope > .artbg'));
      return { shown: !!hero && !hero.hidden, crisp: !!bg && bg.classList.contains('crisp'), bg: bg ? getComputedStyle(bg).backgroundImage : '', pic: probe(bg),
        marked: hero ? (V.paintSealedHero(), (hero.innerHTML.match(/<img class="above( ok)?"/g) || []).length) : 0,   // read at once: a refused picture removes itself later
        bgTop: bg ? Math.round(bg.getBoundingClientRect().top) : 999, pillTop: Math.round(document.querySelector('.modebar .mode').getBoundingClientRect().top),
        slider: getComputedStyle(document.querySelector('.modebar')).backgroundImage, atTop: document.documentElement.classList.contains('at-top'),
        strips: strips.length, withArt: withArt.length, minH: strips.length ? Math.min(...strips.map(x => R(x).h)) : 0,
        fill: withArt.slice(0, 6).map(x => { const a = R(x), b = R(x.querySelector(':scope > .artbg')); return a.l === b.l && a.t === b.t && a.r === b.r && a.b === b.b; }),
        name: strips[0] ? getComputedStyle(strips[0].querySelector(':scope > span')).color : '', stripPic: withArt[0] ? probe(withArt[0].querySelector(':scope > .artbg')) : {} };
    };
    V.MODE.set('hunt', true); await wait(300); V.go('sealed'); await wait(250); window.scrollTo(0, 0); await wait(120);
    const f = V.newestTop(), want = f ? V.artColours(f.p).map(rgb) : [];
    const clean = read();
    /* the controls: no ground, no cut, a blurred banner, a strip's art knocked into the flow */
    const st = document.createElement('style'); st.textContent = '.artbg{background:none!important}img.above{object-view-box:none!important}.artbg.crisp img{filter:blur(18px)!important}.setstrip > .artbg{position:static!important}'; document.head.appendChild(st); await wait(60);
    const control = read(); st.remove(); await wait(60);
    /* the Play counter at the table, both Leaders chosen */
    V.MODE.set('play', true); await wait(250);
    const keep = V.PLAY.p.map(p => p.leader), hot = V.PLAY.hotseat, L = V.CAT.stock[0].leader;
    V.PLAY.hotseat = false; V.PLAY.p[0].leader = L; V.PLAY.p[1].leader = L; V.go('play'); V.paintPlay(); await wait(250); window.scrollTo(0, 0);
    const panels = [...document.querySelectorAll('#plBoard .plpanel')].map(pn => { const a = pn.querySelector(':scope > .artbg'); if (!a) return null;
      const P = R(pn), A = R(a), kids = [...pn.children].filter(c => c !== a);
      return { inside: A.l >= P.l && A.r <= P.r && A.t >= P.t && A.b <= P.b, opacity: getComputedStyle(a).opacity, over: kids.length > 0 && kids.every(c => getComputedStyle(c).position === 'relative'), pic: probe(a) }; });
    V.PLAY.p.forEach((p, i) => { p.leader = keep[i]; }); V.PLAY.hotseat = hot; V.paintPlay();
    V.MODE.set('collect', true); await wait(250); V.go('home');
    return { want, clean, control, panels };
  });
  ok('take 110: Sealed opens under the newest set\'s top card, sharp, on that card\'s own colours', t110.clean.shown && t110.clean.crisp && has(t110.clean.bg, t110.want.slice(0, 1)) && t110.clean.pic.filter === 'none',
     JSON.stringify({ want: t110.want, bg: t110.clean.bg.slice(0, 90), filter: t110.clean.pic.filter }));
  ok('take 110: ...cut above the stamp (landmine 151), the picture marked so', /58%/.test(t110.clean.pic.view || '') && t110.clean.marked === 1, JSON.stringify({ pic: t110.clean.pic, marked: t110.clean.marked }));
  ok('take 110: ...control: without the ground, the cut or the sharpness the check sees it', !has(t110.control.bg, t110.want.slice(0, 1)) && !/58%/.test(t110.control.pic.view || '') && t110.control.pic.filter !== 'none', JSON.stringify(t110.control.pic));
  ok('take 110: at the top the banner reaches behind the slider and the slider\'s fade steps aside, as on Decks', t110.clean.atTop && t110.clean.bgTop <= t110.clean.pillTop && t110.clean.slider === 'none',
     JSON.stringify({ bgTop: t110.clean.bgTop, pillTop: t110.clean.pillTop, slider: t110.clean.slider.slice(0, 40) }));
  ok('take 110: every heading in Sealed is a strip at least 64 px tall; the art fills each one, sharp and cut above the stamp, the name white over the scrim',
     t110.clean.strips >= 10 && t110.clean.withArt >= 5 && t110.clean.minH >= 64 && t110.clean.fill.length > 0 && t110.clean.fill.every(Boolean) && /58%/.test(t110.clean.stripPic.view || '') && t110.clean.stripPic.filter === 'none' && t110.clean.name === 'rgb(255, 255, 255)',
     JSON.stringify({ strips: t110.clean.strips, withArt: t110.clean.withArt, minH: t110.clean.minH, fill: t110.clean.fill, pic: t110.clean.stripPic, name: t110.clean.name }));
  ok('take 110: ...control: a strip\'s art knocked out of place is caught', t110.control.fill.length > 0 && t110.control.fill.some(x => !x), JSON.stringify(t110.control.fill));
  ok('take 110: the Play counter: each side\'s Leader inside its own panel, faint (0.6), cut above the stamp, everything else drawn over it',
     t110.panels.length === 2 && t110.panels.every(p => p && p.inside && p.opacity === '0.6' && p.over && /58%/.test(p.pic.view || '')), JSON.stringify(t110.panels));
  /* the owner's word on the blur: "zoomed out a bit so it's more focused on the center of the art" --
     the band above the stamp whole, at the width of its box, where take 109 cut it to cover the box */
  const frame110 = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    const fit = box => { if (!box) return null; const i = document.createElement('img'); i.className = 'above'; box.appendChild(i); const cs = getComputedStyle(i),
      o = { fit: cs.objectFit, pos: cs.objectPosition, view: cs.objectViewBox, w: Math.round(i.getBoundingClientRect().width), bw: Math.round(box.getBoundingClientRect().width) }; i.remove(); return o; };
    V.MODE.set('play', true); await wait(250); V.go('decks'); await wait(200);
    const decks = fit(document.querySelector('#dkHero .artbg'));
    V.MODE.set('collect', true); await wait(250); V.openDetail(V.CAT.rows.find(p => !p.sealed && p.img).id); await wait(200);
    const page = fit(document.getElementById('dBack'));
    const st = document.createElement('style'); st.textContent = '.artbg img{left:-24px!important;width:calc(100% + 48px)!important;object-fit:cover!important}'; document.head.appendChild(st); await wait(40);
    const control = fit(document.getElementById('dBack')); st.remove();
    V.go('home'); return { decks, page, control };
  });
  ok('take 110: the blurred art is zoomed out: the band above the stamp whole, at the width of its box -- centred on Decks, at the top of a card\'s page',
     !!frame110.decks && frame110.decks.fit === 'contain' && frame110.decks.pos === '50% 50%' && frame110.decks.w === frame110.decks.bw && /58%/.test(frame110.decks.view || '')
     && !!frame110.page && frame110.page.fit === 'contain' && /^50% 0(px|%)?$/.test(frame110.page.pos) && frame110.page.w === frame110.page.bw && /58%/.test(frame110.page.view || ''), JSON.stringify(frame110));
  ok('take 110: ...control: take 109\'s blur, cut to cover the box past its edges, is caught', !!frame110.control && (frame110.control.fit !== 'contain' || frame110.control.w !== frame110.control.bw), JSON.stringify(frame110.control));
  /* no sideways scroll on the two screens that changed, at a narrow phone, this phone and the unfolded Fold */
  const wide110 = [];
  for (const w of [360, 390, 412, 820]) {
    await page.setViewport({ width: w, height: 915, deviceScaleFactor: 2 });
    wide110.push(await page.evaluate(async w => { const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), out = { w };
      V.MODE.set('hunt', true); await wait(250); V.go('sealed'); await wait(200); out.sealed = document.documentElement.scrollWidth <= innerWidth + 0.5;
      const keep = V.PLAY.p.map(p => p.leader), L = V.CAT.stock[0].leader;
      V.MODE.set('play', true); await wait(250); V.PLAY.p.forEach(p => { p.leader = L; }); V.go('play'); V.paintPlay(); await wait(200); out.play = document.documentElement.scrollWidth <= innerWidth + 0.5;
      /* a panel that clips (overflow:hidden, for the art) would hide a control instead of scrolling: nothing may cross its box */
      out.clip = [...document.querySelectorAll('#plBoard .plpanel')].flatMap(pn => { const P = pn.getBoundingClientRect(); return [...pn.querySelectorAll('button')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.left < P.left - 0.5 || b.right > P.right + 0.5); }).map(e => e.getAttribute('aria-label')); });
      V.PLAY.p.forEach((p, i) => { p.leader = keep[i]; }); V.paintPlay();
      V.MODE.set('collect', true); await wait(250); V.go('home'); return out; }, w));
  }
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  ok('take 110: Sealed and the Play counter never scroll sideways at 360, 390, 412 or 820 px, and no button of the counter is cut by its panel (take 108\'s 44 px steppers did not fit below 400 px)', wide110.length === 4 && wide110.every(r => r.sealed && r.play && r.clip.length === 0), JSON.stringify(wide110));
  /* ---- take 110, polish (A42 layer 6): motion from the tokens, measured in Chrome ----
     a sheet rises on --dur-sheet and not at all under reduced motion; a real tap on the slider
     crossfades and the class comes off; the thumbnails are the three sizes; figures are tabular */
  const pol = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    V.MODE.set('collect', true); await wait(250); V.go('search'); await wait(200);
    document.querySelector('#sortBtnAll').click(); await wait(30);
    const sb = document.querySelector('#filters .sheetbody'), a = getComputedStyle(sb), sheet = { name: a.animationName, dur: a.animationDuration };
    while (V.closeAnyOverlay()) {} await wait(100);
    document.querySelector('#modeSlider [data-mode="hunt"]').click(); await wait(40);
    const swapOn = document.documentElement.classList.contains('mode-swap'), fade = getComputedStyle(document.querySelector('.screen.on')).animationName;
    await wait(500); const swapOff = !document.documentElement.classList.contains('mode-swap');
    V.go('sealed'); await wait(250); while (V.closeAnyOverlay()) {}
    const sp = document.querySelector('#sealedList [data-open] .pic'), spb = sp && sp.getBoundingClientRect();
    const num = getComputedStyle(document.body).fontVariantNumeric;
    V.MODE.set('collect', true); await wait(250); V.go('home');
    return { sheet, swapOn, fade, swapOff, sealedPic: spb ? `${Math.round(spb.width)}x${Math.round(spb.height)}` : 'none', num };
  });
  ok('take 110: a sheet rises from the bottom on --dur-sheet (320 ms)', pol.sheet.name === 'sheetUp' && pol.sheet.dur === '0.32s', JSON.stringify(pol.sheet));
  ok('take 110: a tap on the mode slider crossfades the new screen, and the class comes off after', pol.swapOn && pol.fade === 'modeIn' && pol.swapOff, JSON.stringify(pol));
  ok('take 110: a sealed product\'s picture is the large thumbnail (56x70) and every figure is tabular', pol.sealedPic === '56x70' && /tabular-nums/.test(pol.num), JSON.stringify(pol));
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const still = await page.evaluate(async () => { const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)); V.go('search'); await wait(200); document.querySelector('#sortBtnAll').click(); await wait(30);
    const a = getComputedStyle(document.querySelector('#filters .sheetbody')); const o = { name: a.animationName, dur: a.animationDuration }; while (V.closeAnyOverlay()) {} V.go('home'); return o; });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  ok('take 110: ...with reduced motion the sheet is simply there (the animation takes no time)', still.dur === '0s', JSON.stringify(still));
  /* take 110's review: a picture that has loaded is drawn at once when its screen repaints -- a keystroke in
     Sealed's search had rebuilt every strip at opacity 0 and faded it in again, and a tap on the Play counter
     its Leaders. A 1x1 picture in the page: no network, no refusal to remove it mid-measure. */
  const blink = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const p = { ...V.CAT.rows.find(q => !q.sealed && q.img), img: px };
    const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:0;top:0;width:120px;height:120px;z-index:9999'; document.body.appendChild(box);
    const op = () => { const i = box.querySelector('img'); return i ? getComputedStyle(i).opacity : 'none'; };
    /* its load event fired by hand: headless Chrome does not fetch a lazy picture drawn at opacity 0 (measured),
       and the handler under test is the page's own -- this is the event Chrome fires when the picture arrives */
    box.innerHTML = V.artBack(p); const cold = op(); box.querySelector('img').dispatchEvent(new Event('load')); await wait(500); const loaded = op();
    box.innerHTML = V.artBack(p); const again = op();   /* the repaint */
    (window.ART_OK || new Set()).delete(px); box.innerHTML = V.artBack(p); const forgot = op();   /* an older build has no memory: the check fails on its own */   /* the first push: drawn from nothing every time */
    box.remove(); return { cold, loaded, again, forgot };
  });
  ok('take 110 (the review): a picture that has loaded is drawn at once when its screen repaints, not faded in from nothing again', blink.loaded === '1' && blink.again === '1', JSON.stringify(blink));
  ok('take 110 (the review): ...control: a picture not loaded before starts from nothing', blink.cold === '0' && blink.forgot === '0', JSON.stringify(blink));
  /* ---- take 110 (A42): the Fold's inner screen, measured at 840 px -- two panes where two fit ---- */
  await page.setViewport({ width: 840, height: 757, deviceScaleFactor: 2 });
  const inner = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), R = e => e ? e.getBoundingClientRect() : null, out = {};
    V.MODE.set('collect', true); await wait(250);
    V.openDetail(V.CAT.rows.find(p => !p.sealed && p.img && p.market > 5).id); await wait(300); window.scrollTo(0, 0); await wait(60);
    const art = R(document.querySelector('#dArt')), pan = R(document.querySelector('#detail > .panel'));
    out.card = { w: Math.round(art.width), left: Math.round(art.left), besideLeft: Math.round(pan.left), besideTop: Math.round(pan.top), artBottom: Math.round(art.bottom) };
    V.go('home'); await wait(250); if (!V.OWN.items.length) { V.CAT.rows.filter(p => !p.sealed && p.market > 20).slice(0, 3).forEach(p => V.OWN.add(p.id, { qty: 1 })); V.go('home'); await wait(250); }
    const mv = R(document.getElementById('topList').closest('.panel')), sc = R(document.getElementById('setDone').closest('.panel'));
    out.home = { mvTop: Math.round(mv.top), scTop: Math.round(sc.top), mvLeft: Math.round(mv.left), scLeft: Math.round(sc.left) };
    V.go('search'); await wait(150); document.querySelector('#allq').value = 'nami'; V.paintSearch(); await wait(200);
    const rows = [...document.querySelectorAll('#allRes .row')].slice(0, 2).map(R);
    out.search = rows.length === 2 ? { sameLine: Math.abs(rows[0].top - rows[1].top) < 2, apart: Math.round(rows[1].left - rows[0].left) } : null;
    V.MODE.set('hunt', true); await wait(250); V.go('releases'); await wait(250); while (V.closeAnyOverlay()) {}
    const rels = [...document.querySelectorAll('#relList .rel')].slice(0, 2).map(R);
    out.releases = rels.length === 2 ? { sameLine: Math.abs(rels[0].top - rels[1].top) < 2 } : null;
    V.MODE.set('collect', true); await wait(250); V.go('home'); return out; });
  ok('take 110: the open Fold, a card\'s page -- the card 300 px on the left, its page beside it', inner.card.w === 300 && inner.card.left < 40 && inner.card.besideLeft > inner.card.left + inner.card.w && inner.card.besideTop < inner.card.artBottom, JSON.stringify(inner.card));
  ok('take 110: ...Home\'s Most valuable and Set completion side by side', inner.home.mvTop === inner.home.scTop && inner.home.scLeft > inner.home.mvLeft + 100, JSON.stringify(inner.home));
  ok('take 110: ...Search\'s and Releases\' rows two to a line', !!inner.search && inner.search.sameLine && inner.search.apart > 300 && !!inner.releases && inner.releases.sameLine, JSON.stringify([inner.search, inner.releases]));
  /* take 110's review: a heading, a note or an empty state spans both columns -- Market movers' heading had
     taken half its line beside the first mover, and Decks' empty state the left column alone */
  const spans = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), W = e => e ? Math.round(e.getBoundingClientRect().width) : 0;
    const read = async () => {
      V.MODE.set('collect', true); await wait(200); document.querySelector('#allq').value = ''; document.querySelector('[data-act="movers"]').click(); await wait(250);
      const mp = document.querySelector('#allRes > .panel'), mh = mp && mp.querySelector(':scope > h3'), o = { h3: W(mh), panel: mp ? mp.clientWidth : 0 };
      V.MODE.set('play', true); await wait(200); const keep = V.DECKS.list.slice(); V.DECKS.list.length = 0; V.go('decks'); V.paintDecks(); await wait(150);
      o.empty = W(document.querySelector('#dkList > .empty')); o.list = W(document.querySelector('#dkList'));
      V.DECKS.list.push(...keep); V.paintDecks(); return o; };
    const clean = await read();
    const st = document.createElement('style'); st.textContent = '#allRes > .panel > :not(.row),#dkList > :not(.panel){grid-column:auto!important}'; document.head.appendChild(st);
    const control = await read(); st.remove();
    V.MODE.set('collect', true); await wait(200); V.go('home'); return { clean, control };
  });
  ok('take 110 (the review): ...Market movers\' heading and Decks\' empty state span both columns', spans.clean.h3 > 0.8 * spans.clean.panel && spans.clean.empty > 0 && spans.clean.empty >= spans.clean.list - 1, JSON.stringify(spans.clean));
  ok('take 110 (the review): ...control: without the span each takes one column', spans.control.h3 > 0 && spans.control.h3 < 0.6 * spans.control.panel && spans.control.empty < 0.6 * spans.control.list, JSON.stringify(spans.control));
  /* take 110's review: what the first push got wrong on the open Fold, measured at 840 px */
  const fold2 = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), W = e => e ? Math.round(e.getBoundingClientRect().width) : 0, o = {};
    const run = async () => { const r = {};
      V.MODE.set('collect', true); await wait(200); V.openDetail(V.CAT.rows.find(p => !p.sealed && p.img && p.market > 1).id); await wait(250);
      r.buy = getComputedStyle(document.getElementById('dBuy')).display;
      /* the line's words, not its box: a block beside a float starts under it and only its lines move aside */
      const bk = document.getElementById('dBack').getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(document.getElementById('dSub'));
      const tx = rg.getClientRects()[0]; r.artRight = Math.round(bk.right); r.subLeft = tx ? Math.round(tx.left) : -1;
      V.go('home'); await wait(200); V.setHomeTab(true); await wait(150); r.mv = W(document.getElementById('topList').closest('.panel')); r.home = W(document.getElementById('home')); V.setHomeTab(false);
      V.MODE.set('hunt', true); await wait(200); const zip = V.HUNT.zip; V.HUNT.zip = ''; V.go('local'); V.paintLocal(); await wait(150); r.local = W(document.querySelector('#localList > .panel')); r.localW = W(document.getElementById('localList'));
      V.go('events'); V.paintEvents(); await wait(150); r.events = W(document.querySelector('#eventsList > .panel')); r.eventsW = W(document.getElementById('eventsList')); V.HUNT.zip = zip;
      V.MODE.set('collect', true); await wait(200); V.go('home'); return r; };
    o.clean = await run();
    const st = document.createElement('style'); st.textContent = '#detail > .panel{display:flow-root}#detail .artbg.dback{right:0!important;width:auto!important}#home.perf.screen.on > .panel:has(#topList){grid-column:auto!important}'
      + '#localList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}#eventsList > .panel{grid-column:auto!important}'; document.head.appendChild(st);
    o.control = await run(); st.remove(); return o; });
  const f2ok = r => r.buy === 'none' && r.artRight <= r.subLeft && r.mv > 0.8 * r.home && r.local > 0.9 * r.localW && r.events > 0.9 * r.eventsW;
  ok('take 110 (the review): the open Fold keeps a hidden panel hidden, the art behind the card\'s column, Most valuable across on Performance, Local and a lone Events panel full width', f2ok(fold2.clean), JSON.stringify(fold2.clean));
  ok('take 110 (the review): ...control: each of the first push\'s rules fails it', fold2.control.buy !== 'none' && fold2.control.artRight > fold2.control.subLeft && fold2.control.mv < 0.6 * fold2.control.home && fold2.control.local < 0.6 * fold2.control.localW && fold2.control.events < 0.6 * fold2.control.eventsW, JSON.stringify(fold2.control));
  /* words over the art, measured from pixels (the review's method): the words made transparent, the page shot,
     the ground under them read back -- the darkest tenth of the samples. A yellow card is the worst ground. */
  const groundContrast = async sel => {
    const r = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return null;
      const rg = document.createRange(); rg.selectNodeContents(el);
      const rs = [...rg.getClientRects()].filter(q => q.width > 2 && q.height > 2).map(q => ({ x: q.left, y: q.top, w: q.width, h: q.height }));
      const col = getComputedStyle(el).color; el.dataset.keepStyle = el.getAttribute('style') || '';
      for (const c of [el, ...el.querySelectorAll('*')]) { c.style.setProperty('color', 'transparent', 'important'); c.style.setProperty('text-shadow', 'none', 'important'); }
      return { rs, col }; }, sel);
    if (!r || !r.rs.length) return null;
    await new Promise(res => setTimeout(res, 60));
    const b64 = await page.screenshot({ type: 'png', encoding: 'base64' });
    return page.evaluate(async (b64, r, sel) => {
      const el = document.querySelector(sel); el.setAttribute('style', el.dataset.keepStyle); el.querySelectorAll('*').forEach(c => { c.style.removeProperty('color'); c.style.removeProperty('text-shadow'); });
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const cv = new OffscreenCanvas(im.naturalWidth, im.naturalHeight), x = cv.getContext('2d'); x.drawImage(im, 0, 0);
      const k = im.naturalWidth / innerWidth, d = x.getImageData(0, 0, cv.width, cv.height).data;
      const lum = (a, b, c) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(a) + 0.7152 * f(b) + 0.0722 * f(c); };
      const m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(r.col), t = [+m[1], +m[2], +m[3]], ta = m[4] != null ? +m[4] : 1, out = [];
      for (const q of r.rs) for (let y = Math.max(0, Math.floor(q.y * k)); y < Math.min(cv.height, (q.y + q.h) * k); y += 2) for (let X = Math.max(0, Math.floor(q.x * k)); X < Math.min(cv.width, (q.x + q.w) * k); X += 3) {
        const i = (y * cv.width + X) * 4, g = [d[i], d[i + 1], d[i + 2]], f = t.map((v, j) => v * ta + g[j] * (1 - ta)), L1 = lum(...f), L2 = lum(...g);
        out.push((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)); }
      out.sort((a, b) => a - b); return out.length ? +out[Math.floor(0.1 * (out.length - 1))].toFixed(2) : null; }, b64, r, sel);
  };
  const yellowL = await page.evaluate(() => (window.VAULT.CAT.rows.find(x => x.type === 'Leader' && x.color === 'Yellow' && x.img && !x.sealed) || {}).id);
  const ink = async (css) => {
    const st = css ? await page.evaluate(c => { const s = document.createElement('style'); s.id = 'ink110'; s.textContent = c; document.head.appendChild(s); return true; }, css) : false;
    const o = {};
    await page.evaluate(async id => { const V = window.VAULT; V.MODE.set('collect', true); await new Promise(r => setTimeout(r, 200)); V.openDetail(id); window.scrollTo(0, 0); }, yellowL); await new Promise(r => setTimeout(r, 1200));
    o.sub = await groundContrast('#dSub');
    await page.evaluate(async id => { const V = window.VAULT; V.MODE.set('play', true); await new Promise(r => setTimeout(r, 200)); V.go('play');
      V.PLAY.hotseat = true; V.PLAY.p.forEach(p => { p.leader = id; }); V.paintPlay(); window.scrollTo(0, 0);
      const pn = document.querySelector('#plBoard .plpanel'); pn.querySelector('.plcols .note').id = 'ink110life'; pn.querySelector(':scope > div .note').id = 'ink110lead'; }, yellowL);
    await new Promise(r => setTimeout(r, 1200));
    o.life = await groundContrast('#ink110life'); o.lead = await groundContrast('#ink110lead');
    await page.evaluate(() => { const V = window.VAULT; V.PLAY.p.forEach(p => { p.leader = null; }); V.PLAY.hotseat = false; V.paintPlay(); V.MODE.set('collect', true); V.go('home'); const s = document.getElementById('ink110'); if (s) s.remove(); });
    return o; };
  const inkNow = await ink(''), inkThen = await ink('.plpanel > .artbg::after{background:linear-gradient(to bottom,rgba(0,0,0,.35),transparent 34%)!important}.plpanel .note{color:var(--dim2)!important}#detail .artbg.dback{right:0!important;width:auto!important;-webkit-mask-image:linear-gradient(#000 55%,transparent)!important;mask-image:linear-gradient(#000 55%,transparent)!important}');
  ok('take 110 (the review): words over a yellow card read at 4.5:1 or better -- a card\'s line beside it on the open Fold, the Play counter\'s labels over its Leader', !!yellowL && inkNow.sub >= 4.5 && inkNow.life >= 4.5 && inkNow.lead >= 4.5, JSON.stringify(inkNow));
  ok('take 110 (the review): ...control: the first push\'s ground measures under it', inkThen.sub < 4.5 && inkThen.life < 4.5, JSON.stringify(inkThen));
  /* a double tap on a sheet's button: the second tap lands on the scrim while the sheet rises */
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  const dbl = await page.evaluate(async () => { const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)); V.MODE.set('collect', true); await wait(200); V.go('search'); await wait(150);
    const f = document.getElementById('filters'); document.querySelector('#sortBtnAll').click(); await wait(60); f.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(20);
    const early = f.classList.contains('on'); await wait(450); f.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(20); const late = !f.classList.contains('on');
    while (V.closeAnyOverlay()) {} V.go('home'); return { early, late }; });
  ok('take 110 (the review): a tap on the scrim while a sheet rises leaves it open (a double tap had closed what it opened)', dbl.early, JSON.stringify(dbl));
  ok('take 110 (the review): ...control: the same tap once the sheet is up closes it', dbl.late, JSON.stringify(dbl));
  await page.setViewport({ width: 840, height: 757, deviceScaleFactor: 2 });
  const wideFold = [];
  for (const w of [700, 840, 899]) {
    await page.setViewport({ width: w, height: 757, deviceScaleFactor: 2 });
    wideFold.push(await page.evaluate(async w => { const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), o = { w }, side = () => document.documentElement.scrollWidth <= innerWidth + 0.5;
      V.MODE.set('collect', true); await wait(200); V.go('home'); await wait(150); o.home = side(); V.openDetail(V.CAT.rows.find(p => !p.sealed && p.img).id); await wait(200); o.detail = side();
      V.MODE.set('hunt', true); await wait(200); V.go('sealed'); await wait(200); while (V.closeAnyOverlay()) {} o.sealed = side(); V.go('releases'); await wait(150); o.releases = side();
      V.MODE.set('play', true); await wait(200); V.go('decks'); await wait(150); o.decks = side();
      V.MODE.set('collect', true); await wait(200); V.go('home'); return o; }, w));
  }
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  ok('take 110: the open Fold never scrolls sideways at 700, 840 or 899 px (Home, a card, Sealed, Releases, Decks)', wideFold.every(r => r.home && r.detail && r.sealed && r.releases && r.decks), JSON.stringify(wideFold));
  const phone = await page.evaluate(async () => { const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)); V.openDetail(V.CAT.rows.find(p => !p.sealed && p.img).id); await wait(250);
    const a = document.querySelector('#dArt').getBoundingClientRect(); const o = { w: Math.round(a.width), mid: Math.round(a.left + a.width / 2), vw: innerWidth }; V.go('home'); return o; });
  ok('take 110: ...and on the phone a card\'s page is as it was: the card centred at 196 px', phone.w === 196 && Math.abs(phone.mid - phone.vw / 2) <= 1, JSON.stringify(phone));

  /* ---- take 111 (A42): the last look, measured -- what the tour found, at the widths it found it ---- */
  const bulk111 = [];
  for (const w of [360, 411, 840]) {
    await page.setViewport({ width: w, height: w === 840 ? 757 : 915, deviceScaleFactor: 2 });
    bulk111.push(await page.evaluate(async w => {
      const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), R = e => e.getBoundingClientRect();
      const read = () => {
        const bar = document.getElementById('bulkBar'), br = R(bar), n = R(document.getElementById('bulkN').closest('.nm'));
        const bs = [...bar.querySelectorAll('button')].filter(b => b.offsetParent);
        return { w, n: bs.length, side: document.documentElement.scrollWidth <= innerWidth + 0.5,
          inside: bs.every(b => { const r = R(b); return r.left >= br.left - 0.5 && r.right <= br.right + 0.5; }),
          clear: bs.every(b => { const r = R(b); return r.right <= n.left + 0.5 || r.left >= n.right - 0.5 || r.bottom <= n.top + 0.5 || r.top >= n.bottom - 0.5; }),
          whole: bs.every(b => b.scrollWidth <= b.clientWidth + 1), lines: new Set(bs.map(b => Math.round(R(b).top))).size }; };
      V.MODE.set('collect', true); await wait(200);
      if (V.OWN.items.length < 2) V.CAT.rows.filter(p => !p.sealed && p.img && p.market > 1).slice(0, 3).forEach(p => V.OWN.add(p.id, { condition: 'NM' }));
      V.go('collection'); await wait(150); document.querySelector('[data-act="bulk"]').click(); await wait(150);
      document.querySelector('#colGrid [data-open]').click(); await wait(150);
      const clean = read(), row = document.querySelector('#bulkBar .row');
      row.classList.remove('bulkrow'); await wait(60); const control = read(); row.classList.add('bulkrow');
      document.getElementById('bulkX').click(); await wait(100); V.go('home'); return { clean, control }; }, w));
  }
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  const bulkOk = r => r.n === 4 && r.side && r.inside && r.clear && r.whole;
  ok('take 111: the bulk bar fits a 360 and a 411 px phone -- the count and Done, then the three actions, every button whole and none over the count',
     bulk111.slice(0, 2).every(x => bulkOk(x.clean) && x.clean.lines === 2), JSON.stringify(bulk111.map(x => x.clean)));
  ok('take 111: ...and on the open Fold (840 px) it is one line', bulkOk(bulk111[2].clean) && bulk111[2].clean.lines === 1, JSON.stringify(bulk111[2].clean));
  ok('take 111: ...control: take 110\'s bar, four buttons in the row, runs off or covers the count on a phone', bulk111.slice(0, 2).every(x => !(x.control.inside && x.control.clear && x.control.whole)), JSON.stringify(bulk111.slice(0, 2).map(x => x.control)));
  const mid111 = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    const read = sel => [...document.querySelectorAll(sel)].filter(r => r.offsetParent).slice(0, 8).map(r => { const p = r.querySelector(':scope > .pic').getBoundingClientRect(), n = r.querySelector(':scope > .nm').getBoundingClientRect();
      return Math.round(Math.abs((p.top + p.bottom) / 2 - (n.top + n.bottom) / 2)); });
    const both = () => ({ sealed: read('#sealedList .row:has(> .pic)'), rel: [] });
    V.MODE.set('hunt', true); await wait(200); V.go('sealed'); await wait(250); while (V.closeAnyOverlay()) {}
    const clean = both(); V.go('releases'); await wait(200); clean.rel = read('#relList .row:has(> .pic)');
    const st = document.createElement('style'); st.textContent = '.row:has(> .pic){align-items:baseline!important}'; document.head.appendChild(st); await wait(60);
    const control = { rel: read('#relList .row:has(> .pic)') }; V.go('sealed'); await wait(200); while (V.closeAnyOverlay()) {} control.sealed = read('#sealedList .row:has(> .pic)'); st.remove();
    V.MODE.set('collect', true); await wait(200); V.go('home'); return { clean, control }; });
  ok('take 111: a row that leads with a picture has it centred on its words, within 2 px (Sealed, Releases)', mid111.clean.sealed.length > 0 && mid111.clean.rel.length > 0 && [...mid111.clean.sealed, ...mid111.clean.rel].every(d => d <= 2), JSON.stringify(mid111.clean));
  ok('take 111: ...control: take 110\'s baseline puts the picture\'s foot on the first line, well off the middle', [...mid111.control.sealed, ...mid111.control.rel].some(d => d > 6), JSON.stringify(mid111.control));
  await page.setViewport({ width: 360, height: 915, deviceScaleFactor: 2 });
  const al111 = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), keep = V.ALERTS.list;
    const p = V.CAT.rows.find(x => !x.sealed && x.num && x.market > 100);
    V.ALERTS.list = []; const a = V.ALERTS.add(p.id, 'below', 1234.56); a.fired = { at: '2026-09-23T10:00:00Z', price: 1111.11 }; a.armed = false;
    V.MODE.set('collect', true); await wait(200); V.go('wants'); await wait(200);
    const sp = document.querySelector('#alRows .dkrow .n > span'), o = { cut: sp.scrollWidth > sp.clientWidth + 1, h: Math.round(sp.getBoundingClientRect().height), lh: parseFloat(getComputedStyle(sp).lineHeight) || 16 };
    sp.style.whiteSpace = 'nowrap'; o.controlCut = sp.scrollWidth > sp.clientWidth + 1;
    V.ALERTS.list = keep; V.go('home'); return o; });
  ok('take 111: an alert\'s line wraps on a 360 px phone, all of it read, where it was cut at "fired Sep 23 at …"', !al111.cut && al111.h > 1.5 * al111.lh, JSON.stringify(al111));
  ok('take 111: ...control: on one line, as it was, it is cut', al111.controlCut, JSON.stringify(al111));
  const ph111 = [];
  for (const w of [360, 411]) {
    await page.setViewport({ width: w, height: 915, deviceScaleFactor: 2 });
    ph111.push(await page.evaluate(async w => {
      const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
      V.MODE.set('play', true); await wait(200);
      const d = { id: 'r111', name: 'Render 111', leader: V.CAT.rows.find(p => p.type === 'Leader' && p.img).id, cards: [], created: 1 };
      V.DECKS.list.push(d); V.openDeck('r111'); await wait(250);
      const inp = document.getElementById('dkq'), cs = getComputedStyle(inp), cx = document.createElement('canvas').getContext('2d');
      cx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const o = { w, box: Math.round(inp.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)), now: Math.round(cx.measureText(inp.placeholder).width), then: Math.round(cx.measureText('Add cards — search the catalogue').width) };
      V.DECKS.list.splice(V.DECKS.list.indexOf(d), 1); V.MODE.set('collect', true); await wait(200); V.go('home'); return o; }, w));
  }
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  ok('take 111: a deck\'s search box shows the whole of its prompt at 360 and 411 px', ph111.every(r => r.now > 0 && r.now <= r.box), JSON.stringify(ph111));
  ok('take 111: ...control: take 110\'s prompt did not fit at either', ph111.every(r => r.then > r.box), JSON.stringify(ph111));
  const sc111 = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    V.MODE.set('collect', true); await wait(200); V.go('scan'); await wait(300);
    const u = document.getElementById('scanCredits'), pad = parseFloat(getComputedStyle(u).getPropertyValue('--pad')), r = u.getBoundingClientRect();
    const o = { shown: !!u.offsetParent, pad, left: Math.round(r.left), right: Math.round(innerWidth - r.right) };
    const st = document.createElement('style'); st.textContent = '#scan .unlim{margin-left:0!important;margin-right:0!important}'; document.head.appendChild(st);
    const r2 = u.getBoundingClientRect(); o.cLeft = Math.round(r2.left); o.cRight = Math.round(innerWidth - r2.right); st.remove();
    V.go('home'); return o; });
  ok('take 111: Scan\'s note under the camera keeps the page\'s side margins (16 px), where the camera runs edge to edge', sc111.shown && sc111.pad === 16 && sc111.left >= 16 && sc111.right >= 16, JSON.stringify(sc111));
  ok('take 111: ...control: without the rule it touches both edges', sc111.cLeft === 0 && sc111.cRight === 0, JSON.stringify(sc111));
  /* the second pass of the look: a printing's badge is never cut, and the Sealed bell sits on its row */
  const badge111 = [];
  for (const w of [360, 411]) {
    await page.setViewport({ width: w, height: 915, deviceScaleFactor: 2 });
    badge111.push(await page.evaluate(async w => {
      const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
      const read = () => [...document.querySelectorAll('#allRes .row .nm > b')].filter(b => b.querySelector(':scope > .badge')).map(b => {
        const r = b.getBoundingClientRect(), g = b.querySelector(':scope > .badge').getBoundingClientRect();
        return g.right <= r.right + 0.5 && g.bottom <= r.bottom + 0.5 && b.scrollWidth <= b.clientWidth + 1; });
      V.MODE.set('collect', true); await wait(200); V.go('search'); const q = document.querySelector('#allq'); q.value = 'zoro'; V.paintSearch(); await wait(250);
      const clean = read(); const st = document.createElement('style'); st.textContent = '.row .nm b:has(> .badge){white-space:nowrap!important}'; document.head.appendChild(st); await wait(60);
      const control = read(); st.remove(); q.value = ''; V.paintSearch(); V.go('home'); return { w, clean, control }; }, w));
  }
  /* 411 px is borderline: "Roronoa Zoro Alternate Art" fits here with 6 px to spare and was cut in the look's
     Chromium -- font metrics decide it, so the rule holds at both widths and the control is read at 360 */
  ok('take 111: at 360 and 411 px every printing\'s badge in the search rows is whole -- a name that carries one wraps', badge111.every(x => x.clean.length >= 4 && x.clean.every(Boolean)), JSON.stringify(badge111.map(x => x.clean)));
  ok('take 111: ...control: on one line, as it was, the ellipsis cuts some at 360 ("Roronoa Zoro ..." hid "Alternate Art" in the look at 411)', badge111[0].control.some(x => !x), JSON.stringify(badge111[0].control));
  const bell111 = await page.evaluate(async () => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    const read = () => [...document.querySelectorAll('#sealedList [data-stock]')].filter(b => b.offsetParent).slice(0, 6).map(b => {
      const row = b.parentElement.querySelector(':scope > .row').getBoundingClientRect(), r = b.getBoundingClientRect();
      return Math.round(Math.abs((r.top + r.bottom) / 2 - (row.top + row.bottom) / 2)); });
    V.MODE.set('hunt', true); await wait(200); V.go('sealed'); await wait(250); while (V.closeAnyOverlay()) {}
    const clean = read(); const st = document.createElement('style'); st.textContent = '#sealedList .row:has(> [data-stock]){align-items:baseline!important}'; document.head.appendChild(st); await wait(60);
    const control = read(); st.remove(); V.MODE.set('collect', true); await wait(200); V.go('home'); return { clean, control }; });
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  ok('take 111: a Sealed row\'s bell sits on the middle of its row, within 2 px (it hung from the picture\'s foot once the picture was centred)', bell111.clean.length > 0 && bell111.clean.every(d => d <= 2), JSON.stringify(bell111.clean));
  ok('take 111: ...control: the outer row on its baseline puts it well off', bell111.control.some(d => d > 6), JSON.stringify(bell111.control));

  /* ---- take 112 (A32): the second distributor on screen, at the owner's word -- one short line per distributor,
     inside its row and a 44 px target at 360 px; a tap on it lands on the product's Distributor info, open ---- */
  const fx112 = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-112-')), 'feed-fixture.json');   // hunt.py names its sidecars from "feed" (it refuses any other name since take 112)
  execSync(`python3 tools/hunt.py --from-fixtures --out ${fx112}`, { cwd: ROOT, stdio: 'pipe' });
  const feed112 = JSON.parse(fs.readFileSync(fx112, 'utf8'));
  await page.setViewport({ width: 360, height: 915, deviceScaleFactor: 2 });
  const sh112 = await page.evaluate(async F => {
    const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    const read = (sel) => { const lines = [...document.querySelectorAll(sel)];
      return { n: lines.length, sh: lines.filter(s => /^Southern Hobby · /.test(s.textContent.trim())).length, side: document.documentElement.scrollWidth <= innerWidth + 0.5,
        inside: lines.every(s => { const r = s.getBoundingClientRect(), row = s.closest('.row').getBoundingClientRect(); return r.left >= row.left - 0.5 && r.right <= row.right + 0.5 && s.scrollWidth <= s.clientWidth + 1; }),
        tall: lines.every(s => !s.classList.contains('dline') || s.getBoundingClientRect().height >= 44) }; };
    /* the fixture feed is set again in the same tick as each paint: entering Hunt syncs the served feed, which lands
       after the first await and would otherwise replace it (landmine 166) */
    V.HUNT.setZip(''); V.MODE.set('hunt', true); await wait(200); V.HUNT.feed = F; V.DISTF.open.clear();
    for (const id of Object.keys(V.HUNT.distByCatalogId())) { const p = V.CAT.byId.get(+id); if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } }
    while (V.closeAnyOverlay()) {}
    V.go('sealed'); V.HUNT.feed = F; V.paintSealed(); const sealed = read('#sealedList .dline');
    V.go('releases'); V.HUNT.feed = F; V.paintReleases(); const rel = read('#relList [data-browse-set] .nm > span[style*="display:block"]');
    V.go('sealed'); V.HUNT.feed = F; V.paintSealed();
    const st = document.createElement('style'); st.textContent = '.dline{min-height:0!important}'; document.head.appendChild(st);
    const control = read('#sealedList .dline'); st.remove();
    return { sealed, rel, control }; }, feed112);
  ok('take 112: at 360 px each distributor is one short line inside its row -- a 44 px target on Sealed -- and neither Sealed nor Releases scrolls sideways',
     sh112.sealed.sh > 0 && sh112.rel.sh > 0 && sh112.sealed.inside && sh112.rel.inside && sh112.sealed.tall && sh112.sealed.side && sh112.rel.side, JSON.stringify(sh112));
  ok('take 112: ...control: a line let shrink below 44 px is caught', sh112.control.n > 0 && !sh112.control.tall, JSON.stringify(sh112.control));
  /* the tap: a real click on a Sealed row's distributor line, then on the same row */
  await page.evaluate(() => { const ls = [...document.querySelectorAll('#sealedList .dline')].filter(s => /^Southern Hobby · /.test(s.textContent.trim()));
    const l = ls.find(s => s.closest('.row').querySelectorAll('.dline').length > 1) || ls[0]; if (l) l.setAttribute('data-probe', '1'); });   /* the booster box's row, as the look taps it */
  await tap('#sealedList .dline[data-probe="1"]'); await new Promise(r => setTimeout(r, 300));
  const land = await page.evaluate(() => { const d = document.getElementById('dDist'), f = d && d.querySelector('[data-distfold="detail"]'), bar = document.querySelector('.modebar').getBoundingClientRect();
    if (!d) return { on: 'no #dDist' }; const t = d.getBoundingClientRect().top; return { on: [...document.querySelectorAll('.screen.on')].map(e => e.id).join(), open: !!f && f.getAttribute('aria-expanded') === 'true', names: [...d.querySelectorAll('.dsec .nm b')].map(b => b.textContent).join(), top: Math.round(t), bar: Math.round(Math.max(0, bar.bottom)), vh: innerHeight, links: d.querySelectorAll('.dsec a.ghost[target="_blank"]').length }; });
  ok('take 112: a tap on a row\'s distributor line opens its page at Distributor info -- open, clear of the mode bar and on screen, each distributor with its own page to open',
     land.on === 'detail' && land.open && /Southern Hobby/.test(land.names) && land.top >= land.bar - 1 && land.top < land.vh * 0.6 && land.links === land.names.split(',').length, JSON.stringify({ ...land, taps: tapNotes }));
  await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.NAV.back(); });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => { const V = window.VAULT; V.go('sealed'); V.paintSealed(); const l = document.querySelector('#sealedList .dline[data-open]'); const row = l && document.querySelector(`#sealedList button.row[data-open="${l.dataset.open}"]`); if (row) row.setAttribute('data-probe', '2'); });
  await tap('#sealedList button.row[data-probe="2"]'); await new Promise(r => setTimeout(r, 300));
  const plain = await page.evaluate(() => { const d = document.getElementById('dDist'), f = d && d.querySelector('[data-distfold="detail"]'); if (!f) return { on: 'no Distributor info' }; return { on: [...document.querySelectorAll('.screen.on')].map(e => e.id).join(), open: !!f && f.getAttribute('aria-expanded') === 'true', y: Math.round(scrollY) }; });
  ok('take 112: ...control: a tap on the row itself opens the same page at its top, Distributor info closed', plain.on === 'detail' && !plain.open && plain.y === 0, JSON.stringify({ ...plain, taps: tapNotes }));
  /* a day on a short line never breaks -- the look at 411 px had EB05's "orders closed May" / "17" beside its date column */
  const dayw = await page.evaluate(async F => { const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
    while (V.closeAnyOverlay()) {} V.go('releases'); V.HUNT.feed = F; V.DISTF.open.clear(); V.paintReleases(); await wait(100);
    const spans = [...document.querySelectorAll('#relList [data-browse-set] .nm > span[style*="display:block"]')];
    const lines = sp => { const n = sp.firstChild; if (!n || n.nodeType !== 3) return 0; const m = n.data.match(/[A-Z][a-z]{2}[\u00a0 ]\d{1,2}(,[\u00a0 ]\d{4})?$/); if (!m) return 0;
      const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, n.data.length); return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size; };
    const natural = spans.map(lines).filter(Boolean);
    /* whether a day CAN break is read in a column too narrow for it: joined, it stays one line; spaced, it splits */
    const st = document.createElement('style'); st.textContent = '#relList [data-browse-set] .nm > span[style*="display:block"]{width:1px!important}';   /* 3.5em held "May 17" whole either way (42 px of 43.75) */ document.head.appendChild(st);
    const narrow = spans.map(lines).filter(Boolean);
    for (const sp of spans) if (sp.firstChild && sp.firstChild.nodeType === 3) sp.firstChild.data = sp.firstChild.data.replace(/\u00a0/g, ' ');
    const control = spans.map(lines).filter(Boolean); st.remove(); V.paintReleases();
    return { days: natural.length, natural: Math.max(0, ...natural), narrow: Math.max(0, ...narrow), control: Math.max(0, ...control) }; }, feed112);
  ok('take 112: every day on a Releases short line stays on one line -- at 360 px, and even in a column narrower than the day', dayw.days > 0 && dayw.natural === 1 && dayw.narrow === 1, JSON.stringify(dayw));
  ok('take 112: ...control: spaced like any words, a day in that column splits across lines', dayw.control >= 2, JSON.stringify(dayw));
  await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.feed = null; V.DISTF.open.clear(); V.MODE.set('collect', true); V.go('home'); });
  await new Promise(r => setTimeout(r, 200));
  fs.rmSync(path.dirname(fx112), { recursive: true, force: true });
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  /* take 112: a product with no photo yet -- every new one; the look found DP-13's display, refused by the host -- shows
     its set's code on the row tile's ground in its sheet, where an empty white frame stood; white stays under a photo */
  const noPic = await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {}
    const p = V.CAT.rows.find(x => V.SEALED.isProduct(x) && x.img && (V.CAT.sets.get(x.set) || {}).abbr);
    V.openDetail(p.id); const art = document.querySelector('#dArt');
    art.querySelectorAll('img.ref').forEach(i => i.remove());   /* what a refusal leaves: both sizes failed and the img removed itself */
    const cs = getComputedStyle(art), ph = art.querySelector('.ph'), lbl = art.querySelector('.phl'), lr = lbl && lbl.getBoundingClientRect(), ar = art.getBoundingClientRect();
    const empty = { bg: cs.backgroundColor, img: cs.backgroundImage.slice(0, 16), label: lbl ? lbl.textContent : '', shown: !!ph && getComputedStyle(ph).display !== 'none' && !!lr && lr.width > 0 && lr.left >= ar.left && lr.right <= ar.right };
    const im = document.createElement('img'); im.className = 'ref ok'; art.appendChild(im);
    const photo = { bg: getComputedStyle(art).backgroundColor, img: getComputedStyle(art).backgroundImage };
    im.remove(); while (V.closeAnyOverlay()) {}
    return { empty, photo, code: (V.CAT.sets.get(p.set).abbr || '').replace(/-/g, '').slice(0, 5) }; });
  ok('take 112: a product with no photo yet shows its set\'s code on the row tile\'s ground in its sheet, not an empty white frame',
     /gradient/.test(noPic.empty.img) && noPic.empty.bg !== 'rgb(255, 255, 255)' && noPic.empty.shown && noPic.empty.label === noPic.code && noPic.code.length > 0, JSON.stringify(noPic));
  ok('take 112: ...and a photo that arrived still sits on white (the take-109 look) -- the probe sees white when it is there', noPic.photo.bg === 'rgb(255, 255, 255)' && noPic.photo.img === 'none', JSON.stringify(noPic.photo));
  /* take 112: the Diagnostics report at the cover width -- the feed's address ran past the panel's edge (the look, 411 px) */
  await page.setViewport({ width: 411, height: 960, deviceScaleFactor: 2 });
  const diag112 = await page.evaluate(async () => { const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)); while (V.closeAnyOverlay()) {}
    const probe = V.DIAG.probe; V.DIAG.probe = async () => 'not probed here'; V.go('diag'); await wait(150); await V.DIAG.report().then(t => { document.getElementById('diagOut').textContent = t; });
    const pre = document.getElementById('diagOut'), clean = { sw: pre.scrollWidth, cw: pre.clientWidth, url: /feed url: https:\/\//.test(pre.textContent) };
    pre.style.overflowWrap = 'normal'; const control = { sw: pre.scrollWidth, cw: pre.clientWidth }; pre.style.overflowWrap = '';
    V.DIAG.probe = probe; V.go('home'); return { clean, control }; });
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
  ok('take 112: at 411 px every line of the Diagnostics report wraps inside its panel, the feed\'s address too', diag112.clean.url && diag112.clean.sw <= diag112.clean.cw + 1, JSON.stringify(diag112.clean));
  ok('take 112: ...control: without the break, the address runs past the panel', diag112.control.sw > diag112.control.cw + 1, JSON.stringify(diag112.control));

  /* ---- take 114 (A32): each distributor's history on file, under its row inside the open Distributor info -- at
     360 px, in the owner's zone (America/Detroit), in Chrome. The longest case: the fixture feed's own dates, which do
     not explain the calendar change, so both changes show their two checks and the fold carries its note ---- */
  { const dir114 = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-114-')), fx114 = path.join(dir114, 'feed-fixture.json');
    execSync(`python3 tools/hunt.py --from-fixtures --out ${fx114}`, { cwd: ROOT, stdio: 'pipe' });
    const F = JSON.parse(fs.readFileSync(fx114, 'utf8')), R0 = JSON.parse(fs.readFileSync(path.join(dir114, 'history-fixture.json'), 'utf8')).runs[0];
    /* the smoke's synthetic history, the same shape: 60 runs 4 h apart ending on the feed's own run, GTS from run 6,
       the box coming until the first UTC day turn at or after run 20, preorder until run 40, then sold out; the run
       before that could not reach GTS (a hole); Southern Hobby in the last two */
    const END = Date.parse(F.fetched_at), N = 60, G0 = 6, I2 = 40, runs = [];
    for (let k = N - 1; k >= 0; k--) runs.push({ t: new Date(END - k * 4 * 3600e3).toISOString().replace(/\.\d{3}Z$/, 'Z'), online: {}, shelf: {} });
    let I1 = 20; while (runs[I1].t.slice(0, 10) === runs[I1 - 1].t.slice(0, 10)) I1++;
    runs.forEach((r, i) => { if (i >= G0) r.gts = { ...R0.gts, BJP2873812: i < I1 ? 'coming' : i < I2 ? 'preorder' : 'sold_out' }; if (i >= N - 2) r.southern = { ...R0.southern }; });
    delete runs[I2 - 1].gts;
    const H = { runs, since: runs[0].t, stores: {}, titles: {} }, PID = F.sources.gts.items.find(i => i.sku === 'BJP2873812').catalog_id;
    const AFTER = runs[I2 - 2].t;   /* the site change's earlier check: the last run that read GTS before the hole */
    await page.setViewport({ width: 360, height: 915, deviceScaleFactor: 2 });
    await page.emulateTimezone('America/Detroit');
    /* what a check reads: the history blocks, the take-112 words above them, and every day and moment in either on
       one line -- a Range over each, its client rects' distinct tops (the take-112 probe, taken to the long words) */
    await page.evaluate(() => { window.__tl114 = () => {
      const d = document.getElementById('dDist'); if (!d) return { on: 'no #dDist', open: false, n: 0, ds: '', inside: false, between: 0, note: false, box: false, page: false, days: [0, 0], breaks: [0, 0], names: '', links: 0 };
      const db = d.getBoundingClientRect(), tls = [...d.querySelectorAll('.dtl')], nms = [...d.querySelectorAll('.dsec .nm > span')], f = d.querySelector('[data-distfold="detail"]');
      const RE = /[A-Z][a-z]{2}[\u00a0 ]\d{1,2}(,[\u00a0 ]\d{4})?(,[\u00a0 ]\d{1,2}:\d\d[\u00a0\u202f ][AP]M)?|\d{1,2}:\d\d[\u00a0\u202f ][AP]M/g;
      const lines = els => { let n = 0, worst = 0; for (const el of els) { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let t = w.nextNode(); t; t = w.nextNode()) for (const m of t.data.matchAll(RE)) { const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length);
          n++; worst = Math.max(worst, new Set([...r.getClientRects()].map(x => Math.round(x.top))).size); } } return { n, worst }; };
      const name = { gts: 'GTS Distribution', southern: 'Southern Hobby' }, L = lines(tls), S = lines(nms);
      const note = [...d.querySelectorAll('.note')].find(e => /^Where a change worked out from its dates gives two checks, not a day/.test(e.textContent.trim())), nb = note && note.getBoundingClientRect();
      return { on: [...document.querySelectorAll('.screen.on')].map(e => e.id).join(), open: !!f && f.getAttribute('aria-expanded') === 'true', n: tls.length, ds: tls.map(t => t.dataset.tl).join(),
        inside: tls.length > 0 && tls.every(t => { const b = t.getBoundingClientRect(), sec = t.parentElement, row = t.previousElementSibling;
          return !!sec && sec.classList.contains('dsec') && !!row && row.classList.contains('row') && b.height > 0 && b.left >= db.left - 0.5 && b.right <= db.right + 0.5
            && b.top >= row.getBoundingClientRect().bottom - 0.5 && (sec.querySelector('.nm b') || {}).textContent === name[t.dataset.tl]; }),
        between: tls.reduce((a, t) => a + [...t.children].filter(s => / · between /.test(s.textContent)).length, 0),
        note: !!note && nb.height > 0 && nb.left >= db.left - 0.5 && nb.right <= db.right + 0.5,
        box: tls.some(t => t.scrollWidth > t.clientWidth + 1), page: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        days: [L.n, S.n], breaks: [L.worst, S.worst],
        names: [...d.querySelectorAll('.dsec .nm b')].map(b => b.textContent).join(), links: d.querySelectorAll('.dsec a.ghost[target="_blank"]').length }; }; });
    /* the fixture and the history set in the same tick as the paint (landmine 166) */
    const at114 = await page.evaluate(async ({ F, H, PID, AFTER }) => { const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms));
      V.NAV.zipAsked = true; while (V.closeAnyOverlay()) {} V.HUNT.setZip(''); V.MODE.set('hunt', true); await wait(200); while (V.closeAnyOverlay()) {}
      V.HUNT.feed = F; V.HUNT.hist = H; V.DISTF.open.clear(); V.openDetail(PID, { dist: true });
      if (V.distHistTap) { V.distHistTap('gts'); V.distHistTap('southern'); }   /* each history is tucked away until tapped (the owner's answer): opened to measure */
      await wait(150);
      const g = document.querySelector('#dDist .dtl[data-tl="gts"]'), sp = s => String(s).replace(/[\u00a0\u202f]/g, ' '), txt = sp(g ? g.textContent : ''), at = new Date(AFTER);
      const o = { month: 'short', day: 'numeric', ...(at.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}), hour: 'numeric', minute: '2-digit' };
      const local = V.momentText(AFTER), utc = at.toLocaleString('en-US', { ...o, timeZone: 'UTC' });
      return { ...window.__tl114(), tz: { zone: Intl.DateTimeFormat().resolvedOptions().timeZone, local, utc, has: !!g && txt.includes(sp(local)), hasUtc: txt.includes(sp(utc)) } }; }, { F, H, PID, AFTER });
    const { tz: tz114, ...land114 } = at114;
    ok('take 114: a product\'s page at Distributor info draws each distributor\'s history under its own row at 360 px -- inside the panel, no sideways scroll, every day and moment on one line there and in the words above it; both changes as their two checks, the fold\'s note; the take-112 names and links unchanged',
       land114.on === 'detail' && land114.open && land114.n === 2 && land114.ds === 'gts,southern' && land114.inside && !land114.box && !land114.page && land114.days[0] > 0 && land114.days[1] > 0
       && land114.breaks[0] === 1 && land114.breaks[1] === 1 && land114.between === 2 && land114.note && land114.names === 'GTS Distribution,Southern Hobby' && land114.links === 2, JSON.stringify(land114));
    const ctl114 = await page.evaluate(() => { const d = document.getElementById('dDist') || document.createElement('div'), tls = [...d.querySelectorAll('.dtl')], add = css => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); return st; };
      const st = add('#dDist .dtl{white-space:nowrap}'), nowrap = tls.length > 0 && tls.every(t => getComputedStyle(t).whiteSpace === 'nowrap'), held = window.__tl114(); st.remove();
      /* a column narrower than any day: an inline span takes no width, so the words above are made blocks for it */
      const st2 = add('#dDist .dtl > span, #dDist .dsec .nm > span{display:block!important;width:1px!important}'), col = [...d.querySelectorAll('.dtl > span, .dsec .nm > span')];
      const landed = col.length > 0 && col.every(s => s.getBoundingClientRect().width <= 1.5), narrow = window.__tl114();
      for (const el of d.querySelectorAll('.dtl, .dsec .nm > span')) { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) n.data = n.data.replace(/[\u00a0\u202f]/g, ' '); }
      const spaced = window.__tl114(); st2.remove();
      return { nowrap, box: held.box, page: held.page, landed, narrow: { days: narrow.days, breaks: narrow.breaks }, spaced: { days: spaced.days, breaks: spaced.breaks } }; });
    ok('take 114: ...in a column narrower than any day (1 px, which landed), each day and moment still holds on one line, in the history and in the words above it',
       ctl114.landed && ctl114.narrow.days[0] > 0 && ctl114.narrow.days[1] > 0 && ctl114.narrow.breaks[0] === 1 && ctl114.narrow.breaks[1] === 1, JSON.stringify(ctl114));
    ok('take 114: ...control: held on one line (nowrap, which landed), the history runs past its block and the page scrolls sideways; spaced like any words, a day in that column splits, in both',
       ctl114.nowrap && ctl114.box && ctl114.page && ctl114.landed && ctl114.spaced.breaks[0] >= 2 && ctl114.spaced.breaks[1] >= 2, JSON.stringify(ctl114));
    ok('take 114: the history reads in this phone\'s time (the zone America/Detroit, which landed): the site change\'s earlier check in local time, not in the runner\'s UTC',
       tz114.zone === 'America/Detroit' && tz114.has && !tz114.hasUtc, JSON.stringify(tz114));
    ok('take 114: ...control: that instant in UTC reads otherwise, so the check can tell them apart', !!tz114.local && tz114.local.replace(/[\u00a0\u202f]/g, ' ') !== tz114.utc.replace(/[\u00a0\u202f]/g, ' '), JSON.stringify(tz114));
    /* the fold, tapped as a person does: a fresh paint first (the controls rewrote its text), set in the same tick */
    await page.evaluate(({ F, H, PID }) => { const V = window.VAULT; V.HUNT.feed = F; V.HUNT.hist = H; V.openDetail(PID, { dist: true }); }, { F, H, PID });
    const fold114 = () => page.evaluate(() => { const f = document.querySelector('#dDist [data-distfold="detail"]'), tls = [...document.querySelectorAll('#dDist .dtl')];
      return { open: f ? f.getAttribute('aria-expanded') : 'missing', n: tls.length, h: Math.round(tls.reduce((a, t) => a + t.getBoundingClientRect().height, 0)), body: !!document.querySelector('#dDist .dbody') }; });
    const was114 = await fold114();
    await tap('#dDist [data-distfold="detail"]'); await new Promise(r => setTimeout(r, 250)); const shut114 = await fold114();
    await tap('#dDist [data-distfold="detail"]'); await new Promise(r => setTimeout(r, 250)); const again114 = await fold114();
    ok('take 114: a real tap closes Distributor info and the history goes with it (no block, no height); a second tap brings both back',
       was114.open === 'true' && was114.n === 2 && shut114.open === 'false' && shut114.n === 0 && shut114.h === 0 && !shut114.body && again114.open === 'true' && again114.n === 2 && again114.h > 0, JSON.stringify({ was114, shut114, again114, taps: tapNotes }));
    /* the owner's answer: "it should be tucked away" -- each history a closed header, a 44 px target, until a real tap */
    await page.evaluate(({ F, H, PID }) => { const V = window.VAULT; V.HUNT.feed = F; V.HUNT.hist = H; V.openDetail(PID, { dist: true }); }, { F, H, PID });
    const hist114 = () => page.evaluate(() => { const b = [...document.querySelectorAll('#dDist .dtl')].map(t => { const h = t.querySelector('.dtl-h');
      return { d: t.dataset.tl, btn: !!h && h.tagName === 'BUTTON', exp: h ? h.getAttribute('aria-expanded') : null, h: h ? Math.round(h.getBoundingClientRect().height) : 0, lines: t.querySelectorAll(':scope > span:not(.dtl-h)').length }; });
      return { b, note: [...document.querySelectorAll('#dDist .note')].some(e => /^Where a change worked out from its dates/.test(e.textContent.trim())) }; });
    const tk0 = await hist114();
    await tap('#dDist .dtl[data-tl="gts"] .dtl-h'); await new Promise(r => setTimeout(r, 250)); const tk1 = await hist114();
    await tap('#dDist .dtl[data-tl="gts"] .dtl-h'); await new Promise(r => setTimeout(r, 250)); const tk2 = await hist114();
    const by114 = (x, d) => x.b.find(y => y.d === d) || {};
    ok('take 114: each history starts tucked away -- a closed header button at least 44 px tall, no lines, no note; a real tap opens GTS\'s alone, with the note its change needs; a second tap tucks it again',
       tk0.b.length === 2 && tk0.b.every(y => y.btn && y.exp === 'false' && y.h >= 44 && y.lines === 0) && !tk0.note
       && by114(tk1, 'gts').exp === 'true' && by114(tk1, 'gts').lines > 1 && by114(tk1, 'southern').lines === 0 && tk1.note
       && by114(tk2, 'gts').exp === 'false' && by114(tk2, 'gts').lines === 0 && !tk2.note, JSON.stringify({ tk0, tk1, tk2, taps: tapNotes }));
    const small114 = await page.evaluate(() => { const st = document.createElement('style'); st.textContent = '#dDist .dtl-h{min-height:0!important;height:18px!important}'; document.head.appendChild(st);
      const hs = [...document.querySelectorAll('#dDist .dtl-h')].map(h => Math.round(h.getBoundingClientRect().height)); st.remove(); return hs; });
    ok('take 114: ...control: a header squeezed to 18 px (which landed) is caught as under 44', small114.length === 2 && small114.every(h => h < 44), JSON.stringify(small114));
    const none114 = await page.evaluate(({ F, PID }) => { const V = window.VAULT; V.HUNT.feed = F; V.HUNT.hist = null; V.DISTF.open.add('detail'); V.paintDetailDist(V.CAT.byId.get(PID)); return window.__tl114(); }, { F, PID });
    ok('take 114: ...control: with no history on the phone the open fold is take 112\'s -- no history block and no note, the names and links as they were',
       none114.open && none114.n === 0 && !none114.note && none114.names === 'GTS Distribution,Southern Hobby' && none114.links === 2, JSON.stringify(none114));
    await page.emulateTimezone();
    await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.feed = null; V.HUNT.hist = null; V.DISTF.open.clear(); V.MODE.set('collect', true); V.go('home'); delete window.__tl114; });
    await new Promise(r => setTimeout(r, 200));
    fs.rmSync(dir114, { recursive: true, force: true });
    await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 }); }

  await browser.close();
} else {
  /* ---------------- honest fallback ------------------------------------- */
  sec('DOM-level render check (Chrome unavailable)');
  console.log('  note: puppeteer is not installed here, so PIXELS are NOT verified.');
  console.log('  note: CI installs it; this mode asserts markup only and says so.');

  const html = fs.readFileSync(W('index.html'), 'utf8');
  const js = fs.readFileSync(W('app.js'), 'utf8');
  const catalog = JSON.parse(fs.readFileSync(W('bundle/catalog.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(W('bundle/manifest.json'), 'utf8'));

  /* A DOM that records what was PAINTED into it, rather than throwing it away. */
  const els = new Map();
  const strokes = [];
  const ctx2d = new Proxy({}, {
    get: (_, k) => (...a) => { strokes.push(String(k)); return ctx2d; },
    set: () => true
  });
  const mk = (tag = 'div') => {
    const el = {
      tagName: tag.toUpperCase(), children: [], style: {}, dataset: {},
      _cls: new Set(), _text: '', _html: '', value: '',
      classList: { add: (...c) => c.forEach(x => el._cls.add(x)),
                   remove: (...c) => c.forEach(x => el._cls.delete(x)),
                   toggle: (c, o) => o ? el._cls.add(c) : el._cls.delete(c),
                   contains: c => el._cls.has(c) },
      get className() { return [...el._cls].join(' '); },
      set className(v) { el._cls = new Set(String(v).split(/\s+/).filter(Boolean)); },
      get textContent() { return el._text; }, set textContent(v) { el._text = String(v); },
      get innerHTML() { return el._html; }, set innerHTML(v) { el._html = String(v); },
      appendChild: c => (el.children.push(c), c),
      addEventListener: () => {}, removeEventListener: () => {},
      querySelector: () => null, querySelectorAll: () => [],
      closest: () => null, click: () => {}, focus: () => {},
      getContext: () => ctx2d, clientWidth: 412, width: 0, height: 0
    };
    return el;
  };
  const byId = new Map();
  for (const m of html.matchAll(/id="([\w-]+)"/g)) byId.set(m[1], mk());
  const doc = {
    querySelector: s => s.startsWith('#') ? (byId.get(s.slice(1)) || mk()) : mk(),
    querySelectorAll: () => [], createElement: mk,
    addEventListener: () => {}, body: mk('body')
  };
  doc.body.appendChild = c => (c && c.id ? byId.set(c.id, c) : 0, c);

  const store = {};
  const ctx = {
    console: { log: () => {} }, document: doc,
    localStorage: { getItem: k => store[k] ?? null,
                    setItem: (k, v) => { store[k] = String(v); }, removeItem: () => {} },
    navigator: { vibrate: () => true }, location: { href: 'https://localhost/' },
    URL, Blob: class {}, BigInt, Math, Date, JSON, Promise, setTimeout, clearTimeout,
    devicePixelRatio: 2,
    fetch: async u => ({ json: async () =>
      String(u).includes('manifest') ? manifest : catalog })
  };
  /* take 90: the error buffer (take 82) registers on window; the DOM fallback
     had no addEventListener and crashed here for eight takes unseen, because
     every one of them had Chrome (landmine 127). */
  ctx.addEventListener = () => {}; ctx.removeEventListener = () => {};
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(js, ctx, { filename: 'www/app.js' });
  await new Promise(r => setTimeout(r, 60));

  const V = ctx.VAULT;
  ok('app booted', !!V && V.CAT.ready);
  const vivi = V.candidates('EB03-024', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0));   // SP first (take 16: candidates() is likelihood-ordered)
  V.OWN.add(vivi[0].id, { condition: 'NM' });
  V.OWN.add(vivi[0].id, { condition: 'NM' });
  V.OWN.snapshot();

  strokes.length = 0;
  ctx.VAULT && vm.runInContext('void 0', ctx);
  /* Drive the real paint functions through the app's own nav handler path. */
  vm.runInContext('typeof paintHome === "function" && paintHome()', ctx);

  const total = byId.get('pfTotal');
  ok('the portfolio total was PAINTED into the DOM',
     /\$\d/.test(total._text) && total._text !== '$0.00', total._text);
  /* Landmine 62, DOM-mode twin of the Chrome check above. */
  const want = V.OWN.items.reduce((a, i) =>
    a + (V.CAT.byId.get(i.id).market || 0) * i.qty, 0);
  ok('the total matches the catalogue, to the cent',
     total._text.replace(/[$,]/g, '') === want.toFixed(2),
     `${total._text} vs ${want.toFixed(2)}`);
  const top = byId.get('topList');
  ok('Most Valuable was painted with the card', /Nefeltari Vivi/.test(top._html));
  ok('the printing badge was painted', /badge/.test(top._html));
  ok('the sparkline issued stroke commands to a canvas',
     strokes.includes('stroke') || strokes.includes('fill'),
     strokes.slice(0, 6).join(','));

  vm.runInContext('typeof paintCollection === "function" && paintCollection()', ctx);
  ok('the collection grid was painted with a tile',
     /class="tile"/.test(byId.get('colGrid')._html));
  ok('the tile carries a price', /\$\d/.test(byId.get('colGrid')._html));

  const r = V.resolve('OP01-016', {});
  ok('a 4292x spread refuses to auto-accept', r.verdict === 'ask');
  ok('the picker sheet content is buildable from the candidates',
     r.candidates.length === 12 && r.candidates.every(c => c.img));

  console.log('  NOT VERIFIED in this mode: pixel output, layout geometry, ' +
              'computed colour. CI verifies those.');
}

console.log(`\n${pass} passed, ${fail} failed  (mode: ${mode})`);
process.exit(fail ? 1 : 0);
