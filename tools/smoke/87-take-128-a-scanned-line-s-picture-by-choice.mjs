/* smoke section 87: take 128 — a scanned line\'s picture by choice (the owner\'s note): the photo or the catalogue\'s picture, a tap on the arrow or a swipe, kept per line
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 128 — a scanned line\'s picture by choice (the owner\'s note): the photo or the catalogue\'s picture, a tap on the arrow or a swipe, kept per line');
{
  /* the owner, 1 Oct: "give me the option to change the picture to the default SAMPLE picture instead of my own picture,
     arrow in the thumbnail that you can click or swipe ... and it'll save what you set it to, directly within your collection" */
  const keepItems = V.OWN.items.slice(), keepPF = V.PF.active; V.PF.active = 'main';
  /* a main set with plain numbers: the promo set's "1/1000" and reprinted numbers page the binder elsewhere */
  const withPic = V.CAT.rows.find(p => /^OP01-0\d\d$/.test(p.num) && !p.sealed && p.img && p.market > 0);
  const other = V.CAT.rows.find(p => /^OP01-0\d\d$/.test(p.num) && !p.sealed && p.img && p.set === withPic.set && p.num !== withPic.num);
  const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';
  const line = (p, photo) => ({ id: p.id, qty: 1, condition: 'NM', pf: 'main', game: 'optcg', photo, added: '2026-10-01T00:00:00.000Z', fav: false });
  V.OWN.items = [line(withPic, PHOTO), line(other, null)];
  V.MODE.set('collect', false); V.go('collection');   /* go() paints through the screen map (landmine 135) */
  const grid = () => ctx.document.getElementById('colGrid').innerHTML;
  const tileOf = (h, id) => { const i = h.indexOf('data-open="' + id + '"'); return i < 0 ? '' : h.slice(i, h.indexOf('</button>', i)); };
  const css128 = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  if (typeof V.linePic !== 'function' || typeof V.flipLine !== 'function' || typeof V.flipSwipe !== 'function') ok('take 128\'s picture rule, flip and swipe exist', false, [typeof V.linePic, typeof V.flipLine, typeof V.flipSwipe].join(' '));
  else {
    const own = V.linePic({ photo: PHOTO }, withPic), ref = V.linePic({ photo: PHOTO, pic: 'ref' }, withPic), none = V.linePic({ photo: null }, withPic, '<div class="ph">x</div>');
    ok('one rule says which picture a line shows: the photo, unless the line says the catalogue\'s (pic: \'ref\'); with no photo, the catalogue\'s over the fallback',
       /^<img src="data:image\/jpeg[^"]*" alt="">$/.test(own) && /class="ref/.test(ref) && !/data:image/.test(ref) && /^<div class="ph">x<\/div><img class="ref/.test(none), JSON.stringify({ own: own.slice(0, 60), ref: ref.slice(0, 40), none: none.slice(0, 50) }));
    let t = tileOf(grid(), withPic.id); const t2 = tileOf(grid(), other.id);
    ok('the scanned line\'s tile draws the photo, says "Your scan", and carries the arrow: a control named for what it shows next, keyboard-reachable',
       /<img src="data:image\/jpeg/.test(t) && /<span class="own">Your scan<\/span>/.test(t) && /<span class="flip" role="button" tabindex="0" data-act="flip" data-line="0" aria-label="Show the catalogue’s picture">/.test(t) && /#g-swap/.test(t), t.slice(0, 320));
    ok('...control: a line with no photo has no arrow and no badge, and draws the catalogue\'s picture', !!t2 && !/data-act="flip"/.test(t2) && !/Your scan/.test(t2) && /class="ref/.test(t2), t2.slice(0, 200));
    const stored = () => JSON.parse(store['vault.items'] || '[]');
    const flipped = V.flipLine(0); t = tileOf(grid(), withPic.id);
    ok('the flip puts the catalogue\'s picture on the tile, names the way back, and the line keeps the choice -- on the phone and in the backup, through the one commit path',
       flipped === true && /class="ref/.test(t) && !/data:image/.test(t) && !/Your scan/.test(t) && /aria-label="Show your scan"/.test(t)
       && V.OWN.items[0].pic === 'ref' && V.OWN.items[0].photo === PHOTO && stored()[0].pic === 'ref' && JSON.parse(V.backupJson()).items[0].pic === 'ref', JSON.stringify({ flipped, pic: V.OWN.items[0].pic, stored: stored()[0] && stored()[0].pic, tile: t.slice(0, 160) }));
    ok('...flipped back, the photo returns and the line is as it was: no field left behind, on the phone either', V.flipLine(0) === true && !('pic' in V.OWN.items[0]) && /data:image/.test(tileOf(grid(), withPic.id)) && !('pic' in stored()[0]), JSON.stringify(V.OWN.items[0]));
    ok('...a line with no photo does not flip, and a line that is not there does not throw', V.flipLine(1) === false && V.flipLine(99) === false && !('pic' in V.OWN.items[1]));
    ok('a sideways swipe flips; a short move, or one more up or down than across, is the page\'s', V.flipSwipe(60, 10) === true && V.flipSwipe(-45, 0) === true && V.flipSwipe(20, 0) === false && V.flipSwipe(30, 80) === false && V.flipSwipe(0, 60) === false);
    /* the binder honours the line's choice through the same rule (its set and page pinned to the line's: another section turned this set's pages) */
    const keepBN = { set: V.BN.set, pageOf: { ...V.BN.pageOf } }; V.BN.set = withPic.set; delete V.BN.pageOf[withPic.set];
    V.OWN.items[0].pic = 'ref'; V.paintBinder(); const bn = ctx.document.getElementById('bnGrid').innerHTML;
    ok('the binder\'s pocket shows what the line chose -- the catalogue\'s picture here -- through the same rule', new RegExp('data-open="' + withPic.id + '">\\s*<img class="ref').test(bn) && !/data:image/.test(bn), bn.slice(0, 200));
    delete V.OWN.items[0].pic; V.paintBinder();
    ok('...control: without the choice the pocket shows the photo', new RegExp('data-open="' + withPic.id + '">\\s*<img src="data:image/jpeg').test(ctx.document.getElementById('bnGrid').innerHTML));
    V.BN.set = keepBN.set; V.BN.pageOf = keepBN.pageOf;
    ok('the stylesheet gives the arrow a 44 px target at the picture\'s corner (take 108), keeps up-and-down for the page, and keeps the browser\'s own image drag off the picture (the look)', /\.art \.flip\{[^}]*width:44px;height:44px/.test(css128) && /\.tile \.art\{[^}]*touch-action:pan-y/.test(css128) && /\.tile \.art img\{-webkit-user-drag:none;user-select:none\}/.test(css128));
  }
  V.OWN.items = keepItems; V.PF.active = keepPF; V.OWN.save(); V.go('home');
}
}
