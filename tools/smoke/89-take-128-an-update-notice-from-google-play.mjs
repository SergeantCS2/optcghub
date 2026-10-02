/* smoke section 89: take 128 — an update notice from Google Play (the owner\'s question): Play\'s own answer, once per version, under About and in Diagnostics
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 128 — an update notice from Google Play (the owner\'s question): Play\'s own answer, once per version, under About and in Diagnostics');
{
  /* the owner, 1 Oct: "a popup that somehow scans google play or something to check for updates, and the app will notify the user
     if there's an update". The source is Play's in-app updates API (@capawesome/capacitor-app-update, definitions.d.ts read first:
     getAppUpdateInfo -> updateAvailability 2 = available, availableVersionCode); the Pages manifest's take was ruled out (it is the
     merged take, not the one on Play). */
  const U = V.UPDATE, P = V.PLATFORM;
  ok('the Play build carries the update plugin', /"@capawesome\/capacitor-app-update"/.test(pkg));
  if (!U || typeof U.check !== 'function' || typeof P.appUpdateInfo !== 'function') ok('take 128\'s update policy and its adapter exist', false, typeof U + ' ' + typeof P.appUpdateInfo);
  else {
    const plug0 = P.plugin, online0 = ctx.navigator.onLine, calls = []; let info = null;
    const stub = { getAppUpdateInfo: async () => { calls.push('info'); if (info instanceof Error) throw info; return { ...info }; }, openAppStore: async () => { calls.push('store'); } };
    const seenKey = U.KEY, seen0 = store[seenKey]; delete store[seenKey];
    P.plugin = n => n === 'AppUpdate' ? stub : plug0.call(P, n); ctx.navigator.onLine = true;
    const NEWER = String(V.TAKE + 1);
    try {
      info = { updateAvailability: 2, availableVersionCode: NEWER, currentVersionCode: String(V.TAKE) };
      await U.check();
      ok('Play says a newer version is there: the app names its take and the one installed', U.newer() === NEWER && U.note() === `Take ${NEWER} is on Google Play — you have take ${V.TAKE}`, U.note());
      let asked = 0; const go = async o => { asked++; return /data-upd="go"/.test(o.opts) && /data-upd="no"/.test(o.opts) && o.key === 'upd' && /Take \d+ is out/.test(o.why) ? 'go' : 'bad'; };
      const offered = await U.offer(go);
      ok('the sheet offers it once -- Update and Later -- and Update opens Google Play', offered === true && asked === 1 && calls.includes('store'), calls.join(' ') + ' asked ' + asked);
      calls.length = 0; const again = await U.offer(go);
      ok('...and not again for the same version: the answer is kept on the phone', again === false && asked === 1 && !calls.includes('store') && store[seenKey] === NEWER, JSON.stringify(store[seenKey]));
      delete store[seenKey]; calls.length = 0; const later = await U.offer(async () => 'no');
      ok('Later opens nothing and is remembered the same way; About keeps the note', later === true && !calls.includes('store') && store[seenKey] === NEWER && U.newer() === NEWER);
      V.go('settings'); let more = ctx.document.getElementById('setBody').innerHTML;
      ok('More → About carries a Google Play row that names the newer take and offers Update', /<b>Google Play<\/b><span id="aboutUpd">Take \d+ is on Google Play/.test(more) && /data-act="update">Update</.test(more), (more.match(/<b>Google Play<\/b>[\s\S]{0,160}/) || ['no row'])[0]);
      info = { updateAvailability: 1, availableVersionCode: String(V.TAKE), currentVersionCode: String(V.TAKE) }; await U.check(); V.go('settings'); more = ctx.document.getElementById('setBody').innerHTML;
      ok('up to date: the row says so and the button offers a check', U.newer() === null && U.note() === 'Up to date on Google Play' && /id="aboutUpd">Up to date on Google Play</.test(more) && /data-act="update">Check for updates</.test(more), U.note());
      let asked2 = 0; const none = await U.offer(async () => { asked2++; return 'go'; });
      ok('negative control: nothing newer, no sheet', none === false && asked2 === 0);
      info = { updateAvailability: 0 }; await U.check();
      ok('an answer that says nothing claims nothing', U.newer() === null && U.note() === 'Google Play gave no answer', U.note());
      info = new Error('The app is not installed from Google Play'); await U.check(); const sideload = await U.offer(async () => 'go');
      ok('Play that does not answer (a sideload): no version named, nothing offered, the reason kept under About', U.newer() === null && U.note() === 'Could not ask Google Play — The app is not installed from Google Play' && sideload === false, U.note());
      P.plugin = plug0; await U.check();
      ok('a browser has no plugin: the row says Google Play was not asked, and why', U.newer() === null && /^Could not ask Google Play — this build has no update plugin/.test(U.note()), U.note());
      P.plugin = n => n === 'AppUpdate' ? stub : plug0.call(P, n); info = { updateAvailability: 2, availableVersionCode: NEWER, currentVersionCode: String(V.TAKE) }; calls.length = 0; ctx.navigator.onLine = false; await U.check();
      ok('offline, Play is not asked and nothing is claimed', !calls.includes('info') && U.newer() === null && U.note() === 'Could not ask Google Play — offline', U.note());
      ctx.navigator.onLine = true;
      const rep = await V.DIAG.report();
      ok('Diagnostics carries the update line in the same words, and its plugin list knows the update plugin', rep.split('\n').includes('update: ' + U.note()) && /^plugins: .*AppUpdate/m.test(rep), (rep.match(/^(update|plugins): .*$/mg) || []).join(' | '));
      ok('the boot asks Play once the first-open guide and the consent flow are out of the way, never over them (a static wiring the stub cannot run)', typeof U.watch === 'function' && typeof U.checkWhenFree === 'function' && /UPDATE\.watch\(\)/.test(js) && !/UPDATE\.check\(\)\.then/.test(js));
      /* the owner: "should happen automatically occasionally ... they shouldn't have to check for updates manually" -- on return to the
         front, and hourly while open, the app asks again once six hours have passed since the last check */
      { const keepLast = U.lastAt; U.lastAt = Date.now(); const fresh = U.due(); U.lastAt = Date.now() - U.EVERY - 1; const stale = U.due();
        ok('the app asks Play again on its own once six hours have passed since the last check, and not before', U.EVERY === 6 * 3600e3 && fresh === false && stale === true, JSON.stringify({ every: U.EVERY, fresh, stale }));
        info = { updateAvailability: 1, availableVersionCode: String(V.TAKE), currentVersionCode: String(V.TAKE) }; calls.length = 0; ctx.navigator.onLine = true;
        U.lastAt = Date.now(); U.resume(); await new Promise(r => setTimeout(r, 800));
        const soon = calls.length;
        U.lastAt = Date.now() - U.EVERY - 1; U.resume(); await new Promise(r => setTimeout(r, 800));
        ok('...coming back to the front asks when the last check is old, and leaves Play alone when it is fresh; the check moves the clock', soon === 0 && calls.includes('info') && Date.now() - U.lastAt < 5000, JSON.stringify({ soon, calls, age: Date.now() - U.lastAt }));
        U.lastAt = keepLast; }
      { const pk = ctx.document.getElementById('picker'), tour = ctx.document.getElementById('tour'); const was = { pk: pk.classList.contains('on'), tour: tour.classList.contains('on'), hidden: tour.hidden };
        pk.classList.remove('on'); tour.classList.remove('on'); const free = U.busy();
        pk.classList.add('on'); const overPicker = U.busy(); pk.classList.remove('on');
        tour.hidden = false; tour.classList.add('on'); const overGuide = U.busy(); tour.classList.remove('on'); tour.hidden = was.hidden;   /* the guide opens as guideOpen does: unhidden and on */
        if (was.pk) pk.classList.add('on'); if (was.tour) tour.classList.add('on');
        ok('...and waits while a sheet is open -- the printing picker shares it, and a new prompt would dismiss the one being answered -- or the guide is up', free === false && overPicker === true && overGuide === true, JSON.stringify({ free, overPicker, overGuide })); }
    } finally { P.plugin = plug0; ctx.navigator.onLine = online0; if (seen0 === undefined) delete store[seenKey]; else store[seenKey] = seen0; U.info = null; U.why = 'not asked yet'; V.go('home'); }
  }
}
}
