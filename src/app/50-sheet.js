/* ---- the sheet ---------------------------------------------------------- */
let sheetScope = 'own';
function openFilters(scope) {
  sheetScope = scope;
  const f = FILT[scope];
  $('#fTitle').textContent = scope === 'own' ? 'Filter & sort your collection' : 'Filter & sort the catalogue';
  $$('#filters [data-own]').forEach(e => e.style.display = scope === 'own' ? '' : 'none');
  const pool = scope === 'own'
    ? OWN.items.map(i => ({ i, p: CAT.byId.get(i.id) })).filter(x => x.p)
    : CAT.rows.map(p => ({ p, i: null }));
  const chips = (id, opts, key, labelFn) => {
    $(id).innerHTML = opts.map(([v, lbl, n]) =>
      `<button class="chip${f[key].includes(v) ? ' on' : ''}" data-fk="${key}" data-fv="${esc(v)}" aria-pressed="${f[key].includes(v)}">${
        esc(labelFn ? labelFn(v, lbl) : lbl)}${n != null ? `<small>${n}</small>` : ''}</button>`).join('');
  };
  const count = fn => { const m = new Map(); pool.forEach(x => { const k = fn(x.p, x.i); if (k) m.set(k, (m.get(k) || 0) + 1); }); return m; };
  const bySet = count(p => p.set), byRar = count(p => p.rarity), byType = count(p => p.type),
        byTreat = count(p => p.treat), byCond = count((p, i) => i && i.condition);
  const byCol = new Map(); pool.forEach(x => cardColors(x.p).forEach(c => byCol.set(c, (byCol.get(c) || 0) + 1)));

  $('#fSort').innerHTML = Object.entries(SORTS[scope]).map(([k, lbl]) =>
    `<button class="chip${f.sort === k ? ' on' : ''}" data-sort="${k}" aria-pressed="${f.sort === k}">${lbl}${
      f.sort === k ? (f.dir < 0 ? ' \u2193' : ' \u2191') : ''}</button>`).join('');
  chips('#fSet', [...bySet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)
    .map(([id, n]) => [id, (CAT.sets.get(id) || {}).abbr || (CAT.sets.get(id) || {}).name || id, n]), 'set');
  chips('#fRarity', RARITY_ORDER.filter(r => byRar.has(r)).map(r => [r, r, byRar.get(r)]), 'rarity');
  chips('#fColor', COLORS.filter(c => byCol.has(c)).map(c => [c, c, byCol.get(c)]), 'color');
  chips('#fType', [...byType.entries()].map(([t, n]) => [t, t, n]), 'type');
  chips('#fTreat', [...byTreat.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => [t, TREAT[t] || t, n]), 'treat');
  chips('#fCond', CONDS.concat(['GRADED']).filter(c => byCond.has(c)).map(c => [c, c === 'GRADED' ? 'Graded' : c, byCond.get(c)]), 'cond');   // take 110: a word in sentence case beside the five codes
  $('#fOnly').innerHTML = ONLY[scope].map(([v, lbl]) =>
    `<button class="chip${f.only.includes(v) ? ' on' : ''}" data-only="${v}" aria-pressed="${f.only.includes(v)}">${lbl}</button>`).join('');
  $('#fMin').value = toShown(f.min); $('#fMax').value = toShown(f.max);
  $('#fMin').placeholder = 'min ' + CUR.sym().trim(); $('#fMax').placeholder = 'max ' + CUR.sym().trim();   // take 110: "$" in every currency was wrong
  paintFilterCount();
  $('#filters').classList.add('on');
}
function paintFilterCount() {
  const f = FILT[sheetScope];
  const pool = sheetScope === 'own'
    ? OWN.items.map(i => ({ i, p: CAT.byId.get(i.id) })).filter(x => x.p)
    : CAT.rows.map(p => ({ p, i: null }));
  const n = applyFilter(pool, f).length;
  /* take 111: the catalogue holds sealed products too ("7,661 printings" beside "Search all 6,987 cards"), and the
     collection counts lines, as More does */
  $('#fN').textContent = `${n.toLocaleString()} ${sheetScope === 'own' ? 'line' : 'result'}${n === 1 ? '' : 's'}`;
  $('#fApply').classList.toggle('go', n > 0);
}
$('#filters').addEventListener('click', e => {
  const f = FILT[sheetScope];
  const c = e.target.closest('[data-fk]');
  if (c) { const k = c.dataset.fk;
           /* dataset is always a string; the set facet is keyed by int (landmine 126) */
           const v = NUMERIC_FACETS.includes(k) ? +c.dataset.fv : c.dataset.fv;
           const i = f[k].indexOf(v); i >= 0 ? f[k].splice(i, 1) : f[k].push(v);
           c.classList.toggle('on', i < 0); c.setAttribute('aria-pressed', String(i < 0)); paintFilterCount(); return; }   /* take 115: from the filter, not a flip of the class */
  const o = e.target.closest('[data-only]');
  if (o) { const v = o.dataset.only; const i = f.only.indexOf(v);
           i >= 0 ? f.only.splice(i, 1) : f.only.push(v);
           o.classList.toggle('on', i < 0); o.setAttribute('aria-pressed', String(i < 0)); paintFilterCount(); return; }
  const so = e.target.closest('[data-sort]');
  if (so) { if (f.sort === so.dataset.sort) f.dir = -f.dir; else { f.sort = so.dataset.sort; f.dir = -1; }
            openFilters(sheetScope); return; }
  if (e.target.id === 'fClear') { Object.assign(f, blankFilter(sheetScope)); FILT.save(sheetScope);
                                  openFilters(sheetScope); return; }
  if (e.target.id === 'fApply' || e.target.closest('#fApply')) {
    f.min = fromShown($('#fMin').value); f.max = fromShown($('#fMax').value);
    FILT.save(sheetScope); $('#filters').classList.remove('on');
    sheetScope === 'own' ? paintCollection() : paintSearch(); return;
  }
  if (e.target === $('#filters')) $('#filters').classList.remove('on');
});
/* take 110's review: a sheet rises for --dur-sheet, and the second tap of a double tap landed on the scrim
   where the sheet was about to be, and closed it. A tap on the scrim waits until the sheet is up. */
