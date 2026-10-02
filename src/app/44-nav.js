/* ---- navigation -------------------------------------------------------- */
/* Take 81. The phone’s back button goes back a screen, not out of the app:
   go() keeps a stack, the hardware button pops it (App plugin, native) and
   the browser’s own Back does the same on the web through history state. */
const NAV = { stack: [], silent: false,
  back() {
    if (this.stack.length < 2) {   /* take 105 (landmine 140): the only screen is not the mode’s home -> home, handled; from home itself -> unhandled, and only there the app may leave */
      const home = MODE.home[MODE.cur] || 'home'; const top = this.stack[this.stack.length - 1] || ([...document.querySelectorAll('.screen.on')].map(e => e.id)[0]);
      if (!top || top === home) return false;
      this.silent = true; go(home); this.silent = false; this.stack = [home]; return true;
    }
    this.stack.pop(); let prev = this.stack[this.stack.length - 1];
    const isScreen = i => { const el = i && document.getElementById(i); return !!el && String(el.tagName).toUpperCase() === 'SECTION'; };
    while (prev && !isScreen(prev) && this.stack.length > 1) { this.stack.pop(); prev = this.stack[this.stack.length - 1]; }
    if (!prev) return false; this.silent = true; go(prev); this.silent = false; return true; } };
/* Take 86. The owner met the blank page again after closing a product with
   Back, and the take-83 guard did not fire -- so the path is not go(). This
   watches the DOM instead of the code: after any navigation, back press or
   overlay close, if no screen is on, the mode’s home is put back and the
   screen stack, the overlays and the trigger are recorded for Diagnostics.
   It heals the symptom and names the cause. */
function screenWatchdog(trigger) {
  setTimeout(() => { const on = document.querySelector('.screen.on'); if (on) return;
    const overlays = ['#askSheet', '#picker', '#filters', '#leaderPick', '#printPick', '#rulesSheet', '#simSheet', '#detail', '#tour', '#simCurtain', '#splash'].filter(id => { const el = $(id); return el && el.classList && el.classList.contains('on'); });
    ERRS.push('blank', `no screen on after ${trigger}; stack ${NAV.stack.join('>') || '-'}; overlays ${overlays.join(',') || 'none'}; mode ${MODE.cur}`, 'watchdog');
    NAV.silent = true; go(MODE.home[MODE.cur] || 'home'); NAV.silent = false; }, 60);
}
function closeAnyOverlay() {
  const ask = $('#askSheet'); if (ask && ask.classList.contains('on')) { $('#askCancel').click(); return true; }   // resolves the pending ask() with null, cleanly
  /* take 98 (landmine 137): #detail is a SCREEN since take 83 -- go('detail')
     pushes it on the stack -- and closing it here returned before NAV.back()
     ran, so every Back from a card’s sheet left no screen on and the watchdog
     put Home back. An overlay list holds overlays only. */
  /* take 107: Back left the filter, Leader and printing sheets open while the
     screen under them changed (PROVEN in Chrome: the filter sheet over Home,
     the Leader sheet over Decks). They are overlays; Back closes them first. */
  for (const id of ['#picker', '#filters', '#leaderPick', '#printPick', '#rulesSheet', '#simSheet', '#tour', '#simCurtain']) { const el = $(id); if (el && el.classList.contains('on')) { if (id === '#picker') PICKER.dismiss(); else if (id === '#tour') guideClose(false); else el.classList.remove('on'); return true; } }   // take 115: a prompt on the picker answers no; take 116: the guide is an overlay by class; Back closes it unseen (landmine 201)
  return false;
}
/* take 107: the header’s back arrow is the phone’s Back, not a second route.
   In the app it runs the back button’s own path and never leaves the app; in
   a browser it asks the browser, so its history and the screen stack stay one. */
