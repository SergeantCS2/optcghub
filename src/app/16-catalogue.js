/* ---- catalogue --------------------------------------------------------- */
const CAT = { rows: [], byId: new Map(), byNum: new Map(), sets: new Map(),
              ng: {}, ngs: {}, man: {}, effects: {}, proof: {}, expectedFetches: 2, ready: false };

const TREAT = {
  base: 'Base', alternate_art: 'Alternate Art', sp: 'SP', parallel: 'Parallel',
  manga: 'Manga', full_art: 'Full Art', textured_foil: 'Textured Foil',
  pirate_foil: 'Pirate Foil', jolly_roger: 'Jolly Roger Foil',
  wanted_poster: 'Wanted Poster', box_topper: 'Box Topper', reprint: 'Reprint'
};

/* The live catalogue is whichever is NEWER: the copy Sync wrote to disk, or
   the one the APK shipped with. Take 27 -- before this the app only ever read
   its bundled copy, so "prices move day over day" was true only across app
   updates. Offline-first holds: disk and bundle are both local. */
async function readLocalCatalogue() {
  const FS = PLATFORM.plugin('Filesystem'); if (!FS) return null;
  let m;
  try { m = JSON.parse((await FS.readFile({ path: 'catalogue/manifest.json', directory: 'DATA', encoding: 'utf8' })).data); } catch (e) { return null; }   // no synced copy: the usual first run
  if (kindOf(m) !== 'object') return null;
  try { return { cat: JSON.parse((await FS.readFile({ path: 'catalogue/catalog.json', directory: 'DATA', encoding: 'utf8' })).data), man: m }; }
  catch (e) { return { cat: null, man: m, why: 'the file does not read (' + String(e.message || e).slice(0, 60) + ')' }; }
}
/* take 115: the shape this build reads is the shape it shipped with. Pages
   serves the newest take's catalogue; a phone runs whichever take it has (the
   Play build is whatever was last uploaded). A synced catalogue is checked
   against the bundled one before Sync writes it and again before it is used:
   every list the loader walks is a list, every column and every list or
   record the bundle has keeps its kind, every row is as long as the columns.
   Before this a catalogue of another shape was written unchecked and threw in
   the loader on every launch -- "Catalogue failed to load", with no way left
   to Export or Restore. Additions (a newer take's new column) are fine. */
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
/* take 115: every load builds fresh maps and swaps them in whole. The maps
   used to be filled in place and never cleared, so each sync -- the quiet one
   runs 1.5 s after most launches -- listed every printing twice under its
   number: 200 of 200 artwork auto-accepts turned into asks (each printing's
   twin ties it at the same distance) and the picker showed each one twice. */
function indexCatalogue(cat) {
  const sets = new Map(), byId = new Map(), byNum = new Map();
  cat.sets.forEach(s => sets.set(s.id, s));
  const C = cat.cols;
  const rows = cat.rows.map(r => { const o = {}; C.forEach((k, i) => o[k] = r[i]); return o; });
  for (const p of rows) {
    byId.set(p.id, p);
    /* Sealed product (A7, take 15) has no card number: searchable, addable by
       hand, never a scan candidate. An empty key in byNum would make every
       no-read resolve to "all 658 boxes". */
    if (!p.num) continue;
    if (!byNum.has(p.num)) byNum.set(p.num, []);
    byNum.get(p.num).push(p);
  }
  return { ng: cat.ng, ngs: cat.ngs, valid: new Set(cat.valid_numbers || []), star: cat.star || null, effects: cat.effects || {}, proof: cat.proof || {},
    lend: cat.lend || {},   // take 126: the Sim's table only -- which printing's picture a card with none of its own is drawn with
    /* A29: stock decks ride in the bundle. They are DECKS, never cards owned --
       nothing here ever touches OWN, the portfolio, the export or the binder. */
    zips3: cat.zips3 || null,
    stock: (cat.stock || []).map(d => ({ id: d.id, name: d.name, set: d.set, stock: true,
      leader: d.leader, cards: d.cards.map(c => ({ id: c.id, n: c.n })) })),          // A23 step (2): scripted effects, parsed from the text at build time
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
    } catch (e) {   /* take 115: the bundled catalogue instead, and Diagnostics says why */
      refused = `the copy synced for ${String(local.man.source_updated_at).slice(0, 10)} was set aside: ${String(e.message || e).slice(0, 120)}`;
      ERRS.push('catalogue', refused, 'loadCatalogue');
    }
  }
  if (!next) next = indexCatalogue(cat);
  Object.assign(CAT, next, { man, shape, refused, ready: true });
}

