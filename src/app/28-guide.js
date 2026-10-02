/* =====================================================================
 * THE FIRST-RUN GUIDE — A18, take 19. Modelled on APEX ORV’s A129.
 *
 * Shown once; the key is VERSIONED with the content, so a rewrite shows
 * itself again exactly when it becomes worth reading (APEX A147/A155).
 * Reachable afterwards from More → How it works. Every card is a fact the
 * app can back up today; when a capability changes, the card changes and
 * the version bumps. Pictures come from assets/user/ if the owner supplies them.
 * ===================================================================== */
const GUIDE_KEY = 'optcghub.guide.v3';   // v3: four pages, one per mode, in the listing's frame (take 116)
/* A page: its glyph (the picture's fallback), its title, one line, three or four words, and the printing whose
   picture it carries -- looked up when the guide opens, never a pinned id (AGENTS rule 3): Collect the dearest
   card with a picture, Prep & Play the Decks hero's Leader, Hunt the newest set's top card. */
const GUIDE = [
  { g: 'scancard', t: 'Collect', p: 'Scan a card and it is valued the day you add it.', l: ['Scan', 'Value', 'Back up'], pic: () => topCard() },
  { g: 'leader', t: 'Prep & Play', p: 'Build a deck against the official rules, then play it on one phone.', l: ['Decks', 'Cards', 'Play'], pic: () => (heroLeader() || {}).L || null },
  { g: 'box', t: 'Hunt', p: 'Sealed prices, what is in stock at stores near you, and the events and releases coming up.', l: ['Sealed', 'Local stock', 'Events', 'Releases'], pic: () => (newestTop() || {}).p || null },
  { g: 'scancard', t: 'Yours, offline', p: 'Everything works with no signal, and nothing you do is sent anywhere.', l: ['Export', 'Restore', 'No account'], pic: null }
];
/* the dearest card whose picture the runner saw serve: setTop's pass, once, then the top of every set */
function topCard() { setTop(null); let best = null; for (const p of SET_TOP.map.values()) if (!best || p.market > best.market) best = p; return best; }
let guidePage = 0, guideFrom = null, guideScrolling = false, guideScrollT = 0, guideSyncT = 0;
function guideCard(c, i) {
  const p = c.pic ? c.pic() : null;
  const pic = p && p.img ? `<div class="pic" style="background:linear-gradient(160deg,${artColours(p).join(',')})"><div class="ph"><span class="phl">${esc(p.name)}</span></div>${refArt(p, { size: 'large' })}</div>`
    : c.pic ? `<div class="pic"><div class="ph">${G(c.g, 64)}</div></div>`
    : `<div class="pic own"><div class="ph">${G(c.g, 64)}</div><img class="ref" loading="lazy" src="bundle/icon.svg" alt="" decoding="async" onload="this.classList.add('ok');var p=this.parentNode,q=p&&p.querySelector('.ph');if(q)q.style.display='none'" onerror="this.remove()"></div>`;
  return `<div class="gcard" role="group" aria-label="Page ${i + 1} of ${GUIDE.length}">
    <div class="gt"><small>OP TCG Hub \u00b7 ${i + 1} of ${GUIDE.length}</small><h2>${esc(c.t)}</h2><p>${esc(c.p)}</p></div>
    <div class="gpic${c.pic ? '' : ' gsq'}"><div class="print"></div><div class="card">${pic}</div></div>
    <div class="gverbs">${c.l.map(x => `<span>${esc(x)}</span>`).join('')}</div></div>`;
}
function guideOpen() {   // called with a click event from More's "Show the guide again": the argument is ignored
  const g = $('#tour'); if (!g) return;
  while (closeAnyOverlay()) {}   // a zip ask under the guide would take the first Back
  guideFrom = (typeof document !== 'undefined' && document.activeElement) || null;
  const cards = $('#tourCards'); if (cards) cards.innerHTML = GUIDE.map(guideCard).join('');
  guidePage = 0; g.hidden = false; g.classList.add('on'); guidePaint();
  if (typeof g.focus === 'function') { try { g.focus(); } catch (e) {} }   // the dialog itself: its name is read out, and no button wears a focus ring at first paint
}
/* the dots and the buttons for the page: what a swipe repaints too */
function guidePaintDots() {
  const n = GUIDE.length, last = guidePage === n - 1;
  const dots = $('#tourDots'); if (dots) dots.innerHTML = GUIDE.map((_, i) => `<i class="${i === guidePage ? 'on' : ''}"></i>`).join('');
  const pg = $('#tourPage'); if (pg) pg.textContent = `Page ${guidePage + 1} of ${n}`;
  for (const [id, show] of [['#tourSkip', !last], ['#tourNext', !last], ['#tourLook', last], ['#tourStart', last]]) { const b = $(id); if (b) b.hidden = !show; }
}
/* ...and the strip's place: the one caller that scrolls (a tap, a key, the open) */
function guidePaint() {
  guidePaintDots();
  const cards = $('#tourCards'); const el = cards && cards.children ? cards.children[guidePage] : null;
  if (!el || typeof cards.scrollTo !== 'function') return;
  guideScrolling = true; clearTimeout(guideScrollT); guideScrollT = setTimeout(() => { guideScrolling = false; }, 700);
  cards.scrollTo({ left: el.offsetLeft - 16, behavior: reducedMotion() ? 'auto' : 'smooth' });
}
function guideGo(n) { if (n < 0 || n >= GUIDE.length) return; guidePage = n; guidePaint(); }
function guideClose(mark) {
  const g = $('#tour'); if (!g) return;
  g.hidden = true; g.classList.remove('on');
  if (mark) { try { localStorage.setItem(GUIDE_KEY, '1'); } catch (e) {} }
  if (guideFrom && typeof guideFrom.focus === 'function') { try { guideFrom.focus(); } catch (e) {} } guideFrom = null;
}
/* the last page's button: into Collect's scanner, with Home under it so Back lands there */
function guideStart() { guideClose(true); if (MODE.cur !== 'collect') MODE.set('collect'); go('scan'); }
$('#tourNext').addEventListener('click', () => guideGo(guidePage + 1));
$('#tourSkip').addEventListener('click', () => guideClose(true));
$('#tourLook').addEventListener('click', () => guideClose(true));
$('#tourStart').addEventListener('click', guideStart);
$('#tour').addEventListener('keydown', e => { if (e.key === 'ArrowRight') guideGo(guidePage + 1); else if (e.key === 'ArrowLeft') guideGo(guidePage - 1); else if (e.key === 'Escape') guideClose(false); });
/* a swipe: read the page off the strip once it settles; never scroll from here (landmine 202) */
$('#tourCards').addEventListener('scroll', () => {
  clearTimeout(guideSyncT); guideSyncT = setTimeout(() => {
    if (guideScrolling) return; const c = $('#tourCards'); const first = c && c.children ? c.children[0] : null; if (!first) return;
    const pg = Math.round(c.scrollLeft / (first.offsetWidth + 16));   // the card plus the strip's gap
    if (pg !== guidePage && pg >= 0 && pg < GUIDE.length) { guidePage = pg; guidePaintDots(); } }, 100);
});

