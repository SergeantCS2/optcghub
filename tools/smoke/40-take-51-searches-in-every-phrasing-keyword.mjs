/* smoke section 40: take 51 — searches in every phrasing, keyword grants, cost changes, ids that follow the card
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { S, c } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 51 — searches in every phrasing, keyword grants, cost changes, ids that follow the card');
const FX = scripted(V.CAT.effects); const fxIds = Object.keys(FX); const S = V.SIM;
const actions = new Set(); for (const k of fxIds) for (const e of FX[k]) for (const st of e.do) actions.add(st.a);
ok('every action the parser emits is one the engine handles (a name the engine lacks would run nothing, silently)', [...actions].every(a => typeof S.DO[a] === 'function'), [...actions].filter(a => typeof S.DO[a] !== 'function').join());   // take 122: the handlers are the table SIM.DO
ok('no two actions share a name for different things (the take-51 collision: search-rest vs rest-a-character)', actions.has('restcards') && actions.has('rest') && S.DO.restcards !== S.DO.rest);
const find = (pred) => fxIds.map(k => [k, FX[k].find(pred)]).find(x => x[1]);
const two = find(e => e.do[0].a === 'search' && ((e.do[0].types || []).length + (e.do[0].names || []).length) === 2);
const named = find(e => e.do[0].a === 'search' && e.do[0].name);
const trashRest = find(e => e.do.some(st => st.a === 'restcards' && st.to === 'trash'));
const cm = find(e => e.do[0].a === 'costmod' && e.do.length === 1);
const koC = find(e => e.do.length === 1 && e.do[0].a === 'ko' && e.do[0].cost != null && !e.do[0].rested && e.t === 'onplay' && e.if.length === 0);
const rushT = find(e => e.t === 'onplay' && e.if.length === 0 && e.do.some(st => st.a === 'selfkw' && st.k === 'Rush') && e.do.every(st => ['selfkw', 'decktolife', 'draw', 'adddon', 'selfpower'].includes(st.a)));
const daT = find(e => e.do[0].a === 'selfkw' && e.do[0].k === 'Double Attack' && e.t === 'static');
const rushS = find(e => e.t === 'static' && e.do[0].a === 'selfkw' && e.do[0].k === 'Rush' && e.if.length === 1 && e.if[0].c === 'donx');
const neg = find(e => e.do[0].a === 'power' && e.do[0].sign_inferred && e.if.length === 0 && ['onplay', 'attack', 'main'].includes(e.t));
ok('real cards for each: two-type search, named search, trash-the-rest, cost-then-K.O., Rush grant on play, Double Attack when attacking, continuous Rush, the sign-inferred reduction', !!(two && named && trashRest && cm && koC && rushT && daT && rushS && neg), [two, named, trashRest, cm, koC, rushT, daT, rushS, neg].map(x => !!x).join());
const PL8 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL8(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const g = S.new(mk(), mk(), 0, { seed: 51 }); S.mulligan(0, false); S.mulligan(1, false); S.endTurn(); S.endTurn();
const P0 = g.players[0], P1 = g.players[1];
const sub = (p, t) => (p.subtypes || '').split(/[;/]/).map(x => x.trim()).includes(t);
/* two-type search: either type is revealed, the excluded name is not */
{ const d = two[1].do[0]; const hit = p => (d.types || []).some(ty => sub(p, ty)) || (d.names || []).includes(p.name);
  const toks = (d.types || []).concat(d.names || []); const okp = p => p.num && p.type !== 'Leader' && hit(p) && p.name !== d.not; const a = V.CAT.rows.find(okp), b = V.CAT.rows.filter(okp).find(p => p.name !== a.name), x = V.CAT.rows.find(p => p.type === 'Character' && p.num && !hit(p));
  P0.chars = [S.inst(+two[0], 3)]; P0.deck = [x.id, a.id, x.id, (b || a).id, x.id, x.id, x.id];
  const o = S.offers(0, two[1].t, 0)[0];
  ok(`a two-token search (${toks.join(' or ')}) reveals a card matching either token and nothing else`, !!o && o.targets.map(t => t.ref).join() === (d.n >= 4 ? 'd1,d3' : 'd1'), JSON.stringify(o && o.targets)); }
/* named search */
{ const d = named[1].do[0]; const w = V.CAT.rows.find(p => p.num && p.name === d.name), x = V.CAT.rows.find(p => p.type === 'Character' && p.num && p.name !== d.name);
  P0.chars = [S.inst(+named[0], 3)]; P0.deck = [x.id, x.id, w.id, x.id, x.id, x.id];
  const o = S.offers(0, named[1].t, 0)[0];
  ok('a search for a named card reveals only that card', !!o && o.targets.length === 1 && o.targets[0].ref === 'd2'); }
/* trash the rest */
{ P0.chars = [S.inst(+trashRest[0], 3)]; const n = trashRest[1].do[0].n; const x = V.CAT.rows.find(p => p.type === 'Character' && p.num && !(p.subtypes || '').includes((trashRest[1].do[0].types || ['~'])[0]));
  P0.deck = Array(n + 3).fill(x.id); const t0 = P0.trash.length, L = P0.deck.length; const o = S.offers(0, trashRest[1].t, 0)[0];
  let r = S.apply(0, o, null); while (!r.done) r = S.apply(0, o, null);
  ok('"Trash the rest": the looked-at cards go to the trash, not the bottom', r.ok && P0.trash.length === t0 + n && P0.deck.length === L - n);
  P0.deck.push(...Array(20).fill(x.id)); }   // take 122: an empty deck is a defeat at once (§9-2-1-2), so the planted deck is kept deep for what follows
