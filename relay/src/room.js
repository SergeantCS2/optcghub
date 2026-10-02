/* relay/src/room.js -- a room, pure (take 131, D18: two phones across the internet).
 *
 * A room is a six-character code, two seats, the host's deal (the spec, once) and the moves in the
 * order the relay received them. This module holds that state and says what each frame does to it.
 * It reads no clock, no socket and no storage: the adapters do -- worker.js on Cloudflare (a Durable
 * Object per room), memory.js in the harnesses (smoke, the look) -- and call in here.
 *
 * The relay ORDERS; it never judges a move. The engine on each phone refuses an illegal one
 * (SIM.act answers ok: false), so a modified client can only read. Both phones hold the whole seed:
 * friends, not strangers (docs/DECISIONS-OPEN.md D18; the app says so where a match is hosted).
 *
 * Frames, JSON text under LIMITS.frame bytes, a phone's seat stamped by the socket it came on:
 *   in   hello {since}      the phone holds `since` moves: answer the spec (if dealt), the moves from
 *                           `since` on, then `synced {have}`
 *   in   deck {deck}        a seat's deck list, forwarded live to the other seat, never kept
 *   in   spec {spec}        the host's deal (seat 0, once): kept, sent to seat 1
 *   in   move {n, move}     numbered: n must be the next; kept; echoed to BOTH seats, and a phone
 *                           applies a move on the echo, never before it, so both tables see one order
 *   in   bye                the seat is leaving: the other hears peer {on: false, bye: true}
 *   out  seat {seat, token, code}   on attach (the adapter's), peer {on} on presence (the adapter's)
 *   out  err {why}          shape | unknown | host | dealt | nospec | behind {have} | long | big | json
 */
export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 32 symbols, no 0/O/1/I: a code is read aloud
export const CODE = /^[A-HJ-NP-Z2-9]{6}$/;
export const LIMITS = { frame: 16 * 1024, moves: 2000, ttl: 24 * 60 * 60 * 1000 };

const pick = (rand, n) => { let s = ''; for (let i = 0; i < n; i++) s += ALPHABET[Math.floor(rand() * ALPHABET.length) % ALPHABET.length]; return s; };
export function makeCode(rand = Math.random) { return pick(rand, 6); }
export function makeToken(rand = Math.random) { return pick(rand, 20); }
/* what a person typed, as a code: upper case, spaces and dashes dropped. The alphabet has no 0, O, 1 or I, so a
   typed one is not a lookalike to repair but a code that cannot exist: CODE refuses it and the app says why */
export function cleanCode(s) { return String(s || '').toUpperCase().replace(/[\s-]/g, ''); }

export function newRoom(code, token, now) { return { v: 1, code, tokens: [token, null], spec: null, moves: [], created: now, last: now }; }

/* a socket arrives: with a token, the seat that token names; without one, the empty seat, given a token of its own */
export function attach(room, token, mint = makeToken) {
  if (token) { const seat = room.tokens.indexOf(String(token)); return seat < 0 ? { ok: false, why: 'token' } : { ok: true, seat, token: room.tokens[seat], minted: false }; }
  if (room.tokens[1]) return { ok: false, why: 'full' };
  room.tokens[1] = mint(); return { ok: true, seat: 1, token: room.tokens[1], minted: true };
}

/* one frame from one seat: what goes out (to 0, 1 or both), and whether the room changed (the adapter persists) */
export function onFrame(room, seat, f, now) {
  const err = (why, more) => ({ out: [{ to: seat, frame: Object.assign({ t: 'err', why }, more || {}) }], keep: false });
  if (!f || typeof f !== 'object' || typeof f.t !== 'string') return err('shape');
  switch (f.t) {
    case 'hello': { const since = Number.isInteger(f.since) && f.since >= 0 ? f.since : 0, out = []; room.last = now;
      if (room.spec) out.push({ to: seat, frame: { t: 'spec', spec: room.spec } });
      for (const m of room.moves.slice(since)) out.push({ to: seat, frame: m });
      out.push({ to: seat, frame: { t: 'synced', have: room.moves.length, dealt: !!room.spec } });
      return { out, keep: true }; }
    case 'deck': if (!f.deck || typeof f.deck !== 'object') return err('shape'); room.last = now;
      return { out: [{ to: 1 - seat, frame: { t: 'deck', seat, deck: f.deck } }], keep: true };
    case 'spec': if (seat !== 0) return err('host'); if (room.spec) return err('dealt');
      if (!f.spec || typeof f.spec !== 'object' || !Array.isArray(f.spec.decks) || f.spec.decks.length !== 2 || !Number.isInteger(f.spec.seed)) return err('shape');
      room.spec = f.spec; room.last = now; return { out: [{ to: 1, frame: { t: 'spec', spec: f.spec } }], keep: true };
    case 'move': if (!room.spec) return err('nospec'); if (!f.move || typeof f.move !== 'object' || typeof f.move.t !== 'string') return err('shape');
      if (f.n !== room.moves.length) return err('behind', { have: room.moves.length });
      if (room.moves.length >= LIMITS.moves) return err('long');
      { const m = { t: 'move', n: room.moves.length, seat, move: f.move }; room.moves.push(m); room.last = now; return { out: [{ to: 0, frame: m }, { to: 1, frame: m }], keep: true }; }
    case 'bye': room.last = now; return { out: [{ to: 1 - seat, frame: { t: 'peer', on: false, bye: true } }], keep: true };
    default: return err('unknown');
  }
}

/* a frame off the wire: text, within the limit, JSON -- or the error to send back */
export function parse(text) {
  if (typeof text !== 'string') return { err: 'big' };
  if (text.length > LIMITS.frame) return { err: 'big' };
  try { const f = JSON.parse(text); return f && typeof f === 'object' ? { f } : { err: 'shape' }; } catch (e) { return { err: 'json' }; }
}
