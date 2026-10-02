/* smoke section 86: take 127 — consent first, the owner\'s three units, and a free save when no ad loads
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { c, A } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 127 — consent first, the owner\'s three units, and a free save when no ad loads');
/* The owner (30 Sept): consent and the units in one take; when no ad can be loaded the save goes through free.
   The consent API is 8.1.0's (dist/esm/consent; Android AdConsentExecutor); a failed load sends
   onRewardedVideoAdFailedToLoad { code, message } before it rejects -- the stub keeps both orders. */
const P = V.PLATFORM, C = V.CREDITS, TEST = 'ca-app-pub-3940256099942544/', PUB = 'ca-app-pub-6243777967151950/';
const L0 = manifest.ads && manifest.ads.live;
ok('the three units ride ads.live: the publisher\'s, three of them, from take 127 -- the first build that asks for consent',
   !!L0 && [L0.scan, L0.deck, L0.max].every(u => typeof u === 'string' && u.startsWith(PUB)) && new Set([L0.scan, L0.deck, L0.max]).size === 3 && L0.from >= 127 && L0.from <= V.TAKE, JSON.stringify(L0));
ok('...and ads.scan and ads.deck, which every older install reads, stay Google\'s test unit', String(manifest.ads.scan).startsWith(TEST) && String(manifest.ads.deck).startsWith(TEST));
const A = V.ADS || null;   /* take 134 */
if (!A || typeof A.start !== 'function' || typeof C.freeSave !== 'function') ok('take 127\'s consent flow and free save exist (in ADS since take 134)', false, typeof (A && A.start) + ' ' + typeof C.freeSave);
else {
  ok('with no consent answer this build loads Google\'s test units, whatever ads.live says', (u => u.test === true && String(u.scan).startsWith(TEST))(A.units()), JSON.stringify(A.units()));
  const calls = [], Lsn = {};
  let consentInfo, formResult, loadFail = null;
  const stub = {
    requestConsentInfo: async () => { calls.push('consent'); if (consentInfo instanceof Error) throw consentInfo; return { ...consentInfo }; },
    showConsentForm: async () => { calls.push('form'); return { ...formResult }; },
    showPrivacyOptionsForm: async () => { calls.push('privacy'); },
    initialize: async () => { calls.push('init'); },
    addListener: async (n, f) => { Lsn[n] = f; return { remove() {} }; },
    prepareRewardVideoAd: async o => { calls.push('prepare:' + o.adId); if (loadFail) { if (Lsn.onRewardedVideoAdFailedToLoad) Lsn.onRewardedVideoAdFailedToLoad({ ...loadFail }); throw new Error(loadFail.message); } return { adUnitId: o.adId }; },
    showRewardVideoAd: async o => { calls.push('show:' + (o && o.adId)); const r = { type: 'Reward', amount: 1 }; if (Lsn.onRewardedVideoAdReward) Lsn.onRewardedVideoAdReward(r); return r; }
  };
  const NOT_REQ = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
  const REQ = { status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false, privacyOptionsRequirementStatus: 'REQUIRED' };
  const plug0 = P.plugin, enabled0 = C.enabled, online0 = ctx.navigator.onLine;
  const keep = { st: JSON.parse(JSON.stringify(C.state)), items: V.OWN.items.slice(), until: V.MAXLOCK.until };
  const reset = () => { A._consent = null; A._canRequestAds = undefined; A._started = false; A._starting = null; A._ready = { scan: false, deck: false, max: false }; calls.length = 0; loadFail = null; };
  P.plugin = n => n === 'AdMob' ? stub : plug0.call(P, n); C.enabled = () => true; ctx.navigator.onLine = true;
  try {
    reset(); consentInfo = NOT_REQ; await A.start();
    ok('consent is asked before the SDK starts and before any ad loads (not required here: no form)', calls[0] === 'consent' && calls.indexOf('init') > 0 && calls.findIndex(c => c.startsWith('prepare')) > calls.indexOf('init') && !calls.includes('form'), calls.join(' '));
    ok('...and consent that allows ads opens this build\'s live units', A._canRequestAds === true && (u => u.test === false && u.scan === L0.scan)(A.units()), JSON.stringify(A.units()));
    reset(); consentInfo = REQ; formResult = { status: 'OBTAINED', canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED' }; await A.start();
    ok('where consent is required Google\'s form comes first, and its answer decides', calls.slice(0, 3).join(' ') === 'consent form init' && A._canRequestAds === true, calls.join(' '));
    ok('...and More offers Privacy choices where the consent SDK requires it', A.privacyShown() === true);
    reset(); consentInfo = REQ; formResult = { status: 'OBTAINED', canRequestAds: false, privacyOptionsRequirementStatus: 'REQUIRED' }; await A.start();
    ok('negative control: consent that allows no ads -- the SDK never starts and nothing loads', A._canRequestAds === false && !calls.includes('init') && !calls.some(c => c.startsWith('prepare')), calls.join(' '));
    const cards = V.CAT.rows.filter(p => p.num && !p.sealed).slice(0, 3).map(p => ({ id: p.id }));
    C.state.scan = 0; C.state.pending = cards.slice(); C.state.free = 0; const own0 = V.OWN.items.length;
    await A.show('scan');
    ok('consent that allows no ads: the waiting cards save free, no credit left over, counted', C.state.pending.length === 0 && V.OWN.items.length > own0 && C.state.scan === 0 && C.state.free === 1, `pending ${C.state.pending.length} scan ${C.state.scan} free ${C.state.free}`);
    reset(); consentInfo = NOT_REQ; await A.start();
    loadFail = { code: 3, message: 'No fill.' }; A._ready = { scan: false, deck: false, max: false };
    C.state.pending = cards.slice(); C.state.free = 0; C.state.scan = 0;
    await A.show('scan');
    ok('Google has no ad to show (no fill): the waiting cards save free', C.state.pending.length === 0 && C.state.free === 1, `pending ${C.state.pending.length} free ${C.state.free}`);
    C.state.deck = 0; A._ready = { scan: false, deck: false, max: false };
    await A.show('deck');
    ok('...and a refused new deck gets its one save free', C.state.deck === 1 && C.state.free === 2, `deck ${C.state.deck} free ${C.state.free}`);
    V.MAXLOCK.until = 0; A._ready = { scan: false, deck: false, max: false };
    await A.show('max');
    ok('...but MAX, which is not a save, stays shut and says try again', V.MAXLOCK.until === 0 && C.state.free === 2);
    loadFail = { code: 2, message: 'Network error.' }; C.state.pending = cards.slice(); A._ready = { scan: false, deck: false, max: false };
    await A.show('scan');
    ok('negative control: a network error keeps the cards in the tray (PROTOCOL §8), nothing free', C.state.pending.length === cards.length && C.state.free === 2, `pending ${C.state.pending.length} free ${C.state.free}`);
    ctx.navigator.onLine = false; loadFail = { code: 3, message: 'No fill.' }; A._ready = { scan: false, deck: false, max: false };
    await A.show('scan');
    ok('...and so does being offline, whatever the load says', C.state.pending.length === cards.length && C.state.free === 2);
    ctx.navigator.onLine = true; loadFail = null; C.state.pending = []; A._ready = { scan: false, deck: false, max: false }; calls.length = 0;
    await A.show('scan');
    ok('an ad that loads still shows, by its own live unit', calls.includes('show:' + L0.scan), calls.join(' '));
    reset(); consentInfo = { ...REQ, status: 'OBTAINED', canRequestAds: true }; await A.start(); calls.length = 0;
    await A.privacy();
    ok('Privacy choices opens Google\'s form, then asks again', calls[0] === 'privacy' && calls[1] === 'consent', calls.join(' '));
    V.go('settings'); const more = ctx.document.getElementById('setBody').innerHTML;
    A._consent = { status: 'NOT_REQUIRED', privacy: 'NOT_REQUIRED', can: true }; V.go('settings'); const moreNot = ctx.document.getElementById('setBody').innerHTML; V.go('home');
    ok('More draws the Privacy choices row where it is required, and not elsewhere', /data-act="adprivacy">Privacy choices for ads</.test(more) && !/data-act="adprivacy"/.test(moreNot));
    reset(); consentInfo = new Error('offline'); await A.start();
    ok('offline at launch nothing is decided: no SDK, no load, the answer left open', A._canRequestAds === undefined && !calls.includes('init') && !!A._consent && !!A._consent.error, JSON.stringify(A._consent));
    ok('Diagnostics says the consent answer and the free saves', /line\('consent', /.test(js) && /free saves \d+/.test(A.consentNote()));
  } finally {
    P.plugin = plug0; C.enabled = enabled0; ctx.navigator.onLine = online0;
    delete C.state.free; Object.assign(C.state, keep.st); C.save(); V.OWN.items = keep.items; V.MAXLOCK.until = keep.until;
    A._consent = null; A._canRequestAds = undefined; A._started = false; A._starting = null; A._ready = { scan: false, deck: false, max: false };
  }
}
ok('the boot starts ads through consent, never straight into the SDK', /ADS\.startWhenFree\(\)/.test(js) && !/ADS\.init\(\)\.then/.test(js) && !/PLATFORM\.adsStartWhenFree/.test(js));
}
}
