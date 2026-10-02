/* smoke section 82: take 122 \u2014 the Sim on one entry point: the rules of v1.2.1, a move as a transaction, by hand bounded, the Rules sheet, proofs, Report
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { dear, A, base } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 122 \u2014 the Sim on one entry point: the rules of v1.2.1, a move as a transaction, by hand bounded, the Rules sheet, proofs, Report');
const S = V.SIM, R = V.CAT.rows;
const st01 = V.CAT.stock.find(d => d.id === 'stock-st01'), st02 = V.CAT.stock[1];
const snapG = () => JSON.stringify(S.g);
/* decline whatever waits, for whoever it waits on -- bounded, and it stops at a refusal */
const skipAll = () => { for (let k = 0; k < 30 && S.g.queue.length; k++) if (!S.act(S.who(), S.g.hand ? { t: 'handdone' } : { t: 'fxskip' }).ok) break; };
const deal = (a, b, first, seed) => { const x = S.new(a, b, first, { seed }); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); return x; };
/* whose decision: the mulligan in order (§5-2-1-6); a move from the wrong seat refused and changing nothing */
let g = S.new(st01, st02, 1, { seed: 3 });
ok('the mulligan is decided first by the first player (§5-2-1-6): who() names them, legal() is keep or mulligan', S.who() === 1 && JSON.stringify(S.legal(1)) === '[{"t":"keep"},{"t":"mull"}]' && S.legal(0).length === 0);
const s0 = snapG(); const early = S.act(0, { t: 'keep' });
ok('...a move from the other seat is refused and changes nothing', early.ok === false && /not your decision/.test(early.why) && snapG() === s0);
/* Life: the deck's top card goes to the BOTTOM of Life (§5-2-1-7, §2-9-2-1) */
const top = g.players.map(P => P.deck.slice(0, S.num(S.card(P.leader.id).life) || 5));
S.act(1, { t: 'keep' }); S.act(0, { t: 'keep' });
ok('Life is placed with the deck\'s top card at the bottom (§5-2-1-7): life[0], the top, was the last one placed', g.players.every((P, k) => JSON.stringify(P.life) === JSON.stringify(top[k].slice().reverse())));
ok('...control: take 121\'s top-first order is not this one', g.players.some((P, k) => top[k].length > 1 && JSON.stringify(P.life) !== JSON.stringify(top[k])));
/* a move is a transaction: a refused one restores the game exactly */
const P1 = S.P(1); const dear = P1.hand.findIndex(id => S.cost(S.card(id)) > P1.don.active);
const s1 = snapG(); const refused = S.act(1, { t: 'play', h: dear });
ok('a refused move changes nothing and is not recorded (a play it cannot pay for)', dear >= 0 && refused.ok === false && /costs/.test(refused.why) && snapG() === s1);
/* DON!!: +1000 on the owner's turn only (§6-5-5-2) */
S.act(1, { t: 'give', ref: 'leader' }); const L1 = S.card(P1.leader.id);
ok('§6-5-5-2: a given DON!! is +1000 on its owner\'s turn', S.power(1, 'leader') === S.num(L1.power) + 1000);
S.act(1, { t: 'end' });
ok('...and nothing on the opponent\'s turn, while it is still given (take 121 counted it for the defender)', g.active === 0 && P1.leader.don === 1 && S.power(1, 'leader') === S.num(L1.power));
/* deck-out is rule processing (§9-2-1-2), not a failed draw */
S.P(0).deck.splice(0); S.act(0, { t: 'give', ref: 'leader' });
ok('§9-2-1-2: an empty deck is a defeat at the next rule processing -- after any move, not only a draw', g.over === 1 && g.phase === 'over' && g.log.some(l => /no cards in the deck \u2014 defeat \(§9-2-1-2\)/.test(l)));
g = deal(st01, st02, 0, 4); S.P(0).deck.splice(1); S.act(0, { t: 'end' });
const alive = g.over === null; S.act(1, { t: 'end' });
ok('...control: one card left is no defeat; drawing it empties the deck, and the game ends then', alive && g.over === 1 && S.P(0).deck.length === 0);
/* a Character that leaves: its given DON!! go home rested (§6-5-5-4) */
g = deal(st01, st02, 0, 5); S.act(0, { t: 'end' }); S.act(1, { t: 'end' }); S.act(0, { t: 'end' });   // seat 1's second turn: it may battle
const plain = R.find(p => p.type === 'Character' && p.num && !S.lines(p.text).length && !(p.kw || '').length && S.num(p.power) === 3000);
const D = S.P(0); D.chars = [Object.assign(S.inst(plain.id, 1), { don: 2, rested: true })]; D.donDeck -= 2; const r0 = D.don.rested;
S.mod(1, 'leader', 99999, 'turn'); S.act(1, { t: 'attack', ref: 'leader', target: 0 }); skipAll(); S.act(0, { t: 'noblock' }); S.act(0, { t: 'resolve' });
const tenEach = () => [0, 1].every(k => { const X = S.P(k); return X.don.active + X.don.rested + X.donDeck + X.leader.don + X.chars.reduce((a, c) => a + c.don, 0) === 10; });
ok('§6-5-5-4: a K.O.\'d Character\'s two given DON!! come back to the cost area, rested (take 121 lost them)', D.chars.length === 0 && D.don.rested === r0 + 2 && tenEach());
/* [Unblockable] and [Rush: Character] */
const kws = p => (p.kw || '').split('|');
const unb = R.find(p => p.type === 'Character' && kws(p).includes('Unblockable')), rc = R.find(p => p.type === 'Character' && kws(p).includes('Rush: Character') && !kws(p).includes('Rush'));
const blk = R.find(p => p.type === 'Character' && p.kw === 'Blocker');
const arena = (att, turnPlayed) => { deal(st01, st02, 0, 6); S.act(0, { t: 'end' }); S.act(1, { t: 'end' });
  S.P(0).chars = [S.inst(att.id, turnPlayed)]; S.P(1).chars = [S.inst(blk.id, 1), Object.assign(S.inst(plain.id, 1), { rested: true })]; };
