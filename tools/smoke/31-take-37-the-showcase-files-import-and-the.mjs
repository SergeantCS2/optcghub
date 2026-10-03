/* smoke section 31: take 37 — the showcase files import and the deck is legal
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { c } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 37 — the showcase files import and the deck is legal');
const csvText = fs.readFileSync(path.join(ROOT, 'showcase', 'collection.csv'), 'utf8');
const csvRows = csvText.split(/\r?\n/).filter(Boolean).slice(1).map(l => l.split('","').map(c => c.replace(/^"|"$/g, '')));
ok('every collection row names a productId the app knows (landmine 1)', csvRows.length >= 40 && csvRows.every(r => V.CAT.byId.has(+r[1])), String(csvRows.filter(r => !V.CAT.byId.has(+r[1])).length));
V.OWN.items = [];
for (const r of csvRows) V.OWN.add(+r[1], { qty: +r[9], condition: r[8] });
ok('imported, it is a five-figure collection at today\'s market', V.OWN.total() > 5000, V.OWN.total().toFixed(2));
ok('the set run has gaps for the binder and checklist to show', !csvRows.some(r => r[2] === 'OP01-009') && csvRows.some(r => r[2] === 'OP01-010'));
const PL2 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const d37 = V.DECKS.blank();
for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) {
  const line = raw.trim(); if (!line || line.startsWith('#')) continue;
  const m = PL2(line); const num = m[2].toUpperCase();
  const sibs = (V.CAT.byNum.get(num) || []).filter(p => p.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9));
  const p = sibs[0]; if (p.type === 'Leader') { d37.leader = p.id; continue; }
  d37.cards.push({ id: p.id, n: +m[1] });
}
const L37 = V.legality(d37);
ok('the showcase deck is LEGAL by the app\'s own §5-1 check', L37.problems.length === 0, L37.problems.join(' | '));
ok('...and it is fifty cards, four per number, one Leader', d37.cards.reduce((a, c) => a + c.n, 0) === 50 && d37.cards.every(c => c.n <= 4) && !!d37.leader);
V.OWN.items = [];
}
}
