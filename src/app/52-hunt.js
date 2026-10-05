/* ---- hunt: sealed and releases (A32, take 70) ---------------------------
   Everything here is data the phone already holds: the catalogue’s sealed
   products with their TCGplayer market prices and nightly deltas, and the
   sets' publish dates. Store stock and local shops arrive in later takes
   through the runner’s feed; this screen says so rather than pretending. */
/* The Hunt feed (take 71): written by the runner, served by Pages beside the
   catalogue, read here. The app never asks a retailer anything itself. The
   feed says when each source was fetched; this shows that time and calls a
   source older than three hours stale. Cached in localStorage (~30 KB). */
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
  /* Take 73. What the runs say about ONE product: the last time it was seen
     shipping, and for the served zip every time a store went from none to
     some -- a restock, dated. No prediction is made until there is enough
     history to make one honestly (a fortnight); until then it lists what it
     saw and how many runs that rests on. */
  restocks(tcin, zip) { const h = this.hist; if (!h || !h.runs || !h.runs.length) return null;
    const runs = h.runs; const out = { runs: runs.length, since: h.since, lastShip: null, shipRuns: 0, events: [] };
    /* take 115 (loose-record 2, landmine 173): the days the rows span, from their own times -- the runs come about
       four-hourly, not hourly, so a count of runs is no measure of time */
    const at = r => Date.parse(r && r.t), span = ts => { ts = ts.filter(t => !isNaN(t)); return ts.length > 1 ? (Math.max(...ts) - Math.min(...ts)) / 864e5 : 0; };
    out.days = span(runs.map(at));
    /* take 115 (self-review): and only the runs that read THIS product count as its checks -- its online status, or its
       shelf at the served zip. The runs were counted: "50 checks over 8 days" of a product no run had read. */
    const seen = [], shelf = [];
    for (const r of runs) { const o = r.online && r.online[tcin], sh = zip && r.shelf && r.shelf[zip] && r.shelf[zip][tcin];
      if (o != null) { out.shipRuns++; if (o) out.lastShip = r.t; }
      if (sh) shelf.push(at(r)); if (o != null || sh) seen.push(at(r)); }
    out.checks = seen.length; out.checkDays = span(seen); out.shelfRuns = shelf.length; out.shelfDays = span(shelf);
    if (zip) { const prev = {};
      for (const r of runs) { const st = r.shelf && r.shelf[zip] && r.shelf[zip][tcin]; if (!st) continue;
        for (const [sid, q] of Object.entries(st)) { if ((prev[sid] || 0) === 0 && q > 0) out.events.push({ t: r.t, store: sid, qty: q }); prev[sid] = q; } } }
    return out; },
  /* take 114 (A32): one distributor item across the runs on file -- the facts; the words are distHistory's. A row
     without the distributor's key is a run that did not read it (a failed fetch keeps its last good copy and writes
     no key; before takes 94 and 112 there was none): never a state, never a change -- after the first check, one
     that could not reach it. An id missing from a row that has the key was not on the list that run. A value that
     is not a state word was read in a shape this version does not know: counted apart and said, never a state and
     never a hole. A change is dated by the two checks either side of it, never by one. Which changes are the
     calendar: Southern Hobby's states are all worked out from its dates, and GTS's coming, preorder and out are
     (gts.status_of) -- only its sold out, call, in stock and no status are read off its page. */
  DIST_KEY: { gts: 'sku', southern: 'id' },
  GTS_BY_DATE: new Set(['coming', 'preorder', 'out']),
  distKind(d, a, b) { return a == null || b == null ? 'page' : (d === 'southern' || (this.GTS_BY_DATE.has(a) && this.GTS_BY_DATE.has(b))) ? 'dates' : 'page'; },
  distTimeline(d, id) { const h = this.hist; if (!h || !Array.isArray(h.runs) || !h.runs.length) return null;
    const runs = h.runs.filter(r => r && typeof r.t === 'string' && !isNaN(Date.parse(r.t))).sort((a, b) => Date.parse(a.t) - Date.parse(b.t)); if (!runs.length) return null;   /* a sorted copy: the stored order is never trusted */
    const tl = { checks: 0, first: null, last: null, missed: 0, odd: 0, state0: null, now: null, changes: [], end: runs[runs.length - 1].t };
    let prev = null, prevT = null;
    for (const r of runs) { const m = r[d];
      if (!m || typeof m !== 'object' || Array.isArray(m) || !Object.keys(m).length) { if (tl.checks) tl.missed++; continue; }   /* not read that run -- an empty listing too (the runner refuses one from take 114, but rows before may hold it) */
      const v = Object.prototype.hasOwnProperty.call(m, id) ? m[id] : undefined;
      if (v !== undefined && typeof v !== 'string') { tl.odd++; continue; }   /* read, in a shape this version does not know */
      const st = v === undefined ? null : v; tl.checks++;
      if (tl.checks === 1) { tl.first = r.t; tl.state0 = st; }   /* the left edge of the record, never "since" */
      else if (st !== prev) tl.changes.push({ from: prev, to: st, after: prevT, by: r.t, kind: this.distKind(d, prev, st) });
      prev = st; prevT = r.t; tl.last = r.t; }
    /* take 142 (A32's Next): the item's days as the runner filed them -- [run, release, order due day], an entry when
       they moved; a move sits between the read that saw it and the read of this distributor before it */
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
  /* per catalogue product: the retailer lines that matched it */
  byCatalogId() { const out = {}; const t = this.feed && this.feed.sources && this.feed.sources.target; if (!t || !t.items) return out;
    for (const it of t.items) if (it.catalog_id) (out[it.catalog_id] ||= []).push(it); return out; },
  /* take 130: Walmart, per catalogue product -- the items of its committed list that matched (A32) */
  wmByCatalogId() { const out = {}; const w = this.feed && this.feed.sources && this.feed.sources.walmart; if (!w || !w.items) return out;
    for (const it of w.items) if (it.catalog_id) (out[it.catalog_id] ||= []).push(it); return out; },
  /* take 94: per catalogue product, the distributor’s listings that matched it. Take 112: two
     distributors -- GTS and Southern Hobby -- each item carrying which one it is from (_d) and a
     key that is unique across both (_k) */
  DISTS: [['gts', 'GTS Distribution'], ['southern', 'Southern Hobby']],
  dist(k) { return this.feed && this.feed.sources && this.feed.sources[k]; },
  /* take 143 (A32's Next): the items a distributor listed for this product, by the history's names, and lists no more on
     this phone's copy of its list -- a kept list counts, it is the last read that worked; no list at all, nothing is said */
  goneFor(pid) { const h = this.hist, out = []; if (!h || !h.items || typeof h.items !== 'object') return out;
    for (const [d] of this.DISTS) { const D = this.dist(d), m = h.items[d]; if (!D || !Array.isArray(D.items) || !D.items.length || !m || typeof m !== 'object' || Array.isArray(m)) continue;
      const key = this.DIST_KEY[d] || 'id', listed = new Set(D.items.map(i => String(i[key])));
      for (const [id, v] of Object.entries(m)) if (v && typeof v === 'object' && v.catalog_id === pid && typeof v.seen === 'string' && !isNaN(Date.parse(v.seen)) && !listed.has(id))
        out.push({ _d: d, _gone: true, [key]: id, catalog_id: pid, seen: v.seen }); }
    return out; },
  distName(k) { return (this.DISTS.find(d => d[0] === k) || [k, k])[1]; },
  /* take 115 (SPEC-112-54): a source whose fetch failed after a good one is kept by the feed with ok still true --
     kept, stale_since, the error (tools/hunt.py, where it keeps the last good fetch). It was not reached: said so
     wherever a source's state is said, while its kept copy is still what is shown */
  unreached(D) { return !!D && (!D.ok || !!D.kept); },
  distItems() { const out = []; for (const [k] of this.DISTS) { const D = this.dist(k); if (D && D.ok) for (const it of (D.items || [])) out.push(Object.assign(Object.create(it), { _d: k, _k: k + ':' + (it.sku || it.id) })); } return out; },
  distByCatalogId() { const out = {}; for (const it of this.distItems()) if (it.catalog_id) (out[it.catalog_id] ||= []).push(it); return out; },
  /* take 128 (D24): every catalogue id a source names -- a distributor's item, Target's, a shop's -- as numbers, for what Sealed lists */
  listedIds() { const s = new Set(); for (const k of Object.keys(this.distByCatalogId())) s.add(+k); for (const k of Object.keys(this.byCatalogId())) s.add(+k); for (const k of Object.keys(this.wmByCatalogId())) s.add(+k);
    for (const sh of ((LOCAL.shops && LOCAL.shops.shops) || [])) for (const it of (sh.sealed || [])) if (it.catalog_id) s.add(+it.catalog_id); return s; },
  /* Take 72. The collector’s zip, asked once. The runner serves LOCAL stock
     for a list of zips; the closest honest match is exact, then the same
     3-digit prefix (a sectional centre, roughly one metro), else none --
     and none is said as none, with the online layer still complete. */
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
/* take 130: Walmart's line under a product -- what its item page said and when, the marketplace seller named
   (every One Piece item there is a seller's, not Walmart's own), or that it has not been read yet */
function walmartLine(it) {
  const o = it.online;
  const what = o ? `${o.price != null ? money(o.price) : 'no price stated'} \u00b7 ${o.status === 'IN_STOCK' ? 'ships' : String(o.status || '?').toLowerCase().replace(/_/g, ' ') + ' online'}${o.seller ? ' \u00b7 sold by ' + esc(o.seller) : ''} \u00b7 ${HUNT.ageLabel(o.checked_at)}` : 'online stock not checked yet';
  return `<span style="display:block;color:var(--brass)">Walmart ${what}</span>`;
}
function targetLine(it, T) {
  /* every check carries its own time (take 72): the feed rotates through items
     under the retailer’s quota, so one item’s online status may be an hour
     older than the next one’s, and it says so */
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
    /* the shelf's words from its own checks at this zip; the count from the runs that read this product (take 115, self-review) */
    histTxt = [ship, rs.events.length ? `restocked ${rs.events.length}\u00d7 in ${days} d: ${ev}` : (sv2.how !== 'none' && rs.shelfRuns >= 2 && rs.shelfDays >= 1 ? `no shelf restock seen in ${days} d` : '')].filter(Boolean).join(' \u00b7 ');
    if (rs.checks && Math.round(rs.checkDays) < 14) histTxt += `${histTxt ? ' \u00b7 ' : ''}${rs.checks} check${rs.checks === 1 ? '' : 's'} of it ${rs.checkDays < 1 ? 'in less than a day' : `over ${cd} day${cd === 1 ? '' : 's'}`} so far \u2014 a pattern needs a fortnight`; }
  return `<span style="display:block;color:var(--brass)">Target ${money(it.price)} \u00b7 ${esc(online)}${shelfTxt ? ' \u00b7 ' + esc(shelfTxt) : ''}</span>${histTxt ? `<span style="display:block;color:var(--dim2);font-size:var(--fs-sm)">${esc(histTxt)}</span>` : ''}`;
}
/* take 114: GTS's preorder_date is its "Order Due Date" -- the last day a store orders by, read off GTS's own product
   page (HANDOFF take 114). Take 94 called it the opening day of preorders, inferred from the field's name: wrong.
   The state keys stay (the history rows since take 94 hold them); only the words changed. */
