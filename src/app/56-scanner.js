/* ---- scanner ----------------------------------------------------------- */
/* The batch persists. The owner’s first field test: two cards scanned, picker
   answered twice, collection empty afterwards -- the batch lived in memory
   and commit only happened on "Review". Closing the app lost it and nothing
   said so. Landmine 83. Now: every accept writes the batch to storage, the
   Scan tab shows a count while one is waiting, and a pending batch is offered
   for commit the next time the screen opens. */
const BATCH = Object.assign({ rows: [], setId: null },
  readJson('vault.batch', {}));
BATCH.save = function () {
  saveJson('vault.batch', { rows: this.rows, setId: this.setId });
  paintBatchBadge();
};
function paintBatchBadge() {
  const b = $('nav button[data-go="scan"]'); if (!b) return;
  let badge = b.querySelector('.fcount');
  if (!badge) { badge = document.createElement('span'); badge.className = 'fcount'; b.appendChild(badge); }
  badge.style.display = BATCH.rows.length ? 'inline-block' : 'none';
  badge.textContent = BATCH.rows.length;
}
function paintScan() {
  startCamera();
  paintBatchBadge();
  /* take 125: once, at the first paint -- a batch left from before is waiting; the first card scanned is not
     (its paint after the accept told the collector their one new card was "waiting" -- the look, take 125) */
  if (!SCAN._resumedOnce) {
    SCAN._resumedOnce = true;
    if (BATCH.rows.length) toast(`${BATCH.rows.length} scanned card${BATCH.rows.length === 1 ? '' : 's'} waiting \u2014 tap Review to add them`);
  }
  const c = $('#scanCredits');
  if (CREDITS.enabled()) {
    const st = CREDITS.state;
    c.innerHTML = `Scanning is unlimited. <b>${st.scan}</b> save credit${st.scan === 1 ? '' : 's'}` +
      (st.pending.length ? ` · <b>${st.pending.length}</b> waiting` : '') +
      ` · <button class="ghost" id="earnBtn" style="padding:4px 10px;font-size:var(--fs-cap)">+${CREDITS.PER_AD} for a short ad</button>`;
  } else c.innerHTML = 'Scanning is free and unlimited. Saving to the collection is too, for now.';
  $('#scCount').textContent = BATCH.rows.length;
  $('#scTotal').textContent = money(BATCH.rows.reduce((s, r) => s + (price(r.id) || 0), 0));
  const s = BATCH.setId ? CAT.sets.get(BATCH.setId) : null;
  $('#setChip').innerHTML = 'Set: <b>' + esc(s ? (s.abbr || s.name) : 'Any') + '</b> ' + chev(true);
}
/* The set chip is worth 7x. MEASURED take 2: code alone resolves 8.9% of
   printings, code plus the set resolves 60.2%. One tap, before the batch. */
/* The set chip is a sheet now, not a prompt -- it was the first thing under
   the status bar in the owner’s screenshot and the second prompt() a tester would
   have hit. Recent sets first. */
$('#setChip').addEventListener('click', () => {
  const list = [...CAT.sets.values()].filter(s => s.n > 0);   /* take 115: the scanner reads a card's number; a set of sealed products only is none to scan */
  $('#pkTitle').textContent = 'Which set are you scanning?';
  $('#pkWhy').innerHTML = 'The number alone settles about 1 card in 10; with the set chosen, about 6 in 10. Choose it once, before the binder.';
  $('#pkOpts').innerHTML = `<button class="opt${!BATCH.setId ? ' best' : ''}" data-setpick="0">
      <div class="oi"><b>Any set</b><span>ask when a number is ambiguous</span></div></button>` +
    list.map(s => `<button class="opt${BATCH.setId === s.id ? ' best' : ''}" data-setpick="${s.id}">
      <div class="oi"><b>${esc(s.abbr || '')}</b><span>${esc(s.name)} \u00b7 ${s.n} cards</span></div>
      <div class="op" style="font-size:var(--fs-cap);color:var(--dim2)">${esc((s.pub || '').slice(0, 4))}</div></button>`).join('');
  $('#picker').classList.add('on');
});
CLICKS.on('[data-setpick]', e => {
  const b = e.target.closest('[data-setpick]'); if (!b) return;
  BATCH.setId = +b.dataset.setpick || null; BATCH.save();
  $('#picker').classList.remove('on'); paintScan();
  const s = BATCH.setId ? CAT.sets.get(BATCH.setId) : null;
  toast(s ? `Scanning ${s.abbr} \u2014 candidates narrow ~7\u00d7` : 'Any set');
});

$('#btnUndo').addEventListener('click', () => {
  if (!BATCH.rows.length) return toast('Nothing to undo');
  const r = BATCH.rows.pop(); BATCH.save(); paintScan();
  toast('Removed ' + (CAT.byId.get(r.id)?.name || 'card'));
});
$('#btnDone').addEventListener('click', () => {
  if (!BATCH.rows.length) return toast('Scan something first');
  /* Landmine 19: the batch commits at the end, after a review, never mid-scan.
     A17: commit is where a credit is spent. What cannot be paid for waits in
     the tray -- never discarded, never blocked from being scanned. */
  const n = BATCH.rows.length;
  const ok = CREDITS.canCommit(n);
  /* take 115 (self-review): the batch is cleared only of what the collection or the tray stored; with a full
     storage the review stays as it was and STORE.warn says to export */
  if (!OWN.moveIn(BATCH.rows.slice(0, ok))) return;
  CREDITS.spendScan(ok);
  const wait = BATCH.rows.slice(ok);
  BATCH.rows = wait.length && !CREDITS.defer(wait) ? wait : [];
  BATCH.save(); OWN.snapshot(); paintScan(); scheduleBackup('batch');
  toast(ok === n ? `Committed ${n} card${n > 1 ? 's' : ''}`
                 : `${ok} added · ${n - ok} waiting for credits`);
  go('collection');
});

