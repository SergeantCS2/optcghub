/* ==== Play online (take 131, D18): two phones, one game, a relay between them ====
   A match is a room on the relay (ONLINE.relay, the build's VAULT_RELAY): the host asks it for a code, the joiner
   types the code, each sends its deck list, the host deals (SIM.new with a random seed; who goes first is the seed's
   coin) and sends g.spec, the joiner rebuilds the same game (SIM.replay), and from then on every move goes to the
   relay and is applied on the relay's ECHO, never before it, so both tables follow one order. The relay orders and
   keeps; it judges nothing: SIM.act on each phone refuses an illegal move, and a refused move -- this phone's or the
   other's -- is skipped on both and said on screen. Both phones hold the whole seed: friends, not strangers (the
   setup says so). The code, the two deck lists and the moves are all that cross; the relay forgets a room a day
   after its last frame; no account. The seat's token is kept while a match is on, so a reload or a dropped socket
   picks the match up with `hello since N`. The relay itself is relay/ (room.js is its rules). */
const ONLINE = {
  relay: '__RELAY__',   // the build's VAULT_RELAY (BUILD), or empty: no online play in this build and nothing painted for it
  sess: null, ws: null, timer: null, pinger: null, pending: null, KEY: 'optcghub.online',
  ready() { return /^https?:\/\//.test(this.relay); },
  on() { return !!this.sess; },
  playing() { return !!(this.sess && this.sess.state === 'play' && SIM.g); },
  url(path) { return this.relay.replace(/\/$/, '') + path; },
  socketUrl(code, token) { return this.url('/ws/' + code).replace(/^http/, 'ws') + (token ? '?t=' + encodeURIComponent(token) : ''); },
  deckOf(d) { return d ? { name: d.name || '', leader: d.leader, cards: d.cards.map(c => ({ id: c.id, n: c.n })) } : null; },
  /* the board's mirror of the wire: what the painters read (docs/SIM-UI.md: a painter draws from the view and the board's own state) */
  mirror() { const s = this.sess, k = !s && this.kept();
    SIMUI.wire = { relay: this.ready(), on: !!s, code: s && s.code, seat: s && s.seat, live: !!(s && s.live), peer: !!(s && s.peer), deckId: s && s.deckId, deckTheirs: s && s.deckTheirs, lost: s && s.lost, pending: !!this.pending, playing: this.playing(), kept: k ? k.code : null }; },
  save() { try { const s = this.sess; if (s && s.token && s.state !== 'over' && !s.lost) localStorage.setItem(this.KEY, JSON.stringify({ code: s.code, seat: s.seat, token: s.token, deckId: s.deckId, at: Date.now() })); else localStorage.removeItem(this.KEY); } catch (e) {} },
  kept() { try { const k = JSON.parse(localStorage.getItem(this.KEY) || 'null'); return k && k.code && Date.now() - k.at < 864e5 ? k : null; } catch (e) { return null; } },
  fresh(code, seat, token, deck) { return { code, seat, token, state: seat === 0 ? 'host' : 'join', live: false, peer: false, deckId: deck ? deck.id : null, deckMine: this.deckOf(deck), deckTheirs: null, n: 0, refused: 0, lost: null }; },
  async host(deck) { if (!this.ready()) return toast('No relay in this build'); if (!deck) return toast('Pick a deck first');
    this.leave(false); const s = this.sess = this.fresh(null, 0, null, deck); this.mirror(); paintSim();
    let made = null; try { const r = await fetch(this.url('/new'), { method: 'POST' }); made = r.ok ? await r.json() : null; } catch (e) { made = null; }
    if (this.sess !== s) return;   // cancelled meanwhile
    if (!made || !made.code) return this.fail('the relay did not answer');
    s.code = made.code; s.token = made.token; this.save(); this.connect(); this.mirror(); paintSim(); },
  join(code, deck) { if (!this.ready()) return toast('No relay in this build'); if (!deck) return toast('Pick a deck first');
    const c = String(code || '').toUpperCase().replace(/[\s-]/g, ''); if (!/^[A-HJ-NP-Z2-9]{6}$/.test(c)) return toast('A code is six letters and digits, with no 0, O, 1 or I');
    this.leave(false); this.sess = this.fresh(c, 1, null, deck); this.connect(); this.mirror(); paintSim(); },
  /* a match kept from before a reload: the same seat, the moves asked for since 0 */
  resume() { const k = this.kept(); if (!k || this.sess || !this.ready()) return false; const d = DECKS.all().find(x => x.id === k.deckId) || null;
    this.sess = Object.assign(this.fresh(k.code, k.seat, k.token, d), { state: 'lobby' }); this.connect(); this.mirror(); return true; },
  setDeck(deck) { const s = this.sess; if (!s || SIM.g) return; s.deckId = deck ? deck.id : null; s.deckMine = this.deckOf(deck); if (s.deckMine && s.live) this.send({ t: 'deck', deck: s.deckMine }); this.save(); this.mirror(); },
  connect() { const s = this.sess; if (!s) return; this.drop(); let ws;
    try { ws = new WebSocket(this.socketUrl(s.code, s.token)); } catch (e) { return this.fail('no socket'); }
    this.ws = ws;
    ws.onopen = () => { if (this.ws !== ws) return; s.live = true; this.send({ t: 'hello', since: s.n }); if (s.deckMine && !SIM.g) this.send({ t: 'deck', deck: s.deckMine });
      this.pinger = setInterval(() => { try { ws.send('ping'); } catch (e) {} }, 25000); this.mirror(); paintSim(); };
    ws.onmessage = e => { if (this.ws !== ws) return; let f = null; try { f = JSON.parse(e.data); } catch (x) { return; } if (f && typeof f === 'object') this.frame(f); };   // 'pong' is not JSON
    ws.onclose = e => { if (this.ws !== ws) return; s.live = false; clearInterval(this.pinger); this.pinger = null; this.ws = null; const code = e && e.code;
      if (code === 4000) return this.fail('another phone took this seat'); if (code === 4001) return this.fail('the match expired on the relay');
      if (s.state === 'join' && !s.token) return this.fail('no match with that code, or it is full');   // refused before a seat was given
      if (s.state === 'over' || s.lost) { this.mirror(); return paintSim(); }
      this.timer = setTimeout(() => this.connect(), 1500 + Math.random() * 1500); this.mirror(); paintSim(); };
    ws.onerror = () => {}; },
  drop() { clearTimeout(this.timer); this.timer = null; clearInterval(this.pinger); this.pinger = null; if (this.sess) this.sess.live = false; const ws = this.ws; this.ws = null; if (ws) { try { ws.onclose = null; ws.onmessage = null; ws.close(); } catch (e) {} } this.mirror(); },
  send(f) { try { if (this.ws && this.ws.readyState === 1) { this.ws.send(JSON.stringify(f)); return true; } } catch (e) {} return false; },
  fail(why) { const s = this.sess; if (!s) return; s.lost = why; s.live = false; this.pending = null; this.drop(); this.save(); this.mirror(); paintSim(); },
  frame(f) { const s = this.sess; if (!s) return;
    switch (f.t) {
      case 'seat': s.seat = f.seat; if (f.token) s.token = f.token; if (f.code) s.code = f.code; if (s.state === 'join' || s.state === 'host') s.state = 'lobby'; this.save(); break;
      case 'peer': s.peer = !!f.on; if (f.on && s.deckMine && !SIM.g) this.send({ t: 'deck', deck: s.deckMine }); break;
      case 'deck': if (f.deck && typeof f.deck === 'object') s.deckTheirs = f.deck; break;
      case 'spec': if (SIM.g && SIM.g.spec && SIM.g.spec.seed === f.spec.seed) break; this.dealt(f.spec); break;
      case 'move': this.apply(f); break;
      case 'synced': break;
      case 'err': if (f.why === 'behind') { this.pending = null; this.send({ t: 'hello', since: s.n }); } else { this.pending = null; if (f.why !== 'nospec') toast('The relay refused that: ' + f.why); } break;
    }
    this.mirror(); paintSim(); },
  /* the host deals: both decks known and legal, the seed random, who goes first the seed's coin; the joiner rebuilds it from the spec */
  deal() { const s = this.sess; if (!s || s.seat !== 0 || SIM.g) return; if (!s.deckMine || !s.deckTheirs) return toast('Both decks first');
    const theirs = s.deckTheirs, bad = legality({ leader: theirs.leader, cards: theirs.cards || [] }).problems; if (bad.length) return this.fail('their deck is not legal: ' + bad[0]);
    const seed = Math.floor(Math.random() * 4294967296) >>> 0, first = seed & 1;
    SIM.new({ ...s.deckMine, name: 'Player 1' + (s.deckMine.name ? ' \u2014 ' + s.deckMine.name : '') }, { ...theirs, name: 'Player 2' + (theirs.name ? ' \u2014 ' + theirs.name : '') }, first, { seed });
    this.start(); if (!this.send({ t: 'spec', spec: SIM.g.spec })) { SIM.g = null; return this.fail('not connected'); } this.mirror(); paintSim(); window.scrollTo(0, 0); },
  dealt(spec) { const s = this.sess; if (!s) return; const r = SIM.replay(spec, []); if (!r.ok) { SIM.g = null; return this.fail('the deal could not be rebuilt: ' + r.why); } this.start(); window.scrollTo(0, 0); },
  start() { const s = this.sess; s.state = 'play'; s.n = 0; this.pending = null; Object.assign(SIMUI, { sel: null, focus: null, post: null, room: null, fxt: null, seen: 0, hurry: false, shown: new Set(), acted: null }); this.save(); },
  /* a move from this seat: sent, and applied when the relay echoes it (one order on both tables) */
  move(i, a) { const s = this.sess; if (i !== s.seat) return { ok: false, why: 'not your seat' }; if (this.pending) return { ok: false, why: 'still sending the last move' };
    if (!this.send({ t: 'move', n: s.n, move: a })) return { ok: false, why: 'not connected \u2014 reconnecting' }; this.pending = { n: s.n, a }; this.mirror(); return { ok: true, sent: true }; },
  apply(f) { const s = this.sess; if (!s || !SIM.g) return; if (f.n < s.n) return; if (f.n > s.n) { this.send({ t: 'hello', since: s.n }); return; }   // a gap: ask for what was missed
    const turn = SIM.g.turn, r = SIM.act(f.seat, f.move); s.n = f.n + 1; if (f.seat === s.seat) this.pending = null;
    if (!r.ok) { s.refused++; toast((f.seat === s.seat ? 'Your move was refused: ' : 'Their move was refused: ') + (r.why || '')); }
    else { if (f.seat === s.seat) SIMUI.acted = turn; SIMUI.sel = null; SIMUI.room = null; SIMUI.fxt = null; SIMUI.focus = null; }
    if (SIM.g.over !== null) { s.state = 'over'; this.save(); } },
  /* leaving: a game still on is conceded on both phones (sent, and applied here at once -- the socket closes before any echo), then bye */
  leave(concede) { const s = this.sess; if (!s) return; if (concede && this.playing() && SIM.g.over === null) { this.send({ t: 'move', n: s.n, move: { t: 'concede' } }); SIM.act(s.seat, { t: 'concede' }); }
    this.send({ t: 'bye' }); this.drop(); this.sess = null; this.pending = null; this.save(); this.mirror(); }
};
ONLINE.mirror();
/* Diagnostics' line: the relay this build carries and the match, if one is on */
function onlineLine() { if (!ONLINE.ready()) return 'no relay in this build (BUILD has no VAULT_RELAY)'; let host = ONLINE.relay; try { host = new URL(ONLINE.relay).host; } catch (e) {} const s = ONLINE.sess;
  return `relay ${host}` + (s ? ` \u00b7 ${s.state}${s.code ? ' ' + s.code : ''}, seat ${s.seat}, ${s.live ? 'live' : 'not connected'}${s.peer ? ', peer on' : ''}, ${s.n} moves${s.refused ? ', ' + s.refused + ' refused' : ''}${s.lost ? ' \u00b7 ' + s.lost : ''}` : ' \u00b7 no match'); }