function backArrow() {
  const APP = PLATFORM.plugin('App');
  if (APP && APP.addListener) { try { if (closeAnyOverlay()) return; NAV.back(); } finally { screenWatchdog('back arrow'); } return; }
  if (NAV.stack.length > 1) { history.back(); return; }
  try { NAV.back(); } finally { screenWatchdog('back arrow'); }
}
/* take 107: a sheet’s close button does what Back does to that sheet -- the
   prompt answers no (its promise resolves), every other sheet closes. */
function closeSheet(id) {
  if (id === 'askSheet') { $('#askCancel').click(); return; }
  if (id === 'picker') { PICKER.dismiss(); return; }   // take 115: so does a prompt on the picker
  const el = document.getElementById(id); if (el) el.classList.remove('on');
}
function go(id) {
  /* Take 83. A screen id that matches nothing left every screen off and the
     nav unlit -- the owner’s blank page after Back. Refuse it: fall back to
     the mode’s home, and record the id so the diagnostics name the cause. */
  const isScreen = i => { const el = i && document.getElementById(i); return !!el && String(el.tagName).toUpperCase() === 'SECTION'; };   // every screen is a <section>
  if (!isScreen(id)) {
    ERRS.push('nav', `go() called with no screen for '${id}'`, 'go'); id = MODE.home[MODE.cur] || 'home';
    if (!document.getElementById(id)) return;
  }
  if (!NAV.silent) { if (NAV.stack[NAV.stack.length - 1] !== id) { NAV.stack.push(id); if (NAV.stack.length > 30) NAV.stack.shift(); } try { history.pushState({ id }, '', '#' + id); } catch (e) {} }
  if (id !== 'scan') stopCamera();
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.go === id || (id === 'search' && b.dataset.go === 'cards')));
  window.scrollTo(0, 0);
  ({ home: paintHome, collection: paintCollection, search: paintSearch,
     scan: paintScan, settings: paintSettings, decks: paintDecks, deck: paintDeck,
     trade: paintTrade, play: paintPlay, sim: paintSim, cards: paintCards,
     /* decks paints both lists */
     checklist: paintChecklist, wants: () => { paintWants(); paintAlerts(); }, binder: paintBinder,
     sealed: () => { paintSealed(); if (!HUNT.zip && !NAV.zipAsked) { NAV.zipAsked = true; askZip().then(ok => { if (ok) paintSealed(); }); }
       if (navigator.onLine && HUNT.url() && (!HUNT.feed || HUNT.stale(HUNT.feed.fetched_at))) HUNT.sync({ quiet: true }).then(async ok => { if (ok) { await HUNT.syncHistory(); await LOCAL.syncShops(); await STOCK.check(); paintSealed(); } }); }, releases: paintReleases,
     local: () => { paintLocal(); if (navigator.onLine && HUNT.url()) { const jobs = []; if (!LOCAL.stores || HUNT.ageMin(LOCAL.stores.fetched_at) > 24 * 60) jobs.push(LOCAL.syncStores()); if (!LOCAL.shops || HUNT.stale(LOCAL.shops.fetched_at)) jobs.push(LOCAL.syncShops()); if (jobs.length) Promise.all(jobs).then(r => { if (r.some(Boolean)) paintLocal(); }); } },
     diag: () => { const out = $('#diagOut'); if (out && !out.textContent) out.textContent = 'Tap Run.'; paintDevEarn(); },
     events: () => { paintEvents(); if (navigator.onLine && HUNT.url()) { const jobs = []; if (!LOCAL.stores || HUNT.ageMin(LOCAL.stores.fetched_at) > 24 * 60) jobs.push(LOCAL.syncStores()); if (!EVENTS.tab || HUNT.ageMin(EVENTS.tab.fetched_at) > 24 * 60) jobs.push(EVENTS.sync()); if (jobs.length) Promise.all(jobs).then(r => { if (r.some(Boolean)) paintEvents(); }); } } })[id]?.();
}
CLICKS.on('[data-go],[data-rules],[data-back],[data-close]', e => {
  const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go);
  const rb = e.target.closest('[data-rules]'); if (rb) openRules(rb.dataset.rules);
  if (e.target.closest('[data-back]')) backArrow();
  const x = e.target.closest('[data-close]'); if (x) closeSheet(x.dataset.close);
});
function toast(msg, ms = 1900) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), ms);
}

