#!/usr/bin/env node
/* relay/test.mjs -- the relay's checks (take 131).
 *
 *   node relay/test.mjs             the room module and the memory adapter, every guard with its case
 *   node relay/test.mjs --selftest  the suite watched to FAIL on a room module broken on purpose (four plants)
 *   node relay/test.mjs --dev       also start `wrangler dev` here and run the same exchange against the Worker
 *   node relay/test.mjs --url http://host:port   the exchange against a relay already running
 *
 * Exit 1 on any failure. The gate runs the first two; the PR check runs --dev on the runner. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), flag = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
let pass = 0, fail = 0; const failures = [];
const ok = (name, cond, extra = '') => { if (cond) pass++; else { fail++; failures.push(name); console.log(`  FAIL  ${name}  ${extra}`); } };
const tick = (ms = 5) => new Promise(r => setTimeout(r, ms));
const seq = () => { let t = 1; return () => { t = (t * 48271) % 2147483647; return t / 2147483647; }; };   // a fixed stream: the codes and tokens repeat run to run

/* ---- the room module, pure, then the memory adapter ----------------------------------------------------- */
export async function suite(roomUrl, memUrl) {
  const R = await import(roomUrl), M = await import(memUrl);
  const { makeCode, makeToken, cleanCode, newRoom, attach, onFrame, parse, CODE, LIMITS, ALPHABET } = R;
  const rand = seq();
  ok('a code is six symbols of the alphabet, none of them 0, O, 1 or I', [...Array(500)].every(() => { const c = makeCode(rand); return CODE.test(c) && !/[0O1I]/.test(c); }) && ALPHABET.length === 32);
  ok('a token is twenty symbols', makeToken(rand).length === 20 && /^[A-HJ-NP-Z2-9]+$/.test(makeToken(rand)));
  ok('what a person typed is cleaned (case, spaces, dashes), and a 0, O, 1 or I in it is a code that cannot exist', cleanCode(' ab c-de f') === 'ABCDEF' && CODE.test(cleanCode('ab c-de f')) && ['ABCDE0', 'ABCDEO', 'ABCDE1', 'ABCDEI'].every(c => !CODE.test(cleanCode(c))));
  const room = newRoom('ABCDEF', 'HOSTTOKEN', 1000);
  const h = attach(room, 'HOSTTOKEN'); ok('the host’s token seats the host (0)', h.ok && h.seat === 0 && !h.minted);
  const j = attach(room, null, () => 'JOINTOKEN'); ok('no token seats the joiner (1) with a token minted for it', j.ok && j.seat === 1 && j.minted && j.token === 'JOINTOKEN' && room.tokens[1] === 'JOINTOKEN');
  ok('a third phone without a token is refused: full', attach(room, null, () => 'X').ok === false && attach(room, null, () => 'X').why === 'full');
  ok('a wrong token is refused', attach(room, 'WRONG').ok === false && attach(room, 'WRONG').why === 'token');
  ok('the joiner’s own token seats it again (a reconnect)', attach(room, 'JOINTOKEN').ok && attach(room, 'JOINTOKEN').seat === 1);
  let r = onFrame(room, 1, { t: 'hello', since: 0 }, 1001);
  ok('hello before the deal: no spec, no moves, synced with have 0 and dealt false', r.out.length === 1 && r.out[0].to === 1 && r.out[0].frame.t === 'synced' && r.out[0].frame.have === 0 && r.out[0].frame.dealt === false);
  r = onFrame(room, 1, { t: 'move', n: 0, move: { t: 'keep' } }, 1002); ok('a move before the deal is refused: nospec', r.out[0].frame.t === 'err' && r.out[0].frame.why === 'nospec' && room.moves.length === 0);
  r = onFrame(room, 1, { t: 'deck', deck: { leader: 1, cards: [] } }, 1003); ok('a deck is forwarded to the other seat and not kept', r.out.length === 1 && r.out[0].to === 0 && r.out[0].frame.t === 'deck' && r.out[0].frame.seat === 1 && !('deck' in room));
  const spec = { v: 1, seed: 42, first: 1, decks: [{ leader: 1, cards: [] }, { leader: 2, cards: [] }] };
  r = onFrame(room, 1, { t: 'spec', spec }, 1004); ok('a deal from the joiner is refused: host', r.out[0].frame.why === 'host' && room.spec === null);
  r = onFrame(room, 0, { t: 'spec', spec: { decks: [1] } }, 1004); ok('a deal of the wrong shape is refused', r.out[0].frame.why === 'shape' && room.spec === null);
  r = onFrame(room, 0, { t: 'spec', spec }, 1005); ok('the host’s deal is kept and sent to the joiner', room.spec === spec && r.out.length === 1 && r.out[0].to === 1 && r.out[0].frame.t === 'spec' && r.keep);
  r = onFrame(room, 0, { t: 'spec', spec }, 1006); ok('a second deal is refused: dealt', r.out[0].frame.why === 'dealt');
  r = onFrame(room, 1, { t: 'move', n: 0, seat: 0, move: { t: 'keep' } }, 1007);
  ok('the first move is numbered 0, stamped with the SOCKET’s seat (not the frame’s), kept and echoed to both', room.moves.length === 1 && room.moves[0].n === 0 && room.moves[0].seat === 1 && r.out.length === 2 && r.out.map(o => o.to).join() === '0,1' && r.out.every(o => o.frame === room.moves[0]));
  r = onFrame(room, 0, { t: 'move', n: 0, move: { t: 'keep' } }, 1008); ok('a move numbered behind the log is refused: behind, with have', r.out[0].frame.why === 'behind' && r.out[0].frame.have === 1 && room.moves.length === 1);
  r = onFrame(room, 0, { t: 'move', n: 5, move: { t: 'keep' } }, 1008); ok('a move numbered ahead of the log is refused the same way', r.out[0].frame.why === 'behind' && room.moves.length === 1);
  r = onFrame(room, 0, { t: 'move', n: 1, move: 'keep' }, 1009); ok('a move that is not an object with a t is refused: shape', r.out[0].frame.why === 'shape' && room.moves.length === 1);
  onFrame(room, 0, { t: 'move', n: 1, move: { t: 'keep' } }, 1010); onFrame(room, 1, { t: 'move', n: 2, move: { t: 'end' } }, 1011);
  r = onFrame(room, 0, { t: 'hello', since: 1 }, 1012);
  ok('hello since 1 after three moves: the spec, moves 1 and 2, then synced have 3', r.out.length === 4 && r.out[0].frame.t === 'spec' && r.out[1].frame.n === 1 && r.out[2].frame.n === 2 && r.out[3].frame.t === 'synced' && r.out[3].frame.have === 3 && r.out[3].frame.dealt === true);
  r = onFrame(room, 0, { t: 'hello', since: 'x' }, 1013); ok('a hello with no honest since is read as 0', r.out.filter(o => o.frame.t === 'move').length === 3);
  r = onFrame(room, 0, { t: 'nonsense' }, 1014); ok('an unknown frame is refused: unknown', r.out[0].frame.why === 'unknown');
  r = onFrame(room, 0, null, 1014); ok('a frame that is not an object is refused: shape', r.out[0].frame.why === 'shape');
  r = onFrame(room, 1, { t: 'bye' }, 1015); ok('bye tells the other seat the peer left', r.out[0].to === 0 && r.out[0].frame.t === 'peer' && r.out[0].frame.on === false && r.out[0].frame.bye === true);
  ok('the room’s last frame time moves with each kept frame', room.last === 1015);
  { const big = newRoom('BIGBIG', 'T', 0); big.spec = spec; for (let n = 0; n < LIMITS.moves; n++) big.moves.push({ t: 'move', n, seat: n & 1, move: { t: 'end' } });
    const x = onFrame(big, 0, { t: 'move', n: LIMITS.moves, move: { t: 'end' } }, 1); ok(`the ${LIMITS.moves}th move is refused: long`, x.out[0].frame.why === 'long' && big.moves.length === LIMITS.moves); }
  ok('a frame over the limit is refused before it is parsed: big', parse('x'.repeat(LIMITS.frame + 1)).err === 'big' && parse(Buffer.alloc(3)).err === 'big');
  ok('a frame that is not JSON is refused: json', parse('{nope').err === 'json' && parse('"a string"').err === 'shape' && parse('{"t":"hello"}').f.t === 'hello');

  /* ---- the memory adapter: the same exchange over WebSocket-shaped objects ---- */
  const mem = M.memoryRelay({ rand: seq(), now: () => 5000 });
  const made = await (await mem.fetch('http://relay/new', { method: 'POST' })).json();
  ok('POST /new on the memory relay: a code and a token', CODE.test(made.code) && made.token.length === 20);
  const frames = { a: [], b: [] }, open = (url, into) => new Promise((res, rej) => { const w = new mem.WebSocket(url); w.onopen = () => res(w); w.onerror = e => rej(e); w.onmessage = e => into.push(JSON.parse(e.data)); });
  const A = await open(`ws://relay/ws/${made.code}?t=${made.token}`, frames.a); await tick();
  ok('the host’s socket is seated 0 and told no peer yet', frames.a[0] && frames.a[0].t === 'seat' && frames.a[0].seat === 0 && frames.a[1] && frames.a[1].t === 'peer' && frames.a[1].on === false);
  const B = await open(`ws://relay/ws/${made.code}`, frames.b); await tick();
  ok('the joiner is seated 1 with a token and told the peer is on; the host hears the peer arrive', frames.b[0].t === 'seat' && frames.b[0].seat === 1 && frames.b[0].token.length === 20 && frames.b[1].on === true && frames.a[2] && frames.a[2].t === 'peer' && frames.a[2].on === true);
  let refused = null; await new Promise(res => { const w = new mem.WebSocket(`ws://relay/ws/${made.code}`); w.onerror = e => { refused = e.why; }; w.onclose = () => res(); }); ok('a third socket without a token is refused: full', refused === 'full');
  await new Promise(res => { const w = new mem.WebSocket('ws://relay/ws/ZZZZZZ'); w.onerror = e => { refused = e.why; }; w.onclose = () => res(); }); ok('a code with no room is refused', refused === 'no such room');
  frames.a.length = frames.b.length = 0; B.send(JSON.stringify({ t: 'deck', deck: spec.decks[1] })); await tick();
  ok('the joiner’s deck reaches the host', frames.a.length === 1 && frames.a[0].t === 'deck' && frames.a[0].seat === 1 && frames.b.length === 0);
  A.send(JSON.stringify({ t: 'spec', spec })); await tick(); ok('the host’s deal reaches the joiner', frames.b.length === 1 && frames.b[0].t === 'spec' && frames.b[0].spec.seed === 42);
  frames.a.length = frames.b.length = 0; A.send(JSON.stringify({ t: 'move', n: 0, move: { t: 'keep' } })); await tick();
  ok('a move is echoed to both seats, numbered 0, stamped seat 0', frames.a.length === 1 && frames.b.length === 1 && frames.a[0].n === 0 && frames.a[0].seat === 0 && frames.b[0].move.t === 'keep');
  frames.a.length = frames.b.length = 0; B.send(JSON.stringify({ t: 'move', n: 0, move: { t: 'keep' } })); await tick(); ok('the joiner’s stale number is refused: behind, have 1', frames.b[0].t === 'err' && frames.b[0].why === 'behind' && frames.b[0].have === 1 && frames.a.length === 0);
  B.send(JSON.stringify({ t: 'move', n: 1, move: { t: 'keep' } })); await tick(); ok('its next move goes through', frames.a.some(f => f.t === 'move' && f.n === 1 && f.seat === 1));
  /* a reconnect: the joiner's socket replaced by one with its token, which asks for what it missed */
  const token1 = mem.rooms.get(made.code).room.tokens[1]; let closedB = null; B.onclose = e => { closedB = e; }; frames.b.length = 0; frames.a.length = 0;
  const B2 = await open(`ws://relay/ws/${made.code}?t=${token1}`, frames.b); await tick(); ok('the old socket is closed as replaced, the new one seated 1', closedB && closedB.reason === 'replaced' && frames.b[0].seat === 1);
  frames.b.length = 0; B2.send(JSON.stringify({ t: 'hello', since: 1 })); await tick();
  ok('hello since 1 brings the spec, move 1 and synced have 2', frames.b.map(f => f.t).join() === 'spec,move,synced' && frames.b[1].n === 1 && frames.b[2].have === 2);
  B2.send('x'.repeat(LIMITS.frame + 1)); await tick(); ok('an oversized frame on the wire: err big', frames.b.at(-1).t === 'err' && frames.b.at(-1).why === 'big');
  frames.a.length = 0; B2.send(JSON.stringify({ t: 'bye' })); await tick(); ok('bye: the host hears the peer leave', frames.a.some(f => f.t === 'peer' && f.on === false) && B2.readyState === 3);
  ok('the memory relay forgets a room on expiry and refuses it after', mem.expire(made.code) === true && !mem.rooms.has(made.code) && mem.expire(made.code) === false);
  A.close();
}