/* =====================================================================
 * THE SCANNER — take 10; its stages are src/scan.js since take 125
 *
 * PLATFORM is the seam: in the APK it is Capacitor (Filesystem + ML Kit +
 * Haptics + Camera); in a browser it is getUserMedia and NO recogniser --
 * the browser build says so and falls back to the manual path rather than
 * pretending. In smoke.mjs it is whatever the test injects. The stages it
 * feeds, and the live loop that drives them, follow it.
 * ===================================================================== */
const PLATFORM = {
  cap() { return window.Capacitor && window.Capacitor.Plugins; },
  plugin(name) {
    const C = window.Capacitor;
    if (!C) return null;
    if (C.Plugins && C.Plugins[name]) return C.Plugins[name];
    try { return C.registerPlugin ? C.registerPlugin(name) : null; } catch (e) { return null; }
  },
  /* take 120: the status bar's icons for the theme -- LIGHT (dark icons for a light bar) or DARK (light icons). The plugin is
     @capacitor/status-bar, in package.json; on the web there is none and nothing happens. */
  statusBar(theme) { const SB = this.plugin('StatusBar'); if (!SB || typeof SB.setStyle !== 'function') return false; try { const p = SB.setStyle({ style: theme === 'light' ? 'LIGHT' : 'DARK' }); if (p && p.catch) p.catch(() => {}); } catch (e) {} return true; },
  hasOcr() { return !!this.plugin('TextRecognition'); },
  /* Canvas -> file -> ML Kit. The plugin takes a PATH (read from its
     definitions.d.ts at take 10, not from memory), so the picture goes through
     Filesystem first. script:LATIN keeps the other four recognisers idle.
     Take 125: what it read is { text, lines: [{ text, box }] } -- every line
     with its place in the picture (blocks -> lines -> boundingBox, read off the
     8.2.1 definitions), for the scanner to find the number among; null with no
     recogniser. The temporary file is deleted without waiting on it. */
  async ocr(canvas) {
    const TR = this.plugin('TextRecognition'), FS = this.plugin('Filesystem');
    if (!TR || !FS) return null;
    const b64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    const f = await FS.writeFile({ path: `scan/${Date.now()}.jpg`, data: b64,
                                   directory: 'CACHE', recursive: true });
    try {
      const r = (await TR.processImage({ path: f.uri, script: 'LATIN' })) || {};
      const box = b => b ? { x: b.left, y: b.top, w: b.right - b.left, h: b.bottom - b.top } : null;
      return { text: r.text || '', lines: (r.blocks || []).flatMap(b => b.lines || []).map(l => ({ text: l.text || '', box: box(l.boundingBox) })) };
    } finally {
      FS.deleteFile({ path: f.uri }).catch(() => {});
    }
  },
  async haptic() {
    const H = this.plugin('Haptics');
    if (H) { try { await H.impact({ style: 'MEDIUM' }); return; } catch (e) {} }
    if (navigator.vibrate) navigator.vibrate(18);
  },
  /* Scan photos go to DISK, not localStorage. A WebView’s localStorage is
     5-10 MB; a 500x700 JPEG at q0.7 is ~50 KB; the collection would have broken
     around card 100 with a QuotaExceededError nobody would have connected to
     the camera (landmine 79). Directory.Data is app-private and cleared on
     uninstall, which is correct for a derived image -- the backup is the data.
     Returns a URL the WebView can load; in a browser, the data URL itself. */
  async savePhoto(dataUrl, key) {
    const FS = this.plugin('Filesystem');
    if (!FS) return dataUrl;
    try {
      const path = `photos/${key}-${Date.now()}.jpg`;
      const r = await FS.writeFile({ path, data: dataUrl.split(',')[1], directory: 'DATA', recursive: true });
      const C = window.Capacitor;
      return C && C.convertFileSrc ? C.convertFileSrc(r.uri) : r.uri;
    } catch (e) { console.warn('photo save failed', e); return null; }
  },
  /* Backup to the public Documents folder, which SURVIVES UNINSTALL on Android
     11+ for files the app created (read from the plugin’s definitions.d.ts at
     take 15). PROTOCOL §9: this runs on every batch commit and every deck save,
     and failure is shown, never swallowed. Take 125: it returns where the backup
     went, or throws with the reason (thrown away until take 125). */
  async backup(json) {
    const FS = this.plugin('Filesystem');
    if (!FS) { localStorage.setItem('vault.backup', json); return 'browser storage'; }
    const latest = await this.writeOwnDoc('backup-latest.json', json);
    /* the dated copy is the history: kept when it can be (on the day of a reinstall the name can be the old install's) */
    const day = new Date().toISOString().slice(0, 10);
    try { await FS.writeFile({ path: `OPTCGHub/backup-${day}.json`, data: json, directory: 'DOCUMENTS', recursive: true, encoding: 'utf8' }); }
    catch (e) { ERRS.push('backup', `backup-${day}.json could not be written: ${e.message || e}`, 'backup'); }
    return latest === 'backup-latest.json' ? 'Documents/OPTCGHub' : `Documents/OPTCGHub/${latest}`;
  },
  /* take 125 (landmine 239): a file in Documents is the install's that made it. The sideload install's
     backup-latest.json outlived its uninstall, and the Play install could not write over it -- every backup
     failed from the switch on, its reason thrown away (the owner's More, 29 Sept; A43's item 5, INFERRED at
     take 115). A file this app keeps there is written under the name this install last wrote it to; when that
     name cannot be written, a new one is made once -- backup-latest-20260929-170512.json -- and kept for the
     next (vault.docNames: an Android backup that brings it to a later install is healed the same way).
     Returns the name written; throws with both reasons when neither can be. */
  async writeOwnDoc(base, json) {
    const FS = this.plugin('Filesystem'), names = readJson('vault.docNames', {}, false);
    const write = name => FS.writeFile({ path: `OPTCGHub/${name}`, data: json, directory: 'DOCUMENTS', recursive: true, encoding: 'utf8' });
    const first = names[base] || base;
    try { await write(first); return first; }
    catch (e) {
      const t = new Date(), p = n => String(n).padStart(2, '0');
      const name = base.replace(/\.json$/, `-${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}-${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}.json`);
      try { await write(name); } catch (e2) { throw new Error(`${first}: ${e.message || e}; ${name}: ${e2.message || e2}`); }
      saveJson('vault.docNames', { ...names, [base]: name });
      ERRS.push('backup', `${first} could not be written (${e.message || e}); this install writes ${name} now`, 'writeOwnDoc');
      return name;
    }
  },
  /* take 115: what a restore replaced, beside the backups -- Restore offers the copy kept in storage; this one
     outlives an uninstall, and the file picker reaches it */
  async keepAside(json) {
    const FS = this.plugin('Filesystem'); if (!FS) return null;
    try { await this.writeOwnDoc('backup-before-restore.json', json); return 'Documents/OPTCGHub'; }
    catch (e) { ERRS.push('backup', `the copy before a restore was not written: ${e.message || e}`, 'keepAside'); return null; }
  },
  /* the latest backup this install wrote -- never a file another install left under the old name (take 125) */
  async readBackup() {
    const FS = this.plugin('Filesystem');
    if (!FS) return localStorage.getItem('vault.backup');
    const name = readJson('vault.docNames', {}, false)['backup-latest.json'] || 'backup-latest.json';
    try { return (await FS.readFile({ path: `OPTCGHub/${name}`, directory: 'DOCUMENTS', encoding: 'utf8' })).data; }
    catch (e) { return null; }
  },
  /* Take 34, landmine 110. A download link does NOTHING in Capacitor’s WebView:
     no DownloadListener is installed and a blob: URL has nowhere to go, so
     "Export CSV" toasted success and produced no file on the phone -- the
     A-1 family, on the one feature PROTOCOL §9 says must exist first. On a
     device the file is written to the app’s cache and handed to the share
     sheet (Drive, Files, Gmail -- the collector’s choice). API read from
     @capacitor/share 8.0 definitions: share({ title, files: [file uri],
     dialogTitle }); the uri is Filesystem.writeFile’s. Returns 'shared',
     'cancelled', or false when there is no plugin (a browser: caller downloads). */
  async shareFile(name, text, dialogTitle) {
    const FS = this.plugin('Filesystem'), SH = this.plugin('Share');
    if (!FS || !SH) return false;
    try {
      const r = await FS.writeFile({ path: `export/${name}`, data: text, directory: 'CACHE', recursive: true, encoding: 'utf8' });
      await SH.share({ title: name, files: [r.uri], dialogTitle });
      return 'shared';
    } catch (e) {
      if (/cancel/i.test(String(e && e.message))) return 'cancelled';
      toast('Export failed \u2014 ' + (e && e.message || 'unknown')); return 'cancelled';
    }
  },
  /* A30, take 65. Two things the tester report asked for and the app lacked.
     Both are one call and neither needs a plugin the app does not already
     carry. The Play listing URL is the app’s own id -- no tracking parameter,
     no referral code (A30 ruled that out). */
  storeUrl() { return 'https://play.google.com/store/apps/details?id=' + (CAT.man.appId || 'com.optcghub.app'); },
  async rateApp() {
    const url = this.storeUrl();
    /* market:// opens the Play app directly where it exists; the https URL is
       the fallback and the only thing a browser can do. */
    try { if (this.plugin('App') || this.isNative) { window.open('market://details?id=' + (CAT.man.appId || 'com.optcghub.app'), '_system'); return true; } } catch (e) {}
    window.open(url, '_blank');
    return true;
  },
  /* take 128 (the owner's question): Google Play's own answer on a newer version -- the in-app updates API through
     @capawesome/capacitor-app-update, read from its definitions.d.ts (landmine 73): getAppUpdateInfo() -> { updateAvailability
     (0 unknown, 1 none, 2 available, 3 in progress), availableVersionCode, currentVersionCode }; openAppStore(). The plugin is
     the Play build's: a browser has none, and a sideload gets no answer from Play. The policy -- when to ask, what to say --
     is UPDATE's, not this adapter's. */
  appUpdateInfo() { const U = this.plugin('AppUpdate'); return U && typeof U.getAppUpdateInfo === 'function' ? U.getAppUpdateInfo() : Promise.resolve(null); },
  async openStore() { const U = this.plugin('AppUpdate'); if (U && typeof U.openAppStore === 'function') { try { await U.openAppStore(); return true; } catch (e) {} } return this.rateApp(); },
  async shareApp() {
    const SH = this.plugin('Share');
    const text = 'OP TCG Hub \u2014 scan, value and track your One Piece Card Game collection. Offline, no scan cap.';
    if (SH) { try { await SH.share({ title: 'OP TCG Hub', text, url: this.storeUrl(), dialogTitle: 'Share OP TCG Hub' }); return 'shared'; } catch (e) { return 'cancelled'; } }
    try { await navigator.clipboard.writeText(text + ' ' + this.storeUrl()); return 'copied'; } catch (e) { return false; }
  },
  /* Documents/OPTCGHub is only readable by the install that wrote it: on
     Android 11+ a REINSTALLED app is a stranger to its own old files (scoped
     storage), which is exactly the landmine-34 case -- sideload out, Play
     build in. So when the automatic read finds nothing, the collector picks
     the file: the system picker sees every file the phone does. */
  pickTextFile(accept) {
    return new Promise(res => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
      inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if (!f) return res(null); const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = () => res(null); rd.readAsText(f); });
      inp.click();
    });
  },
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
  _adReady: { scan: false, deck: false, max: false },
  /* Take 121: which units this build loads. Real units ride ads.live and reach
     a build only at or after ads.live.from: every install from take 120 and
     earlier reads ads.scan and ads.deck, names the "testing" AdMob app in its
     APK and has no consent flow, so those two stay Google's test units. And
     only once _canRequestAds is true, which only consentAsk sets (take 127),
     from the consent SDK's canRequestAds -- so a build with no consent flow
     (121 to 126) never loads a real unit, whatever ads.live.from says. */
  _canRequestAds: undefined,
  _adIds: {},
  adUnits() {
    const a = CAT.man.ads || {}, L = a.live;
    if (L && typeof L.from === 'number' && TAKE >= L.from && L.scan && L.deck && L.max && this._canRequestAds === true) return { scan: L.scan, deck: L.deck, max: L.max, test: false, from: L.from };
    return { scan: a.scan, deck: a.deck, max: a.deck, test: !!a.test };
  },
  adUnitsNote() {
    const L = (CAT.man.ads || {}).live, u = this.adUnits();
    if (!u.test) return `live units, from take ${u.from}`;
    if (!L || typeof L.from !== 'number') return 'Google test units';
    return `Google test units (live units wait for ${TAKE < L.from ? `take ${L.from}` : 'consent'})`;
  },
  _adFailed(e) { if (e) console.warn('ad not shown', e); this._pendingKind = null; this._adReady = { scan: false, deck: false, max: false }; toast('The ad could not be shown'); },
  /* Take 127: consent first -- the app is on Play worldwide (the owner). UMP through the plugin (8.1.0's
     dist/esm/consent; its Android AdConsentExecutor): the info, then the form only when it is required (the
     plugin's showConsentForm is UMP's loadAndShowConsentFormIfRequired), then canRequestAds decides. Offline
     or on an error nothing is decided: _canRequestAds keeps what it was, and no ad is requested. */
  _consent: null,
  _adsStarted: false,
  _starting: null,
  async consentAsk() {
    const A = this.plugin('AdMob'); if (!A || typeof A.requestConsentInfo !== 'function') return null;
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
  adsStart() {
    if (!this._starting) this._starting = (async () => {
      await this.consentAsk();
      if (this._canRequestAds !== true) return false;
      if (!this._adsStarted) { this._adsStarted = await this.adsInit(); if (this._adsStarted) this.adLoad('scan'); }
      return this._adsStarted;
    })().finally(() => { this._starting = null; });
    return this._starting;
  },
  /* never over the first-open guide: Google's message waits until the guide is closed */
  adsStartWhenFree() {
    const busy = () => { const g = document.getElementById('tour'); return !!(g && !g.hidden && g.classList.contains('on')); };
    const tick = () => { if (busy()) { setTimeout(tick, 1000); return; } this.adsStart(); };
    setTimeout(tick, 800);
  },
  /* the owner's rule (take 127): when no ad can be loaded -- none to show, or consent that allows none -- the save
     goes through free; offline or on a network error the cards wait in the tray as before (PROTOCOL §8), and MAX,
     which is not a save, says try again */
  adNone(kind, noAd) {
    if (noAd && (kind === 'scan' || kind === 'deck') && CREDITS.freeSave(kind)) return false;
    toast('No ad available right now \u2014 try again in a moment'); return false;
  },
  adPrivacyShown() { return !!(this._consent && this._consent.privacy === 'REQUIRED'); },
  async adPrivacy() {
    const A = this.plugin('AdMob'); if (!A || typeof A.showPrivacyOptionsForm !== 'function') return;
    try { await A.showPrivacyOptionsForm(); } catch (e) { toast('Privacy choices could not be opened \u2014 try again when online'); return; }
    await this.adsStart();
  },
  consentNote() {
    const c = this._consent, f = (CREDITS.state && CREDITS.state.free) || 0;
    const head = !c ? 'not asked yet' : c.status ? `${c.status}, ads ${c.can ? 'allowed' : 'not allowed'}, privacy choices ${c.privacy === 'REQUIRED' ? 'shown' : 'not needed'}` : 'no answer yet';
    return `${head}${c && c.error ? ` (last error: ${c.error})` : ''} \u00b7 free saves ${f}`;
  },
  async adsInit() {
    const A = this.plugin('AdMob'); if (!A || !CAT.man.ads) return false;
    try {
      await A.initialize({ initializeForTesting: this.adUnits().test });
      await A.addListener('onRewardedVideoAdReward', r => {
        /* r = { type, amount } per AdMobRewardItem. Which credit was earned is
           known from what we asked to show, not from the reward type. */
        if (this._pendingKind === 'max') { this._pendingKind = null; MAXLOCK.grant(); toast('All-time history is open for a day \u2014 thank you'); range = 'MAX'; if ($('#home').classList.contains('on')) paintHome(); return; }
        CREDITS.earn(this._pendingKind || 'scan'); this._pendingKind = null;
        toast(`+${this._lastKind === 'deck' ? CREDITS.DECKS_PER_AD + ' deck save' : CREDITS.PER_AD + ' save credits'} \u2014 thank you`);
        if (typeof paintScan === 'function' && $('#scan').classList.contains('on')) paintScan();
      });
      await A.addListener('onRewardedVideoAdDismissed', () => { this._adReady = { scan: false, deck: false, max: false }; this.adLoad('scan'); });
      await A.addListener('onRewardedVideoAdFailedToShow', e => this._adFailed(e));
      await A.addListener('onRewardedVideoAdFailedToLoad', e => { this._loadErr = e && typeof e.code === 'number' ? e.code : null; console.warn('ad load failed', e); });   /* take 127: sent before the reject; 2 is a network error */
      return true;
    } catch (e) { console.warn('ads init failed', e); return false; }
  },
  async adLoad(kind = 'scan') {
    const A = this.plugin('AdMob'); if (!A || !CAT.man.ads) return false;
    const u = this.adUnits(); this._loadErr = null;
    try {
      await A.prepareRewardVideoAd({ adId: u[kind], isTesting: u.test });
      this._adIds[kind] = u[kind]; this._adReady[kind] = true; return true;
    } catch (e) { this._adReady[kind] = false; if (this._loadErr == null && /no fill/i.test(String((e && e.message) || e))) this._loadErr = 3; return false; }
  },
  /* kind: 'scan', 'deck' or 'max', each its own unit (take 121). True once the
     ad is asked to show; the credit is the reward event's. */
  async adShow(kind = 'scan') {
    const A = this.plugin('AdMob'); if (!A) return false;
    if (this._canRequestAds !== true || !this._adsStarted) await this.adsStart();   /* take 127: the consent answer first; offline at launch, asked again here */
    if (this._canRequestAds !== true || !this._adsStarted) return this.adNone(kind, this._canRequestAds === false || (!!this._consent && !!this._consent.error && navigator.onLine !== false));
    if (!this._adReady[kind] && !(await this.adLoad(kind))) return this.adNone(kind, navigator.onLine !== false && this._loadErr !== 2);
    this._pendingKind = kind; this._lastKind = kind; this._adReady[kind] = false;
    /* by the unit it prepared (the adId option, since 8.0.1): without it 8.1.0 shows the LAST prepared ad */
    try { A.showRewardVideoAd({ adId: this._adIds[kind] }).catch(e => this._adFailed(e)); return true; }
    catch (e) { this._adFailed(e); return false; }
  },
  /* In-app catalogue refresh (take 27). GET manifest.json from the Pages
     site; if its source date is newer than what is loaded, GET catalog.json,
     write both to Directory.Data, and reload. PROVISION names the host. The
     fetch is the only load-bearing network call in the app and it is
     opt-in: nothing happens unless UPDATE_URL is configured. */
  /* A25, take 33. The quiet once-per-open sync is half a megabyte (MEASURED
     take 29): nothing on wifi, a photo a day on mobile data that nobody asked
     for. The Network Information API reports 'cellular' on Android’s WebView
     -- INFERRED from the spec until the Fold says so; where the API is absent
     the type is unknown and the sync proceeds as it did before. "Sync now"
     never consults this: the collector pressed it. */
  onCellular() { const c = navigator.connection; return !!(c && c.type === 'cellular'); },
  quietSyncAllowed() { return !this.onCellular() || localStorage.getItem('vault.syncCellular') === '1'; },
  async refreshCatalogue({ quiet = false } = {}) {
    const base = CAT.man.updateUrl; if (!base) { if (!quiet) toast('Sync is not configured \u2014 update the app for new prices'); return false; }
    if (!navigator.onLine) { if (!quiet) toast('No connection'); return false; }
    try {
      NET.count++;
      const mr = await fetch(base + 'manifest.json', { cache: 'no-store' }); if (!mr.ok) throw new Error('HTTP ' + mr.status);
      const m = await mr.json();
      if (!m.source_updated_at || m.source_updated_at <= (CAT.man.source_updated_at || '')) { if (!quiet) toast('Prices are already current'); return false; }
      NET.count++;
      const cr = await fetch(base + 'catalog.json', { cache: 'no-store', wait: NET.WAIT_BIG }); if (!cr.ok) throw new Error('HTTP ' + cr.status);
      const raw = await cr.text();
      /* take 115: read before it is written. A catalogue this build cannot read
         (another take's shape, an error page, a cut-off file) never reaches the
         disk, where it stopped every launch; the prices stay as they are and
         Diagnostics' last errors say why. */
      let why = ''; try { why = catalogueProblem(JSON.parse(raw), CAT.shape); } catch (e) { why = 'it does not parse'; }
      if (why) { ERRS.push('catalogue', `the catalogue for ${String(m.source_updated_at).slice(0, 10)} was not written: ${why}`, 'sync'); if (!quiet) toast('Sync failed \u2014 the new catalogue could not be read; your prices stay as they are'); return false; }
      const FS = this.plugin('Filesystem');
      if (FS) {
        await FS.writeFile({ path: 'catalogue/catalog.json', data: raw, directory: 'DATA', recursive: true, encoding: 'utf8' });
        await FS.writeFile({ path: 'catalogue/manifest.json', data: JSON.stringify(m), directory: 'DATA', recursive: true, encoding: 'utf8' });
      }
      await loadCatalogue();
      OWN.snapshot(); scheduleBackup('sync');
      if (FS && !CAT.man.fromDisk) { if (!quiet) toast('Sync failed \u2014 the new catalogue could not be read; your prices stay as they are'); return false; }   // take 115: set aside at load (CAT.refused), never "updated"
      const fired = await ALERTS.check();
      toast(`Prices updated to ${dayText(m.source_updated_at)}` + (fired.length ? ` \u00b7 ${fired.length} alert${fired.length === 1 ? '' : 's'}` : ''));
      paintHome(); return true;
    } catch (e) { if (!quiet) toast('Sync failed \u2014 ' + (e.message || 'network')); return false; }
  },
  /* Price alerts (8.5, take 27) -- @capacitor/local-notifications 8.3.1. API
     read from its definitions: schedule({ notifications: [{ id, title, body }] })
     fires at once when no schedule is set; requestPermissions() returns
     { display }. The plugin declares POST_NOTIFICATIONS itself (API 33+).
     smallIcon names a DRAWABLE (the plugin looks nowhere else, and fell back to
     the system's info icon while this said ic_launcher, a mipmap): ci/icon.py
     writes ic_stat_don and keeps it through shrinkResources (D7). */
  async notifyPermission() {
    const N = this.plugin('LocalNotifications'); if (!N) return 'browser';
    /* take 105 (landmine 141): on the shrunk build the plugin answered with NO data; read for a field, guarded, and an empty answer is 'unknown' -- never 'denied' */
    try { let s = (await N.checkPermissions()) || {}; if (s.display !== 'granted') s = (await N.requestPermissions()) || {}; return s.display || 'unknown'; }
    catch (e) { return 'denied'; }
  },
  async notify(id, title, body) {
    const N = this.plugin('LocalNotifications');
    if (!N) { toast(`${title} \u2014 ${body}`); return false; }
    try { await N.schedule({ notifications: [{ id, title, body, smallIcon: 'ic_stat_don', iconColor: '#F2C14E' }] }); return true; }
    catch (e) { console.warn('notify failed', e); toast(`${title} \u2014 ${body}`); return false; }
  },
  /* take 97: a notification for a future moment (the release reminder), and
     its cancel by id. The same plugin’s schedule: { at } -- INFERRED from
     its public API; the on-open check in RELALERTS is the path the harness
     proves, this one is the owner’s to see. No plugin: nothing scheduled. */
  async notifyAt(id, title, body, at) {
    const N = this.plugin('LocalNotifications'); if (!N) return false;
    try { await N.schedule({ notifications: [{ id, title, body, smallIcon: 'ic_stat_don', iconColor: '#F2C14E', schedule: { at, allowWhileIdle: true } }] }); return true; }
    catch (e) { console.warn('notifyAt failed', e); return false; }
  },
  async cancelNotify(id) {
    const N = this.plugin('LocalNotifications'); if (!N) return false;
    try { await N.cancel({ notifications: [{ id }] }); return true; } catch (e) { return false; }
  },
  /* Android Photo Picker via @capacitor/camera: no permission at all
     (landmine 38). */
  async pickImage() {
    const Cam = this.plugin('Camera');
    if (!Cam) return null;
    const r = await Cam.pickImages({ limit: 1 });
    return r && r.photos && r.photos[0] ? (r.photos[0].webPath || r.photos[0].path) : null;
  }
};