const SHEET_UP = new WeakMap();
document.addEventListener('animationstart', e => { if (e.animationName === 'sheetUp') { const sh = e.target.closest('.sheet'); if (sh) SHEET_UP.set(sh, performance.now() + (parseFloat(getComputedStyle(e.target).animationDuration) || 0) * 1000); } }, true);
function risingScrim(t) { return !!t && !!t.classList && t.classList.contains('sheet') && performance.now() < (SHEET_UP.get(t) || 0); }
document.addEventListener('click', e => { if (risingScrim(e.target)) { e.stopPropagation(); e.preventDefault(); } }, true);
$('#fMin').addEventListener('input', () => { FILT[sheetScope].min = fromShown($('#fMin').value); paintFilterCount(); });
$('#fMax').addEventListener('input', () => { FILT[sheetScope].max = fromShown($('#fMax').value); paintFilterCount(); });
$('#sortBtn').addEventListener('click', () => openFilters('own'));
$('#sortBtnAll').addEventListener('click', () => openFilters('all'));
function paintBadges() {
  for (const [scope, id] of [['own', '#fBadgeCol'], ['all', '#fBadgeAll']]) {
    const n = activeCount(FILT[scope]); const b = $(id);
    b.style.display = n ? 'inline-block' : 'none'; b.textContent = n;
  }
}
/* Bulk actions. Multi-select, then act on the set. Delete asks, because a
   collection is months of evenings (PROTOCOL §9) and an undo we have not built
   is not a safety net. */
function bulkOn() { bulk = new Set(); paintCollection(); }
function paintBulk() {
  $('#bulkBar').style.display = bulk ? 'block' : 'none';
  if (!bulk) return;
  /* take 110's review: the bar counts and values what an action would take, as the confirm does -- it had
     valued each printing at the quantity of the first line found in any collection */
  const t = bulkSum(bulk);
  $('#bulkN').textContent = `${t.n} selected`;
  $('#bulkV').textContent = money(t.v);
}
$('#bulkX').addEventListener('click', () => { bulk = null; paintCollection(); });
/* Take 110 (AGENTS rule 5, the UI audit's finding in passing): the selection holds printing ids, and Delete
   removed every line of them in every collection and condition -- lines the collector could not see. Move
   and Condition already kept to the collection on screen; Delete does now, and its confirm values the lines
   with their quantities (it had counted one of each printing). */
/* Take 110's review: in the collection on screen was not enough -- a filter or the search hides lines too,
   and the selection is by printing, so Delete took the graded copy of a printing whose Near Mint tile was
   the one tapped. An action takes the lines on screen: the collection, the star, the filter, the search. */
function shownLines() {
  let rows = PF.scope(OWN.items).map(i => ({ i, p: CAT.byId.get(i.id) })).filter(x => x.p);
  if (favOnly) rows = rows.filter(x => x.i.fav);
  return applyFilter(rows, FILT.own);
}
function bulkLines(sel) { return sel ? shownLines().map(x => x.i).filter(i => sel.has(i.id)) : []; }
function bulkSum(sel) { const lines = bulkLines(sel); return { lines, n: lines.length, v: lines.reduce((a, i) => a + (price(i.id) || 0) * (i.qty || 1), 0) }; }
$('#bulkDel').addEventListener('click', () => {
  const { lines, n, v: worth } = bulkSum(bulk);
  if (!n) return toast('Nothing selected');
  const v = money(worth);
  if (!confirm(`Delete ${n} line${n > 1 ? 's' : ''} worth ${v}?\n\nThis cannot be undone. ` +
               `Export first if you are not sure.`)) return;
  const gone = new Set(lines);
  OWN.items = OWN.items.filter(i => !gone.has(i));
  commitOwn('bulk'); bulk = null; paintCollection();
  toast(`Deleted ${n} line${n > 1 ? 's' : ''}`);
});
$('#bulkMove').addEventListener('click', () => {
  const n = bulkLines(bulk).length; if (!n) return toast('Nothing selected');
  $('#pkTitle').textContent = `Move ${n} line${n === 1 ? '' : 's'} to`;
  $('#pkWhy').innerHTML = 'A line keeps its condition, quantity and photo. Only the collection changes.';
  $('#pkOpts').innerHTML = PF.list.map(p => `<button class="opt${p.id === PF.active ? '' : ''}" data-pfmove="${p.id}">
      <div class="oi"><b>${esc(p.name)}</b><span>${OWN.items.filter(i => (i.pf || 'main') === p.id).length} lines</span></div></button>`).join('');
  $('#picker').classList.add('on');
});
CLICKS.on('[data-pfmove]', e => {
  const b = e.target.closest('[data-pfmove]'); if (!b || !bulk) return;
  const to = PF.list.find(p => p.id === b.dataset.pfmove); if (!to) return;
  const lines = new Set(bulkLines(bulk)); OWN.items.forEach(i => { if (lines.has(i)) i.pf = to.id; });
  commitOwn('bulk'); bulk = null; $('#picker').classList.remove('on'); paintCollection(); toast(`Moved to ${to.name}`);
});
$('#bulkCond').addEventListener('click', () => {
  const n = bulkLines(bulk).length; if (!n) return toast('Nothing selected');
  $('#pkTitle').textContent = `Condition for ${n} line${n === 1 ? '' : 's'}`;
  $('#pkWhy').innerHTML = 'Condition is what you tell the app. It is shown beside the value and never multiplied into it.';
  $('#pkOpts').innerHTML = CONDS.map(c => `<button class="opt" data-bulkcond="${c}"><div class="oi"><b>${c}</b><span>${COND_NAMES[c]}</span></div></button>`).join('');
  $('#picker').classList.add('on');
});
CLICKS.on('[data-bulkcond]', e => {
  const b = e.target.closest('[data-bulkcond]'); if (!b || !bulk) return;
  const lines = new Set(bulkLines(bulk)); OWN.items.forEach(i => { if (lines.has(i)) i.condition = b.dataset.bulkcond; });
  commitOwn('bulk', { snap: false }); $('#picker').classList.remove('on'); paintCollection(); toast('Condition set to ' + b.dataset.bulkcond);
});