if (unb && blk) { arena(unb, 1); S.act(0, { t: 'attack', ref: 0, target: 'leader' }); skipAll(); const n1 = S.blockers().length;
  arena(plain, 1); S.act(0, { t: 'attack', ref: 0, target: 'leader' }); skipAll(); const n2 = S.blockers().length;
  ok('§10-1-7: [Unblockable] leaves the defender no Blocker; control: the same board with a plain attacker has one', n1 === 0 && n2 === 1, `${n1}/${n2}`); }
if (rc) { arena(rc, 3); const t = S.legal(0).filter(a => a.t === 'attack' && a.ref === 0).map(a => a.target);
  ok('§10-1-6: [Rush: Character] attacks the turn it is played, and only Characters', t.length === 1 && t[0] === 1, JSON.stringify(t)); }
/* an effect K.O. fires [On K.O.] (§10-2-17; take 121 never offered it) */
const FXs = V.CAT.effects;
const koFx = Object.keys(FXs).find(id => S.card(+id).type === 'Character' && FXs[id].some(e => !e.hand && e.t === 'onplay' && e.if.length === 0 && e.do.length === 1 && e.do[0].a === 'ko' && e.do[0].cost >= 2 && !e.do[0].rested));   // a cost line that reaches the planted cost-2 Character (take 122: "a cost of 0" is scripted now)
const onko = Object.keys(FXs).find(id => S.card(+id).type === 'Character' && FXs[id].some(e => e.t === 'onko') && S.cost(S.card(+id)) <= 2);
if (koFx && onko) { g = deal(st01, st02, 0, 7); S.act(0, { t: 'end' }); S.act(1, { t: 'end' });
  const P = S.P(0); P.hand = [+koFx]; P.don.active = 10 - P.don.rested; P.donDeck = 0; S.P(1).chars = [S.inst(+onko, 1)];
  S.act(0, { t: 'play', h: 0 }); const ko = S.legal(0).find(a => a.t === 'fx' && a.target === 'o0'); if (ko) S.act(0, ko);
  ok('§10-2-17: a Character an effect K.O.s offers its [On K.O.] to its owner (take 121 skipped it)', !!ko && S.P(1).chars.length === 0 && g.queue.length >= 1 && g.queue[0].i === 1 && g.queue[0].e.t === 'onko' && S.who() === 1); skipAll(); }
