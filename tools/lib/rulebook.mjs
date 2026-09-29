/* The rulebook: the auditor's own model of the game (take 124; the owner: "after every turn ends audit all moves against the
 * rules and all card they played and ensure the actions they did with the card is legal per the cards rules and game rules").
 *
 * Written from the Comprehensive Rules (docs/RULES.md, v1.2.1) and the cards' parsed lines, apart from the engine: it reads the
 * catalogue -- a card's printed numbers, its keywords, its lines -- and the game as data, never the engine's code. For every
 * decision it answers two questions the engine answers too, and self-play compares the answers:
 *   legal(m, i)          every move the rules allow seat i now (the engine's legal() must offer exactly these)
 *   next(m, i, a, got)   the game the rules say follows move a -- the fields, hands, decks, Lives, trashes, DON!!, what applies
 *                        to each card, the effects waiting and in what order, the battle, the turn -- or the reason the move
 *                        is refused; `got` (the engine's game after the move) lends only what the rules leave to chance or to
 *                        the engine's naming: the new cards' uids and a mulligan's shuffle
 * diff(want, got) then names the first place the two games differ. A turn that ends is checked whole on the way: the End Phase,
 * then the next player's refresh, draw and DON!! (§6-2 to §6-4), each from the rules. What the model cannot know -- which card
 * a player picks, the by-hand tray's budget -- comes from the move itself or is checked elsewhere (landmine 212).
 */

const clone = x => JSON.parse(JSON.stringify(x));
const TARGETED = ['ko', 'rest', 'bounce', 'bottom', 'power', 'costmod', 'givedon', 'playfromhand', 'trashhand'];

