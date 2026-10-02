/* =====================================================================
 * TRADE ANALYZER — take 18. The last button on the action row.
 *
 * Two lists of {id, n}, valued at today’s market with the same numbers the
 * rest of the app uses, and the difference stated plainly. It does not tell
 * the collector whether to trade -- it tells them what the market says the
 * two piles are worth, with the spread, so they can decide. PROTOCOL §10: a
 * market price is a model, not a sale, and this screen says so on the verdict.
 * ===================================================================== */
const TRADE = {
  give: readJson('vault.trade.give', []),
  get:  readJson('vault.trade.get', []),
  save() { saveJson('vault.trade.give', this.give);
           saveJson('vault.trade.get', this.get); scheduleBackup('lists'); },   // take 115: in the backup, and backed up
  add(side, id, n = 1) {
    const L = this[side]; const r = L.find(x => x.id === id);
    if (r) r.n += n; else L.push({ id, n }); this.save();
  },
  bump(side, id, d) {
    const L = this[side]; const r = L.find(x => x.id === id); if (!r) return;
    r.n += d; if (r.n <= 0) this[side] = L.filter(x => x !== r); this.save();
  },
  value(side) { return this[side].reduce((a, r) => { const p = CAT.byId.get(r.id); return a + (p ? (p.market || 0) * r.n : 0); }, 0); },
  low(side)   { return this[side].reduce((a, r) => { const p = CAT.byId.get(r.id); return a + (p ? (p.low || p.market || 0) * r.n : 0); }, 0); },
  high(side)  { return this[side].reduce((a, r) => { const p = CAT.byId.get(r.id); return a + (p ? (p.high || p.market || 0) * r.n : 0); }, 0); }
};
function tradeRow(side, r) {
  const p = CAT.byId.get(r.id); if (!p) return '';
  const own = OWN.items.filter(i => i.id === p.id).reduce((a, i) => a + i.qty, 0);
  return `<div class="dkrow" data-tr="${side}:${p.id}">
    ${cardPic(p, THUMB.s)}
    <div class="n"><b>${esc(p.name)}${p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
      <span>${dotJoin(esc(p.num), money(p.market) + ' each')}${side === 'give' && own < r.n ? ` \u00b7 <span class="down">you own ${own}</span>` : ''}</span></div>
    <div class="cnt"><button data-trdec="${side}:${p.id}" aria-label="One fewer ${esc(p.name)}">${G('minus', 18)}</button><b>${r.n}</b><button data-trinc="${side}:${p.id}" aria-label="One more ${esc(p.name)}">${G('plus', 18)}</button></div>
  </div>`;
}
function paintTrade() {
  for (const side of ['give', 'get']) {
    const L = TRADE[side];
    $(side === 'give' ? '#trGive' : '#trGet').innerHTML = L.map(r => tradeRow(side, r)).join('') ||
      `<div class="note">${side === 'give' ? 'Nothing offered yet.' : 'Nothing asked for yet.'}</div>`;
    $(side === 'give' ? '#trGiveN' : '#trGetN').textContent = L.length ? money(TRADE.value(side)) : '';
  }
  const gv = TRADE.value('give'), gt = TRADE.value('get'), d = gt - gv;
  const v = $('#trVerdict');
  if (!TRADE.give.length && !TRADE.get.length) { v.innerHTML = '<div class="note">Add cards to both sides and the difference appears here.</div>'; return; }
  const pct = gv > 0 ? 100 * d / gv : null;
  v.innerHTML = `
    <div class="row"><div class="nm"><b>You give</b><span>market \u00b7 low ${money(TRADE.low('give'))} to high ${money(TRADE.high('give'))}</span></div><div class="v mono">${money(gv)}</div></div>
    <div class="row"><div class="nm"><b>You get</b><span>market \u00b7 low ${money(TRADE.low('get'))} to high ${money(TRADE.high('get'))}</span></div><div class="v mono">${money(gt)}</div></div>
    <div class="row"><div class="nm"><b>Difference</b><span>${d > 0.005 ? 'in your favour' : d < -0.005 ? 'against you' : 'even'} at today’s market${pct != null ? ` \u00b7 ${signedPct(pct, true)}` : ''}</span></div>
      <div class="v mono ${d > 0.005 ? 'up' : d < -0.005 ? 'down' : 'flat'}">${signedMoney(d)}</div></div>
    <div class="note">Market prices are a model of recent sales, not an offer; the low-to-high spread is the honest width.
      Condition is not priced in (the feed has no per-condition data), and a card’s real value to you is yours to decide.</div>`;
}
function tradeSearch(side) {
  const q = ($(side === 'give' ? '#trGiveQ' : '#trGetQ').value || '').trim().toLowerCase();
  const out = $(side === 'give' ? '#trGiveRes' : '#trGetRes');
  if (!q) { out.innerHTML = ''; return; }
  let pool;
  if (side === 'give') {
    const seen = new Set();
    pool = OWN.items.map(i => CAT.byId.get(i.id)).filter(p => p && !seen.has(p.id) && seen.add(p.id));
  } else pool = CAT.rows.filter(p => p.num);
  const hits = pool.filter(p => (p.full + ' ' + p.num).toLowerCase().includes(q)).slice(0, 12);
  out.innerHTML = hits.length ? `<div style="border:1px solid var(--line);border-radius:var(--r-md);margin-bottom:8px">${hits.map(p =>
    `<button class="row" style="width:100%;text-align:left;padding:8px 10px;align-items:center" data-tradd="${side}:${p.id}">
      ${cardPic(p)}<div class="nm"><b>${esc(p.name)}${p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
      <span>${dotJoin(esc(p.num), esc((CAT.sets.get(p.set) || {}).abbr || ''))}</span></div>
      <div class="v mono">${money(p.market)}</div></button>`).join('')}</div>` : '<div class="note">No match.</div>';
}
$('#trGiveQ').addEventListener('input', () => tradeSearch('give'));
$('#trGetQ').addEventListener('input', () => tradeSearch('get'));
CLICKS.on('[data-tradd],[data-trinc],[data-trdec]', e => {
  const a = e.target.closest('[data-tradd]'); if (a) { const [side, id] = a.dataset.tradd.split(':'); TRADE.add(side, +id);
    $(side === 'give' ? '#trGiveQ' : '#trGetQ').value = ''; tradeSearch(side); paintTrade(); return; }
  const i = e.target.closest('[data-trinc]'); if (i) { const [side, id] = i.dataset.trinc.split(':'); TRADE.bump(side, +id, 1); paintTrade(); return; }
  const d = e.target.closest('[data-trdec]'); if (d) { const [side, id] = d.dataset.trdec.split(':'); TRADE.bump(side, +id, -1); paintTrade(); return; }
});
$('#trPaste').addEventListener('click', async () => {
  const txt = await ask({ title: 'Their list', kind: 'multiline', ok: 'Add',
    why: 'One card per line, <b>4 OP01-016</b>. Each resolves to the likeliest printing; tap a row to swap it.',
    placeholder: '1 OP01-016 Nami\n2 OP05-119' });
  if (!txt) return;
  let added = 0, unknown = 0;
  for (const raw of txt.split(/\r?\n/)) {
    const m = parseListLine(raw);
    if (!m) { if (raw.trim()) unknown++; continue; }
    const sibs = (CAT.byNum.get(m[2].toUpperCase()) || []);
    /* Likeliest printing, same rule as the picker (landmine 84); they can swap it. */
    const p = sibs.slice().sort((a, b) => likelihood(b, null) - likelihood(a, null))[0];
    if (!p) { unknown++; continue; }
    TRADE.add('get', p.id, +m[1]); added += +m[1];
  }
  paintTrade(); toast(`Added ${added}` + (unknown ? ` \u00b7 ${unknown} unrecognised` : ''));
});
$('#trClear').addEventListener('click', () => { TRADE.give = []; TRADE.get = []; TRADE.save(); paintTrade(); });
$('#trShare').addEventListener('click', () => {
  const line = side => TRADE[side].map(r => { const p = CAT.byId.get(r.id); return `${r.n} ${p.num} ${p.name}${p.treat !== 'base' ? ' (' + (TREAT[p.treat] || p.treat) + ')' : ''}`; }).join('\n');
  const gv = TRADE.value('give'), gt = TRADE.value('get');
  const txt = `Trade \u2014 ${dayText(new Date().toISOString(), { year: true })}\n\nI give (${money(gv)}):\n${line('give') || '\u2014'}\n\nI get (${money(gt)}):\n${line('get') || '\u2014'}\n\nDifference: ${signedMoney(gt - gv)} at TCGplayer market via OP TCG Hub`;
  if (navigator.share) navigator.share({ title: 'Trade', text: txt }).catch(() => {});
  else { navigator.clipboard && navigator.clipboard.writeText(txt); toast('Summary copied'); }
});