/* the Leaders the free tray stood in for: ST08-001's "When a Character is K.O.'d" and ST09-001's continuous +1000 with its condition */
{ const lead = num => (V.CAT.byNum.get(num) || []).find(p => p.type === 'Leader' && p.num === num), L8 = lead('ST08-001'), L9 = lead('ST09-001');
  const koBoard = (leaderId, att) => { deal({ ...st01, leader: leaderId }, { ...st02, leader: leaderId }, 0, 10); S.act(0, { t: 'end' }); S.act(1, { t: 'end' }); if (att === 1) S.act(0, { t: 'end' });
    const A = S.P(att); S.P(1 - att).chars = [onField(plain.id, 1, true)]; A.don.rested += 1; A.don.active -= 1; S.mod(att, 'leader', 99999, 'turn');
    S.act(att, { t: 'attack', ref: 'leader', target: 0 }); skipAll(); S.act(1 - att, { t: 'noblock' }); S.act(1 - att, { t: 'resolve' }); return S.g.queue.map(o => `${o.i}:${o.e.t}:${o.hand ? 'hand' : 'run'}`).join(); };
  if (L8 && plain) { const q = koBoard(L8.id, 0); const d0 = S.P(0).leader.don; S.act(0, { t: 'fx', target: 'L' });
    ok('ST08-001: a Character K.O.\'d on its turn offers "give up to 1 rested DON!! to this Leader", scripted, and it lands', q === '0:whenko:run' && S.P(0).leader.don === d0 + 1, q);
    const q1 = koBoard(L8.id, 1);
    ok('...control: [Your Turn] -- the same K.O. on the opponent\'s turn waits only on the opponent\'s Leader', q1 === '1:whenko:run', q1); skipAll(); }
  if (L9) { deal({ ...st01, leader: L9.id }, st02, 0, 11); S.act(0, { t: 'end' }); const P = S.P(0), base = S.num(L9.power); P.leader.don = 1; P.donDeck -= 1;
    const life = P.life.splice(2); const at2 = S.power(0, 'leader'); P.life.push(life.shift()); const at3 = S.power(0, 'leader'); P.life.pop(); P.leader.don = 0; const noDon = S.power(0, 'leader');
    ok('ST09-001: [DON!! x1] [Opponent\'s Turn] at 2 Life or less the Leader is +1000; controls: at 3 Life, and with no DON!!, it is not', at2 === base + 1000 && at3 === base && noDon === base, `${at2}/${at3}/${noDon} of ${base}`); }
  const un = Object.keys(FXs).find(id => FXs[id].some(e => e.hand && e.t === 'static'));
  ok('a continuous line the app does not compute is kept, never offered, and the board says it is the player\'s to apply', !!un && S.unapplied(+un).length >= 1 && S.unapplied(st01.leader).length === 0 && /its continuous text is yours to apply/.test(js)); }
/* one Stage: a new one trashes the old (§3-8-5-1) */
const stg = R.filter(p => p.type === 'Stage' && p.num && S.cost(p) <= 2).slice(0, 2);
if (stg.length === 2) { deal(st01, st02, 0, 8); const P = S.P(0); P.hand = [stg[0].id, stg[1].id]; P.don.active = 4; P.donDeck = 6;
  S.act(0, { t: 'play', h: 0 }); skipAll(); S.act(0, { t: 'play', h: 0 }); skipAll();
  ok('§3-8-5-1: a second Stage trashes the first', P.stage && P.stage.id === stg[1].id && P.trash.includes(stg[0].id));
  ok('...and the Stage is a card like the others: its own uid, rested and set active as they are (the review: it was an id beside two loose fields)', P.stage.uid > 0 && P.stage.rested === false && S.refOf(P, P.stage.uid) === 'stage' && P.stageUid === undefined && P.stageRested === undefined); }