function paintCollection() {
  paintBadges();
  const items = sortRows(shownLines(), FILT.own);   /* take 110's review: what a bulk action takes is what is drawn */
  paintBulk();
  const empty = $('#colEmpty');
  empty.style.display = items.length ? 'none' : 'block';
  if (!items.length && OWN.items.length) {
    empty.innerHTML = G('spyglass', 64) + `Nothing matches those filters.<br>` +
      `<button class="linkish" id="colClearF">Clear ${activeCount(FILT.own)} filter${
        activeCount(FILT.own) === 1 ? '' : 's'}</button>`;
  } else if (!items.length) {
    empty.innerHTML = G('scancard', 64) + 'Nothing here yet.<br>Tap <b>Scan</b> and point the camera at a card.';
  }
  $('#colGrid').innerHTML = items.map(({ i, p }) => {
    const s = CAT.sets.get(p.set) || {};
    const sel = bulk && bulk.has(p.id);
    const prod = SEALED.isGoods(p);   /* take 111: a box's tile said "NM \u00b7 Normal" under a lone dot */
    return `<button class="tile" data-open="${p.id}"
        style="${sel ? 'border-color:var(--brass);background:var(--accent-bg)' : ''}">
      <div class="art">${linePic(i, p, `<div class="ph"><span class="phl">${esc(p.name)}</span><span class="num">${esc(p.num)}</span></div>`)}${
        lineShowsPhoto(i) ? '<span class="own">Your scan</span>' : ''}${
        i.photo ? `<span class="flip" role="button" tabindex="0" data-act="flip" data-line="${OWN.items.indexOf(i)}" aria-label="${lineShowsPhoto(i) ? 'Show the catalogue\u2019s picture' : 'Show your scan'}"><i>${G('swap', 16)}</i></span>` : ''}
      </div>
      <div class="cbar">${colourBar(p)}</div>
      <div class="t">${esc(p.name)}${p.treat !== 'base'
        ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</div>
      <div class="s">${esc(s.name || '')}</div>
      <div class="c">${prod ? esc(sealedWord(p)) : (TYPE_GLYPH[p.type] ? G(TYPE_GLYPH[p.type], 13) + ' ' : '') + dotJoin(esc(p.rarity || ''), esc(p.num))}</div>
      <div class="c" style="color:var(--dim)">${prod ? 'Sealed' : dotJoin(esc(i.condition), esc(p.sub || 'Normal'))}</div>
      <div class="foot">
        <span class="qty">Qty: ${i.qty}</span>
        <span class="px mono">${p.d1a > 0.004 ? '<span class="up">\u25b2</span> '
            : p.d1a < -0.004 ? '<span class="down">\u25bc</span> ' : ''}${money(p.market)}
          <span class="dl">${deltaHtml(p, { tile: true })}</span></span>
      </div></button>`;
  }).join('');
}
/* take 128 (the owner's note): a scanned line's picture by choice. The flip is the line's (pic: 'ref', or absent), kept
   through the one commit path (take 115) so the backup carries it; no snapshot -- the collection's value did not move. */
const FLIP = { swiped: false };
function flipLine(idx) {
  const i = OWN.items[idx]; if (!i || !i.photo) return false;
  if (i.pic === 'ref') delete i.pic; else i.pic = 'ref';
  commitOwn('pic', { snap: false }); paintCollection(); return true;
}
/* a sideways swipe on the picture flips it; a short move, or one more up or down than across, is the page's (the mode
   bar's rule, take 119) */
