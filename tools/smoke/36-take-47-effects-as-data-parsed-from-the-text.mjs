/* smoke section 36: take 47 — effects as data: parsed from the text, offered under conditions, applied under invariants
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { dear, before } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 47 — effects as data: parsed from the text, offered under conditions, applied under invariants');
const FXALL = V.CAT.effects; const FX = scripted(FXALL); const fxIds = Object.keys(FX);
ok('the bundle carries scripted effects and the manifest counts them', fxIds.length >= 400 && manifest.effects && manifest.effects.scripted === fxIds.reduce((a, k) => a + FX[k].length, 0) && manifest.effects.hand === Object.values(FXALL).reduce((a, L) => a + L.filter(e => e.hand).length, 0), JSON.stringify(manifest.effects));   // take 122: by-hand lines ride beside the scripted ones, counted apart
ok('coverage is stated, not promised: the manifest counts every line, and most still stay manual', manifest.effects.scripted < manifest.effects.lines * 0.5 && manifest.effects.lines > 7000, `${manifest.effects.scripted}/${manifest.effects.lines}`);
const find = (rx, t) => fxIds.map(k => [k, FX[k].find(e => rx.test(e.raw) && (!t || e.t === t))]).find(x => x[1]);
const restCard = find(/^\[On Play\] Rest up to 1 of your opponent's Characters with a cost of (\d) or less\.$/);
const drawCard = find(/^\[On Play\] Draw 1 card\.$/);
const donxCard = find(/^\[DON!! x1\] \[When Attacking\] This (Leader|Character) gains \+(\d+) power during this turn\.$/, 'attack');
const optCard = find(/^\[Activate: Main\] \[Once Per Turn\]/, 'main');
ok('the templates found real cards for rest-with-cost, draw, DON!!x1 attack, and a once-per-turn Main', !!(restCard && drawCard && donxCard && optCard));
const S = V.SIM; const PL4 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL4(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const g = S.new(mk(), mk(), 0, { seed: 47 }); S.mulligan(0, false); S.mulligan(1, false); S.endTurn(); S.endTurn();   // turn 3, player 0, no first-turn ban
const P0 = g.players[0], P1 = g.players[1];
/* plant the rest-with-cost card in play and two opponent characters either side of its cost line */
const rmax = +restCard[1].do[0].cost; const cheap = V.CAT.rows.find(p => p.type === 'Character' && S.cost(p) <= rmax), dear = V.CAT.rows.find(p => p.type === 'Character' && S.cost(p) > rmax);
P0.chars = [onField(+restCard[0], 3)]; P1.chars = [onField(cheap.id, 1), onField(dear.id, 1)];
let offers = S.offers(0, 'onplay', 0);
ok('an [On Play] rest effect is offered with ONLY the targets its cost line allows (class 3: scope)', offers.length === 1 && offers[0].targets.length === 1 && offers[0].targets[0].ref === 'o0', JSON.stringify(offers.map(o => o.targets)));
ok('negative control: applying it to the over-cost Character is refused', S.apply(0, offers[0], 'o1').ok === false);
ok('applied to the legal one, that Character is rested and the act is logged', S.apply(0, offers[0], 'o0').ok && P1.chars[0].rested && /rest/.test(g.log[0]));
/* DON!! x1: absent -> not offered; attached -> offered; +power this turn, gone at refresh (class 2: not always on) */
P0.chars = [onField(+donxCard[0], 1)];
ok('a [DON!! x1] attack effect is NOT offered with no DON!! attached (class 2: never always-on)', S.offers(0, 'attack', 0).length === 0);
P0.chars[0].don = 1; const before = S.power(0, 0); const o2 = S.offers(0, 'attack', 0);
ok('...and IS offered with one attached; applied, the power rises by the stated amount', o2.length === 1 && S.apply(0, o2[0]).ok && S.power(0, 0) === before + donxCard[1].do[0].n);
S.endTurn(); S.endTurn();
ok('"during this turn" expires at the next refresh, and the given DON!! went home too (class 5: duration; §6-2)', S.power(0, 0) === parseInt(V.CAT.byId.get(+donxCard[0]).power, 10) && P0.chars[0].don === 0, `${S.power(0, 0)} vs base`);
/* draw: the hand grows by one; Once Per Turn: the second activation is refused */
P0.chars = [onField(+drawCard[0], 5)]; const h0 = P0.hand.length; S.apply(0, S.offers(0, 'onplay', 0)[0]);
ok('[On Play] Draw 1 card draws exactly one', P0.hand.length === h0 + 1);
P0.chars = [onField(+optCard[0], 5)]; P0.don.rested = 2;
const m1 = S.offers(0, 'main', 0); const tgt = m1[0] && m1[0].targets ? m1[0].targets[0].ref : null; const r1 = m1.length ? S.apply(0, m1[0], tgt) : { ok: false };
ok('[Activate: Main] [Once Per Turn] applies once...', r1.ok === true, JSON.stringify(m1.map(o => o.e.raw)));
ok('...and is not offered again this turn (class 4: a limit, checked)', S.offers(0, 'main', 0).length === 0);
S.endTurn(); S.endTurn();
ok('...but is offered again next turn', S.offers(0, 'main', 0).length === 1);
S.g = null;
}
}
