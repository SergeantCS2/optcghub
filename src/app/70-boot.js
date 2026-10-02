/* ---- boot -------------------------------------------------------------- */
(async function boot() {
  try { await loadCatalogue(); }
  catch (e) {
    document.body.innerHTML = '<div class="empty">Catalogue failed to load.<br>' +
      esc(e.message) + '</div>';
    return;
  }
  OWN.snapshot(); paintBatchBadge();
  MODE.set(MODE.cur, false); go(MODE.home[MODE.cur] || 'home');   // take 81: the mode’s OWN home (Hunt used to reopen on Collect’s); take 105: pushed for Collect too — an empty stack made the first Back minimize the app (landmine 140)
  THEME.apply();   /* take 120: the status bar's icons for the theme */
  NAV.bootStack = NAV.stack.slice();
  splashDone();
  ALERTS.check().then(f => { if (f.length) toast(`${f.length} price alert${f.length === 1 ? '' : 's'} fired`); });
  RELALERTS.check();                                       /* take 97: a release reminder whose day has come, once */
  if (backupHeld()) setTimeout(() => toast(`Your saved ${heldWhat()} could not be read \u2014 use Restore from backup, under More`, 6000), 0);   /* take 115: every launch until a restore */
  if (navigator.onLine && CAT.man.updateUrl && PLATFORM.quietSyncAllowed()) setTimeout(() => PLATFORM.refreshCatalogue({ quiet: true }), 1500);
  /* A17 at boot. Constants from the manifest (D10), gate on only where an ad
     can actually be shown. */
  if (CAT.man.ads) {
    CREDITS.FREE_ON_INSTALL = CAT.man.ads.free; CREDITS.PER_AD = CAT.man.ads.perAd;
    CREDITS.FREE_DECKS = CAT.man.ads.decksFree; CREDITS.DECKS_PER_AD = CAT.man.ads.decksPerAd;
    if (!localStorage.getItem('vault.credits')) { CREDITS.state.scan = CREDITS.FREE_ON_INSTALL; CREDITS.state.deck = CREDITS.FREE_DECKS; CREDITS.save(); }
    ADS_ENABLED = !!(CAT.man.ads.scan && PLATFORM.plugin('AdMob'));
    if (ADS_ENABLED) PLATFORM.adsStartWhenFree();   /* take 127: consent first, never over the first-open guide */
  }
  UPDATE.watch();   /* take 128: Play's answer on a newer version -- at launch once the guide and the consent message are out of the way, on return to the front and every six hours while open */
  paintDevEarn();   /* take 115: after the manifest's numbers, and again whenever Diagnostics opens */
  /* Take 81: the phone’s back button. Read from @capacitor/app’s definitions:
     addListener('backButton', ({ canGoBack })), minimizeApp(). An open sheet
     closes first; then the screen stack; at the bottom the app minimises
     rather than exits, which is what Android users expect of Home-like apps. */
  const APP = PLATFORM.plugin('App');
  if (APP && APP.addListener) { try { APP.addListener('backButton', () => { try { if (closeAnyOverlay()) return; if (NAV.back()) return; if (APP.minimizeApp) APP.minimizeApp(); } finally { screenWatchdog('hardware back'); } }); } catch (e) {} }
  window.addEventListener('popstate', () => { try { if (closeAnyOverlay()) return; NAV.silent = true; NAV.stack.pop(); const prev = NAV.stack[NAV.stack.length - 1]; if (prev) go(prev); NAV.silent = false; } finally { screenWatchdog('history back'); } });
  /* First open: the guide, once. If storage is unavailable it simply shows
     every time -- an extra tap beats a first-time collector with no
     explanation (APEX A129). */
  let seen = false; try { seen = localStorage.getItem(GUIDE_KEY) === '1'; } catch (e) {}
  if (!seen) setTimeout(guideOpen, 250);
  /* From the manifest, never a literal: the count changed 6,860 -> 6,862 in one
     day and a hardcoded placeholder is landmine 62 in a text box. */
  $('#allq').placeholder = `Search all ${(CAT.man.cards || 0).toLocaleString()} cards`;
  paintNet(); paintHome();
  window.VAULT = { ONLINE, onlineLine, simOnlineHtml, linePic, lineShowsPhoto, flipLine, flipSwipe, FLIP, UPDATE, get guidePage() { return guidePage; }, guideOpen, guideClose, guideGo, guideStart, guidePaint, GUIDE, topCard, dotJoin, curLabel, paintBinder, sealedKind, sealedWord, sealedRow, gameColours, distWords, feedLine, sourceLead, picturesLine, sealedCountLine, catalogueNote, setsWithCards, setCards, paintDevEarn, backArrow, closeSheet, setHomeTab, bulkLines, bulkSum, shownLines, signedMoney, pctNum, signedPct, dayText, momentText, fromShown, toShown, setTop, newestTop, paintSealedHero, ownBack, artBack, artUrl, artColours, largeOk, heroLeader, paintDeckHero, paintBack, stockPic, CAT, OWN, resolve, candidates, hamming, TAKE, NET, go, productPic, CUR, money, exportCsv, collectionPage, shareCollectionPage, simLogText, simReadiness, paintStock, deckCover, PLATFORM, SEALED, paintSealed, paintReleases, browseSet, RELALERTS, RELF, relBand, releaseEvent, openDetail, setCond, toast, cameraVerdict, effectsLine, HUNT, targetLine, walmartLine, distLine, distShort, distRowLines, distFold, distFoldTap, distSummary, DISTF, paintDetailDist, distHistory, distHistTap, tlDay, tlWindow, gtsDue, buySources, buyChips, askZip, LOCAL, paintLocal, EVENTS, paintEvents, STOCK, icsFor, addEventToCalendar, DIAG, ERRS, NAV, go, closeAnyOverlay,
                   cardPic, setPic, picBox, deckRow, paintHome, paintDecks, paintSearch, openDeck,
                   FILT, loadFilter, applyFilter, sortRows, blankFilter, activeCount,
                   DECKS, RULES, legality, analysis, colourLegal, CREDITS, get ADS_ENABLED() { return ADS_ENABLED; }, PF, TRADE, MODE, THEME, PLAY, plCurtain, paintPlay, SELFTEST, runSelfTest, SIM, SIMUI, BOT, simBotRun, paintSim, simAct, simSeat, simReport, simHandLabel, simTap, simSay, simAt, simSheetOpen, simPaced, simFit, RULEBOOK, RULES_DB, openRules, paintRules, rulesStatus, verNewer, CD, paintCards, WANT, openChecklist, ALERTS, BN, deckHistory, binderSets,
                   backupJson, scheduleBackup, backupHeld, restoreFromBackup, loadCatalogue, catalogueProblem, STORE, readJson, saveJson, BATCH,
                   PICKER, pickCurrency, MAXLOCK, bnTurn, commitOwn, importCsv, backupProblem, typedAmount, paintAlerts, localDay,
                   scan: { PLATFORM, detectQuad, parseRead, normaliseRead, starScore, makeVoter, identifyFrame, cropStar,
                           LOOKS, CODE_AT, viewRect, viewCanvas, lookCanvas, equalise, codesIn, cardAround, captureAndIdentify, SCAN } };
})();
