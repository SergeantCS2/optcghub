/* smoke section 62: take 108 — controls and icons (A42): every icon a sprite symbol with one meaning, a 44 px target for every control, a pressed and a disabled look
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 108 — controls and icons (A42): every icon a sprite symbol with one meaning, a 44 px target for every control, a pressed and a disabled look');
{ /* one meaning per glyph: the three navs and the collection's actions, as a table */
  const NAV108 = { home: 'compass', search: 'spyglass', scan: 'scan', collection: 'collection', decks: 'cardback', cards: 'spyglass', play: 'life', sim: 'don',
                   sealed: 'box', releases: 'calendar', local: 'pin', events: 'trophy' };
  const ACT108 = { movers: 'trend', trade: 'rope', bulk: 'select', export: 'export', backup: 'backup', import: 'import', wants: 'bookmark', binder: 'binder' };
  const SAME = [['search', 'cards']];   // one meaning, two modes: find a card
  const GAME = ['stage', 'counter', 'blocker', 'trigger', 'rush', 'leader', 'character', 'event'];   // the game's own glyphs keep the game's meanings
  const glyphMap = src => { const m = {};
    for (const x of src.matchAll(/<nav id="nav\w+"[^>]*>([\s\S]*?)<\/nav>/g)) for (const b of x[1].matchAll(/<button data-go="(\w+)"[^>]*>[\s\S]*?#g-([\w-]+)"/g)) m['nav:' + b[1]] = b[2];
    const a = src.match(/<div class="actions">([\s\S]*?)<\/div>/); if (a) for (const b of a[1].matchAll(/data-act="(\w+)">[\s\S]*?#g-([\w-]+)"/g)) m['act:' + b[1]] = b[2];
    return m; };
  const misfits = src => { const m = glyphMap(src), bad = [];
    for (const [k, g] of Object.entries(NAV108)) if (m['nav:' + k] !== g) bad.push(`nav ${k}: ${m['nav:' + k]}`);
    for (const [k, g] of Object.entries(ACT108)) if (m['act:' + k] !== g) bad.push(`act ${k}: ${m['act:' + k]}`);
    const owners = {}; for (const [k, g] of Object.entries(m)) (owners[g] ||= new Set()).add(k.split(':')[1]);
    for (const [g, ks] of Object.entries(owners)) { const list = [...ks]; if (list.length > 1 && !SAME.some(p => list.every(x => p.includes(x)))) bad.push(`g-${g} means ${list.join(' and ')}`); }
    for (const [k, g] of Object.entries(m)) if (GAME.includes(g)) bad.push(`${k} borrows the game's g-${g}`);
    return bad; };
  ok('one meaning per glyph: each nav and action draws its own symbol, Search and Cards share the one for finding a card, the game\'s glyphs are the game\'s', misfits(html).length === 0, misfits(html).join('; '));
  /* take 115 (STAN-108-6): the first plant was '#g-scan"', which is Search's scan button first -- it planted nothing on the nav,
     and Releases and Events were never planted; each is now planted on its nav button's own markup, found once, and named */
  const plant107 = [['#g-scan"/></svg></span>Scan<', 'blocker', 'nav scan: blocker'], ['#g-collection"/></svg></span>Collection<', 'stage', 'nav collection: stage'],
    ['#g-box"/></svg></span>Sealed<', 'stage', 'nav sealed: stage'], ['#g-calendar"/></svg></span>Releases<', 'counter', 'nav releases: counter'], ['#g-trophy"/></svg></span>Events<', 'life', 'nav events: life']];
  const put107 = (s, [a, g]) => (s !== null && s.split(a).length === 2 ? s.replace(a, a.replace(/#g-[\w-]+"/, `#g-${g}"`)) : null);
  const all107 = plant107.reduce(put107, html), each107 = plant107.map(p => { const one = put107(html, p); return one !== null && misfits(one).includes(p[2]); });
  ok('...control: take 107\'s map is caught (Scan on Blocker, Collection and Sealed on Stage, Releases on Counter, Events on Life) -- each planted once on its nav button, and each misfit named',
     all107 !== null && plant107.every(p => misfits(all107).includes(p[2])) && each107.every(Boolean), JSON.stringify(each107));
  ok('...and a plant that is not on its nav button alone is refused, not counted (the bare \'#g-scan"\' is two buttons)', put107(html, ['#g-scan"', 'blocker']) === null);
  ok('every new symbol is in the sprite', ['scan', 'collection', 'box', 'calendar', 'trophy', 'bookmark', 'export', 'import', 'backup', 'select', 'trend', 'torch', 'photo', 'binder',
     'filter', 'star', 'undo', 'swap', 'refresh', 'more', 'chevron', 'external', 'minus', 'plus', 'check', 'bell'].every(g => new RegExp(`<symbol id="g-${g}" viewBox="0 0 24 24"`).test(html)));
  ok('Lucide\'s notices ship inside the app (an element, not a comment) and About credits them',
     /<metadata id="lucide-licence">ISC License/.test(html) && /Permission to use, copy, modify, and\/or distribute this software/.test(html) && /Permission is hereby granted, free of charge/.test(html) && /id="aboutIcons">Icons from Lucide \(ISC licence\) and Feather \(MIT licence\); their notices ship with the app\./.test(js));
  ok('the search bars\' buttons are 44 px icon buttons with names: scan, favourites (a toggle), filter and sort',
     /<button class="icb" data-go="scan" aria-label="Scan a card">/.test(html) && /<button class="icb" id="favOnly" aria-label="Show favourites only" aria-pressed="false">/.test(html) && (html.match(/<button class="icb" id="sortBtn(All)?" aria-label="Filter and sort">/g) || []).length === 2);
  ok('every stepper draws its minus and plus from the sprite, with a name each way', (js.match(/aria-label="(Life|DON!!|Given DON!!) down">\$\{G\('minus', 20\)\}/g) || []).length === 3 && /id="dMinus" aria-label="One fewer"><svg class="g"[^>]*><use href="#g-minus"/.test(html) && /data-trdec="\$\{side\}:\$\{p\.id\}" aria-label="One fewer/.test(js));
  ok('every toggle says whether it is on: favourites, owned only, this deck, the stock alert, the reminder', /\$\('#favOnly'\)[^\n]*setAttribute\('aria-pressed'/.test(js) && /id="dkOwn" aria-pressed="false">Owned only</.test(html) && /\$\('#cdForDeck'\)\.setAttribute\('aria-pressed'/.test(js) && /data-stock="\$\{p\.id\}"[^>]*aria-pressed=/.test(js) && /data-relalert=[^`]*aria-pressed=/.test(js));
  ok('the star and the bell leave their fill to the control (a symbol\'s own fill="none" beats the outside; the first picture of a pressed star was hollow)', /<symbol id="g-star" viewBox="0 0 24 24" stroke=/.test(html) && /<symbol id="g-bell" viewBox="0 0 24 24" stroke=/.test(html) && /svg\.g\{[^}]*fill:none\}/.test(html) && /const bell = \(on, size = 18\) => G\('bell', size, on \? 'fill:currentColor' : ''\)/.test(js));
  ok('the links drawn as ghost buttons centre their words like the buttons beside them (an inline display:inline-block had pinned them to the top)', !/<a class="ghost"[^>]*display:inline-block/.test(js) && /a\.ghost\{display:inline-flex;align-items:center/.test(html));
  { const fb = ctx.document.querySelector('#favOnly'); fb._ev.click({ target: fb, preventDefault() {} });
    ok('tapping favourites presses the star and says so', fb.getAttribute('aria-pressed') === 'true' && fb.classList.contains('on'));
    fb._ev.click({ target: fb, preventDefault() {} }); }
  /* a painter that names its own G (the distributor feed) must not call it for a glyph: the helpers close over the real one.
     Take 112: two such painters now (Sealed, the stock alert) -- Releases reads HUNT.dist() and names no G */
  const shadowed = [...js.matchAll(/const G = HUNT\.feed/g)].map(m => { const rest = js.slice(m.index); const end = rest.search(/\n\}\n/); return rest.slice(0, end < 0 ? 4000 : end); });
  ok('no painter that names its own G calls it for a glyph (a TypeError at the first paint); chev, ext, tick and bell close over the real one',
     shadowed.every(b => !/\bG\('/.test(b)) && /const chev = \(open, size = 16\) => G\('chevron'/.test(js) && /const bell = \(on, size = 18\) => G\('bell'/.test(js));   // take 115: none names one now (the A3 checks count them)
  { const planted = shadowed[0] || 'const G = HUNT.feed && HUNT.feed.sources && HUNT.feed.sources.gts;';
    ok('...control: a glyph call inside such a painter is caught', !/\bG\('/.test(planted) && /\bG\('/.test(planted + " G('chevron')")); }
  /* the targets and the states, in the CSS (render measures them in Chrome) */
  ok('pressed: every control lightens, the compact ones give a little; disabled: switched off, and the pointer says so',
     /button:not\(:disabled\):active,a\.chip:active,a\.ghost:active\{filter:brightness\(1\.25\)\}/.test(html) && /:not\(:disabled\):active\{transform:scale\(\.96\)\}/.test(html) && /button:disabled\{opacity:\.45;cursor:not-allowed\}/.test(html) && /button svg,a svg\{pointer-events:none\}/.test(html));
  ok('44 px: fields, ghost buttons, links, steppers and the actions for real; chips, pills, the set chip, the ranges, the row steppers and the slider by a 44 px hit area',
     /input:not\(\[type\]\),textarea\{\s*min-height:44px/.test(html) && /\.ghost,\.linkish\{min-height:44px\}/.test(html) && /\.stepper button\{width:44px;height:44px/.test(html)
     && /:is\(\.chip,button\.pill,\.setchip,\.range,\.cnt button,\.mode button\)::after\{content:"";position:absolute;left:50%;top:50%;\s*width:max\(100%,44px\);height:max\(100%,44px\)/.test(html) && /\.chips\{display:flex;flex-wrap:wrap;gap:10px 7px\}/.test(html) && /\.chip\{[^}]*min-height:34px\}/.test(html));   // a chip at least 34 px: wrapped rows 44 px apart (the runner caught 31 px where-to-buy chips wrapping)
  ok('the actions keep their width: flex:0 0 auto beside the 44 px minimum (a min-width alone squeezed the row -- seen in this take)', /\.actions button\{flex:0 0 auto;min-width:44px;min-height:44px\}/.test(html));
  ok('the scanner\'s height takes the sticky mode slider off too (its shutter row sat 52 px under the nav)', /\.scanwrap\{position:relative;height:calc\(100vh - 76px - var\(--sat\) - var\(--sab\) - var\(--modebar-h\)\)/.test(html) && /--modebar-h:53px/.test(html));
  ok('the deck\'s name is a 44 px target that keeps its title\'s place', /h1\.ab-title input\{display:block;width:100%;min-height:44px;margin:-6px 0 -8px;padding:6px 0 8px/.test(html)); }   /* take 115: min-height 44 (0 drew 43.6 px -- render reads the size now, SPEC-108-39) */
}
