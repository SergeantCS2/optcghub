/* smoke section 42: take 55 — the opponent: whole games, bot against bot, with every card in exactly one zone
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { S, c, d, mk } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 55 — the opponent: whole games, bot against bot, with every card in exactly one zone');
const S = V.SIM, B = V.BOT;
const PL10 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL10(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
/* take 122: the engine shuffles with its own seed; both seats play through the one entry point (BOT.move -> SIM.act)
   and the invariants are read after EVERY move, not once a turn */
const zones = P => P.deck.length + P.hand.length + P.life.length + P.trash.length + P.chars.length + (P.stage != null ? 1 : 0) + 1 + P.looking.length;
const donSum = P => P.don.active + P.don.rested + P.donDeck + P.leader.don + P.chars.reduce((a, c) => a + c.don, 0);
const invariants = g => g.players.every(P => zones(P) === 51 && donSum(P) === 10 && P.chars.length <= 5 && P.don.active >= 0 && P.don.rested >= 0);
const playOne = (first, seed) => { const g = S.new(mk(), mk(), first, { seed }); let moves = 0, broke = null;
  while (g.over === null && moves < 6000) { const w = S.who(); const a = B.move(w); if (!a) { broke = `no move for seat ${w} at turn ${g.turn} (${g.phase})`; break; } moves++;
    if (!invariants(g)) { broke = `after move ${moves} (${JSON.stringify(a)}) at turn ${g.turn}: ` + g.players.map(P => `${zones(P)}/${donSum(P)}/${P.chars.length}`).join(' '); break; } }
  return { g, turns: g.turn, broke, actions: moves }; };
const r1 = playOne(0, 7), r2 = playOne(1, 8);
ok('a bot-versus-bot game runs to a defeat, from either first player', r1.g.phase === 'over' && r2.g.phase === 'over', `${r1.turns} and ${r2.turns} turns; over=${r1.g.over},${r2.g.over}`);
ok('every card was in exactly one zone after every move, DON!! summed to ten, never six Characters (class 4, as a running invariant)', !r1.broke && !r2.broke, r1.broke || r2.broke || '');
ok('the games were real games: attacks were declared and Life was taken', r1.g.log.some(l => /attacks/.test(l)) && r1.g.players.some(P => P.life.length < 5) && r1.actions > 20, String(r1.actions));
ok('the winner is named by the log line the rules require (defeat by damage with no Life, or by an empty deck)', r1.g.log.some(l => /defeat/.test(l)));
/* a game is its seed and its moves (take 122): what a Report carries, and what two phones will exchange */
const snap = g => JSON.stringify({ p: g.players, t: g.turn, a: g.active, o: g.over, ph: g.phase });
const live1 = snap(r1.g), rp = S.replay(r1.g.spec, r1.g.actions);
ok('a game is its seed and its moves: replayed, it ends in exactly the same state', rp.ok && snap(rp.g) === live1, rp.why || '');
const cut = r1.g.actions.slice(); cut.splice(Math.floor(cut.length / 2), 1); const rc = S.replay(r1.g.spec, cut);
ok('...control: with one move taken out, the replay does not end the same', !rc.ok || snap(rc.g) !== live1);
/* the board wiring: no curtain against the app, the human always on screen, the app's block and counter shown before Resolve */
ok('against the app there is no curtain and the human\'s screen is always the one shown', /if \(SIM\.g && SIM\.g\.bot != null\) return; const c = \$\('#simCurtain'\)/.test(js) && /if \(g\.bot != null\) return 1 - g\.bot;/.test(js));
ok('the app defends the moment it is attacked, and its block/counter are shown before the human resolves', /SIM\.g\.battle\.att !== SIM\.g\.bot \? \['resolve'\] : \[\]/.test(js) && /The app defends/.test(js));   // take 124: read as the app's moves come, one a beat
ok('the setup offers the app as an opponent and says what it is', /never sees your hand/.test(js));
S.g = null;
}
}
