/* smoke section 81: take 121 — the units a build may load, and the rewarded ads under the plugin\'s real order
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 121 — the units a build may load, and the rewarded ads under the plugin\'s real order');
/* Real units ride the synced manifest to every install, and every install from
   take 120 and earlier names the "testing" AdMob app and has no consent flow.
   So they ride ads.live, which a build loads only at or after ads.live.from;
   the top-level units stay Google's test units for good. At the end of smoke:
   the MAX grant below sets Home's range. */
const P = V.PLATFORM, ads = V.CAT.man.ads, C = V.CREDITS, TEST = 'ca-app-pub-3940256099942544/';
const A = V.ADS || null;   /* take 134: the flow lives in ADS; PLATFORM keeps the plugin, which the stub below replaces there */
ok('take 134: ADS stands beside CREDITS and PLATFORM keeps no ad method', !!A && typeof A.show === 'function' && typeof A.start === 'function' && typeof V.PLATFORM.adShow === 'undefined' && typeof V.PLATFORM.adUnits === 'undefined' && typeof V.PLATFORM.consentAsk === 'undefined', typeof A);
if (A) {
const live = { scan: 'ca-app-pub-6243777967151950/1111111111', deck: 'ca-app-pub-6243777967151950/2222222222', max: 'ca-app-pub-6243777967151950/3333333333' };
const units = () => typeof A.units === 'function' ? A.units() : {};
const hadLive = ads.live;
ok('with no live block every placement -- scan, deck and MAX -- loads Google\'s test unit, testing', (u => u.test === true && [u.scan, u.deck, u.max].every(x => String(x).startsWith(TEST)))(units()), JSON.stringify(units()));
const consent0 = A._canRequestAds;
A._canRequestAds = true;   /* what the consent take sets from the consent SDK's canRequestAds */
ads.live = { ...live, from: V.TAKE }; const uAt = units();
ads.live = { ...live, from: V.TAKE + 1 }; const uBefore = units();
ads.live = { ...live, from: null }; const uNone = units();
A._canRequestAds = undefined; ads.live = { ...live, from: V.TAKE }; const uNoConsent = units();
ok('a live block reaches a build at its take once consent allows ads: its three units, not testing', uAt.test === false && uAt.scan === live.scan && uAt.deck === live.deck && uAt.max === live.max, JSON.stringify(uAt));
ok('negative control: a build one take older keeps Google\'s test units', uBefore.test === true && String(uBefore.scan).startsWith(TEST), JSON.stringify(uBefore));
ok('...and a live block that names no take opens nothing', uNone.test === true, JSON.stringify(uNone));
ok('...and a build at its take with no consent answer keeps the test units: whatever ads.live.from says, a build with no consent flow never loads a real unit', uNoConsent.test === true && String(uNoConsent.max).startsWith(TEST), JSON.stringify(uNoConsent));

/* @capacitor-community/admob 8.1.0, Android (RewardedAdCallbackAndListeners.kt):
   the reward listener notifies onRewardedVideoAdReward FIRST and resolves
   showRewardVideoAd() after; a dismissed ad, or one that fails to show,
   never settles it (FullscreenPluginCallback.kt only notifies). */
const L = {}, calls = [];
const stub = {
  requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' }),   /* take 127: asked before any ad */
  initialize: async o => { calls.push(['init', o && o.initializeForTesting]); },
  addListener: async (n, f) => { L[n] = f; return { remove() {} }; },
  prepareRewardVideoAd: async o => { calls.push(['prepare', o.adId, o.isTesting]); return { adUnitId: o.adId }; },
  showRewardVideoAd: async o => { calls.push(['show', o && o.adId]); const r = { type: 'coins', amount: 1 }; if (L.onRewardedVideoAdReward) L.onRewardedVideoAdReward(r); return r; }
};
const plug0 = P.plugin; P.plugin = n => n === 'AdMob' ? stub : plug0.call(P, n);
const keep = { scan: C.state.scan, deck: C.state.deck, earned: C.state.earned, until: V.MAXLOCK.until, max: ctx.localStorage.getItem('vault.maxUntil') };
const flush = () => new Promise(r => setTimeout(r, 0));
try {
  ads.live = hadLive; A._ready = { scan: false, deck: false, max: false }; A._pendingKind = null;
  await A.init();
  V.MAXLOCK.until = 0; C.state.deck = keep.deck;
  await Promise.race([A.show('max'), flush()]);
  ok('the MAX ad opens MAX under the plugin\'s real order (the reward event before show() resolves) -- it granted a deck save instead', V.MAXLOCK.until > Date.now() && C.state.deck === keep.deck, `maxUntil ${V.MAXLOCK.until}, deck ${C.state.deck} (was ${keep.deck})`);
  ok('...and leaves no pending kind behind', A._pendingKind == null, String(A._pendingKind));
  C.state.scan = 0;
  await Promise.race([A.show('scan'), flush()]);
  ok('the scan ad still grants the scan credits, once', C.state.scan === C.PER_AD, `scan ${C.state.scan}`);
  C.state.deck = 0;
  await Promise.race([A.show('deck'), flush()]);
  ok('the deck ad still grants one deck save', C.state.deck === C.DECKS_PER_AD, `deck ${C.state.deck}`);
  ads.live = { ...live, from: V.TAKE }; A._canRequestAds = true; A._ready = { scan: false, deck: false, max: false }; calls.length = 0; V.MAXLOCK.until = 0;
  await Promise.race([A.show('max'), flush()]);
  ok('on a live build MAX loads its own unit, not testing', calls.some(c => c[0] === 'prepare' && c[1] === live.max && c[2] === false), JSON.stringify(calls));
  ok('...and shows the ad it prepared by its unit: with no adId, 8.1.0 shows the LAST prepared ad, which three units make a different one', calls.some(c => c[0] === 'show' && c[1] === live.max), JSON.stringify(calls));
  stub.showRewardVideoAd = () => { calls.push(['show']); if (L.onRewardedVideoAdFailedToShow) L.onRewardedVideoAdFailedToShow({ code: 0, message: 'stub' }); return new Promise(() => {}); };
  A._ready = { scan: true, deck: true, max: true };
  A.show('deck'); await flush(); await flush();
  ok('an ad that fails to show clears its pending kind (8.1.0 never settles show() then), and the next reward cannot land on it', A._pendingKind == null && typeof L.onRewardedVideoAdFailedToShow === 'function', String(A._pendingKind));
  stub.showRewardVideoAd = async () => { const r = { type: 'coins', amount: 1 }; if (L.onRewardedVideoAdReward) L.onRewardedVideoAdReward(r); return r; };
  const check = async () => Object.fromEntries((await V.SELFTEST.run()).checks.map(c => [c.name, c]))['Ads: the units match this build'];
  const onLive = await check();
  ok('the self-test\'s ads check passes a live build at its take (before take 121 it failed every real unit)', onLive && onLive.s === 'PASS' && /live/.test(onLive.note), JSON.stringify(onLive));
  ads.live = hadLive; A._canRequestAds = undefined; const onTest = await check();   /* take 127: the real ads.live waits for consent */
  ok('...and passes Google\'s test units', onTest && onTest.s === 'PASS' && /test units/.test(onTest.note), JSON.stringify(onTest));
  const s0 = ads.scan; ads.scan = live.scan; const onBad = await check(); ads.scan = s0;
  ok('negative control: a real unit where every older install reads it FAILS the check', onBad && onBad.s === 'FAIL', JSON.stringify(onBad));
  ok('Diagnostics says which units the build loads', /line\('ads', /.test(js));
} finally {
  P.plugin = plug0; ads.live = hadLive; A._ready = { scan: false, deck: false, max: false }; A._pendingKind = null; A._canRequestAds = consent0;
  A._started = false; A._consent = null; A._starting = null;   /* take 127 */
  C.state.scan = keep.scan; C.state.deck = keep.deck; C.state.earned = keep.earned; V.MAXLOCK.until = keep.until;
  if (keep.max == null) ctx.localStorage.removeItem('vault.maxUntil'); else ctx.localStorage.setItem('vault.maxUntil', keep.max);
}
}
}
}
