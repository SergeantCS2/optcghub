/* =====================================================================
 * ADS — take 134 (A44 item 4): the rewarded ads and the consent flow, beside
 * CREDITS, which they pay into. Out of PLATFORM, which keeps plugin() and the
 * thin native calls; the plugin is still reached through
 * PLATFORM.plugin('AdMob'), so a harness that stubs it there serves this too.
 * Each method's body is as it was in PLATFORM (takes 22 to 128); the names
 * drop the ad prefix the object now gives.
 * ===================================================================== */
const ADS = {
  /* A17 — rewarded ads via @capacitor-community/admob 8.1.0. API read from
     the plugin’s definitions at take 22 (landmine 73):
       initialize({ initializeForTesting })        once
       prepareRewardVideoAd({ adId, isTesting })   load
       showRewardVideoAd()                         show
       addListener('onRewardedVideoAdReward', r)   the credit lands HERE, from
                                                   the event, never from the
                                                   show() promise.
     Take 121, read from 8.1.0's Android source: the reward event is sent
     BEFORE show() resolves, and a dismissed ad, or one that fails to show,
     never settles show() at all. So what was asked for is set before show(),
     nothing waits on show(), and a failure to show arrives as its own event.
     Loading is done ahead of time on the scan screen so a tap shows an ad
     rather than a spinner; a failed load says so and the button stays. */
  _ready: { scan: false, deck: false, max: false },
  /* Take 121: which units this build loads. Real units ride ads.live and reach
     a build only at or after ads.live.from: every install from take 120 and
     earlier reads ads.scan and ads.deck, names the "testing" AdMob app in its
     APK and has no consent flow, so those two stay Google's test units. And
     only once _canRequestAds is true, which only consentAsk sets (take 127),
     from the consent SDK's canRequestAds -- so a build with no consent flow
     (121 to 126) never loads a real unit, whatever ads.live.from says. */
  _canRequestAds: undefined,
  _ids: {},
  units() {
    const a = CAT.man.ads || {}, L = a.live;
    if (L && typeof L.from === 'number' && TAKE >= L.from && L.scan && L.deck && L.max && this._canRequestAds === true) return { scan: L.scan, deck: L.deck, max: L.max, test: false, from: L.from };
    return { scan: a.scan, deck: a.deck, max: a.deck, test: !!a.test };
  },
  unitsNote() {
    const L = (CAT.man.ads || {}).live, u = this.units();
    if (!u.test) return `live units, from take ${u.from}`;
    if (!L || typeof L.from !== 'number') return 'Google test units';
    return `Google test units (live units wait for ${TAKE < L.from ? `take ${L.from}` : 'consent'})`;
  },
  _failed(e) { if (e) console.warn('ad not shown', e); this._pendingKind = null; this._ready = { scan: false, deck: false, max: false }; toast('The ad could not be shown'); },
  /* Take 127: consent first -- the app is on Play worldwide (the owner). UMP through the plugin (8.1.0's
     dist/esm/consent; its Android AdConsentExecutor): the info, then the form only when it is required (the
     plugin's showConsentForm is UMP's loadAndShowConsentFormIfRequired), then canRequestAds decides. Offline
     or on an error nothing is decided: _canRequestAds keeps what it was, and no ad is requested. */
  _consent: null,
  _started: false,
  _starting: null,
  async consentAsk() {
    const A = PLATFORM.plugin('AdMob'); if (!A || typeof A.requestConsentInfo !== 'function') return null;
    try {
      let info = await A.requestConsentInfo();
      if (info && info.status === 'REQUIRED' && info.isConsentFormAvailable) info = { ...info, ...(await A.showConsentForm()) };
      this._consent = { status: info.status, privacy: info.privacyOptionsRequirementStatus, can: !!info.canRequestAds };
      this._canRequestAds = !!info.canRequestAds;
    } catch (e) { this._consent = { ...(this._consent || {}), error: String((e && e.message) || e).slice(0, 80) }; }
    if (typeof paintSettings === 'function' && $('#settings') && $('#settings').classList.contains('on')) paintSettings();
    return this._consent;
  },
  /* consent, then the SDK and the first load -- once; a second caller waits on the first */
  start() {
    if (!this._starting) this._starting = (async () => {
      await this.consentAsk();
      if (this._canRequestAds !== true) return false;
      if (!this._started) { this._started = await this.init(); if (this._started) this.load('scan'); }
      return this._started;
    })().finally(() => { this._starting = null; });
    return this._starting;
  },
  /* never over the first-open guide: Google's message waits until the guide is closed */
  startWhenFree() {
    const busy = () => { const g = document.getElementById('tour'); return !!(g && !g.hidden && g.classList.contains('on')); };
    const tick = () => { if (busy()) { setTimeout(tick, 1000); return; } this.start(); };
    setTimeout(tick, 800);
  },
  /* the owner's rule (take 127): when no ad can be loaded -- none to show, or consent that allows none -- the save
     goes through free; offline or on a network error the cards wait in the tray as before (PROTOCOL §8), and MAX,
     which is not a save, says try again */
  none(kind, noAd) {
    if (noAd && (kind === 'scan' || kind === 'deck') && CREDITS.freeSave(kind)) return false;
    toast('No ad available right now \u2014 try again in a moment'); return false;
  },
  privacyShown() { return !!(this._consent && this._consent.privacy === 'REQUIRED'); },
  async privacy() {
    const A = PLATFORM.plugin('AdMob'); if (!A || typeof A.showPrivacyOptionsForm !== 'function') return;
    try { await A.showPrivacyOptionsForm(); } catch (e) { toast('Privacy choices could not be opened \u2014 try again when online'); return; }
    await this.start();
  },
  consentNote() {
    const c = this._consent, f = (CREDITS.state && CREDITS.state.free) || 0;
    const head = !c ? 'not asked yet' : c.status ? `${c.status}, ads ${c.can ? 'allowed' : 'not allowed'}, privacy choices ${c.privacy === 'REQUIRED' ? 'shown' : 'not needed'}` : 'no answer yet';
    return `${head}${c && c.error ? ` (last error: ${c.error})` : ''} \u00b7 free saves ${f}`;
  },
  async init() {
    const A = PLATFORM.plugin('AdMob'); if (!A || !CAT.man.ads) return false;
    try {
      await A.initialize({ initializeForTesting: this.units().test });
      await A.addListener('onRewardedVideoAdReward', r => {
        /* r = { type, amount } per AdMobRewardItem. Which credit was earned is
           known from what we asked to show, not from the reward type. */
        if (this._pendingKind === 'max') { this._pendingKind = null; MAXLOCK.grant(); toast('All-time history is open for a day \u2014 thank you'); range = 'MAX'; if ($('#home').classList.contains('on')) paintHome(); return; }
        CREDITS.earn(this._pendingKind || 'scan'); this._pendingKind = null;
        toast(`+${this._lastKind === 'deck' ? CREDITS.DECKS_PER_AD + ' deck save' : CREDITS.PER_AD + ' save credits'} \u2014 thank you`);
        if (typeof paintScan === 'function' && $('#scan').classList.contains('on')) paintScan();
      });
      await A.addListener('onRewardedVideoAdDismissed', () => { this._ready = { scan: false, deck: false, max: false }; this.load('scan'); });
      await A.addListener('onRewardedVideoAdFailedToShow', e => this._failed(e));
      await A.addListener('onRewardedVideoAdFailedToLoad', e => { this._loadErr = e && typeof e.code === 'number' ? e.code : null; console.warn('ad load failed', e); });   /* take 127: sent before the reject; 2 is a network error */
      return true;
    } catch (e) { console.warn('ads init failed', e); return false; }
  },
  async load(kind = 'scan') {
    const A = PLATFORM.plugin('AdMob'); if (!A || !CAT.man.ads) return false;
    const u = this.units(); this._loadErr = null;
    try {
      await A.prepareRewardVideoAd({ adId: u[kind], isTesting: u.test });
      this._ids[kind] = u[kind]; this._ready[kind] = true; return true;
    } catch (e) { this._ready[kind] = false; if (this._loadErr == null && /no fill/i.test(String((e && e.message) || e))) this._loadErr = 3; return false; }
  },
  /* kind: 'scan', 'deck' or 'max', each its own unit (take 121). True once the
     ad is asked to show; the credit is the reward event's. */
  async show(kind = 'scan') {
    const A = PLATFORM.plugin('AdMob'); if (!A) return false;
    if (this._canRequestAds !== true || !this._started) await this.start();   /* take 127: the consent answer first; offline at launch, asked again here */
    if (this._canRequestAds !== true || !this._started) return this.none(kind, this._canRequestAds === false || (!!this._consent && !!this._consent.error && navigator.onLine !== false));
    if (!this._ready[kind] && !(await this.load(kind))) return this.none(kind, navigator.onLine !== false && this._loadErr !== 2);
    this._pendingKind = kind; this._lastKind = kind; this._ready[kind] = false;
    /* by the unit it prepared (the adId option, since 8.0.1): without it 8.1.0 shows the LAST prepared ad */
    try { A.showRewardVideoAd({ adId: this._ids[kind] }).catch(e => this._failed(e)); return true; }
    catch (e) { this._failed(e); return false; }
  },
};