export function makeRulebook(CAT) {
  const card = id => CAT.byId.get(+id) || null;
  const num = v => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; };
  const cost = p => num(p && p.cost), printed = p => num(p && p.power), counterOf = p => (p && p.type === 'Character') ? num(p.counter) : 0;
  const types = p => String((p && p.subtypes) || '').split(/[;/]/).map(t => t.trim()).filter(Boolean);
  const kwPrinted = p => String((p && p.kw) || '').split('|').filter(Boolean);
  /* a card's lines as the game runs them: a printing proven wrong runs its lines by hand (tools/cards/, take 122) */
  const lines = id => { const L = CAT.effects[String(id)] || [], pr = CAT.proof && CAT.proof[String(id)];
    return pr && pr.v === 'wrong' ? L.map(e => e.hand || e.t === 'static' ? e : Object.assign({}, e, { do: [], hand: true })) : L; };
  /* an Event's timing: a line of it, or the tag in its text (§10-2-4, §6-5-3-1) */
  const evTiming = (p, t) => lines(p.id).some(e => e.t === t) || new RegExp('(^|\\n)\\s*\\[' + (t === 'evmain' ? 'Main' : 'Counter') + '\\]').test(p.text || '');

  const P = (m, i) => m.players[i];
  const at = (X, ref) => ref === 'leader' ? X.leader : ref === 'stage' ? X.stage : ref == null ? null : X.chars[ref] || null;
  const refOf = (X, uid) => { if (uid == null) return null; if (X.leader.uid === uid) return 'leader'; if (X.stage && X.stage.uid === uid) return 'stage'; const k = X.chars.findIndex(c => c.uid === uid); return k >= 0 ? k : null; };
  const keyOf = (X, ref) => ref === 'leader' ? 'leader' : (at(X, ref) ? 'u' + at(X, ref).uid : null);
  const fieldDon = X => X.don.active + X.don.rested + X.leader.don + X.chars.reduce((s, c) => s + c.don, 0);

  /* ---- a card's conditions and numbers now (§8-3-2, §6-5-5-2, §2-6-3) ---- */
  function condOk(m, i, src, c) { const X = P(m, i), L = card(X.leader.id);
    switch (c.c) {
      case 'donx': return (src ? src.don : 0) >= c.n;                         // [DON!! xN]: that many given to this card (§10-2-11)
      case 'opt': return true;                                                // counted in the book, not here
      case 'yourturn': return m.active === i;
      case 'oppturn': return m.active !== i;
      case 'opplife': return P(m, 1 - i).life.length <= c.max;
      case 'donfield': return fieldDon(X) >= c.min;
      case 'leadertype': return types(L).includes(c.t);
      case 'leadername': return !!L && L.name === c.name;
      case 'life': return X.life.length <= c.max;
      case 'trash': return X.trash.length >= c.min;
      case 'donle': return fieldDon(X) <= fieldDon(P(m, 1 - i));
      default: return false; } }
  function kwNow(m, i, ref) { const X = P(m, i), o = at(X, ref); if (!o || ref === 'stage') return []; const key = keyOf(X, ref);
    return kwPrinted(card(o.id)).concat(lines(o.id).filter(e => e.t === 'static' && !e.hand && e.do[0] && e.do[0].a === 'selfkw' && e.if.every(c => condOk(m, i, o, c))).map(e => e.do[0].k),
      X.modl.filter(q => q.key === key && q.kw).map(q => q.kw)); }
  function powerNow(m, i, ref) { const X = P(m, i), o = at(X, ref); if (!o || ref === 'stage') return 0; const key = keyOf(X, ref);
    const stat = lines(o.id).filter(e => e.t === 'static' && !e.hand && e.do[0] && e.do[0].a === 'selfpower' && e.if.every(c => condOk(m, i, o, c))).reduce((s, e) => s + e.do[0].n, 0);
    return printed(card(o.id)) + (m.active === i ? 1000 * o.don : 0) + stat + X.modl.filter(q => q.key === key && q.n != null).reduce((s, q) => s + q.n, 0); }
  const costNow = (X, k) => { const c = X.chars[k]; return Math.max(0, cost(card(c.id)) + X.modl.filter(q => q.key === 'u' + c.uid && q.cost != null).reduce((s, q) => s + q.cost, 0)); };

  /* ---- Once Per Turn, the book's own (§10-2-13): per card on the field (a new card when it moves), per line, per turn ---- */
  const optKey = (m, i, src, cardId, n) => `${i}:${src ? 'u' + src.uid : 'c' + cardId}:${n}:${m.turn}`;

  /* ---- the effects a moment starts (§8-1, §8-3-1-3): a card's lines of that timing whose conditions hold, not used this turn,
     whose costs can be paid ---- */
  function payable(m, i, src, d) { const X = P(m, i); if (!d || !/^cost_/.test(d.a)) return true;
    if (d.a === 'cost_restdon') return X.don.active >= d.n; if (d.a === 'cost_trashhand') return X.hand.length >= d.n;
    if (d.a === 'cost_returndon') return fieldDon(X) >= d.n; if (d.a === 'cost_restself') return !!src && !src.rested; return false; }
  function offers(m, book, i, t, ref, cardId, fromLife) { const X = P(m, i), src = ref == null ? null : at(X, ref), id = cardId || (src && src.id);
    return lines(id).map((e, n) => ({ e, n })).filter(({ e }) => e.t === t && e.if.every(c => condOk(m, i, src, c)))
      .filter(({ e, n }) => !(e.if.some(c => c.c === 'opt') && book.opt.has(optKey(m, i, src, id, n))))
      .filter(({ e }) => { for (const d of e.do || []) { if (!/^cost_/.test(d.a)) break; if (!payable(m, i, src, d)) return false; } return true; })
      .map(({ e, n }) => ({ i, e, n, ref, uid: src ? src.uid : null, cardId: id, fromLife: !!fromLife, hand: !!e.hand, steps: e.do, step: 0 })); }
  const onField = X => ['leader'].concat(X.chars.map((c, k) => k), X.stage ? ['stage'] : []);
  /* "When a Character is K.O.'d": both fields, the turn player's first (§8-6-2) */
  const whenKO = (m, book) => [m.active, 1 - m.active].flatMap(xi => onField(P(m, xi)).flatMap(ref => offers(m, book, xi, 'whenko', ref)));

  /* ---- the choices a step allows (§8-4): the auditor's reading of each step's words ---- */
  function targetsFor(m, i, d, srcRef) { if (!d) return null; const X = P(m, i), O = P(m, 1 - i);
    const fit = (Y, yi, k) => { const c = Y.chars[k], p = card(c.id);
      return (d.cost == null || costNow(Y, k) <= d.cost) && (d.power == null || powerNow(m, yi, k) <= d.power) && (d.bpower == null || printed(p) <= d.bpower) && (!d.rested || c.rested); };
    const opp = () => O.chars.map((c, k) => k).filter(k => fit(O, 1 - i, k)).map(k => 'o' + k), own = () => X.chars.map((c, k) => k).filter(k => fit(X, i, k)).map(k => 'm' + k);
    switch (d.a) {
      case 'ko': case 'costmod': return opp();
      case 'rest': return opp().filter(r => !O.chars[+r.slice(1)].rested);
      case 'bounce': case 'bottom': return d.who === 'any' ? own().concat(opp()) : opp();
      case 'power': if (d.who === 'prev') return null; if (d.who === 'opp') return opp();
        return ['L'].concat(own()).filter(r => !d.notself || r !== (srcRef === 'leader' ? 'L' : 'm' + srcRef));
      case 'givedon': return (d.who === 'chars' ? [] : ['L']).concat(d.who === 'leader' ? [] : X.chars.map((c, k) => 'm' + k));
      case 'trashhand': case 'cost_trashhand': return X.hand.map((id, h) => 'h' + h);
      case 'playfromhand': return X.hand.map((id, h) => ({ h, p: card(id) })).filter(x => x.p && x.p.type === 'Character' && (d.cost == null || cost(x.p) <= d.cost)
        && (d.power == null || printed(x.p) <= d.power) && (!d.type || types(x.p).includes(d.type))).map(x => 'h' + x.h);
      case 'search': { const ts = d.types || (d.type ? [d.type] : null);
        return X.deck.slice(0, d.n).map((id, k) => ({ k, p: card(id) })).filter(x => x.p && ((!ts && !d.names) || (ts || []).some(t => types(x.p).includes(t)) || (d.names || []).includes(x.p.name))
          && (!d.name || x.p.name === d.name) && (!d.not || x.p.name !== d.not) && (d.cost_max == null || cost(x.p) <= d.cost_max) && (d.cost_min == null || cost(x.p) >= d.cost_min)).map(x => 'd' + x.k); }
      default: return null; } }

  /* ---- which effects a player may decline (§8-1-3-1): an automatic effect activates by itself and resolves in full, its "up to"
     letting 0 be chosen; a [Trigger] is the player's to use (§10-1-5); a line that says "you may", or that begins with a cost, is
     the player's to take; one the player activates may be put back before it begins; a line run by hand is the player's.
     Nothing is declined once begun (§8-3-1-1) ---- */
  const declinable = o => { if (o.hand) return true; if (o.step > 0) return false; const e = o.e || {}, body = String(e.raw || '').replace(/^(\s*\[[^\]]+\]\s*)+/, '').replace(/\([^)]*\)/g, '');
    return e.t === 'trigger' || e.t === 'main' || /^cost_/.test((e.do && e.do[0] && e.do[0].a) || '') || /^\s*you may\b/i.test(body); };

  /* ---- the legal moves (§6-5, §7, §8): what the engine's legal() must offer, exactly ---- */
  function canAttack(m, i, ref) { const X = P(m, i), o = at(X, ref); if (!o || o.rested || X.taken <= 1) return false;          // §7-1-1-1, §6-5-6-1
    if (ref !== 'leader' && o.turn === m.turn) { const kw = kwNow(m, i, ref); if (!kw.includes('Rush') && !kw.includes('Rush: Character')) return false; }   // §3-7-4, §10-1-1, §10-1-6
    return true; }
  function attackTargets(m, i, ref) { const X = P(m, i), O = P(m, 1 - i), o = at(X, ref), kw = kwNow(m, i, ref);
    const charsOnly = ref !== 'leader' && o.turn === m.turn && !kw.includes('Rush') && kw.includes('Rush: Character');
    return (charsOnly ? [] : ['leader']).concat(O.chars.map((c, k) => k).filter(k => O.chars[k].rested)); }            // §7-1-1-2
  function locate(m) { const b = m.battle; if (!b) return null; const aref = b.aUid == null ? b.aref : refOf(P(m, b.att), b.aUid), dref = b.dUid == null ? b.dref : refOf(P(m, b.def), b.dUid); return { aref, dref, ok: aref != null && dref != null }; }
  function blockers(m) { const b = m.battle, loc = locate(m); if (!b || b.step !== 'block' || !loc.ok) return [];
    if (kwNow(m, b.att, loc.aref).includes('Unblockable')) return [];                                                           // §10-1-7
    const nb = P(m, b.att).modl.filter(q => q.key === 'noblocker').map(q => q.noblk), O = P(m, b.def);
    const barred = k => nb.some(x => x.power == null || (x.cmp === 'more' ? powerNow(m, b.def, k) >= x.power : powerNow(m, b.def, k) <= x.power));
    return O.chars.map((c, k) => k).filter(k => !O.chars[k].rested && kwNow(m, b.def, k).includes('Blocker') && k !== loc.dref && !barred(k)); }   // §10-1-4
  function canPlay(m, i, h) { const X = P(m, i), p = card(X.hand[h]); if (!p || !['Character', 'Event', 'Stage'].includes(p.type)) return null;
    if (p.type === 'Event' && !evTiming(p, 'evmain')) return null; if (X.don.active < cost(p)) return null;                   // §6-5-3, §2-7
    return { full: p.type === 'Character' && X.chars.length >= 5 }; }
  function legal(m, book, i) { const out = [], X = P(m, i); if (m.over !== null) return out;
    if (m.phase === 'mulligan') return [{ t: 'keep' }, { t: 'mull' }];
    if (m.queue.length) { const o = m.queue[0];
      if (m.hand) return null;                                     // the by-hand tray: its moves are its words' (landmine 212), not modelled here
      if (o.hand) return [{ t: 'fxhand' }, { t: 'fxskip' }];
      const srcRef = o.uid != null ? refOf(X, o.uid) : o.ref, d = o.steps[o.step], T = targetsFor(m, i, d, srcRef) || [];
      if (!payable(m, i, at(X, srcRef), d)) return [{ t: 'fxskip' }];
      const room = ref => { const id = d.a === 'playself' ? o.cardId : d.a === 'playfromhand' && ref != null ? X.hand[+String(ref).slice(1)] : null, p = id != null && card(id); return !!(p && p.type === 'Character' && X.chars.length >= 5); };
      T.forEach(ref => { if (room(ref)) X.chars.forEach((c, k) => out.push({ t: 'fx', target: ref, trash: k })); else out.push({ t: 'fx', target: ref }); });
      if ((!T.length && d.a !== 'cost_trashhand') || (d.upto && TARGETED.includes(d.a))) { if (room(null)) X.chars.forEach((c, k) => out.push({ t: 'fx', target: null, trash: k })); else out.push({ t: 'fx', target: null }); }
      if (declinable(o)) out.push({ t: 'fxskip' }); return out; }
    if (m.phase === 'battle') { const b = m.battle;
      if (b.step === 'block') { blockers(m).forEach(k => out.push({ t: 'block', k })); out.push({ t: 'noblock' }); return out; }
      X.hand.forEach((id, h) => { const p = card(id); if (counterOf(p) > 0) out.push({ t: 'counter', h }); });                  // §7-1-3-1-1
      X.hand.forEach((id, h) => { const p = card(id); if (p && p.type === 'Event' && evTiming(p, 'evcounter') && cost(p) <= X.don.active) out.push({ t: 'cevent', h }); });   // §7-1-3-1-2
      out.push({ t: 'resolve' }); return out; }
    X.hand.forEach((id, h) => { const v = canPlay(m, i, h); if (!v) return; if (v.full) X.chars.forEach((c, k) => out.push({ t: 'play', h, trash: k })); else out.push({ t: 'play', h }); });
    const units = ['leader'].concat(X.chars.map((c, k) => k));
    if (X.don.active > 0) units.forEach(ref => out.push({ t: 'give', ref }));                                                  // §6-5-5
    units.concat(X.stage ? ['stage'] : []).forEach(ref => offers(m, book, i, 'main', ref).forEach(o => out.push({ t: 'activate', ref, n: o.n })));   // §10-2-2
    units.forEach(ref => { if (canAttack(m, i, ref)) attackTargets(m, i, ref).forEach(target => out.push({ t: 'attack', ref, target })); });
    out.push({ t: 'end' }); return out; }
  const who = m => { if (m.over !== null) return null; if (m.phase === 'mulligan') { const k = [m.first, 1 - m.first].find(x => m.players[x].mulliganed === null); return k == null ? null : k; }
    if (m.queue.length) return m.queue[0].i; if (m.phase === 'battle') return m.battle.def; return m.active; };

  /* ---- what the rules do ---- */
  const inst = (id, turn, uid) => ({ id, rested: false, don: 0, turn, uid });
  function leave(X, k, to) { const c = X.chars.splice(k, 1)[0]; if (!c) return null;
    if (c.don) { X.don.rested += c.don; c.don = 0; }                                                                          // §6-5-5-4
    X.modl = X.modl.filter(q => q.key !== 'u' + c.uid);                                                                        // §3-1-6: a new card wherever it lands
    if (to === 'hand') X.hand.push(c.id); else if (to === 'bottom') X.deck.push(c.id); else if (to === 'top') X.deck.unshift(c.id); else if (to === 'life') X.life.unshift(c.id); else X.trash.push(c.id);
    return c; }
  const placeStage = (X, id, turn, uid) => { if (X.stage) { X.trash.push(X.stage.id); X.modl = X.modl.filter(q => q.key !== 'u' + X.stage.uid); } X.stage = inst(id, turn, uid); };   // §3-8-5-1
  /* a timed change (the engine's one store of them is data here): until the end of the turn or battle, the start of a player's
     turn -- "until the start of YOUR next turn" is the next turn of the player whose effect it is -- or for good */
  const mod = (m, owner, controller, key, n, dur, extra) => P(m, owner).modl.push(Object.assign({ key, n, until: dur === 'nextturn' ? 'refresh:' + controller : dur === 'permanent' ? 'never' : dur === 'battle' ? 'endbattle' : 'endturn' }, extra || {}));
  function rules(m) { if (m.over !== null || m.phase === 'mulligan') return;                                                  // §9-2
    const lost = m.players.map(X => X.lost || ((!X.deck.length && !X.looking.length) ? 'deck' : null)); if (!lost.some(Boolean)) return;
    m.over = lost[0] && lost[1] ? -1 : (lost[0] ? 1 : 0); m.phase = 'over'; m.battle = null; m.queue = []; m.hand = null; }
  function startTurn(m) { m.turn++; const i = m.active, X = P(m, i); X.taken++;                                               // §6-1
    m.players.forEach(Y => { Y.modl = Y.modl.filter(q => q.until !== 'refresh:' + i); });                                      // §6-2-1
    const back = X.leader.don + X.chars.reduce((s, c) => s + c.don, 0); X.leader.don = 0; X.chars.forEach(c => { c.don = 0; c.rested = false; }); X.leader.rested = false;
    if (X.stage) X.stage.rested = false; X.don.active += X.don.rested + back; X.don.rested = 0;                                   // §6-2-3, §6-2-4
    if (!(m.turn === 1 && i === m.first) && X.deck.length) X.hand.push(X.deck.shift());                                        // §6-3-1
    m.phase = 'main'; rules(m); if (m.over !== null) return;
    const add = Math.min(X.donDeck, m.turn === 1 && i === m.first ? 1 : 2); X.donDeck -= add; X.don.active += add; m.battle = null; }   // §6-4
  function endTurn(m) { m.players.forEach(Y => { Y.modl = Y.modl.filter(q => q.until !== 'endturn' && q.until !== 'endbattle'); });   // §6-6-1-3
    m.active = 1 - m.active; m.after = null; startTurn(m); }
  const endBattle = m => { m.players.forEach(Y => { Y.modl = Y.modl.filter(q => q.until !== 'endbattle'); }); m.battle = null; if (m.phase === 'battle') m.phase = 'main'; };   // §7-1-5
  function drain(m) { if (m.over !== null) return;
    /* §8-1-3-1-3: an effect whose card left the field before it began does not activate -- it leaves the queue by itself */
    while (m.queue.length && !m.hand) { const o = m.queue[0]; if (o.step !== 0 || o.uid == null || refOf(P(m, o.i), o.uid) != null) break; m.queue.shift(); }
    if (m.queue.length) return; if (m.battle && !locate(m).ok) endBattle(m); if (m.after === 'end' && m.phase === 'main') { m.after = null; endTurn(m); } }

  /* the uid the engine gave a card that entered the field with this move: the rules only ask that it is new */
  const newUid = (got, xi, id, taken) => { const Y = got.players[xi]; const all = [Y.leader, Y.stage, ...Y.chars].filter(Boolean); const c = all.find(o => o.id === id && !taken.has(o.uid)); if (c) taken.add(c.uid); return c ? c.uid : -1; };

  /* one step of an effect (§8-4): what its words do, the auditor's reading */
  function runStep(m, book, i, o, target, trash, got, uids) { const X = P(m, i), O = P(m, 1 - i), d = o.steps[o.step];
    const side = t => t && t[0] === 'o' ? O : X, sideI = t => t && t[0] === 'o' ? 1 - i : i, idx = t => +String(t).slice(1);
    const src = o.uid != null ? refOf(X, o.uid) : o.ref, follow = [], room = () => { if (X.chars.length >= 5) leave(X, trash, 'trash'); };   // §3-7-6-1-1: not a K.O.
    switch (d.a) {
      case 'draw': for (let k = 0; k < d.n && X.deck.length; k++) X.hand.push(X.deck.shift()); break;
      case 'selfpower': { const key = keyOf(X, src); if (key) mod(m, i, i, key, d.n, d.dur); break; }
      case 'leaderpower': mod(m, i, i, 'leader', d.n, d.dur); break;
      case 'power': { const tg = d.who === 'prev' ? o.prev : target; if (tg == null) break; if (tg === 'L') { mod(m, i, i, 'leader', d.n, d.dur); break; }
        const Y = side(tg), ch = Y.chars[idx(tg)]; if (ch) mod(m, sideI(tg), i, 'u' + ch.uid, d.n, d.dur); break; }
      case 'ko': { const ch = leave(O, idx(target), 'trash'); follow.push(...offers(m, book, 1 - i, 'onko', null, ch.id), ...whenKO(m, book)); break; }   // §10-2-17
      case 'rest': O.chars[idx(target)].rested = true; break;
      case 'bounce': leave(side(target), idx(target), 'hand'); break;
      case 'bottom': leave(side(target), idx(target), 'bottom'); break;
      case 'givedon': { const u = target === 'L' ? X.leader : X.chars[idx(target)], n = Math.min(d.n, X.don.rested); X.don.rested -= n; u.don += n; break; }
      case 'activedon': { const n = Math.min(d.n, X.don.rested); X.don.rested -= n; X.don.active += n; break; }
      case 'lifetohand': for (let k = 0; k < (d.n || 1) && X.life.length; k++) X.hand.push(X.life.shift()); break;
      case 'trashhand': case 'cost_trashhand': X.trash.push(X.hand.splice(idx(target), 1)[0]); break;
      case 'search': { const top = X.deck.splice(0, d.n); if (target != null) X.hand.push(top.splice(idx(target), 1)[0]); X.looking.push(...top); break; }
      case 'restcards': { const rest = X.looking.splice(0); if (d.to === 'trash') X.trash.push(...rest); else X.deck.push(...rest); break; }
      case 'adddon': { const n = Math.min(d.n, X.donDeck); X.donDeck -= n; if (d.rested) X.don.rested += n; else X.don.active += n; break; }
      case 'costmod': { const Y = side(target), ch = Y.chars[idx(target)]; mod(m, sideI(target), i, 'u' + ch.uid, null, d.dur, { cost: d.n }); break; }
      case 'selfkw': { const key = keyOf(X, src); if (key) mod(m, i, i, key, null, d.dur, { kw: d.k }); break; }
      case 'mill': X.trash.push(...X.deck.splice(0, d.n)); break;
      case 'noblocker': mod(m, i, i, 'noblocker', null, d.dur, { noblk: { power: d.power, cmp: d.cmp } }); break;
      case 'decktolife': if (X.deck.length) X.life.unshift(X.deck.shift()); break;
      case 'selfactive': { const u = at(X, src); if (u) u.rested = false; break; }
      case 'powerall': X.chars.filter(ch => { const ts = types(card(ch.id)); return d.type ? ts.includes(d.type) : ts.some(t => t.includes(d.typeq)); }).forEach(ch => mod(m, i, i, 'u' + ch.uid, d.n, d.dur)); break;
      case 'cost_restdon': X.don.active -= d.n; X.don.rested += d.n; break;
      case 'playself': { const h = X.hand.indexOf(o.cardId); if (h < 0) return { gone: true }; X.hand.splice(h, 1); o.fromLife = false; const p = card(o.cardId);
        if (p.type === 'Character') { room(); X.chars.push(inst(o.cardId, m.turn, newUid(got, i, o.cardId, uids))); o.ref = X.chars.length - 1; o.uid = X.chars[o.ref].uid; follow.push(...offers(m, book, i, 'onplay', o.ref)); }
        else if (p.type === 'Stage') { placeStage(X, o.cardId, m.turn, newUid(got, i, o.cardId, uids)); follow.push(...offers(m, book, i, 'onplay', 'stage')); }
        else X.trash.push(o.cardId); break; }
      case 'activate': follow.push(...offers(m, book, i, d.t, src != null ? src : null, src != null ? null : o.cardId)); break;
      case 'cost_returndon': { let n = d.n; const take = v => { const t = Math.min(n, v); n -= t; return t; };                   // §8-3-1-6: which DON!! is the player's choice; the app returns rested ones first
        X.don.rested -= take(X.don.rested); X.don.active -= take(X.don.active); X.leader.don -= take(X.leader.don); X.chars.forEach(ch => { ch.don -= take(ch.don); }); X.donDeck += d.n; break; }
      case 'cost_restself': at(X, src).rested = true; break;
      case 'playfromhand': { const id = X.hand.splice(idx(target), 1)[0]; room(); X.chars.push(inst(id, m.turn, newUid(got, i, id, uids))); follow.push(...offers(m, book, i, 'onplay', X.chars.length - 1)); break; }
      default: return { why: `a step the auditor does not know: ${d.a}` }; }
    return { follow }; }

  function finish(m, X, o) { if (X.looking.length) X.deck.unshift(...X.looking.splice(0));
    if (o.fromLife) { const h = X.hand.indexOf(o.cardId); if (h >= 0) { X.hand.splice(h, 1); X.trash.push(o.cardId); } } }
  const bag = a => JSON.stringify((a || []).slice().sort());

  /* ---- the game the rules say follows a move; a refusal is { refuse: why } ---- */
  function next(B, book, i, a, got) { const m = clone(B), X = P(m, i), O = P(m, 1 - i), uids = new Set(B.players.flatMap(Y => [Y.leader, Y.stage, ...Y.chars].filter(Boolean).map(o => o.uid)));
    const L = legal(B, book, i); if (L && !L.some(x => same(x, a))) return { refuse: `not a legal move now: ${JSON.stringify(a)}` };
    const queue = list => { if (list && list.length) m.queue.push(...list); };
    switch (a.t) {
      case 'keep': case 'mull': { X.mulliganed = a.t === 'mull';                                                                 // §5-2-1-6
        const both = m.players.every(Y => Y.mulliganed !== null);
        /* the shuffle is chance: the engine's order is taken, and must be the same fifty cards -- read back from before its Life was dealt */
        if (a.t === 'mull') { const G = got.players[i]; X.hand = G.hand.slice(); X.deck = both ? G.life.slice().reverse().concat(G.deck) : G.deck.slice();
          if (bag(X.hand.concat(X.deck)) !== bag(B.players[i].hand.concat(B.players[i].deck)) || X.hand.length !== 5) return { refuse: 'a mulligan that did not return the five and draw five from the same deck (§5-2-1-6)' }; }
        if (both) { m.players.forEach(Y => { const n = num((card(Y.leader.id) || {}).life) || 5; Y.life = Y.deck.splice(0, n).reverse(); }); startTurn(m); }   // §5-2-1-7
        break; }
      case 'play': { const h = a.h, id = X.hand[h], p = card(id); X.hand.splice(h, 1); X.don.active -= cost(p); X.don.rested += cost(p);   // §6-5-3, §2-7
        if (p.type === 'Character') { if (X.chars.length >= 5) leave(X, a.trash, 'trash'); X.chars.push(inst(id, m.turn, newUid(got, i, id, uids))); queue(offers(m, book, i, 'onplay', X.chars.length - 1)); }
        else if (p.type === 'Stage') { placeStage(X, id, m.turn, newUid(got, i, id, uids)); queue(offers(m, book, i, 'onplay', 'stage')); }
        else { X.trash.push(id); queue(offers(m, book, i, 'evmain', null, id)); }                                              // §8-4-2
        break; }
      case 'give': { X.don.active--; at(X, a.ref).don++; break; }                                                                 // §6-5-5-1
      case 'activate': { const list = offers(m, book, i, 'main', a.ref).filter(o => a.n == null || o.n === a.n); queue([list[0]]); break; }
      case 'attack': { const u = at(X, a.ref); u.rested = true; const d = at(O, a.target);                                       // §7-1-1
        m.battle = { att: i, aref: a.ref, def: 1 - i, dref: a.target, aUid: u.uid, dUid: d.uid, blocked: false, counter: 0, step: 'block' }; m.phase = 'battle';
        queue(offers(m, book, i, 'attack', a.ref)); queue(onField(O).flatMap(ref => offers(m, book, 1 - i, 'oppattack', ref))); break; }   // §7-1-1-3, §10-2-16
      case 'block': { const b = m.battle, loc = locate(m); b.aref = loc.aref; b.dref = loc.dref; const c = X.chars[a.k]; c.rested = true; b.dref = a.k; b.dUid = c.uid; b.blocked = true; b.step = 'counter';   // §7-1-2
        queue(offers(m, book, i, 'onblock', a.k)); break; }
      case 'noblock': m.battle.step = 'counter'; break;
      case 'counter': { const p = card(X.hand[a.h]); X.trash.push(X.hand.splice(a.h, 1)[0]); m.battle.counter += counterOf(p); break; }   // §7-1-3-1-1
      case 'cevent': { const id = X.hand.splice(a.h, 1)[0], p = card(id); X.don.active -= cost(p); X.don.rested += cost(p); X.trash.push(id); queue(offers(m, book, i, 'evcounter', null, id)); break; }
      case 'resolve': { const b = m.battle, A = P(m, b.att), D = P(m, b.def), loc = locate(m), res = { win: false, a: 0, d: 0, life: [], ko: null };
        if (!loc.ok) { endBattle(m); m.last = Object.assign({ gone: true }, res); break; }                                        // §7-1-3-1-3
        b.aref = loc.aref; b.dref = loc.dref; res.a = powerNow(m, b.att, loc.aref); res.d = powerNow(m, b.def, loc.dref) + b.counter; res.win = res.a >= res.d;   // §7-1-4
        const trig = [];
        if (res.win) { if (loc.dref === 'leader') { const kw = kwNow(m, b.att, loc.aref), n = kw.includes('Double Attack') ? 2 : 1, banish = kw.includes('Banish');   // §10-1-2, §10-1-3
            if (!D.life.length) D.lost = 'damage';                                                                                 // §7-1-4-1-1-1
            else for (let k = 0; k < n && D.life.length; k++) { const id = D.life.shift(); if (banish) D.trash.push(id); else D.hand.push(id); res.life.push(id);
              if (!banish && kwPrinted(card(id)).includes('Trigger')) trig.push(id); } }                                         // §10-1-5
          else { const c = leave(D, loc.dref, 'trash'); res.ko = c.id; } }
        endBattle(m); rules(m); m.last = res;
        if (m.over === null) { trig.forEach(id => queue(offers(m, book, i, 'trigger', null, id, true))); if (res.ko != null) { queue(offers(m, book, i, 'onko', null, res.ko)); queue(whenKO(m, book)); } }   // §8-6-2
        break; }
      case 'end': { queue(onField(X).flatMap(ref => offers(m, book, i, 'endturn', ref))); queue(onField(O).flatMap(ref => offers(m, book, 1 - i, 'endoppturn', ref)));   // §6-6-1-1
        if (m.queue.length) m.after = 'end'; else endTurn(m); break; }
      case 'fx': { const o = m.queue[0]; if (o.uid != null) { const k = refOf(X, o.uid); if (k == null && o.step === 0) { m.queue.shift(); break; } o.ref = k; }   // §8-1-3-1-3: begun, it resolves though its card has left
        const d = o.steps[o.step], opt = o.step === 0 && o.e.if.some(c => c.c === 'opt'), src = at(X, o.ref);
        if (opt) book.opt.add(optKey(m, i, src, o.cardId, o.n));
        let r = { follow: [] };
        if (d.if && !d.if.every(c => condOk(m, i, src, c))) {}                                                                    // a step's own condition, read now (take 50)
        else if (a.target == null && TARGETED.includes(d.a) && !(d.a === 'power' && d.who === 'prev' && o.prev != null)) {}      // "up to": none chosen (§4-8); "that card" with none chosen before is no card
        else { r = runStep(m, book, i, o, a.target, a.trash, got, uids); if (r.why) return { refuse: r.why }; if (r.gone) { m.queue.shift(); break; }
          if (a.target != null) o.prev = a.target; }
        o.step++; const done = o.step >= o.steps.length;
        /* however its last step went -- run, none chosen, its condition false -- an effect that is over puts back what it looked
           at and not moved, as it was (§11-3-3), and a [Trigger] card it came from goes to the trash (§10-1-5-3) */
        if (done) finish(m, X, o);
        /* effects its steps set off wait their turn: first when it is over, after it while it still resolves (§8-6) */
        if (done) { m.queue.shift(); if (r.follow.length) m.queue.unshift(...r.follow); } else if (r.follow.length) m.queue.splice(1, 0, ...r.follow);
        break; }
      /* declined: a line begun and left, its looked-at cards back as they were and a [Trigger] used then trashed, as when it ends */
      case 'fxskip': { const o = m.queue.shift(); if (o && o.step > 0) finish(m, X, o); break; }
      /* by hand (take 122): the tray opens with the line's budget (landmine 212's check); each of its moves does one thing, the
         player's choice named in the move, and the model does that thing */
      case 'fxhand': { const o = m.queue[0]; const src = o.uid != null ? at(X, refOf(X, o.uid)) : null; if (o.e.if.some(c => c.c === 'opt')) book.opt.add(optKey(m, i, src, o.cardId, o.n));   // its card by identity, not by the place it had
        m.hand = got.hand ? clone(got.hand) : null; break; }
      case 'hand': { const H = m.hand, s = a.side === 1 ? 1 - i : i, Y = P(m, s), dur = ((H && H.left && H.left._) || {}).dur || 'turn';
        switch (a.op) {
          case 'draw': if (X.deck.length) X.hand.push(X.deck.shift()); break;
          case 'trashhand': X.trash.push(X.hand.splice(a.h, 1)[0]); break;
          case 'ko': { const c = leave(Y, a.k, 'trash'); m.queue.splice(1, 0, ...offers(m, book, s, 'onko', null, c.id), ...whenKO(m, book)); break; }
          case 'rest': at(Y, a.ref).rested = true; break;
          case 'active': at(X, a.ref).rested = false; break;
          case 'activedon': X.don.rested--; X.don.active++; break;
          case 'power': mod(m, s, i, keyOf(Y, a.ref), a.v, dur); break;
          case 'tohand': leave(Y, a.k, 'hand'); break;
          case 'bottom': leave(Y, a.k, 'bottom'); break;
          case 'givedon': if (a.from === 'rested') X.don.rested--; else X.don.active--; at(X, a.ref).don++; break;
          case 'adddon': X.donDeck--; if (a.rested) X.don.rested++; else X.don.active++; break;
          case 'returndon': if (X.don.rested) X.don.rested--; else if (X.don.active) X.don.active--; else if (X.leader.don) X.leader.don--; else X.chars.find(c => c.don).don--; X.donDeck++; break;
          case 'lifetohand': X.hand.push(a.end === 'bottom' ? X.life.pop() : X.life.shift()); break;
          case 'handtolife': X.life.unshift(X.hand.splice(a.h, 1)[0]); break;
          case 'chartolife': leave(X, a.k, 'life'); break;
          case 'opplifetrash': O.trash.push(O.life.shift()); break;
          case 'handtotop': X.deck.unshift(X.hand.splice(a.h, 1)[0]); break;
          case 'decktolife': X.life.unshift(X.deck.shift()); break;
          case 'mill': X.trash.push(X.deck.shift()); break;
          case 'play': { const list = a.zone === 'trash' ? X.trash : X.hand, id = list.splice(a.k, 1)[0], p = card(id);
            if (p.type === 'Character') { if (X.chars.length >= 5) leave(X, a.trash, 'trash'); X.chars.push(inst(id, m.turn, newUid(got, i, id, uids))); m.queue.splice(1, 0, ...offers(m, book, i, 'onplay', X.chars.length - 1)); }
            else { placeStage(X, id, m.turn, newUid(got, i, id, uids)); m.queue.splice(1, 0, ...offers(m, book, i, 'onplay', 'stage')); } break; }
          case 'look': { const n = Math.min(H.left.look, X.deck.length); X.looking.push(...X.deck.splice(0, n)); break; }
          case 'lookto': { const id = X.looking.splice(a.k, 1)[0]; if (a.to === 'hand') X.hand.push(id); else if (a.to === 'bottom') X.deck.push(id); else X.trash.push(id); break; }
          default: return { refuse: `a by-hand move the auditor does not know: ${a.op}` }; }
        m.hand = got.hand ? clone(got.hand) : null; break; }                                                                  // the budget left: landmine 212's check
      case 'handdone': { const H = m.hand; m.hand = null; m.queue.shift();
        if (X.looking.length) X.deck.unshift(...X.looking.splice(0));                                                          // §11-3-3: back as it was
        if (H && H.fromLife) { const h = X.hand.indexOf(H.cardId); if (h >= 0) { X.hand.splice(h, 1); X.trash.push(H.cardId); } }   // §10-1-5-3
        break; }
      case 'concede': X.lost = 'concede'; break;
      default: return { refuse: `unknown move ${a.t}` }; }
    rules(m); drain(m); return { m }; }

  /* ---- the two games, compared: the first place they differ ---- */
  const unit = o => o && { id: o.id, rested: !!o.rested, don: o.don, uid: o.uid };
  const mods = X => X.modl.map(q => JSON.stringify({ key: q.key, n: q.n == null ? null : q.n, until: q.until, cost: q.cost == null ? null : q.cost, kw: q.kw || null, noblk: q.noblk || null })).sort();
  const offerOf = o => [o.i, o.cardId, o.n, o.e && o.e.t, o.step, !!o.fromLife];
  function diff(want, got) {
    const eq = (path, x, y) => { const sx = JSON.stringify(x), sy = JSON.stringify(y); return sx === sy ? null : `${path}: the rules say ${sx.slice(0, 140)}, the engine has ${sy.slice(0, 140)}`; };
    for (const f of ['turn', 'active', 'phase', 'over', 'after']) { const d = eq(f, want[f] ?? null, got[f] ?? null); if (d) return d; }
    { const d = eq('the by-hand tray open', !!want.hand, !!got.hand); if (d) return d; }
    for (let k = 0; k < 2; k++) { const W = want.players[k], G = got.players[k], p = `seat ${k}`;
      const d = eq(`${p} deck`, W.deck, G.deck) || eq(`${p} life`, W.life, G.life) || eq(`${p} hand`, bag(W.hand), bag(G.hand)) || eq(`${p} trash`, bag(W.trash), bag(G.trash))
        || eq(`${p} looking`, W.looking, G.looking) || eq(`${p} leader`, unit(W.leader), unit(G.leader)) || eq(`${p} stage`, unit(W.stage), unit(G.stage))
        || eq(`${p} characters`, W.chars.map(c => Object.assign(unit(c), { turn: c.turn })), G.chars.map(c => Object.assign(unit(c), { turn: c.turn })))
        || eq(`${p} DON!!`, [W.don.active, W.don.rested, W.donDeck], [G.don.active, G.don.rested, G.donDeck]) || eq(`${p} what applies to its cards`, mods(W), mods(G))
        || eq(`${p} turns taken`, W.taken, G.taken) || eq(`${p} lost`, W.lost || null, G.lost || null);
      if (d) return d; }
    const b = x => x && { att: x.att, def: x.def, aUid: x.aUid, dUid: x.dUid, blocked: x.blocked, counter: x.counter, step: x.step };
    return eq('the battle', b(want.battle), b(got.battle)) || eq('the effects waiting, in order', want.queue.map(offerOf), got.queue.map(offerOf)); }
  function same(x, y) { const ks = new Set([...Object.keys(x), ...Object.keys(y)]); for (const k of ks) if ((x[k] ?? null) !== (y[k] ?? null)) return false; return true; }

  /* the result of a battle as the rules compute it, against the engine's (g.last) */
  const lastOf = L => L && { win: !!L.win, a: L.a, d: L.d, life: (L.life || []).map(l => typeof l === 'object' ? l.id : l), ko: L.ko == null ? null : (L.koId != null ? L.koId : L.ko), gone: !!L.gone };

  return { legal, next, diff, who, same, powerNow, kwNow, condOk, offers, targetsFor, lastOf, lines, card, cost, printed, counterOf, types, kwPrinted };
}

