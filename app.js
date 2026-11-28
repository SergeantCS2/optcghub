
'use strict';
const TAKE = 180;

const NET = { count: 0, ebay: 0, hosts: new Set(), WAIT: 60e3, WAIT_BIG: 240e3 };
const _fetch = window.fetch.bind(window);
window.fetch = (u, o) => {
  try { NET.hosts.add(new URL(u, location.href).host); } catch (e) {}

  const opt = Object.assign({}, o), wait = opt.wait || NET.WAIT, side = !!opt.ebay; delete opt.wait; delete opt.ebay;
  if (side) NET.ebay++; else NET.count++;
  paintNet();
  let ac = null; try { if (!opt.signal && typeof AbortController === 'function') { ac = new AbortController(); opt.signal = ac.signal; } } catch (e) {}
  const late = new Promise((_, no) => setTimeout(() => {
    const err = new Error(`no answer in ${Math.round(wait / 1000)} s`); err.name = 'TimeoutError';
    if (ac) { try { ac.abort(err); } catch (e) {} }
    no(err);
  }, wait));
  return Promise.race([_fetch(u, opt), late]);
};
function paintNet() {
  const d = $('#netdot'), l = $('#netlbl');
  if (!d) return;
  d.className = 'dot' + (NET.count > CAT.expectedFetches ? ' warn' : '');
  l.textContent = [NET.count ? `${NET.count} request${NET.count > 1 ? 's' : ''}` : NET.ebay ? '' : 'Offline OK', NET.ebay ? `eBay ${NET.ebay}` : ''].filter(Boolean).join(' · ');
}

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const SPLASH_T0 = Date.now();
function splashDone() { const sp = $('#splash'); if (!sp || sp.classList.contains('off')) return; const wait = Math.max(0, 1600 - (Date.now() - SPLASH_T0)); setTimeout(() => { sp.classList.add('off'); setTimeout(() => sp.remove(), 400); }, wait); }
setTimeout(splashDone, 3500);

const ERRS = { KEY: 'vault.errs', list: [],
  load() { try { const l = JSON.parse(localStorage.getItem(this.KEY) || '[]'); return Array.isArray(l) ? l.slice(0, 20) : []; } catch (e) { return []; } },
  push(kind, msg, where) {
    this.list.unshift({ t: new Date().toISOString(), kind, msg: String(msg).slice(0, 200), where: String(where || '').slice(0, 120) }); this.list = this.list.slice(0, 20);
    try { localStorage.setItem(this.KEY, JSON.stringify(this.list)); } catch (e) {} } };
ERRS.list = ERRS.load();
window.addEventListener('error', e => ERRS.push('error', e.message, (e.filename || '') + ':' + (e.lineno || '')));
window.addEventListener('unhandledrejection', e => ERRS.push('rejection', (e.reason && (e.reason.message || e.reason)) || 'unknown'));

const CLICKS = {
  table: [], n: 0, last: [],
  on(sel, fn) {
    const sels = String(sel).split(',').map(s => s.trim()).filter(Boolean);
    if (!sels.length || typeof fn !== 'function') throw new Error('CLICKS.on: a selector and a handler');
    this.table.push({ sel: sels, fn }); return fn;
  },

  hit(t, row) {
    if (!t) return null;
    const has = typeof t.closest === 'function';
    for (const s of row.sel) {
      const m = has && t.closest(s); if (m) return m;
      if (s[0] === '#' && t.id === s.slice(1)) return t;
    }
    return null;
  },
  fire(e) {
    const t = e && e.target; const ran = []; let first = null;
    for (const row of this.table) {
      const m = this.hit(t, row); if (!m) continue;
      ran.push(row.sel.join(','));
      try { row.fn(e, m); } catch (err) { if (!first) first = err; }
    }
    this.n++; this.last = ran;
    if (first) throw first;
    return ran.length;
  }
};
document.addEventListener('click', e => CLICKS.fire(e));

const STORE = { unreadable: [], failed: new Set(), holdBackup: false, _w: null,
  warn() { if (this._w) return; this._w = setTimeout(() => { this._w = null; toast('Could not save on this phone \u2014 export your collection now (Export CSV)', 6000); }, 0); } };

const HELD = { 'vault.items': 'collection', 'vault.snaps': 'value history', 'vault.decks': 'decks', 'vault.pfs': 'collections',
  'vault.credits': 'waiting cards', 'vault.wants': 'wants', 'vault.alerts': 'price alerts', 'vault.stockAlerts': 'stock alerts',
  'vault.relAlerts': 'release reminders', 'vault.hunt.notes': 'Hunt notes', 'vault.trade.give': 'trade lists', 'vault.trade.get': 'trade lists',
  'vault.batch': 'waiting scans', 'vault.trades': 'trades' };
function heldKeys() {
  let h = null; try { h = JSON.parse(localStorage.getItem('vault.backupHold') || 'null'); } catch (e) {}
  const had = h && Array.isArray(h.keys) ? h.keys : [];
  return Object.keys(HELD).filter(k => STORE.unreadable.includes(k) || had.includes(k));
}
function heldWhat() {
  const n = [...new Set(heldKeys().map(k => HELD[k]))];
  return !n.length ? 'data' : n.length === 1 ? n[0] : n.length === 2 ? n.join(' and ') : `${n[0]} and ${n.length - 1} other lists`;
}
const kindOf = x => Array.isArray(x) ? 'list' : x === null ? 'null' : typeof x;
function readJson(key, fallback, keep = true) {
  let raw = null;
  try { raw = localStorage.getItem(key); } catch (e) { ERRS.push('storage', `${key} could not be read: ${e.message || e}`, 'readJson'); return fallback; }
  if (raw == null) return fallback;
  let v, why = '';
  try { v = JSON.parse(raw); } catch (e) { why = 'not JSON'; }
  const want = fallback === null ? 'object' : kindOf(fallback);
  const word = k => k === 'object' ? 'record' : k;
  if (!why && v !== null && kindOf(v) !== want) why = `a ${word(kindOf(v))}, not a ${word(want)}`;
  if (!why) return v === null ? fallback : v;
  STORE.unreadable.push(key);
  let kept = false; if (keep) { try { localStorage.setItem(key + '.unreadable', raw); kept = true; } catch (e) {} }
  if (key in HELD) { STORE.holdBackup = true; try { localStorage.setItem('vault.backupHold', JSON.stringify({ at: new Date().toISOString(), keys: heldKeys() })); } catch (e) {} }
  ERRS.push('storage', `${key} was unreadable (${why}); started from the default` + (keep ? (kept ? `, the text kept as ${key}.unreadable` : ', and the text could not be kept') : '') + (key in HELD ? '; the last backup is kept until a restore' : ''), 'readJson');
  return fallback;
}

function readText(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : v; }
  catch (e) { ERRS.push('storage', `${key} could not be read: ${e.message || e}`, 'readText'); return fallback; }
}
function saveJson(key, value) {
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); STORE.failed.delete(key); return true; }
  catch (e) {
    if (!STORE.failed.has(key)) ERRS.push('storage', `${key} was not saved: ${e && e.name ? e.name + ': ' : ''}${(e && e.message) || e}`, 'saveJson');
    STORE.failed.add(key); STORE.warn(); return false;
  }
}

const CUR = {
  code: localStorage.getItem('vault.currency') || 'USD',
  list: [['USD', '$', 'US Dollar'], ['CAD', 'CA$', 'Canadian Dollar'], ['EUR', '€', 'Euro'], ['GBP', '£', 'British Pound'], ['AUD', 'A$', 'Australian Dollar'], ['JPY', '¥', 'Japanese Yen'], ['MXN', 'MX$', 'Mexican Peso'], ['CHF', 'CHF ', 'Swiss Franc']],
  rates() { return (typeof CAT !== 'undefined' && CAT.man && CAT.man.rates) || null; },
  rate(code) { if (code === 'USD') return 1; const r = this.rates(); return r && r.rates && r.rates[code] > 0 ? r.rates[code] : null; },
  set(code) { if (!this.rate(code)) code = 'USD'; this.code = code; saveJson('vault.currency', code); },

  sym() { const a = this.active(); return (this.list.find(c => c[0] === a) || this.list[0])[1]; },
  active() { return this.rate(this.code) ? this.code : 'USD'; }
};
const money = n => { if (n == null) return '—'; const code = CUR.active(); const r = CUR.rate(code) || 1;
  const v = n * r; const jp = code === 'JPY';
  return (code === 'USD' ? '' : '\u2248') + CUR.sym() + v.toLocaleString('en-US', { minimumFractionDigits: jp ? 0 : 2, maximumFractionDigits: jp ? 0 : 2 }); };

const dotJoin = (...parts) => parts.filter(x => x != null && x !== '').join(' \u00b7 ');
const moneyUSD = n => (n == null ? '—' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

const signedMoney = n => { const m = money(Math.abs(n)), sg = n >= 0 ? '+' : '\u2212'; return m.startsWith('\u2248') ? '\u2248' + sg + m.slice(1) : sg + m; };
const pctNum = p => { const a = Math.abs(p), r = Math.round(a * 10) / 10; return r >= 100 ? Math.round(a) + '%' : r.toFixed(1) + '%'; };

const signedPct = (p, plus = false) => { const t = pctNum(p); return (t === '0.0%' ? '' : p < 0 ? '\u2212' : plus ? '+' : '') + t; };

const curRate = () => CUR.rate(CUR.active()) || 1;
const fromShown = v => { const x = parseFloat(v); return x > 0 ? x / curRate() : null; };
const toShown = usd => (usd == null ? '' : String(+(usd * curRate()).toFixed(2)));

const typedAmount = v => { const t = String(v == null ? '' : v).trim().replace(/\s/g, '');
  const u = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t) ? t.replace(/,/g, '') : /^\d*,\d{1,2}$/.test(t) ? t.replace(',', '.') : t;
  return /^(\d+\.?\d*|\.\d+)$/.test(u) ? parseFloat(u) : NaN; };

const dayText = (iso, { year = false } = {}) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); if (!m) return iso || '?';
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year || +m[1] !== new Date().getFullYear() ? { year: 'numeric' } : {}) }); };
const momentText = iso => { const d = new Date(iso || ''); if (!iso || isNaN(d)) return iso || '?';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}), hour: 'numeric', minute: '2-digit' }); };
const localDay = iso => { const d = new Date(iso || ''); return isNaN(d) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const phoneToday = () => localDay(new Date().toISOString());
const RANGE_WORDS = { '1D': 'in the last day', '7D': 'in the last 7 days', '1M': 'in the last month', '3M': 'in the last 3 months', '6M': 'in the last 6 months', MAX: 'since the first day on file' };

const PICKER = {
  settle: null,
  choose({ title, why, opts, key, outside = false }) {
    this.dismiss();
    return new Promise(res => {
      $('#pkTitle').textContent = title; $('#pkWhy').innerHTML = why; $('#pkOpts').innerHTML = opts;
      const h = ev => { if (this.settle !== settle) return;
        const b = ev.target.closest(`[data-${key}]`);
        if (!b) { if (outside && !ev.target.closest('#picker .opt')) this.dismiss(); return; }
        ev.stopPropagation(); settle(b.dataset[key]); };
      const settle = v => { if (this.settle === settle) this.settle = null; document.removeEventListener('click', h, true); $('#picker').classList.remove('on'); res(v); };
      this.settle = settle;
      if (outside) setTimeout(() => { if (this.settle === settle) document.addEventListener('click', h, true); }, 0);
      else document.addEventListener('click', h, true);
      $('#picker').classList.add('on');
    });
  },
  dismiss() { const s = this.settle; this.settle = null; $('#picker').classList.remove('on'); if (s) s(null); return !!s; }
};
async function pickCurrency() {
  const R = CUR.rates(); const opts = CUR.list.map(([c, sym, name]) => { const ok = c === 'USD' || !!(R && R.rates && R.rates[c]); return { c, sym, name, ok }; });
  const v = await PICKER.choose({ title: 'Show prices in\u2026', key: 'cur', outside: true,
    why: `Prices are US dollars from TCGplayer. Another currency is a conversion at the ECB reference rate${R && R.date ? ' of ' + esc(dayText(R.date)) : ''}, marked \u2248 \u2014 an estimate, not a quote.${R && R.stale ? ' <b>' + esc(R.stale) + '</b>' : ''}${!R ? ' <b>No rates in this build \u2014 USD only.</b>' : ''}`,
    opts: opts.map(o => `<button class="opt" data-cur="${o.c}" ${o.ok ? '' : 'disabled'} aria-pressed="${CUR.active() === o.c}"><div class="oi"><b>${esc(curLabel(o.c))}</b><span>${esc(o.name)}${o.ok ? (o.c === 'USD' ? '' : ' \u00b7 1 USD = ' + CUR.rate(o.c)) : ' \u00b7 no rate'}</span></div>${CUR.active() === o.c ? '<span class="note">' + tick(16) + '</span>' : ''}</button>`).join('') });
  if (v) { CUR.set(v); toast(v === 'USD' ? 'Prices in US dollars' : `Prices shown in ${v}, converted`); go(NAV.stack[NAV.stack.length - 1] || 'home'); }
}
const curLabel = c => { const sy = ((CUR.list.find(x => x[0] === c) || [])[1] || '').trim(); return sy && sy !== c ? `${sy} ${c}` : c; };
function curPill() { return `<button class="pill" data-act="currency" aria-label="Change display currency" style="cursor:pointer">${esc(curLabel(CUR.active()))}</button>`; }

function D1() { const d = (typeof CAT !== 'undefined' && CAT.days) || []; if (d.length < 2) return { gap: null };
  const p = d[d.length - 2], q = d[d.length - 1];
  return { gap: Math.round((Date.parse(q + 'T00:00:00Z') - Date.parse(p + 'T00:00:00Z')) / 864e5), from: p, to: q };
}
function sinceLabel({ cap = false } = {}) { const g = D1();
  if (g.gap == null) return cap ? 'No prior day on file' : 'no prior day on file';
  if (g.gap === 1) return cap ? 'Since yesterday' : 'since yesterday';
  return `${cap ? 'Over' : 'over'} ${g.gap} days (${dayText(g.from)} \u2192 ${dayText(g.to)})`;
}
function deltaHtml(p, opts = {}) {
  return changeSpan(p.d1p == null ? null : { a: p.d1a, pc: p.d1p }, { ...opts, none: 'no prior day on file' });
}

function changeSpan(c, { pctOnly = false, tile = false, none = 'no price on file for that day', title = '' } = {}) {
  if (!c) return `<span class="flat" title="${none}">\u2014</span>`;
  const a = c.a, pc = c.pc;
  const cls = a > 0.004 ? 'up' : a < -0.004 ? 'down' : 'flat';

  const tri = tile ? '' : cls === 'up' ? '\u25b2 ' : cls === 'down' ? '\u25bc ' : '';
  const pct = signedPct(pc), t = title ? ` title="${title}"` : '';
  if (pctOnly) return `<span class="${cls} mono"${t}>${pct}</span>`;
  const abs = a >= 0 ? money(a) : signedMoney(a);
  return `<span class="${cls} mono"${t}>${tri}${abs} (${pct})</span>`;
}

const EMPTY_GLYPH = { filter: 'filter', bookmark: 'bookmark', bell: 'bell', spyglass: 'spyglass', box: 'box', leader: 'leader', scan: 'scan' };
const emptyHtml = (glyph, line, hint = '') => `<div class="empty">${G(EMPTY_GLYPH[glyph], 64)}<b class="empty-line">${line}</b>${hint ? `<br>${hint}` : ''}</div>`;
const G = (id, size = 16, style = '') =>
  `<svg class="g" width="${size}" height="${size}" style="${style}" aria-hidden="true"><use href="#g-${id}"/></svg>`;

const chev = (open, size = 16) => G('chevron', size, open ? '' : 'transform:rotate(-90deg)');
const ext = (size = 13) => G('external', size);
const tick = (size = 14) => G('check', size);
const bell = (on, size = 18) => G('bell', size, on ? 'fill:currentColor' : '');
const TYPE_GLYPH = { Leader: 'leader', Character: 'character', Event: 'event', Stage: 'stage' };
const KW_GLYPH = { Blocker: 'blocker', Rush: 'rush', Trigger: 'trigger', Counter: 'counter',
                   'Double Attack': 'rush' };

const TOK = (name, fallback) => { try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback; } catch (e) { return fallback; } };
const rgbaOf = (hex, a) => { const m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return `rgba(201,162,74,${a})`; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const reducedMotion = () => { try { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CAT = { rows: [], byId: new Map(), byNum: new Map(), sets: new Map(),
              ng: {}, ngs: {}, man: {}, effects: {}, proof: {}, expectedFetches: 2, ready: false };

const TREAT = {
  base: 'Base', alternate_art: 'Alternate Art', sp: 'SP', parallel: 'Parallel',
  manga: 'Manga', full_art: 'Full Art', textured_foil: 'Textured Foil',
  pirate_foil: 'Pirate Foil', jolly_roger: 'Jolly Roger Foil',
  wanted_poster: 'Wanted Poster', box_topper: 'Box Topper', reprint: 'Reprint'
};

async function readLocalCatalogue() {
  const FS = PLATFORM.plugin('Filesystem'); if (!FS) return null;
  let m;
  try { m = JSON.parse((await FS.readFile({ path: 'catalogue/manifest.json', directory: 'DATA', encoding: 'utf8' })).data); } catch (e) { return null; }
  if (kindOf(m) !== 'object') return null;
  try { return { cat: JSON.parse((await FS.readFile({ path: 'catalogue/catalog.json', directory: 'DATA', encoding: 'utf8' })).data), man: m }; }
  catch (e) { return { cat: null, man: m, why: 'the file does not read (' + String(e.message || e).slice(0, 60) + ')' }; }
}

function catalogueShape(cat) {
  const kinds = {}; for (const [k, v] of Object.entries(cat)) if (v && typeof v === 'object') kinds[k] = kindOf(v);
  return { kinds, cols: (cat.cols || []).slice() };
}
function catalogueProblem(cat, shape) {
  if (kindOf(cat) !== 'object') return 'not a catalogue';
  for (const k of ['sets', 'cols', 'rows']) if (!Array.isArray(cat[k])) return `no ${k} list`;
  if (shape) {
    for (const [k, kind] of Object.entries(shape.kinds)) if (cat[k] != null && kindOf(cat[k]) !== kind) return `${k} is a ${kindOf(cat[k])}, this build reads a ${kind}`;
    const miss = shape.cols.filter(c => !cat.cols.includes(c));
    if (miss.length) return `no ${miss.slice(0, 4).join(', ')} column${miss.length === 1 ? '' : 's'}`;
  }
  const n = cat.cols.length, bad = cat.rows.findIndex(r => !Array.isArray(r) || r.length !== n);
  if (bad >= 0) return `row ${bad} does not match the ${n} columns`;
  if (cat.sets.some(s => kindOf(s) !== 'object')) return 'a set that is not a record';
  if (cat.stock != null && (!Array.isArray(cat.stock) || cat.stock.some(d => kindOf(d) !== 'object' || !Array.isArray(d.cards)))) return 'a ready-made deck with no card list';
  return '';
}

function indexCatalogue(cat) {
  const sets = new Map(), byId = new Map(), byNum = new Map();
  cat.sets.forEach(s => sets.set(s.id, s));
  const C = cat.cols;
  const rows = cat.rows.map(r => { const o = {}; C.forEach((k, i) => o[k] = r[i]); return o; });
  for (const p of rows) {
    byId.set(p.id, p);

    if (!p.num) continue;
    if (!byNum.has(p.num)) byNum.set(p.num, []);
    byNum.get(p.num).push(p);
  }
  return { ng: cat.ng, ngs: cat.ngs, valid: new Set(cat.valid_numbers || []), star: cat.star || null, effects: cat.effects || {}, proof: cat.proof || {},
    lend: cat.lend || {},

    zips3: cat.zips3 || null,
    stock: (cat.stock || []).map(d => ({ id: d.id, name: d.name, set: d.set, stock: true,
      leader: d.leader, cards: d.cards.map(c => ({ id: c.id, n: c.n })) })),
    days: cat.days || [], hist: cat.hist || {}, sets, rows, byId, byNum };
}
async function loadCatalogue() {
  let [cat, man] = await Promise.all([
    fetch('bundle/catalog.json', { wait: NET.WAIT_BIG }).then(r => r.json()),
    fetch('bundle/manifest.json').then(r => r.json()).catch(() => ({}))
  ]);
  const shape = catalogueShape(cat); let next = null, refused = null;
  const local = await readLocalCatalogue();
  if (local && local.man.source_updated_at && local.man.source_updated_at > (man.source_updated_at || '')) {
    try {
      const why = local.why || catalogueProblem(local.cat, shape); if (why) throw new Error(why);
      next = indexCatalogue(local.cat); man = Object.assign({}, man, local.man, { fromDisk: true });
    } catch (e) {
      refused = `the copy synced for ${String(local.man.source_updated_at).slice(0, 10)} was set aside: ${String(e.message || e).slice(0, 120)}`;
      ERRS.push('catalogue', refused, 'loadCatalogue');
    }
  }
  if (!next) next = indexCatalogue(cat);
  Object.assign(CAT, next, { man, shape, refused, ready: true });
  ONLINE.recheck();
}

let ADS_ENABLED = false;
const CREDITS = {
  FREE_ON_INSTALL: 20, PER_AD: 20, FREE_DECKS: 1, DECKS_PER_AD: 1,
  state: readJson('vault.credits', { scan: 20, deck: 1, earned: 0, spent: 0, pending: [] }),
  save() { saveJson('vault.credits', this.state); },
  enabled() { return ADS_ENABLED; },
  get ready() { return ADS._ready; },

  canCommit(n) { return this.enabled() ? Math.min(n, this.state.scan) : n; },
  spendScan(n) { if (!this.enabled()) return; this.state.scan -= n; this.state.spent += n; this.save(); },
  canSaveDeck(isNew) { return !this.enabled() || !isNew || this.state.deck > 0; },
  spendDeck() { if (!this.enabled()) return; this.state.deck -= 1; this.save(); },

  earn(kind) {
    if (kind === 'deck') this.state.deck += this.DECKS_PER_AD;
    else { this.state.scan += this.PER_AD; this.state.earned += this.PER_AD; }
    this.save(); this.drain();
  },

  defer(rows) {
    const at = this.state.pending.length; this.state.pending.push(...rows);
    if (saveJson('vault.credits', this.state)) return true;
    this.state.pending.length = at; return false;
  },
  drain() {
    if (!this.enabled()) return;
    const n = Math.min(this.state.pending.length, this.state.scan);
    if (!n) return;
    if (!OWN.moveIn(this.state.pending.slice(0, n))) return;
    this.state.pending.splice(0, n);
    this.spendScan(n); this.save(); commitOwn('pending');
    toast(`${n} pending card${n === 1 ? '' : 's'} added`);
  },

  freeSave(kind) {
    if (!this.enabled()) return false;
    const n = this.state.pending.length;
    if (kind === 'deck') this.state.deck += 1;
    else if (!n) return false;
    else this.state.scan += n;
    this.state.free = (this.state.free || 0) + 1; this.save();
    if (kind === 'deck') { toast('No ad available \u2014 this deck save is free: tap Save again'); return true; }
    this.drain();
    toast(`No ad available \u2014 ${n} waiting card${n === 1 ? '' : 's'} saved free`);
    if (typeof paintScan === 'function' && $('#scan').classList.contains('on')) paintScan();
    return true;
  }
};

const ADS = {

  _ready: { scan: false, deck: false, max: false },

  _canRequestAds: undefined,
  _ids: {},
  units() {
    const a = CAT.man.ads || {}, L = a.live;
    if (L && typeof L.from === 'number' && TAKE >= L.from && L.scan && L.deck && L.max && this._canRequestAds === true) return { scan: L.scan, deck: L.deck, max: L.max, test: false, from: L.from };
    return { scan: a.scan, deck: a.deck, max: a.deck, test: !!a.test };
  },
  unitsNote() {
    const L = (CAT.man.ads || {}).live, u = this.units();
    if (!u.test) return `live units, from take ${u.from}`;
    if (!L || typeof L.from !== 'number') return 'Google test units';
    return `Google test units (live units wait for ${TAKE < L.from ? `take ${L.from}` : 'consent'})`;
  },
  _failed(e) { if (e) console.warn('ad not shown', e); this._pendingKind = null; this._ready = { scan: false, deck: false, max: false }; toast('The ad could not be shown'); },

  _consent: null,
  _started: false,
  _starting: null,
  async consentAsk() {
    const A = PLATFORM.plugin('AdMob'); if (!A || typeof A.requestConsentInfo !== 'function') return null;
    try {
      let info = await A.requestConsentInfo();
      if (info && info.status === 'REQUIRED' && info.isConsentFormAvailable) info = { ...info, ...(await A.showConsentForm()) };
      this._consent = { status: info.status, privacy: info.privacyOptionsRequirementStatus, can: !!info.canRequestAds };
      this._canRequestAds = !!info.canRequestAds;
    } catch (e) { this._consent = { ...(this._consent || {}), error: String((e && e.message) || e).slice(0, 80) }; }
    if (typeof paintSettings === 'function' && $('#settings') && $('#settings').classList.contains('on')) paintSettings();
    return this._consent;
  },

  start() {
    if (!this._starting) this._starting = (async () => {
      await this.consentAsk();
      if (this._canRequestAds !== true) return false;
      if (!this._started) { this._started = await this.init(); if (this._started) this.load('scan'); }
      return this._started;
    })().finally(() => { this._starting = null; });
    return this._starting;
  },

  startWhenFree() {
    const busy = () => { const g = document.getElementById('tour'); return !!(g && !g.hidden && g.classList.contains('on')); };
    const tick = () => { if (busy()) { setTimeout(tick, 1000); return; } this.start(); };
    setTimeout(tick, 800);
  },

  none(kind, noAd) {
    if (noAd && (kind === 'scan' || kind === 'deck') && CREDITS.freeSave(kind)) return false;
    toast('No ad available right now \u2014 try again in a moment'); return false;
  },
  privacyShown() { return !!(this._consent && this._consent.privacy === 'REQUIRED'); },
  async privacy() {
    const A = PLATFORM.plugin('AdMob'); if (!A || typeof A.showPrivacyOptionsForm !== 'function') return;
    try { await A.showPrivacyOptionsForm(); } catch (e) { toast('Privacy choices could not be opened \u2014 try again when online'); return; }
    await this.start();
  },
  consentNote() {
    const c = this._consent, f = (CREDITS.state && CREDITS.state.free) || 0;
    const head = !c ? 'not asked yet' : c.status ? `${c.status}, ads ${c.can ? 'allowed' : 'not allowed'}, privacy choices ${c.privacy === 'REQUIRED' ? 'shown' : 'not needed'}` : 'no answer yet';
    return `${head}${c && c.error ? ` (last error: ${c.error})` : ''} \u00b7 free saves ${f}`;
  },
  async init() {
    const A = PLATFORM.plugin('AdMob'); if (!A || !CAT.man.ads) return false;
    try {
      await A.initialize({ initializeForTesting: this.units().test });
      await A.addListener('onRewardedVideoAdReward', r => {

        if (this._pendingKind === 'max') { this._pendingKind = null; MAXLOCK.grant(); toast('All-time history is open for a day \u2014 thank you'); range = 'MAX'; if ($('#home').classList.contains('on')) paintHome(); return; }
        CREDITS.earn(this._pendingKind || 'scan'); this._pendingKind = null;
        toast(`+${this._lastKind === 'deck' ? CREDITS.DECKS_PER_AD + ' deck save' : CREDITS.PER_AD + ' save credits'} \u2014 thank you`);
        if (typeof paintScan === 'function' && $('#scan').classList.contains('on')) paintScan();
      });
      await A.addListener('onRewardedVideoAdDismissed', () => { this._ready = { scan: false, deck: false, max: false }; this.load('scan'); });
      await A.addListener('onRewardedVideoAdFailedToShow', e => this._failed(e));
      await A.addListener('onRewardedVideoAdFailedToLoad', e => { this._loadErr = e && typeof e.code === 'number' ? e.code : null; console.warn('ad load failed', e); });
      return true;
    } catch (e) { console.warn('ads init failed', e); return false; }
  },
  async load(kind = 'scan') {
    const A = PLATFORM.plugin('AdMob'); if (!A || !CAT.man.ads) return false;
    const u = this.units(); this._loadErr = null;
    try {
      await A.prepareRewardVideoAd({ adId: u[kind], isTesting: u.test });
      this._ids[kind] = u[kind]; this._ready[kind] = true; return true;
    } catch (e) { this._ready[kind] = false; if (this._loadErr == null && /no fill/i.test(String((e && e.message) || e))) this._loadErr = 3; return false; }
  },

  async show(kind = 'scan') {
    const A = PLATFORM.plugin('AdMob'); if (!A) return false;
    if (this._canRequestAds !== true || !this._started) await this.start();
    if (this._canRequestAds !== true || !this._started) return this.none(kind, this._canRequestAds === false || (!!this._consent && !!this._consent.error && navigator.onLine !== false));
    if (!this._ready[kind] && !(await this.load(kind))) return this.none(kind, navigator.onLine !== false && this._loadErr !== 2);
    this._pendingKind = kind; this._lastKind = kind; this._ready[kind] = false;

    try { A.showRewardVideoAd({ adId: this._ids[kind] }).catch(e => this._failed(e)); return true; }
    catch (e) { this._failed(e); return false; }
  },
};

const PF = {
  list: readJson('vault.pfs', [{ id: 'main', name: 'One Piece' }]),
  active: localStorage.getItem('vault.pf') || 'main',
  save() { saveJson('vault.pfs', this.list); saveJson('vault.pf', this.active); },
  name(id) { return (this.list.find(p => p.id === id) || {}).name || 'One Piece'; },
  scope(items) { return this.active === 'all' ? items : items.filter(i => (i.pf || 'main') === this.active); },

  add(name) { const id = 'pf' + Date.now(); this.list.push({ id, name }); this.active = id; this.save(); scheduleBackup('collections'); return id; },
  rename(id, name) { const p = this.list.find(x => x.id === id); if (p) { p.name = name; this.save(); scheduleBackup('collections'); } },
  remove(id) {
    if (id === 'main' || this.list.length < 2) return false;
    OWN.items.forEach(i => { if ((i.pf || 'main') === id) i.pf = 'main'; });
    this.list = this.list.filter(p => p.id !== id); if (this.active === id) this.active = 'main';
    this.save(); commitOwn('collections'); return true;
  }
};

const OWN = {
  items: readJson('vault.items', []),
  snaps: readJson('vault.snaps', []),
  lastBackup: readJson('vault.lastBackup', null, false),
  save() {
    const a = saveJson('vault.items', this.items), b = saveJson('vault.snaps', this.snaps);
    return a && b;
  },

  target(pf = null) { return pf || (PF.active === 'all' ? 'main' : PF.active); },

  lines(id) { return this.items.filter(i => i.id === id && !i.graded); },
  line(id, cond = null, pf = null) { const t = this.target(pf); return this.lines(id).find(i => (cond == null || i.condition === cond) && (i.pf || 'main') === t); },

  add(productId, { qty = 1, condition = 'NM', photo = null, pf = null, graded = null, save = true } = {}) {
    const target = this.target(pf);
    const hit = graded ? null : this.line(productId, condition, target);
    if (hit) { hit.qty += qty; }
    else this.items.push({ id: productId, qty, condition, photo, pf: target, game: 'optcg',
                           added: new Date().toISOString(), fav: false, ...(graded ? { graded } : {}) });
    if (save) this.save(); return hit || this.items[this.items.length - 1];
  },

  moveIn(rows) {
    if (!rows.length) return true;
    const before = this.items.map(i => ({ ...i }));
    const cond = c => (['NM', 'LP', 'MP', 'HP', 'DMG'].includes(c) ? c : 'NM');
    rows.forEach(r => this.add(r.id, { condition: cond(r.condition), photo: r.photo || null, pf: r.pf && PF.list.some(c => c.id === r.pf) ? r.pf : null, save: false }));
    if (saveJson('vault.items', this.items)) return true;
    this.items = before; return false;
  },
  total(all = false) { return (all ? this.items : PF.scope(this.items)).reduce((s, i) => s + (price(i.id) || 0) * i.qty, 0); },

  snapshot() {
    const day = phoneToday();
    const n = this.items.reduce((a, i) => a + i.qty, 0);
    const last = this.snaps[this.snaps.length - 1];

    if (last && last[0] >= day) { last[1] = this.total(); last[2] = n; }
    else this.snaps.push([day, this.total(), n]);
    this.save();
  },
  cost() { return this.items.reduce((s, i) => s + (i.paid || 0) * i.qty, 0); }
};

const MAXLOCK = {
  until: +(localStorage.getItem('vault.maxUntil') || 0),
  open() { return !PLATFORM.plugin('AdMob') || !CAT.man.ads || Date.now() < this.until; },
  grant() { this.until = Date.now() + 24 * 3600e3; saveJson('vault.maxUntil', String(this.until)); },
  async ask() { const v = await PICKER.choose({ title: 'All-time history', key: 'maxad',
      why: 'Watch one short ad and the MAX range is open for a day. The other ranges stay free.',
      opts: `<button class="opt" data-maxad="go"><div class="oi"><b>Watch an ad</b><span>about 30 seconds</span></div></button><button class="opt" data-maxad="no"><div class="oi"><b>Not now</b></div></button>` });
    if (v !== 'go') return; const shown = await ADS.show('max'); if (!shown) toast('No ad right now \u2014 try again in a moment'); }
};

const UPDATE = {
  KEY: 'vault.updateSeen', info: null, why: 'not asked yet',
  async check() {
    if (!navigator.onLine) { this.info = null; this.why = 'offline'; return null; }
    try { const r = await PLATFORM.appUpdateInfo(); this.info = r || null; this.why = r ? '' : 'this build has no update plugin'; }
    catch (e) { this.info = null; this.why = String((e && e.message) || e); }
    return this.info;
  },
  newer() { const r = this.info; return r && r.updateAvailability === 2 ? String(r.availableVersionCode || '?') : null; },

  note() { const n = this.newer(); if (n) return `Take ${n} is on Google Play \u2014 you have take ${TAKE}`;
    const a = this.info && this.info.updateAvailability;
    if (a === 1) return 'Up to date on Google Play'; if (a === 3) return 'An update is being installed';
    return this.info ? 'Google Play gave no answer' : `Could not ask Google Play \u2014 ${this.why}`; },
  seen() { try { return localStorage.getItem(this.KEY) || ''; } catch (e) { return ''; } },
  async offer(choose = o => PICKER.choose(o)) {
    const n = this.newer(); if (!n || this.seen() === n) return false;
    saveJson(this.KEY, n);
    const v = await choose({ title: 'A newer version is on Google Play', key: 'upd', why: `Take ${esc(n)} is out; this is take ${TAKE}. Updating keeps your collection and your decks.`,
      opts: `<button class="opt" data-upd="go"><div class="oi"><b>Update</b><span>opens Google Play</span></div></button><button class="opt" data-upd="no"><div class="oi"><b>Later</b><span>About, under More, keeps the note</span></div></button>` });
    if (v === 'go') await PLATFORM.openStore();
    return true;
  },

  busy() { const on = id => { const e = document.getElementById(id); return !!(e && !e.hidden && e.classList.contains('on')); }; return on('tour') || on('picker') || (ADS_ENABLED && PLATFORM._consent == null); },
  async ask() { await this.check(); this.lastAt = Date.now(); await this.offer(); const el = document.getElementById('aboutUpd'); if (el) el.textContent = this.note(); },
  checkWhenFree(delay = 3000) {
    const tick = async () => { if (this.busy()) { setTimeout(tick, 1000); return; } await this.ask(); };
    setTimeout(tick, delay);
  },

  EVERY: 6 * 3600e3, lastAt: 0,
  due() { return Date.now() - this.lastAt >= this.EVERY; },
  resume() { if (this.due() && navigator.onLine) this.checkWhenFree(500); },
  watch() {
    this.checkWhenFree();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.resume(); });
    const hourly = () => { this.resume(); setTimeout(hourly, 3600e3); }; setTimeout(hourly, 3600e3);
  }
};

const PRICESYNC = {
  EVERY: 2 * 3600e3, lastAt: 0,
  allowed() { return !!(navigator.onLine && CAT.man.updateUrl && PLATFORM.quietSyncAllowed()); },
  run(now = Date.now()) {
    if (now - this.lastAt < this.EVERY || !this.allowed()) return false;
    if (ONLINE.playing()) return false;
    this.lastAt = now; PLATFORM.refreshCatalogue({ quiet: true }); return true;
  },
  watch() {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.run(); });
    const hourly = () => { this.run(); setTimeout(hourly, 3600e3); }; setTimeout(hourly, 3600e3);
  }
};
const price = id => { const p = CAT.byId.get(id); return p ? p.market : null; };

const LARGE = { from: /_200w\.jpg$/, to: '_in_1000x1000.jpg' };
function largeOk() {
  const L = ((CAT.man || {}).images || {}).large;
  return !!(L && L.probed > 0 && L.served >= 0.9 * L.probed && L.w >= 400);
}
function artUrl(p, size = 'thumb') {
  const u = (p && p.img) || '';
  return size === 'large' && u && LARGE.from.test(u) && largeOk() ? u.replace(LARGE.from, LARGE.to) : u;
}

function refArt(p, { size = 'thumb', cls = '' } = {}) {
  if (!p.img) return '';
  const src = artUrl(p, size);

  return `<img class="ref${cls ? ' ' + cls : ''}" loading="lazy" decoding="async" src="${esc(src)}" alt=""${src !== p.img ? ` data-thumb="${esc(p.img)}"` : ''}
            onload="this.classList.add('ok');var p=this.parentNode,q=p&&p.querySelector('.ph');if(q)q.style.display='none'"
            onerror="var t=this.dataset.thumb;if(t){delete this.dataset.thumb;this.src=t}else{this.remove()}">`;
}

function lineShowsPhoto(i) { return !!(i && i.photo && i.pic !== 'ref'); }
function linePic(i, p, fallback = '') { return lineShowsPhoto(i) ? `<img src="${esc(i.photo)}" alt="">` : fallback + refArt(p); }

function artColours(p) {
  const cs = gameColours(p);
  if (!cs.length) return ['var(--brass2)', 'var(--card2)'];
  const a = `var(--c-${CCLASS[cs[0]]})`;
  return [a, cs[1] ? `var(--c-${CCLASS[cs[1]]})` : `color-mix(in srgb,${a} 45%,var(--bg))`];
}

function paintBack(el, p) {
  if (!el) return; const [a1, a2] = artColours(p);
  el.style.cssText = `--a1:${a1};--a2:${a2}`;
  el.innerHTML = p && p.img ? `<img class="above${artOk(p.img)}" alt="" loading="lazy" decoding="async" src="${esc(p.img)}" onload="${ART_ONLOAD}" onerror="this.remove()">` : '';
}

window.ART_OK = window.ART_OK || new Set();
const artOk = src => (window.ART_OK.has(src) ? ' ok' : '');
const ART_ONLOAD = "this.classList.add('ok');window.ART_OK.add(this.getAttribute('src'))";
function artBack(p, { crisp = false } = {}) {
  const [a1, a2] = artColours(p), src = crisp ? artUrl(p, 'large') : p.img;

  return `<div class="artbg${crisp ? ' crisp' : ''}" aria-hidden="true" style="--a1:${a1};--a2:${a2}">${p.img ? `<img class="above${artOk(src)}" alt="" loading="lazy" decoding="async" src="${esc(src)}"${src !== p.img ? ` data-thumb="${esc(p.img)}"` : ''} onload="${ART_ONLOAD}" onerror="var t=this.dataset.thumb;if(t){delete this.dataset.thumb;this.src=t}else{this.remove()}">` : ''}</div>`;
}

const ownPic = name => (CAT.man.user || []).includes(name);
function ownBack(name) {
  const src = `bundle/user/${esc(name)}`;
  return `<div class="artbg crisp" aria-hidden="true"><img class="own${artOk(src)}" alt="" decoding="async" src="${src}" onload="${ART_ONLOAD}" onerror="this.remove()"></div>`;
}

let SET_TOP = { rows: null, map: new Map() };
function setTop(setId) {
  if (SET_TOP.rows !== CAT.rows) {
    const map = new Map();
    for (const p of CAT.rows) if (!p.sealed && p.hash && p.market > 0 && p.img) { const t = map.get(p.set); if (!t || p.market > t.market) map.set(p.set, p); }
    SET_TOP = { rows: CAT.rows, map };
  }
  return SET_TOP.map.get(setId) || null;
}

function newestTop(today = phoneToday()) {
  const sets = [...CAT.sets.values()].filter(s => s.pub && s.pub <= today).sort((a, b) => b.pub.localeCompare(a.pub));
  for (const pool of [sets.filter(s => s.kind === 'main'), sets]) for (const s of pool) { const p = setTop(s.id); if (p) return { p, set: s }; }
  return null;
}

const atTop = () => { const r = document.documentElement; if (r && r.classList) r.classList.toggle('at-top', (window.scrollY || 0) < 8); };
addEventListener('scroll', atTop, { passive: true }); atTop();
const CCLASS = { Red: 'red', Green: 'green', Blue: 'blue', Purple: 'purple', Black: 'black', Yellow: 'yellow' };

const colsOf = p => String((p && p.color) || '').split(/[;/,]/).map(x => x.trim()).filter(Boolean);
const gameColours = p => colsOf(p).filter(x => CCLASS[x]);

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

function setProgress() {

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

function candidates(number, setId, face) {
  let c = (CAT.byNum.get(number) || []);
  if (setId) { const inSet = c.filter(p => p.set === setId); if (inSet.length) c = inSet; }
  if (face && face !== 'plain') {
    const narrowed = c.filter(p => p.face === face);
    if (narrowed.length) c = narrowed;
  }
  return c.slice().sort((a, b) => {

    if (face && (a.face === face) !== (b.face === face)) return a.face === face ? -1 : 1;

    const l = likelihood(b, face) - likelihood(a, face);
    if (l) return l;
    return (b.market || 0) - (a.market || 0);
  });
}
function likelihood(p, face) {
  const k = (CAT.sets.get(p.set) || {}).kind || 'main';
  let s = k === 'main' ? 30 : k === 'deck' ? 20 : 10;
  if (!face && p.treat === 'base') s += 5;
  if (p.prov) s -= 3;
  return s;
}
function resolve(number, { setId = null, hash = null, face = null } = {}) {
  const c = candidates(number, setId, face);
  if (!c.length) return { verdict: 'unknown', candidates: [] };
  if (c.length === 1) {
    return { verdict: 'auto', pick: c[0], candidates: c,
             why: face && face !== 'plain'
               ? `only one ${face === 'sp' ? 'SP' : 'starred'} printing of ${number}`
               : 'only one printing' };
  }

  const vals = c.map(p => p.market).filter(v => v > 0);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const spread = lo > 0 ? hi / lo : Infinity;

  if (hash != null) {
    const scored = c.filter(p => p.hash != null)
      .map(p => ({ p, d: hamming(hash, p.hash) })).sort((a, b) => a.d - b.d);

    const anySameArt = c.some(p => p.sameart);
    if (scored.length >= 2 && !anySameArt &&
        scored[0].d <= 8 && scored[1].d - scored[0].d >= 13) {
      return { verdict: 'auto', pick: scored[0].p, candidates: c,
               why: `artwork matched (distance ${scored[0].d})` };
    }
    if (scored.length) c.sort((a, b) =>
      (scored.find(s => s.p === a)?.d ?? 99) - (scored.find(s => s.p === b)?.d ?? 99));
  }
  if (spread <= 1.25) {
    return { verdict: 'auto', pick: c[0], candidates: c,
             why: `all ${c.length} printings within ${money(hi - lo)} of each other` };
  }
  return { verdict: 'ask', candidates: c, spread,
           why: `${c.length} printings share ${number}, ${money(lo)} to ${money(hi)} — `
              + `<b>${Math.round(spread)}\u00d7 apart</b>. Guessing here would misprice `
              + `your collection, so pick the one you’re holding.` };
}
const U64 = (1n << 64n) - 1n;

function hamming(a, b) {
  let x = ((BigInt(a) & U64) ^ (BigInt(b) & U64)) & U64, n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n;
}

const RULES = {
  DECK_SIZE: 50, MAX_COPIES: 4, DON: 10,
  MAIN_TYPES: new Set(['Character', 'Event', 'Stage']),
};
const DECKS = {

  all() { return this.list.concat(CAT.stock || []); },
  isStock(d) { return !!(d && d.stock); },
  list: readJson('vault.decks', []),
  save() { saveJson('vault.decks', this.list); },
  blank() { return { id: 'd' + Date.now(), name: '', leader: null, cards: [],
                     created: new Date().toISOString() }; }
};
const hasKw = (p, k) => ('|' + (p.kw || '') + '|').includes('|' + k + '|');

const anyNumber = p => !!p && /you may have any number of this card in your deck/i.test(p.text || '');

function colourLegal(p, leader) {
  if (!leader) return true;
  const L = colsOf(leader), C = colsOf(p);
  return C.some(c => L.includes(c));
}

function legality(deck) {
  const leader = deck.leader ? CAT.byId.get(deck.leader) : null;
  const rows = deck.cards.map(c => ({ ...c, p: CAT.byId.get(c.id) })).filter(r => r.p);
  const total = rows.reduce((a, r) => a + r.n, 0);
  const byNum = {};
  rows.forEach(r => { byNum[r.p.num] = (byNum[r.p.num] || 0) + r.n; });
  const problems = [];
  if (!leader) problems.push('No Leader chosen (§5-1-2)');
  else if (leader.type !== 'Leader') problems.push(`${leader.name} is not a Leader card`);
  if (total < RULES.DECK_SIZE) problems.push(`${RULES.DECK_SIZE - total} more card${RULES.DECK_SIZE - total === 1 ? '' : 's'} needed (§5-1-2)`);
  if (total > RULES.DECK_SIZE) problems.push(`${total - RULES.DECK_SIZE} over fifty (§5-1-2)`);
  for (const [num, n] of Object.entries(byNum))
    if (n > RULES.MAX_COPIES && !rows.some(r => r.p.num === num && anyNumber(r.p))) problems.push(`${n} copies of ${num} — max ${RULES.MAX_COPIES} (§5-1-2-3)`);
  rows.forEach(r => {
    if (!RULES.MAIN_TYPES.has(r.p.type)) problems.push(`${r.p.name} is a ${r.p.type}, not a main-deck card (§5-1-2-1)`);
    if (leader && !colourLegal(r.p, leader)) problems.push(`${r.p.name} is ${colsOf(r.p).join('/')} — Leader is ${colsOf(leader).join('/')} (§5-1-2-2)`);
  });
  return { leader, rows, total, byNum, problems, legal: problems.length === 0 };
}

function analysis(deck) {
  const L = legality(deck);
  const curve = Array(11).fill(0);
  let counters = 0, counterEvents = 0, triggers = 0, blockers = 0, rush = 0,
      chars = 0, events = 0, stages = 0, cost = 0, costed = 0;
  for (const r of L.rows) {
    const p = r.p, n = r.n;
    const c = Math.min(10, Math.max(0, parseInt(p.cost, 10) || 0));
    if (p.cost != null && p.cost !== '') { curve[c] += n; cost += c * n; costed += n; }
    if (p.type === 'Character') chars += n; else if (p.type === 'Event') events += n; else if (p.type === 'Stage') stages += n;
    if (p.counter && Number(p.counter) >= 1000) counters += n;
    if (p.type === 'Event' && hasKw(p, 'Counter')) counterEvents += n;
    if (hasKw(p, 'Trigger')) triggers += n;
    if (hasKw(p, 'Blocker')) blockers += n;
    if (hasKw(p, 'Rush')) rush += n;
  }
  return { ...L, curve, avgCost: costed ? cost / costed : 0, counters, counterEvents,
           triggers, blockers, rush, chars, events, stages,
           life: L.leader ? L.leader.life : null,

           value: L.rows.reduce((a, r) => a + (r.p.market || 0) * r.n, 0) + ((L.leader && L.leader.market) || 0) };
}

let dkCur = null;

function heroLeader() {

  const made = d => (typeof d.created === 'number' ? d.created : Date.parse(d.created) || 0);
  const own = DECKS.list.filter(d => d.leader && CAT.byId.get(d.leader)).sort((a, b) => made(b) - made(a))[0];
  if (own) return { L: CAT.byId.get(own.leader), why: 'your newest deck\u2019s Leader' };
  const st = (CAT.stock || []).find(d => d.leader && CAT.byId.get(d.leader));
  return st ? { L: CAT.byId.get(st.leader), why: 'a ready-made deck\u2019s Leader' } : null;
}
function paintDeckHero() {
  const h = $('#dkHero'); if (!h) return; const own = ownPic('hero-play.jpg'), f = own ? null : heroLeader();
  h.hidden = !own && !f; if (h.hidden) { h.innerHTML = ''; return; }

  h.innerHTML = own ? ownBack('hero-play.jpg') : artBack(f.L);
}
function paintDecks() {
  const list = DECKS.list;
  paintStock(); paintDeckHero();
  const legal = list.filter(d => analysis(d).legal).length, st = (CAT.stock || []).length;
  $('#dkSub').textContent = list.length ? `${list.length} deck${list.length === 1 ? '' : 's'} \u00b7 ${legal} legal` : st ? `${st} ready-made to try` : '';
  $('#dkList').innerHTML = list.length ? list.map(d => {
    const A = analysis(d); const L = A.leader;
    return `<button class="panel" style="width:100%;text-align:left;display:flex;gap:12px;align-items:center" data-deck="${d.id}">
      <div class="lead pic" style="width:${THUMB.m}px;flex:0 0 ${THUMB.m}px;aspect-ratio:.716;border-radius:var(--r-sm);background:var(--card2);overflow:hidden;position:relative">${L ? refArt(L) : ''}</div>
      <div style="flex:1;min-width:0"><b>${esc(d.name || 'Untitled deck')}</b>
        <div class="note" style="margin:2px 0 0">${L ? esc(L.name) + ' · ' + colsOf(L).join('/') : 'No Leader'} ·
          ${A.total}/50 · ${A.legal ? '<span class="up">legal</span>' : `<span class="down">${A.problems.length} issue${A.problems.length === 1 ? '' : 's'}</span>`}</div></div>
      <div class="v mono">${money(A.value)}</div></button>`;
  }).join('') : emptyHtml('leader', 'No decks yet', 'Tap <b>+ New deck</b> and choose a Leader, or <b>Import a deck</b> from a list or its QR code.');
}
CLICKS.on('[data-deck]', e => {
  const b = e.target.closest('[data-deck]'); if (b) openDeck(b.dataset.deck);
});

function deckCover(d, { w = 56 } = {}) {
  const L = CAT.byId.get(d.leader) || {};
  const cs = gameColours(L);
  const a = cs[0] ? `var(--c-${CCLASS[cs[0]]})` : 'var(--brass)';
  const b = cs[1] ? `var(--c-${CCLASS[cs[1]]})` : a;
  const code = (d.set || (L.num || '').split('-')[0] || '').toUpperCase();
  const gid = 'cov' + (d.id || code).replace(/[^a-z0-9]/gi, '');
  return `<svg width="${w}" height="${Math.round(w * 1.4)}" viewBox="0 0 56 78" aria-label="${esc(code)} deck cover" role="img" style="flex:0 0 auto;border-radius:var(--r-sm);display:block">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="56" height="78" rx="6" fill="url(#${gid})"/>
    <rect x="3" y="3" width="50" height="72" rx="4" fill="none" stroke="rgba(0,0,0,.35)"/>
    <text x="28" y="40" text-anchor="middle" font-family="OPH Display, Impact, sans-serif" font-size="17" fill="rgba(0,0,0,.72)">${esc(code)}</text>
    <circle cx="28" cy="62" r="5" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="1.5"/>
  </svg>`;
}

function stockPic(d) {
  const L = CAT.byId.get(d.leader);
  return `<div class="pic" style="width:${THUMB.m}px;height:${Math.round(THUMB.m / 0.716)}px;flex:0 0 auto;position:relative;border-radius:var(--r-sm);overflow:hidden"><div class="ph" style="position:absolute;inset:0">${deckCover(d, { w: THUMB.m })}</div>${L ? refArt(L) : ''}</div>`;
}

function paintStock() {
  const box = $('#dkStock'); if (!box) return; const stock = CAT.stock || [];
  box.innerHTML = !stock.length ? '' : `<div class="fgrp">Ready-made decks</div>
    ${stock.map(d => `<button class="panel" style="width:100%;text-align:left;display:flex;gap:12px;align-items:center" data-stock="${esc(d.id)}">
      ${stockPic(d)}
      <div style="flex:1;min-width:0"><b>${esc(d.name)}</b><div class="note"><span class="badge">ready-made</span> ${d.cards.reduce((a, c) => a + c.n, 0)} cards</div></div></button>`).join('')}`;
}
CLICKS.on('[data-stock]', e => {
  const b = e.target.closest('[data-stock]'); if (!b) return;
  const d = (CAT.stock || []).find(x => x.id === b.dataset.stock); if (!d) return;
  SIMUI.pre = d.id; MODE.set('play'); go('sim'); toast(`${d.name} \u2014 pick it as your deck`);
});
$('#dkNew').addEventListener('click', () => { const d = DECKS.blank(); DECKS.list.push(d); DECKS.save(); openDeck(d.id); });
function openDeck(id) { dkCur = DECKS.list.find(d => d.id === id); if (dkCur) go('deck'); }

function simReadiness(d) {
  const ids = (d.leader ? [d.leader] : []).concat(d.cards.map(c => c.id));
  const counts = { full: 0, part: 0, hand: 0, none: 0 }; const byName = { hand: [] };
  for (const id of ids) { const p = CAT.byId.get(id); if (!p) continue;
    const lines = SIM.lines(p.text);
    const fx = ((CAT.effects || {})[String(id)] || []).filter(e => !e.hand);
    if (!lines.length) counts.none++; else if (fx.length >= lines.length) counts.full++; else if (fx.length) counts.part++; else { counts.hand++; if (byName.hand.length < 6 && !byName.hand.includes(p.name)) byName.hand.push(p.name); } }
  return { ...counts, total: ids.length, handNames: byName.hand };
}

function paintDeck() {
  if (!dkCur) return go('decks');
  const A = analysis(dkCur), L = A.leader;
  $('#dkName').value = dkCur.name || '';
  const lead = $('#dkLead'), [la1, la2] = L ? artColours(L) : [];
  lead.style.cssText = L ? `--a1:${la1};--a2:${la2}` : '';
  lead.innerHTML = L ? refArt(L, { size: 'large' }) : '<div class="ph" style="font-size:var(--fs-cap)">Leader</div>';
  $('#dkLeadLine').innerHTML = L
    ? `<b>${esc(L.name)}</b><span class="meta">${esc(L.num)} \u00b7 Leader \u00b7 ${G('life', 13)} ${L.life || '?'} Life</span>${colourDots(L)}`
    : '<span class="meta">Tap the card to choose a Leader</span>';
  const n = $('#dkN'); n.innerHTML = `${A.total}<span style="font-size:var(--fs-sm);color:var(--dim2)">/50</span>`;
  n.className = 'dkcount' + (A.total === 50 ? ' ok' : A.total > 50 ? ' over' : '');
  const sr = simReadiness(dkCur); const simBox = $('#dkSim');
  if (simBox) simBox.innerHTML = `<h3>In the Sim</h3><div class="note">Of ${sr.total} cards: <b>${sr.full}</b> run themselves, <b>${sr.part}</b> partly, <b>${sr.hand}</b> by hand, ${sr.none} have no effect text.${sr.handNames.length ? ' By hand: ' + esc(sr.handNames.join(', ')) + (sr.hand > sr.handNames.length ? '\u2026' : '') + '.' : ''}</div>
    <div class="row" style="margin-top:10px"><button class="ghost go" id="dkPlaySim" ${A.legal ? '' : 'disabled title="the deck must be legal first"'}>Play this deck in Sim</button></div>`;
  const ps = $('#dkPlaySim'); if (ps) ps.addEventListener('click', () => { SIMUI.pre = dkCur.id; MODE.set('play'); go('sim'); });
  const lg = $('#dkLegal');
  lg.className = 'legal ' + (A.legal ? 'ok' : 'bad');
  lg.innerHTML = A.legal ? 'Legal under Comprehensive Rules §5-1. Fifty cards, one Leader, in colour, no more than four of a number unless the card allows more.'
                         : A.problems.slice(0, 4).map(esc).join('<br>') + (A.problems.length > 4 ? `<br>…and ${A.problems.length - 4} more` : '');
  const mx = Math.max(1, ...A.curve);
  $('#dkCurve').innerHTML = A.curve.map((c, i) =>
    `<div class="${c === mx && c ? 'hi' : ''}" style="height:${Math.max(3, 60 * c / mx)}px">${c ? `<b>${c}</b>` : ''}<span>${i}</span></div>`).join('');
  $('#dkAvg').textContent = A.total ? `avg cost ${A.avgCost.toFixed(1)} · 2 DON!! a turn (§6-4)` : '';
  const chip = (v, k) => `<span class="chip" style="padding:4px 9px;font-size:var(--fs-cap)">${v}<small>${k}</small></span>`;
  $('#dkStats').innerHTML = [
    [A.counters, 'Counter cards'], [A.counterEvents, '[Counter] Events'], [A.blockers, 'Blockers'],
    [A.triggers, 'Triggers'], [A.rush, 'Rush'], [money(A.value), 'value']].map(([v, k]) => chip(v, k)).join('');
  $('#dkTypes').textContent = `${A.chars} characters · ${A.events} events · ${A.stages} stages`;

  const hist = deckHistory(dkCur);
  const dv = $('#dkValue');
  if (dv) {
    const d1 = hist.length > 1 ? hist[hist.length - 1][1] - hist[hist.length - 2][1] : null;
    dv.innerHTML = `<div class="row"><div class="nm"><b>Deck value</b><span>${dkOwnedValue(A)}</span></div>
      <div class="v mono">${money(A.value)}${d1 != null ? `<span class="${d1 > 0.005 ? 'up' : d1 < -0.005 ? 'down' : 'flat'}">${signedMoney(d1)} ${esc(sinceLabel())}</span>` : ''}</div></div>
      <canvas id="dkSpark" height="56" style="width:100%;display:block;margin-top:6px"></canvas>
      <div class="note" style="margin-top:4px">${hist.length > 1 ? 'Dashed: estimated from each day\u2019s prices.' : 'One day of prices so far; the line appears as days add up.'}</div>`;
    if (hist.length > 1) sparkOn($('#dkSpark'), hist, 'estimate');
  }
  $('#dkRows').innerHTML = A.rows.length ? A.rows.slice().sort((a, b) =>
      (parseInt(a.p.cost, 10) || 0) - (parseInt(b.p.cost, 10) || 0) || a.p.name.localeCompare(b.p.name))
    .map(r => deckRow(r.p, r.n, L)).join('')
    : '<div class="note">Search above to add cards. Cards you own are marked.</div>';
  paintDeckAdd();
}
function deckRow(p, n, L, adding = false) {
  const ok = (!L || colourLegal(p, L)) && RULES.MAIN_TYPES.has(p.type);
  const own = OWN.items.filter(i => i.id === p.id).reduce((a, i) => a + i.qty, 0);
  const kws = ['Blocker', 'Rush', 'Trigger', 'Counter', 'Double Attack', 'Banish'].filter(k => hasKw(p, k));
  return `<div class="dkrow${ok ? '' : ' illegal'}" data-dk="${p.id}">
    <div class="cost">${p.cost != null && p.cost !== '' ? esc(p.cost) : '·'}</div>
    ${cardPic(p, THUMB.s)}
    <div class="n"><b>${esc(p.name)}${p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
      <span>${esc(p.num)} · ${colsOf(p).join('/')}${p.power ? ' · ' + Number(p.power).toLocaleString() : ''}${
        p.counter ? ' · +' + Number(p.counter).toLocaleString() : ''}${kws.map(k => `<i class="kwtag">${KW_GLYPH[k] ? G(KW_GLYPH[k], 11) + ' ' : ''}${k}</i>`).join('')}${
        own ? ` · <span class="up">own ${own}</span>` : ''}${
        !ok ? ` · <span class="down">${!RULES.MAIN_TYPES.has(p.type) ? p.type + ' — not a main-deck card' : 'off-colour'}</span>` : ''}</span></div>
    <div class="cnt">${adding
      ? `<button data-dkadd="${p.id}" aria-label="Add one ${esc(p.name)}" ${ok ? '' : 'disabled'}>${G('plus', 18)}</button>`
      : `<button data-dkdec="${p.id}" aria-label="One fewer ${esc(p.name)}">${G('minus', 18)}</button><b>${n}</b><button data-dkinc="${p.id}" aria-label="One more ${esc(p.name)}">${G('plus', 18)}</button>`}</div>
  </div>`;
}
function paintDeckAdd() {
  const q = ($('#dkq').value || '').trim().toLowerCase();
  const L = dkCur.leader ? CAT.byId.get(dkCur.leader) : null;
  const ownOnly = $('#dkOwn').dataset.on === '1';
  const ownedIds = new Set(OWN.items.map(i => i.id));
  if (!q && !ownOnly) { $('#dkAddRes').innerHTML = ''; return; }

  const byNum = new Map();
  for (const p of CAT.rows) {
    if (!p.num || !RULES.MAIN_TYPES.has(p.type)) continue;
    if (q && !(p.full + ' ' + p.num + ' ' + (p.subtypes || '')).toLowerCase().includes(q)) continue;
    if (ownOnly && !ownedIds.has(p.id)) continue;
    const cur = byNum.get(p.num);
    const better = !cur || (ownedIds.has(p.id) && !ownedIds.has(cur.id)) ||
                   (ownedIds.has(p.id) === ownedIds.has(cur.id) && (p.market || 9e9) < (cur.market || 9e9));
    if (better) byNum.set(p.num, p);
  }
  const hits = [...byNum.values()].sort((a, b) => {
    const la = (!L || colourLegal(a, L)) ? 0 : 1, lb = (!L || colourLegal(b, L)) ? 0 : 1;
    return la - lb || a.name.localeCompare(b.name);
  }).slice(0, 30);
  $('#dkAddRes').innerHTML = hits.length ? `<div class="panel">${hits.map(p => deckRow(p, 0, L, true)).join('')}</div>` : '';
}
function deckAdd(id, delta) {
  const p = CAT.byId.get(id); if (!p) return;
  let row = dkCur.cards.find(c => c.id === id);
  if (!row && delta > 0) { row = { id, n: 0 }; dkCur.cards.push(row); }
  if (!row) return;
  const A = analysis(dkCur);
  const numCount = (A.byNum[p.num] || 0) - row.n;
  if (delta > 0 && !anyNumber(p) && numCount + row.n + 1 > RULES.MAX_COPIES) {
    toast(`Already ${RULES.MAX_COPIES} of ${p.num} (§5-1-2-3)`); return;
  }
  row.n += delta;
  if (row.n <= 0) dkCur.cards = dkCur.cards.filter(c => c !== row);
  DECKS.save(); paintDeck();
}
CLICKS.on('[data-dkadd],[data-dkinc],[data-dkdec]', e => {
  const a = e.target.closest('[data-dkadd]'); if (a) return deckAdd(+a.dataset.dkadd, 1);
  const i = e.target.closest('[data-dkinc]'); if (i) return deckAdd(+i.dataset.dkinc, 1);
  const d = e.target.closest('[data-dkdec]'); if (d) return deckAdd(+d.dataset.dkdec, -1);
});
$('#dkq').addEventListener('input', paintDeckAdd);
$('#dkBrowse').addEventListener('click', () => { CD.forDeck = true; go('cards'); });
$('#dkOwn').addEventListener('click', () => {
  const b = $('#dkOwn'), on = b.dataset.on !== '1'; b.dataset.on = on ? '1' : '0';
  b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); paintDeckAdd();
});
$('#dkName').addEventListener('input', e => { dkCur.name = e.target.value; DECKS.save(); });

let lpColour = null;
function leadersByNumber() {
  const ownedIds = new Set(OWN.items.map(i => i.id));
  const byNum = new Map();
  for (const p of CAT.rows) {
    if (p.type !== 'Leader' || !p.num) continue;
    const cur = byNum.get(p.num);
    const better = !cur || (ownedIds.has(p.id) && !ownedIds.has(cur.id)) ||
                   (ownedIds.has(p.id) === ownedIds.has(cur.id) && (p.market || 9e9) < (cur.market || 9e9));
    if (better) byNum.set(p.num, p);
  }
  return [...byNum.values()];
}
function paintLeaderPick() {
  const q = ($('#lpq').value || '').trim().toLowerCase();
  const ownedIds = new Set(OWN.items.map(i => i.id));
  $('#lpColours').innerHTML = COLORS.map(c =>
    `<button class="chip${lpColour === c ? ' on' : ''}" data-lpc="${c}" aria-label="${esc(c)}" aria-pressed="${lpColour === c}">
       <i style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;
          vertical-align:-1px;background:var(--c-${CCLASS[c]})"></i>${c}</button>`).join('');
  let list = leadersByNumber();
  if (q) list = list.filter(p => (p.full + ' ' + p.num + ' ' + (p.subtypes || '')).toLowerCase().includes(q));
  if (lpColour) list = list.filter(p => colsOf(p).includes(lpColour));

  list.sort((a, b) => (ownedIds.has(b.id) - ownedIds.has(a.id)) ||
    ((CAT.sets.get(b.set) || {}).pub || '').localeCompare((CAT.sets.get(a.set) || {}).pub || ''));
  $('#lpList').innerHTML = list.slice(0, 40).map(p => `
    <button class="opt" data-lp="${p.id}">
      <div class="oa">${refArt(p)}<div class="ph">${esc((p.num || '').split('-').pop() || '')}</div></div>
      <div class="oi"><b>${esc(p.name)}</b>
        <span>${esc(p.num)} · ${p.life || '?'} life · ${esc((CAT.sets.get(p.set) || {}).abbr || '')}${
          ownedIds.has(p.id) ? ' · <span class="up">you own this</span>' : ''}</span></div>
      <div class="op">${colourDots(p)}</div>
    </button>`).join('') || '<div class="note">No Leader matches.</div>';
}
$('#dkLead').addEventListener('click', () => { $('#lpq').value = ''; lpColour = null; paintLeaderPick(); $('#leaderPick').classList.add('on'); });
$('#lpq').addEventListener('input', paintLeaderPick);
$('#lpCancel').addEventListener('click', () => $('#leaderPick').classList.remove('on'));
CLICKS.on('[data-lpc],[data-lp]', e => {
  const c = e.target.closest('[data-lpc]'); if (c) { lpColour = lpColour === c.dataset.lpc ? null : c.dataset.lpc; paintLeaderPick(); return; }
  const l = e.target.closest('[data-lp]'); if (!l) return;
  dkCur.leader = +l.dataset.lp; DECKS.save();
  $('#leaderPick').classList.remove('on'); paintDeck();
});

let ppRow = null;
CLICKS.on('.dkrow .n', e => {
  const n = e.target.closest('.dkrow .n'); if (!n) return;
  const row = n.closest('[data-dk]'); if (!row || !dkCur) return;
  const cur = CAT.byId.get(+row.dataset.dk); if (!cur) return;
  const entry = dkCur.cards.find(c => c.id === cur.id); if (!entry) return;
  const sibs = CAT.byNum.get(cur.num) || [];
  if (sibs.length < 2) return toast('Only one printing of ' + cur.num);
  ppRow = entry;
  const ownedQ = id => OWN.items.filter(i => i.id === id).reduce((a, i) => a + i.qty, 0);
  $('#ppTitle').textContent = `Which ${cur.num} is in the deck?`;
  $('#ppList').innerHTML = sibs.slice().sort((a, b) => (b.market || 0) - (a.market || 0)).map(p => `
    <button class="opt${p.id === cur.id ? ' best' : ''}" data-pp="${p.id}">
      <div class="oa">${refArt(p)}<div class="ph">${esc((p.num || '').split('-').pop() || '')}</div></div>
      <div class="oi"><b>${esc(TREAT[p.treat] || p.treat)}${p.prov ? ' · ' + esc(p.prov) : ''}</b>
        <span>${esc((CAT.sets.get(p.set) || {}).abbr || '')}${ownedQ(p.id) ? ` · <span class="up">you own ${ownedQ(p.id)}</span>` : ''}${
          p.id === cur.id ? ' · in the deck now' : ''}</span></div>
      <div class="op mono">${money(p.market)}</div>
    </button>`).join('');
  $('#printPick').classList.add('on');
});
$('#ppCancel').addEventListener('click', () => $('#printPick').classList.remove('on'));
CLICKS.on('[data-pp]', e => {
  const b = e.target.closest('[data-pp]'); if (!b || !ppRow) return;
  const to = +b.dataset.pp;
  const existing = dkCur.cards.find(c => c.id === to && c !== ppRow);
  if (existing) { existing.n += ppRow.n; dkCur.cards = dkCur.cards.filter(c => c !== ppRow); }
  else ppRow.id = to;
  DECKS.save(); $('#printPick').classList.remove('on'); paintDeck();
});
$('#dkSave').addEventListener('click', () => {
  const isNew = !dkCur.saved;
  if (!CREDITS.canSaveDeck(isNew)) {
    toast('A deck save needs a credit \u2014 watch a short ad');
    ADS.show('deck'); return;
  }
  if (isNew) { CREDITS.spendDeck(); dkCur.saved = true; }
  DECKS.save(); scheduleBackup('deck');
  toast(analysis(dkCur).legal ? 'Saved — legal deck' : 'Saved (not yet legal)'); go('decks');
});
$('#dkDelete').addEventListener('click', () => {
  if (!confirm(`Delete "${dkCur.name || 'this deck'}"?`)) return;
  DECKS.list = DECKS.list.filter(d => d !== dkCur); DECKS.save(); go('decks');
});

function parseListLine(raw) {
  const line = raw.trim(); if (!line || line.startsWith('#')) return null;
  const NUM = '((?:OP|ST|EB|PRB|LT|P)-?\\d{0,2}-\\d{3})';
  let m = line.match(new RegExp('^(\\d+)\\s*x?\\s*' + NUM, 'i'));
  if (m) return [m[0], m[1], m[2]];
  m = line.match(new RegExp('^' + NUM + '\\s*x\\s*(\\d+)', 'i'));
  if (m) return [m[0], m[2], m[1]];
  m = line.match(new RegExp('^' + NUM + '\\s*:\\s*(\\d+)\\s*$', 'i'));
  if (m) return [m[0], m[2], m[1]];
  m = line.match(new RegExp('^' + NUM + '(?:\\s|$)', 'i'));
  if (m) return [m[0], '1', m[1]];
  return null;
}

const DECK_FORMATS = 'One card a line: <b>4xOP01-016</b>, <b>4x OP01-016</b>, <b>4 OP01-016 Nami</b>, <b>OP01-016 x4</b>, or a number alone for one. '
  + 'Or <b>OP01-016:4</b> pairs split by commas, or a deck builder\u2019s whole link. A Leader line sets the Leader; a line it cannot read is listed, not dropped.';

function deckLines(txt) {
  const s = String(txt || ''), link = s.match(/[?&]deck=([^&\s#]+)/i);
  let body = s;
  if (link) { try { body = decodeURIComponent(link[1]); } catch (e) { body = link[1]; } }
  const PAIRS = /^\s*(?:[A-Z]{1,3}-?\d{0,2}-\d{3}\s*:\s*\d+\s*(?:,\s*|$))+$/i;
  return body.split(/\r?\n/).flatMap(l => (PAIRS.test(l) ? l.split(',') : [l])).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
}

function importDeckText(deck, txt) {
  const ownedIds = new Set(OWN.items.map(i => i.id));
  const pickPrinting = num => {
    const sibs = (CAT.byNum.get(num) || []).filter(p => p.num === num);
    if (!sibs.length) return null;
    return sibs.find(p => ownedIds.has(p.id)) ||
           sibs.slice().sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0];
  };
  let added = 0; const unknown = [];
  for (const line of deckLines(txt)) {
    const m = parseListLine(line);
    if (!m) { unknown.push(line.slice(0, 30)); continue; }
    const n = +m[1], num = m[2].toUpperCase();
    const p = pickPrinting(num);
    if (!p) { unknown.push(num); continue; }
    if (p.type === 'Leader') { deck.leader = p.id; continue; }
    let row = deck.cards.find(c => c.id === p.id);
    if (!row) { row = { id: p.id, n: 0 }; deck.cards.push(row); }
    row.n += n; added += n;
  }
  return { added, unknown };
}
function importReport(res) {
  toast(`Imported ${res.added} card${res.added === 1 ? '' : 's'}` + (res.unknown.length ? ` · ${res.unknown.length} unrecognised` : ''));
  if (res.unknown.length) alert('Not recognised:\n' + res.unknown.slice(0, 12).join('\n'));
}
$('#dkImport').addEventListener('click', async () => {
  const txt = await ask({ title: 'Import a deck list', kind: 'multiline', ok: 'Import', why: DECK_FORMATS,
    placeholder: '1 ST01-001 Monkey.D.Luffy\n4 OP01-016 Nami\n4 OP01-025 Roronoa Zoro' });
  if (!txt) return;
  const res = importDeckText(dkCur, txt);
  DECKS.save(); paintDeck(); importReport(res);
});

function importDeckNew(txt) {
  const d = DECKS.blank(), res = importDeckText(d, txt);
  if (!res.added && !d.leader) { importReport(res); return null; }
  const L = d.leader ? CAT.byId.get(d.leader) : null;
  d.name = L ? L.name : 'Imported deck';
  DECKS.list.push(d); DECKS.save(); openDeck(d.id); importReport(res);
  return d;
}

let QR_LIB = null;
function loadQr() {
  if (window.jsQR) return Promise.resolve(window.jsQR);
  if (!QR_LIB) QR_LIB = new Promise(res => {
    const s = document.createElement('script'); s.src = 'vendor/jsqr.js';
    s.onload = () => res(window.jsQR || null); s.onerror = () => { QR_LIB = null; res(null); };
    document.head.appendChild(s);
  });
  return QR_LIB;
}

async function decodeQr(src) {
  const jsQR = await loadQr(); if (!jsQR) return { error: 'The QR reader could not load' };
  const img = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  if (!img || !img.naturalWidth) return { error: 'That picture could not be opened' };
  const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height), code = jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' });
  return code && code.data ? { text: code.data } : { error: 'No QR code found in that picture' };
}
async function importDeckQr(src) {
  const r = await decodeQr(src);
  if (r.error) { toast(r.error); return null; }
  if (!deckLines(r.text).some(l => parseListLine(l))) { toast('That QR code holds no deck list'); return null; }
  return importDeckNew(r.text);
}

function pickDeckImage() {
  if (PLATFORM.cap()) return PLATFORM.pickImage();
  return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/png,image/jpeg,image/webp,image/gif';
    i.onchange = () => res(i.files && i.files[0] ? URL.createObjectURL(i.files[0]) : null); i.click(); });
}
$('#dkImportNew').addEventListener('click', async () => {
  const how = await PICKER.choose({ title: 'Import a deck', key: 'imp', outside: true,
    why: 'From a list you paste, a deck builder\u2019s link, or a picture of a deck\u2019s QR code.',
    opts: `<button class="opt" data-imp="list"><div class="oi"><b>A list or a link</b><span>Pasted: 4xOP01-016 a line, OP01-016:4 pairs, or the whole link</span></div></button>`
      + `<button class="opt" data-imp="qr"><div class="oi"><b>A QR code</b><span>A photo or a screenshot of it</span></div></button>` });
  if (how === 'list') {
    const txt = await ask({ title: 'Import a deck', kind: 'multiline', ok: 'Import', why: DECK_FORMATS, placeholder: '1xOP18-022\n4xEB02-017\n4xOP18-025' });
    if (txt) importDeckNew(txt);
  } else if (how === 'qr') {
    const src = await pickDeckImage();
    if (!src) return toast(PLATFORM.cap() ? 'No image chosen' : 'No picture chosen');
    importDeckQr(src);
  }
});

$('#dkExport').addEventListener('click', () => {
  const A = analysis(dkCur);
  const lines = [`# ${dkCur.name || 'Untitled'}`, A.leader ? `1 ${A.leader.num} ${A.leader.name} (Leader)` : '# no leader', ''];
  A.rows.forEach(r => lines.push(`${r.n} ${r.p.num} ${r.p.name}`));
  lines.push('', `# ${A.total}/50 · ${A.legal ? 'legal' : A.problems.length + ' issues'} · OP TCG Hub`);
  const txt = lines.join('\n');
  if (navigator.share) navigator.share({ title: dkCur.name || 'Deck', text: txt }).catch(() => {});
  else { navigator.clipboard && navigator.clipboard.writeText(txt); toast('Deck list copied'); }
});

const TRADE = {
  give: readJson('vault.trade.give', []),
  get:  readJson('vault.trade.get', []),
  save() { saveJson('vault.trade.give', this.give);
           saveJson('vault.trade.get', this.get); scheduleBackup('lists'); },
  add(side, id, n = 1) {
    const L = this[side]; const r = L.find(x => x.id === id);
    if (r) r.n += n; else L.push({ id, n }); this.save();
  },
  bump(side, id, d) {
    const L = this[side]; const r = L.find(x => x.id === id); if (!r) return;
    r.n += d; if (r.n <= 0) this[side] = L.filter(x => x !== r); this.save();
  },
  value(side) { return this[side].reduce((a, r) => { const p = CAT.byId.get(r.id); return a + (p ? (p.market || 0) * r.n : 0); }, 0); },
  low(side)   { return this[side].reduce((a, r) => { const p = CAT.byId.get(r.id); return a + (p ? (p.low || p.market || 0) * r.n : 0); }, 0); },
  high(side)  { return this[side].reduce((a, r) => { const p = CAT.byId.get(r.id); return a + (p ? (p.high || p.market || 0) * r.n : 0); }, 0); }
};
function tradeRow(side, r) {
  const p = CAT.byId.get(r.id); if (!p) return '';
  const own = OWN.items.filter(i => i.id === p.id).reduce((a, i) => a + i.qty, 0);
  return `<div class="dkrow" data-tr="${side}:${p.id}">
    ${cardPic(p, THUMB.s)}
    <div class="n"><b>${esc(p.name)}${p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
      <span>${dotJoin(esc(p.num), money(p.market) + ' each')}${side === 'give' && own < r.n ? ` \u00b7 <span class="down">you own ${own}</span>` : ''}${side === 'get' && r.have ? ' \u00b7 the copy in your collection' : ''}</span></div>
    <div class="cnt"><button data-trdec="${side}:${p.id}" aria-label="One fewer ${esc(p.name)}">${G('minus', 18)}</button><b>${r.n}</b><button data-trinc="${side}:${p.id}" aria-label="One more ${esc(p.name)}">${G('plus', 18)}</button></div>
  </div>`;
}
function paintTrade() {
  for (const side of ['give', 'get']) {
    const L = TRADE[side];
    $(side === 'give' ? '#trGive' : '#trGet').innerHTML = L.map(r => tradeRow(side, r)).join('') ||
      `<div class="note">${side === 'give' ? 'Nothing offered yet.' : 'Nothing asked for yet.'}</div>`;
    $(side === 'give' ? '#trGiveN' : '#trGetN').textContent = L.length ? money(TRADE.value(side)) : '';
  }
  const rb = $('#trRecord'); if (rb) rb.hidden = !(TRADE.give.length && TRADE.get.length);
  paintTrades();
  const gv = TRADE.value('give'), gt = TRADE.value('get'), d = gt - gv;
  const v = $('#trVerdict');
  if (!TRADE.give.length && !TRADE.get.length) { v.innerHTML = '<div class="note">Add cards to both sides and the difference appears here.</div>'; return; }
  const pct = gv > 0 ? 100 * d / gv : null;
  v.innerHTML = `
    <div class="row"><div class="nm"><b>You give</b><span>market \u00b7 low ${money(TRADE.low('give'))} to high ${money(TRADE.high('give'))}</span></div><div class="v mono">${money(gv)}</div></div>
    <div class="row"><div class="nm"><b>You get</b><span>market \u00b7 low ${money(TRADE.low('get'))} to high ${money(TRADE.high('get'))}</span></div><div class="v mono">${money(gt)}</div></div>
    <div class="row"><div class="nm"><b>Difference</b><span>${d > 0.005 ? 'in your favour' : d < -0.005 ? 'against you' : 'even'} at today’s market${pct != null ? ` \u00b7 ${signedPct(pct, true)}` : ''}</span></div>
      <div class="v mono ${d > 0.005 ? 'up' : d < -0.005 ? 'down' : 'flat'}">${signedMoney(d)}</div></div>
    <div class="note">Market prices estimate recent sales; low to high is the spread. Condition isn’t priced in, so what a card is worth to you is your call.</div>`;
}
function tradeSearch(side) {
  const q = ($(side === 'give' ? '#trGiveQ' : '#trGetQ').value || '').trim().toLowerCase();
  const out = $(side === 'give' ? '#trGiveRes' : '#trGetRes');
  if (!q) { out.innerHTML = ''; return; }
  let pool;
  const mine = new Set();
  if (side === 'give') {
    pool = OWN.items.map(i => CAT.byId.get(i.id)).filter(p => p && !mine.has(p.id) && mine.add(p.id));

    pool = pool.concat(CAT.rows.filter(p => p.num && !mine.has(p.id)));
  } else pool = CAT.rows.filter(p => p.num);
  const hits = pool.filter(p => (p.full + ' ' + p.num).toLowerCase().includes(q)).slice(0, 12);
  out.innerHTML = hits.length ? `<div style="border:1px solid var(--line);border-radius:var(--r-md);margin-bottom:8px">${hits.map(p =>
    `<button class="row" style="width:100%;text-align:left;padding:8px 10px;align-items:center" data-tradd="${side}:${p.id}">
      ${cardPic(p)}<div class="nm"><b>${esc(p.name)}${p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
      <span>${dotJoin(esc(p.num), esc((CAT.sets.get(p.set) || {}).abbr || ''), mine.has(p.id) ? 'in your collection' : '')}</span></div>
      <div class="v mono">${money(p.market)}</div></button>`).join('')}</div>` : '<div class="note">No match.</div>';
}
$('#trGiveQ').addEventListener('input', () => tradeSearch('give'));
$('#trGetQ').addEventListener('input', () => tradeSearch('get'));
CLICKS.on('[data-tradd],[data-trinc],[data-trdec]', e => {
  const a = e.target.closest('[data-tradd]'); if (a) { const [side, id] = a.dataset.tradd.split(':'); TRADE.add(side, +id);
    $(side === 'give' ? '#trGiveQ' : '#trGetQ').value = ''; tradeSearch(side); paintTrade(); return; }
  const i = e.target.closest('[data-trinc]'); if (i) { const [side, id] = i.dataset.trinc.split(':'); TRADE.bump(side, +id, 1); paintTrade(); return; }
  const d = e.target.closest('[data-trdec]'); if (d) { const [side, id] = d.dataset.trdec.split(':'); TRADE.bump(side, +id, -1); paintTrade(); return; }
});
$('#trPaste').addEventListener('click', async () => {
  const txt = await ask({ title: 'Their list', kind: 'multiline', ok: 'Add',
    why: 'One card per line, <b>4 OP01-016</b>. Each resolves to the likeliest printing; tap a row to swap it.',
    placeholder: '1 OP01-016 Nami\n2 OP05-119' });
  if (!txt) return;
  let added = 0, unknown = 0;
  for (const raw of txt.split(/\r?\n/)) {
    const m = parseListLine(raw);
    if (!m) { if (raw.trim()) unknown++; continue; }
    const sibs = (CAT.byNum.get(m[2].toUpperCase()) || []);

    const p = sibs.slice().sort((a, b) => likelihood(b, null) - likelihood(a, null))[0];
    if (!p) { unknown++; continue; }
    TRADE.add('get', p.id, +m[1]); added += +m[1];
  }
  paintTrade(); toast(`Added ${added}` + (unknown ? ` \u00b7 ${unknown} unrecognised` : ''));
});
$('#trClear').addEventListener('click', () => { TRADE.give = []; TRADE.get = []; TRADE.save(); paintTrade(); });
$('#trShare').addEventListener('click', () => {
  const line = side => TRADE[side].map(r => { const p = CAT.byId.get(r.id); return `${r.n} ${p.num} ${p.name}${p.treat !== 'base' ? ' (' + (TREAT[p.treat] || p.treat) + ')' : ''}`; }).join('\n');
  const gv = TRADE.value('give'), gt = TRADE.value('get');
  const txt = `Trade \u2014 ${dayText(new Date().toISOString(), { year: true })}\n\nI give (${money(gv)}):\n${line('give') || '\u2014'}\n\nI get (${money(gt)}):\n${line('get') || '\u2014'}\n\nDifference: ${signedMoney(gt - gv)} at TCGplayer market via OP TCG Hub`;
  if (navigator.share) navigator.share({ title: 'Trade', text: txt }).catch(() => {});
  else { navigator.clipboard && navigator.clipboard.writeText(txt); toast('Summary copied'); }
});

const TRADES = {
  list: readJson('vault.trades', []),
  save() { const ok = saveJson('vault.trades', this.list); scheduleBackup('lists'); return ok; }
};
const okTrade = t => !!t && typeof t === 'object' && Array.isArray(t.gave) && Array.isArray(t.got);
const trName = p => (p ? p.name + (p.treat !== 'base' ? ` (${TREAT[p.treat] || p.treat})` : '') : 'A printing no longer listed');
const cashText = c => (c > 0.005 ? `you added ${money(c)}` : c < -0.005 ? `they added ${money(-c)}` : 'card for card');
const curNote = () => (CUR.active() === 'USD' ? ', in USD' : `, in ${esc(curLabel(CUR.active()))}, converted (≈)`);

function agreedPct(agreed, market) {
  if (!(market > 0) || !(agreed >= 0)) return '';
  const p = 100 * agreed / market, d = Math.abs(p - 100);
  return `${pctNum(p)} of market` + (pctNum(d) === '0.0%' ? '' : p < 100 ? ` (${pctNum(d)} off)` : ` (${pctNum(d)} over)`);
}

function agreedLive(t, m) { const x = typedAmount(t); return x >= 0 && m > 0 ? agreedPct(x > 0 ? fromShown(x) : 0, m) : ''; }

function marketOn(p, day) {
  if (!p) return null;
  if (!day || day >= phoneToday()) return p.market > 0 ? p.market : null;
  const h = priceOn(p, day); return h ? h.v : null;
}

function tradeSums(t) {
  const sum = (L, f) => L.reduce((a, r) => { const v = f(r); return a == null || v == null ? null : a + v * r.n; }, 0);
  const now = r => { const p = CAT.byId.get(r.id); return p && p.market > 0 ? p.market : null; };
  const cash = t.cash || 0, s = { gaveThen: sum(t.gave, r => r.then), gotThen: sum(t.got, r => r.then),
    gaveNow: sum(t.gave, now), gotNow: sum(t.got, now), agreed: sum(t.gave, r => r.agreed) };
  s.cost = s.agreed == null ? null : s.agreed + cash;
  s.then = s.gaveThen == null || s.gotThen == null ? null : s.gotThen - s.gaveThen - cash;
  s.now = s.gaveNow == null || s.gotNow == null ? null : s.gotNow - s.gaveNow - cash;
  return s;
}

function tradeShares(got, cost) {
  const known = got.every(r => r.then > 0), total = got.reduce((a, r) => a + (known ? r.then : 1) * r.n, 0);
  return got.map(r => (total > 0 && cost > 0 ? Math.round(cost * (known ? r.then : 1) / total * 100) / 100 : 0));
}

function tradeLine(id, have) {
  const L = OWN.lines(id);
  return (have && L.find(i => i.condition === have.condition && (i.pf || 'main') === (have.pf || 'main'))) || OWN.line(id) || L[0] || null;
}

function tradeIn(id, n, each, have) {
  let it = have ? tradeLine(id, have === true ? null : have) : null, others, old;
  if (it) { if (it.qty < n) it.qty = n; others = it.qty - n; old = it.paid || 0; }
  else { const ex = OWN.line(id, 'NM'); others = ex ? ex.qty : 0; old = ex ? ex.paid || 0 : 0; it = OWN.add(id, { qty: n, save: false }); }
  if (!(each > 0)) return false;
  if (!others) { it.paid = each; return true; }
  if (old > 0) { it.paid = Math.round((old * others + each * n) / (others + n) * 100) / 100; return true; }
  return false;
}

function tradeOutPlan(gave) {
  const plan = [], here = OWN.target();
  for (const r of gave) {
    let left = r.n;
    const L = OWN.lines(r.id).sort((a, b) => ((b.pf || 'main') === here) - ((a.pf || 'main') === here));
    for (const it of L) { if (left <= 0) break; const k = Math.min(left, it.qty); if (k > 0) { plan.push({ it, k }); left -= k; } }
  }
  return plan;
}

async function recordTrade() {
  const P = r => CAT.byId.get(r.id), gave = TRADE.give.filter(P), got = TRADE.get.filter(P);
  if (!gave.length || !got.length) { toast('Add what you gave and what you got first'); return false; }
  const today = phoneToday();
  const dv = await ask({ title: 'When was the trade?', kind: 'date', value: today, ok: 'Next',
    why: 'Its day prices it: that day’s market for every card on both sides, or the last day on file before it.' });
  if (dv === null) return false;
  const day = /^\d{4}-\d\d-\d\d$/.test(dv) && dv <= today ? dv : '';
  if (!day) { toast('Not a day on or before today'); return false; }
  const when = day === today ? 'today' : 'on ' + dayText(day);

  const give = [];
  for (const r of gave) {
    const p = P(r), m = marketOn(p, day);
    const v = await ask({ title: trName(p), kind: 'number', ok: 'Next', placeholder: '0.00', value: m ? toShown(m) : '',
      why: `The value agreed for it, per copy${r.n > 1 ? ` (you gave ${r.n})` : ''}${curNote()}. ` +
           (m ? `Its market ${esc(when)} was ${money(m)}: leave that if you agreed no other value.` : `No market on file ${esc(when)}.`),
      live: t => agreedLive(t, m) });
    if (v === null) return false;
    const x = typedAmount(v);
    if (!(x >= 0)) { toast('Not a number'); return false; }
    give.push({ id: p.id, n: r.n, agreed: x > 0 ? Math.round(fromShown(x) * 100) / 100 : 0, then: m });
  }

  const who = await PICKER.choose({ title: 'Money in the trade', key: 'trcash', why: 'Did money change hands on top of the cards?',
    opts: [['none', 'Card for card', 'No money either way'], ['me', 'I added money', 'You paid on top of your cards'],
           ['them', 'They added money', 'They paid you on top of their cards']]
      .map(([k, b, s]) => `<button class="opt" data-trcash="${k}"><div class="oi"><b>${b}</b><span>${s}</span></div></button>`).join('') });
  if (!who) return false;
  let cash = 0;
  if (who !== 'none') {
    const agreed = give.reduce((a, r) => a + r.agreed * r.n, 0), sign = who === 'me' ? 1 : -1;
    const v = await ask({ title: who === 'me' ? 'Money you added' : 'Money they added', kind: 'number', ok: 'Next', placeholder: '0.00',
      why: `In all, not per card${curNote()}.`,
      live: t => { const x = typedAmount(t); return x > 0 ? `What you got cost you ${money(Math.max(0, agreed + sign * fromShown(x)))}` : ''; } });
    if (v === null) return false;
    const x = typedAmount(v);
    if (!(x > 0)) { toast('Not a number'); return false; }
    cash = Math.round(sign * fromShown(x) * 100) / 100;
  }

  const held = got.filter(r => !r.have && OWN.lines(r.id).length > 0);
  let haveAll = false;
  if (held.length) {
    const pl = held.length > 1 || held.some(r => r.n > 1);
    const h = await PICKER.choose({ title: 'Already in your collection', key: 'trhave',
      why: `You have ${held.map(r => esc(trName(P(r)))).join(', ')} already. ${pl ? 'Are those the copies' : 'Is that the copy'} from this trade?`,
      opts: `<button class="opt" data-trhave="have"><div class="oi"><b>${pl ? 'Yes, the copies I have' : 'Yes, the copy I have'}</b><span>What you paid is set on ${pl ? 'them' : 'it'}; nothing is added</span></div></button>` +
            `<button class="opt" data-trhave="new"><div class="oi"><b>No, add ${pl ? 'them' : 'it'}</b><span>With what the trade cost you</span></div></button>` });
    if (!h) return false;
    haveAll = h === 'have';
  }
  const plan = tradeOutPlan(give);
  const out = plan.length > 0 && confirm('Take what you gave out of your collection?\n\n' +
    plan.map(x => `${trName(CAT.byId.get(x.it.id))}, ${COND_NAMES[x.it.condition] || x.it.condition}, ×${x.k}, ${PF.name(x.it.pf || 'main')}`).join('\n') +
    '\n\nCancel keeps them in it. The trade is recorded either way.');
  const rec = { id: 'tr' + Date.now().toString(36), at: new Date().toISOString(), day, cash, gave: give,
                got: got.map(r => ({ id: r.id, n: r.n, then: marketOn(P(r), day) })) };
  tradeShares(rec.got, tradeSums(rec).cost).forEach((v, k) => { rec.got[k].paid = v; });

  TRADES.list.unshift(rec);
  if (!saveJson('vault.trades', TRADES.list)) { TRADES.list.shift(); toast('The trade could not be saved on this phone; nothing changed'); return false; }
  const unset = rec.got.filter((r, k) => !tradeIn(r.id, r.n, r.paid, got[k].have || (haveAll ? true : null)) && r.paid > 0).map(r => trName(P(r)));
  if (out) { plan.forEach(x => { x.it.qty -= x.k; }); OWN.items = OWN.items.filter(i => i.qty > 0 || !plan.some(x => x.it === i)); }
  commitOwn('trade');
  TRADE.give = []; TRADE.get = []; TRADE.save();
  paintTrade();
  const g = rec.got.length === 1 ? `${trName(P(rec.got[0]))} ${rec.got[0].paid > 0 ? `cost you ${money(rec.got[0].paid)}${rec.got[0].n > 1 ? ' a copy' : ''}` : 'came free'}`
                                 : `${rec.got.length} cards in at what they cost you`;
  toast(`Trade recorded · ${g}` + (unset.length ? ` · What you paid left as it was on ${unset.join(', ')}: its other copies have none` : ''), unset.length ? 6000 : undefined);
  return rec;
}

function tradeFor(p, it) {
  const have = it ? { condition: it.condition, pf: it.pf || 'main' } : null;
  const r = TRADE.get.find(x => x.id === p.id);
  if (r) { if (have) r.have = have; } else TRADE.get.push({ id: p.id, n: 1, ...(have ? { have } : {}) });
  TRADE.save();
  toast(`In Trade: you get ${p.name} — add what you gave, then Record this trade`);
  go('trade'); return true;
}

function tradeCard(t) {
  const s = tradeSums(t), cls = d => (d > 0.005 ? 'up' : d < -0.005 ? 'down' : 'flat');

  const move = (a, b) => { if (!(a > 0 && b > 0)) return ''; const p = 100 * (b - a) / a;
    return pctNum(p) === '0.0%' ? '' : `<span class="${cls(b - a)}">${signedPct(p, true)}</span> \u00b7 `; };
  const row = (r, side) => {
    const p = CAT.byId.get(r.id), now = p && p.market > 0 ? p.market : null;
    const what = side === 'gave' ? `agreed ${money(r.agreed)}${r.then > 0 ? ', ' + agreedPct(r.agreed, r.then) : ''}` : r.paid > 0 ? `cost you ${money(r.paid)}` : 'came free';
    return `<div class="row"><div class="nm"><b>${side === 'gave' ? 'Gave' : 'Got'} ${p ? esc(p.name) : 'a printing no longer listed'}${p && p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}${r.n > 1 ? ` ×${r.n}` : ''}</b>
      <span>${dotJoin(p ? esc(p.num) : '', what)}</span></div>
      <div class="v mono">${money(now)}<span>${move(r.then, now)}was ${money(r.then)}</span></div></div>`;
  };
  const stand = s.now == null ? 'a card has no market today' : s.now > 0.005 ? 'ahead today' : s.now < -0.005 ? 'behind today' : 'even today';
  return `<div class="trrec" data-trid="${esc(t.id)}">
    <div class="row"><div class="nm"><b>${esc(dayText(t.day))}</b><span>${esc(cashText(t.cash || 0))}</span></div>
      <div class="v mono ${s.now == null ? 'flat' : cls(s.now)}">${s.now == null ? '—' : signedMoney(s.now)}<span>${stand}</span></div></div>
    ${t.gave.map(r => row(r, 'gave')).join('')}${t.got.map(r => row(r, 'got')).join('')}
    <div class="note">${s.then == null ? 'A card had no market on the day.' : `On the day, at its market: ${signedMoney(s.then)}, ${s.then > 0.005 ? 'in your favour' : s.then < -0.005 ? 'against you' : 'even'}.`}${s.then != null && s.now != null && Math.abs(s.now - s.then) >= 0.005 ? ` Since then: ${signedMoney(s.now - s.then)}.` : ''}</div>
    <button class="linkish" data-trdel="${esc(t.id)}">Remove this record</button>
  </div>`;
}
function paintTrades() {
  const box = $('#trLog'); if (!box) return;
  const L = TRADES.list.filter(okTrade);
  box.innerHTML = '<h3>Your trades</h3>' + (L.length ? L.map(tradeCard).join('')
    : '<div class="note">A trade you record is kept here: what you gave and got, at that day’s market and at today’s, so you can see how it has held up.</div>');
}

function removeTrade(id) {
  const t = TRADES.list.find(x => x && x.id === id); if (!t) return false;
  if (!confirm(`Remove the record of your trade of ${dayText(t.day)}?\n\nYour collection stays as it is: what the trade added or took out is not undone.`)) return false;
  TRADES.list = TRADES.list.filter(x => x !== t); TRADES.save(); paintTrades(); toast('Trade record removed'); return true;
}
$('#trRecord').addEventListener('click', () => recordTrade());
$('#trLog').addEventListener('click', e => { const b = e.target.closest('[data-trdel]'); if (b) removeTrade(b.dataset.trdel); });

const GUIDE_KEY = 'optcghub.guide.v3';

const GUIDE = [
  { g: 'scancard', t: 'Collect', p: 'Scan a card and it is valued the day you add it.', l: ['Scan', 'Value', 'Back up'], pic: () => topCard() },
  { g: 'leader', t: 'Prep & Play', p: 'Build a deck against the official rules, then play it on one phone.', l: ['Decks', 'Cards', 'Play'], pic: () => (heroLeader() || {}).L || null },
  { g: 'box', t: 'Hunt', p: 'Sealed prices, what is in stock at stores near you, and the events and releases coming up.', l: ['Sealed', 'Local stock', 'Events', 'Releases'], pic: () => (newestTop() || {}).p || null },
  { g: 'scancard', t: 'Yours, offline', p: 'Everything works with no signal, and nothing you do is sent anywhere.', l: ['Export', 'Restore', 'No account'], pic: null }
];

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
function guideOpen() {
  const g = $('#tour'); if (!g) return;
  while (closeAnyOverlay()) {}
  guideFrom = (typeof document !== 'undefined' && document.activeElement) || null;
  const cards = $('#tourCards'); if (cards) cards.innerHTML = GUIDE.map(guideCard).join('');
  guidePage = 0; g.hidden = false; g.classList.add('on'); guidePaint();
  if (typeof g.focus === 'function') { try { g.focus(); } catch (e) {} }
}

function guidePaintDots() {
  const n = GUIDE.length, last = guidePage === n - 1;
  const dots = $('#tourDots'); if (dots) dots.innerHTML = GUIDE.map((_, i) => `<i class="${i === guidePage ? 'on' : ''}"></i>`).join('');
  const pg = $('#tourPage'); if (pg) pg.textContent = `Page ${guidePage + 1} of ${n}`;
  for (const [id, show] of [['#tourSkip', !last], ['#tourNext', !last], ['#tourLook', last], ['#tourStart', last]]) { const b = $(id); if (b) b.hidden = !show; }
}

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

function guideStart() { guideClose(true); if (MODE.cur !== 'collect') MODE.set('collect'); go('scan'); }
$('#tourNext').addEventListener('click', () => guideGo(guidePage + 1));
$('#tourSkip').addEventListener('click', () => guideClose(true));
$('#tourLook').addEventListener('click', () => guideClose(true));
$('#tourStart').addEventListener('click', guideStart);
$('#tour').addEventListener('keydown', e => { if (e.key === 'ArrowRight') guideGo(guidePage + 1); else if (e.key === 'ArrowLeft') guideGo(guidePage - 1); else if (e.key === 'Escape') guideClose(false); });

$('#tourCards').addEventListener('scroll', () => {
  clearTimeout(guideSyncT); guideSyncT = setTimeout(() => {
    if (guideScrolling) return; const c = $('#tourCards'); const first = c && c.children ? c.children[0] : null; if (!first) return;
    const pg = Math.round(c.scrollLeft / (first.offsetWidth + 16));
    if (pg !== guidePage && pg >= 0 && pg < GUIDE.length) { guidePage = pg; guidePaintDots(); } }, 100);
});

function ask({ title, why = '', kind = 'text', value = '', placeholder = '', ok = 'OK', rows = 6, live = null }) {
  return new Promise(resolve => {
    $('#askTitle').textContent = title; $('#askWhy').innerHTML = why; $('#askOk').textContent = ok;
    $('#askField').innerHTML = (kind === 'multiline'
      ? `<textarea id="askIn" aria-labelledby="askTitle" rows="${rows}" placeholder="${esc(placeholder)}"
           style="width:100%;padding:10px;font:16px/1.45 ui-monospace,monospace;resize:vertical">${esc(value)}</textarea>`
      : `<div class="search" style="margin:0"><input id="askIn" aria-labelledby="askTitle" type="${kind === 'date' ? 'date' : 'text'}"
           inputmode="${kind === 'number' ? 'decimal' : 'text'}" placeholder="${esc(placeholder)}" value="${esc(value)}"></div>`)
      + (live ? '<div class="note mono" id="askLive" aria-live="polite" style="margin:8px 0 0"></div>' : '');
    const askIn = $('#askIn'), paintLive = () => { const o = $('#askLive'); if (o) o.innerHTML = live(((askIn && askIn.value) || '').trim()) || ''; };
    if (live && askIn && askIn.addEventListener) { askIn.addEventListener('input', paintLive); paintLive(); }
    const done = v => { $('#askSheet').classList.remove('on'); cleanup(); resolve(v); };
    const onOk = () => done(($('#askIn').value || '').trim());
    const onCancel = () => done(null);
    const onKey = e => { if (e.key === 'Enter' && kind !== 'multiline') { e.preventDefault(); onOk(); } if (e.key === 'Escape') onCancel(); };
    function cleanup() { $('#askOk').removeEventListener('click', onOk); $('#askCancel').removeEventListener('click', onCancel);
                         document.removeEventListener('keydown', onKey); }
    $('#askOk').addEventListener('click', onOk); $('#askCancel').addEventListener('click', onCancel);
    document.addEventListener('keydown', onKey);
    $('#askSheet').classList.add('on');
    setTimeout(() => { const i = $('#askIn'); if (i) { i.focus(); if (kind !== 'multiline' && kind !== 'date') i.select(); } }, 60);
  });
}

const MODE = {
  cur: localStorage.getItem('vault.mode') || 'collect',
  home: { collect: 'home', play: 'decks', hunt: 'sealed' },
  navFor: { collect: '#navCollect', play: '#navPlay', hunt: '#navHunt' },
  set(m, navigate = true) {
    this.cur = m; saveJson('vault.mode', m);
    const root = document.documentElement; if (root && root.dataset) root.dataset.mode = m;
    $('#modeSlider').classList.toggle('play', m === 'play'); $('#modeSlider').classList.toggle('hunt', m === 'hunt');

    $$('#modeSlider button').forEach(b => { const on = b.dataset.mode === m; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    $('#navCollect').hidden = m !== 'collect'; $('#navPlay').hidden = m !== 'play'; $('#navHunt').hidden = m !== 'hunt';
    if (navigate) go(this.home[m]);
  }
};

const THEME = {
  cur: (v => v === 'light' || v === 'system' ? v : 'dark')(localStorage.getItem('vault.theme')),
  _mq: null,
  mq() {
    if (!this._mq) { try { if (typeof matchMedia === 'function') { this._mq = matchMedia('(prefers-color-scheme: dark)'); const on = () => { if (THEME.cur === 'system') THEME.apply(); };
      if (this._mq.addEventListener) this._mq.addEventListener('change', on); else if (this._mq.addListener) this._mq.addListener(on); } } catch (e) { this._mq = null; } }
    return this._mq;
  },
  applied() { if (this.cur !== 'system') return this.cur; const m = this.mq(); return m && !m.matches ? 'light' : 'dark'; },
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
  if (MODE._swiped) return;
  const b = e.target.closest('[data-mode]'); if (!b || b.dataset.mode === MODE.cur) return;
  slideMode(b.dataset.mode);
});

(() => {
  const bar = $('.modebar'), knob = $('#modeSlider .knob'); if (!bar || !bar.addEventListener || !knob || !knob.style) return;
  let sw = null;
  bar.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; sw = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, w: knob.getBoundingClientRect ? knob.getBoundingClientRect().width : 0, held: false }; });
  bar.addEventListener('pointermove', e => {
    if (!sw || e.pointerId !== sw.id) return; sw.dx = e.clientX - sw.x; const dy = e.clientY - sw.y;
    if (!sw.held) {
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

const PLAY = { p: [{ name: 'Player 1', leader: null, life: 5, don: 0, given: 0 },
                   { name: 'Player 2', leader: null, life: 5, don: 0, given: 0 }], turn: 1, first: 0,

  hotseat: localStorage.getItem('vault.hotseat') === '1',
  who() { return this.turn === 1 ? this.first : (this.first + this.turn - 1) % 2; },
  label(i) { const pl = this.p[i]; const L = pl.leader ? CAT.byId.get(pl.leader) : null; return L ? L.name : pl.name; } };
function paintPlay() {
  const active = PLAY.who();
  const shown = PLAY.hotseat ? PLAY.p.map((pl, i) => [pl, i]).filter(([, i]) => i === active) : PLAY.p.map((pl, i) => [pl, i]);
  const other = PLAY.p[1 - active];
  $('#plBoard').innerHTML = shown.map(([pl, i]) => {
    const L = pl.leader ? CAT.byId.get(pl.leader) : null;
    return `<div class="panel plpanel" style="${(!PLAY.hotseat && i === 0) ? 'transform:rotate(180deg)' : ''}">${L ? artBack(L) : ''}
      <div style="display:flex;gap:12px;align-items:center">
        <button class="lead pic" data-plleader="${i}" aria-label="Choose this player’s Leader" style="width:${THUMB.m}px;flex:0 0 ${THUMB.m}px;aspect-ratio:.716;border-radius:var(--r-sm);background:var(--card2);overflow:hidden;position:relative">${L ? refArt(L) : ''}</button>
        <div style="flex:1;min-width:0"><b style="font-family:var(--display);font-weight:400;font-size:var(--fs-title)">${L ? esc(L.name) : pl.name}</b>
          <div class="note" style="margin:2px 0 0">${L ? colsOf(L).join('/') + ' \u00b7 starts at ' + (L.life || 5) + ' life' : 'tap the card to choose a Leader'}</div></div>
      </div>
      <div class="plcols">
        <div style="flex:1;text-align:center">
          <div class="note">${G('life', 13)} Life</div>
          <div class="big" style="font-size:var(--fs-total);line-height:1;margin:4px 0">${pl.life}</div>
          <div class="stepper" style="justify-content:center"><button data-pl="${i}:life:-1" aria-label="Life down">${G('minus', 20)}</button><button data-pl="${i}:life:1" aria-label="Life up">${G('plus', 20)}</button></div>
        </div>
        <div style="flex:1;text-align:center">
          <div class="note">${G('don', 13)} DON!! active</div>
          <div class="big" style="font-size:var(--fs-total);line-height:1;margin:4px 0">${pl.don - pl.given}<span style="font-size:var(--fs-row);color:var(--dim)">/${pl.don}</span></div>
          <div class="stepper" style="justify-content:center"><button data-pl="${i}:don:-1" aria-label="DON!! down">${G('minus', 20)}</button><button data-pl="${i}:don:1" aria-label="DON!! up">${G('plus', 20)}</button></div>
        </div>
        <div style="flex:1;text-align:center">
          <div class="note">DON!! given</div>
          <div class="big" style="font-size:var(--fs-total);line-height:1;margin:4px 0">${pl.given}</div>
          <div class="stepper" style="justify-content:center"><button data-pl="${i}:given:-1" aria-label="Given DON!! down">${G('minus', 20)}</button><button data-pl="${i}:given:1" aria-label="Given DON!! up">${G('plus', 20)}</button></div>
        </div>
      </div>
    </div>`;
  }).join('') + (PLAY.hotseat ? `<div class="note" style="text-align:center;margin:8px 0">Opponent \u2014 ${esc(PLAY.label(1 - active))}: Life <b>${other.life}</b> \u00b7 DON!! <b>${other.don - other.given}</b>/${other.don}</div>` : '') +
  `<div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">
      <span class="note">Turn ${PLAY.turn} \u00b7 ${PLAY.turn === 1 ? 'first player: ' : ''}<button class="linkish" id="plFirst" style="display:inline-flex;align-items:center;gap:4px;padding:0 4px;width:auto;vertical-align:middle">${
        PLAY.turn === 1 ? (PLAY.p[PLAY.first].leader ? esc(CAT.byId.get(PLAY.p[PLAY.first].leader).name) : PLAY.p[PLAY.first].name) + ' ' + G('swap', 14) : ''}</button></span>
      <button class="ghost go" id="plNext" style="padding:8px 18px">${PLAY.turn === 1 ? 'Start' : (PLAY.hotseat ? 'End turn' : 'Next turn')}</button>
      <span class="note" style="flex-basis:100%;text-align:center">${PLAY.turn === 1 ? 'The first player draws no card and gets 1 DON!!' : (PLAY.hotseat ? 'Then pass the phone' : 'Everything refreshes; the next player draws and gets 2 DON!!')}</span></div>
    <label class="row" style="justify-content:center;gap:8px;margin-top:6px;cursor:pointer"><input type="checkbox" id="plHot" ${PLAY.hotseat ? 'checked' : ''}>
      <span class="note">Pass the phone \u2014 one player at a time, a curtain between turns</span></label>`;
}

function plCurtain(nextIdx) {
  const c = $('#plCurtain');
  c.innerHTML = `<div class="big" style="font-size:var(--fs-head);margin-bottom:8px">Hand the phone to</div>
    <h2 style="font-size:var(--fs-hero);margin:0 0 18px">${esc(PLAY.label(nextIdx))}</h2>
    <div class="note">Turn ${PLAY.turn} \u00b7 tap when you have it</div>`;
  c.classList.add('on');
}
CLICKS.on('[data-pl],#plFirst,#plHot,#plCurtain,#plNext,#plReset,[data-plleader]', e => {
  const b = e.target.closest('[data-pl]');
  if (b) { const [i, k, d] = b.dataset.pl.split(':'); const pl = PLAY.p[+i];
    if (k === 'life') pl.life = Math.max(0, pl.life + +d);
    if (k === 'don') { pl.don = Math.max(0, Math.min(10, pl.don + +d)); pl.given = Math.min(pl.given, pl.don); }
    if (k === 'given') pl.given = Math.max(0, Math.min(pl.don, pl.given + +d));
    PLATFORM.haptic(); paintPlay(); return; }
  if (e.target.id === 'plFirst') { PLAY.first = 1 - PLAY.first; paintPlay(); return; }
  if (e.target.id === 'plHot') { PLAY.hotseat = e.target.checked; saveJson('vault.hotseat', PLAY.hotseat ? '1' : '0'); paintPlay(); return; }
  if (e.target.closest('#plCurtain')) { $('#plCurtain').classList.remove('on'); paintPlay(); return; }
  if (e.target.id === 'plNext') {

    const who = PLAY.turn === 1 ? PLAY.first : (PLAY.first + PLAY.turn - 1) % 2;
    const pl = PLAY.p[who]; pl.given = 0;
    pl.don = Math.min(10, pl.don + (PLAY.turn === 1 ? 1 : 2));
    PLAY.turn++;
    if (PLAY.hotseat) { plCurtain(PLAY.who()); return; }
    paintPlay(); return; }
  if (e.target.id === 'plReset') { PLAY.p.forEach(p => { p.life = p.leader ? (CAT.byId.get(p.leader).life || 5) : 5; p.don = 0; p.given = 0; }); PLAY.turn = 1; PLAY.first = 0; paintPlay(); return; }
  const l = e.target.closest('[data-plleader]');
  if (l) {
    const i = +l.dataset.plleader;
    $('#lpq').value = ''; lpColour = null; paintLeaderPick();
    const h = ev => { const x = ev.target.closest('[data-lp]'); if (!x) return;
      document.removeEventListener('click', h, true); ev.stopPropagation();
      PLAY.p[i].leader = +x.dataset.lp; PLAY.p[i].life = (CAT.byId.get(+x.dataset.lp) || {}).life || 5;
      $('#leaderPick').classList.remove('on'); paintPlay(); };
    document.addEventListener('click', h, true);
    $('#leaderPick').classList.add('on');
  }
});

const CD = { kw: new Set(), col: new Set(), cost: null, forDeck: false };
const CD_KW = ['Blocker', 'Trigger', 'Rush', 'Counter', 'On Play', 'When Attacking', 'On K.O.',
               'Activate: Main', 'Double Attack', 'Banish', 'DON!! x', 'Once Per Turn'];
const CD_COST = [['0-2', 0, 2], ['3-4', 3, 4], ['5-6', 5, 6], ['7+', 7, 99]];
function paintCards() {
  const deck = CD.forDeck && dkCur ? dkCur : null;
  const L = deck && deck.leader ? CAT.byId.get(deck.leader) : null;
  $('#cdForDeck').textContent = 'For this deck: ' + (deck ? (deck.name || 'untitled') : 'off');
  $('#cdForDeck').classList.toggle('go', !!deck); $('#cdForDeck').setAttribute('aria-pressed', String(!!deck));
  $('#cdKw').innerHTML = CD_KW.map(k => `<button class="chip${CD.kw.has(k) ? ' on' : ''}" data-cdkw="${esc(k)}" aria-pressed="${CD.kw.has(k)}">${
    KW_GLYPH[k] ? G(KW_GLYPH[k], 11) + ' ' : ''}${esc(k)}</button>`).join('');
  $('#cdCol').innerHTML = COLORS.map(c => `<button class="chip${CD.col.has(c) ? ' on' : ''}" data-cdcol="${c}" aria-pressed="${CD.col.has(c)}">
    <i style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px;background:var(--c-${CCLASS[c]})"></i>${c}</button>`).join('');
  $('#cdCost').innerHTML = CD_COST.map(([l]) => `<button class="chip${CD.cost === l ? ' on' : ''}" data-cdcost="${l}" aria-pressed="${CD.cost === l}">${G('don', 11)} ${l}</button>`).join('');
  const q = ($('#cdq').value || '').trim().toLowerCase();
  const range = CD_COST.find(([l]) => l === CD.cost);
  const byNum = new Map();
  for (const p of CAT.rows) {
    if (!p.num || p.sealed || !RULES.MAIN_TYPES.has(p.type)) continue;
    if (L && !colourLegal(p, L)) continue;
    if (CD.col.size && !colsOf(p).some(c => CD.col.has(c))) continue;
    if (range) { const c = parseInt(p.cost, 10); if (isNaN(c) || c < range[1] || c > range[2]) continue; }
    if (CD.kw.size && ![...CD.kw].every(k => hasKw(p, k))) continue;
    if (q && !(p.full + ' ' + p.num + ' ' + (p.subtypes || '') + ' ' + (p.text || '')).toLowerCase().includes(q)) continue;
    const cur = byNum.get(p.num);
    if (!cur || likelihood(p, null) > likelihood(cur, null)) byNum.set(p.num, p);
  }
  const hits = [...byNum.values()].sort((a, b) => (parseInt(a.cost, 10) || 0) - (parseInt(b.cost, 10) || 0) || a.name.localeCompare(b.name));
  $('#cdCount').textContent = `${hits.length.toLocaleString()} card${hits.length === 1 ? '' : 's'}${L ? ' in ' + colsOf(L).join('/') : ''}${
    hits.length > 80 ? ' · showing 80' : ''}`;
  $('#cdRes').innerHTML = hits.slice(0, 80).map(p => {
    const inDeck = deck ? (deck.cards.find(c => CAT.byId.get(c.id)?.num === p.num)?.n || 0) : 0;
    const kws = ['Blocker', 'Rush', 'Trigger', 'Counter', 'Double Attack', 'Banish'].filter(k => hasKw(p, k));
    return `<div class="dkrow" data-cd="${p.id}">
      <div class="cost">${p.cost != null && p.cost !== '' ? esc(p.cost) : '\u00b7'}</div>
      ${cardPic(p, THUMB.s)}
      <div class="n" data-open="${p.id}"><b>${esc(p.name)}</b>
        <span>${esc(p.num)} \u00b7 ${colsOf(p).join('/')}${p.power ? ' \u00b7 ' + Number(p.power).toLocaleString() : ''}${
          p.counter ? ' \u00b7 +' + Number(p.counter).toLocaleString() : ''}${kws.map(k => `<i class="kwtag">${KW_GLYPH[k] ? G(KW_GLYPH[k], 11) + ' ' : ''}${k}</i>`).join('')}</span>
        <span style="white-space:normal;color:var(--dim2);font-size:var(--fs-cap);-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden">${esc((p.text || '').replace(/\n+/g, ' ').slice(0, 160))}</span></div>
      <div class="cnt">${deck ? `<button data-cdadd="${p.id}" aria-label="One more">+</button>${inDeck ? `<b>${inDeck}</b>` : ''}` : ''}</div>
    </div>`;
  }).join('') || emptyHtml('filter', 'Nothing matches', 'Loosen a chip, or clear them.');
}
CLICKS.on('[data-cdkw],[data-cdcol],[data-cdcost],[data-cdadd],#cdForDeck', e => {
  const k = e.target.closest('[data-cdkw]'); if (k) { const v = k.dataset.cdkw; CD.kw.has(v) ? CD.kw.delete(v) : CD.kw.add(v); return paintCards(); }
  const c = e.target.closest('[data-cdcol]'); if (c) { const v = c.dataset.cdcol; CD.col.has(v) ? CD.col.delete(v) : CD.col.add(v); return paintCards(); }
  const co = e.target.closest('[data-cdcost]'); if (co) { CD.cost = CD.cost === co.dataset.cdcost ? null : co.dataset.cdcost; return paintCards(); }
  const a = e.target.closest('[data-cdadd]'); if (a && dkCur) { deckAdd(+a.dataset.cdadd, 1); return paintCards(); }
  if (e.target.id === 'cdForDeck') {
    if (!dkCur) { toast('Open a deck first \u2014 Decks tab'); return; }
    CD.forDeck = !CD.forDeck; return paintCards();
  }
});
$('#cdq').addEventListener('input', paintCards);

const GRADES = ['Raw', 'PSA 10', 'PSA 9', 'PSA 8', 'CGC 10', 'CGC 9.5', 'CGC 9', 'BGS 10', 'BGS 9.5', 'BGS 9', 'TAG 10', 'TAG 9'];
const PCT_OFF = [5, 10, 15, 20, 25, 30];
const WANT = {
  list: readJson('vault.wants', []),
  save() { saveJson('vault.wants', this.list); scheduleBackup('lists'); },
  key(w) { return w.id != null ? 'i' + w.id : 'n' + w.num; },

  has(num) { return this.list.some(w => w.num === num); },
  hasId(id) { return this.list.some(w => w.id === id); },
  entry(id) { return this.list.find(w => w.id === id) || null; },
  byKey(k) { return this.list.find(w => this.key(w) === k) || null; },

  add(num, id = null) {
    if (id != null && this.hasId(id)) return this.entry(id);
    const loose = id != null ? this.list.find(w => w.num === num && w.id == null) : null;
    if (loose) { loose.id = id; this.save(); return loose; }
    if (id == null && this.has(num)) return this.list.find(w => w.num === num);
    const w = { num, id, added: new Date().toISOString(), grade: 'Raw', target: null };
    this.list.push(w); this.save(); return w;
  },
  remove(w) { this.list = this.list.filter(x => x !== w); this.save(); },

  toggle(num, id = null) {
    if (id == null) { if (this.has(num)) { this.list = this.list.filter(w => w.num !== num); this.save(); return false; } this.add(num, null); return true; }
    const e = this.entry(id); if (e) { this.remove(e); return false; }
    this.add(num, id); return true;
  },

  toggleNum(num, id = null) {
    if (this.has(num)) { this.list = this.list.filter(w => w.num !== num); this.save(); return false; }
    this.add(num, id); return true;
  },
  set(w, fields) { Object.assign(w, fields); this.save(); return w; },
  printing(w) { return (w.id && CAT.byId.get(w.id)) || (CAT.byNum.get(w.num) || []).slice().sort((a, b) => likelihood(b, null) - likelihood(a, null))[0] || null; },
  total() { return this.list.reduce((a, w) => { const p = this.printing(w); return a + (p ? (p.market || 0) : 0); }, 0); }
};
const WATCHUI = { open: null };

function watchTargetLine(w, p) {
  if (!(w.target > 0)) return 'No target set';
  if (p.market == null) return `Target ${money(w.target)} · no market price on file`;
  const d = p.market - w.target;
  return d <= 0 ? `<span class="up">At or under your target of ${money(w.target)}</span>` : `Target ${money(w.target)} · ${money(d)} over it`;
}

function watchSpark(p, n = 30) {
  const h = (CAT.hist[p.id] || []).slice(-n).filter(v => v > 0);
  if (h.length < 2) return '';
  const lo = Math.min(...h), hi = Math.max(...h), W = 120, H = 28;
  const pts = h.map((v, i) => `${(i / (h.length - 1) * W).toFixed(1)},${(hi === lo ? H / 2 : H - (v - lo) / (hi - lo) * H).toFixed(1)}`).join(' ');
  return `<svg class="wspark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="1.5" points="${pts}"/></svg>`;
}
function watchRange(p, n = 30) {
  const h = (CAT.hist[p.id] || []).slice(-n).filter(v => v > 0);
  return h.length < 2 ? 'Not enough price history on file yet' : `Last ${h.length} price days: ${money(Math.min(...h))} to ${money(Math.max(...h))}`;
}

function pctOff(price, k) { return price * (1 - k / 100); }
function pctLine(price, raw) {
  const k = parseFloat(String(raw || '').replace(',', '.'));
  if (!(price > 0) || !(k > 0) || k >= 100) return '';
  return `${k}% off: ${money(pctOff(price, k))} · ${k}% of market: ${money(price * k / 100)}`;
}
function watchRow(w) {
  const p = WANT.printing(w); if (!p) return '';
  const k = WANT.key(w), open = WATCHUI.open === k, s = CAT.sets.get(p.set) || {}, grade = w.grade || 'Raw';

  const day = p.d1p != null ? `<span class="${p.d1a > 0 ? 'up' : p.d1a < 0 ? 'down' : 'flat'}">${signedPct(p.d1p, true)}</span>` : '';
  return `<div class="wrow${open ? ' open' : ''}" data-wkey="${esc(k)}">
    <button class="wmain" data-w="open" aria-expanded="${open}">
      ${cardPic(p)}
      <div class="nm"><b>${esc(p.name)}${p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}${grade !== 'Raw' ? ` <span class="badge gr">${esc(grade)}</span>` : ''}</b>
        <span>${dotJoin(esc(p.num), esc(s.abbr || s.name || ''), esc(p.sub || ''))}${w.id == null ? ' · any printing' : ''}</span>
        <span class="wtl">${watchTargetLine(w, p)}${watchEndHtml(w, p)}</span></div>
      <div class="v mono">${money(p.market)}${day}${p.low ? `<span>low ${money(p.low)}</span>` : ''}</div>
      <span class="wchev">${chev(open)}</span>
    </button>
    <div class="chips wlinks">${lookupLinks(p).map(l => `<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener" data-look="${l.key}" aria-label="${esc(l.aria)}">${esc(l.label)} ${ext(12)}</a>`).join('')}</div>
    ${open ? watchTools(w, p, k, grade) : ''}
  </div>`;
}
function watchTools(w, p, k, grade) {
  const m = p.market, alert = ALERTS.list.find(a => a.id === p.id && a.armed && a.dir === 'below');
  return `<div class="wtools">
    <div class="wspk">${watchSpark(p)}<span>${watchRange(p)}</span></div>
    ${w.id == null ? `<button class="ghost mone" data-w="pin">Choose the printing</button>` : ''}
    ${m > 0 ? `<div class="msub">Off market (${money(m)})</div>
    <div class="pgrid">${PCT_OFF.map(n => `<div><b>${n}% off</b><span class="mono">${money(pctOff(m, n))}</span></div>`).join('')}</div>
    <div class="wpctrow"><input class="wpct" type="text" inputmode="decimal" data-wpct="${esc(k)}" placeholder="Another %" aria-label="Another percentage off ${esc(p.name)}’s market"><span class="mono wpctout" data-wpctout="${esc(k)}"></span></div>` : ''}
    <div class="mgrid">
      <button class="ghost" data-w="target">${w.target > 0 ? 'Target ' + money(w.target) : 'Set a target'}</button>
      <button class="ghost" data-w="grade">${esc(grade)}</button>
      <button class="ghost" data-w="alert" aria-pressed="${!!alert}">${alert ? 'Alert set' : 'Alert at target'}</button>
      <button class="ghost" data-w="trade">Trade for it</button>
      <button class="ghost" data-w="card">Card page</button>
      <button class="ghost" data-w="rm" style="color:var(--down)">Remove</button>
    </div>
    ${grade !== 'Raw' ? `<div class="note" style="margin:8px 0 0">${esc(grade)} prices are not in the catalogue, which is TCGplayer’s raw market; PriceCharting lists them by grade.</div>` : ''}
    ${ebcBoxHtml(p)}
  </div>`;
}
function paintWants() {
  const rows = WANT.list.map(w => ({ w, p: WANT.printing(w) })).filter(x => x.p);
  const under = rows.filter(({ w, p }) => w.target > 0 && p.market != null && p.market <= w.target).length;
  $('#wtSummary').innerHTML = rows.length
    ? `<div class="row"><div class="nm"><b>${rows.length} card${rows.length === 1 ? '' : 's'} watched</b>
        <span>${dotJoin(under ? `${under} at or under target` : '', `TCGplayer market, ${dayText(CAT.man.source_updated_at || '')}`, 'kept on this phone')}</span></div><div class="v mono">${money(WANT.total())}</div></div>`
    : emptyHtml('bookmark', 'Nothing on your watchlist yet', 'Add a card from its page, a search or the scanner, and its prices stay on this phone for the show.');
  $('#wtRows').innerHTML = rows.slice().reverse().map(({ w }) => watchRow(w)).join('');
  const c = $('#wtClear'); if (c) c.hidden = !rows.length;
  paintEbayWatch();
  paintEbayCard();
  paintWatchEnds();
}
async function watchTap(e) {
  const b = e.target && e.target.closest && e.target.closest('[data-w]'); if (!b) return false;
  const row = b.closest('[data-wkey]'); if (!row) return false;
  const k = row.dataset.wkey, w = WANT.byKey(k); if (!w) return false;
  if (b.dataset.w === 'open') { WATCHUI.open = WATCHUI.open === k ? null : k; paintWants(); return true; }
  return watchAct(w, b.dataset.w);
}
async function watchAct(w, act) {
  const p = WANT.printing(w); if (!p) return false;
  if (act === 'pin') return watchPin(w, p);
  if (act === 'target') return watchTarget(w, p);
  if (act === 'grade') return watchGrade(w);
  if (act === 'alert') return watchAlert(w, p);
  if (act === 'trade') { TRADE.add('get', p.id); toast(`In Trade: you get ${p.name} — add what you give`); go('trade'); return true; }
  if (act === 'card') { openDetail(p.id); return true; }
  if (act === 'rm') {
    if (!confirm(`Take ${p.name}${p.num ? ' (' + p.num + ')' : ''} off your watchlist?`)) return false;
    WANT.remove(w); paintWants(); return true;
  }
  return false;
}
async function watchPin(w, p) {
  const sibs = printingsOf(p); if (sibs.length < 2) { WANT.set(w, { id: p.id }); paintWants(); return true; }
  const v = await PICKER.choose({ title: `Which ${p.num}?`, key: 'wpin', why: 'Every printing of this number: the same number on the card face, different money.',
    opts: sibs.map(q => printingOpt(q, false, 'wpin')).join('') });
  if (v == null) return false;
  if (WANT.hasId(+v)) { WANT.remove(w); toast('That printing is already on your watchlist'); paintWants(); return false; }
  WATCHUI.open = 'i' + v; WANT.set(w, { id: +v }); paintWants(); return true;
}
async function watchTarget(w, p) {
  const c = CUR.active();
  const v = await ask({ title: 'Your target', kind: 'number', ok: 'Save', placeholder: toShown(p.market) || '0.00',
    why: `The most you would pay for ${esc(p.name)}${w.grade && w.grade !== 'Raw' ? ' (' + esc(w.grade) + ')' : ''}, ${c === 'USD' ? 'in USD' : `in ${esc(curLabel(c))}, converted (≈); it is kept in US dollars`}. Market is ${money(p.market)} today. 0 clears it.`,
    value: w.target > 0 ? toShown(w.target) : '' });
  if (v === null) return false;
  const x = typedAmount(v); if (!(x >= 0)) { toast('Not a number'); return false; }
  WANT.set(w, { target: x > 0 ? fromShown(x) : null }); paintWants(); return true;
}
async function watchGrade(w) {
  const cur = w.grade || 'Raw';
  const v = await PICKER.choose({ title: 'The grade you are after', key: 'wgrade', why: 'Raw is TCGplayer’s market, the catalogue’s. A slab’s price is PriceCharting’s, by grade, through its link.',
    opts: GRADES.map(g => `<button class="opt${g === cur ? ' best' : ''}" data-wgrade="${esc(g)}"><div class="oi"><b>${esc(g)}</b></div></button>`).join('') });
  if (!v || !GRADES.includes(v)) return false;
  WANT.set(w, { grade: v }); paintWants(); return true;
}
async function watchAlert(w, p) {
  const live = ALERTS.list.find(a => a.id === p.id && a.armed && a.dir === 'below');
  if (live) { ALERTS.remove(live.key); toast('Alert off'); paintWants(); paintAlerts(); return true; }
  if (!(w.target > 0)) { const ok = await watchTarget(w, p); if (!ok || !(w.target > 0)) return false; }
  ALERTS.add(p.id, 'below', w.target);
  const perm = await PLATFORM.notifyPermission();
  toast(perm === 'denied' ? 'Alert set — notifications are off for this app, so it shows here' : `Alert set: ${p.name} at or under ${money(w.target)}, checked with each night’s prices`);
  paintWants(); paintAlerts(); return true;
}
async function watchAddFind() {
  const q = await ask({ title: 'Add to your watchlist', ok: 'Find', placeholder: 'OP17-023 or Nami', why: 'Type the card’s number, like <b>OP17-023</b>, or its name.' });
  if (!q) return false;
  const hits = reviewFind(q);
  if (!hits.length) { toast(`No card matches “${q}”`); return false; }
  const v = await PICKER.choose({ title: 'Which printing?', key: 'wadd', why: `${hits.length === 40 ? 'The first 40 cards' : hits.length === 1 ? 'The one card' : 'The ' + hits.length + ' cards'} matching “${esc(q)}”.`,
    opts: hits.map(h => printingOpt(h, WANT.hasId(h.id), 'wadd')).join('') });
  if (v == null) return false;
  const p = CAT.byId.get(+v); if (!p) return false;
  const w = WANT.add(p.num, p.id); WATCHUI.open = WANT.key(w); paintWants(); toast(`On your watchlist: ${p.name}`); return true;
}

const CERTS = {
  PSA: { name: 'PSA', direct: true, url: c => `https://www.psacard.com/cert/${encodeURIComponent(c)}/psa` },
  TAG: { name: 'TAG', direct: true, url: c => `https://my.taggrading.com/card/${encodeURIComponent(c)}` },
  CGC: { name: 'CGC', direct: false, url: () => 'https://www.cgccards.com/certlookup/' },
  BGS: { name: 'Beckett (BGS)', direct: false, url: () => 'https://www.beckett.com/grading/card-lookup' }
};
async function certCheck(grader = null, cert = null) {
  if (!grader) grader = await PICKER.choose({ title: 'Check a slab', key: 'wcert', why: 'The grader’s own page for the cert number on the label: the grade, the card, and for PSA its estimate.',
    opts: Object.entries(CERTS).map(([g, c]) => `<button class="opt" data-wcert="${g}"><div class="oi"><b>${esc(c.name)}</b><span>${c.direct ? 'opens the cert' : 'opens its lookup, the number copied to paste'}</span></div></button>`).join('') });
  if (!grader || !CERTS[grader]) return false;
  if (!cert) cert = await ask({ title: `${CERTS[grader].name} cert number`, ok: 'Check', placeholder: grader === 'PSA' ? '156255251' : '', why: 'The number on the slab’s label.' });
  const c = String(cert || '').trim().replace(/\s+/g, ''); if (!c) return false;
  const g = CERTS[grader], url = g.url(c);
  if (!g.direct) { try { await navigator.clipboard.writeText(c); } catch (e) {} toast(`${c} copied — paste it in ${g.name}’s lookup`); }
  window.open(url, '_blank');
  return url;
}
$('#wtRows').addEventListener('click', watchTap);
$('#wtRows').addEventListener('input', e => {
  const i = e.target; if (!i || !i.dataset || !i.dataset.wpct) return;
  const w = WANT.byKey(i.dataset.wpct), p = w && WANT.printing(w); if (!p) return;
  const out = document.querySelector(`[data-wpctout="${i.dataset.wpct}"]`); if (out) out.textContent = pctLine(p.market, i.value);
});
$('#wtAdd').addEventListener('click', watchAddFind);
$('#wtCert').addEventListener('click', () => certCheck());
$('#wtClear').addEventListener('click', () => { if (WANT.list.length && confirm(`Clear your watchlist of ${WANT.list.length} card${WANT.list.length === 1 ? '' : 's'}?`)) { WANT.list = []; WANT.save(); paintWants(); } });

function homeWatchRow(w, p, now = Date.now()) { return `<button class="row" style="width:100%;text-align:left;align-items:center" data-wopen="${esc(WANT.key(w))}">${cardPic(p)}
      <div class="nm"><b>${esc(p.name)}${p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b><span class="wtl">${watchTargetLine(w, p)}${watchEndHtml(w, p, now)}</span></div>
      <div class="v mono">${money(p.market)}</div></button>`; }
function paintHomeWatch() {
  const el = $('#homeWatchList'); if (!el) return;
  const rows = WANT.list.map(w => ({ w, p: WANT.printing(w) })).filter(x => x.p);
  const hit = x => x.w.target > 0 && x.p.market != null && x.p.market <= x.w.target;
  const top = rows.slice().reverse().sort((a, b) => hit(b) - hit(a)).slice(0, 3);
  el.innerHTML = (top.length ? top.map(({ w, p }) => homeWatchRow(w, p)).join('')
    : '<div class="note" style="margin:0 0 10px">Cards you are hunting, their prices kept on this phone for the show. Add one from its page, a search or the scanner.</div>')
    + `<button class="ghost mone" data-go="wants">${rows.length ? `Open the watchlist (${rows.length})` : 'Open the watchlist'}</button>`;
  paintWatchEnds();
}

function homeWatchOpen(k) {
  const w = k ? WANT.byKey(k) : null;
  if (w) WATCHUI.open = k;
  go('wants');
  const row = w ? $(`#wtRows [data-wkey="${k}"]`) : null;
  if (row) scrollToPanel(row);
  return w ? k : null;
}
CLICKS.on('[data-wopen]', (e, b) => homeWatchOpen(b.dataset.wopen));

const BN = { set: null, page: 0, pageOf: {} };
const bnSpread = () => typeof innerWidth === 'number' && innerWidth >= 700;
if (typeof addEventListener === 'function') addEventListener('resize', () => { const b = $('#binder'); if (b && b.classList && typeof b.classList.contains === 'function' && b.classList.contains('on')) paintBinder(); });

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

  const byNum = new Map();
  for (const p of CAT.rows) if (p.set === BN.set && p.num) { const c = byNum.get(p.num); if (!c || likelihood(p, null) > likelihood(c, null)) byNum.set(p.num, p); }
  const heldBy = new Map();
  for (const i of PF.scope(OWN.items)) { const p = CAT.byId.get(i.id); if (p && p.set === BN.set) { const cur = heldBy.get(p.num);
    if (!cur || (i.photo && !cur.i.photo) || (p.market || 0) > (cur.p.market || 0)) heldBy.set(p.num, { p, i }); } }
  const numKey = n => { const m = n.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 9999; };
  const nums = [...byNum.keys()].sort((a, b) => numKey(a) - numKey(b) || a.localeCompare(b));
  const pages = Math.max(1, Math.ceil(nums.length / 9));

  const firstHeld = nums.findIndex(n => heldBy.has(n));
  BN.page = Math.min(BN.pageOf[BN.set] != null ? BN.pageOf[BN.set] : Math.max(0, Math.floor(firstHeld / 9)), pages - 1);

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

function bnTurn(d) { const step = bnSpread() ? 2 : 1, at = bnSpread() ? BN.page - (BN.page % 2) : BN.page; BN.pageOf[BN.set] = Math.max(0, at + d * step); return paintBinder(); }
CLICKS.on('[data-bnset],#bnPrev,#bnNext', e => {
  const st = e.target.closest('[data-bnset]'); if (st) { BN.set = +st.dataset.bnset; return paintBinder(); }
  if (e.target.id === 'bnPrev') return bnTurn(-1);
  if (e.target.id === 'bnNext') return bnTurn(1);
});

const ALERTS = {
  list: readJson('vault.alerts', []),
  save(quiet = false) { saveJson('vault.alerts', this.list); if (!quiet) scheduleBackup('lists'); },
  add(id, dir, at) {
    const p = CAT.byId.get(id); if (!p || !(at > 0)) return null;
    const a = { key: 'a' + Date.now(), id, num: p.num, name: p.name, treat: p.treat, dir, at, armed: true,
                created: new Date().toISOString(), catalogueAt: CAT.man.source_updated_at || null };
    this.list.push(a); this.save(); return a;
  },
  remove(key) { this.list = this.list.filter(a => a.key !== key); this.save(); },
  rearm(key) { const a = this.list.find(x => x.key === key); if (a) { a.armed = true; a.fired = null; this.save(); } },

  async check() {
    const stamp = CAT.man.source_updated_at || 'none';
    const fired = [];
    for (const a of this.list) {
      if (!a.armed || a.checkedAt === stamp) continue;
      a.checkedAt = stamp;
      const p = CAT.byId.get(a.id); if (!p || p.market == null) continue;
      const hit = a.dir === 'below' ? p.market <= a.at : p.market >= a.at;
      if (!hit) continue;
      a.armed = false; a.fired = { at: new Date().toISOString(), price: p.market, catalogue: stamp };
      fired.push(a);
      await PLATFORM.notify(Math.abs(hashStr(a.key)) % 2147483647,
        `${a.name} ${a.dir === 'below' ? 'dropped to' : 'rose to'} ${money(p.market)}`,
        `${a.num}${a.treat !== 'base' ? ' (' + (TREAT[a.treat] || a.treat) + ')' : ''} \u2014 you asked for ${a.dir} ${money(a.at)}. Prices of ${dayText(stamp)}.`);
    }
    this.save(true); return fired;
  }
};
function hashStr(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
function paintAlerts() {
  const el = $('#alRows'); if (!el) return;
  el.innerHTML = ALERTS.list.length ? ALERTS.list.slice().reverse().map(a => {
    const p = CAT.byId.get(a.id); const now = p ? p.market : null;
    return `<div class="dkrow">
      <div class="n"><b>${esc(a.name)}${a.treat !== 'base' ? ` <span class="badge">${esc(TREAT[a.treat] || a.treat)}</span>` : ''}</b>
        <span style="white-space:normal">${dotJoin(esc(a.num), `${a.dir} ${money(a.at)}`, `now ${now != null ? money(now) : '?'}`)}${
          a.fired ? ` \u00b7 <span class="up">fired ${esc(dayText(localDay(a.fired.at) || a.fired.at))} at ${money(a.fired.price)}</span>` : a.armed ? ' \u00b7 watching' : ''}</span></div>
      <div class="cnt">${a.fired ? `<button data-alrearm="${a.key}" aria-label="Watch again">${G('refresh', 18)}</button>` : ''}<button data-alrm="${a.key}" aria-label="Remove the alert">${G('trash', 18)}</button></div>
    </div>`; }).join('') : emptyHtml('bell', 'No alerts yet', 'Open a card and tap <b>Alert me</b>.');
}
CLICKS.on('[data-alrm],[data-alrearm]', e => {
  const r = e.target.closest('[data-alrm]'); if (r) { ALERTS.remove(r.dataset.alrm); paintAlerts(); return; }
  const a = e.target.closest('[data-alrearm]'); if (a) { ALERTS.rearm(a.dataset.alrearm); paintAlerts(); return; }
});

let ckSet = null, ckMode = 'all';
function openChecklist(setId) { ckSet = setId; ckMode = 'all'; go('checklist'); }
function paintChecklist() {
  const s = CAT.sets.get(ckSet); if (!s) return go('home');
  const byNum = new Map();
  for (const p of CAT.rows) if (p.set === ckSet && p.num) {
    const cur = byNum.get(p.num); if (!cur || likelihood(p, null) > likelihood(cur, null)) byNum.set(p.num, p);
  }
  const held = new Map();
  for (const i of PF.scope(OWN.items)) { const p = CAT.byId.get(i.id); if (p && p.set === ckSet) held.set(p.num, (held.get(p.num) || 0) + i.qty); }

  const numKey = n => { const m = n.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 9999; };
  const nums = [...byNum.keys()].sort((a, b) => numKey(a) - numKey(b) || a.localeCompare(b));
  const have = nums.filter(n => held.has(n)).length;
  const missing = nums.filter(n => !held.has(n));
  const missingCost = missing.reduce((a, n) => a + (byNum.get(n).market || 0), 0);
  $('#ckTitle').textContent = s.abbr || s.name;
  $('#ckSummary').innerHTML = `<b>${have} of ${nums.length}</b> \u00b7 ${esc(s.name)}. ` +
    (missing.length ? `The ${missing.length} missing come to <b>${money(missingCost)}</b> at each one’s likeliest printing.` : 'Complete.');
  $('#ckFilter').innerHTML = [['all', 'All'], ['missing', 'Missing'], ['have', 'Have']].map(([k, l]) =>
    `<button class="chip${ckMode === k ? ' on' : ''}" data-ckmode="${k}" aria-pressed="${ckMode === k}">${l}</button>`).join('');
  const shown = nums.filter(n => ckMode === 'all' || (ckMode === 'have') === held.has(n));
  $('#ckGrid').innerHTML = shown.map(n => { const p = byNum.get(n); const h = held.get(n) || 0;
    return `<button class="ck${h ? ' have' : ''}${WANT.has(n) ? ' want' : ''}" data-ck="${esc(n)}" data-ckid="${p.id}" title="${esc(p.name)}">
      ${refArt(p)}<b style="position:relative">${esc(numLabel(n, ckSet))}</b><span style="position:relative">${esc(p.rarity || '')}</span>${h ? `<span class="qty">\u00d7${h}</span>` : ''}</button>`; }).join('');
  $('#ckWantAll').textContent = missing.length ? `Watch the ${missing.length} missing` : 'Complete';
  $('#ckWantAll').disabled = !missing.length;
}
CLICKS.on('[data-checklist],[data-ckmode],[data-ck],#ckWantAll,[data-want]', e => {
  const c = e.target.closest('[data-checklist]'); if (c) return openChecklist(+c.dataset.checklist);
  const m = e.target.closest('[data-ckmode]'); if (m) { ckMode = m.dataset.ckmode; return paintChecklist(); }
  const k = e.target.closest('[data-ck]');
  if (k) {
    if (k.classList.contains('have')) return openDetail(+k.dataset.ckid);
    const on = WANT.toggleNum(k.dataset.ck, +k.dataset.ckid);
    k.classList.toggle('want', on); toast(on ? `On your watchlist: ${k.dataset.ck}` : `Off your watchlist: ${k.dataset.ck}`); return;
  }
  if (e.target.id === 'ckWantAll' && ckSet) {
    const s = CAT.sets.get(ckSet); const held = new Set(PF.scope(OWN.items).map(i => (CAT.byId.get(i.id) || {}).num));
    let n = 0; const seen = new Set();
    for (const p of CAT.rows) if (p.set === ckSet && p.num && !held.has(p.num) && !seen.has(p.num)) { seen.add(p.num); if (!WANT.has(p.num)) { WANT.add(p.num, p.id); n++; } }
    paintChecklist(); toast(`On your watchlist: ${n} more from ${s.abbr || s.name}`); return;
  }
  const w = e.target.closest('[data-want]'); if (w) { WANT.toggle(w.dataset.want); if ($('#wants').classList.contains('on')) paintWants(); return; }
});

const NAV = { stack: [], silent: false,
  back() {
    if (this.stack.length < 2) {
      const home = MODE.home[MODE.cur] || 'home'; const top = this.stack[this.stack.length - 1] || ([...document.querySelectorAll('.screen.on')].map(e => e.id)[0]);
      if (!top || top === home) return false;
      this.silent = true; go(home); this.silent = false; this.stack = [home]; return true;
    }
    this.stack.pop(); let prev = this.stack[this.stack.length - 1];
    const isScreen = i => { const el = i && document.getElementById(i); return !!el && String(el.tagName).toUpperCase() === 'SECTION'; };
    while (prev && !isScreen(prev) && this.stack.length > 1) { this.stack.pop(); prev = this.stack[this.stack.length - 1]; }
    if (!prev) return false; this.silent = true; go(prev); this.silent = false; return true; } };

function screenWatchdog(trigger) {
  setTimeout(() => { const on = document.querySelector('.screen.on'); if (on) return;
    const overlays = ['#askSheet', '#picker', '#filters', '#leaderPick', '#printPick', '#rulesSheet', '#simSheet', '#detail', '#tour', '#simCurtain', '#splash'].filter(id => { const el = $(id); return el && el.classList && el.classList.contains('on'); });
    ERRS.push('blank', `no screen on after ${trigger}; stack ${NAV.stack.join('>') || '-'}; overlays ${overlays.join(',') || 'none'}; mode ${MODE.cur}`, 'watchdog');
    NAV.silent = true; go(MODE.home[MODE.cur] || 'home'); NAV.silent = false; }, 60);
}
function closeAnyOverlay() {
  const ask = $('#askSheet'); if (ask && ask.classList.contains('on')) { $('#askCancel').click(); return true; }

  for (const id of ['#picker', '#filters', '#leaderPick', '#printPick', '#rulesSheet', '#simSheet', '#tour', '#simCurtain']) { const el = $(id); if (el && el.classList.contains('on')) { if (id === '#picker') PICKER.dismiss(); else if (id === '#tour') guideClose(false); else el.classList.remove('on'); return true; } }
  return false;
}

function backArrow() {
  const APP = PLATFORM.plugin('App');
  if (APP && APP.addListener) { try { if (closeAnyOverlay()) return; NAV.back(); } finally { screenWatchdog('back arrow'); } return; }
  if (NAV.stack.length > 1) { history.back(); return; }
  try { NAV.back(); } finally { screenWatchdog('back arrow'); }
}

function closeSheet(id) {
  if (id === 'askSheet') { $('#askCancel').click(); return; }
  if (id === 'picker') { PICKER.dismiss(); return; }
  const el = document.getElementById(id); if (el) el.classList.remove('on');
}
function go(id) {

  const isScreen = i => { const el = i && document.getElementById(i); return !!el && String(el.tagName).toUpperCase() === 'SECTION'; };
  if (!isScreen(id)) {
    ERRS.push('nav', `go() called with no screen for '${id}'`, 'go'); id = MODE.home[MODE.cur] || 'home';
    if (!document.getElementById(id)) return;
  }
  if (!NAV.silent) { if (NAV.stack[NAV.stack.length - 1] !== id) { NAV.stack.push(id); if (NAV.stack.length > 30) NAV.stack.shift(); } try { history.pushState({ id }, '', '#' + id); } catch (e) {} }
  if (id !== 'scan') stopCamera();
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.go === id || (id === 'search' && b.dataset.go === 'cards') || (id === 'review' && b.dataset.go === 'scan') || (id === 'wants' && b.dataset.go === 'collection')));
  window.scrollTo(0, 0);
  ({ home: paintHome, collection: paintCollection, search: paintSearch,
     scan: paintScan, review: paintReview, settings: paintSettings, decks: paintDecks, deck: paintDeck,
     trade: paintTrade, play: paintPlay, sim: paintSim, cards: paintCards,

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

  const held = PF.scope(OWN.items), chg = collectionChange(held);
  const dl = $('#pfDelta');
  dl.className = 'delta mono ' + (chg.a > 0.005 ? 'up' : chg.a < -0.005 ? 'down' : 'flat');
  dl.innerHTML = !held.length ? 'Add a card and its change shows here.'
    : !chg.n ? `No price on file ${esc(changeWords())} for these cards.`
    : `${signedMoney(chg.a)}${chg.pc != null ? ` (${signedPct(chg.pc, true)})` : ''} ${esc(changeWords())}` +
      (chg.none ? ` <span class="flat" style="font-weight:500;font-size:var(--fs-sm)">\u00b7 ${chg.none} with no price on file</span>` : '');
  const hc = $('#homeChange'); if (hc) hc.innerHTML = changeChips();

  const sn = $('#sparkNote');
  const st = series.length < 2 ? 'Not enough history yet — a snapshot is taken each day.'
    : S.kind === 'estimate' ? 'The chart is estimated from today\u2019s cards at each day\u2019s prices.' : '';
  if (sn) { sn.innerHTML = st; sn.style.display = st ? '' : 'none'; }
  const sp = $('#spark'); if (sp && sp.setAttribute) sp.setAttribute('aria-label', `Your collection\u2019s value ${RANGE_WORDS[range] || 'in the last ' + range}`);

  $('#ranges').innerHTML = RANGES.map(r =>
    `<button class="range${r === range ? ' on' : ''}" data-r="${r}" aria-pressed="${r === range}">${r}${
      r === 'MAX' && !MAXLOCK.open() ? '<span class="free">AD</span>' : ''}</button>`).join('');
  spark(series, S.kind);

  const top = PF.scope(OWN.items).slice()
    .map(i => ({ i, p: CAT.byId.get(i.id) })).filter(x => x.p)
    .sort((a, b) => (b.p.market || 0) * b.i.qty - (a.p.market || 0) * a.i.qty).slice(0, 6);

  const hero = $('#hero'), heroArt = (CAT.man.user || []).includes('home-bg.jpg') ? 'bundle/user/home-bg.jpg' : top.length && top[0].p.img ? artUrl(top[0].p, 'large') : '';
  if (hero && hero.style && typeof hero.style.cssText === 'string') hero.style.cssText = hero.style.cssText.replace(/--hero-art:[^;]*;?/, '') + (heroArt ? `;--hero-art:url("${heroArt}")` : '');
  else if (hero && hero.style) hero.style.cssText = heroArt ? `--hero-art:url("${heroArt}")` : '';

  paintHomeWatch();
  paintHomeMovers();
  $('#topList').innerHTML = top.length ? `<div class="shelf">${top.map(({ i, p }) => `
    <button class="st" data-open="${p.id}" aria-label="${esc(p.name)}, ${money((p.market || 0) * i.qty)}"><div class="pic"><div class="ph"><span class="phl">${esc(p.name)}</span></div>${refArt(p, { size: 'large' })}${p.treat !== 'base' ? `<span class="badge tag">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</div>
      <div class="v mono">${money((p.market || 0) * i.qty)}</div>
      <div class="nm">${esc(p.name)}${i.qty > 1 ? ' \u00b7 \u00d7' + i.qty : ''}</div>
      <div class="nm sub"><span>${SEALED.isGoods(p) ? dotJoin(esc(sealedWord(p)), esc((CAT.sets.get(p.set) || {}).abbr || '')) : dotJoin(esc(i.condition), esc(p.num))}</span></div></button>`).join('')}</div>`
    : '<div class="note">Scan a card and it will show up here.</div>';

  paintHomeSets();

  paintPerf();

  const m = CAT.man;
  $('#srcNote').innerHTML =
    `Prices from <b>TCGplayer</b>, via <b>TCGCSV</b>, updated ${esc(dayText(m.source_updated_at))}.<br>` +
    `${(m.cards || 0).toLocaleString()} cards across ${setsWithCards()} sets.<br><br>` +
    `A market price is an estimate, not a sale.<br><br>` +
    `Not affiliated with, endorsed by or sponsored by Bandai, Shueisha, Toei, ` +
    `Viz Media or TCGplayer.`;
}

const HOME_MOVERS = { n: 3, open: false };
function paintHomeMovers() {
  const el = $('#homeMoversList'); if (!el) return;
  const gm = CHANGE.mode === 'added' ? 'day' : CHANGE.mode;
  const R = marketReport(gm), { n, open } = HOME_MOVERS;
  const rest = Math.max(0, R.fallers.length - n) + Math.max(0, R.risers.length - n);
  const part = (title, L, none) => `<div class="mvhead">${title} \u00b7 ${esc(moverSpan(gm))}</div>`
    + (L.length ? (open ? L : L.slice(0, n)).map(moverRow).join('') : `<div class="note">${none}</div>`);
  el.innerHTML = part('Fell the most', R.fallers, `No card fell by the rule ${esc(changeWords(gm))}.`)
    + part('Rose the most', R.risers, `No card rose by the rule ${esc(changeWords(gm))}.`)
    + (open ? `<div class="note">${esc(reportRule())}</div>` : '')
    + (rest || open ? dropMore('homemovers', 'homeMoversList', open, rest) : '');
}
function toggleHomeMovers() {
  HOME_MOVERS.open = !HOME_MOVERS.open; paintHomeMovers();
  const p = $('#homeMovers'); if (!HOME_MOVERS.open && p && p.scrollIntoView) p.scrollIntoView({ block: 'nearest' });
}

function dropMore(act, list, open, rest) {
  return `<button class="ghost mone dropmore" data-act="${act}" aria-expanded="${open}" aria-controls="${list}">${
    open ? 'Show fewer' : `Show the rest (${rest} more)`}<svg class="g" width="16" height="16" aria-hidden="true"><use href="#g-chevron"/></svg></button>`;
}

const HOME_SETS = { n: 3, open: false };
function setsByDone(prog) {
  const done = x => (x.all ? x.have / x.all : 0);
  return prog.slice().sort((a, b) => done(b) - done(a) || b.have - a.have || b.val - a.val);
}
function setRow(x) {
  const pct = x.all ? 100 * x.have / x.all : 0;
  return `<button class="row" style="width:100%;text-align:left;align-items:center" data-checklist="${x.s.id}">${setPic(x.s)}<div class="nm">
      <b>${esc(x.s.name || '?')}</b>
      <span>${x.have} of ${x.all} numbers \u00b7 ${pctNum(pct)}</span>
      <span class="spreadbar" style="display:block;margin-top:6px;height:4px">
        <i style="left:0;width:${pct.toFixed(1)}%;height:4px;top:0;border-radius:3px"></i></span>
    </div><div class="v mono">${money(x.val)}</div></button>`;
}
function paintHomeSets() {
  const el = $('#setDone'); if (!el) return;
  const prog = setsByDone(setProgress()), { n, open } = HOME_SETS, rest = Math.max(0, prog.length - n);
  el.innerHTML = !prog.length ? '<div class="note">Add a card and its set shows up here.</div>'
    : (open ? prog : prog.slice(0, n)).map(setRow).join('') + (rest || open ? dropMore('homesets', 'setDone', open, rest) : '');
}
function toggleHomeSets() {
  HOME_SETS.open = !HOME_SETS.open; paintHomeSets();
  const p = $('#setComp'); if (!HOME_SETS.open && p && p.scrollIntoView) p.scrollIntoView({ block: 'nearest' });
}

let perfOn = false;
const HOME_OVERVIEW = ['hero', 'homeWatch', 'homeMovers', 'setComp', 'srcPanel'];
function setHomeTab(perf) {
  perfOn = !!perf;
  $('#tabPerf').classList.toggle('on', perfOn);
  $('#tabOver').classList.toggle('on', !perfOn);
  $('#tabPerf').setAttribute('aria-selected', String(perfOn));
  $('#tabOver').setAttribute('aria-selected', String(!perfOn));
  $('#tabPerf').setAttribute('tabindex', perfOn ? '0' : '-1');
  $('#tabOver').setAttribute('tabindex', perfOn ? '-1' : '0');
  $('#perfPanel').style.display = perfOn ? 'block' : 'none';
  $('#home').classList.toggle('perf', perfOn);
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

  if (series.length < 2) {
    const v = series.length ? series[0][1] : 0;
    x.strokeStyle = TOK('--line', '#26394B'); x.lineWidth = 2; x.setLineDash([5, 5]);
    x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
    x.setLineDash([]);
    x.fillStyle = TOK('--brass', '#F2C14E'); x.beginPath();
    x.arc(w - 10, h / 2, 4.5, 0, 7); x.fill();
    x.fillStyle = TOK('--dim', '#A08E70'); x.font = '12.5px system-ui'; x.textAlign = 'center';
    x.fillText('One reading so far \u2014 ' + money(v) + '.',
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
  if (kind === 'estimate') x.setLineDash([6, 5]);
  x.stroke(); x.setLineDash([]);

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

let colQuery = '', favOnly = false, bulk = null;

const SORTS = {
  own: { value: 'Value', delta: 'Biggest move', name: 'Name', num: 'Card number',
         set: 'Set', added: 'Recently added', qty: 'Quantity', paid: 'Gain / loss' },
  all: { value: 'Price', delta: 'Biggest move', name: 'Name', num: 'Card number',
         set: 'Set', rarity: 'Rarity' }
};
const FACETS = ['set', 'rarity', 'color', 'type', 'treat', 'cond'];
const RARITY_ORDER = ['L', 'SEC', 'SR', 'R', 'UC', 'C', 'P', 'PR', 'DON'];
const COLORS = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'];
const ONLY = { own: [['fav', 'Favourites'], ['multi', 'Qty 2+'], ['graded', 'Graded'],
                     ['paid', 'Has cost'], ['moved', 'Moved today'], ['photo', 'My scans']],
               all: [['owned', 'I own'], ['unowned', "I don’t own"], ['moved', 'Moved today'],
                     ['special', 'Special printings']] };
function blankFilter(scope) {
  return { sort: 'value', dir: -1, set: [], rarity: [], color: [], type: [], treat: [],
           cond: [], min: null, max: null, only: [], _scope: scope };
}

const NUMERIC_FACETS = ['set'];
function loadFilter(scope) {
  const saved = readJson('vault.filt.' + scope, {}, false);
  const f = Object.assign(blankFilter(scope), saved, { _scope: scope });
  for (const k of NUMERIC_FACETS) f[k] = (Array.isArray(f[k]) ? f[k] : []).map(Number).filter(Number.isFinite);
  return f;
}
const FILT = {
  own: loadFilter('own'),
  all: loadFilter('all'),
  save(scope) { saveJson('vault.filt.' + scope, this[scope]); }
};
function activeCount(f) {
  return FACETS.reduce((n, k) => n + (f[k].length ? 1 : 0), 0) +
         (f.min != null || f.max != null ? 1 : 0) + f.only.length;
}
function cardColors(p) { return colsOf(p); }

const CHANGE = {
  modes: [['added', 'Since added'], ['day', 'Day'], ['7d', '7 days'], ['30d', '30 days']],
  mode: (m => ['added', 'day', '7d', '30d'].includes(m) ? m : 'added')(readJson('vault.changeBy', 'added', false)),
  set(m) { if (!this.modes.some(x => x[0] === m)) return false; this.mode = m; saveJson('vault.changeBy', JSON.stringify(m)); return true; }
};

function priceOn(p, day) {
  const days = CAT.days || [], h = CAT.hist[p.id]; if (!h) return null;
  for (let k = days.length - 1; k >= 0; k--) if (days[k] <= day && h[k] > 0) return { day: days[k], v: h[k] };
  return null;
}

function periodStart(mode) {
  const days = CAT.days || []; if (!days.length) return '';
  return new Date(Date.parse(days[days.length - 1] + 'T12:00:00Z') - (mode === '7d' ? 7 : 30) * 864e5).toISOString().slice(0, 10);
}
function lineChange(p, i, mode = CHANGE.mode) {
  if (mode === 'day') return p.d1p == null ? null : { a: p.d1a, pc: p.d1p, from: D1().from || null, mode };
  const days = CAT.days || []; if (!days.length || !(p.market > 0)) return null;
  const target = mode === 'added' ? (i && i.added ? localDay(i.added) : '') : periodStart(mode);
  if (!target) return null;
  let base = priceOn(p, target), first = false;
  if (!base) { const h = CAT.hist[p.id] || [], k = h.findIndex(v => v > 0); if (k < 0) return null; base = { day: days[k], v: h[k] }; first = true; }
  const a = p.market - base.v;
  return { a, pc: 100 * a / base.v, from: base.day, first, mode };
}

function changeTitle(c, i) {
  if (!c) return '';
  if (c.mode === 'added' && c.first) return `since ${dayText(c.from)}, the first price on file (added ${dayText(localDay(i && i.added))})`;
  return c.mode === 'day' ? sinceLabel() : `since ${dayText(c.from)}`;
}

function changeWords(mode = CHANGE.mode) {
  return mode === 'added' ? 'since added' : mode === 'day' ? sinceLabel() : mode === '7d' ? 'over 7 days' : 'over 30 days';
}
function collectionChange(items, mode = CHANGE.mode) {
  let a = 0, base = 0, n = 0, none = 0;
  for (const i of items) {
    const p = CAT.byId.get(i.id); if (!p) continue;
    const c = lineChange(p, i, mode); if (!c) { none++; continue; }
    a += c.a * i.qty; base += (p.market - c.a) * i.qty; n++;
  }
  return { a, pc: base > 0 ? 100 * a / base : null, n, none, mode };
}
function changeChips() {
  return CHANGE.modes.map(([m, w]) => `<button class="chip${CHANGE.mode === m ? ' on' : ''}" data-chg="${m}" aria-pressed="${CHANGE.mode === m}">${w}</button>`).join('');
}

function applyFilter(rows, f) {
  const q = (f._scope === 'own' ? colQuery : ($('#allq').value || '')).trim().toLowerCase();
  const ownedIds = new Set(OWN.items.map(i => i.id));
  return rows.filter(({ p, i }) => {
    if (q && !(p.full + ' ' + p.num + ' ' + (CAT.sets.get(p.set) || {}).name).toLowerCase().includes(q)) return false;
    if (f.set.length && !f.set.includes(p.set)) return false;
    if (f.rarity.length && !f.rarity.includes(p.rarity)) return false;
    if (f.color.length && !cardColors(p).some(c => f.color.includes(c))) return false;
    if (f.type.length && !f.type.includes(p.type)) return false;
    if (f.treat.length && !f.treat.includes(p.treat)) return false;
    if (f.cond.length && i && !f.cond.includes(i.condition)) return false;
    if (f.min != null && (p.market || 0) < f.min) return false;
    if (f.max != null && (p.market || 0) > f.max) return false;
    for (const o of f.only) {
      if (o === 'fav' && !(i && i.fav)) return false;
      if (o === 'multi' && !(i && i.qty >= 2)) return false;
      if (o === 'graded' && !(i && i.graded)) return false;
      if (o === 'paid' && !(i && i.paid > 0)) return false;
      if (o === 'photo' && !(i && i.photo)) return false;
      if (o === 'moved' && !(p.d1p != null && Math.abs(p.d1a) > 0.004)) return false;
      if (o === 'owned' && !ownedIds.has(p.id)) return false;
      if (o === 'unowned' && ownedIds.has(p.id)) return false;
      if (o === 'special' && p.face === 'plain') return false;
    }
    return true;
  });
}
function sortRows(rows, f) {
  const d = f.dir, key = f.sort;
  const setName = p => (CAT.sets.get(p.set) || {}).pub || '';
  const mv = (p, i) => i ? ((lineChange(p, i) || {}).a || 0) : (p.d1a || 0);
  return rows.slice().sort((a, b) => {
    const A = a.p, B = b.p, ai = a.i, bi = b.i;
    let r = 0;
    switch (key) {
      case 'name':   r = A.name.localeCompare(B.name); break;
      case 'num':    r = A.num.localeCompare(B.num); break;
      case 'set':    r = setName(B).localeCompare(setName(A)) || A.num.localeCompare(B.num); break;
      case 'rarity': r = RARITY_ORDER.indexOf(A.rarity) - RARITY_ORDER.indexOf(B.rarity); break;
      case 'qty':    r = ((bi && bi.qty) || 0) - ((ai && ai.qty) || 0); break;
      case 'added':  r = ((bi && bi.added) || '').localeCompare((ai && ai.added) || ''); break;
      case 'delta':  r = Math.abs(mv(B, bi)) * ((bi && bi.qty) || 1) - Math.abs(mv(A, ai)) * ((ai && ai.qty) || 1); break;
      case 'paid':   r = (((B.market || 0) - ((bi && bi.paid) || 0)) * ((bi && bi.qty) || 1)) -
                         (((A.market || 0) - ((ai && ai.paid) || 0)) * ((ai && ai.qty) || 1)); break;
      default:       r = (B.market || 0) * ((bi && bi.qty) || 1) - (A.market || 0) * ((ai && ai.qty) || 1);
    }

    return d < 0 ? r : -r;
  });
}

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
  chips('#fCond', CONDS.concat(['GRADED']).filter(c => byCond.has(c)).map(c => [c, c === 'GRADED' ? 'Graded' : c, byCond.get(c)]), 'cond');
  $('#fOnly').innerHTML = ONLY[scope].map(([v, lbl]) =>
    `<button class="chip${f.only.includes(v) ? ' on' : ''}" data-only="${v}" aria-pressed="${f.only.includes(v)}">${lbl}</button>`).join('');
  $('#fMin').value = toShown(f.min); $('#fMax').value = toShown(f.max);
  $('#fMin').placeholder = 'min ' + CUR.sym().trim(); $('#fMax').placeholder = 'max ' + CUR.sym().trim();
  paintFilterCount();
  $('#filters').classList.add('on');
}
function paintFilterCount() {
  const f = FILT[sheetScope];
  const pool = sheetScope === 'own'
    ? OWN.items.map(i => ({ i, p: CAT.byId.get(i.id) })).filter(x => x.p)
    : CAT.rows.map(p => ({ p, i: null }));
  const n = applyFilter(pool, f).length;

  $('#fN').textContent = `${n.toLocaleString()} ${sheetScope === 'own' ? 'line' : 'result'}${n === 1 ? '' : 's'}`;
  $('#fApply').classList.toggle('go', n > 0);
}
$('#filters').addEventListener('click', e => {
  const f = FILT[sheetScope];
  const c = e.target.closest('[data-fk]');
  if (c) { const k = c.dataset.fk;

           const v = NUMERIC_FACETS.includes(k) ? +c.dataset.fv : c.dataset.fv;
           const i = f[k].indexOf(v); i >= 0 ? f[k].splice(i, 1) : f[k].push(v);
           c.classList.toggle('on', i < 0); c.setAttribute('aria-pressed', String(i < 0)); paintFilterCount(); return; }
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

function bulkOn() { bulk = new Set(); paintCollection(); }
function paintBulk() {
  $('#bulkBar').style.display = bulk ? 'block' : 'none';
  if (!bulk) return;

  const t = bulkSum(bulk);
  $('#bulkN').textContent = `${t.n} selected`;
  $('#bulkV').textContent = money(t.v);
}
$('#bulkX').addEventListener('click', () => { bulk = null; paintCollection(); });

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
  const items = sortRows(shownLines(), FILT.own);
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
  paintChange();
  $('#colGrid').innerHTML = items.map(({ i, p }) => {
    const s = CAT.sets.get(p.set) || {}, chg = lineChange(p, i);
    const sel = bulk && bulk.has(p.id);
    const prod = SEALED.isGoods(p);
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
        <span class="px mono">${chg && chg.a > 0.004 ? '<span class="up">\u25b2</span> '
            : chg && chg.a < -0.004 ? '<span class="down">\u25bc</span> ' : ''}${money(p.market)}
          <span class="dl">${changeSpan(chg, { tile: true, title: changeTitle(chg, i) })}</span></span>
      </div></button>`;
  }).join('');
}

function paintChange() {
  const el = $('#colChange'); if (!el) return;
  el.innerHTML = changeChips();
}

function setChange(m) {
  if (!CHANGE.set(m)) return false;
  paintCollection(); paintHome();
  if (moversShown()) paintMovers();
  return true;
}
CLICKS.on('[data-chg]', (e, b) => setChange(b.dataset.chg));

const FLIP = { swiped: false };
function flipLine(idx) {
  const i = OWN.items[idx]; if (!i || !i.photo) return false;
  if (i.pic === 'ref') delete i.pic; else i.pic = 'ref';
  commitOwn('pic', { snap: false }); paintCollection(); return true;
}

function flipSwipe(dx, dy) { return Math.abs(dx) >= 40 && Math.abs(dy) < Math.abs(dx); }
(() => {
  const g = $('#colGrid'); if (!g || !g.addEventListener) return; let sw = null;
  const lineOf = t => { const art = t && t.closest ? t.closest('.tile .art') : null, f = art && art.querySelector('[data-act="flip"]'); return f ? { art, line: +f.dataset.line } : null; };
  g.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; const l = lineOf(e.target); sw = l ? { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, art: l.art, line: l.line, held: false } : null; });

  g.addEventListener('pointermove', e => { if (!sw || e.pointerId !== sw.id) return; sw.dx = e.clientX - sw.x; sw.dy = e.clientY - sw.y;
    if (sw.held) return; if (Math.hypot(sw.dx, sw.dy) < 8) return;
    if (Math.abs(sw.dy) > Math.abs(sw.dx)) { sw = null; return; }
    sw.held = true; try { sw.art.setPointerCapture(e.pointerId); } catch (x) {} });
  const end = e => { if (!sw || e.pointerId !== sw.id) return; const { dx, dy, line, held } = sw; sw = null; if (!held || !flipSwipe(dx, dy)) return;
    FLIP.swiped = true; setTimeout(() => { FLIP.swiped = false; }, 350); flipLine(line); };
  g.addEventListener('pointerup', end); g.addEventListener('pointercancel', () => { sw = null; });

  g.addEventListener('keydown', e => { const f = e.target && e.target.closest ? e.target.closest('[data-act="flip"]') : null; if (!f || (e.key !== 'Enter' && e.key !== ' ')) return; e.preventDefault(); e.stopPropagation(); flipLine(+f.dataset.line); });
})();
$('#colq').addEventListener('input', e => { colQuery = e.target.value; paintCollection(); });
CLICKS.on('#colClearF', e => {
  if (e.target.id === 'colClearF') {
    Object.assign(FILT.own, blankFilter('own')); FILT.save('own'); paintCollection();
  }
});
$('#favOnly').addEventListener('click', () => {
  favOnly = !favOnly; const b = $('#favOnly'); b.classList.toggle('on', favOnly); b.setAttribute('aria-pressed', String(favOnly)); paintCollection();
});
CLICKS.on('[data-open]', e => {
  const t = e.target.closest('[data-open]');
  if (!t) return;
  if (e.target.closest('[data-act="flip"]') || FLIP.swiped) return;
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
    adprivacy: () => ADS.privacy(),
    backup: () => { if (scheduleBackup('manual') !== false) toast('Backing up to Documents/OPTCGHub'); },
    restore: restoreFromBackup,
    wants: () => go('wants'),
    binder: () => go('binder'),
    movers: showMovers,
    homemovers: () => toggleHomeMovers(),
    homesets: () => toggleHomeSets(),
    syncnow: el => syncFromReport(el),
    trade:  () => go('trade'),
    bulk:   () => { go('collection'); bulkOn(); toast('Tap cards to select'); },
    import: importCsv,
    flip: el => flipLine(+el.dataset.line),
    update: async () => { if (UPDATE.newer()) { await PLATFORM.openStore(); return; } await UPDATE.check(); paintSettings(); toast(UPDATE.note()); }
  })[a.dataset.act]?.(a);
});

const REPORT = { at: 20, jump: 10, n: 25 };
function reportKeeps(then, now) {
  if (!(then > 0) || !(now > 0)) return false;
  return Math.max(then, now) >= REPORT.at || (now >= REPORT.jump && now >= 2 * then) || (then >= REPORT.jump && then >= 2 * now);
}

const ODD = { x: 4 };
function oddPrice(p) {
  if (!p || !(p.market > 0)) return null;
  if (p.low > 0 && p.low >= ODD.x * p.market) return { side: 'low', at: p.low };
  if (p.high > 0 && p.market >= ODD.x * p.high) return { side: 'high', at: p.high };
  return null;
}

function marketReport(mode) {
  const rows = [];
  for (const p of CAT.rows) {
    if (!p.num || p.sealed || !(p.market > 0)) continue;
    const c = lineChange(p, null, mode); if (!c || c.first) continue;
    const then = p.market - c.a;
    if (pctNum(c.pc) === '0.0%' || !reportKeeps(then, p.market)) continue;
    rows.push({ p, c, then, now: p.market, odd: oddPrice(p) });
  }
  return { fallers: rows.filter(r => r.c.pc < 0).sort((a, b) => a.c.pc - b.c.pc).slice(0, REPORT.n),
           risers: rows.filter(r => r.c.pc > 0).sort((a, b) => b.c.pc - a.c.pc).slice(0, REPORT.n), kept: rows.length };
}

function reportRule() {
  return `Cards at $${REPORT.at}+, or that doubled to or halved from $${REPORT.jump}+; new cards left out. Ranked by %.`;
}

function moverSpan(m) {
  return m === 'added' ? 'since added' : m === 'day' ? (D1().gap == null ? sinceLabel() : `${dayText(D1().from)} \u2192 ${dayText(D1().to)}`)
    : `${dayText(periodStart(m))} \u2192 ${dayText((CAT.days || []).slice(-1)[0] || '')}`;
}

function moverRow(r, k) {
  return `<button class="row mvrow" style="width:100%;text-align:left;align-items:center" data-open="${r.p.id}">
      <span class="mvrank mono">${k + 1}</span>${cardPic(r.p)}<div class="nm"><b>${esc(r.p.name)}${r.p.treat !== 'base'
        ? ` <span class="badge">${esc(TREAT[r.p.treat] || r.p.treat)}</span>` : ''}</b>
      <span>${dotJoin(esc(r.p.num), esc((CAT.sets.get(r.p.set) || {}).abbr || ''))}</span>${r.odd
        ? `<span class="mvodd">Odd price \u00b7 ${r.odd.side === 'low' ? 'lowest' : 'highest'} listing ${money(r.odd.at)}</span>` : ''}</div>
      <div class="v mono ${r.c.pc < 0 ? 'down' : 'up'}">${signedPct(r.c.pc, true)}<span>${money(r.then)} \u2192 ${money(r.now)}</span></div></button>`;
}
function moversShown() { return ($('#allRes').innerHTML || '').includes('Fell the most'); }
function paintMovers() {
  const lines = OWN.items.map(i => ({ i, p: CAT.byId.get(i.id) })).filter(x => x.p);
  const rows = lines.map(x => ({ ...x, c: lineChange(x.p, x.i) })).filter(x => x.c && Math.abs(x.c.pc) >= 0.01)
    .map(x => ({ ...x, dollars: x.c.a * x.i.qty }))
    .sort((a, b) => Math.abs(b.dollars) - Math.abs(a.dollars));
  const gm = CHANGE.mode === 'added' ? 'day' : CHANGE.mode;
  const R = marketReport(gm);
  const asOf = CAT.man.source_updated_at ? dayText(CAT.man.source_updated_at) : '';
  const span = moverSpan;
  const line = (p, c, title, extra) => `<button class="row" style="width:100%;text-align:left;align-items:center" data-open="${p.id}">
      ${cardPic(p)}<div class="nm"><b>${esc(p.name)}${p.treat !== 'base'
        ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
      <span>${dotJoin(esc(p.num), money(p.market))}${extra || ''}</span></div>
      <div class="v">${changeSpan(c, { title })}</div></button>`;
  const ranked = moverRow;
  const list = (L, none) => (L.length ? L.map(ranked).join('') : `<div class="note">${none}</div>`);
  $('#allRes').innerHTML = `
    <div class="chips" role="group" aria-label="The period the moves cover" style="margin:0 0 12px">${changeChips()}</div>
    <div class="note mvfresh">${asOf ? `Prices as of ${esc(asOf)}, from TCGplayer via TCGCSV. The app looks for newer ones when you come back to it.` : 'No price day on file.'}
      <button class="linkish" data-act="syncnow">Check for newer prices</button></div>
    <div class="panel"><h3>Fell the most \u00b7 ${esc(span(gm))}</h3>${list(R.fallers, `No card fell by the rule ${esc(changeWords(gm))}.`)}</div>
    <div class="panel"><h3>Rose the most \u00b7 ${esc(span(gm))}</h3>${list(R.risers, `No card rose by the rule ${esc(changeWords(gm))}.`)}
      <div class="note">${esc(reportRule())}${CHANGE.mode === 'added' ? ' Since added counts the cards you own; these lists show the day\u2019s moves.' : ''}</div>
    </div>
    <div class="panel"><h3>Your collection \u00b7 ${esc(span(CHANGE.mode))}</h3>
      ${rows.length ? rows.slice(0, 10).map(x => line(x.p, x.c, changeTitle(x.c, x.i),
          x.i.qty > 1 ? ` \u00b7 \u00d7${x.i.qty} = ${signedMoney(x.dollars)}` : '')).join('')
        : `<div class="note">${lines.length
            ? `Nothing you own moved ${esc(changeWords())}.`
            : 'Add cards and their moves show up here.'}</div>`}
    </div>`;
}

async function syncFromReport(el) {
  if (el) el.disabled = true;
  try { return await PLATFORM.refreshCatalogue(); } finally { if (moversShown()) paintMovers(); else if (el) el.disabled = false; }
}
function showMovers() {
  paintMovers();
  $('#setPanel').style.display = 'none';
  go('search'); window.scrollTo(0, 0);
}

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

        const num = iNum >= 0 ? c[iNum] : null;
        const cand = num ? candidates(num, null) : [];
        if (cand.length === 1) pid = cand[0].id;
        else { (cand.length ? ambiguous++ : skipped++); continue; }
      }
      let pf = null;
      if (iPf >= 0 && c[iPf]) { const ex = PF.list.find(p => p.name === c[iPf]); pf = ex ? ex.id : PF.add(c[iPf]); }

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

function backupJson(keepPhotos = false) {
  return JSON.stringify({
    app: 'OP TCG Hub', take: TAKE, at: new Date().toISOString(),
    catalogue: CAT.man.source_updated_at || null,
    items: OWN.items.map(i => ({ ...i, photo: i.photo ? (keepPhotos ? i.photo : '(on device)') : null })),
    portfolios: PF.list, activePortfolio: PF.active, wants: WANT.list, alerts: ALERTS.list,
    snaps: OWN.snaps, decks: DECKS.list, credits: CREDITS.state,
    stockAlerts: STOCK.list, relAlerts: RELALERTS.list, notes: LOCAL.notes, trade: { give: TRADE.give, get: TRADE.get },
    trades: TRADES.list,
    filters: { own: FILT.own, all: FILT.all },

    batch: { rows: BATCH.rows.map(r => ({ ...r, photo: r.photo ? (keepPhotos ? r.photo : '(on device)') : null })), setId: BATCH.setId || null }
  });
}

function commitOwn(reason, { snap = true } = {}) { if (snap) OWN.snapshot(); else OWN.save(); scheduleBackup(reason); }
let _backupTimer = null;

function backupHeld() {
  if (STORE.holdBackup) return true;
  try { return localStorage.getItem('vault.backupHold') != null; } catch (e) { return false; }
}
function releaseBackupHold() { STORE.holdBackup = false; try { localStorage.removeItem('vault.backupHold'); } catch (e) {} }
function scheduleBackup(reason, wait = 400) {
  if (reason === 'manual' && backupHeld()) {
    if (!confirm(`The ${heldWhat()} saved on this phone could not be read, so your last backup may hold what the app cannot show now.\n\nBack up now and replace it? Restore from backup brings it back instead.`)) return false;
    releaseBackupHold();
  }
  clearTimeout(_backupTimer);
  _backupTimer = setTimeout(async () => {
    if (backupHeld()) { if (await PLATFORM.readBackup()) return; releaseBackupHold(); }
    let where = null, why = '';
    try { where = await PLATFORM.backup(backupJson()); } catch (e) { why = String((e && e.message) || e); }

    OWN.lastBackup = where ? { at: new Date().toISOString(), where, reason } : { failed: true, at: new Date().toISOString(), why };
    saveJson('vault.lastBackup', OWN.lastBackup);
    if (!where) { ERRS.push('backup', `backup failed: ${why}`, 'scheduleBackup'); toast('Backup failed — export your collection'); }
  }, wait);
}

const BACKUP_LISTS = ['items', 'snaps', 'decks', 'portfolios', 'wants', 'alerts', 'stockAlerts', 'relAlerts', 'notes'];
const isRecord = x => !!x && typeof x === 'object' && !Array.isArray(x);
function backupProblem(b) {
  if (!isRecord(b) || b.app !== 'OP TCG Hub') return 'the file is not an OP TCG Hub backup';
  if (!Array.isArray(b.items)) return 'the backup has no list of cards';
  const k = BACKUP_LISTS.find(x => b[x] != null && !Array.isArray(b[x])); if (k) return `its ${k} are not a list`;
  if (b.items.some(i => !isRecord(i) || i.id == null)) return 'a line in it names no printing';
  if (b.decks && b.decks.some(d => !isRecord(d) || !Array.isArray(d.cards))) return 'a deck in it has no card list';
  if (b.trade != null && (!isRecord(b.trade) || [b.trade.give, b.trade.get].some(x => x != null && !Array.isArray(x)))) return 'its trade lists are not lists';
  if (b.trades != null && (!Array.isArray(b.trades) || b.trades.some(t => !isRecord(t) || !Array.isArray(t.gave) || !Array.isArray(t.got)))) return 'its trades are not a list of trades';
  if (b.credits != null && !isRecord(b.credits)) return 'its credits are not a record';
  if (b.batch != null && (!isRecord(b.batch) || !Array.isArray(b.batch.rows) || b.batch.rows.some(r => !isRecord(r) || r.id == null))) return 'its waiting scans are not a list of cards';
  return '';
}
function keptBeforeRestore() { try { return localStorage.getItem('vault.beforeRestore'); } catch (e) { return null; } }
async function keepBeforeRestore() {
  const any = [OWN.items, DECKS.list, WANT.list, ALERTS.list, STOCK.list, RELALERTS.list, LOCAL.notes, TRADE.give, TRADE.get, BATCH.rows, TRADES.list].some(l => l && l.length);
  if (!any) { try { localStorage.removeItem('vault.beforeRestore'); } catch (e) {} return true; }
  const json = backupJson(true), here = saveJson('vault.beforeRestore', json);
  await PLATFORM.keepAside(json);

  return here;
}
async function restoreFromBackup() {
  let raw = await PLATFORM.readBackup(), src = 'latest';
  const kept = keptBeforeRestore();

  let latestDay = ''; try { latestDay = localDay(JSON.parse(raw).at); } catch (e) {}
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
    toast('No backup of this install \u2014 choose the newest file in Documents \u203a OPTCGHub');
    raw = await PLATFORM.pickTextFile('.json,application/json');
    if (!raw) return toast('No backup chosen');
  }
  let b; try { b = JSON.parse(raw); } catch (e) { return toast('Backup is not readable'); }
  const why = backupProblem(b);
  if (why) { ERRS.push('restore', `refused: ${why}`, 'restoreFromBackup'); return toast(`Nothing restored \u2014 ${why}`, 6000); }
  const n = b.items.length, d = (b.decks || []).length, w = b.batch ? b.batch.rows.length : 0;
  const decksW = `${d} deck${d === 1 ? '' : 's'}`, waitW = `${w} waiting scan${w === 1 ? '' : 's'}`;
  if (!confirm(`Restore ${n} collection line${n === 1 ? '' : 's'}${w ? `, ${decksW} and ${waitW}` : ` and ${decksW}`} from ${momentText(b.at)}?\n\nThis replaces what is on the phone now. What it replaces is kept: Restore from backup offers it.`)) return;
  if (!(await keepBeforeRestore())) {
    if (!confirm('What is on the phone now could not be kept aside (the storage is full).\n\nRestore anyway? Cancel, then Export CSV, keeps it.')) return;
    try { localStorage.removeItem('vault.beforeRestore'); } catch (e) {}
  }
  const own = src === 'kept';
  OWN.items = b.items.map(i => ({ ...i, photo: own && i.photo && i.photo !== '(on device)' ? i.photo : null }));
  OWN.snaps = b.snaps || []; DECKS.list = b.decks || [];
  if (b.portfolios) { PF.list = b.portfolios; PF.active = b.activePortfolio || 'main'; PF.save(); }
  if (b.wants) { WANT.list = b.wants; WANT.save(); }
  if (b.alerts) { ALERTS.list = b.alerts; ALERTS.save(); }
  if (b.stockAlerts) { STOCK.list = b.stockAlerts; STOCK.save(); }
  if (b.relAlerts) { RELALERTS.list.forEach(a => PLATFORM.cancelNotify(RELALERTS.nid(a.id))); RELALERTS.list = b.relAlerts; RELALERTS.save(); RELALERTS.list.forEach(a => RELALERTS.arm(a)); }
  if (b.notes) { LOCAL.notes = b.notes; LOCAL.saveNotes(); }
  if (b.trade) { TRADE.give = b.trade.give || []; TRADE.get = b.trade.get || []; TRADE.save(); }
  if (b.trades) { TRADES.list = b.trades; TRADES.save(); }
  if (b.credits) CREDITS.state = b.credits;
  if (b.batch) { BATCH.rows = b.batch.rows.map(r => ({ ...r, photo: own && r.photo && r.photo !== '(on device)' ? r.photo : null })); BATCH.setId = b.batch.setId || null; BATCH.save(); }
  DECKS.save(); CREDITS.save(); releaseBackupHold();
  commitOwn('restore');
  toast(`Restored ${n} lines, ${d} decks` + (w ? `, ${w} waiting scans` : '')); go('collection');
}

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
  const name = `optcghub-${phoneToday()}.csv`;
  const shared = await PLATFORM.shareFile(name, csv, 'Keep this somewhere safe');
  if (shared === 'shared') return toast(`Exported ${rows.length} rows`);
  if (shared === 'cancelled') return;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  a.click(); URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} rows`);
}

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
<div class="note">Market prices are estimates. Condition is the owner’s own call and doesn’t change the price shown. Made with OP TCG Hub. Not affiliated with Bandai, Shueisha, Toei Animation, Viz Media or TCGplayer.</div>
</body></html>`;
}
async function shareCollectionPage() {
  const html = collectionPage();
  const name = `optcghub-${phoneToday()}.html`;
  const shared = await PLATFORM.shareFile(name, html, 'Share your collection page');
  if (shared === 'shared') return toast('Collection page shared');
  if (shared === 'cancelled') return;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  toast('Collection page saved');
}

const HUNT = {
  feed: readJson('vault.hunt', null, false),
  url() { const b = CAT.man.updateUrl; return b ? b.replace(/bundle\/?$/, '') + 'hunt/feed.json' : null; },
  async sync({ quiet = false } = {}) {
    const u = this.url(); if (!u) { if (!quiet) toast('Sync is not configured'); return false; }
    if (!navigator.onLine) { if (!quiet) toast('Offline'); return false; }
    try { const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status);
      const f = await r.json(); if (!f || !f.sources) throw new Error('not a feed');
      this.feed = f; try { localStorage.setItem('vault.hunt', JSON.stringify(f)); } catch (e) {}
      return true; } catch (e) { if (!quiet) toast('Stock feed unavailable \u2014 ' + e.message); return false; }
  },
  hist: readJson('vault.hunt.hist', null, false),
  async syncHistory() { const u = this.url(); if (!u || !navigator.onLine) return false;
    try { const r = await fetch(u.replace(/feed\.json$/, 'history.json'), { cache: 'no-store' }); if (!r.ok) return false; const h = await r.json(); if (!h || !Array.isArray(h.runs)) return false;
      this.hist = h; try { localStorage.setItem('vault.hunt.hist', JSON.stringify(h)); } catch (e) {} return true; } catch (e) { return false; } },

  restocks(tcin, zip) { const h = this.hist; if (!h || !h.runs || !h.runs.length) return null;
    const runs = h.runs; const out = { runs: runs.length, since: h.since, lastShip: null, shipRuns: 0, events: [] };

    const at = r => Date.parse(r && r.t), span = ts => { ts = ts.filter(t => !isNaN(t)); return ts.length > 1 ? (Math.max(...ts) - Math.min(...ts)) / 864e5 : 0; };
    out.days = span(runs.map(at));

    const seen = [], shelf = [];
    for (const r of runs) { const o = r.online && r.online[tcin], sh = zip && r.shelf && r.shelf[zip] && r.shelf[zip][tcin];
      if (o != null) { out.shipRuns++; if (o) out.lastShip = r.t; }
      if (sh) shelf.push(at(r)); if (o != null || sh) seen.push(at(r)); }
    out.checks = seen.length; out.checkDays = span(seen); out.shelfRuns = shelf.length; out.shelfDays = span(shelf);
    if (zip) { const prev = {};
      for (const r of runs) { const st = r.shelf && r.shelf[zip] && r.shelf[zip][tcin]; if (!st) continue;
        for (const [sid, q] of Object.entries(st)) { if ((prev[sid] || 0) === 0 && q > 0) out.events.push({ t: r.t, store: sid, qty: q }); prev[sid] = q; } } }
    return out; },

  DIST_KEY: { gts: 'sku', southern: 'id' },
  GTS_BY_DATE: new Set(['coming', 'preorder', 'out']),
  distKind(d, a, b) { return a == null || b == null ? 'page' : (d === 'southern' || (this.GTS_BY_DATE.has(a) && this.GTS_BY_DATE.has(b))) ? 'dates' : 'page'; },
  distTimeline(d, id) { const h = this.hist; if (!h || !Array.isArray(h.runs) || !h.runs.length) return null;
    const runs = h.runs.filter(r => r && typeof r.t === 'string' && !isNaN(Date.parse(r.t))).sort((a, b) => Date.parse(a.t) - Date.parse(b.t)); if (!runs.length) return null;
    const tl = { checks: 0, first: null, last: null, missed: 0, odd: 0, state0: null, now: null, changes: [], end: runs[runs.length - 1].t };
    let prev = null, prevT = null;
    for (const r of runs) { const m = r[d];
      if (!m || typeof m !== 'object' || Array.isArray(m) || !Object.keys(m).length) { if (tl.checks) tl.missed++; continue; }
      const v = Object.prototype.hasOwnProperty.call(m, id) ? m[id] : undefined;
      if (v !== undefined && typeof v !== 'string') { tl.odd++; continue; }
      const st = v === undefined ? null : v; tl.checks++;
      if (tl.checks === 1) { tl.first = r.t; tl.state0 = st; }
      else if (st !== prev) tl.changes.push({ from: prev, to: st, after: prevT, by: r.t, kind: this.distKind(d, prev, st) });
      prev = st; prevT = r.t; tl.last = r.t; }

    const ds = h.dates && typeof h.dates === 'object' && h.dates[d] && h.dates[d][id], day = x => x === null || (typeof x === 'string' && /^\d{4}-\d\d-\d\d$/.test(x));
    if (Array.isArray(ds)) { const es = ds.filter(e => Array.isArray(e) && e.length === 3 && typeof e[0] === 'string' && !isNaN(Date.parse(e[0])) && day(e[1]) && day(e[2]))
        .sort((a, b) => Date.parse(a[0]) - Date.parse(b[0]));
      for (let i = 1; i < es.length; i++) for (const [field, j] of [['release', 1], ['due', 2]]) if (es[i][j] !== es[i - 1][j]) {
        const by = es[i][0], read = runs.filter(r => Date.parse(r.t) < Date.parse(by) && r[d] && typeof r[d] === 'object' && !Array.isArray(r[d]) && Object.keys(r[d]).length).pop();
        tl.changes.push({ kind: 'moved', field, from: es[i - 1][j], to: es[i][j], after: read ? read.t : null, by }); }
      tl.changes.sort((a, b) => Date.parse(a.by) - Date.parse(b.by)); }
    tl.now = prev; return tl; },
  storeName(zip, sid) { const st = this.hist && this.hist.stores && this.hist.stores[zip]; const x = (st || []).find(y => y.id === sid); return x ? x.name : sid; },
  ageMin(iso) { return iso ? Math.round((Date.now() - Date.parse(iso)) / 60000) : null; },
  ageLabel(iso) { const m = this.ageMin(iso); if (m == null) return 'never'; if (m < 2) return 'just now'; if (m < 60) return `${m} min ago`; if (m < 48 * 60) return `${Math.round(m / 60)} h ago`; return `${Math.round(m / 1440)} days ago`; },
  stale(iso) { const m = this.ageMin(iso); return m == null || m > 180; },

  byCatalogId() { const out = {}; const t = this.feed && this.feed.sources && this.feed.sources.target; if (!t || !t.items) return out;
    for (const it of t.items) if (it.catalog_id) (out[it.catalog_id] ||= []).push(it); return out; },

  wmByCatalogId() { const out = {}; const w = this.feed && this.feed.sources && this.feed.sources.walmart; if (!w || !w.items) return out;
    for (const it of w.items) if (it.catalog_id) (out[it.catalog_id] ||= []).push(it); return out; },

  DISTS: [['gts', 'GTS Distribution'], ['southern', 'Southern Hobby']],
  dist(k) { return this.feed && this.feed.sources && this.feed.sources[k]; },

  goneFor(pid) { const h = this.hist, out = []; if (!h || !h.items || typeof h.items !== 'object') return out;
    for (const [d] of this.DISTS) { const D = this.dist(d), m = h.items[d]; if (!D || !Array.isArray(D.items) || !D.items.length || !m || typeof m !== 'object' || Array.isArray(m)) continue;
      const key = this.DIST_KEY[d] || 'id', listed = new Set(D.items.map(i => String(i[key])));
      for (const [id, v] of Object.entries(m)) if (v && typeof v === 'object' && v.catalog_id === pid && typeof v.seen === 'string' && !isNaN(Date.parse(v.seen)) && !listed.has(id))
        out.push({ _d: d, _gone: true, [key]: id, catalog_id: pid, seen: v.seen }); }
    return out; },
  distName(k) { return (this.DISTS.find(d => d[0] === k) || [k, k])[1]; },

  unreached(D) { return !!D && (!D.ok || !!D.kept); },
  distItems() { const out = []; for (const [k] of this.DISTS) { const D = this.dist(k); if (D && D.ok) for (const it of (D.items || [])) out.push(Object.assign(Object.create(it), { _d: k, _k: k + ':' + (it.sku || it.id) })); } return out; },
  distByCatalogId() { const out = {}; for (const it of this.distItems()) if (it.catalog_id) (out[it.catalog_id] ||= []).push(it); return out; },

  listedIds() { const s = new Set(); for (const k of Object.keys(this.distByCatalogId())) s.add(+k); for (const k of Object.keys(this.byCatalogId())) s.add(+k); for (const k of Object.keys(this.wmByCatalogId())) s.add(+k);
    for (const sh of ((LOCAL.shops && LOCAL.shops.shops) || [])) for (const it of (sh.sealed || [])) if (it.catalog_id) s.add(+it.catalog_id); return s; },

  zip: localStorage.getItem('vault.hunt.zip') || '',
  setZip(z) { this.zip = String(z || '').replace(/\D/g, '').slice(0, 5); saveJson('vault.hunt.zip', this.zip); },
  served() { const t = this.feed && this.feed.sources && this.feed.sources.target; const zips = Object.keys((t && t.zips) || {}); if (!this.zip || !zips.length) return { how: 'none', zips };
    if (zips.includes(this.zip)) return { how: 'exact', zip: this.zip, zips };
    const pre = zips.find(z => z.slice(0, 3) === this.zip.slice(0, 3)); if (pre) return { how: 'area', zip: pre, zips };
    return { how: 'none', zips }; }
};
async function askZip() {
  const v = await ask({ title: 'Your zip code', kind: 'number', placeholder: '37203', ok: 'Use this zip',
    why: 'Adds shelf stock at stores near you. It stays on this phone.' });
  const z = String(v || '').replace(/\D/g, ''); if (z.length === 5) { HUNT.setZip(z); return true; } return false;
}

function walmartLine(it) {
  const o = it.online;
  const what = o ? `${o.price != null ? money(o.price) : 'no price stated'} \u00b7 ${o.status === 'IN_STOCK' ? 'ships' : String(o.status || '?').toLowerCase().replace(/_/g, ' ') + ' online'}${o.seller ? ' \u00b7 sold by ' + esc(o.seller) : ''} \u00b7 ${HUNT.ageLabel(o.checked_at)}` : 'online stock not checked yet';
  return `<span style="display:block;color:var(--brass)">Walmart ${what}</span>`;
}
function targetLine(it, T) {

  const online = it.online ? (it.online.status === 'IN_STOCK' ? `ships${it.online.qty ? ' (' + it.online.qty + ' online)' : ''}` : String(it.online.status || '?').toLowerCase().replace(/_/g, ' ') + ' online') + (it.online_at ? ` ${HUNT.ageLabel(it.online_at)}` : '') : 'online stock not checked yet';
  const sv = HUNT.served(); let shelfTxt = '';
  if (sv.how !== 'none') { const zz = T.zips[sv.zip]; if (!zz || !zz.ok) shelfTxt = `local check for ${sv.zip} ${zz && zz.error ? 'not done: ' + zz.error : 'failed'}`;
    else if (!(zz.checked_at || {})[it.tcin]) shelfTxt = 'shelf not checked yet for this item';
    else { const st = zz.stock[it.tcin] || {}; const on = Object.entries(st).filter(([, v]) => (v.qty || 0) > 0).map(([id, v]) => { const x = zz.stores.find(y => y.id === id); return `${x ? x.name : id} (${v.qty})`; });
      shelfTxt = (on.length ? `on the shelf: ${on.join(', ')}` : `not on a shelf within ${T.radius || 50} mi of ${sv.zip}`) + ` ${HUNT.ageLabel(zz.checked_at[it.tcin])}`; } }
  const sv2 = HUNT.served(); const rs = HUNT.restocks(it.tcin, sv2.how !== 'none' ? sv2.zip : null); let histTxt = '';
  if (rs && rs.runs >= 2) { const dd = x => Math.max(1, Math.round(x)), days = dd(rs.shelfDays), cd = dd(rs.checkDays);
    const ship = rs.lastShip ? `last seen shipping ${HUNT.ageLabel(rs.lastShip)}` : (rs.shipRuns ? `not seen shipping in ${rs.shipRuns} checks` : '');
    const ev = rs.events.slice(-3).map(e => `${HUNT.storeName(sv2.zip, e.store)} ${new Date(e.t).toLocaleDateString(undefined, { weekday: 'short', hour: 'numeric' })}`).join(', ');

    histTxt = [ship, rs.events.length ? `restocked ${rs.events.length}\u00d7 in ${days} d: ${ev}` : (sv2.how !== 'none' && rs.shelfRuns >= 2 && rs.shelfDays >= 1 ? `no shelf restock seen in ${days} d` : '')].filter(Boolean).join(' \u00b7 ');
    if (rs.checks && Math.round(rs.checkDays) < 14) histTxt += `${histTxt ? ' \u00b7 ' : ''}${rs.checks} check${rs.checks === 1 ? '' : 's'} of it ${rs.checkDays < 1 ? 'in less than a day' : `over ${cd} day${cd === 1 ? '' : 's'}`} so far \u2014 a pattern needs a fortnight`; }
  return `<span style="display:block;color:var(--brass)">Target ${money(it.price)} \u00b7 ${esc(online)}${shelfTxt ? ' \u00b7 ' + esc(shelfTxt) : ''}</span>${histTxt ? `<span style="display:block;color:var(--dim2);font-size:var(--fs-sm)">${esc(histTxt)}</span>` : ''}`;
}

const DIST_WORDS = { sold_out: 'sold out', call: 'call to order', in_stock: 'in stock for stores', preorder: 'orders were due', coming: 'stores order by', out: 'out of stock', unknown: 'no status' };
const GTS_SHORT = { coming: 'orders close' };
const GTS_NODATE = { coming: 'order due date ahead', preorder: 'no order due date listed' };
const nbsp = s => String(s).replace(/[ \u202f]/g, '\u00a0');
function gtsWord(it, over, day) { const s = it.status; if (s !== 'coming' && s !== 'preorder') return DIST_WORDS[s] || s;
  return it.preorder ? ((over && over[s]) || DIST_WORDS[s]) + day(it.preorder) : GTS_NODATE[s]; }

const SH_WORDS = { orders_open: 'stores order by', orders_closed: 'stores\u2019 orders closed', released: 'released', unknown: 'no dates' };

const SH_SHORT = { orders_open: 'orders close', orders_closed: 'orders closed', released: 'released', unknown: 'no dates' };

const SH_AT = { orders_open: 'due', orders_closed: 'due', released: 'release' };
function shWord(it, words, day) { const own = (m, k) => Object.prototype.hasOwnProperty.call(m, k), f = own(SH_AT, it.state) ? SH_AT[it.state] : null, at = f && it[f];
  return (own(words, it.state) ? words[it.state] : String(it.state)) + (at ? day(at) : ''); }
const DISTF = { open: new Set(), hist: new Set() };
function distShort(it) {
  const day = d => ' ' + dayText(d).replace(/ /g, '\u00a0');
  const w = it._d === 'southern' ? shWord(it, SH_SHORT, day) : gtsWord(it, GTS_SHORT, day);
  return esc(HUNT.distName(it._d || 'gts')) + ' \u00b7 ' + esc(w);
}
function distRowLines(p, list) {
  if (!list || !list.length) return '';
  return `<div class="dlines">${list.map(it => `<button class="dline" data-open="${p.id}" data-distinfo="1" aria-label="${distShort(it)}: open ${esc(p.name)} at Distributor info"><span>${distShort(it)}</span>${chev(false, 14)}</button>`).join('')}</div>`;
}
function distFold(key, summary, body) {
  const open = DISTF.open.has(key);
  return `<button class="dfold" data-distfold="${key}" aria-expanded="${open}"><span><span class="ttl">Distributor info</span><span class="note">${summary}</span></span>${chev(open)}</button>${open ? `<div class="dbody">${body}</div>` : ''}`;
}
function distSummary(extra) {

  const src = HUNT.DISTS.map(([k]) => HUNT.dist(k)).filter(Boolean), live = src.filter(D => !HUNT.unreached(D)), dead = src.filter(D => HUNT.unreached(D));
  const at = live.map(D => D.fetched_at).sort().pop(), stale = live.filter(D => HUNT.stale(D.fetched_at)).length;

  const since = dead.length && dead.every(D => D.stale_since) ? dead.map(D => D.stale_since).sort()[0] : '';
  return [extra, `${src.length} distributor${src.length === 1 ? '' : 's'}`, at ? 'checked ' + esc(HUNT.ageLabel(at)) : '', stale ? `${stale} out of date` : '', dead.length ? `${dead.length} not reached${since ? ' since ' + esc(nbsp(momentText(since))) : ''}` : ''].filter(Boolean).join(' \u00b7 ');
}

function picturesLine(im = CAT.man.images) {
  if (!im) return 'not measured';
  const ids = Array.isArray(im.missing_sealed_ids) ? im.missing_sealed_ids : null, rows = ids ? ids.map(id => CAT.byId.get(+id)) : [];
  const don = rows.filter(p => p && SEALED.isDon(p)).length, gone = rows.filter(p => !p).length;
  const what = ids ? `${im.missing_cards} cards, ${don} DON!! cards and ${ids.length - don - gone} sealed products${gone ? ` (and ${gone} no longer in the catalogue)` : ''}`
    : `${im.missing_cards} cards and ${im.missing_sealed} rows without a number (sealed products and DON!! cards)`;

  const ph = Number.isInteger(im.placeholder) && im.placeholder ? ` (${im.placeholder} of them the host’s “Image Coming Soon”, shipped with none)` : '';
  return `${what} have no picture at the first host${ph}; ${im.alt_served} served by the second, ${im.exported} shipped that way` + (im.measured ? '' : ' (sealed images not yet measured)');
}
function sealedCountLine() {
  const sealed = CAT.rows.filter(p => p.sealed), goods = sealed.filter(p => SEALED.isGoods(p)), priced = goods.filter(p => SEALED.isProduct(p)).length;
  return `${priced} priced (${sealed.length} rows filed as sealed: ${sealed.length - goods.length} DON!! cards, ${goods.length - priced} unpriced)`;
}
function setsWithCards() { return new Set(CAT.rows.filter(p => p.num).map(p => p.set)).size; }
function catalogueNote() {
  const cards = CAT.rows.filter(p => p.num).length;
  return `${CAT.rows.length} printings (${cards} cards, ${CAT.rows.length - cards} without a number), ${CAT.sets.size} sets (${setsWithCards()} with cards), prices ${(CAT.man.source_updated_at || '?').slice(0, 10)}`;
}

function setCode(s) {
  const a = String((s && s.abbr) || '').trim(); if (!a) return '';
  const [head, ...tail] = a.split(/\s+/), parts = head.split('-'), codes = [];
  for (let k = 0; k < parts.length; k++) {
    const m = /^([A-Za-z]+)(\d+)$/.exec(parts[k]);
    if (m) { codes.push(`${m[1].toUpperCase()}-${m[2]}`); continue; }
    if (/^[A-Za-z]+$/.test(parts[k]) && /^\d+$/.test(parts[k + 1] || '')) { codes.push(`${parts[k].toUpperCase()}-${parts[k + 1]}`); k++; continue; }
    return a;
  }
  return [codes.join('/'), ...tail].join(' ');
}
function setTitle(s) {
  const name = (s && s.name) || 'Other', code = setCode(s), bare = x => String(x).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return code && !bare(name).includes(bare(code)) ? `${name} (${code})` : name;
}

function setTitleHtml(s) {
  const t = setTitle(s), name = (s && s.name) || 'Other';
  return t === name ? esc(t) : `${esc(name)} <span class="setcode">(${esc(setCode(s))})</span>`;
}
function setCards(s, today = phoneToday()) { return s.n ? `${s.n} cards` : s.pub && s.pub >= today ? 'card list not published yet' : 'sealed products only'; }

function paintDevEarn() { const de = $('#devEarn'); if (de) de.textContent = `+${CREDITS.PER_AD} test credits`; }
function feedLine() {
  if (!HUNT.feed) return 'none';
  const kept = D => D && D.kept ? ` (kept; not reached since ${momentText(D.stale_since || D.fetched_at)})` : '', T = HUNT.feed.sources && HUNT.feed.sources.target;
  const W = HUNT.feed.sources && HUNT.feed.sources.walmart;
  return [`${HUNT.ageLabel(HUNT.feed.fetched_at)}`, `target ${T && T.ok ? 'ok' : 'not ok'}${kept(T)}`,
    `walmart ${W ? (W.ok ? (W.items || []).length + ' items, ' + (W.items || []).filter(i => i.online).length + ' with an answer' + kept(W) : 'not ok') : 'absent'}`,
    ...HUNT.DISTS.map(([k]) => { const D = HUNT.dist(k); return `${k} ${D ? (D.ok ? (D.items || []).length + ' products' + kept(D) : 'not ok') : 'absent'}`; })].join(', ');
}

function sourceLead(name, D) {

  const lost = `Could not reach ${esc(name)}` + (D.stale_since ? ` since ${esc(momentText(D.stale_since))}` : !D.ok && D.fetched_at ? ` when last tried, ${esc(momentText(D.fetched_at))}` : '');
  if (!D.ok) return lost + '.';
  return D.kept ? `${lost}; its last check, ${esc(HUNT.ageLabel(D.fetched_at))}, is shown` : `Checked ${esc(HUNT.ageLabel(D.fetched_at))}${HUNT.stale(D.fetched_at) ? ' \u2014 <b>out of date</b>' : ''}`;
}
function distFoldTap(key) {
  if (DISTF.open.has(key)) DISTF.open.delete(key); else DISTF.open.add(key);
  if (key === 'sealed') paintSealed(); else if (key === 'releases') paintReleases(); else if (key === 'detail' && dCur) paintDetailDist(dCur);
}
function distHistTap(d) {
  if (DISTF.hist.has(d)) DISTF.hist.delete(d); else DISTF.hist.add(d);
  if (dCur) paintDetailDist(dCur);
}
CLICKS.on('[data-distfold],[data-disthist]', e => { const f = e.target.closest('[data-distfold]'); if (f) return distFoldTap(f.dataset.distfold);
  const h = e.target.closest('[data-disthist]'); if (h) distHistTap(h.dataset.disthist); });
function distWords(it) {

  if (it._d === 'southern') {
    const pg = it.page || {};
    const parts = [esc(shWord(it, SH_WORDS, d => ' ' + nbsp(dayText(d))))];
    if (it.state !== 'released' && it.release) parts.push(`release ${esc(nbsp(dayText(it.release)))}`);
    if (pg.prerelease) parts.push(`prerelease ${esc(nbsp(dayText(pg.prerelease)))}`);
    if (pg.restricted) parts.push('in-store only');
    return parts;
  }
  const parts = [esc(gtsWord(it, null, d => ' ' + nbsp(dayText(d))))];
  if (it.allocated) parts.push('allocated');
  if (it.msrp) parts.push(`MSRP ${money(it.msrp)}${it.config ? ' (' + esc(it.config) + ')' : ''}`);
  if (it.release) parts.push(`release ${esc(nbsp(dayText(it.release)))}`);
  return parts;
}
function distLine(it) {
  const D = HUNT.dist(it._d || 'gts');
  return `<span style="display:block;color:var(--brass)">${esc(HUNT.distName(it._d || 'gts'))} \u00b7 ${distWords(it).join(' \u00b7 ')} \u00b7 ${esc(HUNT.ageLabel(D && D.fetched_at))}</span>`;
}

const TL_WORDS = { gts: { ...DIST_WORDS, coming: 'order due date ahead', preorder: 'no order due date ahead' },
  southern: { ...SH_WORDS, orders_open: 'order due date ahead' } };
const TL_HOW = { page: 'read off its page', dates: 'worked out from its dates' };
const TL_SHOW = 3;

const TL_TURN = { gts: { preorder: ['preorder', 1, ['coming']], out: ['release', 0, ['coming', 'preorder']] },
  southern: { orders_closed: ['due', 1, ['orders_open']], released: ['release', 0, ['orders_open', 'orders_closed']] } };
const TL_DAYW = { gts: { preorder: D => `orders were due ${D}`, out: D => `released ${D}, out of stock` },
  southern: { orders_closed: D => `stores\u2019 orders closed ${D}`, released: D => `released ${D}` } };
const TL_NOTE = 'Some changes are worked out from dates, so they show between two checks, not on a day.';
const utcDay = (iso, add = 0) => new Date(Date.parse(iso) + add * 864e5).toISOString().slice(0, 10);
const tlWord = (d, st) => { if (st == null) return 'not on its list'; const w = TL_WORDS[d]; return w && Object.prototype.hasOwnProperty.call(w, st) ? w[st] : String(st); };
const tlClock = iso => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const tlZoned = iso => nbsp(new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }));
function tlWindow(c) {
  const a = new Date(c.after), b = new Date(c.by);
  if (a.getTimezoneOffset() !== b.getTimezoneOffset()) return `between ${tlZoned(c.after)} and ${tlZoned(c.by)}`;
  return `between ${nbsp(momentText(c.after))} and ${localDay(c.after) === localDay(c.by) ? nbsp(tlClock(c.by)) : nbsp(momentText(c.by))}`;
}

function tlDay(d, c, it) {
  const T = c && c.kind === 'dates' && TL_TURN[d] && Object.prototype.hasOwnProperty.call(TL_TURN[d], c.to) && TL_TURN[d][c.to];
  if (!T || !it || !T[2].includes(c.from)) return null;
  const at = it[T[0]]; if (typeof at !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(at) || isNaN(Date.parse(at))) return null;
  const turn = utcDay(at, T[1]); return utcDay(c.after) < turn && turn <= utcDay(c.by, 1) ? at : null;
}
function distTl(it) { return HUNT.distTimeline(it._d, it[HUNT.DIST_KEY[it._d] || 'id']); }

function tlMoved(c) { const F = c.field === 'due' ? 'order due date' : 'release', D = x => nbsp(dayText(x));
  return c.from && c.to ? `${F} moved ${D(c.from)} \u2192 ${D(c.to)}` : c.to ? `${F} now ${D(c.to)}` : `${F} no longer given (was ${D(c.from)})`; }
function distHistory(it, tl = distTl(it)) {
  if (!tl) return '';
  const d = it._d, W = st => tlWord(d, st), M = t => nbsp(momentText(t)), day = t => nbsp(dayText(localDay(t))), fAt = HUNT.feed && HUNT.feed.fetched_at;
  const odd = tl.odd ? `${tl.odd} check${tl.odd === 1 ? '' : 's'} this version cannot read` : '';
  const behind = fAt && Date.parse(tl.end) < Date.parse(fAt) ? `this phone\u2019s copy ends ${M(tl.end)}` : '';
  const open = DISTF.hist.has(d);
  const box = (head, lines) => `<div class="dtl" data-tl="${esc(d)}">${lines.length
    ? `<button class="dtl-h" data-disthist="${esc(d)}" aria-expanded="${open}"><span>${esc(head)}</span>${chev(open, 14)}</button>${open ? lines.map(l => `<span>${esc(l)}</span>`).join('') : ''}`
    : `<span class="dtl-h">${esc(head)}</span>`}</div>`;
  if (!tl.checks) return box(dotJoin('History \u00b7 no check of it on file yet', odd, behind), []);
  const span = tl.checks === 1 ? M(tl.first) : localDay(tl.first) === localDay(tl.last) ? day(tl.first) : `${day(tl.first)} \u2192 ${day(tl.last)}`;
  const head = dotJoin(`History \u00b7 ${tl.checks} check${tl.checks === 1 ? '' : 's'} on file, ${span}`, tl.missed ? `${tl.missed} more could not reach it` : '', odd, behind);
  const lines = [];
  if (tl.checks === 1) lines.push(`${W(tl.state0)} at the one check so far \u2014 a change needs two`);
  else if (!tl.changes.length) lines.push(`${W(tl.state0)} at ${tl.checks === 2 ? 'both checks' : `all ${tl.checks} checks`} \u00b7 no change seen`);
  else {
    lines.push(`${W(tl.state0)} at the first check`);
    const more = tl.changes.length - TL_SHOW; if (more > 0) lines.push(`${more} earlier change${more === 1 ? '' : 's'} not shown`);
    for (const c of tl.changes.slice(-TL_SHOW)) { if (c.kind === 'moved') { lines.push(dotJoin(tlMoved(c), c.after ? tlWindow(c) : `seen ${M(c.by)}`)); continue; }
      const at = tlDay(d, c, it);
      lines.push(at ? dotJoin(`${W(c.from)} \u2192 ${TL_DAYW[d][c.to](nbsp(dayText(at)))}`, TL_HOW.dates)
        : dotJoin(`${W(c.from)} \u2192 ${W(c.to)}`, tlWindow(c), TL_HOW[c.kind])); } }
  return box(head, lines);
}

const tlNeedsNote = (it, tl) => !!tl && DISTF.hist.has(it._d) && tl.changes.slice(-TL_SHOW).some(c => c.kind === 'dates' && !tlDay(it._d, c, it));

function gtsDue(gi, at) { const day = String(at || '').slice(0, 10), un = gi.filter(i => i.release && i.release > day), ahead = un.filter(i => i.preorder && i.preorder >= day).length;
  return { ahead, without: un.length - ahead }; }

const BUY_GLYPH = { online: 'cart', local: 'pin', dist: 'truck' };
function buySources(p) {
  const out = [{ kind: 'online', label: 'TCGplayer', url: 'https://www.tcgplayer.com/product/' + p.id, note: `${money(p.market)} market \u00b7 ${dayText(CAT.man.source_updated_at)}` }];
  const T = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.target;
  for (const it of (HUNT.byCatalogId()[p.id] || [])) if (it.url) out.push({ kind: 'online', label: 'Target', url: it.url,
    note: `${money(it.price)} \u00b7 ${it.online ? (it.online.status === 'IN_STOCK' ? 'ships' : String(it.online.status || '?').toLowerCase().replace(/_/g, ' ') + ' online') : 'online stock not checked yet'} \u00b7 ${HUNT.ageLabel(it.online_at || (T && T.fetched_at))}` });
  for (const it of (HUNT.wmByCatalogId()[p.id] || [])) if (it.url) out.push({ kind: 'online', label: 'Walmart', url: it.url,
    note: it.online ? `${it.online.price != null ? money(it.online.price) : 'no price stated'} \u00b7 ${it.online.status === 'IN_STOCK' ? 'ships' : String(it.online.status || '?').toLowerCase().replace(/_/g, ' ') + ' online'}${it.online.seller ? ' \u00b7 sold by ' + it.online.seller : ''} \u00b7 ${HUNT.ageLabel(it.online.checked_at)}` : 'online stock not checked yet' });
  for (const l of LOCAL.shopLines(p.id)) if (l.url) out.push({ kind: 'local', label: l.shop, url: l.url, addr: l.addr, phone: l.phone, mi: l.mi,
    note: `${money(l.price)} \u00b7 ${l.available ? 'in stock online' : 'sold out online'} \u00b7 ${HUNT.ageLabel(LOCAL.shops && LOCAL.shops.fetched_at)}` });

  return out;
}
function buyChips(p) {
  const chip = s => `<a class="chip buy" href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}: open the seller’s page for ${esc(p.name)}">${G(BUY_GLYPH[s.kind], 12)} ${esc(s.label)} ${ext(12)}</a>`
    + (s.phone ? `<a class="chip buy" href="tel:${esc(s.phone)}" aria-label="Call ${esc(s.label)}">${G('phone', 12)} Call</a>` : '');
  return `<div class="chips buy" style="flex-basis:100%">${buySources(p).map(chip).join('')}</div>`;
}
const SEALED = {
  q: '', kind: 'all', open: new Set(), closed: new Set(['decks']),
  seen: new Set(),
  fromSet: null,

  isGoods(p) { return !!p && !!p.sealed && !SEALED.isDon(p); },
  isProduct(p) { return SEALED.isGoods(p) && p.market > 0; },

  listed(p, src) { return SEALED.isGoods(p) && (p.market > 0 || !!(src && src.has(p.id))); },

  isDon(p) { return !!p.sealed && /don!! card/i.test(p.name || ''); },
  kindOf(p) { const n = (p.name || '').toLowerCase();
    if (/booster box|display/.test(n)) return 'box';
    if (/case\b/.test(n)) return 'case';
    if (/starter deck|deck set|ultra deck|st-?\d/.test(n)) return 'deck';
    if (/booster pack|pack\b|blister|sleeved/.test(n)) return 'pack';
    if (/collection|illustration box|gift|battle kit/.test(n)) return 'collection';
    return 'other'; },
  rows(src = HUNT.listedIds()) { const q = this.q.trim().toLowerCase();

    const rel = this.fromSet != null ? CAT.sets.get(this.fromSet) : null, exact = !!rel && q === (rel.name || '').toLowerCase();
    return CAT.rows.filter(p => this.listed(p, src))
      .filter(p => this.kind === 'all' || this.kindOf(p) === this.kind)
      .filter(p => exact ? p.set === rel.id : !q || (p.name || '').toLowerCase().includes(q) || (CAT.sets.get(p.set)?.name || '').toLowerCase().includes(q))
      .sort((a, b) => (CAT.sets.get(b.set)?.pub || '').localeCompare(CAT.sets.get(a.set)?.pub || '') || a.name.localeCompare(b.name)); }
};

const SEALED_KINDS = [['all', 'All'], ['box', 'Boxes', 'Box'], ['pack', 'Packs', 'Pack'], ['deck', 'Decks', 'Deck'], ['case', 'Cases', 'Case'], ['collection', 'Collections', 'Collection'], ['other', 'Other', 'Sealed product']];
const sealedKind = p => SEALED_KINDS.find(k => k[0] === SEALED.kindOf(p)) || SEALED_KINDS[SEALED_KINDS.length - 1];
const sealedWord = p => sealedKind(p)[2];

function picBox(p, w, h, label, radius = 'var(--r-md)') {
  const cs = gameColours(p);
  const a = cs[0] ? `var(--c-${CCLASS[cs[0]]})` : 'var(--brass2)';
  return `<div class="pic" style="width:${w}px;height:${h}px;flex:0 0 auto;position:relative;border-radius:${radius};overflow:hidden;background:linear-gradient(160deg,${a},var(--card2));">
    <div class="ph" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:${Math.max(12, Math.round(w / 4))}px"><span class="phl">${label}</span></div>${refArt(p)}</div>`;
}

const THUMB = { s: 32, m: 44, l: 56 };
function productPic(p, size = THUMB.l) {
  const st = CAT.sets.get(p.set) || {};
  const code = esc((st.abbr || '').replace(/-/g, '').slice(0, 5) || (p.num || '').split('-')[0]);
  return picBox(p, size, Math.round(size * 1.25), code);
}

function cardPic(p, w = THUMB.m) {
  return picBox(p, w, Math.round(w / 0.716), esc((p.num || '').split('-').pop() || ''), 'var(--r-sm)');
}

function setPic(s, w = THUMB.m) {
  const ps = CAT.rows.filter(p => p.set === s.id && SEALED.isProduct(p));
  const box = ps.find(p => /booster box/i.test(p.name)) || ps[0];
  return box ? productPic(box, w) : `<div class="pic" style="width:${w}px;height:${Math.round(w * 1.25)}px;flex:0 0 auto;border-radius:var(--r-md);background:var(--card2);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:var(--fs-cap);color:var(--dim2)">${esc((s.abbr || '').replace(/-/g, '').slice(0, 5))}</div>`;
}

function sealedRow(p, sub, lines, byDist) {
  const on = STOCK.has(p.id), priced = p.market > 0;
  return `<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button class="row" style="flex:1;min-width:0;text-align:left;padding:0;gap:10px" data-open="${p.id}">${productPic(p)}<div class="nm" style="min-width:0"><b>${esc(p.name)}</b><span>${priced ? `${sub} \u00b7 low ${money(p.low)} \u00b7 high ${money(p.high)}` : `${sub} \u00b7 no market price yet`}</span>${lines}</div><div class="v"><b>${money(priced ? p.market : null)}</b>${priced ? deltaHtml(p, { pctOnly: true }) : ''}</div></button>`
    + `<button class="ghost" data-stock="${p.id}" aria-label="${on ? 'Stop watching stock for' : 'Alert when in stock:'} ${esc(p.name)}" aria-pressed="${on}" style="flex:0 0 auto;padding:8px 10px;${on ? 'color:var(--brass);border-color:var(--brass)' : ''}">${bell(on)}<span style="display:block;font-size:var(--fs-cap);line-height:1.1;margin-top:2px">${on ? 'watching' : 'alert'}</span></button>${buyChips(p)}${distRowLines(p, (byDist || {})[p.id])}</div>`;
}
function paintSealedHero() {
  const h = $('#sealedHero'); if (!h) return;
  const own = ownPic('hero-hunt.jpg'), f = own ? null : newestTop();
  h.hidden = !own && !f; if (h.hidden) { h.innerHTML = ''; return; }
  h.innerHTML = own ? ownBack('hero-hunt.jpg') : artBack(f.p, { crisp: true });
}
function paintSealed() {
  paintSealedHero();
  const asOf = $('#sealedAsOf'); if (asOf) asOf.textContent = 'prices ' + dayText(CAT.man.source_updated_at);
  const cps = $('#curPillSealed'); if (cps) cps.innerHTML = curPill();
  const src = HUNT.listedIds();
  const counts = {}; for (const p of CAT.rows) if (SEALED.listed(p, src)) { const k = SEALED.kindOf(p); counts[k] = (counts[k] || 0) + 1; counts.all = (counts.all || 0) + 1; }
  $('#sealedKinds').innerHTML = SEALED_KINDS.map(([k, label]) => `<button class="chip${SEALED.kind === k ? ' on' : ''}" data-skind="${k}" aria-pressed="${SEALED.kind === k}">${label} <span class="note">${counts[k] || 0}</span></button>`).join('');
  const rows = SEALED.rows(src); let lastSet = null; const out = [];
  const T = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.target; const byCat = HUNT.byCatalogId(); const byWm = HUNT.wmByCatalogId();
  const gts = HUNT.dist('gts'); const byDist = HUNT.distByCatalogId();

  const inDecks = new Set();
  if (SEALED.kind === 'all' && !SEALED.q) { const decks = CAT.rows.filter(p => SEALED.listed(p, src) && ((CAT.sets.get(p.set) || {}).kind === 'deck' || SEALED.kindOf(p) === 'deck')).sort((a, b) => (CAT.sets.get(b.set)?.pub || '').localeCompare(CAT.sets.get(a.set)?.pub || '') || a.name.localeCompare(b.name)); decks.forEach(p => inDecks.add(p.id));

    const dtop = decks.map(p => setTop(p.set)).find(Boolean);
    if (decks.length) out.push(`<button class="fgrp setstrip" data-setfold="decks" aria-expanded="${!SEALED.closed.has('decks')}">${dtop ? artBack(dtop, { crisp: true }) : ''}<span>Starter decks<span class="note">${decks.length} products</span></span><span class="note" aria-hidden="true">${chev(!SEALED.closed.has('decks'))}</span></button>`);
    if (decks.length && !SEALED.closed.has('decks')) for (const p of decks.slice(0, 240)) out.push(sealedRow(p, esc(CAT.sets.get(p.set)?.name || ''), (byCat[p.id] || []).map(i => targetLine(i, T)).join('') + (byWm[p.id] || []).map(walmartLine).join(''), byDist)); }

  if (STOCK.list.length) out.push(`<div class="panel"><h3>Stock alerts</h3>${STOCK.list.map(a => { const srcs = STOCK.sourcesFor(a.id); const on = srcs.filter(x => x.available);
    return `<div class="row"><div class="nm"><b>${esc(a.name)}</b><span>${on.length ? 'in stock: ' + esc(on.map(x => x.label).join(', ')) : srcs.length ? 'not in stock at ' + srcs.length + ' watched source' + (srcs.length === 1 ? '' : 's') : 'no source carries it yet'}${a.fired && a.fired.length ? ' \u00b7 last alert ' + esc(HUNT.ageLabel(a.fired[0].t)) : ''}</span></div><div class="v"><button class="ghost" data-stock="${a.id}" aria-label="Stop watching ${esc(a.name)}">${G('trash', 18)}</button></div></div>`; }).join('')}
    <div class="note" style="margin-top:6px">Tells you once each time it comes back in stock. Checked when you open the app.</div></div>`);

  if (T) {
    const ja = (T.items || []).filter(i => /japanese/i.test(i.title)).length; const ships = (T.items || []).filter(i => i.online && i.online.status === 'IN_STOCK').length;
    const sv = HUNT.served(); const zz = sv.how !== 'none' ? T.zips[sv.zip] : null;
    const shelf = zz && zz.ok ? Object.entries(zz.stock).filter(([, st]) => Object.values(st).some(v => (v.qty || 0) > 0)).map(([tcin]) => (T.items || []).find(i => i.tcin === tcin)).filter(Boolean) : [];
    out.push(`<div class="panel" style="border-color:var(--brass)"><h3>Target</h3>
      <div class="note">${T.ok ? `Online and shelf stock at Target, refreshed hourly. ${sourceLead('Target', T)} \u00b7 ${(T.items || []).length} products online, <b>${ships}</b> in stock to ship${ja ? ` \u00b7 ${ja} Japanese` : ''}.${T.throttled_after != null ? ' Target cut this check short; the next one picks up from here.' : ''}` : sourceLead('Target', T)}</div>
      <details style="margin-top:6px"><summary class="note" style="cursor:pointer">Near you</summary>
      ${!HUNT.zip ? `<div class="note">Enter your zip to add what is on the shelf near you.</div>` :
        sv.how === 'none' ? `<div class="note">No shelf check near ${esc(HUNT.zip)} yet. Covered: ${esc(sv.zips.join(', ') || 'none')}.</div>` :
        !zz || !zz.ok ? `<div class="note">The shelf check near ${esc(HUNT.zip)} didn\u2019t finish this hour${zz && /435|429|throttle|budget/i.test(zz.error || '') ? ' (Target\u2019s limit); it resumes next hour' : ''}.</div>` :
        `<div class="note">${zz.stores.length} Target stores within ${T.radius || 50} mi of ${esc(sv.how === 'area' ? sv.zip : HUNT.zip)}${sv.how === 'area' ? ' (same area as yours)' : ''} \u00b7 ${Object.keys(zz.checked_at || {}).length} products checked on their shelves, a few each hour.</div>
         ${shelf.length ? `<div class="fgrp">On a shelf now</div>${shelf.slice(0, 12).map(i => `<div class="row"><div class="nm"><b>${esc(i.title)}</b>${targetLine(i, T)}</div></div>`).join('')}` : '<div class="note" style="margin-top:6px">Nothing on a shelf near you at the last check.</div>'}`}
      </details>
      <div class="row" style="margin-top:8px;gap:8px"><button class="ghost" id="huntZip">${HUNT.zip ? 'Change zip' : 'Enter zip'}</button><button class="ghost" id="huntSync">Refresh</button></div></div>`);
  } else {
    out.push(`<div class="panel"><h3>Store stock</h3><div class="note">Not fetched yet on this phone. Refresh when you are online.</div><div class="row" style="margin-top:8px"><button class="ghost" id="huntSync">Refresh</button></div></div>`);
  }

  const S = HUNT.dist('southern'); const dsecs = [];
  if (gts) {
    const gi = gts.items || []; const n = s => gi.filter(i => i.status === s).length; const alloc = gi.filter(i => i.allocated).length;
    dsecs.push(`<div class="dsec"><b>GTS Distribution</b>
      <div class="note">${gts.ok ? `${sourceLead('GTS Distribution', gts)} · ${gi.length} products: <b>${n('sold_out')}</b> sold out, <b>${alloc}</b> allocated, ${gtsDue(gi, gts.fetched_at).ahead} with orders open, ${n('in_stock')} in stock for stores.` : sourceLead('GTS Distribution', gts)}</div>
      <div class="note" style="margin-top:6px">Sells to stores, not to you. Allocated: stores get part of what they ordered. MSRP: the suggested shelf price.</div></div>`);
  }
  if (S) {
    const si = S.items || []; const n = s => si.filter(i => i.state === s).length; const read = si.filter(i => i.page); const ins = read.filter(i => i.page.restricted).length;
    dsecs.push(`<div class="dsec"><b>Southern Hobby</b>
      <div class="note">${S.ok ? `${sourceLead('Southern Hobby', S)} · ${si.length} products: <b>${n('orders_open')}</b> taking orders, ${n('orders_closed')} orders closed, ${n('released')} released; ${ins} in-store only${read.length < si.length ? ` (${read.length} of ${si.length} read so far)` : ''}.` : sourceLead('Southern Hobby', S)}</div>
      <div class="note" style="margin-top:6px">Lists order deadlines and release dates for stores, not stock.</div></div>`);
  }
  if (dsecs.length) out.push(`<div class="panel" style="border-color:var(--brass)">${distFold('sealed', distSummary(), dsecs.join(''))}</div>`);

  for (const id of CAT.sets.keys()) if (!SEALED.seen.has(id)) { SEALED.seen.add(id); SEALED.closed.add(id); }
  const bySet = new Map(); for (const p of rows.slice(0, 600)) { if (inDecks.has(p.id)) continue; if (!bySet.has(p.set)) bySet.set(p.set, []); bySet.get(p.set).push(p); }
  let n = 0; const TODAY = phoneToday();
  for (const [setId, ps] of bySet) { const st = CAT.sets.get(setId) || {}; const open = SEALED.q || !SEALED.closed.has(setId); n++;
    const top = setTop(setId);
    out.push(`<button class="fgrp setstrip" data-setfold="${esc(setId)}" aria-expanded="${open}">${top ? artBack(top, { crisp: true }) : ''}<span>${setTitleHtml(st)}${st.pub ? `<span class="note">${st.pub > TODAY ? 'Releases' : 'Released'} ${esc(dayText(st.pub))}</span>` : ''}</span><span class="note" aria-hidden="true">${chev(open)}</span></button>`);
    if (!open) continue;
    for (const p of ps) {
    const tl = (byCat[p.id] || []).map(i => targetLine(i, T)).join('') + (byWm[p.id] || []).map(walmartLine).join('') + LOCAL.shopLines(p.id).map(l => `<span style="display:block;color:var(--brass)">${esc(l.shop)}${l.mi != null ? ' ~' + l.mi + ' mi' : ''} ${money(l.price)} \u00b7 ${l.available ? 'in stock online' : 'sold out online'} \u00b7 ${esc(HUNT.ageLabel(LOCAL.shops.fetched_at))}</span>`).join('');
    out.push(sealedRow(p, esc(sealedWord(p)), tl, byDist));
    }
  }

  const rel = SEALED.fromSet != null && SEALED.kind === 'all' && CAT.sets.get(SEALED.fromSet);
  const none = rel && SEALED.q === rel.name
    ? emptyHtml('box', `Nothing from ${esc(rel.name)} here yet`, 'Its products show here once TCGplayer prices them or a distributor lists them. Clear the search for every set.')
    : emptyHtml('box', 'Nothing matches', 'Clear the search, or choose All.');
  if (!rows.length) out.push(none);
  $('#sealedList').innerHTML = out.join('') || none;
  const hs = $('#huntSync'); if (hs) hs.addEventListener('click', async () => { hs.disabled = true; const ok = await HUNT.sync(); await HUNT.syncHistory(); await LOCAL.syncShops(); hs.disabled = false; if (ok) { const n = await STOCK.check(); toast(n ? `Stock feed updated \u2014 ${n} in stock` : 'Stock feed updated'); paintSealed(); } });
  const hz = $('#huntZip'); if (hz) hz.addEventListener('click', async () => { if (await askZip()) paintSealed(); });
}

const STOCK = {
  list: readJson('vault.stockAlerts', []),
  save(quiet = false) { saveJson('vault.stockAlerts', this.list); if (!quiet) scheduleBackup('lists'); },
  has(id) { return this.list.some(a => a.id === id); },
  toggle(id) { const p = CAT.byId.get(id); if (!p) return false;
    if (this.has(id)) { this.list = this.list.filter(a => a.id !== id); this.save(); return false; }
    this.list.push({ id, name: p.name, created: new Date().toISOString(), seen: {}, fired: [] }); this.save(); return true; },

  sourcesFor(id) { const out = []; const T = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.target; const sv = HUNT.served();
    if (T && T.ok) for (const it of (T.items || [])) { if (it.catalog_id !== id) continue;
      if (it.online) out.push({ key: 'target:online:' + it.tcin, label: 'Target online', available: it.online.status === 'IN_STOCK', at: it.online_at });
      if (sv.how !== 'none') { const zz = T.zips[sv.zip]; const st = zz && zz.ok && zz.stock[it.tcin]; if (st) { const on = Object.entries(st).filter(([, v]) => (v.qty || 0) > 0).map(([sid]) => { const x = zz.stores.find(y => y.id === sid); return x ? x.name : sid; });
        out.push({ key: 'target:shelf:' + sv.zip + ':' + it.tcin, label: on.length ? 'Target ' + on.join(', ') : 'a Target shelf near ' + sv.zip, available: on.length > 0, at: zz.checked_at && zz.checked_at[it.tcin] }); } } }
    for (const it of (HUNT.wmByCatalogId()[id] || [])) if (it.online) out.push({ key: 'walmart:online:' + it.id, label: 'Walmart online', available: it.online.status === 'IN_STOCK', at: it.online.checked_at, url: it.url });
    for (const sh of ((LOCAL.shops && LOCAL.shops.shops) || [])) for (const it of (sh.sealed || [])) if (it.catalog_id === id) out.push({ key: 'shop:' + sh.url + ':' + it.url, label: sh.name + ' online', available: !!it.available, at: LOCAL.shops.fetched_at, url: it.url });

    const gts = HUNT.dist('gts');
    if (gts && gts.ok) for (const it of (gts.items || [])) if (it.catalog_id === id) out.push({ key: 'gts:' + it.sku, label: 'GTS Distribution (to stores)', available: it.status === 'in_stock', at: gts.fetched_at, url: it.url });
    return out; },

  async check() { const fired = []; let changed = false;
    for (const a of this.list) { a.seen = a.seen || {}; a.fired = a.fired || [];
      for (const src of this.sourcesFor(a.id)) { const was = a.seen[src.key];
        if (src.available && was !== true) { fired.push({ a, src }); a.fired.unshift({ t: new Date().toISOString(), label: src.label }); a.fired = a.fired.slice(0, 5); }
        if (a.seen[src.key] !== src.available) changed = true; a.seen[src.key] = src.available; } }
    if (changed) this.save(true);
    for (const [k, f] of fired.entries()) { const ok = await PLATFORM.notify(9000 + (k % 500), `In stock: ${f.a.name}`, `${f.src.label} \u2014 ${HUNT.ageLabel(f.src.at)}`); if (!ok) toast(`In stock: ${f.a.name} at ${f.src.label}`); }
    return fired.length; }
};

const LOCAL = {
  radius: +(localStorage.getItem('vault.hunt.radius') || 50),
  notes: readJson('vault.hunt.notes', []),
  saveNotes() { saveJson('vault.hunt.notes', this.notes); scheduleBackup('lists'); },
  stores: readJson('vault.hunt.stores', null, false),
  async syncStores() { const u = HUNT.url(); if (!u || !navigator.onLine) return false;
    try { const r = await fetch(u.replace(/feed\.json$/, 'stores.json'), { cache: 'no-store' }); if (!r.ok) return false; const j = await r.json(); if (!j || !Array.isArray(j.stores)) return false;
      this.stores = j; try { localStorage.setItem('vault.hunt.stores', JSON.stringify(j)); } catch (e) {} return true; } catch (e) { return false; } },
  shops: readJson('vault.hunt.shops', null, false),
  async syncShops() { const u = HUNT.url(); if (!u || !navigator.onLine) return false;
    try { const r = await fetch(u.replace(/feed\.json$/, 'shops.json'), { cache: 'no-store' }); if (!r.ok) return false; const j = await r.json(); if (!j || !Array.isArray(j.shops)) return false;
      this.shops = j; try { localStorage.setItem('vault.hunt.shops', JSON.stringify(j)); } catch (e) {} return true; } catch (e) { return false; } },

  shopLines(catId) { const out = []; for (const sh of ((this.shops && this.shops.shops) || [])) for (const it of (sh.sealed || [])) if (it.catalog_id === catId) {
      const st = (this.stores && this.stores.stores || []).find(s => s.zip === sh.zip && s.name === sh.name);
      out.push({ shop: sh.name, ...it, mi: this.miles(st && st.ll), addr: st ? [st.addr, st.city].filter(Boolean).join(', ') || null : null, phone: (st && st.phone) || null }); }
    return out; },

  zcta: readJson('vault.hunt.zcta', null, false),
  async syncZcta() { const u = HUNT.url(); if (!u || !navigator.onLine) return false;
    try { const r = await fetch(u.replace(/feed\.json$/, 'zcta.json'), { cache: 'force-cache' }); if (!r.ok) return false; const j = await r.json(); if (!j || !j['10001']) return false;
      this.zcta = j; try { localStorage.setItem('vault.hunt.zcta', JSON.stringify(j)); } catch (e) { toast('Exact distances kept for this session only \u2014 the table is large'); } return true; } catch (e) { return false; } },
  exact() { return !!(this.zcta && HUNT.zip && this.zcta[HUNT.zip]); },
  here() { const z = HUNT.zip; if (!z) return null; if (this.zcta && this.zcta[z]) return this.zcta[z]; if (!CAT.zips3) return null; return CAT.zips3[z.slice(0, 3)] || null; },
  miles(ll) { const h = this.here(); if (!h || !ll) return null; const R = 3958.8, toR = d => d * Math.PI / 180;
    const dLa = toR(ll[0] - h[0]), dLo = toR(ll[1] - h[1]); const a = Math.sin(dLa / 2) ** 2 + Math.cos(toR(h[0])) * Math.cos(toR(ll[0])) * Math.sin(dLo / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(a))); },
  within(mi) { return mi == null ? this.radius === 0 : (this.radius === 0 || mi <= this.radius); }
};
function paintLocal() {
  const sel = $('#localRadius'); if (sel) sel.value = String(LOCAL.radius);
  const out = []; const here = LOCAL.here();
  if (!HUNT.zip) out.push(`<div class="panel"><h3>Where are you?</h3><div class="note">Enter your zip to see shops near you. It stays on this phone.</div><div class="row" style="margin-top:8px"><button class="ghost go" id="localZip">Enter zip</button></div></div>`);
  else out.push(`<div class="note" style="margin:6px 0 10px">Zip ${esc(HUNT.zip)}${here ? '' : ' \u2014 can\u2019t place it, so no distances'} \u00b7 ${LOCAL.exact() ? 'distances within a mile or two' : 'distances \u00b110 mi <button class="linkish" id="localExact" style="display:inline;padding:0 0 0 6px">make them exact</button>'} <button class="linkish" id="localZip" style="display:inline;padding:0 0 0 6px">change</button></div>`);

  const R = LOCAL.stores; const shops = (R && R.stores) ? R.stores.map(s => ({ ...s, mi: LOCAL.miles(s.ll) })).filter(s => LOCAL.within(s.mi)).sort((a, b) => (a.mi ?? 9e9) - (b.mi ?? 9e9)) : [];
  out.push(`<div class="panel"><h3>Shops that run events${R ? ` <span class="note">\u00b7 ${shops.length}${LOCAL.radius ? ` within ${LOCAL.radius} mi` : ''}</span>` : ''}</h3>
    ${!R ? `<div class="note">Not fetched yet on this phone. Refresh when you are online.</div><div class="row" style="margin-top:8px"><button class="ghost" id="localSync">Refresh</button></div>` :
      !HUNT.zip ? '<div class="note">Enter your zip above.</div>' :
      !shops.length ? `<div class="note">None within ${LOCAL.radius} mi of your zip area. Widen the distance.</div>` :
      shops.slice(0, 60).map(s => `<div class="row"><div class="nm" style="min-width:0"><b>${esc(s.name)}</b><span>${esc([s.addr, s.city, s.state].filter(Boolean).join(', '))}${s.mi != null ? ` \u00b7 ${s.exact ? '' : '~'}${s.mi} mi` : ''}</span>
        ${s.events && s.events.length ? `<span style="display:block;color:var(--brass)">${s.events.slice(0, 2).map(e => `${esc(dayText(e.d))} ${esc(e.t)}${e.k === 'release' ? ' \u2014 release event' : ''}`).join(' \u00b7 ')}</span>` : ''}</div>
        <div class="v" style="flex:0 0 auto;display:flex;gap:6px">${s.phone ? `<a class="ghost" href="tel:${esc(s.phone)}" style="padding:8px 12px" aria-label="Call ${esc(s.name)}">Call</a>` : ''}<button class="ghost" data-localnote="${esc(s.name)}" aria-label="Add a note for ${esc(s.name)}">Note</button></div></div>`).join('')}
    <div class="note" style="margin-top:8px">Stores near you that run One Piece events. From ${esc((R && R.source) || 'Bandai TCG+')}${R ? ', ' + esc(HUNT.ageLabel(R.fetched_at)) : ''}.</div></div>`);

  const T = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.target; const sv = HUNT.served(); const zz = T && sv.how !== 'none' ? T.zips[sv.zip] : null;
  if (zz && zz.stores && zz.stores.length) out.push(`<div class="panel"><h3>Target stores checked <span class="note">\u00b7 for ${esc(sv.zip)}</span></h3>${zz.stores.filter(s => LOCAL.within(s.miles)).map(s => `<div class="row"><div class="nm"><b>Target ${esc(s.name)}</b><span>${s.miles} mi from ${esc(sv.zip)}</span></div></div>`).join('') || `<div class="note">None within ${LOCAL.radius} mi.</div>`}</div>`);

  const SH = LOCAL.shops;
  out.push(`<div class="panel"><h3>Shops with an online store</h3>
    ${!SH ? `<div class="note">Not fetched yet on this phone.</div>` : !(SH.shops || []).length ? '<div class="note">None on the verified list yet.</div>' :
      SH.shops.map(sh => { const st = (LOCAL.stores && LOCAL.stores.stores || []).find(s => s.zip === sh.zip && s.name === sh.name); const mi = LOCAL.miles(st && st.ll);
        return `<div class="row"><div class="nm"><b>${esc(sh.name)}</b><span>${mi != null ? '~' + mi + ' mi \u00b7 ' : ''}${sh.ok ? `${sh.sealed.length} sealed listed, ${sh.sealed.filter(i => i.available).length} in stock, ${sh.singles} singles` : 'unreachable: ' + esc(sh.error || '?')}</span>
          ${sh.ok && sh.sealed.length ? `<span style="display:block;color:var(--brass)">${sh.sealed.slice(0, 4).map(i => `${esc(i.title.slice(0, 40))} ${money(i.price)}${i.available ? '' : ' (out)'}`).join(' \u00b7 ')}</span>` : ''}</div>
          <div class="v"><a class="ghost" href="${esc(sh.url)}" target="_blank" rel="noopener" style="padding:8px 12px" aria-label="Open ${esc(sh.name)}\u2019s online store">Open ${ext()}</a></div></div>`; }).join('')}
    <div class="note" style="margin-top:8px">What each shop lists on its own site, checked hourly.${SH ? ' Fetched ' + esc(HUNT.ageLabel(SH.fetched_at)) + '.' : ''}</div></div>`);

  out.push(`<div class="panel"><h3>Your notes</h3>
    ${LOCAL.notes.length ? LOCAL.notes.slice().reverse().map((n, i) => `<div class="row"><div class="nm"><b>${esc(n.store)}</b><span>${esc(n.what)}${n.price ? ' \u00b7 ' + money(n.price) : ''} \u00b7 ${esc(dayText(n.when))}</span>${n.phone ? `<span style="display:block"><a href="tel:${esc(n.phone)}" style="color:var(--brass)">Call ${esc(n.phone)}</a></span>` : ''}</div><div class="v"><button class="ghost" data-localdel="${LOCAL.notes.length - 1 - i}" aria-label="Delete this note">${G('trash', 18)}</button></div></div>`).join('') : '<div class="note">What you saw on a shelf, where and for how much.</div>'}
    <div class="row" style="margin-top:8px"><button class="ghost go" id="localAdd">Add a note</button></div></div>`);
  $('#localList').innerHTML = out.join('');
  const lz = $('#localZip'); if (lz) lz.addEventListener('click', async () => { if (await askZip()) paintLocal(); });
  const le = $('#localExact'); if (le) le.addEventListener('click', async () => { le.disabled = true; le.textContent = 'fetching\u2026'; const ok = await LOCAL.syncZcta(); if (ok) { toast('Distances are exact now'); paintLocal(); } else { toast('Could not fetch the table'); le.disabled = false; le.textContent = 'make them exact'; } });
  const ls = $('#localSync'); if (ls) ls.addEventListener('click', async () => { ls.disabled = true; const ok = await LOCAL.syncStores(); ls.disabled = false; if (ok) paintLocal(); else toast('Store list unavailable'); });
  const la = $('#localAdd'); if (la) la.addEventListener('click', () => addLocalNote(''));
}
async function addLocalNote(store) {
  const st = store || await ask({ title: 'Which store?', kind: 'text', placeholder: 'Store name', ok: 'Next', why: 'Any store \u2014 it need not be on the list.' }); if (!st) return;
  const what = await ask({ title: `What did you see at ${st}?`, kind: 'text', placeholder: 'e.g. 3 OP-11 boxes, 20 packs', ok: 'Next', why: 'Stock, product, anything worth remembering.' }); if (what == null) return;

  const c = CUR.active();
  const price = await ask({ title: 'Price, if you saw one', kind: 'number', placeholder: `${c === 'USD' ? 'USD' : curLabel(c)}, optional`, ok: 'Next',
    why: `Per box or pack, as marked${c === 'USD' ? '' : `, in ${esc(curLabel(c))}; it is kept in US dollars`}.` });
  const pr = typedAmount(price);
  const phone = await ask({ title: 'Their phone, optional', kind: 'text', placeholder: '(248) 555-0100', ok: 'Save', why: 'Adds a Call button to the note.' });
  LOCAL.notes.push({ store: st, what: what || '', price: pr > 0 ? fromShown(pr) : null, phone: (phone || '').trim() || null, when: localDay(new Date().toISOString()) }); LOCAL.saveNotes(); paintLocal();
}
$('#localRadius').addEventListener('change', e => { LOCAL.radius = +e.target.value; saveJson('vault.hunt.radius', String(LOCAL.radius)); paintLocal(); });
$('#local').addEventListener('click', e => { const n = e.target.closest('[data-localnote]'); if (n) { addLocalNote(n.dataset.localnote); return; }
  const d = e.target.closest('[data-localdel]'); if (d) { LOCAL.notes.splice(+d.dataset.localdel, 1); LOCAL.saveNotes(); paintLocal(); } });

const EVENTS = {
  tab: readJson('vault.hunt.events', null, false),
  days: +(localStorage.getItem('vault.hunt.eventDays') || 14),
  async sync() { const u = HUNT.url(); if (!u || !navigator.onLine) return false;
    try { const r = await fetch(u.replace(/feed\.json$/, 'events.json'), { cache: 'no-store' }); if (!r.ok) return false; const j = await r.json(); if (!j || !Array.isArray(j.rows)) return false;
      this.tab = j; try { localStorage.setItem('vault.hunt.events', JSON.stringify(j)); } catch (e) { toast('Event list too large to keep offline; showing it now'); } return true; } catch (e) { return false; } },
  rows() { const t = this.tab, R = LOCAL.stores; if (!t || !R || !R.stores) return [];
    const today = phoneToday();
    return t.rows.map(r => { const st = R.stores[r[0]]; if (!st) return null; return { store: st, d: r[1], title: t.titles[r[2]] || '', id: r[3], fee: r[4], cap: r[5], release: !!r[6], mi: LOCAL.miles(st.ll), url: r[3] ? t.url + r[3] : null }; })
      .filter(e => e && e.d >= today && LOCAL.within(e.mi)).sort((a, b) => a.d.localeCompare(b.d) || (a.mi ?? 9e9) - (b.mi ?? 9e9)); }
};

function icsFor(e) {
  const esc2 = v => String(v || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const d = e.d.replace(/-/g, ''); const next = new Date(Date.parse(e.d + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const st = e.store || {};
  const where = [st.name, st.addr, st.city, st.state, st.zip].filter(Boolean).join(', ');
  const notes = [e.notes != null ? e.notes : `${e.fee > 0 ? 'Fee ' + money(e.fee) : 'Free'}${e.cap ? ' · ' + e.cap + ' seats' : ''}`, e.url ? (e.urlLabel || 'Register') + ': ' + e.url : '', 'From OP TCG Hub'].filter(Boolean).join('\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OP TCG Hub//Hunt//EN', 'BEGIN:VEVENT', `UID:optcghub-event-${e.id || d + '-' + (st.zip || '')}@optcghub`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next}`, `SUMMARY:${esc2(e.title.replace(/^\[[^\]]*\]\s*/, ''))}${st.name ? ' — ' + esc2(st.name) : ''}`, where ? `LOCATION:${esc2(where)}` : null, `DESCRIPTION:${esc2(notes)}`,
    e.url ? `URL:${e.url}` : null, 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n') + '\r\n';
}

function releaseEvent(s, label) {
  return { id: 'release-' + s.id, d: s.pub, title: (label || s.name) + ' \u2014 release day', notes: `${label || s.name}${s.abbr ? ' (' + s.abbr + ')' : ''} releases ${s.pub}. Date: TCGplayer via TCGCSV.`,
           url: 'https://www.tcgplayer.com/search/one-piece-card-game/product?q=' + encodeURIComponent(label || s.name) + '&view=grid', urlLabel: 'Listing' };
}
const RELALERTS = {
  KEY: 'vault.relAlerts',
  list: readJson('vault.relAlerts', []),
  save(quiet = false) { saveJson(this.KEY, this.list); if (!quiet) scheduleBackup('lists'); },
  has(id) { return this.list.some(a => a.id === id); },
  nid(id) { return 7000 + (Math.abs(hashStr('rel:' + id)) % 1000); },

  arm(a) { if (!a || a.fired || !/^\d{4}-\d\d-\d\d$/.test(a.pub || '')) return;
    const at = new Date(this.dayBefore(a.pub) + 'T09:00:00'); if (at.getTime() > Date.now()) PLATFORM.notifyAt(this.nid(a.id), `${a.name} releases tomorrow`, `${dayText(a.pub)} \u2014 from OP TCG Hub`, at); },
  dayBefore(pub) { return new Date(Date.parse(pub + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10); },

  toggle(id, name, pub) {
    if (this.has(id)) { this.list = this.list.filter(a => a.id !== id); this.save(); PLATFORM.cancelNotify(this.nid(id)); return false; }
    const a = { id, name, pub, created: new Date().toISOString(), fired: null }; this.list.push(a); this.save(); this.arm(a);
    return true;
  },

  async check(today = phoneToday()) {
    const fired = [];
    for (const a of this.list) {
      if (a.fired || today < this.dayBefore(a.pub)) continue;
      a.fired = today; fired.push(a);
      await PLATFORM.notify(this.nid(a.id), `${a.name} releases ${today >= a.pub ? (today === a.pub ? 'today' : 'on ' + dayText(a.pub)) : 'tomorrow'}`, `${dayText(a.pub)} \u2014 from OP TCG Hub`);
    }
    if (fired.length) this.save(true);
    return fired;
  }
};

function relBand(days) { return days < 0 ? 'cd4' : days <= 7 ? 'cd1' : days <= 30 ? 'cd2' : days <= 90 ? 'cd3' : 'cd4'; }
const RELF = { open: new Set() };
async function addEventToCalendar(e) {
  const ics = icsFor(e); const name = `optcg-event-${e.d}.ics`;
  const r = await PLATFORM.shareFile(name, ics, 'Add to calendar');
  if (r === 'shared') return true;
  try { const blob = new Blob([ics], { type: 'text/calendar' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Calendar file downloaded'); return true; } catch (err) { toast('Could not hand this to your calendar'); return false; }
}
function paintEvents() {
  const sel = $('#eventsRadius'); if (sel) sel.value = String(LOCAL.radius);
  const out = [];
  if (!HUNT.zip) { out.push(`<div class="panel"><h3>Where are you?</h3><div class="note">Enter your zip to see events near you.</div><div class="row" style="margin-top:8px"><button class="ghost go" id="eventsZip">Enter zip</button></div></div>`); }
  else if (!EVENTS.tab || !LOCAL.stores) { out.push(`<div class="panel"><h3>Store events</h3><div class="note">Not fetched yet on this phone. Refresh when you are online.</div><div class="row" style="margin-top:8px"><button class="ghost" id="eventsSync">Refresh</button></div></div>`); }
  else { const all = EVENTS.rows(); const horizon = EVENTS.days; const lim = utcDay(phoneToday() + 'T00:00:00Z', horizon);
    const rows = all.filter(e => e.d <= lim);

    const byStore = new Map(); for (const e of rows) { const k = e.store.name + '|' + e.store.zip; if (!byStore.has(k)) byStore.set(k, { store: e.store, mi: e.mi, evs: [] }); byStore.get(k).evs.push(e); }
    const groups = [...byStore.values()].sort((a, b) => (a.mi ?? 9e9) - (b.mi ?? 9e9));
    out.push(`<div class="note" style="margin:6px 0 10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span>${groups.length} stores, ${rows.length} events in the next ${horizon} days${LOCAL.radius ? ` within ${LOCAL.radius} mi` : ''} of ${esc(HUNT.zip)}</span><select id="eventsDays" aria-label="How far ahead"><option value="7" ${horizon === 7 ? 'selected' : ''}>next 7 days</option><option value="14" ${horizon === 14 ? 'selected' : ''}>next 14 days</option><option value="31" ${horizon === 31 ? 'selected' : ''}>next month</option></select></div>`);
    if (!groups.length) out.push(`<div class="panel"><div class="note">Nothing in range. Widen the distance or the days.</div></div>`);
    for (const g of groups.slice(0, 60)) { const st = g.store;
      out.push(`<div class="panel" style="padding:12px 14px"><div class="row" style="padding:0 0 6px;border:0"><div class="nm" style="min-width:0"><b>${esc(st.name)}</b><span>${esc([st.addr, st.city].filter(Boolean).join(', '))}${g.mi != null ? ` \u00b7 ${st.exact ? '' : '~'}${g.mi} mi` : ''}</span></div>
        <div class="v" style="flex:0 0 auto;display:flex;gap:6px">${st.phone ? `<a class="ghost" href="tel:${esc(st.phone)}" style="padding:8px 12px" aria-label="Call ${esc(st.name)}">Call</a>` : ''}<button class="ghost" data-localnote="${esc(st.name)}" aria-label="Add a note for ${esc(st.name)}" style="padding:8px 10px">Note</button></div></div>
        ${g.evs.slice(0, 6).map(e => { const dt = new Date(e.d + 'T12:00:00'); return `<div class="row" style="padding:6px 0"><div class="nm" style="min-width:0"><b style="font-weight:600;white-space:normal">${esc(dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }))} \u00b7 ${esc(e.title.replace(/^\[[^\]]*\]\s*/, ''))}${e.release ? ' <span class="badge">release</span>' : ''}</b><span>${e.fee > 0 ? money(e.fee) : 'free'}${e.cap ? ` \u00b7 ${e.cap} seats` : ''}</span></div>
          <div class="v" style="flex:0 0 auto;display:flex;gap:6px">${e.url ? `<a class="ghost" href="${esc(e.url)}" target="_blank" rel="noopener" style="padding:6px 10px;font-size:var(--fs-sm)" aria-label="Register for ${esc(e.title.replace(/^\[[^\]]*\]\s*/, ''))} at ${esc(st.name)} on Bandai TCG+">Register ${ext()}</a>` : ''}<button class="ghost" data-evcal="${all.indexOf(e)}" aria-label="Add ${esc(e.title)} at ${esc(st.name)} to your calendar" style="padding:6px 8px;font-size:var(--fs-sm)">Calendar</button></div></div>`; }).join('')}${g.evs.length > 6 ? `<div class="note">and ${g.evs.length - 6} more at this store</div>` : ''}</div>`);
    }
    out.push(`<div class="note" style="margin-top:10px">One Piece events near you, from Bandai TCG+ via onepieceevents.com. Register in the TCG+ app or site.</div>`);
  }
  $('#eventsList').innerHTML = out.join('');
  const ez = $('#eventsZip'); if (ez) ez.addEventListener('click', async () => { if (await askZip()) paintEvents(); });
  const es = $('#eventsSync'); if (es) es.addEventListener('click', async () => { es.disabled = true; const ok = (await LOCAL.syncStores()) | (await EVENTS.sync()); es.disabled = false; if (ok) paintEvents(); else toast('Event list unavailable'); });
}
$('#eventsRadius').addEventListener('change', e => { LOCAL.radius = +e.target.value; saveJson('vault.hunt.radius', String(LOCAL.radius)); paintEvents(); });
$('#events').addEventListener('click', e => { const n = e.target.closest('[data-localnote]'); if (n) { addLocalNote(n.dataset.localnote); return; } const b = e.target.closest('[data-evcal]'); if (!b) return; const ev = EVENTS.rows()[+b.dataset.evcal]; if (ev) addEventToCalendar(ev); });
$('#events').addEventListener('change', e => { if (e.target.id === 'eventsDays') { EVENTS.days = +e.target.value; saveJson('vault.hunt.eventDays', String(EVENTS.days)); paintEvents(); } });
function paintReleases() {
  const today = phoneToday();
  const sets = [...CAT.sets.values()].filter(s => s.pub);
  const up = sets.filter(s => s.pub >= today).sort((a, b) => a.pub.localeCompare(b.pub));
  const past = sets.filter(s => s.pub < today).sort((a, b) => b.pub.localeCompare(a.pub)).slice(0, 12);
  const days = d => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 864e5);
  const detailsUrl = s => 'https://www.tcgplayer.com/search/one-piece-card-game/product?q=' + encodeURIComponent(s.name) + '&view=grid';
  const picFor = s => setPic(s);

  const dSrc = HUNT.DISTS.map(([k]) => [k, HUNT.dist(k)]).filter(([, D]) => D); const gi = HUNT.distItems();
  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const setCodes = s => new Set([norm(s.abbr), ...String(s.abbr || '').split(/[-\/]/).map(norm)].filter(Boolean));
  const forSet = s => { const cs = setCodes(s); return gi.filter(it => (it.catalog_id && (CAT.byId.get(it.catalog_id) || {}).set === s.id) || (it.codes || []).some(c => cs.has(c))); };
  const onePer = (s, list) => { const cs = s ? setCodes(s) : new Set(); const out = [];
    for (const [k] of HUNT.DISTS) { const mine = list.filter(it => it._d === k); if (!mine.length) continue;
      const own = mine.filter(it => (it.codes || []).some(c => cs.has(c))); const pool = own.length ? own : mine;
      out.push(pool.find(it => /\bBOOSTER\b/i.test(it.name || '')) || pool[0]); }
    return out; };
  const known = new Set(); for (const s of CAT.sets.values()) for (const it of forSet(s)) known.add(it._k);
  const unlisted = gi.filter(it => (it.codes || []).length && !known.has(it._k)).sort((a, b) => (a.release || '9').localeCompare(b.release || '9') || a._d.localeCompare(b._d) || a.name.localeCompare(b.name));

  const cdown = pub => `<span class="note ${relBand(days(pub))}">${pub >= today ? (days(pub) === 0 ? 'today' : `in ${days(pub)} day${days(pub) === 1 ? '' : 's'}`) : `${-days(pub)} days ago`}</span>`;
  const btn = (attrs, text, aria) => `<button class="ghost" ${attrs} style="display:inline-block;padding:6px 12px;font-size:var(--fs-sm)" aria-label="${esc(aria)}">${text}</button>`;
  const foot = (s, label, extra = '') => `<div style="display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;padding:0 0 8px">${extra}${s.pub >= today ? btn(`data-relalert="${esc(s.id)}" data-relname="${esc(label)}" data-relpub="${esc(s.pub)}" aria-pressed="${RELALERTS.has(s.id)}"`, RELALERTS.has(s.id) ? 'Reminder set ' + tick() : 'Remind me', (RELALERTS.has(s.id) ? 'Remove the reminder for ' : 'Remind me the day before ') + label) + btn(`data-relcal="${esc(s.id)}" data-relname="${esc(label)}"`, 'Calendar', 'Add the release of ' + label + ' to your calendar') : ''}<a class="ghost" href="${esc(detailsUrl({ name: label }))}" target="_blank" rel="noopener" style="padding:6px 12px;font-size:var(--fs-sm)" aria-label="Full details for ${esc(label)} on TCGplayer">Details ${ext()}</a></div>`;
  const line = s => `<div class="rel"><button class="row" style="width:100%;text-align:left;padding:0;gap:10px;min-width:0" data-browse-set="${esc(s.id)}">${picFor(s)}<div class="nm" style="min-width:0"><b style="white-space:normal">${setTitleHtml(s)}</b><span>${setCards(s, today)}</span>${onePer(s, forSet(s)).map(it => `<span style="display:block;color:var(--brass)">${distShort(it)}</span>`).join('')}</div><div class="v" style="flex:0 0 auto"><b>${esc(dayText(s.pub))}</b>${cdown(s.pub)}</div></button>
${foot(s, s.name)}</div>`;

  const isDeck = s => /^ST-?\d/i.test(s.abbr || '') || /\bStarter Deck\b/i.test(s.name || '');
  const grouped = list => { const out = []; for (let i = 0; i < list.length; i++) { const s = list[i]; if (!isDeck(s)) { out.push(s); continue; }
      const run = [s]; while (i + 1 < list.length && isDeck(list[i + 1]) && list[i + 1].pub === s.pub) run.push(list[++i]);
      out.push(run.length > 1 ? { group: true, pub: s.pub, sets: run, id: s.id, name: `Starter decks ${run[0].abbr || ''}\u2013${run[run.length - 1].abbr || ''}` } : s); } return out; };
  const gline = g => `<div class="rel"><button class="row" style="width:100%;text-align:left;padding:0;gap:10px;min-width:0" data-browse-set="${esc(g.id)}" data-browse-q="Starter Deck">${picFor(g.sets[0])}<div class="nm" style="min-width:0"><b style="white-space:normal">${esc(g.name)}</b><span>${g.sets.length} starter decks, one release day</span>${onePer(null, g.sets.flatMap(s => forSet(s))).map(it => `<span style="display:block;color:var(--brass)">${distShort(it)}</span>`).join('')}</div><div class="v" style="flex:0 0 auto"><b>${esc(dayText(g.pub))}</b>${cdown(g.pub)}</div></button>${foot(g, g.name, `<button class="ghost" data-relfold="${esc(g.pub)}" aria-expanded="${RELF.open.has(g.pub)}" style="display:inline-block;padding:6px 12px;font-size:var(--fs-sm)">${RELF.open.has(g.pub) ? 'Hide the decks ' + chev(true, 14) : `Show the ${g.sets.length} decks ${chev(false, 14)}`}</button>`)}${RELF.open.has(g.pub) ? `<div style="padding-left:12px;border-left:2px solid var(--line)">${g.sets.map(line).join('')}</div>` : ''}</div>`;
  const render = list => grouped(list).map(x => x.group ? gline(x) : line(x)).join('');

  const isDeckItem = it => (it.codes || []).some(c => /^ST\d+$/.test(c)) && /STARTER DECK/i.test(it.name || '');
  const ditem = it => `<div class="row"><div class="nm" style="min-width:0"><b style="white-space:normal">${esc(it.name)}</b><span>${esc((it.codes || []).join(', '))}</span>${distLine(it)}</div></div>`;
  const dgroup = (rel, items) => { const key = 'd:' + items[0]._d + ':' + rel; const codes = items.map(it => (it.codes || [])[0]).filter(Boolean); const same = items.every(it => distWords(it).join() === distWords(items[0]).join());
    return `<div class="row" style="flex-wrap:wrap"><div class="nm" style="min-width:0;flex:1"><b style="white-space:normal">Starter decks ${esc(codes[0] || '')}\u2013${esc(codes[codes.length - 1] || '')}</b><span>${items.length} starter deck displays, one release day \u00b7 ${esc(codes.join(', '))}</span>${same ? distLine(items[0]) : `<span style="display:block;color:var(--brass)">${esc(HUNT.distName(items[0]._d))} \u00b7 mixed \u00b7 release ${esc(nbsp(dayText(rel)))}</span>`}</div>
      <button class="ghost" data-relfold="${esc(key)}" aria-expanded="${RELF.open.has(key)}" style="flex:0 0 auto;padding:6px 12px;font-size:var(--fs-sm)">${RELF.open.has(key) ? 'Hide ' + chev(true, 14) : `Show ${items.length} ${chev(false, 14)}`}</button>${RELF.open.has(key) ? `<div style="flex-basis:100%;padding-left:12px;border-left:2px solid var(--line)">${items.map(ditem).join('')}</div>` : ''}</div>`; };
  const drender = list => { const out = []; for (let i = 0; i < list.length; i++) { const it = list[i]; if (!isDeckItem(it)) { out.push(ditem(it)); continue; }
      const run = [it]; while (i + 1 < list.length && isDeckItem(list[i + 1]) && list[i + 1].release === it.release && list[i + 1]._d === it._d) run.push(list[++i]);
      out.push(run.length > 1 ? dgroup(it.release || '?', run) : ditem(it)); } return out.join(''); };
  const dDead = dSrc.filter(([, D]) => HUNT.unreached(D)).map(([k, D]) => sourceLead(HUNT.distName(k), D) + (D.ok ? '.' : ''));

  const distPanel2 = dSrc.length ? `<div class="panel">${distFold('releases', distSummary(unlisted.length ? `${unlisted.length} product${unlisted.length === 1 ? '' : 's'} not in the catalogue yet` : 'nothing waiting'),
    `<div class="fgrp" style="margin-top:0">At the distributors, not in the catalogue yet</div>${unlisted.length ? drender(unlisted) : ''}${dDead.length ? `<div class="note">${dDead.join(' ')}</div>` : unlisted.length ? '' : '<div class="note">Everything the distributors list is in the catalogue.</div>'}
    <div class="note" style="margin-top:8px">Announced to stores before TCGplayer lists them. Checked ${dSrc.filter(([, D]) => D.ok).map(([k, D]) => `${esc(HUNT.distName(k))} ${esc(HUNT.ageLabel(D.fetched_at))}`).join(', ') || 'never'}.</div>`)}</div>` : '';
  $('#relList').innerHTML = `<div class="panel"><h3>Upcoming</h3>${render(up) || '<div class="note">Nothing announced in the catalogue yet.</div>'}
    <div class="note" style="margin-top:8px">Dates from TCGplayer via TCGCSV, nightly. <i>Remind me</i> notifies you the day before.</div></div>
    ${distPanel2}
    <div class="panel"><h3>Recent</h3>${render(past)}</div>`;
}
$('#releases').addEventListener('click', e => {
  const f = e.target.closest('[data-relfold]'); if (f) { e.stopPropagation(); const k = f.dataset.relfold; if (RELF.open.has(k)) RELF.open.delete(k); else RELF.open.add(k); paintReleases(); return; }
  const a = e.target.closest('[data-relalert]'); if (a) { e.stopPropagation(); const on = RELALERTS.toggle(+a.dataset.relalert, a.dataset.relname, a.dataset.relpub);
    if (on) PLATFORM.notifyPermission().then(perm => toast(perm === 'unknown' ? 'Reminder set — if none arrives, check the phone\u2019s notification settings for this app' : perm === 'denied' ? 'Reminder set — notifications are off, so it will show here instead' : `Reminder set for the day before ${dayText(a.dataset.relpub)}`)); else toast('Reminder removed');
    paintReleases(); return; }
  const c = e.target.closest('[data-relcal]'); if (c) { e.stopPropagation(); const s = CAT.sets.get(+c.dataset.relcal); if (s) addEventToCalendar(releaseEvent(s, c.dataset.relname)); }
});
$('#sealed').addEventListener('click', e => { const k = e.target.closest('[data-skind]'); if (k) { SEALED.kind = k.dataset.skind; paintSealed(); return; }
  const f = e.target.closest('[data-setfold]'); if (f) { const id = isNaN(+f.dataset.setfold) ? f.dataset.setfold : +f.dataset.setfold; if (SEALED.closed.has(id)) SEALED.closed.delete(id); else SEALED.closed.add(id); paintSealed(); return; }
  const b = e.target.closest('[data-stock]'); if (b) { e.stopPropagation(); const on = STOCK.toggle(+b.dataset.stock); if (on) { PLATFORM.notifyPermission().then(perm => toast(perm === 'unknown' ? 'Watching \u2014 if no alert arrives, check the phone\u2019s notification settings for this app' : perm === 'denied' ? 'Watching \u2014 notifications are off, so it will show here instead' : 'Watching for stock')); STOCK.check(); } paintSealed(); } });
$('#sealedQ').addEventListener('input', e => { SEALED.q = e.target.value; SEALED.fromSet = null; paintSealed(); });

function paintSearch() {
  paintBadges();
  const q = ($('#allq').value || '').trim().toLowerCase();
  if (!q && moversShown()) return;

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
    const s = CAT.sets.get(p.set) || {}, on = WANT.hasId(p.id);

    return `<div class="srow"><button class="row" style="width:100%;text-align:left;align-items:center" data-open="${p.id}">
      ${cardPic(p)}<div class="nm"><b>${esc(p.name)}${p.treat !== 'base'
        ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
      <span>${dotJoin(esc(p.num), esc(s.abbr || s.name || ''), p.prov ? esc(p.prov) : '')}</span></div>
      <div class="v mono">${money(p.market)}</div></button>${p.num ? `<button class="icb wbtn" data-watch="${p.id}" aria-pressed="${on}" aria-label="${on ? 'On Watchlist' : 'Add to Watchlist'}: ${esc(p.name)}${p.treat !== 'base' ? ' (' + esc(TREAT[p.treat] || p.treat) + ')' : ''}">${G('bookmark', 22)}</button>` : ''}</div>`;
  }).join('')}</div>`;
}
function searchWatchTap(e) {
  const b = e.target && e.target.closest && e.target.closest('[data-watch]'); if (!b) return false;
  const p = CAT.byId.get(+b.dataset.watch); if (!p || !p.num) return false;
  const on = WANT.toggle(p.num, p.id);
  b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', `${on ? 'On Watchlist' : 'Add to Watchlist'}: ${p.name}`);
  toast(on ? `On your watchlist: ${p.name}` : `Off your watchlist: ${p.name}`); return on;
}
$('#allRes').addEventListener('click', searchWatchTap);
$('#allq').addEventListener('input', paintSearch);

function browseSet(id, q) {
  if (MODE.cur === 'hunt') {
    const s = CAT.sets.get(id); SEALED.q = q || (s && s.name) || ''; SEALED.kind = 'all';
    SEALED.fromSet = q ? null : id;
    const inp = $('#sealedQ'); if (inp) inp.value = SEALED.q;
    paintSealed(); go('sealed'); window.scrollTo(0, 0); return;
  }
  Object.assign(FILT.all, blankFilter('all'), { set: [id], sort: 'num', dir: 1 });
  FILT.save('all'); paintSearch(); go('search'); window.scrollTo(0, 0);
}
CLICKS.on('[data-browse-set]', e => {
  const b = e.target.closest('[data-browse-set]'); if (!b) return;
  browseSet(+b.dataset.browseSet, b.dataset.browseQ);
});

const BATCH = Object.assign({ rows: [], setId: null, pf: null },
  readJson('vault.batch', {}));
BATCH.save = function () {

  saveJson('vault.batch', { rows: this.rows, setId: this.setId, pf: this.pf || null });
  paintBatchBadge();

  if (typeof scheduleBackup === 'function') scheduleBackup('scan', 5000);
};
function paintBatchBadge() {
  const b = $('nav button[data-go="scan"]'); if (!b) return;
  let badge = b.querySelector('.fcount');
  if (!badge) { badge = document.createElement('span'); badge.className = 'fcount'; b.appendChild(badge); }
  badge.style.display = BATCH.rows.length ? 'inline-block' : 'none';
  badge.textContent = BATCH.rows.length;
}
function paintScan() {
  startCamera();
  paintBatchBadge();

  if (!SCAN._resumedOnce) {
    SCAN._resumedOnce = true;

    if (BATCH.rows.length) $('#lastScan').innerHTML = `<b>${BATCH.rows.length} scanned card${BATCH.rows.length === 1 ? '' : 's'} waiting</b><span>From before. Tap Review to check them and add them.</span>`;
  }
  $('#scCount').textContent = BATCH.rows.length;
  $('#scTotal').textContent = money(BATCH.rows.reduce((s, r) => s + (price(r.id) || 0), 0));

  $('#btnDone').innerHTML = 'Review' + (BATCH.rows.length ? ` <b class="mono">${BATCH.rows.length}</b>` : '');
  $('#btnSample').hidden = !sampleScans();
  paintScanInto();
  const s = BATCH.setId ? CAT.sets.get(BATCH.setId) : null;
  $('#setChip').innerHTML = 'Set: <b>' + esc(s ? (s.abbr || s.name) : 'Any') + '</b> ' + chev(true);
}

$('#setChip').addEventListener('click', () => {
  const list = [...CAT.sets.values()].filter(s => s.n > 0);
  $('#pkTitle').textContent = 'Which set are you scanning?';
  $('#pkWhy').innerHTML = 'The number alone settles about 1 card in 10; with the set chosen, about 6 in 10. Choose it once, before the binder.';
  $('#pkOpts').innerHTML = `<button class="opt${!BATCH.setId ? ' best' : ''}" data-setpick="0">
      <div class="oi"><b>Any set</b><span>ask when a number is ambiguous</span></div></button>` +
    list.map(s => `<button class="opt${BATCH.setId === s.id ? ' best' : ''}" data-setpick="${s.id}">
      <div class="oi"><b>${esc(s.abbr || '')}</b><span>${esc(s.name)} \u00b7 ${s.n} cards</span></div>
      <div class="op" style="font-size:var(--fs-cap);color:var(--dim2)">${esc((s.pub || '').slice(0, 4))}</div></button>`).join('');
  $('#picker').classList.add('on');
});
CLICKS.on('[data-setpick]', e => {
  const b = e.target.closest('[data-setpick]'); if (!b) return;
  BATCH.setId = +b.dataset.setpick || null; BATCH.save();
  $('#picker').classList.remove('on'); paintScan();
  const s = BATCH.setId ? CAT.sets.get(BATCH.setId) : null;
  toast(s ? `Scanning ${s.abbr} \u2014 candidates narrow ~7\u00d7` : 'Any set');
});

$('#btnUndo').addEventListener('click', () => {
  if (!BATCH.rows.length) return toast('Nothing to undo');
  const r = BATCH.rows.pop(); BATCH.save(); paintScan();
  toast('Removed ' + (CAT.byId.get(r.id)?.name || 'card'));
});

function openReview() {
  if (!BATCH.rows.length) { toast('Scan something first'); return false; }
  go('review'); return true;
}
$('#btnDone').addEventListener('click', openReview);
function commitBatch() {
  if (!BATCH.rows.length) { toast('Scan something first'); return false; }

  const n = BATCH.rows.length;
  const ok = CREDITS.canCommit(n);

  const pf = reviewInto(), rows = BATCH.rows.map(r => ({ ...r, pf }));

  if (!OWN.moveIn(rows.slice(0, ok))) return false;
  CREDITS.spendScan(ok);
  const wait = rows.slice(ok);
  BATCH.rows = wait.length && !CREDITS.defer(wait) ? wait : [];
  if (!BATCH.rows.length) BATCH.pf = null;
  BATCH.save(); OWN.snapshot(); scheduleBackup('batch');

  if (PF.active !== 'all' && PF.active !== pf) { PF.active = pf; PF.save(); }
  toast(ok === n ? `Added ${n} card${n > 1 ? 's' : ''} to ${PF.name(pf)}`
                 : `${ok} added \u00b7 ${n - ok} waiting for credits`);
  go('collection'); return true;
}

const REVIEW_CONDS = ['NM', 'LP', 'MP', 'HP', 'DMG'];
const rowCond = r => (REVIEW_CONDS.includes(r && r.condition) ? r.condition : 'NM');
function reviewGroups() {
  const m = new Map();
  BATCH.rows.forEach((r, k) => {
    const cond = rowCond(r), key = `${r.id}|${cond}`;
    let g = m.get(key); if (!g) m.set(key, g = { key, id: r.id, cond, at: [] });
    g.at.push(k);
  });
  return [...m.values()];
}
function reviewGroup(key) { return reviewGroups().find(g => g.key === key) || null; }

function reviewInto() { const t = BATCH.pf; return t && PF.list.some(p => p.id === t) ? t : OWN.target(); }
function reviewChanged() { BATCH.save(); paintReview(); return true; }

function reviewQty(key, d) {
  const g = reviewGroup(key); if (!g) return false;
  if (d > 0) { BATCH.rows.push({ id: g.id, photo: null, condition: g.cond }); return reviewChanged(); }
  if (g.at.length < 2) return false;
  const bare = [...g.at].reverse().find(k => !BATCH.rows[k].photo);
  BATCH.rows.splice(bare != null ? bare : g.at[g.at.length - 1], 1);
  return reviewChanged();
}
function reviewCond(key, c) {
  const g = reviewGroup(key); if (!g || !REVIEW_CONDS.includes(c) || g.cond === c) return false;
  g.at.forEach(k => { BATCH.rows[k] = { ...BATCH.rows[k], condition: c }; });
  return reviewChanged();
}

function reviewSwap(key, id) {
  const g = reviewGroup(key), p = CAT.byId.get(id); if (!g || !p || g.id === id) return false;
  g.at.forEach(k => { BATCH.rows[k] = { ...BATCH.rows[k], id }; });
  return reviewChanged();
}
function reviewRemove(key) {
  const g = reviewGroup(key), p = g && CAT.byId.get(g.id); if (!g) return false;
  const n = g.at.length;
  if (!confirm(`Remove ${p ? p.name + (p.num ? ' (' + p.num + ')' : '') : 'this card'}${n > 1 ? ' \u00d7' + n : ''} from this batch?\n\nIt is not in your collection yet; you can scan it again.`)) return false;
  const drop = new Set(g.at); BATCH.rows = BATCH.rows.filter((r, k) => !drop.has(k));
  return reviewChanged();
}
function reviewClear() {
  const n = BATCH.rows.length; if (!n) return false;
  if (!confirm(`Clear all ${n} scanned card${n === 1 ? '' : 's'}?\n\nNone of them is in your collection yet.`)) return false;
  BATCH.rows = []; BATCH.pf = null; BATCH.save(); go('scan'); return true;
}

function printingsOf(p) { return p && p.num ? (CAT.byNum.get(p.num) || []).filter(q => q.num === p.num) : []; }

function reviewFind(q) {
  const t = String(q || '').trim().toLowerCase(); if (!t) return [];
  const words = t.split(/\s+/), num = t.toUpperCase();
  return CAT.rows.filter(p => p.num && !SEALED.isGoods(p) && words.every(w => `${p.full || p.name} ${p.num} ${(CAT.sets.get(p.set) || {}).name || ''}`.toLowerCase().includes(w)))
    .sort((a, b) => (b.num === num) - (a.num === num) || (b.market || 0) - (a.market || 0)).slice(0, 40);
}
function printingOpt(q, cur, key) {
  const s = CAT.sets.get(q.set) || {};
  const bits = [TREAT[q.treat] || q.treat]; if (q.prov) bits.push(q.prov); if (q.award) bits.push(q.award);
  const face = q.face === 'sp' ? 'SP badge on the card' : q.face === 'star' ? 'star on the card' : '';
  return `<button class="opt${cur ? ' best' : ''}" data-${key}="${q.id}">
      <div class="oa">${cardPic(q)}</div>
      <div class="oi"><b>${esc(q.name)}</b><span>${dotJoin(esc(q.num), esc(bits.join(' \u00b7 ')), esc(s.abbr || s.name || ''), face)}${cur ? ' \u00b7 scanned as this' : ''}</span></div>
      <div class="op mono">${money(q.market)}<span>${esc(q.sub || 'Normal')}</span></div>
    </button>`;
}
async function reviewPickPrinting(key) {
  const g = reviewGroup(key), p = g && CAT.byId.get(g.id), sibs = printingsOf(p);
  if (!g || sibs.length < 2) return false;
  const v = await PICKER.choose({ title: `Which ${p.num}?`, key: 'rvprint',
    why: 'Every printing of this number: the same number on the card face, different money. Match the art, the finish and the marks.',
    opts: sibs.map(q => printingOpt(q, q.id === p.id, 'rvprint')).join('') });
  return v != null && reviewSwap(key, +v);
}
async function reviewFixCard(key) {
  if (!reviewGroup(key)) return false;
  const q = await ask({ title: 'Which card is it?', ok: 'Find', placeholder: 'OP17-023 or Nami',
    why: 'Type the number printed on the card, like <b>OP17-023</b>, or its name.' });
  if (!q) return false;
  const hits = reviewFind(q);
  if (!hits.length) { toast(`No card matches \u201c${q}\u201d`); return false; }
  const v = await PICKER.choose({ title: 'Pick the card', key: 'rvprint',
    why: `${hits.length === 40 ? 'The first 40 cards' : hits.length === 1 ? 'The one card' : 'The ' + hits.length + ' cards'} matching \u201c${esc(q)}\u201d.`,
    opts: hits.map(h => printingOpt(h, false, 'rvprint')).join('') });
  return v != null && reviewSwap(key, +v);
}
async function reviewPickCond(key) {
  const g = reviewGroup(key); if (!g) return false;
  const v = await PICKER.choose({ title: 'Condition', key: 'rvcond',
    why: 'Yours to judge: the app cannot see wear. The price shown stays the market price \u2014 TCGplayer publishes no price per condition.',
    opts: REVIEW_CONDS.map(c => `<button class="opt${c === g.cond ? ' best' : ''}" data-rvcond="${c}"><div class="oi"><b>${COND_NAMES[c]}</b><span>${c}</span></div></button>`).join('') });
  return !!v && reviewCond(key, v);
}
async function reviewPickInto() {
  const cur = reviewInto(), lines = id => OWN.items.filter(i => (i.pf || 'main') === id).length;
  const v = await PICKER.choose({ title: 'Add them to', key: 'rvinto',
    why: 'The collection these cards go into. Scans go into the one you have open unless you choose here.',
    opts: PF.list.map(c => `<button class="opt${c.id === cur ? ' best' : ''}" data-rvinto="${esc(c.id)}"><div class="oi"><b>${esc(c.name)}</b><span>${lines(c.id)} line${lines(c.id) === 1 ? '' : 's'}</span></div></button>`).join('') });
  if (v == null || !PF.list.some(c => c.id === v)) return false;
  BATCH.pf = v; return reviewChanged();
}
function reviewRow(g) {
  const p = CAT.byId.get(g.id); if (!p) return '';
  const s = CAT.sets.get(p.set) || {}, n = g.at.length, photo = (g.at.map(k => BATCH.rows[k].photo).find(Boolean)) || null;
  const others = printingsOf(p).length - 1;
  return `<div class="rvrow" data-rvkey="${esc(g.key)}">
      <div class="rvpics">${photo ? `<img class="mine" src="${esc(photo)}" alt="Your scan">` : ''}${cardPic(p)}</div>
      <div class="nm"><b>${esc(p.name)}${p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
        <span>${dotJoin(esc(p.num), esc(s.abbr || s.name || ''), esc(p.sub || ''))}</span>
        <span>${money(p.market)} each</span></div>
      <div class="v mono">${money(p.market == null ? null : p.market * n)}</div>
      <div class="rvctl">
        <div class="stepper"><button data-rv="dec" aria-label="One fewer ${esc(p.name)}"${n < 2 ? ' disabled' : ''}>${G('minus', 20)}</button><b class="mono">${n}</b><button data-rv="inc" aria-label="One more ${esc(p.name)}">${G('plus', 20)}</button></div>
        <button class="chip" data-rv="cond" aria-label="Condition, ${COND_NAMES[g.cond]}: change it">${COND_NAMES[g.cond]} ${chev(true)}</button>
      </div>
      <div class="chips">${others > 0 ? `<button class="chip" data-rv="print">Other printings (${others})</button>` : ''}<button class="chip" data-rv="fix">Wrong card?</button><button class="chip" data-rv="rm" style="color:var(--down)">Remove</button></div>
    </div>`;
}
function paintReview() {
  const gs = reviewGroups(), n = BATCH.rows.length, total = BATCH.rows.reduce((t, r) => t + (price(r.id) || 0), 0), into = reviewInto();
  $('#rvSub').textContent = n ? `${n} card${n === 1 ? '' : 's'} \u00b7 ${money(total)}` : 'Nothing scanned yet';
  $('#rvInto').innerHTML = 'Into: <b>' + esc(PF.name(into)) + '</b> ' + chev(true);
  const c = $('#rvCredits');
  if (CREDITS.enabled() && n) {
    const have = CREDITS.state.scan, now = Math.min(n, have);
    c.hidden = false;
    c.textContent = now === n ? `Adding them uses ${n} save credit${n === 1 ? '' : 's'}; you have ${have}.`
      : `You have ${have} save credit${have === 1 ? '' : 's'}: ${now} go${now === 1 ? 'es' : ''} in now and ${n - now} wait${n - now === 1 ? 's' : ''} for credits. Nothing is lost.`;
  } else c.hidden = true;
  $('#rvList').innerHTML = gs.length ? `<div class="panel">${gs.map(reviewRow).join('')}</div>`
    : emptyHtml('scan', 'Nothing to review', 'Scan a card and it waits here for you to check it.');
  const add = $('#rvAdd'); add.textContent = n ? `Add ${n} card${n === 1 ? '' : 's'}` : 'Add'; add.disabled = !n;
  $('#rvClear').hidden = !n;
}
$('#rvAdd').addEventListener('click', commitBatch);
$('#rvMore').addEventListener('click', () => go('scan'));
$('#rvClear').addEventListener('click', reviewClear);
$('#rvInto').addEventListener('click', reviewPickInto);

function reviewTap(e) {
  const b = e.target && e.target.closest && e.target.closest('[data-rv]'); if (!b || b.disabled) return false;
  const row = b.closest('[data-rvkey]'); if (!row) return false;
  const key = row.dataset.rvkey, act = b.dataset.rv;
  return ({ inc: () => reviewQty(key, 1), dec: () => reviewQty(key, -1), cond: () => reviewPickCond(key),
            print: () => reviewPickPrinting(key), fix: () => reviewFixCard(key), rm: () => reviewRemove(key) })[act]?.() ?? false;
}
$('#rvList').addEventListener('click', reviewTap);

const PLATFORM = {
  cap() { return window.Capacitor && window.Capacitor.Plugins; },
  plugin(name) {
    const C = window.Capacitor;
    if (!C) return null;
    if (C.Plugins && C.Plugins[name]) return C.Plugins[name];
    try { return C.registerPlugin ? C.registerPlugin(name) : null; } catch (e) { return null; }
  },

  statusBar(theme) { const SB = this.plugin('StatusBar'); if (!SB || typeof SB.setStyle !== 'function') return false; try { const p = SB.setStyle({ style: theme === 'light' ? 'LIGHT' : 'DARK' }); if (p && p.catch) p.catch(() => {}); } catch (e) {} return true; },
  hasOcr() { return !!this.plugin('TextRecognition'); },

  async ocr(canvas) {
    const TR = this.plugin('TextRecognition'), FS = this.plugin('Filesystem');
    if (!TR || !FS) return null;
    const b64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    const f = await FS.writeFile({ path: `scan/${Date.now()}.jpg`, data: b64,
                                   directory: 'CACHE', recursive: true });
    try {
      const r = (await TR.processImage({ path: f.uri, script: 'LATIN' })) || {};
      const box = b => b ? { x: b.left, y: b.top, w: b.right - b.left, h: b.bottom - b.top } : null;
      return { text: r.text || '', lines: (r.blocks || []).flatMap(b => b.lines || []).map(l => ({ text: l.text || '', box: box(l.boundingBox) })) };
    } finally {
      FS.deleteFile({ path: f.uri }).catch(() => {});
    }
  },
  async haptic() {
    const H = this.plugin('Haptics');
    if (H) { try { await H.impact({ style: 'MEDIUM' }); return; } catch (e) {} }
    if (navigator.vibrate) navigator.vibrate(18);
  },

  async savePhoto(dataUrl, key) {
    const FS = this.plugin('Filesystem');
    if (!FS) return dataUrl;
    try {
      const path = `photos/${key}-${Date.now()}.jpg`;
      const r = await FS.writeFile({ path, data: dataUrl.split(',')[1], directory: 'DATA', recursive: true });
      const C = window.Capacitor;
      return C && C.convertFileSrc ? C.convertFileSrc(r.uri) : r.uri;
    } catch (e) { console.warn('photo save failed', e); return null; }
  },

  async backup(json) {
    const FS = this.plugin('Filesystem');
    if (!FS) { localStorage.setItem('vault.backup', json); return 'browser storage'; }
    const latest = await this.writeOwnDoc('backup-latest.json', json);

    const day = localDay(new Date().toISOString());
    try { await FS.writeFile({ path: `OPTCGHub/backup-${day}.json`, data: json, directory: 'DOCUMENTS', recursive: true, encoding: 'utf8' }); }
    catch (e) { ERRS.push('backup', `backup-${day}.json could not be written: ${e.message || e}`, 'backup'); }
    return latest === 'backup-latest.json' ? 'Documents/OPTCGHub' : `Documents/OPTCGHub/${latest}`;
  },

  async writeOwnDoc(base, json) {
    const FS = this.plugin('Filesystem'), names = readJson('vault.docNames', {}, false);
    const write = name => FS.writeFile({ path: `OPTCGHub/${name}`, data: json, directory: 'DOCUMENTS', recursive: true, encoding: 'utf8' });
    const first = names[base] || base;
    try { await write(first); return first; }
    catch (e) {
      const t = new Date(), p = n => String(n).padStart(2, '0');
      const name = base.replace(/\.json$/, `-${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}-${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}.json`);
      try { await write(name); } catch (e2) { throw new Error(`${first}: ${e.message || e}; ${name}: ${e2.message || e2}`); }
      saveJson('vault.docNames', { ...names, [base]: name });
      ERRS.push('backup', `${first} could not be written (${e.message || e}); this install writes ${name} now`, 'writeOwnDoc');
      return name;
    }
  },

  async keepAside(json) {
    const FS = this.plugin('Filesystem'); if (!FS) return null;
    try { await this.writeOwnDoc('backup-before-restore.json', json); return 'Documents/OPTCGHub'; }
    catch (e) { ERRS.push('backup', `the copy before a restore was not written: ${e.message || e}`, 'keepAside'); return null; }
  },

  async readBackup() {
    const FS = this.plugin('Filesystem');
    if (!FS) return localStorage.getItem('vault.backup');
    const name = readJson('vault.docNames', {}, false)['backup-latest.json'] || 'backup-latest.json';
    try { return (await FS.readFile({ path: `OPTCGHub/${name}`, directory: 'DOCUMENTS', encoding: 'utf8' })).data; }
    catch (e) { return null; }
  },

  async backupDays() {
    const FS = this.plugin('Filesystem'); if (!FS || typeof FS.readdir !== 'function') return [];
    try {
      const r = await FS.readdir({ path: 'OPTCGHub', directory: 'DOCUMENTS' });
      const days = ((r && r.files) || []).map(f => /^backup-(\d{4}-\d\d-\d\d)\.json$/.exec((f && typeof f === 'object' ? f.name : f) || '')).filter(Boolean).map(m => m[1]);
      return [...new Set(days)].sort().reverse();
    } catch (e) { return []; }
  },
  async readBackupDay(day) {
    const FS = this.plugin('Filesystem'); if (!FS || !/^\d{4}-\d\d-\d\d$/.test(String(day))) return null;
    try { return (await FS.readFile({ path: `OPTCGHub/backup-${day}.json`, directory: 'DOCUMENTS', encoding: 'utf8' })).data; }
    catch (e) { return null; }
  },

  async shareFile(name, text, dialogTitle) {
    const FS = this.plugin('Filesystem'), SH = this.plugin('Share');
    if (!FS || !SH) return false;
    try {
      const r = await FS.writeFile({ path: `export/${name}`, data: text, directory: 'CACHE', recursive: true, encoding: 'utf8' });
      await SH.share({ title: name, files: [r.uri], dialogTitle });
      return 'shared';
    } catch (e) {
      if (/cancel/i.test(String(e && e.message))) return 'cancelled';
      toast('Export failed \u2014 ' + (e && e.message || 'unknown')); return 'cancelled';
    }
  },

  storeUrl() { return 'https://play.google.com/store/apps/details?id=' + (CAT.man.appId || 'com.optcghub.app'); },
  async rateApp() {
    const url = this.storeUrl();

    try { if (this.plugin('App') || this.isNative) { window.open('market://details?id=' + (CAT.man.appId || 'com.optcghub.app'), '_system'); return true; } } catch (e) {}
    window.open(url, '_blank');
    return true;
  },

  appUpdateInfo() { const U = this.plugin('AppUpdate'); return U && typeof U.getAppUpdateInfo === 'function' ? U.getAppUpdateInfo() : Promise.resolve(null); },
  async openStore() { const U = this.plugin('AppUpdate'); if (U && typeof U.openAppStore === 'function') { try { await U.openAppStore(); return true; } catch (e) {} } return this.rateApp(); },
  async shareApp() {
    const SH = this.plugin('Share');
    const text = 'OP TCG Hub \u2014 scan, value and track your One Piece Card Game collection. Offline, no scan cap.';
    if (SH) { try { await SH.share({ title: 'OP TCG Hub', text, url: this.storeUrl(), dialogTitle: 'Share OP TCG Hub' }); return 'shared'; } catch (e) { return 'cancelled'; } }
    try { await navigator.clipboard.writeText(text + ' ' + this.storeUrl()); return 'copied'; } catch (e) { return false; }
  },

  pickTextFile(accept) {
    return new Promise(res => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
      inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if (!f) return res(null); const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = () => res(null); rd.readAsText(f); });
      inp.click();
    });
  },

  onCellular() { const c = navigator.connection; return !!(c && c.type === 'cellular'); },
  quietSyncAllowed() { return !this.onCellular() || localStorage.getItem('vault.syncCellular') === '1'; },
  async refreshCatalogue({ quiet = false } = {}) {
    const base = CAT.man.updateUrl; if (!base) { if (!quiet) toast('Sync is not configured \u2014 update the app for new prices'); return false; }
    if (!navigator.onLine) { if (!quiet) toast('No connection'); return false; }
    try {
      NET.count++;
      const mr = await fetch(base + 'manifest.json', { cache: 'no-store' }); if (!mr.ok) throw new Error('HTTP ' + mr.status);
      const m = await mr.json();
      if (!m.source_updated_at || m.source_updated_at <= (CAT.man.source_updated_at || '')) { if (!quiet) toast('Prices are already current'); return false; }
      NET.count++;
      const cr = await fetch(base + 'catalog.json', { cache: 'no-store', wait: NET.WAIT_BIG }); if (!cr.ok) throw new Error('HTTP ' + cr.status);
      const raw = await cr.text();

      let why = ''; try { why = catalogueProblem(JSON.parse(raw), CAT.shape); } catch (e) { why = 'it does not parse'; }
      if (why) { ERRS.push('catalogue', `the catalogue for ${String(m.source_updated_at).slice(0, 10)} was not written: ${why}`, 'sync'); if (!quiet) toast('Sync failed \u2014 the new catalogue could not be read; your prices stay as they are'); return false; }
      const FS = this.plugin('Filesystem');
      if (FS) {
        await FS.writeFile({ path: 'catalogue/catalog.json', data: raw, directory: 'DATA', recursive: true, encoding: 'utf8' });
        await FS.writeFile({ path: 'catalogue/manifest.json', data: JSON.stringify(m), directory: 'DATA', recursive: true, encoding: 'utf8' });
      }
      await loadCatalogue();
      OWN.snapshot(); scheduleBackup('sync');
      if (FS && !CAT.man.fromDisk) { if (!quiet) toast('Sync failed \u2014 the new catalogue could not be read; your prices stay as they are'); return false; }
      const fired = await ALERTS.check();
      toast(`Prices updated to ${dayText(m.source_updated_at)}` + (fired.length ? ` \u00b7 ${fired.length} alert${fired.length === 1 ? '' : 's'}` : ''));
      paintHome(); if (moversShown()) paintMovers(); return true;
    } catch (e) { if (!quiet) toast('Sync failed \u2014 ' + (e.message || 'network')); return false; }
  },

  async notifyPermission() {
    const N = this.plugin('LocalNotifications'); if (!N) return 'browser';

    try { let s = (await N.checkPermissions()) || {}; if (s.display !== 'granted') s = (await N.requestPermissions()) || {}; return s.display || 'unknown'; }
    catch (e) { return 'denied'; }
  },
  async notify(id, title, body) {
    const N = this.plugin('LocalNotifications');
    if (!N) { toast(`${title} \u2014 ${body}`); return false; }
    try { await N.schedule({ notifications: [{ id, title, body, smallIcon: 'ic_stat_don', iconColor: '#F2C14E' }] }); return true; }
    catch (e) { console.warn('notify failed', e); toast(`${title} \u2014 ${body}`); return false; }
  },

  async notifyAt(id, title, body, at) {
    const N = this.plugin('LocalNotifications'); if (!N) return false;
    try { await N.schedule({ notifications: [{ id, title, body, smallIcon: 'ic_stat_don', iconColor: '#F2C14E', schedule: { at, allowWhileIdle: true } }] }); return true; }
    catch (e) { console.warn('notifyAt failed', e); return false; }
  },
  async cancelNotify(id) {
    const N = this.plugin('LocalNotifications'); if (!N) return false;
    try { await N.cancel({ notifications: [{ id }] }); return true; } catch (e) { return false; }
  },

  async pickImage() {
    const Cam = this.plugin('Camera');
    if (!Cam) return null;
    const r = await Cam.pickImages({ limit: 1 });
    return r && r.photos && r.photos[0] ? (r.photos[0].webPath || r.photos[0].path) : null;
  }
};

const CANON = { w: 500, h: 700 };
const ASPECT = 63 / 88;

const CODE_RE = /(?:OP|ST|EB|PRB|LT)\d{2}-?\d{3}|P-\d{3}/;

const CODE_AT = { x: 0.84, y: 0.952 };
const OCR_MAX = 1600;

function viewRect(sw, sh, ew, eh) {
  if (!(ew > 0 && eh > 0)) return { x: 0, y: 0, w: sw, h: sh };
  const s = Math.max(ew / sw, eh / sh), w = Math.min(sw, ew / s), h = Math.min(sh, eh / s);
  return { x: (sw - w) / 2, y: (sh - h) / 2, w, h };
}

function viewCanvas(src, v) {
  const s = Math.min(1, OCR_MAX / Math.max(v.w, v.h)), c = document.createElement('canvas');
  c.width = Math.round(v.w * s); c.height = Math.round(v.h * s);
  c.getContext('2d', { willReadFrequently: true }).drawImage(src, v.x, v.y, v.w, v.h, 0, 0, c.width, c.height);
  return c;
}

const LOOKS = [
  { name: 'whole' },
  { name: 'near', part: { x: 0.3, y: 0.5, w: 0.7, h: 0.5 }, zoom: 2 },
  { name: 'glare', even: true },
];

function lookCanvas(base, look) {
  const p = look.part || { x: 0, y: 0, w: 1, h: 1 };
  const sx = p.x * base.width, sy = p.y * base.height, sw = p.w * base.width, sh = p.h * base.height;
  const scale = Math.min(look.zoom || 1, OCR_MAX / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(base, sx, sy, sw, sh, 0, 0, c.width, c.height);
  if (look.even) equalise(c);
  return { canvas: c, toBase: b => ({ x: sx + b.x / scale, y: sy + b.y / scale, w: b.w / scale, h: b.h / scale }) };
}

function equalise(c, tiles = 8, clip = 3) {
  const g = c.getContext('2d', { willReadFrequently: true }), W = c.width, H = c.height;
  const im = g.getImageData(0, 0, W, H), d = im.data, L = new Uint8Array(W * H);
  for (let i = 0, p = 0; p < L.length; i += 4, p++) L[p] = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
  const tw = W / tiles, th = H / tiles, maps = [];
  for (let ty = 0; ty < tiles; ty++) for (let tx = 0; tx < tiles; tx++) {
    const x0 = Math.floor(tx * tw), x1 = Math.floor((tx + 1) * tw), y0 = Math.floor(ty * th), y1 = Math.floor((ty + 1) * th);
    const hist = new Float64Array(256), n = Math.max(1, (x1 - x0) * (y1 - y0));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) hist[L[y * W + x]]++;
    const lim = Math.max(1, clip * n / 256); let over = 0;
    for (let v = 0; v < 256; v++) if (hist[v] > lim) { over += hist[v] - lim; hist[v] = lim; }
    const map = new Uint8Array(256); let acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v] + over / 256; map[v] = Math.min(255, Math.round(acc * 255 / n)); }
    maps.push(map);
  }

  const blend = (n, size) => { const a = new Int32Array(n), b = new Int32Array(n), f = new Float32Array(n);
    for (let k = 0; k < n; k++) { const t = Math.min(tiles - 1, Math.max(0, (k + 0.5) / size - 0.5)); a[k] = Math.floor(t); b[k] = Math.min(tiles - 1, a[k] + 1); f[k] = t - a[k]; }
    return { a, b, f }; };
  const X = blend(W, tw), Y = blend(H, th);
  for (let y = 0; y < H; y++) {
    const ra = Y.a[y] * tiles, rb = Y.b[y] * tiles, wy = Y.f[y];
    for (let x = 0; x < W; x++) {
      const v = L[y * W + x], i = (y * W + x) * 4, wx = X.f[x];
      const top = maps[ra + X.a[x]][v] * (1 - wx) + maps[ra + X.b[x]][v] * wx;
      const bot = maps[rb + X.a[x]][v] * (1 - wx) + maps[rb + X.b[x]][v] * wx;
      d[i] = d[i + 1] = d[i + 2] = top * (1 - wy) + bot * wy;
    }
  }
  g.putImageData(im, 0, 0);
  return c;
}

function normaliseRead(t) {
  let s = String(t || '').toUpperCase().replace(/\s+/g, '');
  s = s.replace(/(?<=\d)O/g, '0').replace(/O(?=\d)/g, '0')
       .replace(/(?<=\d)I/g, '1').replace(/I(?=\d)/g, '1')
       .replace(/(?<=\d)S/g, '5');
  return s.replace(/[^A-Z0-9-]/g, '');
}
function parseRead(text) {
  const norm = normaliseRead(text);
  const m = norm.match(CODE_RE);
  const number = m ? (m[0].includes('-') ? m[0] : m[0].slice(0, -3) + '-' + m[0].slice(-3)) : null;

  const valid = number && CAT.valid.has(number) ? number : null;

  const sp = /(^|[^A-Z])SP(?=[A-Z]{1,3}\d)/.test(norm) || /^SP/.test(norm);
  return { number: valid, raw: text, sp };
}

function codesIn(read, w, h) {
  const onCard = b => !b || (b.w >= 2 * b.h && b.x + b.w / 2 >= w / 4 && b.y + b.h / 2 >= h / 4);
  const words = squash(read.text);
  return read.lines.map(l => ({ ...parseRead(l.text), box: l.box }))
    .filter(r => r.number && onCard(r.box) && !misnamed(r.number, words));
}

const squash = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const namesOf = n => new Set((CAT.byNum.get(n) || []).map(p => squash(p.name)).filter(x => x.length >= 4));
function misnamed(number, words) {
  const own = namesOf(number);
  if ([...own].some(x => words.includes(x))) return false;
  for (let i = 0; i < number.length; i++) {
    if (!/\d/.test(number[i])) continue;
    for (let d = 0; d < 10; d++) {
      const m = number.slice(0, i) + d + number.slice(i + 1);
      if (m !== number && CAT.valid.has(m) && [...namesOf(m)].some(x => !own.has(x) && words.includes(x))) return true;
    }
  }
  return false;
}

const _work = document.createElement('canvas');
function detectQuad(src, sw, sh) {
  const W = 160, H = Math.round(W * sh / sw);
  _work.width = W; _work.height = H;
  const c = _work.getContext('2d', { willReadFrequently: true });
  c.drawImage(src, 0, 0, W, H);
  const d = c.getImageData(0, 0, W, H).data;
  let sum = 0;
  const lum = new Float32Array(W * H);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    lum[p] = d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114; sum += lum[p];
  }
  const thr = (sum / (W * H)) * 1.18;
  let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (lum[y * W + x] > thr) {
      n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (n < W * H * 0.06) return null;
  const w = x1 - x0, h = y1 - y0;
  if (w < 8 || h < 8) return null;
  const ar = w / h;
  if (ar < ASPECT * 0.78 || ar > ASPECT * 1.22) return null;
  const sx = sw / W, sy = sh / H;
  return { x: x0 * sx, y: y0 * sy, w: w * sx, h: h * sy };
}
function cardAround(base, code) {
  const q = code && detectQuad(base, base.width, base.height);
  if (!q) return null;
  const cx = (code.x + code.w / 2 - q.x) / q.w, cy = (code.y + code.h / 2 - q.y) / q.h;
  return Math.abs(cx - CODE_AT.x) <= 0.1 && Math.abs(cy - CODE_AT.y) <= 0.02 ? q : null;
}

function fitCard(c) {
  const w = Math.min(c.width, c.height * ASPECT), h = w / ASPECT;
  return { x: (c.width - w) / 2, y: (c.height - h) / 2, w, h };
}
function warpCanonical(src, q) {
  const full = document.createElement('canvas');
  full.width = CANON.w; full.height = CANON.h;
  full.getContext('2d').drawImage(src, q.x, q.y, q.w, q.h, 0, 0, CANON.w, CANON.h);
  return full;
}

function cropStar(full) {
  const T = CAT.star; if (!T) return null;
  const [bx, by, bw, bh] = T.box, c = document.createElement('canvas');
  c.width = Math.round(CANON.w * bw); c.height = Math.round(CANON.h * bh);
  c.getContext('2d').drawImage(full, Math.round(CANON.w * bx), Math.round(CANON.h * by), c.width, c.height, 0, 0, c.width, c.height);
  return c;
}
function starScore(starCanvas) {
  const T = CAT.star; if (!T || !starCanvas) return null;
  const c = document.createElement('canvas');
  c.width = T.w; c.height = T.h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(starCanvas, 0, 0, T.w, T.h);
  const d = g.getImageData(0, 0, T.w, T.h).data;
  const n = T.w * T.h, v = new Float32Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) { v[i] = d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114; mean += v[i]; }
  mean /= n;
  let sd = 0;
  for (let i = 0; i < n; i++) sd += (v[i] - mean) ** 2;
  sd = Math.sqrt(sd / n) || 1e-6;
  let dot = 0;
  for (let i = 0; i < n; i++) dot += ((v[i] - mean) / sd) * T.template[i];
  return dot / n;
}

async function identifyFrame(src, view, look = LOOKS[0]) {
  const base = viewCanvas(src, view);
  const { canvas, toBase } = lookCanvas(base, look);
  const read = await PLATFORM.ocr(canvas);
  if (!read) return { stage: 'no-ocr' };
  if (!read.lines.length) return { stage: 'no-text' };
  const hits = codesIn(read, canvas.width, canvas.height);
  const numbers = [...new Set(hits.map(r => r.number))];
  if (!numbers.length) return { stage: 'no-read', raw: read.text };
  if (numbers.length > 1) return { stage: 'several', numbers, raw: read.text };
  const hit = hits.find(r => r.sp) || hits[0];
  const q = cardAround(base, hit.box && toBase(hit.box));
  const full = warpCanonical(base, q || fitCard(base));
  const sc = q ? starScore(cropStar(full)) : null;
  const face = hit.sp ? 'sp' : sc != null && sc >= CAT.star.threshold ? 'star' : null;

  const card = q && { x: q.x / base.width, y: q.y / base.height, w: q.w / base.width, h: q.h / base.height };
  return { stage: 'read', number: hit.number, face, full, card, raw: read.text };
}

function makeVoter(size = 3, need = 2, release = 3) {
  const buf = []; let held = null, gone = 0;
  return {
    get held() { return held; },
    push(number) {
      if (held) { if (number === held) { gone = 0; return null; } if (++gone >= release) held = null; }
      if (!number) return null;
      buf.push(number); if (buf.length > size) buf.shift();
      const counts = {};
      for (const n of buf) counts[n] = (counts[n] || 0) + 1;
      const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (!best || best[1] < need) return null;
      buf.length = 0; held = best[0]; gone = 0;
      return held;
    },
    reset() { buf.length = 0; held = null; gone = 0; }
  };
}

function deckHistory(deck) {
  if (!CAT.days.length) return [];
  const rows = deck.cards.map(c => ({ n: c.n, h: CAT.hist[c.id] })).filter(r => r.h);
  if (deck.leader && CAT.hist[deck.leader]) rows.push({ n: 1, h: CAT.hist[deck.leader] });
  const out = [];
  CAT.days.forEach((d, di) => {
    let tot = 0, any = false;
    for (const r of rows) { const m = r.h[di]; if (m != null) { tot += m * r.n; any = true; } }
    if (any) out.push([d, tot, rows.length]);
  });
  return out;
}
function dkOwnedValue(A) {
  const owned = new Map(); OWN.items.forEach(i => owned.set(i.id, (owned.get(i.id) || 0) + i.qty));
  let have = 0, need = 0;
  for (const r of A.rows) { const h = Math.min(r.n, owned.get(r.p.id) || 0); have += h; need += r.n - h; }
  if (!A.rows.length) return 'no cards in it yet';
  return need ? `you own ${have} of ${have + need} cards \u00b7 ${money(A.rows.reduce((a, r) => a + Math.max(0, r.n - (owned.get(r.p.id) || 0)) * (r.p.market || 0), 0))} to complete` : 'you own every card in it';
}

function sparkOn(cv, series, kind = 'record') {
  const w = cv.clientWidth || 300, h = cv.height; cv.width = w * 2; cv.height = h * 2;
  const x = cv.getContext('2d'); x.scale(2, 2); x.clearRect(0, 0, w, h);
  const vals = series.map(s => s[1]); const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  const pt = (i, v) => [8 + (w - 16) * (i / Math.max(1, series.length - 1)), h - 8 - (h - 16) * ((v - lo) / span)];
  x.beginPath(); series.forEach((s, i) => { const [px, py] = pt(i, s[1]); i ? x.lineTo(px, py) : x.moveTo(px, py); });
  const acc = TOK('--brass', '#F2C14E');
  x.strokeStyle = acc; x.lineWidth = 2; x.lineJoin = 'round';
  if (kind === 'estimate') x.setLineDash([6, 5]);
  x.stroke(); x.setLineDash([]);
  const [lx, ly] = pt(series.length - 1, vals[vals.length - 1]);
  x.fillStyle = acc; x.beginPath(); x.arc(lx, ly, 3.5, 0, 7); x.fill();
}

const SCAN = { stream: null, running: false, voter: makeVoter(), busy: false, look: 0, gen: 0 };
async function startCamera() {
  if (SCAN.stream) return true;
  try {
    SCAN.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' },
               width: { ideal: 1920 }, height: { ideal: 1080 } } });
    const v = $('#cam'); v.srcObject = SCAN.stream; await v.play();
    $('#guide').classList.add('live');

    try {
      const tr = SCAN.stream.getVideoTracks()[0];
      const caps = tr.getCapabilities ? tr.getCapabilities() : {};
      $('#btnTorch').style.display = caps.torch ? '' : 'none';
      const adv = {};
      if (caps.focusMode && caps.focusMode.includes('continuous')) adv.focusMode = 'continuous';
      if (caps.exposureMode && caps.exposureMode.includes('continuous')) adv.exposureMode = 'continuous';
      if (Object.keys(adv).length) await tr.applyConstraints({ advanced: [adv] });

      ZOOM.native = caps.zoom && caps.zoom.max > caps.zoom.min ? { min: caps.zoom.min, max: caps.zoom.max } : null;
      ZOOM.seen = ZOOM.native ? `the camera\u2019s own, ${ZOOM.native.min}x to ${ZOOM.native.max}x` : 'none of its own: the picture is enlarged, to 4x';
    } catch (e) { ZOOM.native = null; }
    paintZoom();
    SCAN.running = true; if (PLATFORM.hasOcr()) scanLoop(++SCAN.gen);
    $('#camHint').textContent = PLATFORM.hasOcr()
      ? 'Point at the card. Hold steady.'
      : 'Preview only — the recogniser runs in the app, not the browser.';
    return true;
  } catch (e) {
    $('#camHint').textContent = 'Camera unavailable: ' + e.message;
    return false;
  }
}
function stopCamera() {
  SCAN.running = false;
  SCAN.paused = false; SCAN.holdUntil = 0; ZOOM.z = 1; ZOOM.native = null; ZOOM.pinch = null; paintPause(); paintZoom();
  const g = $('#guide'); if (g) g.classList.remove('live');
  if (SCAN.stream) { SCAN.stream.getTracks().forEach(t => t.stop()); SCAN.stream = null; }
}
async function scanLoop(gen) {
  const frame = () => new Promise(r => requestAnimationFrame(r));
  while (SCAN.running && gen === SCAN.gen) {
    const v = $('#cam');
    if (v.videoWidth && !$('#picker').classList.contains('on') && scanReady()) await captureAndIdentify(v);
    await frame();
  }
}

const ZOOM = { z: 1, native: null, pinch: null, seen: null, STEPS: [1, 1.5, 2, 3, 4, 6, 8],
  max() { return this.native ? Math.min(this.native.max, 8) : 4; }, min() { return this.native ? Math.max(this.native.min, 1) : 1; } };
const PINCH_HOLD = 700;
function scanReady(now = Date.now()) { return !SCAN.paused && now >= (SCAN.holdUntil || 0); }

function zoomView(v, z = ZOOM.z, native = !!ZOOM.native) {
  if (native || !(z > 1)) return v;
  const w = v.w / z, h = v.h / z;
  return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
}
async function setZoom(z) {
  z = Math.max(ZOOM.min(), Math.min(ZOOM.max(), Math.round(z * 10) / 10));
  ZOOM.z = z;
  const tr = SCAN.stream && SCAN.stream.getVideoTracks()[0];
  if (ZOOM.native && tr) { try { await tr.applyConstraints({ advanced: [{ zoom: z }] }); } catch (e) {} }
  paintZoom();
  return z;
}
function zoomStep(dir) {
  const S = ZOOM.STEPS.filter(s => s >= ZOOM.min() && s <= ZOOM.max());
  const next = dir > 0 ? S.find(s => s > ZOOM.z + 1e-9) : S.slice().reverse().find(s => s < ZOOM.z - 1e-9);
  return setZoom(next != null ? next : (dir > 0 ? ZOOM.max() : ZOOM.min()));
}
function paintZoom() {
  const v = $('#cam'); if (v) v.style.transform = !ZOOM.native && ZOOM.z > 1 ? `scale(${ZOOM.z})` : '';
  const l = $('#zoomLvl'); if (l) l.textContent = `${Math.round(ZOOM.z * 10) / 10}x`;
  const o = $('#zoomOut'), i = $('#zoomIn');
  if (o) o.disabled = ZOOM.z <= ZOOM.min() + 1e-9; if (i) i.disabled = ZOOM.z >= ZOOM.max() - 1e-9;
}
function paintPause() {
  const b = $('#scanPause'), g = $('#guide'), m = $('#camPaused'), on = !!SCAN.paused;
  if (b) { b.setAttribute('aria-pressed', String(on)); b.innerHTML = `${on ? G('play', 16) : G('pause', 16)}<span>${on ? 'Resume' : 'Pause'}</span>`;    }
  if (g) g.classList.toggle('paused', on); if (m) m.hidden = !on;
}
function setPaused(on) {
  SCAN.paused = !!on;
  if (!on) SCAN.voter = makeVoter();
  paintPause(); $('#camHint').textContent = on ? 'Paused \u2014 the camera stays open' : (PLATFORM.hasOcr() ? 'Point at the card. Hold steady.' : 'Preview only \u2014 the recogniser runs in the app, not the browser.');
  return SCAN.paused;
}

function pinchZoom(z0, d0, d) { return d0 > 0 ? z0 * d / d0 : z0; }
const PTRS = new Map();
function pinchMove(e) {
  if (!PTRS.has(e.pointerId)) return; PTRS.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (PTRS.size !== 2 || !ZOOM.pinch) return;
  const [a, b] = [...PTRS.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
  setZoom(pinchZoom(ZOOM.pinch.z0, ZOOM.pinch.d0, d));
}
function pinchEnd(e) {
  PTRS.delete(e.pointerId);
  if (PTRS.size < 2 && ZOOM.pinch) { ZOOM.pinch = null; SCAN.holdUntil = Date.now() + PINCH_HOLD; }
}
$('#guide').addEventListener('pointerdown', e => {
  if (e.target && e.target.closest && e.target.closest('button')) return;
  PTRS.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (PTRS.size === 2) { const [a, b] = [...PTRS.values()]; ZOOM.pinch = { z0: ZOOM.z, d0: Math.hypot(a.x - b.x, a.y - b.y) }; SCAN.holdUntil = Infinity; }
});
$('#guide').addEventListener('pointermove', pinchMove);
$('#guide').addEventListener('pointerup', pinchEnd);
$('#guide').addEventListener('pointercancel', pinchEnd);
$('#scanPause').addEventListener('click', () => setPaused(!SCAN.paused));
$('#zoomIn').addEventListener('click', () => zoomStep(1));
$('#zoomOut').addEventListener('click', () => zoomStep(-1));
const SCAN_HINT = { 'no-text': 'Point at the card.', 'no-read': 'Looking for the code\u2026',
                    several: 'One card at a time \u2014 more than one number in view' };
async function captureAndIdentify(v) {
  if (SCAN.busy) return;
  SCAN.busy = true;
  try {
    const gw = $('#guide'), r = { width: gw.clientWidth, height: gw.clientHeight }, look = LOOKS[SCAN.look];
    const res = await identifyFrame(v, zoomView(viewRect(v.videoWidth, v.videoHeight, r.width, r.height)), look);
    if (!SCAN.running) return;
    const number = res.stage === 'read' ? res.number : null;
    if (!number) SCAN.look = (SCAN.look + 1) % LOOKS.length;
    $('#guide').classList.toggle('seen', !!number);
    drawCard(res, r);
    const voted = SCAN.voter.push(number);
    if (!number) { $('#camHint').textContent = SCAN_HINT[res.stage] || ''; return; }
    $('#camHint').textContent = voted || SCAN.voter.held === number ? '' : `Saw ${number} \u2014 hold still\u2026`;
    if (!voted) return;
    const rs = resolve(voted, { setId: BATCH.setId, face: res.face });
    const photo = await PLATFORM.savePhoto(res.full.toDataURL('image/jpeg', 0.7), voted);
    if (rs.verdict === 'ask') openPicker(voted, rs, photo);
    else if (rs.verdict === 'auto') { flashHit(); accept(rs.pick, rs.why, photo); }
    else $('#camHint').textContent = `${voted} is not in the catalogue`;
  } finally { SCAN.busy = false; }
}

function drawCard(res, r) {
  const ov = $('#camOv'); ov.width = r.width; ov.height = r.height;
  const g = ov.getContext('2d'); g.clearRect(0, 0, ov.width, ov.height);
  const q = res.card; if (!q) return;
  g.strokeStyle = '#f5c518'; g.lineWidth = 2.5;
  g.strokeRect(q.x * r.width, q.y * r.height, q.w * r.width, q.h * r.height);
}
function flashHit() {
  const g = $('#guide'); g.classList.remove('seen'); g.classList.add('hit');
  setTimeout(() => g.classList.remove('hit'), 500);
}

function sampleScans() { return !PLATFORM.cap() && !PLATFORM.hasOcr(); }
$('#btnTorch').addEventListener('click', async () => {
  if (!SCAN.stream) return;
  const tr = SCAN.stream.getVideoTracks()[0];
  const on = !(tr.getSettings && tr.getSettings().torch);
  try { await tr.applyConstraints({ advanced: [{ torch: on }] }); $('#btnTorch').style.color = on ? 'var(--gold)' : ''; }
  catch (e) { toast('Torch not available'); }
});
CLICKS.on('#earnBtn', e => {
  if (e.target.id !== 'earnBtn') return;
  ADS.show('scan');
});
$('#btnSample').addEventListener('click', () => { if (sampleScans()) simulateScan(); });
$('#btnGallery').addEventListener('click', async () => {
  const path = await PLATFORM.pickImage();
  if (!path) return toast(PLATFORM.cap() ? 'No image chosen' : 'Gallery import runs in the app');
  const img = new Image();
  img.onload = async () => {

    const view = { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    let res = null;
    for (const look of LOOKS) { res = await identifyFrame(img, view, look); if (res.stage === 'read' || res.stage === 'several') break; }
    if (res.stage === 'several') return toast('More than one card number in that photo \u2014 crop it to one card');
    if (res.stage !== 'read') return toast('Could not read a card number from that photo');
    const r = resolve(res.number, { setId: BATCH.setId, face: res.face });
    const photo = await PLATFORM.savePhoto(res.full.toDataURL('image/jpeg', 0.7), res.number);
    if (r.verdict === 'ask') openPicker(res.number, r, photo);
    else if (r.verdict === 'auto') accept(r.pick, r.why, photo);
  };
  img.src = path;
});

function simulateScan() {
  const withNum = CAT.rows.filter(p => p.num);
  const seed = withNum[Math.floor(Math.random() * withNum.length)];
  const g = $('#guide');
  g.classList.add('seen');
  setTimeout(() => {
    const r = resolve(seed.num, { setId: BATCH.setId, face: seed.face === 'plain' ? null : seed.face });
    if (r.verdict === 'ask') { g.classList.remove('seen'); openPicker(seed.num, r); }
    else { flashHit(); accept(r.pick, r.why); }
  }, 260);
}

const SCAN_INTO = { mode: readText('vault.scanInto') === 'watch' ? 'watch' : 'collect',
  set(m) { this.mode = m === 'watch' ? 'watch' : 'collect'; saveJson('vault.scanInto', this.mode); paintScanInto(); return this.mode; } };

function paintScanCredits() {
  const c = $('#scanCredits'); if (!c) return;
  if (SCAN_INTO.mode === 'watch') { c.innerHTML = 'Into the Watchlist: a scan adds the card there and uses no save credit.'; return; }
  if (CREDITS.enabled()) {
    const st = CREDITS.state;
    c.innerHTML = `Scanning is unlimited. <b>${st.scan}</b> save credit${st.scan === 1 ? '' : 's'}` +
      (st.pending.length ? ` · <b>${st.pending.length}</b> waiting` : '') +
      ` · <button class="ghost" id="earnBtn" style="padding:4px 10px;font-size:var(--fs-cap)">+${CREDITS.PER_AD} for a short ad</button>`;

  } else c.innerHTML = `Ads run only in the app, so saving is free in this browser preview. In the app, each card saved uses one save credit: ${CREDITS.FREE_ON_INSTALL} to start, ${CREDITS.PER_AD} more per short ad.`;
}
function paintScanInto() {
  const b = $('#scanInto'); if (!b) return; const w = SCAN_INTO.mode === 'watch';
  b.textContent = w ? 'Into: Watchlist' : 'Into: Collection'; b.setAttribute('aria-pressed', String(w));
  paintScanCredits();
}
$('#scanInto').addEventListener('click', () => { SCAN_INTO.set(SCAN_INTO.mode === 'watch' ? 'collect' : 'watch'); toast(SCAN_INTO.mode === 'watch' ? 'Scans go to your watchlist' : 'Scans go to the batch, for your collection'); });
function accept(p, why, photo) {
  if (SCAN_INTO.mode === 'watch') {
    const had = WANT.hasId(p.id); WANT.add(p.num, p.id); PLATFORM.haptic();
    $('#lastScan').innerHTML = `<b>${esc(p.name)}${p.treat !== 'base' ? ' \u00b7 ' + esc(TREAT[p.treat]) : ''}</b><span>${dotJoin(esc(p.num), money(p.market), had ? 'already on your watchlist' : 'on your watchlist')}</span>`;
    return;
  }
  BATCH.rows.push({ id: p.id, photo: photo || null });
  BATCH.save();
  PLATFORM.haptic();
  $('#lastScan').innerHTML =
    `<b>${esc(p.name)}${p.treat !== 'base' ? ' \u00b7 ' + esc(TREAT[p.treat]) : ''}</b>` +
    `<span>${dotJoin(esc(p.num), money(p.market), why ? esc(why) : '')}</span>`;
  paintScan();
}

let _pickerPhoto = null;
function openPicker(number, r, photo) {
  _pickerPhoto = photo || null;
  $('#pkTitle').textContent = `Which ${number}?`;
  $('#pkWhy').innerHTML = r.why;
  $('#pkOpts').innerHTML = r.candidates.map((p, i) => {
    const s = CAT.sets.get(p.set) || {};
    const bits = [TREAT[p.treat] || p.treat];
    const faceHint = p.face === 'sp' ? 'SP badge on the card'
                   : p.face === 'star' ? 'star on the card' : '';
    if (p.prov) bits.push(p.prov);
    if (p.award) bits.push(p.award);
    return `<button class="opt${i === 0 ? ' best' : ''}" data-pick="${p.id}">
      <div class="oa"><div class="ph" style="font-size:var(--fs-cap);color:var(--dim2)">${esc(TREAT[p.treat] === 'Base' ? '' : (TREAT[p.treat] || ''))}<br>${esc((s.abbr || '').slice(0, 8))}</div>${refArt(p)}</div>
      <div class="oi"><b>${esc(bits.join(' \u00b7 '))}</b>
        <span>${esc(s.abbr || s.name || '')}${faceHint ? ' \u00b7 ' + faceHint : ''}${p.sameart
          ? ' \u00b7 <span style="color:var(--gold)">looks identical to another option</span>'
          : ''}</span></div>
      <div class="op mono">${money(p.market)}<span>${esc(p.sub || 'Normal')}</span></div>
    </button>`;
  }).join('');
  $('#picker').classList.add('on');
}
$('#pkCancel').addEventListener('click', () => PICKER.dismiss());
CLICKS.on('[data-pick]', e => {
  const b = e.target.closest('[data-pick]'); if (!b) return;
  $('#picker').classList.remove('on');
  accept(CAT.byId.get(+b.dataset.pick), 'you picked it', _pickerPhoto);
});

const CONDS = ['NM', 'LP', 'MP', 'HP', 'DMG'];
const COND_NAMES = { NM: 'Near Mint', LP: 'Lightly Played', MP: 'Moderately Played', HP: 'Heavily Played', DMG: 'Damaged' };
let dCur = null, dQty = 1, dCond = 'NM';

const dLine = () => dCur && OWN.line(dCur.id, dCond);

function paintDetailDist(p) {
  const el = $('#dDist'), goods = SEALED.isGoods(p);

  const list = ((goods && HUNT.distByCatalogId()[p.id]) || []).concat(goods ? HUNT.goneFor(p.id) : []);
  el.hidden = !list.length; if (!list.length) { el.innerHTML = ''; return; }
  const tls = list.map(distTl);

  const ks = [...new Set(list.map(it => it._d))], dead = ks.map(k => HUNT.dist(k)).filter(D => HUNT.unreached(D));
  const since = dead.length && dead.every(D => D.stale_since) ? dead.map(D => D.stale_since).sort()[0] : '';
  const summary = esc(ks.map(k => HUNT.distName(k)).join(', ')) + (dead.length ? ` \u00b7 ${dead.length} not reached${since ? ' since ' + esc(nbsp(momentText(since))) : ''}` : '');
  const when = it => { const D = HUNT.dist(it._d) || {};
    return HUNT.unreached(D) ? `could not reach it${D.stale_since ? ' since ' + esc(nbsp(momentText(D.stale_since))) : ''}; its last check, ${esc(HUNT.ageLabel(D.fetched_at))}, is shown` : esc(HUNT.ageLabel(D.fetched_at)); };
  el.innerHTML = distFold('detail', summary,
    list.map((it, i) => it._gone ? `<div class="dsec"><div class="row" style="align-items:center;gap:10px;padding:0"><div class="nm" style="min-width:0"><b>${esc(HUNT.distName(it._d))}</b><span>no longer on its list \u00b7 last listed ${esc(nbsp(dayText(localDay(it.seen))))}</span></div></div>${distHistory(it, tls[i])}</div>`
      : `<div class="dsec"><div class="row" style="align-items:center;gap:10px;padding:0"><div class="nm" style="min-width:0"><b>${esc(HUNT.distName(it._d))}</b><span>${distWords(it).join(' \u00b7 ')} \u00b7 ${when(it)}</span></div>${it.url ? `<a class="ghost" href="${esc(it.url)}" target="_blank" rel="noopener" style="flex:0 0 auto;padding:8px 12px" aria-label="Open ${esc(HUNT.distName(it._d))}'s page for ${esc(p.name)}">Open ${ext()}</a>` : ''}</div>${distHistory(it, tls[i])}</div>`).join('')
    + '<div class="note" style="margin-top:10px">What the distributor tells shops. It sells to stores, not to you.</div>'
    + (list.some((it, i) => tlNeedsNote(it, tls[i])) ? `<div class="note" style="margin-top:6px">${esc(TL_NOTE)}</div>` : ''));
}
function scrollToPanel(el) {
  if (!el || !el.getBoundingClientRect) return;

  const bar = document.querySelector('.modebar'), under = bar && bar.getBoundingClientRect ? bar.getBoundingClientRect().height : 0;
  window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + (window.scrollY || 0) - under - 12));
}
function openDetail(id, { dist = false } = {}) {
  const p = CAT.byId.get(id); if (!p) return;
  if (dist) DISTF.open.add('detail'); else DISTF.open.delete('detail');
  DISTF.hist.clear();
  dCur = p; const own = OWN.line(id);
  $('#dTarget').textContent = PF.name(OWN.target());
  dQty = own ? own.qty : 1; dCond = own ? own.condition : 'NM';
  const s = CAT.sets.get(p.set) || {};

  const sealedP = SEALED.isGoods(p);
  $('#dName').innerHTML = esc(p.name) + (p.treat !== 'base'
    ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : '');

  const sub = sealedP ? (s.name && s.name !== p.name ? s.name : '') : [s.name, p.rarity, p.num, p.prov].filter(Boolean).join(' \u00b7 ');
  $('#dSub').textContent = sub; $('#dSub').hidden = !sub;
  $('#dFinish').textContent = sealedP ? sealedWord(p) : (p.sub || 'Normal');
  $('#dQtyH').textContent = sealedP ? 'Sealed' : 'Ungraded';
  paintWant(WANT.hasId(p.id));
  const setCode = (s.abbr || '').replace(/-/g, '').slice(0, 5);
  $('#dArt').innerHTML = (sealedP ? `<div class="ph" style="font-family:var(--display);font-size:var(--fs-head)">${setCode ? `<span class="phl">${esc(setCode)}</span>` : ''}</div>` : `<div class="ph" style="font-size:var(--fs-cap)">${esc(p.num)}</div>`) + refArt(p, { size: 'large' });
  paintBack($('#dBack'), p);
  $('#dArt').classList.toggle('product', sealedP);

  const hasCost = p.cost != null && p.cost !== '';
  const cells = p.type && (hasCost || p.power || p.life) ? [
    ['Type', esc(p.type), 'word'],
    p.type === 'Leader' ? ['Life', p.life ? esc(p.life) : '\u2014', ''] : ['Cost', hasCost ? esc(p.cost) : '\u2014', ''],
    ['Power', p.power ? Number(p.power).toLocaleString() : '\u2014', '']] : [];
  $('#dStats').innerHTML = cells.length ? `<div class="statbar">${cells.map(([k, v, c]) => `<div><span>${k}</span><b${c ? ` class="${c}"` : ''}>${v}</b></div>`).join('')}</div>` : '';

  const tri = p.d1a > 0.004 ? '<i class="up" style="font-style:normal">\u25b2</i> '
            : p.d1a < -0.004 ? '<i class="down" style="font-style:normal">\u25bc</i> ' : '';
  $('#dPrice').innerHTML = `${tri}${money(p.market)}<span>${deltaHtml(p, { tile: true })}</span>`;
  $('#dQty').textContent = dQty;

  $('#dCond').innerHTML = sealedP ? 'No condition to record' : 'Condition · <span class="nw">' + esc(COND_NAMES[dCond] || dCond) + '</span>';
  $('#dCondSeg').hidden = sealedP;
  $('#dCondSeg').innerHTML = sealedP ? '' : CONDS.map(c =>
    `<button class="${c === dCond ? 'on' : ''}" data-cond="${c}" aria-pressed="${c === dCond}">${c}</button>`).join('');

  $('#dStock').hidden = !sealedP;

  $('#dWant').hidden = !p.num; $('#dGradedP').hidden = sealedP;
  paintStockWatch(STOCK.has(id));

  $('#dBuy').hidden = !sealedP;
  $('#dBuyList').innerHTML = sealedP ? buySources(p).map(s => `<div class="row" style="align-items:center"><div class="nm" style="min-width:0"><b>${G(BUY_GLYPH[s.kind], 14)} ${esc(s.label)}</b><span>${esc(s.note)}${s.addr ? ' · ' + esc(s.addr) : ''}${s.mi != null ? ' · ~' + s.mi + ' mi' : ''}</span></div>
      <div class="v" style="flex:0 0 auto;display:flex;gap:6px"><a class="ghost" href="${esc(s.url)}" target="_blank" rel="noopener" style="padding:8px 12px" aria-label="${esc(s.label)}: open the seller\u2019s page for ${esc(p.name)}">Open ${ext()}</a>${s.phone ? `<a class="ghost" href="tel:${esc(s.phone)}" style="padding:8px 12px">Call</a>` : ''}</div></div>`).join('') : '';

  const graded = PF.scope(OWN.items).filter(i => i.id === id && i.graded);

  $('#dGradedList').innerHTML = graded.length ? graded.map((i, k) =>
    `<div class="row" style="align-items:center"><div class="nm"><b>${esc(i.graded.grader)} ${esc(i.graded.grade)}</b>
      <span>${i.graded.cert ? 'Cert ' + esc(i.graded.cert) : 'no cert recorded'}</span></div>
     <div class="v mono">${money(p.market)}<span class="flat">ungraded price</span></div>
     ${EBAY.on() ? `<button class="ghost" data-gradebay="${k}" style="flex:0 0 auto;min-height:44px;padding:0 12px" aria-label="eBay listings of ${esc(i.graded.grader)} ${esc(i.graded.grade)} copies">eBay</button>` : ''}
     ${i.graded.cert && CERTS[i.graded.grader] ? `<button class="ghost" data-gradcert="${k}" style="flex:0 0 auto;min-height:44px;padding:0 12px" aria-label="Check this ${esc(i.graded.grader)} slab’s cert">Cert</button>` : ''}
     <button class="ghost" data-gradrm="${k}" style="flex:0 0 auto;min-height:44px;padding:0 12px;color:var(--down)" aria-label="Remove this ${esc(i.graded.grader)} ${esc(i.graded.grade)} copy">Remove</button></div>`
  ).join('') : '<div class="note" style="margin:0">No graded copies recorded.</div>';
  paintLookup(p);
  paintEbay(p);

  const owned = dLine();
  paintPaid(owned);
  $('#dSave').textContent = owned ? 'Save' : 'Add to collection';
  paintRemove(owned); paintQty();

  if (p.low && p.high && p.high > p.low) {
    const pos = ((p.market - p.low) / (p.high - p.low)) * 100;
    $('#dSpread').innerHTML =
      `<span class="mono">${money(p.low)}</span>
       <span class="spreadbar"><i style="left:${Math.max(0, Math.min(99, pos))}%"></i></span>
       <span class="mono">${money(p.high)}</span>`;
  } else $('#dSpread').innerHTML = '';

  $('#dProv').innerHTML =
    `${p.market != null ? `${money(p.market)} \u00b7 market` : 'No market price yet'} \u00b7 TCGplayer via TCGCSV \u00b7 as of ` +
    `<span style="white-space:nowrap">${esc(dayText(CAT.man.source_updated_at))}</span>.<br>` +
    `${p.low != null || p.high != null ? `Low ${money(p.low)} \u2013 high ${money(p.high)} that day. ` : ''}Market is an estimate, not a sale.` +
    (p.d7p != null || p.d30p != null
      ? `<br>${p.d7p != null ? `7d ${signedPct(p.d7p, true)}` : ''}` +
        `${p.d7p != null && p.d30p != null ? ' \u00b7 ' : ''}` +
        `${p.d30p != null ? `30d ${signedPct(p.d30p, true)}` : ''}`
      : `<br>7-day and 30-day moves appear once ${
          (CAT.man.history_days || []).length} day${(CAT.man.history_days || []).length === 1 ? '' : 's'} ` +
        `of history becomes seven.`);

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
  if (dist) scrollToPanel($('#dDist'));
}

function setCond(c) {
  if (!dCur || !CONDS.includes(c)) return false;
  dCond = c;
  const owned = dLine();
  dQty = owned ? owned.qty : 1; $('#dQty').textContent = dQty;
  $('#dSave').textContent = owned ? 'Save' : 'Add to collection';
  paintRemove(owned);
  $('#dCond').innerHTML = 'Condition · <span class="nw">' + esc(COND_NAMES[dCond] || dCond) + '</span>';
  $('#dCondSeg').innerHTML = CONDS.map(k => `<button class="${k === dCond ? 'on' : ''}" data-cond="${k}" aria-pressed="${k === dCond}">${k}</button>`).join('');
  paintPaid(owned); paintQty();
  return true;
}
CLICKS.on('[data-cond]', e => {
  const c = e.target.closest('[data-cond]'); if (!c) return;
  setCond(c.dataset.cond);
});

function paintQty() {
  $('#dQty').textContent = dQty;
  const z = $('#dZero'); if (!z) return;
  const owned = dQty === 0 && dLine();
  z.hidden = !owned;
  if (owned) $('#dZeroPf').textContent = PF.name(owned.pf || 'main');
}
function stepQty(d) { dQty = Math.max(dLine() ? 0 : 1, dQty + d); paintQty(); return dQty; }
$('#dPlus').addEventListener('click', () => stepQty(1));
$('#dMinus').addEventListener('click', () => stepQty(-1));

function paintWant(on) { const b = $('#dWant'); b.textContent = on ? 'On Watchlist' : 'Add to Watchlist'; b.setAttribute('aria-pressed', String(!!on)); }
function paintStockWatch(on) { const b = $('#dStock'); b.textContent = on ? 'Watching stock' : 'Stock alert'; b.setAttribute('aria-pressed', String(!!on)); }
function paintPaid(owned) { $('#dPaid').textContent = owned && owned.paid ? `Paid ${money(owned.paid)}` : 'What you paid'; }
function saveHere() {
  if (!dCur) return false;
  const ex = dLine();
  if (ex && dQty === 0) return removeHere();
  if (ex) ex.qty = dQty; else OWN.add(dCur.id, { qty: dQty, condition: dCond });
  commitOwn('detail'); toast('Saved'); go('collection'); return true;
}
$('#dSave').addEventListener('click', saveHere);

function paintRemove(owned = dLine()) {
  const b = $('#dRemove'); if (!b) return;
  b.hidden = !owned;
  b.textContent = owned ? `Remove from ${PF.name(owned.pf || 'main')}` : 'Remove from collection';
}
function removeHere() {
  const it = dLine(); if (!dCur || !it) return false;
  const where = PF.name(it.pf || 'main'), what = SEALED.isGoods(dCur) ? '' : (COND_NAMES[it.condition] || it.condition) + ', ';
  if (!confirm(`Remove ${dCur.name}${dCur.num ? ' (' + dCur.num + ')' : ''}, ${what}\u00d7${it.qty}, from ${where}?\n\n` +
               'This cannot be undone. Export first if you are not sure.')) return false;
  OWN.items = OWN.items.filter(x => x !== it);
  commitOwn('detail'); toast(`Removed from ${where}`); go('collection');
  return true;
}
$('#dRemove').addEventListener('click', removeHere);
function removeGraded(k) {
  if (!dCur) return false;
  const g = PF.scope(OWN.items).filter(i => i.id === dCur.id && i.graded)[k]; if (!g) return false;
  if (!confirm(`Remove the ${g.graded.grader} ${g.graded.grade}${g.graded.cert ? ' (cert ' + g.graded.cert + ')' : ''} copy of ${dCur.name}?\n\n` +
               'This cannot be undone. Export first if you are not sure.')) return false;
  OWN.items = OWN.items.filter(x => x !== g);
  commitOwn('graded'); toast('Graded copy removed'); openDetail(dCur.id);
  return true;
}
$('#dGradedList').addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-gradrm]'); if (b) return removeGraded(+b.dataset.gradrm);

  const y = e.target.closest && e.target.closest('[data-gradebay]');
  if (y && dCur) { const g = PF.scope(OWN.items).filter(i => i.id === dCur.id && i.graded)[+y.dataset.gradebay]; if (g && !ebayGrade(g.graded.grader, g.graded.grade)) toast('eBay\u2019s grades here: PSA, BGS, CGC, TAG and SGC'); return; }

  const c = e.target.closest && e.target.closest('[data-gradcert]'); if (!c || !dCur) return;
  const g = PF.scope(OWN.items).filter(i => i.id === dCur.id && i.graded)[+c.dataset.gradcert]; if (g) certCheck(g.graded.grader, g.graded.cert);
});

function lookupLinks(p) {
  const q = p.num ? `${p.num} ${p.name}` : `One Piece ${p.name}`;
  const ebay = 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(q);

  const pc = 'https://www.pricecharting.com/search-products?type=prices&q=' + encodeURIComponent(q);
  return (SEALED.isGoods(p) ? [] : [{ key: 'tcgplayer', label: 'TCGplayer', url: 'https://www.tcgplayer.com/product/' + p.id, aria: `Open ${p.name} on TCGplayer` }])
    .concat([{ key: 'pricecharting', label: 'PriceCharting', url: pc, aria: `Search PriceCharting for ${q}` },
             { key: 'ebay', label: 'eBay', url: ebay, aria: `Search eBay for ${q}` },
             { key: 'ebaysold', label: 'eBay sold', url: ebay + '&LH_Sold=1&LH_Complete=1', aria: `Search eBay\u2019s sold listings for ${q}` }]);
}
function paintLookup(p) {
  const el = $('#dLookList'); if (!el) return;
  el.innerHTML = lookupLinks(p).map(l => `<a class="ghost" href="${esc(l.url)}" target="_blank" rel="noopener" data-look="${l.key}" aria-label="${esc(l.aria)}">${esc(l.label)} ${ext(12)}</a>`).join('');
}
$('#dAlert').addEventListener('click', async () => {
  if (!dCur) return;
  const dir = await PICKER.choose({ title: 'Alert when the price\u2026', key: 'aldir',
    why: `${esc(dCur.name)} is ${money(dCur.market)} today. Checked nightly with new prices; one notification, then it rests until you set it again.`,
    opts: `<button class="opt" data-aldir="below"><div class="oi"><b>Drops below</b><span>a buying price</span></div></button>
      <button class="opt" data-aldir="above"><div class="oi"><b>Rises above</b><span>a selling price</span></div></button>` });
  if (!dir) return;

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
  paintStockWatch(on);
});
$('#dWant').addEventListener('click', () => {
  if (!dCur) return; const on = WANT.toggle(dCur.num, dCur.id);
  paintWant(on);
  toast(on ? `On your watchlist: ${dCur.name}` : `Off your watchlist: ${dCur.name}`);
});
$('#dPaid').addEventListener('click', async () => {
  if (!dCur) return;
  const it = dLine();

  const how = await PICKER.choose({ title: 'What you paid', key: 'paidhow',
    why: 'Bought it for an amount, or traded for it: a trade is recorded on Trade, with what you gave and any money, and sets this.',
    opts: `<button class="opt" data-paidhow="bought"><div class="oi"><b>Bought it</b><span>${it && it.paid ? `Paid ${money(it.paid)} a copy` : 'An amount per copy'}</span></div></button>` +
          `<button class="opt" data-paidhow="traded"><div class="oi"><b>Traded for it</b><span>The cards you gave, plus or minus money</span></div></button>` });
  if (how === 'traded') { tradeFor(dCur, it); return; }
  if (how !== 'bought') return;

  const c = CUR.active();
  const v = await ask({ title: 'What you paid', kind: 'number', ok: 'Save', placeholder: '0.00',
    why: `Per copy, ${c === 'USD' ? 'in USD' : `in ${esc(curLabel(c))}, converted (\u2248); it is kept in US dollars`}. Only you know this; it drives the Performance tab and nothing else.`,
    value: it && it.paid ? toShown(it.paid) : '' });
  if (v === null) return;
  const x = typedAmount(v);
  if (!(x >= 0)) return toast('Not a number');
  const n = x > 0 ? fromShown(x) : 0;
  if (it) { it.paid = n; commitOwn('detail', { snap: false }); }
  else { OWN.add(dCur.id, { qty: dQty, condition: dCond }).paid = n; commitOwn('detail'); }
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

const EBAY = {
  TERMS: 'optcghub.ebay.terms', TERMS_V: 2, KEEP: 30 * 60e3, STALE: 6 * 3600e3, WAIT: 20e3,
  memo: new Map(), flying: new Map(), tab: 'now', sort: 'ends', grade: null, pid: null, last: null, timer: null, r: null, open: false, until: null,
  on() { return ONLINE.ready() && !!CAT.man.updateUrl; },
  termsUrl() { const b = CAT.man.updateUrl; return b ? b.replace(/bundle\/?$/, '') + 'terms.html' : ''; },

  terms() { try { const t = JSON.parse(localStorage.getItem(this.TERMS) || 'null'); return t && t.v === this.TERMS_V ? t.a : null; } catch (e) { return null; } },
  setTerms(a) { try { localStorage.setItem(this.TERMS, JSON.stringify({ v: this.TERMS_V, a, at: new Date().toISOString() })); } catch (e) {} },
  url(num, grade, buying, bg) { const e = encodeURIComponent; return ONLINE.url(`/ebay/listings?kind=card&num=${e(num)}${grade ? '&grade=' + e(grade) : ''}${buying ? '&buying=' + e(buying) : ''}${bg ? '&bg=1' : ''}`); },

  ask(num, grade, buying, fresh, bg) {
    const k = [num, grade || '', buying || ''].join('|'), m = this.memo.get(k);
    if (!fresh && m && Date.now() - m.at < this.KEEP) return Promise.resolve(m.r);

    const fly = this.flying.get(k); if (fly) return fly.bg && !bg ? fly.then(r => (r && r.ok ? r : this.ask(num, grade, buying, fresh, false))) : fly;
    const p = this.fetch1(k, num, grade, buying, bg).finally(() => this.flying.delete(k));
    p.bg = !!bg; this.flying.set(k, p); return p;
  },
  async fetch1(k, num, grade, buying, bg) {
    let r;
    try {
      const res = await fetch(this.url(num, grade, buying, bg), { ebay: true, wait: this.WAIT });
      let body = null; try { body = await res.json(); } catch (e) { body = null; }
      r = res.ok && body && Array.isArray(body.items) ? { ok: true, data: body } : { ok: false, why: (body && typeof body.error === 'string' && body.error) || `the server answered ${res.status}` };
    } catch (e) { r = { ok: false, why: e && e.name === 'TimeoutError' ? `no answer in ${Math.round(this.WAIT / 1000)} s` : 'the server could not be reached' }; }
    this.last = { num, grade: grade || null, buying: buying || null, bg: !!bg, at: new Date().toISOString(), ok: r.ok, n: r.ok ? r.data.items.length : 0, why: r.why || '' };
    if (r.ok) this.memo.set(k, { at: Date.now(), r });
    return r;
  }
};

const EB_FAMILY = { alternate_art: 'parallel' };
const EB_PROMO = /\b(promo|pre-?release|stamp(ed)?|judge|winner|championship|tournament|anniversary|regional|finalist|participation|celebration|trophy|serial)\b/i;
const ebWords = list => new Set((Array.isArray(list) ? list : []).map(w => EB_FAMILY[w] || w));
function ebOwn(q) {
  const w = new Set();
  if (q.treat && q.treat !== 'base') w.add(EB_FAMILY[q.treat] || q.treat);
  if (/manga/i.test(q.prov || '')) w.add('manga');
  if (EB_PROMO.test(q.prov || '')) w.add('promo');
  return w;
}

function ebAttrib(p, items) {
  const seen = new Set(), all = [];
  for (const q of [p, ...candidates(p.num, null)]) if (q && q.num === p.num && !seen.has(q.id)) { seen.add(q.id); all.push(q); }
  const own = new Map(all.map(q => [q.id, ebOwn(q)])), anyWords = all.some(q => own.get(q.id).size);
  const plain = anyWords ? all.filter(q => !own.get(q.id).size) : [];
  const out = { mine: [], close: [], group: [], unsure: [], other: 0, all };
  for (const it of items) {
    if (all.length === 1) { out.mine.push(it); continue; }
    const W = ebWords(it.words);
    const fits = W.size ? all.filter(q => [...W].every(w => own.get(q.id).has(w))) : (anyWords ? [] : all);

    if (!W.size && plain.length) {
      if (!plain.some(q => q.id === p.id)) out.unsure.push(it);
      else if (plain.length === 1) out.close.push(it);
      else out.group.push(Object.assign({}, it, { _fits: plain }));
      continue;
    }
    if (!fits.length) { out.unsure.push(it); continue; }
    if (!fits.some(q => q.id === p.id)) { out.other++; continue; }
    if (fits.length === 1) out.mine.push(it); else out.group.push(Object.assign({}, it, { _fits: fits }));
  }
  return out;
}

const ebNum = v => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ebMoney = m => { const v = m && Number(m.value); if (!m || !isFinite(v)) return ''; return m.currency === 'USD' ? '$' + ebNum(v) : ebNum(v) + ' ' + esc(m.currency); };
const ebShipCost = s => s && typeof s === 'object' && isFinite(Number(s.value)) ? Number(s.value) : null;
const ebShip = s => s === 'calculated' ? 'shipping worked out at checkout' : ebShipCost(s) === 0 ? 'free shipping' : ebShipCost(s) != null ? '+ ' + ebMoney(s) + ' shipping' : 'shipping not stated';

function ebTotal(amount, ship) {
  const c = ebShipCost(ship), v = amount && Number(amount.value);
  if (!c || !isFinite(v) || (ship.currency && amount.currency && ship.currency !== amount.currency)) return '';
  return ' = ' + ebMoney({ value: v + c, currency: amount.currency });
}
function ebEnds(iso, now = Date.now()) {
  const ms = Date.parse(iso || '') - now; if (!isFinite(ms)) return '';
  if (ms <= 0) return 'ended';
  const m = Math.max(1, Math.round(ms / 60e3)); if (m < 60) return `ends in ${m} min`;

  const h = Math.floor(m / 60); if (h < 48) return `ends in ${h} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}`;
  return `ends in ${Math.floor(h / 24)} d${h % 24 ? ' ' + (h % 24) + ' h' : ''}`;
}
function ebAgo(iso, now = Date.now()) { const m = Math.round((now - Date.parse(iso || '')) / 60e3); if (!isFinite(m)) return 'at an unknown time'; if (m < 2) return 'just now'; if (m < 60) return `${m} min ago`; return `${Math.round(m / 60)} h ago`; }
function ebRow(it, tab = EBAY.tab, tag = '', now = Date.now()) {
  const ends = `<span data-ebends="${esc(it.endsAt || '')}">${esc(ebEnds(it.endsAt, now))}</span>`, bids = `${it.bids || 0} bid${it.bids === 1 ? '' : 's'}`;
  const byBid = it.buying === 'AUCTION' || (it.buying === 'AUCTION_BIN' && tab === 'auction');
  const head = byBid ? `${ebMoney(it.bid)} <span>${it.bids ? 'current bid' : 'starting bid'}</span>` : ebMoney(it.price);
  const kind = byBid
    ? `Auction · ${bids} · ${ends}${it.buying === 'AUCTION_BIN' && it.price ? ` · or Buy it now ${ebMoney(it.price)}` : ''}`
    : it.buying === 'AUCTION_BIN' ? `Buy it now · or bid ${ebMoney(it.bid)} (${bids}, ${ends})` : 'Buy it now';
  return `<div class="ebrow"><div class="ebt">${tag ? `<span class="ebtag">${esc(tag)}</span>` : ''}<b class="mono">${head}</b><span class="ebship">${esc(ebShip(it.shipping))}${ebTotal(byBid ? it.bid : it.price, it.shipping)}</span><span class="ebk">${kind} · ${it.grade ? esc(it.grade) : 'Raw'}</span><span class="ebti">${esc(it.title)}</span></div>`
    + `<a class="ghost" href="${esc(it.url)}" target="_blank" rel="noopener" aria-label="View this listing on eBay: ${esc(it.title)}">View on eBay ${ext(12)}</a></div>`;
}
const EB_LEFT = { notEnglish: 'not English', noNumber: 'without this number', variations: 'pick-your-card listings', lot: 'lots and bundles', other: 'other printings of this number',
  otherGrade: 'another grade', gradeUnsure: 'no readable grade', ended: 'ended', shape: 'incomplete', notSealed: 'opened' };
function ebPrintingName(q) { const s = CAT.sets.get(q.set) || {}; return `${TREAT[q.treat] || q.treat || 'Base'}${q.prov ? ' · ' + q.prov : ''}${s.abbr ? ' (' + s.abbr + ')' : ''}`; }
function ebSorted(list, v = EBAY) {
  if (v.tab === 'now') return list.slice().sort((a, b) => ((Number(a.price && a.price.value) || 1e9) + (ebShipCost(a.shipping) ?? 1e6)) - ((Number(b.price && b.price.value) || 1e9) + (ebShipCost(b.shipping) ?? 1e6)));
  if (v.sort === 'bid') return list.slice().sort((a, b) => (Number(a.bid && a.bid.value) || 1e9) - (Number(b.bid && b.bid.value) || 1e9));
  return list.slice().sort((a, b) => (Date.parse(a.endsAt || '') || 9e15) - (Date.parse(b.endsAt || '') || 9e15));
}

function ebayBodyHtml(p, r, now = Date.now(), v = EBAY) {
  if (!r || !r.ok) return `<div class="note" style="margin:0">eBay’s answer: ${esc((r && r.why) || 'nothing came back')}.</div>`;
  const d = r.data, age = now - Date.parse(d.fetchedAt || '');
  if (!(age < EBAY.STALE)) return '<div class="note" style="margin:0 0 8px">The last answer is over six hours old.</div><button class="ghost mone" data-ebay="again">Check again</button>';

  let items = (d.items || []).filter(it => it && /^https:\/\/www\.ebay\.com\//.test(String(it.url || '')) && !(it.endsAt && Date.parse(it.endsAt) <= now));
  items = v.tab === 'now' ? items.filter(it => it.buying !== 'AUCTION') : items.filter(it => it.buying !== 'FIXED_PRICE');
  const A = ebAttrib(p, items);
  const buyNow = A.mine.filter(it => it.price && ebShipCost(it.shipping) != null);
  const low = buyNow.length ? buyNow.map(it => Number(it.price.value) + ebShipCost(it.shipping)).sort((a, b) => a - b)[0] : null;
  const left = Object.entries(Object.assign({}, d.left, A.other ? { other: A.other } : {})).filter(([, n]) => n > 0).map(([k, n]) => `${EB_LEFT[k] || k} ${n}`);
  const shown = A.mine.length + A.close.length + A.group.length + A.unsure.length;
  const head = `<div class="ebhead">${shown} shown of about ${Number.isInteger(d.total) ? d.total.toLocaleString() : '?'} on eBay · checked ${esc(ebAgo(d.fetchedAt, now))} · <b>listings, not sales</b></div>`
    + (v.tab === 'now' && low != null ? `<div class="ebfrom">From <b class="mono">$${ebNum(low)}</b> with shipping, for this printing, of the listings eBay showed</div>` : '')
    + (v.tab === 'auction' ? `<div class="seg ebsort"><button data-ebay="sort-ends" class="${v.sort === 'ends' ? 'on' : ''}" aria-pressed="${v.sort === 'ends'}">Ending soonest</button><button data-ebay="sort-bid" class="${v.sort === 'bid' ? 'on' : ''}" aria-pressed="${v.sort === 'bid'}">Lowest bid</button></div>` : '');
  const groups = [], gnames = [...new Map(A.group.flatMap(it => it._fits).map(q => [q.id, q])).values()];
  if (v.tab === 'auction' && (A.mine.length + A.close.length + A.group.length + A.unsure.length)) {

    const tagged = ebSorted([...A.mine.map(it => Object.assign({}, it, { _tag: 'This printing' })), ...A.close.map(it => Object.assign({}, it, { _tag: 'Close match' })), ...A.group.map(it => Object.assign({}, it, { _tag: `One of ${it._fits.length} printings` })),
      ...A.unsure.map(it => Object.assign({}, it, { _tag: 'Printing unsure' }))], v);
    groups.push((gnames.length ? `<div class="note" style="margin:6px 0">“One of N printings”: the title fits several of this number’s printings and does not say which — ${gnames.map(q => esc(ebPrintingName(q))).join('; ')}.</div>` : '')
      + (A.close.length ? '<div class="note" style="margin:6px 0">\u201cClose match\u201d: the title names no printing, and every other printing of this number has words of its own.</div>' : '')
      + (A.unsure.length ? '<div class="note" style="margin:6px 0">\u201cPrinting unsure\u201d: the title names no printing this number has, or none where others do.</div>' : '')
      + tagged.map(it => ebRow(it, 'auction', it._tag, now)).join(''));
  } else if (A.mine.length) groups.push((A.close.length || A.group.length || A.unsure.length ? '<div class="ebgrp">This printing</div>' : '') + ebSorted(A.mine, v).map(it => ebRow(it, v.tab, '', now)).join(''));
  if (v.tab === 'now' && A.close.length) groups.push('<div class="ebgrp">Close match \u2014 the title names no printing</div><div class="note" style="margin:0 0 6px">Every other printing of this number has words of its own. Not counted in \u201cFrom\u201d.</div>' + ebSorted(A.close, v).map(it => ebRow(it, v.tab, '', now)).join(''));
  if (v.tab === 'now' && A.group.length) {
    const names = gnames;
    groups.push(`<div class="ebgrp">One of these ${names.length} printings — the titles do not say which</div><div class="note" style="margin:0 0 6px">${names.map(q => esc(ebPrintingName(q))).join('; ')}</div>` + ebSorted(A.group, v).map(it => ebRow(it, v.tab, '', now)).join(''));
  }
  if (v.tab === 'now' && A.unsure.length) groups.push('<div class="ebgrp">Printing unsure — the title names no printing this number has, or none where others do</div>' + ebSorted(A.unsure, v).map(it => ebRow(it, v.tab, '', now)).join(''));
  const none = `<div class="note" style="margin:6px 0 0">No English ${v.tab === 'auction' ? 'auctions' : 'Buy it now listings'} for this printing right now.</div>`;
  return head + (groups.length ? groups.join('') : none)
    + (left.length ? `<div class="note ebleft">Left out: ${esc(left.join(' · '))}.</div>` : '')
    + '<div class="note ebfoot">Listings from eBay.</div><div class="mgrid"><button class="ghost" data-ebay="again">Check again</button><button class="ghost" data-ebay="decline">Turn eBay listings off</button></div>';
}

function ebayHeadHtml(t = EBAY.terms(), v = EBAY) {
  const note = t === 'no' ? 'Turned off' : t !== 'yes' ? 'What is for sale on eBay for this card' : navigator.onLine === false ? 'Needs a connection' : 'Buy it now and auctions, each linked to eBay';
  return `<button class="dfold ebfold" data-ebay="toggle" aria-expanded="${v.open}"><span><span class="ttl">On eBay now · English${v.grade ? ' · ' + esc(v.grade) : ''}</span><span class="note">${note}</span></span>${chev(v.open)}</button>`
    + (v === EBAY && v.open && v.grade ? '<button class="ghost ebraw" data-ebay="raw">Back to raw copies</button>' : '');
}

const ebUntil = html => { let u = null; for (const m of String(html).matchAll(/data-ebends="([^"]+)"/g)) { const t = Date.parse(m[1]); if (isFinite(t) && (u == null || t < u)) u = t; } return u; };

const ebOn = id => { const x = $('#' + id); return !!(x && x.classList && x.classList.contains('on')) || NAV.stack[NAV.stack.length - 1] === id; };
const EBT = { end: null };
function ebDraw(v, el, html) { el.innerHTML = html; v.until = ebUntil(html); ebArm(); }

const ebMarks = () => ebOn('wants') || ebOn('home');
function ebArm() {
  clearTimeout(EBT.end); EBT.end = null;
  const u = [EBAY.until, EBW.until, EBC.until, EBW.soonUntil].filter(x => x != null && isFinite(x));
  if (!u.length) return null;
  const at = Math.min(...u);
  EBT.end = setTimeout(ebayTick, Math.min(Math.max(at - Date.now(), 0) + 250, 2e9));
  return at;
}

function ebEnded(now = Date.now()) { const past = u => u != null && u <= now; return { page: past(EBAY.until), soon: past(EBW.until), own: past(EBC.until), mark: past(EBW.soonUntil) }; }

function ebayTermsHtml(t, what, links, sent) {
  return t === 'no'
    ? `<div class="note" style="margin:0 0 8px">eBay listings are off. The eBay links ${links} still work.</div><button class="ghost mone" data-ebay="ask">Turn eBay listings on</button>`
    : `<div class="note" style="margin:0 0 10px">${what} as eBay shows them, and a link to each. The app sends ${sent} to its own server, which asks eBay; nothing from your collection leaves the phone.</div>`
      + '<div class="mgrid"><button class="ghost" data-ebay="accept">Show eBay listings</button><button class="ghost" data-ebay="decline">No thanks</button></div>'
      + `<div class="note" style="margin:8px 0">Showing them means you accept the app’s terms for eBay listings. From then on the app also asks about your watched cards’ auctions on its own when it opens, so a watched card’s row can say when one ends.</div><a class="ghost mone" href="${esc(EBAY.termsUrl())}" target="_blank" rel="noopener" aria-label="Read the app’s terms for eBay listings">Read the terms ${ext(12)}</a>`;
}
function paintEbay(p) {
  const el = $('#dEbay'); if (!el) return;
  clearInterval(EBAY.timer); EBAY.timer = null; EBAY.until = null;
  const show = !!(EBAY.on() && p && p.num && !SEALED.isGoods(p));
  el.hidden = !show; if (!show) { el.innerHTML = ''; return; }
  if (EBAY.pid !== p.id) { EBAY.pid = p.id; EBAY.grade = null; EBAY.open = false; }
  const t = EBAY.terms(), head = ebayHeadHtml(t);
  if (!EBAY.open) { el.innerHTML = head; return; }
  if (t !== 'yes') { el.innerHTML = head + '<div class="dbody">' + ebayTermsHtml(t, 'English listings of this card, with their prices and shipping', 'under Manage', 'the card’s number, and a graded copy’s grade,') + '</div>'; return; }
  if (navigator.onLine === false) { el.innerHTML = head + '<div class="dbody"><div class="note" style="margin:0">eBay listings need a connection.</div></div>'; return; }
  el.innerHTML = head + `<div class="dbody"><div class="segtabs ebtabs" role="tablist" aria-label="eBay listings"><button role="tab" data-ebay="tab-now" class="${EBAY.tab === 'now' ? 'on' : ''}" aria-selected="${EBAY.tab === 'now'}">Buy it now</button><button role="tab" data-ebay="tab-auction" class="${EBAY.tab === 'auction' ? 'on' : ''}" aria-selected="${EBAY.tab === 'auction'}">Auctions</button></div>`
    + '<div id="dEbayBody"><div class="note" style="margin:0">Asking eBay…</div></div></div>';
  ebayLoad(p, false);
}
function ebayLoad(p, fresh) {
  const want = p.id, tab = EBAY.tab;
  return EBAY.ask(p.num, EBAY.grade, tab === 'auction' ? 'auction' : null, fresh).then(r => {
    const b = $('#dEbayBody'); if (!b || !dCur || dCur.id !== want || EBAY.tab !== tab) return r;
    EBAY.r = { pid: want, tab, grade: EBAY.grade, r }; ebDraw(EBAY, b, ebayBodyHtml(p, r));
    clearInterval(EBAY.timer); EBAY.timer = EBAY.until != null ? setInterval(ebayTick, 60e3) : null;
    return r;
  });
}

function ebayTick(now) {
  if (typeof now !== 'number') now = Date.now();
  if (!ebOn('detail')) { clearInterval(EBAY.timer); EBAY.timer = null; EBAY.until = null; }
  if (!ebOn('wants')) EBW.until = EBC.until = null;
  if (!ebMarks()) { clearInterval(EBW.timer); EBW.timer = null; EBW.soonUntil = null; }
  const gone = ebEnded(now);
  if (gone.page) { const b = $('#dEbayBody'), k = EBAY.r; if (b && k && dCur && k.pid === dCur.id && k.tab === EBAY.tab && k.grade === EBAY.grade) ebDraw(EBAY, b, ebayBodyHtml(dCur, k.r, now)); }
  if (gone.soon) ebwPaintBody(now);
  if (gone.own) paintEbayCard(false, now);
  for (const v of [EBAY, EBW, EBC]) if (v.until != null && v.until <= now) v.until = null;
  for (const s of $$('#dEbay [data-ebends], #wtEbay [data-ebends], #wcEbay [data-ebends]')) s.textContent = ebEnds(s.dataset.ebends, now);
  paintWatchEnds(now);
}
function ebayTap(e) {
  const b = e.target.closest('[data-ebay]'); if (!b) return;
  if (b.closest && b.closest('#wtEbay')) return ebwTap(b.dataset.ebay);
  if (b.closest && b.closest('#wcEbay')) return ebcTap(b.dataset.ebay);
  if (!dCur) return;
  const a = b.dataset.ebay;
  if (a === 'toggle') EBAY.open = !EBAY.open;
  else if (a === 'accept') { EBAY.setTerms('yes'); EBAY.open = true; }
  else if (a === 'decline') { EBAY.setTerms('no'); EBW.gen++; EBW.busy = false; }
  else if (a === 'ask') { try { localStorage.removeItem(EBAY.TERMS); } catch (x) {} }
  else if (a === 'tab-now' || a === 'tab-auction') EBAY.tab = a.slice(4);
  else if (a === 'sort-ends' || a === 'sort-bid') { EBAY.sort = a.slice(5); const body = $('#dEbayBody'), k = EBAY.r;
    if (body && k && k.pid === dCur.id && k.tab === EBAY.tab && k.grade === EBAY.grade) { ebDraw(EBAY, body, ebayBodyHtml(dCur, k.r)); return; } }
  else if (a === 'raw') EBAY.grade = null;
  else if (a === 'again') { const body = $('#dEbayBody'); if (body) body.innerHTML = '<div class="note" style="margin:0">Asking eBay…</div>'; return ebayLoad(dCur, true); }
  paintEbay(dCur);
  if (a === 'accept') EBG.run('terms');
}
CLICKS.on('[data-ebay]', ebayTap);

function ebayGrade(grader, grade) {
  const g = `${String(grader || '').toUpperCase()} ${String(grade || '').trim()}`;
  if (!/^(PSA|BGS|CGC|TAG|SGC) (10|[1-9](?:\.5)?)$/.test(g) || !dCur) return false;
  EBAY.grade = g; EBAY.pid = dCur.id; EBAY.open = true; paintEbay(dCur); scrollToPanel($('#dEbay'));
  return true;
}
function ebayLine() {
  if (!EBAY.on()) return 'no relay in this build (BUILD has no VAULT_RELAY)';
  const t = EBAY.terms(), l = EBAY.last;
  return (t === 'yes' ? 'terms accepted' : t === 'no' ? 'terms declined' : 'terms not asked yet')
    + (l ? ` · last: ${l.num}${l.grade ? ' ' + l.grade : ''}${l.buying ? ' auctions' : ''}${l.bg ? ' (background)' : ''}, ${l.ok ? l.n + ' listings' : 'refused: ' + l.why}, ${ebAgo(l.at)}` : ' · nothing asked this session')
    + (EBG.last ? ` · background: ${EBG.last.asked} asked ${ebAgo(EBG.last.at)} (${EBG.last.why}${EBG.last.stopped ? ', stopped on two refusals' : ''})` : ' · background: not run this session');
}

const EBW = { open: false, sort: 'ends', gen: 0, busy: false, done: 0, of: 0, timer: null, PACE: 1100, fails: new Map(), until: null, soonUntil: null, SOON: 24 * 3600e3 };
function ebwQuestions() {
  const qs = new Map();
  for (const w of WANT.list) {
    const p = WANT.printing(w); if (!p || !p.num || SEALED.isGoods(p)) continue;
    const grade = w.grade && w.grade !== 'Raw' ? w.grade : null, k = p.num + '|' + (grade || '');
    if (!qs.has(k)) qs.set(k, { num: p.num, grade, entries: [] });
    qs.get(k).entries.push({ w, p });
  }
  return [...qs.values()];
}
const ebwKey = q => [q.num, q.grade || '', 'auction'].join('|');

const ebwLive = (d, now) => (d.items || []).filter(it => it && /^https:\/\/www\.ebay\.com\//.test(String(it.url || '')) && it.buying !== 'FIXED_PRICE' && !(it.endsAt && Date.parse(it.endsAt) <= now));
function ebwFits(w, p, items) {
  if (w.id == null) return items.map(it => ({ it, fit: 'any printing' }));
  const A = ebAttrib(p, items);
  return [...A.mine.map(it => ({ it, fit: 'this printing' })), ...A.close.map(it => ({ it, fit: 'close match' })), ...A.group.map(it => ({ it, fit: `one of ${it._fits.length} printings` })), ...A.unsure.map(it => ({ it, fit: 'printing unsure' }))];
}

function ebwRows(now = Date.now()) {
  const out = { rows: [], fails: [], stale: [], at: [], other: 0, cards: 0 };
  const seen = new Set();
  for (const q of ebwQuestions()) {
    const name = `${q.num}${q.grade ? ' ' + q.grade : ''}`, why = EBW.fails.get(ebwKey(q)), m = EBAY.memo.get(ebwKey(q));
    if (why) out.fails.push(`${name} (${why})`);
    if (!m) continue;
    const d = m.r.data; if (!(now - Date.parse(d.fetchedAt || '') < EBAY.STALE)) { out.stale.push(name); continue; }
    out.at.push(Date.parse(d.fetchedAt));
    const items = ebwLive(d, now);

    const took = new Set(), best = new Map(), RANK = { 'this printing': 0, 'close match': 1, 'any printing': 3, 'printing unsure': 4 };
    for (const { w, p } of q.entries) {
      const mine = ebwFits(w, p, items);
      if (mine.length) out.cards++;
      for (const x of mine) {
        took.add(x.it.itemId);
        const r = RANK[x.fit] ?? 2, b = best.get(x.it.itemId);
        if (!b || r < b.r) best.set(x.it.itemId, { r, x, w, p });
      }
    }
    for (const [id, { x, w, p }] of best) {
      if (seen.has(id)) continue;
      seen.add(id);

      const pr = w.id != null ? ' ' + ebPrintingName(p) : '';
      out.rows.push({ it: x.it, tag: `${p.name}${pr} · ${p.num}${q.grade ? ' · ' + q.grade : ''} · ${x.fit}` });
    }
    out.other += items.filter(it => !took.has(it.itemId)).length;
  }
  const bid = it => Number(it.bid && it.bid.value) || 1e9, end = it => Date.parse(it.endsAt || '') || 9e15;
  out.rows.sort((a, b) => EBW.sort === 'bid' ? bid(a.it) - bid(b.it) : end(a.it) - end(b.it));
  return out;
}

function ebayWatchHtml(now = Date.now()) {
  const R = ebwRows(now), n = ebwQuestions().reduce((a, q) => a + q.entries.length, 0);
  const asking = EBW.busy ? `<div class="note" style="margin:0 0 8px">Asking eBay… ${EBW.done} of ${EBW.of} watched cards</div>` : '';
  const oldest = R.at.length ? Math.min(...R.at) : null;
  const head = oldest != null ? `<div class="ebhead">${R.rows.length} auction${R.rows.length === 1 ? '' : 's'} for ${R.cards} of ${n} watched card${n === 1 ? '' : 's'} · checked ${esc(ebAgo(new Date(oldest).toISOString(), now))} · <b>listings, not sales</b></div>` : '';
  const sorts = R.rows.length > 1 ? `<div class="seg ebsort"><button data-ebay="sort-ends" class="${EBW.sort === 'ends' ? 'on' : ''}" aria-pressed="${EBW.sort === 'ends'}">Ending soonest</button><button data-ebay="sort-bid" class="${EBW.sort === 'bid' ? 'on' : ''}" aria-pressed="${EBW.sort === 'bid'}">Lowest bid</button></div>` : '';
  const list = R.rows.map(x => ebRow(x.it, 'auction', x.tag, now)).join('');
  const none = oldest != null && !EBW.busy && !R.rows.length ? `<div class="note" style="margin:6px 0 0">No English auctions ${R.fails.length || R.stale.length ? 'in the answers' : 'for your watched cards'} right now.</div>` : '';
  const left = R.other ? `<div class="note ebleft">Left out: other printings of these numbers ${R.other}.</div>` : '';
  const fails = R.fails.length ? `<div class="note ebleft">Not answered: ${esc(R.fails.join('; '))}.</div>` : '';
  const stale = R.stale.length ? `<div class="note ebleft">Over six hours old, not shown: ${esc(R.stale.join(', '))}.</div>` : '';
  return asking + head + sorts + list + none + left + fails + stale
    + '<div class="note ebfoot">Listings from eBay.</div><div class="mgrid"><button class="ghost" data-ebay="again">Check again</button><button class="ghost" data-ebay="decline">Turn eBay listings off</button></div>';
}
function ebwHeadHtml(t = EBAY.terms()) {
  const note = t === 'no' ? 'Turned off' : t !== 'yes' ? 'Auctions for the cards you watch' : navigator.onLine === false ? 'Needs a connection' : 'Every watched card’s auctions, soonest first';
  return `<button class="dfold ebfold" data-ebay="toggle" aria-expanded="${EBW.open}"><span><span class="ttl">Ending soon on eBay · English</span><span class="note">${note}</span></span>${chev(EBW.open)}</button>`;
}
function paintEbayWatch(load = true) {
  const el = $('#wtEbay'); if (!el) return;
  const show = !!(EBAY.on() && ebwQuestions().length);
  el.hidden = !show; if (!show) { el.innerHTML = ''; return; }
  const t = EBAY.terms(), head = ebwHeadHtml(t);
  if (!(EBW.open && t === 'yes' && navigator.onLine !== false)) EBW.until = null;
  if (!EBW.open) { el.innerHTML = head; return; }
  if (t !== 'yes') { el.innerHTML = head + '<div class="dbody">' + ebayTermsHtml(t, 'English auctions of the cards you watch, with their bids and shipping', 'on each card', 'the number of each card you watch, and its grade where you set one, one card at a time,') + '</div>'; return; }
  if (navigator.onLine === false) { el.innerHTML = head + '<div class="dbody"><div class="note" style="margin:0">eBay listings need a connection.</div></div>'; return; }
  el.innerHTML = head + '<div class="dbody" id="wtEbayBody"></div>';
  ebwPaintBody();
  if (load && !EBW.busy) ebwLoad(false);
}
function ebwPaintBody(now = Date.now()) {
  const b = $('#wtEbayBody'); if (!b) return;
  ebDraw(EBW, b, ebayWatchHtml(now));
  ebwClock();
}
function ebwClock() { if (!EBW.timer) EBW.timer = setInterval(ebayTick, 60e3); }

async function ebwLoad(fresh) {
  const qs = ebwQuestions(), gen = ++EBW.gen;
  EBW.busy = true; EBW.done = 0; EBW.of = qs.length; ebwPaintBody();
  for (const q of qs) {
    if (gen !== EBW.gen) return;

    if (!EBW.open || EBAY.terms() !== 'yes') { EBW.busy = false; return; }
    const m = EBAY.memo.get(ebwKey(q)), kept = !fresh && m && Date.now() - m.at < EBAY.KEEP;
    const r = await EBAY.ask(q.num, q.grade, 'auction', fresh);
    if (gen !== EBW.gen) return;
    if (r && r.ok) EBW.fails.delete(ebwKey(q)); else EBW.fails.set(ebwKey(q), (r && r.why) || 'no answer');
    EBW.done++; ebwPaintBody();
    if (!kept && EBW.done < qs.length && EBW.PACE > 0) await new Promise(r => setTimeout(r, EBW.PACE));
  }
  if (gen !== EBW.gen) return;
  EBW.busy = false; ebwPaintBody();
}
function ebwTap(a) {
  if (a === 'toggle') { EBW.open = !EBW.open; if (!EBW.open) { EBW.gen++; EBW.busy = false; } }
  else if (a === 'accept') { EBAY.setTerms('yes'); EBW.open = true; }
  else if (a === 'decline') { EBAY.setTerms('no'); EBW.gen++; EBW.busy = false; }
  else if (a === 'ask') { try { localStorage.removeItem(EBAY.TERMS); } catch (x) {} }
  else if (a === 'sort-ends' || a === 'sort-bid') { EBW.sort = a.slice(5); return ebwPaintBody(); }
  else if (a === 'again') { EBW.gen++; EBW.busy = false; paintEbayWatch(false); return ebwLoad(true); }
  paintEbayWatch();
  if (a === 'accept' || a === 'decline' || a === 'ask') { paintEbayCard(false); paintWatchEnds(); }
}

function ebwSoon(w, p, now = Date.now()) {
  if (!w || !p || !p.num || !EBAY.on() || EBAY.terms() !== 'yes' || SEALED.isGoods(p)) return null;
  const grade = w.grade && w.grade !== 'Raw' ? w.grade : null, m = EBAY.memo.get(ebwKey({ num: p.num, grade }));
  if (!m || !m.r || !m.r.ok) return null;
  const d = m.r.data; if (!(now - Date.parse(d.fetchedAt || '') < EBAY.STALE)) return null;
  let sure = null, close = null;
  for (const { it, fit } of ebwFits(w, p, ebwLive(d, now))) {
    const end = Date.parse(it.endsAt || ''); if (!isFinite(end) || !(end - now < EBW.SOON)) continue;
    if (fit === 'this printing' || fit === 'any printing') { if (!sure || end < sure.end) sure = { end, fit, ms: end - now }; }
    else if (fit === 'close match') { if (!close || end < close.end) close = { end, fit, ms: end - now }; }
  }
  return sure || close;
}

function ebSoonText(ms) { const m = Math.max(1, Math.round(ms / 60e3)); return m < 60 ? `${m} min` : `${Math.min(23, Math.floor(m / 60))}h`; }
function watchEndInner(w, p, now = Date.now()) {
  const s = ebwSoon(w, p, now); if (!s) return '';
  return `<span class="wsrc">eBay</span> · ${s.fit === 'close match' ? 'Close-match auction' : 'Auction'} ending in: ${ebSoonText(s.ms)}`;
}

function watchEndHtml(w, p, now = Date.now()) { return `<span class="wend" data-wend="${esc(WANT.key(w))}">${watchEndInner(w, p, now)}</span>`; }
function paintWatchEnds(now = Date.now()) {
  let until = null;
  for (const w of WANT.list) { const p = WANT.printing(w), s = p ? ebwSoon(w, p, now) : null; if (s && (until == null || s.end < until)) until = s.end; }
  for (const el of $$('#wtRows [data-wend], #homeWatchList [data-wend]')) { const w = WANT.byKey(el.dataset.wend), p = w && WANT.printing(w); el.innerHTML = w && p ? watchEndInner(w, p, now) : ''; }
  EBW.soonUntil = ebMarks() ? until : null;
  if (ebMarks() && EBAY.memo.size) ebwClock();
  ebArm();
  return until;
}

const EBC = { key: null, open: false, tab: 'now', sort: 'ends', grade: null, r: null, until: null };
function ebcCur() { const w = WATCHUI.open ? WANT.byKey(WATCHUI.open) : null, p = w ? WANT.printing(w) : null; return w && p ? { w, p } : null; }
const ebcBoxHtml = p => EBAY.on() && p && p.num && !SEALED.isGoods(p) ? '<div class="ebay wcebay" id="wcEbay"></div>' : '';

function ebcKind(c = ebcCur(), t = EBAY.terms()) {
  if (!c || !ebcBoxHtml(c.p)) return 'none';
  return !EBC.open ? 'folded' : t !== 'yes' ? 'terms' : c.w.id == null ? 'any' : navigator.onLine === false ? 'offline' : 'list';
}
function ebayCardHtml(now = Date.now()) {
  const c = ebcCur(), t = EBAY.terms(), kind = ebcKind(c, t); if (kind === 'none') return '';
  const head = ebayHeadHtml(t, EBC);
  if (kind === 'folded') return head;
  if (kind === 'terms') return head + '<div class="dbody">' + ebayTermsHtml(t, 'English listings of this card, with their prices and shipping', 'on each card', 'the card’s number, and its grade where you set one,') + '</div>';
  if (kind === 'any') return head + `<div class="dbody"><div class="note" style="margin:0">This entry is any printing of ${esc(c.p.num)}. eBay’s listings are sorted to one printing: choose the printing above first. Ending soon on eBay lists the number’s auctions.</div></div>`;
  if (kind === 'offline') return head + '<div class="dbody"><div class="note" style="margin:0">eBay listings need a connection.</div></div>';
  const k = EBC.r, held = k && k.key === EBC.key && k.tab === EBC.tab && k.grade === EBC.grade;
  return head + `<div class="dbody"><div class="segtabs ebtabs" role="tablist" aria-label="eBay listings of this watched card"><button role="tab" data-ebay="tab-now" class="${EBC.tab === 'now' ? 'on' : ''}" aria-selected="${EBC.tab === 'now'}">Buy it now</button><button role="tab" data-ebay="tab-auction" class="${EBC.tab === 'auction' ? 'on' : ''}" aria-selected="${EBC.tab === 'auction'}">Auctions</button></div>`
    + `<div id="wcEbayBody">${held ? ebayBodyHtml(c.p, k.r, now, EBC) : '<div class="note" style="margin:0">Asking eBay…</div>'}</div></div>`;
}
function paintEbayCard(load = true, now = Date.now()) {
  const el = $('#wcEbay'), c = ebcCur();
  if (c && EBC.key !== WATCHUI.open) { EBC.key = WATCHUI.open; EBC.open = false; EBC.tab = 'now'; EBC.r = null; }
  if (c) EBC.grade = c.w.grade && c.w.grade !== 'Raw' ? c.w.grade : null;
  const html = ebayCardHtml(now), kind = ebcKind(c);
  EBC.until = kind === 'list' ? ebUntil(html) : null;
  if (el) el.innerHTML = html;
  if (EBC.until != null) ebwClock();
  ebArm();
  if (load && kind === 'list') ebcLoad(false);
}
function ebcLoad(fresh) {
  const c = ebcCur(); if (!c || ebcKind(c) !== 'list') return Promise.resolve(null);
  const key = EBC.key, tab = EBC.tab, grade = EBC.grade;
  return EBAY.ask(c.p.num, grade, tab === 'auction' ? 'auction' : null, fresh).then(r => {
    if (EBC.key !== key || EBC.tab !== tab || EBC.grade !== grade || !EBC.open || WATCHUI.open !== key) return r;
    EBC.r = { key, tab, grade, r };
    paintEbayCard(false);
    if (tab === 'auction') paintWatchEnds();
    return r;
  });
}
function ebcTap(a) {
  if (a === 'toggle') EBC.open = !EBC.open;
  else if (a === 'accept') { EBAY.setTerms('yes'); EBC.open = true; }
  else if (a === 'decline') { EBAY.setTerms('no'); EBW.gen++; EBW.busy = false; }
  else if (a === 'ask') { try { localStorage.removeItem(EBAY.TERMS); } catch (x) {} }
  else if (a === 'tab-now' || a === 'tab-auction') EBC.tab = a.slice(4);
  else if (a === 'sort-ends' || a === 'sort-bid') { EBC.sort = a.slice(5); return paintEbayCard(false); }
  else if (a === 'again') { EBC.r = null; paintEbayCard(false); return ebcLoad(true); }
  if (a === 'accept' || a === 'decline' || a === 'ask') { paintEbayWatch(false); paintWatchEnds(); }
  paintEbayCard();
  if (a === 'accept') EBG.run('terms');
}

const EBG = { MAX: 40, EVERY: 2 * 3600e3, busy: false, at: 0, last: null,
  can() { return !!(EBAY.on() && EBAY.terms() === 'yes' && navigator.onLine !== false && PLATFORM.quietSyncAllowed()); },
  questions() { return ebwQuestions().reverse().slice(0, this.MAX); },

  SLACK: 5 * 60e3,

  RETRY: 15 * 60e3,
  due(now = Date.now()) { return now < this.at || now - this.at >= this.EVERY - this.SLACK; },
  async run(why) {
    if (this.busy || EBW.busy || !this.can()) return 0;
    const qs = this.questions(); if (!qs.length) return 0;
    this.busy = true; this.at = Date.now(); let asked = 0, bad = 0, good = 0;
    try {
      for (const q of qs) {
        if (EBW.busy || !this.can()) break;
        const m = EBAY.memo.get(ebwKey(q)); if (m && Date.now() - m.at < EBAY.KEEP) continue;
        const r = await EBAY.ask(q.num, q.grade, 'auction', false, true); asked++;
        if (r && r.ok) { bad = 0; good++; EBW.fails.delete(ebwKey(q)); paintWatchEnds(); if (EBW.open && !EBW.busy) ebwPaintBody();

          const c = ebcCur(); if (c && EBC.open && EBC.tab === 'auction' && c.p.num === q.num && (EBC.grade || null) === (q.grade || null)) ebcLoad(false); }
        else if (++bad >= 2) break;
        if (EBW.PACE > 0) await new Promise(done => setTimeout(done, EBW.PACE));
      }
    } finally { this.busy = false; if (bad >= 2 && !good) this.at += this.RETRY - (this.EVERY - this.SLACK); this.last = { why, asked, at: new Date().toISOString(), stopped: bad >= 2 }; }
    return asked;
  },

  front() { return document.visibilityState === 'visible' && this.due() ? this.run('back to the front') : Promise.resolve(0); },
  look() { return this.due() ? this.run('hourly look') : Promise.resolve(0); },
  watch() {
    document.addEventListener('visibilitychange', () => { this.front(); });
    const hourly = () => { this.look(); setTimeout(hourly, 3600e3); }; setTimeout(hourly, 3600e3);
  }
};

function paintSettings() {

  const s = $('#setBody');
  const m = CAT.man; const note = m.whatsNew;
  s.innerHTML = `
    <div class="panel"><h3>Your collection</h3>
      <div class="row"><div class="nm"><b>${OWN.items.length} lines</b>
        <span>${OWN.items.reduce((a, i) => a + i.qty, 0)} cards \u00b7 ${money(OWN.total())}</span>
      </div></div>
      <button class="linkish" data-act="export">Export CSV</button>
      <button class="linkish" data-act="sharepage">Share as a web page</button>
      <div class="row"><div class="nm"><b>Last backup</b>
        <span>${OWN.lastBackup ? (OWN.lastBackup.failed ? '<span class="down">Failed</span> ' + esc(momentText(OWN.lastBackup.at))
          : esc(momentText(OWN.lastBackup.at)) + ' · ' + esc(OWN.lastBackup.where)) : 'never'}</span></div>
        <button class="ghost" data-act="backup">Back up now</button></div>
      <button class="linkish" data-act="restore">Restore from backup</button>
      <div class="note">Backed up to <b>Documents/OPTCGHub</b> on every save; photos aren’t included.
        <b>Before you uninstall or switch to the Play version, Export CSV and keep the file.</b></div>
    </div>
    <div class="panel"><h3>About</h3>
      <div class="row"><div class="nm"><b id="aboutTake">Take ${TAKE} \u00b7 built ${esc(momentText(CAT.man.built_at))}</b><span>${CAT.man.cards ? CAT.man.cards.toLocaleString() + ' cards' : ''} \u00b7 prices ${esc(dayText(CAT.man.source_updated_at))}</span></div></div>
      <div class="row"><div class="nm"><b>Google Play</b><span id="aboutUpd">${esc(UPDATE.note())}</span></div><button class="ghost" data-act="update">${UPDATE.newer() ? 'Update' : 'Check for updates'}</button></div>
      ${note && note.take === TAKE ? `<details class="wn"><summary>New in this update</summary><div class="note">${esc(note.text.charAt(0).toUpperCase() + note.text.slice(1))}</div></details>` : ''}
      <div class="note" id="aboutIcons">Icons from Lucide (ISC licence) and Feather (MIT licence); the QR reader is jsQR (Apache 2.0 licence). Their notices ship with the app.</div></div>
    <div class="panel"><h3>Self-test</h3>
      <div class="row"><div class="nm"><b>Does this phone run the app?</b><span>catalogue, scanner gate, OCR, backup, camera, fonts, sync \u2014 in one tap</span></div>
        <button class="ghost" id="stRun">Run</button></div>
      <div id="stOut"></div>
    </div>
    <div class="panel"><h3>How it works</h3>
      <button class="linkish" id="guideAgain">Show the guide again</button>
      <button class="linkish" data-act="currency">Show prices in\u2026 ${esc(CUR.active())}${CUR.active() !== 'USD' ? ' (converted)' : ''}</button>
      <button class="linkish" data-act="rate">Rate this app on Google Play</button>
      <button class="linkish" data-act="shareapp">Tell someone about the app</button>${ADS.privacyShown() ? '<button class="linkish" data-act="adprivacy">Privacy choices for ads</button>' : ''}</div>
    <div class="panel"><h3>Appearance</h3>
      <div class="seg" id="themeSeg" role="radiogroup" aria-label="Appearance">${['dark', 'light', 'system'].map(t => `<button role="radio" data-theme="${t}" class="${THEME.cur === t ? 'on' : ''}" aria-checked="${THEME.cur === t}">${{ dark: 'Dark', light: 'Light', system: 'Auto' }[t]}</button>`).join('')}</div>
      <div class="note">Auto follows your phone\u2019s setting.</div></div>
    <div class="panel"><h3>Sync</h3>
      <div class="row"><div class="nm"><b>Prices from ${esc(dayText(CAT.man.source_updated_at))}</b>
        <span>${CAT.man.fromDisk ? 'synced copy on this phone' : 'the copy that came with the app'}${CAT.man.updateUrl ? '' : ' \u00b7 sync not configured'}</span></div>
        <button class="ghost" id="syncBtn">Sync now</button></div>
      <div class="note">Gets new prices nightly when you\u2019re online. Everything else works offline.</div>
      <label class="row" style="gap:10px;cursor:pointer"><input type="checkbox" id="syncCell" ${localStorage.getItem('vault.syncCellular') === '1' ? 'checked' : ''}>
        <span class="nm"><b>Also sync quietly on mobile data</b><span>About 0.5 MB a day. Off: it waits for wifi.</span></span></label>
    </div>
    <div class="panel"><h3>Catalogue</h3>
      <div class="row"><div class="nm"><b>${(m.cards || 0).toLocaleString()} cards</b>
        <span>${setsWithCards()} sets \u00b7 ${(m.hashed || 0).toLocaleString()} artwork hashes</span></div></div>
      <div class="row"><div class="nm"><b>Source updated</b>
        <span>${esc(m.source_updated_at ? momentText(m.source_updated_at) : '?')}</span></div></div>
      <div class="row"><div class="nm"><b>Built</b><span>take ${TAKE} \u00b7 ${esc(m.built_at ? momentText(m.built_at) : '?')}</span></div></div>
    </div>
    <div class="panel"><h3>Save credits</h3>
      <div class="row"><div class="nm"><b>${CREDITS.state.scan} save credit${CREDITS.state.scan === 1 ? '' : 's'}</b>
        <span>${CREDITS.state.deck} deck save${CREDITS.state.deck === 1 ? '' : 's'}${CREDITS.state.pending.length ? ` \u00b7 ${CREDITS.state.pending.length} card${CREDITS.state.pending.length === 1 ? '' : 's'} waiting` : ''}</span></div></div>
      <div class="note">${ADS_ENABLED ? `Scanning is free. Saving a scanned card uses a credit, a new deck a deck save; a short ad on Scan earns ${CREDITS.PER_AD} more. A card waiting for a credit is never lost.`
        : 'Saving is free here; credits and ads are only in the Android app.'}</div>
    </div>
    <div class="panel"><h3>Network</h3>
      <div class="note">Requests this session: <b>${NET.count}</b><br>
        Hosts: ${[...NET.hosts].map(esc).join(', ') || 'none'}<br><br>
        Scanning, valuing and saving work with no signal.</div>
    </div>
    <div class="panel"><h3>What this app does not know</h3>
      <div class="note">
        <b>Condition does not change the price shown</b> — the source has no prices by condition.<br>
        <b>Graded copies show the ungraded price.</b><br>
        <b>Japanese printings are not covered.</b><br>
        <b>Sealed product is added by hand</b> — it has no card number to scan.
      </div>
    </div>
    <div class="panel"><h3>Data sources</h3>
      <div class="note">
        Catalogue and prices: <b>TCGplayer</b>, via <b>TCGCSV</b> (tcgcsv.com).<br><br>
        Card art belongs to Bandai, Shueisha, Toei and Viz Media; the app keeps only a
        fingerprint of it to tell printings apart.<br><br>
        <b>Not affiliated with, endorsed by, or sponsored by</b> Bandai,
        Shueisha, Toei Animation, Viz Media, TCGplayer or Collectr.
      </div>
    </div>
    <div style="height:40px"></div>`;
  $$('.screen').forEach(x => x.classList.toggle('on', x.id === 'settings'));

  const ga = $('#guideAgain'); if (ga) ga.addEventListener('click', guideOpen);
  const at = $('#aboutTake'); if (at) at.addEventListener('click', () => DIAG.tap());
  const st = $('#stRun'); if (st) st.addEventListener('click', () => { st.disabled = true; runSelfTest().finally(() => { st.disabled = false; }); });
  const sc = $('#syncCell'); if (sc) sc.addEventListener('change', () => saveJson('vault.syncCellular', sc.checked ? '1' : '0'));
  const sy = $('#syncBtn'); if (sy) sy.addEventListener('click', async () => { sy.disabled = true; await PLATFORM.refreshCatalogue(); sy.disabled = false; paintSettings(); });
}

const RULEBOOK = {"version":"1.2.1","date":"2026-08-28","title":"ONE PIECE CARD GAME Comprehensive Rules","url":"https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf","note":"A digest in the app\u2019s own words under the official section numbers, read in full from the official PDF at take 122. The official text governs; card text beats these rules where they disagree (1-3-1).","sim_legend":{"enforced":"the Sim keeps this rule","partial":"the Sim keeps part of it; the rest is by hand","by hand":"the players keep it; the Sim offers it or leaves it to them","not modelled":"the Sim does not model this yet","n/a":"not a rule of play"},"sections":[{"id":"1-1","title":"Players","text":"The game is for two players, head to head.","sim":"enforced","where":"SIM.new"},{"id":"1-2","title":"Ending the game","text":"A player who meets a defeat condition loses and the other wins. Defeat is checked at the next rule processing.","sim":"enforced","where":"SIM.rules"},{"id":"1-2-1-1","title":"The two defeat conditions","text":"You lose when your Leader takes damage while you have 0 Life cards, or when you have 0 cards in your deck.","sim":"enforced","where":"SIM.resolve, SIM.rules"},{"id":"1-2-3","title":"Conceding","text":"Either player may concede at any time; they lose at once and no card can stop or force it.","sim":"enforced","where":"SIM.act(\u2019concede\u2019)"},{"id":"1-2-5","title":"Winning or losing by a card","text":"Some cards make a player win or lose; that happens while the effect is processed.","sim":"by hand"},{"id":"1-3-1","title":"Card text beats the rules","text":"When a card\u2019s text contradicts these rules, the card text wins.","sim":"by hand"},{"id":"1-3-2","title":"Impossible actions","text":"An action that cannot be done is not done; of several actions, do as many as possible. Changing a card to the state it is already in does nothing.","sim":"enforced"},{"id":"1-3-4","title":"Simultaneous choices","text":"When both players choose at once, the turn player chooses first.","sim":"enforced","where":"SIM.who"},{"id":"1-3-5","title":"Choosing numbers","text":"A chosen number is a whole number of 0 or more; with no minimum, 0 may be chosen.","sim":"enforced"},{"id":"1-3-6","title":"Numbers that change","text":"Numbers have no fractions. Power can go below 0; other numbers below 0 count as 0. A negative cost counts only inside its own calculation.","sim":"enforced","where":"SIM.effCost"},{"id":"1-3-6-2","title":"Negative cost","text":"A cost made negative by an effect is 0 outside that calculation.","sim":"enforced","where":"SIM.effCost"},{"id":"1-3-7","title":"Order of text","text":"Card effects are carried out in the order written.","sim":"enforced","where":"SIM.apply"},{"id":"1-3-8","title":"Rest beats set active","text":"If an effect would rest a card and set it active at the same time, it is rested.","sim":"by hand"},{"id":"1-3-9","title":"Cost and activation cost","text":"Cost is paid to play a card; an activation cost is paid to activate an effect.","sim":"enforced"},{"id":"1-3-10","title":"Both players act","text":"When an effect makes both players act at the same time, the turn player acts first.","sim":"enforced"},{"id":"2","title":"Card information","text":"What is printed on a card: name, category, colour, type, attribute, power, cost, text, Life, Counter, [Trigger], card number.","sim":"enforced"},{"id":"2-1","title":"Card name","text":"A name in [ ] with no noun after it means cards with that name; part of a name in quotes means names containing it. Some cards take a name from their text.","sim":"partial","where":"effects.py search_steps"},{"id":"2-2","title":"Card categories","text":"Five categories: Leader, Character, Event, Stage and DON!!. A Leader stays in the Leader area, Characters in the Character area, Stages in the Stage area; an Event is used from hand.","sim":"enforced"},{"id":"2-3","title":"Colour","text":"Six colours: red, green, blue, purple, black and yellow. A card of several colours is every one of them.","sim":"enforced","where":"legality"},{"id":"2-3-5","title":"Several colours","text":"A card of several colours counts as every one of them.","sim":"enforced","where":"legality"},{"id":"2-4","title":"Type","text":"A card may have several types, split by a slash. A type in { } in text means cards of that type; part of a type in quotes means types containing it.","sim":"enforced","where":"SIM.targetsFor"},{"id":"2-4-3","title":"A type in { }","text":"Text in { } brackets means cards with that type.","sim":"enforced","where":"effects.py (search, Leader condition, powerall)"},{"id":"2-4-3-1","title":"Part of a type in quotes","text":"A part of a type in \" \" quotation marks means cards with a type containing that text.","sim":"enforced","where":"SIM.DO.powerall, effects.py search"},{"id":"2-5","title":"Attribute","text":"Slash, Strike, Ranged, Special, Wisdom and ?. Only Leaders and Characters have one; an attribute in < > means cards with it.","sim":"not modelled"},{"id":"2-6","title":"Power","text":"Only Leaders and Characters have power; effects can raise or lower it.","sim":"enforced","where":"SIM.power"},{"id":"2-6-3","title":"Power can change","text":"Effects can make power higher or lower than printed; \u2019N power or less\u2019 reads the power the card has now.","sim":"enforced","where":"SIM.power, SIM.targetsFor"},{"id":"2-7","title":"Cost","text":"To play a card from hand, reveal it and rest that many active DON!! in your cost area. An Event is then trashed and its effect resolves. Only Characters, Events and Stages have a cost.","sim":"enforced","where":"SIM.canPlay, SIM.play"},{"id":"2-7-2","title":"Playing a Character","text":"Reveal it, rest active DON!! equal to its cost, then play it.","sim":"enforced","where":"SIM.play"},{"id":"2-7-3","title":"Using an Event","text":"Reveal it, rest active DON!! equal to its cost, trash it, then activate and resolve its effect.","sim":"enforced","where":"SIM.play, SIM.act(\u2019play\u2019)"},{"id":"2-8","title":"Card text","text":"A Leader\u2019s, Character\u2019s or Stage\u2019s text works only in its own area unless it says otherwise. Text resolves from the top. Words in ( ) explain and do not change play.","sim":"enforced"},{"id":"2-9","title":"Life","text":"At the start, each player places Life cards equal to the Leader\u2019s Life from the top of the deck, face-down, without looking.","sim":"enforced","where":"SIM.placeLife"},{"id":"2-9-2-1","title":"Life order","text":"The card that was on top of the deck goes to the bottom of the Life area.","sim":"enforced","where":"SIM.placeLife"},{"id":"2-10","title":"Counter value","text":"The power a Character card in hand adds in the Counter Step. Only Characters have one; with several, only the highest applies.","sim":"enforced","where":"SIM.counters"},{"id":"2-11","title":"[Trigger]","text":"An effect that can be used instead of adding the card to hand when it comes from Life on taking damage.","sim":"enforced","where":"SIM.act(\u2019resolve\u2019)"},{"id":"2-14","title":"Card number","text":"No more than 4 cards with the same card number in a deck.","sim":"enforced","where":"legality"},{"id":"2-14-2","title":"Four copies","text":"No more than 4 cards with the same card number in a deck.","sim":"enforced","where":"legality"},{"id":"3-1","title":"The areas","text":"Deck, DON!! deck, hand, trash, Leader, Character, Stage, cost and Life areas. How many cards each holds is open to both players. \u2019The field\u2019 is the Leader, Character, Stage and cost areas.","sim":"enforced"},{"id":"3-1-6","title":"A card that moves is a new card","text":"A card leaving the Character or Stage area becomes a new card wherever it goes; what applied to it does not follow. A DON!! that moves loses what applied to it.","sim":"enforced","where":"SIM.leave"},{"id":"3-2","title":"Deck","text":"Face-down; nobody looks at or reorders it unless told. Several cards moved from it move one at a time. Shuffling puts it in random order.","sim":"enforced","where":"SIM.shuffle; SIM.view (both decks are counts)"},{"id":"3-3","title":"DON!! deck","text":"Open, face-down; either player may look at it.","sim":"enforced"},{"id":"3-4","title":"Hand","text":"Secret to the other player; you may look at and reorder your own.","sim":"enforced","where":"SIM.view (the other hand is a count; take 123)"},{"id":"3-5","title":"Trash","text":"K.O.\u2019d Characters and used Events go here, face-up, open to both; new cards go on top.","sim":"enforced"},{"id":"3-6","title":"Leader area","text":"Your Leader is placed face-up at the start and never leaves by any rule or effect.","sim":"enforced"},{"id":"3-6-1","title":"The Leader starts in play","text":"The Leader is placed face-up at the start of the game; it is never played from hand.","sim":"enforced","where":"SIM.canPlay"},{"id":"3-7","title":"Character area","text":"Characters are played face-up and active unless told otherwise.","sim":"enforced"},{"id":"3-7-4","title":"Played this turn","text":"A Character played this turn cannot attack unless an effect says it can ([Rush], [Rush: Character]).","sim":"enforced","where":"SIM.canAttack"},{"id":"3-7-6","title":"Five Characters","text":"Up to 5 Characters can be in the Character area.","sim":"enforced"},{"id":"3-7-6-1","title":"A sixth Character","text":"With 5 in play, to play another you reveal it, trash one of your 5, then play it. That trash is rule processing, not a K.O.: no effect applies.","sim":"enforced","where":"SIM.play, SIM.room"},{"id":"3-7-6-1-1","title":"Trashing for room is a rule","text":"Trashing a Character to make room for a sixth is rule processing: no effect applies, and it is not a K.O.","sim":"enforced","where":"SIM.room"},{"id":"3-8","title":"Stage area","text":"Stages are played face-up and active unless told otherwise.","sim":"enforced"},{"id":"3-8-5","title":"One Stage","text":"Up to 1 Stage. To play a new one, reveal it, trash the old one, then play it.","sim":"enforced","where":"SIM.placeStage"},{"id":"3-8-5-1","title":"A new Stage","text":"Playing a Stage with one already in play trashes the old one first.","sim":"enforced","where":"SIM.placeStage"},{"id":"3-9","title":"Cost area","text":"DON!! are placed here, active unless told otherwise. It is open; you choose which DON!! pay a cost.","sim":"enforced"},{"id":"3-10","title":"Life area","text":"Secret and face-down; nobody looks or reorders. A card leaving Life comes from the top unless told otherwise. A card added face-up is open.","sim":"enforced","where":"SIM.view (both Lives are counts; take 123)"},{"id":"4-4","title":"Active and rested","text":"Cards on the field are active (upright) or rested (sideways). A given DON!! is neither.","sim":"enforced"},{"id":"4-5","title":"Draw","text":"Add the top card of your deck to your hand without showing it. \u2019Draw up to X\u2019 lets you stop after any card.","sim":"enforced","where":"SIM.draw"},{"id":"4-6","title":"Damage","text":"For each point of damage, the damaged player moves the top Life card to hand. A card with [Trigger] may be activated instead.","sim":"enforced","where":"SIM.resolve"},{"id":"4-7","title":"Play a card","text":"Pay its cost and use it or put it into play from hand.","sim":"enforced"},{"id":"4-8","title":"Up to X","text":"Choose any number from 0 to X, then resolve.","sim":"enforced","where":"effects.py upto, SIM.apply"},{"id":"4-9","title":"Base power and base cost","text":"When several effects set a card\u2019s base power or base cost to different values, the highest applies.","sim":"not modelled"},{"id":"4-10","title":"If and Then","text":"If an \u2019if\u2019 clause cannot be met, what follows it is not resolved. If a \u2019then\u2019 clause cannot be resolved, what follows it still can, unless an \u2019if\u2019 before it failed.","sim":"enforced","where":"SIM.apply (step conditions)"},{"id":"4-11","title":"Remove","text":"Remove means move a card from its area to another area.","sim":"by hand"},{"id":"5","title":"Game setup","text":"Decks are prepared (5-1) and the game is set up (5-2).","sim":"enforced"},{"id":"5-1","title":"Leader, deck and DON!! deck","text":"Each player brings 1 Leader, a 50-card deck and a 10-card DON!! deck.","sim":"enforced","where":"legality"},{"id":"5-1-2","title":"A deck","text":"Exactly 1 Leader, a 50-card deck of Characters, Events and Stages, and a 10-card DON!! deck.","sim":"enforced","where":"legality"},{"id":"5-1-2-1","title":"What a deck holds","text":"Characters, Events and Stages only.","sim":"enforced","where":"legality"},{"id":"5-1-2-2","title":"Colours","text":"Every card must share a colour with the Leader.","sim":"enforced","where":"legality"},{"id":"5-1-2-3","title":"Copies","text":"No more than 4 cards with the same card number.","sim":"enforced","where":"legality"},{"id":"5-1-2-4","title":"Cards that change deck building","text":"Effects about deck construction replace these rules; they are permanent effects that work during deck building.","sim":"not modelled"},{"id":"5-2-1","title":"Before the game","text":"Check the decks, shuffle, place the Leaders, decide who goes first, draw 5 with one redraw each, place Life, and the first player begins.","sim":"enforced","where":"SIM.new, SIM.mulligan"},{"id":"5-2-1-2","title":"Shuffle","text":"Each player shuffles thoroughly and places the deck face-down.","sim":"enforced","where":"SIM.new"},{"id":"5-2-1-3","title":"Leaders","text":"Each player places their Leader face-up.","sim":"enforced"},{"id":"5-2-1-4","title":"Who chooses","text":"Rock-paper-scissors or another fair way decides who chooses to go first or second.","sim":"by hand","where":"the setup screen"},{"id":"5-2-1-5-1","title":"At the start of the game","text":"Leader effects that say \u2019At the start of the game\u2019 are processed now, the chooser\u2019s first.","sim":"not modelled"},{"id":"5-2-1-6","title":"Opening hand and redraw","text":"Each player draws 5; starting with the first player, each may once return all 5, reshuffle and draw 5.","sim":"enforced","where":"SIM.mulligan, SIM.who"},{"id":"5-2-1-7","title":"Life","text":"Each player places Life equal to the Leader\u2019s Life from the top of the deck, the deck\u2019s top card at the bottom of Life.","sim":"enforced","where":"SIM.placeLife"},{"id":"5-2-1-8","title":"The first turn","text":"The first player begins their turn.","sim":"enforced"},{"id":"6","title":"Game progression","text":"The turn player plays the five phases in order: Refresh, Draw, DON!!, Main, End.","sim":"enforced","where":"SIM.startTurn"},{"id":"6-1","title":"A turn","text":"Refresh Phase, Draw Phase, DON!! Phase, Main Phase, End Phase.","sim":"enforced","where":"SIM.startTurn"},{"id":"6-2","title":"Refresh Phase","text":"Effects \u2019until the start of your next turn\u2019 end; \u2019at the start of your turn\u2019 effects activate; given DON!! return to your cost area rested; then every rested card of yours is set active.","sim":"partial","where":"SIM.startTurn (\u2019at the start of your turn\u2019 is by hand)"},{"id":"6-2-1","title":"Until your next turn ends","text":"Effects lasting \u2019until the start of your next turn\u2019 end in your Refresh Phase.","sim":"enforced","where":"SIM.startTurn"},{"id":"6-2-3","title":"Given DON!! come home","text":"DON!! given to your Leader and Characters return to your cost area, rested.","sim":"enforced","where":"SIM.startTurn"},{"id":"6-2-4","title":"Everything stands up","text":"All your rested Leader, Characters, Stage and DON!! are set active.","sim":"enforced","where":"SIM.startTurn"},{"id":"6-3","title":"Draw Phase","text":"Draw 1. The first player does not draw on their first turn.","sim":"enforced","where":"SIM.startTurn"},{"id":"6-3-1","title":"Draw one","text":"The turn player draws 1; the first player skips it on their first turn.","sim":"enforced","where":"SIM.startTurn"},{"id":"6-4","title":"DON!! Phase","text":"Place 2 DON!! from the DON!! deck in the cost area, face-up (1 for the first player\u2019s first turn; only what the DON!! deck has).","sim":"enforced","where":"SIM.startTurn"},{"id":"6-4-1","title":"Two DON!!","text":"Place 2 DON!! face-up in the cost area; the first player places 1 on their first turn.","sim":"enforced","where":"SIM.startTurn"},{"id":"6-4-2","title":"One left","text":"With 1 card in the DON!! deck, place 1.","sim":"enforced","where":"SIM.startTurn"},{"id":"6-4-3","title":"None left","text":"With 0 cards in the DON!! deck, place none.","sim":"enforced","where":"SIM.startTurn"},{"id":"6-5","title":"Main Phase","text":"In any order, as often as you like: play cards, activate effects, give DON!!, battle. Declare the end to go to the End Phase.","sim":"enforced","where":"SIM.legal"},{"id":"6-5-2-1","title":"Ending the Main Phase","text":"Declaring the end of the Main Phase moves to the End Phase.","sim":"enforced","where":"SIM.act(\u2019end\u2019)"},{"id":"6-5-3","title":"Play a card","text":"Pay the cost to play a Character or Stage, or to use an Event with [Main], from your hand.","sim":"enforced","where":"SIM.canPlay"},{"id":"6-5-3-1","title":"What the Main Phase plays","text":"Characters, Stages, and Events marked [Main].","sim":"enforced","where":"SIM.canPlay"},{"id":"6-5-4","title":"Activate an effect","text":"The turn player may activate [Main] and [Activate: Main] effects.","sim":"enforced","where":"SIM.act(\u2019activate\u2019)"},{"id":"6-5-5","title":"Give DON!!","text":"Place an active DON!! from your cost area under your Leader or a Character. Do it as often as you can.","sim":"enforced","where":"SIM.giveDon"},{"id":"6-5-5-1","title":"How to give","text":"One active DON!! from the cost area, under the Leader or a Character, still visible.","sim":"enforced","where":"SIM.giveDon"},{"id":"6-5-5-2","title":"+1000 on your turn","text":"A Leader or Character gains 1000 power during your turn for each DON!! given to it. On the opponent\u2019s turn it gains nothing.","sim":"enforced","where":"SIM.power"},{"id":"6-5-5-4","title":"A card that leaves","text":"When a card with given DON!! moves to another area, its DON!! go to the cost area, rested.","sim":"enforced","where":"SIM.leave"},{"id":"6-5-6","title":"Battle","text":"Attack during the Main Phase (7).","sim":"enforced"},{"id":"6-5-6-1","title":"No battle on a first turn","text":"Neither player can battle on their own first turn.","sim":"enforced","where":"SIM.canAttack"},{"id":"6-6","title":"End Phase","text":"[End of Your Turn] effects resolve, then the other player\u2019s [End of Your Opponent\u2019s Turn]; each only once. Then what lasts \u2019this turn\u2019 ends, and the other player\u2019s turn begins.","sim":"enforced","where":"SIM.act(\u2019end\u2019), SIM.endTurn"},{"id":"6-6-1-1","title":"End Phase effects","text":"[End of Your Turn] and [End of Your Opponent\u2019s Turn] effects activate and resolve once each, the turn player\u2019s first, each player choosing their own order.","sim":"enforced","where":"SIM.act(\u2019end\u2019)"},{"id":"6-6-1-1-2","title":"Whose End Phase effects first","text":"The turn player\u2019s [End of Your Turn] effects, then the other player\u2019s [End of Your Opponent\u2019s Turn] effects.","sim":"enforced","where":"SIM.act(\u2019end\u2019)"},{"id":"6-6-1-3","title":"This turn ends","text":"Effects lasting \u2019during this turn\u2019 end, the turn player\u2019s first.","sim":"enforced","where":"SIM.endTurn"},{"id":"7","title":"Attacks and battles","text":"An attack runs the Attack, Block, Counter and Damage Steps, then the battle ends.","sim":"enforced"},{"id":"7-1","title":"Attacking","text":"In your Main Phase, rest your active Leader or an active Character to attack the opponent\u2019s Leader or one of their rested Characters. The battle then runs the Attack, Block, Counter and Damage Steps.","sim":"enforced","where":"SIM.attack"},{"id":"7-1-1","title":"Attack Step","text":"Declare the attack by resting the attacker, choose the target, then [When Attacking] and [On Your Opponent\u2019s Attack] effects activate.","sim":"enforced","where":"SIM.act(\u2019attack\u2019)"},{"id":"7-1-1-1","title":"The attacker rests","text":"Only an active Leader or Character attacks, and it is rested to do so.","sim":"enforced","where":"SIM.canAttack"},{"id":"7-1-1-2","title":"The target","text":"The opponent\u2019s Leader, or one of their rested Characters.","sim":"enforced","where":"SIM.targets"},{"id":"7-1-1-3","title":"Attack Step effects","text":"[When Attacking], \u2019when you attack\u2019, [On Your Opponent\u2019s Attack] and \u2019when attacked\u2019 effects activate.","sim":"enforced","where":"SIM.act(\u2019attack\u2019)"},{"id":"7-1-1-4","title":"A card leaves in the Attack Step","text":"If the attacker or the target has left its area by the end of the Attack Step, skip to the end of the battle.","sim":"enforced","where":"SIM.track"},{"id":"7-1-2","title":"Block Step","text":"The attacked player may activate one [Blocker] once in that battle; [On Block] effects then activate.","sim":"enforced","where":"SIM.blockers, SIM.block"},{"id":"7-1-2-3","title":"A card leaves in the Block Step","text":"If the attacker or the target has left, skip to the end of the battle.","sim":"enforced","where":"SIM.track"},{"id":"7-1-3","title":"Counter Step","text":"The attacked player may, as often as they like, trash Characters with a Counter value from hand to add that power for the battle, and pay for and use [Counter] Events.","sim":"enforced","where":"SIM.counter, SIM.playCounterEvent"},{"id":"7-1-3-1-1","title":"Counter from hand","text":"Trash a Character with a Counter value from hand; its value is added to the Leader or 1 Character for the battle.","sim":"enforced","where":"SIM.counter"},{"id":"7-1-3-1-2","title":"[Counter] Events","text":"Pay the Event\u2019s cost, trash it, and activate its [Counter] effect.","sim":"enforced","where":"SIM.playCounterEvent"},{"id":"7-1-3-1-3","title":"A card leaves in the Counter Step","text":"If the attacker or the target has left, skip to the end of the battle.","sim":"enforced","where":"SIM.resolve"},{"id":"7-1-4","title":"Damage Step","text":"If the attacker\u2019s power is equal or higher, it wins: a Leader takes 1 damage, a Character is K.O.\u2019d. Otherwise nothing happens.","sim":"enforced","where":"SIM.resolve"},{"id":"7-1-4-1","title":"Ties go to the attacker","text":"The attacker wins when its power is greater than or equal to the defender\u2019s.","sim":"enforced","where":"SIM.resolve"},{"id":"7-1-4-1-1-1","title":"No Life when damage comes","text":"If the opponent has 0 Life when the damage is determined, the attacker wins the game.","sim":"enforced","where":"SIM.resolve"},{"id":"7-1-4-1-1-2","title":"Taking the Life card","text":"With 1 or more Life, the top Life card goes to hand, or its [Trigger] is revealed and activated instead.","sim":"enforced","where":"SIM.resolve"},{"id":"7-1-4-1-1-3","title":"Two damage","text":"With 2 or more damage ([Double Attack]), the Life step repeats that many times. At 1 Life the last card is taken and the game goes on.","sim":"enforced","where":"SIM.resolve"},{"id":"7-1-5","title":"End of the Battle","text":"The battle ends; \u2019at the end of this battle\u2019 effects activate; effects lasting \u2019during this battle\u2019 end.","sim":"enforced","where":"SIM.endBattle"},{"id":"8","title":"Activating and resolving effects","text":"The kinds of effect, their costs and conditions, and the order they resolve in.","sim":"enforced"},{"id":"8-1","title":"Effects","text":"An effect is what a card\u2019s text and its cost command. \u2019May\u2019 and \u2019up to\u2019 let a player not use it; otherwise it must be used as far as possible.","sim":"enforced"},{"id":"8-1-3-1","title":"Auto effects","text":"Activate once, by themselves, each time their timing happens: [On Play], [When Attacking], [On Block], [On K.O.], [End of Your Turn], [End of Your Opponent\u2019s Turn].","sim":"enforced","where":"SIM.offers"},{"id":"8-1-3-1-3","title":"A card that moved","text":"An auto effect does not activate if its card moved to another area before it activated.","sim":"enforced","where":"SIM.apply (by instance)"},{"id":"8-1-3-2","title":"Activate effects","text":"Used by the player in the Main Phase: [Activate: Main] and [Main].","sim":"enforced","where":"SIM.act(\u2019activate\u2019)"},{"id":"8-1-3-3","title":"Permanent effects","text":"Always on while their conditions hold, such as \u2019[DON!! x1] This Character gains +1000 power.\u2019","sim":"partial","where":"SIM.power, SIM.kwOf, a condition in words included (ST09-001); a continuous line no template reads is kept and the board says it is the player\u2019s to apply (SIM.unapplied)"},{"id":"8-1-3-4","title":"Replacement effects","text":"Effects that say \u2019instead\u2019. The card that made the replacement first, then the turn player\u2019s, then the other player\u2019s; the same replacement never twice.","sim":"by hand"},{"id":"8-1-3-4-4","title":"A replacement mid-effect","text":"A replacement replaces all of the processing it names; the rest of the text continues after it.","sim":"by hand"},{"id":"8-1-4","title":"One-shot and continuous","text":"A one-shot effect finishes at once; a continuous one lasts for its stated time.","sim":"enforced","where":"SIM.mod"},{"id":"8-2","title":"Valid and invalid effects","text":"An effect made invalid does not happen, asks no choice and takes no cost. Effects already resolved stay resolved.","sim":"by hand"},{"id":"8-3","title":"Activation cost and conditions","text":"What comes before the colon is the activation cost, paid in order. A cost that cannot be paid in full cannot be paid at all. \u2019You may\u2019 costs can be declined, which declines the effect.","sim":"enforced","where":"SIM.canPay, SIM.apply"},{"id":"8-3-1-1","title":"Several costs","text":"An activation cost of several actions is paid in order, from the first printed; once begun it is paid in full.","sim":"enforced","where":"SIM.costsPayable; act(\u2019fxskip\u2019) refused while a begun cost can be paid"},{"id":"8-3-1-3","title":"A cost that cannot be paid","text":"If any of the activation cost cannot be paid, none of it is paid and the effect is not activated.","sim":"enforced","where":"SIM.canPay"},{"id":"8-3-1-5","title":"The rest-DON!! symbol","text":"Rest that many active DON!! from your cost area.","sim":"enforced","where":"SIM.DO.cost_restdon; several costs in a row are paid in order and in full (SIM.costsPayable, act fxskip)"},{"id":"8-3-1-6","title":"DON!! -X","text":"Return X DON!! from your Leader, Characters and cost area to your DON!! deck.","sim":"enforced","where":"SIM.DO.cost_returndon"},{"id":"8-3-2","title":"Conditions","text":"[DON!! xX], [Your Turn], [Opponent\u2019s Turn] and the like must all be met; \u2019if\u2019 clauses too.","sim":"enforced","where":"SIM.condOk"},{"id":"8-3-2-3","title":"[DON!! xX]","text":"Met while this card has X or more DON!! given to it.","sim":"enforced","where":"SIM.condOk"},{"id":"8-4","title":"Activating and resolving","text":"Meet the conditions, name the effect (reveal it if from hand), pay the costs, activate, resolve. An Event is trashed first. Choices are made while resolving.","sim":"enforced","where":"SIM.act"},{"id":"8-4-2","title":"An Event\u2019s effect","text":"Trash the Event, then carry out its effect.","sim":"enforced","where":"SIM.play"},{"id":"8-4-4-1","title":"Choosing","text":"Choose as many as you can up to the number; with \u2019up to\u2019, 0 is allowed.","sim":"enforced","where":"SIM.apply"},{"id":"8-4-5","title":"Moving to an open area","text":"Auto effects that trigger on a card moving activate only if it moved to an open area (such as [On K.O.]).","sim":"enforced"},{"id":"8-6","title":"Order of resolution","text":"When both players\u2019 effects trigger together, the turn player\u2019s resolve first; effects triggered while resolving wait their turn in that order.","sim":"enforced","where":"SIM.queue, SIM.who"},{"id":"8-6-2","title":"Triggers during damage","text":"Effects triggered during damage wait until all the damage is done; a [Trigger] may pause the damage to be revealed and used.","sim":"enforced","where":"SIM.act(\u2019resolve\u2019)"},{"id":"9","title":"Rule processing","text":"What the rules do on their own the moment it happens: the defeat checks.","sim":"enforced","where":"SIM.rules"},{"id":"9-1","title":"Rule processing","text":"Done automatically the moment its event happens, even in the middle of other actions.","sim":"enforced","where":"SIM.rules (after every act)"},{"id":"9-2-1","title":"Defeat judgment","text":"Every player who meets a defeat condition loses; if both do, both lose.","sim":"enforced","where":"SIM.rules"},{"id":"9-2-1-1","title":"Damage at 0 Life","text":"A Leader taking damage with 0 Life cards.","sim":"enforced","where":"SIM.resolve"},{"id":"9-2-1-2","title":"An empty deck","text":"0 cards in the deck is a defeat at once, not only when a draw fails.","sim":"enforced","where":"SIM.rules"},{"id":"10","title":"Keyword effects and keywords","text":"The keyword effects ([Rush], [Double Attack], [Banish], [Blocker], [Trigger], [Rush: Character], [Unblockable]) and the keywords of timing and condition.","sim":"enforced"},{"id":"10-1-1","title":"[Rush]","text":"This Character can attack on the turn it is played.","sim":"enforced","where":"SIM.canAttack"},{"id":"10-1-2","title":"[Double Attack]","text":"Damage this card deals to a Leader is 2.","sim":"enforced","where":"SIM.resolve"},{"id":"10-1-3","title":"[Banish]","text":"Life cards this card\u2019s damage takes are trashed instead of going to hand, and their [Trigger] does not activate.","sim":"enforced","where":"SIM.resolve"},{"id":"10-1-4","title":"[Blocker]","text":"When another of your cards is attacked, rest this card in the Block Step to become the new target.","sim":"enforced","where":"SIM.blockers"},{"id":"10-1-4-1","title":"Blocking for another card","text":"A [Blocker] protects one of your other cards; it cannot block an attack on itself.","sim":"enforced","where":"SIM.blockers"},{"id":"10-1-5","title":"[Trigger]","text":"On taking damage, reveal the Life card and use its [Trigger] instead of adding it to hand, or add it to hand without revealing. A used [Trigger] card is trashed afterwards.","sim":"enforced","where":"SIM.act(\u2019resolve\u2019), SIM.apply; SIM.view (the other seat sees only that a [Trigger] waits; take 123)"},{"id":"10-1-5-3","title":"After a [Trigger]","text":"The card is in no area while its [Trigger] resolves, then it is trashed unless told otherwise.","sim":"enforced","where":"SIM.apply, SIM.act(\u2019handdone\u2019)"},{"id":"10-1-6","title":"[Rush: Character]","text":"This Character can attack Characters on the turn it is played.","sim":"enforced","where":"SIM.canAttack, SIM.targets"},{"id":"10-1-7","title":"[Unblockable]","text":"The opponent cannot activate [Blocker] against this card\u2019s attack.","sim":"enforced","where":"SIM.blockers"},{"id":"10-2","title":"Keywords","text":"K.O., the timings ([Activate: Main], [Main], [Counter], [When Attacking], [On Play], [End of Your Turn], [End of Your Opponent\u2019s Turn], [On Block], [On Your Opponent\u2019s Attack], [On K.O.]), the conditions ([DON!! xX], [Your Turn], [Opponent\u2019s Turn]), DON!! -X, [Once Per Turn] and Trash.","sim":"enforced"},{"id":"10-2-1","title":"K.O.","text":"A Character trashed by losing a battle or by an effect that says K.O. [On K.O.] and \u2019cannot be K.O.\u2019d\u2019 apply only to those; trashed any other way is not a K.O.","sim":"enforced","where":"SIM.resolve, SIM.DO.ko"},{"id":"10-2-2","title":"[Activate: Main]","text":"Can be activated in your Main Phase, but not during a battle.","sim":"enforced","where":"SIM.act(\u2019activate\u2019)"},{"id":"10-2-3","title":"[Main]","text":"Found on Events: used from hand in your Main Phase, not during a battle.","sim":"enforced","where":"SIM.canPlay"},{"id":"10-2-4","title":"[Counter]","text":"Found on Events: used from hand in the Counter Step when your card is attacked. An effect cannot use it unless it says \u2019activate [Counter]\u2019.","sim":"enforced","where":"SIM.counterEvents"},{"id":"10-2-5","title":"[When Attacking]","text":"Activates when you declare an attack in your Attack Step.","sim":"enforced","where":"SIM.act(\u2019attack\u2019)"},{"id":"10-2-6","title":"[On Play]","text":"Activates when the card is played.","sim":"enforced","where":"SIM.act(\u2019play\u2019)"},{"id":"10-2-7","title":"[End of Your Turn]","text":"Activates in your End Phase.","sim":"enforced","where":"SIM.act(\u2019end\u2019)"},{"id":"10-2-8","title":"[End of Your Opponent\u2019s Turn]","text":"Activates in your opponent\u2019s End Phase.","sim":"by hand","where":"SIM.act(\u2019end\u2019) offers it"},{"id":"10-2-9","title":"[DON!! xX]","text":"A condition met while this card has X or more DON!! given to it.","sim":"enforced","where":"SIM.condOk"},{"id":"10-2-10","title":"DON!! -X","text":"Return X DON!! from your Leader, Characters and cost area to your DON!! deck.","sim":"enforced","where":"SIM.DO.cost_returndon"},{"id":"10-2-11","title":"[Your Turn]","text":"A condition met during your turn.","sim":"enforced","where":"SIM.condOk"},{"id":"10-2-12","title":"[Opponent\u2019s Turn]","text":"A condition met during your opponent\u2019s turn.","sim":"enforced","where":"SIM.condOk"},{"id":"10-2-13","title":"[Once Per Turn]","text":"The effect can be activated and resolved once a turn, once for each card that has it. A card that leaves the field and returns is a new card and may use it again. If its cost fails mid-payment, it is still used.","sim":"enforced","where":"SIM.optKey, SIM.apply, SIM.act"},{"id":"10-2-13-4","title":"A card that returns","text":"A card that leaves the field after using its [Once Per Turn] effect and comes back is a different card and may use it again.","sim":"enforced","where":"SIM.optKey"},{"id":"10-2-14","title":"Trash","text":"Choose a card from the hand and place it in the trash.","sim":"enforced"},{"id":"10-2-15","title":"[On Block]","text":"Activates in the Block Step when you activate [Blocker].","sim":"enforced","where":"SIM.act(\u2019block\u2019)"},{"id":"10-2-16","title":"[On Your Opponent\u2019s Attack]","text":"Activates when your opponent declares an attack, after [When Attacking] and the other Attack Step effects.","sim":"by hand","where":"SIM.act(\u2019attack\u2019) offers it"},{"id":"10-2-17","title":"[On K.O.]","text":"When the card is K.O.\u2019d on the field, the effect is activated there if its conditions are met; the card is trashed and the effect resolves from the trash.","sim":"enforced","where":"SIM.act(\u2019resolve\u2019), SIM.DO.ko"},{"id":"11-1","title":"Infinite loops","text":"If nobody can stop a loop, the game is a draw. If one player can, they say how many times it runs. If both can, the smaller number runs.","sim":"not modelled"},{"id":"11-2","title":"Revealing cards","text":"A card moved from one secret area to another is always revealed.","sim":"by hand"},{"id":"11-3","title":"Looking at secret areas","text":"Only the effect\u2019s player looks, the cards stay in their area while looked at, and cards not moved go back as they were.","sim":"enforced","where":"SIM.DO.search, SIM.act(\u2019handdone\u2019)"},{"id":"11-3-2","title":"Looked-at cards stay put","text":"Cards being looked at remain in their area while looked at (a deck being searched is not empty).","sim":"enforced","where":"SIM.rules"},{"id":"11-3-3","title":"Back as they were","text":"After looking, cards the text does not move go back to their area as they were.","sim":"enforced","where":"SIM.act(\u2019handdone\u2019)"}]};
function verNewer(a, b) { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let k = 0; k < 3; k++) if ((x[k] || 0) !== (y[k] || 0)) return (x[k] || 0) > (y[k] || 0); return false; }
const RULES_DB = {
  official: readJson('vault.rulesOfficial', null, false),
  cur() { const s = readJson('vault.rules', null, false); return s && Array.isArray(s.sections) && s.version && verNewer(s.version, RULEBOOK.version) ? s : RULEBOOK; },
  simOf(id) { const s = RULEBOOK.sections.find(x => x.id === id); return s ? s.sim : 'not reviewed for this version of the app'; },
  find(q) { const norm = x => String(x || '').toLowerCase().replace(/\u2019/g, "'"); const t = norm(q).trim().replace(/^\u00a7/, ''); const all = this.cur().sections; if (!t) return all;
    if (/^\d+(-\d+)*$/.test(t)) return all.filter(s => s.id === t || s.id.startsWith(t + '-'));
    const words = t.split(/\s+/); return all.filter(s => { const hay = norm(`${s.id} ${s.title} ${s.text}`); return words.every(w => hay.includes(w)); }); },
  async sync() { const base = CAT.man.updateUrl; if (!base) return { ok: false, why: 'Sync is not configured' }; if (!navigator.onLine) return { ok: false, why: 'No connection' };
    try { const r = await fetch(base + 'rules.json', { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); const d = await r.json();
      if (!d || !Array.isArray(d.sections) || !d.version) throw new Error('not a rules file');
      this.official = Object.assign({ at: new Date().toISOString() }, d.official || {}); saveJson('vault.rulesOfficial', this.official);
      const newer = verNewer(d.version, this.cur().version);
      if (newer) saveJson('vault.rules', { version: d.version, date: d.date, title: d.title, url: d.url, note: d.note, sections: d.sections });
      return { ok: true, newer, version: d.version }; }
    catch (e) { ERRS.push('rules', `the rules check failed: ${e.message || e}`, 'rules'); return { ok: false, why: `Could not check \u2014 ${e.message || e}` }; } } };
function rulesStatus() { const b = RULES_DB.cur(), o = RULES_DB.official;
  const own = `The app\u2019s digest of the Comprehensive Rules v${b.version} (${dayText(b.date, { year: true })}); the official text governs, and card text beats the rules.`;
  if (!o || !o.version) return own + (o && o.why ? ` The last check could not read the official PDF (${esc(o.why)}).` : '');
  return own + (verNewer(o.version, b.version) ? ` <b>Bandai has published v${esc(o.version)}${o.date ? ' (' + dayText(o.date, { year: true }) + ')' : ''}</b>; the Sim plays by v${b.version} until an update reviews it.` : ` The official PDF is v${esc(o.version)} too (checked ${dayText(String(o.checked || '').slice(0, 10))}).`); }
function paintRules(q) { const list = RULES_DB.find(q); $('#rulesSrc').innerHTML = rulesStatus();
  $('#rulesList').innerHTML = list.length ? list.map(s => `<div class="row" id="rule-${s.id}"><div class="nm"><b>\u00a7${s.id} ${esc(s.title)}</b><span style="display:block">${esc(s.text)}</span><span class="note" style="display:block">In the Sim: ${esc(RULES_DB.simOf(s.id))}</span></div></div>`).join('')
    : `<div class="note">No section says \u201c${esc(q)}\u201d. Try a keyword ([Blocker]), a word (Life) or a number (6-5-5).</div>`; }
function openRules(id) { const q = id || ''; $('#rulesQ').value = q; paintRules(q); $('#rulesSheet').classList.add('on'); }
$('#rulesQ').addEventListener('input', e => paintRules(e.target.value));
$('#rulesSync').addEventListener('click', async () => { const n = $('#rulesSyncNote'); n.textContent = 'Checking\u2026'; const r = await RULES_DB.sync();
  n.textContent = r.ok ? (r.newer ? `Updated to v${r.version}.` : `Up to date (v${RULES_DB.cur().version}).`) : r.why; paintRules($('#rulesQ').value); });

const SIM = {
  g: null, uid: 0, RULES: '1.2.1',

  inst(id, turn) { return { id, rested: false, don: 0, turn, uid: ++this.uid }; },

  at(P, ref) { if (ref === 'leader') return P.leader; if (ref === 'stage') return P.stage; return ref == null ? null : P.chars[ref] || null; },
  keyOf(P, ref) { const o = this.at(P, ref); return ref === 'leader' ? 'leader' : (o ? 'u' + o.uid : null); },
  refOf(P, uid) { if (uid == null) return null; if (P.leader.uid === uid) return 'leader'; if (P.stage && P.stage.uid === uid) return 'stage'; const k = P.chars.findIndex(c => c.uid === uid); return k >= 0 ? k : null; },

  chacha(key, n, nonce = [0, 0, 0]) { const s = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574, ...key, n >>> 0, ...nonce], x = s.slice(), R = (v, b) => (v << b) | (v >>> (32 - b));
    const Q = (a, b, c, d) => { x[a] = (x[a] + x[b]) | 0; x[d] = R(x[d] ^ x[a], 16); x[c] = (x[c] + x[d]) | 0; x[b] = R(x[b] ^ x[c], 12); x[a] = (x[a] + x[b]) | 0; x[d] = R(x[d] ^ x[a], 8); x[c] = (x[c] + x[d]) | 0; x[b] = R(x[b] ^ x[c], 7); };
    for (let i = 0; i < 10; i++) { Q(0, 4, 8, 12); Q(1, 5, 9, 13); Q(2, 6, 10, 14); Q(3, 7, 11, 15); Q(0, 5, 10, 15); Q(1, 6, 11, 12); Q(2, 7, 8, 13); Q(3, 4, 9, 14); }
    return x.map((v, i) => (v + s[i]) >>> 0); },
  wideSeed(v) { return Array.isArray(v) && v.length === 8 && v.every(w => Number.isInteger(w) && w >= 0 && w <= 0xFFFFFFFF); },
  rand() { const g = this.g; if (typeof g.rs !== 'number') { const k = g.rs.n++; return this.chacha(g.rs.k, Math.floor(k / 16))[k % 16] / 4294967296; }
    let t = (g.rs = (g.rs + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  card(id) { return CAT.byId.get(id); },

  lines(text) { const tag = /(?<=[.)])\s+(?=\[(?:Trigger|On Play|When Attacking|Activate\s*:\s*Main|On K\.O\.|Main|Counter|On Block|End of Your Turn|End of Your Opponent['\u2019]s Turn|On Your Opponent['\u2019]s Attack|DON!!\s*[xX\u00d7]\s*\d|Your Turn|Opponent['\u2019]s Turn)\])/i;
    return String(text || '').split(/\n\s*\n|\n/).flatMap(c => c.trim().split(tag)).map(c => c.trim()).filter(c => c.startsWith('[') && !/^\[(Blocker|Rush|Double Attack|Banish|Unblockable|Rush: Character)\]\s*\(/.test(c)); },

  expand(deck) { const ids = []; for (const c of deck.cards) if (this.card(c.id)) for (let k = 0; k < c.n; k++) ids.push(c.id); return ids; },

  new(deckA, deckB, first = 0, opts = {}) {
    const wide = this.wideSeed(opts.seed), seed = wide ? opts.seed.slice() : (opts.seed != null ? opts.seed : Math.floor(Math.random() * 4294967296)) >>> 0; this.uid = 0;
    const spec = { v: 1, take: TAKE, rules: this.RULES, seed, first, bot: opts.bot != null ? opts.bot : null,
      decks: [deckA, deckB].map(d => ({ name: d.name || '', leader: d.leader, cards: d.cards.map(c => ({ id: c.id, n: c.n })) })) };
    this.g = { spec, seed, rs: wide ? { k: seed.slice(), n: 0 } : seed, turn: 0, first, active: first, phase: 'mulligan', players: [], battle: null, log: [], over: null, queue: [], after: null, hand: null, last: null, start: null, actions: [] };
    if (opts.bot != null) this.g.bot = opts.bot;
    this.g.players = [deckA, deckB].map((d, i) => this.player(d.name || `Player ${i + 1}`, d.leader, this.shuffle(this.expand(d))));
    this.g.players.forEach((P, i) => this.draw(i, 5));
    return this.g; },

  player(name, leaderId, deck) { return { name, deckName: name, deck, hand: [], life: [], trash: [], looking: [], leader: this.inst(leaderId, 0), chars: [], stage: null,
    donDeck: 10, don: { active: 0, rested: 0 }, mulliganed: null, modl: [], taken: 0, used: {}, lost: null }; },

  blank(players) { this.g = { spec: null, seed: 0, rs: 0, turn: 1, first: 0, active: 0, phase: 'main', players, battle: null, log: [], over: null, queue: [], after: null, hand: null, last: null, actions: [] }; return this.g; },
  P(i) { return this.g.players[i]; },
  log(m) { this.g.log.unshift(`T${this.g.turn} ${m}`); if (this.g.log.length > 200) this.g.log.pop(); },

  draw(i, n = 1) { const P = this.P(i); for (let k = 0; k < n; k++) { if (!P.deck.length) break; P.hand.push(P.deck.shift()); } },

  mulligan(i, yes) { const P = this.P(i); if (P.mulliganed !== null) return; P.mulliganed = !!yes;
    if (yes) { P.deck.push(...P.hand); P.hand = []; this.shuffle(P.deck); this.draw(i, 5); this.log(`${P.name} mulligans`); }
    if (this.g.players.every(x => x.mulliganed !== null)) { this.g.players.forEach((x, k) => this.placeLife(k)); this.startTurn(); } },

  placeLife(i) { const P = this.P(i); const L = this.card(P.leader.id); const n = (L && this.num(L.life)) || 5; P.life = P.deck.splice(0, n).reverse(); },
  firstTurnOf(i) { return this.P(i).taken === 1; },

  startTurn() { const g = this.g; g.turn++; const i = g.active; const P = this.P(i); P.taken++;

    g.players.forEach(X => { X.modl = X.modl.filter(m => m.until !== 'refresh:' + i); });
    let back = P.leader.don; P.leader.don = 0; P.leader.rested = false;
    for (const c of P.chars) { back += c.don; c.don = 0; c.rested = false; }
    if (P.stage) P.stage.rested = false; P.don.active += P.don.rested + back; P.don.rested = 0;

    const first = g.turn === 1 && i === g.first, had = P.hand.length; if (!first) this.draw(i, 1);
    g.phase = 'main'; this.rules(); if (g.over !== null) return;

    const add = Math.min(P.donDeck, first ? 1 : 2); P.donDeck -= add; P.don.active += add;

    g.start = { turn: g.turn, i, drew: P.hand.length - had, don: add, first };
    g.battle = null; this.log(`${P.name} \u2014 turn ${g.turn}: refresh, ${first ? 'no draw on the first turn (§6-3-1)' : 'draw 1'}, ${add ? `+${add} DON!!` : 'the DON!! deck is empty'}`); },

  endTurn() { const g = this.g; if (g.phase !== 'main') return false; this.log(`${this.P(g.active).name} ends the turn`);
    g.players.forEach(X => { X.modl = X.modl.filter(m => m.until !== 'endturn' && m.until !== 'endbattle'); });
    g.active = 1 - g.active; g.after = null; this.startTurn(); return true; },

  mod(i, key, n, dur, extra) { const P = this.P(i);
    P.modl.push(Object.assign({ key, n, until: dur === 'nextturn' ? 'refresh:' + i : (dur === 'permanent' ? 'never' : (dur === 'battle' ? 'endbattle' : 'endturn')) }, extra || {})); },
  cost(p) { const c = parseInt(p.cost, 10); return isNaN(c) ? 0 : c; },
  num(v) { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; },
  power(i, ref) { const P = this.P(i); const o = ref === 'leader' ? P.leader : P.chars[ref]; if (!o) return 0; const p = this.card(o.id);

    const stat = this.fx(o.id).filter(e => e.t === 'static' && e.do[0] && e.do[0].a === 'selfpower' && e.if.every(c => this.condOk(i, o, c))).reduce((a, e) => a + e.do[0].n, 0);
    const key = this.keyOf(P, ref);

    const don = this.g.active === i ? 1000 * o.don : 0;
    return this.num(p.power) + don + stat + P.modl.filter(m => m.key === key && m.n != null).reduce((a, m) => a + m.n, 0); },

  kwOf(i, ref) { const P = this.P(i); const o = ref === 'leader' ? P.leader : P.chars[ref]; if (!o) return []; const p = this.card(o.id); const key = this.keyOf(P, ref);
    const printed = (p.kw || '').split('|').filter(Boolean);
    const stat = this.fx(o.id).filter(e => e.t === 'static' && e.do[0] && e.do[0].a === 'selfkw' && e.if.every(c => this.condOk(i, o, c))).map(e => e.do[0].k);
    const timed = P.modl.filter(m => m.key === key && m.kw).map(m => m.kw);
    return printed.concat(stat, timed); },
  has(i, ref, k) { return this.kwOf(i, ref).includes(k); },

  effCost(X, k) { const c = X.chars[k]; if (!c) return 0; return Math.max(0, this.cost(this.card(c.id)) + X.modl.filter(m => m.key === 'u' + c.uid && m.cost != null).reduce((a, m) => a + m.cost, 0)); },

  evTiming(p, t) { return this.fx(p.id).some(e => e.t === t) || new RegExp('(^|\\n)\\s*\\[' + (t === 'evmain' ? 'Main' : 'Counter') + '\\]').test(p.text || ''); },

  canPlay(i, h) { const g = this.g; if (g.phase !== 'main' || g.active !== i) return { ok: false, why: 'not your Main Phase (§6-5-3)' };
    const P = this.P(i), p = this.card(P.hand[h]); if (!p) return { ok: false, why: 'unknown card' };
    if (p.type === 'Leader') return { ok: false, why: 'a Leader is never played from hand (§3-6-1)' };
    if (p.type === 'Event' && !this.evTiming(p, 'evmain')) return { ok: false, why: this.evTiming(p, 'evcounter') ? 'a [Counter] Event is used in the Counter Step (§10-2-4)' : 'an Event is used in the Main Phase only with [Main] (§6-5-3-1)' };
    const c = this.cost(p); if (P.don.active < c) return { ok: false, why: `costs ${c} DON!!, ${P.don.active} active (§2-7)` };
    return { ok: true, cost: c, full: p.type === 'Character' && P.chars.length >= 5 }; },
  play(i, h, opts = {}) { const v = this.canPlay(i, h); if (!v.ok) return v; const P = this.P(i);
    if (v.full && !(opts.trash >= 0 && opts.trash < P.chars.length)) return { ok: false, why: 'five Characters: choose one to trash first (§3-7-6-1)', need: 'trash' };
    const id = P.hand.splice(h, 1)[0]; const p = this.card(id);
    P.don.active -= v.cost; P.don.rested += v.cost;
    if (v.full) this.room(P, opts.trash);
    let ref = null;
    if (p.type === 'Character') { P.chars.push(this.inst(id, this.g.turn)); ref = P.chars.length - 1; }
    else if (p.type === 'Stage') { this.placeStage(P, id); ref = 'stage'; }
    else P.trash.push(id);
    this.log(`${P.name} plays ${p.name} (${v.cost})`); return { ok: true, card: p, ref }; },

  room(P, k) { const t = this.leave(P, k, 'trash'); if (t) this.log(`${P.name} trashes ${this.card(t.id).name} to make room (§3-7-6-1)`); },

  placeStage(P, id) { if (P.stage) { P.trash.push(P.stage.id); P.modl = P.modl.filter(m => m.key !== 'u' + P.stage.uid); this.log(`${this.card(P.stage.id).name} is trashed for the new Stage (§3-8-5-1)`); } P.stage = this.inst(id, this.g.turn); },

  leave(X, k, to) { const c = X.chars.splice(k, 1)[0]; if (!c) return null;
    if (c.don) { X.don.rested += c.don; c.don = 0; }
    X.modl = X.modl.filter(m => m.key !== 'u' + c.uid);
    if (to === 'hand') X.hand.push(c.id); else if (to === 'bottom') X.deck.push(c.id); else if (to === 'top') X.deck.unshift(c.id); else if (to === 'life') X.life.unshift(c.id); else X.trash.push(c.id);
    return c; },

  onKO() { const a = this.g.active; return [a, 1 - a].flatMap(xi => { const X = this.P(xi);
    return ['leader'].concat(X.chars.map((c, k) => k), X.stage ? ['stage'] : []).flatMap(ref => this.offers(xi, 'whenko', ref)); }); },

  unapplied(id) { return this.fx(id).filter(e => e.hand && e.t === 'static'); },

  giveDon(i, ref) { const g = this.g; if (g.phase !== 'main' || g.active !== i) return { ok: false, why: 'your turn only (§6-5-5)' };
    const P = this.P(i); if (P.don.active < 1) return { ok: false, why: 'no active DON!! (§6-5-5-1)' }; const o = ref === 'leader' ? P.leader : P.chars[ref]; if (!o) return { ok: false, why: 'no such card' };
    P.don.active--; o.don++; this.log(`${P.name} gives DON!! to ${this.card(o.id).name}`); return { ok: true }; },

  canAttack(i, ref) { const g = this.g; if (g.phase !== 'main' || g.active !== i) return { ok: false, why: 'your Main Phase only (§6-5-6)' };
    if (this.firstTurnOf(i)) return { ok: false, why: 'no battle on your first turn (§6-5-6-1)' };
    const P = this.P(i); const o = ref === 'leader' ? P.leader : P.chars[ref]; if (!o) return { ok: false, why: 'no such card' };
    if (o.rested) return { ok: false, why: 'already rested (§7-1-1-1)' };
    if (ref !== 'leader' && o.turn === g.turn && !this.has(i, ref, 'Rush') && !this.has(i, ref, 'Rush: Character')) return { ok: false, why: 'played this turn and no Rush (§3-7-4)' };
    return { ok: true }; },

  targets(i, aref) { const O = this.P(1 - i), P = this.P(i); const a = aref == null ? null : (aref === 'leader' ? P.leader : P.chars[aref]);
    const charsOnly = !!a && aref !== 'leader' && a.turn === this.g.turn && !this.has(i, aref, 'Rush') && this.has(i, aref, 'Rush: Character');
    const t = charsOnly ? [] : [{ ref: 'leader', name: this.card(O.leader.id).name }]; O.chars.forEach((c, k) => { if (c.rested) t.push({ ref: k, name: this.card(c.id).name }); }); return t; },
  attack(i, ref, tref) { const v = this.canAttack(i, ref); if (!v.ok) return v; const O = this.P(1 - i);
    if (!this.targets(i, ref).some(t => t.ref === tref)) return { ok: false, why: 'only the Leader or a rested Character can be attacked (§7-1-1-2)' };
    const P = this.P(i); const a = ref === 'leader' ? P.leader : P.chars[ref]; a.rested = true; const d = tref === 'leader' ? O.leader : O.chars[tref];
    this.g.battle = { att: i, aref: ref, def: 1 - i, dref: tref, aUid: a.uid, dUid: d.uid, blocked: false, counter: 0, step: 'block' };
    this.g.phase = 'battle'; this.log(`${P.name}: ${this.card(a.id).name} attacks ${this.card(d.id).name}`); return { ok: true }; },

  locate() { const b = this.g.battle; if (!b) return null; const f = (X, uid, ref) => uid == null ? ref : this.refOf(X, uid);
    const aref = f(this.P(b.att), b.aUid, b.aref), dref = f(this.P(b.def), b.dUid, b.dref); return { aref, dref, ok: aref != null && dref != null }; },
  track() { const at = this.locate(); if (!at) return false; this.g.battle.aref = at.aref; this.g.battle.dref = at.dref; return at.ok; },

  blockers() { const b = this.g.battle, at = this.locate(); if (!b || b.step !== 'block' || !at.ok) return []; if (this.has(b.att, at.aref, 'Unblockable')) return []; const O = this.P(b.def);

    const nb = this.P(b.att).modl.filter(m => m.key === 'noblocker').map(m => m.noblk);
    const barred = k => nb.some(x => x.power == null || (x.cmp === 'more' ? this.power(b.def, k) >= x.power : this.power(b.def, k) <= x.power));
    return O.chars.map((c, k) => ({ k, c })).filter(x => !x.c.rested && this.has(b.def, x.k, 'Blocker') && x.k !== at.dref && !barred(x.k)).map(x => ({ ref: x.k, name: this.card(x.c.id).name })); },
  block(k) { const b = this.g.battle; if (!b || b.step !== 'block') return { ok: false, why: 'not the Block Step (§7-1-2)' };
    if (!this.blockers().some(x => x.ref === k)) return { ok: false, why: this.has(b.att, this.locate().aref, 'Unblockable') ? 'the attacker is Unblockable (§10-1-7)' : 'not an active Blocker (§10-1-4)' };
    this.track();
    const O = this.P(b.def); const c = O.chars[k]; c.rested = true; b.dref = k; b.dUid = c.uid; b.blocked = true; b.step = 'counter'; this.log(`${O.name}: ${this.card(c.id).name} blocks`); return { ok: true }; },
  noBlock() { const b = this.g.battle; if (b && b.step === 'block') b.step = 'counter'; },

  counterEvents() { const b = this.g.battle; if (!b || b.step !== 'counter') return []; const O = this.P(b.def);
    return O.hand.map((id, h) => ({ h, p: this.card(id) })).filter(x => x.p && x.p.type === 'Event' && this.evTiming(x.p, 'evcounter') && this.cost(x.p) <= O.don.active).map(x => ({ h: x.h, name: x.p.name, cost: this.cost(x.p) })); },
  playCounterEvent(h) { const b = this.g.battle; if (!b || b.step !== 'counter') return { ok: false, why: 'not the Counter Step (§7-1-3)' }; const O = this.P(b.def); const p = this.card(O.hand[h]);
    if (!p || p.type !== 'Event' || !this.evTiming(p, 'evcounter')) return { ok: false, why: 'not a [Counter] Event (§10-2-4)' }; const c = this.cost(p); if (O.don.active < c) return { ok: false, why: `costs ${c} DON!! (§7-1-3-1-2)` };
    O.hand.splice(h, 1); O.don.active -= c; O.don.rested += c; O.trash.push(p.id); this.log(`${O.name} plays ${p.name} [Counter]`); return { ok: true, id: p.id }; },

  counters() { const b = this.g.battle; if (!b || b.step !== 'counter') return []; const O = this.P(b.def);
    return O.hand.map((id, h) => ({ h, p: this.card(id) })).filter(x => x.p && x.p.type === 'Character' && this.num(x.p.counter) > 0).map(x => ({ h: x.h, name: x.p.name, plus: this.num(x.p.counter) })); },
  counter(h) { const b = this.g.battle; if (!b || b.step !== 'counter') return { ok: false, why: 'not the Counter Step (§7-1-3)' }; const O = this.P(b.def); const p = this.card(O.hand[h]);
    const plus = p && p.type === 'Character' ? this.num(p.counter) : 0; if (!plus) return { ok: false, why: 'no Counter value (§2-10)' }; O.hand.splice(h, 1); O.trash.push(p.id); b.counter += plus; this.log(`${O.name} counters with ${p.name} (+${plus})`); return { ok: true }; },
  battlePowers() { const b = this.g.battle, at = this.locate(); if (!b) return null; if (!at.ok) return { a: 0, d: 0, gone: true }; return { a: this.power(b.att, at.aref), d: this.power(b.def, at.dref) + b.counter }; },

  resolve() { const g = this.g, b = g.battle; if (!b) return null; const A = this.P(b.att), O = this.P(b.def);

    const kept = res => { g.last = Object.assign({ n: g.actions.length, turn: g.turn, att: b.att, def: b.def }, res); return res; };
    if (!this.track()) { this.log('the battle ends: a card in it has left the field (§7-1-3-1-3)'); this.endBattle(); return kept({ win: false, a: 0, d: 0, life: [], ko: null, gone: true }); }
    const { a, d } = this.battlePowers();
    const att = this.card((b.aref === 'leader' ? A.leader : A.chars[b.aref]).id); const res = { win: a >= d, a, d, life: [], ko: null };
    if (res.win) {
      if (b.dref === 'leader') { const n = this.has(b.att, b.aref, 'Double Attack') ? 2 : 1; const banish = this.has(b.att, b.aref, 'Banish');

        if (!O.life.length) { O.lost = 'damage'; this.log(`${O.name} takes damage with no Life cards \u2014 defeat (§7-1-4-1-1-1)`); }
        else for (let k = 0; k < n && O.life.length; k++) {
          const id = O.life.shift(); const lc = this.card(id);
          if (banish) O.trash.push(id); else O.hand.push(id);
          res.life.push({ id, name: lc ? lc.name : '?', trigger: !banish && !!(lc && hasKw(lc, 'Trigger')), banished: banish }); } }
      else { const c = this.leave(O, b.dref, 'trash'); res.ko = this.card(c.id).name; res.koId = c.id; this.log(`${res.ko} is K.O.'d`); }
    }
    this.log(`${att.name} ${a} vs ${d}: ${res.win ? 'hit' : 'held'}`); this.endBattle(); this.rules(); return kept(res); },

  endBattle() { const g = this.g; g.players.forEach(X => { X.modl = X.modl.filter(m => m.until !== 'endbattle'); }); g.battle = null; if (g.phase === 'battle') g.phase = 'main'; },

  rules() { const g = this.g; if (!g || g.over !== null) return;

    const setup = g.phase === 'mulligan', lost = g.players.map(X => X.lost || (!setup && !X.deck.length && !X.looking.length ? 'deck' : null));
    if (!lost.some(Boolean)) return;
    lost.forEach((w, k) => { if (w === 'deck') this.log(`${this.P(k).name} has no cards in the deck \u2014 defeat (§9-2-1-2)`); });
    g.over = lost[0] && lost[1] ? -1 : (lost[0] ? 1 : 0); g.phase = 'over'; g.battle = null; g.queue = []; g.hand = null; },

  fx(id) { const L = CAT.effects[String(id)] || []; const pr = CAT.proof[String(id)];
    return pr && pr.v === 'wrong' ? L.map(e => e.hand || e.t === 'static' ? e : Object.assign({}, e, { do: [], hand: true, wrong: pr.why || 'proven wrong' })) : L; },

  proofOf(id, e) { if (e && e.wrong) return 'wrong'; if (e && e.hand) return 'hand'; const pr = CAT.proof[String(id)]; return pr && pr.v === 'proven' ? 'proven' : 'unproven'; },

  optKey(i, ref, cardId, n) { const o = ref == null ? null : this.at(this.P(i), ref);
    return `${o ? 'u' + o.uid : 'c' + cardId}:${n}:${this.g.turn}`; },
  used(i, off) { return !!this.P(i).used[this.optKey(i, off.ref, off.cardId, off.n)]; },
  markUsed(i, off) { this.P(i).used[this.optKey(i, off.ref, off.cardId, off.n)] = true; },
  condOk(i, src, c) { const P = this.P(i), g = this.g; const L = this.card(P.leader.id);
    if (c.c === 'donx') return (src ? src.don : 0) >= c.n;
    if (c.c === 'opt') return true;
    if (c.c === 'yourturn') return g.active === i;
    if (c.c === 'oppturn') return g.active !== i;
    if (c.c === 'opplife') return this.P(1 - i).life.length <= c.max;
    if (c.c === 'donfield') return this.fieldDon(P) >= c.min;
    if (c.c === 'leadertype') return ((L && L.subtypes) || '').split(/[;/]/).map(x => x.trim()).includes(c.t);
    if (c.c === 'leadername') return !!L && L.name === c.name;
    if (c.c === 'life') return P.life.length <= c.max;
    if (c.c === 'trash') return P.trash.length >= c.min;
    if (c.c === 'donle') return this.fieldDon(P) <= this.fieldDon(this.P(1 - i));
    return false; },

  fieldDon(P) { return P.don.active + P.don.rested + P.leader.don + P.chars.reduce((a, x) => a + x.don, 0); },
  canPay(i, ref, d) { const P = this.P(i); if (!d || !/^cost_/.test(d.a)) return true;
    if (d.a === 'cost_restdon') return P.don.active >= d.n;
    if (d.a === 'cost_trashhand') return P.hand.length >= d.n;
    if (d.a === 'cost_returndon') return this.fieldDon(P) >= d.n;
    if (d.a === 'cost_restself') { const o = this.at(P, ref); return !!o && !o.rested; }
    return false; },

  costsPayable(i, ref, steps) { for (const d of steps || []) { if (!/^cost_/.test(d.a)) break; if (!this.canPay(i, ref, d)) return false; } return true; },

  TARGETED: ['ko', 'rest', 'bounce', 'bottom', 'power', 'costmod', 'givedon', 'playfromhand', 'trashhand'],

  targetsFor(i, d, src) { if (!d) return null; const O = this.P(1 - i), P = this.P(i);

    const fit = (X, k) => { const c = X.chars[k], p = this.card(c.id); return (d.cost == null || this.effCost(X, k) <= d.cost) && (d.power == null || this.power(X === P ? i : 1 - i, k) <= d.power) && (d.bpower == null || this.num(p.power) <= d.bpower) && (!d.rested || c.rested); };
    const opp = () => O.chars.map((c, k) => ({ ref: 'o' + k, name: this.card(c.id).name + ' (theirs)' })).filter((t, k) => fit(O, k));
    const own = () => P.chars.map((c, k) => ({ ref: 'm' + k, name: this.card(c.id).name })).filter((t, k) => fit(P, k));
    if (d.a === 'ko') return opp();
    if (d.a === 'rest') return opp().filter(t => !O.chars[+t.ref.slice(1)].rested);
    if (d.a === 'bounce' || d.a === 'bottom') return d.who === 'any' ? own().concat(opp()) : opp();
    if (d.a === 'power' && d.who === 'prev') return null;
    if (d.a === 'costmod') return opp();
    if (d.a === 'power') return d.who === 'opp' ? opp() : [{ ref: 'L', name: this.card(P.leader.id).name }].concat(own()).filter(t => !d.notself || t.ref !== (src === 'leader' ? 'L' : 'm' + src));
    if (d.a === 'givedon') return (d.who === 'chars' ? [] : [{ ref: 'L', name: this.card(P.leader.id).name }]).concat(d.who === 'leader' ? [] : P.chars.map((c, k) => ({ ref: 'm' + k, name: this.card(c.id).name })));
    if (d.a === 'trashhand' || d.a === 'cost_trashhand') return P.hand.map((id, h) => ({ ref: 'h' + h, name: this.card(id).name }));
    if (d.a === 'playfromhand') return P.hand.map((id, h) => ({ id, h, p: this.card(id) })).filter(x => x.p && x.p.type === 'Character' && (d.cost == null || this.cost(x.p) <= d.cost) && (d.power == null || this.num(x.p.power) <= d.power) && (!d.type || (x.p.subtypes || '').split(/[;/]/).map(y => y.trim()).includes(d.type))).map(x => ({ ref: 'h' + x.h, name: x.p.name + ' (' + this.cost(x.p) + 'c)' }));
    if (d.a === 'search') { const types = d.types || (d.type ? [d.type] : null);
      return P.deck.slice(0, d.n).map((id, k) => ({ id, k, p: this.card(id) })).filter(x => x.p
        && ((!types && !d.names) || (types || []).some(t => (x.p.subtypes || '').split(/[;/]/).map(y => y.trim()).includes(t)) || (d.names || []).includes(x.p.name))
        && (!d.name || x.p.name === d.name) && (!d.not || x.p.name !== d.not)
        && (d.cost_max == null || this.cost(x.p) <= d.cost_max) && (d.cost_min == null || this.cost(x.p) >= d.cost_min)).map(x => ({ ref: 'd' + x.k, name: x.p.name + (x.p.type ? ' (' + x.p.type + ')' : '') })); }
    return null; },

  targetsOf(o) { const ref = o.uid != null ? this.refOf(this.P(o.i), o.uid) : o.ref; return this.targetsFor(o.i, o.steps[o.step], ref); },
  offers(i, trigger, ref, cardId, fromLife) { const P = this.P(i); const src = ref == null ? null : this.at(P, ref); const id = cardId || (src && src.id);
    return this.fx(id).map((e, n) => ({ e, n })).filter(({ e }) => e.t === trigger)
      .filter(({ e }) => e.if.every(c => this.condOk(i, src, c)))
      .filter(({ e, n }) => !(e.if.some(c => c.c === 'opt') && this.used(i, { ref, cardId: id, n })))
      .filter(({ e }) => this.costsPayable(i, ref, e.do))
      .map(({ e, n }) => ({ i, e, n, ref, uid: src ? src.uid : null, cardId: id, fromLife: !!fromLife, hand: !!e.hand, steps: e.do, step: 0, targets: this.targetsFor(i, e.do[0], ref) })); },

  whyNot(i, trigger, ref, n) { const P = this.P(i), src = this.at(P, ref); const lines = src ? this.fx(src.id).map((e, k) => ({ e, k })).filter(x => x.e.t === trigger && (n == null || x.k === n)) : [];
    if (!lines.length) return 'no [Activate: Main] on this card (§10-2-2)';
    const { e, k } = lines[0];
    if (e.if.some(c => c.c === 'opt') && this.used(i, { ref, cardId: src.id, n: k })) return 'once per turn, and used this turn (§10-2-13)';
    const bad = e.if.find(c => !this.condOk(i, src, c)); if (bad) return `its condition is not met: ${this.describe({ t: trigger, if: [bad], do: [] }).replace(/^\[[^\]]*\] /, '').replace(/:\s*$/, '')} (§8-3-2)`;
    if (!this.costsPayable(i, ref, e.do)) return 'its cost cannot be paid (§8-3-1-3)';
    return 'not now (§10-2-2)'; },

  apply(i, offer, target, opts = {}) { const P = this.P(i), O = this.P(1 - i);
    if (offer.hand) return { ok: false, why: 'this line is resolved by hand' };

    if (offer.uid != null) { const k = this.refOf(P, offer.uid); if (k == null && offer.step === 0) return { ok: false, why: 'that card has left the field (§8-1-3-1-3)', gone: true }; offer.ref = k; }
    offer.targets = this.targetsFor(i, offer.steps[offer.step], offer.ref);
    const d = offer.steps[offer.step]; const need = offer.targets && offer.targets.length > 0;
    const opt = offer.step === 0 && offer.e.if.some(c => c.c === 'opt');
    if (opt && this.used(i, offer)) return { ok: false, why: 'once per turn, and used this turn (§10-2-13)' };

    const next = () => { offer.step++; const done = offer.step >= offer.steps.length; if (!done) offer.targets = this.targetsFor(i, offer.steps[offer.step], offer.ref); else this.finish(i, offer); return { ok: true, done, follow: [] }; };

    if (target != null && !(offer.targets || []).some(t => t.ref === target)) return { ok: false, why: 'not a legal target for this effect' };

    if (d.if && !d.if.every(c => this.condOk(i, this.at(P, offer.ref), c))) { if (opt) this.markUsed(i, offer); this.log(`${(this.card(offer.cardId) || {}).name || 'effect'}: ${this.stepText(d)} \u2014 skipped, only if ${d.if.map(c => this.condText(c)).join(', ')}`); return next(); }

    if (target == null && (d.upto || !need) && this.TARGETED.includes(d.a) && !(d.a === 'power' && d.who === 'prev' && offer.prev != null)) { if (opt) this.markUsed(i, offer); this.log(`${this.card(offer.cardId) ? this.card(offer.cardId).name : 'effect'}: ${this.stepText(d)} \u2014 none chosen`); return next(); }
    if (need && target == null) return { ok: false, why: 'choose a target' };
    const side = t => (t && t[0] === 'o') ? O : P, idx = t => +String(t).slice(1);
    const pl = id => { const p = this.card(id); return p && p.type === 'Character' && P.chars.length >= 5; };
    if ((d.a === 'playself' && pl(offer.cardId)) || (d.a === 'playfromhand' && pl(P.hand[idx(target)]))) {
      if (!(opts.trash >= 0 && opts.trash < P.chars.length)) return { ok: false, why: 'five Characters: choose one to trash first (§3-7-6-1)', need: 'trash' }; }
    if (opt) this.markUsed(i, offer);
    const run = this.DO[d.a]; if (!run) return { ok: false, why: 'unknown action' };
    const tn = target != null ? this.targetName(i, d, target) : '';
    const r = run.call(this, { i, P, O, d, offer, target, opts, side, idx }) || {}; if (r.ok === false) return r;
    const follow = r.follow || [];
    const nm = offer.ref === 'leader' ? this.card(P.leader.id).name : (offer.ref != null && this.at(P, offer.ref) ? this.card(this.at(P, offer.ref).id).name : (this.card(offer.cardId) || {}).name || 'a card');
    this.log(`${nm}: ${this.stepText(d)}${tn ? ' \u2192 ' + tn : ''}`);
    if (target != null) offer.prev = target;
    offer.step++; const done = offer.step >= offer.steps.length;
    if (!done) offer.targets = this.targetsFor(i, offer.steps[offer.step], offer.ref); else this.finish(i, offer);
    return { ok: true, done, follow }; },

  finish(i, offer) { const P = this.P(i); if (P.looking.length) P.deck.unshift(...P.looking.splice(0));
    if (offer.fromLife) { const h = P.hand.indexOf(offer.cardId); if (h >= 0) { P.hand.splice(h, 1); P.trash.push(offer.cardId); } } },

  declinable(o) { if (o.step > 0) return false; const e = o.e || {}, body = String(e.raw || '').replace(/^(\s*\[[^\]]+\]\s*)+/, '').replace(/\([^)]*\)/g, '');
    return e.t === 'trigger' || e.t === 'main' || /^cost_/.test((e.do && e.do[0] && e.do[0].a) || '') || /^\s*you may\b/i.test(body) || (!!o.hand && /^[^.:]*:/.test(body) && !/^\s*choose one\b/i.test(body)); },

  DO: {
    draw(c) { this.draw(c.i, c.d.n); },
    selfpower(c) { const k = this.keyOf(c.P, c.offer.ref); if (k) this.mod(c.i, k, c.d.n, c.d.dur); },
    leaderpower(c) { this.mod(c.i, 'leader', c.d.n, c.d.dur); },
    power(c) { const tg = c.d.who === 'prev' ? c.offer.prev : c.target; if (tg == null) return;
      if (tg === 'L') return void this.mod(c.i, 'leader', c.d.n, c.d.dur);
      const X = c.side(tg), ch = X.chars[c.idx(tg)]; if (!ch) return; this.mod(X === c.P ? c.i : 1 - c.i, 'u' + ch.uid, c.d.n, c.d.dur); },
    ko(c) { const ch = this.leave(c.O, c.idx(c.target), 'trash'); return { follow: this.offers(1 - c.i, 'onko', null, ch.id).concat(this.onKO()) }; },
    rest(c) { c.O.chars[c.idx(c.target)].rested = true; },
    bounce(c) { this.leave(c.side(c.target), c.idx(c.target), 'hand'); },
    bottom(c) { this.leave(c.side(c.target), c.idx(c.target), 'bottom'); },
    givedon(c) { const o = c.target === 'L' ? c.P.leader : c.P.chars[c.idx(c.target)]; const n = Math.min(c.d.n, c.P.don.rested); c.P.don.rested -= n; o.don += n; },
    activedon(c) { const n = Math.min(c.d.n, c.P.don.rested); c.P.don.rested -= n; c.P.don.active += n; },
    lifetohand(c) { for (let k = 0; k < (c.d.n || 1); k++) if (c.P.life.length) c.P.hand.push(c.P.life.shift()); },
    trashhand(c) { const id = c.P.hand.splice(c.idx(c.target), 1)[0]; if (id) c.P.trash.push(id); },
    search(c) { const top = c.P.deck.splice(0, c.d.n); if (c.target != null) c.P.hand.push(top.splice(c.idx(c.target), 1)[0]); c.P.looking.push(...top); },
    restcards(c) { const rest = c.P.looking.splice(0); if (c.d.to === 'trash') c.P.trash.push(...rest); else c.P.deck.push(...rest); },
    adddon(c) { const n = Math.min(c.d.n, c.P.donDeck); c.P.donDeck -= n; if (c.d.rested) c.P.don.rested += n; else c.P.don.active += n; },
    costmod(c) { const X = c.side(c.target), ch = X.chars[c.idx(c.target)]; this.mod(X === c.P ? c.i : 1 - c.i, 'u' + ch.uid, null, c.d.dur, { cost: c.d.n }); },
    selfkw(c) { const k = this.keyOf(c.P, c.offer.ref); if (k) this.mod(c.i, k, null, c.d.dur, { kw: c.d.k }); },
    mill(c) { c.P.trash.push(...c.P.deck.splice(0, c.d.n)); },
    noblocker(c) { this.mod(c.i, 'noblocker', null, c.d.dur, { noblk: { power: c.d.power, cmp: c.d.cmp } }); },
    decktolife(c) { if (c.P.deck.length) c.P.life.unshift(c.P.deck.shift()); },
    selfactive(c) { const o = this.at(c.P, c.offer.ref); if (o) o.rested = false; },

    powerall(c) { const typed = ch => { const ts = ((this.card(ch.id) || {}).subtypes || '').split(/[;/]/).map(t => t.trim()); return c.d.type ? ts.includes(c.d.type) : ts.some(t => t.includes(c.d.typeq)); };
      c.P.chars.filter(typed).forEach(ch => this.mod(c.i, 'u' + ch.uid, c.d.n, c.d.dur)); },

    cost_restdon(c) { if (c.P.don.active < c.d.n) return { ok: false, why: 'not enough active DON!! to rest (§8-3-1-5)' }; c.P.don.active -= c.d.n; c.P.don.rested += c.d.n; },
    playself(c) { const P = c.P, o = c.offer, p = this.card(o.cardId); const h = P.hand.indexOf(o.cardId);
      if (h < 0) return { ok: false, why: 'that card is no longer in hand (§8-1-3-1-3)', gone: true };
      P.hand.splice(h, 1); o.fromLife = false;
      if (p.type === 'Character') { if (P.chars.length >= 5) this.room(P, c.opts.trash); const ch = this.inst(o.cardId, this.g.turn); P.chars.push(ch); o.ref = P.chars.length - 1; o.uid = ch.uid; return { follow: this.offers(c.i, 'onplay', o.ref) }; }
      if (p.type === 'Stage') { this.placeStage(P, o.cardId); return { follow: this.offers(c.i, 'onplay', 'stage') }; }
      P.trash.push(o.cardId); },
    activate(c) { const o = c.offer; return { follow: this.offers(c.i, c.d.t, o.ref != null ? o.ref : null, o.ref != null ? null : o.cardId) }; },
    cost_trashhand(c) { if (c.target == null) return { ok: false, why: 'its cost cannot be paid: no card to trash (§8-3-1-3)' }; const id = c.P.hand.splice(c.idx(c.target), 1)[0]; if (id == null) return { ok: false, why: 'nothing to trash' }; c.P.trash.push(id); },

    cost_returndon(c) { const P = c.P; let n = c.d.n; if (this.fieldDon(P) < n) return { ok: false, why: 'not enough DON!! on the field (§8-3-1-6)' };
      const take = v => { const t = Math.min(n, v); n -= t; return t; }; P.don.rested -= take(P.don.rested); P.don.active -= take(P.don.active); P.leader.don -= take(P.leader.don); for (const ch of P.chars) ch.don -= take(ch.don); P.donDeck += c.d.n; },
    cost_restself(c) { const o = this.at(c.P, c.offer.ref); if (!o || o.rested) return { ok: false, why: 'already rested' }; o.rested = true; },
    playfromhand(c) { const P = c.P, id = P.hand.splice(c.idx(c.target), 1)[0]; if (P.chars.length >= 5) this.room(P, c.opts.trash); P.chars.push(this.inst(id, this.g.turn)); return { follow: this.offers(c.i, 'onplay', P.chars.length - 1) }; }
  },

  HAND_OPS: [
    ['draw', /\bdraw (?:up to )?(\d+)?/gi], ['trashhand', /\btrash (?:up to )?(\d+)? ?cards? from your hand\b/gi], ['ko', /\bK\.O\. (?:up to )?(\d+)?/g],
    ['rest', /\brest (?:up to )?(\d+)?(?! of)/gi], ['active', /\bset (?:up to )?(\d+)?[^.]*?\bas active\b/gi], ['tohand', /\breturn (?:up to )?(\d+)?[^.]*?\bto (?:the owner['\u2019]s|your|their) hand\b/gi],
    ['bottom', /\bplace (?:up to )?(\d+)?[^.]*?\bat the bottom of (?:the owner['\u2019]s|your|their) deck\b/gi], ['givedon', /\bgive (?:[^.]*?\bup to )?(\d+)? ?(?:rested |active )?DON!!/gi],
    ['adddon', /\badd (?:up to )?(\d+)? ?DON!! cards? from your DON!! deck\b/gi], ['returndon', /\bDON!! [\u2212-](\d+)|\breturn (\d+)? ?DON!! cards? [^.]*?to (?:your|their) DON!! deck\b/gi],
    ['lifetohand', /\badd (?:up to )?(\d+)? ?cards? from the top (?:or bottom )?of your Life cards to your hand\b/gi], ['decktolife', /\bfrom the top of your deck to the top of your Life cards\b/gi],
    ['handtolife', /\badd (?:up to )?(\d+)? ?cards? from your hand to the top of your Life cards\b/gi], ['chartolife', /\badd (?:up to )?(\d+)? of your Characters?[^.:]*?\bto the top of your Life cards\b/gi],
    ['opplifetrash', /\btrash (?:up to )?(\d+)? of your opponent['\u2019]s Life cards?\b/gi], ['handtotop', /\bplace the revealed card at the top of your deck\b/gi],
    ['mill', /\btrash (\d+)? ?cards? from the top of your deck\b/gi], ['play', /\bplay (?:up to )?(\d+)?/gi], ['look', /\blook at (\d+)? ?cards? from the top of your deck\b/gi]],
  handOps(raw) { const txt = String(raw || '').replace(/^(\[[^\]]+\]\s*)+/, ''); const ops = {};
    for (const [op, rx] of this.HAND_OPS) for (const m of txt.matchAll(rx)) { const n = +(m[1] || m[2]) || 1; ops[op] = (ops[op] || 0) + (op === 'look' ? n : Math.min(n, 10)); }
    const pw = [...txt.matchAll(/([+\u2212-])(\d+) power\b/g)].map(m => (m[1] === '+' ? 1 : -1) * +m[2]); if (pw.length) ops.power = pw;

    if (ops.look) { const rv = txt.match(/\b(?:reveal|add) up to (\d+)[^.;]*?\bto your hand\b/i) || txt.match(/\badd (?:it|them)[^.;]*?\bto your hand\b/i);
      if (rv) ops.lookhand = +rv[1] || 1;
      if (/\bbottom of (?:the|your) deck\b/i.test(txt)) ops.lookbottom = ops.look;
      if (/\btrash (?:the rest|them|the remaining|up to \d+ of them|\d+ of them)\b|\bthe rest (?:in|into) (?:the|your) trash\b/i.test(txt)) ops.looktrash = ops.look; }

    const side = cl => /opponent['\u2019]s/i.test(cl) ? 'opp' : /\b(?:your|this)\b/i.test(cl) ? 'own' : 'any';

    const nt = txt.replace(/K\.O\./g, 'K_O_'), ends = [...nt.matchAll(/[.:;](?=\s|$)/g)].map(m => m.index);
    const clauseAt = k => { const a = ends.filter(e => e < k).pop(), b = ends.find(e => e >= k); return nt.slice(a == null ? 0 : a + 1, b == null ? undefined : b + 1); };
    const B = {}, where = {}, join = (op, s) => { where[op] = where[op] && where[op] !== s ? 'any' : s; };
    for (const [op, rx] of this.HAND_OPS) if (['ko', 'rest', 'tohand', 'bottom'].includes(op)) for (const m of txt.matchAll(rx)) join(op, side(clauseAt(m.index)));
    if (ops.power) { for (const m of txt.matchAll(/([+\u2212-])(\d+) power\b/g)) join('power', side(clauseAt(m.index)));
      B.dur = /until the start of your next turn/i.test(txt) ? 'nextturn' : /during this battle/i.test(txt) ? 'battle' : 'turn'; }
    if (Object.keys(where).length) B.where = where;
    if (ops.lifetohand && /from the top or bottom of your Life cards/i.test(txt)) B.lifebottom = true;
    if (ops.givedon) { const m = txt.match(/\bgive [^.]*?DON!![^.]*/i), cl = m ? m[0] : '';
      if (/\brested DON!!/i.test(cl)) B.donFrom = 'rested'; else if (/\bactive DON!!/i.test(cl)) B.donFrom = 'active';
      B.giveTo = /Leader/.test(cl) && /Character/.test(cl) ? 'any' : /Leader/.test(cl) ? 'leader' : /Character/.test(cl) ? 'chars' : 'any'; }
    if (Object.keys(B).length) ops._ = B;
    return ops; },

  handMoves(i) { const g = this.g, H = g.hand; if (!H || H.i !== i) return []; const P = this.P(i), O = this.P(1 - i), L = H.left, out = [];
    const B = L._ || {}, W = B.where || {}, refs = X => ['leader'].concat(X.chars.map((c, k) => k));
    const on = op => [[0, P], [1, O]].filter(([s]) => !W[op] || W[op] === 'any' || W[op] === (s === 0 ? 'own' : 'opp'));
    if (L.draw > 0 && P.deck.length) out.push({ t: 'hand', op: 'draw' });
    if (L.trashhand > 0) P.hand.forEach((id, h) => out.push({ t: 'hand', op: 'trashhand', h }));
    if (L.ko > 0) on('ko').forEach(([s, X]) => X.chars.forEach((c, k) => out.push({ t: 'hand', op: 'ko', side: s, k })));
    if (L.rest > 0) on('rest').forEach(([s, X]) => refs(X).forEach(ref => { if (!this.at(X, ref).rested) out.push({ t: 'hand', op: 'rest', side: s, ref }); }));
    if (L.active > 0) refs(P).forEach(ref => { if (this.at(P, ref).rested) out.push({ t: 'hand', op: 'active', side: 0, ref }); });
    if (L.active > 0 && P.don.rested > 0) out.push({ t: 'hand', op: 'activedon' });
    if (Array.isArray(L.power)) [...new Set(L.power)].forEach(v => on('power').forEach(([s, X]) => refs(X).forEach(ref => out.push({ t: 'hand', op: 'power', v, side: s, ref }))));
    if (L.tohand > 0) on('tohand').forEach(([s, X]) => X.chars.forEach((c, k) => out.push({ t: 'hand', op: 'tohand', side: s, k })));
    if (L.bottom > 0) on('bottom').forEach(([s, X]) => X.chars.forEach((c, k) => out.push({ t: 'hand', op: 'bottom', side: s, k })));
    if (L.givedon > 0) refs(P).filter(ref => B.giveTo === 'leader' ? ref === 'leader' : B.giveTo === 'chars' ? ref !== 'leader' : true).forEach(ref => {
      if (P.don.rested > 0 && B.donFrom !== 'active') out.push({ t: 'hand', op: 'givedon', ref, from: 'rested' }); if (P.don.active > 0 && B.donFrom !== 'rested') out.push({ t: 'hand', op: 'givedon', ref, from: 'active' }); });
    if (L.adddon > 0 && P.donDeck > 0) { out.push({ t: 'hand', op: 'adddon', rested: false }); out.push({ t: 'hand', op: 'adddon', rested: true }); }
    if (L.returndon > 0 && this.fieldDon(P) > 0) out.push({ t: 'hand', op: 'returndon' });
    if (L.lifetohand > 0 && P.life.length) { out.push({ t: 'hand', op: 'lifetohand' }); if (B.lifebottom && P.life.length > 1) out.push({ t: 'hand', op: 'lifetohand', end: 'bottom' }); }
    if (L.handtolife > 0) P.hand.forEach((id, h) => out.push({ t: 'hand', op: 'handtolife', h }));
    if (L.chartolife > 0) P.chars.forEach((c, k) => out.push({ t: 'hand', op: 'chartolife', k }));
    if (L.opplifetrash > 0 && O.life.length) out.push({ t: 'hand', op: 'opplifetrash' });
    if (L.handtotop > 0) P.hand.forEach((id, h) => out.push({ t: 'hand', op: 'handtotop', h }));
    if (L.decktolife > 0 && P.deck.length) out.push({ t: 'hand', op: 'decktolife' });
    if (L.mill > 0 && P.deck.length) out.push({ t: 'hand', op: 'mill' });
    if (L.play > 0) [['hand', P.hand], ['trash', P.trash]].forEach(([z, list]) => list.forEach((id, k) => { const p = this.card(id); if (!p || !['Character', 'Stage'].includes(p.type)) return;
      if (p.type === 'Character' && P.chars.length >= 5) P.chars.forEach((c, t) => out.push({ t: 'hand', op: 'play', zone: z, k, trash: t })); else out.push({ t: 'hand', op: 'play', zone: z, k }); }));
    if (L.look > 0 && P.deck.length && !P.looking.length) out.push({ t: 'hand', op: 'look' });
    P.looking.forEach((id, k) => ['hand', 'bottom', 'trash'].forEach(to => { if (L['look' + to] > 0) out.push({ t: 'hand', op: 'lookto', k, to }); }));
    return out; },
  handOp(i, a) { const g = this.g, H = g.hand; const P = this.P(i), O = this.P(1 - i);
    if (!this.handMoves(i).some(x => Object.keys(x).every(k => x[k] === a[k]))) return { ok: false, why: 'not a move this line names, or none left' };
    const X = a.side === 1 ? O : P, xi = a.side === 1 ? 1 - i : i, nm = id => (this.card(id) || {}).name || '?';
    const spend = op => { if (op === 'power') { const L = H.left.power; L.splice(L.indexOf(a.v), 1); } else if (op === 'lookto') H.left['look' + a.to]--; else if (op !== 'look') H.left[op === 'activedon' ? 'active' : op]--; };
    const say = this.HAND[a.op].call(this, { i, P, X, xi, a, H, nm });
    spend(a.op); H.n = (H.n || 0) + 1; this.log(`by hand for ${nm(H.cardId)}: ${say}`); return { ok: true }; },

  HAND: {
    draw(c) { this.draw(c.i, 1); return 'draws 1'; },
    trashhand(c) { const id = c.P.hand.splice(c.a.h, 1)[0]; c.P.trash.push(id); return `trashes ${c.nm(id)} from hand`; },
    ko(c) { const ch = this.leave(c.X, c.a.k, 'trash'); this.g.queue.splice(1, 0, ...this.offers(c.xi, 'onko', null, ch.id), ...this.onKO()); return `K.O.s ${c.nm(ch.id)}`; },
    rest(c) { const o = this.at(c.X, c.a.ref); o.rested = true; return `rests ${c.nm(o.id)}`; },
    active(c) { const o = this.at(c.P, c.a.ref); o.rested = false; return `sets ${c.nm(o.id)} active`; },
    activedon(c) { c.P.don.rested--; c.P.don.active++; return 'sets a DON!! active'; },
    power(c) { const dur = (c.H.left._ || {}).dur || 'turn'; this.mod(c.xi, this.keyOf(c.X, c.a.ref), c.a.v, dur);
      return `${c.a.v > 0 ? '+' : ''}${c.a.v} power to ${c.nm(this.at(c.X, c.a.ref).id)} ${{ turn: 'this turn', battle: 'this battle', nextturn: 'until the start of the next turn' }[dur]}`; },
    tohand(c) { const ch = this.leave(c.X, c.a.k, 'hand'); return `returns ${c.nm(ch.id)} to its owner\u2019s hand`; },
    bottom(c) { const ch = this.leave(c.X, c.a.k, 'bottom'); return `places ${c.nm(ch.id)} at the bottom of its owner\u2019s deck`; },
    givedon(c) { const o = this.at(c.P, c.a.ref); if (c.a.from === 'rested') c.P.don.rested--; else c.P.don.active--; o.don++; return `gives a ${c.a.from} DON!! to ${c.nm(o.id)}`; },
    adddon(c) { c.P.donDeck--; if (c.a.rested) c.P.don.rested++; else c.P.don.active++; return `adds a DON!! from the DON!! deck${c.a.rested ? ', rested' : ''}`; },
    returndon(c) { const P = c.P; if (P.don.rested) P.don.rested--; else if (P.don.active) P.don.active--; else if (P.leader.don) P.leader.don--; else P.chars.find(x => x.don).don--; P.donDeck++; return 'returns a DON!! to the DON!! deck'; },
    lifetohand(c) { c.P.hand.push(c.a.end === 'bottom' ? c.P.life.pop() : c.P.life.shift()); return `adds the ${c.a.end === 'bottom' ? 'bottom' : 'top'} Life card to hand`; },
    handtolife(c) { c.P.life.unshift(c.P.hand.splice(c.a.h, 1)[0]); return 'adds a card from hand to the top of Life'; },
    chartolife(c) { const ch = this.leave(c.P, c.a.k, 'life'); return `adds ${c.nm(ch.id)} to the top of Life`; },
    opplifetrash(c) { const O = this.P(1 - c.i), id = O.life.shift(); O.trash.push(id); return `trashes the top card of the opponent\u2019s Life (${c.nm(id)})`; },
    handtotop(c) { const id = c.P.hand.splice(c.a.h, 1)[0]; c.P.deck.unshift(id); return 'places a card from hand at the top of the deck'; },
    decktolife(c) { c.P.life.unshift(c.P.deck.shift()); return 'adds the top of the deck to the top of Life'; },
    mill(c) { c.P.trash.push(c.P.deck.shift()); return 'trashes the top card of the deck'; },
    play(c) { const P = c.P, list = c.a.zone === 'trash' ? P.trash : P.hand; const id = list.splice(c.a.k, 1)[0];
      if (this.card(id).type === 'Character') { if (P.chars.length >= 5) this.room(P, c.a.trash); P.chars.push(this.inst(id, this.g.turn)); this.g.queue.splice(1, 0, ...this.offers(c.i, 'onplay', P.chars.length - 1)); }
      else { this.placeStage(P, id); this.g.queue.splice(1, 0, ...this.offers(c.i, 'onplay', 'stage')); }
      return `plays ${c.nm(id)} from the ${c.a.zone}`; },
    look(c) { const n = Math.min(c.H.left.look, c.P.deck.length); c.P.looking.push(...c.P.deck.splice(0, n)); c.H.left.look = 0; return `looks at the top ${n}`; },
    lookto(c) { const id = c.P.looking.splice(c.a.k, 1)[0]; if (c.a.to === 'hand') c.P.hand.push(id); else if (c.a.to === 'bottom') c.P.deck.push(id); else c.P.trash.push(id); return `puts a looked-at card to the ${c.a.to}`; }
  },

  who() { const g = this.g; if (!g || g.over !== null) return null;
    if (g.phase === 'mulligan') { const k = [g.first, 1 - g.first].find(x => g.players[x].mulliganed === null); return k == null ? null : k; }
    if (g.queue && g.queue.length) return g.queue[0].i;
    if (g.phase === 'battle') return g.battle.def;
    return g.active; },

  legal(i) { const g = this.g, out = []; if (!g || this.who() !== i) return out; const P = this.P(i);
    if (g.phase === 'mulligan') return [{ t: 'keep' }, { t: 'mull' }];
    if (g.queue.length) { const o = g.queue[0];
      if (g.hand) return this.handMoves(i).concat([{ t: 'handdone' }]);
      if (o.hand) return [{ t: 'fxhand' }].concat(this.declinable(o) ? [{ t: 'fxskip' }] : []);
      const d = o.steps[o.step], T = this.targetsOf(o), tg = T && T.length ? T.map(t => t.ref) : [];
      if (!this.canPay(i, o.uid != null ? this.refOf(P, o.uid) : o.ref, d)) return [{ t: 'fxskip' }];
      const needRoom = ref => { const id = d.a === 'playself' ? o.cardId : (d.a === 'playfromhand' ? P.hand[+String(ref).slice(1)] : null); const p = id && this.card(id); return !!(p && p.type === 'Character' && P.chars.length >= 5); };
      tg.forEach(ref => { if (needRoom(ref)) P.chars.forEach((c, k) => out.push({ t: 'fx', target: ref, trash: k })); else out.push({ t: 'fx', target: ref }); });
      if ((!tg.length && d.a !== 'cost_trashhand') || (d.upto && this.TARGETED.includes(d.a))) { if (needRoom(null)) P.chars.forEach((c, k) => out.push({ t: 'fx', target: null, trash: k })); else out.push({ t: 'fx', target: null }); }
      if (this.declinable(o)) out.push({ t: 'fxskip' }); return out; }
    if (g.phase === 'battle') { const b = g.battle;
      if (b.step === 'block') { this.blockers().forEach(x => out.push({ t: 'block', k: x.ref })); out.push({ t: 'noblock' }); return out; }
      this.counters().forEach(x => out.push({ t: 'counter', h: x.h })); this.counterEvents().forEach(x => out.push({ t: 'cevent', h: x.h })); out.push({ t: 'resolve' }); return out; }
    P.hand.forEach((id, h) => { const v = this.canPlay(i, h); if (!v.ok) return; if (v.full) P.chars.forEach((c, k) => out.push({ t: 'play', h, trash: k })); else out.push({ t: 'play', h }); });
    const refs = ['leader'].concat(P.chars.map((c, k) => k));
    if (P.don.active > 0) refs.forEach(ref => out.push({ t: 'give', ref }));
    refs.concat(P.stage != null ? ['stage'] : []).forEach(ref => this.offers(i, 'main', ref).forEach(o => out.push({ t: 'activate', ref, n: o.n })));
    refs.forEach(ref => { if (this.canAttack(i, ref).ok) this.targets(i, ref).forEach(t => out.push({ t: 'attack', ref, target: t.ref })); });
    out.push({ t: 'end' }); return out; },

  picOf(p) { if (!p) return null; if (p.hash != null || !p.num) return p.img ? p : null;
    const q = CAT.lend ? CAT.byId.get(+CAT.lend[p.id]) : null;
    return q && q.img && q.hash != null && q.num === p.num && q.name === p.name ? q : (p.img ? p : null); },
  face(id, extra) { const p = this.card(id) || {}, q = typeof artUrl === 'function' ? this.picOf(p) : null;
    return Object.assign({ id, num: p.num || null, name: p.name || '?', type: p.type || null, cost: p.cost != null ? this.cost(p) : null, printedPower: p.power != null ? this.num(p.power) : null,
      counter: this.num(p.counter) || null, kw: (p.kw || '').split('|').filter(Boolean), colours: typeof gameColours === 'function' ? gameColours(p) : [], text: p.text || '',
      art: q ? { thumb: artUrl(q), large: artUrl(q, 'large'), ground: artColours(p) } : null }, extra || {}); },

  onField(xi, ref) { const X = this.P(xi), o = this.at(X, ref), unit = ref !== 'stage', kw = unit ? this.kwOf(xi, ref) : [], f = this.face(o.id);
    return Object.assign(f, { uid: o.uid, seat: xi, ref, rested: o.rested, don: o.don, turn: o.turn, power: unit ? this.power(xi, ref) : null, keywords: kw, granted: kw.filter(k => !f.kw.includes(k)),
      unapplied: this.unapplied(o.id).map(e => e.raw), lines: this.fx(o.id).map(e => ({ t: e.t, raw: e.raw, does: this.describe(e), proof: this.proofOf(o.id, e) })) }); },
  view(seat) { const g = this.g; if (!g) return null; const who = this.who();
    const side = xi => { const X = this.P(xi), mine = xi === seat, given = X.leader.don + X.chars.reduce((a, c) => a + c.don, 0);
      return { seat: xi, name: X.name, leader: this.onField(xi, 'leader'), chars: X.chars.map((c, k) => this.onField(xi, k)), stage: X.stage ? this.onField(xi, 'stage') : null,
        hand: mine ? X.hand.map((id, h) => this.face(id, { h, play: this.canPlay(xi, h) })) : null, handCount: X.hand.length,
        lifeCount: X.life.length, deckCount: X.deck.length, trash: X.trash.map(id => this.face(id)),
        looking: mine ? X.looking.map(id => this.face(id)) : null, lookingCount: X.looking.length,
        don: { active: X.don.active, rested: X.don.rested, given, deck: X.donDeck }, mulliganed: X.mulliganed, taken: X.taken, lost: X.lost }; };
    const b = g.battle, at = b && this.locate(), o = g.queue[0], d = o && o.steps[o.step];

    const shut = !!(o && o.fromLife && o.step === 0 && o.i !== seat);
    return { v: 1, take: TAKE, rules: this.RULES, seat, turn: g.turn, phase: g.phase, active: g.active, first: g.first, over: g.over, who, bot: g.bot != null ? g.bot : null,
      me: side(seat), them: side(1 - seat),
      battle: b ? { att: b.att, def: b.def, step: b.step, blocked: b.blocked, counter: b.counter, powers: this.battlePowers(),
        attacker: at.aref != null ? this.onField(b.att, at.aref) : null, target: at.dref != null ? this.onField(b.def, at.dref) : null, unblockable: at.aref != null && this.has(b.att, at.aref, 'Unblockable') } : null,
      offer: shut ? { seat: o.i, hidden: true, cardId: null, name: null, t: o.e.t, raw: null, hand: null, proof: null, wrong: null, does: null, step: null, steps: null, cost: null, choices: null, queued: g.queue.length }
        : o ? { seat: o.i, hidden: false, cardId: o.cardId, name: (this.card(o.cardId) || {}).name || 'Effect', t: o.e.t, raw: o.e.raw, hand: !!o.hand, proof: this.proofOf(o.cardId, o.e), wrong: o.e.wrong || null,
        does: this.describe(o.e), step: o.step, steps: o.steps.length, cost: !!(d && /^cost_/.test(d.a)), choices: o.i === seat && !o.hand ? this.choicesOf(o) : null, queued: g.queue.length } : null,
      tray: g.hand ? (g.hand.i === seat ? { mine: true, cardId: g.hand.cardId, raw: g.hand.raw, left: JSON.parse(JSON.stringify(g.hand.left)) } : { mine: false, cardId: g.hand.cardId, raw: g.hand.raw }) : null,
      last: g.last ? this.lastFor(seat) : null,

      start: g.start && g.start.turn === g.turn ? Object.assign({}, g.start) : null,
      legal: who === seat ? this.legal(seat) : [], log: g.log.slice() }; },

  lastFor(seat) { const L = this.g.last, own = seat === L.def;
    return { n: L.n, turn: L.turn, att: L.att, def: L.def, a: L.a, d: L.d, win: !!L.win, gone: !!L.gone, ko: L.ko || null,
      life: (L.life || []).map(l => own || l.banished ? { id: l.id, name: l.name, banished: !!l.banished, trigger: own && !!l.trigger } : { id: null, name: null, banished: false, trigger: false }) }; },

  choicesOf(o) { const T = this.targetsOf(o); if (!T) return T; const P = this.P(o.i);
    return T.map(t => { const r = String(t.ref), k = +r.slice(1), id = r[0] === 'h' ? P.hand[k] : r[0] === 'd' ? P.deck[k] : null;
      return id != null ? Object.assign({}, t, { face: this.face(id) }) : t; }); },

  act(i, a) { const g = this.g; if (!g) return { ok: false, why: 'no game' };
    if (g.over !== null) return { ok: false, why: 'the game is over' };

    if (a.t === 'concede') { const P = this.P(i), away = a.away === 'gone' || a.away === 'idle' ? a.away : null; P.lost = away ? 'away' : 'concede';
      this.log(away ? `${P.name} ${away === 'gone' ? 'left and did not come back' : 'made no move'} in time: the win is claimed` : `${P.name} concedes (§1-2-3)`); this.rules(); return this.rec(i, a, { ok: true }); }
    if (this.who() !== i) return { ok: false, why: 'not your decision now' };
    const keep = JSON.stringify(g), uid = this.uid;
    const r = this.step(i, a); if (!r.ok) { this.restore(keep, uid); return r; }
    this.rules(); this.drain(); return this.rec(i, a, r); },

  restore(keep, uid) { const g = this.g, back = JSON.parse(keep), players = g.players;
    for (const k of Object.keys(g)) delete g[k]; Object.assign(g, back, { players });
    players.forEach((P, k) => { for (const f of Object.keys(P)) delete P[f]; Object.assign(P, back.players[k]); }); this.uid = uid; },
  rec(i, a, r) { this.g.actions.push(Object.assign({ s: i }, a)); return r; },
  queue(list) { if (list && list.length) this.g.queue.push(...list); },

  drain() { const g = this.g; if (g.over !== null) return;

    while (g.queue.length && !g.hand) { const o = g.queue[0]; if (o.step !== 0 || o.uid == null || this.refOf(this.P(o.i), o.uid) != null) break;
      g.queue.shift(); this.log(`${this.card(o.cardId).name}: its card has left the field; the effect does not activate (§8-1-3-1-3)`); }
    if (g.queue.length) return;

    if (g.battle && !this.locate().ok) { this.log('the battle ends: a card in it has left the field (§7-1-1-4)'); this.endBattle(); }
    if (g.after === 'end' && g.phase === 'main') { g.after = null; this.endTurn(); } },
  step(i, a) { const g = this.g, P = this.P(i), main = g.phase === 'main' && !g.queue.length;
    const refuse = why => ({ ok: false, why });
    switch (a.t) {
      case 'keep': case 'mull': if (g.phase !== 'mulligan') return refuse('not the mulligan (§5-2-1-6)'); this.mulligan(i, a.t === 'mull'); return { ok: true };
      case 'play': { if (!main) return refuse(g.queue.length ? 'resolve the effect first (§8-6)' : 'not your Main Phase (§6-5-3)'); const r = this.play(i, a.h, { trash: a.trash }); if (!r.ok) return r;
        this.queue(r.card.type === 'Event' ? this.offers(i, 'evmain', null, r.card.id) : this.offers(i, 'onplay', r.ref)); return r; }
      case 'give': if (!main) return refuse('not now (§6-5-5)'); return this.giveDon(i, a.ref);
      case 'activate': { if (!main) return refuse(g.queue.length ? 'resolve the effect first (§8-6)' : 'in the Main Phase, not in battle (§10-2-2)');
        const list = this.offers(i, 'main', a.ref).filter(o => a.n == null || o.n === a.n);
        if (!list.length) return refuse(this.whyNot(i, 'main', a.ref, a.n));
        this.queue([list[0]]); this.log(`${P.name} activates ${this.card(list[0].cardId).name}`); return { ok: true }; }
      case 'attack': { if (!main) return refuse('not now (§6-5-6)'); const r = this.attack(i, a.ref, a.target); if (!r.ok) return r;
        this.queue(this.offers(i, 'attack', a.ref)); const O = this.P(1 - i);
        this.queue(['leader'].concat(O.chars.map((c, k) => k), O.stage != null ? ['stage'] : []).flatMap(ref => this.offers(1 - i, 'oppattack', ref))); return r; }
      case 'block': { if (g.phase !== 'battle' || g.queue.length) return refuse('not the Block Step (§7-1-2)'); const r = this.block(a.k); if (r.ok) this.queue(this.offers(i, 'onblock', a.k)); return r; }
      case 'noblock': if (g.phase !== 'battle' || g.battle.step !== 'block' || g.queue.length) return refuse('not the Block Step (§7-1-2)'); this.noBlock(); return { ok: true };
      case 'counter': if (g.queue.length) return refuse('resolve the effect first (§8-6)'); return this.counter(a.h);
      case 'cevent': { if (g.queue.length) return refuse('resolve the effect first (§8-6)'); const r = this.playCounterEvent(a.h); if (r.ok) this.queue(this.offers(i, 'evcounter', null, r.id)); return r; }
      case 'resolve': { if (g.phase !== 'battle' || g.battle.step !== 'counter' || g.queue.length) return refuse('not the Damage Step (§7-1-4)'); const res = this.resolve();
        if (g.over === null) { res.life.forEach(l => { if (l.trigger) this.queue(this.offers(i, 'trigger', null, l.id, true)); }); if (res.koId) { this.queue(this.offers(i, 'onko', null, res.koId)); this.queue(this.onKO()); } }
        return { ok: true, res }; }
      case 'fx': { const o = g.queue[0]; if (!o || o.hand || g.hand) return refuse('no effect to apply');
        const r = this.apply(i, o, a.target == null ? null : a.target, { trash: a.trash });
        if (!r.ok) { if (r.gone) { g.queue.shift(); this.log(`${this.card(o.cardId).name}: its card has left the field; the effect does not resolve (§8-1-3-1-3)`); return { ok: true, gone: true }; } return r; }

        if (r.done) { g.queue.shift(); if (r.follow && r.follow.length) g.queue.unshift(...r.follow); } else if (r.follow && r.follow.length) g.queue.splice(1, 0, ...r.follow); return r; }
      case 'fxskip': { const o0 = g.queue[0], d0 = o0 && o0.steps && o0.steps[o0.step];
        if (o0 && o0.hand && !this.declinable(o0)) return refuse('it happens in full: open it and do what its words say, then Done (\u00a78-1-3-1)');
        if (o0 && !this.declinable(o0) && d0 && this.canPay(i, o0.uid != null ? this.refOf(P, o0.uid) : o0.ref, d0)) return refuse(o0.step > 0 && /^cost_/.test(d0.a) ? 'a cost once begun is paid in full, in order (§8-3)' : 'it resolves in full; an \u201cup to\u201d lets you choose none (§8-1-3-1)');
        const o = g.queue.shift(); if (!o) return refuse('no effect');
        if (o.fromLife && !o.step) this.log(`${this.P(o.i).name} adds the Life card to hand without revealing it (§10-1-5)`);
        else if (o.step > 0) { this.finish(i, o); this.log(`${this.card(o.cardId).name}: its cost cannot be paid now \u2014 the rest does not resolve (§8-3-1-3)`); }
        else if (o.hand) this.log(`${this.card(o.cardId).name}: the rest is declined`);
        return { ok: true }; }
      case 'fxhand': { const o = g.queue[0]; if (!o || !o.hand || g.hand) return refuse('no by-hand effect');
        if (o.uid != null) o.ref = this.refOf(P, o.uid);
        if (o.e.if.some(c => c.c === 'opt')) { if (this.used(i, o)) return refuse('once per turn, and used this turn (§10-2-13)'); this.markUsed(i, o); }
        g.hand = { i, cardId: o.cardId, raw: o.e.raw, left: this.handOps(o.e.raw), fromLife: o.fromLife, n: 0 };
        this.log(`by hand: ${this.card(o.cardId).name} \u2014 ${o.e.raw.slice(0, 90)}`); return { ok: true }; }
      case 'hand': if (!g.hand) return refuse('no by-hand effect open'); return this.handOp(i, a);
      case 'handdone': { const H = g.hand; if (!H) return refuse('no by-hand effect open'); g.hand = null; g.queue.shift();
        this.log(`${this.card(H.cardId).name}: done by hand${H.n ? '' : ' \u2014 no move made'}`);
        if (P.looking.length) P.deck.unshift(...P.looking.splice(0));
        if (H.fromLife) { const h = P.hand.indexOf(H.cardId); if (h >= 0) { P.hand.splice(h, 1); P.trash.push(H.cardId); } }
        return { ok: true }; }
      case 'end': { if (!main || g.active !== i) return refuse(g.queue.length ? 'resolve the effect first (§8-6)' : 'not your Main Phase (§6-5-2-1)');
        const O = this.P(1 - i), on = (X, xi, t) => ['leader'].concat(X.chars.map((c, k) => k), X.stage != null ? ['stage'] : []).flatMap(ref => this.offers(xi, t, ref));
        this.queue(on(P, i, 'endturn')); this.queue(on(O, 1 - i, 'endoppturn'));
        if (g.queue.length) g.after = 'end'; else this.endTurn(); return { ok: true }; }
      default: return refuse('unknown move'); } },

  replay(spec, actions) { this.new(spec.decks[0], spec.decks[1], spec.first, { seed: spec.seed, bot: spec.bot });
    for (let k = 0; k < actions.length; k++) { const { s, ...a } = actions[k]; const r = this.act(s, a); if (!r.ok) return { ok: false, at: k, why: r.why }; } return { ok: true, g: this.g }; },

  TIMING: { onplay: 'On Play', attack: 'When Attacking', main: 'Activate: Main', onko: 'On K.O.', trigger: 'Trigger', onblock: 'On Block', endturn: 'End of Your Turn', evmain: 'Main', evcounter: 'Counter', static: 'while', whenko: 'When a Character is K.O.\u2019d' },
  condText(c) { return ({ donx: `${c.n} DON!! given`, opt: 'once per turn', yourturn: 'on your turn', oppturn: "on the opponent\u2019s turn", opplife: `the opponent at ${c.max} Life or less`, donfield: `${c.min}+ DON!! on your field`, leadertype: `your Leader is {${c.t}}`, leadername: `your Leader is ${c.name}`, life: `you at ${c.max} Life or less`, trash: `${c.min}+ cards in your trash`, donle: 'your DON!! at most the opponent\u2019s' }[c.c] || c.c); },
  stepText(d) { const T = this.TIMING;
    const up = d => d.upto ? 'up to ' : ''; const dur = d => ({ turn: ' this turn', nextturn: ' until your next turn', permanent: '', static: '', battle: ' this battle' }[d.dur] || '');
    const filt = d => [d.rested ? 'rested' : '', d.cost != null ? `cost ${d.cost} or less` : '', d.power != null ? `${d.power} power or less` : '', d.bpower != null ? `${d.bpower} base power or less` : ''].filter(Boolean).join(', ');
    switch (d.a) {
      case 'draw': return `draw ${d.n}`; case 'trashhand': return `trash ${up(d)}${d.n} from your hand`; case 'playself': return 'play this card';
      case 'activate': return `use this card\u2019s [${T[d.t] || d.t}]`; case 'playfromhand': return `play ${up(d)}1 ${d.type ? '{' + d.type + '} ' : ''}Character (${[d.cost != null ? 'cost ' + d.cost + ' or less' : '', d.power != null ? d.power + ' power or less' : ''].filter(Boolean).join(', ')}) from your hand, free`;
      case 'ko': return `K.O. ${up(d)}1 opponent\u2019s Character (${filt(d)})`; case 'rest': return `rest ${up(d)}1 opponent\u2019s Character${filt(d) ? ' (' + filt(d) + ')' : ''}`;
      case 'bounce': return `return ${up(d)}1 ${d.who === 'any' ? '' : "opponent\u2019s "}Character (${filt(d)}) to its owner\u2019s hand`; case 'bottom': return `put ${up(d)}1 Character (${filt(d)}) at the bottom of its owner\u2019s deck`;
      case 'adddon': return `add ${d.n} DON!! from the DON!! deck${d.rested ? ', rested' : ', active'}`; case 'power': return `${d.n > 0 ? '+' : ''}${d.n} power to ${d.who === 'prev' ? 'that card' : up(d) + (d.who === 'opp' ? "1 opponent\u2019s Character" : '1 of your Leader or Characters' + (d.notself ? ' other than this card' : ''))}${dur(d)}${d.sign_inferred ? ' (sign inferred)' : ''}`;
      case 'leaderpower': return `your Leader +${d.n} power${dur(d)}`; case 'search': return `look at the top ${d.n}; ${up(d)}1 ${[(d.types || []).map(t => '{' + t + '}').join(' or '), (d.names || []).join(' or '), d.name || '', d.cost_max != null ? 'cost ' + d.cost_max + ' or less' : '', d.cost_min != null ? 'cost ' + d.cost_min + ' or more' : ''].filter(Boolean).join(' / ') || 'card'}${d.not ? ' other than ' + d.not : ''} to your hand`;
      case 'restcards': return `the rest to the ${d.to === 'trash' ? 'trash' : 'bottom of the deck'}`; case 'costmod': return `${d.n} cost to ${up(d)}1 opponent\u2019s Character${dur(d)}`;
      case 'selfpower': return `this card +${d.n} power${dur(d)}`; case 'selfkw': return `this card gains [${d.k}]${dur(d)}`; case 'mill': return `trash the top ${d.n} of your deck`;
      case 'noblocker': return `your opponent cannot activate [Blocker]${d.power != null ? ` on a Character with ${d.power} power or ${d.cmp}` : ''}${dur(d)}`;
      case 'lifetohand': return `${d.n || 1} Life card${(d.n || 1) > 1 ? 's' : ''} to your hand`; case 'decktolife': return 'the top of your deck to the top of your Life'; case 'selfactive': return 'set this card active';
      case 'givedon': return `give ${up(d)}${d.n} rested DON!! to ${d.who === 'chars' ? '1 of your Characters' : 'your Leader' + (d.who === 'leader' ? '' : ' or 1 Character')}`;
      case 'powerall': return `+${d.n} power to every one of your ${d.type ? '{' + d.type + '}' : '"' + d.typeq + '"'} Characters${dur(d)}`; case 'cost_restdon': return `cost: rest ${d.n} active DON!!`; case 'activedon': return `set ${up(d)}${d.n} DON!! active`;
      case 'cost_trashhand': return `cost: trash ${d.n} from your hand`; case 'cost_returndon': return `cost: return ${d.n} DON!! to the DON!! deck`; case 'cost_restself': return 'cost: rest this card';
      default: return d.a; } },
  describe(e) { if (!e) return ''; if (e.hand) return 'by hand: ' + e.raw;
    const C = c => this.condText(c), st = (e.do || []).map(d => this.stepText(d) + (d.if ? ` (if ${d.if.map(C).join(', ')})` : ''));
    return `[${this.TIMING[e.t] || e.t}]${e.if.length ? ' ' + e.if.map(C).join(', ') + ':' : ''} ${st.join('; then ')}`; },

  targetName(i, d, t) { const P = this.P(i), O = this.P(1 - i), r = String(t), k = +r.slice(1), nm = id => (this.card(id) || {}).name || 'a card';
    if (r === 'L') return nm(P.leader.id);
    if (r[0] === 'm') return P.chars[k] ? nm(P.chars[k].id) : 'a Character';
    if (r[0] === 'o') return O.chars[k] ? nm(O.chars[k].id) : 'a Character';
    if (r[0] === 'h') return ['playfromhand', 'trashhand', 'cost_trashhand'].includes(d.a) && P.hand[k] != null ? nm(P.hand[k]) : 'a card from hand';
    return 'a card'; }
};

const BOT = {
  is(i) { return !!SIM.g && SIM.g.bot === i; },

  move(i, hold = []) { if (!SIM.g || SIM.who() !== i) return null; const L = SIM.legal(i); if (!L.length) return null;
    const a = this.choose(i, L); if (!a || hold.includes(a.t)) return null; return SIM.act(i, a).ok ? a : null; },
  choose(i, L) { const g = SIM.g; if (g.phase === 'mulligan') return { t: 'keep' };
    if (g.queue.length) return this.effect(i, L); if (g.phase === 'battle') return this.defend(i, L); return this.main(i, L); },

  effect(i, L) { const g = SIM.g, P = SIM.P(i), o = g.queue[0]; if (g.hand) return { t: 'handdone' }; if (o.hand) return L.find(x => x.t === 'fxskip') || { t: 'fxhand' };
    const d = o.steps[o.step], skip = L.find(x => x.t === 'fxskip');
    if (skip && o.step === 0 && o.steps.some(st => st.a === 'cost_trashhand') && P.hand.length < 3) return skip;
    const hurts = ['ko', 'rest', 'bounce', 'bottom', 'costmod'].includes(d.a) || (d.a === 'power' && d.n < 0);
    const weakest = P.chars.length ? P.chars.map((c, k) => ({ k, p: SIM.power(i, k) })).sort((a, b) => a.p - b.p)[0].k : null;
    const fx = L.filter(x => x.t === 'fx' && (x.trash == null || x.trash === weakest));
    return fx.find(x => x.target != null && (hurts ? /^o/.test(x.target) : !/^o/.test(x.target))) || fx.find(x => x.target == null) || skip || fx[0]; },

  defend(i, L) { const b = SIM.g.battle, pw = SIM.battlePowers(), onLeader = SIM.locate().dref === 'leader';
    if (b.step === 'block') { const bl = L.find(x => x.t === 'block'); return !onLeader && pw.a >= pw.d && bl ? bl : { t: 'noblock' }; }
    if (pw.a >= pw.d && onLeader && SIM.P(i).life.length <= 2) { const P = SIM.P(i);
      const cs = L.filter(x => x.t === 'counter').sort((a, c) => SIM.num(SIM.card(P.hand[c.h]).counter) - SIM.num(SIM.card(P.hand[a.h]).counter)); if (cs.length) return cs[0]; }
    return { t: 'resolve' }; },

  main(i, L) { const P = SIM.P(i), O = SIM.P(1 - i), m = this.memo(i);
    const plays = L.filter(x => x.t === 'play' && x.trash == null).map(x => ({ x, p: SIM.card(P.hand[x.h]) })).filter(y => y.p.type === 'Character' || y.p.type === 'Stage').sort((a, b) => SIM.cost(b.p) - SIM.cost(a.p));
    if (plays.length) return plays[0].x;
    const act = L.find(x => x.t === 'activate' && !m.tried.has(x.ref + ':' + x.n) && !SIM.offers(i, 'main', x.ref).find(o => o.n === x.n).hand);
    if (act) { m.tried.add(act.ref + ':' + act.n); return act; }
    if (!m.attacked && L.some(x => x.t === 'give' && x.ref === 'leader')) return { t: 'give', ref: 'leader' };
    for (const ref of ['leader'].concat(P.chars.map((c, k) => k))) { const mine = L.filter(x => x.t === 'attack' && x.ref === ref); if (!mine.length) continue;
      const pw = SIM.power(i, ref); const prey = ref === 'leader' ? [] : mine.filter(x => x.target !== 'leader' && SIM.power(1 - i, x.target) <= pw).sort((a, b) => SIM.power(1 - i, b.target) - SIM.power(1 - i, a.target));
      m.attacked = true; return prey[0] || mine.find(x => x.target === 'leader') || mine[0]; }
    return { t: 'end' }; },
  memo(i) { const g = SIM.g; if (!this.m || this.m.g !== g || this.m.turn !== g.turn || this.m.i !== i) this.m = { g, turn: g.turn, i, tried: new Set(), attacked: false }; return this.m; }
};

const SIMUI = { sel: null, focus: null, post: null, seen: 0, pre: null, room: null, fxt: null, v: null, sheet: null,
  busy: false, timer: null, hurry: false, pace: 650, press: null, pressed: false, d1: null, d2: null, opp: 'human', first: 0, acted: null,
  wire: { relay: false, on: false },
  legalDecks() { return DECKS.all().filter(d => d.leader && legality(d).problems.length === 0); } };

const SIM_PAINTERS = 'begin';
const SIMKW_GLYPH = { Blocker: 'blocker', Rush: 'rush' };
const SIM_YOU = { activates: 'activate', gives: 'give', plays: 'play', ends: 'end', mulligans: 'mulligan', trashes: 'trash', concedes: 'concede', has: 'have', adds: 'add', counters: 'counter', takes: 'take' };
function simCan(L, pred) { return L.some(pred); }
function simSide(v, seat) { return v.me.seat === seat ? v.me : v.them; }

function simShort(X) { return String(X.name || '').split(' \u2014 ')[0]; }

function simStartText(s) { return `${s.first ? 'no draw on the first turn' : s.drew ? 'drew\u00a0' + s.drew : 'nothing to draw'} \u00b7 ${s.don ? '+' + s.don + '\u00a0DON!!' : 'no DON!! left to add'}`; }

function simOpen(v) { const L = v.legal, uniq = a => [...new Set(a)];
  return { atk: uniq(L.filter(x => x.t === 'attack').map(x => x.ref)), plays: uniq(L.filter(x => x.t === 'play').map(x => x.h)), abil: uniq(L.filter(x => x.t === 'activate').map(x => x.ref)) }; }
function simUnitName(v, ref, own) { const c = ref === 'stage' ? v.me.stage : v.me.chars[ref];
  return ref === 'leader' ? 'your Leader' + (own ? '\u2019s' : '') : esc((c || {}).name || '?') + (own ? '\u2019s' : ''); }

function simSay(line, bare, v) { let t = String(line || '');
  if (v) [v.me, v.them].forEach(X => { const sh = simShort(X); if (X.name && X.name !== sh) t = t.split(X.name).join(sh); });
  const s = t.replace(/^(T\d+ )?You (activates|gives|plays|ends|mulligans|trashes|concedes|has|adds|counters|takes)\b/, (m, t, w) => (t || '') + 'You ' + SIM_YOU[w]);
  return bare ? s.replace(/^T\d+ /, '') : s; }

function simCite(text) { return esc(text).replace(/§(\d+(?:-\d+)*)/g, (m, id) => `<button class="linkish" data-rules="${id}" style="display:inline;width:auto;padding:0;min-height:0;font:inherit;font-weight:650">§${id}</button>`); }

function simAt(v, key) { const k = String(key || ''), n = +((k.match(/\d+$/) || ['-1'])[0]);
  if (k === 'L') return v.me.leader; if (k === 'S') return v.me.stage; if (k === 'oL') return v.them.leader; if (k === 'oS') return v.them.stage;
  if (/^m\d+$/.test(k)) return v.me.chars[n] || null; if (/^o\d+$/.test(k)) return v.them.chars[n] || null;
  if (/^h\d+$/.test(k)) return (v.me.hand || [])[n] || null; if (/^x\d+$/.test(k)) return (v.me.looking || [])[n] || null;
  if (/^c\d+$/.test(k)) { const c = v.offer && v.offer.choices && v.offer.choices[n]; return c ? (c.face || simAt(v, c.ref)) : null; }
  const t = k.match(/^t([01])\.(\d+)$/); if (t) return (simSide(v, +t[1]).trash || [])[+t[2]] || null;
  return null; }

function simRef(key) { return key === 'L' ? 'leader' : key === 'S' ? 'stage' : /^m\d+$/.test(key) ? +key.slice(1) : null; }

function simFace(c, big) {
  const a = c.art, cs = c.colours || [], g = a && a.ground ? a.ground : (cs.length ? [`var(--c-${CCLASS[cs[0]]})`, `var(--c-${CCLASS[cs[1] || cs[0]]})`] : ['var(--card2)', 'var(--card)']);
  const src = a ? (big ? a.large : a.thumb) : '', nums = [c.cost, c.printedPower].filter(x => x != null).join(' \u00b7 ');
  return `<span class="sf" style="--a1:${g[0]};--a2:${g[1]}"><span class="sft"><b>${esc(c.name)}</b>${nums ? `<i>${nums}</i>` : ''}</span>${src ? `<img class="${artOk(src).trim()}" src="${esc(src)}" alt="" draggable="false" decoding="async"${big && a.thumb && a.thumb !== src ? ` data-thumb="${esc(a.thumb)}"` : ''} onload="${ART_ONLOAD}" onerror="var t=this.dataset.thumb;if(t){delete this.dataset.thumb;this.src=t}else{this.remove()}">` : ''}</span>`; }

function simBadges(c, extra) { const pw = c.power != null ? c.power : null, pp = c.printedPower, kw = c.keywords || [];
  const dir = pw != null && pp != null && pw !== pp ? (pw > pp ? ' up' : ' down') : '';
  const marks = kw.filter(k => SIMKW_GLYPH[k]).map(k => `<i title="${esc(k)}">${G(SIMKW_GLYPH[k], 12)}</i>`).join('') + (kw.includes('Double Attack') ? '<i title="Double Attack">2\u00d7</i>' : '');
  return `${pw != null ? `<span class="pw${dir}">${pw}</span>` : ''}${c.don ? `<span class="dn">+${c.don}</span>` : ''}${marks ? `<span class="kws">${marks}</span>` : ''}${c.unapplied && c.unapplied.length ? '<span class="ya"><span class="vh">its continuous text is yours to apply</span></span>' : ''}${extra || ''}`; }

function simCardHtml(c, key, o = {}) {
  const lbl = [c.name, c.type === 'Leader' ? 'Leader' : '', c.power != null ? c.power + ' power' : (c.printedPower != null ? c.printedPower + ' power' : ''), c.rested ? 'rested' : '', c.don ? c.don + ' DON!! given' : ''].concat(c.keywords || []).filter(Boolean).join(', ');
  const cls = ['sc', o.cls || '', c.rested ? 'rest' : '', SIMUI.focus === key && !o.nouid ? 'sel' : ''].filter(Boolean).join(' ');
  return `<button class="${cls}" data-sim="${o.act || 'card:' + key}" data-key="${key}"${c.uid != null && !o.nouid ? ` data-uid="${c.uid}"` : ''} aria-label="${esc(lbl + (o.say ? ' \u2014 ' + o.say : ''))}">${simFace(c) + simBadges(c, o.badge)}</button>`; }
function simSlot(label) { return `<span class="slot" aria-hidden="true">${esc(label || '')}</span>`; }

function simBack(cls, style) { return `<span class="sb${cls ? ' ' + cls : ''}"${style ? ` style="${style}"` : ''}><svg class="cb" aria-hidden="true">${cls === 'dn' ? '<use href="#g-donjp"/>' : '<use href="#g-cardart"/>'}</svg></span>`; }

function simLifeHtml(X) { const n = X.lifeCount, m = Math.min(n, 6);
  return `<span class="stk life z-life" role="img" aria-label="${n} Life">${m ? Array.from({ length: m }, (_, k) => simBack('lf', `--k:${k};--m:${m}`)).join('') : simSlot('Life')}<span class="cnt">${G('life', 12)}${n}</span></span>`; }

function simDeckHtml(X) { const n = X.deckCount, m = Math.min(n, 3);
  return `<span class="stk deck" role="img" aria-label="Deck, ${n} cards">${m ? Array.from({ length: m }, (_, k) => simBack('', `top:${(m - 1 - k) * 2}px;height:calc(100% - ${(m - 1) * 2}px);left:${k * 2}px;right:${(m - 1 - k) * 2}px`)).join('') : simSlot('Deck')}<span class="cnt">${n}</span></span>`; }

function simTrashPile(X) { const n = X.trash.length, top = n ? X.trash[n - 1] : null;
  return `<button class="stk trash z-trash" data-sim="trash:${X.seat}" aria-label="Trash, ${n} card${n === 1 ? '' : 's'}">${top ? simFace(top) : simSlot('Trash')}<span class="cnt">${n}</span></button>`; }

function simDonHtml(X) { const d = X.don, m = Math.min(d.deck, 3);
  const deck = m ? `<span class="dkst">${Array.from({ length: m }, (_, k) => simBack('dn', `left:${k * 2}px;top:${(m - 1 - k) * 2}px`)).join('')}</span>` : '';
  return `<span class="tb-don" role="img" aria-label="DON!!: ${d.active} active, ${d.rested} rested, ${d.given} given, ${d.deck} in the DON!! deck">${`<i class="tk">${G('donjp', 14)}</i>`.repeat(d.active)}${`<i class="tk r">${G('donjp', 14)}</i>`.repeat(d.rested)}<span class="dk">${deck}${d.deck}</span></span>`; }

function simTargets(v) { const L = v.legal, t = {}, lit = (key, act, badge, say) => { t[key] = { act, cls: 'aim', badge, say }; };
  if (SIMUI.room) { v.me.chars.forEach((c, k) => { if (L.some(x => x.t === 'play' && x.h === SIMUI.room.h && x.trash === k)) lit('m' + k, 'room:' + k, '<span class="tg">Trash</span>', 'trash it to make room'); }); return t; }
  if (SIMUI.fxt) { v.me.chars.forEach((c, k) => { if (L.some(x => x.t === 'fx' && x.target === SIMUI.fxt.target && x.trash === k)) lit('m' + k, 'fxroom:' + k, '<span class="tg">Trash</span>', 'trash it to make room'); }); return t; }
  if (SIMUI.sel) { L.filter(x => x.t === 'attack' && x.ref === SIMUI.sel.ref).forEach(x => lit(x.target === 'leader' ? 'oL' : 'o' + x.target, 'target:' + x.target, '', 'attack it')); t[SIMUI.sel.ref === 'leader' ? 'L' : 'm' + SIMUI.sel.ref] = { cls: 'sel' }; return t; }
  if (v.offer && !v.offer.hidden && !v.tray && v.offer.choices) v.offer.choices.forEach(c => { if (/^(L|[mo]\d+)$/.test(c.ref) && L.some(x => x.t === 'fx' && x.target === c.ref)) lit(c.ref, 'fx:' + c.ref, '', 'choose it'); });
  L.forEach(x => { if (x.t === 'block') lit('m' + x.k, 'block:' + x.k, '<span class="tg">Block</span>', 'block with it');
    if (x.t === 'counter') lit('h' + x.h, 'counter:' + x.h, `<span class="tg">+${(v.me.hand[x.h] || {}).counter}</span>`, 'counter with it');
    if (x.t === 'cevent') lit('h' + x.h, 'cev:' + x.h, '<span class="tg">Event</span>', 'play it'); });
  if (v.phase === 'main' && !v.offer && !v.battle) L.forEach(x => { const key = x.t === 'play' ? 'h' + x.h : (x.t === 'attack' || x.t === 'activate') ? (x.ref === 'leader' ? 'L' : x.ref === 'stage' ? 'S' : 'm' + x.ref) : null;
    if (key && !t[key]) t[key] = { cls: 'can' }; });
  return t; }

function simHalfHtml(v, X, mine, t) {
  const card = (c, key) => simCardHtml(c, key, t[key] || {});
  const chars = Array.from({ length: 5 }, (_, k) => X.chars[k] ? card(X.chars[k], (mine ? 'm' : 'o') + k) : simSlot(''));
  const L = card(X.leader, mine ? 'L' : 'oL'), S = X.stage ? card(X.stage, mine ? 'S' : 'oS') : simSlot('Stage');
  const back = mine ? [simLifeHtml(X), S, L, simTrashPile(X), simDeckHtml(X)] : [simDeckHtml(X), simTrashPile(X), L, S, simLifeHtml(X)];
  const art = X.leader.art, ground = art ? `<span class="tb-ground" style="--a1:${art.ground[0]};--a2:${art.ground[1]}"><img src="${esc(art.thumb)}" alt="" draggable="false" decoding="async" onerror="this.remove()"></span>` : '';
  const front = `<div class="tb-row front">${chars.join('')}</div>`, rear = `<div class="tb-row back">${back.join('')}</div>`;
  if (mine) return `<div class="tb-half me">${ground}${front}${rear}<div class="tb-foot">${simDonHtml(X)}</div></div>`;
  return `<div class="tb-half them">${ground}<div class="tb-strip"><b>${esc(simShort(X))}</b><span class="tb-hb" role="img" aria-label="${X.handCount} cards in hand">${'<i></i>'.repeat(Math.min(X.handCount, 10))}</span><span>${X.handCount} in hand</span>${simDonHtml(X)}</div>${rear}${front}</div>`; }

function simTopHtml(v) { const turn = v.over !== null ? 'The game is over' : v.phase === 'mulligan' ? 'Keep or mulligan' : `Turn ${v.turn}`;
  const W = SIMUI.wire, you = v.bot != null || W.on;
  const ended = W.on && !!W.lost && v.over === null;
  const who = v.over !== null || v.phase === 'mulligan' || ended ? '' : v.active === v.seat ? (you ? 'your turn' : simShort(v.me) + '\u2019s turn')
    : v.who === v.seat ? (you ? 'your move' : simShort(v.me) + ' decides') : W.on ? 'their turn' : simShort(v.them) + (v.bot != null ? ' is playing' : '\u2019s turn');
  const wire = !W.on || v.over !== null ? '' : W.lost ? 'match ended' : W.pending ? 'sending\u2026' : !W.live ? 'reconnecting\u2026' : W.peer ? ''
    : W.claim && W.claim.away != null ? `friend away <span data-clock="away">${simClock(W.claim.away)}</span>` : 'friend away';
  return `<div class="tb-top"><button class="tb-leave" data-sim="leave" aria-label="Leave the table">${G('back', 20)}<span>Leave</span></button><span class="tb-stat"><b>${turn}</b>${who ? ` \u00b7 ${esc(who)}` : ''}${wire ? ` \u00b7 <span class="tb-wire">${wire}</span>` : ''}</span><button class="icb" data-rules="" aria-label="Rules">${G('rules', 22)}</button><button class="icb" data-sim="log" aria-label="The log">${G('log', 22)}</button>${v.over === null && !ended ? `<button class="icb" data-sim="menu" aria-label="Game menu">${G('more', 22)}</button>` : ''}</div>`; }

function simBandHtml(v) { const b = v.battle, endOk = v.legal.some(x => x.t === 'end') && !(SIMUI.wire.on && SIMUI.wire.lost), st = v.start, fresh = !b && st && st.i === v.seat && v.active === v.seat && SIMUI.acted !== v.turn;
  const mid = fresh ? `<span class="tb-tick tb-start"><b>${v.bot != null ? 'Your turn' : esc(simShort(v.me)) + '\u2019s turn'} ${v.turn}</b> \u00b7 ${simStartText(st)}</span>` : b ? `<span class="tb-clash" aria-label="${b.powers.a} against ${b.powers.d}"><b>${b.powers.a}</b>${G('sword', 18)}<b>${b.powers.d}</b>${b.counter ? `<span>+${b.counter}</span>` : ''}</span>` : `<span class="tb-tick">${esc(simSay(v.log[0], true, v))}</span>`;
  return `<div class="tb-band">${mid}${endOk ? `<span class="tb-go tb-end"><button class="ghost go" data-sim="end">End turn</button>${v.bot != null ? '' : SIMUI.wire.on ? '<span class="note">then their turn</span>' : '<span class="note">then pass the phone</span>'}</span>` : ''}</div>`; }

function simHandHtml(v, t) { const H = v.me.hand || [];
  return `<div class="tb-hand" role="group" aria-label="Your hand, ${H.length} cards">${H.map((c, h) => { const o = t['h' + h] || {}; return simCardHtml(c, 'h' + h, Object.assign({}, o, { cls: ['hand', o.cls || (c.play && c.play.ok ? '' : 'no')].filter(Boolean).join(' ') })); }).join('') || '<span class="note">No cards in hand</span>'}</div>`; }

function simActsHtml(v, key) { const L = v.legal, ref = simRef(key), out = [];
  if (/^h\d+$/.test(key)) { const h = +key.slice(1); if (L.some(x => x.t === 'play' && x.h === h)) out.push(`<button class="ghost go" data-sim="play:${h}">Play</button>`); }
  if (ref != null) {
    if (L.some(x => x.t === 'attack' && x.ref === ref)) out.push(`<button class="ghost go" data-sim="attack:${ref}">Attack</button>`);
    L.filter(x => x.t === 'activate' && x.ref === ref).forEach((x, k) => out.push(`<button class="ghost" data-sim="fxmain:${ref}${k ? '.' + x.n : ''}">Main${k ? ' ' + (k + 1) : ''}</button>`));
    if (L.some(x => x.t === 'give' && x.ref === ref)) out.push(`<button class="ghost" data-sim="give:${ref}" title="+1000 on your turn">+DON!!</button>`); }
  return out.join(''); }

function simNextHtml(v) { const o = simOpen(v), me = v.me, parts = [];
  if (o.plays.length) parts.push(`play ${o.plays.length === 1 ? esc(me.hand[o.plays[0]].name) : 'a card'}`);
  if (o.atk.length) { const ch = o.atk.filter(r => r !== 'leader'), who = [o.atk.includes('leader') ? 'your Leader' : '', ch.length === 1 ? simUnitName(v, ch[0]) : ch.length ? ch.length + ' Characters' : ''].filter(Boolean).join(' and ');
    parts.push(`attack with ${who}`); }
  if (o.abil.length) parts.push(o.abil.length === 1 ? `use ${simUnitName(v, o.abil[0], true)} ability` : `use ${o.abil.length} abilities`);
  const first = me.taken <= 1 ? ' \u2014 no attacks on your first turn' : '';
  return `<div class="tb-say tb-next">${parts.length ? `<b>Next:</b> ${parts.join(', ')}, or End turn${first}.` : `<b>Nothing left to play or attack with</b> \u2014 End turn${first}.`}</div>`; }

function simLeft(v) { const o = simOpen(v), cap = t => t[0].toUpperCase() + t.slice(1), out = [];
  o.atk.forEach(r => out.push(`${cap(simUnitName(v, r))} can attack`));
  if (o.plays.length) out.push(o.plays.length === 1 ? `You can play ${esc(v.me.hand[o.plays[0]].name)}` : `You can play ${o.plays.length} cards`);
  o.abil.forEach(r => out.push(`${cap(simUnitName(v, r, true))} [Activate: Main] is ready`));
  return out; }
function simEndHtml(v) { return `<div class="tb-menu"><div class="note" style="margin:0">Still possible this turn:</div><ul class="tb-left">${simLeft(v).map(x => `<li>${x}</li>`).join('')}</ul><div class="tb-go"><button class="ghost go" data-sim="end:now">End turn</button><button class="ghost" data-close="simSheet">Keep playing</button></div></div>`; }

function simSkipHtml(cur, only) { const [w, n] = only ? ['Go on', `its cost cannot be paid now, so the rest does not happen (${simCite('§8-3-1-3')})`] : cur.t === 'trigger' ? ['Add to hand', `instead of its [Trigger] (${simCite('§10-1-5')})`]
    : cur.t === 'main' ? ['Cancel', 'not activated'] : cur.cost && cur.step === 0 ? ['Don\u2019t pay', `then the effect does not happen (${simCite('§8-3')})`] : ['Decline', 'its words let you'];
  return `<button class="ghost" data-sim="fxskip">${w}</button><span class="note">${n}</span>`; }

function simDockHtml(v) { const L = v.legal, b = v.battle, go = simGo;

  if (SIMUI.wire.on && SIMUI.wire.lost && v.over === null) return `<div class="tb-say"><b>The match ended</b> \u2014 ${esc(SIMUI.wire.lost)}.</div>${go('<button class="ghost go" data-sim="leave">Leave the table</button>')}`;
  const hitSay = p => `${p.a} vs ${p.d}${p.a >= p.d ? ': hit' : ': held'}`;
  if (b && v.bot != null && b.def === v.bot && v.who === v.bot) return `<div class="tb-say"><b>The app defends</b> \u2014 ${b.blocked ? 'it blocked' : 'no block'}${b.counter ? `, countered +${b.counter}` : ''}.</div>${go('<button class="ghost go" data-sim="resolve">Resolve</button>', hitSay(b.powers))}`;
  if (v.who !== v.seat) return v.bot != null && v.who === v.bot ? `<div class="tb-say">The app is playing\u2026${v.offer && !v.offer.hidden && v.offer.name ? ` <b>${esc(v.offer.name)}</b>` : ''}</div>${go('<button class="ghost" data-sim="hurry">Hurry</button>', 'its moves at once')}`
    : simClaimOn(v) ? '' : `<div class="tb-say">${esc(simShort(simSide(v, v.who)))} decides</div>`;
  if (b && b.def === v.seat && !v.offer) { const D = v.me, tgt = b.target || D.leader;
    const head = `<div class="tb-say"><b>${esc(tgt.name)}</b> is attacked by <b>${esc((b.attacker || v.them.leader).name)}</b>`;
    if (b.step === 'block') return `${head} \u2014 Block step (${simCite('§7-1-2')}): ${L.some(x => x.t === 'block') ? 'tap a lit Blocker, or' : (b.unblockable ? 'the attacker is Unblockable' : 'no active Blocker')}</div>${go('<button class="ghost" data-sim="noblock">No block</button>', 'then the counter step')}`;
    return `${head} \u2014 Counter step (${simCite('§7-1-3')}): ${L.some(x => x.t === 'counter' || x.t === 'cevent') ? 'tap a lit card in your hand, or' : 'No Counter cards in hand'}</div>${go('<button class="ghost go" data-sim="resolve">Resolve</button>', hitSay(b.powers))}`; }

  if (v.offer && !v.offer.hidden && v.offer.seat === v.seat) { const o = v.offer, n = esc(o.name);
    return `<div class="tb-say tb-next">${v.tray ? `<b>By hand:</b> do what ${n}\u2019s words say with its moves, then <b>Done</b>.` : o.t === 'trigger' ? `<b>A [Trigger] from your Life:</b> use it, or add ${n} to your hand.` : `<b>Next:</b> resolve ${n}\u2019s effect${o.hand ? ' by hand' : ''}.`}</div>`; }
  if (SIMUI.sel) { const a = simAt(v, SIMUI.sel.ref === 'leader' ? 'L' : 'm' + SIMUI.sel.ref); return `<div class="tb-say"><b>${esc(a ? a.name : '')}</b> attacks \u00b7 <span style="color:var(--accent-ink)">choose a target</span></div>${go('<button class="ghost" data-sim="aimx">Cancel</button>')}`; }
  const f = SIMUI.focus && simAt(v, SIMUI.focus);
  if (f) { const acts = simActsHtml(v, SIMUI.focus), why = /^h\d+$/.test(SIMUI.focus) && f.play && !f.play.ok ? simCite(f.play.why) : (f.play && f.play.full ? `five in play: trash one to play it (${simCite('§3-7-6-1')})` : '');
    return `<div class="tb-say"><b>${esc(f.name)}</b>${f.power != null ? ` \u00b7 ${f.power}` : ''}${f.unapplied && f.unapplied.length ? ' \u00b7 its continuous text is yours to apply; the power shown is without it' : ''}${why ? `<span class="tb-why">${why}</span>` : ''}</div>${acts}<button class="ghost" data-sim="zoom:${SIMUI.focus}">Zoom</button>`; }
  return v.phase === 'main' && v.active === v.seat && !v.battle && !v.offer ? simNextHtml(v) : `<div class="tb-say">Tap a card for its moves; hold it to read it.</div>`; }

function simHandLabel(v, a) { const P = v.me, X = a.side === 1 ? v.them : v.me, nm = c => esc((c || {}).name || '?'), at = ref => nm(ref === 'leader' ? X.leader : X.chars[ref]), who = a.side === 1 ? ' (theirs)' : '';
  switch (a.op) {
    case 'draw': return 'Draw 1'; case 'trashhand': return `Trash ${nm(P.hand[a.h])} from hand`; case 'ko': return `K.O. ${nm(X.chars[a.k])}${who}`;
    case 'rest': return `Rest ${at(a.ref)}${who}`; case 'active': return `Set ${at(a.ref)} active`; case 'activedon': return 'Set a DON!! active';
    case 'power': return `${a.v > 0 ? '+' : ''}${a.v} to ${at(a.ref)}${who}`; case 'tohand': return `${nm(X.chars[a.k])}${who} to hand`; case 'bottom': return `${nm(X.chars[a.k])}${who} to deck bottom`;
    case 'givedon': return `Give ${a.from} DON!! to ${nm(a.ref === 'leader' ? P.leader : P.chars[a.ref])}`; case 'adddon': return `Add a DON!!${a.rested ? ', rested' : ''}`; case 'returndon': return 'Return a DON!!';
    case 'lifetohand': return a.end === 'bottom' ? 'Bottom Life to hand' : 'Top Life to hand'; case 'handtolife': return `${nm(P.hand[a.h])} to Life`;
    case 'chartolife': return `${nm(P.chars[a.k])} to Life`; case 'opplifetrash': return 'Trash their Life'; case 'handtotop': return `${nm(P.hand[a.h])} to deck top`; case 'decktolife': return 'Deck top to Life'; case 'mill': return 'Trash deck top';
    case 'play': return `Play ${nm((a.zone === 'trash' ? P.trash : P.hand)[a.k])} from ${a.zone}${a.trash != null ? ', trash ' + nm(P.chars[a.trash]) : ''}`;
    case 'look': return `Look at the top ${v.tray.left.look}`; case 'lookto': return `${nm(P.looking[a.k])} to ${a.to}`;
    default: return a.op; } }

function simPick(v, key, act, caption) { const c = simAt(v, key);
  return `<span class="tb-pick">${c ? simCardHtml(c, key, { act, cls: 'aim', nouid: true, say: 'choose it' }) : `<button class="ghost" data-sim="${act}">${esc(caption)}</button>`}<span>${esc(caption)}</span></span>`; }

const SIM_MARK = { proven: '', unproven: 'Not checked yet \u2014 if the app gets it wrong, tap Report', hand: 'Yours to play \u2014 the app can\u2019t do this one', wrong: 'Yours to play \u2014 the app got this one wrong' };

function simOfferPanel(v, lead) {
  const cur = v.offer, L = v.legal; if (!cur) return '';
  const badge = SIM_MARK[cur.proof] || '';
  const report = '<button class="linkish" data-sim="report">Report</button>';
  let body;
  if (v.tray) { const moves = L.map((a, k) => ({ a, k })).filter(x => x.a.t === 'hand');
    body = `<div class="note">Only the moves its words name, each logged.</div>${(v.me.looking || []).length ? `<div class="tb-picks">${v.me.looking.map((c, k) => simPick(v, 'x' + k, 'zoom:x' + k, c.name)).join('')}</div>` : ''}<div class="tb-moves">${moves.map(x => `<button class="linkish" data-sim="hop:${x.k}">${simHandLabel(v, x.a)}</button>`).join('') || '<div class="note">No move to make \u2014 its effect is yours to apply as the text says.</div>'}</div>
      <div class="tb-go"><button class="ghost go" data-sim="hdone">Done</button>${report}</div>`; }
  else if (cur.hand) body = `<div class="tb-go"><button class="ghost go" data-sim="fxhand">Resolve by hand</button>${L.some(x => x.t === 'fxskip') ? simSkipHtml(cur) : '<span class="note">it happens in full (' + simCite('§8-1-3-1') + ')</span>'}${report}</div>`;
  else { const fx = L.filter(x => x.t === 'fx'), T = cur.choices, tg = T || [], none = fx.some(x => x.target == null);
    const room = SIMUI.fxt != null ? fx.filter(x => x.target === SIMUI.fxt.target && x.trash != null) : [];
    body = `<div class="note">The app will: ${esc(cur.does)}</div>${cur.steps > 1 ? `<div class="note">step ${cur.step + 1} of ${cur.steps}${cur.cost ? (cur.step === 0 ? ' \u2014 the cost; skipping declines the effect' : ' \u2014 the cost, paid in full once begun') : ''}</div>` : ''}
      ${room.length ? `<div class="fgrp">Five Characters: trash one to make room (${simCite('§3-7-6-1')})</div><div class="note">Tap a lit Character on the table.</div>`
      : (tg.length ? `<div class="fgrp">Choose</div><div class="tb-picks">${tg.map((t, k) => simPick(v, t.face ? 'c' + k : t.ref, 'fx:' + t.ref, t.name)).join('')}</div>` : (T ? '<div class="note">No legal target for this step.</div>' : ''))}
      <div class="tb-go">${none && !room.length ? `<button class="ghost go" data-sim="fxapply">${tg.length ? 'Choose none' : 'Apply'}</button>` : ''}${L.some(x => x.t === 'fxskip') ? simSkipHtml(cur, !fx.length) : cur.step > 0 && cur.cost ? '<span class="note">a cost begun is paid in full (' + simCite('§8-3') + ')</span>' : '<span class="note">it resolves in full (' + simCite('§8-1-3-1') + ')</span>'}${report}</div>`; }
  return `<div class="tb-panel" role="region" aria-label="${esc(cur.name)} effect">${lead || ''}<h3>${esc(cur.name)} \u2014 effect</h3><div class="note">${esc(cur.raw)}</div>${badge ? `<div class="note tb-mark">${badge}</div>` : ''}${body}</div>`; }

function simResultHtml(r) { if (!r) return '';
  return `<h3>${r.gone ? 'Ended' : (r.win ? 'Hit' : 'Held')} \u2014 ${r.a} vs ${r.d}</h3>${r.ko ? `<div class="note">${esc(r.ko)} K.O.\u2019d</div>` : ''}${r.life.map(l => l.name ? `<div class="note">Life card ${l.banished ? 'banished' : 'to hand'}: <b>${esc(l.name)}</b></div>` : '<div class="note">A Life card went to its hand</div>').join('')}`; }

function simPanelHtml(v) { const lead = SIMUI.post ? simResultHtml(v.last) : '';
  if (SIMUI.wire.on && SIMUI.wire.lost && v.over === null) return '';
  if (v.offer && v.legal.length) return simOfferPanel(v, lead);
  if (SIMUI.post) return `<div class="tb-panel">${lead}<div class="tb-go"><button class="ghost go" data-sim="post">Hand back</button><span class="note">to ${esc(simShort(v.them))}</span></div></div>`;
  if (SIMUI.room) return `<div class="tb-panel slim"><h3>Five Characters</h3><div class="note">Choose one to trash to make room (${simCite('§3-7-6-1')}) \u2014 a rule, not a K.O. Tap a lit Character.</div><div class="tb-go"><button class="ghost" data-sim="roomx">Cancel</button></div></div>`;
  if (v.offer && v.offer.hidden) return `<div class="tb-panel slim"><div class="note">${esc(simShort(simSide(v, v.offer.seat)))} decides on a Life card\u2019s [Trigger].</div></div>`;
  return ''; }

function simZoomHtml(v, key) { const c = simAt(v, key); if (!c) return '<div class="note">That card is no longer there.</div>';
  const kw = c.keywords || c.kw || [], gained = c.granted || [], acts = /^(L|S|m\d+|h\d+)$/.test(key) ? simActsHtml(v, key) : '';
  const pw = c.power != null ? `${c.power} power${c.printedPower != null && c.power !== c.printedPower ? ' (printed ' + c.printedPower + ')' : ''}` : (c.printedPower != null ? c.printedPower + ' power' : '');
  return `<div class="zm"><div class="zm-art">${simFace(c, true)}</div><div class="zm-info"><h3 class="zm-name">${esc(c.name)}</h3>
    <div class="zm-stats">${[c.num, c.type, c.cost != null ? 'cost ' + c.cost : '', pw, c.counter ? 'counter +' + c.counter : '', c.don ? c.don + ' DON!! given' : '', c.rested ? 'rested' : ''].filter(Boolean).map(esc).join(' \u00b7 ')}</div>
    ${kw.length ? `<div class="zm-kw">${kw.map(k => `<span class="kwtag">${esc(k)}${gained.includes(k) ? ' \u00b7 gained' : ''}</span>`).join('')}</div>` : ''}
    ${c.text ? `<div class="zm-text">${esc(c.text)}</div>` : ''}
    ${(c.lines || []).map(l => { const mk = l.proof === 'unproven' ? 'Not checked yet' : SIM_MARK[l.proof];
      return `<div class="zm-line">${mk ? `<div class="note">${esc(mk)}</div>` : ''}${l.proof === 'hand' || l.proof === 'wrong' ? '' : `<div class="note">The app will: ${esc(l.does)}</div>`}</div>`; }).join('')}
    ${c.unapplied && c.unapplied.length ? `<div class="why">Yours to apply: ${c.unapplied.map(esc).join(' ')} The power shown is without it.</div>` : ''}
    ${c.play && !c.play.ok ? `<div class="note">${simCite(c.play.why)}</div>` : ''}
    ${acts ? `<div class="tb-go">${acts}</div>` : ''}</div></div>`; }

const simDeckOpt = d => esc(String((d && d.name) || 'Untitled').replace(' \u2014 built from ', ' \u00b7 '));

function simLogHtml(v, n, share = true) { const lines = v.log.slice(0, n || v.log.length);
  return `<div class="tb-log">${lines.map(l => `<div class="ll">${esc(simSay(l, false, v))}</div>`).join('') || '<div class="note">\u2014</div>'}</div>${share ? '<button class="linkish" data-sim="sharelog">Share the log</button>' : ''}`; }

function simTrashSheetHtml(v, seat) { const X = simSide(v, seat), n = X.trash.length;
  return `<div class="tb-grid">${X.trash.map((c, i) => simCardHtml(c, `t${seat}.${i}`, { act: `zoom:t${seat}.${i}`, nouid: true })).reverse().join('') || '<div class="note">Nothing in this trash yet.</div>'}</div>${n ? `<div class="note">${n} card${n === 1 ? '' : 's'}, public to both players.</div>` : ''}`; }

function simClock(ms) { const t = Math.max(0, Math.floor((ms || 0) / 1000)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }

function simGo(btn, note) { return `<span class="tb-go">${btn}${note != null ? `<span class="note">${note}</span>` : ''}</span>`; }

function simClaimOn(v) { return SIMUI.wire.on && v && v.over === null ? SIMUI.wire.claim : null; }
function simClaimSay(C, nm, go) { const away = C.why === 'gone', k = away ? 'away' : 'idle', clock = `<span data-clock="${k}">${simClock(away ? C.away : C.idle)}</span>`;
  if (C.can) return `<div class="tb-say"><b>${away ? 'Their phone has been away' : `No move from ${nm} for`} ${clock}</b></div>${go('<button class="ghost go" data-sim="claim">Claim the win</button>', 'or keep waiting')}`;
  return `<div class="tb-say">${away ? 'Their phone is away' : `${nm} decides`} ${clock}</div>${go('', `at ${simClock(away ? C.windows.gone : C.windows.idle)} you can claim the win`)}`; }
function simClaimKey(C) { return C ? (C.can ? 'can ' : 'wait ') + C.why : ''; }
function simClaimRowHtml(v) { const C = simClaimOn(v); if (!C) return '';
  return `<div class="tb-claim${C.can ? ' can' : ''}">${simClaimSay(C, esc(simShort(v.them)), simGo)}</div>`; }
function simClaimHtml(v) { const C = SIMUI.wire.on ? SIMUI.wire.claim : null, nm = esc(simShort(v.them));
  if (!C || !C.can) return `<div class="tb-menu"><div class="note" style="margin:0">Nothing to claim now: ${nm} is back, or the game is not waiting on them.</div><div class="tb-go"><button class="ghost" data-close="simSheet">Close</button></div></div>`;
  return `<div class="tb-menu"><div class="note" style="margin:0">Claim the win? ${C.why === 'gone' ? 'Their phone has been away' : `${nm} has made no move for`} ${simClock(C.why === 'gone' ? C.away : C.idle)}. ${nm} loses this game; the relay checks its own clock first.</div><div class="tb-go"><button class="ghost go" data-sim="claimnow">Claim the win</button><button class="ghost" data-close="simSheet">Keep waiting</button></div></div>`; }

function simMenuHtml(v) { return `<div class="tb-menu"><div class="tb-go"><button class="ghost" data-sim="concede">Forfeit</button><span class="note">${esc(simShort(simSide(v, v.seat)))} loses (${simCite('§1-2-3')}); the table stays</span></div><div class="tb-go"><button class="ghost" data-sim="sharelog">Share the log</button></div></div>`; }

function simLeaveHtml(v) { const ended = SIMUI.wire.on && SIMUI.wire.lost && v.over === null;
  if (ended) return `<div class="tb-menu"><div class="note" style="margin:0">The match ended: ${esc(SIMUI.wire.lost)}. Leave the table and go back to the app?</div><div class="tb-go"><button class="ghost go" data-sim="leavenow">Leave</button><button class="ghost" data-close="simSheet">Stay</button></div></div>`;
  return `<div class="tb-menu"><div class="note" style="margin:0">${v.over !== null ? 'The game is over. Leave the table and go back to the app?' : `Leaving forfeits this game: ${esc(simShort(simSide(v, v.seat)))} loses (${simCite('§1-2-3')}). The table closes and the app comes back.`}</div><div class="tb-go"><button class="ghost go" data-sim="leavenow">${v.over !== null ? 'Leave' : 'Forfeit & leave'}</button><button class="ghost" data-close="simSheet">Keep playing</button></div></div>`; }

function simSideHtml(v) { return `<aside class="tb-side" aria-label="The card and the log">${SIMUI.focus && simAt(v, SIMUI.focus) ? simZoomHtml(v, SIMUI.focus) : '<div class="note">Tap a card to read it here.</div>'}<h3 class="tb-sh">Log</h3>${simLogHtml(v, 40)}</aside>`; }

function simTableHtml(v) { const t = simTargets(v);
  return `${simTopHtml(v)}<div class="tb-mat">${simHalfHtml(v, v.them, false, t)}${simBandHtml(v)}${simHalfHtml(v, v.me, true, t)}<svg class="tb-lines" aria-hidden="true"></svg></div>${simHandHtml(v, t)}<div class="tb-dock${v.who === v.seat || (v.bot != null && v.battle && v.battle.def === v.bot && v.who === v.bot && v.battle.step === 'counter' && !SIMUI.busy) ? ' you' : ''}">${simClaimRowHtml(v)}${simDockHtml(v)}</div>${simPanelHtml(v)}${simSideHtml(v)}`; }

function simMulliganHtml(v) { const M = v.me;
  return `${simTopHtml(v)}<div class="tb-mull"><h3>${esc(simShort(M))} \u2014 keep or mulligan?</h3><div class="note">Redraw once, the first player deciding first (${simCite('§5-2-1-6')}). Hold a card to read it.</div>
    <div class="tb-mrow">${simCardHtml(M.leader, 'L', { act: 'zoom:L', nouid: true })}<div class="tb-mhand">${M.hand.map((c, h) => simCardHtml(c, 'h' + h, { act: 'zoom:h' + h })).join('')}</div></div>
    <div class="tb-go"><button class="ghost go" data-sim="keep:${v.seat}">Keep</button><button class="ghost" data-sim="mull:${v.seat}">Mulligan (once)</button></div>${simClaimRowHtml(v)}</div>`; }

function simOverHtml(v) { const W = v.over === -1 ? null : simSide(v, v.over);
  return `${simTopHtml(v)}<div class="tb-over">${W ? `<div class="tb-win">${simFace(W.leader, true)}</div>` : ''}<h3>${v.over === -1 ? 'A draw \u2014 both lose at once (§9-2-1)' : esc(simShort(W)) + ' wins'}</h3>${W && W.name !== simShort(W) ? `<div class="note tb-deck">${esc(W.name.split(' \u2014 ').slice(1).join(' \u2014 '))}</div>` : ''}<div class="note">${esc(simSay(v.log[0] || '', false, v))}</div><div class="tb-go"><button class="ghost go" data-sim="new">New game</button><button class="ghost" data-sim="sharelog">Share the log</button></div>${simLogHtml(v, 12, false)}</div>`; }

function simSetupHtml(decks) { const ds = decks, i1 = Math.max(0, ds.findIndex(x => x.d.id === (SIMUI.d1 || SIMUI.pre))), i2 = SIMUI.d2 != null && ds.findIndex(x => x.d.id === SIMUI.d2) >= 0 ? ds.findIndex(x => x.d.id === SIMUI.d2) : Math.min(1, ds.length - 1);
  const bot = SIMUI.opp === 'bot', face = (x, who) => `<div class="vsl">${x && x.face ? simFace(x.face, true) : simBack('ld')}<b>${esc(who)}</b><span>${esc(x ? x.d.name || 'Untitled' : '')}</span></div>`;
  if (SIMUI.wire.on) return simOnlineHtml(ds);
  return `${ds.length ? `<div class="tb-vs">${face(ds[i1], 'Player 1')}<span class="vsx">VS</span>${face(ds[i2], bot ? 'The app' : 'Player 2')}</div>` : ''}<div class="panel"><h3>New game</h3>
      <div class="note">Two players on one phone, or you against the app. The app keeps the rules (Comprehensive Rules v${SIM.RULES}) and runs the card effects it understands; any other effect is yours to resolve <b>by hand</b>, with only the moves its words name.</div>
      ${ds.length ? `<div class="fgrp">Player 1 deck</div><select id="simD1" aria-label="Player 1 deck">${ds.map((x, i) => `<option value="${i}" ${i === i1 ? 'selected' : ''}>${simDeckOpt(x.d)}</option>`).join('')}</select>
      <div class="fgrp">${bot ? 'The app\u2019s deck' : 'Player 2 deck'}</div><select id="simD2" aria-label="Player 2 deck">${ds.map((x, i) => `<option value="${i}" ${i === i2 ? 'selected' : ''}>${simDeckOpt(x.d)}</option>`).join('')}</select>
      <div class="fgrp">Opponent</div><select id="simOpp" aria-label="Opponent"><option value="human"${bot ? '' : ' selected'}>A friend \u2014 pass the phone</option><option value="bot"${bot ? ' selected' : ''}>The app \u2014 legal and not clever; it never sees your hand</option></select>
      <div class="fgrp">Goes first (rock-paper-scissors is yours, §5-2-1-4)</div><select id="simFirst" aria-label="Who goes first"><option value="0"${SIMUI.first ? '' : ' selected'}>Player 1</option><option value="1"${SIMUI.first ? ' selected' : ''}>${bot ? 'The app' : 'Player 2'}</option></select>
      <div class="row" style="margin-top:14px"><button class="ghost go" data-sim="start" style="padding:10px 18px">Deal</button></div>`
      : `<div class="note" style="margin-top:10px">No legal deck yet \u2014 build one in <b>Decks</b> (a Leader and exactly fifty cards) and it appears here.</div>`}</div>${simOnlineHtml(ds)}`; }

function simOnlineHtml(ds) { const w = SIMUI.wire; if (!w.relay) return '';
  const deckSel = ds.length ? `<div class="fgrp">Your deck</div><select id="simDO" aria-label="Your deck for the online match"${w.dealing ? ' disabled' : ''}>${ds.map((x, i) => `<option value="${i}"${x.d.id === w.deckId ? ' selected' : ''}>${simDeckOpt(x.d)}</option>`).join('')}</select>` : '<div class="note">No legal deck yet.</div>';
  if (!w.on) return `<div class="panel" id="simOnline"><h3>Play online</h3><div class="note">Host a match and read your friend the code, or type theirs. Who goes first is the deal\u2019s coin (${simCite('§5-2-1-4')}). The server deals and runs the game: neither phone holds the other\u2019s hand. Only the code, the two decks with their cards\u2019 rules text, and the moves leave the phone.</div>${deckSel}
    <div class="row" style="margin-top:12px;gap:10px"><button class="ghost go" data-sim="host" style="padding:10px 18px"${ds.length ? '' : ' disabled'}>Host a match</button>${w.kept ? `<button class="ghost" data-sim="resume" style="padding:10px 18px">Back to ${esc(w.kept)}</button>` : ''}</div>
    <div class="fgrp">Or join with a code</div><div class="row" style="gap:8px"><input id="simCode" aria-label="The match code" placeholder="ABC234" maxlength="7" autocapitalize="characters" autocomplete="off" spellcheck="false" style="flex:1;min-width:0;text-transform:uppercase;letter-spacing:.12em"><button class="ghost" data-sim="join" style="padding:10px 18px"${ds.length ? '' : ' disabled'}>Join</button></div></div>`;
  const me = w.seat === 0 ? 'Player 1, the host' : 'Player 2', theirs = w.deckTheirs ? esc(w.deckTheirs.name || 'a deck') : null;

  const word = w.theirWord, fit = !!(w.deckTheirs && !w.unfit && word && word.ready === true);
  const check = w.lost || !w.deckTheirs ? '' : w.unfit ? `<div class="note" style="margin:6px 0 0"><b>Can\u2019t play yet:</b> ${esc(w.unfit)}</div>`
    : word && word.ready === false ? `<div class="note" style="margin:6px 0 0"><b>Their phone says:</b> ${esc(word.why || 'not ready')}</div>`
    : fit ? `<div class="note" style="margin:6px 0 0">Both decks check out${w.seat === 1 ? ': waiting for the host to deal' : ''}</div>`
    : w.peer ? '<div class="note" style="margin:6px 0 0">Checking both decks\u2026</div>' : '';

  const turned = w.turned && !w.lost ? `<div class="note" style="margin:6px 0 0"><b>Their phone turned the deal down:</b> ${esc(w.turned)}</div>` : '';

  const down = w.lost && /the relay did not answer|no socket|the relay is not ready/.test(w.lost) ? '<div class="note" style="margin:0 0 8px">Playing on this phone \u2014 a friend beside you, or the app \u2014 needs no connection: Close, then Deal.</div>' : '';
  const status = w.lost ? `<b>The match ended:</b> ${esc(w.lost)}` : !w.live ? 'connecting to the relay\u2026' : w.seat === 0 ? (w.peer ? 'your friend is here' : 'waiting for your friend to join\u2026') : (w.peer ? 'the host is here' : 'waiting for the host\u2026');
  return `<div class="panel" id="simOnline"><h3>Play online</h3>${w.seat === 0 && w.code ? `<div class="tb-code" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 0"><span class="note" style="margin:0">Read this code to your friend</span><b class="mono" style="font-size:var(--fs-hero);letter-spacing:.18em">${esc(w.code)}</b><span class="row" style="gap:8px;justify-content:center"><button class="ghost" data-sim="copycode" style="padding:8px 14px">Copy</button><button class="ghost" data-sim="sharecode" style="padding:8px 14px">Share the code</button></span></div>` : `${w.code ? `<div class="note" style="margin:0 0 8px">Joined <b class="mono">${esc(w.code)}</b></div>` : w.lost ? '' : '<div class="note" style="margin:0 0 8px">asking the relay for a code\u2026</div>'}`}
    <div class="note" style="margin:0 0 8px">You are ${me} \u00b7 ${status}</div>${down}${deckSel}${theirs ? `<div class="note" style="margin:8px 0 0">Their deck: ${theirs}</div>` : w.lost ? '' : '<div class="note" style="margin:8px 0 0">Their deck: not chosen yet</div>'}${check}${turned}
    <div class="row" style="margin-top:12px;gap:10px">${w.seat === 0 && !w.lost ? `<button class="ghost go" data-sim="deal" style="padding:10px 18px"${w.peer && fit && w.deckId != null && !w.dealing ? '' : ' disabled'}>${w.dealing ? 'Dealing\u2026' : 'Deal'}</button>` : ''}<button class="ghost" data-sim="leaveonline" style="padding:10px 18px">${w.lost ? 'Close' : 'Cancel'}</button></div></div>`; }
const SIM_PAINTERS_END = 'end';

function simClocks() { const C = SIMUI.wire && SIMUI.wire.claim; if (!C) return; document.querySelectorAll('[data-clock]').forEach(el => { const t = el.dataset.clock === 'away' ? C.away : C.idle; if (t != null) el.textContent = simClock(t); }); }
function simClaimTick() { if (simClaimKey(simClaimOn(SIMUI.v)) !== SIMUI.claimDrawn) paintSim(); else simClocks(); }

function simSeat() { const g = SIM.g; if (ONLINE.remote()) return ONLINE.sess.seat; if (SIMUI.post) return SIMUI.post.i; if (g.bot != null) return 1 - g.bot; const w = SIM.who(); return w == null ? g.active : w; }
function simWhy() { const g = SIM.g; if (g.phase === 'mulligan') return 'keep or mulligan'; if (g.queue.length) return 'an effect to resolve';
  if (g.phase === 'battle') return 'an attack is coming \u2014 block or counter'; return `turn ${g.turn}`; }

function simSubText(v) { if (!v) return 'rules by the app \u00b7 effects from the text, or by hand';
  if (v.over !== null) return 'the game is over'; if (v.phase === 'mulligan') return 'keep or mulligan';
  const mine = v.active === v.seat; return `turn ${v.turn} \u00b7 ${mine ? (v.bot != null ? 'your turn' : simShort(v.me) + '\u2019s turn') : simShort(v.them) + (v.bot != null ? ' is playing' : '\u2019s turn')}`; }

function simPaced() { return !SIMUI.hurry && typeof requestAnimationFrame === 'function' && !reducedMotion(); }

function simBotRun() { const g = SIM.g; if (!g || g.bot == null) return; clearTimeout(SIMUI.timer); SIMUI.timer = null;
  const hold = () => SIM.g.phase === 'battle' && SIM.g.battle && SIM.g.battle.att !== SIM.g.bot ? ['resolve'] : [];
  if (!simPaced()) { for (let guard = 0; SIM.who() === g.bot && guard < 400; guard++) if (!BOT.move(g.bot, hold())) break; SIMUI.busy = false; SIMUI.hurry = false; return; }
  if (SIM.who() !== g.bot) { SIMUI.busy = false; return; }
  SIMUI.busy = true;
  const step = () => { SIMUI.timer = null;
    if (SIM.g !== g || SIM.who() !== g.bot || !BOT.move(g.bot, hold())) { SIMUI.busy = false; SIMUI.hurry = false; paintSim(); return; }
    paintSim(); if (!simPaced()) { simBotRun(); paintSim(); return; } SIMUI.timer = setTimeout(step, SIMUI.pace); };
  SIMUI.timer = setTimeout(step, Math.round(SIMUI.pace * 0.6)); }

function simCurtain(text, sub, L) { if (SIM.g && SIM.g.bot != null) return; const c = $('#simCurtain'), [who, ...deck] = String(text || '').split(' \u2014 ');
  c.innerHTML = `${L && L.art ? `<div class="cur-art" aria-hidden="true"><img src="${esc(L.art.thumb)}" alt="" onerror="this.remove()"></div><div class="cur-card" aria-hidden="true"><img src="${esc(L.art.large || L.art.thumb)}" alt="" onerror="this.remove()"></div>` : ''}<div class="big" style="font-size:var(--fs-head);margin-bottom:8px">Hand the phone to</div><h2 style="font-size:var(--fs-hero);margin:0 0 6px">${esc(who)}</h2>${deck.length ? `<div class="note" style="margin:0 0 10px">${esc(deck.join(' \u2014 '))}</div>` : ''}<div class="note">${esc(sub || 'tap when you have it')}</div>`; c.classList.add('on'); }

function simAct(i, a) { if (ONLINE.remote()) return ONLINE.move(i, a);
  const g = SIM.g, before = SIM.who(), turn = g && g.turn; const r = SIM.act(i, a);
  if (!r.ok) { if (r.why) toast(r.why); return r; }
  SIMUI.acted = turn;
  SIMUI.sel = null; SIMUI.room = null; SIMUI.fxt = null; SIMUI.focus = null;
  if (a.t === 'resolve' && g.bot == null) SIMUI.post = { i };
  simAfter(before); return r; }
function simAfter(before) { const g = SIM.g; if (!g || g.over !== null || SIMUI.post) return; if (ONLINE.remote()) return; if (g.bot != null) return simBotRun();
  const w = SIM.who(); if (w != null && w !== before) simCurtain(SIM.P(w).name, simWhy(), SIM.view(w).me.leader); }

function paintSim() { const box = $('#simBoard'); if (!box) return;

  const before = simSnap(box), v = ONLINE.remote() ? ONLINE.view : SIM.g ? SIM.view(simSeat()) : null; SIMUI.v = v;
  box.classList.toggle('table', !!v); const sub = $('#simSub'); if (sub) sub.textContent = simSubText(v);
  if (!v) box.innerHTML = simSetupHtml(SIMUI.legalDecks().map(d => ({ d, face: d.leader ? SIM.face(d.leader) : null })));
  else if (v.over !== null) box.innerHTML = simOverHtml(v);
  else if (v.phase === 'mulligan') box.innerHTML = simMulliganHtml(v);
  else box.innerHTML = simTableHtml(v);
  SIMUI.claimDrawn = simClaimKey(simClaimOn(v));
  simFit(); simMotion(before, v); simReveal(v); simDecor(v); if (SIMUI.sheet && $('#simSheet').classList.contains('on')) simSheetPaint(); }

function simFit() { const b = $('#simBoard');
  if (!b || !b.classList.contains('table') || typeof b.getBoundingClientRect !== 'function' || typeof getComputedStyle !== 'function' || typeof innerHeight !== 'number') return;
  try { const W = document.documentElement.clientWidth, sec = $('#sim'), padB = parseFloat(getComputedStyle(sec).paddingBottom) || 0, wide = W >= 640;
    const H = innerHeight - (b.getBoundingClientRect().top + (window.scrollY || 0)) - padB, hand = b.querySelector('.tb-hand');
    const side = W >= 1000 ? Math.round(Math.max(280, Math.min(400, W * 0.24))) : 0; b.style.setProperty('--side', side + 'px');
    b.style.removeProperty('--hw'); if (hand) { hand.classList.remove('fit'); hand.style.removeProperty('padding-left'); hand.style.removeProperty('padding-right'); }
    const tall = cw => { b.style.setProperty('--cw', cw + 'px'); return b.getBoundingClientRect().height; };
    const h60 = tall(60), h80 = tall(80), k = (h80 - h60) / 20, o = h60 - 60 * k;
    const byW = wide ? (W - 66 - side) / 6.2 : (W - 48) / 5, byH = k > 0 ? (H - o) / k : byW;

    if (!b.querySelector('.tb-mat')) { b.style.setProperty('--cw', Math.max(44, Math.min(92, Math.floor(wide ? (W - 88 - side) / 7.24 : byW))) + 'px'); return; }
    const cw = Math.max(44, Math.min(140, Math.floor(Math.min(byW, byH)))); b.style.setProperty('--cw', cw + 'px');
    const n = hand ? hand.querySelectorAll('.sc').length : 0; if (!n) return;

    const cs = getComputedStyle(hand), px = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0), py = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const hr = hand.getBoundingClientRect(), slack = wide ? 0 : Math.max(0, H - b.getBoundingClientRect().height - 4), Wh = hr.width - px, Hh = hr.height - py + slack;

    const cap = cw * (wide ? 2 : 2.2), floor = Math.max(56, cw * (wide ? 0.7 : 0.85));
    let best = null; for (let rows = 1; rows <= (wide ? n : 2); rows++) { const per = Math.ceil(n / rows), a = Wh / (1 + 0.4 * (per - 1));
      const w = Math.floor(Math.min((Hh - (rows - 1) * 12 - 6) / rows / 1.397, per === 1 ? Wh : a >= 110 ? a : Wh - 44 * (per - 1), cap));
      if (!best || w > best.w) best = { rows, per, w }; }
    if (best.w >= floor) { const { per, w } = best, step = per > 1 ? Math.floor(Math.min(w + 6, (Wh - w) / (per - 1))) : w + 6, row = w + (per - 1) * step;
      hand.classList.add('fit'); b.style.setProperty('--hw', w + 'px'); hand.style.setProperty('--hx', Math.min(w, step - 6 * (step >= w + 6)) + 'px');

      hand.style.paddingLeft = hand.style.paddingRight = Math.max(0, Math.floor((hr.width - row) / 2) - 1) + 'px';

      const last = n - per * (Math.ceil(n / per) - 1), lastStep = last > 1 ? Math.floor(Math.min(w + 6, (row - w) / (last - 1))) : step;
      hand.querySelectorAll('.sc').forEach((e, i) => { const s = i >= n - last ? lastStep : step, top = i === n - 1 || i % per === per - 1;
        e.style.marginLeft = i % per ? (s - w - 6) + 'px' : '0'; e.style.setProperty('--hx', (top ? w : Math.min(w, s - 6 * (s >= w + 6))) + 'px'); }); return; }

    if (!wide) { if (slack > 4) b.style.setProperty('--hw', Math.floor(Math.min(cw * 1.45, cw * 1.12 + slack / 1.397)) + 'px'); return; }
    const per = Math.max(1, Math.floor((Wh + 6) / (floor + 6))); b.style.setProperty('--hw', Math.floor(Math.min(cap, (Wh - (per - 1) * 6) / per)) + 'px'); } catch (e) {} }

function simSnap(box) { const v = SIMUI.v; if (!v || !box || typeof box.querySelectorAll !== 'function' || typeof box.getBoundingClientRect !== 'function') return null;
  try { const at = new Map(), rect = sel => { const e = box.querySelector(sel); return e ? e.getBoundingClientRect() : null; };
    box.querySelectorAll('.tb-mat [data-uid]').forEach(e => at.set(e.dataset.uid, { r: e.getBoundingClientRect(), html: e.outerHTML, mine: !!e.closest('.me') }));
    return { v, at, trash: { me: rect('.me .z-trash'), them: rect('.them .z-trash') }, life: { me: rect('.me .z-life'), them: rect('.them .z-life') }, hand: { me: rect('.tb-hand'), them: rect('.tb-hb') }, deck: { me: rect('.me .deck'), them: rect('.them .deck') } }; }
  catch (e) { return null; } }

function simMotion(b, v) { const box = $('#simBoard');
  if (!b || !v || !box || b.v.seat !== v.seat || b.v.over !== null || reducedMotion() || typeof Element === 'undefined' || !Element.prototype.animate) return;
  try { const E = [...box.querySelectorAll('.tb-mat [data-uid]')], now = new Map(E.map(e => [e.dataset.uid, e]));
    const cards = x => { const m = new Map(); [x.me, x.them].forEach(X => [X.leader, X.stage, ...X.chars].forEach(c => { if (c) m.set(String(c.uid), c); })); return m; };
    const old = cards(b.v), cur = cards(v), ease = 'cubic-bezier(.4,0,.2,1)';
    for (const e of E) { const uid = e.dataset.uid, o = b.at.get(uid), was = old.get(uid), c = cur.get(uid);
      if (!o) { e.animate([{ transform: 'translateY(-16px) scale(1.2)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' }); continue; }
      const r = e.getBoundingClientRect(), dx = o.r.left - r.left, dy = o.r.top - r.top;
      if (Math.abs(dx) + Math.abs(dy) > 2) e.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 280, easing: ease });
      if (!was || !c) continue; const f = e.querySelector('.sf'), p = e.querySelector('.pw'), d = e.querySelector('.dn');
      if (f && was.rested !== c.rested) f.animate(c.rested ? [{ transform: 'none' }, { transform: 'rotate(90deg) scale(.715)' }] : [{ transform: 'rotate(90deg) scale(.715)' }, { transform: 'none' }], { duration: 280, easing: ease });
      if (p && was.power !== c.power) p.animate([{ transform: 'translateX(-50%) scale(1.6)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 380, easing: 'ease-out' });
      if (d && c.don > was.don) d.animate([{ transform: 'translateY(-18px) scale(1.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
    for (const [uid, o] of b.at) if (!now.has(uid)) simGhost(o.html, o.r, (o.mine ? b.trash.me : b.trash.them) || o.r, 0);
    ['me', 'them'].forEach(s => { const lost = b.v[s].lifeCount - v[s].lifeCount; for (let k = 0; k < lost && b.life[s]; k++) simGhost(simBack(), b.life[s], b.hand[s] || b.life[s], k * 140); });
    if (v.turn !== b.v.turn) { simBanner(v);

      const st = v.start, s = st && (st.i === v.seat ? 'me' : 'them');
      if (st && st.drew && b.deck && b.deck[s]) simGhost(simBack(), b.deck[s], b.hand[s] || b.deck[s], 180);
      if (st && st.don) [...box.querySelectorAll(`.tb-half.${s} .tb-don .tk`)].filter(e => !e.classList.contains('r')).slice(-st.don)
        .forEach((e, k) => e.animate([{ transform: 'translateY(-14px) scale(1.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: 300 + k * 150, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' })); }
    if (v.battle && !b.v.battle && v.battle.attacker) { const e = now.get(String(v.battle.attacker.uid)); if (e) e.animate([{ transform: 'none' }, { transform: `translateY(${v.battle.att === v.seat ? -16 : 16}px) scale(1.08)` }, { transform: 'none' }], { duration: 440, easing: 'ease-out' }); }
  } catch (e) {} }

function simReveal(v) { const box = $('#simBoard'); if (!v || !box || v.over !== null) return;
  const shown = SIMUI.shown || (SIMUI.shown = new Set());
  (v.phase === 'mulligan' ? [['L', v.me.seat]] : [['L', v.me.seat], ['oL', v.them.seat]]).forEach(([key, seat]) => { if (shown.has(seat)) return; shown.add(seat);
    const e = typeof box.querySelector === 'function' && box.querySelector(`[data-key="${key}"]`);
    if (!e || reducedMotion() || typeof Element === 'undefined' || !Element.prototype.animate || e.classList.contains('rest')) return;
    try { const f = e.querySelector('.sf'), t = document.createElement('span'); if (!f) return; t.innerHTML = simBack('ld rv'); const bk = t.firstChild; e.appendChild(bk);
      const wait = 180 + 140 * (key === 'oL'), turn = 260, p = 'perspective(700px) ';
      bk.animate([{ transform: p + 'rotateY(0deg)' }, { transform: p + 'rotateY(0deg)', offset: wait / (wait + turn) }, { transform: p + 'rotateY(90deg)' }], { duration: wait + turn, easing: 'ease-in', fill: 'forwards' }).onfinish = () => bk.remove();
      f.animate([{ transform: p + 'rotateY(-90deg)' }, { transform: p + 'rotateY(-90deg)', offset: (wait + turn) / (wait + 2 * turn) }, { transform: p + 'rotateY(0deg)' }], { duration: wait + 2 * turn, easing: 'ease-out' });
      setTimeout(() => bk.remove(), wait + turn + 400); } catch (err) {} }); }

function simGhost(html, from, to, delay) { if (!from || !document.body || !document.body.appendChild) return;
  const d = document.createElement('div'); d.className = 'tb-ghost'; d.innerHTML = html;
  Object.assign(d.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' }); document.body.appendChild(d);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const a = d.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0 }], { duration: 560, delay, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  a.onfinish = () => d.remove(); setTimeout(() => d.remove(), 1600 + delay); }

function simBanner(v) { const mat = document.querySelector('#simBoard .tb-mat'); if (!mat) return; const b = document.createElement('div'); b.className = 'tb-banner';
  const mine = v.active === v.seat, st = v.start ? simStartText(v.start) : ''; b.innerHTML = `<b>Turn ${v.turn}</b><span>${mine ? (v.bot != null ? 'Your turn' : esc(simShort(v.me)) + '\u2019s turn') : esc(simShort(v.them)) + (v.bot != null ? ' plays' : '\u2019s turn')}</span>${st ? `<span class="st">${st[0].toUpperCase() + st.slice(1)}</span>` : ''}`;
  mat.appendChild(b); setTimeout(() => b.remove(), 1600); }

function simDecor(v) { const box = $('#simBoard'); if (!v || !box || typeof box.querySelector !== 'function') return;
  try { const mat = box.querySelector('.tb-mat'), svg = box.querySelector('.tb-lines'); if (!mat || !svg || typeof mat.getBoundingClientRect !== 'function') return;
    const m = mat.getBoundingClientRect(), mid = e => { const r = e.getBoundingClientRect(); return [Math.round(r.left - m.left + r.width / 2), Math.round(r.top - m.top + r.height / 2)]; };
    const b = v.battle, from = b && b.attacker && mat.querySelector(`[data-uid="${b.attacker.uid}"]`), to = b && b.target && mat.querySelector(`[data-uid="${b.target.uid}"]`);
    if (from && to) { const [x1, y1] = mid(from), [x2, y2] = mid(to); svg.innerHTML = `<defs><marker id="tbArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#E0553D"/></marker></defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#E0553D" stroke-width="5" stroke-linecap="round" stroke-dasharray="12 8" marker-end="url(#tbArrow)"/>`; }
    const r = v.last; if (!r || r.n === SIMUI.seen || r.turn !== v.turn || v.over !== null) return; SIMUI.seen = r.n;
    const own = r.life.filter(l => l.name).map(l => `${l.banished ? 'Banished' : 'To hand'}: ${esc(l.name)}`).join(' \u00b7 ');
    const d = document.createElement('div'); d.className = 'tb-burst ' + (r.gone ? 'held' : r.win ? 'hit' : 'held'); d.setAttribute('role', 'status');
    d.innerHTML = `<b>${r.gone ? 'Ended' : r.ko ? 'K.O.' : r.win ? 'Hit' : 'Held'}</b><span>${r.a} vs ${r.d}${own ? ' \u00b7 ' + own : ''}</span>`;
    mat.appendChild(d); setTimeout(() => d.remove(), 1700); if (r.win && !r.gone) PLATFORM.haptic(); } catch (e) {} }

function simSheetOpen(kind, arg) { SIMUI.sheet = { kind, arg }; simSheetPaint(); $('#simSheet').classList.add('on'); }
function simSheetPaint() { const s = SIMUI.sheet, v = SIMUI.v; if (!s || !v) return;
  $('#simSheetTitle').textContent = s.kind === 'trash' ? `${simShort(simSide(v, +s.arg))}\u2019s trash` : ({ zoom: 'The card', log: 'The log', menu: 'The game', leave: 'Leave the table', endq: 'End your turn?', claim: 'Claim the win?' }[s.kind] || '');
  $('#simSheetBody').innerHTML = s.kind === 'zoom' ? simZoomHtml(v, s.arg) : s.kind === 'log' ? simLogHtml(v) : s.kind === 'trash' ? simTrashSheetHtml(v, +s.arg) : s.kind === 'leave' ? simLeaveHtml(v) : s.kind === 'endq' ? simEndHtml(v) : s.kind === 'claim' ? simClaimHtml(v) : simMenuHtml(v); }
function simLogText() { if (ONLINE.remote()) { const v = ONLINE.view, S = [v.me, v.them].sort((a, b) => a.seat - b.seat);
    return [`OP TCG Hub sim \u2014 take ${TAKE} \u2014 rules v${v.rules} \u2014 played online`, `${S[0].name} (${CAT.byId.get(S[0].leader.id)?.name}) vs ${S[1].name} (${CAT.byId.get(S[1].leader.id)?.name}), turn ${v.turn}`, '', ...v.log.slice().reverse().map(l => simSay(l, false, v))].join('\n'); }
  const g = SIM.g; if (!g) return ''; const P = i => g.players[i]; return [`OP TCG Hub sim \u2014 take ${TAKE} \u2014 rules v${SIM.RULES}`, `${P(0).name} (${CAT.byId.get(P(0).leader.id)?.name}) vs ${P(1).name} (${CAT.byId.get(P(1).leader.id)?.name}), turn ${g.turn}`, '', ...g.log.slice().reverse().map(l => simSay(l, false, SIMUI.v))].join('\n'); }

function simReport() { if (ONLINE.remote()) { const v = ONLINE.view, o = v.offer && !v.offer.hidden ? v.offer : null, p = o && SIM.card(o.cardId);
    return JSON.stringify({ kind: 'optcghub-sim-report', v: 1, take: TAKE, rules: v.rules, online: { seat: v.seat, moves: ONLINE.sess.n, engine: ONLINE.engine, relayEngine: ONLINE.sess.relayEngine || null }, spec: null, actions: null,
      offer: o ? { cardId: o.cardId, num: p && p.num, name: o.name, t: o.t, raw: o.raw, proof: o.proof, step: o.step } : null, log: v.log.slice(0, 30) }, null, 1); }
  const g = SIM.g, o = g.queue[0]; const p = o && SIM.card(o.cardId);
  return JSON.stringify({ kind: 'optcghub-sim-report', v: 1, take: TAKE, rules: SIM.RULES, spec: g.spec, actions: g.actions,
    offer: o ? { cardId: o.cardId, num: p && p.num, name: p && p.name, t: o.e.t, raw: o.e.raw, parsed: o.e.do, proof: SIM.proofOf(o.cardId, o.e), step: o.step } : null,
    log: g.log.slice(0, 30) }, null, 1); }

function simShare(title, text) { const SH = PLATFORM.plugin('Share'); if (SH) { Promise.resolve(SH.share({ title, text, dialogTitle: title })).catch(() => {}); return; }
  if (navigator.share) navigator.share({ title, text }).catch(() => {}); else { try { navigator.clipboard.writeText(text); toast('Copied'); } catch (e) { toast('Copy failed'); } } }

function simTap(code) { const s = String(code), c = s.indexOf(':'), act = c < 0 ? s : s.slice(0, c), arg = c < 0 ? null : s.slice(c + 1);
  const ref = arg === 'leader' || arg === 'stage' ? arg : (arg == null || arg === '' || isNaN(+arg) ? arg : +arg);
  if (act === 'start') { const ds = SIMUI.legalDecks(); if (!ds.length) return; const d1 = ds[+$('#simD1').value] || ds[0], d2 = ds[+$('#simD2').value] || ds[Math.min(1, ds.length - 1)], first = +$('#simFirst').value || 0;
    const bot = $('#simOpp') && $('#simOpp').value === 'bot';
    SIM.new({ ...d1, name: (bot ? 'You' : 'Player 1') + (d1.name ? ' \u2014 ' + d1.name : '') },
      { ...d2, name: (bot ? 'The app' : 'Player 2') + (d2.name ? ' \u2014 ' + d2.name : '') }, first, bot ? { bot: 1 } : {});
    Object.assign(SIMUI, { sel: null, focus: null, post: null, room: null, fxt: null, seen: 0, hurry: false, shown: new Set(), acted: null });
    if (bot) simBotRun(); else simCurtain(SIM.P(SIM.who()).name, 'keep or mulligan first', SIM.view(SIM.who()).me.leader); paintSim(); window.scrollTo(0, 0); return; }
  if (act === 'new') { clearTimeout(SIMUI.timer); SIM.g = null; if (ONLINE.on()) ONLINE.leave(false); Object.assign(SIMUI, { sel: null, focus: null, post: null, room: null, fxt: null, busy: false, hurry: false, sheet: null }); paintSim(); return; }
  if (act === 'sharelog') { simShare('OP TCG Hub game log', simLogText()); return; }
  if (act === 'report') { simShare('OP TCG Hub \u2014 a Sim effect report', simReport()); return; }

  if (act === 'host' || act === 'join') { const ds = SIMUI.legalDecks(), sel = $('#simDO'), d = ds[+(sel && sel.value)] || ds[0]; if (act === 'host') ONLINE.host(d); else ONLINE.join(($('#simCode') || {}).value, d); return; }
  if (act === 'deal') { ONLINE.deal(); return; }
  if (act === 'resume') { ONLINE.resume(); paintSim(); return; }

  if (act === 'copycode') { const code = ONLINE.sess && ONLINE.sess.code; if (code) { try { Promise.resolve(navigator.clipboard.writeText(code)).then(() => toast('Code copied'), () => toast('Copy failed')); } catch (e) { toast('Copy failed'); } } return; }
  if (act === 'sharecode') { const c = ONLINE.sess && ONLINE.sess.code; if (c) simShare('OP TCG Hub \u2014 play me', `Play me in OP TCG Hub: Prep & Play \u2192 Sim \u2192 Play online \u2192 Join, and type ${c}`); return; }
  if (act === 'leaveonline') { ONLINE.leave(false); paintSim(); return; }
  const v = SIMUI.v; if (!v) return;
  if (act === 'log' || act === 'menu' || act === 'leave' || act === 'claim') return simSheetOpen(act);
  if (act === 'claimnow') { SIMUI.sheet = null; const sh = $('#simSheet'); if (sh) sh.classList.remove('on'); if (!ONLINE.claim()) toast('Nothing to claim now'); return; }

  if (act === 'leavenow') { const was = ONLINE.remote() ? ONLINE.view.over === null && !ONLINE.sess.lost : SIM.g && SIM.g.over === null; if (ONLINE.on()) ONLINE.leave(was); else if (was) SIM.act(simSeat(), { t: 'concede' }); clearTimeout(SIMUI.timer); SIM.g = null;
    Object.assign(SIMUI, { sel: null, focus: null, post: null, room: null, fxt: null, busy: false, hurry: false, sheet: null, seen: 0 }); $('#simCurtain').classList.remove('on'); paintSim(); window.scrollTo(0, 0); if (was) toast('Forfeited \u2014 the table is closed'); return; }
  if (act === 'trash' || act === 'zoom') return simSheetOpen(act, arg);
  if (act === 'card') { SIMUI.focus = SIMUI.focus === arg ? null : arg; SIMUI.sel = null; paintSim(); return; }
  if (act === 'aimx') { SIMUI.sel = null; paintSim(); return; }
  if (act === 'roomx') { SIMUI.room = null; paintSim(); return; }
  if (act === 'hurry') { SIMUI.hurry = true; simBotRun(); paintSim(); return; }
  if (act === 'post') { const before = SIMUI.post.i; SIMUI.post = null; simAfter(before); paintSim(); return; }
  if (SIMUI.busy && act !== 'concede') return;
  const L = v.legal, pick = f => L.find(f), send = (a, seat = v.seat) => { if (a) simAct(seat, a); else toast('Not now'); };
  switch (act) {
    case 'keep': case 'mull': send(pick(x => x.t === act)); break;
    case 'play': { const h = +arg, one = pick(x => x.t === 'play' && x.h === h && x.trash == null);
      if (one) send(one); else if (L.some(x => x.t === 'play' && x.h === h)) { SIMUI.room = { h }; SIMUI.focus = null; } else { const hc = (v.me.hand || [])[h]; toast(hc && hc.play && hc.play.why ? hc.play.why : 'Not now'); } break; }
    case 'room': { const h = SIMUI.room && SIMUI.room.h; SIMUI.room = null; send(pick(x => x.t === 'play' && x.h === h && x.trash === +arg)); break; }
    case 'give': send(pick(x => x.t === 'give' && x.ref === ref)); break;
    case 'fxmain': { const [r0, n] = String(arg).split('.'), r = r0 === 'leader' || r0 === 'stage' ? r0 : +r0; send(pick(x => x.t === 'activate' && x.ref === r && (n == null || x.n === +n))); break; }
    case 'attack': if (L.some(x => x.t === 'attack' && x.ref === ref)) { SIMUI.sel = SIMUI.sel && SIMUI.sel.ref === ref ? null : { ref }; SIMUI.focus = null; } else toast('It cannot attack now'); break;
    case 'target': { const a = SIMUI.sel && pick(x => x.t === 'attack' && x.ref === SIMUI.sel.ref && x.target === ref); SIMUI.sel = null; send(a); break; }
    case 'block': send(pick(x => x.t === 'block' && x.k === +arg)); break;
    case 'noblock': send(pick(x => x.t === 'noblock')); break;
    case 'counter': send(pick(x => x.t === 'counter' && x.h === +arg)); break;
    case 'cev': send(pick(x => x.t === 'cevent' && x.h === +arg)); break;
    case 'resolve': { const mine = pick(x => x.t === 'resolve'); if (mine) send(mine); else if (v.bot != null && v.battle && v.battle.def === v.bot && v.who === v.bot) send({ t: 'resolve' }, v.bot); break; }
    case 'fx': { const all = L.filter(x => x.t === 'fx' && x.target === arg); if (all.some(x => x.trash != null)) SIMUI.fxt = { target: arg }; else send(all[0]); break; }
    case 'fxroom': { const tg = SIMUI.fxt && SIMUI.fxt.target; SIMUI.fxt = null; send(pick(x => x.t === 'fx' && x.target === tg && x.trash === +arg)); break; }
    case 'fxapply': { const all = L.filter(x => x.t === 'fx' && x.target == null); if (all.length && all.every(x => x.trash != null)) SIMUI.fxt = { target: null }; else send(all.find(x => x.trash == null)); break; }
    case 'fxskip': send(pick(x => x.t === 'fxskip')); break;
    case 'fxhand': send(pick(x => x.t === 'fxhand')); break;
    case 'hop': { const a = L[+arg]; if (a && a.t === 'hand') send(a); break; }
    case 'hdone': send(pick(x => x.t === 'handdone')); break;
    case 'end': if (arg !== 'now' && simLeft(v).length) return simSheetOpen('endq'); send(pick(x => x.t === 'end')); break;
    case 'concede': simAct(simSeat(), { t: 'concede' }); break;
  }
  paintSim(); }
$('#sim').addEventListener('click', e => { const b = e.target.closest('[data-sim]'); if (!b) return; if (SIMUI.pressed) { SIMUI.pressed = false; return; } simTap(b.dataset.sim); });

$('#simSheet').addEventListener('click', e => { const b = e.target.closest('[data-sim]'); if (!b) return; const code = b.dataset.sim;
  if (!/^(zoom|trash|log|menu|leave|sharelog|report)(:|$)/.test(code)) $('#simSheet').classList.remove('on'); simTap(code); });

$('#sim').addEventListener('change', e => { const t = e.target, ds = SIMUI.legalDecks(); if (!t || !/^sim(D1|D2|Opp|First|DO)$/.test(t.id)) return;
  if (t.id === 'simDO') { ONLINE.setDeck(ds[+t.value] || null); return; }
  if (t.id === 'simD1') SIMUI.d1 = (ds[+t.value] || {}).id || null; if (t.id === 'simD2') SIMUI.d2 = (ds[+t.value] || {}).id || null;
  if (t.id === 'simOpp') SIMUI.opp = t.value; if (t.id === 'simFirst') SIMUI.first = +t.value || 0; paintSim(); });

$('#simBoard').addEventListener('pointerdown', e => { const c = e.target.closest && e.target.closest('.sc[data-key]'); clearTimeout(SIMUI.press); SIMUI.pressed = false; if (!c) return;
  SIMUI.press = setTimeout(() => { SIMUI.pressed = true; simSheetOpen('zoom', c.dataset.key); }, 450); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => $('#simBoard').addEventListener(t, () => clearTimeout(SIMUI.press)));
$('#simBoard').addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('.sc')) e.preventDefault(); });
addEventListener('resize', () => { if (SIMUI.v && $('#sim').classList.contains('on')) { simFit(); simDecor(SIMUI.v); } });
$('#simCurtain').addEventListener('click', () => { $('#simCurtain').classList.remove('on'); paintSim(); });

const ONLINE = {
  relay: 'https://optcghub-relay.optcghub.workers.dev',
  engine: '870ff3e7efb632f3',
  PROTO: 3,

  CLAIM_PROTO: 4, ticker: null, TICK: 1000,
  sess: null, ws: null, timer: null, pinger: null, pending: null, view: null, KEY: 'optcghub.online',
  WAIT: 6000, waiter: null,
  RETRY: 1500, TRIES: 3,
  ready() { return /^https?:\/\//.test(this.relay); },
  on() { return !!this.sess; },
  playing() { return !!(this.sess && this.sess.state === 'play' && this.view); },
  remote() { return !!(this.sess && this.view); },
  url(path) { return this.relay.replace(/\/$/, '') + path; },
  socketUrl(code, token) { return this.url('/ws/' + code).replace(/^http/, 'ws') + (token ? '?t=' + encodeURIComponent(token) : ''); },
  NAME: 60,
  COLS: ['num', 'name', 'type', 'color', 'cost', 'power', 'life', 'counter', 'attr', 'subtypes', 'kw', 'text'],

  sha(text) { const s = String(text), b = []; for (let i = 0; i < s.length; i++) { let c = s.charCodeAt(i);
      if (c >= 0xD800 && c < 0xDC00 && i + 1 < s.length) { const d = s.charCodeAt(i + 1); if (d >= 0xDC00 && d < 0xE000) { c = 0x10000 + ((c - 0xD800) << 10) + (d - 0xDC00); i++; } }
      if (c < 0x80) b.push(c); else if (c < 0x800) b.push(0xC0 | (c >> 6), 0x80 | (c & 63)); else if (c < 0x10000) b.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); else b.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
    const bits = b.length * 8, K = [], H = [], frac = x => ((x % 1) * 4294967296) >>> 0; for (let p = 2; K.length < 64; p++) { let prime = true; for (let q = 2; q * q <= p; q++) if (p % q === 0) { prime = false; break; } if (prime) { if (H.length < 8) H.push(frac(Math.sqrt(p))); K.push(frac(Math.cbrt(p))); } }
    b.push(0x80); while (b.length % 64 !== 56) b.push(0); b.push(0, 0, 0, Math.floor(bits / 4294967296) & 255, (bits >>> 24) & 255, (bits >>> 16) & 255, (bits >>> 8) & 255, bits & 255);
    const w = new Array(64), R = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < b.length; o += 64) { for (let i = 0; i < 16; i++) w[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) { const x = w[i - 15], y = w[i - 2]; w[i] = (w[i - 16] + (R(x, 7) ^ R(x, 18) ^ (x >>> 3)) + w[i - 7] + (R(y, 17) ^ R(y, 19) ^ (y >>> 10))) | 0; }
      let [a, c, d, e, f, g, h, k] = H; for (let i = 0; i < 64; i++) { const t1 = (k + (R(f, 6) ^ R(f, 11) ^ R(f, 25)) + ((f & g) ^ (~f & h)) + K[i] + w[i]) | 0, t2 = ((R(a, 2) ^ R(a, 13) ^ R(a, 22)) + ((a & c) ^ (a & d) ^ (c & d))) | 0; k = h; h = g; g = f; f = (e + t1) | 0; e = d; d = c; c = a; a = (t1 + t2) | 0; }
      [a, c, d, e, f, g, h, k].forEach((v, i) => { H[i] = (H[i] + v) | 0; }); }
    return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join(''); },

  rows(deck) { const cards = deck && Array.isArray(deck.cards) ? deck.cards : [];
    const ids = [...new Set([deck && deck.leader, ...cards.map(c => c && c.id)])].filter(Number.isInteger).sort((a, b) => a - b);
    return ids.map(id => { const p = CAT.byId.get(id); return p ? [id, this.COLS.map(k => p[k] == null ? null : p[k]), CAT.effects[String(id)] || null, CAT.proof[String(id)] || null] : [id, null]; }); },
  digest(deck) { return this.sha(JSON.stringify(this.rows(deck))); },
  deckOf(d) { if (!d) return null; const x = { name: String(d.name || '').slice(0, this.NAME), leader: d.leader, cards: d.cards.map(c => ({ id: c.id, n: c.n })) };
    return Object.assign(x, { proto: this.PROTO, engine: this.engine, rows: this.rows(x), digest: this.digest(x) }); },

  verdict(d) { if (!d) return null; const both = t => [t, t];
    if (d.proto !== this.PROTO) return ['the other phone needs an update before you can play', 'this phone needs an update before you can play'];
    const cards = d.cards;
    if ((d.name != null && (typeof d.name !== 'string' || d.name.length > this.NAME)) || !Number.isInteger(d.leader) || !Array.isArray(cards) || cards.length > RULES.DECK_SIZE || !cards.every(c => c && Number.isInteger(c.id) && Number.isInteger(c.n) && c.n >= 1 && c.n <= RULES.DECK_SIZE))
      return ['their deck list came through malformed', 'your deck list reached their phone malformed'];
    const n = cards.reduce((a, c) => a + c.n, 0);
    if (!CAT.byId.get(d.leader) || SIM.expand({ cards }).length !== n)
      return ['their deck has a card this phone\u2019s catalogue does not know: sync both phones (More \u2192 Sync)', 'your deck has a card their catalogue does not know: sync both phones (More \u2192 Sync)'];
    const bad = legality({ leader: d.leader, cards }).problems; if (bad.length) return ['their deck is not legal: ' + bad[0], 'your deck is not legal on their phone: ' + bad[0]];
    if (d.digest !== this.digest(d)) return both('the two phones hold different card data: sync both (More \u2192 Sync)');
    return null; },
  listKey(d) { return d ? String(d.leader) + '|' + (Array.isArray(d.cards) ? d.cards : []).map(c => (c && c.id) + 'x' + (c && c.n)).sort().join(',') : ''; },
  sameDeck(a, b) { return !!a && !!b && this.listKey(a) === this.listKey(b); },

  offerProblem(decks) { const s = this.sess, both = t => [t, t]; if (!Array.isArray(decks) || decks.length !== 2 || !decks[0] || !decks[1]) return both('the deal came through malformed');
    const mine = decks[s.seat], theirs = decks[1 - s.seat];
    if (!s.deckMine || !this.sameDeck(mine, s.deckMine)) return both('a deck changed while the deal was on its way: deal again');
    if (mine.digest !== s.deckMine.digest) return both('the relay did not read a deck as it was sent: deal again');
    return this.verdict(Object.assign({}, theirs, { proto: this.PROTO })); },

  sendDeck() { const s = this.sess; if (!s || !s.deckMine || this.view) return; const v = s.deckTheirs ? this.verdict(s.deckTheirs) : null;
    this.send({ t: 'deck', deck: Object.assign({}, s.deckMine, s.deckTheirs ? { ready: !v, why: v ? v[1] : null } : {}) }); },

  mirror() { const s = this.sess, k = !s && this.kept();
    SIMUI.wire = { relay: this.ready(), on: !!s, code: s && s.code, seat: s && s.seat, live: !!(s && s.live), peer: !!(s && s.peer), deckId: s && s.deckId, deckTheirs: s && s.deckTheirs, lost: s && s.lost, pending: !!this.pending, playing: this.playing(), kept: k ? k.code : null,
      unfit: s ? s.unfit || null : null, theirWord: s ? s.theirWord || null : null, dealing: !!(s && s.dealing), turned: s ? s.turned || null : null, claim: this.claimState() }; },

  claimState() { const s = this.sess, v = this.view; if (!s || !v || v.over !== null || s.lost || !s.windows || s.state !== 'play') return null;
    const now = Date.now(), away = !s.peer && s.awayAt != null ? Math.max(0, now - s.awayAt) : null, idle = v.who === 1 - s.seat && s.waitAt != null ? Math.max(0, now - s.waitAt) : null;
    if (away == null && idle == null) return null;
    const toGone = away != null ? s.windows.gone - away : Infinity, toIdle = idle != null ? s.windows.idle - idle : Infinity, left = Math.max(0, Math.min(toGone, toIdle), s.claimAfter ? s.claimAfter - now : 0);
    return { away, idle, why: toGone <= toIdle ? 'gone' : 'idle', left, can: left <= 0, windows: s.windows }; },

  claim() { const c = this.claimState(); return !!(c && c.can && this.send({ t: 'claim' })); },

  tick() { clearTimeout(this.ticker); this.ticker = null; if (!this.claimState()) return;
    this.ticker = setTimeout(() => { this.ticker = null; this.mirror(); simClaimTick(); this.tick(); }, this.TICK); },
  save() { try { const s = this.sess; if (s && s.token && s.state !== 'over' && !s.lost) localStorage.setItem(this.KEY, JSON.stringify({ code: s.code, seat: s.seat, token: s.token, deckId: s.deckId, at: Date.now() })); else localStorage.removeItem(this.KEY); } catch (e) {} },
  kept() { try { const k = JSON.parse(localStorage.getItem(this.KEY) || 'null'); return k && k.code && Date.now() - k.at < 864e5 ? k : null; } catch (e) { return null; } },
  fresh(code, seat, token, deck) { return { code, seat, token, state: seat === 0 ? 'host' : 'join', live: false, peer: false, deckId: deck ? deck.id : null, deckMine: this.deckOf(deck), deckTheirs: null, n: 0, refused: 0, lost: null, unfit: null, theirWord: null, answered: null, dealing: false, turned: null,
    windows: null, awayAt: null, waitAt: null, claimAfter: null }; },
  async host(deck) { if (!this.ready()) return toast('No relay in this build'); if (!deck) return toast('Pick a deck first');
    this.leave(false); const s = this.sess = this.fresh(null, 0, null, deck); this.mirror(); paintSim();
    let made = null; try { const r = await fetch(this.url('/new'), { method: 'POST', wait: this.ASK }); made = r.ok ? await r.json() : null; } catch (e) { made = null; }
    if (this.sess !== s) return;
    if (!made || !made.code) return this.fail('the relay did not answer');
    s.code = made.code; s.token = made.token; this.save(); this.connect(); this.mirror(); paintSim(); },
  join(code, deck) { if (!this.ready()) return toast('No relay in this build'); if (!deck) return toast('Pick a deck first');
    const c = String(code || '').toUpperCase().replace(/[\s-]/g, ''); if (!/^[A-HJ-NP-Z2-9]{6}$/.test(c)) return toast('A code is six letters and digits, with no 0, O, 1 or I');
    this.leave(false); this.sess = this.fresh(c, 1, null, deck); this.connect(); this.mirror(); paintSim(); },

  resume() { const k = this.kept(); if (!k || this.sess || !this.ready()) return false; const d = DECKS.all().find(x => x.id === k.deckId) || null;
    this.sess = Object.assign(this.fresh(k.code, k.seat, k.token, d), { state: 'lobby', back: true }); this.connect(); this.mirror(); return true; },

  recheck() { const s = this.sess; if (!s || this.view || s.dealing || s.lost) return; const d = DECKS.all().find(x => x.id === s.deckId) || null; if (d) s.deckMine = this.deckOf(d);
    if (s.deckTheirs) { const v = this.verdict(s.deckTheirs); s.unfit = v ? v[0] : null; } s.answered = null; if (s.live) this.sendDeck(); this.mirror(); paintSim(); },
  setDeck(deck) { const s = this.sess; if (!s || this.view || s.dealing) return; s.deckId = deck ? deck.id : null; s.deckMine = this.deckOf(deck); s.theirWord = null; s.turned = null; if (s.live) this.sendDeck(); this.save(); this.mirror(); },
  connect() { const s = this.sess; if (!s) return; this.drop(); let ws;
    try { ws = new WebSocket(this.socketUrl(s.code, s.token)); } catch (e) { return this.fail('no socket', null, !!s.back); }
    this.ws = ws;
    ws.onopen = () => { if (this.ws !== ws) return; s.live = true; s.met = true; s.tries = 0; this.send({ t: 'hello', since: s.n }); this.sendDeck();
      this.pinger = setInterval(() => { try { ws.send('ping'); } catch (e) {} }, 25000); this.mirror(); paintSim(); };
    ws.onmessage = e => { if (this.ws !== ws) return; let f = null; try { f = JSON.parse(e.data); } catch (x) { return; } if (f && typeof f === 'object') this.frame(f); };
    ws.onclose = e => { if (this.ws !== ws) return; s.live = false; clearInterval(this.pinger); this.pinger = null; this.ws = null; const code = e && e.code;
      if (code === 4000) return this.fail('another phone took this seat'); if (code === 4001) return this.fail('the match expired on the relay');

      if (s.state === 'join' && !s.token) { this.mirror(); paintSim(); return void this.up().then(up => { if (this.sess === s && !s.lost) this.fail(up ? 'no match with that code, or it is full' : 'the relay did not answer'); }); }
      if (s.state === 'over' || s.lost) { this.mirror(); return paintSim(); }

      if (!s.met && (s.tries = (s.tries || 0) + 1) >= this.TRIES) { this.mirror(); paintSim(); return void this.up().then(up => { if (this.sess === s && !s.lost) { if (up) this.fail('that match is no longer on the relay'); else this.fail('the relay did not answer', null, !!s.back); } }); }
      this.timer = setTimeout(() => this.connect(), this.RETRY + Math.random() * this.RETRY); this.mirror(); paintSim(); };
    ws.onerror = () => {}; },
  ASK: 8000,
  up() { try { return Promise.resolve(fetch(this.url('/health'), { wait: this.ASK })).then(r => !!(r && r.ok), () => false); } catch (e) { return Promise.resolve(false); } },
  drop() { clearTimeout(this.timer); this.timer = null; clearInterval(this.pinger); this.pinger = null; clearTimeout(this.ticker); this.ticker = null; if (this.sess) this.sess.live = false; const ws = this.ws; this.ws = null; if (ws) { try { ws.onclose = null; ws.onmessage = null; ws.close(); } catch (e) {} } this.mirror(); },
  send(f) { try { if (this.ws && this.ws.readyState === 1) { this.ws.send(JSON.stringify(f)); return true; } } catch (e) {} return false; },

  watch() { clearTimeout(this.waiter); this.waiter = this.pending ? setTimeout(() => { this.waiter = null; if (this.pending && this.sess && !this.sess.lost) this.send({ t: 'hello', since: this.sess.n }); }, this.WAIT) : null; },

  fail(why, told, keep) { const s = this.sess; if (!s) return; if (told) this.send({ t: 'bye', why: told }); s.lost = why; s.live = false; s.dealing = false; s.unmet = !!keep; this.pending = null; this.watch(); this.drop(); if (!keep) this.save(); this.mirror(); paintSim(); },
  REFUSED: { alone: 'your friend has not joined yet', offered: 'a deal is already waiting', nooffer: 'that deal was withdrawn', big: 'that is too large to send', dealt: 'this match is already dealt',
    relay: 'the server had a problem with that: try again, or leave the table', decks: 'the relay does not hold both decks yet', deck: 'the relay could not read this phone\u2019s deck', noengine: 'the relay cannot run the game yet: try again in a few minutes' },

  inflate(view) { const walk = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk);
      if (Number.isInteger(o.id)) { if ('printedPower' in o) { const fc = SIM.face(o.id); o.text = fc.text; o.art = fc.art; o.colours = fc.colours; }
        if ('uid' in o) { o.unapplied = SIM.unapplied(o.id).map(e => e.raw); o.lines = SIM.fx(o.id).map(e => ({ t: e.t, raw: e.raw, does: SIM.describe(e), proof: SIM.proofOf(o.id, e) })); } }
      for (const k in o) walk(o[k]); }; walk(view); return view; },
  frame(f) { const s = this.sess; if (!s) return;
    switch (f.t) {
      case 'seat': if (!(f.proto >= this.PROTO)) return this.fail('the relay is not ready for this version of the app yet: try again in a few minutes');
        s.seat = f.seat; s.relayEngine = typeof f.engine === 'string' ? f.engine.slice(0, 32) : null; if (f.token) s.token = f.token; if (f.code) s.code = f.code; if (s.state === 'join' || s.state === 'host') s.state = 'lobby';
        s.windows = f.proto >= this.CLAIM_PROTO && f.claim && f.claim.gone > 0 && f.claim.idle > 0 ? { gone: +f.claim.gone, idle: +f.claim.idle } : null; this.save(); break;
      case 'peer': s.peer = !!f.on; s.awayAt = f.on ? null : Number.isFinite(f.away) ? Date.now() - f.away : s.awayAt;
        if (!f.on && f.bye && !this.view) s.dealing = false;

        if (!f.on && f.bye && typeof f.why === 'string' && f.why) { const after = !!this.view; if (this.view && s.n === 0) this.view = null;
          return this.fail((after ? 'their phone ended the match after the deal: ' : 'their phone ended the match: ') + f.why.slice(0, 200)); }
        if (f.on) { s.answered = null; this.sendDeck(); } break;
      case 'deck': if (f.deck && typeof f.deck === 'object') { s.deckTheirs = f.deck; const v = this.verdict(f.deck); s.unfit = v ? v[0] : null;
          s.theirWord = 'ready' in f.deck ? { ready: f.deck.ready === true, why: typeof f.deck.why === 'string' ? f.deck.why.slice(0, 200) : null } : null;

          const key = [f.deck.proto || '', f.deck.digest || '', this.listKey(f.deck)].join(' ');
          if (s.answered !== key) { s.answered = key; this.sendDeck(); } } break;

      case 'offer': if (this.view) break;
        { const why = SIM.g ? ['a game is open on this phone', 'a game is open on their phone'] : f.v === 3 ? this.offerProblem(f.decks) : ['the other phone needs an update before you can play', 'this phone needs an update before you can play'];
          if (why) { s.dealing = false; this.send({ t: 'refuse', k: f.k, why: why[1] }); toast('Deal turned down: ' + why[0]); this.sendDeck(); }
          else { s.dealing = true; this.send({ t: 'accept', k: f.k }); } } break;

      case 'spec': if (!this.view) return this.fail('the other phone needs an update before you can play', 'this phone needs an update before you can play'); break;
      case 'refused': s.dealing = false; s.turned = (typeof f.why === 'string' && f.why ? f.why.slice(0, 200) : 'no reason given'); toast('Their phone turned the deal down: ' + s.turned); break;
      case 'view': this.seen(f); break;
      case 'synced': if (!f.dealt) s.dealing = !!f.offered;
        else if (Number.isFinite(f.waited)) s.waitAt = Date.now() - f.waited; break;
      case 'err': this.pending = null; this.watch();
        if (f.why === 'behind') this.send({ t: 'hello', since: s.n });
        else if (f.why === 'refused') { s.refused++; toast('Your move was refused: ' + String(f.text || '').slice(0, 200)); }
        else if (f.why === 'dealt' && this.view) { }
        else if (f.why === 'nooffer') { if (!this.view) s.dealing = false; }

        else if (f.why === 'early') { s.claimAfter = Number.isFinite(f.wait) ? Date.now() + f.wait : null; toast(`Not yet: the relay\u2019s clock counts ${simClock(f.wait || 0)} more`); }
        else if (f.why === 'here') { s.claimAfter = null; toast('Your friend is here, and the game is not waiting on them: nothing to claim'); }
        else if (f.why === 'over' || f.why === 'nogame') { }
        else { if (s.dealing && !this.view) s.dealing = false;
          toast('The relay refused that: ' + (this.REFUSED[f.why] || f.why)); } break;
    }
    this.mirror(); paintSim(); this.tick(); },

  seen(f) { const s = this.sess, v = f.view, bad = t => this.fail(t, t);
    if (!v || typeof v !== 'object' || v.v !== 1 || !v.me || !v.them || !Array.isArray(v.log) || !Array.isArray(v.legal)) return bad('this phone could not read the game the relay sent: update the app');
    if (v.seat !== s.seat) return bad('the relay sent this phone the other seat\u2019s view');
    if (!f.full) { if (!this.view || f.n !== s.n + 1) return this.send({ t: 'hello', since: s.n }); v.log = v.log.concat(this.view.log); }
    if (v.log.length !== f.logn) return this.send({ t: 'hello', since: s.n });
    const first = !this.view, before = this.view, moved = f.n !== s.n, mine = this.pending && f.n > this.pending.n;
    if (first || moved) { s.waitAt = Date.now(); s.claimAfter = null; }
    this.view = this.inflate(v); s.n = f.n; s.dealing = false; SIM.g = null;
    if (first) this.start();
    if (mine) SIMUI.acted = before ? before.turn : null;
    if (mine || f.full) { const p = this.pending; this.pending = null; this.watch();

      if (!mine && p && !p.again && f.n === p.n && v.over === null && v.who === s.seat && this.send({ t: 'move', n: s.n, move: p.a })) { this.pending = { n: s.n, a: p.a, again: true }; this.watch(); } }
    if (!first && moved) Object.assign(SIMUI, { sel: null, room: null, fxt: null, focus: null });
    if (v.over !== null && s.state !== 'over') { s.state = 'over'; this.save(); } },

  deal() { const s = this.sess; if (!s || s.seat !== 0 || this.view || s.dealing) return; if (!s.deckMine || !s.deckTheirs) return toast('Both decks first');
    const v = this.verdict(s.deckTheirs); if (v) return toast(v[0]);
    if (!s.theirWord || s.theirWord.ready !== true) return toast((s.theirWord && s.theirWord.why) || 'Waiting for their phone to check your deck');
    if (!this.send({ t: 'deal' })) return this.fail('not connected');
    s.turned = null; s.dealing = true; this.mirror(); paintSim(); },
  start() { const s = this.sess; s.state = 'play'; this.pending = null; Object.assign(SIMUI, { sel: null, focus: null, post: null, room: null, fxt: null, seen: 0, hurry: false, shown: new Set(), acted: null }); this.save(); window.scrollTo(0, 0); },

  move(i, a) { const s = this.sess; if (s.lost) return { ok: false, why: 'the match ended' }; if (i !== s.seat) return { ok: false, why: 'not your seat' }; if (this.pending) return { ok: false, why: 'still sending the last move' };
    if (!this.send({ t: 'move', n: s.n, move: a })) return { ok: false, why: 'not connected \u2014 reconnecting' }; this.pending = { n: s.n, a }; this.watch(); this.mirror(); return { ok: true, sent: true }; },

  leave(concede) { const s = this.sess; if (!s) return; if (concede && !s.lost && this.playing() && this.view.over === null) this.send({ t: 'move', n: s.n, move: { t: 'concede' } });
    const kept = !!s.unmet; if (!kept) this.send({ t: 'bye' }); this.drop(); this.sess = null; this.pending = null; this.watch(); this.view = null; if (!kept) this.save(); this.mirror(); }
};
ONLINE.mirror();

function onlineLine() { if (!ONLINE.ready()) return 'no relay in this build (BUILD has no VAULT_RELAY)'; let host = ONLINE.relay; try { host = new URL(ONLINE.relay).host; } catch (e) {} const s = ONLINE.sess;
  return `relay ${host}` + (s ? ` \u00b7 ${s.state}${s.code ? ' ' + s.code : ''}, seat ${s.seat}, ${s.live ? 'live' : 'not connected'}${s.peer ? ', peer on' : ''}, ${s.n} moves${s.refused ? ', ' + s.refused + ' refused' : ''}${s.relayEngine ? (s.relayEngine === ONLINE.engine ? ', the relay runs this app\u2019s engine' : `, the relay\u2019s engine ${s.relayEngine} is not this app\u2019s ${ONLINE.engine}`) : ''}${s.lost ? ' \u00b7 ' + s.lost : ''}` : ' \u00b7 no match'); }

const DIAG = {
  taps: 0, at: 0,
  tap() { const now = Date.now(); this.taps = now - this.at < 1500 ? this.taps + 1 : 1; this.at = now; if (this.taps >= 5) { this.taps = 0; go('diag'); return true; } return false; },
  async probe(url) { if (!url) return 'no url'; if (!navigator.onLine) return 'offline'; try { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return 'HTTP ' + r.status; const j = await r.json().catch(() => null); const age = j && (j.fetched_at || j.source_updated_at) ? ' \u00b7 ' + HUNT.ageLabel(j.fetched_at || j.source_updated_at) : ''; return 'HTTP ' + r.status + age; } catch (e) { return 'fetch failed: ' + (e.message || e); } },
  kb(key) { try { const v = localStorage.getItem(key); return v ? Math.round(v.length / 1024) + ' KB' : '-'; } catch (e) { return '?'; } },
  async report() {
    const L = []; const line = (k, v) => L.push(`${k}: ${v}`);
    L.push(`OP TCG Hub diagnostics \u2014 take ${TAKE} \u2014 ${new Date().toISOString().slice(0, 16)}Z`);
    L.push('', '## app'); line('build', CAT.man.built_at || '?'); line('mode', MODE.cur); line('screen stack', NAV.stack.join(' > ') || '-');
    line('boot stack', (NAV.bootStack || []).join(' > ') || 'none'); line('screens on', [...document.querySelectorAll('.screen.on')].map(e => e.id).join(',') || 'NONE'); line('overlays on', ['#askSheet', '#picker', '#rulesSheet', '#simSheet', '#detail', '#tour', '#simCurtain'].filter(id => { const el = $(id); return el && el.classList && el.classList.contains('on'); }).join(',') || 'none'); line('splash', $('#splash') ? 'still in the page' : 'gone');
    line('currency', CUR.active() + (CAT.man.rates ? ` (rates ${CAT.man.rates.date}${CAT.man.rates.stale ? ', stale' : ''})` : ' (no rates)')); line('online', navigator.onLine); line('native', !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())); line('plugins', ['Camera', 'Filesystem', 'Share', 'LocalNotifications', 'Network', 'App', 'AdMob', 'AppUpdate'].filter(n => PLATFORM.plugin(n)).join(', ') || 'none (browser)');
    line('ads', !CAT.man.ads ? 'none' : ADS.unitsNote()); line('consent', !CAT.man.ads ? 'none' : ADS.consentNote()); line('update', UPDATE.note());
    L.push('', '## device'); line('ua', String(navigator.userAgent || '?').slice(0, 120)); line('viewport', `${typeof innerWidth === 'number' ? innerWidth + 'x' + innerHeight : '?'} @${devicePixelRatio || 1}`); line('camera zoom', ZOOM.seen || 'the scanner has not opened the camera since the app started');    line('language', navigator.language || '?'); line('tz', (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return '?'; } })());
    L.push('', '## catalogue'); line('cards', CAT.man.cards); line('printings', CAT.rows.length); line('pictures', picturesLine()); line('prices dated', (CAT.man.source_updated_at || '?').slice(0, 10)); line('history days', (CAT.days || []).length + (CAT.days && CAT.days.length ? ` (${CAT.days[0]}..${CAT.days[CAT.days.length - 1]})` : '')); line('catalogue copy', CAT.man.fromDisk ? 'synced on this phone' : 'the one that came with the app' + (CAT.refused ? ` (${CAT.refused})` : '')); line('sealed products', sealedCountLine()); line('stock decks', (CAT.stock || []).length); line('effects scripted', CAT.man.effects ? effectsLine(CAT.man.effects, Object.keys(CAT.effects || {}).filter(id => CAT.effects[id].some(e => !e.hand)).length) : '?'); line('effects proven', CAT.man.effects && CAT.man.effects.proofs != null ? `${CAT.man.effects.proven} printings proven, ${CAT.man.effects.wrong} proven wrong, from ${CAT.man.effects.proofs} proofs; ${CAT.man.effects.hand} lines by hand` + (CAT.man.effects.stale && CAT.man.effects.stale.length ? `; reopened: ${CAT.man.effects.stale.join(', ')}` : '') : '?'); line('rules', RULEBOOK ? `v${RULES_DB.cur().version}` + (RULES_DB.official && RULES_DB.official.version ? `, official v${RULES_DB.official.version}` : '') : '?');
    L.push('', '## sync'); line('update url', CAT.man.updateUrl || 'NOT SET'); line('manifest', await this.probe(CAT.man.updateUrl ? CAT.man.updateUrl + 'manifest.json' : null));
    L.push('', '## hunt'); line('zip', HUNT.zip || '(none)'); line('served', JSON.stringify(HUNT.served())); line('radius', LOCAL.radius); line('feed url', HUNT.url() || 'NOT SET');
    for (const f of ['feed.json', 'history.json', 'stores.json', 'events.json', 'shops.json', 'zcta.json']) line('  ' + f, await this.probe(HUNT.url() ? HUNT.url().replace(/feed\.json$/, f) : null));
    line('feed on phone', feedLine()); line('play online', onlineLine()); line('ebay', ebayLine()); line('history on phone', HUNT.hist ? [`${HUNT.hist.runs.length} runs`, ...HUNT.DISTS.map(([k]) => `${k} in ${HUNT.hist.runs.filter(r => r && r[k] && typeof r[k] === 'object' && !Array.isArray(r[k])).length}`), HUNT.hist.runs.length ? 'ends ' + momentText(HUNT.hist.runs[HUNT.hist.runs.length - 1].t) : ''].filter(Boolean).join(', ') : 'none');    line('stores on phone', LOCAL.stores ? `${LOCAL.stores.stores.length}, ${HUNT.ageLabel(LOCAL.stores.fetched_at)}${HUNT.zip ? ', ' + LOCAL.stores.stores.filter(s => s.zip && s.zip.slice(0, 3) === HUNT.zip.slice(0, 3)).length + ' in your zip area' : ''}` : 'none'); line('events on phone', EVENTS.tab ? `${EVENTS.tab.rows.length} rows` : 'none'); line('shops on phone', LOCAL.shops ? `${LOCAL.shops.shops.length}` : 'none'); line('exact distances', LOCAL.exact()); line('stock alerts', STOCK.list.length); line('local notes', LOCAL.notes.length);
    L.push('', '## storage'); for (const k of ['vault.items', 'vault.snaps', 'vault.decks', 'vault.hunt', 'vault.hunt.hist', 'vault.hunt.stores', 'vault.hunt.events', 'vault.hunt.shops', 'vault.hunt.zcta', 'vault.alerts', 'vault.stockAlerts', 'vault.beforeRestore', ...STORE.unreadable.filter(k => this.kb(k + '.unreadable') !== '-').map(k => k + '.unreadable')]) line(k, this.kb(k));
    line('writes that failed', [...STORE.failed].join(', ') || 'none'); line('backups held', backupHeld() ? `yes \u2014 the stored ${heldWhat()} could not be read; the last backup is kept until a restore` : 'no');
    L.push('', '## counts (never contents)'); line('collection items', OWN.items.length); line('decks', DECKS.list.length); line('price alerts', ALERTS.list.length);
    L.push('', '## last errors'); if (!ERRS.list.length) L.push('none'); else for (const e of ERRS.list) L.push(`${e.t.slice(0, 19).replace('T', ' ')} ${e.kind}: ${e.msg}${e.where ? ' @ ' + e.where : ''}`);
    L.push('', '## self-test'); try { await runSelfTest(); L.push(...(SELFTEST.text() || 'no result').split('\n').slice(1)); } catch (e) { L.push('self-test threw: ' + (e.message || e)); }
    return L.join('\n');
  }
};

function cameraVerdict(devices, native) {
  const n = (devices || []).length;
  if (!n && !native) return { skip: true, note: 'no camera listed on this device \u2014 the scanner needs one' };
  return { ok: n > 0, note: `${n} camera(s) listed` };
}

function effectsLine(effects, cards) { return `${effects.scripted} of ${effects.lines} effect lines (${cards} cards)`; }

const SELFTEST = {
  last: null,
  async run() {
    const out = [];
    const check = async (name, fn) => {
      try { const r = await fn(); out.push({ name, s: r === null || (r && r.skip) ? 'SKIP' : (r === true || (r && r.ok) ? 'PASS' : 'FAIL'), note: (r && r.note) || (r === null ? 'not available here' : '') }); }
      catch (e) { out.push({ name, s: 'FAIL', note: String(e && e.message || e).slice(0, 120) }); }
    };
    await check('Catalogue loaded', () => ({ ok: CAT.ready && CAT.rows.length === (CAT.man.printings || CAT.rows.length) && CAT.rows.length > 5000, note: catalogueNote() }));
    await check('Printing index is one-to-one', () => ({ ok: CAT.byId.size === CAT.rows.length, note: `${CAT.byId.size} ids` }));
    await check('Price history on file', () => ({ ok: (CAT.days || []).length >= 1, note: `${(CAT.days || []).length} day(s)` }));
    await check('The confidence gate asks on EB03-024\'s three printings', () => { const r = resolve('EB03-024'); return { ok: r.verdict === 'ask' && r.candidates.length === 3, note: `${r.verdict}, ${r.candidates.length} printings` }; });
    await check('A unique number auto-accepts', () => { const one = [...CAT.byNum.entries()].find(([n, l]) => l.filter(p => p.num === n).length === 1); if (!one) return { ok: false, note: 'no unique number found' }; const r = resolve(one[0]); return { ok: r.verdict === 'auto', note: `${one[0]} \u2192 ${r.verdict}` }; });
    await check('Search finds a card by name', () => { const n = CAT.rows.filter(p => p.full.toLowerCase().includes('nami')).length; return { ok: n > 0, note: `${n} rows for "nami"` }; });
    await check('Star template shipped', () => ({ ok: !!(CAT.star && CAT.star.box), note: CAT.star ? `threshold ${CAT.star.threshold}` : 'missing' }));
    await check('Fonts loaded', async () => { if (!document.fonts || !document.fonts.check) return null; await document.fonts.ready; const ok = document.fonts.check('16px "OPH Display"') && document.fonts.check('16px "OPH Body"'); return { ok, note: ok ? 'display + body' : 'a role face did not load' }; });
    await check('Storage writes and reads back', () => { const k = 'vault.selftest', v = String(Date.now()); localStorage.setItem(k, v); const ok = localStorage.getItem(k) === v; localStorage.removeItem(k); return { ok, note: ok ? 'localStorage round-trip' : 'mismatch' }; });

    await check('Backups are being written', () => { const b = OWN.lastBackup; if (!b) return null;
      return { ok: !b.failed, note: b.failed ? `failed ${momentText(b.at)}${b.why ? ': ' + b.why : ' (no reason was kept before take 125)'}` : `${momentText(b.at)} \u00b7 ${b.where}` }; });
    await check('Backup file round-trip (Filesystem)', async () => { const FS = PLATFORM.plugin('Filesystem'); if (!FS) return null; const path = 'selftest/probe.json', data = JSON.stringify({ t: Date.now() }); await FS.writeFile({ path, data, directory: 'CACHE', recursive: true, encoding: 'utf8' }); const r = await FS.readFile({ path, directory: 'CACHE', encoding: 'utf8' }); try { await FS.deleteFile({ path, directory: 'CACHE' }); } catch (e) {} return { ok: r.data === data, note: 'wrote, read, deleted in the app cache' }; });
    await check('Share sheet available', async () => { const SH = PLATFORM.plugin('Share'); if (!SH) return null; const r = await SH.canShare(); return { ok: !!r.value, note: r.value ? 'Share.canShare true' : 'canShare false' }; });
    await check('Camera reachable', async () => { if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return null; const d = (await navigator.mediaDevices.enumerateDevices()).filter(x => x.kind === 'videoinput'); return cameraVerdict(d, !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())); });
    await check('OCR reads a code the app drew (ML Kit)', async () => {
      if (!PLATFORM.hasOcr()) return null;
      const c = document.createElement('canvas'); c.width = 600; c.height = 160;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 600, 160); x.fillStyle = '#000'; x.font = 'bold 72px sans-serif'; x.fillText('OP01-016', 40, 110);
      const r = await PLATFORM.ocr(c), txt = r ? r.text : ''; return { ok: parseRead(txt).number === 'OP01-016', note: txt ? `read "${txt.trim().slice(0, 30)}"` : 'no text returned' };
    });
    await check('Notifications permission', async () => { const N = PLATFORM.plugin('LocalNotifications'); if (!N) return null; const r = (await N.checkPermissions()) || {}; return { ok: !!r.display && r.display !== 'denied', note: r.display ? `display: ${r.display}` : 'the plugin answered without a permission state (its permission annotation is missing from the build, landmine 141)' }; });

    await check('Ads: the units match this build', () => { const A = PLATFORM.plugin('AdMob'); if (!A) return null; const a = CAT.man.ads, u = ADS.units(), T = 'ca-app-pub-3940256099942544/';
      if (!a || !u.scan || !u.deck || !u.max) return { ok: false, note: 'no ad units in the manifest' };
      if (!a.test || ![a.scan, a.deck].every(x => String(x).startsWith(T))) return { ok: false, note: 'a real unit where every older install reads it (ads.scan, ads.deck)' };
      return { ok: true, note: ADS.unitsNote() }; });
    await check('Sim: scripted effects loaded and one offers correctly', () => { const n = Object.keys(CAT.effects || {}).filter(id => CAT.effects[id].some(e => !e.hand)).length; if (!n) return { ok: false, note: 'no effects in the bundle' };
      const k = Object.keys(CAT.effects).find(id => ['Character', 'Stage'].includes((CAT.byId.get(+id) || {}).type) && CAT.effects[id].some(e => e.t === 'onplay' && e.if.length === 0 && e.do.length === 1 && e.do[0].a === 'draw'));
      if (!k) return { ok: false, note: `${n} cards scripted, no plain [On Play] draw among them` };

      const saved = SIM.g, uid = SIM.uid, cost = SIM.cost(CAT.byId.get(+k)); const P = SIM.player('probe', +k, [1, 2, 3]); P.taken = 1; P.hand = [+k]; P.don.active = cost; P.donDeck -= cost;
      SIM.blank([P, SIM.player('probe 2', +k, [1, 2, 3])]);
      try { const played = SIM.act(0, { t: 'play', h: 0 }); while (SIM.g.queue.length && !(SIM.g.queue[0].steps[0] && SIM.g.queue[0].steps[0].a === 'draw')) SIM.act(0, { t: 'fxskip' });
        const o = SIM.g.queue[0], r = o ? SIM.act(0, { t: 'fx', target: null }) : null;
        return { ok: !!(played.ok && r && r.ok && P.hand.length === o.steps[0].n), note: `${n} cards scripted; ${CAT.byId.get(+k)?.name} drew ${P.hand.length}` }; }
      finally { SIM.g = saved; SIM.uid = uid; } });
    await check('Sync URL answers', async () => { const base = CAT.man.updateUrl; if (!base) return { ok: false, note: 'not configured' }; if (!navigator.onLine) return null; const r = await fetch(base + 'manifest.json', { cache: 'no-store' }); const m = r.ok ? await r.json() : null; return { ok: !!(m && m.source_updated_at), note: m ? `Pages has prices from ${m.source_updated_at.slice(0, 10)}` : `HTTP ${r.status}` }; });
    this.last = { at: new Date().toISOString(), take: TAKE, checks: out };
    return this.last;
  },
  text() {
    const r = this.last; if (!r) return '';
    const n = s => r.checks.filter(c => c.s === s).length;
    return [`OP TCG Hub self-test \u2014 take ${r.take} \u2014 ${r.at.slice(0, 16)}`, `${n('PASS')} pass, ${n('FAIL')} fail, ${n('SKIP')} skipped`, '',
      ...r.checks.map(c => `${c.s.padEnd(4)} ${c.name}${c.note ? ' \u2014 ' + c.note : ''}`)].join('\n');
  }
};
CLICKS.on('#diagRun,#devEarn,#diagCopy,#diagShare', async e => {
  if (e.target.closest('#diagRun')) { const b = $('#diagRun'); b.disabled = true; $('#diagOut').textContent = 'Running\u2026'; const t = await DIAG.report(); $('#diagOut').textContent = t; b.disabled = false; $('#diagCopy').disabled = false; $('#diagShare').disabled = false; }
  if (e.target.closest('#devEarn')) { CREDITS.earn('scan'); toast(`${CREDITS.state.scan} save credits`); }
  if (e.target.closest('#diagCopy')) { try { await navigator.clipboard.writeText($('#diagOut').textContent); toast('Copied'); } catch (err) { toast('Select the text and copy it'); } }
  if (e.target.closest('#diagShare')) { const t = $('#diagOut').textContent; const r = await PLATFORM.shareFile(`optcghub-diagnostics-take${TAKE}.txt`, t, 'Diagnostics'); if (r !== 'shared') { try { await navigator.clipboard.writeText(t); toast('Copied instead'); } catch (err) {} } }
});
async function runSelfTest() {
  const box = $('#stOut'); if (box) box.innerHTML = '<div class="note">Running\u2026</div>';
  const r = await SELFTEST.run();
  if (!box) return r;
  box.innerHTML = r.checks.map(c => `<div class="row" style="gap:10px"><b style="min-width:44px;color:${c.s === 'PASS' ? 'var(--up)' : c.s === 'FAIL' ? 'var(--down)' : 'var(--dim2)'}">${c.s}</b>
    <div class="nm"><b>${esc(c.name)}</b>${c.note ? `<span>${esc(c.note)}</span>` : ''}</div></div>`).join('') +
    `<button class="linkish" id="stShare" style="margin-top:8px">Share the report</button>`;
  const sh = $('#stShare'); if (sh) sh.addEventListener('click', () => { const t = SELFTEST.text(); if (navigator.share) navigator.share({ title: 'OP TCG Hub self-test', text: t }).catch(() => {}); else { try { navigator.clipboard.writeText(t); toast('Copied'); } catch (e) { toast('Copy failed'); } } });
  return r;
}

(async function boot() {
  try { await loadCatalogue(); }
  catch (e) {
    document.body.innerHTML = '<div class="empty">Catalogue failed to load.<br>' +
      esc(e.message) + '</div>';
    return;
  }
  OWN.snapshot(); paintBatchBadge();
  MODE.set(MODE.cur, false); go(MODE.home[MODE.cur] || 'home');
  THEME.apply();
  NAV.bootStack = NAV.stack.slice();
  splashDone();
  ALERTS.check().then(f => { if (f.length) toast(`${f.length} price alert${f.length === 1 ? '' : 's'} fired`); });
  RELALERTS.check();
  if (backupHeld()) setTimeout(() => toast(`Your saved ${heldWhat()} could not be read \u2014 use Restore from backup, under More`, 6000), 0);
  if (navigator.onLine && CAT.man.updateUrl && PLATFORM.quietSyncAllowed()) setTimeout(() => PRICESYNC.run(), 1500);
  setTimeout(() => EBG.run('the app opened'), 2500); EBG.watch();
  PRICESYNC.watch();

  if (CAT.man.ads) {
    CREDITS.FREE_ON_INSTALL = CAT.man.ads.free; CREDITS.PER_AD = CAT.man.ads.perAd;
    CREDITS.FREE_DECKS = CAT.man.ads.decksFree; CREDITS.DECKS_PER_AD = CAT.man.ads.decksPerAd;
    if (!localStorage.getItem('vault.credits')) { CREDITS.state.scan = CREDITS.FREE_ON_INSTALL; CREDITS.state.deck = CREDITS.FREE_DECKS; CREDITS.save(); }
    ADS_ENABLED = !!(CAT.man.ads.scan && PLATFORM.plugin('AdMob'));
    if (ADS_ENABLED) ADS.startWhenFree();
  }
  UPDATE.watch();
  paintDevEarn();

  const APP = PLATFORM.plugin('App');
  if (APP && APP.addListener) { try { APP.addListener('backButton', () => { try { if (closeAnyOverlay()) return; if (NAV.back()) return; if (APP.minimizeApp) APP.minimizeApp(); } finally { screenWatchdog('hardware back'); } }); } catch (e) {} }
  window.addEventListener('popstate', () => { try { if (closeAnyOverlay()) return; NAV.silent = true; NAV.stack.pop(); const prev = NAV.stack[NAV.stack.length - 1]; if (prev) go(prev); NAV.silent = false; } finally { screenWatchdog('history back'); } });

  let seen = false; try { seen = localStorage.getItem(GUIDE_KEY) === '1'; } catch (e) {}
  if (!seen) setTimeout(guideOpen, 250);

  $('#allq').placeholder = `Search all ${(CAT.man.cards || 0).toLocaleString()} cards`;
  paintNet(); paintHome();
  window.VAULT = { EBAY, paintEbay, ebayBodyHtml, ebayHeadHtml, ebAttrib, ebOwn, ebWords, ebRow, ebEnds, ebMoney, ebayTap, ebayGrade, ebayLine, ebayLoad, ebayTermsHtml, EBW, paintEbayWatch, ebayWatchHtml, ebwHeadHtml, ebwTap, ebwQuestions, ebwRows, ebwLoad, EBC, paintEbayCard, ebayCardHtml, ebcKind, ebcTap, ebcLoad, ebcCur, EBG, ebwSoon, ebwFits, ebSoonText, watchEndInner, watchEndHtml, paintWatchEnds, ebayTick, ebEnded, ebUntil, ebArm, EBT, watchTools, homeWatchRow, homeWatchOpen, ebMarks, NET, ODD, oddPrice, setCode, setTitle, setTitleHtml, HOME_MOVERS, paintHomeMovers, toggleHomeMovers, moverRow, moverSpan, HOME_SETS, paintHomeSets, toggleHomeSets, setsByDone, dropMore, PRICESYNC, syncFromReport, REPORT, reportKeeps, marketReport, reportRule, TRADES, recordTrade, tradeSums, tradeShares, agreedPct, agreedLive, marketOn, tradeIn, tradeLine, tradeOutPlan, paintTrades, tradeCard, tradeFor, removeTrade, cashText, trName, ZOOM, setZoom, zoomStep, zoomView, paintZoom, scanReady, setPaused, paintPause, pinchZoom, pinchMove, pinchEnd, PINCH_HOLD, SCAN, parseListLine, deckLines, importDeckText, importDeckNew, importDeckQr, decodeQr, loadQr, anyNumber, DECK_FORMATS, deckAdd, paintTrade, paintWants, watchRow, watchAct, watchTap, watchTargetLine, pctOff, pctLine, certCheck, CERTS, GRADES, WATCHUI, SCAN_INTO, paintScanInto, acceptScan: accept, searchWatchTap, paintHomeWatch, watchAddFind, saveHere, stepQty, paintQty, paintWant, paintStockWatch, paintPaid, openReview, commitBatch, paintReview, reviewGroups, reviewInto, reviewQty, reviewCond, reviewSwap, reviewRemove, reviewClear, printingsOf, reviewFind, reviewPickPrinting, reviewFixCard, reviewPickCond, reviewPickInto, reviewTap, sampleScans, removeHere, removeGraded, paintRemove, lookupLinks, paintLookup, CHANGE, lineChange, changeTitle, setChange, priceOn, paintCollection, changeWords, collectionChange, changeChips, periodStart, paintMovers, moversShown, showMovers, ADS, CLICKS, ONLINE, onlineLine, simOnlineHtml, linePic, lineShowsPhoto, flipLine, flipSwipe, FLIP, UPDATE, get guidePage() { return guidePage; }, guideOpen, guideClose, guideGo, guideStart, guidePaint, GUIDE, topCard, dotJoin, curLabel, paintBinder, sealedKind, sealedWord, sealedRow, gameColours, distWords, feedLine, sourceLead, picturesLine, sealedCountLine, catalogueNote, setsWithCards, setCards, paintDevEarn, backArrow, closeSheet, setHomeTab, bulkLines, bulkSum, shownLines, signedMoney, pctNum, signedPct, dayText, momentText, fromShown, toShown, setTop, newestTop, paintSealedHero, ownBack, artBack, artUrl, artColours, largeOk, heroLeader, paintDeckHero, paintBack, stockPic, CAT, OWN, resolve, candidates, hamming, TAKE, NET, go, productPic, CUR, money, exportCsv, collectionPage, shareCollectionPage, simLogText, simReadiness, paintStock, deckCover, PLATFORM, SEALED, paintSealed, paintReleases, browseSet, RELALERTS, RELF, relBand, releaseEvent, openDetail, setCond, toast, cameraVerdict, effectsLine, HUNT, targetLine, walmartLine, distLine, distShort, distRowLines, distFold, distFoldTap, distSummary, DISTF, paintDetailDist, distHistory, distHistTap, tlDay, tlWindow, gtsDue, buySources, buyChips, askZip, LOCAL, paintLocal, addLocalNote, EVENTS, paintEvents, STOCK, icsFor, addEventToCalendar, DIAG, ERRS, NAV, go, closeAnyOverlay,
                   cardPic, setPic, picBox, deckRow, paintHome, paintDecks, paintSearch, openDeck,
                   FILT, loadFilter, applyFilter, sortRows, blankFilter, activeCount,
                   DECKS, RULES, legality, analysis, colourLegal, CREDITS, get ADS_ENABLED() { return ADS_ENABLED; }, PF, TRADE, MODE, THEME, PLAY, plCurtain, paintPlay, SELFTEST, runSelfTest, SIM, SIMUI, BOT, simBotRun, paintSim, simAct, simSeat, simReport, simHandLabel, simTap, simSay, simAt, simSheetOpen, simPaced, simFit, RULEBOOK, RULES_DB, openRules, paintRules, rulesStatus, verNewer, CD, paintCards, WANT, openChecklist, ALERTS, BN, deckHistory, binderSets,
                   backupJson, scheduleBackup, backupHeld, restoreFromBackup, loadCatalogue, catalogueProblem, STORE, readJson, saveJson, BATCH,
                   PICKER, pickCurrency, MAXLOCK, bnTurn, commitOwn, importCsv, backupProblem, typedAmount, paintAlerts, localDay, phoneToday,
                   scan: { PLATFORM, detectQuad, parseRead, normaliseRead, starScore, makeVoter, identifyFrame, cropStar,
                           LOOKS, CODE_AT, viewRect, viewCanvas, lookCanvas, equalise, codesIn, cardAround, captureAndIdentify, SCAN } };
})();