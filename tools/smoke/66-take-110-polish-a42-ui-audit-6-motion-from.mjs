/* smoke section 66: take 110 — polish (A42, UI-AUDIT §6): motion from the tokens, a sheet that rises, a mode switch that crossfades, one empty state, tabular figures, three thumbnail sizes
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 110 — polish (A42, UI-AUDIT §6): motion from the tokens, a sheet that rises, a mode switch that crossfades, one empty state, tabular figures, three thumbnail sizes');
{ /* motion: every duration a token, reduced motion honoured by one rule */
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  const literal = t => [...t.matchAll(/transition:[^;}]*?\b\d*\.?\d+m?s\b/g)].map(m => m[0]);
  ok('every transition takes its duration from the motion tokens (--dur-press, --dur-ui, --dur-sheet)', literal(css).length === 0 && /--dur-press:120ms; --dur-ui:220ms; --dur-sheet:320ms;/.test(css), literal(css).join(' | '));
  ok('...control: a take-109 literal (opacity .25s) is caught', literal('.art img.ref{opacity:0;transition:opacity .25s}').length === 1);
  ok('a sheet rises from the bottom edge as its scrim fades in, on --dur-sheet', /\.sheet\.on\{display:flex;animation:scrimIn var\(--dur-sheet\) ease-out\}/.test(css) && /\.sheet\.on \.sheetbody\{animation:sheetUp var\(--dur-sheet\)/.test(css) && /@keyframes sheetUp\{from\{transform:translateY\(100%\)\}\}/.test(css));
  ok('a mode switch slides, on a tap or a swipe only (take 119; take 110\'s crossfade until 118), and the class comes off so a later screen change does not slide', /:root\.mode-swap \.screen\.on\{animation:modeInR var\(--dur-ui\) cubic-bezier\(\.4,0,\.2,1\);/.test(css) && /root\.classList\.add\('mode-swap'\)/.test(js) && /MODE\._swap = setTimeout\(\(\) => \{ root\.classList\.remove\('mode-swap', 'swap-l'\); finishSlide\(\); \}, 400\)/.test(js) && /body\{[^}]*transition:background-color var\(--dur-ui\)/.test(css));
  ok('reduced motion stops every transition and animation (one rule, take 106)', /@media \(prefers-reduced-motion:reduce\)\{\*,\*::before,\*::after\{transition-duration:0s!important;animation-duration:0s!important/.test(css));
  /* one empty state */
  const bare = t => (t.match(/<div class="note">(Nothing matches\. Loosen a chip\.|Nothing wanted yet|No alerts yet|Nothing matched\.)/g) || []);
  ok('a list that fills a screen says it is empty one way: its glyph, what is missing, what to do', bare(js).length === 0 && (js.match(/emptyHtml\('/g) || []).length >= 6 && /\.empty \.empty-line\{/.test(css), bare(js).join(' | '));
  ok('...control: the take-109 bare lines are caught', bare('<div class="note">No alerts yet. Open a card</div><div class="note">Nothing matched.</div>').length === 2);
  { V.SEALED.q = 'zzzz no such product'; V.MODE.set('hunt', false); V.paintSealed(); const sl = ctx.document.querySelector('#sealedList').innerHTML; V.SEALED.q = ''; V.paintSealed(); V.MODE.set('collect', false); V.go('home');
    ok('...painted: Sealed with nothing matching shows the empty state with its glyph, under the stock panels (before take 110 it showed nothing: the panels filled the list and the fallback never ran)', /<div class="empty"><svg class="g" width="64" height="64"[^>]*><use href="#g-box"\/><\/svg><b class="empty-line">Nothing matches<\/b>/.test(sl), sl.slice(-220)); }
  /* numbers */
  ok('every number lines up: tabular figures are the body\'s default, not only .mono\'s', /body\{[^}]*font-variant-numeric:tabular-nums/.test(css));
  ok('a card\'s copy row is two lines: finish, condition and price, then the quantity by the condition buttons', /<div class="row dqrow">/.test(html) && /\.dqrow\{display:grid;grid-template-columns:minmax\(0,1fr\) auto;grid-template-areas:"nm v" "st st"/.test(css));
  ok('a condition\'s name never breaks in two on a card\'s page (the look had "Near" over "Mint")', /\.nw\{white-space:nowrap\}/.test(css) && (js.match(/'Condition · <span class="nw">'/g) || []).length === 2);
  /* three thumbnail sizes */
  const sized = t => [...t.matchAll(/\b(cardPic|productPic|setPic)\(([^)]*)\)/g)].filter(m => /\d/.test(m[2]) && !/THUMB\.[sml]/.test(m[2])).map(m => m[0]);
  ok('three thumbnail sizes, one per kind of list: 32 dense, 44 a row, 56 a sealed product -- no call names its own size', sized(js).length === 0 && /const THUMB = \{ s: 32, m: 44, l: 56 \};/.test(js) && /--thumb-s:32px; --thumb-m:44px; --thumb-l:56px;/.test(css)
     && /function cardPic\(p, w = THUMB\.m\)/.test(js) && /function productPic\(p, size = THUMB\.l\)/.test(js) && /function setPic\(s, w = THUMB\.m\)/.test(js), sized(js).join(' | '));
  ok('...control: a take-109 call with its own size is caught', sized('cardPic(p, 30) setPic(s, 36) productPic(p)').length === 2);
}
}