const DIST_WORDS = { sold_out: 'sold out', call: 'call to order', in_stock: 'in stock for stores', preorder: 'orders were due', coming: 'stores order by', out: 'out of stock', unknown: 'no status' };
const GTS_SHORT = { coming: 'orders close' };   /* on a row: Southern Hobby's short words for the same fact */
const GTS_NODATE = { coming: 'order due date ahead', preorder: 'no order due date listed' };   /* status_of says preorder of an unreleased product with no due date (none on 24 Sept) */
const nbsp = s => String(s).replace(/[ \u202f]/g, '\u00a0');   /* a day or a moment never breaks across a line */
function gtsWord(it, over, day) { const s = it.status; if (s !== 'coming' && s !== 'preorder') return DIST_WORDS[s] || s;
  return it.preorder ? ((over && over[s]) || DIST_WORDS[s]) + day(it.preorder) : GTS_NODATE[s]; }
/* take 112: Southern Hobby publishes no stock words; what it says is when stores had to order, and the release */
const SH_WORDS = { orders_open: 'stores order by', orders_closed: 'stores\u2019 orders closed', released: 'released', unknown: 'no dates' };
/* take 112, the owner's word: "I don't want them flooding the screen." A distributor on a row is its name and its
   state, one line; everything else is under a closed "Distributor info" -- on Sealed, on Releases and on a product's
   page. DISTF holds the drop-downs opened this session: 'sealed', 'releases', 'detail'; and (take 114, the owner:
   "it should be tucked away") the distributors whose history is open on the page shown, closed whenever one opens. */
const SH_SHORT = { orders_open: 'orders close', orders_closed: 'orders closed', released: 'released', unknown: 'no dates' };
/* take 115 (STAN-112-20): the date each Southern Hobby state names -- one map, read by the row's line and the full words.
   A state off the wire is never a key into it (tlDay's rule) */
const SH_AT = { orders_open: 'due', orders_closed: 'due', released: 'release' };
function shWord(it, words, day) { const own = (m, k) => Object.prototype.hasOwnProperty.call(m, k), f = own(SH_AT, it.state) ? SH_AT[it.state] : null, at = f && it[f];
  return (own(words, it.state) ? words[it.state] : String(it.state)) + (at ? day(at) : ''); }
const DISTF = { open: new Set(), hist: new Set() };
function distShort(it) {
  const day = d => ' ' + dayText(d).replace(/ /g, '\u00a0');   /* a day never breaks across a line (the take-112 look: "May" / "17" on Releases) */
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
  /* take 115 (SPEC-112-54): "checked" is a source that answered -- a kept copy's time is its last good read, and it
     made a failed source look fresh -- and "not reached" says since when (the first failure a kept copy carries) */
  const src = HUNT.DISTS.map(([k]) => HUNT.dist(k)).filter(Boolean), live = src.filter(D => !HUNT.unreached(D)), dead = src.filter(D => HUNT.unreached(D));
  const at = live.map(D => D.fetched_at).sort().pop(), stale = live.filter(D => HUNT.stale(D.fetched_at)).length;
  /* take 115 (self-review): a "since" only when every source not reached carries the first failure (a kept copy's
     stale_since). A source never read has only the failed run's own time, which moved forward every run. */
  const since = dead.length && dead.every(D => D.stale_since) ? dead.map(D => D.stale_since).sort()[0] : '';
  return [extra, `${src.length} distributor${src.length === 1 ? '' : 's'}`, at ? 'checked ' + esc(HUNT.ageLabel(at)) : '', stale ? `${stale} out of date` : '', dead.length ? `${dead.length} not reached${since ? ' since ' + esc(nbsp(momentText(since))) : ''}` : ''].filter(Boolean).join(' \u00b7 ');
}
/* take 115 (STAN-112-21): Diagnostics' feed line, the distributors from HUNT.DISTS; a kept copy says so (SPEC-112-54) */
/* take 115 (loose-diagnostics 1): the owner's Diagnostics read "85 sets" beside the build's 87, "350" sealed products
   beside 675, and "24 sealed products" without a picture, 5 of them DON!! cards. Each line now says what it counts,
   every number derived. hashes.py probes every row without a number, so the manifest carries those ids and SEALED's
   own predicate names the DON!! cards among them */
