/* smoke section 73: take 114 — A32\'s distributor state timeline, from the history rows: what was seen, at how many checks, and which changes are the calendar
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
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
  const TL_NOTE = 'Some changes are worked out from dates, so they show between two checks, not on a day.';   // take 138: in fewer words
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
     JSON.stringify(gl1) === JSON.stringify(exp1) && d1h.split(TL_NOTE).length === 2 && d1h.indexOf(TL_NOTE) > d1h.indexOf('It sells to stores, not to you'), JSON.stringify(gl1));
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
    ok('...the collector is told, and pointed at Restore (the collection first, then how many other lists -- 11 since take 136, the waiting scans among them)', /^Your saved collection and 11 other lists could not be read — use Restore from backup, under More$/.test(toastText(B.d)), toastText(B.d));
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
       !!R.V && R.V.backupHeld() === true && R.V.OWN.items.length === 0 && /^Your saved collection and 11 other lists could not be read/.test(toastText(R.d)) && (R.V.scheduleBackup('sync'), await sleep(450), R.st['vault.backup'] === good), R.V ? toastText(R.d) : 'no app');
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
    /* take 136 (A43): the waiting scans are in the backup now, so an unreadable batch holds it as every list it
       carries does; the control moves to a cache, which is in no backup */
    const Bt = await bootFresh({ st: { 'vault.items': line1, 'vault.batch': '[1,', 'vault.backup': goodD } });
    const btHeld = holds(() => Bt.V.backupHeld()); holds(() => Bt.V.commitOwn('detail')); await sleep(450);
    ok('an unreadable batch holds the backup too since take 136 (the waiting scans are in it): a commit keeps the file', btHeld === true && Bt.st['vault.backup'] === goodD, JSON.stringify({ btHeld, kept: Bt.st['vault.backup'] === goodD }));
    const Hc = await bootFresh({ st: { 'vault.items': line1, 'vault.hunt': '[1,', 'vault.backup': goodD } });
    const hcHeld = holds(() => Hc.V.backupHeld()); holds(() => Hc.V.commitOwn('detail')); await sleep(450);
    ok('control: an unreadable cache (the Hunt feed, in no backup) holds nothing -- the backup is written', hcHeld === false && !!Hc.st['vault.backup'] && Hc.st['vault.backup'] !== goodD, JSON.stringify({ hcHeld }));
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
       gtsNote.startsWith(txt(`Could not reach GTS Distribution since ${V.momentText(kg.stale_since)}; its last check, `) + ' ') && gtsNote.includes(`${kg.items.length} products: `), gtsNote);
    const tNote = txt((ho.match(/<h3>Target<\/h3>\s*<div class="note">([\s\S]*?)<\/div>/) || [, ''])[1]);
    ok('...and Target\'s panel the same, for its kept copy', tNote.startsWith(txt(`Online and shelf stock at Target, refreshed hourly. Could not reach Target since ${V.momentText(kt.stale_since)}; its last check, `) + ' ') && tNote.includes(`${kt.items.length} products online`), tNote);
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
    const tokens = (c, mode, theme = 'dark') => { const rs = topRules(c), t = {};
      const take = sel => { for (const r of rs) if (r.sels.includes(sel)) for (const m of r.body.matchAll(/(--[\w-]+)\s*:\s*([^;]*)/g)) t[m[1]] = m[2].trim(); };
      take(':root'); if (mode !== 'collect') take(`:root[data-mode="${mode}"]`);
      if (theme === 'light') { take(':root[data-theme="light"]'); if (mode !== 'collect') take(`:root[data-theme="light"][data-mode="${mode}"]`); }   /* take 120: the light blocks lie over the dark ones, in the cascade's order */
      return t; };
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
    const pairs = (c, mode, theme = 'dark') => { const T = tokens(c, mode, theme), C = k => colOf(`var(${k})`, T), R = [],
      rv = (sel, prop) => (theme === 'light' ? ruleVal(c, `:root[data-theme="light"] ${sel}`, prop) : null) ?? ruleVal(c, sel, prop);   /* take 120: a light rule over a component's own */
      const tint = C('--accent-bg');
      for (const k of ['--fg', '--dim', '--dim2', '--accent-ink', '--up', '--down', '--gold']) R.push([`${k.slice(2)} on the selected tint`, C(k), tint]);
      R.push(['down on the bad tint', C('--down'), C('--bad-bg')], ['up on the good tint', C('--up'), C('--ok-bg')], ['gold on the warning tint', C('--gold'), over(C('--warn-bg'), C('--bg'))]);
      const op = parseFloat(rv('.chip small', 'opacity') ?? '1'), chipFg = colOf(rv('.chip', 'color'), T), chipBg = colOf(rv('.chip', 'background'), T);
      const onFg = colOf(rv('.chip.on', 'color'), T), onBg = colOf(rv('.chip.on', 'background'), T);
      R.push(['a chip\'s count', chipFg && chipBg && over([...chipFg.slice(0, 3), op], chipBg), chipBg], ['a selected chip\'s count', onFg && onBg && over([...onFg.slice(0, 3), op], onBg), onBg]);
      const bar = over(colOf(rv('nav', 'background'), T) || [0, 0, 0, 0], C('--bg')), pill = colOf(rv('nav button.on', 'background'), T);
      R.push(['the nav\'s active label', colOf(rv('nav button.on', 'color'), T), pill ? over(pill, bar) : bar], ['the nav\'s other labels', colOf(rv('nav button', 'color'), T), bar]);
      return R.map(([n, f, b]) => [n, f && b ? cr(f, b) : 0]); };
    const lowPairs = (c, mode, theme = 'dark') => pairs(c, mode, theme).filter(([, r]) => !(r >= 4.5));
    for (const theme of ['dark', 'light']) for (const mode of MODES) ok(`(SPEC-106-29, SPEC-106-30) ${theme} ${mode}: every text on a tint clears 4.5:1, computed from the shipped rules -- the selected tint, the bad, good and warning tints, a chip\'s count, the nav\'s labels (six palettes since take 120)`,
       pairs(css, mode, theme).length === 14 && lowPairs(css, mode, theme).length === 0, lowPairs(css, mode, theme).map(([n, r]) => `${n} ${r.toFixed(2)}`).join(', ') || pairs(css, mode, theme).map(([n, r]) => `${n.split(' ')[0]} ${r.toFixed(2)}`).join(' '));
    { /* take 114's rules, planted back one by one -- each plant checked to have landed */
      const plant = (c, a, b) => (c.split(a).length === 2 ? c.replace(a, b) : null);
      const t12 = (m => m ? css.replace(m[0], m[0].replace('var(--brass) 8%', 'var(--brass) 12%')) : null)(css.match(/--accent-bg:color-mix\(in srgb,var\(--brass\) 8%,var\(--card\)\);\s+--warn-bg:/));   // take 118: Hunt's tint reads 8% too; Collect's is the one its warning tint follows (the shipped css carries no comment to find it by)
      const t14 = plant(css, '--bad-bg:color-mix(in srgb,var(--down) 10%,var(--card))', '--bad-bg:color-mix(in srgb,var(--down) 30%,var(--card))');   // take 118: on the indigo --down clears take 114's 14% (5.36); 30% is the plant
      const n82 = plant(css, 'nav button.on{color:var(--accent-ink);background:var(--accent-bg)}', 'nav button.on{color:var(--accent-ink);background:color-mix(in srgb,var(--card2) 70%,var(--brass) 12%)}');
      const o6 = plant(css, '.chip small{font-size:var(--fs-cap);', '.chip small{opacity:.6;font-size:var(--fs-cap);');
      const names = (c, m) => c ? lowPairs(c, m).map(([n]) => n) : ['(plant did not land)'];
      const lows = (c, m) => c ? lowPairs(c, m).map(([n, r]) => `${n} ${r.toFixed(2)}`).join(', ') : '(plant did not land)';
      ok('...control: take 114\'s Collect tint (12%) leaves --dim2 under 4.5 on the indigo (the take-118 --dim and --down are lighter and clear it), and a 30% bad tint leaves --down under it; Play is untouched',
         !!t12 && !!t14 && names(t12, 'collect').includes('dim2 on the selected tint') && names(t14, 'collect').includes('down on the bad tint') && names(t12, 'play').length === 0 && names(t12, 'hunt').length === 0,
         `${lows(t12, 'collect')} | ${lows(t14, 'collect')}`);
      ok('...control: take 114\'s translucent pill puts Prep & Play\'s active nav label under 4.5 (4.42), and only there', !!n82 && names(n82, 'play').join() === 'the nav\'s active label' && names(n82, 'collect').length === 0 && names(n82, 'hunt').length === 0, `${names(n82, 'play')}`);
      ok('...control: a count at .6 opacity is caught in every palette (2.6:1 in Collect)', !!o6 && MODES.every(m => names(o6, m).includes('a chip\'s count') && names(o6, m).includes('a selected chip\'s count')));
    }
    ok('(SPEC-106-29) the tints: the selected tint is take 106\'s 12% in Prep & Play and 8% in Collect (take 115) and on Hunt\'s kraft (take 118); the bad tint 10% in Collect, 14% elsewhere',
       tokens(css, 'play')['--accent-bg'] === 'color-mix(in srgb,var(--brass) 12%,var(--card))' && ['collect', 'hunt'].every(m => tokens(css, m)['--accent-bg'] === 'color-mix(in srgb,var(--brass) 8%,var(--card))')
       && ['play', 'hunt'].every(m => tokens(css, m)['--bad-bg'] === 'color-mix(in srgb,var(--down) 14%,var(--card))') && tokens(css, 'collect')['--bad-bg'] === 'color-mix(in srgb,var(--down) 10%,var(--card))');

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
    SIM4.g = null; SU.sel = null; SU.post = null; SU.result = null; holds(() => V.go('sim')); shot();
    const g4 = SIM4.new(dA, dB, 0, { seed: 104 }); SIM4.mulligan(0, false); SIM4.mulligan(1, false);
    holds(() => SIM4.giveDon(0, 'leader')); SU.sel = { ref: 'leader' }; shot(); const mainBoard = boards[boards.length - 1];
    SU.sel = null; SIM4.endTurn(); SIM4.endTurn(); const P0 = SIM4.P(0); P0.leader.rested = false; P0.modl = [];
    const att = holds(() => SIM4.attack(0, 'leader', 'leader')); shot(); const blockBoard = boards[boards.length - 1];
    holds(() => SIM4.noBlock()); shot(); const counterBoard = boards[boards.length - 1];
    const res4 = holds(() => SIM4.resolve()); if (res4) SU.post = { i: 1, att: 0, res: res4 }; shot(); const postBoard = boards[boards.length - 1];   // take 122: the post screen carries its result
    SU.post = null; SU.result = null; g4.queue = [{ i: g4.active, e: { raw: 'You may draw 1 card. (A4 probe)', t: 'onplay', if: [], do: [{ a: 'draw', n: 1 }] }, steps: [{ a: 'draw', n: 1 }], step: 0, targets: null, ref: null, cardId: dA.leader, hand: false }]; shot(); const offerBoard = boards[boards.length - 1];   // take 122: an offer waits in the engine's queue; take 124: one the player may decline, since an automatic one has no Skip (§8-1-3-1)
    g4.queue = []; g4.phase = 'over'; g4.over = 0; shot();
    /* take 115 (self-review): the Play screens' roots are read whether or not this block changed them -- an earlier
       section left the counter painted with the same markup, so its paint here was no change and never read */
    const read4 = ['dkList', 'dkRows', 'cdRes', 'plBoard'], rootHtml = k => (doc.getElementById(k) || {})._html || '';
    const painted = [...doc._ids].filter(([k, e]) => read4.includes(k) || e._html !== before4.get(k)).map(([, e]) => e._html).concat(boards);
    const brassHits = painted.flatMap(brassText);
    ok('(SPEC-106-31) nothing on a Prep & Play screen is text in the fill\'s colour: every Play screen painted in Play\'s palette, the Sim in seven states, read for an inline color:var(--brass) or a class that sets it',
       brassHits.length === 0 && read4.every(k => rootHtml(k).length > 0) && /class="panel plpanel"/.test(rootHtml('plBoard')) && boards.length === 7 && att && att.ok === true && /is attacked/.test(blockBoard) && /Counter step/.test(counterBoard), brassHits.slice(0, 4).join(' | ') || `${painted.length} painted, roots ${read4.map(k => k + ' ' + rootHtml(k).length).join(', ')}, attack ${JSON.stringify(att)}`);
    ok('...control: a class that set the fill colour on text would be listed -- take 117 moved the last one, .dline, to --accent-ink, so the list is empty by design and a planted class is the proof',
       brassCls.length === 0 && topRules(css + '\n.probe117{color:var(--brass)}').filter(r => /(?:^|;)\s*color\s*:\s*var\(--brass\)/.test(r.body)).flatMap(r => r.sels).includes('.probe117'));
    ok('...the two it had: "choose a target" is --accent-ink, and the given DON!! is now a chip in a DON!! card\'s white and black -- black ink on white in a black border (the owner, take 124), not text in the fill (#E0553D was 4.25:1 on Play\'s card)',
       /<span style="color:var\(--accent-ink\)">choose a target<\/span>/.test(mainBoard) && /<span class="dn">\+1<\/span>/.test(mainBoard) && /\n\.sc \.dn\{[^}]*background:linear-gradient\(180deg,#FFFFFF,#ECE9E1\);border:1\.5px solid #0A0A0A;\n  color:#0A0A0A;/.test(css));
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
    const goRule = /\n\.tb-go\{display:flex;flex-wrap:wrap;/.test(css) && /\n\.tb-go > \.ghost\{flex:none;white-space:nowrap\}/.test(css);   // take 124: one rule for every such row on the table
    const holdsWidth = t => /<div class="tb-go"><button class="ghost go" data-sim="post">Hand back<\/button>/.test(t) && /<div class="tb-go">[\s\S]{0,400}?<button class="ghost" data-sim="fxskip">Decline<\/button>/.test(t);   // take 124: a decline named for what it does
    ok('(the look) a Sim button beside a note that can grow keeps its width, in a row that wraps: Hand back, Decline, painted (Hand back broke onto two lines at 411)', goRule && holdsWidth(postBoard + offerBoard), (postBoard.match(/data-sim="post"[^>]*>/) || ['no Hand back'])[0]);
    ok('...control: the rows as A4 first wrote them are caught', !holdsWidth('<div class="row" style="margin-top:10px"><button class="ghost go" data-sim="post">Hand back</button><span class="note" style="margin:0">to X</span></div><div class="row" style="gap:10px;margin-top:8px"><button class="ghost" data-sim="fxskip">Decline</button><span class="note" style="margin:0">play it by hand</span></div>'));
    ok('...control: take 114\'s labels are caught', wordy('<button class="ghost go" data-sim="end">End turn \\u2014 pass the phone</button><button class="ghost go" data-sim="resolve">Resolve \\u2014 ${pw.a} vs ${pw.d}${pw.a >= pw.d ? \': hit\' : \': held\'}</button><button data-sim="block:1">Block with ${esc(x.name)}</button>').length === 2);
    ok('...and what happens is said beside them, on the painted board: then pass the phone, then the counter step, who has hit, to whom the phone goes, what a decline does (take 122: Resolve by hand is its own button; take 124: the decline of a "you may" line is Decline, "its words let you")',
       /data-sim="end">End turn<\/button><span class="note"[^>]*>then pass the phone<\/span>/.test(mainBoard) && /data-sim="noblock"[^>]*>No block<\/button><span class="note"[^>]*>then the counter step<\/span>/.test(blockBoard)
       && /data-sim="resolve"[^>]*>Resolve<\/button><span class="note"[^>]*>\d+ vs \d+: (?:hit|held)<\/span>/.test(counterBoard) && /data-sim="post"[^>]*>Hand back<\/button><span class="note"[^>]*>to [^<]+<\/span>/.test(postBoard)
       && /data-sim="fxskip"[^>]*>Decline<\/button><span class="note"[^>]*>its words let you<\/span>/.test(offerBoard), [mainBoard, blockBoard, counterBoard, postBoard, offerBoard].map(b => (b.match(/data-sim="(?:end|noblock|resolve|post|fxskip)"[^>]*>[^<]*<\/button>(?:<span[^>]*>[^<]*<\/span>)?/) || ['-'])[0]).join(' | '));

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
    V.DECKS.list = keepDecks; SIM4.g = null; SU.sel = null; SU.post = null; SU.result = null; V.MODE.set('collect', false); V.go('home');

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
       /<div class="pic" style="width:32px;height:45px;[^"]*border-radius:var\(--r-sm\)/.test(trH) && /<div class="pic" style="width:32px;height:45px;[^"]*border-radius:var\(--r-sm\)/.test(wtH) && !/class="oa pic"/.test(js) && !/width:34px;flex:0 0 34px/.test(js)
       && ruleVal(css, '.opt .oa', 'width') === 'var(--thumb-l)' && ruleVal(css, '.opt .oa', 'border-radius') === 'var(--r-sm)', `${(trH.match(/<div class="pic" style="[^"]*"/) || ['-'])[0]} | ${ruleVal(css, '.opt .oa', 'width')}`);

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
    const removers = ['data-want=', 'data-alrm=', 'aria-label="Stop watching ${esc(a.name)}"', 'data-localdel='];   // take 122: the Sim's free trash button is gone (landmine 212)
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
    const unpressed = t => onTpl(t).filter(a => !/aria-pressed="\$\{/.test(a) && !(/role="radio"/.test(a) && /aria-checked="\$\{/.test(a))).map(a => a.slice(0, 50));   /* take 120: a radio (Appearance's) says aria-checked */
    ok('(SPEC-108-36) every toggle template carries aria-pressed from the test that lights it: Cards\' chips, the binder\'s sets, the checklist, Home\'s ranges, the filter sheet, the condition buttons',
       onTpl(js).length >= 13 && unpressed(js).length === 0 && !/classList\.toggle\('on'\)/.test(js), unpressed(js).join(' | ') || String(onTpl(js).length));
    ok('...control: a lit chip with no aria-pressed is caught', unpressed('<button class="chip$' + '{x ? \' on\' : \'\'}" data-q="1">').length === 1);
    ok('...control: a lit radio with no aria-checked is caught, and one with it passes (take 120)', unpressed('<button role="radio" class="$' + '{x ? \'on\' : \'\'}">').length === 1 && unpressed('<button role="radio" class="$' + '{x ? \'on\' : \'\'}" aria-checked="$' + '{x}">').length === 0);
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
    const src4 = appSource();
    ok('the Fold block says the open Fold is MEASURED at 749 x 832 CSS px (2.625), no longer "about 840, INFERRED"', /open Fold \(749 x 832 CSS px at a pixel ratio of 2\.625, MEASURED/.test(src4) && !/about 840 px wide, INFERRED/.test(src4));
  });

  /* leave the shared app as the sections before found it */
  ctx._net = null; delete ctx.window.Capacitor; V.NET.WAIT = W0; V.NET.WAIT_BIG = WB0; ctx.navigator.onLine = on0;
  if (typeof V.loadCatalogue === 'function') await V.loadCatalogue();
  V.CAT.man.updateUrl = url0; while (V.closeAnyOverlay()) {} V.MODE.set('collect', false); V.go('home');
  ok('...and the shared app is back on the catalogue it shipped with', V.CAT.ready && !V.CAT.man.fromDisk && V.CAT.rows.length === manifest.printings && V.candidates('EB03-024').length === 3);
}
}
