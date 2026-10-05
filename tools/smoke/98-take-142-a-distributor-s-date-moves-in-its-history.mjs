/* smoke section 98: take 142 — A32's Next, its first item: a distributor's date moves. The runner files each item's release
   and order due day in the history when they move (tools/hunt.py record_dates, its own probes in --selftest); the History
   under Distributor info says "release moved Nov 20 → Dec 4" between the two reads that saw it. Run in the owner's zone, as
   section 73 is. Each app check that is not a control fails on take 141's build (SMOKE_APP), watched. */
export async function run(harness) {
  const { V, ctx, ok, section, ROOT, fs, path, os, execSync } = harness;
  section('take 142 — a distributor\'s date moves, filed by the runner and said in the History');
  const fxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-dm-')), feedF = path.join(fxDir, 'feed-fixture.json');
  execSync(`python3 tools/hunt.py --from-fixtures --out ${feedF}`, { cwd: ROOT, stdio: 'pipe' });
  const F = JSON.parse(fs.readFileSync(feedF, 'utf8')), HF = JSON.parse(fs.readFileSync(path.join(fxDir, 'history-fixture.json'), 'utf8')), R0 = HF.runs[0];
  const gi = F.sources.gts.items, si = F.sources.southern.items;
  ok('the runner (this tree\'s hunt.py, so on any build): the fixture run files every GTS and Southern Hobby item\'s two days, once, at its own run',
     !!HF.dates && gi.every(i => JSON.stringify((HF.dates.gts || {})[i.sku]) === JSON.stringify([[F.fetched_at, i.release ?? null, i.preorder ?? null]]))
     && si.every(i => JSON.stringify((HF.dates.southern || {})[i.id]) === JSON.stringify([[F.fetched_at, i.release ?? null, i.due ?? null]])), JSON.stringify(HF.dates || null).slice(0, 160));
  const TZ0 = process.env.TZ; process.env.TZ = 'America/New_York';
  const keep = { feed: V.HUNT.feed, hist: V.HUNT.hist, zip: V.HUNT.zip, mode: V.MODE.cur };
  try {
    const G = gi.find(i => i.sku === 'BJP2873812') || {}, S = si.find(i => i.id === '79311') || {}, PID = G.catalog_id;
    ok('premise: the OP-18 box, on both distributors, with a release day at each', !!PID && S.catalog_id === PID && !!G.release && !!S.release && !!S.due, `${G.release} ${S.release} ${S.due}`);
    const nb = s => String(s).replace(/[  ]/g, ' '), D = x => nb(V.dayText(x));
    const ld = iso => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const M = t => nb(V.momentText(t));
    const btw = (a, b) => `between ${M(a)} and ${ld(a) === ld(b) ? nb(V.momentText(b).split(', ').pop()) : M(b)}`;
    /* 30 runs, 4-hourly, ending on the fixture's own: GTS read in each but run 19 (a hole), Southern Hobby in the last four. The box's
       release moved at run 20 (from three weeks earlier to its day now); Southern Hobby's order due day was first given at run 27 and
       moved at run 29. No state changes: the rows hold the same words throughout. */
    const END = Date.parse(F.fetched_at), N = 30, runs = [];
    for (let k = N - 1; k >= 0; k--) runs.push({ t: new Date(END - k * 4 * 3600e3).toISOString().replace(/\.\d{3}Z$/, 'Z'), online: {}, shelf: {} });
    runs.forEach((r, i) => { if (i !== 19) r.gts = { ...R0.gts }; if (i >= N - 4) r.southern = { ...R0.southern }; });
    const early = new Date(Date.parse(G.release + 'T00:00:00Z') - 21 * 864e5).toISOString().slice(0, 10);
    const due0 = new Date(Date.parse(S.due + 'T00:00:00Z') - 7 * 864e5).toISOString().slice(0, 10);
    const dates = { gts: { BJP2873812: [[runs[2].t, early, G.preorder ?? null], [runs[20].t, G.release, G.preorder ?? null]] },
      southern: { '79311': [[runs[N - 4].t, S.release, null], [runs[N - 3].t, S.release, due0], [runs[N - 1].t, S.release, S.due]] } };
    const H = { runs, since: runs[0].t, stores: {}, titles: {}, dates };
    V.HUNT.feed = F; V.HUNT.hist = H; V.HUNT.setZip(''); V.MODE.set('hunt', false); V.DISTF.open.clear();
    const TL = (d, k) => V.HUNT.distTimeline(d, k) || { changes: [] };
    const mv = c => c.kind === 'moved';
    const tg = TL('gts', 'BJP2873812'), ts = TL('southern', '79311');
    ok('GTS: the moved release is a change of its own, from the earlier day to the day now, between the read that saw it and the read before -- run 18, across run 19\'s hole',
       JSON.stringify(tg.changes.filter(mv)) === JSON.stringify([{ kind: 'moved', field: 'release', from: early, to: G.release, after: runs[18].t, by: runs[20].t }]), JSON.stringify(tg.changes));
    ok('Southern Hobby: an order due day first given, then moved, two changes in order',
       JSON.stringify(ts.changes.filter(mv).map(c => [c.field, c.from, c.to, c.after, c.by])) === JSON.stringify([['due', null, due0, runs[N - 4].t, runs[N - 3].t], ['due', due0, S.due, runs[N - 2].t, runs[N - 1].t]]), JSON.stringify(ts.changes));
    /* on screen: the product's page, Distributor info open, both histories open, as a tap opens them */
    V.openDetail(PID, { dist: true }); if (typeof V.distHistTap === 'function') { V.distHistTap('gts'); V.distHistTap('southern'); }
    const h = ctx.document.querySelector('#dDist').innerHTML;
    const blk = d => (h.match(new RegExp(`<div class="dtl" data-tl="${d}">[\\s\\S]*?</div>`)) || [''])[0];
    const lines = b => b.replace(/<\/span>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').split('\n').filter(Boolean);
    const gl = lines(blk('gts')), sl = lines(blk('southern'));
    ok('GTS\'s History says "release moved" with both days in words, between the two reads',
       gl.includes(`release moved ${D(early)} → ${D(G.release)} · ${btw(runs[18].t, runs[20].t)}`), gl.join(' | '));
    ok('Southern Hobby\'s says "order due date now" for a day first given, then "order due date moved"',
       sl.includes(`order due date now ${D(due0)} · ${btw(runs[N - 4].t, runs[N - 3].t)}`) && sl.includes(`order due date moved ${D(due0)} → ${D(S.due)} · ${btw(runs[N - 2].t, runs[N - 1].t)}`), sl.join(' | '));
    /* a move whose earlier read is no longer on file: said as seen, not between */
    V.HUNT.hist = { ...H, dates: { gts: { BJP2873812: [['2026-01-01T00:00:00Z', early, null], [runs[0].t, G.release, null]] } } };
    const t0 = TL('gts', 'BJP2873812').changes.filter(mv);
    ok('a move seen at the first run on file has no read before it: it is said as seen then, never as between',
       t0.length === 1 && t0[0].after === null && V.distHistory({ ...G, _d: 'gts' }).includes(`release moved ${D(early)} → ${D(G.release)} · seen ${M(runs[0].t)}`), JSON.stringify(t0));
    /* controls: no dates on file, or dates of a shape this version does not know -- no move, the History as before */
    V.HUNT.hist = { ...H, dates: undefined };
    const none = TL('gts', 'BJP2873812');
    ok('control: a history with no dates (every one before this take) has no moves, and its History reads as it did', !none.changes.length && !/moved/.test(V.distHistory({ ...G, _d: 'gts' })), JSON.stringify(none.changes));
    V.HUNT.hist = { ...H, dates: { gts: { BJP2873812: [['x', early, null], [runs[20].t, '20 Nov', null], [runs[22].t, G.release]] }, southern: 'odd' } };
    ok('control: entries of a shape this version does not know are no move, and nothing throws', !TL('gts', 'BJP2873812').changes.length && !TL('southern', '79311').changes.length);
  } finally {
    V.HUNT.feed = keep.feed; V.HUNT.hist = keep.hist; V.HUNT.setZip(keep.zip || ''); V.MODE.set(keep.mode, false); V.DISTF.open.clear();
    if (TZ0 === undefined) delete process.env.TZ; else process.env.TZ = TZ0;
  }
}
