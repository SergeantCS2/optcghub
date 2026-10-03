/* smoke section 83: take 123 — one view per seat: what a board may draw, and nothing its seat may not see
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { leaders } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 123 — one view per seat: what a board may draw, and nothing its seat may not see');
const S = V.SIM, R = V.CAT.rows, stock = V.CAT.stock;
const st01 = stock.find(d => d.id === 'stock-st01'), st02 = stock.find(d => d.id === 'stock-st02');
S.new(st01, st02, 0, { seed: 31 }); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); S.act(0, { t: 'end' }); S.act(1, { t: 'end' });
const P0 = S.P(0), P1 = S.P(1), leaders = new Set([P0.leader.id, P1.leader.id].map(id => S.card(id).name));
/* hidden cards: printings with names found nowhere else on this board, planted in each hand, Life, deck and look */
const seenName = new Set(), pool = R.filter(p => p.type === 'Character' && !p.sealed && p.num && !leaders.has(p.name) && !seenName.has(p.name) && seenName.add(p.name)).slice(0, 33);
const take = n => pool.splice(0, n).map(p => p.id);
P0.hand = take(5); P0.life = take(5); P0.deck = take(5); P0.looking = take(1); P1.hand = take(5); P1.life = take(5); P1.deck = take(5); P0.trash = []; P1.trash = [];
const cardOf = id => S.card(id), hide = ids => ids.map(cardOf);
const leak = (view, hidden) => { const ids = new Set(), text = JSON.stringify(view);
  (function walk(x) { if (x && typeof x === 'object') { if (typeof x.id === 'number') ids.add(x.id); if (typeof x.cardId === 'number') ids.add(x.cardId); Object.values(x).forEach(walk); } })(view);
  return hidden.filter(p => ids.has(p.id) || text.includes(JSON.stringify(p.name)) || (view.log || []).some(l => l.includes(p.name))); };   // a name in a log sentence too
const hidden0 = hide([...P1.hand, ...P0.life, ...P0.deck, ...P1.life, ...P1.deck]), hidden1 = hide([...P0.hand, ...P0.looking, ...P0.life, ...P0.deck, ...P1.life, ...P1.deck]);
const g0 = JSON.stringify(S.g), v0 = S.view(0), v1 = S.view(1);
ok('SIM.view is a read: two views change nothing in the game (landmine 215)', JSON.stringify(S.g) === g0);
ok('a seat\'s view holds nothing it may not see: the other hand, both Lives and both decks are counts, and what one player looks at is theirs alone (the owner: "private things only show when it\'s that player\'s turn")',
   leak(v0, hidden0).length === 0 && leak(v1, hidden1).length === 0 && v0.them.hand === null && v0.them.handCount === 5 && v1.me.lifeCount === 5 && v1.them.looking === null && v1.them.lookingCount === 1,
   leak(v0, hidden0).concat(leak(v1, hidden1)).map(p => p.name).join());
ok('...and its own: the seat\'s hand and what it looks at are in its view, each card whole', v0.me.hand.map(c => c.id).join() === P0.hand.join() && v0.me.looking[0].id === P0.looking[0] && v0.me.hand.every(c => c.name && c.colours && 'art' in c && c.play));
const planted = JSON.parse(JSON.stringify(v0)); planted.them.hand = P1.hand.map(id => S.face(id));
ok('...control: a view with the other hand planted in it is named, card by card', leak(planted, hidden0).length === 5);
ok('the moves and an effect\'s choices go to the seat deciding only', v0.legal.length > 0 && v1.legal.length === 0 && v0.who === 0 && v1.who === 0);
{ const FX = V.CAT.effects, sid = +Object.keys(FX).find(id => S.card(+id).type === 'Character' && FX[id].some(e => !e.hand && e.t === 'onplay' && e.if.length === 0 && e.do[0].a === 'search'));
  P0.chars = [onField(sid, 3)]; P0.deck = take(5).concat(P0.deck); S.g.queue = S.offers(0, 'onplay', 0).slice(0, 1);
  const a = S.view(0).offer, b = S.view(1).offer;
  ok('...a search\'s choices are the top of the searcher\'s deck: in the searcher\'s view, and not the opponent\'s, who sees the effect but not the cards', !!a && Array.isArray(a.choices) && b && b.choices === null && b.raw === a.raw && leak(S.view(1), hide(P0.deck)).length === 0);
  S.g.queue = []; P0.chars = []; }
