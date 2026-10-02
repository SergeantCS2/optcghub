/* smoke sections 84, 85: take 124 — the table: the Sim drawn as a playmat from the view alone; the audit of take 123 (a result named past the view, the log\'s words, the app\'s turn in one tap, moves only from the painted view) | take 126 — the host\'s "Image Coming Soon" is no card\'s picture; the Sim draws a card from another printing of it; DON!! cards read ドン!!; the marks in words a player reads
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { S, O, c, d, mk, auto, ask } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 124 — the table: the Sim drawn as a playmat from the view alone; the audit of take 123 (a result named past the view, the log\'s words, the app\'s turn in one tap, moves only from the painted view)');
const S = V.SIM, B = V.BOT, SU = V.SIMUI, stock = id => V.CAT.stock.find(d => d.id === id);
const board = () => doc.getElementById('simBoard')._html, sheet = () => doc.getElementById('simSheetBody')._html;
const escH = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fresh = () => Object.assign(SU, { sel: null, focus: null, post: null, room: null, fxt: null, busy: false, hurry: false, sheet: null, seen: 0 });
V.MODE.set('play', false); V.go('sim');

/* the audit's row 1: a battle's result, per seat -- through the board's own taps, against the app */
S.new({ ...stock('stock-st01'), name: 'You' }, { ...stock('stock-st02'), name: 'The app' }, 0, { seed: 3, bot: 1 }); fresh(); V.paintSim();
V.simTap('keep:0'); V.simTap('end:now');   // here the app keeps and plays its turn at once: no frame clock, as with reduced motion (take 124: End turn asks while a card could be played; its sheet's End turn is end:now)
const turn3 = S.g.turn === 3 && S.who() === 0;
V.simTap('attack:leader'); V.simTap('target:leader');   // the app defends at once and holds Resolve for the human's tap
const held = !!S.g.battle && S.who() === 1 && S.g.battle.step === 'counter', lcId = S.P(1).life[0], hand0 = S.P(1).hand.slice();
V.simTap('resolve');
const lcName = S.card(lcId).name, copies = h => h.filter(x => x === lcId).length, toHand = copies(S.P(1).hand) === copies(hand0) + 1, v0 = S.view(0), v1 = S.view(1);   // a printing id, and the app may hold another copy of it
const hides = v => !!v.last && v.last.life.length > 0 && v.last.life.every(l => l.id === null && l.name === null && l.trigger === false);
ok('a battle\'s result is in each seat\'s view as that seat may see it: the Life card that went to the app\'s hand is named in the app\'s view and not in the human\'s (the audit\'s row 1; §3-10, §10-1-5)',
   turn3 && held && toHand && hides(v0) && v1.last.life[0].name === lcName && v0.last.n === v1.last.n && v0.last.win === true, JSON.stringify({ turn3, held, toHand, v0: v0.last, v1: v1.last && v1.last.life }));
ok('...control: a view that copies what act() returned -- what take 123\'s board painted -- is caught', !hides(Object.assign(JSON.parse(JSON.stringify(v0)), { last: Object.assign({}, v0.last, { life: [{ id: lcId, name: lcName, banished: false, trigger: false }] }) })));
{ const keep = S.g.last; S.g.last = { n: 90, turn: S.g.turn, att: 0, def: 1, a: 6000, d: 5000, win: true, ko: null, life: [{ id: lcId, name: 'Probe', trigger: true, banished: false }, { id: lcId, name: 'Probe B', trigger: false, banished: true }] };
  const a = S.view(0).last.life, d = S.view(1).last.life; S.g.last = keep;
  ok('...a [Banish]ed Life card, trashed face up, is named to both; a [Trigger] is its owner\'s to know (§10-1-3, §10-1-5)', a[0].name === null && a[0].trigger === false && a[1].name === 'Probe B' && d[0].name === 'Probe' && d[0].trigger === true && d[1].name === 'Probe B', JSON.stringify({ a, d })); }
/* ...and on the table the human is shown only what it may see: the board painted after that hit, with the log and both trashes
   open, names no card only the app may see -- the Life card that went to its hand, and names no real card on this board carries
   planted in its hand, Life and deck (take 123's way) */
const pub = new Set([v0.me, v0.them].flatMap(X => [X.leader, X.stage, ...X.chars, ...X.trash].filter(Boolean).map(c => c.name)).concat(v0.me.hand.map(c => c.name)));
const seenNames = new Set(), pool = V.CAT.rows.filter(p => p.type === 'Character' && !p.sealed && p.num && !pub.has(p.name) && p.name !== lcName && !seenNames.has(p.name) && seenNames.add(p.name)).slice(0, 15).map(p => p.id);
const P1 = S.P(1), keepP1 = { hand: P1.hand, life: P1.life, deck: P1.deck };
P1.hand = pool.slice(0, 5).concat(P1.hand.filter(id => id === lcId)); P1.life = pool.slice(5, 10); P1.deck = pool.slice(10, 15);
const painted = () => { V.paintSim(); let t = board(); for (const k of ['log', 'menu']) { V.simSheetOpen(k); t += sheet(); } for (const s of [0, 1]) { V.simSheetOpen('trash', String(s)); t += sheet(); } doc.getElementById('simSheet').classList.remove('on'); SU.sheet = null; return t; };
const secret = [lcName].filter(n => !pub.has(n)).concat(pool.map(id => S.card(id).name)), named = t => secret.filter(n => t.includes(escH(n)) || t.includes(n));
const onTable = painted();
ok('...and on the table: the human\'s board after that hit -- the mat, the hand, the dock, the log and both trashes -- names no card only the app may see (its hand, Life and deck planted with names no card on the board carries, and the Life card that went to its hand)',
   secret.length === 16 && named(onTable).length === 0 && /Monkey\.D\.Luffy 5000 vs 5000: hit/.test(onTable), named(onTable).join() || String(secret.length));
ok('...control: take 123\'s result line, painted from act()\'s return ("Life card to hand: <b>name</b>"), is caught', named(onTable + `<div class="note">Life card to hand: <b>${escH(lcName)}</b></div>`).length === 1);
Object.assign(P1, keepP1);
/* the audit's row 2: against the app the log speaks to the human in the second person (docs/SIM-UI.md named "You ends the turn") */
const wrongYou = t => (t.match(/\bYou (?:activates|gives|plays|ends|mulligans|trashes|concedes|has|adds|counters|takes)\b/g) || []);
ok('against the app the table says the human\'s lines in the second person -- "You end the turn", never "You ends" -- on the ticker, in the log and the shared log (the audit\'s row 2)',
   V.simSay('T3 You ends the turn') === 'T3 You end the turn' && V.simSay('T4 You activates Monkey.D.Luffy', true) === 'You activate Monkey.D.Luffy' && V.simSay('T2 You has no cards in the deck — defeat (§9-2-1-2)') === 'T2 You have no cards in the deck — defeat (§9-2-1-2)'
   && V.simSay('T5 The app ends the turn') === 'T5 The app ends the turn' && S.g.log.some(l => /^T\d+ You (?:activates|ends|plays|gives)\b/.test(l)) && wrongYou(onTable).length === 0 && wrongYou(V.simLogText()).length === 0, wrongYou(onTable + V.simLogText()).join());
ok('...control: the engine\'s own lines, as take 123 painted them, are caught', wrongYou(S.g.log.join('\n')).length > 0);
/* the audit's row 3: the log says each step in words, and names a target only when it is public */
{ const WORDY = ['draw', 'power', 'ko', 'rest', 'bounce', 'bottom', 'search', 'mill', 'activate'], CODES = Object.keys(S.DO).filter(k => !WORDY.includes(k));
  const coded = l => new RegExp(`\\b(?:${CODES.join('|')})\\b|: (?:${WORDY.join('|')})(?: \\u2192| \\u2014| \\(|$)|\\u2192 (?:L|[mohd]\\d+)(?![\\w'])|condition not met`).test(l);
  let lines = 0; const bad = [];
  for (const [a, b, seed] of [['stock-st01', 'stock-st10', 7], ['stock-st02', 'stock-st08', 8], ['stock-st05', 'stock-st06', 9], ['stock-st03', 'stock-st09', 10]]) {
    S.new(stock(a), stock(b), 0, { seed }); for (let k = 0; k < 3000 && S.who() != null; k++) if (!B.move(S.who())) break; for (const l of S.g.log) { lines++; if (coded(l)) bad.push(l); } }
  ok('the log says an effect\'s step in the words the offer panel uses, and its target by name when the target is public -- never the engine\'s code or a raw reference ("givedon → L", "cost_returndon", "playfromhand → h5"; the audit\'s row 3)', lines > 400 && bad.length === 0, `${bad.length} of ${lines}: ${bad.slice(0, 2).join(' | ')}`);
  ok('...control: take 123\'s lines are caught, and the new ones are not', ['T9 Monkey.D.Luffy: givedon → L (Give this Leader or 1 of your Characters up to 1 rested DON!)', 'T6 Trafalgar Law: playfromhand — none chosen', 'T6 Trafalgar Law: bottom → o2 (DON!! -3 (You may return the specified number of DON!! cards)', 'T4 condition not met: donx,opt', 'T4 Nami: rest → o0 (Rest up to 1)'].every(coded)
     && !['T12 Uta: rest up to 1 opponent’s Character (cost 5 or less) → Sengoku', 'T4 Koby: cost: rest this card', 'T5 Nami: give up to 1 rested DON!! to your Leader or 1 Character → Monkey.D.Luffy'].some(coded)); }
{ /* a step applied is logged as describe() says it, with its target's name taken before the step moves it */
  const FXs = V.CAT.effects, koId = +Object.keys(FXs).find(id => S.card(+id).type === 'Character' && FXs[id].some(e => !e.hand && e.t === 'onplay' && e.if.length === 0 && e.do.length === 1 && e.do[0].a === 'ko' && e.do[0].cost >= 2 && !e.do[0].rested));
  const g = S.new(stock('stock-st01'), stock('stock-st02'), 0, { seed: 12 }); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' });
  const vic = S.P(1).deck.find(id => S.card(id).type === 'Character' && S.cost(S.card(id)) <= 2) || S.P(1).deck[0];
  S.P(0).chars = [onField(koId, 1)]; S.P(1).chars = [onField(vic, 1)]; g.queue = S.offers(0, 'onplay', 0).slice(0, 1);
  const d = g.queue[0] && g.queue[0].steps[0], r = g.queue[0] ? S.act(0, { t: 'fx', target: 'o0' }) : { ok: false };
  ok('...an applied step\'s line is its words and its target\'s name: "<card>: K.O. up to 1 opponent’s Character (cost 2 or less) → <the one K.O.’d>"', r.ok && g.log.some(l => l === `T${g.turn} ${S.card(koId).name}: ${S.stepText(d)} → ${S.card(vic).name}`), g.log.slice(0, 3).join(' | '));
  S.g = null; }
