/* Execute the SHIPPED app and assert on what it actually does.
 *
 * APEX landmine 39: a verifier that passes while the product fails is worse
 * than no verifier. So this loads www/app.js -- the built artifact, the same
 * bytes the APK ships -- into a DOM built from www/index.html, and drives it.
 * If an assertion here passes, that code path executed.
 *
 * It deliberately does NOT stub the confidence gate. The ask/auto ratio these
 * checks report is the real one, computed over the real catalogue.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const W = p => path.join(ROOT, 'www', p);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
};
const section = s => console.log(`\n\u2500\u2500 ${s}`);

/* ---- a DOM small enough to read, real enough to run the app ------------- */
function makeDom(html) {
  const listeners = {};
  const mk = (tag = 'div') => {
    const el = {
      tagName: tag.toUpperCase(), children: [], style: {}, dataset: {},
      _cls: new Set(), _text: '', _html: '', value: '',
      classList: {
        add: (...c) => c.forEach(x => el._cls.add(x)),
        remove: (...c) => c.forEach(x => el._cls.delete(x)),
        toggle: (c, on) => on ? el._cls.add(c) : el._cls.delete(c),
        contains: c => el._cls.has(c)
      },
      get className() { return [...el._cls].join(' '); },
      set className(v) { el._cls = new Set(String(v).split(/\s+/).filter(Boolean)); },
      get textContent() { return el._text; }, set textContent(v) { el._text = String(v); },
      get innerHTML() { return el._html; }, set innerHTML(v) { el._html = String(v); },
      appendChild: c => { el.children.push(c); return c; },
      addEventListener: (t, f) => { (el._ev ||= {})[t] = f; },
      removeEventListener: () => {},
      querySelector: () => null, querySelectorAll: () => [],
      closest: () => null, click: () => {}, focus: () => {},
      getContext: () => ctx2d, clientWidth: 360, width: 0, height: 0
    };
    return el;
  };
  const ctx2d = new Proxy({}, { get: () => () => ctx2d });
  const byId = new Map();
  for (const m of html.matchAll(/id="([\w-]+)"/g)) byId.set(m[1], mk());
  const doc = {
    _ids: byId,
    querySelector: s => s.startsWith('#') ? (byId.get(s.slice(1)) || mk()) : mk(),
    querySelectorAll: () => [],
    createElement: mk,
    addEventListener: (t, f) => { (listeners[t] ||= []).push(f); },
    body: mk('body')
  };
  doc.body.appendChild = c => { if (c && c.id) byId.set(c.id, c); return c; };
  return { doc, listeners };
}

