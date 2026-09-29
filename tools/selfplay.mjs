/* Self-play: the Sim plays itself and an auditor checks every move (take 122; the owner: "play games against
 * yourself to run tests against the sim automatically, checking the rules and the cards played/leaders as you go").
 *
 * Every game is seeded pairs of the ready-made decks, played through the engine's one entry point, SIM.act,
 * by one of two policies (--policy both plays each):
 *   bot     the app's own opponent on both seats (BOT.choose)
 *   chaos   any legal move at random, re-activations and by-hand moves favoured, and now and then a move the
 *           engine should refuse -- which must then change nothing
 * The auditor is written apart from the engine and reads the state after EVERY move: every card in exactly
 * one zone, DON!! summing to ten, the Character and Stage limits, no negative count, attacks only by an active
 * card at a legal target after the attacker's first turn, costs paid from active DON!!, a uid of its own for
 * every card on the field, a Once Per Turn line
 * resolved at most once per card and turn (counted here, not read from the engine), each seat's view holding
 * only what that seat may see (take 123), the refresh, and the
 * two defeats. At the end the game is replayed from its seed and moves and must end the same.
 *
 * Take 124 (the owner: "Test all starter decks and as many random/arbitrary decks (that are still legal), after every turn
 * ends audit all moves against the rules and all card they played"): the decks are every ordered pair of the ready-made
 * decks in turn, and decks dealt at random from the catalogue -- each legal by the rules' own check and by the app's -- and
 * the rulebook (tools/lib/rulebook.mjs), the auditor's own model of the game, checks every decision twice: the moves the
 * engine offers against the moves the rules allow, and the game after each move against the game the rules say follows
 * it -- every zone, DON!!, what applies to each card, the battle, the effects waiting and in what order. A turn's end is
 * a move like any other, so the End Phase and the next player's refresh, draw and DON!! are checked as the rules lay them.
 *
 *   node tools/selfplay.mjs [--games N] [--seed S] [--policy bot|chaos|both] [--decks stock|random|all] [--two-apps] [--selftest]
 *     --decks      stock: the ready-made decks, every ordered pair in turn; random: two legal decks dealt from the catalogue
 *                  per game; all (the default): the two in turn
 *     --only S     play only the game of seed S in the run the other flags describe, exactly as it went there
 *     --two-apps   two separate copies of the shipped app, each the engine of one seat, exchanging only moves --
 *                  what two phones will do (D18); after every move both must hold the same game
 * Exit 1 on any violation, each named with its seed and move so it replays exactly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { boot, ROOT } from './lib/appvm.mjs';
import { makeRulebook, deckProblems, randomDeck, wordsAudit } from './lib/rulebook.mjs';

const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const GAMES = +opt('--games', 34), SEED0 = +opt('--seed', 1), POLICY = opt('--policy', 'both'), TWO = argv.includes('--two-apps'), DECKS = opt('--decks', 'all'), ONLY = opt('--only', null);
const A = await boot({ quiet: true }); const B2 = TWO ? await boot({ quiet: true }) : null;
const V = A.V, CAT = V.CAT, decks = CAT.stock || [], RB = makeRulebook(CAT);
if (!decks.length) { console.log('  no ready-made decks in the bundle'); process.exit(1); }
const RULED = { legal: 0, moves: 0, turns: 0, tray: 0 };

const rng = seed => { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let x = Math.imul(t ^ (t >>> 15), t | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };

/* ---- the auditor: its own reading of the rules, not the engine's ------- */
const zones = P => P.deck.length + P.hand.length + P.life.length + P.trash.length + P.chars.length + (P.stage != null ? 1 : 0) + 1 + P.looking.length;
const given = P => P.leader.don + P.chars.reduce((a, c) => a + c.don, 0);
const donSum = P => P.don.active + P.don.rested + P.donDeck + given(P);
/* where two copies of a game first differ, as a path: the report names it, so a divergence is a place to look, not a riddle */
const firstDiff = (x, y, at = '') => { if (JSON.stringify(x) === JSON.stringify(y)) return null; if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) { const d = firstDiff(x[k], y[k], at + '.' + k); if (d) return d; } } return `${at || '(root)'}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`.slice(0, 160); };
const snap = g => JSON.stringify({ p: g.players, t: g.turn, a: g.active, ph: g.phase, o: g.over, b: g.battle, q: g.queue.map(o => [o.i, o.cardId, o.n, o.step]), h: g.hand });
function audit(S, g, before, a, seat, head, book, deckSizes) {
  const bad = [], say = m => bad.push(m);
  g.players.forEach((P, k) => {
    if (zones(P) !== deckSizes[k] + 1) say(`seat ${k}: ${zones(P)} cards in its zones, not ${deckSizes[k] + 1}`);
    if (donSum(P) !== 10) say(`seat ${k}: DON!! sum to ${donSum(P)}`);
    if (P.chars.length > 5) say(`seat ${k}: ${P.chars.length} Characters (§3-7-6)`);
    if ([P.don.active, P.don.rested, P.donDeck].some(n => n < 0) || P.chars.some(c => c.don < 0) || P.leader.don < 0) say(`seat ${k}: a negative DON!! count`);
    if (g.phase !== 'mulligan' && g.over === null && !P.deck.length && !P.looking.length) say(`seat ${k}: an empty deck and the game goes on (§9-2-1-2)`);
  });
  /* a by-hand tray spends what its line's words allow and no more (landmine 212): every budget a count, never below zero */
  if (g.hand) for (const [k, v] of Object.entries(g.hand.left)) if (k !== '_' && !(Array.isArray(v) || (Number.isFinite(v) && v >= 0))) say(`the by-hand tray's budget for ${k} is ${v} (landmine 212)`);
  /* take 123: each seat's view holds only what that seat may see -- the other hand and what it looks at are counts, an effect's
     choices and the moves go to the seat deciding, and no Life or deck is in it at all */
  for (const s of [0, 1]) { const v = S.view(s), priv = [];
    if (v.them.hand !== null || v.them.looking !== null) priv.push('the other hand or its look');
    if (v.offer && v.offer.seat !== s && v.offer.choices !== null) priv.push("the other seat's choices");
    if (v.who !== s && v.legal.length) priv.push("the other seat's moves");
    if ([v.me, v.them].some(X => 'life' in X || 'deck' in X)) priv.push('a Life or a deck');
    const q = g.queue[0]; if (q && q.fromLife && q.step === 0 && q.i !== s && v.offer && (v.offer.cardId !== null || v.offer.raw !== null)) priv.push('a [Trigger] its player has not revealed (§10-1-5)');
    /* take 124: a battle's result names a Life card to its owner, or to both when [Banish] trashed it face up -- never, to the other seat, one
       that went to its owner's hand (take 123's board painted what act() returned, which named it) */
    if (v.last && v.last.def !== s && v.last.life.some(l => !l.banished && (l.name !== null || l.id !== null || l.trigger))) priv.push('a Life card of the other seat that went to its hand (take 124)');
    if (priv.length) say(`seat ${s}'s view holds ${priv.join(', ')} (take 123)`); }
  /* §10-1-5: a [Trigger] declined goes to hand unrevealed, so the public log does not name it -- read with the players' names taken
     out, since a player is named for its deck and its Leader ("Yellow Monkey.D.Luffy -- built from ST29"; landmine 223) */
  const line0 = g.players.reduce((l, P) => l.split(P.name).join(''), g.log[0] || '');
  if (a.t === 'fxskip' && head && head.fromLife && head.step === 0 && line0.includes(S.card(head.cardId).name)) say(`the log names a Life card its player added to hand unrevealed (§10-1-5)`);
  /* every card on the field is its own card: a uid each, none shared -- what applies to a card, and its Once Per Turn, follow it */
  const uids = g.players.flatMap(P => [P.leader, ...P.chars].concat(P.stage ? [P.stage] : []).map(o => o.uid));
  if (uids.some(u => !(u > 0)) || new Set(uids).size !== uids.length) say(`a card on the field without its own uid (${uids.join(',')})`);
  const Pb = before.players[seat], Pa = g.players[seat];
  if (a.t === 'attack') { const src = a.ref === 'leader' ? Pb.leader : Pb.chars[a.ref];
    if (!src || src.rested) say(`an attack by a rested or missing card (§7-1-1-1)`);
    if (Pb.taken <= 1) say(`an attack on its player's first turn (§6-5-6-1)`);
    const O = before.players[1 - seat]; if (a.target !== 'leader' && !(O.chars[a.target] && O.chars[a.target].rested)) say(`an attack on an active Character (§7-1-1-2)`);
    const now = a.ref === 'leader' ? Pa.leader : Pa.chars[a.ref]; if (now && !now.rested) say('the attacker did not rest (§7-1-1-1)'); }
  if (a.t === 'play') { const p = S.card(Pb.hand[a.h]); const paid = Pb.don.active - Pa.don.active; if (p && paid !== S.cost(p)) say(`${p.name} cost ${S.cost(p)} and ${paid} active DON!! were rested (§2-7)`); }
  if (['play', 'give', 'attack', 'activate', 'end'].includes(a.t) && (before.phase !== 'main' || before.queue.length)) say(`${a.t} outside a free Main Phase (§6-5)`);
  /* Once Per Turn, counted here: a line is resolved when its first step applies or it opens by hand */
  if (head && (a.t === 'fxhand' || (a.t === 'fx' && head.step === 0)) && head.e.if.some(c => c.c === 'opt')) {
    const key = `${head.i}:${head.uid != null ? 'u' + head.uid : 'c' + head.cardId}:${head.n}:${before.turn}`;
    if (book.opt.has(key)) say(`[Once Per Turn] resolved twice: ${S.card(head.cardId).name}, turn ${before.turn} (§10-2-13)`); book.opt.add(key); }
  /* a by-hand tray, counted here: what its line's words allow when it opens, spent move by move -- never more (landmine 212) */
  if (a.t === 'fxhand' && head) book.tray = JSON.parse(JSON.stringify(S.handOps(head.e.raw)));
  if (a.t === 'hand' && book.tray && a.op !== 'look') { const k = a.op === 'activedon' ? 'active' : a.op === 'lookto' ? 'look' + a.to : a.op, T = book.tray;
    if (k === 'power') { const at = (T.power || []).indexOf(a.v); if (at < 0) say(`a by-hand ${a.v} power its line does not name (landmine 212)`); else T.power.splice(at, 1); }
    else if (!((T[k] = (T[k] || 0) - 1) >= 0)) say(`a by-hand ${a.op} beyond what its line names (landmine 212)`); }
  if (a.t === 'handdone') book.tray = null;
  if (a.t === 'end' && g.turn === before.turn + 1 && g.over === null) { const N = g.players[g.active];
    if (N.leader.rested || N.chars.some(c => c.rested)) say('the refresh left a card rested (§6-2-4)'); if (given(N)) say('the refresh left a DON!! given (§6-2-3)'); }
  if (a.t === 'resolve' && before.battle && before.battle.dref === 'leader' && before.players[before.battle.def].life.length === 0 && g.over === null) {
    const res = g.last; if (res && res.win) say('a Leader damaged with 0 Life and the game goes on (§7-1-4-1-1-1)'); }
  return bad;
}

