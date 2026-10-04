/* smoke section 94: take 137 — A43's last two small items: Restore reaches an earlier day's backup; a cost basis and a
   Hunt note's price typed in the currency on screen. Each check below that is not a control fails on take 136's build
   (SMOKE_APP), watched. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, ok, section } = harness;
  section('take 137 — Restore reaches an earlier day\'s backup when there is one; a cost basis and a Hunt note\'s price typed in the currency on screen, kept in US dollars');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const RealDate = ctx.Date;
  const tapIn = (L, sel, ds = {}, id = '') => { const b = { dataset: ds, id }; const ev = { target: { closest: s => (s === sel ? b : null), id }, stopPropagation() {}, preventDefault() {} };
    for (const f of [...(L.click || [])]) { try { const r = f(ev); if (r && r.catch) r.catch(() => {}); } catch (e) {} } };
  const html = id => (doc.getElementById(id) || {})._html || '';
  const field = value => ({ value, focus() {}, select() {} });   /* ask focuses its field 60 ms on: a fake without focus threw in that timer */
  const askWith = async (value, start) => { doc._ids.set('askIn', field(value)); const run = start(); await sleep(0); doc.getElementById('askOk')._ev.click(); return run; };
  const cards = V.CAT.rows.filter(p => p.num && !p.sealed && p.market > 1);
  const keep = { items: V.OWN.items, snaps: V.OWN.snaps, cur: V.CUR.code, notes: V.LOCAL.notes, conf: ctx.confirm, cap: ctx.Capacitor, last: V.OWN.lastBackup,
    decks: V.DECKS.list, wants: V.WANT.list, alerts: V.ALERTS.list, stock: V.STOCK.list, rel: V.RELALERTS.list, give: V.TRADE.give, get: V.TRADE.get,
    rows: V.BATCH.rows, setId: V.BATCH.setId, pfs: V.PF.list.slice(), active: V.PF.active };
  await sleep(450);
  try {
    /* 1. Restore and the dated copies, on a phone's Filesystem (a stub, the plugin's definitions' shape) */
    const iso = n => new Date(Date.now() + n * 864e5).toISOString();
    const latestAt = iso(0), D = [1, 2, 3, 4, 7].map(n => V.localDay(iso(-n)));   // four earlier days and a week-old one, the phone's days as the copies are named
    const base = JSON.parse(V.backupJson());
    const latest = JSON.stringify({ ...base, at: latestAt, items: [{ id: cards[0].id, qty: 1, condition: 'NM', pf: 'main', game: 'optcg' }] });
    const older = JSON.stringify({ ...base, at: D[1] + 'T15:00:00.000Z', items: [cards[0], cards[1], cards[2]].map(p => ({ id: p.id, qty: 2, condition: 'NM', pf: 'main', game: 'optcg' })) });
    const files = { 'backup-latest.json': latest, [`backup-${V.localDay(latestAt)}.json`]: latest, [`backup-${D[1]}.json`]: older };
    const writes = [];
    const FS = { readdir: async () => ({ files: [...Object.keys(files), ...D.filter(d => d !== D[1]).map(d => `backup-${d}.json`), 'backup-before-restore.json', 'notes.txt'].map(name => ({ name, type: 'file' })) }),
      readFile: async ({ path }) => { const n = path.replace(/^OPTCGHub\//, ''); if (files[n] != null) return { data: files[n] }; throw new Error('File does not exist'); },
      writeFile: async o => { writes.push(o.path); return { uri: 'file:///' + o.path }; } };
    ctx.Capacitor = { Plugins: { Filesystem: FS } };
    delete store['vault.beforeRestore'];
    const asked = []; ctx.confirm = m => { asked.push(String(m)); return true; };
    const days = typeof V.PLATFORM.backupDays === 'function' ? await V.PLATFORM.backupDays() : null;   /* absent before take 137: each check below fails by its own name */
    ok('this install\'s dated copies are read off the folder, newest first, nothing else in it counted', Array.isArray(days) && days.length === 6 && days[0] === V.localDay(latestAt) && days.every((d, i) => i === 0 || d < days[i - 1]), JSON.stringify(days));
    const run = V.restoreFromBackup(); await sleep(5);
    const opts = html('pkOpts'), sheet = !!V.PICKER.settle;
    ok('with an earlier day than the latest\'s, Restore asks where from -- the latest, then the three newest earlier days, then Choose a file (it went straight to the latest, the earlier days out of reach)',
       sheet && /The latest backup/.test(opts) && D.slice(0, 3).every(d => opts.includes(`data-rsrc="day:${d}"`)) && !opts.includes(`day:${D[3]}`) && !opts.includes(`day:${V.localDay(latestAt)}`) && /data-rsrc="file"/.test(opts) && !/data-rsrc="kept"/.test(opts)
         && opts.indexOf('data-rsrc="latest"') < opts.indexOf(`day:${D[0]}`) && opts.indexOf(`day:${D[0]}`) < opts.indexOf(`day:${D[1]}`),
       JSON.stringify({ sheet, asked: asked.length, opts: opts.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300) }));
    ok('...each earlier day named in words', opts.includes(`The backup of ${V.dayText(D[0])}`), V.dayText(D[0]));
    tapIn(listeners, '[data-rsrc]', { rsrc: 'day:' + D[1] }); await run; await sleep(0);
    ok('...and an earlier day chosen is read from its own file and restored: its three lines, its day in the question',
       asked.length === 1 && asked[0].includes(V.momentText(D[1] + 'T15:00:00.000Z')) && V.OWN.items.length === 3 && V.OWN.items.every(i => i.qty === 2), JSON.stringify({ asked, n: V.OWN.items.length }));
    await sleep(450);
    /* a day whose file cannot be read says so and restores nothing */
    delete store['vault.beforeRestore']; asked.length = 0;
    const n0 = V.OWN.items.length, run2 = V.restoreFromBackup(); await sleep(5);
    tapIn(listeners, '[data-rsrc]', { rsrc: 'day:' + D[0] }); await run2; await sleep(0);
    ok('...a day whose file cannot be read restores nothing and says how to reach it', asked.length === 0 && V.OWN.items.length === n0 && /could not be read/.test(doc.getElementById('toast')._text || ''), doc.getElementById('toast')._text);
    /* control: nothing earlier, nothing kept -- straight to the latest, as take 115 ruled */
    FS.readdir = async () => ({ files: [{ name: 'backup-latest.json' }, { name: `backup-${V.localDay(latestAt)}.json` }] });
    delete store['vault.beforeRestore']; asked.length = 0;
    const run3 = V.restoreFromBackup(); await sleep(5); const sheet3 = !!V.PICKER.settle; if (sheet3) V.PICKER.dismiss(); await run3; await sleep(0);
    ok('control: with nothing earlier and nothing kept Restore goes straight to the latest -- no sheet, one question', !sheet3 && asked.length === 1 && V.OWN.items.length === 1, JSON.stringify({ sheet3, asked: asked.length, n: V.OWN.items.length }));
    await sleep(450); delete store['vault.beforeRestore']; ctx.Capacitor = keep.cap;

    /* 2. the cost basis in the currency on screen */
    const p = cards[3]; V.OWN.items = [{ id: p.id, qty: 1, condition: 'NM', pf: 'main', game: 'optcg', added: new Date().toISOString(), fav: false }]; V.OWN.save();
    V.CUR.set('EUR'); const rate = V.CUR.rate('EUR');
    V.openDetail(p.id);
    await askWith('20', () => doc.getElementById('dPaid')._ev.click()); await sleep(0);
    const why = html('askWhy'), line = () => V.OWN.items.find(i => i.id === p.id);
    ok('in euros, "What you paid" names the currency it reads and says it is kept in US dollars (it asked for USD whatever was on screen)', /in € EUR, converted \(≈\); it is kept in US dollars/.test(why), why);
    ok('...a cost basis typed as 20 in euros is kept in US dollars and reads back as ≈€20.00 (it was kept as $20 and read ≈€' + (20 * rate).toFixed(2) + ')',
       !!rate && Math.abs(line().paid - 20 / rate) < 1e-9 && V.money(line().paid) === '≈€20.00', JSON.stringify({ paid: line().paid, shown: V.money(line().paid) }));
    await sleep(450); V.openDetail(p.id);
    await askWith('11,36', () => doc.getElementById('dPaid')._ev.click()); await sleep(0);
    ok('...and "11,36" is eleven euros thirty-six, not 1136 (every character but digits and the point was dropped)', V.money(line().paid) === '≈€11.36', V.money(line().paid));
    V.CUR.set('USD'); await sleep(450); V.openDetail(p.id);
    await askWith('12.50', () => doc.getElementById('dPaid')._ev.click()); await sleep(0);
    ok('control: in US dollars it reads as before -- "in USD", 12.50 kept as 12.50', /Per copy, in USD\./.test(html('askWhy')) && line().paid === 12.5, JSON.stringify({ why: html('askWhy').slice(0, 40), paid: line().paid }));
    await sleep(450); V.openDetail(p.id);
    await askWith('0', () => doc.getElementById('dPaid')._ev.click()); await sleep(0);
    ok('control: 0 still clears a cost basis', line().paid === 0, String(line().paid));
    await sleep(450);

    /* 3. a Hunt note's price, the same */
    V.CUR.set('EUR'); V.LOCAL.notes = [];
    const note = typeof V.addLocalNote === 'function' ? V.addLocalNote('Take 137 Games') : null;
    if (note) { for (const v of ['3 OP-11 boxes', '20', '']) { doc._ids.set('askIn', field(v)); await sleep(0); doc.getElementById('askOk')._ev.click(); await sleep(0); } await note; }
    const n1 = V.LOCAL.notes[0];
    ok('in euros a Hunt note\'s price typed as 20 is kept in US dollars and shows ≈€20.00 on the note (it was kept as $20)', !!n1 && !!rate && Math.abs(n1.price - 20 / rate) < 1e-9 && V.money(n1.price) === '≈€20.00', JSON.stringify(n1 || null));
    V.CUR.set('USD');

    /* 4. the phone's day, on a US evening: the dated copy, Restore's days and a Hunt note's day were each the UTC date,
       tomorrow's there from 8 PM (take 115's fired day, the same mistake) */
    const tz0 = process.env.TZ; process.env.TZ = 'America/New_York';
    try {
      const late = new RealDate(); late.setHours(23, 30, 0, 0); const noon = new RealDate(); noon.setHours(12, 0, 0, 0);
      const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const at = t => { ctx.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [t.getTime()])); } static now() { return t.getTime(); } }; };
      const today = ymd(late), yday = ymd(new RealDate(late.getTime() - 864e5));
      ok('precondition: 23:30 on a US evening is already tomorrow in UTC', late.toISOString().slice(0, 10) !== today, late.toISOString());
      const named = [];
      ctx.Capacitor = { Plugins: { Filesystem: { writeFile: async o => { named.push(o.path); return { uri: 'file:///' + o.path }; } } } };
      at(late); await V.PLATFORM.backup('{}'); at(noon); await V.PLATFORM.backup('{}'); ctx.Date = RealDate;
      const dated = named.filter(n => /backup-\d{4}-\d\d-\d\d\.json$/.test(n));
      ok('a backup on a US evening writes its dated copy under the phone\'s day, the day Restore shows (it was tomorrow\'s)', dated[0] === `OPTCGHub/backup-${today}.json`, JSON.stringify(dated));
      ok('control: one at noon is named the same day either way', dated[1] === `OPTCGHub/backup-${ymd(noon)}.json` && ymd(noon) === noon.toISOString().slice(0, 10), JSON.stringify(dated));
      const lateLatest = JSON.stringify({ ...JSON.parse(V.backupJson()), at: late.toISOString() });
      ctx.Capacitor = { Plugins: { Filesystem: {
        readdir: async () => ({ files: ['backup-latest.json', `backup-${today}.json`, `backup-${yday}.json`].map(name => ({ name, type: 'file' })) }),
        readFile: async ({ path }) => { if (/backup-latest\.json$/.test(path)) return { data: lateLatest }; throw new Error('File does not exist'); },
        writeFile: async o => ({ uri: 'file:///' + o.path }) } } };
      delete store['vault.beforeRestore'];
      const run4 = V.restoreFromBackup(); await sleep(5); const opts4 = html('pkOpts'), sheet4 = !!V.PICKER.settle; if (sheet4) V.PICKER.dismiss(); await run4;
      ok('...and Restore, with the latest written at 23:30, offers yesterday but not the latest\'s own day (it listed "The backup of" today under the latest of today)',
         sheet4 && opts4.includes(`day:${yday}`) && !opts4.includes(`day:${today}`), JSON.stringify({ sheet4, today, yday, opts: opts4.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 220) }));
      ctx.Capacitor = keep.cap;
      at(late); V.LOCAL.notes = [];
      const note2 = typeof V.addLocalNote === 'function' ? V.addLocalNote('Take 137 Evening') : null;
      if (note2) { for (const v of ['2 packs', '', '']) { doc._ids.set('askIn', field(v)); await sleep(0); doc.getElementById('askOk')._ev.click(); await sleep(0); } await note2; }
      ctx.Date = RealDate;
      ok('a Hunt note written on a US evening carries the phone\'s day (it carried tomorrow\'s)', (V.LOCAL.notes[0] || {}).when === today, JSON.stringify({ when: (V.LOCAL.notes[0] || {}).when, today }));
    } finally { ctx.Date = RealDate; if (tz0 === undefined) delete process.env.TZ; else process.env.TZ = tz0; }
  } finally {
    ctx.Date = RealDate; doc._ids.delete('askIn'); ctx.confirm = keep.conf; ctx.Capacitor = keep.cap; V.CUR.set(keep.cur || 'USD');
    V.OWN.items = keep.items; V.OWN.snaps = keep.snaps; V.OWN.save(); V.LOCAL.notes = keep.notes; V.LOCAL.saveNotes();
    V.DECKS.list = keep.decks; V.WANT.list = keep.wants; V.ALERTS.list = keep.alerts; V.STOCK.list = keep.stock; V.RELALERTS.list = keep.rel; V.TRADE.give = keep.give; V.TRADE.get = keep.get;
    V.DECKS.save(); V.WANT.save(); V.ALERTS.save(); V.STOCK.save(); V.RELALERTS.save(); V.TRADE.save();
    V.PF.list = keep.pfs; V.PF.active = keep.active; V.PF.save(); V.BATCH.rows = keep.rows; V.BATCH.setId = keep.setId; V.BATCH.save();
    delete store['vault.beforeRestore']; await sleep(450); V.OWN.lastBackup = keep.last;
  }
}
