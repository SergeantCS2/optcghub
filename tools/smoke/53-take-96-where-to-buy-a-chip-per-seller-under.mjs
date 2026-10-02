/* smoke section 53: take 96 — where to buy: a chip per seller under each sealed row and on its sheet, the seller\'s own page, no logo, no referral
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 96 — where to buy: a chip per seller under each sealed row and on its sheet, the seller\'s own page, no logo, no referral');
const count96 = (h, re) => (h.match(re) || []).length;
const fxDir96 = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-buy-')); const feed96 = path.join(fxDir96, 'feed-fixture.json');
execSync(`python3 tools/hunt.py --from-fixtures --out ${feed96}`, { cwd: ROOT, stdio: 'pipe' });
V.HUNT.feed = JSON.parse(fs.readFileSync(feed96, 'utf8'));
V.LOCAL.shops = JSON.parse(fs.readFileSync(path.join(fxDir96, 'shops-fixture.json'), 'utf8')); V.LOCAL.stores = JSON.parse(fs.readFileSync(path.join(fxDir96, 'stores-fixture.json'), 'utf8')); V.HUNT.setZip('48329');
const shop96 = V.LOCAL.shops.shops[0]; V.LOCAL.stores.stores.push({ name: shop96.name, zip: shop96.zip, addr: '1 Main St', city: 'Waterford', state: 'MI', phone: '2485550100', ll: [42.69, -83.39], exact: true, events: [] });   // the roster knows the shop: a synthetic entry, so the address path is deterministic
const gtsIt96 = V.HUNT.feed.sources.gts.items.find(i => i.catalog_id); const pG = V.CAT.byId.get(gtsIt96.catalog_id);
const srcG = V.buySources(pG);
ok('a sealed product always has TCGplayer first, at its own product page from the catalogue id, with no parameter, the market price and its date as the note', srcG[0].label === 'TCGplayer' && srcG[0].url === 'https://www.tcgplayer.com/product/' + pG.id && !/[?#]/.test(srcG[0].url) && /market · [A-Z][a-z]{2} \d{1,2}(, \d{4})?$/.test(srcG[0].note), JSON.stringify(srcG[0]));   /* take 110: the day in words */
/* take 112, the owner's word: the distributors left the buy list for the page's Distributor info -- they sell to stores */
ok('a product the distributor lists has no distributor among its buy sources', !srcG.some(s => s.kind === 'dist'), JSON.stringify(srcG.map(s => s.label)));
V.openDetail(pG.id); const dd96 = ctx.document.getElementById('dDist') || { hidden: true, innerHTML: '' };   // a page without the panel fails here, it does not throw
ok('...its page carries Distributor info, closed when the page was opened from its row', dd96.hidden === false && /data-distfold="detail" aria-expanded="false"/.test(dd96.innerHTML) && !/gtsdistribution\.com/.test(dd96.innerHTML));
V.distFoldTap('detail');
ok('...and opened, the distributor in its words, at its own page in the browser', /GTS Distribution<\/b><span>sold out · allocated · /.test(dd96.innerHTML) && /href="https:\/\/www\.gtsdistribution\.com\/[^"]+" target="_blank" rel="noopener"/.test(dd96.innerHTML), dd96.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200));
V.distFoldTap('detail'); while (V.closeAnyOverlay()) {}
const shopIt96 = shop96.sealed.find(i => i.catalog_id); const pS = V.CAT.byId.get(shopIt96.catalog_id);
const srcS = V.buySources(pS); const local96 = srcS.find(s => s.kind === 'local');
ok('a product a local shop lists has the shop as a source: its storefront link, price and stock, and the roster\'s street address, phone and distance', !!local96 && local96.label === shop96.name && local96.url === shopIt96.url && /\$/.test(local96.note) && local96.addr === '1 Main St, Waterford' && local96.phone === '2485550100' && typeof local96.mi === 'number', JSON.stringify(local96));
/* the rows */
V.MODE.set('hunt', false); V.SEALED.q = ''; V.SEALED.kind = 'all'; for (const p of [pG, pS]) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } V.paintSealed();
const h96 = ctx.document.getElementById('sealedList').innerHTML;
ok('every sealed row carries a chip strip, and every strip sits after the row\'s buttons, never inside one (a distributor line opens a page too, and is no row)', count96(h96, /data-open="\d+">/g) > 0 && count96(h96, /<div class="chips buy"/g) === count96(h96, /data-open="\d+">/g) && count96(h96, /<\/button><div class="chips buy"/g) === count96(h96, /<div class="chips buy"/g), `${count96(h96, /<div class="chips buy"/g)} strips for ${count96(h96, /data-open="\d+">/g)} rows`);
const strip96 = (h, id) => { const r = h.slice(h.indexOf('data-open="' + id + '"')); const a = r.indexOf('<div class="chips buy"'); return r.slice(a, r.indexOf('</div>', a) + 6); };
const sG = strip96(h96, pG.id), sS = strip96(h96, pS.id);
ok('the distributor-listed product\'s strip: a cart and TCGplayer ↗, to the seller\'s own page in the browser, no image -- and no distributor chip (take 112)', /g-cart/.test(sG) && /TCGplayer <svg[^>]*><use href="#g-external"/.test(sG) && !/g-truck/.test(sG) && !/GTS Distribution/.test(sG) && !/<img/.test(sG) && count96(sG, /target="_blank" rel="noopener"/g) === count96(sG, /<a class="chip buy" href="http/g), sG.slice(0, 200));
ok('...under the strip, the distributor\'s short line, opening the page at Distributor info', h96.slice(h96.indexOf(sG) + sG.length).startsWith(`<div class="dlines"><button class="dline" data-open="${pG.id}" data-distinfo="1"`), h96.slice(h96.indexOf(sG) + sG.length, h96.indexOf(sG) + sG.length + 120));
ok('the shop-listed product\'s strip: a pin and the shop\'s name ↗, and a handset Call chip with a tel: link', /g-pin/.test(sS) && new RegExp(shop96.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' <svg[^>]*><use href="#g-external"').test(sS) && /href="tel:2485550100"/.test(sS) && /g-phone/.test(sS), sS.slice(0, 240));
/* the sheet */
V.openDetail(pS.id); const l96 = ctx.document.getElementById('dBuyList').innerHTML;
ok('the sealed sheet has a Where to buy panel: TCGplayer and the shop with its address, distance, Open ↗ and Call; the note says the browser opens the seller\'s page and no link carries a referral', ctx.document.getElementById('dBuy').hidden === false && /TCGplayer/.test(l96) && new RegExp(shop96.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(l96) && /1 Main St, Waterford/.test(l96) && /~\d+ mi/.test(l96) && /href="tel:2485550100"/.test(l96) && count96(l96, /Open <svg[^>]*><use href="#g-external"/g) >= 2 && /no link carries a referral/.test(html));
const card96 = V.CAT.rows.find(p => !p.sealed && p.market > 0); V.openDetail(card96.id);
ok('control: a card\'s sheet has no Where to buy panel', ctx.document.getElementById('dBuy').hidden === true && ctx.document.getElementById('dBuyList').innerHTML === '');
ok('the four seller glyphs ship in the sprite; the chip and the panel carry their rules (landmine 136)', /id="g-cart"/.test(html) && /id="g-pin"/.test(html) && /id="g-truck"/.test(html) && /id="g-phone"/.test(html) && /\.chip\.buy\{/.test(html) && /\.panel\[hidden\]\{display:none\}/.test(html));
ok('the only seller host the app names as a literal is TCGplayer\'s product page, on the declared host; the rest are data in the feed', /https:\/\/www\.tcgplayer\.com\/product\/' \+ p\.id/.test(js) && !/gtsdistribution\.com|blackvaultgaming\.com|redsky\.target\.com/.test(js));
V.HUNT.feed = null; V.LOCAL.shops = null; V.LOCAL.stores = null; V.HUNT.setZip(''); V.MODE.set('collect', false); V.go('home');
}
}
