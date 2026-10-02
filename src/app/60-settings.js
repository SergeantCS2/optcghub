/* ---- settings ---------------------------------------------------------- */
function paintSettings() {
  /* take 91: the section is markup like every other screen (landmine 128).
     It was created here on first paint, and the take-83 guard in go()
     refused the id before this ran -- so More bounced to Home for eight takes. */
  const s = $('#setBody');   // take 107: the header above it is markup, like every screen’s
  const m = CAT.man; const note = m.whatsNew;   // take 117: the release note lives here, under About
  s.innerHTML = `
    <div class="panel"><h3>Your collection</h3>
      <div class="row"><div class="nm"><b>${OWN.items.length} lines</b>
        <span>${OWN.items.reduce((a, i) => a + i.qty, 0)} cards \u00b7 ${money(OWN.total())}</span>
      </div></div>
      <button class="linkish" data-act="export">Export CSV</button>
      <button class="linkish" data-act="sharepage">Share as a web page</button>
      <div class="row"><div class="nm"><b>Last backup</b>
        <span>${OWN.lastBackup ? (OWN.lastBackup.failed ? '<span class="down">Failed</span> ' + esc(momentText(OWN.lastBackup.at))
          : esc(momentText(OWN.lastBackup.at)) + ' · ' + esc(OWN.lastBackup.where)) : 'never'}</span></div>
        <button class="ghost" data-act="backup">Back up now</button></div>
      <button class="linkish" data-act="restore">Restore from backup</button>
      <div class="note">A backup is written to <b>Documents/OPTCGHub</b> on every batch
        commit and deck save. Photos are not in it — they are yours to rescan; the
        collection is what cannot be lost. <b>Before you uninstall or switch to
        the Play build: Export CSV and keep the file</b> — a reinstalled app
        cannot read its old backups by itself, though Restore lets you pick one.</div>
    </div>
    <div class="panel"><h3>About</h3>
      <div class="row"><div class="nm"><b id="aboutTake">Take ${TAKE} \u00b7 built ${esc(momentText(CAT.man.built_at))}</b><span>${CAT.man.cards ? CAT.man.cards.toLocaleString() + ' cards' : ''} \u00b7 prices ${esc(dayText(CAT.man.source_updated_at))}</span></div></div>
      <div class="row"><div class="nm"><b>Google Play</b><span id="aboutUpd">${esc(UPDATE.note())}</span></div><button class="ghost" data-act="update">${UPDATE.newer() ? 'Update' : 'Check for updates'}</button></div>
      ${note && note.take === TAKE ? `<details class="wn"><summary>New in this update</summary><div class="note">${esc(note.text.charAt(0).toUpperCase() + note.text.slice(1))}</div></details>` : ''}
      <div class="note" id="aboutIcons">Some of the icons are Lucide’s (ISC licence) and Feather’s (MIT licence); their notices travel inside the app.</div></div>
    <div class="panel"><h3>Self-test</h3>
      <div class="row"><div class="nm"><b>Does this phone run the app?</b><span>catalogue, scanner gate, OCR, backup, camera, fonts, sync \u2014 in one tap</span></div>
        <button class="ghost" id="stRun">Run</button></div>
      <div id="stOut"></div>
    </div>
    <div class="panel"><h3>How it works</h3>
      <button class="linkish" id="guideAgain">Show the guide again</button>
      <button class="linkish" data-act="currency">Show prices in\u2026 ${esc(CUR.active())}${CUR.active() !== 'USD' ? ' (converted)' : ''}</button>
      <button class="linkish" data-act="rate">Rate this app on Google Play</button>
      <button class="linkish" data-act="shareapp">Tell someone about the app</button>${PLATFORM.adPrivacyShown() ? '<button class="linkish" data-act="adprivacy">Privacy choices for ads</button>' : ''}</div>
    <div class="panel"><h3>Appearance</h3>
      <div class="seg" id="themeSeg" role="radiogroup" aria-label="Appearance">${['dark', 'light', 'system'].map(t => `<button role="radio" data-theme="${t}" class="${THEME.cur === t ? 'on' : ''}" aria-checked="${THEME.cur === t}">${{ dark: 'Dark', light: 'Light', system: 'Auto' }[t]}</button>`).join('')}</div>
      <div class="note">Dark is the app\u2019s own look. Light gives each mode a paper ground \u2014 parchment for Collect, chalk for Prep &amp; Play, cream for Hunt. Auto follows the phone\u2019s dark mode.</div></div>
    <div class="panel"><h3>Sync</h3>
      <div class="row"><div class="nm"><b>Prices from ${esc(dayText(CAT.man.source_updated_at))}</b>
        <span>${CAT.man.fromDisk ? 'synced copy on this phone' : 'the copy that came with the app'}${CAT.man.updateUrl ? '' : ' \u00b7 sync not configured'}</span></div>
        <button class="ghost" id="syncBtn">Sync now</button></div>
      <div class="note">Fetches the nightly catalogue when you are online. Everything else stays offline.</div>
      <label class="row" style="gap:10px;cursor:pointer"><input type="checkbox" id="syncCell" ${localStorage.getItem('vault.syncCellular') === '1' ? 'checked' : ''}>
        <span class="nm"><b>Also sync quietly on mobile data</b><span>about 0.5 MB a day. Off: the quiet sync waits for wifi; Sync now always works.</span></span></label>
    </div>
    <div class="panel"><h3>Catalogue</h3>
      <div class="row"><div class="nm"><b>${(m.cards || 0).toLocaleString()} cards</b>
        <span>${setsWithCards()} sets \u00b7 ${(m.hashed || 0).toLocaleString()} artwork hashes</span></div></div>
      <div class="row"><div class="nm"><b>Source updated</b>
        <span>${esc(m.source_updated_at || '?')}</span></div></div>
      <div class="row"><div class="nm"><b>Built</b><span>take ${TAKE} \u00b7 ${esc(m.built_at || '?')}</span></div></div>
    </div>
    <div class="panel"><h3>Save credits</h3>
      <div class="row"><div class="nm"><b>${CREDITS.state.scan} save credit${CREDITS.state.scan === 1 ? '' : 's'}</b>
        <span>${CREDITS.state.deck} deck save${CREDITS.state.deck === 1 ? '' : 's'}${CREDITS.state.pending.length ? ` \u00b7 ${CREDITS.state.pending.length} card${CREDITS.state.pending.length === 1 ? '' : 's'} waiting` : ''}</span></div></div>
      <div class="note">${ADS_ENABLED ? `Scanning never costs anything. Adding a scanned card to your collection uses a save credit, and a new deck a deck save; a short ad on Scan earns ${CREDITS.PER_AD} more. A card waiting for a credit is never lost.`
        : 'Saving is free here: credits, and the short ads that earn them, apply only in the Android app.'}</div>
    </div>
    <div class="panel"><h3>Network</h3>
      <div class="note">Requests this session: <b>${NET.count}</b><br>
        Hosts: ${[...NET.hosts].map(esc).join(', ') || 'none'}<br><br>
        Scanning, identifying, valuing and saving never use the network.
        Prices update when you sync; everything else works with no signal.</div>
    </div>
    <div class="panel"><h3>What this app does not know</h3>
      <div class="note">
        <b>Condition does not change the price shown.</b> The free feed publishes
        no per-condition figures, so a Damaged card and a Near Mint one display
        the same number. Yours is the judgement.<br><br>
        <b>Graded copies show the ungraded price.</b> A PSA 10 is usually worth
        considerably more.<br><br>
        <b>Japanese printings are not covered.</b> They carry different numbers
        and often 10× different prices.<br><br>
        <b>Sealed product is added by hand.</b> A booster box has no card number to scan.
      </div>
    </div>
    <div class="panel"><h3>Data sources</h3>
      <div class="note">
        Catalogue and pricing: <b>TCGplayer</b>, mirrored by
        <b>TCGCSV</b> (tcgcsv.com), a free community service.<br><br>
        Card artwork is the property of Bandai, Shueisha, Toei and Viz Media.
        This app does not store or redistribute it — only a 64-bit fingerprint
        used to tell printings apart.<br><br>
        <b>Not affiliated with, endorsed by, or sponsored by</b> Bandai,
        Shueisha, Toei Animation, Viz Media, TCGplayer or Collectr.
      </div>
    </div>
    <div style="height:40px"></div>`;
  $$('.screen').forEach(x => x.classList.toggle('on', x.id === 'settings'));
  /* take 110: the test credits moved to Diagnostics (the hidden screen) -- a button that gives credits
     without an ad is a tool for the owner’s testing, not the collector’s More */
  const ga = $('#guideAgain'); if (ga) ga.addEventListener('click', guideOpen);
  const at = $('#aboutTake'); if (at) at.addEventListener('click', () => DIAG.tap());
  const st = $('#stRun'); if (st) st.addEventListener('click', () => { st.disabled = true; runSelfTest().finally(() => { st.disabled = false; }); });
  const sc = $('#syncCell'); if (sc) sc.addEventListener('change', () => saveJson('vault.syncCellular', sc.checked ? '1' : '0'));
  const sy = $('#syncBtn'); if (sy) sy.addEventListener('click', async () => { sy.disabled = true; await PLATFORM.refreshCatalogue(); sy.disabled = false; paintSettings(); });
}