/* ---- the policies ------------------------------------------------------ */
const WEIGHT = { activate: 6, fxhand: 4, hand: 3, fx: 3, handdone: 2, attack: 3, play: 3, give: 2, counter: 1, cevent: 2, block: 2, end: 1, fxskip: 1 };
const ODD = [{ t: 'activate', ref: 'leader' }, { t: 'end' }, { t: 'resolve' }, { t: 'fx', target: 'L' }, { t: 'give', ref: 'leader' }, { t: 'attack', ref: 'leader', target: 'leader' }, { t: 'play', h: 0 }, { t: 'handdone' }, { t: 'noblock' }];
function chaosMove(S, w, R) { const L = S.legal(w); const tot = L.reduce((a, x) => a + (WEIGHT[x.t] || 1), 0); let r = R() * tot; for (const x of L) { r -= WEIGHT[x.t] || 1; if (r <= 0) return x; } return L[L.length - 1]; }

/* ---- a game ------------------------------------------------------------ */
/* the game as data, for the rulebook: what the rules speak of, without the log and the move list */
const gameOf = g => JSON.parse(JSON.stringify({ players: g.players, turn: g.turn, active: g.active, first: g.first, phase: g.phase, over: g.over, battle: g.battle, queue: g.queue, after: g.after || null, hand: g.hand, last: g.last }));
const canon = x => JSON.stringify(Object.keys(x).filter(k => x[k] !== undefined).sort().map(k => [k, x[k]]));
function play(app, dA, dB, first, seed, policy, twin, note, ruled = true) {
  const S = app.SIM, R = rng(seed ^ 0x9E3779B9); const g = S.new(dA, dB, first, { seed });
  if (twin) { const r = twin.SIM.replay(g.spec, []); if (!r.ok) return { g, bad: [`the second app could not start the game: ${r.why}`] }; }
  const sizes = [S.expand(dA).length, S.expand(dB).length], book = { opt: new Set(), tray: null }, bad = [], stat = { moves: 0, refused: 0 };
  const rbook = { opt: new Set() };                            // the rulebook's own Once Per Turn record
  while (g.over === null && stat.moves < 8000) {
    const w = S.who(); if (w == null) { bad.push('nobody to move and the game not over'); break; }
    const drive = twin && w === 1 ? twin : app;                  // two apps: seat 1 decides on its own copy
    /* the rulebook, before the move: whose decision it is, and every move the rules allow against the engine's legal() */
    const Bm = ruled ? gameOf(g) : null;
    if (ruled) { if (RB.who(Bm) !== w) { bad.push(`move ${stat.moves}, turn ${g.turn}: the engine waits on seat ${w}, the rules on seat ${RB.who(Bm)}`); break; }
      const want = RB.legal(Bm, rbook, w); if (want) { RULED.legal++; const got = S.legal(w).map(canon), rules = want.map(canon), extra = got.filter(x => !rules.includes(x)), lack = rules.filter(x => !got.includes(x));
        if (extra.length || lack.length) { bad.push(`move ${stat.moves}, turn ${g.turn} (${g.phase}${g.queue.length ? ', ' + (S.card(g.queue[0].cardId) || {}).name + ' ' + g.queue[0].e.t + ' step ' + g.queue[0].step : ''}): legal() ${extra.length ? 'offers ' + extra.slice(0, 2).join(' ') + ' that the rules do not allow' : ''}${extra.length && lack.length ? '; it ' : ''}${lack.length ? 'lacks ' + lack.slice(0, 2).join(' ') + ' that the rules allow' : ''}`); break; } } }
    if (policy === 'chaos' && R() < 0.08) { const odd = ODD[Math.floor(R() * ODD.length)], snap0 = snap(g); const legal = S.legal(w).some(x => Object.keys(odd).every(k => x[k] === odd[k]));   // a move naming fewer keys than legal() spells is the same move
      if (!legal) { const r = S.act(w, odd); stat.refused++; if (r.ok) bad.push(`move ${stat.moves}: ${JSON.stringify(odd)} was not in legal() but was accepted`); else if (snap(g) !== snap0) bad.push(`move ${stat.moves}: a refused ${odd.t} changed the game`); if (bad.length) break; continue; } }
    const a = policy === 'chaos' ? chaosMove(drive.SIM, w, R) : drive.BOT.choose(w, drive.SIM.legal(w));
    if (!a) { bad.push(`no move chosen for seat ${w} (${g.phase})`); break; }
    const before = { players: JSON.parse(JSON.stringify(g.players)), phase: g.phase, queue: g.queue.slice(), turn: g.turn, battle: g.battle && { ...g.battle } };
    const head = g.queue[0] ? { ...g.queue[0] } : null;
    if (a.t === 'play') note(g.players[w].hand[a.h], 'played');
    if (head && ((a.t === 'fx' && head.step === 0) || a.t === 'fxhand')) note(head.cardId, a.t === 'fx' ? 'fired' : 'byHand');
    if (head && a.t === 'fxskip' && head.hand) note(head.cardId, 'declined');
    const r = drive.SIM.act(w, a); if (!r.ok) { bad.push(`move ${stat.moves}: legal() offered ${JSON.stringify(a)} and act refused it: ${r.why}`); break; }
    if (twin) { const other = drive === app ? twin : app; const r2 = other.SIM.act(w, a);
      if (!r2.ok) { bad.push(`move ${stat.moves}: the other app refused ${JSON.stringify(a)}: ${r2.why}`); break; }
      if (snap(app.SIM.g) !== snap(twin.SIM.g)) { bad.push(`move ${stat.moves}: the two apps hold different games after ${JSON.stringify(a)} -- first at ${firstDiff(JSON.parse(snap(app.SIM.g)), JSON.parse(snap(twin.SIM.g)))}`); break; } }
    stat.moves++;
    const v = audit(S, g, before, a, w, head, book, sizes); if (v.length) { bad.push(...v.map(m => `move ${stat.moves} (${JSON.stringify(a)}): ${m}`)); break; }
    /* the rulebook, after it: the game the rules say follows this move, against the engine's */
    if (ruled) { const nx = RB.next(Bm, rbook, w, a, g); RULED.moves++; if (a.t === 'hand' || a.t === 'fxhand' || a.t === 'handdone') RULED.tray++; if (Bm.turn !== g.turn) RULED.turns++;
      const where = `move ${stat.moves} (${JSON.stringify(a)}), turn ${Bm.turn}${head ? ', ' + (S.card(head.cardId) || {}).name + ' [' + head.e.t + '] step ' + head.step : ''}`;
      if (nx.refuse) { bad.push(`${where}: the engine made a move the rules refuse: ${nx.refuse}`); break; }
      const d = RB.diff(nx.m, g) || (a.t === 'resolve' && JSON.stringify(RB.lastOf(nx.m.last)) !== JSON.stringify(RB.lastOf(g.last)) ? `the battle's result: the rules say ${JSON.stringify(RB.lastOf(nx.m.last))}, the engine has ${JSON.stringify(RB.lastOf(g.last))}` : null);
      if (d) { bad.push(`${where}: ${d}`); break; } }
  }
  if (g.over === null && !bad.length) bad.push(`no end after ${stat.moves} moves`);
  if (!bad.length) { const live = snap(g), r = S.replay(g.spec, g.actions); if (!r.ok || snap(r.g) !== live) bad.push(`the replay of its seed and ${g.actions.length} moves ${r.ok ? 'ends differently' : 'stopped at move ' + r.at + ': ' + r.why}`); }
  return { g: S.g, bad, stat };
}