function flipSwipe(dx, dy) { return Math.abs(dx) >= 40 && Math.abs(dy) < Math.abs(dx); }
(() => {
  const g = $('#colGrid'); if (!g || !g.addEventListener) return; let sw = null;
  const lineOf = t => { const art = t && t.closest ? t.closest('.tile .art') : null, f = art && art.querySelector('[data-act="flip"]'); return f ? { art, line: +f.dataset.line } : null; };
  g.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; const l = lineOf(e.target); sw = l ? { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, art: l.art, line: l.line, held: false } : null; });
  /* the first 8 px say which way the finger goes: up or down is the page's; across, the picture takes the pointer -- only then
     (the look, take 128: a pointer captured on the way down made Chrome aim the tap's click at the picture, not the arrow, so the
     card opened and nothing flipped) */
  g.addEventListener('pointermove', e => { if (!sw || e.pointerId !== sw.id) return; sw.dx = e.clientX - sw.x; sw.dy = e.clientY - sw.y;
    if (sw.held) return; if (Math.hypot(sw.dx, sw.dy) < 8) return;
    if (Math.abs(sw.dy) > Math.abs(sw.dx)) { sw = null; return; }
    sw.held = true; try { sw.art.setPointerCapture(e.pointerId); } catch (x) {} });
  const end = e => { if (!sw || e.pointerId !== sw.id) return; const { dx, dy, line, held } = sw; sw = null; if (!held || !flipSwipe(dx, dy)) return;
    FLIP.swiped = true; setTimeout(() => { FLIP.swiped = false; }, 350); flipLine(line); };   /* the click a swipe leaves behind is not a tap on the card */
  g.addEventListener('pointerup', end); g.addEventListener('pointercancel', () => { sw = null; });
  /* the arrow is a span inside the tile's button (a button cannot hold another, take 115): Enter and Space work it */
  g.addEventListener('keydown', e => { const f = e.target && e.target.closest ? e.target.closest('[data-act="flip"]') : null; if (!f || (e.key !== 'Enter' && e.key !== ' ')) return; e.preventDefault(); e.stopPropagation(); flipLine(+f.dataset.line); });
})();
$('#colq').addEventListener('input', e => { colQuery = e.target.value; paintCollection(); });
CLICKS.on('#colClearF', e => {
  if (e.target.id === 'colClearF') {
    Object.assign(FILT.own, blankFilter('own')); FILT.save('own'); paintCollection();
  }
});
$('#favOnly').addEventListener('click', () => {   // take 108: the star fills, and says so
  favOnly = !favOnly; const b = $('#favOnly'); b.classList.toggle('on', favOnly); b.setAttribute('aria-pressed', String(favOnly)); paintCollection();
});
CLICKS.on('[data-open]', e => {
  const t = e.target.closest('[data-open]');
  if (!t) return;
  if (e.target.closest('[data-act="flip"]') || FLIP.swiped) return;   /* take 128: the arrow and the swipe are the picture's, not the card's */
  const id = +t.dataset.open;
  if (bulk) { bulk.has(id) ? bulk.delete(id) : bulk.add(id); paintCollection(); }
  else openDetail(id, { dist: !!t.dataset.distinfo });
});
CLICKS.on('[data-act]', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  ({
    export: exportCsv,
    sharepage: shareCollectionPage,
    rate: () => PLATFORM.rateApp(),
    currency: pickCurrency,
    shareapp: async () => { const r = await PLATFORM.shareApp(); if (r === 'copied') toast('Link copied'); if (r === false) toast('Could not share'); },
    adprivacy: () => ADS.privacy(),   /* take 127: UMP's privacy options, when it requires the entry point */
    backup: () => { if (scheduleBackup('manual') !== false) toast('Backing up to Documents/OPTCGHub'); },
    restore: restoreFromBackup,
    wants: () => go('wants'),
    binder: () => go('binder'),
    movers: showMovers,
    trade:  () => go('trade'),
    bulk:   () => { go('collection'); bulkOn(); toast('Tap cards to select'); },
    import: importCsv,
    flip: el => flipLine(+el.dataset.line),   /* take 128: a scanned tile's picture, the photo or the catalogue's */
    update: async () => { if (UPDATE.newer()) { await PLATFORM.openStore(); return; } await UPDATE.check(); paintSettings(); toast(UPDATE.note()); }   /* take 128: About's Google Play row */
  })[a.dataset.act]?.(a);
});

/* Market Movers needs two catalogue builds to compare, and on a fresh install
   there is exactly one. Saying so is the honest answer; inventing a movement
   from a single reading would be a confident wrong number (PROTOCOL §10). */
/* Market Movers. Take 3 stored a per-device baseline and waited; take 8 has
   the catalogue carry its own deltas, computed nightly from a committed price
   history, so every device sees the same movers and none of them has to have
   been opened yesterday to know what happened. */
function showMovers() {
  const mine = OWN.items.map(i => CAT.byId.get(i.id)).filter(p => p && p.d1p != null);
  const withQty = id => OWN.items.filter(i => i.id === id).reduce((a, i) => a + i.qty, 0);
  const rows = mine.map(p => ({ p, dollars: p.d1a * withQty(p.id) }))
    .filter(x => Math.abs(x.p.d1p) >= 0.01)
    .sort((a, b) => Math.abs(b.dollars) - Math.abs(a.dollars));
  const all = CAT.rows.filter(p => p.d1p != null && p.market >= 5)
    .sort((a, b) => Math.abs(b.d1a) - Math.abs(a.d1a)).slice(0, 8);
  const day = (CAT.man.history_days || []).slice(-1)[0] || '';
  const prev = (CAT.man.history_days || []).slice(-2)[0] || '';
  const line = (p, extra) => `<button class="row" style="width:100%;text-align:left;align-items:center" data-open="${p.id}">
      ${cardPic(p)}<div class="nm"><b>${esc(p.name)}${p.treat !== 'base'
        ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
      <span>${dotJoin(esc(p.num), money(p.market))}${extra || ''}</span></div>
      <div class="v">${deltaHtml(p)}</div></button>`;
  $('#allRes').innerHTML = `
    <div class="panel"><h3>Your collection \u00b7 ${esc(dayText(prev))} \u2192 ${esc(dayText(day))}</h3>
      ${rows.length ? rows.slice(0, 10).map(x => line(x.p,
          withQty(x.p.id) > 1 ? ` \u00b7 \u00d7${withQty(x.p.id)} = ${
            signedMoney(x.dollars)}` : '')).join('')
        : `<div class="note">${mine.length
            ? `Nothing you own moved ${esc(sinceLabel())}.`
            : 'Add cards and their moves show up here.'}</div>`}
    </div>
    <div class="panel"><h3>Biggest moves in the game</h3>
      ${all.map(p => line(p)).join('')}
      <div class="note">Cards under $5 excluded — a 40% swing on $0.30 is noise.</div>
    </div>`;
  $('#setPanel').style.display = 'none';
  go('search'); window.scrollTo(0, 0);
}

