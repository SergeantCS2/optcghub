/* smoke section 51: take 94 — the distributor: GTS Distribution in the feed, under the rows, on Releases, as an alert source
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { G } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 94 — the distributor: GTS Distribution in the feed, under the rows, on Releases, as an alert source');
/* the feed under test is built from the SAVED real listing page (tools/fixtures/gts_listing.html), never a live fetch */
const fxDir94 = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-gts-')); const feed94 = path.join(fxDir94, 'feed-fixture.json');
execSync(`python3 tools/hunt.py --from-fixtures --out ${feed94}`, { cwd: ROOT, stdio: 'pipe' });
const F94 = JSON.parse(fs.readFileSync(feed94, 'utf8')); const G = F94.sources.gts;
ok('the feed carries the distributor source: ok, a fetch time, the count the site said and the saved page\'s eleven products', !!G && G.ok && !!G.fetched_at && G.count === 49 && Array.isArray(G.items) && G.items.length === 11, JSON.stringify(G && { ok: G.ok, count: G.count, n: (G.items || []).length }));
const ST94 = ['sold_out', 'call', 'in_stock', 'preorder', 'coming', 'out', 'unknown'];
ok('every item: sku, name, a URL on the distributor, a named state, allocation as a boolean, an ISO release date or none',
   G.items.every(i => i.sku && i.name && /^https:\/\/www\.gtsdistribution\.com\//.test(i.url) && ST94.includes(i.status) && typeof i.allocated === 'boolean' && (i.release === null || /^\d{4}-\d\d-\d\d$/.test(i.release))));
const by = Object.fromEntries(G.items.map(i => [i.sku, i]));
/* take 114 (the review): a day on screen is pinned from the fixture's own date as the app writes it -- a literal "Jun 12"
   stops matching on the first of January, when dayText adds the year */
const D94 = iso => V.dayText(iso).replace(/[ \u202f]/g, '\u00a0');
ok('the states read as measured: OP-19 sold out and allocated, PEB-01 coming (orders due 2026-10-14), a sleeve assortment in stock, a figure on call, a released sleeve display out',
   by.BJP2884797.status === 'sold_out' && by.BJP2884797.allocated === true && by.BJP2897699.status === 'coming' && by.BJP2897699.preorder === '2026-10-14' && by.BJP9056341.status === 'in_stock' && by.BJPBAS69321.status === 'call' && by.BJP2835333.status === 'out');
ok('control: the ST44 display is sold out but NOT allocated -- the flag is read off the page, never inferred from sold out', by.BJP2904577.status === 'sold_out' && by.BJP2904577.allocated === false);
const nm94 = id => (V.CAT.byId.get(id) || {}).name;
ok('OP-16\'s 24-count booster matches The Time of Battle Booster Box -- not the Box Case (landmine 134)', nm94(by.BJP2850164.catalog_id) === 'The Time of Battle Booster Box', String(nm94(by.BJP2850164.catalog_id)));
ok('ST-36\'s 6-count display matches the Display; DP-11 matches Vol. 11 Display; IB-07 matches Illustration Box Vol. 7',
   /^Starter Deck 36.*Display$/.test(nm94(by.BJP2855988.catalog_id) || '') && nm94(by.BJP2850166.catalog_id) === 'Double Pack Set Vol. 11 Display' && nm94(by.BJP2864562.catalog_id) === 'One Piece Card Game Illustration Box Vol. 7',
   [nm94(by.BJP2855988.catalog_id), nm94(by.BJP2850166.catalog_id), nm94(by.BJP2864562.catalog_id)].join(' | '));
ok('controls: OP-19, PEB-01 and ST44 have no set in the catalogue and match nothing -- a wrong match is worse than none', by.BJP2884797.catalog_id === null && by.BJP2897699.catalog_id === null && by.BJP2904577.catalog_id === null);
ok('the app never fetches the distributor: no distributor host in the shipped app, and the history rows carry each SKU\'s state', !/gtsdistribution\.com/.test(js) && (() => { const h = JSON.parse(fs.readFileSync(path.join(fxDir94, 'history-fixture.json'), 'utf8')); return h.runs[0].gts && h.runs[0].gts.BJP2884797 === 'sold_out'; })());
ok('Diagnostics names the distributor beside the feed', /line\('feed on phone', feedLine\(\)\)/.test(js) && (() => { const k = V.HUNT.feed; V.HUNT.feed = F94; try { return typeof V.feedLine === 'function' && new RegExp(`, gts ${G.items.length} products`).test(V.feedLine()); } finally { V.HUNT.feed = k; } })());   // take 115: printed from HUNT.DISTS (STAN-112-21)
/* on screen: the panel, the row line, the dead-source text */
V.HUNT.feed = F94; V.HUNT.setZip(''); V.MODE.set('hunt', false); V.SEALED.kind = 'all'; V.SEALED.q = '';   // a known state: earlier sections leave a kind chip or a search behind
for (const id of Object.keys(V.HUNT.distByCatalogId())) { const p = V.CAT.byId.get(+id); if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } }
V.paintSealed(); const h94 = ctx.document.querySelector('#sealedList').innerHTML;
/* take 112: Sealed lists priced products; Southern Hobby's DP-13 matched the Vol. 13 Display, which has no market price yet */
ok('the matched products\' rows are on screen (their sets opened) -- every one Sealed lists, a priced product', Object.keys(V.HUNT.distByCatalogId()).filter(id => V.SEALED.isProduct(V.CAT.byId.get(+id))).every(id => new RegExp('data-open="' + id + '"').test(h94)), `${Object.keys(V.HUNT.distByCatalogId()).length} matched, kind ${V.SEALED.kind}, q "${V.SEALED.q}"`);
/* take 112, the owner's word ("I don't want them flooding the screen"): the distributors' panels sit under one closed
   Distributor info; a row carries one short line per distributor, which opens its page at Distributor info */
ok('the Sealed screen carries one closed Distributor info that says what it holds, and none of the panels\' text until it opens',
   /data-distfold="sealed" aria-expanded="false"/.test(h94) && /<span class="ttl">Distributor info<\/span><span class="note">2 distributors · checked (just now|\d+ min ago)<\/span>/.test(h94) && !/One Piece products at the distributor/.test(h94),
   (h94.match(/Distributor info[\s\S]{0,160}/) || ['no Distributor info on Sealed'])[0]);
V.distFoldTap('sealed'); const h94o = ctx.document.querySelector('#sealedList').innerHTML; V.distFoldTap('sealed');
/* take 114 (the review): the two unreleased counts are dates, counted here over every item, sold out or not -- unreleased is a
   release after the UTC day GTS was read (gts.status_of's day), and "ahead" an order due date on or after it (the due day kept open) */
const read94 = G.fetched_at.slice(0, 10), un94 = G.items.filter(i => i.release && i.release > read94), ahead94 = un94.filter(i => i.preorder && i.preorder >= read94).length;
const due94 = (a, w) => `${a} with an order due date ahead, ${w} unreleased without one`, n94 = s => G.items.filter(i => i.status === s).length;
ok('...opened, it carries GTS Distribution with the counts and what a distributor is, and a second tap closes it -- of the unreleased products, how many have an order due date ahead and how many do not, by their dates',
   /data-distfold="sealed" aria-expanded="true"/.test(h94o) && /<b>GTS Distribution<\/b>/.test(h94o) && h94o.includes(`11 One Piece products at the distributor: <b>7</b> sold out, <b>8</b> allocated, ${due94(ahead94, un94.length - ahead94)}, 1 in stock for stores`) && /A distributor sells to stores, not to you/.test(h94o)
   && /data-distfold="sealed" aria-expanded="false"/.test(ctx.document.querySelector('#sealedList').innerHTML), `${due94(ahead94, un94.length - ahead94)} :: ${(h94o.match(/One Piece products at the distributor:[^.]*/) || ['no GTS counts'])[0]}`);
ok('...control: counted by state (take 114 as first built: coming, then preorder), the same words say something else on this feed -- a sold-out product that is unreleased and past its due date was in neither count',
   due94(n94('coming'), n94('preorder')) !== due94(ahead94, un94.length - ahead94), `${due94(n94('coming'), n94('preorder'))} | ${due94(ahead94, un94.length - ahead94)}`);
ok('a matched row carries one short line per distributor under its chips -- its name and its state -- which opens its page at Distributor info',
   new RegExp('data-open="' + by.BJP2850164.catalog_id + '" data-distinfo="1" aria-label="GTS Distribution · sold out: open [^"]+ at Distributor info"><span>GTS Distribution · sold out</span>').test(h94),
   (h94.match(/<button class="dline"[^>]*>[^<]*<span>[^<]*/) || ['no distributor line in #sealedList'])[0]);
const pg94 = V.CAT.byId.get(by.BJP2850164.catalog_id); V.openDetail(pg94.id, { dist: true }); const d94 = ctx.document.querySelector('#dDist').innerHTML;
ok('...and there, open, the distributor\'s full words: sold out, allocated, MSRP named as MSRP with the case configuration, the release date, the age, and its own page',
   /data-distfold="detail" aria-expanded="true"/.test(d94) && new RegExp(`GTS Distribution</b><span>sold out · allocated · MSRP \\$119\\.76 \\(12 cards / 24 packs / 12 displays\\) · release ${D94(by.BJP2850164.release)} · (just now|\\d+ min ago)</span>`).test(d94) && /href="https:\/\/www\.gtsdistribution\.com\/[^"]+" target="_blank" rel="noopener"/.test(d94),
   d94.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300));
