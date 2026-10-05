/* smoke sections 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16: shipped artifact | boot | offline integrity (PROTOCOL §8) | landmine 1 — the printing is the unit | the confidence gate (landmine 12) | negative controls | the collection is the user\'s (PROTOCOL §9) | honesty (PROTOCOL §10) | take 3 — features the screenshots showed | take 3 — measured hash thresholds (landmine 49) | take 6 — what the card face says (landmine 60) | take 8 — day two (the delta on every screen) | take 10 — the scanner stages (A2, everything but the camera) | take 125 — the scanner reads the number where the recogniser finds it (A2; landmines 16, 233-236) | take 11 — filter & sort | take 90 — the set chips (A36, landmine 126) | take 13 — the deck builder (Comprehensive Rules v1.2.0 §5-1)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('shipped artifact');
ok('index.html references the built app.js', html.includes('src="app.js"'));
ok('no unreplaced build token', !html.includes('__TAKE__') && !js.includes('__TAKE__'));

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
/* take 141 (landmine 252): validate ships a >10x move the day's cheapest listing agrees with (within 3x) -- a new
   promo's price found, 710255 $0.49 -> $18.75 against a $36.99 listing -- and refuses one it does not */
const tenX = p => Math.abs(p.d1p) < 900 || (p.low > 0 && p.market / p.low <= 3 && p.market / p.low >= 1 / 3);
ok('no printing moved more than 10x overnight unless the day\'s cheapest listing agrees, within 3x (landmines 7, 252)',
   withD.every(tenX),
   withD.filter(p => !tenX(p)).map(p => `${p.id} ${p.d1p}% low ${p.low}`).slice(0, 5).join(' | ') || `${withD.filter(p => Math.abs(p.d1p) >= 900).length} corroborated`);
ok('...control: a 37x move with its cheapest listing 5x off is refused, one with no listing too', !tenX({ d1p: 3727, market: 187.5, low: 36.99 }) && !tenX({ d1p: 3727, market: 18.75, low: null }) && tenX({ d1p: 3727, market: 18.75, low: 36.99 }));
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

section('take 125 — the scanner reads the number where the recogniser finds it (A2; landmines 16, 233-236)');
/* a lost dash: every OCR slip of it (a dot, another width of dash, a gap) is stripped by normaliseRead */
ok('a number whose dash is lost is read: OP09.118SEC, OP09 118, OP09–118',
   ['OP09.118SEC', 'OP09 118', 'OP09–118'].every(t => pr(t).number === 'OP09-118'), JSON.stringify(['OP09.118SEC', 'OP09 118', 'OP09–118'].map(t => pr(t).number)));