/* __SCAN__ -- the scanner's stages live in src/scan.js (take 125); build_app.py puts them here */

/* 8.7 helpers: a deck’s value on each day on file, and how much of it the
   collector already owns. */
function deckHistory(deck) {
  if (!CAT.days.length) return [];
  const rows = deck.cards.map(c => ({ n: c.n, h: CAT.hist[c.id] })).filter(r => r.h);
  if (deck.leader && CAT.hist[deck.leader]) rows.push({ n: 1, h: CAT.hist[deck.leader] });
  const out = [];
  CAT.days.forEach((d, di) => {
    let tot = 0, any = false;
    for (const r of rows) { const m = r.h[di]; if (m != null) { tot += m * r.n; any = true; } }
    if (any) out.push([d, tot, rows.length]);
  });
  return out;
}
function dkOwnedValue(A) {
  const owned = new Map(); OWN.items.forEach(i => owned.set(i.id, (owned.get(i.id) || 0) + i.qty));
  let have = 0, need = 0;
  for (const r of A.rows) { const h = Math.min(r.n, owned.get(r.p.id) || 0); have += h; need += r.n - h; }
  if (!A.rows.length) return 'no cards in it yet';   /* take 111: an empty deck is not one you own every card of */
  return need ? `you own ${have} of ${have + need} cards \u00b7 ${money(A.rows.reduce((a, r) => a + Math.max(0, r.n - (owned.get(r.p.id) || 0)) * (r.p.market || 0), 0))} to complete` : 'you own every card in it';
}
/* draw a series on any canvas -- the portfolio spark, generalised */
function sparkOn(cv, series, kind = 'record') {
  const w = cv.clientWidth || 300, h = cv.height; cv.width = w * 2; cv.height = h * 2;
  const x = cv.getContext('2d'); x.scale(2, 2); x.clearRect(0, 0, w, h);
  const vals = series.map(s => s[1]); const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  const pt = (i, v) => [8 + (w - 16) * (i / Math.max(1, series.length - 1)), h - 8 - (h - 16) * ((v - lo) / span)];
  x.beginPath(); series.forEach((s, i) => { const [px, py] = pt(i, s[1]); i ? x.lineTo(px, py) : x.moveTo(px, py); });
  const acc = TOK('--brass', '#F2C14E');
  x.strokeStyle = acc; x.lineWidth = 2; x.lineJoin = 'round';
  if (kind === 'estimate') x.setLineDash([6, 5]);
  x.stroke(); x.setLineDash([]);
  const [lx, ly] = pt(series.length - 1, vals[vals.length - 1]);
  x.fillStyle = acc; x.beginPath(); x.arc(lx, ly, 3.5, 0, 7); x.fill();
}

