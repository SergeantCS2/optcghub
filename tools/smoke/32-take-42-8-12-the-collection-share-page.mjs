/* smoke section 32: take 42 — 8.12 the collection share page
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 42 — 8.12 the collection share page');
V.OWN.items = []; V.OWN.add(V.candidates('EB03-024', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0))[0].id, { qty: 2, condition: 'NM' });
const page = V.collectionPage();
ok('the page is self-contained: no script, no external request in it', !/<script/i.test(page) && !/https?:\/\//.test(page) && !/<img/i.test(page));
ok('it carries the total, the card, its printing and the disclaimer', /\$/.test(page) && /Nefeltari Vivi/.test(page) && /SP/.test(page) && /Not affiliated with Bandai/.test(page));
ok('set completion is in it, with the fraction', /Set completion/.test(page) && /1 \/ \d+/.test(page));
ok('HTML in a card name would be escaped (esc on every field)', (page.match(/esc\(/g) || []).length === 0 && /function collectionPage[\s\S]*?esc\(p\.name\)/.test(js));
const c2 = { write: null, share: null };
ctx.window.Capacitor = { Plugins: { Filesystem: { writeFile: async o => { c2.write = o; return { uri: 'file:///cache/' + o.path }; } }, Share: { share: async o => { c2.share = o; } } } };
await V.shareCollectionPage();
ok('on a device it goes through the share sheet as a .html file', c2.share && /\.html$/.test(c2.share.files[0]) && c2.write.data.startsWith('<!doctype html>'));
delete ctx.window.Capacitor; V.OWN.items = [];
ok('the More panel offers it beside Export CSV', /data-act="sharepage"/.test(js) && /sharepage: shareCollectionPage/.test(js));
}
}