/* the audit's row 6: an effect's choice of a hand card or a card looked at from the deck carries its face, for the deciding seat only */
{ const FX = V.CAT.effects, sid = +Object.keys(FX).find(id => S.card(+id).type === 'Character' && FX[id].some(e => !e.hand && e.t === 'onplay' && e.if.length === 0 && e.do[0].a === 'search'));
  S.new(stock('stock-st01'), stock('stock-st02'), 0, { seed: 31 }); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' });
  S.P(0).chars = [onField(sid, 1)]; S.g.queue = S.offers(0, 'onplay', 0).slice(0, 1);
  /* the top of the deck holds a card the search may take: the first printing its own filter accepts, put on top */
  for (const p of V.CAT.rows) { if ((S.view(0).offer.choices || []).length) break; if (!p.sealed && p.type !== 'Leader') S.P(0).deck[0] = p.id; }
  const a = S.view(0).offer, b = S.view(1).offer, deckTop = S.P(0).deck.slice(0, 10);
  const faced = (list, ids) => list.length > 0 && list.every(c => /^[dh]\d+$/.test(c.ref) && !!c.face && c.face.id === ids[+c.ref.slice(1)] && !!c.face.name && 'art' in c.face);
  ok('an effect\'s choices from the top of the deck carry each card\'s face, in the searcher\'s view only (the audit\'s row 6)', !!a && Array.isArray(a.choices) && faced(a.choices, deckTop) && b && b.choices === null, JSON.stringify(a && a.choices && a.choices.slice(0, 2)));
  S.g.queue = [{ i: 0, e: { raw: 'probe: trash 1 card from your hand', t: 'onplay', if: [], do: [{ a: 'trashhand', n: 1 }] }, steps: [{ a: 'trashhand', n: 1 }], step: 0, targets: null, ref: null, cardId: S.P(0).leader.id, hand: false, n: 0 }];
  const h = S.view(0).offer;
  ok('...and a hand card\'s choice carries its face too; a card on the field is found on the table by its ref', !!h && h.choices.length === S.P(0).hand.length && faced(h.choices, S.P(0).hand), JSON.stringify(h && h.choices.slice(0, 1)));
  ok('...control: take 123\'s choices, a ref and a name alone, are caught by the same test', !faced([{ ref: 'd0', name: 'x' }, { ref: 'd1', name: 'y' }], [0, 0]));
  S.g = null; }
/* the audit's row 5: the handler sends back only moves from the view it painted -- nothing in it asks the engine what is legal */
{ const at = js.indexOf('function simTap('), tap = js.slice(at, js.indexOf('\n$(', at)), asks = t => (t.match(/\bSIM\.(?:legal|canPlay|canAttack|targetsOf)\(/g) || []);
  ok('the tap handler finds every move in the view the board painted (SIMUI.v.legal) and sends it back as it is: no engine read decides what is legal (the audit\'s row 5)', at > 0 && /const v = SIMUI\.v; if \(!v\) return;/.test(tap) && /const L = v\.legal, pick = f => L\.find\(f\)/.test(tap) && asks(tap).length === 0, asks(tap).join());
  ok('...control: take 123\'s handler lines are caught', asks("else if (act === 'play') { const v = SIM.canPlay(i, ref); } else if (act === 'hop') { const a = SIM.legal(i)[ref]; } const v = SIM.canAttack(i, ref);").length === 3); }
/* every legal move has its control on the table: for a game in each state a board meets, the table is painted in each of its
   own modes (a card selected, an attacker aiming, a sixth Character's choice, an effect's) and every move in the view's legal
   list must be one the painted board can send (docs/SIM-UI.md: "A board offers exactly these") */
{ const codes = () => new Set([...board().matchAll(/data-sim="([^"]+)"/g)].map(m => m[1]));
  const reach = () => { const v = S.view(V.simSeat()), got = new Set(), add = () => codes().forEach(c => got.add(c));
    fresh(); V.paintSim(); add();
    for (const k of ['L', 'S', ...v.me.chars.map((c, i) => 'm' + i), ...(v.me.hand || []).map((c, h) => 'h' + h)]) { SU.focus = k; V.paintSim(); add(); } SU.focus = null;
    for (const ref of new Set(v.legal.filter(x => x.t === 'attack').map(x => x.ref))) { SU.sel = { ref }; V.paintSim(); add(); } SU.sel = null;
    for (const h of new Set(v.legal.filter(x => x.t === 'play' && x.trash != null).map(x => x.h))) { SU.room = { h }; V.paintSim(); add(); } SU.room = null;
    for (const tg of new Set(v.legal.filter(x => x.t === 'fx' && x.trash != null).map(x => x.target))) { SU.fxt = { target: tg }; V.paintSim(); add(); } SU.fxt = null;
    V.paintSim(); return { v, got }; };
  const need = (a, v) => { switch (a.t) {
    case 'keep': case 'mull': return [`${a.t}:${v.seat}`]; case 'play': return a.trash == null ? [`play:${a.h}`] : [`play:${a.h}`, `room:${a.trash}`];
    case 'give': return [`give:${a.ref}`]; case 'activate': return [`fxmain:${a.ref}`]; case 'attack': return [`attack:${a.ref}`, `target:${a.target}`];
    case 'block': return [`block:${a.k}`]; case 'noblock': return ['noblock']; case 'counter': return [`counter:${a.h}`]; case 'cevent': return [`cev:${a.h}`]; case 'resolve': return ['resolve'];
    case 'fx': { const first = a.target == null ? 'fxapply' : `fx:${a.target}`; return a.trash == null ? [first] : [first, `fxroom:${a.trash}`]; }
    case 'fxskip': return ['fxskip']; case 'fxhand': return ['fxhand']; case 'hand': return [`hop:${v.legal.indexOf(a)}`]; case 'handdone': return ['hdone']; case 'end': return ['end']; }
    return ['?' + a.t]; };
  const unreached = ({ v, got }) => v.legal.filter(a => !need(a, v).every(c => got.has(c)) && !(a.t === 'activate' && [...got].some(c => c.startsWith(`fxmain:${a.ref}.`))));
  const deal = seed => { S.new(stock('stock-st01'), stock('stock-st02'), 0, { seed }); fresh(); };
  const states = {}, kinds = new Set(), missed = [];
  const probe = name => { const r = reach(); r.v.legal.forEach(a => kinds.add(a.t)); states[name] = r.v.legal.length; unreached(r).forEach(a => missed.push(name + ' ' + JSON.stringify(a))); return r; };
  deal(41); probe('mulligan'); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); S.act(0, { t: 'end' }); S.act(1, { t: 'end' });
  { const P = S.P(0), n = V.CAT.rows.find(p => p.num === 'ST01-006' && !p.sealed) || V.CAT.rows.find(p => p.type === 'Character' && !p.sealed && S.cost(p) <= 1);
    P.don.active = 6; P.don.rested = 2; P.chars = [onField(n.id, 1)]; P.hand = P.hand.slice(0, 5); probe('main'); }
  { const P = S.P(0), k = V.CAT.rows.find(p => p.num === 'ST01-003' && !p.sealed); P.chars = [0, 1, 2, 3, 4].map(() => onField(k.id, 1)); P.hand = [k.id].concat(P.hand.slice(0, 2)); P.don.active = 6; probe('five in play'); }
  { const P = S.P(0), O = S.P(1), bl = V.CAT.rows.find(p => p.type === 'Character' && !p.sealed && (p.kw || '').split('|').includes('Blocker') && S.num(p.power) >= 1000);
    O.chars = [onField(bl.id, 1)]; P.chars = []; S.act(0, { t: 'attack', ref: 'leader', target: 'leader' }); for (let k = 0; k < 9 && S.g.queue.length; k++) S.act(S.who(), { t: 'fxskip' }); probe('block step');
    S.act(1, { t: 'noblock' }); const ctr = V.CAT.rows.find(p => p.type === 'Character' && !p.sealed && S.num(p.counter) > 0); O.hand = [ctr.id].concat(O.hand.slice(0, 3)); probe('counter step');
    S.act(1, { t: 'resolve' }); for (let k = 0; k < 9 && S.g.queue.length; k++) S.act(S.who(), { t: 'fxskip' }); }
  { const FX = V.CAT.effects, gid = +Object.keys(FX).find(id => S.card(+id).type === 'Character' && FX[id].some(e => !e.hand && e.t === 'onplay' && e.if.length === 0 && e.do[0].a === 'power' && e.do[0].who !== 'opp' && e.do[0].who !== 'prev'));
    S.P(S.g.active).chars = [onField(gid, 1)]; S.g.queue = S.offers(S.g.active, 'onplay', 0).slice(0, 1); probe('an effect with choices on the table'); S.g.queue = []; }
  { const E = V.CAT.effects, hid = +Object.keys(E).find(k => { const p = V.CAT.byId.get(+k); return p && p.type === 'Character' && !p.sealed && E[k].length === 1 && E[k][0].hand && E[k][0].t === 'onplay' && Object.keys(S.handOps(E[k][0].raw)).length >= 2; });
    S.P(S.g.active).chars = [onField(hid, 1)]; S.g.queue = S.offers(S.g.active, 'onplay', 0).slice(0, 1); probe('a by-hand line offered'); S.act(S.who(), { t: 'fxhand' }); probe('a by-hand tray'); }
  const want = ['keep', 'mull', 'play', 'give', 'activate', 'attack', 'block', 'noblock', 'counter', 'resolve', 'fx', 'fxskip', 'fxhand', 'hand', 'handdone', 'end'];
  ok(`every legal move has its control on the table, in ${Object.keys(states).length} states a board meets -- ${want.filter(t => kinds.has(t)).length} kinds of move among them -- each sent as the view names it (docs/SIM-UI.md: "A board offers exactly these")`,
     missed.length === 0 && want.every(t => kinds.has(t)), missed.slice(0, 3).join(' | ') || `missing kinds: ${want.filter(t => !kinds.has(t)).join()} ${JSON.stringify(states)}`);
  { deal(41); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); const r = reach(); r.v.legal.push({ t: 'give', ref: 7 });
    ok('...control: a legal move the table draws no control for is named', unreached(r).some(a => a.t === 'give' && a.ref === 7)); }
  S.g = null; fresh(); }
