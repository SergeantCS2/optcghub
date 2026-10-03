/* smoke section 80: take 120 — the UI series wrapped up: the binder on the open Fold, the audit\'s small boxes
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 120 — the UI series wrapped up: the binder on the open Fold, the audit\'s small boxes');
{ const css = (html.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1];
  ok('the binder on the open Fold is a spread: two pages side by side from 700 px (Home\'s own breakpoint), the pager by two, a repaint when the Fold opens; one page below it',
     /const bnSpread = \(\) => typeof innerWidth === 'number' && innerWidth >= 700;/.test(js) && /#bnGrid\.spread\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:14px\}/.test(css) && /<div id="bnGrid"><\/div>/.test(html) && !/class="bnpage" id="bnGrid"/.test(html) && /function bnTurn\(d\) \{ const step = bnSpread\(\) \? 2 : 1, at = bnSpread\(\) \? BN\.page - \(BN\.page % 2\) : BN\.page;/.test(js) && /addEventListener\('resize', \(\) => \{ const b = \$\('#binder'\);/.test(js));
  { /* live, in the stub, the window told it is the open Fold: the largest set, one card held on its third page */
    const keep = { items: V.OWN.items, set: V.BN.set, pageOf: { ...V.BN.pageOf }, active: V.PF.active };
    const numKey = n => { const m = n.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 9999; };
    const bySet = new Map(); for (const p of V.CAT.rows) if (p.num) { const m = bySet.get(p.set) || new Map(); if (!m.has(p.num)) m.set(p.num, p); bySet.set(p.set, m); }
    const [sid, m] = [...bySet.entries()].sort((a, b) => b[1].size - a[1].size)[0];
    const nums = [...m.keys()].sort((a, b) => numKey(a) - numKey(b) || a.localeCompare(b)), pages = Math.ceil(nums.length / 9);
    V.PF.active = 'main'; V.OWN.items = [{ id: m.get(nums[20]).id, qty: 1, condition: 'NM', pf: 'main' }];
    const grid = () => ctx.document.getElementById('bnGrid').innerHTML, label = () => ctx.document.getElementById('bnPage').textContent, count = (h, re) => (h.match(re) || []).length;
    ctx.innerWidth = 749; V.BN.set = sid; delete V.BN.pageOf[sid]; V.go('binder');
    const wide = { pages: count(grid(), /<div class="bnpage">/g), pockets: count(grid(), /class="pocket/g), label: label(), page: V.BN.page };
    V.bnTurn(1); const next = { label: label(), page: V.BN.page }; V.bnTurn(-1); const back = { label: label(), page: V.BN.page };
    delete ctx.innerWidth; V.go('binder'); const narrow = { pages: count(grid(), /<div class="bnpage">/g), pockets: count(grid(), /class="pocket/g), label: label(), page: V.BN.page };
    ok(`the open Fold: the set opens on the spread that holds its first held card (pages 3\u20134 of ${pages}), two pages of nine pockets each`, wide.pages === 2 && wide.pockets === 18 && wide.page === 2 && new RegExp(` pages 3\u20134 of ${pages}$`).test(wide.label), JSON.stringify(wide));
    ok('...Next turns the spread over (pages 5\u20136), Prev turns it back', next.page === 4 && / pages 5\u20136 of /.test(next.label) && back.page === 2 && / pages 3\u20134 of /.test(back.label), JSON.stringify({ next, back }));
    ok('...and at the cover width the same set is one page of nine again, the third', narrow.pages === 1 && narrow.pockets === 9 && narrow.page === 2 && new RegExp(` page 3 of ${pages}$`).test(narrow.label), JSON.stringify(narrow));
    V.OWN.items = keep.items; V.BN.set = keep.set; V.BN.pageOf = keep.pageOf; V.PF.active = keep.active; V.go('home'); }
  ok('the binder reads in light too: the number pill in the card\'s own colour under the accent ink, the name over the art white in both themes, a lighter page in light with the empty pockets\' dashed edges at the control\'s strength',
     /\n\.pocket \.n\{[^}]*color:var\(--accent-ink\);\n  background:color-mix\(in srgb,var\(--card\) 85%,transparent\);/.test(css) && /\n\.pocket \.tag\{[^}]*color:#fff;\n/.test(css) && /:root\[data-theme="light"\] \.bnpage\{background:color-mix\(in srgb,var\(--card\) 90%,#000 10%\)\}/.test(css) && /:root\[data-theme="light"\] \.pocket\.empty\{border-color:var\(--line-strong\);opacity:\.7\}/.test(css));
  ok('a product with no market price says so instead of "— \u00b7 market", and skips the low\u2013high line it has no numbers for', /\$\{p\.market != null \? `\$\{money\(p\.market\)\} \\u00b7 market` : 'No market price yet'\}/.test(js) && /\$\{p\.low != null \|\| p\.high != null \? `Low \$\{money\(p\.low\)\}/.test(js));
  { const np = V.CAT.rows.find(p => p.market == null && p.name && !p.sealed) || V.CAT.rows.find(p => p.market == null && p.name);
    if (np) { V.openDetail(np.id); const prov = ctx.document.getElementById('dProv').innerHTML; V.closeAnyOverlay();
      ok(`...live: ${np.num || np.name} has no market price and its page says so, with no low\u2013high line`, /^No market price yet \u00b7 TCGplayer/.test(prov) && !/Low /.test(prov), prov.slice(0, 80)); }
    else ok('...live: every product in this catalogue has a market price (nothing to open)', true); }
  ok('a day in a mixed distributor line never breaks (no-break spaces, as every day since take 112)', /\\u00b7 mixed \\u00b7 release \$\{esc\(nbsp\(dayText\(rel\)\)\)\}/.test(js));
  /* take 123: the board draws a card as the view hands it -- simCard(att), not simCard(att.id) */
  ok('the Sim\'s battle: the two powers across the middle of the table, each its own number, the attacker\'s then the defender\'s with its counters (take 124; take 120 fixed "5000attacks with")', /<span class="tb-clash" aria-label="\$\{b\.powers\.a\} against \$\{b\.powers\.d\}"><b>\$\{b\.powers\.a\}<\/b>\$\{G\('sword', 18\)\}<b>\$\{b\.powers\.d\}<\/b>/.test(js) && !/<span>attacks with <b>/.test(js));
  ok('a deck row\'s second line wraps (at 411 px the ellipsis cut the keyword tags), and a set\'s name wraps in Home\'s half-width panel on the open Fold', /\n\.dkrow \.n > span\{font-size:var\(--fs-cap\);color:var\(--dim\);display:block;white-space:normal\}/.test(css) && /\n#setDone \.row \.nm b\{white-space:normal\}/.test(css));
  ok('...control: the nowrap line planted back is caught', !/\n\.dkrow \.n > span\{font-size:var\(--fs-cap\);color:var\(--dim\);display:block;white-space:normal\}/.test(css.replace('display:block;white-space:normal}', 'display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}')));
  ok('a Sealed row names its kind in the singular ("Box", not "Boxes"; "Sealed product" for the rest)', /out\.push\(sealedRow\(p, esc\(sealedWord\(p\)\), tl, byDist\)\);/.test(js) && !/sealedKind\(p\)\[1\]/.test(js) && /\['other', 'Other', 'Sealed product'\]/.test(js));
  ok('a Leader in the Leader sheet and a printing in the printing sheet show their number where the picture host refuses the picture (an empty grey box before): the placeholder refArt hides on load',
     /<div class="oa">\$\{refArt\(p\)\}<div class="ph">\$\{esc\(\(p\.num \|\| ''\)\.split\('-'\)\.pop\(\) \|\| ''\)\}<\/div><\/div>\n\s*<div class="oi"><b>\$\{esc\(p\.name\)\}<\/b>/.test(js) && /<div class="oa">\$\{refArt\(p\)\}<div class="ph">\$\{esc\(\(p\.num \|\| ''\)\.split\('-'\)\.pop\(\) \|\| ''\)\}<\/div><\/div>\n\s*<div class="oi"><b>\$\{esc\(TREAT\[p\.treat\] \|\| p\.treat\)\}/.test(js) && /q=p&&p\.querySelector\('\.ph'\);if\(q\)q\.style\.display='none'/.test(js));
  { const readme = fs.readFileSync(path.join(ROOT, 'assets', 'user', 'README.md'), 'utf8');
    ok('the owner\'s README keeps only the slots the build reads -- home-bg, hero-play, hero-hunt and the fonts; the retired empty-collection slot is gone', !/empty-collection/.test(readme) && ['home-bg.jpg', 'hero-play.jpg', 'hero-hunt.jpg', 'display.woff2'].every(k => readme.includes(k))); }
}
}
