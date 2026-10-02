/* =====================================================================
 * PORTFOLIOS — take 18. Screenshot 3 of the brief: "Portfolio One Piece".
 *
 * A portfolio is a NAME on each collection line. One is active; Home,
 * Collection and Most Valuable scope to it; "All" is a view across every
 * portfolio, not a portfolio itself. Items carry `pf`, and lines that predate
 * this take carry none and belong to the default. Moving a line between
 * portfolios is a Bulk Action. Nothing about the catalogue changes.
 * ===================================================================== */
const PF = {
  list: readJson('vault.pfs', [{ id: 'main', name: 'One Piece' }]),
  active: localStorage.getItem('vault.pf') || 'main',      // 'all' is the cross-view
  save() { saveJson('vault.pfs', this.list); saveJson('vault.pf', this.active); },
  name(id) { return (this.list.find(p => p.id === id) || {}).name || 'One Piece'; },
  scope(items) { return this.active === 'all' ? items : items.filter(i => (i.pf || 'main') === this.active); },
  add(name) { const id = 'pf' + Date.now(); this.list.push({ id, name }); this.active = id; this.save(); return id; },
  rename(id, name) { const p = this.list.find(x => x.id === id); if (p) { p.name = name; this.save(); } },
  remove(id) {
    if (id === 'main' || this.list.length < 2) return false;
    OWN.items.forEach(i => { if ((i.pf || 'main') === id) i.pf = 'main'; });   // never lose a line
    this.list = this.list.filter(p => p.id !== id); if (this.active === id) this.active = 'main';
    this.save(); commitOwn('collections'); return true;
  }
};

/* ---- the collection: the user’s, and never touched by a catalogue sync -- */
const OWN = {
  items: readJson('vault.items', []),
  snaps: readJson('vault.snaps', []),
  lastBackup: readJson('vault.lastBackup', null, false),
  save() {
    const a = saveJson('vault.items', this.items), b = saveJson('vault.snaps', this.snaps);
    return a && b;
  },
  /* Landmine 16: a duplicate increments, it does not insert. Take 111: a slab never merges -- each graded
     copy is a line of its own with its own grade and cert (a second slab of a printing was counted into the
     first and wrote its grade over the first one's), and an ungraded copy never lands on a slab's line. */
  /* take 115 (STAN-111-15): the collection a copy goes to and the line it counts into -- the printing, its
     condition, that collection, never a slab -- decided here only (the card page wrote it out twice more) */
  target(pf = null) { return pf || (PF.active === 'all' ? 'main' : PF.active); },
  line(id, cond = null, pf = null) { const t = this.target(pf); return this.items.find(i => i.id === id && (cond == null || i.condition === cond) && (i.pf || 'main') === t && !i.graded); },
  /* save = false: the caller writes vault.items once and knows whether it was stored (take 115: moveIn) */
  add(productId, { qty = 1, condition = 'NM', photo = null, pf = null, graded = null, save = true } = {}) {
    const target = this.target(pf);
    const hit = graded ? null : this.line(productId, condition, target);
    if (hit) { hit.qty += qty; }
    else this.items.push({ id: productId, qty, condition, photo, pf: target, game: 'optcg',
                           added: new Date().toISOString(), fav: false, ...(graded ? { graded } : {}) });
    if (save) this.save(); return hit || this.items[this.items.length - 1];
  },
  /* take 115 (self-review): rows that leave the batch or the pending tray go into the collection here, in one
     write, and the caller clears them from where they waited only when that write returned true. A full
     storage refuses the longer collection but lets the shorter batch through, so clearing first lost the
     cards on the next launch; now the collection in memory goes back to what is stored and the rows wait. */
  moveIn(rows) {
    if (!rows.length) return true;
    const before = this.items.map(i => ({ ...i }));
    rows.forEach(r => this.add(r.id, { condition: 'NM', photo: r.photo || null, save: false }));
    if (saveJson('vault.items', this.items)) return true;
    this.items = before; return false;
  },
  total(all = false) { return (all ? this.items : PF.scope(this.items)).reduce((s, i) => s + (price(i.id) || 0) * i.qty, 0); },
  /* A snapshot series, not a reconstruction (AGENDA A10): if you sell half the
     collection the chart must show that, and a per-card replay cannot. */
  snapshot() {
    const day = new Date().toISOString().slice(0, 10);
    const n = this.items.reduce((a, i) => a + i.qty, 0);
    const last = this.snaps[this.snaps.length - 1];
    if (last && last[0] === day) { last[1] = this.total(); last[2] = n; }
    else this.snaps.push([day, this.total(), n]);
    this.save();
  },
  cost() { return this.items.reduce((s, i) => s + (i.paid || 0) * i.qty, 0); }
};
/* The MAX range (take 87): behind a rewarded ad, unlocked for a day, at the
   owner’s word. Where there is no ad plugin -- the browser, a dev build --
   there is nothing to watch and MAX simply opens. */
