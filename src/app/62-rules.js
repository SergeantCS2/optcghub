/* ---- rules (take 122) ----------------------------------------------------
   The Comprehensive Rules as the app knows them: a digest in the app's own
   words under the official section numbers (tools/rules/digest.json), built
   in so it works offline, searchable, each section saying what the Sim does
   about it. Check for updates reads rules.json from Pages -- the build reads
   the official PDF's version there -- and a newer digest's text replaces the
   built-in one on this phone. What the Sim does is this build's: a section a
   newer digest adds says it is not reviewed for this version of the app. */
const RULEBOOK = /* __RULEBOOK__ */ null;
function verNewer(a, b) { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let k = 0; k < 3; k++) if ((x[k] || 0) !== (y[k] || 0)) return (x[k] || 0) > (y[k] || 0); return false; }
const RULES_DB = {
  official: readJson('vault.rulesOfficial', null, false),
  cur() { const s = readJson('vault.rules', null, false); return s && Array.isArray(s.sections) && s.version && verNewer(s.version, RULEBOOK.version) ? s : RULEBOOK; },
  simOf(id) { const s = RULEBOOK.sections.find(x => x.id === id); return s ? s.sim : 'not reviewed for this version of the app'; },
  find(q) { const norm = x => String(x || '').toLowerCase().replace(/\u2019/g, "'"); const t = norm(q).trim().replace(/^\u00a7/, ''); const all = this.cur().sections; if (!t) return all;
    if (/^\d+(-\d+)*$/.test(t)) return all.filter(s => s.id === t || s.id.startsWith(t + '-'));
    const words = t.split(/\s+/); return all.filter(s => { const hay = norm(`${s.id} ${s.title} ${s.text}`); return words.every(w => hay.includes(w)); }); },
  async sync() { const base = CAT.man.updateUrl; if (!base) return { ok: false, why: 'Sync is not configured' }; if (!navigator.onLine) return { ok: false, why: 'No connection' };
    try { const r = await fetch(base + 'rules.json', { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); const d = await r.json();
      if (!d || !Array.isArray(d.sections) || !d.version) throw new Error('not a rules file');
      this.official = Object.assign({ at: new Date().toISOString() }, d.official || {}); saveJson('vault.rulesOfficial', this.official);
      const newer = verNewer(d.version, this.cur().version);
      if (newer) saveJson('vault.rules', { version: d.version, date: d.date, title: d.title, url: d.url, note: d.note, sections: d.sections });
      return { ok: true, newer, version: d.version }; }
    catch (e) { ERRS.push('rules', `the rules check failed: ${e.message || e}`, 'rules'); return { ok: false, why: `Could not check \u2014 ${e.message || e}` }; } } };
function rulesStatus() { const b = RULES_DB.cur(), o = RULES_DB.official;
  const own = `The app\u2019s digest of the Comprehensive Rules v${b.version} (${dayText(b.date, { year: true })}); the official text governs, and card text beats the rules.`;
  if (!o || !o.version) return own + (o && o.why ? ` The last check could not read the official PDF (${esc(o.why)}).` : '');
  return own + (verNewer(o.version, b.version) ? ` <b>Bandai has published v${esc(o.version)}${o.date ? ' (' + dayText(o.date, { year: true }) + ')' : ''}</b>; the Sim plays by v${b.version} until an update reviews it.` : ` The official PDF is v${esc(o.version)} too (checked ${dayText(String(o.checked || '').slice(0, 10))}).`); }
function paintRules(q) { const list = RULES_DB.find(q); $('#rulesSrc').innerHTML = rulesStatus();
  $('#rulesList').innerHTML = list.length ? list.map(s => `<div class="row" id="rule-${s.id}"><div class="nm"><b>\u00a7${s.id} ${esc(s.title)}</b><span style="display:block">${esc(s.text)}</span><span class="note" style="display:block">In the Sim: ${esc(RULES_DB.simOf(s.id))}</span></div></div>`).join('')
    : `<div class="note">No section says \u201c${esc(q)}\u201d. Try a keyword ([Blocker]), a word (Life) or a number (6-5-5).</div>`; }
function openRules(id) { const q = id || ''; $('#rulesQ').value = q; paintRules(q); $('#rulesSheet').classList.add('on'); }
$('#rulesQ').addEventListener('input', e => paintRules(e.target.value));
$('#rulesSync').addEventListener('click', async () => { const n = $('#rulesSyncNote'); n.textContent = 'Checking\u2026'; const r = await RULES_DB.sync();
  n.textContent = r.ok ? (r.newer ? `Updated to v${r.version}.` : `Up to date (v${RULES_DB.cur().version}).`) : r.why; paintRules($('#rulesQ').value); });
/* __SIM__ -- the engine and the opponent live in src/sim.js (take 122); build_app.py puts them here */
