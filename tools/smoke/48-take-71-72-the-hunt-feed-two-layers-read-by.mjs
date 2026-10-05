/* smoke section 48: take 71–72 — the Hunt feed: two layers, read by the app, honest about age, zip and coverage
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { F } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 71–72 — the Hunt feed: two layers, read by the app, honest about age, zip and coverage');
/* the feed under test is built from SAVED real responses, never a live fetch */
/* written OUTSIDE www/, so the nightly's Pages deploy (which runs after smoke) can never ship a fixture as real */
const fxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-hunt-')); const feedFile = path.join(fxDir, 'feed-fixture.json');
execSync(`python3 tools/hunt.py --from-fixtures --out ${feedFile}`, { cwd: ROOT, stdio: 'pipe' });
const F = JSON.parse(fs.readFileSync(feedFile, 'utf8')); const T = F.sources.target;
ok('a feed builds from the saved responses with a fetch time, a national item list and a served-zip map', !!F.fetched_at && Array.isArray(T.items) && T.zips && typeof T.zips === 'object' && Array.isArray(F.zips));
ok('every item carries title, price, tcin and a checked flag; online status when checked', T.items.every(i => i.title && i.tcin && typeof i.checked === 'boolean' && (!i.checked || i.online)), String(T.items.length));
ok('a Japanese release is never matched to the English catalogue (take 71 finding)', T.items.filter(i => /japanese/i.test(i.title)).every(i => !i.catalog_id));
ok('a served zip carries its stores, per-store stock and a check time per item; a failed zip carries its reason', T.zips['48329'].ok && T.zips['48329'].stores.length >= 1 && Object.keys(T.zips['48329'].checked_at).length >= 1 && T.zips['48201'].ok === false && /budget|throttle/.test(T.zips['48201'].error));
ok('every checked item carries the time its online status was read, and the feed carries a cursor for the next run', T.items.filter(i => i.checked).every(i => i.online_at) && T.cursor && 'online' in T.cursor);
ok('the app never fetches a retailer: the only stock URL it knows is the feed on Pages', /hunt\/feed\.json/.test(js) && !/redsky\.target\.com/.test(js));
ok('the feed URL is derived from the sync URL, not a second literal', /replace\(\/bundle\\\/\?\$\/, ''\) \+ 'hunt\/feed\.json'/.test(js));
V.HUNT.feed = F; V.MODE.set('hunt', false);
/* the zip: exact, same area, none */
V.HUNT.setZip('48329'); ok('an exactly served zip is matched exactly', V.HUNT.served().how === 'exact' && V.HUNT.served().zip === '48329');
V.HUNT.setZip('48340'); ok('a zip in the same 3-digit area uses that area\'s check and says so', V.HUNT.served().how === 'area' && V.HUNT.served().zip === '48329');
V.HUNT.setZip('90210'); ok('a zip nowhere near a served area is NONE, never silently the nearest', V.HUNT.served().how === 'none');
V.HUNT.setZip('48201'); V.paintSealed();
ok('a served zip whose check did not run says so plainly, naming the limit', /The shelf check near 48201 didn’t finish this hour \(Target’s limit\); it resumes next hour/.test(ctx.document.querySelector('#sealedList').innerHTML));
/* sets are folded since take 81: open every set that carries a matched product so its line is on screen */
for (const id of Object.keys(V.HUNT.byCatalogId())) { const p = V.CAT.byId.get(+id); if (p) V.SEALED.open.add(p.set); }
V.HUNT.setZip('90210'); V.paintSealed(); let h = ctx.document.querySelector('#sealedList').innerHTML;
ok('with no local coverage the national online layer still shows for every product, and the covered areas are named', /<h3>Target<\/h3>/.test(h) && /No shelf check near \d{5} yet\. Covered: [^<]*48329/.test(h) && /ships/.test(h));
V.HUNT.setZip('48329'); V.paintSealed(); h = ctx.document.querySelector('#sealedList').innerHTML;
ok('with a served zip the panel says how many stores and how many products have a shelf check on file', /4 Target stores within 50 mi of \d{5}( \(same area as yours\))? · 2 products checked on their shelves, a few each hour\./.test(h), (h.match(/\d+ Target stores within[^<]*/) || [''])[0]);
ok('a matched product carries a Target line with price, shipping status and shelf state', (() => { const by = V.HUNT.byCatalogId(); const ids = Object.keys(by); return ids.length >= 1 && ids.every(id => new RegExp('data-open="' + id + '"[\\s\\S]*?Target \\$').test(h)); })());
ok('a checked item carries the age of its shelf check', /(on the shelf|not on a shelf within 50 mi of 48329) (just now|\d+ min ago)/.test(h));
ok('an item the local check has not reached says the shelf was not checked yet (never "not on a shelf")', /shelf not checked yet for this item/.test(V.targetLine(T.items.find(i => /japanese/i.test(i.title)), T)));
const oldFeed = JSON.parse(JSON.stringify(F)); oldFeed.sources.target.fetched_at = new Date(Date.now() - 5 * 3600e3).toISOString();
V.HUNT.feed = oldFeed; V.paintSealed();
ok('a feed older than three hours is called out of date on screen (PROTOCOL §10)', /out of date/.test(ctx.document.querySelector('#sealedList').innerHTML));
const dead = JSON.parse(JSON.stringify(F)); dead.sources.target = { ok: false, error: 'HTTP 403', fetched_at: F.fetched_at, stale_since: F.fetched_at, zips: {}, items: [] };
V.HUNT.feed = dead; V.paintSealed();
ok('a failed source says it could not reach Target and since when, never an empty list', /Could not reach Target since/.test(ctx.document.querySelector('#sealedList').innerHTML));
V.HUNT.feed = null; V.paintSealed();
ok('with no feed on the phone it says so and offers a fetch', /Not fetched yet/.test(ctx.document.querySelector('#sealedList').innerHTML) && /id="huntSync"/.test(ctx.document.querySelector('#sealedList').innerHTML));
ok('the zip is asked once per launch (take 81: not once forever, since the first ask was unreadable on the owner\'s phone), stays on the phone, and can be changed from the panel', /NAV\.zipAsked/.test(js) && /vault\.hunt\.zip'/.test(js) && /id="huntZip"/.test(js) && /Adds shelf stock at stores near you\. It stays on this phone\./.test(js));
ok('the hourly workflow exists as a file to paste, takes a zip LIST, and deploys www/ to Pages', fs.existsSync(path.join(ROOT, 'ci', 'hunt.yml')) && /\n {8}run: bash ci\/hunt\.sh\n/.test(fs.readFileSync(path.join(ROOT, 'ci', 'hunt.yml'), 'utf8')) && /^python3 tools\/hunt\.py --zips /m.test(fs.readFileSync(path.join(ROOT, 'ci', 'hunt.sh'), 'utf8')) && /deploy-pages/.test(fs.readFileSync(path.join(ROOT, 'ci', 'hunt.yml'), 'utf8')));   /* take 145: its build is ci/hunt.sh */
/* take 73: the time series -- built by the runner from its own last deploy, read by the app as dated restocks */
{
const histFile = path.join(fxDir, 'history-fixture.json');
ok('the runner writes a history beside the feed: one compact row per run, capped', fs.existsSync(histFile) && (() => { const h = JSON.parse(fs.readFileSync(histFile, 'utf8')); return Array.isArray(h.runs) && h.runs.length >= 1 && h.runs[0].t && 'online' in h.runs[0] && 'shelf' in h.runs[0]; })());
ok('the runner fetches its previous feed and history back from Pages, derived from UPDATE_URL, because a fresh checkout has neither', /def load_previous/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt.py'), 'utf8')) && /def pages_base/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt.py'), 'utf8')) && /UPDATE_URL/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt.py'), 'utf8')));
/* synthesise a fortnight of hourly rows: one product shipping until day 9, one store restocking on two Fridays */
const tcin = T.items.find(i => !/japanese/i.test(i.title) && i.catalog_id).tcin; const sid = T.zips['48329'].stores[0].id;
const rows = []; const t0 = Date.now() - 14 * 864e5;
for (let k = 0; k < 24 * 14; k++) { const t = new Date(t0 + k * 3600e3); const day = Math.floor(k / 24);
  const qty = ((day === 4 || day === 11) && (k % 24) >= 9) ? 3 : 0;                                          // day 4 and 11 = restocks, from the 9th hour of that synthetic day
  rows.push({ t: t.toISOString(), online: { [tcin]: day < 9 ? 1 : 0 }, shelf: { '48329': { [tcin]: { [sid]: qty } } } }); }
