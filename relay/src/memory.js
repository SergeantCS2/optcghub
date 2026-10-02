/* relay/src/memory.js -- the relay in memory: the same room module behind a WebSocket-shaped class and a
 * fetch for POST /new, so the shipped app runs against it inside smoke (two app copies, one relay) and a
 * test reads the module without a runtime. Delivery is asynchronous (a timer), as a network is: nothing
 * arrives inside the call that sent it. */
import { newRoom, attach, onFrame, parse, makeCode, makeToken, CODE } from './room.js';

export function memoryRelay({ rand = Math.random, now = () => Date.now(), latency = 0 } = {}) {
  const rooms = new Map();          // code -> { room, socks: [ws|null, ws|null] }
  const log = [];                   // every frame delivered, for a test to read
  const later = f => setTimeout(f, latency);
  const deliver = (ws, frame) => { if (!ws || ws.readyState !== 1) return; log.push({ to: ws._seat, code: ws._code, frame }); later(() => { if (ws.readyState === 1 && ws.onmessage) ws.onmessage({ data: JSON.stringify(frame) }); }); };
  const send = (R, to, frame) => { if (to === 0 || to === 1) deliver(R.socks[to], frame); };
  class MemorySocket {
    constructor(url) { this.url = String(url); this.readyState = 0; this.onopen = null; this.onmessage = null; this.onclose = null; this.onerror = null; this._seat = null; this._code = null; later(() => open(this)); }
    send(text) { if (this.readyState !== 1) throw new Error('not open'); frame(this, text); }
    close(code = 1000, reason = '') { if (this.readyState >= 2) return; this.readyState = 3; const R = rooms.get(this._code); if (R && R.socks[this._seat] === this) { R.socks[this._seat] = null; send(R, 1 - this._seat, { t: 'peer', on: false }); } later(() => this.onclose && this.onclose({ code, reason })); }
  }
  function open(ws) {
    const m = ws.url.match(/\/ws\/([A-Z2-9]{6})(?:\?t=([A-Z2-9]+))?$/i), code = m && m[1].toUpperCase(), R = code && rooms.get(code);
    const fail = (why) => { ws.readyState = 3; ws.onerror && ws.onerror({ why }); ws.onclose && ws.onclose({ code: 4004, reason: why }); };
    if (!m || !CODE.test(code) || !R) return fail('no such room');
    const a = attach(R.room, m[2] || null, () => makeToken(rand)); if (!a.ok) return fail(a.why);
    ws._seat = a.seat; ws._code = code; const old = R.socks[a.seat]; if (old && old !== ws) { old.readyState = 3; later(() => old.onclose && old.onclose({ code: 4000, reason: 'replaced' })); }
    R.socks[a.seat] = ws; ws.readyState = 1; ws.onopen && ws.onopen({});
    deliver(ws, { t: 'seat', seat: a.seat, token: a.token, code }); deliver(ws, { t: 'peer', on: !!R.socks[1 - a.seat] }); send(R, 1 - a.seat, { t: 'peer', on: true });
  }
  function frame(ws, text) {
    const R = rooms.get(ws._code); if (!R) return; const p = parse(text); if (p.err) return deliver(ws, { t: 'err', why: p.err });
    const r = onFrame(R.room, ws._seat, p.f, now()); for (const o of r.out) send(R, o.to, o.frame);
    if (p.f.t === 'bye') ws.close(1000, 'bye');
  }
  /* POST /new: a room and the host's token; anything else is 404 */
  async function fetch(url, opts = {}) {
    const u = String(url), method = (opts.method || 'GET').toUpperCase();
    if (/\/new$/.test(u) && method === 'POST') { let code; do { code = makeCode(rand); } while (rooms.has(code)); const token = makeToken(rand);
      rooms.set(code, { room: newRoom(code, token, now()), socks: [null, null] }); const body = { code, token }; return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) }; }
    if (/\/health$/.test(u)) return { ok: true, status: 200, json: async () => ({ ok: true, relay: 'memory' }) };
    return { ok: false, status: 404, json: async () => ({ error: 'not found' }), text: async () => 'not found' };
  }
  /* a day passes: the room is forgotten (what the Worker's alarm does) */
  function expire(code) { const R = rooms.get(code); if (!R) return false; R.socks.forEach(s => s && s.close(4001, 'expired')); rooms.delete(code); return true; }
  return { WebSocket: MemorySocket, fetch, rooms, log, expire };
}
