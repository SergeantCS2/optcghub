/* smoke section 91: take 131 — Play online: two app copies, one game, the relay between them (A23 step 4, D18)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 131 — Play online: two app copies, one game, the relay between them (A23 step 4, D18)');
{
  const { memoryRelay } = await import('../../relay/src/memory.js');
  const mem = memoryRelay({ latency: 0 });
  const tick = (ms = 4) => new Promise(r => setTimeout(r, ms)), settle = async () => { for (let k = 0; k < 12; k++) await tick(); };
  const safe = f => { try { return f(); } catch (e) { return false; } };
  const gsnap = g => JSON.stringify({ p: g.players, t: g.turn, a: g.active, ph: g.phase, o: g.over, q: g.queue.length, h: g.hand });
  const has = !!(V.ONLINE && typeof V.ONLINE.host === 'function' && typeof V.simOnlineHtml === 'function' && typeof V.onlineLine === 'function');
  ok('the shipped build carries no relay: ONLINE.ready() is false, Play online is not painted, Diagnostics says why', has && V.ONLINE.relay === '' && !V.ONLINE.ready() && V.simOnlineHtml([]) === '' && /no relay in this build/.test(V.onlineLine()));
  ok('no unreplaced relay token in the shipped script', !js.includes('__RELAY__') && !html.includes('__RELAY__') && /relay: ''/.test(js));
  const app = async () => { const A = await boot({ quiet: true }); A.ctx.WebSocket = mem.WebSocket; A.ctx._net = (u, o) => /\/(new|health)$/.test(String(u).split('?')[0]) ? mem.fetch(u, o) : undefined; if (A.V.ONLINE) { A.V.ONLINE.relay = 'http://relay'; A.V.ONLINE.mirror(); } return A; };
  const H = await app(), J = await app();
  const decks = has ? (H.V.SIMUI.legalDecks().length >= 2 ? H.V.SIMUI.legalDecks() : H.V.CAT.stock).slice(0, 2) : [];
  const dd = () => decks.map(d => ({ d }));
  ok('two legal ready-made decks to play with', decks.length === 2 && decks.every(d => d.leader && H.V.legality(d).problems.length === 0));
  const panel = has ? H.V.simOnlineHtml(dd()) : '';
  ok('with a relay the setup paints Play online: a deck to pick, Host a match, Join with a code, who goes first, and "friends, not strangers"', /Play online/.test(panel) && /id="simDO"/.test(panel) && /data-sim="host"/.test(panel) && /id="simCode"/.test(panel) && /data-sim="join"/.test(panel) && /friends, not strangers/.test(panel) && /5-2-1-4/.test(panel));
  ok('a short code or one with 0, O, 1 or I is refused before the wire', safe(() => { J.V.ONLINE.join('ABC12', decks[1]); const a = !J.V.ONLINE.sess; J.V.ONLINE.join('ABC0DE', decks[1]); const b = !J.V.ONLINE.sess; return a && b; }));
  if (has) await H.V.ONLINE.host(decks[0]); await settle();
  const hs = has ? H.V.ONLINE.sess : null;
  ok('the host asked the relay for a room: a six-symbol code, a token, seat 0, live, no peer yet, the lobby', !!hs && /^[A-HJ-NP-Z2-9]{6}$/.test(hs.code) && typeof hs.token === 'string' && hs.seat === 0 && hs.live && !hs.peer && hs.state === 'lobby');
  const lobby = hs ? H.V.simOnlineHtml(dd()) : '';
  ok('the lobby paints the code large with Share, "waiting for your friend", and Deal disabled until the friend and their deck are here', !!hs && lobby.includes(hs.code) && /data-sim="sharecode"/.test(lobby) && /waiting for your friend/.test(lobby) && /data-sim="deal"[^>]*disabled/.test(lobby) && !/data-sim="host"/.test(lobby));
  ok('the seat is kept on the phone while the match is on, so a reload can come back to it', !!hs && safe(() => JSON.parse(H.store['optcghub.online']).code === hs.code && JSON.parse(H.store['optcghub.online']).token === hs.token));
  if (hs) J.V.ONLINE.join(' ' + hs.code.toLowerCase() + ' ', decks[1]); await settle();
  const jsess = has ? J.V.ONLINE.sess : null;
  ok('the joiner typed the code in any case and spacing: seated 1 with a token of its own, live; both see the peer', !!jsess && jsess.seat === 1 && typeof jsess.token === 'string' && jsess.token !== hs.token && jsess.live && jsess.peer && hs.peer && jsess.state === 'lobby');
  ok('the deck lists crossed as sent, without the phone\'s own deck id: the host holds the joiner\'s Leader and the joiner the host\'s', !!hs && !!hs.deckTheirs && hs.deckTheirs.leader === decks[1].leader && !!jsess.deckTheirs && jsess.deckTheirs.leader === decks[0].leader && !('id' in hs.deckTheirs));
  const lobby2 = hs ? H.V.simOnlineHtml(dd()) : '', lobbyJ = jsess ? J.V.simOnlineHtml(dd()) : '';
  ok('the host\'s lobby now says the friend is here, names their deck, and Deal is enabled; the joiner\'s says Player 2, the host is here, and has no Deal', /your friend is here/.test(lobby2) && /Their deck: /.test(lobby2) && /data-sim="deal"(?![^>]*disabled)/.test(lobby2) && /Player 2/.test(lobbyJ) && /the host is here/.test(lobbyJ) && !/data-sim="deal"/.test(lobbyJ));
  safe(() => J.V.ONLINE.deal()); ok('a Deal from the joiner deals nothing', has && !J.V.SIM.g);
  safe(() => H.V.ONLINE.deal()); await settle();
  const G = has ? H.V.SIM.g : null, G2 = has ? J.V.SIM.g : null;
  ok('the host dealt and the joiner rebuilt the same game from the spec: the same seed, who goes first, the same hands; both at play, no bot', !!G && !!G2 && G.spec.seed === G2.spec.seed && G.first === G2.first && gsnap(G) === gsnap(G2) && hs.state === 'play' && jsess.state === 'play' && G.bot == null);
  ok('who goes first is the seed\'s coin', !!G && G.first === (G.spec.seed & 1));
  ok('each phone paints its own seat whoever decides: simSeat is 0 on the host and 1 on the joiner', !!G && H.V.simSeat() === 0 && J.V.simSeat() === 1);
  const who = G ? H.V.SIM.who() : null, M = who === 0 ? H : J, O = who === 0 ? J : H;
  ok('a move for the other seat is refused on this phone before it reaches the wire', !!G && safe(() => O.V.ONLINE.move(who, { t: 'keep' }).why === 'not your seat'));
  if (G) { M.V.paintSim(); M.V.simTap('keep:' + who); }
  ok('a move is sent and NOT applied before the relay echoes it: pending, no action recorded yet, the board\'s mirror says sending', !!G && !!M.V.ONLINE.pending && M.V.SIM.g.actions.length === 0 && M.V.SIMUI.wire.pending === true);
  ok('...and a second move while one is pending is refused', !!G && safe(() => M.V.ONLINE.move(who, { t: 'keep' }).ok === false));
  await settle();
  ok('on the echo both phones applied it: one action each, the same game, nothing pending', !!G && H.V.SIM.g.actions.length === 1 && J.V.SIM.g.actions.length === 1 && gsnap(H.V.SIM.g) === gsnap(J.V.SIM.g) && !M.V.ONLINE.pending && hs.n === 1 && jsess.n === 1);
  const who2 = G ? H.V.SIM.who() : null, M2 = who2 === 0 ? H : J;
  if (G) { M2.V.paintSim(); M2.V.simTap('keep:' + who2); } await settle();
  ok('the other seat kept over the wire: both games past the mulligan, the same', !!G && H.V.SIM.g.phase !== 'mulligan' && gsnap(H.V.SIM.g) === gsnap(J.V.SIM.g) && hs.n === 2);
  if (G) { H.V.paintSim(); J.V.paintSim(); }
  const stat = A => { const m = A.doc.getElementById('simBoard').innerHTML.match(/<span class="tb-stat">(.*?)<\/span>/); return m ? m[1].replace(/<[^>]+>/g, '') : ''; };   // the top bar's words alone: the band and the log name the players
  const topH = G ? stat(H) : '', topJ = G ? stat(J) : '';
  ok('the table\'s top bar speaks to one seat: "your turn" on the phone whose turn it is, "their turn" on the other, never "Player 1’s turn"', !!G && ((/your turn/.test(topH) && /their turn/.test(topJ)) || (/your turn/.test(topJ) && /their turn/.test(topH))) && !/Player [12]’s turn/.test(topH + topJ), topH + ' | ' + topJ);
  const idle = G ? (H.V.SIM.who() === 0 ? J : H) : null;
  if (idle) idle.V.ONLINE.send({ t: 'move', n: idle.V.ONLINE.sess.n, move: { t: 'end' } }); await settle();
  ok('a move the rules refuse, pushed by the idle seat as a changed app would, is refused by BOTH engines, counted on both, and the games stay the same', !!G && hs.n === 3 && jsess.n === 3 && H.V.SIM.g.actions.length === 2 && J.V.SIM.g.actions.length === 2 && gsnap(H.V.SIM.g) === gsnap(J.V.SIM.g) && hs.refused >= 1 && jsess.refused >= 1 && /refused/.test(H.V.onlineLine()));
  const D = G ? (H.V.SIM.who() === 0 ? J : H) : null, Mv = D === J ? H : J;
  if (D) { D.V.ONLINE.drop(); Mv.V.paintSim(); Mv.V.simTap('end:now'); } await settle();
  ok('with the other phone\'s socket dropped, the mover\'s End turn still went through the relay and applied on the echo; the dropped phone missed it and reads not live', !!G && Mv.V.SIM.g.actions.length === 3 && D.V.SIM.g.actions.length === 2 && !D.V.ONLINE.sess.live && D.V.SIMUI.wire.live === false);
  if (D) D.V.ONLINE.connect(); await settle();
  ok('the dropped phone reconnected with its token and asked for the moves since N: it caught up and the games are the same again', !!G && D.V.ONLINE.sess.live && D.V.SIM.g.actions.length === 3 && gsnap(H.V.SIM.g) === gsnap(J.V.SIM.g));
  ok('Diagnostics names the relay, the match, the seat, the moves and the refusals', !!G && /^relay relay · play [A-HJ-NP-Z2-9]{6}, seat 0, live, peer on, 4 moves, 1 refused$/.test(H.V.onlineLine()), has ? H.V.onlineLine() : '');
  const K = await app(); if (has) { K.store['optcghub.online'] = J.store['optcghub.online']; K.V.ONLINE.mirror(); }
  ok('a fresh boot sees the kept seat and paints "Back to <code>"', !!G && K.V.SIMUI.wire.kept === hs.code && new RegExp('data-sim="resume"[^>]*>Back to ' + hs.code).test(K.V.simOnlineHtml(dd())));
  safe(() => K.V.ONLINE.resume()); await settle();
  ok('the resumed copy rebuilt the game from the relay\'s spec and moves: the same game as the host\'s, seat 1, four moves read', !!G && !!K.V.SIM.g && gsnap(K.V.SIM.g) === gsnap(H.V.SIM.g) && K.V.ONLINE.sess.seat === 1 && K.V.ONLINE.sess.n === 4);
  ok('...and the earlier joiner\'s socket was closed as replaced: another phone took the seat', !!G && !!J.V.ONLINE.sess && J.V.ONLINE.sess.lost === 'another phone took this seat');
  safe(() => K.V.ONLINE.leave(true)); await settle();
  ok('leaving a game still on concedes it on both phones: the host\'s game is over with Player 1 the winner, the leaver\'s room closed and its kept seat forgotten', !!G && H.V.SIM.g.over === 0 && !K.V.ONLINE.sess && !K.store['optcghub.online'] && H.V.ONLINE.sess.state === 'over');
  if (hs) mem.expire(hs.code); await settle();
  ok('a room expired on the relay closes the host\'s socket with its reason, said on the board\'s mirror', !!hs && /expired/.test(H.V.ONLINE.sess.lost || '') && /expired/.test(H.V.SIMUI.wire.lost || ''));
  ok('nothing but the named frames crossed the wire', mem.log.length > 10 && mem.log.every(l => ['seat', 'peer', 'spec', 'move', 'synced', 'err', 'deck'].includes(l.frame.t)));
  ok('the online panel is a painter between the table\'s markers, so the painters\' rule above reads it', /function simOnlineHtml\(/.test(js.slice(js.indexOf("const SIM_PAINTERS = 'begin'"), js.indexOf("const SIM_PAINTERS_END = 'end'"))));
  ok('the hot-seat and the app\'s opponent are untouched: with no room on, simAct applies at once', has && !V.ONLINE.on() && !V.ONLINE.playing() && V.SIMUI.wire.on === false && /if \(ONLINE\.playing\(\)\) return ONLINE\.move\(i, a\)/.test(js));
}
}