/* ---- the live loop ------------------------------------------------------
   Take 125: one capture after another while the Scan screen is up, each through
   the look that read last (the next look after a capture that did not). Take 10
   captured only once a card outline had held still for 350 ms; the outline was
   the whole view on 14 of the owner's 15 frames (MEASURED), so every capture
   waited on it and read the wrong place. Landmine 18 still holds: no shutter tap
   in the happy path, and two agreeing reads of three decide. The picker open
   pauses it, and the number decided is held until it leaves the view (makeVoter). */
const SCAN = { stream: null, running: false, voter: makeVoter(), busy: false, look: 0, gen: 0 };
async function startCamera() {
  if (SCAN.stream) return true;
  try {
    SCAN.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' },
               width: { ideal: 1920 }, height: { ideal: 1080 } } });
    const v = $('#cam'); v.srcObject = SCAN.stream; await v.play();
    $('#guide').classList.add('live');
    /* Landmine 10: foils blow out under auto-exposure. Two mitigations that are
       track constraints, not model changes -- a torch for a dark table, and
       continuous focus/exposure if the device advertises them. */
    try {
      const tr = SCAN.stream.getVideoTracks()[0];
      const caps = tr.getCapabilities ? tr.getCapabilities() : {};
      $('#btnTorch').style.display = caps.torch ? '' : 'none';
      const adv = {};
      if (caps.focusMode && caps.focusMode.includes('continuous')) adv.focusMode = 'continuous';
      if (caps.exposureMode && caps.exposureMode.includes('continuous')) adv.exposureMode = 'continuous';
      if (Object.keys(adv).length) await tr.applyConstraints({ advanced: [adv] });
    } catch (e) {}
    SCAN.running = true; if (PLATFORM.hasOcr()) scanLoop(++SCAN.gen);
    $('#camHint').textContent = PLATFORM.hasOcr()
      ? 'Point at the card. Hold steady.'
      : 'Preview only — the recogniser runs in the app, not the browser.';
    return true;
  } catch (e) {
    $('#camHint').textContent = 'Camera unavailable: ' + e.message;
    return false;
  }
}
function stopCamera() {
  SCAN.running = false;
  const g = $('#guide'); if (g) g.classList.remove('live');
  if (SCAN.stream) { SCAN.stream.getTracks().forEach(t => t.stop()); SCAN.stream = null; }
}
async function scanLoop(gen) {
  const frame = () => new Promise(r => requestAnimationFrame(r));
  while (SCAN.running && gen === SCAN.gen) {
    const v = $('#cam');
    if (v.videoWidth && !$('#picker').classList.contains('on')) await captureAndIdentify(v);
    await frame();
  }
}
const SCAN_HINT = { 'no-text': 'Point at the card.', 'no-read': 'Looking for the code\u2026',
                    several: 'One card at a time \u2014 more than one number in view' };