/* the audit's row 4: the app's moves one a beat where the browser can draw them; at once where it cannot (reduced motion, a
   harness), as take 123 did every time */
{ S.new({ ...stock('stock-st01'), name: 'You' }, { ...stock('stock-st02'), name: 'The app' }, 1, { seed: 5, bot: 1 }); fresh();
  B.move(1); S.act(0, { t: 'keep' }); S.P(1).don.active = 6;   // the app's first turn with DON!! to spend: several moves to watch
  const n0 = S.g.actions.length, wait = ms => new Promise(r => setTimeout(r, ms)); ctx.requestAnimationFrame = f => setTimeout(f, 16); SU.pace = 15;
  V.simBotRun(); const n1 = S.g.actions.length; await wait(14); const n2 = S.g.actions.length;
  for (let k = 0; k < 400 && SU.busy; k++) await wait(20);
  const n3 = S.g.actions.length, paced = V.simPaced(); delete ctx.requestAnimationFrame; SU.pace = 650;
  ok('the app plays its turn a move a beat, each painted, where the browser can draw it -- none inside the tap, one after the first beat, the rest after it (the audit\'s row 4)', paced && n1 === n0 && n2 === n0 + 1 && n3 >= n0 + 3 && !SU.busy && S.who() === 0, JSON.stringify({ n0, n1, n2, n3, busy: SU.busy }));
  S.new({ ...stock('stock-st01'), name: 'You' }, { ...stock('stock-st02'), name: 'The app' }, 1, { seed: 5, bot: 1 }); fresh(); B.move(1); S.act(0, { t: 'keep' }); S.P(1).don.active = 6;
  const m0 = S.g.actions.length; V.simBotRun();
  ok('...control: with no frame clock (reduced motion, a harness) the same turn is played inside the call, as take 123 always did', !V.simPaced() && S.g.actions.length === n3 - n0 + m0 && S.who() === 0, `${S.g.actions.length - m0} moves`);
  S.g = null; fresh(); }
/* the table itself */
{ S.new({ ...stock('stock-st01'), name: 'Player 1' }, { ...stock('stock-st02'), name: 'Player 2' }, 0, { seed: 21 }); fresh();
  S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); S.act(0, { t: 'end' }); S.act(1, { t: 'end' });
  const P = S.P(0), k = V.CAT.rows.find(p => p.num === 'ST01-013' && !p.sealed); P.chars = [onField(k.id, 1, true, 2)]; P.trash = [P.hand.pop()];
  V.paintSim(); const t = board(), v = S.view(0), mine = [v.me.leader, ...v.me.chars, ...v.me.hand], theirs = [v.them.leader];
  const pics = [...mine, ...theirs].filter(c => c.art).every(c => t.includes(`src="${escH(c.art.thumb)}"`));
  ok('the table draws both halves: five Character places each, the Leader in the middle of each back row, Life and Deck as counts, the Trash with its newest card, DON!! as tokens, the other hand as backs',
     (t.match(/<div class="tb-row front">/g) || []).length === 2 && (t.match(/<div class="tb-row back">/g) || []).length === 2 && new RegExp(`aria-label="${v.me.lifeCount} Life"`).test(t) && new RegExp(`aria-label="Deck, ${v.me.deckCount} cards"`).test(t)
     && /data-sim="trash:0" aria-label="Trash, 1 card"/.test(t) && (t.match(/<i class="tk"><svg class="g"[^>]*><use href="#g-donjp"\/><\/svg><\/i>/g) || []).length === v.me.don.active + v.them.don.active && new RegExp(`aria-label="${v.them.handCount} cards in hand">${'<i></i>'.repeat(v.them.handCount)}`).test(t), t.slice(0, 160));
  ok('...every card on it is its hot-linked picture over its own colours, and a rested one with DON!! says so upright (the power, "+2")', pics && /<button class="sc[^"]*\brest\b[^"]*" data-sim="card:m0" data-key="m0" data-uid="\d+" aria-label="[^"]*rested, 2 DON!! given[^"]*">/.test(t) && /<span class="dn">\+2<\/span>/.test(t) && mine.every(c => t.includes(`--a1:${(c.art && c.art.ground[0]) || ''}`)), String(pics));
  ok('...the other hand is backs and a count: none of its cards is on the table', S.P(1).hand.every(id => !t.includes(`src="${escH(S.face(id).art ? S.face(id).art.thumb : '#none')}"`) || [v.them.leader, ...v.them.chars, ...v.them.trash, ...mine].some(c => c.id === id)));
  ok('...and the header\'s subtitle says whose turn it is while the setup\'s words say what the Sim does', doc.getElementById('simSub').textContent === 'turn 3 · Player 1’s turn');
  /* the zoom: a card at its largest with each line's mark and what the app does; a card whose continuous text is the player's */
  V.simSheetOpen('zoom', 'L'); const z = sheet();
  ok('the zoom shows the card large (its large picture), its words, what the app will do on each line -- a proven line unmarked since take 126 -- and its moves', z.includes(`src="${escH(v.me.leader.art.large)}"`) && !/proven by a test|no test has proven|Not checked yet/.test(z) && /The app will: /.test(z) && /class="zm-name">Monkey\.D\.Luffy</.test(z), z.slice(0, 200));
  const E = V.CAT.effects, st = +Object.keys(E).find(id => { const p = V.CAT.byId.get(+id); return p && p.type === 'Character' && !p.sealed && E[id].some(e => e.hand && e.t === 'static'); });
  P.chars.push(onField(st, 1)); SU.focus = 'm1'; V.paintSim(); const y = board(); V.simSheetOpen('zoom', 'm1'); const yz = sheet();
  ok('a card whose continuous text the app does not compute says so: a gold corner on the card, "yours to apply" in the dock with the power said to be without it, and the line in the zoom (docs/SIM-UI.md, what the pass keeps)',
     /<span class="ya"><span class="vh">its continuous text is yours to apply<\/span><\/span>/.test(y) && /its continuous text is yours to apply; the power shown is without it/.test(y) && /<div class="why">Yours to apply: /.test(yz), y.slice(0, 80));
  ok('...control: a card with none -- the Leader, whose lines the app runs -- has no corner', !/class="ya"/.test((y.match(/<button[^>]*data-key="L"[\s\S]*?<\/button>/) || [''])[0]) && v.me.leader.unapplied.length === 0);
  doc.getElementById('simSheet').classList.remove('on'); SU.sheet = null; SU.focus = null;
  S.g = null; fresh(); V.paintSim(); ok('...control: with no game the subtitle says what the Sim does', /^rules by the app/.test(doc.getElementById('simSub').textContent)); }