/* Import. Export without import is a one-way door, and a collector migrating
   in from another tracker is the most likely first user (ROADMAP 5.2). */
function importCsv() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.csv,text/csv';
  inp.addEventListener('change', async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const text = await f.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const head = splitCsv(lines[0]).map(h => h.trim().toLowerCase());
    const col = n => head.indexOf(n);
    const iId = col('product_id'), iNum = col('number'),
          iQty = col('qty'), iCond = col('condition'), iPaid = col('paid_usd'), iPf = col('portfolio');
    let added = 0, skipped = 0, ambiguous = 0;
    for (const line of lines.slice(1)) {
      const c = splitCsv(line);
      let pid = iId >= 0 ? +c[iId] : NaN;
      if (!CAT.byId.has(pid)) {
        /* No productId? Then the number alone is ambiguous for 91% of cards
           (landmine 41). Refuse rather than pick the cheap one. */
        const num = iNum >= 0 ? c[iNum] : null;
        const cand = num ? candidates(num, null) : [];
        if (cand.length === 1) pid = cand[0].id;
        else { (cand.length ? ambiguous++ : skipped++); continue; }
      }
      let pf = null;
      if (iPf >= 0 && c[iPf]) { const ex = PF.list.find(p => p.name === c[iPf]); pf = ex ? ex.id : PF.add(c[iPf]); }
      /* take 115: the cost basis goes on the line this row counted into (OWN.add's), never the printing's first
         line in any collection; a quantity that is not a number is 1 (it was NaN) */
      /* take 136 (A43): no write per row -- the one commitOwn('import') below writes the collection once (a file of
         thousands of lines wrote it thousands of times) */
      const it = OWN.add(pid, { qty: Math.max(1, +c[iQty] || 1),
                                condition: (c[iCond] || 'NM').toUpperCase(), pf, save: false });
      if (it && iPaid >= 0 && +c[iPaid] > 0) it.paid = +c[iPaid];
      added++;
    }
    commitOwn('import'); paintCollection();
    toast(`Imported ${added}` + (ambiguous ? `, ${ambiguous} ambiguous` : '') +
          (skipped ? `, ${skipped} unknown` : ''));
    if (ambiguous) alert(
      `${ambiguous} row${ambiguous > 1 ? 's' : ''} named a card number that matches ` +
      `more than one printing, and no product_id to say which.\n\n` +
      `Guessing would misprice them by up to 4,292x, so they were left out. ` +
      `Re-export from the other app with a TCGplayer product id if it offers one.`);
  });
  inp.click();
}
function splitCsv(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
             else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur); return out;
}

/* The backup: everything the collector owns, in one JSON. Items, decks, credits,
   snapshots, filters. NOT the catalogue (disposable) and NOT the photos
   (derived, re-scannable). PROTOCOL §9 -- this is the thing that must never
   be lost, and it is written on every commit, not on request.
   Take 115 (loose-production 4): the stock alerts, the release reminders, the
   Hunt notes and the trade lists too -- they were the collector's and in no
   backup. keepPhotos: the copy a restore keeps of what it replaced, on this
   phone, where the photos still are. */
function backupJson(keepPhotos = false) {
  return JSON.stringify({
    app: 'OP TCG Hub', take: TAKE, at: new Date().toISOString(),
    catalogue: CAT.man.source_updated_at || null,
    items: OWN.items.map(i => ({ ...i, photo: i.photo ? (keepPhotos ? i.photo : '(on device)') : null })),
    portfolios: PF.list, activePortfolio: PF.active, wants: WANT.list, alerts: ALERTS.list,
    snaps: OWN.snaps, decks: DECKS.list, credits: CREDITS.state,
    stockAlerts: STOCK.list, relAlerts: RELALERTS.list, notes: LOCAL.notes, trade: { give: TRADE.give, get: TRADE.get },
    filters: { own: FILT.own, all: FILT.all },
    /* take 136 (A43, A2): the cards scanned and accepted but not yet saved -- in no backup until now, so an uninstall
       or a lost phone mid-scan lost them. Photos as a line's are: on the device, kept only in the copy kept aside. */
    batch: { rows: BATCH.rows.map(r => ({ ...r, photo: r.photo ? (keepPhotos ? r.photo : '(on device)') : null })), setId: BATCH.setId || null }
  });
}
/* take 115 (STAN-111-17, loose-production 4): one commit for the collection -- saved, today's reading taken again
   when the count or the value can have moved (snap), and the backup scheduled: PROTOCOL §9's "every commit".
   Each site wrote the steps out, and CSV import, bulk move, condition and delete, removing a collection, a cost
   basis, a graded copy and a restore never scheduled the backup. */
