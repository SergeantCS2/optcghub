/* ---- self-test (take 45) ------------------------------------------------
   smoke.mjs proves the app in node; this proves it on the PHONE, against
   the real catalogue and the real plugins, in one tap. Each check is
   PASS / FAIL / SKIP with one line; SKIP means "this environment cannot
   answer", never "probably fine". The report is shareable text so a tester
   can paste it. A check that throws is a FAIL with the message. */
/* ---- diagnostics (take 82) ----------------------------------------------
   The owner’s ask: the APEX diagnostic tool -- a report he can paste for
   troubleshooting, behind a secret gesture. Five taps on the version line in
   More. It runs the self-test and adds everything else that helps read a
   phone from a report: the sync and Hunt endpoints with their live HTTP
   status and file ages, what is stored and how big, the mode, the zip, the
   device, and the last twenty errors the page raised. No collection
   contents, no personal data beyond the zip the collector typed. */
/* the opening screen's fallback and the error buffer (take 91) are set up at the top of the script since take 115 */
const DIAG = {
  taps: 0, at: 0,
  tap() { const now = Date.now(); this.taps = now - this.at < 1500 ? this.taps + 1 : 1; this.at = now; if (this.taps >= 5) { this.taps = 0; go('diag'); return true; } return false; },
  async probe(url) { if (!url) return 'no url'; if (!navigator.onLine) return 'offline'; try { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return 'HTTP ' + r.status; const j = await r.json().catch(() => null); const age = j && (j.fetched_at || j.source_updated_at) ? ' \u00b7 ' + HUNT.ageLabel(j.fetched_at || j.source_updated_at) : ''; return 'HTTP ' + r.status + age; } catch (e) { return 'fetch failed: ' + (e.message || e); } },
  kb(key) { try { const v = localStorage.getItem(key); return v ? Math.round(v.length / 1024) + ' KB' : '-'; } catch (e) { return '?'; } },
  async report() {
    const L = []; const line = (k, v) => L.push(`${k}: ${v}`);
    L.push(`OP TCG Hub diagnostics \u2014 take ${TAKE} \u2014 ${new Date().toISOString().slice(0, 16)}Z`);
    L.push('', '## app'); line('build', CAT.man.built_at || '?'); line('mode', MODE.cur); line('screen stack', NAV.stack.join(' > ') || '-');
    line('boot stack', (NAV.bootStack || []).join(' > ') || 'none'); line('screens on', [...document.querySelectorAll('.screen.on')].map(e => e.id).join(',') || 'NONE'); line('overlays on', ['#askSheet', '#picker', '#rulesSheet', '#simSheet', '#detail', '#tour', '#simCurtain'].filter(id => { const el = $(id); return el && el.classList && el.classList.contains('on'); }).join(',') || 'none'); line('splash', $('#splash') ? 'still in the page' : 'gone');
    line('currency', CUR.active() + (CAT.man.rates ? ` (rates ${CAT.man.rates.date}${CAT.man.rates.stale ? ', stale' : ''})` : ' (no rates)')); line('online', navigator.onLine); line('native', !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())); line('plugins', ['Camera', 'Filesystem', 'Share', 'LocalNotifications', 'Network', 'App', 'AdMob', 'AppUpdate'].filter(n => PLATFORM.plugin(n)).join(', ') || 'none (browser)');
    line('ads', !CAT.man.ads ? 'none' : PLATFORM.adUnitsNote()); line('consent', !CAT.man.ads ? 'none' : PLATFORM.consentNote()); line('update', UPDATE.note());   /* take 128 */
    L.push('', '## device'); line('ua', String(navigator.userAgent || '?').slice(0, 120)); line('viewport', `${typeof innerWidth === 'number' ? innerWidth + 'x' + innerHeight : '?'} @${devicePixelRatio || 1}`); line('language', navigator.language || '?'); line('tz', (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return '?'; } })());
    L.push('', '## catalogue'); line('cards', CAT.man.cards); line('printings', CAT.rows.length); line('pictures', picturesLine()); line('prices dated', (CAT.man.source_updated_at || '?').slice(0, 10)); line('history days', (CAT.days || []).length + (CAT.days && CAT.days.length ? ` (${CAT.days[0]}..${CAT.days[CAT.days.length - 1]})` : '')); line('catalogue copy', CAT.man.fromDisk ? 'synced on this phone' : 'the one that came with the app' + (CAT.refused ? ` (${CAT.refused})` : '')); line('sealed products', sealedCountLine()); line('stock decks', (CAT.stock || []).length); line('effects scripted', CAT.man.effects ? effectsLine(CAT.man.effects, Object.keys(CAT.effects || {}).filter(id => CAT.effects[id].some(e => !e.hand)).length) : '?'); line('effects proven', CAT.man.effects && CAT.man.effects.proofs != null ? `${CAT.man.effects.proven} printings proven, ${CAT.man.effects.wrong} proven wrong, from ${CAT.man.effects.proofs} proofs; ${CAT.man.effects.hand} lines by hand` + (CAT.man.effects.stale && CAT.man.effects.stale.length ? `; reopened: ${CAT.man.effects.stale.join(', ')}` : '') : '?'); line('rules', RULEBOOK ? `v${RULES_DB.cur().version}` + (RULES_DB.official && RULES_DB.official.version ? `, official v${RULES_DB.official.version}` : '') : '?');
    L.push('', '## sync'); line('update url', CAT.man.updateUrl || 'NOT SET'); line('manifest', await this.probe(CAT.man.updateUrl ? CAT.man.updateUrl + 'manifest.json' : null));
    L.push('', '## hunt'); line('zip', HUNT.zip || '(none)'); line('served', JSON.stringify(HUNT.served())); line('radius', LOCAL.radius); line('feed url', HUNT.url() || 'NOT SET');
    for (const f of ['feed.json', 'history.json', 'stores.json', 'events.json', 'shops.json', 'zcta.json']) line('  ' + f, await this.probe(HUNT.url() ? HUNT.url().replace(/feed\.json$/, f) : null));
    line('feed on phone', feedLine()); line('online', onlineLine()); line('history on phone', HUNT.hist ? [`${HUNT.hist.runs.length} runs`, ...HUNT.DISTS.map(([k]) => `${k} in ${HUNT.hist.runs.filter(r => r && r[k] && typeof r[k] === 'object' && !Array.isArray(r[k])).length}`), HUNT.hist.runs.length ? 'ends ' + momentText(HUNT.hist.runs[HUNT.hist.runs.length - 1].t) : ''].filter(Boolean).join(', ') : 'none');   /* take 114: which runs read each distributor, and where the copy ends */ line('stores on phone', LOCAL.stores ? `${LOCAL.stores.stores.length}, ${HUNT.ageLabel(LOCAL.stores.fetched_at)}${HUNT.zip ? ', ' + LOCAL.stores.stores.filter(s => s.zip && s.zip.slice(0, 3) === HUNT.zip.slice(0, 3)).length + ' in your zip area' : ''}` : 'none'); line('events on phone', EVENTS.tab ? `${EVENTS.tab.rows.length} rows` : 'none'); line('shops on phone', LOCAL.shops ? `${LOCAL.shops.shops.length}` : 'none'); line('exact distances', LOCAL.exact()); line('stock alerts', STOCK.list.length); line('local notes', LOCAL.notes.length);
    L.push('', '## storage'); for (const k of ['vault.items', 'vault.snaps', 'vault.decks', 'vault.hunt', 'vault.hunt.hist', 'vault.hunt.stores', 'vault.hunt.events', 'vault.hunt.shops', 'vault.hunt.zcta', 'vault.alerts', 'vault.stockAlerts', 'vault.beforeRestore', ...STORE.unreadable.filter(k => this.kb(k + '.unreadable') !== '-').map(k => k + '.unreadable')]) line(k, this.kb(k));   /* take 115: the collection is vault.items and vault.snaps -- 'vault.collection' named a key that never existed; vault.beforeRestore is what the last restore replaced */
    line('writes that failed', [...STORE.failed].join(', ') || 'none'); line('backups held', backupHeld() ? `yes \u2014 the stored ${heldWhat()} could not be read; the last backup is kept until a restore` : 'no');
    L.push('', '## counts (never contents)'); line('collection items', OWN.items.length); line('decks', DECKS.list.length); line('price alerts', ALERTS.list.length);
    L.push('', '## last errors'); if (!ERRS.list.length) L.push('none'); else for (const e of ERRS.list) L.push(`${e.t.slice(0, 19).replace('T', ' ')} ${e.kind}: ${e.msg}${e.where ? ' @ ' + e.where : ''}`);   /* take 91: records outlive the day now */
    L.push('', '## self-test'); try { await runSelfTest(); L.push(...(SELFTEST.text() || 'no result').split('\n').slice(1)); } catch (e) { L.push('self-test threw: ' + (e.message || e)); }
    return L.join('\n');
  }
};
/* take 104 (the owner’s PC run): a computer with no camera is not a failure of the app,
   so the browser skips with the reason; on the phone no camera stays a FAIL. Named so the
   stub can call it (landmine 135). */
