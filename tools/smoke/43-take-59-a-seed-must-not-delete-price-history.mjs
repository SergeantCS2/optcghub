/* smoke section 43: take 59 — a seed must not delete price history (landmine 116)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 59 — a seed must not delete price history (landmine 116)');
const hist = fs.readFileSync(path.join(ROOT, 'tools', 'history.py'), 'utf8');
const bundle = fs.readFileSync(path.join(ROOT, 'ci', 'bundle.sh'), 'utf8');
ok('history.py can union the sidecar with its recent committed versions', /def merge_git\(/.test(hist) && /--merge-git/.test(hist));
ok('a day already on file is never overwritten by an older copy', /if day not in cur:/.test(hist));
ok('it is a no-op outside a git checkout rather than a crash', /no git history to merge/.test(hist));
ok('the nightly runs it BEFORE the fetch, so a thin seed cannot delete a day', bundle.indexOf('--merge-git') > 0 && bundle.indexOf('--merge-git') < bundle.indexOf('pipeline.py ingest history'));
ok('and the day\'s prices are still committed before anything that can fail (take 58)', bundle.indexOf("commit the day's prices") < bundle.indexOf('::group::pipeline') && bundle.indexOf('::group::pipeline') < bundle.indexOf('::group::commit sidecars'));
}
}