/* by hand, bounded (landmine 212): the tray names only the moves the line's words name, as many as its numbers */
ok('by hand: a line\'s words name its moves -- "Draw 2 cards" is two draws and nothing else', JSON.stringify(S.handOps('[On Play] Draw 2 cards.')) === '{"draw":2}');
ok('...Luffy\'s words are one DON!! given; control: no draw, no DON!! from the deck, no Life', (() => { const o = S.handOps('[Activate: Main] [Once Per Turn] Give this Leader or 1 of your Characters up to 1 rested DON!! card.'); return o.givedon === 1 && !o.draw && !o.adddon && !o.lifetohand; })());
{ deal(st01, st02, 0, 20); S.act(0, { t: 'end' }); S.act(1, { t: 'end' }); const P = S.P(0); P.don.rested += 2; P.don.active -= 2;
  S.g.queue = [{ i: 0, e: { raw: '[On Play] Set up to 1 of your DON!! cards as active.', t: 'onplay', if: [], do: [], hand: true }, n: 0, ref: null, uid: null, cardId: st01.leader, fromLife: false, hand: true, steps: [], step: 0, targets: null }];
  S.act(0, { t: 'fxhand' }); const one = S.act(0, { t: 'hand', op: 'activedon' }), left = S.legal(0).filter(a => a.op === 'activedon' || a.op === 'active').length;
  ok('...a DON!! set active spends the line\'s one "set ... as active" (take 122\'s self-play: it spent a budget no line has, and never ran out); control: the first is allowed', one.ok && left === 0 && P.don.active === 2 && Number.isFinite(S.g.hand.left.active), `${left} left`); skipAll(); }
ok('...a look\'s cards go only where its words send them: "top or bottom" is the bottom (the rest back on top), never hand or trash; a search\'s reveal is one to hand (take 122\'s look: Perona was offered both)', (() => {
  const pe = S.handOps("[On Play] Look at 5 cards from the top of your deck and place them at the top or bottom of the deck in any order."), se = S.handOps("[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Straw Hat Crew} type card and add it to your hand. Then, place the rest at the bottom of your deck in any order."), tr = S.handOps("[On Play] Look at 3 cards from the top of your deck and trash them.");
  return pe.look === 5 && pe.lookbottom === 5 && !pe.lookhand && !pe.looktrash && se.lookhand === 1 && se.lookbottom === 5 && !se.looktrash && tr.looktrash === 3 && !tr.lookhand; })());
ok('...whose cards, how long and from where are the words\' too: "your opponent\'s" is theirs, "a Character" either side\'s, "during this battle" the battle, "[Monkey.D.Luffy] cards" still yours; "from your hand to the top of your Life" is a hand card, never the deck\'s top; "your opponent\'s Life cards" theirs (take 122, the Leaders\' proofs)', (() => { try {
  const k = S.handOps("[On Play] K.O. up to 1 of your opponent's Characters with a cost of 3 or less."), b = S.handOps("[On Play] Return up to 1 Character with a cost of 3 or less to the owner's hand."),
    p = S.handOps("[When Attacking] Up to 1 of your Leader or Character cards gains +1000 power during this battle."), n = S.handOps("[Opponent's Turn] All of your [Portgas.D.Ace] and [Monkey.D.Luffy] cards gain +3000 power."),
    l = S.handOps("[When Attacking] You may add 1 card from the top or bottom of your Life cards to your hand: If you have 2 or less Life cards, add up to 1 card from your hand to the top of your Life cards."), t = S.handOps("[Activate: Main] Trash up to 1 of your opponent's Life cards.");
  return k._.where.ko === 'opp' && b._.where.tohand === 'any' && p._.dur === 'battle' && p._.where.power === 'own' && n._.where.power === 'own' && l.handtolife === 1 && !l.decktolife && l._.lifebottom === true && t.opplifetrash === 1; } catch (e) { return false; } })());
