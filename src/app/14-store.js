/* ---- stored values (take 115) -------------------------------------------
   Every stored value is read through readJson and written through saveJson.
   A value that does not parse, or is not the kind kept there (a list, a
   record), falls back to the default and is recorded in Diagnostics' last
   errors: before this one unreadable value threw while the script loaded.
   The collector's own data is never lost to that fallback -- the unreadable
   text is copied beside its key (vault.items.unreadable) before anything can
   write over it, and no backup writes the empty list over the good file until
   a restore (backupHeld) -- for every list the backup carries (HELD), not the
   collection alone. keep = false for caches and preferences.
   A write that fails -- storage full: the Hunt caches share it -- no longer
   throws half-way through a commit with no message: it is recorded once per
   key and the collector is told to export, which reads what is in memory. */
const STORE = { unreadable: [], failed: new Set(), holdBackup: false, _w: null,
  warn() { if (this._w) return; this._w = setTimeout(() => { this._w = null; toast('Could not save on this phone \u2014 export your collection now (Export CSV)', 6000); }, 0); } };
/* take 115 (self-review): the lists the backup carries, each by the name the hold's words use. An unreadable
   one starts empty, and the first commit wrote that over the backup's copy -- the hold was the collection's
   alone. Take 136: vault.batch is in the backup now, so an unreadable one holds it too. */
const HELD = { 'vault.items': 'collection', 'vault.snaps': 'value history', 'vault.decks': 'decks', 'vault.pfs': 'collections',
  'vault.credits': 'waiting cards', 'vault.wants': 'wants', 'vault.alerts': 'price alerts', 'vault.stockAlerts': 'stock alerts',
  'vault.relAlerts': 'release reminders', 'vault.hunt.notes': 'Hunt notes', 'vault.trade.give': 'trade lists', 'vault.trade.get': 'trade lists',
  'vault.batch': 'waiting scans' };
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
function saveJson(key, value) {
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); STORE.failed.delete(key); return true; }
  catch (e) {
    if (!STORE.failed.has(key)) ERRS.push('storage', `${key} was not saved: ${e && e.name ? e.name + ': ' : ''}${(e && e.message) || e}`, 'saveJson');
    STORE.failed.add(key); STORE.warn(); return false;
  }
}
/* Display currency (take 85). Every price in the app is USD from TCGplayer;
   the collector can SEE it in another currency, converted at the day’s ECB
   reference rate that rode in the manifest, and every converted figure
   carries ≈ and the rate’s date is one tap away -- a conversion is an
   estimate, not a quote (PROTOCOL §10). No rates: USD only. */
const CUR = {
  code: localStorage.getItem('vault.currency') || 'USD',
  list: [['USD', '$', 'US Dollar'], ['CAD', 'CA$', 'Canadian Dollar'], ['EUR', '€', 'Euro'], ['GBP', '£', 'British Pound'], ['AUD', 'A$', 'Australian Dollar'], ['JPY', '¥', 'Japanese Yen'], ['MXN', 'MX$', 'Mexican Peso'], ['CHF', 'CHF ', 'Swiss Franc']],
  rates() { return (typeof CAT !== 'undefined' && CAT.man && CAT.man.rates) || null; },
  rate(code) { if (code === 'USD') return 1; const r = this.rates(); return r && r.rates && r.rates[code] > 0 ? r.rates[code] : null; },
  set(code) { if (!this.rate(code)) code = 'USD'; this.code = code; saveJson('vault.currency', code); },
  /* take 110's review: the symbol of the currency SHOWN -- a saved code with no rate in this build shows
     dollars, and read from the saved code the symbol had put "\u20ac" on a dollar figure with no \u2248 */
  sym() { const a = this.active(); return (this.list.find(c => c[0] === a) || this.list[0])[1]; },
  active() { return this.rate(this.code) ? this.code : 'USD'; }
};
const money = n => { if (n == null) return '—'; const code = CUR.active(); const r = CUR.rate(code) || 1;
  const v = n * r; const jp = code === 'JPY';
  return (code === 'USD' ? '' : '\u2248') + CUR.sym() + v.toLocaleString('en-US', { minimumFractionDigits: jp ? 0 : 2, maximumFractionDigits: jp ? 0 : 2 }); };