/* a [Trigger] not yet used is a face-down Life card to the other seat: its player may add it to hand without revealing it
   (§10-1-5) -- the offer tells the attacker only that the game waits on a [Trigger], and a decline does not name it in the log */
{ const FX = V.CAT.effects, onBoard = new Set([...P0.hand, ...P0.life, ...P0.deck, ...P0.looking, ...P1.hand, ...P1.life, ...P1.deck].map(id => S.card(id).name));
  const tid = Object.keys(FX).map(Number).find(id => { const c = S.card(id); return c && c.type === 'Event' && !leaders.has(c.name) && !onBoard.has(c.name) && FX[id].some(e => e.t === 'trigger') && S.offers(1, 'trigger', null, id, true).length > 0; });
  const tc = S.card(tid); P1.hand.push(tid); S.g.queue = S.offers(1, 'trigger', null, tid, true).slice(0, 1);
  const a = S.view(0), b = S.view(1);
  ok('a [Trigger] its player has not used is a face-down Life card to the attacker: the attacker\'s view says the game waits on a [Trigger] and holds neither the card nor its text (§10-1-5)',
     !!tc && a.who === 1 && a.offer && a.offer.hidden === true && a.offer.t === 'trigger' && a.offer.cardId === null && a.offer.raw === null && leak(a, [tc]).length === 0, tc && leak(a, [tc]).map(p => p.name).join());
  ok('...and the defender\'s view has it whole, to decide on', b.offer && b.offer.hidden === false && b.offer.cardId === tid && !!b.offer.raw && b.legal.some(x => x.t === 'fxskip'));
  S.g.queue[0].fromLife = false; const c0 = leak(S.view(0), [tc]).length; S.g.queue[0].fromLife = true;
  ok('...control: the same offer from a card in play is public, and the check names it', c0 === 1);
  const r = S.act(1, { t: 'fxskip' });
  ok('declined, the card goes to hand unrevealed: the log says a Life card was added to hand, not which (§10-1-5)', r.ok && P1.hand.includes(tid) && /without revealing it/.test(S.g.log[0]) && leak(S.view(0), [tc]).length === 0, S.g.log[0]);
  const lg = JSON.parse(JSON.stringify(S.view(0))); lg.log.unshift(tc.name + ': the rest is declined');
  ok('...control: a log line naming it is found', leak(lg, [tc]).length === 1);
  P1.hand.splice(P1.hand.indexOf(tid), 1); S.g.queue = [];
  const hid = P1.hand[0], say = S.HAND.handtotop.call(S, { i: 1, P: P1, X: P1, xi: 1, a: { op: 'handtotop', h: 0 }, H: {}, nm: id => S.card(id).name }); P1.deck.shift(); P1.hand.unshift(hid);
  ok('by hand, a card put from hand on top of the deck is not named in the log: it is never revealed (take 123)', !!say && !say.includes(S.card(hid).name), say);
  ok('...control: the sentence take 122 wrote, naming it, is found', `places ${S.card(hid).name} at the top of the deck`.includes(S.card(hid).name)); }
/* the view carries what a playmat draws, so the UI pass needs nothing else (docs/SIM-UI.md) */
{ P0.chars = [onField(st01.cards.map(c => c.id).find(id => S.card(id).type === 'Character'), 3)]; const v = S.view(0), c = v.me.chars[0], L = v.me.leader;
  const fields = ['uid', 'seat', 'ref', 'id', 'num', 'name', 'cost', 'power', 'printedPower', 'rested', 'don', 'keywords', 'granted', 'kw', 'colours', 'art', 'text', 'lines', 'unapplied'];
  ok('each card on the field carries what a playmat draws: its uid and ref (the move names it by), power now and printed, rested, DON!!, keywords, colours, its picture, its text and each line with what the app does and its proof mark',
     fields.every(k => k in c && k in L) && c.ref === 0 && L.ref === 'leader' && (c.art === null || /^https:\/\//.test(c.art.thumb)) && Array.isArray(L.lines) && L.lines.every(x => x.does && x.proof), fields.filter(k => !(k in c)).join());
  P0.chars = []; }
/* the painters draw from the view alone */
{ /* take 124: the painters are every function between the two markers the build keeps (SIM_PAINTERS ... SIM_PAINTERS_END), so a painter
     added to the table is read with no list to forget it on (take 123 named fourteen); a painter may not hold a result act() returned */
  const from = js.indexOf("const SIM_PAINTERS = 'begin'"), to = js.indexOf("const SIM_PAINTERS_END = 'end'"), names = t => [...t.matchAll(/(?:^|\n)function (\w+)\(/g)].map(m => m[1]);
  const PAINTERS = from > 0 && to > from ? names(js.slice(from, to)) : [];
  const body = name => { const i = js.indexOf('function ' + name + '('); if (i < 0) return null; const j = js.slice(i + 9).search(/\n(?:function |const |\$\(|\/\*)/); return js.slice(i, j < 0 ? undefined : i + 9 + j); };
  const READS = /\bSIM\.(?:g\b|P\(|at\(|power\(|kwOf\(|card\(|canPlay\(|targetsOf\(|describe\(|proofOf\(|battlePowers\(|locate\(|has\(|unapplied\(|legal\(|act\()|\.players\b|CAT\.byId|\bSIMUI\.(?:result\b|post\.res\b)/;
  const bad = PAINTERS.filter(n => !body(n) || READS.test(body(n)));
  ok(`every painter of the board -- the ${PAINTERS.length} functions between the table\'s two markers -- draws from the view its seat is handed, never from the engine\'s state (take 123: a redesigned board cannot show what the seat was never given)`, PAINTERS.length >= 25 && ['simTableHtml', 'simOfferPanel', 'simDockHtml', 'simZoomHtml', 'simResultHtml'].every(n => PAINTERS.includes(n)) && bad.length === 0, bad.join() || String(PAINTERS.length));
  ok('...control: a painter that reads SIM.P is named, and one planted between the markers is found', READS.test(body('simDockHtml') + ' SIM.P(1).hand') && names(js.slice(from, to) + '\nfunction simProbe(v) { return SIM.P(1).hand; }\n').includes('simProbe'));
  ok('...control: take 123\'s result painter, reading what act() returned, is named', READS.test("function simPostHtml(v, offer) { return `${simResult(SIMUI.post.res)}${offer}`; }") && READS.test('function simTableHtml(v) { const res = SIMUI.result; }'));
  ok('two people on one phone are Player 1 and Player 2, never "You" (take 123\'s look: Player 2 read its opponent as You); against the app the human is You', /name: \(bot \? 'You' : 'Player 1'\)/.test(js) && /name: \(bot \? 'The app' : 'Player 2'\)/.test(js));
  ok('...and paintSim hands every painter the one view: SIM.view(simSeat())', /v = SIM\.g \? SIM\.view\(simSeat\(\)\) : null/.test(js)); }
S.g = null;
}
}
