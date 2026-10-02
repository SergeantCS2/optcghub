/* =====================================================================
 * CARDS — Prep & Play’s browse (8.2, take 25). The question a deck builder
 * asks is "which Blockers under 4 cost are Red", not "show me Nami". So:
 * keyword chips from the take-12 extraction, colour, a cost range, full-text
 * over the cleaned card text, and "for this deck" -- filter to the open
 * deck’s Leader colours and add straight in. One row per NUMBER, the
 * likeliest printing (landmine 84); the collector picks a printing later.
 * ===================================================================== */
const CD = { kw: new Set(), col: new Set(), cost: null, forDeck: false };
const CD_KW = ['Blocker', 'Trigger', 'Rush', 'Counter', 'On Play', 'When Attacking', 'On K.O.',
               'Activate: Main', 'Double Attack', 'Banish', 'DON!! x', 'Once Per Turn'];
const CD_COST = [['0-2', 0, 2], ['3-4', 3, 4], ['5-6', 5, 6], ['7+', 7, 99]];
function paintCards() {
  const deck = CD.forDeck && dkCur ? dkCur : null;
  const L = deck && deck.leader ? CAT.byId.get(deck.leader) : null;
  $('#cdForDeck').textContent = 'For this deck: ' + (deck ? (deck.name || 'untitled') : 'off');
  $('#cdForDeck').classList.toggle('go', !!deck); $('#cdForDeck').setAttribute('aria-pressed', String(!!deck));   // take 108
  $('#cdKw').innerHTML = CD_KW.map(k => `<button class="chip${CD.kw.has(k) ? ' on' : ''}" data-cdkw="${esc(k)}" aria-pressed="${CD.kw.has(k)}">${
    KW_GLYPH[k] ? G(KW_GLYPH[k], 11) + ' ' : ''}${esc(k)}</button>`).join('');
  $('#cdCol').innerHTML = COLORS.map(c => `<button class="chip${CD.col.has(c) ? ' on' : ''}" data-cdcol="${c}" aria-pressed="${CD.col.has(c)}">
    <i style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px;background:var(--c-${CCLASS[c]})"></i>${c}</button>`).join('');
  $('#cdCost').innerHTML = CD_COST.map(([l]) => `<button class="chip${CD.cost === l ? ' on' : ''}" data-cdcost="${l}" aria-pressed="${CD.cost === l}">${G('don', 11)} ${l}</button>`).join('');
  const q = ($('#cdq').value || '').trim().toLowerCase();
  const range = CD_COST.find(([l]) => l === CD.cost);
  const byNum = new Map();
  for (const p of CAT.rows) {
    if (!p.num || p.sealed || !RULES.MAIN_TYPES.has(p.type)) continue;
    if (L && !colourLegal(p, L)) continue;
    if (CD.col.size && !colsOf(p).some(c => CD.col.has(c))) continue;
    if (range) { const c = parseInt(p.cost, 10); if (isNaN(c) || c < range[1] || c > range[2]) continue; }
    if (CD.kw.size && ![...CD.kw].every(k => hasKw(p, k))) continue;
    if (q && !(p.full + ' ' + p.num + ' ' + (p.subtypes || '') + ' ' + (p.text || '')).toLowerCase().includes(q)) continue;
    const cur = byNum.get(p.num);
    if (!cur || likelihood(p, null) > likelihood(cur, null)) byNum.set(p.num, p);
  }
  const hits = [...byNum.values()].sort((a, b) => (parseInt(a.cost, 10) || 0) - (parseInt(b.cost, 10) || 0) || a.name.localeCompare(b.name));
  $('#cdCount').textContent = `${hits.length.toLocaleString()} card${hits.length === 1 ? '' : 's'}${L ? ' in ' + colsOf(L).join('/') : ''}${
    hits.length > 80 ? ' · showing 80' : ''}`;
  $('#cdRes').innerHTML = hits.slice(0, 80).map(p => {
    const inDeck = deck ? (deck.cards.find(c => CAT.byId.get(c.id)?.num === p.num)?.n || 0) : 0;
    const kws = ['Blocker', 'Rush', 'Trigger', 'Counter', 'Double Attack', 'Banish'].filter(k => hasKw(p, k));
    return `<div class="dkrow" data-cd="${p.id}">
      <div class="cost">${p.cost != null && p.cost !== '' ? esc(p.cost) : '\u00b7'}</div>
      ${cardPic(p, THUMB.s)}
      <div class="n" data-open="${p.id}"><b>${esc(p.name)}</b>
        <span>${esc(p.num)} \u00b7 ${colsOf(p).join('/')}${p.power ? ' \u00b7 ' + Number(p.power).toLocaleString() : ''}${
          p.counter ? ' \u00b7 +' + Number(p.counter).toLocaleString() : ''}${kws.map(k => `<i class="kwtag">${KW_GLYPH[k] ? G(KW_GLYPH[k], 11) + ' ' : ''}${k}</i>`).join('')}</span>
        <span style="white-space:normal;color:var(--dim2);font-size:var(--fs-cap);-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden">${esc((p.text || '').replace(/\n+/g, ' ').slice(0, 160))}</span></div>
      <div class="cnt">${deck ? `<button data-cdadd="${p.id}" aria-label="One more">+</button>${inDeck ? `<b>${inDeck}</b>` : ''}` : ''}</div>
    </div>`;
  }).join('') || emptyHtml('filter', 'Nothing matches', 'Loosen a chip, or clear them.');
}
document.addEventListener('click', e => {
  const k = e.target.closest('[data-cdkw]'); if (k) { const v = k.dataset.cdkw; CD.kw.has(v) ? CD.kw.delete(v) : CD.kw.add(v); return paintCards(); }
  const c = e.target.closest('[data-cdcol]'); if (c) { const v = c.dataset.cdcol; CD.col.has(v) ? CD.col.delete(v) : CD.col.add(v); return paintCards(); }
  const co = e.target.closest('[data-cdcost]'); if (co) { CD.cost = CD.cost === co.dataset.cdcost ? null : co.dataset.cdcost; return paintCards(); }
  const a = e.target.closest('[data-cdadd]'); if (a && dkCur) { deckAdd(+a.dataset.cdadd, 1); return paintCards(); }
  if (e.target.id === 'cdForDeck') {
    if (!dkCur) { toast('Open a deck first \u2014 Decks tab'); return; }
    CD.forDeck = !CD.forDeck; return paintCards();
  }
});
$('#cdq').addEventListener('input', paintCards);

