/* smoke section 21: take 20 — chart from history, staleness, portfolio sheets
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 20 — chart from history, staleness, portfolio sheets');
ok('the bundle carries daily history aligned to a day list',
   Array.isArray(V.CAT.days) && V.CAT.days.length >= 2 && Object.keys(V.CAT.hist).length > 5000,
   `${V.CAT.days.length} days, ${Object.keys(V.CAT.hist).length} products`);
ok('every history row is aligned to the day list',
   Object.values(V.CAT.hist).every(a => a.length === V.CAT.days.length));
ok('history values match the catalogue delta arithmetic (landmine 62: derived, not pinned)',
   (() => { const p = V.CAT.rows.find(x => x.d1p != null && V.CAT.hist[x.id] && V.CAT.hist[x.id].every(v => v != null));
            if (!p) return false; const h = V.CAT.hist[p.id]; const last = h[h.length - 1], prev = h[h.length - 2];
            return Math.abs((last - prev) - p.d1a) < 0.011; })());
ok('the chart labels an estimate as an estimate and draws it dashed',
   /estimated from today/.test(js) && /setLineDash\(\[6, 5\]\)/.test(js));
ok('a record of three or more snapshots takes precedence over the estimate',
   /rec\.length >= 3\) return \{ kind: 'record'/.test(js));
ok('the stale banner names the date and says what to do (and it is TRUE now — take 27)',
   /days old/.test(js) && /Sync now/.test(js) && /Update the app for newer prices/.test(js));
/* Take 115 (the runner lane, landmine 180's family): the report is its own job that needs every job and runs
   unless the run was cancelled, so a failed apk or pages job files the thread too, and it closes only on a
   run where every job succeeded; no job hides its failure behind continue-on-error. */
const a9ok = yml => /\n  report:\n    needs: \[seed, bundle, pages, apk\]\n    if: \$\{\{ !cancelled\(\) \}\}\n/.test(yml) && /\n          LABEL: nightly-failure\n/.test(yml) && /gh issue comment/.test(yml) && !/\n    continue-on-error: true/.test(yml);
ok('CI opens one deduplicated issue on any failed job and closes it only when every job ran green (A9, take 115)',
   a9ok(fs.readFileSync(path.join(ROOT, 'ci', 'build.yml'), 'utf8')));
{ /* the controls are built from the two faults, on this take's own file (the runner's checkout has no tags) */
  const yml = fs.readFileSync(path.join(ROOT, 'ci', 'build.yml'), 'utf8');
  const noReport = yml.replace(/\n  report:\n[\s\S]*$/, '\n'), hidden = yml.replace(/\n  pages:\n/, '\n  pages:\n    continue-on-error: true\n');
  ok('negative controls: without the report job, or with the Pages job hiding its failure (take 114\'s continue-on-error), that fails',
     noReport !== yml && hidden !== yml && !a9ok(noReport) && !a9ok(hidden), `${noReport !== yml} ${hidden !== yml}`);
}
ok('the launch image is the listing\'s frame (take 116): apk.sh runs ci/icon.py, which paints the page\'s own scene and refuses any other, and the system splash sits on the band\'s colour',
   (() => { const apk = fs.readFileSync(path.join(ROOT, 'ci', 'apk.sh'), 'utf8'), icon = fs.readFileSync(path.join(ROOT, 'ci', 'icon.py'), 'utf8');
            return /\npython3 ci\/icon\.py android\/app\/src\/main\/res/.test(apk) && /def splash\(W, H, master, app_src/.test(icon) && /SPLASH_BG = \(31, 61, 114\)/.test(icon)
              && /not the band's/.test(icon) && /windowSplashScreenBackground">#1f3d72</.test(apk) && !/splash-bg\.jpg/.test(icon); })());
ok('portfolio move, new and rename are sheets, not prompts',
   /data-pfmove/.test(js) && /data-pfname/.test(js) && !/prompt\('Portfolio name/.test(js) && !/prompt\('Move /.test(js));
ok('bulk condition is a sheet', /data-bulkcond/.test(js) && !/prompt\('Set condition/.test(js));
}
}