/* ---- the auditor's own controls: each planted fault must be named (AGENTS rule 2) ---------------------------------- */
if (argv.includes('--selftest')) {
  const PLANTS = [
    ['Once Per Turn never marked', 'resolved twice', S => { S.markUsed = () => {}; }],
    ['given DON!! lost when a Character leaves (take 121)', 'DON!! sum', S => { const leave = S.leave; S.leave = function (X, k, to) { const c = X.chars[k]; if (c) c.don = 0; return leave.call(this, X, k, to); }; }],
    ['an empty deck ignored (take 121 lost only on a failed draw)', 'empty deck', S => { S.rules = function () { const g = this.g; if (g.over === null && g.players.some(P => P.lost)) { g.over = g.players[0].lost ? 1 : 0; g.phase = 'over'; } }; }],
    ['a refusal that keeps its changes', 'changed the game', S => { S.restore = () => {}; const st = S.step; S.step = function (i, a) { const r = st.call(this, i, a); if (!r.ok) this.g.players[i].planted = 1; return r; }; }],
    ['a by-hand tray that never spends (take 121\'s row, in a tray)', 'beyond what its line names', S => { const ho = S.handOp; S.handOp = function (i, a) { const keep = JSON.stringify(this.g.hand.left), r = ho.call(this, i, a); if (r.ok && this.g.hand) this.g.hand.left = JSON.parse(keep); return r; }; }],
    ['a view that shows the other hand', "view holds", S => { const vw = S.view; S.view = function (s) { const v = vw.call(this, s); v.them.hand = this.P(1 - s).hand.slice(); return v; }; }],
    ['a view that names a [Trigger] its player has not revealed', 'has not revealed', S => { const vw = S.view; S.view = function (s) { const v = vw.call(this, s), q = this.g.queue[0]; if (v.offer && v.offer.hidden) { v.offer.cardId = q.cardId; v.offer.raw = q.e.raw; } return v; }; }],
    ['a log that names a declined [Trigger]', 'unrevealed', S => { const st = S.step; S.step = function (i, a) { const q = this.g.queue[0], r = st.call(this, i, a); if (r.ok && a.t === 'fxskip' && q && q.fromLife && !q.step) this.g.log[0] = this.card(q.cardId).name + ': the rest is declined'; return r; }; }],
    ['two cards on the field sharing one uid', 'own uid', S => { const inst = S.inst; S.inst = function (id, turn) { const o = inst.call(this, id, turn); o.uid = 7; return o; }; }],
    ['a battle\'s result that names the Life card to both seats (take 123\'s board painted act()\'s return)', 'went to its hand', S => { const vw = S.view; S.view = function (s) { const v = vw.call(this, s); if (v.last && this.g.last) v.last.life = this.g.last.life.map(l => ({ ...l })); return v; }; }],
    ['a card duplicated into play', 'cards in its zones', S => { const pl = S.play; S.play = function (i, h, o) { const id = this.P(i).hand[h]; const r = pl.call(this, i, h, o); if (r.ok && r.card.type === 'Character') this.P(i).chars.push(this.inst(id, this.g.turn)); return r; }; }]
  ];
  let ok = true;
  for (const [what, says, plant] of PLANTS) { const app = await boot({ quiet: true }); plant(app.V.SIM); let hit = null;
    /* short decks, so a deck runs out inside the sample (the empty-deck plant needs one) */
    const short = d => ({ ...d, cards: [{ id: d.cards[0].id, n: 14 }] });
    for (let k = 0; k < 40 && !hit; k++) { const dA = decks[k % decks.length], dB = decks[(k + 5) % decks.length], sh = what.includes('empty deck');
      const r = play(app.V, sh ? short(dA) : dA, sh ? short(dB) : dB, k % 2, 900 + k, 'chaos', null, () => {}, false); hit = r.bad.find(m => m.includes(says)); }   // the first auditor alone: each plant is its check's
    console.log(`  ${hit ? 'ok  ' : 'FAIL'}  planted: ${what} -- ${hit ? 'named: ' + hit.slice(0, 90) : 'NOT caught'}`); ok = ok && !!hit; }
  { const a1 = await boot({ quiet: true }), a2 = await boot({ quiet: true }); a2.V.SIM.shuffle = function (x) { return x; };   // a second phone that shuffles its own way
    const r = play(a1.V, decks[0], decks[1], 0, 77, 'bot', a2.V, () => {}, false); const hit = r.bad.find(m => /two apps|could not start|other app/.test(m));
    console.log(`  ${hit ? 'ok  ' : 'FAIL'}  planted: two apps that do not agree -- ${hit ? 'named: ' + hit.slice(0, 90) : 'NOT caught'}`); ok = ok && !!hit; }
  /* take 124: the rulebook's own controls -- a fault in the engine only the rules' model of the game can see, each named by the
     rulebook (the first auditor runs too; each plant is one it does not read), in chaos games of ready-made and random decks */
  const RULEBOOK = /the rules say|legal\(\) (?:offers|lacks)|the rules refuse|the engine waits on seat|the battle's result/;
  const RPLANTS = [
    ['the DON!! Phase places three (§6-4-1)', /DON!!: the rules say/, S => { const st = S.startTurn; S.startTurn = function () { st.call(this); const P = this.P(this.g.active); if (this.g.over === null && this.g.turn > 2 && P.donDeck > 0) { P.donDeck--; P.don.active++; } }; }],
    ['the first player draws on turn one (§6-3-1)', /seat \d (?:deck|hand): the rules say/, S => { const st = S.startTurn; S.startTurn = function () { st.call(this); if (this.g.turn === 1 && this.g.over === null) this.draw(this.g.active, 1); }; }],
    ['the refresh leaves a DON!! rested (§6-2-4)', /DON!!: the rules say/, S => { const st = S.startTurn; S.startTurn = function () { st.call(this); const P = this.P(this.g.active); if (this.g.over === null && this.g.turn > 2 && P.don.active > 0) { P.don.active--; P.don.rested++; } }; }],
    ['a Character attacks the turn it is played, no [Rush] (§3-7-4)', /legal\(\) offers [^;]*"attack"[^;]*the rules do not allow/, S => { const ca = S.canAttack; S.canAttack = function (i, ref) { const o = ref === 'leader' ? null : this.P(i).chars[ref]; if (!o) return ca.call(this, i, ref); const t = o.turn; o.turn = -1; const r = ca.call(this, i, ref); o.turn = t; return r; }; }],
    ['a Character blocks with no [Blocker] (§10-1-4)', /legal\(\) offers [^;]*"block"/, S => { const has = S.has; S.has = function (i, ref, k) { return k === 'Blocker' || has.call(this, i, ref, k); }; }],
    ['a counter added twice (§7-1-3-1-1)', /the battle: the rules say/, S => { const c = S.counter; S.counter = function (h) { const b = this.g.battle, was = b && b.counter; const r = c.call(this, h); if (r.ok) b.counter += b.counter - was; return r; }; }],
    ['a given DON!! counted on the other player\'s turn (§6-5-5-2)', RULEBOOK, S => { const pw = S.power; S.power = function (i, ref) { const a = this.g.active; this.g.active = i; const r = pw.call(this, i, ref); this.g.active = a; return r; }; }],
    ['a K.O. that ignores its cost and power limits', /legal\(\) offers [^;]*"fx"/, S => { const tf = S.targetsFor; S.targetsFor = function (i, d, src) { return tf.call(this, i, d && d.a === 'ko' ? Object.assign({}, d, { cost: null, power: null }) : d, src); }; }],
    ['an effect that draws one more than its card says', /seat \d (?:deck|hand): the rules say/, S => { S.DO.draw = function (c) { this.draw(c.i, c.d.n + 1); }; }],
    ['an [On Play] set off by an attack (§10-2-1)', /the effects waiting|legal\(\)/, S => { const of = S.offers; S.offers = function (i, t, ref, id, fl) { const r = of.call(this, i, t, ref, id, fl); return t === 'attack' ? r.concat(of.call(this, i, 'onplay', ref, id, fl)) : r; }; }],
    ['a [DON!! x] condition not read (§10-2-11)', RULEBOOK, S => { const co = S.condOk; S.condOk = function (i, src, c) { return c.c === 'donx' || co.call(this, i, src, c); }; }],
    ['[Double Attack] taking one Life (§10-1-2)', RULEBOOK, S => { const has = S.has; S.has = function (i, ref, k) { return k === 'Double Attack' ? false : has.call(this, i, ref, k); }; }],
    ['a "during this turn" change kept after the turn (§6-6-1-3)', /what applies to its cards: the rules say/, S => { const et = S.endTurn; S.endTurn = function () { const keep = this.g.players.map(X => X.modl.filter(q => q.until === 'endturn')); const r = et.call(this); this.g.players.forEach((X, k) => X.modl.push(...keep[k])); return r; }; }],
    ['an automatic effect the player may decline (§8-1-3-1)', /legal\(\) offers [^;]*"fxskip"/, S => { S.declinable = () => true; }],
    ['a used [Trigger] card kept in hand (§10-1-5-3)', /seat \d (?:hand|trash): the rules say/, S => { S.finish = function (i) { const P = this.P(i); if (P.looking.length) P.deck.unshift(...P.looking.splice(0)); }; }]
  ];
  for (const [what, says, plant] of RPLANTS) { const app = await boot({ quiet: true }); plant(app.V.SIM); let hit = null;
    for (let k = 0; k < 60 && !hit; k++) { const R = rng(4242 + k), rand = k % 2 === 1, dA = rand ? randomDeck(CAT, R) : decks[k % decks.length], dB = rand ? randomDeck(CAT, R) : decks[(k + 7) % decks.length];
      const r = play(app.V, dA, dB, k % 2, 4200 + k, k % 3 ? 'chaos' : 'bot', null, () => {}); hit = r.bad.find(m => RULEBOOK.test(m) && says.test(m)); }
    console.log(`  ${hit ? 'ok  ' : 'FAIL'}  planted for the rulebook: ${what} -- ${hit ? 'named: ' + hit.slice(0, 110) : 'NOT caught'}`); ok = ok && !!hit; }
  /* the card's words: three steps misparsed on purpose -- a draw's number, a K.O.'s cost, a power's sign -- are each named */
  { const E = JSON.parse(JSON.stringify(CAT.effects)), find = pred => { for (const [id, L] of Object.entries(E)) { const p = CAT.byId.get(+id); if (!p || p.sealed) continue; for (const e of L) if (!e.hand) for (const d of e.do) if (pred(d)) return d; } };   // a card the catalogue has: lines of an id it lacks are not read
    const dr = find(d => d.a === 'draw' && d.n === 2), ko = find(d => d.a === 'ko' && d.cost === 4), po = find(d => d.a === 'power' && d.n === 2000 && !d.sign_inferred);
    dr.n = 3; ko.cost = 5; po.n = -2000; const named = wordsAudit({ ...CAT, effects: E }), got = ['draw', 'ko', 'power'].filter(a => named.some(x => x.step.a === a));
    console.log(`  ${got.length === 3 && wordsAudit(CAT).length === 0 ? 'ok  ' : 'FAIL'}  planted for the card's words: a draw of 3 for 2, a K.O. of cost 5 for 4, -2000 for +2000 -- ${got.length} of 3 named; the catalogue as built: ${wordsAudit(CAT).length} named`); ok = ok && got.length === 3; }
  /* the decks: a random deck is legal by the rules' own check -- a fifth copy and a card of no shared colour are named */
  { const d0 = decks[0], five = { ...d0, cards: d0.cards.map((c, k) => k === 0 ? { ...c, n: 5 } : k === 1 ? { ...c, n: c.n - 1 } : c) };
    const L0 = CAT.byId.get(d0.leader), off = CAT.rows.find(p => p.type === 'Character' && !p.sealed && !String(p.color || '').split(';').some(c => String(L0.color).split(';').includes(c)));
    const hue = { ...d0, cards: d0.cards.map((c, k) => k === 0 ? { ...c, n: c.n - 1 } : c).concat([{ id: off.id, n: 1 }]) }, clean = randomDeck(CAT, rng(99));
    const named = [/copies of/.test(deckProblems(CAT, five).join()), /shares no colour/.test(deckProblems(CAT, hue).join()), deckProblems(CAT, clean).length === 0 && V.legality(clean).problems.length === 0];
    console.log(`  ${named.every(Boolean) ? 'ok  ' : 'FAIL'}  planted for the deck check: a fifth copy, a card of no shared colour -- ${named[0] && named[1] ? 'named' : 'NOT caught'}; a random deck legal by both checks: ${named[2]}`); ok = ok && named.every(Boolean); }
  process.exit(ok ? 0 : 1);
}

