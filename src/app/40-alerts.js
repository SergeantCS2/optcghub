/* =====================================================================
 * PRICE ALERTS — 8.5, take 27. A watch on a PRINTING (the alert is about a
 * price, and a price belongs to a printing -- landmine 1), a direction and a
 * threshold. Checked whenever a fresh catalogue lands, which is the only
 * moment a price can have moved (the nightly build). Fires once, then
 * disarms; the collector re-arms if they want it again. No server.
 * ===================================================================== */
const ALERTS = {
  list: readJson('vault.alerts', []),
  save(quiet = false) { saveJson('vault.alerts', this.list); if (!quiet) scheduleBackup('lists'); },   // quiet: the check's own bookkeeping
  add(id, dir, at) {
    const p = CAT.byId.get(id); if (!p || !(at > 0)) return null;
    const a = { key: 'a' + Date.now(), id, num: p.num, name: p.name, treat: p.treat, dir, at, armed: true,
                created: new Date().toISOString(), catalogueAt: CAT.man.source_updated_at || null };
    this.list.push(a); this.save(); return a;
  },
  remove(key) { this.list = this.list.filter(a => a.key !== key); this.save(); },
  rearm(key) { const a = this.list.find(x => x.key === key); if (a) { a.armed = true; a.fired = null; this.save(); } },
  /* -> the alerts that crossed on this catalogue. Idempotent per catalogue
     date: the same nightly build can never fire the same alert twice. */
  async check() {
    const stamp = CAT.man.source_updated_at || 'none';
    const fired = [];
    for (const a of this.list) {
      if (!a.armed || a.checkedAt === stamp) continue;
      a.checkedAt = stamp;
      const p = CAT.byId.get(a.id); if (!p || p.market == null) continue;
      const hit = a.dir === 'below' ? p.market <= a.at : p.market >= a.at;
      if (!hit) continue;
      a.armed = false; a.fired = { at: new Date().toISOString(), price: p.market, catalogue: stamp };
      fired.push(a);
      await PLATFORM.notify(Math.abs(hashStr(a.key)) % 2147483647,
        `${a.name} ${a.dir === 'below' ? 'dropped to' : 'rose to'} ${money(p.market)}`,
        `${a.num}${a.treat !== 'base' ? ' (' + (TREAT[a.treat] || a.treat) + ')' : ''} \u2014 you asked for ${a.dir} ${money(a.at)}. Prices of ${dayText(stamp)}.`);
    }
    this.save(true); return fired;
  }
};
function hashStr(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
function paintAlerts() {
  const el = $('#alRows'); if (!el) return;
  el.innerHTML = ALERTS.list.length ? ALERTS.list.slice().reverse().map(a => {
    const p = CAT.byId.get(a.id); const now = p ? p.market : null;
    return `<div class="dkrow">
      <div class="n"><b>${esc(a.name)}${a.treat !== 'base' ? ` <span class="badge">${esc(TREAT[a.treat] || a.treat)}</span>` : ''}</b>
        <span style="white-space:normal">${dotJoin(esc(a.num), `${a.dir} ${money(a.at)}`, `now ${now != null ? money(now) : '?'}`)}${
          a.fired ? ` \u00b7 <span class="up">fired ${esc(dayText(localDay(a.fired.at) || a.fired.at))} at ${money(a.fired.price)}</span>` : a.armed ? ' \u00b7 watching' : ''}</span></div>
      <div class="cnt">${a.fired ? `<button data-alrearm="${a.key}" aria-label="Watch again">${G('refresh', 18)}</button>` : ''}<button data-alrm="${a.key}" aria-label="Remove the alert">${G('trash', 18)}</button></div>
    </div>`; }).join('') : emptyHtml('bell', 'No alerts yet', 'Open a card and tap <b>Alert me</b>.');
}
document.addEventListener('click', e => {
  const r = e.target.closest('[data-alrm]'); if (r) { ALERTS.remove(r.dataset.alrm); paintAlerts(); return; }
  const a = e.target.closest('[data-alrearm]'); if (a) { ALERTS.rearm(a.dataset.alrearm); paintAlerts(); return; }
});

