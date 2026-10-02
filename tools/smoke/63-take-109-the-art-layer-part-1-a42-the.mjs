/* smoke section 63: take 109 — the art layer, part 1 (A42): the picture measured, Decks under its Leader, the ready-made decks back on Decks, a deck\'s Leader large, a card\'s own page over its own colours
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 109 — the art layer, part 1 (A42): the picture measured, Decks under its Leader, the ready-made decks back on Decks, a deck\'s Leader large, a card\'s own page over its own colours');
{ const man = V.CAT.man, keepImg = man.images, nof = () => undefined;
  /* an older build lacks these: each check then fails on its own instead of the run stopping */
  const largeOk = V.largeOk || nof, artUrl = V.artUrl || nof, artColours = V.artColours || (() => []), paintBack = V.paintBack || nof, heroLeader = V.heroLeader || (() => ({}));
  const hesc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));   // the app's own esc
  const first = p => !p.sealed && /_200w\.jpg$/.test(p.img || '');
  const two = V.CAT.rows.find(p => first(p) && /^[A-Z][a-z]+;[A-Z][a-z]+$/.test(p.color || ''));
  const one = V.CAT.rows.find(p => first(p) && /^(Red|Green|Blue|Purple|Black|Yellow)$/.test(p.color || ''));
  const prod = V.CAT.rows.find(p => p.sealed && p.img), alt = V.CAT.rows.find(p => /product-images\.tcgplayer\.com/.test(p.img || ''));
  /* the large size: the printing's own URL, only when this build measured it */
  man.images = { ...(keepImg || {}), large: { suffix: '_in_1000x1000', probed: 40, served: 40, w: 600, h: 838, min_w: 408 } };
  ok('measured: the large picture is the printing\'s own URL with the size swapped (AGENTS rule 3)',
     largeOk() && artUrl(one, 'large') === one.img.replace(/_200w\.jpg$/, '_in_1000x1000.jpg') && artUrl(one) === one.img, artUrl(one, 'large'));
  ok('...a second-host picture keeps its own URL, and a printing without a picture has none', (!alt || artUrl(alt, 'large') === alt.img) && artUrl({ num: 'OP01-001' }, 'large') === '');
  man.images = { ...(keepImg || {}), large: { suffix: '_in_1000x1000', probed: 40, served: 3, w: 600, h: 838, min_w: 600 } };
  ok('...control: a build where the large size mostly failed keeps the thumbnail', !largeOk() && artUrl(one, 'large') === one.img);
  man.images = { ...(keepImg || {}), large: {} };
  ok('...control: a build that did not measure it keeps the thumbnail (a VM without the image hosts)', !largeOk() && artUrl(one, 'large') === one.img);
  const byNum = f => /\.num\b|\bnumber\b/.test(String(f));
  ok('the picture\'s address is never made from a card number', typeof V.artUrl === 'function' && !byNum(V.artUrl) && !byNum(V.largeOk));
  ok('...control: an address made from the number is caught', byNum(p => `https://x/${p.num}.png`));
  /* take 110: read against the sidecar the hash step wrote -- the runner measures on every build; a
     session that restored the nightly's copy (landmine 116) builds with what the nightly measured */
  const side109 = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/hashes.json'), 'utf8')).large || {}; } catch { return null; } })();
  ok('this build\'s own manifest carries what the hash step measured, as it measured it -- on the runner, which always measures, served of 40 at the large size',
     side109 !== null && keepImg && JSON.stringify(keepImg.large) === JSON.stringify(side109) && (!process.env.GITHUB_ACTIONS || (typeof side109.served === 'number' && side109.suffix === '_in_1000x1000')), JSON.stringify(keepImg && keepImg.large) + ' vs ' + JSON.stringify(side109));
  man.images = { ...(keepImg || {}), large: { suffix: '_in_1000x1000', probed: 40, served: 40, w: 600, h: 838, min_w: 408 } };
  /* the ground under the art: the card's own colours, never a generic tint */
  const cv = c => `var(--c-${c.toLowerCase()})`, [c1, c2] = two.color.split(';');
  const own = (p, got) => !p.color ? got[0] === 'var(--brass2)' : got[0] === cv(p.color.split(';')[0]) && (p.color.includes(';') ? got[1] === cv(p.color.split(';')[1]) : got[1].includes(cv(p.color)));
  ok('the ground is the card\'s own colours: both of a two-colour card, the one and its shade for one colour, the mode\'s for a product',
     own(two, artColours(two)) && artColours(two)[1] === cv(c2) && own(one, artColours(one)) && /color-mix\(in srgb,var\(--c-/.test(artColours(one)[1]) && own(prod, artColours(prod)), JSON.stringify([artColours(two), artColours(one)]));
  ok('...control: a generic tint is caught', !own(one, ['var(--brass2)', 'var(--card2)']));
  { const db = ctx.document.querySelector('#dBack'); paintBack(db, two);
    ok('a card\'s own page: the backdrop takes that card\'s colours and its blurred thumbnail, cut above the stamp',
       db.style.cssText === `--a1:${cv(c1)};--a2:${cv(c2)}` && db.innerHTML.includes(`src="${two.img}"`) && /<img class="above"/.test(db.innerHTML), db.style.cssText);
    V.openDetail(one.id);
    ok('...openDetail paints it, and the card itself is the large picture with its thumbnail to fall back to',
       db.innerHTML.includes(one.img) && ctx.document.querySelector('#dArt').innerHTML.includes(one.img.replace(/_200w\.jpg$/, '_in_1000x1000.jpg')) && ctx.document.querySelector('#dArt').innerHTML.includes(`data-thumb="${one.img}"`)); }
  ok('the page itself: the backdrop first, the card centred in its own row, the old 112 px column gone',
     /<section id="detail" class="screen detail">\s*<div class="artbg dback" id="dBack" aria-hidden="true"><\/div>\s*<header class="appbar">/.test(html) && /<div class="dhero"><div class="art" id="dArt"><\/div><\/div>/.test(html) && !/id="dArt" style="width:112px/.test(html));
  /* the stamp: anything shown as art rather than as the card is cut to the card's top 42 % */
  ok('the stamp band is never shown as art: img.above cuts every art picture to the card\'s top 42 % (landmine 151)',
     /img\.above\{object-view-box:inset\(0 0 58% 0\)\}/.test(html) && (js.match(/<img class="above\$\{artOk\(/g) || []).length === 2);   /* take 110's review: artBack and paintBack, each with its loaded mark */
  ok('...control: an art picture without the cut is caught', !/<img class="above"/.test('<img class="blur" alt="">'));
  /* Decks: the hero, its Leader, the counts; Home has none (the owner's ruling) */
  const heroes = [...html.matchAll(/<section id="([\w-]+)"[^>]*>\s*<div class="arthero"/g)].map(m => m[1]);
  ok('the art hero sits above the header on Decks (and, from take 110, Sealed) and nowhere else -- none on Home (the owner: "I don\'t really like A in collect")', heroes.slice().sort().join() === 'decks,sealed', heroes.join());
  ok('...control: a hero put on Home is caught', [...html.replace('<section id="home" class="screen on">', '<section id="home" class="screen on">\n  <div class="arthero" id="hmHero" hidden></div>').matchAll(/<section id="([\w-]+)"[^>]*>\s*<div class="arthero"/g)].map(m => m[1]).includes('home'));
  const keepDecks = V.DECKS.list.slice(); const st0 = V.CAT.stock[0], L1 = V.CAT.byId.get(st0.leader), L2 = V.CAT.byId.get(V.CAT.stock[1].leader);
  V.DECKS.list.length = 0; V.DECKS.list.push({ id: 'd1', name: 'old', leader: L1.id, cards: [], created: 1 }, { id: 'd2', name: 'new', leader: L2.id, cards: [], created: 2 });
  ok('the hero features the newest of the collector\'s decks that has a Leader, by printing id', heroLeader().L === L2 && /your newest deck/.test(heroLeader().why));
  V.DECKS.list[1].leader = null;
  ok('...control: the newest deck without a Leader passes it to the one before', heroLeader().L === L1);
  V.DECKS.list.length = 0;
  ok('...with no deck of the collector\'s own, a ready-made deck\'s Leader', heroLeader().L === L1 && /ready-made/.test(heroLeader().why));
  V.DECKS.list.push({ id: 'd3', name: 'mine', leader: L2.id, cards: [], created: 3 });
  V.paintDecks(); const hero = ctx.document.querySelector('#dkHero');
  ok('...painted: the Leader\'s art blurred on its colours, and nothing over it -- no card rising from behind the title, no line of text (take 110, the owner\'s word)',
     hero.hidden === false && /^<div class="artbg" aria-hidden="true" style="--a1:/.test(hero.innerHTML) && hero.innerHTML.includes(`src="${L2.img}"`) && !/class="peek"/.test(hero.innerHTML) && !hero.innerHTML.includes('_in_1000x1000')
     && !/<p\b/.test(hero.innerHTML) && !hero.innerHTML.includes(hesc(L2.name)), hero.innerHTML.slice(0, 160));
  ok('...the line under the title counts the decks and the legal ones', /^1 deck \u00b7 [01] legal$/.test(ctx.document.querySelector('#dkSub').textContent), ctx.document.querySelector('#dkSub').textContent);
  V.DECKS.list.length = 0; const keepStock = V.CAT.stock; V.CAT.stock = []; V.paintDecks();
  ok('...control: with no Leader anywhere the hero hides and the plain header stands', hero.hidden === true && hero.innerHTML === '');
  V.CAT.stock = keepStock; V.DECKS.list.push(...keepDecks); V.paintDecks();
  ok('the slider\'s fade steps aside only while a screen with art is at the top, from a passive scroll listener',
     /:root\.at-top:has\(\.screen\.on > \.arthero:not\(\[hidden\]\)\) \.modebar,\s*:root\.at-top:has\(\.screen\.on > \.artbg\) \.modebar\{background:transparent\}/.test(html)
     && /addEventListener\('scroll', atTop, \{ passive: true \}\)/.test(js));
  ok('the hero keeps its height in the flow and only its art reaches up behind the slider (a negative margin would move the screen)',
     /\.arthero\{position:relative;height:var\(--hero-h\)\}/.test(html) && /\.arthero > \.artbg\{position:absolute;[^}]*top:calc\(-1 \* \(var\(--modebar-h\) \+ var\(--sat\)\)\)/.test(html));
  ok('the art fades into the page\'s own ground by a mask -- a scrim ending in a flat --bg drew a seam across the textured page (the take-109 look)',
     /\.artbg\{[^}]*mask-image:linear-gradient\(#000 55%,transparent\)/.test(html) && !/\.artbg::after\{[^}]*var\(--bg\)\)/.test(html));
  { V.openDetail(prod.id); const pa = ctx.document.querySelector('#dArt'); const isProd = pa.classList.contains('product'); V.openDetail(one.id);
    ok('a product\'s photo fits whole on its page (square on white, not cut at both sides); a card\'s fills its frame',
       isProd && !pa.classList.contains('product') && /\.dhero \.art\.product img\{object-fit:contain\}/.test(html)); }
  /* a deck, one level down: the Leader large */
  { const d = { id: 'dL', name: 'Leader test', leader: L1.id, cards: [], created: 9 }; V.DECKS.list.push(d); V.openDeck('dL');
    const ln = ctx.document.querySelector('#dkLeadLine').innerHTML, ld = ctx.document.querySelector('#dkLead').innerHTML;
    ok('a deck\'s Leader at 96 px from the large picture, its name in the display face, its number, Life and colours',
       /\.dkhead \.lead\{width:96px;flex:0 0 96px/.test(html) && ld.includes(L1.img.replace(/_200w\.jpg$/, '_in_1000x1000.jpg')) && ln.startsWith(`<b>${hesc(L1.name)}</b><span class="meta">${hesc(L1.num)} \u00b7 Leader`) && /Life<\/span>/.test(ln)
       && /\.dklead b\{display:block;font-family:var\(--display\)/.test(html) && /\.dklead \.meta\{display:block/.test(html) && !/\.dklead span\{/.test(html), ln.slice(0, 120));
    V.DECKS.list.splice(V.DECKS.list.indexOf(d), 1); V.go('decks'); }
  man.images = keepImg; }
}
