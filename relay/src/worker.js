/* relay/src/worker.js -- the relay on Cloudflare (take 131, D18): a Worker that makes rooms, and a Durable
 * Object that owns one room -- its two sockets (the WebSocket hibernation API: a parked socket costs nothing
 * and survives the object's sleep), its spec and its moves in SQLite, and the alarm that forgets the room a
 * day after its last frame. The rules of a room are room.js; this file is the plumbing around them.
 *
 *   POST /new            -> { code, token }      a room and the host's seat token
 *   GET  /ws/<code>      -> 101                  a socket for the seat the token names, or the empty seat
 *   GET  /health         -> { ok: true }
 *
 * No account, no name, no identity: the code is the only key, the token the only proof of a seat. A phone's
 * 'ping' is answered 'pong' without waking the object (setWebSocketAutoResponse). */
import { newRoom, attach, onFrame, parse, makeCode, makeToken, CODE, LIMITS } from './room.js';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
const upgrade = req => (req.headers.get('Upgrade') || '').toLowerCase() === 'websocket';

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (u.pathname === '/' || u.pathname === '/health') return json({ ok: true, relay: 'optcghub', v: 1 });
    if (u.pathname === '/new') {
      if (req.method !== 'POST') return json({ error: 'POST' }, 405);
      for (let k = 0; k < 8; k++) {   // a code still in use (one in a billion) is drawn again
        const code = makeCode(), r = await env.ROOM.get(env.ROOM.idFromName(code)).fetch('https://room/init', { method: 'POST', body: JSON.stringify({ code }) });
        if (r.status === 200) return json(await r.json());
      }
      return json({ error: 'busy' }, 503);
    }
    const m = u.pathname.match(/^\/ws\/([A-Za-z0-9]{6})$/);
    if (m) { const code = m[1].toUpperCase(); if (!CODE.test(code)) return json({ error: 'code' }, 404);
      if (!upgrade(req)) return json({ error: 'websocket' }, 426);
      return env.ROOM.get(env.ROOM.idFromName(code)).fetch(req); }
    return json({ error: 'not found' }, 404);
  }
};

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx; this.room = null;
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS moves (n INTEGER PRIMARY KEY, body TEXT NOT NULL)');
      const meta = await ctx.storage.get('meta');
      if (meta) { this.room = Object.assign(meta, { moves: ctx.storage.sql.exec('SELECT body FROM moves ORDER BY n').toArray().map(r => JSON.parse(r.body)) }); }
      ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    });
  }
  /* the room without its moves is the meta record; the moves are rows */
  async save() { const { moves, ...meta } = this.room; await this.ctx.storage.put('meta', meta); }
  live(seat) { return this.ctx.getWebSockets('seat:' + seat); }
  tell(seat, frame) { const s = JSON.stringify(frame); for (const ws of this.live(seat)) { try { ws.send(s); } catch (e) {} } }
  async fetch(req) {
    const u = new URL(req.url), now = Date.now();
    if (u.pathname === '/init') {
      if (this.room && now - this.room.last < LIMITS.ttl) return json({ error: 'taken' }, 409);   // a room past its day with the alarm missed is free again
      const { code } = await req.json(); const token = makeToken(); this.room = newRoom(code, token, now);
      await this.ctx.storage.deleteAll(); this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS moves (n INTEGER PRIMARY KEY, body TEXT NOT NULL)');
      await this.save(); await this.ctx.storage.setAlarm(now + LIMITS.ttl); return json({ code, token });
    }
    if (upgrade(req)) {
      if (!this.room) return json({ error: 'no such room' }, 404);
      const a = attach(this.room, u.searchParams.get('t'), makeToken); if (!a.ok) return json({ error: a.why }, a.why === 'full' ? 409 : 403);
      if (a.minted) await this.save();
      const pair = new WebSocketPair(), [client, server] = Object.values(pair);
      for (const old of this.live(a.seat)) { try { old.close(4000, 'replaced'); } catch (e) {} }   // a reconnect takes the seat over
      this.ctx.acceptWebSocket(server, ['seat:' + a.seat]); server.serializeAttachment({ seat: a.seat });
      server.send(JSON.stringify({ t: 'seat', seat: a.seat, token: a.token, code: this.room.code }));
      server.send(JSON.stringify({ t: 'peer', on: this.live(1 - a.seat).length > 0 }));
      this.tell(1 - a.seat, { t: 'peer', on: true });
      await this.ctx.storage.setAlarm(now + LIMITS.ttl);
      return new Response(null, { status: 101, webSocket: client });
    }
    return json({ error: 'not found' }, 404);
  }
  async webSocketMessage(ws, message) {
    if (!this.room) { try { ws.close(4001, 'expired'); } catch (e) {} return; }
    const seat = (ws.deserializeAttachment() || {}).seat; if (seat !== 0 && seat !== 1) return;
    const p = parse(typeof message === 'string' ? message : ''); if (p.err) { ws.send(JSON.stringify({ t: 'err', why: p.err })); return; }
    const before = this.room.moves.length, r = onFrame(this.room, seat, p.f, Date.now());
    if (r.keep) {
      for (const m of this.room.moves.slice(before)) this.ctx.storage.sql.exec('INSERT INTO moves (n, body) VALUES (?, ?)', m.n, JSON.stringify(m));
      await this.save(); await this.ctx.storage.setAlarm(Date.now() + LIMITS.ttl);
    }
    for (const o of r.out) this.tell(o.to, o.frame);
    if (p.f.t === 'bye') { try { ws.close(1000, 'bye'); } catch (e) {} }
  }
  webSocketClose(ws, code, reason) {
    const seat = (ws.deserializeAttachment() || {}).seat; try { ws.close(code, reason); } catch (e) {}
    if ((seat === 0 || seat === 1) && !this.live(seat).some(w => w !== ws)) this.tell(1 - seat, { t: 'peer', on: false });
  }
  webSocketError(ws) { this.webSocketClose(ws, 1011, 'error'); }
  /* a day after the last frame: the room is forgotten -- its sockets closed, its storage emptied */
  async alarm() { for (const ws of this.ctx.getWebSockets()) { try { ws.close(4001, 'expired'); } catch (e) {} } await this.ctx.storage.deleteAll(); this.room = null; }
}
