/* smoke section 67: take 110 — the Fold\'s inner screen (A42): two panes where two fit, between a phone and the desktop column
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 110 — the Fold\'s inner screen (A42): two panes where two fit, between a phone and the desktop column');
{ const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  const fold = (css.match(/@media \(min-width:700px\) and \(max-width:899px\)\{([\s\S]*?)\n\}/) || [, ''])[1];
  const want = [/#detail \.dhero\{float:left/, /#detail \.dhero \.art\{width:300px\}/, /#detail > \.panel:not\(\[hidden\]\)\{display:flow-root\}/, /#home\.screen\.on\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,
    /#home\.screen\.on > \.panel:has\(#topList\),#home\.screen\.on > \.panel:has\(#setDone\)\{grid-column:auto\}/, /#allRes > \.panel,#relList > \.panel\{display:grid/, /#sealedList,#dkList,#dkStock,#cdRes,#eventsList\{display:grid/,
    /#colGrid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)\}/, /\.sheetbody\{max-width:640px\}/];
  const miss = t => want.filter(r => !r.test(t)).map(String);
  ok('the open Fold (700-899 px) gets two panes: a card beside its page, Home\'s two lists side by side, rows two to a line, four tiles across, a sheet at a readable width', !!fold && miss(fold).length === 0, miss(fold).join(' | '));
  ok('...control: a stylesheet without them is caught', miss('').length === want.length);
  /* take 110's review: what the first push got wrong in that range */
  ok('...a hidden panel stays hidden there, the art sits behind the card\'s column only, Local stays one column, and a lone Events panel spans',
     /#detail > \.panel:not\(\[hidden\]\)\{display:flow-root\}/.test(fold) && !/#detail > \.panel\{display:flow-root\}/.test(fold) && /#detail \.artbg\.dback\{right:auto;width:calc\(var\(--pad\) \+ 320px\)/.test(fold)
     && !/#localList\{display:grid|,#localList\{display:grid/.test(fold) && /#eventsList:not\(:has\(> \.panel ~ \.panel\)\) > \.panel\{grid-column:1\/-1\}/.test(fold) && /#home\.perf\.screen\.on > \.panel:has\(#topList\)\{grid-column:1\/-1\}/.test(fold));
  ok('...control: the first push\'s rules are caught', !/#detail > \.panel:not\(\[hidden\]\)\{display:flow-root\}/.test('#detail > .panel{display:flow-root}') && /#localList\{display:grid|,#localList\{display:grid/.test('#sealedList,#eventsList,#localList{display:grid}'));
  { const sp = ctx.document.getElementById('setPanel'), comp = ctx.document.getElementById('setComp') || { style: {} };   /* an older build has no id: the check fails on its own */
    sp.style.display = 'block'; V.setHomeTab(true);
    const onPerf = { comp: comp.style.display, search: sp.style.display, perf: ctx.document.getElementById('home').classList.contains('perf') };
    V.setHomeTab(false); const back = { comp: comp.style.display, perf: ctx.document.getElementById('home').classList.contains('perf') };
    ok('Home\'s Performance tab hides Home\'s own Set completion, not Search\'s set list (the list named Search\'s panel from take 64 on)', onPerf.comp === 'none' && onPerf.search === 'block' && onPerf.perf && back.comp === '' && !back.perf, JSON.stringify([onPerf, back]));
    ok('...the list names Home\'s own panel, and the take-64 one is caught', !/HOME_OVERVIEW = \['hero', 'setPanel'/.test(js) && /HOME_OVERVIEW = \['hero', 'setComp', 'srcPanel'\]/.test(js) && /HOME_OVERVIEW = \['hero', 'setPanel'/.test("const HOME_OVERVIEW = ['hero', 'setPanel', 'srcPanel'];")); }
  ok('...and the phone and the desktop column are as they were: the rules live only inside that range, take 60\'s column from 900 px', /@media \(min-width:900px\)\{\s*body\{max-width:520px/.test(css) && !/^#detail \.dhero\{float:left/m.test(css.replace(fold, '')));
}
}
