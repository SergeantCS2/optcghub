/* ---- collection -------------------------------------------------------- */
let colQuery = '', favOnly = false, bulk = null;

/* =====================================================================
 * FILTER & SORT — take 11
 *
 * One model, two scopes: 'own' (the collection) and 'all' (the catalogue).
 * Each scope persists its own state, because "show me my SRs over $20" and
 * "browse OP-06 alternate arts" are different questions asked in different
 * moods. Every facet is a multi-select; empty means "any". The sheet counts
 * live, so the Show button says how many rows will come back BEFORE it is
 * pressed -- a filter that returns nothing should say so on the sheet, not
 * on an empty screen.
 * ===================================================================== */
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
/* Take 90 (A36, landmine 126): a set id is an int everywhere the catalogue
   keys it, but a filter saved by the chip handler before this take carries
   the DOM’s string, and one saved by the browse-set rows carries the int.
   Normalise on load so the two writers meet one comparison. A parse that
   fails loads blank: a filter is a preference, never the collection. */
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

/* Apply. `rows` are {p, i?} -- i is null in catalogue scope. */
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
      case 'delta':  r = Math.abs(B.d1a || 0) * ((bi && bi.qty) || 1) - Math.abs(A.d1a || 0) * ((ai && ai.qty) || 1); break;
      case 'paid':   r = (((B.market || 0) - ((bi && bi.paid) || 0)) * ((bi && bi.qty) || 1)) -
                         (((A.market || 0) - ((ai && ai.paid) || 0)) * ((ai && ai.qty) || 1)); break;
      default:       r = (B.market || 0) * ((bi && bi.qty) || 1) - (A.market || 0) * ((ai && ai.qty) || 1);
    }
    /* Every key computes its NATURAL order above (value high->low, name A->Z,
       rarity L->C, delta big->small). dir<0 keeps it; dir>0 reverses. The
       take-11 first cut multiplied by dir and special-cased three keys, and
       the default 'value' came out ascending -- smoke caught it. */
    return d < 0 ? r : -r;
  });
}

