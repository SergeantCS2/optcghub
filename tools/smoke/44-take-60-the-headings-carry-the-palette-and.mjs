/* smoke sections 44, 45: take 60 — the headings carry the palette, and every text token is legible | take 91 — More is a screen (A37, landmine 128)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { c, d, before } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 60 — the headings carry the palette, and every text token is legible');
/* WCAG AA: 4.5:1 for body text. Computed from the tokens in the shipped page,
   so a future palette edit that dips below it fails here rather than in a
   collector's hand. Landmine 117: take 33 moved the headings to the display
   face and their colour went with the containers they left. */
const lum = hx => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hx.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const palette = name => { const at = name === 'collect' ? html.indexOf(':root{') : html.indexOf(`:root[data-mode="${name}"]{`); const block = name === 'collect' ? html.slice(at, html.indexOf(':root[data-mode=')) : html.slice(at, html.indexOf('}', at));
  const t = {}; for (const m of block.matchAll(/--(bg|card|card2|fg|dim|dim2|brass|accent-ink|on-accent|line-strong):(#[0-9A-Fa-f]{6})/g)) t[m[1]] = m[2];
  if (name !== 'collect') { const c = palette('collect'); for (const k of ['on-accent']) t[k] ||= c[k]; } return t; };
for (const mode of ['collect', 'play', 'hunt']) { const t = palette(mode);
  ok(`${mode}: every text token clears WCAG AA 4.5:1 on the card background`,
     ['fg', 'dim', 'dim2'].every(k => ratio(t[k], t.card) >= 4.5),
     ['fg', 'dim', 'dim2'].map(k => `${k} ${ratio(t[k], t.card).toFixed(2)}`).join(', '));
  ok(`${mode}: the brass accent clears 3:1 for the large text it is used on`, ratio(t.brass, t.card) >= 3.0, ratio(t.brass, t.card).toFixed(2)); }
ok('negative control: the token that failed before this take would still fail the check', ratio('#6B5F4B', palette('collect').card) < 4.5);
ok('headings carry the palette accent, not the body colour (landmine 117)',
   /h1,h2\{font-family:var\(--display\)[^}]*color:var\(--accent-ink\)\}/.test(html) && /\.panel h3\{[^}]*color:var\(--accent-ink\)\}/.test(html) && !/#tour \.gcard h3\{[^}]*color:var\(--fg\)\}/.test(html));   // take 106: the accent as text is --accent-ink
ok('a wide viewport gets a phone-width column rather than a sprawl', /@media \(min-width:900px\)\{[\s\S]*?max-width:520px/.test(html));
/* take 81: the owner's first impressions of Hunt on the Fold */
ok('the page cannot zoom on input focus and every text input is 16px -- the zip sheet was zoomed off-screen (take 81)', /maximum-scale=1/.test(html) && /user-scalable=no/.test(html) && /\.search input\{[^}]*font-size:16px/.test(html));
ok('the search bar is themed, with an icon, and lights its border on focus', /\.search:focus-within\{border-color:var\(--brass\)\}/.test(html) && /class="search"[^>]*><svg/.test(html));
ok('the mode labels are readable: the label size (14px), not 12.5', /\.mode button\{[^}]*font-size:var\(--fs-label\)/.test(html) && !/\.mode button\{[^}]*font-size:12\.5px/.test(html));   // take 117: the token
ok('the tour stops on every card: one swipe, one card', /scroll-snap-stop:always/.test(html));
ok('the phone\'s back button walks the screen stack, closes any open sheet first, and minimises at the bottom rather than exiting', /addListener\('backButton'/.test(js) && /closeAnyOverlay\(\)/.test(js) && /minimizeApp/.test(js) && /popstate/.test(js));
ok('back cancels the zip sheet through its own Cancel, so the pending ask resolves', /askCancel'\)\.click\(\)/.test(js));
ok('on relaunch the app opens on the saved mode\'s own home, not Collect\'s — and pushes it onto the stack for every mode (take 105, landmine 140: Collect was skipped and the first Back minimized the app)', /MODE\.set\(MODE\.cur, false\); go\(MODE\.home\[MODE\.cur\] \|\| 'home'\)/.test(js) && !/if \(MODE\.cur !== 'collect'\) go\(/.test(js));
ok('Sealed groups by set: a header per set, every set open by default, a tap collapses one (take 86: the owner found the count and the closed folds confusing)', /data-setfold=/.test(js) && /SEALED\.closed/.test(js) && !/\$\{ps\.length\} \$\{open/.test(js));
{ V.SEALED.q = ''; V.SEALED.open = new Set(); V.HUNT.setZip(''); V.paintSealed(); const hf = ctx.document.querySelector('#sealedList').innerHTML;
  const headers = (hf.match(/data-setfold=/g) || []).length, rows = (hf.match(/data-open="/g) || []).length;
  V.SEALED.closed.delete('decks'); V.paintSealed(); const rowsOpen = (ctx.document.querySelector('#sealedList').innerHTML.match(/data-open="/g) || []).length; V.SEALED.closed.add('decks'); V.paintSealed();
  ok('...every product is on screen under its set header, or under Starter decks once that section is open (take 117: a deck set lives there and nowhere else)', headers >= 10 && rows >= 250 && rowsOpen >= 300 && rowsOpen > rows, `${headers} set headers, ${rows} rows shown, ${rowsOpen} with the decks open`);
  /* take 115 (self-review): the first set DRAWN with rows -- the catalogue's newest group can be sealed-only with nothing
     priced, or a starter deck drawn under Starter decks, and collapsing it hid nothing */
  const first93 = +(hf.match(/data-setfold="(\d+)"/) || [])[1];
  V.SEALED.closed.add(first93); V.paintSealed(); ok('...and a collapsed set hides only its own rows', (ctx.document.querySelector('#sealedList').innerHTML.match(/data-open="/g) || []).length < rows, String(first93)); V.SEALED.closed.clear(); }
/* take 87: the fourth look, part two */
ok('MAX wears an AD badge and is unlocked for a day by a rewarded ad; with no ad plugin it simply opens', /'<span class="free">AD<\/span>'/.test(js) && /const MAXLOCK = \{/.test(js) && /24 \* 3600e3/.test(js) && /!PLATFORM\.plugin\('AdMob'\) \|\| !CAT\.man\.ads \|\| Date\.now\(\) < this\.until/.test(js) && !/FREE<\/span>/.test(js));
ok('...and the reward listener routes a max ad to the unlock, not to scan credits', /if \(this\._pendingKind === 'max'\) \{ this\._pendingKind = null; MAXLOCK\.grant\(\)/.test(js));
ok('no select is ever wider than its container (the Sim boxes ran off the screen)', /select\{max-width:100%/.test(html));
{ V.MODE.set('hunt', false); V.SEALED.q = ''; V.SEALED.kind = 'all'; V.SEALED.closed.clear(); V.paintSealed(); const hs = ctx.document.querySelector('#sealedList').innerHTML;
  ok('Starter decks have their own section at the top of Sealed, with pictures and the bell', /Starter decks<span class="note">\d+ products<\/span>/.test(hs)
     /* take 110: the first fold is the starter decks' and the name is inside its heading (a 400-character window stood for this until the heading carried its art) */
     && hs.indexOf('data-setfold="') === hs.indexOf('data-setfold="decks"') && hs.indexOf('Starter decks') < hs.indexOf('</button>', hs.indexOf('data-setfold="decks"')));
  /* take 110: this line ended "|| true" from the take-88 seed on, so it could not fail; the section is now
     read from its own heading to the next one, folded and (the control) open */
  const deckIds = V.CAT.rows.filter(p => V.SEALED.isProduct(p) && V.SEALED.kindOf(p) === 'deck').map(p => p.id);
  const decksSec = h => { const a = h.indexOf('data-setfold="decks"'); if (a < 0) return null; const b = h.indexOf('data-setfold="', a + 1); return h.slice(a, b < 0 ? h.length : b); };
  const deckRows = t => deckIds.filter(id => t.includes(`data-open="${id}"`)).length;
  V.SEALED.closed.add('decks'); V.paintSealed(); const shut = decksSec(ctx.document.querySelector('#sealedList').innerHTML), open = decksSec(hs);
  ok('...and it folds on a tap like a set: its heading stays, marked folded, and its decks go', !!shut && /^data-setfold="decks" aria-expanded="false"/.test(shut) && deckRows(shut) === 0, (shut || '').slice(0, 120));
  ok('...control: open, the same section lists its decks', !!open && /^data-setfold="decks" aria-expanded="true"/.test(open) && deckRows(open) > 0, String(open && deckRows(open)));
  V.SEALED.closed.clear(); V.MODE.set('collect', false); }
ok('the roster carries a phone and an exact point for every store the file has them for', (() => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-r87-')); execSync(`python3 tools/hunt.py --from-fixtures --out ${d}/feed-fixture.json`, { cwd: ROOT, stdio: 'pipe' }); const r = JSON.parse(fs.readFileSync(path.join(d, 'stores-fixture.json'), 'utf8')); return r.stores.every(s => s.phone && s.exact && Array.isArray(s.ll)); })());
/* take 86: the fourth look */
ok('every screen ends with room for the bottom bar (nothing hides behind it)', /\.screen\{display:none;padding:0 var\(--pad\) calc\(66px \+ 34px \+ var\(--sab\)\)\}/.test(html));
ok('pills never wrap onto two lines', /\.pill\{[^}]*white-space:nowrap/.test(html));
ok('a picture that fails drops from the large size to its thumbnail, and a thumbnail that fails is removed; the retry to <id>.jpg is gone (403 for 241 of 241 -- landmine 150)',
   /onerror="var t=this\.dataset\.thumb;if\(t\)\{delete this\.dataset\.thumb;this\.src=t\}else\{this\.remove\(\)\}"/.test(js) && !/this\.src=this\.src\.replace\(\/_\\d\+w/.test(js));
ok('the Target panel says it plainly (take 138: in fewer words): what it is and how often, checked when, N products, N in stock to ship, and what a limit means', /Online and shelf stock at Target, refreshed hourly\./.test(js) && /products online, <b>\$\{ships\}<\/b> in stock to ship/.test(js) && /Target cut this check short; the next one picks up from here\./.test(js) && !/the retailer throttled this run/.test(js));
ok('the Portfolio caption has its own face and colour, not body text', /\.hero \.who \.cap\{[^}]*font-family:var\(--heavy\)[^}]*color:var\(--dim\)/.test(html));   // take 106: --brass2 as text was 2.68-4.40:1
ok('Releases rows: the title wraps, Details sits on its own line inside the row (the footer line, shared with Remind me and Calendar since take 97)', /<b style="white-space:normal">\$\{esc\(s\.name\)\}/.test(js) && /class="rel"/.test(js) && /padding:0 0 8px">\$\{extra\}/.test(js) && /<a class="ghost" href="\$\{esc\(detailsUrl\(\{ name: label \}\)\)\}"/.test(js));
{ /* the watchdog: a page with no screen on is restored and the cause recorded */
  ctx.window.scrollTo = () => {}; ctx.scrollTo = () => {};
  const before = V.ERRS.list.length; V.MODE.set('hunt', false);
  /* the stub answers every class selector with a dummy element; make '.screen.on' answer null -- a page with nothing on */
  const _qs = ctx.document.querySelector; ctx.document.querySelector = s => s === '.screen.on' ? null : _qs(s);
  V.HUNT.setZip('48329'); V.NAV.zipAsked = true;   /* so the painter does not open the zip sheet mid-test */
  V.NAV.stack = ['sealed', 'local'];
  const fns = ctx._win.popstate || []; if (fns.length) { fns[0](); }
  await new Promise(r => setTimeout(r, 120));
  ok('the watchdog records a blank page with the stack, the overlays and the trigger, and puts the mode\'s home back', V.ERRS.list.length > before && /no screen on after history back; stack/.test(V.ERRS.list[0].msg) && V.NAV.stack[V.NAV.stack.length - 1] === 'sealed', JSON.stringify(V.ERRS.list[0]));
  ctx.document.querySelector = _qs; V.MODE.set('collect', false); }
ok('Diagnostics reports what is on screen, the overlays, the splash, the currency and its rate date', /line\('screens on'/.test(js) && /line\('overlays on'/.test(js) && /line\('splash'/.test(js) && /line\('currency'/.test(js));
/* take 85: a display currency, and the opening screen */
ok('the day\'s rates ride in the manifest with their date, USD base, seven currencies', manifest.rates && manifest.rates.base === 'USD' && /^\d{4}-\d\d-\d\d$/.test(manifest.rates.date) && Object.keys(manifest.rates.rates).length === 7 && manifest.rates.rates.EUR > 0.5 && manifest.rates.rates.EUR < 1.5, JSON.stringify(manifest.rates));
ok('USD is the price: no mark, dollar sign, cents', V.CUR.set('USD') === undefined && V.money(12.5) === '$12.50');
V.CUR.set('EUR');
ok('another currency is a CONVERSION at the day\'s rate and is marked \u2248', V.money(100) === '\u2248\u20ac' + (100 * manifest.rates.rates.EUR).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), V.money(100));
V.CUR.set('JPY'); ok('yen shows no cents', /^\u2248¥[\d,]+$/.test(V.money(100)), V.money(100));
V.CUR.set('ZZZ'); ok('an unknown or unrated code falls back to USD', V.CUR.active() === 'USD' && V.money(1) === '$1.00');
V.CUR.set('CAD'); ok('the choice is kept on the phone', ctx.localStorage.getItem('vault.currency') === 'CAD'); V.CUR.set('USD');
ok('the picker says what a conversion is: the ECB reference rate of a date, an estimate not a quote', /an estimate, not a quote/.test(js) && /ECB reference rate/.test(js));
ok('the currency is reachable from Home, from Sealed and from More', /id="curPillHome"/.test(html) && /id="curPillSealed"/.test(html) && /data-act="currency">Show prices in/.test(js));
ok('the opening screen is in the markup (first paint): a word-mark, a line and the app\'s own card -- its icon file, and no other picture (take 116)', /<div id="splash" aria-hidden="true">/.test(html) && /class="wm">OP TCG Hub</.test(html) && (() => { const s = html.slice(html.indexOf('id="splash"'), html.indexOf('id="splash"') + 900); const im = s.match(/<img[^>]*>/g) || []; return im.length === 1 && /src="bundle\/icon\.svg"/.test(im[0]) && !/<image/.test(s); })());
ok('...and the app hides it after it has painted, no sooner than 1.6 s (a second longer at the owner\'s word), no later than 3.5 s', /Math\.max\(0, 1600 - \(Date\.now\(\) - SPLASH_T0\)\)/.test(js) && /setTimeout\(splashDone, 3500\)/.test(js) && /splashDone\(\);/.test(js));
/* take 83: the third look -- uniformity, pictures, the blank back */
ctx.window.scrollTo = () => {}; ctx.scrollTo = () => {};
ok('go() refuses an id with no screen: falls back to the mode\'s home and records the id (the blank page after Back)', (() => { const before = V.ERRS.list.length; V.MODE.set('collect', false); V.go('no-such-screen'); return V.ERRS.list.length === before + 1 && /no screen for 'no-such-screen'/.test(V.ERRS.list[0].msg) && V.NAV.stack[V.NAV.stack.length - 1] === 'home'; })());

/* take 91 -- A37, landmine 128. The one link a person taps to reach More
   (Home's "More · settings, export, sources") had bounced to Home since
   take 83: the section was built on first paint and the guard above ran
   first. Drive go('settings') the way the delegate does; the assertion
   above (an id with no screen) is this block's negative control. */
section('take 91 — More is a screen (A37, landmine 128)');
{
  V.MODE.set('collect', false);
  const before = V.ERRS.list.length;
  V.go('settings');
  const el = ctx.document.getElementById('settings');
  ok("go('settings') lands on More, not on Home", V.NAV.stack[V.NAV.stack.length - 1] === 'settings', V.NAV.stack.slice(-2).join('>'));
  ok('...and records no "no screen" error', V.ERRS.list.length === before, JSON.stringify(V.ERRS.list[0] || null));
  ok('#settings is a <section> in the markup, not built on demand', !!el && el.tagName === 'SECTION');
  const body91 = ctx.document.getElementById('setBody');   // take 107: More's header is markup; its rows are painted under it
  ok('More painted its rows: About (the Diagnostics gesture), Export CSV, Sync',
     !!body91 && /id="aboutTake"/.test(body91.innerHTML) && /Export CSV/.test(body91.innerHTML) && /id="syncBtn"/.test(body91.innerHTML));
  V.MODE.set('play', false); V.go('settings');
  ok('the gear on Decks reaches the same screen', V.NAV.stack[V.NAV.stack.length - 1] === 'settings' && V.ERRS.list.length === before);
  V.MODE.set('collect', false); V.go('home');
  /* the buffer survives a restart (take 91): what the watchdog writes must
     outlive the relaunch that follows a blank screen */
  V.ERRS.push('error', 'planted for take 91', 'app.js:1');
  const saved = JSON.parse(store['vault.errs'] || '[]');
  ok('an error record is written to storage as it is pushed',
     saved.length > 0 && saved[0].msg === 'planted for take 91' && saved.length <= 20, String(saved.length));
  ok('a fresh load reads the same records back',
     typeof V.ERRS.load === 'function' && !!V.ERRS.load()[0] && V.ERRS.load()[0].msg === 'planted for take 91');
  store['vault.errs'] = 'not json';
  ok('negative control: a corrupt buffer loads empty instead of throwing',
     typeof V.ERRS.load === 'function' && V.ERRS.load().length === 0);
  delete store['vault.errs'];
}
ok('NAV.back() pops past anything that is not a screen', (() => { V.NAV.stack = ['sealed', 'ghost', 'local']; const r = V.NAV.back(); return r && V.NAV.stack[V.NAV.stack.length - 1] === 'sealed'; })());
ok('the bottom bar is one bar in every mode: fixed height, near-black, items stretch equally, the accent only on the active item', /nav\{[^}]*height:66px[^}]*#0B0D10/.test(html) && /nav button\{flex:1 1 0/.test(html) && /nav button\.on\{[^}]*color:var\(--accent-ink\)/.test(html));   // take 117: one rule for the active item, its colour and its ground
ok('every screen title bar has the same minimum height', /\.appbar\{[^}]*min-height:56px/.test(html));   // take 107: the header, one per screen
ok('the Portfolio label is a small caption above the name, which keeps the display face at the hero\'s size', /\.hero \.who \.cap\{[^}]*text-transform:uppercase/.test(html) && /<span class="cap">Collection<\/span><em id="pfName">/.test(html) && /\.hero \.who em\{[^}]*font-size:var\(--fs-head\)/.test(html));   // take 117: the token (26px)
{ const boxes = V.CAT.rows.filter(p => V.SEALED.isProduct(p));
  const phSealed = new Set(((V.CAT.man.images || {}).placeholder_ids || []).map(Number));   // take 126: the host's "Image Coming Soon" ships no URL (landmine 240)
  ok(`every sealed product carries a product photo url but those whose picture is the host's placeholder (${boxes.filter(p => phSealed.has(p.id)).length} today)`, boxes.length > 300 && boxes.every(p => p.img || phSealed.has(p.id)), String((boxes.find(p => !p.img && !phSealed.has(p.id)) || {}).id));
  const pic = V.productPic(boxes[0]);
  ok('a product picture is the take-12 display-only image -- lazy, hot-linked, retried once then removed on failure -- over a drawn tile that shows the set code', /<img class="ref" loading="lazy"/.test(pic) && /this\.remove\(\)/.test(pic) && /class="ph"/.test(pic) && /(tcgplayer-cdn|product-images)\.tcgplayer\.com/.test(pic));   // either declared host since take 100
  const np = V.productPic({ ...boxes[0], img: null });
  ok('with no photo the tile stands alone -- no image tag, no hole', !/<img/.test(np) && /class="ph"/.test(np));
  V.MODE.set('hunt', false); V.SEALED.open = new Set([boxes[0].set]); V.paintSealed();
  ok('Sealed rows carry the picture', (ctx.document.querySelector('#sealedList').innerHTML.match(/class="pic"/g) || []).length >= 1);
  V.paintReleases();
  ok('Releases rows carry the set\'s box', (ctx.document.querySelector('#relList').innerHTML.match(/class="pic"/g) || []).length >= 5);
  V.MODE.set('collect', false); }
/* take 82: the owner's second look */
ok('Prep & Play is charcoal and red, no longer Hunt\'s green (and clears AA above)', /:root\[data-mode="play"\]\{[^}]*--bg:#15171C/.test(html) && !/:root\[data-mode="play"\]\{[^}]*#0F2A1E/.test(html));
ok('every native select and text field is themed: card background, line border, accent on focus, 16px', /select,input\[type="text"\][^{]*\{[^}]*background:var\(--card2\)[^}]*font-size:16px/.test(html) && /select:focus,input:focus,textarea:focus\{border-color:var\(--brass\)/.test(html));
ok('the zip placeholder is nobody\'s zip', /placeholder: '37203'/.test(js) && !/placeholder: '48329'/.test(js));
ok('every Releases row has a visible Details link to the set\'s full listing', /Details \$\{ext\(\)\}/.test(js) && /tcgplayer\.com\/search\/one-piece-card-game\/product\?q=/.test(js));
ok('the nightly carries the hourly\'s hunt files forward before it deploys (the 404)', /--carry-over/.test(fs.readFileSync(path.join(ROOT, 'ci', 'bundle.sh'), 'utf8')) && /def carry_over/.test(fs.readFileSync(path.join(ROOT, 'tools', 'hunt.py'), 'utf8')) && fs.readFileSync(path.join(ROOT, 'ci', 'bundle.sh'), 'utf8').indexOf('--carry-over') < fs.readFileSync(path.join(ROOT, 'ci', 'bundle.sh'), 'utf8').indexOf('::group::commit sidecars'));
{ /* diagnostics: the gesture, the buffer, the report */
  ctx.window.scrollTo = () => {}; ctx.scrollTo = () => {};
  V.DIAG.taps = 0; for (let i = 0; i < 4; i++) V.DIAG.tap();
  ok('four taps on the About line do nothing', V.NAV.stack[V.NAV.stack.length - 1] !== 'diag');
  V.DIAG.tap(); ok('the fifth tap within the window opens Diagnostics (the screen stack ends on it)', V.NAV.stack[V.NAV.stack.length - 1] === 'diag');
  V.ERRS.push('error', 'planted error for the test', 'app.js:1');
  ctx.navigator.onLine = false;
  const rep = await V.DIAG.report();
  ok('the diagnostics build line carries the manifest\'s build time, not a question mark (take 92)', rep.includes('build: ' + manifest.built_at) && !/^build: \?$/m.test(rep), (rep.match(/^build: .*$/m) || [''])[0]);
  ok('the report carries every section a troubleshooter needs: app, device, catalogue, sync, hunt, storage, counts, errors, self-test', ['## app', '## device', '## catalogue', '## sync', '## hunt', '## storage', '## counts', '## last errors', '## self-test'].every(h => rep.includes(h)));
  ok('...the live endpoint probes, one per hunt file, saying offline when offline', /feed\.json: offline/.test(rep) && /zcta\.json: offline/.test(rep));
  ok('...the planted error, and never a collection\'s contents', /planted error for the test/.test(rep) && !/"qty"/.test(rep));
  ok('...and the self-test results inline', /PASS|SKIP/.test(rep));
  V.MODE.set('collect', false); }
ok('keyboard focus has a visible ring and a mouse click does not (take 80)', /:focus-visible\{outline:2px solid var\(--brass\)/.test(html) && /button:focus:not\(:focus-visible\)\{outline:none\}/.test(html));
ok('the gate lints smoke for numbers pinned to what the nightly moves (landmine 115), with the lint-ok escape for live-vs-live', /smoke-lint/.test(fs.readFileSync(path.join(ROOT, 'tools', 'gate.py'), 'utf8')) && /lint-ok/.test(fs.readFileSync(path.join(ROOT, 'tools', 'gate.py'), 'utf8')));
}
}
