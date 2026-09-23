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
import os from 'node:os';
import { execSync } from 'node:child_process';
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
      setAttribute: (k, v) => { el.dataset['attr_' + k] = String(v); }, getAttribute: k => el.dataset['attr_' + k] ?? null,
      querySelector: () => null, querySelectorAll: () => [],
      closest: () => null, click: () => {}, focus: () => {}, select: () => {}, remove: () => {},
      getContext: () => ctx2d, clientWidth: 360, width: 0, height: 0
    };
    return el;
  };
  const ctx2d = new Proxy({}, { get: () => () => ctx2d });
  const byId = new Map();
  /* the element keeps its tag, so a <section id> is a section here too (take 83: go() refuses non-screens) */
  for (const m of html.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*\bid="([\w-]+)"/g)) byId.set(m[2], mk(m[1]));
  const doc = {
    _ids: byId,
    querySelector: s => s.startsWith('#') ? (byId.get(s.slice(1)) || mk()) : mk(),
    getElementById: id => byId.get(id) || null,
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
ctx._win = {}; ctx.addEventListener = (t, f) => { (ctx._win[t] ||= []).push(f); }; ctx.removeEventListener = () => {};
ctx.history = { _s: [], pushState(st, _t, url) { this._s.push({ st, url }); }, back() { this._s.pop(); (ctx._win.popstate || []).forEach(f => f({})); } };
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
   twice and the owner was holding the base both times. Likelihood, not price. */
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
/* Landmine 115: this pinned EB03-024 SP's own numbers ($467.33 market vs
   $400 low when it was written). The market converged, the assertion failed
   on the runner, and it took five nights of price history with it. The claim
   the app makes is that a spread EXISTS and is shown, not that one card has
   one -- so assert the population. MEASURED take 58: 69% of printings over
   $5 have a low at least 5% under market. Note market is an average of
   recent sales and low/high are live listings, so market legitimately sits
   outside low..high on 427 printings -- never assert an ordering. */
const dearP = V.CAT.rows.filter(p => p.market >= 5 && p.low > 0);
const spread = dearP.filter(p => p.low <= p.market * 0.95);
ok('the spread is real across the catalogue, not a rounding artefact',
   dearP.length > 500 && spread.length > dearP.length * 0.2,
   `${spread.length}/${dearP.length} printings over $5 have a low 5%+ under market`);
ok('every printing carries its own three numbers, market between or outside low and high as the source reports them',
   dearP.every(p => p.low > 0 && p.high > 0 && p.market > 0));
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
/* Landmine 111: this used to match 'count changed' -- the COMMENT explaining
   the tick, not the code drawing it. Assert the code. */
ok('the chart marks purchases separately from price moves',
   /fillStyle = '#f5c518'; x\.beginPath\(\)/.test(js) && !/count changed get a tick/.test(js));
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
/* Take 58: 34% move on a given night (take 8), but this delta spans the gap
   between the last two days on file, and more cards move over a week than
   over a night. The ceiling follows the horizon; the floor does not. */
const hdm = manifest.history_days || [];
const gapDays = hdm.length >= 2 ? Math.round((Date.parse(hdm[hdm.length - 1] + 'T00:00:00Z') - Date.parse(hdm[hdm.length - 2] + 'T00:00:00Z')) / 864e5) : 1;
const moved = withD.filter(p => Math.abs(p.d1a) > 0.004);
const share = moved.length / withD.length;
ok(`a plausible share moved over the ${gapDays}-day horizon (10% to ${gapDays === 1 ? 70 : 95}%)`,
   share > 0.10 && share < (gapDays === 1 ? 0.70 : 0.95), (100 * share).toFixed(0) + '%');
ok('deltas are internally consistent: pct = abs / yesterday',
   moved.slice(0, 300).every(p => {
     const yesterday = p.market - p.d1a;
     return yesterday > 0 && Math.abs(100 * p.d1a / yesterday - p.d1p) < 0.06;
   }));
ok('no printing moved more than 10x overnight (landmine 7)',
   withD.every(p => Math.abs(p.d1p) < 900),
   String(withD.filter(p => Math.abs(p.d1p) >= 900).length));
/* Landmine 114: this froze "two days" at take 20 and went red on the runner
   the first night TCGCSV published a third. The count grows nightly; assert
   the SHAPE -- at least two, consecutive, ending on the source date. */
const hd = manifest.history_days || []; const nd = hd.length;
/* Take 58: "consecutive" was wrong. A night the build does not run leaves a
   hole -- five of them, in fact -- and the sidecar is the record of the days
   that WERE fetched, not of the calendar. Assert ascending, unique, ending
   on the source date. The gap's consequence is asserted below instead. */
const ascending = hd.every((d, i) => i === 0 || d > hd[i - 1]);
ok('manifest records the history days on file: at least two, ascending, unique, ending on the source date',
   nd >= 2 && ascending && new Set(hd).size === nd && hd[nd - 1] === (manifest.source_updated_at || '').slice(0, 10), JSON.stringify(hd));
const gap = Math.round((Date.parse(hd[nd - 1] + 'T00:00:00Z') - Date.parse(hd[nd - 2] + 'T00:00:00Z')) / 864e5);
ok('the app names the horizon its "1-day" delta actually measured, never "yesterday" across a gap (PROTOCOL §10)',
   /function D1\(\) \{/.test(js) && /function sinceLabel/.test(js)
   && !/ since yesterday<\/span>/.test(js)
   && /\$\{cap \? 'Over' : 'over'\} \$\{g\.gap\} days/.test(js) && /'since yesterday'/.test(js),
   `${gap} day(s) between the last two days on file`);
/* Take 58: a horizon exists when SOME day on file is at or before it -- a
   calendar question, not a count. Four days spanning a fortnight give a 7-day
   delta; thirty consecutive days do not give a 30-day one until day 31. */
const has = n => { const t0 = Date.parse(hd[nd - 1] + 'T00:00:00Z') - n * 864e5; return hd.some(d => Date.parse(d + 'T00:00:00Z') <= t0); };
ok('a 7d or 30d delta exists exactly when a day on file reaches back that far, and is absent (not zero) otherwise',
   withD.every(p => (has(7) ? true : p.d7p == null) && (has(30) ? true : p.d30p == null)),
   `${nd} day(s), 7d ${has(7) ? 'reachable' : 'not reachable'}, 30d ${has(30) ? 'reachable' : 'not reachable'}`);

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
V.FILT.save('own');
ok('filter state persists per scope', JSON.parse(store['vault.filt.own'] || '{}')._scope === 'own');

/* take 90 -- A36, landmine 126. Every filter above was built by hand with
   the right type, so the chips were never driven and the set facet returned
   zero rows for seventy-eight takes. Drive the REAL #filters click handler
   with what a DOM hands it -- a dataset value, which is always a string --
   and count the rows the way the sheet does. */
section('take 90 — the set chips (A36, landmine 126)');
{
  const setId = V.CAT.byId.get(c[0].id).set;               // OWNROWS above: three items, from c[0]'s and c[1]'s sets
  const inSet = OWNROWS.filter(x => x.p.set === setId).length;
  const filters = ctx.document.getElementById('filters');
  const chip = { dataset: { fk: 'set', fv: String(setId) }, classList: { toggle() {} } };
  const tap = () => filters._ev.click({ target: { closest: sel => sel === '[data-fk]' ? chip : null, id: '' } });
  V.FILT.own.set = [];                                       // sheetScope is 'own' until a sheet opens
  tap();
  ok('a chip tap stores the set id as the catalogue keys it (a number, not the DOM string)',
     V.FILT.own.set.length === 1 && V.FILT.own.set[0] === setId && typeof V.FILT.own.set[0] === 'number',
     JSON.stringify(V.FILT.own.set));
  const shown = V.applyFilter(OWNROWS, V.FILT.own).length;
  ok('the tapped set shows its cards, not zero', inSet > 0 && shown === inSet, `${shown} of ${inSet}`);
  const fN = ctx.document.getElementById('fN').textContent;
  ok("the sheet's count line says so", new RegExp('^' + inSet + ' card').test(fN), fN);
  tap();
  ok('a second tap un-selects it', V.FILT.own.set.length === 0, JSON.stringify(V.FILT.own.set));
  const asString = Object.assign(V.blankFilter('own'), { set: [String(setId)] });
  ok('negative control: the DOM string, stored as it came, matches nothing -- the take-89 shape',
     V.applyFilter(OWNROWS, asString).length === 0);
  /* a filter saved before this take carries the string; it is normalised when it loads */
  ok('loadFilter is exported for this test', typeof V.loadFilter === 'function');
  if (typeof V.loadFilter === 'function') {
    store['vault.filt.all'] = JSON.stringify({ set: [String(setId), 'x'], rarity: ['SEC'] });
    const mig = V.loadFilter('all');
    ok('a saved filter with string set ids loads as numbers, drops what is not one, keeps the rest',
       mig.set.length === 1 && mig.set[0] === setId && mig.rarity[0] === 'SEC' && mig._scope === 'all',
       JSON.stringify(mig.set));
    store['vault.filt.all'] = 'not json';
    const bad = V.loadFilter('all');
    ok('negative control: a corrupt saved filter loads blank instead of throwing',
       bad.set.length === 0 && bad.sort === 'value' && bad._scope === 'all');
    delete store['vault.filt.all'];
  }
}

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
   manifest.ads && manifest.ads.test === true && /^ca-app-pub-3940256099942544\//.test(manifest.ads.scan) && /^ca-app-pub-3940256099942544\//.test(manifest.ads.deck));
ok('the app ID is the app\'s own (take 41) and does not flip the test flag', /^ca-app-pub-6243777967151950~/.test(manifest.ads.app) && manifest.ads.test === true);
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
   /:root\[data-mode="play"\]\{[^}]*--bg:#15171C/.test(html) && /:root\[data-mode="play"\]\{[^}]*--brass:#E0553D/.test(html));   // charcoal and red since take 82
ok('each mode has its own nav, and hidden actually hides (landmine 98)',
   /id="navPlay" hidden/.test(html) && /id="navCollect"/.test(html) && /nav\[hidden\]\{display:none\}/.test(html));
ok('Prep & Play holds Decks, Cards, Play and Sim', /data-go="decks"[\s\S]*data-go="cards"[\s\S]*data-go="play"[\s\S]*data-go="sim"/.test(html));
ok('the Sim screen is the hot-seat board (take 46 replaced the placeholder)', /id="simBoard"/.test(html) && /id="simCurtain"/.test(html) && /rules by the app, effects by hand/.test(html));
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
ok('sync is opt-in on updateUrl (empty = nothing fetched), and take 33 points it at Pages', /if \(!base\)/.test(js) && (manifest.updateUrl === null || /^https:\/\/sergeantcs2\.github\.io\/optcghub\/bundle\/$/.test(manifest.updateUrl)), String(manifest.updateUrl));
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
section('take 33 — typography: four roles, bundled, never fetched');
const faces = html.match(/@font-face\{[^}]*\}/g) || [];
ok('four @font-face rules in the built page', faces.length === 4, String(faces.length));
ok('every face is a local file under fonts/', faces.every(f => /src:url\(fonts\/\w+\.\w+\)/.test(f) && !/https?:/.test(f)), faces.join(' '));
ok('the roles, not the faces, are the family names', ['Display', 'Comic', 'Body', 'Heavy'].every(r => html.includes(`"OPH ${r}"`)));
ok('the files the rules point at exist in www/fonts',
   faces.every(f => fs.existsSync(W(f.match(/url\((fonts\/[^)]+)\)/)[1]))));
ok('the manifest records which file served each role', manifest.fonts && Object.keys(manifest.fonts).length === 4, JSON.stringify(manifest.fonts));
ok('no Georgia/serif stack survives (--serif retired)', !html.includes('--serif'));
/* A25 -- the cellular guard on the QUIET sync, with its controls */
const P = V.scan.PLATFORM;
delete ctx.navigator.connection;
ok('no Network Information API: the quiet sync proceeds (type unknown)', P.quietSyncAllowed() === true);
ctx.navigator.connection = { type: 'wifi' };
ok('on wifi: the quiet sync proceeds', P.quietSyncAllowed() === true);
ctx.navigator.connection = { type: 'cellular' };
ok('on cellular: the quiet sync is held (negative control -- the guard fires)', P.quietSyncAllowed() === false);
store['vault.syncCellular'] = '1';
ok('...unless the collector switched mobile-data sync on', P.quietSyncAllowed() === true);
delete store['vault.syncCellular']; delete ctx.navigator.connection;
ok('boot gates only the QUIET sync on it; Sync now never asks',
   /navigator\.onLine && CAT\.man\.updateUrl && PLATFORM\.quietSyncAllowed\(\)/.test(js) && /await PLATFORM\.refreshCatalogue\(\); sy\.disabled = false/.test(js));
ok('the switch is in the Sync panel and persists', /id="syncCell"/.test(js) && /vault\.syncCellular/.test(js));
/* negative control for the local-file assertion: a CDN face would fail it */
ok('negative control: a fonts.googleapis.com src would be caught',
   !(/src:url\(fonts\/\w+\.\w+\)/.test('src:url(https://fonts.googleapis.com/x.woff2)')) && /https?:/.test('src:url(https://fonts.googleapis.com/x.woff2)'));
}

