/* ---- home -------------------------------------------------------------- */
const RANGES = ['1D', '7D', '1M', '3M', '6M', 'MAX'];
let range = '1M';
function paintHome() {
  const tot = OWN.total();
  const src = CAT.man.source_updated_at ? new Date(CAT.man.source_updated_at.slice(0, 10)) : null;
  const ageDays = src ? Math.floor((Date.now() - src.getTime()) / 864e5) : null;
  const sb = $('#staleBanner');
  if (ageDays != null && ageDays >= 3) {
    sb.hidden = false;
    sb.innerHTML = `Prices are <b>${ageDays} days old</b> (${esc(dayText(CAT.man.source_updated_at))}). ` +
      (CAT.man.updateUrl ? `Every figure here is from that day. <b>More \u2192 Sync now</b> when you are online.`
                        : `Every figure here is from that day. Update the app for newer prices.`);
  } else sb.hidden = true;
  const cph = $('#curPillHome'); if (cph) cph.innerHTML = curPill();
  $('#pfName').textContent = PF.active === 'all' ? 'All collections' : PF.name(PF.active);
  $('#pfTotal').textContent = money(tot);
  const days = { '1D': 1, '7D': 7, '1M': 30, '3M': 90, '6M': 180, MAX: 1e4 }[range];
  const S = seriesFor(days), series = S.pts;
  const d = series.length > 1 ? tot - series[0][1] : 0;
  const dl = $('#pfDelta');
  dl.className = 'delta mono ' + (d > 0.005 ? 'up' : d < -0.005 ? 'down' : 'flat');
  dl.innerHTML = series.length > 1
    ? `${signedMoney(d)} ${RANGE_WORDS[range] || 'in the last ' + range}` +
      (S.kind === 'estimate'
        ? ` <span class="flat" style="font-weight:500;font-size:var(--fs-sm)">\u00b7 estimated from today\u2019s cards at each day\u2019s prices</span>`
        : '')
    : 'Not enough history yet — a snapshot is taken each day.';

  $('#ranges').innerHTML = RANGES.map(r =>
    `<button class="range${r === range ? ' on' : ''}" data-r="${r}" aria-pressed="${r === range}">${r}${
      r === 'MAX' && !MAXLOCK.open() ? '<span class="free">AD</span>' : ''}</button>`).join('');
  spark(series, S.kind);

  const top = PF.scope(OWN.items).slice()
    .map(i => ({ i, p: CAT.byId.get(i.id) })).filter(x => x.p)
    .sort((a, b) => (b.p.market || 0) * b.i.qty - (a.p.market || 0) * a.i.qty).slice(0, 6);
  /* take 118: the hero is a card on the dearest printing's own art (the owner's home-bg.jpg, when it exists, instead) */
  const hero = $('#hero'), heroArt = (CAT.man.user || []).includes('home-bg.jpg') ? 'bundle/user/home-bg.jpg' : top.length && top[0].p.img ? artUrl(top[0].p, 'large') : '';
  if (hero && hero.style && typeof hero.style.cssText === 'string') hero.style.cssText = hero.style.cssText.replace(/--hero-art:[^;]*;?/, '') + (heroArt ? `;--hero-art:url("${heroArt}")` : '');   // the DOM stub has no style text
  else if (hero && hero.style) hero.style.cssText = heroArt ? `--hero-art:url("${heroArt}")` : '';
  /* take 118: Most valuable is a shelf of the dearest cards -- the picture, the value, the name (with its printing's word
     and the count); a tap opens the card as the rows did (take 98) */
  $('#topList').innerHTML = top.length ? `<div class="shelf">${top.map(({ i, p }) => `
    <button class="st" data-open="${p.id}" aria-label="${esc(p.name)}, ${money((p.market || 0) * i.qty)}"><div class="pic"><div class="ph"><span class="phl">${esc(p.name)}</span></div>${refArt(p, { size: 'large' })}${p.treat !== 'base' ? `<span class="badge tag">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</div>
      <div class="v mono">${money((p.market || 0) * i.qty)}</div>
      <div class="nm">${esc(p.name)}${i.qty > 1 ? ' \u00b7 \u00d7' + i.qty : ''}</div>
      <div class="nm sub"><span>${SEALED.isGoods(p) ? dotJoin(esc(sealedWord(p)), esc((CAT.sets.get(p.set) || {}).abbr || '')) : dotJoin(esc(i.condition), esc(p.num))}</span></div></button>`).join('')}</div>`
    : '<div class="note">Scan a card and it will show up here.</div>';

  const prog = setProgress();
  $('#setDone').innerHTML = prog.length ? prog.slice(0, 8).map(x => {
    const pct = x.all ? 100 * x.have / x.all : 0;   /* take 115: through pctNum, like every percentage -- 1 of 592 read "0%", 590 of 592 "100%" */
    return `<button class="row" style="width:100%;text-align:left;align-items:center" data-checklist="${x.s.id}">${setPic(x.s)}<div class="nm">
        <b>${esc(x.s.name || '?')}</b>
        <span>${x.have} of ${x.all} numbers \u00b7 ${pctNum(pct)}</span>
        <span class="spreadbar" style="display:block;margin-top:6px;height:4px">
          <i style="left:0;width:${pct.toFixed(1)}%;height:4px;top:0;border-radius:3px"></i></span>
      </div><div class="v mono">${money(x.val)}</div></button>`;
  }).join('') : '<div class="note">Add a card and its set shows up here.</div>';

  paintPerf();

  const m = CAT.man;
  $('#srcNote').innerHTML =
    `Prices from <b>TCGplayer</b>, via <b>TCGCSV</b>, updated ${esc(dayText(m.source_updated_at))}.<br>` +   /* take 139: the source and its day, then the count (A45) */
    `${(m.cards || 0).toLocaleString()} cards across ${setsWithCards()} sets.<br><br>` +   /* take 115: the sets the cards are in, not every group the source lists (87 with an empty one and a sealed-only one) */
    `A market price is an estimate, not a sale.<br><br>` +
    `Not affiliated with, endorsed by or sponsored by Bandai, Shueisha, Toei, ` +
    `Viz Media or TCGplayer.`;
}
/* Performance = what you PAID against what it is worth. The reference app puts
   this behind a subscription. It needs a cost basis, which only the collector
   can supply, so the panel asks rather than inventing one. */
/* Take 64. Overview was a hard-coded `on` span with no handler: it never
   turned off and could not be clicked, so Performance lit up beside a tab
   that was permanently lit. They are a PAIR -- exactly one is on, and the
   one that is on decides what the page shows. */
let perfOn = false;
const HOME_OVERVIEW = ['hero', 'setComp', 'srcPanel'];   // whatsNew has its own hidden flag. Take 110's review: 'setPanel' is Search's -- Set completion stayed on Performance and Search's set list went
function setHomeTab(perf) {
  perfOn = !!perf;
  $('#tabPerf').classList.toggle('on', perfOn);
  $('#tabOver').classList.toggle('on', !perfOn);
  $('#tabPerf').setAttribute('aria-selected', String(perfOn));
  $('#tabOver').setAttribute('aria-selected', String(!perfOn));
  $('#tabPerf').setAttribute('tabindex', perfOn ? '0' : '-1');   // take 107: one tab stop for the pair, the selected one
  $('#tabOver').setAttribute('tabindex', perfOn ? '-1' : '0');
  $('#perfPanel').style.display = perfOn ? 'block' : 'none';
  $('#home').classList.toggle('perf', perfOn);   /* the open Fold: Most valuable takes the line alone */
  for (const id of HOME_OVERVIEW) { const el = $('#' + id); if (el) el.style.display = perfOn ? 'none' : ''; }
  if (perfOn) paintPerf(); else paintHome();
}
$('#tabPerf').addEventListener('click', () => setHomeTab(true));
$('#tabOver').addEventListener('click', () => setHomeTab(false));
for (const id of ['#tabOver', '#tabPerf']) $(id).addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHomeTab(id === '#tabPerf'); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); const perf = id === '#tabOver'; setHomeTab(perf); $(perf ? '#tabPerf' : '#tabOver').focus(); } });
function paintPerf() {
  if (!perfOn) return;
  const withCost = OWN.items.filter(i => i.paid > 0);
  const cost = OWN.cost(), val = OWN.total();
  const rows = OWN.items.map(i => ({ i, p: CAT.byId.get(i.id) })).filter(x => x.p)
    .map(x => ({ ...x, gain: ((x.p.market || 0) - (x.i.paid || 0)) * x.i.qty }))
    .sort((a, b) => b.gain - a.gain);
  const gain = val - cost;
  $('#perfBody').innerHTML = `
    <div class="row"><div class="nm"><b>Paid</b>
      <span>${withCost.length} of ${OWN.items.length} lines have a cost recorded</span></div>
      <div class="v mono">${money(cost)}</div></div>
    <div class="row"><div class="nm"><b>Worth now</b>
      <span>TCGplayer market, ${esc(dayText(CAT.man.source_updated_at))}</span></div>
      <div class="v mono">${money(val)}</div></div>
    <div class="row"><div class="nm"><b>Difference</b>
      <span>${withCost.length < OWN.items.length
        ? 'Incomplete — lines with no cost count as $0 paid' : 'All lines have a cost'}</span></div>
      <div class="v mono ${gain >= 0 ? 'up' : 'down'}">${signedMoney(gain)}</div></div>
    ${rows.slice(0, 5).map(x => `<div class="row"><div class="nm">
        <b>${esc(x.p.name)}</b><span>${esc(TREAT[x.p.treat] || x.p.treat)} \u00b7 paid ${
          money(x.i.paid || 0)}</span></div>
      <div class="v mono ${x.gain >= 0 ? 'up' : 'down'}">${signedMoney(x.gain)}</div></div>`).join('')}
    <div class="note">A cost basis is something only you know. Set it on any card
      under <b>What you paid</b>; until then that line counts as $0 paid and this
      number flatters you.</div>`;
}

/* Two series, and the chart says which it is drawing.
   RECORD: the collection’s own nightly snapshots (A10) -- what it was worth
   on the days the app was open. ESTIMATE: today’s holdings valued against the
   catalogue’s daily prices for every day on file -- what these cards would
   have been worth, had you held them then. The estimate fills the chart on a
   fresh install; the record takes over as it accrues, and purchases are
   marked on it. Never blended without saying so (PROTOCOL §10). */
function seriesFor(days) {
  const cutoff = Date.now() - days * 864e5;
  const rec = OWN.snaps.filter(([d]) => new Date(d).getTime() >= cutoff);
  if (rec.length >= 3) return { kind: 'record', pts: rec };
  const est = estimateSeries(days);
  if (est.length >= 2) return { kind: 'estimate', pts: est };
  return { kind: 'record', pts: OWN.snaps.slice(-2) };
}
function estimateSeries(days) {
  if (!CAT.days.length) return [];
  const cutoff = Date.now() - days * 864e5;
  const items = PF.scope(OWN.items);
  const out = [];
  CAT.days.forEach((d, di) => {
    if (new Date(d).getTime() < cutoff) return;
    let tot = 0, count = 0, any = false;
    for (const i of items) {
      /* A card contributes only from the day it entered the collection (take
         21). `added` is an ISO stamp; a line without one is assumed held all
         along. Before that day the card was not yours and its price is not
         your history -- this is what makes the estimate an estimate of YOUR
         collection rather than of a basket. */
      if (i.added && i.added.slice(0, 10) > d) continue;
      const h = CAT.hist[i.id]; const m = h && h[di];
      if (m != null) { tot += m * i.qty; count += i.qty; any = true; }
    }
    if (any) out.push([d, tot, count]);
  });
  return out;
}
function spark(series, kind = 'record') {
  const c = $('#spark'), dpr = devicePixelRatio || 1;
  const w = c.clientWidth, h = 150;
  c.width = w * dpr; c.height = h * dpr;
  const x = c.getContext('2d'); x.scale(dpr, dpr); x.clearRect(0, 0, w, h);
  /* Day one has exactly one snapshot. Drawing nothing but a caption is what
     render.mjs caught at take 3: every function ran and the canvas stayed
     empty. Draw the one point honestly -- a flat line at today’s value, said
     to be one reading -- rather than pretending to a trend or drawing air. */
  if (series.length < 2) {
    const v = series.length ? series[0][1] : 0;
    x.strokeStyle = TOK('--line', '#26394B'); x.lineWidth = 2; x.setLineDash([5, 5]);
    x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
    x.setLineDash([]);
    x.fillStyle = TOK('--brass', '#F2C14E'); x.beginPath();
    x.arc(w - 10, h / 2, 4.5, 0, 7); x.fill();
    x.fillStyle = TOK('--dim', '#A08E70'); x.font = '12.5px system-ui'; x.textAlign = 'center';
    x.fillText('One reading so far \u2014 ' + money(v) + '.',   /* take 110: the line above says when the next one comes */
               w / 2, h / 2 - 16);
    return;
  }
  const vs = series.map(s => s[1]);
  const lo = Math.min(...vs), hi = Math.max(...vs), pad = (hi - lo) * .15 || 1;
  const px = i => i / (series.length - 1) * w;
  const py = v => h - 8 - (v - lo + pad) / (hi - lo + pad * 2) * (h - 16);
  const g = x.createLinearGradient(0, 0, 0, h);
  const acc = TOK('--brass', '#F2C14E'); g.addColorStop(0, rgbaOf(acc, .28)); g.addColorStop(1, rgbaOf(acc, 0));
  x.beginPath(); x.moveTo(0, py(vs[0]));
  vs.forEach((v, i) => x.lineTo(px(i), py(v)));
  x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fillStyle = g; x.fill();
  x.beginPath(); x.moveTo(0, py(vs[0]));
  vs.forEach((v, i) => x.lineTo(px(i), py(v)));
  x.strokeStyle = acc; x.lineWidth = 2.2; x.lineJoin = 'round';
  if (kind === 'estimate') x.setLineDash([6, 5]);       // an estimate is drawn dashed
  x.stroke(); x.setLineDash([]);

  /* PROTOCOL §10. A portfolio line conflates two different things: prices
     moving, and the collector buying. A jump that was a purchase must not read
     as a market spike, so days where the card count changed get a tick. */
  for (let i = 1; i < series.length; i++) {
    if ((series[i][2] ?? 0) !== (series[i - 1][2] ?? 0)) {
      x.fillStyle = '#f5c518'; x.beginPath();
      x.arc(px(i), py(vs[i]), 3, 0, 7); x.fill();
    }
  }
}
CLICKS.on('[data-r]', e => {
  const r = e.target.closest('[data-r]');
  if (r) { if (r.dataset.r === 'MAX' && !MAXLOCK.open()) { MAXLOCK.ask(); return; } range = r.dataset.r; paintHome(); }
});

