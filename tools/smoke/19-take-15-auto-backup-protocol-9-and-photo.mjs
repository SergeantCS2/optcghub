/* smoke section 19: take 15 — auto-backup (PROTOCOL §9) and photo storage (landmine 79)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 15 — auto-backup (PROTOCOL §9) and photo storage (landmine 79)');
const bj = JSON.parse(V.backupJson());
ok('the backup carries items, decks, credits, snapshots and filters',
   Array.isArray(bj.items) && Array.isArray(bj.decks) && bj.credits && Array.isArray(bj.snaps) && bj.filters);
ok('the backup names the app, the take and the catalogue date', bj.app === 'OP TCG Hub' && bj.take === V.TAKE && 'catalogue' in bj);
ok('photos are NOT in the backup — derived, rescannable',
   bj.items.every(i => i.photo === null || i.photo === '(on device)'));
ok('the catalogue is NOT in the backup — disposable', !('catalogue_rows' in bj) && JSON.stringify(bj).length < 200000);
ok('a batch commit schedules a backup', /scheduleBackup\('batch'\)/.test(js));
ok('a deck save schedules a backup', /scheduleBackup\('deck'\)/.test(js));
ok('backup failure is SHOWN, never swallowed', /Backup failed/.test(js));
ok('the backup goes to public Documents, which survives uninstall',
   /directory: 'DOCUMENTS'/.test(js) && /backup-latest\.json/.test(js));
ok('scan photos go to disk, not localStorage (landmine 79)',
   /savePhoto\(/.test(js) && /directory: 'DATA'/.test(js) && /convertFileSrc/.test(js));
ok('restore is a REPLACE and says so', /This replaces what is on the phone now/.test(js));
}
}