function picturesLine(im = CAT.man.images) {
  if (!im) return 'not measured';
  const ids = Array.isArray(im.missing_sealed_ids) ? im.missing_sealed_ids : null, rows = ids ? ids.map(id => CAT.byId.get(+id)) : [];
  const don = rows.filter(p => p && SEALED.isDon(p)).length, gone = rows.filter(p => !p).length;
  const what = ids ? `${im.missing_cards} cards, ${don} DON!! cards and ${ids.length - don - gone} sealed products${gone ? ` (and ${gone} no longer in the catalogue)` : ''}`
    : `${im.missing_cards} cards and ${im.missing_sealed} rows without a number (sealed products and DON!! cards)`;
  /* take 126 (landmine 240): the host's "Image Coming Soon" is among them -- a miss, not a picture -- and says so */
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
/* take 115 (loose-diagnostics 1): a set with products but no cards -- One Piece Collection Sets, sealed only -- is in
   the catalogue now, so a set's line says what it holds rather than "0 cards" */
function setCards(s, today = phoneToday()) { return s.n ? `${s.n} cards` : s.pub && s.pub >= today ? 'card list not published yet' : 'sealed products only'; }
/* take 115 (STAN-110-11, landmine 157): the button says what a tap adds -- CREDITS.PER_AD, which the manifest sets at boot */
function paintDevEarn() { const de = $('#devEarn'); if (de) de.textContent = `+${CREDITS.PER_AD} test credits`; }
function feedLine() {
  if (!HUNT.feed) return 'none';
  const kept = D => D && D.kept ? ` (kept; not reached since ${momentText(D.stale_since || D.fetched_at)})` : '', T = HUNT.feed.sources && HUNT.feed.sources.target;
  const W = HUNT.feed.sources && HUNT.feed.sources.walmart;   // take 130: after Target, before the distributors (the line's tail is the distributors', take 115)
  return [`${HUNT.ageLabel(HUNT.feed.fetched_at)}`, `target ${T && T.ok ? 'ok' : 'not ok'}${kept(T)}`,
    `walmart ${W ? (W.ok ? (W.items || []).length + ' items, ' + (W.items || []).filter(i => i.online).length + ' with an answer' + kept(W) : 'not ok') : 'absent'}`,
    ...HUNT.DISTS.map(([k]) => { const D = HUNT.dist(k); return `${k} ${D ? (D.ok ? (D.items || []).length + ' products' + kept(D) : 'not ok') : 'absent'}`; })].join(', ');
}
/* take 115 (SPEC-112-54): what a source's panel leads with -- when it was checked; or since when it could not be
   reached, and for a kept copy that the check shown is its last good one */
function sourceLead(name, D) {
  /* take 115 (self-review): since the first failure a kept copy carries; a source never read says when it was last
     tried -- its only time is that failed run's, and "since" it moved forward every run */
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
  /* take 94: the distributor, in the words it uses. A distributor sells to
     stores, not to collectors: sold out here months before release means the
     print run is spoken for; allocated means a store gets a share, not what it
     ordered. The MSRP is the suggested retail for the case pack and is named
     as such -- it is never shown as a price the collector can pay. Take 112:
     the days in words, as everywhere else (take 110), and Southern Hobby's own
     words -- its dates, a prerelease, and "in-store only" where it restricts a
     product to shops (allocation is on every presell there, so it says nothing
     about one product and goes unsaid). Take 114, fixed because it was
     broken: a day here broke across a line ("release Nov" / "20" at 411 px,
     the take-114 look) -- every day is in no-break spaces now, as a row's
     short line has been since take 112. */
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
/* take 114 (A32): the history on file, in words -- under each distributor inside the open Distributor info, behind
   its own one-line header (the owner: "distribution stuff is generally only for stores but this info can still help
   the consumer - so it should be tucked away").
   What was seen and at how many checks, never since when: a state at the first check on file was already so. A
   change sits between two checks, in this phone's time; one worked out from dates names the distributor's own day
   only when its dates put that day between the two checks (tlDay), else it keeps the two checks and a note says why.
   No pattern, no forecast (take 73). The words are the distributor's own, without their dates. */
const TL_WORDS = { gts: { ...DIST_WORDS, coming: 'order due date ahead', preorder: 'no order due date ahead' },
  southern: { ...SH_WORDS, orders_open: 'order due date ahead' } };
const TL_HOW = { page: 'read off its page', dates: 'worked out from its dates' };
const TL_SHOW = 3;
/* a calendar change's own day: [the item's date, the days after it that the runner's UTC day turns the state, the
   states it turns from] -- a due day is kept open at both (gts.status_of from take 114, southern.state_of) */
const TL_TURN = { gts: { preorder: ['preorder', 1, ['coming']], out: ['release', 0, ['coming', 'preorder']] },
  southern: { orders_closed: ['due', 1, ['orders_open']], released: ['release', 0, ['orders_open', 'orders_closed']] } };
const TL_DAYW = { gts: { preorder: D => `orders were due ${D}`, out: D => `released ${D}, out of stock` },
  southern: { orders_closed: D => `stores\u2019 orders closed ${D}`, released: D => `released ${D}` } };
const TL_NOTE = 'Some changes are worked out from dates, so they show between two checks, not on a day.';
const utcDay = (iso, add = 0) => new Date(Date.parse(iso) + add * 864e5).toISOString().slice(0, 10);
const tlWord = (d, st) => { if (st == null) return 'not on its list'; const w = TL_WORDS[d]; return w && Object.prototype.hasOwnProperty.call(w, st) ? w[st] : String(st); };
const tlClock = iso => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
/* a change's two checks: the second end drops its day on the same local day -- unless the clocks changed between them
   (the November fall-back hour could read "1:50 AM and 1:10 AM"), when both ends carry their zone */
const tlZoned = iso => nbsp(new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }));
function tlWindow(c) {
  const a = new Date(c.after), b = new Date(c.by);
  if (a.getTimezoneOffset() !== b.getTimezoneOffset()) return `between ${tlZoned(c.after)} and ${tlZoned(c.by)}`;
  return `between ${nbsp(momentText(c.after))} and ${localDay(c.after) === localDay(c.by) ? nbsp(tlClock(c.by)) : nbsp(momentText(c.by))}`;
}
/* the distributor's own day for a change worked out from its dates, off the CURRENT item's date: named only when that
   date turns the state after the earlier check's UTC day and by the day after the later one's (a run that began
   before midnight UTC and read the distributor after it; take 113's due-day boundary) -- a date moved since falls
   outside, and the two checks stand */
function tlDay(d, c, it) {
  const T = c && c.kind === 'dates' && TL_TURN[d] && Object.prototype.hasOwnProperty.call(TL_TURN[d], c.to) && TL_TURN[d][c.to];   /* a state word off the wire is never a key into this */
  if (!T || !it || !T[2].includes(c.from)) return null;
  const at = it[T[0]]; if (typeof at !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(at) || isNaN(Date.parse(at))) return null;
  const turn = utcDay(at, T[1]); return utcDay(c.after) < turn && turn <= utcDay(c.by, 1) ? at : null;
}
function distTl(it) { return HUNT.distTimeline(it._d, it[HUNT.DIST_KEY[it._d] || 'id']); }
/* take 142: a moved day in words -- "release moved Nov 20 \u2192 Dec 4"; a day first given, or no longer given, says so */
function tlMoved(c) { const F = c.field === 'due' ? 'order due date' : 'release', D = x => nbsp(dayText(x));
  return c.from && c.to ? `${F} moved ${D(c.from)} \u2192 ${D(c.to)}` : c.to ? `${F} now ${D(c.to)}` : `${F} no longer given (was ${D(c.from)})`; }
function distHistory(it, tl = distTl(it)) {
  if (!tl) return '';   /* take 73: with no history it says nothing */
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
      const at = tlDay(d, c, it);   /* the last three, oldest first */
      lines.push(at ? dotJoin(`${W(c.from)} \u2192 ${TL_DAYW[d][c.to](nbsp(dayText(at)))}`, TL_HOW.dates)
        : dotJoin(`${W(c.from)} \u2192 ${W(c.to)}`, tlWindow(c), TL_HOW[c.kind])); } }
  return box(head, lines);
}
/* the fold's note: only when a change on screen -- its history open -- was worked out from dates that do not put its
   day between its checks */
const tlNeedsNote = (it, tl) => !!tl && DISTF.hist.has(it._d) && tl.changes.slice(-TL_SHOW).some(c => c.kind === 'dates' && !tlDay(it._d, c, it));
/* take 114: of GTS's unreleased products (release after the day it was read, UTC as gts.status_of), how many still have an
   order due date ahead -- the due day kept open -- and how many do not: sold out or not, the count says what its words say */
function gtsDue(gi, at) { const day = String(at || '').slice(0, 10), un = gi.filter(i => i.release && i.release > day), ahead = un.filter(i => i.preorder && i.preorder >= day).length;
  return { ahead, without: un.length - ahead }; }
