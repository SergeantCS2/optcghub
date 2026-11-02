/* smoke section 101: take 152 — Home's figure under the total and Market movers follow take 151's period switch (the
   owner, 2 Nov: "make Home and movers follow the switch"). The figure is the held lines' price moves over the period, each
   line's own; the movers are line by line; the switch is pressable on Home and on the movers, one row of CLICKS. Each check
   that is not a control fails on take 151's build (SMOKE_APP). */
export async function run(harness) {
  const { V, doc, store, ok, section } = harness;
  section('take 152 — Home and Market movers follow the period switch (Since added, Day, 7 days, 30 days)');
  const has = typeof V.collectionChange === 'function';
  const keep = { setPanel: (doc.getElementById('setPanel') || { style: {} }).style.display, items: V.OWN.items, mode: V.CHANGE ? V.CHANGE.mode : null, key: store['vault.changeBy'], nav: V.NAV.stack.slice(), hist: null, histId: null, res: null };
  const days = V.CAT.days, n = days.length, last = days[n - 1];
  const idx = d => days.indexOf(d), back = k => new Date(Date.parse(last + 'T12:00:00Z') - k * 864e5).toISOString().slice(0, 10);
  const noon = d => new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12).toISOString();   // a moment on that phone day
  const el = id => doc.getElementById(id), html = id => { const e = el(id); return e ? (e._html || e.innerHTML || '') : ''; };
  const text = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  /* two printings priced on every day on file, moving apart over the month, and one more to strip of its history */
  const full = V.CAT.rows.filter(p => p.market > 5 && p.d1p != null && (V.CAT.hist[p.id] || []).length === n && V.CAT.hist[p.id].every(v => v > 0));
  const mv30 = p => p.market - V.CAT.hist[p.id][idx(back(30))], at = (p, k) => V.CAT.hist[p.id][idx(back(k))];
  /* P moved since 20 days ago and since 5, by different amounts: its two lines below must differ */
  const P = full.filter(p => Math.abs(p.market - at(p, 5)) > 0.05 && Math.abs(p.market - at(p, 20)) > 0.05 && Math.abs(at(p, 5) - at(p, 20)) > 0.05)
    .sort((a, b) => Math.abs(mv30(b)) - Math.abs(mv30(a)))[0];
  const Q = full.find(q => q.id !== P.id && Math.abs(mv30(q)) > 0.05 && Math.abs(q.d1a) > 0.004 && Math.sign(mv30(q)) !== Math.sign(q.d1a)) || full.find(q => q.id !== P.id);
  const R = full.find(r => r.id !== P.id && r.id !== Q.id);
  ok('premise: three printings priced on all ' + n + ' days on file', !!P && !!Q && !!R && n >= 31, [P, Q, R].map(p => p && p.id).join(' '));
  const pf = V.PF.active === 'all' ? 'main' : V.PF.active;   /* in the collection Home shows */
  const line = (p, added, qty = 1) => ({ id: p.id, qty, condition: 'NM', pf, game: 'optcg', added: noon(added) });
  const L = [line(P, back(20), 2), line(Q, back(40)), line(P, back(5))];   /* P twice: added on two days, each its own change */
  try {
    /* the sum */
    const c = has ? V.collectionChange(L, 'added') : null;
    const parts = L.map(i => V.lineChange(V.CAT.byId.get(i.id), i, 'added'));
    const sumA = parts.reduce((s, x, k) => s + x.a * L[k].qty, 0), start = parts.reduce((s, x, k) => s + (V.CAT.byId.get(L[k].id).market - x.a) * L[k].qty, 0);
    ok('a set of lines\' change is the sum of each line\'s own, times its count, against what they were worth at its start',
       !!c && c.n === 3 && c.none === 0 && Math.abs(c.a - sumA) < 1e-9 && Math.abs(c.pc - 100 * sumA / start) < 1e-9, JSON.stringify({ c, sumA, start }));
    const today = has ? V.collectionChange([...L, { ...line(R, last), added: new Date().toISOString() }], 'added') : null;
    ok('a card bought today adds nothing to the change: price moves only, never a purchase',
       !!today && Math.abs(today.a - c.a) < 1e-9 && today.n === 4, JSON.stringify(today));
    if (has) { keep.histId = R.id; keep.hist = V.CAT.hist[R.id]; delete V.CAT.hist[R.id]; }
    const gap = has ? V.collectionChange([...L, line(R, back(10))], 'added') : null;
    ok('a line with no price on file at all is left out of the sum, and counted', !!gap && gap.n === 3 && gap.none === 1 && Math.abs(gap.a - c.a) < 1e-9, JSON.stringify(gap));
    if (has) { V.CAT.hist[R.id] = keep.hist; keep.hist = null; }
    ok('control: no lines, no change and no percentage', has && (x => x.n === 0 && x.a === 0 && x.pc === null)(V.collectionChange([], 'added')));
    /* Home */
    V.OWN.items = L; if (V.CHANGE) V.CHANGE.mode = 'added';
    V.paintHome();
    const want = (m) => { if (!has) return 'no collectionChange'; const x = V.collectionChange(L, m); return `${V.signedMoney(x.a)} (${V.signedPct(x.pc, true)}) ${V.changeWords(m)}`; };
    ok('Home: the figure under the total is the lines\' change since added, in those words', has && text(html('pfDelta')) === want('added'), text(html('pfDelta')));
    ok('Home: the switch sits under it, Since added pressed', /data-chg="added" aria-pressed="true">Since added</.test(html('homeChange')) && /data-chg="7d" aria-pressed="false"/.test(html('homeChange')), text(html('homeChange')));
    ok('Home: the chart says what it is in its own note -- an estimate, or too little history -- and no longer under the total',
       /estimated from today|Not enough history yet/.test(html('sparkNote')) && !/estimated from today|in the last/.test(html('pfDelta')), html('sparkNote').slice(0, 90));
    /* a tap on a chip: the CLICKS row, with a target that answers only [data-chg] (the stub cannot see the listener; Chrome proves the real tap) */
    const chip = { dataset: { chg: '7d' } };
    if (V.CLICKS) V.CLICKS.fire({ target: { closest: s => s === '[data-chg]' ? chip : null } });
    ok('a tap on a period chip, anywhere, reaches the switch through one CLICKS row', V.CHANGE && V.CHANGE.mode === '7d', V.CHANGE && V.CHANGE.mode);
    ok('Home follows: 7 days, in its words, with 7 days pressed', has && text(html('pfDelta')) === want('7d') && /data-chg="7d" aria-pressed="true"/.test(html('homeChange')), text(html('pfDelta')));
    /* Market movers */
    if (V.CHANGE) V.CHANGE.mode = 'added';
    keep.res = html('allRes');
    /* opened as Home's Market movers button opens it: its CLICKS row (take 151's build has the same path, so the checks
       below compare what it draws, not what it exports) */
    V.CLICKS.fire({ target: { closest: s => s === '[data-act]' ? { dataset: { act: 'movers' } } : null } });
    const res = () => html('allRes');
    const heads = () => [...res().matchAll(/<h3>([^<]*)<\/h3>/g)].map(x => x[1]);
    const ownRows = () => { const h = res(), cut = h.indexOf('Biggest moves'); return [...h.slice(0, cut < 0 ? h.length : cut).matchAll(/data-open="(\d+)"[\s\S]*?<div class="v">([\s\S]*?)<\/div><\/button>/g)].map(x => ({ id: +x[1], v: text(x[2]) })); };
    const pv = (p, i, m) => { const x = V.lineChange(p, i, m); return text(`${V.signedMoney(x.a).replace(/^\+/, '')}`); };
    ok('Market movers: the switch on top, Since added pressed; your collection\'s heading says since added',
       /data-chg="added" aria-pressed="true"/.test(res()) && heads()[0] === 'Your collection · since added', JSON.stringify(heads()));
    const own = ownRows(), pRows = own.filter(r => r.id === P.id);
    ok('Market movers: your collection line by line -- one printing added on two days is two rows, each with its own change',
       pRows.length === 2 && pRows[0].v !== pRows[1].v && pRows.every(r => [L[0], L[2]].some(i => r.v.includes(pv(P, i, 'added')))), JSON.stringify(pRows));
    ok('Market movers: on Since added the game\'s list shows the day\'s, and its heading and note say so',
       heads()[1] === `Biggest moves in the game · ${V.dayText(days[n - 2])} → ${V.dayText(last)}` && /this list shows the day’s moves/.test(res()), JSON.stringify(heads()));
    V.setChange('30d');
    const top = V.CAT.rows.filter(p => p.market >= 5).map(p => ({ p, c: V.lineChange(p, null, '30d') })).filter(x => x.c).sort((a, b) => Math.abs(b.c.a) - Math.abs(a.c.a))[0];
    const gameFirst = (() => { const h = res(), cut = h.indexOf('Biggest moves'); const m = cut < 0 ? null : h.slice(cut).match(/data-open="(\d+)"/); return m ? +m[1] : null; })();
    const span30 = `${V.dayText(V.periodStart ? V.periodStart('30d') : back(30))} → ${V.dayText(last)}`;
    ok('Market movers redraw on the switch: 30 days in both headings, the game\'s biggest 30-day mover first',
       heads()[0] === `Your collection · ${span30}` && heads()[1] === `Biggest moves in the game · ${span30}` && !!top && gameFirst === top.p.id, JSON.stringify({ heads: heads(), gameFirst, top: top && top.p.id }));
  } finally {
    if (keep.hist != null) V.CAT.hist[keep.histId] = keep.hist;
    V.OWN.items = keep.items; if (V.CHANGE) V.CHANGE.mode = keep.mode;
    if (keep.key == null) delete store['vault.changeBy']; else store['vault.changeBy'] = keep.key;
    if (keep.res != null) { const e = el('allRes'); if (e) e.innerHTML = keep.res; }
    { const e = el('setPanel'); if (e && e.style) e.style.display = keep.setPanel; }
    V.paintHome(); if (typeof V.paintCollection === 'function') V.paintCollection();
    V.NAV.stack.splice(0, V.NAV.stack.length, ...keep.nav);
  }
}