V.HUNT.hist = { runs: rows, since: rows[0].t, stores: { '48329': T.zips['48329'].stores }, titles: {} };
const rs = V.HUNT.restocks(tcin, '48329');
ok('from the history: the last time it shipped, and every none-to-some flip per store as a dated restock', rs.runs === 336 && rs.lastShip && Math.round((Date.now() - Date.parse(rs.lastShip)) / 864e5) === 5 && rs.events.length === 2 && rs.events.every(e => e.store === sid && e.qty === 3), JSON.stringify(rs.events));
V.HUNT.feed = F; V.HUNT.setZip('48329'); V.MODE.set('hunt', false); V.paintSealed();
const h73 = ctx.document.querySelector('#sealedList').innerHTML;
ok('the product line says it: last seen shipping N days ago, restocked 2× in 14 d with the store and day named', /last seen shipping 5 days ago/.test(h73) && /restocked 2× in 14 d: Auburn Hills/.test(h73));
V.HUNT.hist = { runs: rows.slice(0, 5), since: rows[0].t, stores: { '48329': T.zips['48329'].stores }, titles: {} }; V.paintSealed();
ok('with five checks it lists what it saw and says a pattern needs a fortnight -- never a prediction on thin data', /5 checks of it in less than a day so far — a pattern needs a fortnight/.test(ctx.document.querySelector('#sealedList').innerHTML));   // take 115: in days from the rows, never "hourly" (landmine 173), and only the runs that read it
V.HUNT.hist = null; V.paintSealed();
ok('with no history there is no history line at all', !/a pattern needs a fortnight|last seen shipping/.test(ctx.document.querySelector('#sealedList').innerHTML));
/* take 74: Local -- the roster, distances from the zip area, the dropdown, own notes */
{
const storesFile = path.join(fxDir, 'stores-fixture.json');
ok('the run writes a store roster beside the feed, from the events file, with location and next events', fs.existsSync(storesFile) && (() => { const r = JSON.parse(fs.readFileSync(storesFile, 'utf8')); return Array.isArray(r.stores) && r.stores.length >= 10 && r.stores.every(s => s.name && s.state && Array.isArray(s.events)) && r.stores.some(s => s.ll); })());
ok('the bundle ships the 3-digit prefix centroid table, small, not the 758 KB full one', V.CAT.zips3 && Object.keys(V.CAT.zips3).length > 800 && Object.keys(V.CAT.zips3).length < 1000 && Array.isArray(V.CAT.zips3['483']));
V.LOCAL.stores = JSON.parse(fs.readFileSync(storesFile, 'utf8')); V.HUNT.setZip('48329');
const mi = V.LOCAL.miles([42.26, -83.72]);   // Ann Arbor from the 483 area
ok('distance from the zip area to a store is computed in miles, about right (Ann Arbor ~35-45 from Waterford)', mi >= 25 && mi <= 55, String(mi));
ok('a store the app cannot place has no distance and is kept only when the filter is Any', V.LOCAL.miles(null) === null && (V.LOCAL.radius = 50, !V.LOCAL.within(null)) && (V.LOCAL.radius = 0, V.LOCAL.within(null)));
V.LOCAL.radius = 50; V.paintLocal(); const hl = ctx.document.querySelector('#localList').innerHTML;
ok('Local lists the shops within the radius with address, miles (exact where the file has the point, ~ otherwise), a Call and their next event', /Shops that run (One Piece )?events/.test(hl) && /~?\d+ mi/.test(hl) && /<span style="display:block;color:var\(--brass\)">[A-Z][a-z]{2} \d{1,2}\b/.test(hl) && /href="tel:\d+"/.test(hl));   // take 115: the next event's day in words (SPEC-110-43)
ok('...and says what the list is and where it comes from, with its age (take 138: in fewer words)', new RegExp('Stores near you that run One Piece events\\. From [^<,]+, (just now|\d+ min ago|\d+ h ago|\d+ days ago)\\.').test(hl), (hl.match(/Stores near you[^<]*/) || [''])[0]);
V.LOCAL.radius = 10; V.paintLocal();
ok('the distance dropdown narrows the list', (ctx.document.querySelector('#localList').innerHTML.match(/~?\d+ mi/g) || []).length < (hl.match(/~?\d+ mi/g) || []).length);
V.LOCAL.radius = 50;
V.LOCAL.notes = [{ store: 'Cosmic Cards & Collectibles', what: '3 OP-11 boxes', price: 130, phone: '(248) 555-0100', when: '2026-09-16' }]; V.paintLocal();
ok('a note of your own shows the store, what you saw, the price, the date and a Call link', /3 OP-11 boxes/.test(ctx.document.querySelector('#localList').innerHTML) && /\$130\.00/.test(ctx.document.querySelector('#localList').innerHTML) && /href="tel:\(248\) 555-0100"/.test(ctx.document.querySelector('#localList').innerHTML));
V.LOCAL.notes = []; V.HUNT.setZip(''); V.paintLocal();
ok('with no zip it asks for one and offers nothing it cannot place', /Where are you\?/.test(ctx.document.querySelector('#localList').innerHTML));
/* take 79: exact distances on request */
V.HUNT.setZip('48329'); V.LOCAL.zcta = null; V.paintLocal();
ok('by default distances are "about" and the screen offers to make them exact', /distances ±10 mi/.test(ctx.document.querySelector('#localList').innerHTML) && /id="localExact"/.test(ctx.document.querySelector('#localList').innerHTML));
const before79 = V.LOCAL.miles([42.26, -83.72]);
V.LOCAL.zcta = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog', 'zcta.json'), 'utf8'));
ok('with the table, the zip is placed at its own centroid and the screen says so', V.LOCAL.exact() && V.LOCAL.here()[0] === 42.69 && (V.paintLocal(), /within a mile or two/.test(ctx.document.querySelector('#localList').innerHTML)));
const after79 = V.LOCAL.miles([42.26, -83.72]);
ok('the exact distance differs from the area estimate by a few miles, not by tens (both are honest placements of 48329)', Math.abs(after79 - before79) <= 15 && after79 >= 25 && after79 <= 55, `${before79} -> ${after79}`);
ok('the table is on Pages beside the feed, not in the bundle', fs.existsSync(path.join(ROOT, 'www', 'hunt', 'zcta.json')) && !('zcta' in V.CAT) && Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'www', 'hunt', 'zcta.json'), 'utf8'))).length > 30000);
V.LOCAL.zcta = null; V.HUNT.setZip('');
ok('the roster refreshes at most daily in the hourly run and the parser has its controls in the gate', /24 \* 3600/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt.py'), 'utf8')) && /def selftest/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt', 'roster.py'), 'utf8')));
/* take 75: local shops' online stock */
const shopsFile = path.join(fxDir, 'shops-fixture.json');
ok('the run writes the shops file from the verified list: per shop its sealed listings with price, availability, link and a catalogue match', fs.existsSync(shopsFile) && (() => { const j = JSON.parse(fs.readFileSync(shopsFile, 'utf8')); const sh = j.shops[0]; return j.fetched_at && sh.name === 'Black Vault Gaming' && sh.ok && sh.sealed.length === 2 && sh.sealed.every(i => i.price > 0 && typeof i.available === 'boolean' && /^https:\/\/blackvaultgaming\.com\/products\//.test(i.url)) && sh.sealed.some(i => i.catalog_id); })());
V.LOCAL.shops = JSON.parse(fs.readFileSync(shopsFile, 'utf8')); V.HUNT.setZip('48329'); V.LOCAL.radius = 0; V.paintLocal();
const hs75 = ctx.document.querySelector('#localList').innerHTML;
ok('Local shows the shop with what it lists: sealed count, in-stock count, singles, and a link into the store', /Black Vault Gaming/.test(hs75) && /2 sealed listed, 2 in stock, 2 singles/.test(hs75) && /href="https:\/\/blackvaultgaming\.com"/.test(hs75));
ok('...and says what the list is -- what each shop lists on its own site, hourly -- and when it was fetched (take 138: in fewer words)', new RegExp('What each shop lists on its own site, checked hourly\\. Fetched (just now|\d+ min ago|\d+ h ago|\d+ days ago)\\.').test(hs75), (hs75.match(/What each shop[^<]*/) || [''])[0]);
for (const sh of V.LOCAL.shops.shops) for (const it of sh.sealed) { const p = it.catalog_id && V.CAT.byId.get(it.catalog_id); if (p) V.SEALED.open.add(p.set); }
V.paintSealed(); const hsl = ctx.document.querySelector('#sealedList').innerHTML;
ok('a matched sealed product carries the shop\'s line: name, price, in stock online, fetched when', /Black Vault Gaming[^<]*\$8\.99 · in stock online · (just now|\d+ min ago)/.test(hsl));
V.LOCAL.shops = null; V.LOCAL.radius = 50;
ok('the verified list is data in the tree, hand-verified, with a date on each entry', fs.existsSync(path.join(ROOT, 'hunt', 'storefronts.json')) && JSON.parse(fs.readFileSync(path.join(ROOT, 'hunt', 'storefronts.json'), 'utf8')).stores.every(s => s.name && s.url && s.platform && /^\d{4}-\d\d-\d\d$/.test(s.verified)));
/* take 76: events near you, and Hunt's own palette */
const evFile = path.join(fxDir, 'events-fixture.json');
ok('the run writes a compact events table beside the roster: rows of [store, date, title, TCG+ id, fee, seats, release], titles interned', fs.existsSync(evFile) && (() => { const j = JSON.parse(fs.readFileSync(evFile, 'utf8')); return Array.isArray(j.rows) && j.rows.length >= 10 && j.titles.length < j.rows.length && j.rows.every(r => r.length === 7) && /\/event\/$/.test(j.url); })());
/* Landmine 123: hunt.py builds this fixture under now="2026-09-01" and its events fall on two days that
   September; the app filters events against the clock it is read with, so from the day after the last
   event the rows were empty and three nights went red. This block runs under a Date pinned to the
   fixture's first event day (noon UTC) and puts the real clock back after; the real clock is the
   negative control at the end of the block. */
const RealDate = ctx.Date;
const fxDays = JSON.parse(fs.readFileSync(evFile, 'utf8')).rows.map(r => r[1]).sort();
const pinnedNow = RealDate.parse(fxDays[0] + 'T12:00:00Z');
ctx.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [pinnedNow])); } static now() { return pinnedNow; } };
ok('the fixture is read under a clock pinned to its own first event day, and the app sees that clock', vm.runInContext('new Date().toISOString().slice(0, 10)', ctx) === fxDays[0] && vm.runInContext('Date.now()', ctx) === pinnedNow);
V.EVENTS.tab = JSON.parse(fs.readFileSync(evFile, 'utf8')); V.LOCAL.stores = JSON.parse(fs.readFileSync(storesFile, 'utf8')); V.HUNT.setZip('48329'); V.LOCAL.radius = 0;
const evRows = V.EVENTS.rows();
ok('events join back to their stores, carry a distance and a registration link, and are sorted by date', evRows.length >= 5 && evRows.every(e => e.store.name && e.url && /bandai-tcg-plus\.com\/event\/\d+/.test(e.url)) && evRows.every((e, i) => i === 0 || e.d >= evRows[i - 1].d));
V.paintEvents(); const he = ctx.document.querySelector('#eventsList').innerHTML;
ok('the Events screen groups by STORE (take 87): each store once with address, miles, a Call, then its next events with fee or free, seats, Register and Calendar', /stores, \d+ events in the next 14 days/.test(he) && />Calendar<\/button>/.test(he) && /~?\d+ mi/.test(he) && /href="tel:\d+"/.test(he) && /(free|\$\d)/.test(he) && /Register/.test(he) && /id="eventsDays"/.test(he) && /One Piece events near you, from Bandai TCG\+ via onepieceevents\.com\. Register in the TCG\+ app or site\./.test(he));
V.LOCAL.radius = 10; V.paintEvents();
ok('the distance dropdown narrows the events too', (ctx.document.querySelector('#eventsList').innerHTML.match(/Register/g) || []).length <= (he.match(/Register/g) || []).length);
/* take 78: an event onto the calendar as a plain .ics */
{ V.LOCAL.radius = 0; const ev = V.EVENTS.rows()[0]; const ics = V.icsFor(ev);
  ok('an event becomes a valid all-day VEVENT: calendar and event envelopes, date start and end, summary with the store, location, notes with fee and the registration link', /^BEGIN:VCALENDAR\r\n/.test(ics) && /BEGIN:VEVENT[\s\S]*END:VEVENT\r\nEND:VCALENDAR\r\n$/.test(ics) && new RegExp('DTSTART;VALUE=DATE:' + ev.d.replace(/-/g, '')).test(ics) && /DTEND;VALUE=DATE:\d{8}/.test(ics) && ics.includes('SUMMARY:') && ics.includes(ev.store.name.replace(/,/g, '\\,').replace(/;/g, '\\;')) && /LOCATION:/.test(ics) && /DESCRIPTION:.*(Fee|Free)/.test(ics) && (!ev.url || ics.includes('URL:' + ev.url)));
  ok('commas and semicolons in names are escaped per RFC 5545, and lines end CRLF', !/[^\\],[^\r]*\r\n(?!DESCRIPTION|SUMMARY|LOCATION)/.test(ics.split('LOCATION:')[1].split('\r\n')[0].replace(/\\,/g, '')) && ics.split('\n').every(l => l === '' || l.endsWith('\r')));
  ok('the row carries the calendar button', /data-evcal="0"/.test(ctx.document.querySelector('#eventsList').innerHTML) || (V.paintEvents(), /data-evcal="0"/.test(ctx.document.querySelector('#eventsList').innerHTML)));
  let shared = null; const _sf = V.PLATFORM.shareFile; V.PLATFORM.shareFile = async (name, text, title) => { shared = { name, text, title }; return 'shared'; };
  const okc = await V.addEventToCalendar(ev);
  ok('on the phone it is handed to the share sheet as a .ics, where the calendar app takes it', okc && shared && /\.ics$/.test(shared.name) && shared.text === ics && /calendar/i.test(shared.title));
  V.PLATFORM.shareFile = _sf; V.LOCAL.radius = 50; }