/* ---- where to buy (A38 item 4, take 96) --------------------------------
   Every seller the app knows for a sealed product, as a link to the seller’s
   OWN page opened by the OS browser: nothing is bought here, nothing is
   fetched, no link carries a referral (PROVISION). TCGplayer always -- its
   product URL is the catalogue’s own id -- then each Target, shop and
   distributor listing the feed matched. A shop brings the roster’s street
   address, phone and distance. The glyph says the KIND of seller; a brand
   logo is a Play rejection ground (landmine 29's family), so the name does. */
const BUY_GLYPH = { online: 'cart', local: 'pin', dist: 'truck' };
function buySources(p) {
  const out = [{ kind: 'online', label: 'TCGplayer', url: 'https://www.tcgplayer.com/product/' + p.id, note: `${money(p.market)} market \u00b7 ${dayText(CAT.man.source_updated_at)}` }];
  const T = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.target;
  for (const it of (HUNT.byCatalogId()[p.id] || [])) if (it.url) out.push({ kind: 'online', label: 'Target', url: it.url,
    note: `${money(it.price)} \u00b7 ${it.online ? (it.online.status === 'IN_STOCK' ? 'ships' : String(it.online.status || '?').toLowerCase().replace(/_/g, ' ') + ' online') : 'online stock not checked yet'} \u00b7 ${HUNT.ageLabel(it.online_at || (T && T.fetched_at))}` });
  for (const it of (HUNT.wmByCatalogId()[p.id] || [])) if (it.url) out.push({ kind: 'online', label: 'Walmart', url: it.url,   // take 130: the item's own page, no referral
    note: it.online ? `${it.online.price != null ? money(it.online.price) : 'no price stated'} \u00b7 ${it.online.status === 'IN_STOCK' ? 'ships' : String(it.online.status || '?').toLowerCase().replace(/_/g, ' ') + ' online'}${it.online.seller ? ' \u00b7 sold by ' + it.online.seller : ''} \u00b7 ${HUNT.ageLabel(it.online.checked_at)}` : 'online stock not checked yet' });
  for (const l of LOCAL.shopLines(p.id)) if (l.url) out.push({ kind: 'local', label: l.shop, url: l.url, addr: l.addr, phone: l.phone, mi: l.mi,
    note: `${money(l.price)} \u00b7 ${l.available ? 'in stock online' : 'sold out online'} \u00b7 ${HUNT.ageLabel(LOCAL.shops && LOCAL.shops.fetched_at)}` });
  /* take 112: the distributors left this list for the page's Distributor info -- they sell to stores, and their
     words need more room than a buy row (the owner, 24 Sept) */
  return out;
}
function buyChips(p) {
  const chip = s => `<a class="chip buy" href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}: open the seller’s page for ${esc(p.name)}">${G(BUY_GLYPH[s.kind], 12)} ${esc(s.label)} ${ext(12)}</a>`
    + (s.phone ? `<a class="chip buy" href="tel:${esc(s.phone)}" aria-label="Call ${esc(s.label)}">${G('phone', 12)} Call</a>` : '');
  return `<div class="chips buy" style="flex-basis:100%">${buySources(p).map(chip).join('')}</div>`;
}
const SEALED = {
  q: '', kind: 'all', open: new Set(), closed: new Set(['decks']),   // take 98: the Starter decks section starts folded (the owner’s word)
  /* TCGCSV files DON!! cards as sealed because they have no number; they are single cards, not product, and stay
     out of this screen. Take 115 (STAN-111-14): the product test lives here once -- isGoods is a sealed product,
     priced or not; isProduct is what Sealed lists, one with a market price; isDon holds the one DON!! pattern */
  isGoods(p) { return !!p && !!p.sealed && !SEALED.isDon(p); },
  isProduct(p) { return SEALED.isGoods(p) && p.market > 0; },
  /* take 128 (D24, the owner's (b)): the screen lists a priced product, and an unpriced one that a distributor, Target or a
     shop names -- the product a source is talking about is Hunt's subject whether TCGplayer has priced it yet or not (the
     EB-05 pack lost its price for a night and left the screen, landmine 243). `src` is the set of catalogue ids the feed
     names, built once per paint (HUNT.listedIds); isProduct keeps its meaning, a priced product, for Diagnostics' count. */
  listed(p, src) { return SEALED.isGoods(p) && (p.market > 0 || !!(src && src.has(p.id))); },
  /* take 111: a DON!! card is filed as sealed (it has no number) but is one card -- a finish, a grade, a condition */
  isDon(p) { return !!p.sealed && /don!! card/i.test(p.name || ''); },
  kindOf(p) { const n = (p.name || '').toLowerCase();
    if (/booster box|display/.test(n)) return 'box';
    if (/case\b/.test(n)) return 'case';
    if (/starter deck|deck set|ultra deck|st-?\d/.test(n)) return 'deck';
    if (/booster pack|pack\b|blister|sleeved/.test(n)) return 'pack';
    if (/collection|illustration box|gift|battle kit/.test(n)) return 'collection';
    return 'other'; },
  rows(src = HUNT.listedIds()) { const q = this.q.trim().toLowerCase();
    return CAT.rows.filter(p => this.listed(p, src))
      .filter(p => this.kind === 'all' || this.kindOf(p) === this.kind)
      .filter(p => !q || (p.name || '').toLowerCase().includes(q) || (CAT.sets.get(p.set)?.name || '').toLowerCase().includes(q))
      .sort((a, b) => (CAT.sets.get(b.set)?.pub || '').localeCompare(CAT.sets.get(a.set)?.pub || '') || a.name.localeCompare(b.name)); }
};
/* take 115 (STAN-111-16): one table of the kinds -- the chip's word, then one of a kind (take 111: a product's own
   page, its tile in the collection). kindOf always names one of these; 'other' is the last */
const SEALED_KINDS = [['all', 'All'], ['box', 'Boxes', 'Box'], ['pack', 'Packs', 'Pack'], ['deck', 'Decks', 'Deck'], ['case', 'Cases', 'Case'], ['collection', 'Collections', 'Collection'], ['other', 'Other', 'Sealed product']];
const sealedKind = p => SEALED_KINDS.find(k => k[0] === SEALED.kindOf(p)) || SEALED_KINDS[SEALED_KINDS.length - 1];
const sealedWord = p => sealedKind(p)[2];
/* Take 83 (products), take 93 (cards and sets, A33 item 6). One picture box
   for every row: TCGplayer’s photo through the take-12 path (hot-linked,
   lazy, never stored). Under it, and in its place when there is none, a
   drawn tile in the card’s colour with a label -- so a row never has a hole
   (landmine 85). The .pic rules size the image; nothing else is needed. */
function picBox(p, w, h, label, radius = 'var(--r-md)') {
  const cs = gameColours(p);
  const a = cs[0] ? `var(--c-${CCLASS[cs[0]]})` : 'var(--brass2)';
  return `<div class="pic" style="width:${w}px;height:${h}px;flex:0 0 auto;position:relative;border-radius:${radius};overflow:hidden;background:linear-gradient(160deg,${a},var(--card2));">
    <div class="ph" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:${Math.max(12, Math.round(w / 4))}px"><span class="phl">${label}</span></div>${refArt(p)}</div>`;
}
/* Take 110 (polish): three thumbnail sizes, one per kind of list, where there were seven (30 to 56 px):
   a dense deck-building list, a list row, a sealed product. The --thumb-* tokens say the same. */
