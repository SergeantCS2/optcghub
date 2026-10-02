/* smoke section 75: take 116 — the first-open experience: the opening screen and the guide share the listing\'s frame; four pages; Back closes the guide, Next pages it
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 116 — the first-open experience: the opening screen and the guide share the listing\'s frame; four pages; Back closes the guide, Next pages it');
{ ok('the splash and the guide draw one scene: the listing\'s Prussian band, buff sky, ink and green, as literals on both', /#splash,#tour\{--t-prussian:#1f3d72;/.test(html) && /#splash\{[^}]*linear-gradient\(180deg,#1f3d72/.test(html) && /#tour\{[^}]*linear-gradient\(180deg,var\(--t-prussian\)/.test(html));
  ok('the opening screen carries the app\'s own icon file and the sea; the guide the same sea and, on its last page, the same icon', (html.match(/bundle\/icon\.svg/g) || []).length === 1 && (html.match(/class="gsea"/g) || []).length === 2 && (js.match(/bundle\/icon\.svg/g) || []).length === 1);
  ok('the guide is a dialog, not a screen: role, modal, a name, focusable so its name is read out, and still a div (twenty sections stay twenty)', /<div id="tour" hidden role="dialog" aria-modal="true" aria-label="Welcome to OP TCG Hub" tabindex="-1">/.test(html) && !/<section id="tour"/.test(html));
  ok('the guide is an overlay by class: #tour.on shows it, [hidden] wins after it, and the four buttons hide by attribute', /#tour\.on\{display:flex\}\s*#tour\[hidden\]\{display:none\}\s*#tour \[hidden\]\{display:none\}/.test(html));
  const tourCss = [...html.matchAll(/#tour[^{]*\{[^}]*\}/g)].map(m => m[0]);
  ok('every rule of the guide is token-sized: no font-size literal (the old 32, 22, 14.5 and 13.5 px are gone)', tourCss.length >= 20 && tourCss.every(r => !/font-size:\d/.test(r)), tourCss.filter(r => /font-size:\d/.test(r)).join(' | '));
  ok('a page scrolls inside itself on a short screen instead of clipping (overflow-y:auto, not hidden)', /#tour \.gcard\{[^}]*overflow-y:auto/.test(html) && !/#tour \.gcard\{[^}]*overflow:hidden/.test(html));
  ok('the dots are indicators (four 44 px targets seven pixels apart would sit on each other) and the page is read out', /#tour \.gdots i\{/.test(html) && /id="tourDots" aria-hidden="true"/.test(html) && /id="tourPage" aria-live="polite"/.test(html) && !/#tour \.gdots button/.test(html));
  ok('four pages, one per mode and one for what stays on the phone; the pictures are lookups, never pinned ids (AGENTS rule 3)', V.GUIDE.length === 4 && V.GUIDE.every(c => c.g && c.t && c.p && Array.isArray(c.l) && c.l.length >= 3) && /pic: \(\) => topCard\(\)/.test(js) && /pic: \(\) => \(heroLeader\(\) \|\| \{\}\)\.L/.test(js) && /pic: \(\) => \(newestTop\(\) \|\| \{\}\)\.p/.test(js) && !/pic: \(\) => [A-Za-z.]*byId\.get\(\d/.test(js));
  const pics = V.GUIDE.map(c => c.pic ? c.pic() : null);
  ok('the three pictures resolve to printings with a picture: the dearest card, a Leader, the newest set\'s top card', !!pics[0] && !!pics[0].img && !!pics[1] && pics[1].type === 'Leader' && !!pics[2] && !!pics[2].img && pics[3] === null, pics.map(p => p ? p.name + ' ' + (p.num || '') : 'none').join(' / '));
  ok('the dearest card is the top of every set\'s top', !!pics[0] && pics[0].market === Math.max(...V.CAT.rows.filter(p => !p.sealed && p.hash && p.market > 0 && p.img).map(p => p.market)));
  const tour = ctx.document.getElementById('tour');
  V.guideOpen();
  const cardsHtml = ctx.document.getElementById('tourCards').innerHTML;
  ok('open: the guide is on and not hidden, four pages painted, three with a picture and the fourth with the app\'s own card', tour.classList.contains('on') && tour.hidden === false && (cardsHtml.match(/class="gcard"/g) || []).length === 4 && (cardsHtml.match(/<img class="ref"/g) || []).length >= 3 && /class="pic own"/.test(cardsHtml));
  ok('the glyph on each page is read through the form the sprite check knows (G(c.g, 64))', (js.match(/G\(c\.g, 64\)/g) || []).length === 2);
  ok('page 1: Skip and Next shown, the last page\'s two hidden; one dot on; the page announced', ctx.document.getElementById('tourSkip').hidden === false && ctx.document.getElementById('tourNext').hidden === false && ctx.document.getElementById('tourStart').hidden === true && (ctx.document.getElementById('tourDots').innerHTML.match(/class="on"/g) || []).length === 1 && ctx.document.getElementById('tourPage').textContent === 'Page 1 of 4');
  V.guideGo(3);
  ok('the last page: Scan a card and Look around first shown, Skip and Next hidden, the fourth dot on', ctx.document.getElementById('tourStart').hidden === false && ctx.document.getElementById('tourLook').hidden === false && ctx.document.getElementById('tourSkip').hidden === true && /<i class=""><\/i><i class=""><\/i><i class=""><\/i><i class="on"><\/i>/.test(ctx.document.getElementById('tourDots').innerHTML) && ctx.document.getElementById('tourPage').textContent === 'Page 4 of 4');
  V.guideGo(4); V.guideGo(-1);
  ok('a page past either end is refused', ctx.document.getElementById('tourPage').textContent === 'Page 4 of 4');
  /* Back (landmine 201): the overlay walk sees the guide now, and closes it unseen */
  try { ctx.localStorage.removeItem('optcghub.guide.v3'); } catch (e) {}
  const closed = V.closeAnyOverlay();
  ok('Back closes the open guide through the overlay walk (it could not see it before: it looked for a class the guide never carried) and leaves it unseen', closed === true && tour.hidden === true && !tour.classList.contains('on') && (ctx.localStorage.getItem('optcghub.guide.v3') || null) === null);
  ok('...control: with the guide closed the walk has nothing to close', V.closeAnyOverlay() === false);
  V.guideOpen(); V.guideClose(true);
  ok('Skip or Start marks the guide seen under the v3 key', ctx.localStorage.getItem('optcghub.guide.v3') === '1' && tour.hidden === true);
  /* Next cannot be undone by the strip's own scroll (landmine 202): the handler reads, it never scrolls */
  const handler = (js.match(/#tourCards'\)\.addEventListener\('scroll', \(\) => \{[\s\S]*?\n\}\);/) || [''])[0];
  ok('the strip\'s scroll handler only reads the page back: it never calls scrollTo, and the one scroller is guidePaint (watched red on take 114, whose handler painted the page back from inside the scroll)', handler.length > 100 && !/scrollTo/.test(handler) && !/guidePaint\(\)/.test(handler) && /behavior: reducedMotion\(\) \? 'auto' : 'smooth'/.test(js) && (js.match(/cards\.scrollTo\(/g) || []).length === 1, handler.slice(0, 80));
  /* Scan a card: into Collect's scanner with Home under it */
  V.MODE.set('hunt', false); V.guideOpen();
  let started = null; try { V.guideStart(); started = true; } catch (e) { started = String(e && e.stack || e); }
  ok('Scan a card from any mode lands in Collect\'s scanner with Home under it, the guide seen', started === true && V.MODE.cur === 'collect' && V.NAV.stack.slice(-2).join(',') === 'home,scan' && tour.hidden === true, String(started).slice(0, 200) + ' ' + V.NAV.stack.join('>'));
  while (V.closeAnyOverlay()) {} V.MODE.set('collect', false); V.go('home'); }
}