const MAXLOCK = {
  until: +(localStorage.getItem('vault.maxUntil') || 0),
  open() { return !PLATFORM.plugin('AdMob') || !CAT.man.ads || Date.now() < this.until; },
  grant() { this.until = Date.now() + 24 * 3600e3; saveJson('vault.maxUntil', String(this.until)); },
  async ask() { const v = await PICKER.choose({ title: 'All-time history', key: 'maxad',
      why: 'Watch one short ad and the MAX range is open for a day. The other ranges stay free.',
      opts: `<button class="opt" data-maxad="go"><div class="oi"><b>Watch an ad</b><span>about 30 seconds</span></div></button><button class="opt" data-maxad="no"><div class="oi"><b>Not now</b></div></button>` });
    if (v !== 'go') return; const shown = await ADS.show('max'); if (!shown) toast('No ad right now \u2014 try again in a moment'); }
};
/* take 128 (the owner's question): when a newer version is on Google Play the app says so, once per version. The source
   is Play itself (PLATFORM.appUpdateInfo); the Pages manifest's take was ruled out -- it is the merged take, which the
   owner uploads to Play by hand, so it would announce an update Play does not have (PROTOCOL §10). Asked once per launch,
   online, after the first-open guide and the consent message are out of the way; a version answered with Later is not
   asked about again, and About keeps the note. */
