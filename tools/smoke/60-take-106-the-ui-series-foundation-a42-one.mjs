/* smoke section 60: take 106 — the UI series\' foundation (A42): one set of tokens, the accent readable as text in every palette, nothing under 12px, every glyph a call names exists
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 106 — the UI series\' foundation (A42): one set of tokens, the accent readable as text in every palette, nothing under 12px, every glyph a call names exists');
{ /* landmine 142: the skull left the sprite at take 63 and two calls still built its id at runtime */
  const symbols = new Set([...html.matchAll(/<symbol id="g-([\w-]+)"/g)].map(m => m[1]));
  const glyphNames = src => { const names = new Set();
    for (const m of src.matchAll(/\bG\('([\w-]+)'/g)) names.add(m[1]);
    for (const map of src.matchAll(/const [A-Z]+_GLYPH = \{([^}]*)\}/g)) for (const m of map[1].matchAll(/:\s*'([\w-]+)'/g)) names.add(m[1]);
    for (const m of src.matchAll(/\bg: '([\w-]+)'/g)) names.add(m[1]);
    for (const m of src.matchAll(/#g-([\w-]+)/g)) names.add(m[1]);
    return names; };
  const missing = src => [...glyphNames(src)].filter(n => !symbols.has(n));
  ok('every glyph the app names -- G() calls, the glyph maps, the guide, #g- references -- is a symbol in the sprite (landmine 142)', symbols.size >= 20 && glyphNames(js + html).size >= 20 && missing(js + html).length === 0, missing(js + html).join(', ') || `${glyphNames(js + html).size} names, all found`);
  ok('...control: the take-104 call G(\'roger\', 64) is caught', missing("G('roger', 64)").includes('roger'));
  ok('...control: a glyph-map value naming a missing glyph is caught too', missing("const KW_GLYPH = { Blocker: 'blocker', Banish: 'roger' };").includes('roger'));
  const computed = [...js.matchAll(/\bG\(([^'\s][^,)]*)/g)].map(m => m[1].trim());
  ok('...and every computed glyph name comes from a form the check reads (a glyph map or the guide\'s g:), so a new form cannot slip past', computed.length >= 4 && computed.every(e => /^[A-Z]+_GLYPH\[/.test(e) || e === 'c.g'), computed.filter(e => !/^[A-Z]+_GLYPH\[/.test(e) && e !== 'c.g').join(', '));
  /* nothing under 12px anywhere: the CSS, every inline style in the markup and in the templates */
  const under12 = src => [...src.matchAll(/font-size:\s*([0-9.]+)px/g)].map(m => +m[1]).filter(v => v < 12);
  ok('no font size under 12px in the shipped app -- CSS, markup and templates (take 106; 25 rules were 9 to 11.5)', under12(html + js).length === 0, under12(html + js).join(', '));
  ok('...control: a 9px rule is caught', under12('.x{font-size:9px}').length === 1 && under12('.y{font-size:12px}').length === 0);
  ok('the type scale is the tokens, 12px and up, and the CSS uses them', (() => { const fs = [...html.matchAll(/--fs-[a-z]+:(\d+)px/g)].map(m => +m[1]); return fs.length >= 9 && fs.every(v => v >= 12) && (html.match(/font-size:var\(--fs-/g) || []).length >= 20; })());
  /* contrast: the accent as text, the label on the accent, the selected tint, a control's edge -- per palette.
     Own helpers: the take-60 ones live in that section's block (landmine 77). */
  const lum = hx => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hx.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const palette = name => { const at = name === 'collect' ? html.indexOf(':root{') : html.indexOf(`:root[data-mode="${name}"]{`); const block = name === 'collect' ? html.slice(at, html.indexOf(':root[data-mode=')) : html.slice(at, html.indexOf('}', at));
    const t = {}; for (const m of block.matchAll(/--(bg|card|card2|fg|dim|dim2|brass|accent-ink|on-accent|line-strong):(#[0-9A-Fa-f]{6})/g)) t[m[1]] = m[2];
    if (name !== 'collect') { const c = palette('collect'); t['on-accent'] ||= c['on-accent']; } return t; };
  const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
  for (const mode of ['collect', 'play', 'hunt']) { const t = palette(mode);
    ok(`${mode}: the accent as text (--accent-ink) clears 4.5:1 on card and card2`, !!t['accent-ink'] && ratio(t['accent-ink'], t.card) >= 4.5 && ratio(t['accent-ink'], t.card2) >= 4.5, t['accent-ink'] && `${ratio(t['accent-ink'], t.card).toFixed(2)} / ${ratio(t['accent-ink'], t.card2).toFixed(2)}`);
    ok(`${mode}: the label on the accent fill (--on-accent) clears 4.5:1`, !!t['on-accent'] && ratio(t['on-accent'], t.brass) >= 4.5, t['on-accent'] && ratio(t['on-accent'], t.brass).toFixed(2));
    ok(`${mode}: the text tokens clear 4.5:1 on card2 as well as the card`, ['fg', 'dim', 'dim2'].every(k => ratio(t[k], t.card2) >= 4.5), ['fg', 'dim', 'dim2'].map(k => `${k} ${ratio(t[k], t.card2).toFixed(2)}`).join(', '));
    ok(`${mode}: selected text on the selected tint (12% accent into the card) clears 4.5:1`, !!t['accent-ink'] && ratio(t['accent-ink'], mix(t.card, t.brass, .12)) >= 4.5, t['accent-ink'] ? ratio(t['accent-ink'], mix(t.card, t.brass, .12)).toFixed(2) : 'no --accent-ink');
    ok(`${mode}: a control's edge (--line-strong) clears 3:1 on card and card2 (WCAG 1.4.11)`, !!t['line-strong'] && ratio(t['line-strong'], t.card) >= 3 && ratio(t['line-strong'], t.card2) >= 3, t['line-strong'] && `${ratio(t['line-strong'], t.card).toFixed(2)} / ${ratio(t['line-strong'], t.card2).toFixed(2)}`); }
  ok('...control: take 104\'s red as text fails on card2 (3.79) and its knob label on the red (3.29)', ratio('#E0553D', palette('play').card2) < 4.5 && ratio('#F1EFE6', '#E0553D') < 4.5);
  ok('the selected tint is mixed from each palette, not one brass tint for all three (#2A2414 is gone)', /--accent-bg:color-mix\(in srgb,var\(--brass\) 12%,var\(--card\)\)/.test(html) && !/#2A2414/.test(html));
  ok('the knob\'s label is --on-accent in every mode: no per-mode override is left', /\.mode button\.on\{color:var\(--on-accent\)\}/.test(html) && !/\] \.mode button\.on\{/.test(html));
  ok('the slider is one rule and three equal columns under the knob, and no label wraps (the look caught "Prep & Play" on two lines at equal flex thirds)', (html.match(/\.mode button\{/g) || []).length === 1 && /\.mode\{display:inline-grid;grid-template-columns:repeat\(3,1fr\)/.test(html) && /\.mode button\{[^}]*white-space:nowrap/.test(html));
  ok('the filter\'s price row is its own rule, its boxes at the one field rule\'s 16px (they inherited the range pills\' 14px -- landmine 119; take 115: no copy of the field rule)', /\.frange input\{/.test(html) && !/\.frange input\{[^}]*(?:font|font-size|border|background|color)\s*:/.test(html) && /<input id="fMin" (?![^>]*\btype=)/.test(html) && /input:not\(\[type\]\),textarea\{[^}]*font-size:16px/.test(html) && (html.match(/^\.range\{/gm) || []).length === 1 && /class="frange"/.test(html));
  ok('the filter\'s price boxes and the ask sheet\'s text box light up on focus and are 16px (a later rule and an inline border had outranked the focus rule; the text box was 13.5px, landmine 119)', !/\.frange input:focus/.test(html) && /select:focus,input:focus,textarea:focus\{border-color:var\(--brass\)/.test(html) && /<textarea id="askIn"[^>]*style="width:100%;padding:10px;font:16px/.test(js) && !/<textarea id="askIn"[^>]*border:/.test(js));
  ok('a field\'s edge is --line-strong in the one field rule, not a second rule after the focus rule', /select,input\[type="text"\][^{]*\{[^}]*border:1px solid var\(--line-strong\)/.test(html) && !/\}\s*select,input\[type="text"\][^{]*\{border-color:/.test(html));
  ok('the toast sits above the tour and the curtains', /\.toast\{[^}]*z-index:var\(--z-toast\)/.test(html) && /--z-toast:70/.test(html) && /--z-overlay:60/.test(html));
  ok('no invisible block above an empty state', !/\.empty::before/.test(html));
  ok('reduced motion stops every transition, and the tour scrolls without smoothing when asked', /@media \(prefers-reduced-motion:reduce\)\{\*,\*::before,\*::after\{transition-duration:0s!important/.test(html) && /behavior: reducedMotion\(\) \? 'auto' : 'smooth'/.test(js));
  ok('the charts read the palette they are drawn in (the deck chart was brass in red mode)', /x\.strokeStyle = acc;/.test(js) && (js.match(/TOK\('--brass'/g) || []).length >= 3 && !/strokeStyle = '#C9A24A'/.test(js));
  ok('...and outside a browser the lookup falls back instead of throwing', V.TOK ? V.TOK('--brass', '#C9A24A') === '#C9A24A' : /catch \(e\) \{ return fallback; \}/.test(js));
  ok('the splash\'s ground and word-mark are literals of the scene, not the palette (take 116)', /#splash\{[^}]*background:linear-gradient\(180deg,#1f3d72[^}]*color:#F6EEDA\}/.test(html) && /#splash \.wm\{[^}]*color:#F6EEDA/.test(html));
  const keep106 = V.OWN.items; V.OWN.items = []; V.go('collection');   // go() paints through the screen map (landmine 135)
  ok('the empty collection draws the scan card it points at, not the removed skull', /#g-scancard/.test(ctx.document.querySelector('#colEmpty').innerHTML) && !/g-roger/.test(ctx.document.querySelector('#colEmpty').innerHTML), ctx.document.querySelector('#colEmpty').innerHTML.slice(0, 120));
  V.OWN.items = keep106; V.go('home'); }
}
