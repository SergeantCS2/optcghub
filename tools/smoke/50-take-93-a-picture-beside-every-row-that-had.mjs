/* smoke section 50: take 93 — a picture beside every row that had none (A33 item 6)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 93 — a picture beside every row that had none (A33 item 6)');
{
  const p = V.CAT.rows.find(x => x.img && x.num && !x.sealed && x.type === 'Character');
  ok('cardPic and setPic are exported', typeof V.cardPic === 'function' && typeof V.setPic === 'function');
  if (typeof V.cardPic === 'function') {
    const h = V.cardPic(p);
    ok('cardPic: a pic box at the card ratio with the number as its label and the lazy reference image',
       /class="pic"/.test(h) && /class="ph"/.test(h) && h.includes(p.num.split('-').pop()) && /width:44px;height:61px/.test(h) &&   /* take 110: the list-row size, THUMB.m */
       /<img class="ref" loading="lazy"/.test(h) && /this\.remove\(\)/.test(h), h.slice(0, 140));
    const none = V.cardPic({ ...p, img: null });
    ok('negative control: with no image the box is the label alone', /class="ph"/.test(none) && !/<img/.test(none));
    const s = [...V.CAT.sets.values()].find(x => V.CAT.rows.some(r => r.set === x.id && r.sealed && /booster box/i.test(r.name)));
    ok("setPic: a set shows its booster box through productPic", !!s && /class="pic"/.test(V.setPic(s)) && /<img class="ref"/.test(V.setPic(s)));
    ok('negative control: a set with no product gets the drawn tile and no image',
       /class="pic"/.test(V.setPic({ id: -1, abbr: 'XX-99' })) && !/<img/.test(V.setPic({ id: -1, abbr: 'XX-99' })) && /XX99/.test(V.setPic({ id: -1, abbr: 'XX-99' })));
  }
  const count = (html, re) => (html.match(re) || []).length;
  ctx.document.getElementById('allRes').innerHTML = ''; ctx.document.getElementById('allq').value = 'nami'; V.paintSearch();
  const hits = ctx.document.getElementById('allRes').innerHTML;
  ok('search hits carry a picture each', count(hits, /data-open=/g) > 0 && count(hits, /class="pic"/g) === count(hits, /data-open=/g),
     `${count(hits, /class="pic"/g)} pics for ${count(hits, /data-open=/g)} rows`);
  ctx.document.getElementById('allq').value = ''; Object.assign(V.FILT.all, V.blankFilter('all')); ctx.document.getElementById('allRes').innerHTML = ''; V.paintSearch();
  const sets = ctx.document.getElementById('setList').innerHTML;
  ok('the set browse shows a box per set', count(sets, /class="pic"/g) >= 5 && count(sets, /class="pic"/g) === count(sets, /data-browse-set=/g), String(count(sets, /class="pic"/g)));
  const L = V.CAT.rows.find(x => x.type === 'Leader');
  ok('a deck row carries a picture between its cost and its name', typeof V.deckRow === 'function' && /class="cost".*class="pic".*class="n"/s.test(V.deckRow(p, 1, L)));
  V.openDetail(p.id);
  const sib = ctx.document.getElementById('dSiblings').innerHTML;
  ok("the card sheet's other printings carry a picture each", count(sib, /data-open=/g) > 0 && count(sib, /class="pic"/g) === count(sib, /data-open=/g));
  if (typeof V.paintHome === 'function') { V.OWN.add(p.id, { condition: 'NM' }); V.paintHome();   // Home lists the collection; give it one card
    ok("Home's top list and set progress carry pictures", /class="pic"/.test(ctx.document.getElementById('topList').innerHTML) && /class="pic"/.test(ctx.document.getElementById('setDone').innerHTML),
       `top ${count(ctx.document.getElementById('topList').innerHTML, /class="pic"/g)}, sets ${count(ctx.document.getElementById('setDone').innerHTML, /class="pic"/g)}`); }
  if (typeof V.paintDecks === 'function') { V.paintDecks();
    ok('the Decks list Leader box is a sized pic box (landmine 132)', !V.DECKS.list.length || /class="lead pic"/.test(ctx.document.getElementById('dkList').innerHTML)); }
  ok('the Trade and Wants thumbnails and the Play board Leader are sized pic boxes (landmine 132; take 115: the trade and want rows draw the dense list\'s cardPic)',
     count(js, /class="oa pic"/g) === 0 && count(js, /\$\{cardPic\(p, THUMB\.s\)\}/g) >= 4 && /function tradeRow[\s\S]{0,400}\$\{cardPic\(p, THUMB\.s\)\}/.test(js) && /class="lead pic" data-plleader/.test(js));
  V.go('home');
}
}
