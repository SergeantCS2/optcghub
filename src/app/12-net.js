/* ---- network wrapper: the NET badge is proof, not a promise ------------- */
/* take 115: and no request waits for ever. Nothing set a deadline, so a
   stalled link (a lift, a basement, a tower hand-off) kept Sync and the Hunt
   refresh buttons grey until the WebView gave up, if it did. Every request is
   now aborted at its deadline, body included: a minute by default -- the
   largest Hunt file, stores.json at 1.1 MB, finishes by then at 146 kbit/s --
   and four minutes for the catalogue, asked for with { wait: NET.WAIT_BIG }:
   its 5.1 MB finish at 172 kbit/s, 0.7 MB when compressed in transit at
   24 kbit/s. The race rejects at the deadline even where an abort is not
   honoured, so the caller always gets its answer back. */
const NET = { count: 0, hosts: new Set(), WAIT: 60e3, WAIT_BIG: 240e3 };
const _fetch = window.fetch.bind(window);
window.fetch = (u, o) => {
  try { NET.hosts.add(new URL(u, location.href).host); } catch (e) {}
  NET.count++; paintNet();
  const opt = Object.assign({}, o), wait = opt.wait || NET.WAIT; delete opt.wait;
  let ac = null; try { if (!opt.signal && typeof AbortController === 'function') { ac = new AbortController(); opt.signal = ac.signal; } } catch (e) {}
  const late = new Promise((_, no) => setTimeout(() => {
    const err = new Error(`no answer in ${Math.round(wait / 1000)} s`); err.name = 'TimeoutError';
    if (ac) { try { ac.abort(err); } catch (e) {} }
    no(err);
  }, wait));
  return Promise.race([_fetch(u, opt), late]);
};
function paintNet() {
  const d = $('#netdot'), l = $('#netlbl');
  if (!d) return;
  d.className = 'dot' + (NET.count > CAT.expectedFetches ? ' warn' : '');
  l.textContent = NET.count ? `${NET.count} request${NET.count > 1 ? 's' : ''}` : 'Offline OK';
}

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
/* the opening screen goes once the app has painted -- never before 600 ms, never after 2.5 s.
   take 115: set up here, before the first stored read, with the error buffer below -- both sat
   at the end of the script, so anything that threw while it loaded left the opening screen up
   for good and nothing in Diagnostics. */
const SPLASH_T0 = Date.now();
function splashDone() { const sp = $('#splash'); if (!sp || sp.classList.contains('off')) return; const wait = Math.max(0, 1600 - (Date.now() - SPLASH_T0)); setTimeout(() => { sp.classList.add('off'); setTimeout(() => sp.remove(), 400); }, wait); }
setTimeout(splashDone, 3500);
/* take 91: the buffer outlives a restart -- a blank screen is followed by a
   relaunch, and a record that dies with the page names nothing (A37). */
const ERRS = { KEY: 'vault.errs', list: [],
  load() { try { const l = JSON.parse(localStorage.getItem(this.KEY) || '[]'); return Array.isArray(l) ? l.slice(0, 20) : []; } catch (e) { return []; } },
  push(kind, msg, where) {
    this.list.unshift({ t: new Date().toISOString(), kind, msg: String(msg).slice(0, 200), where: String(where || '').slice(0, 120) }); this.list = this.list.slice(0, 20);
    try { localStorage.setItem(this.KEY, JSON.stringify(this.list)); } catch (e) {} } };
ERRS.list = ERRS.load();
window.addEventListener('error', e => ERRS.push('error', e.message, (e.filename || '') + ':' + (e.lineno || '')));
window.addEventListener('unhandledrejection', e => ERRS.push('rejection', (e.reason && (e.reason.message || e.reason)) || 'unknown'));