/* ---- portfolio switcher ------------------------------------------------- */
$('#pfSwitch').addEventListener('click', () => {
  const count = id => OWN.items.filter(i => (i.pf || 'main') === id).length;
  const val = id => OWN.items.filter(i => (i.pf || 'main') === id).reduce((a, i) => a + (price(i.id) || 0) * i.qty, 0);
  $('#pkTitle').textContent = 'Collections';
  $('#pkWhy').innerHTML = 'A collection is a binder, a trade pile, deck stock \u2014 any pile you value separately. Scans go into the one you have open.';
  $('#pkOpts').innerHTML = PF.list.map(p => `<button class="opt${PF.active === p.id ? ' best' : ''}" data-pf="${p.id}">
      <div class="oi"><b>${esc(p.name)}</b><span>${count(p.id)} line${count(p.id) === 1 ? '' : 's'}</span></div>
      <div class="op mono">${money(val(p.id))}</div></button>`).join('') +
    `<button class="opt${PF.active === 'all' ? ' best' : ''}" data-pf="all">
      <div class="oi"><b>All collections</b><span>everything, in one view</span></div>
      <div class="op mono">${money(OWN.total(true))}</div></button>
     <button class="opt" data-pf="__new"><div class="oi"><b>+ New collection</b><span>name it</span></div></button>` +
    (PF.active !== 'main' && PF.active !== 'all'
      ? `<button class="opt" data-pf="__rename"><div class="oi"><b>Rename \u201c${esc(PF.name(PF.active))}\u201d</b></div></button>
         <button class="opt" data-pf="__delete"><div class="oi"><b style="color:var(--down)">Delete \u201c${esc(PF.name(PF.active))}\u201d</b><span>its lines move to ${esc(PF.name('main'))}, nothing is lost</span></div></button>` : '');
  $('#picker').classList.add('on');
});
CLICKS.on('[data-pf]', e => {
  const b = e.target.closest('[data-pf]'); if (!b) return;
  const id = b.dataset.pf;
  if (id === '__new' || id === '__rename') {
    const renaming = id === '__rename';
    $('#pkTitle').textContent = renaming ? 'Rename collection' : 'New collection';
    $('#pkWhy').innerHTML = renaming ? 'The name only. Its lines stay where they are.' : 'A binder, a trade pile, deck stock — any pile you value separately.';
    $('#pkOpts').innerHTML = `<div class="search" style="margin:0 0 10px"><input id="pfNameIn" aria-label="Collection name" placeholder="Name" value="${renaming ? esc(PF.name(PF.active)) : ''}" maxlength="40"></div>
      <button class="opt best" data-pfname="${renaming ? 'rename' : 'new'}"><div class="oi"><b>${renaming ? 'Rename' : 'Create'}</b></div></button>`;
    setTimeout(() => { const i = $('#pfNameIn'); if (i) { i.focus(); i.select(); } }, 50);
    return;
  }
  else if (id === '__delete') { if (confirm(`Delete \u201c${PF.name(PF.active)}\u201d? Its lines move to ${PF.name('main')}.`)) PF.remove(PF.active); }
  else { PF.active = id; PF.save(); }
  $('#picker').classList.remove('on'); OWN.snapshot(); paintHome();
});
CLICKS.on('[data-pfname]', e => {
  const b = e.target.closest('[data-pfname]'); if (!b) return;
  const nm = ($('#pfNameIn').value || '').trim(); if (!nm) return toast('Give it a name');
  if (b.dataset.pfname === 'new') PF.add(nm); else PF.rename(PF.active, nm);
  $('#picker').classList.remove('on'); OWN.snapshot(); paintHome(); toast(b.dataset.pfname === 'new' ? `Opened ${nm}` : `Renamed to ${nm}`);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'pfNameIn') { const b = $('[data-pfname]'); if (b) b.click(); }
});