function commitOwn(reason, { snap = true } = {}) { if (snap) OWN.snapshot(); else OWN.save(); scheduleBackup(reason); }
let _backupTimer = null;
/* take 115: when a stored list the backup carries could not be read the app runs on an empty one, and a backup
   would write that over the good file -- the one Restore reads. So readJson sets a hold (vault.backupHold) that
   outlives the launch: while it stands no backup is written over a backup on file, and every launch says
   so. A restore ends it; so does the collector's own Back up, after a confirm that says what it replaces;
   and with no backup on file there is nothing to keep, so the first backup ends it too. */
function backupHeld() {
  if (STORE.holdBackup) return true;
  try { return localStorage.getItem('vault.backupHold') != null; } catch (e) { return false; }
}
function releaseBackupHold() { STORE.holdBackup = false; try { localStorage.removeItem('vault.backupHold'); } catch (e) {} }
function scheduleBackup(reason, wait = 400) {   /* take 136: wait -- the batch's backup waits for a pause in scanning */
  if (reason === 'manual' && backupHeld()) {
    if (!confirm(`The ${heldWhat()} saved on this phone could not be read, so your last backup may hold what the app cannot show now.\n\nBack up now and replace it? Restore from backup brings it back instead.`)) return false;
    releaseBackupHold();
  }
  clearTimeout(_backupTimer);
  _backupTimer = setTimeout(async () => {
    if (backupHeld()) { if (await PLATFORM.readBackup()) return; releaseBackupHold(); }   // a backup on file is kept until a restore
    let where = null, why = '';
    try { where = await PLATFORM.backup(backupJson()); } catch (e) { why = String((e && e.message) || e); }
    /* take 125: a failure keeps its reason -- Diagnostics and the self-test say it (landmine 239) */
    OWN.lastBackup = where ? { at: new Date().toISOString(), where, reason } : { failed: true, at: new Date().toISOString(), why };
    saveJson('vault.lastBackup', OWN.lastBackup);
    if (!where) { ERRS.push('backup', `backup failed: ${why}`, 'scheduleBackup'); toast('Backup failed — export your collection'); }
  }, wait);
}
/* take 115 (loose-production 4): a restore reads the file before it replaces anything -- this app's backup, each
   list in it a list, each line naming a printing (a record or a word where a list belongs broke every screen that
   read it) -- and keeps what it replaces: vault.beforeRestore in this phone's storage (Restore offers it, so a
   mistaken restore is undone the way it was done) and, on the phone, Documents/OPTCGHub/backup-before-restore.json,
   which outlives an uninstall and the file picker reaches. */