async function captureAndIdentify(v) {
  if (SCAN.busy) return;
  SCAN.busy = true;
  try {
    const r = v.getBoundingClientRect(), look = LOOKS[SCAN.look];
    const res = await identifyFrame(v, viewRect(v.videoWidth, v.videoHeight, r.width, r.height), look);
    if (!SCAN.running) return;   // the screen closed while it read: nothing is added, and the camera is not started again behind another screen
    const number = res.stage === 'read' ? res.number : null;
    if (!number) SCAN.look = (SCAN.look + 1) % LOOKS.length;
    $('#guide').classList.toggle('seen', !!number);
    drawCard(res, r);
    const voted = SCAN.voter.push(number);
    if (!number) { $('#camHint').textContent = SCAN_HINT[res.stage] || ''; return; }
    $('#camHint').textContent = voted || SCAN.voter.held === number ? '' : `Saw ${number} \u2014 hold still\u2026`;
    if (!voted) return;
    const rs = resolve(voted, { setId: BATCH.setId, face: res.face });
    const photo = await PLATFORM.savePhoto(res.full.toDataURL('image/jpeg', 0.7), voted);   // landmines 27, 79
    if (rs.verdict === 'ask') openPicker(voted, rs, photo);
    else if (rs.verdict === 'auto') { flashHit(); accept(rs.pick, rs.why, photo); }
    else $('#camHint').textContent = `${voted} is not in the catalogue`;
  } finally { SCAN.busy = false; }
}
/* the card's outline on the guide: only an outline believed (the number sits where it says, stage 4) */
function drawCard(res, r) {
  const ov = $('#camOv'); ov.width = r.width; ov.height = r.height;
  const g = ov.getContext('2d'); g.clearRect(0, 0, ov.width, ov.height);
  const q = res.card; if (!q) return;
  g.strokeStyle = '#f5c518'; g.lineWidth = 2.5;
  g.strokeRect(q.x * r.width, q.y * r.height, q.w * r.width, q.h * r.height);
}
function flashHit() {
  const g = $('#guide'); g.classList.remove('seen'); g.classList.add('hit');
  setTimeout(() => g.classList.remove('hit'), 500);
}

