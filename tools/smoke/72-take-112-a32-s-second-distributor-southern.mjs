/* smoke section 72: take 112 — A32\'s second distributor: Southern Hobby, read off its real pages (dates, not stock words)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 112 — A32\'s second distributor: Southern Hobby, read off its real pages (dates, not stock words)');
{ const fxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-sh-')); const feedF = path.join(fxDir, 'feed-fixture.json');
  execSync(`python3 tools/hunt.py --from-fixtures --out ${feedF}`, { cwd: ROOT, stdio: 'pipe' });
  const F = JSON.parse(fs.readFileSync(feedF, 'utf8')); const S = F.sources.southern || {}; const it = Object.fromEntries((S.items || []).map(i => [i.id, i]));
  const n = st => (S.items || []).filter(i => i.state === st).length;
  /* take 114 (the review): a day on screen is pinned from the fixture's own date, as the app writes it -- a literal "May 17"
     stops matching on 1 January 2027, when dayText adds the year */
  const D112 = iso => V.dayText(iso).replace(/[ \u202f]/g, '\u00a0'), I112 = id => it[id] || {};
  const txt112 = t => String(t || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  ok('the feed carries Southern Hobby: ok, the footer\'s count and its twenty rows, three product pages on file, the states from the dates (1 open, 18 closed, 1 released)',
     S.ok === true && S.count === 20 && (S.items || []).length === 20 && S.items.filter(i => i.page).length === 3 && n('orders_open') === 1 && n('orders_closed') === 18 && n('released') === 1,
     JSON.stringify({ ok: S.ok, count: S.count, pages: (S.items || []).filter(i => i.page).length, open: n('orders_open'), closed: n('orders_closed'), released: n('released') }));
  ok('every item: its page on the distributor, its item number, ISO dates or none; the set code from the item number (DP14 where the name says DP-15)',
     (S.items || []).every(i => /^https:\/\/www\.southernhobby\.com\/[^"]+\/p\d+\/$/.test(i.url) && i.item && (i.release === null || /^\d{4}-\d\d-\d\d$/.test(i.release)) && (i.due === null || /^\d{4}-\d\d-\d\d$/.test(i.due)))
     && it['81328'] && it['81328'].codes.join() === 'DP14' && /DP-15/.test(it['81328'].name));
  ok('the history rows carry each item\'s state (the timeline\'s input), and the app never fetches the distributor',
     (() => { const h = JSON.parse(fs.readFileSync(path.join(fxDir, 'history-fixture.json'), 'utf8')); return h.runs[0].southern && h.runs[0].southern['81327'] === 'orders_closed' && Object.keys(h.runs[0].southern).length === 20; })() && !/southernhobby\.com/.test(js));
  ok('Diagnostics names Southern Hobby beside GTS', (() => { const k = V.HUNT.feed; V.HUNT.feed = F; try { return typeof V.feedLine === 'function' && new RegExp(`, gts \\d+ products, southern ${S.items.length} products$`).test(V.feedLine()); } finally { V.HUNT.feed = k; } })());   // take 115: printed from HUNT.DISTS (STAN-112-21)
  /* on screen -- take 112, the owner's word: "I don't want them flooding the screen". A row carries each distributor
     as one short line that opens the product's page at Distributor info; the long text sits under closed drop-downs */
  V.HUNT.feed = F; V.HUNT.setZip(''); V.MODE.set('hunt', false); V.SEALED.kind = 'all'; V.SEALED.q = ''; V.DISTF.open.clear();
  const eb05 = V.CAT.byId.get(it['78743'] && it['78743'].catalog_id), op18 = V.CAT.byId.get(it['79311'] && it['79311'].catalog_id);
  /* take 128 (landmine 243): the two items the rows below read must still match a catalogue product under the names TCGCSV
     lists tonight -- a rename (landmine 231's family) ends here with its name, not three reds further down */
  ok('the fixture\'s EB-05 pack and OP-18 box each match a catalogue product tonight (a rename at TCGCSV would end here, named)',
     !!eb05 && !!op18, JSON.stringify({ eb05: it['78743'] && [it['78743'].name, it['78743'].catalog_id], op18: it['79311'] && [it['79311'].name, it['79311'].catalog_id] }));
  /* take 128 (landmine 243): the EB-05 pack was priced every day from 17 to 29 Sept and not on the 30th, and its row left Sealed
     with three checks -- the screen listed priced products only. Under D24 (the owner's (b), the same take) Sealed lists what a
     source names, priced or not, so the fixture's row is on the screen because the fixture names it; the D24 section below holds
     the controls. */
  for (const p of [eb05, op18]) if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); }
  V.paintSealed(); const h = ctx.document.querySelector('#sealedList').innerHTML;
  const line243 = eb05 ? (h.match(new RegExp('<button class="dline" data-open="' + eb05.id + '" data-distinfo="1" aria-label="[^"]*"><span>[^<]*')) || ['no Southern Hobby line under the EB-05 pack\'s row (is its row on Sealed at all? ' + (h.includes('data-open="' + eb05.id + '">') ? 'yes' : 'no') + ')'])[0] : 'no eb05';
  ok('the EB-05 pack (matched) carries Southern Hobby as one short line under its chips: its name and its state, opening its page at Distributor info',
     !!eb05 && new RegExp('<button class="dline" data-open="' + eb05.id + '" data-distinfo="1" aria-label="[^"]*"><span>Southern Hobby · orders closed ' + D112(I112('78743').due) + '</span>').test(h), line243.slice(-90));
  const nmIn = (html, id) => { const i = html.indexOf('data-open="' + id + '">'); const j = html.indexOf('<div class="v">', i); return i < 0 ? '' : html.slice(i, j); };
  const nm = id => nmIn(h, id);
  const eb05it = V.HUNT.distItems().find(x => x._d === 'southern' && x.id === '78743');
  ok('a short line\'s day never breaks: its month and day are joined by a non-breaking space', !!eb05it && V.distShort(eb05it) === `Southern Hobby · orders closed ${D112(I112('78743').due)}`, JSON.stringify(eb05it && V.distShort(eb05it)));
  ok('...control: the day in words by itself breaks at its space', / /.test(V.dayText(I112('78743').due)) && V.dayText(I112('78743').due) !== D112(I112('78743').due), JSON.stringify(V.dayText(I112('78743').due)));
  /* take 115 (STAN-112-18): the guard's predicate, named, so its control runs the same code over a flooded row */
  const floods = t => /GTS Distribution|Southern Hobby|MSRP|release [A-Z]/.test(t);
  const noFlood = html => [eb05, op18].every(p => { const t = nmIn(html, p.id); return !!t && !floods(t); });
  ok('...no row floods: no distributor\'s words inside any row\'s name block -- no MSRP, no release, no age', !!eb05 && !!op18 && noFlood(h), nm(op18 && op18.id).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200));
  { /* take 111's row: the distributor's full line inside the name block (the line take 112 moved), planted into this very list */
    const at = eb05 ? h.indexOf('<div class="v">', h.indexOf('data-open="' + eb05.id + '">')) : -1, cut = at > 0 ? h.lastIndexOf('</div>', at) : -1;
    const full = eb05it ? V.distLine(eb05it) : '', flooded = cut > 0 && full ? h.slice(0, cut) + full + h.slice(cut) : h;
    ok('...control: take 111\'s row, the full distributor line in its name block, is caught by the same predicate -- and the plant landed', flooded !== h && nmIn(flooded, eb05.id).includes(full) && /Southern Hobby · /.test(full) && !noFlood(flooded), txt112(nmIn(flooded, eb05 && eb05.id)).slice(0, 200)); }
  V.openDetail(eb05.id, { dist: true }); const dd = ctx.document.querySelector('#dDist').innerHTML;
  ok('...its page, reached from that line, opens at Distributor info with the full words -- stores’ orders closed May 17, release Oct 30, in-store only, when it was read -- and Southern Hobby\'s own page',
     /data-distfold="detail" aria-expanded="true"/.test(dd) && new RegExp(`Southern Hobby</b><span>stores’ orders closed ${D112(I112('78743').due)} · release ${D112(I112('78743').release)} · in-store only · (just now|\\d+ min ago)</span>`).test(dd) && dd.includes(`href="${it['78743'].url}" target="_blank" rel="noopener"`), dd.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300));
  V.openDetail(eb05.id); const dc = ctx.document.querySelector('#dDist').innerHTML;
  ok('...control: opened from its row, the page\'s Distributor info is there and closed', /data-distfold="detail" aria-expanded="false"/.test(dc) && !/in-store only/.test(dc));
  ok('the open handler passes a distributor line\'s wish to the page, and only its', /else openDetail\(id, \{ dist: !!t\.dataset\.distinfo \}\);/.test(js) && /data-distinfo="1"/.test(js));
  while (V.closeAnyOverlay()) {} V.go('sealed');
  ok('Where to buy offers no distributor now: they sell to stores, and their words are under Distributor info', eb05 && !V.buySources(eb05).some(s => s.kind === 'dist'), JSON.stringify(eb05 && V.buySources(eb05).map(s => s.label)));
  ok('Sealed carries one closed Distributor info saying how many distributors and when they were checked', /data-distfold="sealed" aria-expanded="false"/.test(h) && /<span class="note">2 distributors · checked (just now|\d+ min ago)<\/span>/.test(h) && !/Lists order deadlines/.test(h));
  V.distFoldTap('sealed'); const ho = ctx.document.querySelector('#sealedList').innerHTML; V.distFoldTap('sealed');
  ok('...opened: Southern Hobby\'s counts from its dates, the in-store count from the pages read, and that it lists dates, not stock (take 138: in fewer words)',
     /<b>Southern Hobby<\/b>/.test(ho) && /20 products: <b>1<\/b> taking orders, 18 orders closed, 1 released; 1 in-store only \(3 of 20 read so far\)/.test(ho)
     && /Lists order deadlines and release dates for stores, not stock\./.test(ho), (ho.match(/<b>Southern Hobby<\/b>[\s\S]{0,300}/) || ['no Southern Hobby section'])[0].replace(/\s+/g, ' '));
  /* take 115 (self-review): the fixture's unlisted products are sets TCGCSV had not listed on 25 Sept, and since take 115
     a group enters the catalogue as soon as it lists one product -- any night could list one and turn the count and the
     rows below red with nothing wrong. They are the fixture's facts, so the fixture's catalogue is read: those sets are
     set aside for this read and put back in their order after it. */
  const FX115 = new Set(['IB09', 'IB10', 'ST37', 'ST38', 'EB06', 'DP14', 'OP19', 'PEB01', 'ST39', 'ST40', 'ST41', 'ST42', 'ST43', 'ST44']);
  const norm115 = x => String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), setsAll115 = [...V.CAT.sets];
  const aside115 = setsAll115.filter(([, st]) => [norm115(st.abbr), ...String(st.abbr || '').split(/[-\/]/).map(norm115)].some(c => FX115.has(c))).map(([k]) => k);
  for (const k of aside115) V.CAT.sets.delete(k);
  V.paintReleases(); const rc = ctx.document.querySelector('#relList').innerHTML;
  const op18row = (rc.match(/<span>OP18 · [^<]*<\/span>((?:<span style="display:block;color:var\(--brass\)">[^<]*<\/span>)*)/) || ['', ''])[1];
  const lines18 = (op18row.match(/<span style="display:block;color:var\(--brass\)">/g) || []).length;
  ok('the OP18 row on Releases carries one short line from each distributor: GTS\'s, then Southern Hobby\'s for the set\'s own box', lines18 === 2 && op18row.includes(`GTS Distribution · sold out</span><span style="display:block;color:var(--brass)">Southern Hobby · orders closed ${D112(I112('79311').due)}</span>`), op18row.replace(/<[^>]+>/g, ' | '));
  const sh18 = (S.items || []).filter(i => i.catalog_id && (V.CAT.byId.get(i.catalog_id) || {}).set === (op18 || {}).set);
  ok('...control: Southern Hobby matched more than one product into that set (the box and the DP-13 display), so one line each is a choice, not the data', sh18.length >= 2, String(sh18.length));
  /* 17 = GTS's OP-19, PEB-01 and ST44 display + Southern Hobby's IB-09, IB-10, ST-37, ST-38, EB-06, DP14, OP-19, PEB-01 and
     ST-39 to ST-44 (the look counted 11 rows: the starter-deck displays fold by day) */
  ok('Releases\' not-in-the-catalogue list sits under one closed Distributor info that says how long it is', /data-distfold="releases" aria-expanded="false"/.test(rc) && /<span class="note">17 products not in the catalogue yet · 2 distributors · checked (just now|\d+ min ago)<\/span>/.test(rc) && !/OP-19 Booster Box/.test(rc),
     (rc.match(/data-distfold="releases"[\s\S]{0,260}/) || ['no Distributor info on Releases'])[0]);
  V.distFoldTap('releases'); const r = ctx.document.querySelector('#relList').innerHTML; V.distFoldTap('releases');
  const panel = r.slice(r.indexOf('At the distributors'), r.indexOf('<h3>Recent</h3>'));
  ok('...opened, it carries Southern Hobby\'s: PEB-01 still taking stores’ orders until Oct 14, OP-19 with its prerelease, and ST39–ST44 folded on their day',
     panel.includes(`PEB01</span><span style="display:block;color:var(--brass)">Southern Hobby · stores order by ${D112(I112('82337').due)} · release ${D112(I112('82337').release)}`)
     && panel.includes(`OP-19 Booster Box</b><span>OP19</span><span style="display:block;color:var(--brass)">Southern Hobby · stores’ orders closed ${D112(I112('81327').due)} · release ${D112(I112('81327').release)} · prerelease ${D112((I112('81327').page || {}).prerelease)}`)
     && /Starter decks ST39–ST44<\/b><span>6 starter deck displays, one release day/.test(panel) && /data-relfold="d:southern:2027-04-23"/.test(panel), panel.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400));
  ok('...each fold names its distributor: GTS\'s and Southern Hobby\'s displays of one day never share a key', !/data-relfold="d:2027-04-23"/.test(r) && /Checked GTS Distribution [^,]+, Southern Hobby /.test(panel));
  V.CAT.sets.clear(); for (const [k, st] of setsAll115) V.CAT.sets.set(k, st);   // the live catalogue back, in its order
  const iso = t => /(GTS Distribution|Southern Hobby) · [^<]*\b\d{4}-\d\d-\d\d\b/.test(t) || /(GTS Distribution|Southern Hobby)<\/b><span>[^<]*\b\d{4}-\d\d-\d\d\b/.test(t);
  ok('every day on a distributor line is in words, as everywhere else -- the rows, the open lists and a page\'s Distributor info', !iso(h) && !iso(ho) && !iso(rc) && !iso(r) && !iso(dd) && new RegExp(`GTS Distribution · sold out · allocated · [^<]*· release ${D112((F.sources.gts.items.find(i => i.sku === 'BJP2884797') || {}).release)} · `).test(r), (String(h + ho + rc + r + dd).match(/(GTS Distribution|Southern Hobby)(<\/b><span>| · )[^<]*\d{4}-\d\d-\d\d[^<]*/) || [''])[0]);
  ok('...control: an ISO day on either shape of line is caught', iso('<span>GTS Distribution · sold out · release 2026-06-12 · just now</span>') && iso('<b>Southern Hobby</b><span>released 2026-09-18</span>'));
  /* no stock words, so no stock alert */
  if (eb05) { V.STOCK.list = []; V.STOCK.toggle(eb05.id); }
  const src = eb05 ? V.STOCK.sourcesFor(eb05.id) : [];
  ok('Southern Hobby is no stock-alert source -- it publishes no availability to flip', !!eb05 && !src.some(x => /^southern:/.test(x.key)), JSON.stringify(src.map(x => x.key)));
  if (eb05) V.STOCK.toggle(eb05.id); V.STOCK.list = [];
  /* a source that fails */
  const dead = JSON.parse(JSON.stringify(F)); dead.sources.southern = { ok: false, error: 'HTTP 503', fetched_at: F.fetched_at, stale_since: F.fetched_at, items: [] };
  V.HUNT.feed = dead; V.DISTF.open.add('sealed'); V.DISTF.open.add('releases'); V.paintSealed(); V.paintReleases();
  const hd = ctx.document.querySelector('#sealedList').innerHTML, rd = ctx.document.querySelector('#relList').innerHTML; V.DISTF.open.clear();
  ok('a failed fetch says it could not reach Southern Hobby and since when, under Distributor info on Sealed and on Releases, while GTS\'s lines stay', /Could not reach Southern Hobby since/.test(hd) && /Could not reach Southern Hobby since/.test(rd) && /GTS Distribution · /.test(rd) && !/Southern Hobby · (stores|orders)/.test(hd + rd));
  /* the look opened DP-13's display for its Southern Hobby chip: the host refuses its photo (403, a product too new
     to have one), and the sheet stood an empty white frame -- white is a product photo's ground, and the placeholder
     carried the number a product does not have */
  const dp13d = V.CAT.byId.get(it['79312'] && it['79312'].catalog_id);
  const code13 = dp13d ? ((V.CAT.sets.get(dp13d.set) || {}).abbr || '').replace(/-/g, '').slice(0, 5) : '';
  if (dp13d) V.openDetail(dp13d.id); const art = ctx.document.querySelector('#dArt').innerHTML;
  const css112 = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  ok('a product\'s sheet labels its picture frame with its set\'s code on the row tile\'s ground, and turns white only under a photo that arrived',
     !!dp13d && !!code13 && art.includes(`<span class="phl">${code13}</span>`) && /\.dhero \.art\.product\{background:linear-gradient\(160deg,var\(--brass2\),var\(--card2\)\)\}/.test(css112)
     && /\.dhero \.art\.product:has\(img\.ref\.ok\)\{background:#fff\}/.test(css112) && !/\.dhero \.art\.product\{background:#fff\}/.test(css112), JSON.stringify({ code13, art: art.slice(0, 160) }));
  const card112 = V.CAT.rows.find(x => !x.sealed && x.num && x.img); V.openDetail(card112.id); const artc = ctx.document.querySelector('#dArt').innerHTML;
  ok('...control: a card\'s frame still carries its number, and no set pill', artc.includes(`>${card112.num}</div>`) && !/class="phl"/.test(artc), artc.slice(0, 120));
  while (V.closeAnyOverlay()) {}
  V.HUNT.feed = null; V.MODE.set('collect', false); V.go('home'); }
}