/* the felt: the table's palette is Prep & Play's dark one, value for value, in both themes */
{ const css = (html.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1], block = (sel, from) => { const i = css.indexOf(sel, from); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
  const toks = b => Object.fromEntries([...b.matchAll(/--([\w-]+):(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2].toUpperCase()]));
  const playDark = toks(block(':root[data-mode="play"]{')), table = toks(block('#simBoard.table{')), same = ['bg', 'card', 'card2', 'line', 'fg', 'dim', 'dim2', 'brass', 'accent-ink', 'line-strong'];
  const lum = hx => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hx.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  ok('the table\'s felt is Prep & Play\'s dark palette in both themes, value for value, so the contrast the palette checks measure holds on it; its own grounds carry the text at 4.5:1 or more', same.every(k => table[k] && table[k] === playDark[k]) && ['mat', 'mat2'].every(g => ['fg', 'dim'].every(k => ratio(table[k], table[g]) >= 4.5)),
     same.filter(k => table[k] !== playDark[k]).join() || ['mat', 'mat2'].map(g => `${g} ${ratio(table.dim, table[g]).toFixed(2)}`).join());
  ok('...control: a value that drifted from the palette is caught', !same.every(k => ({ ...table, dim: '#777777' })[k] === playDark[k]));
  ok('the nav steps aside while a game is on the Sim\'s screen, and from 900 px the table leaves the phone column', /\n:root:has\(#sim\.screen\.on #simBoard\.table\) nav\{display:none\}/.test(css) && /body:has\(#sim\.screen\.on #simBoard\.table\)\{max-width:none\}/.test(css)); }
/* the owner, mid-take: the game fills the screen once dealt; Leave forfeits and brings the app back; the card backs are the icon's */
{ const css = (html.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1];
  ok('once a game is dealt it fills the screen: the mode tabs, the Sim\'s header and the nav step aside, and the table carries the status bar\'s inset itself (the owner, take 124)',
     /\n:root:has\(#sim\.screen\.on #simBoard\.table\) \.modebar\{display:none\}/.test(css) && /\n#sim\.screen:has\(#simBoard\.table\) > \.appbar\{display:none\}/.test(css) && /\n#sim\.screen:has\(#simBoard\.table\)\{padding-top:var\(--sat\);/.test(css) && /\n:root:has\(#sim\.screen\.on #simBoard\.table\) nav\{display:none\}/.test(css));
  S.new({ ...stock('stock-st01'), name: 'Player 1 — Red' }, { ...stock('stock-st02'), name: 'Player 2 — Green' }, 0, { seed: 61 }); fresh(); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); V.paintSim();
  const t = board(), top = (t.match(/<div class="tb-top">[\s\S]*?<\/div>/) || [''])[0];
  ok('...its top bar carries Leave, whose turn it is, the Rules (on every Prep & Play screen, take 122), the log and the menu', /data-sim="leave"/.test(top) && /<b>Turn 1<\/b> · Player 1’s turn/.test(top) && /data-rules=""/.test(top) && /data-sim="log"/.test(top) && /data-sim="menu"/.test(top), top.slice(0, 200));
  const g = S.g; V.simTap('leave'); const ask = sheet(), askOn = doc.getElementById('simSheet').classList.contains('on');
  V.simTap('leavenow');
  ok('Leave asks first, then forfeits the game for the seat on screen (§1-2-3) and closes the table: the app\'s screens come back with the setup',
     askOn && /Leaving forfeits this game: Player 1 loses/.test(ask) && /data-sim="leavenow">Forfeit &amp; leave<\/button>|data-sim="leavenow">Forfeit & leave<\/button>/.test(ask) && g.over === 1 && /concedes \(§1-2-3\)/.test(g.log[0]) && S.g === null && !/class="tb-top"/.test(board()) && /New game/.test(board()), JSON.stringify({ askOn, over: g.over, log: g.log[0] }));
  ok('...control: "Keep playing" is the sheet\'s close, not a move -- the game goes on', /<button class="ghost" data-close="simSheet">Keep playing<\/button>/.test(ask));
  /* the card backs: the icon's card-back emblem, from the sprite, in the game's colours (the owner, twice this take) */
  const rule = sel => (css.match(new RegExp('\\n' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')) || ['', ''])[1];
  const hexOf = (r, k) => ((r.match(new RegExp('(?:^|;)' + k + ':(#[0-9A-Fa-f]{6})')) || [])[1] || '#000000').toUpperCase();
  const rgbOf = hx => [1, 3, 5].map(i => parseInt(hx.slice(i, i + 2), 16) / 255);
  const hue = hx => { const [r, g, b] = rgbOf(hx), mx = Math.max(r, g, b), d = mx - Math.min(r, g, b); if (!d) return -1; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
  const light = hx => { const [r, g, b] = rgbOf(hx).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const blue = hx => hue(hx) >= 205 && hue(hx) <= 245, red = hx => hue(hx) >= 345 || (hue(hx) >= 0 && hue(hx) <= 12);
  const deckBack = r => blue(hexOf(r, 'background')) && blue(hexOf(r, '--f1')) && blue(hexOf(r, '--f2')) && light(hexOf(r, 'background')) < light(hexOf(r, '--f2'));
  const sb = rule('.sb'), ld = rule('.sb.ld'), dn = rule('.sb.dn'), tk = rule('.tk');
  ok('every card back on the table is the app icon\'s card back -- the sprite\'s g-cardart -- in the game\'s colours (the owner, take 124: "The darker blue for normal cards, white for don, red for leaders. Change the borders to match. For don, black border"): the deck\'s, Life\'s and the other hand\'s deep blue in a darker blue border',
     /<symbol id="g-cardart" viewBox="115\.9 39\.9 268\.3 384\.3" fill="none">/.test(html) && /<use href="#g-cardart"\/>/.test(js) && (html.match(/<symbol id="g-cardart"[\s\S]*?<\/symbol>/) || [''])[0].split('currentColor').length > 40 && deckBack(sb) && /background:radial-gradient\(circle at 50% 46%,#2555AD,#112B69 80%\);border:2px solid #0B1B45/.test(rule('.tb-hb i')),
     `frame ${hexOf(sb, 'background')} ${hue(hexOf(sb, 'background')).toFixed(0)}°, face ${hexOf(sb, '--f1')}`);
  ok('...a Leader\'s back red in a darker red border; a DON!! card\'s back white in a black border, and a DON!! face up white in black too, as is the given DON!! on a card',
     red(hexOf(ld, 'background')) && red(hexOf(ld, '--f1')) && light(hexOf(ld, 'background')) < light(hexOf(ld, '--f1')) && light(hexOf(dn, 'background')) < 0.01 && light(hexOf(dn, '--f1')) > 0.9 && light(hexOf(dn, 'color')) < 0.02
     && /background:#FFFFFF;\n  border:max\(2px, calc\(var\(--cw\) \* \.028\)\) solid #0A0A0A;/.test(tk) && /color:#0A0A0A/.test(rule('.tk svg.g')));   // take 126: a frame of its own, not a 1.5px line
  ok('...control: take 124\'s first backs -- the icon\'s own purple on a pale face, the gold DON!! token -- are not the game\'s colours',
     !deckBack('background:#8552b8;color:#8552b8;--cbk:#F6F1E4;--f1:#F6F1E4;--f2:#F6F1E4') && !deckBack('background:#8552B8;--f1:#8552B8;--f2:#8552B8') && light('#F6C48D') < 0.9 && !red('#8552B8'));
  ok('the backs are drawn where the game has them face down: the deck and Life blue, the DON!! deck a stack of white backs beside the cost area, and a Leader not yet shown red (the setup, the reveal)',
     /simBack\('lf', /.test(js) && /simBack\('', `top:/.test(js) && /simBack\('dn', `left:/.test(js) && /simBack\('ld rv'\)/.test(js) && /x\.face \? simFace\(x\.face, true\) : simBack\('ld'\)/.test(js));
  /* the reveal: each Leader turns over from its red back the first time it shows in a game, once */
  S.new({ ...stock('stock-st01'), name: 'Player 1 — Red' }, { ...stock('stock-st02'), name: 'Player 2 — Green' }, 0, { seed: 62 }); fresh(); SU.shown = new Set(); V.paintSim();
  const mullShown = [...SU.shown]; S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); V.paintSim(); const tableShown = [...SU.shown].sort(); V.paintSim();
  ok('each Leader turns over from its red back the first time it shows in a game -- the mulligan shows the deciding seat\'s, the table the other -- and never again', mullShown.join() === String(S.g.first) && tableShown.join() === '0,1' && SU.shown.size === 2, JSON.stringify({ mullShown, tableShown }));
  ok('...control: a new game is dealt with none shown yet, and no move made (Deal resets both; take 124)', /Object\.assign\(SIMUI, \{ sel: null, focus: null, post: null, room: null, fxt: null, seen: 0, hurry: false, shown: new Set\(\), acted: null \}\)/.test(js));
  /* take 124 drew a card whose picture was the host's placeholder in its colours, by a rule of the Sim's; take 126 refuses the
     placeholder where pictures are fetched, and its section checks the shipped catalogue and the Sim's pictures */
  S.g = null; fresh(); }
/* the owner, mid-take: "after every turn ends audit all moves against the rules and all card they played" -- the rulebook
   (tools/lib/rulebook.mjs) and random legal decks found what the ready-made decks never dealt; each fix is a scenario here, on
   the shipped engine, with the engine as it was planted as its control */
{ const E = V.CAT.effects, byId = id => V.CAT.byId.get(+id), body = raw => String(raw).replace(/^(\s*\[[^\]]+\]\s*)+/, '').replace(/\([^)]*\)/g, '');
  const lineWhere = pred => { for (const [id, L] of Object.entries(E)) { const p = byId(id); if (!p || p.sealed || p.type !== 'Character') continue; const n = L.findIndex(e => !e.hand && pred(e)); if (n >= 0) return { id: +id, n, e: L[n] }; } return null; };
  const deal = () => { S.new({ ...stock('stock-st01'), name: 'Player 1' }, { ...stock('stock-st02'), name: 'Player 2' }, 0, { seed: 70 }); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); return S.g; };
  const put = (i, id) => { const c = S.inst(id, S.g.turn - 1); S.P(i).chars.push(c); return S.P(i).chars.length - 1; };
  /* 1. an automatic effect resolves in full (§8-1-3-1): no Skip; an "up to" still lets none be chosen */
  deal(); const auto = lineWhere(e => e.t === 'onplay' && e.do.length === 1 && e.do[0].a === 'draw' && !/^\s*you may\b/i.test(body(e.raw)) && !e.if.length);
  const may = lineWhere(e => e.t === 'onplay' && /^\s*you may\b/i.test(body(e.raw)) && !e.if.length && !/^cost_(restdon|returndon|restself)$/.test(e.do[0].a));
  let k = put(0, auto.id); S.g.queue = S.offers(0, 'onplay', k); const L1 = S.legal(0), refused = S.act(0, { t: 'fxskip' });
  S.g.queue = []; k = put(0, may.id); S.g.queue = S.offers(0, 'onplay', k); const L2 = S.legal(0);
  ok(`an automatic effect is not the player's to decline (§8-1-3-1): ${byId(auto.id).name}'s "${body(auto.e.raw).slice(0, 30)}" offers no Skip and act refuses one; a line that says "you may" can still be declined`,
     !L1.some(x => x.t === 'fxskip') && L1.some(x => x.t === 'fx') && refused.ok === false && /§8-1-3-1/.test(refused.why) && L2.some(x => x.t === 'fxskip'), JSON.stringify({ L1, why: refused.why }));
  { const d = S.declinable; S.declinable = () => true; S.g.queue = S.offers(0, 'onplay', put(0, auto.id)); const planted = S.legal(0).some(x => x.t === 'fxskip'); S.declinable = d; S.g.queue = [];
    ok('...control: take 123\'s engine, where every line could be declined, offers the Skip', planted); }
  { S.g.queue = S.offers(0, 'onplay', put(0, auto.id)); fresh(); V.paintSim(); const bAuto = board(); S.g.queue = S.offers(0, 'onplay', put(0, may.id)); fresh(); V.paintSim(); const bMay = board(); S.g.queue = [];
    ok('...and the effect panel says so where Skip was: "it resolves in full" with the rule\'s section; a "you may" line keeps its decline, named Decline (take 124)', /<span class="note">it resolves in full \(<button class="linkish" data-rules="8-1-3-1"/.test(bAuto) && !/data-sim="fxskip"/.test(bAuto) && /data-sim="fxskip">(?:Decline|Don\u2019t pay)<\/button>/.test(bMay) /* a "you may" that begins with a cost is declined by not paying it */, (bAuto.match(/<div class="tb-go">[\s\S]{0,300}/) || [''])[0]); }
  /* 2. a [Trigger] used is trashed however its last step went -- none chosen included (§10-1-5-3) */
  deal(); const trig = lineWhere(e => e.t === 'trigger' && e.do.length === 1 && e.do[0].a === 'ko' && e.do[0].upto);
  const trigRun = plant => { deal(); S.P(1).chars = []; S.P(0).hand.push(trig.id); S.g.queue = S.offers(0, 'trigger', null, trig.id, true); const f = S.finish; if (plant) S.finish = function () {};
    const r = S.act(0, { t: 'fx', target: null }); S.finish = f; return { ok: r.ok, inHand: S.P(0).hand.includes(trig.id), inTrash: S.P(0).trash.includes(trig.id) }; };
  const tr = trigRun(false), trPlant = trigRun(true);
  ok(`a [Trigger] used with no target chosen is trashed after it, not kept in hand (§10-1-5-3): ${byId(trig.id).name} (the rulebook's find: take 123 kept it)`, tr.ok && !tr.inHand && tr.inTrash, JSON.stringify(tr));
  ok('...control: an engine that ends it without finishing -- take 123\'s path for "none chosen" -- keeps the card in hand', trPlant.inHand && !trPlant.inTrash);
  /* 3. what a step sets off while its effect still resolves waits its turn, not dropped (§8-6): a K.O. that is not the last step, of
     a card with an [On K.O.] */
  const koed = lineWhere(e => e.t === 'onko' && !e.if.length), koFirst = { id: auto.id };   // a K.O. then a draw: the steps as effects.py writes them, the card a Character's
  const follows = plant => { deal(); S.P(1).chars = []; put(1, koed.id); k = put(0, koFirst.id); const steps = [{ a: 'ko', who: 'opp', upto: true }, { a: 'draw', n: 1 }];
    S.g.queue = [{ i: 0, e: { t: 'onplay', if: [], do: steps, raw: '[On Play] K.O. up to 1 of your opponent\'s Characters. Then, draw 1 card. (take 124 probe)' }, n: 9, ref: k, uid: S.P(0).chars[k].uid, cardId: koFirst.id, fromLife: false, hand: false, steps, step: 0 }];
    const ko = S.DO.ko; if (plant) S.DO.ko = function (c) { ko.call(this, c); return {}; };
    const r = S.act(0, { t: 'fx', target: 'o0' }); S.DO.ko = ko; return { ok: r.ok, queued: S.g.queue.map(o => S.card(o.cardId).name + ' ' + o.e.t) }; };
  const fw = koed ? follows(false) : null, fwPlant = koed ? follows(true) : null;
  ok(`a card K.O.'d by a step that is not its effect's last still has its [On K.O.] offered, after the effect it came from (§8-6; take 123 dropped it): a K.O. then a draw, of ${koed ? byId(koed.id).name : '?'}`,
     !!fw && fw.ok && fw.queued.length === 2 && fw.queued[1] === `${byId(koed.id).name} onko`, JSON.stringify(fw));
  ok('...control: an engine that drops what a step sets off (take 123\'s, unless the step was the last) queues no [On K.O.]', !!fwPlant && !fwPlant.queued.some(x => /onko$/.test(x)));
  /* 4. an effect whose card left before it began does not activate, and leaves the queue by itself (§8-1-3-1-3); one begun
     resolves in full though its card leaves -- the rulebook's Sogeking, who returns himself and still draws */
  deal(); const selfBounce = lineWhere(e => e.t === 'onplay' && e.do[0].a === 'bounce' && e.do[0].who === 'any' && e.do[1] && e.do[1].a === 'draw' && !e.if.length && !e.do[0].if);

  k = put(0, auto.id); S.g.queue = S.offers(0, 'onplay', k); S.leave(S.P(0), k, 'hand'); S.drain(); const purged = S.g.queue.length === 0 && /does not activate \(§8-1-3-1-3\)/.test(S.g.log[0]);
  { deal(); k = put(0, auto.id); S.g.queue = S.offers(0, 'onplay', k); S.leave(S.P(0), k, 'hand'); const dr = S.drain; S.drain = function () { const g = this.g; if (g.over !== null || g.queue.length) return; return dr.call(this); };   // take 123's drain: it returned at once with anything queued
    S.drain(); S.drain = dr; const kept = S.g.queue.length === 1;
    ok(`an effect whose card left the field before it began leaves the queue by itself, with no move asked for it (§8-1-3-1-3; the rulebook's find: take 123 offered its targets and took any move as its end)`, purged, S.g.log.slice(0, 2).join(' | '));
    ok('...control: take 123\'s drain, returning while anything was queued, left it waiting', kept); }
  const soge = plant => { deal(); S.P(0).hand = S.P(0).hand.slice(0, 3); k = put(0, selfBounce.id); S.g.queue = S.offers(0, 'onplay', k); const ap = S.apply;
    if (plant) S.apply = function (i, o, t, opts) { if (o.uid != null && this.refOf(this.P(i), o.uid) == null) return { ok: false, why: 'gone', gone: true }; return ap.call(this, i, o, t, opts); };
    const r1 = S.act(0, { t: 'fx', target: null }); S.leave(S.P(0), S.refOf(S.P(0), S.g.queue[0].uid), 'hand'); const h1 = S.P(0).hand.length, r2 = S.act(0, { t: 'fx', target: null }); S.apply = ap; return { r1: r1.ok, r2: r2.ok, drew: S.P(0).hand.length - h1 }; };
  const sg = selfBounce ? soge(false) : null, sgPlant = selfBounce ? soge(true) : null;
  ok(`an effect begun resolves in full though its own card has left the field: ${selfBounce ? byId(selfBounce.id).name : '?'} returned to hand after its first step still draws 2 (§8-1-3-1-3 is about activating; the rulebook's find, through a by-hand move)`, !!sg && sg.r1 && sg.r2 && sg.drew === 2, JSON.stringify(sg));
  ok('...control: take 123\'s apply, which dropped the rest once the card had left, draws nothing', !!sgPlant && sgPlant.drew === 0, JSON.stringify(sgPlant));
  /* 5. "that card" with none chosen before is no card: El Thor's second +2000 does nothing, and the game goes on */
  const thor = Object.entries(E).map(([id, L]) => ({ id: +id, n: L.findIndex(e => !e.hand && e.do.length === 2 && e.do[1].a === 'power' && e.do[1].who === 'prev') })).find(x => x.n >= 0);
  const lives2 = () => { S.P(0).life = S.P(0).life.slice(0, 2); S.P(1).life = S.P(1).life.slice(0, 2); };   // the second step's condition holds, whichever Life it reads
  deal(); lives2(); S.g.queue = S.offers(0, 'evcounter', null, thor.id); const t1 = S.act(0, { t: 'fx', target: null }), L5 = S.legal(0), t2 = S.act(0, { t: 'fx', target: null });
  ok(`"that card" with no card chosen before is no card: ${byId(thor.id).name}'s second +2000 resolves as nothing and the effect ends (the rulebook's random decks: take 123 offered the move and refused it -- a game that could not go on once declining was ruled out)`,
     t1.ok && L5.length === 1 && t2.ok && S.g.queue.length === 0 && /none chosen/.test(S.g.log[0]), JSON.stringify({ t1, L5, t2, log: S.g.log[0] }));
  { const ap = S.apply; S.apply = function (i, o, t, opts) { const d = o.steps[o.step]; if (d && d.a === 'power' && d.who === 'prev' && o.prev == null && (!d.if || d.if.every(c => this.condOk(i, null, c)))) return { ok: false, why: 'no card chosen before' }; return ap.call(this, i, o, t, opts); };   // take 123's way with "that card"
    deal(); lives2(); S.g.queue = S.offers(0, 'evcounter', null, thor.id); S.act(0, { t: 'fx', target: null }); const planted = S.act(0, { t: 'fx', target: null }); S.apply = ap;
    ok('...control: take 123\'s engine refused that move, the only one it offered', planted.ok === false && /no card chosen before/.test(planted.why)); }
  /* 5b. a target the step never offered is refused before its condition is read (the final sweep: Radical Beam!!'s second step,
     its condition false, took the Leader as a target) */
  { const odd = plant => { deal(); S.P(0).life = S.P(0).life.slice(0, 5); S.g.queue = S.offers(0, 'evcounter', null, thor.id); S.act(0, { t: 'fx', target: null }); const ap = S.apply;
      if (plant) S.apply = function (i, o, t, opts) { const d = o.steps[o.step]; return ap.call(this, i, o, d && d.if && !d.if.every(c => this.condOk(i, null, c)) ? null : t, opts); };   // the condition read first: the target never looked at
      const r = S.act(0, { t: 'fx', target: 'L' }); S.apply = ap; return r; };
    const r = odd(false), rp = odd(true);
    ok(`a target a step never offered is refused whatever its condition (the final sweep, chaos: ${byId(thor.id).name}'s second step, its condition false, took one)`, r.ok === false && /not a legal target/.test(r.why), JSON.stringify(r));
    ok('...control: the condition read before the target, as it was, accepts the move', rp.ok === true); }
  /* 6. the by-hand tray's Once Per Turn follows its card, not the place it had: a Character before it leaves, and the line is still used */
  const byHandOpt = Object.entries(E).map(([id, L]) => ({ id: +id, n: L.findIndex(e => e.hand && e.t === 'main' && e.if.length && e.if.every(c => c.c === 'opt')), p: byId(id) })).find(x => x.n >= 0 && x.p && x.p.type === 'Character' && !x.p.sealed);
  const opt6 = plant => { deal(); S.P(0).chars = []; put(0, auto.id); const kk = put(0, byHandOpt.id), uid = S.P(0).chars[kk].uid; S.g.queue = S.offers(0, 'main', kk); S.leave(S.P(0), 0, 'hand');
    const rf = S.refOf; if (plant) S.refOf = function (X, u) { return u === uid && this.g.hand == null && this.g.queue.length ? 1 : rf.call(this, X, u); };   // take 123: the place it had when it was queued
    S.act(0, { t: 'fxhand' }); S.act(0, { t: 'handdone' }); S.refOf = rf; return S.offers(0, 'main', S.refOf(S.P(0), uid)).length === 0; };
  ok(`a by-hand line's [Once Per Turn] is spent on its own card when a Character before it has left: ${byHandOpt ? byHandOpt.p.name : '?'} (two apps named it resolved twice)`, !!byHandOpt && opt6(false));
  ok('...control: the tray reading the place the card had (take 123) spends another card\'s and leaves this one unused', !!byHandOpt && !opt6(true));
  /* the owner's fourth word (take 124): "Ensure if there's an outstanding action, the player knows about it. The sim should tell the
     player what the next action is, such as drawing a card, don etc. ... a user should never be able to skip drawing a card, don" --
     the turn's start is the engine's and is said; the next action is said; End turn asks; nothing that must happen is skipped */
  /* 7. the turn's start: never a move, and said as it was (take 124 logged "refresh, draw" where no card is drawn) */
  { const said = (line, st) => new RegExp(`turn ${st.turn}: refresh, ${st.first ? 'no draw on the first turn \\(\u00a76-3-1\\)' : 'draw ' + st.drew}, \\+${st.don} DON!!$`).test(line);
    S.new({ ...stock('stock-st01'), name: 'Player 1' }, { ...stock('stock-st02'), name: 'Player 2' }, 0, { seed: 70 }); const h0 = S.P(0).hand.length;
    S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); const s1 = S.view(0).start, l1 = S.g.log[0], m1 = [...new Set(S.legal(0).map(x => x.t))], hand1 = S.P(0).hand.length, don1 = S.P(0).don.active;
    const h1 = S.P(1).hand.length; S.act(0, { t: 'end' }); const s2 = S.view(1).start, s2o = S.view(0).start, l2 = S.g.log[0];
    ok('a turn\'s start is the engine\'s, never a move to take or skip (the owner: "a user should never be able to skip drawing a card, don"): the first player\'s first turn draws none and adds 1 DON!!, the second player\'s draws 1 and adds 2 -- in both seats\' views, the log saying it as it was',
       !!s1 && s1.i === 0 && s1.first && s1.drew === 0 && s1.don === 1 && hand1 === h0 && don1 === 1 && m1.every(t => ['play', 'give', 'activate', 'attack', 'end'].includes(t)) && said(l1, s1)
       && !!s2 && s2.i === 1 && !s2.first && s2.drew === 1 && s2.don === 2 && S.P(1).hand.length === h1 + 1 && S.P(1).don.active === 2 && JSON.stringify(s2o) === JSON.stringify(s2) && said(l2, s2), JSON.stringify({ s1, l1, s2, l2, m1 }));
    ok('...control: take 124\'s line on that first turn, "refresh, draw, +1 DON!!", is caught -- no card was drawn', (st => !said('Player 1 \u2014 refresh, draw, +1 DON!!', st) && !said('Player 1 \u2014 turn 1: refresh, draw 1, +1 DON!!', st) && said('Player 1 \u2014 turn 1: refresh, no draw on the first turn (\u00a76-3-1), +1 DON!!', st))({ turn: 1, first: true, drew: 0, don: 1 })); }
  /* 8-10. against the app, through the table's own taps: the band says the turn's start until the first move; the dock says the next
     action; End turn asks while an attack is left, and names it */
  { const sayStart = h => /class="tb-tick tb-start"><b>Your turn 1<\/b> \u00b7 no draw on the first turn \u00b7 \+1\u00a0DON!!<\/span>/.test(h);
    const sayNext = h => /<div class="tb-say tb-next">(?:<b>Next:<\/b> [^<]+, or End turn|<b>Nothing left to play or attack with<\/b> \u2014 End turn)/.test(h);
    S.new({ ...stock('stock-st01'), name: 'You' }, { ...stock('stock-st02'), name: 'The app' }, 0, { seed: 3, bot: 1 }); fresh(); SU.acted = null; V.paintSim(); V.simTap('keep:0');
    const b1 = board(); V.simTap('give:leader'); const b2 = board();
    ok('the band says what the turn\'s start did -- "Your turn 1 \u00b7 no draw on the first turn \u00b7 +1 DON!!" -- until the first move of the turn, then the log again (take 124 had one log line, cut short on a phone)', sayStart(b1) && !/tb-start/.test(b2) && /class="tb-tick">You give/.test(b2), (b1.match(/<span class="tb-tick[^"]*">[\s\S]{0,120}/) || [''])[0] + ' | ' + (b2.match(/<span class="tb-tick[^"]*">[\s\S]{0,80}/) || [''])[0]);
    ok('...control: take 124\'s band, the ticker alone, is caught', !sayStart('<span class="tb-tick">You \u2014 refresh, draw, +1 DON!!</span>'));
    /* the owner, on the look: against the app End turn "doesn't need to say then the app plays" -- two on one phone keep "then pass
       the phone" (the check of take 122's labels holds that) */
    const endAlone = h => /data-sim="end">End turn<\/button><\/span>/.test(h) && !/then the app plays/.test(h);
    ok('against the app, End turn stands alone -- no "then the app plays" under it (the owner)', endAlone(b1), (b1.match(/data-sim="end">[\s\S]{0,80}/) || [''])[0]);
    ok('...control: take 124\'s band as the owner saw it, the note under End turn, is caught', !endAlone('<button class="ghost go" data-sim="end">End turn</button><span class="note">then the app plays</span></span>'));
    ok('the dock says the next action in the Main Phase -- a card to play, who can attack, an ability -- or that only End turn is left, and on a first turn that no attack can be made (§6-5-6-1)', sayNext(b1) && sayNext(b2) && /no attacks on your first turn\./.test(b1), (b1.match(/<div class="tb-say tb-next">[\s\S]{0,160}/) || [''])[0]);
    ok('...control: take 124\'s dock line, "Tap a card for its moves; hold it to read it.", is caught', !sayNext('<div class="tb-dock"><div class="tb-say">Tap a card for its moves; hold it to read it.</div></div>'));
    V.simTap('end:now'); const t3 = S.g.turn, w3 = S.who(), b3 = board(), n3 = new Set(S.legal(0).filter(x => x.t === 'play').map(x => x.h)).size;
    /* the owner, on the look: "it says play 5 cards, you won't always play 5 cards of course" -- cards each playable now are not all
       playable together; the line names one card, or says "a card" (the lit ones) */
    const noCount = h => !/play \d+ cards/.test(h) && (n3 >= 2 ? /<b>Next:<\/b> play a card,/.test(h) : true);
    ok(`the next action never counts the cards to play: "play a card" where ${n3} can each be played now (the owner: "you won't always play 5 cards of course")`, n3 >= 2 && noCount(b3), (b3.match(/<div class="tb-say tb-next">[\s\S]{0,120}/) || [''])[0]);
    ok('...control: the line the owner saw, "play 5 cards, give DON!! and attack with ...", is caught', !noCount('<div class="tb-say tb-next"><b>Next:</b> play 5 cards, give DON!! and attack with your Leader and Brook, or End turn.</div>'));
    SU.sheet = null; V.simTap('end'); const asked = !!SU.sheet && SU.sheet.kind === 'endq', q = sheet(), still = S.g.turn === t3;
    ok('End turn asks while an attack is left, and names it -- "Your Leader can attack" -- and the turn goes on until the question\'s End turn (the owner: "Ensure if there\'s an outstanding action, the player knows about it")',
       t3 === 3 && w3 === 0 && /<b>Next:<\/b>[^<]*attack with your Leader/.test(b3) && asked && still && /<li>Your Leader can attack<\/li>/.test(q) && /data-sim="end:now">End turn<\/button>/.test(q) && /data-close="simSheet">Keep playing<\/button>/.test(q), JSON.stringify({ t3, w3, asked, still, q: q.slice(0, 200) }));
    V.simTap('end:now'); const t5 = S.g.turn;
    ok('...control: the same state, the one tap take 124 had (the question\'s End turn) ends the turn at once', t5 > t3, `turn ${t5}`);
    S.g = null; fresh(); }
  /* ...and with nothing left -- no card to play, no attacker, no ability (its [Activate: Main] lines taken away for the check) -- the dock
     says so and End turn ends the turn at once, unasked */
  { deal(); const P = S.P(0); P.leader.rested = true; P.chars = []; P.hand = []; P.stage = null; const of = S.offers; S.offers = function (i, t, ...r) { return t === 'main' ? [] : of.call(this, i, t, ...r); };
    fresh(); SU.sheet = null; V.paintSim(); const b4 = board(), t = S.g.turn; V.simTap('end'); S.offers = of;
    ok('...and with nothing left, the dock says so -- "Nothing left to play or attack with \u2014 End turn" -- and End turn ends the turn at once, unasked', /<b>Nothing left to play or attack with<\/b> \u2014 End turn/.test(b4) && S.g.turn > t && !SU.sheet, JSON.stringify({ t, now: S.g.turn, sheet: SU.sheet, dock: (b4.match(/<div class="tb-say tb-next">[\s\S]{0,120}/) || [''])[0] }));
    S.g = null; fresh(); V.go('sim'); }
  /* 11. a by-hand line is declined only where the rules let a line be: an [On Play] by hand that says neither "you may" nor a cost is
     opened and done, never skipped (take 124 offered Skip on every by-hand line); the app opens its own and says it made no move; a
     "you may" one keeps its decline; a [Trigger] from Life is added to hand instead (the owner: "technically optional to skip but why
     would you skip") */
  { const handWhere = (pred, anyType) => { for (const [id, L] of Object.entries(E)) { const p = byId(id); if (!p || p.sealed || (!anyType && p.type !== 'Character')) continue; const n = L.findIndex(e => e.hand && pred(e)); if (n >= 0) return { id: +id, n, e: L[n] }; } return null; };
    const must = handWhere(e => e.t === 'onplay' && !/^\s*you may\b/i.test(body(e.raw)) && !/^[^.:]*:/.test(body(e.raw)) && !e.if.some(c => c.c === 'opt'));
    const mayH = handWhere(e => e.t === 'onplay' && /^\s*you may\b/i.test(body(e.raw))), trigH = handWhere(e => e.t === 'trigger', true);
    const offerOf = (id, t, kk) => S.offers(0, t, kk, t === 'trigger' ? id : undefined, t === 'trigger').filter(o => o.hand);
    deal(); let kk = put(0, must.id); S.g.queue = offerOf(must.id, 'onplay', kk); const Lm = S.legal(0), rm = S.act(0, { t: 'fxskip' }); fresh(); V.paintSim(); const bm = board();
    const a1 = V.BOT.choose(0, S.legal(0)); S.act(0, a1); const a2 = V.BOT.choose(0, S.legal(0)); S.act(0, a2); const lm = S.g.log[0];
    ok(`a by-hand line the rules make happen is not the player's to pass by (§8-1-3-1): ${byId(must.id).name}'s "${body(must.e.raw).slice(0, 40)}" offers Resolve by hand alone, act refuses a Skip, the panel says it happens in full and the dock says to resolve it`,
       Lm.length === 1 && Lm[0].t === 'fxhand' && rm.ok === false && /\u00a78-1-3-1/.test(rm.why) && /data-sim="fxhand">Resolve by hand<\/button><span class="note">it happens in full/.test(bm) && !/data-sim="fxskip"/.test(bm) && /<b>Next:<\/b> resolve [^<]+\u2019s effect by hand\./.test(bm), JSON.stringify({ Lm, why: rm.why }));
    ok('...and the app opens its own and is done, the log saying no move was made -- it runs no by-hand words', a1.t === 'fxhand' && a2.t === 'handdone' && /: done by hand \u2014 no move made$/.test(lm), JSON.stringify({ a1, a2, lm }));
    { const d = S.declinable; S.declinable = function (o) { return !!o.hand || d.call(this, o); }; deal(); S.g.queue = offerOf(must.id, 'onplay', put(0, must.id)); const planted = S.legal(0).some(x => x.t === 'fxskip'); S.declinable = d;
      ok('...control: take 124\'s engine as it opened, every by-hand line declinable, offers the Skip', planted); }
    deal(); S.g.queue = offerOf(mayH.id, 'onplay', put(0, mayH.id)); const Ly = S.legal(0); fresh(); V.paintSim(); const by = board();
    deal(); S.P(0).hand.push(trigH.id); S.g.queue = offerOf(trigH.id, 'trigger', null); const Lt = S.legal(0); fresh(); V.paintSim(); const bt = board();
    ok(`a by-hand line that says "you may" keeps its decline, named Decline (${byId(mayH.id).name}); a [Trigger] from Life by hand is added to hand instead, named Add to hand (${byId(trigH.id).name}, §10-1-5)`,
       Ly.some(x => x.t === 'fxskip') && /data-sim="fxskip">Decline<\/button>/.test(by) && Lt.some(x => x.t === 'fxskip') && /data-sim="fxskip">Add to hand<\/button><span class="note">instead of its \[Trigger\]/.test(bt) && /<b>A \[Trigger\] from your Life:<\/b> use it, or add /.test(bt), JSON.stringify({ Ly, Lt })); }
  /* 12. the other's turn, and this seat is asked: the top bar says "your move" and the dock is outlined -- the app attacks the human */
  { S.new({ ...stock('stock-st01'), name: 'You' }, { ...stock('stock-st02'), name: 'The app' }, 1, { seed: 5, bot: 1 }); fresh(); SU.acted = null; V.simBotRun(); V.paintSim(); V.simTap('keep:0');
    let guard = 0; while (S.g.over === null && !(S.g.battle && S.who() === 0) && guard++ < 6) { V.simTap('end:now'); if (S.g.phase === 'main' && S.who() === 0 && S.g.queue.length) break; }
    const bb = board(), asked = !!S.g.battle && S.who() === 0 && S.g.active === 1;
    const says = h => /<span class="tb-stat"><b>Turn \d+<\/b> \u00b7 your move<\/span>/.test(h) && /class="tb-dock you"/.test(h);
    ok('in the other\'s turn, when the game waits on this seat -- the app attacks, block or not -- the top bar says "your move" and the dock is outlined', asked && says(bb), JSON.stringify({ turn: S.g.turn, battle: !!S.g.battle, who: S.who(), stat: (bb.match(/<span class="tb-stat">[\s\S]{0,60}/) || [''])[0] }));
    ok('...control: take 124\'s top bar there, "The app is playing", is caught', !says('<span class="tb-stat"><b>Turn 3</b> \u00b7 The app is playing</span><div class="tb-dock">'));
    S.g = null; fresh(); }
  S.g = null; }

section('take 126 — the host\'s "Image Coming Soon" is no card\'s picture; the Sim draws a card from another printing of it; DON!! cards read ドン!!; the marks in words a player reads');
{ const rows = V.CAT.rows, im = V.CAT.man.images || {}, byId = id => V.CAT.byId.get(+id);
  /* 1. the export: the printings whose picture the runner saw be the placeholder ship none (landmine 240) */
  const phIds = new Set((im.placeholder_ids || []).map(Number)), phRows = rows.filter(p => phIds.has(p.id));
  const sharedOf = rs => { const by = new Map(); rs.filter(p => p.hash != null && !p.sealed).forEach(p => by.set(p.hash, (by.get(p.hash) || new Set()).add(p.name))); return [...by].filter(([h, n]) => n.size > 1); };
  ok(`the build ships no picture for a printing whose picture the runner saw be the host's "Image Coming Soon": ${phRows.length} printings today (${phRows.filter(p => !p.sealed).length} cards, ${phRows.filter(p => p.sealed).length} sealed), each with no URL and no hash; and no hash is left on two names (landmines 226, 240)`,
     Array.isArray(im.placeholder_ids) && im.placeholder === phRows.length && phRows.every(p => p.img == null && p.hash == null) && sharedOf(rows).length === 0,
     JSON.stringify({ placeholder: im.placeholder, ids: (im.placeholder_ids || []).length, shared: sharedOf(rows).length }));
  const ph = phRows.find(p => !p.sealed), real = rows.find(p => !p.sealed && p.hash != null && p.img && ph && p.name !== ph.name);
  ok('...control: take 124\'s catalogue -- one hash on two names, a URL on the placeholder\'s printing -- is caught', !ph || (sharedOf([{ ...ph, hash: 77, img: 'x' }, { ...real, hash: 77 }]).length === 1 && [{ ...ph, img: 'x' }].some(p => p.img != null)));
  ok('...and Collect draws such a printing as it draws any card without a picture: its colours and its number, no picture, and no other printing\'s', !ph || (!/<img/.test(V.productPic(ph)) && /<img class="ref"/.test(V.productPic(real))), ph ? ph.num + ' ' + ph.name : 'none today');
  const pl = V.picturesLine(im), pl23 = V.picturesLine({ ...im, placeholder: 23 }), pl124 = V.picturesLine({ ...im, placeholder: undefined });   // 23 planted: the line reads the count, whatever today's is
  ok(`Diagnostics' pictures line counts the placeholder among the pictures the first host has not: "${pl.slice(0, 90)}..."`, pl23.includes('(23 of them the host’s “Image Coming Soon”, shipped with none)') && (!im.placeholder || pl.includes(`(${im.placeholder} of them the host’s “Image Coming Soon”, shipped with none)`)), pl23);
  ok('...control: take 124\'s manifest, with no count of it, reads as it did', !/Image Coming Soon/.test(pl124) && /have no picture at the first host; /.test(pl124), pl124);
  /* 2. the Sim: a card with no picture of its own is drawn with another printing's of the same card (the owner: "I'm noticing alot of
     cards in the sim without pictures, ensure we do a sweep and ensure we get as many pictures as possible") */
  const pic = p => typeof S.picOf === 'function' ? S.picOf(p) : (S.face(p.id).art ? p : null);   // a build before take 126 draws a card's own picture or none
  const cards = rows.filter(p => !p.sealed && p.num), own = cards.filter(p => p.hash != null), none = cards.filter(p => p.hash == null);
  const lent = none.filter(p => { const q = pic(p); return q && q.id !== p.id; }), bare = none.filter(p => !pic(p) || pic(p).id === p.id);
  const sameCard = (p, q) => q.num === p.num && q.name === p.name && q.hash != null && !q.sealed;
  const treatFirst = (p, q) => q.treat === p.treat || !cards.some(r => r.hash != null && r.num === p.num && r.name === p.name && r.treat === p.treat);
  ok(`the Sim draws a card with its own picture when the runner saw it serve (${own.length} printings)`, own.length > 0 && own.every(p => { const a = S.face(p.id).art; return !!a && a.thumb === V.artUrl(p); }));
  const lendOf = p => +((V.CAT.lend || {})[p.id]);
  ok(`...and a card with none of its own with the picture of another printing of the same card that the build chose -- the same number and name, one the runner saw serve, the same treatment first, then the oldest (a real scan more often than a reprint's SAMPLE image): ${lent.length} of ${none.length} today, ${bare.length} left bare`,
     lent.length > 0 && lent.every(p => { const q = pic(p), sibs = cards.filter(r => sameCard(p, r) && r.img && r.treat === q.treat); return sameCard(p, q) && treatFirst(p, q) && q.id === lendOf(p) && q.id === Math.min(...sibs.map(r => r.id)) && S.face(p.id).art.thumb === V.artUrl(q) && S.face(p.id).art.ground[0] === V.artColours(p)[0]; }),
     lent.slice(0, 3).map(p => `${p.num} ${p.name} <- ${pic(p).id}`).join('; '));
  ok('...and a card with no such printing is never drawn with another card\'s picture: its own URL, which the host may publish, or none', bare.every(p => { const q = pic(p); return !q || q.id === p.id; }), `${bare.length} bare`);
  { const L = V.CAT.lend || {}, p = lent[0] || none[0], keep = L[p.id], other = rows.find(r => r.hash != null && r.img && !r.sealed && r.name !== p.name), unseenSib = rows.find(r => r.num === p.num && r.name === p.name && r.hash == null && r.id !== p.id && r.img);
    L[p.id] = other.id; const q1 = pic(p); L[p.id] = unseenSib ? unseenSib.id : 0; const q2 = pic(p); L[p.id] = keep;
    ok('...control: a map naming another card, or a printing of this one the runner never saw serve, is refused -- the table draws the card or nothing, never another card', !!p && (!q1 || q1.id !== other.id) && (!q2 || !unseenSib || q2.id !== unseenSib.id), JSON.stringify({ p: p && p.id, planted: other && other.id, q1: q1 && q1.id, q2: q2 && q2.id })); }
  const dealt = [...new Set((V.CAT.stock || []).flatMap(d => [d.leader, ...d.cards.map(c => c.id)]))], unseen = dealt.filter(id => { const q = pic(byId(id)); return !q || q.hash == null; });
  ok(`every card the ready-made decks deal is drawn with a picture the runner saw serve (${dealt.length} printings; take 124 drew Jinbe, Nami and Jewelry Bonney in their colours)`, dealt.length > 100 && unseen.length === 0, unseen.map(id => byId(id).num + ' ' + byId(id).name).join(', '));
  ok('...control: take 124\'s rule -- a card\'s own picture or none -- leaves the placeholder\'s printings bare', !ph || !(ph.img && ph.hash != null), ph ? ph.num : 'none today');
  /* 3. DON!! cards read ドン!! in a black frame (the owner: "For don, replace the image/icon with the DON japanese, not the !!. Give them a black border") */
  const sym = (html.match(/<symbol id="g-donjp"[\s\S]*?<\/symbol>/) || [''])[0], css = (html.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1];
  S.new({ ...stock('stock-st01'), name: 'You' }, { ...stock('stock-st02'), name: 'The app' }, 0, { seed: 3, bot: 1 }); fresh(); V.paintSim(); V.simTap('keep:0'); V.simTap('end:now'); V.paintSim();
  const t = board(), v = S.view(S.g.active), tks = (t.match(/<i class="tk( r)?"><svg class="g"[^>]*><use href="#g-donjp"\/><\/svg><\/i>/g) || []).length;
  ok(`every DON!! card on the table -- the cost area's ${v.me.don.active + v.me.don.rested + v.them.don.active + v.them.don.rested}, and the DON!! decks' backs -- reads ドン!!, the icon's own strokes drawn as a symbol, and none reads the old "!!"`,
     /viewBox="17 -15 212 304"/.test(sym) && (sym.match(/<path /g) || []).length === 10 && tks === v.me.don.active + v.me.don.rested + v.them.don.active + v.them.don.rested && tks > 0
     && /<span class="sb dn"[^>]*><svg class="cb" aria-hidden="true"><use href="#g-donjp"\/><\/svg><\/span>/.test(t) && !/<i class="tk( r)?"><svg class="g"[^>]*><use href="#g-don"\/>/.test(t) && !/<span class="sb dn"[^>]*><svg class="cb" aria-hidden="true"><use href="#g-cardart"/.test(t), `${tks} DON!! cards`);
  ok('...control: take 124\'s DON!! card, the "!!" glyph on white, is caught', /<i class="tk( r)?"><svg class="g"[^>]*><use href="#g-don"\/>/.test('<i class="tk"><svg class="g" width="14" height="14"><use href="#g-don"/></svg></i>'));
  const rule = sel => (css.match(new RegExp('\\n' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')) || ['', ''])[1];
  ok('...each in a black frame of its own, a tenth of the card\'s width and never under 2px, where take 124 drew a 1.5px line; the DON!! deck\'s frame as wide', /background:#FFFFFF;/.test(rule('.tk')) && /border:max\(2px, calc\(var\(--cw\) \* \.028\)\) solid #0A0A0A/.test(rule('.tk')) && !/inset 0 0 0 1\.5px/.test(rule('.tk')) && /inset:max\(2px, calc\(var\(--cw\) \* \.028\)\)/.test(rule('.sb.dn::before')), rule('.tk'));   // the same width on every side: a percentage inset reads the height top and bottom
  S.g = null; fresh();
  /* 4. the marks say who plays a line, not what the tests know (the owner: "make it more human ... Right now it's clear that that's soley AI and for AI/the tests") */
  ok('the effect\'s marks are a player\'s words: none of the tests\' ("proven by a test", "no test has proven it yet", "does not run this line", "proven wrong") is in the app', !/proven by a test|no test has proven|does not run this line|version was proven wrong/.test(js), (js.match(/proven by a test|no test has proven|does not run this line|version was proven wrong/) || [''])[0]);
  const MK = (js.match(/const SIM_MARK = (\{[^}]*\});/) || [])[1], mk = MK ? Function('return ' + MK)() : {};
  ok('...a line a proof has shown right is unmarked; one with no proof asks for a Report if the app gets it wrong; a line the app does not play, or got wrong, is "Yours to play"',
     mk.proven === '' && mk.unproven === 'Not checked yet \u2014 if the app gets it wrong, tap Report' && /^Yours to play \u2014 the app can\u2019t do this one$/.test(mk.hand) && /^Yours to play \u2014/.test(mk.wrong), JSON.stringify(mk));
  const FX = V.CAT.effects, unproven = +Object.keys(FX).find(id => { const q = byId(id); return q && q.type === 'Character' && !q.sealed && !V.CAT.proof[id] && FX[id].some(e => !e.hand && e.t === 'onplay'); });
  const handC = +Object.keys(FX).find(id => { const q = byId(id); return q && q.type === 'Character' && !q.sealed && FX[id].length && FX[id].every(e => e.hand); });
  S.new({ ...stock('stock-st01'), name: 'Player 1' }, { ...stock('stock-st02'), name: 'Player 2' }, 0, { seed: 70 }); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); fresh();
  S.P(S.g.active).chars.push(S.inst(unproven, S.g.turn - 1), S.inst(handC, S.g.turn - 1)); V.paintSim(); V.simSheetOpen('zoom', 'm0'); const zu = sheet(); V.simSheetOpen('zoom', 'm1'); const zh = sheet();
  ok(`the zoom marks a line with no proof "Not checked yet" (${byId(unproven).name}) -- Report is the effect panel's -- and a by-hand line "Yours to play" (${byId(handC).name})`,
     /<div class="note">Not checked yet<\/div><div class="note">The app will: /.test(zu) && !/tap Report/.test(zu) && /<div class="note">Yours to play \u2014 the app can\u2019t do this one<\/div>/.test(zh), zu.slice(zu.indexOf('zm-line'), zu.indexOf('zm-line') + 160));
  S.g.queue = S.offers(S.g.active, 'onplay', 0).filter(o => !o.hand); V.paintSim(); const pb = board();
  ok('...and the effect panel, when that line resolves, says it with its Report beside it', /<div class="note tb-mark">Not checked yet \u2014 if the app gets it wrong, tap Report<\/div>/.test(pb) && /data-sim="report">Report<\/button>/.test(pb), (pb.match(/tb-mark">[^<]*/) || ['no mark'])[0]);
  S.g = null; fresh(); }
V.MODE.set('collect', false); V.go('home');
}
}