/* ---- the card's words (take 124): a step the app runs says what its card says. The rulebook holds the engine to the parsed
   lines; this holds the parsed lines to the printed words -- every scripted step's number and words found in its own line's
   text, so a line parsed "draw 1" from "Draw 2 cards" is named before any game is played ---- */
const NUMW = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 };
export function wordsAudit(CAT) {
  const out = [], n = s => { const t = String(s).toLowerCase(); return NUMW[t] != null ? NUMW[t] : +t; };
  const has = (raw, rx) => rx.test(raw), nums = (raw, rx) => [...raw.matchAll(rx)].map(m => n(m[1]));
  const sayN = (raw, rx, want) => nums(raw, rx).includes(want);
  const pw = (raw, v) => new RegExp(`${v < 0 ? '[\\u2212-]' : '\\+'}${Math.abs(v)}\\b`).test(raw);
  const check = (d, raw) => { const r = raw.replace(/−/g, '-');
    switch (d.a) {
      case 'draw': return sayN(r, /\bdraw (?:up to )?(\d+|a|one|two|three) cards?/gi, d.n) || (d.n === 1 && /\bdraw a card\b/i.test(r));
      case 'ko': return /K\.O\./.test(r) && (d.cost == null || sayN(r, /cost of (\d+) or less/gi, d.cost) || (d.cost === 0 && /cost of 0\b/.test(r))) && (d.power == null || sayN(r, /(\d+) (?:base )?power or less/gi, d.power));   // "a cost of 0": 0 or less is 0 (§1-3-6-2)
      case 'rest': return /\brest\b/i.test(r) && (d.cost == null || sayN(r, /cost of (\d+) or less/gi, d.cost));
      case 'bounce': return /\breturn\b[^.]*\bhand\b/i.test(r) && (d.cost == null || sayN(r, /cost of (\d+) or less/gi, d.cost));
      case 'bottom': return /\bbottom of\b[^.]*\bdeck\b/i.test(r) && (d.cost == null || sayN(r, /cost of (\d+) or less/gi, d.cost));
      case 'power': case 'selfpower': case 'leaderpower': case 'powerall': return (pw(r, d.n) || (d.sign_inferred && new RegExp(`\\b${Math.abs(d.n)} power\\b`).test(r))) && /\bpower\b/i.test(r);   // the catalogue's text lost some minus signs; the parser marks the sign it inferred
      case 'costmod': return new RegExp(`${d.n < 0 ? '-' : '\\+'}${Math.abs(d.n)} cost`, 'i').test(r);
      case 'givedon': return /\bgive\b[^.]*DON!!/i.test(r) && sayN(r, /\b(\d+|a|one|two) (?:rested |active )?DON!!/gi, d.n);
      case 'activedon': return /\bDON!![^.]*\bas active\b|\bset\b[^.]*DON!![^.]*\bactive\b/i.test(r);
      case 'adddon': return /\bDON!! cards? from your DON!! deck\b/i.test(r) && sayN(r, /\badd (?:up to )?(\d+|a|one|two) DON!!/gi, d.n);
      case 'lifetohand': return /\bLife cards?\b[^.]*\bhand\b/i.test(r);
      case 'trashhand': case 'cost_trashhand': return /\btrash\b[^.]*\bfrom your hand\b/i.test(r) && sayN(r, /\btrash (?:up to )?(\d+|a|one|two) cards?/gi, d.n || 1);
      case 'search': return sayN(r, /\blook at (\d+|one|two|three|four|five) cards?/gi, d.n) && (d.types || []).every(t => r.includes(t)) && (d.names || []).every(t => r.includes(t));
      case 'restcards': return d.to === 'trash' ? /\btrash\b/i.test(r) : /\bbottom of your deck\b/i.test(r);
      case 'mill': return /\btrash\b[^.]*\bfrom the top of your deck\b/i.test(r) && sayN(r, /\btrash (\d+|a|one|two|three) cards? from the top/gi, d.n);
      case 'selfkw': return r.includes(`[${d.k}]`);
      case 'noblocker': return /cannot activate[^.]*\[Blocker\]/i.test(r) && (d.power == null || r.includes(String(d.power)));
      case 'decktolife': return /\btop of your deck\b[^.]*\btop of your Life\b/i.test(r);
      case 'selfactive': return /\bset\b[^.]*\bas active\b/i.test(r);
      case 'cost_restdon': return new RegExp(`\\(${d.n}\\)|[\\u2460-\\u2469]`).test(raw);
      case 'cost_returndon': return new RegExp(`DON!! -${d.n}\\b`).test(r);
      case 'cost_restself': return /\brest this\b/i.test(r);
      case 'playself': return /\bplay this card\b/i.test(r);
      case 'playfromhand': return /\bplay\b[^.]*\bfrom your hand\b|\bplay up to\b/i.test(r) && (d.cost == null || sayN(r, /cost of (\d+) or less/gi, d.cost));
      case 'activate': return r.includes(`[${{ evcounter: 'Counter', evmain: 'Main', onplay: 'On Play', attack: 'When Attacking', onko: 'On K.O.', main: 'Activate: Main', onblock: 'On Block' }[d.t] || d.t}]`) || (d.t === 'main' && /\[Activate: ?Main\]/.test(r));
      default: return null; } };
  let lines = 0, steps = 0;
  for (const [id, L] of Object.entries(CAT.effects)) { const p = CAT.byId.get(+id); if (!p || p.sealed) continue;
    for (const e of L) { if (e.hand || e.t === 'static' && !(e.do[0] && ['selfpower', 'selfkw'].includes(e.do[0].a))) continue; lines++;
      for (const d of e.do) { const ok = check(d, String(e.raw || '')); if (ok === null) continue; steps++; if (!ok) out.push({ num: p.num, name: p.name, step: d, raw: e.raw }); } } }   // anything falsy is a miss (take 124: an undefined slipped through as a pass)
  return Object.assign(out, { lines, steps }); }