/* The shutter does two things: in the app, it takes a capture now rather than
   at the loop's next turn; in a browser with no recogniser, it runs the
   simulation from take 2 so the flow can still be walked and the ask/auto
   ratio is still the real one. */
$('#btnTorch').addEventListener('click', async () => {
  if (!SCAN.stream) return;
  const tr = SCAN.stream.getVideoTracks()[0];
  const on = !(tr.getSettings && tr.getSettings().torch);
  try { await tr.applyConstraints({ advanced: [{ torch: on }] }); $('#btnTorch').style.color = on ? 'var(--gold)' : ''; }
  catch (e) { toast('Torch not available'); }
});
CLICKS.on('#earnBtn', e => {
  if (e.target.id !== 'earnBtn') return;
  PLATFORM.adShow('scan');
});
$('#btnShutter').addEventListener('click', async () => {
  const v = $('#cam');
  if (SCAN.stream && v.videoWidth && PLATFORM.hasOcr()) {
    return captureAndIdentify(v);
  }
  simulateScan();
});
$('#btnGallery').addEventListener('click', async () => {
  const path = await PLATFORM.pickImage();
  if (!path) return toast(PLATFORM.cap() ? 'No image chosen' : 'Gallery import runs in the app');
  const img = new Image();
  img.onload = async () => {
    /* take 125: a photo gets every look until one reads a number, or finds more than one */
    const view = { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    let res = null;
    for (const look of LOOKS) { res = await identifyFrame(img, view, look); if (res.stage === 'read' || res.stage === 'several') break; }
    if (res.stage === 'several') return toast('More than one card number in that photo \u2014 crop it to one card');
    if (res.stage !== 'read') return toast('Could not read a card number from that photo');
    const r = resolve(res.number, { setId: BATCH.setId, face: res.face });
    const photo = await PLATFORM.savePhoto(res.full.toDataURL('image/jpeg', 0.7), res.number);
    if (r.verdict === 'ask') openPicker(res.number, r, photo);
    else if (r.verdict === 'auto') accept(r.pick, r.why, photo);
  };
  img.src = path;
});

/* Kept from take 2 for the browser build. Draws a real card and runs the REAL
   gate, so the ask/auto ratio you see is the measured one. It never runs in
   the APK: PLATFORM.hasOcr() routes the shutter to the camera there. */
function simulateScan() {
  const withNum = CAT.rows.filter(p => p.num);
  const seed = withNum[Math.floor(Math.random() * withNum.length)];
  const g = $('#guide');
  g.classList.add('seen');
  setTimeout(() => {
    const r = resolve(seed.num, { setId: BATCH.setId, face: seed.face === 'plain' ? null : seed.face });
    if (r.verdict === 'ask') { g.classList.remove('seen'); openPicker(seed.num, r); }
    else { flashHit(); accept(r.pick, r.why); }
  }, 260);
}
function accept(p, why, photo) {
  BATCH.rows.push({ id: p.id, photo: photo || null });
  BATCH.save();
  PLATFORM.haptic();
  $('#lastScan').innerHTML =
    `<b>${esc(p.name)}${p.treat !== 'base' ? ' \u00b7 ' + esc(TREAT[p.treat]) : ''}</b>` +
    `<span>${dotJoin(esc(p.num), money(p.market), why ? esc(why) : '')}</span>`;
  paintScan();
}

/* ---- the picker: primary surface, not a fallback ----------------------- */
let _pickerPhoto = null;
function openPicker(number, r, photo) {
  _pickerPhoto = photo || null;
  $('#pkTitle').textContent = `Which ${number}?`;
  $('#pkWhy').innerHTML = r.why;
  $('#pkOpts').innerHTML = r.candidates.map((p, i) => {
    const s = CAT.sets.get(p.set) || {};
    const bits = [TREAT[p.treat] || p.treat];
    const faceHint = p.face === 'sp' ? 'SP badge on the card'
                   : p.face === 'star' ? 'star on the card' : '';
    if (p.prov) bits.push(p.prov);
    if (p.award) bits.push(p.award);
    return `<button class="opt${i === 0 ? ' best' : ''}" data-pick="${p.id}">
      <div class="oa"><div class="ph" style="font-size:var(--fs-cap);color:var(--dim2)">${esc(TREAT[p.treat] === 'Base' ? '' : (TREAT[p.treat] || ''))}<br>${esc((s.abbr || '').slice(0, 8))}</div>${refArt(p)}</div>
      <div class="oi"><b>${esc(bits.join(' \u00b7 '))}</b>
        <span>${esc(s.abbr || s.name || '')}${faceHint ? ' \u00b7 ' + faceHint : ''}${p.sameart
          ? ' \u00b7 <span style="color:var(--gold)">looks identical to another option</span>'
          : ''}</span></div>
      <div class="op mono">${money(p.market)}<span>${esc(p.sub || 'Normal')}</span></div>
    </button>`;
  }).join('');
  $('#picker').classList.add('on');
}
$('#pkCancel').addEventListener('click', () => PICKER.dismiss());   // take 115: a pending prompt answers no
CLICKS.on('[data-pick]', e => {
  const b = e.target.closest('[data-pick]'); if (!b) return;
  $('#picker').classList.remove('on');
  accept(CAT.byId.get(+b.dataset.pick), 'you picked it', _pickerPhoto);
});

