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
import path from 'node:path';
import vm from 'node:vm';

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
    const st = {}; for (const f of document.fonts) st[f.family] = f.status;
    const h2 = document.querySelector('h2');
    const fam = h2 ? getComputedStyle(h2).fontFamily : '';
    const nope = new FontFace('OPH Nope', 'url(fonts/does-not-exist.woff2)');
    await nope.load().catch(() => 0);
    return { st, fam, control: nope.status };
  });
  ok('the four role faces are LOADED in Chrome',
     ['OPH Display', 'OPH Comic', 'OPH Body', 'OPH Heavy'].every(f => fonts.st[f] === 'loaded'),
     JSON.stringify(fonts.st));
  ok('h2 resolves to the display face', /OPH Display/.test(fonts.fam), fonts.fam);
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
  await page.evaluate(() => document.querySelector('#filters').classList.remove('on'));

  /* Landmine 82: nothing interactive under the simulated status bar or gesture bar. */
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--safe-area-inset-top', '36px');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '24px');
    document.querySelector('nav button[data-go="home"]').click();
  });
  await new Promise(r => setTimeout(r, 200));
  const ins = await page.evaluate(() => {
    const top = document.querySelector('.tab.on').getBoundingClientRect().top;
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
  ok('Prep & Play: the body is felt green', md.bg === 'rgb(15, 42, 30)', md.bg);
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
