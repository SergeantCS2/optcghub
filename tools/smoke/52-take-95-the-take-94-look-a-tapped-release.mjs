/* smoke section 52: take 95 — the take-94 look: a tapped release shows a screen (landmine 135), the sealed sheet, the alert you can find
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 95 — the take-94 look: a tapped release shows a screen (landmine 135), the sealed sheet, the alert you can find');
const fire95 = el => (el._ev && el._ev.click) ? el._ev.click({ target: el, preventDefault() {} }) : null;
/* the row's document-level click handler calls browseSet(id); the stub keeps one listener per node, so the function is driven directly here and the real click in Chrome (render.mjs) */
ok('the release row\'s tap goes through browseSet(), which is what the handler calls (with the row\'s query since take 97)', typeof V.browseSet === 'function' && /browseSet\(\+b\.dataset\.browseSet, b\.dataset\.browseQ\)/.test(js));
const tapBrowse = setId => V.browseSet(setId);
const relSet = [...V.CAT.sets.values()].find(s => s.pub && V.CAT.rows.some(p => p.set === s.id && V.SEALED.isProduct(p)));
const relProd = V.CAT.rows.find(p => p.set === relSet.id && V.SEALED.isProduct(p));
V.MODE.set('hunt', false); V.go('releases'); V.SEALED.q = ''; V.SEALED.kind = 'all';
tapBrowse(relSet.id);
ok('Hunt: tapping a release SHOWS Sealed, searched for that set with the query in the box, and that set\'s products are on screen (landmine 135)',
   V.NAV.stack[V.NAV.stack.length - 1] === 'sealed' && V.SEALED.q === relSet.name && ctx.document.getElementById('sealedQ').value === relSet.name && new RegExp('data-open="' + relProd.id + '"').test(ctx.document.getElementById('sealedList').innerHTML),
   `landed on ${V.NAV.stack[V.NAV.stack.length - 1]}, q "${V.SEALED.q}"`);
V.SEALED.q = ''; ctx.document.getElementById('sealedQ').value = '';
V.MODE.set('collect', false); V.go('home'); tapBrowse(relSet.id);
ok('Collect: tapping a set in the browse SHOWS the Search screen with that set filtered', V.NAV.stack[V.NAV.stack.length - 1] === 'search' && V.FILT.all.set[0] === relSet.id, `landed on ${V.NAV.stack[V.NAV.stack.length - 1]}`);
Object.assign(V.FILT.all, V.blankFilter('all')); V.go('home');
/* the sheet: sealed vs card */
const box95 = V.CAT.rows.find(p => V.SEALED.isProduct(p)); const card95 = V.CAT.rows.find(p => !p.sealed && p.market > 0);
V.STOCK.list = []; V.openDetail(box95.id);
ok('a sealed product\'s sheet hides the card conditions, says it has no condition to record, and offers the stock alert',
   ctx.document.getElementById('dCondSeg').hidden === true && ctx.document.getElementById('dCondSeg').innerHTML === '' && /No condition to record/.test(ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, '')) && ctx.document.getElementById('dStock').hidden === false);
fire95(ctx.document.getElementById('dStock'));
const on95 = V.STOCK.has(box95.id) && /Watching for stock/.test(ctx.document.getElementById('dStock').textContent);
fire95(ctx.document.getElementById('dStock'));
ok('tapping it watches the product through the take-77 watch and the button says so; tapping again stops', on95 && !V.STOCK.has(box95.id) && /Alert me when in stock/.test(ctx.document.getElementById('dStock').textContent));
V.openDetail(card95.id);
ok('a card\'s sheet shows the segment under a line that names the condition, and no stock alert',
   ctx.document.getElementById('dCondSeg').hidden === false && /data-cond="NM"/.test(ctx.document.getElementById('dCondSeg').innerHTML) && /Condition · Near Mint/.test(ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, '')) && ctx.document.getElementById('dStock').hidden === true);
V.MODE.set('hunt', false); V.paintSealed();
ok('the row\'s circle carries its word: alert, or watching', />alert<\/span><\/button>/.test(ctx.document.getElementById('sealedList').innerHTML) && (V.STOCK.toggle(box95.id), V.paintSealed(), />watching<\/span><\/button>/.test(ctx.document.getElementById('sealedList').innerHTML)));
V.STOCK.toggle(box95.id); V.STOCK.list = []; V.MODE.set('collect', false); V.go('home');
/* landmine 136 (check run 17): .linkish{display:block} and .seg{display:flex} outrank the browser's [hidden] rule; the stub cannot see that, so the shipped CSS is read here and Chrome measures the height */
ok('the sheet\'s button and segment carry their own [hidden] rule, so the attribute hides them in a real engine (landmine 136)', /\.linkish\[hidden\],\.seg\[hidden\]\{display:none\}/.test(html));
}
}