const THUMB = { s: 32, m: 44, l: 56 };
function productPic(p, size = THUMB.l) {
  const st = CAT.sets.get(p.set) || {};
  const code = esc((st.abbr || '').replace(/-/g, '').slice(0, 5) || (p.num || '').split('-')[0]);
  return picBox(p, size, Math.round(size * 1.25), code);
}
/* a card at the card’s ratio, its number as the label */
function cardPic(p, w = THUMB.m) {
  return picBox(p, w, Math.round(w / 0.716), esc((p.num || '').split('-').pop() || ''), 'var(--r-sm)');
}
/* a set’s booster box (Releases had this as a local since take 83) */
function setPic(s, w = THUMB.m) {
  const ps = CAT.rows.filter(p => p.set === s.id && SEALED.isProduct(p));
  const box = ps.find(p => /booster box/i.test(p.name)) || ps[0];
  return box ? productPic(box, w) : `<div class="pic" style="width:${w}px;height:${Math.round(w * 1.25)}px;flex:0 0 auto;border-radius:var(--r-md);background:var(--card2);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:var(--fs-cap);color:var(--dim2)">${esc((s.abbr || '').replace(/-/g, '').slice(0, 5))}</div>`;
}
/* Take 110 (A42, A -- the owner’s pick for Hunt): Sealed opens under the newest booster set’s top
   card, crisp at the large size and cut above the stamp (landmine 151); the owner’s hero-hunt.jpg
   stands in when supplied. The title sits in A’s slot, where Decks' does. */
/* take 115 (STAN-111-16): one Sealed row, where two near copies each took take 111's edit -- the starter decks'
   section and every set's. Its picture and name; under the name `sub` (the set, or the kind) with low and high, then
   the stock sources' `lines`; its price; the stock bell; where to buy; each distributor's short line */
function sealedRow(p, sub, lines, byDist) {
  const on = STOCK.has(p.id), priced = p.market > 0;   /* take 128 (D24): a product with no price yet says so where low and high would be, and its column stays blank */
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
  const src = HUNT.listedIds();   /* take 128 (D24): what a source names is listed, priced or not */
  const counts = {}; for (const p of CAT.rows) if (SEALED.listed(p, src)) { const k = SEALED.kindOf(p); counts[k] = (counts[k] || 0) + 1; counts.all = (counts.all || 0) + 1; }
  $('#sealedKinds').innerHTML = SEALED_KINDS.map(([k, label]) => `<button class="chip${SEALED.kind === k ? ' on' : ''}" data-skind="${k}" aria-pressed="${SEALED.kind === k}">${label} <span class="note">${counts[k] || 0}</span></button>`).join('');
  const rows = SEALED.rows(src); let lastSet = null; const out = [];
  const T = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.target; const byCat = HUNT.byCatalogId(); const byWm = HUNT.wmByCatalogId();   // take 130
  const gts = HUNT.dist('gts'); const byDist = HUNT.distByCatalogId();   // take 94; take 115: gts, not G -- a local G hid the glyph helper
  /* starter decks, their own section (take 87): every deck product, newest set first */
  /* take 117 (the owner's screenshot: starter decks outside their section): every product of a starter-deck SET -- the decks and
     their display -- lives here, and the by-set fold below skips what this section lists, so nothing is listed twice */
  const inDecks = new Set();
  if (SEALED.kind === 'all' && !SEALED.q) { const decks = CAT.rows.filter(p => SEALED.listed(p, src) && ((CAT.sets.get(p.set) || {}).kind === 'deck' || SEALED.kindOf(p) === 'deck')).sort((a, b) => (CAT.sets.get(b.set)?.pub || '').localeCompare(CAT.sets.get(a.set)?.pub || '') || a.name.localeCompare(b.name)); decks.forEach(p => inDecks.add(p.id));
    /* take 110: a strip like every set’s heading, under the newest starter deck’s own top card */
    const dtop = decks.map(p => setTop(p.set)).find(Boolean);
    if (decks.length) out.push(`<button class="fgrp setstrip" data-setfold="decks" aria-expanded="${!SEALED.closed.has('decks')}">${dtop ? artBack(dtop, { crisp: true }) : ''}<span>Starter decks<span class="note">${decks.length} products</span></span><span class="note" aria-hidden="true">${chev(!SEALED.closed.has('decks'))}</span></button>`);
    if (decks.length && !SEALED.closed.has('decks')) for (const p of decks.slice(0, 240)) out.push(sealedRow(p, esc(CAT.sets.get(p.set)?.name || ''), (byCat[p.id] || []).map(i => targetLine(i, T)).join('') + (byWm[p.id] || []).map(walmartLine).join(''), byDist)); }
  /* stock alerts: what is watched, and where it was last seen */
  if (STOCK.list.length) out.push(`<div class="panel"><h3>Stock alerts</h3>${STOCK.list.map(a => { const srcs = STOCK.sourcesFor(a.id); const on = srcs.filter(x => x.available);
    return `<div class="row"><div class="nm"><b>${esc(a.name)}</b><span>${on.length ? 'in stock: ' + esc(on.map(x => x.label).join(', ')) : srcs.length ? 'not in stock at ' + srcs.length + ' watched source' + (srcs.length === 1 ? '' : 's') : 'no source carries it yet'}${a.fired && a.fired.length ? ' \u00b7 last alert ' + esc(HUNT.ageLabel(a.fired[0].t)) : ''}</span></div><div class="v"><button class="ghost" data-stock="${a.id}" aria-label="Stop watching ${esc(a.name)}">${G('trash', 18)}</button></div></div>`; }).join('')}
    <div class="note" style="margin-top:6px">Tells you once each time it comes back in stock. Checked when you open the app.</div></div>`);
  /* the retailer panel: what the runner saw, and when */
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
  /* take 94: the distributor panels -- what the runner read at GTS and, from take 112, Southern Hobby. Take 112,
     the owner's word: one closed "Distributor info" holds them, with a line saying what is inside */
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
  /* folded by set (take 81): a header with a count per set; the two newest
     open, the rest open on tap, a search opens everything it matches */
  const bySet = new Map(); for (const p of rows.slice(0, 600)) { if (inDecks.has(p.id)) continue; if (!bySet.has(p.set)) bySet.set(p.set, []); bySet.get(p.set).push(p); }
  let n = 0; const TODAY = phoneToday();
  for (const [setId, ps] of bySet) { const st = CAT.sets.get(setId) || {}; const open = SEALED.q || !SEALED.closed.has(setId); n++;
    const top = setTop(setId);   /* take 110: the set’s own top card behind its name */
    out.push(`<button class="fgrp setstrip" data-setfold="${esc(setId)}" aria-expanded="${open}">${top ? artBack(top, { crisp: true }) : ''}<span>${esc(st.name || 'Other')}${st.pub ? `<span class="note">${st.pub > TODAY ? 'Releases' : 'Released'} ${esc(dayText(st.pub))}</span>` : ''}</span><span class="note" aria-hidden="true">${chev(open)}</span></button>`);
    if (!open) continue;
    for (const p of ps) {
    const tl = (byCat[p.id] || []).map(i => targetLine(i, T)).join('') + (byWm[p.id] || []).map(walmartLine).join('') + LOCAL.shopLines(p.id).map(l => `<span style="display:block;color:var(--brass)">${esc(l.shop)}${l.mi != null ? ' ~' + l.mi + ' mi' : ''} ${money(l.price)} \u00b7 ${l.available ? 'in stock online' : 'sold out online'} \u00b7 ${esc(HUNT.ageLabel(LOCAL.shops.fetched_at))}</span>`).join('');
    out.push(sealedRow(p, esc(sealedWord(p)), tl, byDist));   /* take 120: the singular -- one product read "Boxes" */
    }
  }
  /* take 110: the stock panels always fill the list, so an empty search said nothing at all (the fallback below never ran) */
  if (!rows.length) out.push(emptyHtml('box', 'Nothing matches', 'Clear the search, or choose All.'));
  $('#sealedList').innerHTML = out.join('') || emptyHtml('box', 'Nothing matches', 'Clear the search, or choose All.');
  const hs = $('#huntSync'); if (hs) hs.addEventListener('click', async () => { hs.disabled = true; const ok = await HUNT.sync(); await HUNT.syncHistory(); await LOCAL.syncShops(); hs.disabled = false; if (ok) { const n = await STOCK.check(); toast(n ? `Stock feed updated \u2014 ${n} in stock` : 'Stock feed updated'); paintSealed(); } });
  const hz = $('#huntZip'); if (hz) hz.addEventListener('click', async () => { if (await askZip()) paintSealed(); });
}
/* ---- hunt: stock alerts (take 77) ---------------------------------------
   "Tell me when this is in stock anywhere the feed watches." A price alert
   (take 27) watches a number; a stock alert watches availability, per
   source, and fires on the FLIP from not-available to available -- once per
   source per flip, never every hour it stays in stock. Sources today:
   Target online, a Target shelf in the served zip, a local shop’s online
   store. Any source the feed grows into plugs in through sourcesFor(). */
