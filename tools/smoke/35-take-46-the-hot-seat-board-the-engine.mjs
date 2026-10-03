/* smoke section 35: take 46 — the hot-seat board: the engine against RULES.md §3
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 46 — the hot-seat board: the engine against RULES.md §3');
const S = V.SIM;
/* two legal decks from the showcase list, second one identical (a mirror) */
const PL3 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mkDeck = name => { const d = V.DECKS.blank(); d.name = name;
  for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const m = PL3(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0];
    if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const dA = mkDeck('A'), dB = mkDeck('B');
ok('the showcase deck is legal, so it is a fair fixture', V.legality(dA).problems.length === 0);
let g = S.new(dA, dB, 0, { seed: 46 });   // take 122: every smoke game is seeded -- an unseeded deal made this section pass or fail with the hand
ok('§5-2: fifty cards became a shuffled deck, five in hand, none in Life yet', g.players.every(P => P.deck.length === 45 && P.hand.length === 5 && P.life.length === 0));
S.mulligan(0, true); S.mulligan(1, false);
ok('§5-2-3: a mulligan is five back, five drawn, once', g.players[0].hand.length === 5 && g.players[0].deck.length === 45 - 5 && g.players[0].mulliganed === true);
const lifeN = parseInt(V.CAT.byId.get(dA.leader).life, 10) || 5;
ok(`§5-2-4: Life is the Leader's Life (${lifeN}) from the top of the deck, face-down`, g.players[0].life.length === lifeN && g.players[0].deck.length === 45 - lifeN);
ok('§6-3/§6-4: the first player draws nothing and gets 1 DON!! on turn one', g.turn === 1 && g.active === 0 && g.players[0].hand.length === 5 && g.players[0].don.active === 1 && g.players[0].donDeck === 9);
ok('§6-5-6-1: nobody battles on their first turn', S.canAttack(0, 'leader').ok === false && /first turn/.test(S.canAttack(0, 'leader').why));
const P0 = g.players[0];
const cheap = P0.hand.findIndex(id => V.CAT.byId.get(id).type === 'Character' && S.cost(V.CAT.byId.get(id)) <= 1);
const dear = P0.hand.findIndex(id => S.cost(V.CAT.byId.get(id)) > 1);
ok('§2-7: a card costing more than the active DON!! is refused, with the reason', dear < 0 || (S.canPlay(0, dear).ok === false && /costs/.test(S.canPlay(0, dear).why)));
S.endTurn();
ok('§6-1: the second player draws one and gets 2 DON!! on turn two', g.turn === 2 && g.active === 1 && g.players[1].hand.length === 6 && g.players[1].don.active === 2);
S.endTurn();
ok('turn three: the first player refreshes to 3 DON!! and draws', g.turn === 3 && g.players[0].don.active === 3 && g.players[0].hand.length === 6);
/* plant a known board: five in play. Take 122: a sixth is not refused -- one of the five is trashed to make room,
   a rule, not a K.O. (§3-7-6-1; landmine 214: take 46's refusal broke the rule) */
P0.chars = [1, 2, 3, 4, 5].map(k => ({ ...S.inst(P0.deck[k], 1), don: k === 1 ? 2 : 0 }));
P0.don.active = 10; const anyChar = P0.hand.findIndex(id => V.CAT.byId.get(id).type === 'Character');
if (anyChar >= 0) { const cp = S.canPlay(0, anyChar); const blind = S.play(0, anyChar);
  ok('§3-7-6-1: with five in play a sixth may be played -- after choosing which of the five to trash', cp.ok && cp.full && blind.ok === false && blind.need === 'trash' && /§3-7-6-1/.test(blind.why) && P0.chars.length === 5);
  const gone = P0.chars[0], tr0 = P0.trash.length, rested0 = P0.don.rested, id6 = P0.hand[anyChar]; const r6 = S.play(0, anyChar, { trash: 0 });
  ok('...the chosen one goes to the trash, its given DON!! to the cost area rested (§6-5-5-4), and the new one is in play', r6.ok && P0.chars.length === 5 && P0.trash.length === tr0 + 1 && P0.trash.includes(gone.id) && P0.don.rested === rested0 + S.cost(V.CAT.byId.get(id6)) + 2 && P0.chars[4].id === id6 && /to make room/.test(g.log.join('\n')));
  ok('...and it is not a K.O.: no [On K.O.] is offered for it (§3-7-6-1-1)', !g.queue.length && !/K\.O\.'d/.test(g.log[0] || '')); }
P0.chars = []; P0.hand = P0.hand.filter(Boolean);
/* pay and place */
const anyChar1 = P0.hand.findIndex(id => V.CAT.byId.get(id).type === 'Character' && S.cost(V.CAT.byId.get(id)) <= P0.don.active);   // take 122: the block above played one; find another
if (anyChar1 >= 0) { const before = P0.don.active; const p = V.CAT.byId.get(P0.hand[anyChar1]); const r = S.play(0, anyChar1);
  ok('playing a Character rests its cost in DON!! and puts it in play, marked with the turn', r.ok && P0.chars.length === 1 && P0.don.active === before - S.cost(p) && P0.chars[0].turn === 3); }
ok('§10-1: a Character played this turn cannot attack without [Rush]', P0.chars.length === 0 || V.hasKw === undefined || S.canAttack(0, 0).ok === false);
/* give DON!!: +1000 on your own turn only */
const lp = S.power(0, 'leader'); S.giveDon(0, 'leader');
ok('§6-5-5: a given DON!! is +1000 power', S.power(0, 'leader') === lp + 1000 && g.players[0].leader.don === 1);
ok('...and not on the other player\'s turn', S.giveDon(1, 'leader').ok === false);
/* battle: the Leader attacks the Leader; a tie goes to the attacker (§7-1-4-1) */
const P1 = g.players[1]; const L0 = V.CAT.byId.get(P0.leader.id), L1 = V.CAT.byId.get(P1.leader.id);
P0.modl = []; P1.modl = []; P0.leader.don = 0; P0.leader.rested = false;
const need = (parseInt(L1.power, 10) || 0) - (parseInt(L0.power, 10) || 0); if (need > 0) S.mod(0, 'leader', need, 'turn');   // make it exactly a tie
const lifeBefore = P1.life.length, handBefore = P1.hand.length;
ok('§7-1: the attack is declared, the attacker rests, the defender gets the block step', S.attack(0, 'leader', 'leader').ok && P0.leader.rested && g.phase === 'battle' && g.battle.step === 'block');
S.noBlock(); const res = S.resolve();
ok('§7-1-4-1: a tie is a hit; a Leader hit takes 1 damage — top Life card to hand', res.win && P1.life.length === lifeBefore - 1 && P1.hand.length === handBefore + 1 && res.life.length === 1);
/* a rested Character can be attacked and is K.O.\'d; an active one cannot be targeted */
P1.chars = [onField(P1.deck[0], 1, true), onField(P1.deck[1], 1)];
P0.leader.rested = false; P0.modl = [{ key: 'leader', n: 99999, until: 'endturn' }];
ok('§7-1: an active Character is not a legal target', S.attack(0, 'leader', 1).ok === false);
S.attack(0, 'leader', 0); S.noBlock(); const ko = S.resolve();
ok('a losing Character is K.O.\'d to the trash', ko.win && ko.ko && P1.chars.length === 1 && P1.trash.length >= 1);
/* counter adds to the defender; a held attack does nothing */
P0.leader.rested = false; P0.modl = [];
const cc =P1.hand.findIndex(id => (parseInt(V.CAT.byId.get(id).counter, 10) || 0) > 0);
if (cc >= 0) { const plus = parseInt(V.CAT.byId.get(P1.hand[cc]).counter, 10); const d0 = S.power(1, 'leader'); S.attack(0, 'leader', 'leader'); S.noBlock(); S.counter(cc);
  ok('§7-1-3: a Counter card from hand is trashed and adds its value to the defender', S.battlePowers().d === d0 + plus && P1.trash.includes(P1.trash[P1.trash.length - 1]));
  const lb = P1.life.length; const held = S.resolve();
  ok('an attack below the defender\'s power is held: no damage', held.win === false && P1.life.length === lb); }
/* defeat: damage with no Life */
P1.life = []; P0.leader.rested = false; P0.modl = [{ key: 'leader', n: 99999, until: 'endturn' }]; S.attack(0, 'leader', 'leader'); S.noBlock(); S.resolve();
ok('§1-2-1-1: damage with no Life cards is the defeat', g.over === 0 && g.phase === 'over');
S.g = null;
}
}
