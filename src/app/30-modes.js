/* =====================================================================
 * MODES — A22, take 24. Collect and Prep & Play. One data set, two faces.
 * The palette follows data-mode on the document root; the nav swaps; the
 * mode persists. Screens that belong to both (search, card detail) simply
 * show in whichever face is on.
 * ===================================================================== */
const MODE = {
  cur: localStorage.getItem('vault.mode') || 'collect',
  home: { collect: 'home', play: 'decks', hunt: 'sealed' },
  navFor: { collect: '#navCollect', play: '#navPlay', hunt: '#navHunt' },
  set(m, navigate = true) {
    this.cur = m; saveJson('vault.mode', m);
    const root = document.documentElement; if (root && root.dataset) root.dataset.mode = m;
    $('#modeSlider').classList.toggle('play', m === 'play'); $('#modeSlider').classList.toggle('hunt', m === 'hunt');
    /* take 115: the slider is a tablist, and a tab says which one is selected (A4 found it missing) */
    $$('#modeSlider button').forEach(b => { const on = b.dataset.mode === m; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    $('#navCollect').hidden = m !== 'collect'; $('#navPlay').hidden = m !== 'play'; $('#navHunt').hidden = m !== 'hunt';
    if (navigate) go(this.home[m]);
  }
};
/* Take 120: the theme (the owner: "do what you recommend for light mode, make it off by default, but add a switcher
   somewhere, like under settings"). A second axis on the root beside data-mode: data-theme is dark unless More >
   Appearance says light, or Auto, which follows the phone's dark mode through matchMedia and turns with it. Stored
   beside the mode. Dark is the default and the app's own look; light keeps three grounds. The status bar's icons are
   told through the StatusBar plugin at boot and on every switch: they followed the phone's night mode alone, and a
   light app on a dark phone would draw a white clock on parchment. The root is set here, before the first paint;
   the bars wait for boot (PLATFORM is declared below this line). */
const THEME = {
  cur: (v => v === 'light' || v === 'system' ? v : 'dark')(localStorage.getItem('vault.theme')),
  _mq: null,
  mq() {
    if (!this._mq) { try { if (typeof matchMedia === 'function') { this._mq = matchMedia('(prefers-color-scheme: dark)'); const on = () => { if (THEME.cur === 'system') THEME.apply(); };
      if (this._mq.addEventListener) this._mq.addEventListener('change', on); else if (this._mq.addListener) this._mq.addListener(on); } } catch (e) { this._mq = null; } }
    return this._mq;
  },
  applied() { if (this.cur !== 'system') return this.cur; const m = this.mq(); return m && !m.matches ? 'light' : 'dark'; },   /* no way to ask the phone: dark, the default, never a guess at light */
  apply(bars = true) {
    const t = this.applied(), root = document.documentElement; if (root && root.dataset) root.dataset.theme = t;
    $$('#themeSeg button').forEach(b => { const on = b.dataset.theme === this.cur; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    if (bars) PLATFORM.statusBar(t);
    return t;
  },
  set(v) { this.cur = v === 'light' || v === 'system' ? v : 'dark'; saveJson('vault.theme', this.cur); return this.apply(); }
};
THEME.apply(false);
function themeSegClick(e) { const b = e.target.closest('#themeSeg [data-theme]'); if (!b) return; THEME.set(b.dataset.theme); }
CLICKS.on('#themeSeg [data-theme]', themeSegClick);
/* Take 119: the slide (the owner: "animations between modes like a swipe"; take 110's crossfade before it). On a tap or a
   swipe only -- MODE.set itself stays instant for the guide, Back and the harness. The screen leaving is kept painted
   under the one arriving: fixed where it was (its top read before the switch), its palette's tokens copied onto it so the
   new palette does not repaint it mid-slide, and taken out when its animation ends (a timer catches a stub without one). */
const MODE_ORDER = ['collect', 'play', 'hunt'];
const MODE_TOKENS = ['--bg', '--card', '--card2', '--line', '--fg', '--dim', '--dim2', '--brass', '--brass2', '--gold', '--accent-ink', '--line-strong', '--up', '--down', '--accent-bg', '--warn-bg', '--ok-bg', '--bad-bg', '--on-accent', '--teal'];
function finishSlide() { const o = MODE._out; if (!o) return; MODE._out = null; if (o.classList) o.classList.remove('out'); if (o.style) o.style.cssText = ''; }
function slideMode(to) {
  const root = document.documentElement, from = MODE.cur;
  if (!root || !root.classList || to === from) { MODE.set(to); return; }
  const leaving = $('.screen.on'), toLeft = MODE_ORDER.indexOf(to) < MODE_ORDER.indexOf(from);
  let outTop = 0, toks = '';
  if (leaving && leaving.getBoundingClientRect && typeof getComputedStyle === 'function') {
    outTop = Math.round(leaving.getBoundingClientRect().top); const cs = getComputedStyle(root);
    toks = MODE_TOKENS.map(t => `${t}:${cs.getPropertyValue(t).trim()}`).join(';');
  }
  finishSlide();
  root.classList.remove('mode-swap', 'swap-l'); void root.offsetWidth; root.classList.add('mode-swap'); root.classList.toggle('swap-l', toLeft);
  MODE.set(to);
  if (leaving && leaving.style && leaving.classList && !leaving.classList.contains('on') && !reducedMotion()) {
    leaving.style.cssText = `--out-top:${outTop}px;background:var(--bg);${toks}`; leaving.classList.add('out'); MODE._out = leaving;
    if (leaving.addEventListener) leaving.addEventListener('animationend', finishSlide, { once: true });
  }
  clearTimeout(MODE._swap); MODE._swap = setTimeout(() => { root.classList.remove('mode-swap', 'swap-l'); finishSlide(); }, 400);
}
$('#modeSlider').addEventListener('click', e => {
  if (MODE._swiped) return;   /* the click a swipe leaves behind */
  const b = e.target.closest('[data-mode]'); if (!b || b.dataset.mode === MODE.cur) return;
  slideMode(b.dataset.mode);
});
/* a sideways swipe on the mode bar -- only there; the actions row, the chips and the guide's strip scroll sideways --
   moves one mode over in the finger's direction, the knob under the finger meanwhile, and the slide follows */
(() => {
  const bar = $('.modebar'), knob = $('#modeSlider .knob'); if (!bar || !bar.addEventListener || !knob || !knob.style) return;
  let sw = null;
  bar.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; sw = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, w: knob.getBoundingClientRect ? knob.getBoundingClientRect().width : 0, held: false }; });
  bar.addEventListener('pointermove', e => {
    if (!sw || e.pointerId !== sw.id) return; sw.dx = e.clientX - sw.x; const dy = e.clientY - sw.y;
    if (!sw.held) {   /* the first 8 px say which way the finger goes: up or down is the page's scroll, not a swipe */
      if (Math.hypot(sw.dx, dy) < 8) return;
      if (Math.abs(dy) > Math.abs(sw.dx)) { sw = null; return; }
      sw.held = true; try { bar.setPointerCapture(e.pointerId); } catch (x) {}
    }
    const i = MODE_ORDER.indexOf(MODE.cur), lim = sw.w + 2, d = Math.max(i === 0 ? 0 : -lim, Math.min(i === 2 ? 0 : lim, sw.dx));
    knob.style.transition = 'none'; knob.style.transform = `translateX(calc(${i * 100}% + ${i * 2 + Math.round(d)}px))`;
  });
  const end = e => {
    if (!sw || e.pointerId !== sw.id) return; const dx = sw.dx, held = sw.held; sw = null; knob.style.transition = ''; knob.style.transform = '';
    if (!held || Math.abs(dx) < 40) return;
    const i = MODE_ORDER.indexOf(MODE.cur), j = i + (dx < 0 ? 1 : -1); if (j < 0 || j >= MODE_ORDER.length) return;
    MODE._swiped = true; setTimeout(() => { MODE._swiped = false; }, 350); slideMode(MODE_ORDER[j]);
  };
  bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
})();

