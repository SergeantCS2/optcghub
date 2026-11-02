/* smoke section 100: take 151 — Collection's change over a period the collector chooses (the owner, 2 Nov: option 3,
   since added by default). Each line's change since it was added, over the day, 7 or 30 days, read off CAT.hist; the
   tile, the switch and "Biggest move" follow it. Each check that is not a control fails on take 150's build (SMOKE_APP). */
export async function run(harness) {
  const { V, ctx, doc, store, ok, section } = harness;
  section('take 151 — Collection\'s change since added (the default), or over the day, 7 or 30 days');
  const has = typeof V.lineChange === 'function' && !!V.CHANGE;
  const keep = { items: V.OWN.items, mode: has ? V.CHANGE.mode : null, key: store['vault.changeBy'], hist: null, nav: V.NAV.stack.slice() };
  const days = V.CAT.days, n = days.length, last = days[n - 1];
  const idx = d => days.indexOf(d), back = k => new Date(Date.parse(last + 'T12:00:00Z') - k * 864e5).toISOString().slice(0, 10);
  const noon = d => new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12).toISOString();   // a moment on that phone day
  /* a printing priced on every day on file, whose day move and month move point opposite ways */
  const full = V.CAT.rows.filter(p => p.market > 1 && p.d1p != null && (V.CAT.hist[p.id] || []).length === n && V.CAT.hist[p.id].every(v => v > 0));
  const P = full.find(p => Math.sign(p.d1a) !== 0 && Math.sign(p.market - V.CAT.hist[p.id][idx(back(30))]) === -Math.sign(p.d1a)) || full[0];
  const H = P && V.CAT.hist[P.id];
  ok('premise: a printing priced on all ' + n + ' days on file, its day and its 30 days moving opposite ways', !!P && n >= 31, P ? `${P.id} ${P.name}` : 'none');
  try {
    ok('Since added is the default the switch starts on (no choice kept yet)', has && keep.key == null && V.CHANGE.mode === 'added', has ? `${V.CHANGE.mode} ${keep.key}` : 'no CHANGE');
    const addedOn = days[n - 12], line = { id: P.id, qty: 1, condition: 'NM', pf: 'main', game: 'optcg', added: noon(addedOn) };
    const c = has ? V.lineChange(P, line, 'added') : null;
    ok('since added: the market less the price on the day it was added, from that day', !!c && c.from === addedOn && Math.abs(c.a - (P.market - H[idx(addedOn)])) < 1e-9
       && Math.abs(c.pc - 100 * c.a / H[idx(addedOn)]) < 1e-9 && !c.first, JSON.stringify(c));
    const w = has ? V.lineChange(P, line, '7d') : null, m = has ? V.lineChange(P, line, '30d') : null, d = has ? V.lineChange(P, line, 'day') : null;
    ok('7 days and 30 days count from the day on file that far back; the day is the catalogue\'s own move',
       !!w && w.from === back(7) && Math.abs(w.a - (P.market - H[idx(back(7))])) < 1e-9 && !!m && m.from === back(30) && Math.abs(m.a - (P.market - H[idx(back(30))])) < 1e-9
       && !!d && d.a === P.d1a && d.pc === P.d1p, JSON.stringify([w, m, d]));
    const early = has ? V.lineChange(P, { ...line, added: noon('2020-01-01') }, 'added') : null;
    ok('a card added before the history begins counts from the first price on file, and its title says so',
       !!early && early.first && early.from === days[0] && /the first price on file \(added /.test(V.changeTitle(early, { added: noon('2020-01-01') })), JSON.stringify(early));
    const today = has ? V.lineChange(P, { ...line, added: new Date().toISOString() }, 'added') : null;
    ok('a card added since the last price day has not moved yet', !!today && Math.abs(today.a) < 1e-9, JSON.stringify(today));
    if (has) { keep.hist = H[idx(addedOn)]; H[idx(addedOn)] = null; }
    const gap = has ? V.lineChange(P, line, 'added') : null;
    ok('a day with no price walks back to the last day that has one', !!gap && gap.from === days[n - 13] && Math.abs(gap.a - (P.market - H[n - 13])) < 1e-9, JSON.stringify(gap));
    if (has) { H[idx(addedOn)] = keep.hist; keep.hist = null; }
    /* the tile and the switch */
    const paint = () => typeof V.paintCollection === 'function' ? V.paintCollection() : V.go('collection');   /* take 150's build paints by opening the screen */
    V.OWN.items = [{ ...line, added: noon(back(30)) }]; V.go('collection'); paint();
    const tile = () => doc.getElementById('colGrid')._html || doc.getElementById('colGrid').innerHTML;
    const want = c => `${c.a > 0.004 ? '<span class="up">▲</span> ' : c.a < -0.004 ? '<span class="down">▼</span> ' : ''}${V.money(P.market)}`;
    const t30 = has ? V.lineChange(P, V.OWN.items[0], 'added') : null, t1 = tile();
    ok('the tile shows the change since added, titled with its day, and its triangle points the period\'s way, not the day\'s',
       !!t30 && t1.includes(want(t30)) && t1.includes(`title="since ${V.dayText(back(30))}"`) && t1.includes(V.signedPct(t30.pc)), t1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(-120));
    const chips = () => (doc.getElementById('colChange')._html || doc.getElementById('colChange').innerHTML || '');
    ok('the switch under the search names the four periods, Since added pressed', /data-chg="added" aria-pressed="true">Since added</.test(chips())
       && ['day', '7d', '30d'].every(k => new RegExp(`data-chg="${k}" aria-pressed="false"`).test(chips())), chips().replace(/<[^>]+>/g, '|').slice(0, 120));
    const set = has && V.setChange('day'), t2 = tile();
    ok('choosing Day redraws every tile with the day\'s move and keeps the choice', set && V.CHANGE.mode === 'day' && JSON.parse(store['vault.changeBy']) === 'day'
       && t2.includes(want({ a: P.d1a })) && /data-chg="day" aria-pressed="true"/.test(chips()), `${V.CHANGE && V.CHANGE.mode} ${store['vault.changeBy']}`);
    ok('control: a period it does not know is refused and the choice stands', has && V.setChange('year') === false && V.CHANGE.mode === 'day');
    /* Biggest move: by the period chosen. Two lines, one moving most over the day, the other since added */
    const Q = full.find(q => q.id !== P.id && Math.abs(q.d1a) < Math.abs(P.d1a) / 4 && Math.abs(q.market - V.CAT.hist[q.id][idx(back(30))]) > 4 * Math.abs(P.market - H[idx(back(30))]) + 0.5);
    if (Q) {
      V.OWN.items = [{ ...line, added: noon(back(30)) }, { id: Q.id, qty: 1, condition: 'NM', pf: 'main', game: 'optcg', added: noon(back(30)) }];
      const f = V.FILT.own, was = { sort: f.sort, dir: f.dir }; f.sort = 'delta'; f.dir = -1;
      const order = () => { paint(); return [...tile().matchAll(/data-open="(\d+)"/g)].map(x => +x[1]); };
      const byDay = order(); if (has) V.setChange('added'); const byAdded = order(); f.sort = was.sort; f.dir = was.dir;
      ok('"Biggest move" sorts by the period chosen: the day\'s mover first on Day, the month\'s first since added', byDay[0] === P.id && byAdded[0] === Q.id, JSON.stringify({ byDay, byAdded }));
    } else ok('"Biggest move" sorts by the period chosen (no pair in today\'s data to tell the periods apart)', true);
  } finally {
    if (keep.hist != null) V.CAT.hist[P.id][idx(days[n - 12])] = keep.hist;
    V.OWN.items = keep.items; if (has) V.CHANGE.mode = keep.mode;
    if (keep.key == null) delete store['vault.changeBy']; else store['vault.changeBy'] = keep.key;
    if (typeof V.paintCollection === 'function') V.paintCollection(); V.NAV.stack.splice(0, V.NAV.stack.length, ...keep.nav);
  }
}