const UPDATE = {
  KEY: 'vault.updateSeen', info: null, why: 'not asked yet',
  async check() {
    if (!navigator.onLine) { this.info = null; this.why = 'offline'; return null; }
    try { const r = await PLATFORM.appUpdateInfo(); this.info = r || null; this.why = r ? '' : 'this build has no update plugin'; }
    catch (e) { this.info = null; this.why = String((e && e.message) || e); }
    return this.info;
  },
  newer() { const r = this.info; return r && r.updateAvailability === 2 ? String(r.availableVersionCode || '?') : null; },
  /* for About and Diagnostics: what Play said, in the app's words (the version code is the take, ci/apk.sh) */
  note() { const n = this.newer(); if (n) return `Take ${n} is on Google Play \u2014 you have take ${TAKE}`;
    const a = this.info && this.info.updateAvailability;
    if (a === 1) return 'Up to date on Google Play'; if (a === 3) return 'An update is being installed';
    return this.info ? 'Google Play gave no answer' : `Could not ask Google Play \u2014 ${this.why}`; },
  seen() { try { return localStorage.getItem(this.KEY) || ''; } catch (e) { return ''; } },
  async offer(choose = o => PICKER.choose(o)) {
    const n = this.newer(); if (!n || this.seen() === n) return false;
    saveJson(this.KEY, n);   /* once per version, whatever is chosen: Later is an answer too */
    const v = await choose({ title: 'A newer version is on Google Play', key: 'upd', why: `Take ${esc(n)} is out; this is take ${TAKE}. Updating keeps your collection and your decks.`,
      opts: `<button class="opt" data-upd="go"><div class="oi"><b>Update</b><span>opens Google Play</span></div></button><button class="opt" data-upd="no"><div class="oi"><b>Later</b><span>About, under More, keeps the note</span></div></button>` });
    if (v === 'go') await PLATFORM.openStore();
    return true;
  },
  /* never over the first-open guide, Google's consent message or a sheet the collector is answering (the printing picker
     shares the sheet, and a new prompt dismisses the one open) -- asked once all three are out of the way */
  busy() { const on = id => { const e = document.getElementById(id); return !!(e && !e.hidden && e.classList.contains('on')); }; return on('tour') || on('picker') || (ADS_ENABLED && PLATFORM._consent == null); },
  async ask() { await this.check(); this.lastAt = Date.now(); await this.offer(); const el = document.getElementById('aboutUpd'); if (el) el.textContent = this.note(); },
  checkWhenFree(delay = 3000) {
    const tick = async () => { if (this.busy()) { setTimeout(tick, 1000); return; } await this.ask(); };
    setTimeout(tick, delay);
  },
  /* the check is the app's, not the collector's (the owner, take 128: "they shouldn't have to check for updates manually"):
     at every launch, when the app comes back to the front six hours or more after the last check, and every six hours while
     it stays open. "Check for updates" under About is the way to ask sooner. A version answered with Later is still offered
     once only; About keeps the note. */
  EVERY: 6 * 3600e3, lastAt: 0,
  due() { return Date.now() - this.lastAt >= this.EVERY; },
  resume() { if (this.due() && navigator.onLine) this.checkWhenFree(500); },
  watch() {
    this.checkWhenFree();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.resume(); });
    const hourly = () => { this.resume(); setTimeout(hourly, 3600e3); }; setTimeout(hourly, 3600e3);   /* a chain of timeouts: the stub has no setInterval */
  }
};
const price = id => { const p = CAT.byId.get(id); return p ? p.market : null; };

/* Take 109 (A42): the largest picture TCGplayer serves -- `_in_1000x1000`, 600x838
   and up (MEASURED) -- made from the printing’s own stored URL, never from a card
   number (AGENTS rule 3), and only when this build’s runner saw that size served
   (manifest.images.large); otherwise the thumbnail. A second-host URL keeps its own. */
const LARGE = { from: /_200w\.jpg$/, to: '_in_1000x1000.jpg' };
function largeOk() {
  const L = ((CAT.man || {}).images || {}).large;
  return !!(L && L.probed > 0 && L.served >= 0.9 * L.probed && L.w >= 400);
}
function artUrl(p, size = 'thumb') {
  const u = (p && p.img) || '';
  return size === 'large' && u && LARGE.from.test(u) && largeOk() ? u.replace(LARGE.from, LARGE.to) : u;
}
/* Reference art for a card the collector has not scanned. Hot-linked, memory
   cache only, loading="lazy", and it fails silently to the text placeholder --
   the airplane-mode invariant (PROTOCOL §8) does not depend on it. A large
   picture that fails drops to the thumbnail; a thumbnail that fails is removed
   and the box under it stays. (Take 109: the old retry to `<id>.jpg` never
   served -- 403 for 241 of 241 ids, landmine 150.) */
function refArt(p, { size = 'thumb', cls = '' } = {}) {
  if (!p.img) return '';
  const src = artUrl(p, size);
  /* The placeholder is absolutely positioned and therefore stacks ABOVE the
     image; hide it on load rather than fight z-index. */
  return `<img class="ref${cls ? ' ' + cls : ''}" loading="lazy" decoding="async" src="${esc(src)}" alt=""${src !== p.img ? ` data-thumb="${esc(p.img)}"` : ''}
            onload="this.classList.add('ok');var p=this.parentNode,q=p&&p.querySelector('.ph');if(q)q.style.display='none'"
            onerror="var t=this.dataset.thumb;if(t){delete this.dataset.thumb;this.src=t}else{this.remove()}">`;
}
/* take 128 (the owner's note): which picture a scanned line shows -- the collector's own photo, or the catalogue's when
   the line says so (pic: 'ref'; absent otherwise, so an older backup's line reads as before). One rule for every place a
   line's photo is drawn: the collection tile and the binder's pocket. `fallback` stands under the catalogue's picture
   while it loads (the tile's name box); the photo needs none. */