ok('...and the free row is gone: no SIM.manual, no Draw (effect) button (take 121 drew without limit)', S.manual === undefined && !/data-sim="m:/.test(js) && !/Draw \(effect\)/.test(js));
/* the review's guard: outside the engine and its opponent, the app moves a game only through act() -- a screen that wrote
   the game itself is how take 121's tray drew without limit, and how two copies of a game would drift apart */
{ const s0 = js.indexOf('const SIM = {'), b0 = js.indexOf('const BOT = {'), e0 = js.indexOf('\n};', b0);
  const outside = (js.slice(0, s0) + js.slice(e0)).replace(/"where":"[^"]*"/g, '');   // the rules digest names the engine's functions in its "where" text: words, not calls
  const WRITES = ['draw', 'mulligan', 'placeLife', 'startTurn', 'endTurn', 'mod', 'play', 'room', 'placeStage', 'leave', 'giveDon', 'attack', 'track', 'block', 'noBlock', 'playCounterEvent', 'counter', 'resolve', 'endBattle', 'rules', 'apply', 'markUsed', 'handOp', 'step', 'restore', 'rec', 'queue', 'drain', 'shuffle', 'rand'];
  const writes = src => [...src.matchAll(/\bSIM\.(\w+)\s*\(/g)].map(m => m[1]).filter(n => WRITES.includes(n));
  ok('only act() moves a game: the board, Diagnostics and the rest of the app call no engine write (take 122\'s review)', s0 > 0 && b0 > s0 && e0 > b0 && writes(outside).length === 0 && WRITES.every(n => typeof S[n] === 'function'), writes(outside).join());
  ok('...control: a planted SIM.giveDon outside the engine is named', writes(outside + '\nSIM.giveDon(0, "leader");').join() === 'giveDon'); }
ok('one store of what effects change, and one shape for a card on the field: a player has modl, no mods, and a Stage that is a card or null (the review)', (() => { const p = S.player('probe', st01.leader, []); return Array.isArray(p.modl) && p.mods === undefined && p.stage === null && !('stageUid' in p) && !('stageRested' in p) && p.leader.uid > 0; })());
/* the proof marks: proven, unproven, by hand; a printing proven wrong is offered by hand only */
const provenId = +Object.keys(V.CAT.proof).find(id => V.CAT.proof[id].v === 'proven' && (FXs[id] || []).some(e => !e.hand));
const unprovenId = +Object.keys(FXs).find(id => !V.CAT.proof[id] && FXs[id].some(e => !e.hand && e.t !== 'static'));
const handId = +Object.keys(FXs).find(id => FXs[id].every(e => e.hand));
ok('each offered line says what the app knows of it: proven by a test, scripted and unproven, or by hand', S.proofOf(provenId, FXs[provenId].find(e => !e.hand)) === 'proven' && S.proofOf(unprovenId, FXs[unprovenId].find(e => !e.hand)) === 'unproven' && S.proofOf(handId, FXs[handId][0]) === 'hand');
V.CAT.proof[unprovenId] = { v: 'wrong', why: 'planted' }; const asWrong = S.fx(unprovenId); delete V.CAT.proof[unprovenId];
ok('...a printing proven WRONG is offered by hand, with the reason; control: without the verdict it runs', asWrong.filter(e => e.t !== 'static').every(e => e.hand && e.wrong === 'planted') && S.fx(unprovenId).some(e => !e.hand));
/* describe: what the app will do, in words */
ok('describe() says what a line will do: Luffy\'s is one rested DON!!, to the Leader or a Character, once a turn', S.describe(FXs[String(st01.leader)][0]) === '[Activate: Main] once per turn: give up to 1 rested DON!! to your Leader or 1 Character');
/* every section the app cites is one the Rules sheet holds (landmine 214) */
const ids = new Set(V.RULEBOOK.sections.map(x => x.id)); const citesOf = t => [...new Set([...t.matchAll(/§(\d+(?:-\d+)*)/g)].map(m => m[1]))];
const cited = citesOf(js);
ok(`every section the shipped app cites is in the rules digest (${cited.length} cited, ${ids.size} in the digest, v${V.RULEBOOK.version})`, V.RULEBOOK.version === '1.2.1' && ids.size >= 150 && cited.length >= 40 && cited.every(c => ids.has(c)), cited.filter(c => !ids.has(c)).join());
ok('...control: a planted §99-9 is caught', citesOf('x §99-9 y').some(c => !ids.has(c)));
/* the Rules sheet: a button on every Prep & Play screen, a search, and Back closes it */
const rbOn = ['decks', 'cards', 'play', 'sim'].filter(id => new RegExp(`<section id="${id}"[\\s\\S]*?<\\/header>`).exec(html)[0].includes('data-rules=""'));
ok('a Rules button on every Prep & Play screen (the owner, take 122), drawn with its own symbol', rbOn.length === 4 && /<symbol id="g-rules" viewBox="0 0 24 24"/.test(html), rbOn.join());
const f714 = V.RULES_DB.find('7-1-4');
ok('the search reads a number as a section and its children, and words as all of them', f714.length >= 3 && f714.every(x => x.id === '7-1-4' || x.id.startsWith('7-1-4-')) && V.RULES_DB.find('blocker').length >= 3 && V.RULES_DB.find('opponent\u2019s turn').length >= 1 && V.RULES_DB.find("opponent's turn").length === V.RULES_DB.find('opponent\u2019s turn').length && V.RULES_DB.find('zzqq').length === 0);
V.openRules('6-5-5'); const rl = doc.getElementById('rulesList')._html;
ok('...opened at a section, it lists it with what the Sim does about it; Back closes the sheet first', doc.getElementById('rulesQ').value === '6-5-5' && /§6-5-5 Give DON!!/.test(rl) && /In the Sim: enforced/.test(rl) && doc.getElementById('rulesSheet').classList.contains('on') && V.closeAnyOverlay() && !doc.getElementById('rulesSheet').classList.contains('on'));
/* Check for updates: a newer digest from Pages replaces the built-in one; an older one does not */
{ const PAGES = 'https://pages.invalid/bundle/'; const u0 = V.CAT.man.updateUrl; V.CAT.man.updateUrl = PAGES; ctx.navigator.onLine = true;
  const serve = d => async u => u === PAGES + 'rules.json' ? { ok: true, status: 200, json: async () => d } : undefined;
  const newer = { ...V.RULEBOOK, version: '1.2.2', sections: V.RULEBOOK.sections.concat([{ id: '12-1', title: 'Probe', text: 'A new rule.', sim: 'enforced' }]), official: { version: '1.2.3', date: '2026-12-01', checked: '2026-12-02T00:00Z', newer: true } };
  ctx._net = serve(newer); const up = await V.RULES_DB.sync();
  ok('Check for updates: a newer digest from Pages replaces the built-in one on this phone, and says when Bandai has moved on again', up.ok && up.newer && V.RULES_DB.cur().version === '1.2.2' && /Bandai has published v1\.2\.3/.test(V.rulesStatus()) && /the Sim plays by v1\.2\.2/.test(V.rulesStatus()));
  ok('...what the Sim does stays this build\'s: a section it has not reviewed says so', V.RULES_DB.simOf('12-1') === 'not reviewed for this version of the app' && V.RULES_DB.simOf('6-5-5-2') === 'enforced');
  ctx.localStorage.removeItem('vault.rules'); ctx._net = serve({ ...V.RULEBOOK, version: '1.1.0', official: { version: '1.2.1', date: '2026-08-28' } }); const down = await V.RULES_DB.sync();
  ok('...control: an older digest does not replace the built-in one', down.ok && !down.newer && V.RULES_DB.cur().version === '1.2.1' && ctx.localStorage.getItem('vault.rules') === null);
  ctx._net = null; V.CAT.man.updateUrl = u0; ctx.localStorage.removeItem('vault.rulesOfficial'); V.RULES_DB.official = null; }
/* Report: the offer, the parse, and the whole game as its seed and moves -- replayed, the same game */
{ deal(st01, st01, 0, 9); S.act(0, { t: 'end' }); S.act(1, { t: 'end' });
  S.P(0).don.rested = 2; S.P(0).don.active -= 2; S.act(0, { t: 'activate', ref: 'leader' }); const rep = JSON.parse(V.simReport()); const live = JSON.stringify(S.g.players);
  const rr = S.replay(rep.spec, rep.actions);
  ok('Report carries the effect, what the app made of it and the game as its seed and moves', rep.kind === 'optcghub-sim-report' && rep.offer.num === 'ST01-001' && rep.offer.parsed[0].a === 'givedon' && rep.offer.proof === 'proven' && rep.actions.length >= 5);
  ok('...replayed from the Report, the moves rebuild the game (a planted board aside, which no move made)', rr.ok && rr.g.turn === 3 && rr.g.queue.length === 1 && rr.g.queue[0].cardId === st01.leader, live.length ? '' : ''); }
/* concede (§1-2-3) */
{ const x = deal(st01, st02, 0, 10); const r = S.act(1, { t: 'concede' });
  ok('§1-2-3: a player may concede at any time, even on the other\'s turn; they lose at once', r.ok && x.over === 0 && x.phase === 'over' && x.log.some(l => /concedes \(§1-2-3\)/.test(l))); }
/* expand: only printings the catalogue knows are dealt (legality counts the same list) */
ok('expand() deals only printings the catalogue knows: 50 known and an unknown id deal 50', S.expand({ cards: [{ id: plain.id, n: 50 }, { id: 999999999, n: 3 }] }).length === 50);
S.g = null;
}
}