ctx.Date = RealDate; V.LOCAL.radius = 0;
ok('negative control (landmine 123): read with the real clock, once the fixture\'s last event day has passed the same fixture yields no rows -- the runner\'s three red nights, asserted live against live', RealDate.now() <= RealDate.parse(fxDays[fxDays.length - 1] + 'T23:59:59Z') || V.EVENTS.rows().length === 0);
ok('the real clock is back for everything after this block', vm.runInContext('Date.now()', ctx) > pinnedNow + 864e5 && vm.runInContext('Date', ctx) === RealDate);
V.LOCAL.radius = 50; V.EVENTS.tab = null; V.HUNT.setZip('');
ok('Hunt is the treasure map (take 118): a kraft ground, and it clears AA (checked with the other two above)', /:root\[data-mode="hunt"\]\{\s*--bg:#1A1410/.test(html) && !/class="swords"/.test(html));   // take 116: the three-stroke mark left with the old opening screen
ok('the opening screen shows the app\'s own icon file and no other image', /bundle\/icon\.svg/.test(html) && !/<image/.test(html.slice(html.indexOf('id="splash"'), html.indexOf('id="splash"') + 1500)));
/* take 77: stock alerts -- fire on the flip, once, per source */
{
V.HUNT.feed = F; V.HUNT.setZip('48329'); V.LOCAL.shops = JSON.parse(fs.readFileSync(shopsFile, 'utf8'));
const watched = V.CAT.rows.find(p => p.id === T.items.find(i => i.catalog_id).catalog_id);
const shopItem = V.LOCAL.shops.shops[0].sealed.find(i => i.catalog_id); const watched2 = V.CAT.byId.get(shopItem.catalog_id);
const notes = []; const _n = V.PLATFORM.notify; V.PLATFORM.notify = async (id, title, body) => { notes.push({ title, body }); return true; };
V.STOCK.list = []; V.STOCK.toggle(watched.id); V.STOCK.toggle(watched2.id);
ok('a Sealed row can be watched; the watch is kept on the phone with what each source last showed', V.STOCK.has(watched.id) && V.STOCK.has(watched2.id) && JSON.parse(ctx.localStorage.getItem('vault.stockAlerts')).length === 2);
const srcs = V.STOCK.sourcesFor(watched.id), srcs2 = V.STOCK.sourcesFor(watched2.id);
ok('a product\'s sources are every place the feed knows it -- Target online for one, a local shop for another', srcs.some(s => /^target:online/.test(s.key)) && srcs2.some(s => /^shop:/.test(s.key)), srcs.concat(srcs2).map(s => s.key.split(':')[0]).join());
const n1 = await V.STOCK.check();
ok('the first check fires once per source that is in stock, with the source named', n1 >= 2 && notes.length === n1 && notes.every(x => /^In stock: /.test(x.title)) && notes.some(x => /Black Vault Gaming online/.test(x.body)) && notes.some(x => /Target online/.test(x.body)), JSON.stringify(notes.map(x => x.body)));
const n2 = await V.STOCK.check();
ok('the second check with nothing changed fires nothing -- once per flip, not once per hour', n2 === 0);
shopItem.available = false; await V.STOCK.check(); shopItem.available = true;
const n3 = await V.STOCK.check();
ok('out and back in fires again, for that source only', n3 === 1 && /Black Vault Gaming online/.test(notes[notes.length - 1].body));
V.paintSealed(); const hst = ctx.document.querySelector('#sealedList').innerHTML;
ok('the Stock alerts panel lists the watches with where each is in stock and when it last fired; the row shows it watched', /Stock alerts/.test(hst) && /in stock: /.test(hst) && /last alert (just now|\d+ min ago)/.test(hst) && new RegExp('data-stock="' + watched.id + '"[^>]*aria-pressed="true"').test(hst));
ok('...and says plainly that the check runs when the app is opened', /Checked when you open the app\./.test(hst));
V.STOCK.toggle(watched.id); V.STOCK.toggle(watched2.id); ok('toggling again stops the watch', !V.STOCK.has(watched.id) && V.STOCK.list.length === 0);
V.PLATFORM.notify = _n; V.HUNT.setZip(''); V.LOCAL.shops = null;
}
}
V.HUNT.setZip(''); V.MODE.set('collect', false);
}
}
}
