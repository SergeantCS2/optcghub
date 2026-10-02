/* =====================================================================
 * WANT LIST — 8.4, take 26. The inverse of the collection: numbers the
 * collector is after, keyed on NUMBER (a want is "a Nami", not a specific
 * printing, until they say otherwise), valued at the likeliest printing’s
 * market. Lives beside the collection in storage and in the backup.
 * ===================================================================== */
const WANT = {
  list: readJson('vault.wants', []),
  save() { saveJson('vault.wants', this.list); scheduleBackup('lists'); },
  has(num) { return this.list.some(w => w.num === num); },
  toggle(num, id = null) {
    if (this.has(num)) this.list = this.list.filter(w => w.num !== num);
    else this.list.push({ num, id, added: new Date().toISOString() });
    this.save(); return this.has(num);
  },
  printing(w) { return (w.id && CAT.byId.get(w.id)) || (CAT.byNum.get(w.num) || []).slice().sort((a, b) => likelihood(b, null) - likelihood(a, null))[0] || null; },
  total() { return this.list.reduce((a, w) => { const p = this.printing(w); return a + (p ? (p.market || 0) : 0); }, 0); }
};
function paintWants() {
  const rows = WANT.list.map(w => ({ w, p: WANT.printing(w) })).filter(x => x.p)
    .sort((a, b) => (b.p.market || 0) - (a.p.market || 0));
  const bySet = new Map();
  rows.forEach(x => { bySet.set(x.p.set, (bySet.get(x.p.set) || 0) + (x.p.market || 0)); });
  $('#wtSummary').innerHTML = rows.length
    ? `<div class="row"><div class="nm"><b>${rows.length} card${rows.length === 1 ? '' : 's'} wanted</b>
        <span>at each one’s likeliest printing, today’s market</span></div><div class="v mono">${money(WANT.total())}</div></div>` +
      [...bySet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([sid, v]) =>
        `<div class="row"><div class="nm"><span>${esc((CAT.sets.get(sid) || {}).name || '')}</span></div><div class="v mono" style="font-size:var(--fs-sm);color:var(--dim)">${money(v)}</div></div>`).join('')
    : emptyHtml('bookmark', 'Nothing on your want list yet', 'Open a set from Home and tap the cards you are missing.');
  $('#wtRows').innerHTML = rows.map(({ w, p }) => `<div class="dkrow">
      ${cardPic(p, THUMB.s)}
      <div class="n" data-open="${p.id}"><b>${esc(p.name)}${p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
        <span>${dotJoin(esc(p.num), esc((CAT.sets.get(p.set) || {}).abbr || ''), money(p.market))}</span></div>
      <div class="cnt"><button data-want="${esc(p.num)}" aria-label="Remove ${esc(p.name)} from the want list">${G('trash', 18)}</button></div>
    </div>`).join('');
}
$('#wtClear').addEventListener('click', () => { if (WANT.list.length && confirm('Clear the want list?')) { WANT.list = []; WANT.save(); paintWants(); } });

