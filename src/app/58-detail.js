/* ---- detail ------------------------------------------------------------ */
const CONDS = ['NM', 'LP', 'MP', 'HP', 'DMG'];
const COND_NAMES = { NM: 'Near Mint', LP: 'Lightly Played', MP: 'Moderately Played', HP: 'Heavily Played', DMG: 'Damaged' };
let dCur = null, dQty = 1, dCond = 'NM';
/* take 111: the page's copy is the line in the collection it names ("Adding to …") -- the stepper, a
   condition tap, Save and the cost basis each took the printing's first line in ANY collection, so Save on a
   trade pile's page could set the main collection's count; a slab is never the page's line */
const dLine = () => dCur && OWN.line(dCur.id, dCond);   // take 115: OWN decides which line is the page's
/* take 112: a sealed product's distributors, each in its full words with its own page, under a closed "Distributor
   info" -- opened when the page was reached from a row's distributor line */
function paintDetailDist(p) {
  const el = $('#dDist'); const list = (SEALED.isGoods(p) && HUNT.distByCatalogId()[p.id]) || [];
  el.hidden = !list.length; if (!list.length) { el.innerHTML = ''; return; }
  const tls = list.map(distTl);   /* take 114: each distributor's history on file, under its own words, drawn only inside the open fold */
  /* take 115 (SPEC-112-54, the look): Sealed and Releases said a distributor kept after a failed fetch was not reached,
     and the product's own page did not -- its summary named the distributors and GTS's line gave the kept copy's age
     as if it were a check. The summary says how many were not reached and since when, as distSummary does, and the
     kept distributor's line says so, while its words are still the kept copy's */
  const ks = [...new Set(list.map(it => it._d))], dead = ks.map(k => HUNT.dist(k)).filter(D => HUNT.unreached(D));
  const since = dead.length && dead.every(D => D.stale_since) ? dead.map(D => D.stale_since).sort()[0] : '';   // as distSummary
  const summary = esc(ks.map(k => HUNT.distName(k)).join(', ')) + (dead.length ? ` \u00b7 ${dead.length} not reached${since ? ' since ' + esc(nbsp(momentText(since))) : ''}` : '');
  const when = it => { const D = HUNT.dist(it._d) || {};
    return HUNT.unreached(D) ? `could not reach it${D.stale_since ? ' since ' + esc(nbsp(momentText(D.stale_since))) : ''}; its last check, ${esc(HUNT.ageLabel(D.fetched_at))}, is shown` : esc(HUNT.ageLabel(D.fetched_at)); };
  el.innerHTML = distFold('detail', summary,
    list.map((it, i) => `<div class="dsec"><div class="row" style="align-items:center;gap:10px;padding:0"><div class="nm" style="min-width:0"><b>${esc(HUNT.distName(it._d))}</b><span>${distWords(it).join(' \u00b7 ')} \u00b7 ${when(it)}</span></div>${it.url ? `<a class="ghost" href="${esc(it.url)}" target="_blank" rel="noopener" style="flex:0 0 auto;padding:8px 12px" aria-label="Open ${esc(HUNT.distName(it._d))}'s page for ${esc(p.name)}">Open ${ext()}</a>` : ''}</div>${distHistory(it, tls[i])}</div>`).join('')
    + '<div class="note" style="margin-top:10px">What the distributor tells shops. It sells to stores, not to you.</div>'
    + (list.some((it, i) => tlNeedsNote(it, tls[i])) ? `<div class="note" style="margin-top:6px">${esc(TL_NOTE)}</div>` : ''));
}
function scrollToPanel(el) {
  if (!el || !el.getBoundingClientRect) return;
  const bar = document.querySelector('.modebar'), under = bar && bar.getBoundingClientRect ? bar.getBoundingClientRect().bottom : 0;
  window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + (window.scrollY || 0) - under - 12));
}
function openDetail(id, { dist = false } = {}) {
  const p = CAT.byId.get(id); if (!p) return;
  if (dist) DISTF.open.add('detail'); else DISTF.open.delete('detail');
  DISTF.hist.clear();   /* take 114: every history starts tucked away */
  dCur = p; const own = OWN.line(id);
  $('#dTarget').textContent = PF.name(OWN.target());
  dQty = own ? own.qty : 1; dCond = own ? own.condition : 'NM';
  const s = CAT.sets.get(p.set) || {};
  /* take 111: a sealed product -- not one of the DON!! cards filed as sealed, each a single card (SEALED.isDon) */
  const sealedP = SEALED.isGoods(p);
  $('#dName').innerHTML = esc(p.name) + (p.treat !== 'base'
    ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : '');
  /* take 99 (the look): a sealed product has no rarity and no number, and the line read "The Dominance of God · ·" */
  /* take 111 (the last look): a sealed product's line repeated its name when its set bears it (every starter
     deck), and its copy line said "Normal" under "Ungraded" -- a box has neither */
  const sub = sealedP ? (s.name && s.name !== p.name ? s.name : '') : [s.name, p.rarity, p.num, p.prov].filter(Boolean).join(' \u00b7 ');
  $('#dSub').textContent = sub; $('#dSub').hidden = !sub;
  $('#dFinish').textContent = sealedP ? sealedWord(p) : (p.sub || 'Normal');
  $('#dQtyH').textContent = sealedP ? 'Sealed' : 'Ungraded';
  $('#dWant').textContent = WANT.has(p.num) ? 'On your want list \u2014 remove' : 'Want this card';
  const setCode = (s.abbr || '').replace(/-/g, '').slice(0, 5);   /* take 112: a product has no number; its set's code, as on its row tile */
  $('#dArt').innerHTML = (sealedP ? `<div class="ph" style="font-family:var(--display);font-size:var(--fs-head)">${setCode ? `<span class="phl">${esc(setCode)}</span>` : ''}</div>` : `<div class="ph" style="font-size:var(--fs-cap)">${esc(p.num)}</div>`) + refArt(p, { size: 'large' });
  paintBack($('#dBack'), p);   /* take 109 (A42, C): the card’s own art and colours behind the top */
  $('#dArt').classList.toggle('product', sealedP);
  /* take 117 (the owner's word): three cells on every card, the same three -- the type, the cost (a Leader's life), the
     power -- and a dash where a card has none, so the row is one shape on every page; the counter and the colour are
     read off the card itself. A product or a DON!! card, which has none of the three, shows no row. */
  const hasCost = p.cost != null && p.cost !== '';
  const cells = p.type && (hasCost || p.power || p.life) ? [
    ['Type', esc(p.type), 'word'],
    p.type === 'Leader' ? ['Life', p.life ? esc(p.life) : '\u2014', ''] : ['Cost', hasCost ? esc(p.cost) : '\u2014', ''],
    ['Power', p.power ? Number(p.power).toLocaleString() : '\u2014', '']] : [];
  $('#dStats').innerHTML = cells.length ? `<div class="statbar">${cells.map(([k, v, c]) => `<div><span>${k}</span><b${c ? ` class="${c}"` : ''}>${v}</b></div>`).join('')}</div>` : '';
  /* The triangle is INSIDE the price text -- `.row .v span` is display:block
     and would put a separate span on its own line, which is exactly what
     happened at take 8 on tiles (landmine 8's fix) and again here at take 17. */
  const tri = p.d1a > 0.004 ? '<i class="up" style="font-style:normal">\u25b2</i> '
            : p.d1a < -0.004 ? '<i class="down" style="font-style:normal">\u25bc</i> ' : '';
  $('#dPrice').innerHTML = `${tri}${money(p.market)}<span>${deltaHtml(p, { tile: true })}</span>`;   /* take 111: the triangle once, on the price */
  $('#dQty').textContent = dQty;
  /* take 95 (A38 item 2): a sealed product has no condition -- the market
     price is a factory-sealed copy’s -- so the segment goes and the line says
     so; on a card the line names the condition, not an abbreviation. Take 110:
     the note under the segment went at the owner’s word; the gap is still said
     in More’s "What this app does not know", the trade screen and the bulk picker. */
  /* take 110 (polish): the condition's name never breaks in two (the look had "Near" over "Mint") */
  $('#dCond').innerHTML = sealedP ? 'No condition to record' : 'Condition · <span class="nw">' + esc(COND_NAMES[dCond] || dCond) + '</span>';
  $('#dCondSeg').hidden = sealedP;
  $('#dCondSeg').innerHTML = sealedP ? '' : CONDS.map(c =>
    `<button class="${c === dCond ? 'on' : ''}" data-cond="${c}" aria-pressed="${c === dCond}">${c}</button>`).join('');
  /* take 95 (A38 item 7): the stock alert where the owner looks -- the take-77 watch, from the sheet */
  $('#dStock').hidden = !sealedP;
  /* take 111: the want list is kept by number, so a printing with none (a product, a DON!! card) cannot be on it --
     WANT.has('') answered for every one of them; and a sealed product is not graded */
  $('#dWant').hidden = !p.num; $('#dGradedP').hidden = sealedP;
  $('#dStock').textContent = STOCK.has(id) ? 'Watching for stock — stop' : 'Alert me when in stock';
  /* take 96 (A38 item 4): where to buy -- every seller the app knows, the seller’s own page */
  $('#dBuy').hidden = !sealedP;
  $('#dBuyList').innerHTML = sealedP ? buySources(p).map(s => `<div class="row" style="align-items:center"><div class="nm" style="min-width:0"><b>${G(BUY_GLYPH[s.kind], 14)} ${esc(s.label)}</b><span>${esc(s.note)}${s.addr ? ' · ' + esc(s.addr) : ''}${s.mi != null ? ' · ~' + s.mi + ' mi' : ''}</span></div>
      <div class="v" style="flex:0 0 auto;display:flex;gap:6px"><a class="ghost" href="${esc(s.url)}" target="_blank" rel="noopener" style="padding:8px 12px" aria-label="${esc(s.label)}: open the seller\u2019s page for ${esc(p.name)}">Open ${ext()}</a>${s.phone ? `<a class="ghost" href="tel:${esc(s.phone)}" style="padding:8px 12px">Call</a>` : ''}</div></div>`).join('') : '';

  const graded = PF.scope(OWN.items).filter(i => i.id === id && i.graded);
  $('#dGradedList').innerHTML = graded.length ? graded.map(i =>
    `<div class="row"><div class="nm"><b>${esc(i.graded.grader)} ${esc(i.graded.grade)}</b>
      <span>${i.graded.cert ? 'Cert ' + esc(i.graded.cert) : 'no cert recorded'}</span></div>
     <div class="v mono">${money(p.market)}<span class="flat">ungraded price</span></div></div>`
  ).join('') : '<div class="note" style="margin:0">No graded copies recorded.</div>';

  const owned = dLine();
  $('#dPaid').textContent = owned && owned.paid ? money(owned.paid) : 'Set';
  $('#dSave').textContent = owned ? 'Save' : 'Add to collection';   /* take 111: on a copy you have, the button sets its count */

  /* PROTOCOL §10.2: show the spread, never a single number pretending to be a
     transaction. On EB03-024 (SP) that is $400.00 low against $467.33 market. */
  if (p.low && p.high && p.high > p.low) {
    const pos = ((p.market - p.low) / (p.high - p.low)) * 100;
    $('#dSpread').innerHTML =
      `<span class="mono">${money(p.low)}</span>
       <span class="spreadbar"><i style="left:${Math.max(0, Math.min(99, pos))}%"></i></span>
       <span class="mono">${money(p.high)}</span>`;
  } else $('#dSpread').innerHTML = '';

  $('#dProv').innerHTML =
    `${p.market != null ? `${money(p.market)} \u00b7 market` : 'No market price yet'} \u00b7 TCGplayer via TCGCSV \u00b7 as of ` +   /* take 120: it read "— \u00b7 market" */
    `<span style="white-space:nowrap">${esc(dayText(CAT.man.source_updated_at))}</span>.<br>` +
    `${p.low != null || p.high != null ? `Low ${money(p.low)} \u2013 high ${money(p.high)} that day. ` : ''}Market is an estimate, not a sale.` +   /* take 139: in fewer words (A45) */
    (p.d7p != null || p.d30p != null
      ? `<br>${p.d7p != null ? `7d ${signedPct(p.d7p, true)}` : ''}` +
        `${p.d7p != null && p.d30p != null ? ' \u00b7 ' : ''}` +
        `${p.d30p != null ? `30d ${signedPct(p.d30p, true)}` : ''}`
      : `<br>7-day and 30-day moves appear once ${
          (CAT.man.history_days || []).length} day${(CAT.man.history_days || []).length === 1 ? '' : 's'} ` +
        `of history becomes seven.`);

  /* take 111: every product without a number shares the empty one -- a sealed product's page listed ~700 of them */
  const sibs = p.num ? candidates(p.num, null) : [];
  $('#dSibsP').hidden = !sibs.length;
  $('#dSiblings').innerHTML = sibs.map(q => {
    const qs = CAT.sets.get(q.set) || {};
    return `<button class="row" style="width:100%;text-align:left;align-items:center" data-open="${q.id}">
      ${cardPic(q)}<div class="nm"><b>${esc(TREAT[q.treat] || q.treat)}${
        q.id === p.id ? ' \u2190 this one' : ''}</b>
      <span>${esc(qs.abbr || qs.name || '')}${q.prov ? ' \u00b7 ' + esc(q.prov) : ''}</span></div>
      <div class="v mono">${money(q.market)}</div></button>`;
  }).join('');
  paintDetailDist(p);
  go('detail');
  if (dist) scrollToPanel($('#dDist'));   /* take 112: a row's distributor line lands on what it opened */
}
/* take 98 (A39 item 7): a condition tap used to repaint the whole sheet through
   openDetail(), which reset dCond to the owned copy’s condition (or NM) -- so
   the tap did nothing and the page "refreshed". Now it updates in place: the
   segment, the line, the quantity and the cost basis of the copy in that
   condition. Save records the copy under the chosen condition. */
