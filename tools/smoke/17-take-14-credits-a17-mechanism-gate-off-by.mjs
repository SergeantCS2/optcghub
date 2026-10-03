/* smoke sections 17, 18: take 14 — credits (A17 mechanism, gate OFF by default) | take 14 — deck builder polish
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { before } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 14 — credits (A17 mechanism, gate OFF by default)');
ok('the gate ships OFF', V.ADS_ENABLED === false && V.CREDITS.enabled() === false);
ok('with the gate off, any batch size commits in full', V.CREDITS.canCommit(500) === 500);
ok('with the gate off, a new deck save needs nothing', V.CREDITS.canSaveDeck(true) === true);
/* Exercise the mechanism as if the gate were on -- this is the PROTOCOL §8
   property: scanning is never gated, the wall is at commit, nothing is lost. */
const C = V.CREDITS; const saved = C.enabled; C.enabled = () => true;
C.state.scan = 3; C.state.pending = [];
ok('gate on: 3 credits admit 3 of a 5-card batch', C.canCommit(5) === 3);
C.spendScan(3); C.defer([{ id: 1 }, { id: 2 }]);
ok('the other 2 wait in the tray, not discarded', C.state.pending.length === 2 && C.state.scan === 0);
ok('a tray with no credits does not drain', (C.drain(), C.state.pending.length === 2));
const ebc = V.candidates('EB03-024', null);
C.state.pending = [{ id: ebc[0].id }, { id: ebc[1].id }];
const before = V.OWN.items.length;
C.earn('scan');
ok('earning credits drains the tray into the collection',
   C.state.pending.length === 0 && V.OWN.items.length >= before + 1 && C.state.scan === C.PER_AD - 2,
   `pending ${C.state.pending.length} scan ${C.state.scan}`);
C.state.deck = 0;
ok('gate on: a NEW deck save is refused at 0 deck credits', C.canSaveDeck(true) === false);
ok('gate on: re-saving an existing deck is never refused (PROTOCOL §9)', C.canSaveDeck(false) === true);
C.enabled = saved;
ok('the credit numbers are D10 constants, not literals in the gate',
   C.FREE_ON_INSTALL === 20 && C.PER_AD === 20 && C.FREE_DECKS === 1 && C.DECKS_PER_AD === 1);
/* Take 22: the SDK IS wired, against Google's test units. */
ok('the ad SDK is wired: initialize, prepare, show, and the reward LISTENER',
   /plugin\('AdMob'\)/.test(js) && /prepareRewardVideoAd/.test(js) && /showRewardVideoAd/.test(js) &&
   /onRewardedVideoAdReward/.test(js));
ok('the credit is earned from the Rewarded EVENT, never from show() resolving',
   /onRewardedVideoAdReward', r => \{[\s\S]*?CREDITS\.earn/.test(js) &&
   !/showRewardVideoAd\(\)[\s\S]{0,80}CREDITS\.earn/.test(js));
ok('ADS_ENABLED is derived, and is OFF in a browser', V.ADS_ENABLED === false);
ok('the top-level unit IDs are Google\'s published TEST units, for good: every install from take 120 and earlier reads them (take 121; real units ride ads.live)',
   manifest.ads && manifest.ads.test === true && /^ca-app-pub-3940256099942544\//.test(manifest.ads.scan) && /^ca-app-pub-3940256099942544\//.test(manifest.ads.deck));
ok('the app ID is the store-linked AdMob app (take 121), not "testing", the app added by name before the app was on Play (landmine 210), and does not flip the test flag',
   manifest.ads.app === 'ca-app-pub-6243777967151950~9519036366' && manifest.ads.test === true, manifest.ads.app);
ok('D10 constants come from the manifest', manifest.ads.free === 20 && manifest.ads.perAd === 20 && manifest.ads.decksFree === 1);

section('take 14 — deck builder polish');
ok('the Leader picker is a sheet, not a prompt', /leaderPick/.test(js) && !/prompt\('Leader/.test(js));
ok('deck import parses the export shape', /dkImport/.test(js) && /Not recognised/.test(js));
ok('printing swap exists', /printPick/.test(js));
}
}
