/* smoke section 61: take 107 — one header on every screen (A42): the title in one place, Back one level down, the gear to More on every main screen, Home\'s two views as tabs, every sheet closable, Back closes every sheet
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 107 — one header on every screen (A42): the title in one place, Back one level down, the gear to More on every main screen, Home\'s two views as tabs, every sheet closable, Back closes every sheet');
{ /* the header is markup in every section (landmines 128, 135), so each screen's own markup is read */
  const PUSH = ['deck', 'detail', 'checklist', 'binder', 'wants', 'trade', 'diag', 'settings'];
  const GEAR_TAIL = /aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"\/><\/svg><\/button><\/div>\s*$/;
  const audit = src => [...src.matchAll(/<section id="([\w-]+)"[^>]*>([\s\S]*?)<\/section>/g)].map(([, id, body]) => {
    const hm = body.match(/<header class="appbar">([\s\S]*?)<\/header>/), h = hm ? hm[1] : '';
    return { id, headers: (body.match(/<header class="appbar">/g) || []).length, h1s: (body.match(/<h1\b/g) || []).length,
      title: (h.match(/<h1 class="ab-title"/g) || []).length === 1,
      first: body.replace(/^\s*(<div class="scanwrap">\s*|<div class="(?:arthero|artbg)[^"]*"[^>]*><\/div>\s*)?/, '').startsWith('<header class="appbar">'),   // the scanner's header opens its camera surface; take 109: an empty art layer may sit above it
      back: /^<button class="icb ab-back" data-back aria-label="Back">/.test(h), gear: GEAR_TAIL.test(h), glyph: /class="swords"/.test(h) }; });
  const bad = src => audit(src).filter(a => a.headers !== 1 || a.h1s !== 1 || !a.title || !a.first || a.glyph
    || a.back !== PUSH.includes(a.id) || a.gear === PUSH.includes(a.id)).map(a => a.id);
  const all = audit(html);
  ok('twenty screens, and every one opens with one header holding its one h1: where a title sits is the header\'s alone', all.length === 20 && bad(html).length === 0, bad(html).join(',') || String(all.length));
  ok('the eight screens one level down start with Back; the twelve in a mode\'s nav end with the gear to More, in all three modes (A37)',
     all.filter(a => a.back).map(a => a.id).sort().join() === [...PUSH].sort().join() && all.filter(a => a.gear).length === 12 && (html.match(/data-go="settings" aria-label="More"/g) || []).length === 12);
  ok('...control: a screen with its header taken out is caught', bad(html.replace('<section id="trade" class="screen">\n  <header class="appbar">', '<section id="trade" class="screen">\n  <div class="bar">')).includes('trade'));
  ok('...control (take 109): anything but an empty art layer above a header is still caught',
     bad('<section id="cards" class="screen"><div class="panel">x</div><header class="appbar"><div class="ab-text"><h1 class="ab-title">Cards</h1></div><div class="ab-act"><button class="icb" data-go="settings" aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"/></svg></button></div></header></section>').includes('cards')
     && !bad('<section id="cards" class="screen"><div class="arthero" id="x" hidden></div><header class="appbar"><div class="ab-text"><h1 class="ab-title">Cards</h1></div><div class="ab-act"><button class="icb" data-go="settings" aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"/></svg></button></div></header></section>').includes('cards'));
  ok('...control: a gear that is not the last action is caught', bad('<section id="cards" class="screen"><header class="appbar"><div class="ab-text"><h1 class="ab-title">Cards</h1></div><div class="ab-act"><button class="icb" data-go="settings" aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"/></svg></button><button class="ghost">x</button></div></header></section>').includes('cards'));
  ok('...control: a title with a mark in it, or a Back on a nav screen, is caught', bad('<section id="sealed" class="screen"><header class="appbar"><div class="ab-text"><h1 class="ab-title"><svg class="swords"></svg>Sealed</h1></div><div class="ab-act"><button class="icb" data-go="settings" aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"/></svg></button></div></header></section>').includes('sealed')
     && bad('<section id="play" class="screen"><header class="appbar"><button class="icb ab-back" data-back aria-label="Back"></button><div class="ab-text"><h1 class="ab-title">Play</h1></div><div class="ab-act"><button class="icb" data-go="settings" aria-label="More"><svg class="g" width="24" height="24" aria-hidden="true"><use href="#g-gear"/></svg></button></div></header></section>').includes('play'));
  ok('one look for every title: the display face and the mode\'s accent (the h1 rule), one size, one minimum height; the tab style is gone',
     /\nh1,h2\{font-family:var\(--display\)[^}]*color:var\(--accent-ink\)\}/.test(html) && /\.ab-title\{[^}]*font-size:var\(--fs-head\)/.test(html) && /\.appbar\{[^}]*min-height:56px/.test(html) && !/\n\.tab\{/.test(html) && !/\n\.bar\{/.test(html) && !/class="tab/.test(html));
  ok('the new controls are 44 px targets: the header\'s icon buttons and Home\'s two tabs', /\.icb\{width:44px;height:44px/.test(html) && /\.segtabs button\{[^}]*min-height:44px/.test(html));
  ok('back, close and the gear are symbols in the sprite, plain geometry drawn here', ['back', 'close', 'gear'].every(g => new RegExp(`<symbol id="g-${g}" viewBox="0 0 24 24"`).test(html)));
  ok('the deck\'s name is its title and stays a field, labelled, with no inline style', /<h1 class="ab-title"><input id="dkName" placeholder="Deck name" aria-label="Deck name"><\/h1>/.test(html) && /h1\.ab-title input\{[^}]*font:inherit/.test(html));
  ok('a card\'s name is its title; the collection it is added to is the line under it', /<h1 class="ab-title" id="dName">/.test(html) && /<p class="ab-sub">Adding to <b id="dTarget">/.test(html) && !/<h2 id="dName"/.test(html));
  ok('More\'s header is markup like every screen\'s; the rows are painted under it', /<section id="settings" class="screen">\s*<header class="appbar">/.test(html) && /const s = \$\('#setBody'\)/.test(js) && !/<span class="tab on"/.test(js));
  ok('the date of Sealed\'s prices and the binder\'s page are the line under their titles', /<h1 class="ab-title">Sealed<\/h1><p class="ab-sub" id="sealedAsOf"><\/p>/.test(html) && /<h1 class="ab-title">Binder<\/h1><p class="ab-sub" id="bnPage"><\/p>/.test(html));
  /* Home's two views */
  ok('Home\'s two views are a tab row under its title: a tablist, two button tabs, one selected, one tab stop',
     /<div class="segtabs" role="tablist" aria-label="Home">\s*<button class="on" id="tabOver" role="tab" aria-selected="true" tabindex="0">Overview<\/button>\s*<button id="tabPerf" role="tab" aria-selected="false" tabindex="-1">Performance<\/button>/.test(html));
  ok('the release note left Home at take 117, and its two Home rules went with it', !/#whatsNew/.test(html) && !/#wnOk/.test(html));
  /* the sheets */
  const sheets = ['picker', 'filters', 'askSheet', 'leaderPick', 'printPick'];
  ok('every sheet has a title in the header\'s face and a close button of its own', sheets.every(id => new RegExp(`<div class="sheet" id="${id}">\\s*<div class="sheetbody">\\s*<div class="grab"></div>\\s*<div class="sheethead"><h2[^>]*>[^<]*</h2><button class="icb" data-close="${id}" aria-label="Close">`).test(html)) && /\.sheethead h2\{[^}]*font-size:var\(--fs-title\)/.test(html));
  for (const id of ['#filters', '#leaderPick', '#printPick']) {
    const el = ctx.document.querySelector(id); el.classList.add('on');
    ok(`Back closes ${id} first (it stayed open while the screen under it changed -- PROVEN in Chrome before this take)`, V.closeAnyOverlay() === true && !el.classList.contains('on'));
    el.classList.remove('on');
  }
  ok('...control: with nothing open, Back has no sheet to close', V.closeAnyOverlay() === false);
  ok('the watchdog names the three sheets too when it records a blank screen', /const overlays = \['#askSheet', '#picker', '#filters', '#leaderPick', '#printPick'/.test(js));
  /* the behaviour, through the named handlers (landmine 136: a document-level click handler is out of the stub's reach) */
  const has107 = ['setHomeTab', 'closeSheet', 'backArrow'].every(f => typeof V[f] === 'function');   // an older build fails here instead of throwing
  ok('the header\'s handlers are named and reachable: Home\'s tabs, a sheet\'s close, the back arrow', has107);
  if (has107) {
    const tO = ctx.document.querySelector('#tabOver'), tP = ctx.document.querySelector('#tabPerf');
    V.setHomeTab(true);
    ok('selecting Performance moves the tab stop with it', tP.getAttribute('tabindex') === '0' && tO.getAttribute('tabindex') === '-1' && tP.getAttribute('aria-selected') === 'true');
    tP._ev.keydown({ key: 'ArrowLeft', preventDefault() {} });
    ok('the arrow keys move between the two views', tO.classList.contains('on') && !tP.classList.contains('on') && tO.getAttribute('tabindex') === '0');
    V.setHomeTab(false);
    { const el = ctx.document.querySelector('#filters'); el.classList.add('on'); V.closeSheet('filters');
      ok('a sheet\'s close button closes that sheet', !el.classList.contains('on')); }
    /* the back arrow is the phone's Back */
    V.MODE.set('collect', false); V.go('home'); V.go('collection'); V.go('wants');
    V.backArrow();
    ok('in a browser the arrow asks the browser to go back, and the screen stack follows (wants -> collection)', V.NAV.stack[V.NAV.stack.length - 1] === 'collection', V.NAV.stack.slice(-3).join('>'));
    const plug0 = V.PLATFORM.plugin; let minimised = 0;
    V.PLATFORM.plugin = n => n === 'App' ? { addListener() {}, minimizeApp() { minimised++; } } : plug0.call(V.PLATFORM, n);
    V.go('binder'); V.backArrow();
    ok('in the app the arrow runs the back button\'s own path (binder -> collection)', V.NAV.stack[V.NAV.stack.length - 1] === 'collection', V.NAV.stack.slice(-3).join('>'));
    V.NAV.stack = ['home']; V.backArrow();
    ok('...control: from the mode\'s home the arrow does nothing, and never leaves the app', minimised === 0 && V.NAV.stack.join() === 'home');
    V.PLATFORM.plugin = plug0; V.go('home');
  } }
}
