/* smoke section 93: take 136 — four of A43's small items: the waiting scans in the backup, a new or renamed collection
   backed up at once, CSV import's one write
   Each check below fails on take 135's build (SMOKE_APP), watched; the gate's two checks of this take are the gate's. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, ok, section } = harness;
  section('take 136 — four of A43\'s small items: the waiting scans in the backup and back from a restore, a new or renamed collection backed up at once, CSV import\'s one write');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const tapIn = (L, sel, ds = {}, id = '') => { const b = { dataset: ds, id }; const ev = { target: { closest: s => (s === sel ? b : null), id }, stopPropagation() {}, preventDefault() {} };
    for (const f of [...(L.click || [])]) { try { const r = f(ev); if (r && r.catch) r.catch(() => {}); } catch (e) {} } };
  const importText = async text => { const ce0 = doc.createElement; let inp = null;
    doc.createElement = t => { const e = ce0(t); if (t === 'input') inp = e; return e; };
    try { tapIn(listeners, '[data-act]', { act: 'import' }); } finally { doc.createElement = ce0; }
    if (!inp || !inp._ev || !inp._ev.change) return false;
    inp.files = [{ text: async () => text }]; await inp._ev.change(); await sleep(0); return true; };
  const cards = V.CAT.rows.filter(p => p.num && !p.sealed);
  const [A, B, C] = cards.slice(0, 3).map(p => p.id);
  const keep = { items: V.OWN.items, snaps: V.OWN.snaps, pfs: V.PF.list.slice(), active: V.PF.active, rows: V.BATCH.rows, setId: V.BATCH.setId,
    decks: V.DECKS.list, wants: V.WANT.list, alerts: V.ALERTS.list, stock: V.STOCK.list, rel: V.RELALERTS.list, notes: V.LOCAL.notes,
    give: V.TRADE.give, get: V.TRADE.get, conf: ctx.confirm, last: V.OWN.lastBackup };
  await sleep(450);   // a backup an earlier section scheduled has run
  try {
    /* 1. CSV import writes the collection once (A43: once per row before) */
    V.OWN.items = []; V.OWN.snaps = []; V.PF.active = 'main'; V.OWN.save();
    const N = 300, ids = cards.slice(0, N).map(p => p.id);
    const set0 = ctx.localStorage.setItem; let writes = 0;
    ctx.localStorage.setItem = (k, v) => { if (k === 'vault.items') writes++; return set0(k, v); };
    let ran = false;
    try { ran = await importText('product_id,qty,condition\n' + ids.map(id => `${id},1,NM`).join('\n')); } finally { ctx.localStorage.setItem = set0; }
    const stored = JSON.parse(store['vault.items'] || '[]');
    ok(`a CSV import of ${N} rows writes the collection once, after the loop (it wrote it once a row: ${N + 1} times)`, ran && writes === 1, `ran ${ran}, ${writes} writes`);
    ok('...and every row is in the collection, in memory and stored', V.OWN.items.length === N && stored.length === N, `${V.OWN.items.length} / ${stored.length}`);
    await sleep(450);
    V.OWN.items = keep.items; V.OWN.snaps = keep.snaps; V.OWN.save();

    /* 2. the backup carries the waiting scans, photos as a line's are */
    const photo = 'data:image/jpeg;base64,AAAA';
    V.BATCH.rows = [{ id: A, photo }, { id: B, photo: null }]; V.BATCH.setId = cards[0].set;
    const bj = JSON.parse(V.backupJson()), bjKept = JSON.parse(V.backupJson(true));
    ok('the backup carries the waiting scans: their cards, the set being scanned, a photo as "(on device)" (the batch was in no backup)',
       !!bj.batch && Array.isArray(bj.batch.rows) && bj.batch.rows.length === 2 && bj.batch.rows[0].id === A && bj.batch.rows[0].photo === '(on device)' && bj.batch.rows[1].photo === null && bj.batch.setId === cards[0].set, JSON.stringify(bj.batch || null));
    ok('...and the copy kept aside before a restore keeps the photo itself, as a line\'s', !!bjKept.batch && bjKept.batch.rows[0].photo === photo, JSON.stringify(bjKept.batch && bjKept.batch.rows[0]));

    /* 3. a change to the batch backs up after a pause in scanning, not at once */
    delete store['vault.backup']; V.OWN.lastBackup = null;
    V.BATCH.save();
    await sleep(450);
    const early = store['vault.backup'] || null;
    await sleep(5000);
    const late = store['vault.backup'] ? JSON.parse(store['vault.backup']) : null;
    ok('a change to the waiting scans backs up after five quiet seconds: nothing at once, then a backup that carries them, for the scan',
       early === null && !!late && !!late.batch && late.batch.rows.length === 2 && V.OWN.lastBackup && V.OWN.lastBackup.reason === 'scan', JSON.stringify({ early: !!early, late: late && late.batch, reason: V.OWN.lastBackup && V.OWN.lastBackup.reason }));

    /* 4. a restore names the waiting scans, keeps a lone batch aside, and brings the backup's back */
    const bk = JSON.parse(V.backupJson());
    bk.batch = { rows: [{ id: B, photo: '(on device)' }, { id: C, photo: null }], setId: cards[1].set };
    store['vault.backup'] = JSON.stringify(bk); delete store['vault.beforeRestore'];
    V.OWN.items = []; V.DECKS.list = []; V.WANT.list = []; V.ALERTS.list = []; V.STOCK.list = []; V.RELALERTS.list = []; V.LOCAL.notes = []; V.TRADE.give = []; V.TRADE.get = [];
    V.BATCH.rows = [{ id: A, photo: null }]; V.BATCH.setId = null;
    const asked = []; ctx.confirm = m => { asked.push(String(m)); return true; };
    await V.restoreFromBackup(); await sleep(0);
    const before = store['vault.beforeRestore'] ? JSON.parse(store['vault.beforeRestore']) : null;
    const d = bk.decks.length;
    ok('Restore\'s question names the waiting scans the backup brings, beside the lines and the decks', asked.length >= 1 && asked[0].includes(`, ${d} deck${d === 1 ? '' : 's'} and 2 waiting scans from`), JSON.stringify(asked[0] || ''));
    ok('...a phone with nothing but a waiting scan keeps it aside before the restore replaces it (nothing was kept: "nothing to keep")',
       !!before && !!before.batch && before.batch.rows.length === 1 && before.batch.rows[0].id === A, JSON.stringify(before && before.batch));
    const sb = JSON.parse(store['vault.batch'] || '{}');
    ok('...and the restore brings the backup\'s waiting scans back, stored, the photo left on the old phone, the set it was scanning',
       V.BATCH.rows.length === 2 && V.BATCH.rows[0].id === B && V.BATCH.rows[0].photo === null && V.BATCH.setId === cards[1].set && Array.isArray(sb.rows) && sb.rows.length === 2, JSON.stringify({ rows: V.BATCH.rows, setId: V.BATCH.setId, stored: sb }));
    ok('a backup whose waiting scans are not a list of cards is refused before anything is replaced',
       /waiting scans are not a list of cards/.test(V.backupProblem({ ...bk, batch: { rows: 'x' } })) && /waiting scans/.test(V.backupProblem({ ...bk, batch: { rows: [{ photo: null }] } })) && V.backupProblem(bk) === '',
       JSON.stringify([V.backupProblem({ ...bk, batch: { rows: 'x' } }), V.backupProblem(bk)]));
    delete store['vault.beforeRestore'];

    /* 5. an unreadable batch holds the backup, as every list the backup carries does */
    const raw0 = store['vault.batch'], un0 = V.STORE.unreadable.slice(), e0 = V.ERRS.list.length;
    store['vault.batch'] = '"not a batch"';
    V.readJson('vault.batch', {});
    const held = V.backupHeld();
    V.STORE.holdBackup = false; V.STORE.unreadable.length = 0; V.STORE.unreadable.push(...un0); delete store['vault.backupHold']; delete store['vault.batch.unreadable'];
    V.ERRS.list.splice(0, V.ERRS.list.length - e0); store['vault.batch'] = raw0;
    ok('an unreadable batch holds the backup, so the next backup cannot write an empty one over the waiting scans on file', held === true, String(held));

    /* 6. a new or renamed collection is backed up at once */
    await sleep(450);
    delete store['vault.backup']; V.OWN.lastBackup = null;
    const id = V.PF.add('Take 136 binder'); await sleep(450);
    const b1 = store['vault.backup'] ? JSON.parse(store['vault.backup']) : null;
    ok('a new collection is backed up at once, with its name (it waited for the next card\'s commit)', !!b1 && b1.portfolios.some(p => p.id === id && p.name === 'Take 136 binder') && V.OWN.lastBackup && V.OWN.lastBackup.reason === 'collections', JSON.stringify(V.OWN.lastBackup));
    delete store['vault.backup'];
    V.PF.rename(id, 'Take 136 trades'); await sleep(450);
    const b2 = store['vault.backup'] ? JSON.parse(store['vault.backup']) : null;
    ok('...and a renamed one, with its new name', !!b2 && b2.portfolios.some(p => p.id === id && p.name === 'Take 136 trades'), JSON.stringify(b2 && b2.portfolios));
  } finally {
    ctx.confirm = keep.conf;
    V.OWN.items = keep.items; V.OWN.snaps = keep.snaps; V.OWN.save();
    V.DECKS.list = keep.decks; V.WANT.list = keep.wants; V.ALERTS.list = keep.alerts; V.STOCK.list = keep.stock; V.RELALERTS.list = keep.rel; V.LOCAL.notes = keep.notes; V.TRADE.give = keep.give; V.TRADE.get = keep.get;
    V.DECKS.save(); V.WANT.save(); V.ALERTS.save(); V.STOCK.save(); V.RELALERTS.save(); V.LOCAL.saveNotes(); V.TRADE.save();
    V.PF.list = keep.pfs; V.PF.active = keep.active; V.PF.save();
    V.BATCH.rows = keep.rows; V.BATCH.setId = keep.setId; V.BATCH.save();
    await sleep(450); V.OWN.lastBackup = keep.last;
  }
}