const BACKUP_LISTS = ['items', 'snaps', 'decks', 'portfolios', 'wants', 'alerts', 'stockAlerts', 'relAlerts', 'notes'];
const isRecord = x => !!x && typeof x === 'object' && !Array.isArray(x);
function backupProblem(b) {
  if (!isRecord(b) || b.app !== 'OP TCG Hub') return 'the file is not an OP TCG Hub backup';
  if (!Array.isArray(b.items)) return 'the backup has no list of cards';
  const k = BACKUP_LISTS.find(x => b[x] != null && !Array.isArray(b[x])); if (k) return `its ${k} are not a list`;
  if (b.items.some(i => !isRecord(i) || i.id == null)) return 'a line in it names no printing';
  if (b.decks && b.decks.some(d => !isRecord(d) || !Array.isArray(d.cards))) return 'a deck in it has no card list';
  if (b.trade != null && (!isRecord(b.trade) || [b.trade.give, b.trade.get].some(x => x != null && !Array.isArray(x)))) return 'its trade lists are not lists';
  if (b.credits != null && !isRecord(b.credits)) return 'its credits are not a record';
  if (b.batch != null && (!isRecord(b.batch) || !Array.isArray(b.batch.rows) || b.batch.rows.some(r => !isRecord(r) || r.id == null))) return 'its waiting scans are not a list of cards';   /* take 136 */
  return '';
}
function keptBeforeRestore() { try { return localStorage.getItem('vault.beforeRestore'); } catch (e) { return null; } }
async function keepBeforeRestore() {
  const any = [OWN.items, DECKS.list, WANT.list, ALERTS.list, STOCK.list, RELALERTS.list, LOCAL.notes, TRADE.give, TRADE.get, BATCH.rows].some(l => l && l.length);   /* take 136: the waiting scans too */
  if (!any) { try { localStorage.removeItem('vault.beforeRestore'); } catch (e) {} return true; }   // nothing to keep; no older copy left to pass for it
  const json = backupJson(true), here = saveJson('vault.beforeRestore', json);
  await PLATFORM.keepAside(json);   // on the phone, the file beside the backups too: it outlives an uninstall
  /* take 115 (self-review): kept means the copy Restore offers -- the one in storage. The file alone was counted,
     so a full storage restored with no second question and the next Restore offered no undo. */
  return here;
}
async function restoreFromBackup() {
  let raw = await PLATFORM.readBackup(), src = 'latest';
  const kept = keptBeforeRestore();
  /* take 137 (A43): an earlier day than the latest's is a choice to offer -- a dated copy is written every day the app
     backs up, and Restore went straight to the latest unless an earlier restore had kept something, so the backup
     from before a mistake was out of reach. With nothing earlier and nothing kept it still goes straight there. */
  let latestDay = ''; try { latestDay = localDay(JSON.parse(raw).at); } catch (e) {}   // the phone's day, as the copies are named
  const earlier = (await PLATFORM.backupDays()).filter(d => !latestDay || d < latestDay).slice(0, 3);
  if (kept || earlier.length) {
    const about = j => { try { const x = JSON.parse(j), n = (x.items || []).length, d = (x.decks || []).length;
      return esc(`${momentText(x.at)} \u00b7 ${n} line${n === 1 ? '' : 's'} \u00b7 ${d} deck${d === 1 ? '' : 's'}`); } catch (e) { return ''; } };
    const opt = (k, t, sub) => `<button class="opt" data-rsrc="${k}"><div class="oi"><b>${t}</b><span>${sub}</span></div></button>`;
    src = await PICKER.choose({ title: 'Restore from', key: 'rsrc',
      why: 'What is on the phone now is replaced, and kept: a restore can be undone the same way.',
      opts: (raw ? opt('latest', 'The latest backup', about(raw)) : '')
        + earlier.map(d => opt('day:' + d, `The backup of ${esc(dayText(d))}`, 'its dated copy \u2014 Documents \u203a OPTCGHub')).join('')
        + (kept ? opt('kept', 'What the last restore replaced', about(kept)) : '')
        + opt('file', 'Choose a file', 'any backup \u2014 Documents \u203a OPTCGHub') });
    if (!src) return;
    const day = src.startsWith('day:') ? src.slice(4) : null;
    raw = src === 'kept' ? kept : src === 'file' ? await PLATFORM.pickTextFile('.json,application/json') : day ? await PLATFORM.readBackupDay(day) : raw;
    if (!raw) return toast(day ? 'That day\u2019s backup could not be read \u2014 Choose a file reaches it' : 'No backup chosen');
  } else if (!raw) {
    toast('No backup of this install \u2014 choose the newest file in Documents \u203a OPTCGHub');   // take 125: another install's latest can be backup-latest-<time>.json (landmine 239)
    raw = await PLATFORM.pickTextFile('.json,application/json');
    if (!raw) return toast('No backup chosen');
  }
  let b; try { b = JSON.parse(raw); } catch (e) { return toast('Backup is not readable'); }
  const why = backupProblem(b);
  if (why) { ERRS.push('restore', `refused: ${why}`, 'restoreFromBackup'); return toast(`Nothing restored \u2014 ${why}`, 6000); }
  const n = b.items.length, d = (b.decks || []).length, w = b.batch ? b.batch.rows.length : 0;   /* take 136: the waiting scans, named when there are any */
  const decksW = `${d} deck${d === 1 ? '' : 's'}`, waitW = `${w} waiting scan${w === 1 ? '' : 's'}`;
  if (!confirm(`Restore ${n} collection line${n === 1 ? '' : 's'}${w ? `, ${decksW} and ${waitW}` : ` and ${decksW}`} from ${momentText(b.at)}?\n\nThis replaces what is on the phone now. What it replaces is kept: Restore from backup offers it.`)) return;
  if (!(await keepBeforeRestore())) {
    if (!confirm('What is on the phone now could not be kept aside (the storage is full).\n\nRestore anyway? Cancel, then Export CSV, keeps it.')) return;
    try { localStorage.removeItem('vault.beforeRestore'); } catch (e) {}   // an older copy must not pass for what this restore replaced
  }
  const own = src === 'kept';   // the kept copy is this phone's own: its photos are still here
  OWN.items = b.items.map(i => ({ ...i, photo: own && i.photo && i.photo !== '(on device)' ? i.photo : null }));   // photos are derived; rescans restore them
  OWN.snaps = b.snaps || []; DECKS.list = b.decks || [];
  if (b.portfolios) { PF.list = b.portfolios; PF.active = b.activePortfolio || 'main'; PF.save(); }
  if (b.wants) { WANT.list = b.wants; WANT.save(); }
  if (b.alerts) { ALERTS.list = b.alerts; ALERTS.save(); }
  if (b.stockAlerts) { STOCK.list = b.stockAlerts; STOCK.save(); }
  if (b.relAlerts) { RELALERTS.list.forEach(a => PLATFORM.cancelNotify(RELALERTS.nid(a.id))); RELALERTS.list = b.relAlerts; RELALERTS.save(); RELALERTS.list.forEach(a => RELALERTS.arm(a)); }
  if (b.notes) { LOCAL.notes = b.notes; LOCAL.saveNotes(); }
  if (b.trade) { TRADE.give = b.trade.give || []; TRADE.get = b.trade.get || []; TRADE.save(); }
  if (b.credits) CREDITS.state = b.credits;
  if (b.batch) { BATCH.rows = b.batch.rows.map(r => ({ ...r, photo: own && r.photo && r.photo !== '(on device)' ? r.photo : null })); BATCH.setId = b.batch.setId || null; BATCH.save(); }   /* take 136 */
  DECKS.save(); CREDITS.save(); releaseBackupHold();   // take 115: a restore ends the hold on backups
  commitOwn('restore');
  toast(`Restored ${n} lines, ${d} decks` + (w ? `, ${w} waiting scans` : '')); go('collection');
}

/* Landmine 20 / PROTOCOL §9: export exists before charts do. Take 34: on a
   device it goes through the share sheet, because a download link is a no-op
   in the WebView (landmine 110). */
