/* ---- search ------------------------------------------------------------ */
function paintSearch() {
  paintBadges();
  const q = ($('#allq').value || '').trim().toLowerCase();
  if (!q && $('#allRes').innerHTML.includes('Biggest moves')) return;   // movers view stays
  /* A filter with no query is still a browse: "OP-06 alternate arts" with an
     empty search box must list them, not show the set index. */
  if (!q && !activeCount(FILT.all)) {
    $('#allRes').innerHTML = '';
    $('#setPanel').style.display = 'block';
    $('#setList').innerHTML = [...CAT.sets.values()].map(s =>
      `<button class="row" style="width:100%;text-align:left;align-items:center" data-browse-set="${s.id}">
        ${setPic(s)}<div class="nm"><b>${esc(s.name)}</b>
        <span>${esc(s.abbr || '')} \u00b7 ${setCards(s)}</span></div>
       <div class="v" style="color:var(--dim)">${esc((s.pub || '').slice(0, 4))}</div></button>`).join('');
    return;
  }
  $('#setPanel').style.display = 'none';
  const hits = sortRows(applyFilter(CAT.rows.map(p => ({ p, i: null })), FILT.all), FILT.all)
    .slice(0, 60).map(x => x.p);
  $('#allRes').innerHTML = !hits.length ? emptyHtml('spyglass', 'Nothing matches', 'Try the card number, like OP01-016, or fewer words.') : `<div class="panel">${hits.map(p => {
    const s = CAT.sets.get(p.set) || {};
    return `<button class="row" style="width:100%;text-align:left;align-items:center" data-open="${p.id}">
      ${cardPic(p)}<div class="nm"><b>${esc(p.name)}${p.treat !== 'base'
        ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
      <span>${dotJoin(esc(p.num), esc(s.abbr || s.name || ''), p.prov ? esc(p.prov) : '')}</span></div>
      <div class="v mono">${money(p.market)}</div></button>`;
  }).join('')}</div>`;
}
$('#allq').addEventListener('input', paintSearch);
/* take 95, landmine 135: the tap painted the Search screen and never showed
   it -- in Hunt a tapped release did nothing. In Hunt: the set’s sealed
   products on Sealed (every fold open, the query in the box to clear); in
   Collect: the set browse on Search. Either way the screen is SHOWN. */
function browseSet(id, q) {
  if (MODE.cur === 'hunt') {
    const s = CAT.sets.get(id); SEALED.q = q || (s && s.name) || ''; SEALED.kind = 'all';
    const inp = $('#sealedQ'); if (inp) inp.value = SEALED.q;
    paintSealed(); go('sealed'); window.scrollTo(0, 0); return;
  }
  Object.assign(FILT.all, blankFilter('all'), { set: [id], sort: 'num', dir: 1 });
  FILT.save('all'); paintSearch(); go('search'); window.scrollTo(0, 0);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-browse-set]'); if (!b) return;
  browseSet(+b.dataset.browseSet, b.dataset.browseQ);
});

