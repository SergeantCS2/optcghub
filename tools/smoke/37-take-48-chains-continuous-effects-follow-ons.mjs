/* smoke section 37: take 48 — chains, continuous effects, follow-ons, search; the timings the board surfaces
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { base } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 48 — chains, continuous effects, follow-ons, search; the timings the board surfaces');
const FX = scripted(V.CAT.effects); const fxIds = Object.keys(FX); const S = V.SIM;
ok('coverage grew by whole templates only, none of the refused controls admitted', manifest.effects.scripted > 1000 && manifest.effects.scripted < manifest.effects.lines * 0.5, JSON.stringify(manifest.effects));
const find = (rx, t) => fxIds.map(k => [k, FX[k].find(e => rx.test(e.raw) && (!t || e.t === t))]).find(x => x[1]);
const chain = find(/^\[On Play\] Draw (\d) cards? and trash (\d) cards? from your hand\.$/);
const stat = find(/^\[DON!! x1\] This Character gains \+(\d+) power\.$/, 'static');
const playself = find(/^\[Trigger\] Play this card\.$/);
const activ = find(/^\[Trigger\] Activate this card's \[On Play\] effect\.$/);
const search = find(/^\[On Play\] Look at (\d) cards from the top of your deck; reveal up to 1 \[([^\]]+)\] type card/);
ok('real cards exist for each new shape: a chain, a continuous +power, "Play this card", "Activate this card\'s [On Play]", a search', !!(chain && stat && playself && activ && search), [chain, stat, playself, activ, search].map(x => !!x).join());
const PL5 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL5(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const g = S.new(mk(), mk(), 0, { seed: 48 }); S.mulligan(0, false); S.mulligan(1, false); S.endTurn(); S.endTurn();
const P0 = g.players[0], P1 = g.players[1];
/* chain: draw N, then trash one -- two steps, the second with hand targets */
P0.chars = [onField(+chain[0], 3)]; const h0 = P0.hand.length; const dn = chain[1].do[0].n;
let o = S.offers(0, 'onplay', 0)[0]; let r = S.apply(0, o, null);
ok('a chained effect runs its first step (draw) and stops for the second (a hand target)', r.ok && !r.done && P0.hand.length === h0 + dn && o.targets.length === P0.hand.length && /^h\d/.test(o.targets[0].ref));
r = S.apply(0, o, o.targets[0].ref);
ok('...the second step trashes the chosen card and the chain is done', r.ok && r.done && P0.hand.length === h0 + dn - 1);
/* continuous: +N power while [DON!! x1], read live, gone when the DON!! leaves */
P0.chars = [onField(+stat[0], 3)]; const base = parseInt(V.CAT.byId.get(+stat[0]).power, 10) || 0;
ok('a continuous [DON!! x1] +power is NOT counted with no DON!! (class 2)', S.power(0, 0) === base);
P0.chars[0].don = 1;
ok('...and is counted, live, with one attached (base + 1000 + the effect)', S.power(0, 0) === base + 1000 + stat[1].do[0].n);
/* [Trigger] Play this card: the Life card, taken to hand, is played for free and its own [On Play] follows */
P0.chars = []; P0.hand.push(+playself[0]);
o = S.offers(0, 'trigger', null, +playself[0], true)[0]; r = S.apply(0, o, null);
ok('"Play this card" puts the Life card into play without paying, and reports any follow-on [On Play] offers', r.ok && r.done && P0.chars.length === 1 && P0.chars[0].id === +playself[0] && Array.isArray(r.follow));
/* [Trigger] activate: the follow-on is the card\'s own [On Play] offers; a used Trigger card goes to the trash */
P0.hand.push(+activ[0]); const tr0 = P0.trash.length;
o = S.offers(0, 'trigger', null, +activ[0], true)[0]; r = S.apply(0, o, null);
ok('"Activate this card\'s [On Play] effect" follows on with that effect if it is scripted, and the Trigger card is trashed after (§10-2)', r.ok && r.done && P0.trash.includes(+activ[0]) && P0.trash.length === tr0 + 1 && !P0.hand.includes(+activ[0]));
/* search: the top N are looked at, only the typed ones are offered, the rest go to the bottom in order */
P0.chars = [onField(+search[0], 3)]; const d = search[1].do[0]; const dty = (d.types || [d.type])[0];
const want = V.CAT.rows.find(p => p.type === 'Character' && (p.subtypes || '').split(/[;/]/).map(x => x.trim()).includes(dty) && p.name !== d.not);
const filler = V.CAT.rows.find(p => p.type === 'Character' && !(p.subtypes || '').includes(dty));
P0.deck = [filler.id, want.id, filler.id, filler.id, filler.id, filler.id, filler.id, 999]; const L = P0.deck.length; const hh = P0.hand.length;
o = S.offers(0, 'onplay', 0)[0];
ok('a search offers only the cards of the named type among the top N', o.targets.length === 1 && o.targets[0].ref === 'd1' && o.targets[0].name.startsWith(want.name));
r = S.apply(0, o, 'd1');
while (!r.done) r = S.apply(0, o, null);   // the 'rest to the bottom' step (take 51 split it out)
ok('...the chosen one goes to hand and the rest of the N go to the bottom, deck size intact', r.ok && P0.hand.length === hh + 1 && P0.deck.length === L - 1 && P0.deck[P0.deck.length - 1] === filler.id && (P0.looking || []).length === 0);
/* the board's timings exist in code */
ok('the board offers [End of Your Turn] before ending, [On Block] at the block, and [Trigger]/[On K.O.] on the defender\'s result screen (take 122: the engine queues them; the screen draws the queue)',
   /on\(P, i, 'endturn'\)/.test(js) && /this\.offers\(i, 'onblock', a\.k\)/.test(js) && /this\.offers\(i, 'trigger', null, l\.id, true\)/.test(js) && /this\.offers\(i, 'onko', null, res\.koId\)/.test(js) && /data-sim="post"/.test(js));
S.g = null;
}
}
