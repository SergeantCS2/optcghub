/* smoke section 77: take 118 — Collect on indigo and gold, Hunt in kraft, Home\'s premium pass (the owner\'s picks from real screenshots)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 118 — Collect on indigo and gold, Hunt in kraft, Home\'s premium pass (the owner\'s picks from real screenshots)');
{ ok('Collect is Wano indigo with the bright gold G1: the block reads the measured hexes', /:root\{[\s\S]*?--bg:#100D22; --card:#1A1633; --card2:#231E43; --line:#37305C;/.test(html) && /--brass:#F2C14E; --brass2:#C4962A;/.test(html) && /--accent-ink:#F5CB5C; --line-strong:#766D96;/.test(html));
  ok('Hunt is kraft and gold', /:root\[data-mode="hunt"\]\{\s*--bg:#1A1410; --card:#26201A; --card2:#322A22; --line:#4A3E33;/.test(html) && /--accent-ink:#E2B65A; --line-strong:#857665;/.test(html) && /body::before\{background:radial-gradient\(60% 40% at 50% 0%,#3A2C1E 0%/.test(html));
  ok('Play is untouched', /:root\[data-mode="play"\]\{\s*--bg:#15171C; --card:#1E2128; --card2:#262A33;/.test(html) && /--brass:#E0553D; --brass2:#B64731;/.test(html));
  ok('three modes, three grounds: no two share a hue family (indigo, charcoal, kraft)', (() => { const h = x => { const n = parseInt(x.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return [r, g, b]; }; const [c, p, k] = [h('#100D22'), h('#15171C'), h('#1A1410')]; return c[2] > c[0] && c[2] > c[1] && k[0] > k[2] && Math.abs(p[0] - p[2]) < 8; })());
  ok('the reminders\' tint and the charts\' fallbacks follow the new gold; the old brass is nowhere in the page but the share page (a fixed page, dark by design)', (js.match(/iconColor: '#F2C14E'/g) || []).length === 2 && (js.match(/TOK\('--brass', '#F2C14E'\)/g) || []).length === 3 && (js.match(/#C9A24A/g) || []).length <= 6);
  /* the premium pass */
  ok('Home\'s panels are surfaces with a caps label and a fading rule; the hero is a card on the dearest printing\'s art; the total wears the gold gradient', /\n\.panel\{background:linear-gradient\(180deg,var\(--card2\),var\(--card\)\);border-radius:var\(--r-xl\);/.test(html) && /\.panel h3::after\{content:"";flex:1 1 24px;order:1;height:1px;/.test(html) && /#home \.hero::before\{[^}]*background:var\(--hero-art,none\)/.test(html) && /#home \.total\{[^}]*background-clip:text;color:transparent\}/.test(html) && !/#home \.panel\{background:none/.test(html));
  ok('the two tabs are a pill switch and the ranges one pill group; the cells wear the same surface', /#home \.segtabs\{[^}]*border-radius:var\(--r-pill\)\}/.test(html) && /#home \.ranges\{display:inline-flex;[^}]*border-radius:var\(--r-pill\);/.test(html) && /\.statbar>div\{[^}]*background:linear-gradient\(180deg,var\(--card2\),var\(--card\)\)/.test(html));
  V.MODE.set('collect', false); if (!V.OWN.items.length) { const c = V.CAT.rows.find(p => !p.sealed && p.img && p.market > 1); V.OWN.add(c.id, { condition: 'NM' }); } V.go('home'); V.paintHome();
  const top = ctx.document.getElementById('topList').innerHTML, hero = ctx.document.getElementById('hero').style.cssText;
  ok('Most valuable is a shelf of cards: a tap target per printing with its picture, its value and its name -- never a number alone (AGENTS rule 3)', /^<div class="shelf">/.test(top) && (top.match(/<button class="st" data-open="\d+"/g) || []).length >= 1 && (top.match(/<img class="ref"/g) || []).length >= 1 && /<div class="v mono">/.test(top) && /<span class="phl">/.test(top) && /class="pic"/.test(top));
  ok('...and the hero carries the dearest printing\'s large art', /--hero-art:url\("https:\/\//.test(hero) && /_in_1000x1000\.jpg"\)/.test(hero), hero.slice(0, 120));
  ok('...the shelf holds up to six', (top.match(/<button class="st"/g) || []).length <= 6);
  ok('the take-98 tap still lands: a shelf card carries data-open, and no old row is painted', !/<button class="row"/.test(top));
}
}
