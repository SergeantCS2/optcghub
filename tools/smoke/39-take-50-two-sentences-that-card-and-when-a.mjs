/* smoke section 39: take 50 — two sentences, "that card", and when a modifier ends
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 50 — two sentences, "that card", and when a modifier ends');
const FX = scripted(V.CAT.effects); const fxIds = Object.keys(FX); const S = V.SIM;
const find = (rx, t) => fxIds.map(k => [k, FX[k].find(e => rx.test(e.raw) && (!t || e.t === t))]).find(x => x[1]);
const two = fxIds.map(k => [k, FX[k].find(e => e.do.length >= 2 && !/^cost_/.test(e.do[0].a) && /\. Then, |\. [A-Z]/.test(e.raw.replace(/^(\[[^\]]+\]\s*)+/, '')))]).find(x => x[1]);
const that = fxIds.map(k => [k, FX[k].find(e => e.do.some(st => st.a === 'power' && st.who === 'prev') && e.do[0].a === 'power' && e.do[0].who === 'own')]).find(x => x[1]);
ok('real cards: a two-sentence chain and a "that card gains an additional" chain (no card in the catalogue carries a bare until-your-next-turn sentence; the parser control covers that phrase)', !!(two && that), [two, that].map(x => !!x).join());
ok('a two-sentence effect is its two templates in order', two[1].do.length >= 2);
const PL7 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL7(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const g = S.new(mk(), mk(), 0, { seed: 50 }); S.mulligan(0, false); S.mulligan(1, false); S.endTurn(); S.endTurn();
const P0 = g.players[0], P1 = g.players[1];
/* "that card": the second step lands on the card the first step chose, and its own condition is read at that step */
P0.chars = [onField(+that[0], 3)]; P0.life = P0.life.slice(0, 5);
let o = S.offers(0, that[1].t, 0)[0]; const stepIf = that[1].do.find(st => st.who === 'prev').if || [];
const lp = S.power(0, 'leader'); let r = S.apply(0, o, 'L');
ok('step one puts +N on the chosen card (the Leader here)', r.ok && !r.done && S.power(0, 'leader') === lp + that[1].do[0].n);
const met = stepIf.every(c => S.condOk(0, P0.chars[0], c)); const lp2 = S.power(0, 'leader'); r = S.apply(0, o, null);
ok('step two targets "that card" with no new choice, and applies only if its own condition holds NOW', r.ok && r.done && S.power(0, 'leader') === lp2 + (met ? that[1].do[1].n : 0), `condition met: ${met}`);
/* durations: "during this turn" on the opponent's card ends at the END of this turn, not at their refresh */
P1.chars = [onField(V.CAT.rows.find(p => p.type === 'Character' && p.num).id, 1)];
const base1 = S.power(1, 0); S.mod(1, 'u' + P1.chars[0].uid, -2000, 'turn');
ok('a -power "during this turn" on the opponent\'s card is live now', S.power(1, 0) === base1 - 2000);
S.endTurn();
ok('...and gone at the end of the turn, before the opponent even refreshes (the take-50 fix)', S.power(1, 0) === base1);
/* "until the start of your next turn" persists through the opponent\'s turn and clears at the source\'s refresh */
S.endTurn();   // back to player 0
P0.chars = [onField(V.CAT.rows.find(p => p.type === 'Character' && p.num).id, 5)]; const b0 = S.power(0, 0);
S.mod(0, 'u' + P0.chars[0].uid, 3000, 'nextturn');
ok('an until-your-next-turn bonus is live', S.power(0, 0) === b0 + 3000);
S.endTurn();
ok('...still live during the opponent\'s turn', S.power(0, 0) === b0 + 3000);
S.endTurn();
ok('...and gone at the source\'s own refresh', S.power(0, 0) === b0);
S.g = null;
}
}
