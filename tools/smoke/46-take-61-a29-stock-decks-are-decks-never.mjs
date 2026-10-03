/* smoke section 46: take 61 — A29: stock decks are decks, never owned cards
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { c, d, before } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 61 — A29: stock decks are decks, never owned cards');
const stock = V.CAT.stock || [];
ok('the bundle ships ready-made decks and the manifest counts them', stock.length >= 10 && manifest.stock === stock.length, `${stock.length}`);
ok('every one is legal by the app\'s own check (§5-1)', stock.every(d => V.legality(d).problems.length === 0),
   stock.filter(d => V.legality(d).problems.length).map(d => d.id + ': ' + V.legality(d).problems[0]).join(' | '));
ok('every card in them resolves to a printing the app knows (landmine 1)', stock.every(d => V.CAT.byId.has(d.leader) && d.cards.every(c => V.CAT.byId.has(c.id))));
ok('they are named as built from a set, never as the retail product', stock.every(d => /built from ST\d+/.test(d.name) && !/Starter Deck/i.test(d.name)));
/* THE guard of A29: the owner said they must not enter the collection. */
V.OWN.items = [];
const before = { total: V.OWN.total(), count: V.OWN.items.length };
V.DECKS.all().filter(d => d.stock).forEach(d => { V.legality(d); V.simReadiness(d); });
const csvBefore = (() => { let n = 0; const _ce = ctx.document.createElement; ctx.document.createElement = tag => { const el = _ce(tag); if (tag === 'a') el.click = () => n++; return el; }; ctx.document.createElement = _ce; return n; })();
ok('reading every stock deck leaves the collection empty and worth nothing', V.OWN.total() === before.total && V.OWN.items.length === before.count && V.OWN.total() === 0);
ok('...and no stock card id is in the collection', !V.OWN.items.some(i => stock.some(d => d.cards.some(c => c.id === i.id))));
ok('a stock deck is not in the saved deck list either (it is never written to storage)', !V.DECKS.list.some(d => d.stock) && V.DECKS.all().length === V.DECKS.list.length + stock.length);
ok('negative control: the collection DOES move when a card is actually added', (V.OWN.add(stock[0].cards[0].id, { qty: 1 }), V.OWN.items.length === 1));
V.OWN.items = [];
ok('the sim offers them, so a player with no collection can start', /DECKS\.all\(\)\.filter\(d => d\.leader/.test(js));
/* take 109 (landmine 149): where they are is read from the screen that holds them -- the old
   line asked only whether the id existed, and they sat in the deck editor from take 66 at the latest */
const secOf = (src, id) => { const i = src.indexOf(`id="${id}"`); if (i < 0) return null; const s0 = src.lastIndexOf('<section id="', i); return s0 < 0 ? null : src.slice(s0 + 13, src.indexOf('"', s0 + 13)); };
ok('Decks shows them under their own heading, marked ready-made -- on the Decks screen itself', secOf(html, 'dkStock') === 'decks' && /<div class="fgrp">Ready-made decks<\/div>/.test(js) && /<span class="badge">ready-made<\/span>/.test(js), String(secOf(html, 'dkStock')));
ok('...control: the take-108 place (the bottom of a deck\'s editor) is caught', secOf(html.replace('  <div id="dkStock"></div>\n', '').replace('<div class="panel" id="dkSim"></div>', '<div class="panel" id="dkSim"></div><div id="dkStock"></div>'), 'dkStock') === 'deck');
/* take 62: covers are drawn, never downloaded (landmines 26, 30) */
const cover = V.deckCover(stock[0]);
ok('a deck cover is inline SVG with no image, no request and no publisher mark',
   /^<svg /.test(cover.trim()) && !/<image|https?:|url\((?!#)/.test(cover) && !/One Piece|Bandai|BANDAI/i.test(cover), cover.slice(0, 80));
ok('...it says the set code, from the catalogue, and no 7 px name (take 109: the row names the Leader)', cover.includes(stock[0].set) && !/font-size="7"/.test(cover));
{ V.paintStock(); const sh = ctx.document.querySelector('#dkStock').innerHTML, L0 = V.CAT.byId.get(stock[0].leader), stockPic = V.stockPic || (() => ''), sp = stockPic(stock[0]);   // an older build has no stockPic: fail, don't crash
  ok('...each ready-made row names its Leader and shows the Leader\'s own picture over the drawn cover (take 109)',
     sh.includes(String(L0.name).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))) && /<img class="ref" loading="lazy"/.test(sp) && sp.includes(L0.img) && /class="ph"[^>]*><svg /.test(sp));
  ok('...control: a deck whose Leader the catalogue lacks shows the drawn cover alone', !/<img/.test(stockPic({ ...stock[0], leader: -1 })) && /<svg /.test(stockPic({ ...stock[0], leader: -1 }))); }
ok('...and carries a label for a screen reader', /role="img"/.test(cover) && /aria-label=/.test(cover));
/* take 66: nothing a screen reader reaches is nameless (A30's last item) */
{
const buttons = [...(html + js).matchAll(/<button((?:(?!>).)*)>((?:(?!<\/button>).)*)<\/button>/gs)];
/* A reader announces letters fine ("OK", "Done"); it is symbols and empties
   that arrive as nothing or as "plus sign". Those need a name. */
const nameless = buttons.filter(([, attrs, inner]) => {
  if (/aria-label=/.test(attrs)) return false;
  const stripped = inner.replace(/<[^>]+>/g, '');
  /* `${...}` inside the label is text at runtime -- a name, just a computed
     one. What a reader announces as nothing is an empty button or one whose
     whole label is punctuation. */
  if (/\$\{[^}]*\}/.test(stripped)) return false;
  return (stripped.replace(/\s/g, '').match(/[A-Za-z0-9]/g) || []).length === 0;
});
ok('every button that a reader would announce as nothing carries an aria-label', nameless.length === 0,
   nameless.slice(0, 3).map(n => n[0].replace(/\s+/g, ' ').slice(0, 70)).join(' | '));
ok('a screen title announces as a heading, not as a tab', (html.match(/<h1 class="ab-title"/g) || []).length >= 20 && !/class="tab on"/.test(html));   // take 107: a real h1 in every screen's header
ok('the only real tabs keep role="tab" and a selected state', /id="tabOver"[^>]*role="tab"[^>]*aria-selected/.test(html) && /id="tabPerf"[^>]*role="tab"[^>]*aria-selected/.test(html));
ok('the network badge is a live status, not a control', /class="pill" role="status" aria-live="polite"/.test(html));
ok('decorative glyphs inside labelled controls are hidden from the reader', /<span class="ic" aria-hidden="true">/.test(html));
ok('negative control: a button with no text and no label would be caught', (() => { const probe = '<button class="x">\u2606</button>'; const m = [...probe.matchAll(/<button((?:(?!>).)*)>((?:(?!<\/button>).)*)<\/button>/gs)]; return m.length === 1 && !/aria-label=/.test(m[0][1]); })());
}

/* take 65: A30's two rows -- Rate and Share, no referral, no tracking */
ok('the manifest carries the app id so the store link is not a literal twice', manifest.appId === 'com.optcghub.app');
ok('More offers both rows', /data-act="rate"/.test(js) && /data-act="shareapp"/.test(js) && /rate: \(\) => PLATFORM\.rateApp\(\)/.test(js));
const store = V.PLATFORM.storeUrl();
ok('the store link is the app id and nothing else: no referral, no campaign, no tracking',
   store === 'https://play.google.com/store/apps/details?id=com.optcghub.app' && !/[?&](referrer|utm_|campaign)/.test(store), store);
{ const calls = [];
  ctx.window.Capacitor = { Plugins: { Share: { share: async o => { calls.push(o); } } } };
  const r = await V.PLATFORM.shareApp();
  ok('sharing the app hands the store link and a plain line of text to the share sheet',
     r === 'shared' && calls.length === 1 && calls[0].url === store && /scan, value and track/.test(calls[0].text) && !/[?&]utm_/.test(calls[0].url), JSON.stringify(calls[0]));
  ok('...and it shares a link, never a file (that is the collection page)', !('files' in calls[0]));
  delete ctx.window.Capacitor; }
{ let copied = null; ctx.navigator.clipboard = { writeText: async t => { copied = t; } };
  const r = await V.PLATFORM.shareApp();
  ok('negative control: with no Share plugin it copies instead of failing silently', r === 'copied' && copied.includes(store));
  delete ctx.navigator.clipboard; }
{ let opened = null; ctx.window.open = (u) => { opened = u; };
  await V.PLATFORM.rateApp();
  ok('Rate opens the app\'s own Play listing', /play\.google\.com|market:\/\/details\?id=com\.optcghub\.app/.test(opened), String(opened));
  delete ctx.window.open; }

/* take 64: Overview and Performance are a pair, exactly one on */
const tabOver = ctx.document.querySelector('#tabOver'), tabPerf = ctx.document.querySelector('#tabPerf');
ok('Overview is a real tab with an id, a handler and a selected state', !!tabOver && /tabOver'\)\.addEventListener\('click'/.test(js) && /aria-selected/.test(html));
const fire = el => (el._ev && el._ev.click) ? el._ev.click({ target: el, preventDefault() {} }) : null;
ok('on load, Overview carries the on class from the markup', /<button class="on" id="tabOver"/.test(html));
fire(tabPerf);
ok('clicking Performance turns Overview OFF -- the reported bug', tabPerf.classList.contains('on') && !tabOver.classList.contains('on'), `over=${tabOver.className} perf=${tabPerf.className}`);
ok('...and the overview blocks give way to the performance panel', ctx.document.querySelector('#perfPanel').style.display === 'block' && ctx.document.querySelector('#hero').style.display === 'none');
fire(tabOver);
ok('clicking Overview comes back, and Performance turns off', tabOver.classList.contains('on') && !tabPerf.classList.contains('on') && ctx.document.querySelector('#perfPanel').style.display === 'none' && ctx.document.querySelector('#hero').style.display !== 'none');
ok('negative control: the old code toggled Performance without ever clearing Overview', !/classList\.toggle\('on', perfOn\);\s*\$\('#perfPanel'\)/.test(js));
ok('both tabs answer the keyboard as well as the mouse', /keydown/.test(js) && /tabindex="0"/.test(html));
ok('the skull glyph is gone from the sprite and from every screen (take 63)', !/g-roger/.test(html) && !/g-roger/.test(js));
ok('the Decks tab is a card back, drawn here, not the publisher\'s design', /<use href="#g-cardback"\/>/.test(html) && /symbol id="g-cardback"/.test(html));
ok('the empty collection points at the thing it tells you to tap', /id="colEmpty"[\s\S]{0,260}g-scancard/.test(html));
ok('no bundled or fetched artwork ships anywhere in the page', !/tcgplayer\.com\/.*\.jpg|onepiece-cardgame\.com\/images/.test(js + html));
}
}
