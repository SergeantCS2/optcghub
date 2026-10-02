/* smoke section 68: take 110 — bulk delete keeps to the collection on screen (AGENTS rule 5; the UI audit\'s finding in passing)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 110 — bulk delete keeps to the collection on screen (AGENTS rule 5; the UI audit\'s finding in passing)');
{ const bl = V.bulkLines || (() => []), bs = V.bulkSum || (() => ({ n: -1, v: -1 })), PF = V.PF, keepItems = V.OWN.items, keepActive = PF.active, keepList = PF.list.slice();
  const keepF = JSON.parse(JSON.stringify(V.FILT.own)), cq = ctx.document.querySelector('#colq'), search = q => cq._ev.input({ target: { value: q } });
  Object.assign(V.FILT.own, V.blankFilter('own')); search('');
  const x = V.CAT.rows.find(p => !p.sealed && p.market > 1);
  if (!PF.list.some(p => p.id === 'tr110')) PF.list.push({ id: 'tr110', name: 'Trade pile' });
  /* the trade pile's line first: the bar valued a printing at the first line it found, in any collection */
  V.OWN.items = [{ id: x.id, qty: 4, condition: 'NM', pf: 'tr110' }, { id: x.id, qty: 2, condition: 'NM', pf: 'main' }, { id: x.id, qty: 1, condition: 'LP', pf: 'main' }];
  const sel = new Set([x.id]);
  PF.active = 'tr110'; const inTrade = bl(sel);
  PF.active = 'main'; const inMain = bl(sel);
  PF.active = 'all'; const inAll = bl(sel);
  ok('selected in one collection, bulk delete takes that collection\'s lines only -- it had taken the printing from every collection and condition', inTrade.length === 1 && inTrade[0].pf === 'tr110' && inMain.length === 2 && inMain.every(i => i.pf === 'main') && inAll.length === 3, `${inTrade.length} / ${inMain.length} / ${inAll.length}`);
  ok('...control: the take-109 filter, every line of the printing, is caught', V.OWN.items.filter(i => sel.has(i.id)).length === 3 && inTrade.length !== 3);
  ok('...and its confirm values the lines with their quantities (it counted one of each printing)', /a \+ \(price\(i\.id\) \|\| 0\) \* \(i\.qty \|\| 1\)/.test(js) && !/\[\.\.\.bulk\]\.reduce\(\(a, id\) => a \+ \(price\(id\) \|\| 0\), 0\)/.test(js));
  /* take 110's review: on screen is the filter and the search too -- the selection is by printing, and a line
     the filter hid went with the tile that was tapped */
  PF.active = 'main'; V.FILT.own.cond = ['NM']; const nmOnly = bl(sel), barNm = bs(sel); V.FILT.own.cond = [];
  ok('...and a line the filter hides is not taken: Near Mint filtered in, the Lightly Played copy of the same printing stays', nmOnly.length === 1 && nmOnly[0].condition === 'NM' && nmOnly[0].pf === 'main', nmOnly.map(i => i.condition).join());
  ok('...control: the first push\'s rule, the collection alone, took it', V.OWN.items.filter(i => sel.has(i.id) && (i.pf || 'main') === 'main').length === 2);
  search('zzzz no such card'); const bySearch = bl(sel); search('');
  ok('...nor a line the search hides', bySearch.length === 0 && bl(sel).length === 2);
  const px = V.CAT.byId.get(x.id).market, bar = bs(sel);
  const firstPush = [...sel].reduce((a, id) => { const it = V.OWN.items.find(y => y.id === id); return a + (V.CAT.byId.get(id).market || 0) * (it ? it.qty : 0); }, 0);
  ok('the bulk bar counts and values the lines an action would take, as the confirm does', bar.n === 2 && Math.abs(bar.v - 3 * px) < 1e-9 && barNm.n === 1 && Math.abs(barNm.v - 2 * px) < 1e-9, `${bar.n} ${bar.v} vs ${3 * px}`);
  ok('...control: the first push\'s bar, the first line\'s quantity from any collection, is caught', Math.abs(firstPush - 4 * px) < 1e-9 && firstPush !== bar.v);
  ok('...and Move and Condition take the same lines (they had taken hidden ones too)', (js.match(/const lines = new Set\(bulkLines\(bulk\)\); OWN\.items\.forEach\(i => \{ if \(lines\.has\(i\)\)/g) || []).length === 2 && !/PF\.scope\(\[i\]\)\.length/.test(js));
  V.OWN.items = keepItems; PF.active = keepActive; PF.list.length = 0; PF.list.push(...keepList); Object.assign(V.FILT.own, keepF); }
}