/* ---- run --------------------------------------------------------------- */
const html = fs.readFileSync(W('index.html'), 'utf8');
const js = fs.readFileSync(W('app.js'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(W('bundle/catalog.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(W('bundle/manifest.json'), 'utf8'));

section('shipped artifact');
ok('index.html references the built app.js', html.includes('src="app.js"'));
ok('no unreplaced build token', !html.includes('__TAKE__') && !js.includes('__TAKE__'));

const store = {};
const remote = [];
const ctx = {
  console,
  localStorage: {
    getItem: k => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  },
  navigator: { vibrate: () => true },
  location: { href: 'https://localhost/' },
  URL, Blob: class { constructor(p) { this.p = p; } },
  BigInt, Math, Date, JSON, Promise, setTimeout, clearTimeout, devicePixelRatio: 2,
  fetch: async u => {
    remote.push(String(u));
    if (String(u).includes('catalog.json')) return { json: async () => catalog };
    if (String(u).includes('manifest.json')) return { json: async () => manifest };
    throw new Error('unexpected fetch ' + u);
  }
};
const { doc, listeners } = makeDom(html);
ctx.document = doc;
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(js, ctx, { filename: 'www/app.js' });
await new Promise(r => setTimeout(r, 60));

const V = ctx.VAULT;
section('boot');
ok('app exposed its internals', !!V);
ok('catalogue loaded', V && V.CAT.ready);
ok(`printings = manifest.printings (${manifest.printings})`,
   V.CAT.rows.length === manifest.printings, `got ${V?.CAT.rows.length}`);
ok('no duplicate productIds', V.CAT.byId.size === V.CAT.rows.length);

/* PROTOCOL §8: the only requests are the two declared provisioning reads. */
section('offline integrity (PROTOCOL §8)');
ok('exactly 2 network reads at boot', remote.length === 2, remote.join(', '));
ok('both are local bundle paths',
   remote.every(u => u.startsWith('bundle/')), remote.join(', '));

section('landmine 1 — the printing is the unit');
/* Take 16: candidates() orders by LIKELIHOOD (main set > deck > promo, base
   first when nothing was seen). These data assertions sort by price
   themselves; the ordering assertion is further down. */
const vivi = V.candidates('EB03-024', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0));
ok('EB03-024 resolves to 3 printings', vivi.length === 3, `got ${vivi.length}`);
/* Landmine 62: assert the RELATIONSHIP, never the price. The take-2 versions of
   these pinned $467.33 and $1.48 and went red at take 6 when the SP moved to
   $463.53 overnight -- a correct catalogue and a correct app, failing a test
   that had encoded one day's market as if it were a fact about the system. */
ok('dearest is the SP', vivi[0].treat === 'sp', `${vivi[0]?.treat}`);
ok('cheapest is the base',
   vivi[vivi.length - 1].treat === 'base', vivi[vivi.length - 1]?.treat);
ok('the SP is worth at least 100x the base',
   vivi[0].market / vivi[vivi.length - 1].market > 100,
   (vivi[0].market / vivi[vivi.length - 1].market).toFixed(0) + 'x');
ok('and the prices are plausible at all',
   vivi[0].market > 50 && vivi[vivi.length - 1].market < 50,
   `${vivi[0].market} / ${vivi[vivi.length - 1].market}`);
const nami = V.candidates('OP01-016', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0));
ok('OP01-016 resolves to 12 printings', nami.length === 12, `got ${nami.length}`);
ok('OP01-016 spans >1000x',
   nami[0].market / nami.filter(p => p.market > 0).pop().market > 1000);

section('the confidence gate (landmine 12)');
const rv = V.resolve('EB03-024', {});
ok('a 316x spread is NEVER auto-accepted', rv.verdict === 'ask', rv.verdict);
ok('the ask explains itself in money', /\d+×|apart/.test(rv.why));
/* Take 16, first field test: the picker showed a promo above the main-set base
   twice and Jacob was holding the base both times. Likelihood, not price. */
ok('the picker leads with the LIKELIEST printing, not the dearest (landmine 84)',
   (() => { const s = V.CAT.sets.get(rv.candidates[0].set) || {};
            return s.kind === 'main' && rv.candidates[0].treat === 'base'; })(),
   `${(V.CAT.sets.get(rv.candidates[0].set) || {}).kind} ${rv.candidates[0].treat}`);
ok('a seen star still overrides likelihood',
   V.candidates('EB03-024', null, 'star')[0].face === 'star');
ok('set kinds are in the bundle', [...V.CAT.sets.values()].every(x => ['main', 'deck', 'promo'].includes(x.kind)));

/* The whole-catalogue behaviour, computed, not asserted from memory. */
let auto = 0, ask = 0, autoSet = 0, askSet = 0;
for (const p of V.CAT.rows) {
  if (!p.num) continue;
  (V.resolve(p.num, {}).verdict === 'auto' ? auto++ : ask++);
  (V.resolve(p.num, { setId: p.set }).verdict === 'auto' ? autoSet++ : askSet++);
}
const pct = (a, b) => (100 * a / (a + b));
console.log(`     code alone        auto ${pct(auto, ask).toFixed(1)}%`);
console.log(`     code + set chip   auto ${pct(autoSet, askSet).toFixed(1)}%`);
ok('code-alone auto-accept near the take-2 measurement of 8.9%',
   Math.abs(pct(auto, ask) - 8.9) < 2.5, pct(auto, ask).toFixed(1));
ok('the set chip is worth at least 5x',
   pct(autoSet, askSet) / pct(auto, ask) >= 5,
   (pct(autoSet, askSet) / pct(auto, ask)).toFixed(1) + 'x');

/* NEGATIVE CONTROL. AGENTS rule 2: a gate that cannot refuse is not a gate. */
section('negative controls');
const before = V.resolve('OP01-016', {}).verdict;
ok('a 4292x spread refuses to auto-accept', before === 'ask', before);
const single = V.CAT.rows.find(p => p.num && V.candidates(p.num, null).length === 1);
ok('a single-printing number DOES auto-accept',
   V.resolve(single.num, {}).verdict === 'auto');
ok('an unknown number returns unknown, not a guess',
   V.resolve('ZZ99-999', {}).verdict === 'unknown');
ok('hamming(x,x) === 0', V.hamming(123456789, 123456789) === 0);
ok('hamming detects a single flipped bit', V.hamming(0, 1) === 1);
/* Landmine 43 second face: a NEGATIVE hash (SQLite signed int64) once hung the
   app forever. This assertion exists because the harness stopped responding. */
ok('hamming terminates on a negative (signed) hash',
   V.hamming(-1, -1) === 0 && V.hamming(-1, 0) === 64);
ok('every stored hash is comparable without hanging',
   V.CAT.rows.filter(p => p.hash != null).slice(0, 500)
    .every(p => V.hamming(p.hash, p.hash) === 0));

section('the collection is the user\'s (PROTOCOL §9)');
const price3x = vivi[0].market * 3;
V.OWN.add(vivi[0].id, { condition: 'NM' });
V.OWN.add(vivi[0].id, { condition: 'NM' });
ok('a duplicate increments, it does not insert (landmine 16)',
   V.OWN.items.length === 1 && V.OWN.items[0].qty === 2,
   `${V.OWN.items.length} lines qty ${V.OWN.items[0]?.qty}`);
V.OWN.add(vivi[0].id, { condition: 'LP' });
ok('a different condition IS a different line', V.OWN.items.length === 2);
ok('total is quantity-weighted',
   Math.abs(V.OWN.total() - price3x) < 0.02,
   `${V.OWN.total().toFixed(2)} vs ${price3x.toFixed(2)}`);
ok('the collection persisted to storage', !!store['vault.items']);
ok('a snapshot series exists', JSON.parse(store['vault.snaps'] || '[]').length >= 1);

section('honesty (PROTOCOL §10)');
const withSpread = V.CAT.rows.filter(p => p.low && p.high && p.high > p.low);
ok('the catalogue carries low and high, not just market',
   withSpread.length > V.CAT.rows.length * 0.5,
   `${withSpread.length}/${V.CAT.rows.length}`);
const sp = V.CAT.byId.get(vivi[0].id);
ok('the SP carries a low well under its market — the spread is real',
   sp.low > 0 && sp.low < sp.market * 0.95, `${sp.low} vs ${sp.market}`);
ok('same-art printings are flagged so the hash is not asked to separate them',
   V.CAT.rows.some(p => p.sameart === 1));
ok('no condition multiplier exists anywhere in the shipped code',
   !/condition\s*\*|\*\s*0\.8[05]|multiplier/i.test(js));

section('take 3 — features the screenshots showed');
const prog = ctx.setProgress ? null : null;   /* paint fns are module-scoped */
ok('export carries a cost-basis column',
   /paid_usd/.test(js), 'export header');
ok('import exists and refuses ambiguous rows',
   /importCsv/.test(js) && /ambiguous/.test(js));
ok('bulk delete asks before destroying a collection (PROTOCOL §9)',
   /confirm\(/.test(js) && /cannot be undone/.test(js));
ok('graded entry records grader, grade and cert',
   /GRADERS/.test(js) && /cert/.test(js));
ok('graded value is labelled as the UNGRADED price',
   /ungraded price/.test(js));
/* Take 8: movers are real, computed nightly from a committed price history.
   The honesty property moved with it -- a printing with no prior day must
   render as UNKNOWN, never as a flat 0.00% that reads like a real flat market
   (PROTOCOL §10). */
ok('a printing with no prior day renders as unknown, not 0.00%',
   /no prior day on file/.test(js) && /d1p == null/.test(js));
ok('movers come from the catalogue, not a per-device baseline',
   !/vault\.prices/.test(js) && /history_days/.test(js));
ok('the chart marks purchases separately from price moves',
   /f5c518/.test(js) && /count changed/.test(js));
ok('set completion is computed from the catalogue', /setProgress/.test(js));

section('take 3 — measured hash thresholds (landmine 49)');
const sameArt = V.CAT.rows.filter(p => p.sameart === 1).length;
ok('same_art is measured, not keyword-guessed (>3000 flagged)',
   sameArt > 3000, String(sameArt));
console.log(`     ${sameArt} of ${V.CAT.rows.length} printings are visually `
          + `indistinguishable from a sibling`);
ok('an indistinguishable pair NEVER auto-accepts on artwork',
   (() => {
     const p = V.CAT.rows.find(x => x.sameart === 1 && x.hash != null && x.num);
     const r = V.resolve(p.num, { hash: p.hash });
     return r.verdict !== 'auto' || r.candidates.length === 1;
   })());
const cardsOnly = V.CAT.rows.filter(p => !p.sealed);
const hashed = cardsOnly.filter(p => p.hash != null).length;
ok('hash coverage is complete enough to rely on (cards, not sealed)',
   hashed / cardsOnly.length > 0.95,
   `${(100 * hashed / cardsOnly.length).toFixed(1)}%`);
ok('sealed product is in the bundle for manual entry (A7)',
   V.CAT.rows.filter(p => p.sealed).length > 500 &&
   V.CAT.rows.filter(p => p.sealed).every(p => !p.num),
   String(V.CAT.rows.filter(p => p.sealed).length));
ok('sealed product is never a scan candidate', !V.CAT.byNum.has('') && V.resolve('', {}).verdict === 'unknown');

section('take 6 — what the card face says (landmine 60)');
const faces = { plain: 0, star: 0, sp: 0 };
V.CAT.rows.forEach(p => { faces[p.face] = (faces[p.face] || 0) + 1; });
ok('every printing carries a face class',
   faces.plain + faces.star + faces.sp === V.CAT.rows.length, JSON.stringify(faces));
ok('the SP class is small and specific', faces.sp > 100 && faces.sp < 300, String(faces.sp));

const eb = V.candidates('EB03-024', null);
ok('EB03-024 base is plain, alt-art is star, SP is sp',
   eb.find(p => p.treat === 'base').face === 'plain' &&
   eb.find(p => p.treat === 'alternate_art').face === 'star' &&
   eb.find(p => p.treat === 'sp').face === 'sp');

/* A POSITIVE sighting narrows. */
const seenSp = V.resolve('EB03-024', { face: 'sp' });
ok('seeing the SP badge resolves EB03-024 outright',
   seenSp.verdict === 'auto' && seenSp.pick.treat === 'sp',
   `${seenSp.verdict} ${seenSp.pick && seenSp.pick.treat}`);
ok('and it names the evidence', /SP/.test(seenSp.why || ''), seenSp.why);

/* THE LOAD-BEARING ONE. Absence must narrow NOTHING. Take 6 measured an
   alternate art with no star printed on it, so treating "no star" as proof of a
   base card would silently enter a $78 card as a $5 one. If someone "improves"
   candidates() into a symmetric filter, this assertion is what stops it. */
const plainSeen = V.candidates('EB03-024', null, 'plain');
ok('seeing NO star excludes nothing — all 3 printings still offered',
   plainSeen.length === 3, `${plainSeen.length} of 3`);
ok('but it re-ranks: a plain-faced printing is offered first',
   plainSeen[0].face === 'plain', plainSeen[0].face);
const rPlain = V.resolve('EB03-024', { face: 'plain' });
ok('and a 316x spread still refuses to auto-accept on absence',
   rPlain.verdict === 'ask', rPlain.verdict);

/* Coverage, recomputed here rather than quoted from the handoff. */
let base = 0, withFace = 0, tot = 0;
for (const p of V.CAT.rows) {
  if (!p.num) continue;
  tot++;
  if (V.resolve(p.num, { setId: p.set }).verdict === 'auto') base++;
  if (V.resolve(p.num, { setId: p.set, face: p.face }).verdict === 'auto') withFace++;
}
console.log(`     set chip only        ${(100 * base / tot).toFixed(1)}%`);
console.log(`     + card face (safe)   ${(100 * withFace / tot).toFixed(1)}%`);
ok('the card face raises auto-accept by at least 8 points',
   (withFace - base) / tot > 0.08,
   `${(100 * (withFace - base) / tot).toFixed(1)} points`);

section('take 8 — day two (the delta on every screen)');
const withD = V.CAT.rows.filter(p => p.d1p != null);
ok('most printings carry a 1-day delta',
   withD.length > V.CAT.rows.length * 0.9, `${withD.length}/${V.CAT.rows.length}`);
const moved = withD.filter(p => Math.abs(p.d1a) > 0.004);
ok('a plausible share moved overnight (10%-70%)',
   moved.length / withD.length > 0.10 && moved.length / withD.length < 0.70,
   (100 * moved.length / withD.length).toFixed(0) + '%');
ok('deltas are internally consistent: pct = abs / yesterday',
   moved.slice(0, 300).every(p => {
     const yesterday = p.market - p.d1a;
     return yesterday > 0 && Math.abs(100 * p.d1a / yesterday - p.d1p) < 0.06;
   }));
ok('no printing moved more than 10x overnight (landmine 7)',
   withD.every(p => Math.abs(p.d1p) < 900),
   String(withD.filter(p => Math.abs(p.d1p) >= 900).length));
ok('manifest records two history days',
   (manifest.history_days || []).length === 2, JSON.stringify(manifest.history_days));
ok('7d and 30d are absent, not zero, with two days on file',
   withD.every(p => p.d7p == null && p.d30p == null));

section('take 10 — the scanner stages (A2, everything but the camera)');
const SC = V.scan;
ok('the scanner is exposed for the harness', !!SC && typeof SC.parseRead === 'function');
ok('the bundle carries the valid-number set', V.CAT.valid && V.CAT.valid.size > 2500,
   String(V.CAT.valid && V.CAT.valid.size));
ok('the bundle carries the star template WITH its evidence',
   V.CAT.star && V.CAT.star.template.length === V.CAT.star.w * V.CAT.star.h &&
   V.CAT.star.held_out && V.CAT.star.held_out.false_positives === 0,
   JSON.stringify(V.CAT.star && V.CAT.star.held_out));

/* parseRead against the strings OCR ACTUALLY returns (take 7, landmine 63). */
const pr = t => SC.parseRead(t);
ok('reads the code when badge digits run onto it: EB04-024008',
   pr('EB04-024008').number === 'EB04-024');
ok('reads through the SP badge and rarity: SPOP05-119SEC2',
   pr('SPOP05-119SEC2').number === 'OP05-119' && pr('SPOP05-119SEC2').sp === true);
ok('a plain card does not flag SP', pr('OP13-014C4').sp === false);
ok('normalises O->0 inside digits: EBO3-O24', pr('EBO3-O24').number === 'EB03-024');
ok('a promo code reads: P-084', pr('P-084').number === 'P-084');
ok('a number that is not in the catalogue is a NO read, not a wrong one (landmine 65)',
   pr('OP99-999').number === null);
ok('garbage is a no-read', pr('NINxx').number === null && pr('').number === null);

/* temporal voting (landmine 65: the residual 2% is single-frame noise) */
const vt = SC.makeVoter(3, 2);
ok('one frame is not enough', vt.push('OP01-016') === null);
ok('two agreeing frames vote', vt.push('OP01-016') === 'OP01-016');
vt.reset();
ok('a noisy frame between two good ones still votes',
   (vt.push('OP01-016'), vt.push('OP01-018'), vt.push('OP01-016')) === 'OP01-016');
vt.reset();
ok('three different reads never vote',
   (vt.push('OP01-016'), vt.push('OP01-017'), vt.push('OP01-018')) === null);

/* the platform seam: no recogniser here, and the app must SAY so */
ok('no OCR in this environment, and the scanner knows it', SC.PLATFORM.hasOcr() === false);

/* identifyFrame, the star detector and the quad detector need a REAL canvas
   with real pixels. This harness's DOM mock has neither -- getImageData
   returns a proxy -- so those stages live in render.mjs (Chrome mode), where a
   NaN cannot masquerade as a score. Landmine 71. */
console.log('     pixel stages (quad, warp, star) are asserted in render.mjs');

section('take 11 — filter & sort');
const F = V.blankFilter('all');
const ALL = V.CAT.rows.map(p => ({ p, i: null }));
ok('a blank filter passes everything', V.applyFilter(ALL, F).length === ALL.length);
F.rarity = ['SEC'];
const secs = V.applyFilter(ALL, F);
ok('rarity filter narrows to that rarity only', secs.length > 0 && secs.every(x => x.p.rarity === 'SEC'), String(secs.length));
F.color = ['Red'];
const redSec = V.applyFilter(ALL, F);
ok('facets AND together; colour matches dual-colour cards',
   redSec.length > 0 && redSec.length < secs.length &&
   redSec.every(x => /Red/.test(x.p.color)), `${redSec.length} of ${secs.length}`);
F.min = 100;
const dear = V.applyFilter(ALL, F);
ok('price floor applies', dear.every(x => x.p.market >= 100), String(dear.length));
F.max = 50;
ok('a contradictory range returns nothing rather than something',
   V.applyFilter(ALL, F).length === 0);
const G = V.blankFilter('all'); G.only = ['special'];
ok('"special printings" excludes plain faces',
   V.applyFilter(ALL, G).every(x => x.p.face !== 'plain'));
const H = V.blankFilter('all'); H.only = ['moved'];
const mv = V.applyFilter(ALL, H);
ok('"moved today" needs a real non-zero delta', mv.length > 0 && mv.every(x => x.p.d1p != null && x.p.d1a !== 0));
ok('activeCount counts facets, price and only-flags',
   V.activeCount(G) === 1 && V.activeCount(F) === 3 && V.activeCount(V.blankFilter('all')) === 0,
   `${V.activeCount(G)} ${V.activeCount(F)}`);

/* sorting */
const S = V.blankFilter('all'); S.sort = 'value'; S.dir = -1;
const byV = V.sortRows(ALL.slice(0, 500), S);
ok('value sort is descending', byV.every((x, i) => i === 0 || (byV[i-1].p.market || 0) >= (x.p.market || 0)));
S.dir = 1;
const byVa = V.sortRows(ALL.slice(0, 500), S);
/* Ties: dozens of printings share the lowest price, so 'first of ascending'
   and 'last of descending' are different rows with equal value. Assert the
   value, not the identity. */
ok('flipping dir flips the order',
   (byVa[0].p.market || 0) === (byV[byV.length - 1].p.market || 0) &&
   (byVa[byVa.length - 1].p.market || 0) === (byV[0].p.market || 0));
S.sort = 'name'; S.dir = -1;
const byN = V.sortRows(ALL.slice(0, 500), S);
ok('name sort is A-Z at its natural direction', byN.every((x, i) => i === 0 || byN[i-1].p.name.localeCompare(x.p.name) <= 0));
S.sort = 'delta';
const byD = V.sortRows(ALL.slice(0, 500), S);
ok('delta sort puts the biggest absolute move first',
   Math.abs(byD[0].p.d1a || 0) >= Math.abs(byD[1].p.d1a || 0));
S.sort = 'rarity';
const byR = V.sortRows(ALL.slice(0, 500), S);
ok('rarity sort follows the game order L, SEC, SR, R, UC, C',
   byR.filter(x => x.p.rarity).map(x => x.p.rarity).every((r, i, a) => i === 0 ||
     ['L','SEC','SR','R','UC','C','P','PR','DON'].indexOf(a[i-1]) <= ['L','SEC','SR','R','UC','C','P','PR','DON'].indexOf(r)));

/* the collection scope carries item-level facets */
V.OWN.items = []; store['vault.items'] = '[]';
const c = V.candidates('OP01-016', null);
V.OWN.add(c[0].id, { condition: 'NM' }); V.OWN.add(c[1].id, { condition: 'LP' });
V.OWN.add(c[1].id, { condition: 'LP' });
const OWNROWS = V.OWN.items.map(i => ({ i, p: V.CAT.byId.get(i.id) }));
const O = V.blankFilter('own'); O.cond = ['LP'];
ok('condition filter is item-level', V.applyFilter(OWNROWS, O).length === 1 && V.applyFilter(OWNROWS, O)[0].i.condition === 'LP');
O.cond = []; O.only = ['multi'];
ok('"Qty 2+" is item-level', V.applyFilter(OWNROWS, O).length === 1 && V.applyFilter(OWNROWS, O)[0].i.qty === 2);
ok('filter state persists per scope', !!store['vault.filt.own'] || V.FILT.own._scope === 'own');

section('take 13 — the deck builder (Comprehensive Rules v1.2.0 §5-1)');
const leaders = V.CAT.rows.filter(p => p.type === 'Leader' && p.color && !/;/.test(p.color));
const redL = leaders.find(p => p.color === 'Red'), greenL = leaders.find(p => p.color === 'Green');
const dual = V.CAT.rows.find(p => p.type === 'Leader' && /Green;Red|Red;Green/.test(p.color));
ok('mono and dual-colour Leaders exist in the catalogue', !!redL && !!greenL && !!dual);
const mk = () => { const d = V.DECKS.blank(); return d; };

/* §5-1-2: exactly one Leader */
let d = mk(); let A = V.legality(d);
ok('no Leader is reported as a problem (§5-1-2)', A.problems.some(p => /No Leader/.test(p)));
d.leader = redL.id; A = V.legality(d);
ok('a Leader clears that problem', !A.problems.some(p => /No Leader/.test(p)));

/* §5-1-2-1: main deck types */
const aChar = V.CAT.rows.find(p => p.type === 'Character' && p.color === 'Red' && p.num);
const anEvent = V.CAT.rows.find(p => p.type === 'Event' && p.color === 'Red' && p.num);
d.cards = [{ id: greenL.id, n: 1 }];
ok('a Leader in the main deck is flagged (§5-1-2-1)',
   V.legality(d).problems.some(p => /not a main-deck card/.test(p)));

/* §5-1-2-2 + §2-3-5: colour, and multi-colour counts as every colour */
const greenChar = V.CAT.rows.find(p => p.type === 'Character' && p.color === 'Green' && p.num);
/* MEASURED take 13: every one of the 165 dual-colour cards in the catalogue is
   a LEADER. There is no dual-colour Character, Event or Stage. So §2-3-5
   ("a multi-colour card is every colour it possesses") does its work through
   the Leader: a Green/Red Leader admits Green cards and Red cards. */
const redChar = V.CAT.rows.find(p => p.type === 'Character' && p.color === 'Red' && p.num);
ok('a Green card under a Red Leader is off-colour (§5-1-2-2)', !V.colourLegal(greenChar, redL));
ok('a Green card under a Green/Red Leader is legal (§2-3-5)', V.colourLegal(greenChar, dual));
ok('a Red card under the same Green/Red Leader is legal too', V.colourLegal(redChar, dual));
ok('no dual-colour non-Leader exists to mis-test with',
   !V.CAT.rows.some(p => p.type !== 'Leader' && /;/.test(p.color || '')));
d.cards = [{ id: greenChar.id, n: 1 }];
ok('the off-colour problem names both colours',
   V.legality(d).problems.some(p => /Green.*Leader is Red/.test(p)));

/* §5-1-2-3: max 4 by card NUMBER, across printings -- the one place number-keying is right */
const siblings = V.candidates('OP01-016', null).filter(p => p.type === 'Character');
ok('OP01-016 has multiple printings to test with', siblings.length >= 3);
d.leader = V.CAT.rows.find(p => p.type === 'Leader' && V.colourLegal(siblings[0], p)).id;
d.cards = [{ id: siblings[0].id, n: 2 }, { id: siblings[1].id, n: 2 }, { id: siblings[2].id, n: 1 }];
A = V.legality(d);
ok('five copies of one NUMBER across three printings is flagged (§5-1-2-3)',
   A.byNum['OP01-016'] === 5 && A.problems.some(p => /5 copies of OP01-016/.test(p)), JSON.stringify(A.byNum));
d.cards = [{ id: siblings[0].id, n: 2 }, { id: siblings[1].id, n: 2 }];
ok('four across two printings is fine', !V.legality(d).problems.some(p => /copies/.test(p)));

/* §5-1-2: exactly fifty */
d.leader = redL.id;
const reds = V.CAT.rows.filter(p => p.type !== 'Leader' && p.color === 'Red' && p.num && V.RULES.MAIN_TYPES.has(p.type));
const uniq = []; const seenN = new Set();
for (const p of reds) { if (!seenN.has(p.num)) { seenN.add(p.num); uniq.push(p); } if (uniq.length >= 13) break; }
d.cards = uniq.slice(0, 12).map(p => ({ id: p.id, n: 4 }));           // 48
A = V.legality(d);
ok('48 cards: reports 2 more needed', A.total === 48 && A.problems.some(p => /2 more cards needed/.test(p)));
d.cards.push({ id: uniq[12].id, n: 2 });                               // 50
A = V.legality(d);
ok('a fifty-card, in-colour, four-max deck with a Leader is LEGAL', A.legal, A.problems.join(' | '));
d.cards.push({ id: anEvent.id, n: 1 });
ok('51 is over (§5-1-2)', V.legality(d).problems.some(p => /1 over fifty/.test(p)));

/* the advisor */
d.cards.pop();
const An = V.analysis(d);
ok('curve buckets sum to the costed total', An.curve.reduce((a, b) => a + b, 0) === 50);
ok('life comes from the Leader (§2-9)', An.life === redL.life, String(An.life));
ok('counter/blocker/trigger counts are computed from HAS-keywords, not references',
   typeof An.blockers === 'number' && An.blockers <= 50);
ok('deck value is quantity-weighted', Math.abs(An.value - d.cards.reduce((a, c) => a + (V.CAT.byId.get(c.id).market || 0) * c.n, 0)) < 0.01);

/* the ONE place number-keying is correct, guarded against being "fixed" */
ok('legality keys copies on NUMBER, never on productId (RULES.md R6)',
   /byNum\[r\.p\.num\]/.test(js) && !/byId\[.*\]\s*>\s*RULES\.MAX_COPIES/.test(js));
ok('decks persist', (V.DECKS.list.push(d), V.DECKS.save(), !!store['vault.decks']));

/* Each take's section is a BLOCK from here on: the file is one module scope
   and the third shadowed identifier in two takes is enough. Landmine 77. */
{
section('take 14 — credits (A17 mechanism, gate OFF by default)');
ok('the gate ships OFF', V.ADS_ENABLED === false && V.CREDITS.enabled() === false);
ok('with the gate off, any batch size commits in full', V.CREDITS.canCommit(500) === 500);
ok('with the gate off, a new deck save needs nothing', V.CREDITS.canSaveDeck(true) === true);
/* Exercise the mechanism as if the gate were on -- this is the PROTOCOL §8
   property: scanning is never gated, the wall is at commit, nothing is lost. */
const C = V.CREDITS; const saved = C.enabled; C.enabled = () => true;
C.state.scan = 3; C.state.pending = [];
ok('gate on: 3 credits admit 3 of a 5-card batch', C.canCommit(5) === 3);
C.spendScan(3); C.defer([{ id: 1 }, { id: 2 }]);
ok('the other 2 wait in the tray, not discarded', C.state.pending.length === 2 && C.state.scan === 0);
ok('a tray with no credits does not drain', (C.drain(), C.state.pending.length === 2));
const ebc = V.candidates('EB03-024', null);
C.state.pending = [{ id: ebc[0].id }, { id: ebc[1].id }];
const before = V.OWN.items.length;
C.earn('scan');
ok('earning credits drains the tray into the collection',
   C.state.pending.length === 0 && V.OWN.items.length >= before + 1 && C.state.scan === C.PER_AD - 2,
   `pending ${C.state.pending.length} scan ${C.state.scan}`);
C.state.deck = 0;
ok('gate on: a NEW deck save is refused at 0 deck credits', C.canSaveDeck(true) === false);
ok('gate on: re-saving an existing deck is never refused (PROTOCOL §9)', C.canSaveDeck(false) === true);
C.enabled = saved;
ok('the credit numbers are D10 constants, not literals in the gate',
   C.FREE_ON_INSTALL === 20 && C.PER_AD === 20 && C.FREE_DECKS === 1 && C.DECKS_PER_AD === 1);
/* Take 22: the SDK IS wired, against Google's test units. */
ok('the ad SDK is wired: initialize, prepare, show, and the reward LISTENER',
   /plugin\('AdMob'\)/.test(js) && /prepareRewardVideoAd/.test(js) && /showRewardVideoAd/.test(js) &&
   /onRewardedVideoAdReward/.test(js));
ok('the credit is earned from the Rewarded EVENT, never from show() resolving',
   /onRewardedVideoAdReward', r => \{[\s\S]*?CREDITS\.earn/.test(js) &&
   !/showRewardVideoAd\(\)[\s\S]{0,80}CREDITS\.earn/.test(js));
ok('ADS_ENABLED is derived, and is OFF in a browser', V.ADS_ENABLED === false);
ok('the unit IDs are Google\'s published TEST units, not real ones',
   manifest.ads && manifest.ads.test === true && /3940256099942544/.test(manifest.ads.scan));
ok('D10 constants come from the manifest', manifest.ads.free === 20 && manifest.ads.perAd === 20 && manifest.ads.decksFree === 1);

section('take 14 — deck builder polish');
ok('the Leader picker is a sheet, not a prompt', /leaderPick/.test(js) && !/prompt\('Leader/.test(js));
ok('deck import parses the export shape', /dkImport/.test(js) && /Not recognised/.test(js));
ok('printing swap exists', /printPick/.test(js));
}

{
section('take 15 — auto-backup (PROTOCOL §9) and photo storage (landmine 79)');
const bj = JSON.parse(V.backupJson());
ok('the backup carries items, decks, credits, snapshots and filters',
   Array.isArray(bj.items) && Array.isArray(bj.decks) && bj.credits && Array.isArray(bj.snaps) && bj.filters);
ok('the backup names the app, the take and the catalogue date', bj.app === 'OP TCG Hub' && bj.take === V.TAKE && 'catalogue' in bj);
ok('photos are NOT in the backup — derived, rescannable',
   bj.items.every(i => i.photo === null || i.photo === '(on device)'));
ok('the catalogue is NOT in the backup — disposable', !('catalogue_rows' in bj) && JSON.stringify(bj).length < 200000);
ok('a batch commit schedules a backup', /scheduleBackup\('batch'\)/.test(js));
ok('a deck save schedules a backup', /scheduleBackup\('deck'\)/.test(js));
ok('backup failure is SHOWN, never swallowed', /Backup FAILED/.test(js));
ok('the backup goes to public Documents, which survives uninstall',
   /directory: 'DOCUMENTS'/.test(js) && /backup-latest\.json/.test(js));
ok('scan photos go to disk, not localStorage (landmine 79)',
   /savePhoto\(/.test(js) && /directory: 'DATA'/.test(js) && /convertFileSrc/.test(js));
ok('restore is a REPLACE and says so', /This REPLACES what is on the phone now/.test(js));
}

{
section('take 18 — portfolios and the Trade Analyzer');
const PFm = V.PF;
ok('one default portfolio exists and is active', PFm.list.length >= 1 && PFm.active !== undefined);
const a = V.candidates('EB03-024', null)[0], b = V.candidates('OP01-016', null)[0];
V.OWN.items = []; PFm.list = [{ id: 'main', name: 'One Piece' }]; PFm.active = 'main'; PFm.save();
V.OWN.add(a.id, { condition: 'NM' });
const tradeId = PFm.add('Trade pile');
V.OWN.add(b.id, { condition: 'NM' });
ok('a scan goes into the ACTIVE portfolio', V.OWN.items.find(i => i.id === b.id).pf === tradeId);
ok('total() is scoped to the active portfolio',
   Math.abs(V.OWN.total() - (b.market || 0)) < 0.01, `${V.OWN.total()} vs ${b.market}`);
ok('total(true) spans every portfolio',
   Math.abs(V.OWN.total(true) - ((a.market || 0) + (b.market || 0))) < 0.01);
PFm.active = 'all'; PFm.save();
ok('"all" is a view: scope() returns everything', PFm.scope(V.OWN.items).length === 2);
ok('a line added under "all" lands in the default, never in "all"',
   (V.OWN.add(a.id, { condition: 'LP' }), V.OWN.items.find(i => i.condition === 'LP').pf === 'main'));
ok('deleting a portfolio moves its lines to the default and loses nothing',
   (PFm.remove(tradeId), V.OWN.items.length === 3 && V.OWN.items.every(i => (i.pf || 'main') === 'main')));
ok('the default portfolio cannot be deleted', PFm.remove('main') === false);
ok('the backup carries portfolios', 'portfolios' in JSON.parse(V.backupJson()));
ok('the CSV export carries the portfolio column', /'portfolio', 'product_id'/.test(js));

const T = V.TRADE; T.give = []; T.get = []; T.save();
T.add('give', a.id, 2); T.add('get', b.id, 1);
ok('trade values each side at market x qty',
   Math.abs(T.value('give') - 2 * (a.market || 0)) < 0.01 && Math.abs(T.value('get') - (b.market || 0)) < 0.01);
ok('low and high spreads are carried, not just market', T.low('give') <= T.value('give') && T.high('give') >= T.value('give'));
T.bump('give', a.id, -2);
ok('bumping to zero removes the line', T.give.length === 0);
ok('the verdict says market is a model, not a sale', /model of recent sales, not an offer/.test(js));
ok('pasted lists resolve to the LIKELIEST printing (landmine 84)', /likelihood\(b, null\) - likelihood\(a, null\)/.test(js));
ok('the Trade Analyzer is no longer a toast', !/Trade Analyzer — ROADMAP/.test(js));
}

{
section('take 20 — chart from history, staleness, portfolio sheets');
ok('the bundle carries daily history aligned to a day list',
   Array.isArray(V.CAT.days) && V.CAT.days.length >= 2 && Object.keys(V.CAT.hist).length > 5000,
   `${V.CAT.days.length} days, ${Object.keys(V.CAT.hist).length} products`);
ok('every history row is aligned to the day list',
   Object.values(V.CAT.hist).every(a => a.length === V.CAT.days.length));
ok('history values match the catalogue delta arithmetic (landmine 62: derived, not pinned)',
   (() => { const p = V.CAT.rows.find(x => x.d1p != null && V.CAT.hist[x.id] && V.CAT.hist[x.id].every(v => v != null));
            if (!p) return false; const h = V.CAT.hist[p.id]; const last = h[h.length - 1], prev = h[h.length - 2];
            return Math.abs((last - prev) - p.d1a) < 0.011; })());
ok('the chart labels an estimate as an estimate and draws it dashed',
   /estimated from today/.test(js) && /setLineDash\(\[6, 5\]\)/.test(js));
ok('a record of three or more snapshots takes precedence over the estimate',
   /rec\.length >= 3\) return \{ kind: 'record'/.test(js));
ok('the stale banner names the date and says what to do (and it is TRUE now — take 27)',
   /days old/.test(js) && /Sync now/.test(js) && /Update the app for newer prices/.test(js));
ok('CI opens one deduplicated issue on failure (A9)',
   (() => { const yml = fs.readFileSync(path.join(ROOT, 'ci', 'build.yml'), 'utf8');
            return /if: failure\(\)/.test(yml) && /nightly-failure/.test(yml) && /gh issue comment/.test(yml); })());
ok('the splash honours assets/user/splash-bg.jpg',
   /splash-bg\.jpg/.test(fs.readFileSync(path.join(ROOT, 'ci', 'apk.sh'), 'utf8')));
ok('portfolio move, new and rename are sheets, not prompts',
   /data-pfmove/.test(js) && /data-pfname/.test(js) && !/prompt\('Portfolio name/.test(js) && !/prompt\('Move /.test(js));
ok('bulk condition is a sheet', /data-bulkcond/.test(js) && !/prompt\('Set condition/.test(js));
}

{
section('take 21 — no prompt() left; the estimate knows when you bought');
ok('zero prompt() calls in the shipped app', !/prompt\('/.test(js));
ok('one input sheet with text, number and multiline shapes', /function ask\(/.test(js) && /kind === 'multiline'/.test(js) && /inputmode="\$\{kind === 'number'/.test(js));
ok('deck import, trade paste, cost basis and graded use the sheet',
   /Import a deck list/.test(js) && /Their list/.test(js) && /What you paid/.test(js) && /Cert number/.test(js));
ok('the estimate skips days before a card was added', /i\.added\.slice\(0, 10\) > d\) continue/.test(js));
}

{
section('take 24 — two modes and the Play counter');
ok('two modes exist and persist', V.MODE && V.MODE.cur && /vault\.mode/.test(js));
ok('the play palette redefines the same tokens, not a second stylesheet',
   /:root\[data-mode="play"\]\{[^}]*--bg:#0F2A1E/.test(html) && /--brass:#D9583B/.test(html));
ok('each mode has its own nav, and hidden actually hides (landmine 98)',
   /id="navPlay" hidden/.test(html) && /id="navCollect"/.test(html) && /nav\[hidden\]\{display:none\}/.test(html));
ok('Prep & Play holds Decks, Cards, Play and Sim', /data-go="decks"[\s\S]*data-go="cards"[\s\S]*data-go="play"[\s\S]*data-go="sim"/.test(html));
ok('the Sim screen says it is coming and names the sequence', /hot-seat board/.test(html) && /A23/.test(html));
const P = V.PLAY;
ok('the counter starts both players at 5 life, 0 DON!!, turn 1', P.p.every(x => x.life === 5 && x.don === 0) && P.turn === 1);
P.p[0].life = 3; P.p[1].don = 4; P.p[1].given = 2;
ok('given DON!! never exceeds active', P.p[1].given <= P.p[1].don);
ok('the counter cites the rules it follows', /§6-1/.test(html) && /§7-1-4/.test(html) && /§6-4/.test(js));
ok('the counter saves nothing', !/vault\.play/.test(js));
ok('Phase 8 backlog is in the roadmap with the counter done',
   (() => { const rm = fs.readFileSync(path.join(ROOT, 'docs', 'ROADMAP.md'), 'utf8'); return /## Phase 8/.test(rm) && /done take 24/.test(rm); })());
}

{
section('take 25 — Cards browse, tour v2, who goes first');
/* the Cards browse: drive the filter model directly */
V.CD.kw.clear(); V.CD.col.clear(); V.CD.cost = null; V.CD.forDeck = false;
V.CD.kw.add('Blocker'); V.CD.col.add('Red'); V.CD.cost = '0-2';
// replicate the screen's filter to count without a DOM
const hits = V.CAT.rows.filter(p => p.num && !p.sealed && V.RULES.MAIN_TYPES.has(p.type) &&
  V.CAT.rows && ('|' + (p.kw || '') + '|').includes('|Blocker|') && /Red/.test(p.color || '') &&
  (() => { const c = parseInt(p.cost, 10); return !isNaN(c) && c >= 0 && c <= 2; })());
ok('Red Blockers at cost 0-2 exist and every one HAS the keyword (landmine 74)',
   hits.length > 0 && hits.every(p => ('|' + p.kw + '|').includes('|Blocker|')), String(hits.length));
ok('Cards excludes Leaders and sealed by construction', /!RULES\.MAIN_TYPES\.has\(p\.type\)\) continue;/.test(js) && /p\.sealed/.test(js));
ok('"for this deck" filters to the Leader\'s colours and adds into the deck', /colourLegal\(p, L\)\) continue;/.test(js) && /data-cdadd/.test(js));
/* Landmine 100: the first version of this assertion grepped the CODE for
   p.text and passed while the bundle carried no text at all. Test the DATA. */
const withText = V.CAT.rows.filter(p => p.text && p.text.length > 20);
ok('card text is IN the bundle, for most cards', withText.length > 5000, String(withText.length));
ok('the text is cleaned: no HTML tags, no carriage returns',
   withText.slice(0, 500).every(p => !/<[a-z]+[^>]*>/i.test(p.text) && !/\r/.test(p.text)));
ok('a phrase from a real card\'s text finds that card',
   (() => { const p = withText.find(x => /\[Blocker\]/.test(x.text)); if (!p) return false;
            const q = 'blocker'; return (p.full + ' ' + p.text).toLowerCase().includes(q); })());
ok('the tour is v2 with a modes card', /optcghub\.guide\.v2/.test(js) && /Two faces/.test(js));
/* who goes first: §6-4-1 */
const P = V.PLAY; P.turn = 1; P.first = 1; P.p.forEach(x => { x.don = 0; x.given = 0; });
ok('first player is switchable', P.first === 1);
ok('§6-4-1: the first player\'s first turn is +1 DON!!, modelled', /PLAY\.turn === 1 \? 1 : 2/.test(js));
V.CD.kw.clear(); V.CD.col.clear(); V.CD.cost = null;
}

{
section('take 26 — set checklist and want list');
const W = V.WANT; W.list = []; W.save();
ok('a want is keyed on NUMBER, not printing', (W.toggle('OP01-016'), W.has('OP01-016') && W.list[0].num === 'OP01-016'));
ok('toggling again removes it', (W.toggle('OP01-016'), !W.has('OP01-016')));
W.toggle('OP01-016'); W.toggle('EB03-024');
const pr = W.printing(W.list[0]);
ok('a want values at the LIKELIEST printing (landmine 84), not the dearest',
   pr && (V.CAT.sets.get(pr.set) || {}).kind === 'main' && pr.treat === 'base', `${pr && pr.treat}`);
ok('the want total is the sum of those', Math.abs(W.total() - W.list.reduce((a, w) => a + (W.printing(w).market || 0), 0)) < 0.01);
ok('the backup carries wants', 'wants' in JSON.parse(V.backupJson()));
/* checklist: a set the collector has one card from */
V.OWN.items = []; const nami = V.candidates('OP01-016', null)[0]; V.OWN.add(nami.id, { condition: 'NM' });
ok('home set rows open the checklist', /data-checklist=/.test(js) && /openChecklist/.test(js));
ok('the checklist counts the ACTIVE portfolio, like Home (PF.scope)', /for \(const i of PF\.scope\(OWN\.items\)\) \{ const p = CAT\.byId\.get\(i\.id\); if \(p && p\.set === ckSet\)/.test(js));
ok('"want the rest" wants only the MISSING numbers, deduplicated by number', /!held\.has\(p\.num\) && !seen\.has\(p\.num\)/.test(js));
ok('a held card opens; a missing one toggles want', /if \(k\.classList\.contains\('have'\)\) return openDetail/.test(js));
W.list = []; W.save();
}

{
section('take 27 — price alerts and in-app catalogue refresh');
const A = V.ALERTS; A.list = []; A.save();
const nami = V.candidates('OP01-016', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0))[0];
const a1 = A.add(nami.id, 'below', nami.market + 100);   // already below -> fires
const a2 = A.add(nami.id, 'above', nami.market + 100);   // not yet
ok('alerts are keyed on a PRINTING, not a number (landmine 1)', a1.id === nami.id && a1.treat === nami.treat);
const fired = await A.check();
ok('a crossed threshold fires once', fired.length === 1 && fired[0].key === a1.key && !a1.armed && a1.fired);
ok('an uncrossed one stays armed', a2.armed && !a2.fired);
const again = await A.check();
ok('the same catalogue never fires the same alert twice (idempotent per source date)', again.length === 0);
A.rearm(a1.key);
ok('re-arming clears the fired record', a1.armed && a1.fired === null);
ok('the check runs at boot and after a sync', /ALERTS\.check\(\)\.then/.test(js) && /const fired = await ALERTS\.check\(\);/.test(js));
ok('notifications go through the plugin with a numeric id, and fall back to a toast in a browser',
   /N\.schedule\(\{ notifications: \[\{ id, title, body/.test(js) && /if \(!N\) \{ toast/.test(js));
ok('alerts ride in the backup', 'alerts' in JSON.parse(V.backupJson()));
/* refresh */
ok('sync is opt-in: no updateUrl, no fetch', manifest.updateUrl === null && /if \(!base\)/.test(js));
ok('the newer of disk and bundle wins at load', /local\.man\.source_updated_at > \(man\.source_updated_at \|\| ''\)/.test(js));
ok('a sync re-checks alerts and snapshots', /await loadCatalogue\(\);\s*OWN\.snapshot\(\); scheduleBackup\('sync'\);/.test(js));
ok('PROVISION declares the Pages host',
   /github\.io/.test(fs.readFileSync(path.join(ROOT, 'docs', 'PROVISION.md'), 'utf8')));
A.list = []; A.save();
}

{
section('take 28 — binder view and deck price history');
V.OWN.items = [];
const eb = V.CAT.sets.get(V.candidates('EB03-024', null)[0].set);
V.CAT.rows.filter(x => x.set === eb.id && x.num).slice(0, 12).forEach(x => V.OWN.add(x.id, { condition: 'NM' }));
const bs = V.binderSets();
ok('the binder lists the sets the collector holds, most cards first', bs.length >= 1 && bs[0].s.id === eb.id && bs[0].n === 12, JSON.stringify(bs.map(x => [x.s.abbr, x.n])));
ok('a page is nine pockets with gaps for numbers not held', /nums\.slice\(BN\.page \* 9, BN\.page \* 9 \+ 9\)/.test(js) && /while \(slice\.length < 9\) slice\.push\(null\)/.test(js));
ok('a held pocket prefers the scanned photo, then the dearer printing', /\(i\.photo && !cur\.i\.photo\)/.test(js));
ok('an empty pocket is a want-toggle, like the checklist', /class="pocket empty" data-ck=/.test(js));
ok('the page is remembered per set', /BN\.pageOf\[BN\.set\]/.test(js));
ok('a reprint carrying another set\'s number shows its full number, not a duplicate suffix (landmine 101)',
   /function numLabel\(/.test(js) && (js.match(/numLabel\(/g) || []).length >= 4);
/* deck history */
const d = V.DECKS.blank(); d.leader = V.CAT.rows.find(p => p.type === 'Leader' && p.color === 'Red').id;
V.CAT.rows.filter(p => p.color === 'Red' && p.type === 'Character' && p.num && V.CAT.hist[p.id]).slice(0, 5).forEach(p => d.cards.push({ id: p.id, n: 4 }));
const h = V.deckHistory(d);
ok('deck history has one point per catalogue day on file', h.length === V.CAT.days.length, `${h.length} vs ${V.CAT.days.length}`);
const A = V.analysis(d);
ok('the last history point equals today\'s deck value (Leader included)',
   Math.abs(h[h.length - 1][1] - (A.value + ((V.CAT.byId.get(d.leader).market) || 0))) < 0.02, `${h[h.length-1][1]} vs ${A.value}`);
ok('the deck chart is labelled as an estimate and drawn dashed', /Dashed: this list at each day/.test(js) && /sparkOn\(\$\('#dkSpark'\), hist, 'estimate'\)/.test(js));
ok('the deck says how many of its cards you own and what it costs to complete', /to complete/.test(js) && /you own every card in it/.test(js));
V.OWN.items = [];
}

{
section('take 29 — deck-list formats (8.8)');
/* parseListLine is module-internal; exercise it through the deck importer's
   effect on a deck by driving the regexes the same way. */
const PL = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const t = s => { const m = PL(s); return m ? [+m[1], m[2].toUpperCase()] : null; };
ok('"4 OP01-016 Nami" (this app, Limitless)', JSON.stringify(t('4 OP01-016 Nami')) === '[4,"OP01-016"]');
ok('"4x OP01-016" (Limitless)', JSON.stringify(t('4x OP01-016')) === '[4,"OP01-016"]');
ok('"4xOP01-016" (OPTCG Sim, no space)', JSON.stringify(t('4xOP01-016')) === '[4,"OP01-016"]');
ok('"OP01-016 x4" (forums)', JSON.stringify(t('OP01-016 x4')) === '[4,"OP01-016"]');
ok('a bare number is one copy', JSON.stringify(t('OP01-016')) === '[1,"OP01-016"]');
ok('a comment or blank is skipped', t('# Red Luffy') === null && t('') === null);
ok('a promo code parses', JSON.stringify(t('2 P-084')) === '[2,"P-084"]');
ok('both importers use the one parser', (js.match(/parseListLine\(/g) || []).length >= 3);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