/* cost change, then K.O. under the new cost */
{ const d0 = cm[1].do[0], d1 = koC[1].do[0]; const tgt = V.CAT.rows.find(p => p.type === 'Character' && p.num && S.cost(p) === d1.cost + 1);   // one over the K.O. line before the change
  P0.chars = [S.inst(+cm[0], 3), S.inst(+koC[0], 3)]; P1.chars = [S.inst(tgt.id, 1)];
  ok('before the cost change, the K.O. card does not see the over-cost Character', S.offers(0, 'onplay', 1)[0].targets.length === 0);
  const o = S.offers(0, cm[1].t, 0)[0];
  ok('the cost change offers the opponent\'s Character', !!o && o.targets.length === 1);
  let r = S.apply(0, o, 'o0');
  ok('after -N cost the effective cost is lower (never below zero)', r.ok && S.effCost(P1, 0) === Math.max(0, S.cost(tgt) + d0.n));
  ok('...and the K.O. card now sees it inside its cost line (the classic two-card play)', S.offers(0, 'onplay', 1)[0].targets.length === 1);
  S.endTurn(); S.endTurn();
  ok('a cost change lasts the turn only', P1.modl.every(m => m.cost == null) && S.effCost(P1, 0) === S.cost(tgt)); }
/* Rush granted on play: the Character may attack the turn it came in; Double Attack when attacking doubles the damage */
{ P0.chars = [S.inst(+rushT[0], g.turn)]; P1.chars = []; P0.life = [];   // the chain's second step asks for 2 or less Life
  ok('without the grant, a Character played this turn cannot attack', S.canAttack(0, 0).ok === false);
  const o = S.offers(0, 'onplay', 0)[0]; let rr = S.apply(0, o, null); while (rr.ok && !rr.done) rr = S.apply(0, o, null);
  ok('with [Rush] granted for the turn, it can', S.canAttack(0, 0).ok === true && S.kwOf(0, 0).includes('Rush'), JSON.stringify(rushT[1].do));
  S.endTurn(); S.endTurn();
  ok('...and the grant is gone next turn', !S.kwOf(0, 0).includes('Rush') || (V.CAT.byId.get(+rushT[0]).kw || '').includes('Rush')); }
{ P0.chars = [S.inst(+daT[0], 1)]; P0.modl = []; P1.modl = []; P1.chars = []; P1.life = P1.life.length >= 2 ? P1.life : P1.deck.splice(0, 2); const lb = P1.life.length;
  const need = daT[1].if.find(c => c.c === 'donx'); P0.chars[0].don = need ? need.n : 1;
  S.mod(0, 'u' + P0.chars[0].uid, 99999, 'turn');
  S.attack(0, 0, 'leader'); S.noBlock(); const res = S.resolve();
  /* take 110: this line ended "|| true" and could not fail; it now asks what its name says, with a control */
  const daOn = S.kwOf(0, 0).includes('Double Attack'), daGiven = P0.chars[0].don; P0.chars[0].don = daGiven - 1; const daShort = S.kwOf(0, 0).includes('Double Attack'); P0.chars[0].don = daGiven;
  ok('a continuous [Double Attack] under DON!!: the keyword is live while the DON!! is given', daOn, JSON.stringify(S.kwOf(0, 0)));
  ok('...control: one DON!! short, it is not', daShort === false);
  ok('...two Life cards were taken', res.win && res.life.length === 2 && P1.life.length === lb - 2, JSON.stringify(res.life.length)); }
/* continuous Rush under DON!!: live, and gone without the DON!! */
{ P0.chars = [S.inst(+rushS[0], g.turn)];
  ok('a continuous [DON!! x1] Rush is absent with no DON!!', !S.kwOf(0, 0).includes('Rush'));
  P0.chars[0].don = rushS[1].if[0].n;
  ok(`...and present with ${rushS[1].if[0].n} attached`, S.kwOf(0, 0).includes('Rush')); }
/* the inferred sign reduces */
{ P0.chars = [S.inst(+neg[0], 1)]; P1.chars = [S.inst(V.CAT.rows.find(p => p.type === 'Character' && p.num).id, 1)]; const b = S.power(1, 0);
  if (neg[1].t === 'attack') { P0.chars[0].turn = 1; }
  const o = S.offers(0, neg[1].t, 0)[0]; if (o) S.apply(0, o, 'o0');
  ok('the sign the source text lost is read as a reduction (landmine 113)', !!o && S.power(1, 0) === b + neg[1].do[0].n && neg[1].do[0].n < 0, JSON.stringify(neg[1])); }
/* ids: a modifier stays with its card when another card leaves */
{ P1.chars = [S.inst(V.CAT.rows.find(p => p.type === 'Character' && p.num).id, 1), S.inst(V.CAT.rows.find(p => p.type === 'Character' && p.num && p.power).id, 1)];
  const keep = P1.chars[1]; const bp = S.power(1, 1); S.mod(1, 'u' + keep.uid, 1000, 'turn');
  P1.chars.splice(0, 1);   // the first card leaves; the buffed one is now index 0
  ok('a modifier keyed by instance follows the card after the index shifts', S.power(1, 0) === bp + 1000); }
S.g = null;
}
}
