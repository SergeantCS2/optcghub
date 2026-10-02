/* =====================================================================
 * SET CHECKLIST — 8.3, take 26. Every number in a set as a grid, in order;
 * held ones lit, wanted ones dotted; tap a missing one to want it, tap a held
 * one to open it. Held counts the ACTIVE portfolio, as Home does.
 * ===================================================================== */
let ckSet = null, ckMode = 'all';
function openChecklist(setId) { ckSet = setId; ckMode = 'all'; go('checklist'); }
function paintChecklist() {
  const s = CAT.sets.get(ckSet); if (!s) return go('home');
  const byNum = new Map();
  for (const p of CAT.rows) if (p.set === ckSet && p.num) {
    const cur = byNum.get(p.num); if (!cur || likelihood(p, null) > likelihood(cur, null)) byNum.set(p.num, p);
  }
  const held = new Map();
  for (const i of PF.scope(OWN.items)) { const p = CAT.byId.get(i.id); if (p && p.set === ckSet) held.set(p.num, (held.get(p.num) || 0) + i.qty); }
  /* Numeric on the suffix: a string sort put EB03-026 before EB03-001 because
     one printing in the set carries the number under a different prefix. */
  const numKey = n => { const m = n.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 9999; };
  const nums = [...byNum.keys()].sort((a, b) => numKey(a) - numKey(b) || a.localeCompare(b));
  const have = nums.filter(n => held.has(n)).length;
  const missing = nums.filter(n => !held.has(n));
  const missingCost = missing.reduce((a, n) => a + (byNum.get(n).market || 0), 0);
  $('#ckTitle').textContent = s.abbr || s.name;
  $('#ckSummary').innerHTML = `<b>${have} of ${nums.length}</b> \u00b7 ${esc(s.name)}. ` +
    (missing.length ? `The ${missing.length} missing come to <b>${money(missingCost)}</b> at each one’s likeliest printing.` : 'Complete.');
  $('#ckFilter').innerHTML = [['all', 'All'], ['missing', 'Missing'], ['have', 'Have']].map(([k, l]) =>
    `<button class="chip${ckMode === k ? ' on' : ''}" data-ckmode="${k}" aria-pressed="${ckMode === k}">${l}</button>`).join('');
  const shown = nums.filter(n => ckMode === 'all' || (ckMode === 'have') === held.has(n));
  $('#ckGrid').innerHTML = shown.map(n => { const p = byNum.get(n); const h = held.get(n) || 0;
    return `<button class="ck${h ? ' have' : ''}${WANT.has(n) ? ' want' : ''}" data-ck="${esc(n)}" data-ckid="${p.id}" title="${esc(p.name)}">
      ${refArt(p)}<b style="position:relative">${esc(numLabel(n, ckSet))}</b><span style="position:relative">${esc(p.rarity || '')}</span>${h ? `<span class="qty">\u00d7${h}</span>` : ''}</button>`; }).join('');
  $('#ckWantAll').textContent = missing.length ? `Want the ${missing.length} missing` : 'Complete';
  $('#ckWantAll').disabled = !missing.length;
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-checklist]'); if (c) return openChecklist(+c.dataset.checklist);
  const m = e.target.closest('[data-ckmode]'); if (m) { ckMode = m.dataset.ckmode; return paintChecklist(); }
  const k = e.target.closest('[data-ck]');
  if (k) {
    if (k.classList.contains('have')) return openDetail(+k.dataset.ckid);
    const on = WANT.toggle(k.dataset.ck, +k.dataset.ckid);
    k.classList.toggle('want', on); toast(on ? `On your want list: ${k.dataset.ck}` : `Off your want list: ${k.dataset.ck}`); return;
  }
  if (e.target.id === 'ckWantAll' && ckSet) {
    const s = CAT.sets.get(ckSet); const held = new Set(PF.scope(OWN.items).map(i => (CAT.byId.get(i.id) || {}).num));
    let n = 0; const seen = new Set();
    for (const p of CAT.rows) if (p.set === ckSet && p.num && !held.has(p.num) && !seen.has(p.num)) { seen.add(p.num); if (!WANT.has(p.num)) { WANT.toggle(p.num, p.id); n++; } }
    paintChecklist(); toast(`On your want list: ${n} more from ${s.abbr || s.name}`); return;
  }
  const w = e.target.closest('[data-want]'); if (w) { WANT.toggle(w.dataset.want); if ($('#wants').classList.contains('on')) paintWants(); return; }
});