function lineShowsPhoto(i) { return !!(i && i.photo && i.pic !== 'ref'); }
function linePic(i, p, fallback = '') { return lineShowsPhoto(i) ? `<img src="${esc(i.photo)}" alt="">` : fallback + refArt(p); }
/* The card’s own colours for the art’s ground: both of a two-colour card, the one
   and a darker shade of it for a single colour; a product has none, so the mode’s. */
function artColours(p) {
  const cs = gameColours(p);
  if (!cs.length) return ['var(--brass2)', 'var(--card2)'];
  const a = `var(--c-${CCLASS[cs[0]]})`;
  return [a, cs[1] ? `var(--c-${CCLASS[cs[1]]})` : `color-mix(in srgb,${a} 45%,var(--bg))`];
}
/* C’s backdrop, into a box that already exists (a card’s own page) or as a new one
   (a hero): the colours, then the blurred thumbnail cut above the stamp. */
function paintBack(el, p) {
  if (!el) return; const [a1, a2] = artColours(p);
  el.style.cssText = `--a1:${a1};--a2:${a2}`;   /* the box’s only inline style */
  el.innerHTML = p && p.img ? `<img class="above${artOk(p.img)}" alt="" loading="lazy" decoding="async" src="${esc(p.img)}" onload="${ART_ONLOAD}" onerror="this.remove()">` : '';   /* take 115: lazy, as the record says of every CDN picture (STAN-109-7) */
}
/* take 110's review: a repaint -- a keystroke in Sealed's search, a tap on the Play counter -- rebuilt every
   art picture at opacity 0 and faded it in again, so the art blinked. A picture that loaded once is drawn at once. */
window.ART_OK = window.ART_OK || new Set();
const artOk = src => (window.ART_OK.has(src) ? ' ok' : '');
const ART_ONLOAD = "this.classList.add('ok');window.ART_OK.add(this.getAttribute('src'))";
function artBack(p, { crisp = false } = {}) {
  const [a1, a2] = artColours(p), src = crisp ? artUrl(p, 'large') : p.img;
  /* take 110: crisp (A’s banner, a set’s strip) is the large picture, dropping to the thumbnail if it fails */
  return `<div class="artbg${crisp ? ' crisp' : ''}" aria-hidden="true" style="--a1:${a1};--a2:${a2}">${p.img ? `<img class="above${artOk(src)}" alt="" loading="lazy" decoding="async" src="${esc(src)}"${src !== p.img ? ` data-thumb="${esc(p.img)}"` : ''} onload="${ART_ONLOAD}" onerror="var t=this.dataset.thumb;if(t){delete this.dataset.thumb;this.src=t}else{this.remove()}">` : ''}</div>`;
}
/* The owner’s own picture in a hero’s place (assets/user, copied into the build; the owner’s
   choice and exposure -- the folder’s README). Uncut: it is not a card. */
const ownPic = name => (CAT.man.user || []).includes(name);
function ownBack(name) {
  const src = `bundle/user/${esc(name)}`;
  return `<div class="artbg crisp" aria-hidden="true"><img class="own${artOk(src)}" alt="" decoding="async" src="${src}" onload="${ART_ONLOAD}" onerror="this.remove()"></div>`;
}
/* Take 110: each set’s top card -- the most valuable card whose picture the runner fetched (a hash
   is a picture that served), by printing id -- found in one pass and kept until the catalogue changes. */
