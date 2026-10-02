/* smoke section 34: take 45 — the on-device self-test, run here in node
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { c } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 45 — the on-device self-test, run here in node');
ctx.navigator.onLine = false;
const rep = await V.SELFTEST.run();
const by = Object.fromEntries(rep.checks.map(c => [c.name, c]));
ok('every check has a name and a verdict', rep.checks.length >= 15 && rep.checks.every(c => /^(PASS|FAIL|SKIP)$/.test(c.s)));
ok('the self-test proves a scripted effect offers and applies (take 52)', by['Sim: scripted effects loaded and one offers correctly'] && by['Sim: scripted effects loaded and one offers correctly'].s === 'PASS', JSON.stringify(by['Sim: scripted effects loaded and one offers correctly']));
ok('the catalogue, index, gate and search checks PASS against the real catalogue',
   ['Catalogue loaded', 'Printing index is one-to-one', 'The confidence gate asks on EB03-024\'s three printings', 'A unique number auto-accepts', 'Search finds a card by name', 'Star template shipped'].every(n => by[n] && by[n].s === 'PASS'),
   JSON.stringify(rep.checks.filter(c => c.s === 'FAIL')));
ok('plugin checks SKIP where there is no plugin, never PASS by default',
   ['Backup file round-trip (Filesystem)', 'Share sheet available', 'OCR reads a code the app drew (ML Kit)', 'Notifications permission', 'Ads: the units match this build'].every(n => by[n] && by[n].s === 'SKIP'));
ok('offline, the sync check SKIPs rather than failing', by['Sync URL answers'].s === 'SKIP');
/* take 92, landmine 131: the OCR check was SKIP everywhere but a phone, and on
   the phone it failed a correct read for forty-six takes (`m.num`, a field
   parseRead never had). Exercise the comparison with an injected answer. */
{
  const P = V.PLATFORM, hadOcr = P.hasOcr, ocr = P.ocr;
  const said = text => async () => ({ text, lines: [{ text, box: null }] });   // take 125: the recogniser's answer is { text, lines }
  P.hasOcr = () => true; P.ocr = said('OP01-016');
  const good = Object.fromEntries((await V.SELFTEST.run()).checks.map(c => [c.name, c]))['OCR reads a code the app drew (ML Kit)'];
  ok('the OCR self-test PASSES a correct read of the code it drew', good && good.s === 'PASS' && /OP01-016/.test(good.note), JSON.stringify(good));
  P.ocr = said('nothing like a code');
  const bad = Object.fromEntries((await V.SELFTEST.run()).checks.map(c => [c.name, c]))['OCR reads a code the app drew (ML Kit)'];
  ok('negative control: a wrong read FAILS it', bad && bad.s === 'FAIL', JSON.stringify(bad));
  P.hasOcr = hadOcr; P.ocr = ocr;
}
ok('the report is shareable text with a summary line', /pass, \d+ fail, \d+ skipped/.test(V.SELFTEST.text()) && V.SELFTEST.text().split('\n').length > 14);
ok('the sim log is shareable text (take 52)', /data-sim="sharelog"/.test(js) && typeof V.simLogText === 'function');
const saved = V.CAT.rows; V.CAT.rows = saved.slice(0, 100);
const bad = await V.SELFTEST.run();
ok('negative control: a truncated catalogue makes the first check FAIL', bad.checks[0].s === 'FAIL', bad.checks[0].s);
V.CAT.rows = saved; delete ctx.navigator.onLine;
ok('More has the Run button and the report box', /id="stRun"/.test(js) && /id="stOut"/.test(js));
}
}
