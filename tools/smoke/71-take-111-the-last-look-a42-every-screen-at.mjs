/* smoke section 71: take 111 — the last look (A42): every screen at both of the Fold\'s sizes after the UI series, and what it turned up
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 111 — the last look (A42): every screen at both of the Fold\'s sizes after the UI series, and what it turned up');
{ const doc = ctx.document, el = id => doc.getElementById(id) || { textContent: '', innerHTML: '', hidden: undefined, classList: { contains: () => null } };   /* an older build lacks some ids: each check fails on its own */
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  const rows = V.CAT.rows, isDon = p => !!p.sealed && /don!! card/i.test(p.name || '');
  const box = rows.find(p => V.SEALED.isProduct(p) && V.SEALED.kindOf(p) === 'box');
  const named = rows.find(p => V.SEALED.isProduct(p) && (V.CAT.sets.get(p.set) || {}).name === p.name);
  const don = rows.find(p => isDon(p) && p.market > 0);
  const card = rows.find(p => !p.sealed && p.num && p.market > 1 && p.d1p != null);
  const keepItems = V.OWN.items, keepSnaps = V.OWN.snaps.slice();
  ok('...the fixtures exist: a booster box, a product named for its set, a DON!! card, a card with a price history', !!box && !!named && !!don && !!card);

  /* a row's small line: the parts it has, joined -- a printing with no number opened its line with a dot */
  const dj = V.dotJoin || ((...a) => a.join(' · '));
  ok('a row\'s small line joins the parts it has with " · " and leaves the empty ones out', dj('', '$1.00') === '$1.00' && dj('OP01-001', '$1.00') === 'OP01-001 · $1.00' && dj(null, 'ST01', '', undefined, 'x') === 'ST01 · x' && dj() === '', JSON.stringify(dj('', '$1.00')));
  ok('...every line that leads with a number uses it: search, movers, trade, the trade picker, wants, the scan result, and an alert', (js.match(/dotJoin\(esc\(p\.num\)/g) || []).length === 6 && /dotJoin\(esc\(a\.num\)/.test(js), String((js.match(/dotJoin\(esc\(p\.num\)/g) || []).length));
  { const q = doc.getElementById('allq'), out = doc.getElementById('allRes'), keepF = JSON.parse(JSON.stringify(V.FILT.all));
    Object.assign(V.FILT.all, V.blankFilter('all')); q.value = box.name; out.innerHTML = ''; V.paintSearch(); const sr = out.innerHTML;
    q.value = ''; out.innerHTML = ''; Object.assign(V.FILT.all, keepF); V.paintSearch();
    const line = ((sr.split(`data-open="${box.id}"`)[1] || '').match(/<span>([^<]*)<\/span>/) || [])[1];
    ok('search: a sealed product\'s line starts with its set, not a dot (it read " · OP01")', line != null && line.length > 0 && !/^\s*·/.test(line), JSON.stringify(line)); }
  { const keepG = V.TRADE.give.slice(); V.TRADE.give.length = 0; V.TRADE.give.push({ id: box.id, n: 1 }); V.go('trade'); const tr = el('trGive').innerHTML;
    V.TRADE.give.length = 0; V.TRADE.give.push(...keepG); V.go('home');
    const line = (tr.match(/<div class="n"><b>[\s\S]*?<\/b>\s*<span>([^<]*)/) || [])[1];
    ok('trade: a sealed product\'s line starts with its price ("$… each"), not a dot', line != null && /^[^\s·]/.test(line) && / each/.test(line), JSON.stringify(line)); }
  { const keepA = V.ALERTS.list, keepW = V.WANT.list;
    V.ALERTS.list = []; V.ALERTS.add(box.id, 'below', 1); V.WANT.list = [{ num: '', id: box.id, added: '2026-09-01T00:00:00Z' }];
    V.go('wants'); const al = el('alRows').innerHTML, wt = el('wtRows').innerHTML;
    V.ALERTS.list = keepA; V.ALERTS.save(); V.WANT.list = keepW; V.WANT.save(); V.go('home');
    const alLine = (al.match(/<div class="n"><b>[\s\S]*?<\/b>\s*<span[^>]*>([^<]*)/) || [])[1], wtLine = (wt.match(/<div class="n"[^>]*><b>[\s\S]*?<\/b>\s*<span>([^<]*)/) || [])[1];
    ok('alerts: a sealed product\'s line starts with its rule ("below $1.00"), and the line wraps rather than cutting off what the alert is doing', alLine != null && /^below /.test(alLine) && /<span style="white-space:normal">below /.test(al), JSON.stringify(alLine));
    ok('wants: a sealed product kept on the list from an older build (the page no longer offers it) reads its set first, not a dot', wtLine != null && wtLine.length > 0 && !/^\s*·/.test(wtLine), JSON.stringify(wtLine)); }

  /* the filter sheet counts what it lists */
  { doc.getElementById('sortBtnAll')._ev.click(); const fAll = el('fN').textContent;
    doc.getElementById('sortBtn')._ev.click(); const fOwn = el('fN').textContent;
    while (V.closeAnyOverlay()) {}
    ok('the filter sheet counts what it lists: results over the catalogue (sealed products are in it: "7,661 printings" sat beside "Search all 6,987 cards"), lines over the collection', /^[\d,]+ results?$/.test(fAll) && /^[\d,]+ lines?$/.test(fOwn), `${fAll} | ${fOwn}`); }

  /* a card's page, a sealed product's page, a DON!! card's page */
  { const page = id => { V.openDetail(id); return { h: el('dQtyH').textContent, fin: el('dFinish').textContent, cond: el('dCond').innerHTML.replace(/<[^>]+>/g, ''), seg: el('dCondSeg').hidden,
      graded: el('dGradedP').hidden, want: el('dWant').hidden, sibs: el('dSibsP').hidden, sibRows: el('dSiblings').innerHTML, sub: el('dSub').textContent, subHid: el('dSub').hidden,
      stock: el('dStock').hidden, buy: el('dBuy').hidden, product: el('dArt').classList.contains('product') }; };
    const B = page(box.id);
    ok('a sealed product\'s page: its copies are "Sealed" and its line says what it is ("Box", not "Normal"); no Graded panel, no Want, and no printings of its empty number (it listed every product and DON!! card)',
       B.h === 'Sealed' && B.fin === 'Box' && B.graded === true && B.want === true && B.sibs === true && B.sibRows === '' && B.stock === false && B.buy === false && B.product === true, JSON.stringify({ ...B, sibRows: B.sibRows.length }));
    const N = page(named.id);
    ok('...a product named for its set has no line under its name (every starter deck said its name twice)', N.sub === '' && N.subHid === true, JSON.stringify([N.sub, named.name]));
    const D = page(don.id);
    ok('a DON!! card is a card, though the catalogue files it as sealed: copies "Ungraded" in their finish, a condition to record, a Graded panel; with no number, no Want and no list of printings',
       D.h === 'Ungraded' && D.fin === (don.sub || 'Normal') && D.seg === false && /^Condition · /.test(D.cond) && D.graded === false && D.want === true && D.sibs === true && D.stock === true && D.buy === true && D.product === false, JSON.stringify({ ...D, sibRows: D.sibRows.length }));
    ok('...control: the flag alone calls it sealed, which is the first cut of this take -- its page was a product\'s', !!don.sealed && !V.SEALED.isProduct(don));
    const C = page(card.id);
    ok('...and a card\'s page is as it was: "Ungraded", its finish, a condition, Graded and Want shown, its printings listed', C.h === 'Ungraded' && C.fin === (card.sub || 'Normal') && C.seg === false && C.graded === false && C.want === false && C.sibs === false && C.sibRows.includes(`data-open="${card.id}"`), JSON.stringify({ ...C, sibRows: C.sibRows.length }));
    ok('the page\'s panels: Want and the alerts under a Watch heading of their own; Graded holds the graded copies only',
       /<div class="panel" id="dWatchP">\s*<h3>Watch<\/h3>\s*<button class="linkish" id="dWant">[^<]*<\/button>\s*<button class="linkish" id="dAlert">[^<]*<\/button>\s*<button class="linkish" id="dStock" hidden>[^<]*<\/button>\s*<\/div>/.test(html)
       && /<div class="panel" id="dGradedP">\s*<h3>Graded<\/h3>\s*<div id="dGradedList"><\/div>\s*<button class="linkish" id="dAddGraded">/.test(html));
    ok('...control: take 110\'s panel, Want and the alerts under "Graded", is caught', !/<div class="panel" id="dGradedP">\s*<h3>Graded<\/h3>\s*<div id="dGradedList"><\/div>\s*<button class="linkish" id="dAddGraded">/.test('<div class="panel">\n    <h3>Graded</h3>\n    <div id="dGradedList"></div>\n    <button class="linkish" id="dWant">Want this card</button>'));
    const tris = h => (h.match(/[▲▼]/g) || []).length, keepD = [card.d1a, card.d1p];
    card.d1a = 2; card.d1p = 5; V.openDetail(card.id); const up = el('dPrice').innerHTML;
    card.d1a = -2; card.d1p = -5; V.openDetail(card.id); const down = el('dPrice').innerHTML; [card.d1a, card.d1p] = keepD; V.go('home');
    ok('a price that moved carries its triangle once (the price had one and the move a second)', tris(up) === 1 && tris(down) === 1 && /▲/.test(up) && /▼/.test(down), `${tris(up)} ${tris(down)}`); }

  /* the binder opens a set at its first held pocket */
  { const numKey = n => { const m = n.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 9999; };
    const bySet = new Map(); for (const p of rows) if (p.num) { const m = bySet.get(p.set) || new Map(); if (!m.has(p.num)) m.set(p.num, p); bySet.set(p.set, m); }
    const [sid, byNum] = [...bySet.entries()].sort((a, b) => b[1].size - a[1].size)[0];
    const nums = [...byNum.keys()].sort((a, b) => numKey(a) - numKey(b) || a.localeCompare(b));
    const BN = V.BN, keepSet = BN.set, keepPg = { ...BN.pageOf };
    V.OWN.items = []; V.OWN.add(byNum.get(nums[12]).id, { condition: 'NM' }); V.OWN.add(byNum.get(nums[20]).id, { condition: 'NM' });
    BN.set = sid; delete BN.pageOf[sid]; V.go('binder'); const first = BN.page;
    BN.pageOf[sid] = 0; V.go('binder'); const kept = BN.page;
    Object.keys(BN.pageOf).forEach(k => delete BN.pageOf[k]); Object.assign(BN.pageOf, keepPg); BN.set = keepSet; V.OWN.items = keepItems; V.go('home');
    ok('the binder opens a set it has not paged at the page of its first held card (it opened on nine empty pockets)', first === 1, String(first));
    ok('...and a page the collector turned to is kept, the first one too', kept === 0, String(kept)); }

  /* a currency named once */
  { const cl = V.curLabel || (c => `${((V.CUR.list.find(x => x[0] === c) || [])[1] || '').trim()} ${c}`);
    ok('a currency whose sign is its code is named once ("CHF", not "CHF CHF"); the others keep their sign ("$ USD", "€ EUR")', cl('CHF') === 'CHF' && cl('USD') === '$ USD' && cl('EUR') === '€ EUR', [cl('CHF'), cl('USD'), cl('EUR')].join(' | '));
    const was = V.CUR.active(); V.CUR.set('CHF'); V.paintHome(); const pill = el('curPillHome').innerHTML; V.CUR.set(was); V.paintHome();
    ok('...Home\'s currency pill with francs chosen says so once', />CHF<\/button>$/.test(pill.trim()) && !/CHF CHF/.test(pill), pill.slice(-40)); }

  /* Decks */
  { V.paintStock(); const sh = doc.querySelector('#dkStock').innerHTML, n = (sh.match(/data-stock="/g) || []).length;
    ok('a ready-made deck\'s row gives its name the width: the badge rides the line under it, with the count', n > 0 && (sh.match(/<div class="note"><span class="badge">ready-made<\/span> \d+ cards<\/div>/g) || []).length === n && !/<\/div>\s*<span class="badge">ready-made<\/span><\/button>/.test(sh), String(n)); }
  { const L = rows.find(p => p.type === 'Leader' && p.market > 0), d0 = { id: 'd111', name: 'empty', leader: L.id, cards: [], created: 111 };
    V.DECKS.list.push(d0); V.openDeck('d111'); const dv = el('dkValue').innerHTML, A0 = V.analysis(d0);
    V.DECKS.list.splice(V.DECKS.list.indexOf(d0), 1); V.go('home');
    ok('an empty deck says it has no cards yet (it said "you own every card in it") and is worth its Leader, as its history counts it', /no cards in it yet/.test(dv) && !/you own every card in it/.test(dv) && Math.abs(A0.value - L.market) < 1e-9, `${A0.value} vs ${L.market}`); }
  ok('a deck\'s search box asks in two words that fit ("Add cards"; "— search the catalogue" was cut at 411 px)', /id="dkq"[^>]*placeholder="Add cards"/.test(html));

  /* Hunt, More */
  { const keepS = V.LOCAL.stores, keepZ = V.HUNT.zip; V.LOCAL.stores = null; V.HUNT.setZip('48329'); V.paintLocal(); const lo = el('localList').innerHTML;
    V.LOCAL.stores = keepS; V.HUNT.setZip(keepZ || ''); V.paintLocal();
    ok('Local, before its shop list is fetched, names its source in a sentence ("From Bandai TCG+."), not "From Bandai TCG+, ."', /From Bandai TCG\+\. A store/.test(lo) && !/, \./.test(lo), (lo.match(/From [^<]{0,40}/) || [''])[0]); }
  { V.go('settings'); const ab = el('setBody').innerHTML; V.go('home');
    const d = (ab.match(/ · prices ([^<]*)</) || [])[1];
    ok('More → About gives the prices\' day in words, as every other day in the app is ("Sep 23", not "2026-09-23")', d != null && /^[A-Z][a-z]{2} \d{1,2}(, \d{4})?$/.test(d), JSON.stringify(d)); }

  /* Home, the collection */
  ok('Home\'s Performance tab leads with its own panel, above Most valuable (it sat under the list)', html.indexOf('id="perfPanel"') > 0 && html.indexOf('id="perfPanel"') < html.indexOf('<h3>Most valuable</h3>'));
  { V.OWN.items = []; V.OWN.add(card.id, { condition: 'NM' }); V.OWN.add(box.id, { condition: 'NM' }); V.OWN.add(don.id, { condition: 'NM' }); V.paintHome();
    const sd = el('setDone').innerHTML, top = el('topList').innerHTML;
    ok('Home\'s Set completion rows say how far along a set is and stop there ("tap for the checklist" went)', / numbers · \d+(?:\.\d)?%<\/span>/.test(sd) && !/tap for the checklist/.test(sd), sd.replace(/\s+/g, ' ').slice(0, 160));
    const boxLine = ((top.split(`data-open="${box.id}"`)[1] || '').match(/<span>([^<]*)<\/span>/) || [])[1];
    ok('...a sealed product in Most valuable says what it is and its set ("Box · OP01"), not a condition and a finish it has not got ("NM · Normal · ")', boxLine != null && boxLine.startsWith('Box · ') && !/NM|Normal|·\s*$/.test(boxLine), JSON.stringify(boxLine));
    const keepFO = JSON.parse(JSON.stringify(V.FILT.own)); Object.assign(V.FILT.own, V.blankFilter('own'));
    V.go('collection'); const cg = el('colGrid').innerHTML; Object.assign(V.FILT.own, keepFO); V.go('home');
    const tile = id => (cg.split(`data-open="${id}"`)[1] || '').split('</button>')[0];
    const cs = t => [...t.matchAll(/<div class="c"[^>]*>([\s\S]*?)<\/div>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    const tb = cs(tile(box.id)), td = cs(tile(don.id));
    ok('a sealed product\'s tile says what it is and that it is sealed ("Box", "Sealed"), not a lone dot over "NM · Normal"', tb[0] === 'Box' && tb[1] === 'Sealed', JSON.stringify(tb));
    ok('...a DON!! card\'s tile keeps its rarity, its condition and its finish, with no dot left hanging', td[0] === (don.rarity || '') && td[1] === `NM · ${don.sub || 'Normal'}`, JSON.stringify(td));
    V.OWN.items = keepItems; }

  /* a cost basis on a card not yet owned: added, and in today's reading */
  { V.OWN.items = []; V.OWN.snaps = []; V.openDetail(card.id);
    doc._ids.set('askIn', { value: '12.50' });
    const run = doc.getElementById('dPaid')._ev.click(); doc.getElementById('askOk')._ev.click(); await run;
    const it = V.OWN.items.find(i => i.id === card.id), sn = V.OWN.snaps.slice();
    doc._ids.delete('askIn'); V.OWN.items = keepItems; V.OWN.snaps = keepSnaps; V.OWN.save(); V.go('home');
    ok('a cost basis set on a card not yet owned adds it, and today\'s reading counts it (it was added without one)', !!it && it.paid === 12.5 && sn.length === 1 && sn[0][2] === 1, JSON.stringify([it && it.paid, sn])); }

  /* the second pass of the look: Set completion, the card page's own collection, two slabs of one printing */
  { const PF = V.PF, keepActive = PF.active, keepList = PF.list.slice();
    if (!PF.list.some(p => p.id === 'tr111')) PF.list.push({ id: 'tr111', name: 'Trade pile' });
    PF.active = 'main'; V.OWN.items = []; V.OWN.add(named.id, { condition: 'NM' }); V.paintHome(); const sd0 = el('setDone').innerHTML;
    ok('Set completion leaves out a printing with no number: a starter deck still in its wrapper does not list its set as "1 of 17 numbers"', !/data-checklist=/.test(sd0), (sd0.match(/<span>[^<]*numbers[^<]*<\/span>/) || [sd0.slice(0, 80)])[0]);
    const other = rows.find(p => p.set === card.set && p.num && p.num !== card.num && !p.sealed && p.market > 0);
    V.OWN.items = [{ id: card.id, qty: 1, condition: 'NM', pf: 'main' }, { id: other.id, qty: 2, condition: 'NM', pf: 'tr111' }];
    V.paintHome(); const sd1 = el('setDone').innerHTML, rowS = (sd1.split(`data-checklist="${card.set}"`)[1] || '').split('</button>')[0];
    const val = (rowS.match(/<div class="v mono">([^<]*)</) || [])[1];
    ok('...and a set\'s value is the collection on screen\'s, as its count is (it added every collection\'s copies)', /1 of \d+ numbers/.test(rowS) && val === V.money(card.market), `${val} vs ${V.money(card.market)}`);
    /* the card page's copy is the one in the collection it names */
    PF.active = 'tr111'; V.OWN.items = [{ id: card.id, qty: 3, condition: 'NM', pf: 'main' }, { id: card.id, qty: 1, condition: 'NM', pf: 'tr111' }];
    V.openDetail(card.id); const shown = el('dQty').textContent, label = el('dSave').textContent;
    doc.getElementById('dPlus')._ev.click(); doc.getElementById('dSave')._ev.click();
    const [m, t] = [V.OWN.items[0].qty, V.OWN.items[1].qty];
    ok('the card page keeps to the collection it names: Save on the Trade pile\'s page sets the Trade pile\'s copy, and the main collection\'s 3 stay 3 (Save took the first line in any collection)', shown === '1' && m === 3 && t === 2, JSON.stringify({ shown, m, t }));
    V.OWN.items = []; V.openDetail(card.id); const label0 = el('dSave').textContent;
    ok('...and its button says Save on a copy you have, "Add to collection" on one you have not', label === 'Save' && label0 === 'Add to collection', `${label} | ${label0}`);
    /* two slabs of one printing */
    PF.active = 'main'; V.OWN.items = [];
    V.OWN.add(card.id, { qty: 1, condition: 'GRADED', graded: { grader: 'PSA', grade: '10', cert: '111' } });
    V.OWN.add(card.id, { qty: 1, condition: 'GRADED', graded: { grader: 'BGS', grade: '9.5', cert: '222' } });
    const slabs = V.OWN.items.filter(i => i.graded);
    ok('two slabs of one printing are two lines, each with its own grade and cert (the second was counted into the first and wrote its grade over it)', slabs.length === 2 && slabs.every(i => i.qty === 1) && slabs.map(i => i.graded.cert).join() === '111,222' && /OWN\.add\(dCur\.id, \{ qty: 1, condition: 'GRADED', graded: \{ grader: g,/.test(js), JSON.stringify(V.OWN.items.map(i => [i.qty, i.graded && i.graded.cert])));
    V.OWN.items = []; V.OWN.add(card.id, { condition: 'NM' }); V.OWN.add(card.id, { condition: 'NM' });
    ok('...control: an ungraded copy still counts into its line (landmine 16)', V.OWN.items.length === 1 && V.OWN.items[0].qty === 2, JSON.stringify(V.OWN.items.map(i => i.qty)));
    V.OWN.items = keepItems; PF.active = keepActive; PF.list.length = 0; PF.list.push(...keepList); V.go('home'); }

  /* the stylesheet */
  ok('a row that leads with a picture centres it on its words (baseline put the picture\'s foot on the first line: every Sealed and Releases row sat askew)', /\.row:has\(> \.pic\)\{align-items:center\}/.test(css));
  ok('the bulk bar is two lines on a phone -- what is selected and Done, then the three actions -- and one on the open Fold (four buttons on a line ran off a 411 px phone)',
     /class="row bulkrow"/.test(html) && /\.bulkrow\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\);grid-template-areas:"nm nm x" "c m d"/.test(css) && /\.bulkrow\{grid-template-columns:minmax\(0,1fr\) repeat\(4,auto\);grid-template-areas:"nm c m d x"\}/.test(css));
  ok('Scan\'s note under the camera keeps the page\'s margins (the camera runs edge to edge; the note ran with it)', /#scan \.unlim\{margin-left:var\(--pad\);margin-right:var\(--pad\)\}/.test(css));
}
}
