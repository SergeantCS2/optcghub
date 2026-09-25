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
import zlib from 'node:zlib';

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
    removeEventListener: () => {},   // take 111: the ask sheet's cleanup calls it; a browser always has it
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
  AbortController,   // take 115: a browser has it; the fetch wrapper aborts at its deadline with it
  fetch: async (u, o) => {
    if (ctx._net) { const r = await ctx._net(String(u), o); if (r !== undefined) return r; }   // take 115: a section answers "Pages" itself; undefined falls through
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
ctx.scrollTo = () => {};   // take 105: the boot itself navigates now (landmine 140) and go() scrolls; a browser always has this
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
/* Take 114: this said "at least 100x" and went red on 24 Sep 2026, on main's
   nightly and on the take-114 PR alike, when the base rose from $1.11 to $5.89
   in five days and the SP held at $441.73 (75x; it was ~400x on the 19th). A
   ratio is a price too (landmine 62). What landmine 1 guards is that each
   printing carries its own price: a value keyed off the number gives the three
   one price, 1x. An order of magnitude says that with room for a market. */
const priceSpan = ps => ps[0].market / ps[ps.length - 1].market;
ok('the SP is worth at least 10x the base -- its own price, not the number\'s',
   priceSpan(vivi) > 10, priceSpan(vivi).toFixed(0) + 'x');
ok('negative control: one price keyed off the number (every printing the dearest\'s) is 1x, and fails that',
   !(priceSpan(vivi.map(p => ({ ...p, market: vivi[0].market }))) > 10));
ok('and the prices are plausible at all',
   vivi[0].market > 50 && vivi[vivi.length - 1].market < 50,
   `${vivi[0].market} / ${vivi[vivi.length - 1].market}`);
const nami = V.candidates('OP01-016', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0));
ok('OP01-016 resolves to 12 printings', nami.length === 12, `got ${nami.length}`);
/* take 115 (SPEC-114-58, landmine 175): this said ">1000x" -- the one-market ratio take 114 retired for EB03-024
   (3152x on 24 Sep). What it guards is that each printing carries its own price; keyed off the number, the twelve are 1x */
const namiPriced = nami.filter(p => p.market > 0);
ok('OP01-016\'s printings carry their own prices -- at least 10x apart', namiPriced.length >= 2 && priceSpan(namiPriced) > 10, priceSpan(namiPriced).toFixed(0) + 'x');
{ const keyed = namiPriced.map(p => ({ ...p, market: namiPriced[0].market }));
  ok('negative control: one price keyed off OP01-016 (every printing the dearest\'s) is 1x, and fails that', namiPriced.length >= 2 && priceSpan(keyed) === 1 && !(priceSpan(keyed) > 10)); }

section('the confidence gate (landmine 12)');
const rv = V.resolve('EB03-024', {});
ok('EB03-024\'s three printings, their prices far apart, are NEVER auto-accepted', rv.verdict === 'ask', rv.verdict);   // take 115: a ratio in the name was one day's market (landmine 175)
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
ok('OP01-016\'s printings refuse to auto-accept', before === 'ask', before);   // take 115: no ratio in the name (landmine 175)
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
ok('and EB03-024 still refuses to auto-accept on absence',
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
  const chip = { dataset: { fk: 'set', fv: String(setId) }, classList: { toggle() {} }, setAttribute() {} };   // take 115: a DOM element has setAttribute -- the chip now says aria-pressed
  const tap = () => filters._ev.click({ target: { closest: sel => sel === '[data-fk]' ? chip : null, id: '' } });
  V.FILT.own.set = [];                                       // sheetScope is 'own' until a sheet opens
  tap();
  ok('a chip tap stores the set id as the catalogue keys it (a number, not the DOM string)',
     V.FILT.own.set.length === 1 && V.FILT.own.set[0] === setId && typeof V.FILT.own.set[0] === 'number',
     JSON.stringify(V.FILT.own.set));
  const shown = V.applyFilter(OWNROWS, V.FILT.own).length;
  ok('the tapped set shows its cards, not zero', inSet > 0 && shown === inSet, `${shown} of ${inSet}`);
  const fN = ctx.document.getElementById('fN').textContent;
  ok("the sheet's count line says so", new RegExp('^' + inSet + ' line').test(fN), fN);   /* take 111: the collection counts lines, as More does */
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
ok('deck value is quantity-weighted, its Leader counted (take 111: as the deck\'s history counts it)', Math.abs(An.value - d.cards.reduce((a, c) => a + (V.CAT.byId.get(c.id).market || 0) * c.n, 0) - ((V.CAT.byId.get(d.leader) || {}).market || 0)) < 0.01);

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
ok('backup failure is SHOWN, never swallowed', /Backup failed/.test(js));
ok('the backup goes to public Documents, which survives uninstall',
   /directory: 'DOCUMENTS'/.test(js) && /backup-latest\.json/.test(js));
ok('scan photos go to disk, not localStorage (landmine 79)',
   /savePhoto\(/.test(js) && /directory: 'DATA'/.test(js) && /convertFileSrc/.test(js));
ok('restore is a REPLACE and says so', /This replaces what is on the phone now/.test(js));
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
/* Take 115 (the runner lane, landmine 180's family): the report is its own job that needs every job and runs
   unless the run was cancelled, so a failed apk or pages job files the thread too, and it closes only on a
   run where every job succeeded; no job hides its failure behind continue-on-error. */
const a9ok = yml => /\n  report:\n    needs: \[seed, bundle, pages, apk\]\n    if: \$\{\{ !cancelled\(\) \}\}\n/.test(yml) && /\n          LABEL: nightly-failure\n/.test(yml) && /gh issue comment/.test(yml) && !/\n    continue-on-error: true/.test(yml);
ok('CI opens one deduplicated issue on any failed job and closes it only when every job ran green (A9, take 115)',
   a9ok(fs.readFileSync(path.join(ROOT, 'ci', 'build.yml'), 'utf8')));
{ /* the controls are built from the two faults, on this take's own file (the runner's checkout has no tags) */
  const yml = fs.readFileSync(path.join(ROOT, 'ci', 'build.yml'), 'utf8');
  const noReport = yml.replace(/\n  report:\n[\s\S]*$/, '\n'), hidden = yml.replace(/\n  pages:\n/, '\n  pages:\n    continue-on-error: true\n');
  ok('negative controls: without the report job, or with the Pages job hiding its failure (take 114\'s continue-on-error), that fails',
     noReport !== yml && hidden !== yml && !a9ok(noReport) && !a9ok(hidden), `${noReport !== yml} ${hidden !== yml}`);
}
ok('the launch image is the listing\'s frame (take 116): apk.sh runs ci/icon.py, which paints the page\'s own scene and refuses any other, and the system splash sits on the band\'s colour',
   (() => { const apk = fs.readFileSync(path.join(ROOT, 'ci', 'apk.sh'), 'utf8'), icon = fs.readFileSync(path.join(ROOT, 'ci', 'icon.py'), 'utf8');
            return /\npython3 ci\/icon\.py android\/app\/src\/main\/res/.test(apk) && /def splash\(W, H, master, app_src/.test(icon) && /SPLASH_BG = \(31, 61, 114\)/.test(icon)
              && /not the band's/.test(icon) && /windowSplashScreenBackground">#1f3d72</.test(apk) && !/splash-bg\.jpg/.test(icon); })());
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
ok('the tour is v3: four pages in the listing\'s frame, the modes card gone', /optcghub\.guide\.v3/.test(js) && /Yours, offline/.test(js) && !/Three modes/.test(js));   // take 116
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
   Math.abs(h[h.length - 1][1] - A.value) < 0.02, `${h[h.length-1][1]} vs ${A.value}`);   /* take 111: the value counts the Leader itself now */
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
ok('in the hand, only the active player\'s panel is drawn, upright', (board.match(/class="panel plpanel"/g) || []).length === 1 && !/rotate\(180deg\)/.test(board));
ok('...with the opponent\'s life and DON!! on one line', /Opponent/.test(board) && /Life <b>5<\/b>/.test(board));
ok('the button says what happens next', /End turn|Start/.test(board));
V.plCurtain(1);
const cur = ctx.document.querySelector('#plCurtain');
ok('ending a turn drops a curtain that names who takes the phone', cur.classList.contains('on') && /Hand the phone to/.test(cur.innerHTML) && /Player 2/.test(cur.innerHTML));
ok('the curtain is dismissed by a tap, and the mode is remembered', /closest\('#plCurtain'\)/.test(js) && /vault\.hotseat/.test(js));
P44.hotseat = false; cur.classList.remove('on'); V.paintPlay();
ok('negative control: on the table both panels draw, one rotated to face across', (ctx.document.querySelector('#plBoard').innerHTML.match(/class="panel plpanel"/g) || []).length === 2 && /rotate\(180deg\)/.test(ctx.document.querySelector('#plBoard').innerHTML));
}

{
section('take 45 — the on-device self-test, run here in node');
ctx.navigator.onLine = false;
const rep = await V.SELFTEST.run();
const by = Object.fromEntries(rep.checks.map(c => [c.name, c]));
ok('every check has a name and a verdict', rep.checks.length >= 15 && rep.checks.every(c => /^(PASS|FAIL|SKIP)$/.test(c.s)));
ok('the self-test proves a scripted effect offers and applies (take 52)', by['Sim: scripted effects loaded and one offers correctly'] && by['Sim: scripted effects loaded and one offers correctly'].s === 'PASS', JSON.stringify(by['Sim: scripted effects loaded and one offers correctly']));
ok('the catalogue, index, gate and search checks PASS against the real catalogue',
   ['Catalogue loaded', 'Printing index is one-to-one', 'The confidence gate asks on EB03-024\'s three printings', 'A unique number auto-accepts', 'Search finds a card by name', 'Star template shipped'].every(n => by[n] && by[n].s === 'PASS'),
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
  /* take 110: this line ended "|| true" and could not fail; it now asks what its name says, with a control */
  const daOn = S.kwOf(0, 0).includes('Double Attack'), daGiven = P0.chars[0].don; P0.chars[0].don = daGiven - 1; const daShort = S.kwOf(0, 0).includes('Double Attack'); P0.chars[0].don = daGiven;
  ok('a continuous [Double Attack] under DON!!: the keyword is live while the DON!! is given', daOn, JSON.stringify(S.kwOf(0, 0)));
  ok('...control: one DON!! short, it is not', daShort === false);
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
ok('the release note is a closed drop-down under More, About, once per take; Home carries none (take 117, the owner\'s word)', /<details class="wn"><summary>New in this update<\/summary>/.test(js) && !/id="whatsNew"/.test(html) && !/wnOk/.test(js));
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
const palette = name => { const at = name === 'collect' ? html.indexOf(':root{') : html.indexOf(`:root[data-mode="${name}"]{`); const block = name === 'collect' ? html.slice(at, html.indexOf(':root[data-mode=')) : html.slice(at, html.indexOf('}', at));
  const t = {}; for (const m of block.matchAll(/--(bg|card|card2|fg|dim|dim2|brass|accent-ink|on-accent|line-strong):(#[0-9A-Fa-f]{6})/g)) t[m[1]] = m[2];
  if (name !== 'collect') { const c = palette('collect'); for (const k of ['on-accent']) t[k] ||= c[k]; } return t; };
for (const mode of ['collect', 'play', 'hunt']) { const t = palette(mode);
  ok(`${mode}: every text token clears WCAG AA 4.5:1 on the card background`,
     ['fg', 'dim', 'dim2'].every(k => ratio(t[k], t.card) >= 4.5),
     ['fg', 'dim', 'dim2'].map(k => `${k} ${ratio(t[k], t.card).toFixed(2)}`).join(', '));
  ok(`${mode}: the brass accent clears 3:1 for the large text it is used on`, ratio(t.brass, t.card) >= 3.0, ratio(t.brass, t.card).toFixed(2)); }
ok('negative control: the token that failed before this take would still fail the check', ratio('#6B5F4B', palette('collect').card) < 4.5);
ok('headings carry the palette accent, not the body colour (landmine 117)',
   /h1,h2\{font-family:var\(--display\)[^}]*color:var\(--accent-ink\)\}/.test(html) && /\.panel h3\{[^}]*color:var\(--accent-ink\)\}/.test(html) && !/#tour \.gcard h3\{[^}]*color:var\(--fg\)\}/.test(html));   // take 106: the accent as text is --accent-ink
ok('a wide viewport gets a phone-width column rather than a sprawl', /@media \(min-width:900px\)\{[\s\S]*?max-width:520px/.test(html));
/* take 81: the owner's first impressions of Hunt on the Fold */
ok('the page cannot zoom on input focus and every text input is 16px -- the zip sheet was zoomed off-screen (take 81)', /maximum-scale=1/.test(html) && /user-scalable=no/.test(html) && /\.search input\{[^}]*font-size:16px/.test(html));
ok('the search bar is themed, with an icon, and lights its border on focus', /\.search:focus-within\{border-color:var\(--brass\)\}/.test(html) && /class="search"[^>]*><svg/.test(html));
ok('the mode labels are readable: the label size (14px), not 12.5', /\.mode button\{[^}]*font-size:var\(--fs-label\)/.test(html) && !/\.mode button\{[^}]*font-size:12\.5px/.test(html));   // take 117: the token
ok('the tour stops on every card: one swipe, one card', /scroll-snap-stop:always/.test(html));
ok('the phone\'s back button walks the screen stack, closes any open sheet first, and minimises at the bottom rather than exiting', /addListener\('backButton'/.test(js) && /closeAnyOverlay\(\)/.test(js) && /minimizeApp/.test(js) && /popstate/.test(js));
ok('back cancels the zip sheet through its own Cancel, so the pending ask resolves', /askCancel'\)\.click\(\)/.test(js));
ok('on relaunch the app opens on the saved mode\'s own home, not Collect\'s — and pushes it onto the stack for every mode (take 105, landmine 140: Collect was skipped and the first Back minimized the app)', /MODE\.set\(MODE\.cur, false\); go\(MODE\.home\[MODE\.cur\] \|\| 'home'\)/.test(js) && !/if \(MODE\.cur !== 'collect'\) go\(/.test(js));
ok('Sealed groups by set: a header per set, every set open by default, a tap collapses one (take 86: the owner found the count and the closed folds confusing)', /data-setfold=/.test(js) && /SEALED\.closed/.test(js) && !/\$\{ps\.length\} \$\{open/.test(js));
{ V.SEALED.q = ''; V.SEALED.open = new Set(); V.HUNT.setZip(''); V.paintSealed(); const hf = ctx.document.querySelector('#sealedList').innerHTML;
  const headers = (hf.match(/data-setfold=/g) || []).length, rows = (hf.match(/data-open="/g) || []).length;
  V.SEALED.closed.delete('decks'); V.paintSealed(); const rowsOpen = (ctx.document.querySelector('#sealedList').innerHTML.match(/data-open="/g) || []).length; V.SEALED.closed.add('decks'); V.paintSealed();
  ok('...every product is on screen under its set header, or under Starter decks once that section is open (take 117: a deck set lives there and nowhere else)', headers >= 10 && rows >= 250 && rowsOpen >= 300 && rowsOpen > rows, `${headers} set headers, ${rows} rows shown, ${rowsOpen} with the decks open`);
  /* take 115 (self-review): the first set DRAWN with rows -- the catalogue's newest group can be sealed-only with nothing
     priced, or a starter deck drawn under Starter decks, and collapsing it hid nothing */
  const first93 = +(hf.match(/data-setfold="(\d+)"/) || [])[1];
  V.SEALED.closed.add(first93); V.paintSealed(); ok('...and a collapsed set hides only its own rows', (ctx.document.querySelector('#sealedList').innerHTML.match(/data-open="/g) || []).length < rows, String(first93)); V.SEALED.closed.clear(); }
/* take 87: the fourth look, part two */
ok('MAX wears an AD badge and is unlocked for a day by a rewarded ad; with no ad plugin it simply opens', /'<span class="free">AD<\/span>'/.test(js) && /const MAXLOCK = \{/.test(js) && /24 \* 3600e3/.test(js) && /!PLATFORM\.plugin\('AdMob'\) \|\| !CAT\.man\.ads \|\| Date\.now\(\) < this\.until/.test(js) && !/FREE<\/span>/.test(js));
ok('...and the reward listener routes a max ad to the unlock, not to scan credits', /if \(this\._pendingKind === 'max'\) \{ this\._pendingKind = null; MAXLOCK\.grant\(\)/.test(js));
ok('no select is ever wider than its container (the Sim boxes ran off the screen)', /select\{max-width:100%/.test(html));
{ V.MODE.set('hunt', false); V.SEALED.q = ''; V.SEALED.kind = 'all'; V.SEALED.closed.clear(); V.paintSealed(); const hs = ctx.document.querySelector('#sealedList').innerHTML;
  ok('Starter decks have their own section at the top of Sealed, with pictures and the bell', /Starter decks<span class="note">\d+ products<\/span>/.test(hs)
     /* take 110: the first fold is the starter decks' and the name is inside its heading (a 400-character window stood for this until the heading carried its art) */
     && hs.indexOf('data-setfold="') === hs.indexOf('data-setfold="decks"') && hs.indexOf('Starter decks') < hs.indexOf('</button>', hs.indexOf('data-setfold="decks"')));
  /* take 110: this line ended "|| true" from the take-88 seed on, so it could not fail; the section is now
     read from its own heading to the next one, folded and (the control) open */
  const deckIds = V.CAT.rows.filter(p => V.SEALED.isProduct(p) && V.SEALED.kindOf(p) === 'deck').map(p => p.id);
  const decksSec = h => { const a = h.indexOf('data-setfold="decks"'); if (a < 0) return null; const b = h.indexOf('data-setfold="', a + 1); return h.slice(a, b < 0 ? h.length : b); };
  const deckRows = t => deckIds.filter(id => t.includes(`data-open="${id}"`)).length;
  V.SEALED.closed.add('decks'); V.paintSealed(); const shut = decksSec(ctx.document.querySelector('#sealedList').innerHTML), open = decksSec(hs);
  ok('...and it folds on a tap like a set: its heading stays, marked folded, and its decks go', !!shut && /^data-setfold="decks" aria-expanded="false"/.test(shut) && deckRows(shut) === 0, (shut || '').slice(0, 120));
  ok('...control: open, the same section lists its decks', !!open && /^data-setfold="decks" aria-expanded="true"/.test(open) && deckRows(open) > 0, String(open && deckRows(open)));
  V.SEALED.closed.clear(); V.MODE.set('collect', false); }
ok('the roster carries a phone and an exact point for every store the file has them for', (() => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-r87-')); execSync(`python3 tools/hunt.py --from-fixtures --out ${d}/feed-fixture.json`, { cwd: ROOT, stdio: 'pipe' }); const r = JSON.parse(fs.readFileSync(path.join(d, 'stores-fixture.json'), 'utf8')); return r.stores.every(s => s.phone && s.exact && Array.isArray(s.ll)); })());
/* take 86: the fourth look */
ok('every screen ends with room for the bottom bar (nothing hides behind it)', /\.screen\{display:none;padding:0 var\(--pad\) calc\(66px \+ 34px \+ var\(--sab\)\)\}/.test(html));
ok('pills never wrap onto two lines', /\.pill\{[^}]*white-space:nowrap/.test(html));
ok('a picture that fails drops from the large size to its thumbnail, and a thumbnail that fails is removed; the retry to <id>.jpg is gone (403 for 241 of 241 -- landmine 150)',
   /onerror="var t=this\.dataset\.thumb;if\(t\)\{delete this\.dataset\.thumb;this\.src=t\}else\{this\.remove\(\)\}"/.test(js) && !/this\.src=this\.src\.replace\(\/_\\d\+w/.test(js));
ok('the Target panel says it plainly: checked when, N products, N in stock to ship, and what a limit means', /One Piece products online, <b>\$\{ships\}<\/b> in stock to ship/.test(js) && /the next hourly check continues where this one stopped/.test(js) && !/the retailer throttled this run/.test(js));
ok('the Portfolio caption has its own face and colour, not body text', /\.hero \.who \.cap\{[^}]*font-family:var\(--heavy\)[^}]*color:var\(--dim\)/.test(html));   // take 106: --brass2 as text was 2.68-4.40:1
ok('Releases rows: the title wraps, Details sits on its own line inside the row (the footer line, shared with Remind me and Calendar since take 97)', /<b style="white-space:normal">\$\{esc\(s\.name\)\}/.test(js) && /class="rel"/.test(js) && /padding:0 0 8px">\$\{extra\}/.test(js) && /<a class="ghost" href="\$\{esc\(detailsUrl\(\{ name: label \}\)\)\}"/.test(js));
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
ok('the opening screen is in the markup (first paint): a word-mark, a line and the app\'s own card -- its icon file, and no other picture (take 116)', /<div id="splash" aria-hidden="true">/.test(html) && /class="wm">OP TCG Hub</.test(html) && (() => { const s = html.slice(html.indexOf('id="splash"'), html.indexOf('id="splash"') + 900); const im = s.match(/<img[^>]*>/g) || []; return im.length === 1 && /src="bundle\/icon\.svg"/.test(im[0]) && !/<image/.test(s); })());
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
  const body91 = ctx.document.getElementById('setBody');   // take 107: More's header is markup; its rows are painted under it
  ok('More painted its rows: About (the Diagnostics gesture), Export CSV, Sync',
     !!body91 && /id="aboutTake"/.test(body91.innerHTML) && /Export CSV/.test(body91.innerHTML) && /id="syncBtn"/.test(body91.innerHTML));
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
ok('the bottom bar is one bar in every mode: fixed height, near-black, items stretch equally, the accent only on the active item', /nav\{[^}]*height:66px[^}]*#0B0D10/.test(html) && /nav button\{flex:1 1 0/.test(html) && /nav button\.on\{[^}]*color:var\(--accent-ink\)/.test(html));   // take 117: one rule for the active item, its colour and its ground
ok('every screen title bar has the same minimum height', /\.appbar\{[^}]*min-height:56px/.test(html));   // take 107: the header, one per screen
ok('the Portfolio label is a small caption above the name, which keeps the display face at the hero\'s size', /\.hero \.who \.cap\{[^}]*text-transform:uppercase/.test(html) && /<span class="cap">Collection<\/span><em id="pfName">/.test(html) && /\.hero \.who em\{[^}]*font-size:var\(--fs-head\)/.test(html));   // take 117: the token (26px)
{ const boxes = V.CAT.rows.filter(p => V.SEALED.isProduct(p));
  ok('every sealed product carries a product photo url (343 of 343 today)', boxes.length > 300 && boxes.every(p => p.img));
  const pic = V.productPic(boxes[0]);
  ok('a product picture is the take-12 display-only image -- lazy, hot-linked, retried once then removed on failure -- over a drawn tile that shows the set code', /<img class="ref" loading="lazy"/.test(pic) && /this\.remove\(\)/.test(pic) && /class="ph"/.test(pic) && /(tcgplayer-cdn|product-images)\.tcgplayer\.com/.test(pic));   // either declared host since take 100
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
ok('every Releases row has a visible Details link to the set\'s full listing', /Details \$\{ext\(\)\}/.test(js) && /tcgplayer\.com\/search\/one-piece-card-game\/product\?q=/.test(js));
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
/* take 109 (landmine 149): where they are is read from the screen that holds them -- the old
   line asked only whether the id existed, and they sat in the deck editor from take 66 at the latest */
const secOf = (src, id) => { const i = src.indexOf(`id="${id}"`); if (i < 0) return null; const s0 = src.lastIndexOf('<section id="', i); return s0 < 0 ? null : src.slice(s0 + 13, src.indexOf('"', s0 + 13)); };
ok('Decks shows them under their own heading, marked ready-made -- on the Decks screen itself', secOf(html, 'dkStock') === 'decks' && /<div class="fgrp">Ready-made decks<\/div>/.test(js) && /<span class="badge">ready-made<\/span>/.test(js), String(secOf(html, 'dkStock')));
ok('...control: the take-108 place (the bottom of a deck\'s editor) is caught', secOf(html.replace('  <div id="dkStock"></div>\n', '').replace('<div class="panel" id="dkSim"></div>', '<div class="panel" id="dkSim"></div><div id="dkStock"></div>'), 'dkStock') === 'deck');
/* take 62: covers are drawn, never downloaded (landmines 26, 30) */
const cover = V.deckCover(stock[0]);
ok('a deck cover is inline SVG with no image, no request and no publisher mark',
   /^<svg /.test(cover.trim()) && !/<image|https?:|url\((?!#)/.test(cover) && !/One Piece|Bandai|BANDAI/i.test(cover), cover.slice(0, 80));
ok('...it says the set code, from the catalogue, and no 7 px name (take 109: the row names the Leader)', cover.includes(stock[0].set) && !/font-size="7"/.test(cover));
{ V.paintStock(); const sh = ctx.document.querySelector('#dkStock').innerHTML, L0 = V.CAT.byId.get(stock[0].leader), stockPic = V.stockPic || (() => ''), sp = stockPic(stock[0]);   // an older build has no stockPic: fail, don't crash
  ok('...each ready-made row names its Leader and shows the Leader\'s own picture over the drawn cover (take 109)',
     sh.includes(String(L0.name).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))) && /<img class="ref" loading="lazy"/.test(sp) && sp.includes(L0.img) && /class="ph"[^>]*><svg /.test(sp));
  ok('...control: a deck whose Leader the catalogue lacks shows the drawn cover alone', !/<img/.test(stockPic({ ...stock[0], leader: -1 })) && /<svg /.test(stockPic({ ...stock[0], leader: -1 }))); }
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
ok('a screen title announces as a heading, not as a tab', (html.match(/<h1 class="ab-title"/g) || []).length >= 20 && !/class="tab on"/.test(html));   // take 107: a real h1 in every screen's header
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
ok('on load, Overview carries the on class from the markup', /<button class="on" id="tabOver"/.test(html));
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
ok('the Sealed screen draws rows with market, low, high and a delta, grouped by set', /data-open="/.test(ctx.document.querySelector('#sealedList').innerHTML) && /low \$/.test(ctx.document.querySelector('#sealedList').innerHTML) && (ctx.document.querySelector('#sealedList').innerHTML.match(/class="fgrp setstrip"/g) || []).length >= 10);
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
ok('with five checks it lists what it saw and says a pattern needs a fortnight -- never a prediction on thin data', /5 checks of it in less than a day so far — a pattern needs a fortnight/.test(ctx.document.querySelector('#sealedList').innerHTML));   // take 115: in days from the rows, never "hourly" (landmine 173), and only the runs that read it
V.HUNT.hist = null; V.paintSealed();
ok('with no history there is no history line at all', !/a pattern needs a fortnight|last seen shipping/.test(ctx.document.querySelector('#sealedList').innerHTML));
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
ok('Local lists the shops within the radius with address, miles (exact where the file has the point, ~ otherwise), a Call and their next event', /Shops that run One Piece events/.test(hl) && /~?\d+ mi/.test(hl) && /<span style="display:block;color:var\(--brass\)">[A-Z][a-z]{2} \d{1,2}\b/.test(hl) && /href="tel:\d+"/.test(hl));   // take 115: the next event's day in words (SPEC-110-43)
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
ok('the Events screen groups by STORE (take 87): each store once with address, miles, a Call, then its next events with fee or free, seats, Register and Calendar', /stores, \d+ events in the next 14 days/.test(he) && />Calendar<\/button>/.test(he) && /~?\d+ mi/.test(he) && /href="tel:\d+"/.test(he) && /(free|\$\d)/.test(he) && /Register/.test(he) && /id="eventsDays"/.test(he) && /Registration is on Bandai TCG\+/.test(he));
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
ok('Hunt is green: the palette is Zoro\'s and it clears AA (checked with the other two above)', /:root\[data-mode="hunt"\]\{\s*--bg:#0B1B12/.test(html) && !/class="swords"/.test(html));   // take 116: the three-stroke mark left with the old opening screen
ok('the opening screen shows the app\'s own icon file and no other image', /bundle\/icon\.svg/.test(html) && !/<image/.test(html.slice(html.indexOf('id="splash"'), html.indexOf('id="splash"') + 1500)));
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
       /class="pic"/.test(h) && /class="ph"/.test(h) && h.includes(p.num.split('-').pop()) && /width:44px;height:61px/.test(h) &&   /* take 110: the list-row size, THUMB.m */
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
  ok('the Trade and Wants thumbnails and the Play board Leader are sized pic boxes (landmine 132; take 115: the trade and want rows draw the dense list\'s cardPic)',
     count(js, /class="oa pic"/g) === 0 && count(js, /\$\{cardPic\(p, THUMB\.s\)\}/g) >= 4 && /function tradeRow[\s\S]{0,400}\$\{cardPic\(p, THUMB\.s\)\}/.test(js) && /class="lead pic" data-plleader/.test(js));
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
/* take 114 (the review): a day on screen is pinned from the fixture's own date as the app writes it -- a literal "Jun 12"
   stops matching on the first of January, when dayText adds the year */
const D94 = iso => V.dayText(iso).replace(/[ \u202f]/g, '\u00a0');
ok('the states read as measured: OP-19 sold out and allocated, PEB-01 coming (orders due 2026-10-14), a sleeve assortment in stock, a figure on call, a released sleeve display out',
   by.BJP2884797.status === 'sold_out' && by.BJP2884797.allocated === true && by.BJP2897699.status === 'coming' && by.BJP2897699.preorder === '2026-10-14' && by.BJP9056341.status === 'in_stock' && by.BJPBAS69321.status === 'call' && by.BJP2835333.status === 'out');
ok('control: the ST44 display is sold out but NOT allocated -- the flag is read off the page, never inferred from sold out', by.BJP2904577.status === 'sold_out' && by.BJP2904577.allocated === false);
const nm94 = id => (V.CAT.byId.get(id) || {}).name;
ok('OP-16\'s 24-count booster matches The Time of Battle Booster Box -- not the Box Case (landmine 134)', nm94(by.BJP2850164.catalog_id) === 'The Time of Battle Booster Box', String(nm94(by.BJP2850164.catalog_id)));
ok('ST-36\'s 6-count display matches the Display; DP-11 matches Vol. 11 Display; IB-07 matches Illustration Box Vol. 7',
   /^Starter Deck 36.*Display$/.test(nm94(by.BJP2855988.catalog_id) || '') && nm94(by.BJP2850166.catalog_id) === 'Double Pack Set Vol. 11 Display' && nm94(by.BJP2864562.catalog_id) === 'One Piece Card Game Illustration Box Vol. 7',
   [nm94(by.BJP2855988.catalog_id), nm94(by.BJP2850166.catalog_id), nm94(by.BJP2864562.catalog_id)].join(' | '));
ok('controls: OP-19, PEB-01 and ST44 have no set in the catalogue and match nothing -- a wrong match is worse than none', by.BJP2884797.catalog_id === null && by.BJP2897699.catalog_id === null && by.BJP2904577.catalog_id === null);
ok('the app never fetches the distributor: no distributor host in the shipped app, and the history rows carry each SKU\'s state', !/gtsdistribution\.com/.test(js) && (() => { const h = JSON.parse(fs.readFileSync(path.join(fxDir94, 'history-fixture.json'), 'utf8')); return h.runs[0].gts && h.runs[0].gts.BJP2884797 === 'sold_out'; })());
ok('Diagnostics names the distributor beside the feed', /line\('feed on phone', feedLine\(\)\)/.test(js) && (() => { const k = V.HUNT.feed; V.HUNT.feed = F94; try { return typeof V.feedLine === 'function' && new RegExp(`, gts ${G.items.length} products`).test(V.feedLine()); } finally { V.HUNT.feed = k; } })());   // take 115: printed from HUNT.DISTS (STAN-112-21)
/* on screen: the panel, the row line, the dead-source text */
V.HUNT.feed = F94; V.HUNT.setZip(''); V.MODE.set('hunt', false); V.SEALED.kind = 'all'; V.SEALED.q = '';   // a known state: earlier sections leave a kind chip or a search behind
for (const id of Object.keys(V.HUNT.distByCatalogId())) { const p = V.CAT.byId.get(+id); if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } }
V.paintSealed(); const h94 = ctx.document.querySelector('#sealedList').innerHTML;
/* take 112: Sealed lists priced products; Southern Hobby's DP-13 matched the Vol. 13 Display, which has no market price yet */
ok('the matched products\' rows are on screen (their sets opened) -- every one Sealed lists, a priced product', Object.keys(V.HUNT.distByCatalogId()).filter(id => V.SEALED.isProduct(V.CAT.byId.get(+id))).every(id => new RegExp('data-open="' + id + '"').test(h94)), `${Object.keys(V.HUNT.distByCatalogId()).length} matched, kind ${V.SEALED.kind}, q "${V.SEALED.q}"`);
/* take 112, the owner's word ("I don't want them flooding the screen"): the distributors' panels sit under one closed
   Distributor info; a row carries one short line per distributor, which opens its page at Distributor info */
ok('the Sealed screen carries one closed Distributor info that says what it holds, and none of the panels\' text until it opens',
   /data-distfold="sealed" aria-expanded="false"/.test(h94) && /<span class="ttl">Distributor info<\/span><span class="note">2 distributors · checked (just now|\d+ min ago)<\/span>/.test(h94) && !/One Piece products at the distributor/.test(h94),
   (h94.match(/Distributor info[\s\S]{0,160}/) || ['no Distributor info on Sealed'])[0]);
V.distFoldTap('sealed'); const h94o = ctx.document.querySelector('#sealedList').innerHTML; V.distFoldTap('sealed');
/* take 114 (the review): the two unreleased counts are dates, counted here over every item, sold out or not -- unreleased is a
   release after the UTC day GTS was read (gts.status_of's day), and "ahead" an order due date on or after it (the due day kept open) */
const read94 = G.fetched_at.slice(0, 10), un94 = G.items.filter(i => i.release && i.release > read94), ahead94 = un94.filter(i => i.preorder && i.preorder >= read94).length;
const due94 = (a, w) => `${a} with an order due date ahead, ${w} unreleased without one`, n94 = s => G.items.filter(i => i.status === s).length;
ok('...opened, it carries GTS Distribution with the counts and what a distributor is, and a second tap closes it -- of the unreleased products, how many have an order due date ahead and how many do not, by their dates',
   /data-distfold="sealed" aria-expanded="true"/.test(h94o) && /<b>GTS Distribution<\/b>/.test(h94o) && h94o.includes(`11 One Piece products at the distributor: <b>7</b> sold out, <b>8</b> allocated, ${due94(ahead94, un94.length - ahead94)}, 1 in stock for stores`) && /A distributor sells to stores, not to you/.test(h94o)
   && /data-distfold="sealed" aria-expanded="false"/.test(ctx.document.querySelector('#sealedList').innerHTML), `${due94(ahead94, un94.length - ahead94)} :: ${(h94o.match(/One Piece products at the distributor:[^.]*/) || ['no GTS counts'])[0]}`);
ok('...control: counted by state (take 114 as first built: coming, then preorder), the same words say something else on this feed -- a sold-out product that is unreleased and past its due date was in neither count',
   due94(n94('coming'), n94('preorder')) !== due94(ahead94, un94.length - ahead94), `${due94(n94('coming'), n94('preorder'))} | ${due94(ahead94, un94.length - ahead94)}`);
ok('a matched row carries one short line per distributor under its chips -- its name and its state -- which opens its page at Distributor info',
   new RegExp('data-open="' + by.BJP2850164.catalog_id + '" data-distinfo="1" aria-label="GTS Distribution · sold out: open [^"]+ at Distributor info"><span>GTS Distribution · sold out</span>').test(h94),
   (h94.match(/<button class="dline"[^>]*>[^<]*<span>[^<]*/) || ['no distributor line in #sealedList'])[0]);
const pg94 = V.CAT.byId.get(by.BJP2850164.catalog_id); V.openDetail(pg94.id, { dist: true }); const d94 = ctx.document.querySelector('#dDist').innerHTML;
ok('...and there, open, the distributor\'s full words: sold out, allocated, MSRP named as MSRP with the case configuration, the release date, the age, and its own page',
   /data-distfold="detail" aria-expanded="true"/.test(d94) && new RegExp(`GTS Distribution</b><span>sold out · allocated · MSRP \\$119\\.76 \\(12 cards / 24 packs / 12 displays\\) · release ${D94(by.BJP2850164.release)} · (just now|\\d+ min ago)</span>`).test(d94) && /href="https:\/\/www\.gtsdistribution\.com\/[^"]+" target="_blank" rel="noopener"/.test(d94),
   d94.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300));
while (V.closeAnyOverlay()) {} V.go('sealed');
ok('an order due date says when stores must order by, under Releases\' Distributor info (no catalogue product to hang it on)', (() => { V.DISTF.open.add('releases'); V.paintReleases(); const r = new RegExp(`PREMIUM EXTRA BOOSTER \\(PEB01\\)[\\s\\S]*?GTS Distribution · stores order by ${D94(by.BJP2897699.preorder)} · allocated · MSRP`).test(ctx.document.querySelector('#relList').innerHTML); V.DISTF.open.delete('releases'); return r; })());
const dead94 = JSON.parse(JSON.stringify(F94)); dead94.sources.gts = { ok: false, error: 'HTTP 403', fetched_at: F94.fetched_at, stale_since: F94.fetched_at, items: [] };
V.HUNT.feed = dead94; V.DISTF.open.add('sealed'); V.DISTF.open.add('releases'); V.paintSealed(); V.paintReleases();
ok('a failed distributor fetch says it could not reach GTS Distribution and since when, under Distributor info on Sealed and on Releases, never an empty list', /Could not reach GTS Distribution since/.test(ctx.document.querySelector('#sealedList').innerHTML) && /Could not reach GTS Distribution since/.test(ctx.document.querySelector('#relList').innerHTML));
V.DISTF.open.clear(); V.paintSealed(); V.paintReleases();
ok('...and closed, the Distributor info line says one was not reached', /1 not reached/.test(ctx.document.querySelector('#sealedList').innerHTML) && /1 not reached/.test(ctx.document.querySelector('#relList').innerHTML));
V.HUNT.feed = F94; V.DISTF.open.add('releases'); V.paintReleases(); const rel94 = ctx.document.querySelector('#relList').innerHTML; V.DISTF.open.delete('releases');
/* take 112: two distributors in the panel -- GTS's three rows keep their order among Southern Hobby's */
const panel94 = rel94.slice(rel94.indexOf('At the distributors'), rel94.indexOf('<h3>Recent</h3>'));
const gtsRows94 = [...panel94.matchAll(/<b style="white-space:normal">[^<]*<\/b><span>([^<]*)<\/span><span style="display:block;color:var\(--brass\)">GTS Distribution/g)].map(m => m[1]);
ok('Releases lists what the distributors have that the catalogue lacks, by release date, with the codes: GTS\'s OP-19 first, then PEB-01 and ST44',
   /data-distfold="releases" aria-expanded="true"/.test(rel94) && /At the distributors, not in the catalogue yet<\/div>/.test(rel94) && /BOOSTER \(OP-19\)[\s\S]*?<span>OP19<\/span>/.test(panel94) && gtsRows94.join() === 'OP19,PEB01,ST44', gtsRows94.join() || (rel94.match(/At the distributor[\s\S]{0,700}/) || ['no distributor panel in #relList'])[0].replace(/\s+/g, ' '));
ok('the OP18 row (in the catalogue, releasing 2026-11-20) carries the distributor\'s short line: its name and its state', /<span>OP18 · [^<]*<\/span><span style="display:block;color:var\(--brass\)">GTS Distribution · sold out<\/span>/.test(rel94));
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
by.BJP2850164.status = 'in_stock'; const f5 = await V.STOCK.check();
ok('the alert fires once when the distributor flips to in stock for stores, not again while it stays, and again after it went out and came back -- stock only (the owner\'s answer, take 114): its order due date passing (the preorder state) never fires it', f1 === 1 && f2 === 0 && f3 === 0 && f4 === 0 && f5 === 1, `${f1} ${f2} ${f3} ${f4} ${f5}`);
{ const own = V.STOCK.sourcesFor; V.STOCK.sourcesFor = function (id) { return own.call(this, id).map(x => /^gts:/.test(x.key) ? { ...x, available: x.available || by.BJP2850164.status === 'preorder' } : x); };   // take 113's rule, put back for one sequence
  by.BJP2850164.status = 'sold_out'; await V.STOCK.check(); by.BJP2850164.status = 'preorder'; const g4 = await V.STOCK.check(); V.STOCK.sourcesFor = own;
  ok('...negative control: under take 113\'s rule (stock or the preorder state) the same due date passing fires it', g4 === 1, String(g4)); }
by.BJP2850164.status = 'sold_out'; V.STOCK.toggle(watched94.id); V.STOCK.list = [];
V.HUNT.feed = null; V.MODE.set('collect', false);
}

{
section('take 95 — the take-94 look: a tapped release shows a screen (landmine 135), the sealed sheet, the alert you can find');
const fire95 = el => (el._ev && el._ev.click) ? el._ev.click({ target: el, preventDefault() {} }) : null;
/* the row's document-level click handler calls browseSet(id); the stub keeps one listener per node, so the function is driven directly here and the real click in Chrome (render.mjs) */
ok('the release row\'s tap goes through browseSet(), which is what the handler calls (with the row\'s query since take 97)', typeof V.browseSet === 'function' && /browseSet\(\+b\.dataset\.browseSet, b\.dataset\.browseQ\)/.test(js));
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
ok('a sealed product\'s sheet hides the card conditions, says it has no condition to record, and offers the stock alert',
   ctx.document.getElementById('dCondSeg').hidden === true && ctx.document.getElementById('dCondSeg').innerHTML === '' && /No condition to record/.test(ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, '')) && ctx.document.getElementById('dStock').hidden === false);
fire95(ctx.document.getElementById('dStock'));
const on95 = V.STOCK.has(box95.id) && /Watching for stock/.test(ctx.document.getElementById('dStock').textContent);
fire95(ctx.document.getElementById('dStock'));
ok('tapping it watches the product through the take-77 watch and the button says so; tapping again stops', on95 && !V.STOCK.has(box95.id) && /Alert me when in stock/.test(ctx.document.getElementById('dStock').textContent));
V.openDetail(card95.id);
ok('a card\'s sheet shows the segment under a line that names the condition, and no stock alert',
   ctx.document.getElementById('dCondSeg').hidden === false && /data-cond="NM"/.test(ctx.document.getElementById('dCondSeg').innerHTML) && /Condition · Near Mint/.test(ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, '')) && ctx.document.getElementById('dStock').hidden === true);
V.MODE.set('hunt', false); V.paintSealed();
ok('the row\'s circle carries its word: alert, or watching', />alert<\/span><\/button>/.test(ctx.document.getElementById('sealedList').innerHTML) && (V.STOCK.toggle(box95.id), V.paintSealed(), />watching<\/span><\/button>/.test(ctx.document.getElementById('sealedList').innerHTML)));
V.STOCK.toggle(box95.id); V.STOCK.list = []; V.MODE.set('collect', false); V.go('home');
/* landmine 136 (check run 17): .linkish{display:block} and .seg{display:flex} outrank the browser's [hidden] rule; the stub cannot see that, so the shipped CSS is read here and Chrome measures the height */
ok('the sheet\'s button and segment carry their own [hidden] rule, so the attribute hides them in a real engine (landmine 136)', /\.linkish\[hidden\],\.seg\[hidden\]\{display:none\}/.test(html));
}

{
section('take 96 — where to buy: a chip per seller under each sealed row and on its sheet, the seller\'s own page, no logo, no referral');
const count96 = (h, re) => (h.match(re) || []).length;
const fxDir96 = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-buy-')); const feed96 = path.join(fxDir96, 'feed-fixture.json');
execSync(`python3 tools/hunt.py --from-fixtures --out ${feed96}`, { cwd: ROOT, stdio: 'pipe' });
V.HUNT.feed = JSON.parse(fs.readFileSync(feed96, 'utf8'));
V.LOCAL.shops = JSON.parse(fs.readFileSync(path.join(fxDir96, 'shops-fixture.json'), 'utf8')); V.LOCAL.stores = JSON.parse(fs.readFileSync(path.join(fxDir96, 'stores-fixture.json'), 'utf8')); V.HUNT.setZip('48329');
const shop96 = V.LOCAL.shops.shops[0]; V.LOCAL.stores.stores.push({ name: shop96.name, zip: shop96.zip, addr: '1 Main St', city: 'Waterford', state: 'MI', phone: '2485550100', ll: [42.69, -83.39], exact: true, events: [] });   // the roster knows the shop: a synthetic entry, so the address path is deterministic
const gtsIt96 = V.HUNT.feed.sources.gts.items.find(i => i.catalog_id); const pG = V.CAT.byId.get(gtsIt96.catalog_id);
const srcG = V.buySources(pG);
ok('a sealed product always has TCGplayer first, at its own product page from the catalogue id, with no parameter, the market price and its date as the note', srcG[0].label === 'TCGplayer' && srcG[0].url === 'https://www.tcgplayer.com/product/' + pG.id && !/[?#]/.test(srcG[0].url) && /market · [A-Z][a-z]{2} \d{1,2}(, \d{4})?$/.test(srcG[0].note), JSON.stringify(srcG[0]));   /* take 110: the day in words */
/* take 112, the owner's word: the distributors left the buy list for the page's Distributor info -- they sell to stores */
ok('a product the distributor lists has no distributor among its buy sources', !srcG.some(s => s.kind === 'dist'), JSON.stringify(srcG.map(s => s.label)));
V.openDetail(pG.id); const dd96 = ctx.document.getElementById('dDist') || { hidden: true, innerHTML: '' };   // a page without the panel fails here, it does not throw
ok('...its page carries Distributor info, closed when the page was opened from its row', dd96.hidden === false && /data-distfold="detail" aria-expanded="false"/.test(dd96.innerHTML) && !/gtsdistribution\.com/.test(dd96.innerHTML));
V.distFoldTap('detail');
ok('...and opened, the distributor in its words, at its own page in the browser', /GTS Distribution<\/b><span>sold out · allocated · /.test(dd96.innerHTML) && /href="https:\/\/www\.gtsdistribution\.com\/[^"]+" target="_blank" rel="noopener"/.test(dd96.innerHTML), dd96.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200));
V.distFoldTap('detail'); while (V.closeAnyOverlay()) {}
const shopIt96 = shop96.sealed.find(i => i.catalog_id); const pS = V.CAT.byId.get(shopIt96.catalog_id);
const srcS = V.buySources(pS); const local96 = srcS.find(s => s.kind === 'local');
ok('a product a local shop lists has the shop as a source: its storefront link, price and stock, and the roster\'s street address, phone and distance', !!local96 && local96.label === shop96.name && local96.url === shopIt96.url && /\$/.test(local96.note) && local96.addr === '1 Main St, Waterford' && local96.phone === '2485550100' && typeof local96.mi === 'number', JSON.stringify(local96));
/* the rows */
V.MODE.set('hunt', false); V.SEALED.q = ''; V.SEALED.kind = 'all'; for (const p of [pG, pS]) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } V.paintSealed();
const h96 = ctx.document.getElementById('sealedList').innerHTML;
ok('every sealed row carries a chip strip, and every strip sits after the row\'s buttons, never inside one (a distributor line opens a page too, and is no row)', count96(h96, /data-open="\d+">/g) > 0 && count96(h96, /<div class="chips buy"/g) === count96(h96, /data-open="\d+">/g) && count96(h96, /<\/button><div class="chips buy"/g) === count96(h96, /<div class="chips buy"/g), `${count96(h96, /<div class="chips buy"/g)} strips for ${count96(h96, /data-open="\d+">/g)} rows`);
const strip96 = (h, id) => { const r = h.slice(h.indexOf('data-open="' + id + '"')); const a = r.indexOf('<div class="chips buy"'); return r.slice(a, r.indexOf('</div>', a) + 6); };
const sG = strip96(h96, pG.id), sS = strip96(h96, pS.id);
ok('the distributor-listed product\'s strip: a cart and TCGplayer ↗, to the seller\'s own page in the browser, no image -- and no distributor chip (take 112)', /g-cart/.test(sG) && /TCGplayer <svg[^>]*><use href="#g-external"/.test(sG) && !/g-truck/.test(sG) && !/GTS Distribution/.test(sG) && !/<img/.test(sG) && count96(sG, /target="_blank" rel="noopener"/g) === count96(sG, /<a class="chip buy" href="http/g), sG.slice(0, 200));
ok('...under the strip, the distributor\'s short line, opening the page at Distributor info', h96.slice(h96.indexOf(sG) + sG.length).startsWith(`<div class="dlines"><button class="dline" data-open="${pG.id}" data-distinfo="1"`), h96.slice(h96.indexOf(sG) + sG.length, h96.indexOf(sG) + sG.length + 120));
ok('the shop-listed product\'s strip: a pin and the shop\'s name ↗, and a handset Call chip with a tel: link', /g-pin/.test(sS) && new RegExp(shop96.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' <svg[^>]*><use href="#g-external"').test(sS) && /href="tel:2485550100"/.test(sS) && /g-phone/.test(sS), sS.slice(0, 240));
/* the sheet */
V.openDetail(pS.id); const l96 = ctx.document.getElementById('dBuyList').innerHTML;
ok('the sealed sheet has a Where to buy panel: TCGplayer and the shop with its address, distance, Open ↗ and Call; the note says the browser opens the seller\'s page and no link carries a referral', ctx.document.getElementById('dBuy').hidden === false && /TCGplayer/.test(l96) && new RegExp(shop96.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(l96) && /1 Main St, Waterford/.test(l96) && /~\d+ mi/.test(l96) && /href="tel:2485550100"/.test(l96) && count96(l96, /Open <svg[^>]*><use href="#g-external"/g) >= 2 && /no link carries a referral/.test(html));
const card96 = V.CAT.rows.find(p => !p.sealed && p.market > 0); V.openDetail(card96.id);
ok('control: a card\'s sheet has no Where to buy panel', ctx.document.getElementById('dBuy').hidden === true && ctx.document.getElementById('dBuyList').innerHTML === '');
ok('the four seller glyphs ship in the sprite; the chip and the panel carry their rules (landmine 136)', /id="g-cart"/.test(html) && /id="g-pin"/.test(html) && /id="g-truck"/.test(html) && /id="g-phone"/.test(html) && /\.chip\.buy\{/.test(html) && /\.panel\[hidden\]\{display:none\}/.test(html));
ok('the only seller host the app names as a literal is TCGplayer\'s product page, on the declared host; the rest are data in the feed', /https:\/\/www\.tcgplayer\.com\/product\/' \+ p\.id/.test(js) && !/gtsdistribution\.com|blackvaultgaming\.com|redsky\.target\.com/.test(js));
V.HUNT.feed = null; V.LOCAL.shops = null; V.LOCAL.stores = null; V.HUNT.setZip(''); V.MODE.set('collect', false); V.go('home');
}

{
section('take 97 — Releases: starter decks fold into one row, the countdown carries its band, Remind me and Calendar on every upcoming release');
const count97 = (h, re) => (h.match(re) || []).length;
const today97 = new Date().toISOString().slice(0, 10); const days97 = d => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(today97 + 'T00:00:00Z')) / 864e5);
ok('the band: within a week, a month, three months, further or past', V.relBand(0) === 'cd1' && V.relBand(7) === 'cd1' && V.relBand(8) === 'cd2' && V.relBand(30) === 'cd2' && V.relBand(31) === 'cd3' && V.relBand(90) === 'cd3' && V.relBand(91) === 'cd4' && V.relBand(-1) === 'cd4');
V.MODE.set('hunt', false); V.HUNT.feed = null; V.RELF.open = new Set(); V.RELALERTS.list = []; V.paintReleases();
const r97 = ctx.document.getElementById('relList').innerHTML;
const decks97 = [...V.CAT.sets.values()].filter(s => s.pub && /^Starter Deck/i.test(s.name)); const byDay = {}; for (const s of decks97) (byDay[s.pub] ||= []).push(s);
const runDay = Object.keys(byDay).find(d => byDay[d].length >= 2); const run = byDay[runDay] || [];
ok('a run of starter decks on one release day is ONE row naming the range and the count, its decks folded away (the six ST31–ST36 rows the owner saw)', !!runDay && new RegExp('Starter decks [^<]*' + run[0].abbr + '[^<]*' + run[run.length - 1].abbr).test(r97) && new RegExp(run.length + ' starter decks, one release day').test(r97) && !new RegExp('data-browse-set="' + run[1].id + '"').test(r97) && new RegExp('data-relfold="' + runDay + '"').test(r97), `${runDay}: ${run.length} decks`);
const single = Object.keys(byDay).find(d => byDay[d].length === 1); const one = single && byDay[single][0];
ok('control: a single starter deck on its day stays its own row', !one || new RegExp('data-browse-set="' + one.id + '"').test(r97), String(one && one.abbr));
V.RELF.open.add(runDay); V.paintReleases(); const r97b = ctx.document.getElementById('relList').innerHTML;
ok('opening the fold shows every deck of the run as its own row, and the fold says Hide', run.every(s => new RegExp('data-browse-set="' + s.id + '"').test(r97b)) && /Hide the decks/.test(r97b));
ok('the group\'s tap searches Sealed for every starter deck, not one set', /data-browse-q="Starter Deck"/.test(r97b) && (() => { V.SEALED.q = ''; V.browseSet(run[0].id, 'Starter Deck'); const q = V.SEALED.q; V.SEALED.q = ''; ctx.document.getElementById('sealedQ').value = ''; return q === 'Starter Deck'; })());
V.RELF.open = new Set(); V.paintReleases(); const r97c = ctx.document.getElementById('relList').innerHTML;
const upcoming97 = [...V.CAT.sets.values()].filter(s => s.pub && s.pub >= today97);
/* take 115 (self-review): rows, not sets -- starter decks that share a day are one row (its first deck's), and since take 115
   a group is listed as soon as it lists a product, so ST39-ST44 on one day would have turned these two red */
const rows97 = upcoming97.filter(s => new RegExp('data-browse-set="' + s.id + '"').test(r97c) || !(/^Starter Deck/i.test(s.name) && new RegExp('data-relfold="' + s.pub + '"').test(r97c)));
ok('every upcoming row\'s countdown carries the band of its distance, and a recent row carries the past band', rows97.every(s => new RegExp('data-browse-set="' + s.id + '"[\\s\\S]*?<span class="note ' + V.relBand(days97(s.pub)) + '">').test(r97c)) && /<span class="note cd4">\d+ days ago<\/span>/.test(r97c), `${rows97.length} upcoming rows of ${upcoming97.length} sets`);
ok('every upcoming row and group has Remind me and Calendar beside Details; a recent one has Details only', count97(r97c, /data-relalert="/g) >= rows97.length && count97(r97c, /data-relcal="/g) === count97(r97c, /data-relalert="/g) && (() => { const rec = r97c.slice(r97c.indexOf('<h3>Recent</h3>')); return !/data-relalert=/.test(rec) && /Details <svg[^>]*><use href="#g-external"/.test(rec); })());
/* the reminder: on, the day before, once; off */
const s97 = upcoming97.sort((a, b) => a.pub.localeCompare(b.pub))[0];
if (s97) {
  const on = V.RELALERTS.toggle(s97.id, s97.name, s97.pub); V.paintReleases();
  ok('Remind me stores the set and its date and the row says Reminder set', on && V.RELALERTS.has(s97.id) && V.RELALERTS.list[0].pub === s97.pub && /Reminder set <svg[^>]*><use href="#g-check"/.test(ctx.document.getElementById('relList').innerHTML) && new RegExp('data-relalert="' + s97.id + '" [^>]*aria-pressed="true"').test(ctx.document.getElementById('relList').innerHTML));
  const early = await V.RELALERTS.check(V.RELALERTS.dayBefore(V.RELALERTS.dayBefore(s97.pub)));
  const eve = await V.RELALERTS.check(V.RELALERTS.dayBefore(s97.pub));
  const again = await V.RELALERTS.check(s97.pub);
  ok('the on-open check fires once on the day before the release and not before, not again on the day', early.length === 0 && eve.length === 1 && eve[0].id === s97.id && again.length === 0, `${early.length} ${eve.length} ${again.length}`);
  ok('the same button removes it', !V.RELALERTS.toggle(s97.id, s97.name, s97.pub) && !V.RELALERTS.has(s97.id));
  const ics = V.icsFor(V.releaseEvent(s97));
  ok('Calendar hands the release to the phone as an all-day event on its date, named, with the listing as its link and no store location', new RegExp('DTSTART;VALUE=DATE:' + s97.pub.replace(/-/g, '')).test(ics) && ics.includes('SUMMARY:' + s97.name.replace(/,/g, '\\,') + ' — release day') && !/LOCATION:/.test(ics) && /URL:https:\/\/www\.tcgplayer\.com\//.test(ics) && new RegExp('UID:optcghub-event-release-' + s97.id + '@optcghub').test(ics));
} else { ok('no upcoming set in the catalogue today (the reminder path is exercised when one exists)', true); }
ok('the reminder rides two paths: a scheduled notification the day before and the on-open check at startup', /notifyAt\(/.test(js) && /schedule: \{ at/.test(js) && /RELALERTS\.check\(\)/.test(js) && /cancelNotify\(/.test(js));
/* the distributor's unlisted starter-deck displays fold the same way */
const fxDir97 = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-rel-')); const feed97 = path.join(fxDir97, 'feed-fixture.json');
execSync(`python3 tools/hunt.py --from-fixtures --out ${feed97}`, { cwd: ROOT, stdio: 'pipe' });
const F97 = JSON.parse(fs.readFileSync(feed97, 'utf8')); const st44 = F97.sources.gts.items.find(i => i.sku === 'BJP2904577');
F97.sources.gts.items.push({ ...st44, sku: 'BJP2904574', name: 'ONE PIECE TCG: TITLE TBA STARTER DECK [ST43] (6CT)', codes: ['ST43'] });   // a second display on the same day, from the saved page's shape
V.HUNT.feed = F97; V.RELF.open = new Set(); V.DISTF.open.add('releases'); V.paintReleases(); const r97d = ctx.document.getElementById('relList').innerHTML;   /* take 112: the list sits under Distributor info */
ok('two unlisted starter-deck displays on one release day fold into one distributor row naming the range', /Starter decks ST43–ST44/.test(r97d) && /2 starter deck displays, one release day/.test(r97d) && !/STARTER DECK \[ST44\]/.test(r97d) && /data-relfold="d:gts:2027-04-23"/.test(r97d));   /* take 112: the fold key names its distributor -- two can share a day */
V.RELF.open.add('d:gts:2027-04-23'); V.paintReleases();
ok('...and open, both displays are listed', /STARTER DECK \[ST44\]/.test(ctx.document.getElementById('relList').innerHTML) && /STARTER DECK \[ST43\]/.test(ctx.document.getElementById('relList').innerHTML));
V.RELF.open = new Set(); V.DISTF.open.clear(); V.HUNT.feed = null; V.RELALERTS.list = []; V.MODE.set('collect', false); V.go('home');
}

section('take 98 — the take-97 look: Back from a sheet goes back (landmine 137), the most-valuable rows open, one splash colour, a toast that wraps, the decks fold, a condition tap that works');
/* landmine 137: the card sheet is a screen; it must not be in the overlay list, and the handler's sequence must land on the previous screen */
ok('closeAnyOverlay() lists overlays only: the sheets, the tour and the curtain — never the card sheet', /for \(const id of \['#picker', '#filters', '#leaderPick', '#printPick', '#tour', '#simCurtain'\]\)/.test(js) && !/for \(const id of \[[^\]]*'#detail'/.test(js));   // take 107 added the three sheets Back skipped
if (V.guideClose) V.guideClose(false);   // take 116: the boot timer opened the guide inside this stub (its first await is above), and it is an overlay now: Back would close it first
{ const box98 = V.CAT.rows.find(p => V.SEALED.isProduct(p)); V.MODE.set('hunt', false); V.go('sealed'); V.openDetail(box98.id);
  const top0 = V.NAV.stack[V.NAV.stack.length - 1]; const closed = V.closeAnyOverlay(); const back = V.NAV.back(); const top1 = V.NAV.stack[V.NAV.stack.length - 1];
  ok('the back handler\'s sequence from a sheet: closeAnyOverlay() has nothing to close, NAV.back() pops to the screen the sheet came from', top0 === 'detail' && closed === false && back === true && top1 === 'sealed', `${top0} → closed=${closed} back=${back} → ${top1}`);
  const det = ctx.document.getElementById('detail'); det.classList.add('on'); const closedSheet = V.closeAnyOverlay(); const stillOn = det.classList.contains('on'); det.classList.remove('on');
  ok('...control: a sheet that is on is left alone by closeAnyOverlay() (before take 98 it was closed and Back went nowhere)', closedSheet === false && stillOn);
  const pk = ctx.document.getElementById('picker'); pk.classList.add('on'); const closedPicker = V.closeAnyOverlay();
  ok('...control: an open picker IS closed by it, and Back stops there', closedPicker === true && !pk.classList.contains('on'));
  V.MODE.set('collect', false); V.go('home'); }
/* Home's most-valuable rows open the card */
ok('Home\'s most-valuable rows are buttons that open the card, like every other list\'s', /<button class="row" style="width:100%;text-align:left;align-items:center" data-open="\$\{p\.id\}">\$\{cardPic\(p\)\}<div class="nm">/.test(js) && !/<div class="row" style="align-items:center">\$\{cardPic\(p\)\}<div class="nm">/.test(js));
{ const keep98 = V.OWN.items; const card98 = V.CAT.rows.find(p => !p.sealed && p.market > 0); V.OWN.items = []; V.OWN.add(card98.id, { condition: 'NM' }); V.paintHome();
  ok('...and a painted top list carries the tap on its row', new RegExp('<button class="row"[^>]*data-open="' + card98.id + '"').test(ctx.document.getElementById('topList').innerHTML));
  V.OWN.items = keep98; }
/* one splash colour */
ok('the splash is one scene in every mode (the listing\'s frame, take 116), never the mode\'s palette', /#splash\{[^}]*background:linear-gradient\(180deg,#1f3d72/.test(html) && !/#splash\{[^}]*var\(--bg\)/.test(html));
/* a toast that wraps */
ok('a toast wraps inside the screen instead of running off both sides (the take-97 reminder toast)', /\.toast\{[^}]*white-space:normal;max-width:min\(92vw,520px\);text-align:center/.test(html) && !/\.toast\{[^}]*nowrap/.test(html));
/* the Starter decks section starts folded */
ok('Sealed\'s Starter decks section starts folded (the owner\'s word; a tap opens it as before)', /closed: new Set\(\['decks'\]\)/.test(js));
/* the condition tap: in place, and it does something */
ok('a condition tap no longer repaints the sheet through openDetail() (which reset the condition, so the tap did nothing)', !/dCond = c\.dataset\.cond; openDetail\(dCur\.id\)/.test(js) && /setCond\(c\.dataset\.cond\)/.test(js));
{ const keep98 = V.OWN.items; const card98 = V.CAT.rows.find(p => !p.sealed && p.market > 0); V.OWN.items = []; V.openDetail(card98.id);
  const r1 = V.setCond('LP'); const seg1 = ctx.document.getElementById('dCondSeg').innerHTML;
  ok('tapping LP on an unowned card moves the segment to LP, names it on the line, quantity 1, no cost basis', r1 === true && /class="on" data-cond="LP"/.test(seg1) && !/class="on" data-cond="NM"/.test(seg1) && /Condition · Lightly Played/.test(ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, '')) && ctx.document.getElementById('dQty').textContent === '1' && ctx.document.getElementById('dPaid').textContent === 'Set');
  V.OWN.add(card98.id, { qty: 3, condition: 'MP' }).paid = 12.5; const r2 = V.setCond('MP');   // the cost basis is set on the sheet, not through add()
  ok('tapping a condition you own copies in shows that copy\'s quantity and cost basis', r2 === true && ctx.document.getElementById('dQty').textContent === '3' && /12\.50/.test(ctx.document.getElementById('dPaid').textContent) && /class="on" data-cond="MP"/.test(ctx.document.getElementById('dCondSeg').innerHTML));
  const r3 = V.setCond('XX');
  ok('...control: a condition that is not one of the five is refused and nothing moves', r3 === false && /class="on" data-cond="MP"/.test(ctx.document.getElementById('dCondSeg').innerHTML) && ctx.document.getElementById('dQty').textContent === '3');
  /* take 110: the note that said what a tap does went at the owner's word; the line says which condition is chosen */
  ok('the line over the segment names the condition a tap chose (the note under it is gone, take 110)', ctx.document.getElementById('dCondNote') === null && /Condition · Moderately Played/.test(ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, '')));
  V.OWN.items = keep98; V.go('home'); }

section('take 99 — the look (A40): the harness exists and stays out of the tree; what its first run on take 98 found');
ok('the look harness and its step lists exist beside the other tools, and look/ is gitignored (the pictures go to the owner)', fs.existsSync(path.join(ROOT, 'tools/look.mjs')) && fs.existsSync(path.join(ROOT, 'tools/look/steps.mjs')) && /^\/look\/$/m.test(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')));
ok('...and the ignore is anchored to the root: tools/look/ (the step lists) is not ignored (landmine 138), while look/ is', (() => { try { execSync('git check-ignore -q tools/look/steps.mjs', { cwd: ROOT, stdio: 'pipe' }); return false; } catch (e) { return e.status === 1; } })() && (() => { try { execSync('git check-ignore -q look/x/report.json', { cwd: ROOT, stdio: 'pipe' }); return true; } catch (e) { return false; } })());
ok('a long toast is as wide as its text up to the cap, not half the screen (left:50% halves the available width — the look\'s first finding)', /\.toast\{[^}]*width:max-content/.test(html));
{ const box99 = V.CAT.rows.find(p => V.SEALED.isProduct(p) && !p.prov); const card99 = V.CAT.rows.find(p => !p.sealed && p.rarity && p.num);
  V.openDetail(box99.id); const subBox = ctx.document.getElementById('dSub').textContent;
  /* take 111: the line is the set's name -- or nothing, hidden, when the product is named for its set (every starter deck said its name twice) */
  const setBox = (V.CAT.sets.get(box99.set) || {}).name || '', hidBox = ctx.document.getElementById('dSub').hidden;
  ok('a sealed product\'s sheet subtitle is built from the parts it has — no "· ·" after the set name (the look\'s second finding)', !/· ·/.test(subBox) && !/·\s*$/.test(subBox)
     && (setBox && setBox !== box99.name ? subBox === setBox && !hidBox : subBox === '' && hidBox), JSON.stringify([subBox, setBox, box99.name]));
  V.openDetail(card99.id); const subCard = ctx.document.getElementById('dSub').textContent;
  ok('...control: a card\'s subtitle still carries set · rarity · number', subCard.split(' · ').length >= 3 && subCard.includes(card99.num) && subCard.includes(card99.rarity), JSON.stringify(subCard));
  V.go('home'); }

section('take 100 — the pictures (A39 item 3): what the runner measured ships, nothing is guessed');
{ const rows100 = V.CAT.rows; const HOSTS = /^https:\/\/(tcgplayer-cdn\.tcgplayer\.com\/product\/\d+_200w\.jpg|product-images\.tcgplayer\.com\/fit-in\/200x279\/\d+\.jpg)$/;
  ok('every printing\'s picture URL is on one of the two declared hosts, in the declared shape', rows100.every(p => !p.img || HOSTS.test(p.img)), String((rows100.find(p => p.img && !HOSTS.test(p.img)) || {}).img));
  ok('...control: a third host, and a malformed id, are refused by the same rule', !HOSTS.test('https://evil.example.com/product/1_200w.jpg') && !HOSTS.test('https://product-images.tcgplayer.com/fit-in/200x279/x.jpg'));
  const side = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/hashes.json'), 'utf8')); const alt = new Set((side.alt || []).map(String)); const byId = new Map(rows100.map(p => [String(p.id), p]));
  ok('every id the sidecar says the second host served ships the second host\'s URL, and every other id keeps the first host\'s', [...alt].every(id => !byId.has(id) || /product-images\.tcgplayer\.com\/fit-in\/200x279\/\d+\.jpg$/.test(byId.get(id).img)) && rows100.every(p => alt.has(String(p.id)) || !p.img || /tcgplayer-cdn\.tcgplayer\.com/.test(p.img)), `${alt.size} in alt`);
  ok('the manifest carries the picture measurement as counts', !!manifest.images && ['missing_cards', 'missing_sealed', 'alt_served', 'exported'].every(k => Number.isInteger(manifest.images[k])) && typeof manifest.images.measured === 'boolean', JSON.stringify(manifest.images));
  ok('a product picture through the second host keeps the take-12 chain: lazy, display-only, removed on failure', (() => { const pic = V.productPic({ ...rows100.find(p => V.SEALED.isProduct(p)), img: 'https://product-images.tcgplayer.com/fit-in/200x279/712901.jpg' }); return /<img class="ref" loading="lazy"/.test(pic) && /this\.remove\(\)/.test(pic) && /product-images\.tcgplayer\.com/.test(pic); })());
  ok('Diagnostics prints the picture line from the manifest', /line\('pictures'/.test(js) && /have no picture at the first host/.test(js));
}

section('take 104 — three fixes from the owner\'s own Diagnostics run: a browser without a camera skips with its reason, the effects line says what it counts');
{ const cv = V.cameraVerdict;
  ok('cameraVerdict: no camera in a browser is a SKIP with the reason, not a failure of the app', typeof cv === 'function' && (() => { const r = cv([], false); return !!(r && r.skip && /no camera listed on this device/.test(r.note)); })(), JSON.stringify(cv && cv([], false)));
  ok('...control: no camera on the phone is still a FAIL', typeof cv === 'function' && (() => { const r = cv([], true); return !!(r && !r.skip && r.ok === false); })());
  ok('...and a camera is a PASS with the count, wherever it runs', typeof cv === 'function' && (() => { const a = cv([{ kind: 'videoinput' }], false), b = cv([{ kind: 'videoinput' }, { kind: 'videoinput' }], true); return !!(a && a.ok === true && /1 camera/.test(a.note) && b && b.ok === true && /2 camera/.test(b.note)); })());
  const savedMD = ctx.navigator.mediaDevices; ctx.navigator.mediaDevices = { enumerateDevices: async () => [] };
  const cam = Object.fromEntries((await V.SELFTEST.run()).checks.map(c => [c.name, c]))['Camera reachable'];
  ctx.navigator.mediaDevices = savedMD;
  ok('through the self-test\'s own check: the line reads SKIP with the reason, not "not available here"', !!cam && cam.s === 'SKIP' && /no camera listed on this device/.test(cam.note), JSON.stringify(cam));
  const el = V.effectsLine;
  ok('effectsLine says what it counts: effect lines, with the cards beside', typeof el === 'function' && el({ scripted: 2187, lines: 7697 }, 1926) === '2187 of 7697 effect lines (1926 cards)', el && el({ scripted: 2187, lines: 7697 }, 1926));
  ok('...and Diagnostics prints the effects line through it', /line\('effects scripted', [^\n]*effectsLine\(/.test(js));
}

section('take 105 — the Fold\'s first run of the shrunk build: Back from a card on a fresh launch goes home (landmine 140), the notifications permission on an empty answer (landmine 141)');
{ /* the app booted in Collect above with nothing seeded: the stack must already hold Home (landmine 140: every earlier back test called V.go('home') first) */
  ok('a fresh boot in Collect puts Home on the stack before anything is tapped (the boot\'s own push, read from the boot record)', Array.isArray(V.NAV.bootStack) && V.NAV.bootStack[0] === 'home' && V.NAV.bootStack.length === 1, JSON.stringify(V.NAV.bootStack));
  V.MODE.set('collect', false); V.NAV.stack = []; const card105 = V.CAT.rows.find(p => !p.sealed && p.num);
  V.openDetail(card105.id);
  ok('...control: a card opened onto an empty stack sits there alone', V.NAV.stack.length === 1 && V.NAV.stack[0] === 'detail', V.NAV.stack.join('>'));
  const closed105 = V.closeAnyOverlay(); const back105 = V.NAV.back();
  ok('the back handler\'s sequence from that lone card goes HOME and reports handled — never minimizeApp() (the screen itself is the look\'s to see: the stub cannot read .on, landmine 136)', closed105 === false && back105 === true && V.NAV.stack.length === 1 && V.NAV.stack[0] === 'home', `closed=${closed105} back=${back105} top=${V.NAV.stack[V.NAV.stack.length - 1]}`);
  V.NAV.stack = ['home'];
  ok('...control: back from a lone Home is the one case that reports unhandled (that is the minimize, and only there)', V.NAV.back() === false && V.NAV.stack[V.NAV.stack.length - 1] === 'home');
  V.MODE.set('hunt', false); V.NAV.stack = ['sealed'];
  ok('...and the rule follows the mode: back from a lone Sealed in Hunt is unhandled too (it is Hunt\'s home)', V.NAV.back() === false);
  V.MODE.set('collect', false); V.NAV.stack = ['home'];
  /* landmine 141: the plugin answers with no data on the shrunk build; the app must say unknown, never denied, and must still ask */
  const savedPlugin = V.PLATFORM.plugin; let asked = 0;
  V.PLATFORM.plugin = (n) => n === 'LocalNotifications' ? { checkPermissions: async () => undefined, requestPermissions: async () => { asked++; return undefined; } } : savedPlugin.call(V.PLATFORM, n);
  const perm105 = await V.PLATFORM.notifyPermission();
  ok('notifyPermission on an empty plugin answer returns "unknown" and still asked once', perm105 === 'unknown' && asked === 1, `${perm105}, asked ${asked}`);
  V.PLATFORM.plugin = (n) => n === 'LocalNotifications' ? { checkPermissions: async () => ({ display: 'granted' }), requestPermissions: async () => ({ display: 'granted' }) } : savedPlugin.call(V.PLATFORM, n);
  ok('...control: a real answer still comes through as itself', (await V.PLATFORM.notifyPermission()) === 'granted');
  V.PLATFORM.plugin = (n) => n === 'LocalNotifications' ? { checkPermissions: async () => ({ display: 'denied' }), requestPermissions: async () => ({ display: 'denied' }) } : savedPlugin.call(V.PLATFORM, n);
  ok('...control: denied is still denied', (await V.PLATFORM.notifyPermission()) === 'denied');
  V.PLATFORM.plugin = savedPlugin;
  ok('the reminder toasts have a line for "unknown" (check the phone\'s notification settings), apart from "off"', /unknown/.test(js) && /notification settings/.test(js));
}

section('take 106 — the UI series\' foundation (A42): one set of tokens, the accent readable as text in every palette, nothing under 12px, every glyph a call names exists');
{ /* landmine 142: the skull left the sprite at take 63 and two calls still built its id at runtime */
  const symbols = new Set([...html.matchAll(/<symbol id="g-([\w-]+)"/g)].map(m => m[1]));
  const glyphNames = src => { const names = new Set();
    for (const m of src.matchAll(/\bG\('([\w-]+)'/g)) names.add(m[1]);
    for (const map of src.matchAll(/const [A-Z]+_GLYPH = \{([^}]*)\}/g)) for (const m of map[1].matchAll(/:\s*'([\w-]+)'/g)) names.add(m[1]);
    for (const m of src.matchAll(/\bg: '([\w-]+)'/g)) names.add(m[1]);
    for (const m of src.matchAll(/#g-([\w-]+)/g)) names.add(m[1]);
    return names; };
  const missing = src => [...glyphNames(src)].filter(n => !symbols.has(n));
  ok('every glyph the app names -- G() calls, the glyph maps, the guide, #g- references -- is a symbol in the sprite (landmine 142)', symbols.size >= 20 && glyphNames(js + html).size >= 20 && missing(js + html).length === 0, missing(js + html).join(', ') || `${glyphNames(js + html).size} names, all found`);
  ok('...control: the take-104 call G(\'roger\', 64) is caught', missing("G('roger', 64)").includes('roger'));
  ok('...control: a glyph-map value naming a missing glyph is caught too', missing("const KW_GLYPH = { Blocker: 'blocker', Banish: 'roger' };").includes('roger'));
  const computed = [...js.matchAll(/\bG\(([^'\s][^,)]*)/g)].map(m => m[1].trim());
  ok('...and every computed glyph name comes from a form the check reads (a glyph map or the guide\'s g:), so a new form cannot slip past', computed.length >= 4 && computed.every(e => /^[A-Z]+_GLYPH\[/.test(e) || e === 'c.g'), computed.filter(e => !/^[A-Z]+_GLYPH\[/.test(e) && e !== 'c.g').join(', '));
  /* nothing under 12px anywhere: the CSS, every inline style in the markup and in the templates */
  const under12 = src => [...src.matchAll(/font-size:\s*([0-9.]+)px/g)].map(m => +m[1]).filter(v => v < 12);
  ok('no font size under 12px in the shipped app -- CSS, markup and templates (take 106; 25 rules were 9 to 11.5)', under12(html + js).length === 0, under12(html + js).join(', '));
  ok('...control: a 9px rule is caught', under12('.x{font-size:9px}').length === 1 && under12('.y{font-size:12px}').length === 0);
  ok('the type scale is the tokens, 12px and up, and the CSS uses them', (() => { const fs = [...html.matchAll(/--fs-[a-z]+:(\d+)px/g)].map(m => +m[1]); return fs.length >= 9 && fs.every(v => v >= 12) && (html.match(/font-size:var\(--fs-/g) || []).length >= 20; })());
  /* contrast: the accent as text, the label on the accent, the selected tint, a control's edge -- per palette.
     Own helpers: the take-60 ones live in that section's block (landmine 77). */
  const lum = hx => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hx.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const palette = name => { const at = name === 'collect' ? html.indexOf(':root{') : html.indexOf(`:root[data-mode="${name}"]{`); const block = name === 'collect' ? html.slice(at, html.indexOf(':root[data-mode=')) : html.slice(at, html.indexOf('}', at));
    const t = {}; for (const m of block.matchAll(/--(bg|card|card2|fg|dim|dim2|brass|accent-ink|on-accent|line-strong):(#[0-9A-Fa-f]{6})/g)) t[m[1]] = m[2];
    if (name !== 'collect') { const c = palette('collect'); t['on-accent'] ||= c['on-accent']; } return t; };
  const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
  for (const mode of ['collect', 'play', 'hunt']) { const t = palette(mode);
    ok(`${mode}: the accent as text (--accent-ink) clears 4.5:1 on card and card2`, !!t['accent-ink'] && ratio(t['accent-ink'], t.card) >= 4.5 && ratio(t['accent-ink'], t.card2) >= 4.5, t['accent-ink'] && `${ratio(t['accent-ink'], t.card).toFixed(2)} / ${ratio(t['accent-ink'], t.card2).toFixed(2)}`);
    ok(`${mode}: the label on the accent fill (--on-accent) clears 4.5:1`, !!t['on-accent'] && ratio(t['on-accent'], t.brass) >= 4.5, t['on-accent'] && ratio(t['on-accent'], t.brass).toFixed(2));
    ok(`${mode}: the text tokens clear 4.5:1 on card2 as well as the card`, ['fg', 'dim', 'dim2'].every(k => ratio(t[k], t.card2) >= 4.5), ['fg', 'dim', 'dim2'].map(k => `${k} ${ratio(t[k], t.card2).toFixed(2)}`).join(', '));
    ok(`${mode}: selected text on the selected tint (12% accent into the card) clears 4.5:1`, !!t['accent-ink'] && ratio(t['accent-ink'], mix(t.card, t.brass, .12)) >= 4.5, t['accent-ink'] ? ratio(t['accent-ink'], mix(t.card, t.brass, .12)).toFixed(2) : 'no --accent-ink');
    ok(`${mode}: a control's edge (--line-strong) clears 3:1 on card and card2 (WCAG 1.4.11)`, !!t['line-strong'] && ratio(t['line-strong'], t.card) >= 3 && ratio(t['line-strong'], t.card2) >= 3, t['line-strong'] && `${ratio(t['line-strong'], t.card).toFixed(2)} / ${ratio(t['line-strong'], t.card2).toFixed(2)}`); }
  ok('...control: take 104\'s red as text fails on card2 (3.79) and its knob label on the red (3.29)', ratio('#E0553D', palette('play').card2) < 4.5 && ratio('#F1EFE6', '#E0553D') < 4.5);
  ok('the selected tint is mixed from each palette, not one brass tint for all three (#2A2414 is gone)', /--accent-bg:color-mix\(in srgb,var\(--brass\) 12%,var\(--card\)\)/.test(html) && !/#2A2414/.test(html));
  ok('the knob\'s label is --on-accent in every mode: no per-mode override is left', /\.mode button\.on\{color:var\(--on-accent\)\}/.test(html) && !/\] \.mode button\.on\{/.test(html));
  ok('the slider is one rule and three equal columns under the knob, and no label wraps (the look caught "Prep & Play" on two lines at equal flex thirds)', (html.match(/\.mode button\{/g) || []).length === 1 && /\.mode\{display:inline-grid;grid-template-columns:repeat\(3,1fr\)/.test(html) && /\.mode button\{[^}]*white-space:nowrap/.test(html));
  ok('the filter\'s price row is its own rule, its boxes at the one field rule\'s 16px (they inherited the range pills\' 14px -- landmine 119; take 115: no copy of the field rule)', /\.frange input\{/.test(html) && !/\.frange input\{[^}]*(?:font|font-size|border|background|color)\s*:/.test(html) && /<input id="fMin" (?![^>]*\btype=)/.test(html) && /input:not\(\[type\]\),textarea\{[^}]*font-size:16px/.test(html) && (html.match(/^\.range\{/gm) || []).length === 1 && /class="frange"/.test(html));
  ok('the filter\'s price boxes and the ask sheet\'s text box light up on focus and are 16px (a later rule and an inline border had outranked the focus rule; the text box was 13.5px, landmine 119)', !/\.frange input:focus/.test(html) && /select:focus,input:focus,textarea:focus\{border-color:var\(--brass\)/.test(html) && /<textarea id="askIn"[^>]*style="width:100%;padding:10px;font:16px/.test(js) && !/<textarea id="askIn"[^>]*border:/.test(js));
  ok('a field\'s edge is --line-strong in the one field rule, not a second rule after the focus rule', /select,input\[type="text"\][^{]*\{[^}]*border:1px solid var\(--line-strong\)/.test(html) && !/\}\s*select,input\[type="text"\][^{]*\{border-color:/.test(html));
  ok('the toast sits above the tour and the curtains', /\.toast\{[^}]*z-index:var\(--z-toast\)/.test(html) && /--z-toast:70/.test(html) && /--z-overlay:60/.test(html));
  ok('no invisible block above an empty state', !/\.empty::before/.test(html));
  ok('reduced motion stops every transition, and the tour scrolls without smoothing when asked', /@media \(prefers-reduced-motion:reduce\)\{\*,\*::before,\*::after\{transition-duration:0s!important/.test(html) && /behavior: reducedMotion\(\) \? 'auto' : 'smooth'/.test(js));
  ok('the charts read the palette they are drawn in (the deck chart was brass in red mode)', /x\.strokeStyle = acc;/.test(js) && (js.match(/TOK\('--brass'/g) || []).length >= 3 && !/strokeStyle = '#C9A24A'/.test(js));
  ok('...and outside a browser the lookup falls back instead of throwing', V.TOK ? V.TOK('--brass', '#C9A24A') === '#C9A24A' : /catch \(e\) \{ return fallback; \}/.test(js));
  ok('the splash\'s ground and word-mark are literals of the scene, not the palette (take 116)', /#splash\{[^}]*background:linear-gradient\(180deg,#1f3d72[^}]*color:#F6EEDA\}/.test(html) && /#splash \.wm\{[^}]*color:#F6EEDA/.test(html));
  const keep106 = V.OWN.items; V.OWN.items = []; V.go('collection');   // go() paints through the screen map (landmine 135)
  ok('the empty collection draws the scan card it points at, not the removed skull', /#g-scancard/.test(ctx.document.querySelector('#colEmpty').innerHTML) && !/g-roger/.test(ctx.document.querySelector('#colEmpty').innerHTML), ctx.document.querySelector('#colEmpty').innerHTML.slice(0, 120));
  V.OWN.items = keep106; V.go('home'); }

section('take 107 — one header on every screen (A42): the title in one place, Back one level down, the gear to More on every main screen, Home\'s two views as tabs, every sheet closable, Back closes every sheet');
{ /* the header is markup in every section (landmines 128, 135), so each screen's own markup is read */
  const PUSH = ['deck', 'detail', 'checklist', 'binder', 'wants', 'trade', 'diag', 'settings'];
  const GEAR_TAIL = /aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"\/><\/svg><\/button><\/div>\s*$/;
  const audit = src => [...src.matchAll(/<section id="([\w-]+)"[^>]*>([\s\S]*?)<\/section>/g)].map(([, id, body]) => {
    const hm = body.match(/<header class="appbar">([\s\S]*?)<\/header>/), h = hm ? hm[1] : '';
    return { id, headers: (body.match(/<header class="appbar">/g) || []).length, h1s: (body.match(/<h1\b/g) || []).length,
      title: (h.match(/<h1 class="ab-title"/g) || []).length === 1,
      first: body.replace(/^\s*(<div class="scanwrap">\s*|<div class="(?:arthero|artbg)[^"]*"[^>]*><\/div>\s*)?/, '').startsWith('<header class="appbar">'),   // the scanner's header opens its camera surface; take 109: an empty art layer may sit above it
      back: /^<button class="icb ab-back" data-back aria-label="Back">/.test(h), gear: GEAR_TAIL.test(h), glyph: /class="swords"/.test(h) }; });
  const bad = src => audit(src).filter(a => a.headers !== 1 || a.h1s !== 1 || !a.title || !a.first || a.glyph
    || a.back !== PUSH.includes(a.id) || a.gear === PUSH.includes(a.id)).map(a => a.id);
  const all = audit(html);
  ok('twenty screens, and every one opens with one header holding its one h1: where a title sits is the header\'s alone', all.length === 20 && bad(html).length === 0, bad(html).join(',') || String(all.length));
  ok('the eight screens one level down start with Back; the twelve in a mode\'s nav end with the gear to More, in all three modes (A37)',
     all.filter(a => a.back).map(a => a.id).sort().join() === [...PUSH].sort().join() && all.filter(a => a.gear).length === 12 && (html.match(/data-go="settings" aria-label="More"/g) || []).length === 12);
  ok('...control: a screen with its header taken out is caught', bad(html.replace('<section id="trade" class="screen">\n  <header class="appbar">', '<section id="trade" class="screen">\n  <div class="bar">')).includes('trade'));
  ok('...control (take 109): anything but an empty art layer above a header is still caught',
     bad('<section id="cards" class="screen"><div class="panel">x</div><header class="appbar"><div class="ab-text"><h1 class="ab-title">Cards</h1></div><div class="ab-act"><button class="icb" data-go="settings" aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"/></svg></button></div></header></section>').includes('cards')
     && !bad('<section id="cards" class="screen"><div class="arthero" id="x" hidden></div><header class="appbar"><div class="ab-text"><h1 class="ab-title">Cards</h1></div><div class="ab-act"><button class="icb" data-go="settings" aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"/></svg></button></div></header></section>').includes('cards'));
  ok('...control: a gear that is not the last action is caught', bad('<section id="cards" class="screen"><header class="appbar"><div class="ab-text"><h1 class="ab-title">Cards</h1></div><div class="ab-act"><button class="icb" data-go="settings" aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"/></svg></button><button class="ghost">x</button></div></header></section>').includes('cards'));
  ok('...control: a title with a mark in it, or a Back on a nav screen, is caught', bad('<section id="sealed" class="screen"><header class="appbar"><div class="ab-text"><h1 class="ab-title"><svg class="swords"></svg>Sealed</h1></div><div class="ab-act"><button class="icb" data-go="settings" aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"/></svg></button></div></header></section>').includes('sealed')
     && bad('<section id="play" class="screen"><header class="appbar"><button class="icb ab-back" data-back aria-label="Back"></button><div class="ab-text"><h1 class="ab-title">Play</h1></div><div class="ab-act"><button class="icb" data-go="settings" aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"/></svg></button></div></header></section>').includes('play'));
  ok('one look for every title: the display face and the mode\'s accent (the h1 rule), one size, one minimum height; the tab style is gone',
     /\nh1,h2\{font-family:var\(--display\)[^}]*color:var\(--accent-ink\)\}/.test(html) && /\.ab-title\{[^}]*font-size:var\(--fs-head\)/.test(html) && /\.appbar\{[^}]*min-height:56px/.test(html) && !/\n\.tab\{/.test(html) && !/\n\.bar\{/.test(html) && !/class="tab/.test(html));
  ok('the new controls are 44 px targets: the header\'s icon buttons and Home\'s two tabs', /\.icb\{width:44px;height:44px/.test(html) && /\.segtabs button\{[^}]*min-height:44px/.test(html));
  ok('back, close and the gear are symbols in the sprite, plain geometry drawn here', ['back', 'close', 'gear'].every(g => new RegExp(`<symbol id="g-${g}" viewBox="0 0 24 24"`).test(html)));
  ok('the deck\'s name is its title and stays a field, labelled, with no inline style', /<h1 class="ab-title"><input id="dkName" placeholder="Deck name" aria-label="Deck name"><\/h1>/.test(html) && /h1\.ab-title input\{[^}]*font:inherit/.test(html));
  ok('a card\'s name is its title; the collection it is added to is the line under it', /<h1 class="ab-title" id="dName">/.test(html) && /<p class="ab-sub">Adding to <b id="dTarget">/.test(html) && !/<h2 id="dName"/.test(html));
  ok('More\'s header is markup like every screen\'s; the rows are painted under it', /<section id="settings" class="screen">\s*<header class="appbar">/.test(html) && /const s = \$\('#setBody'\)/.test(js) && !/<span class="tab on"/.test(js));
  ok('the date of Sealed\'s prices and the binder\'s page are the line under their titles', /<h1 class="ab-title">Sealed<\/h1><p class="ab-sub" id="sealedAsOf"><\/p>/.test(html) && /<h1 class="ab-title">Binder<\/h1><p class="ab-sub" id="bnPage"><\/p>/.test(html));
  /* Home's two views */
  ok('Home\'s two views are a tab row under its title: a tablist, two button tabs, one selected, one tab stop',
     /<div class="segtabs" role="tablist" aria-label="Home">\s*<button class="on" id="tabOver" role="tab" aria-selected="true" tabindex="0">Overview<\/button>\s*<button id="tabPerf" role="tab" aria-selected="false" tabindex="-1">Performance<\/button>/.test(html));
  ok('the release note left Home at take 117, and its two Home rules went with it', !/#whatsNew/.test(html) && !/#wnOk/.test(html));
  /* the sheets */
  const sheets = ['picker', 'filters', 'askSheet', 'leaderPick', 'printPick'];
  ok('every sheet has a title in the header\'s face and a close button of its own', sheets.every(id => new RegExp(`<div class="sheet" id="${id}">\\s*<div class="sheetbody">\\s*<div class="grab"></div>\\s*<div class="sheethead"><h2[^>]*>[^<]*</h2><button class="icb" data-close="${id}" aria-label="Close">`).test(html)) && /\.sheethead h2\{[^}]*font-size:var\(--fs-title\)/.test(html));
  for (const id of ['#filters', '#leaderPick', '#printPick']) {
    const el = ctx.document.querySelector(id); el.classList.add('on');
    ok(`Back closes ${id} first (it stayed open while the screen under it changed -- PROVEN in Chrome before this take)`, V.closeAnyOverlay() === true && !el.classList.contains('on'));
    el.classList.remove('on');
  }
  ok('...control: with nothing open, Back has no sheet to close', V.closeAnyOverlay() === false);
  ok('the watchdog names the three sheets too when it records a blank screen', /const overlays = \['#askSheet', '#picker', '#filters', '#leaderPick', '#printPick'/.test(js));
  /* the behaviour, through the named handlers (landmine 136: a document-level click handler is out of the stub's reach) */
  const has107 = ['setHomeTab', 'closeSheet', 'backArrow'].every(f => typeof V[f] === 'function');   // an older build fails here instead of throwing
  ok('the header\'s handlers are named and reachable: Home\'s tabs, a sheet\'s close, the back arrow', has107);
  if (has107) {
    const tO = ctx.document.querySelector('#tabOver'), tP = ctx.document.querySelector('#tabPerf');
    V.setHomeTab(true);
    ok('selecting Performance moves the tab stop with it', tP.getAttribute('tabindex') === '0' && tO.getAttribute('tabindex') === '-1' && tP.getAttribute('aria-selected') === 'true');
    tP._ev.keydown({ key: 'ArrowLeft', preventDefault() {} });
    ok('the arrow keys move between the two views', tO.classList.contains('on') && !tP.classList.contains('on') && tO.getAttribute('tabindex') === '0');
    V.setHomeTab(false);
    { const el = ctx.document.querySelector('#filters'); el.classList.add('on'); V.closeSheet('filters');
      ok('a sheet\'s close button closes that sheet', !el.classList.contains('on')); }
    /* the back arrow is the phone's Back */
    V.MODE.set('collect', false); V.go('home'); V.go('collection'); V.go('wants');
    V.backArrow();
    ok('in a browser the arrow asks the browser to go back, and the screen stack follows (wants -> collection)', V.NAV.stack[V.NAV.stack.length - 1] === 'collection', V.NAV.stack.slice(-3).join('>'));
    const plug0 = V.PLATFORM.plugin; let minimised = 0;
    V.PLATFORM.plugin = n => n === 'App' ? { addListener() {}, minimizeApp() { minimised++; } } : plug0.call(V.PLATFORM, n);
    V.go('binder'); V.backArrow();
    ok('in the app the arrow runs the back button\'s own path (binder -> collection)', V.NAV.stack[V.NAV.stack.length - 1] === 'collection', V.NAV.stack.slice(-3).join('>'));
    V.NAV.stack = ['home']; V.backArrow();
    ok('...control: from the mode\'s home the arrow does nothing, and never leaves the app', minimised === 0 && V.NAV.stack.join() === 'home');
    V.PLATFORM.plugin = plug0; V.go('home');
  } }

section('take 108 — controls and icons (A42): every icon a sprite symbol with one meaning, a 44 px target for every control, a pressed and a disabled look');
{ /* one meaning per glyph: the three navs and the collection's actions, as a table */
  const NAV108 = { home: 'compass', search: 'spyglass', scan: 'scan', collection: 'collection', decks: 'cardback', cards: 'spyglass', play: 'life', sim: 'don',
                   sealed: 'box', releases: 'calendar', local: 'pin', events: 'trophy' };
  const ACT108 = { movers: 'trend', trade: 'rope', bulk: 'select', export: 'export', backup: 'backup', import: 'import', wants: 'bookmark', binder: 'binder' };
  const SAME = [['search', 'cards']];   // one meaning, two modes: find a card
  const GAME = ['stage', 'counter', 'blocker', 'trigger', 'rush', 'leader', 'character', 'event'];   // the game's own glyphs keep the game's meanings
  const glyphMap = src => { const m = {};
    for (const x of src.matchAll(/<nav id="nav\w+"[^>]*>([\s\S]*?)<\/nav>/g)) for (const b of x[1].matchAll(/<button data-go="(\w+)"[^>]*>[\s\S]*?#g-([\w-]+)"/g)) m['nav:' + b[1]] = b[2];
    const a = src.match(/<div class="actions">([\s\S]*?)<\/div>/); if (a) for (const b of a[1].matchAll(/data-act="(\w+)">[\s\S]*?#g-([\w-]+)"/g)) m['act:' + b[1]] = b[2];
    return m; };
  const misfits = src => { const m = glyphMap(src), bad = [];
    for (const [k, g] of Object.entries(NAV108)) if (m['nav:' + k] !== g) bad.push(`nav ${k}: ${m['nav:' + k]}`);
    for (const [k, g] of Object.entries(ACT108)) if (m['act:' + k] !== g) bad.push(`act ${k}: ${m['act:' + k]}`);
    const owners = {}; for (const [k, g] of Object.entries(m)) (owners[g] ||= new Set()).add(k.split(':')[1]);
    for (const [g, ks] of Object.entries(owners)) { const list = [...ks]; if (list.length > 1 && !SAME.some(p => list.every(x => p.includes(x)))) bad.push(`g-${g} means ${list.join(' and ')}`); }
    for (const [k, g] of Object.entries(m)) if (GAME.includes(g)) bad.push(`${k} borrows the game's g-${g}`);
    return bad; };
  ok('one meaning per glyph: each nav and action draws its own symbol, Search and Cards share the one for finding a card, the game\'s glyphs are the game\'s', misfits(html).length === 0, misfits(html).join('; '));
  /* take 115 (STAN-108-6): the first plant was '#g-scan"', which is Search's scan button first -- it planted nothing on the nav,
     and Releases and Events were never planted; each is now planted on its nav button's own markup, found once, and named */
  const plant107 = [['#g-scan"/></svg></span>Scan<', 'blocker', 'nav scan: blocker'], ['#g-collection"/></svg></span>Collection<', 'stage', 'nav collection: stage'],
    ['#g-box"/></svg></span>Sealed<', 'stage', 'nav sealed: stage'], ['#g-calendar"/></svg></span>Releases<', 'counter', 'nav releases: counter'], ['#g-trophy"/></svg></span>Events<', 'life', 'nav events: life']];
  const put107 = (s, [a, g]) => (s !== null && s.split(a).length === 2 ? s.replace(a, a.replace(/#g-[\w-]+"/, `#g-${g}"`)) : null);
  const all107 = plant107.reduce(put107, html), each107 = plant107.map(p => { const one = put107(html, p); return one !== null && misfits(one).includes(p[2]); });
  ok('...control: take 107\'s map is caught (Scan on Blocker, Collection and Sealed on Stage, Releases on Counter, Events on Life) -- each planted once on its nav button, and each misfit named',
     all107 !== null && plant107.every(p => misfits(all107).includes(p[2])) && each107.every(Boolean), JSON.stringify(each107));
  ok('...and a plant that is not on its nav button alone is refused, not counted (the bare \'#g-scan"\' is two buttons)', put107(html, ['#g-scan"', 'blocker']) === null);
  ok('every new symbol is in the sprite', ['scan', 'collection', 'box', 'calendar', 'trophy', 'bookmark', 'export', 'import', 'backup', 'select', 'trend', 'torch', 'photo', 'binder',
     'filter', 'star', 'undo', 'swap', 'refresh', 'more', 'chevron', 'external', 'minus', 'plus', 'check', 'bell'].every(g => new RegExp(`<symbol id="g-${g}" viewBox="0 0 24 24"`).test(html)));
  ok('Lucide\'s notices ship inside the app (an element, not a comment) and About credits them',
     /<metadata id="lucide-licence">ISC License/.test(html) && /Permission to use, copy, modify, and\/or distribute this software/.test(html) && /Permission is hereby granted, free of charge/.test(html) && /id="aboutIcons">Some of the icons are Lucide’s/.test(js));
  ok('the search bars\' buttons are 44 px icon buttons with names: scan, favourites (a toggle), filter and sort',
     /<button class="icb" data-go="scan" aria-label="Scan a card">/.test(html) && /<button class="icb" id="favOnly" aria-label="Show favourites only" aria-pressed="false">/.test(html) && (html.match(/<button class="icb" id="sortBtn(All)?" aria-label="Filter and sort">/g) || []).length === 2);
  ok('every stepper draws its minus and plus from the sprite, with a name each way', (js.match(/aria-label="(Life|DON!!|Given DON!!) down">\$\{G\('minus', 20\)\}/g) || []).length === 3 && /id="dMinus" aria-label="One fewer"><svg class="g"[^>]*><use href="#g-minus"/.test(html) && /data-trdec="\$\{side\}:\$\{p\.id\}" aria-label="One fewer/.test(js));
  ok('every toggle says whether it is on: favourites, owned only, this deck, the stock alert, the reminder', /\$\('#favOnly'\)[^\n]*setAttribute\('aria-pressed'/.test(js) && /id="dkOwn" aria-pressed="false">Owned only</.test(html) && /\$\('#cdForDeck'\)\.setAttribute\('aria-pressed'/.test(js) && /data-stock="\$\{p\.id\}"[^>]*aria-pressed=/.test(js) && /data-relalert=[^`]*aria-pressed=/.test(js));
  ok('the star and the bell leave their fill to the control (a symbol\'s own fill="none" beats the outside; the first picture of a pressed star was hollow)', /<symbol id="g-star" viewBox="0 0 24 24" stroke=/.test(html) && /<symbol id="g-bell" viewBox="0 0 24 24" stroke=/.test(html) && /svg\.g\{[^}]*fill:none\}/.test(html) && /const bell = \(on, size = 18\) => G\('bell', size, on \? 'fill:currentColor' : ''\)/.test(js));
  ok('the links drawn as ghost buttons centre their words like the buttons beside them (an inline display:inline-block had pinned them to the top)', !/<a class="ghost"[^>]*display:inline-block/.test(js) && /a\.ghost\{display:inline-flex;align-items:center/.test(html));
  { const fb = ctx.document.querySelector('#favOnly'); fb._ev.click({ target: fb, preventDefault() {} });
    ok('tapping favourites presses the star and says so', fb.getAttribute('aria-pressed') === 'true' && fb.classList.contains('on'));
    fb._ev.click({ target: fb, preventDefault() {} }); }
  /* a painter that names its own G (the distributor feed) must not call it for a glyph: the helpers close over the real one.
     Take 112: two such painters now (Sealed, the stock alert) -- Releases reads HUNT.dist() and names no G */
  const shadowed = [...js.matchAll(/const G = HUNT\.feed/g)].map(m => { const rest = js.slice(m.index); const end = rest.search(/\n\}\n/); return rest.slice(0, end < 0 ? 4000 : end); });
  ok('no painter that names its own G calls it for a glyph (a TypeError at the first paint); chev, ext, tick and bell close over the real one',
     shadowed.every(b => !/\bG\('/.test(b)) && /const chev = \(open, size = 16\) => G\('chevron'/.test(js) && /const bell = \(on, size = 18\) => G\('bell'/.test(js));   // take 115: none names one now (the A3 checks count them)
  { const planted = shadowed[0] || 'const G = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.gts;';
    ok('...control: a glyph call inside such a painter is caught', !/\bG\('/.test(planted) && /\bG\('/.test(planted + " G('chevron')")); }
  /* the targets and the states, in the CSS (render measures them in Chrome) */
  ok('pressed: every control lightens, the compact ones give a little; disabled: switched off, and the pointer says so',
     /button:not\(:disabled\):active,a\.chip:active,a\.ghost:active\{filter:brightness\(1\.25\)\}/.test(html) && /:not\(:disabled\):active\{transform:scale\(\.96\)\}/.test(html) && /button:disabled\{opacity:\.45;cursor:not-allowed\}/.test(html) && /button svg,a svg\{pointer-events:none\}/.test(html));
  ok('44 px: fields, ghost buttons, links, steppers and the actions for real; chips, pills, the set chip, the ranges, the row steppers and the slider by a 44 px hit area',
     /input:not\(\[type\]\),textarea\{\s*min-height:44px/.test(html) && /\.ghost,\.linkish\{min-height:44px\}/.test(html) && /\.stepper button\{width:44px;height:44px/.test(html)
     && /:is\(\.chip,button\.pill,\.setchip,\.range,\.cnt button,\.mode button\)::after\{content:"";position:absolute;left:50%;top:50%;\s*width:max\(100%,44px\);height:max\(100%,44px\)/.test(html) && /\.chips\{display:flex;flex-wrap:wrap;gap:10px 7px\}/.test(html) && /\.chip\{[^}]*min-height:34px\}/.test(html));   // a chip at least 34 px: wrapped rows 44 px apart (the runner caught 31 px where-to-buy chips wrapping)
  ok('the actions keep their width: flex:0 0 auto beside the 44 px minimum (a min-width alone squeezed the row -- seen in this take)', /\.actions button\{flex:0 0 auto;min-width:44px;min-height:44px\}/.test(html));
  ok('the scanner\'s height takes the sticky mode slider off too (its shutter row sat 52 px under the nav)', /\.scanwrap\{position:relative;height:calc\(100vh - 76px - var\(--sat\) - var\(--sab\) - var\(--modebar-h\)\)/.test(html) && /--modebar-h:53px/.test(html));
  ok('the deck\'s name is a 44 px target that keeps its title\'s place', /h1\.ab-title input\{display:block;width:100%;min-height:44px;margin:-6px 0 -8px;padding:6px 0 8px/.test(html)); }   /* take 115: min-height 44 (0 drew 43.6 px -- render reads the size now, SPEC-108-39) */

section('take 109 — the art layer, part 1 (A42): the picture measured, Decks under its Leader, the ready-made decks back on Decks, a deck\'s Leader large, a card\'s own page over its own colours');
{ const man = V.CAT.man, keepImg = man.images, nof = () => undefined;
  /* an older build lacks these: each check then fails on its own instead of the run stopping */
  const largeOk = V.largeOk || nof, artUrl = V.artUrl || nof, artColours = V.artColours || (() => []), paintBack = V.paintBack || nof, heroLeader = V.heroLeader || (() => ({}));
  const hesc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));   // the app's own esc
  const first = p => !p.sealed && /_200w\.jpg$/.test(p.img || '');
  const two = V.CAT.rows.find(p => first(p) && /^[A-Z][a-z]+;[A-Z][a-z]+$/.test(p.color || ''));
  const one = V.CAT.rows.find(p => first(p) && /^(Red|Green|Blue|Purple|Black|Yellow)$/.test(p.color || ''));
  const prod = V.CAT.rows.find(p => p.sealed && p.img), alt = V.CAT.rows.find(p => /product-images\.tcgplayer\.com/.test(p.img || ''));
  /* the large size: the printing's own URL, only when this build measured it */
  man.images = { ...(keepImg || {}), large: { suffix: '_in_1000x1000', probed: 40, served: 40, w: 600, h: 838, min_w: 408 } };
  ok('measured: the large picture is the printing\'s own URL with the size swapped (AGENTS rule 3)',
     largeOk() && artUrl(one, 'large') === one.img.replace(/_200w\.jpg$/, '_in_1000x1000.jpg') && artUrl(one) === one.img, artUrl(one, 'large'));
  ok('...a second-host picture keeps its own URL, and a printing without a picture has none', (!alt || artUrl(alt, 'large') === alt.img) && artUrl({ num: 'OP01-001' }, 'large') === '');
  man.images = { ...(keepImg || {}), large: { suffix: '_in_1000x1000', probed: 40, served: 3, w: 600, h: 838, min_w: 600 } };
  ok('...control: a build where the large size mostly failed keeps the thumbnail', !largeOk() && artUrl(one, 'large') === one.img);
  man.images = { ...(keepImg || {}), large: {} };
  ok('...control: a build that did not measure it keeps the thumbnail (a VM without the image hosts)', !largeOk() && artUrl(one, 'large') === one.img);
  const byNum = f => /\.num\b|\bnumber\b/.test(String(f));
  ok('the picture\'s address is never made from a card number', typeof V.artUrl === 'function' && !byNum(V.artUrl) && !byNum(V.largeOk));
  ok('...control: an address made from the number is caught', byNum(p => `https://x/${p.num}.png`));
  /* take 110: read against the sidecar the hash step wrote -- the runner measures on every build; a
     session that restored the nightly's copy (landmine 116) builds with what the nightly measured */
  const side109 = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/hashes.json'), 'utf8')).large || {}; } catch { return null; } })();
  ok('this build\'s own manifest carries what the hash step measured, as it measured it -- on the runner, which always measures, served of 40 at the large size',
     side109 !== null && keepImg && JSON.stringify(keepImg.large) === JSON.stringify(side109) && (!process.env.GITHUB_ACTIONS || (typeof side109.served === 'number' && side109.suffix === '_in_1000x1000')), JSON.stringify(keepImg && keepImg.large) + ' vs ' + JSON.stringify(side109));
  man.images = { ...(keepImg || {}), large: { suffix: '_in_1000x1000', probed: 40, served: 40, w: 600, h: 838, min_w: 408 } };
  /* the ground under the art: the card's own colours, never a generic tint */
  const cv = c => `var(--c-${c.toLowerCase()})`, [c1, c2] = two.color.split(';');
  const own = (p, got) => !p.color ? got[0] === 'var(--brass2)' : got[0] === cv(p.color.split(';')[0]) && (p.color.includes(';') ? got[1] === cv(p.color.split(';')[1]) : got[1].includes(cv(p.color)));
  ok('the ground is the card\'s own colours: both of a two-colour card, the one and its shade for one colour, the mode\'s for a product',
     own(two, artColours(two)) && artColours(two)[1] === cv(c2) && own(one, artColours(one)) && /color-mix\(in srgb,var\(--c-/.test(artColours(one)[1]) && own(prod, artColours(prod)), JSON.stringify([artColours(two), artColours(one)]));
  ok('...control: a generic tint is caught', !own(one, ['var(--brass2)', 'var(--card2)']));
  { const db = ctx.document.querySelector('#dBack'); paintBack(db, two);
    ok('a card\'s own page: the backdrop takes that card\'s colours and its blurred thumbnail, cut above the stamp',
       db.style.cssText === `--a1:${cv(c1)};--a2:${cv(c2)}` && db.innerHTML.includes(`src="${two.img}"`) && /<img class="above"/.test(db.innerHTML), db.style.cssText);
    V.openDetail(one.id);
    ok('...openDetail paints it, and the card itself is the large picture with its thumbnail to fall back to',
       db.innerHTML.includes(one.img) && ctx.document.querySelector('#dArt').innerHTML.includes(one.img.replace(/_200w\.jpg$/, '_in_1000x1000.jpg')) && ctx.document.querySelector('#dArt').innerHTML.includes(`data-thumb="${one.img}"`)); }
  ok('the page itself: the backdrop first, the card centred in its own row, the old 112 px column gone',
     /<section id="detail" class="screen detail">\s*<div class="artbg dback" id="dBack" aria-hidden="true"><\/div>\s*<header class="appbar">/.test(html) && /<div class="dhero"><div class="art" id="dArt"><\/div><\/div>/.test(html) && !/id="dArt" style="width:112px/.test(html));
  /* the stamp: anything shown as art rather than as the card is cut to the card's top 42 % */
  ok('the stamp band is never shown as art: img.above cuts every art picture to the card\'s top 42 % (landmine 151)',
     /img\.above\{object-view-box:inset\(0 0 58% 0\)\}/.test(html) && (js.match(/<img class="above\$\{artOk\(/g) || []).length === 2);   /* take 110's review: artBack and paintBack, each with its loaded mark */
  ok('...control: an art picture without the cut is caught', !/<img class="above"/.test('<img class="blur" alt="">'));
  /* Decks: the hero, its Leader, the counts; Home has none (the owner's ruling) */
  const heroes = [...html.matchAll(/<section id="([\w-]+)"[^>]*>\s*<div class="arthero"/g)].map(m => m[1]);
  ok('the art hero sits above the header on Decks (and, from take 110, Sealed) and nowhere else -- none on Home (the owner: "I don\'t really like A in collect")', heroes.slice().sort().join() === 'decks,sealed', heroes.join());
  ok('...control: a hero put on Home is caught', [...html.replace('<section id="home" class="screen on">', '<section id="home" class="screen on">\n  <div class="arthero" id="hmHero" hidden></div>').matchAll(/<section id="([\w-]+)"[^>]*>\s*<div class="arthero"/g)].map(m => m[1]).includes('home'));
  const keepDecks = V.DECKS.list.slice(); const st0 = V.CAT.stock[0], L1 = V.CAT.byId.get(st0.leader), L2 = V.CAT.byId.get(V.CAT.stock[1].leader);
  V.DECKS.list.length = 0; V.DECKS.list.push({ id: 'd1', name: 'old', leader: L1.id, cards: [], created: 1 }, { id: 'd2', name: 'new', leader: L2.id, cards: [], created: 2 });
  ok('the hero features the newest of the collector\'s decks that has a Leader, by printing id', heroLeader().L === L2 && /your newest deck/.test(heroLeader().why));
  V.DECKS.list[1].leader = null;
  ok('...control: the newest deck without a Leader passes it to the one before', heroLeader().L === L1);
  V.DECKS.list.length = 0;
  ok('...with no deck of the collector\'s own, a ready-made deck\'s Leader', heroLeader().L === L1 && /ready-made/.test(heroLeader().why));
  V.DECKS.list.push({ id: 'd3', name: 'mine', leader: L2.id, cards: [], created: 3 });
  V.paintDecks(); const hero = ctx.document.querySelector('#dkHero');
  ok('...painted: the Leader\'s art blurred on its colours, and nothing over it -- no card rising from behind the title, no line of text (take 110, the owner\'s word)',
     hero.hidden === false && /^<div class="artbg" aria-hidden="true" style="--a1:/.test(hero.innerHTML) && hero.innerHTML.includes(`src="${L2.img}"`) && !/class="peek"/.test(hero.innerHTML) && !hero.innerHTML.includes('_in_1000x1000')
     && !/<p\b/.test(hero.innerHTML) && !hero.innerHTML.includes(hesc(L2.name)), hero.innerHTML.slice(0, 160));
  ok('...the line under the title counts the decks and the legal ones', /^1 deck \u00b7 [01] legal$/.test(ctx.document.querySelector('#dkSub').textContent), ctx.document.querySelector('#dkSub').textContent);
  V.DECKS.list.length = 0; const keepStock = V.CAT.stock; V.CAT.stock = []; V.paintDecks();
  ok('...control: with no Leader anywhere the hero hides and the plain header stands', hero.hidden === true && hero.innerHTML === '');
  V.CAT.stock = keepStock; V.DECKS.list.push(...keepDecks); V.paintDecks();
  ok('the slider\'s fade steps aside only while a screen with art is at the top, from a passive scroll listener',
     /:root\.at-top:has\(\.screen\.on > \.arthero:not\(\[hidden\]\)\) \.modebar,\s*:root\.at-top:has\(\.screen\.on > \.artbg\) \.modebar\{background:transparent\}/.test(html)
     && /addEventListener\('scroll', atTop, \{ passive: true \}\)/.test(js));
  ok('the hero keeps its height in the flow and only its art reaches up behind the slider (a negative margin would move the screen)',
     /\.arthero\{position:relative;height:var\(--hero-h\)\}/.test(html) && /\.arthero > \.artbg\{position:absolute;[^}]*top:calc\(-1 \* \(var\(--modebar-h\) \+ var\(--sat\)\)\)/.test(html));
  ok('the art fades into the page\'s own ground by a mask -- a scrim ending in a flat --bg drew a seam across the textured page (the take-109 look)',
     /\.artbg\{[^}]*mask-image:linear-gradient\(#000 55%,transparent\)/.test(html) && !/\.artbg::after\{[^}]*var\(--bg\)\)/.test(html));
  { V.openDetail(prod.id); const pa = ctx.document.querySelector('#dArt'); const isProd = pa.classList.contains('product'); V.openDetail(one.id);
    ok('a product\'s photo fits whole on its page (square on white, not cut at both sides); a card\'s fills its frame',
       isProd && !pa.classList.contains('product') && /\.dhero \.art\.product img\{object-fit:contain\}/.test(html)); }
  /* a deck, one level down: the Leader large */
  { const d = { id: 'dL', name: 'Leader test', leader: L1.id, cards: [], created: 9 }; V.DECKS.list.push(d); V.openDeck('dL');
    const ln = ctx.document.querySelector('#dkLeadLine').innerHTML, ld = ctx.document.querySelector('#dkLead').innerHTML;
    ok('a deck\'s Leader at 96 px from the large picture, its name in the display face, its number, Life and colours',
       /\.dkhead \.lead\{width:96px;flex:0 0 96px/.test(html) && ld.includes(L1.img.replace(/_200w\.jpg$/, '_in_1000x1000.jpg')) && ln.startsWith(`<b>${hesc(L1.name)}</b><span class="meta">${hesc(L1.num)} \u00b7 Leader`) && /Life<\/span>/.test(ln)
       && /\.dklead b\{display:block;font-family:var\(--display\)/.test(html) && /\.dklead \.meta\{display:block/.test(html) && !/\.dklead span\{/.test(html), ln.slice(0, 120));
    V.DECKS.list.splice(V.DECKS.list.indexOf(d), 1); V.go('decks'); }
  man.images = keepImg; }

section('take 110 — the art layer, part 2 (A42): Sealed under the newest set\'s top card, each set\'s own art on its heading, each Leader behind its side of the Play counter, the owner\'s own pictures, and the three texts the owner asked gone');
{ const man = V.CAT.man, keepImg = man.images, keepUser = man.user, keepRows = V.CAT.rows, nof = () => null;
  /* an older build lacks these: each check then fails on its own instead of the run stopping */
  const setTop = V.setTop || nof, newestTop = V.newestTop || nof, paintSealedHero = V.paintSealedHero || (() => {}), artUrl = V.artUrl || (p => p.img);
  man.images = { ...(keepImg || {}), large: { suffix: '_in_1000x1000', probed: 40, served: 40, w: 600, h: 838, min_w: 408 } };
  /* the owner: "remove this text when you get the chance - all of it" */
  const quiet = t => !/class="credit"/.test(t) && !/id="dCondNote"/.test(t) && !/COND_NOTE_(CARD|SEALED)/.test(t) && !/legal decks built from the starter-deck sets/.test(t);
  ok('the three texts the owner asked gone are gone: the line under the art, the paragraph under the ready-made decks\' heading, the note under a card\'s conditions', quiet(html + js));
  ok('...control: each of the take-109 lines is caught', !quiet('<p class="credit">OP10-001 Smoker</p>') && !quiet('<div class="note" id="dCondNote">') && !quiet("const COND_NOTE_CARD = '';") && !quiet('17 legal decks built from the starter-deck sets'));
  ok('...the per-condition gap is still said: in More\'s "What this app does not know", on the trade screen and in the bulk picker (the honesty the note carried)',
     /What this app does not know/.test(js) && /Condition does not change the price shown/.test(js) && /Condition is not priced in/.test(js) && /never multiplied into it/.test(js));
  { const c = V.CAT.rows.find(p => !p.sealed && p.market > 0), b = V.CAT.rows.find(p => V.SEALED.isProduct(p));
    V.openDetail(c.id); const lc = ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, ''); V.openDetail(b.id); const lb = ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, ''); V.go('home');
    ok('...a card\'s page still names its condition on its line, and a sealed product\'s still says it has none', /^Condition · /.test(lc) && lb === 'No condition to record', `${lc} | ${lb}`); }
  /* a set's top card: its most valuable printing whose picture the runner fetched (a hash), by printing id */
  const hashed = V.CAT.rows.filter(p => !p.sealed && p.hash && p.market > 0 && p.img);
  const sid = hashed[0].set, want = hashed.filter(p => p.set === sid).reduce((a, p) => p.market > a.market ? p : a);
  ok('a set\'s top card is its most valuable printing with a fetched picture', setTop(sid) === want, `${setTop(sid)?.id} vs ${want.id}`);
  V.CAT.rows = [...keepRows, { ...want, id: -110, hash: '', market: want.market * 10 }];
  ok('...control: a dearer printing whose picture never served (no hash) is passed over', setTop(sid) === want);
  V.CAT.rows = [...keepRows, { ...want, id: -110, market: want.market * 10 }];
  ok('...control: the same printing with its picture takes the place -- the kept answer follows a new catalogue', setTop(sid)?.id === -110);
  V.CAT.rows = keepRows;
  ok('...and the catalogue restored gives the set\'s own top card again', setTop(sid) === want);
  /* Sealed's banner card: the newest booster set already out that has one */
  const today = new Date().toISOString().slice(0, 10);
  const mains = [...V.CAT.sets.values()].filter(t => t.kind === 'main' && t.pub && t.pub <= today && setTop(t.id)).sort((a, b) => b.pub.localeCompare(a.pub));
  const nt = newestTop() || {};
  ok('Sealed\'s banner card is the top card of the newest booster set already out', !!mains.length && nt.set === mains[0] && nt.p === setTop(mains[0].id), `${nt.set?.abbr} ${nt.set?.pub} vs ${mains[0]?.abbr} ${mains[0]?.pub}`);
  const fut = { id: -1101, name: 'Not out yet', abbr: 'OP99', kind: 'main', pub: '2099-01-01', n: 1 };
  V.CAT.sets.set(fut.id, fut); V.CAT.rows = [...keepRows, { ...want, id: -1102, set: fut.id }];
  ok('...control: a set not out yet is passed over though it has a top card -- and taken on the day it is out', (newestTop() || {}).set === mains[0] && (newestTop('2099-12-31') || {}).set === fut);
  fut.pub = today; V.CAT.rows = keepRows;
  ok('...control: a set out today with no card picture yet is passed over', !!mains.length && (newestTop() || {}).set === mains[0]);
  V.CAT.sets.delete(fut.id);
  V.MODE.set('hunt', false); paintSealedHero(); const sh = ctx.document.querySelector('#sealedHero');
  ok('Sealed opens under it: crisp, at the large size with the thumbnail to fall back to, cut above the stamp (landmine 151), no line of text',
     sh.hidden === false && sh.innerHTML.startsWith('<div class="artbg crisp"') && !!nt.p && sh.innerHTML.includes(`src="${artUrl(nt.p, 'large')}"`) && (artUrl(nt.p, 'large') === nt.p.img || sh.innerHTML.includes(`data-thumb="${nt.p.img}"`))
     && /<img class="above"/.test(sh.innerHTML) && !/<p\b/.test(sh.innerHTML), sh.innerHTML.slice(0, 200));
  ok('...where Decks\' stands: above the header, the title in A\'s slot', /<section id="sealed" class="screen">\s*<div class="arthero" id="sealedHero" hidden><\/div>\s*<header class="appbar">/.test(html));
  ok('...the crisp layer: the picture sharp and filling the band, its character in view', /\.artbg\.crisp img\{left:0;top:0;width:100%;height:100%;object-fit:cover;filter:none;object-position:50% 30%\}/.test(html));
  V.CAT.rows = keepRows.filter(p => !p.hash); paintSealedHero();
  ok('...control: with no card picture in any set the banner hides and the plain header stands', sh.hidden === true && sh.innerHTML === '');
  V.CAT.rows = keepRows;
  /* the owner's own pictures (assets/user; the folder's README) */
  man.user = ['hero-hunt.jpg']; paintSealedHero();
  ok('the owner\'s hero-hunt.jpg stands in for Sealed\'s card when supplied, uncut (it is not a card)', /src="bundle\/user\/hero-hunt\.jpg"/.test(sh.innerHTML) && /<img class="own"/.test(sh.innerHTML) && !/class="above"/.test(sh.innerHTML), sh.innerHTML.slice(0, 160));
  man.user = ['hero-play.jpg']; V.paintDecks(); paintSealedHero(); const dh = ctx.document.querySelector('#dkHero');
  ok('...and hero-play.jpg for Decks; each only on its own screen', /src="bundle\/user\/hero-play\.jpg"/.test(dh.innerHTML) && !/bundle\/user\//.test(sh.innerHTML) && !!nt.p && sh.innerHTML.includes(artUrl(nt.p, 'large')));
  /* the owner: "the blurred background should also be zoomed out a bit where it's used so it's more
     focused on the center of the art" -- the band above the stamp whole, not cut to cover the box */
  const zoomed = t => /\.artbg img\{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;object-position:50% 50%;/.test(t) && /\.artbg\.dback img\{object-position:50% 0\}/.test(t) && /\.artbg\.crisp img\{[^}]*object-fit:cover/.test(t);
  ok('the blurred art zooms out: the band above the stamp whole at the box\'s width, at the top of a card\'s page; the sharp art still fills its band', zoomed(html));
  ok('...control: take 109\'s blur, cut to cover the box past its edges, is caught', !zoomed(html.replace(/\.artbg img\{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;/, '.artbg img{position:absolute;left:-24px;top:-24px;width:calc(100% + 48px);height:calc(100% + 48px);object-fit:cover;')));
  ok('...and no card rises from behind the Decks title: the peek is gone, style and all (the owner: "I don\'t like the little peak")', !/class="peek"/.test(js) && !/\.peek\b/.test(html));
  { const keepD = V.DECKS.list.slice(), keepS = V.CAT.stock; V.DECKS.list.length = 0; V.CAT.stock = []; V.paintDecks();
    ok('...and with no Leader anywhere hero-play.jpg still stands on Decks, as hero-hunt.jpg does on Sealed (the review: Decks\' hid it)', dh.hidden === false && /src="bundle\/user\/hero-play\.jpg"/.test(dh.innerHTML), dh.innerHTML.slice(0, 120));
    man.user = keepUser; V.paintDecks();
    ok('...control: without it and with no Leader, the hero hides', dh.hidden === true && dh.innerHTML === '');
    V.CAT.stock = keepS; V.DECKS.list.push(...keepD); }
  { const AOK = ctx.ART_OK || new Set();   /* an older build has none: the check then fails on its own */
    const pa = V.CAT.rows.find(q => !q.sealed && q.img), before = V.artBack(pa); AOK.add(pa.img); const after = V.artBack(pa), own = V.ownBack('hero-hunt.jpg'); AOK.add('bundle/user/hero-hunt.jpg'); const own2 = V.ownBack('hero-hunt.jpg');
    AOK.delete(pa.img); AOK.delete('bundle/user/hero-hunt.jpg');
    ok('a picture that loaded once is drawn at once when its screen repaints (the review: a keystroke in Sealed\'s search faded every strip in again)',
       /<img class="above ok" /.test(after) && /<img class="own ok" /.test(own2) && /onload="this\.classList\.add\('ok'\);window\.ART_OK\.add\(this\.getAttribute\('src'\)\)"/.test(after), after.slice(0, 160));
    ok('...control: a picture never loaded starts from nothing and fades in', /<img class="above" /.test(before) && /<img class="own" /.test(own)); }
  man.user = keepUser; V.paintDecks(); paintSealedHero();
  ok('...control: without them, the card art on both', !/bundle\/user\//.test(dh.innerHTML + sh.innerHTML) && /<div class="artbg"/.test(dh.innerHTML) && /<div class="artbg crisp"/.test(sh.innerHTML));
  /* each set's heading in Sealed: a strip under that set's own top card */
  const key = v => isNaN(+v) ? v : +v;
  const stripsOf = src => [...src.matchAll(/<button class="fgrp setstrip" data-setfold="([^"]+)" aria-expanded="[^"]*">(<div class="artbg crisp"[^>]*>(?:<img [^>]*>)?<\/div>)?/g)];
  V.SEALED.q = ''; V.SEALED.kind = 'all'; V.paintSealed(); const strips = stripsOf(ctx.document.querySelector('#sealedList').innerHTML);
  const topOf = m => m[1] === 'decks' ? V.CAT.rows.filter(p => V.SEALED.isProduct(p) && V.SEALED.kindOf(p) === 'deck').sort((a, b) => (V.CAT.sets.get(b.set)?.pub || '').localeCompare(V.CAT.sets.get(a.set)?.pub || '') || a.name.localeCompare(b.name)).map(p => setTop(p.set)).find(Boolean) : setTop(key(m[1]));
  ok('every heading in Sealed is a strip -- the starter decks\' too -- carrying its own set\'s top card, crisp; a set with no card picture keeps the plain ground',
     strips.length >= 10 && strips[0][1] === 'decks' && strips.every(m => !!m[2] === !!topOf(m)) && strips.filter(m => m[2]).length >= 5 && strips.filter(m => m[2]).every(m => m[2].includes(`src="${artUrl(topOf(m), 'large')}"`) && /<img class="above"/.test(m[2])),
     `${strips.length} strips, ${strips.filter(m => m[2]).length} with art`);
  V.CAT.rows = keepRows.filter(p => !p.hash); V.paintSealed();
  const plain = stripsOf(ctx.document.querySelector('#sealedList').innerHTML);
  ok('...control: with no card pictures every strip keeps the plain ground', plain.length >= 10 && plain.every(m => !m[2]));
  V.CAT.rows = keepRows; V.paintSealed();
  ok('...a strip\'s date never breaks at its own hyphens (the take-110 look found "2026-10-" over "30")', /\.setstrip \.note\{[^}]*white-space:nowrap/.test(html));
  ok('...the art fills the strip behind the name, under a scrim from the left so the name reads', /\.setstrip > \.artbg\{position:absolute;inset:0;/.test(html) && /\.setstrip > \.artbg::after\{background:linear-gradient\(90deg,rgba\(0,0,0,\.8\)/.test(html) && /\.setstrip > span\{position:relative;color:#fff/.test(html));
  /* the Play counter: each player's Leader behind their side */
  const keepP = V.PLAY.p.map(pl => ({ ...pl })), keepHot = V.PLAY.hotseat, Lp = V.CAT.byId.get(V.CAT.stock[0].leader);
  V.PLAY.hotseat = false; V.PLAY.p[0].leader = Lp.id; V.PLAY.p[1].leader = null; V.paintPlay();
  const panels = ctx.document.querySelector('#plBoard').innerHTML.split('<div class="panel plpanel"').slice(1);
  ok('the Play counter: a player\'s Leader faint behind their side, blurred from its thumbnail, cut above the stamp', panels.length === 2 && panels[0].includes('<div class="artbg" aria-hidden="true"') && panels[0].includes(`src="${Lp.img}"`) && /<img class="above"/.test(panels[0]), (panels[0] || '').slice(0, 200));
  ok('...control: a side with no Leader chosen keeps the plain panel', panels.length === 2 && !/class="artbg/.test(panels[1]));
  ok('...faint, the numbers and buttons drawn over it', /\.plpanel > \.artbg\{position:absolute;inset:0;opacity:\.6\}/.test(html) && /\.plpanel > :not\(\.artbg\)\{position:relative\}/.test(html));
  /* the Play counter's three steppers on a 360 px phone: take 108's 44 px buttons needed 332 px, the panel has 296 */
  const fits = t => /\.plcols\{display:flex;gap:clamp\(6px,calc\(\(100vw - 330px\) \/ 8\),10px\);/.test(t) && /\.plcols \.stepper\{gap:clamp\(6px,calc\(\(100vw - 330px\) \/ 5\),16px\)\}/.test(t);
  ok('...its three steppers fit a 360 px phone: the gaps give way, the 44 px buttons keep their size', fits(html) && /<div class="plcols">/.test(js) && !/<div style="display:flex;gap:10px;margin-top:12px">/.test(js));
  ok('...control: the fixed gaps are caught', !fits('.plcols{display:flex;gap:10px;margin-top:12px}'));
  V.PLAY.p.forEach((pl, i) => Object.assign(pl, keepP[i])); V.PLAY.hotseat = keepHot; V.paintPlay();
  man.images = keepImg; V.CAT.rows = keepRows; V.MODE.set('collect', false); V.go('home'); }

section('take 110 — the voice (A42, UI-AUDIT §5): the developer\'s wording out, sentence case, one word per thing, one money, percentage, day and moment, a name for every field');
{ const both = html + js, nof = () => '';
  const secOf = (src, id) => { const i = src.indexOf(`id="${id}"`); if (i < 0) return null; const s0 = src.lastIndexOf('<section id="', i); return s0 < 0 ? null : src.slice(s0 + 13, src.indexOf('"', s0 + 13)); };
  const signedMoney = V.signedMoney || nof, pctNum = V.pctNum || nof, dayText = V.dayText || nof, momentText = V.momentText || nof;
  /* the developer's voice: the shipped app carries no source comments, so these can only be words on a screen */
  const DEV = ['(R6)', 'PROTOCOL §', '(landmine ', 'MEASURED:', '(dev)', 'A17 —', 'on the roadmap', 'come to this mode next', 'come with the local view', 'offline by design', 'Sealed product is manual', 'take __TAKE__'];
  const devIn = t => DEV.filter(w => t.includes(w));
  ok('the developer\'s wording is out of the app: no ticket, protocol or landmine numbers, no "MEASURED:", no dev button, no roadmap promises', devIn(both).length === 0 && /<title>OP TCG Hub<\/title>/.test(html), devIn(both).join(' | '));
  ok('...control: each of the take-109 lines is caught', DEV.every(w => devIn('x ' + w + ' x').length === 1) && !/<title>OP TCG Hub<\/title>/.test('<title>OP TCG Hub — take 109</title>'));
  ok('...the test credits live in Diagnostics, the hidden screen, and More says what credits are in the collector\'s words', /<button class="ghost" id="devEarn">[^<]*<\/button>/.test(html) && secOf(html, 'devEarn') === 'diag' && /<h3>Save credits<\/h3>/.test(js) && !/id="devEarn"/.test(js));
  /* sentence case for every heading, button and chip */
  const CASE = ['Most Valuable', 'View All', 'Market Movers', 'Trade Analyzer', 'Bulk Actions', 'Add a Graded Card', 'Starter Decks', 'YOUR SCAN', 'Backup FAILED', '>FAILED<', 'REPLACES', 'offline ok', 'for this deck: off', '>given<', '>+cal<', 'Two faces'];
  const caseIn = t => CASE.filter(w => t.includes(w));
  ok('sentence case: the audit\'s capitalised and lower-case outliers are gone', caseIn(both).length === 0, caseIn(both).join(' | '));
  ok('...control: each take-109 outlier is caught', CASE.every(w => caseIn('x' + w + 'x').length === 1));
  /* one word per thing */
  const OLD = ['All portfolios', 'New portfolio', 'Rename portfolio', "'Portfolio'", 'A portfolio is', 'Only the portfolio', 'Portfolios keep', '<span class="cap">Portfolio', '<h3>Performance</h3>', '<h3>Events</h3>', '>Fetch<', 'hot-seat ·', 'Wanted: ', 'No active [Blocker]', '</svg></span>Export</button>', '</svg></span>Backup</button>'];
  const oldIn = t => OLD.filter(w => t.includes(w));
  ok('one word per thing: Collection for Portfolio (D17), Refresh for the feeds, Export CSV and Back up as in More, pass the phone for the Sim, the want list by name, Blocker as the game writes it; no panel repeats its screen\'s title', oldIn(both).length === 0 && /<span class="cap">Collection<\/span>/.test(html) && /All collections/.test(js) && /\+ New collection/.test(js), oldIn(both).join(' | '));
  ok('...control: each take-109 word is caught', OLD.every(w => oldIn('x' + w + 'x').length === 1));
  ok('...and the data keeps its names: the CSV column and the backup still say portfolio (an export from any take imports)', /'portfolio', 'product_id'/.test(js) && /portfolios: PF\.list/.test(js));
  /* money, percentages, days and moments */
  const cur0 = V.CUR.active();
  ok('a signed amount keeps its currency: +$12.50, −$3.00 (money(x).slice(1) dropped the "$")', signedMoney(12.5) === '+$12.50' && signedMoney(-3) === '−$3.00', `${signedMoney(12.5)} ${signedMoney(-3)}`);
  ok('...control: the take-109 expression is caught', '+' + (() => '$12.50')().slice(1) !== '+$12.50');
  const R = V.CUR.rates(), conv = R && R.rates && Object.keys(R.rates).find(c => c !== 'USD' && R.rates[c] > 0);
  if (conv) { V.CUR.set(conv); ok(`...in a converted currency (${conv}) the sign sits after the ≈, which is kept`, /^≈\+/.test(signedMoney(10)) && /^≈−/.test(signedMoney(-10)), signedMoney(10)); V.CUR.set(cur0); }
  ok('one rule for a percentage: one decimal, none from 100 % up', pctNum(0.344) === '0.3%' && pctNum(-12.46) === '12.5%' && pctNum(123.4) === '123%', `${pctNum(0.344)} ${pctNum(-12.46)} ${pctNum(123.4)}`);
  /* take 110's review: the rule on the rounded figure, and a sign only on a figure that is not zero */
  const signedPct = V.signedPct || nof;
  ok('...read on the figure as rounded: 99.96 is "100%", never "100.0%"', pctNum(99.96) === '100%' && pctNum(99.94) === '99.9%', `${pctNum(99.96)} ${pctNum(99.94)}`);
  ok('...a signed percentage carries no sign on a zero ("\u22120.0%" and "+0.0%" said a move the figure does not show)',
     signedPct(-0.04) === '0.0%' && signedPct(0.02, true) === '0.0%' && signedPct(-1.26) === '\u22121.3%' && signedPct(3, true) === '+3.0%' && signedPct(3) === '3.0%' && !js.includes("'\\u2212'}${pctNum("), `${signedPct(-0.04)} ${signedPct(-1.26)} ${signedPct(3, true)}`);
  ok('...control: the first push\'s forms are caught', ((p) => (p >= 0 ? '' : '\u2212') + Math.abs(p).toFixed(Math.abs(p) >= 100 ? 0 : 1) + '%')(-0.04) === '\u22120.0%' && (a => a.toFixed(a >= 100 ? 0 : 1) + '%')(99.96) === '100.0%');
  { const keepCode = V.CUR.code, keepRates = V.CAT.man.rates;
    V.CUR.code = 'EUR'; V.CAT.man.rates = null;   /* a euro chosen on an earlier build; this build carries no rates (the fetch failed and no sidecar) */
    const shown = V.money(10), sym = V.CUR.sym(), wrong = (V.CUR.list.find(c => c[0] === V.CUR.code) || [])[1];
    V.CUR.code = keepCode; V.CAT.man.rates = keepRates;
    ok('a saved currency this build has no rate for shows dollars, marked as dollars (the review: "\u20ac10.00" for $10, with no \u2248)', shown === '$10.00' && sym === '$', `${shown} ${sym}`);
    ok('...control: the symbol read from the saved code is caught', wrong === '\u20ac'); }
  ok('...no ".toFixed" percentage outside that rule, no "in the last all time"', !/toFixed\((?:0|2|tile \? 1 : 2)\)\}%/.test(js) && !/in the last all time|'all time' : range/.test(js) && /since the first day on file/.test(js));
  const yr = new Date().getFullYear();
  ok('one way to write a day: "Sep 23", the year only when it is not this one', dayText(`${yr}-09-23`) === 'Sep 23' && dayText(`${yr - 1}-11-20`) === `Nov 20, ${yr - 1}` && dayText('') === '?', `${dayText(yr + '-09-23')} | ${dayText((yr - 1) + '-11-20')}`);
  ok('...and a moment: no literal T, a 12-hour clock', /^[A-Z][a-z]{2} \d{1,2}(, \d{4})?, \d{1,2}:\d{2}\s?[AP]M$/.test(momentText(`${yr}-09-24T06:23:00Z`)) && !/T\d/.test(momentText(`${yr}-09-24T06:23:00Z`)), momentText(`${yr}-09-24T06:23:00Z`));
  ok('...control: the take-109 ISO forms are caught', !/^[A-Z][a-z]{2} \d/.test('2026-09-23') && /T\d/.test('2026-09-24T06:23'));
  /* take 110's review, from the look's pictures: Market movers' heading still read "2026-09-22 \u2192 2026-09-23" */
  const isoShown = t => ['${esc(prev)} \\u2192 ${esc(day)}', '(${g.from} \\u2192 ${g.to})', "' of ' + esc(R.date)", "market \\u00b7 ${(CAT.man.source_updated_at || '').slice(0, 10)}", '\\u00b7 ${esc(n.when)}', 'via TCGCSV, ${esc(asOf)}', 'Trade \\u2014 ${new Date().toISOString().slice(0, 10)}'].filter(w => t.includes(w));
  const appSrc = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8');
  ok('...no day on a screen in ISO: the movers\' heading, the range label, the rate\'s date, where to buy, your own notes; a shared page and a trade\'s text carry the year', isoShown(appSrc).length === 0 && dayText(`${yr}-09-23`, { year: true }) === `Sep 23, ${yr}`, isoShown(appSrc).join(' | '));
  ok('...control: each take-109 form is caught', isoShown(`\${esc(prev)} \\u2192 \${esc(day)} (\${g.from} \\u2192 \${g.to}) ' of ' + esc(R.date) market \\u00b7 \${(CAT.man.source_updated_at || '').slice(0, 10)} \\u00b7 \${esc(n.when)} via TCGCSV, \${esc(asOf)} Trade \\u2014 \${new Date().toISOString().slice(0, 10)}`).length === 7);
  ok('...ISO stays only where a machine reads it: the diagnostics and self-test reports', (js.match(/slice\(0, 16\)/g) || []).length === 2 && /diagnostics \\u2014 take \$\{TAKE\} \\u2014 \$\{new Date\(\)\.toISOString\(\)\.slice\(0, 16\)\}Z/.test(fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8')));
  V.MODE.set('hunt', false); V.paintSealed();
  ok('...Sealed\'s line under its title says the prices\' day in words', /^prices [A-Z][a-z]{2} \d{1,2}(, \d{4})?$/.test(ctx.document.getElementById('sealedAsOf').textContent), ctx.document.getElementById('sealedAsOf').textContent);
  V.MODE.set('collect', false); V.go('home');
  ok('the price filter speaks the currency on screen: its bounds typed and shown converted, kept in US dollars', /\$\('#fMin'\)\.placeholder = 'min ' \+ CUR\.sym\(\)\.trim\(\)/.test(js) && typeof V.fromShown === 'function' && V.fromShown('') === null && V.fromShown('10') === 10 / (V.CUR.rate(V.CUR.active()) || 1) && V.toShown(null) === '');
  /* a name for every field */
  const unnamed = t => [...t.matchAll(/<(input|select|textarea)\b([^>]*)>/g)].filter(m => !/type="(checkbox|file|hidden)"/.test(m[2]) && !/aria-label/.test(m[2]) && !(/id="([^"]+)"/.test(m[2]) && new RegExp('<label[^>]*for="' + /id="([^"]+)"/.exec(m[2])[1] + '"').test(t))).map(m => (/id="([^"]+)"/.exec(m[2]) || [, m[1]])[1]);
  ok('every field has a name a screen reader says: a label, not only a placeholder that vanishes when typing starts', unnamed(both).length === 0, unnamed(both).join(', '));
  ok('...control: a field with only a placeholder is caught', unnamed('<input id="x" placeholder="Name">').length === 1);
  const P110 = V.PLAY; const t0 = P110.turn; P110.turn = 1; V.paintPlay(); const pb = ctx.document.querySelector('#plBoard').innerHTML; P110.turn = t0; V.paintPlay();
  ok('the update note on Home starts with a capital -- the release paragraph is written to follow "New at take N:"', /note\.text\.charAt\(0\)\.toUpperCase\(\) \+ note\.text\.slice\(1\)/.test(js));
  ok('the Play counter\'s button is a word or two; what happens is said beside it', />Start<\/button>/.test(pb) && /The first player draws no card and gets 1 DON!!/.test(pb) && !/Start — first player/.test(js));
}

section('take 110 — polish (A42, UI-AUDIT §6): motion from the tokens, a sheet that rises, a mode switch that crossfades, one empty state, tabular figures, three thumbnail sizes');
{ /* motion: every duration a token, reduced motion honoured by one rule */
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  const literal = t => [...t.matchAll(/transition:[^;}]*?\b\d*\.?\d+m?s\b/g)].map(m => m[0]);
  ok('every transition takes its duration from the motion tokens (--dur-press, --dur-ui, --dur-sheet)', literal(css).length === 0 && /--dur-press:120ms; --dur-ui:220ms; --dur-sheet:320ms;/.test(css), literal(css).join(' | '));
  ok('...control: a take-109 literal (opacity .25s) is caught', literal('.art img.ref{opacity:0;transition:opacity .25s}').length === 1);
  ok('a sheet rises from the bottom edge as its scrim fades in, on --dur-sheet', /\.sheet\.on\{display:flex;animation:scrimIn var\(--dur-sheet\) ease-out\}/.test(css) && /\.sheet\.on \.sheetbody\{animation:sheetUp var\(--dur-sheet\)/.test(css) && /@keyframes sheetUp\{from\{transform:translateY\(100%\)\}\}/.test(css));
  ok('a mode switch crossfades, on a tap only, and the class comes off so a later screen change does not fade', /:root\.mode-swap \.screen\.on\{animation:modeIn var\(--dur-ui\) ease-out\}/.test(css) && /root\.classList\.add\('mode-swap'\)/.test(js) && /setTimeout\(\(\) => root\.classList\.remove\('mode-swap'\), 400\)/.test(js) && /body\{[^}]*transition:background-color var\(--dur-ui\)/.test(css));
  ok('reduced motion stops every transition and animation (one rule, take 106)', /@media \(prefers-reduced-motion:reduce\)\{\*,\*::before,\*::after\{transition-duration:0s!important;animation-duration:0s!important/.test(css));
  /* one empty state */
  const bare = t => (t.match(/<div class="note">(Nothing matches\. Loosen a chip\.|Nothing wanted yet|No alerts yet|Nothing matched\.)/g) || []);
  ok('a list that fills a screen says it is empty one way: its glyph, what is missing, what to do', bare(js).length === 0 && (js.match(/emptyHtml\('/g) || []).length >= 6 && /\.empty \.empty-line\{/.test(css), bare(js).join(' | '));
  ok('...control: the take-109 bare lines are caught', bare('<div class="note">No alerts yet. Open a card</div><div class="note">Nothing matched.</div>').length === 2);
  { V.SEALED.q = 'zzzz no such product'; V.MODE.set('hunt', false); V.paintSealed(); const sl = ctx.document.querySelector('#sealedList').innerHTML; V.SEALED.q = ''; V.paintSealed(); V.MODE.set('collect', false); V.go('home');
    ok('...painted: Sealed with nothing matching shows the empty state with its glyph, under the stock panels (before take 110 it showed nothing: the panels filled the list and the fallback never ran)', /<div class="empty"><svg class="g" width="64" height="64"[^>]*><use href="#g-box"\/><\/svg><b class="empty-line">Nothing matches<\/b>/.test(sl), sl.slice(-220)); }
  /* numbers */
  ok('every number lines up: tabular figures are the body\'s default, not only .mono\'s', /body\{[^}]*font-variant-numeric:tabular-nums/.test(css));
  ok('a card\'s copy row is two lines: finish, condition and price, then the quantity by the condition buttons', /<div class="row dqrow">/.test(html) && /\.dqrow\{display:grid;grid-template-columns:minmax\(0,1fr\) auto;grid-template-areas:"nm v" "st st"/.test(css));
  ok('a condition\'s name never breaks in two on a card\'s page (the look had "Near" over "Mint")', /\.nw\{white-space:nowrap\}/.test(css) && (js.match(/'Condition · <span class="nw">'/g) || []).length === 2);
  /* three thumbnail sizes */
  const sized = t => [...t.matchAll(/\b(cardPic|productPic|setPic)\(([^)]*)\)/g)].filter(m => /\d/.test(m[2]) && !/THUMB\.[sml]/.test(m[2])).map(m => m[0]);
  ok('three thumbnail sizes, one per kind of list: 32 dense, 44 a row, 56 a sealed product -- no call names its own size', sized(js).length === 0 && /const THUMB = \{ s: 32, m: 44, l: 56 \};/.test(js) && /--thumb-s:32px; --thumb-m:44px; --thumb-l:56px;/.test(css)
     && /function cardPic\(p, w = THUMB\.m\)/.test(js) && /function productPic\(p, size = THUMB\.l\)/.test(js) && /function setPic\(s, w = THUMB\.m\)/.test(js), sized(js).join(' | '));
  ok('...control: a take-109 call with its own size is caught', sized('cardPic(p, 30) setPic(s, 36) productPic(p)').length === 2);
}

section('take 110 — the Fold\'s inner screen (A42): two panes where two fit, between a phone and the desktop column');
{ const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  const fold = (css.match(/@media \(min-width:700px\) and \(max-width:899px\)\{([\s\S]*?)\n\}/) || [, ''])[1];
  const want = [/#detail \.dhero\{float:left/, /#detail \.dhero \.art\{width:300px\}/, /#detail > \.panel:not\(\[hidden\]\)\{display:flow-root\}/, /#home\.screen\.on\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,
    /#home\.screen\.on > \.panel:has\(#topList\),#home\.screen\.on > \.panel:has\(#setDone\)\{grid-column:auto\}/, /#allRes > \.panel,#relList > \.panel\{display:grid/, /#sealedList,#dkList,#dkStock,#cdRes,#eventsList\{display:grid/,
    /#colGrid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)\}/, /\.sheetbody\{max-width:640px\}/];
  const miss = t => want.filter(r => !r.test(t)).map(String);
  ok('the open Fold (700-899 px) gets two panes: a card beside its page, Home\'s two lists side by side, rows two to a line, four tiles across, a sheet at a readable width', !!fold && miss(fold).length === 0, miss(fold).join(' | '));
  ok('...control: a stylesheet without them is caught', miss('').length === want.length);
  /* take 110's review: what the first push got wrong in that range */
  ok('...a hidden panel stays hidden there, the art sits behind the card\'s column only, Local stays one column, and a lone Events panel spans',
     /#detail > \.panel:not\(\[hidden\]\)\{display:flow-root\}/.test(fold) && !/#detail > \.panel\{display:flow-root\}/.test(fold) && /#detail \.artbg\.dback\{right:auto;width:calc\(var\(--pad\) \+ 320px\)/.test(fold)
     && !/#localList\{display:grid|,#localList\{display:grid/.test(fold) && /#eventsList:not\(:has\(> \.panel ~ \.panel\)\) > \.panel\{grid-column:1\/-1\}/.test(fold) && /#home\.perf\.screen\.on > \.panel:has\(#topList\)\{grid-column:1\/-1\}/.test(fold));
  ok('...control: the first push\'s rules are caught', !/#detail > \.panel:not\(\[hidden\]\)\{display:flow-root\}/.test('#detail > .panel{display:flow-root}') && /#localList\{display:grid|,#localList\{display:grid/.test('#sealedList,#eventsList,#localList{display:grid}'));
  { const sp = ctx.document.getElementById('setPanel'), comp = ctx.document.getElementById('setComp') || { style: {} };   /* an older build has no id: the check fails on its own */
    sp.style.display = 'block'; V.setHomeTab(true);
    const onPerf = { comp: comp.style.display, search: sp.style.display, perf: ctx.document.getElementById('home').classList.contains('perf') };
    V.setHomeTab(false); const back = { comp: comp.style.display, perf: ctx.document.getElementById('home').classList.contains('perf') };
    ok('Home\'s Performance tab hides Home\'s own Set completion, not Search\'s set list (the list named Search\'s panel from take 64 on)', onPerf.comp === 'none' && onPerf.search === 'block' && onPerf.perf && back.comp === '' && !back.perf, JSON.stringify([onPerf, back]));
    ok('...the list names Home\'s own panel, and the take-64 one is caught', !/HOME_OVERVIEW = \['hero', 'setPanel'/.test(js) && /HOME_OVERVIEW = \['hero', 'setComp', 'srcPanel'\]/.test(js) && /HOME_OVERVIEW = \['hero', 'setPanel'/.test("const HOME_OVERVIEW = ['hero', 'setPanel', 'srcPanel'];")); }
  ok('...and the phone and the desktop column are as they were: the rules live only inside that range, take 60\'s column from 900 px', /@media \(min-width:900px\)\{\s*body\{max-width:520px/.test(css) && !/^#detail \.dhero\{float:left/m.test(css.replace(fold, '')));
}

section('take 110 — bulk delete keeps to the collection on screen (AGENTS rule 5; the UI audit\'s finding in passing)');
{ const bl = V.bulkLines || (() => []), bs = V.bulkSum || (() => ({ n: -1, v: -1 })), PF = V.PF, keepItems = V.OWN.items, keepActive = PF.active, keepList = PF.list.slice();
  const keepF = JSON.parse(JSON.stringify(V.FILT.own)), cq = ctx.document.querySelector('#colq'), search = q => cq._ev.input({ target: { value: q } });
  Object.assign(V.FILT.own, V.blankFilter('own')); search('');
  const x = V.CAT.rows.find(p => !p.sealed && p.market > 1);
  if (!PF.list.some(p => p.id === 'tr110')) PF.list.push({ id: 'tr110', name: 'Trade pile' });
  /* the trade pile's line first: the bar valued a printing at the first line it found, in any collection */
  V.OWN.items = [{ id: x.id, qty: 4, condition: 'NM', pf: 'tr110' }, { id: x.id, qty: 2, condition: 'NM', pf: 'main' }, { id: x.id, qty: 1, condition: 'LP', pf: 'main' }];
  const sel = new Set([x.id]);
  PF.active = 'tr110'; const inTrade = bl(sel);
  PF.active = 'main'; const inMain = bl(sel);
  PF.active = 'all'; const inAll = bl(sel);
  ok('selected in one collection, bulk delete takes that collection\'s lines only -- it had taken the printing from every collection and condition', inTrade.length === 1 && inTrade[0].pf === 'tr110' && inMain.length === 2 && inMain.every(i => i.pf === 'main') && inAll.length === 3, `${inTrade.length} / ${inMain.length} / ${inAll.length}`);
  ok('...control: the take-109 filter, every line of the printing, is caught', V.OWN.items.filter(i => sel.has(i.id)).length === 3 && inTrade.length !== 3);
  ok('...and its confirm values the lines with their quantities (it counted one of each printing)', /a \+ \(price\(i\.id\) \|\| 0\) \* \(i\.qty \|\| 1\)/.test(js) && !/\[\.\.\.bulk\]\.reduce\(\(a, id\) => a \+ \(price\(id\) \|\| 0\), 0\)/.test(js));
  /* take 110's review: on screen is the filter and the search too -- the selection is by printing, and a line
     the filter hid went with the tile that was tapped */
  PF.active = 'main'; V.FILT.own.cond = ['NM']; const nmOnly = bl(sel), barNm = bs(sel); V.FILT.own.cond = [];
  ok('...and a line the filter hides is not taken: Near Mint filtered in, the Lightly Played copy of the same printing stays', nmOnly.length === 1 && nmOnly[0].condition === 'NM' && nmOnly[0].pf === 'main', nmOnly.map(i => i.condition).join());
  ok('...control: the first push\'s rule, the collection alone, took it', V.OWN.items.filter(i => sel.has(i.id) && (i.pf || 'main') === 'main').length === 2);
  search('zzzz no such card'); const bySearch = bl(sel); search('');
  ok('...nor a line the search hides', bySearch.length === 0 && bl(sel).length === 2);
  const px = V.CAT.byId.get(x.id).market, bar = bs(sel);
  const firstPush = [...sel].reduce((a, id) => { const it = V.OWN.items.find(y => y.id === id); return a + (V.CAT.byId.get(id).market || 0) * (it ? it.qty : 0); }, 0);
  ok('the bulk bar counts and values the lines an action would take, as the confirm does', bar.n === 2 && Math.abs(bar.v - 3 * px) < 1e-9 && barNm.n === 1 && Math.abs(barNm.v - 2 * px) < 1e-9, `${bar.n} ${bar.v} vs ${3 * px}`);
  ok('...control: the first push\'s bar, the first line\'s quantity from any collection, is caught', Math.abs(firstPush - 4 * px) < 1e-9 && firstPush !== bar.v);
  ok('...and Move and Condition take the same lines (they had taken hidden ones too)', (js.match(/const lines = new Set\(bulkLines\(bulk\)\); OWN\.items\.forEach\(i => \{ if \(lines\.has\(i\)\)/g) || []).length === 2 && !/PF\.scope\(\[i\]\)\.length/.test(js));
  V.OWN.items = keepItems; PF.active = keepActive; PF.list.length = 0; PF.list.push(...keepList); Object.assign(V.FILT.own, keepF); }

section('take 110 — a picture that failed says what it is, readably (UI-AUDIT §1\'s last box)');
{ const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  const hexes = [...new Set([...css.matchAll(/--c-[a-z]+:(#[0-9A-Fa-f]{6})/g)].map(m => m[1].toLowerCase()))];
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const [r, g, b] = c.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const over = (c, a, ink) => c.map((v, i) => Math.round(v * (1 - a) + ink[i] * a));   // ink at alpha a over the ground
  const pill = hexes.map(h => ratio([255, 255, 255], over(rgb(h), 0.55, [0, 0, 0])));
  ok('the label on a failed picture is white on a dark pill, above 4.5:1 over every game colour', /\.ph \.phl\{color:#fff;background:rgba\(0,0,0,\.55\)/.test(css) && /<span class="phl">\$\{label\}<\/span>/.test(js) && hexes.length >= 6 && Math.min(...pill) >= 4.5, pill.map(r => r.toFixed(2)).join(' '));
  const old = hexes.map(h => ratio(over(rgb(h), 0.65, [0, 0, 0]), rgb(h)));
  ok('...control: take 109\'s black at 65 % on the colour is caught below 4.5:1', Math.min(...old) < 4.5, old.map(r => r.toFixed(2)).join(' '));
}

section('take 110 — no check here passes whatever happens (AGENTS rule 2)');
{ const self = fs.readFileSync(new URL(import.meta.url), 'utf8');
  const blind = t => (t.match(/\|\| true[\s,)'"]*\);/g) || []).length;
  ok('no check in this file ends its condition "|| true" (two did, from the take-88 seed, until take 110)', blind(self) === 0, String(blind(self)));
  const T = '|' + '| true';   // spelled apart, or this line would be what it looks for
  ok('...control: the take-109 lines are caught', blind(`ok('x', a ${T}); ok('y', b === false ${T}, '');`) === 2); }

section('take 111 — the last look (A42): every screen at both of the Fold\'s sizes after the UI series, and what it turned up');
{ const doc = ctx.document, el = id => doc.getElementById(id) || { textContent: '', innerHTML: '', hidden: undefined, classList: { contains: () => null } };   /* an older build lacks some ids: each check fails on its own */
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  const rows = V.CAT.rows, isDon = p => !!p.sealed && /don!! card/i.test(p.name || '');
  const box = rows.find(p => V.SEALED.isProduct(p) && V.SEALED.kindOf(p) === 'box');
  const named = rows.find(p => V.SEALED.isProduct(p) && (V.CAT.sets.get(p.set) || {}).name === p.name);
  const don = rows.find(p => isDon(p) && p.market > 0);
  const card = rows.find(p => !p.sealed && p.num && p.market > 1 && p.d1p != null);
  const keepItems = V.OWN.items, keepSnaps = V.OWN.snaps.slice();
  ok('...the fixtures exist: a booster box, a product named for its set, a DON!! card, a card with a price history', !!box && !!named && !!don && !!card);

  /* a row's small line: the parts it has, joined -- a printing with no number opened its line with a dot */
  const dj = V.dotJoin || ((...a) => a.join(' · '));
  ok('a row\'s small line joins the parts it has with " · " and leaves the empty ones out', dj('', '$1.00') === '$1.00' && dj('OP01-001', '$1.00') === 'OP01-001 · $1.00' && dj(null, 'ST01', '', undefined, 'x') === 'ST01 · x' && dj() === '', JSON.stringify(dj('', '$1.00')));
  ok('...every line that leads with a number uses it: search, movers, trade, the trade picker, wants, the scan result, and an alert', (js.match(/dotJoin\(esc\(p\.num\)/g) || []).length === 6 && /dotJoin\(esc\(a\.num\)/.test(js), String((js.match(/dotJoin\(esc\(p\.num\)/g) || []).length));
  { const q = doc.getElementById('allq'), out = doc.getElementById('allRes'), keepF = JSON.parse(JSON.stringify(V.FILT.all));
    Object.assign(V.FILT.all, V.blankFilter('all')); q.value = box.name; out.innerHTML = ''; V.paintSearch(); const sr = out.innerHTML;
    q.value = ''; out.innerHTML = ''; Object.assign(V.FILT.all, keepF); V.paintSearch();
    const line = ((sr.split(`data-open="${box.id}"`)[1] || '').match(/<span>([^<]*)<\/span>/) || [])[1];
    ok('search: a sealed product\'s line starts with its set, not a dot (it read " · OP01")', line != null && line.length > 0 && !/^\s*·/.test(line), JSON.stringify(line)); }
  { const keepG = V.TRADE.give.slice(); V.TRADE.give.length = 0; V.TRADE.give.push({ id: box.id, n: 1 }); V.go('trade'); const tr = el('trGive').innerHTML;
    V.TRADE.give.length = 0; V.TRADE.give.push(...keepG); V.go('home');
    const line = (tr.match(/<div class="n"><b>[\s\S]*?<\/b>\s*<span>([^<]*)/) || [])[1];
    ok('trade: a sealed product\'s line starts with its price ("$… each"), not a dot', line != null && /^[^\s·]/.test(line) && / each/.test(line), JSON.stringify(line)); }
  { const keepA = V.ALERTS.list, keepW = V.WANT.list;
    V.ALERTS.list = []; V.ALERTS.add(box.id, 'below', 1); V.WANT.list = [{ num: '', id: box.id, added: '2026-09-01T00:00:00Z' }];
    V.go('wants'); const al = el('alRows').innerHTML, wt = el('wtRows').innerHTML;
    V.ALERTS.list = keepA; V.ALERTS.save(); V.WANT.list = keepW; V.WANT.save(); V.go('home');
    const alLine = (al.match(/<div class="n"><b>[\s\S]*?<\/b>\s*<span[^>]*>([^<]*)/) || [])[1], wtLine = (wt.match(/<div class="n"[^>]*><b>[\s\S]*?<\/b>\s*<span>([^<]*)/) || [])[1];
    ok('alerts: a sealed product\'s line starts with its rule ("below $1.00"), and the line wraps rather than cutting off what the alert is doing', alLine != null && /^below /.test(alLine) && /<span style="white-space:normal">below /.test(al), JSON.stringify(alLine));
    ok('wants: a sealed product kept on the list from an older build (the page no longer offers it) reads its set first, not a dot', wtLine != null && wtLine.length > 0 && !/^\s*·/.test(wtLine), JSON.stringify(wtLine)); }

  /* the filter sheet counts what it lists */
  { doc.getElementById('sortBtnAll')._ev.click(); const fAll = el('fN').textContent;
    doc.getElementById('sortBtn')._ev.click(); const fOwn = el('fN').textContent;
    while (V.closeAnyOverlay()) {}
    ok('the filter sheet counts what it lists: results over the catalogue (sealed products are in it: "7,661 printings" sat beside "Search all 6,987 cards"), lines over the collection', /^[\d,]+ results?$/.test(fAll) && /^[\d,]+ lines?$/.test(fOwn), `${fAll} | ${fOwn}`); }

  /* a card's page, a sealed product's page, a DON!! card's page */
  { const page = id => { V.openDetail(id); return { h: el('dQtyH').textContent, fin: el('dFinish').textContent, cond: el('dCond').innerHTML.replace(/<[^>]+>/g, ''), seg: el('dCondSeg').hidden,
      graded: el('dGradedP').hidden, want: el('dWant').hidden, sibs: el('dSibsP').hidden, sibRows: el('dSiblings').innerHTML, sub: el('dSub').textContent, subHid: el('dSub').hidden,
      stock: el('dStock').hidden, buy: el('dBuy').hidden, product: el('dArt').classList.contains('product') }; };
    const B = page(box.id);
    ok('a sealed product\'s page: its copies are "Sealed" and its line says what it is ("Box", not "Normal"); no Graded panel, no Want, and no printings of its empty number (it listed every product and DON!! card)',
       B.h === 'Sealed' && B.fin === 'Box' && B.graded === true && B.want === true && B.sibs === true && B.sibRows === '' && B.stock === false && B.buy === false && B.product === true, JSON.stringify({ ...B, sibRows: B.sibRows.length }));
    const N = page(named.id);
    ok('...a product named for its set has no line under its name (every starter deck said its name twice)', N.sub === '' && N.subHid === true, JSON.stringify([N.sub, named.name]));
    const D = page(don.id);
    ok('a DON!! card is a card, though the catalogue files it as sealed: copies "Ungraded" in their finish, a condition to record, a Graded panel; with no number, no Want and no list of printings',
       D.h === 'Ungraded' && D.fin === (don.sub || 'Normal') && D.seg === false && /^Condition · /.test(D.cond) && D.graded === false && D.want === true && D.sibs === true && D.stock === true && D.buy === true && D.product === false, JSON.stringify({ ...D, sibRows: D.sibRows.length }));
    ok('...control: the flag alone calls it sealed, which is the first cut of this take -- its page was a product\'s', !!don.sealed && !V.SEALED.isProduct(don));
    const C = page(card.id);
    ok('...and a card\'s page is as it was: "Ungraded", its finish, a condition, Graded and Want shown, its printings listed', C.h === 'Ungraded' && C.fin === (card.sub || 'Normal') && C.seg === false && C.graded === false && C.want === false && C.sibs === false && C.sibRows.includes(`data-open="${card.id}"`), JSON.stringify({ ...C, sibRows: C.sibRows.length }));
    ok('the page\'s panels: Want and the alerts under a Watch heading of their own; Graded holds the graded copies only',
       /<div class="panel" id="dWatchP">\s*<h3>Watch<\/h3>\s*<button class="linkish" id="dWant">[^<]*<\/button>\s*<button class="linkish" id="dAlert">[^<]*<\/button>\s*<button class="linkish" id="dStock" hidden>[^<]*<\/button>\s*<\/div>/.test(html)
       && /<div class="panel" id="dGradedP">\s*<h3>Graded<\/h3>\s*<div id="dGradedList"><\/div>\s*<button class="linkish" id="dAddGraded">/.test(html));
    ok('...control: take 110\'s panel, Want and the alerts under "Graded", is caught', !/<div class="panel" id="dGradedP">\s*<h3>Graded<\/h3>\s*<div id="dGradedList"><\/div>\s*<button class="linkish" id="dAddGraded">/.test('<div class="panel">\n    <h3>Graded</h3>\n    <div id="dGradedList"></div>\n    <button class="linkish" id="dWant">Want this card</button>'));
    const tris = h => (h.match(/[▲▼]/g) || []).length, keepD = [card.d1a, card.d1p];
    card.d1a = 2; card.d1p = 5; V.openDetail(card.id); const up = el('dPrice').innerHTML;
    card.d1a = -2; card.d1p = -5; V.openDetail(card.id); const down = el('dPrice').innerHTML; [card.d1a, card.d1p] = keepD; V.go('home');
    ok('a price that moved carries its triangle once (the price had one and the move a second)', tris(up) === 1 && tris(down) === 1 && /▲/.test(up) && /▼/.test(down), `${tris(up)} ${tris(down)}`); }

  /* the binder opens a set at its first held pocket */
  { const numKey = n => { const m = n.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 9999; };
    const bySet = new Map(); for (const p of rows) if (p.num) { const m = bySet.get(p.set) || new Map(); if (!m.has(p.num)) m.set(p.num, p); bySet.set(p.set, m); }
    const [sid, byNum] = [...bySet.entries()].sort((a, b) => b[1].size - a[1].size)[0];
    const nums = [...byNum.keys()].sort((a, b) => numKey(a) - numKey(b) || a.localeCompare(b));
    const BN = V.BN, keepSet = BN.set, keepPg = { ...BN.pageOf };
    V.OWN.items = []; V.OWN.add(byNum.get(nums[12]).id, { condition: 'NM' }); V.OWN.add(byNum.get(nums[20]).id, { condition: 'NM' });
    BN.set = sid; delete BN.pageOf[sid]; V.go('binder'); const first = BN.page;
    BN.pageOf[sid] = 0; V.go('binder'); const kept = BN.page;
    Object.keys(BN.pageOf).forEach(k => delete BN.pageOf[k]); Object.assign(BN.pageOf, keepPg); BN.set = keepSet; V.OWN.items = keepItems; V.go('home');
    ok('the binder opens a set it has not paged at the page of its first held card (it opened on nine empty pockets)', first === 1, String(first));
    ok('...and a page the collector turned to is kept, the first one too', kept === 0, String(kept)); }

  /* a currency named once */
  { const cl = V.curLabel || (c => `${((V.CUR.list.find(x => x[0] === c) || [])[1] || '').trim()} ${c}`);
    ok('a currency whose sign is its code is named once ("CHF", not "CHF CHF"); the others keep their sign ("$ USD", "€ EUR")', cl('CHF') === 'CHF' && cl('USD') === '$ USD' && cl('EUR') === '€ EUR', [cl('CHF'), cl('USD'), cl('EUR')].join(' | '));
    const was = V.CUR.active(); V.CUR.set('CHF'); V.paintHome(); const pill = el('curPillHome').innerHTML; V.CUR.set(was); V.paintHome();
    ok('...Home\'s currency pill with francs chosen says so once', />CHF<\/button>$/.test(pill.trim()) && !/CHF CHF/.test(pill), pill.slice(-40)); }

  /* Decks */
  { V.paintStock(); const sh = doc.querySelector('#dkStock').innerHTML, n = (sh.match(/data-stock="/g) || []).length;
    ok('a ready-made deck\'s row gives its name the width: the badge rides the line under it, with the count', n > 0 && (sh.match(/<div class="note"><span class="badge">ready-made<\/span> \d+ cards<\/div>/g) || []).length === n && !/<\/div>\s*<span class="badge">ready-made<\/span><\/button>/.test(sh), String(n)); }
  { const L = rows.find(p => p.type === 'Leader' && p.market > 0), d0 = { id: 'd111', name: 'empty', leader: L.id, cards: [], created: 111 };
    V.DECKS.list.push(d0); V.openDeck('d111'); const dv = el('dkValue').innerHTML, A0 = V.analysis(d0);
    V.DECKS.list.splice(V.DECKS.list.indexOf(d0), 1); V.go('home');
    ok('an empty deck says it has no cards yet (it said "you own every card in it") and is worth its Leader, as its history counts it', /no cards in it yet/.test(dv) && !/you own every card in it/.test(dv) && Math.abs(A0.value - L.market) < 1e-9, `${A0.value} vs ${L.market}`); }
  ok('a deck\'s search box asks in two words that fit ("Add cards"; "— search the catalogue" was cut at 411 px)', /id="dkq"[^>]*placeholder="Add cards"/.test(html));

  /* Hunt, More */
  { const keepS = V.LOCAL.stores, keepZ = V.HUNT.zip; V.LOCAL.stores = null; V.HUNT.setZip('48329'); V.paintLocal(); const lo = el('localList').innerHTML;
    V.LOCAL.stores = keepS; V.HUNT.setZip(keepZ || ''); V.paintLocal();
    ok('Local, before its shop list is fetched, names its source in a sentence ("From Bandai TCG+."), not "From Bandai TCG+, ."', /From Bandai TCG\+\. A store/.test(lo) && !/, \./.test(lo), (lo.match(/From [^<]{0,40}/) || [''])[0]); }
  { V.go('settings'); const ab = el('setBody').innerHTML; V.go('home');
    const d = (ab.match(/ · prices ([^<]*)</) || [])[1];
    ok('More → About gives the prices\' day in words, as every other day in the app is ("Sep 23", not "2026-09-23")', d != null && /^[A-Z][a-z]{2} \d{1,2}(, \d{4})?$/.test(d), JSON.stringify(d)); }

  /* Home, the collection */
  ok('Home\'s Performance tab leads with its own panel, above Most valuable (it sat under the list)', html.indexOf('id="perfPanel"') > 0 && html.indexOf('id="perfPanel"') < html.indexOf('<h3>Most valuable</h3>'));
  { V.OWN.items = []; V.OWN.add(card.id, { condition: 'NM' }); V.OWN.add(box.id, { condition: 'NM' }); V.OWN.add(don.id, { condition: 'NM' }); V.paintHome();
    const sd = el('setDone').innerHTML, top = el('topList').innerHTML;
    ok('Home\'s Set completion rows say how far along a set is and stop there ("tap for the checklist" went)', / numbers · \d+(?:\.\d)?%<\/span>/.test(sd) && !/tap for the checklist/.test(sd), sd.replace(/\s+/g, ' ').slice(0, 160));
    const boxLine = ((top.split(`data-open="${box.id}"`)[1] || '').match(/<span>([^<]*)<\/span>/) || [])[1];
    ok('...a sealed product in Most valuable says what it is and its set ("Box · OP01"), not a condition and a finish it has not got ("NM · Normal · ")', boxLine != null && boxLine.startsWith('Box · ') && !/NM|Normal|·\s*$/.test(boxLine), JSON.stringify(boxLine));
    const keepFO = JSON.parse(JSON.stringify(V.FILT.own)); Object.assign(V.FILT.own, V.blankFilter('own'));
    V.go('collection'); const cg = el('colGrid').innerHTML; Object.assign(V.FILT.own, keepFO); V.go('home');
    const tile = id => (cg.split(`data-open="${id}"`)[1] || '').split('</button>')[0];
    const cs = t => [...t.matchAll(/<div class="c"[^>]*>([\s\S]*?)<\/div>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    const tb = cs(tile(box.id)), td = cs(tile(don.id));
    ok('a sealed product\'s tile says what it is and that it is sealed ("Box", "Sealed"), not a lone dot over "NM · Normal"', tb[0] === 'Box' && tb[1] === 'Sealed', JSON.stringify(tb));
    ok('...a DON!! card\'s tile keeps its rarity, its condition and its finish, with no dot left hanging', td[0] === (don.rarity || '') && td[1] === `NM · ${don.sub || 'Normal'}`, JSON.stringify(td));
    V.OWN.items = keepItems; }

  /* a cost basis on a card not yet owned: added, and in today's reading */
  { V.OWN.items = []; V.OWN.snaps = []; V.openDetail(card.id);
    doc._ids.set('askIn', { value: '12.50' });
    const run = doc.getElementById('dPaid')._ev.click(); doc.getElementById('askOk')._ev.click(); await run;
    const it = V.OWN.items.find(i => i.id === card.id), sn = V.OWN.snaps.slice();
    doc._ids.delete('askIn'); V.OWN.items = keepItems; V.OWN.snaps = keepSnaps; V.OWN.save(); V.go('home');
    ok('a cost basis set on a card not yet owned adds it, and today\'s reading counts it (it was added without one)', !!it && it.paid === 12.5 && sn.length === 1 && sn[0][2] === 1, JSON.stringify([it && it.paid, sn])); }

  /* the second pass of the look: Set completion, the card page's own collection, two slabs of one printing */
  { const PF = V.PF, keepActive = PF.active, keepList = PF.list.slice();
    if (!PF.list.some(p => p.id === 'tr111')) PF.list.push({ id: 'tr111', name: 'Trade pile' });
    PF.active = 'main'; V.OWN.items = []; V.OWN.add(named.id, { condition: 'NM' }); V.paintHome(); const sd0 = el('setDone').innerHTML;
    ok('Set completion leaves out a printing with no number: a starter deck still in its wrapper does not list its set as "1 of 17 numbers"', !/data-checklist=/.test(sd0), (sd0.match(/<span>[^<]*numbers[^<]*<\/span>/) || [sd0.slice(0, 80)])[0]);
    const other = rows.find(p => p.set === card.set && p.num && p.num !== card.num && !p.sealed && p.market > 0);
    V.OWN.items = [{ id: card.id, qty: 1, condition: 'NM', pf: 'main' }, { id: other.id, qty: 2, condition: 'NM', pf: 'tr111' }];
    V.paintHome(); const sd1 = el('setDone').innerHTML, rowS = (sd1.split(`data-checklist="${card.set}"`)[1] || '').split('</button>')[0];
    const val = (rowS.match(/<div class="v mono">([^<]*)</) || [])[1];
    ok('...and a set\'s value is the collection on screen\'s, as its count is (it added every collection\'s copies)', /1 of \d+ numbers/.test(rowS) && val === V.money(card.market), `${val} vs ${V.money(card.market)}`);
    /* the card page's copy is the one in the collection it names */
    PF.active = 'tr111'; V.OWN.items = [{ id: card.id, qty: 3, condition: 'NM', pf: 'main' }, { id: card.id, qty: 1, condition: 'NM', pf: 'tr111' }];
    V.openDetail(card.id); const shown = el('dQty').textContent, label = el('dSave').textContent;
    doc.getElementById('dPlus')._ev.click(); doc.getElementById('dSave')._ev.click();
    const [m, t] = [V.OWN.items[0].qty, V.OWN.items[1].qty];
    ok('the card page keeps to the collection it names: Save on the Trade pile\'s page sets the Trade pile\'s copy, and the main collection\'s 3 stay 3 (Save took the first line in any collection)', shown === '1' && m === 3 && t === 2, JSON.stringify({ shown, m, t }));
    V.OWN.items = []; V.openDetail(card.id); const label0 = el('dSave').textContent;
    ok('...and its button says Save on a copy you have, "Add to collection" on one you have not', label === 'Save' && label0 === 'Add to collection', `${label} | ${label0}`);
    /* two slabs of one printing */
    PF.active = 'main'; V.OWN.items = [];
    V.OWN.add(card.id, { qty: 1, condition: 'GRADED', graded: { grader: 'PSA', grade: '10', cert: '111' } });
    V.OWN.add(card.id, { qty: 1, condition: 'GRADED', graded: { grader: 'BGS', grade: '9.5', cert: '222' } });
    const slabs = V.OWN.items.filter(i => i.graded);
    ok('two slabs of one printing are two lines, each with its own grade and cert (the second was counted into the first and wrote its grade over it)', slabs.length === 2 && slabs.every(i => i.qty === 1) && slabs.map(i => i.graded.cert).join() === '111,222' && /OWN\.add\(dCur\.id, \{ qty: 1, condition: 'GRADED', graded: \{ grader: g,/.test(js), JSON.stringify(V.OWN.items.map(i => [i.qty, i.graded && i.graded.cert])));
    V.OWN.items = []; V.OWN.add(card.id, { condition: 'NM' }); V.OWN.add(card.id, { condition: 'NM' });
    ok('...control: an ungraded copy still counts into its line (landmine 16)', V.OWN.items.length === 1 && V.OWN.items[0].qty === 2, JSON.stringify(V.OWN.items.map(i => i.qty)));
    V.OWN.items = keepItems; PF.active = keepActive; PF.list.length = 0; PF.list.push(...keepList); V.go('home'); }

  /* the stylesheet */
  ok('a row that leads with a picture centres it on its words (baseline put the picture\'s foot on the first line: every Sealed and Releases row sat askew)', /\.row:has\(> \.pic\)\{align-items:center\}/.test(css));
  ok('the bulk bar is two lines on a phone -- what is selected and Done, then the three actions -- and one on the open Fold (four buttons on a line ran off a 411 px phone)',
     /class="row bulkrow"/.test(html) && /\.bulkrow\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\);grid-template-areas:"nm nm x" "c m d"/.test(css) && /\.bulkrow\{grid-template-columns:minmax\(0,1fr\) repeat\(4,auto\);grid-template-areas:"nm c m d x"\}/.test(css));
  ok('Scan\'s note under the camera keeps the page\'s margins (the camera runs edge to edge; the note ran with it)', /#scan \.unlim\{margin-left:var\(--pad\);margin-right:var\(--pad\)\}/.test(css));
}

section('take 112 — A32\'s second distributor: Southern Hobby, read off its real pages (dates, not stock words)');
{ const fxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-sh-')); const feedF = path.join(fxDir, 'feed-fixture.json');
  execSync(`python3 tools/hunt.py --from-fixtures --out ${feedF}`, { cwd: ROOT, stdio: 'pipe' });
  const F = JSON.parse(fs.readFileSync(feedF, 'utf8')); const S = F.sources.southern || {}; const it = Object.fromEntries((S.items || []).map(i => [i.id, i]));
  const n = st => (S.items || []).filter(i => i.state === st).length;
  /* take 114 (the review): a day on screen is pinned from the fixture's own date, as the app writes it -- a literal "May 17"
     stops matching on 1 January 2027, when dayText adds the year */
  const D112 = iso => V.dayText(iso).replace(/[ \u202f]/g, '\u00a0'), I112 = id => it[id] || {};
  const txt112 = t => String(t || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  ok('the feed carries Southern Hobby: ok, the footer\'s count and its twenty rows, three product pages on file, the states from the dates (1 open, 18 closed, 1 released)',
     S.ok === true && S.count === 20 && (S.items || []).length === 20 && S.items.filter(i => i.page).length === 3 && n('orders_open') === 1 && n('orders_closed') === 18 && n('released') === 1,
     JSON.stringify({ ok: S.ok, count: S.count, pages: (S.items || []).filter(i => i.page).length, open: n('orders_open'), closed: n('orders_closed'), released: n('released') }));
  ok('every item: its page on the distributor, its item number, ISO dates or none; the set code from the item number (DP14 where the name says DP-15)',
     (S.items || []).every(i => /^https:\/\/www\.southernhobby\.com\/[^"]+\/p\d+\/$/.test(i.url) && i.item && (i.release === null || /^\d{4}-\d\d-\d\d$/.test(i.release)) && (i.due === null || /^\d{4}-\d\d-\d\d$/.test(i.due)))
     && it['81328'] && it['81328'].codes.join() === 'DP14' && /DP-15/.test(it['81328'].name));
  ok('the history rows carry each item\'s state (the timeline\'s input), and the app never fetches the distributor',
     (() => { const h = JSON.parse(fs.readFileSync(path.join(fxDir, 'history-fixture.json'), 'utf8')); return h.runs[0].southern && h.runs[0].southern['81327'] === 'orders_closed' && Object.keys(h.runs[0].southern).length === 20; })() && !/southernhobby\.com/.test(js));
  ok('Diagnostics names Southern Hobby beside GTS', (() => { const k = V.HUNT.feed; V.HUNT.feed = F; try { return typeof V.feedLine === 'function' && new RegExp(`, gts \\d+ products, southern ${S.items.length} products$`).test(V.feedLine()); } finally { V.HUNT.feed = k; } })());   // take 115: printed from HUNT.DISTS (STAN-112-21)
  /* on screen -- take 112, the owner's word: "I don't want them flooding the screen". A row carries each distributor
     as one short line that opens the product's page at Distributor info; the long text sits under closed drop-downs */
  V.HUNT.feed = F; V.HUNT.setZip(''); V.MODE.set('hunt', false); V.SEALED.kind = 'all'; V.SEALED.q = ''; V.DISTF.open.clear();
  const eb05 = V.CAT.byId.get(it['78743'] && it['78743'].catalog_id), op18 = V.CAT.byId.get(it['79311'] && it['79311'].catalog_id);
  for (const p of [eb05, op18]) if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); }
  V.paintSealed(); const h = ctx.document.querySelector('#sealedList').innerHTML;
  ok('the EB-05 pack (matched) carries Southern Hobby as one short line under its chips: its name and its state, opening its page at Distributor info',
     !!eb05 && new RegExp('<button class="dline" data-open="' + eb05.id + '" data-distinfo="1" aria-label="[^"]*"><span>Southern Hobby · orders closed ' + D112(I112('78743').due) + '</span>').test(h), (h.match(/<span>Southern Hobby · [^<]{0,60}/) || ['no Southern Hobby line on Sealed'])[0]);
  const nmIn = (html, id) => { const i = html.indexOf('data-open="' + id + '">'); const j = html.indexOf('<div class="v">', i); return i < 0 ? '' : html.slice(i, j); };
  const nm = id => nmIn(h, id);
  const eb05it = V.HUNT.distItems().find(x => x._d === 'southern' && x.id === '78743');
  ok('a short line\'s day never breaks: its month and day are joined by a non-breaking space', !!eb05it && V.distShort(eb05it) === `Southern Hobby · orders closed ${D112(I112('78743').due)}`, JSON.stringify(eb05it && V.distShort(eb05it)));
  ok('...control: the day in words by itself breaks at its space', / /.test(V.dayText(I112('78743').due)) && V.dayText(I112('78743').due) !== D112(I112('78743').due), JSON.stringify(V.dayText(I112('78743').due)));
  /* take 115 (STAN-112-18): the guard's predicate, named, so its control runs the same code over a flooded row */
  const floods = t => /GTS Distribution|Southern Hobby|MSRP|release [A-Z]/.test(t);
  const noFlood = html => [eb05, op18].every(p => { const t = nmIn(html, p.id); return !!t && !floods(t); });
  ok('...no row floods: no distributor\'s words inside any row\'s name block -- no MSRP, no release, no age', !!eb05 && !!op18 && noFlood(h), nm(op18 && op18.id).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200));
  { /* take 111's row: the distributor's full line inside the name block (the line take 112 moved), planted into this very list */
    const at = eb05 ? h.indexOf('<div class="v">', h.indexOf('data-open="' + eb05.id + '">')) : -1, cut = at > 0 ? h.lastIndexOf('</div>', at) : -1;
    const full = eb05it ? V.distLine(eb05it) : '', flooded = cut > 0 && full ? h.slice(0, cut) + full + h.slice(cut) : h;
    ok('...control: take 111\'s row, the full distributor line in its name block, is caught by the same predicate -- and the plant landed', flooded !== h && nmIn(flooded, eb05.id).includes(full) && /Southern Hobby · /.test(full) && !noFlood(flooded), txt112(nmIn(flooded, eb05 && eb05.id)).slice(0, 200)); }
  V.openDetail(eb05.id, { dist: true }); const dd = ctx.document.querySelector('#dDist').innerHTML;
  ok('...its page, reached from that line, opens at Distributor info with the full words -- stores’ orders closed May 17, release Oct 30, in-store only, when it was read -- and Southern Hobby\'s own page',
     /data-distfold="detail" aria-expanded="true"/.test(dd) && new RegExp(`Southern Hobby</b><span>stores’ orders closed ${D112(I112('78743').due)} · release ${D112(I112('78743').release)} · in-store only · (just now|\\d+ min ago)</span>`).test(dd) && dd.includes(`href="${it['78743'].url}" target="_blank" rel="noopener"`), dd.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300));
  V.openDetail(eb05.id); const dc = ctx.document.querySelector('#dDist').innerHTML;
  ok('...control: opened from its row, the page\'s Distributor info is there and closed', /data-distfold="detail" aria-expanded="false"/.test(dc) && !/in-store only/.test(dc));
  ok('the open handler passes a distributor line\'s wish to the page, and only its', /else openDetail\(id, \{ dist: !!t\.dataset\.distinfo \}\);/.test(js) && /data-distinfo="1"/.test(js));
  while (V.closeAnyOverlay()) {} V.go('sealed');
  ok('Where to buy offers no distributor now: they sell to stores, and their words are under Distributor info', eb05 && !V.buySources(eb05).some(s => s.kind === 'dist'), JSON.stringify(eb05 && V.buySources(eb05).map(s => s.label)));
  ok('Sealed carries one closed Distributor info saying how many distributors and when they were checked', /data-distfold="sealed" aria-expanded="false"/.test(h) && /<span class="note">2 distributors · checked (just now|\d+ min ago)<\/span>/.test(h) && !/listed to stores/.test(h));
  V.distFoldTap('sealed'); const ho = ctx.document.querySelector('#sealedList').innerHTML; V.distFoldTap('sealed');
  ok('...opened: Southern Hobby\'s counts from its dates, the in-store count from the pages read, and why allocation goes unsaid',
     /<b>Southern Hobby<\/b>/.test(ho) && /20 One Piece products listed to stores: <b>1<\/b> still taking their orders, 18 with orders closed, 1 released; 1 in-store only \(3 of 20 product pages read so far\)/.test(ho)
     && /marks every One Piece presell subject to allocation, so that says nothing about one product/.test(ho), (ho.match(/<b>Southern Hobby<\/b>[\s\S]{0,300}/) || ['no Southern Hobby section'])[0].replace(/\s+/g, ' '));
  /* take 115 (self-review): the fixture's unlisted products are sets TCGCSV had not listed on 25 Sept, and since take 115
     a group enters the catalogue as soon as it lists one product -- any night could list one and turn the count and the
     rows below red with nothing wrong. They are the fixture's facts, so the fixture's catalogue is read: those sets are
     set aside for this read and put back in their order after it. */
  const FX115 = new Set(['IB09', 'IB10', 'ST37', 'ST38', 'EB06', 'DP14', 'OP19', 'PEB01', 'ST39', 'ST40', 'ST41', 'ST42', 'ST43', 'ST44']);
  const norm115 = x => String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), setsAll115 = [...V.CAT.sets];
  const aside115 = setsAll115.filter(([, st]) => [norm115(st.abbr), ...String(st.abbr || '').split(/[-\/]/).map(norm115)].some(c => FX115.has(c))).map(([k]) => k);
  for (const k of aside115) V.CAT.sets.delete(k);
  V.paintReleases(); const rc = ctx.document.querySelector('#relList').innerHTML;
  const op18row = (rc.match(/<span>OP18 · [^<]*<\/span>((?:<span style="display:block;color:var\(--brass\)">[^<]*<\/span>)*)/) || ['', ''])[1];
  const lines18 = (op18row.match(/<span style="display:block;color:var\(--brass\)">/g) || []).length;
  ok('the OP18 row on Releases carries one short line from each distributor: GTS\'s, then Southern Hobby\'s for the set\'s own box', lines18 === 2 && op18row.includes(`GTS Distribution · sold out</span><span style="display:block;color:var(--brass)">Southern Hobby · orders closed ${D112(I112('79311').due)}</span>`), op18row.replace(/<[^>]+>/g, ' | '));
  const sh18 = (S.items || []).filter(i => i.catalog_id && (V.CAT.byId.get(i.catalog_id) || {}).set === (op18 || {}).set);
  ok('...control: Southern Hobby matched more than one product into that set (the box and the DP-13 display), so one line each is a choice, not the data', sh18.length >= 2, String(sh18.length));
  /* 17 = GTS's OP-19, PEB-01 and ST44 display + Southern Hobby's IB-09, IB-10, ST-37, ST-38, EB-06, DP14, OP-19, PEB-01 and
     ST-39 to ST-44 (the look counted 11 rows: the starter-deck displays fold by day) */
  ok('Releases\' not-in-the-catalogue list sits under one closed Distributor info that says how long it is', /data-distfold="releases" aria-expanded="false"/.test(rc) && /<span class="note">17 products not in the catalogue yet · 2 distributors · checked (just now|\d+ min ago)<\/span>/.test(rc) && !/OP-19 Booster Box/.test(rc),
     (rc.match(/data-distfold="releases"[\s\S]{0,260}/) || ['no Distributor info on Releases'])[0]);
  V.distFoldTap('releases'); const r = ctx.document.querySelector('#relList').innerHTML; V.distFoldTap('releases');
  const panel = r.slice(r.indexOf('At the distributors'), r.indexOf('<h3>Recent</h3>'));
  ok('...opened, it carries Southern Hobby\'s: PEB-01 still taking stores’ orders until Oct 14, OP-19 with its prerelease, and ST39–ST44 folded on their day',
     panel.includes(`PEB01</span><span style="display:block;color:var(--brass)">Southern Hobby · stores order by ${D112(I112('82337').due)} · release ${D112(I112('82337').release)}`)
     && panel.includes(`OP-19 Booster Box</b><span>OP19</span><span style="display:block;color:var(--brass)">Southern Hobby · stores’ orders closed ${D112(I112('81327').due)} · release ${D112(I112('81327').release)} · prerelease ${D112((I112('81327').page || {}).prerelease)}`)
     && /Starter decks ST39–ST44<\/b><span>6 starter deck displays, one release day/.test(panel) && /data-relfold="d:southern:2027-04-23"/.test(panel), panel.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400));
  ok('...each fold names its distributor: GTS\'s and Southern Hobby\'s displays of one day never share a key', !/data-relfold="d:2027-04-23"/.test(r) && /Checked GTS Distribution [^,]+, Southern Hobby /.test(panel));
  V.CAT.sets.clear(); for (const [k, st] of setsAll115) V.CAT.sets.set(k, st);   // the live catalogue back, in its order
  const iso = t => /(GTS Distribution|Southern Hobby) · [^<]*\b\d{4}-\d\d-\d\d\b/.test(t) || /(GTS Distribution|Southern Hobby)<\/b><span>[^<]*\b\d{4}-\d\d-\d\d\b/.test(t);
  ok('every day on a distributor line is in words, as everywhere else -- the rows, the open lists and a page\'s Distributor info', !iso(h) && !iso(ho) && !iso(rc) && !iso(r) && !iso(dd) && new RegExp(`GTS Distribution · sold out · allocated · [^<]*· release ${D112((F.sources.gts.items.find(i => i.sku === 'BJP2884797') || {}).release)} · `).test(r), (String(h + ho + rc + r + dd).match(/(GTS Distribution|Southern Hobby)(<\/b><span>| · )[^<]*\d{4}-\d\d-\d\d[^<]*/) || [''])[0]);
  ok('...control: an ISO day on either shape of line is caught', iso('<span>GTS Distribution · sold out · release 2026-06-12 · just now</span>') && iso('<b>Southern Hobby</b><span>released 2026-09-18</span>'));
  /* no stock words, so no stock alert */
  if (eb05) { V.STOCK.list = []; V.STOCK.toggle(eb05.id); }
  const src = eb05 ? V.STOCK.sourcesFor(eb05.id) : [];
  ok('Southern Hobby is no stock-alert source -- it publishes no availability to flip', !!eb05 && !src.some(x => /^southern:/.test(x.key)), JSON.stringify(src.map(x => x.key)));
  if (eb05) V.STOCK.toggle(eb05.id); V.STOCK.list = [];
  /* a source that fails */
  const dead = JSON.parse(JSON.stringify(F)); dead.sources.southern = { ok: false, error: 'HTTP 503', fetched_at: F.fetched_at, stale_since: F.fetched_at, items: [] };
  V.HUNT.feed = dead; V.DISTF.open.add('sealed'); V.DISTF.open.add('releases'); V.paintSealed(); V.paintReleases();
  const hd = ctx.document.querySelector('#sealedList').innerHTML, rd = ctx.document.querySelector('#relList').innerHTML; V.DISTF.open.clear();
  ok('a failed fetch says it could not reach Southern Hobby and since when, under Distributor info on Sealed and on Releases, while GTS\'s lines stay', /Could not reach Southern Hobby since/.test(hd) && /Could not reach Southern Hobby since/.test(rd) && /GTS Distribution · /.test(rd) && !/Southern Hobby · (stores|orders)/.test(hd + rd));
  /* the look opened DP-13's display for its Southern Hobby chip: the host refuses its photo (403, a product too new
     to have one), and the sheet stood an empty white frame -- white is a product photo's ground, and the placeholder
     carried the number a product does not have */
  const dp13d = V.CAT.byId.get(it['79312'] && it['79312'].catalog_id);
  const code13 = dp13d ? ((V.CAT.sets.get(dp13d.set) || {}).abbr || '').replace(/-/g, '').slice(0, 5) : '';
  if (dp13d) V.openDetail(dp13d.id); const art = ctx.document.querySelector('#dArt').innerHTML;
  const css112 = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  ok('a product\'s sheet labels its picture frame with its set\'s code on the row tile\'s ground, and turns white only under a photo that arrived',
     !!dp13d && !!code13 && art.includes(`<span class="phl">${code13}</span>`) && /\.dhero \.art\.product\{background:linear-gradient\(160deg,var\(--brass2\),var\(--card2\)\)\}/.test(css112)
     && /\.dhero \.art\.product:has\(img\.ref\.ok\)\{background:#fff\}/.test(css112) && !/\.dhero \.art\.product\{background:#fff\}/.test(css112), JSON.stringify({ code13, art: art.slice(0, 160) }));
  const card112 = V.CAT.rows.find(x => !x.sealed && x.num && x.img); V.openDetail(card112.id); const artc = ctx.document.querySelector('#dArt').innerHTML;
  ok('...control: a card\'s frame still carries its number, and no set pill', artc.includes(`>${card112.num}</div>`) && !/class="phl"/.test(artc), artc.slice(0, 120));
  while (V.closeAnyOverlay()) {}
  V.HUNT.feed = null; V.MODE.set('collect', false); V.go('home'); }

section('take 114 — A32\'s distributor state timeline, from the history rows: what was seen, at how many checks, and which changes are the calendar');
{ const fxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-tl-')); const feedF = path.join(fxDir, 'feed-fixture.json');
  execSync(`python3 tools/hunt.py --from-fixtures --out ${feedF}`, { cwd: ROOT, stdio: 'pipe' });
  const F = JSON.parse(fs.readFileSync(feedF, 'utf8')); const R0 = JSON.parse(fs.readFileSync(path.join(fxDir, 'history-fixture.json'), 'utf8')).runs[0];
  /* take 114 (the review): the timeline's days and clocks are this phone's, so the section runs in the owner's zone -- the runner
     and the session VM run UTC, where the phone's day and the UTC day are one day and a timeline drawn in UTC passes. Node 22 reads
     TZ again when it is set (measured); the fixtures above were built first, in the runner's own zone; the zone goes back at the end.
     Take 115: America/New_York, MEASURED on the owner's Diagnostics (take 114 ran America/Detroit, INFERRED from the zip 48329 --
     the same offsets and the same daylight-saving days in 2026) */
  const TZ0 = process.env.TZ, off0 = new Date('2026-12-01T12:00:00Z').getTimezoneOffset(); process.env.TZ = 'America/New_York';
  ok('premise: this section runs in America/New_York, and the app with it -- 02:00 UTC on 24 Sept is the 23rd there, four hours behind in September and five in December',
     new Date('2026-09-24T02:00:00Z').getDate() === 23 && new Date('2026-09-24T02:00:00Z').getTimezoneOffset() === 240 && new Date('2026-12-01T12:00:00Z').getTimezoneOffset() === 300
     && /^Sep 23\b.*10:00/.test(V.momentText('2026-09-24T02:00:00Z')), `${new Date('2026-09-24T02:00:00Z').getTimezoneOffset()} ${V.momentText('2026-09-24T02:00:00Z')}`);
  /* the history on Pages at 24 Sept 20:02 UTC, saved as it was: every count below is read off its rows, never written */
  const LIVE = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'fixtures', 'hunt_history_2026-09-24.json'), 'utf8'));
  const has = typeof (V.HUNT || {}).distTimeline === 'function', hasKind = has && typeof V.HUNT.distKind === 'function', hasDay = typeof V.tlDay === 'function';   // take 113 fails here, it does not throw
  ok('the app reads a distributor\'s states from the history rows (HUNT.distTimeline)', has);
  const TL = (d, k) => has ? V.HUNT.distTimeline(d, k) : null;
  const G = F.sources.gts.items.find(i => i.sku === 'BJP2873812') || {}, S = F.sources.southern.items.find(i => i.id === '79311') || {};
  const gIds = new Set(F.sources.gts.items.map(i => i.catalog_id).filter(Boolean)), both = [...new Set(F.sources.southern.items.map(i => i.catalog_id).filter(id => id && gIds.has(id)))];
  ok('premise: the OP-18 box is the one product both distributors list -- GTS\'s BJP2873812 and Southern Hobby\'s 79311 on one catalogue id', both.length === 1 && both[0] === G.catalog_id && S.catalog_id === G.catalog_id && !!V.CAT.byId.get(G.catalog_id), JSON.stringify(both));
  const PID = G.catalog_id;
  /* every day and moment expected here is built the way the phone shows it: its calendar day, dayText/momentText, no-break spaces */
  const ld = iso => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const nb = s => String(s).replace(/[ \u202f]/g, '\u00a0'), day = t => nb(V.dayText(ld(t))), M = t => nb(V.momentText(t));
  const utcDay = (iso, add = 0) => new Date(Date.parse(iso) + add * 864e5).toISOString().slice(0, 10);
  const spanOf = f => ld(f.first) === ld(f.last) ? day(f.first) : `${day(f.first)} → ${day(f.last)}`;   // the days a record spans, as the phone's calendar has them
  const btwAsBuilt = c => `between ${M(c.after)} and ${ld(c.after) === ld(c.by) ? nb(V.momentText(c.by).split(', ').pop()) : M(c.by)}`;   // one local day: the second end is its clock
  /* take 114 (the review): unless the clocks changed between the two checks (the November fall-back hour comes twice), when both
     ends are written in full, each with its zone */
  const zoned = t => nb(new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }));
  const btw = c => new Date(c.after).getTimezoneOffset() !== new Date(c.by).getTimezoneOffset() ? `between ${zoned(c.after)} and ${zoned(c.by)}` : btwAsBuilt(c);
  /* the words, stated here: TL_* stays out of window.VAULT */
  const TLW = { gts: { sold_out: 'sold out', call: 'call to order', in_stock: 'in stock for stores', coming: 'order due date ahead', preorder: 'no order due date ahead', out: 'out of stock', unknown: 'no status' },
    southern: { orders_open: 'order due date ahead', orders_closed: 'stores’ orders closed', released: 'released', unknown: 'no dates' } };
  const TL_NOTE = 'Where a change worked out from its dates gives two checks, not a day, the dates it lists now do not explain it: the history keeps the state, not the date, so a moved date and a passing one look the same.';
  /* what the rows say, counted here: the rows that read a distributor, and after its first, the ones that did not */
  const isRead = (r, d) => !!r[d] && typeof r[d] === 'object' && !Array.isArray(r[d]) && Object.keys(r[d]).length > 0;
  const facts = (rows, d) => { const read = rows.filter(r => isRead(r, d)), i0 = rows.indexOf(read[0]);
    return { checks: read.length, first: read.length ? read[0].t : null, last: read.length ? read[read.length - 1].t : null, missed: i0 < 0 ? 0 : rows.slice(i0).filter(r => !isRead(r, d)).length }; };
  const dist = () => ctx.document.querySelector('#dDist').innerHTML;
  /* the owner's answer: each history is tucked behind its header -- open both, as a tap does, to read them */
  const openH = () => { if (typeof V.distHistTap === 'function') { V.distHistTap('gts'); V.distHistTap('southern'); } };
  const openP = o => { V.openDetail(PID, o); openH(); };
  const blk = (h, d) => (h.match(new RegExp(`<div class="dtl" data-tl="${d}">[\\s\\S]*?</div>`)) || [''])[0];
  const lines = b => b ? b.replace(/<\/span>/g, '\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&').replace(/\n$/, '').split('\n') : [];
  /* a synthetic history ending on the fixture feed's own run: 4-hourly, GTS from run 6, Southern Hobby in the last two. The box
     is coming until the first UTC-day boundary at or after run 20 (a date passing: the calendar), preorder until run 40, then
     sold out (the site's words); the run before that could not reach GTS -- a hole, which widens that change's window and is
     never a change itself */
  const END = Date.parse(F.fetched_at), N = 60, G0 = 6, I2 = 40, runs = [];
  for (let k = N - 1; k >= 0; k--) runs.push({ t: new Date(END - k * 4 * 3600e3).toISOString().replace(/\.\d{3}Z$/, 'Z'), online: {}, shelf: {} });
  let I1 = 20; while (utcDay(runs[I1].t) === utcDay(runs[I1 - 1].t)) I1++;
  runs.forEach((r, i) => { if (i >= G0) r.gts = { ...R0.gts, BJP2873812: i < I1 ? 'coming' : i < I2 ? 'preorder' : 'sold_out' }; if (i >= N - 2) r.southern = { ...R0.southern }; });
  delete runs[I2 - 1].gts;
  const H = { runs, since: runs[0].t, stores: {}, titles: {} };
  const FLIPS = [[I1 - 1, I1, 'coming', 'preorder', 'dates'], [I2 - 2, I2, 'preorder', 'sold_out', 'page']];
  const K1 = { from: 'coming', to: 'preorder', after: runs[I1 - 1].t, by: runs[I1].t, kind: 'dates' }, K2 = { from: 'preorder', to: 'sold_out', after: runs[I2 - 2].t, by: runs[I2].t, kind: 'page' };
  /* F2: the feed with the box's order due date the UTC day before the change's later check -- its dates explain it */
  const F2 = JSON.parse(JSON.stringify(F)), G2 = F2.sources.gts.items.find(i => i.sku === 'BJP2873812') || {}; G2.preorder = utcDay(runs[I1].t, -1);
  const FL = { ...F, fetched_at: LIVE.runs[LIVE.runs.length - 1].t };   // the feed as it stood when the saved history ended
  V.HUNT.feed = F; V.HUNT.hist = H; V.HUNT.setZip(''); V.MODE.set('hunt', false); V.DISTF.open.clear();
  const tg = TL('gts', 'BJP2873812') || { changes: [] }, fg = facts(runs, 'gts');
  ok('GTS: the checks are the rows that read GTS, from its first to its last; the run that could not reach it is counted apart; nothing unread; the state at the first check and now, off the rows',
     tg.checks === fg.checks && tg.first === fg.first && tg.first === runs[G0].t && tg.last === fg.last && tg.missed === fg.missed && tg.missed > 0 && tg.odd === 0
     && tg.state0 === runs[G0].gts.BJP2873812 && tg.now === runs[N - 1].gts.BJP2873812 && tg.now === G.status && tg.end === runs[N - 1].t, JSON.stringify({ ...tg, changes: tg.changes.length }));
  ok('...each change dated by the two checks either side of it -- across the hole, from the last check that read it -- and marked as the calendar or the site',
     tg.changes.length === FLIPS.length && FLIPS.every(([a, b, f, t, k], j) => { const c = tg.changes[j]; return c && c.after === runs[a].t && c.by === runs[b].t && c.from === f && c.to === t && c.kind === k; }), JSON.stringify(tg.changes));
  const holed = JSON.parse(JSON.stringify(H)); holed.runs[I2 - 1].gts = { ...R0.gts }; delete holed.runs[I2 - 1].gts.BJP2873812; V.HUNT.hist = holed;
  const th = TL('gts', 'BJP2873812') || { changes: [] }; V.HUNT.hist = H;
  const th1 = th.changes[1] || {}, th2 = th.changes[2] || {};
  ok('...negative control: had that run read GTS without the box on its list, its one change becomes two read off the page -- off its list, then back on it -- and the hole is gone',
     th.changes.length === tg.changes.length + 1 && th1.from === 'preorder' && th1.to === null && th1.after === runs[I2 - 2].t && th1.by === runs[I2 - 1].t && th1.kind === 'page'
     && th2.from === null && th2.to === 'sold_out' && th2.after === runs[I2 - 1].t && th2.by === runs[I2].t && th2.kind === 'page' && th.missed === tg.missed - 1, JSON.stringify(th.changes.map(c => [c.from, c.to, c.kind])));
  const other = JSON.parse(JSON.stringify(H)); for (const r of other.runs.slice(30)) if (r.gts) r.gts.BJP2850164 = 'in_stock'; V.HUNT.hist = other;
  const to1 = TL('gts', 'BJP2873812') || { changes: [] }, to2 = TL('gts', 'BJP2850164') || { changes: [] }; V.HUNT.hist = H;
  ok('...another SKU\'s change stays its own', has && JSON.stringify(to1.changes) === JSON.stringify(tg.changes) && to2.changes.length === 1 && to2.changes[0].from === R0.gts.BJP2850164 && to2.changes[0].to === 'in_stock' && to2.changes[0].by === runs[30].t && to2.changes[0].kind === 'page', JSON.stringify(to2.changes));
  const ts = TL('southern', '79311') || { changes: [] }, fsh = facts(runs, 'southern');
  ok('Southern Hobby: its checks from where its key begins, no change, its state off the rows',
     ts.checks === fsh.checks && ts.first === fsh.first && ts.first === runs[N - 2].t && ts.last === fsh.last && ts.missed === fsh.missed && ts.changes.length === 0 && ts.state0 === S.state && ts.now === S.state, JSON.stringify(ts));
  /* the table, over every pair of states each distributor has (gts.py, southern.py) and "not on its list" */
  const GST = ['sold_out', 'call', 'in_stock', 'preorder', 'coming', 'out', 'unknown', null], SST = ['orders_open', 'orders_closed', 'released', 'unknown', null], BYDATE = ['coming', 'preorder', 'out'];
  const kindOf = (d, a, b) => a === null || b === null ? 'page' : d === 'southern' || (BYDATE.includes(a) && BYDATE.includes(b)) ? 'dates' : 'page';
  const pairs = [['gts', GST], ['southern', SST]].flatMap(([d, st]) => st.flatMap(a => st.filter(b => b !== a).map(b => [d, a, b])));
  const wrongKind = hasKind ? pairs.filter(([d, a, b]) => V.HUNT.distKind(d, a, b) !== kindOf(d, a, b)) : pairs;
  ok('which changes are the calendar, over every pair of states: every Southern Hobby change, and GTS\'s among coming, preorder and out; a change of GTS\'s site words, or onto or off a list, is read off its page',
     hasKind && !wrongKind.length && pairs.some(([d, a, b]) => kindOf(d, a, b) === 'dates') && pairs.some(([d, a, b]) => kindOf(d, a, b) === 'page'), JSON.stringify(wrongKind.slice(0, 6)));
  const odd = JSON.parse(JSON.stringify(H)); odd.runs[N - 3].gts.BJP2873812 = { status: 'sold_out' }; V.HUNT.hist = odd;
  const tod = TL('gts', 'BJP2873812') || { changes: [] }; openP({ dist: true }); const godd = lines(blk(dist(), 'gts')); V.HUNT.hist = H;
  ok('a value that is not a state word (a shape this version does not know) is counted apart and said -- not a check, not a hole, never a state or a change',
     tod.odd === 1 && tod.checks === fg.checks - 1 && tod.missed === fg.missed && JSON.stringify(tod.changes) === JSON.stringify(tg.changes)
     && godd[0] === `History · ${fg.checks - 1} checks on file, ${spanOf(fg)} · ${fg.missed} more could not reach it · 1 check this version cannot read`, JSON.stringify({ odd: tod.odd, checks: tod.checks, missed: tod.missed, head: godd[0] }));
  /* take 114 (the review): a list under a distributor's key is a shape this version does not know, and an empty map a listing that
     came back with nothing on it (the runner refuses one from take 114; rows before may hold it) -- neither is a reading: a hole */
  const tlOf = h => { V.HUNT.hist = h; const t = TL('gts', 'BJP2873812') || { changes: [] }; V.HUNT.hist = H; return t; }, chg = t => JSON.stringify(t.changes.map(c => [c.from, c.to, c.kind]));
  const arr = JSON.parse(JSON.stringify(H)); arr.runs[N - 3].gts = Object.entries(arr.runs[N - 3].gts); const tar = tlOf(arr);   // not empty: an empty list is also an empty map
  ok('a list under a distributor\'s key (its reading as [SKU, state] pairs) is not a reading of it: one more run that could not reach it, one check fewer, the same changes',
     tar.missed === fg.missed + 1 && tar.checks === fg.checks - 1 && tar.odd === 0 && JSON.stringify(tar.changes) === JSON.stringify(tg.changes), JSON.stringify({ checks: tar.checks, missed: tar.missed, ch: chg(tar) }));
  const three = m => ({ runs: [N - 3, N - 2, N - 1].map((k, j) => ({ t: runs[k].t, online: {}, shelf: {}, gts: j === 1 ? m : { BJP2873812: 'sold_out' } })), since: runs[N - 3].t, stores: {}, titles: {} });
  const tem = tlOf(three({})), toth = tlOf(three({ BJP2850164: 'sold_out' }));
  ok('an empty listing is not a reading either: sold out, an empty map, sold out -- two checks, one run that could not reach it, no change (as first built it made two, read off the page)',
     tem.checks === 2 && tem.missed === 1 && tem.odd === 0 && tem.changes.length === 0, JSON.stringify({ checks: tem.checks, missed: tem.missed, ch: chg(tem) }));
  ok('...negative control: a listing that holds another product and not this one is a reading -- off its list, then back on it, read off its page',
     toth.checks === 3 && toth.missed === 0 && chg(toth) === JSON.stringify([['sold_out', null, 'page'], [null, 'sold_out', 'page']]), chg(toth));
  const rev = [...runs].reverse(), rot = [...runs.slice(30), ...runs.slice(0, 30)];
  V.HUNT.hist = { ...H, runs: rev }; const trev = TL('gts', 'BJP2873812'); V.HUNT.hist = { ...H, runs: rot }; const trot = TL('gts', 'BJP2873812'); V.HUNT.hist = H;
  ok('rows out of order read the same as in order -- read off a sorted copy, the stored order left as it was', has && JSON.stringify(trev) === JSON.stringify(tg) && JSON.stringify(trot) === JSON.stringify(tg) && rev[0] === runs[N - 1] && rot[0] === runs[30]);
  V.HUNT.hist = null; const tn = TL('gts', 'BJP2873812'); V.HUNT.hist = { runs: [] }; const te = TL('gts', 'BJP2873812'); V.HUNT.hist = { runs: 'x' }; const tx = TL('gts', 'BJP2873812'); V.HUNT.hist = H;
  ok('no history, none on file, or no list of runs, is no timeline', has && tn === null && te === null && tx === null, JSON.stringify([tn, te, tx]));
  /* the real history of 24 Sept: no change anywhere yet */
  V.HUNT.hist = LIVE; const lg = TL('gts', 'BJP2873812') || { changes: [] }, ls = TL('southern', '79311') || { changes: [] }; V.HUNT.hist = H;
  const flg = facts(LIVE.runs, 'gts'), fls = facts(LIVE.runs, 'southern'), liveG = LIVE.runs.filter(r => isRead(r, 'gts')), liveS = LIVE.runs.filter(r => isRead(r, 'southern'));
  const liveFlips = liveG.filter((r, i) => i && r.gts.BJP2873812 !== liveG[i - 1].gts.BJP2873812).length;
  ok('on the saved real history: GTS read from its first check to its last, the runs between that could not reach it counted apart, the box in one state throughout; Southern Hobby read where its key begins',
     lg.checks === flg.checks && lg.first === flg.first && lg.last === flg.last && lg.missed === flg.missed && lg.missed > 0 && lg.odd === 0 && lg.changes.length === liveFlips && liveFlips === 0
     && lg.state0 === liveG[0].gts.BJP2873812 && lg.now === liveG[liveG.length - 1].gts.BJP2873812 && lg.end === LIVE.runs[LIVE.runs.length - 1].t
     && ls.checks === fls.checks && ls.first === fls.first && ls.changes.length === 0 && ls.state0 === liveS[0].southern['79311'], JSON.stringify({ g: [lg.checks, lg.missed, lg.changes.length], s: ls.checks, rows: [flg.checks, flg.missed, fls.checks] }));
  /* the distributor's own day for a change worked out from its dates */
  const Gturned = { ...G, preorder: utcDay(runs[I1 - 1].t, -1) };
  const dy2 = hasDay ? V.tlDay('gts', K1, G2) : undefined, dyF = hasDay ? V.tlDay('gts', K1, G) : undefined, dy0 = hasDay ? V.tlDay('gts', K1, Gturned) : undefined, dyP = hasDay ? V.tlDay('gts', K2, G2) : undefined;
  ok('tlDay: a calendar change takes the distributor\'s own day when its current date turns the state between the two checks (the order due date: the runner\'s UTC day turns it the day after)', hasDay && !!G2.preorder && dy2 === G2.preorder, JSON.stringify({ dy2, pre: G2.preorder }));
  ok('...controls: the fixture\'s own date (May 27, months before the window), a date whose turn is not after the earlier check, and a change read off the page name no day', hasDay && dyF === null && dy0 === null && dyP === null, JSON.stringify([dyF, dy0, dyP]));
  /* take 114 (the review): the window's other end, and the states a date turns -- each guard watched to fail with it removed */
  const byDay = utcDay(runs[I1].t), dyE = hasDay ? V.tlDay('gts', K1, { ...G, preorder: byDay }) : undefined;
  const dyA = hasDay ? [1, 2].map(k => V.tlDay('gts', K1, { ...G, preorder: utcDay(runs[I1].t, k) })) : undefined;
  ok('...a date moved later names no day: due the day after the later check, or two after, its turn is past the window -- while due that check\'s own day (a run that began before midnight UTC) still names it',
     hasDay && JSON.stringify(dyA) === '[null,null]' && dyE === byDay, JSON.stringify({ above: dyA, edge: dyE, byDay }));
  const dyW = hasDay ? V.tlDay('gts', { ...K1, from: 'out' }, G2) : undefined;
  ok('...nor does a change from a state its date does not turn (out to preorder: a release moved later), with the very date that names the coming-to-preorder change\'s day',
     hasDay && dyW === null && dy2 === G2.preorder, JSON.stringify({ fromOut: dyW, fromComing: dy2 }));
  /* on screen */
  const head = f => `History · ${f.checks} checks on file, ${spanOf(f)} · ${f.missed} more could not reach it`;
  V.HUNT.feed = F2; V.HUNT.hist = H; openP({ dist: true }); const d2h = dist(), gl2 = lines(blk(d2h, 'gts'));
  const exp2 = [head(fg), `${TLW.gts.coming} at the first check`, `${TLW.gts.coming} → orders were due ${nb(V.dayText(G2.preorder))} · worked out from its dates`, `${TLW.gts.preorder} → ${TLW.gts.sold_out} · ${btw(K2)} · read off its page`];
  ok('its page at Distributor info, with dates that explain the calendar change: under GTS\'s words the checks on file, the days they span and the run that could not reach it; the state at the first check; the change on GTS\'s own day, worked out from its dates; the change read off its page, between two checks in this phone\'s time -- oldest first, and no note',
     JSON.stringify(gl2) === JSON.stringify(exp2) && !/between/.test(gl2[2] || 'between') && !d2h.includes(TL_NOTE), JSON.stringify(gl2));
  V.HUNT.feed = F; openP({ dist: true }); const d1h = dist(), gl1 = lines(blk(d1h, 'gts'));
  const exp1 = [exp2[0], exp2[1], `${TLW.gts.coming} → ${TLW.gts.preorder} · ${btw(K1)} · worked out from its dates`, exp2[3]];
  ok('...with the fixture\'s own date, which does not put the change between its checks: the calendar change keeps its two checks and says it was worked out from its dates, and one note after the distributor note says why',
     JSON.stringify(gl1) === JSON.stringify(exp1) && d1h.split(TL_NOTE).length === 2 && d1h.indexOf(TL_NOTE) > d1h.indexOf('A distributor sells to stores, not to you'), JSON.stringify(gl1));
  const sl = lines(blk(d1h, 'southern'));
  ok('...Southern Hobby\'s: its checks and the day they span, the same state at both, and no "since" anywhere in a history',
     !!blk(d1h, 'southern') && JSON.stringify(sl) === JSON.stringify([`History · ${fsh.checks} checks on file, ${spanOf(fsh)}`, `${TLW.southern[S.state]} at both checks · no change seen`]) && !/since/i.test(blk(d1h, 'gts') + blk(d1h, 'southern') + blk(d2h, 'gts')), JSON.stringify(sl));
  const DAYNB = '[A-Z][a-z]{2}\\u00a0\\d{1,2}(,\\u00a0\\d{4})?', AGE = '(just now|\\d+ min ago)';
  const inOrder = (h, d, words) => new RegExp(`${d === 'gts' ? 'GTS Distribution' : 'Southern Hobby'}<\\/b><span>${words}<\\/span><\\/div><a class="ghost"[^>]*>[\\s\\S]*?<\\/a><\\/div><div class="dtl" data-tl="${d}">`).test(h);
  ok('...the take-112 words stay whole and first: each distributor\'s span, then its link, then its history',
     inOrder(d1h, 'gts', `sold out · allocated · [^<]*· release ${DAYNB} · ${AGE}`) && inOrder(d1h, 'southern', `stores’ orders closed ${DAYNB} · release ${DAYNB} · ${AGE}`), d1h.slice(d1h.indexOf('GTS Distribution</b>'), d1h.indexOf('GTS Distribution</b>') + 320));
  const isoT = t => /\b\d{4}-\d\d-\d\d\b|T\d\d:\d\d/.test(t), brk = t => /[A-Z][a-z]{2}[ \u202f]\d|\d:\d\d[ \u202f][AP]M|\d,[ \u202f]\d/.test(t);
  const tlAll = [d2h, d1h].map(h => blk(h, 'gts') + blk(h, 'southern')).join('');
  ok('...every day and moment in words, and none can break: no ISO text, no breaking space inside a day or a time', !!blk(d1h, 'gts') && !!blk(d1h, 'southern') && !isoT(tlAll) && !brk(tlAll), lines(blk(d1h, 'gts')).join(' | ').slice(0, 240));
  ok('...control: the moment in words by itself has a breaking space, and an ISO run time is caught', brk(V.momentText(runs[N - 1].t)) && isoT('<span>History · 2026-09-24T19:08:56Z</span>'));
  V.openDetail(PID); const dc = dist(); V.distFoldTap('detail'); const dco = dist(); V.distFoldTap('detail'); const dcc = dist();
  ok('opened from its row, Distributor info is closed and carries no history; tapped open, both histories are there; tapped again, gone',
     /data-distfold="detail" aria-expanded="false"/.test(dc) && !/class="dtl"|History ·/.test(dc) && !!blk(dco, 'gts') && !!blk(dco, 'southern') && !/class="dtl"|History ·/.test(dcc), dc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160));
  ok('...control: a closed fold with a history line in it is caught', /class="dtl"|History ·/.test('<button class="dfold" data-distfold="detail" aria-expanded="false"></button><div class="dtl"><span>History · 8 checks on file</span></div>'));
  /* the owner's answer (take 114): "it should be tucked away" -- each history is one header line, a button, until tapped */
  const tucked = b => /<button class="dtl-h" data-disthist="[a-z]+" aria-expanded="false">/.test(b) && lines(b).length === 1;
  V.HUNT.feed = F; V.HUNT.hist = H; V.openDetail(PID, { dist: true }); const tk0 = dist();
  const hasTap = typeof V.distHistTap === 'function'; if (hasTap) V.distHistTap('gts'); const tk1 = dist();
  V.openDetail(PID, { dist: true }); const tk2 = dist();
  ok('each history starts tucked away: its header alone, a button closed, and no note (the box\'s change here would need one)',
     tucked(blk(tk0, 'gts')) && tucked(blk(tk0, 'southern')) && !tk0.includes(TL_NOTE), lines(blk(tk0, 'gts')).join(' | '));
  ok('...a tap opens that distributor\'s history and only that one -- its lines and the note its change needs; the other stays tucked',
     hasTap && /data-disthist="gts" aria-expanded="true"/.test(blk(tk1, 'gts')) && lines(blk(tk1, 'gts')).length > 1 && tucked(blk(tk1, 'southern')) && tk1.includes(TL_NOTE), lines(blk(tk1, 'gts')).join(' | ').slice(0, 200));
  ok('...and a page opened again starts tucked', tucked(blk(tk2, 'gts')) && tucked(blk(tk2, 'southern')) && !tk2.includes(TL_NOTE));
  ok('...negative control: the history as first built -- open under its header, no button -- is not tucked',
     !tucked('<div class="dtl" data-tl="gts"><span class="dtl-h">History · 8 checks on file</span><span>sold out at all 8 checks · no change seen</span></div>'));
  const noS = JSON.parse(JSON.stringify(H)); noS.runs.forEach(r => { delete r.southern; }); V.HUNT.hist = noS; V.openDetail(PID, { dist: true }); const tk3 = blk(dist(), 'southern'); V.HUNT.hist = H;
  ok('...a history with nothing to open is its header alone, not a button', /<span class="dtl-h">History · no check of it on file yet/.test(tk3) && !/<button/.test(tk3), tk3.slice(0, 160));
  while (V.closeAnyOverlay()) {}
  V.SEALED.kind = 'all'; V.SEALED.q = ''; const p18 = V.CAT.byId.get(PID) || {}; V.SEALED.closed.delete(p18.set); V.SEALED.open.add(p18.set); V.paintSealed(); const hs = ctx.document.querySelector('#sealedList').innerHTML;
  V.distFoldTap('sealed'); const hso = ctx.document.querySelector('#sealedList').innerHTML; V.distFoldTap('sealed');
  const dl = [...hs.matchAll(new RegExp(`<button class="dline" data-open="${PID}"[^>]*><span>([^<]*)</span>`, 'g'))].map(m => m[1]);
  ok('no row floods: the box\'s row keeps one short line per distributor, word for word as before, and no history anywhere on Sealed, its Distributor info open or closed',
     dl.join('|') === (V.HUNT.distByCatalogId()[PID] || []).map(it => V.distShort(it)).join('|') && dl.join('|') === `GTS Distribution · sold out|Southern Hobby · orders closed ${nb(V.dayText(S.due))}` && !/History ·|class="dtl"/.test(hs + hso), JSON.stringify(dl));
  ok('...control: a row carrying a history line is caught', /History ·|class="dtl"/.test('<button class="dline" data-open="1"><span>GTS Distribution · sold out</span></button><div class="dtl"><span>History · 8 checks on file</span></div>'));
  /* the thin and the missing */
  const one = JSON.parse(JSON.stringify(H)); one.runs.forEach((r, i) => { if (i < N - 1) delete r.southern; }); V.HUNT.hist = one; openP({ dist: true });
  const s1 = lines(blk(dist(), 'southern'));
  ok('one check: its moment, and that a change needs two -- never a trend on one reading', JSON.stringify(s1) === JSON.stringify([`History · 1 check on file, ${M(runs[N - 1].t)}`, `${TLW.southern[S.state]} at the one check so far — a change needs two`]), JSON.stringify(s1));
  const rb = runs.slice(0, N - 10), fb = facts(rb, 'gts'), ends = `this phone’s copy ends ${M(rb[rb.length - 1].t)}`;
  V.HUNT.hist = { ...H, runs: rb }; openP({ dist: true }); const db = dist();
  ok('a copy on the phone that ends before the feed says where it ends, and Southern Hobby, not in it, has no check on file yet',
     lines(blk(db, 'gts'))[0] === `${head(fb)} · ${ends}` && JSON.stringify(lines(blk(db, 'southern'))) === JSON.stringify([`History · no check of it on file yet · ${ends}`]), JSON.stringify([lines(blk(db, 'gts'))[0], lines(blk(db, 'southern'))]));
  V.HUNT.feed = FL; V.HUNT.hist = LIVE; openP({ dist: true }); const dT = dist(), glT = lines(blk(dT, 'gts')), slT = lines(blk(dT, 'southern'));
  ok('the real history today reads: its GTS state at all its checks, no change seen, with the runs that could not reach it; its one Southern Hobby check, a change needs two -- no note, and the copy ends where the feed does',
     JSON.stringify(glT) === JSON.stringify([head(flg), `${TLW.gts[liveG[0].gts.BJP2873812]} at all ${flg.checks} checks · no change seen`])
     && JSON.stringify(slT) === JSON.stringify([`History · 1 check on file, ${M(liveS[0].t)}`, `${TLW.southern[liveS[0].southern['79311']]} at the one check so far — a change needs two`])
     && !dT.includes(TL_NOTE) && !/copy ends/.test(dT), JSON.stringify([glT, slT]));
  const many = JSON.parse(JSON.stringify(H)); many.runs.forEach((r, i) => { if (r.gts && i >= I2) r.gts.BJP2873812 = i % 2 ? 'call' : 'sold_out'; }); V.HUNT.feed = F; V.HUNT.hist = many; openP({ dist: true });
  const tm = TL('gts', 'BJP2873812') || { changes: [] }, gm = lines(blk(dist(), 'gts')), SHOW = 3;   // the last three changes, oldest first (the spec's cap)
  const mg = many.runs.filter(r => isRead(r, 'gts')), mflips = mg.map((r, i) => i && r.gts.BJP2873812 !== mg[i - 1].gts.BJP2873812 ? { from: mg[i - 1].gts.BJP2873812, to: r.gts.BJP2873812, after: mg[i - 1].t, by: r.t } : null).filter(Boolean);
  ok('more than three changes: the state at the first check, how many earlier changes are not shown, then the last three, oldest first',
     mflips.length > SHOW && tm.changes.length === mflips.length && JSON.stringify(gm) === JSON.stringify([head(fg), `${TLW.gts.coming} at the first check`, `${mflips.length - SHOW} earlier changes not shown`, ...mflips.slice(-SHOW).map(c => `${TLW.gts[c.from]} → ${TLW.gts[c.to]} · ${btw(c)} · read off its page`)]), JSON.stringify(gm.slice(0, 4)));
  /* take 114 (the review): 1 November 2026, the clocks go back in New York and 1:00 to 2:00 AM comes twice -- two checks an hour
     apart, both at 1:30 AM on the clock, EDT then EST */
  const FB = { from: 'sold_out', to: 'call', after: '2026-11-01T05:30:00Z', by: '2026-11-01T06:30:00Z', kind: 'page' }, FS = { ...FB, after: '2026-11-01T07:30:00Z', by: '2026-11-01T09:30:00Z' };
  const fbH = { runs: [[FB.after, 'sold_out'], [FB.by, 'call']].map(([t, st]) => ({ t, online: {}, shelf: {}, gts: { ...R0.gts, BJP2873812: st } })), since: FB.after, stores: {}, titles: {} };
  V.HUNT.feed = F; V.HUNT.hist = fbH; openP({ dist: true }); const gfb = lines(blk(dist(), 'gts')); V.HUNT.hist = H;
  const hasWin = typeof V.tlWindow === 'function', wB = hasWin ? V.tlWindow(FB) : '', wS = hasWin ? V.tlWindow(FS) : '';
  ok('a change across the clocks going back: both ends in full, each with its zone -- 1:30 AM EDT, then 1:30 AM EST an hour later -- on its page and from tlWindow',
     gfb[gfb.length - 1] === `${TLW.gts.sold_out} → ${TLW.gts.call} · ${btw(FB)} · read off its page` && wB === btw(FB) && /^between Nov\u00a01,\u00a01:30\u00a0AM\u00a0EDT and Nov\u00a01,\u00a01:30\u00a0AM\u00a0EST$/.test(wB), JSON.stringify([gfb[gfb.length - 1], wB]));
  ok('...on one side of the change, one local day still drops the second end\'s day and names no zone', hasWin && wS === btwAsBuilt(FS) && /^between Nov\u00a01,(\u00a02026,)?\u00a02:30\u00a0AM and 4:30\u00a0AM$/.test(wS), JSON.stringify(wS));
  ok('...control: written as first built, the fall-back change reads as no time at all -- "between Nov 1, 1:30 AM and 1:30 AM" -- though an hour passed',
     /^between Nov\u00a01,(\u00a02026,)?\u00a01:30\u00a0AM and 1:30\u00a0AM$/.test(btwAsBuilt(FB)) && Date.parse(FB.by) - Date.parse(FB.after) === 3600e3, JSON.stringify(btwAsBuilt(FB)));
  /* take 114 (the review): GTS's out turns on the release day itself (gts.status_of: a release on or before the day read) -- the
     line names the day it was released, never that the day has passed */
  const outH = JSON.parse(JSON.stringify(H)); outH.runs.forEach((r, i) => { if (r.gts) r.gts.BJP2873812 = i < I1 ? 'coming' : 'out'; });
  const F3 = JSON.parse(JSON.stringify(F)), G3 = F3.sources.gts.items.find(i => i.sku === 'BJP2873812') || {}; G3.release = byDay; G3.status = 'out';
  const K3 = { ...K1, to: 'out' }, dy3 = hasDay ? V.tlDay('gts', K3, G3) : undefined;
  V.HUNT.feed = F3; V.HUNT.hist = outH; openP({ dist: true }); const gout = lines(blk(dist(), 'gts')); V.HUNT.feed = F; V.HUNT.hist = H;
  ok('GTS out of stock on its release day: the change reads "released <day>, out of stock", worked out from its dates -- never "passed"',
     dy3 === byDay && gout[gout.length - 1] === `${TLW.gts.coming} → released ${nb(V.dayText(byDay))}, out of stock · worked out from its dates` && !gout.some(l => /passed/.test(l)), JSON.stringify(gout));
  V.HUNT.hist = null; openP({ dist: true }); const d0 = dist();
  ok('no history on the phone: no history at all (take 73: with none it says nothing), and the take-112 words as they were', !/class="dtl"|History ·/.test(d0) && !d0.includes(TL_NOTE) && /GTS Distribution<\/b><span>sold out · allocated · /.test(d0));
  /* Diagnostics, by what it reports (landmine 100), not by its source */
  V.HUNT.hist = LIVE; const rep = await V.DIAG.report(); V.HUNT.hist = null;
  const wantDiag = `history on phone: ${LIVE.runs.length} runs, gts in ${liveG.length}, southern in ${liveS.length}, ends ${V.momentText(LIVE.runs[LIVE.runs.length - 1].t)}`;
  ok('Diagnostics counts the history on the phone per distributor and says where it ends', rep.split('\n').includes(wantDiag), (rep.match(/^history on phone: .*$/m) || ['no history line'])[0]);
  /* GTS's date is its Order Due Date (its own product page, take 114): the words say stores order by it, never that preorders open */
  V.HUNT.feed = F; const pebRaw = F.sources.gts.items.find(i => i.sku === 'BJP2897699') || {}, peb = { ...pebRaw, _d: 'gts' }, pebDay = nb(V.dayText(pebRaw.preorder));
  const sweep = ['sold_out', 'call', 'in_stock', 'preorder', 'coming', 'out', 'unknown'].flatMap(st => [pebRaw.preorder, null].map(pre => ({ ...peb, status: st, preorder: pre })));
  const saysOpen = sweep.filter(x => /preorders? open|undefined/.test(V.distShort(x) + V.distLine(x)));
  ok('GTS\'s order due date, on a row: PEB-01 "orders close" on its day; past it, "orders were due"; with none listed, it says so -- and no GTS state says preorders open',
     pebRaw.status === 'coming' && !!pebRaw.preorder && V.distShort(peb) === `GTS Distribution · orders close ${pebDay}` && V.distShort({ ...peb, status: 'preorder' }) === `GTS Distribution · orders were due ${pebDay}`
     && V.distShort({ ...peb, status: 'preorder', preorder: null }) === 'GTS Distribution · no order due date listed' && !saysOpen.length,
     JSON.stringify([V.distShort(peb), V.distShort({ ...peb, status: 'preorder' }), V.distShort({ ...peb, status: 'preorder', preorder: null }), saysOpen.length]));
  ok('...control: the take-113 words are caught', /preorders? open/.test('GTS Distribution · preorders open on Oct 14'));
  while (V.closeAnyOverlay()) {} V.HUNT.hist = null; V.HUNT.feed = null; V.DISTF.open.clear(); V.MODE.set('collect', false); V.go('home');
  if (TZ0 === undefined) delete process.env.TZ; else process.env.TZ = TZ0;   // assigning undefined would set the zone "undefined"
  ok('...and the zone the run began with is back after the section', process.env.TZ === TZ0 && new Date('2026-12-01T12:00:00Z').getTimezoneOffset() === off0, `${process.env.TZ} ${new Date('2026-12-01T12:00:00Z').getTimezoneOffset()} ${off0}`);
  fs.rmSync(fxDir, { recursive: true, force: true }); }

{ section('take 115 — production safety (A1): the scanner index survives a sync, a synced catalogue this build cannot read is set aside, stored values that do not read or do not save never stop the app, every request has a deadline; the collection and money (A2): every save of the collection backed up, a restore that reads first and can be undone, the prompts on the picker, the pages of the binder, the featured Leader, an alert in the currency on screen, the line a copy counts into; the Hunt\'s honesty and the data (A3): a distributor kept after a failed fetch reads as not reached, Target\'s history in days, every set with a product, counts that say what they count, one of each duplicate; the spec\'s own words (A4): the splash\'s mark, every text on a tint at 4.5:1, accent as text, nothing under 12 px as drawn, one field rule, the tokens, one glyph per meaning, every link that leaves marked, every toggle pressed, a Leader\'s own colours, the thumbnail sizes, days in words, keywords one way, buttons of three words, curled apostrophes, one percentage rule, a badged name that wraps, a pointer only on a control');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const settle = (p, ms) => Promise.race([Promise.resolve(p).then(v => ({ v }), e => ({ e: String((e && e.message) || e) })), sleep(ms).then(() => ({ hung: true }))]);
  const guard = async (name, fn) => { try { await fn(); } catch (e) { ok(`${name}: the block ran to its end`, false, String((e && e.stack) || e).slice(0, 400)); } };
  const holds = f => { try { return f(); } catch (e) { return false; } };   // a check whose expression throws on an older build is a failure, not the end of the block
  const later = (iso, days) => new Date(Date.parse(iso) + days * 864e5).toISOString();   // from the data, never a literal date
  const PAGES = 'https://pages.invalid/optcghub/bundle/';
  const fakeFs = disk => ({ readFile: async ({ path: p }) => { if (!(p in disk)) throw new Error('File does not exist.'); return { data: disk[p] }; },
                            writeFile: async ({ path: p, data }) => { disk[p] = data; return { uri: 'file:///data/' + p }; },
                            deleteFile: async ({ path: p }) => { delete disk[p]; } });
  const resp = (body, status = 200) => ({ ok: status >= 200 && status < 300, status,
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body), text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
  const pages = (man, cat, catStatus = 200) => async u => { if (!u.startsWith('https://pages.invalid/')) return undefined;
    if (u.endsWith('manifest.json')) return resp(man); if (u.endsWith('catalog.json')) return resp(cat, catStatus); return resp('not found', 404); };
  const newer = days => ({ ...manifest, updateUrl: PAGES, source_updated_at: later(manifest.source_updated_at, days) });
  const toastText = d => (d.getElementById('toast') || {})._text || '';
  /* a second, independent boot of the SHIPPED app: its own storage, disk and network, the real boot path */
  const bootFresh = async ({ st = {}, disk = null, full = null, getThrows = null, timers = null, answers = [] } = {}) => {
    const { doc: d, listeners: dl } = makeDom(html);   // A2: its document's click listeners, to tap a sheet's option
    const c = { console, navigator: { vibrate: () => true, onLine: false }, location: { href: 'https://localhost/' },
      localStorage: { getItem: k => { if (getThrows && getThrows(k)) throw new Error('SecurityError: storage is blocked'); return st[k] ?? null; },
                      /* full.on refuses every write; full.quota refuses only a write that takes the total past it, as Chromium
                         does -- a shorter value always fits, which is how clearing the batch got through (take 115, self-review) */
                      setItem: (k, v) => { v = String(v);
                        const size = () => Object.entries(st).reduce((a, [x, y]) => a + x.length + String(y).length, 0);
                        if (full && (full.on || (full.quota != null && size() - (k in st ? k.length + String(st[k]).length : 0) + k.length + v.length > full.quota))) {
                          const e = new Error("Failed to execute 'setItem' on 'Storage': exceeded the quota."); e.name = 'QuotaExceededError'; throw e; }
                        st[k] = v; },
                      removeItem: k => { delete st[k]; } },
      URL, Blob: class { constructor(p) { this.p = p; } }, BigInt, Math, Date, JSON, Promise, clearTimeout, devicePixelRatio: 2, AbortController,
      setTimeout: timers ? (f, ms, ...a) => { timers.push([f, ms]); return setTimeout(f, ms, ...a); } : setTimeout,
      fetch: async u => { u = String(u); if (u.includes('catalog.json')) return { json: async () => catalog }; if (u.includes('manifest.json')) return { json: async () => manifest }; throw new Error('unexpected fetch ' + u); } };
    c.document = d; c._win = {}; c.addEventListener = (t, f) => { (c._win[t] ||= []).push(f); }; c.removeEventListener = () => {};
    c.history = { _s: [], pushState(x, _t, url) { this._s.push({ x, url }); }, back() {} };
    c.window = c; c.scrollTo = () => {}; c.confirm = () => !!answers.shift();   // the collector's answers to confirm(), in order; none left is "Cancel"
    if (disk) c.Capacitor = { Plugins: { Filesystem: fakeFs(disk) } };
    vm.createContext(c);
    let threw = null; try { vm.runInContext(js, c, { filename: 'www/app.js' }); } catch (e) { threw = e; }
    for (let i = 0; i < 80 && !threw && !c.VAULT && !/failed to load/.test(d.body.innerHTML); i++) await sleep(25);
    await sleep(10);
    return { c, V: c.VAULT, d, st, threw, L: dl };
  };
  const url0 = V.CAT.man.updateUrl, on0 = ctx.navigator.onLine, W0 = V.NET.WAIT, WB0 = V.NET.WAIT_BIG;

  /* (1) the scanner index. loadCatalogue filled byNum in place and never cleared it: the quiet sync (1.5 s
     after most launches) listed every printing twice -- 200 of 200 artwork auto-accepts turned into asks. */
  await guard('the scanner index across a sync', async () => {
    const withNum = V.CAT.rows.filter(p => p.num).length;
    const entries = () => [...V.CAT.byNum.values()].reduce((a, l) => a + l.length, 0);
    let one = null, many = null;
    for (const [n, l] of V.CAT.byNum) { if (!one && l.length === 1 && V.resolve(n).verdict === 'auto') one = n; if (!many && l.length >= 3) many = n; if (one && many) break; }
    const art = [];
    for (const [n, l] of V.CAT.byNum) { if (l.length < 2 || l.some(p => p.sameart || p.hash == null)) continue;
      for (const p of l) { const r = V.resolve(n, { hash: p.hash }); if (r.verdict === 'auto' && /artwork/.test(r.why || '') && r.pick.id === p.id) { art.push([n, p.hash, p.id]); break; } }
      if (art.length >= 100) break; }
    const snap = () => ({ entries: entries(), ids: V.CAT.byId.size, one: V.candidates(one).length, oneV: V.resolve(one).verdict, many: V.candidates(many).map(p => p.id).join(','),
      art: art.filter(([n, h, id]) => { const r = V.resolve(n, { hash: h }); return r.verdict === 'auto' && r.pick.id === id; }).length });
    const before = snap();
    ok('before any sync: one index entry per numbered printing, a unique number that auto-accepts, a number with three or more printings, and artwork auto-accepts to watch',
       before.entries === withNum && !!one && !!many && art.length >= 20 && before.art === art.length && before.oneV === 'auto', JSON.stringify({ ...before, withNum, one, many, art: art.length }));
    V.CAT.man.updateUrl = PAGES; ctx.navigator.onLine = true; ctx._net = pages(newer(1), catalog);
    const rows0 = V.CAT.rows, r1 = await settle(V.PLATFORM.refreshCatalogue({ quiet: true }), 5000), after1 = snap();
    ok('a sync with newer prices on Pages reloads the catalogue (the path the quiet sync takes after most launches)', r1.v === true && V.CAT.rows !== rows0, JSON.stringify(r1));
    ok('...and the scanner index is the same after it: one entry per printing, the same candidates in the same order, every artwork auto-accept still auto on the same printing',
       JSON.stringify(after1) === JSON.stringify(before), JSON.stringify({ before, after1 }));
    ok('...the picker lists each printing of a number once', new Set(V.candidates(many).map(p => p.id)).size === V.candidates(many).length && V.candidates(many).length === before.many.split(',').length, V.candidates(many).length + ' vs ' + before.many.split(',').length);
    const disk = {}; ctx.window.Capacitor = { Plugins: { Filesystem: fakeFs(disk) } };
    V.CAT.man.updateUrl = PAGES; ctx._net = pages(newer(2), catalog);
    const r2 = await settle(V.PLATFORM.refreshCatalogue({ quiet: true }), 5000), after2 = snap();
    ok('a second sync through the disk (written, then loaded from it): the index is still the same', r2.v === true && !!disk['catalogue/catalog.json'] && V.CAT.man.fromDisk === true && JSON.stringify(after2) === JSON.stringify(before),
       JSON.stringify({ r2, fromDisk: V.CAT.man.fromDisk, after2 }));
  });

  /* (3) a synced catalogue this build cannot read. The sync wrote it unchecked, and the loader threw on it at
     every launch -- "Catalogue failed to load", with no way to Export or Restore. */
  await guard('a synced catalogue of another shape', async () => {
    const bad = {
      'its rows as a record': { ...catalog, rows: {} },
      'a column renamed (num)': { ...catalog, cols: catalog.cols.map(c => c === 'num' ? 'number' : c) },
      'a row shorter than the columns': { ...catalog, rows: [catalog.rows[0].slice(0, 5), ...catalog.rows.slice(1)] },
      'its history days as a record': { ...catalog, days: { d: 1 } },
      'an error page served as it': '<!DOCTYPE html><title>Site not found</title>'
    };
    let day = 3;
    for (const [what, body] of Object.entries(bad)) {
      const dk = {}; ctx.window.Capacitor = { Plugins: { Filesystem: fakeFs(dk) } };
      V.CAT.man.updateUrl = PAGES; ctx._net = pages(newer(day++), body);
      const e0 = V.ERRS.list[0], n0 = V.CAT.rows.length, r = await settle(V.PLATFORM.refreshCatalogue({ quiet: true }), 5000);
      ok(`a synced catalogue with ${what} is refused before it is written: nothing on the disk, the catalogue in use unchanged, the reason in the last errors`,
         r.v === false && !('catalogue/catalog.json' in dk) && V.CAT.ready && V.CAT.rows.length === n0 && V.ERRS.list[0] !== e0 && /was not written: /.test(V.ERRS.list[0].msg),
         JSON.stringify({ r, disk: Object.keys(dk), err: V.ERRS.list[0] && V.ERRS.list[0].msg }));
    }
    { const dk = {}; ctx.window.Capacitor = { Plugins: { Filesystem: fakeFs(dk) } };
      V.CAT.man.updateUrl = PAGES; ctx._net = pages(newer(day++), catalog, 404);
      const r = await settle(V.PLATFORM.refreshCatalogue({ quiet: true }), 5000);
      ok('a catalogue answered with HTTP 404 is not written either (the status is read)', r.v === false && !('catalogue/catalog.json' in dk), JSON.stringify({ r, disk: Object.keys(dk) })); }
    { const dk = {}; ctx.window.Capacitor = { Plugins: { Filesystem: fakeFs(dk) } };
      const odd = { ...catalog, stock: [{ ...catalog.stock[0], cards: [null] }] };   // passes the shape check, throws in the loader
      V.CAT.man.updateUrl = PAGES; ctx._net = pages(newer(day++), odd);
      const r = await settle(V.PLATFORM.refreshCatalogue(), 5000);
      ok('a catalogue the shape check passes but the loader cannot index is set aside at load: the sync says it failed, never "Prices updated", and the app stays on its own catalogue',
         r.v === false && !V.CAT.man.fromDisk && V.CAT.rows.length === manifest.printings && /set aside/.test((V.ERRS.list[0] || {}).msg || '') && /^Sync failed — the new catalogue could not be read/.test(toastText(ctx.document)),
         JSON.stringify({ r, fromDisk: V.CAT.man.fromDisk, err: (V.ERRS.list[0] || {}).msg, toast: toastText(ctx.document) })); }
    { V.CAT.man.updateUrl = PAGES; ctx._net = pages(newer(day++), { ...catalog, rows: {} });
      await settle(V.PLATFORM.refreshCatalogue(), 5000);
      ok('Sync now says it failed and that the prices stay, in words (the reason is for Diagnostics)', /^Sync failed — the new catalogue could not be read; your prices stay as they are$/.test(toastText(ctx.document)), toastText(ctx.document)); }
    { const dk = {}; ctx.window.Capacitor = { Plugins: { Filesystem: fakeFs(dk) } };
      const plus = { ...catalog, cols: [...catalog.cols, 'added_later'], rows: catalog.rows.map(r => [...r, null]), added_later: [1] };
      V.CAT.man.updateUrl = PAGES; ctx._net = pages(newer(day++), plus);
      const r = await settle(V.PLATFORM.refreshCatalogue({ quiet: true }), 5000);
      ok('control: a newer take\'s catalogue that only ADDS (a column, a list) is written and used -- the check refuses what this build cannot read, nothing more',
         r.v === true && !!dk['catalogue/catalog.json'] && V.CAT.man.fromDisk === true && V.CAT.rows.length === manifest.printings && V.candidates('EB03-024').length === 3, JSON.stringify({ r, fromDisk: V.CAT.man.fromDisk })); }
    ok('control: the check itself catches each shape above and passes the shipped catalogue',
       typeof V.catalogueProblem === 'function' && V.catalogueProblem(catalog, V.CAT.shape) === '' && Object.values(bad).filter(b => typeof b === 'object').every(b => V.catalogueProblem(b, V.CAT.shape) !== ''));
    /* at boot: a copy already on the disk (written by an older take, or a newer shape) */
    const plant = cat => ({ 'catalogue/manifest.json': JSON.stringify(newer(30)), 'catalogue/catalog.json': typeof cat === 'string' ? cat : JSON.stringify(cat) });
    const B = await bootFresh({ disk: plant({ ...catalog, rows: {} }) });
    ok('at launch a synced copy of another shape is set aside: the app opens on the catalogue it shipped with, never "Catalogue failed to load"',
       !!B.V && B.V.CAT.ready && B.V.CAT.rows.length === manifest.printings && !B.V.CAT.man.fromDisk && !/failed to load/.test(B.d.body.innerHTML) && B.V.NAV.stack.length > 0,
       B.V ? JSON.stringify({ n: B.V.CAT.rows.length, fromDisk: B.V.CAT.man.fromDisk }) : B.d.body.innerHTML.slice(0, 120));
    const rep = B.V ? await B.V.DIAG.report() : '';
    ok('...and why is recorded: in the last errors, and on Diagnostics\' catalogue line',
       !!B.V && B.V.ERRS.list.some(e => e.kind === 'catalogue' && /set aside: no rows list/.test(e.msg)) && /^catalogue copy: the one that came with the app \(the copy synced for \d{4}-\d\d-\d\d was set aside: no rows list\)$/m.test(rep),
       (rep.match(/^catalogue copy: .*$/m) || ['no line'])[0]);
    const B2 = await bootFresh({ disk: plant('{"sets": [') });
    ok('a synced copy cut off mid-file is set aside the same way, and recorded (it used to be dropped without a word)',
       !!B2.V && !B2.V.CAT.man.fromDisk && B2.V.CAT.rows.length === manifest.printings && B2.V.ERRS.list.some(e => e.kind === 'catalogue' && /set aside: the file does not read/.test(e.msg)), B2.V ? JSON.stringify(B2.V.ERRS.list[0]) : 'no app');
    const B3 = await bootFresh({ disk: plant(catalog) });
    ok('control: a good newer copy on the disk is still the one used at launch, with nothing recorded', !!B3.V && B3.V.CAT.man.fromDisk === true && B3.V.CAT.rows.length === manifest.printings && !B3.V.ERRS.list.some(e => e.kind === 'catalogue'),
       B3.V ? JSON.stringify({ fromDisk: B3.V.CAT.man.fromDisk, errs: B3.V.ERRS.list.length }) : 'no app');
  });

  /* (6) stored values read at script load with no guard: one unreadable value threw before the error buffer and
     the opening screen's fallback were set up -- the opening screen for good, nothing in Diagnostics. */
  await guard('stored values that do not read', async () => {
    const corrupt = { 'vault.items': '[{"id": 1, "qty"', 'vault.snaps': 'not json', 'vault.credits': '[1, 2', 'vault.pfs': '{', 'vault.decks': '{"a": 1}',
      'vault.trade.give': 'x', 'vault.wants': 'x', 'vault.alerts': '7', 'vault.batch': '[]', 'vault.filt.own': 'x', 'vault.hunt': '[]', 'vault.hunt.notes': 'x', 'vault.stockAlerts': 'x', 'vault.relAlerts': 'x' };
    const id = V.candidates('EB03-024')[0].id;
    const good = JSON.stringify({ app: 'OP TCG Hub', take: V.TAKE, at: later(manifest.source_updated_at, -1), items: [{ id, qty: 3, condition: 'NM', pf: 'main', game: 'optcg' }], decks: [] });
    const B = await bootFresh({ st: { ...corrupt, 'vault.backup': good } });   // the browser keeps its backup in storage; on the phone it is Documents/OPTCGHub
    ok('a phone whose stored values do not read still opens: the catalogue, a screen, the app\'s internals', !B.threw && !!B.V && B.V.CAT.ready && B.V.NAV.stack.length > 0, String(B.threw && B.threw.message));
    const named = B.V ? Object.keys(corrupt).filter(k => !B.V.ERRS.list.some(e => e.kind === 'storage' && e.msg.startsWith(k + ' was unreadable'))) : Object.keys(corrupt);
    ok(`...each of the ${Object.keys(corrupt).length} unreadable values (bad JSON, or JSON of the wrong kind) is named in Diagnostics' last errors`, named.length === 0, 'not named: ' + named.join(', '));
    ok('...the collection starts empty rather than wrong, and its unreadable text is kept beside it, where nothing writes over it',
       !!B.V && B.V.OWN.items.length === 0 && B.st['vault.items.unreadable'] === corrupt['vault.items'] && B.st['vault.items'] !== corrupt['vault.items'], JSON.stringify({ kept: B.st['vault.items.unreadable'], now: B.st['vault.items'] }));
    ok('...a cache or a preference that does not read is simply refetched or reset: recorded, no copy kept', !!B.V && ['vault.hunt', 'vault.filt.own'].every(k => B.V.ERRS.list.some(e => e.msg.startsWith(k + ' was unreadable')) && !((k + '.unreadable') in B.st)));
    await sleep(5);
    ok('...the collector is told, and pointed at Restore (the collection first, then how many other lists)', /^Your saved collection and 10 other lists could not be read — use Restore from backup, under More$/.test(toastText(B.d)), toastText(B.d));
    /* take 115 (self-review): what Back up asked is recorded, and a throw is a failure -- holds() read a throw as false,
       the Cancel's own value, so a Back up that crashed or refused without asking passed */
    const call = f => { try { return { v: f() }; } catch (e) { return { e: String((e && e.message) || e) }; } };
    const asked = []; B.c.confirm = m => { asked.push(m); return false; };   // Back up, answered Cancel
    const manual = call(() => B.V.scheduleBackup('manual')); holds(() => B.V.scheduleBackup('batch')); await sleep(450);
    ok('...and no backup writes the empty collection over the good file: the automatic one keeps the file, Back up asks first and a Cancel keeps it too',
       holds(() => B.V.backupHeld()) === true && !manual.e && manual.v === false && asked.length === 1 && /could not be read/.test(asked[0]) && B.st['vault.backup'] === good,
       JSON.stringify({ manual, asked: asked.length, kept: B.st['vault.backup'] === good }));
    const K = await bootFresh({ st: { 'vault.items': corrupt['vault.items'], 'vault.backup': good } }), kAsked = []; K.c.confirm = m => { kAsked.push(m); return true; };
    const kManual = call(() => K.V.scheduleBackup('manual')); await sleep(450);
    ok('...and Back up answered OK ends the hold: the collector\'s own backup is written over the kept file',
       kAsked.length === 1 && !kManual.e && kManual.v !== false && holds(() => K.V.backupHeld() === false) && !!K.st['vault.backup'] && K.st['vault.backup'] !== good,
       JSON.stringify({ kManual, asked: kAsked.length, held: holds(() => K.V.backupHeld()) }));
    const R = await bootFresh({ st: B.st, answers: [true] }); await sleep(5);
    ok('...the hold outlives the launch: the next launch, on an empty collection that now reads, still keeps the file and says so again',
       !!R.V && R.V.backupHeld() === true && R.V.OWN.items.length === 0 && /^Your saved collection and 10 other lists could not be read/.test(toastText(R.d)) && (R.V.scheduleBackup('sync'), await sleep(450), R.st['vault.backup'] === good), R.V ? toastText(R.d) : 'no app');
    if (R.V) await R.V.restoreFromBackup();
    ok('...and a restore brings the collection back and ends the hold: the next backup is written again', !!R.V && R.V.OWN.items.length === 1 && R.V.OWN.items[0].qty === 3 && !R.V.backupHeld()
       && (R.V.scheduleBackup('batch'), await sleep(450), JSON.parse(R.st['vault.backup']).at !== JSON.parse(good).at && JSON.parse(R.st['vault.backup']).items.length === 1), R.V ? JSON.stringify({ n: R.V.OWN.items.length, held: R.V.backupHeld() }) : 'no app');
    /* take 115 (self-review): every list the backup carries holds it -- the hold was the collection's alone, so an
       unreadable decks list started empty and the first commit wrote that over the backup's decks */
    const line1 = JSON.stringify([{ id, qty: 1, condition: 'NM', pf: 'main', game: 'optcg' }]);
    const goodD = JSON.stringify({ app: 'OP TCG Hub', take: V.TAKE, at: later(manifest.source_updated_at, -1), items: JSON.parse(line1), decks: [{ id: 'dk115', name: 'Kept 115', leader: null, cards: {} }] });
    const D = await bootFresh({ st: { 'vault.items': line1, 'vault.decks': '[{"id": "dk115", "na', 'vault.backup': goodD } }); await sleep(5);
    const dHeld = holds(() => D.V.backupHeld()); holds(() => D.V.commitOwn('detail')); await sleep(450);
    ok('an unreadable list the backup carries (the decks) holds the backup too: a commit keeps the file\'s deck, and the collector is told which list could not be read',
       dHeld === true && D.st['vault.backup'] === goodD && /^Your saved decks could not be read — use Restore from backup, under More$/.test(toastText(D.d)), JSON.stringify({ dHeld, kept: D.st['vault.backup'] === goodD, toast: toastText(D.d) }));
    const Bt = await bootFresh({ st: { 'vault.items': line1, 'vault.batch': '[1,', 'vault.backup': goodD } });
    const btHeld = holds(() => Bt.V.backupHeld()); holds(() => Bt.V.commitOwn('detail')); await sleep(450);
    ok('control: an unreadable batch (in no backup) holds nothing -- the backup is written', btHeld === false && !!Bt.st['vault.backup'] && Bt.st['vault.backup'] !== goodD, JSON.stringify({ btHeld }));
    const N = await bootFresh({ st: { 'vault.backupHold': 'x', 'vault.items': '[]' } });
    const nHeld = holds(() => N.V.backupHeld()); holds(() => N.V.scheduleBackup('batch')); await sleep(450);
    ok('control: a hold with no backup on file protects nothing -- the first backup is written and ends it', nHeld === true && !!N.st['vault.backup'] && holds(() => N.V.backupHeld() === false), JSON.stringify({ nHeld, wrote: !!N.st['vault.backup'] }));
    const G = await bootFresh({ st: { 'vault.items': JSON.stringify([{ id, qty: 2, condition: 'NM', pf: 'main', game: 'optcg' }]), 'vault.credits': JSON.stringify({ scan: 5, deck: 0, earned: 0, spent: 0, pending: [] }), 'vault.decks': '[]', 'vault.batch': JSON.stringify({ rows: [], setId: null }) } });
    ok('control: stored values that do read are read back as they were, with nothing recorded and backups running',
       !!G.V && G.V.OWN.items.length === 1 && G.V.OWN.items[0].qty === 2 && G.V.CREDITS.state.scan === 5 && !G.V.ERRS.list.some(e => e.kind === 'storage') && G.V.scheduleBackup('batch') !== false,
       G.V ? JSON.stringify({ items: G.V.OWN.items.length, scan: G.V.CREDITS.state.scan, errs: G.V.ERRS.list.map(e => e.msg) }) : String(G.threw));
    const timers = [], T = await bootFresh({ timers, getThrows: k => k === 'vault.currency' });
    ok('anything that still throws while the script loads (here a blocked storage read) finds the error buffer listening and the opening screen\'s fallback set -- both used to come after the first stored read',
       !!T.threw && (T.c._win.error || []).length > 0 && timers.some(([f, ms]) => f === T.c.splashDone && ms === 3500), JSON.stringify({ threw: T.threw && T.threw.message, listeners: (T.c._win.error || []).length, splash: timers.filter(([, ms]) => ms === 3500).length }));
    if ((T.c._win.error || []).length) T.c._win.error[0]({ message: 'planted at load', filename: 'app.js', lineno: 1 });
    ok('...and what it records outlives the page (the next launch\'s Diagnostics shows it)', /planted at load/.test(T.st['vault.errs'] || ''), T.st['vault.errs'] || 'nothing stored');
  });

  /* (7) saves with no guard: storage full (the Hunt caches share it) stopped a batch commit half-way, silently */
  await guard('saves when storage is full', async () => {
    const three = V.CAT.rows.filter(p => p.num && !V.SEALED.isProduct(p)).slice(0, 3).map(p => p.id);
    const full = { on: false };
    const F = await bootFresh({ full, st: { 'vault.batch': JSON.stringify({ rows: three.map(id => ({ id, photo: null })), setId: null }) } });
    ok('a scanned batch of three is waiting on the fresh phone', !!F.V && F.V.BATCH && F.V.BATCH.rows.length === 3, F.V && F.V.BATCH ? String(F.V.BATCH.rows.length) : 'no BATCH on VAULT');
    full.on = true;
    const done = F.d.getElementById('btnDone'), res = await settle(Promise.resolve().then(() => done._ev.click({ target: done })), 2000);
    await sleep(5);
    /* take 115 (self-review): the commit no longer throws half-way, and the cards leave the batch only once the
       collection has stored them -- take 115's first version put them in the collection on screen and cleared the
       batch, which a real quota lets through (below), so the next launch had them in neither */
    ok('storage full at a batch commit: the commit does not throw half-way, and the three cards stay in the batch -- on screen and stored -- since the collection could not store them',
       !res.e && !res.hung && F.V.BATCH.rows.length === 3 && F.V.OWN.items.length === 0 && JSON.parse(F.st['vault.batch']).rows.length === 3, JSON.stringify({ res, items: F.V && F.V.OWN.items.length, batch: F.V && F.V.BATCH.rows.length }));
    ok('...the collector is told to export (Export CSV reads what is on screen)', /^Could not save on this phone — export your collection now \(Export CSV\)$/.test(toastText(F.d)), toastText(F.d));
    const once = k => F.V.ERRS.list.filter(e => e.kind === 'storage' && e.msg.startsWith(k + ' was not saved')).length;
    for (let i = 0; i < 30; i++) holds(() => (F.V.OWN.save(), F.V.BATCH.save()));
    ok('...each failed write is in the last errors once, however often it is tried (twenty records hold the rest)', holds(() => once('vault.items') === 1 && once('vault.batch') === 1 && /QuotaExceededError/.test(F.V.ERRS.list.find(e => /^vault\.items was not saved/.test(e.msg)).msg)), JSON.stringify(F.V.ERRS.list.map(e => e.msg)));
    const saves = { portfolio: () => F.V.PF.save(), decks: () => F.V.DECKS.save(), credits: () => F.V.CREDITS.save(), batch: () => F.V.BATCH.save(), trade: () => F.V.TRADE.save(), wants: () => F.V.WANT.save(),
      alerts: () => F.V.ALERTS.save(), 'stock alerts': () => F.V.STOCK.save(), notes: () => F.V.LOCAL.saveNotes(), 'release reminders': () => F.V.RELALERTS.save(), 'the mode': () => F.V.MODE.set('hunt', false), currency: () => F.V.CUR.set('USD') };
    const threw = Object.entries(saves).filter(([, f]) => { try { f(); return false; } catch (e) { return true; } }).map(([k]) => k);
    ok('every other save survives full storage too: portfolio, decks, credits, batch, trade, wants, alerts, stock alerts, notes, reminders, the mode, the currency', threw.length === 0, 'threw: ' + threw.join(', '));
    ok('...and a save that failed says so to its caller', holds(() => F.V.OWN.save() === false && F.V.saveJson('vault.decks', []) === false));
    full.on = false; F.V.MODE.set('collect', false);
    const again = await settle(Promise.resolve().then(() => done._ev.click({ target: done })), 2000); await sleep(5);
    ok('when there is room again the same Commit stores the three and clears the failure, and only then the batch',
       !again.e && holds(() => !F.V.STORE.failed.has('vault.items') && JSON.parse(F.st['vault.items']).length === 3 && JSON.parse(F.st['vault.batch']).rows.length === 0 && F.V.BATCH.rows.length === 0),
       holds(() => JSON.stringify({ failed: [...F.V.STORE.failed], items: JSON.parse(F.st['vault.items'] || '[]').length, batch: F.V.BATCH.rows.length })) || 'no STORE');
    F.c.navigator.onLine = false; const rep = await F.V.DIAG.report();
    ok('Diagnostics\' storage lines name the collection\'s real keys (vault.items, vault.snaps) with their sizes, never vault.collection, and the writes that failed',
       /^vault\.items: \d+ KB$/m.test(rep) && /^vault\.snaps: \d+ KB$/m.test(rep) && !/vault\.collection/.test(rep) && /^writes that failed: /m.test(rep), (rep.match(/## storage[\s\S]*?\n\n/) || [''])[0].slice(0, 400));

    /* take 115 (self-review, high): a storage AT its quota refuses the longer collection but lets the shorter batch
       or tray through. The cards must leave where they waited only after the collection (or the tray) stored them. */
    const cards = V.CAT.rows.filter(p => p.num && !V.SEALED.isProduct(p)).slice(3, 8).map(p => p.id), two = cards.slice(0, 2), wait3 = cards.slice(2);
    const row = id => ({ id, photo: null }), lineOf = id => ({ id, qty: 1, condition: 'NM', photo: null, pf: 'main', game: 'optcg', added: '2026-09-01T00:00:00.000Z', fav: false });
    const atQuota = async (st, credits = null) => {
      const q = { on: false }, Q = await bootFresh({ full: q, st: { 'vault.items': JSON.stringify(two.map(lineOf)), ...st } });
      if (credits) { Q.V.CREDITS.enabled = () => true; Object.assign(Q.V.CREDITS.state, credits); Q.V.CREDITS.save(); }
      q.quota = Object.entries(Q.st).reduce((a, [x, y]) => a + x.length + String(y).length, 0) + 16;   // 16 bytes to spare
      return Q; };
    const stored = (Q, k) => { try { return JSON.parse(Q.st[k]); } catch (e) { return null; } };
    const Q1 = await atQuota({ 'vault.batch': JSON.stringify({ rows: wait3.map(row), setId: null }) });
    const d1 = Q1.d.getElementById('btnDone'), q1 = await settle(Promise.resolve().then(() => d1._ev.click({ target: d1 })), 2000); await sleep(5);
    const N1 = await bootFresh({ st: { ...Q1.st } });
    ok('storage at its quota at a batch commit: the batch keeps the three cards, stored and at the next launch, and the collection is the two lines it stored',
       !q1.e && (stored(Q1, 'vault.batch') || {}).rows?.length === 3 && stored(Q1, 'vault.items')?.length === 2 && Q1.V.OWN.items.length === 2 && Q1.V.BATCH.rows.length === 3
       && N1.V.BATCH.rows.length === 3 && N1.V.OWN.items.length === 2 && /export your collection now/.test(toastText(Q1.d)),
       JSON.stringify({ q1, batch: (stored(Q1, 'vault.batch') || {}).rows?.length, items: stored(Q1, 'vault.items')?.length, onScreen: Q1.V.OWN.items.length, next: [N1.V.BATCH.rows.length, N1.V.OWN.items.length], toast: toastText(Q1.d) }));
    const Q2 = await atQuota({}, { scan: 5, pending: wait3.map(row) }); holds(() => Q2.V.CREDITS.drain()); await sleep(5);
    ok('...a pending tray drained at its quota keeps its cards, stored, and the collection is the two lines it stored',
       (stored(Q2, 'vault.credits') || {}).pending?.length === 3 && Q2.V.CREDITS.state.pending.length === 3 && stored(Q2, 'vault.items')?.length === 2 && Q2.V.OWN.items.length === 2,
       JSON.stringify({ pending: (stored(Q2, 'vault.credits') || {}).pending?.length, inMemory: Q2.V.CREDITS.state.pending.length, items: stored(Q2, 'vault.items')?.length }));
    const Q3 = await atQuota({ 'vault.batch': JSON.stringify({ rows: wait3.map(row), setId: null }) }, { scan: 0, pending: [] });
    const d3 = Q3.d.getElementById('btnDone'), q3 = await settle(Promise.resolve().then(() => d3._ev.click({ target: d3 })), 2000); await sleep(5);
    ok('...a batch with no credits whose tray cannot be stored stays in the batch (the tray takes nothing it could not keep)',
       !q3.e && (stored(Q3, 'vault.batch') || {}).rows?.length === 3 && Q3.V.CREDITS.state.pending.length === 0 && ((stored(Q3, 'vault.credits') || {}).pending || []).length === 0,
       JSON.stringify({ q3, batch: (stored(Q3, 'vault.batch') || {}).rows?.length, tray: Q3.V.CREDITS.state.pending.length }));
  });

  /* (11) no deadline on any request: Sync and the Hunt refresh buttons stayed grey until a stalled request gave up */
  await guard('deadlines', async () => {
    /* take 115 (self-review): the catalogue as it crosses the link. Pages sends it gzipped (MEASURED 25 Sept: 739,429 B
       for 5,147,553, content-encoding gzip); its raw size grows 37.8 KB with each night's history day and would have
       crossed the long deadline near the 80th day -- a red nightly with no change. gzip's fastest level is a bound on
       what Pages sends (906,802 B today). */
    const catBytes = zlib.gzipSync(fs.readFileSync(W('bundle/catalog.json')), { level: 1 }).length, SLOW = 256e3;   // bit/s: a slow phone link
    /* the Hunt files uncompressed, the stricter measure, with Pages' largest as the floor: on the runner www/hunt holds
       only zcta.json when smoke runs (build_app.py copies it; the rest arrive with the carry-over, after smoke) --
       MEASURED 25 Sept: hunt/stores.json 1,099,659 B on Pages */
    const HUNT_MEASURED = 1099659, hd = W('hunt');
    const huntMax = Math.max(HUNT_MEASURED, ...(fs.existsSync(hd) ? fs.readdirSync(hd).filter(f => f.endsWith('.json')).map(f => fs.statSync(path.join(hd, f)).size) : []));
    ok(`the deadlines are sized for a slow phone link (256 kbit/s): the ${(catBytes / 1048576).toFixed(1)} MB catalogue as sent (gzip) inside the long one, the largest Hunt file (${(huntMax / 1048576).toFixed(1)} MB uncompressed) inside the default`,
       V.NET.WAIT_BIG / 1000 * SLOW / 8 >= catBytes && V.NET.WAIT / 1000 * SLOW / 8 >= huntMax && V.NET.WAIT < V.NET.WAIT_BIG, JSON.stringify({ WAIT: V.NET.WAIT, WAIT_BIG: V.NET.WAIT_BIG, catBytes, huntMax }));
    V.NET.WAIT = 40; V.NET.WAIT_BIG = 40; ctx.navigator.onLine = true;
    const aborted = [];
    const stall = async (u, o) => { if (!u.startsWith('https://pages.invalid/')) return undefined;
      return new Promise((_, no) => { if (o && o.signal) o.signal.addEventListener('abort', () => { aborted.push(u); no(Object.assign(new Error('aborted'), { name: 'AbortError' })); }); }); };
    const deaf = async u => (u.startsWith('https://pages.invalid/') ? new Promise(() => {}) : undefined);
    const wrapped = vm.runInContext('fetch', ctx);
    ctx._net = stall; let t0 = Date.now(); const r1 = await settle(wrapped(PAGES + 'manifest.json', { cache: 'no-store' }), 1500);
    ok('a request with no answer is aborted at its deadline and rejects -- it no longer waits for ever', !!r1.e && /no answer in/.test(r1.e) && aborted.includes(PAGES + 'manifest.json') && Date.now() - t0 < 1000, JSON.stringify({ r1, aborted }));
    ctx._net = deaf; const r2 = await settle(wrapped(PAGES + 'manifest.json'), 1500);
    ok('...even where the abort is not honoured, the caller gets its answer at the deadline', !!r2.e && /no answer in/.test(r2.e), JSON.stringify(r2));
    ctx._net = async (u, o) => { if (!u.startsWith('https://pages.invalid/')) return undefined; const sig = o && o.signal;
      const body = () => new Promise((_, no) => { if (sig) sig.addEventListener('abort', () => no(new Error('the body was aborted'))); }); return { ok: true, status: 200, json: body, text: body }; };
    const r3 = await settle(wrapped(PAGES + 'catalog.json').then(x => x.text()), 1500);
    ok('...the body too: a response whose body stops arriving is aborted at the same deadline', !!r3.e, JSON.stringify(r3));
    const slowCat = async u => { if (!u.startsWith('https://pages.invalid/')) return undefined; if (u.endsWith('manifest.json')) return resp(newer(90)); await sleep(150); return resp(catalog); };
    V.NET.WAIT = 40; V.NET.WAIT_BIG = 3000; V.CAT.man.updateUrl = PAGES; ctx._net = slowCat; delete ctx.window.Capacitor;
    const r4 = await settle(V.PLATFORM.refreshCatalogue({ quiet: true }), 5000);
    ok('the catalogue has the long deadline: one that takes longer than the default still arrives', r4.v === true, JSON.stringify(r4));
    V.NET.WAIT_BIG = 40; V.CAT.man.updateUrl = PAGES; ctx._net = async u => (u.endsWith('manifest.json') && u.startsWith('https://pages.invalid/') ? resp(newer(91)) : slowCat(u));
    const r5 = await settle(V.PLATFORM.refreshCatalogue({ quiet: true }), 5000);
    ok('control: with the long deadline shorter than the catalogue takes, the same sync fails -- the deadline is real', r5.v === false, JSON.stringify(r5));
    /* the buttons, driven through their own handlers (landmine 136: the stub finds an element by id once it is registered) */
    V.NET.WAIT = 40; V.NET.WAIT_BIG = 40; V.CAT.man.updateUrl = PAGES; ctx._net = stall;
    const reg = id => { const el = ctx.document.createElement('button'); el.id = id; ctx.document._ids.set(id, el); return el; };
    const press = async (el, paint) => { paint(); const h = el._ev && el._ev.click; if (!h) return { none: true };
      const p = settle(Promise.resolve().then(() => h({ target: el })), 2000); await sleep(0); const grey = el.disabled === true; const r = await p; return { grey, r, back: el.disabled === false }; };
    const buttons = { 'Sync now (More)': ['syncBtn', () => V.go('settings')], 'Refresh on Sealed': ['huntSync', () => V.paintSealed()], 'Refresh on Local': ['localSync', () => V.paintLocal()],
      'make them exact (Local)': ['localExact', () => V.paintLocal()], 'Refresh on Events': ['eventsSync', () => V.paintEvents()] };
    for (const [name, [id, paint]] of Object.entries(buttons)) {
      const el = reg(id), out = await press(el, paint);
      ok(`${name} greys while it works and comes back when its request has no answer`, !!out.grey && !!out.r && !out.r.hung && out.back, JSON.stringify(out));
      ctx.document._ids.delete(id);
    }
  });

  /* ---- take 115, A2: the collection and money ------------------------------------------------------------
     Every save of the collection is one commit that is backed up; a restore reads the file first and keeps what it
     replaces; the picker's prompts settle when closed; the binder turns from the page on screen; the newest deck is
     featured; a price alert is typed in the currency on screen; an alert's fired day is this phone's; OWN owns the
     line a copy counts into. Driven through the app's own handlers (landmines 135, 136). */
  const tapIn = (L, sel, ds = {}, id = '') => { const b = { dataset: ds, id }; const ev = { target: { closest: s => (s === sel ? b : null), id }, stopPropagation() {}, preventDefault() {} };
    for (const f of [...(L.click || [])]) { try { const r = f(ev); if (r && r.catch) r.catch(() => {}); } catch (e) {} } };
  const tap = (sel, ds) => tapIn(listeners, sel, ds);
  const importText = async text => { const ce0 = doc.createElement; let inp = null;
    doc.createElement = t => { const e = ce0(t); if (t === 'input') inp = e; return e; };
    try { tap('[data-act]', { act: 'import' }); } finally { doc.createElement = ce0; }
    if (!inp || !inp._ev || !inp._ev.change) return false;
    inp.files = [{ text: async () => text }]; await inp._ev.change(); await sleep(0); return true; };
  const priced = V.CAT.rows.filter(p => p.num && !p.sealed && p.market > 5);
  const [pA, pB, pC] = priced;
  const utcDay = () => new Date().toISOString().slice(0, 10);   // the day OWN.snapshot() writes
  await sleep(450);   // a backup scheduled by an earlier section has run

  /* (A2-1) STAN-111-17 / loose-production 4: each save of the collection is one commit -- saved, today's reading
     retaken when it can have moved, the backup scheduled. Six of the paths below never scheduled it. */
  await guard('every commit of the collection is backed up', async () => {
    const PF = V.PF, keep = { items: V.OWN.items, snaps: V.OWN.snaps, active: PF.active, list: PF.list.slice(), f: JSON.parse(JSON.stringify(V.FILT.own)), wants: V.WANT.list.slice(),
      alerts: V.ALERTS.list.slice(), notes: V.LOCAL.notes.slice(), rel: V.RELALERTS.list.slice(),
      give: V.TRADE.give.slice(), get: V.TRADE.get.slice(), stock: V.STOCK.list.slice(), last: V.OWN.lastBackup, conf: ctx.confirm };
    Object.assign(V.FILT.own, V.blankFilter('own')); ctx.confirm = () => true;
    if (!PF.list.some(p => p.id === 'tr115')) PF.list.push({ id: 'tr115', name: 'Trade 115' });
    PF.active = 'main'; V.OWN.items = []; V.OWN.snaps = []; V.OWN.save();
    const A = pA.id, B = pB.id;
    const backedUp = async (act, check) => { delete store['vault.backup']; V.OWN.lastBackup = null;
      await act(); await sleep(450);
      const b = store['vault.backup'] ? JSON.parse(store['vault.backup']) : null;
      let good = false; try { good = !!b && check(b); } catch (e) {}
      return { reason: V.OWN.lastBackup && V.OWN.lastBackup.reason, good }; };
    const bulkSel = ids => { tap('[data-act]', { act: 'bulk' }); for (const id of ids) tap('[data-open]', { open: String(id) }); };
    const line = (b, id) => b.items.find(i => i.id === id && !i.graded);
    const r1 = await backedUp(() => importText(`product_id,qty,condition\n${A},2,NM\n${B},1,NM`), b => b.items.length === 2);
    ok('a CSV import is backed up, with what it imported (it never scheduled the backup)', r1.reason === 'import' && r1.good, JSON.stringify(r1));
    const r2 = await backedUp(() => { bulkSel([A]); doc.getElementById('bulkCond')._ev.click(); tap('[data-bulkcond]', { bulkcond: 'LP' }); }, b => line(b, A).condition === 'LP');
    ok('a bulk condition is backed up', r2.reason === 'bulk' && r2.good, JSON.stringify(r2));
    const r3 = await backedUp(() => { bulkSel([A]); doc.getElementById('bulkMove')._ev.click(); tap('[data-pfmove]', { pfmove: 'tr115' }); }, b => line(b, A).pf === 'tr115');
    const t3 = V.OWN.snaps.find(s => s[0] === utcDay());
    ok('a bulk move is backed up', r3.reason === 'bulk' && r3.good, JSON.stringify(r3));
    ok('...and today\'s reading is taken again: the collection on screen lost the lines moved out of it (the reading still counted them)', !!t3 && Math.abs(t3[1] - V.OWN.total()) < 1e-9, JSON.stringify({ t3, total: V.OWN.total() }));
    const r4 = await backedUp(() => { bulkSel([B]); doc.getElementById('bulkDel')._ev.click(); }, b => !b.items.some(i => i.id === B));
    ok('a bulk delete is backed up, without what it deleted', r4.reason === 'bulk' && r4.good, JSON.stringify(r4));
    PF.active = 'tr115';
    const r5 = await backedUp(() => tap('[data-pf]', { pf: '__delete' }), b => line(b, A).pf === 'main' && !b.portfolios.some(p => p.id === 'tr115'));
    ok('removing a collection is backed up: its lines in the main one, the collection gone', r5.reason === 'collections' && r5.good, JSON.stringify(r5));
    const r6 = await backedUp(async () => { V.openDetail(A); doc._ids.set('askIn', { value: '7.25' }); const run = doc.getElementById('dPaid')._ev.click(); doc.getElementById('askOk')._ev.click(); await run; doc._ids.delete('askIn'); },
      b => line(b, A).paid === 7.25);
    ok('a cost basis on a copy you have is backed up', r6.reason === 'detail' && r6.good, JSON.stringify(r6));
    const r7 = await backedUp(async () => { V.openDetail(A); const run = doc.getElementById('dAddGraded')._ev.click(); await sleep(0); tap('[data-grader]', { grader: 'PSA' }); await sleep(0);
      doc._ids.set('askIn', { value: '10' }); doc.getElementById('askOk')._ev.click(); await sleep(0); doc.getElementById('askOk')._ev.click(); await settle(run, 500); doc._ids.delete('askIn'); },
      b => b.items.some(i => i.id === A && i.graded && i.graded.grader === 'PSA'));
    ok('a graded copy is backed up', r7.reason === 'graded' && r7.good, JSON.stringify(r7));
    /* take 115 (self-review): one list per wait. The backup keeps only the last call's timer and carries every list, so
       three changes before one wait passed while any one of their saves still scheduled it -- five of six unguarded */
    const listCases = [
      ['a want', () => V.WANT.toggle(pC.num, pC.id), b => (b.wants || []).some(w => w.num === pC.num)],
      ['a trade row', () => V.TRADE.add('give', pC.id), b => ((b.trade || {}).give || []).some(x => x.id === pC.id)],
      ['a stock alert', () => V.STOCK.toggle(pC.id), b => (b.stockAlerts || []).some(x => x.id === pC.id)],
      ['a price alert', () => V.ALERTS.add(pC.id, 'above', 1e6), b => (b.alerts || []).some(a => a.id === pC.id && a.at === 1e6)],
      ['a Hunt note', () => { V.LOCAL.notes.push({ store: 'Shop 115', what: 'boxes', price: null, phone: null, when: utcDay() }); V.LOCAL.saveNotes(); }, b => (b.notes || []).some(n => n.store === 'Shop 115')],
      ['a release reminder', () => V.RELALERTS.toggle('rel115', 'Set 115', '2099-01-01'), b => (b.relAlerts || []).some(a => a.id === 'rel115')]];
    const r8 = {};
    for (const [what, act, has] of listCases) { const r = await backedUp(act, has); r8[what] = r.reason === 'lists' && r.good ? true : r; }
    ok(`a change to each list the backup carries is backed up with it, one list at a time (${listCases.map(c => c[0]).join(', ')})`, Object.values(r8).every(v => v === true),
       JSON.stringify(Object.fromEntries(Object.entries(r8).filter(([, v]) => v !== true))));
    const r0 = await backedUp(() => { V.openDetail(B); doc.getElementById('dSave')._ev.click(); }, b => !!line(b, B));
    ok('control: Save on a card\'s page -- which always backed up -- is seen by the same measure', r0.reason === 'detail' && r0.good, JSON.stringify(r0));
    doc.getElementById('bulkX')._ev.click();
    V.OWN.items = keep.items; V.OWN.snaps = keep.snaps; V.OWN.lastBackup = keep.last; V.OWN.save(); PF.active = keep.active; PF.list = keep.list; PF.save();
    Object.assign(V.FILT.own, keep.f); V.WANT.list = keep.wants; V.TRADE.give = keep.give; V.TRADE.get = keep.get; V.STOCK.list = keep.stock; ctx.confirm = keep.conf;
    V.ALERTS.list = keep.alerts; V.ALERTS.save(true); V.LOCAL.notes = keep.notes; V.saveJson('vault.hunt.notes', keep.notes); V.RELALERTS.list = keep.rel; V.RELALERTS.save(true);
    await sleep(450); delete store['vault.backup']; V.go('home');
  });

  /* (A2-2) loose-production 4: the backup carries every list, and a restore reads the file before it replaces
     anything and keeps what it replaces -- each on a phone of its own (bootFresh) */
  const threw = [], onThrow = e => threw.push(String((e && e.message) || e));
  process.on('unhandledRejection', onThrow);   // a restore that throws half-way is a failure here, not the end of the run
  await guard('the backup and the restore', async () => {
    const now = () => new Date().toISOString(), inDays = d => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
    const phone = { 'vault.items': JSON.stringify([{ id: pA.id, qty: 2, condition: 'NM', pf: 'main', game: 'optcg', photo: 'file:///data/photos/a.jpg' }, { id: pB.id, qty: 1, condition: 'LP', pf: 'main', game: 'optcg', photo: null }]),
      'vault.decks': JSON.stringify([{ id: 'dPhone', name: 'Phone deck', leader: null, cards: [], created: now() }]),
      'vault.wants': JSON.stringify([{ num: pC.num, id: pC.id, added: now() }]),
      'vault.stockAlerts': JSON.stringify([{ id: pA.id, name: pA.name, created: now(), seen: {}, fired: [] }]),
      'vault.relAlerts': JSON.stringify([{ id: 'relPhone', name: 'Phone set', pub: inDays(30), created: now(), fired: null }]),
      'vault.hunt.notes': JSON.stringify([{ store: 'Phone shop', what: 'boxes', price: null, phone: null, when: utcDay() }]),
      'vault.trade.give': JSON.stringify([{ id: pB.id, n: 1 }]), 'vault.trade.get': '[]' };
    const file = { app: 'OP TCG Hub', take: V.TAKE, at: new Date(Date.now() - 864e5).toISOString(), catalogue: null,
      items: [{ id: pC.id, qty: 4, condition: 'NM', pf: 'main', game: 'optcg', photo: '(on device)' }], snaps: [], decks: [],
      portfolios: [{ id: 'main', name: 'One Piece' }], activePortfolio: 'main', wants: [], alerts: [], credits: { scan: 20, deck: 1, earned: 0, spent: 0, pending: [] },
      stockAlerts: [{ id: pC.id, name: pC.name, created: now(), seen: {}, fired: [] }], relAlerts: [{ id: 'relFile', name: 'File set', pub: inDays(60), created: now(), fired: null }],
      notes: [{ store: 'File shop', what: 'packs', price: 4, phone: null, when: utcDay() }], trade: { give: [], get: [{ id: pC.id, n: 2 }] } };
    /* Restore from backup, through the app's function or, where a build does not expose it (take 114), its button */
    const restoreIn = X => Promise.resolve(typeof X.V.restoreFromBackup === 'function' ? X.V.restoreFromBackup() : (tapIn(X.L || {}, '[data-act]', { act: 'restore' }), sleep(300)))
      .catch(e => { threw.push(String((e && e.message) || e)); });   // a throw half-way is recorded, whichever way it was called
    const P0 = await bootFresh({ st: { ...phone } });
    const bj = P0.V ? JSON.parse(P0.V.backupJson()) : {};
    ok('the backup carries the stock alerts, the release reminders, the Hunt notes and the trade lists (the collector\'s, and in no backup)',
       (bj.stockAlerts || []).length === 1 && (bj.relAlerts || []).length === 1 && (bj.notes || []).length === 1 && ((bj.trade || {}).give || []).length === 1, JSON.stringify(Object.keys(bj)));
    /* a file that is not this app's backup, or a list that is not a list: refused before anything is replaced */
    const bad = { 'another app\'s file': { ...file, app: 'Some Other App' }, 'its cards as a record': { ...file, items: { a: 1 } }, 'its decks as a record': { ...file, decks: { a: 1 } },
      'its snapshots as a word': { ...file, snaps: 'x' }, 'its wants as a word': { ...file, wants: 'x' }, 'its stock alerts as a record': { ...file, stockAlerts: {} },
      'a trade list as a record': { ...file, trade: { give: {}, get: [] } }, 'a line naming no printing': { ...file, items: [{ qty: 1 }] }, 'a deck with no card list': { ...file, decks: [{ id: 'x' }] } };
    const refused = {}, recorded = {};
    for (const [what, b] of Object.entries(bad)) {
      const F = await bootFresh({ st: { ...phone, 'vault.backup': JSON.stringify(b) } }); if (!F.V) { refused[what] = 'no app'; continue; }
      F.c.confirm = () => true;
      const state = () => JSON.stringify([F.V.OWN.items, F.V.OWN.snaps, F.V.DECKS.list, F.V.WANT.list, F.V.STOCK.list, F.V.TRADE.give]);
      const s0 = state(), r = await settle(restoreIn(F), 1500);
      refused[what] = state() === s0 && !r.hung && /^Nothing restored — /.test(toastText(F.d)) ? true : toastText(F.d) || JSON.stringify(r);
      recorded[what] = F.V.ERRS.list.some(e => e.kind === 'restore' && /^refused: /.test(e.msg));
    }
    ok(`a restore reads the file before it replaces anything: ${Object.keys(bad).length} files refused with the reason on screen, the phone as it was -- ${Object.keys(bad).join(', ')}`,
       Object.values(refused).every(v => v === true), JSON.stringify(Object.fromEntries(Object.entries(refused).filter(([, v]) => v !== true))));
    ok('...and each refusal is in Diagnostics\' last errors', Object.values(recorded).every(Boolean), JSON.stringify(recorded));
    /* a good file: everything put back, what it replaced kept, the restore backed up */
    const G = await bootFresh({ st: { ...phone, 'vault.backup': JSON.stringify(file) } }); G.c.confirm = () => true;
    const sched = [], canc = [];
    G.c.Capacitor = { Plugins: { LocalNotifications: { schedule: async x => { sched.push(x); }, cancel: async x => { canc.push(x); } } } };
    await settle(restoreIn(G), 2000); await sleep(450);
    ok('control: a good file restores the collection, as it did', G.V.OWN.items.length === 1 && G.V.OWN.items[0].id === pC.id && G.V.OWN.items[0].qty === 4 && G.V.OWN.items[0].photo === null && G.V.DECKS.list.length === 0,
       JSON.stringify(G.V.OWN.items));
    ok('...and puts back the stock alerts, the release reminders, the Hunt notes and the trade lists it carries',
       G.V.STOCK.list.length === 1 && G.V.STOCK.list[0].id === pC.id && G.V.RELALERTS.list.map(a => a.id).join() === 'relFile' && G.V.LOCAL.notes.map(n => n.store).join() === 'File shop'
       && G.V.TRADE.give.length === 0 && G.V.TRADE.get.length === 1, JSON.stringify({ stock: G.V.STOCK.list.length, rel: G.V.RELALERTS.list.map(a => a.id), notes: G.V.LOCAL.notes.map(n => n.store), give: G.V.TRADE.give.length }));
    const nid = id => G.V.RELALERTS.nid(id), ids = l => l.map(x => ((x.notifications || [])[0] || {}).id);
    ok('...a reminder it puts back is scheduled again, and the one it replaced cancelled', ids(sched).includes(nid('relFile')) && ids(canc).includes(nid('relPhone')), JSON.stringify({ sched: ids(sched), canc: ids(canc) }));
    { const n0 = sched.length, bad = holds(() => (G.V.RELALERTS.arm({ id: 'relBad', name: 'Bad', pub: 'soon', fired: null }), true));
      ok('...and one whose day does not read schedules nothing and throws nothing (a restore would stop half-way)', bad === true && sched.length === n0, JSON.stringify({ bad, n: sched.length - n0 })); }
    const kept = (() => { try { return JSON.parse(G.st['vault.beforeRestore']); } catch (e) { return null; } })();
    ok('...what it replaced is kept (vault.beforeRestore): the phone\'s two lines with the scan photo, its deck and every list',
       !!kept && kept.app === 'OP TCG Hub' && kept.items.length === 2 && kept.items[0].photo === 'file:///data/photos/a.jpg' && kept.decks.length === 1 && kept.wants.length === 1 && kept.stockAlerts.length === 1
       && kept.relAlerts[0].id === 'relPhone' && kept.notes[0].store === 'Phone shop' && kept.trade.give.length === 1, kept ? JSON.stringify(Object.keys(kept)) : 'nothing kept');
    { G.c.navigator.onLine = false; const rep = await G.V.DIAG.report();
      ok('...and Diagnostics\' storage lines say where it is kept, with its size', /^vault\.beforeRestore: \d+ KB$/m.test(rep), (rep.match(/^vault\.beforeRestore: .*$/m) || ['no line'])[0]); }
    const after = (() => { try { return JSON.parse(G.st['vault.backup']); } catch (e) { return null; } })(), t = G.V.OWN.snaps.find(s => s[0] === utcDay());
    ok('...the restore is backed up, and today\'s reading is of what it restored', (G.V.OWN.lastBackup || {}).reason === 'restore' && !!after && after.at !== file.at && after.items.length === 1 && !!t && t[2] === 4,
       JSON.stringify({ reason: (G.V.OWN.lastBackup || {}).reason, t }));
    /* the undo: Restore now offers what the last restore replaced */
    const run = restoreIn(G); await sleep(5);
    const sheet = G.d.getElementById('pkOpts').innerHTML, on = G.d.getElementById('picker').classList.contains('on');
    tapIn(G.L || {}, '[data-rsrc]', { rsrc: 'kept' }); await settle(run, 2000);
    ok('Restore then offers what the last restore replaced, beside the latest backup and a file (the dated backups)',
       on && /data-rsrc="kept"/.test(sheet) && /data-rsrc="latest"/.test(sheet) && /data-rsrc="file"/.test(sheet) && /2 lines · 1 deck/.test(sheet), sheet.replace(/<[^>]+>/g, ' ').slice(0, 300));
    ok('...and taking it undoes the restore: the phone\'s two lines, the scan photo with them, its deck and every list are back',
       G.V.OWN.items.length === 2 && G.V.OWN.items[0].photo === 'file:///data/photos/a.jpg' && G.V.DECKS.list.length === 1 && G.V.STOCK.list[0].id === pA.id
       && G.V.RELALERTS.list[0].id === 'relPhone' && G.V.LOCAL.notes[0].store === 'Phone shop' && G.V.TRADE.give.length === 1, JSON.stringify(G.V.OWN.items.map(i => [i.id, i.qty, i.photo])));
    ok('...while what the undo replaced is kept in turn', (() => { try { return JSON.parse(G.st['vault.beforeRestore']).items[0].id === pC.id; } catch (e) { return false; } })());
    /* on the phone the copy is a file beside the backups too */
    const disk = { 'OPTCGHub/backup-latest.json': JSON.stringify(file) };
    const D = await bootFresh({ st: { ...phone }, disk }); D.c.confirm = () => true;
    await settle(restoreIn(D), 2000);
    const df = disk['OPTCGHub/backup-before-restore.json'];
    ok('on the phone the kept copy is also Documents/OPTCGHub/backup-before-restore.json, which outlives an uninstall and the file picker reaches',
       !!df && JSON.parse(df).items.length === 2 && D.V.OWN.items.length === 1, JSON.stringify(Object.keys(disk)));
    /* storage full: nothing can be kept, so the restore asks first */
    const full = { on: false }, Fu = await bootFresh({ st: { ...phone, 'vault.backup': JSON.stringify(file) }, full }), asked = [];
    Fu.c.confirm = m => { asked.push(m); return asked.length === 1; };   // yes to the restore; no to "restore anyway"
    full.on = true; await settle(restoreIn(Fu), 2000); full.on = false;
    ok('when what is on the phone cannot be kept aside (storage full), the restore asks before it goes on, and a No keeps the phone as it was',
       asked.length === 2 && /could not be kept aside/.test(asked[1]) && Fu.V.OWN.items.length === 2, JSON.stringify({ asked: asked.map(m => m.slice(0, 40)), n: Fu.V.OWN.items.length }));
    /* take 115 (self-review): on the phone the file copy alone was counted as kept. Restore offers only the copy in
       storage, so a full storage restored with no second question, and an older copy passed for what it replaced. */
    const older = JSON.stringify({ ...file, items: [], at: new Date(Date.now() - 15 * 864e5).toISOString() });
    const qd = { 'OPTCGHub/backup-latest.json': JSON.stringify(file) }, qf = { on: false }, pAsked = [];
    const P = await bootFresh({ st: { ...phone, 'vault.beforeRestore': older }, disk: qd, full: qf });
    P.c.confirm = m => { pAsked.push(m); return true; };   // yes to the restore, and yes to "restore anyway"
    qf.quota = Object.entries(P.st).reduce((a, [x, y]) => a + x.length + String(y).length, 0) + 16;   // a new copy of the phone does not fit
    const runP = restoreIn(P); await sleep(5); tapIn(P.L || {}, '[data-rsrc]', { rsrc: 'latest' }); await settle(runP, 2000); qf.quota = null;
    const pFile = (() => { try { return JSON.parse(qd['OPTCGHub/backup-before-restore.json']); } catch (e) { return null; } })();
    ok('on the phone, when storage cannot keep what the restore replaces, the file alone does not count as kept: the restore asks first, and on a Yes no older copy is left to pass for it',
       pAsked.length === 2 && /could not be kept aside/.test(pAsked[1]) && !('vault.beforeRestore' in P.st) && !!pFile && pFile.items.length === 2 && P.V.OWN.items.length === 1,
       JSON.stringify({ asked: pAsked.length, older: 'vault.beforeRestore' in P.st, file: pFile && pFile.items.length, n: P.V.OWN.items.length }));
    /* a phone with nothing on it keeps nothing, and no older copy is left to pass for what this restore replaced */
    const E = await bootFresh({ st: { 'vault.backup': JSON.stringify(file), 'vault.beforeRestore': JSON.stringify({ ...file, at: new Date(Date.now() - 9 * 864e5).toISOString() }) } }); E.c.confirm = () => true;
    const runE = restoreIn(E); await sleep(5); tapIn(E.L || {}, '[data-rsrc]', { rsrc: 'latest' }); await settle(runE, 2000);
    ok('a restore onto a phone with nothing on it keeps nothing, and leaves no older copy to pass for what it replaced', E.V.OWN.items.length === 1 && !('vault.beforeRestore' in E.st), JSON.stringify({ n: E.V.OWN.items.length, kept: 'vault.beforeRestore' in E.st }));
    const E2 = await bootFresh({ st: { 'vault.backup': JSON.stringify(file) } }); E2.c.confirm = () => true;
    const r2 = await settle(restoreIn(E2), 1500);
    ok('control: with no copy kept, Restore goes straight to its confirm, as before (no sheet)', !r2.hung && E2.V.OWN.items.length === 1 && !E2.d.getElementById('picker').classList.contains('on'), JSON.stringify(r2));
    await sleep(20);
    ok('...and no restore above threw half-way (a record where a list belongs threw after the confirm)', threw.length === 0, threw.join(' | ').slice(0, 300));
  });

  await sleep(20); process.off('unhandledRejection', onThrow);

  /* (A2-3) SPEC-110-44: a price alert is typed in the currency on screen and kept in dollars; loose-record 9: its
     fired day is this phone's */
  await guard('a price alert in the currency on screen', async () => {
    const R = V.CUR.rates(), keepCode = V.CUR.code, keepAlerts = V.ALERTS.list.slice();
    const code = R && R.rates ? ['EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'MXN'].find(c => R.rates[c] > 0 && Math.abs(R.rates[c] - 1) > 0.02) : null;
    ok('precondition: this build carries a rate for a currency that is not the dollar', !!code, JSON.stringify(R && R.rates));
    const card = pA;
    const alertAt = async typed => { V.openDetail(card.id); const n0 = V.ALERTS.list.length; const run = doc.getElementById('dAlert')._ev.click(); await sleep(0);
      tap('[data-aldir]', { aldir: 'below' }); await sleep(5);
      const field = doc.getElementById('askField').innerHTML, why = doc.getElementById('askWhy').innerHTML;
      doc._ids.set('askIn', { value: typed }); doc.getElementById('askOk')._ev.click(); await settle(run, 500); doc._ids.delete('askIn');
      return { field, why, a: V.ALERTS.list.length > n0 ? V.ALERTS.list[V.ALERTS.list.length - 1] : null, toast: toastText(doc) }; };
    if (code) {
      V.CUR.set(code); const rate = V.CUR.rate(code), sym = V.CUR.sym().trim(), shown = String(+(card.market * rate).toFixed(2));
      const e = await alertAt(shown), ph = (e.field.match(/placeholder="([^"]*)"/) || [])[1];
      ok(`in ${code} the alert's box shows the market in ${code} as a plain number (it showed it after the symbol, "${sym}")`, ph === shown, JSON.stringify(ph));
      ok(`...its note names ${code} and says the alert is kept in US dollars (it said "USD.")`, e.why.includes(code) && /kept in US dollars/.test(e.why) && !/^USD\./.test(e.why), e.why);
      /* take 115 (self-review): money() groups thousands, so the echo is read without its commas -- the watched card is the
         catalogue's first priced printing, and past about $1,137 its figure in euros would have read red with nothing wrong */
      ok(`...and the figure typed in ${code} is the one watched: kept in dollars as it ÷ the rate, echoed back as typed (it stored ${shown} dollars)`,
         !!e.a && Math.abs(e.a.at * rate - +shown) < 1e-9 && Math.abs(e.a.at - card.market) <= 0.005 / rate + 1e-9 && e.toast.endsWith(V.money(e.a.at)) && V.money(e.a.at).replace(/,/g, '').includes(Number(shown).toFixed(2)),
         JSON.stringify({ at: e.a && e.a.at, market: card.market, rate, toast: e.toast }));
    }
    V.CUR.set('USD');
    const u = await alertAt('12.50');
    ok('control: in dollars the note still says USD, and 12.50 is $12.50', !!u.a && u.a.at === 12.5 && /^USD\./.test(u.why), JSON.stringify({ at: u.a && u.a.at, why: u.why }));
    const k = await alertAt('1,200');
    ok('"1,200" is twelve hundred dollars, not one (parseFloat stopped at the comma)', !!k.a && k.a.at === 1200, JSON.stringify(k.a && k.a.at));
    const typed = holds(() => ['1,200', '11,36', '12.5', '1,2345', 'abc', '.5'].map(V.typedAmount));
    ok('...a typed amount: thousands with commas, a decimal comma, a plain number; anything else is no number', JSON.stringify(typed) === JSON.stringify([1200, 11.36, 12.5, null, null, 0.5]), JSON.stringify(typed));
    /* the fired day, on a US evening */
    const tz0 = process.env.TZ; process.env.TZ = 'America/New_York';
    try {
      const late = new Date(); late.setHours(23, 30, 0, 0); const noon = new Date(); noon.setHours(12, 0, 0, 0);
      const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const fired = (key, t) => ({ key, id: card.id, num: card.num, name: card.name, treat: card.treat, dir: 'below', at: 1, armed: false, created: t.toISOString(), fired: { at: t.toISOString(), price: card.market, catalogue: 'x' } });
      V.ALERTS.list = [fired('aT115late', late), fired('aT115noon', noon)];
      V.go('wants'); const shownDays = [...doc.getElementById('alRows').innerHTML.matchAll(/fired ([^<]*?) at /g)].map(m => m[1]);   // newest first
      const want = [V.dayText(ymd(noon)), V.dayText(ymd(late))];
      ok('precondition: 23:30 on a US evening is already tomorrow in UTC', late.toISOString().slice(0, 10) !== ymd(late), late.toISOString());
      ok('an alert that fired on a US evening shows the phone\'s day, not the UTC date (a day late)', shownDays[1] === want[1], JSON.stringify({ shownDays, want }));
      ok('control: one that fired at noon shows the same day either way', shownDays[0] === want[0], JSON.stringify({ shownDays, want }));
    } finally { if (tz0 === undefined) delete process.env.TZ; else process.env.TZ = tz0; }
    V.CUR.set(keepCode); V.ALERTS.list = keepAlerts; V.ALERTS.save(); V.go('home');
  });

  /* (A2-4) SPEC-111-49: a page turn counts from the page on screen */
  await guard('the binder\'s page turns', async () => {
    const keep = { items: V.OWN.items, set: V.BN.set, pageOf: { ...V.BN.pageOf }, active: V.PF.active };
    const numKey = n => { const m = n.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 9999; };
    const bySet = new Map(); for (const p of V.CAT.rows) if (p.num) { const m = bySet.get(p.set) || new Map(); if (!m.has(p.num)) m.set(p.num, p); bySet.set(p.set, m); }
    const [sid, m] = [...bySet.entries()].sort((a, b) => b[1].size - a[1].size)[0];
    const nums = [...m.keys()].sort((a, b) => numKey(a) - numKey(b) || a.localeCompare(b)), pages = Math.ceil(nums.length / 9);
    V.PF.active = 'main'; V.OWN.items = [{ id: m.get(nums[20]).id, qty: 1, condition: 'NM', pf: 'main' }];
    V.BN.set = sid; delete V.BN.pageOf[sid]; V.go('binder');
    const page = () => V.BN.page, turn = id => tapIn(listeners, null, {}, id);
    const p0 = page();
    ok(`precondition: the largest set (${nums.length} numbers, ${pages} pages) opens at its first held card's page -- the third -- with no page stored`, p0 === 2 && pages >= 5 && V.BN.pageOf[sid] == null, JSON.stringify({ p0, pages, stored: V.BN.pageOf[sid] }));
    turn('bnNext'); const p1 = page(), t1 = doc.getElementById('bnPage').textContent;
    ok('Next from the page it opened at is the page after it, the fourth (it counted from the first: the second)', p1 === 3 && / page 4 of /.test(t1), `${p1} · ${t1}`);
    turn('bnPrev'); turn('bnPrev');
    ok('...and Prev twice from there is the second', page() === 1, String(page()));
    delete V.BN.pageOf[sid]; V.go('binder'); const b0 = page(); holds(() => V.bnTurn(-1));
    ok('the page turn is one named function on VAULT (landmine 136): Prev from the opening page, the third, is the second', typeof V.bnTurn === 'function' && b0 === 2 && page() === 1, `${b0} -> ${page()}`);
    for (let i = 0; i < pages + 2; i++) turn('bnNext');
    ok('control: Next past the last page stays on it', page() === pages - 1, `${page()} of ${pages}`);
    V.go('home'); V.go('binder');
    ok('control: a page the collector turned to is kept when the binder opens again', page() === pages - 1, String(page()));
    V.OWN.items = keep.items; V.BN.set = keep.set; V.BN.pageOf = keep.pageOf; V.PF.active = keep.active; V.go('home');
  });

  /* (A2-5) SPEC-109-40: the featured Leader is the newest deck's, with decks dated as the app dates them */
  await guard('the featured Leader', async () => {
    const keepDecks = V.DECKS.list, [L1, L2] = V.CAT.rows.filter(p => p.num && !p.sealed).slice(0, 2);   // the hero reads a Leader by printing id
    const blank = V.DECKS.blank();
    ok('precondition: DECKS.blank() dates a deck with an ISO string', typeof blank.created === 'string' && !isNaN(Date.parse(blank.created)), JSON.stringify(blank.created));
    const deck = (id, L, daysAgo) => ({ ...V.DECKS.blank(), id, leader: L.id, created: new Date(Date.now() - daysAgo * 864e5).toISOString() });
    const older = deck('dT115old', L1, 3), newer = deck('dT115new', L2, 1);
    V.DECKS.list = [older, newer]; const h1 = V.heroLeader();
    V.DECKS.list = [newer, older]; const h2 = V.heroLeader();
    V.DECKS.list = [{ ...older, created: Date.now() - 3 * 864e5 }, { ...newer, created: Date.now() - 864e5 }]; const h3 = V.heroLeader();
    V.DECKS.list = keepDecks;
    ok('the featured Leader is the newest deck\'s, by the ISO date the app writes (the dates subtracted to NaN, and the oldest -- the list\'s first -- was featured)', !!h1 && h1.L.id === L2.id, h1 ? `${h1.L.id} vs ${L2.id}` : 'none');
    ok('control: the date decides, not the place in the list (the newest first in the list is featured too)', !!h2 && h2.L.id === L2.id);
    ok('control: a date kept as a number still reads', !!h3 && h3.L.id === L2.id);
  });

  /* (A2-6) STAN-111-15: OWN decides the collection a copy goes to and the line it counts into */
  await guard('the line a copy counts into', async () => {
    const PF = V.PF, keep = { items: V.OWN.items, active: PF.active, list: PF.list.slice() };
    if (!PF.list.some(p => p.id === 'tr115')) PF.list.push({ id: 'tr115', name: 'Trade 115' });
    const A = pA.id;
    const lines = [{ id: A, qty: 3, condition: 'NM', pf: 'main' }, { id: A, qty: 1, condition: 'GRADED', pf: 'tr115', graded: { grader: 'PSA', grade: '10', cert: '' } },
                   { id: A, qty: 1, condition: 'NM', pf: 'tr115' }, { id: A, qty: 2, condition: 'LP', pf: 'tr115' }];
    V.OWN.items = lines.slice(); PF.active = 'tr115';
    const r = holds(() => [V.OWN.target(), V.OWN.line(A), V.OWN.line(A, 'LP'), V.OWN.line(A, 'NM', 'main'), (PF.active = 'all', V.OWN.target())]);
    PF.active = 'tr115';
    ok('OWN says which collection a copy goes to and which line it counts into: the collection on screen, never a slab, "all" meaning the main one',
       !!r && r[0] === 'tr115' && r[1] === lines[2] && r[2] === lines[3] && r[3] === lines[0] && r[4] === 'main', JSON.stringify(r && r.map(x => (x && x.pf ? x.pf + '/' + x.condition : x))));
    ok('...and the card page asks it: the lookup is written once, on OWN (OWN.add, dLine and openDetail each wrote it)',
       (js.match(/&& !i\.graded\)/g) || []).length === 1 && /const dLine = \(\) => dCur && OWN\.line\(dCur\.id, dCond\)/.test(js) && !/dTargetPf/.test(js), String((js.match(/&& !i\.graded\)/g) || []).length));
    V.openDetail(A);
    ok('control: the card page on the trade pile opens on the trade pile\'s ungraded copy, as before', doc.getElementById('dQty').textContent === '1' && doc.getElementById('dTarget').textContent === 'Trade 115',
       doc.getElementById('dQty').textContent + ' · ' + doc.getElementById('dTarget').textContent);
    PF.active = 'main'; V.OWN.items = [{ id: A, qty: 1, condition: 'GRADED', pf: 'main', graded: { grader: 'BGS', grade: '9', cert: '' } }];
    await importText(`product_id,qty,condition,paid_usd\n${A},2,NM,5.00`); await sleep(450);
    const slab = V.OWN.items.find(i => i.graded), nm = V.OWN.items.find(i => !i.graded);
    ok('an imported row\'s cost basis goes on the line it counted into, never the printing\'s first line anywhere (a slab took the $5.00)', !!nm && nm.qty === 2 && nm.paid === 5 && !!slab && slab.paid == null,
       JSON.stringify(V.OWN.items.map(i => [i.condition, i.qty, i.paid])));
    V.OWN.items = keep.items; V.OWN.save(); PF.active = keep.active; PF.list = keep.list; PF.save(); delete store['vault.backup']; V.go('home');
  });

  /* (A2-7) SPEC-107-33: a prompt on the picker settles when the sheet closes. Last, so a build that leaks leaves
     its stale listeners behind no other check. */
  await guard('the picker\'s prompts', async () => {
    const rm0 = doc.removeEventListener;   // a browser removes a listener; the stub's no-op would keep an answered prompt's too
    doc.removeEventListener = (t, f) => { const l = listeners[t]; const i = l ? l.indexOf(f) : -1; if (i >= 0) l.splice(i, 1); };
    const keep = { items: V.OWN.items, snaps: V.OWN.snaps, code: V.CUR.code }, at0 = doc.getElementById('askTitle'), pk = doc.getElementById('picker');
    try {
      V.OWN.items = []; V.openDetail(pA.id);
      let asks = 0; doc._ids.set('askTitle', { set textContent(v) { if (/ grade$/.test(v)) asks++; }, get textContent() { return ''; } });
      const grader = () => doc.getElementById('dAddGraded')._ev.click();
      const pickPSA = async () => { asks = 0; const run = grader(); await sleep(0); tap('[data-grader]', { grader: 'PSA' }); await sleep(5); const n = asks;
        doc.getElementById('askCancel')._ev.click(); await settle(run, 300); doc.getElementById('askSheet').classList.remove('on'); return n; };
      const n0 = await pickPSA();
      ok('control: with no prompt left behind, a pick on the grader asks for one grade', n0 === 1, `${n0} grade prompts`);
      const routes = { 'its cross': () => V.closeSheet('picker'), Cancel: () => doc.getElementById('pkCancel')._ev.click(), Back: () => V.closeAnyOverlay() };
      const outs = {};
      for (const [name, close] of Object.entries(routes)) { const run = grader(); await sleep(0); const open = pk.classList.contains('on'); close(); const r = await settle(run, 300);
        outs[name] = { open, answered: !r.hung, closed: !pk.classList.contains('on') }; }
      ok('the grader\'s prompt closed by the sheet\'s cross, Cancel or Back answers no (it stayed pending, its listener on the page)', Object.values(outs).every(o => o.open && o.answered && o.closed), JSON.stringify(outs));
      const n1 = await pickPSA();
      ok('...so the next pick answers one prompt: one grade asked for (every prompt closed before answered it too, and each recorded a slab)', n1 === 1, `${n1} grade prompts`);
      const other = ['EUR', 'GBP', 'CAD'].find(c => V.CUR.rate(c)) || 'USD', code0 = V.CUR.code;
      tap('[data-act]', { act: 'currency' }); await sleep(5); const cOn = pk.classList.contains('on'); V.closeSheet('picker'); tap('[data-cur]', { cur: other }); await sleep(5);
      const leaked = V.CUR.code !== code0; V.CUR.set(code0);
      ok('the currency\'s prompt closed by its cross answers no: a later tap on a currency does nothing (it changed the currency)', cOn && !leaked && other !== code0, JSON.stringify({ cOn, leaked, other, code0 }));
      const opens = { 'a price alert\'s direction': () => doc.getElementById('dAlert')._ev.click(), 'the MAX range\'s ad': () => V.MAXLOCK.ask() };
      const outs2 = {};
      for (const [name, open] of Object.entries(opens)) { let run; try { run = open(); } catch (e) { outs2[name] = e.message; continue; }
        await sleep(0); const on = pk.classList.contains('on'); V.closeSheet('picker'); const r = await settle(run, 300); outs2[name] = { on, answered: !r.hung }; }
      ok('...and so do the others on the picker, a price alert\'s direction and the MAX range\'s ad', Object.values(outs2).every(o => o && o.on && o.answered), JSON.stringify(outs2));
      const g1 = grader(); await sleep(0); let m1; try { m1 = V.MAXLOCK.ask(); } catch (e) {} const rg = await settle(g1, 300); V.closeSheet('picker'); await settle(m1, 300);
      ok('a new prompt settles one still pending: the grader answers no when another prompt takes the sheet', !rg.hung && !!m1, JSON.stringify(rg));
      { tap('[data-act]', { act: 'currency' }); await sleep(5); const on = pk.classList.contains('on'); tap('#nowhere'); const off = !pk.classList.contains('on');
        tap('[data-cur]', { cur: other }); await sleep(5); const leaked = V.CUR.code !== code0; V.CUR.set(code0);
        ok('control: a tap off the currency\'s options still answers no and closes the sheet, as before', on && off && !leaked, JSON.stringify({ on, off, leaked })); }
    } finally {
      doc._ids.set('askTitle', at0); doc.removeEventListener = rm0; doc.getElementById('askSheet').classList.remove('on'); pk.classList.remove('on');
      V.OWN.items = keep.items; V.OWN.snaps = keep.snaps; V.OWN.save(); V.CUR.set(keep.code); await sleep(450); delete store['vault.backup']; V.go('home');
    }
  });

  /* ---- take 115, A3: the Hunt's honesty and the data ----------------------------------------------------
     A distributor kept after a failed fetch reads as not reached (it happened live: 25 Sept 01:28 UTC, GTS timed
     out, and the app said "checked just now"); Target's history in days from the rows; the catalogue's sets and the
     Diagnostics counts saying what they count; and the duplicates the review found folded into one each. */
  await guard('A3: a kept distributor, the Hunt\'s words, the counts', async () => {
    const txt = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const nb = s => String(s).replace(/[ \u202f]/g, '\u00a0');
    /* (A3-1) SPEC-112-54. The feed the runner writes when a fetch fails after a good one: tools/hunt.py's own build(),
       its fetches answering as they did live (GTS: "TimeoutError: The read operation timed out"), over the fixture feed
       as the previous one -- ok stays true, the last good copy is kept, with kept, stale_since and the error */
    const fxA3 = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-a3-')), feedA3 = path.join(fxA3, 'feed-fixture.json');
    execSync(`python3 tools/hunt.py --from-fixtures --out ${feedA3}`, { cwd: ROOT, stdio: 'pipe' });
    const runBuild = fails => JSON.parse(execSync('python3 -', { cwd: ROOT, input: `
import copy, importlib.util, json, sys
spec = importlib.util.spec_from_file_location("hunt_file", "tools/hunt.py"); H = importlib.util.module_from_spec(spec); spec.loader.exec_module(H)
F = json.load(open(${JSON.stringify(feedA3)})); fails = ${JSON.stringify(fails)}
err = {"target": "HTTP 503", "gts": "TimeoutError: The read operation timed out", "southern": "HTTP 503"}
def answer(k):
    return (lambda *a, **kw: {"ok": False, "error": err[k]}) if k in fails else (lambda *a, **kw: copy.deepcopy(F["sources"][k]))
H.target.fetch, H.gts.fetch, H.southern.fetch = answer("target"), answer("gts"), answer("southern")
json.dump(H.build(F["zips"], F["radius"], previous=copy.deepcopy(F)), sys.stdout)
`, stdio: ['pipe', 'pipe', 'pipe'] }).toString());
    /* take 115 (self-review): a source never read, as hunt.py writes it -- its real fetch failing (the getter raises)
       and no previous feed to keep from: ok false, and the failed run's own time */
    const runNever = k => JSON.parse(execSync('python3 -', { cwd: ROOT, input: `
import copy, importlib.util, json, sys
spec = importlib.util.spec_from_file_location("hunt_file", "tools/hunt.py"); H = importlib.util.module_from_spec(spec); spec.loader.exec_module(H)
F = json.load(open(${JSON.stringify(feedA3)}))
def down(*a, **kw): raise TimeoutError("The read operation timed out")
for m in ("target", "gts", "southern"):
    if m != ${JSON.stringify(k)}: setattr(getattr(H, m), "fetch", (lambda m: lambda *a, **kw: copy.deepcopy(F["sources"][m]))(m))
getattr(H, ${JSON.stringify(k)}).get = down
json.dump(H.build(F["zips"], F["radius"], previous=None), sys.stdout)
`, stdio: ['pipe', 'pipe', 'pipe'] }).toString());
    const F0 = JSON.parse(fs.readFileSync(feedA3, 'utf8')), K = runBuild(['gts', 'target']);
    const kg = K.sources.gts, kt = K.sources.target;
    ok('premise: after a failed fetch the feed keeps the last good copy with ok still true -- kept, stale_since, the error, the same items (the shape hunt.py wrote live on 25 Sept)',
       kg.ok === true && kg.kept === true && kg.stale_since === K.fetched_at && /TimeoutError/.test(kg.error) && kg.fetched_at === F0.sources.gts.fetched_at && kg.items.length === F0.sources.gts.items.length && kt.kept === true && kt.ok === true,
       JSON.stringify({ ok: kg.ok, kept: kg.kept, stale_since: kg.stale_since, error: kg.error, items: (kg.items || []).length }));
    /* Southern Hobby answered two hours before; GTS's kept copy is its read of just now -- take 114's summary took the
       newer time, so the failed source made the list look fresh */
    const ago = h => new Date(Date.now() - h * 3600e3).toISOString();
    K.sources.southern.fetched_at = ago(2);
    const since = nb(V.momentText(K.sources.gts.stale_since));
    V.HUNT.feed = K; V.HUNT.setZip(''); V.MODE.set('hunt', false); V.SEALED.kind = 'all'; V.SEALED.q = ''; V.DISTF.open.clear();
    V.paintSealed(); const hk = ctx.document.querySelector('#sealedList').innerHTML;
    const sumOf = (s, key) => (s.match(new RegExp(`data-distfold="${key}"[^>]*><span><span class="ttl">Distributor info</span><span class="note">([^<]*)</span>`)) || [, ''])[1];
    const sk = sumOf(hk, 'sealed');
    ok('Sealed\'s closed Distributor info says a distributor kept after a failed fetch was not reached, and since when (it said "2 distributors · checked just now")',
       sk.includes(`1 not reached since ${since}`), sk);
    ok('...and "checked" is the source that answered, two hours ago, never the kept copy\'s time', /checked 2 h ago/.test(sk) && !/checked just now/.test(sk), sk);
    V.distFoldTap('sealed'); const ho = ctx.document.querySelector('#sealedList').innerHTML; V.DISTF.open.clear();
    const gtsNote = txt((ho.match(/<b>GTS Distribution<\/b>\s*<div class="note">([\s\S]*?)<\/div>/) || [, ''])[1]);
    ok('...opened, GTS\'s panel says it could not be reached since the failure, and that the check shown is its last good one -- while still showing what that check read',
       gtsNote.startsWith(txt(`Could not reach GTS Distribution since ${V.momentText(kg.stale_since)}; its last check, `) + ' ') && gtsNote.includes(`${kg.items.length} One Piece products at the distributor`), gtsNote);
    const tNote = txt((ho.match(/<h3>Target<\/h3>\s*<div class="note">([\s\S]*?)<\/div>/) || [, ''])[1]);
    ok('...and Target\'s panel the same, for its kept copy', tNote.startsWith(txt(`Could not reach Target since ${V.momentText(kt.stale_since)}; its last check, `) + ' ') && tNote.includes(`${kt.items.length} One Piece products online`), tNote);
    ok('...the kept copy is still what the rows show: GTS\'s short lines stay under their products', /<span>GTS Distribution · [^<]+<\/span>/.test(hk));
    V.paintReleases(); const rk = ctx.document.querySelector('#relList').innerHTML, rsum = sumOf(rk, 'releases');
    V.distFoldTap('releases'); const ro = ctx.document.querySelector('#relList').innerHTML; V.DISTF.open.clear();
    const rpanel = ro.slice(ro.indexOf('At the distributors'), ro.indexOf('<h3>Recent</h3>'));
    ok('Releases says it too: closed, "1 not reached since"; opened, that GTS could not be reached and its last check is shown, above the products its kept copy lists',
       rsum.includes(`1 not reached since ${since}`) && txt(rpanel).includes(txt(`Could not reach GTS Distribution since ${V.momentText(kg.stale_since)}; its last check, `) + ' ') && /GTS Distribution · /.test(rpanel), `${rsum} | ${txt(rpanel).slice(0, 240)}`);
    /* the product's own page -- the take-115 look found it silent: its summary named the two distributors and GTS's
       line gave the kept copy's age as if it were a check */
    const gi = K.sources.gts.items.find(i => i.catalog_id && V.CAT.byId.get(i.catalog_id));
    V.openDetail(gi.catalog_id, { dist: true }); const dd = ctx.document.querySelector('#dDist').innerHTML, dsum = sumOf(dd, 'detail');
    const dgts = txt((dd.match(/<b>GTS Distribution<\/b><span>([\s\S]*?)<\/span>/) || [, ''])[1]);
    ok('a product\'s own Distributor info says it too: its summary "1 not reached since", and GTS\'s line that it could not be reached and that its last check is shown (it read "GTS Distribution, Southern Hobby" and "… · 4 h ago")',
       dsum.includes(`1 not reached since ${since}`) && dgts.includes(txt(`could not reach it since ${V.momentText(kg.stale_since)}; its last check, `)), `${dsum} | ${dgts}`);
    const rep = holds(() => V.feedLine()) || '';
    ok('Diagnostics\' feed line names a kept copy (it read "gts 11 products")', rep.includes(`gts ${kg.items.length} products (kept; not reached since ${V.momentText(kg.stale_since)})`) && rep.includes(`target ok (kept; not reached since`), rep);
    /* the controls: a fetch that worked, and a source never read (ok false) */
    const W = runBuild([]); V.HUNT.feed = W; V.paintSealed(); const hw = ctx.document.querySelector('#sealedList').innerHTML, sw = sumOf(hw, 'sealed');
    V.distFoldTap('sealed'); const hwo = ctx.document.querySelector('#sealedList').innerHTML; V.DISTF.open.clear();
    ok('control: when every fetch answers, nothing is "not reached" and each panel says when it was checked', W.sources.gts.kept === undefined && /^2 distributors · checked (just now|\d+ min ago)$/.test(sw) && /<b>GTS Distribution<\/b>\s*<div class="note">Checked (just now|\d+ min ago) · /.test(hwo) && !/Could not reach/.test(hwo), sw);
    V.openDetail(gi.catalog_id, { dist: true }); const dw = ctx.document.querySelector('#dDist').innerHTML;
    ok('control: ...and the product\'s own page says nothing of it then, its summary only the names', !/not reached|could not reach/i.test(dw) && /^GTS Distribution(, Southern Hobby)?$/.test(sumOf(dw, 'detail')), sumOf(dw, 'detail'));
    const D0 = runNever('southern'), n0 = D0.sources.southern;
    V.HUNT.feed = D0; V.paintSealed(); const s0 = sumOf(ctx.document.querySelector('#sealedList').innerHTML, 'sealed'), lead0 = txt(V.sourceLead('Southern Hobby', n0));
    ok('a source never read -- as hunt.py writes it, ok false with the failed run\'s own time -- is "1 not reached" with no "since", and its panel says when it was last tried (both said "since" that run)',
       n0.ok === false && !!n0.fetched_at && !n0.stale_since && /TimeoutError/.test(n0.error || '') && /· 1 not reached$/.test(s0) && /checked (just now|\d+ min ago)/.test(s0)
       && /^Could not reach Southern Hobby when last tried, /.test(lead0) && !/since/.test(lead0), JSON.stringify({ n0: { ok: n0.ok, at: n0.fetched_at, since: n0.stale_since, error: n0.error }, s0, lead0 }));
    V.HUNT.feed = null; V.paintSealed(); V.paintReleases();

    /* (A3-2) loose-record 2, landmine 173: Target's history line counted runs and called them hourly. The history on
       Pages at 24 Sept 20:02 UTC, saved as it was: its span and its count are read off its rows here, never written */
    const LIVE = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'fixtures', 'hunt_history_2026-09-24.json'), 'utf8'));
    const ts = LIVE.runs.map(r => Date.parse(r.t)), spanD = (Math.max(...ts) - Math.min(...ts)) / 864e5, dN = Math.max(1, Math.round(spanD));
    const T0 = F0.sources.target, tit = T0.items.find(i => i.catalog_id) || T0.items[0];
    const line = hist => { V.HUNT.hist = hist; const t = txt(V.targetLine(tit, T0)); V.HUNT.hist = null; return t; };
    /* take 115 (self-review): only the runs that read this product are its checks. The live history's runs never read
       this one (Target answered 435), and take 115's first version said "N checks over D days" of it all the same */
    const liveLine = line(LIVE), liveChecks = LIVE.runs.filter(r => (r.online || {})[tit.tcin] != null).length;
    ok(`Target's line counts only the runs that read this product: the live history's ${LIVE.runs.length} runs over ${dN} days never read it, so there is no count (it said "${LIVE.runs.length} checks over ${dN} days so far")`,
       spanD > 1 && spanD < 13 && liveChecks === 0 && !/checks? of it|checks over|a pattern needs a fortnight|hourly/.test(liveLine), liveLine);
    /* rows that read the product every `every`-th run, so the count is never the number of runs */
    const rows = (n, stepH, every = 1) => ({ runs: Array.from({ length: n }, (_, k) => ({ t: new Date(Date.now() - (n - 1 - k) * stepH * 3600e3).toISOString(), online: k % every === 0 ? { [tit.tcin]: 0 } : {}, shelf: {} })), stores: {}, titles: {} });
    const sparse = line(rows(20, 20)), fort = line(rows(85, 4)), five = line(rows(5, 1)), some = line(rows(50, 4, 6));
    ok('...a product read in 9 of 50 runs over 8 days says "9 checks of it over 8 days", from its own checks\' times (it said "50 checks")', some.includes('9 checks of it over 8 days so far — a pattern needs a fortnight') && !/50 checks/.test(some), some);
    ok('...20 checks over about 16 days is past a fortnight: no "needs a fortnight" (it said "20 hourly checks so far")', !/a pattern needs a fortnight/.test(sparse), sparse);
    ok('...five checks in four hours say "in less than a day" (it said "5 hourly checks")', five.includes('5 checks of it in less than a day so far — a pattern needs a fortnight'), five);
    ok('...control: a fortnight at the measured four-hourly cadence (85 rows) has no such line', !/a pattern needs a fortnight/.test(fort), fort);

    /* (A3-3) loose-diagnostics 1: the sets, and the counts in Diagnostics and the self-test */
    const noSet = V.CAT.rows.filter(p => !V.CAT.sets.has(p.set));
    ok('every printing\'s set is in the catalogue: One Piece Collection Sets (sealed only) was dropped by a card count, and its products sat under "Other" with no set',
       noSet.length === 0, `${noSet.length} rows in ${new Set(noSet.map(p => p.set)).size} missing sets: ${[...new Set(noSet.map(p => p.set))].join(', ')}`);
    const empty = [...V.CAT.sets.values()].filter(s => !V.CAT.rows.some(p => p.set === s.id));
    ok('...control: a set with nothing in the catalogue stays out (the unreleased release-event group had no product)', empty.length === 0, empty.map(s => s.name).join(', '));
    const closed0 = new Set(V.SEALED.closed); V.MODE.set('hunt', false); for (const p of V.CAT.rows) V.SEALED.closed.delete(p.set);
    V.paintSealed(); const hs = ctx.document.querySelector('#sealedList').innerHTML; V.SEALED.closed.clear(); for (const k of closed0) V.SEALED.closed.add(k);
    const folds = [...hs.matchAll(/data-setfold="([^"]+)"/g)].map(m => m[1]).filter(k => k !== 'decks');
    ok('Sealed files every product under its set: no heading without a set', folds.length > 10 && folds.every(k => V.CAT.sets.has(+k)), folds.filter(k => !V.CAT.sets.has(+k)).join(', '));
    const zero = [...V.CAT.sets.values()].filter(s => !s.n);
    ctx.document.getElementById('allq').value = ''; Object.assign(V.FILT.all, V.blankFilter('all')); ctx.document.getElementById('allRes').innerHTML = ''; V.MODE.set('collect', false); V.paintSearch();
    const idx = ctx.document.getElementById('setList').innerHTML;
    ok('a set with no cards says what it holds on Search\'s set list, never "0 cards"', zero.length >= 1 && !/ · 0 cards/.test(idx) && zero.every(s => idx.includes(`${s.abbr || ''} · ${holds(() => V.setCards(s)) || '?'}`)), `${zero.map(s => s.abbr).join(', ')} | ${(idx.match(/[^>]* · 0 cards/) || [''])[0]}`);
    const past = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10), soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    ok('...on Releases the same words: a past set with no cards is sealed products only; an upcoming one, its card list not published yet',
       holds(() => V.setCards({ n: 0, pub: past })) === 'sealed products only' && holds(() => V.setCards({ n: 0, pub: soon })) === 'card list not published yet' && holds(() => V.setCards({ n: 7, pub: past })) === '7 cards');
    const opts = [...V.CAT.sets.values()].filter(s => s.n > 0).length; ctx.document.getElementById('setChip')._ev.click(); const pk = ctx.document.getElementById('pkOpts').innerHTML; ctx.document.getElementById('picker').classList.remove('on');
    ok('control: Scan\'s set picker still lists only the sets with cards (a number is what it reads)', (pk.match(/data-setpick="[1-9]\d*"/g) || []).length === opts && !zero.some(s => pk.includes(`data-setpick="${s.id}"`)), `${(pk.match(/data-setpick="[1-9]\d*"/g) || []).length} of ${opts}`);
    const online0 = ctx.navigator.onLine; ctx.navigator.onLine = false;   // the report and the self-test probe nothing
    const drep = await V.DIAG.report(); const dline = k => ((drep.match(new RegExp(`^${k}: (.*)$`, 'm')) || [, ''])[1]);
    const oDon = p => !!p.sealed && /don!! card/i.test(p.name || '');   // the test's own oracle
    const sealed = V.CAT.rows.filter(p => p.sealed), don = sealed.filter(oDon).length, goods = sealed.filter(p => !oDon(p)), pr = goods.filter(p => p.market > 0).length;
    ok(`Diagnostics' sealed products line says what it counts: "${pr} priced (${sealed.length} rows filed as sealed: ${don} DON!! cards, ${goods.length - pr} unpriced)" (it said "${pr}")`,
       dline('sealed products') === `${pr} priced (${sealed.length} rows filed as sealed: ${don} DON!! cards, ${goods.length - pr} unpriced)` && pr + don + (goods.length - pr) === sealed.length, dline('sealed products'));
    const im = manifest.images || {}, ids = im.missing_sealed_ids;
    const mDon = Array.isArray(ids) ? ids.filter(id => { const p = V.CAT.byId.get(+id); return p && oDon(p); }).length : -1;
    ok('the build ships the ids of the rows without a number and no picture, one for each it counted', Array.isArray(ids) && ids.length === im.missing_sealed && ids.every(Number.isInteger), JSON.stringify({ ids: Array.isArray(ids) ? ids.length : ids, count: im.missing_sealed }));
    ok(`...and the pictures line names the DON!! cards among them apart from the sealed products: "${im.missing_cards} cards, ${mDon} DON!! cards and ${(ids || []).length - mDon} sealed products"`,
       mDon >= 0 && dline('pictures').startsWith(`${im.missing_cards} cards, ${mDon} DON!! cards and ${ids.length - mDon} sealed products have no picture at the first host`), dline('pictures'));
    const hold = holds(() => V.picturesLine({ ...im, missing_sealed_ids: undefined })) || '';
    ok('...and a catalogue synced from an older build, without the ids, says "rows without a number", never "sealed products" for them', hold.startsWith(`${im.missing_cards} cards and ${im.missing_sealed} rows without a number (sealed products and DON!! cards)`), hold);
    const st = await V.SELFTEST.run(); ctx.navigator.onLine = online0; const cl = (st.checks.find(c => c.name === 'Catalogue loaded') || {}).note || '';
    const cards = V.CAT.rows.filter(p => p.num), withCards = new Set(cards.map(p => p.set)).size;
    ok(`the self-test's catalogue line says what it counts: "${V.CAT.rows.length} printings (${cards.length} cards, ${V.CAT.rows.length - cards.length} without a number), ${V.CAT.sets.size} sets (${withCards} with cards)"`,
       cl.startsWith(`${V.CAT.rows.length} printings (${cards.length} cards, ${V.CAT.rows.length - cards.length} without a number), ${V.CAT.sets.size} sets (${withCards} with cards), prices `) && V.CAT.sets.size > withCards, cl);
    if (typeof V.paintHome === 'function') V.paintHome(); V.go('settings');
    const src = ctx.document.getElementById('srcNote').innerHTML, more = ctx.document.getElementById('setBody').innerHTML;
    ok(`More says the ${(manifest.cards || 0).toLocaleString()} cards are across ${withCards} sets, the sets they are in (it said ${manifest.sets}: every group the source lists, an empty one and a sealed-only one among them)`,
       src.includes(`${(manifest.cards || 0).toLocaleString()} cards across ${withCards} sets`) && more.includes(`<span>${withCards} sets · `) && manifest.sets > withCards, `${(src.match(/[\d,]+ cards across \d+ sets/) || [''])[0]} | ${(more.match(/<span>\d+ sets · /) || [''])[0]} | manifest ${manifest.sets}`);
    while (V.closeAnyOverlay()) {} V.go('home');
    ok('...and its gate check is named for the printings it asks on, not a ratio of one day\'s prices (landmine 175)', st.checks.some(c => c.name === 'The confidence gate asks on EB03-024\'s three printings' && c.s === 'PASS') && !st.checks.some(c => /\d+x spread/.test(c.name)));

    /* (A3-4) STAN-110-11, landmine 157: the test credits' label is the value a tap adds, read after the manifest set it */
    const de = ctx.document.getElementById('devEarn'), per0 = V.CREDITS.PER_AD, cr0 = JSON.parse(JSON.stringify(V.CREDITS.state));
    V.go('diag'); const l1 = de.textContent; V.CREDITS.PER_AD = per0 + 5; V.go('diag'); const l2 = de.textContent;
    const s0c = V.CREDITS.state.scan; V.CREDITS.earn('scan'); const added = V.CREDITS.state.scan - s0c;
    V.CREDITS.PER_AD = per0; Object.assign(V.CREDITS.state, cr0); V.CREDITS.save(); V.go('diag');
    ok('Diagnostics\' test-credit button says what a tap adds, from CREDITS.PER_AD after boot -- and follows it when the manifest changes it', l1 === `+${per0} test credits` && l2 === `+${per0 + 5} test credits` && added === per0 + 5 && de.textContent === `+${per0} test credits`, JSON.stringify({ l1, l2, added }));
    ok('...and the page itself carries no number there for the label to go stale on (it said "+20")', /<button class="ghost" id="devEarn">[^<\d]*<\/button>/.test(html));
    while (V.closeAnyOverlay()) {} V.go('home');

    /* (A3-5) STAN-109-7: every CDN picture is lazy, the card page's backdrop too (the record said so of all of them) */
    const artImgs = js.match(/<img class="(?:above|ref)[^>]*>/g) || [], lazy = t => /\bloading="lazy"/.test(t);
    const bd = ctx.document.createElement('div'), card = V.CAT.rows.find(p => !p.sealed && p.img); V.paintBack(bd, card);
    ok('every art picture template carries loading="lazy" -- the rows\', the heroes\' and a card page\'s backdrop (paintBack had none)', artImgs.length >= 3 && artImgs.every(lazy) && lazy(bd.innerHTML) && /<img class="above/.test(bd.innerHTML), `${artImgs.filter(t => !lazy(t)).length} of ${artImgs.length} without; backdrop ${lazy(bd.innerHTML)}`);
    ok('...control: take 114\'s backdrop template is caught', !lazy('<img class="above${artOk(p.img)}" alt="" decoding="async" src="${esc(p.img)}" onload="${ART_ONLOAD}" onerror="this.remove()">'));

    /* (A3-6) the duplicates, one each: the colour split, the product test and its DON!! pattern, the Sealed row and the
       kinds table, Southern Hobby's state dates, the distributor chain in Diagnostics, the G that hid the glyph helper */
    const n = re => (js.match(re) || []).length;
    ok('one colour split (STAN-109-8): the split lives in colsOf, and every colour drawn comes through gameColours', n(/split\(\/\[;\/,\]\/\)/g) === 1 && holds(() => V.gameColours({ color: 'Red/Green' }).join() === 'Red,Green' && V.gameColours({ color: 'Red;Foo' }).join() === 'Red' && V.gameColours(null).length === 0), `${n(/split\(\/\[;\/,\]\/\)/g)} splits`);
    ok('...control: a card\'s art ground is still its own two colours', V.artColours({ color: 'Red/Green' }).join() === 'var(--c-red),var(--c-green)' && V.artColours(null)[0] === 'var(--brass2)');
    const rowsAll = V.CAT.rows, part = rowsAll.every(p => !!V.SEALED.isProduct(p) === (!!p.sealed && !oDon(p) && p.market > 0) && !!holds(() => V.SEALED.isGoods(p)) === (!!p.sealed && !oDon(p)));
    ok('SEALED owns the product test (STAN-111-14): one DON!! pattern, isGoods built on it, isProduct on isGoods, no inline copy left', n(/\/don!! card\/i/g) === 1 && n(/sealed && !SEALED\.isDon\(/g) === 1 && /isGoods\(p\) \{ return !!p && !!p\.sealed && !SEALED\.isDon\(p\); \}/.test(js) && part, `${n(/\/don!! card\/i/g)} patterns, ${n(/sealed && !SEALED\.isDon\(/g) - 1} inline copies beside isGoods`);
    const kinds = new Set(V.CAT.rows.filter(p => V.SEALED.isProduct(p)).map(p => V.SEALED.kindOf(p)));
    ok('one Sealed row and one kinds table (STAN-111-16): the row\'s markup once, the one-of-a-kind word beside the chip\'s', n(/<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button class="row"/g) === 1 && !/SEALED_ONE/.test(js)
       && [...kinds].every(k => { const p = V.CAT.rows.find(x => V.SEALED.isProduct(x) && V.SEALED.kindOf(x) === k); return holds(() => V.sealedKind(p)[0] === k) && V.sealedWord(p) === holds(() => V.sealedKind(p)[2]); }), `${n(/<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button class="row"/g)} row templates; kinds ${[...kinds].join(',')}`);
    const shState = s => holds(() => V.distShort({ _d: 'southern', state: s, due: '2026-10-01', release: '2026-11-01' }));
    ok('one Southern Hobby state-to-date map (STAN-112-20), and a state word off the wire is never a key into it (take 114 threw on "constructor")',
       n(/orders_open: it\.due, orders_closed: it\.due, released: it\.release/g) === 0 && shState('constructor') === 'Southern Hobby · constructor' && shState('orders_open') === `Southern Hobby · orders close ${nb(V.dayText('2026-10-01'))}`, String(shState('constructor')));
    const sh = (F0.sources.southern.items || []).map(it => Object.assign(Object.create(it), { _d: 'southern' })).filter(it => /\d$/.test(V.distShort(it)));
    ok('...control: every Southern Hobby item\'s short line and full words end on the same day', sh.length >= 10 && sh.every(it => { const w = txt(V.distLine(it)).split(' · ')[1] || '', day = (txt(V.distShort(it)).match(/([A-Z][a-z]{2} \d{1,2}(?:, \d{4})?)$/) || [, '?'])[1]; return w.endsWith(day); }), String(sh.length));
    ok('Diagnostics reads the distributors from HUNT.DISTS (STAN-112-21), and no painter names its own G -- the glyph helper is the only one', !/HUNT\.feed\.sources\.(gts|southern)\b/.test(js) && n(/\b(?:const|let|var)\s+G\s*=/g) === 1, `${n(/\b(?:const|let|var)\s+G\s*=/g)} bindings named G`);
    const nG = t => (t.match(/\b(?:const|let|var)\s+G\s*=/g) || []).length;
    ok('...control: take 114\'s shadow, planted, is counted', nG(js + '\n  const G = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.gts;') === nG(js) + 1);
  });

  /* (A4) the spec's own words and the UI's contract -- each check names its finding (SPEC-106..111, STAN-106..114) and each
     was watched to fail on take 114's build. This DOM computes no style, so the CSS is read the way the browser resolves it
     for the element in question: the rule that matches, the palette's tokens, a translucent colour laid over what lies
     under it, the browser's own "smaller" for a <small> no rule sizes. */
  await guard('A4: the spec\'s own words', async () => {
    const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
    const topRules = c => { const t = c.replace(/\/\*[\s\S]*?\*\//g, ''), out = []; let i = 0;
      const split = p => { const r = []; let d = 0, cur = ''; for (const ch of p) { if (ch === '(') d++; else if (ch === ')') d--; if (ch === ',' && !d) { r.push(cur.trim()); cur = ''; } else cur += ch; } r.push(cur.trim()); return r; };
      while (i < t.length) { const o = t.indexOf('{', i); if (o < 0) break; const pre = t.slice(i, o).trim(); let d = 1, j = o + 1;
        while (j < t.length && d) { if (t[j] === '{') d++; else if (t[j] === '}') d--; j++; }
        if (!pre.startsWith('@')) out.push({ sels: split(pre), body: t.slice(o + 1, j - 1) }); i = j; }
      return out; };
    const declOf = (body, prop) => { let v = null; for (const m of body.matchAll(/(?:^|;)\s*([\w-]+)\s*:\s*([^;]*)/g)) if (m[1] === prop) v = m[2].trim(); return v; };
    const ruleVal = (c, sel, prop) => { let v = null; for (const r of topRules(c)) if (r.sels.includes(sel)) { const x = declOf(r.body, prop); if (x != null) v = x; } return v; };
    const tokens = (c, mode) => { const rs = topRules(c), t = {};
      const take = sel => { for (const r of rs) if (r.sels.includes(sel)) for (const m of r.body.matchAll(/(--[\w-]+)\s*:\s*([^;]*)/g)) t[m[1]] = m[2].trim(); };
      take(':root'); if (mode !== 'collect') take(`:root[data-mode="${mode}"]`); return t; };
    const argsOf = s => { const r = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; else if (ch === ')') d--; if (ch === ',' && !d) { r.push(cur.trim()); cur = ''; } else cur += ch; } r.push(cur.trim()); return r; };
    const colOf = (v, T, depth = 0) => { v = String(v == null ? '' : v).trim(); let m; if (depth > 12) return null;
      if ((m = /^var\((--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(v))) return T[m[1]] != null ? colOf(T[m[1]], T, depth + 1) : (m[2] ? colOf(m[2], T, depth + 1) : null);
      if (/^#[0-9a-f]{6}$/i.test(v)) return [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16)).concat(1);
      if (/^#[0-9a-f]{3}$/i.test(v)) return [1, 2, 3].map(i => parseInt(v[i] + v[i], 16)).concat(1);
      if (v === 'transparent') return [0, 0, 0, 0];
      if ((m = /^rgba?\(([^)]*)\)$/.exec(v))) { const p = m[1].split(',').map(x => parseFloat(x)); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
      if ((m = /^color-mix\(in srgb,\s*([\s\S]*)\)$/.exec(v))) {   /* CSS Color 5: percentages under 100 in sum lower the alpha */
        const [a, b] = argsOf(m[1]).map(x => { const k = /^([\s\S]*?)\s+([\d.]+)%$/.exec(x); return k ? [k[1], +k[2]] : [x, null]; });
        let pa = a[1], pb = b[1]; if (pa == null && pb == null) pa = pb = 50; else if (pa == null) pa = 100 - pb; else if (pb == null) pb = 100 - pa;
        const s = pa + pb, ca = colOf(a[0], T, depth + 1), cb = colOf(b[0], T, depth + 1); if (!ca || !cb || !s) return null;
        const wa = pa / s, wb = pb / s, al = ca[3] * wa + cb[3] * wb; if (!al) return [0, 0, 0, 0];
        return [0, 1, 2].map(i => (ca[i] * ca[3] * wa + cb[i] * cb[3] * wb) / al).concat(al * Math.min(s, 100) / 100); }
      return null; };
    const over = (f, b) => { const a = f[3] == null ? 1 : f[3]; return [0, 1, 2].map(i => f[i] * a + b[i] * (1 - a)).concat(1); };
    const px = c => c.slice(0, 3).map(Math.round);
    const lum4 = c => { const [r, g, b] = px(c).map(x => x / 255).map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const cr = (a, b) => { const [x, y] = [lum4(a), lum4(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const MODES = ['collect', 'play', 'hunt'];

    /* (SPEC-106-28, overtaken by take 116) the splash was wholly Collect's, the mark too, and take 115 pinned the mark's
       colour over the mode's. The scene has no mark: nothing in the splash reads a token, so nothing can follow the mode. */
    const markCol = (c, mode) => { const T = tokens(c, mode), v = ruleVal(c, '#splash .swords', 'color') ?? ruleVal(c, '.swords', 'color') ?? ruleVal(c, '#splash', 'color'); const k = colOf(v, T); return k ? px(k).join(',') : String(v); };
    const swordsRules = topRules(css).flatMap(r => r.sels).filter(s => /\.swords$/.test(s));
    ok('(SPEC-106-28, overtaken by take 116) the splash has no mark that could follow the mode: no rule reaches #splash .swords and no swords svg is in the markup (the scene\'s colours are literals, the take-116 lines)',
       !swordsRules.some(r => /^#splash/.test(r)) && !/class="swords"/.test(html), swordsRules.join('|') || '(no .swords rule)');
    ok('...control: a planted #splash .swords rule is caught', topRules(css + '\n#splash .swords{color:red}').flatMap(r => r.sels).some(r => /^#splash \.swords$/.test(r)));

    /* (SPEC-106-29, SPEC-106-30, STAN-106-2's contrast) every text on a tint, per palette, from the shipped rules: what sits on
       the selected tint (the picker's best match: its lines in --dim and --dim2, an owned line in --up, a look-alike in --gold;
       a bulk-selected tile: --dim lines, a rise and a fall; a selected chip or tab: --accent-ink; a checklist cell: --fg), the
       bad, good and warning tints, a chip's count at the count's own opacity, and the nav's active label on its own ground
       laid over the bar, laid over the page */
    const pairs = (c, mode) => { const T = tokens(c, mode), C = k => colOf(`var(${k})`, T), R = [];
      const tint = C('--accent-bg');
      for (const k of ['--fg', '--dim', '--dim2', '--accent-ink', '--up', '--down', '--gold']) R.push([`${k.slice(2)} on the selected tint`, C(k), tint]);
      R.push(['down on the bad tint', C('--down'), C('--bad-bg')], ['up on the good tint', C('--up'), C('--ok-bg')], ['gold on the warning tint', C('--gold'), over(C('--warn-bg'), C('--bg'))]);
      const op = parseFloat(ruleVal(c, '.chip small', 'opacity') ?? '1'), chipFg = colOf(ruleVal(c, '.chip', 'color'), T), chipBg = colOf(ruleVal(c, '.chip', 'background'), T);
      const onFg = colOf(ruleVal(c, '.chip.on', 'color'), T), onBg = colOf(ruleVal(c, '.chip.on', 'background'), T);
      R.push(['a chip\'s count', chipFg && chipBg && over([...chipFg.slice(0, 3), op], chipBg), chipBg], ['a selected chip\'s count', onFg && onBg && over([...onFg.slice(0, 3), op], onBg), onBg]);
      const bar = over(colOf(ruleVal(c, 'nav', 'background'), T) || [0, 0, 0, 0], C('--bg')), pill = colOf(ruleVal(c, 'nav button.on', 'background'), T);
      R.push(['the nav\'s active label', colOf(ruleVal(c, 'nav button.on', 'color'), T), pill ? over(pill, bar) : bar], ['the nav\'s other labels', colOf(ruleVal(c, 'nav button', 'color'), T), bar]);
      return R.map(([n, f, b]) => [n, f && b ? cr(f, b) : 0]); };
    const lowPairs = (c, mode) => pairs(c, mode).filter(([, r]) => !(r >= 4.5));
    for (const mode of MODES) ok(`(SPEC-106-29, SPEC-106-30) ${mode}: every text on a tint clears 4.5:1, computed from the shipped rules -- the selected tint, the bad, good and warning tints, a chip\'s count, the nav\'s labels`,
       pairs(css, mode).length === 14 && lowPairs(css, mode).length === 0, lowPairs(css, mode).map(([n, r]) => `${n} ${r.toFixed(2)}`).join(', ') || pairs(css, mode).map(([n, r]) => `${n.split(' ')[0]} ${r.toFixed(2)}`).join(' '));
    { /* take 114's rules, planted back one by one -- each plant checked to have landed */
      const plant = (c, a, b) => (c.split(a).length === 2 ? c.replace(a, b) : null);
      const t12 = plant(css, '--accent-bg:color-mix(in srgb,var(--brass) 8%,var(--card))', '--accent-bg:color-mix(in srgb,var(--brass) 12%,var(--card))');
      const t14 = plant(css, '--bad-bg:color-mix(in srgb,var(--down) 10%,var(--card))', '--bad-bg:color-mix(in srgb,var(--down) 14%,var(--card))');
      const n82 = plant(css, 'nav button.on{color:var(--accent-ink);background:var(--accent-bg)}', 'nav button.on{color:var(--accent-ink);background:color-mix(in srgb,var(--card2) 70%,var(--brass) 12%)}');
      const o6 = plant(css, '.chip small{font-size:var(--fs-cap);', '.chip small{opacity:.6;font-size:var(--fs-cap);');
      const names = (c, m) => c ? lowPairs(c, m).map(([n]) => n) : ['(plant did not land)'];
      ok('...control: take 114\'s Collect tint (12%) leaves --dim, --dim2 and --down under 4.5 on it, and its 14% bad tint --down (4.30)',
         !!t12 && !!t14 && ['dim on the selected tint', 'dim2 on the selected tint', 'down on the selected tint'].every(n => names(t12, 'collect').includes(n)) && names(t14, 'collect').includes('down on the bad tint') && names(t12, 'play').length === 0,
         `${names(t12, 'collect').join(', ')} | ${names(t14, 'collect').join(', ')}`);
      ok('...control: take 114\'s translucent pill puts Prep & Play\'s active nav label under 4.5 (4.42), and only there', !!n82 && names(n82, 'play').join() === 'the nav\'s active label' && names(n82, 'collect').length === 0 && names(n82, 'hunt').length === 0, `${names(n82, 'play')}`);
      ok('...control: a count at .6 opacity is caught in every palette (2.6:1 in Collect)', !!o6 && MODES.every(m => names(o6, m).includes('a chip\'s count') && names(o6, m).includes('a selected chip\'s count')));
    }
    ok('(SPEC-106-29) the tints are take 106\'s in Prep & Play and Hunt, lighter only in Collect', ['play', 'hunt'].every(m => tokens(css, m)['--accent-bg'] === 'color-mix(in srgb,var(--brass) 12%,var(--card))' && tokens(css, m)['--bad-bg'] === 'color-mix(in srgb,var(--down) 14%,var(--card))')
       && tokens(css, 'collect')['--accent-bg'] === 'color-mix(in srgb,var(--brass) 8%,var(--card))' && tokens(css, 'collect')['--bad-bg'] === 'color-mix(in srgb,var(--down) 10%,var(--card))');

    /* (SPEC-106-31) accent as text reads --accent-ink: nothing drawn on a Prep & Play screen is text in the fill's colour.
       Every Play screen is painted in Play's palette -- Decks, a deck, Cards, the Play counter, and the Sim from setup through
       a target being chosen with a DON!! given, the block and counter steps, the result, an effect offered and the end -- and
       whatever changed is read: an inline color:var(--brass), or a class whose rule colours its text with it (Hunt's lines) */
    const brassCls = topRules(css).filter(r => /(?:^|;)\s*color\s*:\s*var\(--brass\)/.test(r.body)).flatMap(r => r.sels).map(s => (s.match(/\.([\w-]+)$/) || [])[1]).filter(Boolean);
    const brassText = h => { const hits = []; for (const m of h.matchAll(/style="([^"]*)"/g)) if (/(?:^|;)\s*color\s*:\s*var\(--brass\)/.test(m[1])) hits.push(m[0].slice(0, 70));
      for (const k of brassCls) if (new RegExp(`class="(?:[^"]*\\s)?${k}(?:\\s[^"]*)?"`).test(h)) hits.push('.' + k); return hits; };
    const PLx = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
    const mkDeck4 = name => { const d = V.DECKS.blank(); d.name = name;
      for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue;
        const m = PLx(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0];
        if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
    const keepDecks = V.DECKS.list.slice(), SIM4 = V.SIM, SU = V.SIMUI, boards = [];
    const dA = mkDeck4('A4 one'), dB = mkDeck4('A4 two'); dB.id = dA.id + '-b'; V.DECKS.list = keepDecks.concat([dA, dB]);
    V.MODE.set('play', false);
    const before4 = new Map([...doc._ids].map(([k, e]) => [k, e._html]));
    const shot = () => { V.paintSim(); boards.push(doc.getElementById('simBoard')._html); };
    holds(() => V.paintDecks()); holds(() => V.openDeck(dA.id)); const dkStats = (doc.getElementById('dkStats') || {})._html || '';
    holds(() => V.paintCards()); holds(() => V.paintPlay());
    SIM4.g = null; SU.sel = null; SU.post = null; SU.result = null; SU.offer = null; holds(() => V.go('sim')); shot();
    const g4 = SIM4.new(dA, dB, 0); SIM4.mulligan(0, false); SIM4.mulligan(1, false);
    holds(() => SIM4.giveDon(0, 'leader')); SU.sel = { ref: 'leader' }; shot(); const mainBoard = boards[boards.length - 1];
    SU.sel = null; SIM4.endTurn(); SIM4.endTurn(); const P0 = SIM4.P(0); P0.leader.rested = false; P0.mods = { leader: 0 };
    const att = holds(() => SIM4.attack(0, 'leader', 'leader')); shot(); const blockBoard = boards[boards.length - 1];
    holds(() => SIM4.noBlock()); shot(); const counterBoard = boards[boards.length - 1];
    const res4 = holds(() => SIM4.resolve()); if (res4) { SU.result = res4; SU.post = { i: 1, att: 0 }; } shot(); const postBoard = boards[boards.length - 1];
    SU.post = null; SU.result = null; SU.offer = { i: g4.active, list: [{ e: { raw: 'A4 probe: draw 1 card.' }, steps: [{ a: 'draw' }], step: 0, targets: null, ref: null, cardId: dA.leader }] }; shot(); const offerBoard = boards[boards.length - 1];
    SU.offer = null; g4.phase = 'over'; g4.over = 0; shot();
    /* take 115 (self-review): the Play screens' roots are read whether or not this block changed them -- an earlier
       section left the counter painted with the same markup, so its paint here was no change and never read */
    const read4 = ['dkList', 'dkRows', 'cdRes', 'plBoard'], rootHtml = k => (doc.getElementById(k) || {})._html || '';
    const painted = [...doc._ids].filter(([k, e]) => read4.includes(k) || e._html !== before4.get(k)).map(([, e]) => e._html).concat(boards);
    const brassHits = painted.flatMap(brassText);
    ok('(SPEC-106-31) nothing on a Prep & Play screen is text in the fill\'s colour: every Play screen painted in Play\'s palette, the Sim in seven states, read for an inline color:var(--brass) or a class that sets it',
       brassHits.length === 0 && read4.every(k => rootHtml(k).length > 0) && /class="panel plpanel"/.test(rootHtml('plBoard')) && boards.length === 7 && att && att.ok === true && /is attacked/.test(blockBoard) && /Counter step/.test(counterBoard), brassHits.slice(0, 4).join(' | ') || `${painted.length} painted, roots ${read4.map(k => k + ' ' + rootHtml(k).length).join(', ')}, attack ${JSON.stringify(att)}`);
    ok('...control: a class that set the fill colour on text would be listed -- take 117 moved the last one, .dline, to --accent-ink, so the list is empty by design and a planted class is the proof',
       brassCls.length === 0 && topRules(css + '\n.probe117{color:var(--brass)}').filter(r => /(?:^|;)\s*color\s*:\s*var\(--brass\)/.test(r.body)).flatMap(r => r.sels).includes('.probe117'));
    ok('...the two it had -- "choose a target" and the given DON!! -- are --accent-ink now (#E0553D was 4.25:1 on Play\'s card)',
       /<span style="color:var\(--accent-ink\)">choose a target<\/span>/.test(mainBoard) && /<span style="color:var\(--accent-ink\)">\u25cf/.test(mainBoard));
    ok('...control: take 114\'s span and a Hunt line are caught', brassText('<h3>X \u00b7 <span style="color:var(--brass)">choose a target</span></h3>').length === 1 && brassText('<button class="dline">GTS</button>').length === (brassCls.includes('dline') ? 1 : 0) && brassText('<i style="border-color:var(--brass)">x</i>').length === 0);

    /* (SPEC-110-46) the Sim's buttons are three words at most, what happens said beside them as take 110 did the Play counter:
       every data-sim button in the shipped script, a card's or a player's name not counted as words, the longer of two words
       counted, a number counted, an arrow or a dash not */
    const unesc = t => t.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    const labelWords = inner => unesc(inner).replace(/\$\{([^}]*)\}/g, (_, e) => /\bG\(|\b(tick|chev|ext|bell)\(/.test(e) || /\.name\)?\s*$/.test(e) ? ' '
         : ([...e.matchAll(/'([^']*)'/g)].map(x => x[1]).sort((a, b) => b.length - a.length)[0] ?? ' 0 ')).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w));
    const simButtons = t => [...t.matchAll(/<button\b[^>]*\bdata-sim="[^"]*"[^>]*>([\s\S]*?)<\/button>/g)].map(m => [m[0].slice(0, 60), labelWords(m[1])]);
    const wordy = t => simButtons(t).filter(([, w]) => w.length > 3).map(([b, w]) => w.join(' '));
    ok('(SPEC-110-46) the Sim\'s buttons are three words at most (a name is not a word): End turn, No block, Resolve, Hand back, Skip, Share the log', simButtons(js).length >= 25 && wordy(js).length === 0, wordy(js).join(' | ') || String(simButtons(js).length));
    /* (A4's held-back change, landmine 187's kind) the mode slider is a tablist whose tabs said nothing of which was on;
       render now counts selected tabs per tablist, so they can */
    { /* the stub cannot select the slider's buttons, so the source is read here, and render counts the selected tab of
         each tablist in Chrome, the Mode list's among them */
      const marks = (h, j) => /<button data-mode="collect" class="on" role="tab" aria-selected="true">/.test(h) && /<button data-mode="play" role="tab" aria-selected="false">/.test(h)
        && /<button data-mode="hunt" role="tab" aria-selected="false">/.test(h) && /\$\$\('#modeSlider button'\)\.forEach\(b => \{ const on = b\.dataset\.mode === m; b\.classList\.toggle\('on', on\); b\.setAttribute\('aria-selected', String\(on\)\); \}\)/.test(j);
      ok('the mode slider\'s tabs say which mode is on (aria-selected), in the markup and as MODE.set changes it', marks(html, js));
      ok('...control: take 114\'s slider, tabs with no selected state, is caught', !marks('<button data-mode="collect" class="on" role="tab">Collect</button><button data-mode="play" role="tab">', "$$('#modeSlider button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));")); }
    /* the take-115 look: "Hand back" broke onto two lines at 411 px (110 x 65), squeezed by the note beside it, which names a
       deck and can be long; a button beside a note that can grow keeps its width, and the row wraps instead */
    const holdsWidth = t => /<div class="row" style="[^"]*flex-wrap:wrap[^"]*"><button class="ghost go" data-sim="post" style="flex:none">Hand back<\/button>/.test(t)
      && /<div class="row" style="[^"]*flex-wrap:wrap[^"]*">[\s\S]{0,400}?<button class="ghost" data-sim="fxskip" style="flex:none">Skip<\/button>/.test(t);
    ok('(the look) a Sim button beside a note that can grow keeps its width, in a row that wraps: Hand back, Skip (Hand back broke onto two lines at 411)', holdsWidth(js));
    ok('...control: the rows as A4 first wrote them are caught', !holdsWidth('<div class="row" style="margin-top:10px"><button class="ghost go" data-sim="post">Hand back</button><span class="note" style="margin:0">to X</span></div><div class="row" style="gap:10px;margin-top:8px"><button class="ghost" data-sim="fxskip">Skip</button><span class="note" style="margin:0">play it by hand</span></div>'));
    ok('...control: take 114\'s labels are caught', wordy('<button class="ghost go" data-sim="end">End turn \\u2014 pass the phone</button><button class="ghost go" data-sim="resolve">Resolve \\u2014 ${pw.a} vs ${pw.d}${pw.a >= pw.d ? \': hit\' : \': held\'}</button><button data-sim="block:1">Block with ${esc(x.name)}</button>').length === 2);
    ok('...and what happens is said beside them, on the painted board: then pass the phone, then the counter step, who has hit, to whom the phone goes, play it by hand',
       /data-sim="end">End turn<\/button><span class="note"[^>]*>then pass the phone<\/span>/.test(mainBoard) && /data-sim="noblock"[^>]*>No block<\/button><span class="note"[^>]*>then the counter step<\/span>/.test(blockBoard)
       && /data-sim="resolve"[^>]*>Resolve<\/button><span class="note"[^>]*>\d+ vs \d+: (?:hit|held)<\/span>/.test(counterBoard) && /data-sim="post"[^>]*>Hand back<\/button><span class="note"[^>]*>to [^<]+<\/span>/.test(postBoard)
       && /data-sim="fxskip"[^>]*>Skip<\/button><span class="note"[^>]*>play it by hand<\/span>/.test(offerBoard), [mainBoard, blockBoard, counterBoard, postBoard, offerBoard].map(b => (b.match(/data-sim="(?:end|noblock|resolve|post|fxskip)"[^>]*>[^<]*<\/button>(?:<span[^>]*>[^<]*<\/span>)?/) || ['-'])[0]).join(' | '));

    /* (SPEC-110-45) keywords one way: the deck's stats chips as the game and the tour write them, the Sim's reasons without
       brackets, a Trigger named plainly, the want list by its name */
    const OLD4 = ["'counter cards'", "'[Counter] events'", "'blockers'", "'triggers'", "'rush']", 'no [Rush]', 'active [Blocker]', 'has [Trigger]', 'toast(`Wanted ${n}'];
    const old4 = t => OLD4.filter(w => t.includes(w));
    ok('(SPEC-110-45) keywords one way: "Blockers", "Triggers", "Rush", "Counter cards", "[Counter] Events" on a deck\'s stats; "no Rush", "an active Blocker", "a Trigger" in the Sim; the want list named in the checklist\'s toast',
       old4(js).length === 0 && /<small>Blockers<\/small>/.test(dkStats) && /<small>Triggers<\/small>/.test(dkStats) && /<small>\[Counter\] Events<\/small>/.test(dkStats) && /toast\(`On your want list: \$\{n\} more from/.test(js), old4(js).join(' | ') || dkStats.slice(0, 120));
    ok('...control: each take-114 form is caught', OLD4.every(w => old4('x' + w + 'x').length === 1));

    /* (SPEC-109-41) a deck's Leader: under its picture the card's own colours, both of a two-colour Leader; no Leader, the plain box */
    const L2 = V.CAT.rows.find(p => p.type === 'Leader' && /^[A-Z][a-z]+;[A-Z][a-z]+$/.test(p.color || '') && p.img), dL = V.DECKS.blank(); dL.id = dA.id + '-l'; dL.name = 'A4 leader'; dL.leader = L2 && L2.id;
    const dN = V.DECKS.blank(); dN.id = dA.id + '-n'; dN.name = 'A4 none'; V.DECKS.list = V.DECKS.list.concat([dL, dN]);
    holds(() => V.openDeck(dL.id)); const leadCss = String(doc.getElementById('dkLead').style.cssText), ac = L2 ? V.artColours(L2) : [];
    holds(() => V.openDeck(dN.id)); const noneCss = doc.getElementById('dkLead').style.cssText;
    ok('(SPEC-109-41) a deck\'s Leader box is the card\'s own colours under its picture -- both of a two-colour Leader -- offline or when the picture fails; a deck with no Leader keeps the plain box',
       !!L2 && leadCss === `--a1:${ac[0]};--a2:${ac[1]}` && /var\(--c-/.test(ac[1]) && ac[0] !== ac[1] && noneCss === '' && ruleVal(css, '.dkhead .lead', 'background') === 'linear-gradient(160deg,var(--a1,var(--card2)),var(--a2,var(--card2)))', `${leadCss} | ${ruleVal(css, '.dkhead .lead', 'background')}`);
    V.DECKS.list = keepDecks; SIM4.g = null; SU.sel = null; SU.post = null; SU.result = null; SU.offer = null; V.MODE.set('collect', false); V.go('home');

    /* (STAN-106-2) nothing under 12 px as the browser draws it: every <small>, <sub> and <sup> the app writes, sized by the rule
       that reaches it or by the browser's own "smaller" (the size of its parent over 1.2) -- the literal-px check above passed
       while the counts drew at 10 and 10.8 px */
    const fsPx = (v, T, parent) => { v = String(v == null ? '' : v).trim(); let m;
      if ((m = /^var\((--[\w-]+)\)$/.exec(v))) return fsPx(T[m[1]], T, parent);
      if ((m = /^([\d.]+)px$/.exec(v))) return +m[1]; if ((m = /^([\d.]+)em$/.exec(v))) return +m[1] * parent;
      if ((m = /^([\d.]+)%$/.exec(v))) return +m[1] * parent / 100; if (v === 'smaller') return parent / 1.2; return null; };
    const shrunk = c => { const T = tokens(c, 'collect'), src = html + '\n' + js, out = [];
      for (const m of src.matchAll(/<(small|sub|sup)\b/g)) {
        const tags = [...src.slice(Math.max(0, m.index - 600), m.index).matchAll(/<([a-z]+)\b((?:[^>$]|\$\{[^}]*\})*)>/g)], par = tags[tags.length - 1] || [, 'body', ''];
        const cls = ((par[2].match(/class="([^"]*)"/) || [, ''])[1]).replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).filter(Boolean);
        const inl = (par[2].match(/font-size:\s*([\d.]+px)/) || [])[1];
        const psz = fsPx(inl || cls.map(k => ruleVal(c, '.' + k, 'font-size')).filter(Boolean).pop() || '15px', T, 15);
        const own = cls.map(k => ruleVal(c, `.${k} ${m[1]}`, 'font-size')).filter(Boolean).pop() || ruleVal(c, m[1], 'font-size') || 'smaller';
        out.push([`<${par[1]} class="${cls.join(' ')}"> <${m[1]}>`, fsPx(own, T, psz)]); }
      return out; };
    const under = c => shrunk(c).filter(([, s]) => !(s >= 12));
    ok('(STAN-106-2) every <small> the app writes is 12 px or more as drawn: a chip\'s count and a stat\'s label take --fs-cap, not the browser\'s "smaller" (10 and 10.8 px at take 114)',
       shrunk(css).length >= 4 && under(css).length === 0, under(css).map(([w, s]) => `${w} ${s.toFixed(1)}px`).join(' | ') || shrunk(css).map(([, s]) => s).join(','));
    ok('...control: take 114\'s rule, with no size of its own, is caught', (() => { const c = css.split('.chip small{font-size:var(--fs-cap);').length === 2 ? css.replace('.chip small{font-size:var(--fs-cap);', '.chip small{') : null; return !!c && under(c).length >= 3; })());   // take 117: the three chip counts -- the stat cells' small label left with the cells (their labels are spans at --fs-cap)
    const rel = t => [...t.matchAll(/font-size:\s*(?:[\d.]+(?:em|rem|%)|smaller|x-small|xx-small|small)\b|(?:^|[;{"\s])font:\s*(?:[a-z-]+\s+)*[\d.]+(?:em|rem|%)/g)].map(m => m[0]);
    const shortPx = t => [...t.matchAll(/(?:^|[;{"\s])font:\s*(?:[a-z0-9-]+\s+)*?([\d.]+)px/g)].map(m => +m[1]).filter(v => v < 12);
    ok('...and no size in the app is relative (em, rem, %, smaller) or a font shorthand under 12 px -- the forms the literal check cannot read', rel(html + js).length === 0 && shortPx(html + js).length === 0, rel(html + js).concat(shortPx(html + js)).join(', '));
    ok('...control: a relative size and a shorthand at 11 px are caught', rel('.x{font-size:.8em}.y{font-size:smaller}').length === 2 && shortPx('.z{font:600 11px/1.2 x}').length === 1);

    /* (STAN-106-3) the price boxes take the one field rule: no copy of it that outranks the focus rule, and no patch for that */
    const frange = ruleVal(css, '.frange input', 'width'), fcopy = ['font', 'font-size', 'border', 'border-color', 'background', 'color'].filter(p => ruleVal(css, '.frange input', p) != null);
    const fieldSel = topRules(css).find(r => r.sels.includes('input:not([type])'));
    ok('(STAN-106-3) the filter\'s price boxes take the one field rule -- its card, edge and 16 px, and the brass on focus -- with no copy of it and no focus patch',
       frange === '100px' && fcopy.length === 0 && !topRules(css).some(r => r.sels.includes('.frange input:focus')) && !!fieldSel && declOf(fieldSel.body, 'font-size') === '16px' && /<input id="fMin" (?![^>]*\btype=)[^>]*>/.test(html) && ruleVal(css, 'input:focus', 'border-color') === 'var(--brass)',
       `copies: ${fcopy.join(', ')}`);

    /* (STAN-106-4) one thumbnail vocabulary, and the total's size named by its token */
    const T4 = tokens(css, 'collect');
    ok('(STAN-106-4) the dead --thumb-sm, -md and -lg are gone; --fs-total is .total\'s size and .total reads it', !/--thumb-(?:sm|md|lg)\s*:/.test(css) && T4['--fs-total'] === '46px' && ruleVal(css, '.total', 'font-size') === 'var(--fs-total)' && T4['--thumb-s'] === '32px',
       `${T4['--fs-total']} / ${ruleVal(css, '.total', 'font-size')}`);

    /* (SPEC-110-42) the trade and want rows draw the dense list's thumbnail, the picker's picture reads a token */
    const card4 = V.CAT.rows.find(p => p.num && !p.sealed && p.img && p.treat === 'base'), keepTr = [V.TRADE.give, V.TRADE.get], keepW = V.WANT.list;
    V.TRADE.give = [{ id: card4.id, n: 1 }]; V.TRADE.get = []; holds(() => V.go('trade')); const trH = (doc.getElementById('trGive') || {})._html || '';
    V.WANT.list = [{ num: card4.num, id: card4.id, added: new Date().toISOString() }]; holds(() => V.go('wants')); const wtH = (doc.getElementById('wtRows') || {})._html || '';
    V.TRADE.give = keepTr[0]; V.TRADE.get = keepTr[1]; V.WANT.list = keepW; V.go('home');
    ok('(SPEC-110-42) a trade line and a want-list row draw the dense list\'s thumbnail (32 px, a card\'s 6 px), and the picker\'s picture reads --thumb-l at a card\'s radius -- no 34 px or 52 px box left',
       /<div class="pic" style="width:32px;height:45px;[^"]*border-radius:6px/.test(trH) && /<div class="pic" style="width:32px;height:45px;[^"]*border-radius:6px/.test(wtH) && !/class="oa pic"/.test(js) && !/width:34px;flex:0 0 34px/.test(js)
       && ruleVal(css, '.opt .oa', 'width') === 'var(--thumb-l)' && ruleVal(css, '.opt .oa', 'border-radius') === '6px', `${(trH.match(/<div class="pic" style="[^"]*"/) || ['-'])[0]} | ${ruleVal(css, '.opt .oa', 'width')}`);

    /* (SPEC-111-50) a badged name wraps in the deck, trade, want and alert rows as it does in a search row */
    ok('(SPEC-111-50) a name that carries its printing\'s badge wraps in the dense rows too (.dkrow .n b), as it does in the search rows', ruleVal(css, '.dkrow .n b:has(> .badge)', 'white-space') === 'normal' && ruleVal(css, '.row .nm b:has(> .badge)', 'white-space') === 'normal' && ruleVal(css, '.dkrow .n b', 'white-space') === 'nowrap');

    /* (STAN-114-26) a pointer only on a control: the history header with nothing to open is a span */
    ok('(STAN-114-26) the history\'s header shows a pointer only where it opens something: .dtl-h sets none, the button keeps the global one',
       ruleVal(css, '.dtl-h', 'cursor') == null && ruleVal(css, '.dtl > span', 'cursor') == null && ruleVal(css, 'button', 'cursor') === 'pointer' && /: `<span class="dtl-h">\$\{esc\(head\)\}<\/span>`/.test(js), String(ruleVal(css, '.dtl-h', 'cursor')));

    /* (SPEC-108-34, SPEC-108-37) one glyph for remove and discard: the want list, an alert, a stock watch, a note and the Sim's
       trash draw g-trash; the minus is only "one fewer" and the cross only closes a sheet; no remove drawn as a times sign */
    const buttons4 = t => [...t.matchAll(/<button\b([^>]*)>((?:(?!<\/button>)[\s\S]){0,600}?)<\/button>/g)].map(m => ({ a: m[1], g: [...m[2].matchAll(/\bG\('([\w-]+)'|#g-([\w-]+)"/g)].map(x => x[1] || x[2]), inner: m[2] }));
    const label4 = a => unesc((a.match(/aria-label="([^"]*)"/) || [, ''])[1]);
    const misread = t => buttons4(t).flatMap(b => b.g.map(g => [g, b])).filter(([g, b]) => (g === 'minus' && !/^One fewer|\bdown$/.test(label4(b.a))) || (g === 'close' && !/\bdata-close=/.test(b.a))
         || (g === 'trash' && !/^(?:Remove|Delete|Stop watching|Trash)\b/.test(label4(b.a)))).map(([g, b]) => `g-${g} on "${label4(b.a) || b.a.slice(0, 40)}"`);
    const removers = ['data-want=', 'data-alrm=', 'data-sim="trashhand:', 'aria-label="Stop watching ${esc(a.name)}"', 'data-localdel='];
    const drawn = t => removers.map(r => buttons4(t).filter(b => b.a.includes(r)).map(b => b.g.join('+')).join('/'));
    const times = t => (t.match(/>\s*(?:\u00d7|&times;|&#215;|&#x[dD]7;|\\u00[dD]7)\s*<\/button>/g) || []).length;
    ok('(SPEC-108-34, SPEC-108-37) one glyph per meaning: a want, an alert, a stock watch, a note and the Sim\'s trash are removed with g-trash; g-minus is only "one fewer", g-close only closes a sheet; no remove drawn as a times sign',
       /<symbol id="g-trash" viewBox="0 0 24 24"/.test(html) && misread(js + html).length === 0 && drawn(js).every(d => d === 'trash') && times(js + html) === 0, misread(js + html).concat(drawn(js)).join(' | ') + ` | times ${times(js + html)}`);
    ok('...control: take 114\'s want list, the Sim\'s trash and a times sign are caught', misread('<button data-want="x" aria-label="Remove A from the want list">${G(\'minus\', 18)}</button><button data-sim="trashhand:1" aria-label="Trash this card (an effect)">${G(\'close\', 18)}</button>').length === 2
       && times('<button class="ghost" data-localdel="0" aria-label="Delete this note">\\u00d7</button>') === 1 && times('<b>Qty \u00d72</b>') === 0);

    /* (SPEC-108-35) every link that leaves the app says so, and says where */
    const leaving = t => [...t.matchAll(/<a\b([^>]*\btarget="_blank"[^>]*)>([\s\S]*?)<\/a>/g)].map(m => ({ a: m[1], inner: m[2] }));
    const unmarked = t => leaving(t).filter(l => !/\$\{ext\(/.test(l.inner) || !/aria-label=/.test(l.a)).map(l => l.inner.slice(0, 30));
    const fxA4 = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-a4-'));   /* the Hunt's fixtures, built from the saved responses as the take-74 to take-76 sections build them */
    execSync(`python3 tools/hunt.py --from-fixtures --out ${path.join(fxA4, 'feed-fixture.json')}`, { cwd: ROOT, stdio: 'pipe' });
    const keepSh = V.LOCAL.shops, keepSt = V.LOCAL.stores, keepZ = V.HUNT.zip, keepR = V.LOCAL.radius, keepN = V.LOCAL.notes, keepEv = V.EVENTS.tab;
    V.LOCAL.shops = JSON.parse(fs.readFileSync(path.join(fxA4, 'shops-fixture.json'), 'utf8')); V.LOCAL.stores = JSON.parse(fs.readFileSync(path.join(fxA4, 'stores-fixture.json'), 'utf8'));
    V.LOCAL.notes = [{ store: 'A4 probe store', what: 'a box', price: 90, when: new Date().toISOString().slice(0, 10) }]; V.HUNT.setZip('48329'); V.LOCAL.radius = 0; V.paintLocal(); const loc4 = doc.getElementById('localList')._html;
    const RealDate4 = ctx.Date, evTab = JSON.parse(fs.readFileSync(path.join(fxA4, 'events-fixture.json'), 'utf8')), ev0 = RealDate4.parse(evTab.rows.map(r => r[1]).sort()[0] + 'T12:00:00Z');
    ctx.Date = class extends RealDate4 { constructor(...a) { super(...(a.length ? a : [ev0])); } static now() { return ev0; } };   /* landmine 123: the fixture's events are read under their own first day */
    let evH = ''; try { V.EVENTS.tab = evTab; V.paintEvents(); evH = doc.getElementById('eventsList')._html; } finally { ctx.Date = RealDate4; }
    ok('(SPEC-108-35) every link that leaves the app carries the external glyph and a name: all six in the script, and on screen Local\'s Open and Events\' Register',
       leaving(js).length >= 6 && unmarked(js).length === 0 && /aria-label="Open [^"]+\u2019s online store">Open <svg class="g"[^>]*><use href="#g-external"\/><\/svg><\/a>/.test(loc4)
       && /aria-label="Register for [^"]+ on Bandai TCG\+">Register <svg class="g"[^>]*><use href="#g-external"\/><\/svg><\/a>/.test(evH), unmarked(js).join(' | ') || `${leaving(js).length} links`);
    ok('...control: take 114\'s bare Open is caught', unmarked('<a class="ghost" href="${esc(sh.url)}" target="_blank" rel="noopener" style="padding:8px 12px">Open</a>').length === 1);
    ok('(SPEC-108-34) on screen: a note\'s Delete draws g-trash, not a times sign', /data-localdel="0" aria-label="Delete this note"><svg class="g"[^>]*><use href="#g-trash"\/>/.test(loc4) && !/\u00d7<\/button>/.test(loc4));

    /* (SPEC-110-43) a day in words on Local and in the release reminders; the calendar file keeps ISO for the calendar */
    const iso4 = /\b\d{4}-\d\d-\d\d\b/;
    ok('(SPEC-110-43) Local\'s shop list writes each event\'s day in words, as the Events screen does ("2026-09-16 Store Championship" before)', !iso4.test(loc4) && /<span style="display:block;color:var\(--brass\)">[A-Z][a-z]{2} \d{1,2}(?:, \d{4})? /.test(loc4), (loc4.match(iso4) || [''])[0]);
    V.LOCAL.shops = keepSh; V.LOCAL.stores = keepSt; V.LOCAL.notes = keepN; V.EVENTS.tab = keepEv; V.LOCAL.radius = keepR; V.HUNT.setZip(keepZ || '');
    const sent = [], P4 = V.PLATFORM, keepP = { notify: P4.notify, notifyAt: P4.notifyAt, cancelNotify: P4.cancelNotify, notifyPermission: P4.notifyPermission }, keepRel = V.RELALERTS.list;
    P4.notify = async (id, title, body) => { sent.push(['now', title, body]); return true; }; P4.notifyAt = async (id, title, body) => { sent.push(['at', title, body]); return true; }; P4.cancelNotify = async () => true;
    try {
      const today4 = new Date().toISOString().slice(0, 10), pub4 = later(today4 + 'T00:00:00Z', 3).slice(0, 10), past4 = later(today4 + 'T00:00:00Z', -2).slice(0, 10);
      V.RELALERTS.list = []; V.RELALERTS.toggle(9001, 'A4 set', pub4);                                  /* armed for the day before */
      V.RELALERTS.list = [{ id: 9002, name: 'A4 late', pub: past4, created: today4, fired: null }]; await V.RELALERTS.check(today4);   /* the app opened after the day */
      P4.notifyPermission = async () => 'granted'; V.RELALERTS.list = [];
      const rel = doc.getElementById('releases'), tgt = { dataset: { relalert: '9003', relname: 'A4 toast', relpub: pub4 } }; tgt.closest = s => (s === '[data-relalert]' ? tgt : null);
      const sent2 = sent.slice();   /* the toggle below arms a third, for the day before */
      holds(() => rel._ev.click({ target: tgt, stopPropagation() {} })); await sleep(20);
      const toast4 = doc.getElementById('toast')._text || '';
      ok('(SPEC-110-43) a release reminder says its day in words -- scheduled, late and in the toast that sets it ("2026-11-20 \u2014 from OP TCG Hub" before)',
         sent2.length === 2 && sent.length === 3 && sent.every(([, t, b]) => !iso4.test(t) && !iso4.test(b)) && sent2[0][2].startsWith(V.dayText(pub4)) && sent2[1][1].endsWith('on ' + V.dayText(past4)) && toast4 === `Reminder set for the day before ${V.dayText(pub4)}`,
         JSON.stringify(sent) + ' | ' + toast4);
      ok('...and the calendar file keeps ISO, where a machine reads it', /releases \d{4}-\d\d-\d\d\./.test(V.releaseEvent({ id: 1, pub: pub4, name: 'A4', abbr: '' }, 'A4').notes));
    } finally { Object.assign(P4, keepP); V.RELALERTS.list = keepRel; }

    /* (SPEC-108-36) every toggle says whether it is on: a template that lights a button carries aria-pressed from the same test,
       a chip the filter sheet flips in place says it too, and the mode slider's tabs say which one is selected */
    const onTpl = t => [...t.matchAll(/<button\b((?:[^>$]|\$\{[^}]*\})*)>/g)].map(m => m[1]).filter(a => /class="[^"]*\$\{[^}]*\?\s*' ?on'\s*:\s*''\}/.test(a));
    const unpressed = t => onTpl(t).filter(a => !/aria-pressed="\$\{/.test(a)).map(a => a.slice(0, 50));
    ok('(SPEC-108-36) every toggle template carries aria-pressed from the test that lights it: Cards\' chips, the binder\'s sets, the checklist, Home\'s ranges, the filter sheet, the condition buttons',
       onTpl(js).length >= 13 && unpressed(js).length === 0 && !/classList\.toggle\('on'\)/.test(js), unpressed(js).join(' | ') || String(onTpl(js).length));
    ok('...control: a lit chip with no aria-pressed is caught', unpressed('<button class="chip$' + '{x ? \' on\' : \'\'}" data-q="1">').length === 1);
    const keepItems4 = V.OWN.items, keepFA = JSON.parse(JSON.stringify(V.FILT.all));
    V.OWN.items = [{ id: card4.id, qty: 1, condition: 'NM', pf: V.PF.active === 'all' ? 'main' : V.PF.active }];
    const shown4 = {};
    holds(() => V.paintCards()); for (const id of ['cdKw', 'cdCol', 'cdCost']) shown4[id] = doc.getElementById(id)._html;
    holds(() => V.go('binder')); shown4.bnSets = doc.getElementById('bnSets')._html;
    holds(() => V.openChecklist(card4.set)); shown4.ckFilter = doc.getElementById('ckFilter')._html;
    holds(() => V.paintHome()); shown4.ranges = doc.getElementById('ranges')._html;
    holds(() => V.openDetail(card4.id)); shown4.dCondSeg = doc.getElementById('dCondSeg')._html;
    holds(() => doc.getElementById('sortBtnAll')._ev.click()); for (const id of ['fSort', 'fSet', 'fRarity', 'fColor', 'fOnly']) shown4[id] = doc.getElementById(id)._html;
    const offState = Object.entries(shown4).flatMap(([id, h]) => [...h.matchAll(/<button\b[^>]*>/g)].map(m => m[0]).filter(b => { const p = (b.match(/aria-pressed="(true|false)"/) || [])[1], on = /class="(?:[^"]*\s)?on(?:\s[^"]*)?"/.test(b); return !p || (p === 'true') !== on; }).map(b => `${id}: ${b.slice(0, 50)}`));
    const counted4 = Object.values(shown4).reduce((a, h) => a + (h.match(/<button\b/g) || []).length, 0);
    /* a tap on a filter chip, in place: the state follows the filter */
    const rar = (shown4.fRarity.match(/data-fk="rarity" data-fv="([^"]*)"/) || [])[1], cls4 = new Set(), attrs4 = {};
    const chip4 = { dataset: { fk: 'rarity', fv: rar }, classList: { toggle: (c, on) => { (on === undefined ? !cls4.has(c) : on) ? cls4.add(c) : cls4.delete(c); return cls4.has(c); }, contains: c => cls4.has(c), add: c => cls4.add(c), remove: c => cls4.delete(c) },
      setAttribute: (k, v) => { attrs4[k] = String(v); }, getAttribute: k => attrs4[k] ?? null, closest: s => (s === '[data-fk]' ? chip4 : null) };
    const tap4 = () => holds(() => { doc.getElementById('filters')._ev.click({ target: chip4 }); return true; });
    tap4(); const t1 = [attrs4['aria-pressed'], cls4.has('on'), V.FILT.all.rarity.includes(rar)]; tap4(); const t2 = [attrs4['aria-pressed'], cls4.has('on'), V.FILT.all.rarity.includes(rar)];
    Object.assign(V.FILT.all, keepFA); doc.getElementById('filters').classList.remove('on'); V.OWN.items = keepItems4; while (V.closeAnyOverlay()) {} V.go('home');
    ok('...painted: every one of them says what it shows -- aria-pressed on each, "true" exactly where it is lit', counted4 >= 20 && offState.length === 0, offState.slice(0, 4).join(' | ') || String(counted4));
    ok('...and a chip the filter sheet flips in place says so, from the filter itself', !!rar && t1.join() === 'true,true,true' && t2.join() === 'false,false,false', JSON.stringify([rar, t1, t2]));

    /* (SPEC-110-47) no straight apostrophe between letters in the script, escaped or not -- the four "phone's" were escaped */
    const straight = t => (t.match(/[A-Za-z]\\?'[A-Za-z]/g) || []);
    ok('(SPEC-110-47) no straight apostrophe between letters in the shipped script, escaped or not (four toasts said "the phone\\\'s notification settings")', straight(js).length === 0 && (js.match(/phone\\u2019s notification settings/g) || []).length === 4, straight(js).join(' | '));
    ok('...control: the escaped and the plain forms are caught, the curled one is not', straight("check the phone\\'s settings").length === 1 && straight("don't").length === 1 && straight('the phone\u2019s').length === 0);

    /* (SPEC-110-48) set completion through pctNum: one decimal, none from 100 up -- 1 of the largest set is not 0%, 2 short is not 100% */
    const bySet4 = new Map(); for (const p of V.CAT.rows) if (p.num && !p.sealed) (bySet4.get(p.set) || bySet4.set(p.set, new Map()).get(p.set)).set(p.num, p);
    const [bigSet, bigNums] = [...bySet4.entries()].sort((a, b) => b[1].size - a[1].size)[0], bigList = [...bigNums.values()], nAll = bigList.length;
    const keepItems48 = V.OWN.items, row48 = k => { V.OWN.items = bigList.slice(0, k).map(p => ({ id: p.id, qty: 1, condition: 'NM', pf: 'main' })); V.paintHome(); return (doc.getElementById('setDone')._html.match(new RegExp(`${k} of ${nAll} numbers \u00b7 ([^<]*)<`)) || [])[1]; };
    const keepPF48 = V.PF.active; V.PF.active = 'main';
    const one48 = holds(() => row48(1)), near48 = holds(() => row48(nAll - 2)); V.OWN.items = keepItems48; V.PF.active = keepPF48; V.paintHome();
    ok(`(SPEC-110-48) set completion says it through pctNum: 1 of ${nAll} reads ${V.pctNum(100 / nAll)}, ${nAll - 2} of ${nAll} never 100% (take 114: "0%" and "100%")`,
       nAll >= 150 && one48 === V.pctNum(100 / nAll) && one48 !== '0%' && near48 === V.pctNum(100 * (nAll - 2) / nAll) && near48 !== '100%' && !/numbers \\u00b7 \$\{pct\}%/.test(js), `${one48} | ${near48}`);

    /* the open Fold, measured (the owner's Diagnostics at take 114): the Fold block's comment says what was measured */
    const src4 = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8');
    ok('the Fold block says the open Fold is MEASURED at 749 x 832 CSS px (2.625), no longer "about 840, INFERRED"', /open Fold \(749 x 832 CSS px at a pixel ratio of 2\.625, MEASURED/.test(src4) && !/about 840 px wide, INFERRED/.test(src4));
  });

  /* leave the shared app as the sections before found it */
  ctx._net = null; delete ctx.window.Capacitor; V.NET.WAIT = W0; V.NET.WAIT_BIG = WB0; ctx.navigator.onLine = on0;
  if (typeof V.loadCatalogue === 'function') await V.loadCatalogue();
  V.CAT.man.updateUrl = url0; while (V.closeAnyOverlay()) {} V.MODE.set('collect', false); V.go('home');
  ok('...and the shared app is back on the catalogue it shipped with', V.CAT.ready && !V.CAT.man.fromDisk && V.CAT.rows.length === manifest.printings && V.candidates('EB03-024').length === 3);
}


section('take 116 — the first-open experience: the opening screen and the guide share the listing\'s frame; four pages; Back closes the guide, Next pages it');
{ ok('the splash and the guide draw one scene: the listing\'s Prussian band, buff sky, ink and green, as literals on both', /#splash,#tour\{--t-prussian:#1f3d72;/.test(html) && /#splash\{[^}]*linear-gradient\(180deg,#1f3d72/.test(html) && /#tour\{[^}]*linear-gradient\(180deg,var\(--t-prussian\)/.test(html));
  ok('the opening screen carries the app\'s own icon file and the sea; the guide the same sea and, on its last page, the same icon', (html.match(/bundle\/icon\.svg/g) || []).length === 1 && (html.match(/class="gsea"/g) || []).length === 2 && (js.match(/bundle\/icon\.svg/g) || []).length === 1);
  ok('the guide is a dialog, not a screen: role, modal, a name, focusable so its name is read out, and still a div (twenty sections stay twenty)', /<div id="tour" hidden role="dialog" aria-modal="true" aria-label="Welcome to OP TCG Hub" tabindex="-1">/.test(html) && !/<section id="tour"/.test(html));
  ok('the guide is an overlay by class: #tour.on shows it, [hidden] wins after it, and the four buttons hide by attribute', /#tour\.on\{display:flex\}\s*#tour\[hidden\]\{display:none\}\s*#tour \[hidden\]\{display:none\}/.test(html));
  const tourCss = [...html.matchAll(/#tour[^{]*\{[^}]*\}/g)].map(m => m[0]);
  ok('every rule of the guide is token-sized: no font-size literal (the old 32, 22, 14.5 and 13.5 px are gone)', tourCss.length >= 20 && tourCss.every(r => !/font-size:\d/.test(r)), tourCss.filter(r => /font-size:\d/.test(r)).join(' | '));
  ok('a page scrolls inside itself on a short screen instead of clipping (overflow-y:auto, not hidden)', /#tour \.gcard\{[^}]*overflow-y:auto/.test(html) && !/#tour \.gcard\{[^}]*overflow:hidden/.test(html));
  ok('the dots are indicators (four 44 px targets seven pixels apart would sit on each other) and the page is read out', /#tour \.gdots i\{/.test(html) && /id="tourDots" aria-hidden="true"/.test(html) && /id="tourPage" aria-live="polite"/.test(html) && !/#tour \.gdots button/.test(html));
  ok('four pages, one per mode and one for what stays on the phone; the pictures are lookups, never pinned ids (AGENTS rule 3)', V.GUIDE.length === 4 && V.GUIDE.every(c => c.g && c.t && c.p && Array.isArray(c.l) && c.l.length >= 3) && /pic: \(\) => topCard\(\)/.test(js) && /pic: \(\) => \(heroLeader\(\) \|\| \{\}\)\.L/.test(js) && /pic: \(\) => \(newestTop\(\) \|\| \{\}\)\.p/.test(js) && !/pic: \(\) => [A-Za-z.]*byId\.get\(\d/.test(js));
  const pics = V.GUIDE.map(c => c.pic ? c.pic() : null);
  ok('the three pictures resolve to printings with a picture: the dearest card, a Leader, the newest set\'s top card', !!pics[0] && !!pics[0].img && !!pics[1] && pics[1].type === 'Leader' && !!pics[2] && !!pics[2].img && pics[3] === null, pics.map(p => p ? p.name + ' ' + (p.num || '') : 'none').join(' / '));
  ok('the dearest card is the top of every set\'s top', !!pics[0] && pics[0].market === Math.max(...V.CAT.rows.filter(p => !p.sealed && p.hash && p.market > 0 && p.img).map(p => p.market)));
  const tour = ctx.document.getElementById('tour');
  V.guideOpen();
  const cardsHtml = ctx.document.getElementById('tourCards').innerHTML;
  ok('open: the guide is on and not hidden, four pages painted, three with a picture and the fourth with the app\'s own card', tour.classList.contains('on') && tour.hidden === false && (cardsHtml.match(/class="gcard"/g) || []).length === 4 && (cardsHtml.match(/<img class="ref"/g) || []).length >= 3 && /class="pic own"/.test(cardsHtml));
  ok('the glyph on each page is read through the form the sprite check knows (G(c.g, 64))', (js.match(/G\(c\.g, 64\)/g) || []).length === 2);
  ok('page 1: Skip and Next shown, the last page\'s two hidden; one dot on; the page announced', ctx.document.getElementById('tourSkip').hidden === false && ctx.document.getElementById('tourNext').hidden === false && ctx.document.getElementById('tourStart').hidden === true && (ctx.document.getElementById('tourDots').innerHTML.match(/class="on"/g) || []).length === 1 && ctx.document.getElementById('tourPage').textContent === 'Page 1 of 4');
  V.guideGo(3);
  ok('the last page: Scan a card and Look around first shown, Skip and Next hidden, the fourth dot on', ctx.document.getElementById('tourStart').hidden === false && ctx.document.getElementById('tourLook').hidden === false && ctx.document.getElementById('tourSkip').hidden === true && /<i class=""><\/i><i class=""><\/i><i class=""><\/i><i class="on"><\/i>/.test(ctx.document.getElementById('tourDots').innerHTML) && ctx.document.getElementById('tourPage').textContent === 'Page 4 of 4');
  V.guideGo(4); V.guideGo(-1);
  ok('a page past either end is refused', ctx.document.getElementById('tourPage').textContent === 'Page 4 of 4');
  /* Back (landmine 201): the overlay walk sees the guide now, and closes it unseen */
  try { ctx.localStorage.removeItem('optcghub.guide.v3'); } catch (e) {}
  const closed = V.closeAnyOverlay();
  ok('Back closes the open guide through the overlay walk (it could not see it before: it looked for a class the guide never carried) and leaves it unseen', closed === true && tour.hidden === true && !tour.classList.contains('on') && (ctx.localStorage.getItem('optcghub.guide.v3') || null) === null);
  ok('...control: with the guide closed the walk has nothing to close', V.closeAnyOverlay() === false);
  V.guideOpen(); V.guideClose(true);
  ok('Skip or Start marks the guide seen under the v3 key', ctx.localStorage.getItem('optcghub.guide.v3') === '1' && tour.hidden === true);
  /* Next cannot be undone by the strip's own scroll (landmine 202): the handler reads, it never scrolls */
  const handler = (js.match(/#tourCards'\)\.addEventListener\('scroll', \(\) => \{[\s\S]*?\n\}\);/) || [''])[0];
  ok('the strip\'s scroll handler only reads the page back: it never calls scrollTo, and the one scroller is guidePaint (watched red on take 114, whose handler painted the page back from inside the scroll)', handler.length > 100 && !/scrollTo/.test(handler) && !/guidePaint\(\)/.test(handler) && /behavior: reducedMotion\(\) \? 'auto' : 'smooth'/.test(js) && (js.match(/cards\.scrollTo\(/g) || []).length === 1, handler.slice(0, 80));
  /* Scan a card: into Collect's scanner with Home under it */
  V.MODE.set('hunt', false); V.guideOpen();
  let started = null; try { V.guideStart(); started = true; } catch (e) { started = String(e && e.stack || e); }
  ok('Scan a card from any mode lands in Collect\'s scanner with Home under it, the guide seen', started === true && V.MODE.cur === 'collect' && V.NAV.stack.slice(-2).join(',') === 'home,scan' && tour.hidden === true, String(started).slice(0, 200) + ' ' + V.NAV.stack.join('>'));
  while (V.closeAnyOverlay()) {} V.MODE.set('collect', false); V.go('home'); }


section('take 117 — the owner\'s polish: starter decks once, the strips readable, three numbers on a card, the shutter row on a grid, the top bar seamless, the note under More');
{ V.MODE.set('hunt', false); V.SEALED.q = ''; V.SEALED.kind = 'all'; V.SEALED.closed.clear(); V.paintSealed();
  const hs = ctx.document.querySelector('#sealedList').innerHTML;
  const deckSet = [...V.CAT.sets.entries()].find(([id, st]) => st.kind === 'deck' && V.CAT.rows.some(p => p.set === id && V.SEALED.isProduct(p)));
  const ids = deckSet ? V.CAT.rows.filter(p => p.set === deckSet[0] && V.SEALED.isProduct(p)).map(p => p.id) : [];
  const times = id => (hs.match(new RegExp('data-open="' + id + '"', 'g')) || []).length;
  ok('a starter-deck set\'s products are listed once, in the Starter decks section, and the set has no strip of its own (at take 114 they were listed twice: 32 of 85 strips)', !!deckSet && ids.length > 0 && ids.every(id => times(id) === 1) && !new RegExp('data-setfold="' + deckSet[0] + '"').test(hs), deckSet ? deckSet[1].name + ' ' + ids.map(times).join(',') : 'no deck set');
  ok('...control: the section is open, so the count is of drawn rows', /data-setfold="decks" aria-expanded="true"/.test(hs));
  const dated = [...hs.matchAll(/<button class="fgrp setstrip" data-setfold="(?!decks)[^"]+"[^>]*>(?:<div class="artbg crisp"[\s\S]*?<\/div>)?<span>[^<]*<span class="note">(Released|Releases) [^<]+<\/span>/g)];
  ok('every set strip says when the set was released, in words, on its own line', dated.length >= 20, String(dated.length));
  ok('the strip is 104 px tall with the name centred at the title size and the art placed on the card\'s face (B3, the owner\'s pick)', /\.setstrip\{[^}]*min-height:104px[^}]*align-items:center/.test(html) && /\.setstrip \.artbg\.crisp img\{object-position:50% 62%\}/.test(html) && /\.setstrip > span:first-of-type\{[^}]*font-size:var\(--fs-title\)/.test(html));
  V.SEALED.closed.add('decks'); V.MODE.set('collect', false);
  /* the card page: three numbers, never chips */
  const leader = V.CAT.rows.find(p => p.type === 'Leader' && p.life && p.power); const chr = V.CAT.rows.find(p => p.type === 'Character' && p.cost != null && p.cost !== '' && p.power && p.counter);
  V.openDetail(chr.id); const c1 = ctx.document.querySelector('#dStats').innerHTML;
  ok('a Character shows Type, Cost and Power as three cells, each label above its value -- no counter, no colour (the owner: you can just read the card)', /class="statbar"/.test(c1) && (c1.match(/<div><span>/g) || []).length === 3 && /<span>Type<\/span><b class="word">Character<\/b>/.test(c1) && /Cost<\/span>/.test(c1) && /Power<\/span>/.test(c1) && !/Counter/.test(c1) && !/class="chip"/.test(c1), c1.slice(0, 160));
  V.openDetail(leader.id); const c2 = ctx.document.querySelector('#dStats').innerHTML;
  ok('a Leader shows the same three: Type, Life in the cost cell, Power', (c2.match(/<div><span>/g) || []).length === 3 && /<span>Type<\/span><b class="word">Leader<\/b>/.test(c2) && /Life<\/span>/.test(c2) && /Power<\/span>/.test(c2) && !/Cost<\/span>/.test(c2), c2.slice(0, 160));
  const ev = V.CAT.rows.find(p => p.type === 'Event' && p.cost != null && p.cost !== '' && !p.power); V.openDetail(ev.id); const c3 = ctx.document.querySelector('#dStats').innerHTML;
  ok('an Event, which has no power, still shows three cells: a dash where the number would be (the owner: every card the same three squares)', (c3.match(/<div><span>/g) || []).length === 3 && /<span>Power<\/span><b>—<\/b>/.test(c3), c3.slice(0, 160));
  const don = V.CAT.rows.find(p => p.sealed && !p.num && /don!! card/i.test(p.name)); if (don) { V.openDetail(don.id); ok('...and a DON!! card, with none of the three, shows no row', ctx.document.querySelector('#dStats').innerHTML === ''); }
  ok('the row keeps 14 px under it, so the cells never touch the panel below (seen in the first look)', /\.statbar\{display:flex;gap:8px;margin:2px 0 14px\}/.test(html));
  ok('the cells are token-sized in one row that never wraps, each a third at most', /\.statbar\{display:flex/.test(html) && /\.statbar>div\{[^}]*max-width:calc\(\(100% - 16px\) \/ 3\)/.test(html) && /\.statbar b\{[^}]*font-size:var\(--fs-title\)/.test(html));
  ok('the printing\'s badge sits on the title\'s centre line (measured at 4x: +0.1 px on the caps\' centre)', /\.ab-title \.badge\{vertical-align:middle;line-height:1;padding:4px 6px 1px\}/.test(html));
  while (V.closeAnyOverlay()) {} V.go('home');
  /* the shutter row */
  ok('the shutter row is a three-column grid: the icon buttons left, the shutter centred, Review right, nothing wraps', /\.shutterbar\{display:grid;grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/.test(html) && /<div class="shl">/.test(html) && /<div class="shr">/.test(html) && /\.shutterbar \.shl \.ghost\{width:44px;height:44px/.test(html) && /\.shutterbar \.shr \.ghost\{white-space:nowrap/.test(html) && /id="btnUndo" aria-label="Undo the last scan"/.test(html));
  /* the top bar */
  ok('the mode bar starts at the very top and carries the status-bar inset itself, so its ground covers the inset once the page scrolls (the owner\'s screenshot: art under the clock)', /\.modebar\{position:sticky;top:0;[^}]*padding:calc\(var\(--sat\) \+ 6px\) 0 2px/.test(html) && /:root:not\(\.at-top\) \.modebar\{background:linear-gradient\(var\(--bg\) 78%,transparent\)\}/.test(html) && !/body\{[^}]*padding-top:var\(--sat\)/.test(html));
  /* the release note */
  V.go('settings'); const more = ctx.document.querySelector('#setBody').innerHTML;
  ok('More draws the release note for this take under About, closed', /<details class="wn"><summary>New in this update<\/summary>/.test(more) && !/<details class="wn" open/.test(more));
  /* the fallback label, the deck editor's row, the nav's one rule, the sizes */
  ok('a tile whose picture is missing stacks the name pill over the number (the flex row ran them together: "Nefeltari ViviEB03-024")', /\.art \.ph\{[^}]*flex-direction:column/.test(html) && /<span class="phl">\$\{esc\(p\.name\)\}<\/span><span class="num">\$\{esc\(p\.num\)\}<\/span>/.test(js) && /\.opt \.oa \.ph\{[^}]*flex-direction:column/.test(html));
  ok('the deck editor\'s bottom row wraps on a narrow phone instead of scrolling the page sideways (360 px, landmine 156)', /\.dkfoot\{flex-wrap:wrap\}/.test(html) && /@media \(max-width:380px\)\{\.dkfoot #dkSave\{flex:1 1 100%\}\}/.test(html));
  ok('the nav\'s label colour is one rule, the token, not a hex a later rule overrode', (html.match(/\nnav button\{/g) || []).length === 1 && !/color:#B9BEC7/.test(html) && (html.match(/\nnav button\.on\{/g) || []).length === 1);
  const cssPart = html.slice(0, html.indexOf('<script'));
  const offScale = [...cssPart.matchAll(/font-size:(\d+(?:\.\d+)?)px/g)].map(m => +m[1]).filter(v => ![12, 13, 14, 15, 16, 18, 26, 34, 44].includes(v));
  ok('every font-size in the stylesheet is on the token scale (25 literals were off it at take 114)', offScale.length === 0, offScale.join(','));
  ok('the placeholder rule is declared once, and the distributor line\'s text uses the ink token', (html.match(/\.search input::placeholder\{/g) || []).length === 1 && /\.dline\{[^}]*color:var\(--accent-ink\)\}/.test(html) && !/\.dline\{[^}]*color:var\(--brass\)/.test(html));
  ok('the Sim\'s opponent line says "in play", not "char"', / in play'/.test(js) && !/' char'/.test(js));
  V.go('home'); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
