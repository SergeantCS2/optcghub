/* smoke section 88: take 128 — D24, the owner\'s (b): Sealed lists a product a distributor, Target or a shop names, priced or not, and a row with no price yet says so
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 128 — D24, the owner\'s (b): Sealed lists a product a distributor, Target or a shop names, priced or not, and a row with no price yet says so');
{ const fxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-d24-')); const feedF = path.join(fxDir, 'feed-fixture.json');
  execSync(`python3 tools/hunt.py --from-fixtures --out ${feedF}`, { cwd: ROOT, stdio: 'pipe' });
  const F = JSON.parse(fs.readFileSync(feedF, 'utf8')); const S = F.sources.southern || {}; const it = Object.fromEntries((S.items || []).map(i => [i.id, i]));
  const box = V.CAT.byId.get(it['79311'] && it['79311'].catalog_id);   /* the OP-18 booster box: Southern Hobby names it, TCGplayer prices it */
  if (!box || typeof V.SEALED.listed !== 'function' || typeof V.HUNT.listedIds !== 'function') ok('D24\'s predicate exists and the fixture\'s OP-18 box matches a catalogue product', false, [!!box, typeof V.SEALED.listed, typeof V.HUNT.listedIds].join(' '));
  else {
    const keep = { market: box.market, low: box.low, high: box.high, feed: V.HUNT.feed, shops: V.LOCAL.shops, kind: V.SEALED.kind, q: V.SEALED.q };
    V.MODE.set('hunt', false); V.SEALED.kind = 'all'; V.SEALED.q = ''; V.SEALED.closed.delete(box.set); V.SEALED.open.add(box.set); V.DISTF.open.clear(); V.LOCAL.shops = null;
    const list = () => ctx.document.querySelector('#sealedList').innerHTML;
    const rowOf = (h, id) => { const i = h.indexOf('data-open="' + id + '">'); return i < 0 ? '' : h.slice(i, h.indexOf('</button>', i)); };
    const words = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    const allCount = () => +((ctx.document.querySelector('#sealedKinds').innerHTML.match(/data-skind="all"[^>]*>All <span class="note">(\d+)</) || [, '-1'])[1]);
    try {
      box.market = null; box.low = null; box.high = null;
      V.HUNT.feed = F; V.paintSealed(); const hOn = list(), rowOn = rowOf(hOn, box.id), nOn = allCount();
      ok('an unpriced product a distributor names is on Sealed: its row says "no market price yet" where low and high would be, its column stays blank, and its distributor line sits under it',
         !!rowOn && / · no market price yet<\/span>/.test(rowOn) && /<div class="v"><b>—<\/b><\/div>/.test(rowOn) && !/ low /.test(rowOn) && new RegExp('<button class="dline" data-open="' + box.id + '" data-distinfo="1"').test(hOn), words(rowOn) || 'no row');
      /* the feed names other unpriced products too (the EB-05 pack tonight among them): the count grows by exactly those */
      V.HUNT.feed = F; const unpriced = [...V.HUNT.listedIds()].filter(id => { const q = V.CAT.byId.get(id); return q && V.SEALED.isGoods(q) && !(q.market > 0); }).length;
      V.HUNT.feed = null; V.paintSealed(); const hOff = list(), nOff = allCount();
      ok('negative control: with no source naming it, an unpriced product is not on Sealed, and the kinds\' count grows by exactly the unpriced products the feed names', !rowOf(hOff, box.id) && unpriced >= 1 && nOn === nOff + unpriced, JSON.stringify({ nOn, nOff, unpriced }));
      box.market = keep.market; box.low = keep.low; box.high = keep.high; V.paintSealed(); const rowBack = rowOf(list(), box.id);
      ok('...control: priced, it is listed with no source at all, with low, high and its price', !!rowBack && / · low /.test(rowBack) && !/no market price yet/.test(rowBack) && rowBack.includes(V.money(box.market)), words(rowBack));
      ok('isProduct still means a priced product (Diagnostics counts it so); listed is what the screen draws', !V.SEALED.isProduct({ ...box, market: null }) && V.SEALED.listed({ ...box, market: null }, new Set([box.id])) === true && V.SEALED.listed({ ...box, market: null }, new Set()) === false && V.SEALED.listed(box, new Set()) === true);
      V.HUNT.feed = F; const ids = V.HUNT.listedIds(); V.HUNT.feed = null;
      ok('the ids a source names are catalogue ids as numbers, from the distributors, Target and the shops together', ids.has(box.id) && ids.size >= 2 && [...ids].every(x => typeof x === 'number'), JSON.stringify([...ids].slice(0, 8)));
    } finally { box.market = keep.market; box.low = keep.low; box.high = keep.high; V.HUNT.feed = keep.feed; V.LOCAL.shops = keep.shops; V.SEALED.kind = keep.kind; V.SEALED.q = keep.q; V.MODE.set('collect', false); V.go('home'); }
  }
}
}