/* take 111 (the last look): a row's small line, its parts joined by " \u00b7 " with the empty ones left out --
   a printing with no number (a DON!! card, a sealed product) opened its line with a bare dot */
const dotJoin = (...parts) => parts.filter(x => x != null && x !== '').join(' \u00b7 ');
const moneyUSD = n => (n == null ? '—' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
/* Take 110 (the voice, UI-AUDIT §5): a signed amount keeps its currency -- money(x).slice(1) had
   dropped the "$" of dollars and the "\u2248" of a converted currency -- and a percentage has one
   rule: one decimal, none from 100 % up. */
const signedMoney = n => { const m = money(Math.abs(n)), sg = n >= 0 ? '+' : '\u2212'; return m.startsWith('\u2248') ? '\u2248' + sg + m.slice(1) : sg + m; };
const pctNum = p => { const a = Math.abs(p), r = Math.round(a * 10) / 10; return r >= 100 ? Math.round(a) + '%' : r.toFixed(1) + '%'; };
/* signed: the sign only on a figure that is not zero once rounded ("\u22120.0%" said a move the figure does not show) */
const signedPct = (p, plus = false) => { const t = pctNum(p); return (t === '0.0%' ? '' : p < 0 ? '\u2212' : plus ? '+' : '') + t; };
/* the price filter in the currency on screen: kept in US dollars (the market’s), typed and shown converted */
const curRate = () => CUR.rate(CUR.active()) || 1;
const fromShown = v => { const x = parseFloat(v); return x > 0 ? x / curRate() : null; };
const toShown = usd => (usd == null ? '' : String(+(usd * curRate()).toFixed(2)));
/* take 115: a typed amount -- "1,200" is twelve hundred and "11,36" a decimal comma; anything else that is not a
   plain number is no number (parseFloat read "1,200" as 1) */
const typedAmount = v => { const t = String(v == null ? '' : v).trim().replace(/\s/g, '');
  const u = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t) ? t.replace(/,/g, '') : /^\d*,\d{1,2}$/.test(t) ? t.replace(',', '.') : t;
  return /^(\d+\.?\d*|\.\d+)$/.test(u) ? parseFloat(u) : NaN; };
/* one way to write a day -- "Sep 23", the year only when it is not this one -- and a moment --
   "Sep 24, 6:23 AM" -- where screens wrote ISO dates, and times with a literal T */
/* { year: true } for what leaves the phone (a shared page, a trade's text): read later, a day needs its year */
const dayText = (iso, { year = false } = {}) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); if (!m) return iso || '?';
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year || +m[1] !== new Date().getFullYear() ? { year: 'numeric' } : {}) }); };
const momentText = iso => { const d = new Date(iso || ''); if (!iso || isNaN(d)) return iso || '?';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}), hour: 'numeric', minute: '2-digit' }); };
const RANGE_WORDS = { '1D': 'in the last day', '7D': 'in the last 7 days', '1M': 'in the last month', '3M': 'in the last 3 months', '6M': 'in the last 6 months', MAX: 'since the first day on file' };
/* take 115 (SPEC-107-33): #picker is also a prompt -- the currency, the MAX range's ad, a price alert's direction,
   a slab's grader -- and a prompt closed by the sheet's cross, Cancel or Back stayed pending with its listener
   on the page, so the next pick answered it as well (two slabs recorded, two ads asked for). One pending
   choice at a time: every way the sheet closes settles it with null, a new prompt settles a stale one first,
   and a listener that outlived its prompt does nothing. `outside`: a tap off the options answers no too. */
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
const curLabel = c => { const sy = ((CUR.list.find(x => x[0] === c) || [])[1] || '').trim(); return sy && sy !== c ? `${sy} ${c}` : c; };   /* take 111: "CHF CHF" */
function curPill() { return `<button class="pill" data-act="currency" aria-label="Change display currency" style="cursor:pointer">${esc(curLabel(CUR.active()))}</button>`; }
/* The day-over-day delta, exactly as the reference app shows it on every
   screen: a triangle, the dollar move, the percentage. Three states, and the
   third is the one that matters (PROTOCOL §10):
     up      ▲ $0.77 (0.50%)     green
     down    ▼ -$4.00 (-0.85%)   red
     none    — no yesterday      grey, and it SAYS so instead of showing 0.00%
   A printing with no prior day is not "unchanged"; it is unknown. */