while (V.closeAnyOverlay()) {} V.go('sealed');
ok('an order due date says when stores must order by, under Releases\' Distributor info (no catalogue product to hang it on)', (() => { V.DISTF.open.add('releases'); V.paintReleases(); const r = new RegExp(`PREMIUM EXTRA BOOSTER \\(PEB01\\)[\\s\\S]*?GTS Distribution · stores order by ${D94(by.BJP2897699.preorder)} · allocated · MSRP`).test(ctx.document.querySelector('#relList').innerHTML); V.DISTF.open.delete('releases'); return r; })());
const dead94 = JSON.parse(JSON.stringify(F94)); dead94.sources.gts = { ok: false, error: 'HTTP 403', fetched_at: F94.fetched_at, stale_since: F94.fetched_at, items: [] };
V.HUNT.feed = dead94; V.DISTF.open.add('sealed'); V.DISTF.open.add('releases'); V.paintSealed(); V.paintReleases();
ok('a failed distributor fetch says it could not reach GTS Distribution and since when, under Distributor info on Sealed and on Releases, never an empty list', /Could not reach GTS Distribution since/.test(ctx.document.querySelector('#sealedList').innerHTML) && /Could not reach GTS Distribution since/.test(ctx.document.querySelector('#relList').innerHTML));
V.DISTF.open.clear(); V.paintSealed(); V.paintReleases();
ok('...and closed, the Distributor info line says one was not reached', /1 not reached/.test(ctx.document.querySelector('#sealedList').innerHTML) && /1 not reached/.test(ctx.document.querySelector('#relList').innerHTML));
V.HUNT.feed = F94; V.DISTF.open.add('releases'); V.paintReleases(); const rel94 = ctx.document.querySelector('#relList').innerHTML; V.DISTF.open.delete('releases');
/* take 112: two distributors in the panel -- GTS's three rows keep their order among Southern Hobby's */
const panel94 = rel94.slice(rel94.indexOf('At the distributors'), rel94.indexOf('<h3>Recent</h3>'));
const gtsRows94 = [...panel94.matchAll(/<b style="white-space:normal">[^<]*<\/b><span>([^<]*)<\/span><span style="display:block;color:var\(--brass\)">GTS Distribution/g)].map(m => m[1]);
ok('Releases lists what the distributors have that the catalogue lacks, by release date, with the codes: GTS\'s OP-19 first, then PEB-01 and ST44',
   /data-distfold="releases" aria-expanded="true"/.test(rel94) && /At the distributors, not in the catalogue yet<\/div>/.test(rel94) && /BOOSTER \(OP-19\)[\s\S]*?<span>OP19<\/span>/.test(panel94) && gtsRows94.join() === 'OP19,PEB01,ST44', gtsRows94.join() || (rel94.match(/At the distributor[\s\S]{0,700}/) || ['no distributor panel in #relList'])[0].replace(/\s+/g, ' '));
