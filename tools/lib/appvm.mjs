/* The shipped app in a DOM stub (take 122: lifted out of smoke.mjs, unchanged, so the card proofs and
 * self-play run the same bytes the APK ships, the same way smoke does -- APEX landmine 39).
 *
 * boot() loads www/index.html and www/app.js into a fresh context and returns the app's
 * window.VAULT with the context around it. Each call is a separate app: self-play's two-app
 * mode boots two and lets only moves pass between them.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const ROOT = path.dirname(path.dirname(path.dirname(new URL(import.meta.url).pathname)));
export const W = p => path.join(ROOT, 'www', p);

/* ---- a DOM small enough to read, real enough to run the app ------------- */
export function makeDom(html) {
  const listeners = {};
  const mk = (tag = 'div') => {
    const el = {
      tagName: tag.toUpperCase(), children: [], style: {}, dataset: {},
      _cls: new Set(), _text: '', _html: '', value: '',
      classList: {
        add: (...c) => c.forEach(x => el._cls.add(x)),
        remove: (...c) => c.forEach(x => el._cls.delete(x)),
        toggle: (c, on) => on ? el._cls.add(c) : el._cls.delete(c),
        contains: c => el._cls.has(c)
      },
      get className() { return [...el._cls].join(' '); },
      set className(v) { el._cls = new Set(String(v).split(/\s+/).filter(Boolean)); },
      get textContent() { return el._text; }, set textContent(v) { el._text = String(v); },
      get innerHTML() { return el._html; }, set innerHTML(v) { el._html = String(v); },
      appendChild: c => { el.children.push(c); return c; },
      addEventListener: (t, f) => { (el._ev ||= {})[t] = f; },
      removeEventListener: () => {},
      setAttribute: (k, v) => { el.dataset['attr_' + k] = String(v); }, getAttribute: k => el.dataset['attr_' + k] ?? null,
      querySelector: () => null, querySelectorAll: () => [],
      closest: () => null, click: () => {}, focus: () => {}, select: () => {}, remove: () => {},
      getContext: () => ctx2d, clientWidth: 360, width: 0, height: 0
    };
    return el;
  };
  const ctx2d = new Proxy({}, { get: () => () => ctx2d });
  const byId = new Map();
  /* the element keeps its tag, so a <section id> is a section here too (take 83: go() refuses non-screens) */
  for (const m of html.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*\bid="([\w-]+)"/g)) byId.set(m[2], mk(m[1]));
  const doc = {
    _ids: byId,
    querySelector: s => s.startsWith('#') ? (byId.get(s.slice(1)) || mk()) : mk(),
    getElementById: id => byId.get(id) || null,
    querySelectorAll: () => [],
    createElement: mk,
    addEventListener: (t, f) => { (listeners[t] ||= []).push(f); },
    removeEventListener: () => {},   // take 111: the ask sheet's cleanup calls it; a browser always has it
    body: mk('body')
  };
  doc.body.appendChild = c => { if (c && c.id) byId.set(c.id, c); return c; };
  return { doc, listeners };
}

/* One app: the built page and script, a store, a network that answers only the two boot reads
   (a section may answer others through ctx._net), and the app's own VAULT once it has booted. */
export async function boot({ quiet = false, app = null } = {}) {
  /* `app`: another build's directory (its app.js and bundle/catalog.json) -- how a new check is watched failing on the
     previous take; the page and manifest are this build's, which only name elements and counts */
  const from = (p, fallback) => app && fs.existsSync(path.join(app, p)) ? path.join(app, p) : fallback;
  const html = fs.readFileSync(W('index.html'), 'utf8');
  const js = fs.readFileSync(from('app.js', W('app.js')), 'utf8');
  const catalog = JSON.parse(fs.readFileSync(from('bundle/catalog.json', from('catalog.json', W('bundle/catalog.json'))), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(W('bundle/manifest.json'), 'utf8'));
  const store = {};
  const remote = [];
  const ctx = {
    console: quiet ? { log() {}, warn() {}, error() {}, info() {} } : console,
    localStorage: {
      getItem: k => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    },
    navigator: { vibrate: () => true },
    location: { href: 'https://localhost/' },
    URL, Blob: class { constructor(p) { this.p = p; } },
    BigInt, Math, Date, JSON, Promise, setTimeout, clearTimeout, devicePixelRatio: 2,
    AbortController,   // take 115: a browser has it; the fetch wrapper aborts at its deadline with it
    fetch: async (u, o) => {
      if (ctx._net) { const r = await ctx._net(String(u), o); if (r !== undefined) return r; }   // take 115: a section answers "Pages" itself; undefined falls through
      remote.push(String(u));
      if (String(u).includes('catalog.json')) return { json: async () => catalog };
      if (String(u).includes('manifest.json')) return { json: async () => manifest };
      throw new Error('unexpected fetch ' + u);
    }
  };
  const { doc, listeners } = makeDom(html);
  ctx.document = doc;
  ctx._win = {}; ctx.addEventListener = (t, f) => { (ctx._win[t] ||= []).push(f); }; ctx.removeEventListener = () => {};
  ctx.history = { _s: [], pushState(st, _t, url) { this._s.push({ st, url }); }, back() { this._s.pop(); (ctx._win.popstate || []).forEach(f => f({})); } };
  ctx.window = ctx;
  ctx.scrollTo = () => {};   // take 105: the boot itself navigates now (landmine 140) and go() scrolls; a browser always has this
  vm.createContext(ctx);
  vm.runInContext(js, ctx, { filename: 'www/app.js' });
  await new Promise(r => setTimeout(r, 60));
  return { ctx, V: ctx.VAULT, html, js, catalog, manifest, store, remote, doc, listeners };
}
