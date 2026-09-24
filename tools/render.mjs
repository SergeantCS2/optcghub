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
  ok('search hits: the box is card-shaped (36x50) and the picture does not stretch the row',
     srch.boxW === 36 && srch.boxH === 50 && srch.rowH <= Math.max(srch.boxH, srch.nmH) + srch.pad + 1, JSON.stringify(srch));
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
  const g94 = await page.evaluate(F => {
    const V = window.VAULT; V.HUNT.feed = F; V.HUNT.setZip(''); V.MODE.set('hunt', true);
    for (const id of Object.keys(V.HUNT.distByCatalogId())) { const p = V.CAT.byId.get(+id); if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } }
    V.paintSealed();
    const panel = [...document.querySelectorAll('#sealedList .panel h3')].find(h => h.textContent === 'GTS Distribution');
    const line = [...document.querySelectorAll('#sealedList [data-open] span')].find(s => /^GTS Distribution/.test(s.textContent));
    const row = line && line.closest('[data-open]'); const r = row && row.getBoundingClientRect(); const l = line && line.getBoundingClientRect();
    return { panel: !!panel && panel.getBoundingClientRect().height > 0, line: !!line, text: line && line.textContent.slice(0, 60), inRow: !!r && l.left >= r.left - 1 && l.right <= r.right + 1 && l.height > 0,
             scroll: document.body.scrollWidth, vw: document.documentElement.clientWidth };
  }, F94);
  ok('Hunt: the distributor panel draws, and a matched row\'s distributor line draws inside its row with no sideways scroll', g94.panel && g94.line && g94.inRow && g94.scroll <= g94.vw + 1, JSON.stringify(g94));
  const r94 = await page.evaluate(() => { const V = window.VAULT; V.go('releases'); V.paintReleases();
    const h = [...document.querySelectorAll('#relList .panel h3')].find(x => x.textContent === 'At the distributor, not in the catalogue yet');
    const rows = h ? [...h.parentElement.querySelectorAll('.row')] : []; const rr = rows.map(x => x.getBoundingClientRect());
    return { panel: !!h && h.getBoundingClientRect().height > 0, rows: rows.length, drawn: rr.every(b => b.height > 0), scroll: document.body.scrollWidth, vw: document.documentElement.clientWidth }; });
  ok('Releases: the not-in-the-catalogue-yet panel draws its rows without sideways scroll', r94.panel && r94.rows === 3 && r94.drawn && r94.scroll <= r94.vw + 1, JSON.stringify(r94));
  const c94 = await page.evaluate(F => { const V = window.VAULT; const f = JSON.parse(JSON.stringify(F)); delete f.sources.gts; V.HUNT.feed = f; V.paintSealed(); V.paintReleases();
    const a = [...document.querySelectorAll('#sealedList .panel h3')].some(h => h.textContent === 'GTS Distribution'); const b = /At the distributor/.test(document.querySelector('#relList').innerHTML);
    V.HUNT.feed = null; V.MODE.set('collect', true); return { a, b }; }, F94);
  ok('negative control: without the source in the feed, neither distributor panel draws', !c94.a && !c94.b, JSON.stringify(c94));
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
    const panel = document.querySelector('#dBuy').getBoundingClientRect(); const rows = document.querySelectorAll('#dBuyList .row').length;
    const card = V.CAT.rows.find(x => !x.sealed && x.market > 0); V.openDetail(card.id); const panel2 = document.querySelector('#dBuy').getBoundingClientRect();
    V.HUNT.feed = null; V.MODE.set('collect', true); return { h: Math.round(panel.height), rows, h2: Math.round(panel2.height) }; });
  ok('the sealed sheet draws the Where to buy panel with its rows; the card sheet draws none', s96.h > 0 && s96.rows >= 2 && s96.h2 === 0, JSON.stringify(s96));
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
    V.MODE.set('play', true); const playBg = getComputedStyle(document.body).backgroundColor;
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
  ok('filter sheet: the button says how many rows will show', /^\d+ card/.test(sheet.showText), sheet.showText);

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
  ok("set chip: a tap shows that set's cards, not zero", c1.n > 0 && new RegExp('^' + c1.n + ' card').test(c1.fN),
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
     c2.stored === 0 && new RegExp('^' + c2.pool + ' card').test(c2.fN), c2.fN);
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
      if (!t) { rows.push({ id, missing: true }); continue; }
      const r = t.getBoundingClientRect(), cs = getComputedStyle(t), txt = h.querySelector('.ab-text').getBoundingClientRect(), act = h.querySelector('.ab-act');
      const a = act && act.getBoundingClientRect(), g = h.querySelector('[data-go="settings"]'), gr = g && g.getBoundingClientRect();
      rows.push({ id, on: sec.classList.contains('on'), top: Math.round((r.top - s.top) * 10) / 10, left: Math.round(r.left - s.left), size: cs.fontSize, face: cs.fontFamily,
        back: !!h.querySelector('[data-back]'), gear: gr ? `${Math.round(gr.left - s.left)},${Math.round(gr.top - s.top)}` : '',
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