/* ---- the run ----------------------------------------------------------- */
const policies = POLICY === 'both' ? ['bot', 'chaos'] : [POLICY];
const report = { take: V.TAKE, rules: V.SIM.RULES, games: [], cards: {}, decks: {} };
let violations = 0; const t0 = Date.now();
/* what each card did across the run: played, a scripted line fired, a by-hand line opened or declined */
const seen = (id, k) => { const p = CAT.byId.get(+id) || {}; const c = report.cards[id] || (report.cards[id] = { name: p.name, num: p.num, played: 0, fired: 0, byHand: 0, declined: 0 }); c[k]++; };
/* the decks (the owner, take 124): every ordered pair of the ready-made decks in turn, and two legal decks dealt at random per
   game -- each legal by the rules' own check (§5-1-2) and by the app's, or the game is not played and the run fails */
const pairs = []; for (let x = 0; x < decks.length; x++) for (let y = 0; y < decks.length; y++) pairs.push([x, y]);
const dealt = { stock: 0, random: 0 }, pairsMet = new Set(), deckFaults = d => deckProblems(CAT, d).concat(V.legality(d).problems.map(p => 'the app: ' + p));
/* before any game: every step the app runs says what its card says (the rulebook holds the engine to the parsed lines) */
const WORDS = wordsAudit(CAT); if (WORDS.length) { violations += WORDS.length; WORDS.slice(0, 5).forEach(x => console.log(`  VIOLATION  the card's words: ${x.num} ${x.name} -- ${JSON.stringify(x.step)} is not what "${String(x.raw).slice(0, 110)}" says`)); }
for (const policy of policies) for (let k = 0; k < GAMES; k++) {
  const seed = SEED0 + k * 7919, j = DECKS === 'all' ? k >> 1 : k, first = j % 2, rand = DECKS === 'random' || (DECKS === 'all' && k % 2 === 1); if (ONLY != null && seed !== +ONLY) continue;   // --only: one game of a run, exactly as the run played it
  let dA, dB; if (rand) { const R = rng(seed ^ 0x5EED); dA = randomDeck(CAT, R); dB = randomDeck(CAT, R); } else { const [x, y] = pairs[j % pairs.length]; dA = decks[x]; dB = decks[y]; pairsMet.add(x + ':' + y); }
  const faults = [dA, dB].flatMap(deckFaults); dealt[rand ? 'random' : 'stock']++;
  if (faults.length) { violations++; report.games.push({ policy, seed, first, a: dA.id, b: dB.id, bad: faults }); console.log(`  VIOLATION  ${policy} seed ${seed}: a deck that is not legal -- ${faults[0]}`); continue; }
  const { g, bad, stat } = play(A.V, dA, dB, first, seed, policy, TWO ? B2.V : null, seen);
  report.games.push({ policy, seed, first, a: dA.id, b: dB.id, over: g.over, turns: g.turn, moves: stat.moves, refused: stat.refused, bad, spec: bad.length ? g.spec : undefined, actions: bad.length ? g.actions : undefined });   // a failing game replays exactly: SIM.replay(spec, actions)
  if (bad.length) { violations++; console.log(`  VIOLATION  ${policy} seed ${seed} ${dA.id} v ${dB.id}: ${bad[0]}`); }
  const w = g.over === -1 ? 'draw' : (g.over === 0 ? dA.id : dB.id); (report.decks[rand ? 'random' : w] || (report.decks[rand ? 'random' : w] = { wins: 0 })).wins++;
}
const ms = Date.now() - t0, n = report.games.length;
fs.mkdirSync(path.join(ROOT, 'look'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'look', 'selfplay.json'), JSON.stringify(report, null, 1));
const moves = report.games.reduce((a, x) => a + (x.moves || 0), 0), refused = report.games.reduce((a, x) => a + (x.refused || 0), 0);
const cards = Object.values(report.cards); const sum = k => cards.reduce((a, c) => a + c[k], 0);
console.log(`  ${n} games (${policies.join(' + ')}${TWO ? ', two apps' : ''}; ${dealt.stock} of ready-made decks, ${pairsMet.size} of their ${pairs.length} pairings, and ${dealt.random} of random legal decks), ${moves} moves audited, ${refused} illegal moves refused unchanged, ${violations} with a violation; ${Math.round(ms / 100) / 10} s`);
console.log(`  the rulebook: ${RULED.moves} moves against the rules' own model of the game (${RULED.tray} of them by hand, ${RULED.turns} turns ended), ${RULED.legal} lists of legal moves compared; the card's words: ${WORDS.steps} steps of ${WORDS.lines} scripted lines, ${WORDS.length} not what their card says`);
console.log(`  cards: ${cards.length} seen; ${sum('played')} plays, ${sum('fired')} scripted lines fired, ${sum('byHand')} opened by hand, ${sum('declined')} by-hand lines declined; report look/selfplay.json`);
process.exit(violations ? 1 : 0);
