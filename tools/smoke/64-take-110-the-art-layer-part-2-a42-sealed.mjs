/* smoke section 64: take 110 — the art layer, part 2 (A42): Sealed under the newest set\'s top card, each set\'s own art on its heading, each Leader behind its side of the Play counter, the owner\'s own pictures, and the three texts the owner asked gone
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 110 — the art layer, part 2 (A42): Sealed under the newest set\'s top card, each set\'s own art on its heading, each Leader behind its side of the Play counter, the owner\'s own pictures, and the three texts the owner asked gone');
{ const man = V.CAT.man, keepImg = man.images, keepUser = man.user, keepRows = V.CAT.rows, nof = () => null;
  /* an older build lacks these: each check then fails on its own instead of the run stopping */
  const setTop = V.setTop || nof, newestTop = V.newestTop || nof, paintSealedHero = V.paintSealedHero || (() => {}), artUrl = V.artUrl || (p => p.img);
  man.images = { ...(keepImg || {}), large: { suffix: '_in_1000x1000', probed: 40, served: 40, w: 600, h: 838, min_w: 408 } };
  /* the owner: "remove this text when you get the chance - all of it" */
  const quiet = t => !/class="credit"/.test(t) && !/id="dCondNote"/.test(t) && !/COND_NOTE_(CARD|SEALED)/.test(t) && !/legal decks built from the starter-deck sets/.test(t);
  ok('the three texts the owner asked gone are gone: the line under the art, the paragraph under the ready-made decks\' heading, the note under a card\'s conditions', quiet(html + js));
  ok('...control: each of the take-109 lines is caught', !quiet('<p class="credit">OP10-001 Smoker</p>') && !quiet('<div class="note" id="dCondNote">') && !quiet("const COND_NOTE_CARD = '';") && !quiet('17 legal decks built from the starter-deck sets'));
  ok('...the per-condition gap is still said: in More\'s "What this app does not know", on the trade screen and in the bulk picker (the honesty the note carried)',
     /What this app does not know/.test(js) && /Condition does not change the price shown/.test(js) && /Condition is not priced in/.test(js) && /never multiplied into it/.test(js));
  { const c = V.CAT.rows.find(p => !p.sealed && p.market > 0), b = V.CAT.rows.find(p => V.SEALED.isProduct(p));
    V.openDetail(c.id); const lc = ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, ''); V.openDetail(b.id); const lb = ctx.document.getElementById('dCond').innerHTML.replace(/<[^>]+>/g, ''); V.go('home');
    ok('...a card\'s page still names its condition on its line, and a sealed product\'s still says it has none', /^Condition · /.test(lc) && lb === 'No condition to record', `${lc} | ${lb}`); }
  /* a set's top card: its most valuable printing whose picture the runner fetched (a hash), by printing id */
  const hashed = V.CAT.rows.filter(p => !p.sealed && p.hash && p.market > 0 && p.img);
  const sid = hashed[0].set, want = hashed.filter(p => p.set === sid).reduce((a, p) => p.market > a.market ? p : a);
  ok('a set\'s top card is its most valuable printing with a fetched picture', setTop(sid) === want, `${setTop(sid)?.id} vs ${want.id}`);
  V.CAT.rows = [...keepRows, { ...want, id: -110, hash: '', market: want.market * 10 }];
  ok('...control: a dearer printing whose picture never served (no hash) is passed over', setTop(sid) === want);
  V.CAT.rows = [...keepRows, { ...want, id: -110, market: want.market * 10 }];
  ok('...control: the same printing with its picture takes the place -- the kept answer follows a new catalogue', setTop(sid)?.id === -110);
  V.CAT.rows = keepRows;
  ok('...and the catalogue restored gives the set\'s own top card again', setTop(sid) === want);
  /* Sealed's banner card: the newest booster set already out that has one */
  const today = new Date().toISOString().slice(0, 10);
  const mains = [...V.CAT.sets.values()].filter(t => t.kind === 'main' && t.pub && t.pub <= today && setTop(t.id)).sort((a, b) => b.pub.localeCompare(a.pub));
  const nt = newestTop() || {};
  ok('Sealed\'s banner card is the top card of the newest booster set already out', !!mains.length && nt.set === mains[0] && nt.p === setTop(mains[0].id), `${nt.set?.abbr} ${nt.set?.pub} vs ${mains[0]?.abbr} ${mains[0]?.pub}`);
  const fut = { id: -1101, name: 'Not out yet', abbr: 'OP99', kind: 'main', pub: '2099-01-01', n: 1 };
  V.CAT.sets.set(fut.id, fut); V.CAT.rows = [...keepRows, { ...want, id: -1102, set: fut.id }];
  ok('...control: a set not out yet is passed over though it has a top card -- and taken on the day it is out', (newestTop() || {}).set === mains[0] && (newestTop('2099-12-31') || {}).set === fut);
  fut.pub = today; V.CAT.rows = keepRows;
  ok('...control: a set out today with no card picture yet is passed over', !!mains.length && (newestTop() || {}).set === mains[0]);
  V.CAT.sets.delete(fut.id);
  V.MODE.set('hunt', false); paintSealedHero(); const sh = ctx.document.querySelector('#sealedHero');
  ok('Sealed opens under it: crisp, at the large size with the thumbnail to fall back to, cut above the stamp (landmine 151), no line of text',
     sh.hidden === false && sh.innerHTML.startsWith('<div class="artbg crisp"') && !!nt.p && sh.innerHTML.includes(`src="${artUrl(nt.p, 'large')}"`) && (artUrl(nt.p, 'large') === nt.p.img || sh.innerHTML.includes(`data-thumb="${nt.p.img}"`))
     && /<img class="above"/.test(sh.innerHTML) && !/<p\b/.test(sh.innerHTML), sh.innerHTML.slice(0, 200));
  ok('...where Decks\' stands: above the header, the title in A\'s slot', /<section id="sealed" class="screen">\s*<div class="arthero" id="sealedHero" hidden><\/div>\s*<header class="appbar">/.test(html));
  ok('...the crisp layer: the picture sharp and filling the band, its character in view', /\.artbg\.crisp img\{left:0;top:0;width:100%;height:100%;object-fit:cover;filter:none;object-position:50% 30%\}/.test(html));
  V.CAT.rows = keepRows.filter(p => !p.hash); paintSealedHero();
  ok('...control: with no card picture in any set the banner hides and the plain header stands', sh.hidden === true && sh.innerHTML === '');
  V.CAT.rows = keepRows;
  /* the owner's own pictures (assets/user; the folder's README) */
  man.user = ['hero-hunt.jpg']; paintSealedHero();
  ok('the owner\'s hero-hunt.jpg stands in for Sealed\'s card when supplied, uncut (it is not a card)', /src="bundle\/user\/hero-hunt\.jpg"/.test(sh.innerHTML) && /<img class="own"/.test(sh.innerHTML) && !/class="above"/.test(sh.innerHTML), sh.innerHTML.slice(0, 160));
  man.user = ['hero-play.jpg']; V.paintDecks(); paintSealedHero(); const dh = ctx.document.querySelector('#dkHero');
  ok('...and hero-play.jpg for Decks; each only on its own screen', /src="bundle\/user\/hero-play\.jpg"/.test(dh.innerHTML) && !/bundle\/user\//.test(sh.innerHTML) && !!nt.p && sh.innerHTML.includes(artUrl(nt.p, 'large')));
  /* the owner: "the blurred background should also be zoomed out a bit where it's used so it's more
     focused on the center of the art" -- the band above the stamp whole, not cut to cover the box */
  const zoomed = t => /\.artbg img\{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;object-position:50% 50%;/.test(t) && /\.artbg\.dback img\{object-position:50% 0\}/.test(t) && /\.artbg\.crisp img\{[^}]*object-fit:cover/.test(t);
  ok('the blurred art zooms out: the band above the stamp whole at the box\'s width, at the top of a card\'s page; the sharp art still fills its band', zoomed(html));
  ok('...control: take 109\'s blur, cut to cover the box past its edges, is caught', !zoomed(html.replace(/\.artbg img\{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;/, '.artbg img{position:absolute;left:-24px;top:-24px;width:calc(100% + 48px);height:calc(100% + 48px);object-fit:cover;')));
  ok('...and no card rises from behind the Decks title: the peek is gone, style and all (the owner: "I don\'t like the little peak")', !/class="peek"/.test(js) && !/\.peek\b/.test(html));
  { const keepD = V.DECKS.list.slice(), keepS = V.CAT.stock; V.DECKS.list.length = 0; V.CAT.stock = []; V.paintDecks();
    ok('...and with no Leader anywhere hero-play.jpg still stands on Decks, as hero-hunt.jpg does on Sealed (the review: Decks\' hid it)', dh.hidden === false && /src="bundle\/user\/hero-play\.jpg"/.test(dh.innerHTML), dh.innerHTML.slice(0, 120));
    man.user = keepUser; V.paintDecks();
    ok('...control: without it and with no Leader, the hero hides', dh.hidden === true && dh.innerHTML === '');
    V.CAT.stock = keepS; V.DECKS.list.push(...keepD); }
  { const AOK = ctx.ART_OK || new Set();   /* an older build has none: the check then fails on its own */
    const pa = V.CAT.rows.find(q => !q.sealed && q.img), before = V.artBack(pa); AOK.add(pa.img); const after = V.artBack(pa), own = V.ownBack('hero-hunt.jpg'); AOK.add('bundle/user/hero-hunt.jpg'); const own2 = V.ownBack('hero-hunt.jpg');
    AOK.delete(pa.img); AOK.delete('bundle/user/hero-hunt.jpg');
    ok('a picture that loaded once is drawn at once when its screen repaints (the review: a keystroke in Sealed\'s search faded every strip in again)',
       /<img class="above ok" /.test(after) && /<img class="own ok" /.test(own2) && /onload="this\.classList\.add\('ok'\);window\.ART_OK\.add\(this\.getAttribute\('src'\)\)"/.test(after), after.slice(0, 160));
    ok('...control: a picture never loaded starts from nothing and fades in', /<img class="above" /.test(before) && /<img class="own" /.test(own)); }
  man.user = keepUser; V.paintDecks(); paintSealedHero();
  ok('...control: without them, the card art on both', !/bundle\/user\//.test(dh.innerHTML + sh.innerHTML) && /<div class="artbg"/.test(dh.innerHTML) && /<div class="artbg crisp"/.test(sh.innerHTML));
  /* each set's heading in Sealed: a strip under that set's own top card */
  const key = v => isNaN(+v) ? v : +v;
  const stripsOf = src => [...src.matchAll(/<button class="fgrp setstrip" data-setfold="([^"]+)" aria-expanded="[^"]*">(<div class="artbg crisp"[^>]*>(?:<img [^>]*>)?<\/div>)?/g)];
  V.SEALED.q = ''; V.SEALED.kind = 'all'; V.paintSealed(); const strips = stripsOf(ctx.document.querySelector('#sealedList').innerHTML);
  const topOf = m => m[1] === 'decks' ? V.CAT.rows.filter(p => V.SEALED.isProduct(p) && V.SEALED.kindOf(p) === 'deck').sort((a, b) => (V.CAT.sets.get(b.set)?.pub || '').localeCompare(V.CAT.sets.get(a.set)?.pub || '') || a.name.localeCompare(b.name)).map(p => setTop(p.set)).find(Boolean) : setTop(key(m[1]));
  ok('every heading in Sealed is a strip -- the starter decks\' too -- carrying its own set\'s top card, crisp; a set with no card picture keeps the plain ground',
     strips.length >= 10 && strips[0][1] === 'decks' && strips.every(m => !!m[2] === !!topOf(m)) && strips.filter(m => m[2]).length >= 5 && strips.filter(m => m[2]).every(m => m[2].includes(`src="${artUrl(topOf(m), 'large')}"`) && /<img class="above"/.test(m[2])),
     `${strips.length} strips, ${strips.filter(m => m[2]).length} with art`);
  V.CAT.rows = keepRows.filter(p => !p.hash); V.paintSealed();
  const plain = stripsOf(ctx.document.querySelector('#sealedList').innerHTML);
  ok('...control: with no card pictures every strip keeps the plain ground', plain.length >= 10 && plain.every(m => !m[2]));
  V.CAT.rows = keepRows; V.paintSealed();
  ok('...a strip\'s date never breaks at its own hyphens (the take-110 look found "2026-10-" over "30")', /\.setstrip \.note\{[^}]*white-space:nowrap/.test(html));
  ok('...the art fills the strip behind the name, under a scrim from the left so the name reads', /\.setstrip > \.artbg\{position:absolute;inset:0;/.test(html) && /\.setstrip > \.artbg::after\{background:linear-gradient\(90deg,rgba\(0,0,0,\.8\)/.test(html) && /\.setstrip > span\{position:relative;color:#fff/.test(html));
  /* the Play counter: each player's Leader behind their side */
  const keepP = V.PLAY.p.map(pl => ({ ...pl })), keepHot = V.PLAY.hotseat, Lp = V.CAT.byId.get(V.CAT.stock[0].leader);
  V.PLAY.hotseat = false; V.PLAY.p[0].leader = Lp.id; V.PLAY.p[1].leader = null; V.paintPlay();
  const panels = ctx.document.querySelector('#plBoard').innerHTML.split('<div class="panel plpanel"').slice(1);
  ok('the Play counter: a player\'s Leader faint behind their side, blurred from its thumbnail, cut above the stamp', panels.length === 2 && panels[0].includes('<div class="artbg" aria-hidden="true"') && panels[0].includes(`src="${Lp.img}"`) && /<img class="above"/.test(panels[0]), (panels[0] || '').slice(0, 200));
  ok('...control: a side with no Leader chosen keeps the plain panel', panels.length === 2 && !/class="artbg/.test(panels[1]));
  ok('...faint, the numbers and buttons drawn over it', /\.plpanel > \.artbg\{position:absolute;inset:0;opacity:\.6\}/.test(html) && /\.plpanel > :not\(\.artbg\)\{position:relative\}/.test(html));
  /* the Play counter's three steppers on a 360 px phone: take 108's 44 px buttons needed 332 px, the panel has 296 */
  const fits = t => /\.plcols\{display:flex;gap:clamp\(6px,calc\(\(100vw - 330px\) \/ 8\),10px\);/.test(t) && /\.plcols \.stepper\{gap:clamp\(6px,calc\(\(100vw - 330px\) \/ 5\),16px\)\}/.test(t);
  ok('...its three steppers fit a 360 px phone: the gaps give way, the 44 px buttons keep their size', fits(html) && /<div class="plcols">/.test(js) && !/<div style="display:flex;gap:10px;margin-top:12px">/.test(js));
  ok('...control: the fixed gaps are caught', !fits('.plcols{display:flex;gap:10px;margin-top:12px}'));
  V.PLAY.p.forEach((pl, i) => Object.assign(pl, keepP[i])); V.PLAY.hotseat = keepHot; V.paintPlay();
  man.images = keepImg; V.CAT.rows = keepRows; V.MODE.set('collect', false); V.go('home'); }
}
