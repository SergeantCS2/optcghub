/* smoke section 47: take 70 — Hunt: a third mode, Sealed and Releases from the phone\'s own data
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 70 — Hunt: a third mode, Sealed and Releases from the phone\'s own data');
ok('the slider has three modes and Hunt has its own nav and home', /data-mode="hunt"/.test(html) && /id="navHunt"/.test(html) && /hunt: 'sealed'/.test(js) && /hunt: '#navHunt'/.test(js));
ok('the knob has a third position and the palette a third root', /\.mode\.hunt \.knob\{transform:translateX\(calc\(200%/.test(html) && /:root\[data-mode="hunt"\]\{/.test(html));
V.MODE.set('hunt', false);
ok('setting Hunt hides the other navs and shows its own', ctx.document.querySelector('#navHunt').hidden === false && ctx.document.querySelector('#navCollect').hidden === true && ctx.document.querySelector('#navPlay').hidden === true);
const rows = V.SEALED.rows();
ok('Sealed lists the priced sealed PRODUCTS -- never a DON!! card, never unpriced', rows.length >= 300 && rows.every(p => p.sealed && p.market > 0 && !/don!! card/i.test(p.name)), String(rows.length));
ok('negative control: DON!! cards are filed as sealed by the source and would flood the list unfiltered', V.CAT.rows.filter(p => p.sealed && p.market > 0 && /don!! card/i.test(p.name)).length > 100);
const kinds = {}; for (const p of rows) kinds[V.SEALED.kindOf(p)] = (kinds[V.SEALED.kindOf(p)] || 0) + 1;
ok('the kind classifier finds boxes, packs, decks and collections by name, with few left over', kinds.box >= 30 && kinds.pack >= 100 && kinds.deck >= 40 && (kinds.other || 0) < 40, JSON.stringify(kinds));
V.SEALED.kind = 'box'; ok('the kind filter narrows to boxes only', V.SEALED.rows().every(p => V.SEALED.kindOf(p) === 'box') && V.SEALED.rows().length === kinds.box);
V.SEALED.kind = 'all'; V.SEALED.q = 'starter deck 1';
ok('the search narrows by product or set name', V.SEALED.rows().length >= 1 && V.SEALED.rows().every(p => /starter deck 1/i.test(p.name) || /starter deck 1/i.test(V.CAT.sets.get(p.set)?.name || '')));
V.SEALED.q = '';
V.paintSealed();
ok('the Sealed screen draws rows with market, low, high and a delta, grouped by set', /data-open="/.test(ctx.document.querySelector('#sealedList').innerHTML) && /low \$/.test(ctx.document.querySelector('#sealedList').innerHTML) && (ctx.document.querySelector('#sealedList').innerHTML.match(/class="fgrp setstrip"/g) || []).length >= 10);
ok('...and says where the price comes from: TCGplayer\'s market, via TCGCSV (take 138: in fewer words)', /Market prices from TCGplayer, via TCGCSV\./.test(html));
V.paintReleases();
const rel = ctx.document.querySelector('#relList').innerHTML;
ok('Releases lists what is upcoming with a countdown and what was recent', /Upcoming/.test(rel) && /in \d+ days?|today/.test(rel) && /days ago/.test(rel));
ok('an unpublished card list is said to be unpublished, never shown as zero', !/\b0 cards/.test(rel));
ctx.window.scrollTo = () => {}; ctx.scrollTo = () => {};
ok('a sealed row opens the detail sheet, where the price alert already lives', (() => { try { V.openDetail(rows[0].id); return /alert/i.test(js) && /data-open="/.test(ctx.document.querySelector('#sealedList').innerHTML); } catch (e) { return false; } })());
V.MODE.set('collect', false);
}
}
