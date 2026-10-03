/* smoke section 38: take 49 — costs before actions; Events at their two timings
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { has } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 49 — costs before actions; Events at their two timings');
const FX = scripted(V.CAT.effects); const fxIds = Object.keys(FX); const S = V.SIM;
const find = (rx, t) => fxIds.map(k => [k, FX[k].find(e => rx.test(e.raw) && (!t || e.t === t))]).find(x => x[1]);
const trashCost = find(/^\[On Play\] You may trash 1 card from your hand: K\.O\. up to 1 of your opponent's Characters with a cost of (\d+) or less\.$/);
const donCost = fxIds.map(k => [k, FX[k].find(e => e.do[0].a === 'cost_returndon' && e.do.length === 2 && ['onplay', 'main', 'attack'].includes(e.t) && ['draw', 'ko', 'rest', 'selfpower'].includes(e.do[1].a) && V.CAT.byId.get(+k).type === 'Character')]).find(x => x[1]);
const restCost = fxIds.map(k => [k, FX[k].find(e => e.do[0].a === 'cost_restself' && e.if.length === 0 && ['onplay', 'main'].includes(e.t) && V.CAT.byId.get(+k).type === 'Character')]).find(x => x[1]);
const evMain = find(/^\[Main\] Draw 1 card\.$/, 'evmain') || find(/^\[Main\] /, 'evmain');
const evCounter = find(/^\[Counter\] Up to 1 of your Leader or Character cards gains \+(\d+) power during this battle\.$/, 'evcounter');
const pfh = fxIds.map(k => [k, FX[k].find(e => e.t === 'onplay' && e.do[0].a === 'playfromhand')]).find(x => x[1]);
ok('real cards exist for each: a trash cost, a DON!! cost, a rest-self cost, a [Main] Event, a [Counter] +power Event, play-from-hand', !!(trashCost && donCost && restCost && evMain && evCounter && pfh), [trashCost, donCost, restCost, evMain, evCounter, pfh].map(x => !!x).join());
const PL6 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL6(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const g = S.new(mk(), mk(), 0, { seed: 49 }); S.mulligan(0, false); S.mulligan(1, false); S.endTurn(); S.endTurn();
const P0 = g.players[0], P1 = g.players[1];
/* a trash cost: step one is the cost with hand targets; skipping it is declining */
P0.chars = [onField(+trashCost[0], 3)]; const kmax = +trashCost[1].do[1].cost;
P1.chars = [onField(V.CAT.rows.find(p => p.type === 'Character' && S.cost(p) <= kmax).id, 1)];
let o = S.offers(0, 'onplay', 0)[0]; const h0 = P0.hand.length, t0 = P0.trash.length;
ok('the cost is the first step and its targets are the hand', o && o.steps[0].a === 'cost_trashhand' && o.targets.length === h0);
let r = S.apply(0, o, o.targets[0].ref);
ok('paying it trashes the card and the effect proceeds to its action with the opponent as targets', r.ok && !r.done && P0.hand.length === h0 - 1 && P0.trash.length === t0 + 1 && o.targets[0].ref === 'o0');
r = S.apply(0, o, 'o0');
ok('...and the K.O. lands', r.ok && r.done && P1.chars.length === 0);
P0.hand = [];
ok('with an empty hand the trash-cost effect is not offered at all (the cost cannot be paid)', S.offers(0, 'onplay', 0).length === 0);
/* a DON!! cost returns DON!! to the DON!! deck from the field, active first */
P0.chars = [onField(+donCost[0], 3)]; const dn = donCost[1].do[0].n; P0.don.active = 8; P0.don.rested = 2; P0.donDeck = 0; P1.chars = [onField(V.CAT.rows.find(p => p.type === 'Character' && p.num && S.cost(p) <= 1).id, 1, true)];
o = S.offers(0, donCost[1].t, 0)[0]; r = S.apply(0, o, null);
ok(`DON!! \u2212${dn} returns that many DON!! to the DON!! deck, rested first (take 122: the player picks, §8-3-1-6; rested ones cost nothing this turn), then the action waits for its target`, r.ok && !r.done && P0.don.rested === Math.max(0, 2 - dn) && P0.don.active === 8 - Math.max(0, dn - 2) && P0.donDeck === dn && o.targets.length === 1);
P0.don.active = 0; P0.don.rested = 0; P0.leader.don = 0; P0.chars[0].don = 0; P0.used = {};
ok('with no DON!! on the field it is not offered', S.offers(0, donCost[1].t, 0).length === 0);
/* a rest-self cost rests the source; a rested source cannot pay */
P0.chars = [onField(+restCost[0], 3)]; P0.used = {}; P1.chars = [onField(V.CAT.rows.find(p => p.type === 'Character' && p.num && S.cost(p) <= 1).id, 1, true)];
o = S.offers(0, restCost[1].t, 0)[0];
ok('"You may rest this Character:" is offered while the Character is active', !!o && o.steps[0].a === 'cost_restself');
r = S.apply(0, o, null);
ok('paying rests it', r.ok && P0.chars[0].rested);
P0.used = {};
ok('...and rested, it is not offered (negative control)', S.offers(0, restCost[1].t, 0).length === 0);
/* Events: a [Main] Event offers its effect on play; a [Counter] Event is playable in the counter step for its cost */
P0.hand = [+evMain[0]]; P0.don.active = 10;
r = S.play(0, 0);
ok('a [Main] Event is played for its cost and goes to the trash; its effect is then offered at the evmain timing', r.ok && P0.trash.includes(+evMain[0]) && S.offers(0, 'evmain', null, +evMain[0]).length === 1);
P1.hand = [+evCounter[0]]; P1.don.active = 10; P1.chars = []; P0.chars = [onField(V.CAT.rows.find(p => p.type === 'Character' && p.num).id, 1)];
P0.modl = []; S.attack(0, 'leader', 'leader'); S.noBlock();
const ce = S.counterEvents();
ok('in the counter step the defender is offered the [Counter] Event they can afford', ce.length === 1 && ce[0].h === 0);
const d0 = S.power(1, 'leader'); r = S.playCounterEvent(0);
const off = S.offers(1, 'evcounter', null, +evCounter[0]);
ok('playing it pays the cost, trashes it, and offers the +power with the defender\'s own cards as targets', r.ok && P1.trash.includes(+evCounter[0]) && off.length === 1 && off[0].targets[0].ref === 'L');
S.apply(1, off[0], 'L');
ok('...applied to the Leader, the battle power rises by the stated amount', S.battlePowers().d === d0 + evCounter[1].do[0].n);
S.resolve();
/* play from hand: only Characters under the cost line; free */
P0.chars = [onField(+pfh[0], 5)]; const lim = pfh[1].do[0];
const ty = lim.type; const has = p => !ty || (p.subtypes || '').split(/[;/]/).map(y => y.trim()).includes(ty);
const under = p => (lim.cost == null || S.cost(p) <= lim.cost) && (lim.power == null || (parseInt(p.power, 10) || 0) <= lim.power);
const okc = V.CAT.rows.find(p => p.type === 'Character' && p.num && under(p) && has(p)), big = V.CAT.rows.find(p => p.type === 'Character' && p.num && !under(p) && has(p)), evt = V.CAT.rows.find(p => p.type === 'Event' && p.num);
P0.hand = [big.id, okc.id, evt.id]; P0.don.active = 0;
o = S.offers(0, 'onplay', 0)[0];
ok('play-from-hand offers only Characters under the cost line, never Events (class 3)', o && o.targets.length === 1 && o.targets[0].ref === 'h1');
r = S.apply(0, o, 'h1');
ok('...and plays it without paying', r.ok && P0.chars.length === 2 && P0.chars[1].id === okc.id && P0.don.active === 0);
S.g = null;
}
}