/* ---- the same exchange against a real relay (wrangler dev, or --url) ---------------------------------------- */
async function againstWire(base) {
  const ws = base.replace(/^http/, 'ws'), http = base.replace(/^ws/, 'http');
  const h = await (await fetch(http + '/health')).json(); ok('wire: GET /health answers ok', h.ok === true);
  const made = await (await fetch(http + '/new', { method: 'POST' })).json(); ok('wire: POST /new, a code and a token', /^[A-HJ-NP-Z2-9]{6}$/.test(made.code) && made.token.length === 20);
  const frames = { a: [], b: [] }, open = (url, into) => new Promise((res, rej) => { const w = new WebSocket(url); w.onopen = () => res(w); w.onerror = () => rej(new Error('refused')); w.onmessage = e => { try { into.push(JSON.parse(e.data)); } catch (x) { into.push({ raw: e.data }); } }; });
  const A = await open(`${ws}/ws/${made.code}?t=${made.token}`, frames.a); await tick(150);
  ok('wire: the host is seated 0', frames.a[0] && frames.a[0].t === 'seat' && frames.a[0].seat === 0);
  const B = await open(`${ws}/ws/${made.code}`, frames.b); await tick(150);
  const tokenB = (frames.b.find(f => f.t === 'seat') || {}).token;
  ok('wire: the joiner is seated 1 with a token; the host hears the peer', frames.b[0] && frames.b[0].seat === 1 && typeof tokenB === 'string' && tokenB.length === 20 && frames.a.some(f => f.t === 'peer' && f.on === true));
  let third = 'open'; try { await open(`${ws}/ws/${made.code}`, []); } catch (e) { third = 'refused'; } ok('wire: a third socket without a token is refused', third === 'refused');
  let gone = 'open'; try { await open(`${ws}/ws/ZZZZZZ`, []); } catch (e) { gone = 'refused'; } ok('wire: a code with no room is refused', gone === 'refused');
  const spec = { v: 1, seed: 7, first: 0, decks: [{ leader: 1, cards: [] }, { leader: 2, cards: [] }] };
  frames.a.length = frames.b.length = 0; B.send(JSON.stringify({ t: 'deck', deck: spec.decks[1] })); await tick(150); ok('wire: the deck crosses to the host', frames.a.length === 1 && frames.a[0].t === 'deck');
  A.send(JSON.stringify({ t: 'spec', spec })); await tick(150); ok('wire: the deal crosses to the joiner', frames.b.length === 1 && frames.b[0].t === 'spec' && frames.b[0].spec.seed === 7);
  frames.a.length = frames.b.length = 0; A.send(JSON.stringify({ t: 'move', n: 0, move: { t: 'keep' } })); await tick(150);
  ok('wire: a move is echoed to both, numbered and stamped', frames.a.length === 1 && frames.b.length === 1 && frames.b[0].n === 0 && frames.b[0].seat === 0);
  frames.b.length = 0; B.send(JSON.stringify({ t: 'move', n: 0, move: { t: 'keep' } })); await tick(150); ok('wire: a stale number is refused with have', frames.b[0] && frames.b[0].why === 'behind' && frames.b[0].have === 1);
  B.send(JSON.stringify({ t: 'move', n: 1, move: { t: 'keep' } })); await tick(150);
  frames.a.length = 0; A.send('ping'); await tick(150); ok('wire: ping is answered pong without waking the room', frames.a.some(f => f.raw === 'pong'));
  let closedB = false; B.onclose = () => { closedB = true; }; frames.b.length = 0;
  const B2 = await open(`${ws}/ws/${made.code}?t=${tokenB}`, frames.b); await tick(200);
  ok('wire: a reconnect with the token takes the seat and the old socket is closed', frames.b[0] && frames.b[0].t === 'seat' && frames.b[0].seat === 1 && closedB);
  frames.b.length = 0; B2.send(JSON.stringify({ t: 'hello', since: 1 })); await tick(200);
  ok('wire: hello since 1 brings the spec, move 1 and synced have 2', frames.b.map(f => f.t).join() === 'spec,move,synced' && frames.b[1].n === 1 && frames.b[2].have === 2);
  B2.send('x'.repeat(16 * 1024 + 1)); await tick(150); ok('wire: an oversized frame, err big', frames.b.at(-1) && frames.b.at(-1).why === 'big');
  frames.a.length = 0; B2.send(JSON.stringify({ t: 'bye' })); await tick(250); ok('wire: bye tells the host the peer left', frames.a.some(f => f.t === 'peer' && f.on === false));
  A.close(); try { B2.close(); } catch (e) {}
}

