/* =====================================================================
 * BINDER — 8.6, take 28. Nine pockets a page, one set at a time, in
 * card-number order, one pocket per NUMBER the collector holds (the sleeved
 * printing’s own photo if scanned, else the reference art). Empty pockets
 * mark numbers not held so a page reads like the physical binder does --
 * gaps and all. Pages flip; the page is remembered per set.
 * ===================================================================== */
const BN = { set: null, page: 0, pageOf: {} };
const bnSpread = () => typeof innerWidth === 'number' && innerWidth >= 700;   /* take 120: the open Fold shows a spread */
if (typeof addEventListener === 'function') addEventListener('resize', () => { const b = $('#binder'); if (b && b.classList && typeof b.classList.contains === 'function' && b.classList.contains('on')) paintBinder(); });   /* the Fold opening or closing on the binder */
/* A number’s label inside a set: the suffix when the prefix is the set’s own,
   the full number when it is a reprint carrying another set’s number
   (landmine 101). Two pockets both reading "002" were EB03-002 and EB02-002. */
function numLabel(num, setId) {
  const s = CAT.sets.get(setId); const pre = (num.match(/^(.*)-\d+$/) || [])[1] || '';
  const own = (s && s.abbr || '').replace(/\s.*$/, '').replace(/-/g, '');
  return pre.replace(/-/g, '') === own ? (num.split('-').pop()) : num;
}
function binderSets() {
  const m = new Map();
  for (const i of PF.scope(OWN.items)) { const p = CAT.byId.get(i.id); if (p && p.num) m.set(p.set, (m.get(p.set) || 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ s: CAT.sets.get(id), n })).filter(x => x.s);
}
function paintBinder() {
  const sets = binderSets();
  if (!sets.length) { $('#bnSets').innerHTML = ''; $('#bnGrid').innerHTML = `<div class="empty" style="grid-column:1/-1">${G('binder', 64)}Scan or add a card and its set\u2019s pages appear here.</div>`; $('#bnOf').textContent = ''; $('#bnPage').textContent = ''; return; }
  if (!BN.set || !sets.some(x => x.s.id === BN.set)) BN.set = sets[0].s.id;
  $('#bnSets').innerHTML = sets.map(x => `<button class="chip${x.s.id === BN.set ? ' on' : ''}" data-bnset="${x.s.id}" aria-pressed="${x.s.id === BN.set}">${esc(x.s.abbr || x.s.name)}<small>${x.n}</small></button>`).join('');
  /* every number in the set, in numeric order; held numbers get a pocket */
  const byNum = new Map();
  for (const p of CAT.rows) if (p.set === BN.set && p.num) { const c = byNum.get(p.num); if (!c || likelihood(p, null) > likelihood(c, null)) byNum.set(p.num, p); }
  const heldBy = new Map();
  for (const i of PF.scope(OWN.items)) { const p = CAT.byId.get(i.id); if (p && p.set === BN.set) { const cur = heldBy.get(p.num);
    if (!cur || (i.photo && !cur.i.photo) || (p.market || 0) > (cur.p.market || 0)) heldBy.set(p.num, { p, i }); } }
  const numKey = n => { const m = n.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 9999; };
  const nums = [...byNum.keys()].sort((a, b) => numKey(a) - numKey(b) || a.localeCompare(b));
  const pages = Math.max(1, Math.ceil(nums.length / 9));
  /* take 111: a set not yet paged opens at its first held pocket -- it opened on nine empty ones */
  const firstHeld = nums.findIndex(n => heldBy.has(n));
  BN.page = Math.min(BN.pageOf[BN.set] != null ? BN.pageOf[BN.set] : Math.max(0, Math.floor(firstHeld / 9)), pages - 1);
  /* take 120: on the open Fold a spread -- the page and the one facing it, eighteen pockets; a spread starts on an even page */
  const spread = bnSpread(), per = spread ? 18 : 9, first = spread ? BN.page - (BN.page % 2) : BN.page;
  const slice = nums.slice(first * 9, first * 9 + per);
  while (slice.length < per) slice.push(null);
  const pocket = num => {
    if (!num) return '<div class="pocket empty"></div>';
    const h = heldBy.get(num);
    if (!h) return `<button class="pocket empty" data-ck="${esc(num)}" data-ckid="${byNum.get(num).id}"><span class="n">${esc(numLabel(num, BN.set))}</span></button>`;
    return `<button class="pocket" data-open="${h.p.id}">
      ${linePic(h.i, h.p)}
      <span class="n">${esc(numLabel(num, BN.set))}${h.i.qty > 1 ? ' \u00d7' + h.i.qty : ''}</span>
      <span class="tag">${esc(h.p.name)}${h.p.treat !== 'base' ? ' \u00b7 ' + esc(TREAT[h.p.treat] || h.p.treat) : ''}</span></button>`;
  };
  const grid = $('#bnGrid'); if (grid.classList) grid.classList.toggle('spread', spread);
  grid.innerHTML = Array.from({ length: per / 9 }, (_, i) => `<div class="bnpage">${slice.slice(i * 9, i * 9 + 9).map(pocket).join('')}</div>`).join('');
  const s = CAT.sets.get(BN.set), last = Math.min(first + per / 9, pages);
  $('#bnPage').textContent = `${esc(s.abbr || '')} \u00b7 ${last - first > 1 ? `pages ${first + 1}\u2013${last}` : `page ${first + 1}`} of ${pages}`;
  $('#bnOf').textContent = `${heldBy.size} of ${nums.length} pockets filled`;
  $('#bnPrev').disabled = first === 0; $('#bnNext').disabled = last >= pages;
}
/* take 115 (SPEC-111-49): a page turn counts from the page on screen -- a set opened at its first held card's
   page had no page stored, and Next from page 5 of 14 went to page 2. paintBinder keeps it inside the set. */
function bnTurn(d) { const step = bnSpread() ? 2 : 1, at = bnSpread() ? BN.page - (BN.page % 2) : BN.page; BN.pageOf[BN.set] = Math.max(0, at + d * step); return paintBinder(); }   /* take 120: a spread turns by two */
CLICKS.on('[data-bnset],#bnPrev,#bnNext', e => {
  const st = e.target.closest('[data-bnset]'); if (st) { BN.set = +st.dataset.bnset; return paintBinder(); }
  if (e.target.id === 'bnPrev') return bnTurn(-1);
  if (e.target.id === 'bnNext') return bnTurn(1);
});

