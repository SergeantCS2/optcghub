/* smoke section 30: take 35 — the scrubber: what ships carries no comments and no markers
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 35 — the scrubber: what ships carries no comments and no markers');
ok('app.js ships without a single comment', !/\/\*[\s\S]*?\*\//.test(js) && !/^\s*\/\/.*$/m.test(js));
ok('index.html ships without HTML comments outside scripts', !/<!--[\s\S]*?-->/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')));
ok('the source still carries its record (the strip is on the artifact, not src/)', /\/\* PROTOCOL §10\. A portfolio line/.test(appSource()));
/* take 89: the install list lives once, in ci/deps.sh, and BOTH runners of the pipeline call it (landmine 121);
   the hourly, which only builds the app, installs the parser itself */
ok('CI installs the parser the strip needs (A-83: every job is a fresh runner)', /npm install --silent --no-save puppeteer acorn/.test(fs.readFileSync(path.join(ROOT, 'ci', 'deps.sh'), 'utf8')));
ok('the nightly and the PR check both run the one install list (landmine 121)', /^bash ci\/deps\.sh/m.test(fs.readFileSync(path.join(ROOT, 'ci', 'bundle.sh'), 'utf8')) && /^bash ci\/deps\.sh/m.test(fs.readFileSync(path.join(ROOT, 'ci', 'check.sh'), 'utf8')) && /npm install[^\n]*\bacorn\b/.test(fs.readFileSync(path.join(ROOT, 'ci', 'hunt.yml'), 'utf8')));
ok('the gate runs the scrubber and its controls', /check_scrub\(\)/.test(fs.readFileSync(path.join(ROOT, 'tools', 'gate.py'), 'utf8')) && /scrub\.py"\), "--selftest"/.test(fs.readFileSync(path.join(ROOT, 'tools', 'gate.py'), 'utf8')));
}
}
