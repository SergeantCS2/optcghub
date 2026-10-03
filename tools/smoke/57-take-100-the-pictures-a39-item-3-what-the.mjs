/* smoke section 57: take 100 — the pictures (A39 item 3): what the runner measured ships, nothing is guessed
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 100 — the pictures (A39 item 3): what the runner measured ships, nothing is guessed');
{ const rows100 = V.CAT.rows; const HOSTS = /^https:\/\/(tcgplayer-cdn\.tcgplayer\.com\/product\/\d+_200w\.jpg|product-images\.tcgplayer\.com\/fit-in\/200x279\/\d+\.jpg)$/;
  ok('every printing\'s picture URL is on one of the two declared hosts, in the declared shape', rows100.every(p => !p.img || HOSTS.test(p.img)), String((rows100.find(p => p.img && !HOSTS.test(p.img)) || {}).img));
  ok('...control: a third host, and a malformed id, are refused by the same rule', !HOSTS.test('https://evil.example.com/product/1_200w.jpg') && !HOSTS.test('https://product-images.tcgplayer.com/fit-in/200x279/x.jpg'));
  const side = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/hashes.json'), 'utf8')); const alt = new Set((side.alt || []).map(String)); const byId = new Map(rows100.map(p => [String(p.id), p]));
  ok('every id the sidecar says the second host served ships the second host\'s URL, and every other id keeps the first host\'s', [...alt].every(id => !byId.has(id) || /product-images\.tcgplayer\.com\/fit-in\/200x279\/\d+\.jpg$/.test(byId.get(id).img)) && rows100.every(p => alt.has(String(p.id)) || !p.img || /tcgplayer-cdn\.tcgplayer\.com/.test(p.img)), `${alt.size} in alt`);
  ok('the manifest carries the picture measurement as counts', !!manifest.images && ['missing_cards', 'missing_sealed', 'alt_served', 'exported'].every(k => Number.isInteger(manifest.images[k])) && typeof manifest.images.measured === 'boolean', JSON.stringify(manifest.images));
  ok('a product picture through the second host keeps the take-12 chain: lazy, display-only, removed on failure', (() => { const pic = V.productPic({ ...rows100.find(p => V.SEALED.isProduct(p)), img: 'https://product-images.tcgplayer.com/fit-in/200x279/712901.jpg' }); return /<img class="ref" loading="lazy"/.test(pic) && /this\.remove\(\)/.test(pic) && /product-images\.tcgplayer\.com/.test(pic); })());
  ok('Diagnostics prints the picture line from the manifest', /line\('pictures'/.test(js) && /have no picture at the first host/.test(js));
}
}