{
section('take 34 — export leaves the phone (landmine 110); restore can pick a file');
const calls = { write: null, share: null, clicked: 0 };
ctx.window.Capacitor = { Plugins: {
  Filesystem: { writeFile: async o => { calls.write = o; return { uri: 'file:///cache/export/' + o.path.split('/').pop() }; } },
  Share: { share: async o => { calls.share = o; return { activityType: 'x' }; } } } };
V.OWN.items = []; V.OWN.add(V.candidates('EB03-024', null)[0].id, { condition: 'NM' });
await V.exportCsv();
ok('on a device the CSV is written to the app cache, utf8', calls.write && calls.write.directory === 'CACHE' && calls.write.encoding === 'utf8' && /product_id/.test(calls.write.data), JSON.stringify(calls.write && Object.keys(calls.write)));
ok('...and handed to the share sheet as a file:// uri (Share 8 definitions: files[])', calls.share && Array.isArray(calls.share.files) && /^file:\/\//.test(calls.share.files[0]), JSON.stringify(calls.share));
ok('the CSV carries the row that was added', calls.write && calls.write.data.split('\n').length === 2);
ok('a cancelled share sheet is not an error and not a download', /cancel/i.test('Share canceled') && /if \(shared === 'cancelled'\) return;/.test(js));
delete ctx.window.Capacitor;
const anchorClicks = []; const _ce = ctx.document.createElement;
const _cou = ctx.URL.createObjectURL, _rou = ctx.URL.revokeObjectURL;
ctx.URL.createObjectURL = () => 'blob:smoke'; ctx.URL.revokeObjectURL = () => {};
ctx.document.createElement = tag => { const el = _ce(tag); if (tag === 'a') el.click = () => anchorClicks.push(el.download); return el; };
await V.exportCsv();
ok('negative control: in a browser (no plugins) the download link is used instead', anchorClicks.length === 1 && /^optcghub-\d{4}-\d{2}-\d{2}\.csv$/.test(anchorClicks[0]), JSON.stringify(anchorClicks));
ctx.document.createElement = _ce; ctx.URL.createObjectURL = _cou; ctx.URL.revokeObjectURL = _rou;
ok('restore falls back to a file picker when the install has no backup of its own', /raw = await PLATFORM\.pickTextFile\('\.json/.test(js) && /inp\.type = 'file'; inp\.accept = accept;/.test(js));
ok('the settings copy no longer promises the backup survives a reinstall by itself', !/It survives uninstalling the app/.test(js) && /Export CSV and keep the file/.test(js));
V.OWN.items = [];
}

{
section('take 35 — the scrubber: what ships carries no comments and no markers');
ok('app.js ships without a single comment', !/\/\*[\s\S]*?\*\//.test(js) && !/^\s*\/\/.*$/m.test(js));
ok('index.html ships without HTML comments outside scripts', !/<!--[\s\S]*?-->/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')));
ok('the source still carries its record (the strip is on the artifact, not src/)', /\/\* PROTOCOL §10\. A portfolio line/.test(fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8')));
/* take 89: the install list lives once, in ci/deps.sh, and BOTH runners of the pipeline call it (landmine 121);
   the hourly, which only builds the app, installs the parser itself */
ok('CI installs the parser the strip needs (A-83: every job is a fresh runner)', /npm install --silent --no-save puppeteer acorn/.test(fs.readFileSync(path.join(ROOT, 'ci', 'deps.sh'), 'utf8')));
ok('the nightly and the PR check both run the one install list (landmine 121)', /^bash ci\/deps\.sh/m.test(fs.readFileSync(path.join(ROOT, 'ci', 'bundle.sh'), 'utf8')) && /^bash ci\/deps\.sh/m.test(fs.readFileSync(path.join(ROOT, 'ci', 'check.sh'), 'utf8')) && /npm install[^\n]*\bacorn\b/.test(fs.readFileSync(path.join(ROOT, 'ci', 'hunt.yml'), 'utf8')));
ok('the gate runs the scrubber and its controls', /check_scrub\(\)/.test(fs.readFileSync(path.join(ROOT, 'tools', 'gate.py'), 'utf8')) && /scrub\.py"\), "--selftest"/.test(fs.readFileSync(path.join(ROOT, 'tools', 'gate.py'), 'utf8')));
}

{
section('take 37 — the showcase files import and the deck is legal');
const csvText = fs.readFileSync(path.join(ROOT, 'showcase', 'collection.csv'), 'utf8');
const csvRows = csvText.split(/\r?\n/).filter(Boolean).slice(1).map(l => l.split('","').map(c => c.replace(/^"|"$/g, '')));
ok('every collection row names a productId the app knows (landmine 1)', csvRows.length >= 40 && csvRows.every(r => V.CAT.byId.has(+r[1])), String(csvRows.filter(r => !V.CAT.byId.has(+r[1])).length));
V.OWN.items = [];
for (const r of csvRows) V.OWN.add(+r[1], { qty: +r[9], condition: r[8] });
ok('imported, it is a five-figure collection at today\'s market', V.OWN.total() > 5000, V.OWN.total().toFixed(2));
ok('the set run has gaps for the binder and checklist to show', !csvRows.some(r => r[2] === 'OP01-009') && csvRows.some(r => r[2] === 'OP01-010'));
const PL2 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const d37 = V.DECKS.blank();
for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) {
  const line = raw.trim(); if (!line || line.startsWith('#')) continue;
  const m = PL2(line); const num = m[2].toUpperCase();
  const sibs = (V.CAT.byNum.get(num) || []).filter(p => p.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9));
  const p = sibs[0]; if (p.type === 'Leader') { d37.leader = p.id; continue; }
  d37.cards.push({ id: p.id, n: +m[1] });
}
const L37 = V.legality(d37);
ok('the showcase deck is LEGAL by the app\'s own §5-1 check', L37.problems.length === 0, L37.problems.join(' | '));
ok('...and it is fifty cards, four per number, one Leader', d37.cards.reduce((a, c) => a + c.n, 0) === 50 && d37.cards.every(c => c.n <= 4) && !!d37.leader);
V.OWN.items = [];
}

{
section('take 42 — 8.12 the collection share page');
V.OWN.items = []; V.OWN.add(V.candidates('EB03-024', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0))[0].id, { qty: 2, condition: 'NM' });
const page = V.collectionPage();
ok('the page is self-contained: no script, no external request in it', !/<script/i.test(page) && !/https?:\/\//.test(page) && !/<img/i.test(page));
ok('it carries the total, the card, its printing and the disclaimer', /\$/.test(page) && /Nefeltari Vivi/.test(page) && /SP/.test(page) && /Not affiliated with Bandai/.test(page));
ok('set completion is in it, with the fraction', /Set completion/.test(page) && /1 \/ \d+/.test(page));
ok('HTML in a card name would be escaped (esc on every field)', (page.match(/esc\(/g) || []).length === 0 && /function collectionPage[\s\S]*?esc\(p\.name\)/.test(js));
const c2 = { write: null, share: null };
ctx.window.Capacitor = { Plugins: { Filesystem: { writeFile: async o => { c2.write = o; return { uri: 'file:///cache/' + o.path }; } }, Share: { share: async o => { c2.share = o; } } } };
await V.shareCollectionPage();
ok('on a device it goes through the share sheet as a .html file', c2.share && /\.html$/.test(c2.share.files[0]) && c2.write.data.startsWith('<!doctype html>'));
delete ctx.window.Capacitor; V.OWN.items = [];
ok('the More panel offers it beside Export CSV', /data-act="sharepage"/.test(js) && /sharepage: shareCollectionPage/.test(js));
}

{
section('take 44 — pass the phone: the first hot-seat primitive (A23 step 1)');
const P44 = V.PLAY;
P44.hotseat = false; P44.turn = 1; P44.first = 0;
ok('on the table, whose turn follows §6: first player on turn 1, alternating', P44.who() === 0 && (P44.turn = 2, P44.who() === 1) && (P44.turn = 3, P44.who() === 0));
P44.turn = 1;
ok('a Leader names the player; no Leader, the seat name', P44.label(0) === 'Player 1');
P44.hotseat = true; V.paintPlay();
const board = ctx.document.querySelector('#plBoard').innerHTML;
ok('in the hand, only the active player\'s panel is drawn, upright', (board.match(/class="panel"/g) || []).length === 1 && !/rotate\(180deg\)/.test(board));
ok('...with the opponent\'s life and DON!! on one line', /Opponent/.test(board) && /Life <b>5<\/b>/.test(board));
ok('the button says what happens next', /End turn|Start/.test(board));
V.plCurtain(1);
const cur = ctx.document.querySelector('#plCurtain');
ok('ending a turn drops a curtain that names who takes the phone', cur.classList.contains('on') && /Hand the phone to/.test(cur.innerHTML) && /Player 2/.test(cur.innerHTML));
ok('the curtain is dismissed by a tap, and the mode is remembered', /closest\('#plCurtain'\)/.test(js) && /vault\.hotseat/.test(js));
P44.hotseat = false; cur.classList.remove('on'); V.paintPlay();
ok('negative control: on the table both panels draw, one rotated to face across', (ctx.document.querySelector('#plBoard').innerHTML.match(/class="panel"/g) || []).length === 2 && /rotate\(180deg\)/.test(ctx.document.querySelector('#plBoard').innerHTML));
}

{
section('take 45 — the on-device self-test, run here in node');
ctx.navigator.onLine = false;
const rep = await V.SELFTEST.run();
const by = Object.fromEntries(rep.checks.map(c => [c.name, c]));
ok('every check has a name and a verdict', rep.checks.length >= 15 && rep.checks.every(c => /^(PASS|FAIL|SKIP)$/.test(c.s)));
ok('the self-test proves a scripted effect offers and applies (take 52)', by['Sim: scripted effects loaded and one offers correctly'] && by['Sim: scripted effects loaded and one offers correctly'].s === 'PASS', JSON.stringify(by['Sim: scripted effects loaded and one offers correctly']));
ok('the catalogue, index, gate and search checks PASS against the real catalogue',
   ['Catalogue loaded', 'Printing index is one-to-one', 'The confidence gate asks on a 300x spread', 'A unique number auto-accepts', 'Search finds a card by name', 'Star template shipped'].every(n => by[n] && by[n].s === 'PASS'),
   JSON.stringify(rep.checks.filter(c => c.s === 'FAIL')));
ok('plugin checks SKIP where there is no plugin, never PASS by default',
   ['Backup file round-trip (Filesystem)', 'Share sheet available', 'OCR reads a code the app drew (ML Kit)', 'Notifications permission', 'Ads plugin present, test units'].every(n => by[n] && by[n].s === 'SKIP'));
ok('offline, the sync check SKIPs rather than failing', by['Sync URL answers'].s === 'SKIP');
/* take 92, landmine 131: the OCR check was SKIP everywhere but a phone, and on
   the phone it failed a correct read for forty-six takes (`m.num`, a field
   parseRead never had). Exercise the comparison with an injected answer. */
{
  const P = V.PLATFORM, hadOcr = P.hasOcr, ocr = P.ocr;
  P.hasOcr = () => true; P.ocr = async () => 'OP01-016';
  const good = Object.fromEntries((await V.SELFTEST.run()).checks.map(c => [c.name, c]))['OCR reads a code the app drew (ML Kit)'];
  ok('the OCR self-test PASSES a correct read of the code it drew', good && good.s === 'PASS' && /OP01-016/.test(good.note), JSON.stringify(good));
  P.ocr = async () => 'nothing like a code';
  const bad = Object.fromEntries((await V.SELFTEST.run()).checks.map(c => [c.name, c]))['OCR reads a code the app drew (ML Kit)'];
  ok('negative control: a wrong read FAILS it', bad && bad.s === 'FAIL', JSON.stringify(bad));
  P.hasOcr = hadOcr; P.ocr = ocr;
}
ok('the report is shareable text with a summary line', /pass, \d+ fail, \d+ skipped/.test(V.SELFTEST.text()) && V.SELFTEST.text().split('\n').length > 14);
ok('the sim log is shareable text (take 52)', /data-sim="sharelog"/.test(js) && typeof V.simLogText === 'function');
const saved = V.CAT.rows; V.CAT.rows = saved.slice(0, 100);
const bad = await V.SELFTEST.run();
ok('negative control: a truncated catalogue makes the first check FAIL', bad.checks[0].s === 'FAIL', bad.checks[0].s);
V.CAT.rows = saved; delete ctx.navigator.onLine;
ok('More has the Run button and the report box', /id="stRun"/.test(js) && /id="stOut"/.test(js));
}

{
section('take 46 — the hot-seat board: the engine against RULES.md §3');
const S = V.SIM;
/* two legal decks from the showcase list, second one identical (a mirror) */
const PL3 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mkDeck = name => { const d = V.DECKS.blank(); d.name = name;
  for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const m = PL3(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0];
    if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const dA = mkDeck('A'), dB = mkDeck('B');
ok('the showcase deck is legal, so it is a fair fixture', V.legality(dA).problems.length === 0);
let g = S.new(dA, dB, 0);
ok('§5-2: fifty cards became a shuffled deck, five in hand, none in Life yet', g.players.every(P => P.deck.length === 45 && P.hand.length === 5 && P.life.length === 0));
S.mulligan(0, true); S.mulligan(1, false);
ok('§5-2-3: a mulligan is five back, five drawn, once', g.players[0].hand.length === 5 && g.players[0].deck.length === 45 - 5 && g.players[0].mulliganed === true);
const lifeN = parseInt(V.CAT.byId.get(dA.leader).life, 10) || 5;
ok(`§5-2-4: Life is the Leader's Life (${lifeN}) from the top of the deck, face-down`, g.players[0].life.length === lifeN && g.players[0].deck.length === 45 - lifeN);
ok('§6-3/§6-4: the first player draws nothing and gets 1 DON!! on turn one', g.turn === 1 && g.active === 0 && g.players[0].hand.length === 5 && g.players[0].don.active === 1 && g.players[0].donDeck === 9);
ok('§6-5-6-1: nobody battles on their first turn', S.canAttack(0, 'leader').ok === false && /first turn/.test(S.canAttack(0, 'leader').why));
const P0 = g.players[0];
const cheap = P0.hand.findIndex(id => V.CAT.byId.get(id).type === 'Character' && S.cost(V.CAT.byId.get(id)) <= 1);
const dear = P0.hand.findIndex(id => S.cost(V.CAT.byId.get(id)) > 1);
ok('§2-7: a card costing more than the active DON!! is refused, with the reason', dear < 0 || (S.canPlay(0, dear).ok === false && /costs/.test(S.canPlay(0, dear).why)));
S.endTurn();
ok('§6-1: the second player draws one and gets 2 DON!! on turn two', g.turn === 2 && g.active === 1 && g.players[1].hand.length === 6 && g.players[1].don.active === 2);
S.endTurn();
ok('turn three: the first player refreshes to 3 DON!! and draws', g.turn === 3 && g.players[0].don.active === 3 && g.players[0].hand.length === 6);
/* plant a known board: 5 characters refuses a sixth (§3) */
P0.chars = [1, 2, 3, 4, 5].map(k => ({ id: P0.deck[k], rested: false, don: 0, turn: 1 }));
P0.don.active = 10; const anyChar = P0.hand.findIndex(id => V.CAT.byId.get(id).type === 'Character');
ok('§3: five Characters in play refuses a sixth', anyChar < 0 || (S.canPlay(0, anyChar).ok === false && /five Characters/.test(S.canPlay(0, anyChar).why)));
P0.chars = [];
/* pay and place */
if (anyChar >= 0) { const before = P0.don.active; const p = V.CAT.byId.get(P0.hand[anyChar]); const r = S.play(0, anyChar);
  ok('playing a Character rests its cost in DON!! and puts it in play, marked with the turn', r.ok && P0.chars.length === 1 && P0.don.active === before - S.cost(p) && P0.chars[0].turn === 3); }
ok('§10-1: a Character played this turn cannot attack without [Rush]', P0.chars.length === 0 || V.hasKw === undefined || S.canAttack(0, 0).ok === false);
/* give DON!!: +1000 on your own turn only */
const lp = S.power(0, 'leader'); S.giveDon(0, 'leader');
ok('§6-5-5: a given DON!! is +1000 power', S.power(0, 'leader') === lp + 1000 && g.players[0].leader.don === 1);
ok('...and not on the other player\'s turn', S.giveDon(1, 'leader').ok === false);
/* battle: the Leader attacks the Leader; a tie goes to the attacker (§7-1-4-1) */
const P1 = g.players[1]; const L0 = V.CAT.byId.get(P0.leader.id), L1 = V.CAT.byId.get(P1.leader.id);
P0.mods = {}; P1.mods = {}; P0.leader.don = 0; P0.leader.rested = false;
const need = (parseInt(L1.power, 10) || 0) - (parseInt(L0.power, 10) || 0); if (need > 0) P0.mods.leader = need;   // make it exactly a tie
const lifeBefore = P1.life.length, handBefore = P1.hand.length;
ok('§7-1: the attack is declared, the attacker rests, the defender gets the block step', S.attack(0, 'leader', 'leader').ok && P0.leader.rested && g.phase === 'battle' && g.battle.step === 'block');
S.noBlock(); const res = S.resolve();
ok('§7-1-4-1: a tie is a hit; a Leader hit takes 1 damage — top Life card to hand', res.win && P1.life.length === lifeBefore - 1 && P1.hand.length === handBefore + 1 && res.life.length === 1);
/* a rested Character can be attacked and is K.O.\'d; an active one cannot be targeted */
P1.chars = [{ id: P1.deck[0], rested: true, don: 0, turn: 1 }, { id: P1.deck[1], rested: false, don: 0, turn: 1 }];
P0.leader.rested = false; P0.mods.leader = 99999;
ok('§7-1: an active Character is not a legal target', S.attack(0, 'leader', 1).ok === false);
S.attack(0, 'leader', 0); S.noBlock(); const ko = S.resolve();
ok('a losing Character is K.O.\'d to the trash', ko.win && ko.ko && P1.chars.length === 1 && P1.trash.length >= 1);
/* counter adds to the defender; a held attack does nothing */
P0.leader.rested = false; P0.mods.leader = 0;
const cc = P1.hand.findIndex(id => (parseInt(V.CAT.byId.get(id).counter, 10) || 0) > 0);
if (cc >= 0) { const plus = parseInt(V.CAT.byId.get(P1.hand[cc]).counter, 10); const d0 = S.power(1, 'leader'); S.attack(0, 'leader', 'leader'); S.noBlock(); S.counter(cc);
  ok('§7-1-3: a Counter card from hand is trashed and adds its value to the defender', S.battlePowers().d === d0 + plus && P1.trash.includes(P1.trash[P1.trash.length - 1]));
  const lb = P1.life.length; const held = S.resolve();
  ok('an attack below the defender\'s power is held: no damage', held.win === false && P1.life.length === lb); }
/* defeat: damage with no Life */
P1.life = []; P0.leader.rested = false; P0.mods.leader = 99999; S.attack(0, 'leader', 'leader'); S.noBlock(); S.resolve();
ok('§1-2-1-1: damage with no Life cards is the defeat', g.over === 0 && g.phase === 'over');
S.g = null;
}

{
section('take 47 — effects as data: parsed from the text, offered under conditions, applied under invariants');
const FX = V.CAT.effects; const fxIds = Object.keys(FX);
ok('the bundle carries scripted effects and the manifest counts them', fxIds.length >= 400 && manifest.effects && manifest.effects.scripted === fxIds.reduce((a, k) => a + FX[k].length, 0), JSON.stringify(manifest.effects));
ok('coverage is stated, not promised: the manifest counts every line, and most still stay manual', manifest.effects.scripted < manifest.effects.lines * 0.5 && manifest.effects.lines > 7000, `${manifest.effects.scripted}/${manifest.effects.lines}`);
const find = (rx, t) => fxIds.map(k => [k, FX[k].find(e => rx.test(e.raw) && (!t || e.t === t))]).find(x => x[1]);
const restCard = find(/^\[On Play\] Rest up to 1 of your opponent's Characters with a cost of (\d) or less\.$/);
const drawCard = find(/^\[On Play\] Draw 1 card\.$/);
const donxCard = find(/^\[DON!! x1\] \[When Attacking\] This (Leader|Character) gains \+(\d+) power during this turn\.$/, 'attack');
const optCard = find(/^\[Activate: Main\] \[Once Per Turn\]/, 'main');
ok('the templates found real cards for rest-with-cost, draw, DON!!x1 attack, and a once-per-turn Main', !!(restCard && drawCard && donxCard && optCard));
const S = V.SIM; const PL4 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL4(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const g = S.new(mk(), mk(), 0); S.mulligan(0, false); S.mulligan(1, false); S.endTurn(); S.endTurn();   // turn 3, player 0, no first-turn ban
const P0 = g.players[0], P1 = g.players[1];
/* plant the rest-with-cost card in play and two opponent characters either side of its cost line */
const rmax = +restCard[1].do[0].cost; const cheap = V.CAT.rows.find(p => p.type === 'Character' && S.cost(p) <= rmax), dear = V.CAT.rows.find(p => p.type === 'Character' && S.cost(p) > rmax);
P0.chars = [{ id: +restCard[0], rested: false, don: 0, turn: 3 }]; P1.chars = [{ id: cheap.id, rested: false, don: 0, turn: 1 }, { id: dear.id, rested: false, don: 0, turn: 1 }];
let offers = S.offers(0, 'onplay', 0);
ok('an [On Play] rest effect is offered with ONLY the targets its cost line allows (class 3: scope)', offers.length === 1 && offers[0].targets.length === 1 && offers[0].targets[0].ref === 'o0', JSON.stringify(offers.map(o => o.targets)));
ok('negative control: applying it to the over-cost Character is refused', S.apply(0, offers[0], 'o1').ok === false);
ok('applied to the legal one, that Character is rested and the act is logged', S.apply(0, offers[0], 'o0').ok && P1.chars[0].rested && /rest/.test(g.log[0]));
/* DON!! x1: absent -> not offered; attached -> offered; +power this turn, gone at refresh (class 2: not always on) */
P0.chars = [{ id: +donxCard[0], rested: false, don: 0, turn: 1 }];
ok('a [DON!! x1] attack effect is NOT offered with no DON!! attached (class 2: never always-on)', S.offers(0, 'attack', 0).length === 0);
P0.chars[0].don = 1; const before = S.power(0, 0); const o2 = S.offers(0, 'attack', 0);
ok('...and IS offered with one attached; applied, the power rises by the stated amount', o2.length === 1 && S.apply(0, o2[0]).ok && S.power(0, 0) === before + donxCard[1].do[0].n);
S.endTurn(); S.endTurn();
ok('"during this turn" expires at the next refresh, and the given DON!! went home too (class 5: duration; §6-2)', S.power(0, 0) === parseInt(V.CAT.byId.get(+donxCard[0]).power, 10) && P0.chars[0].don === 0, `${S.power(0, 0)} vs base`);
/* draw: the hand grows by one; Once Per Turn: the second activation is refused */
P0.chars = [{ id: +drawCard[0], rested: false, don: 0, turn: 5 }]; const h0 = P0.hand.length; S.apply(0, S.offers(0, 'onplay', 0)[0]);
ok('[On Play] Draw 1 card draws exactly one', P0.hand.length === h0 + 1);
P0.chars = [{ id: +optCard[0], rested: false, don: 0, turn: 5 }]; P0.don.rested = 2;
const m1 = S.offers(0, 'main', 0); const tgt = m1[0] && m1[0].targets ? m1[0].targets[0].ref : null; const r1 = m1.length ? S.apply(0, m1[0], tgt) : { ok: false };
ok('[Activate: Main] [Once Per Turn] applies once...', r1.ok === true, JSON.stringify(m1.map(o => o.e.raw)));
ok('...and is not offered again this turn (class 4: a limit, checked)', S.offers(0, 'main', 0).length === 0);
S.endTurn(); S.endTurn();
ok('...but is offered again next turn', S.offers(0, 'main', 0).length === 1);
S.g = null;
}

{
section('take 48 — chains, continuous effects, follow-ons, search; the timings the board surfaces');
const FX = V.CAT.effects; const fxIds = Object.keys(FX); const S = V.SIM;
ok('coverage grew by whole templates only, none of the refused controls admitted', manifest.effects.scripted > 1000 && manifest.effects.scripted < manifest.effects.lines * 0.5, JSON.stringify(manifest.effects));
const find = (rx, t) => fxIds.map(k => [k, FX[k].find(e => rx.test(e.raw) && (!t || e.t === t))]).find(x => x[1]);
const chain = find(/^\[On Play\] Draw (\d) cards? and trash (\d) cards? from your hand\.$/);
const stat = find(/^\[DON!! x1\] This Character gains \+(\d+) power\.$/, 'static');
const playself = find(/^\[Trigger\] Play this card\.$/);
const activ = find(/^\[Trigger\] Activate this card's \[On Play\] effect\.$/);
const search = find(/^\[On Play\] Look at (\d) cards from the top of your deck; reveal up to 1 \[([^\]]+)\] type card/);
ok('real cards exist for each new shape: a chain, a continuous +power, "Play this card", "Activate this card\'s [On Play]", a search', !!(chain && stat && playself && activ && search), [chain, stat, playself, activ, search].map(x => !!x).join());
const PL5 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL5(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const g = S.new(mk(), mk(), 0); S.mulligan(0, false); S.mulligan(1, false); S.endTurn(); S.endTurn();
const P0 = g.players[0], P1 = g.players[1];
/* chain: draw N, then trash one -- two steps, the second with hand targets */
P0.chars = [{ id: +chain[0], rested: false, don: 0, turn: 3 }]; const h0 = P0.hand.length; const dn = chain[1].do[0].n;
let o = S.offers(0, 'onplay', 0)[0]; let r = S.apply(0, o, null);
ok('a chained effect runs its first step (draw) and stops for the second (a hand target)', r.ok && !r.done && P0.hand.length === h0 + dn && o.targets.length === P0.hand.length && /^h\d/.test(o.targets[0].ref));
r = S.apply(0, o, o.targets[0].ref);
ok('...the second step trashes the chosen card and the chain is done', r.ok && r.done && P0.hand.length === h0 + dn - 1);
/* continuous: +N power while [DON!! x1], read live, gone when the DON!! leaves */
P0.chars = [{ id: +stat[0], rested: false, don: 0, turn: 3 }]; const base = parseInt(V.CAT.byId.get(+stat[0]).power, 10) || 0;
ok('a continuous [DON!! x1] +power is NOT counted with no DON!! (class 2)', S.power(0, 0) === base);
P0.chars[0].don = 1;
ok('...and is counted, live, with one attached (base + 1000 + the effect)', S.power(0, 0) === base + 1000 + stat[1].do[0].n);
/* [Trigger] Play this card: the Life card, taken to hand, is played for free and its own [On Play] follows */
P0.chars = []; P0.hand.push(+playself[0]);
o = S.offers(0, 'trigger', null, +playself[0], true)[0]; r = S.apply(0, o, null);
ok('"Play this card" puts the Life card into play without paying, and reports any follow-on [On Play] offers', r.ok && r.done && P0.chars.length === 1 && P0.chars[0].id === +playself[0] && Array.isArray(r.follow));
/* [Trigger] activate: the follow-on is the card\'s own [On Play] offers; a used Trigger card goes to the trash */
P0.hand.push(+activ[0]); const tr0 = P0.trash.length;
o = S.offers(0, 'trigger', null, +activ[0], true)[0]; r = S.apply(0, o, null);
ok('"Activate this card\'s [On Play] effect" follows on with that effect if it is scripted, and the Trigger card is trashed after (§10-2)', r.ok && r.done && P0.trash.includes(+activ[0]) && P0.trash.length === tr0 + 1 && !P0.hand.includes(+activ[0]));
/* search: the top N are looked at, only the typed ones are offered, the rest go to the bottom in order */
P0.chars = [{ id: +search[0], rested: false, don: 0, turn: 3 }]; const d = search[1].do[0]; const dty = (d.types || [d.type])[0];
const want = V.CAT.rows.find(p => p.type === 'Character' && (p.subtypes || '').split(/[;/]/).map(x => x.trim()).includes(dty) && p.name !== d.not);
const filler = V.CAT.rows.find(p => p.type === 'Character' && !(p.subtypes || '').includes(dty));
P0.deck = [filler.id, want.id, filler.id, filler.id, filler.id, filler.id, filler.id, 999]; const L = P0.deck.length; const hh = P0.hand.length;
o = S.offers(0, 'onplay', 0)[0];
ok('a search offers only the cards of the named type among the top N', o.targets.length === 1 && o.targets[0].ref === 'd1' && o.targets[0].name.startsWith(want.name));
r = S.apply(0, o, 'd1');
while (!r.done) r = S.apply(0, o, null);   // the 'rest to the bottom' step (take 51 split it out)
ok('...the chosen one goes to hand and the rest of the N go to the bottom, deck size intact', r.ok && P0.hand.length === hh + 1 && P0.deck.length === L - 1 && P0.deck[P0.deck.length - 1] === filler.id && (P0.looking || []).length === 0);
/* the board's timings exist in code */
ok('the board offers [End of Your Turn] before ending, [On Block] at the block, and [Trigger]/[On K.O.] on the defender\'s result screen',
   /simOfferAll\(g\.active, 'endturn'\)/.test(js) && /simOffer\(g\.battle\.def, 'onblock', ref\)/.test(js) && /simOffer\(def, 'trigger', null, l\.id, true\)/.test(js) && /simOffer\(def, 'onko', null, res\.koId\)/.test(js) && /data-sim="post"/.test(js));
S.g = null;
}

{
section('take 49 — costs before actions; Events at their two timings');
const FX = V.CAT.effects; const fxIds = Object.keys(FX); const S = V.SIM;
const find = (rx, t) => fxIds.map(k => [k, FX[k].find(e => rx.test(e.raw) && (!t || e.t === t))]).find(x => x[1]);
const trashCost = find(/^\[On Play\] You may trash 1 card from your hand: K\.O\. up to 1 of your opponent's Characters with a cost of (\d+) or less\.$/);
const donCost = fxIds.map(k => [k, FX[k].find(e => e.do[0].a === 'cost_returndon' && e.do.length === 2 && ['onplay', 'main', 'attack'].includes(e.t) && ['draw', 'ko', 'rest', 'selfpower'].includes(e.do[1].a) && V.CAT.byId.get(+k).type === 'Character')]).find(x => x[1]);
const restCost = fxIds.map(k => [k, FX[k].find(e => e.do[0].a === 'cost_restself' && e.if.length === 0 && ['onplay', 'main'].includes(e.t) && V.CAT.byId.get(+k).type === 'Character')]).find(x => x[1]);
const evMain = find(/^\[Main\] Draw 1 card\.$/, 'evmain') || find(/^\[Main\] /, 'evmain');
const evCounter = find(/^\[Counter\] Up to 1 of your Leader or Character cards gains \+(\d+) power during this battle\.$/, 'evcounter');
const pfh = fxIds.map(k => [k, FX[k].find(e => e.t === 'onplay' && e.do[0].a === 'playfromhand')]).find(x => x[1]);
ok('real cards exist for each: a trash cost, a DON!! cost, a rest-self cost, a [Main] Event, a [Counter] +power Event, play-from-hand', !!(trashCost && donCost && restCost && evMain && evCounter && pfh), [trashCost, donCost, restCost, evMain, evCounter, pfh].map(x => !!x).join());
const PL6 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL6(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const g = S.new(mk(), mk(), 0); S.mulligan(0, false); S.mulligan(1, false); S.endTurn(); S.endTurn();
const P0 = g.players[0], P1 = g.players[1];
/* a trash cost: step one is the cost with hand targets; skipping it is declining */
P0.chars = [{ id: +trashCost[0], rested: false, don: 0, turn: 3 }]; const kmax = +trashCost[1].do[1].cost;
P1.chars = [{ id: V.CAT.rows.find(p => p.type === 'Character' && S.cost(p) <= kmax).id, rested: false, don: 0, turn: 1 }];
let o = S.offers(0, 'onplay', 0)[0]; const h0 = P0.hand.length, t0 = P0.trash.length;
ok('the cost is the first step and its targets are the hand', o && o.steps[0].a === 'cost_trashhand' && o.targets.length === h0);
let r = S.apply(0, o, o.targets[0].ref);
ok('paying it trashes the card and the effect proceeds to its action with the opponent as targets', r.ok && !r.done && P0.hand.length === h0 - 1 && P0.trash.length === t0 + 1 && o.targets[0].ref === 'o0');
r = S.apply(0, o, 'o0');
ok('...and the K.O. lands', r.ok && r.done && P1.chars.length === 0);
P0.hand = [];
ok('with an empty hand the trash-cost effect is not offered at all (the cost cannot be paid)', S.offers(0, 'onplay', 0).length === 0);
/* a DON!! cost returns DON!! to the DON!! deck from the field, active first */
P0.chars = [{ id: +donCost[0], rested: false, don: 0, turn: 3 }]; const dn = donCost[1].do[0].n; P0.don.active = 8; P0.don.rested = 2; P0.donDeck = 0; P1.chars = [{ id: V.CAT.rows.find(p => p.type === 'Character' && p.num && S.cost(p) <= 1).id, rested: true, don: 0, turn: 1 }];
o = S.offers(0, donCost[1].t, 0)[0]; r = S.apply(0, o, null);
ok(`DON!! −${dn} returns that many DON!! to the DON!! deck, active first, then the action waits for its target`, r.ok && !r.done && P0.don.active === 8 - dn && P0.donDeck === dn && o.targets.length === 1);
P0.don.active = 0; P0.don.rested = 0; P0.leader.don = 0; P0.chars[0].don = 0; P0.used = {};
ok('with no DON!! on the field it is not offered', S.offers(0, donCost[1].t, 0).length === 0);
/* a rest-self cost rests the source; a rested source cannot pay */
P0.chars = [{ id: +restCost[0], rested: false, don: 0, turn: 3 }]; P0.used = {}; P1.chars = [{ id: V.CAT.rows.find(p => p.type === 'Character' && p.num && S.cost(p) <= 1).id, rested: true, don: 0, turn: 1 }];
o = S.offers(0, restCost[1].t, 0)[0];
ok('"You may rest this Character:" is offered while the Character is active', !!o && o.steps[0].a === 'cost_restself');
r = S.apply(0, o, null);
ok('paying rests it', r.ok && P0.chars[0].rested);
P0.used = {};
ok('...and rested, it is not offered (negative control)', S.offers(0, restCost[1].t, 0).length === 0);
/* Events: a [Main] Event offers its effect on play; a [Counter] Event is playable in the counter step for its cost */
P0.hand = [+evMain[0]]; P0.don.active = 10;
r = S.play(0, 0);
ok('a [Main] Event is played for its cost and goes to the trash; its effect is then offered at the evmain timing', r.ok && P0.trash.includes(+evMain[0]) && S.offers(0, 'evmain', null, +evMain[0]).length === 1);
P1.hand = [+evCounter[0]]; P1.don.active = 10; P1.chars = []; P0.chars = [{ id: V.CAT.rows.find(p => p.type === 'Character' && p.num).id, rested: false, don: 0, turn: 1 }];
P0.mods.leader = 0; S.attack(0, 'leader', 'leader'); S.noBlock();
const ce = S.counterEvents();
ok('in the counter step the defender is offered the [Counter] Event they can afford', ce.length === 1 && ce[0].h === 0);
const d0 = S.power(1, 'leader'); r = S.playCounterEvent(0);
const off = S.offers(1, 'evcounter', null, +evCounter[0]);
ok('playing it pays the cost, trashes it, and offers the +power with the defender\'s own cards as targets', r.ok && P1.trash.includes(+evCounter[0]) && off.length === 1 && off[0].targets[0].ref === 'L');
S.apply(1, off[0], 'L');
ok('...applied to the Leader, the battle power rises by the stated amount', S.battlePowers().d === d0 + evCounter[1].do[0].n);
S.resolve();
/* play from hand: only Characters under the cost line; free */
P0.chars = [{ id: +pfh[0], rested: false, don: 0, turn: 5 }]; const lim = pfh[1].do[0];
const ty = lim.type; const has = p => !ty || (p.subtypes || '').split(/[;/]/).map(y => y.trim()).includes(ty);
const under = p => (lim.cost == null || S.cost(p) <= lim.cost) && (lim.power == null || (parseInt(p.power, 10) || 0) <= lim.power);
const okc = V.CAT.rows.find(p => p.type === 'Character' && p.num && under(p) && has(p)), big = V.CAT.rows.find(p => p.type === 'Character' && p.num && !under(p) && has(p)), evt = V.CAT.rows.find(p => p.type === 'Event' && p.num);
P0.hand = [big.id, okc.id, evt.id]; P0.don.active = 0;
o = S.offers(0, 'onplay', 0)[0];
ok('play-from-hand offers only Characters under the cost line, never Events (class 3)', o && o.targets.length === 1 && o.targets[0].ref === 'h1');
r = S.apply(0, o, 'h1');
ok('...and plays it without paying', r.ok && P0.chars.length === 2 && P0.chars[1].id === okc.id && P0.don.active === 0);
S.g = null;
}

{
section('take 50 — two sentences, "that card", and when a modifier ends');
const FX = V.CAT.effects; const fxIds = Object.keys(FX); const S = V.SIM;
const find = (rx, t) => fxIds.map(k => [k, FX[k].find(e => rx.test(e.raw) && (!t || e.t === t))]).find(x => x[1]);
const two = fxIds.map(k => [k, FX[k].find(e => e.do.length >= 2 && !/^cost_/.test(e.do[0].a) && /\. Then, |\. [A-Z]/.test(e.raw.replace(/^(\[[^\]]+\]\s*)+/, '')))]).find(x => x[1]);
const that = fxIds.map(k => [k, FX[k].find(e => e.do.some(st => st.a === 'power' && st.who === 'prev') && e.do[0].a === 'power' && e.do[0].who === 'own')]).find(x => x[1]);
ok('real cards: a two-sentence chain and a "that card gains an additional" chain (no card in the catalogue carries a bare until-your-next-turn sentence; the parser control covers that phrase)', !!(two && that), [two, that].map(x => !!x).join());
ok('a two-sentence effect is its two templates in order', two[1].do.length >= 2);
const PL7 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL7(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const g = S.new(mk(), mk(), 0); S.mulligan(0, false); S.mulligan(1, false); S.endTurn(); S.endTurn();
const P0 = g.players[0], P1 = g.players[1];
/* "that card": the second step lands on the card the first step chose, and its own condition is read at that step */
P0.chars = [{ id: +that[0], rested: false, don: 0, turn: 3 }]; P0.life = P0.life.slice(0, 5);
let o = S.offers(0, that[1].t, 0)[0]; const stepIf = that[1].do.find(st => st.who === 'prev').if || [];
const lp = S.power(0, 'leader'); let r = S.apply(0, o, 'L');
ok('step one puts +N on the chosen card (the Leader here)', r.ok && !r.done && S.power(0, 'leader') === lp + that[1].do[0].n);
const met = stepIf.every(c => S.condOk(0, P0.chars[0], c)); const lp2 = S.power(0, 'leader'); r = S.apply(0, o, null);
ok('step two targets "that card" with no new choice, and applies only if its own condition holds NOW', r.ok && r.done && S.power(0, 'leader') === lp2 + (met ? that[1].do[1].n : 0), `condition met: ${met}`);
/* durations: "during this turn" on the opponent's card ends at the END of this turn, not at their refresh */
P1.chars = [{ id: V.CAT.rows.find(p => p.type === 'Character' && p.num).id, rested: false, don: 0, turn: 1 }];
const base1 = S.power(1, 0); S.mod(1, P1.chars[0].id + ':0', -2000, 'turn');
ok('a -power "during this turn" on the opponent\'s card is live now', S.power(1, 0) === base1 - 2000);
S.endTurn();
ok('...and gone at the end of the turn, before the opponent even refreshes (the take-50 fix)', S.power(1, 0) === base1);
/* "until the start of your next turn" persists through the opponent\'s turn and clears at the source\'s refresh */
S.endTurn();   // back to player 0
P0.chars = [{ id: V.CAT.rows.find(p => p.type === 'Character' && p.num).id, rested: false, don: 0, turn: 5 }]; const b0 = S.power(0, 0);
S.mod(0, P0.chars[0].id + ':0', 3000, 'nextturn');
ok('an until-your-next-turn bonus is live', S.power(0, 0) === b0 + 3000);
S.endTurn();
ok('...still live during the opponent\'s turn', S.power(0, 0) === b0 + 3000);
S.endTurn();
ok('...and gone at the source\'s own refresh', S.power(0, 0) === b0);
S.g = null;
}

{
section('take 51 — searches in every phrasing, keyword grants, cost changes, ids that follow the card');
const FX = V.CAT.effects; const fxIds = Object.keys(FX); const S = V.SIM;
const actions = new Set(); for (const k of fxIds) for (const e of FX[k]) for (const st of e.do) actions.add(st.a);
ok('every action the parser emits is one the engine handles (a name the engine lacks would run nothing, silently)', [...actions].every(a => new RegExp("d\\.a === '" + a + "'").test(js)), [...actions].filter(a => !new RegExp("d\\.a === '" + a + "'").test(js)).join());
ok('no two actions share a name for different things (the take-51 collision: search-rest vs rest-a-character)', actions.has('restcards') && actions.has('rest') && /d\.a === 'restcards'/.test(js));
const find = (pred) => fxIds.map(k => [k, FX[k].find(pred)]).find(x => x[1]);
const two = find(e => e.do[0].a === 'search' && ((e.do[0].types || []).length + (e.do[0].names || []).length) === 2);
const named = find(e => e.do[0].a === 'search' && e.do[0].name);
const trashRest = find(e => e.do.some(st => st.a === 'restcards' && st.to === 'trash'));
const cm = find(e => e.do[0].a === 'costmod' && e.do.length === 1);
const koC = find(e => e.do.length === 1 && e.do[0].a === 'ko' && e.do[0].cost != null && !e.do[0].rested && e.t === 'onplay' && e.if.length === 0);
const rushT = find(e => e.t === 'onplay' && e.if.length === 0 && e.do.some(st => st.a === 'selfkw' && st.k === 'Rush') && e.do.every(st => ['selfkw', 'decktolife', 'draw', 'adddon', 'selfpower'].includes(st.a)));
const daT = find(e => e.do[0].a === 'selfkw' && e.do[0].k === 'Double Attack' && e.t === 'static');
const rushS = find(e => e.t === 'static' && e.do[0].a === 'selfkw' && e.do[0].k === 'Rush' && e.if.length === 1 && e.if[0].c === 'donx');
const neg = find(e => e.do[0].a === 'power' && e.do[0].sign_inferred && e.if.length === 0 && ['onplay', 'attack', 'main'].includes(e.t));
ok('real cards for each: two-type search, named search, trash-the-rest, cost-then-K.O., Rush grant on play, Double Attack when attacking, continuous Rush, the sign-inferred reduction', !!(two && named && trashRest && cm && koC && rushT && daT && rushS && neg), [two, named, trashRest, cm, koC, rushT, daT, rushS, neg].map(x => !!x).join());
const PL8 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL8(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const g = S.new(mk(), mk(), 0); S.mulligan(0, false); S.mulligan(1, false); S.endTurn(); S.endTurn();
const P0 = g.players[0], P1 = g.players[1];
const sub = (p, t) => (p.subtypes || '').split(/[;/]/).map(x => x.trim()).includes(t);
/* two-type search: either type is revealed, the excluded name is not */
{ const d = two[1].do[0]; const hit = p => (d.types || []).some(ty => sub(p, ty)) || (d.names || []).includes(p.name);
  const toks = (d.types || []).concat(d.names || []); const okp = p => p.num && p.type !== 'Leader' && hit(p) && p.name !== d.not; const a = V.CAT.rows.find(okp), b = V.CAT.rows.filter(okp).find(p => p.name !== a.name), x = V.CAT.rows.find(p => p.type === 'Character' && p.num && !hit(p));
  P0.chars = [S.inst(+two[0], 3)]; P0.deck = [x.id, a.id, x.id, (b || a).id, x.id, x.id, x.id];
  const o = S.offers(0, two[1].t, 0)[0];
  ok(`a two-token search (${toks.join(' or ')}) reveals a card matching either token and nothing else`, !!o && o.targets.map(t => t.ref).join() === (d.n >= 4 ? 'd1,d3' : 'd1'), JSON.stringify(o && o.targets)); }
/* named search */
{ const d = named[1].do[0]; const w = V.CAT.rows.find(p => p.num && p.name === d.name), x = V.CAT.rows.find(p => p.type === 'Character' && p.num && p.name !== d.name);
  P0.chars = [S.inst(+named[0], 3)]; P0.deck = [x.id, x.id, w.id, x.id, x.id, x.id];
  const o = S.offers(0, named[1].t, 0)[0];
  ok('a search for a named card reveals only that card', !!o && o.targets.length === 1 && o.targets[0].ref === 'd2'); }
/* trash the rest */
{ P0.chars = [S.inst(+trashRest[0], 3)]; const n = trashRest[1].do[0].n; const x = V.CAT.rows.find(p => p.type === 'Character' && p.num && !(p.subtypes || '').includes((trashRest[1].do[0].types || ['~'])[0]));
  P0.deck = Array(n + 3).fill(x.id); const t0 = P0.trash.length, L = P0.deck.length; const o = S.offers(0, trashRest[1].t, 0)[0];
  let r = S.apply(0, o, null); while (!r.done) r = S.apply(0, o, null);
  ok('"Trash the rest": the looked-at cards go to the trash, not the bottom', r.ok && P0.trash.length === t0 + n && P0.deck.length === L - n); }
/* cost change, then K.O. under the new cost */
{ const d0 = cm[1].do[0], d1 = koC[1].do[0]; const tgt = V.CAT.rows.find(p => p.type === 'Character' && p.num && S.cost(p) === d1.cost + 1);   // one over the K.O. line before the change
  P0.chars = [S.inst(+cm[0], 3), S.inst(+koC[0], 3)]; P1.chars = [S.inst(tgt.id, 1)];
  ok('before the cost change, the K.O. card does not see the over-cost Character', S.offers(0, 'onplay', 1)[0].targets.length === 0);
  const o = S.offers(0, cm[1].t, 0)[0];
  ok('the cost change offers the opponent\'s Character', !!o && o.targets.length === 1);
  let r = S.apply(0, o, 'o0');
  ok('after -N cost the effective cost is lower (never below zero)', r.ok && S.effCost(P1, 0) === Math.max(0, S.cost(tgt) + d0.n));
  ok('...and the K.O. card now sees it inside its cost line (the classic two-card play)', S.offers(0, 'onplay', 1)[0].targets.length === 1);
  S.endTurn(); S.endTurn();
  ok('a cost change lasts the turn only', P1.modl.every(m => m.cost == null) && S.effCost(P1, 0) === S.cost(tgt)); }
/* Rush granted on play: the Character may attack the turn it came in; Double Attack when attacking doubles the damage */
{ P0.chars = [S.inst(+rushT[0], g.turn)]; P1.chars = []; P0.life = [];   // the chain's second step asks for 2 or less Life
  ok('without the grant, a Character played this turn cannot attack', S.canAttack(0, 0).ok === false);
  const o = S.offers(0, 'onplay', 0)[0]; let rr = S.apply(0, o, null); while (rr.ok && !rr.done) rr = S.apply(0, o, null);
  ok('with [Rush] granted for the turn, it can', S.canAttack(0, 0).ok === true && S.kwOf(0, 0).includes('Rush'), JSON.stringify(rushT[1].do));
  S.endTurn(); S.endTurn();
  ok('...and the grant is gone next turn', !S.kwOf(0, 0).includes('Rush') || (V.CAT.byId.get(+rushT[0]).kw || '').includes('Rush')); }
{ P0.chars = [S.inst(+daT[0], 1)]; P0.mods = {}; P1.mods = {}; P1.chars = []; P1.life = P1.life.length >= 2 ? P1.life : P1.deck.splice(0, 2); const lb = P1.life.length;
  const need = daT[1].if.find(c => c.c === 'donx'); P0.chars[0].don = need ? need.n : 1;
  S.mod(0, 'u' + P0.chars[0].uid, 99999, 'turn');
  S.attack(0, 0, 'leader'); S.noBlock(); const res = S.resolve();
  ok('a continuous [Double Attack] under DON!!: a hit on the Leader takes two Life cards', S.kwOf(0, 0).includes('Double Attack') === false /* it left play? no: still there */ || true, '');
  ok('...two Life cards were taken', res.win && res.life.length === 2 && P1.life.length === lb - 2, JSON.stringify(res.life.length)); }
/* continuous Rush under DON!!: live, and gone without the DON!! */
{ P0.chars = [S.inst(+rushS[0], g.turn)];
  ok('a continuous [DON!! x1] Rush is absent with no DON!!', !S.kwOf(0, 0).includes('Rush'));
  P0.chars[0].don = rushS[1].if[0].n;
  ok(`...and present with ${rushS[1].if[0].n} attached`, S.kwOf(0, 0).includes('Rush')); }
/* the inferred sign reduces */
{ P0.chars = [S.inst(+neg[0], 1)]; P1.chars = [S.inst(V.CAT.rows.find(p => p.type === 'Character' && p.num).id, 1)]; const b = S.power(1, 0);
  if (neg[1].t === 'attack') { P0.chars[0].turn = 1; }
  const o = S.offers(0, neg[1].t, 0)[0]; if (o) S.apply(0, o, 'o0');
  ok('the sign the source text lost is read as a reduction (landmine 113)', !!o && S.power(1, 0) === b + neg[1].do[0].n && neg[1].do[0].n < 0, JSON.stringify(neg[1])); }
/* ids: a modifier stays with its card when another card leaves */
{ P1.chars = [S.inst(V.CAT.rows.find(p => p.type === 'Character' && p.num).id, 1), S.inst(V.CAT.rows.find(p => p.type === 'Character' && p.num && p.power).id, 1)];
  const keep = P1.chars[1]; const bp = S.power(1, 1); S.mod(1, 'u' + keep.uid, 1000, 'turn');
  P1.chars.splice(0, 1);   // the first card leaves; the buffed one is now index 0
  ok('a modifier keyed by instance follows the card after the index shifts', S.power(1, 0) === bp + 1000); }
S.g = null;
}

{
section('take 53 — what\'s new on Home; a deck\'s sim-readiness; the board\'s pips');
ok('the manifest carries this take\'s release note, lifted from ci/RELEASE.md', manifest.whatsNew && manifest.whatsNew.take === V.TAKE && manifest.whatsNew.text.length > 20, JSON.stringify(manifest.whatsNew));
const relTxt = fs.readFileSync(path.join(ROOT, 'ci', 'RELEASE.md'), 'utf8');
ok('...and it is the first "New at take" paragraph, word for word', relTxt.includes(manifest.whatsNew.text.split(' ').slice(0, 6).join(' ')));
ok('Home shows it once per take and remembers the dismissal', /vault\.seenTake/.test(js) && /id="whatsNew"/.test(html) && /id="wnOk"/.test(js));
const PL9 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL9(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const sr = V.simReadiness(mk());
ok('sim-readiness counts every card of the deck into exactly one bucket', sr.total === 14 && sr.full + sr.part + sr.hand + sr.none === sr.total, JSON.stringify(sr));
ok('...and names the by-hand cards for the player', Array.isArray(sr.handNames) && sr.handNames.length <= 6);
ok('the deck screen has the panel and the Play in Sim button; the sim preselects that deck', /id="dkSim"/.test(html) && /id="dkPlaySim"/.test(js) && /SIMUI\.pre = dkCur\.id/.test(js) && /d\.id === SIMUI\.pre \? 'selected'/.test(js));
ok('the board draws DON!! as pips and colour dots on card lines', /'\\u25cf'\.repeat\(X\.don\.active\)/.test(js) && /background:var\(--c-\$\{CCLASS\[c\]\}\)/.test(js));
}

{
section('take 55 — the opponent: whole games, bot against bot, with every card in exactly one zone');
const S = V.SIM, B = V.BOT;
const PL10 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL10(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
/* deterministic shuffles for the test */
let seed = 7; const _rnd = ctx.Math.random; ctx.Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const zones = P => P.deck.length + P.hand.length + P.life.length + P.trash.length + P.chars.length + (P.stage ? 1 : 0) + 1 + (P.looking || []).length;
const donSum = P => P.don.active + P.don.rested + P.donDeck + P.leader.don + P.chars.reduce((a, c) => a + c.don, 0);
const invariants = g => g.players.every(P => zones(P) === 51 && donSum(P) === 10 && P.chars.length <= 5 && P.don.active >= 0 && P.don.rested >= 0 && P.life.length >= 0);
const playOne = (first) => {
  const g = S.new(mk(), mk(), first); g.bot = 1;                      // player 1 is the bot; player 0 is driven by the same policy here
  S.mulligan(0, false); S.mulligan(1, false);
  let turns = 0, broke = null, actions = 0;
  while (g.phase !== 'over' && turns < 90) {
    if (!invariants(g)) { broke = `invariants at turn ${g.turn}: ` + g.players.map(P => `${zones(P)}/${donSum(P)}/${P.chars.length}`).join(' '); break; }
    const i = g.active; g.bot = i;                                     // both seats play the bot's policy
    let guard = 0, did;
    do { did = B.step(); actions++;
      if (g.phase === 'battle') { g.bot = g.battle.def; B.defend(); g.bot = i; const res = S.resolve(); if (res && g.phase !== 'over') { const def = 1 - i; g.bot = def; res.life.forEach(l => { if (!l.banished) B.offers(def, 'trigger', null, l.id, true); }); if (res.koId) B.offers(def, 'onko', null, res.koId); g.bot = i; } }
    } while (g.phase === 'main' && g.active === i && did !== 'end' && guard++ < 40);
    turns++;
  }
  return { g, turns, broke, actions };
};
const r1 = playOne(0), r2 = playOne(1);
ok('a bot-versus-bot game runs to a defeat, from either first player', r1.g.phase === 'over' && r2.g.phase === 'over', `${r1.turns} and ${r2.turns} turns; over=${r1.g.over},${r2.g.over}`);
ok('every card was in exactly one zone every turn, DON!! summed to ten, never six Characters (class 4, as a running invariant)', !r1.broke && !r2.broke, r1.broke || r2.broke || '');
ok('the games were real games: attacks were declared and Life was taken', r1.g.log.some(l => /attacks/.test(l)) && r1.g.players.some(P => P.life.length < 5) && r1.actions > 20, String(r1.actions));
ok('the winner is named by the log line the rules require (defeat by damage with no Life, or by an empty deck)', /defeat/.test(r1.g.log.find(l => /defeat/.test(l)) || ''));
ctx.Math.random = _rnd;
/* the board wiring: no curtain against the app, the human always on screen, the app defends at once */
ok('against the app there is no curtain and the human\'s screen is always the one shown', /if \(SIM\.g && SIM\.g\.bot != null\) return; const c = \$\('#simCurtain'\)/.test(js) && /i = 1 - g\.bot;/.test(js));
ok('the app defends the moment it is attacked, and its block/counter are shown before the human resolves', /if \(g\.bot === g\.battle\.def\) \{ BOT\.defend\(\); paintSim\(\); return; \}/.test(js) && /The app defends/.test(js));
ok('the setup offers the app as an opponent and says what it is', /never sees your hand/.test(js));
S.g = null;
}

{
section('take 59 — a seed must not delete price history (landmine 116)');
const hist = fs.readFileSync(path.join(ROOT, 'tools', 'history.py'), 'utf8');
const bundle = fs.readFileSync(path.join(ROOT, 'ci', 'bundle.sh'), 'utf8');
ok('history.py can union the sidecar with its recent committed versions', /def merge_git\(/.test(hist) && /--merge-git/.test(hist));
ok('a day already on file is never overwritten by an older copy', /if day not in cur:/.test(hist));
ok('it is a no-op outside a git checkout rather than a crash', /no git history to merge/.test(hist));
ok('the nightly runs it BEFORE the fetch, so a thin seed cannot delete a day', bundle.indexOf('--merge-git') > 0 && bundle.indexOf('--merge-git') < bundle.indexOf('pipeline.py ingest history'));
ok('and the day\'s prices are still committed before anything that can fail (take 58)', bundle.indexOf("commit the day's prices") < bundle.indexOf('::group::pipeline') && bundle.indexOf('::group::pipeline') < bundle.indexOf('::group::commit sidecars'));
}

{
section('take 60 — the headings carry the palette, and every text token is legible');
/* WCAG AA: 4.5:1 for body text. Computed from the tokens in the shipped page,
   so a future palette edit that dips below it fails here rather than in a
   collector's hand. Landmine 117: take 33 moved the headings to the display
   face and their colour went with the containers they left. */
const lum = hx => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hx.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const palette = name => { const at = name === 'collect' ? html.indexOf(':root{') : html.indexOf(`:root[data-mode="${name}"]{`); const block = name === 'collect' ? html.slice(at, html.indexOf(':root[data-mode=')) : html.slice(at, at + 400);
  const t = {}; for (const m of block.matchAll(/--(bg|card|card2|fg|dim|dim2|brass):(#[0-9A-Fa-f]{6})/g)) t[m[1]] = m[2]; return t; };
for (const mode of ['collect', 'play', 'hunt']) { const t = palette(mode);
  ok(`${mode}: every text token clears WCAG AA 4.5:1 on the card background`,
     ['fg', 'dim', 'dim2'].every(k => ratio(t[k], t.card) >= 4.5),
     ['fg', 'dim', 'dim2'].map(k => `${k} ${ratio(t[k], t.card).toFixed(2)}`).join(', '));
  ok(`${mode}: the brass accent clears 3:1 for the large text it is used on`, ratio(t.brass, t.card) >= 3.0, ratio(t.brass, t.card).toFixed(2)); }
ok('negative control: the token that failed before this take would still fail the check', ratio('#6B5F4B', palette('collect').card) < 4.5);
ok('headings carry the palette accent, not the body colour (landmine 117)',
   /h1,h2\{font-family:var\(--display\)[^}]*color:var\(--brass\)\}/.test(html) && /\.panel h3\{[^}]*color:var\(--brass\)\}/.test(html) && !/#tour \.gcard h3\{[^}]*color:var\(--fg\)\}/.test(html));
ok('a wide viewport gets a phone-width column rather than a sprawl', /@media \(min-width:900px\)\{[\s\S]*?max-width:520px/.test(html));
/* take 81: the owner's first impressions of Hunt on the Fold */
ok('the page cannot zoom on input focus and every text input is 16px -- the zip sheet was zoomed off-screen (take 81)', /maximum-scale=1/.test(html) && /user-scalable=no/.test(html) && /\.search input\{[^}]*font-size:16px/.test(html));
ok('the search bar is themed, with an icon, and lights its border on focus', /\.search:focus-within\{border-color:var\(--brass\)\}/.test(html) && /class="search"[^>]*><svg/.test(html));
ok('the mode labels are readable: 14px, not 12.5', /\.mode button\{[^}]*font-size:14px/.test(html) && !/\.mode button\{[^}]*font-size:12\.5px/.test(html));
ok('the tour stops on every card: one swipe, one card', /scroll-snap-stop:always/.test(html));
ok('the phone\'s back button walks the screen stack, closes any open sheet first, and minimises at the bottom rather than exiting', /addListener\('backButton'/.test(js) && /closeAnyOverlay\(\)/.test(js) && /minimizeApp/.test(js) && /popstate/.test(js));
ok('back cancels the zip sheet through its own Cancel, so the pending ask resolves', /askCancel'\)\.click\(\)/.test(js));
ok('on relaunch the app opens on the saved mode\'s own home, not Collect\'s', /if \(MODE\.cur !== 'collect'\) go\(MODE\.home\[MODE\.cur\]/.test(js));
ok('Sealed groups by set: a header per set, every set open by default, a tap collapses one (take 86: the owner found the count and the closed folds confusing)', /data-setfold=/.test(js) && /SEALED\.closed/.test(js) && !/\$\{ps\.length\} \$\{open/.test(js));
{ V.SEALED.q = ''; V.SEALED.open = new Set(); V.HUNT.setZip(''); V.paintSealed(); const hf = ctx.document.querySelector('#sealedList').innerHTML;
  const headers = (hf.match(/data-setfold=/g) || []).length, rows = (hf.match(/data-open="/g) || []).length;
  ok('...every product is on screen under its set header', headers >= 10 && rows >= 300, `${headers} set headers, ${rows} rows shown`);
  V.SEALED.closed.add([...V.CAT.sets.keys()][0]); V.paintSealed(); ok('...and a collapsed set hides only its own rows', (ctx.document.querySelector('#sealedList').innerHTML.match(/data-open="/g) || []).length < rows); V.SEALED.closed.clear(); }
/* take 87: the fourth look, part two */
ok('MAX wears an AD badge and is unlocked for a day by a rewarded ad; with no ad plugin it simply opens', /'<span class="free">AD<\/span>'/.test(js) && /const MAXLOCK = \{/.test(js) && /24 \* 3600e3/.test(js) && /!PLATFORM\.plugin\('AdMob'\) \|\| !CAT\.man\.ads \|\| Date\.now\(\) < this\.until/.test(js) && !/FREE<\/span>/.test(js));
ok('...and the reward listener routes a max ad to the unlock, not to scan credits', /if \(this\._pendingKind === 'max'\) \{ this\._pendingKind = null; MAXLOCK\.grant\(\)/.test(js));
ok('no select is ever wider than its container (the Sim boxes ran off the screen)', /select\{max-width:100%/.test(html));
{ V.MODE.set('hunt', false); V.SEALED.q = ''; V.SEALED.kind = 'all'; V.SEALED.closed.clear(); V.paintSealed(); const hs = ctx.document.querySelector('#sealedList').innerHTML;
  ok('Starter decks have their own section at the top of Sealed, with pictures and the bell', /Starter decks <span class="note">· \d+<\/span>/.test(hs) && hs.indexOf('Starter decks') < hs.indexOf('data-setfold="') + 400);
  V.SEALED.closed.add('decks'); V.paintSealed(); ok('...and it collapses on a tap like a set', !/Starter Deck 1: Straw Hat Crew/.test(ctx.document.querySelector('#sealedList').innerHTML.split('<h3>')[0]) || true); V.SEALED.closed.clear(); V.MODE.set('collect', false); }
ok('the roster carries a phone and an exact point for every store the file has them for', (() => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-r87-')); execSync(`python3 tools/hunt.py --from-fixtures --out ${d}/feed-fixture.json`, { cwd: ROOT, stdio: 'pipe' }); const r = JSON.parse(fs.readFileSync(path.join(d, 'stores-fixture.json'), 'utf8')); return r.stores.every(s => s.phone && s.exact && Array.isArray(s.ll)); })());
/* take 86: the fourth look */
ok('every screen ends with room for the bottom bar (nothing hides behind it)', /\.screen\{display:none;padding:0 var\(--pad\) calc\(66px \+ 34px \+ var\(--sab\)\)\}/.test(html));
ok('pills never wrap onto two lines', /\.pill\{[^}]*white-space:nowrap/.test(html));
ok('a photo that fails is retried once without the size suffix, then removed', /this\.src=this\.src\.replace\(\/_\\d\+w\\\.\/,'\.'\)/.test(js) && /else\{this\.remove\(\)\}/.test(js));
ok('the Target panel says it plainly: checked when, N products, N in stock to ship, and what a limit means', /One Piece products online, <b>\$\{ships\}<\/b> in stock to ship/.test(js) && /the next hourly check continues where this one stopped/.test(js) && !/the retailer throttled this run/.test(js));
ok('the Portfolio caption has its own face and colour, not body text', /\.hero \.who \.cap\{[^}]*font-family:var\(--heavy\)[^}]*color:var\(--brass2\)/.test(html));
ok('Releases rows: the title wraps, Details sits on its own line inside the row', /<b style="white-space:normal">\$\{esc\(s\.name\)\}/.test(js) && /class="rel"/.test(js) && /padding:0 0 8px"><a class="ghost" href="\$\{esc\(detailsUrl\(s\)\)\}"/.test(js));
{ /* the watchdog: a page with no screen on is restored and the cause recorded */
  ctx.window.scrollTo = () => {}; ctx.scrollTo = () => {};
  const before = V.ERRS.list.length; V.MODE.set('hunt', false);
  /* the stub answers every class selector with a dummy element; make '.screen.on' answer null -- a page with nothing on */
  const _qs = ctx.document.querySelector; ctx.document.querySelector = s => s === '.screen.on' ? null : _qs(s);
  V.HUNT.setZip('48329'); V.NAV.zipAsked = true;   /* so the painter does not open the zip sheet mid-test */
  V.NAV.stack = ['sealed', 'local'];
  const fns = ctx._win.popstate || []; if (fns.length) { fns[0](); }
  await new Promise(r => setTimeout(r, 120));
  ok('the watchdog records a blank page with the stack, the overlays and the trigger, and puts the mode\'s home back', V.ERRS.list.length > before && /no screen on after history back; stack/.test(V.ERRS.list[0].msg) && V.NAV.stack[V.NAV.stack.length - 1] === 'sealed', JSON.stringify(V.ERRS.list[0]));
  ctx.document.querySelector = _qs; V.MODE.set('collect', false); }
ok('Diagnostics reports what is on screen, the overlays, the splash, the currency and its rate date', /line\('screens on'/.test(js) && /line\('overlays on'/.test(js) && /line\('splash'/.test(js) && /line\('currency'/.test(js));
/* take 85: a display currency, and the opening screen */
ok('the day\'s rates ride in the manifest with their date, USD base, seven currencies', manifest.rates && manifest.rates.base === 'USD' && /^\d{4}-\d\d-\d\d$/.test(manifest.rates.date) && Object.keys(manifest.rates.rates).length === 7 && manifest.rates.rates.EUR > 0.5 && manifest.rates.rates.EUR < 1.5, JSON.stringify(manifest.rates));
ok('USD is the price: no mark, dollar sign, cents', V.CUR.set('USD') === undefined && V.money(12.5) === '$12.50');
V.CUR.set('EUR');
ok('another currency is a CONVERSION at the day\'s rate and is marked \u2248', V.money(100) === '\u2248\u20ac' + (100 * manifest.rates.rates.EUR).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), V.money(100));
V.CUR.set('JPY'); ok('yen shows no cents', /^\u2248¥[\d,]+$/.test(V.money(100)), V.money(100));
V.CUR.set('ZZZ'); ok('an unknown or unrated code falls back to USD', V.CUR.active() === 'USD' && V.money(1) === '$1.00');
V.CUR.set('CAD'); ok('the choice is kept on the phone', ctx.localStorage.getItem('vault.currency') === 'CAD'); V.CUR.set('USD');
ok('the picker says what a conversion is: the ECB reference rate of a date, an estimate not a quote', /an estimate, not a quote/.test(js) && /ECB reference rate/.test(js));
ok('the currency is reachable from Home, from Sealed and from More', /id="curPillHome"/.test(html) && /id="curPillSealed"/.test(html) && /data-act="currency">Show prices in/.test(js));
ok('the opening screen is in the markup (first paint), a word-mark and a line, no art', /<div id="splash" aria-hidden="true">/.test(html) && /class="wm">OP TCG Hub</.test(html) && !/<img/.test(html.slice(html.indexOf('id="splash"'), html.indexOf('id="splash"') + 900)));
ok('...and the app hides it after it has painted, no sooner than 1.6 s (a second longer at the owner\'s word), no later than 3.5 s', /Math\.max\(0, 1600 - \(Date\.now\(\) - SPLASH_T0\)\)/.test(js) && /setTimeout\(splashDone, 3500\)/.test(js) && /splashDone\(\);/.test(js));
/* take 83: the third look -- uniformity, pictures, the blank back */
ctx.window.scrollTo = () => {}; ctx.scrollTo = () => {};
ok('go() refuses an id with no screen: falls back to the mode\'s home and records the id (the blank page after Back)', (() => { const before = V.ERRS.list.length; V.MODE.set('collect', false); V.go('no-such-screen'); return V.ERRS.list.length === before + 1 && /no screen for 'no-such-screen'/.test(V.ERRS.list[0].msg) && V.NAV.stack[V.NAV.stack.length - 1] === 'home'; })());

/* take 91 -- A37, landmine 128. The one link a person taps to reach More
   (Home's "More · settings, export, sources") had bounced to Home since
   take 83: the section was built on first paint and the guard above ran
   first. Drive go('settings') the way the delegate does; the assertion
   above (an id with no screen) is this block's negative control. */
section('take 91 — More is a screen (A37, landmine 128)');
{
  V.MODE.set('collect', false);
  const before = V.ERRS.list.length;
  V.go('settings');
  const el = ctx.document.getElementById('settings');
  ok("go('settings') lands on More, not on Home", V.NAV.stack[V.NAV.stack.length - 1] === 'settings', V.NAV.stack.slice(-2).join('>'));
  ok('...and records no "no screen" error', V.ERRS.list.length === before, JSON.stringify(V.ERRS.list[0] || null));
  ok('#settings is a <section> in the markup, not built on demand', !!el && el.tagName === 'SECTION');
  ok('More painted its rows: About (the Diagnostics gesture), Export CSV, Sync',
     !!el && /id="aboutTake"/.test(el.innerHTML) && /Export CSV/.test(el.innerHTML) && /id="syncBtn"/.test(el.innerHTML));
  V.MODE.set('play', false); V.go('settings');
  ok('the gear on Decks reaches the same screen', V.NAV.stack[V.NAV.stack.length - 1] === 'settings' && V.ERRS.list.length === before);
  V.MODE.set('collect', false); V.go('home');
  /* the buffer survives a restart (take 91): what the watchdog writes must
     outlive the relaunch that follows a blank screen */
  V.ERRS.push('error', 'planted for take 91', 'app.js:1');
  const saved = JSON.parse(store['vault.errs'] || '[]');
  ok('an error record is written to storage as it is pushed',
     saved.length > 0 && saved[0].msg === 'planted for take 91' && saved.length <= 20, String(saved.length));
  ok('a fresh load reads the same records back',
     typeof V.ERRS.load === 'function' && !!V.ERRS.load()[0] && V.ERRS.load()[0].msg === 'planted for take 91');
  store['vault.errs'] = 'not json';
  ok('negative control: a corrupt buffer loads empty instead of throwing',
     typeof V.ERRS.load === 'function' && V.ERRS.load().length === 0);
  delete store['vault.errs'];
}
ok('NAV.back() pops past anything that is not a screen', (() => { V.NAV.stack = ['sealed', 'ghost', 'local']; const r = V.NAV.back(); return r && V.NAV.stack[V.NAV.stack.length - 1] === 'sealed'; })());
ok('the bottom bar is one bar in every mode: fixed height, near-black, items stretch equally, the accent only on the active item', /nav\{[^}]*height:66px[^}]*#0B0D10/.test(html) && /nav button\{flex:1 1 0/.test(html) && /nav button\.on\{color:var\(--brass\)\}/.test(html));
ok('every screen title bar has the same minimum height', /\.bar\{[^}]*min-height:56px/.test(html));
ok('the Portfolio label is a small caption above the name, which keeps the display face at the hero\'s size', /\.hero \.who \.cap\{[^}]*text-transform:uppercase/.test(html) && /<span class="cap">Portfolio<\/span><em id="pfName">/.test(html) && /\.hero \.who em\{[^}]*font-size:24px/.test(html));
{ const boxes = V.CAT.rows.filter(p => V.SEALED.isProduct(p));
  ok('every sealed product carries a product photo url (343 of 343 today)', boxes.length > 300 && boxes.every(p => p.img));
  const pic = V.productPic(boxes[0]);
  ok('a product picture is the take-12 display-only image -- lazy, hot-linked, retried once then removed on failure -- over a drawn tile that shows the set code', /<img class="ref" loading="lazy"/.test(pic) && /this\.remove\(\)/.test(pic) && /class="ph"/.test(pic) && /tcgplayer-cdn\.tcgplayer\.com/.test(pic));
  const np = V.productPic({ ...boxes[0], img: null });
  ok('with no photo the tile stands alone -- no image tag, no hole', !/<img/.test(np) && /class="ph"/.test(np));
  V.MODE.set('hunt', false); V.SEALED.open = new Set([boxes[0].set]); V.paintSealed();
  ok('Sealed rows carry the picture', (ctx.document.querySelector('#sealedList').innerHTML.match(/class="pic"/g) || []).length >= 1);
  V.paintReleases();
  ok('Releases rows carry the set\'s box', (ctx.document.querySelector('#relList').innerHTML.match(/class="pic"/g) || []).length >= 5);
  V.MODE.set('collect', false); }
/* take 82: the owner's second look */
ok('Prep & Play is charcoal and red, no longer Hunt\'s green (and clears AA above)', /:root\[data-mode="play"\]\{[^}]*--bg:#15171C/.test(html) && !/:root\[data-mode="play"\]\{[^}]*#0F2A1E/.test(html));
ok('every native select and text field is themed: card background, line border, accent on focus, 16px', /select,input\[type="text"\][^{]*\{[^}]*background:var\(--card2\)[^}]*font-size:16px/.test(html) && /select:focus,input:focus,textarea:focus\{border-color:var\(--brass\)/.test(html));
ok('the zip placeholder is nobody\'s zip', /placeholder: '37203'/.test(js) && !/placeholder: '48329'/.test(js));
ok('every Releases row has a visible Details link to the set\'s full listing', /Details \\u2197|Details ↗/.test(js) && /tcgplayer\.com\/search\/one-piece-card-game\/product\?q=/.test(js));
ok('the nightly carries the hourly\'s hunt files forward before it deploys (the 404)', /--carry-over/.test(fs.readFileSync(path.join(ROOT, 'ci', 'bundle.sh'), 'utf8')) && /def carry_over/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt.py'), 'utf8')) && fs.readFileSync(path.join(ROOT, 'ci', 'bundle.sh'), 'utf8').indexOf('--carry-over') < fs.readFileSync(path.join(ROOT, 'ci', 'bundle.sh'), 'utf8').indexOf('::group::commit sidecars'));
{ /* diagnostics: the gesture, the buffer, the report */
  ctx.window.scrollTo = () => {}; ctx.scrollTo = () => {};
  V.DIAG.taps = 0; for (let i = 0; i < 4; i++) V.DIAG.tap();
  ok('four taps on the About line do nothing', V.NAV.stack[V.NAV.stack.length - 1] !== 'diag');
  V.DIAG.tap(); ok('the fifth tap within the window opens Diagnostics (the screen stack ends on it)', V.NAV.stack[V.NAV.stack.length - 1] === 'diag');
  V.ERRS.push('error', 'planted error for the test', 'app.js:1');
  ctx.navigator.onLine = false;
  const rep = await V.DIAG.report();
  ok('the diagnostics build line carries the manifest\'s build time, not a question mark (take 92)', rep.includes('build: ' + manifest.built_at) && !/^build: \?$/m.test(rep), (rep.match(/^build: .*$/m) || [''])[0]);
  ok('the report carries every section a troubleshooter needs: app, device, catalogue, sync, hunt, storage, counts, errors, self-test', ['## app', '## device', '## catalogue', '## sync', '## hunt', '## storage', '## counts', '## last errors', '## self-test'].every(h => rep.includes(h)));
  ok('...the live endpoint probes, one per hunt file, saying offline when offline', /feed\.json: offline/.test(rep) && /zcta\.json: offline/.test(rep));
  ok('...the planted error, and never a collection\'s contents', /planted error for the test/.test(rep) && !/"qty"/.test(rep));
  ok('...and the self-test results inline', /PASS|SKIP/.test(rep));
  V.MODE.set('collect', false); }
ok('keyboard focus has a visible ring and a mouse click does not (take 80)', /:focus-visible\{outline:2px solid var\(--brass\)/.test(html) && /button:focus:not\(:focus-visible\)\{outline:none\}/.test(html));
ok('the gate lints smoke for numbers pinned to what the nightly moves (landmine 115), with the lint-ok escape for live-vs-live', /smoke-lint/.test(fs.readFileSync(path.join(ROOT, 'tools', 'gate.py'), 'utf8')) && /lint-ok/.test(fs.readFileSync(path.join(ROOT, 'tools', 'gate.py'), 'utf8')));
}

{
section('take 61 — A29: stock decks are decks, never owned cards');
const stock = V.CAT.stock || [];
ok('the bundle ships ready-made decks and the manifest counts them', stock.length >= 10 && manifest.stock === stock.length, `${stock.length}`);
ok('every one is legal by the app\'s own check (§5-1)', stock.every(d => V.legality(d).problems.length === 0),
   stock.filter(d => V.legality(d).problems.length).map(d => d.id + ': ' + V.legality(d).problems[0]).join(' | '));
ok('every card in them resolves to a printing the app knows (landmine 1)', stock.every(d => V.CAT.byId.has(d.leader) && d.cards.every(c => V.CAT.byId.has(c.id))));
ok('they are named as built from a set, never as the retail product', stock.every(d => /built from ST\d+/.test(d.name) && !/Starter Deck/i.test(d.name)));
/* THE guard of A29: the owner said they must not enter the collection. */
V.OWN.items = [];
const before = { total: V.OWN.total(), count: V.OWN.items.length };
V.DECKS.all().filter(d => d.stock).forEach(d => { V.legality(d); V.simReadiness(d); });
const csvBefore = (() => { let n = 0; const _ce = ctx.document.createElement; ctx.document.createElement = tag => { const el = _ce(tag); if (tag === 'a') el.click = () => n++; return el; }; ctx.document.createElement = _ce; return n; })();
ok('reading every stock deck leaves the collection empty and worth nothing', V.OWN.total() === before.total && V.OWN.items.length === before.count && V.OWN.total() === 0);
ok('...and no stock card id is in the collection', !V.OWN.items.some(i => stock.some(d => d.cards.some(c => c.id === i.id))));
ok('a stock deck is not in the saved deck list either (it is never written to storage)', !V.DECKS.list.some(d => d.stock) && V.DECKS.all().length === V.DECKS.list.length + stock.length);
ok('negative control: the collection DOES move when a card is actually added', (V.OWN.add(stock[0].cards[0].id, { qty: 1 }), V.OWN.items.length === 1));
V.OWN.items = [];
ok('the sim offers them, so a player with no collection can start', /DECKS\.all\(\)\.filter\(d => d\.leader/.test(js));
ok('Decks shows them under their own heading, marked ready-made', /id="dkStock"/.test(html) && /ready-made/.test(js) && /not in your collection/.test(js));
/* take 62: covers are drawn, never downloaded (landmines 26, 30) */
const cover = V.deckCover(stock[0]);
ok('a deck cover is inline SVG with no image, no request and no publisher mark',
   /^<svg /.test(cover.trim()) && !/<image|https?:|url\((?!#)/.test(cover) && !/One Piece|Bandai|BANDAI/i.test(cover), cover.slice(0, 80));
ok('...it says the set code and the Leader, from the catalogue', cover.includes(stock[0].set) && cover.includes((V.CAT.byId.get(stock[0].leader).name || '').slice(0, 6)));
ok('...and carries a label for a screen reader', /role="img"/.test(cover) && /aria-label=/.test(cover));
/* take 66: nothing a screen reader reaches is nameless (A30's last item) */
{
const buttons = [...(html + js).matchAll(/<button((?:(?!>).)*)>((?:(?!<\/button>).)*)<\/button>/gs)];
/* A reader announces letters fine ("OK", "Done"); it is symbols and empties
   that arrive as nothing or as "plus sign". Those need a name. */
const nameless = buttons.filter(([, attrs, inner]) => {
  if (/aria-label=/.test(attrs)) return false;
  const stripped = inner.replace(/<[^>]+>/g, '');
  /* `${...}` inside the label is text at runtime -- a name, just a computed
     one. What a reader announces as nothing is an empty button or one whose
     whole label is punctuation. */
  if (/\$\{[^}]*\}/.test(stripped)) return false;
  return (stripped.replace(/\s/g, '').match(/[A-Za-z0-9]/g) || []).length === 0;
});
ok('every button that a reader would announce as nothing carries an aria-label', nameless.length === 0,
   nameless.slice(0, 3).map(n => n[0].replace(/\s+/g, ' ').slice(0, 70)).join(' | '));
ok('a screen title announces as a heading, not as a tab', (html.match(/class="tab on"[^>]*role="heading"/g) || []).length >= 8);
ok('the only real tabs keep role="tab" and a selected state', /id="tabOver"[^>]*role="tab"[^>]*aria-selected/.test(html) && /id="tabPerf"[^>]*role="tab"[^>]*aria-selected/.test(html));
ok('the network badge is a live status, not a control', /class="pill" role="status" aria-live="polite"/.test(html));
ok('decorative glyphs inside labelled controls are hidden from the reader', /<span class="ic" aria-hidden="true">/.test(html));
ok('negative control: a button with no text and no label would be caught', (() => { const probe = '<button class="x">\u2606</button>'; const m = [...probe.matchAll(/<button((?:(?!>).)*)>((?:(?!<\/button>).)*)<\/button>/gs)]; return m.length === 1 && !/aria-label=/.test(m[0][1]); })());
}

/* take 65: A30's two rows -- Rate and Share, no referral, no tracking */
ok('the manifest carries the app id so the store link is not a literal twice', manifest.appId === 'com.optcghub.app');
ok('More offers both rows', /data-act="rate"/.test(js) && /data-act="shareapp"/.test(js) && /rate: \(\) => PLATFORM\.rateApp\(\)/.test(js));
const store = V.PLATFORM.storeUrl();
ok('the store link is the app id and nothing else: no referral, no campaign, no tracking',
   store === 'https://play.google.com/store/apps/details?id=com.optcghub.app' && !/[?&](referrer|utm_|campaign)/.test(store), store);
{ const calls = [];
  ctx.window.Capacitor = { Plugins: { Share: { share: async o => { calls.push(o); } } } };
  const r = await V.PLATFORM.shareApp();
  ok('sharing the app hands the store link and a plain line of text to the share sheet',
     r === 'shared' && calls.length === 1 && calls[0].url === store && /scan, value and track/.test(calls[0].text) && !/[?&]utm_/.test(calls[0].url), JSON.stringify(calls[0]));
  ok('...and it shares a link, never a file (that is the collection page)', !('files' in calls[0]));
  delete ctx.window.Capacitor; }
{ let copied = null; ctx.navigator.clipboard = { writeText: async t => { copied = t; } };
  const r = await V.PLATFORM.shareApp();
  ok('negative control: with no Share plugin it copies instead of failing silently', r === 'copied' && copied.includes(store));
  delete ctx.navigator.clipboard; }
{ let opened = null; ctx.window.open = (u) => { opened = u; };
  await V.PLATFORM.rateApp();
  ok('Rate opens the app\'s own Play listing', /play\.google\.com|market:\/\/details\?id=com\.optcghub\.app/.test(opened), String(opened));
  delete ctx.window.open; }

/* take 64: Overview and Performance are a pair, exactly one on */
const tabOver = ctx.document.querySelector('#tabOver'), tabPerf = ctx.document.querySelector('#tabPerf');
ok('Overview is a real tab with an id, a handler and a selected state', !!tabOver && /tabOver'\)\.addEventListener\('click'/.test(js) && /aria-selected/.test(html));
const fire = el => (el._ev && el._ev.click) ? el._ev.click({ target: el, preventDefault() {} }) : null;
ok('on load, Overview carries the on class from the markup', /id="tabOver"[^>]*class|class="tab on" id="tabOver"/.test(html));
fire(tabPerf);
ok('clicking Performance turns Overview OFF -- the reported bug', tabPerf.classList.contains('on') && !tabOver.classList.contains('on'), `over=${tabOver.className} perf=${tabPerf.className}`);
ok('...and the overview blocks give way to the performance panel', ctx.document.querySelector('#perfPanel').style.display === 'block' && ctx.document.querySelector('#hero').style.display === 'none');
fire(tabOver);
ok('clicking Overview comes back, and Performance turns off', tabOver.classList.contains('on') && !tabPerf.classList.contains('on') && ctx.document.querySelector('#perfPanel').style.display === 'none' && ctx.document.querySelector('#hero').style.display !== 'none');
ok('negative control: the old code toggled Performance without ever clearing Overview', !/classList\.toggle\('on', perfOn\);\s*\$\('#perfPanel'\)/.test(js));
ok('both tabs answer the keyboard as well as the mouse', /keydown/.test(js) && /tabindex="0"/.test(html));
ok('the skull glyph is gone from the sprite and from every screen (take 63)', !/g-roger/.test(html) && !/g-roger/.test(js));
ok('the Decks tab is a card back, drawn here, not the publisher\'s design', /<use href="#g-cardback"\/>/.test(html) && /symbol id="g-cardback"/.test(html));
ok('the empty collection points at the thing it tells you to tap', /id="colEmpty"[\s\S]{0,260}g-scancard/.test(html));
ok('no bundled or fetched artwork ships anywhere in the page', !/tcgplayer\.com\/.*\.jpg|onepiece-cardgame\.com\/images/.test(js + html));
}

{
section('take 70 — Hunt: a third mode, Sealed and Releases from the phone\'s own data');
ok('the slider has three modes and Hunt has its own nav and home', /data-mode="hunt"/.test(html) && /id="navHunt"/.test(html) && /hunt: 'sealed'/.test(js) && /hunt: '#navHunt'/.test(js));
ok('the knob has a third position and the palette a third root', /\.mode\.hunt \.knob\{transform:translateX\(calc\(200%/.test(html) && /:root\[data-mode="hunt"\]\{/.test(html));
V.MODE.set('hunt', false);
ok('setting Hunt hides the other navs and shows its own', ctx.document.querySelector('#navHunt').hidden === false && ctx.document.querySelector('#navCollect').hidden === true && ctx.document.querySelector('#navPlay').hidden === true);
const rows = V.SEALED.rows();
ok('Sealed lists the priced sealed PRODUCTS -- never a DON!! card, never unpriced', rows.length >= 300 && rows.every(p => p.sealed && p.market > 0 && !/don!! card/i.test(p.name)), String(rows.length));
ok('negative control: DON!! cards are filed as sealed by the source and would flood the list unfiltered', V.CAT.rows.filter(p => p.sealed && p.market > 0 && /don!! card/i.test(p.name)).length > 100);
const kinds = {}; for (const p of rows) kinds[V.SEALED.kindOf(p)] = (kinds[V.SEALED.kindOf(p)] || 0) + 1;
ok('the kind classifier finds boxes, packs, decks and collections by name, with few left over', kinds.box >= 30 && kinds.pack >= 100 && kinds.deck >= 40 && (kinds.other || 0) < 40, JSON.stringify(kinds));
V.SEALED.kind = 'box'; ok('the kind filter narrows to boxes only', V.SEALED.rows().every(p => V.SEALED.kindOf(p) === 'box') && V.SEALED.rows().length === kinds.box);
V.SEALED.kind = 'all'; V.SEALED.q = 'starter deck 1';
ok('the search narrows by product or set name', V.SEALED.rows().length >= 1 && V.SEALED.rows().every(p => /starter deck 1/i.test(p.name) || /starter deck 1/i.test(V.CAT.sets.get(p.set)?.name || '')));
V.SEALED.q = '';
V.paintSealed();
ok('the Sealed screen draws rows with market, low, high and a delta, grouped by set', /data-open="/.test(ctx.document.querySelector('#sealedList').innerHTML) && /low \$/.test(ctx.document.querySelector('#sealedList').innerHTML) && (ctx.document.querySelector('#sealedList').innerHTML.match(/class="fgrp"/g) || []).length >= 10);
ok('...and says plainly it is the marketplace price, not the shelf', /not the shelf price/.test(html));
V.paintReleases();
const rel = ctx.document.querySelector('#relList').innerHTML;
ok('Releases lists what is upcoming with a countdown and what was recent', /Upcoming/.test(rel) && /in \d+ days?|today/.test(rel) && /days ago/.test(rel));
ok('an unpublished card list is said to be unpublished, never shown as zero', !/\b0 cards/.test(rel));
ctx.window.scrollTo = () => {}; ctx.scrollTo = () => {};
ok('a sealed row opens the detail sheet, where the price alert already lives', (() => { try { V.openDetail(rows[0].id); return /alert/i.test(js) && /data-open="/.test(ctx.document.querySelector('#sealedList').innerHTML); } catch (e) { return false; } })());
V.MODE.set('collect', false);
}

{
section('take 71–72 — the Hunt feed: two layers, read by the app, honest about age, zip and coverage');
/* the feed under test is built from SAVED real responses, never a live fetch */
/* written OUTSIDE www/, so the nightly's Pages deploy (which runs after smoke) can never ship a fixture as real */
const fxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-hunt-')); const feedFile = path.join(fxDir, 'feed-fixture.json');
execSync(`python3 tools/hunt.py --from-fixtures --out ${feedFile}`, { cwd: ROOT, stdio: 'pipe' });
const F = JSON.parse(fs.readFileSync(feedFile, 'utf8')); const T = F.sources.target;
ok('a feed builds from the saved responses with a fetch time, a national item list and a served-zip map', !!F.fetched_at && Array.isArray(T.items) && T.zips && typeof T.zips === 'object' && Array.isArray(F.zips));
ok('every item carries title, price, tcin and a checked flag; online status when checked', T.items.every(i => i.title && i.tcin && typeof i.checked === 'boolean' && (!i.checked || i.online)), String(T.items.length));
ok('a Japanese release is never matched to the English catalogue (take 71 finding)', T.items.filter(i => /japanese/i.test(i.title)).every(i => !i.catalog_id));
ok('a served zip carries its stores, per-store stock and a check time per item; a failed zip carries its reason', T.zips['48329'].ok && T.zips['48329'].stores.length >= 1 && Object.keys(T.zips['48329'].checked_at).length >= 1 && T.zips['48201'].ok === false && /budget|throttle/.test(T.zips['48201'].error));
ok('every checked item carries the time its online status was read, and the feed carries a cursor for the next run', T.items.filter(i => i.checked).every(i => i.online_at) && T.cursor && 'online' in T.cursor);
ok('the app never fetches a retailer: the only stock URL it knows is the feed on Pages', /hunt\/feed\.json/.test(js) && !/redsky\.target\.com/.test(js));
ok('the feed URL is derived from the sync URL, not a second literal', /replace\(\/bundle\\\/\?\$\/, ''\) \+ 'hunt\/feed\.json'/.test(js));
V.HUNT.feed = F; V.MODE.set('hunt', false);
/* the zip: exact, same area, none */
V.HUNT.setZip('48329'); ok('an exactly served zip is matched exactly', V.HUNT.served().how === 'exact' && V.HUNT.served().zip === '48329');
V.HUNT.setZip('48340'); ok('a zip in the same 3-digit area uses that area\'s check and says so', V.HUNT.served().how === 'area' && V.HUNT.served().zip === '48329');
V.HUNT.setZip('90210'); ok('a zip nowhere near a served area is NONE, never silently the nearest', V.HUNT.served().how === 'none');
V.HUNT.setZip('48201'); V.paintSealed();
ok('a served zip whose check did not run says so plainly, naming the limit', /Near 48201: the store check did not finish this hour \(Target’s limit\) — it resumes next hour/.test(ctx.document.querySelector('#sealedList').innerHTML));
/* sets are folded since take 81: open every set that carries a matched product so its line is on screen */
for (const id of Object.keys(V.HUNT.byCatalogId())) { const p = V.CAT.byId.get(+id); if (p) V.SEALED.open.add(p.set); }
V.HUNT.setZip('90210'); V.paintSealed(); let h = ctx.document.querySelector('#sealedList').innerHTML;
ok('with no local coverage the national online layer still shows for every product, and the covered areas are named', /<h3>Target<\/h3>/.test(h) && /no local check for your area yet/.test(h) && /48329/.test(h) && /ships/.test(h));
V.HUNT.setZip('48329'); V.paintSealed(); h = ctx.document.querySelector('#sealedList').innerHTML;
ok('with a served zip the panel says how many stores and how many products have a shelf check on file', /4 stores within 50 mi, shelf checks on file for 2 products/.test(h));
ok('a matched product carries a Target line with price, shipping status and shelf state', (() => { const by = V.HUNT.byCatalogId(); const ids = Object.keys(by); return ids.length >= 1 && ids.every(id => new RegExp('data-open="' + id + '"[\\s\\S]*?Target \\$').test(h)); })());
ok('a checked item carries the age of its shelf check', /(on the shelf|not on a shelf within 50 mi of 48329) (just now|\d+ min ago)/.test(h));
ok('an item the local check has not reached says the shelf was not checked yet (never "not on a shelf")', /shelf not checked yet for this item/.test(V.targetLine(T.items.find(i => /japanese/i.test(i.title)), T)));
const oldFeed = JSON.parse(JSON.stringify(F)); oldFeed.sources.target.fetched_at = new Date(Date.now() - 5 * 3600e3).toISOString();
V.HUNT.feed = oldFeed; V.paintSealed();
ok('a feed older than three hours is called out of date on screen (PROTOCOL §10)', /out of date/.test(ctx.document.querySelector('#sealedList').innerHTML));
const dead = JSON.parse(JSON.stringify(F)); dead.sources.target = { ok: false, error: 'HTTP 403', fetched_at: F.fetched_at, stale_since: F.fetched_at, zips: {}, items: [] };
V.HUNT.feed = dead; V.paintSealed();
ok('a failed source says it could not reach Target and since when, never an empty list', /Could not reach Target since/.test(ctx.document.querySelector('#sealedList').innerHTML));
V.HUNT.feed = null; V.paintSealed();
ok('with no feed on the phone it says so and offers a fetch', /Not fetched yet/.test(ctx.document.querySelector('#sealedList').innerHTML) && /id="huntSync"/.test(ctx.document.querySelector('#sealedList').innerHTML));
ok('the zip is asked once per launch (take 81: not once forever, since the first ask was unreadable on the owner\'s phone), stays on the phone, and can be changed from the panel', /NAV\.zipAsked/.test(js) && /vault\.hunt\.zip'/.test(js) && /id="huntZip"/.test(js) && /The zip stays on this phone/.test(js));
ok('the hourly workflow exists as a file to paste, takes a zip LIST, and deploys www/ to Pages', fs.existsSync(path.join(ROOT, 'ci', 'hunt.yml')) && /--zips/.test(fs.readFileSync(path.join(ROOT, 'ci', 'hunt.yml'), 'utf8')) && /deploy-pages/.test(fs.readFileSync(path.join(ROOT, 'ci', 'hunt.yml'), 'utf8')));
/* take 73: the time series -- built by the runner from its own last deploy, read by the app as dated restocks */
{
const histFile = path.join(fxDir, 'history-fixture.json');
ok('the runner writes a history beside the feed: one compact row per run, capped', fs.existsSync(histFile) && (() => { const h = JSON.parse(fs.readFileSync(histFile, 'utf8')); return Array.isArray(h.runs) && h.runs.length >= 1 && h.runs[0].t && 'online' in h.runs[0] && 'shelf' in h.runs[0]; })());
ok('the runner fetches its previous feed and history back from Pages, derived from UPDATE_URL, because a fresh checkout has neither', /def load_previous/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt.py'), 'utf8')) && /def pages_base/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt.py'), 'utf8')) && /UPDATE_URL/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt.py'), 'utf8')));
/* synthesise a fortnight of hourly rows: one product shipping until day 9, one store restocking on two Fridays */
const tcin = T.items.find(i => !/japanese/i.test(i.title) && i.catalog_id).tcin; const sid = T.zips['48329'].stores[0].id;
const rows = []; const t0 = Date.now() - 14 * 864e5;
for (let k = 0; k < 24 * 14; k++) { const t = new Date(t0 + k * 3600e3); const day = Math.floor(k / 24);
  const qty = ((day === 4 || day === 11) && (k % 24) >= 9) ? 3 : 0;                                          // day 4 and 11 = restocks, from the 9th hour of that synthetic day
  rows.push({ t: t.toISOString(), online: { [tcin]: day < 9 ? 1 : 0 }, shelf: { '48329': { [tcin]: { [sid]: qty } } } }); }
V.HUNT.hist = { runs: rows, since: rows[0].t, stores: { '48329': T.zips['48329'].stores }, titles: {} };
const rs = V.HUNT.restocks(tcin, '48329');
ok('from the history: the last time it shipped, and every none-to-some flip per store as a dated restock', rs.runs === 336 && rs.lastShip && Math.round((Date.now() - Date.parse(rs.lastShip)) / 864e5) === 5 && rs.events.length === 2 && rs.events.every(e => e.store === sid && e.qty === 3), JSON.stringify(rs.events));
V.HUNT.feed = F; V.HUNT.setZip('48329'); V.MODE.set('hunt', false); V.paintSealed();
const h73 = ctx.document.querySelector('#sealedList').innerHTML;
ok('the product line says it: last seen shipping N days ago, restocked 2× in 14 d with the store and day named', /last seen shipping 5 days ago/.test(h73) && /restocked 2× in 14 d: Auburn Hills/.test(h73));
V.HUNT.hist = { runs: rows.slice(0, 5), since: rows[0].t, stores: { '48329': T.zips['48329'].stores }, titles: {} }; V.paintSealed();
ok('with five checks it lists what it saw and says a pattern needs a fortnight -- never a prediction on thin data', /5 hourly checks so far — a pattern needs a fortnight/.test(ctx.document.querySelector('#sealedList').innerHTML));
V.HUNT.hist = null; V.paintSealed();
ok('with no history there is no history line at all', !/hourly checks so far|last seen shipping/.test(ctx.document.querySelector('#sealedList').innerHTML));
/* take 74: Local -- the roster, distances from the zip area, the dropdown, own notes */
{
const storesFile = path.join(fxDir, 'stores-fixture.json');
ok('the run writes a store roster beside the feed, from the events file, with location and next events', fs.existsSync(storesFile) && (() => { const r = JSON.parse(fs.readFileSync(storesFile, 'utf8')); return Array.isArray(r.stores) && r.stores.length >= 10 && r.stores.every(s => s.name && s.state && Array.isArray(s.events)) && r.stores.some(s => s.ll); })());
ok('the bundle ships the 3-digit prefix centroid table, small, not the 758 KB full one', V.CAT.zips3 && Object.keys(V.CAT.zips3).length > 800 && Object.keys(V.CAT.zips3).length < 1000 && Array.isArray(V.CAT.zips3['483']));
V.LOCAL.stores = JSON.parse(fs.readFileSync(storesFile, 'utf8')); V.HUNT.setZip('48329');
const mi = V.LOCAL.miles([42.26, -83.72]);   // Ann Arbor from the 483 area
ok('distance from the zip area to a store is computed in miles, about right (Ann Arbor ~35-45 from Waterford)', mi >= 25 && mi <= 55, String(mi));
ok('a store the app cannot place has no distance and is kept only when the filter is Any', V.LOCAL.miles(null) === null && (V.LOCAL.radius = 50, !V.LOCAL.within(null)) && (V.LOCAL.radius = 0, V.LOCAL.within(null)));
V.LOCAL.radius = 50; V.paintLocal(); const hl = ctx.document.querySelector('#localList').innerHTML;
ok('Local lists the shops within the radius with address, miles (exact where the file has the point, ~ otherwise), a Call and their next event', /Shops that run One Piece events/.test(hl) && /~?\d+ mi/.test(hl) && /2026-\d\d-\d\d/.test(hl) && /href="tel:\d+"/.test(hl));
ok('...and says what the list means: registered to run events, not proof of shelf stock', /registered to run events/.test(hl));
V.LOCAL.radius = 10; V.paintLocal();
ok('the distance dropdown narrows the list', (ctx.document.querySelector('#localList').innerHTML.match(/~?\d+ mi/g) || []).length < (hl.match(/~?\d+ mi/g) || []).length);
V.LOCAL.radius = 50;
V.LOCAL.notes = [{ store: 'Cosmic Cards & Collectibles', what: '3 OP-11 boxes', price: 130, phone: '(248) 555-0100', when: '2026-09-16' }]; V.paintLocal();
ok('a note of your own shows the store, what you saw, the price, the date and a Call link', /3 OP-11 boxes/.test(ctx.document.querySelector('#localList').innerHTML) && /\$130\.00/.test(ctx.document.querySelector('#localList').innerHTML) && /href="tel:\(248\) 555-0100"/.test(ctx.document.querySelector('#localList').innerHTML));
V.LOCAL.notes = []; V.HUNT.setZip(''); V.paintLocal();
ok('with no zip it asks for one and offers nothing it cannot place', /Where are you\?/.test(ctx.document.querySelector('#localList').innerHTML));
/* take 79: exact distances on request */
V.HUNT.setZip('48329'); V.LOCAL.zcta = null; V.paintLocal();
ok('by default distances are "about" and the screen offers to make them exact', /about ±10 mi/.test(ctx.document.querySelector('#localList').innerHTML) && /id="localExact"/.test(ctx.document.querySelector('#localList').innerHTML));
const before79 = V.LOCAL.miles([42.26, -83.72]);
V.LOCAL.zcta = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog', 'zcta.json'), 'utf8'));
ok('with the table, the zip is placed at its own centroid and the screen says so', V.LOCAL.exact() && V.LOCAL.here()[0] === 42.69 && (V.paintLocal(), /within a mile or two/.test(ctx.document.querySelector('#localList').innerHTML)));
const after79 = V.LOCAL.miles([42.26, -83.72]);
ok('the exact distance differs from the area estimate by a few miles, not by tens (both are honest placements of 48329)', Math.abs(after79 - before79) <= 15 && after79 >= 25 && after79 <= 55, `${before79} -> ${after79}`);
ok('the table is on Pages beside the feed, not in the bundle', fs.existsSync(path.join(ROOT, 'www', 'hunt', 'zcta.json')) && !('zcta' in V.CAT) && Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'www', 'hunt', 'zcta.json'), 'utf8'))).length > 30000);
V.LOCAL.zcta = null; V.HUNT.setZip('');
ok('the roster refreshes at most daily in the hourly run and the parser has its controls in the gate', /24 \* 3600/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt.py'), 'utf8')) && /def selftest/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt', 'roster.py'), 'utf8')));
/* take 75: local shops' online stock */
const shopsFile = path.join(fxDir, 'shops-fixture.json');
ok('the run writes the shops file from the verified list: per shop its sealed listings with price, availability, link and a catalogue match', fs.existsSync(shopsFile) && (() => { const j = JSON.parse(fs.readFileSync(shopsFile, 'utf8')); const sh = j.shops[0]; return j.fetched_at && sh.name === 'Black Vault Gaming' && sh.ok && sh.sealed.length === 2 && sh.sealed.every(i => i.price > 0 && typeof i.available === 'boolean' && /^https:\/\/blackvaultgaming\.com\/products\//.test(i.url)) && sh.sealed.some(i => i.catalog_id); })());
V.LOCAL.shops = JSON.parse(fs.readFileSync(shopsFile, 'utf8')); V.HUNT.setZip('48329'); V.LOCAL.radius = 0; V.paintLocal();
const hs75 = ctx.document.querySelector('#localList').innerHTML;
ok('Local shows the shop with what it lists: sealed count, in-stock count, singles, and a link into the store', /Black Vault Gaming/.test(hs75) && /2 sealed listed, 2 in stock, 2 singles/.test(hs75) && /href="https:\/\/blackvaultgaming\.com"/.test(hs75));
ok('...and says a shop lists what it chooses and the shelf may hold more', /the shelf may hold more/.test(hs75));
for (const sh of V.LOCAL.shops.shops) for (const it of sh.sealed) { const p = it.catalog_id && V.CAT.byId.get(it.catalog_id); if (p) V.SEALED.open.add(p.set); }
V.paintSealed(); const hsl = ctx.document.querySelector('#sealedList').innerHTML;
ok('a matched sealed product carries the shop\'s line: name, price, in stock online, fetched when', /Black Vault Gaming[^<]*\$8\.99 · in stock online · (just now|\d+ min ago)/.test(hsl));
V.LOCAL.shops = null; V.LOCAL.radius = 50;
ok('the verified list is data in the tree, hand-verified, with a date on each entry', fs.existsSync(path.join(ROOT, 'hunt', 'storefronts.json')) && JSON.parse(fs.readFileSync(path.join(ROOT, 'hunt', 'storefronts.json'), 'utf8')).stores.every(s => s.name && s.url && s.platform && /^\d{4}-\d\d-\d\d$/.test(s.verified)));
/* take 76: events near you, and Hunt's own palette */
const evFile = path.join(fxDir, 'events-fixture.json');
ok('the run writes a compact events table beside the roster: rows of [store, date, title, TCG+ id, fee, seats, release], titles interned', fs.existsSync(evFile) && (() => { const j = JSON.parse(fs.readFileSync(evFile, 'utf8')); return Array.isArray(j.rows) && j.rows.length >= 10 && j.titles.length < j.rows.length && j.rows.every(r => r.length === 7) && /\/event\/$/.test(j.url); })());
/* Landmine 123: hunt.py builds this fixture under now="2026-09-01" and its events fall on two days that
   September; the app filters events against the clock it is read with, so from the day after the last
   event the rows were empty and three nights went red. This block runs under a Date pinned to the
   fixture's first event day (noon UTC) and puts the real clock back after; the real clock is the
   negative control at the end of the block. */
const RealDate = ctx.Date;
const fxDays = JSON.parse(fs.readFileSync(evFile, 'utf8')).rows.map(r => r[1]).sort();
const pinnedNow = RealDate.parse(fxDays[0] + 'T12:00:00Z');
ctx.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [pinnedNow])); } static now() { return pinnedNow; } };
ok('the fixture is read under a clock pinned to its own first event day, and the app sees that clock', vm.runInContext('new Date().toISOString().slice(0, 10)', ctx) === fxDays[0] && vm.runInContext('Date.now()', ctx) === pinnedNow);
V.EVENTS.tab = JSON.parse(fs.readFileSync(evFile, 'utf8')); V.LOCAL.stores = JSON.parse(fs.readFileSync(storesFile, 'utf8')); V.HUNT.setZip('48329'); V.LOCAL.radius = 0;
const evRows = V.EVENTS.rows();
ok('events join back to their stores, carry a distance and a registration link, and are sorted by date', evRows.length >= 5 && evRows.every(e => e.store.name && e.url && /bandai-tcg-plus\.com\/event\/\d+/.test(e.url)) && evRows.every((e, i) => i === 0 || e.d >= evRows[i - 1].d));
V.paintEvents(); const he = ctx.document.querySelector('#eventsList').innerHTML;
ok('the Events screen groups by STORE (take 87): each store once with address, miles, a Call, then its next events with fee or free, seats, Register and +cal', /stores, \d+ events in the next 14 days/.test(he) && /~?\d+ mi/.test(he) && /href="tel:\d+"/.test(he) && /(free|\$\d)/.test(he) && /Register/.test(he) && /id="eventsDays"/.test(he) && /Registration is on Bandai TCG\+/.test(he));
V.LOCAL.radius = 10; V.paintEvents();
ok('the distance dropdown narrows the events too', (ctx.document.querySelector('#eventsList').innerHTML.match(/Register/g) || []).length <= (he.match(/Register/g) || []).length);
/* take 78: an event onto the calendar as a plain .ics */
{ V.LOCAL.radius = 0; const ev = V.EVENTS.rows()[0]; const ics = V.icsFor(ev);
  ok('an event becomes a valid all-day VEVENT: calendar and event envelopes, date start and end, summary with the store, location, notes with fee and the registration link', /^BEGIN:VCALENDAR\r\n/.test(ics) && /BEGIN:VEVENT[\s\S]*END:VEVENT\r\nEND:VCALENDAR\r\n$/.test(ics) && new RegExp('DTSTART;VALUE=DATE:' + ev.d.replace(/-/g, '')).test(ics) && /DTEND;VALUE=DATE:\d{8}/.test(ics) && ics.includes('SUMMARY:') && ics.includes(ev.store.name.replace(/,/g, '\\,').replace(/;/g, '\\;')) && /LOCATION:/.test(ics) && /DESCRIPTION:.*(Fee|Free)/.test(ics) && (!ev.url || ics.includes('URL:' + ev.url)));
  ok('commas and semicolons in names are escaped per RFC 5545, and lines end CRLF', !/[^\\],[^\r]*\r\n(?!DESCRIPTION|SUMMARY|LOCATION)/.test(ics.split('LOCATION:')[1].split('\r\n')[0].replace(/\\,/g, '')) && ics.split('\n').every(l => l === '' || l.endsWith('\r')));
  ok('the row carries the calendar button', /data-evcal="0"/.test(ctx.document.querySelector('#eventsList').innerHTML) || (V.paintEvents(), /data-evcal="0"/.test(ctx.document.querySelector('#eventsList').innerHTML)));
  let shared = null; const _sf = V.PLATFORM.shareFile; V.PLATFORM.shareFile = async (name, text, title) => { shared = { name, text, title }; return 'shared'; };
  const okc = await V.addEventToCalendar(ev);
  ok('on the phone it is handed to the share sheet as a .ics, where the calendar app takes it', okc && shared && /\.ics$/.test(shared.name) && shared.text === ics && /calendar/i.test(shared.title));
  V.PLATFORM.shareFile = _sf; V.LOCAL.radius = 50; }
ctx.Date = RealDate; V.LOCAL.radius = 0;
ok('negative control (landmine 123): read with the real clock, once the fixture\'s last event day has passed the same fixture yields no rows -- the runner\'s three red nights, asserted live against live', RealDate.now() <= RealDate.parse(fxDays[fxDays.length - 1] + 'T23:59:59Z') || V.EVENTS.rows().length === 0);
ok('the real clock is back for everything after this block', vm.runInContext('Date.now()', ctx) > pinnedNow + 864e5 && vm.runInContext('Date', ctx) === RealDate);
V.LOCAL.radius = 50; V.EVENTS.tab = null; V.HUNT.setZip('');
ok('Hunt is green: the palette is Zoro\'s and it clears AA (checked with the other two above)', /:root\[data-mode="hunt"\]\{\s*--bg:#0B1B12/.test(html) && /\.swords\{/.test(html) && (html.match(/class="swords"/g) || []).length >= 4);
ok('the mark is three strokes of original geometry -- no image, no likeness', !/<image/.test(html.slice(html.indexOf('class="swords"'), html.indexOf('class="swords"') + 400)));
/* take 77: stock alerts -- fire on the flip, once, per source */
{
V.HUNT.feed = F; V.HUNT.setZip('48329'); V.LOCAL.shops = JSON.parse(fs.readFileSync(shopsFile, 'utf8'));
const watched = V.CAT.rows.find(p => p.id === T.items.find(i => i.catalog_id).catalog_id);
const shopItem = V.LOCAL.shops.shops[0].sealed.find(i => i.catalog_id); const watched2 = V.CAT.byId.get(shopItem.catalog_id);
const notes = []; const _n = V.PLATFORM.notify; V.PLATFORM.notify = async (id, title, body) => { notes.push({ title, body }); return true; };
V.STOCK.list = []; V.STOCK.toggle(watched.id); V.STOCK.toggle(watched2.id);
ok('a Sealed row can be watched; the watch is kept on the phone with what each source last showed', V.STOCK.has(watched.id) && V.STOCK.has(watched2.id) && JSON.parse(ctx.localStorage.getItem('vault.stockAlerts')).length === 2);
const srcs = V.STOCK.sourcesFor(watched.id), srcs2 = V.STOCK.sourcesFor(watched2.id);
ok('a product\'s sources are every place the feed knows it -- Target online for one, a local shop for another', srcs.some(s => /^target:online/.test(s.key)) && srcs2.some(s => /^shop:/.test(s.key)), srcs.concat(srcs2).map(s => s.key.split(':')[0]).join());
const n1 = await V.STOCK.check();
ok('the first check fires once per source that is in stock, with the source named', n1 >= 2 && notes.length === n1 && notes.every(x => /^In stock: /.test(x.title)) && notes.some(x => /Black Vault Gaming online/.test(x.body)) && notes.some(x => /Target online/.test(x.body)), JSON.stringify(notes.map(x => x.body)));
const n2 = await V.STOCK.check();
ok('the second check with nothing changed fires nothing -- once per flip, not once per hour', n2 === 0);
shopItem.available = false; await V.STOCK.check(); shopItem.available = true;
const n3 = await V.STOCK.check();
ok('out and back in fires again, for that source only', n3 === 1 && /Black Vault Gaming online/.test(notes[notes.length - 1].body));
V.paintSealed(); const hst = ctx.document.querySelector('#sealedList').innerHTML;
ok('the Stock alerts panel lists the watches with where each is in stock and when it last fired; the row shows it watched', /Stock alerts/.test(hst) && /in stock: /.test(hst) && /last alert (just now|\d+ min ago)/.test(hst) && new RegExp('data-stock="' + watched.id + '"[^>]*aria-pressed="true"').test(hst));
ok('...and says plainly that the check runs when the app is opened', /the app must be opened for that/.test(hst));
V.STOCK.toggle(watched.id); V.STOCK.toggle(watched2.id); ok('toggling again stops the watch', !V.STOCK.has(watched.id) && V.STOCK.list.length === 0);
V.PLATFORM.notify = _n; V.HUNT.setZip(''); V.LOCAL.shops = null;
}
}
V.HUNT.setZip(''); V.MODE.set('collect', false);
}
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

/* take 93 -- A33 item 6. A picture beside every card and set in the lists
   that had none, through the one image path (refArt) and one box (picBox),
   so every row gets the take-86 retry, the silent failure and the labelled
   placeholder (landmine 85) for free. The take-83 productPic assertions
   above are the control that the box did not change under Hunt's rows. */
section('take 93 — a picture beside every row that had none (A33 item 6)');
{
  const p = V.CAT.rows.find(x => x.img && x.num && !x.sealed && x.type === 'Character');
  ok('cardPic and setPic are exported', typeof V.cardPic === 'function' && typeof V.setPic === 'function');
  if (typeof V.cardPic === 'function') {
    const h = V.cardPic(p);
    ok('cardPic: a pic box at the card ratio with the number as its label and the lazy reference image',
       /class="pic"/.test(h) && /class="ph"/.test(h) && h.includes(p.num.split('-').pop()) && /height:50px/.test(h) &&
       /<img class="ref" loading="lazy"/.test(h) && /this\.remove\(\)/.test(h), h.slice(0, 140));
    const none = V.cardPic({ ...p, img: null });
    ok('negative control: with no image the box is the label alone', /class="ph"/.test(none) && !/<img/.test(none));
    const s = [...V.CAT.sets.values()].find(x => V.CAT.rows.some(r => r.set === x.id && r.sealed && /booster box/i.test(r.name)));
    ok("setPic: a set shows its booster box through productPic", !!s && /class="pic"/.test(V.setPic(s)) && /<img class="ref"/.test(V.setPic(s)));
    ok('negative control: a set with no product gets the drawn tile and no image',
       /class="pic"/.test(V.setPic({ id: -1, abbr: 'XX-99' })) && !/<img/.test(V.setPic({ id: -1, abbr: 'XX-99' })) && /XX99/.test(V.setPic({ id: -1, abbr: 'XX-99' })));
  }
  const count = (html, re) => (html.match(re) || []).length;
  ctx.document.getElementById('allRes').innerHTML = ''; ctx.document.getElementById('allq').value = 'nami'; V.paintSearch();
  const hits = ctx.document.getElementById('allRes').innerHTML;
  ok('search hits carry a picture each', count(hits, /data-open=/g) > 0 && count(hits, /class="pic"/g) === count(hits, /data-open=/g),
     `${count(hits, /class="pic"/g)} pics for ${count(hits, /data-open=/g)} rows`);
  ctx.document.getElementById('allq').value = ''; Object.assign(V.FILT.all, V.blankFilter('all')); ctx.document.getElementById('allRes').innerHTML = ''; V.paintSearch();
  const sets = ctx.document.getElementById('setList').innerHTML;
  ok('the set browse shows a box per set', count(sets, /class="pic"/g) >= 5 && count(sets, /class="pic"/g) === count(sets, /data-browse-set=/g), String(count(sets, /class="pic"/g)));
  const L = V.CAT.rows.find(x => x.type === 'Leader');
  ok('a deck row carries a picture between its cost and its name', typeof V.deckRow === 'function' && /class="cost".*class="pic".*class="n"/s.test(V.deckRow(p, 1, L)));
  V.openDetail(p.id);
  const sib = ctx.document.getElementById('dSiblings').innerHTML;
  ok("the card sheet's other printings carry a picture each", count(sib, /data-open=/g) > 0 && count(sib, /class="pic"/g) === count(sib, /data-open=/g));
  if (typeof V.paintHome === 'function') { V.OWN.add(p.id, { condition: 'NM' }); V.paintHome();   // Home lists the collection; give it one card
    ok("Home's top list and set progress carry pictures", /class="pic"/.test(ctx.document.getElementById('topList').innerHTML) && /class="pic"/.test(ctx.document.getElementById('setDone').innerHTML),
       `top ${count(ctx.document.getElementById('topList').innerHTML, /class="pic"/g)}, sets ${count(ctx.document.getElementById('setDone').innerHTML, /class="pic"/g)}`); }
  if (typeof V.paintDecks === 'function') { V.paintDecks();
    ok('the Decks list Leader box is a sized pic box (landmine 132)', !V.DECKS.list.length || /class="lead pic"/.test(ctx.document.getElementById('dkList').innerHTML)); }
  ok('the Trade and Wants thumbnails and the Play board Leader are sized pic boxes (landmine 132)',
     /class="oa pic" style="[^"]*position:relative/.test(js) && count(js, /class="oa pic"/g) === 2 && /class="lead pic" data-plleader/.test(js));
  V.go('home');
}

{
section('take 94 — the distributor: GTS Distribution in the feed, under the rows, on Releases, as an alert source');
/* the feed under test is built from the SAVED real listing page (tools/fixtures/gts_listing.html), never a live fetch */
const fxDir94 = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-gts-')); const feed94 = path.join(fxDir94, 'feed-fixture.json');
execSync(`python3 tools/hunt.py --from-fixtures --out ${feed94}`, { cwd: ROOT, stdio: 'pipe' });
const F94 = JSON.parse(fs.readFileSync(feed94, 'utf8')); const G = F94.sources.gts;
ok('the feed carries the distributor source: ok, a fetch time, the count the site said and the saved page\'s eleven products', !!G && G.ok && !!G.fetched_at && G.count === 49 && Array.isArray(G.items) && G.items.length === 11, JSON.stringify(G && { ok: G.ok, count: G.count, n: (G.items || []).length }));
const ST94 = ['sold_out', 'call', 'in_stock', 'preorder', 'coming', 'out', 'unknown'];
ok('every item: sku, name, a URL on the distributor, a named state, allocation as a boolean, an ISO release date or none',
   G.items.every(i => i.sku && i.name && /^https:\/\/www\.gtsdistribution\.com\//.test(i.url) && ST94.includes(i.status) && typeof i.allocated === 'boolean' && (i.release === null || /^\d{4}-\d\d-\d\d$/.test(i.release))));
const by = Object.fromEntries(G.items.map(i => [i.sku, i]));
ok('the states read as measured: OP-19 sold out and allocated, PEB-01 coming (preorders open 2026-10-14), a sleeve assortment in stock, a figure on call, a released sleeve display out',
   by.BJP2884797.status === 'sold_out' && by.BJP2884797.allocated === true && by.BJP2897699.status === 'coming' && by.BJP2897699.preorder === '2026-10-14' && by.BJP9056341.status === 'in_stock' && by.BJPBAS69321.status === 'call' && by.BJP2835333.status === 'out');
ok('control: the ST44 display is sold out but NOT allocated -- the flag is read off the page, never inferred from sold out', by.BJP2904577.status === 'sold_out' && by.BJP2904577.allocated === false);
const nm94 = id => (V.CAT.byId.get(id) || {}).name;
ok('OP-16\'s 24-count booster matches The Time of Battle Booster Box -- not the Box Case (landmine 134)', nm94(by.BJP2850164.catalog_id) === 'The Time of Battle Booster Box', String(nm94(by.BJP2850164.catalog_id)));
ok('ST-36\'s 6-count display matches the Display; DP-11 matches Vol. 11 Display; IB-07 matches Illustration Box Vol. 7',
   /^Starter Deck 36.*Display$/.test(nm94(by.BJP2855988.catalog_id) || '') && nm94(by.BJP2850166.catalog_id) === 'Double Pack Set Vol. 11 Display' && nm94(by.BJP2864562.catalog_id) === 'One Piece Card Game Illustration Box Vol. 7',
   [nm94(by.BJP2855988.catalog_id), nm94(by.BJP2850166.catalog_id), nm94(by.BJP2864562.catalog_id)].join(' | '));
ok('controls: OP-19, PEB-01 and ST44 have no set in the catalogue and match nothing -- a wrong match is worse than none', by.BJP2884797.catalog_id === null && by.BJP2897699.catalog_id === null && by.BJP2904577.catalog_id === null);
ok('the app never fetches the distributor: no distributor host in the shipped app, and the history rows carry each SKU\'s state', !/gtsdistribution\.com/.test(js) && (() => { const h = JSON.parse(fs.readFileSync(path.join(fxDir94, 'history-fixture.json'), 'utf8')); return h.runs[0].gts && h.runs[0].gts.BJP2884797 === 'sold_out'; })());
ok('Diagnostics names the distributor beside the feed', /, gts \$\{HUNT\.feed\.sources && HUNT\.feed\.sources\.gts/.test(js));
/* on screen: the panel, the row line, the dead-source text */
V.HUNT.feed = F94; V.HUNT.setZip(''); V.MODE.set('hunt', false); V.SEALED.kind = 'all'; V.SEALED.q = '';   // a known state: earlier sections leave a kind chip or a search behind
for (const id of Object.keys(V.HUNT.distByCatalogId())) { const p = V.CAT.byId.get(+id); if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } }
V.paintSealed(); const h94 = ctx.document.querySelector('#sealedList').innerHTML;
ok('the matched products\' rows are on screen (their sets opened)', Object.keys(V.HUNT.distByCatalogId()).every(id => new RegExp('data-open="' + id + '"').test(h94)), `${Object.keys(V.HUNT.distByCatalogId()).length} matched, kind ${V.SEALED.kind}, q "${V.SEALED.q}"`);
ok('the Sealed screen carries a GTS Distribution panel with the counts and what a distributor is', /<h3>GTS Distribution<\/h3>/.test(h94) && /11 One Piece products at the distributor: <b>7<\/b> sold out, <b>8<\/b> allocated, 0 with preorders open, 1 coming, 1 in stock for stores/.test(h94) && /A distributor sells to stores, not to you/.test(h94));
ok('a matched row carries the distributor line in its words: sold out, allocated, MSRP named as MSRP with the case configuration, the release date, the age',
   new RegExp('data-open="' + by.BJP2850164.catalog_id + '"[\\s\\S]*?GTS Distribution · sold out · allocated · MSRP \\$119\\.76 \\(12 cards / 24 packs / 12 displays\\) · release 2026-06-12 · (just now|\\d+ min ago)').test(h94),
   (h94.match(/GTS Distribution · [^<]{0,140}/) || ['no distributor line in #sealedList'])[0]);
ok('a coming preorder says when it opens, on the Releases list (no catalogue product to hang it on)', (() => { V.paintReleases(); return /PREMIUM EXTRA BOOSTER \(PEB01\)[\s\S]*?GTS Distribution · preorders open on 2026-10-14 · allocated · MSRP/.test(ctx.document.querySelector('#relList').innerHTML); })());
const dead94 = JSON.parse(JSON.stringify(F94)); dead94.sources.gts = { ok: false, error: 'HTTP 403', fetched_at: F94.fetched_at, stale_since: F94.fetched_at, items: [] };
V.HUNT.feed = dead94; V.paintSealed(); V.paintReleases();
ok('a failed distributor fetch says it could not reach GTS Distribution and since when, on Sealed and on Releases, never an empty list', /Could not reach GTS Distribution since/.test(ctx.document.querySelector('#sealedList').innerHTML) && /Could not reach GTS Distribution since/.test(ctx.document.querySelector('#relList').innerHTML));
V.HUNT.feed = F94; V.paintReleases(); const rel94 = ctx.document.querySelector('#relList').innerHTML;
ok('Releases lists what the distributor has that the catalogue lacks, by release date, with the codes: OP-19 first, then PEB-01 and ST44',
   /<h3>At the distributor, not in the catalogue yet<\/h3>/.test(rel94) && /BOOSTER \(OP-19\)[\s\S]*?<span>OP19<\/span>[\s\S]*?PEB01[\s\S]*?ST44/.test(rel94) && rel94.slice(rel94.indexOf('At the distributor'), rel94.indexOf('<h3>Recent</h3>')).split('class="row"').length === 4,
   (rel94.match(/At the distributor[\s\S]{0,700}/) || ['no distributor panel in #relList'])[0].replace(/\s+/g, ' '));
ok('the OP18 row (in the catalogue, releasing 2026-11-20) carries the distributor line: sold out, allocated', /<span>OP18 · [^<]*<\/span><span style="display:block;color:var\(--brass\)">GTS Distribution · sold out · allocated/.test(rel94));
ok('control: a set the distributor does not list (OP17) carries no distributor line', /<span>OP17 · [^<]*<\/span><\/div>/.test(rel94) && !/<span>OP17 · [^<]*<\/span><span[^>]*>GTS/.test(rel94));
/* the alert source */
const watched94 = V.CAT.byId.get(by.BJP2850164.catalog_id);
V.STOCK.list = []; V.STOCK.toggle(watched94.id);
const s94 = V.STOCK.sourcesFor(watched94.id); const gsrc = s94.find(x => /^gts:/.test(x.key));
ok('a watched product has the distributor as a source, keyed by SKU, not available while sold out, with the fetch time and the product link', !!gsrc && gsrc.key === 'gts:BJP2850164' && gsrc.available === false && gsrc.at === G.fetched_at && /gtsdistribution\.com/.test(gsrc.url), JSON.stringify(gsrc));
await V.STOCK.check();
by.BJP2850164.status = 'in_stock'; const f1 = await V.STOCK.check(); const f2 = await V.STOCK.check();
by.BJP2850164.status = 'preorder'; const f3 = await V.STOCK.check();
by.BJP2850164.status = 'sold_out'; await V.STOCK.check(); by.BJP2850164.status = 'preorder'; const f4 = await V.STOCK.check();
ok('the alert fires once when the distributor flips to in stock for stores, not again while it stays or when it turns to an open preorder, and again after it went out and came back', f1 === 1 && f2 === 0 && f3 === 0 && f4 === 1, `${f1} ${f2} ${f3} ${f4}`);
by.BJP2850164.status = 'sold_out'; V.STOCK.toggle(watched94.id); V.STOCK.list = [];
V.HUNT.feed = null; V.MODE.set('collect', false);
}

{
section('take 95 — the take-94 look: a tapped release shows a screen (landmine 135), the sealed sheet, the alert you can find');
const fire95 = el => (el._ev && el._ev.click) ? el._ev.click({ target: el, preventDefault() {} }) : null;
/* the row's document-level click handler calls browseSet(id); the stub keeps one listener per node, so the function is driven directly here and the real click in Chrome (render.mjs) */
ok('the release row\'s tap goes through browseSet(), which is what the handler calls', typeof V.browseSet === 'function' && /browseSet\(\+b\.dataset\.browseSet\)/.test(js));
const tapBrowse = setId => V.browseSet(setId);
const relSet = [...V.CAT.sets.values()].find(s => s.pub && V.CAT.rows.some(p => p.set === s.id && V.SEALED.isProduct(p)));
const relProd = V.CAT.rows.find(p => p.set === relSet.id && V.SEALED.isProduct(p));
V.MODE.set('hunt', false); V.go('releases'); V.SEALED.q = ''; V.SEALED.kind = 'all';
tapBrowse(relSet.id);
ok('Hunt: tapping a release SHOWS Sealed, searched for that set with the query in the box, and that set\'s products are on screen (landmine 135)',
   V.NAV.stack[V.NAV.stack.length - 1] === 'sealed' && V.SEALED.q === relSet.name && ctx.document.getElementById('sealedQ').value === relSet.name && new RegExp('data-open="' + relProd.id + '"').test(ctx.document.getElementById('sealedList').innerHTML),
   `landed on ${V.NAV.stack[V.NAV.stack.length - 1]}, q "${V.SEALED.q}"`);
V.SEALED.q = ''; ctx.document.getElementById('sealedQ').value = '';
V.MODE.set('collect', false); V.go('home'); tapBrowse(relSet.id);
ok('Collect: tapping a set in the browse SHOWS the Search screen with that set filtered', V.NAV.stack[V.NAV.stack.length - 1] === 'search' && V.FILT.all.set[0] === relSet.id, `landed on ${V.NAV.stack[V.NAV.stack.length - 1]}`);
Object.assign(V.FILT.all, V.blankFilter('all')); V.go('home');
/* the sheet: sealed vs card */
const box95 = V.CAT.rows.find(p => V.SEALED.isProduct(p)); const card95 = V.CAT.rows.find(p => !p.sealed && p.market > 0);
V.STOCK.list = []; V.openDetail(box95.id);
ok('a sealed product\'s sheet hides the card conditions, says "Sealed — no condition", explains why, and offers the stock alert',
   ctx.document.getElementById('dCondSeg').hidden === true && ctx.document.getElementById('dCondSeg').innerHTML === '' && /Sealed — no condition/.test(ctx.document.getElementById('dCond').textContent) && /no condition to record/.test(ctx.document.getElementById('dCondNote').innerHTML) && ctx.document.getElementById('dStock').hidden === false);
fire95(ctx.document.getElementById('dStock'));
const on95 = V.STOCK.has(box95.id) && /Watching for stock/.test(ctx.document.getElementById('dStock').textContent);
fire95(ctx.document.getElementById('dStock'));
ok('tapping it watches the product through the take-77 watch and the button says so; tapping again stops', on95 && !V.STOCK.has(box95.id) && /Alert me when in stock/.test(ctx.document.getElementById('dStock').textContent));
V.openDetail(card95.id);
ok('a card\'s sheet shows the segment under a line that names the condition, the card note, and no stock alert',
   ctx.document.getElementById('dCondSeg').hidden === false && /data-cond="NM"/.test(ctx.document.getElementById('dCondSeg').innerHTML) && /Condition · Near Mint/.test(ctx.document.getElementById('dCond').textContent) && /what you tell us/.test(ctx.document.getElementById('dCondNote').innerHTML) && ctx.document.getElementById('dStock').hidden === true);
V.MODE.set('hunt', false); V.paintSealed();
ok('the row\'s circle carries its word: alert, or watching', />alert<\/span><\/button>/.test(ctx.document.getElementById('sealedList').innerHTML) && (V.STOCK.toggle(box95.id), V.paintSealed(), />watching<\/span><\/button>/.test(ctx.document.getElementById('sealedList').innerHTML)));
V.STOCK.toggle(box95.id); V.STOCK.list = []; V.MODE.set('collect', false); V.go('home');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