async function exportCsv() {
  const head = ['portfolio', 'product_id', 'number', 'name', 'printing', 'set', 'rarity',
                'finish', 'condition', 'qty', 'paid_usd', 'market_usd', 'low_usd',
                'high_usd', 'price_source', 'price_as_of', 'added'];
  const asOf = (CAT.man.source_updated_at || '').slice(0, 10);
  const rows = OWN.items.map(i => {
    const p = CAT.byId.get(i.id) || {}, s = CAT.sets.get(p.set) || {};
    return [PF.name(i.pf || 'main'), i.id, p.num, p.name, TREAT[p.treat] || p.treat, s.name, p.rarity,
            p.sub, i.condition, i.qty, i.paid || '', p.market, p.low, p.high,
            'TCGplayer via TCGCSV', asOf, i.added];
  });
  const csv = [head, ...rows].map(r => r.map(v =>
    `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const name = `optcghub-${new Date().toISOString().slice(0, 10)}.csv`;
  const shared = await PLATFORM.shareFile(name, csv, 'Keep this somewhere safe');
  if (shared === 'shared') return toast(`Exported ${rows.length} rows`);
  if (shared === 'cancelled') return;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  a.click(); URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} rows`);
}

/* 8.12 (take 42): the collection as one self-contained web page, handed over
   through the share sheet (landmine 110's path) or downloaded in a browser.
   Text and numbers only -- no art, no script, no request in it: the file
   leaves the phone, and what leaves the phone is the collector’s own list. */
function collectionPage() {
  const scope = PF.scope(OWN.items).filter(i => CAT.byId.get(i.id));
  const asOf = (CAT.man.source_updated_at || '').slice(0, 10);
  const pfName = PF.active === 'all' ? 'All collections' : PF.name(PF.active);
  const total = scope.reduce((a, i) => a + (price(i.id) || 0) * i.qty, 0);
  const cards = scope.reduce((a, i) => a + i.qty, 0);
  const top = scope.slice().sort((a, b) => (price(b.id) || 0) * b.qty - (price(a.id) || 0) * a.qty).slice(0, 10);
  const prog = setProgress();
  const bySet = new Map();
  for (const i of scope) { const p = CAT.byId.get(i.id); (bySet.get(p.set) || bySet.set(p.set, []).get(p.set)).push({ i, p }); }
  const row = ({ i, p }) => `<tr><td>${esc(p.num)}</td><td>${esc(p.name)}</td><td>${esc(TREAT[p.treat] || p.treat)}</td><td class="n">${i.qty}</td><td>${esc(i.condition || '')}</td><td class="n">${esc(money(price(i.id)))}</td></tr>`;
  const sets = [...bySet.entries()].sort((a, b) => (CAT.sets.get(a[0])?.name || '').localeCompare(CAT.sets.get(b[0])?.name || ''))
    .map(([sid, rows]) => `<h2>${esc(CAT.sets.get(sid)?.name || sid)}</h2><table>${rows.sort((a, b) => a.p.num.localeCompare(b.p.num)).map(row).join('')}</table>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pfName)} \u2014 OP TCG Hub</title>
<style>body{margin:0;padding:24px;background:#0B1622;color:#EADFC8;font:15px/1.45 "Open Sans",system-ui,sans-serif}
h1{font-size:28px;margin:0 0 4px;color:#C9A24A}h2{font-size:17px;margin:28px 0 8px;color:#C9A24A}.sub{color:#A08E70;margin-bottom:20px}
.big{font-size:40px;font-weight:900;color:#C9A24A;letter-spacing:-.01em}table{border-collapse:collapse;width:100%;max-width:820px}
td,th{padding:6px 8px;border-bottom:1px solid #26394B;text-align:left;vertical-align:top}th{color:#A08E70;font-weight:600}.n{text-align:right;font-variant-numeric:tabular-nums}
.bar{height:6px;background:#182A3A;border-radius:3px;overflow:hidden}.bar i{display:block;height:100%;background:#C9A24A}
.note{color:#A08E70;font-size:13px;margin-top:28px}</style></head><body>
<h1>${esc(pfName)}</h1><div class="sub">${cards} card${cards === 1 ? '' : 's'} \u00b7 ${scope.length} lines \u00b7 TCGplayer market via TCGCSV, ${esc(dayText(asOf, { year: true }))}</div>
<div class="big">${esc(money(total))}</div>
<h2>Most valuable</h2><table><tr><th>Number</th><th>Card</th><th>Printing</th><th class="n">Qty</th><th>Condition</th><th class="n">Market</th></tr>${top.map(i => row({ i, p: CAT.byId.get(i.id) })).join('')}</table>
<h2>Set completion</h2><table>${prog.map(r => `<tr><td>${esc(r.s.name || '')}</td><td class="n">${r.have} / ${r.all}</td><td style="width:40%"><div class="bar"><i style="width:${r.all ? Math.round(100 * r.have / r.all) : 0}%"></i></div></td><td class="n">${esc(money(r.val))}</td></tr>`).join('')}</table>
${sets}
<div class="note">A market price is an estimate, not an offer, and condition is the collector’s own assertion \u2014 it does not change the figure shown. Made with OP TCG Hub. Not affiliated with Bandai, Shueisha, Toei Animation, Viz Media or TCGplayer.</div>
</body></html>`;
}
async function shareCollectionPage() {
  const html = collectionPage();
  const name = `optcghub-${new Date().toISOString().slice(0, 10)}.html`;
  const shared = await PLATFORM.shareFile(name, html, 'Share your collection page');
  if (shared === 'shared') return toast('Collection page shared');
  if (shared === 'cancelled') return;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  toast('Collection page saved');
}