function cameraVerdict(devices, native) {
  const n = (devices || []).length;
  if (!n && !native) return { skip: true, note: 'no camera listed on this device \u2014 the scanner needs one' };
  return { ok: n > 0, note: `${n} camera(s) listed` };
}
/* take 104: the Diagnostics line counts effect LINES (the manifest’s scripted/lines); the
   self-test counts cards. Both are right; the line now says which, with the cards beside. */
function effectsLine(effects, cards) { return `${effects.scripted} of ${effects.lines} effect lines (${cards} cards)`; }

const SELFTEST = {
  last: null,
  async run() {
    const out = [];
    const check = async (name, fn) => {
      try { const r = await fn(); out.push({ name, s: r === null || (r && r.skip) ? 'SKIP' : (r === true || (r && r.ok) ? 'PASS' : 'FAIL'), note: (r && r.note) || (r === null ? 'not available here' : '') }); }   // take 104: { skip: true, note } skips WITH its reason
      catch (e) { out.push({ name, s: 'FAIL', note: String(e && e.message || e).slice(0, 120) }); }
    };
    await check('Catalogue loaded', () => ({ ok: CAT.ready && CAT.rows.length === (CAT.man.printings || CAT.rows.length) && CAT.rows.length > 5000, note: catalogueNote() }));
    await check('Printing index is one-to-one', () => ({ ok: CAT.byId.size === CAT.rows.length, note: `${CAT.byId.size} ids` }));
    await check('Price history on file', () => ({ ok: (CAT.days || []).length >= 1, note: `${(CAT.days || []).length} day(s)` }));
    await check('The confidence gate asks on EB03-024\'s three printings', () => { const r = resolve('EB03-024'); return { ok: r.verdict === 'ask' && r.candidates.length === 3, note: `${r.verdict}, ${r.candidates.length} printings` }; });
    await check('A unique number auto-accepts', () => { const one = [...CAT.byNum.entries()].find(([n, l]) => l.filter(p => p.num === n).length === 1); if (!one) return { ok: false, note: 'no unique number found' }; const r = resolve(one[0]); return { ok: r.verdict === 'auto', note: `${one[0]} \u2192 ${r.verdict}` }; });
    await check('Search finds a card by name', () => { const n = CAT.rows.filter(p => p.full.toLowerCase().includes('nami')).length; return { ok: n > 0, note: `${n} rows for "nami"` }; });
    await check('Star template shipped', () => ({ ok: !!(CAT.star && CAT.star.box), note: CAT.star ? `threshold ${CAT.star.threshold}` : 'missing' }));
    await check('Fonts loaded', async () => { if (!document.fonts || !document.fonts.check) return null; await document.fonts.ready; const ok = document.fonts.check('16px "OPH Display"') && document.fonts.check('16px "OPH Body"'); return { ok, note: ok ? 'display + body' : 'a role face did not load' }; });
    await check('Storage writes and reads back', () => { const k = 'vault.selftest', v = String(Date.now()); localStorage.setItem(k, v); const ok = localStorage.getItem(k) === v; localStorage.removeItem(k); return { ok, note: ok ? 'localStorage round-trip' : 'mismatch' }; });
    /* take 125 (landmine 239): the backups themselves -- the last one written, or why it was not; nothing is written here */
    await check('Backups are being written', () => { const b = OWN.lastBackup; if (!b) return null;
      return { ok: !b.failed, note: b.failed ? `failed ${momentText(b.at)}${b.why ? ': ' + b.why : ' (no reason was kept before take 125)'}` : `${momentText(b.at)} \u00b7 ${b.where}` }; });
    await check('Backup file round-trip (Filesystem)', async () => { const FS = PLATFORM.plugin('Filesystem'); if (!FS) return null; const path = 'selftest/probe.json', data = JSON.stringify({ t: Date.now() }); await FS.writeFile({ path, data, directory: 'CACHE', recursive: true, encoding: 'utf8' }); const r = await FS.readFile({ path, directory: 'CACHE', encoding: 'utf8' }); try { await FS.deleteFile({ path, directory: 'CACHE' }); } catch (e) {} return { ok: r.data === data, note: 'wrote, read, deleted in the app cache' }; });
    await check('Share sheet available', async () => { const SH = PLATFORM.plugin('Share'); if (!SH) return null; const r = await SH.canShare(); return { ok: !!r.value, note: r.value ? 'Share.canShare true' : 'canShare false' }; });
    await check('Camera reachable', async () => { if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return null; const d = (await navigator.mediaDevices.enumerateDevices()).filter(x => x.kind === 'videoinput'); return cameraVerdict(d, !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())); });
    await check('OCR reads a code the app drew (ML Kit)', async () => {
      if (!PLATFORM.hasOcr()) return null;
      const c = document.createElement('canvas'); c.width = 600; c.height = 160;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 600, 160); x.fillStyle = '#000'; x.font = 'bold 72px sans-serif'; x.fillText('OP01-016', 40, 110);
      const r = await PLATFORM.ocr(c), txt = r ? r.text : ''; return { ok: parseRead(txt).number === 'OP01-016', note: txt ? `read "${txt.trim().slice(0, 30)}"` : 'no text returned' };
    });
    await check('Notifications permission', async () => { const N = PLATFORM.plugin('LocalNotifications'); if (!N) return null; const r = (await N.checkPermissions()) || {}; return { ok: !!r.display && r.display !== 'denied', note: r.display ? `display: ${r.display}` : 'the plugin answered without a permission state (its permission annotation is missing from the build, landmine 141)' }; });
    /* take 121: real units are right on a build at or after ads.live.from; what is wrong is a real unit in
       ads.scan or ads.deck, which every install from take 120 and earlier reads */
    await check('Ads: the units match this build', () => { const A = PLATFORM.plugin('AdMob'); if (!A) return null; const a = CAT.man.ads, u = PLATFORM.adUnits(), T = 'ca-app-pub-3940256099942544/';
      if (!a || !u.scan || !u.deck || !u.max) return { ok: false, note: 'no ad units in the manifest' };
      if (!a.test || ![a.scan, a.deck].every(x => String(x).startsWith(T))) return { ok: false, note: 'a real unit where every older install reads it (ads.scan, ads.deck)' };
      return { ok: true, note: PLATFORM.adUnitsNote() }; });
    await check('Sim: scripted effects loaded and one offers correctly', () => { const n = Object.keys(CAT.effects || {}).filter(id => CAT.effects[id].some(e => !e.hand)).length; if (!n) return { ok: false, note: 'no effects in the bundle' };
      const k = Object.keys(CAT.effects).find(id => ['Character', 'Stage'].includes((CAT.byId.get(+id) || {}).type) && CAT.effects[id].some(e => e.t === 'onplay' && e.if.length === 0 && e.do.length === 1 && e.do[0].a === 'draw'));
      if (!k) return { ok: false, note: `${n} cards scripted, no plain [On Play] draw among them` };
      /* played and resolved through SIM.act, the one way a move is made (take 122), on a probe game put back after */
      const saved = SIM.g, cost = SIM.cost(CAT.byId.get(+k)); const P = SIM.player('probe', +k, [1, 2, 3]); P.taken = 1; P.hand = [+k]; P.don.active = cost; P.donDeck -= cost;
      SIM.blank([P, SIM.player('probe 2', +k, [1, 2, 3])]);
      try { const played = SIM.act(0, { t: 'play', h: 0 }); while (SIM.g.queue.length && !(SIM.g.queue[0].steps[0] && SIM.g.queue[0].steps[0].a === 'draw')) SIM.act(0, { t: 'fxskip' });
        const o = SIM.g.queue[0], r = o ? SIM.act(0, { t: 'fx', target: null }) : null;
        return { ok: !!(played.ok && r && r.ok && P.hand.length === o.steps[0].n), note: `${n} cards scripted; ${CAT.byId.get(+k)?.name} drew ${P.hand.length}` }; }
      finally { SIM.g = saved; } });
    await check('Sync URL answers', async () => { const base = CAT.man.updateUrl; if (!base) return { ok: false, note: 'not configured' }; if (!navigator.onLine) return null; const r = await fetch(base + 'manifest.json', { cache: 'no-store' }); const m = r.ok ? await r.json() : null; return { ok: !!(m && m.source_updated_at), note: m ? `Pages has prices from ${m.source_updated_at.slice(0, 10)}` : `HTTP ${r.status}` }; });
    this.last = { at: new Date().toISOString(), take: TAKE, checks: out };
    return this.last;
  },
  text() {
    const r = this.last; if (!r) return '';
    const n = s => r.checks.filter(c => c.s === s).length;
    return [`OP TCG Hub self-test \u2014 take ${r.take} \u2014 ${r.at.slice(0, 16)}`, `${n('PASS')} pass, ${n('FAIL')} fail, ${n('SKIP')} skipped`, '',
      ...r.checks.map(c => `${c.s.padEnd(4)} ${c.name}${c.note ? ' \u2014 ' + c.note : ''}`)].join('\n');
  }
};
document.addEventListener('click', async e => {
  if (e.target.closest('#diagRun')) { const b = $('#diagRun'); b.disabled = true; $('#diagOut').textContent = 'Running\u2026'; const t = await DIAG.report(); $('#diagOut').textContent = t; b.disabled = false; $('#diagCopy').disabled = false; $('#diagShare').disabled = false; }
  if (e.target.closest('#devEarn')) { CREDITS.earn('scan'); toast(`${CREDITS.state.scan} save credits`); }
  if (e.target.closest('#diagCopy')) { try { await navigator.clipboard.writeText($('#diagOut').textContent); toast('Copied'); } catch (err) { toast('Select the text and copy it'); } }
  if (e.target.closest('#diagShare')) { const t = $('#diagOut').textContent; const r = await PLATFORM.shareFile(`optcghub-diagnostics-take${TAKE}.txt`, t, 'Diagnostics'); if (r !== 'shared') { try { await navigator.clipboard.writeText(t); toast('Copied instead'); } catch (err) {} } }
});
async function runSelfTest() {
  const box = $('#stOut'); if (box) box.innerHTML = '<div class="note">Running\u2026</div>';
  const r = await SELFTEST.run();
  if (!box) return r;
  box.innerHTML = r.checks.map(c => `<div class="row" style="gap:10px"><b style="min-width:44px;color:${c.s === 'PASS' ? 'var(--up)' : c.s === 'FAIL' ? 'var(--down)' : 'var(--dim2)'}">${c.s}</b>
    <div class="nm"><b>${esc(c.name)}</b>${c.note ? `<span>${esc(c.note)}</span>` : ''}</div></div>`).join('') +
    `<button class="linkish" id="stShare" style="margin-top:8px">Share the report</button>`;
  const sh = $('#stShare'); if (sh) sh.addEventListener('click', () => { const t = SELFTEST.text(); if (navigator.share) navigator.share({ title: 'OP TCG Hub self-test', text: t }).catch(() => {}); else { try { navigator.clipboard.writeText(t); toast('Copied'); } catch (e) { toast('Copy failed'); } } });
  return r;
}

