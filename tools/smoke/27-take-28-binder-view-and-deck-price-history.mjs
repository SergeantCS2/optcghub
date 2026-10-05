/* smoke section 27: take 28 — binder view and deck price history
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { eb, d, A } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 28 — binder view and deck price history');
V.OWN.items = [];
const eb = V.CAT.sets.get(V.candidates('EB03-024', null)[0].set);
V.CAT.rows.filter(x => x.set === eb.id && x.num).slice(0, 12).forEach(x => V.OWN.add(x.id, { condition: 'NM' }));
const bs = V.binderSets();
ok('the binder lists the sets the collector holds, most cards first', bs.length >= 1 && bs[0].s.id === eb.id && bs[0].n === 12, JSON.stringify(bs.map(x => [x.s.abbr, x.n])));
ok('a page is nine pockets with gaps for numbers not held; on the open Fold a spread of two, eighteen (take 120)', /nums\.slice\(first \* 9, first \* 9 \+ per\)/.test(js) && /while \(slice\.length < per\) slice\.push\(null\)/.test(js) && /per = spread \? 18 : 9/.test(js));
ok('a held pocket prefers the scanned photo, then the dearer printing', /\(i\.photo && !cur\.i\.photo\)/.test(js));
ok('an empty pocket is a want-toggle, like the checklist', /class="pocket empty" data-ck=/.test(js));
ok('the page is remembered per set', /BN\.pageOf\[BN\.set\]/.test(js));
ok('a reprint carrying another set\'s number shows its full number, not a duplicate suffix (landmine 101)',
   /function numLabel\(/.test(js) && (js.match(/numLabel\(/g) || []).length >= 4);
/* deck history */
const d = V.DECKS.blank(); d.leader = V.CAT.rows.find(p => p.type === 'Leader' && p.color === 'Red').id;
V.CAT.rows.filter(p => p.color === 'Red' && p.type === 'Character' && p.num && V.CAT.hist[p.id]).slice(0, 5).forEach(p => d.cards.push({ id: p.id, n: 4 }));
const h = V.deckHistory(d);
ok('deck history has one point per catalogue day on file', h.length === V.CAT.days.length, `${h.length} vs ${V.CAT.days.length}`);
const A = V.analysis(d);
ok('the last history point equals today\'s deck value (Leader included)',
   Math.abs(h[h.length - 1][1] - A.value) < 0.02, `${h[h.length-1][1]} vs ${A.value}`);   /* take 111: the value counts the Leader itself now */
ok('the deck chart is labelled as an estimate and drawn dashed', /Dashed: estimated from each day\\u2019s prices\./.test(js) && /sparkOn\(\$\('#dkSpark'\), hist, 'estimate'\)/.test(js));
ok('the deck says how many of its cards you own and what it costs to complete', /to complete/.test(js) && /you own every card in it/.test(js));
V.OWN.items = [];
}
}
