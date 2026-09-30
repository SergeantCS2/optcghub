/* ---- sim: the engine (A23; the hot-seat board of take 46, rebuilt on the audit of take 122) ----
   The ENGINE owns the rules play turns on, from Comprehensive Rules v1.2.1 (28 Aug
   2026): setup and the mulligan (§5-2-1), the five phases (§6), cost (§2-7), the
   Character and Stage areas (§3-7-6, §3-8-5), giving DON!! (§6-5-5), battle (§7),
   effects at their timings (§8, §10-2) and rule processing (§9). Every refusal
   cites its section, and every section cited is one the Rules sheet opens
   (landmine 214; smoke holds the list against the digest).
   Take 122: every move is one act(). Whose decision it is is the engine's answer
   (who()), what they may do is legal(), the offers waiting on a decision are the
   engine's queue, not the screen's (landmine 213), and a game is its seed and its
   actions, so it replays exactly. An honest "by hand" beats a guess about a card:
   a line no template runs is still offered at its timing, under its Once Per Turn,
   and the tray it opens carries only the moves its own words name (landmine 212). */
const SIM = {
  g: null, uid: 0, RULES: '1.2.1',
  /* every card on the field is one shape -- the Leader, a Character, the Stage -- and each has its own uid: what
     applies to a card, and its Once Per Turn, follow the uid, never a place in a list (take 122's review) */
  inst(id, turn) { return { id, rested: false, don: 0, turn, uid: ++this.uid }; },
  /* a card on the field by its ref: 'leader', a Character's index, or 'stage' */
  at(P, ref) { if (ref === 'leader') return P.leader; if (ref === 'stage') return P.stage; return ref == null ? null : P.chars[ref] || null; },
  keyOf(P, ref) { const o = this.at(P, ref); return ref === 'leader' ? 'leader' : (o ? 'u' + o.uid : null); },
  refOf(P, uid) { if (uid == null) return null; if (P.leader.uid === uid) return 'leader'; if (P.stage && P.stage.uid === uid) return 'stage'; const k = P.chars.findIndex(c => c.uid === uid); return k >= 0 ? k : null; },
  /* the shuffle is the game's own, seeded (mulberry32): the seed and the actions ARE the game (take 122) */
  rand() { const g = this.g; let t = (g.rs = (g.rs + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  card(id) { return CAT.byId.get(id); },
  /* a printing's effect lines, split as tools/effects.py splits them (lines_of): the text's lines, a new line where a timing
     tag follows a sentence's end, keyword reminders left out. The deck screen counts with it; the card proofs fingerprint with it. */
  lines(text) { const tag = /(?<=[.)])\s+(?=\[(?:Trigger|On Play|When Attacking|Activate\s*:\s*Main|On K\.O\.|Main|Counter|On Block|End of Your Turn|End of Your Opponent['\u2019]s Turn|On Your Opponent['\u2019]s Attack|DON!!\s*[xX\u00d7]\s*\d|Your Turn|Opponent['\u2019]s Turn)\])/i;
    return String(text || '').split(/\n\s*\n|\n/).flatMap(c => c.trim().split(tag)).map(c => c.trim()).filter(c => c.startsWith('[') && !/^\[(Blocker|Rush|Double Attack|Banish|Unblockable|Rush: Character)\]\s*\(/.test(c)); },
  /* only printings the catalogue knows are dealt: legality() counts the same list (take 122; a deck of 50 known cards and an unknown one dealt 51) */
  expand(deck) { const ids = []; for (const c of deck.cards) if (this.card(c.id)) for (let k = 0; k < c.n; k++) ids.push(c.id); return ids; },
  /* §5-2-1: a legal deck each, shuffled, the Leader face-up, five cards in hand; Life after the redraw (§5-2-1-7) */
  new(deckA, deckB, first = 0, opts = {}) {
    const seed = (opts.seed != null ? opts.seed : Math.floor(Math.random() * 4294967296)) >>> 0; this.uid = 0;
    const spec = { v: 1, take: TAKE, rules: this.RULES, seed, first, bot: opts.bot != null ? opts.bot : null,
      decks: [deckA, deckB].map(d => ({ name: d.name || '', leader: d.leader, cards: d.cards.map(c => ({ id: c.id, n: c.n })) })) };
    this.g = { spec, seed, rs: seed, turn: 0, first, active: first, phase: 'mulligan', players: [], battle: null, log: [], over: null, queue: [], after: null, hand: null, last: null, start: null, actions: [] };
    if (opts.bot != null) this.g.bot = opts.bot;
    this.g.players = [deckA, deckB].map((d, i) => this.player(d.name || `Player ${i + 1}`, d.leader, this.shuffle(this.expand(d))));
    this.g.players.forEach((P, i) => this.draw(i, 5));
    return this.g; },
  /* the one shape a player has; the self-test builds its probe with it too */
  player(name, leaderId, deck) { return { name, deckName: name, deck, hand: [], life: [], trash: [], looking: [], leader: this.inst(leaderId, 0), chars: [], stage: null,
    donDeck: 10, don: { active: 0, rested: 0 }, mulliganed: null, modl: [], taken: 0, used: {}, lost: null }; },
  /* a game with no deal: the self-test's probe (the same shape as new()) */
  blank(players) { this.g = { spec: null, seed: 0, rs: 0, turn: 1, first: 0, active: 0, phase: 'main', players, battle: null, log: [], over: null, queue: [], after: null, hand: null, last: null, actions: [] }; return this.g; },
  P(i) { return this.g.players[i]; },
  log(m) { this.g.log.unshift(`T${this.g.turn} ${m}`); if (this.g.log.length > 200) this.g.log.pop(); },
  /* §4-5, §6-3: draw from the top; an empty deck draws nothing -- the defeat is rule processing's (§9-2-1-2) */
  draw(i, n = 1) { const P = this.P(i); for (let k = 0; k < n; k++) { if (!P.deck.length) break; P.hand.push(P.deck.shift()); } },
  /* §5-2-1-6: all five back, reshuffle, five again, once each, the first player deciding first */
  mulligan(i, yes) { const P = this.P(i); if (P.mulliganed !== null) return; P.mulliganed = !!yes;
    if (yes) { P.deck.push(...P.hand); P.hand = []; this.shuffle(P.deck); this.draw(i, 5); this.log(`${P.name} mulligans`); }
    if (this.g.players.every(x => x.mulliganed !== null)) { this.g.players.forEach((x, k) => this.placeLife(k)); this.startTurn(); } },
  /* §5-2-1-7, §2-9-2-1: Life from the top of the deck, face-down, the deck's top card at the BOTTOM of Life (life[0] is the top) */
  placeLife(i) { const P = this.P(i); const L = this.card(P.leader.id); const n = (L && this.num(L.life)) || 5; P.life = P.deck.splice(0, n).reverse(); },
  firstTurnOf(i) { return this.P(i).taken === 1; },
  /* §6-1: Refresh -> Draw -> DON!! -> Main */
  startTurn() { const g = this.g; g.turn++; const i = g.active; const P = this.P(i); P.taken++;
    // §6-2-1: 'until the start of your next turn' ends; §6-2-3: given DON!! to the cost area, rested; §6-2-4: everything rested set active
    g.players.forEach(X => { X.modl = X.modl.filter(m => m.until !== 'refresh:' + i); });
    let back = P.leader.don; P.leader.don = 0; P.leader.rested = false;
    for (const c of P.chars) { back += c.don; c.don = 0; c.rested = false; }
    if (P.stage) P.stage.rested = false; P.don.active += P.don.rested + back; P.don.rested = 0;
    // §6-3-1: draw one; not the first player on turn one
    const first = g.turn === 1 && i === g.first, had = P.hand.length; if (!first) this.draw(i, 1);
    g.phase = 'main'; this.rules(); if (g.over !== null) return;
    // §6-4-1: two DON!!; one on the first player\u2019s first turn; what the DON!! deck has (§6-4-2, §6-4-3)
    const add = Math.min(P.donDeck, first ? 1 : 2); P.donDeck -= add; P.don.active += add;
    /* take 124 (the owner: "a user should never be able to skip drawing a card, don"): the turn's start is the engine's, never
       a move -- and what it did is kept for the view, so the table can say it (take 124 logged "draw" where none is drawn) */
    g.start = { turn: g.turn, i, drew: P.hand.length - had, don: add, first };
    g.battle = null; this.log(`${P.name} \u2014 turn ${g.turn}: refresh, ${first ? 'no draw on the first turn (§6-3-1)' : 'draw 1'}, ${add ? `+${add} DON!!` : 'the DON!! deck is empty'}`); },
  /* §6-6: the End Phase -- 'during this turn' ends on BOTH sides (take 50; §6-6-1-3) -- then the other player's turn */
  endTurn() { const g = this.g; if (g.phase !== 'main') return false; this.log(`${this.P(g.active).name} ends the turn`);
    g.players.forEach(X => { X.modl = X.modl.filter(m => m.until !== 'endturn' && m.until !== 'endbattle'); });
    g.active = 1 - g.active; g.after = null; this.startTurn(); return true; },
  /* A timed modifier, the ONE store of what an effect changed (take 122's review folded P.mods into it): key = 'leader'
     or 'u<uid>'; until = 'endturn' | 'endbattle' | 'refresh:<player>' | 'never' */
  mod(i, key, n, dur, extra) { const P = this.P(i);
    P.modl.push(Object.assign({ key, n, until: dur === 'nextturn' ? 'refresh:' + i : (dur === 'permanent' ? 'never' : (dur === 'battle' ? 'endbattle' : 'endturn')) }, extra || {})); },
  cost(p) { const c = parseInt(p.cost, 10); return isNaN(c) ? 0 : c; },
  num(v) { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; },     // the bundle\u2019s power, counter and life are strings
  power(i, ref) { const P = this.P(i); const o = ref === 'leader' ? P.leader : P.chars[ref]; if (!o) return 0; const p = this.card(o.id);
    /* continuous effects (take 48): "+N power" while the condition holds, re-evaluated every read */
    const stat = this.fx(o.id).filter(e => e.t === 'static' && e.do[0] && e.do[0].a === 'selfpower' && e.if.every(c => this.condOk(i, o, c))).reduce((a, e) => a + e.do[0].n, 0);
    const key = this.keyOf(P, ref);
    /* §6-5-5-2: a given DON!! is +1000 during its OWNER's turn only (take 122: it counted on the opponent's turn too) */
    const don = this.g.active === i ? 1000 * o.don : 0;
    return this.num(p.power) + don + stat + P.modl.filter(m => m.key === key && m.n != null).reduce((a, m) => a + m.n, 0); },
  /* Keywords the card has NOW: printed, granted while a condition holds, granted for a while (take 51). */
  kwOf(i, ref) { const P = this.P(i); const o = ref === 'leader' ? P.leader : P.chars[ref]; if (!o) return []; const p = this.card(o.id); const key = this.keyOf(P, ref);
    const printed = (p.kw || '').split('|').filter(Boolean);
    const stat = this.fx(o.id).filter(e => e.t === 'static' && e.do[0] && e.do[0].a === 'selfkw' && e.if.every(c => this.condOk(i, o, c))).map(e => e.do[0].k);
    const timed = P.modl.filter(m => m.key === key && m.kw).map(m => m.kw);
    return printed.concat(stat, timed); },
  has(i, ref, k) { return this.kwOf(i, ref).includes(k); },
  /* Cost the card has NOW: printed, changed for the turn by an effect (take 51); negative counts as 0 (§1-3-6-2) */
  effCost(X, k) { const c = X.chars[k]; if (!c) return 0; return Math.max(0, this.cost(this.card(c.id)) + X.modl.filter(m => m.key === 'u' + c.uid && m.cost != null).reduce((a, m) => a + m.cost, 0)); },
  /* an Event's timing, from its lines -- scripted or by hand -- or its text (a catalogue synced from an older build carries no by-hand lines) */
  evTiming(p, t) { return this.fx(p.id).some(e => e.t === t) || new RegExp('(^|\\n)\\s*\\[' + (t === 'evmain' ? 'Main' : 'Counter') + '\\]').test(p.text || ''); },
  /* §6-5-3: pay by resting active DON!! (§2-7-2..4). Five Characters is not a refusal: a sixth trashes one (§3-7-6-1). */
  canPlay(i, h) { const g = this.g; if (g.phase !== 'main' || g.active !== i) return { ok: false, why: 'not your Main Phase (§6-5-3)' };
    const P = this.P(i), p = this.card(P.hand[h]); if (!p) return { ok: false, why: 'unknown card' };
    if (p.type === 'Leader') return { ok: false, why: 'a Leader is never played from hand (§3-6-1)' };
    if (p.type === 'Event' && !this.evTiming(p, 'evmain')) return { ok: false, why: this.evTiming(p, 'evcounter') ? 'a [Counter] Event is used in the Counter Step (§10-2-4)' : 'an Event is used in the Main Phase only with [Main] (§6-5-3-1)' };
    const c = this.cost(p); if (P.don.active < c) return { ok: false, why: `costs ${c} DON!!, ${P.don.active} active (§2-7)` };
    return { ok: true, cost: c, full: p.type === 'Character' && P.chars.length >= 5 }; },
  play(i, h, opts = {}) { const v = this.canPlay(i, h); if (!v.ok) return v; const P = this.P(i);
    if (v.full && !(opts.trash >= 0 && opts.trash < P.chars.length)) return { ok: false, why: 'five Characters: choose one to trash first (§3-7-6-1)', need: 'trash' };
    const id = P.hand.splice(h, 1)[0]; const p = this.card(id);
    P.don.active -= v.cost; P.don.rested += v.cost;
    if (v.full) this.room(P, opts.trash);
    let ref = null;
    if (p.type === 'Character') { P.chars.push(this.inst(id, this.g.turn)); ref = P.chars.length - 1; }
    else if (p.type === 'Stage') { this.placeStage(P, id); ref = 'stage'; }
    else P.trash.push(id);                                   // an Event is trashed, then its effect resolves (§2-7-3, §8-4-2)
    this.log(`${P.name} plays ${p.name} (${v.cost})`); return { ok: true, card: p, ref }; },
  /* §3-7-6-1-1: trashing for room is rule processing -- not a K.O., no [On K.O.] */
  room(P, k) { const t = this.leave(P, k, 'trash'); if (t) this.log(`${P.name} trashes ${this.card(t.id).name} to make room (§3-7-6-1)`); },
  /* §3-8-5-1: one Stage; a new one trashes the old */
  placeStage(P, id) { if (P.stage) { P.trash.push(P.stage.id); P.modl = P.modl.filter(m => m.key !== 'u' + P.stage.uid); this.log(`${this.card(P.stage.id).name} is trashed for the new Stage (§3-8-5-1)`); } P.stage = this.inst(id, this.g.turn); },
  /* A Character leaves the field (§3-1-6): its given DON!! go to the cost area rested (§6-5-5-4; take 122: they were lost),
     what applied to it ends, and wherever it lands it is a new card */
  leave(X, k, to) { const c = X.chars.splice(k, 1)[0]; if (!c) return null;
    if (c.don) { X.don.rested += c.don; c.don = 0; }
    X.modl = X.modl.filter(m => m.key !== 'u' + c.uid);
    if (to === 'hand') X.hand.push(c.id); else if (to === 'bottom') X.deck.push(c.id); else if (to === 'top') X.deck.unshift(c.id); else if (to === 'life') X.life.unshift(c.id); else X.trash.push(c.id);
    return c; },
  /* "When a Character is K.O.'d" (take 122): the lines on either field that wait on a K.O. -- by battle or by an effect,
     never a card trashed to make room (§3-7-6-1-1) -- the turn player's first (§8-6-2) */
  onKO() { const a = this.g.active; return [a, 1 - a].flatMap(xi => { const X = this.P(xi);
    return ['leader'].concat(X.chars.map((c, k) => k), X.stage ? ['stage'] : []).flatMap(ref => this.offers(xi, 'whenko', ref)); }); },
  /* a card's continuous lines the app does not compute: the board says so rather than show a number as if it held them */
  unapplied(id) { return this.fx(id).filter(e => e.hand && e.t === 'static'); },
  /* §6-5-5-1: give an active DON!! to your Leader or a Character; +1000 during your turn (§6-5-5-2) */
  giveDon(i, ref) { const g = this.g; if (g.phase !== 'main' || g.active !== i) return { ok: false, why: 'your turn only (§6-5-5)' };
    const P = this.P(i); if (P.don.active < 1) return { ok: false, why: 'no active DON!! (§6-5-5-1)' }; const o = ref === 'leader' ? P.leader : P.chars[ref]; if (!o) return { ok: false, why: 'no such card' };
    P.don.active--; o.don++; this.log(`${P.name} gives DON!! to ${this.card(o.id).name}`); return { ok: true }; },
  /* §7-1: rest an active Leader or Character to attack. §6-5-6-1: nobody battles on their first turn. §3-7-4: a Character played
     this turn does not attack unless [Rush] (§10-1-1) -- or [Rush: Character], Characters only (§10-1-6). */
  canAttack(i, ref) { const g = this.g; if (g.phase !== 'main' || g.active !== i) return { ok: false, why: 'your Main Phase only (§6-5-6)' };
    if (this.firstTurnOf(i)) return { ok: false, why: 'no battle on your first turn (§6-5-6-1)' };
    const P = this.P(i); const o = ref === 'leader' ? P.leader : P.chars[ref]; if (!o) return { ok: false, why: 'no such card' };
    if (o.rested) return { ok: false, why: 'already rested (§7-1-1-1)' };
    if (ref !== 'leader' && o.turn === g.turn && !this.has(i, ref, 'Rush') && !this.has(i, ref, 'Rush: Character')) return { ok: false, why: 'played this turn and no Rush (§3-7-4)' };
    return { ok: true }; },
  /* §7-1-1-2: the opponent's Leader or a rested Character */
  targets(i, aref) { const O = this.P(1 - i), P = this.P(i); const a = aref == null ? null : (aref === 'leader' ? P.leader : P.chars[aref]);
    const charsOnly = !!a && aref !== 'leader' && a.turn === this.g.turn && !this.has(i, aref, 'Rush') && this.has(i, aref, 'Rush: Character');
    const t = charsOnly ? [] : [{ ref: 'leader', name: this.card(O.leader.id).name }]; O.chars.forEach((c, k) => { if (c.rested) t.push({ ref: k, name: this.card(c.id).name }); }); return t; },
  attack(i, ref, tref) { const v = this.canAttack(i, ref); if (!v.ok) return v; const O = this.P(1 - i);
    if (!this.targets(i, ref).some(t => t.ref === tref)) return { ok: false, why: 'only the Leader or a rested Character can be attacked (§7-1-1-2)' };
    const P = this.P(i); const a = ref === 'leader' ? P.leader : P.chars[ref]; a.rested = true; const d = tref === 'leader' ? O.leader : O.chars[tref];
    this.g.battle = { att: i, aref: ref, def: 1 - i, dref: tref, aUid: a.uid, dUid: d.uid, blocked: false, counter: 0, step: 'block' };
    this.g.phase = 'battle'; this.log(`${P.name}: ${this.card(a.id).name} attacks ${this.card(d.id).name}`); return { ok: true }; },
  /* §7-1-1-4, §7-1-2-3, §7-1-3-1-3: the battle follows its two cards by instance. locate() is a READ -- where they
     are now, or null for one that has left -- and legal(), the board and the app's opponent read through it; only a
     move writes (track()). Take 122: two apps fed the same moves drifted apart, because a read had moved the refs. */
  locate() { const b = this.g.battle; if (!b) return null; const f = (X, uid, ref) => uid == null ? ref : this.refOf(X, uid);
    const aref = f(this.P(b.att), b.aUid, b.aref), dref = f(this.P(b.def), b.dUid, b.dref); return { aref, dref, ok: aref != null && dref != null }; },
  track() { const at = this.locate(); if (!at) return false; this.g.battle.aref = at.aref; this.g.battle.dref = at.dref; return at.ok; },
  /* §7-1-2: the defender may activate ONE active [Blocker] for ANOTHER card (§10-1-4-1); none against [Unblockable] (§10-1-7) */
  blockers() { const b = this.g.battle, at = this.locate(); if (!b || b.step !== 'block' || !at.ok) return []; if (this.has(b.att, at.aref, 'Unblockable')) return []; const O = this.P(b.def);
    /* "your opponent cannot activate [Blocker] (that has N or more/less power) during this battle/turn" (take 122) */
    const nb = this.P(b.att).modl.filter(m => m.key === 'noblocker').map(m => m.noblk);
    const barred = k => nb.some(x => x.power == null || (x.cmp === 'more' ? this.power(b.def, k) >= x.power : this.power(b.def, k) <= x.power));
    return O.chars.map((c, k) => ({ k, c })).filter(x => !x.c.rested && this.has(b.def, x.k, 'Blocker') && x.k !== at.dref && !barred(x.k)).map(x => ({ ref: x.k, name: this.card(x.c.id).name })); },
  block(k) { const b = this.g.battle; if (!b || b.step !== 'block') return { ok: false, why: 'not the Block Step (§7-1-2)' };
    if (!this.blockers().some(x => x.ref === k)) return { ok: false, why: this.has(b.att, this.locate().aref, 'Unblockable') ? 'the attacker is Unblockable (§10-1-7)' : 'not an active Blocker (§10-1-4)' };
    this.track();
    const O = this.P(b.def); const c = O.chars[k]; c.rested = true; b.dref = k; b.dUid = c.uid; b.blocked = true; b.step = 'counter'; this.log(`${O.name}: ${this.card(c.id).name} blocks`); return { ok: true }; },
  noBlock() { const b = this.g.battle; if (b && b.step === 'block') b.step = 'counter'; },
  /* §7-1-3-1-2: a [Counter] Event, paid from the defender's active DON!!, then trashed; its effect is offered (scripted or by hand) */
  counterEvents() { const b = this.g.battle; if (!b || b.step !== 'counter') return []; const O = this.P(b.def);
    return O.hand.map((id, h) => ({ h, p: this.card(id) })).filter(x => x.p && x.p.type === 'Event' && this.evTiming(x.p, 'evcounter') && this.cost(x.p) <= O.don.active).map(x => ({ h: x.h, name: x.p.name, cost: this.cost(x.p) })); },
  playCounterEvent(h) { const b = this.g.battle; if (!b || b.step !== 'counter') return { ok: false, why: 'not the Counter Step (§7-1-3)' }; const O = this.P(b.def); const p = this.card(O.hand[h]);
    if (!p || p.type !== 'Event' || !this.evTiming(p, 'evcounter')) return { ok: false, why: 'not a [Counter] Event (§10-2-4)' }; const c = this.cost(p); if (O.don.active < c) return { ok: false, why: `costs ${c} DON!! (§7-1-3-1-2)` };
    O.hand.splice(h, 1); O.don.active -= c; O.don.rested += c; O.trash.push(p.id); this.log(`${O.name} plays ${p.name} [Counter]`); return { ok: true, id: p.id }; },
  /* §7-1-3-1-1: trash a Character with a Counter value from hand; the value is added for this battle */
  counters() { const b = this.g.battle; if (!b || b.step !== 'counter') return []; const O = this.P(b.def);
    return O.hand.map((id, h) => ({ h, p: this.card(id) })).filter(x => x.p && x.p.type === 'Character' && this.num(x.p.counter) > 0).map(x => ({ h: x.h, name: x.p.name, plus: this.num(x.p.counter) })); },
  counter(h) { const b = this.g.battle; if (!b || b.step !== 'counter') return { ok: false, why: 'not the Counter Step (§7-1-3)' }; const O = this.P(b.def); const p = this.card(O.hand[h]);
    const plus = p && p.type === 'Character' ? this.num(p.counter) : 0; if (!plus) return { ok: false, why: 'no Counter value (§2-10)' }; O.hand.splice(h, 1); O.trash.push(p.id); b.counter += plus; this.log(`${O.name} counters with ${p.name} (+${plus})`); return { ok: true }; },
  battlePowers() { const b = this.g.battle, at = this.locate(); if (!b) return null; if (!at.ok) return { a: 0, d: 0, gone: true }; return { a: this.power(b.att, at.aref), d: this.power(b.def, at.dref) + b.counter }; },
  /* §7-1-4: attacker >= defender wins; a losing Leader takes damage, a losing Character is K.O.'d */
  resolve() { const g = this.g, b = g.battle; if (!b) return null; const A = this.P(b.att), O = this.P(b.def);
    /* take 124: the result is kept in the game as well as returned -- a board draws it from view().last, which names a Life card
       only to the seat that may see it; act()'s own return names it to whoever made the move (the audit's row 1) */
    const kept = res => { g.last = Object.assign({ n: g.actions.length, turn: g.turn, att: b.att, def: b.def }, res); return res; };
    if (!this.track()) { this.log('the battle ends: a card in it has left the field (§7-1-3-1-3)'); this.endBattle(); return kept({ win: false, a: 0, d: 0, life: [], ko: null, gone: true }); }
    const { a, d } = this.battlePowers();
    const att = this.card((b.aref === 'leader' ? A.leader : A.chars[b.aref]).id); const res = { win: a >= d, a, d, life: [], ko: null };
    if (res.win) {
      if (b.dref === 'leader') { const n = this.has(b.att, b.aref, 'Double Attack') ? 2 : 1; const banish = this.has(b.att, b.aref, 'Banish');
        /* §7-1-4-1-1-1: no Life when the damage is determined is the defeat; with Life, each point takes the top card
           (§7-1-4-1-1-2, -3) -- [Double Attack] at 1 Life takes the last card and the game goes on (take 122) */
        if (!O.life.length) { O.lost = 'damage'; this.log(`${O.name} takes damage with no Life cards \u2014 defeat (§7-1-4-1-1-1)`); }
        else for (let k = 0; k < n && O.life.length; k++) {
          const id = O.life.shift(); const lc = this.card(id);
          if (banish) O.trash.push(id); else O.hand.push(id);         // §10-1-3: [Banish] trashes it, and no [Trigger]
          res.life.push({ id, name: lc ? lc.name : '?', trigger: !banish && !!(lc && hasKw(lc, 'Trigger')), banished: banish }); } }
      else { const c = this.leave(O, b.dref, 'trash'); res.ko = this.card(c.id).name; res.koId = c.id; this.log(`${res.ko} is K.O.'d`); }
    }
    this.log(`${att.name} ${a} vs ${d}: ${res.win ? 'hit' : 'held'}`); this.endBattle(); this.rules(); return kept(res); },
  /* §7-1-5: the battle ends; 'during this battle' ends with it (take 122: a [Counter] +power lasted the whole turn) */
  endBattle() { const g = this.g; g.players.forEach(X => { X.modl = X.modl.filter(m => m.until !== 'endbattle'); }); g.battle = null; if (g.phase === 'battle') g.phase = 'main'; },
  /* §9: rule processing after every act -- a Leader damaged with no Life (§9-2-1-1), an empty deck (§9-2-1-2; cards
     being looked at are still in it, §11-3-2), a concession (§1-2-3). Both at once: both lose, a draw (g.over -1). */
  rules() { const g = this.g; if (!g || g.over !== null || g.phase === 'mulligan') return;
    const lost = g.players.map(X => X.lost || ((!X.deck.length && !X.looking.length) ? 'deck' : null));
    if (!lost.some(Boolean)) return;
    lost.forEach((w, k) => { if (w === 'deck') this.log(`${this.P(k).name} has no cards in the deck \u2014 defeat (§9-2-1-2)`); });
    g.over = lost[0] && lost[1] ? -1 : (lost[0] ? 1 : 0); g.phase = 'over'; g.battle = null; g.queue = []; g.hand = null; },
  /* ---- effects (A23 step 2, take 47) -----------------------------------
     Scripted at build time from the card's own text, only whole sentences
     the engine can run. offers() evaluates the tags the engine knows and
     returns what may be applied NOW, with the legal targets computed by the
     engine; apply() executes under the same invariants as everything else.
     A line no template runs comes as a by-hand offer (take 122). A printing
     proven WRONG (tools/cards/) is offered by hand only. */
  fx(id) { const L = CAT.effects[String(id)] || []; const pr = CAT.proof[String(id)];
    return pr && pr.v === 'wrong' ? L.map(e => e.hand || e.t === 'static' ? e : Object.assign({}, e, { do: [], hand: true, wrong: pr.why || 'proven wrong' })) : L; },
  /* what a player is told about a line: proven by a test, scripted but unproven, by hand, or proven wrong */
  proofOf(id, e) { if (e && e.wrong) return 'wrong'; if (e && e.hand) return 'hand'; const pr = CAT.proof[String(id)]; return pr && pr.v === 'proven' ? 'proven' : 'unproven'; },
  /* §10-2-13: once per turn per CARD -- the instance in play; one that leaves and returns is a new card (§10-2-13-4) */
  optKey(i, ref, cardId, n) { const o = ref == null ? null : this.at(this.P(i), ref);
    return `${o ? 'u' + o.uid : 'c' + cardId}:${n}:${this.g.turn}`; },
  used(i, off) { return !!this.P(i).used[this.optKey(i, off.ref, off.cardId, off.n)]; },
  markUsed(i, off) { this.P(i).used[this.optKey(i, off.ref, off.cardId, off.n)] = true; },
  condOk(i, src, c) { const P = this.P(i), g = this.g; const L = this.card(P.leader.id);
    if (c.c === 'donx') return (src ? src.don : 0) >= c.n;
    if (c.c === 'opt') return true;                                    // checked against P.used in offers() and apply()
    if (c.c === 'yourturn') return g.active === i;
    if (c.c === 'oppturn') return g.active !== i;
    if (c.c === 'opplife') return this.P(1 - i).life.length <= c.max;
    if (c.c === 'donfield') return this.fieldDon(P) >= c.min;
    if (c.c === 'leadertype') return ((L && L.subtypes) || '').split(/[;/]/).map(x => x.trim()).includes(c.t);
    if (c.c === 'leadername') return !!L && L.name === c.name;
    if (c.c === 'life') return P.life.length <= c.max;
    if (c.c === 'trash') return P.trash.length >= c.min;
    if (c.c === 'donle') return this.fieldDon(P) <= this.fieldDon(this.P(1 - i));
    return false; },
  /* Can the first step's COST be paid at all? If not, the effect is not offered (§8-3-1-3). */
  fieldDon(P) { return P.don.active + P.don.rested + P.leader.don + P.chars.reduce((a, x) => a + x.don, 0); },
  canPay(i, ref, d) { const P = this.P(i); if (!d || !/^cost_/.test(d.a)) return true;
    if (d.a === 'cost_restdon') return P.don.active >= d.n;
    if (d.a === 'cost_trashhand') return P.hand.length >= d.n;
    if (d.a === 'cost_returndon') return this.fieldDon(P) >= d.n;
    if (d.a === 'cost_restself') { const o = this.at(P, ref); return !!o && !o.rested; }
    return false; },
  /* every cost at the head of a line, as printed and paid in order (§8-3-1-1): all of them payable, or the line is not offered (§8-3-1-3) */
  costsPayable(i, ref, steps) { for (const d of steps || []) { if (!/^cost_/.test(d.a)) break; if (!this.canPay(i, ref, d)) return false; } return true; },
  /* the steps whose "up to" lets 0 be chosen (§4-8, §8-4-4-1): with no target the step does nothing */
  TARGETED: ['ko', 'rest', 'bounce', 'bottom', 'power', 'costmod', 'givedon', 'playfromhand', 'trashhand'],
  /* Targets are strings the board can put on a button: L = your Leader,
     mK = your Character K, oK = the opponent's Character K, hK = a hand
     card, dK = the K-th card looked at from the top of the deck. */
  targetsFor(i, d, src) { if (!d) return null; const O = this.P(1 - i), P = this.P(i);
    /* "N power or less" is the power the card has NOW (§2-6-3); "base power" is the printed number (take 122) */
    const fit = (X, k) => { const c = X.chars[k], p = this.card(c.id); return (d.cost == null || this.effCost(X, k) <= d.cost) && (d.power == null || this.power(X === P ? i : 1 - i, k) <= d.power) && (d.bpower == null || this.num(p.power) <= d.bpower) && (!d.rested || c.rested); };
    const opp = () => O.chars.map((c, k) => ({ ref: 'o' + k, name: this.card(c.id).name + ' (theirs)' })).filter((t, k) => fit(O, k));
    const own = () => P.chars.map((c, k) => ({ ref: 'm' + k, name: this.card(c.id).name })).filter((t, k) => fit(P, k));
    if (d.a === 'ko') return opp();
    if (d.a === 'rest') return opp().filter(t => !O.chars[+t.ref.slice(1)].rested);
    if (d.a === 'bounce' || d.a === 'bottom') return d.who === 'any' ? own().concat(opp()) : opp();
    if (d.a === 'power' && d.who === 'prev') return null;   // the card the previous step chose
    if (d.a === 'costmod') return opp();
    if (d.a === 'power') return d.who === 'opp' ? opp() : [{ ref: 'L', name: this.card(P.leader.id).name }].concat(own()).filter(t => !d.notself || t.ref !== (src === 'leader' ? 'L' : 'm' + src));
    if (d.a === 'givedon') return (d.who === 'chars' ? [] : [{ ref: 'L', name: this.card(P.leader.id).name }]).concat(d.who === 'leader' ? [] : P.chars.map((c, k) => ({ ref: 'm' + k, name: this.card(c.id).name })));
    if (d.a === 'trashhand' || d.a === 'cost_trashhand') return P.hand.map((id, h) => ({ ref: 'h' + h, name: this.card(id).name }));
    if (d.a === 'playfromhand') return P.hand.map((id, h) => ({ id, h, p: this.card(id) })).filter(x => x.p && x.p.type === 'Character' && (d.cost == null || this.cost(x.p) <= d.cost) && (d.power == null || this.num(x.p.power) <= d.power) && (!d.type || (x.p.subtypes || '').split(/[;/]/).map(y => y.trim()).includes(d.type))).map(x => ({ ref: 'h' + x.h, name: x.p.name + ' (' + this.cost(x.p) + 'c)' }));
    if (d.a === 'search') { const types = d.types || (d.type ? [d.type] : null);
      return P.deck.slice(0, d.n).map((id, k) => ({ id, k, p: this.card(id) })).filter(x => x.p
        && ((!types && !d.names) || (types || []).some(t => (x.p.subtypes || '').split(/[;/]/).map(y => y.trim()).includes(t)) || (d.names || []).includes(x.p.name))
        && (!d.name || x.p.name === d.name) && (!d.not || x.p.name !== d.not)
        && (d.cost_max == null || this.cost(x.p) <= d.cost_max) && (d.cost_min == null || this.cost(x.p) >= d.cost_min)).map(x => ({ ref: 'd' + x.k, name: x.p.name + (x.p.type ? ' (' + x.p.type + ')' : '') })); }
    return null; },
  /* an offer's choices NOW, for the card where it is now: read, never kept from when the offer was queued (take 122: self-play
     found a queued cost still offering a hand card an earlier effect had trashed) */
  targetsOf(o) { const ref = o.uid != null ? this.refOf(this.P(o.i), o.uid) : o.ref; return this.targetsFor(o.i, o.steps[o.step], ref); },
  offers(i, trigger, ref, cardId, fromLife) { const P = this.P(i); const src = ref == null ? null : this.at(P, ref); const id = cardId || (src && src.id);
    return this.fx(id).map((e, n) => ({ e, n })).filter(({ e }) => e.t === trigger)
      .filter(({ e }) => e.if.every(c => this.condOk(i, src, c)))
      .filter(({ e, n }) => !(e.if.some(c => c.c === 'opt') && this.used(i, { ref, cardId: id, n })))
      .filter(({ e }) => this.costsPayable(i, ref, e.do))
      .map(({ e, n }) => ({ i, e, n, ref, uid: src ? src.uid : null, cardId: id, fromLife: !!fromLife, hand: !!e.hand, steps: e.do, step: 0, targets: this.targetsFor(i, e.do[0], ref) })); },
  /* why a card's line is not offered now, in the rules' words: no such line, used this turn, a condition, a cost */
  whyNot(i, trigger, ref, n) { const P = this.P(i), src = this.at(P, ref); const lines = src ? this.fx(src.id).map((e, k) => ({ e, k })).filter(x => x.e.t === trigger && (n == null || x.k === n)) : [];
    if (!lines.length) return 'no [Activate: Main] on this card (§10-2-2)';
    const { e, k } = lines[0];
    if (e.if.some(c => c.c === 'opt') && this.used(i, { ref, cardId: src.id, n: k })) return 'once per turn, and used this turn (§10-2-13)';
    const bad = e.if.find(c => !this.condOk(i, src, c)); if (bad) return `its condition is not met: ${this.describe({ t: trigger, if: [bad], do: [] }).replace(/^\[[^\]]*\] /, '').replace(/:\s*$/, '')} (§8-3-2)`;
    if (!this.costsPayable(i, ref, e.do)) return 'its cost cannot be paid (§8-3-1-3)';
    return 'not now (§10-2-2)'; },
  /* Runs the CURRENT step of an offer. Returns { ok, done, follow } -- follow
     is a list of new offers (a [Trigger] that activates an [On Play], the [On K.O.] of a Character an effect K.O.'d). */
  apply(i, offer, target, opts = {}) { const P = this.P(i), O = this.P(1 - i);
    if (offer.hand) return { ok: false, why: 'this line is resolved by hand' };
    /* §8-1-3-1-3: the offer follows its card by instance. A card that left before its effect began does not activate it; one
       that leaves once it has begun does not stop it -- the rest resolves, and a step about the card itself finds no card
       (take 124: the rest of an effect whose card had left was dropped; the rulebook found Sogeking's draw lost) */
    if (offer.uid != null) { const k = this.refOf(P, offer.uid); if (k == null && offer.step === 0) return { ok: false, why: 'that card has left the field (§8-1-3-1-3)', gone: true }; offer.ref = k; }
    offer.targets = this.targetsFor(i, offer.steps[offer.step], offer.ref);
    const d = offer.steps[offer.step]; const need = offer.targets && offer.targets.length > 0;
    const opt = offer.step === 0 && offer.e.if.some(c => c.c === 'opt');
    if (opt && this.used(i, offer)) return { ok: false, why: 'once per turn, and used this turn (§10-2-13)' };
    /* take 124: a step skipped -- its condition false, or none chosen -- that is the last ends the effect as a step run does (the
       rulebook found a [Trigger] with none chosen left in hand, §10-1-5-3) */
    const next = () => { offer.step++; const done = offer.step >= offer.steps.length; if (!done) offer.targets = this.targetsFor(i, offer.steps[offer.step], offer.ref); else this.finish(i, offer); return { ok: true, done, follow: [] }; };
    /* a target the step does not offer is refused, a step that takes none included (take 122: self-play's chaos found it ignored) --
       before anything else, a false condition included (take 124: Radical Beam!!'s second step took a target it never offered) */
    if (target != null && !(offer.targets || []).some(t => t.ref === target)) return { ok: false, why: 'not a legal target for this effect' };
    /* a condition on the STEP is read now, not at the trigger (take 50): a false one skips the step */
    if (d.if && !d.if.every(c => this.condOk(i, this.at(P, offer.ref), c))) { if (opt) this.markUsed(i, offer); this.log(`${(this.card(offer.cardId) || {}).name || 'effect'}: ${this.stepText(d)} \u2014 skipped, only if ${d.if.map(c => this.condText(c)).join(', ')}`); return next(); }
    /* "up to": 0 may be chosen (§4-8, §8-4-4-1) */
    /* "that card" with none chosen before is no card: nothing to give (take 124: El Thor stood with a move the engine refused) */
    if (target == null && (d.upto || !need) && this.TARGETED.includes(d.a) && !(d.a === 'power' && d.who === 'prev' && offer.prev != null)) { if (opt) this.markUsed(i, offer); this.log(`${this.card(offer.cardId) ? this.card(offer.cardId).name : 'effect'}: ${this.stepText(d)} \u2014 none chosen`); return next(); }
    if (need && target == null) return { ok: false, why: 'choose a target' };
    const side = t => (t && t[0] === 'o') ? O : P, idx = t => +String(t).slice(1);
    const pl = id => { const p = this.card(id); return p && p.type === 'Character' && P.chars.length >= 5; };
    if ((d.a === 'playself' && pl(offer.cardId)) || (d.a === 'playfromhand' && pl(P.hand[idx(target)]))) {
      if (!(opts.trash >= 0 && opts.trash < P.chars.length)) return { ok: false, why: 'five Characters: choose one to trash first (§3-7-6-1)', need: 'trash' }; }
    if (opt) this.markUsed(i, offer);
    const run = this.DO[d.a]; if (!run) return { ok: false, why: 'unknown action' };
    const tn = target != null ? this.targetName(i, d, target) : '';   // named before the step moves it (take 124)
    const r = run.call(this, { i, P, O, d, offer, target, opts, side, idx }) || {}; if (r.ok === false) return r;
    const follow = r.follow || [];
    const nm = offer.ref === 'leader' ? this.card(P.leader.id).name : (offer.ref != null && this.at(P, offer.ref) ? this.card(this.at(P, offer.ref).id).name : (this.card(offer.cardId) || {}).name || 'a card');
    this.log(`${nm}: ${this.stepText(d)}${tn ? ' \u2192 ' + tn : ''}`);
    if (target != null) offer.prev = target;
    offer.step++; const done = offer.step >= offer.steps.length;
    if (!done) offer.targets = this.targetsFor(i, offer.steps[offer.step], offer.ref); else this.finish(i, offer);
    return { ok: true, done, follow }; },
  /* an effect that is over, however its last step went: what it looked at and did not move goes back as it was -- on top, in
     order (§11-3-3; take 123's put it at the bottom) -- and a [Trigger] card used instead of kept goes to the trash (§10-1-5-3) */
  finish(i, offer) { const P = this.P(i); if (P.looking.length) P.deck.unshift(...P.looking.splice(0));
    if (offer.fromLife) { const h = P.hand.indexOf(offer.cardId); if (h >= 0) { P.hand.splice(h, 1); P.trash.push(offer.cardId); } } },
  /* §8-1-3-1: an automatic effect activates by itself and resolves in full -- an "up to" lets 0 be chosen, and nothing else is
     the player's to decline. A line may be declined only before it begins, and only one that says "you may", or that begins with
     a cost the player may choose not to pay (§8-3), or a [Trigger] (§10-1-5), or one the player activates ([Activate: Main]),
     which may be put back unpaid. Take 124: every line could be declined at any step; the rulebook found a search declined
     after its look, its cards left outside the deck. And (the owner: "a user should never be able to skip ... things that
     every player does") a by-hand line is held to the same -- its cost first read from its words, "X: Y" -- and else is
     opened and done by its words: take 122 left every by-hand line the player's, so an [On Play] the rules make happen was
     passed by in one tap */
  declinable(o) { if (o.step > 0) return false; const e = o.e || {}, body = String(e.raw || '').replace(/^(\s*\[[^\]]+\]\s*)+/, '').replace(/\([^)]*\)/g, '');
    return e.t === 'trigger' || e.t === 'main' || /^cost_/.test((e.do && e.do[0] && e.do[0].a) || '') || /^\s*you may\b/i.test(body) || (!!o.hand && /^[^.:]*:/.test(body) && !/^\s*choose one\b/i.test(body)); },
  /* What each parsed action DOES -- one entry per action effects.py emits (smoke checks the two lists are equal).
     c = { i, P (the player), O (the opponent), d (the step), offer, target, opts, side(t), idx(t) }; an entry may return
     { follow } (offers that follow on) or { ok: false, why }. */
  DO: {
    draw(c) { this.draw(c.i, c.d.n); },
    selfpower(c) { const k = this.keyOf(c.P, c.offer.ref); if (k) this.mod(c.i, k, c.d.n, c.d.dur); },
    leaderpower(c) { this.mod(c.i, 'leader', c.d.n, c.d.dur); },
    power(c) { const tg = c.d.who === 'prev' ? c.offer.prev : c.target; if (tg == null) return;   // none chosen before: no card to give it to
      if (tg === 'L') return void this.mod(c.i, 'leader', c.d.n, c.d.dur);
      const X = c.side(tg), ch = X.chars[c.idx(tg)]; if (!ch) return; this.mod(X === c.P ? c.i : 1 - c.i, 'u' + ch.uid, c.d.n, c.d.dur); },   // a card gone: nothing to give
    ko(c) { const ch = this.leave(c.O, c.idx(c.target), 'trash'); return { follow: this.offers(1 - c.i, 'onko', null, ch.id).concat(this.onKO()) }; },   // §10-2-17: its [On K.O.] (take 122: never offered)
    rest(c) { c.O.chars[c.idx(c.target)].rested = true; },
    bounce(c) { this.leave(c.side(c.target), c.idx(c.target), 'hand'); },
    bottom(c) { this.leave(c.side(c.target), c.idx(c.target), 'bottom'); },
    givedon(c) { const o = c.target === 'L' ? c.P.leader : c.P.chars[c.idx(c.target)]; const n = Math.min(c.d.n, c.P.don.rested); c.P.don.rested -= n; o.don += n; },
    activedon(c) { const n = Math.min(c.d.n, c.P.don.rested); c.P.don.rested -= n; c.P.don.active += n; },
    lifetohand(c) { for (let k = 0; k < (c.d.n || 1); k++) if (c.P.life.length) c.P.hand.push(c.P.life.shift()); },
    trashhand(c) { const id = c.P.hand.splice(c.idx(c.target), 1)[0]; if (id) c.P.trash.push(id); },
    search(c) { const top = c.P.deck.splice(0, c.d.n); if (c.target != null) c.P.hand.push(top.splice(c.idx(c.target), 1)[0]); c.P.looking.push(...top); },
    restcards(c) { const rest = c.P.looking.splice(0); if (c.d.to === 'trash') c.P.trash.push(...rest); else c.P.deck.push(...rest); },
    adddon(c) { const n = Math.min(c.d.n, c.P.donDeck); c.P.donDeck -= n; if (c.d.rested) c.P.don.rested += n; else c.P.don.active += n; },
    costmod(c) { const X = c.side(c.target), ch = X.chars[c.idx(c.target)]; this.mod(X === c.P ? c.i : 1 - c.i, 'u' + ch.uid, null, c.d.dur, { cost: c.d.n }); },
    selfkw(c) { const k = this.keyOf(c.P, c.offer.ref); if (k) this.mod(c.i, k, null, c.d.dur, { kw: c.d.k }); },
    mill(c) { c.P.trash.push(...c.P.deck.splice(0, c.d.n)); },
    noblocker(c) { this.mod(c.i, 'noblocker', null, c.d.dur, { noblk: { power: c.d.power, cmp: c.d.cmp } }); },
    decktolife(c) { if (c.P.deck.length) c.P.life.unshift(c.P.deck.shift()); },
    selfactive(c) { const o = this.at(c.P, c.offer.ref); if (o) o.rested = false; },
    /* every one of your Characters of a type, those on the field as it resolves (§2-4-3: {type} is that type, a quoted part is within one of its types) */
    powerall(c) { const typed = ch => { const ts = ((this.card(ch.id) || {}).subtypes || '').split(/[;/]/).map(t => t.trim()); return c.d.type ? ts.includes(c.d.type) : ts.some(t => t.includes(c.d.typeq)); };
      c.P.chars.filter(typed).forEach(ch => this.mod(c.i, 'u' + ch.uid, c.d.n, c.d.dur)); },
    /* §8-3-1-5: the rest-DON!! symbol -- that many active DON!! rested */
    cost_restdon(c) { if (c.P.don.active < c.d.n) return { ok: false, why: 'not enough active DON!! to rest (§8-3-1-5)' }; c.P.don.active -= c.d.n; c.P.don.rested += c.d.n; },
    playself(c) { const P = c.P, o = c.offer, p = this.card(o.cardId); const h = P.hand.indexOf(o.cardId);
      if (h < 0) return { ok: false, why: 'that card is no longer in hand (§8-1-3-1-3)', gone: true };   // take 122: self-play found a card played twice
      P.hand.splice(h, 1); o.fromLife = false;
      if (p.type === 'Character') { if (P.chars.length >= 5) this.room(P, c.opts.trash); const ch = this.inst(o.cardId, this.g.turn); P.chars.push(ch); o.ref = P.chars.length - 1; o.uid = ch.uid; return { follow: this.offers(c.i, 'onplay', o.ref) }; }
      if (p.type === 'Stage') { this.placeStage(P, o.cardId); return { follow: this.offers(c.i, 'onplay', 'stage') }; }
      P.trash.push(o.cardId); },
    activate(c) { const o = c.offer; return { follow: this.offers(c.i, c.d.t, o.ref != null ? o.ref : null, o.ref != null ? null : o.cardId) }; },
    cost_trashhand(c) { if (c.target == null) return { ok: false, why: 'its cost cannot be paid: no card to trash (§8-3-1-3)' }; const id = c.P.hand.splice(c.idx(c.target), 1)[0]; if (id == null) return { ok: false, why: 'nothing to trash' }; c.P.trash.push(id); },
    /* §8-3-1-6: DON!! from the cost area, the Leader and the Characters, back to the DON!! deck -- the app returns rested ones first */
    cost_returndon(c) { const P = c.P; let n = c.d.n; if (this.fieldDon(P) < n) return { ok: false, why: 'not enough DON!! on the field (§8-3-1-6)' };
      const take = v => { const t = Math.min(n, v); n -= t; return t; }; P.don.rested -= take(P.don.rested); P.don.active -= take(P.don.active); P.leader.don -= take(P.leader.don); for (const ch of P.chars) ch.don -= take(ch.don); P.donDeck += c.d.n; },
    cost_restself(c) { const o = this.at(c.P, c.offer.ref); if (!o || o.rested) return { ok: false, why: 'already rested' }; o.rested = true; },
    playfromhand(c) { const P = c.P, id = P.hand.splice(c.idx(c.target), 1)[0]; if (P.chars.length >= 5) this.room(P, c.opts.trash); P.chars.push(this.inst(id, this.g.turn)); return { follow: this.offers(c.i, 'onplay', P.chars.length - 1) }; }
  },
  /* ---- by hand (take 122, landmine 212) --------------------------------
     The words a line uses name its moves: each op below is offered only when
     the line says it, as many times as the numbers beside that word say (1
     when none), and each is logged "by hand for <card>". Nothing else moves. */
  HAND_OPS: [
    ['draw', /\bdraw (?:up to )?(\d+)?/gi], ['trashhand', /\btrash (?:up to )?(\d+)? ?cards? from your hand\b/gi], ['ko', /\bK\.O\. (?:up to )?(\d+)?/g],
    ['rest', /\brest (?:up to )?(\d+)?(?! of)/gi], ['active', /\bset (?:up to )?(\d+)?[^.]*?\bas active\b/gi], ['tohand', /\breturn (?:up to )?(\d+)?[^.]*?\bto (?:the owner['\u2019]s|your|their) hand\b/gi],
    ['bottom', /\bplace (?:up to )?(\d+)?[^.]*?\bat the bottom of (?:the owner['\u2019]s|your|their) deck\b/gi], ['givedon', /\bgive (?:[^.]*?\bup to )?(\d+)? ?(?:rested |active )?DON!!/gi],
    ['adddon', /\badd (?:up to )?(\d+)? ?DON!! cards? from your DON!! deck\b/gi], ['returndon', /\bDON!! [\u2212-](\d+)|\breturn (\d+)? ?DON!! cards? [^.]*?to (?:your|their) DON!! deck\b/gi],
    ['lifetohand', /\badd (?:up to )?(\d+)? ?cards? from the top (?:or bottom )?of your Life cards to your hand\b/gi], ['decktolife', /\bfrom the top of your deck to the top of your Life cards\b/gi],
    ['handtolife', /\badd (?:up to )?(\d+)? ?cards? from your hand to the top of your Life cards\b/gi], ['chartolife', /\badd (?:up to )?(\d+)? of your Characters?[^.:]*?\bto the top of your Life cards\b/gi],
    ['opplifetrash', /\btrash (?:up to )?(\d+)? of your opponent['\u2019]s Life cards?\b/gi], ['handtotop', /\bplace the revealed card at the top of your deck\b/gi],
    ['mill', /\btrash (\d+)? ?cards? from the top of your deck\b/gi], ['play', /\bplay (?:up to )?(\d+)?/gi], ['look', /\blook at (\d+)? ?cards? from the top of your deck\b/gi]],
  handOps(raw) { const txt = String(raw || '').replace(/^(\[[^\]]+\]\s*)+/, ''); const ops = {};
    for (const [op, rx] of this.HAND_OPS) for (const m of txt.matchAll(rx)) { const n = +(m[1] || m[2]) || 1; ops[op] = (ops[op] || 0) + (op === 'look' ? n : Math.min(n, 10)); }
    const pw = [...txt.matchAll(/([+\u2212-])(\d+) power\b/g)].map(m => (m[1] === '+' ? 1 : -1) * +m[2]); if (pw.length) ops.power = pw;
    /* where looked-at cards may go is the line's too (take 122's look: "top or bottom of the deck" was offered hand and trash);
       what is not moved goes back on top as it was (§11-3-3) */
    if (ops.look) { const rv = txt.match(/\b(?:reveal|add) up to (\d+)[^.;]*?\bto your hand\b/i) || txt.match(/\badd (?:it|them)[^.;]*?\bto your hand\b/i);
      if (rv) ops.lookhand = +rv[1] || 1;
      if (/\bbottom of (?:the|your) deck\b/i.test(txt)) ops.lookbottom = ops.look;
      if (/\btrash (?:the rest|them|the remaining|up to \d+ of them|\d+ of them)\b|\bthe rest (?:in|into) (?:the|your) trash\b/i.test(txt)) ops.looktrash = ops.look; }
    /* whose cards, how long, from where -- the words say that too (take 122, the Leaders' proofs: a tray offered both sides whatever
       the line said, a "+2000 until the start of your next turn" lasted the turn, "from your hand to the top of your Life" moved the
       deck's top card). ops._ holds these bounds; everything else in ops is a count */
    const side = cl => /opponent['\u2019]s/i.test(cl) ? 'opp' : /\b(?:your|this)\b/i.test(cl) ? 'own' : 'any';
    /* a clause ends at a stop followed by a space: the dots of "K.O." and of "Monkey.D.Luffy" are inside it */
    const nt = txt.replace(/K\.O\./g, 'K_O_'), ends = [...nt.matchAll(/[.:;](?=\s|$)/g)].map(m => m.index);
    const clauseAt = k => { const a = ends.filter(e => e < k).pop(), b = ends.find(e => e >= k); return nt.slice(a == null ? 0 : a + 1, b == null ? undefined : b + 1); };
    const B = {}, where = {}, join = (op, s) => { where[op] = where[op] && where[op] !== s ? 'any' : s; };
    for (const [op, rx] of this.HAND_OPS) if (['ko', 'rest', 'tohand', 'bottom'].includes(op)) for (const m of txt.matchAll(rx)) join(op, side(clauseAt(m.index)));
    if (ops.power) { for (const m of txt.matchAll(/([+\u2212-])(\d+) power\b/g)) join('power', side(clauseAt(m.index)));
      B.dur = /until the start of your next turn/i.test(txt) ? 'nextturn' : /during this battle/i.test(txt) ? 'battle' : 'turn'; }
    if (Object.keys(where).length) B.where = where;
    if (ops.lifetohand && /from the top or bottom of your Life cards/i.test(txt)) B.lifebottom = true;
    if (ops.givedon) { const m = txt.match(/\bgive [^.]*?DON!![^.]*/i), cl = m ? m[0] : '';
      if (/\brested DON!!/i.test(cl)) B.donFrom = 'rested'; else if (/\bactive DON!!/i.test(cl)) B.donFrom = 'active';
      B.giveTo = /Leader/.test(cl) && /Character/.test(cl) ? 'any' : /Leader/.test(cl) ? 'leader' : /Character/.test(cl) ? 'chars' : 'any'; }
    if (Object.keys(B).length) ops._ = B;
    return ops; },
  /* the moves the open tray allows now, for the player who resolves it */
  handMoves(i) { const g = this.g, H = g.hand; if (!H || H.i !== i) return []; const P = this.P(i), O = this.P(1 - i), L = H.left, out = [];
    const B = L._ || {}, W = B.where || {}, refs = X => ['leader'].concat(X.chars.map((c, k) => k));
    const on = op => [[0, P], [1, O]].filter(([s]) => !W[op] || W[op] === 'any' || W[op] === (s === 0 ? 'own' : 'opp'));
    if (L.draw > 0 && P.deck.length) out.push({ t: 'hand', op: 'draw' });
    if (L.trashhand > 0) P.hand.forEach((id, h) => out.push({ t: 'hand', op: 'trashhand', h }));
    if (L.ko > 0) on('ko').forEach(([s, X]) => X.chars.forEach((c, k) => out.push({ t: 'hand', op: 'ko', side: s, k })));
    if (L.rest > 0) on('rest').forEach(([s, X]) => refs(X).forEach(ref => { if (!this.at(X, ref).rested) out.push({ t: 'hand', op: 'rest', side: s, ref }); }));
    if (L.active > 0) refs(P).forEach(ref => { if (this.at(P, ref).rested) out.push({ t: 'hand', op: 'active', side: 0, ref }); });
    if (L.active > 0 && P.don.rested > 0) out.push({ t: 'hand', op: 'activedon' });
    if (Array.isArray(L.power)) [...new Set(L.power)].forEach(v => on('power').forEach(([s, X]) => refs(X).forEach(ref => out.push({ t: 'hand', op: 'power', v, side: s, ref }))));
    if (L.tohand > 0) on('tohand').forEach(([s, X]) => X.chars.forEach((c, k) => out.push({ t: 'hand', op: 'tohand', side: s, k })));
    if (L.bottom > 0) on('bottom').forEach(([s, X]) => X.chars.forEach((c, k) => out.push({ t: 'hand', op: 'bottom', side: s, k })));
    if (L.givedon > 0) refs(P).filter(ref => B.giveTo === 'leader' ? ref === 'leader' : B.giveTo === 'chars' ? ref !== 'leader' : true).forEach(ref => {
      if (P.don.rested > 0 && B.donFrom !== 'active') out.push({ t: 'hand', op: 'givedon', ref, from: 'rested' }); if (P.don.active > 0 && B.donFrom !== 'rested') out.push({ t: 'hand', op: 'givedon', ref, from: 'active' }); });
    if (L.adddon > 0 && P.donDeck > 0) { out.push({ t: 'hand', op: 'adddon', rested: false }); out.push({ t: 'hand', op: 'adddon', rested: true }); }
    if (L.returndon > 0 && this.fieldDon(P) > 0) out.push({ t: 'hand', op: 'returndon' });
    if (L.lifetohand > 0 && P.life.length) { out.push({ t: 'hand', op: 'lifetohand' }); if (B.lifebottom && P.life.length > 1) out.push({ t: 'hand', op: 'lifetohand', end: 'bottom' }); }
    if (L.handtolife > 0) P.hand.forEach((id, h) => out.push({ t: 'hand', op: 'handtolife', h }));
    if (L.chartolife > 0) P.chars.forEach((c, k) => out.push({ t: 'hand', op: 'chartolife', k }));
    if (L.opplifetrash > 0 && O.life.length) out.push({ t: 'hand', op: 'opplifetrash' });
    if (L.handtotop > 0) P.hand.forEach((id, h) => out.push({ t: 'hand', op: 'handtotop', h }));
    if (L.decktolife > 0 && P.deck.length) out.push({ t: 'hand', op: 'decktolife' });
    if (L.mill > 0 && P.deck.length) out.push({ t: 'hand', op: 'mill' });
    if (L.play > 0) [['hand', P.hand], ['trash', P.trash]].forEach(([z, list]) => list.forEach((id, k) => { const p = this.card(id); if (!p || !['Character', 'Stage'].includes(p.type)) return;
      if (p.type === 'Character' && P.chars.length >= 5) P.chars.forEach((c, t) => out.push({ t: 'hand', op: 'play', zone: z, k, trash: t })); else out.push({ t: 'hand', op: 'play', zone: z, k }); }));
    if (L.look > 0 && P.deck.length && !P.looking.length) out.push({ t: 'hand', op: 'look' });
    P.looking.forEach((id, k) => ['hand', 'bottom', 'trash'].forEach(to => { if (L['look' + to] > 0) out.push({ t: 'hand', op: 'lookto', k, to }); }));
    return out; },
  handOp(i, a) { const g = this.g, H = g.hand; const P = this.P(i), O = this.P(1 - i);
    if (!this.handMoves(i).some(x => Object.keys(x).every(k => x[k] === a[k]))) return { ok: false, why: 'not a move this line names, or none left' };
    const X = a.side === 1 ? O : P, xi = a.side === 1 ? 1 - i : i, nm = id => (this.card(id) || {}).name || '?';
    const spend = op => { if (op === 'power') { const L = H.left.power; L.splice(L.indexOf(a.v), 1); } else if (op === 'lookto') H.left['look' + a.to]--; else if (op !== 'look') H.left[op === 'activedon' ? 'active' : op]--; };   // a DON!! set active spends the line's 'set ... as active' (take 122: it spent a budget no line has, and never ran out)
    const say = this.HAND[a.op].call(this, { i, P, X, xi, a, H, nm });
    spend(a.op); H.n = (H.n || 0) + 1; this.log(`by hand for ${nm(H.cardId)}: ${say}`); return { ok: true }; },
  /* what each by-hand move does; returns the words the log says after "by hand for <card>:" */
  HAND: {
    draw(c) { this.draw(c.i, 1); return 'draws 1'; },
    trashhand(c) { const id = c.P.hand.splice(c.a.h, 1)[0]; c.P.trash.push(id); return `trashes ${c.nm(id)} from hand`; },
    ko(c) { const ch = this.leave(c.X, c.a.k, 'trash'); this.g.queue.splice(1, 0, ...this.offers(c.xi, 'onko', null, ch.id), ...this.onKO()); return `K.O.s ${c.nm(ch.id)}`; },
    rest(c) { const o = this.at(c.X, c.a.ref); o.rested = true; return `rests ${c.nm(o.id)}`; },
    active(c) { const o = this.at(c.P, c.a.ref); o.rested = false; return `sets ${c.nm(o.id)} active`; },
    activedon(c) { c.P.don.rested--; c.P.don.active++; return 'sets a DON!! active'; },
    power(c) { const dur = (c.H.left._ || {}).dur || 'turn'; this.mod(c.xi, this.keyOf(c.X, c.a.ref), c.a.v, dur);
      return `${c.a.v > 0 ? '+' : ''}${c.a.v} power to ${c.nm(this.at(c.X, c.a.ref).id)} ${{ turn: 'this turn', battle: 'this battle', nextturn: 'until the start of the next turn' }[dur]}`; },
    tohand(c) { const ch = this.leave(c.X, c.a.k, 'hand'); return `returns ${c.nm(ch.id)} to its owner\u2019s hand`; },
    bottom(c) { const ch = this.leave(c.X, c.a.k, 'bottom'); return `places ${c.nm(ch.id)} at the bottom of its owner\u2019s deck`; },
    givedon(c) { const o = this.at(c.P, c.a.ref); if (c.a.from === 'rested') c.P.don.rested--; else c.P.don.active--; o.don++; return `gives a ${c.a.from} DON!! to ${c.nm(o.id)}`; },
    adddon(c) { c.P.donDeck--; if (c.a.rested) c.P.don.rested++; else c.P.don.active++; return `adds a DON!! from the DON!! deck${c.a.rested ? ', rested' : ''}`; },
    returndon(c) { const P = c.P; if (P.don.rested) P.don.rested--; else if (P.don.active) P.don.active--; else if (P.leader.don) P.leader.don--; else P.chars.find(x => x.don).don--; P.donDeck++; return 'returns a DON!! to the DON!! deck'; },
    lifetohand(c) { c.P.hand.push(c.a.end === 'bottom' ? c.P.life.pop() : c.P.life.shift()); return `adds the ${c.a.end === 'bottom' ? 'bottom' : 'top'} Life card to hand`; },
    handtolife(c) { c.P.life.unshift(c.P.hand.splice(c.a.h, 1)[0]); return 'adds a card from hand to the top of Life'; },   // face down: the log does not name it
    chartolife(c) { const ch = this.leave(c.P, c.a.k, 'life'); return `adds ${c.nm(ch.id)} to the top of Life`; },
    opplifetrash(c) { const O = this.P(1 - c.i), id = O.life.shift(); O.trash.push(id); return `trashes the top card of the opponent\u2019s Life (${c.nm(id)})`; },
    handtotop(c) { const id = c.P.hand.splice(c.a.h, 1)[0]; c.P.deck.unshift(id); return 'places a card from hand at the top of the deck'; },   // unrevealed: hand to deck, never shown (take 123)
    decktolife(c) { c.P.life.unshift(c.P.deck.shift()); return 'adds the top of the deck to the top of Life'; },
    mill(c) { c.P.trash.push(c.P.deck.shift()); return 'trashes the top card of the deck'; },
    play(c) { const P = c.P, list = c.a.zone === 'trash' ? P.trash : P.hand; const id = list.splice(c.a.k, 1)[0];
      if (this.card(id).type === 'Character') { if (P.chars.length >= 5) this.room(P, c.a.trash); P.chars.push(this.inst(id, this.g.turn)); this.g.queue.splice(1, 0, ...this.offers(c.i, 'onplay', P.chars.length - 1)); }
      else { this.placeStage(P, id); this.g.queue.splice(1, 0, ...this.offers(c.i, 'onplay', 'stage')); }
      return `plays ${c.nm(id)} from the ${c.a.zone}`; },
    look(c) { const n = Math.min(c.H.left.look, c.P.deck.length); c.P.looking.push(...c.P.deck.splice(0, n)); c.H.left.look = 0; return `looks at the top ${n}`; },
    lookto(c) { const id = c.P.looking.splice(c.a.k, 1)[0]; if (c.a.to === 'hand') c.P.hand.push(id); else if (c.a.to === 'bottom') c.P.deck.push(id); else c.P.trash.push(id); return `puts a looked-at card to the ${c.a.to}`; }
  },
  /* ---- one entry point (take 122) ------------------------------------- */
  /* whose decision the game waits on: the mulligan in order (§5-2-1-6), the head of the effect queue (§8-6), the defender in battle, else the turn player */
  who() { const g = this.g; if (!g || g.over !== null) return null;
    if (g.phase === 'mulligan') { const k = [g.first, 1 - g.first].find(x => g.players[x].mulliganed === null); return k == null ? null : k; }
    if (g.queue && g.queue.length) return g.queue[0].i;
    if (g.phase === 'battle') return g.battle.def;
    return g.active; },
  /* every move the engine would accept from seat i now -- the board's buttons, the app's opponent and self-play read this one list */
  legal(i) { const g = this.g, out = []; if (!g || this.who() !== i) return out; const P = this.P(i);
    if (g.phase === 'mulligan') return [{ t: 'keep' }, { t: 'mull' }];
    if (g.queue.length) { const o = g.queue[0];
      if (g.hand) return this.handMoves(i).concat([{ t: 'handdone' }]);
      if (o.hand) return [{ t: 'fxhand' }].concat(this.declinable(o) ? [{ t: 'fxskip' }] : []);
      const d = o.steps[o.step], T = this.targetsOf(o), tg = T && T.length ? T.map(t => t.ref) : [];
      if (!this.canPay(i, o.uid != null ? this.refOf(P, o.uid) : o.ref, d)) return [{ t: 'fxskip' }];   // a cost is read when it is paid, not when it was queued (§8-3-1-3)
      const needRoom = ref => { const id = d.a === 'playself' ? o.cardId : (d.a === 'playfromhand' ? P.hand[+String(ref).slice(1)] : null); const p = id && this.card(id); return !!(p && p.type === 'Character' && P.chars.length >= 5); };
      tg.forEach(ref => { if (needRoom(ref)) P.chars.forEach((c, k) => out.push({ t: 'fx', target: ref, trash: k })); else out.push({ t: 'fx', target: ref }); });
      if ((!tg.length && d.a !== 'cost_trashhand') || (d.upto && this.TARGETED.includes(d.a))) { if (needRoom(null)) P.chars.forEach((c, k) => out.push({ t: 'fx', target: null, trash: k })); else out.push({ t: 'fx', target: null }); }
      if (this.declinable(o)) out.push({ t: 'fxskip' }); return out; }   // an automatic effect resolves in full (§8-1-3-1); a cost that no longer can be paid ends the line (above)
    if (g.phase === 'battle') { const b = g.battle;
      if (b.step === 'block') { this.blockers().forEach(x => out.push({ t: 'block', k: x.ref })); out.push({ t: 'noblock' }); return out; }
      this.counters().forEach(x => out.push({ t: 'counter', h: x.h })); this.counterEvents().forEach(x => out.push({ t: 'cevent', h: x.h })); out.push({ t: 'resolve' }); return out; }
    P.hand.forEach((id, h) => { const v = this.canPlay(i, h); if (!v.ok) return; if (v.full) P.chars.forEach((c, k) => out.push({ t: 'play', h, trash: k })); else out.push({ t: 'play', h }); });
    const refs = ['leader'].concat(P.chars.map((c, k) => k));
    if (P.don.active > 0) refs.forEach(ref => out.push({ t: 'give', ref }));
    refs.concat(P.stage != null ? ['stage'] : []).forEach(ref => this.offers(i, 'main', ref).forEach(o => out.push({ t: 'activate', ref, n: o.n })));
    refs.forEach(ref => { if (this.canAttack(i, ref).ok) this.targets(i, ref).forEach(t => out.push({ t: 'attack', ref, target: t.ref })); });
    out.push({ t: 'end' }); return out; },
  /* ---- the view a seat is handed (take 123) ---------------------------------
     Everything a board draws, and nothing its seat may not see. Public: the fields, the trashes, DON!!, the battle,
     the effect resolving, the log. Private, and kept out by the engine rather than hidden by the screen: the other
     hand (a count, §3-4), both Lives and both decks (counts: nobody looks at a Life card, §3-10, or a deck, §3-2), the cards being
     looked at (only to the player looking), an effect's choices and the moves (only to the player deciding). A
     redesigned board draws from this and cannot show what it was never given. docs/SIM-UI.md is the contract. */
  /* the picture a card is drawn with (take 126; take 124's placeholder rule went into the pipeline, which ships the host's
     "Image Coming Soon" as no picture -- landmine 240). Its own, when the runner saw it serve (it has a hash). Else the
     picture of another printing of the same card that the build chose (CAT.lend, hashes.lend_map: the same number and name,
     the same treatment first, then the oldest -- a real scan more often than a reprint's, whose picture is often the
     publisher's SAMPLE image, landmine 151), and only if it is the same card: the owner, on the table's blank cards, "ensure we get
     as many pictures as possible". The table plays the card, not the printing; every printing of a number plays the same.
     Else its own URL, which the host may publish before the next build (a refused picture falls away and the card is drawn
     in its colours). MEASURED 30 Sept: 6,749 of 7,006 card printings have their own picture; 194 of the other 257 borrow
     one; the 63 left are EB05's and OP18's, not yet photographed. Collect keeps each printing's own picture: 535 of 1,722
     groups of one card's same-treatment printings hold two or more illustrations (landmine 241). */
  picOf(p) { if (!p) return null; if (p.hash != null || !p.num) return p.img ? p : null;
    const q = CAT.lend ? CAT.byId.get(+CAT.lend[p.id]) : null;
    return q && q.img && q.hash != null && q.num === p.num && q.name === p.name ? q : (p.img ? p : null); },
  face(id, extra) { const p = this.card(id) || {}, q = typeof artUrl === 'function' ? this.picOf(p) : null;
    return Object.assign({ id, num: p.num || null, name: p.name || '?', type: p.type || null, cost: p.cost != null ? this.cost(p) : null, printedPower: p.power != null ? this.num(p.power) : null,
      counter: this.num(p.counter) || null, kw: (p.kw || '').split('|').filter(Boolean), colours: typeof gameColours === 'function' ? gameColours(p) : [], text: p.text || '',
      art: q ? { thumb: artUrl(q), large: artUrl(q, 'large'), ground: artColours(p) } : null }, extra || {}); },
  /* a card on the field, as its owner and the opponent both see it */
  onField(xi, ref) { const X = this.P(xi), o = this.at(X, ref), unit = ref !== 'stage', kw = unit ? this.kwOf(xi, ref) : [], f = this.face(o.id);
    return Object.assign(f, { uid: o.uid, seat: xi, ref, rested: o.rested, don: o.don, turn: o.turn, power: unit ? this.power(xi, ref) : null, keywords: kw, granted: kw.filter(k => !f.kw.includes(k)),
      unapplied: this.unapplied(o.id).map(e => e.raw), lines: this.fx(o.id).map(e => ({ t: e.t, raw: e.raw, does: this.describe(e), proof: this.proofOf(o.id, e) })) }); },
  view(seat) { const g = this.g; if (!g) return null; const who = this.who();
    const side = xi => { const X = this.P(xi), mine = xi === seat, given = X.leader.don + X.chars.reduce((a, c) => a + c.don, 0);
      return { seat: xi, name: X.name, leader: this.onField(xi, 'leader'), chars: X.chars.map((c, k) => this.onField(xi, k)), stage: X.stage ? this.onField(xi, 'stage') : null,
        hand: mine ? X.hand.map((id, h) => this.face(id, { h, play: this.canPlay(xi, h) })) : null, handCount: X.hand.length,
        lifeCount: X.life.length, deckCount: X.deck.length, trash: X.trash.map(id => this.face(id)),
        looking: mine ? X.looking.map(id => this.face(id)) : null, lookingCount: X.looking.length,
        don: { active: X.don.active, rested: X.don.rested, given, deck: X.donDeck }, mulliganed: X.mulliganed, taken: X.taken, lost: X.lost }; };
    const b = g.battle, at = b && this.locate(), o = g.queue[0], d = o && o.steps[o.step];
    /* a [Trigger] not yet used is still a face-down Life card to the other seat: its player may add it to hand without
       revealing it (§10-1-5), so the other seat is told only that the game waits on a [Trigger] */
    const shut = !!(o && o.fromLife && o.step === 0 && o.i !== seat);
    return { v: 1, take: TAKE, rules: this.RULES, seat, turn: g.turn, phase: g.phase, active: g.active, first: g.first, over: g.over, who, bot: g.bot != null ? g.bot : null,
      me: side(seat), them: side(1 - seat),
      battle: b ? { att: b.att, def: b.def, step: b.step, blocked: b.blocked, counter: b.counter, powers: this.battlePowers(),
        attacker: at.aref != null ? this.onField(b.att, at.aref) : null, target: at.dref != null ? this.onField(b.def, at.dref) : null, unblockable: at.aref != null && this.has(b.att, at.aref, 'Unblockable') } : null,
      offer: shut ? { seat: o.i, hidden: true, cardId: null, name: null, t: o.e.t, raw: null, hand: null, proof: null, wrong: null, does: null, step: null, steps: null, cost: null, choices: null, queued: g.queue.length }
        : o ? { seat: o.i, hidden: false, cardId: o.cardId, name: (this.card(o.cardId) || {}).name || 'Effect', t: o.e.t, raw: o.e.raw, hand: !!o.hand, proof: this.proofOf(o.cardId, o.e), wrong: o.e.wrong || null,
        does: this.describe(o.e), step: o.step, steps: o.steps.length, cost: !!(d && /^cost_/.test(d.a)), choices: o.i === seat && !o.hand ? this.choicesOf(o) : null, queued: g.queue.length } : null,
      tray: g.hand ? (g.hand.i === seat ? { mine: true, cardId: g.hand.cardId, raw: g.hand.raw, left: JSON.parse(JSON.stringify(g.hand.left)) } : { mine: false, cardId: g.hand.cardId, raw: g.hand.raw }) : null,
      last: g.last ? this.lastFor(seat) : null,
      /* this turn's start as the engine made it (take 124): whose, the cards drawn, the DON!! added -- counts, public to both */
      start: g.start && g.start.turn === g.turn ? Object.assign({}, g.start) : null,
      legal: who === seat ? this.legal(seat) : [], log: g.log.slice() }; },
  /* the last battle's result as a seat may see it (take 124): a Life card that went to hand is its owner's to know -- its name,
     and whether it has a [Trigger] -- and the other seat's only when [Banish] trashed it face up (§10-1-3); to the other seat it
     is a card that left the Life, no more (§3-10, §10-1-5). `n` numbers the result, so a board shows each one once. */
  lastFor(seat) { const L = this.g.last, own = seat === L.def;
    return { n: L.n, turn: L.turn, att: L.att, def: L.def, a: L.a, d: L.d, win: !!L.win, gone: !!L.gone, ko: L.ko || null,
      life: (L.life || []).map(l => own || l.banished ? { id: l.id, name: l.name, banished: !!l.banished, trigger: own && !!l.trigger } : { id: null, name: null, banished: false, trigger: false }) }; },
  /* an effect's choices as the deciding seat's board draws them (take 124): a hand card, or a card looked at from the top of the
     deck, carries its face -- that seat already sees it; a card on the field is found on the table by its ref */
  choicesOf(o) { const T = this.targetsOf(o); if (!T) return T; const P = this.P(o.i);
    return T.map(t => { const r = String(t.ref), k = +r.slice(1), id = r[0] === 'h' ? P.hand[k] : r[0] === 'd' ? P.deck[k] : null;
      return id != null ? Object.assign({}, t, { face: this.face(id) }) : t; }); },
  /* the ONE way a move is made. A move is a transaction: refused, the game is restored exactly as it was and the
     move is not recorded -- so a refusal changes nothing by construction, and two copies of a game fed the same
     moves stay the same game (take 122: self-play found a refused move that had already marked Once Per Turn) */
  act(i, a) { const g = this.g; if (!g) return { ok: false, why: 'no game' };
    if (g.over !== null) return { ok: false, why: 'the game is over' };
    if (a.t === 'concede') { this.P(i).lost = 'concede'; this.log(`${this.P(i).name} concedes (§1-2-3)`); this.rules(); return this.rec(i, a, { ok: true }); }
    if (this.who() !== i) return { ok: false, why: 'not your decision now' };
    const keep = JSON.stringify(g), uid = this.uid;
    const r = this.step(i, a); if (!r.ok) { this.restore(keep, uid); return r; }
    this.rules(); this.drain(); return this.rec(i, a, r); },
  /* the restore writes into the objects the game already has -- the game and each player keep their identity, so
     whoever holds SIM.g or SIM.P(i) still holds the game (a Character or an offer is a new object after it) */
  restore(keep, uid) { const g = this.g, back = JSON.parse(keep), players = g.players;
    for (const k of Object.keys(g)) delete g[k]; Object.assign(g, back, { players });
    players.forEach((P, k) => { for (const f of Object.keys(P)) delete P[f]; Object.assign(P, back.players[k]); }); this.uid = uid; },
  rec(i, a, r) { this.g.actions.push(Object.assign({ s: i }, a)); return r; },
  queue(list) { if (list && list.length) this.g.queue.push(...list); },
  /* 'end' waits for the End Phase's offers to be resolved or declined (§6-6-1-1), then the turn ends */
  drain() { const g = this.g; if (g.over !== null) return;
    /* §8-1-3-1-3: an effect whose card left the field before it began does not activate -- it leaves the queue by itself, no move
       asked of anyone (take 124: it waited for one, offered its targets, and took any move as its end) */
    while (g.queue.length && !g.hand) { const o = g.queue[0]; if (o.step !== 0 || o.uid == null || this.refOf(this.P(o.i), o.uid) != null) break;
      g.queue.shift(); this.log(`${this.card(o.cardId).name}: its card has left the field; the effect does not activate (§8-1-3-1-3)`); }
    if (g.queue.length) return;
    /* §7-1-1-4, §7-1-2-3: a battle whose attacker or target has left the field ends once nothing waits to resolve */
    if (g.battle && !this.locate().ok) { this.log('the battle ends: a card in it has left the field (§7-1-1-4)'); this.endBattle(); }
    if (g.after === 'end' && g.phase === 'main') { g.after = null; this.endTurn(); } },
  step(i, a) { const g = this.g, P = this.P(i), main = g.phase === 'main' && !g.queue.length;
    const refuse = why => ({ ok: false, why });
    switch (a.t) {
      case 'keep': case 'mull': if (g.phase !== 'mulligan') return refuse('not the mulligan (§5-2-1-6)'); this.mulligan(i, a.t === 'mull'); return { ok: true };
      case 'play': { if (!main) return refuse(g.queue.length ? 'resolve the effect first (§8-6)' : 'not your Main Phase (§6-5-3)'); const r = this.play(i, a.h, { trash: a.trash }); if (!r.ok) return r;
        this.queue(r.card.type === 'Event' ? this.offers(i, 'evmain', null, r.card.id) : this.offers(i, 'onplay', r.ref)); return r; }
      case 'give': if (!main) return refuse('not now (§6-5-5)'); return this.giveDon(i, a.ref);
      case 'activate': { if (!main) return refuse(g.queue.length ? 'resolve the effect first (§8-6)' : 'in the Main Phase, not in battle (§10-2-2)');
        const list = this.offers(i, 'main', a.ref).filter(o => a.n == null || o.n === a.n);
        if (!list.length) return refuse(this.whyNot(i, 'main', a.ref, a.n));
        this.queue([list[0]]); this.log(`${P.name} activates ${this.card(list[0].cardId).name}`); return { ok: true }; }
      case 'attack': { if (!main) return refuse('not now (§6-5-6)'); const r = this.attack(i, a.ref, a.target); if (!r.ok) return r;
        this.queue(this.offers(i, 'attack', a.ref)); const O = this.P(1 - i);    // §7-1-1-3: [When Attacking], then [On Your Opponent\u2019s Attack] (§10-2-16)
        this.queue(['leader'].concat(O.chars.map((c, k) => k), O.stage != null ? ['stage'] : []).flatMap(ref => this.offers(1 - i, 'oppattack', ref))); return r; }
      case 'block': { if (g.phase !== 'battle' || g.queue.length) return refuse('not the Block Step (§7-1-2)'); const r = this.block(a.k); if (r.ok) this.queue(this.offers(i, 'onblock', a.k)); return r; }
      case 'noblock': if (g.phase !== 'battle' || g.battle.step !== 'block' || g.queue.length) return refuse('not the Block Step (§7-1-2)'); this.noBlock(); return { ok: true };
      case 'counter': if (g.queue.length) return refuse('resolve the effect first (§8-6)'); return this.counter(a.h);
      case 'cevent': { if (g.queue.length) return refuse('resolve the effect first (§8-6)'); const r = this.playCounterEvent(a.h); if (r.ok) this.queue(this.offers(i, 'evcounter', null, r.id)); return r; }
      case 'resolve': { if (g.phase !== 'battle' || g.battle.step !== 'counter' || g.queue.length) return refuse('not the Damage Step (§7-1-4)'); const res = this.resolve();
        if (g.over === null) { res.life.forEach(l => { if (l.trigger) this.queue(this.offers(i, 'trigger', null, l.id, true)); }); if (res.koId) { this.queue(this.offers(i, 'onko', null, res.koId)); this.queue(this.onKO()); } }   // §8-6-2: after the damage
        return { ok: true, res }; }
      case 'fx': { const o = g.queue[0]; if (!o || o.hand || g.hand) return refuse('no effect to apply');
        const r = this.apply(i, o, a.target == null ? null : a.target, { trash: a.trash });
        if (!r.ok) { if (r.gone) { g.queue.shift(); this.log(`${this.card(o.cardId).name}: its card has left the field; the effect does not resolve (§8-1-3-1-3)`); return { ok: true, gone: true }; } return r; }
        /* what its steps set off waits its turn: first when it is over, right after it while it still resolves (§8-6; take 124 --
           an [On K.O.] set off by a step that was not the last was dropped) */
        if (r.done) { g.queue.shift(); if (r.follow && r.follow.length) g.queue.unshift(...r.follow); } else if (r.follow && r.follow.length) g.queue.splice(1, 0, ...r.follow); return r; }
      case 'fxskip': { const o0 = g.queue[0], d0 = o0 && o0.steps && o0.steps[o0.step];
        if (o0 && o0.hand && !this.declinable(o0)) return refuse('it happens in full: open it and do what its words say, then Done (\u00a78-1-3-1)');
        if (o0 && !this.declinable(o0) && d0 && this.canPay(i, o0.uid != null ? this.refOf(P, o0.uid) : o0.ref, d0)) return refuse(o0.step > 0 && /^cost_/.test(d0.a) ? 'a cost once begun is paid in full, in order (§8-3)' : 'it resolves in full; an \u201cup to\u201d lets you choose none (§8-1-3-1)');
        const o = g.queue.shift(); if (!o) return refuse('no effect');
        if (o.fromLife && !o.step) this.log(`${this.P(o.i).name} adds the Life card to hand without revealing it (§10-1-5)`);
        else if (o.step > 0) { this.finish(i, o); this.log(`${this.card(o.cardId).name}: its cost cannot be paid now \u2014 the rest does not resolve (§8-3-1-3)`); }
        else if (o.hand) this.log(`${this.card(o.cardId).name}: the rest is declined`);
        return { ok: true }; }
      case 'fxhand': { const o = g.queue[0]; if (!o || !o.hand || g.hand) return refuse('no by-hand effect');
        if (o.uid != null) o.ref = this.refOf(P, o.uid);   // its card by instance, as apply() finds it (take 124: a Character gone before it shifted the place, and Once Per Turn read another card)
        if (o.e.if.some(c => c.c === 'opt')) { if (this.used(i, o)) return refuse('once per turn, and used this turn (§10-2-13)'); this.markUsed(i, o); }
        g.hand = { i, cardId: o.cardId, raw: o.e.raw, left: this.handOps(o.e.raw), fromLife: o.fromLife, n: 0 };
        this.log(`by hand: ${this.card(o.cardId).name} \u2014 ${o.e.raw.slice(0, 90)}`); return { ok: true }; }
      case 'hand': if (!g.hand) return refuse('no by-hand effect open'); return this.handOp(i, a);
      case 'handdone': { const H = g.hand; if (!H) return refuse('no by-hand effect open'); g.hand = null; g.queue.shift();
        this.log(`${this.card(H.cardId).name}: done by hand${H.n ? '' : ' \u2014 no move made'}`);   // take 124: the other seat sees it was finished, and how
        if (P.looking.length) P.deck.unshift(...P.looking.splice(0));      // §11-3-3: what was looked at and not moved goes back as it was
        if (H.fromLife) { const h = P.hand.indexOf(H.cardId); if (h >= 0) { P.hand.splice(h, 1); P.trash.push(H.cardId); } }   // §10-1-5-3
        return { ok: true }; }
      case 'end': { if (!main || g.active !== i) return refuse(g.queue.length ? 'resolve the effect first (§8-6)' : 'not your Main Phase (§6-5-2-1)');
        const O = this.P(1 - i), on = (X, xi, t) => ['leader'].concat(X.chars.map((c, k) => k), X.stage != null ? ['stage'] : []).flatMap(ref => this.offers(xi, t, ref));
        this.queue(on(P, i, 'endturn')); this.queue(on(O, 1 - i, 'endoppturn'));       // §6-6-1-1-2: the turn player\u2019s, then the other\u2019s
        if (g.queue.length) g.after = 'end'; else this.endTurn(); return { ok: true }; }
      default: return refuse('unknown move'); } },
  /* a game is its spec and its actions: replaying them rebuilds it exactly, or names the move that no longer holds */
  replay(spec, actions) { this.new(spec.decks[0], spec.decks[1], spec.first, { seed: spec.seed, bot: spec.bot });
    for (let k = 0; k < actions.length; k++) { const { s, ...a } = actions[k]; const r = this.act(s, a); if (!r.ok) return { ok: false, at: k, why: r.why }; } return { ok: true, g: this.g }; },
  /* what the engine will do with a line, in words (take 122): the proof sheets, the Report, and the board's offer read it.
     Take 124: a timing, a condition and a step are said by their own methods, so the log says a step in the same words
     (it said the engine's codes -- "givedon -> L" -- HANDOFF take 124, the audit's row 3); describe()'s words are unchanged. */
  TIMING: { onplay: 'On Play', attack: 'When Attacking', main: 'Activate: Main', onko: 'On K.O.', trigger: 'Trigger', onblock: 'On Block', endturn: 'End of Your Turn', evmain: 'Main', evcounter: 'Counter', static: 'while', whenko: 'When a Character is K.O.\u2019d' },
  condText(c) { return ({ donx: `${c.n} DON!! given`, opt: 'once per turn', yourturn: 'on your turn', oppturn: "on the opponent\u2019s turn", opplife: `the opponent at ${c.max} Life or less`, donfield: `${c.min}+ DON!! on your field`, leadertype: `your Leader is {${c.t}}`, leadername: `your Leader is ${c.name}`, life: `you at ${c.max} Life or less`, trash: `${c.min}+ cards in your trash`, donle: 'your DON!! at most the opponent\u2019s' }[c.c] || c.c); },
  stepText(d) { const T = this.TIMING;
    const up = d => d.upto ? 'up to ' : ''; const dur = d => ({ turn: ' this turn', nextturn: ' until your next turn', permanent: '', static: '', battle: ' this battle' }[d.dur] || '');
    const filt = d => [d.rested ? 'rested' : '', d.cost != null ? `cost ${d.cost} or less` : '', d.power != null ? `${d.power} power or less` : '', d.bpower != null ? `${d.bpower} base power or less` : ''].filter(Boolean).join(', ');
    switch (d.a) {
      case 'draw': return `draw ${d.n}`; case 'trashhand': return `trash ${up(d)}${d.n} from your hand`; case 'playself': return 'play this card';
      case 'activate': return `use this card\u2019s [${T[d.t] || d.t}]`; case 'playfromhand': return `play ${up(d)}1 ${d.type ? '{' + d.type + '} ' : ''}Character (${[d.cost != null ? 'cost ' + d.cost + ' or less' : '', d.power != null ? d.power + ' power or less' : ''].filter(Boolean).join(', ')}) from your hand, free`;
      case 'ko': return `K.O. ${up(d)}1 opponent\u2019s Character (${filt(d)})`; case 'rest': return `rest ${up(d)}1 opponent\u2019s Character${filt(d) ? ' (' + filt(d) + ')' : ''}`;
      case 'bounce': return `return ${up(d)}1 ${d.who === 'any' ? '' : "opponent\u2019s "}Character (${filt(d)}) to its owner\u2019s hand`; case 'bottom': return `put ${up(d)}1 Character (${filt(d)}) at the bottom of its owner\u2019s deck`;
      case 'adddon': return `add ${d.n} DON!! from the DON!! deck${d.rested ? ', rested' : ', active'}`; case 'power': return `${d.n > 0 ? '+' : ''}${d.n} power to ${d.who === 'prev' ? 'that card' : up(d) + (d.who === 'opp' ? "1 opponent\u2019s Character" : '1 of your Leader or Characters' + (d.notself ? ' other than this card' : ''))}${dur(d)}${d.sign_inferred ? ' (sign inferred)' : ''}`;
      case 'leaderpower': return `your Leader +${d.n} power${dur(d)}`; case 'search': return `look at the top ${d.n}; ${up(d)}1 ${[(d.types || []).map(t => '{' + t + '}').join(' or '), (d.names || []).join(' or '), d.name || '', d.cost_max != null ? 'cost ' + d.cost_max + ' or less' : '', d.cost_min != null ? 'cost ' + d.cost_min + ' or more' : ''].filter(Boolean).join(' / ') || 'card'}${d.not ? ' other than ' + d.not : ''} to your hand`;
      case 'restcards': return `the rest to the ${d.to === 'trash' ? 'trash' : 'bottom of the deck'}`; case 'costmod': return `${d.n} cost to ${up(d)}1 opponent\u2019s Character${dur(d)}`;
      case 'selfpower': return `this card +${d.n} power${dur(d)}`; case 'selfkw': return `this card gains [${d.k}]${dur(d)}`; case 'mill': return `trash the top ${d.n} of your deck`;
      case 'noblocker': return `your opponent cannot activate [Blocker]${d.power != null ? ` on a Character with ${d.power} power or ${d.cmp}` : ''}${dur(d)}`;
      case 'lifetohand': return `${d.n || 1} Life card${(d.n || 1) > 1 ? 's' : ''} to your hand`; case 'decktolife': return 'the top of your deck to the top of your Life'; case 'selfactive': return 'set this card active';
      case 'givedon': return `give ${up(d)}${d.n} rested DON!! to ${d.who === 'chars' ? '1 of your Characters' : 'your Leader' + (d.who === 'leader' ? '' : ' or 1 Character')}`;
      case 'powerall': return `+${d.n} power to every one of your ${d.type ? '{' + d.type + '}' : '"' + d.typeq + '"'} Characters${dur(d)}`; case 'cost_restdon': return `cost: rest ${d.n} active DON!!`; case 'activedon': return `set ${up(d)}${d.n} DON!! active`;
      case 'cost_trashhand': return `cost: trash ${d.n} from your hand`; case 'cost_returndon': return `cost: return ${d.n} DON!! to the DON!! deck`; case 'cost_restself': return 'cost: rest this card';
      default: return d.a; } },
  describe(e) { if (!e) return ''; if (e.hand) return 'by hand: ' + e.raw;
    const C = c => this.condText(c), st = (e.do || []).map(d => this.stepText(d) + (d.if ? ` (if ${d.if.map(C).join(', ')})` : ''));
    return `[${this.TIMING[e.t] || e.t}]${e.if.length ? ' ' + e.if.map(C).join(', ') + ':' : ''} ${st.join('; then ')}`; },
  /* a target as the log names it (take 124): a card on the field by its name; a hand card only when the step makes it public (played
     or trashed); a card from the deck never (a search need not reveal it) -- the log is in both views (landmine 224) */
  targetName(i, d, t) { const P = this.P(i), O = this.P(1 - i), r = String(t), k = +r.slice(1), nm = id => (this.card(id) || {}).name || 'a card';
    if (r === 'L') return nm(P.leader.id);
    if (r[0] === 'm') return P.chars[k] ? nm(P.chars[k].id) : 'a Character';
    if (r[0] === 'o') return O.chars[k] ? nm(O.chars[k].id) : 'a Character';
    if (r[0] === 'h') return ['playfromhand', 'trashhand', 'cost_trashhand'].includes(d.a) && P.hand[k] != null ? nm(P.hand[k]) : 'a card from hand';
    return 'a card'; }
};

/* ---- sim: the opponent (A23 step 3, take 55; on the one entry point since take 122) -----
   Legal and not clever, on purpose. It chooses only from the engine's legal()
   for its own seat, makes one move per call so the board can show each, and
   never reads the other hand or either deck. It declines what it cannot run:
   a by-hand effect is skipped, never guessed. Self-play (tools/selfplay.mjs)
   plays both seats with it. */
const BOT = {
  is(i) { return !!SIM.g && SIM.g.bot === i; },
  /* one move for seat i if the game waits on it; `hold` names moves the board keeps for the player to tap ('resolve') */
  move(i, hold = []) { if (!SIM.g || SIM.who() !== i) return null; const L = SIM.legal(i); if (!L.length) return null;
    const a = this.choose(i, L); if (!a || hold.includes(a.t)) return null; return SIM.act(i, a).ok ? a : null; },
  choose(i, L) { const g = SIM.g; if (g.phase === 'mulligan') return { t: 'keep' };
    if (g.queue.length) return this.effect(i, L); if (g.phase === 'battle') return this.defend(i, L); return this.main(i, L); },
  /* an offered effect: its first sensible target; a cost that would empty the hand declined */
  effect(i, L) { const g = SIM.g, P = SIM.P(i), o = g.queue[0]; if (g.hand) return { t: 'handdone' }; if (o.hand) return L.find(x => x.t === 'fxskip') || { t: 'fxhand' };
    const d = o.steps[o.step], skip = L.find(x => x.t === 'fxskip');
    if (skip && o.step === 0 && o.steps.some(st => st.a === 'cost_trashhand') && P.hand.length < 3) return skip;   // decided before a cost is begun (§8-3)
    const hurts = ['ko', 'rest', 'bounce', 'bottom', 'costmod'].includes(d.a) || (d.a === 'power' && d.n < 0);
    const weakest = P.chars.length ? P.chars.map((c, k) => ({ k, p: SIM.power(i, k) })).sort((a, b) => a.p - b.p)[0].k : null;
    const fx = L.filter(x => x.t === 'fx' && (x.trash == null || x.trash === weakest));
    return fx.find(x => x.target != null && (hurts ? /^o/.test(x.target) : !/^o/.test(x.target))) || fx.find(x => x.target == null) || skip || fx[0]; },
  /* block when a Character would die and a Blocker can take it; counter when the Leader would take damage at two Life or less */
  defend(i, L) { const b = SIM.g.battle, pw = SIM.battlePowers(), onLeader = SIM.locate().dref === 'leader';
    if (b.step === 'block') { const bl = L.find(x => x.t === 'block'); return !onLeader && pw.a >= pw.d && bl ? bl : { t: 'noblock' }; }
    if (pw.a >= pw.d && onLeader && SIM.P(i).life.length <= 2) { const P = SIM.P(i);
      const cs = L.filter(x => x.t === 'counter').sort((a, c) => SIM.num(SIM.card(P.hand[c.h]).counter) - SIM.num(SIM.card(P.hand[a.h]).counter)); if (cs.length) return cs[0]; }
    return { t: 'resolve' }; },
  /* the Main Phase: the dearest Character or Stage while there is room, a scripted [Activate: Main] once per card and line,
     spare DON!! to the Leader, then every attack -- the Leader at the Leader (games end), a Character at a rested Character it beats */
  main(i, L) { const P = SIM.P(i), O = SIM.P(1 - i), m = this.memo(i);
    const plays = L.filter(x => x.t === 'play' && x.trash == null).map(x => ({ x, p: SIM.card(P.hand[x.h]) })).filter(y => y.p.type === 'Character' || y.p.type === 'Stage').sort((a, b) => SIM.cost(b.p) - SIM.cost(a.p));
    if (plays.length) return plays[0].x;
    const act = L.find(x => x.t === 'activate' && !m.tried.has(x.ref + ':' + x.n) && !SIM.offers(i, 'main', x.ref).find(o => o.n === x.n).hand);
    if (act) { m.tried.add(act.ref + ':' + act.n); return act; }
    if (!m.attacked && L.some(x => x.t === 'give' && x.ref === 'leader')) return { t: 'give', ref: 'leader' };
    for (const ref of ['leader'].concat(P.chars.map((c, k) => k))) { const mine = L.filter(x => x.t === 'attack' && x.ref === ref); if (!mine.length) continue;
      const pw = SIM.power(i, ref); const prey = ref === 'leader' ? [] : mine.filter(x => x.target !== 'leader' && SIM.power(1 - i, x.target) <= pw).sort((a, b) => SIM.power(1 - i, b.target) - SIM.power(1 - i, a.target));
      m.attacked = true; return prey[0] || mine.find(x => x.target === 'leader') || mine[0]; }
    return { t: 'end' }; },
  memo(i) { const g = SIM.g; if (!this.m || this.m.g !== g || this.m.turn !== g.turn || this.m.i !== i) this.m = { g, turn: g.turn, i, tried: new Set(), attacked: false }; return this.m; }
};