ok('...a promo keeps its dash: P084 is no read, P-084 is', pr('P084').number === null && pr('P-084').number === 'P-084');
ok('...and the badge digits still run on harmlessly: EB04-024008, SPOP05-119SEC2', pr('EB04-024008').number === 'EB04-024' && pr('SPOP05-119SEC2').sp === true);
/* where a number may be: on a card in the view -- not in the top or left quarter (CODE_AT) */
{ const at = (text, x, y) => ({ text, box: { x: x - 30, y: y - 4, w: 60, h: 8 } });
  const nums = lines => SC.codesIn({ text: '', lines }, 1000, 1400).map(r => r.number);
  ok('a number in the view\'s top quarter or left quarter is a neighbour\'s and is not taken', nums([at('OP14-040', 800, 200), at('OP10-002', 150, 1300)]).length === 0);
  ok('...control: the same numbers where a card in view prints its own are taken', nums([at('OP14-040', 800, 1300), at('OP10-002', 700, 1300)]).join() === 'OP14-040,OP10-002');
  ok('...a line without a place is taken at its word', nums([{ text: 'OP14-040', box: null }]).join() === 'OP14-040');
  ok('...and a line that is not a real number is not taken', nums([at('OP99-999', 800, 1300), at('Kuzan', 500, 1200)]).length === 0);
  ok('the place is the one MEASURED on the cards (CODE_AT: 84 % across, 95.2 % down)', SC.CODE_AT.x === 0.84 && SC.CODE_AT.y === 0.952);
  /* a number that runs down the picture is on a card that is not upright: a neighbour lying on its side (landmine 235) */
  const tall = (text, x, y) => ({ text, box: { x: x - 4, y: y - 30, w: 8, h: 60 } });
  ok('a number whose line runs down the picture is not taken (a neighbour lying on its side)', nums([tall('OP14-040', 800, 1300)]).length === 0);
  ok('...control: the same number running across is', nums([at('OP14-040', 800, 1300)]).join() === 'OP14-040');
  /* the card's own words: OP10-046 is Kyros; the owner's close-up read OP10-040 twice */
  const read = lines => SC.codesIn({ text: lines.map(l => l.text).join('\n'), lines }, 1000, 1400).map(r => r.number).join();
  ok('a number the card\'s name contradicts is refused: OP10-040 read on a card that says Kyros (OP10-046, a digit away)', read([at('Kyros', 500, 1200), at('OP10-040', 800, 1300)]) === '');
  ok('...control: OP10-046 on the same card is read', read([at('Kyros', 500, 1200), at('OP10-046', 800, 1300)]) === 'OP10-046');
  ok('...control: OP10-040 with no name read is read (refused only on a contradiction, never corrected)', read([at('OP10-040', 800, 1300)]) === 'OP10-040');
 }
/* the view the guide shows: object-fit: cover of the frame */
{ const r = SC.viewRect(1080, 1920, 300, 440);
  ok('the view is the middle of the frame the guide shows: the Fold\'s 1080 x 1920 in a 300 x 440 guide is 1080 x 1584 from y 168', [r.x, r.y, r.w, r.h].map(Math.round).join() === '0,168,1080,1584', JSON.stringify(r)); }
ok('the looks: the whole view first, then the number\'s corner, then the glare look -- no turned looks (a card is scanned upright; landmine 235)', SC.LOOKS.map(l => l.name).join() === 'whole,near,glare');
/* the vote, then the hold: a card left in view is counted once (landmine 16) */
{ const decisions = (v, seq, resetAfter) => { let n = 0; for (const x of seq) if (v.push(x)) { n++; if (resetAfter) v.reset(); } return n; };
  const stay = ['OP01-016', 'OP01-016', 'OP01-016', 'OP01-016', 'OP01-016', 'OP01-016', 'OP01-016', 'OP01-016'];
  ok('a card left in view for eight reads is decided once', decisions(SC.makeVoter(), stay) === 1);
  ok('...control: a vote reset after each decision, as take 10\'s loop did, decides it four times', decisions(SC.makeVoter(), stay, true) === 4);
  const v = SC.makeVoter();
  ok('the number decided is held while it stays in view', v.push('OP01-016') === null && v.push('OP01-016') === 'OP01-016' && v.held === 'OP01-016' && v.push('OP01-016') === null);
  ok('...two captures without it (a hand, a flicker) do not let it go', v.push(null) === null && v.push(null) === null && v.held === 'OP01-016' && v.push('OP01-016') === null);
  ok('...three do, and the card back in view is decided again from two fresh reads', (v.push(null), v.push(null), v.push(null), v.held === null) && v.push('OP01-016') === null && v.push('OP01-016') === 'OP01-016');
  ok('...another card while one is held is voted on as usual', v.push('OP01-017') === null && v.push('OP01-017') === 'OP01-017' && v.held === 'OP01-017'); }


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
  return { vivi, nami, eb, leaders, F, G, S, O, c, OWNROWS, dear, d, A, mk, SC, pr, auto, ask, has, before, single, base, faces };   /* the fixtures 26 later sections read (measured 2 Oct, A44 item 6) */
}