ok('the OP18 row (in the catalogue, releasing 2026-11-20) carries the distributor\'s short line: its name and its state', /<span>OP18 · [^<]*<\/span><span style="display:block;color:var\(--brass\)">GTS Distribution · sold out<\/span>/.test(rel94));
ok('control: a set the distributor does not list (OP17) carries no distributor line', /<span>OP17 · [^<]*<\/span><\/div>/.test(rel94) && !/<span>OP17 · [^<]*<\/span><span[^>]*>GTS/.test(rel94));
/* the alert source */
const watched94 = V.CAT.byId.get(by.BJP2850164.catalog_id);
V.STOCK.list = []; V.STOCK.toggle(watched94.id);
const s94 = V.STOCK.sourcesFor(watched94.id); const gsrc = s94.find(x => /^gts:/.test(x.key));
ok('a watched product has the distributor as a source, keyed by SKU, not available while sold out, with the fetch time and the product link', !!gsrc && gsrc.key === 'gts:BJP2850164' && gsrc.available === false && gsrc.at === G.fetched_at && /gtsdistribution\.com/.test(gsrc.url), JSON.stringify(gsrc));
await V.STOCK.check();
by.BJP2850164.status = 'in_stock'; const f1 = await V.STOCK.check(); const f2 = await V.STOCK.check();
by.BJP2850164.status = 'preorder'; const f3 = await V.STOCK.check();
by.BJP2850164.status = 'sold_out'; await V.STOCK.check(); by.BJP2850164.status = 'preorder'; const f4 = await V.STOCK.check();
by.BJP2850164.status = 'in_stock'; const f5 = await V.STOCK.check();
ok('the alert fires once when the distributor flips to in stock for stores, not again while it stays, and again after it went out and came back -- stock only (the owner\'s answer, take 114): its order due date passing (the preorder state) never fires it', f1 === 1 && f2 === 0 && f3 === 0 && f4 === 0 && f5 === 1, `${f1} ${f2} ${f3} ${f4} ${f5}`);
{ const own = V.STOCK.sourcesFor; V.STOCK.sourcesFor = function (id) { return own.call(this, id).map(x => /^gts:/.test(x.key) ? { ...x, available: x.available || by.BJP2850164.status === 'preorder' } : x); };   // take 113's rule, put back for one sequence
  by.BJP2850164.status = 'sold_out'; await V.STOCK.check(); by.BJP2850164.status = 'preorder'; const g4 = await V.STOCK.check(); V.STOCK.sourcesFor = own;
  ok('...negative control: under take 113\'s rule (stock or the preorder state) the same due date passing fires it', g4 === 1, String(g4)); }
by.BJP2850164.status = 'sold_out'; V.STOCK.toggle(watched94.id); V.STOCK.list = [];
V.HUNT.feed = null; V.MODE.set('collect', false);
}
}
