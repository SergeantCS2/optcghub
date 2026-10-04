/* smoke section 90: take 130 — Walmart, from its item pages (A32): the feed carries what the page said and when, the app draws it under the product, never a number the page did not state
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 130 — Walmart, from its item pages (A32): the feed carries what the page said and when, the app draws it under the product, never a number the page did not state');
{
  /* the feed under test is built from the SAVED real pages (the item page, the search page), never a live fetch */
  const d130 = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-hunt-130-')), f130 = path.join(d130, 'feed-fixture.json');
  execSync(`python3 tools/hunt.py --from-fixtures --out ${f130}`, { cwd: ROOT, stdio: 'pipe' });
  const F = JSON.parse(fs.readFileSync(f130, 'utf8')); fs.rmSync(d130, { recursive: true, force: true });
  const W = F.sources.walmart;
  ok('the fixture feed carries a Walmart source: ok, a fetch time, the committed list, a cursor, one item read off the saved real page', !!W && W.ok && !!W.fetched_at && Array.isArray(W.items) && W.items.length >= 20 && W.read === 1 && typeof W.cursor === 'number', W && JSON.stringify({ ok: W.ok, items: (W.items || []).length, read: W.read }));
  const read = (W.items || []).find(i => i.online), unread = (W.items || []).find(i => !i.online);
  ok('the read item carries the page\'s price with its text, the status, the seller named, and the time it was read', !!read && read.online.price === 26.98 && read.online.price_text === '$26.98' && read.online.status === 'IN_STOCK' && !!read.online.seller && read.online.checked_at === W.fetched_at, read && JSON.stringify(read.online));
  ok('every item carries its own page URL on walmart.com with no referral or tracking parameter, and the items the run did not read carry no answer at all', (W.items || []).every(i => /^https:\/\/www\.walmart\.com\/ip\//.test(i.url) && !/[?&](aff|tag|ref|utm|irgwc|cid|wmlspartner)/i.test(i.url)) && !!unread && !('online' in unread));
  ok('the read item is keyed to a catalogue product by the feed\'s matcher, with its score on the item', !!read && !!read.catalog_id && typeof read.match_score === 'number' && V.CAT.byId.get(+read.catalog_id), read && `${read.catalog_id} ${read.match_score}`);
  ok('the app never fetches Walmart: no walmart.com literal in the shipped app -- the URLs ride in the feed', !/walmart\.com/.test(js));
  const feed0 = V.HUNT.feed; V.HUNT.feed = F; V.HUNT.setZip('48329'); V.MODE.set('hunt', false); V.SEALED.kind = 'all'; V.SEALED.q = '';
  /* the app's side, guarded so that a build without it fails these checks by name instead of stopping the run (the control) */
  const wmBy = () => (typeof V.HUNT.wmByCatalogId === 'function' ? V.HUNT.wmByCatalogId() : {}), wline = it => (typeof V.walmartLine === 'function' ? V.walmartLine(it) : '');
  try {
    const p = V.CAT.byId.get(+read.catalog_id); for (const id of Object.keys(wmBy())) { const q = V.CAT.byId.get(+id); if (q) { V.SEALED.closed.delete(q.set); V.SEALED.open.add(q.set); } }
    ok('HUNT.wmByCatalogId keys the matched items by catalogue product, and listedIds counts them (D24 (b): what a source names is listed)', Object.keys(wmBy()).includes(String(read.catalog_id)) && V.HUNT.listedIds().has(+read.catalog_id));
    V.paintSealed(); const h = ctx.document.querySelector('#sealedList').innerHTML;
    /* take 137 (landmine 249): the age in the four forms HUNT.ageLabel writes -- the pattern allowed "2 d ago", a form the
       app never writes, and the check went red on the clock alone two days after the saved page was read (2 Oct, 05:02 UTC) */
    const wmPat = new RegExp(`Walmart \\$26\\.98 · ships · sold by ${read.online.seller.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} · (just now|\\d+ min ago|\\d+ h ago|\\d+ days ago)`);
    ok('the product\'s row carries a Walmart line: the price, "ships", the seller, and the age of the read', wmPat.test(h), (h.match(/Walmart \$[^<]{0,90}/) || h.match(/Walmart [^<]{0,90}/) || [''])[0]);
    const RealDate = ctx.Date, t0 = RealDate.parse(read.online.checked_at);
    const aged = [1, 45, 30 * 60, 3 * 1440, 400 * 1440].map(min => { const now = t0 + min * 6e4;
      ctx.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } };
      try { return wline(read).replace(/<[^>]+>/g, ''); } finally { ctx.Date = RealDate; } });
    ok('...whatever day the run falls on: the line a minute, 45 minutes, 30 hours, 3 days and 400 days after the read matches it (it went red two days after the fixture was saved)', aged.length === 5 && aged.every(a => wmPat.test(a)), JSON.stringify(aged));
    ok('control: the line with its age cut off does not', !wmPat.test(`Walmart $26.98 · ships · sold by ${read.online.seller}`));
    ok('an item the run has not read says so under its product, never a stale number dressed as now', /online stock not checked yet/.test(wline({ id: '1', title: 't', url: 'https://www.walmart.com/ip/1' })));
    ok('a page that stated no price is "no price stated", never $0', /no price stated · ships/.test(wline({ id: '1', title: 't', url: 'https://www.walmart.com/ip/1', online: { price: null, price_text: '', status: 'IN_STOCK', seller: 'X', checked_at: W.fetched_at } })) && !/\$0/.test(wline({ id: '1', title: 't', url: 'https://www.walmart.com/ip/1', online: { price: null, status: 'IN_STOCK', checked_at: W.fetched_at } })));
    ok('a status other than in stock is said in words', /out of stock online/.test(wline({ id: '1', title: 't', url: 'https://www.walmart.com/ip/1', online: { price: 9.5, status: 'OUT_OF_STOCK', checked_at: W.fetched_at } })));
    const chips = V.buySources(p); const wm = chips.find(c => c.label === 'Walmart');
    ok('Where to buy carries a Walmart chip: the item\'s own page, the price, the status and the seller in its note, TCGplayer still first', !!wm && wm.url === read.url && /\$26\.98 · ships · sold by/.test(wm.note) && chips[0].label === 'TCGplayer', wm && wm.note);
    const srcs = V.STOCK.sourcesFor(p.id); const ws = srcs.find(x => x.key === 'walmart:online:' + read.id);
    ok('a stock alert on the product watches Walmart online, available when the page said in stock, dated by the read', !!ws && ws.available === true && ws.at === read.online.checked_at && ws.label === 'Walmart online');
    ok('Diagnostics\' feed line names Walmart with its items and how many carry an answer', /walmart \d+ items, 1 with an answer/.test(V.feedLine()), V.feedLine());
    const dead = JSON.parse(JSON.stringify(F)); dead.sources.walmart = { ...dead.sources.walmart, ok: true, kept: true, error: 'HTTP 418', stale_since: '2026-10-01T00:00:00Z' };
    V.HUNT.feed = dead;
    ok('a kept Walmart source (this run refused) says so in the feed line with since when', /walmart \d+ items, 1 with an answer \(kept; not reached since/.test(V.feedLine()), V.feedLine());
    const gone = JSON.parse(JSON.stringify(F)); gone.sources.walmart = { ok: false, error: 'HTTP 418', fetched_at: F.fetched_at, items: [] }; V.HUNT.feed = gone;
    ok('a failed Walmart source with nothing kept: no lines under products, no chip, no alert source, the feed line says not ok', Object.keys(wmBy()).length === 0 && !V.buySources(p).find(c => c.label === 'Walmart') && !V.STOCK.sourcesFor(p.id).find(x => /^walmart:/.test(x.key)) && /walmart not ok/.test(V.feedLine()));
    delete gone.sources.walmart; V.HUNT.feed = gone;
    ok('a feed from before take 130 (no walmart key at all) paints every screen as it did: the line says absent, nothing throws', (() => { try { V.paintSealed(); return /walmart absent/.test(V.feedLine()) && Object.keys(wmBy()).length === 0; } catch (e) { return false; } })());
  } finally { V.HUNT.feed = feed0; V.go('home'); }
}
}