export async function withDev(fn, cwd = HERE) {
  const port = 8700 + Math.floor(Math.random() * 200);
  const p = spawn('npx', ['wrangler', 'dev', '--port', String(port), '--ip', '127.0.0.1'], { cwd, env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = ''; p.stdout.on('data', d => { out += d; }); p.stderr.on('data', d => { out += d; });
  const t0 = Date.now(); while (!/Ready on/.test(out) && Date.now() - t0 < 90000 && p.exitCode === null) await tick(250);
  if (!/Ready on/.test(out)) { p.kill(); throw new Error('wrangler dev did not start: ' + out.slice(-400)); }
  try { return await fn(`http://127.0.0.1:${port}`); } finally { p.kill('SIGTERM'); await tick(300); try { p.kill('SIGKILL'); } catch (e) {} }
}

/* ---- the suite watched failing: four plants in the room module ---------------------------------------------- */
async function selftest() {
  const src = fs.readFileSync(path.join(HERE, 'src', 'room.js'), 'utf8');
  const PLANTS = [
    ['a relay that forwards a move whatever its number', "if (f.n !== room.moves.length) return err('behind', { have: room.moves.length });", '', /behind/],
    ['a relay that lets the joiner deal', "if (seat !== 0) return err('host');", '', /refused: host/],
    ['a relay with no frame limit', "if (text.length > LIMITS.frame) return { err: 'big' };", '', /big/],
    ['a relay that trusts the frame’s seat over the socket’s', "const m = { t: 'move', n: room.moves.length, seat, move: f.move };", "const m = { t: 'move', n: room.moves.length, seat: f.seat ?? seat, move: f.move };", /SOCKET/],
  ];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-plant-')); let all = true;
  for (const [what, from, to, names] of PLANTS) {
    if (!src.includes(from)) { console.log(`  FAIL  plant not applicable: ${what} (anchor missing)`); all = false; continue; }
    const d = path.join(dir, what.replace(/\W+/g, '-')); fs.mkdirSync(d); fs.writeFileSync(path.join(d, 'room.js'), src.replace(from, to));
    fs.writeFileSync(path.join(d, 'memory.js'), fs.readFileSync(path.join(HERE, 'src', 'memory.js'), 'utf8'));
    const p0 = pass, f0 = fail, before = failures.length; const log = console.log; console.log = () => {};
    try { await suite(pathToFileURL(path.join(d, 'room.js')).href, pathToFileURL(path.join(d, 'memory.js')).href); } catch (e) { failures.push('threw: ' + e.message); fail++; }
    console.log = log; const named = failures.slice(before).filter(n => names.test(n)); pass = p0; fail = f0; failures.length = before;
    console.log(`  ${named.length ? 'ok  ' : 'FAIL'}  planted: ${what} -- ${named.length ? 'named: ' + named[0].slice(0, 90) : 'NOT caught'}`); all = all && named.length > 0;
  }
  fs.rmSync(dir, { recursive: true, force: true }); return all;
}

const ROOM = pathToFileURL(path.join(HERE, 'src', 'room.js')).href, MEM = pathToFileURL(path.join(HERE, 'src', 'memory.js')).href;
if (argv.includes('--selftest')) { console.log('relay selftest -- the suite on a room module broken on purpose:'); const good = await selftest(); console.log(good ? '  every plant named' : '  a plant was NOT caught'); process.exit(good ? 0 : 1); }
console.log('relay -- the room module and the memory adapter');
await suite(ROOM, MEM);
const url = flag('--url');
if (url) { console.log(`relay -- against ${url}`); await againstWire(url); }
else if (argv.includes('--dev')) { console.log('relay -- against wrangler dev'); await withDev(againstWire); }
console.log(`relay: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