/* ---- decks: the rules' own check (§5-1-2), and a legal deck at random from the catalogue ---- */
export function deckProblems(CAT, d) { const out = [], card = id => CAT.byId.get(+id);
  const L = card(d.leader); if (!L || L.type !== 'Leader') out.push('no Leader (§5-1-2-1)');
  const cards = d.cards.flatMap(c => Array(c.n).fill(c.id)); if (cards.length !== 50) out.push(`${cards.length} cards, not 50 (§5-1-2-2)`);
  const byNum = {}; for (const id of cards) { const p = card(id); if (!p) { out.push(`an unknown card ${id}`); continue; }
    if (!['Character', 'Event', 'Stage'].includes(p.type)) out.push(`${p.num} is a ${p.type} (§5-1-2-2)`);
    byNum[p.num] = (byNum[p.num] || 0) + 1;
    const lc = String((L && L.color) || '').split(';'), pc = String(p.color || '').split(';'); if (L && !pc.some(c => lc.includes(c))) out.push(`${p.num} shares no colour with the Leader (§5-1-2-3)`); }
  for (const [n, k] of Object.entries(byNum)) if (k > 4) out.push(`${k} copies of ${n} (§5-1-2-4)`);
  return [...new Set(out)]; }
export function randomDeck(CAT, R, opts = {}) {
  const leaders = CAT.rows.filter(p => p.type === 'Leader' && !p.sealed && p.color && parseInt(p.life, 10) > 0);
  const L = leaders[Math.floor(R() * leaders.length)], lc = String(L.color).split(';');
  const pool = CAT.rows.filter(p => !p.sealed && ['Character', 'Event', 'Stage'].includes(p.type) && p.color && String(p.color).split(';').some(c => lc.includes(c)) && !isNaN(parseInt(p.cost, 10)));
  const byNum = new Map(); for (const p of pool) (byNum.get(p.num) || byNum.set(p.num, []).get(p.num)).push(p);
  /* cards with lines the engine runs are weighted up, so a game meets as many effects as it can (the owner: "as optimized as possible") */
  const nums = [...byNum.keys()], weight = n => (byNum.get(n).some(p => (CAT.effects[String(p.id)] || []).some(e => !e.hand)) ? 3 : 1);
  const counts = new Map(); let total = 0, guard = 0;
  while (total < 50 && guard++ < 5000) { let r = R() * nums.reduce((s, n) => s + weight(n), 0), pick = nums[0]; for (const n of nums) { r -= weight(n); if (r <= 0) { pick = n; break; } }
    const have = counts.get(pick) || 0; if (have >= 4) continue; const k = Math.min(4 - have, 50 - total, 1 + Math.floor(R() * 4)); counts.set(pick, have + k); total += k; }
  /* a printing is the unit (AGENTS rule 3): copies of one number may be different printings of it */
  const cards = []; for (const [n, k] of counts) { const pr = byNum.get(n); for (let j = 0; j < k; j++) { const p = pr[Math.floor(R() * pr.length)]; const c = cards.find(x => x.id === p.id); if (c) c.n++; else cards.push({ id: p.id, n: 1 }); } }
  return { id: `random-${L.num}-${Math.floor(R() * 1e6)}`, name: opts.name || `Random ${L.name}`, leader: L.id, cards }; }