const STOCK = {
  list: readJson('vault.stockAlerts', []),
  save(quiet = false) { saveJson('vault.stockAlerts', this.list); if (!quiet) scheduleBackup('lists'); },
  has(id) { return this.list.some(a => a.id === id); },
  toggle(id) { const p = CAT.byId.get(id); if (!p) return false;
    if (this.has(id)) { this.list = this.list.filter(a => a.id !== id); this.save(); return false; }
    this.list.push({ id, name: p.name, created: new Date().toISOString(), seen: {}, fired: [] }); this.save(); return true; },
  /* every place the feed knows this product, and whether it is available there NOW */
  sourcesFor(id) { const out = []; const T = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.target; const sv = HUNT.served();
    if (T && T.ok) for (const it of (T.items || [])) { if (it.catalog_id !== id) continue;
      if (it.online) out.push({ key: 'target:online:' + it.tcin, label: 'Target online', available: it.online.status === 'IN_STOCK', at: it.online_at });
      if (sv.how !== 'none') { const zz = T.zips[sv.zip]; const st = zz && zz.ok && zz.stock[it.tcin]; if (st) { const on = Object.entries(st).filter(([, v]) => (v.qty || 0) > 0).map(([sid]) => { const x = zz.stores.find(y => y.id === sid); return x ? x.name : sid; });
        out.push({ key: 'target:shelf:' + sv.zip + ':' + it.tcin, label: on.length ? 'Target ' + on.join(', ') : 'a Target shelf near ' + sv.zip, available: on.length > 0, at: zz.checked_at && zz.checked_at[it.tcin] }); } } }
    for (const it of (HUNT.wmByCatalogId()[id] || [])) if (it.online) out.push({ key: 'walmart:online:' + it.id, label: 'Walmart online', available: it.online.status === 'IN_STOCK', at: it.online.checked_at, url: it.url });   // take 130
    for (const sh of ((LOCAL.shops && LOCAL.shops.shops) || [])) for (const it of (sh.sealed || [])) if (it.catalog_id === id) out.push({ key: 'shop:' + sh.url + ':' + it.url, label: sh.name + ' online', available: !!it.available, at: LOCAL.shops.fetched_at, url: it.url });
    /* take 94: the distributor -- available to STORES when it shows stock; the flip is the reprint wave arriving. Take 114,
       the owner's answer: stock only -- 'preorder' is GTS's state after stores' orders were due, not an open preorder */
    const gts = HUNT.dist('gts');
    if (gts && gts.ok) for (const it of (gts.items || [])) if (it.catalog_id === id) out.push({ key: 'gts:' + it.sku, label: 'GTS Distribution (to stores)', available: it.status === 'in_stock', at: gts.fetched_at, url: it.url });
    return out; },
  /* after any sync: fire on flips, remember what was seen */
  async check() { const fired = []; let changed = false;
    for (const a of this.list) { a.seen = a.seen || {}; a.fired = a.fired || [];
      for (const src of this.sourcesFor(a.id)) { const was = a.seen[src.key];
        if (src.available && was !== true) { fired.push({ a, src }); a.fired.unshift({ t: new Date().toISOString(), label: src.label }); a.fired = a.fired.slice(0, 5); }
        if (a.seen[src.key] !== src.available) changed = true; a.seen[src.key] = src.available; } }
    if (changed) this.save(true);
    for (const [k, f] of fired.entries()) { const ok = await PLATFORM.notify(9000 + (k % 500), `In stock: ${f.a.name}`, `${f.src.label} \u2014 ${HUNT.ageLabel(f.src.at)}`); if (!ok) toast(`In stock: ${f.a.name} at ${f.src.label}`); }
    return fired.length; }
};
/* ---- hunt: local (A32, take 74) ----------------------------------------
   Three lists from the collector’s zip outward, filtered by the distance
   dropdown: the shops that run One Piece events (the roster, from Bandai
   TCG+ via onepieceevents.com, with each shop’s next events), the Target
   stores the feed checked for the served zip, and the collector’s own notes
   -- name, phone, what was on the shelf and when. Distances are from the
   centre of the collector’s 3-digit zip area, so they are "about". */
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
  /* per catalogue sealed product: the local-shop listings that matched it */
  shopLines(catId) { const out = []; for (const sh of ((this.shops && this.shops.shops) || [])) for (const it of (sh.sealed || [])) if (it.catalog_id === catId) {
      const st = (this.stores && this.stores.stores || []).find(s => s.zip === sh.zip && s.name === sh.name);   // the roster entry: distance since take 75, address and phone since take 96
      out.push({ shop: sh.name, ...it, mi: this.miles(st && st.ll), addr: st ? [st.addr, st.city].filter(Boolean).join(', ') || null : null, phone: (st && st.phone) || null }); }
    return out; },
  /* Exact distances (take 79): the full zip-centroid table, fetched once on
     request and kept on the phone when it fits (~758 KB); a zip found in it
     is placed within a mile or two instead of the prefix area’s ten. */
  zcta: readJson('vault.hunt.zcta', null, false),
  async syncZcta() { const u = HUNT.url(); if (!u || !navigator.onLine) return false;
    try { const r = await fetch(u.replace(/feed\.json$/, 'zcta.json'), { cache: 'force-cache' }); if (!r.ok) return false; const j = await r.json(); if (!j || !j['48329']) return false;
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
  /* the roster */
  const R = LOCAL.stores; const shops = (R && R.stores) ? R.stores.map(s => ({ ...s, mi: LOCAL.miles(s.ll) })).filter(s => LOCAL.within(s.mi)).sort((a, b) => (a.mi ?? 9e9) - (b.mi ?? 9e9)) : [];
  out.push(`<div class="panel"><h3>Shops that run events${R ? ` <span class="note">\u00b7 ${shops.length}${LOCAL.radius ? ` within ${LOCAL.radius} mi` : ''}</span>` : ''}</h3>
    ${!R ? `<div class="note">Not fetched yet on this phone. Refresh when you are online.</div><div class="row" style="margin-top:8px"><button class="ghost" id="localSync">Refresh</button></div>` :
      !HUNT.zip ? '<div class="note">Enter your zip above.</div>' :
      !shops.length ? `<div class="note">None within ${LOCAL.radius} mi of your zip area. Widen the distance.</div>` :
      shops.slice(0, 60).map(s => `<div class="row"><div class="nm" style="min-width:0"><b>${esc(s.name)}</b><span>${esc([s.addr, s.city, s.state].filter(Boolean).join(', '))}${s.mi != null ? ` \u00b7 ${s.exact ? '' : '~'}${s.mi} mi` : ''}</span>
        ${s.events && s.events.length ? `<span style="display:block;color:var(--brass)">${s.events.slice(0, 2).map(e => `${esc(dayText(e.d))} ${esc(e.t)}${e.k === 'release' ? ' \u2014 release event' : ''}`).join(' \u00b7 ')}</span>` : ''}</div>
        <div class="v" style="flex:0 0 auto;display:flex;gap:6px">${s.phone ? `<a class="ghost" href="tel:${esc(s.phone)}" style="padding:8px 12px" aria-label="Call ${esc(s.name)}">Call</a>` : ''}<button class="ghost" data-localnote="${esc(s.name)}" aria-label="Add a note for ${esc(s.name)}">Note</button></div></div>`).join('')}
    <div class="note" style="margin-top:8px">Stores near you that run One Piece events. From ${esc((R && R.source) || 'Bandai TCG+')}${R ? ', ' + esc(HUNT.ageLabel(R.fetched_at)) : ''}.</div></div>`);
  /* Target stores the feed checked */
  const T = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.target; const sv = HUNT.served(); const zz = T && sv.how !== 'none' ? T.zips[sv.zip] : null;
  if (zz && zz.stores && zz.stores.length) out.push(`<div class="panel"><h3>Target stores checked <span class="note">\u00b7 for ${esc(sv.zip)}</span></h3>${zz.stores.filter(s => LOCAL.within(s.miles)).map(s => `<div class="row"><div class="nm"><b>Target ${esc(s.name)}</b><span>${s.miles} mi from ${esc(sv.zip)}</span></div></div>`).join('') || `<div class="note">None within ${LOCAL.radius} mi.</div>`}</div>`);
  /* local shops with an online store */
  const SH = LOCAL.shops;
  out.push(`<div class="panel"><h3>Shops with an online store</h3>
    ${!SH ? `<div class="note">Not fetched yet on this phone.</div>` : !(SH.shops || []).length ? '<div class="note">None on the verified list yet.</div>' :
      SH.shops.map(sh => { const st = (LOCAL.stores && LOCAL.stores.stores || []).find(s => s.zip === sh.zip && s.name === sh.name); const mi = LOCAL.miles(st && st.ll);
        return `<div class="row"><div class="nm"><b>${esc(sh.name)}</b><span>${mi != null ? '~' + mi + ' mi \u00b7 ' : ''}${sh.ok ? `${sh.sealed.length} sealed listed, ${sh.sealed.filter(i => i.available).length} in stock, ${sh.singles} singles` : 'unreachable: ' + esc(sh.error || '?')}</span>
          ${sh.ok && sh.sealed.length ? `<span style="display:block;color:var(--brass)">${sh.sealed.slice(0, 4).map(i => `${esc(i.title.slice(0, 40))} ${money(i.price)}${i.available ? '' : ' (out)'}`).join(' \u00b7 ')}</span>` : ''}</div>
          <div class="v"><a class="ghost" href="${esc(sh.url)}" target="_blank" rel="noopener" style="padding:8px 12px" aria-label="Open ${esc(sh.name)}\u2019s online store">Open ${ext()}</a></div></div>`; }).join('')}
    <div class="note" style="margin-top:8px">What each shop lists on its own site, checked hourly.${SH ? ' Fetched ' + esc(HUNT.ageLabel(SH.fetched_at)) + '.' : ''}</div></div>`);
  /* the collector’s own notes */
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
  /* take 137 (A43): in the currency on screen, kept in US dollars like every price the app shows (money() converts back) */
  const c = CUR.active();
  const price = await ask({ title: 'Price, if you saw one', kind: 'number', placeholder: `${c === 'USD' ? 'USD' : curLabel(c)}, optional`, ok: 'Next',
    why: `Per box or pack, as marked${c === 'USD' ? '' : `, in ${esc(curLabel(c))}; it is kept in US dollars`}.` });
  const pr = typedAmount(price);
  const phone = await ask({ title: 'Their phone, optional', kind: 'text', placeholder: '(248) 555-0100', ok: 'Save', why: 'Adds a Call button to the note.' });
  LOCAL.notes.push({ store: st, what: what || '', price: pr > 0 ? fromShown(pr) : null, phone: (phone || '').trim() || null, when: localDay(new Date().toISOString()) }); LOCAL.saveNotes(); paintLocal();   // take 137: the phone's day (the UTC date was tomorrow's on a US evening)
}
$('#localRadius').addEventListener('change', e => { LOCAL.radius = +e.target.value; saveJson('vault.hunt.radius', String(LOCAL.radius)); paintLocal(); });
$('#local').addEventListener('click', e => { const n = e.target.closest('[data-localnote]'); if (n) { addLocalNote(n.dataset.localnote); return; }
  const d = e.target.closest('[data-localdel]'); if (d) { LOCAL.notes.splice(+d.dataset.localdel, 1); LOCAL.saveNotes(); paintLocal(); } });
/* ---- hunt: events (take 76) --------------------------------------------
   Every One Piece event within the radius for the next month, from the
   roster’s events table: date, title, store and distance, the fee, the
   capacity, and the registration link on Bandai TCG+ (registration happens
   there, in Bandai’s app; this app only points). */
const EVENTS = {
  tab: readJson('vault.hunt.events', null, false),
  days: +(localStorage.getItem('vault.hunt.eventDays') || 14),
  async sync() { const u = HUNT.url(); if (!u || !navigator.onLine) return false;
    try { const r = await fetch(u.replace(/feed\.json$/, 'events.json'), { cache: 'no-store' }); if (!r.ok) return false; const j = await r.json(); if (!j || !Array.isArray(j.rows)) return false;
      this.tab = j; try { localStorage.setItem('vault.hunt.events', JSON.stringify(j)); } catch (e) { toast('Event list too large to keep offline; showing it now'); } return true; } catch (e) { return false; } },
  rows() { const t = this.tab, R = LOCAL.stores; if (!t || !R || !R.stores) return [];
    const today = phoneToday();   // take 141: tonight's event stays until the phone's day ends
    return t.rows.map(r => { const st = R.stores[r[0]]; if (!st) return null; return { store: st, d: r[1], title: t.titles[r[2]] || '', id: r[3], fee: r[4], cap: r[5], release: !!r[6], mi: LOCAL.miles(st.ll), url: r[3] ? t.url + r[3] : null }; })
      .filter(e => e && e.d >= today && LOCAL.within(e.mi)).sort((a, b) => a.d.localeCompare(b.d) || (a.mi ?? 9e9) - (b.mi ?? 9e9)); }
};
/* An event as a calendar entry (take 78): a plain .ics handed to the share
   sheet, so the phone’s own calendar app takes it -- no calendar plugin, no
   permission, works offline. The source gives a date, not a time, so it is
   an all-day entry with the store’s address as the place and the fee, seats
   and registration link in the notes. */
function icsFor(e) {
  const esc2 = v => String(v || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const d = e.d.replace(/-/g, ''); const next = new Date(Date.parse(e.d + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const st = e.store || {};                                  /* take 97: a release has no store -- no LOCATION, no store suffix */
  const where = [st.name, st.addr, st.city, st.state, st.zip].filter(Boolean).join(', ');
  const notes = [e.notes != null ? e.notes : `${e.fee > 0 ? 'Fee ' + money(e.fee) : 'Free'}${e.cap ? ' · ' + e.cap + ' seats' : ''}`, e.url ? (e.urlLabel || 'Register') + ': ' + e.url : '', 'From OP TCG Hub'].filter(Boolean).join('\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OP TCG Hub//Hunt//EN', 'BEGIN:VEVENT', `UID:optcghub-event-${e.id || d + '-' + (st.zip || '')}@optcghub`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next}`, `SUMMARY:${esc2(e.title.replace(/^\[[^\]]*\]\s*/, ''))}${st.name ? ' — ' + esc2(st.name) : ''}`, where ? `LOCATION:${esc2(where)}` : null, `DESCRIPTION:${esc2(notes)}`,
    e.url ? `URL:${e.url}` : null, 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n') + '\r\n';
}
/* take 97 (A38 item 5): a release as an all-day calendar event, and the
   reminder the day before it. */
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
  /* the notification for one reminder, at 09:00 local the day before; take 115: a restore arms what it puts back */
  arm(a) { if (!a || a.fired || !/^\d{4}-\d\d-\d\d$/.test(a.pub || '')) return;   // a day that does not read schedules nothing (dayBefore would throw)
    const at = new Date(this.dayBefore(a.pub) + 'T09:00:00'); if (at.getTime() > Date.now()) PLATFORM.notifyAt(this.nid(a.id), `${a.name} releases tomorrow`, `${dayText(a.pub)} \u2014 from OP TCG Hub`, at); },   /* take 115: the day in words (the .ics keeps ISO) */
  dayBefore(pub) { return new Date(Date.parse(pub + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10); },
  /* on: a notification at 09:00 local the day before (scheduled; INFERRED plugin
     API) and the on-open check below; off: the schedule cancelled, the entry gone */
  toggle(id, name, pub) {
    if (this.has(id)) { this.list = this.list.filter(a => a.id !== id); this.save(); PLATFORM.cancelNotify(this.nid(id)); return false; }
    const a = { id, name, pub, created: new Date().toISOString(), fired: null }; this.list.push(a); this.save(); this.arm(a);
    return true;
  },
  /* once, on or after the day before: the app opened and the day has come */
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
/* the countdown’s colour by nearness: a week, a month, three months, further or past */
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
    /* take 87: the list was real -- every store runs about one event a week --
       so it is grouped by STORE: each store once, nearest first, its next events
       under it, its phone and distance beside it. The default is two weeks. */
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
  const picFor = s => setPic(s);                       // take 93: shared with the set browse and Home
  /* take 94: what the distributor says about a set -- its products matched to
     the set, or a set code in the name -- and the products it lists that no
     set in the catalogue matches: announced to stores, not on TCGplayer yet */
  /* take 112: both distributors. A set's row carries one line from each -- for the set's own product (its
     code, a booster first); every product keeps its own line under its row on Sealed */
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
  /* take 86: the row is two lines -- picture, a wrapping title with its meta, the date
     and countdown at the right; then a Details link that never leaves the box.
     Take 97: the countdown carries its band; an upcoming row carries Remind me
     and Calendar beside Details. */
  const cdown = pub => `<span class="note ${relBand(days(pub))}">${pub >= today ? (days(pub) === 0 ? 'today' : `in ${days(pub)} day${days(pub) === 1 ? '' : 's'}`) : `${-days(pub)} days ago`}</span>`;
  const btn = (attrs, text, aria) => `<button class="ghost" ${attrs} style="display:inline-block;padding:6px 12px;font-size:var(--fs-sm)" aria-label="${esc(aria)}">${text}</button>`;
  const foot = (s, label, extra = '') => `<div style="display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;padding:0 0 8px">${extra}${s.pub >= today ? btn(`data-relalert="${esc(s.id)}" data-relname="${esc(label)}" data-relpub="${esc(s.pub)}" aria-pressed="${RELALERTS.has(s.id)}"`, RELALERTS.has(s.id) ? 'Reminder set ' + tick() : 'Remind me', (RELALERTS.has(s.id) ? 'Remove the reminder for ' : 'Remind me the day before ') + label) + btn(`data-relcal="${esc(s.id)}" data-relname="${esc(label)}"`, 'Calendar', 'Add the release of ' + label + ' to your calendar') : ''}<a class="ghost" href="${esc(detailsUrl({ name: label }))}" target="_blank" rel="noopener" style="padding:6px 12px;font-size:var(--fs-sm)" aria-label="Full details for ${esc(label)} on TCGplayer">Details ${ext()}</a></div>`;
  const line = s => `<div class="rel"><button class="row" style="width:100%;text-align:left;padding:0;gap:10px;min-width:0" data-browse-set="${esc(s.id)}">${picFor(s)}<div class="nm" style="min-width:0"><b style="white-space:normal">${esc(s.name)}</b><span>${esc(s.abbr || '')} \u00b7 ${setCards(s, today)}</span>${onePer(s, forSet(s)).map(it => `<span style="display:block;color:var(--brass)">${distShort(it)}</span>`).join('')}</div><div class="v" style="flex:0 0 auto"><b>${esc(dayText(s.pub))}</b>${cdown(s.pub)}</div></button>
${foot(s, s.name)}</div>`;
  /* take 97 (A38 item 1): a run of two or more starter decks on one day is ONE
     row -- the range, the count, the date -- with a fold to the decks; a single
     starter deck stays a row; a booster set is the release and is never folded.
     Take 124: a starter deck by its code, ST and a number (the catalogue takes it from the cards' own numbers), the
     words as the fallback -- TCGCSV renamed every one on 29 Sept, "Starter Deck 31: RED Monkey.D.Luffy" to "ST-31:
     Starter Deck 31 RED Monkey.D.Luffy", and the six rows came back (landmine 231) */
  const isDeck = s => /^ST-?\d/i.test(s.abbr || '') || /\bStarter Deck\b/i.test(s.name || '');
  const grouped = list => { const out = []; for (let i = 0; i < list.length; i++) { const s = list[i]; if (!isDeck(s)) { out.push(s); continue; }
      const run = [s]; while (i + 1 < list.length && isDeck(list[i + 1]) && list[i + 1].pub === s.pub) run.push(list[++i]);
      out.push(run.length > 1 ? { group: true, pub: s.pub, sets: run, id: s.id, name: `Starter decks ${run[0].abbr || ''}\u2013${run[run.length - 1].abbr || ''}` } : s); } return out; };
  const gline = g => `<div class="rel"><button class="row" style="width:100%;text-align:left;padding:0;gap:10px;min-width:0" data-browse-set="${esc(g.id)}" data-browse-q="Starter Deck">${picFor(g.sets[0])}<div class="nm" style="min-width:0"><b style="white-space:normal">${esc(g.name)}</b><span>${g.sets.length} starter decks, one release day</span>${onePer(null, g.sets.flatMap(s => forSet(s))).map(it => `<span style="display:block;color:var(--brass)">${distShort(it)}</span>`).join('')}</div><div class="v" style="flex:0 0 auto"><b>${esc(dayText(g.pub))}</b>${cdown(g.pub)}</div></button>${foot(g, g.name, `<button class="ghost" data-relfold="${esc(g.pub)}" aria-expanded="${RELF.open.has(g.pub)}" style="display:inline-block;padding:6px 12px;font-size:var(--fs-sm)">${RELF.open.has(g.pub) ? 'Hide the decks ' + chev(true, 14) : `Show the ${g.sets.length} decks ${chev(false, 14)}`}</button>`)}${RELF.open.has(g.pub) ? `<div style="padding-left:12px;border-left:2px solid var(--line)">${g.sets.map(line).join('')}</div>` : ''}</div>`;
  const render = list => grouped(list).map(x => x.group ? gline(x) : line(x)).join('');
  /* the distributor’s unlisted starter-deck displays fold the same way, by release day */
  const isDeckItem = it => (it.codes || []).some(c => /^ST\d+$/.test(c)) && /STARTER DECK/i.test(it.name || '');
  const ditem = it => `<div class="row"><div class="nm" style="min-width:0"><b style="white-space:normal">${esc(it.name)}</b><span>${esc((it.codes || []).join(', '))}</span>${distLine(it)}</div></div>`;
  const dgroup = (rel, items) => { const key = 'd:' + items[0]._d + ':' + rel; const codes = items.map(it => (it.codes || [])[0]).filter(Boolean); const same = items.every(it => distWords(it).join() === distWords(items[0]).join());
    return `<div class="row" style="flex-wrap:wrap"><div class="nm" style="min-width:0;flex:1"><b style="white-space:normal">Starter decks ${esc(codes[0] || '')}\u2013${esc(codes[codes.length - 1] || '')}</b><span>${items.length} starter deck displays, one release day \u00b7 ${esc(codes.join(', '))}</span>${same ? distLine(items[0]) : `<span style="display:block;color:var(--brass)">${esc(HUNT.distName(items[0]._d))} \u00b7 mixed \u00b7 release ${esc(nbsp(dayText(rel)))}</span>`}</div>
      <button class="ghost" data-relfold="${esc(key)}" aria-expanded="${RELF.open.has(key)}" style="flex:0 0 auto;padding:6px 12px;font-size:var(--fs-sm)">${RELF.open.has(key) ? 'Hide ' + chev(true, 14) : `Show ${items.length} ${chev(false, 14)}`}</button>${RELF.open.has(key) ? `<div style="flex-basis:100%;padding-left:12px;border-left:2px solid var(--line)">${items.map(ditem).join('')}</div>` : ''}</div>`; };
  const drender = list => { const out = []; for (let i = 0; i < list.length; i++) { const it = list[i]; if (!isDeckItem(it)) { out.push(ditem(it)); continue; }
      const run = [it]; while (i + 1 < list.length && isDeckItem(list[i + 1]) && list[i + 1].release === it.release && list[i + 1]._d === it._d) run.push(list[++i]);
      out.push(run.length > 1 ? dgroup(it.release || '?', run) : ditem(it)); } return out.join(''); };
  const dDead = dSrc.filter(([, D]) => HUNT.unreached(D)).map(([k, D]) => sourceLead(HUNT.distName(k), D) + (D.ok ? '.' : ''));   /* take 115: a kept copy too (SPEC-112-54) */
  /* take 112, the owner's word: the list sits under a closed "Distributor info" that says how long it is */
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
$('#sealedQ').addEventListener('input', e => { SEALED.q = e.target.value; paintSealed(); });

