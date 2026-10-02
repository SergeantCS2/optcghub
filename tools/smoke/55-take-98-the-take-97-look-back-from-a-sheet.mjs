/* smoke section 55: take 98 — the take-97 look: Back from a sheet goes back (landmine 137), the most-valuable rows open, one splash colour, a toast that wraps, the decks fold, a condition tap that works
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 98 — the take-97 look: Back from a sheet goes back (landmine 137), the most-valuable rows open, one splash colour, a toast that wraps, the decks fold, a condition tap that works');
/* landmine 137: the card sheet is a screen; it must not be in the overlay list, and the handler's sequence must land on the previous screen */
ok('closeAnyOverlay() lists overlays only: the sheets (the Rules sheet since take 122, the table\'s sheet since take 124), the tour and the curtain \u2014 never the card sheet', /for \(const id of \['#picker', '#filters', '#leaderPick', '#printPick', '#rulesSheet', '#simSheet', '#tour', '#simCurtain'\]\)/.test(js) && !/for \(const id of \[[^\]]*'#detail'/.test(js));   // take 107 added the three sheets Back skipped
if (V.guideClose) V.guideClose(false);   // take 116: the boot timer opened the guide inside this stub (its first await is above), and it is an overlay now: Back would close it first
{ const box98 = V.CAT.rows.find(p => V.SEALED.isProduct(p)); V.MODE.set('hunt', false); V.go('sealed'); V.openDetail(box98.id);
  const top0 = V.NAV.stack[V.NAV.stack.length - 1]; const closed = V.closeAnyOverlay(); const back = V.NAV.back(); const top1 = V.NAV.stack[V.NAV.stack.length - 1];
  ok('the back handler\'s sequence from a sheet: closeAnyOverlay() has nothing to close, NAV.back() pops to the screen the sheet came from', top0 === 'detail' && closed === false && back === true && top1 === 'sealed', `${top0} → closed=${closed} back=${back} → ${top1}`);
  const det = ctx.document.getElementById('detail'); det.classList.add('on'); const closedSheet = V.closeAnyOverlay(); const stillOn = det.classList.contains('on'); det.classList.remove('on');
  ok('...control: a sheet that is on is left alone by closeAnyOverlay() (before take 98 it was closed and Back went nowhere)', closedSheet === false && stillOn);
  const pk = ctx.document.getElementById('picker'); pk.classList.add('on'); const closedPicker = V.closeAnyOverlay();
  ok('...control: an open picker IS closed by it, and Back stops there', closedPicker === true && !pk.classList.contains('on'));
  V.MODE.set('collect', false); V.go('home'); }
/* Home's most-valuable rows open the card */
ok('Home\'s most-valuable cards are buttons that open the card, like every other list\'s (a shelf since take 118)', /<button class="st" data-open="\$\{p\.id\}" aria-label="\$\{esc\(p\.name\)\}, \$\{money\(\(p\.market \|\| 0\) \* i\.qty\)\}"><div class="pic">/.test(js) && !/<div class="row" style="align-items:center">\$\{cardPic\(p\)\}<div class="nm">/.test(js));
{ const keep98 = V.OWN.items; const card98 = V.CAT.rows.find(p => !p.sealed && p.market > 0); V.OWN.items = []; V.OWN.add(card98.id, { condition: 'NM' }); V.paintHome();
  ok('...and a painted top list carries the tap on its card', new RegExp('<button class="st" data-open="' + card98.id + '"').test(ctx.document.getElementById('topList').innerHTML));
  V.OWN.items = keep98; }
/* one splash colour */
ok('the splash is one scene in every mode (the listing\'s frame, take 116), never the mode\'s palette', /#splash\{[^}]*background:linear-gradient\(180deg,#1f3d72/.test(html) && !/#splash\{[^}]*var\(--bg\)/.test(html));
/* a toast that wraps */
ok('a toast wraps inside the screen instead of running off both sides (the take-97 reminder toast)', /\.toast\{[^}]*white-space:normal;max-width:min\(92vw,520px\);text-align:center/.test(html) && !/\.toast\{[^}]*nowrap/.test(html));
/* the Starter decks section starts folded */
ok('Sealed\'s Starter decks section starts folded (the owner\'s word; a tap opens it as before)', /closed: new Set\(\['decks'\]\)/.test(js));
/* the condition tap: in place, and it does something */
ok('a condition tap no longer repaints the sheet through openDetail() (which reset the condition, so the tap did nothing)', !/dCond = c\.dataset\.cond; openDetail\(dCur\.id\)/.test(js) && /setCond\(c\.dataset\.cond\)/.test(js));
{ const keep98 = V.OWN.items; const card98 = V.CAT.rows.find(p => !p.sealed && p.market > 0); V.OWN.items = []; V.openDetail(card98.id);
  const r1 = V.setCond('LP'); const seg1 = ctx.document.getElementById('dCondSeg').innerHTML;
  ok('tapping LP on an unowned card moves the segment to LP, names it on the line, quantity 1, no cost basis', r1 === true && /class="on" data-cond="LP"/.test(seg1) && !/class="on" data-cond="NM"/.test(seg1) && /Condition · Lightly Played/.test(ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, '')) && ctx.document.getElementById('dQty').textContent === '1' && ctx.document.getElementById('dPaid').textContent === 'Set');
  V.OWN.add(card98.id, { qty: 3, condition: 'MP' }).paid = 12.5; const r2 = V.setCond('MP');   // the cost basis is set on the sheet, not through add()
  ok('tapping a condition you own copies in shows that copy\'s quantity and cost basis', r2 === true && ctx.document.getElementById('dQty').textContent === '3' && /12\.50/.test(ctx.document.getElementById('dPaid').textContent) && /class="on" data-cond="MP"/.test(ctx.document.getElementById('dCondSeg').innerHTML));
  const r3 = V.setCond('XX');
  ok('...control: a condition that is not one of the five is refused and nothing moves', r3 === false && /class="on" data-cond="MP"/.test(ctx.document.getElementById('dCondSeg').innerHTML) && ctx.document.getElementById('dQty').textContent === '3');
  /* take 110: the note that said what a tap does went at the owner's word; the line says which condition is chosen */
  ok('the line over the segment names the condition a tap chose (the note under it is gone, take 110)', ctx.document.getElementById('dCondNote') === null && /Condition · Moderately Played/.test(ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, '')));
  V.OWN.items = keep98; V.go('home'); }
}
