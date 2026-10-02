/* smoke section 92: take 133 — one click dispatcher (A44 item 3): the document-level delegates as rows of one table, in the present order; the mechanics on a scratch table, the real table pinned, one bubbling listener at boot
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 133 — one click dispatcher (A44 item 3): the document-level delegates as rows of one table, in the present order; the mechanics on a scratch table, the real table pinned, one bubbling listener at boot');
{
  const C = V.CLICKS;
  ok('the dispatcher exists, with a table, on() and fire()', !!C && Array.isArray(C.table) && typeof C.on === 'function' && typeof C.fire === 'function');
  const ROWS = ['[data-deck]', '[data-stock]', '[data-dkadd],[data-dkinc],[data-dkdec]', '[data-lpc],[data-lp]', '.dkrow .n', '[data-pp]',
    '[data-tradd],[data-trinc],[data-trdec]', '#themeSeg [data-theme]', '[data-pl],#plFirst,#plHot,#plCurtain,#plNext,#plReset,[data-plleader]',
    '[data-cdkw],[data-cdcol],[data-cdcost],[data-cdadd],#cdForDeck', '[data-bnset],#bnPrev,#bnNext', '[data-alrm],[data-alrearm]',
    '[data-checklist],[data-ckmode],[data-ck],#ckWantAll,[data-want]', '[data-go],[data-rules],[data-back],[data-close]', '[data-pf]', '[data-pfname]', '[data-r]',
    '[data-pfmove]', '[data-bulkcond]', '#colClearF', '[data-open]', '[data-act]', '[data-distfold],[data-disthist]', '[data-browse-set]',
    '[data-setpick]', '#earnBtn', '[data-pick]', '[data-cond]', '#diagRun,#devEarn,#diagCopy,#diagShare'];
  const have = C ? C.table.map(r => r.sel.join(',')) : [];
  ok('29 rows: the former listeners\' selectors, in the files\' order -- the registration order the separate listeners had', have.length === 29 && have.every((s, i) => s === ROWS[i]), JSON.stringify(have));
  ok('every row\'s handler is a function and every selector a non-empty string', !!C && C.table.every(r => typeof r.fn === 'function' && r.sel.length > 0 && r.sel.every(s => typeof s === 'string' && s.length > 0)));
  /* the mechanics, on a scratch table in the real dispatcher's place */
  if (C) {
    const saved = C.table, calls = [];
    C.table = [];
    C.on('[data-a]', (e, m) => calls.push('a1:' + m.tag));
    C.on('[data-b], [data-c]', (e, m) => calls.push('bc:' + m.tag));
    C.on('[data-a]', () => { throw new Error('planted'); });
    C.on('#only', () => calls.push('id'));
    C.on('[data-a]', () => calls.push('a2'));
    const target = (answers, id = '') => ({ id, closest: s => answers[s] || null });
    const fake = t => { try { return { n: C.fire({ target: t }), threw: null }; } catch (err) { return { n: null, threw: err.message }; } };
    const n0 = C.n;
    const r1 = fake(target({ '[data-a]': { tag: 'A' }, '[data-c]': { tag: 'C' } }));
    ok('a target matching two rows runs every matching row in table order, each with its own matched element, and a row it does not match is skipped', calls.join(' ') === 'a1:A bc:C a2', JSON.stringify({ calls, r1 }));
    ok('...a throw in the middle did not stop the rows after it, and is rethrown after the walk (window.onerror sees it, as before)', calls.includes('a2') && r1.threw === 'planted' && r1.n === null, JSON.stringify(r1));
    ok('...the click is counted and the rows that ran are named', C.n === n0 + 1 && C.last.join(' ') === '[data-a] [data-b],[data-c] [data-a] [data-a]', JSON.stringify(C.last));
    calls.length = 0;
    const r2 = fake(target({}));
    ok('a target matching no row runs nothing and returns 0', r2.n === 0 && calls.length === 0 && r2.threw === null, JSON.stringify(r2));
    const r3 = fake({ id: 'only' });
    ok('a target with no closest answers a #id row by its id alone (a test\'s fake), nothing else', r3.n === 1 && calls.join('') === 'id' && r3.threw === null, JSON.stringify({ r3, calls }));
    calls.length = 0;
    const r4 = fake(target({}, 'only'));
    ok('...and one whose closest answers nothing still answers a #id row by its id, as the listener that tested e.target.id did (the binder\'s page turns)', r4.n === 1 && calls.join('') === 'id', JSON.stringify({ r4, calls }));
    const r5 = fake(null);
    ok('no target at all: nothing runs, nothing throws', r5.n === 0 && r5.threw === null, JSON.stringify(r5));
    let bad = null; try { C.on('', () => {}); } catch (e) { bad = e.message; }
    ok('a row with no selector is refused at registration', /selector/.test(bad || ''), String(bad));
    C.table = saved;
  }
  /* one bubbling listener: a fresh app registers the dispatcher and the scrim rule (capture-phase; the stub keeps no phase) and nothing else */
  const F = await boot({ quiet: true });
  ok('a fresh boot registers two document click listeners -- the dispatcher and the scrim rule -- where take 132 registered 30', (F.listeners.click || []).length === 2, String((F.listeners.click || []).length));
  ok('the dispatcher is exported, with the count of the clicks it answered and the rows of the last one', !!C && typeof C.n === 'number' && Array.isArray(C.last));
}
}