function setCond(c) {
  if (!dCur || !CONDS.includes(c)) return false;
  dCond = c;
  const owned = dLine();
  dQty = owned ? owned.qty : 1; $('#dQty').textContent = dQty;
  $('#dSave').textContent = owned ? 'Save' : 'Add to collection';
  $('#dCond').innerHTML = 'Condition · <span class="nw">' + esc(COND_NAMES[dCond] || dCond) + '</span>';
  $('#dCondSeg').innerHTML = CONDS.map(k => `<button class="${k === dCond ? 'on' : ''}" data-cond="${k}" aria-pressed="${k === dCond}">${k}</button>`).join('');
  $('#dPaid').textContent = owned && owned.paid ? money(owned.paid) : 'Set';
  return true;
}
CLICKS.on('[data-cond]', e => {
  const c = e.target.closest('[data-cond]'); if (!c) return;
  setCond(c.dataset.cond);
});
$('#dPlus').addEventListener('click', () => { dQty++; $('#dQty').textContent = dQty; });
$('#dMinus').addEventListener('click', () => { dQty = Math.max(1, dQty - 1); $('#dQty').textContent = dQty; });
$('#dSave').addEventListener('click', () => {
  if (!dCur) return;
  const ex = dLine();
  if (ex) ex.qty = dQty; else OWN.add(dCur.id, { qty: dQty, condition: dCond });
  commitOwn('detail'); toast('Saved'); go('collection');
});
$('#dAlert').addEventListener('click', async () => {
  if (!dCur) return;
  const dir = await PICKER.choose({ title: 'Alert when the price\u2026', key: 'aldir',
    why: `${esc(dCur.name)} is ${money(dCur.market)} today. Checked nightly with new prices; one notification, then it rests until you set it again.`,
    opts: `<button class="opt" data-aldir="below"><div class="oi"><b>Drops below</b><span>a buying price</span></div></button>
      <button class="opt" data-aldir="above"><div class="oi"><b>Rises above</b><span>a selling price</span></div></button>` });
  if (!dir) return;
  /* take 115 (SPEC-110-44): typed in the currency on screen and kept in US dollars, as the price filter is -- the
     placeholder showed "\u20ac11.36" under a note that said USD, and the figure typed was stored as dollars */
  const c = CUR.active();
  const v = await ask({ title: dir === 'below' ? 'Alert when below' : 'Alert when above', kind: 'number', placeholder: toShown(dCur.market), ok: 'Watch',
    why: `${c === 'USD' ? 'USD' : `${esc(curLabel(c))}, converted (\u2248); the alert is kept in US dollars`}. Market price, the same number the app shows everywhere.` });
  if (v == null || v === '') return;
  const at = fromShown(typedAmount(v)); if (!(at > 0)) return toast('Not a number');
  const perm = await PLATFORM.notifyPermission();
  ALERTS.add(dCur.id, dir, at);
  toast(perm === 'unknown' ? 'Watching \u2014 if no alert arrives, check the phone\u2019s notification settings for this app' : perm === 'denied' ? 'Watching \u2014 notifications are off, so it will show here instead' : `Watching ${dCur.name} ${dir} ${money(at)}`);
});
$('#dStock').addEventListener('click', () => {
  if (!dCur) return; const on = STOCK.toggle(dCur.id);
  if (on) { PLATFORM.notifyPermission().then(perm => toast(perm === 'unknown' ? 'Watching — if no alert arrives, check the phone\u2019s notification settings for this app' : perm === 'denied' ? 'Watching — notifications are off, so it will show here instead' : 'Watching for stock')); STOCK.check(); }
  else toast('Stopped watching');
  $('#dStock').textContent = on ? 'Watching for stock — stop' : 'Alert me when in stock';
});
$('#dWant').addEventListener('click', () => {
  if (!dCur) return; const on = WANT.toggle(dCur.num, dCur.id);
  $('#dWant').textContent = on ? 'On your want list \u2014 remove' : 'Want this card';
  toast(on ? `On your want list: ${dCur.name}` : `Off your want list: ${dCur.name}`);
});
$('#dPaid').addEventListener('click', async () => {
  if (!dCur) return;
  const it = dLine();
  /* take 137 (A43): typed in the currency on screen and kept in US dollars, as a price alert is (take 115). It asked
     for dollars and kept the figure as dollars whatever the currency, so a cost basis typed in euros read back
     converted; and the figure lost every character but digits and the point, so "11,36" became 1136. 0 clears it. */
  const c = CUR.active();
  const v = await ask({ title: 'What you paid', kind: 'number', ok: 'Save', placeholder: '0.00',
    why: `Per copy, ${c === 'USD' ? 'in USD' : `in ${esc(curLabel(c))}, converted (\u2248); it is kept in US dollars`}. Only you know this; it drives the Performance tab and nothing else.`,
    value: it && it.paid ? toShown(it.paid) : '' });
  if (v === null) return;
  const x = typedAmount(v);
  if (!(x >= 0)) return toast('Not a number');
  const n = x > 0 ? fromShown(x) : 0;
  if (it) { it.paid = n; commitOwn('detail', { snap: false }); }
  else { OWN.add(dCur.id, { qty: dQty, condition: dCond }).paid = n; commitOwn('detail'); }   /* take 111: in today's reading too */
  toast('Cost basis set to ' + money(n)); openDetail(dCur.id);
});

const GRADERS = ['PSA', 'BGS', 'CGC', 'TAG', 'SGC'];
$('#dAddGraded').addEventListener('click', async () => {
  if (!dCur) return;
  const g = await PICKER.choose({ title: 'Grader', key: 'grader',
    why: 'A slab is recorded, not scanned. The value shown stays the <b>ungraded</b> market price.',
    opts: GRADERS.map(x => `<button class="opt" data-grader="${x}"><div class="oi"><b>${x}</b></div></button>`).join('') });
  if (!g) return;
  const grade = await ask({ title: `${g} grade`, kind: 'number', placeholder: '10, 9.5, 9…', ok: 'Next' });
  if (!grade) return;
  const cert = (await ask({ title: 'Cert number', why: 'Optional. Printed on the slab.', placeholder: 'leave blank if none', ok: 'Save' })) || '';
  OWN.add(dCur.id, { qty: 1, condition: 'GRADED', graded: { grader: g, grade: String(grade).trim(), cert: cert.trim() } });
  commitOwn('graded'); toast('Graded copy recorded'); openDetail(dCur.id);
});

