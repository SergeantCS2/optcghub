/* smoke section 58: take 104 — three fixes from the owner\'s own Diagnostics run: a browser without a camera skips with its reason, the effects line says what it counts
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 104 — three fixes from the owner\'s own Diagnostics run: a browser without a camera skips with its reason, the effects line says what it counts');
{ const cv = V.cameraVerdict;
  ok('cameraVerdict: no camera in a browser is a SKIP with the reason, not a failure of the app', typeof cv === 'function' && (() => { const r = cv([], false); return !!(r && r.skip && /no camera listed on this device/.test(r.note)); })(), JSON.stringify(cv && cv([], false)));
  ok('...control: no camera on the phone is still a FAIL', typeof cv === 'function' && (() => { const r = cv([], true); return !!(r && !r.skip && r.ok === false); })());
  ok('...and a camera is a PASS with the count, wherever it runs', typeof cv === 'function' && (() => { const a = cv([{ kind: 'videoinput' }], false), b = cv([{ kind: 'videoinput' }, { kind: 'videoinput' }], true); return !!(a && a.ok === true && /1 camera/.test(a.note) && b && b.ok === true && /2 camera/.test(b.note)); })());
  const savedMD = ctx.navigator.mediaDevices; ctx.navigator.mediaDevices = { enumerateDevices: async () => [] };
  const cam = Object.fromEntries((await V.SELFTEST.run()).checks.map(c => [c.name, c]))['Camera reachable'];
  ctx.navigator.mediaDevices = savedMD;
  ok('through the self-test\'s own check: the line reads SKIP with the reason, not "not available here"', !!cam && cam.s === 'SKIP' && /no camera listed on this device/.test(cam.note), JSON.stringify(cam));
  const el = V.effectsLine;
  ok('effectsLine says what it counts: effect lines, with the cards beside', typeof el === 'function' && el({ scripted: 2187, lines: 7697 }, 1926) === '2187 of 7697 effect lines (1926 cards)', el && el({ scripted: 2187, lines: 7697 }, 1926));
  ok('...and Diagnostics prints the effects line through it', /line\('effects scripted', [^\n]*effectsLine\(/.test(js));
}
}
