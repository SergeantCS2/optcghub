/* smoke section 76: take 117 — the owner\'s polish: starter decks once, the strips readable, three numbers on a card, the shutter row on a grid, the top bar seamless, the note under More
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 117 — the owner\'s polish: starter decks once, the strips readable, three numbers on a card, the shutter row on a grid, the top bar seamless, the note under More');
{ V.MODE.set('hunt', false); V.SEALED.q = ''; V.SEALED.kind = 'all'; V.SEALED.closed.clear(); V.paintSealed();
  const hs = ctx.document.querySelector('#sealedList').innerHTML;
  const deckSet = [...V.CAT.sets.entries()].find(([id, st]) => st.kind === 'deck' && V.CAT.rows.some(p => p.set === id && V.SEALED.isProduct(p)));
  const ids = deckSet ? V.CAT.rows.filter(p => p.set === deckSet[0] && V.SEALED.isProduct(p)).map(p => p.id) : [];
  const times = id => (hs.match(new RegExp('data-open="' + id + '"', 'g')) || []).length;
  ok('a starter-deck set\'s products are listed once, in the Starter decks section, and the set has no strip of its own (at take 114 they were listed twice: 32 of 85 strips)', !!deckSet && ids.length > 0 && ids.every(id => times(id) === 1) && !new RegExp('data-setfold="' + deckSet[0] + '"').test(hs), deckSet ? deckSet[1].name + ' ' + ids.map(times).join(',') : 'no deck set');
  ok('...control: the section is open, so the count is of drawn rows', /data-setfold="decks" aria-expanded="true"/.test(hs));
  const dated = [...hs.matchAll(/<button class="fgrp setstrip" data-setfold="(?!decks)[^"]+"[^>]*>(?:<div class="artbg crisp"[\s\S]*?<\/div>)?<span>[^<]*<span class="note">(Released|Releases) [^<]+<\/span>/g)];
  ok('every set strip says when the set was released, in words, on its own line', dated.length >= 20, String(dated.length));
  ok('the strip is 104 px tall with the name centred at the title size and the art placed on the card\'s face (B3, the owner\'s pick)', /\.setstrip\{[^}]*min-height:104px[^}]*align-items:center/.test(html) && /\.setstrip \.artbg\.crisp img\{object-position:50% 62%\}/.test(html) && /\.setstrip > span:first-of-type\{[^}]*font-size:var\(--fs-title\)/.test(html));
  V.SEALED.closed.add('decks'); V.MODE.set('collect', false);
  /* the card page: three numbers, never chips */
  const leader = V.CAT.rows.find(p => p.type === 'Leader' && p.life && p.power); const chr = V.CAT.rows.find(p => p.type === 'Character' && p.cost != null && p.cost !== '' && p.power && p.counter);
  V.openDetail(chr.id); const c1 = ctx.document.querySelector('#dStats').innerHTML;
  ok('a Character shows Type, Cost and Power as three cells, each label above its value -- no counter, no colour (the owner: you can just read the card)', /class="statbar"/.test(c1) && (c1.match(/<div><span>/g) || []).length === 3 && /<span>Type<\/span><b class="word">Character<\/b>/.test(c1) && /Cost<\/span>/.test(c1) && /Power<\/span>/.test(c1) && !/Counter/.test(c1) && !/class="chip"/.test(c1), c1.slice(0, 160));
  V.openDetail(leader.id); const c2 = ctx.document.querySelector('#dStats').innerHTML;
  ok('a Leader shows the same three: Type, Life in the cost cell, Power', (c2.match(/<div><span>/g) || []).length === 3 && /<span>Type<\/span><b class="word">Leader<\/b>/.test(c2) && /Life<\/span>/.test(c2) && /Power<\/span>/.test(c2) && !/Cost<\/span>/.test(c2), c2.slice(0, 160));
  const ev = V.CAT.rows.find(p => p.type === 'Event' && p.cost != null && p.cost !== '' && !p.power); V.openDetail(ev.id); const c3 = ctx.document.querySelector('#dStats').innerHTML;
  ok('an Event, which has no power, still shows three cells: a dash where the number would be (the owner: every card the same three squares)', (c3.match(/<div><span>/g) || []).length === 3 && /<span>Power<\/span><b>—<\/b>/.test(c3), c3.slice(0, 160));
  const don = V.CAT.rows.find(p => p.sealed && !p.num && /don!! card/i.test(p.name)); if (don) { V.openDetail(don.id); ok('...and a DON!! card, with none of the three, shows no row', ctx.document.querySelector('#dStats').innerHTML === ''); }
  ok('the row keeps 14 px under it, so the cells never touch the panel below (seen in the first look)', /\.statbar\{display:flex;gap:8px;margin:2px 0 14px\}/.test(html));
  ok('the cells are token-sized in one row that never wraps, each a third at most', /\.statbar\{display:flex/.test(html) && /\.statbar>div\{[^}]*max-width:calc\(\(100% - 16px\) \/ 3\)/.test(html) && /\.statbar b\{[^}]*font-size:var\(--fs-title\)/.test(html));
  ok('the printing\'s badge sits on the title\'s centre line (measured at 4x: +0.1 px on the caps\' centre)', /\.ab-title \.badge\{vertical-align:middle;line-height:1;padding:4px 6px 1px\}/.test(html));
  while (V.closeAnyOverlay()) {} V.go('home');
  /* the shutter row */
  ok('the shutter row is a three-column grid: the icon buttons left, the shutter centred, Review right, nothing wraps', /\.shutterbar\{display:grid;grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/.test(html) && /<div class="shl">/.test(html) && /<div class="shr">/.test(html) && /\.shutterbar \.shl \.ghost\{width:44px;height:44px/.test(html) && /\.shutterbar \.shr \.ghost\{white-space:nowrap/.test(html) && /id="btnUndo" aria-label="Undo the last scan"/.test(html));
  /* the top bar */
  ok('the mode bar starts at the very top and carries the status-bar inset itself, so its ground covers the inset once the page scrolls (the owner\'s screenshot: art under the clock)', /\.modebar\{position:sticky;top:0;[^}]*padding:calc\(var\(--sat\) \+ 6px\) 0 2px/.test(html) && /:root:not\(\.at-top\) \.modebar\{background:linear-gradient\(var\(--bg\) 78%,transparent\)\}/.test(html) && !/body\{[^}]*padding-top:var\(--sat\)/.test(html));
  /* the release note */
  V.go('settings'); const more = ctx.document.querySelector('#setBody').innerHTML;
  ok('More draws the release note for this take under About, closed', /<details class="wn"><summary>New in this update<\/summary>/.test(more) && !/<details class="wn" open/.test(more));
  /* the fallback label, the deck editor's row, the nav's one rule, the sizes */
  ok('a tile whose picture is missing stacks the name pill over the number (the flex row ran them together: "Nefeltari ViviEB03-024")', /\.art \.ph\{[^}]*flex-direction:column/.test(html) && /<span class="phl">\$\{esc\(p\.name\)\}<\/span><span class="num">\$\{esc\(p\.num\)\}<\/span>/.test(js) && /\.opt \.oa \.ph\{[^}]*flex-direction:column/.test(html));
  ok('the deck editor\'s bottom row wraps on a narrow phone instead of scrolling the page sideways (360 px, landmine 156)', /\.dkfoot\{flex-wrap:wrap\}/.test(html) && /@media \(max-width:380px\)\{\.dkfoot #dkSave\{flex:1 1 100%\}\}/.test(html));
  ok('the nav\'s label colour is one rule, the token, not a hex a later rule overrode', (html.match(/\nnav button\{/g) || []).length === 1 && !/color:#B9BEC7/.test(html) && (html.match(/\nnav button\.on\{/g) || []).length === 1);
  const cssPart = html.slice(0, html.indexOf('<script'));
  const offScale = [...cssPart.matchAll(/font-size:(\d+(?:\.\d+)?)px/g)].map(m => +m[1]).filter(v => ![12, 13, 14, 15, 16, 18, 26, 34, 44].includes(v));
  ok('every font-size in the stylesheet is on the token scale (25 literals were off it at take 114)', offScale.length === 0, offScale.join(','));
  ok('the placeholder rule is declared once, and the distributor line\'s text uses the ink token', (html.match(/\.search input::placeholder\{/g) || []).length === 1 && /\.dline\{[^}]*color:var\(--accent-ink\)\}/.test(html) && !/\.dline\{[^}]*color:var\(--brass\)/.test(html));
  ok('the Sim\'s opponent strip counts its hand in words ("5 in hand"), never "char" (take 124: the table draws the Characters, so "in play" left with the rows)', /\$\{X\.handCount\} in hand<\/span>/.test(js) && !/' char'/.test(js));
  V.go('home'); }
}