/* Take 58. The "1-day" delta is against the closest day AT OR BEFORE
   yesterday (history.deltas), so after a night with no build it spans the
   gap. Calling a six-day move "since yesterday" is a claim the data does
   not support (PROTOCOL §10), so the app says the horizon it actually
   measured. One value for the whole catalogue: the last two days on file. */
function D1() { const d = (typeof CAT !== 'undefined' && CAT.days) || []; if (d.length < 2) return { gap: null };
  const p = d[d.length - 2], q = d[d.length - 1];
  return { gap: Math.round((Date.parse(q + 'T00:00:00Z') - Date.parse(p + 'T00:00:00Z')) / 864e5), from: p, to: q };
}
function sinceLabel({ cap = false } = {}) { const g = D1();
  if (g.gap == null) return cap ? 'No prior day on file' : 'no prior day on file';
  if (g.gap === 1) return cap ? 'Since yesterday' : 'since yesterday';
  return `${cap ? 'Over' : 'over'} ${g.gap} days (${dayText(g.from)} \u2192 ${dayText(g.to)})`;
}
function deltaHtml(p, { pctOnly = false, tile = false } = {}) {
  if (p.d1p == null) return `<span class="flat" title="no prior day on file">\u2014</span>`;
  const a = p.d1a, pc = p.d1p;
  const cls = a > 0.004 ? 'up' : a < -0.004 ? 'down' : 'flat';
  /* On a 184px tile the triangle already sits before the price; repeating it
     in the delta line pushed the line to two rows. */
  const tri = tile ? '' : cls === 'up' ? '\u25b2 ' : cls === 'down' ? '\u25bc ' : '';
  const pct = signedPct(pc);
  if (pctOnly) return `<span class="${cls} mono">${pct}</span>`;
  const abs = a >= 0 ? money(a) : signedMoney(a);
  return `<span class="${cls} mono">${tri}${abs} (${pct})</span>`;
}
/* One glyph helper. Everything iconographic in the app goes through it, so
   the set in assets/glyphs.svg is the only source and swapping a symbol is
   one file. Takes a size and an optional colour (a game colour or brass). */
/* Take 110 (polish): one empty state for a list that fills a screen -- its glyph, what is missing, what
   to do -- the look Collection's, Decks' and the Binder's already had. A line inside a panel stays a note. */
const EMPTY_GLYPH = { filter: 'filter', bookmark: 'bookmark', bell: 'bell', spyglass: 'spyglass', box: 'box', leader: 'leader' };   // read by smoke's sprite check (landmine 142)
const emptyHtml = (glyph, line, hint = '') => `<div class="empty">${G(EMPTY_GLYPH[glyph], 64)}<b class="empty-line">${line}</b>${hint ? `<br>${hint}` : ''}</div>`;
const G = (id, size = 16, style = '') =>
  `<svg class="g" width="${size}" height="${size}" style="${style}" aria-hidden="true"><use href="#g-${id}"/></svg>`;
/* take 108: the glyphs a few painters draw inside a scope that names its own G
   (the distributor feed): a fold’s chevron (turned while closed), a link that
   leaves the app, a tick, the stock alert’s bell (filled while it watches) */
const chev = (open, size = 16) => G('chevron', size, open ? '' : 'transform:rotate(-90deg)');
const ext = (size = 13) => G('external', size);
const tick = (size = 14) => G('check', size);
const bell = (on, size = 18) => G('bell', size, on ? 'fill:currentColor' : '');
const TYPE_GLYPH = { Leader: 'leader', Character: 'character', Event: 'event', Stage: 'stage' };
const KW_GLYPH = { Blocker: 'blocker', Rush: 'rush', Trigger: 'trigger', Counter: 'counter',
                   'Double Attack': 'rush' };   // take 106: Banish named 'roger', removed from the sprite at take 63 (landmine 142)
/* Take 106: a canvas cannot read var(--x), so a chart asks the page for the
   palette it is drawn in. Outside a browser (the harness’s stub) the lookup
   fails and Collect’s literals stand in. */
const TOK = (name, fallback) => { try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback; } catch (e) { return fallback; } };
const rgbaOf = (hex, a) => { const m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return `rgba(201,162,74,${a})`; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const reducedMotion = () => { try { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

