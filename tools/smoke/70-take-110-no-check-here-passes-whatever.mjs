/* smoke section 70: take 110 — no check here passes whatever happens (AGENTS rule 2)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 110 — no check here passes whatever happens (AGENTS rule 2)');
{ const self = fs.readFileSync(new URL(import.meta.url), 'utf8');
  const blind = t => (t.match(/\|\| true[\s,)'"]*\);/g) || []).length;
  ok('no check in this file ends its condition "|| true" (two did, from the take-88 seed, until take 110)', blind(self) === 0, String(blind(self)));
  const T = '|' + '| true';   // spelled apart, or this line would be what it looks for
  ok('...control: the take-109 lines are caught', blind(`ok('x', a ${T}); ok('y', b === false ${T}, '');`) === 2); }
}
