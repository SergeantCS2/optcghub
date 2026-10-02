/* smoke section 74: take 125 — a backup this install can write: the file an uninstalled install left is not its own (landmine 239)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 125 — a backup this install can write: the file an uninstalled install left is not its own (landmine 239)');
await (async () => {
  /* the phone after the sideload-to-Play switch: the old install's files are still in Documents/OPTCGHub, and Android
     refuses this install a write -- or a read -- of them, with the message the Filesystem plugin passes on */
  const disk = {}, notOurs = new Set(['OPTCGHub/backup-latest.json', 'OPTCGHub/backup-before-restore.json']);
  const denied = () => { throw new Error('open failed: EACCES (Permission denied)'); };
  const fsx = { writeFile: async ({ path: p, data }) => { if (notOurs.has(p)) denied(); disk[p] = data; return { uri: 'file:///storage/emulated/0/Documents/' + p }; },
                readFile: async ({ path: p }) => { if (notOurs.has(p)) denied(); if (!(p in disk)) throw new Error('File does not exist.'); return { data: disk[p] }; } };
  const cap0 = ctx.window.Capacitor, names0 = store['vault.docNames'], last0 = V.OWN.lastBackup, errs0 = V.ERRS.list.slice(), errsKey0 = store['vault.errs'];
  ctx.window.Capacitor = { Plugins: { Filesystem: fsx } }; delete store['vault.docNames'];
  let where = '', threw = '';
  try { where = await V.PLATFORM.backup('{"app":"OP TCG Hub","items":[],"n":1}'); } catch (e) { threw = String(e.message || e); }
  const own = Object.keys(disk).find(p => /^OPTCGHub\/backup-latest-\d{8}-\d{6}\.json$/.test(p));
  ok('a backup-latest.json another install left cannot be written over, so the backup goes to a name this install makes -- and says which',
     !threw && !!own && where === 'Documents/' + own, JSON.stringify({ where, threw, files: Object.keys(disk) }));
  ok('...with the dated copy beside it', Object.keys(disk).some(p => /^OPTCGHub\/backup-\d{4}-\d{2}-\d{2}\.json$/.test(p)), JSON.stringify(Object.keys(disk)));
  await V.PLATFORM.backup('{"app":"OP TCG Hub","items":[],"n":2}');
  ok('...the next backup writes that same name, not a new one', Object.keys(disk).filter(p => /backup-latest-/.test(p)).length === 1 && JSON.parse(disk[own]).n === 2);
  ok('...and Restore reads this install\'s latest, never the file the other install left', JSON.parse((await V.PLATFORM.readBackup()) || '{}').n === 2);
  ok('...the reason is kept for Diagnostics, in Android\'s words', V.ERRS.list.some(e => e.kind === 'backup' && /backup-latest\.json could not be written \(open failed: EACCES/.test(e.msg)), JSON.stringify(V.ERRS.list.slice(0, 2)));
  ok('the copy kept before a restore goes the same way', (await V.PLATFORM.keepAside('{"k":1}')) === 'Documents/OPTCGHub' && Object.keys(disk).some(p => /^OPTCGHub\/backup-before-restore-\d{8}-\d{6}\.json$/.test(p)));
  /* control: a phone whose backup-latest.json is its own is written as before, under the plain name */
  const disk2 = {}; ctx.window.Capacitor = { Plugins: { Filesystem: { writeFile: async ({ path: p, data }) => { disk2[p] = data; return { uri: 'x' }; } } } }; delete store['vault.docNames'];
  const w2 = await V.PLATFORM.backup('{"n":3}');
  ok('...control: an install that owns backup-latest.json writes it, under its own name, as before', w2 === 'Documents/OPTCGHub' && 'OPTCGHub/backup-latest.json' in disk2 && !Object.keys(disk2).some(p => /latest-\d/.test(p)), JSON.stringify(Object.keys(disk2)));
  /* a folder nothing can be written to: the backup fails, and says why for both names */
  ctx.window.Capacitor = { Plugins: { Filesystem: { writeFile: async () => { throw new Error('open failed: ENOSPC (No space left on device)'); } } } }; delete store['vault.docNames'];
  let why = ''; try { await V.PLATFORM.backup('{}'); } catch (e) { why = String(e.message || e); }
  ok('when no name can be written the backup fails, and its reason names both tries', /backup-latest\.json: open failed: ENOSPC/.test(why) && /backup-latest-\d{8}-\d{6}\.json: open failed: ENOSPC/.test(why), why);
  /* the collection's own path: the failure and its reason reach the last-backup line and the self-test */
  if (!V.backupHeld()) {
    V.scheduleBackup('smoke'); await new Promise(r => setTimeout(r, 480));
    const lb = V.OWN.lastBackup, st = Object.fromEntries((await V.SELFTEST.run()).checks.map(c => [c.name, c]))['Backups are being written'];
    ok('a failed backup keeps its reason, and the self-test FAILs with it (take 121 said only "Failed")', !!lb && lb.failed === true && /ENOSPC/.test(lb.why || '') && st && st.s === 'FAIL' && /ENOSPC/.test(st.note), JSON.stringify({ lb, st }));
    ctx.window.Capacitor = { Plugins: { Filesystem: fsx } }; delete store['vault.docNames'];
    V.scheduleBackup('smoke'); await new Promise(r => setTimeout(r, 480));
    const ok2 = Object.fromEntries((await V.SELFTEST.run()).checks.map(c => [c.name, c]))['Backups are being written'];
    ok('...control: on the phone after the switch the backup is written, and the self-test PASSes naming the file', !V.OWN.lastBackup.failed && ok2 && ok2.s === 'PASS' && /backup-latest-\d{8}-\d{6}\.json/.test(ok2.note), JSON.stringify(ok2));
  } else ok('precondition: no backup hold stands in the main app here', false, 'held');
  if (names0 === undefined) delete store['vault.docNames']; else store['vault.docNames'] = names0;
  V.OWN.lastBackup = last0; if (cap0 === undefined) delete ctx.window.Capacitor; else ctx.window.Capacitor = cap0;
  V.ERRS.list = errs0; if (errsKey0 === undefined) delete store['vault.errs']; else store['vault.errs'] = errsKey0;   // no trace
})();
}