/* One input sheet, three shapes. Replaces the last six prompt()s (take 21);
   the gate’s ratchet is at zero and stays there. Returns a Promise so the
   call sites read like the prompt() they replace. */
function ask({ title, why = '', kind = 'text', value = '', placeholder = '', ok = 'OK', rows = 6 }) {
  return new Promise(resolve => {
    $('#askTitle').textContent = title; $('#askWhy').innerHTML = why; $('#askOk').textContent = ok;
    $('#askField').innerHTML = kind === 'multiline'
      ? `<textarea id="askIn" aria-labelledby="askTitle" rows="${rows}" placeholder="${esc(placeholder)}"
           style="width:100%;padding:10px;font:16px/1.45 ui-monospace,monospace;resize:vertical">${esc(value)}</textarea>`
      : `<div class="search" style="margin:0"><input id="askIn" aria-labelledby="askTitle" type="text"
           inputmode="${kind === 'number' ? 'decimal' : 'text'}" placeholder="${esc(placeholder)}" value="${esc(value)}"></div>`;
    const done = v => { $('#askSheet').classList.remove('on'); cleanup(); resolve(v); };
    const onOk = () => done(($('#askIn').value || '').trim());
    const onCancel = () => done(null);
    const onKey = e => { if (e.key === 'Enter' && kind !== 'multiline') { e.preventDefault(); onOk(); } if (e.key === 'Escape') onCancel(); };
    function cleanup() { $('#askOk').removeEventListener('click', onOk); $('#askCancel').removeEventListener('click', onCancel);
                         document.removeEventListener('keydown', onKey); }
    $('#askOk').addEventListener('click', onOk); $('#askCancel').addEventListener('click', onCancel);
    document.addEventListener('keydown', onKey);
    $('#askSheet').classList.add('on');
    setTimeout(() => { const i = $('#askIn'); if (i) { i.focus(); if (kind !== 'multiline') i.select(); } }, 60);
  });
}

