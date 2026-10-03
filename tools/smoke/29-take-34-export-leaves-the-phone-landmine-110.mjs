/* smoke section 29: take 34 — export leaves the phone (landmine 110); restore can pick a file
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 34 — export leaves the phone (landmine 110); restore can pick a file');
const calls = { write: null, share: null, clicked: 0 };
ctx.window.Capacitor = { Plugins: {
  Filesystem: { writeFile: async o => { calls.write = o; return { uri: 'file:///cache/export/' + o.path.split('/').pop() }; } },
  Share: { share: async o => { calls.share = o; return { activityType: 'x' }; } } } };
V.OWN.items = []; V.OWN.add(V.candidates('EB03-024', null)[0].id, { condition: 'NM' });
await V.exportCsv();
ok('on a device the CSV is written to the app cache, utf8', calls.write && calls.write.directory === 'CACHE' && calls.write.encoding === 'utf8' && /product_id/.test(calls.write.data), JSON.stringify(calls.write && Object.keys(calls.write)));
ok('...and handed to the share sheet as a file:// uri (Share 8 definitions: files[])', calls.share && Array.isArray(calls.share.files) && /^file:\/\//.test(calls.share.files[0]), JSON.stringify(calls.share));
ok('the CSV carries the row that was added', calls.write && calls.write.data.split('\n').length === 2);
ok('a cancelled share sheet is not an error and not a download', /cancel/i.test('Share canceled') && /if \(shared === 'cancelled'\) return;/.test(js));
delete ctx.window.Capacitor;
const anchorClicks = []; const _ce = ctx.document.createElement;
const _cou = ctx.URL.createObjectURL, _rou = ctx.URL.revokeObjectURL;
ctx.URL.createObjectURL = () => 'blob:smoke'; ctx.URL.revokeObjectURL = () => {};
ctx.document.createElement = tag => { const el = _ce(tag); if (tag === 'a') el.click = () => anchorClicks.push(el.download); return el; };
await V.exportCsv();
ok('negative control: in a browser (no plugins) the download link is used instead', anchorClicks.length === 1 && /^optcghub-\d{4}-\d{2}-\d{2}\.csv$/.test(anchorClicks[0]), JSON.stringify(anchorClicks));
ctx.document.createElement = _ce; ctx.URL.createObjectURL = _cou; ctx.URL.revokeObjectURL = _rou;
ok('restore falls back to a file picker when the install has no backup of its own', /raw = await PLATFORM\.pickTextFile\('\.json/.test(js) && /inp\.type = 'file'; inp\.accept = accept;/.test(js));
ok('the settings copy no longer promises the backup survives a reinstall by itself', !/It survives uninstalling the app/.test(js) && /Export CSV and keep the file/.test(js));
V.OWN.items = [];
}
}
