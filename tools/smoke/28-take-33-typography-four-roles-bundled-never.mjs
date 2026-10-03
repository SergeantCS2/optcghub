/* smoke section 28: take 33 — typography: four roles, bundled, never fetched
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { faces } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 33 — typography: four roles, bundled, never fetched');
const faces = html.match(/@font-face\{[^}]*\}/g) || [];
ok('four @font-face rules in the built page', faces.length === 4, String(faces.length));
ok('every face is a local file under fonts/', faces.every(f => /src:url\(fonts\/\w+\.\w+\)/.test(f) && !/https?:/.test(f)), faces.join(' '));
ok('the roles, not the faces, are the family names', ['Display', 'Comic', 'Body', 'Heavy'].every(r => html.includes(`"OPH ${r}"`)));
ok('the files the rules point at exist in www/fonts',
   faces.every(f => fs.existsSync(W(f.match(/url\((fonts\/[^)]+)\)/)[1]))));
ok('the manifest records which file served each role', manifest.fonts && Object.keys(manifest.fonts).length === 4, JSON.stringify(manifest.fonts));
ok('no Georgia/serif stack survives (--serif retired)', !html.includes('--serif'));
/* A25 -- the cellular guard on the QUIET sync, with its controls */
const P = V.scan.PLATFORM;
delete ctx.navigator.connection;
ok('no Network Information API: the quiet sync proceeds (type unknown)', P.quietSyncAllowed() === true);
ctx.navigator.connection = { type: 'wifi' };
ok('on wifi: the quiet sync proceeds', P.quietSyncAllowed() === true);
ctx.navigator.connection = { type: 'cellular' };
ok('on cellular: the quiet sync is held (negative control -- the guard fires)', P.quietSyncAllowed() === false);
store['vault.syncCellular'] = '1';
ok('...unless the collector switched mobile-data sync on', P.quietSyncAllowed() === true);
delete store['vault.syncCellular']; delete ctx.navigator.connection;
ok('boot gates only the QUIET sync on it; Sync now never asks',
   /navigator\.onLine && CAT\.man\.updateUrl && PLATFORM\.quietSyncAllowed\(\)/.test(js) && /await PLATFORM\.refreshCatalogue\(\); sy\.disabled = false/.test(js));
ok('the switch is in the Sync panel and persists', /id="syncCell"/.test(js) && /vault\.syncCellular/.test(js));
/* negative control for the local-file assertion: a CDN face would fail it */
ok('negative control: a fonts.googleapis.com src would be caught',
   !(/src:url\(fonts\/\w+\.\w+\)/.test('src:url(https://fonts.googleapis.com/x.woff2)')) && /https?:/.test('src:url(https://fonts.googleapis.com/x.woff2)'));
}
}