let SET_TOP = { rows: null, map: new Map() };
function setTop(setId) {
  if (SET_TOP.rows !== CAT.rows) {
    const map = new Map();
    for (const p of CAT.rows) if (!p.sealed && p.hash && p.market > 0 && p.img) { const t = map.get(p.set); if (!t || p.market > t.market) map.set(p.set, p); }
    SET_TOP = { rows: CAT.rows, map };
  }
  return SET_TOP.map.get(setId) || null;
}
/* the newest booster set out (kind main) with a card picture; any kind if none */
function newestTop(today = new Date().toISOString().slice(0, 10)) {
  const sets = [...CAT.sets.values()].filter(s => s.pub && s.pub <= today).sort((a, b) => b.pub.localeCompare(a.pub));
  for (const pool of [sets.filter(s => s.kind === 'main'), sets]) for (const s of pool) { const p = setTop(s.id); if (p) return { p, set: s }; }
  return null;
}
/* the slider’s fade steps aside while a screen with art is at the top */
const atTop = () => { const r = document.documentElement; if (r && r.classList) r.classList.toggle('at-top', (window.scrollY || 0) < 8); };
addEventListener('scroll', atTop, { passive: true }); atTop();
const CCLASS = { Red: 'red', Green: 'green', Blue: 'blue', Purple: 'purple', Black: 'black', Yellow: 'yellow' };
/* take 115 (STAN-109-8): a card's colours, split once -- as the catalogue writes them (colsOf, for the rules), and
   the six the game draws (gameColours: every dot, bar, ground and cover) */
const colsOf = p => String((p && p.color) || '').split(/[;/,]/).map(x => x.trim()).filter(Boolean);
const gameColours = p => colsOf(p).filter(x => CCLASS[x]);
/* Colour as a chip, for the detail hero and the deck builder: one dot per
   colour, named, so a dual-colour card reads as "Green Red" not as a gradient. */
function colourDots(p) {
  const cs = gameColours(p);
  if (!cs.length) return '';
  return `<span class="chip" style="padding:4px 9px;font-size:var(--fs-cap)">${cs.map(c =>
    `<i style="display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;
       vertical-align:-1px;background:var(--c-${CCLASS[c]})"></i>${esc(c)}`).join(' ')}</span>`;
}
function colourBar(p) {
  const cs = gameColours(p);
  return cs.length ? cs.map(c => `<i style="background:var(--c-${CCLASS[c]})"></i>`).join('')
                   : `<i style="background:var(--line)"></i>`;
}

/* Set completion. Falls straight out of the catalogue and the reference app
   charges for the analytics panel it lives beside. Sealed product is excluded
   because it carries no card number (landmine 9). */
function setProgress() {
  /* take 111 (the last look): a printing with no number -- a sealed product, a DON!! card -- counted as a held
     number ("1 of 17 numbers" for a starter deck still in its wrapper), under a note that says sealed product
     is left out; and the value took every collection's copies where the count took the one on screen */
  const scope = PF.scope(OWN.items).filter(i => { const p = CAT.byId.get(i.id); return p && p.num; });
  const owned = new Map();
  for (const i of scope) {
    const p = CAT.byId.get(i.id);
    if (!owned.has(p.set)) owned.set(p.set, new Set());
    owned.get(p.set).add(p.num);
  }
  const totals = new Map();
  for (const p of CAT.rows) {
    if (!p.num) continue;
    if (!totals.has(p.set)) totals.set(p.set, new Set());
    totals.get(p.set).add(p.num);
  }
  return [...owned.entries()].map(([sid, have]) => {
    const s = CAT.sets.get(sid) || {};
    const all = totals.get(sid) || new Set();
    const val = scope.filter(i => CAT.byId.get(i.id).set === sid)
      .reduce((a, i) => a + (price(i.id) || 0) * i.qty, 0);
    return { s, have: have.size, all: all.size, val };
  }).sort((a, b) => b.val - a.val);
}

